import {
  Activity,
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileClock,
  FileText,
  RefreshCw,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

/**
 * TenancyStats
 *
 * Displays tenancy statistics.
 *
 * Expected statistics can contain:
 *
 * {
 *   total,
 *   active,
 *   pending,
 *   expired,
 *   terminated,
 *   cancelled,
 *   inactive,
 *   current,
 *   upcoming,
 *   occupancy_rate
 * }
 *
 * The component also supports common alternative names such as:
 *
 * total_tenancies
 * active_tenancies
 * pending_tenancies
 * expired_tenancies
 * terminated_tenancies
 * cancelled_tenancies
 * occupancyRate
 */

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const getValue = (source, keys, fallback = 0) => {
  if (!source || typeof source !== "object") {
    return fallback;
  }

  for (const key of keys) {
    if (
      source[key] !== undefined &&
      source[key] !== null &&
      source[key] !== ""
    ) {
      return source[key];
    }
  }

  return fallback;
};

const formatNumber = (value) => {
  return new Intl.NumberFormat().format(toNumber(value));
};

const formatPercentage = (value) => {
  const number = toNumber(value);

  return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
};

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconClassName = "",
  valueClassName = "",
  loading = false,
}) => {
  return (
    <div
      className="
        rounded-xl
        border
        border-gray-200
        bg-white
        p-5
        shadow-sm
        transition
        duration-200
        hover:shadow-md
        dark:border-gray-700
        dark:bg-gray-800
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className="
              text-sm
              font-medium
              text-gray-500
              dark:text-gray-400
            "
          >
            {title}
          </p>

          {loading ? (
            <div className="mt-3">
              <div
                className="
                  h-8
                  w-20
                  animate-pulse
                  rounded-md
                  bg-gray-200
                  dark:bg-gray-700
                "
              />
            </div>
          ) : (
            <p
              className={`
                mt-2
                text-2xl
                font-bold
                tracking-tight
                text-gray-900
                dark:text-white
                ${valueClassName}
              `}
            >
              {value}
            </p>
          )}

          {description && (
            <p
              className="
                mt-1
                text-xs
                text-gray-500
                dark:text-gray-400
              "
            >
              {description}
            </p>
          )}
        </div>

        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-lg
            ${iconClassName}
          `}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
};

const TenancyStats = ({
  statistics = null,
  data = null,
  loading = false,
  error = null,
  onRefresh = null,
  showTitle = true,
  compact = false,
}) => {
  /*
  |--------------------------------------------------------------------------
  | NORMALIZE API RESPONSE
  |--------------------------------------------------------------------------
  |
  | Your ApiResponse may return:
  |
  | statistics
  | data
  | data.statistics
  | data.data
  |
  | Normalize all of them here so the UI does not break.
  |
  */

  let stats = statistics ?? data ?? {};

  if (stats?.data && typeof stats.data === "object") {
    stats = stats.data;
  }

  if (
    stats?.statistics &&
    typeof stats.statistics === "object"
  ) {
    stats = stats.statistics;
  }

  if (!stats || typeof stats !== "object") {
    stats = {};
  }

  /*
  |--------------------------------------------------------------------------
  | STATISTIC VALUES
  |--------------------------------------------------------------------------
  */

  const total = toNumber(
    getValue(stats, [
      "total",
      "total_tenancies",
      "totalTenancies",
      "count",
    ])
  );

  const active = toNumber(
    getValue(stats, [
      "active",
      "active_tenancies",
      "activeTenancies",
      "current",
      "current_tenancies",
      "currentTenancies",
    ])
  );

  const pending = toNumber(
    getValue(stats, [
      "pending",
      "pending_tenancies",
      "pendingTenancies",
    ])
  );

  const expired = toNumber(
    getValue(stats, [
      "expired",
      "expired_tenancies",
      "expiredTenancies",
    ])
  );

  const terminated = toNumber(
    getValue(stats, [
      "terminated",
      "terminated_tenancies",
      "terminatedTenancies",
    ])
  );

  const cancelled = toNumber(
    getValue(stats, [
      "cancelled",
      "canceled",
      "cancelled_tenancies",
      "canceled_tenancies",
      "cancelledTenancies",
      "canceledTenancies",
    ])
  );

  const inactive = toNumber(
    getValue(stats, [
      "inactive",
      "inactive_tenancies",
      "inactiveTenancies",
    ])
  );

  const upcoming = toNumber(
    getValue(stats, [
      "upcoming",
      "upcoming_tenancies",
      "upcomingTenancies",
    ])
  );

  /*
  |--------------------------------------------------------------------------
  | OCCUPANCY RATE
  |--------------------------------------------------------------------------
  */

  let occupancyRate = getValue(stats, [
    "occupancy_rate",
    "occupancyRate",
    "occupancy",
  ]);

  occupancyRate = toNumber(occupancyRate);

  /*
  |--------------------------------------------------------------------------
  | FALLBACK OCCUPANCY
  |--------------------------------------------------------------------------
  |
  | If the backend does not return occupancy_rate, calculate it from
  | active / total.
  |
  */

  if (
    occupancyRate === 0 &&
    total > 0 &&
    active > 0
  ) {
    occupancyRate = (active / total) * 100;
  }

  /*
  |--------------------------------------------------------------------------
  | STATUS DISTRIBUTION
  |--------------------------------------------------------------------------
  */

  const statusTotal =
    active +
    pending +
    expired +
    terminated +
    cancelled;

  const hasStatusData = statusTotal > 0 || total > 0;

  /*
  |--------------------------------------------------------------------------
  | ERROR STATE
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <div
        className="
          rounded-xl
          border
          border-red-200
          bg-red-50
          p-5
          dark:border-red-900/50
          dark:bg-red-950/20
        "
      >
        <div className="flex items-start gap-3">
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-red-100
              text-red-600
              dark:bg-red-900/30
              dark:text-red-400
            "
          >
            <AlertCircle size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className="
                text-sm
                font-semibold
                text-red-800
                dark:text-red-300
              "
            >
              Unable to load tenancy statistics
            </h3>

            <p
              className="
                mt-1
                text-sm
                text-red-700
                dark:text-red-400
              "
            >
              {typeof error === "string"
                ? error
                : error?.message ||
                "An error occurred while loading tenancy statistics."}
            </p>

            {typeof onRefresh === "function" && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="
                  mt-3
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  bg-red-600
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-red-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin" : ""}
                />

                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  /*
  |--------------------------------------------------------------------------
  | MAIN RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <section className="w-full">
      {showTitle && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity
                size={20}
                className="text-indigo-600 dark:text-indigo-400"
              />

              <h2
                className="
                  text-lg
                  font-semibold
                  text-gray-900
                  dark:text-white
                "
              >
                Tenancy Overview
              </h2>
            </div>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
                dark:text-gray-400
              "
            >
              Overview of tenancy activity and current status.
            </p>
          </div>

          {typeof onRefresh === "function" && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="
                inline-flex
                h-9
                items-center
                justify-center
                gap-2
                self-start
                rounded-lg
                border
                border-gray-200
                bg-white
                px-3
                text-sm
                font-medium
                text-gray-700
                shadow-sm
                transition
                hover:bg-gray-50
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:self-auto
                dark:border-gray-700
                dark:bg-gray-800
                dark:text-gray-200
                dark:hover:bg-gray-700
              "
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />

              Refresh
            </button>
          )}
        </div>
      )}

      {/* ================================================================
          PRIMARY STATISTICS
      ================================================================ */}

      <div
        className={`
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          ${compact
            ? "lg:grid-cols-4"
            : "lg:grid-cols-4"
          }
        `}
      >
        <StatCard
          title="Total Tenancies"
          value={formatNumber(total)}
          description="All tenancy records"
          icon={FileText}
          iconClassName="
            bg-indigo-50
            text-indigo-600
            dark:bg-indigo-950/40
            dark:text-indigo-400
          "
          loading={loading}
        />

        <StatCard
          title="Active"
          value={formatNumber(active)}
          description="Currently active"
          icon={CheckCircle2}
          iconClassName="
            bg-green-50
            text-green-600
            dark:bg-green-950/40
            dark:text-green-400
          "
          valueClassName="text-green-700 dark:text-green-400"
          loading={loading}
        />

        <StatCard
          title="Pending"
          value={formatNumber(pending)}
          description="Awaiting activation"
          icon={Clock3}
          iconClassName="
            bg-yellow-50
            text-yellow-600
            dark:bg-yellow-950/40
            dark:text-yellow-400
          "
          valueClassName="text-yellow-700 dark:text-yellow-400"
          loading={loading}
        />

        <StatCard
          title="Expired"
          value={formatNumber(expired)}
          description="Past end date"
          icon={CalendarClock}
          iconClassName="
            bg-orange-50
            text-orange-600
            dark:bg-orange-950/40
            dark:text-orange-400
          "
          valueClassName="text-orange-700 dark:text-orange-400"
          loading={loading}
        />
      </div>

      {/* ================================================================
          SECONDARY STATISTICS
      ================================================================ */}

      <div
        className="
          mt-4
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        <StatCard
          title="Terminated"
          value={formatNumber(terminated)}
          description="Terminated agreements"
          icon={XCircle}
          iconClassName="
            bg-red-50
            text-red-600
            dark:bg-red-950/40
            dark:text-red-400
          "
          valueClassName="text-red-700 dark:text-red-400"
          loading={loading}
        />

        <StatCard
          title="Cancelled"
          value={formatNumber(cancelled)}
          description="Cancelled agreements"
          icon={XCircle}
          iconClassName="
            bg-gray-100
            text-gray-600
            dark:bg-gray-700
            dark:text-gray-300
          "
          loading={loading}
        />

        <StatCard
          title="Upcoming"
          value={formatNumber(upcoming)}
          description="Upcoming tenancies"
          icon={CalendarClock}
          iconClassName="
            bg-blue-50
            text-blue-600
            dark:bg-blue-950/40
            dark:text-blue-400
          "
          valueClassName="text-blue-700 dark:text-blue-400"
          loading={loading}
        />

        <StatCard
          title="Occupancy Rate"
          value={formatPercentage(occupancyRate)}
          description="Active vs total tenancies"
          icon={TrendingUp}
          iconClassName="
            bg-purple-50
            text-purple-600
            dark:bg-purple-950/40
            dark:text-purple-400
          "
          valueClassName="text-purple-700 dark:text-purple-400"
          loading={loading}
        />
      </div>

      {/* ================================================================
          STATUS DISTRIBUTION
      ================================================================ */}

      {!compact && (
        <div
          className="
            mt-6
            rounded-xl
            border
            border-gray-200
            bg-white
            p-5
            shadow-sm
            dark:border-gray-700
            dark:bg-gray-800
          "
        >
          <div className="flex items-center gap-2">
            <FileClock
              size={19}
              className="text-gray-600 dark:text-gray-300"
            />

            <h3
              className="
                text-base
                font-semibold
                text-gray-900
                dark:text-white
              "
            >
              Tenancy Status Distribution
            </h3>
          </div>

          <div className="mt-5 space-y-4">
            {/* Active */}
            <StatusBar
              label="Active"
              value={active}
              total={hasStatusData ? Math.max(total, statusTotal) : 0}
              percentage={
                total > 0
                  ? (active / total) * 100
                  : 0
              }
              icon={CheckCircle2}
              barClassName="bg-green-500"
              textClassName="text-green-700 dark:text-green-400"
            />

            {/* Pending */}
            <StatusBar
              label="Pending"
              value={pending}
              total={hasStatusData ? Math.max(total, statusTotal) : 0}
              percentage={
                total > 0
                  ? (pending / total) * 100
                  : 0
              }
              icon={Clock3}
              barClassName="bg-yellow-500"
              textClassName="text-yellow-700 dark:text-yellow-400"
            />

            {/* Expired */}
            <StatusBar
              label="Expired"
              value={expired}
              total={hasStatusData ? Math.max(total, statusTotal) : 0}
              percentage={
                total > 0
                  ? (expired / total) * 100
                  : 0
              }
              icon={CalendarClock}
              barClassName="bg-orange-500"
              textClassName="text-orange-700 dark:text-orange-400"
            />

            {/* Terminated */}
            <StatusBar
              label="Terminated"
              value={terminated}
              total={hasStatusData ? Math.max(total, statusTotal) : 0}
              percentage={
                total > 0
                  ? (terminated / total) * 100
                  : 0
              }
              icon={XCircle}
              barClassName="bg-red-500"
              textClassName="text-red-700 dark:text-red-400"
            />

            {/* Cancelled */}
            <StatusBar
              label="Cancelled"
              value={cancelled}
              total={hasStatusData ? Math.max(total, statusTotal) : 0}
              percentage={
                total > 0
                  ? (cancelled / total) * 100
                  : 0
              }
              icon={XCircle}
              barClassName="bg-gray-500"
              textClassName="text-gray-700 dark:text-gray-300"
            />
          </div>
        </div>
      )}

      {/* ================================================================
          EMPTY STATISTICS NOTICE
      ================================================================ */}

      {!loading &&
        total === 0 &&
        active === 0 &&
        pending === 0 &&
        expired === 0 &&
        terminated === 0 &&
        cancelled === 0 && (
          <div
            className="
              mt-5
              rounded-xl
              border
              border-dashed
              border-gray-300
              bg-gray-50
              p-6
              text-center
              dark:border-gray-700
              dark:bg-gray-900/40
            "
          >
            <div
              className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                bg-gray-100
                text-gray-500
                dark:bg-gray-800
                dark:text-gray-400
              "
            >
              <Users size={22} />
            </div>

            <h3
              className="
                mt-3
                text-sm
                font-semibold
                text-gray-900
                dark:text-white
              "
            >
              No tenancy statistics available
            </h3>

            <p
              className="
                mx-auto
                mt-1
                max-w-md
                text-sm
                text-gray-500
                dark:text-gray-400
              "
            >
              There are currently no tenancy records available
              to display.
            </p>
          </div>
        )}
    </section>
  );
};

/**
 * StatusBar
 */
const StatusBar = ({
  label,
  value,
  percentage,
  icon: Icon,
  barClassName,
  textClassName,
}) => {
  const safePercentage = Math.min(
    Math.max(toNumber(percentage), 0),
    100
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon
            size={16}
            className={textClassName}
          />

          <span
            className="
              text-sm
              font-medium
              text-gray-700
              dark:text-gray-300
            "
          >
            {label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`
              text-sm
              font-semibold
              ${textClassName}
            `}
          >
            {formatNumber(value)}
          </span>

          <span
            className="
              text-xs
              text-gray-400
              dark:text-gray-500
            "
          >
            ({safePercentage.toFixed(1)}%)
          </span>
        </div>
      </div>

      <div
        className="
          h-2
          overflow-hidden
          rounded-full
          bg-gray-100
          dark:bg-gray-700
        "
      >
        <div
          className={`
            h-full
            rounded-full
            transition-all
            duration-500
            ${barClassName}
          `}
          style={{
            width: `${safePercentage}%`,
          }}
        />
      </div>
    </div>
  );
};

export default TenancyStats;