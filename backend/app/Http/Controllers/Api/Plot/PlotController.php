<?php

namespace App\Http\Controllers\Api\Plot;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Plots\PlotReportRequest;
use App\Http\Requests\Plots\StorePlotRequest;
use App\Http\Requests\Plots\UpdatePlotRequest;
use App\Http\Resources\PlotResource;
use App\Services\PlotReportService;
use App\Services\PlotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Throwable;

class PlotController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Services
    |--------------------------------------------------------------------------
    */

    protected PlotService $plotService;

    protected PlotReportService $plotReportService;

    /**
     * Create a new controller instance.
     */
    public function __construct(
        PlotService $plotService,
        PlotReportService $plotReportService
    ) {
        $this->plotService = $plotService;
        $this->plotReportService = $plotReportService;
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */

    /**
     * Display a paginated list of plots.
     *
     * GET /api/plots
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->all();

            $perPage = min(
                max((int) $request->input('per_page', 15), 1),
                100
            );

            $plots = $this->plotService->paginatePlots(
                $filters,
                $perPage
            );

            return ApiResponse::paginated(
                $plots,
                'Plots retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Failed to retrieve plots.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    /**
     * Store a newly created plot.
     *
     * POST /api/plots
     */
    public function store(StorePlotRequest $request): JsonResponse
    {
        try {
            $plot = $this->plotService->createPlot(
                $request->validated()
            );

            return ApiResponse::created(
                new PlotResource($plot),
                'Plot created successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Failed to create plot.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    /**
     * Display the specified plot.
     *
     * GET /api/plots/{plot}
     */
    public function show(int|string $plot): JsonResponse
    {
        try {
            $result = $this->plotService->getPlotDetails($plot);

            return ApiResponse::success(
                new PlotResource($result),
                'Plot retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve plot.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    /**
     * Update the specified plot.
     *
     * PUT/PATCH /api/plots/{plot}
     */
    public function update(
        UpdatePlotRequest $request,
        int|string $plot
    ): JsonResponse {
        try {
            $result = $this->plotService->updatePlot(
                $plot,
                $request->validated()
            );

            return ApiResponse::updated(
                new PlotResource($result),
                'Plot updated successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to update plot.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete a plot.
     *
     * DELETE /api/plots/{plot}
     */
    public function destroy(int|string $plot): JsonResponse
    {
        try {
            $this->plotService->deletePlot($plot);

            return ApiResponse::deleted(
                null,
                'Plot deleted successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to delete plot.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    /**
     * Search plots.
     *
     * GET /api/plots/search
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $search = trim(
                (string) $request->input('search', '')
            );

            if ($search === '') {
                return ApiResponse::validation(
                    [
                        'search' => [
                            'A search term is required.',
                        ],
                    ],
                    'Search term is required.'
                );
            }

            $filters = $request->except('search');

            $plots = $this->plotService->searchPlots(
                $search,
                $filters
            );

            return ApiResponse::paginated(
                $plots,
                'Plot search completed successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Failed to search plots.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE
    |--------------------------------------------------------------------------
    */

    /**
     * Get available plots.
     *
     * GET /api/plots/available
     */
    public function available(Request $request): JsonResponse
    {
        try {
            $perPage = min(
                max((int) $request->input('per_page', 15), 1),
                100
            );

            $plots = $this->plotService->getAvailablePlots(
                $request->all()
            );

            /*
             * The service normally returns a paginator.
             */
            if ($plots instanceof \Illuminate\Contracts\Pagination\LengthAwarePaginator) {
                return ApiResponse::paginated(
                    $plots,
                    'Available plots retrieved successfully.'
                );
            }

            return ApiResponse::success(
                PlotResource::collection($plots),
                'Available plots retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Failed to retrieve available plots.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABILITY CHECK
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether a plot is available.
     *
     * GET /api/plots/{plot}/availability
     */
    public function availability(int|string $plot): JsonResponse
    {
        try {
            $available = $this->plotService->isPlotAvailable($plot);

            return ApiResponse::success(
                [
                    'plot_id' => $plot,
                    'is_available' => $available,
                ],
                'Plot availability checked successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to check plot availability.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    /**
     * Get plots by status.
     *
     * GET /api/plots/status/{status}
     */
    public function status(
        Request $request,
        string $status
    ): JsonResponse {
        try {
            $plots = $this->plotService->getPlotsByStatus(
                $status,
                $request->all()
            );

            if ($plots instanceof \Illuminate\Contracts\Pagination\LengthAwarePaginator) {
                return ApiResponse::paginated(
                    $plots,
                    "Plots with status '{$status}' retrieved successfully."
                );
            }

            return ApiResponse::success(
                PlotResource::collection($plots),
                "Plots with status '{$status}' retrieved successfully."
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve plots by status.'
            );
        }
    }

    /**
     * Update plot status.
     *
     * PATCH /api/plots/{plot}/status
     */
    public function updateStatus(
        Request $request,
        int|string $plot
    ): JsonResponse {
        try {
            $validated = $request->validate([
                'status' => [
                    'required',
                    'string',
                    'in:available,reserved,sold,unavailable',
                ],
            ]);

            $result = $this->plotService->updatePlotStatus(
                $plot,
                $validated['status']
            );

            return ApiResponse::updated(
                new PlotResource($result),
                'Plot status updated successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to update plot status.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Get complete plot statistics.
     *
     * GET /api/plots/statistics
     */
    public function statistics(
        PlotReportRequest $request
    ): JsonResponse {
        try {
            $statistics = $this->plotReportService->statistics(
                $request->validated()
            );

            return ApiResponse::success(
                $statistics,
                'Plot statistics retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Failed to retrieve plot statistics.',
                $e
            );
        }
    }

    /**
     * Get inventory statistics.
     *
     * GET /api/plots/statistics/inventory
     */
    public function inventoryStatistics(
        PlotReportRequest $request
    ): JsonResponse {
        try {
            $statistics = $this->plotReportService->inventoryStatistics(
                $request->validated()
            );

            return ApiResponse::success(
                $statistics,
                'Plot inventory statistics retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Failed to retrieve inventory statistics.',
                $e
            );
        }
    }

    /**
     * Get sales statistics.
     *
     * GET /api/plots/statistics/sales
     */
    public function salesStatistics(
        PlotReportRequest $request
    ): JsonResponse {
        try {
            $statistics = $this->plotReportService->salesStatistics(
                $request->validated()
            );

            return ApiResponse::success(
                $statistics,
                'Plot sales statistics retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Failed to retrieve sales statistics.',
                $e
            );
        }
    }

    /**
     * Get payment statistics.
     *
     * GET /api/plots/statistics/payments
     */
    public function paymentStatistics(
        PlotReportRequest $request
    ): JsonResponse {
        try {
            $statistics = $this->plotReportService->paymentStatistics(
                $request->validated()
            );

            return ApiResponse::success(
                $statistics,
                'Plot payment statistics retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Failed to retrieve payment statistics.',
                $e
            );
        }
    }

    /**
     * Get location statistics.
     *
     * GET /api/plots/statistics/locations
     */
    public function locationStatistics(
        PlotReportRequest $request
    ): JsonResponse {
        try {
            $statistics = $this->plotReportService->locationStatistics(
                $request->validated()
            );

            return ApiResponse::success(
                $statistics,
                'Plot location statistics retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Failed to retrieve location statistics.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | REPORTS
    |--------------------------------------------------------------------------
    */

    /**
     * Inventory report.
     *
     * GET /api/plots/reports/inventory
     */
    public function inventoryReport(
        PlotReportRequest $request
    ): JsonResponse {
        try {
            $report = $this->plotReportService->inventoryReport(
                $request->validated()
            );

            return ApiResponse::paginated(
                $report,
                'Plot inventory report generated successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Failed to generate inventory report.',
                $e
            );
        }
    }

    /**
     * Sales report.
     *
     * GET /api/plots/reports/sales
     */
    public function salesReport(
        PlotReportRequest $request
    ): JsonResponse {
        try {
            $report = $this->plotReportService->salesReport(
                $request->validated()
            );

            return ApiResponse::paginated(
                $report,
                'Plot sales report generated successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Failed to generate sales report.',
                $e
            );
        }
    }

    /**
     * Payment report.
     *
     * GET /api/plots/reports/payments
     */
    public function paymentReport(
        PlotReportRequest $request
    ): JsonResponse {
        try {
            $report = $this->plotReportService->paymentReport(
                $request->validated()
            );

            return ApiResponse::paginated(
                $report,
                'Plot payment report generated successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Failed to generate payment report.',
                $e
            );
        }
    }

    /**
     * Outstanding balances report.
     *
     * GET /api/plots/reports/outstanding
     */
    public function outstandingReport(
        PlotReportRequest $request
    ): JsonResponse {
        try {
            $report = $this->plotReportService->outstandingReport(
                $request->validated()
            );

            return ApiResponse::paginated(
                $report,
                'Outstanding plot report generated successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Failed to generate outstanding report.',
                $e
            );
        }
    }

    /**
     * Agent performance report.
     *
     * GET /api/plots/reports/agents
     */
    public function agentReport(
        PlotReportRequest $request
    ): JsonResponse {
        try {
            $report = $this->plotReportService->agentReport(
                $request->validated()
            );

            return ApiResponse::paginated(
                $report,
                'Plot agent report generated successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Failed to generate agent report.',
                $e
            );
        }
    }

    /**
     * Location report.
     *
     * GET /api/plots/reports/locations
     */
    public function locationReport(
        PlotReportRequest $request
    ): JsonResponse {
        try {
            $report = $this->plotReportService->locationReport(
                $request->validated()
            );

            return ApiResponse::paginated(
                $report,
                'Plot location report generated successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Failed to generate location report.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LOCATION FILTERS
    |--------------------------------------------------------------------------
    */

    /**
     * Get plots by county.
     *
     * GET /api/plots/county/{county}
     */
    public function byCounty(
        Request $request,
        int|string $county
    ): JsonResponse {
        try {
            $plots = $this->plotService->getPlotsByCounty(
                $county,
                $request->all()
            );

            if ($plots instanceof \Illuminate\Contracts\Pagination\LengthAwarePaginator) {
                return ApiResponse::paginated(
                    $plots,
                    'County plots retrieved successfully.'
                );
            }

            return ApiResponse::success(
                PlotResource::collection($plots),
                'County plots retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve county plots.'
            );
        }
    }

    /**
     * Get plots by city.
     *
     * GET /api/plots/city/{city}
     */
    public function byCity(
        Request $request,
        int|string $city
    ): JsonResponse {
        try {
            $plots = $this->plotService->getPlotsByCity(
                $city,
                $request->all()
            );

            if ($plots instanceof \Illuminate\Contracts\Pagination\LengthAwarePaginator) {
                return ApiResponse::paginated(
                    $plots,
                    'City plots retrieved successfully.'
                );
            }

            return ApiResponse::success(
                PlotResource::collection($plots),
                'City plots retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve city plots.'
            );
        }
    }

    /**
     * Get plots by area.
     *
     * GET /api/plots/area/{area}
     */
    public function byArea(
        Request $request,
        int|string $area
    ): JsonResponse {
        try {
            $plots = $this->plotService->getPlotsByArea(
                $area,
                $request->all()
            );

            if ($plots instanceof \Illuminate\Contracts\Pagination\LengthAwarePaginator) {
                return ApiResponse::paginated(
                    $plots,
                    'Area plots retrieved successfully.'
                );
            }

            return ApiResponse::success(
                PlotResource::collection($plots),
                'Area plots retrieved successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to retrieve area plots.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE
    |--------------------------------------------------------------------------
    */

    /**
     * Restore a soft deleted plot.
     *
     * POST /api/plots/{plot}/restore
     */
    public function restore(int|string $plot): JsonResponse
    {
        try {
            $result = $this->plotService->restorePlot($plot);

            return ApiResponse::updated(
                new PlotResource($result),
                'Plot restored successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to restore plot.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete a plot.
     *
     * DELETE /api/plots/{plot}/force
     */
    public function forceDelete(int|string $plot): JsonResponse
    {
        try {
            $this->plotService->forceDeletePlot($plot);

            return ApiResponse::deleted(
                null,
                'Plot permanently deleted successfully.'
            );
        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to permanently delete plot.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | EXCEPTION HANDLING
    |--------------------------------------------------------------------------
    */

    /**
     * Handle known and unknown exceptions.
     */
    protected function handleException(
        Throwable $e,
        string $message
    ): JsonResponse {
        /*
         * ValidationException
         */
        if ($e instanceof \Illuminate\Validation\ValidationException) {
            return ApiResponse::validation(
                $e->errors(),
                $message
            );
        }

        /*
         * ModelNotFoundException
         */
        if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
            return ApiResponse::notFound(
                'Plot not found.'
            );
        }

        /*
         * AuthorizationException
         */
        if ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
            return ApiResponse::forbidden(
                $e->getMessage() ?: 'You are not authorized to perform this action.'
            );
        }

        return $this->serverError(
            $message,
            $e
        );
    }

    /**
     * Return a server error response.
     */
    protected function serverError(
        string $message,
        Throwable $e
    ): JsonResponse {
        /*
         * Keep detailed exception information out of production responses.
         */
        $errors = config('app.debug')
            ? [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]
            : null;

        return ApiResponse::serverError(
            $message,
            $errors
        );
    }
}

