
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Activity,
  Building2,
  Layers3,
  Unlink,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const isObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE").format(toNumber(value));

const getStatisticsSource = (statistics) => {
  let source = statistics;

  for (let index = 0; index < 6; index += 1) {
    if (!isObject(source)) return {};

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

const getPercentage = (value, total) => {
  const numericValue = toNumber(value);
  const numericTotal = toNumber(total);

  if (numericTotal <= 0) return 0;

  return Math.min(
    100,
    Math.max(0, (numericValue / numericTotal) * 100)
  );
};

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

const RegionStatisticsSkeleton = () => (
  <section
    aria-label="Region statistics loading"
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

const RegionStatistics = ({
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
      "total_regions",
      "regions_count",
    ])
  );

  const active = toNumber(
    getStatisticValue(statistics, [
      "active",
      "active_regions",
      "active_count",
    ])
  );

  const inactive = toNumber(
    getStatisticValue(statistics, [
      "inactive",
      "inactive_regions",
      "inactive_count",
    ])
  );

  const withCounties = toNumber(
    getStatisticValue(statistics, [
      "with_counties",
      "regions_with_counties",
      "regions_with_counties_count",
    ])
  );

  const withoutCounties = toNumber(
    getStatisticValue(statistics, [
      "without_counties",
      "regions_without_counties",
      "regions_without_counties_count",
    ])
  );

  /*
  |--------------------------------------------------------------------------
  | Percentages
  |--------------------------------------------------------------------------
  */

  const activeRate = getPercentage(active, total);
  const inactiveRate = getPercentage(inactive, total);
  const withCountiesRate = getPercentage(withCounties, total);
  const withoutCountiesRate = getPercentage(withoutCounties, total);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return <RegionStatisticsSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Primary Statistics
  |--------------------------------------------------------------------------
  */

  const primaryStatistics = [
    {
      label: "Total Regions",
      value: formatNumber(total),
      icon: MapPin,
      iconWrapperClass: "bg-indigo-50",
      iconClass: "text-indigo-600",
      progress: total > 0 ? 100 : 0,
      progressClass: "bg-indigo-500",
      description: "All registered regions",
    },
    {
      label: "Active Regions",
      value: formatNumber(active),
      icon: CheckCircle2,
      iconWrapperClass: "bg-emerald-50",
      iconClass: "text-emerald-600",
      progress: activeRate,
      progressClass: "bg-emerald-500",
      description: "Currently active regions",
    },
    {
      label: "Inactive Regions",
      value: formatNumber(inactive),
      icon: XCircle,
      iconWrapperClass: "bg-amber-50",
      iconClass: "text-amber-600",
      progress: inactiveRate,
      progressClass: "bg-amber-500",
      description: "Currently inactive regions",
    },
    {
      label: "With Counties",
      value: formatNumber(withCounties),
      icon: Building2,
      iconWrapperClass: "bg-violet-50",
      iconClass: "text-violet-600",
      progress: withCountiesRate,
      progressClass: "bg-violet-500",
      description: "Regions with associated counties",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Region Status Breakdown
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
  ];

  /*
  |--------------------------------------------------------------------------
  | County Association Breakdown
  |--------------------------------------------------------------------------
  */

  const countyStatistics = [
    {
      label: "With Counties",
      value: withCounties,
      icon: Building2,
      iconClass: "text-violet-600",
      backgroundClass: "bg-violet-50",
      progressClass: "bg-violet-500",
    },
    {
      label: "Without Counties",
      value: withoutCounties,
      icon: Unlink,
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
      aria-label="Region statistics"
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

      {/* Status + County Association Breakdown */}

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">

        {/* Region Status */}

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-900">
                Region Status
              </h3>

              <p className="mt-1 truncate text-xs text-gray-500">
                Current region registration status breakdown
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
                  Active Region Rate
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

        {/* County Association */}

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-900">
                County Association
              </h3>

              <p className="mt-1 truncate text-xs text-gray-500">
                Regions with and without associated counties
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
              <Layers3
                className="h-4 w-4 text-violet-600"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {countyStatistics.map((item) => (
              <BreakdownCard
                key={item.label}
                {...item}
                total={total}
              />
            ))}
          </div>

          {/* County Association Summary */}

          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2
                  className="h-4 w-4 text-violet-500"
                  aria-hidden="true"
                />

                <span className="text-xs font-semibold text-gray-600">
                  Regions With Counties
                </span>
              </div>

              <span className="text-sm font-bold text-violet-600">
                {formatNumber(withCounties)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-gray-400">
                Regions without counties
              </span>

              <span className="text-xs font-semibold text-rose-600">
                {formatNumber(withoutCounties)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-gray-400">
                County association rate
              </span>

              <span className="text-xs font-semibold text-gray-700">
                {formatPercentage(withCountiesRate)}
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-700"
                style={{
                  width: `${withCountiesRate}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegionStatistics;
