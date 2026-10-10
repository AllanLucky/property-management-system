
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
} from "lucide-react";

/**
 * Safely convert a value to a positive integer.
 */
const toPositiveInteger = (value, fallback = 1) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0
    ? Math.floor(parsed)
    : fallback;
};

/**
 * Build a compact list of page numbers.
 */
const buildPageNumbers = (currentPage, totalPages) => {
  const current = toPositiveInteger(currentPage);
  const total = toPositiveInteger(totalPages);

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }

  if (current >= total - 3) {
    return [
      1,
      "...",
      total - 4,
      total - 3,
      total - 2,
      total - 1,
      total,
    ];
  }

  return [
    1,
    "...",
    current - 1,
    current,
    current + 1,
    "...",
    total,
  ];
};

const getPaginationValues = (pagination = {}) => {
  const currentPage = toPositiveInteger(
    pagination.current_page ??
      pagination.currentPage ??
      pagination.page,
    1,
  );

  const perPage = toPositiveInteger(
    pagination.per_page ??
      pagination.perPage ??
      pagination.limit,
    25,
  );

  const total = Math.max(
    0,
    Number(
      pagination.total ??
        pagination.total_records ??
        pagination.totalRecords ??
        pagination.count ??
        0,
    ) || 0,
  );

  const lastPage = toPositiveInteger(
    pagination.last_page ??
      pagination.lastPage ??
      pagination.total_pages ??
      pagination.totalPages,
    Math.max(1, Math.ceil(total / perPage)),
  );

  const from =
    total === 0
      ? 0
      : Number(
          pagination.from ??
            (currentPage - 1) * perPage + 1,
        );

  const to =
    total === 0
      ? 0
      : Number(
          pagination.to ??
            Math.min(currentPage * perPage, total),
        );

  return {
    currentPage: Math.min(currentPage, lastPage),
    perPage,
    total,
    lastPage,
    from: Number.isFinite(from) ? from : 0,
    to: Number.isFinite(to) ? to : 0,
  };
};

const buttonBase =
  "inline-flex items-center justify-center rounded-lg border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1";

const getButtonClass = (active = false, disabled = false) => {
  if (disabled) {
    return `${buttonBase} cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600`;
  }

  if (active) {
    return `${buttonBase} border-emerald-600 bg-emerald-600 text-white shadow-sm`;
  }

  return `${buttonBase} border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800`;
};

/**
 * PlotPagination
 *
 * Supported props:
 * - pagination: Laravel pagination metadata or a normalized pagination object
 * - currentPage: optional current page override
 * - perPage: optional page-size override
 * - total: optional total-records override
 * - onPageChange: callback receiving the selected page number
 * - onPerPageChange: callback receiving the selected page size
 * - onRefresh: optional refresh callback
 * - loading: disables pagination controls while loading
 * - perPageOptions: available page sizes
 * - showPageSize: show/hide page-size selector
 * - showRefresh: show/hide refresh button
 * - compact: use a smaller layout
 */
const PlotPagination = ({
  pagination = {},
  currentPage: currentPageProp,
  perPage: perPageProp,
  total: totalProp,
  onPageChange,
  onPerPageChange,
  onRefresh,
  loading = false,
  perPageOptions = [10, 25, 50, 100],
  showPageSize = true,
  showRefresh = false,
  compact = false,
  className = "",
}) => {
  const values = getPaginationValues(pagination);

  const currentPage = toPositiveInteger(
    currentPageProp ?? values.currentPage,
    1,
  );

  const perPage = toPositiveInteger(
    perPageProp ?? values.perPage,
    25,
  );

  const total =
    totalProp !== undefined
      ? Math.max(0, Number(totalProp) || 0)
      : values.total;

  const totalPages = Math.max(
    1,
    Math.ceil(total / perPage),
    pagination.last_page ?? pagination.lastPage ?? 1,
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const from = total === 0 ? 0 : (safeCurrentPage - 1) * perPage + 1;
  const to = total === 0 ? 0 : Math.min(safeCurrentPage * perPage, total);

  const pageNumbers = buildPageNumbers(
    safeCurrentPage,
    totalPages,
  );

  const canGoPrevious = safeCurrentPage > 1 && !loading;
  const canGoNext = safeCurrentPage < totalPages && !loading;

  const goToPage = (page) => {
    const nextPage = Number(page);

    if (
      !Number.isInteger(nextPage) ||
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === safeCurrentPage ||
      loading
    ) {
      return;
    }

    onPageChange?.(nextPage);
  };

  const handlePerPageChange = (event) => {
    const nextPerPage = Number(event.target.value);

    if (
      !Number.isInteger(nextPerPage) ||
      nextPerPage < 1 ||
      loading
    ) {
      return;
    }

    onPerPageChange?.(nextPerPage);
  };

  if (total === 0) {
    return (
      <div
        className={`flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between ${className}`}
      >
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <ChevronsLeft className="h-4 w-4" />
          </span>
          No plots found.
        </div>

        <div className="flex items-center gap-2">
          {showPageSize && (
            <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Rows</span>
              <select
                value={perPage}
                onChange={handlePerPageChange}
                disabled={loading}
                className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                aria-label="Plots per page"
              >
                {perPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading || !onRefresh}
              className={`${buttonBase} gap-2 border-gray-200 bg-white px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800`}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 ${
        compact ? "space-y-3" : "space-y-4"
      } ${className}`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {/* Results summary */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
          <span>
            Showing{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {from.toLocaleString()}
            </span>
            {" "}to{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {to.toLocaleString()}
            </span>
            {" "}of{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {total.toLocaleString()}
            </span>
            {" "}plots
          </span>

          {loading && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Loading...
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Page size */}
          {showPageSize && (
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="whitespace-nowrap">Rows per page</span>

              <select
                value={perPage}
                onChange={handlePerPageChange}
                disabled={loading}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:ring-emerald-900"
                aria-label="Plots per page"
              >
                {!perPageOptions.includes(perPage) && (
                  <option value={perPage}>{perPage}</option>
                )}

                {perPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Optional refresh */}
          {showRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading || !onRefresh}
              className={`${buttonBase} gap-2 border-gray-200 bg-white px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800`}
              title="Refresh plots"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {!compact && <span>Refresh</span>}
            </button>
          )}
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Page{" "}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {safeCurrentPage}
          </span>
          {" "}of{" "}
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {totalPages}
          </span>
        </p>

        <nav
          aria-label="Plot pagination"
          className="flex flex-wrap items-center gap-1.5"
        >
          {/* First page */}
          <button
            type="button"
            onClick={() => goToPage(1)}
            disabled={!canGoPrevious}
            className={`${getButtonClass(false, !canGoPrevious)} h-9 w-9`}
            aria-label="First page"
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          {/* Previous page */}
          <button
            type="button"
            onClick={() => goToPage(safeCurrentPage - 1)}
            disabled={!canGoPrevious}
            className={`${getButtonClass(false, !canGoPrevious)} h-9 gap-1 px-2.5`}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            {!compact && (
              <span className="hidden sm:inline">Previous</span>
            )}
          </button>

          {/* Page numbers */}
          {pageNumbers.map((page, index) =>
            page === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 min-w-8 items-center justify-center px-1 text-sm text-gray-400"
                aria-hidden="true"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => goToPage(page)}
                disabled={loading}
                aria-label={`Page ${page}`}
                aria-current={
                  page === safeCurrentPage ? "page" : undefined
                }
                className={`${getButtonClass(
                  page === safeCurrentPage,
                  loading,
                )} h-9 min-w-9 px-2.5`}
              >
                {page}
              </button>
            ),
          )}

          {/* Next page */}
          <button
            type="button"
            onClick={() => goToPage(safeCurrentPage + 1)}
            disabled={!canGoNext}
            className={`${getButtonClass(false, !canGoNext)} h-9 gap-1 px-2.5`}
            aria-label="Next page"
          >
            {!compact && (
              <span className="hidden sm:inline">Next</span>
            )}
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Last page */}
          <button
            type="button"
            onClick={() => goToPage(totalPages)}
            disabled={!canGoNext}
            className={`${getButtonClass(false, !canGoNext)} h-9 w-9`}
            aria-label="Last page"
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default PlotPagination;
