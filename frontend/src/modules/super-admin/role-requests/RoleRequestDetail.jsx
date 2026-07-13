import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import roleRequestService from "../../../services/roleRequest.service";
import Swal from "sweetalert2";

import {
  Loader2,
  ArrowLeft,
  User,
  Mail,
  ShieldCheck,
  ShieldX,
  Clock3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
} from "lucide-react";

const RoleRequestDetail = () => {
  const { id } = useParams();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentUser = useSelector((state) => state.auth?.user);

  const roles = currentUser?.roles || [];
  const isSuperAdmin = roles.some((r) => (r?.name || r) === "super-admin");
  const isAdmin = roles.some((r) => (r?.name || r) === "admin");
  const canManage = isSuperAdmin || isAdmin;

  const extractData = (res) => res?.data?.data || res?.data || res || null;

  const loadRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await roleRequestService.getById(id);
      const data = extractData(res);

      setRequest(data);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to load role request"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadRequest();
  }, [id]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);

      await roleRequestService.approve(id);
      await loadRequest();
    } catch (err) {
      console.log(err);
      Swal.fire("Error", "Failed to approve request", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const { value: reason } = await Swal.fire({
      title: "Reject Role Request",
      input: "textarea",
      inputLabel: "Reason",
      inputPlaceholder: "Enter rejection reason...",
      showCancelButton: true,
    });

    if (!reason) return;

    try {
      setActionLoading(true);

      await roleRequestService.reject(id, reason);
      await loadRequest();
    } catch (err) {
      Swal.fire("Error", "Failed to reject request", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatus = (status) => {
    const base =
      "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium";

    switch (status) {
      case "approved":
        return (
          <span className={`${base} bg-green-100 text-green-700`}>
            <ShieldCheck className="w-3 h-3" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className={`${base} bg-red-100 text-red-700`}>
            <ShieldX className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className={`${base} bg-yellow-100 text-yellow-700`}>
            <Clock3 className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  const renderTimeline = (timeline) => {
    if (!Array.isArray(timeline) || timeline.length === 0) {
      return (
        <>
          <li>• Request submitted</li>
          <li>• Awaiting admin review</li>
        </>
      );
    }

    return timeline.map((item, index) => {
      const text =
        item?.title || item?.message || "Event";

      const time = item?.timestamp
        ? new Date(item.timestamp).toLocaleString()
        : null;

      return (
        <li key={index} className="flex flex-col">
          <div className="flex items-start gap-2">
            <span>•</span>
            <span>{text}</span>
          </div>

          {time && (
            <span className="text-xs text-gray-400 ml-4">
              {time}
            </span>
          )}
        </li>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="mt-3 text-sm">Loading role request...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-50 text-red-700 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        {error}
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6 text-gray-500">
        Role request not found.
      </div>
    );
  }

  const user = request?.user || {};
  const userName =
    user.full_name ||
    `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
    user.email ||
    "Unknown User";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow border overflow-hidden">

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-5 bg-gray-50 dark:bg-slate-800 border-b">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-bold">
              Role Request Details
            </h2>
            <p className="text-xs text-gray-500">
              Super Admin Review Panel
            </p>
          </div>
        </div>

        <Link
          to="/super-admin/role-requests"
          className="flex items-center gap-2 text-sm border px-3 py-2 rounded-lg hover:bg-white dark:hover:bg-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      {/* BODY */}
      <div className="p-6 space-y-6">

        {/* USER CARD */}
        <div className="flex items-center gap-4 p-5 rounded-xl bg-gray-50 dark:bg-slate-800 border">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div>
            <h3 className="font-semibold text-lg">
              {userName}
            </h3>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mail className="w-4 h-4" />
              {user.email || "—"}
            </div>
          </div>
        </div>

        {/* INFO GRID */}
        <div className="grid md:grid-cols-2 gap-4">

          <div className="p-5 border rounded-xl">
            <p className="text-xs text-gray-500">
              Requested Role
            </p>
            <p className="text-blue-600 font-semibold text-lg capitalize">
              {request?.requested_role || "—"}
            </p>
          </div>

          <div className="p-5 border rounded-xl">
            <p className="text-xs text-gray-500 mb-1">
              Status
            </p>
            {renderStatus(request?.status)}
          </div>

        </div>

        {/* REASON */}
        <div className="p-5 border rounded-xl bg-gray-50 dark:bg-slate-800">
          <p className="text-xs text-gray-500 mb-2">
            User Reason
          </p>
          <p className="text-sm leading-relaxed">
            {request?.reason || "No reason provided"}
          </p>
        </div>

        {/* TIMELINE */}
        <div className="p-5 border rounded-xl">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <History className="w-4 h-4" />
            Activity Timeline
          </div>

          <ul className="text-sm text-gray-600 space-y-2">
            {renderTimeline(request?.timeline)}
          </ul>
        </div>

      </div>

      {/* ACTIONS */}
      {canManage && request?.status === "pending" && (
        <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 dark:bg-slate-800">

          <button
            onClick={handleReject}
            disabled={actionLoading}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            Reject
          </button>

          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Approve
          </button>

        </div>
      )}

    </div>
  );
};

export default RoleRequestDetail;