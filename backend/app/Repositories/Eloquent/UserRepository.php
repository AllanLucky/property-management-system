<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Interfaces\UserRepositoryInterface;
use Illuminate\Support\Facades\DB;

class UserRepository implements UserRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | BASIC QUERIES
    |--------------------------------------------------------------------------
    */

    public function all()
    {
        return User::with([
                'roles',
                'permissions',
            ])
            ->latest()
            ->get();
    }

    public function findById(int $id)
    {
        return User::with([
                'roles',
                'permissions',
            ])
            ->findOrFail($id);
    }

    public function findByEmail(string $email)
    {
        return User::where('email', $email)->first();
    }

    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */

    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {

            $user = User::create($data);

            return $user->fresh([
                'roles',
                'permissions',
            ]);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {

            $user = User::findOrFail($id);

            $user->fill($data);
            $user->save();

            return $user->fresh([
                'roles',
                'permissions',
            ]);
        });
    }

    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $user = User::findOrFail($id);

            return (bool) $user->delete();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    public function search(string $keyword)
    {
        return User::with([
                'roles',
                'permissions',
            ])
            ->where(function ($query) use ($keyword) {

                $query->where('first_name', 'like', "%{$keyword}%")
                    ->orWhere('last_name', 'like', "%{$keyword}%")
                    ->orWhere('email', 'like', "%{$keyword}%")
                    ->orWhere('phone', 'like', "%{$keyword}%");
            })
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | RBAC
    |--------------------------------------------------------------------------
    */

    public function assignRoles(
        int $userId,
        array|string $roles
    ) {
        return DB::transaction(function () use (
            $userId,
            $roles
        ) {

            $user = User::findOrFail($userId);

            $user->assignRole($roles);

            return $user->load([
                'roles',
                'permissions',
            ]);
        });
    }

    public function syncRoles(
        int $userId,
        array|string $roles
    ) {
        return DB::transaction(function () use (
            $userId,
            $roles
        ) {

            $user = User::findOrFail($userId);

            $user->syncRoles($roles);

            return $user->load([
                'roles',
                'permissions',
            ]);
        });
    }

    public function assignPermissions(
        int $userId,
        array|string $permissions
    ) {
        return DB::transaction(function () use (
            $userId,
            $permissions
        ) {

            $user = User::findOrFail($userId);

            $user->givePermissionTo($permissions);

            return $user->load([
                'roles',
                'permissions',
            ]);
        });
    }

    public function syncPermissions(
        int $userId,
        array|string $permissions
    ) {
        return DB::transaction(function () use (
            $userId,
            $permissions
        ) {

            $user = User::findOrFail($userId);

            $user->syncPermissions($permissions);

            return $user->load([
                'roles',
                'permissions',
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ROLE QUERIES
    |--------------------------------------------------------------------------
    */

    public function getUsersByRole(string $role)
    {
        return User::role($role)
            ->with([
                'roles',
                'permissions',
            ])
            ->latest()
            ->get();
    }

    public function hasRole(
        int $userId,
        string $role
    ): bool {
        $user = User::findOrFail($userId);

        return $user->hasRole($role);
    }

    public function hasPermission(
        int $userId,
        string $permission
    ): bool {
        $user = User::findOrFail($userId);

        return $user->hasPermissionTo($permission);
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS QUERIES
    |--------------------------------------------------------------------------
    */

    public function getActiveUsers()
    {
        return User::where(
                'account_status',
                User::STATUS_ACTIVE
            )
            ->with([
                'roles',
                'permissions',
            ])
            ->latest()
            ->get();
    }

    public function getInactiveUsers()
    {
        return User::where(
                'account_status',
                User::STATUS_INACTIVE
            )
            ->with([
                'roles',
                'permissions',
            ])
            ->latest()
            ->get();
    }

    public function getSuspendedUsers()
    {
        return User::where(
                'account_status',
                User::STATUS_SUSPENDED
            )
            ->with([
                'roles',
                'permissions',
            ])
            ->latest()
            ->get();
    }

    public function getBannedUsers()
    {
        return User::where(
                'account_status',
                User::STATUS_BANNED
            )
            ->with([
                'roles',
                'permissions',
            ])
            ->latest()
            ->get();
    }

    public function getVerifiedUsers()
    {
        return User::where(
                'is_verified',
                true
            )
            ->with([
                'roles',
                'permissions',
            ])
            ->latest()
            ->get();
    }

    public function getPendingApprovalUsers()
    {
        return User::where(
                'approval_status',
                User::APPROVAL_PENDING
            )
            ->with([
                'roles',
                'permissions',
            ])
            ->latest()
            ->get();
    }

    public function getApprovedUsers()
    {
        return User::where(
                'approval_status',
                User::APPROVAL_APPROVED
            )
            ->with([
                'roles',
                'permissions',
            ])
            ->latest()
            ->get();
    }

    public function getRejectedUsers()
    {
        return User::where(
                'approval_status',
                User::APPROVAL_REJECTED
            )
            ->with([
                'roles',
                'permissions',
            ])
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD STATS
    |--------------------------------------------------------------------------
    */

    public function countUsers(): int
    {
        return User::count();
    }

    public function countUsersByRole(
        string $role
    ): int {
        return User::role($role)->count();
    }

    public function countPendingApprovals(): int
    {
        return User::where(
            'approval_status',
            User::APPROVAL_PENDING
        )->count();
    }

    public function countActiveUsers(): int
    {
        return User::where(
            'account_status',
            User::STATUS_ACTIVE
        )->count();
    }

    public function countSuspendedUsers(): int
    {
        return User::where(
            'account_status',
            User::STATUS_SUSPENDED
        )->count();
    }

    public function countBannedUsers(): int
    {
        return User::where(
            'account_status',
            User::STATUS_BANNED
        )->count();
    }
}