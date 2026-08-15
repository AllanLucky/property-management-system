<?php

namespace App\Repositories\Interfaces;

use App\Models\Dashboard;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface DashboardRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | Dashboard Retrieval
    |--------------------------------------------------------------------------
    */

    /**
     * Get all dashboards.
     */
    public function all(array $filters = []): Collection;

    /**
     * Get paginated dashboards.
     */
    public function paginate(
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator;

    /**
     * Find dashboard by ID.
     */
    public function find(int $id): ?Dashboard;

    /**
     * Find dashboard or fail.
     */
    public function findOrFail(int $id): Dashboard;

    /**
     * Find dashboard by slug.
     */
    public function findBySlug(string $slug): ?Dashboard;

    /**
     * Get system dashboards.
     */
    public function getSystemDashboards(): Collection;

    /**
     * Get active dashboards.
     */
    public function getActiveDashboards(): Collection;

    /**
     * Get default dashboard.
     */
    public function getDefaultDashboard(): ?Dashboard;

    /**
     * Get dashboard for a specific user.
     */
    public function getForUser(User $user): ?Dashboard;

    /**
     * Get user dashboards.
     */
    public function getUserDashboards(User $user): Collection;

    /*
    |--------------------------------------------------------------------------
    | Dashboard Creation
    |--------------------------------------------------------------------------
    */

    /**
     * Create dashboard.
     */
    public function create(array $data): Dashboard;

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
    ): Dashboard;

    /**
     * Update dashboard widgets.
     */
    public function updateWidgets(
        Dashboard $dashboard,
        array $widgets
    ): Dashboard;

    /**
     * Update dashboard layout.
     */
    public function updateLayout(
        Dashboard $dashboard,
        array $layout
    ): Dashboard;

    /**
     * Update dashboard filters.
     */
    public function updateFilters(
        Dashboard $dashboard,
        array $filters
    ): Dashboard;

    /**
     * Set dashboard as default.
     */
    public function setDefault(Dashboard $dashboard): Dashboard;

    /**
     * Activate dashboard.
     */
    public function activate(Dashboard $dashboard): Dashboard;

    /**
     * Deactivate dashboard.
     */
    public function deactivate(Dashboard $dashboard): Dashboard;

    /*
    |--------------------------------------------------------------------------
    | Dashboard Deletion
    |--------------------------------------------------------------------------
    */

    /**
     * Delete dashboard.
     */
    public function delete(Dashboard $dashboard): bool;

    /**
     * Restore dashboard.
     */
    public function restore(Dashboard $dashboard): bool;

    /**
     * Permanently delete dashboard.
     */
    public function forceDelete(Dashboard $dashboard): bool;
}