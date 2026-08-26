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
        | User / Identification
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
        | Documents
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
        | Status
        |----------------------------------------------------------------------
        */

        'status',
        'is_active',

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

        'is_active' => 'boolean',

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
    */

    protected $appends = [
        'full_name',
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
                ->filter()
                ->implode(' ')
        );
    }

    /*
    |--------------------------------------------------------------------------
    | User Relationship
    |--------------------------------------------------------------------------
    |
    | A tenant may optionally belong to a user account.
    |
    */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Tenancies Relationship
    |--------------------------------------------------------------------------
    */

    public function tenancies()
    {
        return $this->hasMany(Tenancy::class, 'tenant_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Active Tenancy
    |--------------------------------------------------------------------------
    */

    public function activeTenancy()
    {
        return $this->hasOne(Tenancy::class, 'tenant_id')
            ->where('status', Tenancy::STATUS_ACTIVE);
    }

    /*
    |--------------------------------------------------------------------------
    | Scope: Active
    |--------------------------------------------------------------------------
    */

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /*
    |--------------------------------------------------------------------------
    | Scope: Inactive
    |--------------------------------------------------------------------------
    */

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    /*
    |--------------------------------------------------------------------------
    | Scope: Pending
    |--------------------------------------------------------------------------
    */

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /*
    |--------------------------------------------------------------------------
    | Scope: Blacklisted
    |--------------------------------------------------------------------------
    */

    public function scopeBlacklisted($query)
    {
        return $query->where('status', self::STATUS_BLACKLISTED);
    }

    /*
    |--------------------------------------------------------------------------
    | Scope: Verified
    |--------------------------------------------------------------------------
    */

    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /*
    |--------------------------------------------------------------------------
    | Scope: Unverified
    |--------------------------------------------------------------------------
    */

    public function scopeUnverified($query)
    {
        return $query->where('is_verified', false);
    }

    /*
    |--------------------------------------------------------------------------
    | Status Helpers
    |--------------------------------------------------------------------------
    */

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    public function isInactive(): bool
    {
        return ! $this->is_active;
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
        return $this->update([
            'status' => self::STATUS_ACTIVE,
            'is_active' => true,
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
            'is_active' => false,
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
            'is_active' => false,
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
}
