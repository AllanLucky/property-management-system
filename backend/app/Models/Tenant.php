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
    |
    | These values must match the `status` enum in the tenants table.
    |
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
    |
    | These fields correspond to the columns defined in the tenants table.
    |
    */

    protected $fillable = [

        /*
        |----------------------------------------------------------------------
        | Tenant Identification
        |----------------------------------------------------------------------
        */

        'tenant_number',


        /*
        |----------------------------------------------------------------------
        | User Account Relationship
        |----------------------------------------------------------------------
        */

        'user_id',


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
        | Location Information
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
        | Employment Information
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
        | `status` is the SINGLE source of truth.
        |
        | There is intentionally NO `is_active` database field.
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
    |
    | These casts correspond to the database column types.
    |
    */

    protected $casts = [

        /*
        | Date
        */

        'date_of_birth' => 'date',


        /*
        | Decimal
        */

        'monthly_income' => 'decimal:2',


        /*
        | Verification
        */

        'is_verified' => 'boolean',

        'verified_at' => 'datetime',


        /*
        | Timestamps
        */

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
    | These values do NOT exist as database columns.
    |
    | They are computed when the model is converted to an array/JSON.
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
    | `is_active` is NOT a database column.
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
    | A tenant may optionally have a User account.
    |
    | tenants.user_id -> users.id
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
    | One tenant can have many tenancy records.
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
    | Usage:
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
    | Returns all active tenancies belonging to this tenant.
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


    /*
    |--------------------------------------------------------------------------
    | Verification Helpers
    |--------------------------------------------------------------------------
    */

    public function isVerified(): bool
    {
        return (bool) $this->is_verified;
    }


    /*
    |--------------------------------------------------------------------------
    | Activate Tenant
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
    | There is NO `is_active` database column.
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
    */

    public function hasActiveTenancy(): bool
    {
        return $this->activeTenancies()->exists();
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