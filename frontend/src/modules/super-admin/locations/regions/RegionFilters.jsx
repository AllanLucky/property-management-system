
import {
  Search,
  Filter,
  RotateCcw,
  X,
  Globe2,
  MapPin,
  CheckCircle2,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Region Filters
|--------------------------------------------------------------------------
*/

const RegionFilters = ({
  filters = {},
  onFilterChange,
  onReset,
  countries = [],
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
    filters.country_id,
  ].filter((value) => value !== undefined && value !== null && value !== "")
    .length;

  const hasFilters = activeFilters > 0;

  /*
  |--------------------------------------------------------------------------
  | Country Helpers
  |--------------------------------------------------------------------------
  */

  const getCountryId = (country) => {
    return country?.id ?? "";
  };

  const getCountryName = (country) => {
    return country?.name || "Unknown Country";
  };

  const getCountryCode = (country) => {
    return country?.code ? ` (${country.code})` : "";
  };

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
                Filter Regions
              </h3>

              {hasFilters && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                  {activeFilters} Active
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Search and filter registered regions
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
            Search Regions
          </label>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={filters.search || ""}
              onChange={(e) =>
                handleChange("search", e.target.value)
              }
              placeholder="Search region name or code..."
              disabled={loading}
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-10 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
            />

            {filters.search && (
              <button
                type="button"
                onClick={() => handleChange("search", "")}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700 disabled:cursor-not-allowed"
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
            Region Status
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

        {/* Country */}

        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-gray-600">
            Country
          </label>

          <div className="relative">
            <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              value={filters.country_id || ""}
              onChange={(e) =>
                handleChange("country_id", e.target.value)
              }
              disabled={loading}
              className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-10 pr-9 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All Countries</option>

              {countries.map((country) => {
                const countryId = getCountryId(country);

                if (!countryId) return null;

                return (
                  <option key={countryId} value={countryId}>
                    {getCountryName(country)}
                    {getCountryCode(country)}
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

          {/* Search Filter */}

          {filters.search && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700">
              <Search className="h-3 w-3" />

              <span className="max-w-[180px] truncate">
                Search: {filters.search}
              </span>

              <button
                type="button"
                onClick={() => handleChange("search", "")}
                disabled={loading}
                aria-label="Remove search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Status Filter */}

          {filters.status && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium capitalize text-emerald-700">
              <MapPin className="h-3 w-3" />

              {filters.status}

              <button
                type="button"
                onClick={() => handleChange("status", "")}
                disabled={loading}
                aria-label="Remove status filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Country Filter */}

          {filters.country_id && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700">
              <Globe2 className="h-3 w-3" />

              {countries.find(
                (country) =>
                  String(country.id) === String(filters.country_id)
              )?.name || `Country ID: ${filters.country_id}`}

              <button
                type="button"
                onClick={() => handleChange("country_id", "")}
                disabled={loading}
                aria-label="Remove country filter"
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

export default RegionFilters;
