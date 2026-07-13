<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Services\ImageService;
use App\Repositories\Interfaces\UserRepositoryInterface;
use RuntimeException;

class UserService
{
    public function __construct(
        protected UserRepositoryInterface $userRepo,
        protected RBACService $rbacService,
        protected ImageService $imageService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */
    protected function loadUser(User $user): User
    {
        return $user->fresh()->load(['roles', 'permissions']);
    }

    /*
    |--------------------------------------------------------------------------
    | USERS
    |--------------------------------------------------------------------------
    */
    public function getAllUsers()
    {
        return $this->userRepo->all();
    }

    public function getUser(int $id)
    {
        return $this->userRepo->findById($id);
    }

    public function getUserWithTrashed(int $id)
    {
        return User::withTrashed()->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE USER
    |--------------------------------------------------------------------------
    */
    public function createUser(array $data, ?User $creator = null)
    {
        return DB::transaction(function () use ($data, $creator) {

            /*
            |----------------------------------------------------------
            | IMAGE UPLOAD
            |----------------------------------------------------------
            */
            if (!empty($data['image']) && $data['image'] instanceof \Illuminate\Http\UploadedFile) {

                $upload = $this->imageService->upload($data['image'], 'users');

                if ($upload) {
                    $data['image'] = $upload['url'];
                    $data['image_public_id'] = $upload['public_id'];
                } else {
                    unset($data['image']);
                }
            }

            /*
            |----------------------------------------------------------
            | PASSWORD HASH
            |----------------------------------------------------------
            */
            $data['password'] = Hash::make($data['password']);

            /*
            |----------------------------------------------------------
            | CREATOR RULES
            |----------------------------------------------------------
            */
            $isAdminCreator = $creator &&
                ($creator->hasRole('admin') || $creator->hasRole('super-admin'));

            if ($isAdminCreator) {
                $data['account_status'] = User::STATUS_ACTIVE;
                $data['approval_status'] = User::APPROVAL_APPROVED;
                $data['is_verified'] = true;
            } else {
                $data['account_status'] = User::STATUS_INACTIVE;
                $data['approval_status'] = User::APPROVAL_PENDING;
                $data['is_verified'] = false;
            }

            /*
            |----------------------------------------------------------
            | CREATE USER
            |----------------------------------------------------------
            */
            $user = $this->userRepo->create($data);

            /*
            |----------------------------------------------------------
            | ROLES
            |----------------------------------------------------------
            */
            $roles = $data['roles'] ?? [$data['default_role'] ?? 'user'];

            $this->rbacService->syncRoles($user, $roles);

            /*
            |----------------------------------------------------------
            | PERMISSIONS
            |----------------------------------------------------------
            */
            if (!empty($data['permissions'])) {
                $this->rbacService->syncPermissions($user, $data['permissions']);
            }

            return $this->loadUser($user);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE USER
    |--------------------------------------------------------------------------
    */
    public function updateUser(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {

            $user = $this->userRepo->findById($id);

            if (!$user) {
                throw new RuntimeException('User not found');
            }

            /*
            |----------------------------------------------------------
            | IMAGE REPLACE
            |----------------------------------------------------------
            */
            if (!empty($data['image']) && $data['image'] instanceof \Illuminate\Http\UploadedFile) {

                $upload = $this->imageService->replace(
                    $data['image'],
                    $user->image_public_id,
                    'users'
                );

                if ($upload) {
                    $data['image'] = $upload['url'];
                    $data['image_public_id'] = $upload['public_id'];
                }
            }

            /*
            |----------------------------------------------------------
            | PASSWORD
            |----------------------------------------------------------
            */
            if (!empty($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            } else {
                unset($data['password']);
            }

            $user = $this->userRepo->update($id, $data);

            /*
            |----------------------------------------------------------
            | SYNC ROLES
            |----------------------------------------------------------
            */
            if (array_key_exists('roles', $data)) {
                $this->rbacService->syncRoles($user, $data['roles'] ?? []);
            }

            /*
            |----------------------------------------------------------
            | SYNC PERMISSIONS
            |----------------------------------------------------------
            */
            if (array_key_exists('permissions', $data)) {
                $this->rbacService->syncPermissions($user, $data['permissions'] ?? []);
            }

            return $this->loadUser($user);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE USER (SOFT DELETE)
    |--------------------------------------------------------------------------
    */
    public function deleteUser(int $id)
    {
        $user = $this->userRepo->findById($id);

        if (!$user) {
            throw new RuntimeException('User not found');
        }

        return $this->userRepo->delete($id);
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE USER
    |--------------------------------------------------------------------------
    */
    public function forceDeleteUser(int $id)
    {
        $user = User::withTrashed()->find($id);

        if (!$user) {
            throw new RuntimeException('User not found');
        }

        return $user->forceDelete();
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE USER
    |--------------------------------------------------------------------------
    */
    public function restoreUser(int $id)
    {
        $user = User::withTrashed()->find($id);

        if (!$user) {
            throw new RuntimeException('User not found');
        }

        $user->restore();

        return $this->loadUser($user);
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH USERS
    |--------------------------------------------------------------------------
    */
    public function searchUsers(string $keyword)
    {
        return $this->userRepo->search($keyword);
    }

    /*
    |--------------------------------------------------------------------------
    | ACCOUNT STATUS
    |--------------------------------------------------------------------------
    */
    public function suspendUser(int $userId)
    {
        $user = $this->getUser($userId);

        if (!$user) throw new RuntimeException('User not found');

        $user->update(['account_status' => User::STATUS_SUSPENDED]);

        return $this->loadUser($user);
    }

    public function banUser(int $userId)
    {
        $user = $this->getUser($userId);

        if (!$user) throw new RuntimeException('User not found');

        $user->update(['account_status' => User::STATUS_BANNED]);

        return $this->loadUser($user);
    }

    public function activateUser(int $userId)
    {
        $user = $this->getUser($userId);

        if (!$user) throw new RuntimeException('User not found');

        if ($user->account_status === User::STATUS_BANNED) {
            throw new RuntimeException('Banned users cannot be reactivated.');
        }

        $user->update(['account_status' => User::STATUS_ACTIVE]);

        return $this->loadUser($user);
    }

    /*
    |--------------------------------------------------------------------------
    | APPROVAL WORKFLOW
    |--------------------------------------------------------------------------
    */
    public function approveUser(int $userId)
    {
        $user = $this->getUser($userId);

        if (!$user) throw new RuntimeException('User not found');

        $user->update([
            'approval_status' => User::APPROVAL_APPROVED,
            'account_status'  => User::STATUS_ACTIVE,
            'is_verified'     => true,
        ]);

        return $this->loadUser($user);
    }

    public function rejectUser(int $userId)
    {
        $user = $this->getUser($userId);

        if (!$user) throw new RuntimeException('User not found');

        $user->update([
            'approval_status' => User::APPROVAL_REJECTED,
            'account_status'  => User::STATUS_INACTIVE,
            'is_verified'     => false,
        ]);

        return $this->loadUser($user);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE STATUS
    |--------------------------------------------------------------------------
    */
    public function updateStatus(int $userId, string $accountStatus, ?string $approvalStatus = null)
    {
        $user = $this->getUser($userId);

        if (!$user) throw new RuntimeException('User not found');

        $data = ['account_status' => $accountStatus];

        if ($approvalStatus !== null) {
            $data['approval_status'] = $approvalStatus;
        }

        $user->update($data);

        return $this->loadUser($user);
    }
}