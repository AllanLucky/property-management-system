<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | Tenant Status Constants
    |--------------------------------------------------------------------------
    */

    public const STATUS_PENDING = 'pending';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    public const STATUS_BLACKLISTED = 'blacklisted';


    /*
    |--------------------------------------------------------------------------
    | Supported Statuses
    |--------------------------------------------------------------------------
    */

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
        self::STATUS_BLACKLISTED,
    ];


    /*
    |--------------------------------------------------------------------------
    | Database Table
    |--------------------------------------------------------------------------
    */

    protected $table = 'tenants';


    /*
    |--------------------------------------------------------------------------
    | Mass Assignable Fields
    |--------------------------------------------------------------------------
    */

    protected $fillable = [

        /*
        | Tenant Identification
        */

        'tenant_number',

        /*
        | Existing User Account
        |
        | The Tenant model does not create the User account.
        | It references an existing users.id.
        */

        'user_id',

        /*
        | Personal Information
        */

        'first_name',
        'last_name',
        'other_names',
        'email',
        'phone',
        'date_of_birth',
        'nationality',
        'gender',

        /*
        | Identification
        */

        'id_number',
        'passport_number',

        /*
        | Residential / Location Information
        |
        | country = residential/location country
        | nationality = nationality
        */

        'country',
        'region',
        'county',
        'city',
        'area',
        'postal_code',
        'address',

        /*
        | Employment
        */

        'occupation',
        'employer',
        'monthly_income',

        /*
        | Emergency Contact
        */

        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',

        /*
        | Documents
        */

        'photo',
        'photo_public_id',

        'id_front',
        'id_front_public_id',

        'id_back',
        'id_back_public_id',

        /*
        | Verification
        */

        'is_verified',
        'verified_at',

        /*
        | Status
        |
        | IMPORTANT:
        | There is NO is_active database column.
        |
        | Tenant activity is determined from `status`.
        */

        'status',

        /*
        | Notes
        */

        'notes',
    ];


    /*
    |--------------------------------------------------------------------------
    | Attribute Casting
    |--------------------------------------------------------------------------
    */

    protected $casts = [

        'date_of_birth' => 'date',

        'monthly_income' => 'decimal:2',

        'is_verified' => 'boolean',

        'verified_at' => 'datetime',

        'created_at' => 'datetime',

        'updated_at' => 'datetime',

        'deleted_at' => 'datetime',
    ];


    /*
    |--------------------------------------------------------------------------
    | Hidden Attributes
    |--------------------------------------------------------------------------
    */

    protected $hidden = [];


    /*
    |--------------------------------------------------------------------------
    | Appended Attributes
    |--------------------------------------------------------------------------
    |
    | These are computed attributes.
    | They are NOT database columns.
    |
    */

    protected $appends = [
        'full_name',
        'status_label',
        'is_active',
        'account_state',
        'active_tenancy_count',
        'tenancy_count',
    ];


    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */


    /**
     * Tenant belongs to an existing User account.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }


    /**
     * Tenant can have multiple tenancy records.
     */
    public function tenancies(): HasMany
    {
        return $this->hasMany(
            Tenancy::class,
            'tenant_id'
        );
    }


    /**
     * Latest active tenancy.
     */
    public function activeTenancy(): HasOne
    {
        return $this->hasOne(
            Tenancy::class,
            'tenant_id'
        )
            ->where(
                'status',
                Tenancy::STATUS_ACTIVE
            )
            ->latestOfMany();
    }


    /**
     * All active tenancies.
     */
    public function activeTenancies(): HasMany
    {
        return $this->hasMany(
            Tenancy::class,
            'tenant_id'
        )
            ->where(
                'status',
                Tenancy::STATUS_ACTIVE
            );
    }


    /*
    |--------------------------------------------------------------------------
    | Computed Attributes
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
                $this->other_names,
                $this->last_name,
            ])
                ->filter(
                    static fn ($value): bool =>
                        $value !== null &&
                        trim((string) $value) !== ''
                )
                ->implode(' ')
        );
    }


    /**
     * Determine whether tenant is active.
     *
     * IMPORTANT:
     * This is a computed property.
     * There is no `is_active` database column.
     */
    public function getIsActiveAttribute(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }


    /**
     * Get human-readable status.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {

            self::STATUS_ACTIVE =>
                'Active',

            self::STATUS_INACTIVE =>
                'Inactive',

            self::STATUS_PENDING =>
                'Pending',

            self::STATUS_BLACKLISTED =>
                'Blacklisted',

            default =>
                ucfirst(
                    str_replace(
                        '_',
                        ' ',
                        (string) $this->status
                    )
                ),
        };
    }


    /**
     * Get account state.
     */
    public function getAccountStateAttribute(): string
    {
        return match ($this->status) {

            self::STATUS_ACTIVE =>
                'active',

            self::STATUS_INACTIVE =>
                'inactive',

            self::STATUS_PENDING =>
                'pending',

            self::STATUS_BLACKLISTED =>
                'blacklisted',

            default =>
                'unknown',
        };
    }


    /**
     * Get active tenancy count.
     *
     * Uses the already-loaded relationship where possible.
     */
    public function getActiveTenancyCountAttribute(): int
    {
        if ($this->relationLoaded('activeTenancies')) {
            return $this->activeTenancies->count();
        }

        return $this->activeTenancies()->count();
    }


    /**
     * Get total tenancy count.
     *
     * Uses the already-loaded relationship where possible.
     */
    public function getTenancyCountAttribute(): int
    {
        if ($this->relationLoaded('tenancies')) {
            return $this->tenancies->count();
        }

        return $this->tenancies()->count();
    }


    /**
     * Get the current active tenancy.
     */
    public function getCurrentTenancyAttribute()
    {
        if ($this->relationLoaded('activeTenancy')) {
            return $this->getRelation('activeTenancy');
        }

        return $this->activeTenancy()->first();
    }


    /*
    |--------------------------------------------------------------------------
    | Status Scopes
    |--------------------------------------------------------------------------
    */


    /**
     * Scope active tenants.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_ACTIVE
        );
    }


    /**
     * Scope inactive tenants.
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_INACTIVE
        );
    }


    /**
     * Scope pending tenants.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_PENDING
        );
    }


    /**
     * Scope blacklisted tenants.
     */
    public function scopeBlacklisted(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_BLACKLISTED
        );
    }


    /**
     * Scope by status.
     */
    public function scopeStatus(
        Builder $query,
        string $status
    ): Builder {
        return $query->where(
            'status',
            $status
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Verification Scopes
    |--------------------------------------------------------------------------
    */


    /**
     * Scope verified tenants.
     */
    public function scopeVerified(Builder $query): Builder
    {
        return $query->where(
            'is_verified',
            true
        );
    }


    /**
     * Scope unverified tenants.
     */
    public function scopeUnverified(Builder $query): Builder
    {
        return $query->where(
            'is_verified',
            false
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Tenancy Reporting Scopes
    |--------------------------------------------------------------------------
    */


    /**
     * Scope tenants with an active tenancy.
     *
     * Useful for Tenant Reports.
     */
    public function scopeWithActiveTenancy(
        Builder $query
    ): Builder {
        return $query->whereHas(
            'tenancies',
            function (Builder $tenancyQuery): void {
                $tenancyQuery->where(
                    'status',
                    Tenancy::STATUS_ACTIVE
                );
            }
        );
    }


    /**
     * Scope tenants without an active tenancy.
     *
     * Useful for identifying available / inactive tenants.
     */
    public function scopeWithoutActiveTenancy(
        Builder $query
    ): Builder {
        return $query->whereDoesntHave(
            'tenancies',
            function (Builder $tenancyQuery): void {
                $tenancyQuery->where(
                    'status',
                    Tenancy::STATUS_ACTIVE
                );
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Registration Reporting Scopes
    |--------------------------------------------------------------------------
    */


    /**
     * Scope tenants created within a date range.
     *
     * Example:
     *
     * Tenant::createdBetween(
     *     now()->startOfMonth(),
     *     now()->endOfMonth()
     * )
     */
    public function scopeCreatedBetween(
        Builder $query,
        $startDate,
        $endDate
    ): Builder {
        return $query->whereBetween(
            'created_at',
            [
                $startDate,
                $endDate,
            ]
        );
    }


    /**
     * Scope tenants created today.
     */
    public function scopeCreatedToday(
        Builder $query
    ): Builder {
        return $query->whereDate(
            'created_at',
            today()
        );
    }


    /**
     * Scope tenants created this week.
     */
    public function scopeCreatedThisWeek(
        Builder $query
    ): Builder {
        return $query->whereBetween(
            'created_at',
            [
                now()->startOfWeek(),
                now()->endOfWeek(),
            ]
        );
    }


    /**
     * Scope tenants created this month.
     */
    public function scopeCreatedThisMonth(
        Builder $query
    ): Builder {
        return $query->whereBetween(
            'created_at',
            [
                now()->startOfMonth(),
                now()->endOfMonth(),
            ]
        );
    }


    /**
     * Scope tenants created this year.
     */
    public function scopeCreatedThisYear(
        Builder $query
    ): Builder {
        return $query->whereBetween(
            'created_at',
            [
                now()->startOfYear(),
                now()->endOfYear(),
            ]
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Tenant State Checks
    |--------------------------------------------------------------------------
    */


    /**
     * Determine whether tenant is active.
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }


    /**
     * Determine whether tenant is inactive.
     */
    public function isInactive(): bool
    {
        return $this->status === self::STATUS_INACTIVE;
    }


    /**
     * Determine whether tenant is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }


    /**
     * Determine whether tenant is blacklisted.
     */
    public function isBlacklisted(): bool
    {
        return $this->status === self::STATUS_BLACKLISTED;
    }


    /**
     * Determine whether tenant is verified.
     */
    public function isVerified(): bool
    {
        return (bool) $this->is_verified;
    }


    /*
    |--------------------------------------------------------------------------
    | Tenant State Actions
    |--------------------------------------------------------------------------
    */


    /**
     * Activate tenant.
     *
     * Blacklisted tenants cannot be activated directly.
     */
    public function activate(): bool
    {
        if ($this->isBlacklisted()) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_ACTIVE,
        ]);
    }


    /**
     * Deactivate tenant.
     */
    public function deactivate(): bool
    {
        return $this->update([
            'status' => self::STATUS_INACTIVE,
        ]);
    }


    /**
     * Blacklist tenant.
     */
    public function blacklist(): bool
    {
        return $this->update([
            'status' => self::STATUS_BLACKLISTED,
        ]);
    }


    /**
     * Set tenant to pending.
     */
    public function setPending(): bool
    {
        return $this->update([
            'status' => self::STATUS_PENDING,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Verification Actions
    |--------------------------------------------------------------------------
    */


    /**
     * Verify tenant.
     */
    public function verify(): bool
    {
        return $this->update([
            'is_verified' => true,
            'verified_at' => now(),
        ]);
    }


    /**
     * Unverify tenant.
     */
    public function unverify(): bool
    {
        return $this->update([
            'is_verified' => false,
            'verified_at' => null,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Tenancy Helpers
    |--------------------------------------------------------------------------
    */


    /**
     * Determine whether tenant has an active tenancy.
     */
    public function hasActiveTenancy(): bool
    {
        return $this->activeTenancies()->exists();
    }


    /**
     * Return current active tenancy.
     */
    public function currentTenancy()
    {
        return $this->activeTenancy()->first();
    }


    /**
     * Determine whether tenant has any tenancy history.
     */
    public function hasTenancyHistory(): bool
    {
        return $this->tenancies()->exists();
    }


    /*
    |--------------------------------------------------------------------------
    | Reporting Helpers
    |--------------------------------------------------------------------------
    */


    /**
     * Get a simple report-friendly status payload.
     *
     * This does not query the database.
     */
    public function getReportStatusAttribute(): array
    {
        return [
            'value' => $this->status,
            'label' => $this->status_label,
            'is_active' => $this->is_active,
            'is_verified' => $this->is_verified,
        ];
    }


    /**
     * Get tenant occupancy/reporting state.
     *
     * This is computed from tenancy relationships.
     */
    public function getTenancyStateAttribute(): string
    {
        return $this->hasActiveTenancy()
            ? 'occupied'
            : 'no_active_tenancy';
    }


    /*
    |--------------------------------------------------------------------------
    | Backwards Compatibility
    |--------------------------------------------------------------------------
    |
    | There is intentionally no `is_active` database column.
    |
    */

    public function syncActiveStatus(): bool
    {
        return true;
    }


    /*
    |--------------------------------------------------------------------------
    | Status Validation
    |--------------------------------------------------------------------------
    */


    /**
     * Determine whether a status is supported.
     */
    public static function isValidStatus(
        ?string $status
    ): bool {
        return $status !== null
            && in_array(
                $status,
                self::STATUSES,
                true
            );
    }
}