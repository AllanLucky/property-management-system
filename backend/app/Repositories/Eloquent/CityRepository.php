<?php

namespace App\Repositories\Eloquent;

use App\Models\City;
use App\Repositories\Interfaces\CityRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CityRepository implements CityRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | BASE QUERY
    |--------------------------------------------------------------------------
    */

    /**
     * Create the base city query.
     *
     * Automatically eager-loads location relationships.
     */
    protected function query(): Builder
    {
        return City::query()
            ->with([
                'country',
                'region',
                'county',
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */

    /**
     * Apply filters to the city query.
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

        if (! empty($filters['search'])) {
            $query->search(
                trim($filters['search'])
            );
        }

        /*
        |--------------------------------------------------------------------------
        | NAME
        |--------------------------------------------------------------------------
        */

        if (! empty($filters['name'])) {
            $query->where(
                'name',
                'like',
                '%' . trim($filters['name']) . '%'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SLUG
        |--------------------------------------------------------------------------
        */

        if (! empty($filters['slug'])) {
            $query->where(
                'slug',
                $filters['slug']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CODE
        |--------------------------------------------------------------------------
        */

        if (! empty($filters['code'])) {
            $query->where(
                'code',
                strtoupper(trim($filters['code']))
            );
        }

        /*
        |--------------------------------------------------------------------------
        | COUNTRY
        |--------------------------------------------------------------------------
        */

        if (! empty($filters['country_id'])) {
            $query->where(
                'country_id',
                $filters['country_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | REGION
        |--------------------------------------------------------------------------
        */

        if (! empty($filters['region_id'])) {
            $query->where(
                'region_id',
                $filters['region_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | COUNTY
        |--------------------------------------------------------------------------
        */

        if (! empty($filters['county_id'])) {
            $query->where(
                'county_id',
                $filters['county_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS
        |--------------------------------------------------------------------------
        */

        if (isset($filters['is_active'])) {
            $query->where(
                'is_active',
                filter_var(
                    $filters['is_active'],
                    FILTER_VALIDATE_BOOLEAN
                )
            );
        }

        if (! empty($filters['status'])) {

            match (strtolower($filters['status'])) {

                'active' => $query->where('is_active', true),

                'inactive' => $query->where('is_active', false),

                default => null,
            };
        }

        /*
        |--------------------------------------------------------------------------
        | DATE FILTERS
        |--------------------------------------------------------------------------
        */

        if (! empty($filters['date_from'])) {
            $query->whereDate(
                'created_at',
                '>=',
                $filters['date_from']
            );
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate(
                'created_at',
                '<=',
                $filters['date_to']
            );
        }

        return $query;
    }

    /*
    |--------------------------------------------------------------------------
    | SORTING
    |--------------------------------------------------------------------------
    */

    /**
     * Apply sorting to the city query.
     */
    protected function applySorting(
        Builder $query,
        array $filters = []
    ): Builder {

        $allowedSortColumns = [
            'id',
            'name',
            'slug',
            'code',
            'country_id',
            'region_id',
            'county_id',
            'is_active',
            'created_at',
            'updated_at',
        ];

        $sortBy = $filters['sort_by'] ?? 'created_at';

        $sortDirection = strtolower(
            $filters['sort_direction'] ?? 'desc'
        );

        if (! in_array($sortBy, $allowedSortColumns, true)) {
            $sortBy = 'created_at';
        }

        if (! in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'desc';
        }

        return $query->orderBy(
            $sortBy,
            $sortDirection
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all cities with optional filters.
     */
    public function all(array $filters = []): Collection
    {
        $query = $this->query();

        $this->applyFilters($query, $filters);

        $this->applySorting($query, $filters);

        return $query->get();
    }

    /**
     * Retrieve paginated cities with optional filters.
     */
    public function paginate(
        int $perPage = 25,
        array $filters = []
    ): LengthAwarePaginator {

        $perPage = max(1, min($perPage, 100));

        $query = $this->query();

        $this->applyFilters($query, $filters);

        $this->applySorting($query, $filters);

        return $query->paginate($perPage);
    }

    /**
     * Find a city by ID.
     */
    public function findById(int $id): ?City
    {
        return $this->query()->find($id);
    }

    /**
     * Find a city by slug.
     */
    public function findBySlug(string $slug): ?City
    {
        return $this->query()
            ->where('slug', $slug)
            ->first();
    }

    /**
     * Find a city by code.
     */
    public function findByCode(string $code): ?City
    {
        return $this->query()
            ->where('code', strtoupper(trim($code)))
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE AND UPDATE
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new city.
     */
    public function create(array $data): City
    {
        $city = City::create($data);

        return $this->findById($city->id) ?? $city;
    }

    /**
     * Update an existing city.
     */
    public function update(int $id, array $data): ?City
    {
        $city = City::find($id);

        if (! $city) {
            return null;
        }

        $city->update($data);

        return $this->findById($id);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE OPERATIONS
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete a city.
     */
    public function delete(int $id): bool
    {
        $city = City::find($id);

        if (! $city) {
            return false;
        }

        return (bool) $city->delete();
    }

    /**
     * Restore a soft-deleted city.
     */
    public function restore(int $id): bool
    {
        $city = City::onlyTrashed()->find($id);

        if (! $city) {
            return false;
        }

        return (bool) $city->restore();
    }

    /**
     * Permanently delete a city.
     */
    public function forceDelete(int $id): bool
    {
        $city = City::withTrashed()->find($id);

        if (! $city) {
            return false;
        }

        return (bool) $city->forceDelete();
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS MANAGEMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Activate a city.
     */
    public function activate(int $id): bool
    {
        $city = City::find($id);

        if (! $city) {
            return false;
        }

        return $city->update([
            'is_active' => true,
        ]);
    }

    /**
     * Deactivate a city.
     */
    public function deactivate(int $id): bool
    {
        $city = City::find($id);

        if (! $city) {
            return false;
        }

        return $city->update([
            'is_active' => false,
        ]);
    }

    /**
     * Toggle city status.
     */
    public function toggleStatus(int $id): bool
    {
        $city = City::find($id);

        if (! $city) {
            return false;
        }

        return $city->update([
            'is_active' => ! $city->is_active,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | LOCATION FILTERING
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve cities belonging to a country.
     */
    public function getByCountry(int $countryId): Collection
    {
        return $this->query()
            ->where('country_id', $countryId)
            ->orderBy('name')
            ->get();
    }

    /**
     * Retrieve cities belonging to a region.
     */
    public function getByRegion(int $regionId): Collection
    {
        return $this->query()
            ->where('region_id', $regionId)
            ->orderBy('name')
            ->get();
    }

    /**
     * Retrieve cities belonging to a county.
     */
    public function getByCounty(int $countyId): Collection
    {
        return $this->query()
            ->where('county_id', $countyId)
            ->orderBy('name')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS LISTS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all active cities.
     */
    public function getActive(): Collection
    {
        return $this->query()
            ->active()
            ->orderBy('name')
            ->get();
    }

    /**
     * Retrieve all inactive cities.
     */
    public function getInactive(): Collection
    {
        return $this->query()
            ->inactive()
            ->orderBy('name')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve city statistics.
     */
    public function statistics(array $filters = []): array
    {
        $query = $this->applyFilters(
            City::query(),
            $filters
        );

        $total = (clone $query)->count();

        $active = (clone $query)
            ->where('is_active', true)
            ->count();

        $inactive = (clone $query)
            ->where('is_active', false)
            ->count();

        $withAreas = (clone $query)
            ->whereHas('areas')
            ->count();

        $withoutAreas = $total - $withAreas;

        $withProperties = (clone $query)
            ->whereHas('properties')
            ->count();

        $withoutProperties = $total - $withProperties;

        return [
            'total_cities' => $total,

            'active_cities' => $active,

            'inactive_cities' => $inactive,

            'cities_with_areas' => $withAreas,

            'cities_without_areas' => $withoutAreas,

            'cities_with_properties' => $withProperties,

            'cities_without_properties' => $withoutProperties,

            'active_percentage' => $total > 0
                ? round(($active / $total) * 100, 2)
                : 0,

            'inactive_percentage' => $total > 0
                ? round(($inactive / $total) * 100, 2)
                : 0,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | REPORTS
    |--------------------------------------------------------------------------
    */

    /**
     * Generate city reports.
     */
    public function reports(array $filters = []): array
    {
        $query = $this->query();

        $this->applyFilters($query, $filters);

        $cities = $this->applySorting(
            $query,
            $filters
        )->get();

        return [
            'summary' => $this->statistics($filters),

            'cities' => $cities,

            'generated_at' => now()->toDateTimeString(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | EXISTENCE CHECKS
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether a city exists.
     */
    public function exists(int $id): bool
    {
        return City::whereKey($id)->exists();
    }

    /**
     * Check whether a city code already exists.
     *
     * Includes soft-deleted cities.
     */
    public function codeExists(
        string $code,
        ?int $ignoreId = null
    ): bool {

        return City::withTrashed()
            ->where('code', strtoupper(trim($code)))
            ->when(
                $ignoreId !== null,
                fn (Builder $query) => $query->whereKeyNot($ignoreId)
            )
            ->exists();
    }

    /**
     * Check whether a city slug already exists.
     *
     * Includes soft-deleted cities.
     */
    public function slugExists(
        string $slug,
        ?int $ignoreId = null
    ): bool {

        return City::withTrashed()
            ->where('slug', $slug)
            ->when(
                $ignoreId !== null,
                fn (Builder $query) => $query->whereKeyNot($ignoreId)
            )
            ->exists();
    }

    /**
     * Determine whether a city has dependent records.
     */
    public function hasDependencies(int $id): bool
    {
        $city = City::withTrashed()->find($id);

        if (! $city) {
            return false;
        }

        return $city->areas()->exists()
            || $city->properties()->exists();
    }

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
    ): LengthAwarePaginator {

        $perPage = max(1, min($perPage, 100));

        $query = City::onlyTrashed()
            ->with([
                'country',
                'region',
                'county',
            ]);

        $this->applyFilters($query, $filters);

        $this->applySorting($query, $filters);

        return $query->paginate($perPage);
    }

    /**
     * Find a soft-deleted city by ID.
     */
    public function findTrashedById(int $id): ?City
    {
        return City::onlyTrashed()
            ->with([
                'country',
                'region',
                'county',
            ])
            ->find($id);
    }
}
