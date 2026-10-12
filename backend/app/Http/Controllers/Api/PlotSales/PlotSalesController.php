<?php

namespace App\Http\Controllers\Api\PlotSales;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\PlotSalesResource;
use App\Models\PlotSale;
use App\Services\PlotSaleService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use Throwable;

class PlotSalesController extends Controller
{
    /**
     * Plot sale service.
     */
    public function __construct(
        protected PlotSaleService $plotSaleService
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */

    /**
     * Display paginated plot sales.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', PlotSale::class);

            $filters = $request->only([
                'search',
                'plot_id',
                'buyer_id',
                'agent_id',
                'status',
                'payment_status',
                'sale_type',
                'currency',
                'date_from',
                'date_to',
                'min_amount',
                'max_amount',
                'outstanding_only',
            ]);

            $perPage = (int) $request->input('per_page', 15);

            $sales = $this->plotSaleService->getAll(
                $filters,
                max(1, min($perPage, 100))
            );

            $sales->through(
                fn ($sale) => (new PlotSalesResource($sale))
                    ->resolve($request)
            );

            return ApiResponse::paginated(
                $sales,
                'Plot sales fetched successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to fetch plot sales.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new plot sale.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', PlotSale::class);

            $data = $request->validate([
                'sale_number' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:100',
                ],

                'plot_id' => [
                    'required',
                    'integer',
                    'exists:plots,id',
                ],

                'buyer_id' => [
                    'required',
                    'integer',
                    'exists:users,id',
                ],

                'agent_id' => [
                    'nullable',
                    'integer',
                    'exists:users,id',
                ],

                'sale_price' => [
                    'required',
                    'numeric',
                    'min:0',
                ],

                'deposit_amount' => [
                    'sometimes',
                    'numeric',
                    'min:0',
                ],

                'discount_amount' => [
                    'sometimes',
                    'numeric',
                    'min:0',
                ],

                'additional_charges' => [
                    'sometimes',
                    'numeric',
                    'min:0',
                ],

                'total_amount' => [
                    'sometimes',
                    'numeric',
                    'min:0',
                ],

                'amount_paid' => [
                    'sometimes',
                    'numeric',
                    'min:0',
                ],

                'balance' => [
                    'sometimes',
                    'numeric',
                    'min:0',
                ],

                'currency' => [
                    'sometimes',
                    'string',
                    'size:3',
                ],

                'sale_type' => [
                    'sometimes',
                    'string',
                    'max:50',
                ],

                'payment_plan' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'payment_frequency' => [
                    'nullable',
                    'string',
                    'max:50',
                ],

                'installments' => [
                    'nullable',
                    'integer',
                    'min:1',
                ],

                'installment_amount' => [
                    'nullable',
                    'numeric',
                    'min:0',
                ],

                'sale_date' => [
                    'nullable',
                    'date',
                ],

                'reservation_date' => [
                    'nullable',
                    'date',
                ],

                'expected_completion_date' => [
                    'nullable',
                    'date',
                ],

                'terms_and_conditions' => [
                    'nullable',
                    'string',
                ],

                'notes' => [
                    'nullable',
                    'string',
                ],
            ]);

            $sale = $this->plotSaleService->create($data);

            return ApiResponse::created(
                (new PlotSalesResource($sale))->resolve($request),
                'Plot sale created successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to create plot sale.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    /**
     * Display a specific plot sale.
     */
    public function show(int $id, Request $request): JsonResponse
    {
        try {
            $sale = $this->plotSaleService->findById($id);

            $this->authorize('view', $sale);

            return ApiResponse::success(
                (new PlotSalesResource($sale))->resolve($request),
                'Plot sale fetched successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to fetch plot sale.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    /**
     * Update an existing plot sale.
     */
    public function update(
        Request $request,
        int $id
    ): JsonResponse {
        try {
            $sale = $this->plotSaleService->findById($id);

            $this->authorize('update', $sale);

            $data = $request->validate([
                'sale_number' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:100',
                ],

                'plot_id' => [
                    'sometimes',
                    'required',
                    'integer',
                    'exists:plots,id',
                ],

                'buyer_id' => [
                    'sometimes',
                    'required',
                    'integer',
                    'exists:users,id',
                ],

                'agent_id' => [
                    'sometimes',
                    'nullable',
                    'integer',
                    'exists:users,id',
                ],

                'sale_price' => [
                    'sometimes',
                    'numeric',
                    'min:0',
                ],

                'deposit_amount' => [
                    'sometimes',
                    'numeric',
                    'min:0',
                ],

                'discount_amount' => [
                    'sometimes',
                    'numeric',
                    'min:0',
                ],

                'additional_charges' => [
                    'sometimes',
                    'numeric',
                    'min:0',
                ],

                'total_amount' => [
                    'sometimes',
                    'numeric',
                    'min:0',
                ],

                'amount_paid' => [
                    'sometimes',
                    'numeric',
                    'min:0',
                ],

                'balance' => [
                    'sometimes',
                    'numeric',
                    'min:0',
                ],

                'currency' => [
                    'sometimes',
                    'string',
                    'size:3',
                ],

                'sale_type' => [
                    'sometimes',
                    'string',
                    'max:50',
                ],

                'payment_plan' => [
                    'sometimes',
                    'nullable',
                    'string',
                    'max:100',
                ],

                'payment_frequency' => [
                    'sometimes',
                    'nullable',
                    'string',
                    'max:50',
                ],

                'installments' => [
                    'sometimes',
                    'nullable',
                    'integer',
                    'min:1',
                ],

                'installment_amount' => [
                    'sometimes',
                    'nullable',
                    'numeric',
                    'min:0',
                ],

                'sale_date' => [
                    'sometimes',
                    'nullable',
                    'date',
                ],

                'reservation_date' => [
                    'sometimes',
                    'nullable',
                    'date',
                ],

                'expected_completion_date' => [
                    'sometimes',
                    'nullable',
                    'date',
                ],

                'terms_and_conditions' => [
                    'sometimes',
                    'nullable',
                    'string',
                ],

                'notes' => [
                    'sometimes',
                    'nullable',
                    'string',
                ],
            ]);

            $updatedSale = $this->plotSaleService->update(
                $id,
                $data
            );

            return ApiResponse::updated(
                (new PlotSalesResource($updatedSale))->resolve($request),
                'Plot sale updated successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to update plot sale.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DESTROY
    |--------------------------------------------------------------------------
    */

    /**
     * Soft-delete a plot sale.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $sale = $this->plotSaleService->findById($id);

            $this->authorize('delete', $sale);

            $this->plotSaleService->delete($id);

            return ApiResponse::deleted(
                ['id' => $id],
                'Plot sale deleted successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to delete plot sale.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    /**
     * Get plot sales filtered by status.
     */
    public function getByStatus(
        Request $request,
        string $status
    ): JsonResponse {
        try {
            $this->authorize('viewAny', PlotSale::class);

            $request->merge(['status' => $status]);

            $request->validate([
                'status' => [
                    'required',
                    'string',
                    'max:50',
                ],
                'per_page' => [
                    'sometimes',
                    'integer',
                    'min:1',
                    'max:100',
                ],
            ]);

            $sales = $this->plotSaleService->getByStatus(
                $status,
                (int) $request->input('per_page', 15)
            );

            $sales->through(
                fn ($sale) => (new PlotSalesResource($sale))
                    ->resolve($request)
            );

            return ApiResponse::paginated(
                $sales,
                'Plot sales by status fetched successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to fetch plot sales by status.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SALES BY PLOT
    |--------------------------------------------------------------------------
    */

    /**
     * Get sales associated with a plot.
     */
    public function getByPlot(
        Request $request,
        int $plotId
    ): JsonResponse {
        try {
            $this->authorize('viewAny', PlotSale::class);

            $request->validate([
                'per_page' => [
                    'sometimes',
                    'integer',
                    'min:1',
                    'max:100',
                ],
            ]);

            $sales = $this->plotSaleService->getByPlot(
                $plotId,
                (int) $request->input('per_page', 15)
            );

            $sales->through(
                fn ($sale) => (new PlotSalesResource($sale))
                    ->resolve($request)
            );

            return ApiResponse::paginated(
                $sales,
                'Plot sales for this plot fetched successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to fetch sales for this plot.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SALES BY BUYER
    |--------------------------------------------------------------------------
    */

    /**
     * Get sales associated with a buyer.
     */
    public function getByBuyer(
        Request $request,
        int $buyerId
    ): JsonResponse {
        try {
            $this->authorize('viewAny', PlotSale::class);

            $request->validate([
                'per_page' => [
                    'sometimes',
                    'integer',
                    'min:1',
                    'max:100',
                ],
            ]);

            $sales = $this->plotSaleService->getByBuyer(
                $buyerId,
                (int) $request->input('per_page', 15)
            );

            $sales->through(
                fn ($sale) => (new PlotSalesResource($sale))
                    ->resolve($request)
            );

            return ApiResponse::paginated(
                $sales,
                'Plot sales for this buyer fetched successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to fetch sales for this buyer.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | OUTSTANDING SALES
    |--------------------------------------------------------------------------
    */

    /**
     * Get sales with outstanding balances.
     */
    public function outstanding(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', PlotSale::class);

            $request->validate([
                'per_page' => [
                    'sometimes',
                    'integer',
                    'min:1',
                    'max:100',
                ],
            ]);

            $sales = $this->plotSaleService->getOutstanding(
                (int) $request->input('per_page', 15)
            );

            $sales->through(
                fn ($sale) => (new PlotSalesResource($sale))
                    ->resolve($request)
            );

            return ApiResponse::paginated(
                $sales,
                'Outstanding plot sales fetched successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to fetch outstanding plot sales.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Display plot sales statistics.
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewReports', PlotSale::class);

            $filters = $request->only([
                'plot_id',
                'buyer_id',
                'agent_id',
                'status',
                'payment_status',
                'sale_type',
                'currency',
                'date_from',
                'date_to',
                'min_amount',
                'max_amount',
                'outstanding_only',
            ]);

            $statistics = $this->plotSaleService->getStatistics(
                $filters
            );

            return ApiResponse::success(
                $statistics,
                'Plot sales statistics fetched successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to fetch plot sales statistics.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | REPORTS
    |--------------------------------------------------------------------------
    */

    /**
     * Generate plot sales report data.
     */
    public function reports(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewReports', PlotSale::class);

            $filters = $request->only([
                'search',
                'plot_id',
                'buyer_id',
                'agent_id',
                'status',
                'payment_status',
                'sale_type',
                'currency',
                'date_from',
                'date_to',
                'min_amount',
                'max_amount',
                'outstanding_only',
            ]);

            $sales = $this->plotSaleService->getForReport(
                $filters
            );

            return ApiResponse::collection(
                PlotSalesResource::collection($sales),
                'Plot sales report generated successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to generate plot sales report.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | APPROVE
    |--------------------------------------------------------------------------
    */

    /**
     * Approve a plot sale.
     */
    public function approve(
        Request $request,
        int $id
    ): JsonResponse {
        try {
            $sale = $this->plotSaleService->findById($id);

            $this->authorize('approve', $sale);

            $approvedSale = $this->plotSaleService->approve($id);

            return ApiResponse::updated(
                (new PlotSalesResource($approvedSale))->resolve($request),
                'Plot sale approved successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to approve plot sale.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CANCEL
    |--------------------------------------------------------------------------
    */

    /**
     * Cancel a plot sale.
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        try {
            $sale = $this->plotSaleService->findById($id);

            $this->authorize('cancel', $sale);

            $data = $request->validate([
                'reason' => [
                    'nullable',
                    'string',
                    'max:1000',
                ],
            ]);

            $cancelledSale = $this->plotSaleService->cancel(
                $id,
                $data['reason'] ?? null
            );

            return ApiResponse::updated(
                (new PlotSalesResource($cancelledSale))->resolve($request),
                'Plot sale cancelled successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to cancel plot sale.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETE
    |--------------------------------------------------------------------------
    */

    /**
     * Mark a plot sale as completed.
     */
    public function complete(
        Request $request,
        int $id
    ): JsonResponse {
        try {
            $sale = $this->plotSaleService->findById($id);

            $this->authorize('complete', $sale);

            $completedSale = $this->plotSaleService->complete($id);

            return ApiResponse::updated(
                (new PlotSalesResource($completedSale))->resolve($request),
                'Plot sale completed successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to complete plot sale.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE
    |--------------------------------------------------------------------------
    */

    /**
     * Restore a soft-deleted plot sale.
     */
    public function restore(Request $request, int $id): JsonResponse
    {
        try {
            $sale = PlotSale::withTrashed()->findOrFail($id);

            $this->authorize('restore', $sale);

            $restoredSale = $this->plotSaleService->restore($id);

            return ApiResponse::updated(
                (new PlotSalesResource($restoredSale))->resolve($request),
                'Plot sale restored successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to restore plot sale.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete a plot sale.
     */
    public function forceDelete(int $id): JsonResponse
    {
        try {
            $sale = PlotSale::withTrashed()->findOrFail($id);

            $this->authorize('forceDelete', $sale);

            $this->plotSaleService->forceDelete($id);

            return ApiResponse::deleted(
                ['id' => $id],
                'Plot sale permanently deleted successfully.'
            );
        } catch (Throwable $exception) {
            return $this->handleException(
                $exception,
                'Failed to permanently delete plot sale.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | EXCEPTION HANDLING
    |--------------------------------------------------------------------------
    */

    /**
     * Convert exceptions to the standard API response format.
     */
    protected function handleException(
        Throwable $exception,
        string $fallbackMessage
    ): JsonResponse {
        if ($exception instanceof ValidationException) {
            return ApiResponse::validation(
                $exception->errors(),
                'The given data was invalid.'
            );
        }

        if ($exception instanceof AuthorizationException) {
            return ApiResponse::forbidden(
                'You are not authorized to perform this action.'
            );
        }

        if (
            $exception instanceof ModelNotFoundException ||
            $exception instanceof InvalidArgumentException
        ) {
            return ApiResponse::notFound(
                $exception instanceof InvalidArgumentException
                    ? $exception->getMessage()
                    : 'The requested plot sale was not found.'
            );
        }

        report($exception);

        return ApiResponse::serverError(
            $fallbackMessage,
            config('app.debug')
                ? ['exception' => $exception->getMessage()]
                : null
        );
    }
}
