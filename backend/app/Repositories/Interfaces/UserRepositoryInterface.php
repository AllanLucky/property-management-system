<?php

namespace App\Repositories\Interfaces;

interface UserRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | CORE USER QUERIES
    |--------------------------------------------------------------------------
    */

    public function all();

    public function findById(int $id);

    public function findByEmail(string $email);

    public function search(string $keyword);

    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */

    public function create(array $data);

    public function update(int $id, array $data);

    public function delete(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | ROLE & PERMISSION HELPERS
    |--------------------------------------------------------------------------
    */

    public function assignRoles(
        int $userId,
        array|string $roles
    );

    public function syncRoles(
        int $userId,
        array|string $roles
    );

    public function assignPermissions(
        int $userId,
        array|string $permissions
    );

    public function syncPermissions(
        int $userId,
        array|string $permissions
    );

    /*
    |--------------------------------------------------------------------------
    | ROLE QUERIES
    |--------------------------------------------------------------------------
    */

    public function getUsersByRole(
        string $role
    );

    public function hasRole(
        int $userId,
        string $role
    ): bool;

    public function hasPermission(
        int $userId,
        string $permission
    ): bool;

    /*
    |--------------------------------------------------------------------------
    | STATUS QUERIES
    |--------------------------------------------------------------------------
    */

    public function getActiveUsers();

    public function getInactiveUsers();

    public function getSuspendedUsers();

    public function getBannedUsers();

    public function getVerifiedUsers();

    public function getPendingApprovalUsers();

    public function getApprovedUsers();

    public function getRejectedUsers();

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD STATS
    |--------------------------------------------------------------------------
    */

    public function countUsers(): int;

    public function countUsersByRole(string $role): int;

    public function countPendingApprovals(): int;

    public function countActiveUsers(): int;

    public function countSuspendedUsers(): int;

    public function countBannedUsers(): int;
}