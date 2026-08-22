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
 * Supports:
 * - No tenancies at all
 * - No search/filter results
 * - Clear filters action
 * - Create tenancy action
 * - Retry / reload action
 *
 * Example:
 *
 * <TenancyEmptyState
 *   onCreate={handleCreate}
 *   onClearFilters={handleClearFilters}
 * />
 *
 * Or:
 *
 * <TenancyEmptyState
 *   hasFilters
 *   onClearFilters={handleClearFilters}
 * />
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
  const normalizedSearchQuery =
    typeof searchQuery === "string"
      ? searchQuery.trim()
      : "";

  const hasSearch =
    normalizedSearchQuery.length > 0;

  const isFiltered =
    Boolean(hasFilters) || hasSearch;

  const displayTitle =
    title ||
    (isFiltered
      ? "No tenancies found"
      : "No tenancies yet");

  const displayDescription =
    description ||
    (isFiltered
      ? "We couldn't find any tenancies matching your current search or filters. Try adjusting your filters or search criteria."
      : "There are no tenancies in the system yet. Create a tenancy to get started.");

  const handleCreate = () => {
    if (typeof onCreate === "function") {
      onCreate();
    }
  };

  const handleClearFilters = () => {
    if (typeof onClearFilters === "function") {
      onClearFilters();
    }
  };

  const handleRetry = () => {
    if (
      !loading &&
      typeof onRetry === "function"
    ) {
      onRetry();
    }
  };

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex min-h-[420px] flex-col items-center justify-center px-5 py-12 text-center sm:px-6">
        {/* ================================================================== */}
        {/* ICON */}
        {/* ================================================================== */}

        <div className="relative mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            {isFiltered ? (
              <Search className="h-9 w-9" />
            ) : (
              <CalendarDays className="h-9 w-9" />
            )}
          </div>

          <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-gray-100 text-gray-500">
            {isFiltered ? (
              <FileSearch className="h-4 w-4" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
          </div>
        </div>

        {/* ================================================================== */}
        {/* TITLE */}
        {/* ================================================================== */}

        <h3 className="text-lg font-semibold text-gray-900">
          {displayTitle}
        </h3>

        {/* ================================================================== */}
        {/* DESCRIPTION */}
        {/* ================================================================== */}

        <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
          {displayDescription}
        </p>

        {/* ================================================================== */}
        {/* SEARCH INDICATOR */}
        {/* ================================================================== */}

        {hasSearch && (
          <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />

            <span className="truncate">
              Search:
            </span>

            <span className="max-w-[220px] truncate font-medium text-gray-800">
              "{normalizedSearchQuery}"
            </span>
          </div>
        )}

        {/* ================================================================== */}
        {/* ACTIONS */}
        {/* ================================================================== */}

        <div className="mt-7 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          {/* Clear filters */}

          {isFiltered &&
            typeof onClearFilters ===
            "function" && (
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
                  focus:outline-none
                  focus:ring-2
                  focus:ring-primary-500/20
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:w-auto
                "
              >
                <RefreshCw className="h-4 w-4" />

                {clearFiltersLabel}
              </button>
            )}

          {/* Retry */}

          {showRetryButton &&
            typeof onRetry ===
            "function" && (
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
                  focus:outline-none
                  focus:ring-2
                  focus:ring-primary-500/20
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:w-auto
                "
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading
                    ? "animate-spin"
                    : ""
                    }`}
                />

                {loading
                  ? "Loading..."
                  : retryLabel}
              </button>
            )}

          {/* Create tenancy */}

          {showCreateButton &&
            !isFiltered &&
            typeof onCreate ===
            "function" && (
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
                  bg-primary-600
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-primary-700
                  focus:outline-none
                  focus:ring-2
                  focus:ring-primary-500/30
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  sm:w-auto
                "
              >
                <Plus className="h-4 w-4" />

                {createLabel}
              </button>
            )}
        </div>

        {/* ================================================================== */}
        {/* HELPER INFORMATION */}
        {/* ================================================================== */}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
          <div className="inline-flex items-center gap-1.5">
            <UsersRound className="h-3.5 w-3.5" />
            <span>Tenant assignments</span>
          </div>

          <div className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span>Property & unit</span>
          </div>

          <div className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Tenancy dates</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenancyEmptyState;