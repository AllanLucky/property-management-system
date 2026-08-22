<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Tenancy;
use App\Models\Unit;

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
        'first_name',
        'last_name',
        'other_names',
        'email',
        'phone',
        'date_of_birth',
        'gender',
        'id_number',
        'passport_number',
        'country',
        'county',
        'city',
        'postal_code',
        'address',
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
     * Tenant's linked user account.
     *
     * Every tenant should normally have one User account.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * All tenancies belonging to this tenant.
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
            ->where('status', Tenancy::STATUS_ACTIVE);
    }

    /**
     * Pending tenancies.
     */
    public function pendingTenancies()
    {
        return $this->hasMany(Tenancy::class, 'tenant_id')
            ->where('status', Tenancy::STATUS_PENDING);
    }

    /**
     * Tenant's units through tenancies.
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
    public function scopeActive($query)
    {
        return $query
            ->where('status', self::STATUS_ACTIVE)
            ->where('is_active', true);
    }

    /**
     * Inactive tenants.
     */
    public function scopeInactive($query)
    {
        return $query->where(function ($q) {
            $q->where('status', self::STATUS_INACTIVE)
                ->orWhere('is_active', false);
        });
    }

    /**
     * Pending tenants.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Blacklisted tenants.
     */
    public function scopeBlacklisted($query)
    {
        return $query->where('status', self::STATUS_BLACKLISTED);
    }

    /**
     * Verified tenants.
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /**
     * Unverified tenants.
     */
    public function scopeUnverified($query)
    {
        return $query->where('is_verified', false);
    }

    /**
     * Tenants with a linked user account.
     */
    public function scopeWithUser($query)
    {
        return $query->whereNotNull('user_id');
    }

    /**
     * Tenants without a linked user account.
     */
    public function scopeWithoutUser($query)
    {
        return $query->whereNull('user_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Get tenant's full name.
     */
    public function getFullNameAttribute()
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
    public function getStatusLabelAttribute()
    {
        return match ($this->status) {
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_INACTIVE => 'Inactive',
            self::STATUS_PENDING => 'Pending',
            self::STATUS_BLACKLISTED => 'Blacklisted',

            default => Str::of((string) $this->status)
                ->replace('_', ' ')
                ->title(),
        };
    }

    /**
     * Get verification status.
     */
    public function getVerificationStatusAttribute()
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
    public function hasUser()
    {
        return !is_null($this->user_id);
    }

    /**
     * Determine whether tenant has no linked user account.
     */
    public function doesNotHaveUser()
    {
        return is_null($this->user_id);
    }

    /**
     * Determine whether tenant is active.
     */
    public function isActive()
    {
        return (bool) $this->is_active;
    }

    /**
     * Determine whether tenant is inactive.
     */
    public function isInactive()
    {
        return !$this->is_active;
    }

    /**
     * Determine whether tenant is verified.
     */
    public function isVerified()
    {
        return (bool) $this->is_verified;
    }

    /**
     * Determine whether tenant has an active tenancy.
     */
    public function hasActiveTenancy()
    {
        return $this->activeTenancies()->exists();
    }

    /**
     * Determine whether tenant has any tenancy.
     */
    public function hasTenancy()
    {
        return $this->tenancies()->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | Model Boot
    |--------------------------------------------------------------------------
    */

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($tenant) {
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

    public static function generateTenantNumber()
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