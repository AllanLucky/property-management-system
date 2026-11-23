<?php

namespace App\Repositories\Eloquent;

use App\Models\MaintenanceCategory;
use App\Models\MaintenanceRequest;
use App\Repositories\Interfaces\MaintenanceCategoryRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class MaintenanceCategoryRepository implements MaintenanceCategoryRepositoryInterface
{
    /**
     * Allowed sorting columns.
     */
    protected array $sortable = [
        'id',
        'name',
        'slug',
        'is_active',
        'created_at',
        'updated_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | BASIC RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all maintenance categories.
     */
    public function all(): Collection
    {
        return MaintenanceCategory::query()
            ->withCount('maintenanceRequests')
            ->orderBy('name')
            ->get();
    }

    /**
     * Retrieve paginated maintenance categories.
     */
    public function paginate(int $perPage = 20): LengthAwarePaginator
    {
        return MaintenanceCategory::query()
            ->withCount('maintenanceRequests')
            ->orderBy('name')
            ->paginate($this->resolvePerPage($perPage));
    }

    /**
     * Find a category by ID.
     */
    public function find(int $id): ?MaintenanceCategory
    {
        return MaintenanceCategory::query()
            ->withCount('maintenanceRequests')
            ->find($id);
    }

    /**
     * Find a category by slug.
     */
    public function findBySlug(string $slug): ?MaintenanceCategory
    {
        return MaintenanceCategory::query()
            ->withCount('maintenanceRequests')
            ->where('slug', $slug)
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | CRUD OPERATIONS
    |--------------------------------------------------------------------------
    */

    /**
     * Create a maintenance category.
     */
    public function create(array $data): MaintenanceCategory
    {
        $category = MaintenanceCategory::query()->create($data);

        return $category->loadCount('maintenanceRequests');
    }

    /**
     * Update a maintenance category.
     */
    public function update(
        int $id,
        array $data
    ): ?MaintenanceCategory {
        $category = MaintenanceCategory::query()->find($id);

        if (!$category) {
            return null;
        }

        $category->update($data);

        return $category->fresh()
            ->loadCount('maintenanceRequests');
    }

    /**
     * Delete a maintenance category.
     *
     * Categories with maintenance requests cannot be deleted.
     */
    public function delete(int $id): bool
    {
        $category = MaintenanceCategory::query()->find($id);

        if (!$category) {
            return false;
        }

        if ($category->maintenanceRequests()->exists()) {
            return false;
        }

        return (bool) $category->delete();
    }

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
    ): LengthAwarePaginator {
        $query = MaintenanceCategory::query()
            ->withCount('maintenanceRequests');

        $this->applyFilters($query, $filters);

        $sortBy = $filters['sort_by'] ?? 'name';

        if (!in_array($sortBy, $this->sortable, true)) {
            $sortBy = 'name';
        }

        $direction = strtolower(
            $filters['sort_direction'] ?? 'asc'
        );

        $direction = $direction === 'desc' ? 'desc' : 'asc';

        return $query
            ->orderBy($sortBy, $direction)
            ->paginate($this->resolvePerPage($perPage))
            ->withQueryString();
    }

    /**
     * Apply category filters.
     */
    protected function applyFilters(
        Builder $query,
        array $filters
    ): Builder {
        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);

            $query->where(function (Builder $subQuery) use ($search) {
                $subQuery
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Active / Inactive Filter
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists('is_active', $filters) &&
            $filters['is_active'] !== null &&
            $filters['is_active'] !== ''
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
        | Categories With / Without Requests
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists('has_requests', $filters) &&
            $filters['has_requests'] !== null &&
            $filters['has_requests'] !== ''
        ) {
            $hasRequests = filter_var(
                $filters['has_requests'],
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($hasRequests === true) {
                $query->whereHas('maintenanceRequests');
            } elseif ($hasRequests === false) {
                $query->whereDoesntHave('maintenanceRequests');
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Date Filters
        |--------------------------------------------------------------------------
        */

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

    /**
     * Resolve a safe pagination limit.
     */
    protected function resolvePerPage(int $perPage): int
    {
        return max(1, min($perPage, 100));
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORY STATUS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve active categories.
     */
    public function active(): Collection
    {
        return MaintenanceCategory::query()
            ->withCount('maintenanceRequests')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    /**
     * Retrieve inactive categories.
     */
    public function inactive(): Collection
    {
        return MaintenanceCategory::query()
            ->withCount('maintenanceRequests')
            ->where('is_active', false)
            ->orderBy('name')
            ->get();
    }

    /**
     * Update category active status.
     */
    public function updateStatus(
        int $id,
        bool $isActive
    ): ?MaintenanceCategory {
        $category = MaintenanceCategory::query()->find($id);

        if (!$category) {
            return null;
        }

        $category->update([
            'is_active' => $isActive,
        ]);

        return $category->fresh()
            ->loadCount('maintenanceRequests');
    }

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
    ): bool {
        return MaintenanceCategory::query()
            ->whereRaw(
                'LOWER(name) = ?',
                [mb_strtolower(trim($name))]
            )
            ->when(
                $excludeId !== null,
                fn (Builder $query) => $query->where(
                    'id',
                    '!=',
                    $excludeId
                )
            )
            ->exists();
    }

    /**
     * Check whether a category slug already exists.
     */
    public function existsBySlug(
        string $slug,
        ?int $excludeId = null
    ): bool {
        return MaintenanceCategory::query()
            ->where('slug', $slug)
            ->when(
                $excludeId !== null,
                fn (Builder $query) => $query->where(
                    'id',
                    '!=',
                    $excludeId
                )
            )
            ->exists();
    }

    /**
     * Check whether a category has maintenance requests.
     */
    public function hasRequests(int $categoryId): bool
    {
        return MaintenanceCategory::query()
            ->whereKey($categoryId)
            ->whereHas('maintenanceRequests')
            ->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve maintenance category statistics.
     */
    public function statistics(): array
    {
        $query = MaintenanceCategory::query();

        return [
            'total' => (clone $query)->count(),

            'active' => (clone $query)
                ->where('is_active', true)
                ->count(),

            'inactive' => (clone $query)
                ->where('is_active', false)
                ->count(),

            'with_requests' => (clone $query)
                ->whereHas('maintenanceRequests')
                ->count(),

            'without_requests' => (clone $query)
                ->whereDoesntHave('maintenanceRequests')
                ->count(),

            'total_requests' => MaintenanceRequest::query()->count(),
        ];
    }
}
