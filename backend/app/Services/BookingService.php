<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Repositories\Interfaces\BookingRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    /*
    |--------------------------------------------------------------------------
    | Constants
    |--------------------------------------------------------------------------
    */

    private const DEFAULT_PER_PAGE = 15;

    private const MAX_PER_PAGE = 100;

    /**
     * Fields used when building the complete persisted state
     * during booking updates.
     */
    private const MERGE_FIELDS = [
        'property_id',
        'apartment_id',
        'unit_id',
        'customer_id',
        'tenant_id',
        'tenancy_id',
        'booking_type',
        'source',
        'booking_date',
        'start_date',
        'end_date',
        'check_in_date',
        'check_out_date',
        'rent_amount',
        'deposit_amount',
        'service_charge',
        'booking_fee',
        'discount_amount',
        'amount_paid',
        'number_of_adults',
        'number_of_children',
        'first_name',
        'last_name',
        'email',
        'phone',
        'special_requests',
        'notes',
        'payment_method',
        'payment_reference',
    ];

    /**
     * Financial fields calculated server-side.
     */
    private const FINANCIAL_FIELDS = [
        'rent_amount',
        'deposit_amount',
        'service_charge',
        'booking_fee',
        'discount_amount',
        'amount_paid',
        'total_amount',
        'balance',
        'payment_status',
    ];

    /**
     * Terminal booking statuses.
     */
    private const TERMINAL_STATUSES = [
        Booking::STATUS_CANCELLED,
        Booking::STATUS_REJECTED,
        Booking::STATUS_COMPLETED,
        Booking::STATUS_EXPIRED,
    ];

    /**
     * Bookings that cannot be deleted.
     */
    private const NON_DELETABLE_STATUSES = [
        Booking::STATUS_CONFIRMED,
        Booking::STATUS_APPROVED,
        Booking::STATUS_COMPLETED,
    ];

    /**
     * Bookings allowed to be completed/checked in.
     */
    private const COMPLETABLE_STATUSES = [
        Booking::STATUS_CONFIRMED,
        Booking::STATUS_APPROVED,
    ];

    /**
     * Bookings allowed to be rejected.
     */
    private const REJECTABLE_STATUSES = [
        Booking::STATUS_PENDING,
        Booking::STATUS_CONFIRMED,
    ];

    /**
     * Bookings allowed to be cancelled.
     */
    private const CANCELLABLE_STATUSES = [
        Booking::STATUS_PENDING,
        Booking::STATUS_CONFIRMED,
        Booking::STATUS_APPROVED,
    ];

    /**
     * Bookings allowed to be approved.
     */
    private const APPROVABLE_STATUSES = [
        Booking::STATUS_PENDING,
        Booking::STATUS_CONFIRMED,
    ];

    /*
    |--------------------------------------------------------------------------
    | Constructor
    |--------------------------------------------------------------------------
    */

    public function __construct(
        protected BookingRepositoryInterface $bookingRepository
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */

    /**
     * Get paginated bookings.
     */
    public function paginate(
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->bookingRepository->paginate(
            $this->normalizePerPage($perPage),
            $filters
        );
    }

    /**
     * Find booking by ID.
     */
    public function find(int|string $id): ?Booking
    {
        return $this->bookingRepository->find(
            $this->normalizeId($id)
        );
    }

    /**
     * Find booking or fail.
     */
    public function findOrFail(int|string $id): Booking
    {
        return $this->bookingRepository->findOrFail(
            $this->normalizeId($id)
        );
    }

    /**
     * Create a booking.
     *
     * user_id:
     * - authenticated application user
     *
     * customer_id:
     * - selected customer account
     *
     * tenant_id:
     * - selected tenant profile
     */
    public function create(array $data): Booking
    {
        return DB::transaction(function () use ($data) {
            /*
            |--------------------------------------------------------------------------
            | Authenticated booking creator
            |--------------------------------------------------------------------------
            */

            $authenticatedUser = Auth::user();

            if (!$authenticatedUser) {
                throw ValidationException::withMessages([
                    'user_id' => [
                        'An authenticated user is required to create a booking.',
                    ],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Normalize incoming data
            |--------------------------------------------------------------------------
            */

            $data = $this->prepareBookingData($data);

            /*
            |--------------------------------------------------------------------------
            | Assign authenticated booking creator
            |--------------------------------------------------------------------------
            */

            $data['user_id'] = $authenticatedUser->id;

            /*
            |--------------------------------------------------------------------------
            | Resolve authoritative customer account
            |--------------------------------------------------------------------------
            */

            $data = $this->resolveCustomerData($data);

            /*
            |--------------------------------------------------------------------------
            | Resolve tenant relationship
            |--------------------------------------------------------------------------
            */

            $data = $this->resolveTenantData($data);

            /*
            |--------------------------------------------------------------------------
            | Validate booking dates and relationships
            |--------------------------------------------------------------------------
            */

            $this->validateBookingDates($data);
            $this->validateBookingReferences($data);
            $this->validateUnitAvailability($data);

            /*
            |--------------------------------------------------------------------------
            | Calculate all financial values server-side
            |--------------------------------------------------------------------------
            */

            $financialData = $this->prepareFinancialData($data);

            $data = array_merge(
                $data,
                $financialData
            );

            /*
            |--------------------------------------------------------------------------
            | New bookings always begin as pending
            |--------------------------------------------------------------------------
            */

            $data['status'] = Booking::STATUS_PENDING;

            /*
            |--------------------------------------------------------------------------
            | Payment status is derived from financial data
            |--------------------------------------------------------------------------
            */

            $data['payment_status'] = $this->calculatePaymentStatus(
                (float) $data['total_amount'],
                (float) $data['amount_paid']
            );

            /*
            |--------------------------------------------------------------------------
            | Keep identifier generation in the Booking model
            |--------------------------------------------------------------------------
            */

            $data = $this->generateBookingIdentifiers($data);

            $booking = $this->bookingRepository->create($data);

            return $booking->fresh(
                $this->bookingRelations()
            );
        });
    }

    /**
     * Update an existing booking.
     *
     * The current booking ID is always passed to the availability
     * check as the exception ID.
     */
    public function update(
        int|string $id,
        array $data
    ): Booking {
        $bookingId = $this->normalizeId($id);

        $booking = $this->findOrFail($bookingId);

        return DB::transaction(function () use (
            $booking,
            $data,
            $bookingId
        ) {
            /*
            |--------------------------------------------------------------------------
            | Refresh booking inside transaction
            |--------------------------------------------------------------------------
            */

            $booking->refresh();

            $this->ensureBookingCanBeUpdated($booking);

            /*
            |--------------------------------------------------------------------------
            | Merge persisted values with submitted values
            |--------------------------------------------------------------------------
            */

            $mergedData = array_merge(
                $booking->only(self::MERGE_FIELDS),
                $data
            );

            /*
            |--------------------------------------------------------------------------
            | Always preserve current booking identity
            |--------------------------------------------------------------------------
            */

            $mergedData['id'] = $bookingId;

            /*
            |--------------------------------------------------------------------------
            | Normalize complete state
            |--------------------------------------------------------------------------
            */

            $mergedData = $this->prepareBookingData(
                $mergedData,
                $booking
            );

            /*
            |--------------------------------------------------------------------------
            | Resolve customer relationship
            |--------------------------------------------------------------------------
            */

            $mergedData = $this->resolveCustomerData(
                $mergedData,
                $booking
            );

            /*
            |--------------------------------------------------------------------------
            | Resolve tenant relationship
            |--------------------------------------------------------------------------
            */

            $mergedData = $this->resolveTenantData(
                $mergedData,
                $booking
            );

            /*
            |--------------------------------------------------------------------------
            | Validate complete booking state
            |--------------------------------------------------------------------------
            */

            $this->validateBookingDates($mergedData);
            $this->validateBookingReferences($mergedData);

            /*
            |--------------------------------------------------------------------------
            | IMPORTANT:
            |
            | Exclude the booking currently being edited from
            | the overlap check.
            |--------------------------------------------------------------------------
            */

            $this->validateUnitAvailability(
                $mergedData,
                $bookingId
            );

            /*
            |--------------------------------------------------------------------------
            | Recalculate financial values
            |--------------------------------------------------------------------------
            */

            $financialData = $this->prepareFinancialData(
                $mergedData,
                $booking
            );

            /*
            |--------------------------------------------------------------------------
            | Only legitimate client-editable fields are allowed
            |--------------------------------------------------------------------------
            */

            $updateData = $this->filterUpdateData($data);

            /*
            |--------------------------------------------------------------------------
            | Never allow workflow state through normal update
            |--------------------------------------------------------------------------
            */

            $this->removeWorkflowFields($updateData);

            /*
            |--------------------------------------------------------------------------
            | Never trust client-calculated financial fields
            |--------------------------------------------------------------------------
            */

            unset(
                $updateData['total_amount'],
                $updateData['balance'],
                $updateData['payment_status']
            );

            /*
            |--------------------------------------------------------------------------
            | Apply server-calculated financial values
            |--------------------------------------------------------------------------
            */

            foreach (self::FINANCIAL_FIELDS as $field) {
                if (array_key_exists($field, $financialData)) {
                    $updateData[$field] = $financialData[$field];
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Customer relationship and snapshot are authoritative
            |--------------------------------------------------------------------------
            */

            foreach ([
                'customer_id',
                'first_name',
                'last_name',
                'email',
                'phone',
            ] as $field) {
                if (array_key_exists($field, $mergedData)) {
                    $updateData[$field] = $mergedData[$field];
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Tenant relationship is authoritative
            |--------------------------------------------------------------------------
            */

            if (array_key_exists('tenant_id', $mergedData)) {
                $updateData['tenant_id'] = $mergedData['tenant_id'];
            }

            /*
            |--------------------------------------------------------------------------
            | Preserve validated booking state
            |--------------------------------------------------------------------------
            */

            foreach ([
                'property_id',
                'apartment_id',
                'unit_id',
                'tenancy_id',
                'booking_type',
                'source',
                'start_date',
                'end_date',
                'check_in_date',
                'check_out_date',
                'booking_date',
                'number_of_adults',
                'number_of_children',
                'special_requests',
                'notes',
                'payment_method',
                'payment_reference',
            ] as $field) {
                if (array_key_exists($field, $mergedData)) {
                    $updateData[$field] = $mergedData[$field];
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Booking creator and identifiers cannot be changed
            |--------------------------------------------------------------------------
            */

            unset(
                $updateData['id'],
                $updateData['user_id'],
                $updateData['booking_number'],
                $updateData['reference'],
                $updateData['slug']
            );

            /*
            |--------------------------------------------------------------------------
            | Never permit workflow changes through update()
            |--------------------------------------------------------------------------
            */

            $this->removeWorkflowFields($updateData);

            /*
            |--------------------------------------------------------------------------
            | Persist only after every validation succeeds
            |--------------------------------------------------------------------------
            */

            $updatedBooking = $this->bookingRepository->update(
                $booking,
                $updateData
            );

            return $updatedBooking->fresh(
                $this->bookingRelations()
            );
        });
    }

    /**
     * Soft delete booking.
     */
    public function delete(int|string $id): bool
    {
        $booking = $this->findOrFail($id);

        if (
            in_array(
                $booking->status,
                self::NON_DELETABLE_STATUSES,
                true
            )
        ) {
            throw ValidationException::withMessages([
                'status' => [
                    'Confirmed, approved, or completed bookings cannot be deleted.',
                ],
            ]);
        }

        return $this->bookingRepository->delete($booking);
    }

    /**
     * Restore a soft-deleted booking.
     */
    public function restore(int|string $id): Booking
    {
        $booking = $this->findOrFail($id);

        $this->bookingRepository->restore($booking);

        return $booking->fresh(
            $this->bookingRelations()
        );
    }

    /**
     * Permanently delete a booking.
     */
    public function forceDelete(int|string $id): bool
    {
        $booking = $this->findOrFail($id);

        return $this->bookingRepository->forceDelete($booking);
    }

    /*
    |--------------------------------------------------------------------------
    | FINDERS
    |--------------------------------------------------------------------------
    */

    public function findByBookingNumber(
        string $bookingNumber
    ): ?Booking {
        return $this->bookingRepository->findByBookingNumber(
            trim($bookingNumber)
        );
    }

    public function findByReference(
        string $reference
    ): ?Booking {
        return $this->bookingRepository->findByReference(
            trim($reference)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    public function search(
        string $query,
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->bookingRepository->search(
            trim($query),
            $this->normalizePerPage($perPage),
            $filters
        );
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    public function getByStatus(
        string $status,
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        $status = strtolower(trim($status));

        $this->validateStatus($status);

        return $this->bookingRepository->getByStatus(
            $status,
            $this->normalizePerPage($perPage),
            $filters
        );
    }

    public function getByPaymentStatus(
        string $paymentStatus,
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        $paymentStatus = strtolower(trim($paymentStatus));

        $this->validatePaymentStatus($paymentStatus);

        return $this->bookingRepository->getByPaymentStatus(
            $paymentStatus,
            $this->normalizePerPage($perPage)
        );
    }

    public function getPending(
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getPending(
            $this->normalizePerPage($perPage)
        );
    }

    public function getConfirmed(
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getConfirmed(
            $this->normalizePerPage($perPage)
        );
    }

    public function getActive(
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->bookingRepository->getActive(
            $this->normalizePerPage($perPage),
            $filters
        );
    }

    public function getCompleted(
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getCompleted(
            $this->normalizePerPage($perPage)
        );
    }

    public function getCancelled(
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getCancelled(
            $this->normalizePerPage($perPage)
        );
    }

    public function getExpired(
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getExpired(
            $this->normalizePerPage($perPage)
        );
    }

    public function getEndedBookings(): Collection
    {
        return $this->bookingRepository->getEndedBookings();
    }

    /*
    |--------------------------------------------------------------------------
    | BOOKING WORKFLOW
    |--------------------------------------------------------------------------
    */

    public function confirm(int|string $id): Booking
    {
        $booking = $this->findOrFail($id);

        return DB::transaction(function () use ($booking) {
            if ($booking->status !== Booking::STATUS_PENDING) {
                throw ValidationException::withMessages([
                    'status' => [
                        'Only pending bookings can be confirmed.',
                    ],
                ]);
            }

            $this->validateUnitAvailabilityForBooking($booking);

            return $this->bookingRepository->update(
                $booking,
                [
                    'status' => Booking::STATUS_CONFIRMED,
                    'confirmed_at' => now(),
                ]
            )->fresh(
                $this->bookingRelations()
            );
        });
    }

    public function approve(int|string $id): Booking
    {
        $booking = $this->findOrFail($id);

        return DB::transaction(function () use ($booking) {
            $this->ensureStatusAllowed(
                $booking,
                self::APPROVABLE_STATUSES,
                'This booking cannot be approved from its current status.'
            );

            $this->validateUnitAvailabilityForBooking($booking);

            return $this->bookingRepository->update(
                $booking,
                [
                    'status' => Booking::STATUS_APPROVED,
                    'approved_at' => now(),
                ]
            )->fresh(
                $this->bookingRelations()
            );
        });
    }

    public function checkIn(int|string $id): Booking
    {
        $booking = $this->findOrFail($id);

        $this->ensureStatusAllowed(
            $booking,
            self::COMPLETABLE_STATUSES,
            'Only confirmed or approved bookings can be checked in.'
        );

        if ($booking->check_in_date) {
            throw ValidationException::withMessages([
                'check_in_date' => [
                    'This booking has already been checked in.',
                ],
            ]);
        }

        if (
            $booking->start_date &&
            now()->toDateString() < $booking->start_date->toDateString()
        ) {
            throw ValidationException::withMessages([
                'check_in_date' => [
                    'This booking cannot be checked in before its start date.',
                ],
            ]);
        }

        if (
            $booking->end_date &&
            now()->toDateString() > $booking->end_date->toDateString()
        ) {
            throw ValidationException::withMessages([
                'check_in_date' => [
                    'This booking has already ended.',
                ],
            ]);
        }

        return DB::transaction(function () use ($booking) {
            return $this->bookingRepository->update(
                $booking,
                [
                    'check_in_date' => now()->toDateString(),
                ]
            )->fresh(
                $this->bookingRelations()
            );
        });
    }

    public function reject(
        int|string $id,
        ?string $reason = null
    ): Booking {
        $booking = $this->findOrFail($id);

        $this->ensureStatusAllowed(
            $booking,
            self::REJECTABLE_STATUSES,
            'This booking cannot be rejected from its current status.'
        );

        $reason = $this->normalizeReason($reason);

        if (!$reason) {
            throw ValidationException::withMessages([
                'rejection_reason' => [
                    'A rejection reason is required.',
                ],
            ]);
        }

        return DB::transaction(function () use ($booking, $reason) {
            return $this->bookingRepository->update(
                $booking,
                [
                    'status' => Booking::STATUS_REJECTED,
                    'rejected_at' => now(),
                    'rejection_reason' => $reason,
                ]
            )->fresh(
                $this->bookingRelations()
            );
        });
    }

    public function cancel(
        int|string $id,
        array $data = []
    ): Booking {
        $booking = $this->findOrFail($id);

        $this->ensureStatusAllowed(
            $booking,
            self::CANCELLABLE_STATUSES,
            'This booking cannot be cancelled from its current status.'
        );

        $reason = $this->normalizeReason(
            $data['cancellation_reason'] ?? null
        );

        if (!$reason) {
            throw ValidationException::withMessages([
                'cancellation_reason' => [
                    'A cancellation reason is required.',
                ],
            ]);
        }

        return DB::transaction(function () use (
            $booking,
            $reason,
            $data
        ) {
            return $this->bookingRepository->update(
                $booking,
                [
                    'status' => Booking::STATUS_CANCELLED,
                    'cancelled_at' => now(),
                    'cancellation_reason' => $reason,
                    'payment_reference' => $data['payment_reference']
                        ?? $booking->payment_reference,
                ]
            )->fresh(
                $this->bookingRelations()
            );
        });
    }

    public function complete(int|string $id): Booking
    {
        $booking = $this->findOrFail($id);

        $this->ensureStatusAllowed(
            $booking,
            self::COMPLETABLE_STATUSES,
            'Only confirmed or approved bookings can be completed.'
        );

        return DB::transaction(function () use ($booking) {
            return $this->bookingRepository->update(
                $booking,
                [
                    'status' => Booking::STATUS_COMPLETED,
                    'completed_at' => now(),
                    'check_out_date' => $booking->check_out_date
                        ?? now()->toDateString(),
                ]
            )->fresh(
                $this->bookingRelations()
            );
        });
    }

    public function expire(int|string $id): Booking
    {
        $booking = $this->findOrFail($id);

        if (!$booking->end_date) {
            throw ValidationException::withMessages([
                'end_date' => [
                    'This booking does not have an end date.',
                ],
            ]);
        }

        if (
            $booking->end_date->toDateString() >=
            now()->toDateString()
        ) {
            throw ValidationException::withMessages([
                'end_date' => [
                    'Only bookings whose end date has passed can be expired.',
                ],
            ]);
        }

        if (
            in_array(
                $booking->status,
                self::TERMINAL_STATUSES,
                true
            )
        ) {
            throw ValidationException::withMessages([
                'status' => [
                    'This booking cannot be expired from its current status.',
                ],
            ]);
        }

        return DB::transaction(function () use ($booking) {
            return $this->bookingRepository->update(
                $booking,
                [
                    'status' => Booking::STATUS_EXPIRED,
                ]
            )->fresh(
                $this->bookingRelations()
            );
        });
    }

    public function expireEndedBookings(): int
    {
        $bookings = $this->bookingRepository->getEndedBookings();

        $count = 0;

        DB::transaction(function () use (
            $bookings,
            &$count
        ) {
            foreach ($bookings as $booking) {
                if (
                    in_array(
                        $booking->status,
                        self::TERMINAL_STATUSES,
                        true
                    )
                ) {
                    continue;
                }

                if (!$booking->end_date) {
                    continue;
                }

                if (
                    $booking->end_date->toDateString() >=
                    now()->toDateString()
                ) {
                    continue;
                }

                $this->bookingRepository->update(
                    $booking,
                    [
                        'status' => Booking::STATUS_EXPIRED,
                    ]
                );

                $count++;
            }
        });

        return $count;
    }

    /*
    |--------------------------------------------------------------------------
    | UNIT / CUSTOMER / TENANT
    |--------------------------------------------------------------------------
    */

    public function getByUnit(
        int $unitId,
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getByUnit(
            $unitId,
            $this->normalizePerPage($perPage)
        );
    }

    public function getByCustomer(
        int $customerId,
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getByCustomer(
            $customerId,
            $this->normalizePerPage($perPage)
        );
    }

    public function getByTenant(
        int $tenantId,
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getByTenant(
            $tenantId,
            $this->normalizePerPage($perPage)
        );
    }

    public function getByProperty(
        int $propertyId,
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getByProperty(
            $propertyId,
            $this->normalizePerPage($perPage)
        );
    }

    public function getByApartment(
        int $apartmentId,
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getByApartment(
            $apartmentId,
            $this->normalizePerPage($perPage)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABILITY
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether a unit has an overlapping active booking.
     *
     * $exceptBookingId is used during editing so that the booking
     * currently being edited does not conflict with itself.
     */
    public function hasOverlappingBooking(
        int $unitId,
        string $startDate,
        string $endDate,
        ?int $exceptBookingId = null
    ): bool {
        $this->validateDateRange(
            $startDate,
            $endDate
        );

        return $this->bookingRepository->hasOverlappingBooking(
            (int) $unitId,
            $startDate,
            $endDate,
            $exceptBookingId !== null
                ? $this->normalizeId($exceptBookingId)
                : null
        );
    }

    /**
     * Get units available for the requested booking period.
     */
    public function getAvailableUnits(
        string $startDate,
        string $endDate,
        ?int $propertyId = null,
        ?int $apartmentId = null,
        ?int $exceptBookingId = null
    ): Collection {
        $this->validateDateRange(
            $startDate,
            $endDate
        );

        return $this->bookingRepository->getAvailableUnits(
            $startDate,
            $endDate,
            $propertyId,
            $apartmentId,
            $exceptBookingId !== null
                ? $this->normalizeId($exceptBookingId)
                : null
        );
    }

    public function getAvailableUsers(
        ?string $search = null
    ): Collection {
        return $this->bookingRepository->getAvailableUsers(
            $search ? trim($search) : null
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DATE RANGE
    |--------------------------------------------------------------------------
    */

    public function getByDateRange(
        string $startDate,
        string $endDate,
        array $filters = []
    ): Collection {
        $this->validateDateRange(
            $startDate,
            $endDate
        );

        return $this->bookingRepository->getByDateRange(
            $startDate,
            $endDate,
            $filters
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENT MANAGEMENT
    |--------------------------------------------------------------------------
    */

    public function markAsPaid(
        int|string $id,
        ?float $amount = null
    ): Booking {
        $booking = $this->findOrFail($id);

        $totalAmount = $this->calculateBookingTotal($booking);

        $amountPaid = $amount !== null
            ? round($amount, 2)
            : $totalAmount;

        if (
            $amountPaid <= 0 &&
            $totalAmount > 0
        ) {
            throw ValidationException::withMessages([
                'amount_paid' => [
                    'Payment amount must be greater than zero.',
                ],
            ]);
        }

        $this->ensurePaymentDoesNotExceedTotal(
            $amountPaid,
            $totalAmount
        );

        $balance = max(
            $totalAmount - $amountPaid,
            0
        );

        return DB::transaction(function () use (
            $booking,
            $amountPaid,
            $balance
        ) {
            return $this->bookingRepository->update(
                $booking,
                [
                    'amount_paid' => $amountPaid,
                    'balance' => $balance,
                    'payment_status' => Booking::PAYMENT_PAID,
                    'paid_at' => now(),
                ]
            )->fresh(
                $this->bookingRelations()
            );
        });
    }

    public function recordPartialPayment(
        int|string $id,
        float $amount
    ): Booking {
        $booking = $this->findOrFail($id);

        $amount = round($amount, 2);

        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => [
                    'Payment amount must be greater than zero.',
                ],
            ]);
        }

        $totalAmount = $this->calculateBookingTotal($booking);

        $currentPaid = (float) (
            $booking->amount_paid ?? 0
        );

        $newAmountPaid = round(
            $currentPaid + $amount,
            2
        );

        $this->ensurePaymentDoesNotExceedTotal(
            $newAmountPaid,
            $totalAmount
        );

        $balance = max(
            $totalAmount - $newAmountPaid,
            0
        );

        $paymentStatus = $this->calculatePaymentStatus(
            $totalAmount,
            $newAmountPaid
        );

        return DB::transaction(function () use (
            $booking,
            $newAmountPaid,
            $balance,
            $paymentStatus
        ) {
            return $this->bookingRepository->update(
                $booking,
                [
                    'amount_paid' => $newAmountPaid,
                    'balance' => $balance,
                    'payment_status' => $paymentStatus,
                    'paid_at' => $paymentStatus === Booking::PAYMENT_PAID
                        ? now()
                        : $booking->paid_at,
                ]
            )->fresh(
                $this->bookingRelations()
            );
        });
    }

    public function refund(int|string $id): Booking
    {
        $booking = $this->findOrFail($id);

        if (
            !in_array(
                $booking->payment_status,
                [
                    Booking::PAYMENT_PAID,
                    Booking::PAYMENT_PARTIAL,
                ],
                true
            )
        ) {
            throw ValidationException::withMessages([
                'payment_status' => [
                    'Only paid or partially paid bookings can be refunded.',
                ],
            ]);
        }

        return DB::transaction(function () use ($booking) {
            return $this->bookingRepository->update(
                $booking,
                [
                    'payment_status' => Booking::PAYMENT_REFUNDED,
                ]
            )->fresh(
                $this->bookingRelations()
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    public function getStatistics(
        array $filters = []
    ): array {
        return $this->bookingRepository->getStatistics(
            $filters
        );
    }

    public function getReport(
        array $filters = []
    ): array {
        return $this->bookingRepository->getReport(
            $filters
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DATA PREPARATION
    |--------------------------------------------------------------------------
    */

    /**
     * Normalize booking data before validation/persistence.
     *
     * IMPORTANT:
     *
     * Relationship IDs and guest counts are intentionally handled
     * separately.
     *
     * number_of_children may legitimately be 0.
     */
    protected function prepareBookingData(
        array $data,
        ?Booking $booking = null
    ): array {
        /*
        |--------------------------------------------------------------------------
        | Normalize string fields
        |--------------------------------------------------------------------------
        */

        $stringFields = [
            'reference',
            'first_name',
            'last_name',
            'email',
            'phone',
            'special_requests',
            'notes',
            'payment_method',
            'payment_reference',
            'meta_title',
            'meta_description',
        ];

        foreach ($stringFields as $field) {
            if (
                array_key_exists($field, $data) &&
                is_string($data[$field])
            ) {
                $data[$field] = trim($data[$field]);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize email
        |--------------------------------------------------------------------------
        */

        if (
            isset($data['email']) &&
            $data['email'] !== ''
        ) {
            $data['email'] = strtolower(
                $data['email']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize relationship IDs
        |--------------------------------------------------------------------------
        |
        | These fields must be positive database IDs.
        |--------------------------------------------------------------------------
        */

        foreach ([
            'property_id',
            'apartment_id',
            'unit_id',
            'customer_id',
            'tenant_id',
            'tenancy_id',
        ] as $field) {
            if (
                array_key_exists($field, $data) &&
                $data[$field] !== null &&
                $data[$field] !== ''
            ) {
                if (
                    !is_numeric($data[$field]) ||
                    (int) $data[$field] < 1
                ) {
                    throw ValidationException::withMessages([
                        $field => [
                            'The selected value must be a valid ID.',
                        ],
                    ]);
                }

                $data[$field] = (int) $data[$field];
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize number of adults
        |--------------------------------------------------------------------------
        |
        | Adults must be at least 1.
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists('number_of_adults', $data) &&
            $data['number_of_adults'] !== null &&
            $data['number_of_adults'] !== ''
        ) {
            if (
                !is_numeric($data['number_of_adults']) ||
                (int) $data['number_of_adults'] < 1
            ) {
                throw ValidationException::withMessages([
                    'number_of_adults' => [
                        'Number of adults must be at least 1.',
                    ],
                ]);
            }

            $data['number_of_adults'] = (int) $data['number_of_adults'];
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize number of children
        |--------------------------------------------------------------------------
        |
        | ZERO IS VALID.
        |
        | This is a count, not a relationship ID.
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists('number_of_children', $data) &&
            $data['number_of_children'] !== null &&
            $data['number_of_children'] !== ''
        ) {
            if (
                !is_numeric($data['number_of_children']) ||
                (int) $data['number_of_children'] < 0
            ) {
                throw ValidationException::withMessages([
                    'number_of_children' => [
                        'Number of children must be a valid whole number.',
                    ],
                ]);
            }

            $data['number_of_children'] = (int) $data['number_of_children'];
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize monetary fields
        |--------------------------------------------------------------------------
        */

        foreach ([
            'rent_amount',
            'deposit_amount',
            'service_charge',
            'booking_fee',
            'discount_amount',
            'amount_paid',
        ] as $field) {
            if (
                array_key_exists($field, $data) &&
                $data[$field] !== null &&
                is_numeric($data[$field])
            ) {
                $data[$field] = round(
                    (float) $data[$field],
                    2
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Financial values are always calculated by the service.
        |--------------------------------------------------------------------------
        */

        unset(
            $data['total_amount'],
            $data['balance'],
            $data['payment_status']
        );

        /*
        |--------------------------------------------------------------------------
        | Normalize booking type
        |--------------------------------------------------------------------------
        */

        if (
            isset($data['booking_type']) &&
            is_string($data['booking_type'])
        ) {
            $data['booking_type'] = strtolower(
                trim($data['booking_type'])
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize source
        |--------------------------------------------------------------------------
        */

        if (
            isset($data['source']) &&
            is_string($data['source'])
        ) {
            $data['source'] = strtolower(
                trim($data['source'])
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Normal create/update requests cannot control workflow state.
        |--------------------------------------------------------------------------
        */

        $this->removeWorkflowFields($data);

        return $data;
    }

    /**
     * Resolve authoritative customer relationship and snapshot.
     */
    protected function resolveCustomerData(
        array $data,
        ?Booking $booking = null
    ): array {
        $customerId = array_key_exists(
            'customer_id',
            $data
        )
            ? $data['customer_id']
            : $booking?->customer_id;

        /*
        |--------------------------------------------------------------------------
        | No registered customer.
        |
        | Valid for guest/walk-in bookings.
        |--------------------------------------------------------------------------
        */

        if (
            $customerId === null ||
            $customerId === ''
        ) {
            $data['customer_id'] = null;

            return $data;
        }

        $customer = User::query()->find(
            (int) $customerId
        );

        if (!$customer) {
            throw ValidationException::withMessages([
                'customer_id' => [
                    'The selected customer does not exist.',
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Users record is authoritative.
        |--------------------------------------------------------------------------
        */

        $data['customer_id'] = $customer->id;

        /*
        |--------------------------------------------------------------------------
        | Synchronize customer snapshot.
        |--------------------------------------------------------------------------
        */

        $data['first_name'] = $customer->first_name
            ?? '';

        $data['last_name'] = $customer->last_name
            ?? '';

        /*
        |--------------------------------------------------------------------------
        | Fall back to name when first/last names are not populated.
        |--------------------------------------------------------------------------
        */

        if (
            $data['first_name'] === '' &&
            !empty($customer->name)
        ) {
            $nameParts = preg_split(
                '/\s+/',
                trim($customer->name),
                2
            );

            $data['first_name'] = $nameParts[0] ?? '';

            if (
                $data['last_name'] === '' &&
                isset($nameParts[1])
            ) {
                $data['last_name'] = $nameParts[1];
            }
        }

        $data['email'] = $customer->email
            ? strtolower(trim($customer->email))
            : null;

        $data['phone'] = $customer->phone
            ? trim($customer->phone)
            : null;

        return $data;
    }

    /**
     * Resolve tenant relationship.
     */
    protected function resolveTenantData(
        array $data,
        ?Booking $booking = null
    ): array {
        $tenantId = array_key_exists(
            'tenant_id',
            $data
        )
            ? $data['tenant_id']
            : $booking?->tenant_id;

        /*
        |--------------------------------------------------------------------------
        | No tenant selected.
        |--------------------------------------------------------------------------
        */

        if (
            $tenantId === null ||
            $tenantId === ''
        ) {
            $data['tenant_id'] = null;

            return $data;
        }

        $tenant = Tenant::query()
            ->with('user')
            ->find((int) $tenantId);

        if (!$tenant) {
            throw ValidationException::withMessages([
                'tenant_id' => [
                    'The selected tenant does not exist.',
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Customer and tenant must represent the same user.
        |--------------------------------------------------------------------------
        */

        if (
            !empty($data['customer_id']) &&
            $tenant->user_id &&
            (int) $tenant->user_id !==
                (int) $data['customer_id']
        ) {
            throw ValidationException::withMessages([
                'tenant_id' => [
                    'The selected tenant does not belong to the selected customer.',
                ],
            ]);
        }

        $data['tenant_id'] = $tenant->id;

        /*
        |--------------------------------------------------------------------------
        | If tenant is selected without customer, use linked user.
        |--------------------------------------------------------------------------
        */

        if (
            empty($data['customer_id']) &&
            $tenant->user_id
        ) {
            $data = $this->resolveCustomerData([
                ...$data,
                'customer_id' => $tenant->user_id,
            ]);
        }

        return $data;
    }

    /**
     * Keep identifier generation inside the Booking model.
     */
    protected function generateBookingIdentifiers(
        array $data
    ): array {
        return $data;
    }

    /**
     * Prepare financial data.
     */
    protected function prepareFinancialData(
        array $data,
        ?Booking $booking = null
    ): array {
        $rent = $this->moneyValue(
            $data,
            'rent_amount',
            $booking?->rent_amount
        );

        $deposit = $this->moneyValue(
            $data,
            'deposit_amount',
            $booking?->deposit_amount
        );

        $serviceCharge = $this->moneyValue(
            $data,
            'service_charge',
            $booking?->service_charge
        );

        $bookingFee = $this->moneyValue(
            $data,
            'booking_fee',
            $booking?->booking_fee
        );

        $discount = $this->moneyValue(
            $data,
            'discount_amount',
            $booking?->discount_amount
        );

        $amountPaid = $this->moneyValue(
            $data,
            'amount_paid',
            $booking?->amount_paid
        );

        $charges =
            $rent +
            $deposit +
            $serviceCharge +
            $bookingFee;

        if ($discount > $charges) {
            throw ValidationException::withMessages([
                'discount_amount' => [
                    'The discount cannot exceed the booking charges.',
                ],
            ]);
        }

        $totalAmount = max(
            $charges - $discount,
            0
        );

        $this->ensurePaymentDoesNotExceedTotal(
            $amountPaid,
            $totalAmount
        );

        $balance = max(
            $totalAmount - $amountPaid,
            0
        );

        return [
            'rent_amount' => round($rent, 2),
            'deposit_amount' => round($deposit, 2),
            'service_charge' => round($serviceCharge, 2),
            'booking_fee' => round($bookingFee, 2),
            'discount_amount' => round($discount, 2),
            'total_amount' => round($totalAmount, 2),
            'amount_paid' => round($amountPaid, 2),
            'balance' => round($balance, 2),
            'payment_status' => $this->calculatePaymentStatus(
                $totalAmount,
                $amountPaid
            ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | FINANCIAL HELPERS
    |--------------------------------------------------------------------------
    */

    protected function calculatePaymentStatus(
        float $totalAmount,
        float $amountPaid
    ): string {
        $totalAmount = round($totalAmount, 2);

        $amountPaid = round($amountPaid, 2);

        if ($amountPaid <= 0) {
            return Booking::PAYMENT_PENDING;
        }

        if (
            $totalAmount <= 0 ||
            $amountPaid >= $totalAmount
        ) {
            return Booking::PAYMENT_PAID;
        }

        return Booking::PAYMENT_PARTIAL;
    }

    protected function calculateBookingTotal(
        Booking $booking
    ): float {
        return round(
            max(
                (float) ($booking->rent_amount ?? 0)
                + (float) ($booking->deposit_amount ?? 0)
                + (float) ($booking->service_charge ?? 0)
                + (float) ($booking->booking_fee ?? 0)
                - (float) ($booking->discount_amount ?? 0),
                0
            ),
            2
        );
    }

    protected function moneyValue(
        array $data,
        string $field,
        mixed $fallback = null
    ): float {
        $value = array_key_exists(
            $field,
            $data
        )
            ? $data[$field]
            : $fallback;

        $value = $value ?? 0;

        if (!is_numeric($value)) {
            throw ValidationException::withMessages([
                $field => [
                    'The value must be a valid monetary amount.',
                ],
            ]);
        }

        $value = round(
            (float) $value,
            2
        );

        if ($value < 0) {
            throw ValidationException::withMessages([
                $field => [
                    'The amount cannot be negative.',
                ],
            ]);
        }

        return $value;
    }

    protected function ensurePaymentDoesNotExceedTotal(
        float $amountPaid,
        float $totalAmount
    ): void {
        if ($amountPaid < 0) {
            throw ValidationException::withMessages([
                'amount_paid' => [
                    'Amount paid cannot be negative.',
                ],
            ]);
        }

        if (
            $totalAmount > 0 &&
            $amountPaid > $totalAmount
        ) {
            throw ValidationException::withMessages([
                'amount_paid' => [
                    'Amount paid cannot exceed the booking total.',
                ],
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    protected function validateBookingDates(
        array $data
    ): void {
        $startDate = $data['start_date'] ?? null;
        $endDate = $data['end_date'] ?? null;

        if ($startDate && $endDate) {
            $this->validateDateRange(
                (string) $startDate,
                (string) $endDate
            );
        }

        $checkIn = $data['check_in_date'] ?? null;
        $checkOut = $data['check_out_date'] ?? null;

        if (
            $checkIn &&
            $checkOut &&
            (string) $checkIn > (string) $checkOut
        ) {
            throw ValidationException::withMessages([
                'check_out_date' => [
                    'The check-out date must be after or equal to the check-in date.',
                ],
            ]);
        }

        if (
            $startDate &&
            $checkIn &&
            (string) $checkIn < (string) $startDate
        ) {
            throw ValidationException::withMessages([
                'check_in_date' => [
                    'The check-in date cannot be before the booking start date.',
                ],
            ]);
        }

        if (
            $endDate &&
            $checkOut &&
            (string) $checkOut > (string) $endDate
        ) {
            throw ValidationException::withMessages([
                'check_out_date' => [
                    'The check-out date cannot be after the booking end date.',
                ],
            ]);
        }

        if (
            $startDate &&
            $endDate &&
            $checkIn &&
            (
                (string) $checkIn < (string) $startDate ||
                (string) $checkIn > (string) $endDate
            )
        ) {
            throw ValidationException::withMessages([
                'check_in_date' => [
                    'The check-in date must fall within the booking period.',
                ],
            ]);
        }

        if (
            $startDate &&
            $endDate &&
            $checkOut &&
            (
                (string) $checkOut < (string) $startDate ||
                (string) $checkOut > (string) $endDate
            )
        ) {
            throw ValidationException::withMessages([
                'check_out_date' => [
                    'The check-out date must fall within the booking period.',
                ],
            ]);
        }
    }

    protected function validateDateRange(
        string $startDate,
        string $endDate
    ): void {
        $startDate = trim($startDate);
        $endDate = trim($endDate);

        if (
            $startDate === '' ||
            $endDate === ''
        ) {
            throw ValidationException::withMessages([
                'date_range' => [
                    'Both start date and end date are required.',
                ],
            ]);
        }

        if ($startDate > $endDate) {
            throw ValidationException::withMessages([
                'end_date' => [
                    'The end date must be after or equal to the start date.',
                ],
            ]);
        }
    }

    protected function validateBookingReferences(
        array $data
    ): void {
        $unitId = $data['unit_id'] ?? null;
        $propertyId = $data['property_id'] ?? null;
        $apartmentId = $data['apartment_id'] ?? null;

        if (!$unitId) {
            return;
        }

        $unit = Unit::query()
            ->with([
                'apartment.property',
            ])
            ->find((int) $unitId);

        if (!$unit) {
            throw ValidationException::withMessages([
                'unit_id' => [
                    'The selected unit does not exist.',
                ],
            ]);
        }

        $resolvedApartmentId = $unit->apartment_id
            ?? $unit->apartment?->id;

        $resolvedPropertyId = $unit->apartment?->property_id
            ?? $unit->apartment?->property?->id;

        if (
            $apartmentId &&
            $resolvedApartmentId &&
            (int) $resolvedApartmentId !==
                (int) $apartmentId
        ) {
            throw ValidationException::withMessages([
                'unit_id' => [
                    'The selected unit does not belong to the selected apartment.',
                ],
            ]);
        }

        if (
            $propertyId &&
            $resolvedPropertyId &&
            (int) $resolvedPropertyId !==
                (int) $propertyId
        ) {
            throw ValidationException::withMessages([
                'unit_id' => [
                    'The selected unit does not belong to the selected property.',
                ],
            ]);
        }

        if (
            $apartmentId &&
            !$resolvedApartmentId
        ) {
            throw ValidationException::withMessages([
                'unit_id' => [
                    'The selected unit is not associated with a valid apartment.',
                ],
            ]);
        }

        if (
            $propertyId &&
            !$resolvedPropertyId
        ) {
            throw ValidationException::withMessages([
                'unit_id' => [
                    'The selected unit is not associated with a valid property.',
                ],
            ]);
        }

        if (
            method_exists($unit, 'isMaintenance') &&
            $unit->isMaintenance()
        ) {
            throw ValidationException::withMessages([
                'unit_id' => [
                    'The selected unit is currently under maintenance.',
                ],
            ]);
        }

        if (
            isset($unit->status) &&
            strtolower((string) $unit->status) === 'maintenance'
        ) {
            throw ValidationException::withMessages([
                'unit_id' => [
                    'The selected unit is currently under maintenance.',
                ],
            ]);
        }
    }

    /**
     * Validate unit availability.
     *
     * During update, $exceptBookingId MUST contain the ID of the
     * booking currently being edited.
     */
    protected function validateUnitAvailability(
        array $data,
        ?int $exceptBookingId = null
    ): void {
        $unitId = $data['unit_id'] ?? null;
        $startDate = $data['start_date'] ?? null;
        $endDate = $data['end_date'] ?? null;

        if (
            !$unitId ||
            !$startDate ||
            !$endDate
        ) {
            return;
        }

        if ($exceptBookingId !== null) {
            $exceptBookingId = $this->normalizeId(
                $exceptBookingId
            );
        }

        $hasOverlap = $this->bookingRepository->hasOverlappingBooking(
            (int) $unitId,
            (string) $startDate,
            (string) $endDate,
            $exceptBookingId
        );

        if ($hasOverlap) {
            throw ValidationException::withMessages([
                'unit_id' => [
                    'The selected unit is already booked for the selected dates.',
                ],
            ]);
        }
    }

    /**
     * Validate availability using an existing booking.
     */
    protected function validateUnitAvailabilityForBooking(
        Booking $booking
    ): void {
        if (
            !$booking->unit_id ||
            !$booking->start_date ||
            !$booking->end_date
        ) {
            return;
        }

        $this->validateUnitAvailability(
            [
                'unit_id' => (int) $booking->unit_id,
                'start_date' => $booking->start_date,
                'end_date' => $booking->end_date,
            ],
            (int) $booking->id
        );
    }

    protected function ensureBookingCanBeUpdated(
        Booking $booking
    ): void {
        if (
            in_array(
                $booking->status,
                self::TERMINAL_STATUSES,
                true
            )
        ) {
            throw ValidationException::withMessages([
                'status' => [
                    'This booking can no longer be edited.',
                ],
            ]);
        }
    }

    protected function ensureStatusAllowed(
        Booking $booking,
        array $allowedStatuses,
        string $message
    ): void {
        if (
            !in_array(
                $booking->status,
                $allowedStatuses,
                true
            )
        ) {
            throw ValidationException::withMessages([
                'status' => [
                    $message,
                ],
            ]);
        }
    }

    protected function validateStatus(
        string $status
    ): void {
        $allowed = defined(
            Booking::class . '::STATUSES'
        )
            ? Booking::STATUSES
            : [
                Booking::STATUS_PENDING,
                Booking::STATUS_CONFIRMED,
                Booking::STATUS_APPROVED,
                Booking::STATUS_REJECTED,
                Booking::STATUS_CANCELLED,
                Booking::STATUS_COMPLETED,
                Booking::STATUS_EXPIRED,
            ];

        if (!in_array($status, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => [
                    'Invalid booking status.',
                ],
            ]);
        }
    }

    protected function validatePaymentStatus(
        string $paymentStatus
    ): void {
        $allowed = defined(
            Booking::class . '::PAYMENT_STATUSES'
        )
            ? Booking::PAYMENT_STATUSES
            : [
                Booking::PAYMENT_PENDING,
                Booking::PAYMENT_PARTIAL,
                Booking::PAYMENT_PAID,
                Booking::PAYMENT_FAILED,
                Booking::PAYMENT_REFUNDED,
            ];

        if (!in_array($paymentStatus, $allowed, true)) {
            throw ValidationException::withMessages([
                'payment_status' => [
                    'Invalid payment status.',
                ],
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE HELPERS
    |--------------------------------------------------------------------------
    */

    protected function filterUpdateData(
        array $data
    ): array {
        $allowed = [
            'property_id',
            'apartment_id',
            'unit_id',
            'customer_id',
            'tenant_id',
            'tenancy_id',
            'booking_type',
            'source',
            'booking_date',
            'start_date',
            'end_date',
            'check_in_date',
            'check_out_date',
            'rent_amount',
            'deposit_amount',
            'service_charge',
            'booking_fee',
            'discount_amount',
            'amount_paid',
            'number_of_adults',
            'number_of_children',
            'first_name',
            'last_name',
            'email',
            'phone',
            'special_requests',
            'notes',
            'payment_method',
            'payment_reference',
            'meta_title',
            'meta_description',
        ];

        return array_intersect_key(
            $data,
            array_flip($allowed)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | INTERNAL HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Normalize a booking ID.
     *
     * Prevents accidental values such as:
     *
     *     [object Object]
     *
     * from reaching the repository.
     */
    protected function normalizeId(
        int|string $id
    ): int {
        if (is_int($id)) {
            if ($id < 1) {
                throw ValidationException::withMessages([
                    'booking' => [
                        'The booking ID must be a positive integer.',
                    ],
                ]);
            }

            return $id;
        }

        $id = trim($id);

        if (
            $id === '' ||
            !ctype_digit($id) ||
            (int) $id < 1
        ) {
            throw ValidationException::withMessages([
                'booking' => [
                    'The booking ID must be a valid positive integer.',
                ],
            ]);
        }

        return (int) $id;
    }

    /**
     * Relationships returned with a complete booking.
     */
    protected function bookingRelations(): array
    {
        return [
            'user',
            'customer',
            'tenant.user',
            'property',
            'apartment',
            'unit',
            'tenancy',
        ];
    }

    protected function normalizePerPage(
        int $perPage
    ): int {
        return min(
            max($perPage, 1),
            self::MAX_PER_PAGE
        );
    }

    protected function normalizeReason(
        ?string $reason
    ): ?string {
        if ($reason === null) {
            return null;
        }

        $reason = trim($reason);

        return $reason !== ''
            ? $reason
            : null;
    }

    protected function removeWorkflowFields(
        array &$data
    ): void {
        unset(
            $data['status'],
            $data['confirmed_at'],
            $data['approved_at'],
            $data['rejected_at'],
            $data['cancelled_at'],
            $data['completed_at'],
            $data['rejection_reason'],
            $data['cancellation_reason'],
            $data['paid_at']
        );
    }
}