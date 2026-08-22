import { useCallback, useMemo } from "react";
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

/**
 * Safely convert a value to a positive integer.
 */
const toPositiveInteger = (value, fallback = 0) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(0, Math.floor(number));
};

/**
 * Safely get the first usable value from an object.
 */
const firstValue = (source, keys, fallback = undefined) => {
  if (
    !source ||
    typeof source !== "object"
  ) {
    return fallback;
  }

  for (const key of keys) {
    const value = source[key];

    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      return value;
    }
  }

  return fallback;
};

/**
 * Normalize a pagination object.
 *
 * Supports common Laravel paginator formats:
 *
 * {
 *   current_page,
 *   last_page,
 *   per_page,
 *   total,
 *   from,
 *   to
 * }
 *
 * Also supports:
 *
 * currentPage
 * lastPage
 * perPage
 * page_size
 * total_items
 * totalItems
 */
const normalizePagination = (
  pagination,
  currentPage
) => {
  const source =
    pagination &&
    typeof pagination === "object"
      ? pagination
      : {};

  /*
  |--------------------------------------------------------------------------
  | Current Page
  |--------------------------------------------------------------------------
  */

  const requestedPage = toPositiveInteger(
    currentPage ??
      firstValue(source, [
        "current_page",
        "currentPage",
        "page",
      ], 1),
    1
  );

  /*
  |--------------------------------------------------------------------------
  | Last Page
  |--------------------------------------------------------------------------
  */

  let lastPage = toPositiveInteger(
    firstValue(source, [
      "last_page",
      "lastPage",
      "pages",
      "total_pages",
      "totalPages",
    ], 1),
    1
  );

  /*
  |--------------------------------------------------------------------------
  | Per Page
  |--------------------------------------------------------------------------
  */

  const perPage = Math.max(
    1,
    toPositiveInteger(
      firstValue(source, [
        "per_page",
        "perPage",
        "page_size",
        "pageSize",
        "limit",
      ], 15),
      15
    )
  );

  /*
  |--------------------------------------------------------------------------
  | Total
  |--------------------------------------------------------------------------
  */

  const total = toPositiveInteger(
    firstValue(source, [
      "total",
      "total_items",
      "totalItems",
      "count",
    ], 0),
    0
  );

  /*
  |--------------------------------------------------------------------------
  | Calculate Last Page When Missing
  |--------------------------------------------------------------------------
  */

  if (
    lastPage <= 1 &&
    total > 0 &&
    perPage > 0
  ) {
    lastPage = Math.max(
      1,
      Math.ceil(total / perPage)
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Normalize Current Page
  |--------------------------------------------------------------------------
  */

  const page = Math.min(
    Math.max(1, requestedPage || 1),
    Math.max(1, lastPage)
  );

  /*
  |--------------------------------------------------------------------------
  | From
  |--------------------------------------------------------------------------
  */

  const rawFrom = firstValue(
    source,
    ["from"],
    undefined
  );

  const from =
    rawFrom !== undefined
      ? Math.max(
          0,
          toPositiveInteger(rawFrom, 0)
        )
      : total === 0
        ? 0
        : (page - 1) * perPage + 1;

  /*
  |--------------------------------------------------------------------------
  | To
  |--------------------------------------------------------------------------
  */

  const rawTo = firstValue(
    source,
    ["to"],
    undefined
  );

  const calculatedTo =
    total === 0
      ? 0
      : Math.min(
          page * perPage,
          total
        );

  const to =
    rawTo !== undefined
      ? Math.max(
          0,
          Math.min(
            toPositiveInteger(rawTo, 0),
            total
          )
        )
      : calculatedTo;

  return {
    currentPage: page,
    lastPage: Math.max(1, lastPage),
    perPage,
    total,
    from,
    to,
  };
};

/*
|--------------------------------------------------------------------------
| Navigation Button
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Keep this component outside TenancyPagination.
|
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
      aria-current={
        isActive ? "page" : undefined
      }
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

const PaginationEllipsis = ({
  position,
}) => {
  return (
    <span
      key={position}
      className="
        inline-flex
        h-9
        min-w-9
        items-center
        justify-center
        px-1
        text-sm
        text-gray-400
        dark:text-gray-500
      "
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

  const normalized = useMemo(
    () =>
      normalizePagination(
        pagination,
        currentPage
      ),
    [pagination, currentPage]
  );

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

  const goToPage = useCallback(
    (targetPage) => {
      if (disabled) {
        return;
      }

      const numericPage = Number(
        targetPage
      );

      if (
        !Number.isFinite(
          numericPage
        )
      ) {
        return;
      }

      const safePage = Math.min(
        Math.max(
          1,
          Math.floor(numericPage)
        ),
        lastPage
      );

      /*
      |----------------------------------------------------------------------
      | Do not trigger callback for current page.
      |----------------------------------------------------------------------
      */

      if (safePage === page) {
        return;
      }

      if (
        typeof onPageChange ===
        "function"
      ) {
        onPageChange(safePage);
      }
    },
    [
      disabled,
      lastPage,
      page,
      onPageChange,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Visible Pages
  |--------------------------------------------------------------------------
  */

  const visiblePages = useMemo(() => {
    const pages = [];

    /*
    |--------------------------------------------------------------------------
    | Seven Pages Or Fewer
    |--------------------------------------------------------------------------
    */

    if (lastPage <= 7) {
      for (
        let index = 1;
        index <= lastPage;
        index += 1
      ) {
        pages.push(index);
      }

      return pages;
    }

    /*
    |--------------------------------------------------------------------------
    | First Page
    |--------------------------------------------------------------------------
    */

    pages.push(1);

    /*
    |--------------------------------------------------------------------------
    | Left Ellipsis
    |--------------------------------------------------------------------------
    */

    if (page > 4) {
      pages.push("left-ellipsis");
    }

    /*
    |--------------------------------------------------------------------------
    | Middle Pages
    |--------------------------------------------------------------------------
    */

    const start = Math.max(
      2,
      page - 2
    );

    const end = Math.min(
      lastPage - 1,
      page + 2
    );

    for (
      let index = start;
      index <= end;
      index += 1
    ) {
      pages.push(index);
    }

    /*
    |--------------------------------------------------------------------------
    | Right Ellipsis
    |--------------------------------------------------------------------------
    */

    if (
      page <
      lastPage - 3
    ) {
      pages.push(
        "right-ellipsis"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Last Page
    |--------------------------------------------------------------------------
    */

    pages.push(lastPage);

    /*
    |--------------------------------------------------------------------------
    | Remove Accidental Duplicates
    |--------------------------------------------------------------------------
    */

    return pages.filter(
      (item, index, array) =>
        array.indexOf(item) === index
    );
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
      {/* ================================================================
          RESULTS SUMMARY
      ================================================================ */}

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

      {/* ================================================================
          PAGINATION CONTROLS
      ================================================================ */}

      <div className="flex items-center gap-1">
        {/* First Page */}
        <NavigationButton
          label="First page"
          ariaLabel="Go to first page"
          disabled={
            disabled ||
            !hasPrevious
          }
          onClick={() =>
            goToPage(1)
          }
        >
          <ChevronsLeft className="h-4 w-4" />
        </NavigationButton>

        {/* Previous Page */}
        <NavigationButton
          label="Previous page"
          ariaLabel="Go to previous page"
          disabled={
            disabled ||
            !hasPrevious
          }
          onClick={() =>
            goToPage(page - 1)
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </NavigationButton>

        {/* ============================================================
            DESKTOP PAGE NUMBERS
        ============================================================ */}

        <div className="mx-1 hidden items-center gap-1 sm:flex">
          {visiblePages.map(
            (item, index) => {
              if (
                item ===
                  "left-ellipsis" ||
                item ===
                  "right-ellipsis"
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
                  key={`page-${item}`}
                  page={item}
                  currentPage={page}
                  disabled={disabled}
                  onClick={
                    goToPage
                  }
                />
              );
            }
          )}
        </div>

        {/* ============================================================
            MOBILE PAGE INDICATOR
        ============================================================ */}

        <div className="flex h-9 items-center px-2 sm:hidden">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Page {page} of{" "}
            {lastPage}
          </span>
        </div>

        {/* Next Page */}
        <NavigationButton
          label="Next page"
          ariaLabel="Go to next page"
          disabled={
            disabled ||
            !hasNext
          }
          onClick={() =>
            goToPage(page + 1)
          }
        >
          <ChevronRight className="h-4 w-4" />
        </NavigationButton>

        {/* Last Page */}
        <NavigationButton
          label="Last page"
          ariaLabel="Go to last page"
          disabled={
            disabled ||
            !hasNext
          }
          onClick={() =>
            goToPage(lastPage)
          }
        >
          <ChevronsRight className="h-4 w-4" />
        </NavigationButton>
      </div>
    </div>
  );
};

export default TenancyPagination;