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

  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").replace(/[^\d.-]/g, "");
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : 0;
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

const formatPercentage = (value) =>
  `${toNumber(value).toFixed(1)}%`;

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

  const findValue = (object, depth = 0, visited = new Set()) => {
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

    // Search exact field names before inspecting nested objects.
    for (const key of keys) {
      const matchingEntry = Object.entries(object).find(
        ([field]) => normalizeKey(field) === normalizeKey(key)
      );

      if (matchingEntry) {
        const value = matchingEntry[1];

        if (value !== null && value !== undefined && value !== "") {
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
    }

    // Support nested API statistics structures.
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
      }
    }

    for (const value of Object.values(object)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const result = findValue(value, depth + 1, visited);

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

  const balance = toNumber(sale?.balance);
  const amountPaid = toNumber(sale?.amount_paid);

  if (balance <= 0 && amountPaid > 0) return "paid";
  if (amountPaid > 0 && balance > 0) return "partial";

  return "unpaid";
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

  return sales.filter(
    (sale) =>
      getSaleStatus(sale) !== "cancelled" &&
      getPaymentStatus(sale) === status
  ).length;
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
  wide = false,
}) => {
  const safeProgress = Math.min(100, Math.max(0, toNumber(progress)));

  return (
    <div
      className={`group relative min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md sm:p-6 ${wide ? "md:flex md:items-center md:gap-8" : ""
        }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${progressClass}`}
      />

      <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {label}
          </p>

          <p
            className={`mt-3 break-words font-bold tracking-tight text-gray-900 ${wide
              ? "text-2xl sm:text-3xl lg:text-4xl"
              : "text-2xl sm:text-3xl"
              }`}
          >
            {value}
          </p>

          <p className="mt-2 text-sm text-gray-500">{description}</p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconWrapperClass}`}
        >
          <Icon
            className={`h-5 w-5 ${iconClass}`}
            strokeWidth={2}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className={`mt-5 ${wide ? "md:mt-0 md:w-2/5 md:shrink-0" : ""}`}>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${progressClass}`}
            style={{ width: `${safeProgress}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500">{description}</p>

          <span className="shrink-0 text-xs font-semibold text-gray-500">
            {formatPercentage(safeProgress)}
          </span>
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
    <div className="group min-w-0 rounded-xl border border-gray-200/80 bg-gray-50/70 p-4 transition-all duration-200 hover:border-gray-300 hover:bg-white hover:shadow-sm">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${backgroundClass}`}
        >
          <Icon
            className={`h-4 w-4 ${iconClass}`}
            strokeWidth={2}
            aria-hidden="true"
          />
        </div>

        <span className="truncate text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          {formatNumber(value)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-gray-600">
          {label}
        </p>

        <span className="shrink-0 text-xs font-semibold text-gray-400">
          {formatPercentage(percentage)}
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
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
  wide = false,
}) => (
  <div
    className={`group min-w-0 overflow-hidden rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${wide ? "md:flex md:items-center md:justify-between md:gap-6" : ""
      } ${wrapperClass}`}
  >
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
          {label}
        </p>

        <p className="mt-1 text-xs opacity-70">{description}</p>
      </div>
    </div>

    <p
      className={`mt-4 break-words font-bold leading-tight tracking-tight text-gray-900 ${wide ? "md:mt-0 md:text-right md:text-2xl" : "text-xl sm:text-2xl"
        }`}
      title={value}
    >
      {value}
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
    className="min-w-0 space-y-6"
  >
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="h-8 w-28 rounded bg-gray-200" />
            </div>
            <div className="h-12 w-12 rounded-xl bg-gray-200" />
          </div>
          <div className="mt-6 h-2 rounded bg-gray-200" />
        </div>
      ))}
    </div>

    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6">
      <div className="h-3 w-32 rounded bg-gray-200" />
      <div className="mt-3 h-9 w-48 rounded bg-gray-200" />
      <div className="mt-6 h-2 rounded bg-gray-200" />
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
                <div className="mt-3 h-1.5 rounded bg-gray-200" />
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
      sumSales(excludedSales, (sale) =>
        Math.max(toNumber(sale.balance), 0)
      )
    )
  );

  const totalDeposits = toNumber(
    getStatisticValue(
      source,
      depositKeys,
      sumSales(excludedSales, (sale) => sale.deposit ?? sale.deposit_amount)
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
  | Primary Statistics
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
      className="min-w-0 space-y-6"
    >
      {/* Primary Statistics: Three Cards + Full-Width Fourth Card */}

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
        {primaryStatistics.map((item) => (
          <StatisticCard key={item.label} {...item} />
        ))}

        <div className="min-w-0 md:col-span-3">
          <StatisticCard
            label="Outstanding Balance"
            value={formatCurrency(totalBalance, currency)}
            icon={Wallet}
            iconWrapperClass="bg-red-50"
            iconClass="text-red-600"
            progress={getPercentage(
              totalBalance,
              totalCollected + totalBalance
            )}
            progressClass="bg-red-500"
            description={`Remaining balance • ${formatCurrency(
              totalCollected,
              currency
            )} collected`}
            wide
          />
        </div>
      </div>

      {/* Sale Status and Payment Status */}

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Plot Sales Status
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Distribution of sales by their current status
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {saleStatusStatistics.map((item) => (
              <BreakdownCard
                key={item.label}
                {...item}
                total={totalSales}
              />
            ))}
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Payment Completion
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Payment progress across recorded plot sales
              </p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <Wallet className="h-5 w-5 text-emerald-600" />
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
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                  <CircleDollarSign className="h-5 w-5 text-indigo-600" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Plot Sales Financial Overview
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Sales value, collections, discounts and balances
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">
                {formatPercentage(collectionRate)} collected
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {/* Three Financial Cards + Full-Width Fourth Card */}

            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
              <FinancialCard
                label="Net Sales Value"
                value={formatCurrency(salesValue, currency)}
                description="Sales value after discounts"
                icon={CircleDollarSign}
                wrapperClass="border-indigo-100 bg-indigo-50/60"
                iconClass="bg-indigo-100 text-indigo-600"
              />

              <FinancialCard
                label="Amount Collected"
                value={formatCurrency(totalCollected, currency)}
                description="Payments received against sales"
                icon={Wallet}
                wrapperClass="border-emerald-100 bg-emerald-50/60"
                iconClass="bg-emerald-100 text-emerald-600"
              />

              <FinancialCard
                label="Outstanding Balance"
                value={formatCurrency(totalBalance, currency)}
                description="Amount remaining to be paid"
                icon={AlertCircle}
                wrapperClass="border-amber-100 bg-amber-50/60"
                iconClass="bg-amber-100 text-amber-600"
              />

              <div className="min-w-0 md:col-span-3">
                <FinancialCard
                  label="Total Discounts"
                  value={formatCurrency(totalDiscounts, currency)}
                  description="Total discounts applied across eligible plot sales"
                  icon={HandCoins}
                  wrapperClass="border-purple-100 bg-purple-50/60"
                  iconClass="bg-purple-100 text-purple-600"
                  wide
                />
              </div>
            </div>

            {/* Collection Progress */}

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50/70 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Sales Collection Progress
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Payments received compared with the total amount due
                    </p>
                  </div>
                </div>

                <span className="text-2xl font-bold tracking-tight text-gray-900">
                  {formatPercentage(collectionRate)}
                </span>
              </div>

              <div
                className="mt-5 h-3 overflow-hidden rounded-full bg-gray-200"
                role="progressbar"
                aria-label="Sales collection progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Number(collectionRate.toFixed(1))}
              >
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium text-gray-500">
                    Total Collected
                  </p>
                  <p className="mt-2 break-words text-lg font-bold text-emerald-700">
                    {formatCurrency(totalCollected, currency)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium text-gray-500">
                    Outstanding Amount
                  </p>
                  <p className="mt-2 break-words text-lg font-bold text-amber-700">
                    {formatCurrency(totalBalance, currency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Financial Details */}

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Banknote className="h-5 w-5 text-blue-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600">
                    Gross Sales Value
                  </p>
                  <p className="mt-1 break-words text-base font-bold text-gray-900">
                    {formatCurrency(grossSalesValue, currency)}
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50">
                  <HandCoins className="h-5 w-5 text-purple-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600">
                    Deposits Recorded
                  </p>
                  <p className="mt-1 break-words text-base font-bold text-gray-900">
                    {formatCurrency(totalDeposits, currency)}
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                  <Receipt className="h-5 w-5 text-indigo-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600">
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
        <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <CircleDollarSign className="h-5 w-5 text-gray-500" />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800">
              Financial statistics unavailable
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
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