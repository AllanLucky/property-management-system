<?php

namespace App\Repositories\Eloquent;

use App\Models\Booking;
use App\Models\Unit;
use App\Models\User;
use App\Repositories\Interfaces\BookingRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class BookingRepository implements BookingRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | Constants
    |--------------------------------------------------------------------------
    */

    /**
     * Maximum number of records allowed per page.
     */
    protected const MAX_PER_PAGE = 100;

    /**
     * Default number of records per page.
     */
    protected const DEFAULT_PER_PAGE = 15;

    /**
     * Booking statuses that should not block unit availability.
     */
    protected const NON_BLOCKING_STATUSES = [
        Booking::STATUS_CANCELLED,
        Booking::STATUS_REJECTED,
        Booking::STATUS_EXPIRED,
    ];

    /*
    |--------------------------------------------------------------------------
    | Query
    |--------------------------------------------------------------------------
    */

    /**
     * Base booking query.
     *
     * Centralizes relationships used throughout the repository
     * and prevents unnecessary N+1 queries.
     */
    protected function query(): Builder
    {
        return Booking::query()
            ->with([
                'user',
                'customer',
                'tenant.user',
                'property',
                'apartment',
                'unit',
                'tenancy',
            ]);
    }

    /**
     * Query including soft-deleted bookings.
     */
    protected function trashedQuery(): Builder
    {
        return $this->query()->withTrashed();
    }

    /**
     * Normalize pagination value.
     */
    protected function normalizePerPage(int $perPage): int
    {
        return min(
            max($perPage, 1),
            self::MAX_PER_PAGE
        );
    }

    /**
     * Normalize a string value.
     */
    protected function normalizeString(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);

        return $value !== '' ? $value : null;
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
        $perPage = $this->normalizePerPage($perPage);

        $query = $this->query();

        $this->applyFilters($query, $filters);

        return $query
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Find a booking by ID.
     */
    public function find(int $id): ?Booking
    {
        return $this->query()->find($id);
    }

    /**
     * Find a booking by ID or fail.
     */
    public function findOrFail(int $id): Booking
    {
        return $this->query()->findOrFail($id);
    }

    /**
     * Create a booking.
     */
    public function create(array $data): Booking
    {
        $booking = Booking::create($data);

        return $this->findOrFail($booking->id);
    }

    /**
     * Update a booking.
     */
    public function update(
        Booking $booking,
        array $data
    ): Booking {
        $booking->update($data);

        return $this->findOrFail($booking->id);
    }

    /**
     * Soft delete a booking.
     */
    public function delete(Booking $booking): bool
    {
        return (bool) $booking->delete();
    }

    /**
     * Restore a soft-deleted booking.
     */
    public function restore(Booking $booking): bool
    {
        return (bool) $booking->restore();
    }

    /**
     * Permanently delete a booking.
     */
    public function forceDelete(Booking $booking): bool
    {
        return (bool) $booking->forceDelete();
    }

    /*
    |--------------------------------------------------------------------------
    | FINDERS
    |--------------------------------------------------------------------------
    */

    /**
     * Find booking by booking number.
     */
    public function findByBookingNumber(
        string $bookingNumber
    ): ?Booking {
        $bookingNumber = $this->normalizeString($bookingNumber);

        if ($bookingNumber === null) {
            return null;
        }

        return $this->query()
            ->where('booking_number', $bookingNumber)
            ->first();
    }

    /**
     * Find booking by reference.
     */
    public function findByReference(
        string $reference
    ): ?Booking {
        $reference = $this->normalizeString($reference);

        if ($reference === null) {
            return null;
        }

        return $this->query()
            ->where('reference', $reference)
            ->first();
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
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        $search = $this->normalizeString($query);

        if ($search === null) {
            return $this->paginate(
                $perPage,
                $filters
            );
        }

        $bookingQuery = $this->query();

        $bookingQuery->where(function (
            Builder $builder
        ) use ($search) {
            $builder
                ->where(
                    'booking_number',
                    'like',
                    "%{$search}%"
                )
                ->orWhere(
                    'reference',
                    'like',
                    "%{$search}%"
                )
                ->orWhere(
                    'first_name',
                    'like',
                    "%{$search}%"
                )
                ->orWhere(
                    'last_name',
                    'like',
                    "%{$search}%"
                )
                ->orWhere(
                    'email',
                    'like',
                    "%{$search}%"
                )
                ->orWhere(
                    'phone',
                    'like',
                    "%{$search}%"
                )
                ->orWhereHas(
                    'customer',
                    function (
                        Builder $customer
                    ) use ($search) {
                        $customer
                            ->where(
                                'first_name',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'last_name',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'email',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'phone',
                                'like',
                                "%{$search}%"
                            );
                    }
                )
                ->orWhereHas(
                    'tenant.user',
                    function (
                        Builder $user
                    ) use ($search) {
                        $user
                            ->where(
                                'first_name',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'last_name',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'email',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'phone',
                                'like',
                                "%{$search}%"
                            );
                    }
                )
                ->orWhereHas(
                    'property',
                    function (
                        Builder $property
                    ) use ($search) {
                        $property
                            ->where(
                                'name',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'code',
                                'like',
                                "%{$search}%"
                            );
                    }
                )
                ->orWhereHas(
                    'unit',
                    function (
                        Builder $unit
                    ) use ($search) {
                        $unit
                            ->where(
                                'unit_number',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'code',
                                'like',
                                "%{$search}%"
                            );
                    }
                );
        });

        $this->applyFilters(
            $bookingQuery,
            $filters
        );

        return $bookingQuery
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
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
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        $query = $this->query()
            ->where('status', $status);

        $this->applyFilters(
            $query,
            $filters
        );

        return $query
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get bookings by payment status.
     */
    public function getByPaymentStatus(
        string $paymentStatus,
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        $query = $this->query()
            ->where(
                'payment_status',
                $paymentStatus
            );

        $this->applyFilters(
            $query,
            $filters
        );

        return $query
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get pending bookings.
     */
    public function getPending(
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->getByStatus(
            Booking::STATUS_PENDING,
            $perPage,
            $filters
        );
    }

    /**
     * Get confirmed bookings.
     */
    public function getConfirmed(
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->getByStatus(
            Booking::STATUS_CONFIRMED,
            $perPage,
            $filters
        );
    }

    /**
     * Get active bookings.
     *
     * Active bookings are confirmed/approved bookings
     * whose booking period includes today.
     */
    public function getActive(
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        $today = now()->toDateString();

        $query = $this->query()
            ->whereIn('status', [
                Booking::STATUS_CONFIRMED,
                Booking::STATUS_APPROVED,
            ])
            ->where(function (
                Builder $builder
            ) use ($today) {
                $builder
                    ->whereNull('start_date')
                    ->orWhereDate(
                        'start_date',
                        '<=',
                        $today
                    );
            })
            ->where(function (
                Builder $builder
            ) use ($today) {
                $builder
                    ->whereNull('end_date')
                    ->orWhereDate(
                        'end_date',
                        '>=',
                        $today
                    );
            });

        $this->applyFilters(
            $query,
            $filters
        );

        return $query
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get completed bookings.
     */
    public function getCompleted(
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->getByStatus(
            Booking::STATUS_COMPLETED,
            $perPage,
            $filters
        );
    }

    /**
     * Get cancelled bookings.
     */
    public function getCancelled(
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->getByStatus(
            Booking::STATUS_CANCELLED,
            $perPage,
            $filters
        );
    }

    /**
     * Get rejected bookings.
     */
    public function getRejected(
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->getByStatus(
            Booking::STATUS_REJECTED,
            $perPage,
            $filters
        );
    }

    /**
     * Get expired bookings.
     */
    public function getExpired(
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->getByStatus(
            Booking::STATUS_EXPIRED,
            $perPage,
            $filters
        );
    }

    /**
     * Get bookings whose end date has passed.
     *
     * These bookings are candidates for expiration.
     */
    public function getEndedBookings(): Collection
    {
        return $this->query()
            ->whereIn('status', [
                Booking::STATUS_PENDING,
                Booking::STATUS_CONFIRMED,
                Booking::STATUS_APPROVED,
            ])
            ->whereNotNull('end_date')
            ->whereDate(
                'end_date',
                '<',
                now()->toDateString()
            )
            ->orderBy('end_date')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | RELATION FILTERS
    |--------------------------------------------------------------------------
    */

    /**
     * Get bookings for a specific unit.
     */
    public function getByUnit(
        int $unitId,
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        $query = $this->query()
            ->where('unit_id', $unitId);

        $this->applyFilters(
            $query,
            $filters
        );

        return $query
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get bookings for a specific customer.
     */
    public function getByCustomer(
        int $customerId,
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        $query = $this->query()
            ->where(
                'customer_id',
                $customerId
            );

        $this->applyFilters(
            $query,
            $filters
        );

        return $query
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get bookings for a specific tenant.
     */
    public function getByTenant(
        int $tenantId,
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        $query = $this->query()
            ->where(
                'tenant_id',
                $tenantId
            );

        $this->applyFilters(
            $query,
            $filters
        );

        return $query
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get bookings for a specific property.
     */
    public function getByProperty(
        int $propertyId,
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        $query = $this->query()
            ->where(
                'property_id',
                $propertyId
            );

        $this->applyFilters(
            $query,
            $filters
        );

        return $query
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get bookings for a specific apartment.
     */
    public function getByApartment(
        int $apartmentId,
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        $query = $this->query()
            ->where(
                'apartment_id',
                $apartmentId
            );

        $this->applyFilters(
            $query,
            $filters
        );

        return $query
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABILITY
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether a unit has an overlapping booking.
     *
     * Overlap rule:
     *
     * existing_start <= requested_end
     * AND
     * existing_end >= requested_start
     */
    public function hasOverlappingBooking(
        int $unitId,
        string $startDate,
        string $endDate,
        ?int $exceptBookingId = null
    ): bool {
        $query = Booking::query()
            ->where(
                'unit_id',
                $unitId
            )
            ->whereNotIn(
                'status',
                self::NON_BLOCKING_STATUSES
            )
            ->whereNotNull('start_date')
            ->whereNotNull('end_date')
            ->whereDate(
                'start_date',
                '<=',
                $endDate
            )
            ->whereDate(
                'end_date',
                '>=',
                $startDate
            );

        if ($exceptBookingId !== null) {
            $query->where(
                'id',
                '!=',
                $exceptBookingId
            );
        }

        return $query->exists();
    }

    /**
     * Get units available for a booking period.
     *
     * Unit hierarchy:
     *
     * Property
     *   └── Apartment
     *         └── Unit
     */
    public function getAvailableUnits(
        string $startDate,
        string $endDate,
        ?int $propertyId = null,
        ?int $apartmentId = null,
        ?int $exceptBookingId = null
    ): Collection {
        $query = Unit::query()
            ->with([
                'apartment.property',
            ])
            ->where(
                'status',
                Unit::STATUS_VACANT
            );

        /*
         * Filter by property through apartment.
         */
        if ($propertyId !== null) {
            $query->whereHas(
                'apartment',
                function (
                    Builder $builder
                ) use ($propertyId) {
                    $builder->where(
                        'property_id',
                        $propertyId
                    );
                }
            );
        }

        /*
         * Filter by apartment.
         */
        if ($apartmentId !== null) {
            $query->where(
                'apartment_id',
                $apartmentId
            );
        }

        /*
         * Exclude units with overlapping bookings.
         */
        $query->whereDoesntHave(
            'bookings',
            function (
                Builder $booking
            ) use (
                $startDate,
                $endDate,
                $exceptBookingId
            ) {
                $booking
                    ->whereNotIn(
                        'status',
                        self::NON_BLOCKING_STATUSES
                    )
                    ->whereNotNull('start_date')
                    ->whereNotNull('end_date')
                    ->whereDate(
                        'start_date',
                        '<=',
                        $endDate
                    )
                    ->whereDate(
                        'end_date',
                        '>=',
                        $startDate
                    );

                if ($exceptBookingId !== null) {
                    $booking->where(
                        'id',
                        '!=',
                        $exceptBookingId
                    );
                }
            }
        );

        return $query
            ->orderBy('id')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | USERS
    |--------------------------------------------------------------------------
    */

    /**
     * Get active users eligible to make bookings.
     */
    public function getAvailableUsers(
        ?string $search = null
    ): Collection {
        $search = $this->normalizeString($search);

        $query = User::query();

        /*
         * Account status.
         */
        $query->where(function (
            Builder $builder
        ) {
            $builder
                ->where(
                    'account_status',
                    'active'
                )
                ->orWhereNull(
                    'account_status'
                );
        });

        /*
         * Approval status.
         */
        $query->where(function (
            Builder $builder
        ) {
            $builder
                ->where(
                    'approval_status',
                    'approved'
                )
                ->orWhereNull(
                    'approval_status'
                );
        });

        /*
         * Optional search.
         */
        if ($search !== null) {
            $query->where(function (
                Builder $builder
            ) use ($search) {
                $builder
                    ->where(
                        'first_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'last_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'email',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'phone',
                        'like',
                        "%{$search}%"
                    );
            });
        }

        return $query
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | DATE RANGE
    |--------------------------------------------------------------------------
    */

    /**
     * Get bookings overlapping a date range.
     *
     * Overlap:
     *
     * booking.start_date <= requested.end_date
     * AND
     * booking.end_date >= requested.start_date
     */
    public function getByDateRange(
        string $startDate,
        string $endDate,
        array $filters = []
    ): Collection {
        $query = $this->query()
            ->whereNotNull('start_date')
            ->whereNotNull('end_date')
            ->whereDate(
                'start_date',
                '<=',
                $endDate
            )
            ->whereDate(
                'end_date',
                '>=',
                $startDate
            );

        $this->applyFilters(
            $query,
            $filters
        );

        return $query
            ->orderBy('start_date')
            ->orderBy('id')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | REPORTING
    |--------------------------------------------------------------------------
    */

    /**
     * Generate booking report.
     *
     * Returns summary data together with status,
     * payment and booking-type breakdowns.
     */
    public function getReport(
        array $filters = []
    ): array {
        $query = Booking::query();

        $this->applyFilters(
            $query,
            $filters
        );

        $baseQuery = clone $query;

        $totalBookings = (clone $baseQuery)->count();

        $totalAmount = (float) (
            clone $baseQuery
        )->sum('total_amount');

        $amountPaid = (float) (
            clone $baseQuery
        )->sum('amount_paid');

        $balance = (float) (
            clone $baseQuery
        )->sum('balance');

        /*
         * Status breakdown.
         */
        $statusBreakdown = [];

        foreach (Booking::STATUSES as $status) {
            $statusBreakdown[$status] = (clone $baseQuery)
                ->where('status', $status)
                ->count();
        }

        /*
         * Payment breakdown.
         */
        $paymentBreakdown = [];

        foreach (Booking::PAYMENT_STATUSES as $paymentStatus) {
            $paymentBreakdown[$paymentStatus] = (clone $baseQuery)
                ->where(
                    'payment_status',
                    $paymentStatus
                )
                ->count();
        }

        /*
         * Booking type breakdown.
         */
        $typeBreakdown = [];

        foreach (Booking::BOOKING_TYPES as $bookingType) {
            $typeBreakdown[$bookingType] = (clone $baseQuery)
                ->where(
                    'booking_type',
                    $bookingType
                )
                ->count();
        }

        /*
         * Source breakdown.
         */
        $sourceBreakdown = [];

        foreach (Booking::SOURCES as $source) {
            $sourceBreakdown[$source] = (clone $baseQuery)
                ->where(
                    'source',
                    $source
                )
                ->count();
        }

        /*
         * Date boundaries.
         */
        $firstBookingDate = (clone $baseQuery)
            ->whereNotNull('booking_date')
            ->min('booking_date');

        $lastBookingDate = (clone $baseQuery)
            ->whereNotNull('booking_date')
            ->max('booking_date');

        /*
         * Financial performance.
         */
        $completedRevenue = (float) (
            clone $baseQuery
        )
            ->where(
                'status',
                Booking::STATUS_COMPLETED
            )
            ->sum('total_amount');

        $activeValue = (float) (
            clone $baseQuery
        )
            ->whereIn('status', [
                Booking::STATUS_CONFIRMED,
                Booking::STATUS_APPROVED,
            ])
            ->sum('total_amount');

        return [
            'summary' => [
                'total_bookings' => $totalBookings,
                'total_amount' => $totalAmount,
                'amount_paid' => $amountPaid,
                'balance' => $balance,
                'completed_revenue' => $completedRevenue,
                'active_booking_value' => $activeValue,
            ],

            'status_breakdown' => $statusBreakdown,

            'payment_breakdown' => $paymentBreakdown,

            'booking_type_breakdown' => $typeBreakdown,

            'source_breakdown' => $sourceBreakdown,

            'date_range' => [
                'start_date' => $filters['start_date'] ?? null,
                'end_date' => $filters['end_date'] ?? null,
                'first_booking_date' => $firstBookingDate,
                'last_booking_date' => $lastBookingDate,
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Get booking statistics.
     */
    public function getStatistics(
        array $filters = []
    ): array {
        $query = Booking::query();

        $this->applyFilters(
            $query,
            $filters
        );

        /*
         * Total bookings.
         */
        $total = (clone $query)->count();

        /*
         * Status counts.
         */
        $pending = (clone $query)
            ->where(
                'status',
                Booking::STATUS_PENDING
            )
            ->count();

        $confirmed = (clone $query)
            ->where(
                'status',
                Booking::STATUS_CONFIRMED
            )
            ->count();

        $approved = (clone $query)
            ->where(
                'status',
                Booking::STATUS_APPROVED
            )
            ->count();

        $rejected = (clone $query)
            ->where(
                'status',
                Booking::STATUS_REJECTED
            )
            ->count();

        $cancelled = (clone $query)
            ->where(
                'status',
                Booking::STATUS_CANCELLED
            )
            ->count();

        $completed = (clone $query)
            ->where(
                'status',
                Booking::STATUS_COMPLETED
            )
            ->count();

        $expired = (clone $query)
            ->where(
                'status',
                Booking::STATUS_EXPIRED
            )
            ->count();

        /*
         * Payment counts.
         */
        $paymentPending = (clone $query)
            ->where(
                'payment_status',
                Booking::PAYMENT_PENDING
            )
            ->count();

        $paymentPartial = (clone $query)
            ->where(
                'payment_status',
                Booking::PAYMENT_PARTIAL
            )
            ->count();

        $paymentPaid = (clone $query)
            ->where(
                'payment_status',
                Booking::PAYMENT_PAID
            )
            ->count();

        $paymentFailed = (clone $query)
            ->where(
                'payment_status',
                Booking::PAYMENT_FAILED
            )
            ->count();

        $paymentRefunded = (clone $query)
            ->where(
                'payment_status',
                Booking::PAYMENT_REFUNDED
            )
            ->count();

        /*
         * Financial totals.
         */
        $totalAmount = (float) (
            clone $query
        )->sum('total_amount');

        $totalPaid = (float) (
            clone $query
        )->sum('amount_paid');

        $totalBalance = (float) (
            clone $query
        )->sum('balance');

        /*
         * Exclude cancelled/rejected bookings from
         * revenue calculation.
         */
        $revenueQuery = clone $query;

        $totalRevenue = (float) $revenueQuery
            ->whereNotIn('status', [
                Booking::STATUS_CANCELLED,
                Booking::STATUS_REJECTED,
            ])
            ->sum('total_amount');

        /*
         * Current active bookings.
         */
        $today = now()->toDateString();

        $activeQuery = clone $query;

        $active = $activeQuery
            ->whereIn('status', [
                Booking::STATUS_CONFIRMED,
                Booking::STATUS_APPROVED,
            ])
            ->where(function (
                Builder $builder
            ) use ($today) {
                $builder
                    ->whereNull('start_date')
                    ->orWhereDate(
                        'start_date',
                        '<=',
                        $today
                    );
            })
            ->where(function (
                Builder $builder
            ) use ($today) {
                $builder
                    ->whereNull('end_date')
                    ->orWhereDate(
                        'end_date',
                        '>=',
                        $today
                    );
            })
            ->count();

        /*
         * Candidate expired bookings.
         */
        $endedQuery = clone $query;

        $ended = $endedQuery
            ->whereIn('status', [
                Booking::STATUS_PENDING,
                Booking::STATUS_CONFIRMED,
                Booking::STATUS_APPROVED,
            ])
            ->whereNotNull('end_date')
            ->whereDate(
                'end_date',
                '<',
                $today
            )
            ->count();

        return [
            /*
             * General.
             */
            'total' => $total,

            'pending' => $pending,

            'confirmed' => $confirmed,

            'approved' => $approved,

            'rejected' => $rejected,

            'cancelled' => $cancelled,

            'completed' => $completed,

            'expired' => $expired,

            'active' => $active,

            'ended' => $ended,

            /*
             * Payment.
             */
            'payment_pending' => $paymentPending,

            'payment_partial' => $paymentPartial,

            'payment_paid' => $paymentPaid,

            'payment_failed' => $paymentFailed,

            'payment_refunded' => $paymentRefunded,

            /*
             * Financial.
             */
            'total_amount' => $totalAmount,

            'total_revenue' => $totalRevenue,

            'total_paid' => $totalPaid,

            'total_balance' => $totalBalance,

            /*
             * Compatibility aliases useful
             * for dashboard cards.
             */
            'revenue' => $totalRevenue,

            'paid' => $totalPaid,

            'balance' => $totalBalance,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */

    /**
     * Apply reusable booking filters.
     */
    protected function applyFilters(
        Builder $query,
        array $filters
    ): void {
        /*
         * Search.
         */
        if (
            isset($filters['search']) &&
            trim((string) $filters['search']) !== ''
        ) {
            $search = trim(
                (string) $filters['search']
            );

            $query->where(function (
                Builder $builder
            ) use ($search) {
                $builder
                    ->where(
                        'booking_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'reference',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'first_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'last_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'email',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'phone',
                        'like',
                        "%{$search}%"
                    )

                    /*
                     * Customer.
                     */
                    ->orWhereHas(
                        'customer',
                        function (
                            Builder $customer
                        ) use ($search) {
                            $customer
                                ->where(
                                    'first_name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'last_name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'email',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'phone',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    )

                    /*
                     * Tenant.
                     */
                    ->orWhereHas(
                        'tenant.user',
                        function (
                            Builder $user
                        ) use ($search) {
                            $user
                                ->where(
                                    'first_name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'last_name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'email',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'phone',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    )

                    /*
                     * Property.
                     */
                    ->orWhereHas(
                        'property',
                        function (
                            Builder $property
                        ) use ($search) {
                            $property
                                ->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'code',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    )

                    /*
                     * Apartment.
                     */
                    ->orWhereHas(
                        'apartment',
                        function (
                            Builder $apartment
                        ) use ($search) {
                            $apartment
                                ->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'code',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    )

                    /*
                     * Unit.
                     */
                    ->orWhereHas(
                        'unit',
                        function (
                            Builder $unit
                        ) use ($search) {
                            $unit
                                ->where(
                                    'unit_number',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'code',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
            });
        }

        /*
         * Status.
         */
        if (
            isset($filters['status']) &&
            $filters['status'] !== ''
        ) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        /*
         * Payment status.
         */
        if (
            isset($filters['payment_status']) &&
            $filters['payment_status'] !== ''
        ) {
            $query->where(
                'payment_status',
                $filters['payment_status']
            );
        }

        /*
         * Booking type.
         */
        if (
            isset($filters['booking_type']) &&
            $filters['booking_type'] !== ''
        ) {
            $query->where(
                'booking_type',
                $filters['booking_type']
            );
        }

        /*
         * Source.
         */
        if (
            isset($filters['source']) &&
            $filters['source'] !== ''
        ) {
            $query->where(
                'source',
                $filters['source']
            );
        }

        /*
         * Property.
         */
        if (
            isset($filters['property_id']) &&
            $filters['property_id'] !== ''
        ) {
            $query->where(
                'property_id',
                $filters['property_id']
            );
        }

        /*
         * Apartment.
         */
        if (
            isset($filters['apartment_id']) &&
            $filters['apartment_id'] !== ''
        ) {
            $query->where(
                'apartment_id',
                $filters['apartment_id']
            );
        }

        /*
         * Unit.
         */
        if (
            isset($filters['unit_id']) &&
            $filters['unit_id'] !== ''
        ) {
            $query->where(
                'unit_id',
                $filters['unit_id']
            );
        }

        /*
         * Customer.
         */
        if (
            isset($filters['customer_id']) &&
            $filters['customer_id'] !== ''
        ) {
            $query->where(
                'customer_id',
                $filters['customer_id']
            );
        }

        /*
         * Tenant.
         */
        if (
            isset($filters['tenant_id']) &&
            $filters['tenant_id'] !== ''
        ) {
            $query->where(
                'tenant_id',
                $filters['tenant_id']
            );
        }

        /*
         * Tenancy.
         */
        if (
            isset($filters['tenancy_id']) &&
            $filters['tenancy_id'] !== ''
        ) {
            $query->where(
                'tenancy_id',
                $filters['tenancy_id']
            );
        }

        /*
         * Date range.
         *
         * For normal listing/report filtering:
         *
         * start_date >= requested start
         * end_date <= requested end
         */
        if (
            isset($filters['start_date']) &&
            $filters['start_date'] !== ''
        ) {
            $query->whereDate(
                'start_date',
                '>=',
                $filters['start_date']
            );
        }

        if (
            isset($filters['end_date']) &&
            $filters['end_date'] !== ''
        ) {
            $query->whereDate(
                'end_date',
                '<=',
                $filters['end_date']
            );
        }

        /*
         * Booking date range.
         */
        if (
            isset($filters['booking_date_from']) &&
            $filters['booking_date_from'] !== ''
        ) {
            $query->whereDate(
                'booking_date',
                '>=',
                $filters['booking_date_from']
            );
        }

        if (
            isset($filters['booking_date_to']) &&
            $filters['booking_date_to'] !== ''
        ) {
            $query->whereDate(
                'booking_date',
                '<=',
                $filters['booking_date_to']
            );
        }

        /*
         * Soft deleted records.
         */
        if (
            isset($filters['with_trashed']) &&
            filter_var(
                $filters['with_trashed'],
                FILTER_VALIDATE_BOOLEAN
            )
        ) {
            $query->withTrashed();
        }

        /*
         * Only soft-deleted records.
         */
        if (
            isset($filters['only_trashed']) &&
            filter_var(
                $filters['only_trashed'],
                FILTER_VALIDATE_BOOLEAN
            )
        ) {
            $query->onlyTrashed();
        }
    }
}