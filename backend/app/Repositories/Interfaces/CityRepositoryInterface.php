<?php

namespace App\Repositories\Interfaces;

use App\Models\City;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CityRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all cities with optional filters.
     */
    public function all(array $filters = []): Collection;

    /**
     * Retrieve paginated cities with optional filters.
     */
    public function paginate(
        int $perPage = 25,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Find a city by its ID.
     */
    public function findById(int $id): ?City;

    /**
     * Find a city by its slug.
     */
    public function findBySlug(string $slug): ?City;

    /**
     * Find a city by its code.
     */
    public function findByCode(string $code): ?City;

    /*
    |--------------------------------------------------------------------------
    | CREATE AND UPDATE
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new city.
     */
    public function create(array $data): City;

    /**
     * Update an existing city.
     */
    public function update(int $id, array $data): ?City;

    /*
    |--------------------------------------------------------------------------
    | DELETE OPERATIONS
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete a city.
     */
    public function delete(int $id): bool;

    /**
     * Restore a soft-deleted city.
     */
    public function restore(int $id): bool;

    /**
     * Permanently delete a city.
     */
    public function forceDelete(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | STATUS MANAGEMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Activate a city.
     */
    public function activate(int $id): bool;

    /**
     * Deactivate a city.
     */
    public function deactivate(int $id): bool;

    /**
     * Toggle city status.
     */
    public function toggleStatus(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | LOCATION FILTERING
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve cities belonging to a country.
     */
    public function getByCountry(int $countryId): Collection;

    /**
     * Retrieve cities belonging to a region.
     */
    public function getByRegion(int $regionId): Collection;

    /**
     * Retrieve cities belonging to a county.
     */
    public function getByCounty(int $countyId): Collection;

    /*
    |--------------------------------------------------------------------------
    | STATUS LISTS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all active cities.
     */
    public function getActive(): Collection;

    /**
     * Retrieve all inactive cities.
     */
    public function getInactive(): Collection;

    /*
    |--------------------------------------------------------------------------
    | STATISTICS AND REPORTS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve city statistics.
     */
    public function statistics(array $filters = []): array;

    /**
     * Generate city reports.
     */
    public function reports(array $filters = []): array;

    /*
    |--------------------------------------------------------------------------
    | EXISTENCE CHECKS
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether a city exists.
     */
    public function exists(int $id): bool;

    /**
     * Check whether a city code already exists.
     */
    public function codeExists(
        string $code,
        ?int $ignoreId = null
    ): bool;

    /**
     * Check whether a city slug already exists.
     */
    public function slugExists(
        string $slug,
        ?int $ignoreId = null
    ): bool;

    /**
     * Determine whether a city has dependent records.
     */
    public function hasDependencies(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | TRASHED CITIES
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve paginated soft-deleted cities.
     */
    public function getTrashed(
        int $perPage = 25,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Find a soft-deleted city by ID.
     */
    public function findTrashedById(int $id): ?City;
}
