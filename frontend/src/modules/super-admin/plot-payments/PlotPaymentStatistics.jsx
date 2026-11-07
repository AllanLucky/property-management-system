
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  HandCoins,
  RefreshCw,
  TrendingUp,
  Wallet,
  XCircle,
  Layers,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(toNumber(value));

const formatCurrency = (value, currency = "KES") => {
  const amount = toNumber(value);

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${formatNumber(amount)}`;
  }
};

const getPercentage = (value, total) => {
  const amount = toNumber(value);
  const totalAmount = toNumber(total);

  if (totalAmount <= 0) return 0;

  return Math.min(100, Math.max(0, (amount / totalAmount) * 100));
};

/**
 * Supports:
 * API envelope: { data: { total_payments: 10 } }
 * Axios response: { data: { data: { total_payments: 10 } } }
 * Direct object: { total_payments: 10 }
 */
const getStatistics = (statistics) => {
  let result = statistics;

  for (let index = 0; index < 4; index += 1) {
    if (
      result?.data &&
      typeof result.data === "object" &&
      !Array.isArray(result.data)
    ) {
      result = result.data;
    } else {
      break;
    }
  }

  if (
    result?.statistics &&
    typeof result.statistics === "object" &&
    !Array.isArray(result.statistics)
  ) {
    result = result.statistics;
  }

  return result && typeof result === "object" ? result : {};
};

const getFirstValue = (source, keys, fallback = 0) => {
  for (const key of keys) {
    const value = source?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
};

const normalizeKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const getBreakdownValue = (source, keys) => {
  if (Array.isArray(source)) {
    const item = source.find((entry) =>
      keys.includes(
        normalizeKey(
          entry?.payment_method ??
          entry?.payment_type ??
          entry?.method ??
          entry?.type ??
          entry?.key ??
          entry?.name
        )
      )
    );

    return toNumber(
      item?.count ??
      item?.total ??
      item?.amount ??
      item?.value
    );
  }

  if (!source || typeof source !== "object") {
    return 0;
  }

  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && value !== null) {
      if (typeof value === "object") {
        return toNumber(
          value.count ??
          value.total ??
          value.amount ??
          value.value
        );
      }

      return toNumber(value);
    }
  }

  return 0;
};

/*
|--------------------------------------------------------------------------
| STATISTIC CARD
|--------------------------------------------------------------------------
*/

const StatisticCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "text-indigo-600",
  iconBackground = "bg-indigo-50",
  trend,
  trendLabel,
  loading = false,
  accent = "bg-indigo-500",
  valueSize = "text-xl sm:text-2xl",
}) => (
  <div className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg sm:p-6">
    <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />

    <div className="flex flex-1 items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-500">
          {title}
        </p>

        {loading ? (
          <div className="mt-4 h-9 w-3/4 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <p
            className={`${valueSize} mt-4 break-words font-extrabold leading-tight tracking-tight text-slate-900 [font-variant-numeric:tabular-nums]`}
            title={String(value)}
          >
            {value}
          </p>
        )}

        {description && (
          <p className="mt-3 text-xs leading-5 text-slate-500">
            {description}
          </p>
        )}

        {trendLabel && !loading && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {trend === "down" ? (
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
            ) : (
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            )}

            <span
              className={`text-xs font-bold ${trend === "down"
                ? "text-rose-600"
                : "text-emerald-600"
                }`}
            >
              {trendLabel}
            </span>
          </div>
        )}
      </div>

      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBackground} transition-transform duration-300 group-hover:scale-110`}
      >
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
    </div>
  </div>
);

/*
|--------------------------------------------------------------------------
| BREAKDOWN CARD
|--------------------------------------------------------------------------
*/

const BreakdownCard = ({
  title,
  subtitle = "Payment breakdown",
  icon: Icon,
  iconColor = "text-indigo-600",
  iconBackground = "bg-indigo-50",
  items = [],
  total = 0,
  loading = false,
}) => {
  const validItems = Array.isArray(items) ? items : [];

  const hasData = validItems.some(
    (item) => toNumber(item.value) > 0
  );

  return (
    <div className="min-w-0 h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBackground}`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-slate-900">
              {title}
            </h3>

            <p className="mt-0.5 text-xs text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>

        {!loading && (
          <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 [font-variant-numeric:tabular-nums]">
            {formatNumber(total)}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-5">
          {[1, 2, 3, 4].map((item) => (
            <div key={item}>
              <div className="mb-2 flex justify-between gap-3">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="h-2.5 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      ) : hasData ? (
        <div className="space-y-5">
          {validItems.map((item) => {
            const value = toNumber(item.value);

            if (value <= 0) return null;

            const percentage = getPercentage(value, total);

            return (
              <div key={item.key}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dotColor}`}
                    />
                    <span className="truncate text-sm font-semibold text-slate-700">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <span className="text-sm font-bold text-slate-900 [font-variant-numeric:tabular-nums]">
                      {formatNumber(value)}
                    </span>

                    <span className="text-xs font-medium text-slate-400">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div
                  className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label={`${item.label} percentage`}
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${item.barColor}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
            <Activity className="h-6 w-6 text-slate-300" />
          </div>

          <p className="text-sm font-semibold text-slate-600">
            No breakdown available
          </p>

          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
            Payment data will appear here when available.
          </p>
        </div>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| RECHARTS PAYMENT TYPE GRAPH
|--------------------------------------------------------------------------
*/

const PAYMENT_TYPE_COLORS = {
  deposit: "#10b981",
  installment: "#3b82f6",
  balance: "#f59e0b",
  full_payment: "#8b5cf6",
  other: "#64748b",
};

const PaymentTypeTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload;

  if (!item) return null;

  const percentage = getPercentage(item.value, total);

  return (
    <div className="min-w-[170px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.color }}
        />

        <p className="text-sm font-bold text-slate-800">
          {item.name}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-slate-500">
          Transactions
        </span>

        <span className="text-sm font-bold text-slate-900">
          {formatNumber(item.value)}
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between gap-4">
        <span className="text-xs text-slate-500">
          Percentage
        </span>

        <span className="text-sm font-bold text-indigo-600">
          {percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

const PaymentTypeGraph = ({
  items = [],
  total = 0,
  loading = false,
}) => {
  const validItems = Array.isArray(items)
    ? items.filter((item) => toNumber(item.value) > 0)
    : [];

  const chartData = validItems.map((item) => ({
    name: item.label,
    key: item.key,
    value: toNumber(item.value),
    color: PAYMENT_TYPE_COLORS[item.key] ?? "#64748b",
  }));

  const hasData = chartData.length > 0;

  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50">
            <TrendingUp className="h-5 w-5 text-violet-600" />
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-slate-900">
              Payment Types Graph
            </h3>

            <p className="mt-0.5 text-xs text-slate-500">
              Transaction distribution by purpose
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[280px] flex-1 items-center justify-center">
          <div className="h-52 w-52 animate-pulse rounded-full border-[24px] border-slate-100" />
        </div>
      ) : hasData ? (
        <>
          <div className="relative h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="62%"
                  outerRadius="86%"
                  paddingAngle={4}
                  cornerRadius={5}
                  stroke="none"
                  isAnimationActive
                  animationDuration={900}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={entry.color}
                    />
                  ))}
                </Pie>

                <Tooltip
                  content={
                    <PaymentTypeTooltip total={total} />
                  }
                  cursor={false}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut center content */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total
              </span>

              <span className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 [font-variant-numeric:tabular-nums]">
                {formatNumber(total)}
              </span>

              <span className="mt-1 text-xs font-medium text-slate-500">
                Transactions
              </span>
            </div>
          </div>

          {/* Chart legend */}
          <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
            {chartData.map((item) => {
              const percentage = getPercentage(
                item.value,
                total
              );

              return (
                <div
                  key={item.key}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />

                    <span className="truncate text-xs font-semibold text-slate-600">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {formatNumber(item.value)}
                    </span>

                    <span className="text-xs font-semibold text-slate-400">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
            <Activity className="h-6 w-6 text-slate-300" />
          </div>

          <p className="text-sm font-semibold text-slate-600">
            No graph data available
          </p>

          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
            Payment type statistics will appear here when available.
          </p>
        </div>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| MAIN COMPONENT
|--------------------------------------------------------------------------
*/

const PlotPaymentStatistics = ({
  statistics: statisticsProp = {},
  loading = false,
  statisticsLoading = false,
  onRefresh,
  currency = "KES",
  className = "",
}) => {
  const stats = getStatistics(statisticsProp);

  const isLoading = loading || statisticsLoading;

  /*
  |--------------------------------------------------------------------------
  | SUMMARY VALUES
  |--------------------------------------------------------------------------
  */

  const totalPayments = toNumber(
    getFirstValue(stats, [
      "total_payments",
      "total",
      "payments_count",
      "total_count",
    ])
  );

  const totalAmount = toNumber(
    getFirstValue(stats, [
      "total_amount",
      "total_payments_amount",
      "total_value",
      "total_payment_amount",
    ])
  );

  const averageAmount = toNumber(
    getFirstValue(stats, [
      "average_amount",
      "average_payment_amount",
      "avg_amount",
    ])
  );

  const statusCounts = stats.status_counts ?? {};

  const completedPayments = toNumber(
    getFirstValue(stats, ["completed_payments"], statusCounts.completed)
  );

  const pendingPayments = toNumber(
    getFirstValue(stats, ["pending_payments"], statusCounts.pending)
  );

  const failedPayments = toNumber(
    getFirstValue(stats, ["failed_payments"], statusCounts.failed)
  );

  const cancelledPayments = toNumber(
    getFirstValue(stats, ["cancelled_payments"], statusCounts.cancelled)
  );

  const refundedPayments = toNumber(
    getFirstValue(stats, ["refunded_payments"], statusCounts.refunded)
  );

  /*
   * The current API does not return monetary totals by payment status.
   * Do not calculate or display invented completed/pending amounts.
   */

  const successRate = getPercentage(
    completedPayments,
    totalPayments
  );

  /*
  |--------------------------------------------------------------------------
  | PAYMENT STATUS BREAKDOWN
  |--------------------------------------------------------------------------
  */

  const statusItems = [
    {
      key: "completed",
      label: "Completed",
      value: completedPayments,
      dotColor: "bg-emerald-500",
      barColor: "bg-emerald-500",
    },
    {
      key: "pending",
      label: "Pending",
      value: pendingPayments,
      dotColor: "bg-amber-500",
      barColor: "bg-amber-500",
    },
    {
      key: "failed",
      label: "Failed",
      value: failedPayments,
      dotColor: "bg-rose-500",
      barColor: "bg-rose-500",
    },
    {
      key: "cancelled",
      label: "Cancelled",
      value: cancelledPayments,
      dotColor: "bg-slate-500",
      barColor: "bg-slate-500",
    },
    {
      key: "refunded",
      label: "Refunded",
      value: refundedPayments,
      dotColor: "bg-violet-500",
      barColor: "bg-violet-500",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | PAYMENT METHOD BREAKDOWN
  |--------------------------------------------------------------------------
  */

  const methodStats =
    stats.payment_method_counts ??
    stats.payment_methods ??
    stats.methods ??
    stats.payment_method_breakdown ??
    {};

  const methodItems = [
    {
      key: "mpesa",
      label: "M-Pesa",
      value: getBreakdownValue(methodStats, ["mpesa", "m_pesa"]),
      dotColor: "bg-emerald-500",
      barColor: "bg-emerald-500",
    },
    {
      key: "bank_transfer",
      label: "Bank Transfer",
      value: getBreakdownValue(methodStats, ["bank_transfer", "bank"]),
      dotColor: "bg-blue-500",
      barColor: "bg-blue-500",
    },
    {
      key: "cash",
      label: "Cash",
      value: getBreakdownValue(methodStats, ["cash"]),
      dotColor: "bg-amber-500",
      barColor: "bg-amber-500",
    },
    {
      key: "card",
      label: "Card",
      value: getBreakdownValue(methodStats, ["card"]),
      dotColor: "bg-violet-500",
      barColor: "bg-violet-500",
    },
    {
      key: "cheque",
      label: "Cheque",
      value: getBreakdownValue(methodStats, ["cheque", "check"]),
      dotColor: "bg-cyan-500",
      barColor: "bg-cyan-500",
    },
    {
      key: "online",
      label: "Online",
      value: getBreakdownValue(methodStats, ["online"]),
      dotColor: "bg-indigo-500",
      barColor: "bg-indigo-500",
    },
    {
      key: "other",
      label: "Other",
      value: getBreakdownValue(methodStats, ["other"]),
      dotColor: "bg-slate-500",
      barColor: "bg-slate-500",
    },
  ];

  const totalMethods = methodItems.reduce(
    (sum, item) => sum + item.value,
    0
  );

  /*
  |--------------------------------------------------------------------------
  | PAYMENT TYPE BREAKDOWN
  |--------------------------------------------------------------------------
  */

  const typeStats = stats.payment_type_counts ?? {};

  const typeItems = [
    {
      key: "deposit",
      label: "Deposit",
      value: getBreakdownValue(typeStats, ["deposit"]),
      dotColor: "bg-emerald-500",
      barColor: "bg-emerald-500",
    },
    {
      key: "installment",
      label: "Installment",
      value: getBreakdownValue(typeStats, ["installment"]),
      dotColor: "bg-blue-500",
      barColor: "bg-blue-500",
    },
    {
      key: "balance",
      label: "Balance",
      value: getBreakdownValue(typeStats, ["balance"]),
      dotColor: "bg-amber-500",
      barColor: "bg-amber-500",
    },
    {
      key: "full_payment",
      label: "Full Payment",
      value: getBreakdownValue(typeStats, ["full_payment"]),
      dotColor: "bg-violet-500",
      barColor: "bg-violet-500",
    },
    {
      key: "other",
      label: "Other",
      value: getBreakdownValue(typeStats, ["other"]),
      dotColor: "bg-slate-500",
      barColor: "bg-slate-500",
    },
  ];

  const totalTypes = typeItems.reduce(
    (sum, item) => sum + item.value,
    0
  );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <section className={`min-w-0 space-y-7 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                Payment Overview
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Financial performance and payment analytics
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Monitor plot payment collections, transaction values, and payment status.
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        )}
      </div>

      {/* Primary financial statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-4">
        <StatisticCard
          title="Total Payments"
          value={formatNumber(totalPayments)}
          description="All recorded payment transactions"
          icon={Wallet}
          iconColor="text-indigo-600"
          iconBackground="bg-indigo-50"
          accent="bg-indigo-500"
          loading={isLoading}
          valueSize="text-2xl sm:text-3xl"
        />

        <StatisticCard
          title="Total Payment Value"
          value={formatCurrency(totalAmount, currency)}
          description="Total recorded payment amount"
          icon={CircleDollarSign}
          iconColor="text-blue-600"
          iconBackground="bg-blue-50"
          accent="bg-blue-500"
          loading={isLoading}
          valueSize="text-xl sm:text-2xl"
        />

        <StatisticCard
          title="Average Payment"
          value={formatCurrency(averageAmount, currency)}
          description="Average value per recorded transaction"
          icon={TrendingUp}
          iconColor="text-violet-600"
          iconBackground="bg-violet-50"
          accent="bg-violet-500"
          loading={isLoading}
          valueSize="text-xl sm:text-2xl"
        />

        <StatisticCard
          title="Completed Payments"
          value={formatNumber(completedPayments)}
          description={`${successRate.toFixed(1)}% of all transactions`}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBackground="bg-emerald-50"
          accent="bg-emerald-500"
          loading={isLoading}
          valueSize="text-2xl sm:text-3xl"
        />
      </div>

      {/* Transaction statistics */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900">
            Transaction Statistics
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Overview of payment transaction performance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-4">
          <StatisticCard
            title="Completed Payments"
            value={formatNumber(completedPayments)}
            description="Successfully completed transactions"
            icon={CheckCircle2}
            iconColor="text-emerald-600"
            iconBackground="bg-emerald-50"
            accent="bg-emerald-500"
            loading={isLoading}
            valueSize="text-2xl sm:text-3xl"
          />

          <StatisticCard
            title="Pending Payments"
            value={formatNumber(pendingPayments)}
            description="Awaiting payment confirmation"
            icon={Clock3}
            iconColor="text-amber-600"
            iconBackground="bg-amber-50"
            accent="bg-amber-500"
            loading={isLoading}
            valueSize="text-2xl sm:text-3xl"
          />

          <StatisticCard
            title="Failed Payments"
            value={formatNumber(failedPayments)}
            description="Transactions that were unsuccessful"
            icon={XCircle}
            iconColor="text-rose-600"
            iconBackground="bg-rose-50"
            accent="bg-rose-500"
            loading={isLoading}
            valueSize="text-2xl sm:text-3xl"
          />

          <StatisticCard
            title="Success Rate"
            value={`${successRate.toFixed(1)}%`}
            description="Completed transactions against total payments"
            icon={TrendingUp}
            iconColor="text-violet-600"
            iconBackground="bg-violet-50"
            accent="bg-violet-500"
            loading={isLoading}
            valueSize="text-2xl sm:text-3xl"
          />
        </div>
      </div>

      {/* Payment collection summary */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                <Banknote className="h-5 w-5 text-emerald-600" />
              </div>

              <h3 className="text-base font-bold text-slate-900">
                Payment Value Summary
              </h3>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Total recorded value and average transaction value.
            </p>
          </div>

          <span className="w-fit rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
            {formatNumber(totalPayments)} transactions
          </span>
        </div>

        {isLoading ? (
          <div className="h-4 animate-pulse rounded-full bg-slate-100" />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total Value
              </p>
              <p className="mt-2 break-words text-lg font-extrabold text-slate-900 [font-variant-numeric:tabular-nums]">
                {formatCurrency(totalAmount, currency)}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Completed Transactions
              </p>
              <p className="mt-2 text-lg font-extrabold text-emerald-700 [font-variant-numeric:tabular-nums]">
                {formatNumber(completedPayments)}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                Pending Transactions
              </p>
              <p className="mt-2 text-lg font-extrabold text-amber-700 [font-variant-numeric:tabular-nums]">
                {formatNumber(pendingPayments)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Payment breakdowns */}
      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        <BreakdownCard
          title="Payment Status"
          icon={Activity}
          iconColor="text-indigo-600"
          iconBackground="bg-indigo-50"
          items={statusItems}
          total={totalPayments}
          loading={isLoading}
        />

        <BreakdownCard
          title="Payment Methods"
          icon={CreditCard}
          iconColor="text-blue-600"
          iconBackground="bg-blue-50"
          items={methodItems}
          total={totalMethods}
          loading={isLoading}
        />

        {/* Payment Types Breakdown and Recharts Graph */}
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:col-span-2 lg:grid-cols-2">
          <BreakdownCard
            title="Payment Types"
            subtitle="Breakdown by transaction purpose"
            icon={Layers}
            iconColor="text-violet-600"
            iconBackground="bg-violet-50"
            items={typeItems}
            total={totalTypes}
            loading={isLoading}
          />

          <PaymentTypeGraph
            items={typeItems}
            total={totalTypes}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Additional transaction information */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900">
            Additional Payment Information
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Other payment activities and transaction values.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <CalendarDays className="h-5 w-5 text-slate-600" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">
                Cancelled Payments
              </p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 [font-variant-numeric:tabular-nums]">
                {isLoading ? "—" : formatNumber(cancelledPayments)}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50">
              <HandCoins className="h-5 w-5 text-violet-600" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">
                Refunded Payments
              </p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 [font-variant-numeric:tabular-nums]">
                {isLoading ? "—" : formatNumber(refundedPayments)}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:col-span-2 xl:col-span-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">
                Payment Methods Used
              </p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 [font-variant-numeric:tabular-nums]">
                {isLoading ? "—" : formatNumber(totalMethods)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlotPaymentStatistics;
