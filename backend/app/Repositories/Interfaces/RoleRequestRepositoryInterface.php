<?php

namespace App\Repositories\Interfaces;

use App\Models\RoleRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface RoleRequestRepositoryInterface
{
    public function all(): Collection;

    public function paginate(int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): ?RoleRequest;

    public function create(array $data): RoleRequest;

    public function update(int $id, array $data): bool;

    public function delete(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | CUSTOM QUERIES (IMPORTANT FOR YOUR SYSTEM)
    |--------------------------------------------------------------------------
    */

    public function forUser(int $userId): Collection;

    public function pending(): Collection;

    public function approved(): Collection;

    public function rejected(): Collection;

    public function findWithRelations(int $id): ?RoleRequest;
}