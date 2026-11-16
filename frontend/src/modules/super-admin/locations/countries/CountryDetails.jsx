
import {
  useCallback,
  useEffect,
  useMemo,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit,
  Globe,
  Hash,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import useCountries from "../../../../hooks/useCountries";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const COUNTRY_INDEX_PATH = "/super-admin/countries";

const COUNTRY_EDIT_PATH = (id) =>
  `/super-admin/countries/${id}/edit`;

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

const formatDate = (date) => {
  if (!date) {
    return "Not available";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
};

const getErrorMessage = (error) => {
  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    "Unable to load country information. Please try again."
  );
};

/*
|--------------------------------------------------------------------------
| Detail Item Component
|--------------------------------------------------------------------------
*/

const DetailItem = ({
  icon: Icon,
  label,
  value,
  description,
}) => {
  return (
    <div className="flex min-w-0 gap-3 rounded-xl border border-slate-100 bg-white p-4 transition hover:border-slate-200 hover:shadow-sm">
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

        {description && (
          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Loading Skeleton
|--------------------------------------------------------------------------
*/

const CountryDetailsSkeleton = () => {
  return (
    <div className="min-w-0 space-y-6 animate-pulse">

      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded bg-slate-200" />
          <div className="h-4 w-64 rounded bg-slate-100" />
        </div>

        <div className="h-10 w-32 rounded-xl bg-slate-200" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-slate-200" />

          <div className="flex-1 space-y-3">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="h-4 w-32 rounded bg-slate-100" />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-24 rounded-xl bg-slate-100"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Country Details Component
|--------------------------------------------------------------------------
*/

const CountryDetails = () => {
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
    loading,
    error,
    clearErrors,
  } = useCountries({
    autoFetch: false,
  });

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

  /*
  |--------------------------------------------------------------------------
  | Fetch Country Details
  |--------------------------------------------------------------------------
  */

  const loadCountry = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      clearErrors?.();
      await fetchCountry(id);
    } catch (requestError) {
      console.error(
        "[CountryDetails] Failed to load country:",
        requestError
      );
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
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleBack = useCallback(() => {
    navigate(COUNTRY_INDEX_PATH);
  }, [navigate]);

  const handleEdit = useCallback(() => {
    if (!id) {
      return;
    }

    navigate(COUNTRY_EDIT_PATH(id));
  }, [
    id,
    navigate,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Retry
  |--------------------------------------------------------------------------
  */

  const handleRetry = useCallback(() => {
    loadCountry();
  }, [loadCountry]);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading && !isCorrectCountry) {
    return <CountryDetailsSkeleton />;
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
              Country Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View country information.
            </p>
          </div>

          <button
            type="button"
            onClick={handleBack}
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
            {getErrorMessage(error) ||
              "The requested country could not be found."}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleRetry}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>

            <button
              type="button"
              onClick={handleBack}
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
  | Country Information
  |--------------------------------------------------------------------------
  */

  const isActive = Boolean(country.is_active);

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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Country Details
            </h1>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
                }`}
            >
              {isActive ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}

              {isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            View complete information about this country.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            type="button"
            onClick={handleEdit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Edit className="h-4 w-4" />
            Edit Country
          </button>
        </div>
      </div>

      {/* COUNTRY PROFILE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
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

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
                  }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${isActive
                    ? "bg-emerald-500"
                    : "bg-slate-400"
                    }`}
                />

                {isActive
                  ? "Currently Active"
                  : "Currently Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* COUNTRY DETAILS */}

        <div className="p-6">
          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">
              General Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Basic country identification and regional information.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailItem
              icon={Globe}
              label="Country Name"
              value={country.name}
              description="Official country name"
            />

            <DetailItem
              icon={Hash}
              label="ISO Country Code"
              value={country.code}
              description="Two-letter country code"
            />

            <DetailItem
              icon={MapPin}
              label="URL Slug"
              value={country.slug}
              description="Generated country identifier"
            />

            <DetailItem
              icon={Phone}
              label="International Phone Code"
              value={country.phone_code}
              description="Country dialing prefix"
            />

            <DetailItem
              icon={Wallet}
              label="Currency"
              value={country.currency}
              description="Three-letter currency code"
            />

            <DetailItem
              icon={ShieldCheck}
              label="Account Status"
              value={isActive ? "Active" : "Inactive"}
              description="Country availability status"
            />
          </div>
        </div>

        {/* RECORD INFORMATION */}

        <div className="border-t border-slate-100 bg-slate-50/70 p-6">
          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">
              Record Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Country record creation and modification details.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <DetailItem
              icon={CalendarDays}
              label="Date Created"
              value={formatDate(country.created_at)}
              description="Country registration date"
            />

            <DetailItem
              icon={Clock}
              label="Last Updated"
              value={formatDate(country.updated_at)}
              description="Most recent modification"
            />
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}

      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Manage {country.name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            You can update this country's information at any time.
          </p>
        </div>

        <button
          type="button"
          onClick={handleEdit}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Edit className="h-4 w-4" />
          Edit Country
        </button>
      </div>
    </div>
  );
};

export default CountryDetails;
