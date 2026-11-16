
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Hash,
  Loader2,
  Phone,
  RefreshCw,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Swal from "sweetalert2";

import useCountries from "../../../../hooks/useCountries";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const COUNTRY_INDEX_PATH = "/super-admin/countries";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getCountryRecord = (response) => {
  if (!response || typeof response !== "object") {
    return null;
  }

  if (response.id && response.name) {
    return response;
  }

  const candidates = [
    response.country,
    response.data?.country,
    response.data?.data?.country,
    response.data?.data,
    response.data,
    response.payload?.country,
    response.payload?.data,
    response.payload,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      candidate.id &&
      candidate.name
    ) {
      return candidate;
    }
  }

  return null;
};

const getErrorMessage = (error) => {
  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.payload?.message ||
    error?.message ||
    "Unable to complete this action. Please try again."
  );
};

/*
|--------------------------------------------------------------------------
| Detail Item
|--------------------------------------------------------------------------
*/

const DetailItem = ({
  icon: Icon,
  label,
  value,
}) => {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value || "Not available"}
        </p>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Loading Skeleton
|--------------------------------------------------------------------------
*/

const DeleteCountrySkeleton = () => {
  return (
    <div className="min-w-0 animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-40 rounded bg-slate-200" />
        <div className="h-4 w-64 rounded bg-slate-100" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="h-16 w-full rounded-xl bg-slate-100" />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-20 rounded-xl bg-slate-100"
            />
          ))}
        </div>

        <div className="mt-6 h-20 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Delete Country Component
|--------------------------------------------------------------------------
*/

const DeleteCountry = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | Countries Hook
  |--------------------------------------------------------------------------
  */

  const {
    selectedCountry,
    fetchCountry,
    deleteCountry,
    loading,
    deleting,
    error,
    clearErrors,
  } = useCountries({
    autoFetch: false,
  });

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [pageLoading, setPageLoading] = useState(true);
  const [localError, setLocalError] = useState("");
  const [deletionStarted, setDeletionStarted] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Resolve Country
  |--------------------------------------------------------------------------
  */

  const country = useMemo(
    () => getCountryRecord(selectedCountry),
    [selectedCountry]
  );

  const isCorrectCountry = useMemo(
    () =>
      Boolean(
        country &&
        String(country.id) === String(id)
      ),
    [country, id]
  );

  const isDeleting = Boolean(deleting) || deletionStarted;

  /*
  |--------------------------------------------------------------------------
  | Fetch Country
  |--------------------------------------------------------------------------
  */

  const loadCountry = useCallback(async () => {
    if (!id) {
      setLocalError("Country ID was not provided.");
      setPageLoading(false);
      return;
    }

    try {
      setPageLoading(true);
      setLocalError("");

      clearErrors?.();

      if (typeof fetchCountry !== "function") {
        throw new Error(
          "fetchCountry is not available in useCountries."
        );
      }

      await fetchCountry(id);
    } catch (requestError) {
      setLocalError(getErrorMessage(requestError));
    } finally {
      setPageLoading(false);
    }
  }, [
    id,
    fetchCountry,
    clearErrors,
  ]);

  useEffect(() => {
    loadCountry();
  }, [loadCountry]);

  /*
  |--------------------------------------------------------------------------
  | Cancel
  |--------------------------------------------------------------------------
  */

  const handleCancel = useCallback(() => {
    if (isDeleting) {
      return;
    }

    navigate(COUNTRY_INDEX_PATH);
  }, [
    isDeleting,
    navigate,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Delete Country
  |--------------------------------------------------------------------------
  */

  const handleDelete = useCallback(async () => {
    if (!id || !isCorrectCountry || isDeleting) {
      return;
    }

    if (typeof deleteCountry !== "function") {
      setLocalError(
        "deleteCountry is not available in useCountries."
      );
      return;
    }

    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Delete Country?",
      html: `
                <p class="text-sm text-slate-600">
                    Are you sure you want to delete
                    <strong>${String(country.name).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char])}</strong>?
                </p>
                <p class="mt-2 text-sm text-red-600">
                    This action may affect records associated with this country.
                </p>
            `,
      showCancelButton: true,
      confirmButtonText: "Yes, Delete Country",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      setDeletionStarted(true);
      setLocalError("");

      clearErrors?.();

      /*
       * Hook signature:
       * deleteCountry(id)
       */
      const result = await deleteCountry(id);

      if (
        result === false ||
        result?.success === false ||
        result?.error ||
        result?.status === false ||
        result?.payload?.status === false
      ) {
        throw (
          result?.error ||
          result?.payload ||
          result
        );
      }

      const successMessage =
        result?.message ||
        result?.data?.message ||
        "Country deleted successfully.";

      await Swal.fire({
        icon: "success",
        title: "Country Deleted",
        text: successMessage,
        confirmButtonText: "View Countries",
        confirmButtonColor: "#0f172a",
      });

      navigate(COUNTRY_INDEX_PATH, {
        replace: true,
      });
    } catch (deleteError) {
      const message = getErrorMessage(deleteError);

      setLocalError(message);

      await Swal.fire({
        icon: "error",
        title: "Unable to Delete Country",
        text: message,
        confirmButtonText: "Close",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setDeletionStarted(false);
    }
  }, [
    id,
    country,
    isCorrectCountry,
    isDeleting,
    deleteCountry,
    clearErrors,
    navigate,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (pageLoading || (loading && !isCorrectCountry)) {
    return <DeleteCountrySkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Country Not Found
  |--------------------------------------------------------------------------
  */

  if (!isCorrectCountry) {
    return (
      <div className="min-w-0 space-y-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Delete Country
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review country information before deletion.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Countries
          </button>
        </div>

        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Unable to Load Country
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {localError ||
              getErrorMessage(error) ||
              "The requested country could not be found."}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadCountry}
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
              Back to Countries
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Main Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 space-y-6">

      {/* PAGE HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Delete Country
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review the country details before confirming deletion.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isDeleting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Countries
        </button>
      </div>

      {/* WARNING */}

      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-red-800">
              Warning: You are about to delete a country
            </h2>

            <p className="mt-1 text-sm leading-6 text-red-700">
              Please review the country information below.
              Deleting this country may affect related
              location records and other associated data.
              Make sure you understand the consequences
              before proceeding.
            </p>
          </div>
        </div>
      </div>

      {/* COUNTRY INFORMATION */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 bg-slate-50/70 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <Globe className="h-8 w-8" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">
                  {country.name}
                </h2>

                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-bold tracking-wider text-slate-700">
                  {country.code || "--"}
                </span>
              </div>

              <p className="mt-1 break-all text-sm text-slate-500">
                {country.slug || "No slug available"}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Country ID: #{country.id}
              </p>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${country.is_active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
                }`}
            >
              {country.is_active ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}

              {country.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="p-6">
          <h3 className="mb-5 text-base font-bold text-slate-900">
            Country Information
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailItem
              icon={Globe}
              label="Country Name"
              value={country.name}
            />

            <DetailItem
              icon={Hash}
              label="ISO Country Code"
              value={country.code}
            />

            <DetailItem
              icon={Globe}
              label="Slug"
              value={country.slug}
            />

            <DetailItem
              icon={Phone}
              label="Phone Code"
              value={country.phone_code}
            />

            <DetailItem
              icon={Wallet}
              label="Currency"
              value={country.currency}
            />

            <DetailItem
              icon={CheckCircle2}
              label="Status"
              value={country.is_active ? "Active" : "Inactive"}
            />
          </div>
        </div>

        {/* DELETE ACTIONS */}

        <div className="border-t border-slate-100 bg-slate-50/70 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Confirm Country Deletion
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                This action will send a deletion request to the server.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isDeleting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting Country...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Country
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteCountry;
