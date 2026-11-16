
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

import CityHeader from "./CityHeader";
import CityForm from "./CityForm";

import useCities from "../../../../hooks/useCities";
import useCountries from "../../../../hooks/useCountries";
import useRegions from "../../../../hooks/useRegions";
import useCounties from "../../../../hooks/useCounties";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const CITY_INDEX_PATH = "/super-admin/cities";

const INITIAL_VALUES = {
  country_id: "",
  region_id: "",
  county_id: "",
  name: "",
  code: "",
  is_active: true,
};

/*
|--------------------------------------------------------------------------
| Extract Error Message
|--------------------------------------------------------------------------
*/

const extractErrorMessage = (error) => {
  if (!error) {
    return "Unable to create city.";
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    error?.error ||
    "Unable to create city."
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
| Extract City Data
|--------------------------------------------------------------------------
|
| Supports:
| 1. Direct city object
| 2. API envelope: { status, data: city }
| 3. Nested envelope: { data: { data: city } }
| 4. City wrapper: { data: { city: city } }
|
|--------------------------------------------------------------------------
*/

const extractCityData = (response) => {
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
      current?.city &&
      typeof current.city === "object"
    ) {
      current = current.city;
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

const isSuccessfulResponse = (response, createdCity) => {
  if (createdCity?.id) {
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

const CreateCity = () => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | City Hook
  |--------------------------------------------------------------------------
  */

  const {
    createCity,
    submitting,
    error,
    validationErrors,
    clearErrors,
  } = useCities({
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
  | Normalize Collections
  |--------------------------------------------------------------------------
  */

  const countries = extractCollection(countryRecords);
  const regions = extractCollection(regionRecords);
  const counties = extractCollection(countyRecords);

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

  const createCityRef = useRef(createCity);
  const clearErrorsRef = useRef(clearErrors);

  useEffect(() => {
    createCityRef.current = createCity;
  }, [createCity]);

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
    Boolean(countiesLoading);

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
      name === "county_id"
    ) {
      value = value === "" ? "" : String(value);
    }

    setFieldErrors((current) => {
      const next = { ...current };

      delete next[name];

      // Clear dependent field errors when changing parents.
      if (name === "country_id") {
        delete next.region_id;
        delete next.county_id;
      }

      if (name === "region_id") {
        delete next.county_id;
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

    const name = String(values.name || "").trim();

    const code = String(values.code || "")
      .trim()
      .toUpperCase();

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
    | City Name
    |--------------------------------------------------------------------------
    */

    if (!name) {
      errors.name = "City name is required.";
    } else if (name.length < 2 || name.length > 150) {
      errors.name =
        "City name must contain between 2 and 150 characters.";
    } else if (!/^[\p{L}\p{M}\s'-]+$/u.test(name)) {
      errors.name =
        "City name may only contain letters, spaces, apostrophes and hyphens.";
    }

    /*
    |--------------------------------------------------------------------------
    | City Code
    |--------------------------------------------------------------------------
    */

    if (code && (code.length < 2 || code.length > 20)) {
      errors.code =
        "City code must contain between 2 and 20 characters.";
    } else if (code && !/^[A-Z0-9_-]+$/.test(code)) {
      errors.code =
        "City code may only contain letters, numbers, dashes and underscores.";
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
        selectedRegion.is_active === 0
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
        selectedCounty.is_active === 0
      ) {
        errors.county_id =
          "The selected county is inactive.";
      }
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }, [countries, regions, counties]);

  /*
  |--------------------------------------------------------------------------
  | Build API Payload
  |--------------------------------------------------------------------------
  */

  const buildPayload = useCallback((values) => {
    return {
      country_id: Number(values.country_id),
      region_id: Number(values.region_id),
      county_id: Number(values.county_id),
      name: String(values.name || "").trim(),
      code: String(values.code || "").trim()
        ? String(values.code).trim().toUpperCase()
        : null,
      is_active: Boolean(values.is_active),
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Submit City
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

      name: String(values.name || "").trim(),

      code: String(values.code || "")
        .trim()
        .toUpperCase(),

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
        console.group("[CreateCity] Create city");
        console.log("Form values:", normalizedValues);
        console.log("API payload:", payload);
        console.groupEnd();
      }

      /*
      |--------------------------------------------------------------------------
      | API Request
      |--------------------------------------------------------------------------
      */

      const result = await createCityRef.current(payload);

      /*
      |--------------------------------------------------------------------------
      | Extract Created City
      |--------------------------------------------------------------------------
      */

      const createdCity = extractCityData(result);

      /*
      |--------------------------------------------------------------------------
      | Determine Success
      |--------------------------------------------------------------------------
      */

      const requestSucceeded = isSuccessfulResponse(
        result,
        createdCity
      );

      if (!requestSucceeded) {
        const message =
          result?.message ||
          "Unable to create city.";

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
            "[CreateCity] Creation failed:",
            result
          );
        }

        await Swal.fire({
          icon: "error",
          title: "Unable to Create City",
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
        `${createdCity?.name || "City"} created successfully.`;

      if (import.meta.env.DEV) {
        console.log(
          "[CreateCity] Created city:",
          createdCity
        );
      }

      await Swal.fire({
        icon: "success",
        title: "City Created Successfully",
        text: message,
        confirmButtonText: "View Cities",
        confirmButtonColor: "#4f46e5",
      });

      navigate(CITY_INDEX_PATH, {
        replace: true,
      });
    } catch (err) {
      const message = extractErrorMessage(err);
      const errors = extractValidationErrors(err);

      setServerError(message);
      setFieldErrors(errors);

      if (import.meta.env.DEV) {
        console.error(
          "[CreateCity] Create failed:",
          err
        );
      }

      await Swal.fire({
        icon: "error",
        title: "Unable to Create City",
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

    navigate(CITY_INDEX_PATH);
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
      {/* City Header */}

      <CityHeader loading={isCreating} />

      {/* Location Loading */}

      {isLoadingLocations && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
          <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />

          <p className="text-sm font-medium text-indigo-700">
            Loading countries, regions and counties...
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
                Unable to create city
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

      {/* City Form */}

      <CityForm
        mode="create"
        initialData={INITIAL_VALUES}
        countries={countries}
        regions={regions}
        counties={counties}
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

export default CreateCity;
