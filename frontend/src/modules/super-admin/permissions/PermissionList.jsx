import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/axios";
import { Loader2 } from "lucide-react";
import Swal from "sweetalert2";

const PermissionList = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | FETCH PERMISSIONS
  |--------------------------------------------------------------------------
  */
  const getPermissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/rbac/permissions");
      setPermissions(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Failed to load permissions"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE PERMISSION (SWEETALERT)
  |--------------------------------------------------------------------------
  */
  const deletePermission = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This permission will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
       cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/rbac/permissions/${id}`);

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Permission has been deleted.",
        timer: 1500,
        showConfirmButton: false,
      });

      getPermissions();
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || "Failed to delete permission",
      });
    }
  };

  useEffect(() => {
    getPermissions();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
          Management Permissions
        </h4>

        <Link
          to="/super-admin/permissions/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Add Permission
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

        {/* LOADING */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500">
              Loading permissions...
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 dark:border-slate-700 rounded-lg">

              <thead className="bg-gray-100 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Permission Name
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">

                {permissions.length ? (
                  permissions.map((permission) => (
                    <tr
                      key={permission.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {permission.id}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white">
                        {permission.name}
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">

                        <Link
                          to={`/super-admin/permissions/edit/${permission.id}`}
                          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs transition"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => deletePermission(permission.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs transition"
                        >
                          Delete
                        </button>

                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-6 py-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      No permissions found.
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default PermissionList;