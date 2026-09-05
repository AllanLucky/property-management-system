<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
<<<<<<< HEAD
=======
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
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
        |--------------------------------------------------------------------------
        | Tenant Identification
        |--------------------------------------------------------------------------
        */

        'tenant_number',

        /*
        |--------------------------------------------------------------------------
        | Existing User Account
        |--------------------------------------------------------------------------
        |
        | References users.id.
        |
        | The Tenant model does not create the User account.
        |
<<<<<<< HEAD
        | The Tenant model does not create the User account.
        | It references an existing users.id.
=======
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
        */

        'user_id',

        /*
        |--------------------------------------------------------------------------
        | Personal Information
        |--------------------------------------------------------------------------
        |
        | These fields belong to the tenant profile.
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
<<<<<<< HEAD
        | Residential / Location Information
        |
        | country = residential/location country
        | nationality = nationality
=======
        |--------------------------------------------------------------------------
        | Location
        |--------------------------------------------------------------------------
        |
        | `country` represents the tenant's residential/location country.
        |
        | It is intentionally separate from `nationality`.
        |
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
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
        | Tenant activity is derived from the `status` field.
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
<<<<<<< HEAD
        'active_tenancy_count',
        'tenancy_count',
=======
        'verification_status',
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
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
<<<<<<< HEAD
    */


    /**
     * Tenant belongs to an existing User account.
     */
=======
    |
    | A tenant profile belongs to an existing User account.
    |
    | users.id
    |     ↓
    | tenants.user_id
    |
    */

>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
    public function user(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }

<<<<<<< HEAD

    /**
     * Tenant can have multiple tenancy records.
     */
=======
    /*
    |--------------------------------------------------------------------------
    | Tenancies Relationship
    |--------------------------------------------------------------------------
    |
    | One tenant can have multiple historical tenancy records.
    |
    */

>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
    public function tenancies(): HasMany
    {
        return $this->hasMany(
            Tenancy::class,
            'tenant_id'
        );
    }

<<<<<<< HEAD

    /**
     * Latest active tenancy.
     */
=======
    /*
    |--------------------------------------------------------------------------
    | Active Tenancy
    |--------------------------------------------------------------------------
    |
    | Returns the latest active tenancy.
    |
    | IMPORTANT:
    |
    | `is_active` here belongs to the Tenancy table.
    | It is NOT a Tenant field.
    |
    */

>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
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

<<<<<<< HEAD

    /**
     * All active tenancies.
     */
=======
    /*
    |--------------------------------------------------------------------------
    | Active Tenancies
    |--------------------------------------------------------------------------
    */

>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
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

    /*
    |--------------------------------------------------------------------------
    | Pending Tenancies
    |--------------------------------------------------------------------------
    |
    | Pending tenancies that are still active block another assignment.
    |
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

    /*
    |--------------------------------------------------------------------------
    | Tenant Units
    |--------------------------------------------------------------------------
    |
    | Provides access to units historically or currently assigned through
    | tenancy records.
    |
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
    |
    | Uses the tenant profile identity fields.
    |
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

<<<<<<< HEAD

    /**
     * Determine whether tenant is active.
     *
     * IMPORTANT:
     * This is a computed property.
     * There is no `is_active` database column.
     */
=======
    /*
    |--------------------------------------------------------------------------
    | Computed Active Attribute
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | `is_active` is NOT a database column.
    |
    | It is derived from the tenant status.
    |
    */

>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
    public function getIsActiveAttribute(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

<<<<<<< HEAD

    /**
     * Get human-readable status.
     */
=======
    /*
    |--------------------------------------------------------------------------
    | Status Label
    |--------------------------------------------------------------------------
    */

>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
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

<<<<<<< HEAD

    /**
     * Get account state.
     */
=======
    /*
    |--------------------------------------------------------------------------
    | Account State
    |--------------------------------------------------------------------------
    */

>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
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

    /*
    |--------------------------------------------------------------------------
    | Verification Status
    |--------------------------------------------------------------------------
    */

    public function getVerificationStatusAttribute(): string
    {
        return $this->is_verified
            ? 'verified'
            : 'unverified';
    }

<<<<<<< HEAD
    /**
     * Get active tenancy count.
     *
     * Uses the already-loaded relationship where possible.
     */
    public function getActiveTenancyCountAttribute(): int
    {
        if ($this->relationLoaded('activeTenancies')) {
            return $this->activeTenancies->count();
=======
    /*
    |--------------------------------------------------------------------------
    | Active Scope
    |--------------------------------------------------------------------------
    */

    public function scopeActive(
        Builder $query
    ): Builder {
        return $query->where(
            'status',
            self::STATUS_ACTIVE
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Inactive Scope
    |--------------------------------------------------------------------------
    */

    public function scopeInactive(
        Builder $query
    ): Builder {
        return $query->where(
            'status',
            self::STATUS_INACTIVE
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Pending Scope
    |--------------------------------------------------------------------------
    */

    public function scopePending(
        Builder $query
    ): Builder {
        return $query->where(
            'status',
            self::STATUS_PENDING
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Blacklisted Scope
    |--------------------------------------------------------------------------
    */

    public function scopeBlacklisted(
        Builder $query
    ): Builder {
        return $query->where(
            'status',
            self::STATUS_BLACKLISTED
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Verified Scope
    |--------------------------------------------------------------------------
    */

    public function scopeVerified(
        Builder $query
    ): Builder {
        return $query->where(
            'is_verified',
            true
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Unverified Scope
    |--------------------------------------------------------------------------
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
    | Status Scope
    |--------------------------------------------------------------------------
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
    | With User Scope
    |--------------------------------------------------------------------------
    */

    public function scopeWithUser(
        Builder $query
    ): Builder {
        return $query->whereNotNull('user_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Without User Scope
    |--------------------------------------------------------------------------
    */

    public function scopeWithoutUser(
        Builder $query
    ): Builder {
        return $query->whereNull('user_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Available For New Tenancy
    |--------------------------------------------------------------------------
    |
    | A tenant is available only when they do not have an active or pending
    | tenancy that is still active.
    |
    */

    public function scopeAvailableForTenancy(
        Builder $query
    ): Builder {
        return $query->whereDoesntHave(
            'tenancies',
            function (Builder $q): void {
                $q->whereIn(
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
    | Active Check
    |--------------------------------------------------------------------------
    */

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /*
    |--------------------------------------------------------------------------
    | Inactive Check
    |--------------------------------------------------------------------------
    */

    public function isInactive(): bool
    {
        return $this->status === self::STATUS_INACTIVE;
    }

    /*
    |--------------------------------------------------------------------------
    | Pending Check
    |--------------------------------------------------------------------------
    */

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /*
    |--------------------------------------------------------------------------
    | Blacklisted Check
    |--------------------------------------------------------------------------
    */

    public function isBlacklisted(): bool
    {
        return $this->status === self::STATUS_BLACKLISTED;
    }

    /*
    |--------------------------------------------------------------------------
    | Verified Check
    |--------------------------------------------------------------------------
    */

    public function isVerified(): bool
    {
        return (bool) $this->is_verified;
    }

    /*
    |--------------------------------------------------------------------------
    | Has User
    |--------------------------------------------------------------------------
    */

    public function hasUser(): bool
    {
        return $this->user_id !== null;
    }

    /*
    |--------------------------------------------------------------------------
    | Does Not Have User
    |--------------------------------------------------------------------------
    */

    public function doesNotHaveUser(): bool
    {
        return $this->user_id === null;
    }

    /*
    |--------------------------------------------------------------------------
    | Activate
    |--------------------------------------------------------------------------
    |
    | A blacklisted tenant cannot be activated directly.
    |
    */

    public function activate(): bool
    {
        if ($this->isBlacklisted()) {
            return false;
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
        }

        return $this->activeTenancies()->count();
    }

<<<<<<< HEAD

    /**
     * Get total tenancy count.
     *
     * Uses the already-loaded relationship where possible.
     */
    public function getTenancyCountAttribute(): int
=======
    /*
    |--------------------------------------------------------------------------
    | Deactivate
    |--------------------------------------------------------------------------
    */

    public function deactivate(): bool
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
    {
        if ($this->relationLoaded('tenancies')) {
            return $this->tenancies->count();
        }

        return $this->tenancies()->count();
    }

<<<<<<< HEAD

    /**
     * Get the current active tenancy.
     */
=======
    /*
    |--------------------------------------------------------------------------
    | Blacklist
    |--------------------------------------------------------------------------
    */

    public function blacklist(): bool
    {
        return $this->update([
            'status' => self::STATUS_BLACKLISTED,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Set Pending
    |--------------------------------------------------------------------------
    */

    public function setPending(): bool
    {
        return $this->update([
            'status' => self::STATUS_PENDING,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Verify
    |--------------------------------------------------------------------------
    */

    public function verify(): bool
    {
        return $this->update([
            'is_verified' => true,
            'verified_at' => now(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Unverify
    |--------------------------------------------------------------------------
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
    | Has Active Tenancy
    |--------------------------------------------------------------------------
    */

    public function hasActiveTenancy(): bool
    {
        return $this->activeTenancies()->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | Has Pending Tenancy
    |--------------------------------------------------------------------------
    */

    public function hasPendingTenancy(): bool
    {
        return $this->pendingTenancies()->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | Has Blocking Tenancy
    |--------------------------------------------------------------------------
    |
    | Active and pending tenancies block a new tenancy assignment.
    |
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

    /*
    |--------------------------------------------------------------------------
    | Is Available For New Tenancy
    |--------------------------------------------------------------------------
    */

    public function isAvailableForTenancy(): bool
    {
        return !$this->hasBlockingTenancy();
    }

    /*
    |--------------------------------------------------------------------------
    | Has Any Tenancy
    |--------------------------------------------------------------------------
    */

    public function hasTenancy(): bool
    {
        return $this->tenancies()->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | Current Tenancy
    |--------------------------------------------------------------------------
    |
    | Returns the loaded active tenancy when available.
    |
    | Otherwise, queries the latest active tenancy.
    |
    */

>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
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
    | Soft-deleted tenants are included so their tenant numbers are never
    | accidentally reused.
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