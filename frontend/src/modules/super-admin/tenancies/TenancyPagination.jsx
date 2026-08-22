import { useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Navigation Button
|--------------------------------------------------------------------------
| IMPORTANT:
| This component must be declared OUTSIDE TenancyPagination.
| Declaring it inside the parent component creates a new component type
| on every render and causes React to reset its state.
|--------------------------------------------------------------------------
*/

const NavigationButton = ({
  label,
  onClick,
  disabled = false,
  children,
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
      title={label}
      className={[
        "inline-flex h-9 min-w-9 items-center justify-center rounded-lg",
        "border border-gray-200 bg-white px-2",
        "text-sm font-medium text-gray-600",
        "transition-colors duration-150",
        "hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/30",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "dark:border-gray-700 dark:bg-gray-900",
        "dark:text-gray-300 dark:hover:bg-gray-800",
      ].join(" ")}
    >
      {children}
    </button>
  );
};

/*
|--------------------------------------------------------------------------
| Page Button
|--------------------------------------------------------------------------
*/

const PageButton = ({
  page,
  currentPage,
  disabled = false,
  onClick,
}) => {
  const isActive = page === currentPage;

  return (
    <button
      type="button"
      onClick={() => onClick(page)}
      disabled={disabled || isActive}
      aria-label={`Go to page ${page}`}
      aria-current={isActive ? "page" : undefined}
      className={[
        "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2",
        "border text-sm font-medium",
        "transition-colors duration-150",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/30",
        isActive
          ? [
            "border-blue-600 bg-blue-600 text-white",
            "dark:border-blue-500 dark:bg-blue-500",
          ].join(" ")
          : [
            "border-gray-200 bg-white text-gray-600",
            "hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900",
            "dark:border-gray-700 dark:bg-gray-900",
            "dark:text-gray-300 dark:hover:bg-gray-800",
          ].join(" "),
        "disabled:cursor-not-allowed",
      ].join(" ")}
    >
      {page}
    </button>
  );
};

/*
|--------------------------------------------------------------------------
| Ellipsis
|--------------------------------------------------------------------------
*/

const PaginationEllipsis = ({ position }) => {
  return (
    <span
      key={position}
      className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-sm text-gray-400 dark:text-gray-500"
      aria-hidden="true"
    >
      …
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| Tenancy Pagination
|--------------------------------------------------------------------------
*/

const TenancyPagination = ({
  pagination = {},
  currentPage,
  onPageChange,
  disabled = false,
  className = "",
}) => {
  /*
  |--------------------------------------------------------------------------
  | Normalize Pagination
  |--------------------------------------------------------------------------
  */

  const normalized = useMemo(() => {
    const page =
      Number(
        currentPage ??
        pagination?.current_page ??
        pagination?.currentPage ??
        1
      ) || 1;

    const lastPage =
      Number(
        pagination?.last_page ??
        pagination?.lastPage ??
        pagination?.pages ??
        1
      ) || 1;

    const perPage =
      Number(
        pagination?.per_page ??
        pagination?.perPage ??
        pagination?.page_size ??
        15
      ) || 15;

    const total =
      Number(
        pagination?.total ??
        pagination?.total_items ??
        pagination?.totalItems ??
        0
      ) || 0;

    const from =
      pagination?.from !== undefined &&
        pagination?.from !== null
        ? Number(pagination.from)
        : total === 0
          ? 0
          : (page - 1) * perPage + 1;

    const to =
      pagination?.to !== undefined &&
        pagination?.to !== null
        ? Number(pagination.to)
        : total === 0
          ? 0
          : Math.min(page * perPage, total);

    return {
      currentPage: Math.max(1, page),
      lastPage: Math.max(1, lastPage),
      perPage: Math.max(1, perPage),
      total: Math.max(0, total),
      from: Math.max(0, from),
      to: Math.max(0, to),
    };
  }, [pagination, currentPage]);

  const {
    currentPage: page,
    lastPage,
    total,
    from,
    to,
  } = normalized;

  /*
  |--------------------------------------------------------------------------
  | Navigation State
  |--------------------------------------------------------------------------
  */

  const hasPrevious = page > 1;
  const hasNext = page < lastPage;

  /*
  |--------------------------------------------------------------------------
  | Change Page
  |--------------------------------------------------------------------------
  */

  const goToPage = (targetPage) => {
    if (disabled) {
      return;
    }

    const nextPage = Number(targetPage);

    if (!Number.isFinite(nextPage)) {
      return;
    }

    const safePage = Math.min(
      Math.max(1, Math.floor(nextPage)),
      lastPage
    );

    if (safePage === page) {
      return;
    }

    if (typeof onPageChange === "function") {
      onPageChange(safePage);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Visible Pages
  |--------------------------------------------------------------------------
  */

  const visiblePages = useMemo(() => {
    const pages = [];

    /*
    |----------------------------------------------------------------------
    | Seven pages or fewer
    |----------------------------------------------------------------------
    */

    if (lastPage <= 7) {
      for (let i = 1; i <= lastPage; i += 1) {
        pages.push(i);
      }

      return pages;
    }

    /*
    |----------------------------------------------------------------------
    | Always show first page
    |----------------------------------------------------------------------
    */

    pages.push(1);

    /*
    |----------------------------------------------------------------------
    | Left Ellipsis
    |----------------------------------------------------------------------
    */

    if (page > 4) {
      pages.push("left-ellipsis");
    }

    /*
    |----------------------------------------------------------------------
    | Middle Pages
    |----------------------------------------------------------------------
    */

    const start = Math.max(2, page - 2);
    const end = Math.min(lastPage - 1, page + 2);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    /*
    |----------------------------------------------------------------------
    | Right Ellipsis
    |----------------------------------------------------------------------
    */

    if (page < lastPage - 3) {
      pages.push("right-ellipsis");
    }

    /*
    |----------------------------------------------------------------------
    | Always show last page
    |----------------------------------------------------------------------
    */

    pages.push(lastPage);

    return pages;
  }, [page, lastPage]);

  /*
  |--------------------------------------------------------------------------
  | No Results
  |--------------------------------------------------------------------------
  */

  if (total === 0) {
    return (
      <div
        className={[
          "flex flex-col gap-3 border-t border-gray-200 py-4",
          "sm:flex-row sm:items-center sm:justify-between",
          "dark:border-gray-700",
          className,
        ].join(" ")}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No tenancies to display.
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className={[
        "flex flex-col gap-4 border-t border-gray-200 py-4",
        "sm:flex-row sm:items-center sm:justify-between",
        "dark:border-gray-700",
        className,
      ].join(" ")}
    >
      {/* --------------------------------------------------------------- */}
      {/* Results Summary                                                 */}
      {/* --------------------------------------------------------------- */}

      <div className="flex-shrink-0">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {from.toLocaleString()}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {to.toLocaleString()}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {total.toLocaleString()}
          </span>{" "}
          tenancies
        </p>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* Pagination Controls                                             */}
      {/* --------------------------------------------------------------- */}

      <div className="flex items-center gap-1">
        {/* First Page */}
        <NavigationButton
          label="First page"
          ariaLabel="Go to first page"
          disabled={disabled || !hasPrevious}
          onClick={() => goToPage(1)}
        >
          <ChevronsLeft className="h-4 w-4" />
        </NavigationButton>

        {/* Previous Page */}
        <NavigationButton
          label="Previous page"
          ariaLabel="Go to previous page"
          disabled={disabled || !hasPrevious}
          onClick={() => goToPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </NavigationButton>

        {/* ------------------------------------------------------------- */}
        {/* Desktop Page Numbers                                          */}
        {/* ------------------------------------------------------------- */}

        <div className="mx-1 hidden items-center gap-1 sm:flex">
          {visiblePages.map((item, index) => {
            if (
              item === "left-ellipsis" ||
              item === "right-ellipsis"
            ) {
              return (
                <PaginationEllipsis
                  key={`${item}-${index}`}
                  position={`${item}-${index}`}
                />
              );
            }

            return (
              <PageButton
                key={item}
                page={item}
                currentPage={page}
                disabled={disabled}
                onClick={goToPage}
              />
            );
          })}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Mobile Page Indicator                                         */}
        {/* ------------------------------------------------------------- */}

        <div className="flex h-9 items-center px-2 sm:hidden">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Page {page} of {lastPage}
          </span>
        </div>

        {/* Next Page */}
        <NavigationButton
          label="Next page"
          ariaLabel="Go to next page"
          disabled={disabled || !hasNext}
          onClick={() => goToPage(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </NavigationButton>

        {/* Last Page */}
        <NavigationButton
          label="Last page"
          ariaLabel="Go to last page"
          disabled={disabled || !hasNext}
          onClick={() => goToPage(lastPage)}
        >
          <ChevronsRight className="h-4 w-4" />
        </NavigationButton>
      </div>
    </div>
  );
};

export default TenancyPagination;