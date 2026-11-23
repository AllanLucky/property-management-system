<?php

namespace App\Services;

use App\Models\MaintenanceAssignment;
use App\Models\MaintenanceRequest;
use App\Models\MaintenanceUpdate;
use App\Repositories\Interfaces\OngoingMaintenanceRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OngoingMaintenanceService
{
    public function __construct(
        protected OngoingMaintenanceRepositoryInterface $repository
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all ongoing maintenance requests.
     */
    public function getAllOngoing(): Collection
    {
        return $this->repository->all();
    }

    /**
     * Retrieve paginated ongoing maintenance requests.
     */
    public function getPaginatedOngoing(int $perPage = 20): LengthAwarePaginator
    {
        return $this->repository->paginate($perPage);
    }

    /**
     * Filter ongoing maintenance requests.
     */
    public function filterOngoing(
        array $filters,
        int $perPage = 20
    ): LengthAwarePaginator {
        return $this->repository->filter($filters, $perPage);
    }

    /**
     * Retrieve a specific ongoing maintenance request.
     */
    public function getOngoingById(int $id): MaintenanceRequest
    {
        $maintenance = $this->repository->find($id);

        if (!$maintenance) {
            throw (new ModelNotFoundException())
                ->setModel(MaintenanceRequest::class, [$id]);
        }

        return $maintenance;
    }

    /**
     * Retrieve ongoing maintenance statistics.
     */
    public function getStatistics(array $filters = []): array
    {
        return $this->repository->statistics($filters);
    }

    /**
     * Retrieve assigned maintenance requests.
     */
    public function getAssigned(): Collection
    {
        return $this->repository->assigned();
    }

    /**
     * Retrieve maintenance requests currently in progress.
     */
    public function getInProgress(): Collection
    {
        return $this->repository->inProgress();
    }

    /**
     * Retrieve maintenance requests currently on hold.
     */
    public function getOnHold(): Collection
    {
        return $this->repository->onHold();
    }

    /**
     * Retrieve overdue maintenance requests.
     */
    public function getOverdue(): Collection
    {
        return $this->repository->overdue();
    }

    /**
     * Retrieve maintenance requests assigned to a technician.
     */
    public function getByTechnician(int $technicianId): Collection
    {
        return $this->repository->findByTechnician($technicianId);
    }

    /**
     * Retrieve maintenance requests for a property.
     */
    public function getByProperty(int $propertyId): Collection
    {
        return $this->repository->findByProperty($propertyId);
    }

    /**
     * Retrieve maintenance requests for a unit.
     */
    public function getByUnit(int $unitId): Collection
    {
        return $this->repository->findByUnit($unitId);
    }

    /**
     * Retrieve maintenance requests for a category.
     */
    public function getByCategory(int $categoryId): Collection
    {
        return $this->repository->findByCategory($categoryId);
    }

    /*
    |--------------------------------------------------------------------------
    | START MAINTENANCE
    |--------------------------------------------------------------------------
    */

    /**
     * Start an assigned maintenance job.
     *
     * The technician must have accepted the assignment.
     */
    public function startMaintenance(
        int $maintenanceRequestId,
        int $technicianId,
        int $actorId
    ): MaintenanceRequest {
        return DB::transaction(function () use (
            $maintenanceRequestId,
            $technicianId,
            $actorId
        ) {
            $maintenance = $this->getLockedRequest($maintenanceRequestId);

            if (!$maintenance->isAssigned()) {
                throw ValidationException::withMessages([
                    'status' => 'Only assigned maintenance requests can be started.',
                ]);
            }

            $assignment = $this->getTechnicianAssignment(
                $maintenance,
                $technicianId
            );

            if (!$assignment->isAccepted()) {
                throw ValidationException::withMessages([
                    'assignment' => 'The technician must accept the assignment before starting work.',
                ]);
            }

            $previousStatus = $maintenance->status;

            if (!$maintenance->markAsInProgress()) {
                throw ValidationException::withMessages([
                    'status' => 'Unable to start this maintenance request.',
                ]);
            }

            $assignment->update([
                'status' => MaintenanceAssignment::STATUS_IN_PROGRESS,
                'started_at' => $assignment->started_at ?? now(),
            ]);

            $this->recordUpdate(
                maintenance: $maintenance,
                userId: $actorId,
                type: MaintenanceUpdate::TYPE_STATUS_CHANGE,
                title: 'Maintenance Started',
                description: 'The technician started working on this maintenance request.',
                previousStatus: $previousStatus,
                newStatus: MaintenanceRequest::STATUS_IN_PROGRESS,
                assignmentId: $assignment->id
            );

            return $this->refreshMaintenance($maintenance->id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PROGRESS
    |--------------------------------------------------------------------------
    */

    /**
     * Record maintenance progress.
     *
     * Progress history is stored in MaintenanceUpdate.
     * Actual hours are stored in MaintenanceAssignment.
     */
    public function updateProgress(
        int $maintenanceRequestId,
        int $technicianId,
        int $actorId,
        array $data
    ): MaintenanceRequest {
        return DB::transaction(function () use (
            $maintenanceRequestId,
            $technicianId,
            $actorId,
            $data
        ) {
            $maintenance = $this->getLockedRequest($maintenanceRequestId);

            if (!$maintenance->isInProgress()) {
                throw ValidationException::withMessages([
                    'status' => 'Progress can only be updated when maintenance is in progress.',
                ]);
            }

            $assignment = $this->getTechnicianAssignment(
                $maintenance,
                $technicianId
            );

            if (!$assignment->isInProgress()) {
                throw ValidationException::withMessages([
                    'assignment' => 'The technician must have an assignment that is currently in progress.',
                ]);
            }

            $progress = (int) $data['progress_percentage'];

            // Do not allow progress to move backwards.
            $latestProgress = $maintenance->updates()
                ->where('type', MaintenanceUpdate::TYPE_PROGRESS)
                ->max('progress_percentage');

            if (
                $latestProgress !== null &&
                $progress < (int) $latestProgress
            ) {
                throw ValidationException::withMessages([
                    'progress_percentage' => 'Progress cannot be lower than the previously recorded progress.',
                ]);
            }

            // Do not allow progress to mark work as completed.
            if ($progress >= 100) {
                throw ValidationException::withMessages([
                    'progress_percentage' => 'Use the complete maintenance action to record 100% completion.',
                ]);
            }

            if (array_key_exists('actual_hours', $data)) {
                $assignment->update([
                    'actual_hours' => $data['actual_hours'],
                ]);
            }

            $metadata = $data['metadata'] ?? [];

            if (!empty($data['notes'])) {
                $metadata['additional_notes'] = $data['notes'];
            }

            $this->recordUpdate(
                maintenance: $maintenance,
                userId: $actorId,
                type: MaintenanceUpdate::TYPE_PROGRESS,
                title: 'Maintenance Progress Updated',
                description: $data['work_notes'],
                progressPercentage: $progress,
                assignmentId: $assignment->id,
                metadata: $metadata
            );

            return $this->refreshMaintenance($maintenance->id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | PUT MAINTENANCE ON HOLD
    |--------------------------------------------------------------------------
    */

    /**
     * Temporarily suspend ongoing maintenance work.
     */
    public function putOnHold(
        int $maintenanceRequestId,
        int $technicianId,
        int $actorId,
        ?string $reason = null
    ): MaintenanceRequest {
        return DB::transaction(function () use (
            $maintenanceRequestId,
            $technicianId,
            $actorId,
            $reason
        ) {
            $maintenance = $this->getLockedRequest($maintenanceRequestId);

            if (!$maintenance->isInProgress()) {
                throw ValidationException::withMessages([
                    'status' => 'Only maintenance that is in progress can be put on hold.',
                ]);
            }

            $assignment = $this->getTechnicianAssignment(
                $maintenance,
                $technicianId
            );

            if (!$assignment->isInProgress()) {
                throw ValidationException::withMessages([
                    'assignment' => 'Only an assignment that is in progress can be put on hold.',
                ]);
            }

            $previousStatus = $maintenance->status;

            if (!$maintenance->putOnHold()) {
                throw ValidationException::withMessages([
                    'status' => 'Unable to put this maintenance request on hold.',
                ]);
            }

            $assignment->update([
                'status' => MaintenanceAssignment::STATUS_ON_HOLD,
            ]);

            $this->recordUpdate(
                maintenance: $maintenance,
                userId: $actorId,
                type: MaintenanceUpdate::TYPE_STATUS_CHANGE,
                title: 'Maintenance Put On Hold',
                description: $reason ?: 'Maintenance work has been temporarily suspended.',
                previousStatus: $previousStatus,
                newStatus: MaintenanceRequest::STATUS_ON_HOLD,
                assignmentId: $assignment->id
            );

            return $this->refreshMaintenance($maintenance->id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RESUME MAINTENANCE
    |--------------------------------------------------------------------------
    */

    /**
     * Resume maintenance work that was put on hold.
     */
    public function resumeMaintenance(
        int $maintenanceRequestId,
        int $technicianId,
        int $actorId
    ): MaintenanceRequest {
        return DB::transaction(function () use (
            $maintenanceRequestId,
            $technicianId,
            $actorId
        ) {
            $maintenance = $this->getLockedRequest($maintenanceRequestId);

            if (!$maintenance->isOnHold()) {
                throw ValidationException::withMessages([
                    'status' => 'Only maintenance requests on hold can be resumed.',
                ]);
            }

            $assignment = $this->getTechnicianAssignment(
                $maintenance,
                $technicianId
            );

            if (!$assignment->isOnHold()) {
                throw ValidationException::withMessages([
                    'assignment' => 'The technician assignment must be on hold before it can be resumed.',
                ]);
            }

            $previousStatus = $maintenance->status;

            if (!$maintenance->resume()) {
                throw ValidationException::withMessages([
                    'status' => 'Unable to resume this maintenance request.',
                ]);
            }

            $assignment->update([
                'status' => MaintenanceAssignment::STATUS_IN_PROGRESS,
            ]);

            $this->recordUpdate(
                maintenance: $maintenance,
                userId: $actorId,
                type: MaintenanceUpdate::TYPE_STATUS_CHANGE,
                title: 'Maintenance Resumed',
                description: 'Maintenance work has resumed.',
                previousStatus: $previousStatus,
                newStatus: MaintenanceRequest::STATUS_IN_PROGRESS,
                assignmentId: $assignment->id
            );

            return $this->refreshMaintenance($maintenance->id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETE MAINTENANCE
    |--------------------------------------------------------------------------
    */

    /**
     * Complete a technician's assignment and, when all active
     * assignments are completed, complete the overall request.
     *
     * Already-completed assignments can be recognized when the
     * overall request still needs finalization.
     *
     * Only required checklist items must be completed.
     */
    public function completeMaintenance(
        int $maintenanceRequestId,
        array $data,
        int $actorId,
        ?int $technicianId = null
    ): MaintenanceRequest {
        return DB::transaction(function () use (
            $maintenanceRequestId,
            $data,
            $actorId,
            $technicianId
        ) {
            $maintenance = $this->getLockedRequest($maintenanceRequestId);

            if (!$maintenance->isInProgress()) {
                throw ValidationException::withMessages([
                    'status' => 'Only maintenance that is in progress can be completed.',
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | VALIDATE COMPLETION NOTES
            |--------------------------------------------------------------------------
            */

            $completionNotes = trim($data['completion_notes'] ?? '');

            if ($completionNotes === '') {
                throw ValidationException::withMessages([
                    'completion_notes' => [
                        'Please provide completion notes before completing the maintenance request.',
                    ],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | VALIDATE REQUIRED CHECKLIST ITEMS
            |--------------------------------------------------------------------------
            */

            $hasIncompleteRequiredChecklists = $maintenance
                ->checklists()
                ->where('is_required', true)
                ->where('is_completed', false)
                ->exists();

            if ($hasIncompleteRequiredChecklists) {
                throw ValidationException::withMessages([
                    'checklists' => [
                        'Complete all required maintenance checklist items before completing this request.',
                    ],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | COMPLETE OR RECOGNIZE TECHNICIAN ASSIGNMENT
            |--------------------------------------------------------------------------
            */

            $assignment = null;
            $assignmentWasAlreadyCompleted = false;

            if ($technicianId !== null) {

                /*
                 * First look for an active assignment belonging
                 * to this technician.
                 */
                $assignment = MaintenanceAssignment::query()
                    ->where('maintenance_request_id', $maintenance->id)
                    ->where('technician_id', $technicianId)
                    ->whereIn('status', [
                        MaintenanceAssignment::STATUS_ACCEPTED,
                        MaintenanceAssignment::STATUS_IN_PROGRESS,
                        MaintenanceAssignment::STATUS_ON_HOLD,
                    ])
                    ->orderByDesc('id')
                    ->lockForUpdate()
                    ->first();

                /*
                 * If no active assignment exists, check whether
                 * this technician already completed an assignment.
                 *
                 * This supports finalizing requests where the
                 * assignment was completed in an earlier API call.
                 */
                if (!$assignment) {
                    $assignment = MaintenanceAssignment::query()
                        ->where('maintenance_request_id', $maintenance->id)
                        ->where('technician_id', $technicianId)
                        ->where(
                            'status',
                            MaintenanceAssignment::STATUS_COMPLETED
                        )
                        ->orderByDesc('id')
                        ->lockForUpdate()
                        ->first();

                    if (!$assignment) {
                        throw ValidationException::withMessages([
                            'assignment' => [
                                'No active or completed maintenance assignment was found for this technician.',
                            ],
                        ]);
                    }

                    $assignmentWasAlreadyCompleted = true;
                }

                /*
                 * Only an assignment currently in progress
                 * can be newly completed by a technician.
                 */
                if (!$assignmentWasAlreadyCompleted) {
                    if (!$assignment->isInProgress()) {
                        throw ValidationException::withMessages([
                            'assignment' => [
                                'The technician assignment must be in progress before it can be completed.',
                            ],
                        ]);
                    }

                    $assignment->update([
                        'status' => MaintenanceAssignment::STATUS_COMPLETED,
                        'completed_at' => now(),
                        'actual_hours' => $data['actual_hours']
                            ?? $assignment->actual_hours,
                    ]);
                }

                /*
                 * Repair an existing technician completion history
                 * record when it was previously saved without the
                 * maintenance_assignment_id.
                 *
                 * Otherwise, create the technician completion record
                 * only when it has not already been recorded.
                 */
                $this->recordTechnicianCompletion(
                    maintenance: $maintenance,
                    assignment: $assignment,
                    actorId: $actorId,
                    completionNotes: $completionNotes,
                    wasAlreadyCompleted: $assignmentWasAlreadyCompleted
                );

            } else {

                /*
                |--------------------------------------------------------------------------
                | MANAGEMENT COMPLETES ACTIVE ASSIGNMENTS
                |--------------------------------------------------------------------------
                */

                $activeAssignments = $maintenance->assignments()
                    ->whereIn('status', [
                        MaintenanceAssignment::STATUS_PENDING,
                        MaintenanceAssignment::STATUS_ACCEPTED,
                        MaintenanceAssignment::STATUS_IN_PROGRESS,
                        MaintenanceAssignment::STATUS_ON_HOLD,
                    ])
                    ->lockForUpdate()
                    ->get();

                foreach ($activeAssignments as $activeAssignment) {
                    $activeAssignment->update([
                        'status' => MaintenanceAssignment::STATUS_COMPLETED,
                        'completed_at' => now(),
                    ]);
                }
            }

            /*
            |--------------------------------------------------------------------------
            | CHECK REMAINING ACTIVE ASSIGNMENTS
            |--------------------------------------------------------------------------
            */

            $hasActiveAssignments = $maintenance->assignments()
                ->whereIn('status', [
                    MaintenanceAssignment::STATUS_PENDING,
                    MaintenanceAssignment::STATUS_ACCEPTED,
                    MaintenanceAssignment::STATUS_IN_PROGRESS,
                    MaintenanceAssignment::STATUS_ON_HOLD,
                ])
                ->exists();

            /*
            |--------------------------------------------------------------------------
            | KEEP REQUEST OPEN IF OTHER ASSIGNMENTS REMAIN
            |--------------------------------------------------------------------------
            */

            if ($hasActiveAssignments) {
                return $this->refreshMaintenance($maintenance->id);
            }

            /*
            |--------------------------------------------------------------------------
            | COMPLETE OVERALL MAINTENANCE REQUEST
            |--------------------------------------------------------------------------
            */

            $previousStatus = $maintenance->status;

            $totalCost = $data['total_cost']
                ?? $maintenance->total_cost;

            $maintenance->update([
                'status' => MaintenanceRequest::STATUS_COMPLETED,
                'completed_at' => now(),
                'completion_notes' => $completionNotes,
                'total_cost' => $totalCost,
            ]);

            /*
            |--------------------------------------------------------------------------
            | RECORD OVERALL COMPLETION HISTORY
            |--------------------------------------------------------------------------
            */

            $this->recordUpdate(
                maintenance: $maintenance,
                userId: $actorId,
                type: MaintenanceUpdate::TYPE_COMPLETION,
                title: 'Maintenance Completed',
                description: $completionNotes,
                previousStatus: $previousStatus,
                newStatus: MaintenanceRequest::STATUS_COMPLETED,
                assignmentId: $assignment?->id,
                metadata: [
                    'total_cost' => $totalCost,
                    'overall_maintenance_completed' => true,
                    'assignment_completed' => $assignment !== null,
                    'assignment_was_already_completed' => $assignmentWasAlreadyCompleted,
                ]
            );

            return $this->refreshMaintenance($maintenance->id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve and lock an ongoing maintenance request.
     */
    protected function getLockedRequest(int $id): MaintenanceRequest
    {
        $maintenance = MaintenanceRequest::query()
            ->whereIn('status', [
                MaintenanceRequest::STATUS_ASSIGNED,
                MaintenanceRequest::STATUS_IN_PROGRESS,
                MaintenanceRequest::STATUS_ON_HOLD,
            ])
            ->lockForUpdate()
            ->find($id);

        if (!$maintenance) {
            throw (new ModelNotFoundException())
                ->setModel(MaintenanceRequest::class, [$id]);
        }

        return $maintenance;
    }

    /**
     * Retrieve an active assignment belonging to a technician.
     */
    protected function getTechnicianAssignment(
        MaintenanceRequest $maintenance,
        int $technicianId
    ): MaintenanceAssignment {
        $assignment = MaintenanceAssignment::query()
            ->where('maintenance_request_id', $maintenance->id)
            ->where('technician_id', $technicianId)
            ->whereIn('status', [
                MaintenanceAssignment::STATUS_ACCEPTED,
                MaintenanceAssignment::STATUS_IN_PROGRESS,
                MaintenanceAssignment::STATUS_ON_HOLD,
            ])
            ->orderByDesc('id')
            ->lockForUpdate()
            ->first();

        if (!$assignment) {
            throw ValidationException::withMessages([
                'assignment' => [
                    'No active maintenance assignment was found for this technician.',
                ],
            ]);
        }

        return $assignment;
    }

    /**
     * Record technician assignment completion.
     *
     * Repairs the previous history record if it was saved
     * without the correct assignment relationship.
     */
    protected function recordTechnicianCompletion(
        MaintenanceRequest $maintenance,
        MaintenanceAssignment $assignment,
        int $actorId,
        string $completionNotes,
        bool $wasAlreadyCompleted
    ): void {
        $existingCompletion = $maintenance->updates()
            ->where(
                'type',
                MaintenanceUpdate::TYPE_COMPLETION
            )
            ->where(
                'title',
                'Technician Assignment Completed'
            )
            ->where('user_id', $actorId)
            ->whereNull('maintenance_assignment_id')
            ->latest('id')
            ->lockForUpdate()
            ->first();

        if ($existingCompletion) {
            /*
             * The earlier completion record exists, but its
             * assignment foreign key was missing.
             *
             * Repair the relationship instead of creating
             * another technician completion history record.
             */
            $existingCompletion->update([
                'maintenance_assignment_id' => $assignment->id,
                'description' => $existingCompletion->description
                    ?: $completionNotes,
            ]);

            return;
        }

        /*
         * If the assignment was already completed and its
         * completion history is already linked, do not create
         * another technician completion record.
         */
        if ($wasAlreadyCompleted) {
            $linkedCompletionExists = $maintenance->updates()
                ->where(
                    'type',
                    MaintenanceUpdate::TYPE_COMPLETION
                )
                ->where(
                    'title',
                    'Technician Assignment Completed'
                )
                ->where(
                    'maintenance_assignment_id',
                    $assignment->id
                )
                ->exists();

            if ($linkedCompletionExists) {
                return;
            }
        }

        $this->recordUpdate(
            maintenance: $maintenance,
            userId: $actorId,
            type: MaintenanceUpdate::TYPE_COMPLETION,
            title: 'Technician Assignment Completed',
            description: $completionNotes,
            assignmentId: $assignment->id,
            metadata: [
                'assignment_completed' => true,
                'overall_maintenance_completed' => false,
            ]
        );
    }

    /**
     * Create a maintenance activity/history record.
     *
     * IMPORTANT:
     * The database column is maintenance_assignment_id,
     * not assignment_id.
     *
     * The relationship automatically supplies
     * maintenance_request_id.
     */
    protected function recordUpdate(
        MaintenanceRequest $maintenance,
        int $userId,
        string $type,
        string $title,
        string $description,
        ?string $previousStatus = null,
        ?string $newStatus = null,
        ?int $progressPercentage = null,
        ?int $assignmentId = null,
        array $metadata = []
    ): MaintenanceUpdate {
        return $maintenance->updates()->create([
            'maintenance_assignment_id' => $assignmentId,
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'description' => $description,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'progress_percentage' => $progressPercentage,
            'is_internal' => false,
            'is_visible_to_tenant' => true,
            'metadata' => $metadata ?: null,
        ]);
    }

    /**
     * Refresh a maintenance request with its related records.
     */
    protected function refreshMaintenance(int $id): MaintenanceRequest
    {
        return MaintenanceRequest::query()
            ->with([
                'property',
                'apartment',
                'unit',
                'tenant',
                'category',
                'latestAssignment.technician',
                'assignments.technician',
                'updates.user',
                'attachments',
                'expenses',
                'checklists',
            ])
            ->findOrFail($id);
    }
}
