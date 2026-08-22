import {
  Building2,
  CalendarDays,
  FileSearch,
  Plus,
  RefreshCw,
  Search,
  UsersRound,
} from "lucide-react";

/**
 * ============================================================================
 * TENANCY EMPTY STATE
 * ============================================================================
 *
 * Reusable empty state for the Tenancy module.
 *
 * Handles:
 * - No tenancy records
 * - No search results
 * - No filter results
 * - Clearing filters
 * - Creating a tenancy
 * - Retrying a failed/empty request
 *
 * Props:
 * - hasFilters
 * - searchQuery
 * - onCreate
 * - onClearFilters
 * - onRetry
 * - title
 * - description
 * - createLabel
 * - clearFiltersLabel
 * - retryLabel
 * - showCreateButton
 * - showRetryButton
 * - loading
 * - className
 */

const TenancyEmptyState = ({
  hasFilters = false,
  searchQuery = "",
  onCreate,
  onClearFilters,
  onRetry,

  title,
  description,

  createLabel = "Create Tenancy",
  clearFiltersLabel = "Clear Filters",
  retryLabel = "Try Again",

  showCreateButton = true,
  showRetryButton = false,

  loading = false,
  className = "",
}) => {
  /*
  |--------------------------------------------------------------------------
  | NORMALIZE SEARCH
  |--------------------------------------------------------------------------
  */

  const normalizedSearchQuery =
    typeof searchQuery === "string"
      ? searchQuery.trim()
      : "";

  const hasSearch = normalizedSearchQuery.length > 0;

  /*
  |--------------------------------------------------------------------------
  | DETERMINE EMPTY STATE TYPE
  |--------------------------------------------------------------------------
  */

  const isFiltered = Boolean(hasFilters) || hasSearch;

  /*
  |--------------------------------------------------------------------------
  | DISPLAY CONTENT
  |--------------------------------------------------------------------------
  */

  const displayTitle =
    title ||
    (isFiltered
      ? "No tenancies found"
      : "No tenancies yet");

  const displayDescription =
    description ||
    (isFiltered
      ? "We couldn't find any tenancies matching your current search or filters. Try adjusting your search criteria or clearing the filters."
      : "There are currently no tenancy records in the system. Create your first tenancy to get started.");

  /*
  |--------------------------------------------------------------------------
  | SAFE HANDLERS
  |--------------------------------------------------------------------------
  */

  const handleCreate = () => {
    if (
      loading ||
      typeof onCreate !== "function"
    ) {
      return;
    }

    onCreate();
  };

  const handleClearFilters = () => {
    if (
      loading ||
      typeof onClearFilters !== "function"
    ) {
      return;
    }

    onClearFilters();
  };

  const handleRetry = () => {
    if (
      loading ||
      typeof onRetry !== "function"
    ) {
      return;
    }

    onRetry();
  };

  /*
  |--------------------------------------------------------------------------
  | BUTTON VISIBILITY
  |--------------------------------------------------------------------------
  */

  const canClearFilters =
    isFiltered &&
    typeof onClearFilters === "function";

  const canRetry =
    showRetryButton &&
    typeof onRetry === "function";

  const canCreate =
    showCreateButton &&
    !isFiltered &&
    typeof onCreate === "function";

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className={[
        "rounded-xl",
        "border",
        "border-gray-200",
        "bg-white",
        "shadow-sm",
        "dark:border-gray-700",
        "dark:bg-gray-800",
        className,
      ].join(" ")}
    >
      <div
        className="
          flex
          min-h-[420px]
          flex-col
          items-center
          justify-center
          px-5
          py-12
          text-center
          sm:px-6
        "
      >
        {/* ==================================================================
            ICON
        ================================================================== */}

        <div className="relative mb-6">
          <div
            className="
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-2xl
              bg-indigo-50
              text-indigo-600
              dark:bg-indigo-950/40
              dark:text-indigo-400
            "
          >
            {isFiltered ? (
              <Search className="h-9 w-9" />
            ) : (
              <CalendarDays className="h-9 w-9" />
            )}
          </div>

          <div
            className="
              absolute
              -bottom-2
              -right-2
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              border-4
              border-white
              bg-gray-100
              text-gray-500
              dark:border-gray-800
              dark:bg-gray-700
              dark:text-gray-300
            "
          >
            {isFiltered ? (
              <FileSearch className="h-4 w-4" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
          </div>
        </div>

        {/* ==================================================================
            TITLE
        ================================================================== */}

        <h3
          className="
            text-lg
            font-semibold
            text-gray-900
            dark:text-white
          "
        >
          {displayTitle}
        </h3>

        {/* ==================================================================
            DESCRIPTION
        ================================================================== */}

        <p
          className="
            mt-2
            max-w-lg
            text-sm
            leading-6
            text-gray-500
            dark:text-gray-400
          "
        >
          {displayDescription}
        </p>

        {/* ==================================================================
            SEARCH INDICATOR
        ================================================================== */}

        {hasSearch && (
          <div
            className="
              mt-4
              inline-flex
              max-w-full
              items-center
              gap-2
              rounded-lg
              border
              border-gray-200
              bg-gray-50
              px-3
              py-2
              text-sm
              text-gray-600
              dark:border-gray-700
              dark:bg-gray-900
              dark:text-gray-400
            "
          >
            <Search
              className="
                h-4
                w-4
                shrink-0
                text-gray-400
                dark:text-gray-500
              "
            />

            <span className="shrink-0">
              Search:
            </span>

            <span
              className="
                max-w-[220px]
                truncate
                font-medium
                text-gray-800
                dark:text-gray-200
              "
              title={normalizedSearchQuery}
            >
              "{normalizedSearchQuery}"
            </span>
          </div>
        )}

        {/* ==================================================================
            ACTIONS
        ================================================================== */}

        {(canClearFilters ||
          canRetry ||
          canCreate) && (
            <div
              className="
              mt-7
              flex
              w-full
              flex-col
              items-center
              justify-center
              gap-3
              sm:w-auto
              sm:flex-row
            "
            >
              {/* --------------------------------------------------------------
                CLEAR FILTERS
            -------------------------------------------------------------- */}

              {canClearFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={loading}
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
                  px-5
                  py-2.5
                  text-sm
                  font-medium
                  text-gray-700
                  shadow-sm
                  transition
                  hover:bg-gray-50
                  hover:text-gray-900
                  focus:outline-none
                  focus:ring-2
                  focus:ring-indigo-500/20
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:w-auto
                  dark:border-gray-600
                  dark:bg-gray-800
                  dark:text-gray-300
                  dark:hover:bg-gray-700
                  dark:hover:text-white
                "
                >
                  <RefreshCw
                    className="
                    h-4
                    w-4
                  "
                  />

                  {clearFiltersLabel}
                </button>
              )}

              {/* --------------------------------------------------------------
                RETRY
            -------------------------------------------------------------- */}

              {canRetry && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={loading}
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
                  px-5
                  py-2.5
                  text-sm
                  font-medium
                  text-gray-700
                  shadow-sm
                  transition
                  hover:bg-gray-50
                  hover:text-gray-900
                  focus:outline-none
                  focus:ring-2
                  focus:ring-indigo-500/20
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:w-auto
                  dark:border-gray-600
                  dark:bg-gray-800
                  dark:text-gray-300
                  dark:hover:bg-gray-700
                  dark:hover:text-white
                "
                >
                  <RefreshCw
                    className={[
                      "h-4 w-4",
                      loading ? "animate-spin" : "",
                    ].join(" ")}
                  />

                  {loading
                    ? "Loading..."
                    : retryLabel}
                </button>
              )}

              {/* --------------------------------------------------------------
                CREATE TENANCY
            -------------------------------------------------------------- */}

              {canCreate && (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className="
                  inline-flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-indigo-600
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-indigo-700
                  focus:outline-none
                  focus:ring-2
                  focus:ring-indigo-500/30
                  focus:ring-offset-2
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  sm:w-auto
                  dark:bg-indigo-500
                  dark:hover:bg-indigo-600
                "
                >
                  <Plus className="h-4 w-4" />

                  {createLabel}
                </button>
              )}
            </div>
          )}

        {/* ==================================================================
            HELPER INFORMATION
        ================================================================== */}

        <div
          className="
            mt-8
            flex
            flex-wrap
            items-center
            justify-center
            gap-x-5
            gap-y-2
            text-xs
            text-gray-400
            dark:text-gray-500
          "
        >
          <div className="inline-flex items-center gap-1.5">
            <UsersRound className="h-3.5 w-3.5" />

            <span>
              Tenant assignments
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />

            <span>
              Property & unit
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />

            <span>
              Tenancy dates
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenancyEmptyState;