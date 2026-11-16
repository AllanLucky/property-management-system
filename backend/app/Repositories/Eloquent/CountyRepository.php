<?php

namespace App\Repositories\Eloquent;

use App\Models\County;
use App\Models\Country;
use App\Models\Region;
use App\Repositories\Interfaces\CountyRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class CountyRepository implements CountyRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | BASE QUERY
    |--------------------------------------------------------------------------
    */

    protected function query(): Builder
    {
        return County::query()->with([
            'country',
            'region',
        ]);
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

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);

            $query->where(function (Builder $q) use ($search) {
                $q->where('counties.name', 'like', "%{$search}%")
                    ->orWhere('counties.code', 'like', "%{$search}%")
                    ->orWhere('counties.slug', 'like', "%{$search}%")
                    ->orWhereHas('country', function (Builder $countryQuery) use ($search) {
                        $countryQuery->where(
                            'name',
                            'like',
                            "%{$search}%"
                        );
                    })
                    ->orWhereHas('region', function (Builder $regionQuery) use ($search) {
                        $regionQuery->where(
                            'name',
                            'like',
                            "%{$search}%"
                        );
                    });
            });
        }

        if (!empty($filters['country_id'])) {
            $query->where(
                'counties.country_id',
                $filters['country_id']
            );
        }

        if (!empty($filters['region_id'])) {
            $query->where(
                'counties.region_id',
                $filters['region_id']
            );
        }

        if (array_key_exists('is_active', $filters)) {
            if (
                $filters['is_active'] !== null
                && $filters['is_active'] !== ''
            ) {
                $query->where(
                    'counties.is_active',
                    filter_var(
                        $filters['is_active'],
                        FILTER_VALIDATE_BOOLEAN
                    )
                );
            }
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate(
                'counties.created_at',
                '>=',
                $filters['date_from']
            );
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate(
                'counties.created_at',
                '<=',
                $filters['date_to']
            );
        }

        return $query;
    }

    /*
    |--------------------------------------------------------------------------
    | ORDERING
    |--------------------------------------------------------------------------
    */

    protected function applyOrdering(
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

        return $query->orderBy(
            'counties.' . $sortBy,
            $sortDirection
        );
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL COUNTIES
    |--------------------------------------------------------------------------
    */

    public function all(array $filters = []): Collection
    {
        $query = $this->query();

        $this->applyFilters($query, $filters);
        $this->applyOrdering($query, $filters);

        return $query->get();
    }

    /*
    |--------------------------------------------------------------------------
    | PAGINATE COUNTIES
    |--------------------------------------------------------------------------
    */

    public function paginate(
        array $filters = [],
        int $perPage = 25
    ): LengthAwarePaginator {

        $query = $this->query();

        $this->applyFilters($query, $filters);
        $this->applyOrdering($query, $filters);

        $perPage = max(1, min($perPage, 100));

        return $query->paginate($perPage);
    }

    /*
    |--------------------------------------------------------------------------
    | FIND BY ID
    |--------------------------------------------------------------------------
    */

    public function findById(int $id): ?County
    {
        return $this->query()->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | FIND BY SLUG
    |--------------------------------------------------------------------------
    */

    public function findBySlug(string $slug): ?County
    {
        return $this->query()
            ->where('slug', $slug)
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | FIND INCLUDING TRASHED
    |--------------------------------------------------------------------------
    */

    public function findWithTrashed(int $id): ?County
    {
        return County::withTrashed()
            ->with([
                'country',
                'region',
            ])
            ->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | FIND ONLY TRASHED COUNTY
    |--------------------------------------------------------------------------
    */

    public function findTrashedById(int $id): ?County
    {
        return County::onlyTrashed()
            ->with([
                'country',
                'region',
            ])
            ->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE COUNTY
    |--------------------------------------------------------------------------
    */

    public function create(array $data): County
    {
        return DB::transaction(function () use ($data) {

            if (empty($data['slug'])) {
                $data['slug'] = $this->generateSlug(
                    (int) $data['country_id'],
                    (int) $data['region_id'],
                    $data['name']
                );
            }

            $county = County::create($data);

            return $county->fresh([
                'country',
                'region',
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE COUNTY
    |--------------------------------------------------------------------------
    */

    public function update(
        County $county,
        array $data
    ): County {

        return DB::transaction(function () use ($county, $data) {

            $county->fill($data);

            /*
             * Regenerate hierarchical slug when the county name
             * or its country/region changes.
             */

            if (
                !array_key_exists('slug', $data)
                && (
                    $county->isDirty('name')
                    || $county->isDirty('country_id')
                    || $county->isDirty('region_id')
                )
            ) {
                $county->slug = $this->generateSlug(
                    (int) $county->country_id,
                    (int) $county->region_id,
                    $county->name,
                    $county->id
                );
            }

            $county->save();

            return $county->fresh([
                'country',
                'region',
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | GENERATE HIERARCHICAL SLUG
    |--------------------------------------------------------------------------
    */

    protected function generateSlug(
        int $countryId,
        int $regionId,
        string $countyName,
        ?int $ignoreId = null
    ): string {

        $country = Country::findOrFail($countryId);

        $region = Region::findOrFail($regionId);

        $baseSlug = Str::slug(
            $country->name . '-' .
            $region->name . '-' .
            $countyName
        );

        $slug = $baseSlug;
        $counter = 1;

        while (
            County::withTrashed()
                ->where('slug', $slug)
                ->when(
                    $ignoreId,
                    fn (Builder $query) =>
                        $query->where('id', '!=', $ignoreId)
                )
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /*
    |--------------------------------------------------------------------------
    | SOFT DELETE COUNTY
    |--------------------------------------------------------------------------
    */

    public function delete(County $county): bool
    {
        if ($this->hasDependencies($county)) {
            throw new RuntimeException(
                'This county cannot be deleted because it has related records.'
            );
        }

        return (bool) $county->delete();
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE COUNTY
    |--------------------------------------------------------------------------
    */

    public function restore(int $id): ?County
    {
        return DB::transaction(function () use ($id) {

            $county = $this->findTrashedById($id);

            if (!$county) {
                return null;
            }

            $county->restore();

            return $county->fresh([
                'country',
                'region',
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE COUNTY
    |--------------------------------------------------------------------------
    */

    public function forceDelete(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $county = County::withTrashed()->find($id);

            if (!$county) {
                return false;
            }

            if ($this->hasDependencies($county)) {
                throw new RuntimeException(
                    'This county cannot be permanently deleted because it has related records.'
                );
            }

            return (bool) $county->forceDelete();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVE COUNTIES
    |--------------------------------------------------------------------------
    */

    public function getActive(array $filters = []): Collection
    {
        $query = $this->query()
            ->where('counties.is_active', true);

        $this->applyFilters($query, $filters);
        $this->applyOrdering($query, $filters);

        return $query->get();
    }

    /*
    |--------------------------------------------------------------------------
    | INACTIVE COUNTIES
    |--------------------------------------------------------------------------
    */

    public function getInactive(array $filters = []): Collection
    {
        $query = $this->query()
            ->where('counties.is_active', false);

        $this->applyFilters($query, $filters);
        $this->applyOrdering($query, $filters);

        return $query->get();
    }

    /*
    |--------------------------------------------------------------------------
    | COUNTIES BY COUNTRY
    |--------------------------------------------------------------------------
    */

    public function getByCountry(int $countryId): Collection
    {
        return $this->query()
            ->where('country_id', $countryId)
            ->orderBy('name')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | COUNTIES BY REGION
    |--------------------------------------------------------------------------
    */

    public function getByRegion(int $regionId): Collection
    {
        return $this->query()
            ->where('region_id', $regionId)
            ->orderBy('name')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH COUNTIES
    |--------------------------------------------------------------------------
    */

    public function search(string $search): Collection
    {
        $search = trim($search);

        $query = $this->query();

        $query->where(function (Builder $q) use ($search) {
            $q->where('counties.name', 'like', "%{$search}%")
                ->orWhere('counties.code', 'like', "%{$search}%")
                ->orWhere('counties.slug', 'like', "%{$search}%");
        });

        return $query
            ->orderBy('name')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE COUNTY
    |--------------------------------------------------------------------------
    */

    public function activate(County $county): bool
    {
        return $county->update([
            'is_active' => true,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE COUNTY
    |--------------------------------------------------------------------------
    */

    public function deactivate(County $county): bool
    {
        return $county->update([
            'is_active' => false,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE COUNTY STATUS
    |--------------------------------------------------------------------------
    */

    public function toggleStatus(County $county): bool
    {
        return $county->update([
            'is_active' => !$county->is_active,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | COUNTY STATISTICS
    |--------------------------------------------------------------------------
    */

    public function getStatistics(array $filters = []): array
    {
        $query = County::query();

        $this->applyFilters($query, $filters);

        $total = (clone $query)->count();

        $active = (clone $query)
            ->where('is_active', true)
            ->count();

        $inactive = (clone $query)
            ->where('is_active', false)
            ->count();

        $trashed = County::onlyTrashed()->count();

        $byCountry = (clone $query)
            ->select('country_id', DB::raw('COUNT(*) as total'))
            ->with('country:id,name')
            ->groupBy('country_id')
            ->get()
            ->map(function ($item) {
                return [
                    'country_id' => $item->country_id,
                    'country' => $item->country?->name,
                    'total' => (int) $item->total,
                ];
            });

        $byRegion = (clone $query)
            ->select('region_id', DB::raw('COUNT(*) as total'))
            ->with('region:id,name')
            ->groupBy('region_id')
            ->get()
            ->map(function ($item) {
                return [
                    'region_id' => $item->region_id,
                    'region' => $item->region?->name,
                    'total' => (int) $item->total,
                ];
            });

        return [
            'total' => $total,
            'active' => $active,
            'inactive' => $inactive,
            'trashed' => $trashed,
            'by_country' => $byCountry,
            'by_region' => $byRegion,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | GET TRASHED COUNTIES
    |--------------------------------------------------------------------------
    */

    public function getTrashed(
        array $filters = []
    ): LengthAwarePaginator {

        $query = County::onlyTrashed()
            ->with([
                'country',
                'region',
            ]);

        $this->applyFilters($query, $filters);
        $this->applyOrdering($query, $filters);

        $perPage = max(
            1,
            min((int) ($filters['per_page'] ?? 25), 100)
        );

        return $query->paginate($perPage);
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK COUNTY EXISTS
    |--------------------------------------------------------------------------
    */

    public function exists(int $id): bool
    {
        return County::whereKey($id)->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK COUNTY DEPENDENCIES
    |--------------------------------------------------------------------------
    */

    public function hasDependencies(County $county): bool
    {
        return $county->cities()->exists()
            || $county->areas()->exists()
            || $county->properties()->exists();
    }
}
