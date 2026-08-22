<?php

namespace App\Repositories\Interfaces;

use App\Models\Tenancy;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface TenancyRepositoryInterface
{
    public function all(array $filters = []): Collection;

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function find(int|string $id): ?Tenancy;

    public function findByNumber(string $number): ?Tenancy;

    public function create(array $data): Tenancy;

    public function update(Tenancy $tenancy, array $data): Tenancy;

    public function delete(Tenancy $tenancy): bool;

    public function restore(int|string $id): ?Tenancy;

    public function forceDelete(int|string $id): bool;

    public function activate(Tenancy $tenancy): Tenancy;

    public function deactivate(Tenancy $tenancy): Tenancy;

    public function expire(Tenancy $tenancy): Tenancy;

    public function terminate(Tenancy $tenancy, ?string $notes = null): Tenancy;

    public function cancel(Tenancy $tenancy, ?string $notes = null): Tenancy;

    public function renew(Tenancy $tenancy, array $data): Tenancy;

    public function assignUnit(int $tenantId, int $unitId, array $data = []): Tenancy;

    public function statistics(): array;
}
