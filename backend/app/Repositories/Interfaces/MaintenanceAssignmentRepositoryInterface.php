<?php

namespace App\Repositories\Interfaces;

use App\Models\MaintenanceAssignment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface MaintenanceAssignmentRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | BASIC RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all maintenance assignments.
     */
    public function all(): Collection;

    /**
     * Retrieve paginated maintenance assignments.
     */
    public function paginate(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Find a maintenance assignment by its ID.
     */
    public function findById(int $id): ?MaintenanceAssignment;

    /**
     * Find a maintenance assignment by ID or throw an exception.
     */
    public function findOrFail(int $id): MaintenanceAssignment;

    /**
     * Find a maintenance assignment with its relationships.
     */
    public function findWithRelations(int $id): ?MaintenanceAssignment;

    /**
     * Retrieve a maintenance assignment with its relationships
     * or throw an exception.
     */
    public function findWithRelationsOrFail(
        int $id
    ): MaintenanceAssignment;

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
    ): Collection;

    /**
     * Retrieve assignments belonging to a technician.
     */
    public function getByTechnician(
        int $technicianId
    ): Collection;

    /**
     * Retrieve paginated assignments belonging to a technician.
     */
    public function paginateByTechnician(
        int $technicianId,
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Retrieve the latest assignment for a maintenance request.
     */
    public function getLatestByMaintenanceRequest(
        int $maintenanceRequestId
    ): ?MaintenanceAssignment;

    /**
     * Retrieve assignments created by a particular user.
     */
    public function getByAssigner(
        int $assignerId
    ): Collection;

    /*
    |--------------------------------------------------------------------------
    | STATUS-BASED RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve pending assignments.
     */
    public function getPending(): Collection;

    /**
     * Retrieve accepted assignments.
     */
    public function getAccepted(): Collection;

    /**
     * Retrieve rejected assignments.
     */
    public function getRejected(): Collection;

    /**
     * Retrieve assignments currently in progress.
     */
    public function getInProgress(): Collection;

    /**
     * Retrieve assignments currently on hold.
     */
    public function getOnHold(): Collection;

    /**
     * Retrieve completed assignments.
     */
    public function getCompleted(): Collection;

    /**
     * Retrieve cancelled assignments.
     */
    public function getCancelled(): Collection;

    /**
     * Retrieve overdue assignments.
     */
    public function getOverdue(): Collection;

    /**
     * Retrieve scheduled assignments.
     */
    public function getScheduled(): Collection;

    /**
     * Retrieve assignments by status.
     */
    public function getByStatus(
        string $status
    ): Collection;

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
    ): LengthAwarePaginator;

    /**
     * Retrieve paginated pending assignments.
     */
    public function paginatePending(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Retrieve paginated completed assignments.
     */
    public function paginateCompleted(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Retrieve paginated overdue assignments.
     */
    public function paginateOverdue(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

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
    ): MaintenanceAssignment;

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
    ): MaintenanceAssignment;

    /**
     * Update an assignment using its ID.
     */
    public function updateById(
        int $id,
        array $data
    ): ?MaintenanceAssignment;

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
    ): bool;

    /**
     * Delete a maintenance assignment using its ID.
     */
    public function deleteById(
        int $id
    ): bool;

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
    ): bool;

    /**
     * Determine whether a technician has an active assignment
     * for a particular maintenance request.
     */
    public function technicianHasActiveAssignment(
        int $technicianId,
        int $maintenanceRequestId
    ): bool;

    /**
     * Determine whether a technician has active assignments.
     */
    public function technicianHasAssignments(
        int $technicianId
    ): bool;

    /**
     * Count active assignments belonging to a technician.
     */
    public function countActiveAssignmentsByTechnician(
        int $technicianId
    ): int;

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
    ): array;

    /**
     * Retrieve assignment statistics for a specific technician.
     */
    public function getTechnicianStatistics(
        int $technicianId
    ): array;

    /**
     * Count assignments by status.
     */
    public function countByStatus(
        string $status,
        array $filters = []
    ): int;

    /**
     * Count all maintenance assignments.
     */
    public function countAll(
        array $filters = []
    ): int;
}
