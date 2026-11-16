
import {
  Globe2,
  CheckCircle2,
  XCircle,
  Trash2,
  Coins,
  Banknote,
  Activity,
  MapPin,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Check whether a value is a plain object.
 */
const isObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

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
 * Get the actual statistics source.
 *
 * Supports:
 * - Direct statistics object
 * - Laravel API response
 * - Axios response
 * - Nested data objects
 * - Nested statistics objects
 */
const getStatisticsSource = (statistics) => {
  let source = statistics;

  for (let index = 0; index < 6; index += 1) {
    if (!isObject(source)) {
      return {};
    }

    if (isObject(source.data)) {
      source = source.data;
      continue;
    }

    if (isObject(source.statistics)) {
      source = source.statistics;
      continue;
    }

    break;
  }

  return isObject(source) ? source : {};
};

/**
 * Safely extract a statistic value.
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
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    if (isObject(value)) {
      const nested =
        value.count ??
        value.total ??
        value.value;

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
 * Get percentage.
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
}) => {
  const safeProgress = Math.min(
    100,
    Math.max(0, toNumber(progress))
  );

  return (
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg">
      {/* Accent Line */}

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
| Reusable Breakdown Card
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
| Loading Skeleton
|--------------------------------------------------------------------------
*/

const CountryStatisticsSkeleton = () => (
  <section
    aria-label="Country statistics loading"
    className="min-w-0 space-y-5"
  >
    {/* Primary Statistics */}

    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-3 w-28 rounded bg-gray-200" />
              <div className="h-8 w-24 rounded bg-gray-200" />
            </div>

            <div className="h-11 w-11 rounded-xl bg-gray-200" />
          </div>

          <div className="mt-5 h-1.5 rounded-full bg-gray-200" />

          <div className="mt-2 h-3 w-32 rounded bg-gray-200" />
        </div>
      ))}
    </div>

    {/* Breakdown */}

    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="h-4 w-40 rounded bg-gray-200" />

          <div className="mt-6 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((__, itemIndex) => (
              <div
                key={itemIndex}
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
  </section>
);

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

const CountryStatistics = ({
  statistics = {},
  loading = false,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Extract Statistics
  |--------------------------------------------------------------------------
  */

  const total = toNumber(
    getStatisticValue(statistics, [
      "total",
      "total_countries",
      "countries_count",
    ])
  );

  const active = toNumber(
    getStatisticValue(statistics, [
      "active",
      "active_countries",
      "active_count",
    ])
  );

  const inactive = toNumber(
    getStatisticValue(statistics, [
      "inactive",
      "inactive_countries",
      "inactive_count",
    ])
  );

  const trashed = toNumber(
    getStatisticValue(statistics, [
      "trashed",
      "trashed_countries",
      "trashed_count",
      "deleted_count",
      "deleted_countries",
    ])
  );

  /*
  |--------------------------------------------------------------------------
  | Currency Statistics
  |--------------------------------------------------------------------------
  */

  const source = getStatisticsSource(statistics);

  const currencies =
    isObject(source.currencies)
      ? source.currencies
      : {};

  const currencyEntries = Object.entries(currencies)
    .map(([currency, count]) => [
      currency,
      toNumber(count),
    ])
    .sort((a, b) => b[1] - a[1]);

  const currencyCount = currencyEntries.length;

  const countriesWithCurrency = currencyEntries.reduce(
    (sum, [, count]) => sum + count,
    0
  );

  /*
  |--------------------------------------------------------------------------
  | Percentages
  |--------------------------------------------------------------------------
  */

  const activeRate = getPercentage(active, total);
  const inactiveRate = getPercentage(inactive, total);
  const trashedRate = getPercentage(trashed, total);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return <CountryStatisticsSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Primary Statistics
  |--------------------------------------------------------------------------
  */

  const primaryStatistics = [
    {
      label: "Total Countries",
      value: formatNumber(total),
      icon: Globe2,
      iconWrapperClass: "bg-indigo-50",
      iconClass: "text-indigo-600",
      progress: total > 0 ? 100 : 0,
      progressClass: "bg-indigo-500",
      description: "All registered countries",
    },
    {
      label: "Active Countries",
      value: formatNumber(active),
      icon: CheckCircle2,
      iconWrapperClass: "bg-emerald-50",
      iconClass: "text-emerald-600",
      progress: activeRate,
      progressClass: "bg-emerald-500",
      description: "Currently active countries",
    },
    {
      label: "Inactive Countries",
      value: formatNumber(inactive),
      icon: XCircle,
      iconWrapperClass: "bg-amber-50",
      iconClass: "text-amber-600",
      progress: inactiveRate,
      progressClass: "bg-amber-500",
      description: "Currently inactive countries",
    },
    {
      label: "Trashed Countries",
      value: formatNumber(trashed),
      icon: Trash2,
      iconWrapperClass: "bg-rose-50",
      iconClass: "text-rose-600",
      progress: trashedRate,
      progressClass: "bg-rose-500",
      description: "Deleted country records",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Country Status Breakdown
  |--------------------------------------------------------------------------
  */

  const statusStatistics = [
    {
      label: "Active",
      value: active,
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
      backgroundClass: "bg-emerald-50",
      progressClass: "bg-emerald-500",
    },
    {
      label: "Inactive",
      value: inactive,
      icon: XCircle,
      iconClass: "text-amber-600",
      backgroundClass: "bg-amber-50",
      progressClass: "bg-amber-500",
    },
    {
      label: "Trashed",
      value: trashed,
      icon: Trash2,
      iconClass: "text-rose-600",
      backgroundClass: "bg-rose-50",
      progressClass: "bg-rose-500",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section
      aria-label="Country statistics"
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

      {/* Status + Currency Breakdown */}

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Country Status */}

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-900">
                Country Status
              </h3>

              <p className="mt-1 truncate text-xs text-gray-500">
                Current country registration status breakdown
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
              <Activity
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

          {/* Active Rate */}

          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className="h-4 w-4 text-emerald-500"
                  aria-hidden="true"
                />

                <span className="text-xs font-semibold text-gray-600">
                  Active Country Rate
                </span>
              </div>

              <span className="text-sm font-bold text-emerald-600">
                {formatPercentage(activeRate)}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{
                  width: `${activeRate}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Currency Distribution */}

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-900">
                Currency Distribution
              </h3>

              <p className="mt-1 truncate text-xs text-gray-500">
                Currency usage across registered countries
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
              <Coins
                className="h-4 w-4 text-violet-600"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {currencyCount > 0 ? (
              currencyEntries.map(([currency, count]) => (
                <BreakdownCard
                  key={currency}
                  label={currency}
                  value={count}
                  icon={Banknote}
                  iconClass="text-violet-600"
                  backgroundClass="bg-violet-50"
                  progressClass="bg-violet-500"
                  total={total}
                />
              ))
            ) : (
              <div className="col-span-2 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10">
                <Coins className="h-8 w-8 text-gray-300" />

                <p className="mt-2 text-sm font-medium text-gray-500">
                  No currency information available
                </p>
              </div>
            )}
          </div>

          {/* Currency Summary */}

          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin
                  className="h-4 w-4 text-violet-500"
                  aria-hidden="true"
                />

                <span className="text-xs font-semibold text-gray-600">
                  Registered Currencies
                </span>
              </div>

              <span className="text-sm font-bold text-violet-600">
                {formatNumber(currencyCount)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-gray-400">
                Countries with currency data
              </span>

              <span className="text-xs font-semibold text-gray-700">
                {formatNumber(countriesWithCurrency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CountryStatistics;
