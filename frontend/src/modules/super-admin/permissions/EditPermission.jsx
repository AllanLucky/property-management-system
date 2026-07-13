import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../../api/axios";
import { Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { addNotification } from "../../../store/uiSlice";

const EditPermission = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [permission, setPermission] = useState(null);
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | LOAD PERMISSION
  |--------------------------------------------------------------------------
  */
  const getPermission = async () => {
    setFetching(true);
    setError(null);

    try {
      const res = await api.get(`/rbac/permissions/${id}`);

      const data = res.data?.data || res.data;

      setPermission(data);
      setName(data?.name || "");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Failed to load permission"
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    getPermission();
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | UPDATE PERMISSION
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await api.put(`/rbac/permissions/${id}`, {
        name,
      });

      dispatch(
        addNotification({
          type: "success",
          message: "Permission updated successfully 🎉",
        })
      );

      navigate("/super-admin/permissions", { replace: true });
    } catch (err) {
      console.error(err);

      const message =
        err?.response?.data?.message ||
        "Failed to update permission";

      setError(message);

      dispatch(
        addNotification({
          type: "error",
          message,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */
  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
        <p>Loading permission...</p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">

          <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
            Edit Permission
          </h4>

          <Link
            to="/super-admin/permissions"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Back
          </Link>

        </div>

        {/* BODY */}
        <div className="p-6">

          {/* ERROR */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* NAME */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Permission Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. users.edit"
                disabled={loading}
                className="mt-1 w-full rounded-lg border-gray-300 shadow-sm 
                           focus:border-blue-500 focus:ring-blue-500 p-2"
                required
              />

              <p className="text-xs text-gray-500 mt-1">
                Use format: module.action (e.g. users.create)
              </p>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end space-x-3">

              <Link
                to="/super-admin/permissions"
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-2 text-white rounded-lg transition flex items-center gap-2 ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {loading ? "Updating..." : "Update Permission"}
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
};

export default EditPermission;