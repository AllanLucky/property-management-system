import { useCallback, useEffect } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";

import { useLease } from "../../../hooks/useLease";

/*
|--------------------------------------------------------------------------
| Formatting Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely convert a value to a number.
 */
const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

/**
 * Safely retrieve a statistic using multiple possible API keys.
 *
 * This keeps the presentation layer resilient if the backend changes
 * between concise keys and descriptive keys.
 */
const getStatisticValue = (statistics, keys, fallback = 0) => {
  if (!statistics || typeof statistics !== "object") {
    return fallback;
  }

  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(statistics, key) &&
      statistics[key] !== null &&
      statistics[key] !== undefined
    ) {
      return toNumber(statistics[key], fallback);
    }
  }

  return fallback;
};

/**
 * Format numbers using the Kenyan locale.
 */
const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE").format(toNumber(value));

/*
|--------------------------------------------------------------------------
| Statistic Card
|--------------------------------------------------------------------------
*/

function StatisticCard({
  title,
  value,
  description,
  icon: Icon,
  loading = false,
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-5
        shadow-sm
        transition
        duration-200
        hover:shadow-md
        dark:border-gray-800
        dark:bg-gray-900
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>

          {loading ? (
            <div className="mt-3 h-8 w-20 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
          ) : (
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {formatNumber(value)}
            </p>
          )}

          {description && (
            <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        <div
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-gray-100
            dark:bg-gray-800
          "
        >
          <Icon
            className="h-5 w-5 text-gray-600 dark:text-gray-300"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Error Banner
|--------------------------------------------------------------------------
*/

function ErrorBanner({ error, onRetry, loading }) {
  if (!error) {
    return null;
  }

  const message =
    typeof error === "string"
      ? error
      : error?.message ||
      "Unable to load lease statistics. Please try again.";

  return (
    <div
      className="
        mb-6
        rounded-2xl
        border
        border-red-200
        bg-red-50
        p-4
        dark:border-red-900/50
        dark:bg-red-950/30
      "
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-300">
            Unable to load lease statistics
          </h3>

          <p className="mt-1 text-sm leading-6 text-red-700 dark:text-red-400">
            {message}
          </p>

          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            className="
              mt-3
              inline-flex
              items-center
              rounded-lg
              border
              border-red-300
              bg-white
              px-3
              py-2
              text-sm
              font-medium
              text-red-700
              transition
              hover:bg-red-100
              focus:outline-none
              focus:ring-2
              focus:ring-red-200
              disabled:cursor-not-allowed
              disabled:opacity-60
              dark:border-red-800
              dark:bg-red-950/40
              dark:text-red-300
              dark:hover:bg-red-950/70
              dark:focus:ring-red-900
            "
          >
            {loading ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Retrying...
              </>
            ) : (
              "Try Again"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

function EmptyStatistics() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-8
        shadow-sm
        dark:border-gray-800
        dark:bg-gray-900
      "
    >
      <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-gray-100
            dark:bg-gray-800
          "
        >
          <FileText
            className="h-7 w-7 text-gray-400 dark:text-gray-500"
            aria-hidden="true"
          />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
          No lease statistics available
        </h3>

        <p className="mt-1 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
          Statistics will appear here once lease data is available.
        </p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Lease Statistics
|--------------------------------------------------------------------------
*/

export default function LeaseStatistics({
  autoLoad = true,
  showHeader = true,
  className = "",
}) {
  /*
  |--------------------------------------------------------------------------
  | Lease Hook
  |--------------------------------------------------------------------------
  */

  const {
    statistics,
    loadingStatistics,
    error,
    fetchStatistics,
    clearError,
  } = useLease();

  /*
  |--------------------------------------------------------------------------
  | Load Statistics
  |--------------------------------------------------------------------------
  */

  const loadStatistics = useCallback(async () => {
    try {
      clearError();

      await fetchStatistics();
    } catch (fetchError) {
      console.error(
        "Failed to load lease statistics:",
        fetchError
      );
    }
  }, [clearError, fetchStatistics]);

  /*
  |--------------------------------------------------------------------------
  | Initial Statistics Request
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    loadStatistics();
  }, [autoLoad, loadStatistics]);

  /*
  |--------------------------------------------------------------------------
  | Normalize Statistics
  |--------------------------------------------------------------------------
  */

  const statisticsData =
    statistics && typeof statistics === "object"
      ? statistics
      : null;

  const total = getStatisticValue(
    statisticsData,
    ["total", "total_leases", "leases_count"]
  );

  const draft = getStatisticValue(
    statisticsData,
    ["draft", "draft_leases", "draft_count"]
  );

  const active = getStatisticValue(
    statisticsData,
    ["active", "active_leases", "active_count"]
  );

  const expired = getStatisticValue(
    statisticsData,
    ["expired", "expired_leases", "expired_count"]
  );

  const terminated = getStatisticValue(
    statisticsData,
    ["terminated", "terminated_leases", "terminated_count"]
  );

  const cancelled = getStatisticValue(
    statisticsData,
    ["cancelled", "cancelled_leases", "cancelled_count"]
  );

  const hasStatistics =
    statisticsData !== null &&
    Object.keys(statisticsData).length > 0;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section className={className}>
      {/* ------------------------------------------------------------------ */}
      {/* Section Header                                                      */}
      {/* ------------------------------------------------------------------ */}

      {showHeader && (
        <div className="mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Lease Statistics
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Overview of lease agreements and their current statuses.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Error                                                               */}
      {/* ------------------------------------------------------------------ */}

      <ErrorBanner
        error={error}
        onRetry={loadStatistics}
        loading={loadingStatistics}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Initial Loading                                                     */}
      {/* ------------------------------------------------------------------ */}

      {loadingStatistics && !hasStatistics ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatisticCard
            title="Total Leases"
            value={0}
            description="All lease agreements"
            icon={FileText}
            loading
          />

          <StatisticCard
            title="Draft"
            value={0}
            description="Leases awaiting activation"
            icon={Clock3}
            loading
          />

          <StatisticCard
            title="Active"
            value={0}
            description="Currently active leases"
            icon={CheckCircle2}
            loading
          />

          <StatisticCard
            title="Expired"
            value={0}
            description="Leases past their end date"
            icon={CalendarDays}
            loading
          />

          <StatisticCard
            title="Terminated"
            value={0}
            description="Leases ended before expiry"
            icon={XCircle}
            loading
          />

          <StatisticCard
            title="Cancelled"
            value={0}
            description="Cancelled lease agreements"
            icon={XCircle}
            loading
          />
        </div>
      ) : !hasStatistics ? (
        <EmptyStatistics />
      ) : (
        <>
          {/* -------------------------------------------------------------- */}
          {/* Summary Cards                                                    */}
          {/* -------------------------------------------------------------- */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatisticCard
              title="Total Leases"
              value={total}
              description="All lease agreements"
              icon={FileText}
            />

            <StatisticCard
              title="Draft"
              value={draft}
              description="Leases awaiting activation"
              icon={Clock3}
            />

            <StatisticCard
              title="Active"
              value={active}
              description="Currently active leases"
              icon={CheckCircle2}
            />

            <StatisticCard
              title="Expired"
              value={expired}
              description="Leases past their end date"
              icon={CalendarDays}
            />

            <StatisticCard
              title="Terminated"
              value={terminated}
              description="Leases ended before expiry"
              icon={XCircle}
            />

            <StatisticCard
              title="Cancelled"
              value={cancelled}
              description="Cancelled lease agreements"
              icon={XCircle}
            />
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Status Distribution                                              */}
          {/* -------------------------------------------------------------- */}

          <div
            className="
              mt-6
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-5
              shadow-sm
              dark:border-gray-800
              dark:bg-gray-900
            "
          >
            <div className="mb-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Status Distribution
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Current distribution of lease agreements by status.
              </p>
            </div>

            <div className="space-y-5">
              <StatusBar
                label="Draft"
                value={draft}
                total={total}
              />

              <StatusBar
                label="Active"
                value={active}
                total={total}
              />

              <StatusBar
                label="Expired"
                value={expired}
                total={total}
              />

              <StatusBar
                label="Terminated"
                value={terminated}
                total={total}
              />

              <StatusBar
                label="Cancelled"
                value={cancelled}
                total={total}
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| Status Bar
|--------------------------------------------------------------------------
*/

function StatusBar({ label, value, total }) {
  const numericValue = toNumber(value);
  const numericTotal = toNumber(total);

  const percentage =
    numericTotal > 0
      ? Math.min((numericValue / numericTotal) * 100, 100)
      : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>

        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {formatNumber(numericValue)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-gray-700 transition-all duration-500 dark:bg-gray-300"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <div className="mt-1 text-right text-xs text-gray-400 dark:text-gray-500">
        {percentage.toFixed(1)}%
      </div>
    </div>
  );
}