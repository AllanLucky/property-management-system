
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

import RegionHeader from "./RegionHeader";
import RegionForm from "./RegionForm";

import useRegions from "../../../../hooks/useRegions";
import useCountries from "../../../../hooks/useCountries";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const REGION_INDEX_PATH = "/super-admin/regions";

const INITIAL_VALUES = {
  country_id: "",
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
    return "Unable to create region.";
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    error?.error ||
    "Unable to create region."
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
| Extract Region Data
|--------------------------------------------------------------------------
|
| Supports:
| 1. Direct region object
| 2. API envelope: { status, data: region }
| 3. Nested envelope: { data: { data: region } }
| 4. Region wrapper: { data: { region: region } }
|
|--------------------------------------------------------------------------
*/

const extractRegionData = (response) => {
  if (!response || typeof response !== "object") {
    return null;
  }

  let current = response;

  // Unwrap Axios response when necessary.
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

  // Support nested data wrappers.
  for (let index = 0; index < 4; index += 1) {
    if (current?.region && typeof current.region === "object") {
      current = current.region;
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

const isSuccessfulResponse = (response, createdRegion) => {
  if (createdRegion?.id) {
    return true;
  }

  if (response?.success === true) {
    return true;
  }

  if (response?.status === true) {
    return true;
  }

  if (response?.status === 201 || response?.status === 200) {
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
| Component
|--------------------------------------------------------------------------
*/

const CreateRegion = () => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | Region Hook
  |--------------------------------------------------------------------------
  */

  const {
    createRegion,
    submitting,
    error,
    validationErrors,
    clearErrors,
  } = useRegions({
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

  const countries = extractCountries(countryRecords);

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

  const createRegionRef = useRef(createRegion);
  const clearErrorsRef = useRef(clearErrors);

  useEffect(() => {
    createRegionRef.current = createRegion;
  }, [createRegion]);

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

    if (name === "country_id") {
      value = value === "" ? "" : String(value);
    }

    setFieldErrors((current) => {
      const next = { ...current };

      delete next[name];

      if (name === "name") {
        delete next.slug;
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
    const name = String(values.name || "").trim();
    const slug = generateSlug(name);
    const code = String(values.code || "").trim().toUpperCase();

    // Country validation.
    if (!countryId) {
      errors.country_id = "Please select a country.";
    } else if (!/^\d+$/.test(countryId)) {
      errors.country_id = "The selected country is invalid.";
    }

    // Region name validation.
    if (!name) {
      errors.name = "Region name is required.";
    } else if (name.length < 2 || name.length > 100) {
      errors.name =
        "Region name must contain between 2 and 100 characters.";
    } else if (!/^[\p{L}\p{M}\s'-]+$/u.test(name)) {
      errors.name =
        "Region name may only contain letters, spaces, apostrophes and hyphens.";
    }

    // Slug validation.
    if (!slug) {
      errors.slug = "Region slug could not be generated.";
    } else if (slug.length > 150) {
      errors.slug = "Slug cannot exceed 150 characters.";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      errors.slug =
        "Slug may only contain letters, numbers, hyphens and underscores.";
    }

    // Region code validation.
    if (!code) {
      errors.code = "Region code is required.";
    } else if (code.length < 2 || code.length > 10) {
      errors.code =
        "Region code must contain between 2 and 10 characters.";
    } else if (!/^[A-Z0-9_-]+$/.test(code)) {
      errors.code =
        "Region code may only contain letters, numbers, dashes and underscores.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Build API Payload
  |--------------------------------------------------------------------------
  */

  const buildPayload = useCallback((values) => {
    const name = String(values.name || "").trim();

    return {
      country_id: Number(values.country_id),
      name,
      slug: generateSlug(name),
      code: String(values.code || "").trim().toUpperCase(),
      is_active: Boolean(values.is_active),
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Submit Region
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

    const submittedValues =
      eventOrValues &&
        !eventOrValues?.target &&
        typeof eventOrValues === "object"
        ? {
          ...INITIAL_VALUES,
          ...eventOrValues,
        }
        : {
          ...INITIAL_VALUES,
          ...eventOrValues?.target?.elements
            ? {}
            : {},
        };

    /*
    |--------------------------------------------------------------------------
    | Normalize Values
    |--------------------------------------------------------------------------
    |
    | RegionForm may submit its own values or use a native form event.
    | This component supports both.
    |
    |--------------------------------------------------------------------------
    */

    const formElement = eventOrValues?.currentTarget;

    const formData = formElement
      ? Object.fromEntries(new FormData(formElement).entries())
      : {};

    const values = {
      ...INITIAL_VALUES,
      ...formData,
      ...(eventOrValues &&
        typeof eventOrValues === "object" &&
        !eventOrValues?.preventDefault &&
        !eventOrValues?.target
        ? eventOrValues
        : {}),
      ...submittedValues,
    };

    const normalizedValues = {
      ...values,
      country_id: String(values.country_id || "").trim(),
      name: String(values.name || "").trim(),
      slug: generateSlug(values.name),
      code: String(values.code || "").trim().toUpperCase(),
      is_active:
        values.is_active === false ||
          values.is_active === "false" ||
          values.is_active === 0
          ? false
          : true,
    };

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
        console.group("[CreateRegion] Create region");
        console.log("Form values:", normalizedValues);
        console.log("API payload:", payload);
        console.groupEnd();
      }

      /*
      |--------------------------------------------------------------------------
      | API Request
      |--------------------------------------------------------------------------
      */

      const result = await createRegionRef.current(payload);

      /*
      |--------------------------------------------------------------------------
      | Extract Created Region
      |--------------------------------------------------------------------------
      */

      const createdRegion = extractRegionData(result);

      /*
      |--------------------------------------------------------------------------
      | Determine Success
      |--------------------------------------------------------------------------
      */

      const requestSucceeded = isSuccessfulResponse(
        result,
        createdRegion
      );

      if (!requestSucceeded) {
        const message =
          result?.message ||
          "Unable to create region.";

        const errors = result?.errors || {};

        setServerError(message);
        setFieldErrors(errors);

        if (import.meta.env.DEV) {
          console.error(
            "[CreateRegion] Creation failed:",
            result
          );
        }

        await Swal.fire({
          icon: "error",
          title: "Unable to Create Region",
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
        `${createdRegion?.name || "Region"} created successfully.`;

      if (import.meta.env.DEV) {
        console.log(
          "[CreateRegion] Created region:",
          createdRegion
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Region Created Successfully",
        text: message,
        confirmButtonText: "View Regions",
        confirmButtonColor: "#4f46e5",
      });

      navigate(REGION_INDEX_PATH, {
        replace: true,
      });
    } catch (err) {
      const message = extractErrorMessage(err);
      const errors = extractValidationErrors(err);

      setServerError(message);
      setFieldErrors(errors);

      if (import.meta.env.DEV) {
        console.error(
          "[CreateRegion] Create failed:",
          err
        );
      }

      await Swal.fire({
        icon: "error",
        title: "Unable to Create Region",
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

    navigate(REGION_INDEX_PATH);
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
      {/* Region Header */}

      <RegionHeader loading={isCreating} />

      {/* Error Message */}

      {(serverError || error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-red-800">
                Unable to create region
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

      {/* Region Form */}

      <RegionForm
        mode="create"
        initialData={INITIAL_VALUES}
        countries={countries}
        submitting={isCreating || countriesLoading}
        validationErrors={{
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

export default CreateRegion;
