import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../../api/axios";
import { useDispatch } from "react-redux";
import { addNotification } from "../../../store/uiSlice";

const CreateRole = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | FETCH PERMISSIONS
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await api.get("/rbac/permissions");

        const data =
          res?.data?.data ||
          res?.data?.permissions ||
          res?.data ||
          [];

        setPermissions(Array.isArray(data) ? data : []);

      } catch (err) {
        console.error(err);

        const message =
          err?.response?.data?.message || "Failed to load permissions";

        setError(message);

        dispatch(
          addNotification({
            type: "error",
            message,
          })
        );
      }
    };

    fetchPermissions();
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | HANDLE CHECKBOX
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
  | SUBMIT
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      await api.post("/rbac/roles", {
        name,
        permissions: selectedPermissions,
      });

      dispatch(
        addNotification({
          type: "success",
          message: "Role created successfully 🎉",
        })
      );

      navigate("/super-admin/roles");

    } catch (err) {
      console.error(err);

      const message =
        err?.response?.data?.message ||
        "Something went wrong while creating role";

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
  | UI
  |--------------------------------------------------------------------------
  */
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow">

      <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h4 className="text-xl font-semibold">
            Create Role
          </h4>

          <Link
            to="/super-admin/roles"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back
          </Link>
        </div>

        <div className="p-6">

          {/* ERROR */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ROLE NAME */}
            <div>
              <label className="block text-sm font-medium">
                Role Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full p-2 border rounded"
                placeholder="e.g. admin"
                required
              />
            </div>

            {/* SELECT ALL */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={
                  permissions.length > 0 &&
                  selectedPermissions.length === permissions.length
                }
              />

              <label className="text-sm">
                Select All Permissions
              </label>
            </div>

            {/* PERMISSIONS */}
            <div>
              <label className="block text-sm mb-2">
                Permissions
              </label>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {permissions.length > 0 ? (
                  permissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.name)}
                        onChange={() => togglePermission(perm.name)}
                      />

                      <span className="text-sm">
                        {perm.name}
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="col-span-full text-center text-gray-500">
                    No permissions available.
                  </div>
                )}
              </div>
            </div>

            {/* SUBMIT */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Role"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRole;