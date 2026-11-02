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
    | Constants
    |--------------------------------------------------------------------------
    */

    protected const PAYMENT_STATUSES = [
        'pending',
        'completed',
        'failed',
        'cancelled',
        'refunded',
    ];

    protected const STATUS_TRANSITIONS = [
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

    protected const PAYMENT_NUMBER_PREFIX = 'PAY';

    protected const RECEIPT_NUMBER_PREFIX = 'RCP';

    protected const DEFAULT_CURRENCY = 'KES';

    protected const DEFAULT_PER_PAGE = 15;

    protected const MAX_PER_PAGE = 100;

    protected const IDENTIFIER_ATTEMPTS = 10;

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
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        return $this->paymentRepository->paginate(
            $filters,
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Find a payment by ID.
     */
    public function findById(int $id): ?PlotPayment
    {
        $payment = $this->paymentRepository->findById($id);

        return $payment
            ? $this->loadRelations($payment)
            : null;
    }

    /**
     * Find a payment or throw an exception.
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
     * Search payments.
     */
    public function search(
        string $search,
        array $filters = [],
        int $perPage = self::DEFAULT_PER_PAGE
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
        int $perPage = self::DEFAULT_PER_PAGE
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
        int $perPage = self::DEFAULT_PER_PAGE
    ): LengthAwarePaginator {
        $status = strtolower(trim($status));

        $this->validateStatus($status);

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
     * Payment and receipt numbers are generated automatically.
     * New payments always start as pending.
     *
     * Completion must happen through a trusted verification workflow.
     */
    public function create(array $data): PlotPayment
    {
        return DB::transaction(function () use ($data) {

            $plotSaleId = (int) ($data['plot_sale_id'] ?? 0);

            $this->ensureSaleExists($plotSaleId);

            /*
             * Normalize incoming creation data.
             */
            $data = $this->prepareCreateData($data);

            /*
             * Always generate payment and receipt numbers
             * on the backend.
             *
             * Client-supplied identifiers are never trusted.
             */
            $data['payment_number'] = $this->generatePaymentNumber();

            $data['receipt_number'] = $this->generateReceiptNumber();

            /*
             * New payments must always start pending.
             */
            $data['status'] = PlotPayment::STATUS_PENDING;

            $data['currency'] = strtoupper(
                $data['currency'] ?? self::DEFAULT_CURRENCY
            );

            $data['payment_date'] = $data['payment_date'] ?? now();

            $data['is_active'] = $data['is_active'] ?? true;

            /*
             * Create payment.
             *
             * PlotPayment model events provide an additional
             * safeguard for automatic identifier generation.
             */
            $payment = $this->paymentRepository->create($data);

            /*
             * Retrieve the latest saved payment.
             */
            $payment = $this->paymentRepository->findOrFail(
                $payment->id
            );

            return $this->loadRelations($payment);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Update Payment
    |--------------------------------------------------------------------------
    */

    /**
     * Update payment details.
     *
     * Payment numbers and receipt numbers are immutable.
     * Status changes are handled through updateStatus().
     *
     * Completed and refunded payments cannot be edited through
     * the ordinary update workflow.
     */
    public function update(
        int $id,
        array $data,
        bool $verifiedByTrustedSource = false
    ): PlotPayment {
        return DB::transaction(function () use (
            $id,
            $data,
            $verifiedByTrustedSource
        ) {

            /*
             * Lock payment to prevent concurrent modifications.
             */
            $payment = PlotPayment::query()
                ->lockForUpdate()
                ->findOrFail($id);

            $this->ensurePaymentIsEditable($payment);

            /*
             * Prevent moving a payment to another plot sale.
             */
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

            /*
             * Capture requested status before removing protected fields.
             */
            $requestedStatus = array_key_exists('status', $data)
                ? strtolower(trim((string) $data['status']))
                : null;

            /*
             * Payment identifiers are immutable.
             *
             * They must never be regenerated or manually changed
             * during ordinary payment updates.
             */
            unset(
                $data['plot_sale_id'],
                $data['payment_number'],
                $data['receipt_number'],
                $data['status']
            );

            /*
             * Normalize currency.
             */
            if (isset($data['currency'])) {
                $data['currency'] = strtoupper($data['currency']);
            }

            /*
             * Update ordinary payment details.
             */
            if (! empty($data)) {
                $this->paymentRepository->update($id, $data);
            }

            /*
             * Handle status separately.
             */
            if (
                $requestedStatus !== null
                && $requestedStatus !== $payment->status
            ) {
                $this->updateStatus(
                    $id,
                    $requestedStatus,
                    $verifiedByTrustedSource
                );
            }

            /*
             * Always return the latest database record.
             */
            $payment = $this->paymentRepository->findOrFail($id);

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
     * Completed and refunded statuses require trusted verification.
     */
    public function updateStatus(
        int $id,
        string $status,
        bool $verifiedByTrustedSource = false
    ): PlotPayment {
        $status = strtolower(trim($status));

        $this->validateStatus($status);

        if (
            in_array($status, [
                PlotPayment::STATUS_COMPLETED,
                PlotPayment::STATUS_REFUNDED,
            ], true)
            && ! $verifiedByTrustedSource
        ) {
            throw ValidationException::withMessages([
                'status' => [
                    'This status requires a trusted payment verification workflow.',
                ],
            ]);
        }

        return DB::transaction(function () use ($id, $status) {

            /*
             * Lock the record to prevent concurrent status changes.
             */
            $payment = PlotPayment::query()
                ->lockForUpdate()
                ->findOrFail($id);

            $currentStatus = strtolower(
                (string) $payment->status
            );

            /*
             * No change required.
             */
            if ($currentStatus === $status) {
                return $this->loadRelations($payment);
            }

            /*
             * Validate transition.
             */
            $allowedTransitions = self::STATUS_TRANSITIONS[
                $currentStatus
            ] ?? [];

            if (! in_array(
                $status,
                $allowedTransitions,
                true
            )) {
                throw ValidationException::withMessages([
                    'status' => [
                        "The payment cannot transition from {$currentStatus} to {$status}.",
                    ],
                ]);
            }

            /*
             * Persist status.
             *
             * Using the model instance ensures PlotPayment
             * lifecycle events execute correctly.
             */
            $payment->status = $status;
            $payment->save();

            /*
             * Reload latest database record.
             */
            $payment->refresh();

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

        $statusCounts = $statistics['status_counts'] ?? [];

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
     *
     * Example: PAY-20261102-RTI8ML
     */
    public function generatePaymentNumber(): string
    {
        return $this->generateUniqueIdentifier(
            self::PAYMENT_NUMBER_PREFIX,
            'payment_number'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Receipt Number Generation
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a unique payment receipt number.
     *
     * Format: RCP-YYYYMMDD-XXXXXX
     *
     * Example: RCP-20261102-K8M4XP
     */
    public function generateReceiptNumber(): string
    {
        return $this->generateUniqueIdentifier(
            self::RECEIPT_NUMBER_PREFIX,
            'receipt_number'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Unique Identifier Generator
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a unique identifier and check all payment records.
     *
     * Includes soft-deleted records to prevent identifier reuse.
     *
     * A database unique index remains necessary to protect
     * against simultaneous creation requests.
     */
    protected function generateUniqueIdentifier(
        string $prefix,
        string $column
    ): string {
        for (
            $attempt = 0;
            $attempt < self::IDENTIFIER_ATTEMPTS;
            $attempt++
        ) {
            $number = sprintf(
                '%s-%s-%s',
                $prefix,
                now()->format('Ymd'),
                Str::upper(Str::random(6))
            );

            $exists = PlotPayment::withTrashed()
                ->where($column, $number)
                ->exists();

            if (! $exists) {
                return $number;
            }
        }

        throw ValidationException::withMessages([
            $column => [
                "Unable to generate a unique {$column}. Please try again.",
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Validation Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Validate a payment status.
     */
    protected function validateStatus(string $status): void
    {
        if (! in_array(
            $status,
            self::PAYMENT_STATUSES,
            true
        )) {
            throw ValidationException::withMessages([
                'status' => [
                    'The selected payment status is invalid.',
                ],
            ]);
        }
    }

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
            [
                PlotPayment::STATUS_COMPLETED,
                PlotPayment::STATUS_REFUNDED,
            ],
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
            [
                PlotPayment::STATUS_COMPLETED,
                PlotPayment::STATUS_REFUNDED,
            ],
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
        /*
         * Remove client-supplied identifiers.
         *
         * The service is responsible for generating these values.
         */
        unset(
            $data['payment_number'],
            $data['receipt_number']
        );

        /*
         * Normalize currency.
         */
        if (isset($data['currency'])) {
            $data['currency'] = strtoupper(
                trim($data['currency'])
            );
        }

        /*
         * New payments must always start pending.
         */
        $data['status'] = PlotPayment::STATUS_PENDING;

        return $data;
    }

    /*
    |--------------------------------------------------------------------------
    | Pagination Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Normalize pagination limits.
     */
    protected function normalizePerPage(int $perPage): int
    {
        return max(
            1,
            min($perPage, self::MAX_PER_PAGE)
        );
    }
}
