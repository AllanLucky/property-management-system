import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/axios";
import Swal from "sweetalert2";
import { getFeatureIcon } from "../../../utils/featureIcons";

import { useDispatch } from "react-redux";
import { addNotification } from "../../../store/uiSlice";
import { AlertTriangle, BadgeCheck, Eye, LayoutList, Loader2, Pencil, Plus, RefreshCw, Star, Trash2 } from "lucide-react";

const PropertyFeatureList = () => {
  const dispatch = useDispatch();

  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");

  /*
  |--------------------------------------------------------------------------
  | EXTRACT SAFE DATA
  |--------------------------------------------------------------------------
  */
  const extractData = (res) => res?.data?.data ?? res?.data ?? [];

  /*
  |--------------------------------------------------------------------------
  | FETCH FEATURES
  |--------------------------------------------------------------------------
  */
  const getPropertyFeatures = useCallback(async (mode = "initial") => {
    try {
      setError(null);
      mode === "refresh" ? setRefreshing(true) : setLoading(true);

      const response = await api.get(
        `/property-features?_t=${Date.now()}`
      );

      const data = extractData(response);

      setFeatures(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Failed to load property features.";

      setError(message);

      dispatch(addNotification({ type: "error", message }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    getPropertyFeatures();
  }, [getPropertyFeatures]);

  /*
  |--------------------------------------------------------------------------
  | DELETE FEATURE (SWAL CONFIRM)
  |--------------------------------------------------------------------------
  */
  const deleteFeature = async (id) => {
    const result = await Swal.fire({
      title: "Delete Feature?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(id);

      await api.delete(`/property-features/${id}`);

      setFeatures((prev) => prev.filter((f) => f.id !== id));

      dispatch(
        addNotification({
          type: "success",
          message: "Feature deleted successfully",
        })
      );
    } catch (err) {
      const message =
        err?.response?.data?.message || "Delete failed.";

      setError(message);

      dispatch(addNotification({ type: "error", message }));
    } finally {
      setDeletingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER
  |--------------------------------------------------------------------------
  */
  const filteredFeatures = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return features;

    return features.filter((f) =>
      `${f?.name} ${f?.slug} ${f?.value}`
        .toLowerCase()
        .includes(q)
    );
  }, [features, search]);

  /*
  |--------------------------------------------------------------------------
  | STATS
  |--------------------------------------------------------------------------
  */
  const stats = useMemo(() => {
    return features.reduce(
      (acc, f) => {
        acc.total += 1;
        acc.active += f.is_active ? 1 : 0;
        acc.highlighted += f.is_highlighted ? 1 : 0;
        return acc;
      },
      { total: 0, active: 0, highlighted: 0 }
    );
  }, [features]);

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 mt-3">
          Loading property features...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow border">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 p-5 border-b">

        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <LayoutList className="w-5 h-5 text-blue-600" />
            Property Features
          </h1>
          <p className="text-sm text-gray-500">
            Manage property attributes like bedrooms, bathrooms, size, etc.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => getPropertyFeatures("refresh")}
            className="flex items-center gap-2 px-3 py-2 border rounded-xl"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <Link
            to="/super-admin/property-features/create"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl"
          >
            <Plus size={16} />
            Add Feature
          </Link>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-5 border-b">
        <Stat title="Total" value={stats.total} icon={<LayoutList />} />
        <Stat title="Active" value={stats.active} icon={<BadgeCheck />} color="text-green-600" />
        <Stat title="Highlighted" value={stats.highlighted} icon={<Star />} color="text-yellow-600" />
      </div>

      {/* SEARCH */}
      <div className="p-5 border-b">
        <div className="relative">
          <search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search features..."
            className="w-full border rounded-xl pl-10 pr-4 py-2"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">

          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Feature</th>
              <th className="text-center">Type</th>
              <th className="text-center">Status</th>
              <th className="text-center">Highlight</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredFeatures.length ? (
              filteredFeatures.map((f) => {
                const Icon = getFeatureIcon(f.icon);

                return (
                  <tr key={f.id} className="border-t hover:bg-gray-50">

                    {/* Feature with icon */}
                    <td className="p-3">
                      <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>

                        <div>
                          <p className="font-medium">
                            {f.name}
                          </p>

                          <p className="text-xs text-gray-500">
                            {f.description}
                          </p>
                        </div>

                      </div>
                    </td>

                    {/* Type */}
                    <td className="text-center text-gray-500">
                      {f.type}
                    </td>

                    {/* Status */}
                    <td className="text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded ${f.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-700"
                          }`}
                      >
                        {f.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Highlight */}
                    <td className="text-center">
                      {f.is_highlighted ? "⭐ Yes" : "No"}
                    </td>

                    {/* Actions */}
                    <td className="text-right p-3">
                      <div className="flex justify-end gap-2">

                        <Link
                          to={`/super-admin/property-features/${f.id}`}
                          className="text-blue-600"
                        >
                          <Eye size={16} />
                        </Link>

                        <Link
                          to={`/super-admin/property-features/edit/${f.id}`}
                          className="text-orange-600"
                        >
                          <Pencil size={16} />
                        </Link>

                        <button
                          onClick={() => deleteFeature(f.id)}
                          className="text-red-600"
                        >
                          {deletingId === f.id ? (
                            <Loader2
                              className="animate-spin"
                              size={16}
                            />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="text-center p-10 text-gray-500">
                  No property features found
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
| STAT COMPONENT
|--------------------------------------------------------------------------
*/
const Stat = ({ title, value, icon, color = "text-gray-900" }) => (
  <div className="bg-gray-50 p-3 rounded-xl flex justify-between items-center">
    <div>
      <p className="text-xs text-gray-500">{title}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
    <div className="text-gray-400">{icon}</div>
  </div>
);

export default PropertyFeatureList;