<?php

namespace App\Models;

use App\Services\ImageService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

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
    | DATABASE TABLE
    |--------------------------------------------------------------------------
    */

    protected $table = 'users';


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
    | MASS ASSIGNABLE FIELDS
    |--------------------------------------------------------------------------
    */

    protected $fillable = [

        /*
        |----------------------------------------------------------------------
        | Personal Information
        |----------------------------------------------------------------------
        */

        'first_name',
        'last_name',
        'slug',
        'email',
        'phone',
        'gender',
        'nationality',
        'address',
        'date_of_birth',
        'bio',


        /*
        |----------------------------------------------------------------------
        | Authentication
        |----------------------------------------------------------------------
        */

        'password',

        'otp',
        'otp_expires_at',

        'is_verified',


        /*
        |----------------------------------------------------------------------
        | Profile Image
        |----------------------------------------------------------------------
        */

        'image',
        'image_public_id',


        /*
        |----------------------------------------------------------------------
        | Account Management
        |----------------------------------------------------------------------
        */

        'approval_status',
        'account_status',
        'is_banner',

        'last_login_at',
    ];


    /*
    |--------------------------------------------------------------------------
    | HIDDEN ATTRIBUTES
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
    | APPENDED ATTRIBUTES
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
    | EAGER LOADED RELATIONSHIPS
    |--------------------------------------------------------------------------
    |
    | Roles are automatically loaded because they are commonly required
    | throughout the application.
    |
    | Tenant is NOT globally eager loaded to avoid unnecessary queries
    | for users who are not tenants.
    |
    */

    protected $with = [
        'roles',
    ];


    /*
    |--------------------------------------------------------------------------
    | ATTRIBUTE CASTS
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [

            /*
            | Dates
            */

            'email_verified_at' => 'datetime',

            'otp_expires_at' => 'datetime',

            'date_of_birth' => 'date',

            'last_login_at' => 'datetime',

            'deleted_at' => 'datetime',


            /*
            | Boolean values
            */

            'is_verified' => 'boolean',

            'is_banner' => 'boolean',


            /*
            | Password
            */

            'password' => 'hashed',
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | TENANT RELATIONSHIP
    |--------------------------------------------------------------------------
    |
    | One User can belong to one Tenant.
    |
    | tenants.user_id -> users.id
    |
    | The tenants.user_id column is unique, therefore a user can have
    | only one tenant profile.
    |
    */

    public function tenant()
    {
        return $this->hasOne(
            Tenant::class,
            'user_id'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | FULL NAME
    |--------------------------------------------------------------------------
    */

    public function getFullNameAttribute(): string
    {
        return trim(
            collect([
                $this->first_name,
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
    | INITIALS
    |--------------------------------------------------------------------------
    */

    public function getInitialsAttribute(): string
    {
        $firstName = trim((string) $this->first_name);

        $lastName = trim((string) $this->last_name);

        return strtoupper(
            Str::substr($firstName, 0, 1) .
            Str::substr($lastName, 0, 1)
        );
    }


    /*
    |--------------------------------------------------------------------------
    | IMAGE URL
    |--------------------------------------------------------------------------
    */

    public function getImageUrlAttribute(): string
    {
        return $this->image
            ?: asset('images/default-user.png');
    }


    /*
    |--------------------------------------------------------------------------
    | ACTIVE ACCOUNT
    |--------------------------------------------------------------------------
    |
    | This is computed from account_status.
    |
    | It is NOT a database column.
    |
    */

    public function getIsActiveAttribute(): bool
    {
        return $this->account_status === self::STATUS_ACTIVE;
    }


    /*
    |--------------------------------------------------------------------------
    | VERIFIED USER
    |--------------------------------------------------------------------------
    */

    public function getIsVerifiedUserAttribute(): bool
    {
        return (bool) $this->is_verified;
    }


    /*
    |--------------------------------------------------------------------------
    | SUPER ADMIN
    |--------------------------------------------------------------------------
    */

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

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }


    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super-admin');
    }


    public function isAgent(): bool
    {
        return $this->hasRole('agent');
    }


    public function isLandlord(): bool
    {
        return $this->hasRole('landlord');
    }


    public function isTenant(): bool
    {
        return $this->hasRole('tenant');
    }


    /*
    |--------------------------------------------------------------------------
    | ACCOUNT STATUS SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopeActive(
        Builder $query
    ): Builder {
        return $query->where(
            'account_status',
            self::STATUS_ACTIVE
        );
    }


    public function scopeInactive(
        Builder $query
    ): Builder {
        return $query->where(
            'account_status',
            self::STATUS_INACTIVE
        );
    }


    /*
    |--------------------------------------------------------------------------
    | APPROVAL SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopeApproved(
        Builder $query
    ): Builder {
        return $query->where(
            'approval_status',
            self::APPROVAL_APPROVED
        );
    }


    public function scopePendingApproval(
        Builder $query
    ): Builder {
        return $query->where(
            'approval_status',
            self::APPROVAL_PENDING
        );
    }


    /*
    |--------------------------------------------------------------------------
    | ROLE SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopeAdmins(
        Builder $query
    ) {
        return $query->role('admin');
    }


    public function scopeSuperAdmins(
        Builder $query
    ) {
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


        /*
        |----------------------------------------------------------------------
        | Creating
        |----------------------------------------------------------------------
        */

        static::creating(function (User $user) {

            $user->account_status ??= self::STATUS_INACTIVE;

            $user->approval_status ??= self::APPROVAL_PENDING;

            $user->is_verified ??= false;

            $user->is_banner ??= false;


            /*
            |------------------------------------------------------------------
            | Generate Unique Slug
            |------------------------------------------------------------------
            */

            if (empty($user->slug)) {

                $baseSlug = Str::slug(
                    $user->full_name ?: $user->email
                );

                $slug = $baseSlug;

                $counter = 1;

                while (
                    static::where(
                        'slug',
                        $slug
                    )->exists()
                ) {
                    $slug = $baseSlug . '-' . $counter++;
                }

                $user->slug = $slug;
            }
        });


        /*
        |----------------------------------------------------------------------
        | Delete Cloudinary Image On Permanent Delete
        |----------------------------------------------------------------------
        */

        static::forceDeleted(function (User $user) {

            if (!empty($user->image_public_id)) {

                app(ImageService::class)
                    ->delete(
                        $user->image_public_id
                    );
            }
        });
    }
}