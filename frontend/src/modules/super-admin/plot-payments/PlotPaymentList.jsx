
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Plus,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  Wallet,
  X,
} from "lucide-react";

import usePlotPayments from "../../../hooks/usePlotPayments";

import PlotPaymentTable from "./PlotPaymentTable";
import PlotPaymentStatistics from "./PlotPaymentStatistics";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

const PAYMENT_ROUTES = {
  index: "/super-admin/plot-payments",
  create: "/super-admin/plot-payments/create",
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: "", label: "All Payment Types" },
  { value: "deposit", label: "Deposit" },
  { value: "installment", label: "Installment" },
  { value: "balance", label: "Balance" },
  { value: "full_payment", label: "Full Payment" },
  { value: "other", label: "Other" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "All Payment Methods" },
  { value: "mpesa", label: "M-Pesa" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online" },
  { value: "other", label: "Other" },
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

const normalizePagination = (pagination, paymentCount) => {
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
    paymentCount,
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

  const from = total > 0 ? (currentPage - 1) * perPage + 1 : 0;

  const to = total > 0 ? Math.min(currentPage * perPage, total) : 0;

  return {
    currentPage,
    perPage,
    total,
    lastPage,
    from,
    to,
  };
};

/*
|--------------------------------------------------------------------------
| Pagination Pages
|--------------------------------------------------------------------------
*/

const buildPaginationPages = (currentPage, lastPage) => {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
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

const PlotPaymentList = () => {
  const navigate = useNavigate();

  const {
    payments,
    pagination,
    filters,
    loading,
    statistics,
    error,

    getPlotPayments,
    getPlotPaymentsStatistics,

    searchPlotPayments,
    setFilters,
    resetFilters,

    goToPage,
    changePerPage,

    clearError,
  } = usePlotPayments({
    autoFetch: false,
    perPage: DEFAULT_PER_PAGE,
  });

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
  | Payment List
  |--------------------------------------------------------------------------
  */

  const paymentList = useMemo(
    () => getArray(payments),
    [payments],
  );

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const paginationData = useMemo(
    () => normalizePagination(pagination, paymentList.length),
    [pagination, paymentList.length],
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
      payment_type: filters?.payment_type || "",
      payment_method: filters?.payment_method || "",
      start_date: filters?.start_date || "",
      end_date: filters?.end_date || "",
    }),
    [filters],
  );

  const activeFilterCount = useMemo(
    () =>
      [
        currentFilters.status,
        currentFilters.payment_type,
        currentFilters.payment_method,
        currentFilters.start_date,
        currentFilters.end_date,
      ].filter(Boolean).length,
    [currentFilters],
  );

  /*
  |--------------------------------------------------------------------------
  | Initial Fetch
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    getPlotPayments?.();
    getPlotPaymentsStatistics?.();
  }, [getPlotPayments, getPlotPaymentsStatistics]);

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const value = searchValue.trim();

    if (typeof searchPlotPayments === "function") {
      searchPlotPayments(value);
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
    resetFilters?.();
    setShowFilters(false);
  };

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {
    clearError?.();

    await Promise.all([
      Promise.resolve(getPlotPayments?.()),
      Promise.resolve(getPlotPaymentsStatistics?.()),
    ]);
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
      loading
    ) {
      return;
    }

    goToPage?.(page);
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

    changePerPage?.(value);
  };

  const paginationPages = useMemo(
    () => buildPaginationPages(currentPage, lastPage),
    [currentPage, lastPage],
  );

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
              <Wallet className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Plot Payment Management
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Manage plot payments, deposits, installments, balances and receipts.
              </p>
            </div>

          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">

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

          {/* Create Payment */}

          <Link
            to={PAYMENT_ROUTES.create}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />

            Record Payment
          </Link>

        </div>
      </div>

      {/* ================================================================
          ERROR
      ================================================================ */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">

          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Unable to load plot payments
            </p>

            <p className="mt-0.5 text-sm text-red-700">
              {typeof error === "string"
                ? error
                : error?.message ||
                "Something went wrong while loading plot payments."}
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
          PAYMENT STATISTICS
      ================================================================ */}

      <PlotPaymentStatistics
        statistics={statistics?.data || statistics || {}}
        loading={loading && !statistics}
      />

      {/* ================================================================
          SEARCH + FILTERS
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
                placeholder="Search payment number, receipt, buyer, plot..."
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
              onClick={() =>
                setShowFilters((value) => !value)
              }
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

        {/* Filter Fields */}

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-5">

            {/* STATUS */}

            <div>
              <label
                htmlFor="payment-status"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Payment Status
              </label>

              <select
                id="payment-status"
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

            {/* PAYMENT TYPE */}

            <div>
              <label
                htmlFor="payment-type"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Payment Type
              </label>

              <select
                id="payment-type"
                value={currentFilters.payment_type}
                onChange={(event) =>
                  handleFilterChange("payment_type", event.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                {PAYMENT_TYPE_OPTIONS.map((option) => (
                  <option
                    key={option.value || "all"}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* PAYMENT METHOD */}

            <div>
              <label
                htmlFor="payment-method"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Payment Method
              </label>

              <select
                id="payment-method"
                value={currentFilters.payment_method}
                onChange={(event) =>
                  handleFilterChange("payment_method", event.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option
                    key={option.value || "all"}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* START DATE */}

            <div>
              <label
                htmlFor="payment-start-date"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Start Date
              </label>

              <input
                id="payment-start-date"
                type="date"
                value={currentFilters.start_date}
                onChange={(event) =>
                  handleFilterChange("start_date", event.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* END DATE */}

            <div>
              <label
                htmlFor="payment-end-date"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                End Date
              </label>

              <input
                id="payment-end-date"
                type="date"
                min={currentFilters.start_date || undefined}
                value={currentFilters.end_date}
                onChange={(event) =>
                  handleFilterChange("end_date", event.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

          </div>
        )}

      </div>

      {/* ================================================================
          PAYMENT TABLE
      ================================================================ */}

      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">
              Plot Payments
            </h2>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {total > 0
                ? `Showing ${from}–${to} of ${total} payments`
                : "No payments found"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">

            <label
              htmlFor="payment-per-page"
              className="text-xs font-medium text-slate-500"
            >
              Per page
            </label>

            <select
              id="payment-per-page"
              value={perPage}
              onChange={handlePerPageChange}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>

          </div>

        </div>

        {/* Loading */}

        {loading && paymentList.length === 0 ? (
          <div className="p-4 sm:p-6">

            <div className="space-y-3">
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

          </div>
        ) : paymentList.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Receipt className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              No plot payments found
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              There are no payments matching your current search or filters.
              Record a payment to start tracking plot sale transactions.
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
                to={PAYMENT_ROUTES.create}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Record Payment
              </Link>

            </div>

          </div>
        ) : (
          <PlotPaymentTable
            payments={paymentList}
            loading={loading}
            onView={(paymentId) =>
              navigate(`/super-admin/plot-payments/${paymentId}`)
            }
            onEdit={(paymentId) =>
              navigate(`/super-admin/plot-payments/${paymentId}/edit`)
            }
            onDelete={(paymentId) =>
              navigate(`/super-admin/plot-payments/${paymentId}/delete`)
            }
          />
        )}

        {/* ==============================================================
            PAGINATION
        ============================================================== */}

        {paymentList.length > 0 && lastPage > 1 && (
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
              payments
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

              <div className="flex items-center gap-1">

                {paginationPages.map((page, index) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="hidden h-9 w-9 items-center justify-center text-sm text-slate-400 sm:flex"
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
                      className={`hidden h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition sm:flex ${isCurrent
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

export default PlotPaymentList;
