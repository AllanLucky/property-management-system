
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

import CountryHeader from "./CountryHeader";
import CountryForm from "./CountryForm";
import useCountries from "../../../../hooks/useCountries";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Generate a URL-friendly slug from a country name.
 *
 * Examples:
 * South Africa       => south-africa
 * United States      => united-states
 * Côte d'Ivoire      => cote-d-ivoire
 * Guinea-Bissau      => guinea-bissau
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

const extractErrorMessage = (error) => {
  if (!error) {
    return "Unable to create country.";
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    error?.error ||
    "Unable to create country."
  );
};

const extractValidationErrors = (error) => {
  const errors =
    error?.response?.data?.errors ||
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

const extractCountryData = (response) => {
  if (!response) {
    return null;
  }

  return (
    response?.data?.country ||
    response?.data?.data?.country ||
    response?.data?.data ||
    response?.data ||
    response?.country ||
    null
  );
};

/*
|--------------------------------------------------------------------------
| Initial Form
|--------------------------------------------------------------------------
*/

const INITIAL_VALUES = {
  name: "",
  slug: "",
  code: "",
  phone_code: "",
  currency: "",
  is_active: true,
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const CreateCountry = () => {
  const navigate = useNavigate();

  const {
    createCountry,
    submitting,
    error,
    validationErrors,
    clearErrors,
  } = useCountries();

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [form, setForm] = useState(INITIAL_VALUES);

  const [submittingForm, setSubmittingForm] = useState(false);

  const [serverError, setServerError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  /*
  |--------------------------------------------------------------------------
  | Stable Function Refs
  |--------------------------------------------------------------------------
  */

  const createCountryRef = useRef(createCountry);
  const clearErrorsRef = useRef(clearErrors);

  useEffect(() => {
    createCountryRef.current = createCountry;
  }, [createCountry]);

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

  const handleChange = useCallback(
    (eventOrField, maybeValue) => {
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

      /*
      |--------------------------------------------------------------------------
      | Normalize Values
      |--------------------------------------------------------------------------
      */

      if (name === "code" || name === "currency") {
        value = String(value || "")
          .trim()
          .toUpperCase();
      }

      if (name === "phone_code") {
        value = String(value || "").trim();
      }

      /*
      |--------------------------------------------------------------------------
      | Update Form and Automatically Generate Slug
      |--------------------------------------------------------------------------
      */

      setForm((current) => {
        const next = {
          ...current,
          [name]: value,
        };

        if (name === "name") {
          next.slug = generateSlug(value);
        }

        return next;
      });

      /*
      |--------------------------------------------------------------------------
      | Clear Field Errors
      |--------------------------------------------------------------------------
      */

      setFieldErrors((current) => {
        const next = { ...current };

        delete next[name];

        if (name === "name") {
          delete next.slug;
        }

        return next;
      });

      setServerError("");
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Client Validation
  |--------------------------------------------------------------------------
  */

  const validate = useCallback((values) => {
    const errors = {};

    const name = String(values.name || "").trim();
    const slug = String(values.slug || "").trim();
    const code = String(values.code || "").trim();
    const phoneCode = String(values.phone_code || "").trim();
    const currency = String(values.currency || "").trim();

    if (!name) {
      errors.name = "Country name is required.";
    } else if (name.length < 2 || name.length > 100) {
      errors.name =
        "Country name must contain between 2 and 100 characters.";
    }

    if (!slug) {
      errors.slug = "Country slug could not be generated.";
    } else if (slug.length > 120) {
      errors.slug = "Slug cannot exceed 120 characters.";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      errors.slug =
        "Slug may only contain letters, numbers, hyphens and underscores.";
    }

    if (!code) {
      errors.code = "Country code is required.";
    } else if (!/^[A-Z]{2}$/.test(code)) {
      errors.code =
        "Country code must contain exactly two letters.";
    }

    if (!phoneCode) {
      errors.phone_code = "Phone code is required.";
    } else if (!/^\+[1-9][0-9]{0,8}$/.test(phoneCode)) {
      errors.phone_code =
        "Enter a valid phone code, for example +254.";
    }

    if (!currency) {
      errors.currency = "Currency is required.";
    } else if (!/^[A-Z]{3}$/.test(currency)) {
      errors.currency =
        "Currency must contain exactly three letters.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Build API Payload
  |--------------------------------------------------------------------------
  */

  const buildPayload = (values) => {
    const name = String(values.name || "").trim();

    return {
      name,

      // Always generate the slug from the country name.
      slug: generateSlug(name),

      code: String(values.code || "")
        .trim()
        .toUpperCase(),

      phone_code: String(values.phone_code || "").trim(),

      currency: String(values.currency || "")
        .trim()
        .toUpperCase(),

      is_active: Boolean(values.is_active),
    };
  };

  /*
  |--------------------------------------------------------------------------
  | Submit Country
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (eventOrValues) => {
    eventOrValues?.preventDefault?.();

    if (submissionStartedRef.current) {
      return;
    }

    const submittedValues =
      eventOrValues &&
        !eventOrValues?.target &&
        typeof eventOrValues === "object"
        ? {
          ...form,
          ...eventOrValues,
        }
        : {
          ...form,
        };

    const normalizedValues = {
      ...submittedValues,
      name: String(submittedValues.name || "").trim(),
      slug: generateSlug(submittedValues.name),
      code: String(submittedValues.code || "")
        .trim()
        .toUpperCase(),
      phone_code: String(submittedValues.phone_code || "").trim(),
      currency: String(submittedValues.currency || "")
        .trim()
        .toUpperCase(),
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

      if (import.meta.env.DEV) {
        console.group("[CreateCountry] Create country");
        console.log("Form values:", normalizedValues);
        console.log("Generated slug:", payload.slug);
        console.log("API payload:", payload);
        console.groupEnd();
      }

      const result = await createCountryRef.current(payload);

      /*
      |--------------------------------------------------------------------------
      | Handle Hook Result
      |--------------------------------------------------------------------------
      */

      if (!result?.success) {
        const message =
          result?.message ||
          "Unable to create country.";

        const errors = result?.errors || {};

        setServerError(message);
        setFieldErrors(errors);

        if (import.meta.env.DEV) {
          console.error(
            "[CreateCountry] Creation failed:",
            result
          );
        }

        await Swal.fire({
          icon: "error",
          title: "Unable to Create Country",
          text: message,
          confirmButtonText: "Close",
          confirmButtonColor: "#dc2626",
        });

        return;
      }

      const message =
        result?.message ||
        "Country created successfully.";

      if (import.meta.env.DEV) {
        console.log(
          "[CreateCountry] Created country:",
          extractCountryData(result)
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Country Created",
        text: message,
        confirmButtonText: "View Countries",
        confirmButtonColor: "#4f46e5",
      });

      navigate("/super-admin/countries", {
        replace: true,
      });
    } catch (err) {
      const message = extractErrorMessage(err);
      const errors = extractValidationErrors(err);

      setServerError(message);
      setFieldErrors(errors);

      if (import.meta.env.DEV) {
        console.error("[CreateCountry] Create failed:", err);
      }

      await Swal.fire({
        icon: "error",
        title: "Unable to Create Country",
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

    navigate("/super-admin/countries");
  }, [
    isCreating,
    navigate,
  ]);

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

      <CountryHeader loading={isCreating} />

      {(serverError || error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
          <div className="flex gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-red-800">
                Unable to create country
              </h2>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {serverError ||
                  extractErrorMessage(error)}
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

      <CountryForm
        mode="create"
        initialData={INITIAL_VALUES}
        initialValues={INITIAL_VALUES}
        values={form}
        errors={{
          ...(validationErrors || {}),
          ...(fieldErrors || {}),
        }}
        loading={Boolean(submitting)}
        submitting={isCreating}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default CreateCountry;
