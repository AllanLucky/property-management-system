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
    /**
     * Repository instance.
     */
    protected MaintenanceAssignmentRepositoryInterface $assignmentRepository;

    /**
     * Fields that can be changed when updating an assignment.
     */
    private const UPDATABLE_FIELDS = [
        'technician_id',
        'scheduled_at',
        'estimated_hours',
        'estimated_cost',
        'work_notes',
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

    /**
     * Create a new service instance.
     */
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

    /**
     * Retrieve all maintenance assignments.
     */
    public function all()
    {
        return $this->assignmentRepository->all();
    }

    /**
     * Retrieve paginated maintenance assignments.
     */
    public function paginate(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->assignmentRepository->paginate(
            $perPage,
            $filters
        );
    }

    /**
     * Retrieve a maintenance assignment by ID.
     */
    public function findById(int $id): ?MaintenanceAssignment
    {
        return $this->assignmentRepository->findWithRelations($id);
    }

    /**
     * Retrieve a maintenance assignment by ID or throw an exception.
     */
    public function findOrFail(int $id): MaintenanceAssignment
    {
        return $this->assignmentRepository->findWithRelationsOrFail($id);
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
    ) {
        return $this->assignmentRepository->getByMaintenanceRequest(
            $maintenanceRequestId
        );
    }

    /**
     * Retrieve assignments belonging to a technician.
     */
    public function getByTechnician(
        int $technicianId
    ) {
        return $this->assignmentRepository->getByTechnician(
            $technicianId
        );
    }

    /**
     * Retrieve paginated assignments belonging to a technician.
     */
    public function paginateByTechnician(
        int $technicianId,
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->assignmentRepository->paginateByTechnician(
            $technicianId,
            $perPage,
            $filters
        );
    }

    /**
     * Retrieve the latest assignment for a maintenance request.
     */
    public function getLatestByMaintenanceRequest(
        int $maintenanceRequestId
    ): ?MaintenanceAssignment {
        return $this->assignmentRepository->getLatestByMaintenanceRequest(
            $maintenanceRequestId
        );
    }

    /**
     * Retrieve assignments created by a particular user.
     */
    public function getByAssigner(int $assignerId)
    {
        return $this->assignmentRepository->getByAssigner($assignerId);
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS-BASED RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve pending assignments.
     */
    public function getPending()
    {
        return $this->assignmentRepository->getPending();
    }

    /**
     * Retrieve accepted assignments.
     */
    public function getAccepted()
    {
        return $this->assignmentRepository->getAccepted();
    }

    /**
     * Retrieve rejected assignments.
     */
    public function getRejected()
    {
        return $this->assignmentRepository->getRejected();
    }

    /**
     * Retrieve assignments currently in progress.
     */
    public function getInProgress()
    {
        return $this->assignmentRepository->getInProgress();
    }

    /**
     * Retrieve assignments currently on hold.
     */
    public function getOnHold()
    {
        return $this->assignmentRepository->getOnHold();
    }

    /**
     * Retrieve completed assignments.
     */
    public function getCompleted()
    {
        return $this->assignmentRepository->getCompleted();
    }

    /**
     * Retrieve cancelled assignments.
     */
    public function getCancelled()
    {
        return $this->assignmentRepository->getCancelled();
    }

    /**
     * Retrieve overdue assignments.
     */
    public function getOverdue()
    {
        return $this->assignmentRepository->getOverdue();
    }

    /**
     * Retrieve scheduled assignments.
     */
    public function getScheduled()
    {
        return $this->assignmentRepository->getScheduled();
    }

    /**
     * Retrieve assignments by status.
     */
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

    /**
     * Retrieve paginated assignments by status.
     */
    public function paginateByStatus(
        string $status,
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        $this->validateStatus($status);

        return $this->assignmentRepository->paginateByStatus(
            $status,
            $perPage,
            $filters
        );
    }

    /**
     * Retrieve paginated pending assignments.
     */
    public function paginatePending(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->assignmentRepository->paginatePending(
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
        return $this->assignmentRepository->paginateCompleted(
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
        return $this->assignmentRepository->paginateOverdue(
            $perPage,
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
     * The assignment is automatically initialized as pending.
     */
    public function create(array $data): MaintenanceAssignment
    {
        return DB::transaction(function () use ($data) {
            $maintenanceRequestId = (int) $data['maintenance_request_id'];
            $technicianId = (int) $data['technician_id'];

            /*
            |--------------------------------------------------------------------------
            | Validate Maintenance Request
            |--------------------------------------------------------------------------
            */

            MaintenanceRequest::query()
                ->whereKey($maintenanceRequestId)
                ->lockForUpdate()
                ->firstOrFail();

            /*
            |--------------------------------------------------------------------------
            | Validate Technician
            |--------------------------------------------------------------------------
            */

            $technician = User::query()->findOrFail($technicianId);

            $this->ensureTechnician($technician);

            /*
            |--------------------------------------------------------------------------
            | Prevent Duplicate Active Assignments
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | Prepare Assignment Data
            |--------------------------------------------------------------------------
            */

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

            return $this->assignmentRepository->create(
                $assignmentData
            );
        });
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
        int $id,
        array $data
    ): MaintenanceAssignment {
        return DB::transaction(function () use ($id, $data) {
            $assignment = $this->findForUpdate($id);

            $this->ensureNotTerminal($assignment);

            if ($assignment->isInProgress()) {
                if (array_key_exists('technician_id', $data)) {
                    throw ValidationException::withMessages([
                        'technician_id' => [
                            'An assignment cannot be reassigned while work is in progress.',
                        ],
                    ]);
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Validate Technician Reassignment
            |--------------------------------------------------------------------------
            */

            if (
                isset($data['technician_id']) &&
                (int) $data['technician_id'] !== (int) $assignment->technician_id
            ) {
                if (!$assignment->isPending()) {
                    throw ValidationException::withMessages([
                        'technician_id' => [
                            'A technician can only be changed while an assignment is pending.',
                        ],
                    ]);
                }

                $technician = User::query()->findOrFail(
                    $data['technician_id']
                );

                $this->ensureTechnician($technician);
            }

            /*
            |--------------------------------------------------------------------------
            | Prepare Update Data
            |--------------------------------------------------------------------------
            */

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

            return $this->assignmentRepository->update(
                $assignment,
                $updateData
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGNMENT DELETION
    |--------------------------------------------------------------------------
    */

    /**
     * Delete a maintenance assignment.
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
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ACCEPT ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Accept a pending maintenance assignment.
     */
    public function accept(int $id): MaintenanceAssignment
    {
        return $this->changeStatus(
            $id,
            MaintenanceAssignment::STATUS_PENDING,
            [
                'status' => MaintenanceAssignment::STATUS_ACCEPTED,
                'accepted_at' => now(),
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | REJECT ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Reject a pending maintenance assignment.
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

            $updateData = [
                'status' => MaintenanceAssignment::STATUS_REJECTED,
                'rejected_at' => now(),
                'rejection_reason' => $data['rejection_reason'],
            ];

            if (!empty($data['work_notes'])) {
                $updateData['work_notes'] = $data['work_notes'];
            }

            return $this->assignmentRepository->update(
                $assignment,
                $updateData
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | START ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Start an accepted maintenance assignment.
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

            $updateData = [
                'status' => MaintenanceAssignment::STATUS_IN_PROGRESS,
                'started_at' => now(),
            ];

            if (!empty($data['work_notes'])) {
                $updateData['work_notes'] = $data['work_notes'];
            }

            return $this->assignmentRepository->update(
                $assignment,
                $updateData
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | HOLD ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Put an accepted or in-progress assignment on hold.
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

            $workNotes = $this->appendNote(
                $assignment->work_notes,
                'Hold reason: ' . $data['hold_reason']
            );

            if (!empty($data['work_notes'])) {
                $workNotes = $this->appendNote(
                    $workNotes,
                    $data['work_notes']
                );
            }

            return $this->assignmentRepository->update(
                $assignment,
                [
                    'status' => MaintenanceAssignment::STATUS_ON_HOLD,
                    'work_notes' => $workNotes,
                ]
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RESUME ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Resume an assignment that is on hold.
     */
    public function resume(int $id): MaintenanceAssignment
    {
        return $this->changeStatus(
            $id,
            MaintenanceAssignment::STATUS_ON_HOLD,
            [
                'status' => MaintenanceAssignment::STATUS_IN_PROGRESS,
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RESCHEDULE ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Reschedule a maintenance assignment.
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

            $updateData = [
                'scheduled_at' => $data['scheduled_at'],
            ];

            /*
             * The current model does not have a reschedule_reason column.
             * Preserve the reason in work_notes instead.
             */
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

            return $this->assignmentRepository->update(
                $assignment,
                $updateData
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETE ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Complete an accepted or in-progress assignment.
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

            $updateData = [
                'status' => MaintenanceAssignment::STATUS_COMPLETED,
                'completed_at' => now(),
                'actual_hours' => $data['actual_hours'],
                'actual_cost' => $data['actual_cost'],
            ];

            if (array_key_exists('work_notes', $data)) {
                $updateData['work_notes'] = $data['work_notes'];
            }

            return $this->assignmentRepository->update(
                $assignment,
                $updateData
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | CANCEL ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Cancel an active maintenance assignment.
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

            $updateData = [
                'status' => MaintenanceAssignment::STATUS_CANCELLED,
                'cancelled_at' => now(),
                'cancellation_reason' => $data['cancellation_reason'],
            ];

            if (!empty($data['work_notes'])) {
                $updateData['work_notes'] = $data['work_notes'];
            }

            return $this->assignmentRepository->update(
                $assignment,
                $updateData
            );
        });
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
        return $this->assignmentRepository->hasActiveAssignment(
            $maintenanceRequestId
        );
    }

    /**
     * Determine whether a technician has an active assignment
     * for a particular maintenance request.
     */
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

    /**
     * Determine whether a technician has any assignments.
     */
    public function technicianHasAssignments(
        int $technicianId
    ): bool {
        return $this->assignmentRepository->technicianHasAssignments(
            $technicianId
        );
    }

    /**
     * Count active assignments belonging to a technician.
     */
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

    /**
     * Retrieve overall maintenance assignment statistics.
     */
    public function getStatistics(
        array $filters = []
    ): array {
        return $this->assignmentRepository->getStatistics($filters);
    }

    /**
     * Retrieve assignment statistics for a specific technician.
     */
    public function getTechnicianStatistics(
        int $technicianId
    ): array {
        return $this->assignmentRepository->getTechnicianStatistics(
            $technicianId
        );
    }

    /**
     * Count assignments by status.
     */
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

    /**
     * Count all maintenance assignments.
     */
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
     * Change an assignment status after verifying its current status.
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

            return $this->assignmentRepository->update(
                $assignment,
                $updateData
            );
        });
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
     * Ensure the supplied user is a technician.
     */
    private function ensureTechnician(User $technician): void
    {
        if (!$technician->hasRole('technician')) {
            throw ValidationException::withMessages([
                'technician_id' => [
                    'The selected user is not registered as a technician.',
                ],
            ]);
        }

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
    }

    /**
     * Validate an assignment status against supported statuses.
     */
    private function validateStatus(string $status): void
    {
        if (!array_key_exists($status, MaintenanceAssignment::statuses())) {
            throw ValidationException::withMessages([
                'status' => [
                    'The selected maintenance assignment status is invalid.',
                ],
            ]);
        }
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

        return trim($existingNotes) . PHP_EOL . PHP_EOL . $newNote;
    }
}
