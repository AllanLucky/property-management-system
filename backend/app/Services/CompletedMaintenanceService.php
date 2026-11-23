<?php

namespace App\Services;

use App\Models\MaintenanceRequest;
use App\Repositories\Interfaces\CompletedMaintenanceRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use InvalidArgumentException;
use Carbon\Carbon;

class CompletedMaintenanceService
{
    /**
     * Completed maintenance repository.
     */
    protected CompletedMaintenanceRepositoryInterface $completedMaintenanceRepository;

    /**
     * Create a new service instance.
     */
    public function __construct(
        CompletedMaintenanceRepositoryInterface $completedMaintenanceRepository
    ) {
        $this->completedMaintenanceRepository = $completedMaintenanceRepository;
    }

    /*
    |--------------------------------------------------------------------------
    | BASIC RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all completed maintenance requests.
     */
    public function getAllCompletedMaintenance(): Collection
    {
        return $this->completedMaintenanceRepository->all();
    }

    /**
     * Retrieve paginated completed maintenance requests.
     */
    public function getPaginatedCompletedMaintenance(
        int $perPage = 20
    ): LengthAwarePaginator {
        return $this->completedMaintenanceRepository->paginate(
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Retrieve a completed maintenance request by ID.
     *
     * @throws ModelNotFoundException
     */
    public function getCompletedMaintenanceById(
        int $id
    ): MaintenanceRequest {
        $this->validateId($id, 'maintenance request ID');

        $maintenance = $this->completedMaintenanceRepository->find($id);

        if (!$maintenance) {
            throw (new ModelNotFoundException())->setModel(
                MaintenanceRequest::class,
                [$id]
            );
        }

        return $maintenance;
    }

    /**
     * Check whether a completed maintenance request exists.
     */
    public function completedMaintenanceExists(int $id): bool
    {
        $this->validateId($id, 'maintenance request ID');

        return $this->completedMaintenanceRepository->find($id) !== null;
    }

    /*
    |--------------------------------------------------------------------------
    | FILTERING AND SEARCH
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve filtered and paginated completed maintenance requests.
     */
    public function filterCompletedMaintenance(
        array $filters = [],
        int $perPage = 20
    ): LengthAwarePaginator {
        $this->validateFilters($filters);

        return $this->completedMaintenanceRepository->filter(
            $filters,
            $this->normalizePerPage($perPage)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP QUERIES
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance requests handled by a technician.
     */
    public function getCompletedMaintenanceByTechnician(
        int $technicianId
    ): Collection {
        $this->validateId($technicianId, 'technician ID');

        return $this->completedMaintenanceRepository
            ->findByTechnician($technicianId);
    }

    /**
     * Retrieve completed maintenance requests for a property.
     */
    public function getCompletedMaintenanceByProperty(
        int $propertyId
    ): Collection {
        $this->validateId($propertyId, 'property ID');

        return $this->completedMaintenanceRepository
            ->findByProperty($propertyId);
    }

    /**
     * Retrieve completed maintenance requests for a unit.
     */
    public function getCompletedMaintenanceByUnit(
        int $unitId
    ): Collection {
        $this->validateId($unitId, 'unit ID');

        return $this->completedMaintenanceRepository
            ->findByUnit($unitId);
    }

    /**
     * Retrieve completed maintenance requests for a category.
     */
    public function getCompletedMaintenanceByCategory(
        int $categoryId
    ): Collection {
        $this->validateId($categoryId, 'category ID');

        return $this->completedMaintenanceRepository
            ->findByCategory($categoryId);
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETION HISTORY
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance requests within a date range.
     *
     * @throws InvalidArgumentException
     */
    public function getCompletedMaintenanceBetween(
        string $startDate,
        string $endDate
    ): Collection {
        try {
            $start = Carbon::parse($startDate)->startOfDay();
            $end = Carbon::parse($endDate)->endOfDay();
        } catch (\Throwable $exception) {
            throw new InvalidArgumentException(
                'Please provide valid start and end dates.',
                0,
                $exception
            );
        }

        if ($start->greaterThan($end)) {
            throw new InvalidArgumentException(
                'The start date cannot be later than the end date.'
            );
        }

        return $this->completedMaintenanceRepository
            ->completedBetween(
                $start->toDateString(),
                $end->toDateString()
            );
    }

    /**
     * Retrieve recently completed maintenance requests.
     */
    public function getRecentlyCompletedMaintenance(
        int $limit = 10
    ): Collection {
        if ($limit < 1 || $limit > 100) {
            throw new InvalidArgumentException(
                'The limit must be between 1 and 100.'
            );
        }

        return $this->completedMaintenanceRepository
            ->recentlyCompleted($limit);
    }

    /*
    |--------------------------------------------------------------------------
    | FINANCIAL QUERIES
    |--------------------------------------------------------------------------
    */

    /**
     * Calculate total maintenance costs.
     */
    public function getTotalMaintenanceCost(
        array $filters = []
    ): float {
        $this->validateFilters($filters);

        return (float) $this->completedMaintenanceRepository
            ->totalMaintenanceCost($filters);
    }

    /**
     * Calculate average maintenance costs.
     */
    public function getAverageMaintenanceCost(
        array $filters = []
    ): float {
        $this->validateFilters($filters);

        return (float) $this->completedMaintenanceRepository
            ->averageMaintenanceCost($filters);
    }

    /**
     * Retrieve a financial summary for completed maintenance.
     */
    public function getFinancialSummary(
        array $filters = []
    ): array {
        $statistics = $this->getStatistics($filters);

        return [
            'total_completed' => (int) ($statistics['total'] ?? 0),
            'total_cost' => (float) ($statistics['total_cost'] ?? 0),
            'average_cost' => (float) ($statistics['average_cost'] ?? 0),
            'highest_cost' => (float) ($statistics['highest_cost'] ?? 0),
            'lowest_cost' => (float) ($statistics['lowest_cost'] ?? 0),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance statistics.
     */
    public function getStatistics(
        array $filters = []
    ): array {
        $this->validateFilters($filters);

        return $this->completedMaintenanceRepository
            ->statistics($filters);
    }

    /**
     * Retrieve a complete completed-maintenance dashboard summary.
     */
    public function getDashboardSummary(
        array $filters = []
    ): array {
        $statistics = $this->getStatistics($filters);

        return [
            'total' => (int) ($statistics['total'] ?? 0),

            'financial' => [
                'total_cost' => (float) ($statistics['total_cost'] ?? 0),
                'average_cost' => (float) ($statistics['average_cost'] ?? 0),
                'highest_cost' => (float) ($statistics['highest_cost'] ?? 0),
                'lowest_cost' => (float) ($statistics['lowest_cost'] ?? 0),
            ],

            'completion_periods' => [
                'today' => (int) ($statistics['completed_today'] ?? 0),
                'this_week' => (int) ($statistics['completed_this_week'] ?? 0),
                'this_month' => (int) ($statistics['completed_this_month'] ?? 0),
                'this_year' => (int) ($statistics['completed_this_year'] ?? 0),
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE VALIDATION HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Validate a database identifier.
     */
    private function validateId(int $id, string $attribute): void
    {
        if ($id < 1) {
            throw new InvalidArgumentException(
                "The {$attribute} must be a positive integer."
            );
        }
    }

    /**
     * Normalize pagination size.
     */
    private function normalizePerPage(int $perPage): int
    {
        return max(1, min($perPage, 100));
    }

    /**
     * Validate supported filters.
     */
    private function validateFilters(array $filters): void
    {
        $numericFilters = [
            'property_id',
            'apartment_id',
            'unit_id',
            'technician_id',
            'category_id',
        ];

        foreach ($numericFilters as $filter) {
            if (
                isset($filters[$filter]) &&
                (!is_numeric($filters[$filter]) || (int) $filters[$filter] < 1)
            ) {
                throw new InvalidArgumentException(
                    "The {$filter} filter must be a positive integer."
                );
            }
        }

        foreach (['min_cost', 'max_cost'] as $filter) {
            if (
                isset($filters[$filter]) &&
                (!is_numeric($filters[$filter]) || (float) $filters[$filter] < 0)
            ) {
                throw new InvalidArgumentException(
                    "The {$filter} filter must be a non-negative number."
                );
            }
        }

        if (
            isset($filters['min_cost'], $filters['max_cost']) &&
            (float) $filters['min_cost'] > (float) $filters['max_cost']
        ) {
            throw new InvalidArgumentException(
                'The minimum cost cannot exceed the maximum cost.'
            );
        }

        if (
            isset($filters['date_from'], $filters['date_to']) &&
            strtotime($filters['date_from']) !== false &&
            strtotime($filters['date_to']) !== false &&
            strtotime($filters['date_from']) > strtotime($filters['date_to'])
        ) {
            throw new InvalidArgumentException(
                'The start date cannot be later than the end date.'
            );
        }

        if (
            isset($filters['sort_direction']) &&
            !in_array(
                strtolower($filters['sort_direction']),
                ['asc', 'desc'],
                true
            )
        ) {
            throw new InvalidArgumentException(
                'Sort direction must be either asc or desc.'
            );
        }
    }
}
