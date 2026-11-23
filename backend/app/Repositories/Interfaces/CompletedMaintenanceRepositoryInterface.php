<?php

namespace App\Repositories\Interfaces;

use App\Models\MaintenanceRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface CompletedMaintenanceRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | BASIC RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all completed maintenance requests.
     *
     * Records should include the relationships required by the
     * CompletedMaintenanceResource.
     */
    public function all(): Collection;

    /**
     * Retrieve paginated completed maintenance requests.
     *
     * @param int $perPage Number of records per page.
     */
    public function paginate(
        int $perPage = 20
    ): LengthAwarePaginator;

    /**
     * Find a completed maintenance request by ID.
     *
     * Returns null when the record does not exist or is not completed.
     */
    public function find(
        int $id
    ): ?MaintenanceRequest;

    /*
    |--------------------------------------------------------------------------
    | FILTERING AND SEARCH
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve filtered and paginated completed maintenance requests.
     *
     * Supported filters:
     * - search
     * - property_id
     * - apartment_id
     * - unit_id
     * - technician_id
     * - category_id
     * - date_from
     * - date_to
     * - min_cost
     * - max_cost
     * - sort_by
     * - sort_direction
     *
     * Date filters should use the maintenance completion date.
     *
     * Cost filters should use the authoritative total_cost field
     * stored on the maintenance request.
     *
     * @param array $filters Filter conditions.
     * @param int $perPage Number of records per page.
     */
    public function filter(
        array $filters,
        int $perPage = 20
    ): LengthAwarePaginator;

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP QUERIES
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance requests handled by a technician.
     *
     * Technician filtering is performed through maintenance assignments
     * using the technician_id foreign key.
     *
     * @param int $technicianId User ID of the technician.
     */
    public function findByTechnician(
        int $technicianId
    ): Collection;

    /**
     * Retrieve completed maintenance requests belonging to a property.
     */
    public function findByProperty(
        int $propertyId
    ): Collection;

    /**
     * Retrieve completed maintenance requests belonging to a unit.
     */
    public function findByUnit(
        int $unitId
    ): Collection;

    /**
     * Retrieve completed maintenance requests belonging to a category.
     */
    public function findByCategory(
        int $categoryId
    ): Collection;

    /*
    |--------------------------------------------------------------------------
    | COMPLETION HISTORY
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance requests within a date range.
     *
     * The date range is inclusive.
     *
     * @param string $startDate Start date (YYYY-MM-DD).
     * @param string $endDate End date (YYYY-MM-DD).
     */
    public function completedBetween(
        string $startDate,
        string $endDate
    ): Collection;

    /**
     * Retrieve the most recently completed maintenance requests.
     *
     * @param int $limit Maximum number of records.
     */
    public function recentlyCompleted(
        int $limit = 10
    ): Collection;

    /*
    |--------------------------------------------------------------------------
    | FINANCIAL QUERIES
    |--------------------------------------------------------------------------
    */

    /**
     * Calculate total maintenance costs for completed requests.
     *
     * Uses MaintenanceRequest.total_cost as the authoritative
     * finalized maintenance cost.
     *
     * Assignment actual_cost and expense amounts must not be added
     * again unless the completion workflow explicitly establishes
     * that they are excluded from total_cost.
     *
     * Supported filters:
     * - property_id
     * - apartment_id
     * - unit_id
     * - technician_id
     * - category_id
     * - date_from
     * - date_to
     * - min_cost
     * - max_cost
     *
     * @param array $filters Optional filter conditions.
     */
    public function totalMaintenanceCost(
        array $filters = []
    ): float;

    /**
     * Calculate average maintenance costs for completed requests.
     *
     * Uses MaintenanceRequest.total_cost as the authoritative
     * finalized maintenance cost.
     *
     * Only completed maintenance requests matching the supplied
     * filters should be included in the calculation.
     *
     * @param array $filters Optional filter conditions.
     */
    public function averageMaintenanceCost(
        array $filters = []
    ): float;

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance statistics.
     *
     * Expected statistics:
     *
     * - total
     * - total_cost
     * - average_cost
     * - highest_cost
     * - lowest_cost
     * - completed_today
     * - completed_this_week
     * - completed_this_month
     * - completed_this_year
     *
     * Financial statistics should use MaintenanceRequest.total_cost
     * consistently with the financial query methods.
     *
     * Completion-period statistics should be calculated using
     * completed_at.
     *
     * @param array $filters Optional filter conditions.
     *
     * @return array<string, int|float>
     */
    public function statistics(
        array $filters = []
    ): array;
}
