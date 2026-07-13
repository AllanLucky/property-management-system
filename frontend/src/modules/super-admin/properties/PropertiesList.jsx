import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/axios";

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
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");

  const getProperties = async (isRefresh = false) => {
    try {
      setError(null);
      isRefresh ? setRefreshing(true) : setLoading(true);

      const response = await api.get(
        `/properties?with_relations=true&_t=${Date.now()}`
      );

      let data = [];

      if (Array.isArray(response?.data?.data)) data = response.data.data;
      else if (Array.isArray(response?.data)) data = response.data;
      else if (Array.isArray(response?.data?.properties))
        data = response.data.properties;

      setProperties(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load properties.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getProperties();
  }, []);

  const deleteProperty = async (id) => {
    if (!window.confirm("Delete this property?")) return;

    try {
      setDeletingId(id);
      await api.delete(`/properties/${id}`);
      setProperties((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err?.response?.data?.message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const getTitle = (p) => p?.title || "Untitled Property";

  const getImage = (p) =>
    p?.media?.thumbnail_url || "https://placehold.co/120x120";

  const getLocation = (p) => {
    const loc = p?.location;

    return (
      loc?.full_location ||
      [loc?.area, loc?.city, loc?.county, loc?.region, loc?.country]
        .filter(Boolean)
        .join(", ") ||
      loc?.street_address ||
      "No location"
    );
  };

  const getTotalUnits = (p) => p?.stats?.total_units ?? 0;
  const getOccupied = (p) => p?.stats?.occupied_units ?? 0;
  const getVacant = (p) => p?.stats?.vacant_units ?? 0;

  const getOccupancy = (p) => {
    const total = getTotalUnits(p);
    if (!total) return 0;
    return Math.round((getOccupied(p) / total) * 100);
  };

  const filteredProperties = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return properties;

    return properties.filter((p) => {
      return (
        getTitle(p).toLowerCase().includes(q) ||
        getLocation(p).toLowerCase().includes(q) ||
        (p?.property_code || "").toLowerCase().includes(q)
      );
    });
  }, [properties, search]);

  const dashboard = useMemo(() => {
    return properties.reduce(
      (acc, p) => {
        acc.totalProperties += 1;
        acc.totalUnits += getTotalUnits(p);
        acc.occupied += getOccupied(p);
        acc.vacant += getVacant(p);
        return acc;
      },
      { totalProperties: 0, totalUnits: 0, occupied: 0, vacant: 0 }
    );
  }, [properties]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 mt-3">Loading properties...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow border">

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border-b">
          {error}
        </div>
      )}

      {/* HEADER */}
      <div className="p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Properties</h1>
          <p className="text-gray-500 text-sm">
            Manage estates, apartments and rentals
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => getProperties(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-xl"
          >
            {refreshing ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <RefreshCcw size={16} />
            )}
            Refresh
          </button>

          <Link
            to="/super-admin/properties/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl"
          >
            <Plus size={16} />
            Add Property
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-t">
        <StatCard title="Total Properties" value={dashboard.totalProperties} icon={<Building2 />} />
        <StatCard title="Total Units" value={dashboard.totalUnits} icon={<Home />} />
        <StatCard title="Occupied" value={dashboard.occupied} icon={<BadgeCheck />} color="text-green-600" />
        <StatCard title="Vacant" value={dashboard.vacant} icon={<AlertTriangle />} color="text-red-600" />
      </div>

      {/* SEARCH */}
      <div className="p-4 border-t">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, code, location..."
          className="w-full border rounded-xl px-4 py-2"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Property</th>
              <th>Code</th> {/* ✅ ADDED COLUMN */}
              <th>Units</th>
              <th>Occupied</th>
              <th>Vacant</th>
              <th>Occupancy</th>
              <th>Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredProperties.length > 0 ? (
              filteredProperties.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">

                  {/* PROPERTY */}
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={getImage(p)}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-semibold">{getTitle(p)}</p>
                        <div className="flex items-center text-xs text-gray-500 gap-1">
                          <MapPin size={12} />
                          {getLocation(p)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* CODE COLUMN */}
                  <td className="text-center text-gray-700 text-sm font-medium">
                    {p?.property_code || "—"}
                  </td>

                  <td className="text-center">{getTotalUnits(p)}</td>
                  <td className="text-center text-green-600">{getOccupied(p)}</td>
                  <td className="text-center text-red-600">{getVacant(p)}</td>
                  <td className="text-center">{getOccupancy(p)}%</td>

                  <td className="text-center">
                    <span className="px-2 py-1 rounded text-xs bg-gray-200">
                      {p.status || "draft"}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="text-right p-3">
                    <div className="flex justify-end gap-2">

                      <Link to={`/super-admin/properties/${p.id}`} className="text-blue-600">
                        <Eye size={16} />
                      </Link>

                      <Link to={`/super-admin/properties/edit/${p.id}`} className="text-orange-600">
                        <Pencil size={16} />
                      </Link>

                      <button onClick={() => deleteProperty(p.id)} className="text-red-600">
                        {deletingId === p.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>

                    </div>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-10 text-gray-500">
                  No properties found
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color = "text-gray-900" }) => (
  <div className="bg-white border rounded-xl p-4 flex justify-between items-center shadow-sm">
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className={`text-xl font-bold ${color}`}>{value}</h2>
    </div>
    <div className="text-gray-400">{icon}</div>
  </div>
);

export default PropertyList;