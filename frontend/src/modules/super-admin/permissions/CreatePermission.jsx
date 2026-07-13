import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import api from "../../../api/axios";

import { addNotification } from "../../../store/uiSlice";

const CreatePermission = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | CURRENT USER
  |--------------------------------------------------------------------------
  */
  const user = useSelector((state) => state.auth?.user);

  const roles = user?.roles || [];
  const permissions = user?.permissions || [];

  /*
  |--------------------------------------------------------------------------
  | SUPER ADMIN CHECK
  |--------------------------------------------------------------------------
  */
  const isSuperAdmin =
    roles.includes("super-admin") ||
    roles?.some((r) => r?.name === "super-admin");

  const canCreatePermissions =
    isSuperAdmin ||
    permissions?.includes?.("create permissions") ||
    permissions?.some?.((p) =>
      typeof p === "string"
        ? p === "create permissions"
        : p?.name === "create permissions"
    );

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      await api.post("/rbac/permissions", {
        name,
      });

      dispatch(
        addNotification({
          type: "success",
          message: "Permission created successfully 🎉",
        })
      );

      navigate("/super-admin/permissions", { replace: true });
    } catch (err) {
      console.error(err);

      const message =
        err?.response?.data?.message ||
        "Failed to create permission";

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
  | NO ACCESS
  |--------------------------------------------------------------------------
  */
  if (!canCreatePermissions) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="p-4 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg">
          You do not have permission to create permissions.
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      <div className="bg-white shadow-md rounded-lg overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b">

          <h4 className="text-xl font-semibold text-gray-800">
            Create Permission
          </h4>

          <Link
            to="/super-admin/permissions"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back
          </Link>

        </div>

        {/* BODY */}
        <div className="p-6">

          {/* ERROR */}
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-100 border border-red-300 text-red-700">
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Permission Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. view users"
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                required
                disabled={loading}
              />
            </div>

            {/* BUTTON */}
            <div className="flex justify-end">

              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-2 text-white rounded-lg transition ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Saving..." : "Save Permission"}
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
};

export default CreatePermission;