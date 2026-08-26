import {
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  fetchTenancyStatistics,
  selectTenancyStatistics,
  selectTenancyLoading,
  selectTenancyError,
} from "../../../store/tenancySlice";

/*
|--------------------------------------------------------------------------
| TenancyStats
|--------------------------------------------------------------------------
|
| Professional tenancy statistics / KPI dashboard.
|
| Designed for:
| - Desktop
| - Tablet
| - Mobile
| - Light mode
| - Dark mode
|
| Supports flexible backend statistic structures.
|
|--------------------------------------------------------------------------
*/

const TenancyStats = () => {
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | REDUX STATE
  |--------------------------------------------------------------------------
  */

  const statistics = useSelector(
    selectTenancyStatistics
  );

  const loading = useSelector(
    selectTenancyLoading
  );

  const error = useSelector(
    selectTenancyError
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH CONTROL
  |--------------------------------------------------------------------------
  */

  const hasFetched = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | FETCH STATISTICS
  |--------------------------------------------------------------------------
  */

  const loadStatistics = useCallback(() => {
    return dispatch(
      fetchTenancyStatistics()
    );
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | FETCH ON MOUNT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (hasFetched.current) {
      return;
    }

    hasFetched.current = true;

    loadStatistics();
  }, [loadStatistics]);

  /*
  |--------------------------------------------------------------------------
  | SAFE NUMBER
  |--------------------------------------------------------------------------
  */

  const toNumber = useCallback((value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    if (
      typeof value === "object" ||
      typeof value === "boolean"
    ) {
      return 0;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }, []);

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE STATISTICS
  |--------------------------------------------------------------------------
  */

  const stats = useMemo(() => {
    if (
      !statistics ||
      typeof statistics !== "object" ||
      Array.isArray(statistics)
    ) {
      return {};
    }

    /*
     * statistics.data.statistics
     */
    if (
      statistics?.data?.statistics &&
      typeof statistics.data.statistics === "object" &&
      !Array.isArray(statistics.data.statistics)
    ) {
      return statistics.data.statistics;
    }

    /*
     * statistics.data
     */
    if (
      statistics?.data &&
      typeof statistics.data === "object" &&
      !Array.isArray(statistics.data)
    ) {
      return statistics.data;
    }

    /*
     * statistics.statistics
     */
    if (
      statistics?.statistics &&
      typeof statistics.statistics === "object" &&
      !Array.isArray(statistics.statistics)
    ) {
      return statistics.statistics;
    }

    /*
     * Already normalized.
     */
    return statistics;
  }, [statistics]);

  /*
  |--------------------------------------------------------------------------
  | GET STATISTIC VALUE
  |--------------------------------------------------------------------------
  */

  const getValue = useCallback(
    (...keys) => {
      for (const key of keys) {
        if (
          stats?.[key] !== undefined &&
          stats?.[key] !== null
        ) {
          return toNumber(stats[key]);
        }
      }

      return 0;
    },
    [stats, toNumber]
  );

  /*
  |--------------------------------------------------------------------------
  | KPI VALUES
  |--------------------------------------------------------------------------
  */

  const total = getValue(
    "total",
    "total_tenancies",
    "totalTenancies",
    "tenancies_count",
    "tenancy_count",
    "count"
  );

  const active = getValue(
    "active",
    "active_tenancies",
    "activeTenancies",
    "active_count",
    "total_active"
  );

  const pending = getValue(
    "pending",
    "pending_tenancies",
    "pendingTenancies",
    "pending_count",
    "total_pending"
  );

  const expired = getValue(
    "expired",
    "expired_tenancies",
    "expiredTenancies",
    "expired_count",
    "total_expired"
  );

  const terminated = getValue(
    "terminated",
    "terminated_tenancies",
    "terminatedTenancies",
    "terminated_count",
    "total_terminated"
  );

  const cancelled = getValue(
    "cancelled",
    "canceled",
    "cancelled_tenancies",
    "canceled_tenancies",
    "cancelled_count",
    "canceled_count",
    "total_cancelled"
  );

  const currentlyActive = getValue(
    "currently_active",
    "currentlyActive",
    "current",
    "current_tenancies",
    "currentTenancies"
  );

  const movedIn = getValue(
    "moved_in",
    "movedIn",
    "moved_in_count",
    "total_moved_in"
  );

  const movedOut = getValue(
    "moved_out",
    "movedOut",
    "moved_out_count",
    "total_moved_out"
  );

  const totalRent = getValue(
    "total_rent",
    "totalRent",
    "rent_total",
    "total_rent_amount"
  );

  const totalDeposits = getValue(
    "total_deposits",
    "totalDeposits",
    "deposit_total",
    "total_deposit_amount"
  );

  /*
  |--------------------------------------------------------------------------
  | OCCUPANCY RATE
  |--------------------------------------------------------------------------
  */

  const occupancyRate = useMemo(() => {
    const backendValue = getValue(
      "occupancy_rate",
      "occupancyRate",
      "occupancy_percentage",
      "occupancyPercentage"
    );

    if (backendValue > 0) {
      return Math.min(
        Math.max(backendValue, 0),
        100
      );
    }

    if (total <= 0) {
      return 0;
    }

    return Math.min(
      Math.max(
        (currentlyActive / total) * 100,
        0
      ),
      100
    );
  }, [
    getValue,
    total,
    currentlyActive,
  ]);

  /*
  |--------------------------------------------------------------------------
  | ACTIVE RATE
  |--------------------------------------------------------------------------
  */

  const activeRate = useMemo(() => {
    if (total <= 0) {
      return 0;
    }

    return Math.min(
      Math.max(
        (active / total) * 100,
        0
      ),
      100
    );
  }, [active, total]);

  /*
  |--------------------------------------------------------------------------
  | FORMAT NUMBER
  |--------------------------------------------------------------------------
  */

  const formatNumber = useCallback(
    (value) =>
      toNumber(value).toLocaleString(
        "en-KE"
      ),
    [toNumber]
  );

  /*
  |--------------------------------------------------------------------------
  | FORMAT CURRENCY
  |--------------------------------------------------------------------------
  */

  const formatCurrency = useCallback(
    (value) =>
      `KES ${toNumber(
        value
      ).toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    [toNumber]
  );

  /*
  |--------------------------------------------------------------------------
  | ERROR MESSAGE
  |--------------------------------------------------------------------------
  */

  const errorMessage = useMemo(() => {
    if (!error) {
      return "Something went wrong while loading tenancy statistics.";
    }

    if (typeof error === "string") {
      return error;
    }

    if (
      typeof error?.message === "string" &&
      error.message.trim()
    ) {
      return error.message;
    }

    if (
      typeof error?.error === "string" &&
      error.error.trim()
    ) {
      return error.error;
    }

    return "Something went wrong while loading tenancy statistics.";
  }, [error]);

  /*
  |--------------------------------------------------------------------------
  | RETRY
  |--------------------------------------------------------------------------
  */

  const handleRetry = useCallback(() => {
    hasFetched.current = true;

    return loadStatistics();
  }, [loadStatistics]);

  /*
  |--------------------------------------------------------------------------
  | KPI CARDS
  |--------------------------------------------------------------------------
  */

  const cards = useMemo(
    () => [
      {
        key: "total",
        title: "Total Tenancies",
        value: formatNumber(total),
        description: "All tenancy agreements",
        icon: FileText,
        iconClass:
          "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        accent:
          "from-blue-500 to-cyan-500",
        badge: "Total",
      },

      {
        key: "active",
        title: "Active",
        value: formatNumber(active),
        description: "Currently active agreements",
        icon: CheckCircle2,
        iconClass:
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
        accent:
          "from-emerald-500 to-green-500",
        badge: `${activeRate.toFixed(0)}%`,
      },

      {
        key: "pending",
        title: "Pending",
        value: formatNumber(pending),
        description: "Awaiting activation",
        icon: Clock3,
        iconClass:
          "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
        accent:
          "from-amber-500 to-orange-500",
        badge: "Pending",
      },

      {
        key: "expired",
        title: "Expired",
        value: formatNumber(expired),
        description: "Passed tenancy end date",
        icon: CalendarClock,
        iconClass:
          "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
        accent:
          "from-orange-500 to-red-500",
        badge: "Expired",
      },

      {
        key: "terminated",
        title: "Terminated",
        value: formatNumber(terminated),
        description: "Terminated agreements",
        icon: XCircle,
        iconClass:
          "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
        accent:
          "from-red-500 to-rose-500",
        badge: "Terminated",
      },

      {
        key: "cancelled",
        title: "Cancelled",
        value: formatNumber(cancelled),
        description: "Cancelled agreements",
        icon: XCircle,
        iconClass:
          "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400",
        accent:
          "from-slate-500 to-gray-500",
        badge: "Cancelled",
      },

      {
        key: "currently-active",
        title: "Currently Active",
        value: formatNumber(currentlyActive),
        description: "Currently occupied",
        icon: Users,
        iconClass:
          "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
        accent:
          "from-indigo-500 to-violet-500",
        badge: "Current",
      },

      {
        key: "moved-in",
        title: "Moved In",
        value: formatNumber(movedIn),
        description: "Tenants who moved in",
        icon: UserCheck,
        iconClass:
          "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
        accent:
          "from-teal-500 to-emerald-500",
        badge: "In",
      },

      {
        key: "moved-out",
        title: "Moved Out",
        value: formatNumber(movedOut),
        description: "Tenants who moved out",
        icon: UserMinus,
        iconClass:
          "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400",
        accent:
          "from-gray-500 to-slate-500",
        badge: "Out",
      },

      {
        key: "total-rent",
        title: "Total Rent",
        value: formatCurrency(totalRent),
        description: "Rent across tenancies",
        icon: Wallet,
        iconClass:
          "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400",
        accent:
          "from-cyan-500 to-blue-500",
        badge: "KES",
        financial: true,
      },

      {
        key: "total-deposits",
        title: "Total Deposits",
        value: formatCurrency(totalDeposits),
        description: "Collected tenancy deposits",
        icon: Wallet,
        iconClass:
          "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
        accent:
          "from-violet-500 to-purple-500",
        badge: "KES",
        financial: true,
      },
    ],
    [
      total,
      active,
      pending,
      expired,
      terminated,
      cancelled,
      currentlyActive,
      movedIn,
      movedOut,
      totalRent,
      totalDeposits,
      activeRate,
      formatNumber,
      formatCurrency,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | LOADING SKELETON
  |--------------------------------------------------------------------------
  */

  if (
    loading &&
    !statistics
  ) {
    return (
      <section
        aria-label="Loading tenancy statistics"
        className="space-y-6"
      >
        {/* Header skeleton */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />

            <div className="h-4 w-80 max-w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          </div>

          <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        </div>

        {/* Featured skeleton */}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="h-36 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700 lg:col-span-2" />

          <div className="h-36 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Card skeletons */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map(
            (_, index) => (
              <div
                key={index}
                className="
                  rounded-2xl
                  border
                  border-gray-200
                  bg-white
                  p-5
                  dark:border-gray-700
                  dark:bg-gray-800
                "
              >
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />

                  <div className="h-5 w-14 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700" />
                </div>

                <div className="mt-6 h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

                <div className="mt-3 h-4 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />

                <div className="mt-2 h-3 w-44 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
              </div>
            )
          )}
        </div>
      </section>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR STATE
  |--------------------------------------------------------------------------
  */

  if (
    error &&
    !statistics
  ) {
    return (
      <section
        aria-label="Tenancy statistics error"
        role="alert"
        className="
          overflow-hidden
          rounded-2xl
          border
          border-red-200
          bg-white
          shadow-sm
          dark:border-red-900/50
          dark:bg-gray-900
        "
      >
        <div className="border-b border-red-100 bg-red-50/70 px-5 py-4 dark:border-red-900/40 dark:bg-red-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-300">
                Unable to load tenancy statistics
              </h3>

              <p className="mt-0.5 text-xs text-red-700 dark:text-red-400">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Check your connection and try again.
          </p>

          <button
            type="button"
            onClick={handleRetry}
            disabled={loading}
            className="
              inline-flex
              shrink-0
              items-center
              gap-2
              rounded-lg
              bg-gray-900
              px-4
              py-2
              text-xs
              font-semibold
              text-white
              transition
              hover:bg-gray-800
              disabled:cursor-not-allowed
              disabled:opacity-50
              dark:bg-white
              dark:text-gray-900
              dark:hover:bg-gray-100
            "
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading
                ? "animate-spin"
                : ""
                }`}
            />

            Try Again
          </button>
        </div>
      </section>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <section
      aria-label="Tenancy statistics"
      className="space-y-6"
    >
      {/* ----------------------------------------------------------------
          HEADER
      ----------------------------------------------------------------- */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>

            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Tenancy Overview
            </h2>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Monitor tenancy activity, occupancy,
            tenant movement and financial performance.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRetry}
          disabled={loading}
          className="
            inline-flex
            w-fit
            items-center
            gap-2
            rounded-xl
            border
            border-gray-200
            bg-white
            px-3.5
            py-2
            text-sm
            font-medium
            text-gray-700
            shadow-sm
            transition
            hover:border-gray-300
            hover:bg-gray-50
            disabled:cursor-not-allowed
            disabled:opacity-50
            dark:border-gray-700
            dark:bg-gray-800
            dark:text-gray-200
            dark:hover:bg-gray-750
          "
        >
          <RefreshCw
            className={`h-4 w-4 ${loading
              ? "animate-spin"
              : ""
              }`}
          />

          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* ----------------------------------------------------------------
          FEATURED SUMMARY
      ----------------------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Occupancy */}

        <article
          className="
            relative
            overflow-hidden
            rounded-2xl
            bg-gradient-to-br
            from-blue-600
            via-indigo-600
            to-violet-600
            p-6
            text-white
            shadow-lg
            lg:col-span-2
          "
        >
          {/* Decorative elements */}

          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10" />

          <div className="absolute -bottom-20 right-20 h-44 w-44 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                    <TrendingUp className="h-4 w-4" />
                  </div>

                  <span className="text-sm font-medium text-blue-100">
                    Occupancy Performance
                  </span>
                </div>

                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-bold tracking-tight">
                    {occupancyRate.toFixed(1)}%
                  </span>

                  <span className="mb-1 text-sm text-blue-100">
                    occupancy
                  </span>
                </div>

                <p className="mt-2 text-sm text-blue-100">
                  {currentlyActive} currently active
                  out of {total} total tenancies.
                </p>
              </div>

              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-8 border-white/20 bg-white/10">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {Math.round(
                      occupancyRate
                    )}
                    %
                  </p>

                  <p className="text-[10px] uppercase tracking-wider text-blue-100">
                    Rate
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs text-blue-100">
                <span>Occupancy</span>

                <span>
                  {currentlyActive} / {total}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-700"
                  style={{
                    width: `${occupancyRate}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </article>

        {/* Active Tenancies */}

        <article
          className="
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-6
            shadow-sm
            dark:border-gray-700
            dark:bg-gray-800
          "
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              Active
            </span>
          </div>

          <div className="mt-6">
            <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {formatNumber(active)}
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
              Active Tenancies
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
              {activeRate.toFixed(1)}% of all tenancy
              records are active.
            </p>
          </div>

          <div className="mt-5">
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{
                  width: `${activeRate}%`,
                }}
              />
            </div>
          </div>
        </article>
      </div>

      {/* ----------------------------------------------------------------
          KPI GRID
      ----------------------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.key}
              className="
                group
                relative
                overflow-hidden
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-5
                shadow-sm
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:shadow-lg
                dark:border-gray-700
                dark:bg-gray-800
              "
            >
              {/* Top accent */}

              <div
                className={`
                  absolute
                  inset-x-0
                  top-0
                  h-0.5
                  bg-gradient-to-r
                  ${card.accent}
                  opacity-0
                  transition-opacity
                  duration-200
                  group-hover:opacity-100
                `}
              />

              {/* Card header */}

              <div className="flex items-start justify-between gap-4">
                <div
                  className={`
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    transition-transform
                    duration-200
                    group-hover:scale-105
                    ${card.iconClass}
                  `}
                >
                  <Icon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </div>

                <span
                  className="
                    rounded-full
                    bg-gray-50
                    px-2.5
                    py-1
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wide
                    text-gray-500
                    dark:bg-gray-700/70
                    dark:text-gray-300
                  "
                >
                  {card.badge}
                </span>
              </div>

              {/* Card content */}

              <div className="mt-6">
                <p
                  className={`
                    font-bold
                    tracking-tight
                    text-gray-900
                    dark:text-white
                    ${card.financial
                      ? "text-2xl"
                      : "text-3xl"
                    }
                  `}
                >
                  {card.value}
                </p>

                <p className="mt-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {card.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  {card.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {/* ----------------------------------------------------------------
          FINANCIAL SUMMARY
      ----------------------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article
          className="
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-5
            shadow-sm
            dark:border-gray-700
            dark:bg-gray-800
          "
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
              <Wallet className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Rental Revenue
              </h3>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total rent represented by tenancy records
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {formatCurrency(totalRent)}
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Total rent
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </article>

        <article
          className="
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-5
            shadow-sm
            dark:border-gray-700
            dark:bg-gray-800
          "
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
              <Wallet className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Security Deposits
              </h3>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total deposits recorded for tenancies
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {formatCurrency(totalDeposits)}
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Total deposits
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </article>
      </div>

      {/* ----------------------------------------------------------------
          BACKGROUND REFRESH ERROR
      ----------------------------------------------------------------- */}

      {error && statistics && (
        <div
          role="alert"
          className="
            flex
            flex-col
            gap-3
            rounded-xl
            border
            border-amber-200
            bg-amber-50
            px-4
            py-3
            sm:flex-row
            sm:items-center
            sm:justify-between
            dark:border-amber-900/50
            dark:bg-amber-950/20
          "
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                Statistics could not be refreshed
              </p>

              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                {errorMessage}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRetry}
            disabled={loading}
            className="
              inline-flex
              items-center
              justify-center
              gap-1.5
              rounded-lg
              border
              border-amber-200
              bg-white
              px-3
              py-1.5
              text-xs
              font-semibold
              text-amber-800
              transition
              hover:bg-amber-100
              disabled:cursor-not-allowed
              disabled:opacity-50
              dark:border-amber-800
              dark:bg-amber-950/30
              dark:text-amber-300
              dark:hover:bg-amber-950/50
            "
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading
                ? "animate-spin"
                : ""
                }`}
            />

            Retry
          </button>
        </div>
      )}
    </section>
  );
};

export default TenancyStats;