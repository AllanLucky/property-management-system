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
    /*
    |--------------------------------------------------------------------------
    | Dependencies
    |--------------------------------------------------------------------------
    */

    protected PlotRepositoryInterface $plotRepository;

    /**
     * Sale statuses excluded from active financial totals.
     *
     * Reserved, pending, approved and completed sales remain included.
     *
     * @var array<int, string>
     */
    protected const EXCLUDED_SALE_STATUSES = [
        'cancelled',
        'rejected',
        'expired',
    ];

    /**
     * Payment statuses considered successfully collected.
     *
     * @var array<int, string>
     */
    protected const SUCCESSFUL_PAYMENT_STATUSES = [
        'paid',
        'completed',
    ];

    /**
     * Create a new PlotReportService instance.
     */
    public function __construct(
        PlotRepositoryInterface $plotRepository
    ) {
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
     * @return array<string, mixed>
     */
    public function statistics(
        array $filters = []
    ): array {
        return [
            'inventory' => $this->inventoryStatistics(
                $filters
            ),

            'sales' => $this->salesStatistics(
                $filters
            ),

            'payments' => $this->paymentStatistics(
                $filters
            ),

            'locations' => $this->locationStatistics(
                $filters
            ),

            'summary' => $this->summaryStatistics(
                $filters
            ),
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
     * Total sales value is calculated from PlotSale.sale_price.
     * It is not calculated from payment amounts.
     *
     * @return array<string, mixed>
     */
    public function summaryStatistics(
        array $filters = []
    ): array {
        $plotQuery = $this->plotQuery($filters);
        $saleQuery = $this->saleQuery($filters);
        $paymentQuery = $this->paymentQuery($filters);

        $totalPlots = (clone $plotQuery)->count();

        $totalSales = (clone $saleQuery)->count();

        $totalPayments = (clone $paymentQuery)->count();

        $totalAskingPrice = (clone $plotQuery)
            ->sum('asking_price');

        $validSales = $this->validSalesQuery(
            $saleQuery
        );

        $totalSaleValue = (clone $validSales)
            ->sum('sale_price');

        $totalPaid = (clone $validSales)
            ->sum('amount_paid');

        $totalOutstanding = (clone $validSales)
            ->sum('balance');

        return [
            'total_plots' => (int) $totalPlots,

            'total_sales' => (int) $totalSales,

            'total_payments' => (int) $totalPayments,

            'total_asking_price' => $this->money(
                $totalAskingPrice
            ),

            'total_sale_value' => $this->money(
                $totalSaleValue
            ),

            'total_paid' => $this->money(
                $totalPaid
            ),

            'total_outstanding' => $this->money(
                $totalOutstanding
            ),

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
     * @return array<string, mixed>
     */
    public function inventoryStatistics(
        array $filters = []
    ): array {
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

        $totalSize = (clone $query)
            ->sum('size');

        $totalAskingPrice = (clone $query)
            ->sum('asking_price');

        $averageAskingPrice = (clone $query)
            ->avg('asking_price');

        return [
            'total_plots' => (int) $total,

            'available_plots' => (int) $available,

            'reserved_plots' => (int) $reserved,

            'sold_plots' => (int) $sold,

            'unavailable_plots' => (int) $unavailable,

            'active_plots' => (int) $active,

            'inactive_plots' => (int) $inactive,

            'total_size' => $this->number(
                $totalSize
            ),

            'total_asking_price' => $this->money(
                $totalAskingPrice
            ),

            'average_asking_price' => $this->money(
                $averageAskingPrice
            ),

            'availability_rate' => $this->percentage(
                $available,
                $total
            ),

            'reservation_rate' => $this->percentage(
                $reserved,
                $total
            ),

            'sold_rate' => $this->percentage(
                $sold,
                $total
            ),

            'active_rate' => $this->percentage(
                $active,
                $total
            ),
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
     * Financial totals exclude cancelled, rejected and expired sales.
     * Total sale value uses sale_price, not amount_paid.
     *
     * @return array<string, mixed>
     */
    public function salesStatistics(
        array $filters = []
    ): array {
        $query = $this->saleQuery($filters);

        $totalSales = (clone $query)->count();

        $pending = (clone $query)
            ->where('status', 'pending')
            ->count();

        $reserved = (clone $query)
            ->where('status', 'reserved')
            ->count();

        $approved = (clone $query)
            ->where('status', 'approved')
            ->count();

        $completed = (clone $query)
            ->where('status', 'completed')
            ->count();

        $cancelled = (clone $query)
            ->where('status', 'cancelled')
            ->count();

        $rejected = (clone $query)
            ->where('status', 'rejected')
            ->count();

        $expired = (clone $query)
            ->where('status', 'expired')
            ->count();

        $validSalesQuery = $this->validSalesQuery(
            $query
        );

        $totalSaleValue = (clone $validSalesQuery)
            ->sum('sale_price');

        $totalDeposit = (clone $validSalesQuery)
            ->sum('deposit_amount');

        $totalDiscount = (clone $validSalesQuery)
            ->sum('discount_amount');

        $totalPaid = (clone $validSalesQuery)
            ->sum('amount_paid');

        $totalBalance = (clone $validSalesQuery)
            ->sum('balance');

        $averageSalePrice = (clone $validSalesQuery)
            ->avg('sale_price');

        $completedQuery = (clone $query)
            ->where('status', 'completed');

        $completedSaleValue = (clone $completedQuery)
            ->sum('sale_price');

        $completedAmountPaid = (clone $completedQuery)
            ->sum('amount_paid');

        $completedBalance = (clone $completedQuery)
            ->sum('balance');

        return [
            'total_sales' => (int) $totalSales,

            'pending_sales' => (int) $pending,

            'reserved_sales' => (int) $reserved,

            'approved_sales' => (int) $approved,

            'completed_sales' => (int) $completed,

            'cancelled_sales' => (int) $cancelled,

            'rejected_sales' => (int) $rejected,

            'expired_sales' => (int) $expired,

            /*
             * Value of valid sales, including reserved sales.
             */
            'total_sale_value' => $this->money(
                $totalSaleValue
            ),

            'total_deposit_amount' => $this->money(
                $totalDeposit
            ),

            'total_discount_amount' => $this->money(
                $totalDiscount
            ),

            'total_amount_paid' => $this->money(
                $totalPaid
            ),

            'total_balance' => $this->money(
                $totalBalance
            ),

            'average_sale_price' => $this->money(
                $averageSalePrice
            ),

            /*
             * Completed sales are reported separately.
             */
            'completed_sale_value' => $this->money(
                $completedSaleValue
            ),

            'completed_amount_paid' => $this->money(
                $completedAmountPaid
            ),

            'completed_sale_balance' => $this->money(
                $completedBalance
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
     * Payments with status "paid" or "completed" are treated as
     * successful collections.
     *
     * @return array<string, mixed>
     */
    public function paymentStatistics(
        array $filters = []
    ): array {
        $query = $this->paymentQuery($filters);

        $totalPayments = (clone $query)->count();

        $totalAmount = (clone $query)
            ->sum('amount');

        $pending = (clone $query)
            ->where('status', 'pending')
            ->count();

        $partial = (clone $query)
            ->where('status', 'partial')
            ->count();

        $paid = (clone $query)
            ->where('status', 'paid')
            ->count();

        $completed = (clone $query)
            ->where('status', 'completed')
            ->count();

        $failed = (clone $query)
            ->where('status', 'failed')
            ->count();

        $refunded = (clone $query)
            ->where('status', 'refunded')
            ->count();

        $overdue = (clone $query)
            ->where('status', 'overdue')
            ->count();

        $successfulQuery = (clone $query)
            ->whereIn(
                'status',
                self::SUCCESSFUL_PAYMENT_STATUSES
            );

        $successfulCount = (clone $successfulQuery)
            ->count();

        $successfulAmount = (clone $successfulQuery)
            ->sum('amount');

        $failedAmount = (clone $query)
            ->where('status', 'failed')
            ->sum('amount');

        $refundedAmount = (clone $query)
            ->where('status', 'refunded')
            ->sum('amount');

        return [
            'total_payments' => (int) $totalPayments,

            /*
             * All payment records, irrespective of status.
             */
            'total_amount' => $this->money(
                $totalAmount
            ),

            /*
             * Successful collections only.
             */
            'successful_amount' => $this->money(
                $successfulAmount
            ),

            'failed_amount' => $this->money(
                $failedAmount
            ),

            'refunded_amount' => $this->money(
                $refundedAmount
            ),

            'pending_payments' => (int) $pending,

            'partial_payments' => (int) $partial,

            'paid_payments' => (int) $paid,

            'completed_payments' => (int) $completed,

            'failed_payments' => (int) $failed,

            'refunded_payments' => (int) $refunded,

            'overdue_payments' => (int) $overdue,

            'successful_payments' => (int) $successfulCount,

            'successful_rate' => $this->percentage(
                $successfulCount,
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
     * @return array<string, mixed>
     */
    public function locationStatistics(
        array $filters = []
    ): array {
        $query = $this->plotQuery($filters);

        $counties = (clone $query)
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

                DB::raw(
                    'SUM(asking_price) as total_asking_price'
                ),
            ])
            ->groupBy('county_id')
            ->with('county:id,name')
            ->orderByDesc('total_plots')
            ->get();

        return [
            'counties' => $counties
                ->map(function ($row) {
                    return [
                        'county_id' => $row->county_id,

                        'county_name' => $row->county?->name,

                        'total_plots' => (int) $row->total_plots,

                        'available_plots' => (int) $row->available_plots,

                        'reserved_plots' => (int) $row->reserved_plots,

                        'sold_plots' => (int) $row->sold_plots,

                        'total_size' => $this->number(
                            $row->total_size
                        ),

                        'total_asking_price' => $this->money(
                            $row->total_asking_price
                        ),
                    ];
                })
                ->values()
                ->all(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Inventory Report
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a paginated plot inventory report.
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
            ])
            ->paginate(
                $this->getPerPage($filters)
            )
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | Sales Report
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a paginated plot sales report.
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
            ->paginate(
                $this->getPerPage($filters)
            )
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Report
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a paginated plot payment report.
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
            ->paginate(
                $this->getPerPage($filters)
            )
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | Outstanding Report
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a report of sales with outstanding balances.
     *
     * Excludes cancelled, rejected and expired sales.
     */
    public function outstandingReport(
        array $filters = []
    ): LengthAwarePaginator {
        $query = $this->validSalesQuery(
            $this->saleQuery($filters)
        )
            ->where('balance', '>', 0);

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
            ->paginate(
                $this->getPerPage($filters)
            )
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
     * Financial totals exclude cancelled, rejected and expired sales.
     */
    public function agentReport(
        array $filters = []
    ): Collection {
        $query = $this->saleQuery($filters)
            ->whereNotNull('agent_id');

        $excludedStatuses = implode(
            ',',
            array_map(
                static fn (string $status): string => DB::getPdo()
                    ->quote($status),
                self::EXCLUDED_SALE_STATUSES
            )
        );

        return $query
            ->select([
                'agent_id',

                DB::raw(
                    'COUNT(*) as total_sales'
                ),

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
                    "SUM(CASE WHEN status NOT IN ({$excludedStatuses}) THEN sale_price ELSE 0 END) as total_sale_value"
                ),

                DB::raw(
                    "SUM(CASE WHEN status NOT IN ({$excludedStatuses}) THEN amount_paid ELSE 0 END) as total_amount_paid"
                ),

                DB::raw(
                    "SUM(CASE WHEN status NOT IN ({$excludedStatuses}) THEN balance ELSE 0 END) as total_balance"
                ),
            ])
            ->groupBy('agent_id')
            ->with('agent')
            ->orderByDesc('total_sale_value')
            ->get()
            ->map(function ($row) {
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
     * Generate a detailed county location report.
     */
    public function locationReport(
        array $filters = []
    ): Collection {
        return $this->plotQuery($filters)
            ->select([
                'county_id',

                DB::raw(
                    'COUNT(*) as total_plots'
                ),

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

                DB::raw(
                    'SUM(size) as total_size'
                ),

                DB::raw(
                    'SUM(asking_price) as total_asking_price'
                ),

                DB::raw(
                    'AVG(asking_price) as average_asking_price'
                ),
            ])
            ->groupBy('county_id')
            ->with('county:id,name')
            ->orderByDesc('total_plots')
            ->get()
            ->map(function ($row) {
                return [
                    'county_id' => $row->county_id,

                    'county_name' => $row->county?->name,

                    'total_plots' => (int) $row->total_plots,

                    'available_plots' => (int) $row->available_plots,

                    'reserved_plots' => (int) $row->reserved_plots,

                    'sold_plots' => (int) $row->sold_plots,

                    'unavailable_plots' => (int) $row->unavailable_plots,

                    'total_size' => $this->number(
                        $row->total_size
                    ),

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
    | Plot Query
    |--------------------------------------------------------------------------
    */

    /**
     * Build the base plot query.
     */
    protected function plotQuery(
        array $filters = []
    ): Builder {
        return $this->plotRepository->getReportQuery(
            $this->plotFilters($filters)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Sale Query
    |--------------------------------------------------------------------------
    */

    /**
     * Build the base plot sale query.
     *
     * @return Builder<PlotSale>
     */
    protected function saleQuery(
        array $filters = []
    ): Builder {
        $query = PlotSale::query();

        /*
        |--------------------------------------------------------------------------
        | Plot
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['plot_id']) &&
            $filters['plot_id'] !== ''
        ) {
            $query->where(
                'plot_id',
                $filters['plot_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Sale ID
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['sale_id']) &&
            $filters['sale_id'] !== ''
        ) {
            $query->where(
                'id',
                $filters['sale_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Sale Status
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['sale_status']) &&
            $filters['sale_status'] !== ''
        ) {
            $query->where(
                'status',
                $filters['sale_status']
            );
        }

        if (
            isset($filters['sale_statuses']) &&
            is_array($filters['sale_statuses']) &&
            count($filters['sale_statuses']) > 0
        ) {
            $query->whereIn(
                'status',
                $filters['sale_statuses']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Agent
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['agent_id']) &&
            $filters['agent_id'] !== ''
        ) {
            $query->where(
                'agent_id',
                $filters['agent_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Buyer
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['customer_id']) &&
            $filters['customer_id'] !== ''
        ) {
            $query->where(
                'buyer_id',
                $filters['customer_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Currency
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['currency']) &&
            $filters['currency'] !== ''
        ) {
            $query->where(
                'currency',
                strtoupper(
                    (string) $filters['currency']
                )
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Date Filters
        |--------------------------------------------------------------------------
        */

        $this->applyDateFilters(
            $query,
            $filters,
            'sale_date'
        );

        /*
        |--------------------------------------------------------------------------
        | Active State
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists(
                'include_inactive',
                $filters
            ) &&
            !filter_var(
                $filters['include_inactive'],
                FILTER_VALIDATE_BOOLEAN
            )
        ) {
            $query->where(
                'is_active',
                true
            );
        }

        return $query;
    }

    /*
    |--------------------------------------------------------------------------
    | Valid Sales Query
    |--------------------------------------------------------------------------
    */

    /**
     * Return a cloned query containing financially valid sales.
     *
     * Cloning prevents this helper from modifying the original query
     * and accidentally affecting other statistics or report counts.
     *
     * @param Builder<PlotSale> $query
     * @return Builder<PlotSale>
     */
    protected function validSalesQuery(
        Builder $query
    ): Builder {
        return (clone $query)->whereNotIn(
            'status',
            self::EXCLUDED_SALE_STATUSES
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Query
    |--------------------------------------------------------------------------
    */

    /**
     * Build the base plot payment query.
     *
     * @return Builder<PlotPayment>
     */
    protected function paymentQuery(
        array $filters = []
    ): Builder {
        $query = PlotPayment::query();

        /*
        |--------------------------------------------------------------------------
        | Sale
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['sale_id']) &&
            $filters['sale_id'] !== ''
        ) {
            $query->where(
                'plot_sale_id',
                $filters['sale_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Payment ID
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['payment_id']) &&
            $filters['payment_id'] !== ''
        ) {
            $query->where(
                'id',
                $filters['payment_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Payment Status
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['payment_status']) &&
            $filters['payment_status'] !== ''
        ) {
            $query->where(
                'status',
                $filters['payment_status']
            );
        }

        if (
            isset($filters['payment_statuses']) &&
            is_array($filters['payment_statuses']) &&
            count($filters['payment_statuses']) > 0
        ) {
            $query->whereIn(
                'status',
                $filters['payment_statuses']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Payment Method
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['payment_method']) &&
            $filters['payment_method'] !== ''
        ) {
            $query->where(
                'payment_method',
                $filters['payment_method']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Currency
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['currency']) &&
            $filters['currency'] !== ''
        ) {
            $query->where(
                'currency',
                strtoupper(
                    (string) $filters['currency']
                )
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Date Filters
        |--------------------------------------------------------------------------
        */

        $this->applyDateFilters(
            $query,
            $filters,
            'payment_date'
        );

        /*
        |--------------------------------------------------------------------------
        | Active State
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists(
                'include_inactive',
                $filters
            ) &&
            !filter_var(
                $filters['include_inactive'],
                FILTER_VALIDATE_BOOLEAN
            )
        ) {
            $query->where(
                'is_active',
                true
            );
        }

        return $query;
    }

    /*
    |--------------------------------------------------------------------------
    | Plot Filters
    |--------------------------------------------------------------------------
    */

    /**
     * Prepare filters passed to PlotRepository.
     *
     * @return array<string, mixed>
     */
    protected function plotFilters(
        array $filters
    ): array {
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

            'per_page' => $filters['per_page'] ?? 15,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Date Filtering
    |--------------------------------------------------------------------------
    */

    /**
     * Apply date filters to a query.
     */
    protected function applyDateFilters(
        Builder $query,
        array $filters,
        string $column
    ): void {
        /*
        |--------------------------------------------------------------------------
        | Explicit Start / End Dates
        |--------------------------------------------------------------------------
        */

        $startDate = $filters['start_date']
            ?? $filters['date_from']
            ?? null;

        $endDate = $filters['end_date']
            ?? $filters['date_to']
            ?? null;

        if ($startDate) {
            $query->whereDate(
                $column,
                '>=',
                $startDate
            );
        }

        if ($endDate) {
            $query->whereDate(
                $column,
                '<=',
                $endDate
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Period
        |--------------------------------------------------------------------------
        */

        $period = $filters['period'] ?? null;

        if (
            !$period ||
            $period === 'all_time' ||
            $period === 'custom'
        ) {
            return;
        }

        switch ($period) {
            case 'today':
                $query->whereDate(
                    $column,
                    today()
                );
                break;

            case 'yesterday':
                $query->whereDate(
                    $column,
                    today()->subDay()
                );
                break;

            case 'this_week':
                $query->whereBetween(
                    $column,
                    [
                        now()->startOfWeek(),
                        now()->endOfWeek(),
                    ]
                );
                break;

            case 'last_week':
                $query->whereBetween(
                    $column,
                    [
                        now()->subWeek()->startOfWeek(),
                        now()->subWeek()->endOfWeek(),
                    ]
                );
                break;

            case 'this_month':
                $query->whereBetween(
                    $column,
                    [
                        now()->startOfMonth(),
                        now()->endOfMonth(),
                    ]
                );
                break;

            case 'last_month':
                $query->whereBetween(
                    $column,
                    [
                        now()->subMonth()->startOfMonth(),
                        now()->subMonth()->endOfMonth(),
                    ]
                );
                break;

            case 'this_quarter':
                $query->whereBetween(
                    $column,
                    [
                        now()->startOfQuarter(),
                        now()->endOfQuarter(),
                    ]
                );
                break;

            case 'last_quarter':
                $query->whereBetween(
                    $column,
                    [
                        now()->subQuarter()->startOfQuarter(),
                        now()->subQuarter()->endOfQuarter(),
                    ]
                );
                break;

            case 'this_year':
                $query->whereBetween(
                    $column,
                    [
                        now()->startOfYear(),
                        now()->endOfYear(),
                    ]
                );
                break;

            case 'last_year':
                $query->whereBetween(
                    $column,
                    [
                        now()->subYear()->startOfYear(),
                        now()->subYear()->endOfYear(),
                    ]
                );
                break;
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
     * @param array<int, string> $allowedColumns
     */
    protected function applyReportSorting(
        Builder $query,
        array $filters,
        array $allowedColumns,
        string $defaultColumn
    ): void {
        $sortBy = $filters['sort_by']
            ?? $defaultColumn;

        if (!in_array($sortBy, $allowedColumns, true)) {
            $sortBy = $defaultColumn;
        }

        $direction = strtolower(
            (string) (
                $filters['sort_direction']
                ?? 'desc'
            )
        );

        if (!in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'desc';
        }

        $query->orderBy(
            $sortBy,
            $direction
        );

        $primaryKey = $query->getModel()->getKeyName();

        if ($sortBy !== $primaryKey) {
            $query->orderByDesc($primaryKey);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    /**
     * Get a safe pagination value.
     */
    protected function getPerPage(
        array $filters
    ): int {
        $perPage = (int) (
            $filters['per_page']
            ?? 15
        );

        return max(
            1,
            min($perPage, 100)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Formatting Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Format a monetary value.
     */
    protected function money(
        mixed $value
    ): float {
        return round(
            (float) ($value ?? 0),
            2
        );
    }

    /**
     * Format a numeric value.
     */
    protected function number(
        mixed $value
    ): float {
        return round(
            (float) ($value ?? 0),
            2
        );
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
            (
                (float) $value /
                (float) $total
            ) * 100,
            2
        );
    }
}