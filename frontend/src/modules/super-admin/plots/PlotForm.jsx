
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  FileText,
  Info,
  LandPlot,
  Loader2,
  MapPin,
  Save,
  X,
} from "lucide-react";

const PLOT_STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
  { value: "unavailable", label: "Unavailable" },
];

const DEFAULT_FORM_VALUES = {
  code: "",
  title: "",
  property_id: "",
  size: "",
  asking_price: "",
  status: "available",
  country_id: "",
  region_id: "",
  county_id: "",
  city_id: "",
  area_id: "",
  description: "",
  is_active: true,
};

const inputClass =
  "block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";
const errorClass = "mt-1.5 text-xs text-red-600";
const sectionClass =
  "rounded-2xl border border-gray-200 bg-white shadow-sm";

const getId = (value) =>
  value === null || value === undefined || value === ""
    ? ""
    : String(value);

const getErrorMessage = (errors, field) => {
  if (!errors) return "";

  const value = errors[field];

  if (Array.isArray(value)) return value[0] || "";
  return typeof value === "string" ? value : "";
};

const normalizeOptions = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (item === null || item === undefined) return null;

      if (typeof item !== "object") {
        return { value: String(item), label: String(item) };
      }

      const value = item.id ?? item.value ?? item.uuid ?? item.code;

      const label =
        item.name ??
        item.title ??
        item.label ??
        item.code ??
        (value !== undefined ? String(value) : "");

      if (value === null || value === undefined || label === "") {
        return null;
      }

      return {
        value: String(value),
        label: String(label),
      };
    })
    .filter(Boolean);
};

const getInitialValues = (plot = {}) => ({
  ...DEFAULT_FORM_VALUES,
  code: plot.code ?? "",
  title: plot.title ?? "",
  property_id: getId(plot.property_id),
  size: plot.size ?? "",
  asking_price: plot.asking_price ?? "",
  status: plot.status ?? "available",
  country_id: getId(
    plot.country_id ??
    plot.area?.city?.county?.region?.country_id ??
    plot.area?.city?.county?.region?.country?.id ??
    plot.city?.county?.region?.country_id ??
    plot.county?.region?.country_id,
  ),
  region_id: getId(
    plot.region_id ??
    plot.region?.id ??
    plot.area?.city?.county?.region_id ??
    plot.area?.city?.county?.region?.id,
  ),
  county_id: getId(
    plot.county_id ??
    plot.county?.id ??
    plot.area?.city?.county_id ??
    plot.area?.city?.county?.id,
  ),
  city_id: getId(plot.city_id ?? plot.city?.id ?? plot.area?.city_id),
  area_id: getId(plot.area_id ?? plot.area?.id),
  description: plot.description ?? "",
  is_active:
    plot.is_active === undefined || plot.is_active === null
      ? true
      : ![false, 0, "0", "false"].includes(plot.is_active),
});

const FormField = ({
  label,
  name,
  required = false,
  error,
  hint,
  children,
  className = "",
}) => (
  <div className={className}>
    <label htmlFor={name} className={labelClass}>
      {label}
      {required && (
        <span className="ml-1 text-red-500" aria-hidden="true">
          *
        </span>
      )}
    </label>

    {children}

    {error && <p className={errorClass}>{error}</p>}

    {!error && hint && (
      <p className="mt-1.5 text-xs leading-5 text-gray-500">{hint}</p>
    )}
  </div>
);

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
      <Icon className="h-5 w-5" />
    </div>

    <div className="min-w-0">
      <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-5 text-gray-500">{description}</p>
    </div>
  </div>
);

const PlotForm = ({
  initialValues,
  plot,
  onSubmit,
  onCancel,
  loading = false,
  submitting = false,
  errors = {},
  properties = [],
  countries = [],
  regions = [],
  counties = [],
  cities = [],
  areas = [],
  mode,
  title: customTitle,
  description: customDescription,
  submitLabel,
  showCode = true,
  showProperty = true,
  showLocations = true,
  showDescription = true,
  showActiveStatus = true,
}) => {
  const existingPlot = initialValues ?? plot ?? {};
  const isEdit = mode === "edit" || Boolean(existingPlot.id);
  const busy = loading || submitting;

  /*
   * Build a stable signature from the actual fields instead of depending
   * on the existingPlot object, which may be recreated by the parent.
   */
  const initial = getInitialValues(existingPlot);

  const initialSignature = JSON.stringify({
    id: existingPlot.id ?? null,
    ...initial,
  });

  const [form, setForm] = useState(() => initial);
  const [localErrors, setLocalErrors] = useState({});

  const propertyOptions = useMemo(
    () => normalizeOptions(properties),
    [properties],
  );

  const countryOptions = useMemo(
    () => normalizeOptions(countries),
    [countries],
  );

  const regionOptions = useMemo(
    () => normalizeOptions(regions),
    [regions],
  );

  const countyOptions = useMemo(
    () => normalizeOptions(counties),
    [counties],
  );

  const cityOptions = useMemo(
    () => normalizeOptions(cities),
    [cities],
  );

  const areaOptions = useMemo(
    () => normalizeOptions(areas),
    [areas],
  );

  /*
   * Reset when the actual initial plot data changes, not merely when
   * the parent creates a new object reference.
   */
  useEffect(() => {
    setForm(JSON.parse(initialSignature));
    setLocalErrors({});
  }, [initialSignature]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setLocalErrors((previous) => ({
      ...previous,
      [name]: "",
      general: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!String(form.title).trim()) {
      nextErrors.title = "Plot title is required.";
    }

    if (
      form.size === "" ||
      !Number.isFinite(Number(form.size)) ||
      Number(form.size) <= 0
    ) {
      nextErrors.size = "Enter a valid plot size greater than zero.";
    }

    if (
      form.asking_price === "" ||
      !Number.isFinite(Number(form.asking_price)) ||
      Number(form.asking_price) < 0
    ) {
      nextErrors.asking_price =
        "Enter a valid asking price of zero or more.";
    }

    if (
      !PLOT_STATUS_OPTIONS.some((option) => option.value === form.status)
    ) {
      nextErrors.status = "Select a valid plot status.";
    }

    setLocalErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (busy || typeof onSubmit !== "function") return;
    if (!validate()) return;

    const payload = {
      title: String(form.title).trim(),
      size: Number(form.size),
      asking_price: Number(form.asking_price),
      status: form.status,
      is_active: Boolean(form.is_active),
    };

    if (String(form.code).trim()) {
      payload.code = String(form.code).trim();
    }

    if (form.property_id !== "") {
      payload.property_id = Number(form.property_id);
    }

    if (showLocations) {
      [
        "country_id",
        "region_id",
        "county_id",
        "city_id",
        "area_id",
      ].forEach((field) => {
        if (form[field] !== "") {
          payload[field] = Number(form[field]);
        }
      });
    }

    if (showDescription && String(form.description).trim()) {
      payload.description = String(form.description).trim();
    }

    try {
      await onSubmit(payload);
    } catch (err) {
      setLocalErrors((previous) => ({
        ...previous,
        general:
          err?.response?.data?.message ||
          err?.message ||
          "Unable to save the plot. Please try again.",
      }));
    }
  };

  const fieldError = (field) =>
    localErrors[field] || getErrorMessage(errors, field);

  const heading =
    customTitle || (isEdit ? "Edit Plot" : "Create New Plot");

  const subtitle =
    customDescription ||
    (isEdit
      ? "Update the plot details and save your changes."
      : "Enter the land plot information to add it to your inventory.");

  const buttonText =
    submitLabel || (isEdit ? "Save Changes" : "Create Plot");

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <LandPlot className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              {heading}
            </h1>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>
            Fields marked <span className="text-red-500">*</span> are required
          </span>
        </div>
      </div>

      {(localErrors.general || errors.message || errors.error) && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Unable to save plot</p>
            <p className="mt-1">
              {localErrors.general || errors.message || errors.error}
            </p>
          </div>
        </div>
      )}

      <section className={sectionClass}>
        <SectionHeader
          icon={FileText}
          title="Plot Information"
          description="Enter the basic identification and classification details."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          {showCode && (
            <FormField
              label="Plot Code"
              name="code"
              error={fieldError("code")}
              hint={
                isEdit
                  ? "The existing plot reference."
                  : "Optional. Leave blank if the backend generates the code."
              }
            >
              <input
                id="code"
                name="code"
                type="text"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g. PLT-20261010-000001"
                maxLength={100}
                disabled={busy}
                className={inputClass}
              />
            </FormField>
          )}

          <FormField
            label="Plot Title"
            name="title"
            required
            error={fieldError("title")}
          >
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Ruiru Prime Residential Plot"
              maxLength={255}
              required
              disabled={busy}
              aria-invalid={Boolean(fieldError("title"))}
              className={inputClass}
            />
          </FormField>

          {showProperty && (
            <FormField
              label="Associated Property"
              name="property_id"
              error={fieldError("property_id")}
              hint="Optional if supported by your backend."
            >
              <select
                id="property_id"
                name="property_id"
                value={form.property_id}
                onChange={handleChange}
                disabled={busy}
                className={inputClass}
              >
                <option value="">No associated property</option>
                {propertyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <FormField
            label="Plot Size (Acres)"
            name="size"
            required
            error={fieldError("size")}
            hint="Enter the size in acres, for example 0.13."
          >
            <input
              id="size"
              name="size"
              type="number"
              min="0.000001"
              step="any"
              value={form.size}
              onChange={handleChange}
              placeholder="e.g. 0.13"
              required
              disabled={busy}
              aria-invalid={Boolean(fieldError("size"))}
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Asking Price (KES)"
            name="asking_price"
            required
            error={fieldError("asking_price")}
            hint="Enter the total asking price in Kenyan shillings."
          >
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-gray-500">
                KES
              </span>
              <input
                id="asking_price"
                name="asking_price"
                type="number"
                min="0"
                step="0.01"
                value={form.asking_price}
                onChange={handleChange}
                placeholder="e.g. 3500000"
                required
                disabled={busy}
                aria-invalid={Boolean(fieldError("asking_price"))}
                className={`${inputClass} pl-12`}
              />
            </div>
          </FormField>

          <FormField
            label="Plot Status"
            name="status"
            required
            error={fieldError("status")}
          >
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              disabled={busy}
              className={inputClass}
            >
              {PLOT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </section>

      {showLocations && (
        <section className={sectionClass}>
          <SectionHeader
            icon={MapPin}
            title="Plot Location"
            description="Select the administrative location associated with the plot."
          />

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            {[
              {
                name: "country_id",
                label: "Country",
                placeholder: "Select country",
                options: countryOptions,
              },
              {
                name: "region_id",
                label: "Region",
                placeholder: "Select region",
                options: regionOptions,
              },
              {
                name: "county_id",
                label: "County",
                placeholder: "Select county",
                options: countyOptions,
              },
              {
                name: "city_id",
                label: "City / Town",
                placeholder: "Select city or town",
                options: cityOptions,
              },
              {
                name: "area_id",
                label: "Area / Neighbourhood",
                placeholder: "Select area",
                options: areaOptions,
              },
            ].map((field) => (
              <FormField
                key={field.name}
                label={field.label}
                name={field.name}
                error={fieldError(field.name)}
              >
                <select
                  id={field.name}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  disabled={busy}
                  className={inputClass}
                >
                  <option value="">{field.placeholder}</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
            ))}
          </div>
        </section>
      )}

      {showDescription && (
        <section className={sectionClass}>
          <SectionHeader
            icon={Info}
            title="Additional Information"
            description="Add details that help staff identify and understand the plot."
          />

          <div className="p-5 sm:p-6">
            <FormField
              label="Description"
              name="description"
              error={fieldError("description")}
              hint="Optional. Include access roads, utilities or nearby landmarks."
            >
              <textarea
                id="description"
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                placeholder="Enter additional plot information..."
                maxLength={5000}
                disabled={busy}
                className={`${inputClass} resize-y`}
              />
            </FormField>
          </div>
        </section>
      )}

      {showActiveStatus && (
        <section className={sectionClass}>
          <div className="p-5 sm:p-6">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="is_active"
                checked={Boolean(form.is_active)}
                onChange={handleChange}
                disabled={busy}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />

              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900">
                  Active plot record
                </span>
                <span className="mt-1 block text-sm leading-5 text-gray-500">
                  Keep this plot record active in management screens.
                </span>
              </span>

              <span
                className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${form.is_active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-gray-100 text-gray-600"
                  }`}
              >
                {form.is_active ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Ban className="h-3.5 w-3.5" />
                )}
                {form.is_active ? "Active" : "Inactive"}
              </span>
            </label>
          </div>
        </section>
      )}

      <div className="sticky bottom-0 z-10 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:p-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs leading-5 text-gray-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Review the plot details before saving your changes.</span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={busy || typeof onSubmit !== "function"}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {buttonText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlotForm;
