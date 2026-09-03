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
        | The User account is NOT created by the Tenant model.
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
        | Location
        |
        | `country` represents the tenant's residential/location country.
        | It is intentionally separate from `nationality`.
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
    */

    protected $appends = [
        'full_name',
        'status_label',
        'is_active',
        'account_state',
    ];


    /*
    |--------------------------------------------------------------------------
    | User Relationship
    |--------------------------------------------------------------------------
    |
    | A Tenant profile belongs to an existing User account.
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
    | One tenant profile can have multiple tenancy records.
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
    | Active Attribute
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | is_active is COMPUTED from status.
    | It is NOT a database column.
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
    | Active Scope
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
    | Inactive Scope
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
    | Pending Scope
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
    | Blacklisted Scope
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
    | Verified Scope
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
    | Unverified Scope
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
    | Status Scope
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