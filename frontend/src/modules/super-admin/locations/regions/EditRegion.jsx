
import {
  useCallback,
  useEffect,
  useMemo,
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

import RegionForm from "./RegionForm";

import useRegions from "../../../../hooks/useRegions";
import useCountries from "../../../../hooks/useCountries";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const REGION_INDEX_PATH = "/super-admin/regions";

const INITIAL_FORM_VALUES = {
  country_id: "",
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

const getRegionRecord = (response) => {
  if (!response || typeof response !== "object") {
    return null;
  }

  if (
    response.id &&
    response.name &&
    response.code
  ) {
    return response;
  }

  const candidates = [
    response.region,
    response.data?.region,
    response.data?.data?.region,
    response.data?.data,
    response.data,
    response.payload?.region,
    response.payload?.data,
    response.payload,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      candidate.id &&
      candidate.name &&
      candidate.code
    ) {
      return candidate;
    }
  }

  return null;
};

const getRegionFormValues = (region) => ({
  country_id: region?.country_id
    ? String(region.country_id)
    : "",

  name: region?.name || "",
  slug: region?.slug || "",
  code: region?.code || "",
  is_active: Boolean(region?.is_active),
});

const getErrorMessage = (error) => {
  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.payload?.message ||
    error?.message ||
    "Unable to update region. Please try again."
  );
};

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

  return [];
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const EditRegion = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | Regions Hook
  |--------------------------------------------------------------------------
  */

  const {
    selectedRegion,
    fetchRegion,
    updateRegion,
    detailsLoading,
    submitting,
    error,
    validationErrors,
    clearErrors,
  } = useRegions({
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

  const countries = useMemo(
    () => extractCountries(countryRecords),
    [countryRecords]
  );

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [formValues, setFormValues] = useState(
    INITIAL_FORM_VALUES
  );

  const [regionLoaded, setRegionLoaded] = useState(false);
  const [localError, setLocalError] = useState("");

  const loading =
    Boolean(detailsLoading) ||
    Boolean(submitting);

  /*
  |--------------------------------------------------------------------------
  | Resolve Selected Region
  |--------------------------------------------------------------------------
  */

  const region = useMemo(
    () => getRegionRecord(selectedRegion),
    [selectedRegion]
  );

  const isCorrectRegion = useMemo(
    () =>
      Boolean(
        region &&
        String(region.id) === String(id)
      ),
    [region, id]
  );

  /*
  |--------------------------------------------------------------------------
  | Fetch Region Details
  |--------------------------------------------------------------------------
  */

  const loadRegion = useCallback(async () => {
    if (!id) {
      setLocalError("Region ID was not provided.");
      setRegionLoaded(false);
      return;
    }

    try {
      setLocalError("");
      setRegionLoaded(false);

      clearErrors?.();

      if (typeof fetchRegion !== "function") {
        throw new Error(
          "fetchRegion is not available in useRegions."
        );
      }

      const response = await fetchRegion(id);

      const fetchedRegion = getRegionRecord(response);

      if (
        fetchedRegion &&
        String(fetchedRegion.id) === String(id)
      ) {
        setFormValues(
          getRegionFormValues(fetchedRegion)
        );

        setRegionLoaded(true);
      }
    } catch (requestError) {
      setLocalError(
        getErrorMessage(requestError)
      );
    }
  }, [
    id,
    fetchRegion,
    clearErrors,
  ]);

  useEffect(() => {
    loadRegion();
  }, [loadRegion]);

  /*
  |--------------------------------------------------------------------------
  | Populate Form From Selected Region
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isCorrectRegion) {
      return;
    }

    setFormValues(
      getRegionFormValues(region)
    );

    setRegionLoaded(true);
  }, [
    region,
    isCorrectRegion,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Handle Input Changes
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
      value = String(value || "")
        .trim()
        .toUpperCase();
    }

    setFormValues((previous) => ({
      ...previous,
      [name]: value,
    }));

    setLocalError("");
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Submit Updated Region
  |--------------------------------------------------------------------------
  */

  const handleSubmit = useCallback(
    async (payload) => {
      if (!id || submitting) {
        return;
      }

      try {
        setLocalError("");

        clearErrors?.();

        if (typeof updateRegion !== "function") {
          throw new Error(
            "updateRegion is not available in useRegions."
          );
        }

        const submittedPayload = {
          country_id: Number(
            payload?.country_id ?? formValues.country_id
          ),

          name: String(
            payload?.name ?? formValues.name
          ).trim(),

          slug: String(
            payload?.slug ?? formValues.slug
          ).trim(),

          code: String(
            payload?.code ?? formValues.code
          ).trim().toUpperCase(),

          is_active:
            payload?.is_active ??
            formValues.is_active,
        };

        const response = await updateRegion(
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
          throw (
            response?.error ||
            response?.payload ||
            response
          );
        }

        const successMessage =
          response?.data?.message ||
          response?.payload?.message ||
          response?.message ||
          "Region updated successfully.";

        await Swal.fire({
          icon: "success",
          title: "Region Updated",
          text: successMessage,
          confirmButtonColor: "#0f172a",
        });

        navigate(REGION_INDEX_PATH, {
          replace: true,
        });
      } catch (submitError) {
        const message =
          getErrorMessage(submitError);

        setLocalError(message);

        await Swal.fire({
          icon: "error",
          title: "Unable to Update Region",
          text: message,
          confirmButtonColor: "#0f172a",
        });
      }
    },
    [
      id,
      submitting,
      updateRegion,
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
    if (loading) {
      return;
    }

    navigate(REGION_INDEX_PATH);
  }, [
    loading,
    navigate,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Retry Loading
  |--------------------------------------------------------------------------
  */

  const handleRetry = useCallback(() => {
    setLocalError("");
    loadRegion();
  }, [loadRegion]);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (detailsLoading && !isCorrectRegion) {
    return (
      <div className="min-w-0 space-y-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Edit Region
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Loading region information...
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="animate-pulse space-y-6">

            <div className="h-5 w-40 rounded bg-slate-200" />

            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-11 w-full rounded-xl bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-11 rounded-xl bg-slate-100" />
              </div>

              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-11 rounded-xl bg-slate-100" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-11 rounded-xl bg-slate-100" />
            </div>

            <div className="h-20 rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Region Not Found / Loading Error
  |--------------------------------------------------------------------------
  */

  if (
    !isCorrectRegion &&
    !detailsLoading &&
    !regionLoaded
  ) {
    const errorMessage =
      localError ||
      (typeof error === "string"
        ? error
        : getErrorMessage(error)) ||
      "The requested region could not be found.";

    return (
      <div className="min-w-0 space-y-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Edit Region
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update region information.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Regions
          </button>
        </div>

        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Unable to Load Region
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {errorMessage}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">

            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Regions
            </button>
          </div>
        </div>
      </div>
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Edit Region
            </h1>

            {region?.is_active ? (
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
              {region?.name}
            </span>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Regions
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

      {/* REGION FORM */}

      <RegionForm
        key={region?.id}
        mode="edit"
        initialData={{
          ...region,
          ...formValues,
        }}
        values={formValues}
        countries={countries}
        errors={validationErrors || {}}
        validationErrors={validationErrors || {}}
        loading={detailsLoading || countriesLoading}
        submitting={submitting}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EditRegion;
