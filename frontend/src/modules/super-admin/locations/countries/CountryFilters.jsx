
import {
  Search,
  Filter,
  RotateCcw,
  X,
  Globe2,
  Coins,
  CheckCircle2,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Country Filters
|--------------------------------------------------------------------------
*/

const FiltersCountry = ({
  filters = {},
  onFilterChange,
  onReset,
  currencies = [],
  loading = false,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Handlers
  |--------------------------------------------------------------------------
  */

  const handleChange = (name, value) => {
    onFilterChange?.({
      ...filters,
      [name]: value,
    });
  };

  const handleReset = () => {
    onReset?.();
  };

  /*
  |--------------------------------------------------------------------------
  | Active Filters
  |--------------------------------------------------------------------------
  */

  const activeFilters = [
    filters.search,
    filters.status,
    filters.currency,
  ].filter(Boolean).length;

  const hasFilters = activeFilters > 0;

  return (
    <div className="min-w-0 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <Filter className="h-5 w-5 text-indigo-600" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">
                Filter Countries
              </h3>

              {hasFilters && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                  {activeFilters} Active
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Search and filter registered countries
            </p>
          </div>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Filters */}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Search */}

        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-gray-600">
            Search Countries
          </label>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={filters.search || ""}
              onChange={(e) =>
                handleChange("search", e.target.value)
              }
              placeholder="Search name, code or currency..."
              disabled={loading}
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-10 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
            />

            {filters.search && (
              <button
                type="button"
                onClick={() => handleChange("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status */}

        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-gray-600">
            Country Status
          </label>

          <div className="relative">
            <CheckCircle2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              value={filters.status || ""}
              onChange={(e) =>
                handleChange("status", e.target.value)
              }
              disabled={loading}
              className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-10 pr-9 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              ▼
            </span>
          </div>
        </div>

        {/* Currency */}

        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-gray-600">
            Currency
          </label>

          <div className="relative">
            <Coins className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              value={filters.currency || ""}
              onChange={(e) =>
                handleChange("currency", e.target.value)
              }
              disabled={loading}
              className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-10 pr-9 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All Currencies</option>

              {currencies.map((currency) => {
                const code =
                  typeof currency === "string"
                    ? currency
                    : currency.code;

                if (!code) return null;

                return (
                  <option key={code} value={code}>
                    {code}
                  </option>
                );
              })}
            </select>

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* Active Filter Summary */}

      {hasFilters && (
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          <span className="text-xs font-semibold text-gray-500">
            Active filters:
          </span>

          {filters.search && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700">
              <Search className="h-3 w-3" />
              Search: {filters.search}

              <button
                type="button"
                onClick={() => handleChange("search", "")}
                aria-label="Remove search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.status && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium capitalize text-emerald-700">
              <Globe2 className="h-3 w-3" />
              {filters.status}

              <button
                type="button"
                onClick={() => handleChange("status", "")}
                aria-label="Remove status filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.currency && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700">
              <Coins className="h-3 w-3" />
              {filters.currency}

              <button
                type="button"
                onClick={() => handleChange("currency", "")}
                aria-label="Remove currency filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FiltersCountry;
