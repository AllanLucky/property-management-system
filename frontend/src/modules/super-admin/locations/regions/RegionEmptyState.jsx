
import {
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Globe2,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| REGION EMPTY STATE
|--------------------------------------------------------------------------
*/

const RegionEmptyState = ({
  search = "",
  hasFilters = false,
  title,
  description,
  onCreate,
  onReset,
  showCreate = true,
  showReset = true,
  className = "",
}) => {
  const hasSearch = Boolean(search?.trim());

  /*
  |--------------------------------------------------------------------------
  | Default Content
  |--------------------------------------------------------------------------
  */

  const defaultTitle = hasSearch
    ? "No matching regions found"
    : hasFilters
      ? "No regions match your filters"
      : "No regions available";

  const defaultDescription = hasSearch
    ? `We couldn't find any regions matching "${search.trim()}". Try another search term.`
    : hasFilters
      ? "No regions match your current filter settings. Try adjusting or clearing your filters."
      : "You haven't added any regions yet. Create your first region to get started.";

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className={`flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      {/* ================================================================
          ICON
      ================================================================ */}

      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50">
        <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200">
          <Search className="h-3.5 w-3.5 text-slate-600" />
        </div>

        <MapPin className="h-9 w-9 text-slate-400" />
      </div>

      {/* ================================================================
          TITLE AND DESCRIPTION
      ================================================================ */}

      <div className="mt-5 max-w-md">
        <h3 className="text-lg font-bold tracking-tight text-slate-900">
          {title || defaultTitle}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {description || defaultDescription}
        </p>
      </div>

      {/* ================================================================
          ACTION BUTTONS
      ================================================================ */}

      {(showCreate || (showReset && (hasFilters || hasSearch))) && (
        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row">

          {/* Clear Filters */}

          {showReset && (hasFilters || hasSearch) && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <RotateCcw className="h-4 w-4" />
              Clear Filters
            </button>
          )}

          {/* Add Region */}

          {showCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Add Region
            </button>
          )}
        </div>
      )}

      {/* ================================================================
          HELPFUL INFORMATION
      ================================================================ */}

      {!hasSearch && !hasFilters && (
        <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
          <Globe2 className="h-4 w-4" />

          <span>
            Manage regions across your registered countries
          </span>
        </div>
      )}
    </div>
  );
};

export default RegionEmptyState;
