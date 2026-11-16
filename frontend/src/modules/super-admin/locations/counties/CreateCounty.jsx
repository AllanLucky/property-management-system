
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

import CountyHeader from "./CountyHeader";
import CountyForm from "./CountyForm";

import useCounties from "../../../../hooks/useCounties";
import useCountries from "../../../../hooks/useCountries";
import useRegions from "../../../../hooks/useRegions";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const COUNTY_INDEX_PATH = "/super-admin/counties";

const INITIAL_VALUES = {
  country_id: "",
  region_id: "",
  name: "",
  slug: "",
  code: "",
  is_active: true,
};

/*
|--------------------------------------------------------------------------
| Generate Slug
|--------------------------------------------------------------------------
*/

const generateSlug = (value) => {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
};

/*
|--------------------------------------------------------------------------
| Extract Error Message
|--------------------------------------------------------------------------
*/

const extractErrorMessage = (error) => {
  if (!error) {
    return "Unable to create county.";
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    error?.error ||
    "Unable to create county."
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
| Extract County Data
|--------------------------------------------------------------------------
*/

const extractCountyData = (response) => {
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

  // Unwrap API response.
  if (
    current.data &&
    typeof current.data === "object" &&
    !Array.isArray(current.data)
  ) {
    current = current.data;
  }

  // Handle nested county wrappers.
  for (let index = 0; index < 4; index += 1) {
    if (
      current?.county &&
      typeof current.county === "object"
    ) {
      current = current.county;
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

const isSuccessfulResponse = (response, createdCounty) => {
  if (createdCounty?.id) {
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
| Extract Countries
|--------------------------------------------------------------------------
*/

const extractCountries = (response) => {
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
| Extract Regions
|--------------------------------------------------------------------------
*/

const extractRegions = (response) => {
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

const CreateCounty = () => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | County Hook
  |--------------------------------------------------------------------------
  */

  const {
    createCounty,
    submitting,
    error,
    validationErrors,
    clearErrors,
  } = useCounties({
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
  | Normalize Lookup Records
  |--------------------------------------------------------------------------
  */

  const countries = extractCountries(countryRecords);
  const regions = extractRegions(regionRecords);

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

  const createCountyRef = useRef(createCounty);
  const clearErrorsRef = useRef(clearErrors);

  useEffect(() => {
    createCountyRef.current = createCounty;
  }, [createCounty]);

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

  const lookupLoading =
    Boolean(countriesLoading) ||
    Boolean(regionsLoading);

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

    if (name === "country_id" || name === "region_id") {
      value = value === "" ? "" : String(value);
    }

    setFieldErrors((current) => {
      const next = { ...current };

      delete next[name];

      if (name === "name") {
        delete next.slug;
      }

      if (name === "country_id") {
        delete next.region_id;
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

    const countryId = String(
      values.country_id || ""
    ).trim();

    const regionId = String(
      values.region_id || ""
    ).trim();

    const name = String(
      values.name || ""
    ).trim();

    const slug = generateSlug(name);

    const code = String(
      values.code || ""
    ).trim().toUpperCase();

    /*
    |--------------------------------------------------------------------------
    | Country Validation
    |--------------------------------------------------------------------------
    */

    if (!countryId) {
      errors.country_id = "Please select a country.";
    } else if (!/^\d+$/.test(countryId)) {
      errors.country_id = "The selected country is invalid.";
    }

    /*
    |--------------------------------------------------------------------------
    | Region Validation
    |--------------------------------------------------------------------------
    */

    if (!regionId) {
      errors.region_id = "Please select a region.";
    } else if (!/^\d+$/.test(regionId)) {
      errors.region_id = "The selected region is invalid.";
    } else {
      const selectedRegion = regions.find(
        (region) =>
          String(region.id) === regionId
      );

      if (
        selectedRegion &&
        String(selectedRegion.country_id) !== countryId
      ) {
        errors.region_id =
          "The selected region does not belong to the selected country.";
      }
    }

    /*
    |--------------------------------------------------------------------------
    | County Name Validation
    |--------------------------------------------------------------------------
    */

    if (!name) {
      errors.name = "County name is required.";
    } else if (name.length < 2 || name.length > 150) {
      errors.name =
        "County name must contain between 2 and 150 characters.";
    } else if (!/^[\p{L}\p{M}\s'-]+$/u.test(name)) {
      errors.name =
        "County name may only contain letters, spaces, apostrophes and hyphens.";
    }

    /*
    |--------------------------------------------------------------------------
    | Slug Validation
    |--------------------------------------------------------------------------
    */

    if (!slug) {
      errors.slug = "County slug could not be generated.";
    } else if (slug.length > 180) {
      errors.slug = "Slug cannot exceed 180 characters.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      errors.slug =
        "Slug may only contain lowercase letters, numbers and hyphens.";
    }

    /*
    |--------------------------------------------------------------------------
    | County Code Validation
    |--------------------------------------------------------------------------
    */

    if (code) {
      if (code.length < 2 || code.length > 20) {
        errors.code =
          "County code must contain between 2 and 20 characters.";
      } else if (!/^[A-Z0-9_-]+$/.test(code)) {
        errors.code =
          "County code may only contain letters, numbers, underscores and hyphens.";
      }
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }, [regions]);

  /*
  |--------------------------------------------------------------------------
  | Build API Payload
  |--------------------------------------------------------------------------
  */

  const buildPayload = useCallback((values) => {
    const name = String(
      values.name || ""
    ).trim();

    return {
      country_id: Number(values.country_id),
      region_id: Number(values.region_id),
      name,
      slug: generateSlug(name),
      code: String(
        values.code || ""
      ).trim().toUpperCase() || null,
      is_active: Boolean(values.is_active),
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Submit County
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

    const isValuesObject =
      eventOrValues &&
      typeof eventOrValues === "object" &&
      !eventOrValues?.target &&
      !eventOrValues?.preventDefault;

    const submittedValues = isValuesObject
      ? eventOrValues
      : {};

    /*
    |--------------------------------------------------------------------------
    | Support Native Form Submission
    |--------------------------------------------------------------------------
    */

    const formElement = eventOrValues?.currentTarget;

    const formData = formElement
      ? Object.fromEntries(
        new FormData(formElement).entries()
      )
      : {};

    /*
    |--------------------------------------------------------------------------
    | Normalize Form Values
    |--------------------------------------------------------------------------
    */

    const values = {
      ...INITIAL_VALUES,
      ...formData,
      ...submittedValues,
    };

    const normalizedValues = {
      ...values,

      country_id: String(
        values.country_id || ""
      ).trim(),

      region_id: String(
        values.region_id || ""
      ).trim(),

      name: String(
        values.name || ""
      ).trim(),

      slug: generateSlug(values.name),

      code: String(
        values.code || ""
      ).trim().toUpperCase(),

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
        console.group("[CreateCounty] Create county");
        console.log("Form values:", normalizedValues);
        console.log("API payload:", payload);
        console.groupEnd();
      }

      /*
      |--------------------------------------------------------------------------
      | API Request
      |--------------------------------------------------------------------------
      */

      const result = await createCountyRef.current(payload);

      /*
      |--------------------------------------------------------------------------
      | Extract Created County
      |--------------------------------------------------------------------------
      */

      const createdCounty = extractCountyData(result);

      /*
      |--------------------------------------------------------------------------
      | Determine Success
      |--------------------------------------------------------------------------
      */

      const requestSucceeded = isSuccessfulResponse(
        result,
        createdCounty
      );

      if (!requestSucceeded) {
        const message =
          result?.message ||
          "Unable to create county.";

        const errors =
          result?.errors || {};

        setServerError(message);
        setFieldErrors(errors);

        if (import.meta.env.DEV) {
          console.error(
            "[CreateCounty] Creation failed:",
            result
          );
        }

        await Swal.fire({
          icon: "error",
          title: "Unable to Create County",
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
        `${createdCounty?.name || "County"} created successfully.`;

      if (import.meta.env.DEV) {
        console.log(
          "[CreateCounty] Created county:",
          createdCounty
        );
      }

      await Swal.fire({
        icon: "success",
        title: "County Created Successfully",
        text: message,
        confirmButtonText: "View Counties",
        confirmButtonColor: "#4f46e5",
      });

      navigate(COUNTY_INDEX_PATH, {
        replace: true,
      });

    } catch (err) {
      const message = extractErrorMessage(err);
      const errors = extractValidationErrors(err);

      setServerError(message);
      setFieldErrors(errors);

      if (import.meta.env.DEV) {
        console.error(
          "[CreateCounty] Create failed:",
          err
        );
      }

      await Swal.fire({
        icon: "error",
        title: "Unable to Create County",
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

    navigate(COUNTY_INDEX_PATH);
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

      {/* County Header */}

      <CountyHeader loading={isCreating} />

      {/* Error Message */}

      {(serverError || error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">

          <div className="flex gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">

              <h2 className="text-sm font-semibold text-red-800">
                Unable to create county
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

      {/* Lookup Loading Notice */}

      {lookupLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">

          <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />

          <p className="text-sm font-medium text-indigo-700">
            Loading countries and regions...
          </p>
        </div>
      )}

      {/* County Form */}

      <CountyForm
        mode="create"
        initialData={INITIAL_VALUES}
        countries={countries}
        regions={regions}
        submitting={isCreating || lookupLoading}
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

export default CreateCounty;
