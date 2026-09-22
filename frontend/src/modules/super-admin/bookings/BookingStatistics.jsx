import {
  AlertCircle,
  Ban,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
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
const formatNumber = (value) => {
  return new Intl.NumberFormat("en-KE").format(toNumber(value));
};

/**
 * Format Kenyan currency.
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    currencyDisplay: "symbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(toNumber(value));
};

/**
 * Get the actual statistics source.
 *
 * Supports:
 * - statistics
 * - statistics.data
 * - statistics.statistics
 */
const getStatisticsSource = (statistics) => {
  if (
    statistics?.data &&
    typeof statistics.data === "object" &&
    !Array.isArray(statistics.data)
  ) {
    return statistics.data;
  }

  if (
    statistics?.statistics &&
    typeof statistics.statistics === "object" &&
    !Array.isArray(statistics.statistics)
  ) {
    return statistics.statistics;
  }

  return statistics || {};
};

/**
 * Safely extract a statistic value.
 *
 * Supports:
 *
 * total: 20
 *
 * or:
 *
 * total: {
 *   count: 20
 * }
 *
 * or:
 *
 * total: {
 *   total: 20
 * }
 */
const getStatisticValue = (
  statistics,
  keys = [],
  fallback = 0
) => {
  const source = getStatisticsSource(statistics);

  for (const key of keys) {
    const value = source?.[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const nested =
          value?.count ??
          value?.total ??
          value?.value ??
          value?.amount ??
          value?.total_amount ??
          value?.amount_paid ??
          value?.balance;

        if (
          nested !== undefined &&
          nested !== null &&
          nested !== ""
        ) {
          return nested;
        }
      }

      return value;
    }
  }

  return fallback;
};

/**
 * Get percentage.
 */
const getPercentage = (value, total) => {
  const numericValue = toNumber(value);
  const numericTotal = toNumber(total);

  if (!numericTotal) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (numericValue / numericTotal) * 100
    )
  );
};

/**
 * Format percentage.
 */
const formatPercentage = (value) => {
  return `${toNumber(value).toFixed(1)}%`;
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
  trend,
}) => {
  const safeProgress = Math.min(
    100,
    Math.max(0, toNumber(progress))
  );

  return (
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg">
      {/* Accent line */}

      <div
        className={`absolute inset-x-0 top-0 h-0.5 ${progressClass}`}
      />

      <div className="flex min-w-0 items-start justify-between gap-4">
        {/* Content */}

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

        {/* Icon */}

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

      {/* Progress */}

      <div className="mt-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${progressClass}`}
            style={{
              width: `${safeProgress}%`,
            }}
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
          style={{
            width: `${percentage}%`,
          }}
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
  valueClass = "text-gray-900",
}) => {
  return (
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
        className={`mt-4 min-w-0 break-words text-xl font-bold leading-tight tracking-tight sm:text-2xl ${valueClass}`}
        title={value}
      >
        {value}
      </p>

      <p className="mt-2 truncate text-[11px] opacity-70">
        {description}
      </p>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

const BookingStatistics = ({
  statistics = {},
  loading = false,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Booking Statistics
  |--------------------------------------------------------------------------
  */

  const total = getStatisticValue(
    statistics,
    [
      "total",
      "total_bookings",
      "bookings_count",
      "count",
    ]
  );

  const pending = getStatisticValue(
    statistics,
    [
      "pending",
      "pending_bookings",
      "pending_count",
    ]
  );

  const confirmed = getStatisticValue(
    statistics,
    [
      "confirmed",
      "confirmed_bookings",
      "confirmed_count",
    ]
  );

  const approved = getStatisticValue(
    statistics,
    [
      "approved",
      "approved_bookings",
      "approved_count",
    ]
  );

  const completed = getStatisticValue(
    statistics,
    [
      "completed",
      "completed_bookings",
      "completed_count",
    ]
  );

  const cancelled = getStatisticValue(
    statistics,
    [
      "cancelled",
      "cancelled_bookings",
      "cancelled_count",
    ]
  );

  const expired = getStatisticValue(
    statistics,
    [
      "expired",
      "expired_bookings",
      "expired_count",
    ]
  );

  const rejected = getStatisticValue(
    statistics,
    [
      "rejected",
      "rejected_bookings",
      "rejected_count",
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Payment Statistics
  |--------------------------------------------------------------------------
  */

  const paid = getStatisticValue(
    statistics,
    [
      "paid",
      "paid_bookings",
      "paid_count",
      "payment_paid",
      "payment_status_paid",
    ]
  );

  const partial = getStatisticValue(
    statistics,
    [
      "partial",
      "partially_paid",
      "partial_bookings",
      "partial_count",
      "payment_partial",
      "payment_status_partial",
    ]
  );

  const unpaid = getStatisticValue(
    statistics,
    [
      "unpaid",
      "unpaid_bookings",
      "unpaid_count",
      "payment_pending",
      "pending_payment",
      "payment_status_pending",
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Financial Statistics
  |--------------------------------------------------------------------------
  */

  const totalRevenue = getStatisticValue(
    statistics,
    [
      "total_revenue",
      "revenue",
      "total_booking_value",
      "booking_value",
      "total_amount",
    ]
  );

  const totalPaid = getStatisticValue(
    statistics,
    [
      "total_paid",
      "amount_paid",
      "paid_amount",
      "total_collected",
      "collected",
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT:
  | Use undefined fallback so we can determine whether the backend
  | actually supplied a balance.
  |--------------------------------------------------------------------------
  */

  const totalBalance = getStatisticValue(
    statistics,
    [
      "total_balance",
      "balance",
      "outstanding_balance",
      "amount_due",
      "outstanding",
    ],
    undefined
  );

  /*
  |--------------------------------------------------------------------------
  | Derived Financial Values
  |--------------------------------------------------------------------------
  */

  const calculatedBalance =
    totalBalance !== undefined &&
      totalBalance !== null &&
      totalBalance !== ""
      ? toNumber(totalBalance)
      : Math.max(
        toNumber(totalRevenue) -
        toNumber(totalPaid),
        0
      );

  const averageBookingValue =
    toNumber(total) > 0
      ? toNumber(totalRevenue) /
      toNumber(total)
      : 0;

  /*
  |--------------------------------------------------------------------------
  | Percentages
  |--------------------------------------------------------------------------
  */

  const completedRate = getPercentage(
    completed,
    total
  );

  const pendingRate = getPercentage(
    pending,
    total
  );

  const confirmedRate = getPercentage(
    confirmed,
    total
  );

  const paidRate = getPercentage(
    paid,
    total
  );

  const collectionRate = getPercentage(
    totalPaid,
    totalRevenue
  );

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <section
        aria-label="Booking statistics loading"
        className="min-w-0 space-y-5"
      >
        {/* Primary */}

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
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
            )
          )}
        </div>

        {/* Breakdown */}

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          {Array.from({ length: 2 }).map(
            (_, sectionIndex) => (
              <div
                key={sectionIndex}
                className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="h-4 w-32 rounded bg-gray-200" />

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className="rounded-xl bg-gray-100 p-4"
                      >
                        <div className="h-9 w-9 rounded-lg bg-gray-200" />

                        <div className="mt-3 h-3 w-20 rounded bg-gray-200" />

                        <div className="mt-2 h-1 rounded bg-gray-200" />
                      </div>
                    )
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Financial */}

        <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="h-4 w-40 rounded bg-gray-200" />

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-gray-100 p-4"
                >
                  <div className="h-8 w-8 rounded-lg bg-gray-200" />

                  <div className="mt-4 h-7 w-32 rounded bg-gray-200" />

                  <div className="mt-2 h-3 w-28 rounded bg-gray-200" />
                </div>
              )
            )}
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="h-3 w-36 rounded bg-gray-200" />

            <div className="mt-3 h-2 rounded-full bg-gray-200" />
          </div>
        </div>
      </section>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Primary Statistics
  |--------------------------------------------------------------------------
  */

  const primaryStatistics = [
    {
      label: "Total Bookings",
      value: formatNumber(total),
      icon: CalendarCheck2,
      iconWrapperClass: "bg-indigo-50",
      iconClass: "text-indigo-600",
      progress: 100,
      progressClass: "bg-indigo-500",
      description: "All booking records",
    },
    {
      label: "Pending",
      value: formatNumber(pending),
      icon: Clock3,
      iconWrapperClass: "bg-amber-50",
      iconClass: "text-amber-600",
      progress: pendingRate,
      progressClass: "bg-amber-500",
      description: "Awaiting confirmation",
    },
    {
      label: "Confirmed",
      value: formatNumber(confirmed),
      icon: CalendarCheck2,
      iconWrapperClass: "bg-blue-50",
      iconClass: "text-blue-600",
      progress: confirmedRate,
      progressClass: "bg-blue-500",
      description: "Confirmed bookings",
    },
    {
      label: "Completed",
      value: formatNumber(completed),
      icon: CheckCircle2,
      iconWrapperClass: "bg-emerald-50",
      iconClass: "text-emerald-600",
      progress: completedRate,
      progressClass: "bg-emerald-500",
      description: "Successfully completed",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Status Breakdown
  |--------------------------------------------------------------------------
  */

  const statusStatistics = [
    {
      label: "Approved",
      value: approved,
      icon: FileCheck2,
      iconClass: "text-purple-600",
      backgroundClass: "bg-purple-50",
      progressClass: "bg-purple-500",
    },
    {
      label: "Cancelled",
      value: cancelled,
      icon: Ban,
      iconClass: "text-red-600",
      backgroundClass: "bg-red-50",
      progressClass: "bg-red-500",
    },
    {
      label: "Rejected",
      value: rejected,
      icon: XCircle,
      iconClass: "text-rose-600",
      backgroundClass: "bg-rose-50",
      progressClass: "bg-rose-500",
    },
    {
      label: "Expired",
      value: expired,
      icon: CalendarClock,
      iconClass: "text-gray-600",
      backgroundClass: "bg-gray-100",
      progressClass: "bg-gray-500",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Payment Breakdown
  |--------------------------------------------------------------------------
  */

  const paymentStatistics = [
    {
      label: "Paid",
      value: paid,
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      backgroundClass: "bg-emerald-50",
      progressClass: "bg-emerald-500",
    },
    {
      label: "Partially Paid",
      value: partial,
      icon: Wallet,
      iconClass: "text-amber-600",
      backgroundClass: "bg-amber-50",
      progressClass: "bg-amber-500",
    },
    {
      label: "Unpaid",
      value: unpaid,
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
      aria-label="Booking statistics"
      className="min-w-0 space-y-5"
    >
      {/* ================================================================
          PRIMARY STATISTICS
      ================================================================ */}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primaryStatistics.map((item) => (
          <StatisticCard
            key={item.label}
            {...item}
          />
        ))}
      </div>

      {/* ================================================================
          STATUS + PAYMENT
      ================================================================ */}

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Booking Status */}

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-900">
                Booking Status
              </h3>

              <p className="mt-1 truncate text-xs text-gray-500">
                Current booking workflow breakdown
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
              <TrendingUp
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

        {/* Payment Status */}

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-900">
                Payment Status
              </h3>

              <p className="mt-1 truncate text-xs text-gray-500">
                Booking payment completion breakdown
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
              <Wallet
                className="h-4 w-4 text-emerald-600"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {paymentStatistics.map((item) => {
              const Icon = item.icon;
              const percentage = getPercentage(
                item.value,
                total
              );

              return (
                <div
                  key={item.label}
                  className="min-w-0"
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

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[10px] font-medium text-gray-400">
                        {formatPercentage(
                          percentage
                        )}
                      </span>

                      <span className="text-sm font-bold text-gray-900">
                        {formatNumber(item.value)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 ml-12 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.progressClass}`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paid Rate */}

          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className="h-4 w-4 text-emerald-500"
                  aria-hidden="true"
                />

                <span className="text-xs font-semibold text-gray-600">
                  Fully Paid Rate
                </span>
              </div>

              <span className="text-sm font-bold text-emerald-600">
                {formatPercentage(paidRate)}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{
                  width: `${paidRate}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          FINANCIAL OVERVIEW
      ================================================================ */}

      <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        {/* Header */}

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
                Financial Overview
              </h3>
            </div>

            <p className="mt-2 truncate text-xs text-gray-500">
              Booking revenue, collections and outstanding balances
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full bg-gray-50 px-3 py-1.5 sm:self-auto">
            <TrendingUp
              className="h-3.5 w-3.5 text-emerald-600"
              aria-hidden="true"
            />

            <span className="text-xs font-semibold text-gray-600">
              {formatPercentage(collectionRate)} collected
            </span>
          </div>
        </div>

        {/* Financial Cards */}

        <div className="p-5 sm:p-6">
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <FinancialCard
              label="Total Booking Value"
              value={formatCurrency(totalRevenue)}
              description="Gross value of bookings"
              icon={CircleDollarSign}
              wrapperClass="border-indigo-100 bg-indigo-50/60 text-indigo-700"
              iconClass="bg-indigo-100 text-indigo-600"
              valueClass="text-gray-900"
            />

            <FinancialCard
              label="Amount Collected"
              value={formatCurrency(totalPaid)}
              description="Payments received"
              icon={Wallet}
              wrapperClass="border-emerald-100 bg-emerald-50/60 text-emerald-700"
              iconClass="bg-emerald-100 text-emerald-600"
              valueClass="text-gray-900"
            />

            <FinancialCard
              label="Outstanding Balance"
              value={formatCurrency(
                calculatedBalance
              )}
              description="Amount still due"
              icon={AlertCircle}
              wrapperClass="border-amber-100 bg-amber-50/60 text-amber-700"
              iconClass="bg-amber-100 text-amber-600"
              valueClass="text-gray-900"
            />

            <FinancialCard
              label="Average Booking Value"
              value={formatCurrency(
                averageBookingValue
              )}
              description="Average value per booking"
              icon={CalendarCheck2}
              wrapperClass="border-purple-100 bg-purple-50/60 text-purple-700"
              iconClass="bg-purple-100 text-purple-600"
              valueClass="text-gray-900"
            />
          </div>

          {/* Collection Progress */}

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
                    Collection Progress
                  </p>

                  <p className="hidden truncate text-[10px] text-gray-400 sm:block">
                    Amount collected against total booking value
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
                style={{
                  width: `${collectionRate}%`,
                }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="truncate text-[10px] text-gray-400">
                Collected: {formatCurrency(totalPaid)}
              </span>

              <span className="truncate text-[10px] text-gray-400">
                Due: {formatCurrency(calculatedBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingStatistics;