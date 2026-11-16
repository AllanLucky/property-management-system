
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Activity,
  Building2,
  Unlink,
  Home,
  Globe2,
  Layers3,
  Map,
  Building,
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

  for (let index = 0; index < 8; index += 1) {
    if (!isObject(source)) {
      return {};
    }

    if (isObject(source.statistics)) {
      source = source.statistics;
      continue;
    }

    if (isObject(source.data)) {
      source = source.data;
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

  if (numericTotal <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, (numericValue / numericTotal) * 100)
  );
};

const formatPercentage = (value) =>
  `${toNumber(value).toFixed(1)}%`;

const getSafePercentage = (value) =>
  Math.min(100, Math.max(0, toNumber(value)));

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
  const safeProgress = getSafePercentage(progress);

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

export const AreaStatisticsSkeleton = () => (
  <section
    aria-label="Area statistics loading"
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
      {Array.from({ length: 3 }).map((_, index) => (
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

const AreaStatistics = ({
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
      "total_areas",
      "total",
      "areas_count",
    ])
  );

  const active = toNumber(
    getStatisticValue(statistics, [
      "active_areas",
      "active",
      "active_count",
    ])
  );

  const inactive = toNumber(
    getStatisticValue(statistics, [
      "inactive_areas",
      "inactive",
      "inactive_count",
    ])
  );

  const withProperties = toNumber(
    getStatisticValue(statistics, [
      "areas_with_properties",
      "with_properties",
    ])
  );

  const withoutProperties = toNumber(
    getStatisticValue(statistics, [
      "areas_without_properties",
      "without_properties",
    ])
  );

  const countriesCount = toNumber(
    getStatisticValue(statistics, [
      "countries_count",
      "total_countries",
    ])
  );

  const regionsCount = toNumber(
    getStatisticValue(statistics, [
      "regions_count",
      "total_regions",
    ])
  );

  const countiesCount = toNumber(
    getStatisticValue(statistics, [
      "counties_count",
      "total_counties",
    ])
  );

  const citiesCount = toNumber(
    getStatisticValue(statistics, [
      "cities_count",
      "total_cities",
    ])
  );

  /*
  |--------------------------------------------------------------------------
  | Percentages
  |--------------------------------------------------------------------------
  */

  const activeRate = getSafePercentage(
    getStatisticValue(
      statistics,
      ["active_percentage"],
      getPercentage(active, total)
    )
  );

  const inactiveRate = getSafePercentage(
    getStatisticValue(
      statistics,
      ["inactive_percentage"],
      getPercentage(inactive, total)
    )
  );

  const withPropertiesRate = getPercentage(
    withProperties,
    total
  );

  const withoutPropertiesRate = getPercentage(
    withoutProperties,
    total
  );

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return <AreaStatisticsSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Primary Statistics
  |--------------------------------------------------------------------------
  */

  const primaryStatistics = [
    {
      label: "Total Areas",
      value: formatNumber(total),
      icon: MapPin,
      iconWrapperClass: "bg-indigo-50",
      iconClass: "text-indigo-600",
      progress: total > 0 ? 100 : 0,
      progressClass: "bg-indigo-500",
      description: "All registered areas",
    },
    {
      label: "Active Areas",
      value: formatNumber(active),
      icon: CheckCircle2,
      iconWrapperClass: "bg-emerald-50",
      iconClass: "text-emerald-600",
      progress: activeRate,
      progressClass: "bg-emerald-500",
      description: "Currently active areas",
    },
    {
      label: "Inactive Areas",
      value: formatNumber(inactive),
      icon: XCircle,
      iconWrapperClass: "bg-amber-50",
      iconClass: "text-amber-600",
      progress: inactiveRate,
      progressClass: "bg-amber-500",
      description: "Currently inactive areas",
    },
    {
      label: "With Properties",
      value: formatNumber(withProperties),
      icon: Building2,
      iconWrapperClass: "bg-blue-50",
      iconClass: "text-blue-600",
      progress: withPropertiesRate,
      progressClass: "bg-blue-500",
      description: "Areas linked to properties",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Area Status Breakdown
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
  | Property Association Breakdown
  |--------------------------------------------------------------------------
  */

  const propertyStatistics = [
    {
      label: "With Properties",
      value: withProperties,
      icon: Building2,
      iconClass: "text-blue-600",
      backgroundClass: "bg-blue-50",
      progressClass: "bg-blue-500",
    },
    {
      label: "Without Properties",
      value: withoutProperties,
      icon: Home,
      iconClass: "text-orange-600",
      backgroundClass: "bg-orange-50",
      progressClass: "bg-orange-500",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Geographic Hierarchy Breakdown
  |--------------------------------------------------------------------------
  */

  const geographicStatistics = [
    {
      label: "Countries",
      value: countriesCount,
      icon: Globe2,
      iconClass: "text-indigo-600",
      backgroundClass: "bg-indigo-50",
      progressClass: "bg-indigo-500",
    },
    {
      label: "Regions",
      value: regionsCount,
      icon: Layers3,
      iconClass: "text-violet-600",
      backgroundClass: "bg-violet-50",
      progressClass: "bg-violet-500",
    },
    {
      label: "Counties",
      value: countiesCount,
      icon: Map,
      iconClass: "text-emerald-600",
      backgroundClass: "bg-emerald-50",
      progressClass: "bg-emerald-500",
    },
    {
      label: "Cities",
      value: citiesCount,
      icon: Building,
      iconClass: "text-blue-600",
      backgroundClass: "bg-blue-50",
      progressClass: "bg-blue-500",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section
      aria-label="Area statistics"
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
          AREA STATUS + PROPERTY ASSOCIATION
      ================================================================ */}

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">

        {/* --------------------------------------------------------------
            Area Status
        -------------------------------------------------------------- */}

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between gap-4">

            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-900">
                Area Status
              </h3>

              <p className="mt-1 truncate text-xs text-gray-500">
                Current area registration status breakdown
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
                  Active Area Rate
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

            <div className="mt-3 flex items-center justify-between gap-3">

              <span className="text-xs text-gray-400">
                Inactive Area Rate
              </span>

              <span className="text-xs font-semibold text-amber-600">
                {formatPercentage(inactiveRate)}
              </span>

            </div>

          </div>
        </div>

        {/* --------------------------------------------------------------
            Property Association
        -------------------------------------------------------------- */}

        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between gap-4">

            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-900">
                Property Association
              </h3>

              <p className="mt-1 truncate text-xs text-gray-500">
                Areas with and without associated properties
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <Building2
                className="h-4 w-4 text-blue-600"
                aria-hidden="true"
              />
            </div>

          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {propertyStatistics.map((item) => (
              <BreakdownCard
                key={item.label}
                {...item}
                total={total}
              />
            ))}
          </div>

          {/* Property Summary */}

          <div className="mt-5 border-t border-gray-100 pt-4">

            <div className="flex items-center justify-between gap-3">

              <div className="flex items-center gap-2">
                <Building2
                  className="h-4 w-4 text-blue-500"
                  aria-hidden="true"
                />

                <span className="text-xs font-semibold text-gray-600">
                  Areas With Properties
                </span>
              </div>

              <span className="text-sm font-bold text-blue-600">
                {formatNumber(withProperties)}
              </span>

            </div>

            <div className="mt-2 flex items-center justify-between gap-3">

              <span className="text-xs text-gray-400">
                Areas without properties
              </span>

              <span className="text-xs font-semibold text-orange-600">
                {formatNumber(withoutProperties)}
              </span>

            </div>

            <div className="mt-3 flex items-center justify-between gap-3">

              <span className="text-xs text-gray-400">
                Property association rate
              </span>

              <span className="text-xs font-semibold text-gray-700">
                {formatPercentage(withPropertiesRate)}
              </span>

            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-700"
                style={{
                  width: `${withPropertiesRate}%`,
                }}
              />
            </div>

            <div className="mt-2 text-right text-xs text-gray-400">
              {formatPercentage(withoutPropertiesRate)} without properties
            </div>

          </div>
        </div>

      </div>

      {/* ================================================================
          GEOGRAPHIC HIERARCHY
      ================================================================ */}

      <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">

        <div className="flex items-center justify-between gap-4">

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-gray-900">
              Geographic Distribution
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Geographic entities associated with registered areas
            </p>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
            <MapPin
              className="h-4 w-4 text-violet-600"
              aria-hidden="true"
            />
          </div>

        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {geographicStatistics.map((item) => (
            <BreakdownCard
              key={item.label}
              {...item}
              total={Math.max(
                countriesCount,
                regionsCount,
                countiesCount,
                citiesCount
              )}
            />
          ))}
        </div>

        {/* Geographic Summary */}

        <div className="mt-5 border-t border-gray-100 pt-4">

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

            <div>
              <p className="text-xs text-gray-400">
                Countries
              </p>

              <p className="mt-1 text-lg font-bold text-indigo-600">
                {formatNumber(countriesCount)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">
                Regions
              </p>

              <p className="mt-1 text-lg font-bold text-violet-600">
                {formatNumber(regionsCount)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">
                Counties
              </p>

              <p className="mt-1 text-lg font-bold text-emerald-600">
                {formatNumber(countiesCount)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">
                Cities
              </p>

              <p className="mt-1 text-lg font-bold text-blue-600">
                {formatNumber(citiesCount)}
              </p>
            </div>

          </div>
        </div>

      </div>

    </section>
  );
};

export default AreaStatistics;
