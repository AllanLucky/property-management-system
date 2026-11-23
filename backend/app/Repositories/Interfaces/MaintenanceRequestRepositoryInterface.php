<?php

namespace App\Repositories\Interfaces;

use App\Models\MaintenanceRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface MaintenanceRequestRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | BASIC RETRIEVAL
    |--------------------------------------------------------------------------
    */

    public function all(): Collection;

    public function paginate(int $perPage = 20): LengthAwarePaginator;

    public function find(int $id): ?MaintenanceRequest;

    public function findByReference(string $reference): ?MaintenanceRequest;

    /*
    |--------------------------------------------------------------------------
    | CRUD OPERATIONS
    |--------------------------------------------------------------------------
    */

    public function create(array $data): MaintenanceRequest;

    public function update(
        int $id,
        array $data
    ): ?MaintenanceRequest;

    public function delete(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | FILTERING AND SEARCH
    |--------------------------------------------------------------------------
    */

    public function filter(
        array $filters,
        int $perPage = 20
    ): LengthAwarePaginator;

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP QUERIES
    |--------------------------------------------------------------------------
    */

    public function findByProperty(int $propertyId): Collection;

    public function findByUnit(int $unitId): Collection;

    public function findByTenant(int $tenantId): Collection;

    public function findByTechnician(int $technicianId): Collection;

    public function findByCategory(int $categoryId): Collection;

    /*
    |--------------------------------------------------------------------------
    | STATUS QUERIES
    |--------------------------------------------------------------------------
    */

    public function findByStatus(string $status): Collection;

    public function pending(): Collection;

    public function approved(): Collection;

    public function rejected(): Collection;

    public function assigned(): Collection;

    public function inProgress(): Collection;

    public function onHold(): Collection;

    public function completed(): Collection;

    public function cancelled(): Collection;

    public function overdue(): Collection;

    /*
    |--------------------------------------------------------------------------
    | STATUS WORKFLOW
    |--------------------------------------------------------------------------
    */

    public function updateStatus(
        int $id,
        array $data
    ): ?MaintenanceRequest;

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    public function statistics(array $filters = []): array;
}
