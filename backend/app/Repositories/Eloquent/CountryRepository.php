<?php

namespace App\Repositories\Eloquent;

use App\Models\Country;
use App\Repositories\Interfaces\CountryRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\SoftDeletes;

class CountryRepository implements CountryRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | ALLOWED FILTERS
    |--------------------------------------------------------------------------
    */

    protected array $allowedSortColumns = [
        'id',
        'name',
        'slug',
        'code',
        'phone_code',
        'currency',
        'is_active',
        'created_at',
        'updated_at',
    ];

    protected array $allowedRelations = [
        'regions',
        'counties',
        'cities',
        'areas',
        'properties',
    ];

    /*
    |--------------------------------------------------------------------------
    | GET COUNTRIES
    |--------------------------------------------------------------------------
    */

    /**
     * Get all countries with optional filters and relationships.
     */
    public function all(array $filters = []): Collection
    {
        $query = Country::query();

        $this->applyFilters($query, $filters);

        return $query->get();
    }

    /**
     * Get paginated countries with optional filters.
     */
    public function paginate(
        array $filters = [],
        int $perPage = 25
    ): LengthAwarePaginator {
        $query = Country::query();

        $this->applyFilters($query, $filters);

        $perPage = max(1, min($perPage, 100));

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Get all active countries.
     */
    public function getActive(): Collection
    {
        return Country::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get all inactive countries.
     */
    public function getInactive(): Collection
    {
        return Country::query()
            ->where('is_active', false)
            ->orderBy('name')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | FIND COUNTRY
    |--------------------------------------------------------------------------
    */

    /**
     * Find a country by its ID.
     */
    public function find(int $id): ?Country
    {
        return Country::query()->find($id);
    }

    /**
     * Find a country by ID or throw an exception.
     */
    public function findOrFail(int $id): Country
    {
        return Country::query()->findOrFail($id);
    }

    /**
     * Find a country by ISO code.
     */
    public function findByCode(string $code): ?Country
    {
        return Country::query()
            ->where('code', strtoupper(trim($code)))
            ->first();
    }

    /**
     * Find a country by slug.
     */
    public function findBySlug(string $slug): ?Country
    {
        return Country::query()
            ->where('slug', strtolower(trim($slug)))
            ->first();
    }

    /**
     * Find a country by phone code.
     */
    public function findByPhoneCode(string $phoneCode): ?Country
    {
        return Country::query()
            ->where('phone_code', trim($phoneCode))
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE COUNTRY
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new country.
     */
    public function create(array $data): Country
    {
        return Country::query()->create($data);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE COUNTRY
    |--------------------------------------------------------------------------
    */

    /**
     * Update an existing country.
     */
    public function update(int $id, array $data): Country
    {
        $country = $this->findOrFail($id);

        $country->fill($data);
        $country->save();

        return $country->fresh();
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE COUNTRY
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete a country.
     */
    public function delete(int $id): bool
    {
        $country = $this->findOrFail($id);

        return (bool) $country->delete();
    }

    /**
     * Restore a soft-deleted country.
     */
    public function restore(int $id): bool
    {
        $country = Country::onlyTrashed()->findOrFail($id);

        return (bool) $country->restore();
    }

    /**
     * Permanently delete a country.
     */
    public function forceDelete(int $id): bool
    {
        $country = Country::withTrashed()->findOrFail($id);

        return (bool) $country->forceDelete();
    }

    /*
    |--------------------------------------------------------------------------
    | COUNTRY STATUS
    |--------------------------------------------------------------------------
    */

    /**
     * Activate a country.
     */
    public function activate(int $id): Country
    {
        $country = $this->findOrFail($id);

        $country->is_active = true;
        $country->save();

        return $country->fresh();
    }

    /**
     * Deactivate a country.
     */
    public function deactivate(int $id): Country
    {
        $country = $this->findOrFail($id);

        $country->is_active = false;
        $country->save();

        return $country->fresh();
    }

    /**
     * Toggle country active status.
     */
    public function toggleStatus(int $id): Country
    {
        $country = $this->findOrFail($id);

        $country->is_active = !$country->is_active;
        $country->save();

        return $country->fresh();
    }

    /*
    |--------------------------------------------------------------------------
    | EXISTENCE CHECKS
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether a country exists by ID.
     */
    public function exists(int $id): bool
    {
        return Country::query()->whereKey($id)->exists();
    }

    /**
     * Check whether a country code already exists.
     *
     * Soft-deleted countries are excluded.
     */
    public function codeExists(
        string $code,
        ?int $exceptId = null
    ): bool {
        $query = Country::query()
            ->where('code', strtoupper(trim($code)));

        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }

        return $query->exists();
    }

    /**
     * Check whether a country slug already exists.
     *
     * Soft-deleted countries are excluded.
     */
    public function slugExists(
        string $slug,
        ?int $exceptId = null
    ): bool {
        $query = Country::query()
            ->where('slug', strtolower(trim($slug)));

        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }

        return $query->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether a country has associated geographical records
     * or properties.
     *
     * Includes soft-deleted related records when their models
     * implement Laravel's SoftDeletes trait.
     */
    public function hasDependencies(int $id): bool
    {
        $country = Country::withTrashed()->findOrFail($id);

        $relations = [
            'regions',
            'counties',
            'cities',
            'areas',
            'properties',
        ];

        foreach ($relations as $relationName) {
            if ($this->relationExistsIncludingTrashed(
                $country,
                $relationName
            )) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check a relationship, including soft-deleted records
     * whenever the related model supports SoftDeletes.
     */
    protected function relationExistsIncludingTrashed(
        Country $country,
        string $relationName
    ): bool {
        $relation = $country->{$relationName}();

        $relatedModel = $relation->getRelated();

        $usesSoftDeletes = in_array(
            SoftDeletes::class,
            class_uses_recursive(get_class($relatedModel)),
            true
        );

        if ($usesSoftDeletes) {
            $relation->withTrashed();
        }

        return $relation->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | COUNTRY STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Get country statistics.
     */
    public function getStatistics(): array
    {
        $query = Country::query();

        $total = (clone $query)->count();

        $active = (clone $query)
            ->where('is_active', true)
            ->count();

        $inactive = (clone $query)
            ->where('is_active', false)
            ->count();

        $trashed = Country::onlyTrashed()->count();

        $currencies = Country::query()
            ->select('currency')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('currency')
            ->orderBy('currency')
            ->get()
            ->mapWithKeys(function ($item) {
                return [
                    $item->currency => (int) $item->total,
                ];
            })
            ->toArray();

        return [
            'total' => $total,
            'active' => $active,
            'inactive' => $inactive,
            'trashed' => $trashed,
            'currencies' => $currencies,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | SOFT DELETED COUNTRIES
    |--------------------------------------------------------------------------
    */

    /**
     * Get all soft-deleted countries.
     */
    public function getTrashed(): Collection
    {
        return Country::onlyTrashed()
            ->orderByDesc('deleted_at')
            ->get();
    }

    /**
     * Get a soft-deleted country by ID.
     */
    public function findTrashed(int $id): ?Country
    {
        return Country::onlyTrashed()->find($id);
    }

    /**
     * Get paginated soft-deleted countries.
     */
    public function paginateTrashed(
        array $filters = [],
        int $perPage = 25
    ): LengthAwarePaginator {
        $query = Country::onlyTrashed();

        $this->applyFilters($query, $filters);

        $perPage = max(1, min($perPage, 100));

        return $query
            ->orderByDesc('deleted_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY FILTERS
    |--------------------------------------------------------------------------
    */

    /**
     * Apply reusable country filters.
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

            $query->where(function (Builder $builder) use ($search) {
                $builder
                    ->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('slug', 'LIKE', "%{$search}%")
                    ->orWhere('code', 'LIKE', "%{$search}%")
                    ->orWhere('phone_code', 'LIKE', "%{$search}%")
                    ->orWhere('currency', 'LIKE', "%{$search}%");
            });
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
        | ISO CODE FILTER
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['code'])) {
            $query->where(
                'code',
                strtoupper(trim($filters['code']))
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SLUG FILTER
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['slug'])) {
            $query->where(
                'slug',
                strtolower(trim($filters['slug']))
            );
        }

        /*
        |--------------------------------------------------------------------------
        | PHONE CODE FILTER
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['phone_code'])) {
            $query->where(
                'phone_code',
                trim($filters['phone_code'])
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CURRENCY FILTER
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['currency'])) {
            $query->where(
                'currency',
                strtoupper(trim($filters['currency']))
            );
        }

        /*
        |--------------------------------------------------------------------------
        | ACTIVE STATUS FILTER
        |--------------------------------------------------------------------------
        */

        if (array_key_exists('is_active', $filters)
            && $filters['is_active'] !== ''
            && $filters['is_active'] !== null
        ) {
            $isActive = filter_var(
                $filters['is_active'],
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($isActive !== null) {
                $query->where('is_active', $isActive);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | RELATIONSHIPS
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['with'])) {
            $relations = is_array($filters['with'])
                ? $filters['with']
                : explode(',', $filters['with']);

            $relations = array_intersect(
                $relations,
                $this->allowedRelations
            );

            if (!empty($relations)) {
                $query->with(array_values($relations));
            }
        }

        /*
        |--------------------------------------------------------------------------
        | SORTING
        |--------------------------------------------------------------------------
        */

        $sortBy = $filters['sort_by'] ?? 'name';

        $sortDirection = strtolower(
            $filters['sort_direction'] ?? 'asc'
        );

        if (!in_array(
            $sortBy,
            $this->allowedSortColumns,
            true
        )) {
            $sortBy = 'name';
        }

        if (!in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'asc';
        }

        $query->orderBy($sortBy, $sortDirection);

        return $query;
    }
}
