import {
  Eye,
  Heart,
  Star,
  MapPin,
  BedDouble,
  Bath,
  Building2,
  Home,
  DollarSign,
  ExternalLink,
  Calendar,
} from "lucide-react";

const PropertyAnalyticsCard = ({ analytics }) => {
  const property = analytics?.property || {};

  const image =
    property?.media?.image_url ||
    property?.media?.thumbnail_url ||
    "https://via.placeholder.com/800x600?text=No+Image";

  const location =
    property?.location?.full_location ||
    property?.location?.street_address ||
    "Location unavailable";

  const occupancy =
    (analytics.occupied_units_count || 0) +
      (analytics.vacant_units_count || 0) >
    0
      ? Math.round(
          ((analytics.occupied_units_count || 0) /
            ((analytics.occupied_units_count || 0) +
              (analytics.vacant_units_count || 0))) *
            100
        )
      : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">

      {/* Image */}
      <div className="relative">
        <img
          src={image}
          alt={property.title}
          className="h-60 w-full object-cover"
        />

        <span className="absolute left-4 top-4 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
          {property.listing_type?.toUpperCase()}
        </span>

        <span
          className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold text-white ${
            property.status === "published"
              ? "bg-green-600"
              : "bg-yellow-600"
          }`}
        >
          {property.status}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-5 p-5">

        {/* Header */}
        <div>
          <h2 className="line-clamp-1 text-xl font-bold text-gray-900">
            {property.title}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {property.property_code}
          </p>

          <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="mt-0.5 h-4 w-4 text-red-500" />
            <span>{location}</span>
          </div>
        </div>

        {/* Price */}
        <div className="rounded-xl bg-indigo-50 p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-indigo-600" />

            <span className="text-lg font-bold text-indigo-700">
              {property.pricing?.formatted_price ?? "-"}
            </span>
          </div>

          {property.pricing?.monthly_rent && (
            <p className="mt-2 text-sm text-gray-600">
              Monthly Rent:
              <span className="ml-1 font-semibold">
                KES {Number(property.pricing.monthly_rent).toLocaleString()}
              </span>
            </p>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-4 gap-3">

          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <BedDouble className="mx-auto mb-2 h-5 w-5 text-indigo-600" />
            <p className="text-xs text-gray-500">Beds</p>
            <h4 className="font-semibold">
              {property.features?.bedrooms ?? 0}
            </h4>
          </div>

          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <Bath className="mx-auto mb-2 h-5 w-5 text-blue-600" />
            <p className="text-xs text-gray-500">Baths</p>
            <h4 className="font-semibold">
              {property.features?.bathrooms ?? 0}
            </h4>
          </div>

          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <Building2 className="mx-auto mb-2 h-5 w-5 text-amber-600" />
            <p className="text-xs text-gray-500">Floors</p>
            <h4 className="font-semibold">
              {property.features?.floors ?? 0}
            </h4>
          </div>

          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <Home className="mx-auto mb-2 h-5 w-5 text-green-600" />
            <p className="text-xs text-gray-500">Size</p>
            <h4 className="font-semibold">
              {property.features?.size}{" "}
              {property.features?.size_unit}
            </h4>
          </div>

        </div>

        {/* Analytics */}
        <div className="grid grid-cols-3 gap-4">

          <div className="rounded-lg bg-blue-50 p-3 text-center">
            <Eye className="mx-auto mb-2 h-5 w-5 text-blue-600" />
            <h4 className="text-xl font-bold">
              {(analytics.views_count || 0).toLocaleString()}
            </h4>
            <p className="text-xs text-gray-500">
              Views
            </p>
          </div>

          <div className="rounded-lg bg-pink-50 p-3 text-center">
            <Heart className="mx-auto mb-2 h-5 w-5 text-pink-600" />
            <h4 className="text-xl font-bold">
              {(analytics.favorites_count || 0).toLocaleString()}
            </h4>
            <p className="text-xs text-gray-500">
              Favorites
            </p>
          </div>

          <div className="rounded-lg bg-yellow-50 p-3 text-center">
            <Star className="mx-auto mb-2 h-5 w-5 text-yellow-500" />
            <h4 className="text-xl font-bold">
              {analytics.average_rating || 0}
            </h4>
            <p className="text-xs text-gray-500">
              Rating
            </p>
          </div>

        </div>

        {/* Occupancy */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Occupancy
            </span>

            <span className="text-sm font-semibold text-indigo-600">
              {occupancy}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{
                width: `${occupancy}%`,
              }}
            />
          </div>

          <div className="mt-3 flex justify-between text-xs text-gray-500">
            <span>
              Occupied: {analytics.occupied_units_count || 0}
            </span>

            <span>
              Vacant: {analytics.vacant_units_count || 0}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-4">

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-4 w-4" />
            {analytics.snapshot_date
              ? new Date(
                  analytics.snapshot_date
                ).toLocaleDateString()
              : "-"}
          </div>

          <div className="flex gap-2">

            {property.location?.map_url && (
              <a
                href={property.location.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Map
              </a>
            )}

            <button
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <ExternalLink className="h-4 w-4" />
              Details
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default PropertyAnalyticsCard;