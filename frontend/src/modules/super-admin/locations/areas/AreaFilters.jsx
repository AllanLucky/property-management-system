
import {
  Search,
  Filter,
  RotateCcw,
  X,
  Globe2,
  MapPin,
  CheckCircle2,
  Layers3,
  Building2,
  Home,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Area Filters
|--------------------------------------------------------------------------
*/

const AreaFilters = ({
  filters = {},
  onFilterChange,
  onReset,
  countries = [],
  regions = [],
  counties = [],
  cities = [],
  loading = false,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Handlers
  |--------------------------------------------------------------------------
  */

  const handleChange = (name, value) => {
    const updatedFilters = {
      ...filters,
      [name]: value,
    };

    // Country changes reset all dependent locations.
    if (name === "country_id") {
      updatedFilters.region_id = "";
      updatedFilters.county_id = "";
      updatedFilters.city_id = "";
    }

    // Region changes reset county and city.
    if (name === "region_id") {
      updatedFilters.county_id = "";
      updatedFilters.city_id = "";
    }

    // County changes reset city.
    if (name === "county_id") {
      updatedFilters.city_id = "";
    }

    onFilterChange?.(updatedFilters);
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
    filters.region_id,
    filters.county_id,
    filters.city_id,
  ].filter(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  ).length;

  const hasFilters = activeFilters > 0;

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  const getId = (record) => record?.id ?? "";

  const getName = (record, fallback) =>
    record?.name || fallback;

  const getCode = (record) =>
    record?.code ? ` (${record.code})` : "";

  /*
  |--------------------------------------------------------------------------
  | Filter Regions By Country
  |--------------------------------------------------------------------------
  */

  const filteredRegions = filters.country_id
    ? regions.filter(
      (region) =>
        String(region.country_id) ===
        String(filters.country_id)
    )
    : regions;

  /*
  |--------------------------------------------------------------------------
  | Filter Counties By Country And Region
  |--------------------------------------------------------------------------
  */

  const filteredCounties = counties.filter((county) => {
    const matchesCountry =
      !filters.country_id ||
      String(county.country_id) ===
      String(filters.country_id);

    const matchesRegion =
      !filters.region_id ||
      String(county.region_id) ===
      String(filters.region_id);

    return matchesCountry && matchesRegion;
  });

  /*
  |--------------------------------------------------------------------------
  | Filter Cities By Country, Region And County
  |--------------------------------------------------------------------------
  */

  const filteredCities = cities.filter((city) => {
    const matchesCountry =
      !filters.country_id ||
      String(city.country_id) ===
      String(filters.country_id);

    const matchesRegion =
      !filters.region_id ||
      String(city.region_id) ===
      String(filters.region_id);

    const matchesCounty =
      !filters.county_id ||
      String(city.county_id) ===
      String(filters.county_id);

    return (
      matchesCountry &&
      matchesRegion &&
      matchesCounty
    );
  });

  /*
  |--------------------------------------------------------------------------
  | Selected Filter Records
  |--------------------------------------------------------------------------
  */

  const selectedCountry = countries.find(
    (country) =>
      String(country.id) === String(filters.country_id)
  );

  const selectedRegion = regions.find(
    (region) =>
      String(region.id) === String(filters.region_id)
  );

  const selectedCounty = counties.find(
    (county) =>
      String(county.id) === String(filters.county_id)
  );

  const selectedCity = cities.find(
    (city) =>
      String(city.id) === String(filters.city_id)
  );

  /*
  |--------------------------------------------------------------------------
  | Reusable Select Styling
  |--------------------------------------------------------------------------
  */

  const selectClass =
    "h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-10 pr-9 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50";

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">

      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <Filter className="h-5 w-5 text-indigo-600" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">
                Filter Areas
              </h3>

              {hasFilters && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                  {activeFilters} Active
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Search and filter registered areas by geographical
              location and status
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

      {/* ================================================================
          FILTER INPUTS
      ================================================================ */}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

        {/* --------------------------------------------------------------
            Search
        -------------------------------------------------------------- */}

        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-gray-600">
            Search Areas
          </label>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={filters.search || ""}
              onChange={(e) =>
                handleChange("search", e.target.value)
              }
              placeholder="Search area name or code..."
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

        {/* --------------------------------------------------------------
            Status
        -------------------------------------------------------------- */}

        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-gray-600">
            Area Status
          </label>

          <div className="relative">
            <CheckCircle2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              value={filters.status || ""}
              onChange={(e) =>
                handleChange("status", e.target.value)
              }
              disabled={loading}
              className={selectClass}
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

        {/* --------------------------------------------------------------
            Country
        -------------------------------------------------------------- */}

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
              className={selectClass}
            >
              <option value="">All Countries</option>

              {countries.map((country) => {
                const countryId = getId(country);

                if (!countryId) return null;

                return (
                  <option key={countryId} value={countryId}>
                    {getName(country, "Unknown Country")}
                    {getCode(country)}
                  </option>
                );
              })}
            </select>

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              ▼
            </span>
          </div>
        </div>

        {/* --------------------------------------------------------------
            Region
        -------------------------------------------------------------- */}

        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-gray-600">
            Region
          </label>

          <div className="relative">
            <Layers3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              value={filters.region_id || ""}
              onChange={(e) =>
                handleChange("region_id", e.target.value)
              }
              disabled={
                loading ||
                (Boolean(filters.country_id) &&
                  filteredRegions.length === 0)
              }
              className={selectClass}
            >
              <option value="">All Regions</option>

              {filteredRegions.map((region) => {
                const regionId = getId(region);

                if (!regionId) return null;

                return (
                  <option key={regionId} value={regionId}>
                    {getName(region, "Unknown Region")}
                    {getCode(region)}
                  </option>
                );
              })}
            </select>

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              ▼
            </span>
          </div>
        </div>

        {/* --------------------------------------------------------------
            County
        -------------------------------------------------------------- */}

        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-gray-600">
            County
          </label>

          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              value={filters.county_id || ""}
              onChange={(e) =>
                handleChange("county_id", e.target.value)
              }
              disabled={
                loading ||
                (Boolean(filters.region_id || filters.country_id) &&
                  filteredCounties.length === 0)
              }
              className={selectClass}
            >
              <option value="">All Counties</option>

              {filteredCounties.map((county) => {
                const countyId = getId(county);

                if (!countyId) return null;

                return (
                  <option key={countyId} value={countyId}>
                    {getName(county, "Unknown County")}
                    {getCode(county)}
                  </option>
                );
              })}
            </select>

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              ▼
            </span>
          </div>
        </div>

        {/* --------------------------------------------------------------
            City
        -------------------------------------------------------------- */}

        <div className="min-w-0">
          <label className="mb-2 block text-xs font-semibold text-gray-600">
            City
          </label>

          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              value={filters.city_id || ""}
              onChange={(e) =>
                handleChange("city_id", e.target.value)
              }
              disabled={
                loading ||
                (Boolean(
                  filters.county_id ||
                  filters.region_id ||
                  filters.country_id
                ) && filteredCities.length === 0)
              }
              className={selectClass}
            >
              <option value="">All Cities</option>

              {filteredCities.map((city) => {
                const cityId = getId(city);

                if (!cityId) return null;

                return (
                  <option key={cityId} value={cityId}>
                    {getName(city, "Unknown City")}
                    {getCode(city)}
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

      {/* ================================================================
          ACTIVE FILTER SUMMARY
      ================================================================ */}

      {hasFilters && (
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          <span className="text-xs font-semibold text-gray-500">
            Active filters:
          </span>

          {/* Search */}

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
                className="hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Status */}

          {filters.status && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium capitalize text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />

              {filters.status}

              <button
                type="button"
                onClick={() => handleChange("status", "")}
                disabled={loading}
                aria-label="Remove status filter"
                className="hover:text-emerald-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Country */}

          {filters.country_id && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700">
              <Globe2 className="h-3 w-3" />

              {selectedCountry?.name ||
                `Country ID: ${filters.country_id}`}

              <button
                type="button"
                onClick={() => handleChange("country_id", "")}
                disabled={loading}
                aria-label="Remove country filter"
                className="hover:text-violet-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Region */}

          {filters.region_id && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700">
              <Layers3 className="h-3 w-3" />

              {selectedRegion?.name ||
                `Region ID: ${filters.region_id}`}

              <button
                type="button"
                onClick={() => handleChange("region_id", "")}
                disabled={loading}
                aria-label="Remove region filter"
                className="hover:text-amber-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* County */}

          {filters.county_id && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700">
              <Building2 className="h-3 w-3" />

              {selectedCounty?.name ||
                `County ID: ${filters.county_id}`}

              <button
                type="button"
                onClick={() => handleChange("county_id", "")}
                disabled={loading}
                aria-label="Remove county filter"
                className="hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* City */}

          {filters.city_id && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 px-2.5 py-1.5 text-xs font-medium text-cyan-700">
              <MapPin className="h-3 w-3" />

              {selectedCity?.name ||
                `City ID: ${filters.city_id}`}

              <button
                type="button"
                onClick={() => handleChange("city_id", "")}
                disabled={loading}
                aria-label="Remove city filter"
                className="hover:text-cyan-900"
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

export default AreaFilters;
