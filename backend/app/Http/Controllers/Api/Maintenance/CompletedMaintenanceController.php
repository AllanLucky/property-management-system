<?php

namespace App\Http\Controllers\Api\Maintenance;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Maintenance\CompleteMaintenanceRequest;
use App\Http\Resources\CompletedMaintenanceResource;
use App\Services\CompletedMaintenanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Throwable;

class CompletedMaintenanceController extends Controller
{
    /**
     * Completed maintenance service.
     */
    protected CompletedMaintenanceService $completedMaintenanceService;

    /**
     * Create a new controller instance.
     */
    public function __construct(
        CompletedMaintenanceService $completedMaintenanceService
    ) {
        $this->completedMaintenanceService = $completedMaintenanceService;
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETE MAINTENANCE
    |--------------------------------------------------------------------------
    */

    /**
     * Complete a maintenance request.
     *
     * POST /api/maintenance/{id}/complete
     *
     * Validation is handled by CompleteMaintenanceRequest.
     */
    public function complete(
        CompleteMaintenanceRequest $request,
        int $id
    ): JsonResponse {
        try {
            $this->validateRouteId($id, 'maintenance_id');

            $maintenance = $this->completedMaintenanceService
                ->completeMaintenance(
                    $id,
                    $request->validated(),
                    $request->user()
                );

            return ApiResponse::success(
                new CompletedMaintenanceResource($maintenance),
                'Maintenance request completed successfully.'
            );

        } catch (ModelNotFoundException $e) {
            return ApiResponse::notFound(
                'Maintenance request not found.'
            );

        } catch (InvalidArgumentException $e) {
            return ApiResponse::validation(
                ['maintenance' => [$e->getMessage()]],
                'Unable to complete maintenance request.'
            );

        } catch (Throwable $e) {
            $this->logError(
                'Failed to complete maintenance request.',
                $e,
                $request,
                ['maintenance_id' => $id]
            );

            return ApiResponse::serverError(
                'Unable to complete maintenance request.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve paginated completed maintenance requests.
     *
     * GET /api/completed-maintenance
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate(array_merge(
                $this->filterRules(),
                [
                    'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
                    'page' => ['nullable', 'integer', 'min:1'],
                    'search' => ['nullable', 'string', 'max:255'],
                    'sort_by' => [
                        'nullable',
                        'in:id,reference,completed_at,total_cost,created_at,updated_at',
                    ],
                    'sort_direction' => ['nullable', 'in:asc,desc'],
                ]
            ));

            $perPage = (int) ($validated['per_page'] ?? 20);

            unset($validated['per_page'], $validated['page']);

            $paginator = $this->completedMaintenanceService
                ->filterCompletedMaintenance($validated, $perPage);

            $paginator->through(
                fn ($maintenance) => (new CompletedMaintenanceResource(
                    $maintenance
                ))->resolve($request)
            );

            return ApiResponse::paginated(
                $paginator,
                'Completed maintenance records retrieved successfully.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Please check the completed maintenance filters.'
            );

        } catch (InvalidArgumentException $e) {
            return ApiResponse::validation(
                ['filters' => [$e->getMessage()]],
                'Invalid completed maintenance filters.'
            );

        } catch (Throwable $e) {
            $this->logError(
                'Failed to retrieve completed maintenance.',
                $e,
                $request
            );

            return ApiResponse::serverError(
                'Unable to retrieve completed maintenance records.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance statistics.
     *
     * GET /api/completed-maintenance/statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate($this->filterRules());

            $statistics = $this->completedMaintenanceService
                ->getStatistics($validated);

            return ApiResponse::success(
                $statistics,
                'Completed maintenance statistics retrieved successfully.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Invalid statistics filters.'
            );

        } catch (InvalidArgumentException $e) {
            return ApiResponse::validation(
                ['filters' => [$e->getMessage()]],
                'Invalid statistics filters.'
            );

        } catch (Throwable $e) {
            $this->logError(
                'Failed to retrieve completed maintenance statistics.',
                $e,
                $request
            );

            return ApiResponse::serverError(
                'Unable to retrieve completed maintenance statistics.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD SUMMARY
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance dashboard summary.
     *
     * GET /api/completed-maintenance/dashboard
     */
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate($this->filterRules());

            $summary = $this->completedMaintenanceService
                ->getDashboardSummary($validated);

            return ApiResponse::success(
                $summary,
                'Completed maintenance dashboard retrieved successfully.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Invalid dashboard filters.'
            );

        } catch (InvalidArgumentException $e) {
            return ApiResponse::validation(
                ['filters' => [$e->getMessage()]],
                'Invalid dashboard filters.'
            );

        } catch (Throwable $e) {
            $this->logError(
                'Failed to retrieve completed maintenance dashboard.',
                $e,
                $request
            );

            return ApiResponse::serverError(
                'Unable to retrieve completed maintenance dashboard.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FINANCIAL SUMMARY
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance financial summary.
     *
     * GET /api/completed-maintenance/financial-summary
     */
    public function financialSummary(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate($this->filterRules());

            $summary = $this->completedMaintenanceService
                ->getFinancialSummary($validated);

            return ApiResponse::success(
                $summary,
                'Completed maintenance financial summary retrieved successfully.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Invalid financial summary filters.'
            );

        } catch (InvalidArgumentException $e) {
            return ApiResponse::validation(
                ['filters' => [$e->getMessage()]],
                'Invalid financial summary filters.'
            );

        } catch (Throwable $e) {
            $this->logError(
                'Failed to retrieve completed maintenance financial summary.',
                $e,
                $request
            );

            return ApiResponse::serverError(
                'Unable to retrieve completed maintenance financial summary.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RECENTLY COMPLETED
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve recently completed maintenance requests.
     *
     * GET /api/completed-maintenance/recent
     */
    public function recentlyCompleted(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            ]);

            $maintenance = $this->completedMaintenanceService
                ->getRecentlyCompletedMaintenance(
                    (int) ($validated['limit'] ?? 10)
                );

            return ApiResponse::collection(
                CompletedMaintenanceResource::collection($maintenance),
                'Recently completed maintenance retrieved successfully.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Invalid recent maintenance limit.'
            );

        } catch (InvalidArgumentException $e) {
            return ApiResponse::validation(
                ['limit' => [$e->getMessage()]],
                'Invalid recent maintenance limit.'
            );

        } catch (Throwable $e) {
            $this->logError(
                'Failed to retrieve recently completed maintenance.',
                $e,
                $request
            );

            return ApiResponse::serverError(
                'Unable to retrieve recently completed maintenance.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETED BETWEEN DATES
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance within a date range.
     *
     * GET /api/completed-maintenance/between
     */
    public function completedBetween(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'start_date' => ['required', 'date'],
                'end_date' => [
                    'required',
                    'date',
                    'after_or_equal:start_date',
                ],
            ]);

            $maintenance = $this->completedMaintenanceService
                ->getCompletedMaintenanceBetween(
                    $validated['start_date'],
                    $validated['end_date']
                );

            return ApiResponse::collection(
                CompletedMaintenanceResource::collection($maintenance),
                'Completed maintenance history retrieved successfully.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Please provide a valid completion date range.'
            );

        } catch (InvalidArgumentException $e) {
            return ApiResponse::validation(
                ['date_range' => [$e->getMessage()]],
                'Invalid completion date range.'
            );

        } catch (Throwable $e) {
            $this->logError(
                'Failed to retrieve completed maintenance date range.',
                $e,
                $request
            );

            return ApiResponse::serverError(
                'Unable to retrieve completed maintenance history.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | BY TECHNICIAN
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance handled by a technician.
     *
     * GET /api/completed-maintenance/technician/{technicianId}
     */
    public function byTechnician(
        Request $request,
        int $technicianId
    ): JsonResponse {
        try {
            $this->validateRouteId($technicianId, 'technician_id');

            $maintenance = $this->completedMaintenanceService
                ->getCompletedMaintenanceByTechnician($technicianId);

            return ApiResponse::collection(
                CompletedMaintenanceResource::collection($maintenance),
                'Completed maintenance for technician retrieved successfully.'
            );

        } catch (InvalidArgumentException $e) {
            return ApiResponse::validation(
                ['technician_id' => [$e->getMessage()]]
            );

        } catch (Throwable $e) {
            $this->logError(
                'Failed to retrieve completed maintenance by technician.',
                $e,
                $request,
                ['technician_id' => $technicianId]
            );

            return ApiResponse::serverError(
                'Unable to retrieve completed maintenance for this technician.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | BY PROPERTY
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance for a property.
     *
     * GET /api/completed-maintenance/property/{propertyId}
     */
    public function byProperty(
        Request $request,
        int $propertyId
    ): JsonResponse {
        try {
            $this->validateRouteId($propertyId, 'property_id');

            $maintenance = $this->completedMaintenanceService
                ->getCompletedMaintenanceByProperty($propertyId);

            return ApiResponse::collection(
                CompletedMaintenanceResource::collection($maintenance),
                'Completed maintenance for property retrieved successfully.'
            );

        } catch (InvalidArgumentException $e) {
            return ApiResponse::validation(
                ['property_id' => [$e->getMessage()]]
            );

        } catch (Throwable $e) {
            $this->logError(
                'Failed to retrieve completed maintenance by property.',
                $e,
                $request,
                ['property_id' => $propertyId]
            );

            return ApiResponse::serverError(
                'Unable to retrieve completed maintenance for this property.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | BY UNIT
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance for a unit.
     *
     * GET /api/completed-maintenance/unit/{unitId}
     */
    public function byUnit(
        Request $request,
        int $unitId
    ): JsonResponse {
        try {
            $this->validateRouteId($unitId, 'unit_id');

            $maintenance = $this->completedMaintenanceService
                ->getCompletedMaintenanceByUnit($unitId);

            return ApiResponse::collection(
                CompletedMaintenanceResource::collection($maintenance),
                'Completed maintenance for unit retrieved successfully.'
            );

        } catch (InvalidArgumentException $e) {
            return ApiResponse::validation(
                ['unit_id' => [$e->getMessage()]]
            );

        } catch (Throwable $e) {
            $this->logError(
                'Failed to retrieve completed maintenance by unit.',
                $e,
                $request,
                ['unit_id' => $unitId]
            );

            return ApiResponse::serverError(
                'Unable to retrieve completed maintenance for this unit.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | BY CATEGORY
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance for a category.
     *
     * GET /api/completed-maintenance/category/{categoryId}
     */
    public function byCategory(
        Request $request,
        int $categoryId
    ): JsonResponse {
        try {
            $this->validateRouteId($categoryId, 'category_id');

            $maintenance = $this->completedMaintenanceService
                ->getCompletedMaintenanceByCategory($categoryId);

            return ApiResponse::collection(
                CompletedMaintenanceResource::collection($maintenance),
                'Completed maintenance for category retrieved successfully.'
            );

        } catch (InvalidArgumentException $e) {
            return ApiResponse::validation(
                ['category_id' => [$e->getMessage()]]
            );

        } catch (Throwable $e) {
            $this->logError(
                'Failed to retrieve completed maintenance by category.',
                $e,
                $request,
                ['category_id' => $categoryId]
            );

            return ApiResponse::serverError(
                'Unable to retrieve completed maintenance for this category.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve a single completed maintenance request.
     *
     * GET /api/completed-maintenance/{id}
     */
    public function show(
        Request $request,
        int $id
    ): JsonResponse {
        try {
            $this->validateRouteId($id, 'id');

            $maintenance = $this->completedMaintenanceService
                ->getCompletedMaintenanceById($id);

            return ApiResponse::success(
                new CompletedMaintenanceResource($maintenance),
                'Completed maintenance details retrieved successfully.'
            );

        } catch (InvalidArgumentException $e) {
            return ApiResponse::validation(
                ['id' => [$e->getMessage()]]
            );

        } catch (ModelNotFoundException $e) {
            return ApiResponse::notFound(
                'Completed maintenance record not found.'
            );

        } catch (Throwable $e) {
            $this->logError(
                'Failed to retrieve completed maintenance details.',
                $e,
                $request,
                ['maintenance_id' => $id]
            );

            return ApiResponse::serverError(
                'Unable to retrieve completed maintenance details.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Shared completed maintenance filter validation rules.
     */
    private function filterRules(): array
    {
        return [
            'property_id' => ['nullable', 'integer', 'min:1'],
            'apartment_id' => ['nullable', 'integer', 'min:1'],
            'unit_id' => ['nullable', 'integer', 'min:1'],
            'technician_id' => ['nullable', 'integer', 'min:1'],
            'category_id' => ['nullable', 'integer', 'min:1'],

            'date_from' => ['nullable', 'date'],

            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],

            'min_cost' => ['nullable', 'numeric', 'min:0'],

            'max_cost' => [
                'nullable',
                'numeric',
                'min:0',
                'gte:min_cost',
            ],
        ];
    }

    /**
     * Validate a route identifier.
     */
    private function validateRouteId(
        int $id,
        string $attribute
    ): void {
        if ($id < 1) {
            throw new InvalidArgumentException(
                "A valid {$attribute} is required."
            );
        }
    }

    /**
     * Log controller exceptions consistently.
     */
    private function logError(
        string $message,
        Throwable $exception,
        Request $request,
        array $context = []
    ): void {
        Log::error($message, array_merge(
            [
                'error' => $exception->getMessage(),
                'user_id' => $request->user()?->id,
                'request_id' => $request->header('X-Request-ID'),
            ],
            $context
        ));
    }
}
