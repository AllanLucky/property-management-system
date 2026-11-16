
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

import {
  useNavigate,
  useParams,
} from "react-router-dom";

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
    return "Unable to update county.";
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    error?.error ||
    "Unable to update county."
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

  // Unwrap API envelope.
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
| Normalize County Values
|--------------------------------------------------------------------------
*/

const normalizeCounty = (county) => {
  if (!county) {
    return INITIAL_VALUES;
  }

  return {
    country_id: String(
      county.country_id ??
      county.country?.id ??
      ""
    ),

    region_id: String(
      county.region_id ??
      county.region?.id ??
      ""
    ),

    name: county.name || "",

    slug: county.slug || "",

    code: county.code || "",

    is_active:
      county.is_active === false ||
        county.is_active === 0 ||
        county.is_active === "0" ||
        county.is_active === "false"
        ? false
        : true,
  };
};

/*
|--------------------------------------------------------------------------
| Check Request Success
|--------------------------------------------------------------------------
*/

const isSuccessfulResponse = (response, updatedCounty) => {
  if (updatedCounty?.id) {
    return true;
  }

  if (response?.success === true) {
    return true;
  }

  if (response?.status === true) {
    return true;
  }

  if (
    response?.status === 200 ||
    response?.status === 201
  ) {
    return true;
  }

  return false;
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const EditCounty = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | County Hook
  |--------------------------------------------------------------------------
  */

  const {
    county,
    fetchCounty,
    updateCounty,
    submitting,
    detailsLoading,
    error,
    detailsError,
    validationErrors,
    clearErrors,
    clearCounty,
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

  const [formValues, setFormValues] = useState(INITIAL_VALUES);

  const [submittingForm, setSubmittingForm] = useState(false);

  const [loadingCounty, setLoadingCounty] = useState(true);

  const [serverError, setServerError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  const [countyLoaded, setCountyLoaded] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Stable Function Refs
  |--------------------------------------------------------------------------
  */

  const fetchCountyRef = useRef(fetchCounty);
  const updateCountyRef = useRef(updateCounty);
  const clearErrorsRef = useRef(clearErrors);
  const clearCountyRef = useRef(clearCounty);

  useEffect(() => {
    fetchCountyRef.current = fetchCounty;
  }, [fetchCounty]);

  useEffect(() => {
    updateCountyRef.current = updateCounty;
  }, [updateCounty]);

  useEffect(() => {
    clearErrorsRef.current = clearErrors;
  }, [clearErrors]);

  useEffect(() => {
    clearCountyRef.current = clearCounty;
  }, [clearCounty]);

  /*
  |--------------------------------------------------------------------------
  | Request Guards
  |--------------------------------------------------------------------------
  */

  const submissionStartedRef = useRef(false);
  const fetchStartedRef = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  const isUpdating =
    Boolean(submittingForm) ||
    Boolean(submitting);

  const lookupLoading =
    Boolean(countriesLoading) ||
    Boolean(regionsLoading);

  const isLoading =
    Boolean(loadingCounty) ||
    Boolean(detailsLoading);

  /*
  |--------------------------------------------------------------------------
  | Fetch County
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    const loadCounty = async () => {
      if (!id || fetchStartedRef.current) {
        return;
      }

      fetchStartedRef.current = true;

      setLoadingCounty(true);
      setServerError("");
      setFieldErrors({});

      try {
        const response = await fetchCountyRef.current(
          id
        );

        if (!mounted) {
          return;
        }

        const countyData = extractCountyData(response);

        if (!countyData) {
          throw new Error(
            response?.message ||
            "County details could not be loaded."
          );
        }

        setFormValues(normalizeCounty(countyData));
        setCountyLoaded(true);

      } catch (err) {
        if (!mounted) {
          return;
        }

        const message = extractErrorMessage(err);

        setServerError(message);
        setCountyLoaded(false);

        if (import.meta.env.DEV) {
          console.error(
            "[EditCounty] Fetch failed:",
            err
          );
        }

      } finally {
        if (mounted) {
          setLoadingCounty(false);
        }

        fetchStartedRef.current = false;
      }
    };

    loadCounty();

    return () => {
      mounted = false;
    };
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Synchronize County From Hook
  |--------------------------------------------------------------------------
  |
  | Supports hooks that store the fetched county in state
  | instead of returning it directly from fetchCounty().
  |
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!county?.id) {
      return;
    }

    if (String(county.id) !== String(id)) {
      return;
    }

    setFormValues(normalizeCounty(county));
    setCountyLoaded(true);
    setLoadingCounty(false);
  }, [county, id]);

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
      name === "region_id"
    ) {
      value = value === "" ? "" : String(value);
    }

    setFormValues((current) => ({
      ...current,
      [name]: value,

      ...(name === "country_id"
        ? { region_id: "" }
        : {}),
    }));

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
  | Submit County Update
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

    const values = {
      ...formValues,
      ...submittedValues,
    };

    /*
    |--------------------------------------------------------------------------
    | Normalize Values
    |--------------------------------------------------------------------------
    */

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
        console.group("[EditCounty] Update county");
        console.log("County ID:", id);
        console.log("Form values:", normalizedValues);
        console.log("API payload:", payload);
        console.groupEnd();
      }

      /*
      |--------------------------------------------------------------------------
      | API Request
      |--------------------------------------------------------------------------
      */

      const result = await updateCountyRef.current(
        id,
        payload
      );

      /*
      |--------------------------------------------------------------------------
      | Extract Updated County
      |--------------------------------------------------------------------------
      */

      const updatedCounty = extractCountyData(result);

      /*
      |--------------------------------------------------------------------------
      | Determine Success
      |--------------------------------------------------------------------------
      */

      const requestSucceeded = isSuccessfulResponse(
        result,
        updatedCounty
      );

      if (!requestSucceeded) {
        const message =
          result?.message ||
          "Unable to update county.";

        const errors =
          result?.errors || {};

        setServerError(message);
        setFieldErrors(errors);

        if (import.meta.env.DEV) {
          console.error(
            "[EditCounty] Update failed:",
            result
          );
        }

        await Swal.fire({
          icon: "error",
          title: "Unable to Update County",
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
        `${updatedCounty?.name || normalizedValues.name} updated successfully.`;

      if (import.meta.env.DEV) {
        console.log(
          "[EditCounty] Updated county:",
          updatedCounty
        );
      }

      await Swal.fire({
        icon: "success",
        title: "County Updated Successfully",
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
          "[EditCounty] Update failed:",
          err
        );
      }

      await Swal.fire({
        icon: "error",
        title: "Unable to Update County",
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
    if (isUpdating) {
      return;
    }

    navigate(COUNTY_INDEX_PATH);
  }, [isUpdating, navigate]);

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

      <CountyHeader loading={isUpdating} />

      {/* Error Message */}

      {(serverError || error || detailsError) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">

          <div className="flex gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">

              <h2 className="text-sm font-semibold text-red-800">
                Unable to load or update county
              </h2>

              <p className="mt-1 text-sm leading-6 text-red-700">
                {serverError ||
                  extractErrorMessage(detailsError || error)}
              </p>

              <button
                type="button"
                onClick={handleRetry}
                disabled={isUpdating}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Dismiss Error
              </button>

            </div>
          </div>
        </div>
      )}

      {/* County Loading */}

      {isLoading && (
        <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">

          <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />

          <div>
            <p className="text-sm font-semibold text-indigo-800">
              Loading county details...
            </p>

            <p className="mt-1 text-xs text-indigo-600">
              Please wait while the county information is retrieved.
            </p>
          </div>

        </div>
      )}

      {/* Lookup Loading */}

      {!isLoading && lookupLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">

          <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />

          <p className="text-sm font-medium text-indigo-700">
            Loading countries and regions...
          </p>

        </div>
      )}

      {/* County Form */}

      {!isLoading && countyLoaded && (
        <CountyForm
          mode="edit"
          initialData={formValues}
          values={formValues}
          countries={countries}
          regions={regions}
          submitting={isUpdating || lookupLoading}
          errors={{
            ...(validationErrors || {}),
            ...(fieldErrors || {}),
          }}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {/* County Not Found */}

      {!isLoading && !countyLoaded && !serverError && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <AlertCircle className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-base font-semibold text-slate-900">
            County not found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            The county may have been deleted or the requested record does not exist.
          </p>

          <button
            type="button"
            onClick={() => navigate(COUNTY_INDEX_PATH)}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Back to Counties
          </button>

        </div>
      )}

    </div>
  );
};

export default EditCounty;
