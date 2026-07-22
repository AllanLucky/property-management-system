import {
  Eye,
  Heart,
  Star,
  MapPin,
  ExternalLink,
} from "lucide-react";

const PropertyAnalyticsTable = ({ analytics = [] }) => {
  if (!analytics.length) {
    return (
      <div className="py-12 text-center text-gray-500">
        No property analytics available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">

        {/* Header */}
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Property
            </th>

            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
              Views
            </th>

            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
              Favorites
            </th>

            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
              Rating
            </th>

            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
              Occupancy
            </th>

            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
              Price
            </th>

            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
              Status
            </th>

            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-gray-200 bg-white">
          {analytics.map((item) => {
            const property = item.property || {};

            const image =
              property.media?.thumbnail_url ||
              property.media?.image_url ||
              "https://via.placeholder.com/80x80?text=No+Image";

            const occupied =
              item.occupied_units_count || 0;

            const vacant =
              item.vacant_units_count || 0;

            const totalUnits = occupied + vacant;

            const occupancy =
              totalUnits > 0
                ? Math.round((occupied / totalUnits) * 100)
                : 0;

            return (
              <tr
                key={item.id}
                className="transition hover:bg-gray-50"
              >
                {/* Property */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">

                    <img
                      src={image}
                      alt={property.title}
                      className="h-16 w-16 rounded-lg object-cover"
                    />

                    <div>

                      <h3 className="font-semibold text-gray-900">
                        {property.title}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {property.property_code}
                      </p>

                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {property.location?.full_location ||
                          property.location?.street_address ||
                          "-"}
                      </div>

                    </div>

                  </div>
                </td>

                {/* Views */}
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center gap-1 font-semibold">
                    <Eye className="h-4 w-4 text-blue-600" />
                    {(item.views_count || 0).toLocaleString()}
                  </div>
                </td>

                {/* Favorites */}
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center gap-1 font-semibold">
                    <Heart className="h-4 w-4 text-pink-600" />
                    {(item.favorites_count || 0).toLocaleString()}
                  </div>
                </td>

                {/* Rating */}
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center gap-1 font-semibold">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {item.average_rating || "0"}
                  </div>
                </td>

                {/* Occupancy */}
                <td className="px-6 py-4">

                  <div className="flex items-center gap-3">

                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{
                          width: `${occupancy}%`,
                        }}
                      />
                    </div>

                    <span className="text-sm font-semibold">
                      {occupancy}%
                    </span>

                  </div>

                  <div className="mt-2 text-center text-xs text-gray-500">
                    {occupied} Occupied • {vacant} Vacant
                  </div>

                </td>

                {/* Price */}
                <td className="px-6 py-4 text-center">

                  <div className="font-semibold text-gray-900">
                    {property.pricing?.formatted_price || "-"}
                  </div>

                  {property.pricing?.monthly_rent && (
                    <div className="text-xs text-gray-500">
                      Rent: KES{" "}
                      {Number(
                        property.pricing.monthly_rent
                      ).toLocaleString()}
                    </div>
                  )}

                </td>

                {/* Status */}
                <td className="px-6 py-4 text-center">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      property.status === "published"
                        ? "bg-green-100 text-green-700"
                        : property.status === "draft"
                        ? "bg-yellow-100 text-yellow-700"
                        : property.status === "pending"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {property.status || "-"}
                  </span>

                </td>

                {/* Actions */}
                <td className="px-6 py-4">

                  <div className="flex justify-end gap-2">

                    {property.location?.map_url && (
                      <a
                        href={property.location.map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition hover:bg-gray-100"
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

                </td>

              </tr>
            );
          })}
        </tbody>

      </table>
    </div>
  );
};

export default PropertyAnalyticsTable;