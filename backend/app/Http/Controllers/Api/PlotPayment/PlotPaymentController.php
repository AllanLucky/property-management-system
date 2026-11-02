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
use Illuminate\Support\Facades\DB;
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
     * GET /api/plot-payments
     */
    public function index(Request $request): JsonResponse
    {
        return $this->execute(function () use ($request) {
            $this->authorize('viewAny', PlotPayment::class);

            $payments = $this->plotPaymentService->paginate(
                $this->getFilters($request),
                (int) $request->input('per_page', 15)
            );

            $payments->through(
                fn (PlotPayment $payment) =>
                    (new PlotPaymentResource($payment))->resolve($request)
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
                (new PlotPaymentResource($payment))->resolve($request),
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
                ['plotSale.buyer']
            );

            return ApiResponse::success(
                (new PlotPaymentResource($payment))->resolve($request),
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
     * PUT/PATCH /api/plot-payments/{plotPayment}
     *
     * Updates ordinary payment details.
     * Status changes must use the dedicated status workflow.
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

            $data = $request->validated();

            /*
             * Do not allow ordinary payment editing to confirm
             * or refund a payment.
             */
            if (
                isset($data['status'])
                && in_array(
                    $data['status'],
                    ['completed', 'refunded'],
                    true
                )
            ) {
                throw ValidationException::withMessages([
                    'status' => [
                        'Use the authorized payment verification workflow to complete or refund this payment.',
                    ],
                ]);
            }

            $updatedPayment = $this->plotPaymentService->update(
                $payment->id,
                $data
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
     * GET /api/plot-payments/search
     */
    public function search(Request $request): JsonResponse
    {
        return $this->execute(function () use ($request) {
            $this->authorize('viewAny', PlotPayment::class);

            $validator = Validator::make(
                $request->all(),
                [
                    'search' => ['sometimes', 'nullable', 'string', 'max:255'],
                    'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
                    'plot_sale_id' => ['sometimes', 'integer', 'min:1'],
                    'payment_number' => ['sometimes', 'nullable', 'string', 'max:50'],
                    'receipt_number' => ['sometimes', 'nullable', 'string', 'max:100'],
                    'transaction_reference' => ['sometimes', 'nullable', 'string', 'max:150'],
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
                    'is_active' => ['sometimes', 'nullable', 'boolean'],
                    'payer_name' => ['sometimes', 'nullable', 'string', 'max:150'],
                    'payer_phone' => ['sometimes', 'nullable', 'string', 'max:30'],
                    'payer_email' => ['sometimes', 'nullable', 'email:rfc', 'max:150'],
                    'start_date' => ['sometimes', 'nullable', 'date'],
                    'end_date' => [
                        'sometimes',
                        'nullable',
                        'date',
                        'after_or_equal:start_date',
                    ],
                    'min_amount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                    'max_amount' => ['sometimes', 'nullable', 'numeric', 'gte:min_amount'],
                ]
            );

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            $payments = $this->plotPaymentService->search(
                (string) $request->input('search', ''),
                $this->getFilters($request),
                (int) $request->input('per_page', 15)
            );

            $payments->through(
                fn (PlotPayment $payment) =>
                    (new PlotPaymentResource($payment))->resolve($request)
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
     * GET /api/plot-payments/statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        return $this->execute(function () use ($request) {
            $this->authorize('viewAny', PlotPayment::class);

            $statistics = $this->plotPaymentService
                ->dashboardStatistics($this->getFilters($request));

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
                    (new PlotPaymentResource($payment))->resolve($request)
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
                    (new PlotPaymentResource($payment))->resolve($request)
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
     * PATCH /api/plot-payments/{plotPayment}/status
     *
     * Status transitions:
     * pending -> failed/cancelled
     * failed -> pending
     *
     * Completion and refunds require a trusted verification workflow.
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
                    'verification_reference' => [
                        'sometimes',
                        'nullable',
                        'string',
                        'max:150',
                    ],
                    'verification_notes' => [
                        'sometimes',
                        'nullable',
                        'string',
                        'max:1000',
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

            if (in_array($status, ['completed', 'refunded'], true)) {
                return ApiResponse::forbidden(
                    'Payment completion and refunds must be performed through the authorized verification workflow.'
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
    | Manual Payment Confirmation
    |--------------------------------------------------------------------------
    */

    /**
     * POST /api/plot-payments/{plotPayment}/confirm
     *
     * Manual confirmation for cash, bank, or independently verified
     * payment records. Requires the dedicated confirmation permission.
     */
    public function confirm(
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
                    'verification_reference' => [
                        'required',
                        'string',
                        'max:150',
                    ],
                    'verification_notes' => [
                        'nullable',
                        'string',
                        'max:1000',
                    ],
                ]
            );

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            $payment = $this->plotPaymentService->findOrFail(
                $plotPayment
            );

            /*
             * Define this ability in your PlotPaymentPolicy.
             * Do not replace it with a client-supplied role or flag.
             */
            $this->authorize('confirm', $payment);

            $data = $validator->validated();

            $updatedPayment = DB::transaction(function () use (
                $payment,
                $data
            ) {
                $updated = $this->plotPaymentService->updateStatus(
                    $payment->id,
                    'completed',
                    true
                );

                /*
                 * Add verification audit persistence here if your
                 * database has dedicated audit columns or a log table.
                 * The verification reference must not be discarded.
                 */
                return $updated;
            });

            return ApiResponse::updated(
                (new PlotPaymentResource($updatedPayment))
                    ->resolve($request),
                'Plot payment confirmed successfully.'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Restore
    |--------------------------------------------------------------------------
    */

    /**
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

        return array_filter(
            $filters,
            fn ($value) => $value !== null && $value !== ''
        );
    }

    /**
     * Execute an action using the standard API response format.
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
