<?php

namespace App\Repositories\Eloquent;

use App\Models\MaintenanceRequest;
use App\Repositories\Interfaces\MaintenanceRequestRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MaintenanceRequestRepository implements MaintenanceRequestRepositoryInterface
{
    /**
     * Allowed sorting columns.
     */
    protected array $sortable = [
        'id',
        'reference',
        'status',
        'priority',
        'scheduled_at',
        'completed_at',
        'total_cost',
        'created_at',
        'updated_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | BASE QUERY
    |--------------------------------------------------------------------------
    */

    /**
     * Build the base query with maintenance request details.
     */
    protected function baseQuery(bool $withRecords = false): Builder
    {
        $query = MaintenanceRequest::query()
            ->withDetails();

        if ($withRecords) {
            $query->withMaintenanceRecords();
        }

        return $query;
    }

    /**
     * Retrieve a fully loaded maintenance request.
     */
    protected function loadRequest(int $id): ?MaintenanceRequest
    {
        return $this->baseQuery(true)->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | BASIC RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all maintenance requests.
     */
    public function all(): Collection
    {
        return $this->baseQuery()
            ->latest()
            ->get();
    }

    /**
     * Retrieve paginated maintenance requests.
     */
    public function paginate(int $perPage = 20): LengthAwarePaginator
    {
        return $this->baseQuery()
            ->latest()
            ->paginate($this->normalizePerPage($perPage));
    }

    /**
     * Find a maintenance request by ID.
     */
    public function find(int $id): ?MaintenanceRequest
    {
        return $this->loadRequest($id);
    }

    /**
     * Find a maintenance request by reference.
     */
    public function findByReference(string $reference): ?MaintenanceRequest
    {
        return $this->baseQuery(true)
            ->where('reference', $reference)
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | CRUD OPERATIONS
    |--------------------------------------------------------------------------
    */

    /**
     * Create a maintenance request.
     */
    public function create(array $data): MaintenanceRequest
    {
        $maintenanceRequest = MaintenanceRequest::query()
            ->create($data);

        return $this->loadRequest($maintenanceRequest->id)
            ?? $maintenanceRequest;
    }

    /**
     * Update a maintenance request.
     */
    public function update(int $id, array $data): ?MaintenanceRequest
    {
        $maintenanceRequest = MaintenanceRequest::query()
            ->find($id);

        if (!$maintenanceRequest) {
            return null;
        }

        $maintenanceRequest->update($data);

        return $this->loadRequest($id);
    }

    /**
     * Update a maintenance request's workflow status and related fields.
     *
     * Workflow validation and preparation of status-related fields
     * are handled by the service layer.
     */
    public function updateStatus(
        int $id,
        array $data
    ): ?MaintenanceRequest {
        return DB::transaction(function () use ($id, $data) {
            $maintenanceRequest = MaintenanceRequest::query()
                ->lockForUpdate()
                ->find($id);

            if (!$maintenanceRequest) {
                return null;
            }

            $maintenanceRequest->fill($data);
            $maintenanceRequest->save();

            return $this->loadRequest($id);
        });
    }

    /**
     * Delete a maintenance request.
     *
     * MaintenanceRequest currently does not use SoftDeletes.
     */
    public function delete(int $id): bool
    {
        $maintenanceRequest = MaintenanceRequest::query()
            ->find($id);

        if (!$maintenanceRequest) {
            return false;
        }

        return (bool) $maintenanceRequest->delete();
    }

    /*
    |--------------------------------------------------------------------------
    | FILTERING AND SEARCH
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve filtered and paginated maintenance requests.
     */
    public function filter(
        array $filters,
        int $perPage = 20
    ): LengthAwarePaginator {
        $query = $this->baseQuery();

        $this->applyFilters($query, $filters);

        return $query
            ->orderBy(
                $this->getSortColumn($filters),
                $this->getSortDirection($filters)
            )
            ->paginate($this->normalizePerPage($perPage))
            ->withQueryString();
    }

    /**
     * Apply supported filters.
     */
    protected function applyFilters(
        Builder $query,
        array $filters
    ): Builder {
        return $query

            /*
            |--------------------------------------------------------------------------
            | SEARCH
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['search']),
                function (Builder $query) use ($filters) {
                    $search = trim((string) $filters['search']);

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
            | LOCATION FILTERS
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['property_id']),
                fn (Builder $q) => $q->where(
                    'property_id',
                    $filters['property_id']
                )
            )

            ->when(
                !empty($filters['apartment_id']),
                fn (Builder $q) => $q->where(
                    'apartment_id',
                    $filters['apartment_id']
                )
            )

            ->when(
                !empty($filters['unit_id']),
                fn (Builder $q) => $q->where(
                    'unit_id',
                    $filters['unit_id']
                )
            )

            ->when(
                !empty($filters['tenant_id']),
                fn (Builder $q) => $q->where(
                    'tenant_id',
                    $filters['tenant_id']
                )
            )

            ->when(
                !empty($filters['category_id']),
                fn (Builder $q) => $q->where(
                    'category_id',
                    $filters['category_id']
                )
            )

            /*
            |--------------------------------------------------------------------------
            | TECHNICIAN FILTER
            |--------------------------------------------------------------------------
            |
            | Technicians are connected through maintenance assignments.
            | There is no technician_id column on maintenance_requests.
            |
            */

            ->when(
                !empty($filters['technician_id']),
                function (Builder $query) use ($filters) {
                    $technicianId = $filters['technician_id'];

                    $query->whereHas(
                        'assignments',
                        function (Builder $assignmentQuery) use ($technicianId) {
                            $assignmentQuery->where(
                                'technician_id',
                                $technicianId
                            );
                        }
                    );
                }
            )

            /*
            |--------------------------------------------------------------------------
            | STATUS AND PRIORITY
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['status']),
                fn (Builder $q) => $q->where(
                    'status',
                    $filters['status']
                )
            )

            ->when(
                !empty($filters['priority']),
                fn (Builder $q) => $q->where(
                    'priority',
                    $filters['priority']
                )
            )

            /*
            |--------------------------------------------------------------------------
            | EMERGENCY FILTER
            |--------------------------------------------------------------------------
            */

            ->when(
                array_key_exists('is_emergency', $filters)
                    && $filters['is_emergency'] !== null
                    && $filters['is_emergency'] !== '',
                fn (Builder $q) => $q->where(
                    'is_emergency',
                    filter_var(
                        $filters['is_emergency'],
                        FILTER_VALIDATE_BOOLEAN
                    )
                )
            )

            /*
            |--------------------------------------------------------------------------
            | REPORTER FILTER
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['reported_by']),
                fn (Builder $q) => $q->where(
                    'reported_by',
                    $filters['reported_by']
                )
            )

            /*
            |--------------------------------------------------------------------------
            | CREATED DATE FILTERS
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['date_from']),
                fn (Builder $q) => $q->whereDate(
                    'created_at',
                    '>=',
                    $filters['date_from']
                )
            )

            ->when(
                !empty($filters['date_to']),
                fn (Builder $q) => $q->whereDate(
                    'created_at',
                    '<=',
                    $filters['date_to']
                )
            )

            /*
            |--------------------------------------------------------------------------
            | SCHEDULED DATE FILTERS
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['scheduled_from']),
                fn (Builder $q) => $q->whereDate(
                    'scheduled_at',
                    '>=',
                    $filters['scheduled_from']
                )
            )

            ->when(
                !empty($filters['scheduled_to']),
                fn (Builder $q) => $q->whereDate(
                    'scheduled_at',
                    '<=',
                    $filters['scheduled_to']
                )
            );
    }

    /**
     * Normalize pagination size.
     */
    protected function normalizePerPage(int $perPage): int
    {
        return max(1, min($perPage, 100));
    }

    /**
     * Get a safe sorting column.
     */
    protected function getSortColumn(array $filters): string
    {
        $column = $filters['sort_by'] ?? 'created_at';

        return in_array($column, $this->sortable, true)
            ? $column
            : 'created_at';
    }

    /**
     * Get a safe sorting direction.
     */
    protected function getSortDirection(array $filters): string
    {
        return strtolower($filters['sort_direction'] ?? 'desc') === 'asc'
            ? 'asc'
            : 'desc';
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP QUERIES
    |--------------------------------------------------------------------------
    */

    /**
     * Find requests belonging to a property.
     */
    public function findByProperty(int $propertyId): Collection
    {
        return $this->baseQuery()
            ->where('property_id', $propertyId)
            ->latest()
            ->get();
    }

    /**
     * Find requests belonging to a unit.
     */
    public function findByUnit(int $unitId): Collection
    {
        return $this->baseQuery()
            ->where('unit_id', $unitId)
            ->latest()
            ->get();
    }

    /**
     * Find requests belonging to a tenant.
     */
    public function findByTenant(int $tenantId): Collection
    {
        return $this->baseQuery()
            ->where('tenant_id', $tenantId)
            ->latest()
            ->get();
    }

    /**
     * Find requests assigned to a technician.
     */
    public function findByTechnician(int $technicianId): Collection
    {
        return $this->baseQuery(true)
            ->whereHas(
                'assignments',
                function (Builder $query) use ($technicianId) {
                    $query->where('technician_id', $technicianId);
                }
            )
            ->latest()
            ->get();
    }

    /**
     * Find requests belonging to a maintenance category.
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
    | STATUS QUERIES
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve requests by status.
     */
    protected function getByStatus(string $status): Collection
    {
        return $this->baseQuery()
            ->where('status', $status)
            ->latest()
            ->get();
    }

    public function findByStatus(string $status): Collection
    {
        return $this->getByStatus($status);
    }

    public function pending(): Collection
    {
        return $this->getByStatus('pending');
    }

    public function approved(): Collection
    {
        return $this->getByStatus('approved');
    }

    public function rejected(): Collection
    {
        return $this->getByStatus('rejected');
    }

    public function assigned(): Collection
    {
        return $this->getByStatus('assigned');
    }

    public function inProgress(): Collection
    {
        return $this->getByStatus('in_progress');
    }

    public function onHold(): Collection
    {
        return $this->getByStatus('on_hold');
    }

    public function completed(): Collection
    {
        return $this->getByStatus('completed');
    }

    public function cancelled(): Collection
    {
        return $this->getByStatus('cancelled');
    }

    /**
     * Retrieve overdue maintenance requests.
     */
    public function overdue(): Collection
    {
        return $this->baseQuery()
            ->whereIn('status', [
                'assigned',
                'in_progress',
                'on_hold',
            ])
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<', now())
            ->latest('scheduled_at')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve maintenance request statistics.
     */
    public function statistics(array $filters = []): array
    {
        $query = MaintenanceRequest::query();

        $this->applyFilters($query, $filters);

        return [
            'total' => (clone $query)->count(),

            'pending' => (clone $query)
                ->where('status', 'pending')
                ->count(),

            'approved' => (clone $query)
                ->where('status', 'approved')
                ->count(),

            'rejected' => (clone $query)
                ->where('status', 'rejected')
                ->count(),

            'assigned' => (clone $query)
                ->where('status', 'assigned')
                ->count(),

            'in_progress' => (clone $query)
                ->where('status', 'in_progress')
                ->count(),

            'on_hold' => (clone $query)
                ->where('status', 'on_hold')
                ->count(),

            'completed' => (clone $query)
                ->where('status', 'completed')
                ->count(),

            'cancelled' => (clone $query)
                ->where('status', 'cancelled')
                ->count(),

            'overdue' => (clone $query)
                ->whereIn('status', [
                    'assigned',
                    'in_progress',
                    'on_hold',
                ])
                ->whereNotNull('scheduled_at')
                ->where('scheduled_at', '<', now())
                ->count(),

            'emergency' => (clone $query)
                ->where('is_emergency', true)
                ->count(),

            'total_cost' => (float) (clone $query)
                ->where('status', 'completed')
                ->sum('total_cost'),
        ];
    }
}
