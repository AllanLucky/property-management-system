<?php

namespace App\Services;

use App\Models\MaintenanceAssignment;
use App\Models\MaintenanceRequest;
use App\Models\User;
use App\Repositories\Interfaces\MaintenanceAssignmentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MaintenanceAssignmentService
{
    protected MaintenanceAssignmentRepositoryInterface $assignmentRepository;

    private const UPDATABLE_FIELDS = [
        'technician_id',
        'scheduled_at',
        'estimated_hours',
        'estimated_cost',
        'work_notes',
    ];

    private const ACTIVE_STATUSES = [
        MaintenanceAssignment::STATUS_PENDING,
        MaintenanceAssignment::STATUS_ACCEPTED,
        MaintenanceAssignment::STATUS_IN_PROGRESS,
        MaintenanceAssignment::STATUS_ON_HOLD,
    ];

    private const INELIGIBLE_REQUEST_STATUSES = [
        'completed',
        'cancelled',
        'rejected',
    ];

    public function __construct(
        MaintenanceAssignmentRepositoryInterface $assignmentRepository
    ) {
        $this->assignmentRepository = $assignmentRepository;
    }

    /*
    |--------------------------------------------------------------------------
    | BASIC RETRIEVAL
    |--------------------------------------------------------------------------
    */

    public function all()
    {
        return $this->assignmentRepository->all();
    }

    public function paginate(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->assignmentRepository->paginate(
            $this->normalizePerPage($perPage),
            $filters
        );
    }

    public function findById(int $id): ?MaintenanceAssignment
    {
        return $this->assignmentRepository->findWithRelations($id);
    }

    public function findOrFail(int $id): MaintenanceAssignment
    {
        return $this->findWithRelationsOrFail($id);
    }

    public function findWithRelationsOrFail(
        int $id
    ): MaintenanceAssignment {
        return $this->assignmentRepository->findWithRelationsOrFail($id);
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP RETRIEVAL
    |--------------------------------------------------------------------------
    */

    public function getByMaintenanceRequest(int $maintenanceRequestId)
    {
        return $this->assignmentRepository->getByMaintenanceRequest(
            $maintenanceRequestId
        );
    }

    public function getByTechnician(int $technicianId)
    {
        return $this->assignmentRepository->getByTechnician(
            $technicianId
        );
    }

    public function paginateByTechnician(
        int $technicianId,
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->assignmentRepository->paginateByTechnician(
            $technicianId,
            $this->normalizePerPage($perPage),
            $filters
        );
    }

    public function getLatestByMaintenanceRequest(
        int $maintenanceRequestId
    ): ?MaintenanceAssignment {
        return $this->assignmentRepository->getLatestByMaintenanceRequest(
            $maintenanceRequestId
        );
    }

    public function getByAssigner(int $assignerId)
    {
        return $this->assignmentRepository->getByAssigner($assignerId);
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS-BASED RETRIEVAL
    |--------------------------------------------------------------------------
    */

    public function getPending()
    {
        return $this->assignmentRepository->getPending();
    }

    public function getAccepted()
    {
        return $this->assignmentRepository->getAccepted();
    }

    public function getRejected()
    {
        return $this->assignmentRepository->getRejected();
    }

    public function getInProgress()
    {
        return $this->assignmentRepository->getInProgress();
    }

    public function getOnHold()
    {
        return $this->assignmentRepository->getOnHold();
    }

    public function getCompleted()
    {
        return $this->assignmentRepository->getCompleted();
    }

    public function getCancelled()
    {
        return $this->assignmentRepository->getCancelled();
    }

    public function getOverdue()
    {
        return $this->assignmentRepository->getOverdue();
    }

    public function getScheduled()
    {
        return $this->assignmentRepository->getScheduled();
    }

    public function getByStatus(string $status)
    {
        $this->validateStatus($status);

        return $this->assignmentRepository->getByStatus($status);
    }

    /*
    |--------------------------------------------------------------------------
    | PAGINATED STATUS RETRIEVAL
    |--------------------------------------------------------------------------
    */

    public function paginateByStatus(
        string $status,
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        $this->validateStatus($status);

        return $this->assignmentRepository->paginateByStatus(
            $status,
            $this->normalizePerPage($perPage),
            $filters
        );
    }

    public function paginatePending(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->assignmentRepository->paginatePending(
            $this->normalizePerPage($perPage),
            $filters
        );
    }

    public function paginateCompleted(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->assignmentRepository->paginateCompleted(
            $this->normalizePerPage($perPage),
            $filters
        );
    }

    public function paginateOverdue(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->assignmentRepository->paginateOverdue(
            $this->normalizePerPage($perPage),
            $filters
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGNMENT CREATION
    |--------------------------------------------------------------------------
    */

    /**
     * Create a maintenance assignment.
     *
     * The assignment starts as pending.
     * The parent request remains pending until work starts.
     */
    public function create(array $data): MaintenanceAssignment
    {
        return DB::transaction(function () use ($data) {

            $maintenanceRequestId = (int) $data['maintenance_request_id'];
            $technicianId = (int) $data['technician_id'];

            $maintenanceRequest = $this->findMaintenanceRequestForUpdate(
                $maintenanceRequestId
            );

            $this->ensureMaintenanceRequestCanBeAssigned(
                $maintenanceRequest
            );

            $technician = User::query()->findOrFail($technicianId);

            $this->ensureTechnician($technician);

            if (
                $this->assignmentRepository->hasActiveAssignment(
                    $maintenanceRequestId
                )
            ) {
                throw ValidationException::withMessages([
                    'maintenance_request_id' => [
                        'This maintenance request already has an active assignment.',
                    ],
                ]);
            }

            $assignmentData = Arr::only(
                $data,
                [
                    'maintenance_request_id',
                    'technician_id',
                    'scheduled_at',
                    'estimated_hours',
                    'estimated_cost',
                    'work_notes',
                ]
            );

            $assignmentData['assigned_by'] = Auth::id();
            $assignmentData['status'] = MaintenanceAssignment::STATUS_PENDING;
            $assignmentData['assigned_at'] = now();

            $assignmentData['accepted_at'] = null;
            $assignmentData['started_at'] = null;
            $assignmentData['completed_at'] = null;
            $assignmentData['rejected_at'] = null;
            $assignmentData['cancelled_at'] = null;

            $assignment = $this->assignmentRepository->create(
                $assignmentData
            );

            return $this->loadRelationships($assignment);
        }, 3);
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGNMENT UPDATES
    |--------------------------------------------------------------------------
    */

    public function update(
        int $id,
        array $data
    ): MaintenanceAssignment {
        return DB::transaction(function () use ($id, $data) {

            $assignment = $this->findForUpdate($id);

            $this->ensureNotTerminal($assignment);

            if (
                $assignment->isInProgress() &&
                array_key_exists('technician_id', $data)
            ) {
                throw ValidationException::withMessages([
                    'technician_id' => [
                        'An assignment cannot be reassigned while work is in progress.',
                    ],
                ]);
            }

            if (
                isset($data['technician_id']) &&
                (int) $data['technician_id'] !==
                    (int) $assignment->technician_id
            ) {
                if (!$assignment->isPending()) {
                    throw ValidationException::withMessages([
                        'technician_id' => [
                            'A technician can only be changed while an assignment is pending.',
                        ],
                    ]);
                }

                $technician = User::query()->findOrFail(
                    (int) $data['technician_id']
                );

                $this->ensureTechnician($technician);
            }

            $updateData = Arr::only(
                $data,
                self::UPDATABLE_FIELDS
            );

            if (empty($updateData)) {
                throw ValidationException::withMessages([
                    'assignment' => [
                        'No valid assignment fields were provided for updating.',
                    ],
                ]);
            }

            $updated = $this->assignmentRepository->update(
                $assignment,
                $updateData
            );

            return $this->loadRelationships($updated);
        }, 3);
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGNMENT DELETION
    |--------------------------------------------------------------------------
    */

    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $assignment = $this->findForUpdate($id);

            if (
                $assignment->isInProgress() ||
                $assignment->isCompleted()
            ) {
                throw ValidationException::withMessages([
                    'assignment' => [
                        'An assignment that is in progress or completed cannot be deleted.',
                    ],
                ]);
            }

            return $this->assignmentRepository->delete($assignment);
        }, 3);
    }

    /*
    |--------------------------------------------------------------------------
    | ACCEPT ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Accept a pending assignment.
     *
     * The parent request remains pending because work has not started.
     * The parent is locked and checked to prevent accepting an assignment
     * for a completed, cancelled, or rejected request.
     */
    public function accept(int $id): MaintenanceAssignment
    {
        return DB::transaction(function () use ($id) {

            $assignment = $this->findForUpdate($id);

            $this->ensureStatus(
                $assignment,
                MaintenanceAssignment::STATUS_PENDING,
                'Only pending assignments can be accepted.'
            );

            $maintenanceRequest = $this->findMaintenanceRequestForUpdate(
                (int) $assignment->maintenance_request_id
            );

            $this->ensureMaintenanceRequestCanBeWorkedOn(
                $maintenanceRequest
            );

            $updated = $this->assignmentRepository->update(
                $assignment,
                [
                    'status' => MaintenanceAssignment::STATUS_ACCEPTED,
                    'accepted_at' => now(),
                ]
            );

            return $this->loadRelationships($updated);
        }, 3);
    }

    /*
    |--------------------------------------------------------------------------
    | REJECT ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Reject an assignment.
     *
     * Rejecting an assignment does not reject the parent request.
     */
    public function reject(
        int $id,
        array $data
    ): MaintenanceAssignment {
        return DB::transaction(function () use ($id, $data) {

            $assignment = $this->findForUpdate($id);

            $this->ensureStatus(
                $assignment,
                MaintenanceAssignment::STATUS_PENDING,
                'Only pending assignments can be rejected.'
            );

            if (
                !isset($data['rejection_reason']) ||
                trim((string) $data['rejection_reason']) === ''
            ) {
                throw ValidationException::withMessages([
                    'rejection_reason' => [
                        'A rejection reason is required to reject this assignment.',
                    ],
                ]);
            }

            $updateData = [
                'status' => MaintenanceAssignment::STATUS_REJECTED,
                'rejected_at' => now(),
                'rejection_reason' => trim(
                    (string) $data['rejection_reason']
                ),
            ];

            if (!empty($data['work_notes'])) {
                $updateData['work_notes'] = $this->appendNote(
                    $assignment->work_notes,
                    $data['work_notes']
                );
            }

            $updated = $this->assignmentRepository->update(
                $assignment,
                $updateData
            );

            return $this->loadRelationships($updated);
        }, 3);
    }

    /*
    |--------------------------------------------------------------------------
    | START ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Start an accepted assignment.
     *
     * Automatically changes the parent request to in_progress.
     */
    public function start(
        int $id,
        array $data = []
    ): MaintenanceAssignment {
        return DB::transaction(function () use ($id, $data) {

            $assignment = $this->findForUpdate($id);

            $this->ensureStatus(
                $assignment,
                MaintenanceAssignment::STATUS_ACCEPTED,
                'Only accepted assignments can be started.'
            );

            $maintenanceRequest = $this->findMaintenanceRequestForUpdate(
                (int) $assignment->maintenance_request_id
            );

            $this->ensureMaintenanceRequestCanBeWorkedOn(
                $maintenanceRequest
            );

            $updateData = [
                'status' => MaintenanceAssignment::STATUS_IN_PROGRESS,
                'started_at' => now(),
            ];

            if (!empty($data['work_notes'])) {
                $updateData['work_notes'] = $this->appendNote(
                    $assignment->work_notes,
                    $data['work_notes']
                );
            }

            $updated = $this->assignmentRepository->update(
                $assignment,
                $updateData
            );

            $this->synchronizeMaintenanceRequestStatus(
                $maintenanceRequest,
                'in_progress'
            );

            return $this->loadRelationships($updated);
        }, 3);
    }

    /*
    |--------------------------------------------------------------------------
    | HOLD ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Put an accepted or in-progress assignment on hold.
     *
     * The parent request remains in_progress.
     */
    public function hold(
        int $id,
        array $data
    ): MaintenanceAssignment {
        return DB::transaction(function () use ($id, $data) {

            $assignment = $this->findForUpdate($id);

            if (
                !$assignment->isAccepted() &&
                !$assignment->isInProgress()
            ) {
                throw ValidationException::withMessages([
                    'status' => [
                        'Only accepted or in-progress assignments can be put on hold.',
                    ],
                ]);
            }

            if (
                !isset($data['hold_reason']) ||
                trim((string) $data['hold_reason']) === ''
            ) {
                throw ValidationException::withMessages([
                    'hold_reason' => [
                        'A reason is required to put an assignment on hold.',
                    ],
                ]);
            }

            $workNotes = $this->appendNote(
                $assignment->work_notes,
                'Hold reason: ' . trim((string) $data['hold_reason'])
            );

            if (!empty($data['work_notes'])) {
                $workNotes = $this->appendNote(
                    $workNotes,
                    $data['work_notes']
                );
            }

            $updated = $this->assignmentRepository->update(
                $assignment,
                [
                    'status' => MaintenanceAssignment::STATUS_ON_HOLD,
                    'work_notes' => $workNotes,
                ]
            );

            return $this->loadRelationships($updated);
        }, 3);
    }

    /*
    |--------------------------------------------------------------------------
    | RESUME ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Resume an assignment that is on hold.
     *
     * Automatically synchronizes the parent request to in_progress.
     */
    public function resume(int $id): MaintenanceAssignment
    {
        return DB::transaction(function () use ($id) {

            $assignment = $this->findForUpdate($id);

            $this->ensureStatus(
                $assignment,
                MaintenanceAssignment::STATUS_ON_HOLD,
                'Only assignments on hold can be resumed.'
            );

            $maintenanceRequest = $this->findMaintenanceRequestForUpdate(
                (int) $assignment->maintenance_request_id
            );

            $this->ensureMaintenanceRequestCanBeWorkedOn(
                $maintenanceRequest
            );

            $updated = $this->assignmentRepository->update(
                $assignment,
                [
                    'status' => MaintenanceAssignment::STATUS_IN_PROGRESS,
                ]
            );

            $this->synchronizeMaintenanceRequestStatus(
                $maintenanceRequest,
                'in_progress'
            );

            return $this->loadRelationships($updated);
        }, 3);
    }

    /*
    |--------------------------------------------------------------------------
    | RESCHEDULE ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    public function reschedule(
        int $id,
        array $data
    ): MaintenanceAssignment {
        return DB::transaction(function () use ($id, $data) {

            $assignment = $this->findForUpdate($id);

            if (
                $assignment->isCompleted() ||
                $assignment->isRejected() ||
                $assignment->isCancelled() ||
                $assignment->isInProgress()
            ) {
                throw ValidationException::withMessages([
                    'scheduled_at' => [
                        'This assignment cannot be rescheduled in its current status.',
                    ],
                ]);
            }

            if (
                !isset($data['scheduled_at']) ||
                empty($data['scheduled_at'])
            ) {
                throw ValidationException::withMessages([
                    'scheduled_at' => [
                        'A new scheduled date and time is required.',
                    ],
                ]);
            }

            $updateData = [
                'scheduled_at' => $data['scheduled_at'],
            ];

            if (!empty($data['reschedule_reason'])) {
                $updateData['work_notes'] = $this->appendNote(
                    $assignment->work_notes,
                    'Reschedule reason: ' . $data['reschedule_reason']
                );
            }

            if (!empty($data['work_notes'])) {
                $updateData['work_notes'] = $this->appendNote(
                    $updateData['work_notes'] ?? $assignment->work_notes,
                    $data['work_notes']
                );
            }

            $updated = $this->assignmentRepository->update(
                $assignment,
                $updateData
            );

            return $this->loadRelationships($updated);
        }, 3);
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETE ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Complete an accepted, in-progress, or on-hold assignment.
     *
     * The parent request is completed only when no other active
     * assignments remain for the same maintenance request.
     */
    public function complete(
        int $id,
        array $data
    ): MaintenanceAssignment {
        return DB::transaction(function () use ($id, $data) {

            $assignment = $this->findForUpdate($id);

            if (
                !$assignment->isAccepted() &&
                !$assignment->isInProgress() &&
                !$assignment->isOnHold()
            ) {
                throw ValidationException::withMessages([
                    'status' => [
                        'This assignment cannot be completed in its current status.',
                    ],
                ]);
            }

            if (!$assignment->started_at) {
                throw ValidationException::withMessages([
                    'started_at' => [
                        'The assignment must be started before it can be completed.',
                    ],
                ]);
            }

            if (
                !array_key_exists('actual_hours', $data) ||
                !array_key_exists('actual_cost', $data)
            ) {
                throw ValidationException::withMessages([
                    'actual_hours' => [
                        'Actual hours and actual cost are required to complete an assignment.',
                    ],
                ]);
            }

            $maintenanceRequest = $this->findMaintenanceRequestForUpdate(
                (int) $assignment->maintenance_request_id
            );

            $this->ensureMaintenanceRequestCanBeWorkedOn(
                $maintenanceRequest
            );

            $updateData = [
                'status' => MaintenanceAssignment::STATUS_COMPLETED,
                'completed_at' => now(),
                'actual_hours' => $data['actual_hours'],
                'actual_cost' => $data['actual_cost'],
            ];

            if (
                array_key_exists('work_notes', $data) &&
                trim((string) $data['work_notes']) !== ''
            ) {
                $updateData['work_notes'] = $this->appendNote(
                    $assignment->work_notes,
                    $data['work_notes']
                );
            }

            $updated = $this->assignmentRepository->update(
                $assignment,
                $updateData
            );

            /*
             * Check whether another active assignment exists.
             */
            $hasOtherActiveAssignments = MaintenanceAssignment::query()
                ->where(
                    'maintenance_request_id',
                    $assignment->maintenance_request_id
                )
                ->where('id', '!=', $assignment->getKey())
                ->whereIn('status', self::ACTIVE_STATUSES)
                ->exists();

            if (!$hasOtherActiveAssignments) {
                $this->synchronizeMaintenanceRequestStatus(
                    $maintenanceRequest,
                    'completed'
                );
            }

            return $this->loadRelationships($updated);
        }, 3);
    }

    /*
    |--------------------------------------------------------------------------
    | CANCEL ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Cancel an active assignment.
     *
     * Cancelling an assignment does not automatically cancel the parent request.
     */
    public function cancel(
        int $id,
        array $data
    ): MaintenanceAssignment {
        return DB::transaction(function () use ($id, $data) {

            $assignment = $this->findForUpdate($id);

            if (!in_array(
                $assignment->status,
                self::ACTIVE_STATUSES,
                true
            )) {
                throw ValidationException::withMessages([
                    'status' => [
                        'Only active assignments can be cancelled.',
                    ],
                ]);
            }

            if (
                !isset($data['cancellation_reason']) ||
                trim((string) $data['cancellation_reason']) === ''
            ) {
                throw ValidationException::withMessages([
                    'cancellation_reason' => [
                        'A cancellation reason is required.',
                    ],
                ]);
            }

            $updateData = [
                'status' => MaintenanceAssignment::STATUS_CANCELLED,
                'cancelled_at' => now(),
                'cancellation_reason' => trim(
                    (string) $data['cancellation_reason']
                ),
            ];

            if (!empty($data['work_notes'])) {
                $updateData['work_notes'] = $this->appendNote(
                    $assignment->work_notes,
                    $data['work_notes']
                );
            }

            $updated = $this->assignmentRepository->update(
                $assignment,
                $updateData
            );

            return $this->loadRelationships($updated);
        }, 3);
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGNMENT VALIDATION
    |--------------------------------------------------------------------------
    */

    public function hasActiveAssignment(
        int $maintenanceRequestId
    ): bool {
        return $this->assignmentRepository->hasActiveAssignment(
            $maintenanceRequestId
        );
    }

    public function technicianHasActiveAssignment(
        int $technicianId,
        int $maintenanceRequestId
    ): bool {
        return $this->assignmentRepository
            ->technicianHasActiveAssignment(
                $technicianId,
                $maintenanceRequestId
            );
    }

    public function technicianHasAssignments(
        int $technicianId
    ): bool {
        return $this->assignmentRepository->technicianHasAssignments(
            $technicianId
        );
    }

    public function countActiveAssignmentsByTechnician(
        int $technicianId
    ): int {
        return $this->assignmentRepository
            ->countActiveAssignmentsByTechnician($technicianId);
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    public function getStatistics(array $filters = []): array
    {
        return $this->assignmentRepository->getStatistics($filters);
    }

    public function getTechnicianStatistics(int $technicianId): array
    {
        return $this->assignmentRepository->getTechnicianStatistics(
            $technicianId
        );
    }

    public function countByStatus(
        string $status,
        array $filters = []
    ): int {
        $this->validateStatus($status);

        return $this->assignmentRepository->countByStatus(
            $status,
            $filters
        );
    }

    public function countAll(array $filters = []): int
    {
        return $this->assignmentRepository->countAll($filters);
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE HELPER METHODS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve an assignment while holding a database row lock.
     */
    private function findForUpdate(int $id): MaintenanceAssignment
    {
        $assignment = MaintenanceAssignment::query()
            ->whereKey($id)
            ->lockForUpdate()
            ->first();

        if (!$assignment) {
            throw (new ModelNotFoundException())->setModel(
                MaintenanceAssignment::class,
                [$id]
            );
        }

        return $assignment;
    }

    /**
     * Retrieve and lock the parent maintenance request.
     */
    private function findMaintenanceRequestForUpdate(
        int $maintenanceRequestId
    ): MaintenanceRequest {
        $maintenanceRequest = MaintenanceRequest::query()
            ->whereKey($maintenanceRequestId)
            ->lockForUpdate()
            ->first();

        if (!$maintenanceRequest) {
            throw (new ModelNotFoundException())->setModel(
                MaintenanceRequest::class,
                [$maintenanceRequestId]
            );
        }

        return $maintenanceRequest;
    }

    /**
     * Load all relationships required by the assignment resource.
     */
    private function loadRelationships(
        MaintenanceAssignment $assignment
    ): MaintenanceAssignment {
        return $assignment->load([
            'maintenanceRequest',
            'technician',
            'assigner',
        ]);
    }

    /**
     * Change an assignment status after verifying its current status.
     *
     * Retained for other status transitions that do not require
     * parent maintenance request synchronization.
     */
    private function changeStatus(
        int $id,
        string $expectedStatus,
        array $updateData
    ): MaintenanceAssignment {
        return DB::transaction(function () use (
            $id,
            $expectedStatus,
            $updateData
        ) {

            $assignment = $this->findForUpdate($id);

            $this->ensureStatus(
                $assignment,
                $expectedStatus,
                'This assignment cannot be moved to the requested status.'
            );

            $updated = $this->assignmentRepository->update(
                $assignment,
                $updateData
            );

            return $this->loadRelationships($updated);
        }, 3);
    }

    /**
     * Ensure an assignment has the expected status.
     */
    private function ensureStatus(
        MaintenanceAssignment $assignment,
        string $expectedStatus,
        string $message
    ): void {
        if ($assignment->status !== $expectedStatus) {
            throw ValidationException::withMessages([
                'status' => [$message],
            ]);
        }
    }

    /**
     * Prevent updates to terminal assignments.
     */
    private function ensureNotTerminal(
        MaintenanceAssignment $assignment
    ): void {
        if (
            $assignment->isCompleted() ||
            $assignment->isRejected() ||
            $assignment->isCancelled()
        ) {
            throw ValidationException::withMessages([
                'assignment' => [
                    'Completed, rejected, or cancelled assignments cannot be modified.',
                ],
            ]);
        }
    }

    /**
     * Ensure the maintenance request is eligible for assignment.
     */
    private function ensureMaintenanceRequestCanBeAssigned(
        MaintenanceRequest $maintenanceRequest
    ): void {
        $status = strtolower(trim(
            (string) $maintenanceRequest->status
        ));

        if (!in_array(
            $status,
            self::INELIGIBLE_REQUEST_STATUSES,
            true
        )) {
            return;
        }

        $message = match ($status) {
            'completed' => 'A completed maintenance request cannot be assigned to a technician.',
            'cancelled' => 'A cancelled maintenance request cannot be assigned to a technician.',
            'rejected' => 'A rejected maintenance request cannot be assigned to a technician.',
            default => 'This maintenance request cannot be assigned to a technician.',
        };

        throw ValidationException::withMessages([
            'maintenance_request_id' => [$message],
        ]);
    }

    /**
     * Ensure the maintenance request can still receive work.
     */
    private function ensureMaintenanceRequestCanBeWorkedOn(
        MaintenanceRequest $maintenanceRequest
    ): void {
        $status = strtolower(trim(
            (string) $maintenanceRequest->status
        ));

        if (in_array(
            $status,
            self::INELIGIBLE_REQUEST_STATUSES,
            true
        )) {
            throw ValidationException::withMessages([
                'maintenance_request_id' => [
                    'Work cannot proceed because this maintenance request is '
                    . $status . '.',
                ],
            ]);
        }
    }

    /**
     * Synchronize the parent maintenance request status.
     *
     * Terminal parent statuses are never overwritten.
     */
    private function synchronizeMaintenanceRequestStatus(
        MaintenanceRequest $maintenanceRequest,
        string $status
    ): void {
        $currentStatus = strtolower(trim(
            (string) $maintenanceRequest->status
        ));

        if (in_array(
            $currentStatus,
            self::INELIGIBLE_REQUEST_STATUSES,
            true
        )) {
            return;
        }

        if ($currentStatus === $status) {
            return;
        }

        $maintenanceRequest->status = $status;
        $maintenanceRequest->save();
    }

    /**
     * Ensure the supplied user is an eligible technician.
     */
    private function ensureTechnician(User $technician): void
    {
        if (
            method_exists($technician, 'trashed') &&
            $technician->trashed()
        ) {
            throw ValidationException::withMessages([
                'technician_id' => [
                    'The selected technician is no longer available.',
                ],
            ]);
        }

        if (!$technician->hasRole('technician')) {
            throw ValidationException::withMessages([
                'technician_id' => [
                    'The selected user is not registered as a technician.',
                ],
            ]);
        }

        if (
            $technician->is_active !== null &&
            !$technician->is_active
        ) {
            throw ValidationException::withMessages([
                'technician_id' => [
                    'The selected technician account is inactive.',
                ],
            ]);
        }

        if (
            $technician->approval_status !== null &&
            $technician->approval_status !== 'approved'
        ) {
            throw ValidationException::withMessages([
                'technician_id' => [
                    'The selected technician has not been approved.',
                ],
            ]);
        }

        if (
            $technician->account_status !== null &&
            $technician->account_status !== 'active'
        ) {
            throw ValidationException::withMessages([
                'technician_id' => [
                    'The selected technician account is not active.',
                ],
            ]);
        }
    }

    /**
     * Validate an assignment status against supported statuses.
     */
    private function validateStatus(string $status): void
    {
        if (!in_array(
            $status,
            MaintenanceAssignment::statuses(),
            true
        )) {
            throw ValidationException::withMessages([
                'status' => [
                    'The selected maintenance assignment status is invalid.',
                ],
            ]);
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
     * Append a note without overwriting existing work notes.
     */
    private function appendNote(
        ?string $existingNotes,
        string $newNote
    ): string {
        $newNote = trim($newNote);

        if ($newNote === '') {
            return (string) $existingNotes;
        }

        if (empty($existingNotes)) {
            return $newNote;
        }

        return trim($existingNotes)
            . PHP_EOL
            . PHP_EOL
            . $newNote;
    }
}
