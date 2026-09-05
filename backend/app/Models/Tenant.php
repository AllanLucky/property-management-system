<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
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
    |
    | `user_id` references an existing User account.
    |
    | Tenant creation does NOT create a User account.
    |
    */

    protected $fillable = [

        /*
        |--------------------------------------------------------------------------
        | Tenant Identification
        |--------------------------------------------------------------------------
        */

        'tenant_number',

        /*
        |--------------------------------------------------------------------------
        | Existing User Account
        |--------------------------------------------------------------------------
        */

        'user_id',

        /*
        |--------------------------------------------------------------------------
        | Personal Information
        |--------------------------------------------------------------------------
        |
        | first_name, last_name, email and phone are synchronized from
        | the linked User account by TenantService.
        |
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
        |--------------------------------------------------------------------------
        | Identification
        |--------------------------------------------------------------------------
        */

        'id_number',
        'passport_number',

        /*
        |--------------------------------------------------------------------------
        | Residential / Location Information
        |--------------------------------------------------------------------------
        |
        | `country` represents residential/location country.
        |
        | `nationality` represents citizenship/nationality.
        |
        */

        'country',
        'region',
        'county',
        'city',
        'area',
        'postal_code',
        'address',

        /*
        |--------------------------------------------------------------------------
        | Employment / Financial Information
        |--------------------------------------------------------------------------
        */

        'occupation',
        'employer',
        'monthly_income',

        /*
        |--------------------------------------------------------------------------
        | Emergency Contact
        |--------------------------------------------------------------------------
        */

        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',

        /*
        |--------------------------------------------------------------------------
        | Documents
        |--------------------------------------------------------------------------
        */

        'photo',
        'photo_public_id',

        'id_front',
        'id_front_public_id',

        'id_back',
        'id_back_public_id',

        /*
        |--------------------------------------------------------------------------
        | Verification
        |--------------------------------------------------------------------------
        */

        'is_verified',
        'verified_at',

        /*
        |--------------------------------------------------------------------------
        | Tenant Status
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | There is intentionally NO `is_active` database column.
        |
        | Tenant activity is derived from `status`.
        |
        */

        'status',

        /*
        |--------------------------------------------------------------------------
        | Notes
        |--------------------------------------------------------------------------
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
    |
    | They are NOT database columns.
    |
    */

    protected $appends = [
        'full_name',
        'status_label',
        'is_active',
        'account_state',
        'verification_status',
        'active_tenancy_count',
        'tenancy_count',
    ];

    /*
    |--------------------------------------------------------------------------
    | Model Boot
    |--------------------------------------------------------------------------
    */

    protected static function boot(): void
    {
        parent::boot();

        /*
        |--------------------------------------------------------------------------
        | Creating
        |--------------------------------------------------------------------------
        */

        static::creating(function (self $tenant): void {

            /*
            | Generate tenant number automatically when one is not supplied.
            */

            if (empty($tenant->tenant_number)) {
                $tenant->tenant_number = self::generateTenantNumber();
            }

            /*
            | Default tenant status.
            */

            if (empty($tenant->status)) {
                $tenant->status = self::STATUS_PENDING;
            }

            /*
            | Default verification state.
            */

            if ($tenant->is_verified === null) {
                $tenant->is_verified = false;
            }

            /*
            | Set verification timestamp automatically when verified.
            */

            if (
                (bool) $tenant->is_verified &&
                empty($tenant->verified_at)
            ) {
                $tenant->verified_at = now();
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Updating
        |--------------------------------------------------------------------------
        */

        static::updating(function (self $tenant): void {

            /*
            | A tenant profile must not be detached from its linked
            | User account once a User has already been assigned.
            */

            if (
                $tenant->isDirty('user_id') &&
                $tenant->getOriginal('user_id') !== null &&
                $tenant->user_id === null
            ) {
                throw new \LogicException(
                    'The linked user account cannot be removed from a tenant profile.'
                );
            }

            /*
            | Keep verification timestamp consistent with verification state.
            */

            if ($tenant->isDirty('is_verified')) {

                if ((bool) $tenant->is_verified) {

                    if (empty($tenant->verified_at)) {
                        $tenant->verified_at = now();
                    }

                } else {

                    $tenant->verified_at = null;
                }
            }
        });
    }

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
     * Tenant can have multiple historical tenancy records.
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
     *
     * `is_active` here belongs to the Tenancy table.
     * It is NOT a Tenant field.
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
            ->where(
                'is_active',
                true
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
            )
            ->where(
                'is_active',
                true
            );
    }

    /**
     * Pending tenancies that are still active.
     *
     * These can block another tenancy assignment.
     */
    public function pendingTenancies(): HasMany
    {
        return $this->hasMany(
            Tenancy::class,
            'tenant_id'
        )
            ->where(
                'status',
                Tenancy::STATUS_PENDING
            )
            ->where(
                'is_active',
                true
            );
    }

    /**
     * Tenant units through tenancy records.
     *
     * Provides historical and current unit assignments.
     */
    public function units(): HasManyThrough
    {
        return $this->hasManyThrough(
            Unit::class,
            Tenancy::class,
            'tenant_id',
            'id',
            'id',
            'unit_id'
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
     *
     * This is a computed property.
     * There is no `is_active` database column.
     */
    public function getIsActiveAttribute(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Get human-readable tenant status.
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
                        ['_', '-'],
                        ' ',
                        (string) $this->status
                    )
                ),
        };
    }

    /**
     * Get normalized account state.
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
     * Get verification status.
     */
    public function getVerificationStatusAttribute(): string
    {
        return $this->is_verified
            ? 'verified'
            : 'unverified';
    }

    /**
     * Get active tenancy count.
     *
     * Uses the loaded relationship where possible.
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
     * Uses the loaded relationship where possible.
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
     *
     * Uses the loaded relationship where possible.
     */
    public function getCurrentTenancyAttribute()
    {
        if ($this->relationLoaded('activeTenancy')) {
            return $this->getRelation('activeTenancy');
        }

        return $this->activeTenancy()->first();
    }

    /**
     * Get report-friendly tenant status.
     */
    public function getReportStatusAttribute(): array
    {
        return [
            'value' => $this->status,
            'label' => $this->status_label,
            'is_active' => $this->is_active,
            'is_verified' => (bool) $this->is_verified,
        ];
    }

    /**
     * Get tenant occupancy/reporting state.
     */
    public function getTenancyStateAttribute(): string
    {
        return $this->hasActiveTenancy()
            ? 'occupied'
            : 'no_active_tenancy';
    }

    /*
    |--------------------------------------------------------------------------
    | Status Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope active tenants.
     */
    public function scopeActive(
        Builder $query
    ): Builder {
        return $query->where(
            'status',
            self::STATUS_ACTIVE
        );
    }

    /**
     * Scope inactive tenants.
     */
    public function scopeInactive(
        Builder $query
    ): Builder {
        return $query->where(
            'status',
            self::STATUS_INACTIVE
        );
    }

    /**
     * Scope pending tenants.
     */
    public function scopePending(
        Builder $query
    ): Builder {
        return $query->where(
            'status',
            self::STATUS_PENDING
        );
    }

    /**
     * Scope blacklisted tenants.
     */
    public function scopeBlacklisted(
        Builder $query
    ): Builder {
        return $query->where(
            'status',
            self::STATUS_BLACKLISTED
        );
    }

    /**
     * Scope tenants by status.
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
    public function scopeVerified(
        Builder $query
    ): Builder {
        return $query->where(
            'is_verified',
            true
        );
    }

    /**
     * Scope unverified tenants.
     */
    public function scopeUnverified(
        Builder $query
    ): Builder {
        return $query->where(
            'is_verified',
            false
        );
    }

    /*
    |--------------------------------------------------------------------------
    | User Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope tenants linked to an existing User account.
     */
    public function scopeWithUser(
        Builder $query
    ): Builder {
        return $query->whereNotNull('user_id');
    }

    /**
     * Scope tenants without a linked User account.
     */
    public function scopeWithoutUser(
        Builder $query
    ): Builder {
        return $query->whereNull('user_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Tenancy Reporting Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope tenants with an active tenancy.
     *
     * IMPORTANT:
     *
     * `is_active` belongs to the tenancies table.
     */
    public function scopeWithActiveTenancy(
        Builder $query
    ): Builder {
        return $query->whereHas(
            'tenancies',
            function (Builder $tenancyQuery): void {
                $tenancyQuery
                    ->where(
                        'status',
                        Tenancy::STATUS_ACTIVE
                    )
                    ->where(
                        'is_active',
                        true
                    );
            }
        );
    }

    /**
     * Scope tenants without an active tenancy.
     */
    public function scopeWithoutActiveTenancy(
        Builder $query
    ): Builder {
        return $query->whereDoesntHave(
            'tenancies',
            function (Builder $tenancyQuery): void {
                $tenancyQuery
                    ->where(
                        'status',
                        Tenancy::STATUS_ACTIVE
                    )
                    ->where(
                        'is_active',
                        true
                    );
            }
        );
    }

    /**
     * Scope tenants available for a new tenancy.
     *
     * Active and pending tenancies block assignment.
     */
    public function scopeAvailableForTenancy(
        Builder $query
    ): Builder {
        return $query->whereDoesntHave(
            'tenancies',
            function (Builder $tenancyQuery): void {
                $tenancyQuery
                    ->whereIn(
                        'status',
                        [
                            Tenancy::STATUS_ACTIVE,
                            Tenancy::STATUS_PENDING,
                        ]
                    )
                    ->where(
                        'is_active',
                        true
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

    /**
     * Determine whether tenant has a linked User account.
     */
    public function hasUser(): bool
    {
        return $this->user_id !== null;
    }

    /**
     * Determine whether tenant does not have a linked User account.
     */
    public function doesNotHaveUser(): bool
    {
        return $this->user_id === null;
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
        if ($this->relationLoaded('activeTenancies')) {
            return $this->activeTenancies->isNotEmpty();
        }

        return $this->activeTenancies()->exists();
    }

    /**
     * Determine whether tenant has a pending tenancy.
     */
    public function hasPendingTenancy(): bool
    {
        if ($this->relationLoaded('pendingTenancies')) {
            return $this->pendingTenancies->isNotEmpty();
        }

        return $this->pendingTenancies()->exists();
    }

    /**
     * Determine whether tenant has any tenancy history.
     */
    public function hasTenancyHistory(): bool
    {
        if ($this->relationLoaded('tenancies')) {
            return $this->tenancies->isNotEmpty();
        }

        return $this->tenancies()->exists();
    }

    /**
     * Determine whether tenant has a blocking tenancy.
     *
     * Active and pending tenancies block a new assignment.
     */
    public function hasBlockingTenancy(): bool
    {
        return $this->tenancies()
            ->whereIn(
                'status',
                [
                    Tenancy::STATUS_ACTIVE,
                    Tenancy::STATUS_PENDING,
                ]
            )
            ->where(
                'is_active',
                true
            )
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
     * Return current active tenancy.
     */
    public function currentTenancy()
    {
        return $this->activeTenancy()->first();
    }

    /*
    |--------------------------------------------------------------------------
    | Backwards Compatibility
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Older service code may call this method.
    |
    | There is intentionally no `is_active` database column on tenants,
    | so this method does not attempt to synchronize a physical column.
    |
    */

    public function syncActiveStatus(): bool
    {
        return true;
    }

    /*
    |--------------------------------------------------------------------------
    | Generate Tenant Number
    |--------------------------------------------------------------------------
    |
    | Generates a sequential tenant number based on the highest tenant ID.
    |
    | Examples:
    |
    | TNT-000001
    | TNT-000002
    |
    | Soft-deleted tenants are included so tenant numbers are not reused.
    |
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
                ->where(
                    'tenant_number',
                    $number
                )
                ->exists()
        );

        return $number;
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Tenant Status
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
