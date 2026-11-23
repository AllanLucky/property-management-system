<?php

namespace App\Repositories\Eloquent;

use App\Models\MaintenanceRequest;
use App\Repositories\Interfaces\OngoingMaintenanceRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class OngoingMaintenanceRepository implements OngoingMaintenanceRepositoryInterface
{
    /**
     * Maintenance request statuses considered ongoing.
     */
    protected array $ongoingStatuses = [
        'assigned',
        'in_progress',
        'on_hold',
    ];

    /**
     * Allowed sorting columns.
     */
    protected array $sortable = [
        'id',
        'reference',
        'status',
        'priority',
        'scheduled_at',
        'created_at',
        'updated_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | BASE QUERY
    |--------------------------------------------------------------------------
    */

    /**
     * Get the base ongoing maintenance query.
     */
    protected function baseQuery(): Builder
    {
        return MaintenanceRequest::query()
            ->whereIn('status', $this->ongoingStatuses)
            ->with([
                'property',
                'apartment',
                'unit',
                'tenant',
                'category',
                'reporter',
                'approver',
                'assigner',
                'latestAssignment.technician',
                'assignments.technician',
                'updates',
                'attachments',
                'expenses',
                'checklists',
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | BASIC RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all ongoing maintenance requests.
     */
    public function all(): Collection
    {
        return $this->baseQuery()
            ->latest()
            ->get();
    }

    /**
     * Retrieve paginated ongoing maintenance requests.
     */
    public function paginate(int $perPage = 20): LengthAwarePaginator
    {
        return $this->baseQuery()
            ->latest()
            ->paginate(max(1, min($perPage, 100)));
    }

    /**
     * Find an ongoing maintenance request by ID.
     */
    public function find(int $id): ?MaintenanceRequest
    {
        return $this->baseQuery()->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | FILTERING AND SEARCH
    |--------------------------------------------------------------------------
    */

    /**
     * Filter and paginate ongoing maintenance requests.
     */
    public function filter(
        array $filters,
        int $perPage = 20
    ): LengthAwarePaginator {
        $query = $this->baseQuery();

        $this->applyFilters($query, $filters);

        $sortBy = $filters['sort_by'] ?? 'created_at';

        $sortBy = in_array($sortBy, $this->sortable, true)
            ? $sortBy
            : 'created_at';

        $direction = strtolower(
            $filters['sort_direction'] ?? 'desc'
        ) === 'asc' ? 'asc' : 'desc';

        return $query
            ->orderBy($sortBy, $direction)
            ->paginate(max(1, min($perPage, 100)))
            ->withQueryString();
    }

    /**
     * Apply available filters to the query.
     */
    protected function applyFilters(
        Builder $query,
        array $filters
    ): Builder {
        return $query

            /*
            |--------------------------------------------------------------------------
            | Search
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['search']),
                function (Builder $query) use ($filters) {
                    $search = trim($filters['search']);

                    $query->where(function (Builder $subQuery) use ($search) {
                        $subQuery
                            ->where('reference', 'like', "%{$search}%")
                            ->orWhere('title', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%");
                    });
                }
            )

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['status']) &&
                in_array($filters['status'], $this->ongoingStatuses, true),
                fn (Builder $query) =>
                    $query->where('status', $filters['status'])
            )

            /*
            |--------------------------------------------------------------------------
            | Priority
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['priority']),
                fn (Builder $query) =>
                    $query->where('priority', $filters['priority'])
            )

            /*
            |--------------------------------------------------------------------------
            | Property
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['property_id']),
                fn (Builder $query) =>
                    $query->where('property_id', $filters['property_id'])
            )

            /*
            |--------------------------------------------------------------------------
            | Apartment
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['apartment_id']),
                fn (Builder $query) =>
                    $query->where('apartment_id', $filters['apartment_id'])
            )

            /*
            |--------------------------------------------------------------------------
            | Unit
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['unit_id']),
                fn (Builder $query) =>
                    $query->where('unit_id', $filters['unit_id'])
            )

            /*
            |--------------------------------------------------------------------------
            | Technician
            |--------------------------------------------------------------------------
            | Technicians are related through MaintenanceAssignment.
            | MaintenanceRequest does not use a direct technician_id column.
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['technician_id']),
                function (Builder $query) use ($filters) {
                    $query->whereHas(
                        'assignments',
                        fn (Builder $assignmentQuery) =>
                            $assignmentQuery->where(
                                'technician_id',
                                $filters['technician_id']
                            )
                    );
                }
            )

            /*
            |--------------------------------------------------------------------------
            | Category
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['category_id']),
                fn (Builder $query) =>
                    $query->where('category_id', $filters['category_id'])
            )

            /*
            |--------------------------------------------------------------------------
            | Date Filters
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['date_from']),
                fn (Builder $query) =>
                    $query->whereDate('created_at', '>=', $filters['date_from'])
            )

            ->when(
                !empty($filters['date_to']),
                fn (Builder $query) =>
                    $query->whereDate('created_at', '<=', $filters['date_to'])
            )

            /*
            |--------------------------------------------------------------------------
            | Scheduled Date Filters
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['scheduled_from']),
                fn (Builder $query) =>
                    $query->whereDate('scheduled_at', '>=', $filters['scheduled_from'])
            )

            ->when(
                !empty($filters['scheduled_to']),
                fn (Builder $query) =>
                    $query->whereDate('scheduled_at', '<=', $filters['scheduled_to'])
            )

            /*
            |--------------------------------------------------------------------------
            | Emergency Filter
            |--------------------------------------------------------------------------
            */

            ->when(
                array_key_exists('is_emergency', $filters) &&
                $filters['is_emergency'] !== null &&
                $filters['is_emergency'] !== '',
                fn (Builder $query) =>
                    $query->where(
                        'is_emergency',
                        filter_var($filters['is_emergency'], FILTER_VALIDATE_BOOLEAN)
                    )
            );
    }

    /*
    |--------------------------------------------------------------------------
    | MAINTENANCE STATUS QUERIES
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve ongoing requests by a specific status.
     */
    protected function getByStatus(string $status): Collection
    {
        if (!in_array($status, $this->ongoingStatuses, true)) {
            return collect();
        }

        return $this->baseQuery()
            ->where('status', $status)
            ->latest()
            ->get();
    }

    /**
     * Retrieve assigned maintenance requests.
     */
    public function assigned(): Collection
    {
        return $this->getByStatus('assigned');
    }

    /**
     * Retrieve maintenance requests currently in progress.
     */
    public function inProgress(): Collection
    {
        return $this->getByStatus('in_progress');
    }

    /**
     * Retrieve maintenance requests currently on hold.
     */
    public function onHold(): Collection
    {
        return $this->getByStatus('on_hold');
    }

    /**
     * Retrieve overdue ongoing maintenance requests.
     */
    public function overdue(): Collection
    {
        return $this->baseQuery()
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<', now())
            ->latest('scheduled_at')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP QUERIES
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve ongoing maintenance requests assigned to a technician.
     */
    public function findByTechnician(int $technicianId): Collection
    {
        return $this->baseQuery()
            ->whereHas(
                'assignments',
                fn (Builder $query) =>
                    $query->where('technician_id', $technicianId)
            )
            ->latest()
            ->get();
    }

    /**
     * Retrieve ongoing maintenance requests for a property.
     */
    public function findByProperty(int $propertyId): Collection
    {
        return $this->baseQuery()
            ->where('property_id', $propertyId)
            ->latest()
            ->get();
    }

    /**
     * Retrieve ongoing maintenance requests for a unit.
     */
    public function findByUnit(int $unitId): Collection
    {
        return $this->baseQuery()
            ->where('unit_id', $unitId)
            ->latest()
            ->get();
    }

    /**
     * Retrieve ongoing maintenance requests for a category.
     */
    public function findByCategory(int $categoryId): Collection
    {
        return $this->baseQuery()
            ->where('category_id', $categoryId)
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve ongoing maintenance statistics.
     */
    public function statistics(array $filters = []): array
    {
        $query = $this->baseQuery();

        $this->applyFilters($query, $filters);

        return [
            'total' => (clone $query)->count(),

            'assigned' => (clone $query)
                ->where('status', 'assigned')
                ->count(),

            'in_progress' => (clone $query)
                ->where('status', 'in_progress')
                ->count(),

            'on_hold' => (clone $query)
                ->where('status', 'on_hold')
                ->count(),

            'overdue' => (clone $query)
                ->whereNotNull('scheduled_at')
                ->where('scheduled_at', '<', now())
                ->count(),

            'total_estimated_cost' => (float) (clone $query)
                ->sum('estimated_cost'),

            'total_actual_cost' => (float) (clone $query)
                ->sum('total_cost'),
        ];
    }
}
