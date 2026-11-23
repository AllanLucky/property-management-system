import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  Navigation,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getId = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
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
  country_id: getId(
    data.country_id ?? data.country?.id
  ),

  region_id: getId(
    data.region_id ?? data.region?.id
  ),

  county_id: getId(
    data.county_id ?? data.county?.id
  ),

  city_id: getId(
    data.city_id ?? data.city?.id
  ),

  name: data.name || "",

  code: data.code || "",

  latitude:
    data.latitude ??
    data.coordinates?.latitude ??
    "",

  longitude:
    data.longitude ??
    data.coordinates?.longitude ??
    "",

  is_active:
    data.is_active === undefined ||
      data.is_active === null
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

const isValidCoordinate = (value) => {
  return (
    value === "" ||
    value === null ||
    value === undefined ||
    (
      value.trim() !== "" &&
      Number.isFinite(Number(value))
    )
  );
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
        <AlertCircle
          size={14}
          className="mt-0.5 shrink-0"
        />

        {error}
      </p>
    )}

    {!error && hint && (
      <p className="text-xs text-slate-500">
        {hint}
      </p>
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
| AREA FORM
|--------------------------------------------------------------------------
*/

const AreaForm = ({
  initialData = {},
  values,
  onSubmit,
  onCancel,

  countries = [],
  regions = [],
  counties = [],
  cities = [],

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

  const isSubmitting = Boolean(submitting);

  /*
  |--------------------------------------------------------------------------
  | SYNC FORM DATA
  |--------------------------------------------------------------------------
  */

  const sourceKey = JSON.stringify(
    getInitialFormData(values || initialData)
  );

  useEffect(() => {
    const nextData = getInitialFormData(
      values || initialData
    );

    setFormData((previous) => {
      if (
        JSON.stringify(previous) ===
        JSON.stringify(nextData)
      ) {
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
      if (!isActive(region)) {
        return false;
      }

      return (
        !formData.country_id ||
        getId(region.country_id) === formData.country_id
      );
    });
  }, [regions, formData.country_id]);

  const activeCounties = useMemo(() => {
    return counties.filter((county) => {
      if (!isActive(county)) {
        return false;
      }

      const matchesCountry =
        !formData.country_id ||
        getId(county.country_id) === formData.country_id;

      const matchesRegion =
        !formData.region_id ||
        getId(county.region_id) === formData.region_id;

      return matchesCountry && matchesRegion;
    });
  }, [
    counties,
    formData.country_id,
    formData.region_id,
  ]);

  const activeCities = useMemo(() => {
    return cities.filter((city) => {
      if (!isActive(city)) {
        return false;
      }

      const matchesCountry =
        !formData.country_id ||
        getId(city.country_id) === formData.country_id;

      const matchesRegion =
        !formData.region_id ||
        getId(city.region_id) === formData.region_id;

      const matchesCounty =
        !formData.county_id ||
        getId(city.county_id) === formData.county_id;

      return (
        matchesCountry &&
        matchesRegion &&
        matchesCounty
      );
    });
  }, [
    cities,
    formData.country_id,
    formData.region_id,
    formData.county_id,
  ]);

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

  const selectedCity = useMemo(
    () =>
      cities.find(
        (city) =>
          getId(city.id) === formData.city_id
      ),
    [cities, formData.city_id]
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
        updated.city_id = "";
      }

      if (field === "region_id") {
        updated.county_id = "";
        updated.city_id = "";
      }

      if (field === "county_id") {
        updated.city_id = "";
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
        updated.city_id = "";
      }

      if (field === "region_id") {
        updated.county_id = "";
        updated.city_id = "";
      }

      if (field === "county_id") {
        updated.city_id = "";
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

    /*
    |--------------------------------------------------------------------------
    | LOCATION VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!formData.country_id) {
      validation.country_id =
        "Please select a country.";
    }

    if (!formData.region_id) {
      validation.region_id =
        "Please select a region.";
    }

    if (!formData.county_id) {
      validation.county_id =
        "Please select a county.";
    }

    if (!formData.city_id) {
      validation.city_id =
        "Please select a city.";
    }

    /*
    |--------------------------------------------------------------------------
    | AREA NAME
    |--------------------------------------------------------------------------
    */

    const areaName = formData.name.trim();

    if (!areaName) {
      validation.name =
        "Please enter the area name.";
    } else if (areaName.length < 2) {
      validation.name =
        "The area name must contain at least 2 characters.";
    } else if (areaName.length > 255) {
      validation.name =
        "The area name cannot exceed 255 characters.";
    }

    /*
    |--------------------------------------------------------------------------
    | AREA CODE
    |--------------------------------------------------------------------------
    */

    const areaCode = formData.code.trim();

    if (!areaCode) {
      validation.code =
        "Please enter the area code.";
    } else if (areaCode.length < 2) {
      validation.code =
        "The area code must contain at least 2 characters.";
    } else if (areaCode.length > 50) {
      validation.code =
        "The area code cannot exceed 50 characters.";
    }

    /*
    |--------------------------------------------------------------------------
    | LATITUDE
    |--------------------------------------------------------------------------
    */

    const latitude = formData.latitude;

    if (!isValidCoordinate(latitude)) {
      validation.latitude =
        "Latitude must be a valid number.";
    } else if (
      latitude !== "" &&
      latitude !== null &&
      latitude !== undefined &&
      (Number(latitude) < -90 || Number(latitude) > 90)
    ) {
      validation.latitude =
        "Latitude must be between -90 and 90.";
    }

    /*
    |--------------------------------------------------------------------------
    | LONGITUDE
    |--------------------------------------------------------------------------
    */

    const longitude = formData.longitude;

    if (!isValidCoordinate(longitude)) {
      validation.longitude =
        "Longitude must be a valid number.";
    } else if (
      longitude !== "" &&
      longitude !== null &&
      longitude !== undefined &&
      (Number(longitude) < -180 || Number(longitude) > 180)
    ) {
      validation.longitude =
        "Longitude must be between -180 and 180.";
    }

    setClientErrors(validation);

    setTouched({
      country_id: true,
      region_id: true,
      county_id: true,
      city_id: true,
      name: true,
      code: true,
      latitude: true,
      longitude: true,
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

    if (isSubmitting || loading) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    const payload = {
      country_id: Number(formData.country_id),

      region_id: Number(formData.region_id),

      county_id: Number(formData.county_id),

      city_id: Number(formData.city_id),

      name: formData.name.trim(),

      code: formData.code.trim().toUpperCase(),

      latitude:
        formData.latitude === "" ||
          formData.latitude === null
          ? null
          : Number(formData.latitude),

      longitude:
        formData.longitude === "" ||
          formData.longitude === null
          ? null
          : Number(formData.longitude),

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
                Area Information
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                Enter the basic details of the area.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">

          {/* AREA NAME */}

          <Field
            label="Area Name"
            name="name"
            required
            error={getFieldError("name")}
            hint="Enter the official name of the area."
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
                placeholder="e.g. Embakasi"
                maxLength={255}
                disabled={isSubmitting}
                className={`${inputClass(
                  Boolean(getFieldError("name"))
                )} pl-10`}
              />
            </div>
          </Field>

          {/* AREA CODE */}

          <Field
            label="Area Code"
            name="code"
            required
            error={getFieldError("code")}
            hint="Enter a unique area code. Example: NBO-EMB."
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
                placeholder="e.g. NBO-EMB"
                maxLength={50}
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
                Select the country, region, county and city where this area belongs.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">

          {/* COUNTRY */}

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
                <option value="">
                  Select country
                </option>

                {activeCountries.map((country) => (
                  <option
                    key={country.id}
                    value={country.id}
                  >
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

          {/* REGION */}

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
                  <option
                    key={region.id}
                    value={region.id}
                  >
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

          {/* COUNTY */}

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
                  <option
                    key={county.id}
                    value={county.id}
                  >
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

          {/* CITY */}

          <Field
            label="City"
            name="city_id"
            required
            error={getFieldError("city_id")}
            hint="Select the city where this area is located."
          >
            <div className="relative">
              <Building2
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                id="city_id"
                name="city_id"
                value={formData.city_id}
                onChange={(event) =>
                  handleChange("city_id", event.target.value)
                }
                disabled={
                  isSubmitting ||
                  !formData.county_id ||
                  activeCities.length === 0
                }
                className={`${selectClass(
                  Boolean(getFieldError("city_id"))
                )} pl-10`}
              >
                <option value="">
                  {!formData.country_id
                    ? "Select country first"
                    : !formData.region_id
                      ? "Select region first"
                      : !formData.county_id
                        ? "Select county first"
                        : activeCities.length === 0
                          ? "No cities available"
                          : "Select city"}
                </option>

                {activeCities.map((city) => (
                  <option
                    key={city.id}
                    value={city.id}
                  >
                    {getName(city)}
                    {city.code ? ` (${city.code})` : ""}
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

        {/* LOCATION PREVIEW */}

        {selectedCountry &&
          selectedRegion &&
          selectedCounty &&
          selectedCity && (
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
                    {formData.name.trim() || "Area Name"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {getName(selectedCity)},{" "}
                    {getName(selectedCounty)},{" "}
                    {getName(selectedRegion)},{" "}
                    {getName(selectedCountry)}
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* GEOGRAPHIC COORDINATES */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
              <Navigation size={20} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Geographic Coordinates
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                Optionally provide the geographical position of this area.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">

          {/* LATITUDE */}

          <Field
            label="Latitude"
            name="latitude"
            error={getFieldError("latitude")}
            hint="Valid range: -90 to 90."
          >
            <div className="relative">
              <Navigation
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 -rotate-45 text-slate-400"
              />

              <input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                min="-90"
                max="90"
                value={formData.latitude}
                onChange={(event) =>
                  handleChange("latitude", event.target.value)
                }
                placeholder="e.g. -1.318"
                disabled={isSubmitting}
                className={`${inputClass(
                  Boolean(getFieldError("latitude"))
                )} pl-10`}
              />
            </div>
          </Field>

          {/* LONGITUDE */}

          <Field
            label="Longitude"
            name="longitude"
            error={getFieldError("longitude")}
            hint="Valid range: -180 to 180."
          >
            <div className="relative">
              <MapPin
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                min="-180"
                max="180"
                value={formData.longitude}
                onChange={(event) =>
                  handleChange("longitude", event.target.value)
                }
                placeholder="e.g. 36.900"
                disabled={isSubmitting}
                className={`${inputClass(
                  Boolean(getFieldError("longitude"))
                )} pl-10`}
              />
            </div>
          </Field>
        </div>

        <div className="mx-5 mb-5 flex items-start gap-2 rounded-lg bg-cyan-50 p-3 sm:mx-6 sm:mb-6">
          <Info
            size={16}
            className="mt-0.5 shrink-0 text-cyan-600"
          />

          <p className="text-xs leading-5 text-cyan-700">
            Coordinates are optional. If available, enter the
            latitude and longitude to help identify the precise
            geographical position of the area.
          </p>
        </div>
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
                Area Status
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                Control whether this area is available in the system.
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
                  {formData.is_active
                    ? "Active Area"
                    : "Inactive Area"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {formData.is_active
                    ? "This area is active and available for selection throughout the system."
                    : "This area is inactive and should not be available for new selections."}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={Boolean(formData.is_active)}
              onClick={() =>
                handleChange(
                  "is_active",
                  !formData.is_active
                )
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
            An area must belong to a valid city, county, region
            and country. The selected city must belong to the
            selected county, region and country. Area codes must
            be unique. Coordinates are optional.
          </p>
        </div>
      </div>

      {/* FORM ACTIONS */}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">

          {/* CANCEL */}

          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowLeft size={16} />
            Cancel
          </button>

          {/* RESET */}

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

        {/* SUBMIT */}

        <button
          type="submit"
          disabled={isSubmitting || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting || loading ? (
            <>
              <Loader2
                size={17}
                className="animate-spin"
              />

              {isEdit
                ? "Updating Area..."
                : "Creating Area..."}
            </>
          ) : (
            <>
              <Save size={17} />

              {isEdit
                ? "Update Area"
                : "Create Area"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default AreaForm;
