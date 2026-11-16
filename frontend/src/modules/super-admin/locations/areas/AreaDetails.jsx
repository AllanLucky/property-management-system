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
  Navigation,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import useAreas from "../../../../hooks/useAreas";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const AREA_INDEX_PATH = "/super-admin/areas";

const AREA_EDIT_PATH = (id) =>
  `/super-admin/areas/${id}/edit`;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely extract the area object from supported API response formats.
 *
 * Supports:
 * Axios response -> API envelope -> data
 * API envelope -> data
 * Direct area object
 * Nested area object
 */
const getAreaRecord = (response) => {
  if (!response || typeof response !== "object") {
    return null;
  }

  const candidates = [
    response,
    response.area,
    response.data,
    response.data?.area,
    response.data?.data,
    response.data?.data?.area,
    response.payload,
    response.payload?.area,
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
 * Format coordinates.
 */
const formatCoordinate = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not available";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Not available";
  }

  return number.toFixed(6);
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
    "Unable to load area information. Please try again."
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
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        enabled
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

const AreaDetailsSkeleton = () => {
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
          {Array.from({ length: 21 }).map((_, index) => (
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

const AreaErrorState = ({
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
            Area Details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View area information.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Areas
        </button>
      </div>

      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertCircle className="h-7 w-7" />
        </div>

        <h2 className="mt-4 text-lg font-bold text-slate-900">
          Unable to Load Area
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
            Back to Areas
          </button>
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Area Details Component
|--------------------------------------------------------------------------
*/

const AreaDetails = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | Areas Hook
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | useAreas returns selectedArea, not area.
  |
  */

  const {
    selectedArea,
    fetchArea,
    loading,
    error,
    clearArea,
  } = useAreas({
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
  | Resolve Area
  |--------------------------------------------------------------------------
  */

  const area = useMemo(
    () => getAreaRecord(selectedArea),
    [selectedArea]
  );

  const isCorrectArea = useMemo(
    () =>
      Boolean(
        area &&
        String(area.id) === String(id)
      ),
    [area, id]
  );

  const isLoading = Boolean(
    loading || (!hasRequested && !isCorrectArea)
  );

  /*
  |--------------------------------------------------------------------------
  | Fetch Area Details
  |--------------------------------------------------------------------------
  */

  const loadArea = useCallback(async () => {
    if (!id) {
      setHasRequested(true);
      return;
    }

    setHasRequested(false);

    clearArea();

    try {
      const result = await fetchArea(id);

      if (!result?.success) {
        console.error(
          "[AreaDetails] Area request failed:",
          result?.message
        );
      }
    } catch (requestError) {
      console.error(
        "[AreaDetails] Failed to load area:",
        requestError
      );
    } finally {
      setHasRequested(true);
    }
  }, [
    id,
    fetchArea,
    clearArea,
  ]);

  useEffect(() => {
    loadArea();
  }, [loadArea]);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleBack = useCallback(() => {
    navigate(AREA_INDEX_PATH);
  }, [navigate]);

  const handleEdit = useCallback(() => {
    if (!id) {
      return;
    }

    navigate(AREA_EDIT_PATH(id));
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
    loadArea();
  }, [loadArea]);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (isLoading && !isCorrectArea) {
    return <AreaDetailsSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Error / Not Found State
  |--------------------------------------------------------------------------
  */

  if (!isCorrectArea) {
    return (
      <AreaErrorState
        message={
          error ||
          (hasRequested
            ? "The requested area could not be found. Please check the area ID and try again."
            : "Loading area information...")
        }
        loading={loading}
        onRetry={handleRetry}
        onBack={handleBack}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Area Information
  |--------------------------------------------------------------------------
  */

  const isActive = isEnabled(area.is_active);

  const country = area.country || {};
  const region = area.region || {};
  const county = area.county || {};
  const city = area.city || {};

  const countryIsActive = isEnabled(country.is_active);
  const regionIsActive = isEnabled(region.is_active);
  const countyIsActive = isEnabled(county.is_active);
  const cityIsActive = isEnabled(city.is_active);

  const propertiesCount = Number(area.properties_count || 0);

  const hasProperties = propertiesCount > 0;

  const latitude =
    area.latitude ??
    area.coordinates?.latitude;

  const longitude =
    area.longitude ??
    area.coordinates?.longitude;

  const hasCoordinates =
    latitude !== null &&
    latitude !== undefined &&
    latitude !== "" &&
    longitude !== null &&
    longitude !== undefined &&
    longitude !== "";

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
              Area Details
            </h1>

            <StatusBadge
              active={area.is_active}
              label={area.status_label}
            />
          </div>

          <p className="mt-1 text-sm text-slate-500">
            View complete information about this area.
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
            Edit Area
          </button>
        </div>
      </div>

      {/* AREA PROFILE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <MapPin className="h-8 w-8" />
            </div>

            <div className="min-w-0 flex-1">

              <div className="flex flex-wrap items-center gap-3">

                <h2 className="text-2xl font-bold text-slate-900">
                  {area.name}
                </h2>

                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-bold tracking-wider text-slate-700">
                  {area.code || "--"}
                </span>
              </div>

              <p className="mt-1 break-all text-sm text-slate-500">
                {area.slug || "No slug available"}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Area ID: #{area.id}
              </p>

              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="h-4 w-4 shrink-0" />

                <span className="break-words">
                  {area.full_location ||
                    [
                      area.name,
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
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isActive
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

        {/* GENERAL AREA DETAILS */}

        <div className="p-6">

          <SectionHeading
            title="General Information"
            description="Basic area identification and location information."
            icon={Fingerprint}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailItem
              icon={MapPin}
              label="Area Name"
              value={area.name}
              description="Official area name"
            />

            <DetailItem
              icon={Hash}
              label="Area Code"
              value={area.code}
              description="Unique area identification code"
            />

            <DetailItem
              icon={Globe}
              label="URL Slug"
              value={area.slug}
              description="Generated area identifier"
            />

            <DetailItem
              icon={Map}
              label="Full Location"
              value={area.full_location}
              description="Area, city, county, region and country"
            />

            <DetailItem
              icon={Hash}
              label="Country ID"
              value={area.country_id}
              description="Associated country identifier"
            />

            <DetailItem
              icon={Hash}
              label="Region ID"
              value={area.region_id}
              description="Associated region identifier"
            />

            <DetailItem
              icon={Hash}
              label="County ID"
              value={area.county_id}
              description="Associated county identifier"
            />

            <DetailItem
              icon={Hash}
              label="City ID"
              value={area.city_id}
              description="Associated city identifier"
            />

            <DetailItem
              icon={ShieldCheck}
              label="Area Status"
              value={area.status_label || (isActive ? "Active" : "Inactive")}
              description="Area availability status"
            />
          </div>
        </div>

        {/* COUNTRY INFORMATION */}

        <div className="border-t border-slate-100 p-6">

          <SectionHeading
            title="Parent Country Information"
            description="Country associated with this area."
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
            description="Region associated with this area."
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
              value={region.id || area.region_id}
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
            description="County associated with this area."
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
              value={county.id || area.county_id}
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

        {/* CITY INFORMATION */}

        <div className="border-t border-slate-100 bg-slate-50/70 p-6">

          <SectionHeading
            title="Parent City Information"
            description="City associated with this area."
            icon={Building2}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailItem
              icon={Building2}
              label="City Name"
              value={city.name}
              description="Parent city"
            />

            <DetailItem
              icon={Hash}
              label="City Code"
              value={city.code}
              description="City identification code"
            />

            <DetailItem
              icon={Globe}
              label="City Slug"
              value={city.slug}
              description="City URL identifier"
            />

            <DetailItem
              icon={Hash}
              label="City ID"
              value={city.id || area.city_id}
              description="Associated city identifier"
            />

            <DetailItem
              icon={ShieldCheck}
              label="City Status"
              value={city.status_label || (cityIsActive ? "Active" : "Inactive")}
              description="Parent city availability"
            />

            <DetailItem
              icon={Layers3}
              label="City Areas"
              value={formatNumber(city.areas_count)}
              description="Number of areas in this city"
            />
          </div>

          <div className="mt-4">
            <StatusBadge
              active={city.is_active}
              label={city.status_label}
            />
          </div>
        </div>

        {/* COORDINATE INFORMATION */}

        <div className="border-t border-slate-100 p-6">

          <SectionHeading
            title="Geographical Coordinates"
            description="Geographical position recorded for this area."
            icon={Navigation}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailItem
              icon={Navigation}
              label="Latitude"
              value={formatCoordinate(latitude)}
              description="North or south geographical position"
            />

            <DetailItem
              icon={Navigation}
              label="Longitude"
              value={formatCoordinate(longitude)}
              description="East or west geographical position"
            />

            <DetailItem
              icon={MapPin}
              label="Coordinates Status"
              value={hasCoordinates ? "Coordinates Available" : "Not Provided"}
              description="Area geographical location"
            />
          </div>
        </div>

        {/* AREA RECORDS */}

        <div className="border-t border-slate-100 bg-slate-50/70 p-6">

          <SectionHeading
            title="Area Records"
            description="Property records associated with this area."
            icon={Layers3}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <DetailItem
              icon={Home}
              label="Total Properties"
              value={formatNumber(propertiesCount)}
              description="Number of registered properties"
            />

            <DetailItem
              icon={Layers3}
              label="Property Association"
              value={hasProperties ? "Has Properties" : "No Properties"}
              description="Area property relationship status"
            />

            <DetailItem
              icon={MapPin}
              label="Area Location"
              value={area.full_location}
              description="Complete administrative location"
            />
          </div>
        </div>

        {/* RECORD INFORMATION */}

        <div className="border-t border-slate-100 bg-white p-6">

          <SectionHeading
            title="Record Information"
            description="Area record creation and modification details."
            icon={CalendarDays}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <DetailItem
              icon={CalendarDays}
              label="Date Created"
              value={formatDate(area.created_at)}
              description="Area registration date"
            />

            <DetailItem
              icon={Clock}
              label="Last Updated"
              value={formatDate(area.updated_at)}
              description="Most recent modification"
            />
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}

      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Manage {area.name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            You can update this area's information at any time.
          </p>
        </div>

        <button
          type="button"
          onClick={handleEdit}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Edit className="h-4 w-4" />
          Edit Area
        </button>
      </div>
    </div>
  );
};

export default AreaDetails;