import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DollarSign,
  Home,
  Loader2,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

import useDashboard from "../../../hooks/useDashboard";

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

const Dashboard = () => {
  /*
  |--------------------------------------------------------------------------
  | AUTH USER
  |--------------------------------------------------------------------------
  */

  const authUser = useSelector(
    (state) => state.auth?.user
  );

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD HOOK
  |--------------------------------------------------------------------------
  */

  const {
    dashboardConfig,
    user: dashboardUser,

    overview,
    properties,
    apartments,
    units,
    occupancy,
    tenancies,
    bookings,
    financials,
    maintenance,
    activity,

    meta,

    loading,
    refreshing,
    error,

    refresh,

    hasWidget,
    hasRole,
  } = useDashboard({
    autoFetch: true,
  });

  /*
  |--------------------------------------------------------------------------
  | USER NAME
  |--------------------------------------------------------------------------
  */

  const userName =
    dashboardUser?.name ||
    authUser?.name ||
    [
      dashboardUser?.first_name ||
        authUser?.first_name,
      dashboardUser?.last_name ||
        authUser?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    dashboardUser?.email ||
    authUser?.email ||
    "User";

  /*
  |--------------------------------------------------------------------------
  | CURRENCY
  |--------------------------------------------------------------------------
  */

  const currency =
    meta?.currency ||
    "KES";

  /*
  |--------------------------------------------------------------------------
  | FORMAT NUMBER
  |--------------------------------------------------------------------------
  */

  const formatNumber = (value) => {
    return new Intl.NumberFormat(
      "en-KE"
    ).format(
      Number(value || 0)
    );
  };

  /*
  |--------------------------------------------------------------------------
  | FORMAT CURRENCY
  |--------------------------------------------------------------------------
  */

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(
      "en-KE",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }
    ).format(
      Number(value || 0)
    );
  };

  /*
  |--------------------------------------------------------------------------
  | FORMAT PERCENT
  |--------------------------------------------------------------------------
  */

  const formatPercent = (value) => {
    return `${Number(
      value || 0
    ).toFixed(2)}%`;
  };

  /*
  |--------------------------------------------------------------------------
  | LAST GENERATED
  |--------------------------------------------------------------------------
  */

  const generatedAt =
    meta?.generated_at
      ? new Date(
          meta.generated_at
        )
      : null;

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    loading &&
    !dashboardConfig?.id
  ) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (
    error &&
    !dashboardConfig?.id
  ) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {error?.message ||
              "Something went wrong while loading your dashboard."}
          </p>

          <button
            type="button"
            onClick={() =>
              refresh()
            }
            disabled={refreshing}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition disabled:opacity-60"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            {refreshing
              ? "Retrying..."
              : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | STAT CARDS
  |--------------------------------------------------------------------------
  */

  const statCards = [
    {
      key: "properties",
      title: "Properties",
      value: formatNumber(
        overview?.properties
      ),
      description: `${formatNumber(
        properties?.active
      )} active`,
      secondary:
        properties?.verification_rate != null
          ? `${formatPercent(
              properties.verification_rate
            )} verified`
          : null,
      icon: Building2,
      iconClass:
        "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      href: "/super-admin/properties",
    },

    {
      key: "apartments",
      title: "Apartments",
      value: formatNumber(
        overview?.apartments
      ),
      description: `${formatNumber(
        apartments?.active
      )} active`,
      secondary:
        apartments?.active_rate != null
          ? `${formatPercent(
              apartments.active_rate
            )} active rate`
          : null,
      icon: Home,
      iconClass:
        "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
      href: "/super-admin/apartments",
    },

    {
      key: "units",
      title: "Total Units",
      value: formatNumber(
        overview?.units
      ),
      description: `${formatNumber(
        units?.vacant
      )} vacant`,
      secondary: `${formatNumber(
        units?.maintenance
      )} maintenance`,
      icon: Building2,
      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
      href: "/super-admin/units",
    },

    {
      key: "occupancy",
      title: "Occupancy Rate",
      value: formatPercent(
        overview?.occupancy_rate
      ),
      description: `${formatNumber(
        overview?.occupied_units
      )} occupied units`,
      secondary: `${formatNumber(
        overview?.vacant_units
      )} vacant`,
      icon: Activity,
      iconClass:
        "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
      href: "/super-admin/units",
    },

    {
      key: "tenancies",
      title: "Active Tenancies",
      value: formatNumber(
        overview?.active_tenancies
      ),
      description: `${formatNumber(
        tenancies?.pending
      )} pending`,
      secondary: `${formatNumber(
        tenancies?.total
      )} total`,
      icon: Users,
      iconClass:
        "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400",
      href: "/super-admin/tenancies",
    },

    {
      key: "bookings",
      title: "Bookings",
      value: formatNumber(
        overview?.bookings
      ),
      description: `${formatNumber(
        bookings?.pending
      )} pending`,
      secondary: `${formatNumber(
        bookings?.confirmed
      )} confirmed`,
      icon: CalendarCheck,
      iconClass:
        "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
      href: "/super-admin/bookings",
    },

    {
      key: "financials",
      title: "Rent Collected",
      value: formatCurrency(
        financials?.rent_collected
      ),
      description: `${formatCurrency(
        financials?.outstanding
      )} outstanding`,
      secondary:
        financials?.collection_rate != null
          ? `${formatPercent(
              financials.collection_rate
            )} collection rate`
          : null,
      icon: DollarSign,
      iconClass:
        "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      href: "/super-admin/financials",
    },

    {
      key: "maintenance",
      title: "Maintenance",
      value: formatNumber(
        overview?.maintenance_requests
      ),
      description: `${formatNumber(
        maintenance?.pending
      )} pending requests`,
      secondary: `${formatNumber(
        maintenance?.open
      )} open`,
      icon: Wrench,
      iconClass:
        "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
      href: "/super-admin/maintenance",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | RECENT ACTIVITY
  |--------------------------------------------------------------------------
  */

  const recentActivity =
    Array.isArray(activity)
      ? activity.slice(0, 5)
      : [];

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6 pb-8">

      {/* ================================================================
          HEADER
      ================================================================ */}

      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">

            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

              System Operational
            </span>

            {dashboardUser?.primary_role && (
              <>
                <span className="text-gray-300 dark:text-slate-600">
                  •
                </span>

                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {dashboardUser.primary_role}
                </span>
              </>
            )}

          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome back, {userName}
          </h1>

          <p className="mt-1 text-sm md:text-base text-gray-500 dark:text-gray-400">
            Here&apos;s an overview of your property operations.
          </p>
        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() =>
              refresh()
            }
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition disabled:opacity-60"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          {dashboardConfig?.id && (
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700">

              <ShieldCheck className="w-4 h-4 text-indigo-500" />

              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Dashboard
                </p>

                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {dashboardConfig.name}
                </p>
              </div>

            </div>
          )}

        </div>
      </header>

      {/* ================================================================
          QUICK OVERVIEW
      ================================================================ */}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {statCards
          .filter((card) =>
            hasWidget(card.key)
          )
          .map((card) => {
            const Icon =
              card.icon;

            return (
              <Link
                key={card.key}
                to={card.href}
                className="group bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >

                <div className="flex items-start justify-between">

                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.iconClass}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-indigo-500 transition" />

                </div>

                <div className="mt-4">

                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {card.title}
                  </p>

                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {card.value}
                  </h2>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {card.description}
                  </p>

                  {card.secondary && (
                    <p className="mt-1 text-xs font-medium text-indigo-500 dark:text-indigo-400">
                      {card.secondary}
                    </p>
                  )}

                </div>

              </Link>
            );
          })}

      </section>

      {/* ================================================================
          MAIN CONTENT
      ================================================================ */}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ==============================================================
            OCCUPANCY
        ============================================================== */}

        {hasWidget("occupancy") && (
          <div className="xl:col-span-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Occupancy Overview
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Current unit distribution
                </p>
              </div>

              <Link
                to="/super-admin/units"
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View units
              </Link>

            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">

              <OccupancyItem
                label="Occupied"
                value={
                  occupancy?.occupied
                }
                total={
                  occupancy?.total_units
                }
                icon={CheckCircle2}
                className="text-emerald-600"
              />

              <OccupancyItem
                label="Vacant"
                value={
                  occupancy?.vacant
                }
                total={
                  occupancy?.total_units
                }
                icon={Home}
                className="text-blue-600"
              />

              <OccupancyItem
                label="Maintenance"
                value={
                  occupancy?.maintenance
                }
                total={
                  occupancy?.total_units
                }
                icon={Wrench}
                className="text-orange-600"
              />

              <OccupancyItem
                label="Reserved"
                value={
                  occupancy?.reserved
                }
                total={
                  occupancy?.total_units
                }
                icon={Clock3}
                className="text-violet-600"
              />

            </div>

            <div className="mt-7">

              <div className="flex items-center justify-between mb-2">

                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Occupancy
                </span>

                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatPercent(
                    occupancy?.rate
                  )}
                </span>

              </div>

              <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">

                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      Number(
                        occupancy?.rate ||
                          0
                      ),
                      100
                    )}%`,
                  }}
                />

              </div>

            </div>

            {/* STATUS BREAKDOWN */}

            {occupancy?.status_breakdown
              ?.length > 0 && (
              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-700">

                <div className="flex items-center justify-between mb-3">

                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Status Breakdown
                  </p>

                  <p className="text-xs text-gray-400">
                    {formatNumber(
                      occupancy.total_units
                    )}{" "}
                    units
                  </p>

                </div>

                <div className="grid grid-cols-2 gap-3">

                  {occupancy.status_breakdown.map(
                    (item) => (
                      <div
                        key={
                          item.status
                        }
                        className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-slate-700/40 px-3 py-2"
                      >

                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {item.label ||
                            item.status}
                        </span>

                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {formatNumber(
                            item.count
                          )}
                        </span>

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

          </div>
        )}

        {/* ==============================================================
            TENANCIES
        ============================================================== */}

        {hasWidget("tenancies") && (
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Tenancies
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Current tenancy status
                </p>
              </div>

              <Users className="w-5 h-5 text-indigo-500" />

            </div>

            <div className="mt-6 space-y-4">

              <StatusRow
                label="Active"
                value={
                  tenancies?.active
                }
                total={
                  tenancies?.total
                }
                icon={CheckCircle2}
                className="text-emerald-500"
              />

              <StatusRow
                label="Pending"
                value={
                  tenancies?.pending
                }
                total={
                  tenancies?.total
                }
                icon={Clock3}
                className="text-yellow-500"
              />

              <StatusRow
                label="Expired"
                value={
                  tenancies?.expired
                }
                total={
                  tenancies?.total
                }
                icon={AlertCircle}
                className="text-orange-500"
              />

              <StatusRow
                label="Terminated"
                value={
                  tenancies?.terminated
                }
                total={
                  tenancies?.total
                }
                icon={ArrowDownRight}
                className="text-red-500"
              />

              <StatusRow
                label="Cancelled"
                value={
                  tenancies?.cancelled
                }
                total={
                  tenancies?.total
                }
                icon={AlertCircle}
                className="text-gray-500"
              />

            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-700">

              <div className="flex items-center justify-between">

                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Active rate
                </span>

                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {formatPercent(
                    tenancies?.active_rate
                  )}
                </span>

              </div>

            </div>

            <Link
              to="/super-admin/tenancies"
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Manage tenancies

              <ChevronRight className="w-4 h-4" />
            </Link>

          </div>
        )}

      </section>

      {/* ================================================================
          FINANCIAL + BOOKINGS + MAINTENANCE
      ================================================================ */}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ==============================================================
            FINANCIALS
        ============================================================== */}

        {hasWidget("financials") && (
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Financial Overview
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Current financial position
                </p>
              </div>

              <DollarSign className="w-5 h-5 text-emerald-500" />

            </div>

            <div className="mt-6 space-y-4">

              <MoneyRow
                label="Rent Collected"
                value={
                  financials?.rent_collected
                }
                icon={ArrowUpRight}
                positive
              />

              <MoneyRow
                label="Rent Due"
                value={
                  financials?.rent_due
                }
                icon={Clock3}
              />

              <MoneyRow
                label="Outstanding"
                value={
                  financials?.outstanding
                }
                icon={AlertCircle}
              />

              <MoneyRow
                label="Expenses"
                value={
                  financials?.expenses
                }
                icon={ArrowDownRight}
              />

              <div className="pt-4 border-t border-gray-100 dark:border-slate-700">

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Net Income
                </p>

                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(
                    financials?.net_income
                  )}
                </p>

              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">

                <MiniStat
                  label="Collection Rate"
                  value={formatPercent(
                    financials?.collection_rate
                  )}
                  text
                />

                <MiniStat
                  label="Net Margin"
                  value={formatPercent(
                    financials?.net_margin
                  )}
                  text
                />

              </div>

            </div>

          </div>
        )}

        {/* ==============================================================
            BOOKINGS
        ============================================================== */}

        {hasWidget("bookings") && (
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Bookings
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Booking pipeline
                </p>
              </div>

              <CalendarCheck className="w-5 h-5 text-pink-500" />

            </div>

            <div className="mt-6 space-y-4">

              <StatusRow
                label="Pending"
                value={
                  bookings?.pending
                }
                total={
                  bookings?.total
                }
                icon={Clock3}
                className="text-yellow-500"
              />

              <StatusRow
                label="Confirmed"
                value={
                  bookings?.confirmed
                }
                total={
                  bookings?.total
                }
                icon={CheckCircle2}
                className="text-blue-500"
              />

              <StatusRow
                label="Completed"
                value={
                  bookings?.completed
                }
                total={
                  bookings?.total
                }
                icon={CheckCircle2}
                className="text-emerald-500"
              />

              <StatusRow
                label="Cancelled"
                value={
                  bookings?.cancelled
                }
                total={
                  bookings?.total
                }
                icon={AlertCircle}
                className="text-red-500"
              />

              <StatusRow
                label="Rejected"
                value={
                  bookings?.rejected
                }
                total={
                  bookings?.total
                }
                icon={AlertCircle}
                className="text-gray-500"
              />

              <StatusRow
                label="Expired"
                value={
                  bookings?.expired
                }
                total={
                  bookings?.total
                }
                icon={Clock3}
                className="text-orange-500"
              />

            </div>

            <Link
              to="/super-admin/bookings"
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Manage bookings

              <ChevronRight className="w-4 h-4" />
            </Link>

          </div>
        )}

        {/* ==============================================================
            MAINTENANCE
        ============================================================== */}

        {hasWidget("maintenance") && (
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Maintenance
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Maintenance request status
                </p>
              </div>

              <Wrench className="w-5 h-5 text-orange-500" />

            </div>

            <div className="mt-6">

              <div className="flex items-end justify-between">

                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(
                      maintenance?.total
                    )}
                  </p>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Total requests
                  </p>
                </div>

                <div className="text-right">

                  <p className="text-lg font-semibold text-orange-500">
                    {formatNumber(
                      maintenance?.pending
                    )}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pending
                  </p>

                </div>

              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">

                <MiniStat
                  label="In Progress"
                  value={
                    maintenance?.in_progress
                  }
                />

                <MiniStat
                  label="Completed"
                  value={
                    maintenance?.completed
                  }
                />

                <MiniStat
                  label="Open"
                  value={
                    maintenance?.open
                  }
                />

                <MiniStat
                  label="Completion"
                  value={formatPercent(
                    maintenance?.completion_rate
                  )}
                  text
                />

              </div>

              <Link
                to="/super-admin/maintenance"
                className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View maintenance

                <ChevronRight className="w-4 h-4" />
              </Link>

            </div>

          </div>
        )}

      </section>

      {/* ================================================================
          ACTIVITY
      ================================================================ */}

      {hasWidget("activity") && (
        <section className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm">

          <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Latest activity across your system
              </p>
            </div>

            <Activity className="w-5 h-5 text-indigo-500" />

          </div>

          <div className="p-5">

            {recentActivity.length > 0 ? (
              <div className="space-y-4">

                {recentActivity.map(
                  (item, index) => (
                    <div
                      key={
                        item?.id ||
                        item?.uuid ||
                        index
                      }
                      className="flex items-start gap-3"
                    >

                      <div className="w-9 h-9 shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-indigo-500" />
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {item?.description ||
                            item?.message ||
                            "System activity recorded."}
                        </p>

                        {item?.created_at && (
                          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {formatActivityDate(
                              item.created_at
                            )}
                          </p>
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>
            ) : (
              <div className="py-8 text-center">

                <div className="mx-auto w-11 h-11 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-gray-400" />
                </div>

                <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  No recent activity
                </p>

                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  New system activity will appear here.
                </p>

              </div>
            )}

          </div>

        </section>
      )}

      {/* ================================================================
          QUICK ACTIONS
      ================================================================ */}

      <section className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">

        <div className="flex items-center gap-2 mb-5">

          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h2>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Frequently used management tools
            </p>
          </div>

        </div>

        <div className="flex flex-wrap gap-3">

          <QuickAction
            to="/super-admin/users/create"
            label="Create User"
          />

          <QuickAction
            to="/super-admin/properties/create"
            label="Add Property"
          />

          <QuickAction
            to="/super-admin/apartments/create"
            label="Add Apartment"
          />

          <QuickAction
            to="/super-admin/units/create"
            label="Add Unit"
          />

          <QuickAction
            to="/super-admin/roles"
            label="Manage Roles"
          />

          <QuickAction
            to="/super-admin/reports"
            label="View Reports"
          />

        </div>

      </section>

      {/* ================================================================
          DASHBOARD INFO
      ================================================================ */}

      <section className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/70 dark:bg-indigo-900/10 p-4">

        <div className="flex items-start gap-3">

          <ShieldCheck className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />

          <div className="flex-1">

            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
              Dashboard overview
            </p>

            <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
              Your dashboard is displaying live statistics from the property management system.
            </p>

            {generatedAt && (
              <p className="mt-2 text-xs text-indigo-600/70 dark:text-indigo-400/70">
                Last updated:{" "}
                {generatedAt.toLocaleString(
                  "en-KE"
                )}
              </p>
            )}

          </div>

        </div>

      </section>

    </div>
  );
};

/*
|--------------------------------------------------------------------------
| OCCUPANCY ITEM
|--------------------------------------------------------------------------
*/

const OccupancyItem = ({
  label,
  value,
  total,
  icon: Icon,
  className,
}) => {
  const numericValue =
    Number(value || 0);

  const numericTotal =
    Number(total || 0);

  const percentage =
    numericTotal > 0
      ? Math.round(
          (numericValue /
            numericTotal) *
            100
        )
      : 0;

  return (
    <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/40">

      <div className="flex items-center justify-between">

        <Icon
          className={`w-5 h-5 ${className}`}
        />

        <span className="text-xs font-medium text-gray-400">
          {percentage}%
        </span>

      </div>

      <p className="mt-3 text-xl font-bold text-gray-900 dark:text-white">
        {numericValue.toLocaleString(
          "en-KE"
        )}
      </p>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {label}
      </p>

    </div>
  );
};

/*
|--------------------------------------------------------------------------
| STATUS ROW
|--------------------------------------------------------------------------
*/

const StatusRow = ({
  label,
  value,
  total,
  icon: Icon,
  className,
}) => {
  const numericValue =
    Number(value || 0);

  const numericTotal =
    Number(total || 0);

  const percentage =
    numericTotal > 0
      ? Math.round(
          (numericValue /
            numericTotal) *
            100
        )
      : 0;

  return (
    <div>

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2">

          <Icon
            className={`w-4 h-4 ${className}`}
          />

          <span className="text-sm text-gray-600 dark:text-gray-300">
            {label}
          </span>

        </div>

        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {numericValue.toLocaleString(
            "en-KE"
          )}
        </span>

      </div>

      <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">

        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
          style={{
            width: `${Math.min(
              percentage,
              100
            )}%`,
          }}
        />

      </div>

    </div>
  );
};

/*
|--------------------------------------------------------------------------
| MONEY ROW
|--------------------------------------------------------------------------
*/

const MoneyRow = ({
  label,
  value,
  icon: Icon,
  positive = false,
}) => {
  const amount =
    Number(value || 0);

  return (
    <div className="flex items-center justify-between">

      <div className="flex items-center gap-2">

        <Icon
          className={`w-4 h-4 ${
            positive
              ? "text-emerald-500"
              : "text-gray-400"
          }`}
        />

        <span className="text-sm text-gray-600 dark:text-gray-300">
          {label}
        </span>

      </div>

      <span className="text-sm font-semibold text-gray-900 dark:text-white">
        KES{" "}
        {amount.toLocaleString(
          "en-KE"
        )}
      </span>

    </div>
  );
};

/*
|--------------------------------------------------------------------------
| MINI STAT
|--------------------------------------------------------------------------
*/

const MiniStat = ({
  label,
  value,
  text = false,
}) => {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-slate-700/40 p-3">

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
        {text
          ? value
          : Number(
              value || 0
            ).toLocaleString(
              "en-KE"
            )}
      </p>

    </div>
  );
};

/*
|--------------------------------------------------------------------------
| QUICK ACTION
|--------------------------------------------------------------------------
*/

const QuickAction = ({
  to,
  label,
}) => {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:border-indigo-800 dark:hover:text-indigo-400 transition"
    >
      {label}

      <ChevronRight className="w-4 h-4" />
    </Link>
  );
};

/*
|--------------------------------------------------------------------------
| ACTIVITY DATE
|--------------------------------------------------------------------------
*/

const formatActivityDate = (
  value
) => {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleString(
    "en-KE"
  );
};

export default Dashboard;