import {
  Ban,
  CheckCircle2,
  Clock3,
  Edit3,
  FileSignature,
  MoreHorizontal,
  RotateCcw,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Swal from "sweetalert2";

import { useLease } from "../../../hooks/useLease";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Safely resolve the lease ID from different possible API shapes.
 */
const getLeaseId = (lease) => {
  return (
    lease?.id ??
    lease?.lease_id ??
    lease?.leaseId ??
    null
  );
};

/**
 * Safely resolve the lease status.
 */
const getStatus = (lease) => {
  if (!lease) {
    return "";
  }

  const value =
    lease?.status ??
    lease?.lease_status ??
    lease?.leaseStatus ??
    "";

  /*
   * Some APIs may return:
   *
   * {
   *   status: {
   *     value: "active"
   *   }
   * }
   *
   * Protect the UI from rendering an object.
   */
  if (typeof value === "object" && value !== null) {
    return String(
      value?.value ??
      value?.name ??
      value?.status ??
      ""
    ).toLowerCase();
  }

  return String(value).toLowerCase();
};

/**
 * Safely determine whether a lease is soft deleted.
 */
const getIsDeleted = (lease) => {
  return Boolean(
    lease?.deleted_at ||
    lease?.deletedAt ||
    lease?.trashed ||
    lease?.is_deleted
  );
};

/**
 * Safely resolve the lease number for confirmation dialogs.
 */
const getLeaseName = (lease, leaseId) => {
  return (
    lease?.lease_number ||
    lease?.leaseNumber ||
    lease?.number ||
    `Lease #${leaseId}`
  );
};

/**
 * Safely extract an API error message.
 */
const getErrorMessage = (
  error,
  fallback = "Something went wrong."
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

const StatusBadge = ({ lease }) => {
  const status = getStatus(lease);

  const config = {
    active: {
      label: "Active",
      classes:
        "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
      icon: CheckCircle2,
    },

    draft: {
      label: "Draft",
      classes:
        "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30",
      icon: Clock3,
    },

    pending: {
      label: "Pending",
      classes:
        "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
      icon: Clock3,
    },

    expired: {
      label: "Expired",
      classes:
        "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/30",
      icon: Clock3,
    },

    terminated: {
      label: "Terminated",
      classes:
        "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30",
      icon: XCircle,
    },

    cancelled: {
      label: "Cancelled",
      classes:
        "bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/30",
      icon: Ban,
    },
  };

  const current =
    config[status] || {
      label: status
        ? status.charAt(0).toUpperCase() +
        status.slice(1)
        : "Unknown",
      classes:
        "bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/30",
      icon: ShieldCheck,
    };

  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${current.classes}`}
    >
      <Icon
        size={14}
        aria-hidden="true"
      />

      {current.label}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| LEASE ACTIONS
|--------------------------------------------------------------------------
*/

const LeaseActions = ({
  lease,
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
    activate,
    sign,
    terminate,
    cancel,
    remove,
    restore,
    forceDelete,
  } = useLease();

  /*
  |--------------------------------------------------------------------------
  | LEASE INFORMATION
  |--------------------------------------------------------------------------
  */

  const leaseId = getLeaseId(lease);

  const status = getStatus(lease);

  const isDeleted = getIsDeleted(lease);

  const leaseName = getLeaseName(
    lease,
    leaseId
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
  | RESPONSE DATA
  |--------------------------------------------------------------------------
  */

  const getResponseData = (response) => {
    return (
      response?.data ??
      response?.lease ??
      response
    );
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
        getResponseData(response)
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
      !leaseId ||
      processing ||
      typeof action !== "function"
    ) {
      return;
    }

    try {
      setProcessing(true);

      closeMenu();

      const response = await action(
        leaseId
      );

      await handleSuccess(
        successMessage || message,
        response
      );
    } catch (error) {
      console.error(
        "Lease action failed:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "Action Failed",
        text: getErrorMessage(
          error,
          message || "Unable to complete lease action."
        ),
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

    if (!leaseId) {
      return;
    }

    navigate(
      `/super-admin/leases/${leaseId}`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const handleEdit = () => {
    closeMenu();

    if (typeof onEdit === "function") {
      onEdit(lease);
      return;
    }

    if (!leaseId) {
      return;
    }

    navigate(
      `/super-admin/leases/${leaseId}/edit`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE
  |--------------------------------------------------------------------------
  */

  const handleActivate = async () => {
    if (processing) {
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Activate Lease?",
      html: `
        <div class="text-sm text-gray-600">
          <p>
            You are about to activate
            <strong>${leaseName}</strong>.
          </p>

          <p class="mt-2">
            This lease will become active and available
            for normal lease management.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, activate lease",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: "#059669",
    });

    if (!result.isConfirmed) {
      return;
    }

    executeAction({
      action: activate,
      message:
        "Unable to activate this lease.",
      successMessage:
        "Lease activated successfully.",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | SIGN
  |--------------------------------------------------------------------------
  */

  const handleSign = async () => {
    if (processing) {
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Sign Lease?",
      html: `
        <div class="text-sm text-gray-600">
          <p>
            Mark
            <strong>${leaseName}</strong>
            as signed?
          </p>

          <p class="mt-2">
            This will record the lease as signed.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, sign lease",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: "#2563eb",
    });

    if (!result.isConfirmed) {
      return;
    }

    executeAction({
      action: sign,
      message:
        "Unable to sign this lease.",
      successMessage:
        "Lease signed successfully.",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | TERMINATE
  |--------------------------------------------------------------------------
  */

  const handleTerminate = async () => {
    if (
      !leaseId ||
      processing
    ) {
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Terminate Lease?",
      html: `
        <div class="text-sm text-gray-600">
          <p>
            You are about to terminate
            <strong>${leaseName}</strong>.
          </p>

          <p class="mt-2">
            This action will end the lease agreement.
            Please provide a reason below.
          </p>
        </div>
      `,
      input: "textarea",
      inputPlaceholder:
        "Enter the reason for terminating this lease...",
      inputAttributes: {
        "aria-label":
          "Lease termination reason",
      },
      showCancelButton: true,
      confirmButtonText: "Yes, terminate lease",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: "#dc2626",
      preConfirm: (value) => {
        const reason =
          String(value || "").trim();

        if (!reason) {
          Swal.showValidationMessage(
            "A termination reason is required."
          );

          return false;
        }

        return reason;
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    const reason =
      String(result.value || "").trim();

    if (
      typeof terminate !== "function"
    ) {
      await Swal.fire({
        icon: "error",
        title: "Action Unavailable",
        text:
          "Lease termination is not available.",
      });

      return;
    }

    try {
      setProcessing(true);

      closeMenu();

      /*
       * The lease hook can support a second argument
       * containing termination details.
       */
      const response = await terminate(
        leaseId,
        {
          termination_reason: reason,
          reason,
        }
      );

      await handleSuccess(
        "Lease terminated successfully.",
        response
      );
    } catch (error) {
      console.error(
        "Failed to terminate lease:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "Termination Failed",
        text: getErrorMessage(
          error,
          "Unable to terminate this lease."
        ),
      });
    } finally {
      setProcessing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

  const handleCancel = async () => {
    if (
      !leaseId ||
      processing
    ) {
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Cancel Lease?",
      html: `
        <div class="text-sm text-gray-600">
          <p>
            You are about to cancel
            <strong>${leaseName}</strong>.
          </p>

          <p class="mt-2">
            Please provide a reason for cancelling
            this lease.
          </p>
        </div>
      `,
      input: "textarea",
      inputPlaceholder:
        "Enter the reason for cancelling this lease...",
      inputAttributes: {
        "aria-label":
          "Lease cancellation reason",
      },
      showCancelButton: true,
      confirmButtonText: "Yes, cancel lease",
      cancelButtonText: "Keep Lease",
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: "#dc2626",
      preConfirm: (value) => {
        const reason =
          String(value || "").trim();

        if (!reason) {
          Swal.showValidationMessage(
            "A cancellation reason is required."
          );

          return false;
        }

        return reason;
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    const reason =
      String(result.value || "").trim();

    if (
      typeof cancel !== "function"
    ) {
      await Swal.fire({
        icon: "error",
        title: "Action Unavailable",
        text:
          "Lease cancellation is not available.",
      });

      return;
    }

    try {
      setProcessing(true);

      closeMenu();

      const response = await cancel(
        leaseId,
        {
          cancellation_reason: reason,
          reason,
        }
      );

      await handleSuccess(
        "Lease cancelled successfully.",
        response
      );
    } catch (error) {
      console.error(
        "Failed to cancel lease:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "Cancellation Failed",
        text: getErrorMessage(
          error,
          "Unable to cancel this lease."
        ),
      });
    } finally {
      setProcessing(false);
    }
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
      title: "Restore Lease?",
      html: `
        <div class="text-sm text-gray-600">
          <p>
            Restore
            <strong>${leaseName}</strong>
            from deleted records?
          </p>

          <p class="mt-2">
            The lease will become available again
            in the lease management system.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: "#059669",
    });

    if (!result.isConfirmed) {
      return;
    }

    executeAction({
      action: restore,
      message:
        "Unable to restore this lease.",
      successMessage:
        "Lease restored successfully.",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | SOFT DELETE
  |--------------------------------------------------------------------------
  */

  const handleDelete = async () => {
    if (
      !leaseId ||
      processing
    ) {
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Lease?",
      html: `
        <div class="text-sm text-gray-600">
          <p>
            You are about to delete
            <strong>${leaseName}</strong>.
          </p>

          <p class="mt-2">
            The lease will be moved to deleted records
            and can be restored later.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, delete lease",
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
      !leaseId ||
      processing ||
      typeof remove !== "function"
    ) {
      return;
    }

    try {
      setProcessing(true);

      closeMenu();

      const response =
        await remove(leaseId);

      await Swal.fire({
        icon: "success",
        title: "Lease Deleted",
        text:
          "Lease deleted successfully.",
        timer: 1800,
        showConfirmButton: false,
      });

      /*
       * Remove the lease immediately from the
       * current table/list.
       */
      if (
        typeof onDeleted === "function"
      ) {
        onDeleted(
          lease,
          response
        );
      }

      /*
       * Also notify the parent that the lease
       * collection has changed.
       */
      if (
        typeof onUpdated === "function"
      ) {
        onUpdated(
          getResponseData(response)
        );
      }
    } catch (error) {
      console.error(
        "Failed to delete lease:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: getErrorMessage(
          error,
          "Failed to delete this lease."
        ),
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
      !leaseId ||
      processing
    ) {
      return;
    }

    const result = await Swal.fire({
      icon: "error",
      title: "Permanently Delete Lease?",
      html: `
        <div class="text-sm text-gray-600">
          <p>
            You are about to permanently delete
            <strong>${leaseName}</strong>.
          </p>

          <p class="mt-2 font-semibold text-red-600">
            This action cannot be undone.
          </p>

          <p class="mt-2">
            The lease and its soft-deleted record
            will be permanently removed.
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
      !leaseId ||
      processing ||
      typeof forceDelete !== "function"
    ) {
      return;
    }

    try {
      setProcessing(true);

      closeMenu();

      const response =
        await forceDelete(leaseId);

      await Swal.fire({
        icon: "success",
        title: "Permanently Deleted",
        text:
          "Lease permanently deleted successfully.",
        timer: 1800,
        showConfirmButton: false,
      });

      if (
        typeof onDeleted === "function"
      ) {
        onDeleted(
          lease,
          response
        );
      }

      if (
        typeof onUpdated === "function"
      ) {
        onUpdated(
          getResponseData(response)
        );
      }
    } catch (error) {
      console.error(
        "Failed to permanently delete lease:",
        error
      );

      await Swal.fire({
        icon: "error",
        title: "Permanent Delete Failed",
        text: getErrorMessage(
          error,
          "Failed to permanently delete this lease."
        ),
      });
    } finally {
      setProcessing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INVALID LEASE
  |--------------------------------------------------------------------------
  */

  if (!lease) {
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
          <StatusBadge lease={lease} />
        )}

        <button
          type="button"
          disabled={
            processing ||
            !leaseId
          }
          onClick={() =>
            setOpen((value) => !value)
          }
          aria-label="Lease actions"
          aria-expanded={open}
          className={[
            "inline-flex items-center justify-center gap-2",
            "rounded-xl border border-slate-200 bg-white",
            "text-slate-600 shadow-sm transition",
            "hover:border-slate-300 hover:bg-slate-50",
            "hover:text-slate-900",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-slate-700 dark:bg-slate-800",
            "dark:text-slate-300",
            "dark:hover:border-slate-600",
            "dark:hover:bg-slate-700",
            "dark:hover:text-white",
            compact
              ? "h-9 w-9"
              : "h-10 px-3",
          ].join(" ")}
        >
          {processing ? (
            <span
              className="
                h-4 w-4 animate-spin rounded-full
                border-2 border-slate-300
                border-t-slate-700
                dark:border-slate-600
                dark:border-t-white
              "
            />
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
          {/* ============================================================
              OVERLAY
          ============================================================= */}

          <button
            type="button"
            aria-label="Close lease actions"
            onClick={closeMenu}
            className="
              fixed inset-0 z-40
              cursor-default bg-transparent
            "
          />

          {/* ============================================================
              MENU
          ============================================================= */}

          <div
            className="
              absolute right-0 z-50 mt-2 w-64
              overflow-hidden rounded-2xl
              border border-slate-200
              bg-white p-1.5 shadow-xl
              dark:border-slate-700
              dark:bg-slate-800
            "
          >
            {/* ==========================================================
                VIEW
            ========================================================== */}

            <button
              type="button"
              onClick={handleView}
              disabled={processing}
              className="
                flex w-full items-center gap-3
                rounded-xl px-3 py-2.5
                text-left text-sm font-medium
                text-slate-700 transition
                hover:bg-slate-50
                disabled:opacity-50
                dark:text-slate-200
                dark:hover:bg-slate-700
              "
            >
              <ShieldCheck
                size={17}
                className="text-slate-500 dark:text-slate-400"
                aria-hidden="true"
              />

              <span>
                View Lease
              </span>
            </button>

            {/* ==========================================================
                EDIT
            ========================================================== */}

            <button
              type="button"
              onClick={handleEdit}
              disabled={processing}
              className="
                flex w-full items-center gap-3
                rounded-xl px-3 py-2.5
                text-left text-sm font-medium
                text-slate-700 transition
                hover:bg-slate-50
                disabled:opacity-50
                dark:text-slate-200
                dark:hover:bg-slate-700
              "
            >
              <Edit3
                size={17}
                className="text-slate-500 dark:text-slate-400"
                aria-hidden="true"
              />

              <span>
                Edit Lease
              </span>
            </button>

            <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

            {/* ==========================================================
                DELETED LEASE ACTIONS
            ========================================================== */}

            {isDeleted && (
              <>
                {/* ======================================================
                    RESTORE
                ====================================================== */}

                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={processing}
                  className="
                    flex w-full items-center gap-3
                    rounded-xl px-3 py-2.5
                    text-left text-sm font-medium
                    text-emerald-700 transition
                    hover:bg-emerald-50
                    disabled:opacity-50
                    dark:text-emerald-400
                    dark:hover:bg-emerald-500/10
                  "
                >
                  <RotateCcw
                    size={17}
                    aria-hidden="true"
                  />

                  <span>
                    Restore Lease
                  </span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                {/* ======================================================
                    FORCE DELETE
                ====================================================== */}

                <button
                  type="button"
                  onClick={handleForceDelete}
                  disabled={processing}
                  className="
                    flex w-full items-center gap-3
                    rounded-xl px-3 py-2.5
                    text-left text-sm font-semibold
                    text-red-700 transition
                    hover:bg-red-50
                    disabled:opacity-50
                    dark:text-red-400
                    dark:hover:bg-red-500/10
                  "
                >
                  <Trash2
                    size={17}
                    aria-hidden="true"
                  />

                  <span>
                    Permanently Delete
                  </span>
                </button>
              </>
            )}

            {/* ==========================================================
                NORMAL LEASE ACTIONS
            ========================================================== */}

            {!isDeleted && (
              <>
                {/* ======================================================
                    ACTIVATE
                ====================================================== */}

                {(
                  status === "draft" ||
                  status === "pending"
                ) && (
                    <button
                      type="button"
                      onClick={handleActivate}
                      disabled={processing}
                      className="
                      flex w-full items-center gap-3
                      rounded-xl px-3 py-2.5
                      text-left text-sm font-medium
                      text-emerald-700 transition
                      hover:bg-emerald-50
                      disabled:opacity-50
                      dark:text-emerald-400
                      dark:hover:bg-emerald-500/10
                    "
                    >
                      <CheckCircle2
                        size={17}
                        aria-hidden="true"
                      />

                      <span>
                        Activate Lease
                      </span>
                    </button>
                  )}

                {/* ======================================================
                    SIGN
                ====================================================== */}

                {(
                  status === "draft" ||
                  status === "pending"
                ) && (
                    <button
                      type="button"
                      onClick={handleSign}
                      disabled={processing}
                      className="
                      flex w-full items-center gap-3
                      rounded-xl px-3 py-2.5
                      text-left text-sm font-medium
                      text-blue-700 transition
                      hover:bg-blue-50
                      disabled:opacity-50
                      dark:text-blue-400
                      dark:hover:bg-blue-500/10
                    "
                    >
                      <FileSignature
                        size={17}
                        aria-hidden="true"
                      />

                      <span>
                        Sign Lease
                      </span>
                    </button>
                  )}

                {/* ======================================================
                    TERMINATE
                ====================================================== */}

                {status === "active" && (
                  <button
                    type="button"
                    onClick={handleTerminate}
                    disabled={processing}
                    className="
                      flex w-full items-center gap-3
                      rounded-xl px-3 py-2.5
                      text-left text-sm font-medium
                      text-red-700 transition
                      hover:bg-red-50
                      disabled:opacity-50
                      dark:text-red-400
                      dark:hover:bg-red-500/10
                    "
                  >
                    <XCircle
                      size={17}
                      aria-hidden="true"
                    />

                    <span>
                      Terminate Lease
                    </span>
                  </button>
                )}

                {/* ======================================================
                    CANCEL
                ====================================================== */}

                {(
                  status === "draft" ||
                  status === "pending" ||
                  status === "active"
                ) && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={processing}
                      className="
                      flex w-full items-center gap-3
                      rounded-xl px-3 py-2.5
                      text-left text-sm font-medium
                      text-orange-700 transition
                      hover:bg-orange-50
                      disabled:opacity-50
                      dark:text-orange-400
                      dark:hover:bg-orange-500/10
                    "
                    >
                      <Ban
                        size={17}
                        aria-hidden="true"
                      />

                      <span>
                        Cancel Lease
                      </span>
                    </button>
                  )}

                {/* ======================================================
                    DELETE
                ====================================================== */}

                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={processing}
                  className="
                    flex w-full items-center gap-3
                    rounded-xl px-3 py-2.5
                    text-left text-sm font-medium
                    text-red-600 transition
                    hover:bg-red-50
                    disabled:opacity-50
                    dark:text-red-400
                    dark:hover:bg-red-500/10
                  "
                >
                  <Trash2
                    size={17}
                    aria-hidden="true"
                  />

                  <span>
                    Delete Lease
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

export default LeaseActions;