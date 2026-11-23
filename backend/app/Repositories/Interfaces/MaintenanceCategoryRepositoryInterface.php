<?php

namespace App\Repositories\Interfaces;

use App\Models\MaintenanceCategory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface MaintenanceCategoryRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | BASIC RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all maintenance categories.
     */
    public function all(): Collection;

    /**
     * Retrieve paginated maintenance categories.
     */
    public function paginate(int $perPage = 20): LengthAwarePaginator;

    /**
     * Find a maintenance category by ID.
     */
    public function find(int $id): ?MaintenanceCategory;

    /**
     * Find a maintenance category by slug.
     */
    public function findBySlug(string $slug): ?MaintenanceCategory;

    /*
    |--------------------------------------------------------------------------
    | CRUD OPERATIONS
    |--------------------------------------------------------------------------
    */

    /**
     * Create a maintenance category.
     */
    public function create(array $data): MaintenanceCategory;

    /**
     * Update an existing maintenance category.
     */
    public function update(
        int $id,
        array $data
    ): ?MaintenanceCategory;

    /**
     * Delete a maintenance category.
     */
    public function delete(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | FILTERING AND SEARCH
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve filtered and paginated categories.
     */
    public function filter(
        array $filters,
        int $perPage = 20
    ): LengthAwarePaginator;

    /*
    |--------------------------------------------------------------------------
    | CATEGORY STATUS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve active categories.
     */
    public function active(): Collection;

    /**
     * Retrieve inactive categories.
     */
    public function inactive(): Collection;

    /**
     * Update category active status.
     */
    public function updateStatus(
        int $id,
        bool $isActive
    ): ?MaintenanceCategory;

    /*
    |--------------------------------------------------------------------------
    | VALIDATION AND RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether a category name already exists.
     */
    public function existsByName(
        string $name,
        ?int $excludeId = null
    ): bool;

    /**
     * Check whether a category slug already exists.
     */
    public function existsBySlug(
        string $slug,
        ?int $excludeId = null
    ): bool;

    /**
     * Check whether a category has maintenance requests.
     */
    public function hasRequests(int $categoryId): bool;

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve maintenance category statistics.
     */
    public function statistics(): array;
}
