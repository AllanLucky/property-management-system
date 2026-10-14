<?php

namespace App\Repositories\Eloquent;

use App\Models\PlotSale;
use App\Repositories\Interfaces\PlotSaleRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PlotSaleRepository implements PlotSaleRepositoryInterface
{
    /**
     * Relationships loaded for plot sales.
     */
    protected array $relations = [
        'plot',
        'buyer',
        'agent',
        'payments',
    ];

    /**
     * Start a new plot sale query.
     */
    protected function query(): Builder
    {
        return PlotSale::query()->with($this->relations);
    }

    /**
     * Get all plot sales with optional filters and pagination.
     */
    public function getAll(
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator {
        $query = $this->query();

        $this->applyFilters($query, $filters);

        return $query
            ->latest('id')
            ->paginate(max(1, min($perPage, 100)))
            ->withQueryString();
    }

    /**
     * Find a plot sale by ID.
     */
    public function findById(int $id): ?PlotSale
    {
        return $this->query()->find($id);
    }

    /**
     * Find a plot sale by its sale number.
     */
    public function findBySaleNumber(string $saleNumber): ?PlotSale
    {
        return $this->query()
            ->where('sale_number', $saleNumber)
            ->first();
    }

    /**
     * Create a new plot sale.
     */
    public function create(array $data): PlotSale
    {
        return DB::transaction(function () use ($data) {
            $plotSale = PlotSale::query()->create($data);

            return $plotSale->load($this->relations);
        });
    }

    /**
     * Update an existing plot sale.
     */
    public function update(PlotSale $plotSale, array $data): PlotSale
    {
        return DB::transaction(function () use ($plotSale, $data) {
            $plotSale->update($data);

            return $plotSale->refresh()->load($this->relations);
        });
    }

    /**
     * Delete a plot sale.
     */
    public function delete(PlotSale $plotSale): bool
    {
        return (bool) $plotSale->delete();
    }

    /**
     * Restore a soft-deleted plot sale.
     */
    public function restore(int $id): ?PlotSale
    {
        $plotSale = PlotSale::withTrashed()->find($id);

        if (! $plotSale || ! $plotSale->trashed()) {
            return null;
        }

        $plotSale->restore();

        return $plotSale->fresh()->load($this->relations);
    }

    /**
     * Permanently delete a plot sale.
     */
    public function forceDelete(int $id): bool
    {
        $plotSale = PlotSale::withTrashed()->find($id);

        if (! $plotSale) {
            return false;
        }

        return (bool) $plotSale->forceDelete();
    }

    /**
     * Get plot sales by status.
     */
    public function getByStatus(
        string $status,
        int $perPage = 15
    ): LengthAwarePaginator {
        return $this->query()
            ->where('status', $status)
            ->latest('id')
            ->paginate(max(1, min($perPage, 100)))
            ->withQueryString();
    }

    /**
     * Get plot sales for a specific plot.
     */
    public function getByPlot(
        int $plotId,
        int $perPage = 15
    ): LengthAwarePaginator {
        return $this->query()
            ->where('plot_id', $plotId)
            ->latest('id')
            ->paginate(max(1, min($perPage, 100)))
            ->withQueryString();
    }

    /**
     * Get plot sales for a specific buyer.
     */
    public function getByBuyer(
        int $buyerId,
        int $perPage = 15
    ): LengthAwarePaginator {
        return $this->query()
            ->where('buyer_id', $buyerId)
            ->latest('id')
            ->paginate(max(1, min($perPage, 100)))
            ->withQueryString();
    }

    /**
     * Get plot sales with outstanding balances.
     */
    public function getOutstanding(
        int $perPage = 15
    ): LengthAwarePaginator {
        return $this->query()
            ->where('balance', '>', 0)
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->latest('id')
            ->paginate(max(1, min($perPage, 100)))
            ->withQueryString();
    }

    /**
     * Get plot sales statistics.
     */
    public function getStatistics(array $filters = []): array
    {
        $query = PlotSale::query();

        $this->applyFilters($query, $filters);

        return [
            'total_sales' => (clone $query)->count(),

            'pending_sales' => (clone $query)
                ->where('status', 'pending')
                ->count(),

            'reserved_sales' => (clone $query)
                ->where('status', 'reserved')
                ->count(),

            'completed_sales' => (clone $query)
                ->where('status', 'completed')
                ->count(),

            'cancelled_sales' => (clone $query)
                ->where('status', 'cancelled')
                ->count(),

            'total_amount' => (float) (clone $query)
                ->sum('total_amount'),

            'total_paid' => (float) (clone $query)
                ->sum('amount_paid'),

            'total_outstanding' => (float) (clone $query)
                ->sum('balance'),
        ];
    }

    /**
     * Get plot sales for reports.
     */
    public function getForReport(array $filters = []): Collection
    {
        $query = $this->query();

        $this->applyFilters($query, $filters);

        return $query->latest('id')->get();
    }

    /**
     * Apply supported filters to a query.
     */
    protected function applyFilters(
        Builder $query,
        array $filters
    ): void {
        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);

            $query->where(function (Builder $subQuery) use ($search) {
                $subQuery
                    ->where('sale_number', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhereHas('plot', function (Builder $plotQuery) use ($search) {
                        $plotQuery
                            ->where('title', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%")
                            ->orWhere('plot_number', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['plot_id'])) {
            $query->where('plot_id', $filters['plot_id']);
        }

        if (! empty($filters['buyer_id'])) {
            $query->where('buyer_id', $filters['buyer_id']);
        }

        if (! empty($filters['agent_id'])) {
            $query->where('agent_id', $filters['agent_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (! empty($filters['sale_type'])) {
            $query->where('sale_type', $filters['sale_type']);
        }

        if (! empty($filters['currency'])) {
            $query->where('currency', $filters['currency']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('sale_date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('sale_date', '<=', $filters['date_to']);
        }

        if (isset($filters['min_amount']) && $filters['min_amount'] !== '') {
            $query->where('total_amount', '>=', $filters['min_amount']);
        }

        if (isset($filters['max_amount']) && $filters['max_amount'] !== '') {
            $query->where('total_amount', '<=', $filters['max_amount']);
        }

        if (isset($filters['outstanding_only']) && $filters['outstanding_only']) {
            $query->where('balance', '>', 0)
                ->whereNotIn('status', ['cancelled', 'rejected']);
        }
    }
}