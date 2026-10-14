<?php

namespace App\Services;

use App\Models\PlotPayment;
use App\Models\PlotSale;
use App\Repositories\Interfaces\PlotRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PlotReportService
{
    /**
     * Sale statuses excluded from active financial totals.
     *
     * @var array<int, string>
     */
    private const EXCLUDED_SALE_STATUSES = [
        'cancelled',
        'rejected',
        'expired',
    ];

    protected PlotRepositoryInterface $plotRepository;

    public function __construct(PlotRepositoryInterface $plotRepository)
    {
        $this->plotRepository = $plotRepository;
    }

    /*
    |--------------------------------------------------------------------------
    | Complete Statistics
    |--------------------------------------------------------------------------
    */

    /**
     * Get complete plot statistics.
     *
     * @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    public function statistics(array $filters = []): array
    {
        return [
            'inventory' => $this->inventoryStatistics($filters),
            'sales' => $this->salesStatistics($filters),
            'payments' => $this->paymentStatistics($filters),
            'locations' => $this->locationStatistics($filters),
            'summary' => $this->summaryStatistics($filters),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Summary Statistics
    |--------------------------------------------------------------------------
    */

    /**
     * Get high-level summary statistics.
     *
     * @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    public function summaryStatistics(array $filters = []): array
    {
        $plotQuery = $this->plotQuery($filters);
        $saleQuery = $this->saleQuery($filters);
        $paymentQuery = $this->paymentQuery($filters);

        $totalPlots = (clone $plotQuery)->count();
        $totalSales = (clone $saleQuery)->count();
        $totalPayments = (clone $paymentQuery)->count();

        $totalAskingPrice = (clone $plotQuery)->sum('asking_price');

        $validSales = $this->validSalesQuery($saleQuery);

        $totalSaleValue = (clone $validSales)->sum('sale_price');
        $totalPaid = (clone $validSales)->sum('amount_paid');
        $totalOutstanding = (clone $validSales)->sum('balance');

        return [
            'total_plots' => (int) $totalPlots,
            'total_sales' => (int) $totalSales,
            'total_payments' => (int) $totalPayments,

            'total_asking_price' => $this->money($totalAskingPrice),
            'total_sale_value' => $this->money($totalSaleValue),
            'total_paid' => $this->money($totalPaid),
            'total_outstanding' => $this->money($totalOutstanding),

            'collection_rate' => $this->percentage(
                $totalPaid,
                $totalSaleValue
            ),

            'conversion_rate' => $this->percentage(
                $totalSales,
                $totalPlots
            ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Inventory Statistics
    |--------------------------------------------------------------------------
    */

    /**
     * Get plot inventory statistics.
     *
     * @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    public function inventoryStatistics(array $filters = []): array
    {
        $query = $this->plotQuery($filters);

        $total = (clone $query)->count();

        $available = (clone $query)
            ->where('status', 'available')
            ->count();

        $reserved = (clone $query)
            ->where('status', 'reserved')
            ->count();

        $sold = (clone $query)
            ->where('status', 'sold')
            ->count();

        $unavailable = (clone $query)
            ->where('status', 'unavailable')
            ->count();

        $active = (clone $query)
            ->where('is_active', true)
            ->count();

        $inactive = (clone $query)
            ->where('is_active', false)
            ->count();

        $totalSize = (clone $query)->sum('size');
        $totalAskingPrice = (clone $query)->sum('asking_price');
        $averageAskingPrice = (clone $query)->avg('asking_price');

        return [
            'total_plots' => (int) $total,
            'available_plots' => (int) $available,
            'reserved_plots' => (int) $reserved,
            'sold_plots' => (int) $sold,
            'unavailable_plots' => (int) $unavailable,
            'active_plots' => (int) $active,
            'inactive_plots' => (int) $inactive,

            'total_size' => $this->number($totalSize),
            'total_asking_price' => $this->money($totalAskingPrice),
            'average_asking_price' => $this->money($averageAskingPrice),

            'availability_rate' => $this->percentage($available, $total),
            'reservation_rate' => $this->percentage($reserved, $total),
            'sold_rate' => $this->percentage($sold, $total),
            'active_rate' => $this->percentage($active, $total),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Sales Statistics
    |--------------------------------------------------------------------------
    */

    /**
     * Get plot sales statistics.
     *
     * @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    public function salesStatistics(array $filters = []): array
    {
        $query = $this->saleQuery($filters);

        $totalSales = (clone $query)->count();

        $pending = (clone $query)->where('status', 'pending')->count();
        $reserved = (clone $query)->where('status', 'reserved')->count();
        $approved = (clone $query)->where('status', 'approved')->count();
        $completed = (clone $query)->where('status', 'completed')->count();
        $cancelled = (clone $query)->where('status', 'cancelled')->count();
        $rejected = (clone $query)->where('status', 'rejected')->count();
        $expired = (clone $query)->where('status', 'expired')->count();

        $validSales = $this->validSalesQuery($query);

        $totalSaleValue = (clone $validSales)->sum('sale_price');
        $totalDeposit = (clone $validSales)->sum('deposit_amount');
        $totalDiscount = (clone $validSales)->sum('discount_amount');
        $totalPaid = (clone $validSales)->sum('amount_paid');
        $totalBalance = (clone $validSales)->sum('balance');
        $averageSalePrice = (clone $validSales)->avg('sale_price');

        $completedQuery = (clone $query)->where('status', 'completed');

        return [
            'total_sales' => (int) $totalSales,
            'pending_sales' => (int) $pending,
            'reserved_sales' => (int) $reserved,
            'approved_sales' => (int) $approved,
            'completed_sales' => (int) $completed,
            'cancelled_sales' => (int) $cancelled,
            'rejected_sales' => (int) $rejected,
            'expired_sales' => (int) $expired,

            'total_sale_value' => $this->money($totalSaleValue),
            'total_deposit_amount' => $this->money($totalDeposit),
            'total_discount_amount' => $this->money($totalDiscount),
            'total_amount_paid' => $this->money($totalPaid),
            'total_balance' => $this->money($totalBalance),
            'average_sale_price' => $this->money($averageSalePrice),

            'completed_sale_value' => $this->money(
                (clone $completedQuery)->sum('sale_price')
            ),

            'completed_amount_paid' => $this->money(
                (clone $completedQuery)->sum('amount_paid')
            ),

            'completed_sale_balance' => $this->money(
                (clone $completedQuery)->sum('balance')
            ),

            'collection_rate' => $this->percentage(
                $totalPaid,
                $totalSaleValue
            ),

            'completion_rate' => $this->percentage(
                $completed,
                $totalSales
            ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Statistics
    |--------------------------------------------------------------------------
    */

    /**
     * Get plot payment statistics.
     *
     * @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    public function paymentStatistics(array $filters = []): array
    {
        $query = $this->paymentQuery($filters);

        $totalPayments = (clone $query)->count();
        $totalAmount = (clone $query)->sum('amount');

        $pending = (clone $query)->where('status', 'pending')->count();
        $partial = (clone $query)->where('status', 'partial')->count();
        $paid = (clone $query)->where('status', 'paid')->count();
        $failed = (clone $query)->where('status', 'failed')->count();
        $refunded = (clone $query)->where('status', 'refunded')->count();
        $overdue = (clone $query)->where('status', 'overdue')->count();

        $successfulAmount = (clone $query)
            ->where('status', 'paid')
            ->sum('amount');

        $failedAmount = (clone $query)
            ->where('status', 'failed')
            ->sum('amount');

        $refundedAmount = (clone $query)
            ->where('status', 'refunded')
            ->sum('amount');

        return [
            'total_payments' => (int) $totalPayments,
            'total_amount' => $this->money($totalAmount),
            'successful_amount' => $this->money($successfulAmount),
            'failed_amount' => $this->money($failedAmount),
            'refunded_amount' => $this->money($refundedAmount),

            'pending_payments' => (int) $pending,
            'partial_payments' => (int) $partial,
            'paid_payments' => (int) $paid,
            'failed_payments' => (int) $failed,
            'refunded_payments' => (int) $refunded,
            'overdue_payments' => (int) $overdue,

            'successful_rate' => $this->percentage(
                $paid,
                $totalPayments
            ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Location Statistics
    |--------------------------------------------------------------------------
    */

    /**
     * Get plot statistics grouped by county.
     *
     * @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    public function locationStatistics(array $filters = []): array
    {
        $counties = $this->plotQuery($filters)
            ->select([
                'county_id',
                DB::raw('COUNT(*) as total_plots'),
                DB::raw(
                    "SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_plots"
                ),
                DB::raw(
                    "SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved_plots"
                ),
                DB::raw(
                    "SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold_plots"
                ),
                DB::raw('SUM(size) as total_size'),
                DB::raw('SUM(asking_price) as total_asking_price'),
            ])
            ->groupBy('county_id')
            ->with('county:id,name')
            ->orderByDesc('total_plots')
            ->get();

        return [
            'counties' => $counties->map(function ($row): array {
                return [
                    'county_id' => $row->county_id,
                    'county_name' => $row->county?->name,
                    'total_plots' => (int) $row->total_plots,
                    'available_plots' => (int) $row->available_plots,
                    'reserved_plots' => (int) $row->reserved_plots,
                    'sold_plots' => (int) $row->sold_plots,
                    'total_size' => $this->number($row->total_size),
                    'total_asking_price' => $this->money(
                        $row->total_asking_price
                    ),
                ];
            })->values()->all(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Inventory Report
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a paginated plot inventory report.
     *
     * @param array<string, mixed> $filters
     */
    public function inventoryReport(
        array $filters = []
    ): LengthAwarePaginator {
        $query = $this->plotQuery($filters);

        $this->applyReportSorting(
            $query,
            $filters,
            [
                'created_at',
                'updated_at',
                'code',
                'title',
                'size',
                'asking_price',
                'status',
            ],
            'created_at'
        );

        return $query
            ->with([
                'property',
                'country',
                'region',
                'county',
                'city',
                'area',
                'activeSale',
                'completedSale',
            ])
            ->withCount('sales')
            ->paginate($this->getPerPage($filters))
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | Sold Plots Report
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a paginated report of plots marked as sold.
     *
     * This report does not change any plot or sale status.
     *
     * @param array<string, mixed> $filters
     */
    public function soldPlotsReport(
        array $filters = []
    ): LengthAwarePaginator {
        $filters['status'] = 'sold';

        $query = $this->plotQuery($filters);

        $this->applyReportSorting(
            $query,
            $filters,
            [
                'created_at',
                'updated_at',
                'code',
                'title',
                'size',
                'asking_price',
                'status',
            ],
            'updated_at'
        );

        return $query
            ->with([
                'property',
                'country',
                'region',
                'county',
                'city',
                'area',
                'completedSale.buyer',
                'completedSale.agent',
                'completedSale.payments',
                'sales' => function (Builder $salesQuery): void {
                    $salesQuery
                        ->where('status', 'completed')
                        ->with(['buyer', 'agent', 'payments'])
                        ->orderByDesc('sale_date');
                },
            ])
            ->withCount('sales')
            ->paginate($this->getPerPage($filters))
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | Sales Report
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a paginated plot sales report.
     *
     * @param array<string, mixed> $filters
     */
    public function salesReport(
        array $filters = []
    ): LengthAwarePaginator {
        $query = $this->saleQuery($filters);

        $this->applyReportSorting(
            $query,
            $filters,
            [
                'created_at',
                'updated_at',
                'sale_number',
                'sale_date',
                'sale_price',
                'amount_paid',
                'balance',
                'status',
            ],
            'sale_date'
        );

        return $query
            ->with([
                'plot',
                'buyer',
                'agent',
                'payments',
            ])
            ->paginate($this->getPerPage($filters))
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Report
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a paginated plot payment report.
     *
     * @param array<string, mixed> $filters
     */
    public function paymentReport(
        array $filters = []
    ): LengthAwarePaginator {
        $query = $this->paymentQuery($filters);

        $this->applyReportSorting(
            $query,
            $filters,
            [
                'created_at',
                'updated_at',
                'payment_number',
                'payment_date',
                'amount',
                'status',
                'payment_method',
            ],
            'payment_date'
        );

        return $query
            ->with([
                'plotSale',
                'plotSale.plot',
                'plotSale.buyer',
                'plotSale.agent',
            ])
            ->paginate($this->getPerPage($filters))
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | Outstanding Report
    |--------------------------------------------------------------------------
    */

    /**
     * Generate an outstanding balance report.
     *
     * @param array<string, mixed> $filters
     */
    public function outstandingReport(
        array $filters = []
    ): LengthAwarePaginator {
        $query = $this->validSalesQuery(
            $this->saleQuery($filters)
        )->where('balance', '>', 0);

        $this->applyReportSorting(
            $query,
            $filters,
            [
                'created_at',
                'updated_at',
                'sale_number',
                'sale_date',
                'sale_price',
                'amount_paid',
                'balance',
                'due_date',
            ],
            'balance'
        );

        return $query
            ->with([
                'plot',
                'buyer',
                'agent',
                'payments',
            ])
            ->paginate($this->getPerPage($filters))
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | Agent Report
    |--------------------------------------------------------------------------
    */

    /**
     * Generate an agent performance report.
     *
     * @param array<string, mixed> $filters
     */
    public function agentReport(
        array $filters = []
    ): Collection {
        return $this->saleQuery($filters)
            ->whereNotNull('agent_id')
            ->select([
                'agent_id',
                DB::raw('COUNT(*) as total_sales'),
                DB::raw(
                    "SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sales"
                ),
                DB::raw(
                    "SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_sales"
                ),
                DB::raw(
                    "SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_sales"
                ),
                DB::raw(
                    "SUM(CASE WHEN status NOT IN ('cancelled', 'rejected', 'expired') THEN sale_price ELSE 0 END) as total_sale_value"
                ),
                DB::raw(
                    "SUM(CASE WHEN status NOT IN ('cancelled', 'rejected', 'expired') THEN amount_paid ELSE 0 END) as total_amount_paid"
                ),
                DB::raw(
                    "SUM(CASE WHEN status NOT IN ('cancelled', 'rejected', 'expired') THEN balance ELSE 0 END) as total_balance"
                ),
            ])
            ->groupBy('agent_id')
            ->with('agent')
            ->orderByDesc('total_sale_value')
            ->get()
            ->map(function ($row): array {
                return [
                    'agent_id' => $row->agent_id,
                    'agent' => $row->agent,
                    'total_sales' => (int) $row->total_sales,
                    'completed_sales' => (int) $row->completed_sales,
                    'cancelled_sales' => (int) $row->cancelled_sales,
                    'rejected_sales' => (int) $row->rejected_sales,

                    'total_sale_value' => $this->money(
                        $row->total_sale_value
                    ),

                    'total_amount_paid' => $this->money(
                        $row->total_amount_paid
                    ),

                    'total_balance' => $this->money(
                        $row->total_balance
                    ),

                    'collection_rate' => $this->percentage(
                        $row->total_amount_paid,
                        $row->total_sale_value
                    ),
                ];
            });
    }

    /*
    |--------------------------------------------------------------------------
    | Location Report
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a detailed county report.
     *
     * @param array<string, mixed> $filters
     */
    public function locationReport(
        array $filters = []
    ): Collection {
        return $this->plotQuery($filters)
            ->select([
                'county_id',
                DB::raw('COUNT(*) as total_plots'),
                DB::raw(
                    "SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_plots"
                ),
                DB::raw(
                    "SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved_plots"
                ),
                DB::raw(
                    "SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold_plots"
                ),
                DB::raw(
                    "SUM(CASE WHEN status = 'unavailable' THEN 1 ELSE 0 END) as unavailable_plots"
                ),
                DB::raw('SUM(size) as total_size'),
                DB::raw('SUM(asking_price) as total_asking_price'),
                DB::raw('AVG(asking_price) as average_asking_price'),
            ])
            ->groupBy('county_id')
            ->with('county:id,name')
            ->orderByDesc('total_plots')
            ->get()
            ->map(function ($row): array {
                return [
                    'county_id' => $row->county_id,
                    'county_name' => $row->county?->name,
                    'total_plots' => (int) $row->total_plots,
                    'available_plots' => (int) $row->available_plots,
                    'reserved_plots' => (int) $row->reserved_plots,
                    'sold_plots' => (int) $row->sold_plots,
                    'unavailable_plots' => (int) $row->unavailable_plots,
                    'total_size' => $this->number($row->total_size),
                    'total_asking_price' => $this->money(
                        $row->total_asking_price
                    ),
                    'average_asking_price' => $this->money(
                        $row->average_asking_price
                    ),
                ];
            });
    }

    /*
    |--------------------------------------------------------------------------
    | Base Plot Query
    |--------------------------------------------------------------------------
    */

    /**
     * Build the base plot query using the repository.
     *
     * @param array<string, mixed> $filters
     */
    protected function plotQuery(array $filters = []): Builder
    {
        return $this->plotRepository->getReportQuery(
            $this->plotFilters($filters)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Base Sale Query
    |--------------------------------------------------------------------------
    */

    /**
     * Build the base plot sale query.
     *
     * @param array<string, mixed> $filters
     */
    protected function saleQuery(array $filters = []): Builder
    {
        $query = PlotSale::query();

        if (
            isset($filters['plot_id']) &&
            $filters['plot_id'] !== ''
        ) {
            $query->where('plot_id', $filters['plot_id']);
        }

        if (
            isset($filters['sale_id']) &&
            $filters['sale_id'] !== ''
        ) {
            $query->whereKey($filters['sale_id']);
        }

        if (
            isset($filters['sale_status']) &&
            $filters['sale_status'] !== ''
        ) {
            $query->where('status', $filters['sale_status']);
        }

        if (
            isset($filters['sale_statuses']) &&
            is_array($filters['sale_statuses']) &&
            $filters['sale_statuses'] !== []
        ) {
            $query->whereIn('status', $filters['sale_statuses']);
        }

        if (
            isset($filters['agent_id']) &&
            $filters['agent_id'] !== ''
        ) {
            $query->where('agent_id', $filters['agent_id']);
        }

        if (
            isset($filters['customer_id']) &&
            $filters['customer_id'] !== ''
        ) {
            $query->where('buyer_id', $filters['customer_id']);
        }

        if (
            isset($filters['currency']) &&
            $filters['currency'] !== ''
        ) {
            $query->where(
                'currency',
                strtoupper((string) $filters['currency'])
            );
        }

        $this->applyDateFilters($query, $filters, 'sale_date');

        $this->applyActiveFilter($query, $filters);

        return $query;
    }

    /*
    |--------------------------------------------------------------------------
    | Base Payment Query
    |--------------------------------------------------------------------------
    */

    /**
     * Build the base plot payment query.
     *
     * @param array<string, mixed> $filters
     */
    protected function paymentQuery(array $filters = []): Builder
    {
        $query = PlotPayment::query();

        if (
            isset($filters['sale_id']) &&
            $filters['sale_id'] !== ''
        ) {
            $query->where('plot_sale_id', $filters['sale_id']);
        }

        if (
            isset($filters['payment_id']) &&
            $filters['payment_id'] !== ''
        ) {
            $query->whereKey($filters['payment_id']);
        }

        if (
            isset($filters['payment_status']) &&
            $filters['payment_status'] !== ''
        ) {
            $query->where('status', $filters['payment_status']);
        }

        if (
            isset($filters['payment_statuses']) &&
            is_array($filters['payment_statuses']) &&
            $filters['payment_statuses'] !== []
        ) {
            $query->whereIn('status', $filters['payment_statuses']);
        }

        if (
            isset($filters['payment_method']) &&
            $filters['payment_method'] !== ''
        ) {
            $query->where(
                'payment_method',
                $filters['payment_method']
            );
        }

        if (
            isset($filters['currency']) &&
            $filters['currency'] !== ''
        ) {
            $query->where(
                'currency',
                strtoupper((string) $filters['currency'])
            );
        }

        $this->applyDateFilters($query, $filters, 'payment_date');

        $this->applyActiveFilter($query, $filters);

        return $query;
    }

    /*
    |--------------------------------------------------------------------------
    | Financial Query Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Exclude cancelled, rejected and expired sales.
     *
     * @param Builder $query
     */
    protected function validSalesQuery(Builder $query): Builder
    {
        return $query->whereNotIn(
            'status',
            self::EXCLUDED_SALE_STATUSES
        );
    }

    /**
     * Apply the optional active-record filter.
     *
     * By default, include inactive records to preserve historical
     * reporting. Set include_inactive=false to exclude them.
     *
     * @param array<string, mixed> $filters
     */
    protected function applyActiveFilter(
        Builder $query,
        array $filters
    ): void {
        if (
            array_key_exists('include_inactive', $filters) &&
            !filter_var(
                $filters['include_inactive'],
                FILTER_VALIDATE_BOOLEAN
            )
        ) {
            $query->where('is_active', true);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Plot Filters
    |--------------------------------------------------------------------------
    */

    /**
     * Prepare filters for PlotRepository.
     *
     * @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    protected function plotFilters(array $filters): array
    {
        return [
            'plot_id' => $filters['plot_id'] ?? null,
            'property_id' => $filters['property_id'] ?? null,
            'country_id' => $filters['country_id'] ?? null,
            'region_id' => $filters['region_id'] ?? null,
            'county_id' => $filters['county_id'] ?? null,
            'city_id' => $filters['city_id'] ?? null,
            'area_id' => $filters['area_id'] ?? null,
            'search' => $filters['search'] ?? null,
            'status' => $filters['status'] ?? null,
            'statuses' => $filters['statuses'] ?? null,
            'is_active' => $filters['is_active'] ?? null,
            'include_deleted' => $filters['include_deleted'] ?? false,
            'include_inactive' => $filters['include_inactive'] ?? false,
            'include_details' => true,
            'min_size' => $filters['min_size'] ?? null,
            'max_size' => $filters['max_size'] ?? null,
            'size_unit' => $filters['size_unit'] ?? null,
            'min_price' => $filters['min_price'] ?? null,
            'max_price' => $filters['max_price'] ?? null,
            'currency' => $filters['currency'] ?? null,
            'sort_by' => $filters['sort_by'] ?? null,
            'sort_direction' => $filters['sort_direction'] ?? null,
            'per_page' => $this->getPerPage($filters),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Date Filtering
    |--------------------------------------------------------------------------
    */

    /**
     * Apply explicit date ranges and named reporting periods.
     *
     * @param array<string, mixed> $filters
     */
    protected function applyDateFilters(
        Builder $query,
        array $filters,
        string $column
    ): void {
        $startDate = $filters['start_date']
            ?? $filters['date_from']
            ?? null;

        $endDate = $filters['end_date']
            ?? $filters['date_to']
            ?? null;

        if ($startDate) {
            $query->whereDate($column, '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate($column, '<=', $endDate);
        }

        $period = $filters['period'] ?? null;

        if (
            !$period ||
            in_array($period, ['all_time', 'custom'], true)
        ) {
            return;
        }

        $range = match ($period) {
            'today' => [today()->startOfDay(), today()->endOfDay()],

            'yesterday' => [
                today()->subDay()->startOfDay(),
                today()->subDay()->endOfDay(),
            ],

            'this_week' => [
                now()->startOfWeek(),
                now()->endOfWeek(),
            ],

            'last_week' => [
                now()->subWeek()->startOfWeek(),
                now()->subWeek()->endOfWeek(),
            ],

            'this_month' => [
                now()->startOfMonth(),
                now()->endOfMonth(),
            ],

            'last_month' => [
                now()->subMonth()->startOfMonth(),
                now()->subMonth()->endOfMonth(),
            ],

            'this_quarter' => [
                now()->startOfQuarter(),
                now()->endOfQuarter(),
            ],

            'last_quarter' => [
                now()->subQuarter()->startOfQuarter(),
                now()->subQuarter()->endOfQuarter(),
            ],

            'this_year' => [
                now()->startOfYear(),
                now()->endOfYear(),
            ],

            'last_year' => [
                now()->subYear()->startOfYear(),
                now()->subYear()->endOfYear(),
            ],

            default => null,
        };

        if ($range !== null) {
            $query->whereBetween($column, $range);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Report Sorting
    |--------------------------------------------------------------------------
    */

    /**
     * Apply safe report sorting.
     *
     * @param array<string, mixed> $filters
     * @param array<int, string> $allowedColumns
     */
    protected function applyReportSorting(
        Builder $query,
        array $filters,
        array $allowedColumns,
        string $defaultColumn
    ): void {
        $sortBy = $filters['sort_by'] ?? $defaultColumn;

        if (!in_array($sortBy, $allowedColumns, true)) {
            $sortBy = $defaultColumn;
        }

        $direction = strtolower(
            (string) ($filters['sort_direction'] ?? 'desc')
        );

        if (!in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'desc';
        }

        $query->orderBy($sortBy, $direction);

        $keyName = $query->getModel()->getKeyName();

        if ($sortBy !== $keyName) {
            $query->orderByDesc($keyName);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    /**
     * Return a safe page size between 1 and 100.
     *
     * @param array<string, mixed> $filters
     */
    protected function getPerPage(array $filters): int
    {
        $perPage = (int) ($filters['per_page'] ?? 15);

        return max(1, min($perPage, 100));
    }

    /*
    |--------------------------------------------------------------------------
    | Formatting Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Format a monetary value.
     */
    protected function money(mixed $value): float
    {
        return round((float) ($value ?? 0), 2);
    }

    /**
     * Format a numeric value.
     */
    protected function number(mixed $value): float
    {
        return round((float) ($value ?? 0), 2);
    }

    /**
     * Calculate a percentage safely.
     */
    protected function percentage(
        int|float $value,
        int|float $total
    ): float {
        if ((float) $total <= 0) {
            return 0.0;
        }

        return round(
            ((float) $value / (float) $total) * 100,
            2
        );
    }
}
