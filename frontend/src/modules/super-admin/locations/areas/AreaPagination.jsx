
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Area Pagination
|--------------------------------------------------------------------------
*/

const AreaPagination = ({
  pagination = {},
  onPageChange,
  onPerPageChange,
  loading = false,
  perPageOptions = [10, 15, 25, 50, 100],
}) => {
  /*
  |--------------------------------------------------------------------------
  | Pagination Values
  |--------------------------------------------------------------------------
  */

  const currentPage = Math.max(
    1,
    Number(pagination.current_page || 1)
  );

  const lastPage = Math.max(
    1,
    Number(pagination.last_page || 1)
  );

  const perPage = Number(pagination.per_page || 15);
  const total = Number(pagination.total || 0);

  const from = Number(
    pagination.from ??
    (total > 0 ? (currentPage - 1) * perPage + 1 : 0)
  );

  const to = Number(
    pagination.to ?? Math.min(currentPage * perPage, total)
  );

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < lastPage;

  /*
  |--------------------------------------------------------------------------
  | Handlers
  |--------------------------------------------------------------------------
  */

  const handlePageChange = (page) => {
    const nextPage = Number(page);

    if (
      loading ||
      !Number.isInteger(nextPage) ||
      nextPage < 1 ||
      nextPage > lastPage ||
      nextPage === currentPage
    ) {
      return;
    }

    onPageChange?.(nextPage);
  };

  const handlePerPageChange = (event) => {
    const value = Number(event.target.value);

    if (
      loading ||
      !Number.isInteger(value) ||
      value < 1
    ) {
      return;
    }

    onPerPageChange?.(value);
  };

  /*
  |--------------------------------------------------------------------------
  | Page Number Generator
  |--------------------------------------------------------------------------
  */

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;

    let startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisible / 2)
    );

    let endPage = Math.min(
      lastPage,
      startPage + maxVisible - 1
    );

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(
        1,
        endPage - maxVisible + 1
      );
    }

    for (let page = startPage; page <= endPage; page++) {
      pages.push(page);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  /*
  |--------------------------------------------------------------------------
  | Button Styles
  |--------------------------------------------------------------------------
  */

  const buttonBase =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";

  const normalButton =
    "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600";

  const activeButton =
    "border-indigo-600 bg-indigo-600 text-white shadow-sm";

  /*
  |--------------------------------------------------------------------------
  | Empty Pagination
  |--------------------------------------------------------------------------
  */

  if (total === 0) {
    return (
      <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

        <p className="text-xs font-medium text-gray-500">
          No area records to display
        </p>

        <div className="flex items-center gap-2">
          <label
            htmlFor="area-per-page-empty"
            className="text-xs text-gray-400"
          >
            Rows per page
          </label>

          <select
            id="area-per-page-empty"
            value={perPage}
            onChange={handlePerPageChange}
            disabled={loading}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Main Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">

      {/* Results Information */}

      <div className="flex flex-wrap items-center gap-3">

        <p className="text-xs text-gray-500">
          Showing{" "}
          <span className="font-bold text-gray-800">
            {from.toLocaleString("en-KE")}
          </span>
          {" "}to{" "}
          <span className="font-bold text-gray-800">
            {to.toLocaleString("en-KE")}
          </span>
          {" "}of{" "}
          <span className="font-bold text-gray-800">
            {total.toLocaleString("en-KE")}
          </span>
          {" "}area records
        </p>

        <div className="hidden h-4 w-px bg-gray-200 sm:block" />

        {/* Rows Per Page */}

        <div className="flex items-center gap-2">
          <label
            htmlFor="area-per-page"
            className="whitespace-nowrap text-xs font-medium text-gray-500"
          >
            Rows per page
          </label>

          <select
            id="area-per-page"
            value={perPage}
            onChange={handlePerPageChange}
            disabled={loading}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Page Navigation */}

      <div className="flex flex-wrap items-center gap-1.5">

        {/* First Page */}

        <button
          type="button"
          onClick={() => handlePageChange(1)}
          disabled={loading || !hasPrevious}
          className={`${buttonBase} ${normalButton}`}
          aria-label="Go to first page"
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous Page */}

        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={loading || !hasPrevious}
          className={`${buttonBase} ${normalButton}`}
          aria-label="Go to previous page"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Leading Ellipsis */}

        {visiblePages[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={loading}
              className={`${buttonBase} ${normalButton}`}
              aria-label="Go to page 1"
            >
              1
            </button>

            {visiblePages[0] > 2 && (
              <span className="flex h-9 w-6 items-center justify-center text-gray-400">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            )}
          </>
        )}

        {/* Page Numbers */}

        {visiblePages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => handlePageChange(page)}
            disabled={loading}
            aria-current={
              page === currentPage ? "page" : undefined
            }
            className={`${buttonBase} ${page === currentPage
              ? activeButton
              : normalButton
              }`}
          >
            {page}
          </button>
        ))}

        {/* Trailing Ellipsis */}

        {visiblePages[visiblePages.length - 1] < lastPage && (
          <>
            {visiblePages[visiblePages.length - 1] < lastPage - 1 && (
              <span className="flex h-9 w-6 items-center justify-center text-gray-400">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            )}

            <button
              type="button"
              onClick={() => handlePageChange(lastPage)}
              disabled={loading}
              className={`${buttonBase} ${normalButton}`}
              aria-label={`Go to page ${lastPage}`}
            >
              {lastPage}
            </button>
          </>
        )}

        {/* Next Page */}

        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={loading || !hasNext}
          className={`${buttonBase} ${normalButton}`}
          aria-label="Go to next page"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last Page */}

        <button
          type="button"
          onClick={() => handlePageChange(lastPage)}
          disabled={loading || !hasNext}
          className={`${buttonBase} ${normalButton}`}
          aria-label="Go to last page"
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AreaPagination;
