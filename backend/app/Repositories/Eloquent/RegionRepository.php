<?php

namespace App\Repositories\Eloquent;

use App\Models\Region;
use App\Repositories\Interfaces\RegionRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class RegionRepository implements RegionRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | BASE QUERY
    |--------------------------------------------------------------------------
    */

    protected function query(): Builder
    {
        return Region::query()
            ->with('country')
            ->withCount('counties');
    }

    /*
    |--------------------------------------------------------------------------
    | APPLY FILTERS
    |--------------------------------------------------------------------------
    */

    protected function applyFilters(
        Builder $query,
        array $filters = []
    ): Builder {

        // Search by region name, code or slug.
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);

            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('code', 'LIKE', "%{$search}%")
                    ->orWhere('slug', 'LIKE', "%{$search}%");
            });
        }

        // Filter by country.
        if (!empty($filters['country_id'])) {
            $query->where('country_id', $filters['country_id']);
        }

        // Filter by region code.
        if (!empty($filters['code'])) {
            $query->where('code', $filters['code']);
        }

        // Filter by region name.
        if (!empty($filters['name'])) {
            $query->where(
                'name',
                'LIKE',
                '%' . trim($filters['name']) . '%'
            );
        }

        // Filter by active/inactive status.
        if (array_key_exists('is_active', $filters)
            && $filters['is_active'] !== null
            && $filters['is_active'] !== '') {

            $query->where(
                'is_active',
                filter_var(
                    $filters['is_active'],
                    FILTER_VALIDATE_BOOLEAN
                )
            );
        }

        // Support status filtering.
        if (!empty($filters['status'])) {
            $query->where(
                'is_active',
                $filters['status'] === 'active'
            );
        }

        // Filter by creation date.
        if (!empty($filters['date_from'])) {
            $query->whereDate(
                'created_at',
                '>=',
                $filters['date_from']
            );
        }

        if (!empty($filters['date_to'])) {
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
    | APPLY SORTING
    |--------------------------------------------------------------------------
    */

    protected function applySorting(
        Builder $query,
        array $filters = []
    ): Builder {

        $allowedColumns = [
            'id',
            'name',
            'code',
            'created_at',
            'updated_at',
        ];

        $sortBy = $filters['sort_by'] ?? 'created_at';

        $sortDirection = strtolower(
            $filters['sort_direction'] ?? 'desc'
        );

        if (!in_array($sortBy, $allowedColumns, true)) {
            $sortBy = 'created_at';
        }

        if (!in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'desc';
        }

        return $query->orderBy($sortBy, $sortDirection);
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL REGIONS
    |--------------------------------------------------------------------------
    */

    public function all(array $filters = []): Collection
    {
        $query = $this->query();

        $this->applyFilters($query, $filters);

        $this->applySorting($query, $filters);

        return $query->get();
    }

    /*
    |--------------------------------------------------------------------------
    | GET PAGINATED REGIONS
    |--------------------------------------------------------------------------
    */

    public function paginate(
        int $perPage = 25,
        array $filters = []
    ): LengthAwarePaginator {

        $perPage = max(1, min($perPage, 100));

        $query = $this->query();

        $this->applyFilters($query, $filters);

        $this->applySorting($query, $filters);

        return $query->paginate($perPage)->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | FIND REGION BY ID
    |--------------------------------------------------------------------------
    */

    public function findById(int $id): ?Region
    {
        return $this->query()->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | FIND REGION BY SLUG
    |--------------------------------------------------------------------------
    */

    public function findBySlug(string $slug): ?Region
    {
        return $this->query()
            ->where('slug', $slug)
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | FIND REGION BY CODE
    |--------------------------------------------------------------------------
    */

    public function findByCode(string $code): ?Region
    {
        return $this->query()
            ->where('code', $code)
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE REGION
    |--------------------------------------------------------------------------
    */

    public function create(array $data): Region
    {
        return DB::transaction(function () use ($data) {

            $region = Region::create($data);

            return $region->load('country')
                ->loadCount('counties');
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE REGION
    |--------------------------------------------------------------------------
    */

    public function update(int $id, array $data): ?Region
    {
        return DB::transaction(function () use ($id, $data) {

            $region = Region::find($id);

            if (!$region) {
                return null;
            }

            $region->update($data);

            return $region->fresh()
                ->load('country')
                ->loadCount('counties');
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE REGION
    |--------------------------------------------------------------------------
    */

    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $region = Region::find($id);

            if (!$region) {
                return false;
            }

            // Prevent deletion when dependent records exist.
            if ($this->hasDependencies($id)) {
                return false;
            }

            return (bool) $region->delete();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE REGION
    |--------------------------------------------------------------------------
    */

    public function activate(int $id): bool
    {
        $region = Region::find($id);

        if (!$region) {
            return false;
        }

        if ($region->is_active) {
            return true;
        }

        return $region->update([
            'is_active' => true,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE REGION
    |--------------------------------------------------------------------------
    */

    public function deactivate(int $id): bool
    {
        $region = Region::find($id);

        if (!$region) {
            return false;
        }

        if (!$region->is_active) {
            return true;
        }

        return $region->update([
            'is_active' => false,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE REGION STATUS
    |--------------------------------------------------------------------------
    */

    public function toggleStatus(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $region = Region::whereKey($id)
                ->lockForUpdate()
                ->first();

            if (!$region) {
                return false;
            }

            return $region->update([
                'is_active' => !$region->is_active,
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | GET REGION STATISTICS
    |--------------------------------------------------------------------------
    */

    public function statistics(array $filters = []): array
    {
        $query = Region::query();

        $this->applyFilters($query, $filters);

        $total = (clone $query)->count();

        $active = (clone $query)
            ->where('is_active', true)
            ->count();

        $inactive = (clone $query)
            ->where('is_active', false)
            ->count();

        $withCounties = (clone $query)
            ->whereHas('counties')
            ->count();

        $withoutCounties = (clone $query)
            ->whereDoesntHave('counties')
            ->count();

        return [
            'total' => $total,
            'active' => $active,
            'inactive' => $inactive,
            'with_counties' => $withCounties,
            'without_counties' => $withoutCounties,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | GET REGION REPORTS
    |--------------------------------------------------------------------------
    */

    public function reports(array $filters = []): array
    {
        $query = Region::query()
            ->with('country')
            ->withCount('counties');

        $this->applyFilters($query, $filters);

        $regions = $this->applySorting($query, $filters)->get();

        return [
            'summary' => [
                'total_regions' => $regions->count(),

                'active_regions' => $regions
                    ->where('is_active', true)
                    ->count(),

                'inactive_regions' => $regions
                    ->where('is_active', false)
                    ->count(),

                'total_counties' => $regions
                    ->sum('counties_count'),
            ],

            'regions' => $regions,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | GET REGIONS BY COUNTRY
    |--------------------------------------------------------------------------
    */

    public function getByCountry(int $countryId): Collection
    {
        return Region::query()
            ->with('country')
            ->withCount('counties')
            ->where('country_id', $countryId)
            ->orderBy('name')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | GET ACTIVE REGIONS
    |--------------------------------------------------------------------------
    */

    public function getActive(): Collection
    {
        return Region::query()
            ->with('country')
            ->withCount('counties')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK REGION EXISTENCE
    |--------------------------------------------------------------------------
    */

    public function exists(int $id): bool
    {
        return Region::whereKey($id)->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK REGION CODE
    |--------------------------------------------------------------------------
    */

    public function codeExists(
        string $code,
        ?int $ignoreId = null
    ): bool {

        $query = Region::query()
            ->where('code', $code);

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK REGION SLUG
    |--------------------------------------------------------------------------
    */

    public function slugExists(
        string $slug,
        ?int $ignoreId = null
    ): bool {

        $query = Region::query()
            ->where('slug', $slug);

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE REGION
    |--------------------------------------------------------------------------
    */

    public function restore(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $region = Region::withTrashed()->find($id);

            if (!$region || !$region->trashed()) {
                return false;
            }

            return (bool) $region->restore();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE REGION
    |--------------------------------------------------------------------------
    */

    public function forceDelete(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $region = Region::withTrashed()->find($id);

            if (!$region) {
                return false;
            }

            // Never permanently delete regions with dependencies.
            if ($this->hasDependencies($id)) {
                return false;
            }

            return (bool) $region->forceDelete();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | GET DELETED REGIONS
    |--------------------------------------------------------------------------
    */

    public function getTrashed(
        int $perPage = 25,
        array $filters = []
    ): LengthAwarePaginator {

        $perPage = max(1, min($perPage, 100));

        $query = Region::onlyTrashed()
            ->with('country')
            ->withCount('counties');

        $this->applyFilters($query, $filters);

        $this->applySorting($query, $filters);

        return $query->paginate($perPage)->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | FIND DELETED REGION
    |--------------------------------------------------------------------------
    */

    public function findTrashedById(int $id): ?Region
    {
        return Region::onlyTrashed()
            ->with('country')
            ->withCount('counties')
            ->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK REGION DEPENDENCIES
    |--------------------------------------------------------------------------
    */

    public function hasDependencies(int $id): bool
    {
        $region = Region::withTrashed()->find($id);

        if (!$region) {
            return false;
        }

        // Check whether the region has associated counties.
        return $region->counties()->exists();
    }
}
