
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock3,
  CircleDollarSign,
  FileCheck2,
  HandCoins,
  Receipt,
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

const formatCurrency = (value, currency = "KES") => {
  const safeCurrency = /^[A-Z]{3}$/.test(String(currency))
    ? currency
    : "KES";

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(toNumber(value));
  } catch {
    return `KES ${formatNumber(value)}`;
  }
};

const formatPercentage = (value) => `${toNumber(value).toFixed(1)}%`;

const getPercentage = (value, total) => {
  const amount = toNumber(value);
  const denominator = toNumber(total);

  if (denominator <= 0) return 0;

  return Math.min(100, Math.max(0, (amount / denominator) * 100));
};

const normalizeKey = (key) =>
  String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const normalizeStatus = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

/*
|--------------------------------------------------------------------------
| Normalize API Statistics
|--------------------------------------------------------------------------
*/

const getStatisticsSource = (input) => {
  let source = input;

  for (let index = 0; index < 8; index += 1) {
    if (
      !source ||
      typeof source !== "object" ||
      Array.isArray(source)
    ) {
      return {};
    }

    if (
      source.statistics &&
      typeof source.statistics === "object" &&
      !Array.isArray(source.statistics)
    ) {
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

/*
|--------------------------------------------------------------------------
| Find Statistic Values
|--------------------------------------------------------------------------
*/

const getStatisticValue = (
  statistics,
  keys = [],
  fallback = undefined
) => {
  const source = getStatisticsSource(statistics);
  const wantedKeys = keys.map(normalizeKey);
  const visited = new Set();

  const findValue = (object, depth = 0) => {
    if (
      !object ||
      typeof object !== "object" ||
      Array.isArray(object) ||
      depth > 6 ||
      visited.has(object)
    ) {
      return undefined;
    }

    visited.add(object);

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
          value.amount_paid ??
          value.balance;

        if (nestedValue !== undefined && nestedValue !== null) {
          return nestedValue;
        }
      }
    }

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
  const marker = "__PLOT_SALE_STATISTIC_NOT_FOUND__";

  return getStatisticValue(statistics, keys, marker) !== marker;
};

/*
|--------------------------------------------------------------------------
| Sale Record Helpers
|--------------------------------------------------------------------------
*/

const getSaleStatus = (sale) =>
  normalizeStatus(sale?.status ?? sale?.sale_status);

const getPaymentStatus = (sale) => {
  const suppliedStatus = normalizeStatus(
    sale?.payment_status ?? sale?.payment_status_label
  );

  if (suppliedStatus) {
    if (["paid", "fully_paid", "completed"].includes(suppliedStatus)) {
      return "paid";
    }

    if (
      ["partial", "partially_paid", "partially_paid_status"].includes(
        suppliedStatus
      )
    ) {
      return "partial";
    }

    if (
      ["unpaid", "pending", "overdue", "failed"].includes(suppliedStatus)
    ) {
      return "unpaid";
    }
  }

  const balance = toNumber(sale?.balance);
  const amountPaid = toNumber(sale?.amount_paid);

  if (balance <= 0 && amountPaid > 0) return "paid";
  if (amountPaid > 0 && balance > 0) return "partial";

  return "unpaid";
};

const getNetSalePrice = (sale) => {
  if (
    sale?.net_sale_price !== null &&
    sale?.net_sale_price !== undefined &&
    sale?.net_sale_price !== ""
  ) {
    return toNumber(sale.net_sale_price);
  }

  return Math.max(
    toNumber(sale?.sale_price) -
    toNumber(sale?.discount_amount ?? sale?.discount),
    0
  );
};

const countSalesByStatus = (sales, statuses) => {
  if (!Array.isArray(sales)) return 0;

  const accepted = statuses.map(normalizeStatus);

  return sales.filter((sale) =>
    accepted.includes(getSaleStatus(sale))
  ).length;
};

const sumSales = (sales, selector) => {
  if (!Array.isArray(sales)) return 0;

  return sales.reduce(
    (total, sale) => total + toNumber(selector(sale)),
    0
  );
};

const countPaymentsByStatus = (sales, status) => {
  if (!Array.isArray(sales)) return 0;

  return sales.filter((sale) => getPaymentStatus(sale) === status).length;
};

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
  const safeProgress = Math.min(100, Math.max(0, toNumber(progress)));

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

          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
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
          <p className="truncate text-xs text-gray-500">{description}</p>

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

const PlotSaleStatisticsSkeleton = () => (
  <section
    aria-label="Plot sales statistics loading"
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
| Main Plot Sale Statistics Component
|--------------------------------------------------------------------------
*/

const PlotSaleStatistics = ({
  statistics = {},
  sales,
  plotSales,
  loading = false,
}) => {
  const source = getStatisticsSource(statistics);

  const saleRecords = Array.isArray(sales)
    ? sales
    : Array.isArray(plotSales)
      ? plotSales
      : [];

  if (loading) {
    return <PlotSaleStatisticsSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Sales Counts
  |--------------------------------------------------------------------------
  */

  const totalSales = toNumber(
    getStatisticValue(
      source,
      [
        "total_sales",
        "total_plot_sales",
        "plot_sales_count",
        "sales_count",
        "sales_total",
        "total_records",
        "total",
      ],
      saleRecords.length
    )
  );

  const pendingSales = toNumber(
    getStatisticValue(
      source,
      ["pending_sales", "sales_pending", "pending_sales_count"],
      countSalesByStatus(saleRecords, ["pending"])
    )
  );

  const reservedSales = toNumber(
    getStatisticValue(
      source,
      ["reserved_sales", "sales_reserved", "reserved_sales_count"],
      countSalesByStatus(saleRecords, ["reserved"])
    )
  );

  const approvedSales = toNumber(
    getStatisticValue(
      source,
      ["approved_sales", "sales_approved", "approved_sales_count"],
      countSalesByStatus(saleRecords, ["approved"])
    )
  );

  const completedSales = toNumber(
    getStatisticValue(
      source,
      [
        "completed_sales",
        "sales_completed",
        "completed_sales_count",
        "successful_sales",
      ],
      countSalesByStatus(saleRecords, ["completed"])
    )
  );

  const cancelledSales = toNumber(
    getStatisticValue(
      source,
      ["cancelled_sales", "sales_cancelled", "cancelled_sales_count"],
      countSalesByStatus(saleRecords, ["cancelled"])
    )
  );

  /*
  |--------------------------------------------------------------------------
  | Payment Status Counts
  |--------------------------------------------------------------------------
  */

  const paidSales = toNumber(
    getStatisticValue(
      source,
      ["fully_paid_sales", "paid_sales", "fully_paid", "paid_count"],
      countPaymentsByStatus(saleRecords, "paid")
    )
  );

  const partialSales = toNumber(
    getStatisticValue(
      source,
      [
        "partially_paid_sales",
        "partial_sales",
        "partial_payments",
        "partially_paid",
        "partial_count",
      ],
      countPaymentsByStatus(saleRecords, "partial")
    )
  );

  const unpaidSales = toNumber(
    getStatisticValue(
      source,
      [
        "unpaid_sales",
        "unpaid_payments",
        "pending_payment_sales",
        "unpaid_count",
      ],
      countPaymentsByStatus(saleRecords, "unpaid")
    )
  );

  const paymentTotal = paidSales + partialSales + unpaidSales;

  /*
  |--------------------------------------------------------------------------
  | Financial Statistics
  |--------------------------------------------------------------------------
  */

  const currency =
    getStatisticValue(source, ["currency", "default_currency"], "KES") ||
    "KES";

  const grossSalesKeys = [
    "gross_sales_value",
    "total_gross_sales",
    "gross_sales",
    "total_gross_amount",
    "total_amount",
  ];

  const netSalesKeys = [
    "total_net_sales",
    "net_sales_value",
    "total_sales_value",
    "sales_value",
    "total_sold_value",
    "sold_value",
    "total_revenue",
    "revenue",
    "total_sale_amount",
    "sales_amount",
  ];

  const collectedKeys = [
    "total_paid",
    "total_amount_paid",
    "amount_paid",
    "paid_amount",
    "total_collected",
    "collected",
    "total_payments",
    "payments_total",
  ];

  const balanceKeys = [
    "total_outstanding",
    "total_balance",
    "outstanding_balance",
    "total_amount_due",
    "remaining_balance",
    "amount_due",
    "outstanding",
  ];

  const discountKeys = [
    "total_discount",
    "total_discounts",
    "discount_amount",
    "discounts_total",
  ];

  const depositKeys = [
    "total_deposit",
    "total_deposits",
    "total_deposit_amount",
    "deposit_amount",
    "deposits_total",
  ];

  const excludedSales = saleRecords.filter(
    (sale) => getSaleStatus(sale) !== "cancelled"
  );

  const grossSalesValue = toNumber(
    getStatisticValue(
      source,
      grossSalesKeys,
      sumSales(excludedSales, (sale) => sale.sale_price)
    )
  );

  const totalDiscounts = toNumber(
    getStatisticValue(
      source,
      discountKeys,
      sumSales(
        excludedSales,
        (sale) => sale.discount_amount ?? sale.discount
      )
    )
  );

  const salesValue = toNumber(
    getStatisticValue(
      source,
      netSalesKeys,
      Math.max(grossSalesValue - totalDiscounts, 0)
    )
  );

  const totalCollected = toNumber(
    getStatisticValue(
      source,
      collectedKeys,
      sumSales(excludedSales, (sale) => sale.amount_paid)
    )
  );

  const totalBalance = toNumber(
    getStatisticValue(
      source,
      balanceKeys,
      sumSales(excludedSales, (sale) => Math.max(toNumber(sale.balance), 0))
    )
  );

  const totalDeposits = toNumber(
    getStatisticValue(
      source,
      depositKeys,
      sumSales(excludedSales, (sale) => sale.deposit_amount)
    )
  );

  const averageSaleValue =
    completedSales > 0
      ? salesValue / completedSales
      : totalSales > 0
        ? salesValue / totalSales
        : 0;

  const collectionRate = getPercentage(
    totalCollected,
    totalCollected + totalBalance
  );

  const hasFinancialData =
    hasStatistic(source, [
      ...grossSalesKeys,
      ...netSalesKeys,
      ...collectedKeys,
      ...balanceKeys,
      ...discountKeys,
      ...depositKeys,
    ]) || saleRecords.length > 0;

  /*
  |--------------------------------------------------------------------------
  | Primary Statistic Cards
  |--------------------------------------------------------------------------
  */

  const primaryStatistics = [
    {
      label: "Total Sales",
      value: formatNumber(totalSales),
      icon: Receipt,
      iconWrapperClass: "bg-indigo-50",
      iconClass: "text-indigo-600",
      progress: totalSales > 0 ? 100 : 0,
      progressClass: "bg-indigo-500",
      description: "All recorded plot sales",
    },
    {
      label: "Pending Sales",
      value: formatNumber(pendingSales),
      icon: Clock3,
      iconWrapperClass: "bg-amber-50",
      iconClass: "text-amber-600",
      progress: getPercentage(pendingSales, totalSales),
      progressClass: "bg-amber-500",
      description: "Awaiting processing",
    },
    {
      label: "Completed Sales",
      value: formatNumber(completedSales),
      icon: CheckCircle2,
      iconWrapperClass: "bg-emerald-50",
      iconClass: "text-emerald-600",
      progress: getPercentage(completedSales, totalSales),
      progressClass: "bg-emerald-500",
      description: "Successfully completed",
    },
    {
      label: "Outstanding Balance",
      value: formatCurrency(totalBalance, currency),
      icon: Wallet,
      iconWrapperClass: "bg-red-50",
      iconClass: "text-red-600",
      progress: getPercentage(
        totalBalance,
        totalCollected + totalBalance
      ),
      progressClass: "bg-red-500",
      description: "Amount remaining to collect",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Sale Status Breakdown
  |--------------------------------------------------------------------------
  */

  const saleStatusStatistics = [
    {
      label: "Pending",
      value: pendingSales,
      icon: Clock3,
      iconClass: "text-amber-600",
      backgroundClass: "bg-amber-50",
      progressClass: "bg-amber-500",
    },
    {
      label: "Reserved",
      value: reservedSales,
      icon: FileCheck2,
      iconClass: "text-blue-600",
      backgroundClass: "bg-blue-50",
      progressClass: "bg-blue-500",
    },
    {
      label: "Approved",
      value: approvedSales,
      icon: CheckCircle2,
      iconClass: "text-indigo-600",
      backgroundClass: "bg-indigo-50",
      progressClass: "bg-indigo-500",
    },
    {
      label: "Completed",
      value: completedSales,
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      backgroundClass: "bg-emerald-50",
      progressClass: "bg-emerald-500",
    },
    {
      label: "Cancelled",
      value: cancelledSales,
      icon: XCircle,
      iconClass: "text-red-600",
      backgroundClass: "bg-red-50",
      progressClass: "bg-red-500",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Payment Status Breakdown
  |--------------------------------------------------------------------------
  */

  const paymentStatusStatistics = [
    {
      label: "Fully Paid",
      value: paidSales,
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      backgroundClass: "bg-emerald-50",
      progressClass: "bg-emerald-500",
    },
    {
      label: "Partially Paid",
      value: partialSales,
      icon: Wallet,
      iconClass: "text-amber-600",
      backgroundClass: "bg-amber-50",
      progressClass: "bg-amber-500",
    },
    {
      label: "Unpaid",
      value: unpaidSales,
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
      aria-label="Plot sales statistics"
      className="min-w-0 space-y-5"
    >
      {/* Primary Statistics */}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primaryStatistics.map((item) => (
          <StatisticCard key={item.label} {...item} />
        ))}
      </div>

      {/* Sale Status and Payment Status */}

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Plot Sales Status
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Distribution of sales by their current status
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {saleStatusStatistics.map((item) => (
              <BreakdownCard
                key={item.label}
                {...item}
                total={totalSales}
              />
            ))}
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Payment Completion
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Payment progress across recorded plot sales
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <Wallet className="h-4 w-4 text-emerald-600" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {paymentStatusStatistics.map((item) => (
              <BreakdownCard
                key={item.label}
                {...item}
                total={paymentTotal}
              />
            ))}
          </div>

          {paymentTotal === 0 && (
            <p className="mt-4 text-xs text-gray-500">
              Payment status counts will appear when payment statistics
              or sale records are available.
            </p>
          )}
        </div>
      </div>

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
                  Plot Sales Financial Overview
                </h3>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Sales value, discounts, collections and outstanding
                balances
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full bg-gray-50 px-3 py-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />

              <span className="text-xs font-semibold text-gray-600">
                {formatPercentage(collectionRate)} collected
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <FinancialCard
                label="Net Sales Value"
                value={formatCurrency(salesValue, currency)}
                description="Sales value after discounts"
                icon={CircleDollarSign}
                wrapperClass="border-indigo-100 bg-indigo-50/60 text-indigo-700"
                iconClass="bg-indigo-100 text-indigo-600"
              />

              <FinancialCard
                label="Amount Collected"
                value={formatCurrency(totalCollected, currency)}
                description="Payments received against sales"
                icon={Wallet}
                wrapperClass="border-emerald-100 bg-emerald-50/60 text-emerald-700"
                iconClass="bg-emerald-100 text-emerald-600"
              />

              <FinancialCard
                label="Outstanding Balance"
                value={formatCurrency(totalBalance, currency)}
                description="Amount remaining to be paid"
                icon={AlertCircle}
                wrapperClass="border-amber-100 bg-amber-50/60 text-amber-700"
                iconClass="bg-amber-100 text-amber-600"
              />

              <FinancialCard
                label="Total Discounts"
                value={formatCurrency(totalDiscounts, currency)}
                description="Discounts applied to sales"
                icon={HandCoins}
                wrapperClass="border-purple-100 bg-purple-50/60 text-purple-700"
                iconClass="bg-purple-100 text-purple-600"
              />
            </div>

            {/* Collection Progress */}

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
                  Collected: {formatCurrency(totalCollected, currency)}
                </span>

                <span className="text-[10px] text-gray-500">
                  Due: {formatCurrency(totalBalance, currency)}
                </span>
              </div>
            </div>

            {/* Additional Financial Details */}

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Banknote className="h-5 w-5 text-blue-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700">
                    Gross Sales Value
                  </p>

                  <p className="mt-1 break-words text-base font-bold text-gray-900">
                    {formatCurrency(grossSalesValue, currency)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50">
                  <HandCoins className="h-5 w-5 text-purple-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700">
                    Deposits Recorded
                  </p>

                  <p className="mt-1 break-words text-base font-bold text-gray-900">
                    {formatCurrency(totalDeposits, currency)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                  <Receipt className="h-5 w-5 text-indigo-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700">
                    Average Sale Value
                  </p>

                  <p className="mt-1 break-words text-base font-bold text-gray-900">
                    {formatCurrency(averageSaleValue, currency)}
                  </p>
                </div>
              </div>
            </div>
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
              Provide statistics from the plot-sales statistics endpoint
              or pass plot sale records through the sales or plotSales prop
              to calculate fallback totals.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default PlotSaleStatistics;
