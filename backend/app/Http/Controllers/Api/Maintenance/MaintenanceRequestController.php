<?php

namespace App\Http\Controllers\Api\Maintenance;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Maintenance\StoreMaintenanceRequest;
use App\Http\Requests\Maintenance\UpdateMaintenanceRequest;
use App\Http\Requests\Maintenance\UpdateMaintenanceStatusRequest;
use App\Services\MaintenanceRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Throwable;

class MaintenanceRequestController extends Controller
{
    protected MaintenanceRequestService $maintenanceRequestService;

    public function __construct(
        MaintenanceRequestService $maintenanceRequestService
    ) {
        $this->maintenanceRequestService = $maintenanceRequestService;
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = (int) $request->input('per_page', 20);

            $requests = $this->maintenanceRequestService->filter(
                $request->query(),
                $perPage
            );

            return ApiResponse::paginated(
                $requests,
                'Maintenance requests retrieved successfully.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Invalid maintenance request filters.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to retrieve maintenance requests.', [
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to retrieve maintenance requests.',
                config('app.debug') ? ['error' => $e->getMessage()] : null
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(StoreMaintenanceRequest $request): JsonResponse
    {
        try {
            $maintenanceRequest = $this->maintenanceRequestService->create(
                $request->validated()
            );

            return ApiResponse::created(
                $maintenanceRequest,
                'Maintenance request created successfully.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Please check the maintenance request details.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to create maintenance request.', [
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to create maintenance request.',
                config('app.debug') ? ['error' => $e->getMessage()] : null
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    public function show(int $id): JsonResponse
    {
        try {
            $maintenanceRequest = $this->maintenanceRequestService->find($id);

            if (!$maintenanceRequest) {
                return ApiResponse::notFound(
                    'Maintenance request not found.'
                );
            }

            return ApiResponse::success(
                $maintenanceRequest,
                'Maintenance request retrieved successfully.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to retrieve maintenance request.', [
                'maintenance_request_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to retrieve maintenance request.',
                config('app.debug') ? ['error' => $e->getMessage()] : null
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(
        UpdateMaintenanceRequest $request,
        int $id
    ): JsonResponse {
        try {
            $maintenanceRequest = $this->maintenanceRequestService->update(
                $id,
                $request->validated()
            );

            if (!$maintenanceRequest) {
                return ApiResponse::notFound(
                    'Maintenance request not found.'
                );
            }

            return ApiResponse::updated(
                $maintenanceRequest,
                'Maintenance request updated successfully.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Please check the maintenance request details.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to update maintenance request.', [
                'maintenance_request_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to update maintenance request.',
                config('app.debug') ? ['error' => $e->getMessage()] : null
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DESTROY
    |--------------------------------------------------------------------------
    */

    public function destroy(int $id): JsonResponse
    {
        try {
            $deleted = $this->maintenanceRequestService->delete($id);

            if (!$deleted) {
                return ApiResponse::notFound(
                    'Maintenance request not found or cannot be deleted.'
                );
            }

            return ApiResponse::deleted(
                'Maintenance request deleted successfully.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Unable to delete maintenance request.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to delete maintenance request.', [
                'maintenance_request_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to delete maintenance request.',
                config('app.debug') ? ['error' => $e->getMessage()] : null
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE STATUS
    |--------------------------------------------------------------------------
    */

    public function updateStatus(
        UpdateMaintenanceStatusRequest $request,
        int $id
    ): JsonResponse {
        try {
            $maintenanceRequest = $this->maintenanceRequestService->updateStatus(
                $id,
                $request->validated()
            );

            if (!$maintenanceRequest) {
                return ApiResponse::notFound(
                    'Maintenance request not found.'
                );
            }

            return ApiResponse::updated(
                $maintenanceRequest,
                'Maintenance request status updated successfully.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Unable to update maintenance request status.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to update maintenance request status.', [
                'maintenance_request_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to update maintenance request status.',
                config('app.debug') ? ['error' => $e->getMessage()] : null
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    public function statistics(Request $request): JsonResponse
    {
        try {
            $statistics = $this->maintenanceRequestService->statistics(
                $request->query()
            );

            return ApiResponse::success(
                $statistics,
                'Maintenance request statistics retrieved successfully.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Invalid statistics filters.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to retrieve maintenance request statistics.', [
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to retrieve maintenance request statistics.',
                config('app.debug') ? ['error' => $e->getMessage()] : null
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | BY PROPERTY
    |--------------------------------------------------------------------------
    */

    public function byProperty(int $propertyId): JsonResponse
    {
        return $this->relationshipList(
            'findByProperty',
            $propertyId,
            'property',
            'Maintenance requests for property retrieved successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | BY UNIT
    |--------------------------------------------------------------------------
    */

    public function byUnit(int $unitId): JsonResponse
    {
        return $this->relationshipList(
            'findByUnit',
            $unitId,
            'unit',
            'Maintenance requests for unit retrieved successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | BY TENANT
    |--------------------------------------------------------------------------
    */

    public function byTenant(int $tenantId): JsonResponse
    {
        return $this->relationshipList(
            'findByTenant',
            $tenantId,
            'tenant',
            'Maintenance requests for tenant retrieved successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | BY TECHNICIAN
    |--------------------------------------------------------------------------
    */

    public function byTechnician(int $technicianId): JsonResponse
    {
        return $this->relationshipList(
            'findByTechnician',
            $technicianId,
            'technician',
            'Maintenance requests for technician retrieved successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | BY CATEGORY
    |--------------------------------------------------------------------------
    */

    public function byCategory(int $categoryId): JsonResponse
    {
        return $this->relationshipList(
            'findByCategory',
            $categoryId,
            'category',
            'Maintenance requests for category retrieved successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP LIST HELPER
    |--------------------------------------------------------------------------
    */

    private function relationshipList(
        string $serviceMethod,
        int $id,
        string $relationship,
        string $message
    ): JsonResponse {
        try {
            $requests = $this->maintenanceRequestService->{$serviceMethod}($id);

            return ApiResponse::success(
                $requests,
                $message
            );

        } catch (Throwable $e) {
            Log::error(
                "Failed to retrieve maintenance requests by {$relationship}.",
                [
                    "{$relationship}_id" => $id,
                    'service_method' => $serviceMethod,
                    'error' => $e->getMessage(),
                ]
            );

            return ApiResponse::serverError(
                "Failed to retrieve maintenance requests by {$relationship}.",
                config('app.debug') ? ['error' => $e->getMessage()] : null
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PENDING
    |--------------------------------------------------------------------------
    */

    public function pending(): JsonResponse
    {
        return $this->statusList(
            'pending',
            'Pending maintenance requests retrieved successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | APPROVED
    |--------------------------------------------------------------------------
    */

    public function approved(): JsonResponse
    {
        return $this->statusList(
            'approved',
            'Approved maintenance requests retrieved successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | REJECTED
    |--------------------------------------------------------------------------
    */

    public function rejected(): JsonResponse
    {
        return $this->statusList(
            'rejected',
            'Rejected maintenance requests retrieved successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGNED
    |--------------------------------------------------------------------------
    */

    public function assigned(): JsonResponse
    {
        return $this->statusList(
            'assigned',
            'Assigned maintenance requests retrieved successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | IN PROGRESS
    |--------------------------------------------------------------------------
    */

    public function inProgress(): JsonResponse
    {
        return $this->statusList(
            'inProgress',
            'In-progress maintenance requests retrieved successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ON HOLD
    |--------------------------------------------------------------------------
    */

    public function onHold(): JsonResponse
    {
        return $this->statusList(
            'onHold',
            'On-hold maintenance requests retrieved successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETED
    |--------------------------------------------------------------------------
    */

    public function completed(): JsonResponse
    {
        return $this->statusList(
            'completed',
            'Completed maintenance requests retrieved successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CANCELLED
    |--------------------------------------------------------------------------
    */

    public function cancelled(): JsonResponse
    {
        return $this->statusList(
            'cancelled',
            'Cancelled maintenance requests retrieved successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | OVERDUE
    |--------------------------------------------------------------------------
    */

    public function overdue(): JsonResponse
    {
        return $this->statusList(
            'overdue',
            'Overdue maintenance requests retrieved successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS LIST HELPER
    |--------------------------------------------------------------------------
    */

    private function statusList(
        string $serviceMethod,
        string $message
    ): JsonResponse {
        try {
            $requests = $this->maintenanceRequestService->{$serviceMethod}();

            return ApiResponse::success(
                $requests,
                $message
            );

        } catch (Throwable $e) {
            Log::error('Failed to retrieve maintenance requests by status.', [
                'service_method' => $serviceMethod,
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to retrieve maintenance requests.',
                config('app.debug') ? ['error' => $e->getMessage()] : null
            );
        }
    }
}
