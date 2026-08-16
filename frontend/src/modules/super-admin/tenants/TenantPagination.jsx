import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| TenantPagination
|--------------------------------------------------------------------------
| Handles Laravel pagination for the Tenant module.
|--------------------------------------------------------------------------
|
| Supported pagination shapes:
|
| {
|   current_page: 1,
|   last_page: 10,
|   per_page: 15,
|   total: 150,
|   from: 1,
|   to: 15
| }
|
| It also safely supports Laravel's nested:
|
| {
|   meta: {
|     current_page: 1,
|     last_page: 10,
|     ...
|   }
| }
|--------------------------------------------------------------------------
*/

const TenantPagination = ({
  pagination = {},
  onPageChange,
  onPerPageChange,
}) => {
  /*
  |--------------------------------------------------------------------------
  | NORMALIZE PAGINATION
  |--------------------------------------------------------------------------
  */

  const meta =
    pagination?.meta ||
    pagination?.data?.meta ||
    pagination ||
    {};

  /*
  |--------------------------------------------------------------------------
  | VALUES
  |--------------------------------------------------------------------------
  */

  const currentPage = Number(
    meta?.current_page || 1
  );

  const lastPage = Math.max(
    Number(meta?.last_page || 1),
    1
  );

  const perPage = Number(
    meta?.per_page || 15
  );

  const total = Number(
    meta?.total || 0
  );

  const from = Number(
    meta?.from || 0
  );

  const to = Number(
    meta?.to || 0
  );

  /*
  |--------------------------------------------------------------------------
  | NO PAGINATION
  |--------------------------------------------------------------------------
  */

  if (
    total <= 0 ||
    lastPage <= 1
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE CHANGE
  |--------------------------------------------------------------------------
  */

  const changePage = (page) => {
    const targetPage = Number(page);

    if (
      targetPage < 1 ||
      targetPage > lastPage ||
      targetPage === currentPage
    ) {
      return;
    }

    if (
      typeof onPageChange ===
      "function"
    ) {
      onPageChange(targetPage);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PER PAGE
  |--------------------------------------------------------------------------
  */

  const changePerPage = (event) => {
    const value = Number(
      event.target.value
    );

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return;
    }

    if (
      typeof onPerPageChange ===
      "function"
    ) {
      onPerPageChange(value);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PAGE RANGE
  |--------------------------------------------------------------------------
  | Keeps the pagination compact when there are many pages.
  |--------------------------------------------------------------------------
  */

  const getPageNumbers = () => {
    const pages = [];

    /*
    |--------------------------------------------------------------
    | Small number of pages
    |--------------------------------------------------------------
    */

    if (lastPage <= 7) {
      for (
        let page = 1;
        page <= lastPage;
        page++
      ) {
        pages.push(page);
      }

      return pages;
    }

    /*
    |--------------------------------------------------------------
    | Beginning
    |--------------------------------------------------------------
    */

    if (currentPage <= 4) {
      return [
        1,
        2,
        3,
        4,
        5,
        "...",
        lastPage,
      ];
    }

    /*
    |--------------------------------------------------------------
    | End
    |--------------------------------------------------------------
    */

    if (
      currentPage >=
      lastPage - 3
    ) {
      return [
        1,
        "...",
        lastPage - 4,
        lastPage - 3,
        lastPage - 2,
        lastPage - 1,
        lastPage,
      ];
    }

    /*
    |--------------------------------------------------------------
    | Middle
    |--------------------------------------------------------------
    */

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      lastPage,
    ];
  };

  const pageNumbers =
    getPageNumbers();

  /*
  |--------------------------------------------------------------------------
  | BUTTON BASE
  |--------------------------------------------------------------------------
  */

  const navigationButton = `
    inline-flex
    h-9
    min-w-9
    items-center
    justify-center
    rounded-lg
    border
    border-gray-300
    bg-white
    px-2
    text-sm
    font-medium
    text-gray-700
    shadow-sm
    transition
    hover:bg-gray-50
    focus:outline-none
    focus:ring-2
    focus:ring-primary-500/20
    disabled:cursor-not-allowed
    disabled:opacity-40
  `;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        {/* ==============================================================
            RESULTS INFORMATION
        ============================================================== */}

        <div className="flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:items-center sm:gap-2">
          <span>
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {from.toLocaleString()}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gray-900">
              {to.toLocaleString()}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-900">
              {total.toLocaleString()}
            </span>{" "}
            tenants
          </span>
        </div>

        {/* ==============================================================
            CONTROLS
        ============================================================== */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* ------------------------------------------------------------
              PER PAGE
          ------------------------------------------------------------ */}

          <div className="flex items-center gap-2">
            <label
              htmlFor="tenant-per-page"
              className="whitespace-nowrap text-sm text-gray-500"
            >
              Per page
            </label>

            <select
              id="tenant-per-page"
              value={perPage}
              onChange={changePerPage}
              className="
                h-9
                rounded-lg
                border
                border-gray-300
                bg-white
                px-2.5
                text-sm
                text-gray-700
                outline-none
                transition
                focus:border-primary-500
                focus:ring-2
                focus:ring-primary-500/20
              "
            >
              <option value={10}>
                10
              </option>

              <option value={15}>
                15
              </option>

              <option value={25}>
                25
              </option>

              <option value={50}>
                50
              </option>

              <option value={100}>
                100
              </option>
            </select>
          </div>

          {/* ------------------------------------------------------------
              PAGE NAVIGATION
          ------------------------------------------------------------ */}

          <nav
            className="flex items-center gap-1"
            aria-label="Tenant pagination"
          >
            {/* FIRST */}

            <button
              type="button"
              onClick={() =>
                changePage(1)
              }
              disabled={
                currentPage <= 1
              }
              className={navigationButton}
              aria-label="First page"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            {/* PREVIOUS */}

            <button
              type="button"
              onClick={() =>
                changePage(
                  currentPage - 1
                )
              }
              disabled={
                currentPage <= 1
              }
              className={navigationButton}
              aria-label="Previous page"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* PAGE NUMBERS */}

            <div className="hidden items-center gap-1 sm:flex">
              {pageNumbers.map(
                (page, index) => {
                  if (
                    page === "..."
                  ) {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="
                          inline-flex
                          h-9
                          min-w-9
                          items-center
                          justify-center
                          px-1
                          text-sm
                          text-gray-400
                        "
                      >
                        ...
                      </span>
                    );
                  }

                  const isCurrent =
                    page ===
                    currentPage;

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        changePage(
                          page
                        )
                      }
                      aria-current={
                        isCurrent
                          ? "page"
                          : undefined
                      }
                      className={`
                        inline-flex
                        h-9
                        min-w-9
                        items-center
                        justify-center
                        rounded-lg
                        px-2
                        text-sm
                        font-medium
                        transition
                        focus:outline-none
                        focus:ring-2
                        focus:ring-primary-500/20
                        ${isCurrent
                          ? "bg-primary-600 text-white shadow-sm"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }
                      `}
                    >
                      {page}
                    </button>
                  );
                }
              )}
            </div>

            {/* MOBILE PAGE INDICATOR */}

            <div className="flex h-9 items-center justify-center px-2 text-sm text-gray-600 sm:hidden">
              <span className="font-medium text-gray-900">
                {currentPage}
              </span>

              <span className="mx-1 text-gray-400">
                /
              </span>

              <span>
                {lastPage}
              </span>
            </div>

            {/* NEXT */}

            <button
              type="button"
              onClick={() =>
                changePage(
                  currentPage + 1
                )
              }
              disabled={
                currentPage >=
                lastPage
              }
              className={navigationButton}
              aria-label="Next page"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* LAST */}

            <button
              type="button"
              onClick={() =>
                changePage(lastPage)
              }
              disabled={
                currentPage >=
                lastPage
              }
              className={navigationButton}
              aria-label="Last page"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default TenantPagination;