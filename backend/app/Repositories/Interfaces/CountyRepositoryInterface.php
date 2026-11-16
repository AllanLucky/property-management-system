<?php

namespace App\Repositories\Interfaces;

use App\Models\County;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface CountyRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Get all counties with optional filters.
     */
    public function all(array $filters = []): Collection;

    /**
     * Get paginated counties with optional filters.
     */
    public function paginate(
        array $filters = [],
        int $perPage = 25
    ): LengthAwarePaginator;

    /**
     * Find a county by ID.
     */
    public function findById(int $id): ?County;

    /**
     * Find a county by slug.
     */
    public function findBySlug(string $slug): ?County;

    /**
     * Find a county by ID, including soft-deleted records.
     */
    public function findWithTrashed(int $id): ?County;

    /**
     * Find only a soft-deleted county by ID.
     */
    public function findTrashedById(int $id): ?County;

    /*
    |--------------------------------------------------------------------------
    | CREATION AND UPDATES
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new county.
     */
    public function create(array $data): County;

    /**
     * Update an existing county.
     */
    public function update(County $county, array $data): County;

    /*
    |--------------------------------------------------------------------------
    | DELETION AND RESTORATION
    |--------------------------------------------------------------------------
    */

    /**
     * Soft-delete a county.
     */
    public function delete(County $county): bool;

    /**
     * Restore a soft-deleted county.
     */
    public function restore(int $id): ?County;

    /**
     * Permanently delete a county.
     */
    public function forceDelete(int $id): bool;

    /**
     * Get soft-deleted counties with optional filters.
     */
    public function getTrashed(array $filters = []): LengthAwarePaginator;

    /*
    |--------------------------------------------------------------------------
    | STATUS MANAGEMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Get active counties.
     */
    public function getActive(array $filters = []): Collection;

    /**
     * Get inactive counties.
     */
    public function getInactive(array $filters = []): Collection;

    /**
     * Activate a county.
     */
    public function activate(County $county): bool;

    /**
     * Deactivate a county.
     */
    public function deactivate(County $county): bool;

    /**
     * Toggle county active status.
     */
    public function toggleStatus(County $county): bool;

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS AND FILTERING
    |--------------------------------------------------------------------------
    */

    /**
     * Get counties belonging to a country.
     */
    public function getByCountry(int $countryId): Collection;

    /**
     * Get counties belonging to a region.
     */
    public function getByRegion(int $regionId): Collection;

    /**
     * Search counties.
     */
    public function search(string $search): Collection;

    /*
    |--------------------------------------------------------------------------
    | STATISTICS AND VALIDATION
    |--------------------------------------------------------------------------
    */

    /**
     * Get county statistics.
     */
    public function getStatistics(array $filters = []): array;

    /**
     * Check whether a county exists.
     */
    public function exists(int $id): bool;

    /**
     * Check whether a county has related records.
     */
    public function hasDependencies(County $county): bool;
}
