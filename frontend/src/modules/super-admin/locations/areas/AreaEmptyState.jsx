
import {
  MapPin,
  Search,
  Plus,
  RotateCcw,
  FilterX,
  Globe2,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Area Empty State
|--------------------------------------------------------------------------
*/

const AreaEmptyState = ({
  search = "",
  hasFilters = false,
  loading = false,
  onCreate,
  onReset,
  title,
  description,
  showCreateButton = true,
  showResetButton = true,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Determine Empty State Type
  |--------------------------------------------------------------------------
  */

  const hasSearch = Boolean(search?.trim());

  const isFiltered = hasFilters || hasSearch;

  const defaultTitle = isFiltered
    ? "No Areas Found"
    : "No Areas Available";

  const defaultDescription = isFiltered
    ? "We couldn't find any areas matching your current search or filters. Try adjusting your filters or search again."
    : "There are currently no areas registered in the system. Start by adding your first area.";

  /*
  |--------------------------------------------------------------------------
  | Icon Configuration
  |--------------------------------------------------------------------------
  */

  const EmptyIcon = isFiltered ? Search : MapPin;

  /*
  |--------------------------------------------------------------------------
  | Handlers
  |--------------------------------------------------------------------------
  */

  const handleCreate = () => {
    if (!loading) {
      onCreate?.();
    }
  };

  const handleReset = () => {
    if (!loading) {
      onReset?.();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="flex min-h-[360px] w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-12 shadow-sm sm:px-8">
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">

        {/* Icon */}

        <div className="relative mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50">
            <EmptyIcon className="h-9 w-9 text-indigo-500" />
          </div>

          <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border-4 border-white bg-gray-100">
            {isFiltered ? (
              <FilterX className="h-4 w-4 text-gray-500" />
            ) : (
              <Globe2 className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </div>

        {/* Heading */}

        <h3 className="text-lg font-bold text-gray-900">
          {title || defaultTitle}
        </h3>

        {/* Description */}

        <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
          {description || defaultDescription}
        </p>

        {/* Search Information */}

        {hasSearch && (
          <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />

            <span className="truncate text-xs font-medium text-gray-600">
              Search: {search}
            </span>
          </div>
        )}

        {/* Actions */}

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">

          {/* Reset Filters */}

          {isFiltered && showResetButton && onReset && (
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Clear Filters
            </button>
          )}

          {/* Create Area */}

          {!isFiltered && showCreateButton && onCreate && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add First Area
            </button>
          )}

          {/* Create Area When Filtered */}

          {isFiltered && showCreateButton && onCreate && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Area
            </button>
          )}
        </div>

        {/* Footer Note */}

        {!isFiltered && (
          <p className="mt-6 text-xs text-gray-400">
            Area records help organize properties across cities, counties, regions, and countries.
          </p>
        )}
      </div>
    </div>
  );
};

export default AreaEmptyState;
