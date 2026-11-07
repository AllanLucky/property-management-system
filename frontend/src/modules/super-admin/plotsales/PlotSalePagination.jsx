import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LoaderCircle,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_PAGE_SIZES = [10, 15, 25, 50, 100];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const toPositiveInteger = (value, fallback = 1) => {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : fallback;
};

const toNonNegativeInteger = (value, fallback = 0) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0
    ? Math.floor(parsed)
    : fallback;
};

/*
|--------------------------------------------------------------------------
| Plot Sale Pagination
|--------------------------------------------------------------------------
|
| Supports:
| - Laravel pagination metadata
| - Previous / next navigation
| - First / last page navigation
| - Page-size selection
| - Responsive layout
| - Loading and empty states
|
*/

export default function PlotSalePagination({
  pagination = {},
  meta = {},
  currentPage,
  perPage,
  total,
  lastPage,
  from,
  to,
  onPageChange,
  onPerPageChange,
  onChange,
  loading = false,
  pageSizes = DEFAULT_PAGE_SIZES,
  showPageSize = true,
  showPageNumbers = true,
  showSummary = true,
  className = "",
}) {
  /*
  |--------------------------------------------------------------------------
  | Normalize Pagination Metadata
  |--------------------------------------------------------------------------
  */

  const source =
    pagination && Object.keys(pagination).length > 0
      ? pagination
      : meta;

  const page = toPositiveInteger(
    currentPage ?? source.current_page ?? source.currentPage,
    1,
  );

  const pageSize = toPositiveInteger(
    perPage ?? source.per_page ?? source.perPage,
    15,
  );

  const totalRecords = toNonNegativeInteger(
    total ?? source.total,
    0,
  );

  const calculatedLastPage = Math.max(
    1,
    Math.ceil(totalRecords / pageSize),
  );

  const pages = toPositiveInteger(
    lastPage ?? source.last_page ?? source.lastPage,
    calculatedLastPage,
  );

  const startRecord =
    from !== undefined
      ? toNonNegativeInteger(from)
      : source.from != null
        ? toNonNegativeInteger(source.from)
        : totalRecords === 0
          ? 0
          : (page - 1) * pageSize + 1;

  const endRecord =
    to !== undefined
      ? toNonNegativeInteger(to)
      : source.to != null
        ? toNonNegativeInteger(source.to)
        : Math.min(page * pageSize, totalRecords);

  const isFirstPage = page <= 1;
  const isLastPage = page >= pages;
  const isEmpty = totalRecords === 0;

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const changePage = (nextPage) => {
    const normalizedPage = toPositiveInteger(nextPage, 1);
    const targetPage = Math.min(normalizedPage, pages);

    if (
      loading ||
      targetPage === page ||
      targetPage < 1
    ) {
      return;
    }

    if (typeof onPageChange === "function") {
      onPageChange(targetPage);
      return;
    }

    if (typeof onChange === "function") {
      onChange({
        page: targetPage,
        perPage: pageSize,
      });
    }
  };

  const changePageSize = (value) => {
    const nextPageSize = toPositiveInteger(value, pageSize);

    if (loading || nextPageSize === pageSize) {
      return;
    }

    if (typeof onPerPageChange === "function") {
      onPerPageChange(nextPageSize);
      return;
    }

    if (typeof onChange === "function") {
      onChange({
        page: 1,
        perPage: nextPageSize,
      });
      return;
    }

    if (typeof onPageChange === "function") {
      onPageChange(1);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Visible Page Numbers
  |--------------------------------------------------------------------------
  */

  const getVisiblePages = () => {
    const maxVisiblePages = 5;
    const half = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, page - half);
    let end = Math.min(pages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return Array.from(
      { length: Math.max(0, end - start + 1) },
      (_, index) => start + index,
    );
  };

  const visiblePages = getVisiblePages();

  /*
  |--------------------------------------------------------------------------
  | Button Styles
  |--------------------------------------------------------------------------
  */

  const navigationButtonClass = (disabled) =>
    [
      "inline-flex h-9 w-9 items-center justify-center rounded-lg",
      "border border-gray-200 bg-white text-gray-600",
      "transition-colors duration-200",
      "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
      disabled
        ? "cursor-not-allowed opacity-40"
        : "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:border-blue-700 dark:hover:bg-blue-950 dark:hover:text-blue-300",
    ].join(" ");

  const pageButtonClass = (active) =>
    [
      "inline-flex h-9 min-w-9 items-center justify-center rounded-lg",
      "px-2 text-sm font-semibold transition-colors duration-200",
      active
        ? "border border-blue-600 bg-blue-600 text-white shadow-sm"
        : "border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
    ].join(" ");

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className={[
        "w-full border-t border-gray-200 bg-white px-4 py-4",
        "dark:border-gray-700 dark:bg-gray-900",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Summary and page size */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {showSummary && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {loading ? (
                <LoaderCircle
                  size={16}
                  className="animate-spin text-blue-600"
                  aria-hidden="true"
                />
              ) : null}

              <span>
                {isEmpty ? (
                  "No plot sales found"
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {startRecord.toLocaleString()}
                    </span>
                    {"–"}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {endRecord.toLocaleString()}
                    </span>
                    {" of "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {totalRecords.toLocaleString()}
                    </span>
                    {" plot sales"}
                  </>
                )}
              </span>
            </div>
          )}

          {showPageSize && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="plot-sale-page-size"
                className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-400"
              >
                Rows per page
              </label>

              <select
                id="plot-sale-page-size"
                value={pageSize}
                onChange={(event) =>
                  changePageSize(event.target.value)
                }
                disabled={loading}
                className={[
                  "h-9 rounded-lg border border-gray-200 bg-white px-2.5",
                  "text-sm text-gray-700 outline-none transition",
                  "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
                ].join(" ")}
              >
                {!pageSizes.includes(pageSize) && (
                  <option value={pageSize}>{pageSize}</option>
                )}

                {pageSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Pagination controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          {showPageNumbers && pages > 1 && (
            <div className="flex items-center gap-1">
              {/* First page */}
              <button
                type="button"
                onClick={() => changePage(1)}
                disabled={isFirstPage || loading}
                className={navigationButtonClass(
                  isFirstPage || loading,
                )}
                aria-label="Go to first page"
                title="First page"
              >
                <ChevronsLeft size={17} />
              </button>

              {/* Previous page */}
              <button
                type="button"
                onClick={() => changePage(page - 1)}
                disabled={isFirstPage || loading}
                className={navigationButtonClass(
                  isFirstPage || loading,
                )}
                aria-label="Go to previous page"
                title="Previous page"
              >
                <ChevronLeft size={17} />
              </button>

              {/* Leading ellipsis */}
              {visiblePages.length > 0 &&
                visiblePages[0] > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => changePage(1)}
                      disabled={loading}
                      className={pageButtonClass(false)}
                      aria-label="Go to page 1"
                    >
                      1
                    </button>

                    {visiblePages[0] > 2 && (
                      <span className="px-1 text-sm text-gray-400">
                        …
                      </span>
                    )}
                  </>
                )}

              {/* Page numbers */}
              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => changePage(pageNumber)}
                  disabled={loading}
                  aria-label={`Go to page ${pageNumber}`}
                  aria-current={
                    pageNumber === page ? "page" : undefined
                  }
                  className={pageButtonClass(pageNumber === page)}
                >
                  {pageNumber}
                </button>
              ))}

              {/* Trailing ellipsis */}
              {visiblePages.length > 0 &&
                visiblePages[visiblePages.length - 1] < pages && (
                  <>
                    {visiblePages[visiblePages.length - 1] <
                      pages - 1 && (
                        <span className="px-1 text-sm text-gray-400">
                          …
                        </span>
                      )}

                    <button
                      type="button"
                      onClick={() => changePage(pages)}
                      disabled={loading}
                      className={pageButtonClass(false)}
                      aria-label={`Go to page ${pages}`}
                    >
                      {pages}
                    </button>
                  </>
                )}

              {/* Next page */}
              <button
                type="button"
                onClick={() => changePage(page + 1)}
                disabled={isLastPage || loading}
                className={navigationButtonClass(
                  isLastPage || loading,
                )}
                aria-label="Go to next page"
                title="Next page"
              >
                <ChevronRight size={17} />
              </button>

              {/* Last page */}
              <button
                type="button"
                onClick={() => changePage(pages)}
                disabled={isLastPage || loading}
                className={navigationButtonClass(
                  isLastPage || loading,
                )}
                aria-label="Go to last page"
                title="Last page"
              >
                <ChevronsRight size={17} />
              </button>
            </div>
          )}

          {showPageNumbers && pages <= 1 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {pages}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
