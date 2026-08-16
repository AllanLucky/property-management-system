<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Models\User;      
use App\Models\Tenancy;  

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
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        'photo',
        'photo_public_id',
        'id_front',
        'id_front_public_id',
        'id_back',
        'id_back_public_id',
        'is_verified',
        'verified_at',
        'status',
        'is_active',   // ✅ NEW FIELD
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
        'is_active' => 'boolean',   // ✅ NEW CAST
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
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tenancies()
    {
        return $this->hasMany(Tenancy::class, 'tenant_id');
    }

    public function activeTenancies()
    {
        return $this->hasMany(Tenancy::class, 'tenant_id')
            ->where('status', Tenancy::STATUS_ACTIVE);
    }

    public function pendingTenancies()
    {
        return $this->hasMany(Tenancy::class, 'tenant_id')
            ->where('status', Tenancy::STATUS_PENDING);
    }

    // … keep your scopes, accessors, helpers, and boot method as before
}
