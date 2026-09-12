import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE_OPTIONS = [10, 15, 25, 50, 100];

const DEFAULT_PAGINATION = {
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
  from: null,
  to: null,
  has_more_pages: false,
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely convert a value into a non-negative integer.
 */
function toNonNegativeInteger(value, fallback = 0) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

/**
 * Safely convert a value into a positive integer.
 */
function toPositiveInteger(value, fallback = 1) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

/**
 * Normalize Laravel / API pagination into one predictable structure.
 *
 * Supports:
 * - current_page
 * - per_page
 * - total
 * - last_page
 * - from
 * - to
 * - has_more_pages
 */
function normalizePagination(pagination) {
  const source =
    pagination && typeof pagination === "object"
      ? pagination
      : DEFAULT_PAGINATION;

  const total = toNonNegativeInteger(source.total, 0);

  const perPage = Math.max(
    1,
    toPositiveInteger(
      source.per_page,
      DEFAULT_PAGINATION.per_page
    )
  );

  const calculatedLastPage =
    Math.ceil(total / perPage) || 1;

  const lastPage = Math.max(
    1,
    toPositiveInteger(
      source.last_page,
      calculatedLastPage
    )
  );

  const currentPage = Math.min(
    Math.max(
      1,
      toPositiveInteger(source.current_page, 1)
    ),
    lastPage
  );

  const fallbackFrom =
    total > 0
      ? (currentPage - 1) * perPage + 1
      : null;

  const fallbackTo =
    total > 0
      ? Math.min(currentPage * perPage, total)
      : null;

  const from =
    source.from === null ||
    source.from === undefined ||
    source.from === ""
      ? fallbackFrom
      : toNonNegativeInteger(source.from, fallbackFrom);

  const to =
    source.to === null ||
    source.to === undefined ||
    source.to === ""
      ? fallbackTo
      : toNonNegativeInteger(source.to, fallbackTo);

  const hasMorePages =
    typeof source.has_more_pages === "boolean"
      ? source.has_more_pages
      : currentPage < lastPage;

  return {
    current_page: currentPage,
    per_page: perPage,
    total,
    last_page: lastPage,
    from,
    to,
    has_more_pages: hasMorePages,
  };
}

/**
 * Normalize the available per-page options.
 *
 * Removes:
 * - invalid values;
 * - zero;
 * - negative numbers;
 * - duplicates.
 */
function normalizePerPageOptions(options) {
  const source = Array.isArray(options)
    ? options
    : DEFAULT_PER_PAGE_OPTIONS;

  const normalized = [
    ...new Set(
      source
        .map((option) => Number(option))
        .filter(
          (option) =>
            Number.isFinite(option) &&
            option > 0
        )
        .map((option) => Math.floor(option))
    ),
  ];

  return normalized.length > 0
    ? normalized
    : DEFAULT_PER_PAGE_OPTIONS;
}

/**
 * Create a compact page-number list.
 *
 * Example:
 *
 * [
 *   1,
 *   "left-ellipsis",
 *   5,
 *   6,
 *   7,
 *   "right-ellipsis",
 *   20
 * ]
 */
function getPageNumbers(
  currentPage,
  lastPage,
  siblingCount = 1
) {
  const safeCurrentPage = Math.min(
    Math.max(1, currentPage),
    Math.max(1, lastPage)
  );

  const safeLastPage = Math.max(1, lastPage);

  const safeSiblingCount = Math.max(
    0,
    Math.floor(Number(siblingCount) || 0)
  );

  if (safeLastPage <= 1) {
    return [1];
  }

  const totalVisiblePages =
    safeSiblingCount * 2 + 5;

  if (safeLastPage <= totalVisiblePages) {
    return Array.from(
      { length: safeLastPage },
      (_, index) => index + 1
    );
  }

  const pages = [];

  const startPage = Math.max(
    2,
    safeCurrentPage - safeSiblingCount
  );

  const endPage = Math.min(
    safeLastPage - 1,
    safeCurrentPage + safeSiblingCount
  );

  pages.push(1);

  if (startPage > 2) {
    pages.push("left-ellipsis");
  }

  for (
    let page = startPage;
    page <= endPage;
    page += 1
  ) {
    pages.push(page);
  }

  if (endPage < safeLastPage - 1) {
    pages.push("right-ellipsis");
  }

  pages.push(safeLastPage);

  return pages;
}

/*
|--------------------------------------------------------------------------
| Page Button
|--------------------------------------------------------------------------
*/

function PageButton({
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
      aria-current={
        active ? "page" : undefined
      }
      title={title}
      className={[
        "inline-flex h-9 min-w-9 items-center justify-center",
        "rounded-lg border px-2.5 text-sm font-medium",
        "transition-colors duration-150",
        "focus:outline-none focus:ring-2",
        "focus:ring-blue-500 focus:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : [
              "border-gray-300 bg-white text-gray-700",
              "hover:bg-gray-50 hover:text-gray-900",
            ].join(" "),
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| Per Page Selector
|--------------------------------------------------------------------------
*/

function PerPageSelector({
  value,
  options = DEFAULT_PER_PAGE_OPTIONS,
  onChange,
  disabled = false,
}) {
  const normalizedOptions =
    normalizePerPageOptions(options);

  const normalizedValue = toPositiveInteger(
    value,
    DEFAULT_PAGINATION.per_page
  );

  /**
   * Make sure the currently selected value is
   * still available even if the parent supplied a
   * custom options array that doesn't contain it.
   */
  const finalOptions = normalizedOptions.includes(
    normalizedValue
  )
    ? normalizedOptions
    : [
        normalizedValue,
        ...normalizedOptions,
      ].sort((a, b) => a - b);

  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      <span className="whitespace-nowrap">
        Rows per page
      </span>

      <select
        value={normalizedValue}
        onChange={onChange}
        disabled={disabled}
        aria-label="Rows per page"
        className={[
          "h-9 rounded-lg border border-gray-300",
          "bg-white px-2.5 text-sm text-gray-700",
          "shadow-sm transition-colors",
          "focus:border-blue-500 focus:outline-none",
          "focus:ring-2 focus:ring-blue-500/20",
          "disabled:cursor-not-allowed",
          "disabled:bg-gray-100",
        ].join(" ")}
      >
        {finalOptions.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

export default function LeasePagination({
  /**
   * Pagination object from useLease / Redux.
   */
  pagination = DEFAULT_PAGINATION,

  /**
   * Called when the page changes.
   *
   * Receives:
   *
   * {
   *   page,
   *   per_page
   * }
   */
  onPageChange,

  /**
   * Called when records-per-page changes.
   *
   * Receives:
   *
   * {
   *   page: 1,
   *   per_page
   * }
   */
  onPerPageChange,

  /**
   * Loading state while another page
   * is being requested.
   */
  loading = false,

  /**
   * Show rows-per-page selector.
   */
  showPerPage = true,

  /**
   * Show "Showing X to Y of Z leases".
   */
  showSummary = true,

  /**
   * Show first / last page buttons.
   */
  showFirstLast = true,

  /**
   * Available page-size options.
   */
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,

  /**
   * Number of sibling pages around
   * the active page.
   */
  siblingCount = 1,

  /**
   * Optional custom class.
   */
  className = "",
}) {
  /*
  |--------------------------------------------------------------------------
  | Normalize Pagination
  |--------------------------------------------------------------------------
  */

  const normalized =
    normalizePagination(pagination);

  const {
    current_page: currentPage,
    per_page: perPage,
    total,
    last_page: lastPage,
    from,
    to,
  } = normalized;

  /*
  |--------------------------------------------------------------------------
  | Derived State
  |--------------------------------------------------------------------------
  */

  const hasPreviousPage =
    currentPage > 1;

  const hasNextPage =
    currentPage < lastPage;

  const pageNumbers = getPageNumbers(
    currentPage,
    lastPage,
    siblingCount
  );

  const isEmpty = total === 0;

  /**
   * Pagination controls are not useful when
   * there is only one page.
   */
  const hasMultiplePages =
    lastPage > 1;

  /*
  |--------------------------------------------------------------------------
  | Page Navigation
  |--------------------------------------------------------------------------
  */

  const changePage = (page) => {
    if (loading) {
      return;
    }

    const numericPage = Number(page);

    if (!Number.isFinite(numericPage)) {
      return;
    }

    const nextPage = Math.min(
      Math.max(
        1,
        Math.floor(numericPage)
      ),
      lastPage
    );

    if (nextPage === currentPage) {
      return;
    }

    if (
      typeof onPageChange !==
      "function"
    ) {
      return;
    }

    onPageChange({
      page: nextPage,
      per_page: perPage,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Per Page Change
  |--------------------------------------------------------------------------
  */

  const changePerPage = (event) => {
    if (loading) {
      return;
    }

    const nextPerPage = Number(
      event?.target?.value
    );

    if (
      !Number.isFinite(nextPerPage) ||
      nextPerPage < 1
    ) {
      return;
    }

    const normalizedNextPerPage =
      Math.floor(nextPerPage);

    if (
      typeof onPerPageChange ===
      "function"
    ) {
      onPerPageChange({
        page: 1,
        per_page: normalizedNextPerPage,
      });

      return;
    }

    /**
     * Fallback when only onPageChange
     * is provided.
     */
    if (
      typeof onPageChange ===
      "function"
    ) {
      onPageChange({
        page: 1,
        per_page: normalizedNextPerPage,
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Empty State
  |--------------------------------------------------------------------------
  */

  if (isEmpty) {
    return (
      <div
        className={[
          "flex flex-col gap-3 border-t",
          "border-gray-200 bg-white",
          "px-4 py-4",
          "sm:flex-row sm:items-center",
          "sm:justify-between",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="text-sm text-gray-500">
          No lease records to paginate.
        </div>

        {showPerPage && (
          <PerPageSelector
            value={perPage}
            options={perPageOptions}
            onChange={changePerPage}
            disabled={loading}
          />
        )}
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <nav
      aria-label="Lease pagination"
      className={[
        "border-t border-gray-200",
        "bg-white px-4 py-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "flex flex-col gap-4",
          "lg:flex-row lg:items-center",
          "lg:justify-between",
        ].join(" ")}
      >
        {/* ------------------------------------------------------------------
            SUMMARY
        ------------------------------------------------------------------ */}

        {showSummary ? (
          <div
            className={[
              "order-2 flex items-center",
              "text-sm text-gray-600",
              "lg:order-1",
            ].join(" ")}
          >
            {loading ? (
              <div className="inline-flex items-center gap-2">
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />

                <span>
                  Loading leases...
                </span>
              </div>
            ) : (
              <span>
                Showing{" "}
                <span className="font-medium text-gray-900">
                  {from?.toLocaleString() ??
                    0}
                </span>{" "}
                to{" "}
                <span className="font-medium text-gray-900">
                  {to?.toLocaleString() ??
                    0}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-900">
                  {total.toLocaleString()}
                </span>{" "}
                leases
              </span>
            )}
          </div>
        ) : (
          <div className="order-2 lg:order-1" />
        )}

        {/* ------------------------------------------------------------------
            CONTROLS
        ------------------------------------------------------------------ */}

        <div
          className={[
            "order-1 flex flex-col gap-3",
            "sm:flex-row sm:items-center",
            "lg:order-2",
          ].join(" ")}
        >
          {/* Per page */}
          {showPerPage && (
            <PerPageSelector
              value={perPage}
              options={perPageOptions}
              onChange={changePerPage}
              disabled={loading}
            />
          )}

          {/* Pagination controls */}
          {hasMultiplePages && (
            <div
              className="flex items-center justify-center gap-1"
              role="group"
              aria-label="Lease page navigation"
            >
              {/* ------------------------------------------------------------
                  First Page
              ------------------------------------------------------------ */}

              {showFirstLast && (
                <PageButton
                  onClick={() =>
                    changePage(1)
                  }
                  disabled={
                    !hasPreviousPage ||
                    loading
                  }
                  ariaLabel="Go to first page"
                  title="First page"
                >
                  <ChevronsLeft
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </PageButton>
              )}

              {/* ------------------------------------------------------------
                  Previous Page
              ------------------------------------------------------------ */}

              <PageButton
                onClick={() =>
                  changePage(
                    currentPage - 1
                  )
                }
                disabled={
                  !hasPreviousPage ||
                  loading
                }
                ariaLabel="Go to previous page"
                title="Previous page"
              >
                <ChevronLeft
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </PageButton>

              {/* ------------------------------------------------------------
                  Page Numbers
              ------------------------------------------------------------ */}

              <div
                className="hidden items-center gap-1 sm:flex"
                aria-label="Page numbers"
              >
                {pageNumbers.map(
                  (page) => {
                    if (
                      page ===
                        "left-ellipsis" ||
                      page ===
                        "right-ellipsis"
                    ) {
                      return (
                        <span
                          key={page}
                          className={[
                            "flex h-9 min-w-9",
                            "items-center",
                            "justify-center",
                            "px-1 text-sm",
                            "text-gray-500",
                          ].join(" ")}
                          aria-hidden="true"
                        >
                          …
                        </span>
                      );
                    }

                    return (
                      <PageButton
                        key={page}
                        onClick={() =>
                          changePage(
                            page
                          )
                        }
                        disabled={
                          loading
                        }
                        active={
                          page ===
                          currentPage
                        }
                        ariaLabel={`Go to page ${page}`}
                        title={`Page ${page}`}
                      >
                        {page}
                      </PageButton>
                    );
                  }
                )}
              </div>

              {/* ------------------------------------------------------------
                  Mobile Page Indicator
              ------------------------------------------------------------ */}

              <div
                className={[
                  "flex h-9 items-center",
                  "justify-center rounded-lg",
                  "border border-gray-300",
                  "bg-white px-3",
                  "text-sm font-medium",
                  "text-gray-700",
                  "sm:hidden",
                ].join(" ")}
                aria-live="polite"
              >
                Page{" "}
                {currentPage} of{" "}
                {lastPage}
              </div>

              {/* ------------------------------------------------------------
                  Next Page
              ------------------------------------------------------------ */}

              <PageButton
                onClick={() =>
                  changePage(
                    currentPage + 1
                  )
                }
                disabled={
                  !hasNextPage ||
                  loading
                }
                ariaLabel="Go to next page"
                title="Next page"
              >
                <ChevronRight
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </PageButton>

              {/* ------------------------------------------------------------
                  Last Page
              ------------------------------------------------------------ */}

              {showFirstLast && (
                <PageButton
                  onClick={() =>
                    changePage(
                      lastPage
                    )
                  }
                  disabled={
                    !hasNextPage ||
                    loading
                  }
                  ariaLabel="Go to last page"
                  title="Last page"
                >
                  <ChevronsRight
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </PageButton>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

/*
|--------------------------------------------------------------------------
| Compact Pagination
|--------------------------------------------------------------------------
|
| Useful when the parent already displays:
| - total records;
| - result summary;
| - rows per page.
|--------------------------------------------------------------------------
*/

export function LeasePaginationCompact({
  pagination,
  onPageChange,
  loading = false,
  className = "",
}) {
  return (
    <LeasePagination
      pagination={pagination}
      onPageChange={onPageChange}
      loading={loading}
      showPerPage={false}
      showSummary={false}
      showFirstLast={false}
      className={className}
    />
  );
}

/*
|--------------------------------------------------------------------------
| Simple Pagination
|--------------------------------------------------------------------------
|
| Only previous / next controls.
|--------------------------------------------------------------------------
*/

export function LeasePaginationSimple({
  pagination,
  onPageChange,
  loading = false,
  className = "",
}) {
  const normalized =
    normalizePagination(pagination);

  const currentPage =
    normalized.current_page;

  const lastPage =
    normalized.last_page;

  const hasPrevious =
    currentPage > 1;

  const hasNext =
    currentPage < lastPage;

  const handlePrevious = () => {
    if (
      loading ||
      !hasPrevious ||
      typeof onPageChange !==
        "function"
    ) {
      return;
    }

    onPageChange({
      page: currentPage - 1,
      per_page: normalized.per_page,
    });
  };

  const handleNext = () => {
    if (
      loading ||
      !hasNext ||
      typeof onPageChange !==
        "function"
    ) {
      return;
    }

    onPageChange({
      page: currentPage + 1,
      per_page: normalized.per_page,
    });
  };

  /**
   * Nothing useful to navigate when
   * there is only one page.
   */
  if (lastPage <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Lease pagination"
      className={[
        "flex items-center justify-between",
        "border-t border-gray-200",
        "bg-white px-4 py-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        onClick={handlePrevious}
        disabled={
          !hasPrevious || loading
        }
        aria-label="Go to previous page"
        className={[
          "inline-flex items-center gap-2",
          "rounded-lg border px-3 py-2",
          "text-sm font-medium",
          "transition-colors",
          "focus:outline-none",
          "focus:ring-2 focus:ring-blue-500",
          "focus:ring-offset-1",
          "disabled:cursor-not-allowed",
          "disabled:opacity-40",
          "border-gray-300",
          "bg-white text-gray-700",
          "hover:bg-gray-50",
        ].join(" ")}
      >
        <ChevronLeft
          className="h-4 w-4"
          aria-hidden="true"
        />

        <span>Previous</span>
      </button>

      <div
        className="text-sm text-gray-600"
        aria-live="polite"
      >
        Page{" "}
        <span className="font-medium text-gray-900">
          {currentPage}
        </span>{" "}
        of{" "}
        <span className="font-medium text-gray-900">
          {lastPage}
        </span>
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={
          !hasNext || loading
        }
        aria-label="Go to next page"
        className={[
          "inline-flex items-center gap-2",
          "rounded-lg border px-3 py-2",
          "text-sm font-medium",
          "transition-colors",
          "focus:outline-none",
          "focus:ring-2 focus:ring-blue-500",
          "focus:ring-offset-1",
          "disabled:cursor-not-allowed",
          "disabled:opacity-40",
          "border-gray-300",
          "bg-white text-gray-700",
          "hover:bg-gray-50",
        ].join(" ")}
      >
        <span>Next</span>

        <ChevronRight
          className="h-4 w-4"
          aria-hidden="true"
        />
      </button>
    </nav>
  );
}