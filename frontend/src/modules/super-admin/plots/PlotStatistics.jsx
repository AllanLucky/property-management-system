
import {
  AlertCircle,
  Ban,
  Banknote,
  CheckCircle2,
  Clock3,
  FileCheck2,
  LandPlot,
  Map,
  CircleDollarSign,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely convert a value to a number.
 */
const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

/**
 * Format numbers.
 */
const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE").format(toNumber(value));

/**
 * Format Kenyan currency.
 */
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    currencyDisplay: "symbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(toNumber(value));

/**
 * Resolve supported statistics response structures.
 */
const getStatisticsSource = (statistics) => {
  let source = statistics;

  for (let index = 0; index < 4; index += 1) {
    if (
      source?.data &&
      typeof source.data === "object" &&
      !Array.isArray(source.data)
    ) {
      source = source.data;
      continue;
    }

    if (
      source?.statistics &&
      typeof source.statistics === "object" &&
      !Array.isArray(source.statistics)
    ) {
      source = source.statistics;
      continue;
    }

    break;
  }

  return source && typeof source === "object" ? source : {};
};

/**
 * Extract a statistic from multiple possible API keys.
 *
 * Supports numeric values and nested objects such as:
 * { count: 20 }, { total: 20 }, { amount: 500000 }
 */
const getStatisticValue = (
  statistics,
  keys = [],
  fallback = 0
) => {
  const source = getStatisticsSource(statistics);

  for (const key of keys) {
    const value = source?.[key];

    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      const nested =
        value.count ??
        value.total ??
        value.value ??
        value.amount ??
        value.total_amount ??
        value.amount_paid ??
        value.balance;

      if (
        nested !== undefined &&
        nested !== null &&
        nested !== ""
      ) {
        return nested;
      }

      continue;
    }

    return value;
  }

  return fallback;
};

/**
 * Check whether a statistic exists in the response.
 */
const hasStatistic = (statistics, keys = []) => {
  const source = getStatisticsSource(statistics);

  return keys.some((key) => {
    const value = source?.[key];

    if (value === undefined || value === null || value === "") {
      return false;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      return (
        value.count !== undefined ||
        value.total !== undefined ||
        value.value !== undefined ||
        value.amount !== undefined
      );
    }

    return true;
  });
};

/**
 * Calculate a safe percentage.
 */
const getPercentage = (value, total) => {
  const numericValue = toNumber(value);
  const numericTotal = toNumber(total);

  if (numericTotal <= 0) return 0;

  return Math.min(
    100,
    Math.max(0, (numericValue / numericTotal) * 100)
  );
};

/**
 * Format percentage.
 */
const formatPercentage = (value) =>
  `${toNumber(value).toFixed(1)}%`;

/*
|--------------------------------------------------------------------------
| Reusable Statistic Card
|--------------------------------------------------------------------------
*/

const StatisticCard = ({
  label,
  value,
  icon: Icon,
  iconWrapperClass,
  iconClass,
  description,
  progress = 0,
  progressClass,
  trend,
}) => {
  const safeProgress = Math.min(
    100,
    Math.max(0, toNumber(progress))
  );

  return (
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg">
      <div
        className={`absolute inset-x-0 top-0 h-0.5 ${progressClass}`}
      />

      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-gray-500">
              {label}
            </p>

            {trend && (
              <span className="shrink-0 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                {trend}
              </span>
            )}
          </div>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconWrapperClass}`}
        >
          <Icon
            className={`h-5 w-5 ${iconClass}`}
            strokeWidth={2}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="mt-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${progressClass}`}
            style={{ width: `${safeProgress}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-xs text-gray-500">
            {description}
          </p>

          {progress > 0 && (
            <span className="shrink-0 text-[11px] font-semibold text-gray-500">
              {formatPercentage(safeProgress)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Compact Breakdown Card
|--------------------------------------------------------------------------
*/

const BreakdownCard = ({
  label,
  value,
  icon: Icon,
  iconClass,
  backgroundClass,
  progressClass,
  total,
}) => {
  const percentage = getPercentage(value, total);

  return (
    <div className="group min-w-0 rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition-all duration-200 hover:border-gray-200 hover:bg-white hover:shadow-sm">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${backgroundClass}`}
        >
          <Icon
            className={`h-4 w-4 ${iconClass}`}
            strokeWidth={2}
            aria-hidden="true"
          />
        </div>

        <span className="truncate text-xl font-bold tracking-tight text-gray-900">
          {formatNumber(value)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold text-gray-600">
          {label}
        </p>

        <span className="shrink-0 text-[10px] font-medium text-gray-400">
          {formatPercentage(percentage)}
        </span>
      </div>

      <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Financial Card
|--------------------------------------------------------------------------
*/

const FinancialCard = ({
  label,
  value,
  description,
  icon: Icon,
  wrapperClass,
  iconClass,
}) => (
  <div
    className={`group min-w-0 overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${wrapperClass}`}
  >
    <div className="flex min-w-0 items-center gap-2">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
      >
        <Icon
          className="h-4 w-4"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      <span className="truncate text-xs font-semibold">
        {label}
      </span>
    </div>

    <p
      className="mt-4 min-w-0 break-words text-xl font-bold leading-tight tracking-tight text-gray-900 sm:text-2xl"
      title={value}
    >
      {value}
    </p>

    <p className="mt-2 truncate text-[11px] opacity-70">
      {description}
    </p>
  </div>
);

/*
|--------------------------------------------------------------------------
| Loading Skeleton
|--------------------------------------------------------------------------
*/

const PlotStatisticsSkeleton = () => (
  <section
    aria-label="Plot statistics loading"
    className="min-w-0 space-y-5"
  >
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="h-8 w-24 rounded bg-gray-200" />
            </div>

            <div className="h-11 w-11 rounded-xl bg-gray-200" />
          </div>

          <div className="mt-5 h-1.5 rounded-full bg-gray-200" />
          <div className="mt-2 h-3 w-32 rounded bg-gray-200" />
        </div>
      ))}
    </div>

    <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <div
          key={sectionIndex}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="h-4 w-36 rounded bg-gray-200" />

          <div className="mt-6 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl bg-gray-100 p-4"
              >
                <div className="h-9 w-9 rounded-lg bg-gray-200" />
                <div className="mt-3 h-3 w-20 rounded bg-gray-200" />
                <div className="mt-2 h-1 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="h-4 w-40 rounded bg-gray-200" />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl bg-gray-100 p-4"
          >
            <div className="h-8 w-8 rounded-lg bg-gray-200" />
            <div className="mt-4 h-7 w-32 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-28 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-gray-100 pt-5">
        <div className="h-3 w-36 rounded bg-gray-200" />
        <div className="mt-3 h-2 rounded-full bg-gray-200" />
      </div>
    </div>
  </section>
);

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

const PlotStatistics = ({
  statistics = {},
  loading = false,
}) => {

  /*
  |--------------------------------------------------------------------------
  | Inventory Statistics
  |--------------------------------------------------------------------------
  */

  const total = toNumber(
    getStatisticValue(statistics, [
      "total_plots",
      "total",
      "plots_count",
      "total_count",
      "count",
    ])
  );

  const available = toNumber(
    getStatisticValue(statistics, [
      "available_plots",
      "available",
      "available_count",
    ])
  );

  const reserved = toNumber(
    getStatisticValue(statistics, [
      "reserved_plots",
      "reserved",
      "reserved_count",
    ])
  );

  const sold = toNumber(
    getStatisticValue(statistics, [
      "sold_plots",
      "sold",
      "sold_count",
    ])
  );

  const unavailable = toNumber(
    getStatisticValue(statistics, [
      "unavailable_plots",
      "unavailable",
      "unavailable_count",
    ])
  );

  /*
  |--------------------------------------------------------------------------
  | Sales Statistics
  |--------------------------------------------------------------------------
  */

  const totalSales = toNumber(
    getStatisticValue(statistics, [
      "total_sales",
      "sales_count",
      "completed_sales",
      "sold_count",
      "sold_plots",
    ])
  );

  const pendingSales = toNumber(
    getStatisticValue(statistics, [
      "pending_sales",
      "pending_count",
      "sales_pending",
    ])
  );

  const completedSales = toNumber(
    getStatisticValue(statistics, [
      "completed_sales",
      "successful_sales",
      "sales_completed",
    ], sold)
  );

  const cancelledSales = toNumber(
    getStatisticValue(statistics, [
      "cancelled_sales",
      "sales_cancelled",
    ])
  );

  /*
  |--------------------------------------------------------------------------
  | Payment Statistics
  |--------------------------------------------------------------------------
  */

  const paidPayments = toNumber(
    getStatisticValue(statistics, [
      "paid_payments",
      "fully_paid",
      "paid",
      "payment_paid",
      "paid_count",
    ])
  );

  const partialPayments = toNumber(
    getStatisticValue(statistics, [
      "partial_payments",
      "partially_paid",
      "partial",
      "payment_partial",
      "partial_count",
    ])
  );

  const unpaidPayments = toNumber(
    getStatisticValue(statistics, [
      "unpaid_payments",
      "unpaid",
      "payment_pending",
      "pending_payment",
      "unpaid_count",
    ])
  );

  /*
  |--------------------------------------------------------------------------
  | Financial Statistics
  |--------------------------------------------------------------------------
  */

  const inventoryValue = toNumber(
    getStatisticValue(statistics, [
      "total_inventory_value",
      "inventory_value",
      "total_asking_price",
      "total_asking_prices",
      "total_plot_value",
      "total_value",
    ])
  );

  const salesValue = toNumber(
    getStatisticValue(statistics, [
      "total_sales_value",
      "sales_value",
      "total_sold_value",
      "sold_value",
      "total_revenue",
      "revenue",
    ])
  );

  const totalPaid = toNumber(
    getStatisticValue(statistics, [
      "total_paid",
      "amount_paid",
      "paid_amount",
      "total_collected",
      "collected",
      "total_payments",
    ])
  );

  const suppliedBalance = getStatisticValue(
    statistics,
    [
      "total_balance",
      "outstanding_balance",
      "balance",
      "amount_due",
      "outstanding",
      "total_outstanding",
    ],
    undefined
  );

  const totalBalance =
    suppliedBalance !== undefined &&
    suppliedBalance !== null &&
    suppliedBalance !== ""
      ? toNumber(suppliedBalance)
      : Math.max(salesValue - totalPaid, 0);

  const averagePlotValue =
    total > 0
      ? inventoryValue > 0
        ? inventoryValue / total
        : salesValue > 0 && sold > 0
          ? salesValue / sold
          : 0
      : 0;

  const collectionRate = getPercentage(
    totalPaid,
    salesValue
  );

  /*
  |--------------------------------------------------------------------------
  | Determine Which Financial Metrics Were Supplied
  |--------------------------------------------------------------------------
  */

  const hasInventoryValue = hasStatistic(statistics, [
    "total_inventory_value",
    "inventory_value",
    "total_asking_price",
    "total_asking_prices",
    "total_plot_value",
    "total_value",
  ]);

  const hasSalesValue = hasStatistic(statistics, [
    "total_sales_value",
    "sales_value",
    "total_sold_value",
    "sold_value",
    "total_revenue",
    "revenue",
  ]);

  const hasPaidValue = hasStatistic(statistics, [
    "total_paid",
    "amount_paid",
    "paid_amount",
    "total_collected",
    "collected",
    "total_payments",
  ]);

  const hasBalanceValue = hasStatistic(statistics, [
    "total_balance",
    "outstanding_balance",
    "balance",
    "amount_due",
    "outstanding",
    "total_outstanding",
  ]);

  const hasFinancialData =
    hasInventoryValue ||
    hasSalesValue ||
    hasPaidValue ||
    hasBalanceValue;

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return <PlotStatisticsSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Primary Statistics
  |--------------------------------------------------------------------------
  */

  const primaryStatistics = [
    {
      label: "Total Plots",
      value: formatNumber(total),
      icon: Map,
      iconWrapperClass: "bg-indigo-50",
      iconClass: "text-indigo-600",
      progress: total > 0 ? 100 : 0,
      progressClass: "bg-indigo-500",
      description: "All registered plots",
    },
    {
      label: "Available",
      value: formatNumber(available),
      icon: CheckCircle2,
      iconWrapperClass: "bg-emerald-50",
      iconClass: "text-emerald-600",
      progress: getPercentage(available, total),
      progressClass: "bg-emerald-500",
      description: "Ready for sale",
    },
    {
      label: "Reserved",
      value: formatNumber(reserved),
      icon: Clock3,
      iconWrapperClass: "bg-amber-50",
      iconClass: "text-amber-600",
      progress: getPercentage(reserved, total),
      progressClass: "bg-amber-500",
      description: "Reserved for prospective buyers",
    },
    {
      label: "Sold",
      value: formatNumber(sold),
      icon: FileCheck2,
      iconWrapperClass: "bg-blue-50",
      iconClass: "text-blue-600",
      progress: getPercentage(sold, total),
      progressClass: "bg-blue-500",
      description: "Successfully sold plots",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Inventory Status Breakdown
  |--------------------------------------------------------------------------
  */

  const statusStatistics = [
    {
      label: "Available",
      value: available,
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      backgroundClass: "bg-emerald-50",
      progressClass: "bg-emerald-500",
    },
    {
      label: "Reserved",
      value: reserved,
      icon: Clock3,
      iconClass: "text-amber-600",
      backgroundClass: "bg-amber-50",
      progressClass: "bg-amber-500",
    },
    {
      label: "Sold",
      value: sold,
      icon: FileCheck2,
      iconClass: "text-blue-600",
      backgroundClass: "bg-blue-50",
      progressClass: "bg-blue-500",
    },
    {
      label: "Unavailable",
      value: unavailable,
      icon: Ban,
      iconClass: "text-gray-600",
      backgroundClass: "bg-gray-100",
      progressClass: "bg-gray-500",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Sales Breakdown
  |--------------------------------------------------------------------------
  */

  const salesStatistics = [
    {
      label: "Completed Sales",
      value: completedSales,
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      backgroundClass: "bg-emerald-50",
      progressClass: "bg-emerald-500",
    },
    {
      label: "Pending Sales",
      value: pendingSales,
      icon: Clock3,
      iconClass: "text-amber-600",
      backgroundClass: "bg-amber-50",
      progressClass: "bg-amber-500",
    },
    {
      label: "Cancelled Sales",
      value: cancelledSales,
      icon: XCircle,
      iconClass: "text-red-600",
      backgroundClass: "bg-red-50",
      progressClass: "bg-red-500",
    },
    {
      label: "Total Sales",
      value: totalSales,
      icon: Banknote,
      iconClass: "text-indigo-600",
      backgroundClass: "bg-indigo-50",
      progressClass: "bg-indigo-500",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Payment Breakdown
  |--------------------------------------------------------------------------
  */

  const paymentStatistics = [
    {
      label: "Fully Paid",
      value: paidPayments,
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      backgroundClass: "bg-emerald-50",
      progressClass: "bg-emerald-500",
    },
    {
      label: "Partially Paid",
      value: partialPayments,
      icon: Wallet,
      iconClass: "text-amber-600",
      backgroundClass: "bg-amber-50",
      progressClass: "bg-amber-500",
    },
    {
      label: "Unpaid",
      value: unpaidPayments,
      icon: AlertCircle,
      iconClass: "text-red-600",
      backgroundClass: "bg-red-50",
      progressClass: "bg-red-500",
    },
  ];

  const paymentTotal =
    paidPayments + partialPayments + unpaidPayments;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section
      aria-label="Plot statistics"
      className="min-w-0 space-y-5"
    >
      {/* Primary Statistics */}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primaryStatistics.map((item) => (
          <StatisticCard
            key={item.label}
            {...item}
          />
        ))}
      </div>

      {/* Inventory Status + Sales Breakdown */}

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Inventory Status */}

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-900">
                Plot Inventory Status
              </h3>

              <p className="mt-1 truncate text-xs text-gray-500">
                Current distribution of plot availability
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
              <LandPlot
                className="h-4 w-4 text-indigo-600"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {statusStatistics.map((item) => (
              <BreakdownCard
                key={item.label}
                {...item}
                total={total}
              />
            ))}
          </div>
        </div>

        {/* Sales Breakdown */}

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-900">
                Plot Sales Overview
              </h3>

              <p className="mt-1 truncate text-xs text-gray-500">
                Sales activity and completion status
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <TrendingUp
                className="h-4 w-4 text-blue-600"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {salesStatistics.map((item) => (
              <BreakdownCard
                key={item.label}
                {...item}
                total={Math.max(totalSales, total)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Payment Status */}

      {(paymentTotal > 0 || hasPaidValue || hasBalanceValue) && (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-900">
                Plot Payment Status
              </h3>

              <p className="mt-1 truncate text-xs text-gray-500">
                Payment completion across plot sales
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
              <Wallet
                className="h-4 w-4 text-emerald-600"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {paymentStatistics.map((item) => {
              const Icon = item.icon;
              const percentage = getPercentage(
                item.value,
                paymentTotal
              );

              return (
                <div
                  key={item.label}
                  className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/60 p-4"
                >
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.backgroundClass}`}
                      >
                        <Icon
                          className={`h-4 w-4 ${item.iconClass}`}
                          aria-hidden="true"
                        />
                      </div>

                      <span className="truncate text-sm font-semibold text-gray-700">
                        {item.label}
                      </span>
                    </div>

                    <span className="shrink-0 text-sm font-bold text-gray-900">
                      {formatNumber(item.value)}
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.progressClass}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <p className="mt-2 text-right text-[11px] font-medium text-gray-500">
                    {formatPercentage(percentage)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Financial Overview */}

      {hasFinancialData && (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                  <CircleDollarSign
                    className="h-4 w-4 text-indigo-600"
                    aria-hidden="true"
                  />
                </div>

                <h3 className="truncate text-sm font-bold text-gray-900">
                  Plot Financial Overview
                </h3>
              </div>

              <p className="mt-2 truncate text-xs text-gray-500">
                Inventory value, sales collections and outstanding balances
              </p>
            </div>

            {hasSalesValue && hasPaidValue && (
              <div className="flex items-center gap-2 self-start rounded-full bg-gray-50 px-3 py-1.5 sm:self-auto">
                <TrendingUp
                  className="h-3.5 w-3.5 text-emerald-600"
                  aria-hidden="true"
                />

                <span className="text-xs font-semibold text-gray-600">
                  {formatPercentage(collectionRate)} collected
                </span>
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <FinancialCard
                label="Inventory Value"
                value={formatCurrency(inventoryValue)}
                description="Total asking value of plots"
                icon={LandPlot}
                wrapperClass="border-indigo-100 bg-indigo-50/60 text-indigo-700"
                iconClass="bg-indigo-100 text-indigo-600"
              />

              <FinancialCard
                label="Total Sales Value"
                value={formatCurrency(salesValue)}
                description="Value of recorded plot sales"
                icon={CircleDollarSign}
                wrapperClass="border-blue-100 bg-blue-50/60 text-blue-700"
                iconClass="bg-blue-100 text-blue-600"
              />

              <FinancialCard
                label="Amount Collected"
                value={formatCurrency(totalPaid)}
                description="Payments received"
                icon={Wallet}
                wrapperClass="border-emerald-100 bg-emerald-50/60 text-emerald-700"
                iconClass="bg-emerald-100 text-emerald-600"
              />

              <FinancialCard
                label="Outstanding Balance"
                value={formatCurrency(totalBalance)}
                description="Amount still due"
                icon={AlertCircle}
                wrapperClass="border-amber-100 bg-amber-50/60 text-amber-700"
                iconClass="bg-amber-100 text-amber-600"
              />
            </div>

            {/* Collection Progress */}

            {hasSalesValue && hasPaidValue && (
              <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                      <TrendingUp
                        className="h-4 w-4 text-emerald-600"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-gray-700">
                        Sales Collection Progress
                      </p>

                      <p className="hidden truncate text-[10px] text-gray-400 sm:block">
                        Amount collected against total sales value
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-sm font-bold text-gray-900">
                    {formatPercentage(collectionRate)}
                  </span>
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="truncate text-[10px] text-gray-400">
                    Collected: {formatCurrency(totalPaid)}
                  </span>

                  <span className="truncate text-[10px] text-gray-400">
                    Due: {formatCurrency(totalBalance)}
                  </span>
                </div>
              </div>
            )}

            {/* Average Plot Value */}

            {hasInventoryValue && (
              <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50">
                    <Banknote
                      className="h-5 w-5 text-purple-600"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-gray-700">
                      Average Plot Value
                    </p>

                    <p className="mt-1 truncate text-[11px] text-gray-400">
                      Inventory value divided by total plots
                    </p>
                  </div>
                </div>

                <span className="shrink-0 text-lg font-bold text-gray-900">
                  {formatCurrency(averagePlotValue)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Financial Data */}

      {!hasFinancialData && (
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <CircleDollarSign className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />

          <div>
            <p className="text-sm font-semibold text-gray-700">
              Financial statistics unavailable
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Inventory and sales counts are displayed above. Financial
              cards will populate when the statistics API returns inventory
              value, sales value, or payment totals.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default PlotStatistics;
