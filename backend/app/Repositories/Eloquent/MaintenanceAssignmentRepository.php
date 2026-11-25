<?php

namespace App\Repositories\Eloquent;

use App\Models\MaintenanceAssignment;
use App\Repositories\Interfaces\MaintenanceAssignmentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class MaintenanceAssignmentRepository implements MaintenanceAssignmentRepositoryInterface
{
    /**
     * Relationships loaded when retrieving maintenance assignments.
     */
    private const RELATIONS = [
        'maintenanceRequest',
        'technician',
        'assigner',
    ];

    /**
     * Assignment statuses considered active.
     */
    private const ACTIVE_STATUSES = [
        MaintenanceAssignment::STATUS_PENDING,
        MaintenanceAssignment::STATUS_ACCEPTED,
        MaintenanceAssignment::STATUS_IN_PROGRESS,
        MaintenanceAssignment::STATUS_ON_HOLD,
    ];

    /*
    |--------------------------------------------------------------------------
    | BASIC RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all maintenance assignments.
     */
    public function all(): Collection
    {
        return MaintenanceAssignment::query()
            ->with(self::RELATIONS)
            ->latest()
            ->get();
    }

    /**
     * Retrieve paginated maintenance assignments.
     */
    public function paginate(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        $query = MaintenanceAssignment::query()
            ->with(self::RELATIONS);

        $this->applyFilters($query, $filters);

        return $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Find a maintenance assignment by its ID.
     */
    public function findById(int $id): ?MaintenanceAssignment
    {
        return MaintenanceAssignment::query()
            ->find($id);
    }

    /**
     * Find a maintenance assignment by ID or throw an exception.
     */
    public function findOrFail(int $id): MaintenanceAssignment
    {
        return MaintenanceAssignment::query()
            ->findOrFail($id);
    }

    /**
     * Find a maintenance assignment with its relationships.
     */
    public function findWithRelations(int $id): ?MaintenanceAssignment
    {
        return MaintenanceAssignment::query()
            ->with(self::RELATIONS)
            ->find($id);
    }

    /**
     * Retrieve a maintenance assignment with its relationships
     * or throw an exception.
     */
    public function findWithRelationsOrFail(
        int $id
    ): MaintenanceAssignment {
        return MaintenanceAssignment::query()
            ->with(self::RELATIONS)
            ->findOrFail($id);
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve assignments belonging to a maintenance request.
     */
    public function getByMaintenanceRequest(
        int $maintenanceRequestId
    ): Collection {
        return MaintenanceAssignment::query()
            ->with(self::RELATIONS)
            ->where('maintenance_request_id', $maintenanceRequestId)
            ->latest()
            ->get();
    }

    /**
     * Retrieve assignments belonging to a technician.
     */
    public function getByTechnician(
        int $technicianId
    ): Collection {
        return MaintenanceAssignment::query()
            ->with(self::RELATIONS)
            ->where('technician_id', $technicianId)
            ->latest()
            ->get();
    }

    /**
     * Retrieve paginated assignments belonging to a technician.
     */
    public function paginateByTechnician(
        int $technicianId,
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        $query = MaintenanceAssignment::query()
            ->with(self::RELATIONS)
            ->where('technician_id', $technicianId);

        $this->applyFilters($query, $filters);

        return $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Retrieve the latest assignment for a maintenance request.
     */
    public function getLatestByMaintenanceRequest(
        int $maintenanceRequestId
    ): ?MaintenanceAssignment {
        return MaintenanceAssignment::query()
            ->with(self::RELATIONS)
            ->where('maintenance_request_id', $maintenanceRequestId)
            ->latest()
            ->first();
    }

    /**
     * Retrieve assignments created by a particular user.
     */
    public function getByAssigner(
        int $assignerId
    ): Collection {
        return MaintenanceAssignment::query()
            ->with(self::RELATIONS)
            ->where('assigned_by', $assignerId)
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS-BASED RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve pending assignments.
     */
    public function getPending(): Collection
    {
        return $this->getByStatus(
            MaintenanceAssignment::STATUS_PENDING
        );
    }

    /**
     * Retrieve accepted assignments.
     */
    public function getAccepted(): Collection
    {
        return $this->getByStatus(
            MaintenanceAssignment::STATUS_ACCEPTED
        );
    }

    /**
     * Retrieve rejected assignments.
     */
    public function getRejected(): Collection
    {
        return $this->getByStatus(
            MaintenanceAssignment::STATUS_REJECTED
        );
    }

    /**
     * Retrieve assignments currently in progress.
     */
    public function getInProgress(): Collection
    {
        return $this->getByStatus(
            MaintenanceAssignment::STATUS_IN_PROGRESS
        );
    }

    /**
     * Retrieve assignments currently on hold.
     */
    public function getOnHold(): Collection
    {
        return $this->getByStatus(
            MaintenanceAssignment::STATUS_ON_HOLD
        );
    }

    /**
     * Retrieve completed assignments.
     */
    public function getCompleted(): Collection
    {
        return $this->getByStatus(
            MaintenanceAssignment::STATUS_COMPLETED
        );
    }

    /**
     * Retrieve cancelled assignments.
     */
    public function getCancelled(): Collection
    {
        return $this->getByStatus(
            MaintenanceAssignment::STATUS_CANCELLED
        );
    }

    /**
     * Retrieve overdue assignments.
     */
    public function getOverdue(): Collection
    {
        return MaintenanceAssignment::query()
            ->with(self::RELATIONS)
            ->overdue()
            ->latest()
            ->get();
    }

    /**
     * Retrieve scheduled assignments.
     */
    public function getScheduled(): Collection
    {
        return MaintenanceAssignment::query()
            ->with(self::RELATIONS)
            ->scheduled()
            ->orderBy('scheduled_at')
            ->get();
    }

    /**
     * Retrieve assignments by status.
     */
    public function getByStatus(
        string $status
    ): Collection {
        return MaintenanceAssignment::query()
            ->with(self::RELATIONS)
            ->where('status', $status)
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | PAGINATED STATUS RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve paginated assignments by status.
     */
    public function paginateByStatus(
        string $status,
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        $query = MaintenanceAssignment::query()
            ->with(self::RELATIONS)
            ->where('status', $status);

        // The explicit status argument takes precedence.
        unset($filters['status']);

        $this->applyFilters($query, $filters);

        return $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Retrieve paginated pending assignments.
     */
    public function paginatePending(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->paginateByStatus(
            MaintenanceAssignment::STATUS_PENDING,
            $perPage,
            $filters
        );
    }

    /**
     * Retrieve paginated completed assignments.
     */
    public function paginateCompleted(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->paginateByStatus(
            MaintenanceAssignment::STATUS_COMPLETED,
            $perPage,
            $filters
        );
    }

    /**
     * Retrieve paginated overdue assignments.
     */
    public function paginateOverdue(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        $query = MaintenanceAssignment::query()
            ->with(self::RELATIONS)
            ->overdue();

        $this->applyFilters($query, $filters);

        return $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGNMENT CREATION
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new maintenance assignment.
     */
    public function create(
        array $data
    ): MaintenanceAssignment {
        $assignment = MaintenanceAssignment::query()
            ->create($data);

        return $assignment->load(self::RELATIONS);
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGNMENT UPDATES
    |--------------------------------------------------------------------------
    */

    /**
     * Update an existing maintenance assignment.
     */
    public function update(
        MaintenanceAssignment $assignment,
        array $data
    ): MaintenanceAssignment {
        $assignment->fill($data);
        $assignment->save();

        return $assignment->refresh()
            ->load(self::RELATIONS);
    }

    /**
     * Update an assignment using its ID.
     */
    public function updateById(
        int $id,
        array $data
    ): ?MaintenanceAssignment {
        $assignment = $this->findById($id);

        if (!$assignment) {
            return null;
        }

        return $this->update($assignment, $data);
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGNMENT DELETION
    |--------------------------------------------------------------------------
    */

    /**
     * Delete a maintenance assignment.
     */
    public function delete(
        MaintenanceAssignment $assignment
    ): bool {
        return (bool) $assignment->delete();
    }

    /**
     * Delete a maintenance assignment using its ID.
     */
    public function deleteById(
        int $id
    ): bool {
        $assignment = $this->findById($id);

        if (!$assignment) {
            return false;
        }

        return $this->delete($assignment);
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGNMENT VALIDATION
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether a maintenance request has an active assignment.
     */
    public function hasActiveAssignment(
        int $maintenanceRequestId
    ): bool {
        return MaintenanceAssignment::query()
            ->where('maintenance_request_id', $maintenanceRequestId)
            ->whereIn('status', self::ACTIVE_STATUSES)
            ->exists();
    }

    /**
     * Determine whether a technician has an active assignment
     * for a particular maintenance request.
     */
    public function technicianHasActiveAssignment(
        int $technicianId,
        int $maintenanceRequestId
    ): bool {
        return MaintenanceAssignment::query()
            ->where('technician_id', $technicianId)
            ->where('maintenance_request_id', $maintenanceRequestId)
            ->whereIn('status', self::ACTIVE_STATUSES)
            ->exists();
    }

    /**
     * Determine whether a technician has any assignments.
     */
    public function technicianHasAssignments(
        int $technicianId
    ): bool {
        return MaintenanceAssignment::query()
            ->where('technician_id', $technicianId)
            ->exists();
    }

    /**
     * Count active assignments belonging to a technician.
     */
    public function countActiveAssignmentsByTechnician(
        int $technicianId
    ): int {
        return MaintenanceAssignment::query()
            ->where('technician_id', $technicianId)
            ->whereIn('status', self::ACTIVE_STATUSES)
            ->count();
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve overall maintenance assignment statistics.
     */
    public function getStatistics(
        array $filters = []
    ): array {
        $query = MaintenanceAssignment::query();

        $this->applyFilters($query, $filters);

        return [
            'total' => (clone $query)->count(),

            'pending' => (clone $query)
                ->where('status', MaintenanceAssignment::STATUS_PENDING)
                ->count(),

            'accepted' => (clone $query)
                ->where('status', MaintenanceAssignment::STATUS_ACCEPTED)
                ->count(),

            'rejected' => (clone $query)
                ->where('status', MaintenanceAssignment::STATUS_REJECTED)
                ->count(),

            'in_progress' => (clone $query)
                ->where('status', MaintenanceAssignment::STATUS_IN_PROGRESS)
                ->count(),

            'on_hold' => (clone $query)
                ->where('status', MaintenanceAssignment::STATUS_ON_HOLD)
                ->count(),

            'completed' => (clone $query)
                ->where('status', MaintenanceAssignment::STATUS_COMPLETED)
                ->count(),

            'cancelled' => (clone $query)
                ->where('status', MaintenanceAssignment::STATUS_CANCELLED)
                ->count(),

            'active' => (clone $query)
                ->whereIn('status', self::ACTIVE_STATUSES)
                ->count(),

            'overdue' => (clone $query)
                ->overdue()
                ->count(),

            'scheduled' => (clone $query)
                ->scheduled()
                ->count(),
        ];
    }

    /**
     * Retrieve assignment statistics for a specific technician.
     */
    public function getTechnicianStatistics(
        int $technicianId
    ): array {
        $query = MaintenanceAssignment::query()
            ->where('technician_id', $technicianId);

        return [
            'total' => (clone $query)->count(),

            'pending' => (clone $query)
                ->where('status', MaintenanceAssignment::STATUS_PENDING)
                ->count(),

            'accepted' => (clone $query)
                ->where('status', MaintenanceAssignment::STATUS_ACCEPTED)
                ->count(),

            'rejected' => (clone $query)
                ->where('status', MaintenanceAssignment::STATUS_REJECTED)
                ->count(),

            'in_progress' => (clone $query)
                ->where('status', MaintenanceAssignment::STATUS_IN_PROGRESS)
                ->count(),

            'on_hold' => (clone $query)
                ->where('status', MaintenanceAssignment::STATUS_ON_HOLD)
                ->count(),

            'completed' => (clone $query)
                ->where('status', MaintenanceAssignment::STATUS_COMPLETED)
                ->count(),

            'cancelled' => (clone $query)
                ->where('status', MaintenanceAssignment::STATUS_CANCELLED)
                ->count(),

            'active' => (clone $query)
                ->whereIn('status', self::ACTIVE_STATUSES)
                ->count(),

            'overdue' => (clone $query)
                ->overdue()
                ->count(),

            'scheduled' => (clone $query)
                ->scheduled()
                ->count(),
        ];
    }

    /**
     * Count assignments by status.
     */
    public function countByStatus(
        string $status,
        array $filters = []
    ): int {
        $query = MaintenanceAssignment::query()
            ->where('status', $status);

        $this->applyFilters($query, $filters);

        return $query->count();
    }

    /**
     * Count all maintenance assignments.
     */
    public function countAll(
        array $filters = []
    ): int {
        $query = MaintenanceAssignment::query();

        $this->applyFilters($query, $filters);

        return $query->count();
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY FILTERING
    |--------------------------------------------------------------------------
    */

    /**
     * Apply supported filters to a maintenance assignment query.
     */
    private function applyFilters(
        Builder $query,
        array $filters = []
    ): Builder {
        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);

            $query->where(function (Builder $builder) use ($search) {
                $builder
                    ->where('rejection_reason', 'like', "%{$search}%")
                    ->orWhere('cancellation_reason', 'like', "%{$search}%")
                    ->orWhere('work_notes', 'like', "%{$search}%")
                    ->orWhereHas('technician', function (Builder $technicianQuery) use ($search) {
                        $technicianQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('assigner', function (Builder $assignerQuery) use ($search) {
                        $assignerQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('maintenanceRequest', function (Builder $requestQuery) use ($search) {
                        $requestQuery
                            ->where('title', 'like', "%{$search}%")
                            ->orWhere('reference', 'like', "%{$search}%");
                    });
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Exact Match Filters
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['technician_id'])) {
            $query->where(
                'technician_id',
                $filters['technician_id']
            );
        }

        if (!empty($filters['maintenance_request_id'])) {
            $query->where(
                'maintenance_request_id',
                $filters['maintenance_request_id']
            );
        }

        if (!empty($filters['assigned_by'])) {
            $query->where(
                'assigned_by',
                $filters['assigned_by']
            );
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

        if (!empty($filters['assigned_from'])) {
            $query->whereDate(
                'assigned_at',
                '>=',
                $filters['assigned_from']
            );
        }

        if (!empty($filters['assigned_to'])) {
            $query->whereDate(
                'assigned_at',
                '<=',
                $filters['assigned_to']
            );
        }

        if (!empty($filters['scheduled_from'])) {
            $query->whereDate(
                'scheduled_at',
                '>=',
                $filters['scheduled_from']
            );
        }

        if (!empty($filters['scheduled_to'])) {
            $query->whereDate(
                'scheduled_at',
                '<=',
                $filters['scheduled_to']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Sorting
        |--------------------------------------------------------------------------
        */

        $allowedSortColumns = [
            'id',
            'status',
            'assigned_at',
            'accepted_at',
            'started_at',
            'completed_at',
            'scheduled_at',
            'estimated_cost',
            'actual_cost',
            'created_at',
            'updated_at',
        ];

        if (!empty($filters['sort_by'])) {
            $sortBy = $filters['sort_by'];

            if (in_array($sortBy, $allowedSortColumns, true)) {
                $direction = strtolower(
                    $filters['sort_direction'] ?? 'desc'
                );

                $direction = in_array($direction, ['asc', 'desc'], true)
                    ? $direction
                    : 'desc';

                $query->orderBy($sortBy, $direction);
            }
        }

        return $query;
    }
}
