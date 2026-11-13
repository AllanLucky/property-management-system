<?php

namespace App\Repositories\Interfaces;

use App\Models\Area;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface AreaRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | RETRIEVE AREAS
    |--------------------------------------------------------------------------
    */

    /**
     * Get all areas with optional filters and pagination.
     */
    public function getAll(
        array $filters = [],
        int $perPage = 25
    ): LengthAwarePaginator;

    /**
     * Get all areas without pagination.
     */
    public function getAllRecords(array $filters = []): Collection;

    /**
     * Find an area by ID.
     */
    public function findById(int $id): ?Area;

    /**
     * Find an area by slug.
     */
    public function findBySlug(string $slug): ?Area;

    /*
    |--------------------------------------------------------------------------
    | CREATE AREA
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new area.
     */
    public function create(array $data): Area;

    /*
    |--------------------------------------------------------------------------
    | UPDATE AREA
    |--------------------------------------------------------------------------
    */

    /**
     * Update an existing area.
     */
    public function update(int $id, array $data): Area;

    /*
    |--------------------------------------------------------------------------
    | DELETE AREA
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete an area.
     */
    public function delete(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | AREA STATUS
    |--------------------------------------------------------------------------
    */

    /**
     * Activate an area.
     */
    public function activate(int $id): bool;

    /**
     * Deactivate an area.
     */
    public function deactivate(int $id): bool;

    /**
     * Update area active status.
     */
    public function updateStatus(int $id, bool $isActive): bool;

    /*
    |--------------------------------------------------------------------------
    | GEOGRAPHICAL FILTERING
    |--------------------------------------------------------------------------
    */

    /**
     * Get areas by country.
     */
    public function getByCountry(int $countryId): Collection;

    /**
     * Get areas by region.
     */
    public function getByRegion(int $regionId): Collection;

    /**
     * Get areas by county.
     */
    public function getByCounty(int $countyId): Collection;

    /**
     * Get areas by city.
     */
    public function getByCity(int $cityId): Collection;

    /**
     * Get active areas by city.
     */
    public function getActiveByCity(int $cityId): Collection;

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    /**
     * Search areas by name, code or slug.
     */
    public function search(
        string $search,
        array $filters = []
    ): Collection;

    /**
     * Check whether an area name already exists.
     */
    public function nameExists(
        string $name,
        ?int $cityId = null,
        ?int $ignoreId = null
    ): bool;

    /**
     * Check whether an area code already exists.
     */
    public function codeExists(
        string $code,
        ?int $ignoreId = null
    ): bool;

    /**
     * Check whether a slug already exists.
     */
    public function slugExists(
        string $slug,
        ?int $ignoreId = null
    ): bool;

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Get area statistics.
     */
    public function getStatistics(array $filters = []): array;

    /**
     * Get total areas.
     */
    public function getTotalCount(array $filters = []): int;

    /**
     * Get active areas count.
     */
    public function getActiveCount(array $filters = []): int;

    /**
     * Get inactive areas count.
     */
    public function getInactiveCount(array $filters = []): int;

    /**
     * Get areas count by country.
     */
    public function getCountByCountry(): Collection;

    /**
     * Get areas count by region.
     */
    public function getCountByRegion(): Collection;

    /**
     * Get areas count by county.
     */
    public function getCountByCounty(): Collection;

    /**
     * Get areas count by city.
     */
    public function getCountByCity(): Collection;

    /**
     * Get areas with properties count.
     */
    public function getAreasWithPropertiesCount(): int;

    /**
     * Get areas without properties count.
     */
    public function getAreasWithoutPropertiesCount(): int;

    /*
    |--------------------------------------------------------------------------
    | REPORTS
    |--------------------------------------------------------------------------
    */

    /**
     * Generate area reports.
     */
    public function getReports(array $filters = []): array;

    /**
     * Get areas grouped by status.
     */
    public function getStatusBreakdown(array $filters = []): array;

    /**
     * Get areas grouped by country.
     */
    public function getCountryBreakdown(array $filters = []): Collection;

    /**
     * Get areas grouped by region.
     */
    public function getRegionBreakdown(array $filters = []): Collection;

    /**
     * Get areas grouped by county.
     */
    public function getCountyBreakdown(array $filters = []): Collection;

    /**
     * Get areas grouped by city.
     */
    public function getCityBreakdown(array $filters = []): Collection;
}
