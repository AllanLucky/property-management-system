
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Swal from "sweetalert2";

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

const INITIAL_FORM_VALUES = {
  country_id: "",
  region_id: "",
  county_id: "",
  name: "",
  code: "",
  is_active: true,
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const toBoolean = (value) => (
  value === true ||
  value === 1 ||
  value === "1" ||
  value === "true" ||
  value === "active"
);

const getErrorMessage = (error) => {
  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.payload?.message ||
    error?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

const getCityRecord = (response, depth = 0) => {
  if (
    !response ||
    typeof response !== "object" ||
    Array.isArray(response) ||
    depth > 5
  ) {
    return null;
  }

  if (response.id != null && response.name) {
    return response;
  }

  const candidates = [
    response.data,
    response.city,
    response.payload,
    response.result,
  ];

  for (const candidate of candidates) {
    const record = getCityRecord(candidate, depth + 1);

    if (record) {
      return record;
    }
  }

  return null;
};

const getCityFormValues = (city) => ({
  country_id:
    city?.country_id != null
      ? String(city.country_id)
      : "",

  region_id:
    city?.region_id != null
      ? String(city.region_id)
      : "",

  county_id:
    city?.county_id != null
      ? String(city.county_id)
      : "",

  name: city?.name || "",
  code: city?.code || "",
  is_active: toBoolean(city?.is_active),
});

const extractCollection = (response, depth = 0) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    !response ||
    typeof response !== "object" ||
    depth > 5
  ) {
    return [];
  }

  const candidates = [
    response.data,
    response.items,
    response.results,
    response.payload,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    const result = extractCollection(candidate, depth + 1);

    if (result.length) {
      return result;
    }
  }

  return [];
};

const toForeignKey = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number > 0
    ? number
    : null;
};

/*
|--------------------------------------------------------------------------
| Loading Skeleton
|--------------------------------------------------------------------------
*/

const EditCitySkeleton = () => (
  <div className="min-w-0 space-y-6">

    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Edit City
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Loading city information...
        </p>
      </div>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="animate-pulse space-y-6">

        <div className="h-5 w-40 rounded bg-slate-200" />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-11 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="h-20 rounded-xl bg-slate-100" />

      </div>
    </div>

  </div>
);

/*
|--------------------------------------------------------------------------
| Error State
|--------------------------------------------------------------------------
*/

const CityLoadError = ({
  message,
  onRetry,
  onBack,
}) => (
  <div className="min-w-0 space-y-6">

    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Edit City
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Update city information.
        </p>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cities
      </button>

    </div>

    <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertCircle className="h-7 w-7" />
      </div>

      <h2 className="mt-4 text-lg font-bold text-slate-900">
        Unable to Load City
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {message}
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">

        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cities
        </button>

      </div>

    </div>

  </div>
);

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const EditCity = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | Request Protection
  |--------------------------------------------------------------------------
  */

  const requestSequence = useRef(0);

  /*
  |--------------------------------------------------------------------------
  | Cities Hook
  |--------------------------------------------------------------------------
  */

  const {
    fetchCity,
    updateCity,
    submitting,
    error,
    validationErrors,
    clearErrors,
  } = useCities({
    autoFetch: false,
  });

  /*
  |--------------------------------------------------------------------------
  | Countries Hook
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
  | Regions Hook
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
  | Counties Hook
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
  | Normalize Location Collections
  |--------------------------------------------------------------------------
  */

  const countries = useMemo(
    () => extractCollection(countryRecords),
    [countryRecords]
  );

  const regions = useMemo(
    () => extractCollection(regionRecords),
    [regionRecords]
  );

  const counties = useMemo(
    () => extractCollection(countyRecords),
    [countyRecords]
  );

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [city, setCity] = useState(null);

  const [formValues, setFormValues] = useState(
    INITIAL_FORM_VALUES
  );

  const [localLoading, setLocalLoading] = useState(true);
  const [cityLoaded, setCityLoaded] = useState(false);
  const [localError, setLocalError] = useState("");

  const isSubmitting = Boolean(submitting);

  const locationsLoading =
    Boolean(countriesLoading) ||
    Boolean(regionsLoading) ||
    Boolean(countiesLoading);

  /*
  |--------------------------------------------------------------------------
  | Fetch City Details
  |--------------------------------------------------------------------------
  */

  const loadCity = useCallback(async () => {
    const currentRequest = ++requestSequence.current;

    if (!id) {
      setLocalError("City ID was not provided.");
      setLocalLoading(false);
      setCityLoaded(false);
      return;
    }

    setLocalLoading(true);
    setLocalError("");
    setCityLoaded(false);
    setCity(null);
    setFormValues(INITIAL_FORM_VALUES);

    try {
      clearErrors?.();

      if (typeof fetchCity !== "function") {
        throw new Error(
          "fetchCity is not available in useCities."
        );
      }

      const response = await fetchCity(id);

      // Ignore stale requests.
      if (currentRequest !== requestSequence.current) {
        return;
      }

      if (
        response === false ||
        response?.success === false ||
        response?.error ||
        response?.status === false
      ) {
        throw new Error(getErrorMessage(response));
      }

      const fetchedCity =
        getCityRecord(response?.data) ||
        getCityRecord(response?.response) ||
        getCityRecord(response);

      if (
        !fetchedCity ||
        String(fetchedCity.id) !== String(id)
      ) {
        throw new Error(
          "The requested city could not be found. Please check the city ID and API response."
        );
      }

      setCity(fetchedCity);

      setFormValues(
        getCityFormValues(fetchedCity)
      );

      setCityLoaded(true);
      setLocalError("");

    } catch (requestError) {
      if (currentRequest !== requestSequence.current) {
        return;
      }

      setCity(null);
      setCityLoaded(false);

      setLocalError(
        getErrorMessage(requestError)
      );

    } finally {
      if (currentRequest === requestSequence.current) {
        setLocalLoading(false);
      }
    }
  }, [
    id,
    fetchCity,
    clearErrors,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Load City On Page Entry
  |--------------------------------------------------------------------------
  |
  | Important:
  | - Do not depend on selectedCity.
  | - Do not clear Redux state in effect cleanup.
  | - Do not trigger another fetch when Redux updates.
  |
  */

  useEffect(() => {
    loadCity();

    return () => {
      requestSequence.current += 1;
    };
  }, [loadCity]);

  /*
  |--------------------------------------------------------------------------
  | Handle Input Changes
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

      if (name === "code") {
        value = String(value || "")
          .trim()
          .toUpperCase();
      }

      setFormValues((previous) => {
        const updated = {
          ...previous,
          [name]: value,
        };

        if (name === "country_id") {
          updated.region_id = "";
          updated.county_id = "";
        }

        if (name === "region_id") {
          updated.county_id = "";
        }

        return updated;
      });

      setLocalError("");
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Submit Updated City
  |--------------------------------------------------------------------------
  */

  const handleSubmit = useCallback(
    async (payload = {}) => {
      if (!id || isSubmitting || !cityLoaded) {
        return;
      }

      try {
        setLocalError("");
        clearErrors?.();

        if (typeof updateCity !== "function") {
          throw new Error(
            "updateCity is not available in useCities."
          );
        }

        const values = {
          ...formValues,
          ...payload,
        };

        const submittedPayload = {
          country_id: toForeignKey(values.country_id),
          region_id: toForeignKey(values.region_id),
          county_id: toForeignKey(values.county_id),

          name: String(values.name || "").trim(),

          code:
            String(values.code || "")
              .trim()
              .toUpperCase() || null,

          is_active: toBoolean(values.is_active),
        };

        if (!submittedPayload.country_id) {
          throw new Error("Please select a country.");
        }

        if (!submittedPayload.region_id) {
          throw new Error("Please select a region.");
        }

        if (!submittedPayload.county_id) {
          throw new Error("Please select a county.");
        }

        if (!submittedPayload.name) {
          throw new Error("Please enter the city name.");
        }

        const response = await updateCity(
          id,
          submittedPayload
        );

        if (
          response === false ||
          response?.success === false ||
          response?.error ||
          response?.status === false ||
          response?.payload?.status === false
        ) {
          throw new Error(getErrorMessage(response));
        }

        const successMessage =
          response?.data?.message ||
          response?.payload?.message ||
          response?.message ||
          "City updated successfully.";

        await Swal.fire({
          icon: "success",
          title: "City Updated",
          text: successMessage,
          confirmButtonColor: "#0f172a",
        });

        navigate(CITY_INDEX_PATH, {
          replace: true,
        });

      } catch (submitError) {
        const message = getErrorMessage(submitError);

        setLocalError(message);

        await Swal.fire({
          icon: "error",
          title: "Unable to Update City",
          text: message,
          confirmButtonColor: "#0f172a",
        });
      }
    },
    [
      id,
      isSubmitting,
      cityLoaded,
      updateCity,
      clearErrors,
      navigate,
      formValues,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Cancel
  |--------------------------------------------------------------------------
  */

  const handleCancel = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    navigate(CITY_INDEX_PATH);
  }, [
    isSubmitting,
    navigate,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Retry Loading
  |--------------------------------------------------------------------------
  */

  const handleRetry = useCallback(() => {
    loadCity();
  }, [loadCity]);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (localLoading && !cityLoaded) {
    return <EditCitySkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Error State
  |--------------------------------------------------------------------------
  */

  if (!cityLoaded || !city) {
    const errorMessage =
      localError ||
      (typeof error === "string" ? error : "") ||
      getErrorMessage(error);

    return (
      <CityLoadError
        message={errorMessage}
        onRetry={handleRetry}
        onBack={handleCancel}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render Edit Form
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 space-y-6">

      {/* PAGE HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="flex flex-wrap items-center gap-2">

            <h1 className="text-xl font-bold text-slate-900">
              Edit City
            </h1>

            {toBoolean(city.is_active) ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Active
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                Inactive
              </span>
            )}

          </div>

          <p className="mt-1 text-sm text-slate-500">
            Update the information for{" "}
            <span className="font-semibold text-slate-700">
              {city.name}
            </span>
            .
          </p>

        </div>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cities
        </button>

      </div>

      {/* GENERAL ERROR */}

      {localError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="text-sm font-semibold text-red-800">
              Something went wrong
            </p>

            <p className="mt-1 text-sm text-red-700">
              {localError}
            </p>
          </div>

        </div>
      )}

      {/* LOCATION LOADING NOTICE */}

      {locationsLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading location options...
        </div>
      )}

      {/* CITY FORM */}

      <CityForm
        key={String(city.id)}
        mode="edit"
        initialData={city}
        values={formValues}
        countries={countries}
        regions={regions}
        counties={counties}
        errors={validationErrors || {}}
        loading={false}
        submitting={isSubmitting}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />

    </div>
  );
};

export default EditCity;
