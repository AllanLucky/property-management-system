<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
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

    public const STATUS_PENDING   = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_APPROVED  = 'approved';
    public const STATUS_REJECTED  = 'rejected';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_EXPIRED   = 'expired';

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
        | CUSTOMER DETAILS
        |--------------------------------------------------------------------------
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
        | REQUEST DETAILS
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
        | META
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
            | Dates
            */
            'booking_date'   => 'datetime',
            'start_date'     => 'date',
            'end_date'       => 'date',
            'check_in_date'  => 'date',
            'check_out_date' => 'date',

            'confirmed_at' => 'datetime',
            'approved_at'  => 'datetime',
            'rejected_at'  => 'datetime',
            'cancelled_at' => 'datetime',
            'completed_at' => 'datetime',
            'paid_at'      => 'datetime',

            /*
            | Financial
            */
            'rent_amount'      => 'decimal:2',
            'deposit_amount'   => 'decimal:2',
            'service_charge'   => 'decimal:2',
            'booking_fee'      => 'decimal:2',
            'discount_amount'  => 'decimal:2',
            'total_amount'     => 'decimal:2',
            'amount_paid'      => 'decimal:2',
            'balance'          => 'decimal:2',

            /*
            | Numbers
            */
            'number_of_adults'   => 'integer',
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
        static::creating(function (Booking $booking) {
            if (empty($booking->booking_number)) {
                $booking->booking_number = 'BK-' . strtoupper(
                    Str::random(10)
                );
            }

            if (empty($booking->reference)) {
                $booking->reference = strtoupper(
                    Str::random(12)
                );
            }

            if (empty($booking->slug)) {
                $booking->slug = Str::slug(
                    $booking->booking_number
                );
            }

            if (is_null($booking->amount_paid)) {
                $booking->amount_paid = 0;
            }

            if (is_null($booking->balance)) {
                $booking->balance = max(
                    0,
                    (float) ($booking->total_amount ?? 0)
                    - (float) $booking->amount_paid
                );
            }
        });

        static::updating(function (Booking $booking) {
            if ($booking->isDirty('total_amount') ||
                $booking->isDirty('amount_paid')) {

                $booking->balance = max(
                    0,
                    (float) ($booking->total_amount ?? 0)
                    - (float) ($booking->amount_paid ?? 0)
                );
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | USER / CUSTOMER RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * User who created the booking.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Customer associated with the booking.
     *
     * Uses customer_id when your users table is the customer source.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    /**
     * Tenant associated with the booking.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
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
        return $this->belongsTo(Property::class);
    }

    /**
     * Apartment being booked.
     */
    public function apartment(): BelongsTo
    {
        return $this->belongsTo(Apartment::class);
    }

    /**
     * Unit being booked.
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
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
        return $this->belongsTo(Tenancy::class);
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

    /*
    |--------------------------------------------------------------------------
    | PAYMENT HELPERS
    |--------------------------------------------------------------------------
    */

    public function isPaymentPending(): bool
    {
        return $this->payment_status === self::PAYMENT_PENDING;
    }

    public function isPartiallyPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_PARTIAL;
    }

    public function isPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_PAID;
    }

    public function hasBalance(): bool
    {
        return (float) $this->balance > 0;
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
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    public function getCustomerNameAttribute(): string
    {
        $name = trim(
            ($this->first_name ?? '') . ' ' .
            ($this->last_name ?? '')
        );

        if ($name !== '') {
            return $name;
        }

        return $this->customer?->name
            ?? $this->user?->name
            ?? 'Guest';
    }

    public function getStatusLabelAttribute(): string
    {
        return Str::headline($this->status ?? 'pending');
    }

    public function getPaymentStatusLabelAttribute(): string
    {
        return Str::headline(
            $this->payment_status ?? 'pending'
        );
    }

    public function getBookingTypeLabelAttribute(): string
    {
        return Str::headline(
            $this->booking_type ?? self::TYPE_RESERVATION
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopePending($query)
    {
        return $query->where(
            'status',
            self::STATUS_PENDING
        );
    }

    public function scopeConfirmed($query)
    {
        return $query->where(
            'status',
            self::STATUS_CONFIRMED
        );
    }

    public function scopeApproved($query)
    {
        return $query->where(
            'status',
            self::STATUS_APPROVED
        );
    }

    public function scopeRejected($query)
    {
        return $query->where(
            'status',
            self::STATUS_REJECTED
        );
    }

    public function scopeCancelled($query)
    {
        return $query->where(
            'status',
            self::STATUS_CANCELLED
        );
    }

    public function scopeCompleted($query)
    {
        return $query->where(
            'status',
            self::STATUS_COMPLETED
        );
    }

    public function scopePaid($query)
    {
        return $query->where(
            'payment_status',
            self::PAYMENT_PAID
        );
    }

    public function scopeForProperty($query, int $propertyId)
    {
        return $query->where(
            'property_id',
            $propertyId
        );
    }

    public function scopeForApartment($query, int $apartmentId)
    {
        return $query->where(
            'apartment_id',
            $apartmentId
        );
    }

    public function scopeForUnit($query, int $unitId)
    {
        return $query->where(
            'unit_id',
            $unitId
        );
    }
}

