
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const SALE_STATUS_OPTIONS = [
  { value: "", label: "All sale statuses" },
  { value: "pending", label: "Pending" },
  { value: "reserved", label: "Reserved" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All payment statuses" },
  { value: "paid", label: "Fully paid" },
  { value: "partial", label: "Partially paid" },
  { value: "unpaid", label: "Unpaid" },
];

const PAYMENT_FREQUENCY_OPTIONS = [
  { value: "", label: "All payment frequencies" },
  { value: "once", label: "Once-off" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

const SORT_OPTIONS = [
  { value: "created_at", label: "Date created" },
  { value: "sale_date", label: "Sale date" },
  { value: "sale_price", label: "Sale price" },
  { value: "amount_paid", label: "Amount paid" },
  { value: "balance", label: "Outstanding balance" },
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeFilters = (filters = {}) => ({
  search: filters.search ?? "",
  status: filters.status ?? "",
  payment_status: filters.payment_status ?? "",
  payment_frequency: filters.payment_frequency ?? "",
  date_from: filters.date_from ?? "",
  date_to: filters.date_to ?? "",
  min_price: filters.min_price ?? "",
  max_price: filters.max_price ?? "",
  sort_by: filters.sort_by ?? "created_at",
  sort_direction: filters.sort_direction ?? "desc",
});

const hasValue = (value) =>
  value !== null &&
  value !== undefined &&
  String(value).trim() !== "";

const getActiveFilters = (filters) =>
  Object.entries(normalizeFilters(filters)).filter(([key, value]) => {
    if (key === "sort_by" && value === "created_at") return false;
    if (key === "sort_direction" && value === "desc") return false;

    return hasValue(value);
  });

const getFilterLabel = (key) => {
  const labels = {
    search: "Search",
    status: "Sale status",
    payment_status: "Payment status",
    payment_frequency: "Payment frequency",
    date_from: "From date",
    date_to: "To date",
    min_price: "Minimum price",
    max_price: "Maximum price",
    sort_by: "Sort by",
    sort_direction: "Sort direction",
  };

  return labels[key] ?? key;
};

const getFilterDisplayValue = (key, value) => {
  if (key === "status") {
    return (
      SALE_STATUS_OPTIONS.find((option) => option.value === value)?.label ??
      value
    );
  }

  if (key === "payment_status") {
    return (
      PAYMENT_STATUS_OPTIONS.find((option) => option.value === value)?.label ??
      value
    );
  }

  if (key === "payment_frequency") {
    return (
      PAYMENT_FREQUENCY_OPTIONS.find(
        (option) => option.value === value
      )?.label ?? value
    );
  }

  if (key === "sort_by") {
    return SORT_OPTIONS.find((option) => option.value === value)?.label ?? value;
  }

  if (key === "sort_direction") {
    return value === "asc" ? "Ascending" : "Descending";
  }

  return String(value);
};

/*
|--------------------------------------------------------------------------
| Reusable Select Field
|--------------------------------------------------------------------------
*/

const SelectField = ({
  label,
  name,
  value,
  options,
  onChange,
}) => (
  <div className="min-w-0">
    <label
      htmlFor={`plot-sale-filter-${name}`}
      className="mb-1.5 block text-xs font-semibold text-gray-600"
    >
      {label}
    </label>

    <div className="relative">
      <select
        id={`plot-sale-filter-${name}`}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      />
    </div>
  </div>
);

/*
|--------------------------------------------------------------------------
| Reusable Input Field
|--------------------------------------------------------------------------
*/

const InputField = ({
  label,
  name,
  type = "text",
  value,
  placeholder,
  min,
  max,
  onChange,
}) => (
  <div className="min-w-0">
    <label
      htmlFor={`plot-sale-filter-${name}`}
      className="mb-1.5 block text-xs font-semibold text-gray-600"
    >
      {label}
    </label>

    <input
      id={`plot-sale-filter-${name}`}
      name={name}
      type={type}
      value={value}
      min={min}
      max={max}
      placeholder={placeholder}
      onChange={(event) => onChange(name, event.target.value)}
      className="h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
    />
  </div>
);

/*
|--------------------------------------------------------------------------
| Active Filter Chip
|--------------------------------------------------------------------------
*/

const ActiveFilterChip = ({ label, value, onRemove }) => (
  <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-xs text-indigo-700">
    <span className="font-semibold">{label}:</span>

    <span className="max-w-40 truncate">{value}</span>

    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
      className="ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition hover:bg-indigo-100"
    >
      <X className="h-3 w-3" />
    </button>
  </span>
);

/*
|--------------------------------------------------------------------------
| Main Plot Sale Filters
|--------------------------------------------------------------------------
|
| Props:
| filters        - current filter object
| onFilterChange - callback receiving (name, value)
| onChange       - alternative callback receiving (name, value)
| onApply        - optional callback receiving the complete filter object
| onSearch       - optional callback receiving the complete filter object
| onReset        - optional callback for resetting filters
| onClear        - alternative reset callback
| loading        - disables controls while loading
| total          - optional number of matching records
| resultCount    - alternative name for total
|--------------------------------------------------------------------------
*/

const PlotSaleFilters = ({
  filters = {},
  onFilterChange,
  onChange,
  onApply,
  onSearch,
  onReset,
  onClear,
  loading = false,
  total,
  resultCount,
}) => {
  const [localFilters, setLocalFilters] = useState(() =>
    normalizeFilters(filters)
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Synchronize External Filters
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setLocalFilters(normalizeFilters(filters));
  }, [filters]);

  /*
  |--------------------------------------------------------------------------
  | Update Filter
  |--------------------------------------------------------------------------
  */

  const updateFilter = (name, value) => {
    const nextFilters = {
      ...localFilters,
      [name]: value,
    };

    setLocalFilters(nextFilters);

    const callback = onFilterChange ?? onChange;

    callback?.(name, value);
  };

  /*
  |--------------------------------------------------------------------------
  | Apply Filters
  |--------------------------------------------------------------------------
  */

  const applyFilters = (event) => {
    event?.preventDefault?.();

    const normalized = normalizeFilters(localFilters);

    if (
      normalized.date_from &&
      normalized.date_to &&
      normalized.date_from > normalized.date_to
    ) {
      return;
    }

    if (
      normalized.min_price !== "" &&
      normalized.max_price !== "" &&
      Number(normalized.min_price) > Number(normalized.max_price)
    ) {
      return;
    }

    onApply?.(normalized);
    onSearch?.(normalized);
  };

  /*
  |--------------------------------------------------------------------------
  | Reset Filters
  |--------------------------------------------------------------------------
  */

  const resetFilters = () => {
    const resetValues = normalizeFilters();

    setLocalFilters(resetValues);

    const callback = onFilterChange ?? onChange;

    if (callback) {
      Object.entries(resetValues).forEach(([key, value]) => {
        callback(key, value);
      });
    }

    onReset?.();
    onClear?.();
    onApply?.(resetValues);
    onSearch?.(resetValues);
  };

  /*
  |--------------------------------------------------------------------------
  | Remove Individual Filter
  |--------------------------------------------------------------------------
  */

  const removeFilter = (name) => {
    const defaultValue =
      name === "sort_by"
        ? "created_at"
        : name === "sort_direction"
          ? "desc"
          : "";

    updateFilter(name, defaultValue);
  };

  const activeFilters = getActiveFilters(localFilters);

  const displayedTotal = resultCount ?? total;

  const invalidDateRange =
    Boolean(localFilters.date_from && localFilters.date_to) &&
    localFilters.date_from > localFilters.date_to;

  const invalidPriceRange =
    localFilters.min_price !== "" &&
    localFilters.max_price !== "" &&
    Number(localFilters.min_price) > Number(localFilters.max_price);

  const hasInvalidRange = invalidDateRange || invalidPriceRange;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section
      aria-label="Plot sales filters"
      className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm"
    >
      {/* Header */}

      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900">
              Filter Plot Sales
            </h3>

            <p className="mt-0.5 text-xs text-gray-500">
              Find and organize plot sale records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {displayedTotal !== undefined && displayedTotal !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              {Number(displayedTotal).toLocaleString("en-KE")} records
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowAdvanced((previous) => !previous)}
            aria-expanded={showAdvanced}
            className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition ${showAdvanced
              ? "border-indigo-200 bg-indigo-50 text-indigo-700"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Advanced</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""
                }`}
            />
          </button>
        </div>
      </div>

      <form onSubmit={applyFilters} className="space-y-5 p-4 sm:p-5">
        {/* Main Filters */}

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 xl:col-span-2">
            <label
              htmlFor="plot-sale-filter-search"
              className="mb-1.5 block text-xs font-semibold text-gray-600"
            >
              Search sales
            </label>

            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />

              <input
                id="plot-sale-filter-search"
                name="search"
                type="search"
                value={localFilters.search}
                onChange={(event) =>
                  updateFilter("search", event.target.value)
                }
                placeholder="Sale number, buyer, plot or agent..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />

              {localFilters.search && (
                <button
                  type="button"
                  onClick={() => updateFilter("search", "")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <SelectField
            label="Sale status"
            name="status"
            value={localFilters.status}
            options={SALE_STATUS_OPTIONS}
            onChange={updateFilter}
          />

          <SelectField
            label="Payment status"
            name="payment_status"
            value={localFilters.payment_status}
            options={PAYMENT_STATUS_OPTIONS}
            onChange={updateFilter}
          />
        </div>

        {/* Advanced Filters */}

        {showAdvanced && (
          <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
                <CalendarDays className="h-4 w-4 text-indigo-600" />
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-800">
                  Advanced filters
                </h4>

                <p className="mt-0.5 text-[11px] text-gray-500">
                  Narrow results by date, price and payment schedule
                </p>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <InputField
                label="From date"
                name="date_from"
                type="date"
                value={localFilters.date_from}
                max={localFilters.date_to || undefined}
                onChange={updateFilter}
              />

              <InputField
                label="To date"
                name="date_to"
                type="date"
                value={localFilters.date_to}
                min={localFilters.date_from || undefined}
                onChange={updateFilter}
              />

              <InputField
                label="Minimum sale price (KES)"
                name="min_price"
                type="number"
                value={localFilters.min_price}
                min="0"
                placeholder="e.g. 1000000"
                onChange={updateFilter}
              />

              <InputField
                label="Maximum sale price (KES)"
                name="max_price"
                type="number"
                value={localFilters.max_price}
                min="0"
                placeholder="e.g. 10000000"
                onChange={updateFilter}
              />

              <SelectField
                label="Payment frequency"
                name="payment_frequency"
                value={localFilters.payment_frequency}
                options={PAYMENT_FREQUENCY_OPTIONS}
                onChange={updateFilter}
              />

              <SelectField
                label="Sort by"
                name="sort_by"
                value={localFilters.sort_by}
                options={SORT_OPTIONS}
                onChange={updateFilter}
              />

              <SelectField
                label="Sort direction"
                name="sort_direction"
                value={localFilters.sort_direction}
                options={[
                  { value: "desc", label: "Newest / highest first" },
                  { value: "asc", label: "Oldest / lowest first" },
                ]}
                onChange={updateFilter}
              />
            </div>

            {hasInvalidRange && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-700"
              >
                <X className="mt-0.5 h-4 w-4 shrink-0" />

                <span>
                  {invalidDateRange
                    ? "The start date must not be later than the end date."
                    : "The minimum sale price must not exceed the maximum sale price."}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Active Filter Chips */}

        {activeFilters.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-gray-600">
                Active filters
                <span className="ml-1.5 text-gray-400">
                  ({activeFilters.length})
                </span>
              </p>

              <button
                type="button"
                onClick={resetFilters}
                disabled={loading}
                className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear all
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeFilters.map(([key, value]) => (
                <ActiveFilterChip
                  key={key}
                  label={getFilterLabel(key)}
                  value={getFilterDisplayValue(key, value)}
                  onRemove={() => removeFilter(key)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={resetFilters}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset filters
          </button>

          <button
            type="submit"
            disabled={loading || hasInvalidRange}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {loading ? "Applying..." : "Apply filters"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default PlotSaleFilters;
