import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/axios";
import { Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { addNotification } from "../../../store/uiSlice";
import Swal from "sweetalert2";

const RolesList = () => {
  const dispatch = useDispatch();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | FETCH ROLES
  |--------------------------------------------------------------------------
  */
  const getRoles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/rbac/roles");

      const data =
        res?.data?.data ||
        res?.data?.roles ||
        res?.data ||
        [];

      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to load roles";

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
  }, [dispatch]);

  useEffect(() => {
    getRoles();
  }, [getRoles]);

  /*
  |--------------------------------------------------------------------------
  | DELETE ROLE (SWEET ALERT)
  |--------------------------------------------------------------------------
  */
  const deleteRole = async (id, roleName) => {
    if (roleName === "super-admin") return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This role will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(id);

      await api.delete(`/rbac/roles/${id}`);

      await Swal.fire({
        title: "Deleted!",
        text: "Role has been deleted successfully.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      dispatch(
        addNotification({
          type: "success",
          message: "Role deleted successfully",
        })
      );

      await getRoles();
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to delete role";

      setError(message);

      await Swal.fire({
        title: "Error!",
        text: message,
        icon: "error",
      });

      dispatch(
        addNotification({
          type: "error",
          message,
        })
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */
  const getPermissionsCount = (role) => {
    return (
      role?.permissions_count ??
      role?.permissions?.length ??
      role?.permission_names?.length ??
      0
    );
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="mt-2 text-sm">Loading roles...</p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          Management Roles
        </h2>

        <Link
          to="/super-admin/roles/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Add Role
        </Link>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">

          <thead className="bg-gray-100 dark:bg-slate-800">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Permissions</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {roles.length ? (
              roles.map((role) => (
                <tr
                  key={role.id}
                  className="border-t hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <td className="p-3">{role.id}</td>

                  <td className="p-3 font-medium">
                    {role.name}
                  </td>

                  <td className="p-3">
                    {getPermissionsCount(role)} permissions
                  </td>

                  <td className="p-3">
                    {role.created_at
                      ? new Date(role.created_at).toLocaleString("en-GB")
                      : "—"}
                  </td>

                  <td className="p-3 text-right space-x-2">

                    <Link
                      to={`/super-admin/roles/${role.id}/permissions`}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Permissions
                    </Link>

                    <Link
                      to={`/super-admin/roles/edit/${role.id}`}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-xs"
                    >
                      Edit
                    </Link>

                    {role.name !== "super-admin" && (
                      <button
                        onClick={() => deleteRole(role.id, role.name)}
                        disabled={deletingId === role.id}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                      >
                        {deletingId === role.id ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Deleting...
                          </span>
                        ) : (
                          "Delete"
                        )}
                      </button>
                    )}

                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  No roles found
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

    </div>
  );
};

export default RolesList;