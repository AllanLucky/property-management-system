<?php

namespace App\Repositories\Eloquent;

use App\Models\Dashboard;
use App\Models\User;
use App\Repositories\Interfaces\DashboardRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class DashboardRepository implements DashboardRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | Model
    |--------------------------------------------------------------------------
    */

    protected Dashboard $model;

    /**
     * DashboardRepository constructor.
     */
    public function __construct(Dashboard $model)
    {
        $this->model = $model;
    }

    /*
    |--------------------------------------------------------------------------
    | Dashboard Retrieval
    |--------------------------------------------------------------------------
    */

    /**
     * Get all dashboards.
     */
    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        $this->applyFilters($query, $filters);

        return $query
            ->with('user')
            ->ordered()
            ->get();
    }

    /**
     * Get paginated dashboards.
     */
    public function paginate(
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator {
        $query = $this->model->newQuery();

        $this->applyFilters($query, $filters);

        return $query
            ->with('user')
            ->ordered()
            ->paginate($perPage);
    }

    /**
     * Find dashboard by ID.
     */
    public function find(int $id): ?Dashboard
    {
        return $this->model
            ->newQuery()
            ->with('user')
            ->find($id);
    }

    /**
     * Find dashboard or fail.
     */
    public function findOrFail(int $id): Dashboard
    {
        return $this->model
            ->newQuery()
            ->with('user')
            ->findOrFail($id);
    }

    /**
     * Find dashboard by slug.
     */
    public function findBySlug(string $slug): ?Dashboard
    {
        return $this->model
            ->newQuery()
            ->with('user')
            ->where('slug', $slug)
            ->first();
    }

    /**
     * Get system dashboards.
     */
    public function getSystemDashboards(): Collection
    {
        return $this->model
            ->newQuery()
            ->system()
            ->active()
            ->ordered()
            ->get();
    }

    /**
     * Get active dashboards.
     */
    public function getActiveDashboards(): Collection
    {
        return $this->model
            ->newQuery()
            ->active()
            ->ordered()
            ->get();
    }

    /**
     * Get default dashboard.
     */
    public function getDefaultDashboard(): ?Dashboard
    {
        return $this->model
            ->newQuery()
            ->active()
            ->default()
            ->ordered()
            ->first();
    }

    /**
     * Get dashboard for a specific user.
     */
    public function getForUser(User $user): ?Dashboard
    {
        /*
        |--------------------------------------------------------------------------
        | User-specific dashboard first
        |--------------------------------------------------------------------------
        */

        $dashboard = $this->model
            ->newQuery()
            ->active()
            ->where('type', Dashboard::TYPE_USER)
            ->where('user_id', $user->id)
            ->ordered()
            ->first();

        if ($dashboard) {
            return $dashboard;
        }

        /*
        |--------------------------------------------------------------------------
        | Fall back to system dashboard
        |--------------------------------------------------------------------------
        */

        return $this->getDefaultDashboard();
    }

    /**
     * Get user dashboards.
     */
    public function getUserDashboards(User $user): Collection
    {
        return $this->model
            ->newQuery()
            ->userDashboards()
            ->where('user_id', $user->id)
            ->ordered()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | Dashboard Creation
    |--------------------------------------------------------------------------
    */

    /**
     * Create dashboard.
     */
    public function create(array $data): Dashboard
    {
        return $this->model
            ->newQuery()
            ->create($data);
    }

    /*
    |--------------------------------------------------------------------------
    | Dashboard Update
    |--------------------------------------------------------------------------
    */

    /**
     * Update dashboard.
     */
    public function update(
        Dashboard $dashboard,
        array $data
    ): Dashboard {
        $dashboard->update($data);

        return $dashboard->refresh();
    }

    /**
     * Update dashboard widgets.
     */
    public function updateWidgets(
        Dashboard $dashboard,
        array $widgets
    ): Dashboard {
        $dashboard->update([
            'widgets' => $widgets,
        ]);

        return $dashboard->refresh();
    }

    /**
     * Update dashboard layout.
     */
    public function updateLayout(
        Dashboard $dashboard,
        array $layout
    ): Dashboard {
        $dashboard->update([
            'layout' => $layout,
        ]);

        return $dashboard->refresh();
    }

    /**
     * Update dashboard filters.
     */
    public function updateFilters(
        Dashboard $dashboard,
        array $filters
    ): Dashboard {
        $dashboard->update([
            'filters' => $filters,
        ]);

        return $dashboard->refresh();
    }

    /**
     * Set dashboard as default.
     */
    public function setDefault(Dashboard $dashboard): Dashboard
    {
        return DB::transaction(function () use ($dashboard) {

            $this->model
                ->newQuery()
                ->where('id', '!=', $dashboard->id)
                ->update([
                    'is_default' => false,
                ]);

            $dashboard->update([
                'is_default' => true,
                'is_active' => true,
            ]);

            return $dashboard->refresh();
        });
    }

    /**
     * Activate dashboard.
     */
    public function activate(Dashboard $dashboard): Dashboard
    {
        $dashboard->update([
            'is_active' => true,
        ]);

        return $dashboard->refresh();
    }

    /**
     * Deactivate dashboard.
     */
    public function deactivate(Dashboard $dashboard): Dashboard
    {
        $dashboard->update([
            'is_active' => false,
        ]);

        return $dashboard->refresh();
    }

    /*
    |--------------------------------------------------------------------------
    | Dashboard Deletion
    |--------------------------------------------------------------------------
    */

    /**
     * Delete dashboard.
     */
    public function delete(Dashboard $dashboard): bool
    {
        return (bool) $dashboard->delete();
    }

    /**
     * Restore dashboard.
     *
     * Note:
     * Dashboard does not currently use SoftDeletes,
     * therefore this simply returns false.
     */
    public function restore(Dashboard $dashboard): bool
    {
        return false;
    }

    /**
     * Permanently delete dashboard.
     *
     * Dashboard does not currently use SoftDeletes.
     */
    public function forceDelete(Dashboard $dashboard): bool
    {
        return (bool) $dashboard->forceDelete();
    }

    /*
    |--------------------------------------------------------------------------
    | Filters
    |--------------------------------------------------------------------------
    */

    /**
     * Apply dashboard filters.
     */
    protected function applyFilters($query, array $filters): void
    {
        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if (! empty($filters['search'])) {
            $search = trim($filters['search']);

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Type
        |--------------------------------------------------------------------------
        */

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        /*
        |--------------------------------------------------------------------------
        | User
        |--------------------------------------------------------------------------
        */

        if (array_key_exists('user_id', $filters)) {
            $query->where('user_id', $filters['user_id']);
        }

        /*
        |--------------------------------------------------------------------------
        | Active
        |--------------------------------------------------------------------------
        */

        if (array_key_exists('is_active', $filters)) {
            $query->where(
                'is_active',
                (bool) $filters['is_active']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Default
        |--------------------------------------------------------------------------
        */

        if (array_key_exists('is_default', $filters)) {
            $query->where(
                'is_default',
                (bool) $filters['is_default']
            );
        }
    }
}