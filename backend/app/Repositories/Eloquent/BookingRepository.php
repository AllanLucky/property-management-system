<?php

namespace App\Repositories\Eloquent;

use App\Models\Booking;
use App\Models\Unit;
use App\Models\User;
use App\Repositories\Interfaces\BookingRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

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
     * Booking statuses that actively block unit availability.
     *
     * Only these statuses should reserve a unit for a booking period.
     */
    protected const ACTIVE_STATUSES = [
        Booking::STATUS_PENDING,
        Booking::STATUS_CONFIRMED,
        Booking::STATUS_APPROVED,
    ];

    /*
    |--------------------------------------------------------------------------
    | Base Queries
    |--------------------------------------------------------------------------
    */

    /**
     * Base booking query.
     *
     * Centralizes eager-loaded relationships and prevents N+1 queries.
     */
    protected function query(): Builder
    {
        return Booking::query()->with([
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
     * Booking query including soft-deleted records.
     */
    protected function trashedQuery(): Builder
    {
        return $this->query()->withTrashed();
    }

    /**
     * Normalize pagination.
     */
    protected function normalizePerPage(int $perPage): int
    {
        return min(
            max($perPage, 1),
            self::MAX_PER_PAGE
        );
    }

    /**
     * Normalize a nullable string.
     */
    protected function normalizeString(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);

        return $value !== ''
            ? $value
            : null;
    }

    /**
     * Determine whether a filter is enabled.
     */
    protected function isTruthy(mixed $value): bool
    {
        return filter_var(
            $value,
            FILTER_VALIDATE_BOOLEAN
        );
    }

    /**
     * Resolve a model constant safely.
     *
     * This protects reports/statistics from breaking if a model constant
     * is renamed or temporarily unavailable.
     */
    protected function modelConstant(
        string $constant,
        array $fallback = []
    ): array {
        return defined(Booking::class . '::' . $constant)
            ? constant(Booking::class . '::' . $constant)
            : $fallback;
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
     * Find booking by ID.
     */
    public function find(int $id): ?Booking
    {
        return $this->query()->find($id);
    }

    /**
     * Find booking by ID or fail.
     */
    public function findOrFail(int $id): Booking
    {
        return $this->query()->findOrFail($id);
    }

    /**
     * Create booking.
     */
    public function create(array $data): Booking
    {
        $booking = Booking::create($data);

        return $this->findOrFail($booking->id);
    }

    /**
     * Update booking.
     */
    public function update(
        Booking $booking,
        array $data
    ): Booking {
        $booking->update($data);

        return $this->findOrFail($booking->id);
    }

    /**
     * Soft delete booking.
     */
    public function delete(Booking $booking): bool
    {
        return (bool) $booking->delete();
    }

    /**
     * Restore booking.
     */
    public function restore(Booking $booking): bool
    {
        return (bool) $booking->restore();
    }

    /**
     * Permanently delete booking.
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

        $this->applySearch(
            $bookingQuery,
            $search
        );

        $this->applyFilters(
            $bookingQuery,
            $filters
        );

        return $bookingQuery
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Apply booking search conditions.
     */
    protected function applySearch(
        Builder $query,
        string $search
    ): void {
        $like = '%' . $search . '%';

        $query->where(function (Builder $builder) use ($like) {
            $builder
                ->where('booking_number', 'like', $like)
                ->orWhere('reference', 'like', $like)
                ->orWhere('first_name', 'like', $like)
                ->orWhere('last_name', 'like', $like)
                ->orWhere('email', 'like', $like)
                ->orWhere('phone', 'like', $like)

                /*
                 * Customer user.
                 */
                ->orWhereHas(
                    'customer',
                    function (Builder $customer) use ($like) {
                        $customer
                            ->where('first_name', 'like', $like)
                            ->orWhere('last_name', 'like', $like)
                            ->orWhere('email', 'like', $like)
                            ->orWhere('phone', 'like', $like);
                    }
                )

                /*
                 * Tenant user.
                 */
                ->orWhereHas(
                    'tenant.user',
                    function (Builder $user) use ($like) {
                        $user
                            ->where('first_name', 'like', $like)
                            ->orWhere('last_name', 'like', $like)
                            ->orWhere('email', 'like', $like)
                            ->orWhere('phone', 'like', $like);
                    }
                )

                /*
                 * Property.
                 */
                ->orWhereHas(
                    'property',
                    function (Builder $property) use ($like) {
                        $property
                            ->where('name', 'like', $like)
                            ->orWhere('code', 'like', $like)
                            ->orWhere('slug', 'like', $like);
                    }
                )

                /*
                 * Apartment.
                 */
                ->orWhereHas(
                    'apartment',
                    function (Builder $apartment) use ($like) {
                        $apartment
                            ->where('name', 'like', $like)
                            ->orWhere('code', 'like', $like)
                            ->orWhere('slug', 'like', $like);
                    }
                )

                /*
                 * Unit.
                 */
                ->orWhereHas(
                    'unit',
                    function (Builder $unit) use ($like) {
                        $unit
                            ->where('unit_number', 'like', $like)
                            ->orWhere('code', 'like', $like);
                    }
                );
        });
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
            ->where('payment_status', $paymentStatus);

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
     * Get currently active bookings.
     */
    public function getActive(
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        $today = now()->toDateString();

        $query = $this->query()
            ->whereIn(
                'status',
                [
                    Booking::STATUS_CONFIRMED,
                    Booking::STATUS_APPROVED,
                ]
            )
            ->where(function (Builder $builder) use ($today) {
                $builder
                    ->whereNull('start_date')
                    ->orWhereDate(
                        'start_date',
                        '<=',
                        $today
                    );
            })
            ->where(function (Builder $builder) use ($today) {
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
     */
    public function getEndedBookings(): Collection
    {
        return $this->query()
            ->whereIn(
                'status',
                self::ACTIVE_STATUSES
            )
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
     * Get bookings by unit.
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
     * Get bookings by customer.
     */
    public function getByCustomer(
        int $customerId,
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        $query = $this->query()
            ->where('customer_id', $customerId);

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
     * Get bookings by tenant.
     */
    public function getByTenant(
        int $tenantId,
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        $query = $this->query()
            ->where('tenant_id', $tenantId);

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
     * Get bookings by property.
     */
    public function getByProperty(
        int $propertyId,
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        $query = $this->query()
            ->where('property_id', $propertyId);

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
     * Get bookings by apartment.
     */
    public function getByApartment(
        int $apartmentId,
        int $perPage = self::DEFAULT_PER_PAGE,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        $query = $this->query()
            ->where('apartment_id', $apartmentId);

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
     * Determine whether a unit has an overlapping booking.
     *
     * IMPORTANT:
     *
     * During an update, the current booking ID is passed through
     * $exceptBookingId so the booking does not conflict with itself.
     *
     * Only pending, confirmed and approved bookings block availability.
     */
    public function hasOverlappingBooking(
        int $unitId,
        string $startDate,
        string $endDate,
        ?int $exceptBookingId = null
    ): bool {
        $query = Booking::query()
            ->where('unit_id', $unitId)

            /*
             * Only active booking statuses block availability.
             */
            ->whereIn(
                'status',
                self::ACTIVE_STATUSES
            )

            /*
             * Ignore soft-deleted bookings.
             *
             * Booking::query() already excludes them, but keeping this
             * explicit makes the availability rule obvious.
             */
            ->whereNull('deleted_at')

            /*
             * A booking must have both dates to participate in
             * overlap validation.
             */
            ->whereNotNull('start_date')
            ->whereNotNull('end_date')

            /*
             * Standard date-range overlap:
             *
             * Existing start <= requested end
             * AND
             * Existing end >= requested start
             */
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

        /*
         * CRITICAL:
         *
         * When editing booking #5, for example, do not allow booking #5
         * itself to be detected as an overlapping booking.
         */
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
     * Get units available for the requested period.
     *
     * The current booking is excluded when $exceptBookingId is supplied.
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
         * Property filter.
         */
        if ($propertyId !== null) {
            $query->whereHas(
                'apartment',
                function (Builder $builder) use ($propertyId) {
                    $builder->where(
                        'property_id',
                        $propertyId
                    );
                }
            );
        }

        /*
         * Apartment filter.
         */
        if ($apartmentId !== null) {
            $query->where(
                'apartment_id',
                $apartmentId
            );
        }

        /*
         * Exclude units with overlapping active bookings.
         *
         * The current booking is excluded during edit operations.
         */
        $query->whereDoesntHave(
            'bookings',
            function (Builder $booking) use (
                $startDate,
                $endDate,
                $exceptBookingId
            ) {
                $booking
                    ->whereIn(
                        'status',
                        self::ACTIVE_STATUSES
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

                /*
                 * CRITICAL:
                 *
                 * Do not let the current booking make its own unit
                 * appear unavailable while editing.
                 */
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
     * Get users eligible to make bookings.
     */
    public function getAvailableUsers(
        ?string $search = null
    ): Collection {
        $search = $this->normalizeString($search);

        $query = User::query();

        /*
         * Active accounts or legacy records without account status.
         */
        $query->where(function (Builder $builder) {
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
         * Approved accounts or legacy records without approval status.
         */
        $query->where(function (Builder $builder) {
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
         * Search.
         */
        if ($search !== null) {
            $like = '%' . $search . '%';

            $query->where(function (
                Builder $builder
            ) use ($like) {
                $builder
                    ->where(
                        'first_name',
                        'like',
                        $like
                    )
                    ->orWhere(
                        'last_name',
                        'like',
                        $like
                    )
                    ->orWhere(
                        'email',
                        'like',
                        $like
                    )
                    ->orWhere(
                        'phone',
                        'like',
                        $like
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
     */
    public function getReport(
        array $filters = []
    ): array {
        $query = Booking::query();

        $this->applyFilters(
            $query,
            $filters
        );

        /*
         * Core financial totals.
         */
        $totalBookings = (clone $query)->count();

        $totalAmount = (float) (
            clone $query
        )->sum('total_amount');

        $amountPaid = (float) (
            clone $query
        )->sum('amount_paid');

        $balance = (float) (
            clone $query
        )->sum('balance');

        /*
         * Status breakdown.
         */
        $statusBreakdown = [];

        $statuses = $this->modelConstant(
            'STATUSES',
            [
                Booking::STATUS_PENDING,
                Booking::STATUS_CONFIRMED,
                Booking::STATUS_APPROVED,
                Booking::STATUS_REJECTED,
                Booking::STATUS_CANCELLED,
                Booking::STATUS_COMPLETED,
                Booking::STATUS_EXPIRED,
            ]
        );

        foreach ($statuses as $status) {
            $statusBreakdown[$status] = (clone $query)
                ->where(
                    'status',
                    $status
                )
                ->count();
        }

        /*
         * Payment breakdown.
         */
        $paymentBreakdown = [];

        $paymentStatuses = $this->modelConstant(
            'PAYMENT_STATUSES',
            [
                Booking::PAYMENT_PENDING,
                Booking::PAYMENT_PARTIAL,
                Booking::PAYMENT_PAID,
                Booking::PAYMENT_FAILED,
                Booking::PAYMENT_REFUNDED,
            ]
        );

        foreach ($paymentStatuses as $paymentStatus) {
            $paymentBreakdown[$paymentStatus] = (clone $query)
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

        $bookingTypes = $this->modelConstant(
            'TYPES',
            [
                Booking::TYPE_VIEWING,
                Booking::TYPE_RESERVATION,
                Booking::TYPE_RENTAL,
            ]
        );

        foreach ($bookingTypes as $bookingType) {
            $typeBreakdown[$bookingType] = (clone $query)
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

        $sources = $this->modelConstant(
            'SOURCES',
            [
                Booking::SOURCE_WEBSITE,
                Booking::SOURCE_WALK_IN,
                Booking::SOURCE_AGENT,
                Booking::SOURCE_PHONE,
                Booking::SOURCE_REFERRAL,
                Booking::SOURCE_OTHER,
            ]
        );

        foreach ($sources as $source) {
            $sourceBreakdown[$source] = (clone $query)
                ->where(
                    'source',
                    $source
                )
                ->count();
        }

        /*
         * Date boundaries.
         */
        $firstBookingDate = (clone $query)
            ->whereNotNull('booking_date')
            ->min('booking_date');

        $lastBookingDate = (clone $query)
            ->whereNotNull('booking_date')
            ->max('booking_date');

        /*
         * Completed revenue.
         */
        $completedRevenue = (float) (
            clone $query
        )
            ->where(
                'status',
                Booking::STATUS_COMPLETED
            )
            ->sum('total_amount');

        /*
         * Active booking value.
         */
        $activeValue = (float) (
            clone $query
        )
            ->whereIn(
                'status',
                [
                    Booking::STATUS_CONFIRMED,
                    Booking::STATUS_APPROVED,
                ]
            )
            ->sum('total_amount');

        /*
         * Paid revenue.
         */
        $paidRevenue = (float) (
            clone $query
        )
            ->where(
                'payment_status',
                Booking::PAYMENT_PAID
            )
            ->sum('amount_paid');

        /*
         * Outstanding balance.
         */
        $outstandingBalance = max(
            $balance,
            0
        );

        return [
            'summary' => [
                'total_bookings' => $totalBookings,
                'total_amount' => $totalAmount,
                'amount_paid' => $amountPaid,
                'balance' => $balance,
                'completed_revenue' => $completedRevenue,
                'paid_revenue' => $paidRevenue,
                'active_booking_value' => $activeValue,
                'outstanding_balance' => $outstandingBalance,
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
         * Revenue excludes cancelled and rejected bookings.
         */
        $totalRevenue = (float) (
            clone $query
        )
            ->whereNotIn(
                'status',
                [
                    Booking::STATUS_CANCELLED,
                    Booking::STATUS_REJECTED,
                ]
            )
            ->sum('total_amount');

        /*
         * Current active bookings.
         */
        $today = now()->toDateString();

        $active = (clone $query)
            ->whereIn(
                'status',
                [
                    Booking::STATUS_CONFIRMED,
                    Booking::STATUS_APPROVED,
                ]
            )
            ->where(function (Builder $builder) use ($today) {
                $builder
                    ->whereNull('start_date')
                    ->orWhereDate(
                        'start_date',
                        '<=',
                        $today
                    );
            })
            ->where(function (Builder $builder) use ($today) {
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
         * Bookings that have ended but are not yet expired.
         */
        $ended = (clone $query)
            ->whereIn(
                'status',
                self::ACTIVE_STATUSES
            )
            ->whereNotNull('end_date')
            ->whereDate(
                'end_date',
                '<',
                $today
            )
            ->count();

        /*
         * Outstanding bookings.
         */
        $outstanding = (clone $query)
            ->where('balance', '>', 0)
            ->count();

        return [
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
            'outstanding' => $outstanding,

            'payment_pending' => $paymentPending,
            'payment_partial' => $paymentPartial,
            'payment_paid' => $paymentPaid,
            'payment_failed' => $paymentFailed,
            'payment_refunded' => $paymentRefunded,

            'total_amount' => $totalAmount,
            'total_revenue' => $totalRevenue,
            'total_paid' => $totalPaid,
            'total_balance' => $totalBalance,

            /*
             * Dashboard compatibility aliases.
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
            $this->applySearch(
                $query,
                trim((string) $filters['search'])
            );
        }

        /*
         * Status.
         */
        if (
            isset($filters['status']) &&
            trim((string) $filters['status']) !== ''
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
            trim((string) $filters['payment_status']) !== ''
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
            trim((string) $filters['booking_type']) !== ''
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
            trim((string) $filters['source']) !== ''
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
         * Booking period.
         */
        if (
            isset($filters['start_date']) &&
            trim((string) $filters['start_date']) !== ''
        ) {
            $query->whereDate(
                'start_date',
                '>=',
                $filters['start_date']
            );
        }

        if (
            isset($filters['end_date']) &&
            trim((string) $filters['end_date']) !== ''
        ) {
            $query->whereDate(
                'end_date',
                '<=',
                $filters['end_date']
            );
        }

        /*
         * Booking creation date.
         */
        if (
            isset($filters['booking_date_from']) &&
            trim((string) $filters['booking_date_from']) !== ''
        ) {
            $query->whereDate(
                'booking_date',
                '>=',
                $filters['booking_date_from']
            );
        }

        if (
            isset($filters['booking_date_to']) &&
            trim((string) $filters['booking_date_to']) !== ''
        ) {
            $query->whereDate(
                'booking_date',
                '<=',
                $filters['booking_date_to']
            );
        }

        /*
         * Paid date.
         */
        if (
            isset($filters['paid_date_from']) &&
            trim((string) $filters['paid_date_from']) !== ''
        ) {
            $query->whereDate(
                'paid_at',
                '>=',
                $filters['paid_date_from']
            );
        }

        if (
            isset($filters['paid_date_to']) &&
            trim((string) $filters['paid_date_to']) !== ''
        ) {
            $query->whereDate(
                'paid_at',
                '<=',
                $filters['paid_date_to']
            );
        }

        /*
         * Include soft-deleted bookings.
         *
         * `only_trashed` takes precedence.
         */
        if (
            isset($filters['only_trashed']) &&
            $this->isTruthy($filters['only_trashed'])
        ) {
            $query->onlyTrashed();

            return;
        }

        if (
            isset($filters['with_trashed']) &&
            $this->isTruthy($filters['with_trashed'])
        ) {
            $query->withTrashed();
        }
    }
}