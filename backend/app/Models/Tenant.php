<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
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
        | This references users.id.
        | The Tenant model does not create the User account.
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
        'gender',

        /*
        | Identification
        */

        'id_number',
        'passport_number',

        /*
        | Location
        */

        'country',
        'region',
        'county',
        'city',
        'area',
        'postal_code',
        'address',

        /*
        | Employment / Financial Information
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
        | There is intentionally NO is_active database column.
        | is_active is computed from status.
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
    */

    protected $appends = [
        'full_name',
        'status_label',
        'is_active',
        'account_state',
        'verification_status',
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
            | Generate tenant number automatically when not supplied.
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
            | Set verification timestamp automatically.
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
            | A tenant profile must not be detached from its
            | linked user account once assigned.
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
            | Keep verification timestamp consistent.
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
    | User Relationship
    |--------------------------------------------------------------------------
    |
    | A tenant profile belongs to an existing User account.
    |
    | users.id
    |     ↓
    | tenants.user_id
    |
    */

    public function user()
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Tenancies Relationship
    |--------------------------------------------------------------------------
    |
    | One tenant can have multiple historical tenancy records.
    |
    */

    public function tenancies()
    {
        return $this->hasMany(
            Tenancy::class,
            'tenant_id'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Active Tenancy
    |--------------------------------------------------------------------------
    |
    | Returns the latest active tenancy.
    |
    */

    public function activeTenancy()
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


    /*
    |--------------------------------------------------------------------------
    | Active Tenancies
    |--------------------------------------------------------------------------
    */

    public function activeTenancies()
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
    | Pending tenancies block another assignment while they remain active.
    |
    */

    public function pendingTenancies()
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
    | Historical and current unit assignments are preserved.
    |
    */

    public function units()
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
    | Full Name
    |--------------------------------------------------------------------------
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
                    fn ($value) =>
                        $value !== null &&
                        trim((string) $value) !== ''
                )
                ->implode(' ')
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Computed Active Attribute
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | is_active is NOT a database column.
    | It is derived from the tenant status.
    |
    */

    public function getIsActiveAttribute(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }


    /*
    |--------------------------------------------------------------------------
    | Status Label
    |--------------------------------------------------------------------------
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


    /*
    |--------------------------------------------------------------------------
    | Account State
    |--------------------------------------------------------------------------
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
    | A tenant is available only when they do not have an active
    | or pending tenancy that is still active.
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
        }

        return $this->update([
            'status' => self::STATUS_ACTIVE,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Deactivate
    |--------------------------------------------------------------------------
    */

    public function deactivate(): bool
    {
        return $this->update([
            'status' => self::STATUS_INACTIVE,
        ]);
    }


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
    | There is intentionally no is_active database column.
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
    | Active Tenancy Count
    |--------------------------------------------------------------------------
    */

    public function getActiveTenancyCountAttribute(): int
    {
        if ($this->relationLoaded('activeTenancies')) {
            return $this->activeTenancies->count();
        }

        return $this->activeTenancies()->count();
    }


    /*
    |--------------------------------------------------------------------------
    | Total Tenancy Count
    |--------------------------------------------------------------------------
    */

    public function getTenancyCountAttribute(): int
    {
        if ($this->relationLoaded('tenancies')) {
            return $this->tenancies->count();
        }

        return $this->tenancies()->count();
    }


    /*
    |--------------------------------------------------------------------------
    | Generate Tenant Number
    |--------------------------------------------------------------------------
    |
    | Examples:
    |
    | TNT-000001
    | TNT-000002
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