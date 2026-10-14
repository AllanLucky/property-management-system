<?php

namespace App\Repositories\Interfaces;

use App\Models\PlotSale;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface PlotSaleRepositoryInterface
{
    /**
     * Get all plot sales with optional filters and pagination.
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Find a plot sale by ID.
     */
    public function findById(int $id): ?PlotSale;

    /**
     * Find a plot sale by its sale number.
     */
    public function findBySaleNumber(string $saleNumber): ?PlotSale;

    /**
     * Create a new plot sale.
     */
    public function create(array $data): PlotSale;

    /**
     * Update an existing plot sale.
     */
    public function update(PlotSale $plotSale, array $data): PlotSale;

    /**
     * Delete a plot sale.
     */
    public function delete(PlotSale $plotSale): bool;

    /**
     * Restore a soft-deleted plot sale.
     */
    public function restore(int $id): ?PlotSale;

    /**
     * Permanently delete a plot sale.
     */
    public function forceDelete(int $id): bool;

    /**
     * Get plot sales by status.
     */
    public function getByStatus(string $status, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get plot sales for a specific plot.
     */
    public function getByPlot(int $plotId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get plot sales for a specific buyer.
     */
    public function getByBuyer(int $buyerId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get plot sales with outstanding balances.
     */
    public function getOutstanding(int $perPage = 15): LengthAwarePaginator;

    /**
     * Get plot sales statistics.
     */
    public function getStatistics(array $filters = []): array;

    /**
     * Get plot sales for reports.
     */
    public function getForReport(array $filters = []): Collection;
}