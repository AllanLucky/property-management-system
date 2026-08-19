import {
  Ban,
  CheckCircle2,
  Clock3,
  Edit3,
  MoreHorizontal,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Swal from "sweetalert2";

import { useTenant } from "../../../hooks/useTenant";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getStatus = (tenant) => {
  if (!tenant) {
    return "";
  }

  return String(
    tenant?.status ??
    tenant?.account_status ??
    tenant?.tenant_status ??
    ""
  ).toLowerCase();
};

const getIsVerified = (tenant) => {
  return (
    tenant?.is_verified === true ||
    tenant?.is_verified === 1 ||
    tenant?.is_verified === "1" ||
    tenant?.verified === true ||
    tenant?.verified === 1 ||
    tenant?.verified === "1"
  );
};

const getTenantId = (tenant) => {
  return (
    tenant?.id ??
    tenant?.tenant_id ??
    tenant?.tenantId ??
    null
  );
};

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

const StatusBadge = ({ tenant }) => {
  const status = getStatus(tenant);

  const config = {
    active: {
      label: "Active",
      classes:
        "bg-emerald-50 text-emerald-700 ring-emerald-200",
      icon: CheckCircle2,
    },

    inactive: {
      label: "Inactive",
      classes:
        "bg-slate-50 text-slate-700 ring-slate-200",
      icon: UserX,
    },

    pending: {
      label: "Pending",
      classes:
        "bg-amber-50 text-amber-700 ring-amber-200",
      icon: Clock3,
    },

    blacklisted: {
      label: "Blacklisted",
      classes:
        "bg-red-50 text-red-700 ring-red-200",
      icon: Ban,
    },

    suspended: {
      label: "Suspended",
      classes:
        "bg-orange-50 text-orange-700 ring-orange-200",
      icon: XCircle,
    },
  };

  const current =
    config[status] || {
      label: status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : "Unknown",
      classes:
        "bg-slate-50 text-slate-600 ring-slate-200",
      icon: ShieldCheck,
    };

  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${current.classes}`}
    >
      <Icon size={14} />
      {current.label}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| TENANT ACTIONS
|--------------------------------------------------------------------------
*/

const TenantActions = ({
  tenant,
  onEdit,
  onDeleted,
  onUpdated,
  showLabel = false,
  compact = false,
}) => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const {
    activateTenant,
    deactivateTenant,
    blacklistTenant,
    pendingTenant,
    verifyTenant,
    unverifyTenant,
    restoreTenant,
    deleteTenant,
    forceDeleteTenant,
  } = useTenant({
    autoFetch: false,
  });

  /*
  |--------------------------------------------------------------------------
  | TENANT INFORMATION
  |--------------------------------------------------------------------------
  */

  const tenantId = getTenantId(tenant);

  const status = getStatus(tenant);

  const isVerified = getIsVerified(tenant);

  const isDeleted = Boolean(
    tenant?.deleted_at ||
    tenant?.deletedAt ||
    tenant?.trashed
  );

  /*
  |--------------------------------------------------------------------------
  | CLOSE MENU
  |--------------------------------------------------------------------------
  */

  const closeMenu = () => {
    setOpen(false);
  };

  /*
  |--------------------------------------------------------------------------
  | SUCCESS HANDLER
  |--------------------------------------------------------------------------
  */

  const handleSuccess = async (
    message,
    response
  ) => {
    await Swal.fire({
      icon: "success",
      title: "Success",
      text: message,
      timer: 1800,
      showConfirmButton: false,
    });

    if (typeof onUpdated === "function") {
      onUpdated(
        response?.data ??
        response?.tenant ??
        response
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | GENERIC ACTION EXECUTOR
  |--------------------------------------------------------------------------
  */

  const executeAction = async ({
    action,
    message,
    successMessage,
  }) => {
    if (
      !tenantId ||
      processing ||
      typeof action !== "function"
    ) {
      return;
    }

    try {
      setProcessing(true);

      closeMenu();

      const response = await action(
        tenantId
      );

      await handleSuccess(
        successMessage || message,
        response
      );
    } catch (error) {
      console.error(
        "Tenant action failed:",
        error
      );

      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        message ||
        "Something went wrong.";

      await Swal.fire({
        icon: "error",
        title: "Action Failed",
        text: errorMessage,
      });
    } finally {
      setProcessing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | VIEW
  |--------------------------------------------------------------------------
  */

  const handleView = () => {
    closeMenu();

    if (!tenantId) {
      return;
    }

    navigate(`/tenants/${tenantId}`);
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const handleEdit = () => {
    closeMenu();

    if (typeof onEdit === "function") {
      onEdit(tenant);
      return;
    }

    if (!tenantId) {
      return;
    }

    navigate(`/tenants/${tenantId}/edit`);
  };

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE
  |--------------------------------------------------------------------------
  */

  const handleActivate = () => {
    executeAction({
      action: activateTenant,
      message:
        "Unable to activate this tenant.",
      successMessage:
        "Tenant activated successfully.",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE
  |--------------------------------------------------------------------------
  */

  const handleDeactivate = async () => {
    if (processing) {
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Deactivate Tenant?",
      text:
        "The tenant will be marked as inactive.",
      showCancelButton: true,
      confirmButtonText:
        "Yes, deactivate",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    executeAction({
      action: deactivateTenant,
      message:
        "Unable to deactivate this tenant.",
      successMessage:
        "Tenant deactivated successfully.",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | BLACKLIST
  |--------------------------------------------------------------------------
  */

  const handleBlacklist = async () => {
    if (processing) {
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Blacklist Tenant?",
      text:
        "This will mark the tenant as blacklisted.",
      showCancelButton: true,
      confirmButtonText:
        "Yes, blacklist",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      input: "textarea",
      inputPlaceholder:
        "Optional reason for blacklisting...",
      inputAttributes: {
        "aria-label":
          "Blacklist reason",
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    /*
     * Keep the reason available if the backend later
     * accepts a second/options argument.
     */
    const reason = result.value || "";

    if (typeof blacklistTenant !== "function") {
      await Swal.fire({
        icon: "error",
        title: "Action Unavailable",
        text:
          "Blacklist action is not available.",
      });

      return;
    }

    try {
      setProcessing(true);

      closeMenu();

      const response =
        await blacklistTenant(
          tenantId,
          reason
        );

      await handleSuccess(
        "Tenant blacklisted successfully.",
        response
      );
    } catch (error) {
      console.error(
        "Failed to blacklist tenant:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "Blacklist Failed",
        text:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Unable to blacklist this tenant.",
      });
    } finally {
      setProcessing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PENDING
  |--------------------------------------------------------------------------
  */

  const handlePending = async () => {
    if (processing) {
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Set Tenant to Pending?",
      text:
        "The tenant status will be changed to pending.",
      showCancelButton: true,
      confirmButtonText:
        "Yes, set pending",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    executeAction({
      action: pendingTenant,
      message:
        "Unable to update tenant status.",
      successMessage:
        "Tenant status changed to pending.",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | VERIFY
  |--------------------------------------------------------------------------
  */

  const handleVerify = () => {
    executeAction({
      action: verifyTenant,
      message:
        "Unable to verify this tenant.",
      successMessage:
        "Tenant verified successfully.",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | UNVERIFY
  |--------------------------------------------------------------------------
  */

  const handleUnverify = async () => {
    if (processing) {
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Remove Verification?",
      text:
        "The tenant will no longer be marked as verified.",
      showCancelButton: true,
      confirmButtonText:
        "Yes, remove",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    executeAction({
      action: unverifyTenant,
      message:
        "Unable to remove tenant verification.",
      successMessage:
        "Tenant verification removed successfully.",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | RESTORE
  |--------------------------------------------------------------------------
  */

  const handleRestore = async () => {
    if (processing) {
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Restore Tenant?",
      text:
        "This tenant will be restored from deleted records.",
      showCancelButton: true,
      confirmButtonText:
        "Yes, restore",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    executeAction({
      action: restoreTenant,
      message:
        "Unable to restore this tenant.",
      successMessage:
        "Tenant restored successfully.",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | SOFT DELETE
  |--------------------------------------------------------------------------
  */

  const handleDelete = async () => {
    if (
      !tenantId ||
      processing
    ) {
      return;
    }

    const tenantName =
      tenant?.full_name ||
      [
        tenant?.first_name,
        tenant?.last_name,
      ]
        .filter(Boolean)
        .join(" ") ||
      tenant?.name ||
      tenant?.tenant_number ||
      `Tenant #${tenantId}`;

    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Tenant?",
      html: `
        <div class="text-sm text-gray-600">
          <p>
            You are about to delete
            <strong>${tenantName}</strong>.
          </p>
          <p class="mt-2">
            The tenant will be moved to deleted records
            and can be restored later.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText:
        "Yes, delete tenant",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) {
      return;
    }

    await executeDelete();
  };

  /*
  |--------------------------------------------------------------------------
  | EXECUTE SOFT DELETE
  |--------------------------------------------------------------------------
  */

  const executeDelete = async () => {
    if (
      !tenantId ||
      processing ||
      typeof deleteTenant !== "function"
    ) {
      return;
    }

    try {
      setProcessing(true);

      closeMenu();

      const response =
        await deleteTenant(
          tenantId
        );

      await Swal.fire({
        icon: "success",
        title: "Tenant Deleted",
        text:
          "Tenant deleted successfully.",
        timer: 1800,
        showConfirmButton: false,
      });

      /*
       * Tell the parent to remove the tenant from
       * the current table/list.
       */
      if (typeof onDeleted === "function") {
        onDeleted(
          tenant,
          response
        );
      }

      /*
       * Also notify the parent that tenant data changed.
       * This allows a refetch if the parent uses it.
       */
      if (typeof onUpdated === "function") {
        onUpdated(
          response?.data ??
          response?.tenant ??
          response
        );
      }
    } catch (error) {
      console.error(
        "Failed to delete tenant:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to delete tenant.",
      });
    } finally {
      setProcessing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FORCE DELETE
  |--------------------------------------------------------------------------
  */

  const handleForceDelete = async () => {
    if (
      !tenantId ||
      processing
    ) {
      return;
    }

    const result = await Swal.fire({
      icon: "error",
      title: "Permanently Delete Tenant?",
      html: `
        <div class="text-sm text-gray-600">
          <p>
            This action is permanent.
          </p>

          <p class="mt-2 font-semibold text-red-600">
            The tenant and its deleted record
            cannot be restored.
          </p>

          <p class="mt-2">
            All associated soft-deleted tenant data
            may be permanently removed.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText:
        "Yes, permanently delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: "#b91c1c",
    });

    if (!result.isConfirmed) {
      return;
    }

    await executeForceDelete();
  };

  /*
  |--------------------------------------------------------------------------
  | EXECUTE FORCE DELETE
  |--------------------------------------------------------------------------
  */

  const executeForceDelete = async () => {
    if (
      !tenantId ||
      processing ||
      typeof forceDeleteTenant !== "function"
    ) {
      return;
    }

    try {
      setProcessing(true);

      closeMenu();

      const response =
        await forceDeleteTenant(
          tenantId
        );

      await Swal.fire({
        icon: "success",
        title: "Permanently Deleted",
        text:
          "Tenant permanently deleted successfully.",
        timer: 1800,
        showConfirmButton: false,
      });

      if (typeof onDeleted === "function") {
        onDeleted(
          tenant,
          response
        );
      }

      if (typeof onUpdated === "function") {
        onUpdated(
          response?.data ??
          response?.tenant ??
          response
        );
      }
    } catch (error) {
      console.error(
        "Failed to permanently delete tenant:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "Permanent Delete Failed",
        text:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to permanently delete tenant.",
      });
    } finally {
      setProcessing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INVALID TENANT
  |--------------------------------------------------------------------------
  */

  if (!tenant) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="relative">
      {/* ================================================================
          MAIN ACTION BUTTON
      ================================================================= */}

      <div className="flex items-center gap-2">
        {showLabel && (
          <StatusBadge tenant={tenant} />
        )}

        <button
          type="button"
          disabled={
            processing ||
            !tenantId
          }
          onClick={() =>
            setOpen((value) => !value)
          }
          aria-label="Tenant actions"
          aria-expanded={open}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 ${compact
            ? "h-9 w-9"
            : "h-10 px-3"
            }`}
        >
          {processing ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          ) : (
            <MoreHorizontal
              size={18}
              aria-hidden="true"
            />
          )}

          {!compact && (
            <span className="text-sm font-medium">
              Actions
            </span>
          )}
        </button>
      </div>

      {/* ================================================================
          DROPDOWN
      ================================================================= */}

      {open && (
        <>
          {/* Overlay */}

          <button
            type="button"
            aria-label="Close tenant actions"
            onClick={closeMenu}
            className="fixed inset-0 z-40 cursor-default bg-transparent"
          />

          <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
            {/* ==========================================================
                VIEW
            ========================================================== */}

            <button
              type="button"
              onClick={handleView}
              disabled={processing}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <ShieldCheck
                size={17}
                className="text-slate-500"
              />

              <span>View Tenant</span>
            </button>

            {/* ==========================================================
                EDIT
            ========================================================== */}

            <button
              type="button"
              onClick={handleEdit}
              disabled={processing}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <Edit3
                size={17}
                className="text-slate-500"
              />

              <span>Edit Tenant</span>
            </button>

            <div className="my-1 border-t border-slate-100" />

            {/* ==========================================================
                RESTORE
            ========================================================== */}

            {isDeleted && (
              <>
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={processing}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                >
                  <RotateCcw size={17} />

                  <span>
                    Restore Tenant
                  </span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                {/* ======================================================
                    FORCE DELETE
                ====================================================== */}

                <button
                  type="button"
                  onClick={handleForceDelete}
                  disabled={processing}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={17} />

                  <span>
                    Permanently Delete
                  </span>
                </button>
              </>
            )}

            {/* ==========================================================
                NORMAL TENANT ACTIONS
            ========================================================== */}

            {!isDeleted && (
              <>
                {/* ======================================================
                    ACTIVATE
                ====================================================== */}

                {(status === "inactive" ||
                  status === "pending" ||
                  status === "suspended") && (
                    <button
                      type="button"
                      onClick={handleActivate}
                      disabled={processing}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                    >
                      <UserCheck size={17} />

                      <span>
                        Activate Tenant
                      </span>
                    </button>
                  )}

                {/* ======================================================
                    DEACTIVATE
                ====================================================== */}

                {status === "active" && (
                  <button
                    type="button"
                    onClick={handleDeactivate}
                    disabled={processing}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-orange-700 transition hover:bg-orange-50 disabled:opacity-50"
                  >
                    <UserX size={17} />

                    <span>
                      Deactivate Tenant
                    </span>
                  </button>
                )}

                {/* ======================================================
                    PENDING
                ====================================================== */}

                {status !== "pending" &&
                  status !== "blacklisted" && (
                    <button
                      type="button"
                      onClick={handlePending}
                      disabled={processing}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
                    >
                      <Clock3 size={17} />

                      <span>
                        Set Pending
                      </span>
                    </button>
                  )}

                {/* ======================================================
                    BLACKLIST
                ====================================================== */}

                {status !== "blacklisted" && (
                  <button
                    type="button"
                    onClick={handleBlacklist}
                    disabled={processing}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Ban size={17} />

                    <span>
                      Blacklist Tenant
                    </span>
                  </button>
                )}

                {/* ======================================================
                    VERIFY
                ====================================================== */}

                {!isVerified && (
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={processing}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                  >
                    <CheckCircle2 size={17} />

                    <span>
                      Verify Tenant
                    </span>
                  </button>
                )}

                {/* ======================================================
                    UNVERIFY
                ====================================================== */}

                {isVerified && (
                  <button
                    type="button"
                    onClick={handleUnverify}
                    disabled={processing}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <XCircle size={17} />

                    <span>
                      Remove Verification
                    </span>
                  </button>
                )}

                {/* ======================================================
                    DELETE
                ====================================================== */}

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={processing}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={17} />

                  <span>
                    Delete Tenant
                  </span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TenantActions;