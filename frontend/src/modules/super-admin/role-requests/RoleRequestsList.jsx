import { useEffect, useMemo, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import roleRequestService from "../../../services/roleRequest.service";
import Swal from "sweetalert2";

import {
  Loader2,
  Search,
  ShieldCheck,
  ShieldX,
  Clock3,
  User,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import { addNotification } from "../../../store/uiSlice";

const RoleRequestList = () => {
  const dispatch = useDispatch();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const currentUser = useSelector((state) => state.auth?.user);

  const isSuperAdmin = useMemo(() => {
    const roles = currentUser?.roles || [];
    return roles.some((r) => (r?.name || r) === "super-admin");
  }, [currentUser]);

  const extractData = (res) => res?.data?.data ?? res?.data ?? [];

  const loadRequests = useCallback(async (mode = "initial") => {
    try {
      mode === "refresh" ? setRefreshing(true) : setLoading(true);
      setError(null);

      const res = await roleRequestService.getAll();
      const data = extractData(res);

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to load role requests";

      setError(message);

      dispatch(addNotification({ type: "error", message }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = async (id) => {
    try {
      setActionLoadingId(id);

      await roleRequestService.approve(id);

      dispatch(
        addNotification({
          type: "success",
          message: "Role request approved successfully",
        })
      );

      await loadRequests("refresh");
    } catch (err) {
      dispatch(
        addNotification({
          type: "error",
          message: err?.response?.data?.message || "Failed to approve request",
        })
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    const { value: reason } = await Swal.fire({
      title: "Reject Role Request",
      input: "textarea",
      inputLabel: "Reason",
      inputPlaceholder: "Enter rejection reason...",
      showCancelButton: true,
    });

    if (!reason) return;

    try {
      setActionLoadingId(id);

      await roleRequestService.reject(id, reason);

      dispatch(
        addNotification({
          type: "success",
          message: "Role request rejected",
        })
      );

      await loadRequests("refresh");
    } catch (err) {
      dispatch(
        addNotification({
          type: "error",
          message: err?.response?.data?.message || "Failed to reject request",
        })
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatUserName = (user) =>
    user?.full_name ||
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Unknown User";

  const renderStatus = (status) => {
    const base =
      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium";

    switch (status) {
      case "approved":
        return (
          <span className={`${base} bg-green-100 text-green-700`}>
            <ShieldCheck className="w-3 h-3" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className={`${base} bg-red-100 text-red-700`}>
            <ShieldX className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className={`${base} bg-yellow-100 text-yellow-700`}>
            <Clock3 className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return requests;

    return requests.filter((r) =>
      `${formatUserName(r.user)} ${r.requested_role} ${r.status}`
        .toLowerCase()
        .includes(q)
    );
  }, [requests, search]);

  const stats = useMemo(() => {
    return requests.reduce(
      (acc, r) => {
        acc.total += 1;
        acc[r.status || "pending"] =
          (acc[r.status || "pending"] || 0) + 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 }
    );
  }, [requests]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="mt-2 text-sm">Loading role requests...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow border">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 border-b">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Role Requests
          </h2>
          <p className="text-sm text-gray-500">
            Manage system role upgrade requests
          </p>
        </div>

        <button
          onClick={() => loadRequests("refresh")}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-xl hover:bg-gray-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 border-b text-sm">
        <Stat label="Total" value={stats.total} />
        <Stat label="Pending" value={stats.pending} />
        <Stat label="Approved" value={stats.approved} />
        <Stat label="Rejected" value={stats.rejected} />
      </div>

      {/* SEARCH */}
      <div className="p-5 border-b">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full border rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-4 m-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800">
            <tr>
              <th className="p-4 text-left">#</th>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length ? (
              filtered.map((req) => (
                <tr
                  key={req.id}
                  className="border-t hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <td className="p-4">#{req.id}</td>

                  <td className="p-4">
                    <p className="font-medium">
                      {formatUserName(req.user)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {req?.user?.email || "—"}
                    </p>
                  </td>

                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                      {req.requested_role}
                    </span>
                  </td>

                  <td className="p-4">{renderStatus(req.status)}</td>

                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/super-admin/role-requests/${req.id}`}
                        className="bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Link>

                      {isSuperAdmin && req.status === "pending" && (
                        <>
                          <button
                            disabled={actionLoadingId === req.id}
                            onClick={() => handleApprove(req.id)}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>

                          <button
                            disabled={actionLoadingId === req.id}
                            onClick={() => handleReject(req.id)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-10 text-center text-gray-500">
                  No role requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* Small reusable stat component */
const Stat = ({ label, value }) => (
  <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800">
    <p className="text-gray-500 text-xs">{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

export default RoleRequestList;