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
  return new Intl.NumberFormat("en-KE").format(
    toNumber(value)
  );
};

/**
 * Format Kenyan currency.
 *
 * Example:
 * Ksh 1,184,500
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
 * Safely extract a statistic value.
 *
 * Supports:
 *
 * {
 *   total: 20
 * }
 *
 * or:
 *
 * {
 *   total: {
 *     count: 20
 *   }
 * }
 */
const getStatisticValue = (
  statistics,
  keys = [],
  fallback = 0
) => {
  for (const key of keys) {
    const value = statistics?.[key];

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
          value?.amount;

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
| Main Component
|--------------------------------------------------------------------------
*/

const BookingStatistics = ({
  statistics = {},
  loading = false,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Normalize Booking Statistics
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
  |
  | These map directly to the actual bookings table:
  |
  | total_amount
  | amount_paid
  | balance
  |
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

  const totalBalance = getStatisticValue(
    statistics,
    [
      "total_balance",
      "balance",
      "outstanding_balance",
      "amount_due",
      "outstanding",
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Derived Financial Values
  |--------------------------------------------------------------------------
  */

  /**
   * Important:
   *
   * We use the backend/database balance when available.
   *
   * We only calculate the balance as a fallback.
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

  /**
   * Average booking value.
   *
   * Total Booking Value / Total Bookings
   */
  const averageBookingValue =
    toNumber(total) > 0
      ? toNumber(totalRevenue) /
      toNumber(total)
      : 0;

  /*
  |--------------------------------------------------------------------------
  | Derived Percentages
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
        {/* ================================================================
            PRIMARY CARDS
        ================================================================ */}

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="min-w-0 animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="h-3 w-24 rounded bg-gray-200" />

                    <div className="h-7 w-20 rounded bg-gray-200" />
                  </div>

                  <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-200" />
                </div>

                <div className="mt-5 h-2 rounded-full bg-gray-200" />
              </div>
            )
          )}
        </div>

        {/* ================================================================
            SECONDARY CARDS
        ================================================================ */}

        <div className="grid min-w-0 grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="min-w-0 animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="h-3 w-20 rounded bg-gray-200" />

                <div className="mt-3 h-6 w-14 rounded bg-gray-200" />
              </div>
            )
          )}
        </div>

        {/* ================================================================
            FINANCIAL LOADING
        ================================================================ */}

        <div className="min-w-0 animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="h-5 w-40 rounded bg-gray-200" />

          <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="min-w-0 overflow-hidden rounded-xl bg-gray-100 p-4"
                >
                  <div className="h-3 w-24 rounded bg-gray-200" />

                  <div className="mt-3 h-7 w-32 rounded bg-gray-200" />

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
      iconClass:
        "bg-indigo-50 text-indigo-600",
      progress: 100,
      progressClass: "bg-indigo-500",
      description: "All booking records",
    },
    {
      label: "Pending",
      value: formatNumber(pending),
      icon: Clock3,
      iconClass:
        "bg-amber-50 text-amber-600",
      progress: pendingRate,
      progressClass: "bg-amber-500",
      description: `${formatPercentage(
        pendingRate
      )} of total bookings`,
    },
    {
      label: "Confirmed",
      value: formatNumber(confirmed),
      icon: CalendarCheck2,
      iconClass:
        "bg-blue-50 text-blue-600",
      progress: confirmedRate,
      progressClass: "bg-blue-500",
      description: `${formatPercentage(
        confirmedRate
      )} of total bookings`,
    },
    {
      label: "Completed",
      value: formatNumber(completed),
      icon: CheckCircle2,
      iconClass:
        "bg-emerald-50 text-emerald-600",
      progress: completedRate,
      progressClass: "bg-emerald-500",
      description: `${formatPercentage(
        completedRate
      )} completion rate`,
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
        {primaryStatistics.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="group min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-500">
                    {item.label}
                  </p>

                  <p className="mt-2 truncate text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {item.value}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
                >
                  <Icon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div className="mt-5 min-w-0">
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.progressClass}`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          toNumber(
                            item.progress
                          )
                        )
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-2 truncate text-xs text-gray-500">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================================================================
          STATUS + PAYMENT BREAKDOWN
      ================================================================ */}

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        {/* ================================================================
            BOOKING STATUS
        ================================================================ */}

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-gray-900">
                Booking Status
              </h3>

              <p className="mt-1 truncate text-xs text-gray-500">
                Current booking workflow breakdown
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <TrendingUp
                className="h-4 w-4 text-gray-600"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {statusStatistics.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.backgroundClass}`}
                    >
                      <Icon
                        className={`h-4 w-4 ${item.iconClass}`}
                        aria-hidden="true"
                      />
                    </div>

                    <span className="min-w-0 truncate text-xl font-bold text-gray-900">
                      {formatNumber(
                        item.value
                      )}
                    </span>
                  </div>

                  <p className="mt-3 truncate text-xs font-medium text-gray-500">
                    {item.label}
                  </p>

                  <div className="mt-2">
                    <div className="h-1 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${item.progressClass}`}
                        style={{
                          width: `${getPercentage(
                            item.value,
                            total
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================
            PAYMENT STATUS
        ================================================================ */}

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-gray-900">
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

                      <span className="truncate text-sm font-medium text-gray-700">
                        {item.label}
                      </span>
                    </div>

                    <span className="shrink-0 text-sm font-bold text-gray-900">
                      {formatNumber(
                        item.value
                      )}
                    </span>
                  </div>

                  <div className="mt-2 ml-12 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${item.progressClass}`}
                      style={{
                        width: `${getPercentage(
                          item.value,
                          total
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ================================================================
              PAID RATE
          ================================================================ */}

          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-gray-500">
                Fully Paid Rate
              </span>

              <span className="shrink-0 text-sm font-bold text-emerald-600">
                {formatPercentage(
                  paidRate
                )}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
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

      <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        {/* Header */}

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-900">
              Financial Overview
            </h3>

            <p className="mt-1 truncate text-xs text-gray-500">
              Booking revenue and outstanding balances
            </p>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
            <CircleDollarSign
              className="h-5 w-5 text-indigo-600"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* ================================================================
            FINANCIAL CARDS
        ================================================================ */}

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* ============================================================
              TOTAL BOOKING VALUE
          ============================================================ */}

          <div className="min-w-0 overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-indigo-700">
              <CircleDollarSign
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />

              <span className="truncate">
                Total Booking Value
              </span>
            </div>

            <div
              className="mt-3 min-w-0 max-w-full break-words whitespace-normal text-lg font-bold leading-tight tracking-tight text-gray-900 sm:text-xl lg:text-2xl"
              title={formatCurrency(
                totalRevenue
              )}
            >
              {formatCurrency(
                totalRevenue
              )}
            </div>

            <p className="mt-2 truncate text-xs text-indigo-700/70">
              Gross value of bookings
            </p>
          </div>

          {/* ============================================================
              AMOUNT COLLECTED
          ============================================================ */}

          <div className="min-w-0 overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-emerald-700">
              <Wallet
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />

              <span className="truncate">
                Amount Collected
              </span>
            </div>

            <div
              className="mt-3 min-w-0 max-w-full break-words whitespace-normal text-lg font-bold leading-tight tracking-tight text-gray-900 sm:text-xl lg:text-2xl"
              title={formatCurrency(
                totalPaid
              )}
            >
              {formatCurrency(
                totalPaid
              )}
            </div>

            <p className="mt-2 truncate text-xs text-emerald-700/70">
              Payments received
            </p>
          </div>

          {/* ============================================================
              OUTSTANDING BALANCE
          ============================================================ */}

          <div className="min-w-0 overflow-hidden rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-amber-700">
              <AlertCircle
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />

              <span className="truncate">
                Outstanding Balance
              </span>
            </div>

            <div
              className="mt-3 min-w-0 max-w-full break-words whitespace-normal text-lg font-bold leading-tight tracking-tight text-gray-900 sm:text-xl lg:text-2xl"
              title={formatCurrency(
                calculatedBalance
              )}
            >
              {formatCurrency(
                calculatedBalance
              )}
            </div>

            <p className="mt-2 truncate text-xs text-amber-700/70">
              Amount still due
            </p>
          </div>

          {/* ============================================================
              AVERAGE BOOKING VALUE
          ============================================================ */}

          <div className="min-w-0 overflow-hidden rounded-xl border border-purple-100 bg-purple-50/60 p-4">
            <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-purple-700">
              <CalendarCheck2
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />

              <span className="truncate">
                Average Booking Value
              </span>
            </div>

            <div
              className="mt-3 min-w-0 max-w-full break-words whitespace-normal text-lg font-bold leading-tight tracking-tight text-gray-900 sm:text-xl lg:text-2xl"
              title={formatCurrency(
                averageBookingValue
              )}
            >
              {formatCurrency(
                averageBookingValue
              )}
            </div>

            <p className="mt-2 truncate text-xs text-purple-700/70">
              Average value per booking
            </p>
          </div>
        </div>

        {/* ================================================================
            COLLECTION PROGRESS
        ================================================================ */}

        <div className="mt-6 min-w-0 border-t border-gray-100 pt-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <TrendingUp
                className="h-4 w-4 shrink-0 text-gray-500"
                aria-hidden="true"
              />

              <span className="truncate text-xs font-medium text-gray-600">
                Collection Progress
              </span>
            </div>

            <span className="shrink-0 text-xs font-bold text-gray-900">
              {formatPercentage(
                collectionRate
              )}
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{
                width: `${collectionRate}%`,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingStatistics;