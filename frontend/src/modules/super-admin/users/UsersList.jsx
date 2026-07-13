import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Swal from "sweetalert2";

import {
  Loader2,
  ShieldCheck,
  ShieldX,
  UserCheck,
  UserX,
  Clock3,
  Ban,
  Search,
  Users,
  Mail,
  Phone,
} from "lucide-react";

import useUsers from "../../../hooks/useUser";
import { addNotification } from "../../../store/uiSlice";

const UsersList = () => {
  const { users, getUsers, removeUser, loading } = useUsers();
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");

  const currentUser = useSelector((state) => state.auth?.user);

  /*
  |----------------------------------------------------------------------
  | ROLE CHECK
  |----------------------------------------------------------------------
  */
  const isSuperAdmin = useMemo(() => {
    const roles = currentUser?.roles || [];
    return roles.some(
      (r) => (typeof r === "string" ? r : r?.name) === "super-admin"
    );
  }, [currentUser]);

  /*
  |----------------------------------------------------------------------
  | LOAD USERS
  |----------------------------------------------------------------------
  */
  useEffect(() => {
    const load = async () => {
      try {
        await getUsers();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: err?.response?.data?.message || "Failed to load users.",
        });

        dispatch(
          addNotification({
            type: "error",
            message: "Failed to load users.",
          })
        );
      }
    };

    load();
  }, [getUsers, dispatch]);

  /*
  |----------------------------------------------------------------------
  | NORMALIZER (CRITICAL FIX)
  |----------------------------------------------------------------------
  */
  const normalizeUser = (user) => {
    return {
      ...user,

      account_status:
        user?.account_status ?? user?.account?.account_status ?? "inactive",

      approval_status:
        user?.approval_status ?? user?.account?.approval_status ?? "pending",
    };
  };

  /*
  |----------------------------------------------------------------------
  | FILTER USERS
  |----------------------------------------------------------------------
  */
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    const q = search.toLowerCase().trim();

    return users
      .map(normalizeUser)
      .filter((u) => {
        const name =
          u?.full_name ||
          `${u?.first_name || ""} ${u?.last_name || ""}`;

        return (
          `${name} ${u?.email || ""} ${u?.phone || ""}`
            .toLowerCase()
            .includes(q)
        );
      });
  }, [users, search]);

  /*
  |----------------------------------------------------------------------
  | DELETE USER
  |----------------------------------------------------------------------
  */
  const handleDelete = useCallback(
    async (id) => {
      const result = await Swal.fire({
        title: "Delete User?",
        text: "This user will be permanently deleted.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete",
      });

      if (!result.isConfirmed) return;

      try {
        await removeUser(id);

        await Swal.fire({
          icon: "success",
          title: "Deleted",
          timer: 1500,
          showConfirmButton: false,
        });

        dispatch(
          addNotification({
            type: "success",
            message: "User deleted successfully.",
          })
        );
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err?.response?.data?.message || "Failed to delete user.",
        });
      }
    },
    [removeUser, dispatch]
  );

  /*
  |----------------------------------------------------------------------
  | STATUS UI
  |----------------------------------------------------------------------
  */
  const renderAccountStatus = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
            <UserCheck className="w-3 h-3" />
            Active
          </span>
        );

      case "inactive":
        return (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
            <UserX className="w-3 h-3" />
            Inactive
          </span>
        );

      case "suspended":
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
            <Clock3 className="w-3 h-3" />
            Suspended
          </span>
        );

      case "banned":
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
            <Ban className="w-3 h-3" />
            Banned
          </span>
        );

      default:
        return null;
    }
  };

  const renderApprovalStatus = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
            <ShieldCheck className="w-3 h-3" />
            Approved
          </span>
        );

      case "pending":
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
            <Clock3 className="w-3 h-3" />
            Pending
          </span>
        );

      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
            <ShieldX className="w-3 h-3" />
            Rejected
          </span>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="mt-2 text-sm">Loading users...</p>
      </div>
    );
  }

  /*
  |----------------------------------------------------------------------
  | UI
  |----------------------------------------------------------------------
  */
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow border">

      {/* HEADER */}
      <div className="flex justify-between items-center p-5 border-b">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Users Management
          </h2>
        </div>

        <Link
          to="/super-admin/users/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm"
        >
          + Add User
        </Link>
      </div>

      {/* SEARCH */}
      <div className="p-5 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            className="w-full border rounded-xl pl-10 py-2"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">User</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Roles</th>
              <th className="p-4">Approval</th>
              <th className="p-4">Account</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const u = normalizeUser(user);

                return (
                  <tr key={u.id} className="border-t">
                    <td className="p-4">#{u.id}</td>

                    <td className="p-4">
                      <div className="font-medium">{u.full_name}</div>
                      <div className="text-xs text-gray-500">{u.gender || "-"}</div>
                    </td>

                    <td className="p-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {u.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {u.phone || "-"}
                      </div>
                    </td>

                    <td className="p-4">
                      {u.roles?.length ? (
                        u.roles.map((r, i) => (
                          <span
                            key={i}
                            className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs mr-1"
                          >
                            {r?.name || r}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No role</span>
                      )}
                    </td>

                    <td className="p-4">
                      {renderApprovalStatus(u.approval_status)}
                    </td>

                    <td className="p-4">
                      {renderAccountStatus(u.account_status)}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/super-admin/users/${u.id}/edit`}
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-xs"
                        >
                          Edit
                        </Link>

                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="p-10 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersList;