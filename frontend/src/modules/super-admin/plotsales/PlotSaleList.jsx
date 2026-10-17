import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Plus,
  FileText,
  X,
  Wallet,
} from "lucide-react";

import { usePlotSales } from "../../../hooks/usePlotSales";

import PlotSaleTable from "./PlotSaleTable";
import PlotSaleStatistics from "./PlotSaleStatistics";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

const PLOT_SALE_ROUTES = {
  index: "/super-admin/plot-sales",
  create: "/super-admin/plot-sales/create",
  outstanding: "/super-admin/plot-sales/outstanding",
  reports: "/super-admin/plot-sales/reports",
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "reserved", label: "Reserved" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.data?.data)) {
    return value.data.data;
  }

  return [];
};

const getNumericValue = (...values) => {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return 0;
};

/*
|--------------------------------------------------------------------------
| Pagination Helper
|--------------------------------------------------------------------------
*/

const normalizePagination = (pagination, saleCount) => {
  const source = pagination?.data || pagination || {};

  const perPage = Math.max(
    getNumericValue(
      source?.per_page,
      source?.perPage,
      source?.limit,
      DEFAULT_PER_PAGE,
    ),
    1,
  );

  const total = getNumericValue(
    source?.total,
    source?.total_items,
    source?.count,
    saleCount,
  );

  const currentPage = Math.max(
    getNumericValue(
      source?.current_page,
      source?.currentPage,
      source?.page,
      1,
    ),
    1,
  );

  const lastPage = Math.max(
    getNumericValue(
      source?.last_page,
      source?.lastPage,
      source?.total_pages,
      Math.ceil(total / perPage),
    ),
    1,
  );

  return {
    currentPage,
    perPage,
    total,
    lastPage,
    from: total > 0 ? (currentPage - 1) * perPage + 1 : 0,
    to: total > 0 ? Math.min(currentPage * perPage, total) : 0,
  };
};

/*
|--------------------------------------------------------------------------
| Pagination Pages
|--------------------------------------------------------------------------
*/

const buildPaginationPages = (currentPage, lastPage) => {
  if (lastPage <= 7) {
    return Array.from(
      { length: lastPage },
      (_, index) => index + 1,
    );
  }

  const pages = [1];

  if (currentPage > 4) {
    pages.push("...");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(lastPage - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < lastPage - 3) {
    pages.push("...");
  }

  pages.push(lastPage);

  return pages;
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const PlotSaleList = () => {
  const navigate = useNavigate();

  const {
    plotSales,
    pagination,
    filters,
    loading,
    error,
    statistics,
    getPlotSales,
    getPlotSalesStatistics,
    searchPlotSales,
    setFilters,
    clearFilters,
    setPage,
    setPerPage,
    clearError,
  } = usePlotSales();

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [searchValue, setSearchValue] = useState(
    filters?.search || "",
  );

  const [showFilters, setShowFilters] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Plot Sales List
  |--------------------------------------------------------------------------
  */

  const saleList = useMemo(
    () => getArray(plotSales),
    [plotSales],
  );

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const paginationData = useMemo(
    () => normalizePagination(pagination, saleList.length),
    [pagination, saleList.length],
  );

  const {
    currentPage,
    perPage,
    total,
    lastPage,
    from,
    to,
  } = paginationData;

  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  const currentFilters = useMemo(
    () => ({
      search: filters?.search || "",
      status: filters?.status || "",
      outstanding_only: filters?.outstanding_only ?? "",
      date_from: filters?.date_from || "",
      date_to: filters?.date_to || "",
    }),
    [filters],
  );

  const activeFilterCount = useMemo(
    () =>
      [
        currentFilters.status,
        currentFilters.outstanding_only,
        currentFilters.date_from,
        currentFilters.date_to,
      ].filter(
        (value) => value !== "" && value !== null && value !== undefined,
      ).length,
    [currentFilters],
  );

  /*
  |--------------------------------------------------------------------------
  | Initial Fetch
  |--------------------------------------------------------------------------
  */

  const refreshData = useCallback(async () => {
    const results = await Promise.allSettled([
      getPlotSales?.(),
      getPlotSalesStatistics?.(),
    ]);

    return results;
  }, [getPlotSales, getPlotSalesStatistics]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  /*
  |--------------------------------------------------------------------------
  | Keep Search Input Synchronized
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setSearchValue(filters?.search || "");
  }, [filters?.search]);

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const value = searchValue.trim();

    if (typeof searchPlotSales === "function") {
      searchPlotSales(value);
      return;
    }

    setFilters?.({
      ...currentFilters,
      search: value,
      page: 1,
    });
  };

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
  };

  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  const handleFilterChange = (field, value) => {
    setFilters?.({
      ...currentFilters,
      [field]: value,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setSearchValue("");
    clearFilters?.();
    setShowFilters(false);
  };

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {
    clearError?.();
    await refreshData();
  };

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const handlePageChange = (page) => {
    if (
      page < 1 ||
      page > lastPage ||
      loading ||
      page === currentPage
    ) {
      return;
    }

    setPage?.(page);
  };

  const handlePreviousPage = () => {
    handlePageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    handlePageChange(currentPage + 1);
  };

  const handlePerPageChange = (event) => {
    const value = Number(event.target.value);

    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    setPerPage?.(value);
  };

  const paginationPages = useMemo(
    () => buildPaginationPages(currentPage, lastPage),
    [currentPage, lastPage],
  );

  /*
  |--------------------------------------------------------------------------
  | Error Display
  |--------------------------------------------------------------------------
  */

  const errorMessage =
    typeof error === "string"
      ? error
      : error?.message ||
      error?.serviceMessage ||
      "Something went wrong while loading plot sales.";

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 space-y-6">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <FileText className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Plot Sales Management
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Manage plot sales, buyers, approvals, outstanding balances and transactions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {/* Refresh */}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Refresh
          </button>

          {/* Outstanding Sales */}

          <Link
            to={PLOT_SALE_ROUTES.outstanding}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100"
          >
            <Wallet className="h-4 w-4" />

            Outstanding
          </Link>

          {/* Reports */}

          <Link
            to={PLOT_SALE_ROUTES.reports}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
          >
            <FileText className="h-4 w-4" />

            Reports
          </Link>

          {/* Create Plot Sale */}

          <Link
            to={PLOT_SALE_ROUTES.create}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />

            Create Plot Sale
          </Link>
        </div>
      </div>

      {/* ================================================================
          ERROR
      ================================================================ */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Unable to load plot sales
            </p>

            <p className="mt-0.5 text-sm text-red-700">
              {errorMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={() => clearError?.()}
            className="rounded-lg p-1 text-red-500 transition hover:bg-red-100 hover:text-red-700"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ================================================================
          STATISTICS
      ================================================================ */}

      <PlotSaleStatistics
        statistics={statistics?.data || statistics || {}}
        loading={loading && !statistics}
      />

      {/* ================================================================
          SEARCH / FILTERS
      ================================================================ */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
          <form
            onSubmit={handleSearchSubmit}
            className="flex min-w-0 flex-1 gap-2"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchValue}
                onChange={handleSearchChange}
                placeholder="Search sale number, plot, buyer or agent..."
                aria-label="Search plot sales"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}

              <span className="hidden sm:inline">
                Search
              </span>
            </button>
          </form>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${showFilters || activeFilterCount > 0
                  ? "border-slate-300 bg-slate-100 text-slate-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
            >
              <Filter className="h-4 w-4" />

              Filters

              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {(activeFilterCount > 0 || searchValue) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />

                <span className="hidden sm:inline">
                  Clear
                </span>
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Status */}

            <div>
              <label
                htmlFor="plot-sale-status"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Sale Status
              </label>

              <select
                id="plot-sale-status"
                value={currentFilters.status}
                onChange={(event) =>
                  handleFilterChange("status", event.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option
                    key={option.value || "all"}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Outstanding balance */}

            <div>
              <label
                htmlFor="plot-sale-outstanding"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Payment Balance
              </label>

              <select
                id="plot-sale-outstanding"
                value={String(currentFilters.outstanding_only)}
                onChange={(event) =>
                  handleFilterChange(
                    "outstanding_only",
                    event.target.value,
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">All Sales</option>
                <option value="true">Outstanding Balance</option>
                <option value="false">No Outstanding Balance</option>
              </select>
            </div>

            {/* Start date */}

            <div>
              <label
                htmlFor="plot-sale-date-from"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Sale Date From
              </label>

              <input
                id="plot-sale-date-from"
                type="date"
                value={currentFilters.date_from}
                onChange={(event) =>
                  handleFilterChange("date_from", event.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* End date */}

            <div>
              <label
                htmlFor="plot-sale-date-to"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Sale Date To
              </label>

              <input
                id="plot-sale-date-to"
                type="date"
                min={currentFilters.date_from || undefined}
                value={currentFilters.date_to}
                onChange={(event) =>
                  handleFilterChange("date_to", event.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* ================================================================
          SALES TABLE
      ================================================================ */}

      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">
              Plot Sales
            </h2>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {total > 0
                ? `Showing ${from}–${to} of ${total} plot sales`
                : "No plot sales found"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <label
              htmlFor="plot-sale-per-page"
              className="text-xs font-medium text-slate-500"
            >
              Per page
            </label>

            <select
              id="plot-sale-per-page"
              value={perPage}
              onChange={handlePerPageChange}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              {[10, 15, 25, 50, 100].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}

        {loading && saleList.length === 0 ? (
          <div className="space-y-3 p-4 sm:p-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="grid animate-pulse grid-cols-1 gap-4 rounded-xl border border-slate-100 p-4 md:grid-cols-5"
              >
                <div className="h-4 rounded bg-slate-200" />
                <div className="h-4 rounded bg-slate-200" />
                <div className="h-4 rounded bg-slate-200" />
                <div className="h-4 rounded bg-slate-200" />
                <div className="h-4 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : saleList.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <FileText className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              No plot sales found
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              No sales match your current search or filters.
              Create a plot sale to begin tracking buyers, payments and agreements.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              {(activeFilterCount > 0 || searchValue) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear Filters
                </button>
              )}

              <Link
                to={PLOT_SALE_ROUTES.create}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Create Plot Sale
              </Link>
            </div>
          </div>
        ) : (
          <PlotSaleTable
            plotSales={saleList}
            sales={saleList}
            loading={loading}
            onView={(saleId) =>
              navigate(`/super-admin/plot-sales/${saleId}`)
            }
            onEdit={(saleId) =>
              navigate(`/super-admin/plot-sales/${saleId}/edit`)
            }
          />
        )}

        {/* ==============================================================
            PAGINATION
        ============================================================== */}

        {saleList.length > 0 && lastPage > 1 && (
          <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {from}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700">
                {to}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {total}
              </span>{" "}
              plot sales
            </div>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={currentPage <= 1 || loading}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />

                <span className="hidden sm:inline">
                  Previous
                </span>
              </button>

              <div className="hidden items-center gap-1 sm:flex">
                {paginationPages.map((page, index) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="flex h-9 w-9 items-center justify-center text-sm text-slate-400"
                      >
                        ...
                      </span>
                    );
                  }

                  const isCurrent = page === currentPage;

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => handlePageChange(page)}
                      disabled={loading}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition ${isCurrent
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <div className="flex h-9 min-w-16 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-semibold text-slate-600 sm:hidden">
                {currentPage} / {lastPage}
              </div>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= lastPage || loading}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="hidden sm:inline">
                  Next
                </span>

                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlotSaleList;
