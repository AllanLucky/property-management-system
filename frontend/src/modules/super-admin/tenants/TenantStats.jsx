import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  Users,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  fetchTenantStatistics,
  selectTenantStatistics,
  selectTenantLoadingStatistics,
  selectTenantStatisticsError,
} from "../../../store/tenantSlice";

/*
|--------------------------------------------------------------------------
| TenantStats
|--------------------------------------------------------------------------
| Tenant statistics / KPI section.
|
| Responsibilities:
| - Fetch tenant statistics
| - Display total tenants
| - Display active tenants
| - Display pending tenants
| - Display inactive tenants
| - Display blacklisted tenants
| - Display verified tenants
| - Display unverified tenants
| - Safely handle different Laravel API response structures
| - Prevent duplicate initial requests
| - Handle loading and error states
|--------------------------------------------------------------------------
*/

const TenantStats = () => {
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | REDUX STATE
  |--------------------------------------------------------------------------
  */

  const statistics = useSelector(
    selectTenantStatistics
  );

  const loading = useSelector(
    selectTenantLoadingStatistics
  );

  const error = useSelector(
    selectTenantStatisticsError
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH CONTROL
  |--------------------------------------------------------------------------
  |
  | Prevent duplicate requests during React StrictMode development.
  |
  */

  const hasFetched = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | FETCH STATISTICS
  |--------------------------------------------------------------------------
  */

  const loadStatistics = useCallback(() => {
    return dispatch(
      fetchTenantStatistics()
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

    loadStatistics().catch((fetchError) => {
      console.error(
        "Failed to fetch tenant statistics:",
        fetchError
      );
    });
  }, [loadStatistics]);

  /*
  |--------------------------------------------------------------------------
  | SAFE OBJECT CHECK
  |--------------------------------------------------------------------------
  */

  const isPlainObject = useCallback(
    (value) => {
      return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      );
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | SAFE NUMBER
  |--------------------------------------------------------------------------
  */

  const toNumber = useCallback((value) => {
    /*
     * Null / undefined / empty values.
     */
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    /*
     * Do not attempt Number({}).
     */
    if (
      typeof value === "object" &&
      value !== null
    ) {
      return 0;
    }

    /*
     * Handle boolean values safely.
     */
    if (typeof value === "boolean") {
      return value ? 1 : 0;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }, []);

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE STATISTICS RESPONSE
  |--------------------------------------------------------------------------
  |
  | Supported API responses:
  |
  | 1.
  | {
  |   total: 10,
  |   active: 5
  | }
  |
  | 2.
  | {
  |   data: {
  |     total: 10,
  |     active: 5
  |   }
  | }
  |
  | 3.
  | {
  |   data: {
  |     statistics: {
  |       total: 10,
  |       active: 5
  |     }
  |   }
  | }
  |
  | 4.
  | {
  |   statistics: {
  |     total: 10,
  |     active: 5
  |   }
  | }
  |
  | 5.
  | {
  |   data: {
  |     data: {
  |       total: 10
  |     }
  |   }
  | }
  |
  */

  const stats = useMemo(() => {
    if (!isPlainObject(statistics)) {
      return {};
    }

    /*
     * data.statistics
     */
    if (
      isPlainObject(statistics.data) &&
      isPlainObject(
        statistics.data.statistics
      )
    ) {
      return statistics.data.statistics;
    }

    /*
     * data.data
     */
    if (
      isPlainObject(statistics.data) &&
      isPlainObject(
        statistics.data.data
      )
    ) {
      return statistics.data.data;
    }

    /*
     * data
     */
    if (isPlainObject(statistics.data)) {
      return statistics.data;
    }

    /*
     * statistics.statistics
     */
    if (
      isPlainObject(
        statistics.statistics
      )
    ) {
      return statistics.statistics;
    }

    /*
     * Direct response.
     */
    return statistics;
  }, [statistics, isPlainObject]);

  /*
  |--------------------------------------------------------------------------
  | GET STATISTIC VALUE
  |--------------------------------------------------------------------------
  */

  const getValue = useCallback(
    (...keys) => {
      for (const key of keys) {
        if (
          stats &&
          Object.prototype.hasOwnProperty.call(
            stats,
            key
          )
        ) {
          const value = stats[key];

          /*
           * Ignore objects because they cannot
           * safely be rendered as KPI numbers.
           */
          if (
            typeof value === "object" &&
            value !== null
          ) {
            continue;
          }

          return toNumber(value);
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
    "total_tenants",
    "tenants_count",
    "tenant_count",
    "count"
  );

  const active = getValue(
    "active",
    "active_tenants",
    "active_count",
    "total_active"
  );

  const pending = getValue(
    "pending",
    "pending_tenants",
    "pending_count",
    "total_pending"
  );

  const inactive = getValue(
    "inactive",
    "inactive_tenants",
    "inactive_count",
    "total_inactive"
  );

  const blacklisted = getValue(
    "blacklisted",
    "blacklisted_tenants",
    "blacklisted_count",
    "total_blacklisted"
  );

  const verified = getValue(
    "verified",
    "verified_tenants",
    "verified_count",
    "total_verified"
  );

  const unverified = getValue(
    "unverified",
    "unverified_tenants",
    "unverified_count",
    "total_unverified"
  );

  /*
  |--------------------------------------------------------------------------
  | STAT CARDS
  |--------------------------------------------------------------------------
  */

  const cards = useMemo(
    () => [
      {
        key: "total",
        title: "Total Tenants",
        value: total,
        description:
          "All registered tenants",
        icon: Users,
        iconWrapper:
          "bg-blue-50 text-blue-600",
      },

      {
        key: "active",
        title: "Active Tenants",
        value: active,
        description:
          "Currently active tenants",
        icon: UserCheck,
        iconWrapper:
          "bg-green-50 text-green-600",
      },

      {
        key: "pending",
        title: "Pending",
        value: pending,
        description:
          "Awaiting approval",
        icon: Clock3,
        iconWrapper:
          "bg-amber-50 text-amber-600",
      },

      {
        key: "inactive",
        title: "Inactive",
        value: inactive,
        description:
          "Inactive tenant accounts",
        icon: UserX,
        iconWrapper:
          "bg-gray-100 text-gray-600",
      },

      {
        key: "blacklisted",
        title: "Blacklisted",
        value: blacklisted,
        description:
          "Blacklisted tenants",
        icon: ShieldAlert,
        iconWrapper:
          "bg-red-50 text-red-600",
      },

      {
        key: "verified",
        title: "Verified",
        value: verified,
        description:
          "Verified tenant profiles",
        icon: CheckCircle2,
        iconWrapper:
          "bg-emerald-50 text-emerald-600",
      },

      {
        key: "unverified",
        title: "Unverified",
        value: unverified,
        description:
          "Profiles awaiting verification",
        icon: XCircle,
        iconWrapper:
          "bg-orange-50 text-orange-600",
      },
    ],
    [
      total,
      active,
      pending,
      inactive,
      blacklisted,
      verified,
      unverified,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | RETRY
  |--------------------------------------------------------------------------
  */

  const handleRetry = useCallback(() => {
    /*
     * Allow another request after a failed request.
     */
    hasFetched.current = true;

    return loadStatistics().catch(
      (retryError) => {
        console.error(
          "Tenant statistics retry failed:",
          retryError
        );

        throw retryError;
      }
    );
  }, [loadStatistics]);

  /*
  |--------------------------------------------------------------------------
  | ERROR MESSAGE
  |--------------------------------------------------------------------------
  */

  const errorMessage = useMemo(() => {
    if (!error) {
      return "Something went wrong while loading tenant statistics.";
    }

    /*
     * String error.
     */
    if (typeof error === "string") {
      return error;
    }

    /*
     * Standard Error object.
     */
    if (
      typeof error?.message === "string" &&
      error.message.trim()
    ) {
      return error.message;
    }

    /*
     * Redux/API error.
     */
    if (
      typeof error?.error === "string" &&
      error.error.trim()
    ) {
      return error.error;
    }

    /*
     * Nested data message.
     */
    if (
      typeof error?.data?.message ===
      "string" &&
      error.data.message.trim()
    ) {
      return error.data.message;
    }

    /*
     * Axios response message.
     */
    if (
      typeof error?.response?.data?.message ===
      "string" &&
      error.response.data.message.trim()
    ) {
      return error.response.data.message;
    }

    /*
     * Axios response error.
     */
    if (
      typeof error?.response?.data?.error ===
      "string" &&
      error.response.data.error.trim()
    ) {
      return error.response.data.error;
    }

    /*
     * Validation / SQL/API error object.
     */
    if (
      typeof error?.response?.data?.errors
        ?.message === "string"
    ) {
      return error.response.data.errors.message;
    }

    return "Something went wrong while loading tenant statistics.";
  }, [error]);

  /*
  |--------------------------------------------------------------------------
  | NUMBER FORMATTER
  |--------------------------------------------------------------------------
  */

  const formatNumber = useCallback(
    (value) => {
      return Number(value || 0).toLocaleString(
        "en-KE"
      );
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (
    loading &&
    !statistics
  ) {
    return (
      <section
        aria-label="Loading tenant statistics"
        className="space-y-4"
      >
        {/* HEADER SKELETON */}

        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />

            <div className="h-4 w-72 animate-pulse rounded bg-gray-100" />
          </div>

          <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
        </div>

        {/* CARD SKELETON */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({
            length: 7,
          }).map((_, index) => (
            <div
              key={index}
              className="
                animate-pulse
                rounded-xl
                border
                border-gray-200
                bg-white
                p-5
                shadow-sm
              "
            >
              <div className="flex items-start justify-between gap-4">
                <div className="h-11 w-11 rounded-xl bg-gray-200" />

                <div className="h-3 w-16 rounded bg-gray-100" />
              </div>

              <div className="mt-5 h-9 w-24 rounded bg-gray-200" />

              <div className="mt-2 h-4 w-32 rounded bg-gray-200" />

              <div className="mt-2 h-3 w-40 rounded bg-gray-100" />
            </div>
          ))}
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
        aria-label="Tenant statistics error"
        role="alert"
        className="
          rounded-xl
          border
          border-red-200
          bg-red-50
          p-5
        "
      >
        <div className="flex items-start gap-3">

          {/* ERROR ICON */}

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
            "
          >
            <AlertCircle className="h-5 w-5" />
          </div>

          {/* ERROR CONTENT */}

          <div className="min-w-0 flex-1">

            <h3 className="font-semibold text-red-800">
              Unable to load tenant statistics
            </h3>

            <p className="mt-1 text-sm text-red-700">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              disabled={loading}
              className="
                mt-4
                inline-flex
                items-center
                rounded-lg
                bg-red-600
                px-3.5
                py-2
                text-sm
                font-medium
                text-white
                transition
                hover:bg-red-700
                disabled:cursor-not-allowed
                disabled:opacity-60
                focus:outline-none
                focus:ring-2
                focus:ring-red-500/30
              "
            >
              {loading
                ? "Retrying..."
                : "Try Again"}
            </button>

          </div>
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
      aria-label="Tenant statistics"
      className="space-y-4"
    >

      {/* ================================================================
          SECTION HEADER
      ================================================================= */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Tenant Overview
          </h2>

          <p className="text-sm text-gray-500">
            Overview of tenant accounts and
            verification status.
          </p>
        </div>

        {loading && (
          <div
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              text-gray-500
            "
            aria-live="polite"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />

            Updating...
          </div>
        )}

      </div>

      {/* ================================================================
          KPI CARDS
      ================================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.key}
              className="
                rounded-xl
                border
                border-gray-200
                bg-white
                p-5
                shadow-sm
                transition
                duration-200
                hover:-translate-y-0.5
                hover:shadow-md
              "
            >

              {/* CARD HEADER */}

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
                    ${card.iconWrapper}
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
                    px-2
                    py-1
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-wide
                    text-gray-400
                  "
                >
                  Tenants
                </span>

              </div>

              {/* CARD VALUE */}

              <div className="mt-5">

                <p className="text-3xl font-bold tracking-tight text-gray-900">
                  {formatNumber(card.value)}
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-700">
                  {card.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {card.description}
                </p>

              </div>

            </article>
          );
        })}

      </div>

      {/* ================================================================
          BACKGROUND REFRESH ERROR
      ================================================================= */}

      {error && statistics && (
        <div
          role="alert"
          className="
            flex
            items-start
            gap-3
            rounded-lg
            border
            border-amber-200
            bg-amber-50
            px-4
            py-3
          "
        >

          <AlertCircle
            className="
              mt-0.5
              h-4
              w-4
              shrink-0
              text-amber-600
            "
          />

          <div className="min-w-0 flex-1">

            <p className="text-xs font-medium text-amber-800">
              Statistics could not be refreshed.
            </p>

            <p className="mt-0.5 text-xs text-amber-700">
              {errorMessage}
            </p>

          </div>

          <button
            type="button"
            onClick={handleRetry}
            disabled={loading}
            className="
              shrink-0
              text-xs
              font-semibold
              text-amber-700
              hover:text-amber-900
              hover:underline
              disabled:opacity-50
            "
          >
            {loading
              ? "Retrying..."
              : "Retry"}
          </button>

        </div>
      )}

    </section>
  );
};

export default TenantStats;