
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Pagination Helpers
|--------------------------------------------------------------------------
*/

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const buildPaginationPages = (
  currentPage,
  lastPage,
  siblingCount = 1
) => {
  const totalPages = Math.max(1, lastPage);

  const current = Math.min(
    Math.max(1, currentPage),
    totalPages
  );

  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  const left = Math.max(
    1,
    current - siblingCount
  );

  const right = Math.min(
    totalPages,
    current + siblingCount
  );

  const showLeftDots = left > 2;

  const showRightDots =
    right < totalPages - 1;

  if (!showLeftDots && showRightDots) {
    return [
      1,
      2,
      3,
      4,
      5,
      "dots",
      totalPages,
    ];
  }

  if (showLeftDots && !showRightDots) {
    return [
      1,
      "dots",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "dots",
    ...Array.from(
      { length: right - left + 1 },
      (_, index) => left + index
    ),
    "dots",
    totalPages,
  ];
};

/*
|--------------------------------------------------------------------------
| Pagination Button
|--------------------------------------------------------------------------
*/

const PaginationButton = ({
  children,
  onClick,
  disabled = false,
  active = false,
  title,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-current={active ? "page" : undefined}
      className={`
                inline-flex h-9 min-w-9 items-center justify-center
                rounded-lg border px-2.5 text-xs font-semibold
                transition-all duration-150
                ${active
          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
        }
                ${disabled
          ? "cursor-not-allowed opacity-40 hover:border-gray-200 hover:bg-white hover:text-gray-600"
          : ""
        }
                ${className}
            `}
    >
      {children}
    </button>
  );
};

/*
|--------------------------------------------------------------------------
| Region Pagination
|--------------------------------------------------------------------------
*/

const RegionPagination = ({
  pagination = {},
  currentPage,
  perPage,
  total,
  lastPage,
  from,
  to,
  onPageChange,
  onPerPageChange,
  loading = false,
  perPageOptions = [10, 15, 25, 50, 100],
  showPageSize = true,
  showPageInfo = true,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Normalize Pagination Data
  |--------------------------------------------------------------------------
  */

  const meta =
    pagination?.meta ||
    pagination?.pagination ||
    pagination?.data?.meta ||
    pagination ||
    {};

  const resolvedCurrentPage = Math.max(
    1,
    toNumber(
      currentPage ??
      meta.current_page ??
      meta.currentPage,
      1
    )
  );

  const resolvedPerPage = Math.max(
    1,
    toNumber(
      perPage ??
      meta.per_page ??
      meta.perPage ??
      meta.page_size,
      15
    )
  );

  const resolvedTotal = Math.max(
    0,
    toNumber(
      total ??
      meta.total ??
      meta.total_items ??
      meta.totalItems,
      0
    )
  );

  const calculatedLastPage = Math.max(
    1,
    Math.ceil(
      resolvedTotal / resolvedPerPage
    )
  );

  const resolvedLastPage = Math.max(
    1,
    toNumber(
      lastPage ??
      meta.last_page ??
      meta.lastPage,
      calculatedLastPage
    )
  );

  const resolvedFrom =
    resolvedTotal === 0
      ? 0
      : toNumber(
        from ?? meta.from,
        (resolvedCurrentPage - 1) *
        resolvedPerPage +
        1
      );

  const resolvedTo =
    resolvedTotal === 0
      ? 0
      : toNumber(
        to ?? meta.to,
        Math.min(
          resolvedCurrentPage *
          resolvedPerPage,
          resolvedTotal
        )
      );

  /*
  |--------------------------------------------------------------------------
  | Navigation State
  |--------------------------------------------------------------------------
  */

  const hasPrevious = resolvedCurrentPage > 1;

  const hasNext =
    resolvedCurrentPage < resolvedLastPage;

  const pages = buildPaginationPages(
    resolvedCurrentPage,
    resolvedLastPage
  );

  /*
  |--------------------------------------------------------------------------
  | Handlers
  |--------------------------------------------------------------------------
  */

  const handlePageChange = (page) => {
    if (
      loading ||
      typeof onPageChange !== "function"
    ) {
      return;
    }

    const nextPage = Math.min(
      Math.max(1, toNumber(page, 1)),
      resolvedLastPage
    );

    if (nextPage === resolvedCurrentPage) {
      return;
    }

    onPageChange(nextPage);
  };

  const handlePerPageChange = (event) => {
    if (
      loading ||
      typeof onPerPageChange !== "function"
    ) {
      return;
    }

    const nextPerPage = toNumber(
      event.target.value,
      resolvedPerPage
    );

    if (nextPerPage === resolvedPerPage) {
      return;
    }

    onPerPageChange(nextPerPage);
  };

  /*
  |--------------------------------------------------------------------------
  | Empty State
  |--------------------------------------------------------------------------
  */

  if (resolvedTotal === 0) {
    return (
      <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

        <p className="text-xs font-medium text-gray-500">
          No regions to display
        </p>

        {showPageSize && (
          <div className="flex items-center gap-2">

            <label
              htmlFor="region-empty-per-page"
              className="whitespace-nowrap text-xs font-medium text-gray-500"
            >
              Rows per page
            </label>

            <select
              id="region-empty-per-page"
              value={resolvedPerPage}
              onChange={handlePerPageChange}
              disabled={loading}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {perPageOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render Pagination
  |--------------------------------------------------------------------------
  */

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-4 sm:px-6">

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

        {/* RESULTS INFORMATION */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">

          {showPageInfo && (
            <p className="text-xs text-gray-500">
              Showing{" "}
              <span className="font-bold text-gray-800">
                {resolvedFrom}
              </span>{" "}
              to{" "}
              <span className="font-bold text-gray-800">
                {resolvedTo}
              </span>{" "}
              of{" "}
              <span className="font-bold text-gray-800">
                {resolvedTotal}
              </span>{" "}
              regions
            </p>
          )}

          {/* PAGE SIZE */}

          {showPageSize && (
            <div className="flex items-center gap-2">

              <label
                htmlFor="region-per-page"
                className="whitespace-nowrap text-xs font-medium text-gray-500"
              >
                Rows per page
              </label>

              <select
                id="region-per-page"
                value={resolvedPerPage}
                onChange={handlePerPageChange}
                disabled={loading}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {perPageOptions.map((option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* DESKTOP PAGINATION */}

        <div className="hidden items-center gap-1.5 sm:flex">

          {/* FIRST PAGE */}

          <PaginationButton
            onClick={() => handlePageChange(1)}
            disabled={!hasPrevious || loading}
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </PaginationButton>

          {/* PREVIOUS */}

          <PaginationButton
            onClick={() =>
              handlePageChange(
                resolvedCurrentPage - 1
              )
            }
            disabled={!hasPrevious || loading}
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </PaginationButton>

          {/* PAGE NUMBERS */}

          <div className="flex items-center gap-1">

            {pages.map((page, index) => {
              if (page === "dots") {
                return (
                  <span
                    key={`dots-${index}`}
                    className="flex h-9 w-8 items-center justify-center text-gray-400"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                );
              }

              return (
                <PaginationButton
                  key={page}
                  active={
                    page === resolvedCurrentPage
                  }
                  disabled={loading}
                  onClick={() =>
                    handlePageChange(page)
                  }
                  title={`Go to page ${page}`}
                >
                  {page}
                </PaginationButton>
              );
            })}
          </div>

          {/* NEXT */}

          <PaginationButton
            onClick={() =>
              handlePageChange(
                resolvedCurrentPage + 1
              )
            }
            disabled={!hasNext || loading}
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </PaginationButton>

          {/* LAST PAGE */}

          <PaginationButton
            onClick={() =>
              handlePageChange(
                resolvedLastPage
              )
            }
            disabled={!hasNext || loading}
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </PaginationButton>
        </div>

        {/* MOBILE PAGINATION */}

        <div className="flex items-center justify-between gap-3 sm:hidden">

          <button
            type="button"
            onClick={() =>
              handlePageChange(
                resolvedCurrentPage - 1
              )
            }
            disabled={!hasPrevious || loading}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex shrink-0 flex-col items-center">

            <span className="text-xs font-bold text-gray-900">
              Page {resolvedCurrentPage}
            </span>

            <span className="mt-0.5 text-[10px] text-gray-400">
              of {resolvedLastPage}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              handlePageChange(
                resolvedCurrentPage + 1
              )
            }
            disabled={!hasNext || loading}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegionPagination;
