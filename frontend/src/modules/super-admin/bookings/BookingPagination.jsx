import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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

const getPaginationValue = (pagination, ...keys) => {
  for (const key of keys) {
    if (
      pagination?.[key] !== undefined &&
      pagination?.[key] !== null
    ) {
      return pagination[key];
    }
  }

  return undefined;
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const BookingPagination = ({
  pagination = {},
  onPageChange,
  loading = false,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Normalize Pagination
  |--------------------------------------------------------------------------
  */

  const currentPage = Math.max(
    1,
    toNumber(
      getPaginationValue(
        pagination,
        "current_page",
        "currentPage",
        "page"
      ),
      1
    )
  );

  const lastPage = Math.max(
    1,
    toNumber(
      getPaginationValue(
        pagination,
        "last_page",
        "lastPage",
        "total_pages",
        "totalPages"
      ),
      1
    )
  );

  const perPage = Math.max(
    1,
    toNumber(
      getPaginationValue(
        pagination,
        "per_page",
        "perPage"
      ),
      15
    )
  );

  const total = Math.max(
    0,
    toNumber(
      getPaginationValue(
        pagination,
        "total",
        "total_count",
        "totalCount"
      ),
      0
    )
  );

  const from = Math.max(
    0,
    toNumber(
      getPaginationValue(pagination, "from"),
      total > 0 ? (currentPage - 1) * perPage + 1 : 0
    )
  );

  const to = Math.min(
    total,
    Math.max(
      0,
      toNumber(
        getPaginationValue(pagination, "to"),
        total > 0
          ? Math.min(currentPage * perPage, total)
          : 0
      )
    )
  );

  /*
  |--------------------------------------------------------------------------
  | No Pagination Needed
  |--------------------------------------------------------------------------
  */

  if (total === 0 || lastPage <= 1) {
    if (total === 0) {
      return null;
    }

    return (
      <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-sm text-slate-500">
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
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const goToPage = (page) => {
    const targetPage = Math.min(
      Math.max(1, page),
      lastPage
    );

    if (
      targetPage === currentPage ||
      loading ||
      typeof onPageChange !== "function"
    ) {
      return;
    }

    onPageChange(targetPage);
  };

  /*
  |--------------------------------------------------------------------------
  | Page Numbers
  |--------------------------------------------------------------------------
  */

  const getPageNumbers = () => {
    const pages = [];

    const maxVisiblePages = 5;

    if (lastPage <= maxVisiblePages + 2) {
      for (let page = 1; page <= lastPage; page += 1) {
        pages.push(page);
      }

      return pages;
    }

    pages.push(1);

    let startPage;
    let endPage;

    if (currentPage <= 3) {
      startPage = 2;
      endPage = 5;
    } else if (currentPage >= lastPage - 2) {
      startPage = lastPage - 4;
      endPage = lastPage - 1;
    } else {
      startPage = currentPage - 2;
      endPage = currentPage + 2;
    }

    if (startPage > 2) {
      pages.push("left-ellipsis");
    }

    for (
      let page = startPage;
      page <= endPage;
      page += 1
    ) {
      if (page > 1 && page < lastPage) {
        pages.push(page);
      }
    }

    if (endPage < lastPage - 1) {
      pages.push("right-ellipsis");
    }

    pages.push(lastPage);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  /*
  |--------------------------------------------------------------------------
  | Button Classes
  |--------------------------------------------------------------------------
  */

  const baseButtonClasses = `
    inline-flex
    h-9
    min-w-9
    items-center
    justify-center
    rounded-lg
    border
    text-sm
    font-semibold
    transition
    focus:outline-none
    focus:ring-4
    focus:ring-indigo-500/10
  `;

  const navigationButtonClasses = `
    ${baseButtonClasses}
    border-slate-200
    bg-white
    text-slate-600
    hover:border-slate-300
    hover:bg-slate-50
    disabled:cursor-not-allowed
    disabled:opacity-40
  `;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* -------------------------------------------------------------- */}
        {/* Results Summary */}
        {/* -------------------------------------------------------------- */}

        <div className="text-center lg:text-left">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {from}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-800">
              {to}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {total}
            </span>{" "}
            bookings
          </p>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Pagination */}
        {/* -------------------------------------------------------------- */}

        <div className="flex items-center justify-center gap-1.5">
          {/* First */}

          <button
            type="button"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1 || loading}
            className={`${navigationButtonClasses} hidden sm:inline-flex`}
            aria-label="First page"
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          {/* Previous */}

          <button
            type="button"
            onClick={() =>
              goToPage(currentPage - 1)
            }
            disabled={currentPage === 1 || loading}
            className={navigationButtonClasses}
            aria-label="Previous page"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />

            <span className="sr-only sm:hidden">
              Previous
            </span>
          </button>

          {/* Page Numbers */}

          <div className="hidden items-center gap-1.5 sm:flex">
            {pageNumbers.map((page, index) => {
              if (
                page === "left-ellipsis" ||
                page === "right-ellipsis"
              ) {
                return (
                  <span
                    key={`${page}-${index}`}
                    className="
                      inline-flex
                      h-9
                      min-w-9
                      items-center
                      justify-center
                      px-1
                      text-sm
                      font-medium
                      text-slate-400
                    "
                  >
                    …
                  </span>
                );
              }

              const isActive = page === currentPage;

              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  disabled={loading}
                  aria-current={
                    isActive ? "page" : undefined
                  }
                  className={`
                    ${baseButtonClasses}
                    ${isActive
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  `}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Mobile Page Indicator */}

          <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 sm:hidden">
            <span className="text-xs font-semibold text-slate-600">
              Page {currentPage} of {lastPage}
            </span>
          </div>

          {/* Next */}

          <button
            type="button"
            onClick={() =>
              goToPage(currentPage + 1)
            }
            disabled={
              currentPage === lastPage || loading
            }
            className={navigationButtonClasses}
            aria-label="Next page"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />

            <span className="sr-only sm:hidden">
              Next
            </span>
          </button>

          {/* Last */}

          <button
            type="button"
            onClick={() => goToPage(lastPage)}
            disabled={
              currentPage === lastPage || loading
            }
            className={`${navigationButtonClasses} hidden sm:inline-flex`}
            aria-label="Last page"
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------- */}
      {/* Loading Indicator */}
      {/* -------------------------------------------------------------- */}

      {loading && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-indigo-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-600" />
          Updating bookings...
        </div>
      )}
    </div>
  );
};

export default BookingPagination;