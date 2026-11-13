<?php

namespace App\Services;

use App\Models\Area;
use App\Repositories\Interfaces\AreaRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AreaService
{
    /*
    |--------------------------------------------------------------------------
    | REPOSITORY
    |--------------------------------------------------------------------------
    */

    protected AreaRepositoryInterface $areaRepository;

    public function __construct(
        AreaRepositoryInterface $areaRepository
    ) {
        $this->areaRepository = $areaRepository;
    }

    /*
    |--------------------------------------------------------------------------
    | RETRIEVE AREAS
    |--------------------------------------------------------------------------
    */

    /**
     * Get all areas with filters and pagination.
     */
    public function getAll(
        array $filters = [],
        int $perPage = 25
    ): LengthAwarePaginator {

        return $this->areaRepository->getAll(
            $filters,
            $perPage
        );
    }

    /**
     * Get all areas without pagination.
     */
    public function getAllRecords(
        array $filters = []
    ): Collection {

        return $this->areaRepository->getAllRecords($filters);
    }

    /**
     * Find an area by ID.
     */
    public function findById(int $id): ?Area
    {
        return $this->areaRepository->findById($id);
    }

    /**
     * Find an area by slug.
     */
    public function findBySlug(string $slug): ?Area
    {
        return $this->areaRepository->findBySlug($slug);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE AREA
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new area.
     */
    public function create(array $data): Area
    {
        return DB::transaction(function () use ($data) {

            return $this->areaRepository->create($data);

        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE AREA
    |--------------------------------------------------------------------------
    */

    /**
     * Update an existing area.
     */
    public function update(int $id, array $data): Area
    {
        return DB::transaction(function () use ($id, $data) {

            return $this->areaRepository->update($id, $data);

        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE AREA
    |--------------------------------------------------------------------------
    */

    /**
     * Delete an area permanently.
     */
    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            return $this->areaRepository->delete($id);

        });
    }

    /*
    |--------------------------------------------------------------------------
    | AREA STATUS
    |--------------------------------------------------------------------------
    */

    /**
     * Activate an area.
     */
    public function activate(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            return $this->areaRepository->activate($id);

        });
    }

    /**
     * Deactivate an area.
     */
    public function deactivate(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            return $this->areaRepository->deactivate($id);

        });
    }

    /**
     * Update area active status.
     */
    public function updateStatus(
        int $id,
        bool $isActive
    ): bool {

        return DB::transaction(function () use ($id, $isActive) {

            return $this->areaRepository->updateStatus(
                $id,
                $isActive
            );

        });
    }

    /*
    |--------------------------------------------------------------------------
    | GEOGRAPHICAL FILTERING
    |--------------------------------------------------------------------------
    */

    /**
     * Get areas by country.
     */
    public function getByCountry(int $countryId): Collection
    {
        return $this->areaRepository->getByCountry($countryId);
    }

    /**
     * Get areas by region.
     */
    public function getByRegion(int $regionId): Collection
    {
        return $this->areaRepository->getByRegion($regionId);
    }

    /**
     * Get areas by county.
     */
    public function getByCounty(int $countyId): Collection
    {
        return $this->areaRepository->getByCounty($countyId);
    }

    /**
     * Get areas by city.
     */
    public function getByCity(int $cityId): Collection
    {
        return $this->areaRepository->getByCity($cityId);
    }

    /**
     * Get active areas by city.
     */
    public function getActiveByCity(int $cityId): Collection
    {
        return $this->areaRepository->getActiveByCity($cityId);
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    /**
     * Search areas using a search term and filters.
     */
    public function search(
        string $search,
        array $filters = []
    ): Collection {

        return $this->areaRepository->search(
            $search,
            $filters
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE VALIDATION
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether an area name already exists.
     */
    public function nameExists(
        string $name,
        ?int $cityId = null,
        ?int $ignoreId = null
    ): bool {

        return $this->areaRepository->nameExists(
            $name,
            $cityId,
            $ignoreId
        );
    }

    /**
     * Check whether an area code already exists.
     */
    public function codeExists(
        string $code,
        ?int $ignoreId = null
    ): bool {

        return $this->areaRepository->codeExists(
            $code,
            $ignoreId
        );
    }

    /**
     * Check whether an area slug already exists.
     */
    public function slugExists(
        string $slug,
        ?int $ignoreId = null
    ): bool {

        return $this->areaRepository->slugExists(
            $slug,
            $ignoreId
        );
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Get area statistics.
     */
    public function getStatistics(
        array $filters = []
    ): array {

        return $this->areaRepository->getStatistics($filters);
    }

    /**
     * Get total areas count.
     */
    public function getTotalCount(
        array $filters = []
    ): int {

        return $this->areaRepository->getTotalCount($filters);
    }

    /**
     * Get active areas count.
     */
    public function getActiveCount(
        array $filters = []
    ): int {

        return $this->areaRepository->getActiveCount($filters);
    }

    /**
     * Get inactive areas count.
     */
    public function getInactiveCount(
        array $filters = []
    ): int {

        return $this->areaRepository->getInactiveCount($filters);
    }

    /**
     * Get areas count grouped by country.
     */
    public function getCountByCountry(): Collection
    {
        return $this->areaRepository->getCountByCountry();
    }

    /**
     * Get areas count grouped by region.
     */
    public function getCountByRegion(): Collection
    {
        return $this->areaRepository->getCountByRegion();
    }

    /**
     * Get areas count grouped by county.
     */
    public function getCountByCounty(): Collection
    {
        return $this->areaRepository->getCountByCounty();
    }

    /**
     * Get areas count grouped by city.
     */
    public function getCountByCity(): Collection
    {
        return $this->areaRepository->getCountByCity();
    }

    /**
     * Get areas that have properties.
     */
    public function getAreasWithPropertiesCount(): int
    {
        return $this->areaRepository
            ->getAreasWithPropertiesCount();
    }

    /**
     * Get areas without properties.
     */
    public function getAreasWithoutPropertiesCount(): int
    {
        return $this->areaRepository
            ->getAreasWithoutPropertiesCount();
    }

    /*
    |--------------------------------------------------------------------------
    | REPORTS
    |--------------------------------------------------------------------------
    */

    /**
     * Generate area reports.
     */
    public function getReports(
        array $filters = []
    ): array {

        return $this->areaRepository->getReports($filters);
    }

    /**
     * Get area status breakdown.
     */
    public function getStatusBreakdown(
        array $filters = []
    ): array {

        return $this->areaRepository
            ->getStatusBreakdown($filters);
    }

    /**
     * Get country breakdown.
     */
    public function getCountryBreakdown(
        array $filters = []
    ): Collection {

        return $this->areaRepository
            ->getCountryBreakdown($filters);
    }

    /**
     * Get region breakdown.
     */
    public function getRegionBreakdown(
        array $filters = []
    ): Collection {

        return $this->areaRepository
            ->getRegionBreakdown($filters);
    }

    /**
     * Get county breakdown.
     */
    public function getCountyBreakdown(
        array $filters = []
    ): Collection {

        return $this->areaRepository
            ->getCountyBreakdown($filters);
    }

    /**
     * Get city breakdown.
     */
    public function getCityBreakdown(
        array $filters = []
    ): Collection {

        return $this->areaRepository
            ->getCityBreakdown($filters);
    }
}
