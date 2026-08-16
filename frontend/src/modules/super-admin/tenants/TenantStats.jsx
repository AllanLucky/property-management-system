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
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchTenantStatistics,
  selectTenantStatistics,
  selectTenantLoadingStatistics,
  selectTenantStatisticsError,
} from "../../../store/tenantSlice";

const TenantStats = () => {
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | REDUX STATE
  |--------------------------------------------------------------------------
  */

  const statistics = useSelector(selectTenantStatistics);

  const loading = useSelector(
    selectTenantLoadingStatistics
  );

  const error = useSelector(
    selectTenantStatisticsError
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH STATISTICS ON MOUNT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    dispatch(fetchTenantStatistics());
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | SAFE NUMBER
  |--------------------------------------------------------------------------
  */

  const number = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return 0;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  };

  /*
  |--------------------------------------------------------------------------
  | STATISTICS SOURCE
  |--------------------------------------------------------------------------
  */

  const stats =
    statistics?.data ??
    statistics ??
    {};

  /*
  |--------------------------------------------------------------------------
  | GET VALUE
  |--------------------------------------------------------------------------
  */

  const getValue = (...keys) => {
    for (const key of keys) {
      const value = stats?.[key];

      if (
        value !== undefined &&
        value !== null
      ) {
        return number(value);
      }
    }

    return 0;
  };

  /*
  |--------------------------------------------------------------------------
  | KPI VALUES
  |--------------------------------------------------------------------------
  */

  const total = getValue(
    "total",
    "total_tenants",
    "tenants_count",
    "count"
  );

  const active = getValue(
    "active",
    "active_tenants",
    "active_count"
  );

  const pending = getValue(
    "pending",
    "pending_tenants",
    "pending_count"
  );

  const inactive = getValue(
    "inactive",
    "inactive_tenants",
    "inactive_count"
  );

  const blacklisted = getValue(
    "blacklisted",
    "blacklisted_tenants",
    "blacklisted_count"
  );

  const verified = getValue(
    "verified",
    "verified_tenants",
    "verified_count"
  );

  const unverified = getValue(
    "unverified",
    "unverified_tenants",
    "unverified_count"
  );

  /*
  |--------------------------------------------------------------------------
  | STAT CARDS
  |--------------------------------------------------------------------------
  */

  const cards = [
    {
      key: "total",
      title: "Total Tenants",
      value: total,
      description: "All registered tenants",
      icon: Users,
      iconWrapper: "bg-blue-50 text-blue-600",
    },
    {
      key: "active",
      title: "Active Tenants",
      value: active,
      description: "Currently active tenants",
      icon: UserCheck,
      iconWrapper: "bg-green-50 text-green-600",
    },
    {
      key: "pending",
      title: "Pending",
      value: pending,
      description: "Awaiting approval",
      icon: Clock3,
      iconWrapper: "bg-amber-50 text-amber-600",
    },
    {
      key: "inactive",
      title: "Inactive",
      value: inactive,
      description: "Inactive tenant accounts",
      icon: UserX,
      iconWrapper: "bg-gray-100 text-gray-600",
    },
    {
      key: "blacklisted",
      title: "Blacklisted",
      value: blacklisted,
      description: "Blacklisted tenants",
      icon: ShieldAlert,
      iconWrapper: "bg-red-50 text-red-600",
    },
    {
      key: "verified",
      title: "Verified",
      value: verified,
      description: "Verified tenant profiles",
      icon: CheckCircle2,
      iconWrapper: "bg-emerald-50 text-emerald-600",
    },
    {
      key: "unverified",
      title: "Unverified",
      value: unverified,
      description: "Profiles awaiting verification",
      icon: XCircle,
      iconWrapper: "bg-orange-50 text-orange-600",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | RETRY
  |--------------------------------------------------------------------------
  */

  const handleRetry = () => {
    dispatch(fetchTenantStatistics());
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading && !statistics) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-gray-200" />
              <div className="h-4 w-20 rounded bg-gray-200" />
            </div>

            <div className="mt-5 h-8 w-24 rounded bg-gray-200" />

            <div className="mt-2 h-4 w-36 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error && !statistics) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-red-800">
              Unable to load tenant statistics
            </h3>

            <p className="mt-1 text-sm text-red-700">
              {typeof error === "string"
                ? error
                : "Something went wrong while loading tenant statistics."}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Tenant Overview
          </h2>

          <p className="text-sm text-gray-500">
            Overview of tenant accounts and verification status.
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            Updating...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.key}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconWrapper}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Tenants
                </span>
              </div>

              <div className="mt-5">
                <p className="text-3xl font-bold tracking-tight text-gray-900">
                  {card.value.toLocaleString()}
                </p>

                <p className="mt-1 text-sm font-medium text-gray-700">
                  {card.title}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TenantStats;