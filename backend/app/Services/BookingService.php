<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Unit;
use App\Repositories\Interfaces\BookingRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
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
     * Fields used when merging an existing booking with an update payload.
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
     * Bookings allowed to be completed.
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
    public function find(int $id): ?Booking
    {
        return $this->bookingRepository->find($id);
    }

    /**
     * Find booking or fail.
     */
    public function findOrFail(int $id): Booking
    {
        return $this->bookingRepository->findOrFail($id);
    }

    /**
     * Create a booking.
     */
    public function create(array $data): Booking
    {
        return DB::transaction(function () use ($data) {
            $data = $this->prepareBookingData($data);

            $this->validateBookingDates($data);
            $this->validateBookingReferences($data);
            $this->validateUnitAvailability($data);

            $data = array_merge(
                $data,
                $this->prepareFinancialData($data)
            );

            /*
             * New bookings must always start as pending.
             * Workflow actions control confirmation/approval.
             */
            $data['status'] = Booking::STATUS_PENDING;

            /*
             * Never trust client payment status.
             */
            $data['payment_status'] = $this->calculatePaymentStatus(
                (float) $data['total_amount'],
                (float) $data['amount_paid']
            );

            return $this->bookingRepository->create($data);
        });
    }

    /**
     * Update an existing booking.
     */
    public function update(
        Booking $booking,
        array $data
    ): Booking {
        return DB::transaction(function () use ($booking, $data) {
            $this->ensureBookingCanBeUpdated($booking);

            /*
             * Merge persisted values with incoming values so
             * partial updates can still be validated correctly.
             */
            $mergedData = array_merge(
                $booking->only(self::MERGE_FIELDS),
                $data
            );

            $data = $this->prepareBookingData(
                $data,
                $booking
            );

            /*
             * If customer_id changes, do not trust an independently
             * supplied snapshot. The controller/service should normally
             * resolve the customer snapshot from the selected user.
             */
            if (
                array_key_exists('customer_id', $data) &&
                (int) $data['customer_id'] !== (int) $booking->customer_id
            ) {
                $this->removeCustomerSnapshot($data);
            }

            $this->validateBookingDates($mergedData);
            $this->validateBookingReferences($mergedData);

            $this->validateUnitAvailability(
                $mergedData,
                $booking->id
            );

            $financialData = $this->prepareFinancialData(
                $mergedData,
                $booking
            );

            /*
             * Financial values are always calculated server-side.
             */
            foreach (self::FINANCIAL_FIELDS as $field) {
                if (array_key_exists($field, $financialData)) {
                    $data[$field] = $financialData[$field];
                }
            }

            /*
             * Normal update must never change workflow state.
             */
            $this->removeWorkflowFields($data);

            return $this->bookingRepository->update(
                $booking,
                $data
            );
        });
    }

    /**
     * Soft delete booking.
     */
    public function delete(Booking $booking): bool
    {
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
    public function restore(Booking $booking): bool
    {
        return $this->bookingRepository->restore($booking);
    }

    /**
     * Permanently delete a booking.
     */
    public function forceDelete(Booking $booking): bool
    {
        return $this->bookingRepository->forceDelete($booking);
    }

    /*
    |--------------------------------------------------------------------------
    | FINDERS
    |--------------------------------------------------------------------------
    */

    /**
     * Find by booking number.
     */
    public function findByBookingNumber(
        string $bookingNumber
    ): ?Booking {
        return $this->bookingRepository->findByBookingNumber(
            trim($bookingNumber)
        );
    }

    /**
     * Find by reference.
     */
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

    /**
     * Search bookings.
     */
    public function search(
        string $query,
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->search(
            trim($query),
            $this->normalizePerPage($perPage)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    /**
     * Get bookings by status.
     */
    public function getByStatus(
        string $status,
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        $status = strtolower(trim($status));

        $this->validateStatus($status);

        return $this->bookingRepository->getByStatus(
            $status,
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Get bookings by payment status.
     */
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

    /**
     * Get pending bookings.
     */
    public function getPending(
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getPending(
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Get confirmed bookings.
     */
    public function getConfirmed(
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getConfirmed(
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Get active bookings.
     */
    public function getActive(
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getActive(
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Get completed bookings.
     */
    public function getCompleted(
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getCompleted(
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Get cancelled bookings.
     */
    public function getCancelled(
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getCancelled(
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Get expired bookings.
     */
    public function getExpired(
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getExpired(
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Get bookings whose end date has passed.
     */
    public function getEndedBookings(): Collection
    {
        return $this->bookingRepository->getEndedBookings();
    }

    /*
    |--------------------------------------------------------------------------
    | BOOKING WORKFLOW
    |--------------------------------------------------------------------------
    */

    /**
     * Confirm booking.
     */
    public function confirm(Booking $booking): Booking
    {
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
            );
        });
    }

    /**
     * Approve booking.
     */
    public function approve(Booking $booking): Booking
    {
        return DB::transaction(function () use ($booking) {
            if (
                !in_array(
                    $booking->status,
                    self::APPROVABLE_STATUSES,
                    true
                )
            ) {
                throw ValidationException::withMessages([
                    'status' => [
                        'This booking cannot be approved from its current status.',
                    ],
                ]);
            }

            $this->validateUnitAvailabilityForBooking($booking);

            return $this->bookingRepository->update(
                $booking,
                [
                    'status' => Booking::STATUS_APPROVED,
                    'approved_at' => now(),
                ]
            );
        });
    }

    /**
     * Check in a booking.
     *
     * The finalized Booking model does not use a checked_in status.
     * Check-in is therefore represented by check_in_date.
     */
    public function checkIn(Booking $booking): Booking
    {
        if (
            !in_array(
                $booking->status,
                self::COMPLETABLE_STATUSES,
                true
            )
        ) {
            throw ValidationException::withMessages([
                'status' => [
                    'Only confirmed or approved bookings can be checked in.',
                ],
            ]);
        }

        if ($booking->check_in_date) {
            throw ValidationException::withMessages([
                'check_in_date' => [
                    'This booking has already been checked in.',
                ],
            ]);
        }

        return $this->bookingRepository->update(
            $booking,
            [
                'check_in_date' => now()->toDateString(),
            ]
        );
    }

    /**
     * Reject booking.
     */
    public function reject(
        Booking $booking,
        ?string $reason = null
    ): Booking {
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
            );
        });
    }

    /**
     * Cancel booking.
     */
    public function cancel(
        Booking $booking,
        ?string $reason = null
    ): Booking {
        $this->ensureStatusAllowed(
            $booking,
            self::CANCELLABLE_STATUSES,
            'This booking cannot be cancelled from its current status.'
        );

        $reason = $this->normalizeReason($reason);

        if (!$reason) {
            throw ValidationException::withMessages([
                'cancellation_reason' => [
                    'A cancellation reason is required.',
                ],
            ]);
        }

        return DB::transaction(function () use ($booking, $reason) {
            return $this->bookingRepository->update(
                $booking,
                [
                    'status' => Booking::STATUS_CANCELLED,
                    'cancelled_at' => now(),
                    'cancellation_reason' => $reason,
                ]
            );
        });
    }

    /**
     * Complete booking.
     */
    public function complete(Booking $booking): Booking
    {
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
            );
        });
    }

    /**
     * Expire a booking.
     */
    public function expire(Booking $booking): Booking
    {
        if (!$booking->end_date) {
            throw ValidationException::withMessages([
                'end_date' => [
                    'This booking does not have an end date.',
                ],
            ]);
        }

        if ($booking->end_date >= now()->startOfDay()) {
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
            );
        });
    }

    /**
     * Automatically expire all ended bookings.
     */
    public function expireEndedBookings(): int
    {
        $bookings = $this->bookingRepository->getEndedBookings();

        $count = 0;

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

            $this->bookingRepository->update(
                $booking,
                [
                    'status' => Booking::STATUS_EXPIRED,
                ]
            );

            $count++;
        }

        return $count;
    }

    /*
    |--------------------------------------------------------------------------
    | UNIT / CUSTOMER / TENANT
    |--------------------------------------------------------------------------
    */

    /**
     * Get bookings by unit.
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

    /**
     * Get bookings by customer.
     */
    public function getByCustomer(
        int $customerId,
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getByCustomer(
            $customerId,
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Get bookings by tenant.
     */
    public function getByTenant(
        int $tenantId,
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->bookingRepository->getByTenant(
            $tenantId,
            $this->normalizePerPage($perPage)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABILITY
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether a unit has an overlapping booking.
     */
    public function hasOverlappingBooking(
        int $unitId,
        string $startDate,
        string $endDate,
        ?int $exceptBookingId = null
    ): bool {
        $this->validateDateRange($startDate, $endDate);

        return $this->bookingRepository->hasOverlappingBooking(
            $unitId,
            $startDate,
            $endDate,
            $exceptBookingId
        );
    }

    /**
     * Get available units.
     */
    public function getAvailableUnits(
        string $startDate,
        string $endDate,
        ?int $propertyId = null,
        ?int $apartmentId = null
    ): Collection {
        $this->validateDateRange($startDate, $endDate);

        return $this->bookingRepository->getAvailableUnits(
            $startDate,
            $endDate,
            $propertyId,
            $apartmentId
        );
    }

    /**
     * Get available users.
     */
    public function getAvailableUsers(): Collection
    {
        return $this->bookingRepository->getAvailableUsers();
    }

    /*
    |--------------------------------------------------------------------------
    | DATE RANGE
    |--------------------------------------------------------------------------
    */

    /**
     * Get bookings by date range.
     */
    public function getByDateRange(
        string $startDate,
        string $endDate
    ): Collection {
        $this->validateDateRange($startDate, $endDate);

        return $this->bookingRepository->getByDateRange(
            $startDate,
            $endDate
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENT MANAGEMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Mark booking as fully paid.
     */
    public function markAsPaid(
        Booking $booking,
        ?float $amount = null
    ): Booking {
        $totalAmount = $this->calculateBookingTotal($booking);

        $amountPaid = $amount !== null
            ? round($amount, 2)
            : $totalAmount;

        if ($amountPaid <= 0 && $totalAmount > 0) {
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
            );
        });
    }

    /**
     * Record a partial or final payment.
     */
    public function recordPartialPayment(
        Booking $booking,
        float $amount
    ): Booking {
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
            );
        });
    }

    /**
     * Mark booking as refunded.
     */
    public function refund(Booking $booking): Booking
    {
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
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Get booking statistics.
     */
    public function getStatistics(): array
    {
        return $this->bookingRepository->getStatistics();
    }

    /*
    |--------------------------------------------------------------------------
    | DATA PREPARATION
    |--------------------------------------------------------------------------
    */

    /**
     * Prepare booking data.
     */
    protected function prepareBookingData(
        array $data,
        ?Booking $booking = null
    ): array {
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

        if (
            isset($data['email']) &&
            $data['email'] !== ''
        ) {
            $data['email'] = strtolower($data['email']);
        }

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
         * Server calculates these fields.
         */
        unset(
            $data['total_amount'],
            $data['balance']
        );

        if (
            isset($data['booking_type']) &&
            is_string($data['booking_type'])
        ) {
            $data['booking_type'] = strtolower(
                trim($data['booking_type'])
            );
        }

        if (
            isset($data['source']) &&
            is_string($data['source'])
        ) {
            $data['source'] = strtolower(
                trim($data['source'])
            );
        }

        /*
         * Normal create/update cannot control workflow state.
         */
        unset(
            $data['status'],
            $data['confirmed_at'],
            $data['approved_at'],
            $data['rejected_at'],
            $data['cancelled_at'],
            $data['completed_at'],
            $data['rejection_reason'],
            $data['cancellation_reason']
        );

        /*
         * Payment status is always calculated by the service.
         */
        unset($data['payment_status']);

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

        $charges = $rent
            + $deposit
            + $serviceCharge
            + $bookingFee;

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

    /**
     * Calculate payment status from actual financial values.
     */
    protected function calculatePaymentStatus(
        float $totalAmount,
        float $amountPaid
    ): string {
        if ($amountPaid <= 0) {
            return Booking::PAYMENT_PENDING;
        }

        if (
            $totalAmount > 0 &&
            $amountPaid >= $totalAmount
        ) {
            return Booking::PAYMENT_PAID;
        }

        /*
         * A zero-total booking with a payment should still
         * not become partial.
         */
        if ($totalAmount <= 0) {
            return Booking::PAYMENT_PAID;
        }

        return Booking::PAYMENT_PARTIAL;
    }

    /**
     * Calculate booking total from persisted charges.
     */
    protected function calculateBookingTotal(
        Booking $booking
    ): float {
        return max(
            (float) ($booking->rent_amount ?? 0)
            + (float) ($booking->deposit_amount ?? 0)
            + (float) ($booking->service_charge ?? 0)
            + (float) ($booking->booking_fee ?? 0)
            - (float) ($booking->discount_amount ?? 0),
            0
        );
    }

    /**
     * Read a monetary value from incoming data or existing model.
     */
    protected function moneyValue(
        array $data,
        string $field,
        mixed $fallback = null
    ): float {
        $value = array_key_exists($field, $data)
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

        $value = round((float) $value, 2);

        if ($value < 0) {
            throw ValidationException::withMessages([
                $field => [
                    'The amount cannot be negative.',
                ],
            ]);
        }

        return $value;
    }

    /**
     * Ensure payment does not exceed booking total.
     */
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

    /**
     * Validate booking dates.
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

        if ($checkIn && $checkOut && $checkIn > $checkOut) {
            throw ValidationException::withMessages([
                'check_out_date' => [
                    'The check-out date must be after or equal to the check-in date.',
                ],
            ]);
        }

        /*
         * Check-in/check-out should remain within the booking period.
         */
        if ($startDate && $checkIn && $checkIn < $startDate) {
            throw ValidationException::withMessages([
                'check_in_date' => [
                    'The check-in date cannot be before the booking start date.',
                ],
            ]);
        }

        if ($endDate && $checkOut && $checkOut > $endDate) {
            throw ValidationException::withMessages([
                'check_out_date' => [
                    'The check-out date cannot be after the booking end date.',
                ],
            ]);
        }
    }

    /**
     * Validate date range.
     */
    protected function validateDateRange(
        string $startDate,
        string $endDate
    ): void {
        if ($startDate > $endDate) {
            throw ValidationException::withMessages([
                'end_date' => [
                    'The end date must be after or equal to the start date.',
                ],
            ]);
        }
    }

    /**
     * Validate property/apartment/unit relationships.
     */
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
                'apartment',
                'property',
            ])
            ->find($unitId);

        if (!$unit) {
            throw ValidationException::withMessages([
                'unit_id' => [
                    'The selected unit does not exist.',
                ],
            ]);
        }

        /*
         * Unit must belong to selected property.
         */
        if (
            $propertyId &&
            isset($unit->property_id) &&
            (int) $unit->property_id !== (int) $propertyId
        ) {
            throw ValidationException::withMessages([
                'unit_id' => [
                    'The selected unit does not belong to the selected property.',
                ],
            ]);
        }

        /*
         * Unit must belong to selected apartment.
         */
        if (
            $apartmentId &&
            isset($unit->apartment_id) &&
            (int) $unit->apartment_id !== (int) $apartmentId
        ) {
            throw ValidationException::withMessages([
                'unit_id' => [
                    'The selected unit does not belong to the selected apartment.',
                ],
            ]);
        }

        /*
         * Maintenance units can never be booked.
         */
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
            $unit->status === 'maintenance'
        ) {
            throw ValidationException::withMessages([
                'unit_id' => [
                    'The selected unit is currently under maintenance.',
                ],
            ]);
        }
    }

    /**
     * Validate booking availability.
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

        if (
            $this->bookingRepository->hasOverlappingBooking(
                (int) $unitId,
                (string) $startDate,
                (string) $endDate,
                $exceptBookingId
            )
        ) {
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
        $this->validateUnitAvailability(
            [
                'unit_id' => $booking->unit_id,
                'start_date' => $booking->start_date,
                'end_date' => $booking->end_date,
            ],
            $booking->id
        );
    }

    /**
     * Ensure booking can still be edited.
     */
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

    /**
     * Ensure booking has an allowed status.
     */
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
                'status' => [$message],
            ]);
        }
    }

    /**
     * Validate booking status.
     */
    protected function validateStatus(
        string $status
    ): void {
        $allowed = [
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

    /**
     * Validate payment status.
     */
    protected function validatePaymentStatus(
        string $paymentStatus
    ): void {
        $allowed = [
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
    | INTERNAL HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Normalize pagination size.
     */
    protected function normalizePerPage(int $perPage): int
    {
        return min(
            max($perPage, 1),
            self::MAX_PER_PAGE
        );
    }

    /**
     * Normalize workflow reason.
     */
    protected function normalizeReason(?string $reason): ?string
    {
        if ($reason === null) {
            return null;
        }

        $reason = trim($reason);

        return $reason !== ''
            ? $reason
            : null;
    }

    /**
     * Remove workflow-controlled fields from normal update.
     */
    protected function removeWorkflowFields(array &$data): void
    {
        unset(
            $data['status'],
            $data['confirmed_at'],
            $data['approved_at'],
            $data['rejected_at'],
            $data['cancelled_at'],
            $data['completed_at'],
            $data['rejection_reason'],
            $data['cancellation_reason']
        );
    }

    /**
     * Remove customer snapshot fields when customer identity changes.
     */
    protected function removeCustomerSnapshot(array &$data): void
    {
        unset(
            $data['first_name'],
            $data['last_name'],
            $data['email'],
            $data['phone']
        );
    }
}