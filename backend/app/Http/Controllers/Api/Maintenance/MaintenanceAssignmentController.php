<?php

namespace App\Http\Controllers\Api\Maintenance;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\MaintenanceAssignment\CancelMaintenanceAssignmentRequest;
use App\Http\Requests\MaintenanceAssignment\CompleteMaintenanceAssignmentRequest;
use App\Http\Requests\MaintenanceAssignment\HoldMaintenanceAssignmentRequest;
use App\Http\Requests\MaintenanceAssignment\RejectMaintenanceAssignmentRequest;
use App\Http\Requests\MaintenanceAssignment\RescheduleMaintenanceAssignmentRequest;
use App\Http\Requests\MaintenanceAssignment\StartMaintenanceAssignmentRequest;
use App\Http\Requests\MaintenanceAssignment\StoreMaintenanceAssignmentRequest;
use App\Http\Requests\MaintenanceAssignment\UpdateMaintenanceAssignmentRequest;
use App\Http\Resources\MaintenanceAssignmentResource;
use App\Models\MaintenanceAssignment;
use App\Services\MaintenanceAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Throwable;
use Illuminate\Support\Facades\Log;

class MaintenanceAssignmentController extends Controller
{
    /**
     * Maintenance assignment controller.
     */
    public function __construct(
        protected MaintenanceAssignmentService $maintenanceAssignmentService
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | BASIC RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve paginated maintenance assignments.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'search',
                'status',
                'technician_id',
                'maintenance_request_id',
                'assigned_by',
                'date_from',
                'date_to',
                'assigned_from',
                'assigned_to',
                'scheduled_from',
                'scheduled_to',
                'sort_by',
                'sort_direction',
            ]);

            $perPage = min(
                max((int) $request->input('per_page', 15), 1),
                100
            );

            $assignments = $this->maintenanceAssignmentService->paginate(
                $perPage,
                $filters
            );

            return $this->respondWithPaginatedAssignments(
                $assignments,
                'Maintenance assignments retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to retrieve maintenance assignments.',
                $e
            );
        }
    }

    /**
     * Retrieve a single maintenance assignment.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $assignment = $this->maintenanceAssignmentService
                ->findWithRelationsOrFail($id);

            return $this->respondWithAssignment(
                $assignment,
                'Maintenance assignment retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to retrieve maintenance assignment.',
                $e,
                $id
            );
        }
    }

    /**
     * Retrieve maintenance assignment statistics.
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'technician_id',
                'maintenance_request_id',
                'assigned_by',
                'date_from',
                'date_to',
            ]);

            $statistics = $this->maintenanceAssignmentService
                ->getStatistics($filters);

            return ApiResponse::success(
                $statistics,
                'Maintenance assignment statistics retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to retrieve maintenance assignment statistics.',
                $e
            );
        }
    }

    /**
     * Retrieve statistics for a specific technician.
     */
    public function technicianStatistics(
        int $technicianId,
        Request $request
    ): JsonResponse {
        try {
            $filters = $request->only([
                'date_from',
                'date_to',
            ]);

            $statistics = $this->maintenanceAssignmentService
                ->getTechnicianStatistics($technicianId, $filters);

            return ApiResponse::success(
                $statistics,
                'Technician assignment statistics retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to retrieve technician assignment statistics.',
                $e,
                $technicianId
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve assignments belonging to a maintenance request.
     */
    public function byMaintenanceRequest(int $maintenanceRequestId): JsonResponse
    {
        try {
            $assignments = $this->maintenanceAssignmentService
                ->getByMaintenanceRequest($maintenanceRequestId);

            return $this->respondWithCollection(
                $assignments,
                'Maintenance request assignments retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to retrieve maintenance request assignments.',
                $e,
                $maintenanceRequestId
            );
        }
    }

    /**
     * Retrieve assignments belonging to a technician.
     */
    public function byTechnician(
        int $technicianId,
        Request $request
    ): JsonResponse {
        try {
            $perPage = min(
                max((int) $request->input('per_page', 15), 1),
                100
            );

            $filters = $request->only([
                'status',
                'date_from',
                'date_to',
                'scheduled_from',
                'scheduled_to',
                'sort_by',
                'sort_direction',
            ]);

            $assignments = $this->maintenanceAssignmentService
                ->paginateByTechnician(
                    $technicianId,
                    $perPage,
                    $filters
                );

            return $this->respondWithPaginatedAssignments(
                $assignments,
                'Technician assignments retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to retrieve technician assignments.',
                $e,
                $technicianId
            );
        }
    }

    /**
     * Retrieve assignments created by a particular user.
     */
    public function byAssigner(int $assignerId): JsonResponse
    {
        try {
            $assignments = $this->maintenanceAssignmentService
                ->getByAssigner($assignerId);

            return $this->respondWithCollection(
                $assignments,
                'Assignments created by this user retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to retrieve assignments created by this user.',
                $e,
                $assignerId
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve assignments by status.
     */
    public function byStatus(
        string $status,
        Request $request
    ): JsonResponse {
        try {
            $perPage = min(
                max((int) $request->input('per_page', 15), 1),
                100
            );

            $filters = $request->only([
                'technician_id',
                'maintenance_request_id',
                'assigned_by',
                'date_from',
                'date_to',
            ]);

            $assignments = $this->maintenanceAssignmentService
                ->paginateByStatus(
                    $status,
                    $perPage,
                    $filters
                );

            return $this->respondWithPaginatedAssignments(
                $assignments,
                ucfirst(str_replace('_', ' ', $status))
                    . ' maintenance assignments retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to retrieve maintenance assignments by status.',
                $e
            );
        }
    }

    /**
     * Retrieve pending assignments.
     */
    public function pending(Request $request): JsonResponse
    {
        return $this->statusCollection(
            MaintenanceAssignment::STATUS_PENDING,
            'Pending maintenance assignments retrieved successfully.'
        );
    }

    /**
     * Retrieve accepted assignments.
     */
    public function accepted(Request $request): JsonResponse
    {
        return $this->statusCollection(
            MaintenanceAssignment::STATUS_ACCEPTED,
            'Accepted maintenance assignments retrieved successfully.'
        );
    }

    /**
     * Retrieve rejected assignments.
     */
    public function rejected(Request $request): JsonResponse
    {
        return $this->statusCollection(
            MaintenanceAssignment::STATUS_REJECTED,
            'Rejected maintenance assignments retrieved successfully.'
        );
    }

    /**
     * Retrieve in-progress assignments.
     */
    public function inProgress(Request $request): JsonResponse
    {
        return $this->statusCollection(
            MaintenanceAssignment::STATUS_IN_PROGRESS,
            'In-progress maintenance assignments retrieved successfully.'
        );
    }

    /**
     * Retrieve assignments on hold.
     */
    public function onHold(Request $request): JsonResponse
    {
        return $this->statusCollection(
            MaintenanceAssignment::STATUS_ON_HOLD,
            'Maintenance assignments on hold retrieved successfully.'
        );
    }

    /**
     * Retrieve completed assignments.
     */
    public function completed(Request $request): JsonResponse
    {
        return $this->statusCollection(
            MaintenanceAssignment::STATUS_COMPLETED,
            'Completed maintenance assignments retrieved successfully.'
        );
    }

    /**
     * Retrieve cancelled assignments.
     */
    public function cancelled(Request $request): JsonResponse
    {
        return $this->statusCollection(
            MaintenanceAssignment::STATUS_CANCELLED,
            'Cancelled maintenance assignments retrieved successfully.'
        );
    }

    /**
     * Retrieve overdue assignments.
     */
    public function overdue(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'technician_id',
                'maintenance_request_id',
                'assigned_by',
            ]);

            $assignments = $this->maintenanceAssignmentService
                ->getOverdue($filters);

            return $this->respondWithCollection(
                $assignments,
                'Overdue maintenance assignments retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to retrieve overdue maintenance assignments.',
                $e
            );
        }
    }

    /**
     * Retrieve scheduled assignments.
     */
    public function scheduled(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'technician_id',
                'maintenance_request_id',
                'assigned_by',
                'scheduled_from',
                'scheduled_to',
            ]);

            $assignments = $this->maintenanceAssignmentService
                ->getScheduled($filters);

            return $this->respondWithCollection(
                $assignments,
                'Scheduled maintenance assignments retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to retrieve scheduled maintenance assignments.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    /**
     * Create a maintenance assignment.
     */
    public function store(
        StoreMaintenanceAssignmentRequest $request
    ): JsonResponse {
        try {
            $assignment = $this->maintenanceAssignmentService->create(
                $request->validated()
            );

            return ApiResponse::created(
                MaintenanceAssignmentResource::make($assignment)
                    ->resolve($request),
                'Maintenance assignment created successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to create maintenance assignment.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    /**
     * Update a maintenance assignment.
     */
    public function update(
        UpdateMaintenanceAssignmentRequest $request,
        int $id
    ): JsonResponse {
        try {
            $assignment = $this->maintenanceAssignmentService->update(
                $id,
                $request->validated()
            );

            return ApiResponse::updated(
                MaintenanceAssignmentResource::make($assignment)
                    ->resolve($request),
                'Maintenance assignment updated successfully.'
            );

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ApiResponse::notFound(
                'Maintenance assignment not found.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to update maintenance assignment.',
                $e,
                $id
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Delete a maintenance assignment.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->maintenanceAssignmentService->delete($id);

            return ApiResponse::deleted(
                ['id' => $id],
                'Maintenance assignment deleted successfully.'
            );

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ApiResponse::notFound(
                'Maintenance assignment not found.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to delete maintenance assignment.',
                $e,
                $id
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ACCEPT ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Accept a pending maintenance assignment.
     */
    public function accept(int $id): JsonResponse
    {
        try {
            $assignment = $this->maintenanceAssignmentService->accept($id);

            return $this->respondWithAssignment(
                $assignment,
                'Maintenance assignment accepted successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to accept maintenance assignment.',
                $e,
                $id
            );
        }
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
        RejectMaintenanceAssignmentRequest $request,
        int $id
    ): JsonResponse {
        try {
            $assignment = $this->maintenanceAssignmentService->reject(
                $id,
                $request->validated()
            );

            return $this->respondWithAssignment(
                $assignment,
                'Maintenance assignment rejected successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to reject maintenance assignment.',
                $e,
                $id
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | START WORK
    |--------------------------------------------------------------------------
    */

    /**
     * Start working on an accepted assignment.
     */
    public function start(
        StartMaintenanceAssignmentRequest $request,
        int $id
    ): JsonResponse {
        try {
            $assignment = $this->maintenanceAssignmentService->start(
                $id,
                $request->validated()
            );

            return $this->respondWithAssignment(
                $assignment,
                'Maintenance assignment work started successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to start maintenance assignment.',
                $e,
                $id
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | HOLD WORK
    |--------------------------------------------------------------------------
    */

    /**
     * Put an assignment on hold.
     */
    public function hold(
        HoldMaintenanceAssignmentRequest $request,
        int $id
    ): JsonResponse {
        try {
            $assignment = $this->maintenanceAssignmentService->hold(
                $id,
                $request->validated()
            );

            return $this->respondWithAssignment(
                $assignment,
                'Maintenance assignment placed on hold successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to place maintenance assignment on hold.',
                $e,
                $id
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESUME WORK
    |--------------------------------------------------------------------------
    */

    /**
     * Resume an assignment that is on hold.
     */
    public function resume(int $id): JsonResponse
    {
        try {
            $assignment = $this->maintenanceAssignmentService->resume($id);

            return $this->respondWithAssignment(
                $assignment,
                'Maintenance assignment resumed successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to resume maintenance assignment.',
                $e,
                $id
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESCHEDULE
    |--------------------------------------------------------------------------
    */

    /**
     * Reschedule a maintenance assignment.
     */
    public function reschedule(
        RescheduleMaintenanceAssignmentRequest $request,
        int $id
    ): JsonResponse {
        try {
            $assignment = $this->maintenanceAssignmentService->reschedule(
                $id,
                $request->validated()
            );

            return $this->respondWithAssignment(
                $assignment,
                'Maintenance assignment rescheduled successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to reschedule maintenance assignment.',
                $e,
                $id
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETE WORK
    |--------------------------------------------------------------------------
    */

    /**
     * Complete a maintenance assignment.
     */
    public function complete(
        CompleteMaintenanceAssignmentRequest $request,
        int $id
    ): JsonResponse {
        try {
            $assignment = $this->maintenanceAssignmentService->complete(
                $id,
                $request->validated()
            );

            return $this->respondWithAssignment(
                $assignment,
                'Maintenance assignment completed successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to complete maintenance assignment.',
                $e,
                $id
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CANCEL ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Cancel a maintenance assignment.
     */
    public function cancel(
        CancelMaintenanceAssignmentRequest $request,
        int $id
    ): JsonResponse {
        try {
            $assignment = $this->maintenanceAssignmentService->cancel(
                $id,
                $request->validated()
            );

            return $this->respondWithAssignment(
                $assignment,
                'Maintenance assignment cancelled successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to cancel maintenance assignment.',
                $e,
                $id
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE RESPONSE HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Return a single maintenance assignment resource.
     */
    private function respondWithAssignment(
        MaintenanceAssignment $assignment,
        string $message
    ): JsonResponse {
        return ApiResponse::success(
            MaintenanceAssignmentResource::make($assignment)
                ->resolve(request()),
            $message
        );
    }

    /**
     * Return a collection of maintenance assignment resources.
     */
    private function respondWithCollection(
        Collection $assignments,
        string $message
    ): JsonResponse {
        $data = MaintenanceAssignmentResource::collection(
            $assignments
        )->resolve(request());

        return ApiResponse::collection(
            $data,
            $message
        );
    }

    /**
     * Return a paginated collection of maintenance assignment resources.
     */
    private function respondWithPaginatedAssignments(
        LengthAwarePaginator $paginator,
        string $message
    ): JsonResponse {
        $data = MaintenanceAssignmentResource::collection(
            $paginator->getCollection()
        )->resolve(request());

        $resourcePaginator = new LengthAwarePaginator(
            $data,
            $paginator->total(),
            $paginator->perPage(),
            $paginator->currentPage(),
            [
                'path' => $paginator->path(),
                'query' => request()->query(),
            ]
        );

        return ApiResponse::paginated(
            $resourcePaginator,
            $message
        );
    }

    /**
     * Retrieve and return assignments for a specific status.
     */
    private function statusCollection(
        string $status,
        string $message
    ): JsonResponse {
        try {
            $assignments = $this->maintenanceAssignmentService
                ->getByStatus($status);

            return $this->respondWithCollection(
                $assignments,
                $message
            );

        } catch (Throwable $e) {
            return $this->handleException(
                'Failed to retrieve ' . $status . ' maintenance assignments.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | EXCEPTION HANDLING
    |--------------------------------------------------------------------------
    */

    /**
     * Handle controller exceptions consistently.
     */
    private function handleException(
        string $message,
        Throwable $exception,
        ?int $recordId = null
    ): JsonResponse {
        if (
            $exception instanceof
            \Illuminate\Database\Eloquent\ModelNotFoundException
        ) {
            return ApiResponse::notFound($message);
        }

        Log::error($message, [
            'record_id' => $recordId,
            'exception' => get_class($exception),
            'error' => $exception->getMessage(),
        ]);

        return ApiResponse::serverError(
            $message,
            config('app.debug')
                ? ['exception' => $exception->getMessage()]
                : null
        );
    }
}
