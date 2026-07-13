import { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import {
  fetchActivities,
  deleteActivity,
} from "../../../store/userActivitySlice";

import {
  Loader2,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Activity,
  AlertTriangle,
} from "lucide-react";

import Swal from "sweetalert2";
import { addNotification } from "../../../store/uiSlice";

/*
|--------------------------------------------------------------------------
| USER ACTIVITY LIST (PROFESSIONAL ADMIN UI)
|--------------------------------------------------------------------------
*/
export default function UserActivityList() {
  const dispatch = useDispatch();

  const { activities, loading, pagination } = useSelector(
    (state) => state.userActivity
  );

  const [filters, setFilters] = useState({
    page: 1,
    per_page: 15,
    action: "",
    user_id: "",
  });

  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | FETCH DATA
  |--------------------------------------------------------------------------
  */
  const loadActivities = useCallback(
    async (mode = "initial") => {
      try {
        mode === "refresh" ? setRefreshing(true) : setError(null);

        await dispatch(fetchActivities(filters)).unwrap();
      } catch (err) {
        setError(err?.message || "Failed to load activities");

        dispatch(
          addNotification({
            type: "error",
            message: "Failed to load activities",
          })
        );
      } finally {
        setRefreshing(false);
      }
    },
    [dispatch, filters]
  );

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Activity?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      setActionLoadingId(id);

      await dispatch(deleteActivity(id)).unwrap();

      dispatch(
        addNotification({
          type: "success",
          message: "Activity deleted",
        })
      );

      loadActivities("refresh");
    } catch (err) {
      dispatch(
        addNotification({
          type: "error",
          message: "Failed to delete activity",
        })
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER HANDLER
  |--------------------------------------------------------------------------
  */
  const handleChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      page: 1,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */
  const nextPage = () => {
    if (pagination?.current_page < pagination?.last_page) {
      setFilters((p) => ({ ...p, page: p.page + 1 }));
    }
  };

  const prevPage = () => {
    if (filters.page > 1) {
      setFilters((p) => ({ ...p, page: p.page - 1 }));
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SEARCH FILTER
  |--------------------------------------------------------------------------
  */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return activities;

    return (activities || []).filter((a) =>
      `${a.action ?? ""} ${a.description ?? ""} ${a.user?.name ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [activities, search]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */
  if (loading && !activities?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="mt-2 text-sm">Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow border">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4 p-5 border-b">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Activity Logs
          </h2>
          <p className="text-sm text-gray-500">
            Monitor system actions and user behavior
          </p>
        </div>

        <button
          onClick={() => loadActivities("refresh")}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* SEARCH */}
      <div className="p-5 border-b">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities..."
            className="w-full border rounded-xl pl-10 pr-4 py-2"
          />
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="m-4 p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">User</th>
              <th className="p-4">Action</th>
              <th className="p-4">Description</th>
              <th className="p-4">IP</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered?.length ? (
              filtered.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium">#{item.id}</td>

                  <td className="p-4">
                    <p className="font-medium">
                      {item.user?.name || "System"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.user?.email || "—"}
                    </p>
                  </td>

                  <td className="p-4 text-blue-600 font-medium">
                    {item.action}
                  </td>

                  <td className="p-4 text-gray-600">
                    {item.description || "-"}
                  </td>

                  <td className="p-4 text-gray-500">
                    {item.ip_address || "-"}
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/super-admin/activities/${item.id}`}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Link>

                      <button
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs flex items-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-10 text-center text-gray-500">
                  No activities found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center p-4 border-t">
        <button onClick={prevPage} className="px-4 py-2 bg-gray-200 rounded">
          Previous
        </button>

        <span className="text-sm">
          Page {pagination?.current_page || 1}
        </span>

        <button onClick={nextPage} className="px-4 py-2 bg-gray-200 rounded">
          Next
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| STAT COMPONENT (OPTIONAL CLEAN UI)
|--------------------------------------------------------------------------
*/
const Stat = ({ label, value }) => (
  <div className="p-3 rounded-xl bg-gray-50">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-bold text-lg">{value}</p>
  </div>
);