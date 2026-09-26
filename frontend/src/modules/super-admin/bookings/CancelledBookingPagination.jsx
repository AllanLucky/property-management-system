import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const getPaginationValue = (pagination, key, fallback = null) => {
  if (!pagination || typeof pagination !== "object") {
    return fallback;
  }

  return pagination[key] ?? fallback;
};

/*
|--------------------------------------------------------------------------
| Page Range
|--------------------------------------------------------------------------
*/

const buildPageRange = (
  currentPage,
  lastPage,
  siblingCount = 1
) => {
  const current = Math.max(1, toNumber(currentPage, 1));
  const last = Math.max(1, toNumber(lastPage, 1));
  const siblings = Math.max(0, toNumber(siblingCount, 1));

  if (last <= 1) {
    return [1];
  }

  const totalVisiblePages = siblings * 2 + 5;

  if (last <= totalVisiblePages) {
    return Array.from(
      { length: last },
      (_, index) => index + 1
    );
  }

  const leftSibling = Math.max(
    current - siblings,
    1
  );

  const rightSibling = Math.min(
    current + siblings,
    last
  );

  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < last - 1;

  if (!showLeftDots && showRightDots) {
    const leftItemCount =
      3 + siblings * 2;

    const leftRange = Array.from(
      { length: leftItemCount },
      (_, index) => index + 1
    );

    return [
      ...leftRange,
      "...",
      last,
    ];
  }

  if (showLeftDots && !showRightDots) {
    const rightItemCount =
      3 + siblings * 2;

    const rightRange = Array.from(
      { length: rightItemCount },
      (_, index) =>
        last - rightItemCount + index + 1
    );

    return [
      1,
      "...",
      ...rightRange,
    ];
  }

  const middleRange = Array.from(
    {
      length:
        rightSibling -
        leftSibling +
        1,
    },
    (_, index) =>
      leftSibling + index
  );

  return [
    1,
    "...",
    ...middleRange,
    "...",
    last,
  ];
};

/*
|--------------------------------------------------------------------------
| Pagination Button
|--------------------------------------------------------------------------
*/

function PaginationButton({
  children,
  onClick,
  disabled = false,
  active = false,
  ariaLabel,
  title,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      aria-current={active ? "page" : undefined}
      className={[
        "inline-flex h-9 min-w-9 items-center justify-center",
        "rounded-lg border px-2.5 text-sm font-medium",
        "transition-colors duration-150",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/30",
        active
          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
        disabled
          ? "cursor-not-allowed opacity-40 hover:border-slate-200 hover:bg-white"
          : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

export default function CancelledBookingPagination({
  pagination = null,
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
  disabled = false,
  siblingCount = 1,
  showFirstLast = true,
  showSummary = true,
  showPageSize = false,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = "",
}) {
  /*
  |--------------------------------------------------------------------------
  | Resolve Pagination Values
  |--------------------------------------------------------------------------
  */

  const resolvedCurrentPage = Math.max(
    1,
    toNumber(
      currentPage ??
      getPaginationValue(
        pagination,
        "current_page",
        1
      ),
      1
    )
  );

  const resolvedLastPage = Math.max(
    1,
    toNumber(
      totalPages ??
      getPaginationValue(
        pagination,
        "last_page",
        1
      ),
      1
    )
  );

  const resolvedTotal = Math.max(
    0,
    toNumber(
      getPaginationValue(
        pagination,
        "total",
        0
      ),
      0
    )
  );

  const resolvedFrom = Math.max(
    0,
    toNumber(
      getPaginationValue(
        pagination,
        "from",
        resolvedTotal > 0
          ? (resolvedCurrentPage - 1) *
          toNumber(
            pageSize,
            10
          ) +
          1
          : 0
      ),
      0
    )
  );

  const resolvedTo = Math.max(
    0,
    toNumber(
      getPaginationValue(
        pagination,
        "to",
        resolvedTotal > 0
          ? Math.min(
            resolvedCurrentPage *
            toNumber(
              pageSize,
              10
            ),
            resolvedTotal
          )
          : 0
      ),
      0
    )
  );

  const isFirstPage =
    resolvedCurrentPage <= 1;

  const isLastPage =
    resolvedCurrentPage >=
    resolvedLastPage;

  const isDisabled =
    loading || disabled;

  /*
  |--------------------------------------------------------------------------
  | Page Range
  |--------------------------------------------------------------------------
  */

  const pages = buildPageRange(
    resolvedCurrentPage,
    resolvedLastPage,
    siblingCount
  );

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const goToPage = (page) => {
    if (
      isDisabled ||
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

  /*
  |--------------------------------------------------------------------------
  | Empty / Single Page
  |--------------------------------------------------------------------------
  */

  if (
    resolvedTotal === 0 &&
    !loading
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className={[
        "border-t border-slate-200 bg-white px-4 py-4 sm:px-6",
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/*
                |--------------------------------------------------------------
                | Summary
                |--------------------------------------------------------------
                */}

        <div className="flex flex-wrap items-center gap-3">
          {showSummary && (
            <div className="text-sm text-slate-600">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading cancelled bookings...
                </span>
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold text-slate-900">
                    {resolvedFrom.toLocaleString()}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-900">
                    {resolvedTo.toLocaleString()}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {resolvedTotal.toLocaleString()}
                  </span>{" "}
                  cancelled bookings
                </>
              )}
            </div>
          )}

          {showPageSize &&
            typeof onPageSizeChange ===
            "function" && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="cancelled-bookings-page-size"
                  className="text-sm text-slate-500"
                >
                  Per page
                </label>

                <select
                  id="cancelled-bookings-page-size"
                  value={
                    pageSize ??
                    10
                  }
                  disabled={
                    isDisabled
                  }
                  onChange={(event) => {
                    const value =
                      Number(
                        event
                          .target
                          .value
                      );

                    onPageSizeChange(
                      value
                    );
                  }}
                  className={[
                    "h-9 rounded-lg border border-slate-200",
                    "bg-white px-3 text-sm text-slate-700",
                    "outline-none transition",
                    "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
                    isDisabled
                      ? "cursor-not-allowed opacity-50"
                      : "",
                  ].join(" ")}
                >
                  {pageSizeOptions.map(
                    (option) => (
                      <option
                        key={
                          option
                        }
                        value={
                          option
                        }
                      >
                        {
                          option
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            )}
        </div>

        {/*
                |--------------------------------------------------------------
                | Controls
                |--------------------------------------------------------------
                */}

        <div className="flex flex-wrap items-center gap-2">
          {/*
                    |----------------------------------------------------------
                    | First
                    |----------------------------------------------------------
                    */}

          {showFirstLast && (
            <PaginationButton
              onClick={() =>
                goToPage(1)
              }
              disabled={
                isDisabled ||
                isFirstPage
              }
              ariaLabel="Go to first page"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </PaginationButton>
          )}

          {/*
                    |----------------------------------------------------------
                    | Previous
                    |----------------------------------------------------------
                    */}

          <PaginationButton
            onClick={() =>
              goToPage(
                resolvedCurrentPage -
                1
              )
            }
            disabled={
              isDisabled ||
              isFirstPage
            }
            ariaLabel="Go to previous page"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </PaginationButton>

          {/*
                    |----------------------------------------------------------
                    | Page Numbers
                    |----------------------------------------------------------
                    */}

          <div className="hidden items-center gap-1 sm:flex">
            {pages.map(
              (page, index) => {
                if (
                  page ===
                  "..."
                ) {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-sm font-medium text-slate-400"
                      aria-hidden="true"
                    >
                      …
                    </span>
                  );
                }

                return (
                  <PaginationButton
                    key={page}
                    onClick={() =>
                      goToPage(
                        page
                      )
                    }
                    disabled={
                      isDisabled
                    }
                    active={
                      page ===
                      resolvedCurrentPage
                    }
                    ariaLabel={`Go to page ${page}`}
                    title={`Page ${page}`}
                  >
                    {
                      page
                    }
                  </PaginationButton>
                );
              }
            )}
          </div>

          {/*
                    |----------------------------------------------------------
                    | Mobile Page Indicator
                    |----------------------------------------------------------
                    */}

          <div className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 sm:hidden">
            Page{" "}
            <span className="mx-1 font-semibold text-slate-900">
              {
                resolvedCurrentPage
              }
            </span>
            of{" "}
            <span className="ml-1 font-semibold text-slate-900">
              {resolvedLastPage}
            </span>
          </div>

          {/*
                    |----------------------------------------------------------
                    | Next
                    |----------------------------------------------------------
                    */}

          <PaginationButton
            onClick={() =>
              goToPage(
                resolvedCurrentPage +
                1
              )
            }
            disabled={
              isDisabled ||
              isLastPage
            }
            ariaLabel="Go to next page"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </PaginationButton>

          {/*
                    |----------------------------------------------------------
                    | Last
                    |----------------------------------------------------------
                    */}

          {showFirstLast && (
            <PaginationButton
              onClick={() =>
                goToPage(
                  resolvedLastPage
                )
              }
              disabled={
                isDisabled ||
                isLastPage
              }
              ariaLabel="Go to last page"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </PaginationButton>
          )}
        </div>
      </div>
    </div>
  );
}