import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../../api/axios";
import RoleForm from "./RoleForm";
import { Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { addNotification } from "../../../store/uiSlice";

const EditRole = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | FETCH ROLE
  |--------------------------------------------------------------------------
  */
  const getRole = async () => {
    setFetching(true);
    setError(null);

    try {
      const res = await api.get(`/rbac/roles/${id}`);
      setRole(res.data?.data || res.data);

    } catch (err) {
      console.error(err);

      const message =
        err?.response?.data?.message || "Failed to load role";

      setError(message);

      dispatch(
        addNotification({
          type: "error",
          message,
        })
      );

    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (id) getRole();
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | UPDATE ROLE
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      await api.put(`/rbac/roles/${id}`, data);

      dispatch(
        addNotification({
          type: "success",
          message: "Role updated successfully 🎉",
        })
      );

      navigate("/super-admin/roles");

    } catch (err) {
      console.error(err);

      const message =
        err?.response?.data?.message || "Failed to update role";

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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="mt-2 text-sm">Loading role...</p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NOT FOUND
  |--------------------------------------------------------------------------
  */
  if (!role) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">Role not found</p>

        <Link
          to="/super-admin/roles"
          className="px-4 py-2 bg-gray-200 rounded-lg"
        >
          ← Back to Roles
        </Link>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 border-b pb-3">

        <h2 className="text-lg font-bold">
          Edit Role
        </h2>

        <Link
          to="/super-admin/roles"
          className="px-4 py-2 text-sm bg-gray-200 rounded-lg"
        >
          ← Back
        </Link>

      </div>

      {/* ERROR (fallback UI) */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* LOADING UPDATE */}
      {loading && (
        <div className="mb-4 flex items-center gap-2 text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Updating role...
        </div>
      )}

      {/* FORM */}
      <RoleForm
        initialValues={role || { name: "", permissions: [] }}
        onSubmit={handleSubmit}
        loading={loading}
      />

    </div>
  );
};

export default EditRole;