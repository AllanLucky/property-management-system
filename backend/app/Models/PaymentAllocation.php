<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentAllocation extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Allocation Type Constants
    |--------------------------------------------------------------------------
    */

    public const TYPE_RENT = 'rent';

    public const TYPE_DEPOSIT = 'deposit';

    public const TYPE_SERVICE_CHARGE = 'service_charge';

    public const TYPE_UTILITY = 'utility';

    public const TYPE_PENALTY = 'penalty';

    public const TYPE_OTHER = 'other';

    /*
    |--------------------------------------------------------------------------
    | Mass Assignment
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'payment_id',
        'tenancy_id',
        'property_id',
        'apartment_id',
        'unit_id',
        'allocation_type',
        'amount',
        'reference',
        'description',
    ];

    /*
    |--------------------------------------------------------------------------
    | Attribute Casting
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',

            'created_at' => 'datetime',

            'updated_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Get the payment this allocation belongs to.
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(
            Payment::class,
            'payment_id'
        );
    }

    /**
     * Get the tenancy associated with this allocation.
     */
    public function tenancy(): BelongsTo
    {
        return $this->belongsTo(
            Tenancy::class,
            'tenancy_id'
        );
    }

    /**
     * Get the property associated with this allocation.
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(
            Property::class,
            'property_id'
        );
    }

    /**
     * Get the apartment associated with this allocation.
     */
    public function apartment(): BelongsTo
    {
        return $this->belongsTo(
            Apartment::class,
            'apartment_id'
        );
    }

    /**
     * Get the unit associated with this allocation.
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
    | Allocation Type Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether this allocation is rent.
     */
    public function isRent(): bool
    {
        return $this->allocation_type === self::TYPE_RENT;
    }

    /**
     * Determine whether this allocation is a security deposit.
     */
    public function isDeposit(): bool
    {
        return $this->allocation_type === self::TYPE_DEPOSIT;
    }

    /**
     * Determine whether this allocation is a service charge.
     */
    public function isServiceCharge(): bool
    {
        return $this->allocation_type === self::TYPE_SERVICE_CHARGE;
    }

    /**
     * Determine whether this allocation is a utility payment.
     */
    public function isUtility(): bool
    {
        return $this->allocation_type === self::TYPE_UTILITY;
    }

    /**
     * Determine whether this allocation is a penalty.
     */
    public function isPenalty(): bool
    {
        return $this->allocation_type === self::TYPE_PENALTY;
    }

    /**
     * Determine whether this allocation is another payment type.
     */
    public function isOther(): bool
    {
        return $this->allocation_type === self::TYPE_OTHER;
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope allocations by type.
     */
    public function scopeOfType(
        Builder $query,
        string $type
    ): Builder {
        return $query->where(
            'allocation_type',
            $type
        );
    }

    /**
     * Scope rent allocations.
     */
    public function scopeRent(Builder $query): Builder
    {
        return $query->where(
            'allocation_type',
            self::TYPE_RENT
        );
    }

    /**
     * Scope deposit allocations.
     */
    public function scopeDeposits(Builder $query): Builder
    {
        return $query->where(
            'allocation_type',
            self::TYPE_DEPOSIT
        );
    }

    /**
     * Scope service charge allocations.
     */
    public function scopeServiceCharges(Builder $query): Builder
    {
        return $query->where(
            'allocation_type',
            self::TYPE_SERVICE_CHARGE
        );
    }

    /**
     * Scope utility allocations.
     */
    public function scopeUtilities(Builder $query): Builder
    {
        return $query->where(
            'allocation_type',
            self::TYPE_UTILITY
        );
    }

    /**
     * Scope penalty allocations.
     */
    public function scopePenalties(Builder $query): Builder
    {
        return $query->where(
            'allocation_type',
            self::TYPE_PENALTY
        );
    }

    /**
     * Scope allocations for a specific payment.
     */
    public function scopeForPayment(
        Builder $query,
        int $paymentId
    ): Builder {
        return $query->where(
            'payment_id',
            $paymentId
        );
    }

    /**
     * Scope allocations for a specific tenancy.
     */
    public function scopeForTenancy(
        Builder $query,
        int $tenancyId
    ): Builder {
        return $query->where(
            'tenancy_id',
            $tenancyId
        );
    }

    /**
     * Scope allocations for a specific property.
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

    /**
     * Scope allocations for a specific apartment.
     */
    public function scopeForApartment(
        Builder $query,
        int $apartmentId
    ): Builder {
        return $query->where(
            'apartment_id',
            $apartmentId
        );
    }

    /**
     * Scope allocations for a specific unit.
     */
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
    | Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Get a human-readable allocation type label.
     */
    public function getAllocationTypeLabelAttribute(): string
    {
        return match ($this->allocation_type) {
            self::TYPE_RENT => 'Rent',

            self::TYPE_DEPOSIT => 'Deposit',

            self::TYPE_SERVICE_CHARGE => 'Service Charge',

            self::TYPE_UTILITY => 'Utility',

            self::TYPE_PENALTY => 'Penalty',

            self::TYPE_OTHER => 'Other',

            default => ucfirst(
                str_replace(
                    '_',
                    ' ',
                    (string) $this->allocation_type
                )
            ),
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Static Options
    |--------------------------------------------------------------------------
    */

    /**
     * Get all supported allocation types.
     */
    public static function allocationTypes(): array
    {
        return [
            self::TYPE_RENT,
            self::TYPE_DEPOSIT,
            self::TYPE_SERVICE_CHARGE,
            self::TYPE_UTILITY,
            self::TYPE_PENALTY,
            self::TYPE_OTHER,
        ];
    }

    /**
     * Get allocation type options for forms/API responses.
     */
    public static function allocationTypeOptions(): array
    {
        return [
            self::TYPE_RENT => 'Rent',

            self::TYPE_DEPOSIT => 'Deposit',

            self::TYPE_SERVICE_CHARGE => 'Service Charge',

            self::TYPE_UTILITY => 'Utility',

            self::TYPE_PENALTY => 'Penalty',

            self::TYPE_OTHER => 'Other',
        ];
    }
}