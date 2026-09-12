
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";

import { useTenant } from "../../../hooks/useTenant";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const INITIAL_FILTERS = {
  start_date: "",
  end_date: "",
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value) => {
  return toNumber(value).toLocaleString();
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/*
|--------------------------------------------------------------------------
| Small UI Components
|--------------------------------------------------------------------------
*/

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconClassName = "",
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {formatNumber(value)}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const SectionCard = ({ title, description, children, action }) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>

        {action}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
};

const ProgressRow = ({ label, value, total, icon: Icon }) => {
  const safeValue = toNumber(value);
  const safeTotal = toNumber(total);

  const percentage =
    safeTotal > 0
      ? Math.min(100, Math.max(0, (safeValue / safeTotal) * 100))
      : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && (
            <Icon className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
          )}

          <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </span>
        </div>

        <span className="shrink-0 text-sm font-semibold text-slate-900 dark:text-white">
          {formatNumber(safeValue)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-slate-900 transition-all duration-500 dark:bg-white"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-400">
        <span>{percentage.toFixed(1)}%</span>
        <span>{formatNumber(safeTotal)} total</span>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Main Page
|--------------------------------------------------------------------------
*/

const TenantReports = () => {
  const {
    reports,
    loadingReports,
    reportsError,
    getReports,
  } = useTenant();

  const [filters, setFilters] = useState(INITIAL_FILTERS);

  /*
  |--------------------------------------------------------------------------
  | Fetch Reports
  |--------------------------------------------------------------------------
  */

  const loadReports = useCallback(
    async (customFilters = filters) => {
      try {
        await getReports(customFilters);
      } catch (error) {
        console.error("Failed to load tenant reports:", error);
      }
    },
    [filters, getReports]
  );

  useEffect(() => {
    loadReports();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Report Data
  |--------------------------------------------------------------------------
  */

  const summary = reports?.summary ?? {};

  const statusBreakdown = reports?.status_breakdown ?? {};

  const verificationBreakdown =
    reports?.verification_breakdown ?? {};

  const tenancyBreakdown =
    reports?.tenancy_breakdown ?? {};

  const registration = reports?.registration ?? {};

  const period = reports?.period ?? {};

  /*
  |--------------------------------------------------------------------------
  | Derived Values
  |--------------------------------------------------------------------------
  */

  const statusTotal = useMemo(() => {
    return (
      toNumber(statusBreakdown.active) +
      toNumber(statusBreakdown.inactive) +
      toNumber(statusBreakdown.pending) +
      toNumber(statusBreakdown.blacklisted)
    );
  }, [statusBreakdown]);

  const verificationTotal = useMemo(() => {
    return (
      toNumber(verificationBreakdown.verified) +
      toNumber(verificationBreakdown.unverified)
    );
  }, [verificationBreakdown]);

  const tenancyTotal = useMemo(() => {
    return (
      toNumber(tenancyBreakdown.with_active_tenancy) +
      toNumber(tenancyBreakdown.without_active_tenancy)
    );
  }, [tenancyBreakdown]);

  /*
  |--------------------------------------------------------------------------
  | Handlers
  |--------------------------------------------------------------------------
  */

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleApplyFilters = async (event) => {
    event.preventDefault();

    await loadReports(filters);
  };

  const handleResetFilters = async () => {
    setFilters(INITIAL_FILTERS);

    await loadReports(INITIAL_FILTERS);
  };

  const handleRefresh = async () => {
    await loadReports(filters);
  };

  /*
  |--------------------------------------------------------------------------
  | Export / Print
  |--------------------------------------------------------------------------
  */

  const handlePrint = () => {
    window.print();
  };

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loadingReports && !reports) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Loader2 className="h-6 w-6 animate-spin text-slate-700 dark:text-slate-200" />
          </div>

          <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
            Loading tenant report
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Preparing the latest tenant statistics...
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error State
  |--------------------------------------------------------------------------
  */

  if (reportsError && !reports) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-red-900 dark:text-red-200">
                  Unable to load tenant report
                </h2>

                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {reportsError}
                </p>

                <button
                  type="button"
                  onClick={handleRefresh}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Page
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* --------------------------------------------------------------- */}
        {/* Header                                                          */}
        {/* --------------------------------------------------------------- */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
                <BarChart3 className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Tenant Reports
                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Monitor tenant registration, status, verification and
                  tenancy activity.
                </p>
              </div>
            </div>

            {reports?.generated_at && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Clock3 className="h-3.5 w-3.5" />
                Generated {formatDateTime(reports.generated_at)}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loadingReports}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loadingReports ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <Download className="h-4 w-4" />
              Print Report
            </button>
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* Filters                                                         */}
        {/* --------------------------------------------------------------- */}

        <SectionCard
          title="Report Filters"
          description="Filter tenant registration and activity statistics by date."
        >
          <form
            onSubmit={handleApplyFilters}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto_auto]"
          >
            <div>
              <label
                htmlFor="start_date"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Start date
              </label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="end_date"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                End date
              </label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingReports}
              className="inline-flex h-[42px] items-center justify-center gap-2 self-end rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {loadingReports ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}

              Generate
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              disabled={loadingReports}
              className="inline-flex h-[42px] items-center justify-center gap-2 self-end rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Reset
            </button>
          </form>

          {(period.start_date || period.end_date) && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Report period:
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {formatDate(period.start_date)}
              </span>

              <span className="text-slate-400">to</span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {formatDate(period.end_date)}
              </span>
            </div>
          )}
        </SectionCard>

        {/* --------------------------------------------------------------- */}
        {/* Error Banner                                                     */}
        {/* --------------------------------------------------------------- */}

        {reportsError && reports && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />

              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {reportsError}
              </p>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------- */}
        {/* Summary Cards                                                    */}
        {/* --------------------------------------------------------------- */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Tenants"
            value={summary.total}
            description="All tenant profiles"
            icon={Users}
            iconClassName="text-slate-700 dark:text-slate-200"
          />

          <StatCard
            title="Active Tenants"
            value={summary.active}
            description="Currently active"
            icon={UserCheck}
            iconClassName="text-emerald-600 dark:text-emerald-400"
          />

          <StatCard
            title="Pending Tenants"
            value={summary.pending}
            description="Awaiting activation"
            icon={Clock3}
            iconClassName="text-amber-600 dark:text-amber-400"
          />

          <StatCard
            title="Verified Tenants"
            value={summary.verified}
            description="Verified profiles"
            icon={ShieldCheck}
            iconClassName="text-blue-600 dark:text-blue-400"
          />
        </div>

        {/* --------------------------------------------------------------- */}
        {/* Secondary Summary                                                 */}
        {/* --------------------------------------------------------------- */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Inactive"
            value={summary.inactive}
            description="Inactive profiles"
            icon={UserX}
            iconClassName="text-slate-500 dark:text-slate-400"
          />

          <StatCard
            title="Blacklisted"
            value={summary.blacklisted}
            description="Blacklisted profiles"
            icon={XCircle}
            iconClassName="text-red-600 dark:text-red-400"
          />

          <StatCard
            title="Active Tenancies"
            value={summary.with_active_tenancy}
            description="Tenants with active tenancy"
            icon={FileText}
            iconClassName="text-indigo-600 dark:text-indigo-400"
          />

          <StatCard
            title="Without Tenancy"
            value={summary.without_active_tenancy}
            description="No active tenancy"
            icon={AlertCircle}
            iconClassName="text-orange-600 dark:text-orange-400"
          />
        </div>

        {/* --------------------------------------------------------------- */}
        {/* Charts / Breakdown                                                */}
        {/* --------------------------------------------------------------- */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Tenant Status */}

          <SectionCard
            title="Tenant Status"
            description="Current distribution of tenant profiles."
          >
            <div className="space-y-6">
              <ProgressRow
                label="Active"
                value={statusBreakdown.active}
                total={statusTotal}
                icon={CheckCircle2}
              />

              <ProgressRow
                label="Inactive"
                value={statusBreakdown.inactive}
                total={statusTotal}
                icon={UserX}
              />

              <ProgressRow
                label="Pending"
                value={statusBreakdown.pending}
                total={statusTotal}
                icon={Clock3}
              />

              <ProgressRow
                label="Blacklisted"
                value={statusBreakdown.blacklisted}
                total={statusTotal}
                icon={XCircle}
              />
            </div>
          </SectionCard>

          {/* Verification */}

          <SectionCard
            title="Verification Overview"
            description="Tenant identity verification distribution."
          >
            <div className="space-y-6">
              <ProgressRow
                label="Verified"
                value={verificationBreakdown.verified}
                total={verificationTotal}
                icon={ShieldCheck}
              />

              <ProgressRow
                label="Unverified"
                value={verificationBreakdown.unverified}
                total={verificationTotal}
                icon={AlertCircle}
              />

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Verified Rate
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {verificationTotal > 0
                      ? (
                          (toNumber(
                            verificationBreakdown.verified
                          ) /
                            verificationTotal) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Unverified Rate
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {verificationTotal > 0
                      ? (
                          (toNumber(
                            verificationBreakdown.unverified
                          ) /
                            verificationTotal) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Tenancy */}

          <SectionCard
            title="Tenancy Assignment"
            description="Tenant profiles according to active tenancy assignment."
          >
            <div className="space-y-6">
              <ProgressRow
                label="With Active Tenancy"
                value={tenancyBreakdown.with_active_tenancy}
                total={tenancyTotal}
                icon={FileText}
              />

              <ProgressRow
                label="Without Active Tenancy"
                value={tenancyBreakdown.without_active_tenancy}
                total={tenancyTotal}
                icon={AlertCircle}
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Tenancy Coverage
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Percentage of tenants currently assigned to an
                      active tenancy.
                    </p>
                  </div>

                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {tenancyTotal > 0
                      ? (
                          (toNumber(
                            tenancyBreakdown.with_active_tenancy
                          ) /
                            tenancyTotal) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Registration */}

          <SectionCard
            title="Registration Overview"
            description="Tenant registration activity across key periods."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Total Registrations
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatNumber(registration.total)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Active
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatNumber(registration.active)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Pending
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {formatNumber(registration.pending)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Today
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatNumber(registration.today)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  This Month
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatNumber(registration.this_month)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  This Year
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatNumber(registration.this_year)}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* Registration Highlight                                           */}
        {/* --------------------------------------------------------------- */}

        <SectionCard
          title="Registration Activity"
          description="Quick comparison of tenant registrations across time periods."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Today
                </span>

                <CalendarDays className="h-5 w-5 text-slate-400" />
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                {formatNumber(registration.today)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  This Month
                </span>

                <BarChart3 className="h-5 w-5 text-slate-400" />
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                {formatNumber(registration.this_month)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  This Year
                </span>

                <Users className="h-5 w-5 text-slate-400" />
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                {formatNumber(registration.this_year)}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* --------------------------------------------------------------- */}
        {/* Footer Information                                               */}
        {/* --------------------------------------------------------------- */}

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Tenant report generated from the current EstateKenya tenant
            records.
          </p>

          <p>
            Period:{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {period.start_date
                ? formatDate(period.start_date)
                : "All time"}
              {" — "}
              {period.end_date
                ? formatDate(period.end_date)
                : "Present"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenantReports;

