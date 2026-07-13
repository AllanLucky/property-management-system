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
  XCircle,
  BadgeCheck,
  LayoutList,
} from "lucide-react";

const AmenityList = () => {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [search, setSearch] = useState("");

  /*
  |--------------------------------------------------------------------------
  | FETCH AMENITIES
  |--------------------------------------------------------------------------
  */
  const getAmenities = async (isRefresh = false) => {
    try {
      setError(null);

      isRefresh ? setRefreshing(true) : setLoading(true);

      const response = await api.get(
        `/amenities?_t=${Date.now()}`
      );

      let data = [];

      if (Array.isArray(response?.data?.data)) {
        data = response.data.data;
      } else if (Array.isArray(response?.data)) {
        data = response.data;
      }

      setAmenities(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Failed to load amenities."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getAmenities();
  }, []);


  /*
  |--------------------------------------------------------------------------
  | DELETE AMENITY
  |--------------------------------------------------------------------------
  */
  const deleteAmenity = async (id) => {
    if (!window.confirm("Delete this amenity?")) return;

    try {
      setDeletingId(id);

      await api.delete(`/amenities/${id}`);

      setAmenities((prev) =>
        prev.filter((item) => item.id !== id)
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Delete failed."
      );
    } finally {
      setDeletingId(null);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | TOGGLE STATUS
  |--------------------------------------------------------------------------
  */
  const toggleStatus = async (id) => {
    try {
      setTogglingId(id);

      const res = await api.patch(
        `/amenities/${id}/toggle-status`
      );

      const updated = res?.data?.data;

      setAmenities((prev) =>
        prev.map((amenity) =>
          amenity.id === id
            ? {
                ...amenity,
                is_active: updated?.is_active,
              }
            : amenity
        )
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Status update failed."
      );
    } finally {
      setTogglingId(null);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | SEARCH FILTER
  |--------------------------------------------------------------------------
  */
  const filteredAmenities = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return amenities;

    return amenities.filter((amenity) =>
      amenity?.name?.toLowerCase().includes(q) ||
      amenity?.slug?.toLowerCase().includes(q) ||
      amenity?.icon?.toLowerCase().includes(q) ||
      amenity?.description?.toLowerCase().includes(q)
    );
  }, [amenities, search]);


  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */
  const stats = useMemo(() => {
    return amenities.reduce(
      (acc, amenity) => {
        acc.total += 1;
        acc.active += amenity.is_active ? 1 : 0;
        acc.inactive += amenity.is_active ? 0 : 1;

        return acc;
      },
      {
        total: 0,
        active: 0,
        inactive: 0,
      }
    );
  }, [amenities]);


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />

        <p className="mt-3 text-gray-500">
          Loading amenities...
        </p>
      </div>
    );
  }
    return (
    <div className="bg-white rounded-xl shadow border">

      {/* ERROR MESSAGE */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border-b">
          {error}
        </div>
      )}


      {/* HEADER */}
      <div className="p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Amenities
          </h1>

          <p className="text-sm text-gray-500">
            Manage property amenities available across the system.
          </p>
        </div>


        <div className="flex gap-2">

          <button
            onClick={() => getAmenities(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-xl"
          >
            {refreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCcw size={16} />
            )}

            Refresh
          </button>


          <Link
            to="/super-admin/property-amenities/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl"
          >
            <Plus size={16} />
            Add Amenity
          </Link>

        </div>
      </div>


      {/* STATISTICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-t">

        <StatCard
          title="Total Amenities"
          value={stats.total}
          icon={<LayoutList />}
        />

        <StatCard
          title="Active"
          value={stats.active}
          icon={<BadgeCheck />}
          color="text-green-600"
        />

        <StatCard
          title="Inactive"
          value={stats.inactive}
          icon={<XCircle />}
          color="text-red-600"
        />

      </div>


      {/* SEARCH */}
      <div className="p-4 border-t">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, slug, icon or description..."
          className="w-full border rounded-xl px-4 py-2"
        />
      </div>


      {/* TABLE */}
      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">
                Amenity
              </th>

              <th className="text-center">
                Slug
              </th>

              <th className="text-center">
                Icon
              </th>

              <th className="text-center">
                Color
              </th>

              <th className="text-center">
                Status
              </th>

              <th className="text-center">
                Order
              </th>

              <th className="p-3 text-right">
                Actions
              </th>
            </tr>
          </thead>


          <tbody>

            {filteredAmenities.length > 0 ? (
              filteredAmenities.map((amenity) => (

                <tr
                  key={amenity.id}
                  className="border-t hover:bg-gray-50"
                >

                  {/* NAME & DESCRIPTION */}
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {amenity.name}
                      </span>

                      <span className="text-xs text-gray-400">
                        {amenity.description || "No description"}
                      </span>
                    </div>
                  </td>


                  {/* SLUG */}
                  <td className="text-center text-gray-500">
                    {amenity.slug || "-"}
                  </td>


                  {/* ICON */}
                  <td className="text-center">
                    {amenity.icon || "-"}
                  </td>


                  {/* COLOR */}
                  <td className="text-center">
                    <span
                      className="px-3 py-1 rounded text-white text-xs"
                      style={{
                        backgroundColor: amenity.color || "#6b7280",
                      }}
                    >
                      {amenity.color || "Default"}
                    </span>
                  </td>


                  {/* STATUS TOGGLE */}
                  <td className="text-center">
                    <button
                      onClick={() => toggleStatus(amenity.id)}
                      disabled={togglingId === amenity.id}
                      className={`px-3 py-1 rounded text-xs transition ${
                        amenity.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {togglingId === amenity.id ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                        />
                      ) : amenity.is_active ? (
                        "Active"
                      ) : (
                        "Inactive"
                      )}
                    </button>
                  </td>


                  {/* SORT ORDER */}
                  <td className="text-center">
                    {amenity.sort_order ?? 0}
                  </td>


                  {/* ACTIONS */}
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">

                      <Link
                        to={`/super-admin/property-amenities/${amenity.id}`}
                        className="text-blue-600"
                      >
                        <Eye size={16} />
                      </Link>


                      <Link
                        to={`/super-admin/property-amenities/edit/${amenity.id}`}
                        className="text-orange-600"
                      >
                        <Pencil size={16} />
                      </Link>


                      <button
                        onClick={() => deleteAmenity(amenity.id)}
                        className="text-red-600"
                      >
                        {deletingId === amenity.id ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
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
                <td
                  colSpan="7"
                  className="py-10 text-center text-gray-500"
                >
                  No amenities found
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
| STAT CARD COMPONENT
|--------------------------------------------------------------------------
*/
const StatCard = ({
  title,
  value,
  icon,
  color = "text-gray-900",
}) => (
  <div className="bg-white border rounded-xl p-4 flex justify-between items-center shadow-sm">

    <div>
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h2 className={`text-xl font-bold ${color}`}>
        {value}
      </h2>
    </div>

    <div className="text-gray-400">
      {icon}
    </div>

  </div>
);


export default AmenityList;