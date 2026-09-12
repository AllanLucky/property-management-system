<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
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
    |
    | These values are optional. Keep them here so the service/request layer
    | can validate against one centralized list.
    |
    */

    public const SOURCE_WEBSITE = 'website';
    public const SOURCE_WALK_IN = 'walk_in';
    public const SOURCE_AGENT = 'agent';
    public const SOURCE_PHONE = 'phone';
    public const SOURCE_REFERRAL = 'referral';
    public const SOURCE_OTHER = 'other';

    /*
    |--------------------------------------------------------------------------
    | STATUS LIST
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

    /*
    |--------------------------------------------------------------------------
    | PAYMENT STATUS LIST
    |--------------------------------------------------------------------------
    */

    public const PAYMENT_STATUSES = [
        self::PAYMENT_PENDING,
        self::PAYMENT_PARTIAL,
        self::PAYMENT_PAID,
        self::PAYMENT_FAILED,
        self::PAYMENT_REFUNDED,
    ];

    /*
    |--------------------------------------------------------------------------
    | BOOKING TYPE LIST
    |--------------------------------------------------------------------------
    */

    public const TYPES = [
        self::TYPE_VIEWING,
        self::TYPE_RESERVATION,
        self::TYPE_RENTAL,
    ];

    /*
    |--------------------------------------------------------------------------
    | BOOKING SOURCE LIST
    |--------------------------------------------------------------------------
    */

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
        |--------------------------------------------------------------------------
        | IDENTIFICATION
        |--------------------------------------------------------------------------
        */

        'booking_number',
        'reference',
        'slug',

        /*
        |--------------------------------------------------------------------------
        | RELATIONSHIPS
        |--------------------------------------------------------------------------
        */

        'user_id',
        'customer_id',
        'tenant_id',

        'property_id',
        'apartment_id',
        'unit_id',

        'tenancy_id',

        /*
        |--------------------------------------------------------------------------
        | BOOKING DETAILS
        |--------------------------------------------------------------------------
        */

        'booking_type',
        'status',
        'payment_status',
        'source',

        /*
        |--------------------------------------------------------------------------
        | DATES
        |--------------------------------------------------------------------------
        */

        'booking_date',
        'start_date',
        'end_date',

        'check_in_date',
        'check_out_date',

        'confirmed_at',
        'approved_at',
        'rejected_at',
        'cancelled_at',
        'completed_at',

        /*
        |--------------------------------------------------------------------------
        | CUSTOMER SNAPSHOT
        |--------------------------------------------------------------------------
        |
        | These fields preserve the customer information that existed at the
        | time the booking was created.
        |
        */

        'first_name',
        'last_name',
        'email',
        'phone',

        /*
        |--------------------------------------------------------------------------
        | FINANCIAL DETAILS
        |--------------------------------------------------------------------------
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
        |--------------------------------------------------------------------------
        | GUEST / REQUEST DETAILS
        |--------------------------------------------------------------------------
        */

        'number_of_adults',
        'number_of_children',

        'special_requests',
        'notes',

        'rejection_reason',
        'cancellation_reason',

        /*
        |--------------------------------------------------------------------------
        | PAYMENT DETAILS
        |--------------------------------------------------------------------------
        */

        'payment_method',
        'payment_reference',
        'paid_at',

        /*
        |--------------------------------------------------------------------------
        | SEO / META
        |--------------------------------------------------------------------------
        */

        'meta_title',
        'meta_description',
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
            |--------------------------------------------------------------------------
            | Dates
            |--------------------------------------------------------------------------
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
            |--------------------------------------------------------------------------
            | Financial
            |--------------------------------------------------------------------------
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
            |--------------------------------------------------------------------------
            | Guest Numbers
            |--------------------------------------------------------------------------
            */

            'number_of_adults' => 'integer',
            'number_of_children' => 'integer',

            /*
            |--------------------------------------------------------------------------
            | Metadata
            |--------------------------------------------------------------------------
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
            |----------------------------------------------------------------------
            | Generate booking number
            |----------------------------------------------------------------------
            */

            if (empty($booking->booking_number)) {
                $booking->booking_number = 'BK-' . strtoupper(
                    Str::random(10)
                );
            }

            /*
            |----------------------------------------------------------------------
            | Generate public reference
            |----------------------------------------------------------------------
            */

            if (empty($booking->reference)) {
                $booking->reference = strtoupper(
                    Str::random(12)
                );
            }

            /*
            |----------------------------------------------------------------------
            | Generate slug
            |----------------------------------------------------------------------
            */

            if (empty($booking->slug)) {
                $booking->slug = Str::slug(
                    $booking->booking_number
                );
            }

            /*
            |----------------------------------------------------------------------
            | Default status
            |----------------------------------------------------------------------
            */

            if (empty($booking->status)) {
                $booking->status = self::STATUS_PENDING;
            }

            /*
            |----------------------------------------------------------------------
            | Default payment status
            |----------------------------------------------------------------------
            */

            if (empty($booking->payment_status)) {
                $booking->payment_status = self::PAYMENT_PENDING;
            }

            /*
            |----------------------------------------------------------------------
            | Default booking type
            |----------------------------------------------------------------------
            */

            if (empty($booking->booking_type)) {
                $booking->booking_type = self::TYPE_RESERVATION;
            }

            /*
            |----------------------------------------------------------------------
            | Default booking date
            |----------------------------------------------------------------------
            */

            if (empty($booking->booking_date)) {
                $booking->booking_date = now();
            }

            /*
            |----------------------------------------------------------------------
            | Default guest counts
            |----------------------------------------------------------------------
            */

            if (is_null($booking->number_of_adults)) {
                $booking->number_of_adults = 1;
            }

            if (is_null($booking->number_of_children)) {
                $booking->number_of_children = 0;
            }

            /*
            |----------------------------------------------------------------------
            | Default financial values
            |----------------------------------------------------------------------
            */

            $booking->rent_amount = $booking->rent_amount ?? 0;
            $booking->deposit_amount = $booking->deposit_amount ?? 0;
            $booking->service_charge = $booking->service_charge ?? 0;
            $booking->booking_fee = $booking->booking_fee ?? 0;
            $booking->discount_amount = $booking->discount_amount ?? 0;

            /*
            |----------------------------------------------------------------------
            | Calculate total
            |----------------------------------------------------------------------
            */

            if (is_null($booking->total_amount)) {
                $booking->total_amount = $booking->calculateTotalAmount();
            }

            /*
            |----------------------------------------------------------------------
            | Default amount paid
            |----------------------------------------------------------------------
            */

            if (is_null($booking->amount_paid)) {
                $booking->amount_paid = 0;
            }

            /*
            |----------------------------------------------------------------------
            | Calculate balance
            |----------------------------------------------------------------------
            */

            $booking->balance = $booking->calculateBalance();
        });

        /*
        |--------------------------------------------------------------------------
        | Updating
        |--------------------------------------------------------------------------
        */

        static::updating(function (Booking $booking): void {

            /*
            |----------------------------------------------------------------------
            | Recalculate total when financial components change
            |----------------------------------------------------------------------
            */

            if (
                $booking->isDirty('rent_amount') ||
                $booking->isDirty('deposit_amount') ||
                $booking->isDirty('service_charge') ||
                $booking->isDirty('booking_fee') ||
                $booking->isDirty('discount_amount')
            ) {
                $booking->total_amount = $booking->calculateTotalAmount();
            }

            /*
            |----------------------------------------------------------------------
            | Recalculate balance
            |----------------------------------------------------------------------
            */

            if (
                $booking->isDirty('total_amount') ||
                $booking->isDirty('amount_paid') ||
                $booking->isDirty('payment_status')
            ) {
                $booking->balance = $booking->calculateBalance();
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | USER / CUSTOMER RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * User who created or owns the booking.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Customer associated with the booking.
     *
     * customer_id points to the users table.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'customer_id'
        );
    }

    /**
     * Tenant associated with the booking.
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
     * Property being booked.
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(
            Property::class,
            'property_id'
        );
    }

    /**
     * Apartment being booked.
     */
    public function apartment(): BelongsTo
    {
        return $this->belongsTo(
            Apartment::class,
            'apartment_id'
        );
    }

    /**
     * Unit being booked.
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
     * Tenancy created from this booking.
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
     * Calculate the booking total.
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

    /**
     * Determine whether the booking has an outstanding balance.
     */
    public function hasBalance(): bool
    {
        return $this->calculateBalance() > 0;
    }

    /**
     * Determine whether the booking has been fully paid.
     */
    public function isPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_PAID;
    }

    /**
     * Determine whether the booking has been partially paid.
     */
    public function isPartiallyPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_PARTIAL;
    }

    /**
     * Determine whether payment is pending.
     */
    public function isPaymentPending(): bool
    {
        return $this->payment_status === self::PAYMENT_PENDING;
    }

    /**
     * Determine whether payment failed.
     */
    public function isPaymentFailed(): bool
    {
        return $this->payment_status === self::PAYMENT_FAILED;
    }

    /**
     * Determine whether the payment was refunded.
     */
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
     * Determine whether the booking is in an active workflow state.
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
     * Determine whether the booking is in a terminal state.
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

    /**
     * Determine whether this booking can be cancelled.
     */
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

    /**
     * Determine whether this booking can be confirmed.
     */
    public function canBeConfirmed(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Determine whether this booking can be approved.
     */
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

    /**
     * Determine whether this booking can be completed.
     */
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
     * Determine whether the booking dates have expired.
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
     * Determine whether the booking is currently within its booking period.
     */
    public function isWithinBookingPeriod(): bool
    {
        $today = now()->startOfDay();

        if (!$this->start_date) {
            return false;
        }

        if (
            $this->start_date->lte($today) &&
            (
                !$this->end_date ||
                $this->end_date->gte($today)
            )
        ) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the booking overlaps the supplied date range.
     *
     * Used by the service/repository layer when checking unit availability.
     */
    public function overlapsDates(
        $startDate,
        $endDate
    ): bool {
        if (!$this->start_date) {
            return false;
        }

        $requestedStart = \Illuminate\Support\Carbon::parse(
            $startDate
        );

        $requestedEnd = \Illuminate\Support\Carbon::parse(
            $endDate
        );

        $bookingStart = $this->start_date;
        $bookingEnd = $this->end_date ?? $this->start_date;

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
     */
    public function getCustomerNameAttribute(): string
    {
        $name = trim(
            ($this->first_name ?? '') .
            ' ' .
            ($this->last_name ?? '')
        );

        if ($name !== '') {
            return $name;
        }

        if ($this->tenant) {
            $tenantName = trim(
                ($this->tenant->user?->first_name ?? '') .
                ' ' .
                ($this->tenant->user?->last_name ?? '')
            );

            if ($tenantName !== '') {
                return $tenantName;
            }
        }

        return $this->customer?->name
            ?? $this->user?->name
            ?? 'Guest';
    }

    /**
     * Status label.
     */
    public function getStatusLabelAttribute(): string
    {
        return Str::headline(
            $this->status ?? self::STATUS_PENDING
        );
    }

    /**
     * Payment status label.
     */
    public function getPaymentStatusLabelAttribute(): string
    {
        return Str::headline(
            $this->payment_status ?? self::PAYMENT_PENDING
        );
    }

    /**
     * Booking type label.
     */
    public function getBookingTypeLabelAttribute(): string
    {
        return Str::headline(
            $this->booking_type ?? self::TYPE_RESERVATION
        );
    }

    /**
     * Source label.
     */
    public function getSourceLabelAttribute(): string
    {
        return Str::headline(
            $this->source ?? self::SOURCE_OTHER
        );
    }

    /**
     * Formatted booking number.
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
    | QUERY SCOPES — CUSTOMER / TENANT
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

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES — DATE RANGE
    |--------------------------------------------------------------------------
    */

    /**
     * Bookings that overlap a date range.
     *
     * Example:
     * Booking::overlapping($startDate, $endDate)->get();
     */
    public function scopeOverlapping(
        Builder $query,
        $startDate,
        $endDate
    ): Builder {
        return $query
            ->where(function (Builder $query) use (
                $startDate,
                $endDate
            ) {
                $query
                    ->whereDate(
                        'start_date',
                        '<=',
                        $endDate
                    )
                    ->where(function (Builder $query) use (
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
     * Bookings that have already ended.
     */
    public function scopeEnded(Builder $query): Builder
    {
        return $query->whereNotNull(
            'end_date'
        )->whereDate(
            'end_date',
            '<',
            now()->toDateString()
        );
    }

    /**
     * Bookings starting today.
     */
    public function scopeStartingToday(Builder $query): Builder
    {
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

    public function scopeActive(Builder $query): Builder
    {
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

    /**
     * Search bookings by common booking/customer identifiers.
     */
    public function scopeSearch(
        Builder $query,
        ?string $search
    ): Builder {
        if (!$search) {
            return $query;
        }

        $search = trim($search);

        return $query->where(function (Builder $query) use (
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