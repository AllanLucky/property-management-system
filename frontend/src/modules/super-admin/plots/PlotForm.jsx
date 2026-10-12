
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

const SIZE_UNIT_OPTIONS = [
  { value: "sqm", label: "Square metres (sqm)" },
  { value: "sqft", label: "Square feet (sqft)" },
  { value: "acre", label: "Acres" },
  { value: "hectare", label: "Hectares" },
];

const CURRENCY_OPTIONS = [
  { value: "KES", label: "KES - Kenyan Shilling" },
  { value: "UGX", label: "UGX - Ugandan Shilling" },
  { value: "TZS", label: "TZS - Tanzanian Shilling" },
  { value: "RWF", label: "RWF - Rwandan Franc" },
  { value: "NGN", label: "NGN - Nigerian Naira" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
];

const DEFAULT_FORM_VALUES = {
  code: "",
  title: "",
  title_number: "",
  property_id: "",
  size: "",
  size_unit: "acre",
  asking_price: "",
  currency: "KES",
  status: "available",
  country_id: "",
  region_id: "",
  county_id: "",
  city_id: "",
  area_id: "",
  address: "",
  latitude: "",
  longitude: "",
  description: "",
  is_active: true,
};

const inputClass =
  "block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";
const errorClass = "mt-1.5 text-xs text-red-600";
const sectionClass = "rounded-2xl border border-gray-200 bg-white shadow-sm";

const getId = (value) =>
  value === null || value === undefined || value === ""
    ? ""
    : String(value);

const getErrorMessage = (errors, field) => {
  if (!errors || typeof errors !== "object") return "";

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
        return {
          value: String(item),
          label: String(item),
        };
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
  title_number: plot.title_number ?? "",

  property_id: getId(plot.property_id),

  size: plot.size ?? "",
  size_unit: plot.size_unit ?? "acre",

  asking_price: plot.asking_price ?? "",
  currency: plot.currency ?? "KES",

  status: plot.status ?? "available",

  country_id: getId(
    plot.country_id ??
    plot.area?.city?.county?.region?.country_id ??
    plot.area?.city?.county?.region?.country?.id ??
    plot.city?.county?.region?.country_id ??
    plot.county?.region?.country_id ??
    plot.region?.country_id,
  ),

  region_id: getId(
    plot.region_id ??
    plot.region?.id ??
    plot.area?.city?.county?.region_id ??
    plot.area?.city?.county?.region?.id ??
    plot.county?.region_id ??
    plot.county?.region?.id,
  ),

  county_id: getId(
    plot.county_id ??
    plot.county?.id ??
    plot.area?.city?.county_id ??
    plot.area?.city?.county?.id ??
    plot.city?.county_id ??
    plot.city?.county?.id,
  ),

  city_id: getId(
    plot.city_id ??
    plot.city?.id ??
    plot.area?.city_id ??
    plot.area?.city?.id,
  ),

  area_id: getId(plot.area_id ?? plot.area?.id),

  address: plot.address ?? "",
  latitude: plot.latitude ?? "",
  longitude: plot.longitude ?? "",
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

      <p className="mt-1 text-sm leading-5 text-gray-500">
        {description}
      </p>
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

  const initial = getInitialValues(existingPlot);

  const initialSignature = JSON.stringify({
    id: existingPlot.id ?? null,
    ...initial,
  });

  const [form, setForm] = useState(() => JSON.parse(initialSignature));
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

  useEffect(() => {
    setForm(JSON.parse(initialSignature));
    setLocalErrors({});
  }, [initialSignature]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setForm((previous) => {
      const next = {
        ...previous,
        [name]: nextValue,
      };

      // Clear child location selections when a parent changes.
      const locationChildren = {
        country_id: ["region_id", "county_id", "city_id", "area_id"],
        region_id: ["county_id", "city_id", "area_id"],
        county_id: ["city_id", "area_id"],
        city_id: ["area_id"],
      };

      if (locationChildren[name]) {
        locationChildren[name].forEach((child) => {
          next[child] = "";
        });
      }

      return next;
    });

    setLocalErrors((previous) => ({
      ...previous,
      [name]: "",
      general: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    const title = String(form.title ?? "").trim();
    const code = String(form.code ?? "").trim();
    const titleNumber = String(form.title_number ?? "").trim();
    const address = String(form.address ?? "").trim();
    const description = String(form.description ?? "").trim();

    if (!title) {
      nextErrors.title = "Plot title is required.";
    } else if (title.length > 255) {
      nextErrors.title = "Plot title cannot exceed 255 characters.";
    }

    if (code.length > 50) {
      nextErrors.code = "Plot code cannot exceed 50 characters.";
    }

    if (titleNumber.length > 100) {
      nextErrors.title_number =
        "Title number cannot exceed 100 characters.";
    }

    const sizeText = String(form.size ?? "").trim();
    const size = Number(sizeText);

    if (
      !sizeText ||
      !Number.isFinite(size) ||
      size <= 0
    ) {
      nextErrors.size = "Enter a plot size greater than zero.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(sizeText)) {
      nextErrors.size =
        "Plot size cannot have more than two decimal places.";
    }

    if (
      !SIZE_UNIT_OPTIONS.some(
        (option) => option.value === form.size_unit,
      )
    ) {
      nextErrors.size_unit = "Select a valid plot size unit.";
    }

    const priceText = String(form.asking_price ?? "").trim();
    const price = Number(priceText);

    if (
      !priceText ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      nextErrors.asking_price =
        "Enter an asking price of zero or more.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(priceText)) {
      nextErrors.asking_price =
        "Asking price cannot have more than two decimal places.";
    }

    if (
      !CURRENCY_OPTIONS.some(
        (option) => option.value === form.currency,
      )
    ) {
      nextErrors.currency = "Select a supported currency.";
    }

    if (
      !PLOT_STATUS_OPTIONS.some(
        (option) => option.value === form.status,
      )
    ) {
      nextErrors.status = "Select a valid plot status.";
    }

    if (
      form.latitude !== "" &&
      (!Number.isFinite(Number(form.latitude)) ||
        Number(form.latitude) < -90 ||
        Number(form.latitude) > 90)
    ) {
      nextErrors.latitude = "Latitude must be between -90 and 90.";
    }

    if (
      form.longitude !== "" &&
      (!Number.isFinite(Number(form.longitude)) ||
        Number(form.longitude) < -180 ||
        Number(form.longitude) > 180)
    ) {
      nextErrors.longitude =
        "Longitude must be between -180 and 180.";
    }

    if (address.length > 500) {
      nextErrors.address = "Address cannot exceed 500 characters.";
    }

    if (description.length > 10000) {
      nextErrors.description =
        "Description cannot exceed 10,000 characters.";
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
      size_unit: form.size_unit,
      asking_price: Number(form.asking_price),
      currency: form.currency,
      status: form.status,
      is_active: Boolean(form.is_active),

      property_id:
        showProperty && form.property_id !== ""
          ? Number(form.property_id)
          : null,

      title_number:
        String(form.title_number ?? "").trim() || null,

      address: String(form.address ?? "").trim() || null,

      description:
        String(form.description ?? "").trim() || null,

      latitude:
        form.latitude === "" ? null : Number(form.latitude),

      longitude:
        form.longitude === "" ? null : Number(form.longitude),
    };

    // plot_number is deliberately omitted.
    // The Laravel backend is responsible for generating it.

    // Let the backend generate the plot code if it is blank.
    // Do not overwrite an existing code with an empty string.
    const code = String(form.code ?? "").trim();

    if (code) {
      payload.code = code;
    }

    if (showLocations) {
      [
        "country_id",
        "region_id",
        "county_id",
        "city_id",
        "area_id",
      ].forEach((field) => {
        payload[field] =
          form[field] === "" ? null : Number(form[field]);
      });
    }

    try {
      await onSubmit(payload);
      setLocalErrors({});
    } catch (error) {
      const responseErrors = error?.response?.data?.errors ?? {};

      const normalizedErrors = Object.fromEntries(
        Object.entries(responseErrors).map(([field, messages]) => [
          field,
          Array.isArray(messages)
            ? messages[0]
            : String(messages),
        ]),
      );

      setLocalErrors((previous) => ({
        ...previous,
        ...normalizedErrors,
        general:
          error?.response?.data?.message ||
          error?.message ||
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

  const generalError =
    localErrors.general ||
    errors.message ||
    errors.error ||
    "";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Page heading */}
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
            Fields marked <span className="text-red-500">*</span> are
            required
          </span>
        </div>
      </div>

      {/* General and server validation errors */}
      {generalError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">Unable to save plot</p>
            <p className="mt-1">{generalError}</p>
          </div>
        </div>
      )}

      {/* Plot information */}
      <section className={sectionClass}>
        <SectionHeader
          icon={FileText}
          title="Plot Information"
          description="Enter the identification and classification details."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          {showCode && (
            <FormField
              label="Plot Code"
              name="code"
              error={fieldError("code")}
              hint={
                isEdit
                  ? "The existing plot reference. Leave unchanged to preserve it."
                  : "Optional. Leave blank to let the backend generate the code."
              }
            >
              <input
                id="code"
                name="code"
                type="text"
                value={form.code ?? ""}
                onChange={handleChange}
                placeholder="Generated by the system if blank"
                maxLength={50}
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
              value={form.title ?? ""}
              onChange={handleChange}
              placeholder="e.g. Ruiru Prime Residential Plot"
              maxLength={255}
              required
              disabled={busy}
              aria-invalid={Boolean(fieldError("title"))}
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Title Number"
            name="title_number"
            error={fieldError("title_number")}
            hint="Optional land title or registration reference."
          >
            <input
              id="title_number"
              name="title_number"
              type="text"
              value={form.title_number ?? ""}
              onChange={handleChange}
              placeholder="Enter the land title reference"
              maxLength={100}
              disabled={busy}
              aria-invalid={Boolean(fieldError("title_number"))}
              className={inputClass}
            />
          </FormField>

          {showProperty && (
            <FormField
              label="Associated Property"
              name="property_id"
              error={fieldError("property_id")}
              hint="Optional, if the plot belongs to an existing property."
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
            label="Plot Size"
            name="size"
            required
            error={fieldError("size")}
            hint="Enter a positive number with up to two decimal places."
          >
            <input
              id="size"
              name="size"
              type="number"
              min="0.01"
              step="0.01"
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
            label="Size Unit"
            name="size_unit"
            required
            error={fieldError("size_unit")}
          >
            <select
              id="size_unit"
              name="size_unit"
              value={form.size_unit}
              onChange={handleChange}
              disabled={busy}
              className={inputClass}
            >
              {SIZE_UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Asking Price"
            name="asking_price"
            required
            error={fieldError("asking_price")}
            hint="Enter the total asking price."
          >
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
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Currency"
            name="currency"
            required
            error={fieldError("currency")}
          >
            <select
              id="currency"
              name="currency"
              value={form.currency}
              onChange={handleChange}
              disabled={busy}
              className={inputClass}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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

      {/* Location */}
      {showLocations && (
        <section className={sectionClass}>
          <SectionHeader
            icon={MapPin}
            title="Plot Location"
            description="Select the administrative location and enter the physical address."
          />

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
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

            <FormField
              label="Physical Address"
              name="address"
              error={fieldError("address")}
              className="sm:col-span-2 lg:col-span-3"
              hint="Street, estate, landmark or nearby road."
            >
              <input
                id="address"
                name="address"
                type="text"
                value={form.address ?? ""}
                onChange={handleChange}
                placeholder="Enter the physical address"
                maxLength={500}
                disabled={busy}
                className={inputClass}
              />
            </FormField>

            <FormField
              label="Latitude"
              name="latitude"
              error={fieldError("latitude")}
              hint="Optional; must be between -90 and 90."
            >
              <input
                id="latitude"
                name="latitude"
                type="number"
                min="-90"
                max="90"
                step="any"
                value={form.latitude ?? ""}
                onChange={handleChange}
                placeholder="e.g. -1.29210000"
                disabled={busy}
                className={inputClass}
              />
            </FormField>

            <FormField
              label="Longitude"
              name="longitude"
              error={fieldError("longitude")}
              hint="Optional; must be between -180 and 180."
            >
              <input
                id="longitude"
                name="longitude"
                type="number"
                min="-180"
                max="180"
                step="any"
                value={form.longitude ?? ""}
                onChange={handleChange}
                placeholder="e.g. 36.82190000"
                disabled={busy}
                className={inputClass}
              />
            </FormField>
          </div>
        </section>
      )}

      {/* Description */}
      {showDescription && (
        <section className={sectionClass}>
          <SectionHeader
            icon={Info}
            title="Additional Information"
            description="Add details that help staff understand the plot."
          />

          <div className="p-5 sm:p-6">
            <FormField
              label="Description"
              name="description"
              error={fieldError("description")}
              hint="Optional. Include access roads, utilities and nearby landmarks."
            >
              <textarea
                id="description"
                name="description"
                rows={4}
                value={form.description ?? ""}
                onChange={handleChange}
                placeholder="Enter additional plot information..."
                maxLength={10000}
                disabled={busy}
                className={`${inputClass} resize-y`}
              />
            </FormField>
          </div>
        </section>
      )}

      {/* Active status */}
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

            {fieldError("is_active") && (
              <p className={errorClass}>{fieldError("is_active")}</p>
            )}
          </div>
        </section>
      )}

      {/* Sticky actions */}
      <div className="sticky bottom-0 z-10 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:p-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs leading-5 text-gray-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              The plot number is generated by the system when the plot is
              created. Review the other details before saving.
            </span>
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