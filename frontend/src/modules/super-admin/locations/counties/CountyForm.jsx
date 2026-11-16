
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Hash,
  Loader2,
  MapPin,
  RefreshCw,
  Save,
  ShieldCheck,
  XCircle,
  Building2,
  Info,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const INITIAL_FORM_DATA = {
  country_id: "",
  region_id: "",
  name: "",
  slug: "",
  code: "",
  is_active: true,
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const createSlug = (value = "") => {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const getInitialValues = (data = null) => {
  if (!data) {
    return { ...INITIAL_FORM_DATA };
  }

  return {
    country_id: data.country_id
      ? String(data.country_id)
      : "",

    region_id: data.region_id
      ? String(data.region_id)
      : "",

    name: data.name || "",
    slug: data.slug || "",
    code: data.code || "",
    is_active: data.is_active ?? true,
  };
};

const getFieldError = (errors, field) => {
  const error = errors?.[field];

  if (Array.isArray(error)) {
    return error[0] || "";
  }

  return typeof error === "string" ? error : "";
};

/*
|--------------------------------------------------------------------------
| Input Styles
|--------------------------------------------------------------------------
*/

const inputClassName = (hasError = false) => `
  block w-full h-11 rounded-xl border bg-white px-3.5
  text-sm text-slate-700 placeholder:text-slate-400
  outline-none transition
  ${hasError
    ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
    : "border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
  }
  disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400
`;

const selectClassName = (hasError = false) => `
  ${inputClassName(hasError)}
  cursor-pointer
`;

/*
|--------------------------------------------------------------------------
| Form Field Component
|--------------------------------------------------------------------------
*/

const FormField = ({
  label,
  name,
  icon: Icon,
  required = false,
  error,
  description,
  children,
}) => {
  return (
    <div className="min-w-0 space-y-2">

      <label
        htmlFor={name}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
      >
        {Icon && (
          <Icon className="h-4 w-4 text-slate-400" />
        )}

        {label}

        {required && (
          <span className="text-red-500">*</span>
        )}
      </label>

      {children}

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {!error && description && (
        <p className="text-xs text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Status Switch
|--------------------------------------------------------------------------
*/

const StatusSwitch = ({
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
        transition-colors duration-200
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? "bg-emerald-500" : "bg-slate-300"}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow-sm
          transition-transform duration-200
          ${checked ? "translate-x-6" : "translate-x-1"}
        `}
      />
    </button>
  );
};

/*
|--------------------------------------------------------------------------
| County Form Component
|--------------------------------------------------------------------------
*/

const CountyForm = ({
  initialData = null,
  onSubmit,
  onCancel,

  countries = [],
  regions = [],

  errors = {},
  loading = false,
  submitting = false,

  mode = "create",
}) => {

  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [formData, setFormData] = useState(() =>
    getInitialValues(initialData)
  );

  const [localErrors, setLocalErrors] = useState({});

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    Boolean(initialData?.slug)
  );

  const [submitError, setSubmitError] = useState("");

  const isEdit = mode === "edit" || Boolean(initialData?.id);

  const isSubmitting = Boolean(loading || submitting);

  /*
  |--------------------------------------------------------------------------
  | Synchronize Initial Data
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (initialData) {
      setFormData(getInitialValues(initialData));
      setSlugManuallyEdited(Boolean(initialData.slug));
    }
  }, [initialData]);

  /*
  |--------------------------------------------------------------------------
  | Available Countries
  |--------------------------------------------------------------------------
  */

  const availableCountries = useMemo(() => {
    return (Array.isArray(countries) ? countries : [])
      .filter((country) => {
        return (
          country?.is_active === true ||
          country?.is_active === 1 ||
          String(country?.id) === String(formData.country_id)
        );
      })
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
  }, [countries, formData.country_id]);

  /*
  |--------------------------------------------------------------------------
  | Filter Regions By Country
  |--------------------------------------------------------------------------
  */

  const availableRegions = useMemo(() => {
    if (!formData.country_id) {
      return [];
    }

    return (Array.isArray(regions) ? regions : [])
      .filter((region) => {
        const belongsToCountry =
          String(region.country_id) === String(formData.country_id);

        const isAvailable =
          region.is_active === true ||
          region.is_active === 1 ||
          String(region.id) === String(formData.region_id);

        return belongsToCountry && isAvailable;
      })
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
  }, [
    regions,
    formData.country_id,
    formData.region_id,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Selected Country And Region
  |--------------------------------------------------------------------------
  */

  const selectedCountry = useMemo(() => {
    return availableCountries.find(
      (country) =>
        String(country.id) === String(formData.country_id)
    ) || null;
  }, [availableCountries, formData.country_id]);

  const selectedRegion = useMemo(() => {
    return availableRegions.find(
      (region) =>
        String(region.id) === String(formData.region_id)
    ) || null;
  }, [availableRegions, formData.region_id]);

  /*
  |--------------------------------------------------------------------------
  | Field Change Handler
  |--------------------------------------------------------------------------
  */

  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;

    const fieldValue = type === "checkbox" ? checked : value;

    setFormData((previous) => {
      const updated = {
        ...previous,
        [name]: fieldValue,
      };

      /*
      |--------------------------------------------------------------------------
      | Country Change
      |--------------------------------------------------------------------------
      */

      if (name === "country_id") {
        updated.region_id = "";
      }

      /*
      |--------------------------------------------------------------------------
      | Automatic Slug Generation
      |--------------------------------------------------------------------------
      */

      if (name === "name" && !slugManuallyEdited) {
        updated.slug = createSlug(fieldValue);
      }

      return updated;
    });

    setLocalErrors((previous) => ({
      ...previous,
      [name]: "",
      ...(name === "country_id" ? { region_id: "" } : {}),
    }));

    setSubmitError("");
  }, [slugManuallyEdited]);

  /*
  |--------------------------------------------------------------------------
  | Slug Change Handler
  |--------------------------------------------------------------------------
  */

  const handleSlugChange = useCallback((event) => {
    const value = event.target.value;

    setSlugManuallyEdited(true);

    setFormData((previous) => ({
      ...previous,
      slug: createSlug(value),
    }));

    setLocalErrors((previous) => ({
      ...previous,
      slug: "",
    }));

    setSubmitError("");
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Reset Slug To Automatic
  |--------------------------------------------------------------------------
  */

  const handleGenerateSlug = useCallback(() => {
    setSlugManuallyEdited(false);

    setFormData((previous) => ({
      ...previous,
      slug: createSlug(previous.name),
    }));

    setLocalErrors((previous) => ({
      ...previous,
      slug: "",
    }));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Client Validation
  |--------------------------------------------------------------------------
  */

  const validateForm = useCallback(() => {
    const validationErrors = {};

    if (!formData.country_id) {
      validationErrors.country_id = "Please select a country.";
    }

    if (!formData.region_id) {
      validationErrors.region_id = "Please select a region.";
    }

    if (!formData.name.trim()) {
      validationErrors.name = "County name is required.";
    } else if (formData.name.trim().length < 2) {
      validationErrors.name =
        "County name must contain at least 2 characters.";
    } else if (formData.name.trim().length > 150) {
      validationErrors.name =
        "County name cannot exceed 150 characters.";
    }

    if (formData.slug) {
      if (formData.slug.length > 180) {
        validationErrors.slug =
          "County slug cannot exceed 180 characters.";
      } else if (
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)
      ) {
        validationErrors.slug =
          "Use lowercase letters, numbers and hyphens only.";
      }
    }

    if (formData.code) {
      if (formData.code.length < 2) {
        validationErrors.code =
          "County code must contain at least 2 characters.";
      } else if (formData.code.length > 20) {
        validationErrors.code =
          "County code cannot exceed 20 characters.";
      } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
        validationErrors.code =
          "Use letters, numbers, underscores and hyphens only.";
      }
    }

    setLocalErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  }, [formData]);

  /*
  |--------------------------------------------------------------------------
  | Submit Handler
  |--------------------------------------------------------------------------
  */

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    const payload = {
      country_id: Number(formData.country_id),
      region_id: Number(formData.region_id),
      name: formData.name.trim(),
      slug: formData.slug.trim().toLowerCase() || null,
      code: formData.code.trim().toUpperCase() || null,
      is_active: Boolean(formData.is_active),
    };

    try {
      if (typeof onSubmit !== "function") {
        throw new Error("County form submit handler is not configured.");
      }

      await onSubmit(payload);
    } catch (error) {
      console.error("[CountyForm] Submission failed:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to save county. Please try again.";

      setSubmitError(message);

      const serverErrors = error?.response?.data?.errors;

      if (serverErrors && typeof serverErrors === "object") {
        const normalizedErrors = {};

        Object.entries(serverErrors).forEach(([field, messages]) => {
          normalizedErrors[field] = Array.isArray(messages)
            ? messages[0]
            : messages;
        });

        setLocalErrors(normalizedErrors);
      }
    }
  }, [
    formData,
    isSubmitting,
    onSubmit,
    validateForm,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Reset Handler
  |--------------------------------------------------------------------------
  */

  const handleReset = useCallback(() => {
    setFormData(getInitialValues(initialData));
    setLocalErrors({});
    setSubmitError("");
    setSlugManuallyEdited(Boolean(initialData?.slug));
  }, [initialData]);

  /*
  |--------------------------------------------------------------------------
  | Resolve Field Errors
  |--------------------------------------------------------------------------
  */

  const getError = (field) => {
    return (
      getFieldError(localErrors, field) ||
      getFieldError(errors, field)
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Main Render
  |--------------------------------------------------------------------------
  */

  return (
    <form
      onSubmit={handleSubmit}
      className="min-w-0 space-y-6"
      noValidate
    >

      {/* FORM ERROR */}

      {submitError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-800">
              Unable to save county
            </p>

            <p className="mt-1 text-sm text-red-700">
              {submitError}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSubmitError("")}
            className="ml-auto text-red-500 transition hover:text-red-700"
            aria-label="Dismiss error"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* GENERAL INFORMATION */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <MapPin className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                County Information
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Enter the county identification and location details.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">

          {/* COUNTRY AND REGION */}

          <div>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                Administrative Location
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Select the country first, then choose its region.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <FormField
                label="Country"
                name="country_id"
                icon={Globe}
                required
                error={getError("country_id")}
                description="Select the country this county belongs to."
              >
                <select
                  id="country_id"
                  name="country_id"
                  value={formData.country_id}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={selectClassName(Boolean(getError("country_id")))}
                >
                  <option value="">
                    Select country
                  </option>

                  {availableCountries.map((country) => (
                    <option
                      key={country.id}
                      value={country.id}
                    >
                      {country.name}
                      {country.code ? ` (${country.code})` : ""}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Region"
                name="region_id"
                icon={MapPin}
                required
                error={getError("region_id")}
                description={
                  formData.country_id
                    ? "Only regions belonging to the selected country are displayed."
                    : "Select a country before choosing a region."
                }
              >
                <select
                  id="region_id"
                  name="region_id"
                  value={formData.region_id}
                  onChange={handleChange}
                  disabled={!formData.country_id || isSubmitting}
                  className={selectClassName(Boolean(getError("region_id")))}
                >
                  <option value="">
                    {!formData.country_id
                      ? "Select country first"
                      : "Select region"}
                  </option>

                  {availableRegions.map((region) => (
                    <option
                      key={region.id}
                      value={region.id}
                    >
                      {region.name}
                      {region.code ? ` (${region.code})` : ""}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {formData.country_id && availableRegions.length === 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">

                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                <p className="text-xs text-amber-700">
                  No active regions are available for the selected country.
                  Please create or activate a region before adding this county.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100" />

          {/* COUNTY NAME AND CODE */}

          <div>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                County Identification
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Provide the official county name and identification code.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <FormField
                label="County Name"
                name="name"
                icon={Building2}
                required
                error={getError("name")}
                description="Enter the official county or district name."
              >
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Nairobi County"
                  maxLength={150}
                  disabled={isSubmitting}
                  className={inputClassName(Boolean(getError("name")))}
                />
              </FormField>

              <FormField
                label="County Code"
                name="code"
                icon={Hash}
                error={getError("code")}
                description="Optional unique county code, e.g. NBI."
              >
                <input
                  id="code"
                  name="code"
                  type="text"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g. NBI"
                  maxLength={20}
                  disabled={isSubmitting}
                  className={inputClassName(Boolean(getError("code")))}
                />
              </FormField>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* COUNTY SLUG */}

          <div>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                URL Identification
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Configure the county URL slug.
              </p>
            </div>

            <FormField
              label="County Slug"
              name="slug"
              icon={Globe}
              error={getError("slug")}
              description="Lowercase letters, numbers and hyphens only."
            >
              <div className="flex flex-col gap-2 sm:flex-row">

                <input
                  id="slug"
                  name="slug"
                  type="text"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  placeholder="e.g. nairobi-county"
                  maxLength={180}
                  disabled={isSubmitting}
                  className={inputClassName(Boolean(getError("slug")))}
                />

                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  disabled={isSubmitting || !formData.name.trim()}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate
                </button>
              </div>
            </FormField>
          </div>
        </div>
      </div>

      {/* LOCATION PREVIEW */}

      {(selectedCountry || selectedRegion) && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-indigo-600" />

            <h3 className="text-sm font-bold text-slate-800">
              Location Preview
            </h3>
          </div>

          <p className="mt-2 text-sm font-semibold text-indigo-700">
            {[
              formData.name.trim() || "County Name",
              selectedRegion?.name,
              selectedCountry?.name,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            This is how the county location will be displayed.
          </p>
        </div>
      )}

      {/* STATUS SETTINGS */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                County Status
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Control whether this county is available in the system.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-3">

            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${formData.is_active
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-100 text-slate-500"
                }`}
            >
              {formData.is_active ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                {formData.is_active
                  ? "Active County"
                  : "Inactive County"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {formData.is_active
                  ? "This county is active and available for use."
                  : "This county is inactive and unavailable for normal selection."}
              </p>
            </div>
          </div>

          <StatusSwitch
            checked={Boolean(formData.is_active)}
            onChange={(checked) => {
              setFormData((previous) => ({
                ...previous,
                is_active: checked,
              }));
            }}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* FORM ACTIONS */}

      <div className="flex flex-col-reverse justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </button>

        <div className="flex flex-col gap-2 sm:flex-row">

          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>

          <button
            type="submit"
            disabled={isSubmitting || availableCountries.length === 0 || availableRegions.length === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEdit ? "Update County" : "Create County"}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CountyForm;
