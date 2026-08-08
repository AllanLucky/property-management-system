
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Home,
  Layers3,
  Loader2,
  MapPin,
  Maximize2,
  Navigation,
  Pencil,
  Ruler,
  ShieldCheck,
  Toilet,
  Users,
  XCircle,
} from "lucide-react";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";

import api from "../../../api/axios";
import PropertyHeader from "./PropertyHeader";

import "leaflet/dist/leaflet.css";

/*
|--------------------------------------------------------------------------
| Leaflet Marker
|--------------------------------------------------------------------------
*/

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const markerIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getValue = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  return value;
};

const normalizeBoolean = (value) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
};

const normalizeStatus = (value, fallback = "draft") => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (typeof value === "object") {
    return (
      value?.value ??
      value?.status ??
      value?.key ??
      value?.label ??
      fallback
    );
  }

  return value;
};

const formatNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "0";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-KE").format(number);
};

const formatCurrency = (
  value,
  currency = "KES"
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return `${currency} 0`;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return `${currency} ${value}`;
  }

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(number);
  } catch {
    return `${currency} ${formatNumber(number)}`;
  }
};

const formatPercent = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0%";
  }

  return `${number.toFixed(1)}%`;
};

const getStatusClasses = (status) => {
  switch (status) {
    case "active":
    case "published":
      return "bg-green-100 text-green-700";

    case "pending":
      return "bg-yellow-100 text-yellow-700";

    case "inactive":
    case "archived":
      return "bg-gray-100 text-gray-700";

    case "draft":
      return "bg-blue-100 text-blue-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

/*
|--------------------------------------------------------------------------
| Normalize Property
|--------------------------------------------------------------------------
*/

const normalizeProperty = (data = {}) => {
  const location = data?.location || {};
  const features = data?.features || {};
  const pricing = data?.pricing || {};
  const flags = data?.flags || {};
  const media = data?.media || {};
  const stats = data?.stats || {};
  const insights = data?.insights || {};

  const latitude =
    location?.latitude ??
    data?.latitude ??
    "";

  const longitude =
    location?.longitude ??
    data?.longitude ??
    "";

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  return {
    ...data,

    title:
      data?.title ??
      data?.name ??
      "Untitled Property",

    description:
      data?.description ?? "",

    status: normalizeStatus(
      data?.status,
      "draft"
    ),

    location: {
      country_name:
        location?.country_name ??
        data?.country_name ??
        "",

      region_name:
        location?.region_name ??
        data?.region_name ??
        "",

      county_name:
        location?.county_name ??
        data?.county_name ??
        "",

      city_name:
        location?.city_name ??
        data?.city_name ??
        "",

      area_name:
        location?.area_name ??
        data?.area_name ??
        "",

      street_address:
        location?.street_address ??
        data?.street_address ??
        "",

      latitude,
      longitude,

      validCoordinates:
        Number.isFinite(parsedLatitude) &&
        Number.isFinite(parsedLongitude),
    },

    features: {
      bedrooms:
        features?.bedrooms ??
        data?.bedrooms ??
        0,

      bathrooms:
        features?.bathrooms ??
        data?.bathrooms ??
        0,

      toilets:
        features?.toilets ??
        data?.toilets ??
        0,

      floors:
        features?.floors ??
        data?.floors ??
        0,

      size:
        features?.size ??
        data?.size ??
        0,

      size_unit:
        features?.size_unit ??
        data?.size_unit ??
        "sqm",
    },

    pricing: {
      price:
        pricing?.price ??
        data?.price ??
        0,

      monthly_rent:
        pricing?.monthly_rent ??
        data?.monthly_rent ??
        0,

      service_charge:
        pricing?.service_charge ??
        data?.service_charge ??
        0,

      currency:
        pricing?.currency ??
        data?.currency ??
        "KES",
    },

    flags: {
      is_featured: normalizeBoolean(
        flags?.is_featured ??
          data?.is_featured
      ),

      is_verified: normalizeBoolean(
        flags?.is_verified ??
          data?.is_verified
      ),

      is_published: normalizeBoolean(
        flags?.is_published ??
          data?.is_published
      ),
    },

    media: {
      image_url:
        media?.image_url ??
        data?.image_url ??
        data?.cover_image_url ??
        "",

      thumbnail_url:
        media?.thumbnail_url ??
        data?.thumbnail_url ??
        "",

      video_url:
        media?.video_url ??
        data?.video_url ??
        "",

      virtual_tour_url:
        media?.virtual_tour_url ??
        data?.virtual_tour_url ??
        "",
    },

    stats: {
      total_units:
        stats?.total_units ??
        data?.total_units ??
        0,

      occupied_units:
        stats?.occupied_units ??
        data?.occupied_units ??
        0,

      vacant_units:
        stats?.vacant_units ??
        data?.vacant_units ??
        0,

      maintenance_units:
        stats?.maintenance_units ??
        data?.maintenance_units ??
        0,

      occupancy_rate:
        stats?.occupancy_rate ??
        data?.occupancy_rate ??
        0,
    },

    insights: {
      has_vacancy: normalizeBoolean(
        insights?.has_vacancy
      ),

      fully_occupied: normalizeBoolean(
        insights?.fully_occupied
      ),

      is_empty: normalizeBoolean(
        insights?.is_empty
      ),
    },
  };
};

/*
|--------------------------------------------------------------------------
| Info Card
|--------------------------------------------------------------------------
*/

const InfoCard = ({
  icon: Icon,
  label,
  value,
  description,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon size={19} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>

          <p className="mt-1 truncate text-lg font-semibold text-gray-900">
            {value}
          </p>

          {description && (
            <p className="mt-0.5 text-xs text-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Stat Card
|--------------------------------------------------------------------------
*/

const StatCard = ({
  icon: Icon,
  label,
  value,
  description,
  className = "",
}) => {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-gray-500">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Property Details
|--------------------------------------------------------------------------
*/

const PropertyDetails = () => {
  const { id } = useParams();

  const [property, setProperty] =
    useState(null);

  const [units, setUnits] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  /*
  |--------------------------------------------------------------------------
  | FETCH PROPERTY
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    const fetchProperty = async () => {
      if (!id) {
        setError(
          "Property ID is missing."
        );

        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(
          `/properties/${id}`
        );

        const data =
          response?.data?.data ??
          response?.data ??
          null;

        if (!mounted) {
          return;
        }

        if (!data) {
          setProperty(null);
          setUnits([]);
          return;
        }

        const normalized =
          normalizeProperty(data);

        setProperty(normalized);

        /*
        |--------------------------------------------------------------------------
        | Units
        |--------------------------------------------------------------------------
        */

        const propertyUnits =
          Array.isArray(data?.units)
            ? data.units
            : Array.isArray(
                data?.apartments?.flatMap?.(
                  (apartment) =>
                    apartment?.units || []
                )
              )
            ? data.apartments.flatMap(
                (apartment) =>
                  apartment?.units || []
              )
            : [];

        setUnits(propertyUnits);
      } catch (err) {
        console.error(
          "Failed to load property details:",
          err
        );

        if (!mounted) {
          return;
        }

        setError(
          err?.response?.data?.message ||
            "Failed to load property details."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProperty();

    return () => {
      mounted = false;
    };
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Coordinates
  |--------------------------------------------------------------------------
  */

  const coordinates = useMemo(() => {
    if (!property?.location) {
      return null;
    }

    const latitude = Number(
      property.location.latitude
    );

    const longitude = Number(
      property.location.longitude
    );

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return null;
    }

    return {
      latitude,
      longitude,
    };
  }, [property]);

  /*
  |--------------------------------------------------------------------------
  | LOCATION LABEL
  |--------------------------------------------------------------------------
  */

  const locationText = useMemo(() => {
    if (!property?.location) {
      return "Location not provided";
    }

    const parts = [
      property.location.street_address,
      property.location.area_name,
      property.location.city_name,
      property.location.county_name,
      property.location.country_name,
    ].filter(Boolean);

    return parts.length > 0
      ? parts.join(", ")
      : "Location not provided";
  }, [property]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-[500px]">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <Loader2
              size={38}
              className="animate-spin text-indigo-600"
            />

            <p className="mt-4 text-sm font-semibold text-gray-800">
              Loading property details...
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Preparing property information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <div className="min-h-[500px] px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <XCircle
              size={40}
              className="mx-auto text-red-500"
            />

            <h2 className="mt-3 text-lg font-semibold text-red-800">
              Unable to load property
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <Link
              to="/super-admin/properties"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <ArrowLeft size={16} />
              Back to Properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (!property) {
    return (
      <div className="min-h-[500px] px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <Building2
              size={42}
              className="mx-auto text-gray-400"
            />

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Property not found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              The property you are looking for
              does not exist or is no longer
              available.
            </p>

            <Link
              to="/super-admin/properties"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <ArrowLeft size={16} />
              Back to Properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                              */}
      {/* ------------------------------------------------------------------ */}

      <PropertyHeader
        title={property.title}
        description={
          property.description ||
          "View complete property information, location, pricing and units."
        }
        backUrl="/super-admin/properties"
        backLabel="Back to Properties"
      />

      {/* ------------------------------------------------------------------ */}
      {/* CONTENT                                                             */}
      {/* ------------------------------------------------------------------ */}

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* ---------------------------------------------------------------- */}
        {/* ACTIONS + STATUS                                                  */}
        {/* ---------------------------------------------------------------- */}

        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                property.status
              )}`}
            >
              <BadgeCheck size={14} />

              {property.status}
            </span>

            {property.flags.is_verified && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                <ShieldCheck size={14} />
                Verified
              </span>
            )}

            {property.flags.is_featured && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Featured
              </span>
            )}

            {property.flags.is_published ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Eye size={14} />
                Published
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                <EyeOff size={14} />
                Not Published
              </span>
            )}
          </div>

          <Link
            to={`/super-admin/properties/edit/${property.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Pencil size={16} />
            Edit Property
          </Link>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* PROPERTY OVERVIEW                                                 */}
        {/* ---------------------------------------------------------------- */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {/* Image */}

            <div className="lg:col-span-1">
              {property.media.image_url ? (
                <img
                  src={property.media.image_url}
                  alt={property.title}
                  className="h-72 w-full object-cover lg:h-full lg:min-h-[300px]"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="flex h-72 items-center justify-center bg-gray-100 lg:h-full lg:min-h-[300px]">
                  <div className="text-center text-gray-400">
                    <Building2
                      size={42}
                      className="mx-auto"
                    />

                    <p className="mt-2 text-sm">
                      No property image
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Information */}

            <div className="p-6 lg:col-span-2">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Home size={22} />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {property.title}
                  </h1>

                  <p className="mt-1 flex items-start gap-1.5 text-sm text-gray-500">
                    <MapPin
                      size={16}
                      className="mt-0.5 shrink-0"
                    />

                    <span>
                      {locationText}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <InfoCard
                  icon={BedDouble}
                  label="Bedrooms"
                  value={formatNumber(
                    property.features.bedrooms
                  )}
                />

                <InfoCard
                  icon={Bath}
                  label="Bathrooms"
                  value={formatNumber(
                    property.features.bathrooms
                  )}
                />

                <InfoCard
                  icon={Toilet}
                  label="Toilets"
                  value={formatNumber(
                    property.features.toilets
                  )}
                />

                <InfoCard
                  icon={Layers3}
                  label="Floors"
                  value={formatNumber(
                    property.features.floors
                  )}
                />

                <InfoCard
                  icon={Ruler}
                  label="Property Size"
                  value={`${formatNumber(
                    property.features.size
                  )} ${property.features.size_unit}`}
                />

                <InfoCard
                  icon={Building2}
                  label="Units"
                  value={formatNumber(
                    property.stats.total_units
                  )}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* DESCRIPTION                                                        */}
        {/* ---------------------------------------------------------------- */}

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <FileText size={19} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Property Description
              </h2>

              <p className="text-xs text-gray-500">
                Detailed information about the property.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-gray-50 p-4">
            <p className="whitespace-pre-line text-sm leading-6 text-gray-700">
              {property.description ||
                "No description has been provided for this property."}
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* LOCATION                                                          */}
        {/* ---------------------------------------------------------------- */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <MapPin size={19} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Property Location
                </h2>

                <p className="text-xs text-gray-500">
                  Exact geographic location of the property.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Map */}

            <div className="h-[400px] lg:h-[450px]">
              {coordinates ? (
                <MapContainer
                  center={[
                    coordinates.latitude,
                    coordinates.longitude,
                  ]}
                  zoom={16}
                  scrollWheelZoom
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <Marker
                    position={[
                      coordinates.latitude,
                      coordinates.longitude,
                    ]}
                    icon={markerIcon}
                  />
                </MapContainer>
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-100">
                  <div className="px-6 text-center">
                    <MapPin
                      size={38}
                      className="mx-auto text-gray-400"
                    />

                    <p className="mt-3 text-sm font-semibold text-gray-700">
                      Location coordinates unavailable
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Latitude and longitude have not
                      been recorded for this property.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Location Information */}

            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-900">
                Address Information
              </h3>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Street Address
                  </p>

                  <p className="mt-1 text-sm text-gray-800">
                    {property.location.street_address ||
                      "Not provided"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Area
                    </p>

                    <p className="mt-1 text-sm text-gray-800">
                      {property.location.area_name ||
                        "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      City
                    </p>

                    <p className="mt-1 text-sm text-gray-800">
                      {property.location.city_name ||
                        "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      County
                    </p>

                    <p className="mt-1 text-sm text-gray-800">
                      {property.location.county_name ||
                        "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Region
                    </p>

                    <p className="mt-1 text-sm text-gray-800">
                      {property.location.region_name ||
                        "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Country
                    </p>

                    <p className="mt-1 text-sm text-gray-800">
                      {property.location.country_name ||
                        "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Coordinates */}

              <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                <div className="flex items-center gap-2">
                  <Navigation
                    size={17}
                    className="text-indigo-600"
                  />

                  <h3 className="text-sm font-semibold text-gray-900">
                    Exact Coordinates
                  </h3>
                </div>

                {coordinates ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-gray-500">
                        Latitude
                      </p>

                      <p className="mt-1 font-mono text-sm font-semibold text-gray-900">
                        {coordinates.latitude.toFixed(
                          7
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-gray-500">
                        Longitude
                      </p>

                      <p className="mt-1 font-mono text-sm font-semibold text-gray-900">
                        {coordinates.longitude.toFixed(
                          7
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">
                    Exact coordinates are not available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* PRICING                                                           */}
        {/* ---------------------------------------------------------------- */}

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <DollarSign size={19} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Pricing
              </h2>

              <p className="text-xs text-gray-500">
                Property pricing information.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard
              icon={DollarSign}
              label="Sale Price"
              value={formatCurrency(
                property.pricing.price,
                property.pricing.currency
              )}
            />

            <InfoCard
              icon={DollarSign}
              label="Monthly Rent"
              value={formatCurrency(
                property.pricing.monthly_rent,
                property.pricing.currency
              )}
            />

            <InfoCard
              icon={DollarSign}
              label="Service Charge"
              value={formatCurrency(
                property.pricing.service_charge,
                property.pricing.currency
              )}
            />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* UNIT STATISTICS                                                    */}
        {/* ---------------------------------------------------------------- */}

        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Property Performance
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Current occupancy and unit performance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              icon={Building2}
              label="Total Units"
              value={formatNumber(
                property.stats.total_units
              )}
            />

            <StatCard
              icon={Users}
              label="Occupied"
              value={formatNumber(
                property.stats.occupied_units
              )}
            />

            <StatCard
              icon={Home}
              label="Vacant"
              value={formatNumber(
                property.stats.vacant_units
              )}
            />

            <StatCard
              icon={Loader2}
              label="Maintenance"
              value={formatNumber(
                property.stats.maintenance_units
              )}
            />

            <StatCard
              icon={CheckCircle2}
              label="Occupancy"
              value={formatPercent(
                property.stats.occupancy_rate
              )}
            />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* INSIGHTS                                                          */}
        {/* ---------------------------------------------------------------- */}

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <BadgeCheck size={19} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Property Insights
              </h2>

              <p className="text-xs text-gray-500">
                Current property availability insights.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div
              className={`rounded-xl border p-4 ${
                property.insights.has_vacancy
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {property.insights.has_vacancy ? (
                  <CheckCircle2
                    size={18}
                    className="text-green-600"
                  />
                ) : (
                  <XCircle
                    size={18}
                    className="text-red-600"
                  />
                )}

                <span className="text-sm font-semibold text-gray-800">
                  {property.insights.has_vacancy
                    ? "Has Vacancy"
                    : "No Vacancy"}
                </span>
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                property.insights.fully_occupied
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {property.insights.fully_occupied ? (
                  <XCircle
                    size={18}
                    className="text-red-600"
                  />
                ) : (
                  <CheckCircle2
                    size={18}
                    className="text-green-600"
                  />
                )}

                <span className="text-sm font-semibold text-gray-800">
                  {property.insights.fully_occupied
                    ? "Fully Occupied"
                    : "Not Fully Occupied"}
                </span>
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                property.insights.is_empty
                  ? "border-gray-200 bg-gray-50"
                  : "border-indigo-200 bg-indigo-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {property.insights.is_empty ? (
                  <XCircle
                    size={18}
                    className="text-gray-500"
                  />
                ) : (
                  <CheckCircle2
                    size={18}
                    className="text-indigo-600"
                  />
                )}

                <span className="text-sm font-semibold text-gray-800">
                  {property.insights.is_empty
                    ? "Empty Property"
                    : "Active Property"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* UNITS                                                             */}
        {/* ---------------------------------------------------------------- */}

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Property Units
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Units currently associated with this property.
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {formatNumber(units.length)} Units
            </span>
          </div>

          {units.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <Building2
                size={34}
                className="mx-auto text-gray-400"
              />

              <p className="mt-3 text-sm font-semibold text-gray-700">
                No units available
              </p>

              <p className="mt-1 text-xs text-gray-500">
                No units are currently associated with this property.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {units.map((unit) => {
                const unitStatus =
                  normalizeStatus(
                    unit?.status,
                    "unknown"
                  );

                return (
                  <div
                    key={unit.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {unit?.name ||
                            unit?.unit_number ||
                            `Unit #${unit?.id}`}
                        </h3>

                        {unit?.unit_number && (
                          <p className="mt-1 text-xs text-gray-500">
                            Unit Number:{" "}
                            {unit.unit_number}
                          </p>
                        )}
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${getStatusClasses(
                          unitStatus
                        )}`}
                      >
                        {unitStatus}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          Rent
                        </span>

                        <span className="font-semibold text-gray-800">
                          {unit?.rent_label ||
                            formatCurrency(
                              unit?.rent ??
                                unit?.monthly_rent ??
                                0,
                              property.pricing
                                .currency
                            )}
                        </span>
                      </div>

                      {unit?.floor !==
                        undefined &&
                        unit?.floor !== null && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              Floor
                            </span>

                            <span className="font-medium text-gray-800">
                              {unit.floor}
                            </span>
                          </div>
                        )}

                      {unit?.bedrooms !==
                        undefined &&
                        unit?.bedrooms !== null && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              Bedrooms
                            </span>

                            <span className="font-medium text-gray-800">
                              {unit.bedrooms}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* MEDIA                                                             */}
        {/* ---------------------------------------------------------------- */}

        {(property.media.video_url ||
          property.media.virtual_tour_url) && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Eye size={19} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Property Media
                </h2>

                <p className="text-xs text-gray-500">
                  Additional property media and virtual experiences.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {property.media.video_url && (
                <a
                  href={
                    property.media.video_url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  View Property Video
                </a>
              )}

              {property.media.virtual_tour_url && (
                <a
                  href={
                    property.media.virtual_tour_url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  <Maximize2 size={16} />
                  Open Virtual Tour
                </a>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default PropertyDetails;
