<?php

namespace App\Repositories\Interfaces;

use Spatie\Permission\Models\Role;

interface RoleRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | READ OPERATIONS
    |--------------------------------------------------------------------------
    */

    public function getAll();

    public function findById(int $id): Role;

    public function findByName(string $name): ?Role;

    /*
    |--------------------------------------------------------------------------
    | WRITE OPERATIONS
    |--------------------------------------------------------------------------
    */

    public function create(array $data): Role;

    public function update(Role $role, array $data): Role;

    public function delete(Role $role): bool;

    /*
    |--------------------------------------------------------------------------
    | UTILITY (IMPORTANT FOR RBAC SYSTEMS)
    |--------------------------------------------------------------------------
    */

    public function exists(string $name): bool;
}