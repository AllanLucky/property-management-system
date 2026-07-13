<?php

namespace App\Repositories\Interfaces;

use App\Models\ActivityLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ActivityLogRepositoryInterface
{
    public function all(): Collection;

    public function paginate(int $perPage = 20): LengthAwarePaginator;

    public function find(int $id): ?ActivityLog;

    public function create(array $data): ActivityLog;

    public function delete(int $id): bool;

    /*
    |-----------------------------------------
    | CUSTOM QUERIES
    |-----------------------------------------
    */

    public function forUser(int $userId): Collection;

    public function filter(array $filters, int $perPage = 20): LengthAwarePaginator;
}