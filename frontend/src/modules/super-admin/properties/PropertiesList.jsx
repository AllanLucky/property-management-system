import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import useProperty from "../../../hooks/useProperties";

import {
  Loader2,
  RefreshCcw,
  Plus,
  Eye,
  Pencil,
  Trash2,
  MapPin,
  Building2,
  Home,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";

const PropertyList = () => {
  const {
    properties,
    loading,
    error,
    getProperties,
    removeProperty,
  } = useProperty();

  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD PROPERTIES
  |--------------------------------------------------------------------------
  */

  const loadProperties = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }

      await getProperties({
        with_relations: true,
        _t: Date.now(),
      });
    } finally {
      setRefreshing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadProperties();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | DELETE PROPERTY
  |--------------------------------------------------------------------------
  */

  const deleteProperty = async (id) => {
    if (!window.confirm("Delete this property?")) return;

    try {
      setDeletingId(id);

      await removeProperty(id);

      await loadProperties();
    } finally {
      setDeletingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */

  const getTitle = (property) =>
    property?.title || "Untitled Property";

  const getImage = (property) =>
    property?.media?.thumbnail_url ||
    property?.media?.image_url ||
    "https://placehold.co/120x120";

  const getLocation = (property) => {
    const location = property?.location;

    return (
      location?.full_location ||
      [
        location?.area_name,
        location?.city_name,
        location?.county_name,
        location?.region_name,
        location?.country_name,
      ]
        .filter(Boolean)
        .join(", ") ||
      location?.street_address ||
      "No location"
    );
  };

  const getTotalUnits = (property) =>
    property?.stats?.total_units ?? 0;

  const getOccupied = (property) =>
    property?.stats?.occupied_units ?? 0;

  const getVacant = (property) =>
    property?.stats?.vacant_units ?? 0;

  const getOccupancy = (property) => {
    const total = getTotalUnits(property);

    if (!total) return 0;

    return Math.round(
      (getOccupied(property) / total) * 100
    );
  };

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const filteredProperties = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return properties;

    return properties.filter((property) => {
      return (
        getTitle(property)
          .toLowerCase()
          .includes(query) ||
        getLocation(property)
          .toLowerCase()
          .includes(query) ||
        (property?.property_code || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [properties, search]);

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD
  |--------------------------------------------------------------------------
  */

  const dashboard = useMemo(() => {
    return properties.reduce(
      (accumulator, property) => {
        accumulator.totalProperties += 1;
        accumulator.totalUnits +=
          getTotalUnits(property);
        accumulator.occupied +=
          getOccupied(property);
        accumulator.vacant +=
          getVacant(property);

        return accumulator;
      },
      {
        totalProperties: 0,
        totalUnits: 0,
        occupied: 0,
        vacant: 0,
      }
    );
  }, [properties]);
  /*
|--------------------------------------------------------------------------
| LOADING STATE
|--------------------------------------------------------------------------
*/

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />

        <p className="mt-4 text-sm text-gray-500">
          Loading properties...
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="rounded-xl border bg-white shadow">

      {/* Error */}
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 border-b p-6 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Properties
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage estates, apartments and rental properties.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            type="button"
            onClick={() => loadProperties(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}

            Refresh
          </button>

          <Link
            to="/super-admin/properties/create"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />

            Add Property
          </Link>

        </div>

      </div>

      {/* Dashboard */}
      <div className="grid grid-cols-1 gap-4 border-b p-6 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Properties"
          value={dashboard.totalProperties}
          icon={<Building2 className="h-6 w-6" />}
        />

        <StatCard
          title="Total Units"
          value={dashboard.totalUnits}
          icon={<Home className="h-6 w-6" />}
        />

        <StatCard
          title="Occupied Units"
          value={dashboard.occupied}
          color="text-green-600"
          icon={<BadgeCheck className="h-6 w-6" />}
        />

        <StatCard
          title="Vacant Units"
          value={dashboard.vacant}
          color="text-red-600"
          icon={<AlertTriangle className="h-6 w-6" />}
        />

      </div>

      {/* Search */}
      <div className="border-b p-6">

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by property name, code or location..."
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

      </div>

      {/* Table */}
      <div className="overflow-x-auto">

        <table className="min-w-full text-sm">

          <thead className="bg-gray-100">

            <tr>

              <th className="px-4 py-3 text-left font-semibold">
                Property
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Code
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Units
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Occupied
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Vacant
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Occupancy
              </th>

              <th className="px-4 py-3 text-center font-semibold">
                Status
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property) => (
                <tr
                  key={property.id}
                  className="border-t transition-colors hover:bg-gray-50"
                >
                  {/* Property */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={getImage(property)}
                        alt={getTitle(property)}
                        className="h-14 w-14 rounded-lg border object-cover"
                      />

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getTitle(property)}
                        </h3>

                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{getLocation(property)}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Property Code */}
                  <td className="px-4 py-4 text-center">
                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {property?.property_code || "—"}
                    </span>
                  </td>

                  {/* Units */}
                  <td className="px-4 py-4 text-center font-medium">
                    {getTotalUnits(property)}
                  </td>

                  {/* Occupied */}
                  <td className="px-4 py-4 text-center font-medium text-green-600">
                    {getOccupied(property)}
                  </td>

                  {/* Vacant */}
                  <td className="px-4 py-4 text-center font-medium text-red-600">
                    {getVacant(property)}
                  </td>

                  {/* Occupancy */}
                  <td className="px-4 py-4 text-center">
                    <div className="mx-auto w-24">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{
                            width: `${getOccupancy(property)}%`,
                          }}
                        />
                      </div>

                      <span className="mt-1 block text-xs text-gray-600">
                        {getOccupancy(property)}%
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${property.status === "published"
                        ? "bg-green-100 text-green-700"
                        : property.status === "draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : property.status === "archived"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {property.status || "Draft"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/super-admin/properties/${property.id}`}
                        className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                        title="View Property"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>

                      <Link
                        to={`/super-admin/properties/edit/${property.id}`}
                        className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50"
                        title="Edit Property"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => deleteProperty(property.id)}
                        disabled={deletingId === property.id}
                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Delete Property"
                      >
                        {deletingId === property.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center">

                    <Building2 className="mb-4 h-14 w-14 text-gray-300" />

                    <h3 className="text-lg font-semibold text-gray-700">
                      No properties found
                    </h3>

                    <p className="mt-2 max-w-md text-sm text-gray-500">
                      No properties match your current search.
                      Try another keyword or create a new property.
                    </p>

                    <Link
                      to="/super-admin/properties/create"
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Property
                    </Link>

                  </div>
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
};

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

const StatCard = ({
  title,
  value,
  icon,
  color = "text-gray-900",
}) => {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md">

      <div>

        <p className="text-sm font-medium text-gray-500">
          {title}
        </p>

        <h2
          className={`mt-2 text-2xl font-bold ${color}`}
        >
          {value}
        </h2>

      </div>

      <div className="rounded-xl bg-gray-100 p-3 text-gray-500">
        {icon}
      </div>

    </div>
  );
};

export default PropertyList;