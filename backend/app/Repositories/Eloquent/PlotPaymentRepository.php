<?php

namespace App\Repositories\Eloquent;

use App\Models\PlotPayment;
use App\Repositories\Interfaces\PlotPaymentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PlotPaymentRepository implements PlotPaymentRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | Dependencies
    |--------------------------------------------------------------------------
    */

    public function __construct(
        protected PlotPayment $model
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | Relationship Configuration
    |--------------------------------------------------------------------------
    */

    /**
     * Default relationships required by the payment API.
     *
     * Loads the plot sale and its buyer so API resources can access
     * buyer identity and contact information without extra queries.
     */
    protected function defaultRelations(): array
    {
        return [
            'plotSale.buyer',
        ];
    }

    /**
     * Retrieve a payment with all default relationships.
     *
     * Loading explicitly after retrieving the payment also ensures
     * that callers receive a model with the expected relationships.
     */
    protected function loadDefaultRelations(
        PlotPayment $payment
    ): PlotPayment {
        return $payment->load($this->defaultRelations());
    }

    /*
    |--------------------------------------------------------------------------
    | Retrieval
    |--------------------------------------------------------------------------
    */

    /**
     * Get all payments matching the supplied filters.
     */
    public function getAll(array $filters = []): Collection
    {
        return $this->buildQuery($filters)
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Get paginated payments.
     */
    public function paginate(
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator {
        $perPage = max(1, min($perPage, 100));

        return $this->buildQuery($filters)
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Find a payment by ID with its sale and buyer.
     */
    public function findById(int $id): ?PlotPayment
    {
        $payment = $this->model
            ->newQuery()
            ->find($id);

        if (! $payment) {
            return null;
        }

        return $this->loadDefaultRelations($payment);
    }

    /**
     * Find a payment or fail, including its sale and buyer.
     */
    public function findOrFail(int $id): PlotPayment
    {
        $payment = $this->model
            ->newQuery()
            ->findOrFail($id);

        return $this->loadDefaultRelations($payment);
    }

    /**
     * Find a payment by payment number.
     */
    public function findByPaymentNumber(
        string $paymentNumber
    ): ?PlotPayment {
        $payment = $this->model
            ->newQuery()
            ->where('payment_number', $paymentNumber)
            ->first();

        return $payment
            ? $this->loadDefaultRelations($payment)
            : null;
    }

    /**
     * Find a payment by transaction reference.
     */
    public function findByTransactionReference(
        string $reference
    ): ?PlotPayment {
        $payment = $this->model
            ->newQuery()
            ->where('transaction_reference', $reference)
            ->first();

        return $payment
            ? $this->loadDefaultRelations($payment)
            : null;
    }

    /**
     * Search payments by identification, payer, or sale fields.
     */
    public function search(
        string $search,
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator {
        $query = $this->buildQuery($filters);

        $search = trim($search);

        if ($search !== '') {
            $term = '%' . $search . '%';

            $query->where(function (Builder $builder) use ($term) {
                $builder
                    ->where('payment_number', 'like', $term)
                    ->orWhere('receipt_number', 'like', $term)
                    ->orWhere('transaction_reference', 'like', $term)
                    ->orWhere('payer_name', 'like', $term)
                    ->orWhere('payer_phone', 'like', $term)
                    ->orWhere('payer_email', 'like', $term)
                    ->orWhereHas(
                        'plotSale',
                        function (Builder $saleQuery) use ($term) {
                            $saleQuery->where(
                                'sale_number',
                                'like',
                                $term
                            );
                        }
                    )
                    ->orWhereHas(
                        'plotSale.buyer',
                        function (Builder $buyerQuery) use ($term) {
                            $buyerQuery->where(function (
                                Builder $userQuery
                            ) use ($term) {
                                $userQuery
                                    ->where('first_name', 'like', $term)
                                    ->orWhere('last_name', 'like', $term)
                                    ->orWhere('email', 'like', $term)
                                    ->orWhere('phone', 'like', $term);
                            });
                        }
                    );
            });
        }

        return $query
            ->orderByDesc('created_at')
            ->paginate(max(1, min($perPage, 100)))
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | Create and Update
    |--------------------------------------------------------------------------
    */

    /**
     * Create a payment and return it with its sale and buyer.
     */
    public function create(array $data): PlotPayment
    {
        return DB::transaction(function () use ($data) {
            $payment = $this->model
                ->newQuery()
                ->create($data);

            return $this->loadDefaultRelations($payment);
        });
    }

    /**
     * Update a payment and return it with its sale and buyer.
     */
    public function update(
        int $id,
        array $data
    ): PlotPayment {
        return DB::transaction(function () use ($id, $data) {
            $payment = $this->model
                ->newQuery()
                ->lockForUpdate()
                ->findOrFail($id);

            $payment->fill($data);
            $payment->save();

            // Reload the saved record and its relationships.
            $payment->refresh();

            return $this->loadDefaultRelations($payment);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Delete and Restore
    |--------------------------------------------------------------------------
    */

    /**
     * Soft-delete a payment.
     */
    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $payment = $this->model
                ->newQuery()
                ->lockForUpdate()
                ->findOrFail($id);

            return (bool) $payment->delete();
        });
    }

    /**
     * Restore a soft-deleted payment.
     */
    public function restore(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $payment = $this->model
                ->newQuery()
                ->withTrashed()
                ->lockForUpdate()
                ->findOrFail($id);

            if (! $payment->trashed()) {
                return false;
            }

            $restored = (bool) $payment->restore();

            if ($restored) {
                $this->loadDefaultRelations($payment);
            }

            return $restored;
        });
    }

    /**
     * Permanently delete a payment.
     */
    public function forceDelete(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $payment = $this->model
                ->newQuery()
                ->withTrashed()
                ->lockForUpdate()
                ->findOrFail($id);

            return (bool) $payment->forceDelete();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Sale and Status Queries
    |--------------------------------------------------------------------------
    */

    /**
     * Get paginated payments for a particular plot sale.
     */
    public function getBySale(
        int $plotSaleId,
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator {
        $filters['plot_sale_id'] = $plotSaleId;

        return $this->paginate($filters, $perPage);
    }

    /**
     * Get paginated payments by status.
     */
    public function getByStatus(
        string $status,
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator {
        $filters['status'] = $status;

        return $this->paginate($filters, $perPage);
    }

    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    /**
     * Get aggregate payment statistics.
     *
     * Statistics include all non-deleted payments matching the filters,
     * unless with_trashed or only_trashed is requested.
     */
    public function statistics(array $filters = []): array
    {
        $query = $this->buildQuery($filters);

        $total = (clone $query)->count();

        $amounts = (clone $query)
            ->selectRaw('
                COALESCE(SUM(amount), 0) AS total_amount,
                COALESCE(AVG(amount), 0) AS average_amount
            ')
            ->first();

        $statusCounts = (clone $query)
            ->select('status')
            ->selectRaw('COUNT(*) AS total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $methodCounts = (clone $query)
            ->select('payment_method')
            ->selectRaw('COUNT(*) AS total')
            ->groupBy('payment_method')
            ->pluck('total', 'payment_method');

        $typeCounts = (clone $query)
            ->select('payment_type')
            ->selectRaw('COUNT(*) AS total')
            ->groupBy('payment_type')
            ->pluck('total', 'payment_type');

        return [
            'total_payments' => $total,
            'total_amount' => (float) ($amounts->total_amount ?? 0),
            'average_amount' => round(
                (float) ($amounts->average_amount ?? 0),
                2
            ),
            'status_counts' => $statusCounts,
            'payment_method_counts' => $methodCounts,
            'payment_type_counts' => $typeCounts,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Load relationships onto a payment.
     *
     * Custom relationship names remain supported.
     */
    public function loadRelations(
        PlotPayment $payment,
        array $relations = ['plotSale.buyer']
    ): PlotPayment {
        return $payment->load($relations);
    }

    /*
    |--------------------------------------------------------------------------
    | Query Builder
    |--------------------------------------------------------------------------
    */

    /**
     * Build a reusable query using supported filters.
     *
     * Supported filters:
     * plot_sale_id, payment_number, receipt_number,
     * transaction_reference, payment_type, payment_method,
     * status, currency, is_active, payer_name, payer_phone,
     * payer_email, start_date, end_date, min_amount, max_amount,
     * with_trashed, only_trashed.
     */
    public function buildQuery(array $filters = []): Builder
    {
        $query = $this->model
            ->newQuery()
            ->with($this->defaultRelations());

        /*
        |--------------------------------------------------------------------------
        | Soft-Deleted Records
        |--------------------------------------------------------------------------
        */

        if (! empty($filters['only_trashed'])) {
            $query->onlyTrashed();
        } elseif (! empty($filters['with_trashed'])) {
            $query->withTrashed();
        }

        /*
        |--------------------------------------------------------------------------
        | Exact-Match Filters
        |--------------------------------------------------------------------------
        */

        foreach ([
            'plot_sale_id',
            'payment_number',
            'receipt_number',
            'transaction_reference',
            'payment_type',
            'payment_method',
            'status',
            'currency',
            'is_active',
        ] as $field) {
            if (
                array_key_exists($field, $filters)
                && $filters[$field] !== null
                && $filters[$field] !== ''
            ) {
                $query->where($field, $filters[$field]);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Payer Filters
        |--------------------------------------------------------------------------
        */

        foreach ([
            'payer_name',
            'payer_phone',
            'payer_email',
        ] as $field) {
            if (
                isset($filters[$field])
                && $filters[$field] !== ''
            ) {
                $query->where(
                    $field,
                    'like',
                    '%' . $filters[$field] . '%'
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Date Filters
        |--------------------------------------------------------------------------
        */

        if (! empty($filters['start_date'])) {
            $query->whereDate(
                'payment_date',
                '>=',
                $filters['start_date']
            );
        }

        if (! empty($filters['end_date'])) {
            $query->whereDate(
                'payment_date',
                '<=',
                $filters['end_date']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Amount Filters
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['min_amount'])
            && $filters['min_amount'] !== ''
        ) {
            $query->where(
                'amount',
                '>=',
                $filters['min_amount']
            );
        }

        if (
            isset($filters['max_amount'])
            && $filters['max_amount'] !== ''
        ) {
            $query->where(
                'amount',
                '<=',
                $filters['max_amount']
            );
        }

        return $query;
    }
}
