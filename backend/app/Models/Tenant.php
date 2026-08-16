<?php

namespace App\Models;

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

        /*
        |--------------------------------------------------------------------------
        | User Relationship
        |--------------------------------------------------------------------------
        |
        | Nullable because a tenant can exist without a login account.
        |
        */
        'user_id',

        /*
        |--------------------------------------------------------------------------
        | Tenant Identification
        |--------------------------------------------------------------------------
        */

        'tenant_number',

        /*
        |--------------------------------------------------------------------------
        | Personal Information
        |--------------------------------------------------------------------------
        */

        'first_name',
        'last_name',
        'other_names',

        'email',
        'phone',

        'date_of_birth',
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
        | Address
        |--------------------------------------------------------------------------
        */

        'country',
        'county',
        'city',
        'postal_code',
        'address',

        /*
        |--------------------------------------------------------------------------
        | Employment Information
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
        | Status
        |--------------------------------------------------------------------------
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
    | Hidden
    |--------------------------------------------------------------------------
    |
    | Internal/private fields that should not be exposed directly in API
    | responses.
    |
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
     * Tenant's application user account.
     *
     * tenants.user_id -> users.id
     *
     * A tenant may exist without a user account, therefore user_id
     * is nullable.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Tenant's tenancy agreements.
     *
     * tenants.id -> tenancies.tenant_id
     */
    public function tenancies()
    {
        return $this->hasMany(Tenancy::class, 'tenant_id');
    }

    /**
     * Tenant's active tenancies.
     */
    public function activeTenancies()
    {
        return $this->hasMany(Tenancy::class, 'tenant_id')
            ->where('status', Tenancy::STATUS_ACTIVE);
    }

    /**
     * Tenant's pending tenancies.
     */
    public function pendingTenancies()
    {
        return $this->hasMany(Tenancy::class, 'tenant_id')
            ->where('status', Tenancy::STATUS_PENDING);
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Get active tenants.
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Get inactive tenants.
     */
    public function scopeInactive($query)
    {
        return $query->where('status', self::STATUS_INACTIVE);
    }

    /**
     * Get pending tenants.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Get blacklisted tenants.
     */
    public function scopeBlacklisted($query)
    {
        return $query->where('status', self::STATUS_BLACKLISTED);
    }

    /**
     * Get verified tenants.
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /**
     * Get unverified tenants.
     */
    public function scopeUnverified($query)
    {
        return $query->where('is_verified', false);
    }

    /**
     * Get tenants that have a user account.
     */
    public function scopeWithUser($query)
    {
        return $query->whereNotNull('user_id');
    }

    /**
     * Get tenants without a user account.
     */
    public function scopeWithoutUser($query)
    {
        return $query->whereNull('user_id');
    }

    /**
     * Search tenants.
     */
    public function scopeSearch($query, ?string $search)
    {
        if (empty($search)) {
            return $query;
        }

        $search = trim($search);

        return $query->where(function ($q) use ($search) {

            $q->where('tenant_number', 'like', "%{$search}%")
                ->orWhere('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('other_names', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('id_number', 'like', "%{$search}%")
                ->orWhere('passport_number', 'like', "%{$search}%");
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Get tenant full name.
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
     * Get human-readable tenant status.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_INACTIVE => 'Inactive',
            self::STATUS_PENDING => 'Pending',
            self::STATUS_BLACKLISTED => 'Blacklisted',
            default => ucfirst((string) $this->status),
        };
    }

    /**
     * Get human-readable verification status.
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
     * Determine whether tenant has a user account.
     */
    public function hasUserAccount(): bool
    {
        return ! is_null($this->user_id);
    }

    /**
     * Determine whether tenant does not have a user account.
     */
    public function hasNoUserAccount(): bool
    {
        return is_null($this->user_id);
    }

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
     * Determine whether tenant is unverified.
     */
    public function isUnverified(): bool
    {
        return ! $this->isVerified();
    }

    /**
     * Determine whether tenant currently has an active tenancy.
     */
    public function hasActiveTenancy(): bool
    {
        return $this->activeTenancies()->exists();
    }

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

    /**
     * Activate tenant.
     */
    public function activate(): bool
    {
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
     * Mark tenant as pending.
     */
    public function markAsPending(): bool
    {
        return $this->update([
            'status' => self::STATUS_PENDING,
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
     * Attach a user account to the tenant.
     */
    public function attachUser(User $user): bool
    {
        return $this->update([
            'user_id' => $user->id,
        ]);
    }

    /**
     * Detach the user account from the tenant.
     */
    public function detachUser(): bool
    {
        return $this->update([
            'user_id' => null,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Boot
    |--------------------------------------------------------------------------
    */

    protected static function boot(): void
    {
        parent::boot();

        /*
        |--------------------------------------------------------------------------
        | Generate Tenant Number
        |--------------------------------------------------------------------------
        */

        static::creating(function (Tenant $tenant) {

            if (empty($tenant->tenant_number)) {

                do {
                    $tenantNumber =
                        'TNT-' .
                        strtoupper(Str::random(8));

                } while (
                    static::withTrashed()
                        ->where('tenant_number', $tenantNumber)
                        ->exists()
                );

                $tenant->tenant_number = $tenantNumber;
            }
        });
    }
}