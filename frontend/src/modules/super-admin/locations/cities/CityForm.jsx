
import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  Globe2,
  Hash,
  Info,
  Layers3,
  Loader2,
  MapPin,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getId = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value);
};

const getName = (item) => {
  return item?.name || item?.title || "";
};

const isActive = (item) => {
  return (
    item?.is_active === true ||
    item?.is_active === 1 ||
    item?.is_active === "1"
  );
};

const getInitialFormData = (data = {}) => ({
  country_id: getId(data.country_id ?? data.country?.id),
  region_id: getId(data.region_id ?? data.region?.id),
  county_id: getId(data.county_id ?? data.county?.id),
  name: data.name || "",
  code: data.code || "",
  is_active:
    data.is_active === undefined || data.is_active === null
      ? true
      : (
        data.is_active === true ||
        data.is_active === 1 ||
        data.is_active === "1"
      ),
});

const normalizeError = (error) => {
  if (Array.isArray(error)) {
    return error[0] || "";
  }

  return error || "";
};

/*
|--------------------------------------------------------------------------
| FIELD COMPONENT
|--------------------------------------------------------------------------
*/

const Field = ({
  label,
  name,
  required = false,
  error,
  hint,
  children,
}) => (
  <div className="space-y-2">
    <label
      htmlFor={name}
      className="block text-sm font-semibold text-slate-700"
    >
      {label}
      {required && (
        <span className="ml-1 text-rose-500">*</span>
      )}
    </label>

    {children}

    {error && (
      <p className="flex items-start gap-1.5 text-xs font-medium text-rose-600">
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        {error}
      </p>
    )}

    {!error && hint && (
      <p className="text-xs text-slate-500">{hint}</p>
    )}
  </div>
);

/*
|--------------------------------------------------------------------------
| INPUT STYLES
|--------------------------------------------------------------------------
*/

const inputClass = (hasError = false) => `
  w-full rounded-xl border bg-white px-4 py-3
  text-sm text-slate-700 outline-none transition-all
  placeholder:text-slate-400
  focus:ring-4
  ${hasError
    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
  }
  disabled:cursor-not-allowed disabled:bg-slate-100
  disabled:text-slate-400
`;

const selectClass = (hasError = false) => `
  ${inputClass(hasError)}
  appearance-none pr-10 cursor-pointer
`;

/*
|--------------------------------------------------------------------------
| CITY FORM
|--------------------------------------------------------------------------
*/

const CityForm = ({
  initialData = {},
  values,
  onSubmit,
  onCancel,
  countries = [],
  regions = [],
  counties = [],
  errors = {},
  loading = false,
  submitting = false,
  mode = "create",
}) => {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [formData, setFormData] = useState(() =>
    getInitialFormData(values || initialData)
  );

  const [clientErrors, setClientErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isEdit = mode === "edit";

  // Loading is for initial form preparation.
  // Submitting is only for saving changes.
  const isSubmitting = Boolean(submitting);

  /*
  |--------------------------------------------------------------------------
  | SYNC FORM DATA
  |--------------------------------------------------------------------------
  |
  | Sync only when actual source values change.
  | Do not depend on newly-created object references.
  |
  */

  const sourceKey = JSON.stringify(
    getInitialFormData(values || initialData)
  );

  useEffect(() => {
    const nextData = getInitialFormData(
      values || initialData
    );

    setFormData((previous) => {
      if (JSON.stringify(previous) === JSON.stringify(nextData)) {
        return previous;
      }

      return nextData;
    });

    setClientErrors({});
    setTouched({});
    // sourceKey represents the actual form values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  /*
  |--------------------------------------------------------------------------
  | ACTIVE LOCATION OPTIONS
  |--------------------------------------------------------------------------
  */

  const activeCountries = useMemo(
    () => countries.filter(isActive),
    [countries]
  );

  const activeRegions = useMemo(() => {
    return regions.filter((region) => {
      if (!isActive(region)) return false;

      return (
        !formData.country_id ||
        getId(region.country_id) === formData.country_id
      );
    });
  }, [regions, formData.country_id]);

  const activeCounties = useMemo(() => {
    return counties.filter((county) => {
      if (!isActive(county)) return false;

      const matchesCountry =
        !formData.country_id ||
        getId(county.country_id) === formData.country_id;

      const matchesRegion =
        !formData.region_id ||
        getId(county.region_id) === formData.region_id;

      return matchesCountry && matchesRegion;
    });
  }, [counties, formData.country_id, formData.region_id]);

  /*
  |--------------------------------------------------------------------------
  | SELECTED LOCATION DETAILS
  |--------------------------------------------------------------------------
  */

  const selectedCountry = useMemo(
    () =>
      countries.find(
        (country) =>
          getId(country.id) === formData.country_id
      ),
    [countries, formData.country_id]
  );

  const selectedRegion = useMemo(
    () =>
      regions.find(
        (region) =>
          getId(region.id) === formData.region_id
      ),
    [regions, formData.region_id]
  );

  const selectedCounty = useMemo(
    () =>
      counties.find(
        (county) =>
          getId(county.id) === formData.county_id
      ),
    [counties, formData.county_id]
  );

  /*
  |--------------------------------------------------------------------------
  | FIELD ERRORS
  |--------------------------------------------------------------------------
  */

  const getFieldError = (field) => {
    if (clientErrors[field]) {
      return clientErrors[field];
    }

    return normalizeError(errors?.[field]);
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE FIELD
  |--------------------------------------------------------------------------
  */

  const handleChange = (field, value) => {
    setFormData((previous) => {
      const updated = {
        ...previous,
        [field]: value,
      };

      if (field === "country_id") {
        updated.region_id = "";
        updated.county_id = "";
      }

      if (field === "region_id") {
        updated.county_id = "";
      }

      return updated;
    });

    setClientErrors((previous) => {
      const updated = {
        ...previous,
        [field]: "",
      };

      if (field === "country_id") {
        updated.region_id = "";
        updated.county_id = "";
      }

      if (field === "region_id") {
        updated.county_id = "";
      }

      return updated;
    });

    setTouched((previous) => ({
      ...previous,
      [field]: true,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    const validation = {};

    if (!formData.country_id) {
      validation.country_id = "Please select a country.";
    }

    if (!formData.region_id) {
      validation.region_id = "Please select a region.";
    }

    if (!formData.county_id) {
      validation.county_id = "Please select a county.";
    }

    const cityName = formData.name.trim();

    if (!cityName) {
      validation.name = "Please enter the city name.";
    } else if (cityName.length < 2) {
      validation.name =
        "The city name must contain at least 2 characters.";
    } else if (cityName.length > 150) {
      validation.name =
        "The city name cannot exceed 150 characters.";
    }

    const cityCode = formData.code.trim();

    if (cityCode && cityCode.length < 2) {
      validation.code =
        "The city code must contain at least 2 characters.";
    } else if (cityCode.length > 20) {
      validation.code =
        "The city code cannot exceed 20 characters.";
    }

    setClientErrors(validation);

    setTouched({
      country_id: true,
      region_id: true,
      county_id: true,
      name: true,
      code: true,
      is_active: true,
    });

    return Object.keys(validation).length === 0;
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT FORM
  |--------------------------------------------------------------------------
  */

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!validateForm()) return;

    const payload = {
      country_id: Number(formData.country_id),
      region_id: Number(formData.region_id),
      county_id: Number(formData.county_id),
      name: formData.name.trim(),
      code: formData.code.trim()
        ? formData.code.trim().toUpperCase()
        : null,
      is_active: Boolean(formData.is_active),
    };

    onSubmit?.(payload);
  };

  /*
  |--------------------------------------------------------------------------
  | RESET FORM
  |--------------------------------------------------------------------------
  */

  const handleReset = () => {
    setFormData(
      getInitialFormData(values || initialData)
    );

    setClientErrors({});
    setTouched({});
  };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      noValidate
    >
      {/* BASIC INFORMATION */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Building2 size={20} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800">
                City Information
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Enter the basic details of the city.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <Field
            label="City Name"
            name="name"
            required
            error={getFieldError("name")}
            hint="Enter the official name of the city."
          >
            <div className="relative">
              <MapPin
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={(event) =>
                  handleChange("name", event.target.value)
                }
                placeholder="e.g. Nairobi"
                maxLength={150}
                disabled={isSubmitting}
                className={`${inputClass(
                  Boolean(getFieldError("name"))
                )} pl-10`}
              />
            </div>
          </Field>

          <Field
            label="City Code"
            name="code"
            error={getFieldError("code")}
            hint="Optional. Example: NBO, JJA, RKA."
          >
            <div className="relative">
              <Hash
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="code"
                name="code"
                type="text"
                value={formData.code}
                onChange={(event) =>
                  handleChange(
                    "code",
                    event.target.value.toUpperCase()
                  )
                }
                placeholder="e.g. NBO"
                maxLength={20}
                disabled={isSubmitting}
                className={`${inputClass(
                  Boolean(getFieldError("code"))
                )} pl-10 uppercase`}
              />
            </div>
          </Field>
        </div>
      </div>

      {/* LOCATION INFORMATION */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Globe2 size={20} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Location Hierarchy
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Select the country, region and county where this city belongs.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <Field
            label="Country"
            name="country_id"
            required
            error={getFieldError("country_id")}
          >
            <div className="relative">
              <Globe2
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                id="country_id"
                name="country_id"
                value={formData.country_id}
                onChange={(event) =>
                  handleChange("country_id", event.target.value)
                }
                disabled={isSubmitting}
                className={`${selectClass(
                  Boolean(getFieldError("country_id"))
                )} pl-10`}
              >
                <option value="">Select country</option>

                {activeCountries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.display_name ||
                      country.name_with_code ||
                      country.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </Field>

          <Field
            label="Region"
            name="region_id"
            required
            error={getFieldError("region_id")}
          >
            <div className="relative">
              <Layers3
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                id="region_id"
                name="region_id"
                value={formData.region_id}
                onChange={(event) =>
                  handleChange("region_id", event.target.value)
                }
                disabled={
                  isSubmitting ||
                  !formData.country_id ||
                  activeRegions.length === 0
                }
                className={`${selectClass(
                  Boolean(getFieldError("region_id"))
                )} pl-10`}
              >
                <option value="">
                  {!formData.country_id
                    ? "Select country first"
                    : activeRegions.length === 0
                      ? "No regions available"
                      : "Select region"}
                </option>

                {activeRegions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {getName(region)}
                    {region.code ? ` (${region.code})` : ""}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </Field>

          <div className="sm:col-span-2">
            <Field
              label="County"
              name="county_id"
              required
              error={getFieldError("county_id")}
            >
              <div className="relative">
                <MapPin
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  id="county_id"
                  name="county_id"
                  value={formData.county_id}
                  onChange={(event) =>
                    handleChange("county_id", event.target.value)
                  }
                  disabled={
                    isSubmitting ||
                    !formData.region_id ||
                    activeCounties.length === 0
                  }
                  className={`${selectClass(
                    Boolean(getFieldError("county_id"))
                  )} pl-10`}
                >
                  <option value="">
                    {!formData.country_id
                      ? "Select country first"
                      : !formData.region_id
                        ? "Select region first"
                        : activeCounties.length === 0
                          ? "No counties available"
                          : "Select county"}
                  </option>

                  {activeCounties.map((county) => (
                    <option key={county.id} value={county.id}>
                      {getName(county)}
                      {county.code ? ` (${county.code})` : ""}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </Field>
          </div>
        </div>

        {selectedCountry && selectedRegion && selectedCounty && (
          <div className="mx-5 mb-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:mx-6 sm:mb-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <MapPin size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  Location Preview
                </p>

                <p className="mt-1 text-sm font-bold text-slate-800">
                  {formData.name.trim() || "City Name"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {getName(selectedCounty)},{" "}
                  {getName(selectedRegion)},{" "}
                  {getName(selectedCountry)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STATUS INFORMATION */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800">
                City Status
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Control whether this city is available in the system.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${formData.is_active
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-slate-100 text-slate-500"
                  }`}
              >
                {formData.is_active ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  {formData.is_active ? "Active City" : "Inactive City"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {formData.is_active
                    ? "This city is active and available for selection throughout the system."
                    : "This city is inactive and should not be available for new selections."}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={Boolean(formData.is_active)}
              onClick={() =>
                handleChange("is_active", !formData.is_active)
              }
              disabled={isSubmitting}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${formData.is_active
                ? "bg-emerald-500"
                : "bg-slate-300"
                }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${formData.is_active
                  ? "translate-x-6"
                  : "translate-x-1"
                  }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* FORM INFORMATION */}

      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <Info
          size={18}
          className="mt-0.5 shrink-0 text-blue-600"
        />

        <div>
          <p className="text-sm font-semibold text-blue-800">
            Important Information
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700">
            A city must belong to an active country, region and county.
            The selected region must belong to the selected country,
            and the selected county must belong to that region.
          </p>
        </div>
      </div>

      {/* FORM ACTIONS */}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowLeft size={16} />
            Cancel
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting || loading ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              {isEdit ? "Updating City..." : "Creating City..."}
            </>
          ) : (
            <>
              <Save size={17} />
              {isEdit ? "Update City" : "Create City"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CityForm;
