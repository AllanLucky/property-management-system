
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
  Home,
  Map,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import useCounties from "../../../../hooks/useCounties";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const COUNTY_INDEX_PATH = "/super-admin/counties";

const COUNTY_EDIT_PATH = (id) =>
  `/super-admin/counties/${id}/edit`;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getCountyRecord = (response) => {
  if (!response || typeof response !== "object") {
    return null;
  }

  if (response.id && response.name) {
    return response;
  }

  const candidates = [
    response.county,
    response.data?.county,
    response.data?.data?.county,
    response.data?.data,
    response.data,
    response.payload?.county,
    response.payload?.data,
    response.payload,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate) &&
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
    "Unable to load county information. Please try again."
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
          {value !== null && value !== undefined && value !== ""
            ? value
            : "Not available"}
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

const CountyDetailsSkeleton = () => {
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
          {Array.from({ length: 12 }).map((_, index) => (
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
| County Details Component
|--------------------------------------------------------------------------
*/

const CountyDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | Counties Hook
  |--------------------------------------------------------------------------
  */

  const {
    county: selectedCounty,
    fetchCounty,
    loading,
    detailsLoading,
    error,
    detailsError,
    clearCounty,
  } = useCounties({
    autoFetch: false,
  });

  /*
  |--------------------------------------------------------------------------
  | Resolve County
  |--------------------------------------------------------------------------
  */

  const county = useMemo(
    () => getCountyRecord(selectedCounty),
    [selectedCounty]
  );

  const isCorrectCounty = useMemo(
    () =>
      Boolean(
        county &&
        String(county.id) === String(id)
      ),
    [county, id]
  );

  const isLoading = Boolean(loading || detailsLoading);
  const countyError = detailsError || error;

  /*
  |--------------------------------------------------------------------------
  | Fetch County Details
  |--------------------------------------------------------------------------
  */

  const loadCounty = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      clearCounty?.();

      await fetchCounty(id);
    } catch (requestError) {
      console.error(
        "[CountyDetails] Failed to load county:",
        requestError
      );
    }
  }, [
    id,
    fetchCounty,
    clearCounty,
  ]);

  useEffect(() => {
    loadCounty();
  }, [loadCounty]);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleBack = useCallback(() => {
    navigate(COUNTY_INDEX_PATH);
  }, [navigate]);

  const handleEdit = useCallback(() => {
    if (!id) {
      return;
    }

    navigate(COUNTY_EDIT_PATH(id));
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
    loadCounty();
  }, [loadCounty]);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (isLoading && !isCorrectCounty) {
    return <CountyDetailsSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | County Not Found
  |--------------------------------------------------------------------------
  */

  if (!isCorrectCounty) {
    return (
      <div className="min-w-0 space-y-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              County Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View county information.
            </p>
          </div>

          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Counties
          </button>
        </div>

        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Unable to Load County
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {getErrorMessage(countyError) ||
              "The requested county could not be found."}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">

            <button
              type="button"
              onClick={handleRetry}
              disabled={isLoading}
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
              Back to Counties
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | County Information
  |--------------------------------------------------------------------------
  */

  const isActive = Boolean(county.is_active);

  const country = county.country || {};
  const region = county.region || {};

  const countryIsActive = Boolean(country.is_active);
  const regionIsActive = Boolean(region.is_active);

  const citiesCount = Number(county.cities_count || 0);
  const areasCount = Number(county.areas_count || 0);
  const propertiesCount = Number(county.properties_count || 0);

  const hasCities = county.has_cities ?? citiesCount > 0;
  const hasAreas = county.has_areas ?? areasCount > 0;
  const hasProperties = county.has_properties ?? propertiesCount > 0;

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
              County Details
            </h1>

            <StatusBadge
              active={isActive}
              label={county.status_label}
            />
          </div>

          <p className="mt-1 text-sm text-slate-500">
            View complete information about this county.
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
            Edit County
          </button>
        </div>
      </div>

      {/* COUNTY PROFILE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <MapPin className="h-8 w-8" />
            </div>

            <div className="min-w-0 flex-1">

              <div className="flex flex-wrap items-center gap-3">

                <h2 className="text-2xl font-bold text-slate-900">
                  {county.name}
                </h2>

                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-bold tracking-wider text-slate-700">
                  {county.code || "--"}
                </span>
              </div>

              <p className="mt-1 break-all text-sm text-slate-500">
                {county.slug || "No slug available"}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                County ID: #{county.id}
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

        {/* GENERAL COUNTY DETAILS */}

        <div className="p-6">

          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">
              General Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Basic county identification and location information.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailItem
              icon={MapPin}
              label="County Name"
              value={county.name}
              description="Official county or district name"
            />

            <DetailItem
              icon={Hash}
              label="County Code"
              value={county.code}
              description="Unique county identification code"
            />

            <DetailItem
              icon={Globe}
              label="URL Slug"
              value={county.slug}
              description="Generated county identifier"
            />

            <DetailItem
              icon={Globe}
              label="Full Location"
              value={county.full_location}
              description="County, region and parent country"
            />

            <DetailItem
              icon={Hash}
              label="Country ID"
              value={country.id || county.country_id}
              description="Associated country identifier"
            />

            <DetailItem
              icon={Hash}
              label="Region ID"
              value={region.id || county.region_id}
              description="Associated region identifier"
            />

            <DetailItem
              icon={ShieldCheck}
              label="County Status"
              value={county.status_label || (isActive ? "Active" : "Inactive")}
              description="County availability status"
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
              Country associated with this county.
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
              icon={Globe}
              label="Phone Code"
              value={country.phone_code}
              description="International dialing code"
            />

            <DetailItem
              icon={Globe}
              label="Currency"
              value={country.currency}
              description="Country currency"
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

        {/* REGION INFORMATION */}

        <div className="border-t border-slate-100 bg-slate-50/70 p-6">

          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">
              Parent Region Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Region associated with this county.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailItem
              icon={Map}
              label="Region Name"
              value={region.name}
              description="Parent administrative region"
            />

            <DetailItem
              icon={Hash}
              label="Region Code"
              value={region.code}
              description="Region identification code"
            />

            <DetailItem
              icon={Globe}
              label="Region Slug"
              value={region.slug}
              description="Region URL identifier"
            />

            <DetailItem
              icon={Hash}
              label="Region ID"
              value={region.id || county.region_id}
              description="Associated region identifier"
            />

            <DetailItem
              icon={ShieldCheck}
              label="Region Status"
              value={
                region.is_active_label ||
                (regionIsActive ? "Active" : "Inactive")
              }
              description="Parent region availability"
            />
          </div>

          <div className="mt-4">
            <StatusBadge
              active={regionIsActive}
              label={region.is_active_label}
            />
          </div>
        </div>

        {/* LOCATION RECORDS */}

        <div className="border-t border-slate-100 p-6">

          <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900">
              Location Records
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Cities, areas and property records associated with this county.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailItem
              icon={Building2}
              label="Total Cities"
              value={formatNumber(citiesCount)}
              description="Number of cities in this county"
            />

            <DetailItem
              icon={MapPin}
              label="Total Areas"
              value={formatNumber(areasCount)}
              description="Number of areas in this county"
            />

            <DetailItem
              icon={Home}
              label="Total Properties"
              value={formatNumber(propertiesCount)}
              description="Number of registered properties"
            />

            <DetailItem
              icon={Layers3}
              label="City Association"
              value={hasCities ? "Has Cities" : "No Cities"}
              description="County city relationship status"
            />

            <DetailItem
              icon={Layers3}
              label="Area Association"
              value={hasAreas ? "Has Areas" : "No Areas"}
              description="County area relationship status"
            />

            <DetailItem
              icon={Building2}
              label="Property Association"
              value={hasProperties ? "Has Properties" : "No Properties"}
              description="County property relationship status"
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
              County record creation and modification details.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <DetailItem
              icon={CalendarDays}
              label="Date Created"
              value={formatDate(county.created_at)}
              description="County registration date"
            />

            <DetailItem
              icon={Clock}
              label="Last Updated"
              value={formatDate(county.updated_at)}
              description="Most recent modification"
            />
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}

      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Manage {county.name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            You can update this county's information at any time.
          </p>
        </div>

        <button
          type="button"
          onClick={handleEdit}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Edit className="h-4 w-4" />
          Edit County
        </button>
      </div>
    </div>
  );
};

export default CountyDetails;
