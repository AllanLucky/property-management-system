import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const BOOKING_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
  { value: "expired", label: "Expired" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All Payments" },
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const BOOKING_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "viewing", label: "Viewing" },
  { value: "reservation", label: "Reservation" },
  { value: "rental", label: "Rental" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "All Sources" },
  { value: "website", label: "Website" },
  { value: "walk_in", label: "Walk-in" },
  { value: "phone", label: "Phone" },
  { value: "referral", label: "Referral" },
  { value: "agent", label: "Agent" },
  { value: "social_media", label: "Social Media" },
  { value: "other", label: "Other" },
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeFilters = (filters = {}) => ({
  search: filters?.search ?? "",
  status: filters?.status ?? "",
  payment_status: filters?.payment_status ?? "",
  booking_type: filters?.booking_type ?? "",
  source: filters?.source ?? "",
  property_id: filters?.property_id ?? "",
  apartment_id: filters?.apartment_id ?? "",
  unit_id: filters?.unit_id ?? "",
  customer_id: filters?.customer_id ?? "",
  tenant_id: filters?.tenant_id ?? "",
  tenancy_id: filters?.tenancy_id ?? "",
  start_date: filters?.start_date ?? "",
  end_date: filters?.end_date ?? "",
  booking_date: filters?.booking_date ?? "",
  paid_date: filters?.paid_date ?? "",
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
`;

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const BookingFilters = ({
  filters = {},
  onFilterChange,
  onReset,
  onRefresh,
  loading = false,
  showAdvanced = true,
  compact = false,
}) => {
  const [localFilters, setLocalFilters] = useState(
    normalizeFilters(filters)
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
      if (!value) return false;

      return ![
        "search",
        "property_id",
        "apartment_id",
        "unit_id",
        "customer_id",
        "tenant_id",
        "tenancy_id",
      ].includes(field);
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
  ) => {
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={`booking-filter-${field}`}
          className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          {label}
        </label>

        <div className="relative">
          {Icon && (
            <Icon
              className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />
          )}

          <select
            id={`booking-filter-${field}`}
            value={localFilters[field] ?? ""}
            onChange={(event) =>
              handleChange(field, event.target.value)
            }
            className={`${selectClasses} ${
              Icon ? "pl-9" : ""
            }`}
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
          />
        </div>
      </div>
    );
  };

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
      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Filter className="h-5 w-5" strokeWidth={2} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Booking Filters
              </h3>

              {activeFilterCount > 0 && (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                  {activeFilterCount}
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs text-slate-500">
              Search and filter your booking records
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
                transition
                hover:border-slate-300
                hover:bg-slate-50
                focus:outline-none
                focus:ring-4
                focus:ring-indigo-500/10
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
              transition
              hover:border-slate-300
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-50
              focus:outline-none
              focus:ring-4
              focus:ring-slate-500/10
            "
          >
            <RotateCcw className="h-4 w-4" />

            <span className="hidden sm:inline">
              Reset
            </span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="
              inline-flex items-center justify-center gap-2
              rounded-xl bg-indigo-600
              px-3.5 py-2.5
              text-sm font-semibold text-white
              shadow-sm
              transition
              hover:bg-indigo-700
              disabled:cursor-not-allowed
              disabled:opacity-50
              focus:outline-none
              focus:ring-4
              focus:ring-indigo-500/20
            "
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Filter Body */}
      {/* ------------------------------------------------------------------ */}

      <div className="space-y-5 p-4 sm:p-5">
        {/* ---------------------------------------------------------------- */}
        {/* Main Filters */}
        {/* ---------------------------------------------------------------- */}

        <div
          className={`
            grid gap-4
            ${
              compact
                ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
                : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
            }
          `}
        >
          {/* Search */}

          <div className="space-y-1.5 md:col-span-2 xl:col-span-2">
            <label
              htmlFor="booking-filter-search"
              className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Search Bookings
            </label>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
                strokeWidth={1.8}
              />

              <input
                id="booking-filter-search"
                type="search"
                value={localFilters.search}
                onChange={handleSearchChange}
                placeholder="Search booking number, customer, email..."
                className={`${inputClasses} pl-10 pr-10`}
              />

              {localFilters.search && (
                <button
                  type="button"
                  onClick={() => handleChange("search", "")}
                  className="
                    absolute right-2.5 top-1/2
                    flex h-7 w-7
                    -translate-y-1/2
                    items-center justify-center
                    rounded-lg
                    text-slate-400
                    transition
                    hover:bg-slate-100
                    hover:text-slate-600
                  "
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Status */}

          {renderSelect(
            "Booking Status",
            "status",
            BOOKING_STATUS_OPTIONS
          )}

          {/* Payment */}

          {renderSelect(
            "Payment Status",
            "payment_status",
            PAYMENT_STATUS_OPTIONS
          )}

          {/* Booking Type */}

          {renderSelect(
            "Booking Type",
            "booking_type",
            BOOKING_TYPE_OPTIONS
          )}

          {/* Source */}

          {renderSelect(
            "Booking Source",
            "source",
            SOURCE_OPTIONS
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Advanced Filters */}
        {/* ---------------------------------------------------------------- */}

        {showAdvanced && advancedOpen && (
          <div className="border-t border-slate-100 pt-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Advanced Filters
                </h4>

                <p className="mt-0.5 text-xs text-slate-500">
                  Narrow bookings by dates and related records.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAdvancedOpen(false)}
                className="
                  rounded-lg p-1.5
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-600
                "
                aria-label="Close advanced filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {/* Start Date */}

              <div className="space-y-1.5">
                <label
                  htmlFor="booking-filter-start-date"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Start Date
                </label>

                <div className="relative">
                  <CalendarDays
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    strokeWidth={1.8}
                  />

                  <input
                    id="booking-filter-start-date"
                    type="date"
                    value={localFilters.start_date}
                    onChange={(event) =>
                      handleChange(
                        "start_date",
                        event.target.value
                      )
                    }
                    className={`${inputClasses} pl-9`}
                  />
                </div>
              </div>

              {/* End Date */}

              <div className="space-y-1.5">
                <label
                  htmlFor="booking-filter-end-date"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  End Date
                </label>

                <div className="relative">
                  <CalendarDays
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    strokeWidth={1.8}
                  />

                  <input
                    id="booking-filter-end-date"
                    type="date"
                    value={localFilters.end_date}
                    min={localFilters.start_date || undefined}
                    onChange={(event) =>
                      handleChange(
                        "end_date",
                        event.target.value
                      )
                    }
                    className={`${inputClasses} pl-9`}
                  />
                </div>
              </div>

              {/* Booking Date */}

              <div className="space-y-1.5">
                <label
                  htmlFor="booking-filter-booking-date"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Booking Date
                </label>

                <div className="relative">
                  <CalendarDays
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    strokeWidth={1.8}
                  />

                  <input
                    id="booking-filter-booking-date"
                    type="date"
                    value={localFilters.booking_date}
                    onChange={(event) =>
                      handleChange(
                        "booking_date",
                        event.target.value
                      )
                    }
                    className={`${inputClasses} pl-9`}
                  />
                </div>
              </div>

              {/* Paid Date */}

              <div className="space-y-1.5">
                <label
                  htmlFor="booking-filter-paid-date"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Paid Date
                </label>

                <div className="relative">
                  <CalendarDays
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    strokeWidth={1.8}
                  />

                  <input
                    id="booking-filter-paid-date"
                    type="date"
                    value={localFilters.paid_date}
                    onChange={(event) =>
                      handleChange(
                        "paid_date",
                        event.target.value
                      )
                    }
                    className={`${inputClasses} pl-9`}
                  />
                </div>
              </div>

              {/* Property ID */}

              <div className="space-y-1.5">
                <label
                  htmlFor="booking-filter-property"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Property ID
                </label>

                <input
                  id="booking-filter-property"
                  type="number"
                  min="1"
                  value={localFilters.property_id}
                  onChange={(event) =>
                    handleChange(
                      "property_id",
                      event.target.value
                    )
                  }
                  placeholder="Property ID"
                  className={inputClasses}
                />
              </div>

              {/* Apartment ID */}

              <div className="space-y-1.5">
                <label
                  htmlFor="booking-filter-apartment"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Apartment ID
                </label>

                <input
                  id="booking-filter-apartment"
                  type="number"
                  min="1"
                  value={localFilters.apartment_id}
                  onChange={(event) =>
                    handleChange(
                      "apartment_id",
                      event.target.value
                    )
                  }
                  placeholder="Apartment ID"
                  className={inputClasses}
                />
              </div>

              {/* Unit ID */}

              <div className="space-y-1.5">
                <label
                  htmlFor="booking-filter-unit"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Unit ID
                </label>

                <input
                  id="booking-filter-unit"
                  type="number"
                  min="1"
                  value={localFilters.unit_id}
                  onChange={(event) =>
                    handleChange(
                      "unit_id",
                      event.target.value
                    )
                  }
                  placeholder="Unit ID"
                  className={inputClasses}
                />
              </div>

              {/* Customer ID */}

              <div className="space-y-1.5">
                <label
                  htmlFor="booking-filter-customer"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Customer ID
                </label>

                <input
                  id="booking-filter-customer"
                  type="number"
                  min="1"
                  value={localFilters.customer_id}
                  onChange={(event) =>
                    handleChange(
                      "customer_id",
                      event.target.value
                    )
                  }
                  placeholder="Customer ID"
                  className={inputClasses}
                />
              </div>

              {/* Tenant ID */}

              <div className="space-y-1.5">
                <label
                  htmlFor="booking-filter-tenant"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Tenant ID
                </label>

                <input
                  id="booking-filter-tenant"
                  type="number"
                  min="1"
                  value={localFilters.tenant_id}
                  onChange={(event) =>
                    handleChange(
                      "tenant_id",
                      event.target.value
                    )
                  }
                  placeholder="Tenant ID"
                  className={inputClasses}
                />
              </div>

              {/* Tenancy ID */}

              <div className="space-y-1.5">
                <label
                  htmlFor="booking-filter-tenancy"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Tenancy ID
                </label>

                <input
                  id="booking-filter-tenancy"
                  type="number"
                  min="1"
                  value={localFilters.tenancy_id}
                  onChange={(event) =>
                    handleChange(
                      "tenancy_id",
                      event.target.value
                    )
                  }
                  placeholder="Tenancy ID"
                  className={inputClasses}
                />
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Active Filter Summary */}
        {/* ---------------------------------------------------------------- */}

        {activeFilterCount > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-indigo-700">
              <Filter className="h-4 w-4 shrink-0" />

              <span>
                <strong>{activeFilterCount}</strong>{" "}
                {activeFilterCount === 1
                  ? "filter"
                  : "filters"}{" "}
                applied
              </span>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="
                inline-flex items-center gap-1.5
                text-xs font-semibold
                text-indigo-700
                transition
                hover:text-indigo-900
              "
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

export default BookingFilters;