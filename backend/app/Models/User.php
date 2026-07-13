<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use App\Services\ImageService;
class User extends Authenticatable
{
    use HasApiTokens, HasRoles, HasFactory, Notifiable, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | GUARD
    |--------------------------------------------------------------------------
    */
    protected $guard_name = 'web';

    /*
    |--------------------------------------------------------------------------
    | ACCOUNT STATUS
    |--------------------------------------------------------------------------
    */
    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_BANNED = 'banned';

    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
        self::STATUS_SUSPENDED,
        self::STATUS_BANNED,
    ];

    /*
    |--------------------------------------------------------------------------
    | APPROVAL STATUS
    |--------------------------------------------------------------------------
    */
    public const APPROVAL_PENDING = 'pending';
    public const APPROVAL_APPROVED = 'approved';
    public const APPROVAL_REJECTED = 'rejected';

    public const APPROVALS = [
        self::APPROVAL_PENDING,
        self::APPROVAL_APPROVED,
        self::APPROVAL_REJECTED,
    ];

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */
    protected $table = 'users';

    /*
    |--------------------------------------------------------------------------
    | FILLABLE
    |--------------------------------------------------------------------------
    */
    protected $fillable = [
        'first_name',
        'last_name',
        'slug',
        'email',
        'phone',
        'password',

        'otp',
        'otp_expires_at',
        'is_verified',

        'image',
        'image_public_id',
        'gender',
        'nationality',
        'address',
        'date_of_birth',
        'bio',

        'approval_status',
        'account_status',
        'is_banner',

        'last_login_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | HIDDEN
    |--------------------------------------------------------------------------
    */
    protected $hidden = [
        'password',
        'remember_token',
        'otp',
        'image_public_id',
        'deleted_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | APPENDS
    |--------------------------------------------------------------------------
    */
    protected $appends = [
        'full_name',
        'image_url',
        'initials',
        'is_active',
        'is_verified_user',
        'is_super_admin',
    ];

    /*
    |--------------------------------------------------------------------------
    | EAGER LOAD
    |--------------------------------------------------------------------------
    */
    protected $with = ['roles'];

    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'otp_expires_at' => 'datetime',
            'date_of_birth' => 'date',
            'last_login_at' => 'datetime',
            'deleted_at' => 'datetime',

            'is_verified' => 'boolean',
            'is_banner' => 'boolean',
            'password' => 'hashed',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function getInitialsAttribute(): string
    {
        return strtoupper(
            Str::substr($this->first_name, 0, 1) .
            Str::substr($this->last_name, 0, 1)
        );
    }

    public function getImageUrlAttribute(): string
    {
        return $this->image ?: asset('images/default-user.png');
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->account_status === self::STATUS_ACTIVE;
    }

    public function getIsVerifiedUserAttribute(): bool
    {
        return (bool) $this->is_verified;
    }

    public function getIsSuperAdminAttribute(): bool
    {
        return $this->hasRole('super-admin');
    }

    /*
    |--------------------------------------------------------------------------
    | LOGIN CHECK
    |--------------------------------------------------------------------------
    */
    public function canLogin(): bool
    {
        return $this->approval_status === self::APPROVAL_APPROVED
            && $this->account_status === self::STATUS_ACTIVE;
    }

    /*
    |--------------------------------------------------------------------------
    | ROLE HELPERS
    |--------------------------------------------------------------------------
    */
    public function isAdmin(): bool { return $this->hasRole('admin'); }
    public function isSuperAdmin(): bool { return $this->hasRole('super-admin'); }
    public function isAgent(): bool { return $this->hasRole('agent'); }
    public function isLandlord(): bool { return $this->hasRole('landlord'); }
    public function isTenant(): bool { return $this->hasRole('tenant'); }

    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('account_status', self::STATUS_ACTIVE);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('account_status', self::STATUS_INACTIVE);
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('approval_status', self::APPROVAL_APPROVED);
    }

    public function scopePendingApproval(Builder $query): Builder
    {
        return $query->where('approval_status', self::APPROVAL_PENDING);
    }

    public function scopeAdmins(Builder $query)
    {
        return $query->role('admin');
    }

    public function scopeSuperAdmins(Builder $query)
    {
        return $query->role('super-admin');
    }

    /*
    |--------------------------------------------------------------------------
    | BOOT
    |--------------------------------------------------------------------------
    */
   protected static function boot(): void
    {
       parent::boot();

        static::creating(function (User $user) {

        $user->account_status ??= self::STATUS_INACTIVE;
        $user->approval_status ??= self::APPROVAL_PENDING;
        $user->is_verified ??= false;
        $user->is_banner ??= false;

        if (empty($user->slug)) {

            $baseSlug = Str::slug(
                $user->full_name ?: $user->email
            );

            $slug = $baseSlug;
            $counter = 1;

            while (static::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter++;
            }

            $user->slug = $slug;
        }
    });


    /*
    |--------------------------------------------------------------------------
    | Delete Cloudinary image only on permanent delete
    |--------------------------------------------------------------------------
    */
    static::forceDeleted(function (User $user) {

        if (!empty($user->image_public_id)) {

            app(ImageService::class)
                ->delete($user->image_public_id);
        }
    });
  }
}