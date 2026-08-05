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
  Layers3,
  TrendingUp,
} from "lucide-react";

const PropertyList = () => {
  const {
    properties = [],
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
    } catch (err) {
      console.error("Failed to load properties:", err);
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (err) {
      console.error("Delete failed:", err);
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
    property?.title ||
    property?.name ||
    "Untitled Property";

  const getImage = (property) =>
    property?.thumbnail ||
    property?.thumbnail_url ||
    property?.media?.thumbnail_url ||
    property?.media?.image_url ||
    "https://placehold.co/120x120";

  const getLocation = (property) => {
    const location = property?.location;

    if (!location) return "No location";

    return (
      location.full_location ||
      [
        location.area_name,
        location.city_name,
        location.county_name,
        location.region_name,
        location.country_name,
      ]
        .filter(Boolean)
        .join(", ") ||
      location.street_address ||
      "No location"
    );
  };

  const getApartments = (property) =>
    property?.counts?.apartments ??
    property?.stats?.apartments ??
    property?.apartments_count ??
    property?.apartments?.length ??
    0;

  const getTotalUnits = (property) =>
    property?.stats?.total_units ??
    property?.total_units ??
    property?.units_count ??
    0;

  const getOccupied = (property) =>
    property?.stats?.occupied_units ??
    property?.occupied_units ??
    0;

  const getVacant = (property) =>
    property?.stats?.vacant_units ??
    property?.vacant_units ??
    0;

  const getOccupancy = (property) => {
    const total = getTotalUnits(property);

    if (!total) return 0;

    return Math.round((getOccupied(property) / total) * 100);
  };

  const getStatus = (property) => {
    if (!property?.status) {
      return {
        value: "draft",
        label: "Draft",
      };
    }

    if (typeof property.status === "string") {
      return {
        value: property.status,
        label: property.status,
      };
    }

    return {
      value: property.status.value || "draft",
      label: property.status.label || "Draft",
    };
  };

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString();

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return properties;

    return properties.filter((property) => {
      return (
        getTitle(property).toLowerCase().includes(query) ||
        getLocation(property).toLowerCase().includes(query) ||
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
        accumulator.totalApartments += getApartments(property);
        accumulator.totalUnits += getTotalUnits(property);
        accumulator.occupied += getOccupied(property);
        accumulator.vacant += getVacant(property);

        return accumulator;
      },
      {
        totalProperties: 0,
        totalApartments: 0,
        totalUnits: 0,
        occupied: 0,
        vacant: 0,
      }
    );
  }, [properties]);

  const portfolioOccupancy = useMemo(() => {
    if (!dashboard.totalUnits) return 0;

    return Math.round(
      (dashboard.occupied / dashboard.totalUnits) * 100
    );
  }, [dashboard]);

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
    <div className="rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">

      {/* Error */}
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-5 border-b bg-white p-6 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Property Portfolio
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage estates, apartment buildings and rental properties from one
            dashboard.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            type="button"
            onClick={() => loadProperties(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:opacity-60"
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
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Property
          </Link>

        </div>

      </div>

      {/* Dashboard */}

      <div className="grid grid-cols-1 gap-5 border-b bg-white p-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">

        <StatCard
          title="Properties"
          value={formatNumber(dashboard.totalProperties)}
          subtitle="Portfolio"
          color="blue"
          icon={<Building2 className="h-6 w-6" />}
        />

        <StatCard
          title="Apartments"
          value={formatNumber(dashboard.totalApartments)}
          subtitle="Buildings"
          color="indigo"
          icon={<Layers3 className="h-6 w-6" />}
        />

        <StatCard
          title="Total Units"
          value={formatNumber(dashboard.totalUnits)}
          subtitle="Rentable Units"
          color="slate"
          icon={<Home className="h-6 w-6" />}
        />

        <StatCard
          title="Occupied Units"
          value={formatNumber(dashboard.occupied)}
          subtitle="Currently Occupied"
          color="green"
          icon={<BadgeCheck className="h-6 w-6" />}
        />

        <StatCard
          title="Vacant Units"
          value={formatNumber(dashboard.vacant)}
          subtitle="Available to Rent"
          color="amber"
          icon={<AlertTriangle className="h-6 w-6" />}
        />

        <StatCard
          title="Occupancy Rate"
          value={`${portfolioOccupancy}%`}
          subtitle={`${formatNumber(
            dashboard.occupied
          )} of ${formatNumber(dashboard.totalUnits)} Units`}
          color="emerald"
          progress={portfolioOccupancy}
          icon={<TrendingUp className="h-6 w-6" />}
        />

      </div>

      {/* Search */}

      <div className="border-b bg-white p-6">

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by property name, property code or location..."
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

      </div>

      {/* Properties Table */}

      <div className="overflow-x-auto">

        <table className="min-w-full text-sm">

          <thead className="bg-gray-100">

            <tr>

              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Property
              </th>

              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Code
              </th>

              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Apartments
              </th>

              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Units
              </th>

              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Occupied
              </th>

              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Vacant
              </th>

              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Occupancy
              </th>

              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Status
              </th>

              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property) => {
                const status = getStatus(property);

                return (
                  <tr
                    key={property.id}
                    className="border-t transition hover:bg-gray-50"
                  >
                    {/* Property */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImage(property)}
                          alt={getTitle(property)}
                          className="h-16 w-16 rounded-xl border border-gray-200 object-cover"
                        />

                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-gray-900">
                            {getTitle(property)}
                          </h3>

                          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />

                            <span className="truncate">
                              {getLocation(property)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Property Code */}
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {property?.property_code || "—"}
                      </span>
                    </td>

                    {/* Apartments */}
                    <td className="px-4 py-4 text-center font-semibold text-gray-900">
                      {formatNumber(getApartments(property))}
                    </td>

                    {/* Units */}
                    <td className="px-4 py-4 text-center font-semibold text-gray-900">
                      {formatNumber(getTotalUnits(property))}
                    </td>

                    {/* Occupied */}
                    <td className="px-4 py-4 text-center font-semibold text-green-600">
                      {formatNumber(getOccupied(property))}
                    </td>

                    {/* Vacant */}
                    <td className="px-4 py-4 text-center font-semibold text-amber-600">
                      {formatNumber(getVacant(property))}
                    </td>

                    {/* Occupancy */}
                    <td className="px-4 py-4 text-center">
                      <div className="mx-auto w-28">
                        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full transition-all ${getOccupancy(property) >= 90
                              ? "bg-green-600"
                              : getOccupancy(property) >= 70
                                ? "bg-blue-600"
                                : getOccupancy(property) >= 50
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                            style={{
                              width: `${Math.min(
                                getOccupancy(property),
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        <span className="mt-2 block text-xs font-medium text-gray-600">
                          {getOccupancy(property)}%
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.value === "active"
                          ? "bg-green-100 text-green-700"
                          : status.value === "inactive"
                            ? "bg-red-100 text-red-700"
                            : status.value === "maintenance"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
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
                        {status.label}
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
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={9}
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
| PROFESSIONAL KPI CARD
|--------------------------------------------------------------------------
*/

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
  progress,
}) => {
  const styles = {
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      bar: "bg-blue-600",
      border: "border-blue-100",
    },

    green: {
      bg: "bg-green-50",
      icon: "text-green-600",
      bar: "bg-green-600",
      border: "border-green-100",
    },

    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      bar: "bg-amber-500",
      border: "border-amber-100",
    },

    emerald: {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
      bar: "bg-emerald-600",
      border: "border-emerald-100",
    },

    indigo: {
      bg: "bg-indigo-50",
      icon: "text-indigo-600",
      bar: "bg-indigo-600",
      border: "border-indigo-100",
    },

    slate: {
      bg: "bg-slate-50",
      icon: "text-slate-600",
      bar: "bg-slate-600",
      border: "border-slate-100",
    },
  };

  const theme = styles[color] || styles.blue;

  return (
    <div
      className={`rounded-2xl border ${theme.border} bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
    >
      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {value}
          </h2>

          {subtitle && (
            <p className="mt-2 text-xs text-gray-500">
              {subtitle}
            </p>
          )}

        </div>

        <div
          className={`rounded-xl ${theme.bg} p-3 ${theme.icon}`}
        >
          {icon}
        </div>

      </div>

      {typeof progress === "number" && (
        <div className="mt-5">

          <div className="mb-2 flex items-center justify-between">

            <span className="text-xs font-medium text-gray-500">
              Portfolio Health
            </span>

            <span className="text-xs font-semibold text-gray-700">
              {progress}%
            </span>

          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-200">

            <div
              className={`${theme.bar} h-full rounded-full transition-all duration-500`}
              style={{
                width: `${Math.min(progress, 100)}%`,
              }}
            />

          </div>

        </div>
      )}

    </div>
  );
};

export default PropertyList;