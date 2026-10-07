<?php

namespace App\Repositories\Interfaces;

use App\Models\Plot;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

interface PlotRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | Plot Retrieval
    |--------------------------------------------------------------------------
    */

    /**
     * Get all plots.
     *
     * @param array<string, mixed> $filters
     * @return Collection<int, Plot>|LengthAwarePaginator
     */
    public function getAll(
        array $filters = []
    ): Collection|LengthAwarePaginator;

    /**
     * Get paginated plots.
     *
     * @param array<string, mixed> $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function paginate(
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator;

    /**
     * Find a plot by ID.
     *
     * @param int|string $id
     * @return Plot|null
     */
    public function findById(
        int|string $id
    ): ?Plot;

    /**
     * Find a plot by ID or throw an exception.
     *
     * @param int|string $id
     * @return Plot
     */
    public function findOrFail(
        int|string $id
    ): Plot;

    /**
     * Find a plot by code.
     *
     * @param string $code
     * @return Plot|null
     */
    public function findByCode(
        string $code
    ): ?Plot;

    /**
     * Find a plot by title number.
     *
     * @param string $titleNumber
     * @return Plot|null
     */
    public function findByTitleNumber(
        string $titleNumber
    ): ?Plot;

    /**
     * Search plots by keyword and filters.
     *
     * @param string $search
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator
     */
    public function search(
        string $search,
        array $filters = []
    ): LengthAwarePaginator;

    /*
    |--------------------------------------------------------------------------
    | Plot Creation, Updates, and Deletion
    |--------------------------------------------------------------------------
    */

    /**
     * Create a plot.
     *
     * @param array<string, mixed> $data
     * @return Plot
     */
    public function create(
        array $data
    ): Plot;

    /**
     * Update a plot.
     *
     * @param Plot $plot
     * @param array<string, mixed> $data
     * @return Plot
     */
    public function update(
        Plot $plot,
        array $data
    ): Plot;

    /**
     * Soft delete a plot.
     *
     * @param Plot $plot
     * @return bool
     */
    public function delete(
        Plot $plot
    ): bool;

    /**
     * Restore a soft-deleted plot.
     *
     * @param int|string $id
     * @return Plot
     */
    public function restore(
        int|string $id
    ): Plot;

    /**
     * Permanently delete a plot.
     *
     * @param int|string $id
     * @return bool
     */
    public function forceDelete(
        int|string $id
    ): bool;

    /*
    |--------------------------------------------------------------------------
    | Plot Status and Availability
    |--------------------------------------------------------------------------
    */

    /**
     * Get available plots.
     *
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator
     */
    public function getAvailable(
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get plots by status.
     *
     * @param string $status
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator
     */
    public function getByStatus(
        string $status,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Update a plot's status.
     *
     * @param Plot $plot
     * @param string $status
     * @return Plot
     */
    public function updateStatus(
        Plot $plot,
        string $status
    ): Plot;

    /**
     * Check whether a plot is available.
     *
     * @param int|string $id
     * @return bool
     */
    public function isAvailable(
        int|string $id
    ): bool;

    /*
    |--------------------------------------------------------------------------
    | Location-Based Retrieval
    |--------------------------------------------------------------------------
    */

    /**
     * Get plots by county.
     *
     * @param int|string $countyId
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator
     */
    public function getByCounty(
        int|string $countyId,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get plots by city.
     *
     * @param int|string $cityId
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator
     */
    public function getByCity(
        int|string $cityId,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get plots by area.
     *
     * @param int|string $areaId
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator
     */
    public function getByArea(
        int|string $areaId,
        array $filters = []
    ): LengthAwarePaginator;

    /*
    |--------------------------------------------------------------------------
    | Statistics and Reports
    |--------------------------------------------------------------------------
    */

    /**
     * Get a base query for statistics and reports.
     *
     * @param array<string, mixed> $filters
     * @return Builder
     */
    public function getReportQuery(
        array $filters = []
    ): Builder;

    /**
     * Get aggregate plot inventory statistics.
     *
     * @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    public function getStatistics(
        array $filters = []
    ): array;

    /**
     * Get plot counts grouped by status.
     *
     * @param array<string, mixed> $filters
     * @return Collection<int, object>
     */
    public function getStatusStatistics(
        array $filters = []
    ): Collection;

    /**
     * Get plot counts grouped by location.
     *
     * @param array<string, mixed> $filters
     * @return Collection<int, object>
     */
    public function getLocationStatistics(
        array $filters = []
    ): Collection;

    /**
     * Get the inventory report.
     *
     * @param array<string, mixed> $filters
     * @return LengthAwarePaginator
     */
    public function getInventoryReport(
        array $filters = []
    ): LengthAwarePaginator;

    /*
    |--------------------------------------------------------------------------
    | Relationship Loading
    |--------------------------------------------------------------------------
    */

    /**
     * Load relationships needed by the plot resource.
     *
     * @param Plot $plot
     * @param array<int, string> $relations
     * @return Plot
     */
    public function loadRelations(
        Plot $plot,
        array $relations = []
    ): Plot;

    /*
    |--------------------------------------------------------------------------
    | General Query Access
    |--------------------------------------------------------------------------
    */

    /**
     * Build a filtered plot query.
     *
     * @param array<string, mixed> $filters
     * @return Builder
     */
    public function buildQuery(
        array $filters = []
    ): Builder;
}
