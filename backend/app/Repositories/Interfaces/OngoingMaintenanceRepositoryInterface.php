<?php

namespace App\Repositories\Interfaces;

use App\Models\MaintenanceRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface OngoingMaintenanceRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | BASIC RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all ongoing maintenance requests.
     */
    public function all(): Collection;

    /**
     * Retrieve paginated ongoing maintenance requests.
     */
    public function paginate(int $perPage = 20): LengthAwarePaginator;

    /**
     * Find an ongoing maintenance request by ID.
     */
    public function find(int $id): ?MaintenanceRequest;

    /*
    |--------------------------------------------------------------------------
    | FILTERING AND SEARCH
    |--------------------------------------------------------------------------
    */

    /**
     * Filter and paginate ongoing maintenance requests.
     */
    public function filter(
        array $filters,
        int $perPage = 20
    ): LengthAwarePaginator;

    /*
    |--------------------------------------------------------------------------
    | MAINTENANCE STATUS QUERIES
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve assigned maintenance requests.
     */
    public function assigned(): Collection;

    /**
     * Retrieve maintenance requests currently in progress.
     */
    public function inProgress(): Collection;

    /**
     * Retrieve maintenance requests currently on hold.
     */
    public function onHold(): Collection;

    /**
     * Retrieve overdue ongoing maintenance requests.
     */
    public function overdue(): Collection;

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP QUERIES
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve ongoing maintenance requests assigned to a technician.
     */
    public function findByTechnician(int $technicianId): Collection;

    /**
     * Retrieve ongoing maintenance requests for a property.
     */
    public function findByProperty(int $propertyId): Collection;

    /**
     * Retrieve ongoing maintenance requests for a unit.
     */
    public function findByUnit(int $unitId): Collection;

    /**
     * Retrieve ongoing maintenance requests for a maintenance category.
     */
    public function findByCategory(int $categoryId): Collection;

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve ongoing maintenance statistics.
     */
    public function statistics(array $filters = []): array;
}
