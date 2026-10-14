<?php

namespace App\Services;

use App\Models\PlotPayment;
use App\Models\PlotSale;
use App\Repositories\Interfaces\PlotPaymentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PlotPaymentService
{
    /*
    |--------------------------------------------------------------------------
    | Dependencies
    |--------------------------------------------------------------------------
    */

    public function __construct(
        protected PlotPaymentRepositoryInterface $paymentRepository
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | Retrieve Payments
    |--------------------------------------------------------------------------
    */

    /**
     * Get all payments matching the supplied filters.
     */
    public function getAll(array $filters = []): Collection
    {
        return $this->paymentRepository->getAll($filters);
    }

    /**
     * Get paginated payments.
     */
    public function paginate(
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator {
        return $this->paymentRepository->paginate(
            $filters,
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Find a payment by ID, including its sale and buyer.
     */
    public function findById(int $id): ?PlotPayment
    {
        $payment = $this->paymentRepository->findById($id);

        if (! $payment) {
            return null;
        }

        return $this->loadRelations($payment);
    }

    /**
     * Find a payment or throw a model-not-found exception.
     */
    public function findOrFail(int $id): PlotPayment
    {
        $payment = $this->paymentRepository->findOrFail($id);

        return $this->loadRelations($payment);
    }

    /**
     * Find a payment by payment number.
     */
    public function findByPaymentNumber(
        string $paymentNumber
    ): ?PlotPayment {
        $payment = $this->paymentRepository
            ->findByPaymentNumber($paymentNumber);

        return $payment
            ? $this->loadRelations($payment)
            : null;
    }

    /**
     * Find a payment by transaction reference.
     */
    public function findByTransactionReference(
        string $reference
    ): ?PlotPayment {
        $payment = $this->paymentRepository
            ->findByTransactionReference($reference);

        return $payment
            ? $this->loadRelations($payment)
            : null;
    }

    /*
    |--------------------------------------------------------------------------
    | Search and Filters
    |--------------------------------------------------------------------------
    */

    /**
     * Search payments using repository filters.
     */
    public function search(
        string $search,
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator {
        return $this->paymentRepository->search(
            trim($search),
            $filters,
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Get payments belonging to a particular plot sale.
     */
    public function getBySale(
        int $plotSaleId,
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator {
        $this->ensureSaleExists($plotSaleId);

        return $this->paymentRepository->getBySale(
            $plotSaleId,
            $filters,
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Get payments by status.
     */
    public function getByStatus(
        string $status,
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator {
        $allowedStatuses = [
            'pending',
            'completed',
            'failed',
            'cancelled',
            'refunded',
        ];

        if (! in_array($status, $allowedStatuses, true)) {
            throw ValidationException::withMessages([
                'status' => [
                    'The selected payment status is invalid.',
                ],
            ]);
        }

        return $this->paymentRepository->getByStatus(
            $status,
            $filters,
            $this->normalizePerPage($perPage)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Create Payment
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new pending plot payment.
     *
     * Completion must be handled by a trusted payment verification workflow.
     */
    public function create(array $data): PlotPayment
    {
        return DB::transaction(function () use ($data) {
            $plotSaleId = (int) ($data['plot_sale_id'] ?? 0);

            $this->ensureSaleExists($plotSaleId);

            $data = $this->prepareCreateData($data);

            $data['payment_number'] = $this->resolvePaymentNumber(
                $data['payment_number'] ?? null
            );

            $data['status'] = 'pending';
            $data['currency'] = strtoupper(
                $data['currency'] ?? 'KES'
            );
            $data['payment_date'] = $data['payment_date']
                ?? now()->toDateString();
            $data['is_active'] = $data['is_active'] ?? true;

            $payment = $this->paymentRepository->create($data);

            return $this->loadRelations($payment);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Update Payment
    |--------------------------------------------------------------------------
    */

    /**
     * Update an editable payment without changing its sale or status.
     */
    public function update(
        int $id,
        array $data
    ): PlotPayment {
        return DB::transaction(function () use ($id, $data) {
            $payment = $this->paymentRepository->findOrFail($id);

            $this->ensurePaymentIsEditable($payment);

            if (
                array_key_exists('plot_sale_id', $data)
                && (int) $data['plot_sale_id']
                    !== (int) $payment->plot_sale_id
            ) {
                throw ValidationException::withMessages([
                    'plot_sale_id' => [
                        'A payment cannot be reassigned to another plot sale.',
                    ],
                ]);
            }

            // These fields are managed by trusted backend workflows.
            unset(
                $data['plot_sale_id'],
                $data['payment_number'],
                $data['status']
            );

            if (isset($data['currency'])) {
                $data['currency'] = strtoupper($data['currency']);
            }

            $payment = $this->paymentRepository->update($id, $data);

            return $this->loadRelations($payment);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Status
    |--------------------------------------------------------------------------
    */

    /**
     * Update payment status through a controlled workflow.
     *
     * The caller must verify completed/refunded transitions using a
     * trusted payment provider or other authorized financial process.
     */
    public function updateStatus(
        int $id,
        string $status,
        bool $verifiedByTrustedSource = false
    ): PlotPayment {
        $allowedStatuses = [
            'pending',
            'completed',
            'failed',
            'cancelled',
            'refunded',
        ];

        if (! in_array($status, $allowedStatuses, true)) {
            throw ValidationException::withMessages([
                'status' => [
                    'The selected payment status is invalid.',
                ],
            ]);
        }

        if (
            in_array($status, ['completed', 'refunded'], true)
            && ! $verifiedByTrustedSource
        ) {
            throw ValidationException::withMessages([
                'status' => [
                    'This status requires a trusted payment verification workflow.',
                ],
            ]);
        }

        return DB::transaction(function () use ($id, $status) {
            $payment = $this->paymentRepository->findOrFail($id);

            $currentStatus = $payment->status;

            $transitions = [
                'pending' => [
                    'completed',
                    'failed',
                    'cancelled',
                ],
                'failed' => [
                    'pending',
                ],
                'completed' => [
                    'refunded',
                ],
                'cancelled' => [],
                'refunded' => [],
            ];

            if ($currentStatus === $status) {
                return $this->loadRelations($payment);
            }

            if (! in_array(
                $status,
                $transitions[$currentStatus] ?? [],
                true
            )) {
                throw ValidationException::withMessages([
                    'status' => [
                        "The payment cannot transition from {$currentStatus} to {$status}.",
                    ],
                ]);
            }

            $payment = $this->paymentRepository->update(
                $id,
                ['status' => $status]
            );

            return $this->loadRelations($payment);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Statistics
    |--------------------------------------------------------------------------
    */

    /**
     * Get payment statistics.
     */
    public function statistics(array $filters = []): array
    {
        return $this->paymentRepository->statistics($filters);
    }

    /**
     * Get payment dashboard statistics.
     */
    public function dashboardStatistics(
        array $filters = []
    ): array {
        $statistics = $this->paymentRepository->statistics($filters);

        $statusCounts = $statistics['status_counts'];

        $statistics['pending_payments'] = (int) (
            $statusCounts['pending'] ?? 0
        );

        $statistics['completed_payments'] = (int) (
            $statusCounts['completed'] ?? 0
        );

        $statistics['failed_payments'] = (int) (
            $statusCounts['failed'] ?? 0
        );

        $statistics['cancelled_payments'] = (int) (
            $statusCounts['cancelled'] ?? 0
        );

        $statistics['refunded_payments'] = (int) (
            $statusCounts['refunded'] ?? 0
        );

        return $statistics;
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
            $payment = $this->paymentRepository->findOrFail($id);

            $this->ensurePaymentCanBeDeleted($payment);

            return $this->paymentRepository->delete($id);
        });
    }

    /**
     * Restore a soft-deleted payment.
     */
    public function restore(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            return $this->paymentRepository->restore($id);
        });
    }

    /**
     * Permanently delete a payment.
     *
     * Restrict this operation to explicitly authorized administrators.
     */
    public function forceDelete(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $payment = $this->paymentRepository->findOrFail($id);

            $this->ensurePaymentCanBeDeleted($payment);

            return $this->paymentRepository->forceDelete($id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Relationship Loading
    |--------------------------------------------------------------------------
    */

    /**
     * Load the payment's sale and buyer.
     *
     * The default deliberately includes plotSale.buyer so the single
     * payment response has the same nested buyer data as the list API.
     */
    public function loadRelations(
        PlotPayment $payment,
        array $relations = ['plotSale.buyer']
    ): PlotPayment {
        return $this->paymentRepository->loadRelations(
            $payment,
            $relations
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Number Generation
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a unique payment number.
     *
     * Format: PAY-YYYYMMDD-XXXXXX
     */
    public function generatePaymentNumber(): string
    {
        return $this->resolvePaymentNumber(null);
    }

    /**
     * Resolve a supplied or generated payment number.
     */
    protected function resolvePaymentNumber(
        ?string $paymentNumber
    ): string {
        if (
            $paymentNumber !== null
            && trim($paymentNumber) !== ''
        ) {
            $paymentNumber = trim($paymentNumber);

            if (
                $this->paymentRepository
                    ->findByPaymentNumber($paymentNumber)
            ) {
                throw ValidationException::withMessages([
                    'payment_number' => [
                        'This payment number has already been used.',
                    ],
                ]);
            }

            return $paymentNumber;
        }

        for ($attempt = 0; $attempt < 10; $attempt++) {
            $number = sprintf(
                'PAY-%s-%s',
                now()->format('Ymd'),
                strtoupper(Str::random(6))
            );

            if (
                ! $this->paymentRepository
                    ->findByPaymentNumber($number)
            ) {
                return $number;
            }
        }

        throw ValidationException::withMessages([
            'payment_number' => [
                'Unable to generate a unique payment number. Please try again.',
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Validation Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Ensure the referenced plot sale exists.
     */
    protected function ensureSaleExists(int $plotSaleId): void
    {
        if (
            $plotSaleId <= 0
            || ! PlotSale::query()->whereKey($plotSaleId)->exists()
        ) {
            throw ValidationException::withMessages([
                'plot_sale_id' => [
                    'The selected plot sale does not exist or is unavailable.',
                ],
            ]);
        }
    }

    /**
     * Prevent editing finalized payment records.
     */
    protected function ensurePaymentIsEditable(
        PlotPayment $payment
    ): void {
        if (in_array(
            $payment->status,
            ['completed', 'refunded'],
            true
        )) {
            throw ValidationException::withMessages([
                'payment' => [
                    'Completed or refunded payments cannot be edited. Use the appropriate financial adjustment workflow.',
                ],
            ]);
        }
    }

    /**
     * Prevent deleting finalized financial records.
     */
    protected function ensurePaymentCanBeDeleted(
        PlotPayment $payment
    ): void {
        if (in_array(
            $payment->status,
            ['completed', 'refunded'],
            true
        )) {
            throw ValidationException::withMessages([
                'payment' => [
                    'Completed or refunded payments cannot be deleted.',
                ],
            ]);
        }
    }

    /**
     * Prepare and normalize creation data.
     */
    protected function prepareCreateData(array $data): array
    {
        if (
            isset($data['payment_number'])
            && trim($data['payment_number']) === ''
        ) {
            $data['payment_number'] = null;
        }

        if (isset($data['currency'])) {
            $data['currency'] = strtoupper($data['currency']);
        }

        // New payments must start pending.
        $data['status'] = 'pending';

        return $data;
    }

    /**
     * Normalize pagination limits.
     */
    protected function normalizePerPage(int $perPage): int
    {
        return max(1, min($perPage, 100));
    }
}
