<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Models\User;
use App\Services\User\UserStatusMessageService;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $messageService = app(UserStatusMessageService::class);

        $user = $this->resource;

        /*
        |------------------------------------------
        | RELATIONS
        |------------------------------------------
        */
        $roles = $this->relationLoaded('roles')
            ? $this->roles
            : collect();

        $permissions = $this->relationLoaded('permissions')
            ? $this->permissions
            : collect();

        $roleNames = method_exists($this, 'getRoleNames')
            ? $this->getRoleNames()->values()
            : $roles->pluck('name')->values();

        $permissionNames = method_exists($this, 'getPermissionNames')
            ? $this->getPermissionNames()->values()
            : $permissions->pluck('name')->values();

        /*
        |------------------------------------------
        | STATUS FLAGS
        |------------------------------------------
        */
        $status = $user->approval_status;
        $accountStatus = $user->account_status;

        $isApproved  = $status === User::APPROVAL_APPROVED;
        $isPending   = $status === User::APPROVAL_PENDING;
        $isRejected  = $status === User::APPROVAL_REJECTED;

        $isActive    = $accountStatus === User::STATUS_ACTIVE;
        $isInactive  = $accountStatus === User::STATUS_INACTIVE;
        $isSuspended = $accountStatus === User::STATUS_SUSPENDED;
        $isBanned    = $accountStatus === User::STATUS_BANNED;

        $canLogin = $isApproved && $isActive;

        $statusLabel = match (true) {
            $isBanned => 'Banned',
            $isSuspended => 'Suspended',
            $isInactive => 'Inactive',
            $isPending => 'Pending Approval',
            $isRejected => 'Rejected',
            $isActive && $isApproved => 'Active',
            default => 'Unknown',
        };

        /*
        |------------------------------------------
        | IMAGE HANDLING (FIXED 🔥)
        |------------------------------------------
        */
        $imageUrl = null;

        if (!empty($user->image)) {

            // Cloudinary or external URL support
            if (str_starts_with($user->image, 'http')) {
                $imageUrl = $user->image;
            } else {
                $imageUrl = asset('storage/' . $user->image);
            }
        }

        // fallback avatar
        $imageUrl = $imageUrl ?: asset('images/default-avatar.png');

        /*
        |------------------------------------------
        | RESPONSE
        |------------------------------------------
        */
        return [
            'id' => $user->id,
            'slug' => $user->slug,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'full_name' => "{$user->first_name} {$user->last_name}",
            'email' => $user->email,
            'phone' => $user->phone,

            /*
            |------------------------------------------
            | VERIFICATION
            |------------------------------------------
            */
            'is_verified' => (bool) $user->is_verified,
            'email_verified_at' => optional($user->email_verified_at)->toDateTimeString(),

            /*
            |------------------------------------------
            | PROFILE
            |------------------------------------------
            */
            'profile' => [
                'image' => $user->image,
                'image_url' => $imageUrl,
                'image_public_id' => $user->image_public_id,
                'gender' => $user->gender,
                'nationality' => $user->nationality,
                'address' => $user->address,
                'date_of_birth' => $user->date_of_birth,
                'bio' => $user->bio,
            ],

            /*
            |------------------------------------------
            | ACCOUNT
            |------------------------------------------
            */
            'account' => [
                'approval_status' => $status,
                'account_status' => $accountStatus,

                'is_active' => $isActive,
                'is_inactive' => $isInactive,
                'is_suspended' => $isSuspended,
                'is_banned' => $isBanned,

                'is_approved' => $isApproved,
                'is_pending' => $isPending,
                'is_rejected' => $isRejected,

                'can_login' => $canLogin,
                'status_label' => $statusLabel,

                'approval_message' => $messageService->approvalMessage($user),
                'account_message'  => $messageService->accountMessage($user),
                'login_message'    => $messageService->loginMessage($user),
            ],

            /*
            |------------------------------------------
            | SECURITY
            |------------------------------------------
            */
            'security' => [
                'has_password' => filled($user->password),
                'has_refresh_token' => filled($user->refresh_token),
                'refresh_token_expires_at' => optional($user->refresh_token_expires_at)->toDateTimeString(),
            ],

            /*
            |------------------------------------------
            | TRACKING
            |------------------------------------------
            */
            'tracking' => [
                'last_login_at' => optional($user->last_login_at)->toDateTimeString(),
                'created_at' => optional($user->created_at)->toDateTimeString(),
                'updated_at' => optional($user->updated_at)->toDateTimeString(),
                'deleted_at' => optional($user->deleted_at)->toDateTimeString(),
            ],

            /*
            |------------------------------------------
            | ROLES
            |------------------------------------------
            */
            'primary_role' => $roleNames->first(),
            'role_names' => $roleNames,
            'roles' => $roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
            ])->values(),

            /*
            |------------------------------------------
            | PERMISSIONS
            |------------------------------------------
            */
            'permission_names' => $permissionNames,
            'permissions' => $permissions->map(fn ($permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'guard_name' => $permission->guard_name,
            ])->values(),

            /*
            |------------------------------------------
            | META
            |------------------------------------------
            */
            'meta' => [
                'has_profile_image' => filled($user->image),
                'has_phone' => filled($user->phone),
                'has_bio' => filled($user->bio),
                'has_roles' => $roleNames->isNotEmpty(),
                'has_permissions' => $permissionNames->isNotEmpty(),
                'can_login' => $canLogin,
            ],
        ];
    }
}