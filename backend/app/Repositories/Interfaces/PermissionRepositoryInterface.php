<?php

namespace App\Repositories\Interfaces;

use Spatie\Permission\Models\Permission;

interface PermissionRepositoryInterface
{
    public function getAll();

    public function findById(int $id): Permission;

    public function create(array $data): Permission;

    public function update(Permission $permission, array $data): Permission;

    public function delete(Permission $permission): bool;
}