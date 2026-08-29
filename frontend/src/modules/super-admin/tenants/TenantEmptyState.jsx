import {
  CircleUserRound,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserRoundSearch,
  X,
} from "lucide-react";


const TenantEmptyState = ({
  title,
  description,
  search = "",
  hasFilters = false,
  onClearFilters,
  onClearSearch,
  onCreate,
  onRefresh,
  compact = false,
}) => {
  /*
  |--------------------------------------------------------------------------
  | NORMALIZE SEARCH
  |--------------------------------------------------------------------------
  */

  const normalizedSearch = String(
    search || ""
  ).trim();

  const hasSearch =
    normalizedSearch.length > 0;

  /*
  |--------------------------------------------------------------------------
  | DETERMINE EMPTY STATE TYPE
  |--------------------------------------------------------------------------
  */

  const isFiltered =
    hasSearch || hasFilters;

  /*
  |--------------------------------------------------------------------------
  | DEFAULT CONTENT
  |--------------------------------------------------------------------------
  */

  let defaultTitle =
    "No tenants found";

  let defaultDescription =
    "There are currently no tenants matching your request.";

  if (isFiltered) {
    defaultTitle =
      "No matching tenants";

    defaultDescription = hasSearch
      ? `No tenants were found for "${normalizedSearch}". Try a different search term or clear your filters.`
      : "No tenants match the selected filters. Try changing or clearing your filters.";
  }

  /*
  |--------------------------------------------------------------------------
  | HANDLERS
  |--------------------------------------------------------------------------
  */

  const handleClearSearch = () => {
    if (
      typeof onClearSearch ===
      "function"
    ) {
      onClearSearch();
      return;
    }

    if (
      typeof onClearFilters ===
      "function"
    ) {
      onClearFilters();
    }
  };

  const handleClearFilters = () => {
    if (
      typeof onClearFilters ===
      "function"
    ) {
      onClearFilters();
      return;
    }

    if (
      typeof onClearSearch ===
      "function"
    ) {
      onClearSearch();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ICON
  |--------------------------------------------------------------------------
  */

  const EmptyIcon = isFiltered
    ? UserRoundSearch
    : CircleUserRound;

  /*
  |--------------------------------------------------------------------------
  | COMPACT VERSION
  |--------------------------------------------------------------------------
  */

  if (compact) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <EmptyIcon className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-gray-900">
          {title ||
            defaultTitle}
        </h3>

        <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-gray-500">
          {description ||
            defaultDescription}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {isFiltered && (
            <button
              type="button"
              onClick={
                hasSearch
                  ? handleClearSearch
                  : handleClearFilters
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                border
                border-gray-300
                bg-white
                px-3
                py-2
                text-xs
                font-medium
                text-gray-700
                transition
                hover:bg-gray-50
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500/20
              "
            >
              <X className="h-3.5 w-3.5" />

              Clear
            </button>
          )}

          {typeof onCreate ===
            "function" && (
              <button
                type="button"
                onClick={onCreate}
                className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-primary-600
                px-3
                py-2
                text-xs
                font-medium
                text-white
                transition
                hover:bg-primary-700
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500/30
              "
              >
                <Plus className="h-3.5 w-3.5" />

                Add Tenant
              </button>
            )}
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FULL EMPTY STATE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-12 shadow-sm">
      <div className="mx-auto max-w-lg text-center">
        {/* ==============================================================
            ICON
        ============================================================== */}

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <EmptyIcon className="h-10 w-10" />
        </div>

        {/* ==============================================================
            TITLE
        ============================================================== */}

        <h3 className="mt-6 text-lg font-semibold text-gray-900">
          {title ||
            defaultTitle}
        </h3>

        {/* ==============================================================
            DESCRIPTION
        ============================================================== */}

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
          {description ||
            defaultDescription}
        </p>

        {/* ==============================================================
            SEARCH INDICATOR
        ============================================================== */}

        {hasSearch && (
          <div className="mx-auto mt-5 inline-flex max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />

            <span className="truncate">
              Search:
            </span>

            <span className="max-w-[220px] truncate font-medium text-gray-900">
              "{normalizedSearch}"
            </span>
          </div>
        )}

        {/* ==============================================================
            FILTER INDICATOR
        ============================================================== */}

        {hasFilters && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600">
            <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />

            Active filters are applied
          </div>
        )}

        {/* ==============================================================
            ACTIONS
        ============================================================== */}

        <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
          {/* ------------------------------------------------------------
              CLEAR SEARCH
          ------------------------------------------------------------- */}

          {hasSearch &&
            typeof onClearSearch ===
            "function" && (
              <button
                type="button"
                onClick={
                  handleClearSearch
                }
                className="
                  inline-flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-gray-700
                  transition
                  hover:bg-gray-50
                  focus:outline-none
                  focus:ring-2
                  focus:ring-primary-500/20
                  sm:w-auto
                "
              >
                <X className="h-4 w-4" />

                Clear Search
              </button>
            )}

          {/* ------------------------------------------------------------
              CLEAR FILTERS
          ------------------------------------------------------------- */}

          {hasFilters &&
            typeof onClearFilters ===
            "function" && (
              <button
                type="button"
                onClick={
                  handleClearFilters
                }
                className="
                  inline-flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-gray-700
                  transition
                  hover:bg-gray-50
                  focus:outline-none
                  focus:ring-2
                  focus:ring-primary-500/20
                  sm:w-auto
                "
              >
                <SlidersHorizontal className="h-4 w-4" />

                Clear Filters
              </button>
            )}

          {/* ------------------------------------------------------------
              REFRESH
          ------------------------------------------------------------- */}

          {typeof onRefresh ===
            "function" && (
              <button
                type="button"
                onClick={onRefresh}
                className="
                inline-flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-gray-300
                bg-white
                px-4
                py-2.5
                text-sm
                font-medium
                text-gray-700
                transition
                hover:bg-gray-50
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500/20
                sm:w-auto
              "
              >
                <RefreshCw className="h-4 w-4" />

                Refresh
              </button>
            )}

          {/* ------------------------------------------------------------
              CREATE TENANT
          ------------------------------------------------------------- */}

          {typeof onCreate ===
            "function" && (
              <button
                type="button"
                onClick={onCreate}
                className="
                inline-flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-primary-600
                px-4
                py-2.5
                text-sm
                font-medium
                text-white
                shadow-sm
                transition
                hover:bg-primary-700
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500/30
                sm:w-auto
              "
              >
                <Plus className="h-4 w-4" />

                Add Tenant
              </button>
            )}
        </div>

        {/* ==============================================================
            HELPER MESSAGE
        ============================================================== */}

        {isFiltered && (
          <p className="mt-5 text-xs text-gray-400">
            Try adjusting your search
            or removing some filters to
            see more tenants.
          </p>
        )}
      </div>
    </div>
  );
};

export default TenantEmptyState;