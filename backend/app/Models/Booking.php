<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class Booking extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    protected $table = 'bookings';

    /*
    |--------------------------------------------------------------------------
    | STATUS CONSTANTS
    |--------------------------------------------------------------------------
    */

    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_EXPIRED = 'expired';

    /*
    |--------------------------------------------------------------------------
    | PAYMENT STATUS CONSTANTS
    |--------------------------------------------------------------------------
    */

    public const PAYMENT_PENDING = 'pending';
    public const PAYMENT_PARTIAL = 'partial';
    public const PAYMENT_PAID = 'paid';
    public const PAYMENT_FAILED = 'failed';
    public const PAYMENT_REFUNDED = 'refunded';

    /*
    |--------------------------------------------------------------------------
    | BOOKING TYPE CONSTANTS
    |--------------------------------------------------------------------------
    */

    public const TYPE_VIEWING = 'viewing';
    public const TYPE_RESERVATION = 'reservation';
    public const TYPE_RENTAL = 'rental';

    /*
    |--------------------------------------------------------------------------
    | BOOKING SOURCE CONSTANTS
    |--------------------------------------------------------------------------
    */

    public const SOURCE_WEBSITE = 'website';
    public const SOURCE_WALK_IN = 'walk_in';
    public const SOURCE_AGENT = 'agent';
    public const SOURCE_PHONE = 'phone';
    public const SOURCE_REFERRAL = 'referral';
    public const SOURCE_OTHER = 'other';

    /*
    |--------------------------------------------------------------------------
    | STATUS LISTS
    |--------------------------------------------------------------------------
    */

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONFIRMED,
        self::STATUS_APPROVED,
        self::STATUS_REJECTED,
        self::STATUS_CANCELLED,
        self::STATUS_COMPLETED,
        self::STATUS_EXPIRED,
    ];

    public const PAYMENT_STATUSES = [
        self::PAYMENT_PENDING,
        self::PAYMENT_PARTIAL,
        self::PAYMENT_PAID,
        self::PAYMENT_FAILED,
        self::PAYMENT_REFUNDED,
    ];

    public const TYPES = [
        self::TYPE_VIEWING,
        self::TYPE_RESERVATION,
        self::TYPE_RENTAL,
    ];

    public const SOURCES = [
        self::SOURCE_WEBSITE,
        self::SOURCE_WALK_IN,
        self::SOURCE_AGENT,
        self::SOURCE_PHONE,
        self::SOURCE_REFERRAL,
        self::SOURCE_OTHER,
    ];

    /*
    |--------------------------------------------------------------------------
    | MASS ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        /*
        | Identification
        */

        'booking_number',
        'reference',
        'slug',

        /*
        | Relationships
        */

        'user_id',
        'customer_id',
        'tenant_id',
        'property_id',
        'apartment_id',
        'unit_id',
        'tenancy_id',

        /*
        | Booking details
        */

        'booking_type',
        'status',
        'payment_status',
        'source',

        /*
        | Dates
        */

        'booking_date',
        'start_date',
        'end_date',
        'check_in_date',
        'check_out_date',

        /*
        | Workflow timestamps
        */

        'confirmed_at',
        'approved_at',
        'rejected_at',
        'cancelled_at',
        'completed_at',

        /*
        | Customer snapshot
        */

        'first_name',
        'last_name',
        'email',
        'phone',

        /*
        | Financial details
        */

        'rent_amount',
        'deposit_amount',
        'service_charge',
        'booking_fee',
        'discount_amount',
        'total_amount',
        'amount_paid',
        'balance',

        /*
        | Guest details
        */

        'number_of_adults',
        'number_of_children',

        /*
        | Requests / notes
        */

        'special_requests',
        'notes',
        'rejection_reason',
        'cancellation_reason',

        /*
        | Payment details
        */

        'payment_method',
        'payment_reference',
        'paid_at',

        /*
        | SEO
        */

        'meta_title',
        'meta_description',

        /*
        | Extra metadata
        */

        'metadata',
    ];

    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            /*
            | Dates
            */

            'booking_date' => 'datetime',

            'start_date' => 'date',
            'end_date' => 'date',

            'check_in_date' => 'date',
            'check_out_date' => 'date',

            'confirmed_at' => 'datetime',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'completed_at' => 'datetime',

            'paid_at' => 'datetime',

            /*
            | Financial values
            */

            'rent_amount' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'service_charge' => 'decimal:2',
            'booking_fee' => 'decimal:2',
            'discount_amount' => 'decimal:2',

            'total_amount' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'balance' => 'decimal:2',

            /*
            | Guest counts
            */

            'number_of_adults' => 'integer',
            'number_of_children' => 'integer',

            /*
            | Metadata
            */

            'metadata' => 'array',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | MODEL BOOT
    |--------------------------------------------------------------------------
    */

    protected static function booted(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Creating
        |--------------------------------------------------------------------------
        */

        static::creating(function (Booking $booking): void {
            /*
            | Generate booking number
            */

            if (blank($booking->booking_number)) {
                $booking->booking_number = 'BK-' . strtoupper(
                    Str::random(10)
                );
            }

            /*
            | Generate reference
            */

            if (blank($booking->reference)) {
                $booking->reference = strtoupper(
                    Str::random(12)
                );
            }

            /*
            | Generate slug
            */

            if (blank($booking->slug)) {
                $booking->slug = Str::slug(
                    $booking->booking_number
                );
            }

            /*
            | Defaults
            */

            $booking->status ??= self::STATUS_PENDING;

            $booking->payment_status ??= self::PAYMENT_PENDING;

            $booking->booking_type ??= self::TYPE_RESERVATION;

            $booking->source ??= self::SOURCE_OTHER;

            $booking->booking_date ??= now();

            $booking->number_of_adults ??= 1;

            $booking->number_of_children ??= 0;

            /*
            | Financial defaults
            */

            $booking->rent_amount ??= 0;
            $booking->deposit_amount ??= 0;
            $booking->service_charge ??= 0;
            $booking->booking_fee ??= 0;
            $booking->discount_amount ??= 0;
            $booking->amount_paid ??= 0;

            /*
            | Calculate financial totals
            |
            | BookingService remains responsible for the
            | authoritative business validation.
            */

            $booking->total_amount =
                $booking->calculateTotalAmount();

            $booking->balance =
                $booking->calculateBalance();
        });

        /*
        |--------------------------------------------------------------------------
        | Updating
        |--------------------------------------------------------------------------
        */

        static::updating(function (Booking $booking): void {
            /*
            | Recalculate total when financial components change.
            */

            if (
                $booking->isDirty('rent_amount') ||
                $booking->isDirty('deposit_amount') ||
                $booking->isDirty('service_charge') ||
                $booking->isDirty('booking_fee') ||
                $booking->isDirty('discount_amount')
            ) {
                $booking->total_amount =
                    $booking->calculateTotalAmount();
            }

            /*
            | Recalculate balance when payment-related values change.
            */

            if (
                $booking->isDirty('total_amount') ||
                $booking->isDirty('amount_paid')
            ) {
                $booking->balance =
                    $booking->calculateBalance();
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | USER / CUSTOMER / TENANT RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * Authenticated user who created the booking.
     *
     * bookings.user_id -> users.id
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }

    /**
     * Customer associated with the booking.
     *
     * bookings.customer_id -> users.id
     *
     * This is the authoritative customer relationship.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'customer_id'
        );
    }

    /**
     * Customer user alias.
     *
     * This supports code that explicitly calls:
     *
     *     customerUser
     *
     * bookings.customer_id -> users.id
     */
    public function customerUser(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'customer_id'
        );
    }

    /**
     * Customer user compatibility alias.
     *
     * This supports Laravel relationship references such as:
     *
     *     customer_user
     *
     * when used by existing repository/resource/service code.
     *
     * bookings.customer_id -> users.id
     */
    public function customer_user(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'customer_id'
        );
    }

    /**
     * Tenant profile associated with the booking.
     *
     * bookings.tenant_id -> tenants.id
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(
            Tenant::class,
            'tenant_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * Property associated with the booking.
     *
     * bookings.property_id -> properties.id
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(
            Property::class,
            'property_id'
        );
    }

    /**
     * Apartment associated with the booking.
     *
     * bookings.apartment_id -> apartments.id
     */
    public function apartment(): BelongsTo
    {
        return $this->belongsTo(
            Apartment::class,
            'apartment_id'
        );
    }

    /**
     * Unit associated with the booking.
     *
     * bookings.unit_id -> units.id
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(
            Unit::class,
            'unit_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TENANCY RELATIONSHIP
    |--------------------------------------------------------------------------
    */

    /**
     * Tenancy associated with the booking.
     *
     * bookings.tenancy_id -> tenancies.id
     */
    public function tenancy(): BelongsTo
    {
        return $this->belongsTo(
            Tenancy::class,
            'tenancy_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | FINANCIAL HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Calculate booking total.
     *
     * Total =
     * rent
     * + deposit
     * + service charge
     * + booking fee
     * - discount
     */
    public function calculateTotalAmount(): float
    {
        $rent = (float) ($this->rent_amount ?? 0);

        $deposit = (float) ($this->deposit_amount ?? 0);

        $serviceCharge = (float) ($this->service_charge ?? 0);

        $bookingFee = (float) ($this->booking_fee ?? 0);

        $discount = (float) ($this->discount_amount ?? 0);

        return max(
            0,
            $rent
                + $deposit
                + $serviceCharge
                + $bookingFee
                - $discount
        );
    }

    /**
     * Calculate outstanding balance.
     */
    public function calculateBalance(): float
    {
        $total = (float) ($this->total_amount ?? 0);

        $paid = (float) ($this->amount_paid ?? 0);

        return max(
            0,
            $total - $paid
        );
    }

    public function hasBalance(): bool
    {
        return $this->calculateBalance() > 0;
    }

    public function isFullyPaid(): bool
    {
        $total = (float) ($this->total_amount ?? 0);

        $paid = (float) ($this->amount_paid ?? 0);

        return $total > 0 && $paid >= $total;
    }

    public function isPartiallyPaid(): bool
    {
        $paid = (float) ($this->amount_paid ?? 0);

        $total = (float) ($this->total_amount ?? 0);

        return $total > 0
            && $paid > 0
            && $paid < $total;
    }

    public function isPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_PAID
            || $this->isFullyPaid();
    }

    public function isPaymentPending(): bool
    {
        return $this->payment_status === self::PAYMENT_PENDING;
    }

    public function isPaymentFailed(): bool
    {
        return $this->payment_status === self::PAYMENT_FAILED;
    }

    public function isRefunded(): bool
    {
        return $this->payment_status === self::PAYMENT_REFUNDED;
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS HELPERS
    |--------------------------------------------------------------------------
    */

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isConfirmed(): bool
    {
        return $this->status === self::STATUS_CONFIRMED;
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isExpired(): bool
    {
        return $this->status === self::STATUS_EXPIRED;
    }

    /**
     * Active workflow statuses.
     */
    public function isActive(): bool
    {
        return in_array(
            $this->status,
            [
                self::STATUS_CONFIRMED,
                self::STATUS_APPROVED,
            ],
            true
        );
    }

    /**
     * Terminal workflow statuses.
     */
    public function isTerminal(): bool
    {
        return in_array(
            $this->status,
            [
                self::STATUS_REJECTED,
                self::STATUS_CANCELLED,
                self::STATUS_COMPLETED,
                self::STATUS_EXPIRED,
            ],
            true
        );
    }

    public function canBeCancelled(): bool
    {
        return in_array(
            $this->status,
            [
                self::STATUS_PENDING,
                self::STATUS_CONFIRMED,
                self::STATUS_APPROVED,
            ],
            true
        );
    }

    public function canBeConfirmed(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function canBeApproved(): bool
    {
        return in_array(
            $this->status,
            [
                self::STATUS_PENDING,
                self::STATUS_CONFIRMED,
            ],
            true
        );
    }

    public function canBeCompleted(): bool
    {
        return in_array(
            $this->status,
            [
                self::STATUS_CONFIRMED,
                self::STATUS_APPROVED,
            ],
            true
        );
    }

    /*
    |--------------------------------------------------------------------------
    | BOOKING TYPE HELPERS
    |--------------------------------------------------------------------------
    */

    public function isViewing(): bool
    {
        return $this->booking_type === self::TYPE_VIEWING;
    }

    public function isReservation(): bool
    {
        return $this->booking_type === self::TYPE_RESERVATION;
    }

    public function isRental(): bool
    {
        return $this->booking_type === self::TYPE_RENTAL;
    }

    /*
    |--------------------------------------------------------------------------
    | DATE HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the booking has ended.
     */
    public function hasEnded(): bool
    {
        if (!$this->end_date) {
            return false;
        }

        return $this->end_date->isBefore(
            now()->startOfDay()
        );
    }

    /**
     * Determine whether the booking starts today.
     */
    public function startsToday(): bool
    {
        if (!$this->start_date) {
            return false;
        }

        return $this->start_date->isToday();
    }

    /**
     * Determine whether today falls within the booking period.
     */
    public function isWithinBookingPeriod(): bool
    {
        $today = now()->startOfDay();

        if (!$this->start_date) {
            return false;
        }

        return $this->start_date->lte($today)
            && (
                !$this->end_date ||
                $this->end_date->gte($today)
            );
    }

    /**
     * Determine whether this booking overlaps a requested period.
     */
    public function overlapsDates(
        $startDate,
        $endDate
    ): bool {
        if (!$this->start_date) {
            return false;
        }

        $requestedStart = Carbon::parse($startDate);

        $requestedEnd = Carbon::parse($endDate);

        $bookingStart = $this->start_date;

        $bookingEnd = $this->end_date
            ?? $this->start_date;

        return $bookingStart->lte($requestedEnd)
            && $bookingEnd->gte($requestedStart);
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Customer display name.
     *
     * Priority:
     *
     * 1. Customer relationship
     * 2. Customer snapshot
     * 3. Tenant user
     * 4. Booking creator
     * 5. Guest
     */
    public function getCustomerNameAttribute(): string
    {
        /*
        |--------------------------------------------------------------------------
        | Authoritative customer relationship
        |--------------------------------------------------------------------------
        */

        if ($this->customer) {
            $name = trim(
                ($this->customer->first_name ?? '') .
                ' ' .
                ($this->customer->last_name ?? '')
            );

            if ($name !== '') {
                return $name;
            }

            if (!empty($this->customer->name)) {
                return $this->customer->name;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Historical customer snapshot
        |--------------------------------------------------------------------------
        */

        $snapshotName = trim(
            ($this->first_name ?? '') .
            ' ' .
            ($this->last_name ?? '')
        );

        if ($snapshotName !== '') {
            return $snapshotName;
        }

        /*
        |--------------------------------------------------------------------------
        | Tenant fallback
        |--------------------------------------------------------------------------
        */

        if ($this->tenant?->user) {
            $tenantName = trim(
                ($this->tenant->user->first_name ?? '') .
                ' ' .
                ($this->tenant->user->last_name ?? '')
            );

            if ($tenantName !== '') {
                return $tenantName;
            }

            if (!empty($this->tenant->user->name)) {
                return $this->tenant->user->name;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Creator fallback
        |--------------------------------------------------------------------------
        */

        if ($this->user) {
            $creatorName = trim(
                ($this->user->first_name ?? '') .
                ' ' .
                ($this->user->last_name ?? '')
            );

            if ($creatorName !== '') {
                return $creatorName;
            }

            if (!empty($this->user->name)) {
                return $this->user->name;
            }
        }

        return 'Guest';
    }

    /**
     * Human-readable booking status.
     */
    public function getStatusLabelAttribute(): string
    {
        return Str::headline(
            $this->status ?? self::STATUS_PENDING
        );
    }

    /**
     * Human-readable payment status.
     */
    public function getPaymentStatusLabelAttribute(): string
    {
        return Str::headline(
            $this->payment_status ?? self::PAYMENT_PENDING
        );
    }

    /**
     * Human-readable booking type.
     */
    public function getBookingTypeLabelAttribute(): string
    {
        return Str::headline(
            $this->booking_type ?? self::TYPE_RESERVATION
        );
    }

    /**
     * Human-readable booking source.
     */
    public function getSourceLabelAttribute(): string
    {
        return Str::headline(
            $this->source ?? self::SOURCE_OTHER
        );
    }

    /**
     * Display booking reference.
     */
    public function getDisplayReferenceAttribute(): string
    {
        return $this->booking_number
            ?: $this->reference
            ?: 'N/A';
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES — STATUS
    |--------------------------------------------------------------------------
    */

    public function scopePending(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_PENDING
        );
    }

    public function scopeConfirmed(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_CONFIRMED
        );
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_APPROVED
        );
    }

    public function scopeRejected(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_REJECTED
        );
    }

    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_CANCELLED
        );
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_COMPLETED
        );
    }

    public function scopeExpired(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_EXPIRED
        );
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES — PAYMENT
    |--------------------------------------------------------------------------
    */

    public function scopePaid(Builder $query): Builder
    {
        return $query->where(
            'payment_status',
            self::PAYMENT_PAID
        );
    }

    public function scopePartiallyPaid(Builder $query): Builder
    {
        return $query->where(
            'payment_status',
            self::PAYMENT_PARTIAL
        );
    }

    public function scopePaymentPending(Builder $query): Builder
    {
        return $query->where(
            'payment_status',
            self::PAYMENT_PENDING
        );
    }

    public function scopePaymentFailed(Builder $query): Builder
    {
        return $query->where(
            'payment_status',
            self::PAYMENT_FAILED
        );
    }

    public function scopeRefunded(Builder $query): Builder
    {
        return $query->where(
            'payment_status',
            self::PAYMENT_REFUNDED
        );
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES — BOOKING TYPE
    |--------------------------------------------------------------------------
    */

    public function scopeViewing(Builder $query): Builder
    {
        return $query->where(
            'booking_type',
            self::TYPE_VIEWING
        );
    }

    public function scopeReservation(Builder $query): Builder
    {
        return $query->where(
            'booking_type',
            self::TYPE_RESERVATION
        );
    }

    public function scopeRental(Builder $query): Builder
    {
        return $query->where(
            'booking_type',
            self::TYPE_RENTAL
        );
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES — PROPERTY
    |--------------------------------------------------------------------------
    */

    public function scopeForProperty(
        Builder $query,
        int $propertyId
    ): Builder {
        return $query->where(
            'property_id',
            $propertyId
        );
    }

    public function scopeForApartment(
        Builder $query,
        int $apartmentId
    ): Builder {
        return $query->where(
            'apartment_id',
            $apartmentId
        );
    }

    public function scopeForUnit(
        Builder $query,
        int $unitId
    ): Builder {
        return $query->where(
            'unit_id',
            $unitId
        );
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES — CUSTOMER / TENANT / TENANCY
    |--------------------------------------------------------------------------
    */

    public function scopeForCustomer(
        Builder $query,
        int $customerId
    ): Builder {
        return $query->where(
            'customer_id',
            $customerId
        );
    }

    public function scopeForTenant(
        Builder $query,
        int $tenantId
    ): Builder {
        return $query->where(
            'tenant_id',
            $tenantId
        );
    }

    public function scopeForTenancy(
        Builder $query,
        int $tenancyId
    ): Builder {
        return $query->where(
            'tenancy_id',
            $tenancyId
        );
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES — DATE RANGE
    |--------------------------------------------------------------------------
    */

    /**
     * Bookings overlapping a date range.
     */
    public function scopeOverlapping(
        Builder $query,
        $startDate,
        $endDate
    ): Builder {
        return $query->where(function (
            Builder $query
        ) use (
            $startDate,
            $endDate
        ) {
            $query
                ->whereDate(
                    'start_date',
                    '<=',
                    $endDate
                )
                ->where(function (
                    Builder $query
                ) use (
                    $startDate
                ) {
                    $query
                        ->whereDate(
                            'end_date',
                            '>=',
                            $startDate
                        )
                        ->orWhereNull(
                            'end_date'
                        );
                });
        });
    }

    /**
     * Bookings that have ended.
     */
    public function scopeEnded(
        Builder $query
    ): Builder {
        return $query
            ->whereNotNull('end_date')
            ->whereDate(
                'end_date',
                '<',
                now()->toDateString()
            );
    }

    /**
     * Bookings starting today.
     */
    public function scopeStartingToday(
        Builder $query
    ): Builder {
        return $query->whereDate(
            'start_date',
            now()->toDateString()
        );
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES — ACTIVE BOOKINGS
    |--------------------------------------------------------------------------
    */

    /**
     * Active bookings.
     *
     * Confirmed and approved bookings occupy the unit.
     */
    public function scopeActive(
        Builder $query
    ): Builder {
        return $query->whereIn(
            'status',
            [
                self::STATUS_CONFIRMED,
                self::STATUS_APPROVED,
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES — SEARCH
    |--------------------------------------------------------------------------
    */

    public function scopeSearch(
        Builder $query,
        ?string $search
    ): Builder {
        if (!$search) {
            return $query;
        }

        $search = trim($search);

        if ($search === '') {
            return $query;
        }

        return $query->where(function (
            Builder $query
        ) use (
            $search
        ) {
            $query
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
                );
        });
    }
}