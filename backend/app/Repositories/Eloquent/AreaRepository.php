<?php

namespace App\Repositories\Eloquent;

use App\Models\Area;
use App\Repositories\Interfaces\AreaRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class AreaRepository implements AreaRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | MODEL
    |--------------------------------------------------------------------------
    */

    protected Area $model;

    public function __construct(Area $model)
    {
        $this->model = $model;
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * Get the standard geographical relationships.
     *
     * Include is_active because parent models use it
     * to generate their status labels.
     */
    protected function geographicalRelationships(): array
    {
        return [
            'country:id,name,code,is_active',

            'region:id,country_id,name,code,is_active',

            'county:id,country_id,region_id,name,code,is_active',

            'city:id,country_id,region_id,county_id,name,slug,code,is_active',
        ];
    }

    /**
     * Load geographical relationships and properties count.
     */
    protected function loadAreaRelationships(Area $area): Area
    {
        return $area
            ->load($this->geographicalRelationships())
            ->loadCount('properties');
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY BUILDER
    |--------------------------------------------------------------------------
    */

    /**
     * Base query with geographical relationships.
     */
    protected function query(): Builder
    {
        return $this->model
            ->newQuery()
            ->with($this->geographicalRelationships())
            ->withCount('properties');
    }

    /**
     * Apply common filters.
     */
    protected function applyFilters(
        Builder $query,
        array $filters = []
    ): Builder {

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['search'])) {

            $search = trim($filters['search']);

            $query->where(function ($q) use ($search) {

                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('code', 'LIKE', "%{$search}%")
                    ->orWhere('slug', 'LIKE', "%{$search}%");

            });
        }

        /*
        |--------------------------------------------------------------------------
        | GEOGRAPHICAL FILTERS
        |--------------------------------------------------------------------------
        */

        foreach ([
            'country_id',
            'region_id',
            'county_id',
            'city_id',
        ] as $field) {

            if (isset($filters[$field]) && $filters[$field] !== '') {

                $query->where($field, $filters[$field]);

            }
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS FILTER
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['is_active']) &&
            $filters['is_active'] !== ''
        ) {

            $query->where(
                'is_active',
                filter_var(
                    $filters['is_active'],
                    FILTER_VALIDATE_BOOLEAN
                )
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CODE FILTER
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['code'])) {

            $query->where(
                'code',
                'LIKE',
                '%' . trim($filters['code']) . '%'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | NAME FILTER
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['name'])) {

            $query->where(
                'name',
                'LIKE',
                '%' . trim($filters['name']) . '%'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | DATE FILTERS
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['created_from'])) {

            $query->whereDate(
                'created_at',
                '>=',
                $filters['created_from']
            );
        }

        if (!empty($filters['created_to'])) {

            $query->whereDate(
                'created_at',
                '<=',
                $filters['created_to']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | PROPERTY FILTER
        |--------------------------------------------------------------------------
        */

        if (isset($filters['has_properties'])) {

            if (
                filter_var(
                    $filters['has_properties'],
                    FILTER_VALIDATE_BOOLEAN
                )
            ) {

                $query->has('properties');

            } else {

                $query->doesntHave('properties');

            }
        }

        return $query;
    }

    /**
     * Get a filtered query.
     */
    protected function filteredQuery(array $filters = []): Builder
    {
        return $this->applyFilters(
            $this->query(),
            $filters
        );
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

        $perPage = max(1, min($perPage, 100));

        return $this->filteredQuery($filters)
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get all areas without pagination.
     */
    public function getAllRecords(array $filters = []): Collection
    {
        return $this->filteredQuery($filters)
            ->orderBy('name')
            ->get();
    }

    /**
     * Find an area by ID.
     */
    public function findById(int $id): ?Area
    {
        return $this->query()->find($id);
    }

    /**
     * Find an area by slug.
     */
    public function findBySlug(string $slug): ?Area
    {
        return $this->query()
            ->where('slug', $slug)
            ->first();
    }

    /**
     * Find an area by ID including soft-deleted records.
     */
    public function findByIdWithTrashed(int $id): ?Area
    {
        $area = $this->model
            ->withTrashed()
            ->with($this->geographicalRelationships())
            ->withCount('properties')
            ->find($id);

        return $area;
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
        $area = $this->model->create($data);

        return $this->loadAreaRelationships($area);
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
        $area = $this->model->findOrFail($id);

        $area->update($data);

        $area = $area->fresh();

        return $this->loadAreaRelationships($area);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE AREA
    |--------------------------------------------------------------------------
    */

    /**
     * Delete an area.
     */
    public function delete(int $id): bool
    {
        $area = $this->model->findOrFail($id);

        return (bool) $area->delete();
    }

    /**
     * Restore a soft-deleted area.
     */
    public function restore(int $id): bool
    {
        $area = $this->model
            ->withTrashed()
            ->findOrFail($id);

        return (bool) $area->restore();
    }

    /**
     * Permanently delete an area.
     */
    public function forceDelete(int $id): bool
    {
        $area = $this->model
            ->withTrashed()
            ->findOrFail($id);

        return (bool) $area->forceDelete();
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
        return $this->updateStatus($id, true);
    }

    /**
     * Deactivate an area.
     */
    public function deactivate(int $id): bool
    {
        return $this->updateStatus($id, false);
    }

    /**
     * Update area active status.
     */
    public function updateStatus(
        int $id,
        bool $isActive
    ): bool {

        $area = $this->model->findOrFail($id);

        return $area->update([
            'is_active' => $isActive,
        ]);
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
        return $this->query()
            ->where('country_id', $countryId)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get areas by region.
     */
    public function getByRegion(int $regionId): Collection
    {
        return $this->query()
            ->where('region_id', $regionId)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get areas by county.
     */
    public function getByCounty(int $countyId): Collection
    {
        return $this->query()
            ->where('county_id', $countyId)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get areas by city.
     */
    public function getByCity(int $cityId): Collection
    {
        return $this->query()
            ->where('city_id', $cityId)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get active areas by city.
     */
    public function getActiveByCity(int $cityId): Collection
    {
        return $this->query()
            ->where('city_id', $cityId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
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

        $filters['search'] = $search;

        return $this->filteredQuery($filters)
            ->orderBy('name')
            ->get();
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

        return $this->model
            ->whereRaw(
                'LOWER(name) = ?',
                [mb_strtolower(trim($name))]
            )
            ->when(
                $cityId,
                fn ($q) => $q->where('city_id', $cityId)
            )
            ->when(
                $ignoreId,
                fn ($q) => $q->where('id', '!=', $ignoreId)
            )
            ->exists();
    }

    /**
     * Check whether an area code already exists.
     */
    public function codeExists(
        string $code,
        ?int $ignoreId = null
    ): bool {

        return $this->model
            ->whereRaw(
                'LOWER(code) = ?',
                [mb_strtolower(trim($code))]
            )
            ->when(
                $ignoreId,
                fn ($q) => $q->where('id', '!=', $ignoreId)
            )
            ->exists();
    }

    /**
     * Check whether an area slug already exists.
     */
    public function slugExists(
        string $slug,
        ?int $ignoreId = null
    ): bool {

        return $this->model
            ->where('slug', $slug)
            ->when(
                $ignoreId,
                fn ($q) => $q->where('id', '!=', $ignoreId)
            )
            ->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Get area statistics.
     */
    public function getStatistics(array $filters = []): array
    {
        $query = $this->filteredQuery($filters);

        return [

            'total' => (clone $query)->count(),

            'active' => (clone $query)
                ->where('is_active', true)
                ->count(),

            'inactive' => (clone $query)
                ->where('is_active', false)
                ->count(),

            'with_properties' => (clone $query)
                ->has('properties')
                ->count(),

            'without_properties' => (clone $query)
                ->doesntHave('properties')
                ->count(),

            'countries_count' => (clone $query)
                ->distinct()
                ->count('country_id'),

            'regions_count' => (clone $query)
                ->distinct()
                ->count('region_id'),

            'counties_count' => (clone $query)
                ->distinct()
                ->count('county_id'),

            'cities_count' => (clone $query)
                ->distinct()
                ->count('city_id'),

        ];
    }

    /**
     * Get total areas count.
     */
    public function getTotalCount(array $filters = []): int
    {
        return $this->filteredQuery($filters)->count();
    }

    /**
     * Get active areas count.
     */
    public function getActiveCount(array $filters = []): int
    {
        return $this->filteredQuery($filters)
            ->where('is_active', true)
            ->count();
    }

    /**
     * Get inactive areas count.
     */
    public function getInactiveCount(array $filters = []): int
    {
        return $this->filteredQuery($filters)
            ->where('is_active', false)
            ->count();
    }

    /*
    |--------------------------------------------------------------------------
    | AREA COUNTS BY GEOGRAPHICAL LOCATION
    |--------------------------------------------------------------------------
    */

    /**
     * Get areas count grouped by country.
     */
    public function getCountByCountry(): Collection
    {
        return $this->model
            ->selectRaw('country_id, COUNT(*) as areas_count')
            ->with('country:id,name,code,is_active')
            ->groupBy('country_id')
            ->orderByDesc('areas_count')
            ->get();
    }

    /**
     * Get areas count grouped by region.
     */
    public function getCountByRegion(): Collection
    {
        return $this->model
            ->selectRaw('region_id, COUNT(*) as areas_count')
            ->with('region:id,country_id,name,code,is_active')
            ->groupBy('region_id')
            ->orderByDesc('areas_count')
            ->get();
    }

    /**
     * Get areas count grouped by county.
     */
    public function getCountByCounty(): Collection
    {
        return $this->model
            ->selectRaw('county_id, COUNT(*) as areas_count')
            ->with('county:id,country_id,region_id,name,code,is_active')
            ->groupBy('county_id')
            ->orderByDesc('areas_count')
            ->get();
    }

    /**
     * Get areas count grouped by city.
     */
    public function getCountByCity(): Collection
    {
        return $this->model
            ->selectRaw('city_id, COUNT(*) as areas_count')
            ->with('city:id,country_id,region_id,county_id,name,slug,code,is_active')
            ->groupBy('city_id')
            ->orderByDesc('areas_count')
            ->get();
    }

    /**
     * Get areas that have properties.
     */
    public function getAreasWithPropertiesCount(): int
    {
        return $this->model
            ->has('properties')
            ->count();
    }

    /**
     * Get areas without properties.
     */
    public function getAreasWithoutPropertiesCount(): int
    {
        return $this->model
            ->doesntHave('properties')
            ->count();
    }

    /*
    |--------------------------------------------------------------------------
    | REPORTS
    |--------------------------------------------------------------------------
    */

    /**
     * Generate area reports.
     */
    public function getReports(array $filters = []): array
    {
        $query = $this->filteredQuery($filters);

        return [

            'summary' => $this->getStatistics($filters),

            'status_breakdown' => $this->getStatusBreakdown($filters),

            'country_breakdown' => $this->getCountryBreakdown($filters),

            'region_breakdown' => $this->getRegionBreakdown($filters),

            'county_breakdown' => $this->getCountyBreakdown($filters),

            'city_breakdown' => $this->getCityBreakdown($filters),

            'recent_areas' => (clone $query)
                ->latest()
                ->limit(10)
                ->get(),

        ];
    }

    /**
     * Get area status breakdown.
     */
    public function getStatusBreakdown(array $filters = []): array
    {
        $query = $this->filteredQuery($filters);

        return [

            'active' => (clone $query)
                ->where('is_active', true)
                ->count(),

            'inactive' => (clone $query)
                ->where('is_active', false)
                ->count(),

        ];
    }

    /**
     * Get country breakdown.
     */
    public function getCountryBreakdown(array $filters = []): Collection
    {
        return $this->filteredQuery($filters)
            ->select('country_id')
            ->selectRaw('COUNT(*) as areas_count')
            ->with('country:id,name,code,is_active')
            ->groupBy('country_id')
            ->orderByDesc('areas_count')
            ->get();
    }

    /**
     * Get region breakdown.
     */
    public function getRegionBreakdown(array $filters = []): Collection
    {
        return $this->filteredQuery($filters)
            ->select('region_id')
            ->selectRaw('COUNT(*) as areas_count')
            ->with('region:id,country_id,name,code,is_active')
            ->groupBy('region_id')
            ->orderByDesc('areas_count')
            ->get();
    }

    /**
     * Get county breakdown.
     */
    public function getCountyBreakdown(array $filters = []): Collection
    {
        return $this->filteredQuery($filters)
            ->select('county_id')
            ->selectRaw('COUNT(*) as areas_count')
            ->with('county:id,country_id,region_id,name,code,is_active')
            ->groupBy('county_id')
            ->orderByDesc('areas_count')
            ->get();
    }

    /**
     * Get city breakdown.
     */
    public function getCityBreakdown(array $filters = []): Collection
    {
        return $this->filteredQuery($filters)
            ->select('city_id')
            ->selectRaw('COUNT(*) as areas_count')
            ->with('city:id,country_id,region_id,county_id,name,slug,code,is_active')
            ->groupBy('city_id')
            ->orderByDesc('areas_count')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | TRASHED AREAS
    |--------------------------------------------------------------------------
    */

    /**
     * Get soft-deleted areas with pagination.
     */
    public function getTrashed(
        array $filters = [],
        int $perPage = 25
    ): LengthAwarePaginator {

        $perPage = max(1, min($perPage, 100));

        $query = $this->model
            ->onlyTrashed()
            ->with($this->geographicalRelationships())
            ->withCount('properties');

        $query = $this->applyFilters($query, $filters);

        return $query
            ->orderByDesc('deleted_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Get total soft-deleted areas count.
     */
    public function getTrashedCount(): int
    {
        return $this->model
            ->onlyTrashed()
            ->count();
    }

    /**
     * Check whether an area is soft-deleted.
     */
    public function isTrashed(int $id): bool
    {
        return $this->model
            ->onlyTrashed()
            ->whereKey($id)
            ->exists();
    }
}
