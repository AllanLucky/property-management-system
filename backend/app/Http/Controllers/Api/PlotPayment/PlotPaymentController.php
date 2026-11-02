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
use Illuminate\Support\Facades\Log;
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

            $filters = $this->validateFilters($request);

            $perPage = $this->getPerPage($request);

            $payments = $this->plotPaymentService->paginate(
                $filters,
                $perPage
            );

            Log::info('Plot payment index retrieved.', [
                'database' => DB::connection()->getDatabaseName(),
                'filters' => $filters,
                'total' => $payments->total(),
                'current_page' => $payments->currentPage(),
                'per_page' => $payments->perPage(),
            ]);

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
     * Completion and refunds require dedicated workflows.
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
                $request->query(),
                array_merge(
                    $this->filterRules(),
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
                    ]
                )
            );

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            $validated = $validator->validated();

            $search = trim((string) ($validated['search'] ?? ''));

            $filters = $this->extractValidatedFilters($validated);

            $payments = $this->plotPaymentService->search(
                $search,
                $filters,
                $this->getPerPage($request)
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

            $filters = $this->validateFilters($request);

            $statistics = $this->plotPaymentService
                ->dashboardStatistics($filters);

            Log::info('Plot payment statistics retrieved.', [
                'database' => DB::connection()->getDatabaseName(),
                'filters' => $filters,
                'total_payments' => $statistics['total_payments'] ?? 0,
                'total_amount' => $statistics['total_amount'] ?? 0,
            ]);

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

            $filters = $this->validateFilters($request);

            // The route parameter must take priority over query filters.
            $filters['plot_sale_id'] = $plotSaleId;

            $payments = $this->plotPaymentService->getBySale(
                $plotSaleId,
                $filters,
                $this->getPerPage($request)
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

            $statusValidator = Validator::make(
                ['status' => $status],
                [
                    'status' => [
                        'required',
                        'in:pending,completed,failed,cancelled,refunded',
                    ],
                ]
            );

            if ($statusValidator->fails()) {
                throw new ValidationException($statusValidator);
            }

            $filters = $this->validateFilters($request);

            // The route status must take priority over query filters.
            $filters['status'] = $status;

            $payments = $this->plotPaymentService->getByStatus(
                $status,
                $filters,
                $this->getPerPage($request)
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
     * Allowed ordinary transitions:
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
     * Requires the dedicated confirmation permission.
     * The reference and notes are validated but are not persisted
     * unless a dedicated audit mechanism is implemented.
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

            $this->authorize('confirm', $payment);

            $data = $validator->validated();

            $updatedPayment = DB::transaction(function () use (
                $payment,
                $data
            ) {
                // Re-fetch and lock the payment inside the transaction.
                $lockedPayment = PlotPayment::query()
                    ->lockForUpdate()
                    ->findOrFail($payment->id);

                if ($lockedPayment->status === 'completed') {
                    throw ValidationException::withMessages([
                        'status' => [
                            'This payment has already been completed.',
                        ],
                    ]);
                }

                $updated = $this->plotPaymentService->updateStatus(
                    $lockedPayment->id,
                    'completed',
                    true
                );

                Log::info('Plot payment manually confirmed.', [
                    'payment_id' => $updated->id,
                    'payment_number' => $updated->payment_number,
                    'verification_reference' => $data['verification_reference'],
                    'verification_notes' => $data['verification_notes'] ?? null,
                ]);

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
     * Validation rules shared by listing and filtering endpoints.
     */
    private function filterRules(): array
    {
        return [
            'plot_sale_id' => [
                'sometimes',
                'nullable',
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
        ];
    }

    /**
     * Validate query filters.
     */
    private function validateFilters(Request $request): array
    {
        $validator = Validator::make(
            $request->query(),
            $this->filterRules()
        );

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $this->extractValidatedFilters(
            $validator->validated()
        );
    }

    /**
     * Remove pagination and empty values from validated filters.
     */
    private function extractValidatedFilters(array $validated): array
    {
        unset($validated['per_page'], $validated['search']);

        return array_filter(
            $validated,
            fn ($value) => $value !== null && $value !== ''
        );
    }

    /**
     * Get a safe pagination size.
     */
    private function getPerPage(Request $request): int
    {
        return max(
            1,
            min((int) $request->input('per_page', 15), 100)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Standard API Error Handling
    |--------------------------------------------------------------------------
    */

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
