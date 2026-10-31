import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE_OPTIONS = [10, 15, 25, 50, 100];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE").format(toNumber(value));

const getPageNumbers = (currentPage, lastPage) => {
  const pages = [];
  const totalPages = Math.max(1, lastPage);

  if (totalPages <= 7) {
    for (let page = 1; page <= totalPages; page += 1) {
      pages.push(page);
    }

    return pages;
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
};

/*
|--------------------------------------------------------------------------
| PAGE BUTTON
|--------------------------------------------------------------------------
*/

const PageButton = ({
  children,
  onClick,
  disabled = false,
  active = false,
  label,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    aria-current={active ? "page" : undefined}
    className={`
      inline-flex h-9 min-w-9 items-center justify-center rounded-lg
      border px-2.5 text-sm font-medium transition-all duration-200
      ${
        active
          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
      }
      ${
        disabled
          ? "cursor-not-allowed opacity-40 hover:border-gray-200 hover:bg-white hover:text-gray-700"
          : ""
      }
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
    `}
  >
    {children}
  </button>
);

/*
|--------------------------------------------------------------------------
| PLOT PAYMENT PAGINATION
|--------------------------------------------------------------------------
*/

const PlotPaymentPagination = ({
  currentPage = 1,
  lastPage,
  perPage = 15,
  total = 0,
  from,
  to,
  onPageChange,
  onPerPageChange,
  loading = false,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
  showPerPage = true,
  showPageInfo = true,
  className = "",
}) => {
  const safeTotal = Math.max(0, toNumber(total));
  const safePerPage = Math.max(1, toNumber(perPage, 15));

  const calculatedLastPage = Math.max(
    1,
    Math.ceil(safeTotal / safePerPage),
  );

  const safeLastPage = Math.max(
    1,
    toNumber(lastPage, calculatedLastPage),
  );

  const safeCurrentPage = Math.min(
    Math.max(1, toNumber(currentPage, 1)),
    safeLastPage,
  );

  const calculatedFrom =
    safeTotal === 0 ? 0 : (safeCurrentPage - 1) * safePerPage + 1;

  const calculatedTo = Math.min(
    safeCurrentPage * safePerPage,
    safeTotal,
  );

  const startRecord = from !== undefined && from !== null
    ? toNumber(from)
    : calculatedFrom;

  const endRecord = to !== undefined && to !== null
    ? toNumber(to)
    : calculatedTo;

  const canGoPrevious = safeCurrentPage > 1;
  const canGoNext = safeCurrentPage < safeLastPage;

  const pageNumbers = getPageNumbers(
    safeCurrentPage,
    safeLastPage,
  );

  const handlePageChange = (page) => {
    if (
      loading ||
      !onPageChange ||
      page < 1 ||
      page > safeLastPage ||
      page === safeCurrentPage
    ) {
      return;
    }

    onPageChange(page);
  };

  const handlePerPageChange = (event) => {
    const nextPerPage = Number(event.target.value);

    if (
      loading ||
      !onPerPageChange ||
      !Number.isFinite(nextPerPage) ||
      nextPerPage < 1 ||
      nextPerPage === safePerPage
    ) {
      return;
    }

    onPerPageChange(nextPerPage);
  };

  if (safeTotal === 0) {
    return null;
  }

  return (
    <div
      className={`
        flex flex-col gap-4 border-t border-gray-200
        bg-white px-4 py-4 sm:px-6
        lg:flex-row lg:items-center lg:justify-between
        ${className}
      `}
    >
      {/* RECORD INFORMATION */}
      {showPageInfo && (
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-600">
          <span>
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {formatNumber(startRecord)}
            </span>
            {" "}to{" "}
            <span className="font-semibold text-gray-900">
              {formatNumber(endRecord)}
            </span>
            {" "}of{" "}
            <span className="font-semibold text-gray-900">
              {formatNumber(safeTotal)}
            </span>
            {" "}payments
          </span>

          {loading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-600">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              Updating...
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
        {/* PER PAGE SELECTOR */}
        {showPerPage && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="plot-payment-per-page"
              className="whitespace-nowrap text-sm text-gray-600"
            >
              Rows per page
            </label>

            <select
              id="plot-payment-per-page"
              value={safePerPage}
              onChange={handlePerPageChange}
              disabled={loading || !onPerPageChange}
              className="
                h-9 rounded-lg border border-gray-200
                bg-white px-3 text-sm font-medium text-gray-700
                outline-none transition
                hover:border-gray-300
                focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              {perPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* PAGE NAVIGATION */}
        <nav
          aria-label="Plot payment pagination"
          className="flex items-center justify-start gap-1"
        >
          <PageButton
            label="Go to first page"
            disabled={!canGoPrevious || loading}
            onClick={() => handlePageChange(1)}
          >
            <ChevronsLeft size={16} />
          </PageButton>

          <PageButton
            label="Go to previous page"
            disabled={!canGoPrevious || loading}
            onClick={() => handlePageChange(safeCurrentPage - 1)}
          >
            <ChevronLeft size={16} />
          </PageButton>

          {pageNumbers.map((page, index) =>
            page === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 min-w-8 items-center justify-center text-gray-400"
                aria-hidden="true"
              >
                <MoreHorizontal size={17} />
              </span>
            ) : (
              <PageButton
                key={page}
                active={page === safeCurrentPage}
                disabled={loading}
                label={`Go to page ${page}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </PageButton>
            ),
          )}

          <PageButton
            label="Go to next page"
            disabled={!canGoNext || loading}
            onClick={() => handlePageChange(safeCurrentPage + 1)}
          >
            <ChevronRight size={16} />
          </PageButton>

          <PageButton
            label="Go to last page"
            disabled={!canGoNext || loading}
            onClick={() => handlePageChange(safeLastPage)}
          >
            <ChevronsRight size={16} />
          </PageButton>
        </nav>
      </div>
    </div>
  );
};

export default PlotPaymentPagination;
