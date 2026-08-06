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
    public const STATUS_ACTIVE     = 'active';
    public const STATUS_PENDING    = 'pending';
    public const STATUS_EXPIRED    = 'expired';
    public const STATUS_TERMINATED = 'terminated';
    public const STATUS_CANCELLED  = 'cancelled';

    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_PENDING,
        self::STATUS_EXPIRED,
        self::STATUS_TERMINATED,
        self::STATUS_CANCELLED,
    ];

    /**
     * Mass assignable attributes.
     */
    protected $fillable = [
        'property_id',
        'apartment_id',
        'unit_id',
        'tenant_id',
        'tenancy_number',
        'start_date',
        'end_date',
        'move_in_date',
        'move_out_date',
        'rent_amount',
        'deposit_amount',
        'service_charge',
        'late_fee',
        'payment_frequency',
        'due_day',
        'status',
        'agreement_file',
        'agreement_public_id',
        'notes',
        'is_active',
    ];

    /**
     * Hidden attributes.
     */
    protected $hidden = [
        'agreement_public_id',
        'deleted_at',
    ];

    /**
     * Attribute Casting.
     */
    protected $casts = [
        'start_date'      => 'date',
        'end_date'        => 'date',
        'move_in_date'    => 'date',
        'move_out_date'   => 'date',
        'rent_amount'     => 'decimal:2',
        'deposit_amount'  => 'decimal:2',
        'service_charge'  => 'decimal:2',
        'late_fee'        => 'decimal:2',
        'due_day'         => 'integer',
        'is_active'       => 'boolean',
        'status'          => 'string',
    ];

    /**
     * Appended attributes.
     */
    protected $appends = [
        'is_expired',
        'is_currently_active',
        'has_moved_in',
        'has_moved_out',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */
    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function apartment()
    {
        return $this->belongsTo(Apartment::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES
    |--------------------------------------------------------------------------
    */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', self::STATUS_EXPIRED);
    }

    public function scopeTerminated($query)
    {
        return $query->where('status', self::STATUS_TERMINATED);
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */
    public function getIsExpiredAttribute(): bool
    {
        return !is_null($this->end_date) && now()->greaterThan($this->end_date);
    }

    public function getIsCurrentlyActiveAttribute(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function getHasMovedInAttribute(): bool
    {
        return !is_null($this->move_in_date);
    }

    public function getHasMovedOutAttribute(): bool
    {
        return !is_null($this->move_out_date);
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */
    public function isRunning(): bool
    {
        return $this->status === self::STATUS_ACTIVE
            && (is_null($this->end_date) || $this->end_date->isFuture());
    }

    public function isEnded(): bool
    {
        return in_array($this->status, [
            self::STATUS_EXPIRED,
            self::STATUS_TERMINATED,
            self::STATUS_CANCELLED,
        ]);
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
                $tenancy->tenancy_number = 'TEN-' . strtoupper(Str::random(8));
            }
        });
    }
}
