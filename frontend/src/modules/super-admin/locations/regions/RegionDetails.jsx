
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
  Layers3,
  MapPin,
  RefreshCw,
  ShieldCheck,
  XCircle,
  Building2,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import useRegions from "../../../../hooks/useRegions";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const REGION_INDEX_PATH = "/super-admin/regions";

const REGION_EDIT_PATH = (id) =>
  `/super-admin/regions/${id}/edit`;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getRegionRecord = (response) => {
  if (!response || typeof response !== "object") {
    return null;
  }

  if (response.id && response.name) {
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

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat("en-KE").format(number);
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
    "Unable to load region information. Please try again."
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
| Status Badge
|--------------------------------------------------------------------------
*/

const StatusBadge = ({
  active,
  label,
}) => {
  const isActive = Boolean(active);

  return (
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

      {label || (isActive ? "Active" : "Inactive")}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| Loading Skeleton
|--------------------------------------------------------------------------
*/

const RegionDetailsSkeleton = () => {
  return (
    <div className="min-w-0 animate-pulse space-y-6">

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
          {Array.from({ length: 9 }).map((_, index) => (
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
| Region Details Component
|--------------------------------------------------------------------------
*/

const RegionDetails = () => {
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
    loading,
    error,
    clearErrors,
  } = useRegions({
    autoFetch: false,
  });

  /*
  |--------------------------------------------------------------------------
  | Resolve Region
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
      return;
    }

    try {
      clearErrors?.();

      await fetchRegion(id);
    } catch (requestError) {
      console.error(
        "[RegionDetails] Failed to load region:",
        requestError
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
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleBack = useCallback(() => {
    navigate(REGION_INDEX_PATH);
  }, [navigate]);

  const handleEdit = useCallback(() => {
    if (!id) {
      return;
    }

    navigate(REGION_EDIT_PATH(id));
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
    loadRegion();
  }, [loadRegion]);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading && !isCorrectRegion) {
    return <RegionDetailsSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Region Not Found
  |--------------------------------------------------------------------------
  */

  if (!isCorrectRegion) {
    return (
      <div className="min-w-0 space-y-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Region Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View region information.
            </p>
          </div>

          <button
            type="button"
            onClick={handleBack}
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
            {getErrorMessage(error) ||
              "The requested region could not be found."}
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
              Back to Regions
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Region Information
  |--------------------------------------------------------------------------
  */

  const isActive = Boolean(region.is_active);

  const country = region.country || {};

  const countryIsActive = Boolean(country.is_active);

  const countiesCount = Number(
    region.counties_count || 0
  );

  const hasCounties =
    region.has_counties ?? countiesCount > 0;

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
          <div className="flex flex-wrap items-center gap-2">

            <h1 className="text-xl font-bold text-slate-900">
              Region Details
            </h1>

            <StatusBadge
              active={isActive}
              label={region.status_label}
            />
          </div>

          <p className="mt-1 text-sm text-slate-500">
            View complete information about this region.
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
            Edit Region
          </button>
        </div>
      </div>

      {/* REGION PROFILE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <MapPin className="h-8 w-8" />
            </div>

            <div className="min-w-0 flex-1">

              <div className="flex flex-wrap items-center gap-3">

                <h2 className="text-2xl font-bold text-slate-900">
                  {region.name}
                </h2>

                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-bold tracking-wider text-slate-700">
                  {region.code || "--"}
                </span>
              </div>

              <p className="mt-1 break-all text-sm text-slate-500">
                {region.slug || "No slug available"}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Region ID: #{region.id}
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

        {/* REGION DETAILS */}

        <div className="p-6">

          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">
              General Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Basic region identification and location information.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailItem
              icon={MapPin}
              label="Region Name"
              value={region.name}
              description="Official region name"
            />

            <DetailItem
              icon={Hash}
              label="Region Code"
              value={region.code}
              description="Unique region identification code"
            />

            <DetailItem
              icon={Globe}
              label="URL Slug"
              value={region.slug}
              description="Generated region identifier"
            />

            <DetailItem
              icon={Globe}
              label="Full Location"
              value={region.full_location}
              description="Region and parent country"
            />

            <DetailItem
              icon={Hash}
              label="Country ID"
              value={country.id || region.country_id}
              description="Associated country identifier"
            />

            <DetailItem
              icon={ShieldCheck}
              label="Region Status"
              value={region.status_label || (isActive ? "Active" : "Inactive")}
              description="Region availability status"
            />
          </div>
        </div>

        {/* COUNTRY INFORMATION */}

        <div className="border-t border-slate-100 p-6">

          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">
              Parent Country Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Country associated with this region.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailItem
              icon={Globe}
              label="Country Name"
              value={country.name}
              description="Parent country"
            />

            <DetailItem
              icon={Hash}
              label="Country Code"
              value={country.code}
              description="Country identification code"
            />

            <DetailItem
              icon={ShieldCheck}
              label="Country Status"
              value={country.status_label || (countryIsActive ? "Active" : "Inactive")}
              description="Parent country availability"
            />
          </div>

          <div className="mt-4">
            <StatusBadge
              active={countryIsActive}
              label={country.status_label}
            />
          </div>
        </div>

        {/* COUNTY INFORMATION */}

        <div className="border-t border-slate-100 bg-slate-50/70 p-6">

          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">
              County Association
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              County records associated with this region.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailItem
              icon={Building2}
              label="Total Counties"
              value={formatNumber(countiesCount)}
              description="Number of counties in this region"
            />

            <DetailItem
              icon={Layers3}
              label="County Association"
              value={hasCounties ? "Has Counties" : "No Counties"}
              description="County relationship status"
            />

            <DetailItem
              icon={ShieldCheck}
              label="Association Status"
              value={hasCounties ? "Associated" : "Not Associated"}
              description="Region county association"
            />
          </div>
        </div>

        {/* RECORD INFORMATION */}

        <div className="border-t border-slate-100 bg-white p-6">

          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">
              Record Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Region record creation and modification details.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <DetailItem
              icon={CalendarDays}
              label="Date Created"
              value={formatDate(region.created_at)}
              description="Region registration date"
            />

            <DetailItem
              icon={Clock}
              label="Last Updated"
              value={formatDate(region.updated_at)}
              description="Most recent modification"
            />
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}

      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Manage {region.name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            You can update this region's information at any time.
          </p>
        </div>

        <button
          type="button"
          onClick={handleEdit}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Edit className="h-4 w-4" />
          Edit Region
        </button>
      </div>
    </div>
  );
};

export default RegionDetails;
