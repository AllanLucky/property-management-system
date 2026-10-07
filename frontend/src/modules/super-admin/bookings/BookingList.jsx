import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  X,
  XCircle,
} from "lucide-react";

import { useBooking } from "../../../hooks/useBooking";

import BookingTable from "./BookingTable";
import BookingStatistics from "./BookingStatistics";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

const BOOKING_ROUTES = {
  index: "/super-admin/bookings",
  create: "/super-admin/bookings/create",
  cancelled: "/super-admin/bookings/cancelled",
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
  { value: "expired", label: "Expired" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All Payment Statuses" },
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const BOOKING_TYPE_OPTIONS = [
  { value: "", label: "All Booking Types" },
  { value: "viewing", label: "Viewing" },
  { value: "reservation", label: "Reservation" },
  { value: "rental", label: "Rental" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "All Sources" },
  { value: "website", label: "Website" },
  { value: "admin", label: "Admin" },
  { value: "agent", label: "Agent" },
  { value: "mobile", label: "Mobile" },
  { value: "walk_in", label: "Walk In" },
  { value: "phone", label: "Phone" },
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

const normalizePagination = (
  pagination,
  bookingCount
) => {
  const source =
    pagination?.data ||
    pagination ||
    {};

  const perPage = getNumericValue(
    source?.per_page,
    source?.perPage,
    source?.limit,
    DEFAULT_PER_PAGE
  );

  const total = getNumericValue(
    source?.total,
    source?.total_items,
    source?.count,
    bookingCount
  );

  const currentPage = getNumericValue(
    source?.current_page,
    source?.currentPage,
    source?.page,
    1
  );

  const lastPage = getNumericValue(
    source?.last_page,
    source?.lastPage,
    source?.total_pages,
    Math.max(
      Math.ceil(
        total / Math.max(perPage, 1)
      ),
      1
    )
  );

  const from =
    total > 0
      ? (currentPage - 1) * perPage + 1
      : 0;

  const to =
    total > 0
      ? Math.min(
        currentPage * perPage,
        total
      )
      : 0;

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

const buildPaginationPages = (
  currentPage,
  lastPage
) => {
  if (lastPage <= 7) {
    return Array.from(
      { length: lastPage },
      (_, index) => index + 1
    );
  }

  const pages = [1];

  if (currentPage > 4) {
    pages.push("...");
  }

  const start = Math.max(
    2,
    currentPage - 1
  );

  const end = Math.min(
    lastPage - 1,
    currentPage + 1
  );

  for (
    let page = start;
    page <= end;
    page += 1
  ) {
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

const BookingList = () => {
  const navigate = useNavigate();

  const {
    bookings,
    pagination,
    filters,
    loading,
    error,
    statistics,
    getBookings,
    getStatistics,
    search,
    setFilters,
    clearFilters,
    setPage,
    setPerPage,
    clearError,
  } = useBooking();

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [searchValue, setSearchValue] = useState(
    filters?.search || ""
  );

  const [showFilters, setShowFilters] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Booking List
  |--------------------------------------------------------------------------
  */

  const bookingList = useMemo(
    () => getArray(bookings),
    [bookings]
  );

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const paginationData = useMemo(
    () =>
      normalizePagination(
        pagination,
        bookingList.length
      ),
    [pagination, bookingList.length]
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
      payment_status:
        filters?.payment_status ||
        filters?.paymentStatus ||
        "",
      booking_type:
        filters?.booking_type ||
        filters?.bookingType ||
        "",
      source: filters?.source || "",
    }),
    [filters]
  );

  const activeFilterCount = useMemo(() => {
    return [
      currentFilters.status,
      currentFilters.payment_status,
      currentFilters.booking_type,
      currentFilters.source,
    ].filter(Boolean).length;
  }, [currentFilters]);

  /*
  |--------------------------------------------------------------------------
  | Initial Fetch
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    getBookings?.();
    getStatistics?.();
  }, [getBookings, getStatistics]);

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const value = searchValue.trim();

    if (typeof search === "function") {
      search(value);
      return;
    }

    setFilters?.({
      ...currentFilters,
      search: value,
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

  const handleFilterChange = (
    field,
    value
  ) => {
    setFilters?.({
      ...currentFilters,
      [field]: value,
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

    await Promise.all([
      getBookings?.(),
      getStatistics?.(),
    ]);
  };

  /*
  |--------------------------------------------------------------------------
  | Cancelled Bookings Navigation
  |--------------------------------------------------------------------------
  */

  const handleViewCancelledBookings = () => {
    navigate(BOOKING_ROUTES.cancelled);
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

    setPage?.(page);
  };

  const handlePreviousPage = () => {
    handlePageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    handlePageChange(currentPage + 1);
  };

  const handlePerPageChange = (event) => {
    const value = Number(
      event.target.value
    );

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return;
    }

    setPerPage?.(value);
  };

  const paginationPages = useMemo(
    () =>
      buildPaginationPages(
        currentPage,
        lastPage
      ),
    [currentPage, lastPage]
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
              <CalendarDays className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Bookings
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Manage property bookings,
                reservations and payments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {/* ------------------------------------------------------------
              Refresh
          ------------------------------------------------------------ */}

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

          {/* ------------------------------------------------------------
              Cancelled Bookings
          ------------------------------------------------------------ */}

          <button
            type="button"
            onClick={handleViewCancelledBookings}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-100 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XCircle className="h-4 w-4" />

            <span className="hidden sm:inline">
              Cancelled Bookings
            </span>

            <span className="sm:hidden">
              Cancelled
            </span>
          </button>

          {/* ------------------------------------------------------------
              Create Booking
          ------------------------------------------------------------ */}

          <Link
            to={BOOKING_ROUTES.create}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />

            Create Booking
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
              Unable to load bookings
            </p>

            <p className="mt-0.5 text-sm text-red-700">
              {typeof error === "string"
                ? error
                : error?.message ||
                "Something went wrong while loading bookings."}
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
          BOOKING STATISTICS
      ================================================================ */}

      <BookingStatistics
        statistics={
          statistics?.data ||
          statistics ||
          {}
        }
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
                placeholder="Search booking number, customer, tenant, property..."
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
                setShowFilters(
                  (value) => !value
                )
              }
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${showFilters ||
                  activeFilterCount > 0
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

            {(activeFilterCount > 0 ||
              searchValue) && (
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
            {/* STATUS */}

            <div>
              <label
                htmlFor="booking-status"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Booking Status
              </label>

              <select
                id="booking-status"
                value={currentFilters.status}
                onChange={(event) =>
                  handleFilterChange(
                    "status",
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                {STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value ||
                        "all"
                      }
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* PAYMENT STATUS */}

            <div>
              <label
                htmlFor="booking-payment-status"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Payment Status
              </label>

              <select
                id="booking-payment-status"
                value={
                  currentFilters.payment_status
                }
                onChange={(event) =>
                  handleFilterChange(
                    "payment_status",
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                {PAYMENT_STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value ||
                        "all"
                      }
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* BOOKING TYPE */}

            <div>
              <label
                htmlFor="booking-type"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Booking Type
              </label>

              <select
                id="booking-type"
                value={
                  currentFilters.booking_type
                }
                onChange={(event) =>
                  handleFilterChange(
                    "booking_type",
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                {BOOKING_TYPE_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value ||
                        "all"
                      }
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* SOURCE */}

            <div>
              <label
                htmlFor="booking-source"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Source
              </label>

              <select
                id="booking-source"
                value={
                  currentFilters.source
                }
                onChange={(event) =>
                  handleFilterChange(
                    "source",
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                {SOURCE_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value ||
                        "all"
                      }
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================
          BOOKING TABLE
      ================================================================ */}

      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">
              Bookings
            </h2>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {total > 0
                ? `Showing ${from}–${to} of ${total} bookings`
                : "No bookings found"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <label
              htmlFor="booking-per-page"
              className="text-xs font-medium text-slate-500"
            >
              Per page
            </label>

            <select
              id="booking-per-page"
              value={perPage}
              onChange={handlePerPageChange}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="10">
                10
              </option>

              <option value="15">
                15
              </option>

              <option value="25">
                25
              </option>

              <option value="50">
                50
              </option>

              <option value="100">
                100
              </option>
            </select>
          </div>
        </div>

        {loading &&
          bookingList.length === 0 ? (
          <div className="p-4 sm:p-6">
            <div className="space-y-3">
              {Array.from({
                length: 6,
              }).map((_, index) => (
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
        ) : bookingList.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <CalendarDays className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              No bookings found
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              There are no bookings
              matching your current
              search or filters.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              {(activeFilterCount > 0 ||
                searchValue) && (
                  <button
                    type="button"
                    onClick={
                      handleClearFilters
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Clear Filters
                  </button>
                )}

              <Link
                to={BOOKING_ROUTES.create}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Create Booking
              </Link>
            </div>
          </div>
        ) : (
          <BookingTable
            bookings={bookingList}
            loading={loading}
            onView={(bookingId) =>
              navigate(
                `/super-admin/bookings/${bookingId}`
              )
            }
            onEdit={(bookingId) =>
              navigate(
                `/super-admin/bookings/${bookingId}/edit`
              )
            }
          />
        )}

        {/* ==============================================================
            PAGINATION
        ============================================================== */}

        {bookingList.length > 0 &&
          lastPage > 1 && (
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
                bookings
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={
                    handlePreviousPage
                  }
                  disabled={
                    currentPage <= 1 ||
                    loading
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />

                  <span className="hidden sm:inline">
                    Previous
                  </span>
                </button>

                <div className="flex items-center gap-1">
                  {paginationPages.map(
                    (page, index) => {
                      if (
                        page === "..."
                      ) {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="hidden h-9 w-9 items-center justify-center text-sm text-slate-400 sm:flex"
                          >
                            ...
                          </span>
                        );
                      }

                      const isCurrent =
                        page ===
                        currentPage;

                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() =>
                            handlePageChange(
                              page
                            )
                          }
                          disabled={loading}
                          className={`hidden h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition sm:flex ${isCurrent
                              ? "bg-slate-900 text-white"
                              : "text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                          {page}
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="flex h-9 min-w-16 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-semibold text-slate-600 sm:hidden">
                  {currentPage} /{" "}
                  {lastPage}
                </div>

                <button
                  type="button"
                  onClick={
                    handleNextPage
                  }
                  disabled={
                    currentPage >=
                    lastPage ||
                    loading
                  }
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

export default BookingList;