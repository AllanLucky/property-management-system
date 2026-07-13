import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../../api/axios";
import { Loader2 } from "lucide-react";

const AssignPermissions = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | FETCH ROLE + PERMISSIONS
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      setError(null);

      try {
        const res = await api.get(`/rbac/roles/${id}/permissions`);

        const roleData =
          res.data?.data?.role ||
          res.data?.role;

        const allPermissions =
          res.data?.data?.permissions ||
          res.data?.permissions ||
          [];

        const rolePerms =
          res.data?.data?.rolePermissions ||
          res.data?.rolePermissions ||
          [];

        setRole(roleData);
        setPermissions(allPermissions);
        setSelectedPermissions(rolePerms);
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            "Failed to load role permissions"
        );
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | TOGGLE PERMISSION
  |--------------------------------------------------------------------------
  */
  const togglePermission = (perm) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm)
        ? prev.filter((p) => p !== perm)
        : [...prev, perm]
    );
  };

  /*
  |--------------------------------------------------------------------------
  | SELECT ALL
  |--------------------------------------------------------------------------
  */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPermissions(permissions.map((p) => p.name));
    } else {
      setSelectedPermissions([]);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT (WITH LOADER FIX)
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return; // prevent double click

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post(`/rbac/roles/${id}/permissions`, {
        permissions: selectedPermissions,
      });

      setSuccess("Permissions updated successfully");

      setTimeout(() => {
        navigate("/super-admin/roles");
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Something went wrong while updating permissions"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE (FETCHING)
  |--------------------------------------------------------------------------
  */
  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="mt-2 text-sm">Loading role permissions...</p>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="p-6 text-center text-red-500">
        Role not found.
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

      <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
            Assign Permissions →
            <span className="text-blue-600 ml-2">{role.name}</span>
          </h4>

          <Link
            to="/super-admin/roles"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back
          </Link>
        </div>

        {/* BODY */}
        <div className="p-6">

          {/* SUCCESS */}
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* SELECT ALL */}
            <div className="mb-5">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    permissions.length > 0 &&
                    selectedPermissions.length === permissions.length
                  }
                  disabled={loading}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Select All Permissions
                </span>
              </label>
            </div>

            {/* PERMISSIONS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {permissions.length > 0 ? (
                permissions.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      value={perm.name}
                      checked={selectedPermissions.includes(perm.name)}
                      onChange={() => togglePermission(perm.name)}
                      disabled={loading}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {perm.name}
                    </span>
                  </label>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500">
                  No permissions found.
                </div>
              )}
            </div>

            {/* SUBMIT */}
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Permissions"
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};

export default AssignPermissions;