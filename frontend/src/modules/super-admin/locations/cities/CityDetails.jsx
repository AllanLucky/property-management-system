
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
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
  Loader2,
  Fingerprint,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import useCities from "../../../../hooks/useCities";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const CITY_INDEX_PATH = "/super-admin/cities";

const CITY_EDIT_PATH = (id) =>
  `/super-admin/cities/${id}/edit`;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely extract the city object from supported API response formats.
 *
 * Supports:
 * Axios response -> API envelope -> data
 * API envelope -> data
 * Direct city object
 * Nested city object
 */
const getCityRecord = (response) => {
  if (!response || typeof response !== "object") {
    return null;
  }

  const candidates = [
    response,
    response.city,
    response.data,
    response.data?.city,
    response.data?.data,
    response.data?.data?.city,
    response.payload,
    response.payload?.city,
    response.payload?.data,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate) &&
      candidate.id !== undefined &&
      candidate.name !== undefined
    ) {
      return candidate;
    }
  }

  return null;
};

/**
 * Normalize boolean values from Laravel.
 */
const isEnabled = (value) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
};

/**
 * Format dates.
 */
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

/**
 * Format numbers.
 */
const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat("en-KE").format(number);
};

/**
 * Safely display values.
 */
const displayValue = (value, fallback = "Not available") => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  return value;
};

/**
 * Error message.
 */
const getErrorMessage = (error) => {
  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.payload?.message ||
    error?.message ||
    "Unable to load city information. Please try again."
  );
};

/*
|--------------------------------------------------------------------------
| Section Heading
|--------------------------------------------------------------------------
*/

const SectionHeading = ({
  title,
  description,
  icon: Icon,
}) => {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <h3 className="text-base font-bold text-slate-900">
          {title}
        </h3>
      </div>

      {description && (
        <p className="mt-2 text-sm text-slate-500">
          {description}
        </p>
      )}
    </div>
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
  description,
}) => {
  return (
    <div className="flex min-w-0 gap-3 rounded-xl border border-slate-100 bg-white p-4 transition hover:border-slate-200 hover:shadow-sm">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
        {Icon && <Icon className="h-5 w-5" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {displayValue(value)}
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
  const enabled = isEnabled(active);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${enabled
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-600"
        }`}
    >
      {enabled ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}

      {label || (enabled ? "Active" : "Inactive")}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| Loading Skeleton
|--------------------------------------------------------------------------
*/

const CityDetailsSkeleton = () => {
  return (
    <div className="min-w-0 animate-pulse space-y-6">

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded bg-slate-200" />
          <div className="h-4 w-64 rounded bg-slate-100" />
        </div>

        <div className="h-10 w-32 rounded-xl bg-slate-200" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-slate-200" />

          <div className="flex-1 space-y-3">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="h-4 w-32 rounded bg-slate-100" />
            <div className="h-3 w-56 rounded bg-slate-100" />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 18 }).map((_, index) => (
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
| Error State
|--------------------------------------------------------------------------
*/

const CityErrorState = ({
  message,
  loading,
  onRetry,
  onBack,
}) => {
  return (
    <div className="min-w-0 space-y-6">

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            City Details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View city information.
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
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

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
};

/*
|--------------------------------------------------------------------------
| City Details Component
|--------------------------------------------------------------------------
*/

const CityDetails = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | Cities Hook
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | useCities returns selectedCity, not city.
  |
  */

  const {
    selectedCity,
    fetchCity,
    loading,
    error,
    clearCity,
  } = useCities({
    autoFetch: false,
  });

  /*
  |--------------------------------------------------------------------------
  | Local Request State
  |--------------------------------------------------------------------------
  */

  const [hasRequested, setHasRequested] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Resolve City
  |--------------------------------------------------------------------------
  */

  const city = useMemo(
    () => getCityRecord(selectedCity),
    [selectedCity]
  );

  const isCorrectCity = useMemo(
    () =>
      Boolean(
        city &&
        String(city.id) === String(id)
      ),
    [city, id]
  );

  const isLoading = Boolean(
    loading || (!hasRequested && !isCorrectCity)
  );

  /*
  |--------------------------------------------------------------------------
  | Fetch City Details
  |--------------------------------------------------------------------------
  */

  const loadCity = useCallback(async () => {
    if (!id) {
      setHasRequested(true);
      return;
    }

    setHasRequested(false);

    clearCity();

    try {
      const result = await fetchCity(id);

      if (!result?.success) {
        console.error(
          "[CityDetails] City request failed:",
          result?.message
        );
      }
    } catch (requestError) {
      console.error(
        "[CityDetails] Failed to load city:",
        requestError
      );
    } finally {
      setHasRequested(true);
    }
  }, [
    id,
    fetchCity,
    clearCity,
  ]);

  useEffect(() => {
    loadCity();
  }, [loadCity]);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleBack = useCallback(() => {
    navigate(CITY_INDEX_PATH);
  }, [navigate]);

  const handleEdit = useCallback(() => {
    if (!id) {
      return;
    }

    navigate(CITY_EDIT_PATH(id));
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
    loadCity();
  }, [loadCity]);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (isLoading && !isCorrectCity) {
    return <CityDetailsSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Error / Not Found State
  |--------------------------------------------------------------------------
  */

  if (!isCorrectCity) {
    return (
      <CityErrorState
        message={
          error ||
          (hasRequested
            ? "The requested city could not be found. Please check the city ID and try again."
            : "Loading city information...")
        }
        loading={loading}
        onRetry={handleRetry}
        onBack={handleBack}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | City Information
  |--------------------------------------------------------------------------
  */

  const isActive = isEnabled(city.is_active);

  const country = city.country || {};
  const region = city.region || {};
  const county = city.county || {};

  const countryIsActive = isEnabled(country.is_active);
  const regionIsActive = isEnabled(region.is_active);
  const countyIsActive = isEnabled(county.is_active);

  const areasCount = Number(city.areas_count || 0);
  const propertiesCount = Number(city.properties_count || 0);

  const hasAreas = areasCount > 0;
  const hasProperties = propertiesCount > 0;

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
              City Details
            </h1>

            <StatusBadge
              active={city.is_active}
              label={city.status_label}
            />
          </div>

          <p className="mt-1 text-sm text-slate-500">
            View complete information about this city.
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
            Edit City
          </button>
        </div>
      </div>

      {/* CITY PROFILE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <MapPin className="h-8 w-8" />
            </div>

            <div className="min-w-0 flex-1">

              <div className="flex flex-wrap items-center gap-3">

                <h2 className="text-2xl font-bold text-slate-900">
                  {city.name}
                </h2>

                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-bold tracking-wider text-slate-700">
                  {city.code || "--"}
                </span>
              </div>

              <p className="mt-1 break-all text-sm text-slate-500">
                {city.slug || "No slug available"}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                City ID: #{city.id}
              </p>

              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="h-4 w-4 shrink-0" />

                <span className="break-words">
                  {city.full_location ||
                    [
                      city.name,
                      county.name,
                      region.name,
                      country.name,
                    ]
                      .filter(Boolean)
                      .join(", ") ||
                    "Location not available"}
                </span>
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

        {/* GENERAL CITY DETAILS */}

        <div className="p-6">

          <SectionHeading
            title="General Information"
            description="Basic city identification and location information."
            icon={Fingerprint}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailItem
              icon={MapPin}
              label="City Name"
              value={city.name}
              description="Official city name"
            />

            <DetailItem
              icon={Hash}
              label="City Code"
              value={city.code}
              description="Unique city identification code"
            />

            <DetailItem
              icon={Globe}
              label="URL Slug"
              value={city.slug}
              description="Generated city identifier"
            />

            <DetailItem
              icon={Map}
              label="Full Location"
              value={city.full_location}
              description="City, county, region and country"
            />

            <DetailItem
              icon={Hash}
              label="Country ID"
              value={city.country_id}
              description="Associated country identifier"
            />

            <DetailItem
              icon={Hash}
              label="Region ID"
              value={city.region_id}
              description="Associated region identifier"
            />

            <DetailItem
              icon={Hash}
              label="County ID"
              value={city.county_id}
              description="Associated county identifier"
            />

            <DetailItem
              icon={ShieldCheck}
              label="City Status"
              value={city.status_label || (isActive ? "Active" : "Inactive")}
              description="City availability status"
            />
          </div>
        </div>

        {/* COUNTRY INFORMATION */}

        <div className="border-t border-slate-100 p-6">

          <SectionHeading
            title="Parent Country Information"
            description="Country associated with this city."
            icon={Globe}
          />

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
              active={country.is_active}
              label={country.status_label}
            />
          </div>
        </div>

        {/* REGION INFORMATION */}

        <div className="border-t border-slate-100 bg-slate-50/70 p-6">

          <SectionHeading
            title="Parent Region Information"
            description="Region associated with this city."
            icon={Map}
          />

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
              value={region.id || city.region_id}
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
              active={region.is_active}
              label={region.is_active_label}
            />
          </div>
        </div>

        {/* COUNTY INFORMATION */}

        <div className="border-t border-slate-100 p-6">

          <SectionHeading
            title="Parent County Information"
            description="County associated with this city."
            icon={MapPin}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailItem
              icon={MapPin}
              label="County Name"
              value={county.name}
              description="Parent county"
            />

            <DetailItem
              icon={Hash}
              label="County Code"
              value={county.code}
              description="County identification code"
            />

            <DetailItem
              icon={Globe}
              label="County Slug"
              value={county.slug}
              description="County URL identifier"
            />

            <DetailItem
              icon={Hash}
              label="County ID"
              value={county.id || city.county_id}
              description="Associated county identifier"
            />

            <DetailItem
              icon={ShieldCheck}
              label="County Status"
              value={county.status_label || (countyIsActive ? "Active" : "Inactive")}
              description="Parent county availability"
            />

            <DetailItem
              icon={Building2}
              label="County Cities"
              value={formatNumber(county.cities_count)}
              description="Number of cities in this county"
            />
          </div>

          <div className="mt-4">
            <StatusBadge
              active={county.is_active}
              label={county.status_label}
            />
          </div>
        </div>

        {/* CITY RECORDS */}

        <div className="border-t border-slate-100 bg-slate-50/70 p-6">

          <SectionHeading
            title="City Records"
            description="Areas and property records associated with this city."
            icon={Layers3}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailItem
              icon={MapPin}
              label="Total Areas"
              value={formatNumber(areasCount)}
              description="Number of areas in this city"
            />

            <DetailItem
              icon={Home}
              label="Total Properties"
              value={formatNumber(propertiesCount)}
              description="Number of registered properties"
            />

            <DetailItem
              icon={Layers3}
              label="Area Association"
              value={hasAreas ? "Has Areas" : "No Areas"}
              description="City area relationship status"
            />

            <DetailItem
              icon={Building2}
              label="Property Association"
              value={hasProperties ? "Has Properties" : "No Properties"}
              description="City property relationship status"
            />
          </div>
        </div>

        {/* RECORD INFORMATION */}

        <div className="border-t border-slate-100 bg-white p-6">

          <SectionHeading
            title="Record Information"
            description="City record creation and modification details."
            icon={CalendarDays}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <DetailItem
              icon={CalendarDays}
              label="Date Created"
              value={formatDate(city.created_at)}
              description="City registration date"
            />

            <DetailItem
              icon={Clock}
              label="Last Updated"
              value={formatDate(city.updated_at)}
              description="Most recent modification"
            />
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}

      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Manage {city.name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            You can update this city's information at any time.
          </p>
        </div>

        <button
          type="button"
          onClick={handleEdit}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Edit className="h-4 w-4" />
          Edit City
        </button>
      </div>
    </div>
  );
};

export default CityDetails;
