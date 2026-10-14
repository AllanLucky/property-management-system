<?php

namespace App\Http\Controllers\Api\PlotPayment;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\PlotPayment\StorePlotPaymentRequest;
use App\Http\Requests\PlotPayment\UpdatePlotPaymentRequest;
use App\Http\Resources\PlotPaymentResource;
use App\Models\PlotPayment;
use App\Services\PlotPaymentService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class PlotPaymentController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Dependencies
    |--------------------------------------------------------------------------
    */

    public function __construct(
        protected PlotPaymentService $plotPaymentService
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | Index
    |--------------------------------------------------------------------------
    */

    /**
     * Display paginated plot payments.
     *
     * GET /api/plot-payments
     */
    public function index(Request $request): JsonResponse
    {
        return $this->execute(function () use ($request) {
            $this->authorize('viewAny', PlotPayment::class);

            $filters = $this->getFilters($request);

            $perPage = (int) $request->input('per_page', 15);

            $payments = $this->plotPaymentService->paginate(
                $filters,
                $perPage
            );

            $payments->through(
                fn (PlotPayment $payment) =>
                    (new PlotPaymentResource($payment))
                        ->resolve($request)
            );

            return ApiResponse::paginated(
                $payments,
                'Plot payments retrieved successfully.'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Store
    |--------------------------------------------------------------------------
    */

    /**
     * Create a plot payment.
     *
     * POST /api/plot-payments
     */
    public function store(
        StorePlotPaymentRequest $request
    ): JsonResponse {
        return $this->execute(function () use ($request) {
            $this->authorize('create', PlotPayment::class);

            $payment = $this->plotPaymentService->create(
                $request->validated()
            );

            return ApiResponse::created(
                (new PlotPaymentResource($payment))
                    ->resolve($request),
                'Plot payment created successfully.'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Show
    |--------------------------------------------------------------------------
    */

    /**
     * Display a specific plot payment.
     *
     * GET /api/plot-payments/{plotPayment}
     */
    public function show(
        Request $request,
        int $plotPayment
    ): JsonResponse {
        return $this->execute(function () use (
            $request,
            $plotPayment
        ) {
            $payment = $this->plotPaymentService->findOrFail(
                $plotPayment
            );

            $this->authorize('view', $payment);

            $payment = $this->plotPaymentService->loadRelations(
                $payment,
                ['plotSale']
            );

            return ApiResponse::success(
                (new PlotPaymentResource($payment))
                    ->resolve($request),
                'Plot payment retrieved successfully.'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    /**
     * Update an existing plot payment.
     *
     * PUT/PATCH /api/plot-payments/{plotPayment}
     */
    public function update(
        UpdatePlotPaymentRequest $request,
        int $plotPayment
    ): JsonResponse {
        return $this->execute(function () use (
            $request,
            $plotPayment
        ) {
            $payment = $this->plotPaymentService->findOrFail(
                $plotPayment
            );

            $this->authorize('update', $payment);

            $updatedPayment = $this->plotPaymentService->update(
                $payment->id,
                $request->validated()
            );

            return ApiResponse::updated(
                (new PlotPaymentResource($updatedPayment))
                    ->resolve($request),
                'Plot payment updated successfully.'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    /**
     * Soft-delete a plot payment.
     *
     * DELETE /api/plot-payments/{plotPayment}
     */
    public function destroy(int $plotPayment): JsonResponse
    {
        return $this->execute(function () use ($plotPayment) {
            $payment = $this->plotPaymentService->findOrFail(
                $plotPayment
            );

            $this->authorize('delete', $payment);

            $this->plotPaymentService->delete($payment->id);

            return ApiResponse::deleted(
                [
                    'id' => $payment->id,
                    'payment_number' => $payment->payment_number,
                ],
                'Plot payment deleted successfully.'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    /**
     * Search and filter plot payments.
     *
     * GET /api/plot-payments/search
     */
    public function search(Request $request): JsonResponse
    {
        return $this->execute(function () use ($request) {
            $this->authorize('viewAny', PlotPayment::class);

            $validator = Validator::make(
                $request->all(),
                [
                    'search' => [
                        'sometimes',
                        'nullable',
                        'string',
                        'max:255',
                    ],
                    'per_page' => [
                        'sometimes',
                        'integer',
                        'min:1',
                        'max:100',
                    ],
                    'plot_sale_id' => [
                        'sometimes',
                        'integer',
                        'min:1',
                    ],
                    'payment_number' => [
                        'sometimes',
                        'nullable',
                        'string',
                        'max:50',
                    ],
                    'receipt_number' => [
                        'sometimes',
                        'nullable',
                        'string',
                        'max:100',
                    ],
                    'transaction_reference' => [
                        'sometimes',
                        'nullable',
                        'string',
                        'max:150',
                    ],
                    'payment_type' => [
                        'sometimes',
                        'nullable',
                        'in:deposit,installment,balance,full_payment,other',
                    ],
                    'payment_method' => [
                        'sometimes',
                        'nullable',
                        'in:mpesa,bank_transfer,cash,card,cheque,online,other',
                    ],
                    'status' => [
                        'sometimes',
                        'nullable',
                        'in:pending,completed,failed,cancelled,refunded',
                    ],
                    'currency' => [
                        'sometimes',
                        'nullable',
                        'string',
                        'size:3',
                        'regex:/^[A-Z]{3}$/',
                    ],
                    'is_active' => [
                        'sometimes',
                        'nullable',
                        'boolean',
                    ],
                    'payer_name' => [
                        'sometimes',
                        'nullable',
                        'string',
                        'max:150',
                    ],
                    'payer_phone' => [
                        'sometimes',
                        'nullable',
                        'string',
                        'max:30',
                    ],
                    'payer_email' => [
                        'sometimes',
                        'nullable',
                        'email:rfc',
                        'max:150',
                    ],
                    'start_date' => [
                        'sometimes',
                        'nullable',
                        'date',
                    ],
                    'end_date' => [
                        'sometimes',
                        'nullable',
                        'date',
                        'after_or_equal:start_date',
                    ],
                    'min_amount' => [
                        'sometimes',
                        'nullable',
                        'numeric',
                        'min:0',
                    ],
                    'max_amount' => [
                        'sometimes',
                        'nullable',
                        'numeric',
                        'gte:min_amount',
                    ],
                ]
            );

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            $filters = $this->getFilters($request);

            $payments = $this->plotPaymentService->search(
                (string) $request->input('search', ''),
                $filters,
                (int) $request->input('per_page', 15)
            );

            $payments->through(
                fn (PlotPayment $payment) =>
                    (new PlotPaymentResource($payment))
                        ->resolve($request)
            );

            return ApiResponse::paginated(
                $payments,
                'Plot payment search completed successfully.'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    /**
     * Get plot payment statistics.
     *
     * GET /api/plot-payments/statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        return $this->execute(function () use ($request) {
            $this->authorize('viewAny', PlotPayment::class);

            $filters = $this->getFilters($request);

            $statistics = $this->plotPaymentService
                ->dashboardStatistics($filters);

            return ApiResponse::success(
                $statistics,
                'Plot payment statistics retrieved successfully.'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Payments By Sale
    |--------------------------------------------------------------------------
    */

    /**
     * Get payments for a specific plot sale.
     *
     * GET /api/plot-payments/sale/{plotSaleId}
     */
    public function bySale(
        Request $request,
        int $plotSaleId
    ): JsonResponse {
        return $this->execute(function () use (
            $request,
            $plotSaleId
        ) {
            $this->authorize('viewAny', PlotPayment::class);

            $payments = $this->plotPaymentService->getBySale(
                $plotSaleId,
                $this->getFilters($request),
                (int) $request->input('per_page', 15)
            );

            $payments->through(
                fn (PlotPayment $payment) =>
                    (new PlotPaymentResource($payment))
                        ->resolve($request)
            );

            return ApiResponse::paginated(
                $payments,
                'Plot sale payments retrieved successfully.'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Payments By Status
    |--------------------------------------------------------------------------
    */

    /**
     * Get payments by status.
     *
     * GET /api/plot-payments/status/{status}
     */
    public function byStatus(
        Request $request,
        string $status
    ): JsonResponse {
        return $this->execute(function () use (
            $request,
            $status
        ) {
            $this->authorize('viewAny', PlotPayment::class);

            $payments = $this->plotPaymentService->getByStatus(
                $status,
                $this->getFilters($request),
                (int) $request->input('per_page', 15)
            );

            $payments->through(
                fn (PlotPayment $payment) =>
                    (new PlotPaymentResource($payment))
                        ->resolve($request)
            );

            return ApiResponse::paginated(
                $payments,
                'Payments filtered by status successfully.'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Update Payment Status
    |--------------------------------------------------------------------------
    */

    /**
     * Update a payment status through the authorized workflow.
     *
     * PATCH /api/plot-payments/{plotPayment}/status
     *
     * This endpoint does not accept a client-supplied verification flag.
     * Completion and refund verification must come from a trusted backend
     * payment integration or a separate verified administrative workflow.
     */
    public function updateStatus(
        Request $request,
        int $plotPayment
    ): JsonResponse {
        return $this->execute(function () use (
            $request,
            $plotPayment
        ) {
            $validator = Validator::make(
                $request->all(),
                [
                    'status' => [
                        'required',
                        'string',
                        'in:pending,completed,failed,cancelled,refunded',
                    ],
                ]
            );

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            $payment = $this->plotPaymentService->findOrFail(
                $plotPayment
            );

            $this->authorize('updateStatus', $payment);

            $status = $validator->validated()['status'];

            // Never trust a verification flag supplied by the client.
            // This public API operation cannot complete or refund payments.
            if (in_array($status, ['completed', 'refunded'], true)) {
                return ApiResponse::forbidden(
                    'Payment completion and refunds require a trusted verification workflow.'
                );
            }

            $updatedPayment = $this->plotPaymentService->updateStatus(
                $payment->id,
                $status
            );

            return ApiResponse::updated(
                (new PlotPaymentResource($updatedPayment))
                    ->resolve($request),
                'Plot payment status updated successfully.'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Restore
    |--------------------------------------------------------------------------
    */

    /**
     * Restore a soft-deleted payment.
     *
     * POST /api/plot-payments/{plotPayment}/restore
     */
    public function restore(int $plotPayment): JsonResponse
    {
        return $this->execute(function () use ($plotPayment) {
            $payment = PlotPayment::withTrashed()
                ->findOrFail($plotPayment);

            $this->authorize('restore', $payment);

            $restored = $this->plotPaymentService->restore(
                $payment->id
            );

            if (! $restored) {
                return ApiResponse::conflict(
                    'The plot payment is not deleted or could not be restored.'
                );
            }

            $restoredPayment = $this->plotPaymentService->findOrFail(
                $payment->id
            );

            return ApiResponse::updated(
                (new PlotPaymentResource($restoredPayment))
                    ->resolve(request()),
                'Plot payment restored successfully.'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Force Delete
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete a payment.
     *
     * DELETE /api/plot-payments/{plotPayment}/force
     */
    public function forceDelete(int $plotPayment): JsonResponse
    {
        return $this->execute(function () use ($plotPayment) {
            $payment = PlotPayment::withTrashed()
                ->findOrFail($plotPayment);

            $this->authorize('forceDelete', $payment);

            $deleted = $this->plotPaymentService->forceDelete(
                $payment->id
            );

            if (! $deleted) {
                return ApiResponse::conflict(
                    'The plot payment could not be permanently deleted.'
                );
            }

            return ApiResponse::deleted(
                [
                    'id' => $payment->id,
                    'payment_number' => $payment->payment_number,
                ],
                'Plot payment permanently deleted successfully.'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Private Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Collect supported query filters.
     *
     * Only recognized filters are passed to the repository.
     */
    private function getFilters(Request $request): array
    {
        $filters = $request->only([
            'plot_sale_id',
            'payment_number',
            'receipt_number',
            'transaction_reference',
            'payment_type',
            'payment_method',
            'status',
            'currency',
            'is_active',
            'payer_name',
            'payer_phone',
            'payer_email',
            'start_date',
            'end_date',
            'min_amount',
            'max_amount',
        ]);

        // Never let query parameters enable access to deleted records.
        unset(
            $filters['with_trashed'],
            $filters['only_trashed']
        );

        return array_filter(
            $filters,
            fn ($value) => $value !== null && $value !== ''
        );
    }

    /**
     * Execute a controller action using the standard ApiResponse format.
     */
    private function execute(callable $callback): JsonResponse
    {
        try {
            return $callback();
        } catch (ValidationException $exception) {
            return ApiResponse::validation(
                $exception->errors(),
                'The supplied data failed validation.'
            );
        } catch (AuthorizationException $exception) {
            return ApiResponse::forbidden(
                'You are not authorized to perform this action.'
            );
        } catch (ModelNotFoundException $exception) {
            return ApiResponse::notFound(
                'The requested plot payment or related record was not found.'
            );
        } catch (Throwable $exception) {
            report($exception);

            if ($exception instanceof HttpExceptionInterface) {
                $status = $exception->getStatusCode();

                if ($status === 401) {
                    return ApiResponse::unauthorized();
                }

                if ($status === 403) {
                    return ApiResponse::forbidden();
                }

                if ($status === 404) {
                    return ApiResponse::notFound();
                }

                if ($status === 409) {
                    return ApiResponse::conflict(
                        'The request conflicts with the current resource state.'
                    );
                }
            }

            return ApiResponse::serverError(
                'An unexpected error occurred while processing the plot payment.'
            );
        }
    }
}
