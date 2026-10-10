
import { useEffect, useState } from "react";
import {
  ChevronDown,
  Filter,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  X,
  Banknote,
  Ruler,
  Layers3,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const PLOT_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
  { value: "unavailable", label: "Unavailable" },
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeFilters = (filters = {}) => ({
  search: filters?.search ?? "",
  status: filters?.status ?? "",
  property_id: filters?.property_id ?? "",
  county_id: filters?.county_id ?? "",
  city_id: filters?.city_id ?? "",
  area_id: filters?.area_id ?? "",
  min_price: filters?.min_price ?? "",
  max_price: filters?.max_price ?? "",
  min_size: filters?.min_size ?? "",
  max_size: filters?.max_size ?? "",
  is_active: filters?.is_active ?? "",
});

/*
|--------------------------------------------------------------------------
| Reusable Input Styles
|--------------------------------------------------------------------------
*/

const inputClasses = `
  w-full
  rounded-xl
  border border-slate-200
  bg-white
  px-3.5 py-2.5
  text-sm
  text-slate-700
  outline-none
  transition
  placeholder:text-slate-400
  hover:border-slate-300
  focus:border-indigo-500
  focus:ring-4
  focus:ring-indigo-500/10
  disabled:cursor-not-allowed
  disabled:bg-slate-50
`;

const selectClasses = `
  w-full
  appearance-none
  rounded-xl
  border border-slate-200
  bg-white
  px-3.5 py-2.5 pr-10
  text-sm
  text-slate-700
  outline-none
  transition
  hover:border-slate-300
  focus:border-indigo-500
  focus:ring-4
  focus:ring-indigo-500/10
  disabled:cursor-not-allowed
  disabled:bg-slate-50
`;

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const PlotFilters = ({
  filters = {},
  onFilterChange,
  onReset,
  onRefresh,
  loading = false,
  showAdvanced = true,
  compact = false,
}) => {
  const [localFilters, setLocalFilters] = useState(
    () => normalizeFilters(filters)
  );

  const [advancedOpen, setAdvancedOpen] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Sync External Filters
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setLocalFilters(normalizeFilters(filters));
  }, [filters]);

  /*
  |--------------------------------------------------------------------------
  | Filter Change
  |--------------------------------------------------------------------------
  */

  const handleChange = (field, value) => {
    const updatedFilters = {
      ...localFilters,
      [field]: value,
    };

    setLocalFilters(updatedFilters);

    if (typeof onFilterChange === "function") {
      onFilterChange(field, value, updatedFilters);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const handleSearchChange = (event) => {
    handleChange("search", event.target.value);
  };

  /*
  |--------------------------------------------------------------------------
  | Reset
  |--------------------------------------------------------------------------
  */

  const handleReset = () => {
    const resetFilters = normalizeFilters({});

    setLocalFilters(resetFilters);

    if (typeof onReset === "function") {
      onReset(resetFilters);
      return;
    }

    if (typeof onFilterChange === "function") {
      Object.entries(resetFilters).forEach(([field, value]) => {
        onFilterChange(field, value, resetFilters);
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const handleRefresh = () => {
    if (typeof onRefresh === "function") {
      onRefresh();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Active Filter Count
  |--------------------------------------------------------------------------
  */

  const activeFilterCount = Object.entries(localFilters).filter(
    ([field, value]) => {
      if (value === "" || value === null || value === undefined) {
        return false;
      }

      // Search is displayed separately from advanced filters.
      return field !== "search";
    }
  ).length;

  /*
  |--------------------------------------------------------------------------
  | Render Select
  |--------------------------------------------------------------------------
  */

  const renderSelect = (
    label,
    field,
    options,
    { icon: Icon } = {}
  ) => (
    <div className="space-y-1.5">
      <label
        htmlFor={`plot-filter-${field}`}
        className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        )}

        <select
          id={`plot-filter-${field}`}
          value={localFilters[field] ?? ""}
          onChange={(event) =>
            handleChange(field, event.target.value)
          }
          disabled={loading}
          className={`${selectClasses} ${Icon ? "pl-9" : ""}`}
        >
          {options.map((option) => (
            <option
              key={`${field}-${option.value || "all"}`}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </div>
    </div>
  );

  /*
  |--------------------------------------------------------------------------
  | Render Number Input
  |--------------------------------------------------------------------------
  */

  const renderNumberInput = (
    label,
    field,
    placeholder,
    { icon: Icon, min, step = "any" } = {}
  ) => (
    <div className="space-y-1.5">
      <label
        htmlFor={`plot-filter-${field}`}
        className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        )}

        <input
          id={`plot-filter-${field}`}
          type="number"
          min={min}
          step={step}
          value={localFilters[field]}
          onChange={(event) =>
            handleChange(field, event.target.value)
          }
          placeholder={placeholder}
          disabled={loading}
          className={`${inputClasses} ${Icon ? "pl-9" : ""}`}
        />
      </div>
    </div>
  );

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section
      className={`
        overflow-hidden
        rounded-2xl
        border border-slate-200
        bg-white
        shadow-sm
        ${compact ? "" : "mb-6"}
      `}
    >
      {/* Header */}

      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Filter className="h-5 w-5" strokeWidth={2} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Plot Filters
              </h3>

              {activeFilterCount > 0 && (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                  {activeFilterCount}
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs text-slate-500">
              Search and filter your plot inventory
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showAdvanced && (
            <button
              type="button"
              onClick={() => setAdvancedOpen((current) => !current)}
              className="
                inline-flex items-center justify-center gap-2
                rounded-xl border border-slate-200
                bg-white px-3.5 py-2.5
                text-sm font-semibold text-slate-600
                transition hover:border-slate-300 hover:bg-slate-50
                focus:outline-none focus:ring-4 focus:ring-indigo-500/10
              "
            >
              <Filter className="h-4 w-4" />

              <span>
                {advancedOpen ? "Hide Advanced" : "Advanced"}
              </span>

              {activeFilterCount > 0 && (
                <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="
              inline-flex items-center justify-center gap-2
              rounded-xl border border-slate-200
              bg-white px-3.5 py-2.5
              text-sm font-semibold text-slate-600
              transition hover:border-slate-300 hover:bg-slate-50
              disabled:cursor-not-allowed disabled:opacity-50
              focus:outline-none focus:ring-4 focus:ring-slate-500/10
            "
          >
            <RotateCcw className="h-4 w-4" />

            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="
              inline-flex items-center justify-center gap-2
              rounded-xl bg-indigo-600 px-3.5 py-2.5
              text-sm font-semibold text-white shadow-sm
              transition hover:bg-indigo-700
              disabled:cursor-not-allowed disabled:opacity-50
              focus:outline-none focus:ring-4 focus:ring-indigo-500/20
            "
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />

            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Body */}

      <div className="space-y-5 p-4 sm:p-5">
        {/* Main Filters */}

        <div
          className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 ${
            compact ? "gap-y-3" : ""
          }`}
        >
          {/* Search */}

          <div className="space-y-1.5 md:col-span-2 xl:col-span-2">
            <label
              htmlFor="plot-filter-search"
              className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Search Plots
            </label>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <input
                id="plot-filter-search"
                type="search"
                value={localFilters.search}
                onChange={handleSearchChange}
                disabled={loading}
                placeholder="Search plot code, title, location..."
                className={`${inputClasses} pl-10 pr-10`}
              />

              {localFilters.search && (
                <button
                  type="button"
                  onClick={() => handleChange("search", "")}
                  className="
                    absolute right-2.5 top-1/2
                    flex h-7 w-7 -translate-y-1/2
                    items-center justify-center rounded-lg
                    text-slate-400 transition
                    hover:bg-slate-100 hover:text-slate-600
                  "
                  aria-label="Clear plot search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Status */}

          {renderSelect("Plot Status", "status", PLOT_STATUS_OPTIONS, {
            icon: Layers3,
          })}

          {/* Active Status */}

          {renderSelect("Record Status", "is_active", [
            { value: "", label: "All Records" },
            { value: "1", label: "Active" },
            { value: "0", label: "Inactive" },
          ])}
        </div>

        {/* Advanced Filters */}

        {showAdvanced && advancedOpen && (
          <div className="border-t border-slate-100 pt-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Advanced Plot Filters
                </h4>

                <p className="mt-0.5 text-xs text-slate-500">
                  Narrow your inventory by location, property, price and size.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAdvancedOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close advanced filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {/* Property ID */}

              {renderNumberInput(
                "Property ID",
                "property_id",
                "Enter property ID",
                { min: 1, step: 1, icon: Map }
              )}

              {/* County ID */}

              {renderNumberInput(
                "County ID",
                "county_id",
                "Enter county ID",
                { min: 1, step: 1, icon: MapPin }
              )}

              {/* City ID */}

              {renderNumberInput(
                "City ID",
                "city_id",
                "Enter city ID",
                { min: 1, step: 1, icon: MapPin }
              )}

              {/* Area ID */}

              {renderNumberInput(
                "Area ID",
                "area_id",
                "Enter area ID",
                { min: 1, step: 1, icon: MapPin }
              )}

              {/* Minimum Price */}

              {renderNumberInput(
                "Minimum Price (KES)",
                "min_price",
                "Minimum asking price",
                { min: 0, icon: Banknote }
              )}

              {/* Maximum Price */}

              {renderNumberInput(
                "Maximum Price (KES)",
                "max_price",
                "Maximum asking price",
                { min: 0, icon: Banknote }
              )}

              {/* Minimum Size */}

              {renderNumberInput(
                "Minimum Size",
                "min_size",
                "Minimum plot size",
                { min: 0, icon: Ruler }
              )}

              {/* Maximum Size */}

              {renderNumberInput(
                "Maximum Size",
                "max_size",
                "Maximum plot size",
                { min: 0, icon: Ruler }
              )}
            </div>

            {/* Advanced Filter Validation */}

            {localFilters.min_price !== "" &&
              localFilters.max_price !== "" &&
              Number(localFilters.min_price) >
                Number(localFilters.max_price) && (
                <p className="mt-3 text-xs font-medium text-red-600">
                  Minimum price cannot exceed maximum price.
                </p>
              )}

            {localFilters.min_size !== "" &&
              localFilters.max_size !== "" &&
              Number(localFilters.min_size) >
                Number(localFilters.max_size) && (
                <p className="mt-3 text-xs font-medium text-red-600">
                  Minimum size cannot exceed maximum size.
                </p>
              )}
          </div>
        )}

        {/* Active Filter Summary */}

        {activeFilterCount > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-indigo-700">
              <Filter className="h-4 w-4 shrink-0" />

              <span>
                <strong>{activeFilterCount}</strong>{" "}
                {activeFilterCount === 1 ? "filter" : "filters"} applied
              </span>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 transition hover:text-indigo-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PlotFilters;
