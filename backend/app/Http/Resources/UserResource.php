<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Services\User\UserStatusMessageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $user = $this->resource;

        $messageService = app(UserStatusMessageService::class);

        /*
        |--------------------------------------------------------------------------
        | RELATIONSHIPS
        |--------------------------------------------------------------------------
        */

        $roles = $this->relationLoaded('roles')
            ? $this->roles
            : collect();

        $permissions = $this->relationLoaded('permissions')
            ? $this->permissions
            : collect();

        /*
        |--------------------------------------------------------------------------
        | ROLE NAMES
        |--------------------------------------------------------------------------
        */

        $roleNames = method_exists($user, 'getRoleNames')
            ? $user->getRoleNames()->values()
            : $roles->pluck('name')->values();

        /*
        |--------------------------------------------------------------------------
        | PERMISSION NAMES
        |--------------------------------------------------------------------------
        */

        $permissionNames = method_exists($user, 'getPermissionNames')
            ? $user->getPermissionNames()->values()
            : $permissions->pluck('name')->values();

        /*
        |--------------------------------------------------------------------------
        | USER ACCOUNT STATUS
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | The users table does NOT use a generic "status" field.
        |
        | Approval is controlled by:
        |
        |     approval_status
        |
        | Account state is controlled by:
        |
        |     account_status
        |
        */

        $approvalStatus = $user->approval_status;

        $accountStatus = $user->account_status;

        /*
        |--------------------------------------------------------------------------
        | APPROVAL FLAGS
        |--------------------------------------------------------------------------
        */

        $isApproved = $approvalStatus === User::APPROVAL_APPROVED;

        $isPending = $approvalStatus === User::APPROVAL_PENDING;

        $isRejected = $approvalStatus === User::APPROVAL_REJECTED;

        /*
        |--------------------------------------------------------------------------
        | ACCOUNT FLAGS
        |--------------------------------------------------------------------------
        */

        $isActive = $accountStatus === User::STATUS_ACTIVE;

        $isInactive = $accountStatus === User::STATUS_INACTIVE;

        $isSuspended = $accountStatus === User::STATUS_SUSPENDED;

        $isBanned = $accountStatus === User::STATUS_BANNED;

        /*
        |--------------------------------------------------------------------------
        | LOGIN STATUS
        |--------------------------------------------------------------------------
        */

        $canLogin = $user->canLogin();

        /*
        |--------------------------------------------------------------------------
        | STATUS LABEL
        |--------------------------------------------------------------------------
        */

        $statusLabel = match (true) {

            $isBanned =>
                'Banned',

            $isSuspended =>
                'Suspended',

            $isInactive =>
                'Inactive',

            $isPending =>
                'Pending Approval',

            $isRejected =>
                'Rejected',

            $isActive && $isApproved =>
                'Active',

            default =>
                'Unknown',
        };

        /*
        |--------------------------------------------------------------------------
        | IMAGE
        |--------------------------------------------------------------------------
        */

        $imageUrl = null;

        if (filled($user->image)) {

            if (
                str_starts_with(
                    (string) $user->image,
                    'http://'
                ) ||
                str_starts_with(
                    (string) $user->image,
                    'https://'
                )
            ) {
                $imageUrl = $user->image;
            } else {
                $imageUrl = asset(
                    'storage/' . ltrim($user->image, '/')
                );
            }
        }

        $imageUrl ??= asset(
            'images/default-avatar.png'
        );

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return [

            /*
            |--------------------------------------------------------------------------
            | PRIMARY USER INFORMATION
            |--------------------------------------------------------------------------
            */

            'id' => $user->id,

            'slug' => $user->slug,

            'first_name' => $user->first_name,

            'last_name' => $user->last_name,

            'full_name' => $user->full_name,

            'email' => $user->email,

            'phone' => $user->phone,

            /*
            |--------------------------------------------------------------------------
            | VERIFICATION
            |--------------------------------------------------------------------------
            */

            'verification' => [

                'is_verified' =>
                    (bool) $user->is_verified,

                'email_verified_at' =>
                    optional(
                        $user->email_verified_at
                    )->toDateTimeString(),

            ],

            /*
            |--------------------------------------------------------------------------
            | PROFILE
            |--------------------------------------------------------------------------
            */

            'profile' => [

                'image' =>
                    $user->image,

                'image_url' =>
                    $imageUrl,

                'gender' =>
                    $user->gender,

                'nationality' =>
                    $user->nationality,

                'address' =>
                    $user->address,

                'date_of_birth' =>
                    optional(
                        $user->date_of_birth
                    )->format('Y-m-d'),

                'bio' =>
                    $user->bio,

            ],

            /*
            |--------------------------------------------------------------------------
            | ACCOUNT
            |--------------------------------------------------------------------------
            */

            'account' => [

                /*
                | Actual account fields from users table
                */

                'approval_status' =>
                    $approvalStatus,

                'account_status' =>
                    $accountStatus,

                /*
                | Computed status
                |
                | This replaces the incorrect:
                |
                |     users.status
                */

                'status' =>
                    $accountStatus,

                'status_label' =>
                    $statusLabel,

                /*
                | Account flags
                */

                'is_active' =>
                    $isActive,

                'is_inactive' =>
                    $isInactive,

                'is_suspended' =>
                    $isSuspended,

                'is_banned' =>
                    $isBanned,

                /*
                | Approval flags
                */

                'is_approved' =>
                    $isApproved,

                'is_pending' =>
                    $isPending,

                'is_rejected' =>
                    $isRejected,

                /*
                | Login
                */

                'can_login' =>
                    $canLogin,

                /*
                | Human-readable messages
                */

                'approval_message' =>
                    $messageService->approvalMessage($user),

                'account_message' =>
                    $messageService->accountMessage($user),

                'login_message' =>
                    $messageService->loginMessage($user),

            ],

            /*
            |--------------------------------------------------------------------------
            | ROLES
            |--------------------------------------------------------------------------
            */

            'primary_role' =>
                $roleNames->first(),

            'role_names' =>
                $roleNames,

            'roles' =>
                $roles
                    ->map(fn ($role) => [

                        'id' =>
                            $role->id,

                        'name' =>
                            $role->name,

                        'guard_name' =>
                            $role->guard_name,

                    ])
                    ->values(),

            /*
            |--------------------------------------------------------------------------
            | PERMISSIONS
            |--------------------------------------------------------------------------
            */

            'permission_names' =>
                $permissionNames,

            'permissions' =>
                $permissions
                    ->map(fn ($permission) => [

                        'id' =>
                            $permission->id,

                        'name' =>
                            $permission->name,

                        'guard_name' =>
                            $permission->guard_name,

                    ])
                    ->values(),

            /*
            |--------------------------------------------------------------------------
            | TRACKING
            |--------------------------------------------------------------------------
            */

            'tracking' => [

                'last_login_at' =>
                    optional(
                        $user->last_login_at
                    )->toDateTimeString(),

                'created_at' =>
                    optional(
                        $user->created_at
                    )->toDateTimeString(),

                'updated_at' =>
                    optional(
                        $user->updated_at
                    )->toDateTimeString(),

                'deleted_at' =>
                    optional(
                        $user->deleted_at
                    )->toDateTimeString(),

            ],

            /*
            |--------------------------------------------------------------------------
            | META
            |--------------------------------------------------------------------------
            */

            'meta' => [

                'has_profile_image' =>
                    filled($user->image),

                'has_phone' =>
                    filled($user->phone),

                'has_bio' =>
                    filled($user->bio),

                'has_roles' =>
                    $roleNames->isNotEmpty(),

                'has_permissions' =>
                    $permissionNames->isNotEmpty(),

                'is_verified' =>
                    (bool) $user->is_verified,

                'can_login' =>
                    $canLogin,

            ],
        ];
    }
}