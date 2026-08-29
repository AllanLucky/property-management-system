<?php

namespace App\Models;

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
    | Supported Tenant Statuses
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
        |----------------------------------------------------------------------
        | User / Tenant Identification
        |----------------------------------------------------------------------
        */

        'user_id',
        'tenant_number',

        /*
        |----------------------------------------------------------------------
        | Personal Information
        |----------------------------------------------------------------------
        */

        'first_name',
        'last_name',
        'other_names',
        'email',
        'phone',
        'date_of_birth',
        'gender',

        /*
        |----------------------------------------------------------------------
        | Identification
        |----------------------------------------------------------------------
        */

        'id_number',
        'passport_number',

        /*
        |----------------------------------------------------------------------
        | Location
        |----------------------------------------------------------------------
        */

        'country',
        'region',
        'county',
        'city',
        'area',
        'postal_code',
        'address',

        /*
        |----------------------------------------------------------------------
        | Employment
        |----------------------------------------------------------------------
        */

        'occupation',
        'employer',
        'monthly_income',

        /*
        |----------------------------------------------------------------------
        | Emergency Contact
        |----------------------------------------------------------------------
        */

        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',

        /*
        |----------------------------------------------------------------------
        | Tenant Documents
        |----------------------------------------------------------------------
        */

        'photo',
        'photo_public_id',
        'id_front',
        'id_front_public_id',
        'id_back',
        'id_back_public_id',

        /*
        |----------------------------------------------------------------------
        | Verification
        |----------------------------------------------------------------------
        */

        'is_verified',
        'verified_at',

        /*
        |----------------------------------------------------------------------
        | Tenant Status
        |----------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | `status` is the single source of truth.
        |
        | There is NO `is_active` database column.
        |
        */

        'status',

        /*
        |----------------------------------------------------------------------
        | Notes
        |----------------------------------------------------------------------
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
    */

    protected $appends = [
        'full_name',
        'status_label',
        'is_active',
        'account_state',
    ];


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
    | This is NOT a database column.
    |
    | It is calculated from `status`.
    |
    */

    public function getIsActiveAttribute(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }


    /*
    |--------------------------------------------------------------------------
    | User Relationship
    |--------------------------------------------------------------------------
    |
    | A tenant can optionally have a user account.
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
    | Returns all tenancies belonging to this tenant.
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
    | Returns one active tenancy.
    |
    | Use:
    |
    | $tenant->activeTenancy
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
            ->latestOfMany();
    }


    /*
    |--------------------------------------------------------------------------
    | Active Tenancies
    |--------------------------------------------------------------------------
    |
    | Returns ALL active tenancies.
    |
    | This relationship is required when code uses:
    |
    | with('activeTenancies')
    |
    | or:
    |
    | $tenant->activeTenancies
    |
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
            );
    }


    /*
    |--------------------------------------------------------------------------
    | Scope: Active
    |--------------------------------------------------------------------------
    */

    public function scopeActive($query)
    {
        return $query->where(
            'status',
            self::STATUS_ACTIVE
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Scope: Inactive
    |--------------------------------------------------------------------------
    */

    public function scopeInactive($query)
    {
        return $query->where(
            'status',
            self::STATUS_INACTIVE
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Scope: Pending
    |--------------------------------------------------------------------------
    */

    public function scopePending($query)
    {
        return $query->where(
            'status',
            self::STATUS_PENDING
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Scope: Blacklisted
    |--------------------------------------------------------------------------
    */

    public function scopeBlacklisted($query)
    {
        return $query->where(
            'status',
            self::STATUS_BLACKLISTED
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Scope: Verified
    |--------------------------------------------------------------------------
    */

    public function scopeVerified($query)
    {
        return $query->where(
            'is_verified',
            true
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Scope: Unverified
    |--------------------------------------------------------------------------
    */

    public function scopeUnverified($query)
    {
        return $query->where(
            'is_verified',
            false
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Scope: Status
    |--------------------------------------------------------------------------
    */

    public function scopeStatus(
        $query,
        string $status
    ) {
        return $query->where(
            'status',
            $status
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Status Helpers
    |--------------------------------------------------------------------------
    */

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }


    public function isInactive(): bool
    {
        return $this->status === self::STATUS_INACTIVE;
    }


    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }


    public function isBlacklisted(): bool
    {
        return $this->status === self::STATUS_BLACKLISTED;
    }


    public function isVerified(): bool
    {
        return (bool) $this->is_verified;
    }


    /*
    |--------------------------------------------------------------------------
    | Activate Tenant
    |--------------------------------------------------------------------------
    */

    public function activate(): bool
    {
        /*
        | Do not allow a blacklisted tenant to be activated directly.
        */

        if ($this->isBlacklisted()) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_ACTIVE,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Deactivate Tenant
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
    | Blacklist Tenant
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
    | Verify Tenant
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
    | Unverify Tenant
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
    | Synchronize Active Status
    |--------------------------------------------------------------------------
    |
    | Kept for backwards compatibility.
    |
    | There is no `is_active` database column.
    |
    */

    public function syncActiveStatus(): bool
    {
        return true;
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
                        '_',
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
    | Has Active Tenancy
    |--------------------------------------------------------------------------
    |
    | Checks whether the tenant currently has at least one active tenancy.
    |
    */

    public function hasActiveTenancy(): bool
    {
        return $this->activeTenancies()->exists();
    }


    /*
    |--------------------------------------------------------------------------
    | Get Current Tenancy
    |--------------------------------------------------------------------------
    |
    | Returns the tenant's current active tenancy.
    |
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
    | Tenancy Count
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
    | Status Validation
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
