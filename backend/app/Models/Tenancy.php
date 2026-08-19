<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Tenancy extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | STATUS CONSTANTS
    |--------------------------------------------------------------------------
    */

    public const STATUS_ACTIVE = 'active';
    public const STATUS_PENDING = 'pending';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_TERMINATED = 'terminated';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_PENDING,
        self::STATUS_EXPIRED,
        self::STATUS_TERMINATED,
        self::STATUS_CANCELLED,
    ];

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    protected $table = 'tenancies';

    /*
    |--------------------------------------------------------------------------
    | MASS ASSIGNABLE ATTRIBUTES
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        // Property hierarchy
        'property_id',
        'apartment_id',
        'unit_id',

        // Tenant
        'tenant_id',

        // Tenancy identification
        'tenancy_number',

        // Tenancy dates
        'start_date',
        'end_date',
        'move_in_date',
        'move_out_date',

        // Financial information
        'rent_amount',
        'deposit_amount',
        'service_charge',
        'late_fee',

        // Payment configuration
        'payment_frequency',
        'due_day',

        // Status
        'status',
        'is_active',

        // Documents
        'agreement_file',
        'agreement_public_id',

        // Additional information
        'notes',
    ];

    /*
    |--------------------------------------------------------------------------
    | HIDDEN ATTRIBUTES
    |--------------------------------------------------------------------------
    */

    protected $hidden = [
        'agreement_public_id',
        'deleted_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | ATTRIBUTE CASTING
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'property_id' => 'integer',
        'apartment_id' => 'integer',
        'unit_id' => 'integer',
        'tenant_id' => 'integer',

        'start_date' => 'date',
        'end_date' => 'date',
        'move_in_date' => 'date',
        'move_out_date' => 'date',

        'rent_amount' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'late_fee' => 'decimal:2',

        'due_day' => 'integer',

        'is_active' => 'boolean',

        'status' => 'string',

        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | APPENDED ATTRIBUTES
    |--------------------------------------------------------------------------
    */

    protected $appends = [
        'is_expired',
        'is_currently_active',
        'has_moved_in',
        'has_moved_out',
        'status_label',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * Property associated with this tenancy.
     */
    public function property()
    {
        return $this->belongsTo(Property::class, 'property_id');
    }

    /**
     * Apartment associated with this tenancy.
     */
    public function apartment()
    {
        return $this->belongsTo(Apartment::class, 'apartment_id');
    }

    /**
     * Unit assigned to this tenancy.
     *
     * This is the main relationship used when assigning
     * a tenant to a specific unit.
     */
    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    /**
     * Tenant assigned to this tenancy.
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Active tenancies.
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE)
            ->where('is_active', true);
    }

    /**
     * Pending tenancies.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Expired tenancies.
     */
    public function scopeExpired($query)
    {
        return $query->where('status', self::STATUS_EXPIRED);
    }

    /**
     * Terminated tenancies.
     */
    public function scopeTerminated($query)
    {
        return $query->where('status', self::STATUS_TERMINATED);
    }

    /**
     * Cancelled tenancies.
     */
    public function scopeCancelled($query)
    {
        return $query->where('status', self::STATUS_CANCELLED);
    }

    /**
     * Currently active records.
     */
    public function scopeCurrentlyActive($query)
    {
        return $query
            ->where('status', self::STATUS_ACTIVE)
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('start_date')
                    ->orWhereDate('start_date', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', now());
            });
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether tenancy has expired.
     */
    public function getIsExpiredAttribute(): bool
    {
        if ($this->status === self::STATUS_EXPIRED) {
            return true;
        }

        return !is_null($this->end_date)
            && now()->greaterThan($this->end_date);
    }

    /**
     * Determine whether tenancy is currently active.
     */
    public function getIsCurrentlyActiveAttribute(): bool
    {
        if ($this->status !== self::STATUS_ACTIVE) {
            return false;
        }

        if (!$this->is_active) {
            return false;
        }

        if ($this->start_date && now()->lessThan($this->start_date)) {
            return false;
        }

        if ($this->end_date && now()->greaterThan($this->end_date)) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether tenant has moved in.
     */
    public function getHasMovedInAttribute(): bool
    {
        return !is_null($this->move_in_date);
    }

    /**
     * Determine whether tenant has moved out.
     */
    public function getHasMovedOutAttribute(): bool
    {
        return !is_null($this->move_out_date);
    }

    /**
     * Human-readable tenancy status.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_PENDING => 'Pending',
            self::STATUS_EXPIRED => 'Expired',
            self::STATUS_TERMINATED => 'Terminated',
            self::STATUS_CANCELLED => 'Cancelled',
            default => Str::of((string) $this->status)
                ->replace('_', ' ')
                ->title(),
        };
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether tenancy is currently running.
     */
    public function isRunning(): bool
    {
        return $this->status === self::STATUS_ACTIVE
            && $this->is_active
            && (
                is_null($this->start_date)
                || $this->start_date->isPast()
                || $this->start_date->isToday()
            )
            && (
                is_null($this->end_date)
                || $this->end_date->isFuture()
                || $this->end_date->isToday()
            );
    }

    /**
     * Determine whether tenancy has ended.
     */
    public function isEnded(): bool
    {
        return in_array($this->status, [
            self::STATUS_EXPIRED,
            self::STATUS_TERMINATED,
            self::STATUS_CANCELLED,
        ], true);
    }

    /**
     * Determine whether tenancy is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Determine whether tenancy is active.
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE
            && (bool) $this->is_active;
    }

    /**
     * Determine whether tenancy has a unit assigned.
     */
    public function hasUnit(): bool
    {
        return !is_null($this->unit_id);
    }

    /**
     * Determine whether tenancy has a tenant assigned.
     */
    public function hasTenant(): bool
    {
        return !is_null($this->tenant_id);
    }

    /**
     * Determine whether tenancy has an agreement document.
     */
    public function hasAgreement(): bool
    {
        return !empty($this->agreement_file);
    }

    /*
    |--------------------------------------------------------------------------
    | BOOT METHOD
    |--------------------------------------------------------------------------
    */

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Tenancy $tenancy) {
            if (empty($tenancy->tenancy_number)) {
                $tenancy->tenancy_number = self::generateTenancyNumber();
            }

            if (empty($tenancy->status)) {
                $tenancy->status = self::STATUS_PENDING;
            }

            if (is_null($tenancy->is_active)) {
                $tenancy->is_active = true;
            }
        });

        static::updating(function (Tenancy $tenancy) {
            /*
             * Automatically deactivate tenancy when it is ended.
             */
            if (in_array($tenancy->status, [
                self::STATUS_EXPIRED,
                self::STATUS_TERMINATED,
                self::STATUS_CANCELLED,
            ], true)) {
                $tenancy->is_active = false;
            }

            /*
             * Active tenancy should be active.
             */
            if ($tenancy->status === self::STATUS_ACTIVE) {
                $tenancy->is_active = true;
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | TENANCY NUMBER GENERATOR
    |--------------------------------------------------------------------------
    */

    public static function generateTenancyNumber(): string
    {
        do {
            $number = 'TEN-' . strtoupper(Str::random(8));
        } while (
            self::withTrashed()
                ->where('tenancy_number', $number)
                ->exists()
        );

        return $number;
    }
}

