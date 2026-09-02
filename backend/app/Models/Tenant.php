<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | Status Constants
    |--------------------------------------------------------------------------
    */

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_PENDING = 'pending';
    public const STATUS_BLACKLISTED = 'blacklisted';

    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
        self::STATUS_PENDING,
        self::STATUS_BLACKLISTED,
    ];

    /*
    |--------------------------------------------------------------------------
    | Table
    |--------------------------------------------------------------------------
    */

    protected $table = 'tenants';

    /*
    |--------------------------------------------------------------------------
    | Fillable
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'user_id',
        'tenant_number',

        // Personal information
        'first_name',
        'last_name',
        'other_names',
        'email',
        'phone',
        'date_of_birth',
        'gender',

        // Identification
        'id_number',
        'passport_number',

        // Address / location
        'country',
        'county',
        'city',
        'postal_code',
        'address',

        // Employment / financial information
        'occupation',
        'employer',
        'monthly_income',

        // Emergency contact
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',

        // Documents
        'photo',
        'photo_public_id',
        'id_front',
        'id_front_public_id',
        'id_back',
        'id_back_public_id',

        // Verification / status
        'is_verified',
        'verified_at',
        'status',
        'is_active',

        // Notes
        'notes',
    ];

    /*
    |--------------------------------------------------------------------------
    | Hidden
    |--------------------------------------------------------------------------
    */

    protected $hidden = [
        'photo_public_id',
        'id_front_public_id',
        'id_back_public_id',
        'deleted_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | Casts
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'user_id' => 'integer',

        'date_of_birth' => 'date',

        'monthly_income' => 'decimal:2',

        'is_verified' => 'boolean',
        'is_active' => 'boolean',

        'verified_at' => 'datetime',

        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Appended Attributes
    |--------------------------------------------------------------------------
    */

    protected $appends = [
        'full_name',
        'status_label',
        'verification_status',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Linked user account.
     *
     * A tenant profile belongs to an existing User account.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * All tenancies belonging to this tenant.
     *
     * Historical tenancies are intentionally preserved.
     */
    public function tenancies()
    {
        return $this->hasMany(Tenancy::class, 'tenant_id');
    }

    /**
     * Active tenancies.
     */
    public function activeTenancies()
    {
        return $this->hasMany(Tenancy::class, 'tenant_id')
            ->where('status', Tenancy::STATUS_ACTIVE)
            ->where('is_active', true);
    }

    /**
     * Pending tenancies.
     *
     * Pending tenancies still block another tenancy assignment
     * while they remain active.
     */
    public function pendingTenancies()
    {
        return $this->hasMany(Tenancy::class, 'tenant_id')
            ->where('status', Tenancy::STATUS_PENDING)
            ->where('is_active', true);
    }

    /**
     * Tenant's units through tenancies.
     *
     * Historical and current unit assignments are preserved.
     */
    public function units()
    {
        return $this->belongsToMany(
            Unit::class,
            'tenancies',
            'tenant_id',
            'unit_id'
        )
            ->withPivot([
                'id',
                'start_date',
                'end_date',
                'rent_amount',
                'deposit_amount',
                'status',
            ])
            ->withTimestamps();
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Active tenants.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->where('status', self::STATUS_ACTIVE)
            ->where('is_active', true);
    }

    /**
     * Inactive tenants.
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            $q->where('status', self::STATUS_INACTIVE)
                ->orWhere('is_active', false);
        });
    }

    /**
     * Pending tenants.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query
            ->where('status', self::STATUS_PENDING)
            ->where('is_active', true);
    }

    /**
     * Blacklisted tenants.
     */
    public function scopeBlacklisted(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_BLACKLISTED);
    }

    /**
     * Verified tenants.
     */
    public function scopeVerified(Builder $query): Builder
    {
        return $query->where('is_verified', true);
    }

    /**
     * Unverified tenants.
     */
    public function scopeUnverified(Builder $query): Builder
    {
        return $query->where('is_verified', false);
    }

    /**
     * Tenants with a linked user account.
     */
    public function scopeWithUser(Builder $query): Builder
    {
        return $query->whereNotNull('user_id');
    }

    /**
     * Tenants without a linked user account.
     */
    public function scopeWithoutUser(Builder $query): Builder
    {
        return $query->whereNull('user_id');
    }

    /**
     * Tenants that are eligible for a new tenancy assignment.
     *
     * A tenant cannot receive another tenancy if they already have
     * an active or pending tenancy that is still enabled.
     */
    public function scopeAvailableForTenancy(Builder $query): Builder
    {
        return $query->whereDoesntHave('tenancies', function (Builder $q) {
            $q->whereIn('status', [
                Tenancy::STATUS_ACTIVE,
                Tenancy::STATUS_PENDING,
            ])
                ->where('is_active', true);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Get tenant's full name.
     */
    public function getFullNameAttribute(): string
    {
        return trim(
            collect([
                $this->first_name,
                $this->last_name,
                $this->other_names,
            ])
                ->filter()
                ->implode(' ')
        );
    }

    /**
     * Get human-readable status.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_INACTIVE => 'Inactive',
            self::STATUS_PENDING => 'Pending',
            self::STATUS_BLACKLISTED => 'Blacklisted',

            default => Str::of((string) $this->status)
                ->replace(['_', '-'], ' ')
                ->title()
                ->toString(),
        };
    }

    /**
     * Get verification status.
     */
    public function getVerificationStatusAttribute(): string
    {
        return $this->is_verified
            ? 'Verified'
            : 'Unverified';
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether tenant has a linked user account.
     */
    public function hasUser(): bool
    {
        return !is_null($this->user_id);
    }

    /**
     * Determine whether tenant has no linked user account.
     */
    public function doesNotHaveUser(): bool
    {
        return is_null($this->user_id);
    }

    /**
     * Determine whether tenant is active.
     */
    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    /**
     * Determine whether tenant is inactive.
     */
    public function isInactive(): bool
    {
        return !$this->is_active;
    }

    /**
     * Determine whether tenant is verified.
     */
    public function isVerified(): bool
    {
        return (bool) $this->is_verified;
    }

    /**
     * Determine whether tenant has an active tenancy.
     */
    public function hasActiveTenancy(): bool
    {
        return $this->activeTenancies()->exists();
    }

    /**
     * Determine whether tenant has a pending tenancy.
     */
    public function hasPendingTenancy(): bool
    {
        return $this->pendingTenancies()->exists();
    }

    /**
     * Determine whether tenant has an active or pending tenancy.
     *
     * This is the tenancy-assignment blocking rule.
     */
    public function hasBlockingTenancy(): bool
    {
        return $this->tenancies()
            ->whereIn('status', [
                Tenancy::STATUS_ACTIVE,
                Tenancy::STATUS_PENDING,
            ])
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Determine whether tenant is available for a new tenancy.
     */
    public function isAvailableForTenancy(): bool
    {
        return !$this->hasBlockingTenancy();
    }

    /**
     * Determine whether tenant has any tenancy.
     */
    public function hasTenancy(): bool
    {
        return $this->tenancies()->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | Model Boot
    |--------------------------------------------------------------------------
    */

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $tenant) {

            /*
             * Generate tenant number automatically.
             */
            if (empty($tenant->tenant_number)) {
                $tenant->tenant_number = self::generateTenantNumber();
            }

            /*
             * Default tenant status.
             */
            if (empty($tenant->status)) {
                $tenant->status = self::STATUS_PENDING;
            }

            /*
             * Default verification state.
             */
            if (is_null($tenant->is_verified)) {
                $tenant->is_verified = false;
            }

            /*
             * Default active state.
             */
            if (is_null($tenant->is_active)) {
                $tenant->is_active = true;
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Tenant Number Generator
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a unique tenant number.
     *
     * Example:
     * TNT-000001
     * TNT-000002
     */
    public static function generateTenantNumber(): string
    {
        do {
            $number = 'TNT-' . str_pad(
                (string) (
                    (int) self::withTrashed()->max('id') + 1
                ),
                6,
                '0',
                STR_PAD_LEFT
            );
        } while (
            self::withTrashed()
                ->where('tenant_number', $number)
                ->exists()
        );

        return $number;
    }
}