
import { useState } from "react";
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
| FILTER OPTIONS
|--------------------------------------------------------------------------
*/

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: "", label: "All payment types" },
  { value: "deposit", label: "Deposit" },
  { value: "installment", label: "Installment" },
  { value: "balance", label: "Balance" },
  { value: "full_payment", label: "Full Payment" },
  { value: "other", label: "Other" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "All payment methods" },
  { value: "mpesa", label: "M-Pesa" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online" },
  { value: "other", label: "Other" },
];

const ACTIVE_STATUS_OPTIONS = [
  { value: "", label: "All records" },
  { value: "1", label: "Active" },
  { value: "0", label: "Inactive" },
];

const DEFAULT_FILTERS = {
  search: "",
  plot_sale_id: "",
  payment_number: "",
  receipt_number: "",
  transaction_reference: "",
  payment_type: "",
  payment_method: "",
  status: "",
  currency: "",
  is_active: "",
  payer_name: "",
  payer_phone: "",
  payer_email: "",
  start_date: "",
  end_date: "",
  min_amount: "",
  max_amount: "",
};

const DEFAULT_CURRENCIES = [
  "KES",
  "USD",
  "UGX",
  "TZS",
  "RWF",
  "NGN",
];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const normalizeFilters = (filters = {}) => ({
  ...DEFAULT_FILTERS,
  ...(filters || {}),
});

const hasValue = (value) =>
  value !== undefined &&
  value !== null &&
  String(value).trim() !== "";

const countActiveFilters = (filters) =>
  Object.entries(filters).filter(([key, value]) => {
    if (key === "search") return false;
    return hasValue(value);
  }).length;

const removeEmptyFilters = (filters) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => hasValue(value)),
  );

/*
|--------------------------------------------------------------------------
| INPUT STYLES
|--------------------------------------------------------------------------
*/

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60";

const selectClassName =
  "w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60";

/*
|--------------------------------------------------------------------------
| FILTER FIELD
|--------------------------------------------------------------------------
*/

const FilterField = ({
  label,
  icon: Icon,
  children,
  className = "",
}) => (
  <div className={className}>
    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </label>

    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}

      {children}
    </div>
  </div>
);

/*
|--------------------------------------------------------------------------
| SELECT FIELD
|--------------------------------------------------------------------------
*/

const SelectField = ({
  name,
  value,
  onChange,
  options,
  disabled,
}) => (
  <div className="relative">
    <select
      name={name}
      value={value ?? ""}
      onChange={onChange}
      className={selectClassName}
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>

    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
);

/*
|--------------------------------------------------------------------------
| MAIN COMPONENT
|--------------------------------------------------------------------------
*/

const PlotPaymentFilters = ({
  filters = {},
  onFilterChange,
  onApply,
  onReset,
  onSearch,
  loading = false,
  currencies = DEFAULT_CURRENCIES,
  showAdvanced = true,
  showActiveStatus = true,
  showCurrency = true,
  className = "",
}) => {
  const [localFilters, setLocalFilters] = useState(() =>
    normalizeFilters(filters),
  );

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [validationError, setValidationError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | FILTER HANDLERS
  |--------------------------------------------------------------------------
  */

  const updateFilter = (name, value) => {
    setLocalFilters((previous) => ({
      ...previous,
      [name]: value,
    }));

    setValidationError("");

    onFilterChange?.(name, value);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    updateFilter(name, value);
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validateFilters = (values) => {
    if (
      values.start_date &&
      values.end_date &&
      values.start_date > values.end_date
    ) {
      return "The start date cannot be later than the end date.";
    }

    const minAmount =
      values.min_amount === "" ? null : Number(values.min_amount);

    const maxAmount =
      values.max_amount === "" ? null : Number(values.max_amount);

    if (minAmount !== null && (!Number.isFinite(minAmount) || minAmount < 0)) {
      return "Minimum amount must be a valid non-negative number.";
    }

    if (maxAmount !== null && (!Number.isFinite(maxAmount) || maxAmount < 0)) {
      return "Maximum amount must be a valid non-negative number.";
    }

    if (
      minAmount !== null &&
      maxAmount !== null &&
      minAmount > maxAmount
    ) {
      return "Minimum amount cannot be greater than maximum amount.";
    }

    return "";
  };

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const handleSearch = (event) => {
    event?.preventDefault?.();

    const values = normalizeFilters(localFilters);

    const error = validateFilters(values);

    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError("");

    const cleanedFilters = removeEmptyFilters(values);

    if (onSearch) {
      onSearch(values.search?.trim() || "", cleanedFilters);
      return;
    }

    onApply?.(cleanedFilters);
  };

  /*
  |--------------------------------------------------------------------------
  | APPLY FILTERS
  |--------------------------------------------------------------------------
  */

  const handleApply = () => {
    const values = normalizeFilters(localFilters);

    const error = validateFilters(values);

    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError("");

    onApply?.(removeEmptyFilters(values));
  };

  /*
  |--------------------------------------------------------------------------
  | CLEAR SEARCH
  |--------------------------------------------------------------------------
  */

  const handleClearSearch = () => {
    const updatedFilters = {
      ...localFilters,
      search: "",
    };

    setLocalFilters(updatedFilters);
    setValidationError("");

    onSearch?.("", removeEmptyFilters(updatedFilters));
  };

  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  const handleReset = () => {
    const emptyFilters = { ...DEFAULT_FILTERS };

    setLocalFilters(emptyFilters);
    setAdvancedOpen(false);
    setValidationError("");

    if (onReset) {
      onReset();
    } else {
      onApply?.(emptyFilters);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER INFORMATION
  |--------------------------------------------------------------------------
  */

  const activeFilterCount = countActiveFilters(localFilters);

  const hasSearch = hasValue(localFilters.search);

  const hasActiveFilters = activeFilterCount > 0 || hasSearch;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              Payment Filters
            </h3>

            <p className="mt-0.5 text-xs text-slate-500">
              Find and filter plot payment transactions.
            </p>
          </div>

          {activeFilterCount > 0 && (
            <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
              {activeFilterCount} active
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showAdvanced && (
            <button
              type="button"
              onClick={() => setAdvancedOpen((value) => !value)}
              aria-expanded={advancedOpen}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                advancedOpen
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Filter className="h-4 w-4" />

              Advanced

              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  advancedOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            disabled={loading || !hasActiveFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 lg:flex-row"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              name="search"
              value={localFilters.search}
              onChange={handleChange}
              placeholder="Search payment number, receipt, reference or payer..."
              className={`${inputClassName} pl-10 pr-10`}
              disabled={loading}
            />

            {hasSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                disabled={loading}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </form>

        {/* Primary filters */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FilterField label="Payment Status">
            <SelectField
              name="status"
              value={localFilters.status}
              onChange={handleChange}
              options={PAYMENT_STATUS_OPTIONS}
              disabled={loading}
            />
          </FilterField>

          <FilterField label="Payment Type">
            <SelectField
              name="payment_type"
              value={localFilters.payment_type}
              onChange={handleChange}
              options={PAYMENT_TYPE_OPTIONS}
              disabled={loading}
            />
          </FilterField>

          <FilterField label="Payment Method">
            <SelectField
              name="payment_method"
              value={localFilters.payment_method}
              onChange={handleChange}
              options={PAYMENT_METHOD_OPTIONS}
              disabled={loading}
            />
          </FilterField>

          <FilterField label="Payment Date From" icon={CalendarDays}>
            <input
              type="date"
              name="start_date"
              value={localFilters.start_date}
              onChange={handleChange}
              className={`${inputClassName} pl-10`}
              disabled={loading}
            />
          </FilterField>

          <FilterField label="Payment Date To" icon={CalendarDays}>
            <input
              type="date"
              name="end_date"
              value={localFilters.end_date}
              onChange={handleChange}
              min={localFilters.start_date || undefined}
              className={`${inputClassName} pl-10`}
              disabled={loading}
            />
          </FilterField>
        </div>

        {/* Advanced filters */}
        {showAdvanced && advancedOpen && (
          <div className="space-y-5 border-t border-slate-100 pt-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Advanced Search
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Narrow down transactions using additional details.
                </p>
              </div>

              <span className="w-fit rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                Optional filters
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <FilterField label="Payment Number">
                <input
                  type="text"
                  name="payment_number"
                  value={localFilters.payment_number}
                  onChange={handleChange}
                  placeholder="PAY-20261005-000003"
                  className={inputClassName}
                  disabled={loading}
                />
              </FilterField>

              <FilterField label="Receipt Number">
                <input
                  type="text"
                  name="receipt_number"
                  value={localFilters.receipt_number}
                  onChange={handleChange}
                  placeholder="RCP-20261005-000003"
                  className={inputClassName}
                  disabled={loading}
                />
              </FilterField>

              <FilterField label="Transaction Reference">
                <input
                  type="text"
                  name="transaction_reference"
                  value={localFilters.transaction_reference}
                  onChange={handleChange}
                  placeholder="Enter transaction reference"
                  className={inputClassName}
                  disabled={loading}
                />
              </FilterField>

              <FilterField label="Plot Sale ID">
                <input
                  type="number"
                  name="plot_sale_id"
                  value={localFilters.plot_sale_id}
                  onChange={handleChange}
                  placeholder="Enter plot sale ID"
                  min="1"
                  className={inputClassName}
                  disabled={loading}
                />
              </FilterField>

              <FilterField label="Payer Name">
                <input
                  type="text"
                  name="payer_name"
                  value={localFilters.payer_name}
                  onChange={handleChange}
                  placeholder="Enter payer name"
                  className={inputClassName}
                  disabled={loading}
                />
              </FilterField>

              <FilterField label="Payer Phone">
                <input
                  type="tel"
                  name="payer_phone"
                  value={localFilters.payer_phone}
                  onChange={handleChange}
                  placeholder="e.g. 0712345678"
                  className={inputClassName}
                  disabled={loading}
                />
              </FilterField>

              <FilterField label="Payer Email">
                <input
                  type="email"
                  name="payer_email"
                  value={localFilters.payer_email}
                  onChange={handleChange}
                  placeholder="payer@example.com"
                  className={inputClassName}
                  disabled={loading}
                />
              </FilterField>

              <FilterField label="Minimum Amount">
                <input
                  type="number"
                  name="min_amount"
                  value={localFilters.min_amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={inputClassName}
                  disabled={loading}
                />
              </FilterField>

              <FilterField label="Maximum Amount">
                <input
                  type="number"
                  name="max_amount"
                  value={localFilters.max_amount}
                  onChange={handleChange}
                  placeholder="Maximum amount"
                  min="0"
                  step="0.01"
                  className={inputClassName}
                  disabled={loading}
                />
              </FilterField>

              {showCurrency && (
                <FilterField label="Currency">
                  <SelectField
                    name="currency"
                    value={localFilters.currency}
                    onChange={handleChange}
                    options={[
                      { value: "", label: "All currencies" },
                      ...currencies.map((currency) => ({
                        value: currency,
                        label: currency,
                      })),
                    ]}
                    disabled={loading}
                  />
                </FilterField>
              )}

              {showActiveStatus && (
                <FilterField label="Record Status">
                  <SelectField
                    name="is_active"
                    value={localFilters.is_active}
                    onChange={handleChange}
                    options={ACTIVE_STATUS_OPTIONS}
                    disabled={loading}
                  />
                </FilterField>
              )}
            </div>
          </div>
        )}

        {/* Validation error */}
        {validationError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {validationError}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            {activeFilterCount > 0
              ? `${activeFilterCount} filter(s) selected. Apply to update payment records.`
              : "Select your preferred filters to narrow down payment records."}
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleReset}
              disabled={loading || !hasActiveFilters}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Clear Filters
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlotPaymentFilters;
