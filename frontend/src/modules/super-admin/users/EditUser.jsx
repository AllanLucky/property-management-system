import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchUser, updateUser } from "../../../store/userSlice";
import UserForm from "./UserForm";
import { addNotification } from "../../../store/uiSlice";

import {
  Loader2,
  ArrowLeft,
  UserCog,
  AlertTriangle,
  Ban,
  Clock3,
  UserCheck,
  UserX,
} from "lucide-react";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.users);

  const [error, setError] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [updating, setUpdating] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD USER
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingUser(true);
        setError(null);

        await dispatch(fetchUser(id)).unwrap();
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load user data.";

        setError(message);

        dispatch(
          addNotification({
            type: "error",
            message,
          })
        );
      } finally {
        setLoadingUser(false);
      }
    };

    loadData();
  }, [id, dispatch]);

  /*
  |--------------------------------------------------------------------------
  | UPDATE USER
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (data) => {
    try {
      setUpdating(true);
      setError(null);

      const payload = { ...data };

      // remove empty password
      if (!payload.password?.trim()) {
        delete payload.password;
        delete payload.password_confirmation;
      }

      await dispatch(updateUser({ id, data: payload })).unwrap();

      dispatch(
        addNotification({
          type: "success",
          message: "User updated successfully 🎉",
        })
      );

      navigate("/super-admin/users");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Update failed.";

      setError(message);

      dispatch(
        addNotification({
          type: "error",
          message,
        })
      );
    } finally {
      setUpdating(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE USER (SAFE + CONSISTENT)
  |--------------------------------------------------------------------------
  */
  const formattedUser = useMemo(() => {
    if (!user) return null;

    return {
      ...user,

      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone || "",

      account_status: user?.account_status ?? "inactive",
      approval_status: user?.approval_status ?? "pending",

      roles: Array.isArray(user?.roles)
        ? user.roles
            .map((r) => (typeof r === "string" ? r : r?.name))
            .filter(Boolean)
        : [],
    };
  }, [user]);

  /*
  |--------------------------------------------------------------------------
  | STATUS BADGE (PROFESSIONAL DISPLAY ONLY)
  |--------------------------------------------------------------------------
  */
  const renderAccountStatus = (status) => {
    const map = {
      active: (
        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
          <UserCheck className="w-3 h-3" />
          Active
        </span>
      ),
      inactive: (
        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
          <UserX className="w-3 h-3" />
          Inactive
        </span>
      ),
      suspended: (
        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
          <Clock3 className="w-3 h-3" />
          Suspended
        </span>
      ),
      banned: (
        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
          <Ban className="w-3 h-3" />
          Banned
        </span>
      ),
    };

    return map[status] || null;
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */
  if (loadingUser || !formattedUser) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-gray-500">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-sm font-medium">
          Loading user information...
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow border p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-5 mb-6">

        <div>
          <div className="flex items-center gap-2 mb-2">
            <UserCog className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Edit User</h2>
          </div>

          <p className="text-sm text-gray-500">
            Manage user account settings & permissions
          </p>
        </div>

        <Link
          to="/super-admin/users"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      {/* USER INFO */}
      <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-5 mb-6 border">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {formattedUser.first_name} {formattedUser.last_name}
            </h3>

            <p className="text-sm text-gray-500">
              {formattedUser.email}
            </p>
          </div>

          <div className="flex gap-2">
            {renderAccountStatus(formattedUser.account_status)}
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-5 flex gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* UPDATING */}
      {updating && (
        <div className="mb-5 flex items-center gap-2 text-blue-600 bg-blue-50 border px-4 py-3 rounded-xl">
          <Loader2 className="h-4 w-4 animate-spin" />
          Updating user...
        </div>
      )}

      {/* FORM */}
      <UserForm
        initialValues={formattedUser}
        onSubmit={handleSubmit}
        loading={updating}
      />
    </div>
  );
};

export default EditUser;