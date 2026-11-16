import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import AreaHeader from "./AreaHeader";
import AreaForm from "./AreaForm";

import useAreas from "../../../../hooks/useAreas";
import useCountries from "../../../../hooks/useCountries";
import useRegions from "../../../../hooks/useRegions";
import useCounties from "../../../../hooks/useCounties";
import useCities from "../../../../hooks/useCities";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const AREA_INDEX_PATH = "/super-admin/areas";

const INITIAL_VALUES = {
  country_id: "",
  region_id: "",
  county_id: "",
  city_id: "",
  name: "",
  code: "",
  slug: "",
  latitude: "",
  longitude: "",
  is_active: true,
};

/*
|--------------------------------------------------------------------------
| Extract Error Message
|--------------------------------------------------------------------------
*/

const extractErrorMessage = (error) => {
  if (!error) {
    return "Unable to create area.";
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    error?.error ||
    "Unable to create area."
  );
};

/*
|--------------------------------------------------------------------------
| Extract Validation Errors
|--------------------------------------------------------------------------
*/

const extractValidationErrors = (error) => {
  const errors =
    error?.response?.data?.errors ||
    error?.data?.errors ||
    error?.errors ||
    {};

  return (
    errors &&
    typeof errors === "object" &&
    !Array.isArray(errors)
  )
    ? errors
    : {};
};

/*
|--------------------------------------------------------------------------
| Extract Area Data
|--------------------------------------------------------------------------
|
| Supports:
| 1. Direct area object
| 2. API envelope: { status, data: area }
| 3. Nested envelope: { data: { data: area } }
| 4. Area wrapper: { data: { area: area } }
|
|--------------------------------------------------------------------------
*/

const extractAreaData = (response) => {
  if (!response || typeof response !== "object") {
    return null;
  }

  let current = response;

  // Unwrap Axios response.
  if (
    current.data &&
    typeof current.data === "object" &&
    (
      current.status === undefined ||
      typeof current.status === "number"
    )
  ) {
    current = current.data;
  }

  // Unwrap API envelope.
  if (
    current.data &&
    typeof current.data === "object" &&
    !Array.isArray(current.data)
  ) {
    current = current.data;
  }

  // Support nested wrappers.
  for (let index = 0; index < 4; index += 1) {
    if (
      current?.area &&
      typeof current.area === "object"
    ) {
      current = current.area;
      continue;
    }

    if (
      current?.data &&
      typeof current.data === "object" &&
      !Array.isArray(current.data)
    ) {
      current = current.data;
      continue;
    }

    break;
  }

  return (
    current &&
    typeof current === "object" &&
    current.id
  )
    ? current
    : null;
};

/*
|--------------------------------------------------------------------------
| Check Request Success
|--------------------------------------------------------------------------
*/

const isSuccessfulResponse = (response, createdArea) => {
  if (createdArea?.id) {
    return true;
  }

  if (response?.success === true) {
    return true;
  }

  if (response?.status === true) {
    return true;
  }

  if (
    response?.status === 201 ||
    response?.status === 200
  ) {
    return true;
  }

  return false;
};

/*
|--------------------------------------------------------------------------
| Extract Collection
|--------------------------------------------------------------------------
|
| Supports:
| 1. Direct array
| 2. { data: [] }
| 3. { data: { data: [] } }
| 4. { data: { data: { data: [] } } }
|
|--------------------------------------------------------------------------
*/

const extractCollection = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.data?.data?.data)) {
    return response.data.data.data;
  }

  return [];
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const CreateArea = () => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | Area Hook
  |--------------------------------------------------------------------------
  */

  const {
    createArea,
    submitting,
    error,
    validationErrors,
    clearErrors,
  } = useAreas({
    autoFetch: false,
  });

  /*
  |--------------------------------------------------------------------------
  | Country Hook
  |--------------------------------------------------------------------------
  */

  const {
    countries: countryRecords = [],
    loading: countriesLoading = false,
  } = useCountries({
    autoFetch: true,
  });

  /*
  |--------------------------------------------------------------------------
  | Region Hook
  |--------------------------------------------------------------------------
  */

  const {
    regions: regionRecords = [],
    loading: regionsLoading = false,
  } = useRegions({
    autoFetch: true,
  });

  /*
  |--------------------------------------------------------------------------
  | County Hook
  |--------------------------------------------------------------------------
  */

  const {
    counties: countyRecords = [],
    loading: countiesLoading = false,
  } = useCounties({
    autoFetch: true,
  });

  /*
  |--------------------------------------------------------------------------
  | City Hook
  |--------------------------------------------------------------------------
  */

  const {
    cities: cityRecords = [],
    loading: citiesLoading = false,
  } = useCities({
    autoFetch: true,
  });

  /*
  |--------------------------------------------------------------------------
  | Normalize Collections
  |--------------------------------------------------------------------------
  */

  const countries = extractCollection(countryRecords);
  const regions = extractCollection(regionRecords);
  const counties = extractCollection(countyRecords);
  const cities = extractCollection(cityRecords);

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [submittingForm, setSubmittingForm] = useState(false);

  const [serverError, setServerError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  /*
  |--------------------------------------------------------------------------
  | Stable Function Refs
  |--------------------------------------------------------------------------
  */

  const createAreaRef = useRef(createArea);
  const clearErrorsRef = useRef(clearErrors);

  useEffect(() => {
    createAreaRef.current = createArea;
  }, [createArea]);

  useEffect(() => {
    clearErrorsRef.current = clearErrors;
  }, [clearErrors]);

  /*
  |--------------------------------------------------------------------------
  | Request Guard
  |--------------------------------------------------------------------------
  */

  const submissionStartedRef = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  const isCreating =
    Boolean(submittingForm) ||
    Boolean(submitting);

  const isLoadingLocations =
    Boolean(countriesLoading) ||
    Boolean(regionsLoading) ||
    Boolean(countiesLoading) ||
    Boolean(citiesLoading);

  /*
  |--------------------------------------------------------------------------
  | Handle Field Changes
  |--------------------------------------------------------------------------
  */

  const handleChange = useCallback((eventOrField, maybeValue) => {
    let name;
    let value;

    if (typeof eventOrField === "string") {
      name = eventOrField;
      value = maybeValue;
    } else {
      name = eventOrField?.target?.name;

      if (eventOrField?.target?.type === "checkbox") {
        value = eventOrField.target.checked;
      } else {
        value = eventOrField?.target?.value;
      }
    }

    if (!name) {
      return;
    }

    if (name === "code") {
      value = String(value || "").trim().toUpperCase();
    }

    if (
      name === "country_id" ||
      name === "region_id" ||
      name === "county_id" ||
      name === "city_id"
    ) {
      value = value === "" ? "" : String(value);
    }

    setFieldErrors((current) => {
      const next = { ...current };

      delete next[name];

      if (name === "country_id") {
        delete next.region_id;
        delete next.county_id;
        delete next.city_id;
      }

      if (name === "region_id") {
        delete next.county_id;
        delete next.city_id;
      }

      if (name === "county_id") {
        delete next.city_id;
      }

      return next;
    });

    setServerError("");
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Client Validation
  |--------------------------------------------------------------------------
  */

  const validate = useCallback((values) => {
    const errors = {};

    const countryId = String(values.country_id || "").trim();
    const regionId = String(values.region_id || "").trim();
    const countyId = String(values.county_id || "").trim();
    const cityId = String(values.city_id || "").trim();

    const name = String(values.name || "").trim();

    const code = String(values.code || "")
      .trim()
      .toUpperCase();

    const slug = String(values.slug || "").trim();

    const latitude = String(values.latitude ?? "").trim();
    const longitude = String(values.longitude ?? "").trim();

    /*
    |--------------------------------------------------------------------------
    | Country
    |--------------------------------------------------------------------------
    */

    if (!countryId) {
      errors.country_id = "Please select a country.";
    } else if (!/^\d+$/.test(countryId)) {
      errors.country_id = "The selected country is invalid.";
    }

    /*
    |--------------------------------------------------------------------------
    | Region
    |--------------------------------------------------------------------------
    */

    if (!regionId) {
      errors.region_id = "Please select a region.";
    } else if (!/^\d+$/.test(regionId)) {
      errors.region_id = "The selected region is invalid.";
    }

    /*
    |--------------------------------------------------------------------------
    | County
    |--------------------------------------------------------------------------
    */

    if (!countyId) {
      errors.county_id = "Please select a county.";
    } else if (!/^\d+$/.test(countyId)) {
      errors.county_id = "The selected county is invalid.";
    }

    /*
    |--------------------------------------------------------------------------
    | City
    |--------------------------------------------------------------------------
    */

    if (!cityId) {
      errors.city_id = "Please select a city.";
    } else if (!/^\d+$/.test(cityId)) {
      errors.city_id = "The selected city is invalid.";
    }

    /*
    |--------------------------------------------------------------------------
    | Area Name
    |--------------------------------------------------------------------------
    */

    if (!name) {
      errors.name = "Area name is required.";
    } else if (name.length < 2 || name.length > 255) {
      errors.name =
        "Area name must contain between 2 and 255 characters.";
    }

    /*
    |--------------------------------------------------------------------------
    | Area Code
    |--------------------------------------------------------------------------
    */

    if (!code) {
      errors.code = "Area code is required.";
    } else if (code.length < 2 || code.length > 50) {
      errors.code =
        "Area code must contain between 2 and 50 characters.";
    } else if (!/^[A-Z0-9_-]+$/.test(code)) {
      errors.code =
        "Area code may only contain letters, numbers, dashes and underscores.";
    }

    /*
    |--------------------------------------------------------------------------
    | Slug
    |--------------------------------------------------------------------------
    */

    if (slug && slug.length > 255) {
      errors.slug = "Slug cannot exceed 255 characters.";
    }

    /*
    |--------------------------------------------------------------------------
    | Latitude
    |--------------------------------------------------------------------------
    */

    if (latitude !== "") {
      const latitudeNumber = Number(latitude);

      if (!Number.isFinite(latitudeNumber)) {
        errors.latitude = "Latitude must be a valid number.";
      } else if (
        latitudeNumber < -90 ||
        latitudeNumber > 90
      ) {
        errors.latitude =
          "Latitude must be between -90 and 90.";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Longitude
    |--------------------------------------------------------------------------
    */

    if (longitude !== "") {
      const longitudeNumber = Number(longitude);

      if (!Number.isFinite(longitudeNumber)) {
        errors.longitude = "Longitude must be a valid number.";
      } else if (
        longitudeNumber < -180 ||
        longitudeNumber > 180
      ) {
        errors.longitude =
          "Longitude must be between -180 and 180.";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Location Relationship Validation
    |--------------------------------------------------------------------------
    */

    const selectedCountry = countries.find(
      (country) => String(country.id) === countryId
    );

    const selectedRegion = regions.find(
      (region) => String(region.id) === regionId
    );

    const selectedCounty = counties.find(
      (county) => String(county.id) === countyId
    );

    const selectedCity = cities.find(
      (city) => String(city.id) === cityId
    );

    if (countryId && !selectedCountry) {
      errors.country_id =
        "The selected country could not be found.";
    }

    if (regionId && selectedRegion) {
      if (String(selectedRegion.country_id) !== countryId) {
        errors.region_id =
          "The selected region does not belong to the selected country.";
      }

      if (
        selectedRegion.is_active === false ||
        selectedRegion.is_active === 0 ||
        selectedRegion.is_active === "0"
      ) {
        errors.region_id =
          "The selected region is inactive.";
      }
    }

    if (countyId && selectedCounty) {
      if (String(selectedCounty.country_id) !== countryId) {
        errors.county_id =
          "The selected county does not belong to the selected country.";
      } else if (
        String(selectedCounty.region_id) !== regionId
      ) {
        errors.county_id =
          "The selected county does not belong to the selected region.";
      }

      if (
        selectedCounty.is_active === false ||
        selectedCounty.is_active === 0 ||
        selectedCounty.is_active === "0"
      ) {
        errors.county_id =
          "The selected county is inactive.";
      }
    }

    if (cityId && selectedCity) {
      if (String(selectedCity.country_id) !== countryId) {
        errors.city_id =
          "The selected city does not belong to the selected country.";
      } else if (
        String(selectedCity.region_id) !== regionId
      ) {
        errors.city_id =
          "The selected city does not belong to the selected region.";
      } else if (
        String(selectedCity.county_id) !== countyId
      ) {
        errors.city_id =
          "The selected city does not belong to the selected county.";
      }

      if (
        selectedCity.is_active === false ||
        selectedCity.is_active === 0 ||
        selectedCity.is_active === "0"
      ) {
        errors.city_id =
          "The selected city is inactive.";
      }
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }, [
    countries,
    regions,
    counties,
    cities,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Build API Payload
  |--------------------------------------------------------------------------
  */

  const buildPayload = useCallback((values) => {
    const latitude = String(values.latitude ?? "").trim();
    const longitude = String(values.longitude ?? "").trim();
    const slug = String(values.slug || "").trim();

    const payload = {
      country_id: Number(values.country_id),
      region_id: Number(values.region_id),
      county_id: Number(values.county_id),
      city_id: Number(values.city_id),

      name: String(values.name || "").trim(),

      code: String(values.code || "")
        .trim()
        .toUpperCase(),

      latitude: latitude === "" ? null : Number(latitude),

      longitude: longitude === "" ? null : Number(longitude),

      is_active: Boolean(values.is_active),
    };

    // Slug is optional in StoreAreaRequest.
    if (slug) {
      payload.slug = slug.toLowerCase();
    }

    return payload;
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Submit Area
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (eventOrValues) => {
    eventOrValues?.preventDefault?.();

    if (submissionStartedRef.current) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Read Submitted Values
    |--------------------------------------------------------------------------
    */

    const isFormEvent = Boolean(
      eventOrValues?.preventDefault
    );

    const formElement = isFormEvent
      ? eventOrValues.currentTarget
      : null;

    const formData = formElement
      ? Object.fromEntries(
        new FormData(formElement).entries()
      )
      : {};

    const submittedValues =
      eventOrValues &&
        typeof eventOrValues === "object" &&
        !isFormEvent &&
        !eventOrValues?.target
        ? eventOrValues
        : {};

    const values = {
      ...INITIAL_VALUES,
      ...formData,
      ...submittedValues,
    };

    /*
    |--------------------------------------------------------------------------
    | Normalize Values
    |--------------------------------------------------------------------------
    */

    const normalizedValues = {
      ...values,

      country_id: String(values.country_id || "").trim(),

      region_id: String(values.region_id || "").trim(),

      county_id: String(values.county_id || "").trim(),

      city_id: String(values.city_id || "").trim(),

      name: String(values.name || "").trim(),

      code: String(values.code || "")
        .trim()
        .toUpperCase(),

      slug: String(values.slug || "").trim(),

      latitude: String(values.latitude ?? "").trim(),

      longitude: String(values.longitude ?? "").trim(),

      is_active:
        values.is_active === false ||
          values.is_active === "false" ||
          values.is_active === 0 ||
          values.is_active === "0"
          ? false
          : true,
    };

    /*
    |--------------------------------------------------------------------------
    | Validate
    |--------------------------------------------------------------------------
    */

    if (!validate(normalizedValues)) {
      return;
    }

    try {
      submissionStartedRef.current = true;

      setSubmittingForm(true);
      setServerError("");
      setFieldErrors({});

      clearErrorsRef.current?.();

      const payload = buildPayload(normalizedValues);

      /*
      |--------------------------------------------------------------------------
      | Development Debugging
      |--------------------------------------------------------------------------
      */

      if (import.meta.env.DEV) {
        console.group("[CreateArea] Create area");
        console.log("Form values:", normalizedValues);
        console.log("API payload:", payload);
        console.groupEnd();
      }

      /*
      |--------------------------------------------------------------------------
      | API Request
      |--------------------------------------------------------------------------
      */

      const result = await createAreaRef.current(payload);

      /*
      |--------------------------------------------------------------------------
      | Extract Created Area
      |--------------------------------------------------------------------------
      */

      const createdArea = extractAreaData(result);

      /*
      |--------------------------------------------------------------------------
      | Determine Success
      |--------------------------------------------------------------------------
      */

      const requestSucceeded = isSuccessfulResponse(
        result,
        createdArea
      );

      if (!requestSucceeded) {
        const message =
          result?.message ||
          "Unable to create area.";

        const errors = result?.errors || {};

        setServerError(message);

        setFieldErrors(
          errors &&
            typeof errors === "object" &&
            !Array.isArray(errors)
            ? errors
            : {}
        );

        if (import.meta.env.DEV) {
          console.error(
            "[CreateArea] Creation failed:",
            result
          );
        }

        await Swal.fire({
          icon: "error",
          title: "Unable to Create Area",
          text: message,
          confirmButtonText: "Close",
          confirmButtonColor: "#dc2626",
        });

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Success
      |--------------------------------------------------------------------------
      */

      const message =
        result?.message ||
        `${createdArea?.name || "Area"} created successfully.`;

      if (import.meta.env.DEV) {
        console.log(
          "[CreateArea] Created area:",
          createdArea
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Area Created Successfully",
        text: message,
        confirmButtonText: "View Areas",
        confirmButtonColor: "#4f46e5",
      });

      navigate(AREA_INDEX_PATH, {
        replace: true,
      });
    } catch (err) {
      const message = extractErrorMessage(err);
      const errors = extractValidationErrors(err);

      setServerError(message);
      setFieldErrors(errors);

      if (import.meta.env.DEV) {
        console.error(
          "[CreateArea] Create failed:",
          err
        );
      }

      await Swal.fire({
        icon: "error",
        title: "Unable to Create Area",
        text: message,
        confirmButtonText: "Close",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      submissionStartedRef.current = false;
      setSubmittingForm(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Cancel
  |--------------------------------------------------------------------------
  */

  const handleCancel = useCallback(() => {
    if (isCreating) {
      return;
    }

    navigate(AREA_INDEX_PATH);
  }, [isCreating, navigate]);

  /*
  |--------------------------------------------------------------------------
  | Dismiss Error
  |--------------------------------------------------------------------------
  */

  const handleRetry = useCallback(() => {
    setServerError("");
    setFieldErrors({});
    clearErrorsRef.current?.();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 space-y-6">

      {/* Area Header */}

      <AreaHeader loading={isCreating} />

      {/* Location Loading */}

      {isLoadingLocations && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
          <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />

          <p className="text-sm font-medium text-indigo-700">
            Loading countries, regions, counties and cities...
          </p>
        </div>
      )}

      {/* Error Message */}

      {(serverError || error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-red-800">
                Unable to create area
              </h2>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {serverError || extractErrorMessage(error)}
              </p>

              <button
                type="button"
                onClick={handleRetry}
                disabled={isCreating}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Dismiss Error
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Area Form */}

      <AreaForm
        mode="create"
        initialData={INITIAL_VALUES}
        countries={countries}
        regions={regions}
        counties={counties}
        cities={cities}
        submitting={isCreating || isLoadingLocations}
        errors={{
          ...(validationErrors || {}),
          ...(fieldErrors || {}),
        }}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default CreateArea;