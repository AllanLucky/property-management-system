<?php

namespace App\Repositories\Interfaces;

use App\Models\PlotPayment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

interface PlotPaymentRepositoryInterface
{
    /**
     * Get all payments matching the supplied filters.
     */
    public function getAll(array $filters = []): Collection;

    /**
     * Get paginated payments.
     */
    public function paginate(
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator;

    /**
     * Find a payment by its primary key.
     */
    public function findById(int $id): ?PlotPayment;

    /**
     * Find a payment or throw a model-not-found exception.
     */
    public function findOrFail(int $id): PlotPayment;

    /**
     * Find a payment by payment number.
     */
    public function findByPaymentNumber(
        string $paymentNumber
    ): ?PlotPayment;

    /**
     * Find a payment by transaction reference.
     */
    public function findByTransactionReference(
        string $reference
    ): ?PlotPayment;

    /**
     * Search payments.
     */
    public function search(
        string $search,
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator;

    /**
     * Create a payment.
     */
    public function create(array $data): PlotPayment;

    /**
     * Update a payment.
     */
    public function update(
        int $id,
        array $data
    ): PlotPayment;

    /**
     * Soft-delete a payment.
     */
    public function delete(int $id): bool;

    /**
     * Restore a soft-deleted payment.
     */
    public function restore(int $id): bool;

    /**
     * Permanently delete a payment.
     */
    public function forceDelete(int $id): bool;

    /**
     * Get payments belonging to a specific sale.
     */
    public function getBySale(
        int $plotSaleId,
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator;

    /**
     * Get payments by status.
     */
    public function getByStatus(
        string $status,
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator;

    /**
     * Get payment statistics.
     */
    public function statistics(array $filters = []): array;

    /**
     * Eager-load specified relationships.
     */
    public function loadRelations(
        PlotPayment $payment,
        array $relations = ['plotSale']
    ): PlotPayment;

    /**
     * Build a reusable filtered query.
     */
    public function buildQuery(array $filters = []): Builder;
}
