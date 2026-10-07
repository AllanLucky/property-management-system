import {
  CalendarDays,
  ChevronDown,
  Filter,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useMemo } from "react";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const PAYMENT_STATUSES = [
  {
    value: "",
    label: "All Payment Statuses",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "partial",
    label: "Partial",
  },
  {
    value: "paid",
    label: "Paid",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "refunded",
    label: "Refunded",
  },
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeValue = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
};

const hasValue = (value) => {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ""
  );
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function CancelledBookingFilters({
  filters = {},
  onChange,
  onReset,
  loading = false,
  disabled = false,
  showDateFilters = true,
}) {
  /*
  |--------------------------------------------------------------------------
  | Normalized Filters
  |--------------------------------------------------------------------------
  */

  const normalizedFilters = useMemo(() => {
    return {
      search: normalizeValue(
        filters.search
      ),

      payment_status:
        normalizeValue(
          filters.payment_status ??
          filters.paymentStatus
        ),

      date_from:
        normalizeValue(
          filters.date_from ??
          filters.dateFrom
        ),

      date_to:
        normalizeValue(
          filters.date_to ??
          filters.dateTo
        ),
    };
  }, [filters]);

  /*
  |--------------------------------------------------------------------------
  | Active Filter Count
  |--------------------------------------------------------------------------
  */

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (
      hasValue(
        normalizedFilters.search
      )
    ) {
      count += 1;
    }

    if (
      hasValue(
        normalizedFilters.payment_status
      )
    ) {
      count += 1;
    }

    if (
      showDateFilters &&
      hasValue(
        normalizedFilters.date_from
      )
    ) {
      count += 1;
    }

    if (
      showDateFilters &&
      hasValue(
        normalizedFilters.date_to
      )
    ) {
      count += 1;
    }

    return count;
  }, [
    normalizedFilters,
    showDateFilters,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Change Handler
  |--------------------------------------------------------------------------
  */

  const handleChange = (
    field,
    value
  ) => {
    if (
      typeof onChange !== "function"
    ) {
      return;
    }

    onChange({
      ...filters,
      [field]: value,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Reset Handler
  |--------------------------------------------------------------------------
  */

  const handleReset = () => {
    if (
      typeof onReset === "function"
    ) {
      onReset();
      return;
    }

    if (
      typeof onChange === "function"
    ) {
      onChange({
        search: "",
        payment_status: "",
        date_from: "",
        date_to: "",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Clear Search
  |--------------------------------------------------------------------------
  */

  const clearSearch = () => {
    handleChange(
      "search",
      ""
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Filter className="h-4 w-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Filters
              </h2>

              {activeFilterCount >
                0 && (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-100 px-1.5 py-0.5 text-[11px] font-bold text-indigo-700">
                    {
                      activeFilterCount
                    }
                  </span>
                )}
            </div>

            <p className="mt-0.5 text-xs text-slate-500">
              Search and filter cancelled
              bookings.
            </p>
          </div>
        </div>

        {activeFilterCount >
          0 && (
            <button
              type="button"
              onClick={
                handleReset
              }
              disabled={
                loading ||
                disabled
              }
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          )}
      </div>

      {/* Filter Body */}
      <div className="p-5">
        <div
          className={[
            "grid grid-cols-1 gap-4",
            showDateFilters
              ? "lg:grid-cols-2 xl:grid-cols-4"
              : "lg:grid-cols-2",
          ].join(" ")}
        >
          {/* Search */}
          <div
            className={
              showDateFilters
                ? "xl:col-span-1"
                : ""
            }
          >
            <label
              htmlFor="cancelled-booking-search"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Search
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="cancelled-booking-search"
                type="text"
                value={
                  normalizedFilters.search
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    "search",
                    event
                      .target
                      .value
                  )
                }
                disabled={
                  loading ||
                  disabled
                }
                placeholder="Booking, customer, property, unit..."
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />

              {hasValue(
                normalizedFilters.search
              ) && (
                  <button
                    type="button"
                    onClick={
                      clearSearch
                    }
                    disabled={
                      loading ||
                      disabled
                    }
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <label
              htmlFor="cancelled-payment-status"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Payment Status
            </label>

            <div className="relative">
              <select
                id="cancelled-payment-status"
                value={
                  normalizedFilters.payment_status
                }
                onChange={(
                  event
                ) =>
                  handleChange(
                    "payment_status",
                    event
                      .target
                      .value
                  )
                }
                disabled={
                  loading ||
                  disabled
                }
                className="h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-700 outline-none transition hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                {PAYMENT_STATUSES.map(
                  (
                    option
                  ) => (
                    <option
                      key={
                        option.value ||
                        "all"
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Date From */}
          {showDateFilters && (
            <div>
              <label
                htmlFor="cancelled-date-from"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Cancelled From
              </label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="cancelled-date-from"
                  type="date"
                  value={
                    normalizedFilters.date_from
                  }
                  max={
                    normalizedFilters.date_to ||
                    undefined
                  }
                  onChange={(
                    event
                  ) =>
                    handleChange(
                      "date_from",
                      event
                        .target
                        .value
                    )
                  }
                  disabled={
                    loading ||
                    disabled
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>
            </div>
          )}

          {/* Date To */}
          {showDateFilters && (
            <div>
              <label
                htmlFor="cancelled-date-to"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Cancelled To
              </label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="cancelled-date-to"
                  type="date"
                  value={
                    normalizedFilters.date_to
                  }
                  min={
                    normalizedFilters.date_from ||
                    undefined
                  }
                  onChange={(
                    event
                  ) =>
                    handleChange(
                      "date_to",
                      event
                        .target
                        .value
                    )
                  }
                  disabled={
                    loading ||
                    disabled
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition hover:border-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Active Filters */}
        {activeFilterCount >
          0 && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold text-slate-500">
                  Active:
                </span>

                {hasValue(
                  normalizedFilters.search
                ) && (
                    <button
                      type="button"
                      onClick={() =>
                        clearSearch()
                      }
                      disabled={
                        loading ||
                        disabled
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-100 transition hover:bg-indigo-100"
                    >
                      Search:{" "}
                      <span className="max-w-[180px] truncate font-semibold">
                        {
                          normalizedFilters.search
                        }
                      </span>

                      <X className="h-3 w-3" />
                    </button>
                  )}

                {hasValue(
                  normalizedFilters.payment_status
                ) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleChange(
                          "payment_status",
                          ""
                        )
                      }
                      disabled={
                        loading ||
                        disabled
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-100 transition hover:bg-indigo-100"
                    >
                      Payment:{" "}
                      <span className="font-semibold">
                        {
                          PAYMENT_STATUSES.find(
                            (
                              item
                            ) =>
                              item.value ===
                              normalizedFilters.payment_status
                          )
                            ?.label ||
                          normalizedFilters.payment_status
                        }
                      </span>

                      <X className="h-3 w-3" />
                    </button>
                  )}

                {showDateFilters &&
                  hasValue(
                    normalizedFilters.date_from
                  ) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleChange(
                          "date_from",
                          ""
                        )
                      }
                      disabled={
                        loading ||
                        disabled
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-100 transition hover:bg-indigo-100"
                    >
                      From:{" "}
                      <span className="font-semibold">
                        {
                          normalizedFilters.date_from
                        }
                      </span>

                      <X className="h-3 w-3" />
                    </button>
                  )}

                {showDateFilters &&
                  hasValue(
                    normalizedFilters.date_to
                  ) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleChange(
                          "date_to",
                          ""
                        )
                      }
                      disabled={
                        loading ||
                        disabled
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-100 transition hover:bg-indigo-100"
                    >
                      To:{" "}
                      <span className="font-semibold">
                        {
                          normalizedFilters.date_to
                        }
                      </span>

                      <X className="h-3 w-3" />
                    </button>
                  )}
              </div>
            </div>
          )}

        {/* Loading Indicator */}
        {loading && (
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-indigo-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-600" />
            Updating results...
          </div>
        )}
      </div>
    </div>
  );
}
