<?php

namespace App\Http\Controllers\Api\Maintenance;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Maintenance\CompleteMaintenanceRequest;
use App\Http\Requests\Maintenance\UpdateMaintenanceProgressRequest;
use App\Services\OngoingMaintenanceService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class OngoingMaintenanceController extends Controller
{
    /**
     * Ongoing maintenance service.
     */
    public function __construct(
        protected OngoingMaintenanceService $ongoingMaintenanceService
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve paginated ongoing maintenance requests.
     *
     * GET /api/ongoing-maintenance
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = min(
                max((int) $request->query('per_page', 15), 1),
                100
            );

            $maintenance = $this->ongoingMaintenanceService->filterOngoing(
                $request->query(),
                $perPage
            );

            return ApiResponse::paginated(
                $maintenance,
                'Ongoing maintenance retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve ongoing maintenance.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve ongoing maintenance statistics.
     *
     * GET /api/ongoing-maintenance/statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $statistics = $this->ongoingMaintenanceService->getStatistics(
                $request->query()
            );

            return ApiResponse::success(
                $statistics,
                'Ongoing maintenance statistics retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve ongoing maintenance statistics.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGNED MAINTENANCE
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve assigned maintenance requests.
     *
     * GET /api/ongoing-maintenance/assigned
     */
    public function assigned(): JsonResponse
    {
        try {
            $maintenance = $this->ongoingMaintenanceService->getAssigned();

            return ApiResponse::success(
                $maintenance,
                'Assigned maintenance retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve assigned maintenance.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | IN PROGRESS MAINTENANCE
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve maintenance currently in progress.
     *
     * GET /api/ongoing-maintenance/in-progress
     */
    public function inProgress(): JsonResponse
    {
        try {
            $maintenance = $this->ongoingMaintenanceService->getInProgress();

            return ApiResponse::success(
                $maintenance,
                'In-progress maintenance retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve in-progress maintenance.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ON HOLD MAINTENANCE
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve maintenance currently on hold.
     *
     * GET /api/ongoing-maintenance/on-hold
     */
    public function onHold(): JsonResponse
    {
        try {
            $maintenance = $this->ongoingMaintenanceService->getOnHold();

            return ApiResponse::success(
                $maintenance,
                'Maintenance on hold retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve maintenance on hold.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | OVERDUE MAINTENANCE
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve overdue maintenance requests.
     *
     * GET /api/ongoing-maintenance/overdue
     */
    public function overdue(): JsonResponse
    {
        try {
            $maintenance = $this->ongoingMaintenanceService->getOverdue();

            return ApiResponse::success(
                $maintenance,
                'Overdue maintenance retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve overdue maintenance.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TECHNICIAN MAINTENANCE
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve maintenance assigned to a technician.
     *
     * GET /api/ongoing-maintenance/technician/{technicianId}
     */
    public function byTechnician(int $technicianId): JsonResponse
    {
        try {
            $maintenance = $this->ongoingMaintenanceService->getByTechnician(
                $technicianId
            );

            return ApiResponse::success(
                $maintenance,
                'Technician maintenance retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve technician maintenance.'
            );
        }
    }

    /**
     * Retrieve maintenance assigned to the authenticated technician.
     *
     * GET /api/ongoing-maintenance/my-maintenance
     */
    public function myMaintenance(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return ApiResponse::unauthorized();
            }

            if (!$this->isTechnician($user)) {
                return ApiResponse::error(
                    'Only technicians can access their maintenance assignments.',
                    null,
                    403
                );
            }

            $maintenance = $this->ongoingMaintenanceService->getByTechnician(
                (int) $user->id
            );

            return ApiResponse::success(
                $maintenance,
                'Your ongoing maintenance retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve your ongoing maintenance.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY MAINTENANCE
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve ongoing maintenance for a property.
     *
     * GET /api/ongoing-maintenance/property/{propertyId}
     */
    public function byProperty(int $propertyId): JsonResponse
    {
        try {
            $maintenance = $this->ongoingMaintenanceService->getByProperty(
                $propertyId
            );

            return ApiResponse::success(
                $maintenance,
                'Property ongoing maintenance retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve property maintenance.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UNIT MAINTENANCE
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve ongoing maintenance for a unit.
     *
     * GET /api/ongoing-maintenance/unit/{unitId}
     */
    public function byUnit(int $unitId): JsonResponse
    {
        try {
            $maintenance = $this->ongoingMaintenanceService->getByUnit(
                $unitId
            );

            return ApiResponse::success(
                $maintenance,
                'Unit ongoing maintenance retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve unit maintenance.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORY MAINTENANCE
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve ongoing maintenance for a category.
     *
     * GET /api/ongoing-maintenance/category/{categoryId}
     */
    public function byCategory(int $categoryId): JsonResponse
    {
        try {
            $maintenance = $this->ongoingMaintenanceService->getByCategory(
                $categoryId
            );

            return ApiResponse::success(
                $maintenance,
                'Category ongoing maintenance retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve category maintenance.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve a specific ongoing maintenance request.
     *
     * GET /api/ongoing-maintenance/{id}
     */
    public function show(int $id): JsonResponse
    {
        try {
            $maintenance = $this->ongoingMaintenanceService->getOngoingById(
                $id
            );

            return ApiResponse::success(
                $maintenance,
                'Ongoing maintenance details retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve maintenance details.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | START MAINTENANCE
    |--------------------------------------------------------------------------
    */

    /**
     * Start an accepted maintenance assignment.
     *
     * POST /api/ongoing-maintenance/{id}/start
     */
    public function start(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return ApiResponse::unauthorized();
            }

            if (!$this->isTechnician($user)) {
                return ApiResponse::error(
                    'Only technicians can start maintenance assignments.',
                    null,
                    403
                );
            }

            $technicianId = (int) $user->id;

            // Diagnostic log to verify the authenticated technician.
            Log::info('Starting maintenance authentication check', [
                'maintenance_request_id' => $id,
                'authenticated_user_id' => $technicianId,
                'authenticated_user_email' => $user->email,
                'is_technician' => true,
            ]);

            $maintenance = $this->ongoingMaintenanceService->startMaintenance(
                $id,
                $technicianId,
                (int) $user->id
            );

            return ApiResponse::updated(
                $maintenance,
                'Maintenance started successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to start maintenance.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PROGRESS
    |--------------------------------------------------------------------------
    */

    /**
     * Update maintenance progress.
     *
     * POST /api/ongoing-maintenance/{id}/progress
     */
    public function updateProgress(
        UpdateMaintenanceProgressRequest $request,
        int $id
    ): JsonResponse {
        try {
            $user = $request->user();

            if (!$user) {
                return ApiResponse::unauthorized();
            }

            if (!$this->isTechnician($user)) {
                return ApiResponse::error(
                    'Only technicians can update maintenance progress.',
                    null,
                    403
                );
            }

            $maintenance = $this->ongoingMaintenanceService->updateProgress(
                $id,
                (int) $user->id,
                (int) $user->id,
                $request->validated()
            );

            return ApiResponse::updated(
                $maintenance,
                'Maintenance progress updated successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to update maintenance progress.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PUT ON HOLD
    |--------------------------------------------------------------------------
    */

    /**
     * Put maintenance work on hold.
     *
     * POST /api/ongoing-maintenance/{id}/hold
     */
    public function putOnHold(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return ApiResponse::unauthorized();
            }

            if (!$this->isTechnician($user)) {
                return ApiResponse::error(
                    'Only technicians can put maintenance on hold.',
                    null,
                    403
                );
            }

            $validated = $request->validate([
                'reason' => [
                    'nullable',
                    'string',
                    'max:2000',
                ],
            ]);

            $maintenance = $this->ongoingMaintenanceService->putOnHold(
                $id,
                (int) $user->id,
                (int) $user->id,
                $validated['reason'] ?? null
            );

            return ApiResponse::updated(
                $maintenance,
                'Maintenance put on hold successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to put maintenance on hold.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESUME MAINTENANCE
    |--------------------------------------------------------------------------
    */

    /**
     * Resume maintenance work.
     *
     * POST /api/ongoing-maintenance/{id}/resume
     */
    public function resume(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return ApiResponse::unauthorized();
            }

            if (!$this->isTechnician($user)) {
                return ApiResponse::error(
                    'Only technicians can resume maintenance.',
                    null,
                    403
                );
            }

            $maintenance = $this->ongoingMaintenanceService->resumeMaintenance(
                $id,
                (int) $user->id,
                (int) $user->id
            );

            return ApiResponse::updated(
                $maintenance,
                'Maintenance resumed successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to resume maintenance.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETE MAINTENANCE
    |--------------------------------------------------------------------------
    */

    /**
     * Complete maintenance work.
     *
     * POST /api/ongoing-maintenance/{id}/complete
     */
    public function complete(
        CompleteMaintenanceRequest $request,
        int $id
    ): JsonResponse {
        try {
            $user = $request->user();

            if (!$user) {
                return ApiResponse::unauthorized();
            }

            /*
             * Technicians complete their own assignments.
             * Management users may complete the overall request,
             * subject to the application's route permissions.
             */
            $technicianId = null;

            if ($this->isTechnician($user)) {
                $technicianId = (int) $user->id;
            }

            $maintenance = $this->ongoingMaintenanceService->completeMaintenance(
                $id,
                $request->validated(),
                (int) $user->id,
                $technicianId
            );

            return ApiResponse::updated(
                $maintenance,
                'Maintenance completion processed successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to complete maintenance.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether an authenticated user has the technician role.
     */
    protected function isTechnician($user): bool
    {
        return method_exists($user, 'hasRole')
            && $user->hasRole('technician');
    }

    /*
    |--------------------------------------------------------------------------
    | EXCEPTION HANDLING
    |--------------------------------------------------------------------------
    */

    /**
     * Standardize controller exceptions using ApiResponse.
     */
    protected function handleException(
        Throwable $e,
        string $message
    ): JsonResponse {
        if ($e instanceof ValidationException) {
            return ApiResponse::validation(
                $e->errors(),
                $e->getMessage() ?: 'Validation failed.'
            );
        }

        if ($e instanceof ModelNotFoundException) {
            return ApiResponse::notFound(
                'The requested ongoing maintenance record was not found.'
            );
        }

        if ($e instanceof HttpException) {
            return ApiResponse::error(
                $e->getMessage() ?: $message,
                null,
                $e->getStatusCode()
            );
        }

        Log::error($message, [
            'exception' => $e::class,
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        return ApiResponse::serverError(
            $message,
            config('app.debug')
                ? ['error' => $e->getMessage()]
                : null
        );
    }
}
