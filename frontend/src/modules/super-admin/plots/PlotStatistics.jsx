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

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "object") {
    return toNumber(
      value.count ??
      value.total ??
      value.value ??
      value.amount ??
      value.total_amount ??
      value.amount_paid ??
      value.balance ??
      0
    );
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(toNumber(value));

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(toNumber(value));

const formatPercentage = (value) =>
  `${toNumber(value).toFixed(1)}%`;

const getPercentage = (value, total) => {
  const amount = toNumber(value);
  const denominator = toNumber(total);

  if (denominator <= 0) return 0;

  return Math.min(100, Math.max(0, (amount / denominator) * 100));
};

/*
|--------------------------------------------------------------------------
| Normalize Laravel/API Statistics
|--------------------------------------------------------------------------
|
| Supports:
| { data: { total_plots: 10 } }
| { data: { statistics: { total: 10 } } }
| { data: { plots: { total: 10 }, sales: {...} } }
| { statistics: { inventory: {...}, financials: {...} } }
|--------------------------------------------------------------------------
*/

const getStatisticsSource = (input) => {
  let source = input;

  // Unwrap common API envelope layers.
  for (let index = 0; index < 6; index += 1) {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      return {};
    }

    if (source.statistics && typeof source.statistics === "object") {
      source = source.statistics;
      continue;
    }

    if (
      source.data &&
      typeof source.data === "object" &&
      !Array.isArray(source.data)
    ) {
      source = source.data;
      continue;
    }

    break;
  }

  return source && typeof source === "object" ? source : {};
};

const normalizeKey = (key) =>
  String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

/*
|--------------------------------------------------------------------------
| Find Values in Nested Statistic Groups
|--------------------------------------------------------------------------
*/

const getStatisticValue = (statistics, keys = [], fallback = 0) => {
  const source = getStatisticsSource(statistics);
  const wantedKeys = keys.map(normalizeKey);
  const visited = new Set();

  const findValue = (object, depth = 0) => {
    if (
      !object ||
      typeof object !== "object" ||
      Array.isArray(object) ||
      depth > 5 ||
      visited.has(object)
    ) {
      return undefined;
    }

    visited.add(object);

    // Search the current object first.
    for (const [key, value] of Object.entries(object)) {
      if (
        wantedKeys.includes(normalizeKey(key)) &&
        value !== null &&
        value !== undefined &&
        value !== ""
      ) {
        if (typeof value !== "object" || Array.isArray(value)) {
          return value;
        }

        const nestedValue =
          value.count ??
          value.total ??
          value.value ??
          value.amount ??
          value.total_amount ??
          value.amount_paid ??
          value.balance;

        if (nestedValue !== undefined && nestedValue !== null) {
          return nestedValue;
        }
      }
    }

    // Search nested groups, such as plots, sales, payments and financials.
    for (const value of Object.values(object)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const result = findValue(value, depth + 1);

        if (result !== undefined) return result;
      }
    }

    return undefined;
  };

  const result = findValue(source);

  return result === undefined ? fallback : result;
};

const hasStatistic = (statistics, keys = []) => {
  const marker = "__PLOT_STATISTIC_NOT_FOUND__";

  return (
    getStatisticValue(statistics, keys, marker) !== marker
  );
};

/*
|--------------------------------------------------------------------------
| Plot Record Fallbacks
|--------------------------------------------------------------------------
*/

const getPlotStatus = (plot) =>
  String(plot?.status ?? plot?.plot_status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const countPlotsByStatus = (plots, statuses) => {
  if (!Array.isArray(plots)) return 0;

  const normalizedStatuses = statuses.map((status) =>
    status.toLowerCase().replace(/[\s-]+/g, "_")
  );

  return plots.filter((plot) =>
    normalizedStatuses.includes(getPlotStatus(plot))
  ).length;
};

const countPlots = (plots) =>
  Array.isArray(plots) ? plots.length : 0;

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
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>

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
            className={`h-full rounded-full transition-all duration-700 ${progressClass}`}
            style={{ width: `${safeProgress}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-gray-500">
            {description}
          </p>

          {safeProgress > 0 && (
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
| Breakdown Card
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
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>

      <span className="truncate text-xs font-semibold">{label}</span>
    </div>

    <p
      className="mt-4 break-words text-xl font-bold leading-tight tracking-tight text-gray-900 sm:text-2xl"
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="h-8 w-24 rounded bg-gray-200" />
            </div>
            <div className="h-11 w-11 rounded-xl bg-gray-200" />
          </div>
          <div className="mt-5 h-1.5 rounded bg-gray-200" />
          <div className="mt-2 h-3 w-32 rounded bg-gray-200" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5"
        >
          <div className="h-4 w-36 rounded bg-gray-200" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((number) => (
              <div key={number} className="rounded-xl bg-gray-100 p-4">
                <div className="h-9 w-9 rounded-lg bg-gray-200" />
                <div className="mt-3 h-3 w-20 rounded bg-gray-200" />
                <div className="mt-2 h-1 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </section>
);

/*
|--------------------------------------------------------------------------
| Main Plot Statistics Component
|--------------------------------------------------------------------------
*/

const PlotStatistics = ({
  statistics = {},
  plots = [],
  loading = false,
}) => {
  const source = getStatisticsSource(statistics);
  const plotRecords = Array.isArray(plots) ? plots : [];

  /*
  |--------------------------------------------------------------------------
  | Inventory
  |--------------------------------------------------------------------------
  */

  const apiTotal = getStatisticValue(source, [
    "total_plots",
    "total",
    "plots_count",
    "total_count",
    "count",
    "total_records",
  ], undefined);

  const total =
    apiTotal !== undefined
      ? toNumber(apiTotal)
      : countPlots(plotRecords);

  const availableFromApi = getStatisticValue(source, [
    "available_plots",
    "available",
    "available_count",
    "plots_available",
  ], undefined);

  const available =
    availableFromApi !== undefined
      ? toNumber(availableFromApi)
      : countPlotsByStatus(plotRecords, ["available"]);

  const reservedFromApi = getStatisticValue(source, [
    "reserved_plots",
    "reserved",
    "reserved_count",
    "plots_reserved",
  ], undefined);

  const reserved =
    reservedFromApi !== undefined
      ? toNumber(reservedFromApi)
      : countPlotsByStatus(plotRecords, ["reserved"]);

  const soldFromApi = getStatisticValue(source, [
    "sold_plots",
    "sold",
    "sold_count",
    "plots_sold",
  ], undefined);

  const sold =
    soldFromApi !== undefined
      ? toNumber(soldFromApi)
      : countPlotsByStatus(plotRecords, ["sold"]);

  const unavailableFromApi = getStatisticValue(source, [
    "unavailable_plots",
    "unavailable",
    "unavailable_count",
    "plots_unavailable",
  ], undefined);

  const unavailable =
    unavailableFromApi !== undefined
      ? toNumber(unavailableFromApi)
      : countPlotsByStatus(plotRecords, [
        "unavailable",
        "inactive",
        "maintenance",
      ]);

  /*
  |--------------------------------------------------------------------------
  | Sales
  |--------------------------------------------------------------------------
  */

  const totalSales = toNumber(
    getStatisticValue(source, [
      "total_sales",
      "sales_count",
      "plot_sales_count",
      "total_plot_sales",
      "sales_total",
    ])
  );

  const pendingSales = toNumber(
    getStatisticValue(source, [
      "pending_sales",
      "pending_sales_count",
      "sales_pending",
      "pending_count",
    ])
  );

  const completedSales = toNumber(
    getStatisticValue(source, [
      "completed_sales",
      "completed_sales_count",
      "successful_sales",
      "sales_completed",
    ], sold)
  );

  const cancelledSales = toNumber(
    getStatisticValue(source, [
      "cancelled_sales",
      "cancelled_sales_count",
      "sales_cancelled",
    ])
  );

  /*
  |--------------------------------------------------------------------------
  | Payments
  |--------------------------------------------------------------------------
  */

  const paidPayments = toNumber(
    getStatisticValue(source, [
      "paid_payments",
      "fully_paid",
      "paid",
      "payment_paid",
      "paid_count",
      "paid_payments_count",
    ])
  );

  const partialPayments = toNumber(
    getStatisticValue(source, [
      "partial_payments",
      "partially_paid",
      "partial",
      "payment_partial",
      "partial_count",
      "partial_payments_count",
    ])
  );

  const unpaidPayments = toNumber(
    getStatisticValue(source, [
      "unpaid_payments",
      "unpaid",
      "payment_pending",
      "pending_payment",
      "unpaid_count",
      "pending_payments_count",
    ])
  );

  const paymentTotal =
    paidPayments + partialPayments + unpaidPayments;

  /*
  |--------------------------------------------------------------------------
  | Financials
  |--------------------------------------------------------------------------
  */

  const inventoryValue = toNumber(
    getStatisticValue(source, [
      "total_inventory_value",
      "inventory_value",
      "total_asking_price",
      "total_asking_prices",
      "total_plot_value",
      "total_value",
      "asking_price_total",
      "total_asking_value",
    ])
  );

  const salesValue = toNumber(
    getStatisticValue(source, [
      "total_sales_value",
      "sales_value",
      "total_sold_value",
      "sold_value",
      "total_revenue",
      "revenue",
      "total_sale_amount",
      "sales_amount",
    ])
  );

  const totalPaid = toNumber(
    getStatisticValue(source, [
      "total_paid",
      "amount_paid",
      "paid_amount",
      "total_collected",
      "collected",
      "total_payments",
      "total_amount_paid",
      "payments_total",
    ])
  );

  const suppliedBalance = getStatisticValue(source, [
    "total_balance",
    "outstanding_balance",
    "balance",
    "amount_due",
    "outstanding",
    "total_outstanding",
    "total_amount_due",
    "remaining_balance",
  ], undefined);

  const totalBalance =
    suppliedBalance !== undefined
      ? toNumber(suppliedBalance)
      : Math.max(salesValue - totalPaid, 0);

  const averagePlotValue =
    total > 0 && inventoryValue > 0
      ? inventoryValue / total
      : total > 0 && salesValue > 0 && sold > 0
        ? salesValue / sold
        : 0;

  const collectionRate = getPercentage(totalPaid, salesValue);

  const hasInventoryValue = hasStatistic(source, [
    "total_inventory_value",
    "inventory_value",
    "total_asking_price",
    "total_asking_prices",
    "total_plot_value",
    "total_value",
    "asking_price_total",
    "total_asking_value",
  ]);

  const hasSalesValue = hasStatistic(source, [
    "total_sales_value",
    "sales_value",
    "total_sold_value",
    "sold_value",
    "total_revenue",
    "revenue",
    "total_sale_amount",
    "sales_amount",
  ]);

  const hasPaidValue = hasStatistic(source, [
    "total_paid",
    "amount_paid",
    "paid_amount",
    "total_collected",
    "collected",
    "total_payments",
    "total_amount_paid",
    "payments_total",
  ]);

  const hasBalanceValue = hasStatistic(source, [
    "total_balance",
    "outstanding_balance",
    "balance",
    "amount_due",
    "outstanding",
    "total_outstanding",
    "total_amount_due",
    "remaining_balance",
  ]);

  const hasFinancialData =
    hasInventoryValue ||
    hasSalesValue ||
    hasPaidValue ||
    hasBalanceValue;

  if (loading) {
    return <PlotStatisticsSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Main Statistic Cards
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
          <StatisticCard key={item.label} {...item} />
        ))}
      </div>

      {/* Inventory and Sales */}

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Plot Inventory Status
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Current distribution of plot availability
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
              <LandPlot className="h-4 w-4 text-indigo-600" />
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

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Plot Sales Overview
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Sales activity and completion status
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <TrendingUp className="h-4 w-4 text-blue-600" />
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
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Plot Payment Status
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Payment completion across plot sales
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <Wallet className="h-4 w-4 text-emerald-600" />
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
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.backgroundClass}`}
                      >
                        <Icon
                          className={`h-4 w-4 ${item.iconClass}`}
                        />
                      </div>
                      <span className="truncate text-sm font-semibold text-gray-700">
                        {item.label}
                      </span>
                    </div>

                    <span className="text-sm font-bold text-gray-900">
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
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                  <CircleDollarSign className="h-4 w-4 text-indigo-600" />
                </div>

                <h3 className="text-sm font-bold text-gray-900">
                  Plot Financial Overview
                </h3>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Inventory value, sales collections and outstanding balances
              </p>
            </div>

            {hasSalesValue && hasPaidValue && (
              <div className="flex items-center gap-2 self-start rounded-full bg-gray-50 px-3 py-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
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

            {hasSalesValue && hasPaidValue && (
              <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-xs font-semibold text-gray-700">
                      Sales Collection Progress
                    </p>
                  </div>

                  <span className="text-sm font-bold text-gray-900">
                    {formatPercentage(collectionRate)}
                  </span>
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-gray-500">
                    Collected: {formatCurrency(totalPaid)}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Due: {formatCurrency(totalBalance)}
                  </span>
                </div>
              </div>
            )}

            {hasInventoryValue && (
              <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                    <Banknote className="h-5 w-5 text-purple-600" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-700">
                      Average Plot Value
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
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
              Inventory counts can use the supplied plot records. Financial
              totals require the statistics API to return inventory value,
              sales value or payment totals.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default PlotStatistics;
