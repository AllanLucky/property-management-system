// frontend/src/modules/super-admin/tenancies/TenancyActions.jsx

import { useCallback, useState } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  Power,
  PowerOff,
  RotateCcw,
  Ban,
  XCircle,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| Action Button
|--------------------------------------------------------------------------
*/

const ActionButton = ({
  label,
  icon: Icon,
  onClick,
  disabled = false,
  danger = false,
  loading = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={label}
      aria-label={label}
      className={[
        "inline-flex h-9 w-9 items-center justify-center",
        "rounded-lg border transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-1",
        danger
          ? [
            "border-red-200 text-red-600",
            "hover:border-red-300 hover:bg-red-50",
            "focus:ring-red-500",
          ].join(" ")
          : [
            "border-gray-200 text-gray-600",
            "hover:bg-gray-50 hover:text-gray-900",
            "focus:ring-gray-400",
          ].join(" "),
        disabled || loading
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer",
      ].join(" ")}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
    </button>
  );
};

/*
|--------------------------------------------------------------------------
| Menu Action
|--------------------------------------------------------------------------
*/

const MenuAction = ({
  label,
  icon: Icon,
  onClick,
  danger = false,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex w-full items-center gap-3 px-3 py-2.5",
        "text-left text-sm transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-50",
      ].join(" ")}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
};

/*
|--------------------------------------------------------------------------
| Tenancy Actions
|--------------------------------------------------------------------------
*/

const TenancyActions = ({
  tenancy,
  onDelete,
  onActivate,
  onDeactivate,
  onRenew,
  onTerminate,
  onCancel,
  onRestore,
  onForceDelete,
  loading = false,
}) => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  | ALL HOOKS MUST BE DECLARED BEFORE ANY CONDITIONAL RETURN.
  |--------------------------------------------------------------------------
  */

  const [menuOpen, setMenuOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Safe tenancy values
  |--------------------------------------------------------------------------
  */

  const tenancyId = tenancy?.id ?? null;

  const tenancyNumber =
    tenancy?.tenancy_number ||
    (tenancyId ? `Tenancy #${tenancyId}` : "Tenancy");

  const status = String(tenancy?.status || "").toLowerCase();

  const isDeleted =
    Boolean(tenancy?.deleted_at) ||
    status === "deleted" ||
    status === "trashed";

  const isActive =
    status === "active" ||
    Boolean(tenancy?.is_active) ||
    Boolean(tenancy?.is_currently_active);

  const isTerminated = status === "terminated";

  const isCancelled = status === "cancelled";

  const isLoading = Boolean(loading || actionLoading);

  /*
  |--------------------------------------------------------------------------
  | Close menu
  |--------------------------------------------------------------------------
  */

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Toggle menu
  |--------------------------------------------------------------------------
  */

  const toggleMenu = useCallback(() => {
    setMenuOpen((previous) => !previous);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | View tenancy
  |--------------------------------------------------------------------------
  */

  const handleView = useCallback(() => {
    if (!tenancyId) {
      return;
    }

    navigate(`/super-admin/tenancies/${tenancyId}`);
  }, [navigate, tenancyId]);

  /*
  |--------------------------------------------------------------------------
  | Edit tenancy
  |--------------------------------------------------------------------------
  */

  const handleEdit = useCallback(() => {
    if (!tenancyId || isDeleted) {
      return;
    }

    navigate(`/super-admin/tenancies/${tenancyId}/edit`);
  }, [navigate, tenancyId, isDeleted]);

  /*
  |--------------------------------------------------------------------------
  | Generic action handler
  |--------------------------------------------------------------------------
  */

  const executeAction = useCallback(
    async ({
      action,
      title,
      text,
      confirmText = "Yes, continue",
      successTitle,
    }) => {
      /*
      |----------------------------------------------------------------------
      | Validate action
      |----------------------------------------------------------------------
      */

      if (!action || !tenancyId) {
        await Swal.fire({
          title: "Tenancy not found",
          text: "The selected tenancy could not be found.",
          icon: "error",
          confirmButtonText: "OK",
        });

        closeMenu();
        return;
      }

      /*
      |----------------------------------------------------------------------
      | Confirmation
      |----------------------------------------------------------------------
      */

      const result = await Swal.fire({
        title,
        text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: "Cancel",
        reverseButtons: true,
        focusCancel: true,
      });

      if (!result.isConfirmed) {
        closeMenu();
        return;
      }

      /*
      |----------------------------------------------------------------------
      | Execute
      |----------------------------------------------------------------------
      */

      try {
        setActionLoading(true);

        await action(tenancyId);

        await Swal.fire({
          title: successTitle,
          text: "The operation was completed successfully.",
          icon: "success",
          confirmButtonText: "OK",
        });
      } catch (error) {
        const statusCode = error?.response?.status;

        const backendMessage =
          error?.response?.data?.message ||
          error?.response?.data?.errors?.message;

        const message =
          statusCode === 404
            ? "Tenancy not found. It may have already been deleted or removed."
            : backendMessage ||
            error?.message ||
            "The operation could not be completed.";

        await Swal.fire({
          title:
            statusCode === 404
              ? "Tenancy not found"
              : "Operation failed",
          text: message,
          icon: "error",
          confirmButtonText: "OK",
        });
      } finally {
        setActionLoading(false);
        closeMenu();
      }
    },
    [closeMenu, tenancyId]
  );

  /*
  |--------------------------------------------------------------------------
  | Delete tenancy
  |--------------------------------------------------------------------------
  */

  const handleDelete = useCallback(async () => {
    if (!onDelete || !tenancyId) {
      await Swal.fire({
        title: "Tenancy not found",
        text: "The selected tenancy could not be found.",
        icon: "error",
        confirmButtonText: "OK",
      });

      return;
    }

    const result = await Swal.fire({
      title: "Delete tenancy?",
      html: `
        <p style="margin-bottom:8px;">
          You are about to delete
          <strong>${tenancyNumber}</strong>.
        </p>

        <p style="color:#6b7280;">
          The tenancy will be soft deleted.
        </p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      closeMenu();
      return;
    }

    try {
      setActionLoading(true);

      await onDelete(tenancyId);

      await Swal.fire({
        title: "Tenancy deleted",
        text: "The tenancy was deleted successfully.",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (error) {
      const statusCode = error?.response?.status;

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.message;

      const message =
        statusCode === 404
          ? "Tenancy not found. It may have already been deleted."
          : backendMessage ||
          error?.message ||
          "Failed to delete tenancy.";

      await Swal.fire({
        title:
          statusCode === 404
            ? "Tenancy not found"
            : "Delete failed",
        text: message,
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setActionLoading(false);
      closeMenu();
    }
  }, [
    closeMenu,
    onDelete,
    tenancyId,
    tenancyNumber,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Activate tenancy
  |--------------------------------------------------------------------------
  */

  const handleActivate = useCallback(() => {
    return executeAction({
      action: onActivate,
      title: "Activate tenancy?",
      text: "This will mark the tenancy as active.",
      confirmText: "Yes, activate",
      successTitle: "Tenancy activated",
    });
  }, [executeAction, onActivate]);

  /*
  |--------------------------------------------------------------------------
  | Deactivate tenancy
  |--------------------------------------------------------------------------
  */

  const handleDeactivate = useCallback(() => {
    return executeAction({
      action: onDeactivate,
      title: "Deactivate tenancy?",
      text: "This will deactivate the tenancy.",
      confirmText: "Yes, deactivate",
      successTitle: "Tenancy deactivated",
    });
  }, [executeAction, onDeactivate]);

  /*
  |--------------------------------------------------------------------------
  | Renew tenancy
  |--------------------------------------------------------------------------
  */

  const handleRenew = useCallback(() => {
    if (!onRenew || !tenancyId || isDeleted) {
      return;
    }

    closeMenu();

    navigate(`/super-admin/tenancies/${tenancyId}/renew`);
  }, [
    closeMenu,
    navigate,
    onRenew,
    tenancyId,
    isDeleted,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Terminate tenancy
  |--------------------------------------------------------------------------
  */

  const handleTerminate = useCallback(() => {
    return executeAction({
      action: onTerminate,
      title: "Terminate tenancy?",
      text: "This action will terminate the current tenancy.",
      confirmText: "Yes, terminate",
      successTitle: "Tenancy terminated",
    });
  }, [executeAction, onTerminate]);

  /*
  |--------------------------------------------------------------------------
  | Cancel tenancy
  |--------------------------------------------------------------------------
  */

  const handleCancel = useCallback(() => {
    return executeAction({
      action: onCancel,
      title: "Cancel tenancy?",
      text: "This action will cancel the tenancy.",
      confirmText: "Yes, cancel",
      successTitle: "Tenancy cancelled",
    });
  }, [executeAction, onCancel]);

  /*
  |--------------------------------------------------------------------------
  | Restore tenancy
  |--------------------------------------------------------------------------
  */

  const handleRestore = useCallback(() => {
    return executeAction({
      action: onRestore,
      title: "Restore tenancy?",
      text: "This will restore the deleted tenancy.",
      confirmText: "Yes, restore",
      successTitle: "Tenancy restored",
    });
  }, [executeAction, onRestore]);

  /*
  |--------------------------------------------------------------------------
  | Force delete tenancy
  |--------------------------------------------------------------------------
  */

  const handleForceDelete = useCallback(async () => {
    if (!onForceDelete || !tenancyId) {
      await Swal.fire({
        title: "Tenancy not found",
        text: "The selected tenancy could not be found.",
        icon: "error",
        confirmButtonText: "OK",
      });

      return;
    }

    const result = await Swal.fire({
      title: "Permanently delete tenancy?",
      html: `
        <p style="margin-bottom:8px;">
          This will permanently delete
          <strong>${tenancyNumber}</strong>.
        </p>

        <p style="color:#dc2626;font-weight:600;">
          This action cannot be undone.
        </p>
      `,
      icon: "error",
      showCancelButton: true,
      confirmButtonText: "Yes, permanently delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#b91c1c",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      closeMenu();
      return;
    }

    try {
      setActionLoading(true);

      await onForceDelete(tenancyId);

      await Swal.fire({
        title: "Tenancy permanently deleted",
        text: "The tenancy has been permanently removed.",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (error) {
      const statusCode = error?.response?.status;

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.message;

      const message =
        statusCode === 404
          ? "Tenancy not found. It may have already been permanently deleted."
          : backendMessage ||
          error?.message ||
          "Failed to permanently delete tenancy.";

      await Swal.fire({
        title:
          statusCode === 404
            ? "Tenancy not found"
            : "Delete failed",
        text: message,
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setActionLoading(false);
      closeMenu();
    }
  }, [
    closeMenu,
    onForceDelete,
    tenancyId,
    tenancyNumber,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Conditional return
  |--------------------------------------------------------------------------
  | This is AFTER every hook.
  |--------------------------------------------------------------------------
  */

  if (!tenancy) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="relative flex items-center justify-end gap-2">
      {/* ------------------------------------------------------------------ */}
      {/* View */}
      {/* ------------------------------------------------------------------ */}

      <ActionButton
        label="View tenancy"
        icon={Eye}
        onClick={handleView}
        disabled={isLoading || !tenancyId}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Edit */}
      {/* ------------------------------------------------------------------ */}

      <ActionButton
        label="Edit tenancy"
        icon={Pencil}
        onClick={handleEdit}
        disabled={
          isLoading ||
          !tenancyId ||
          isDeleted
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Delete */}
      {/* ------------------------------------------------------------------ */}

      {!isDeleted && (
        <ActionButton
          label="Delete tenancy"
          icon={Trash2}
          onClick={handleDelete}
          disabled={isLoading}
          loading={actionLoading}
          danger
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* More Actions */}
      {/* ------------------------------------------------------------------ */}

      <div className="relative">
        <button
          type="button"
          onClick={toggleMenu}
          disabled={isLoading}
          aria-label="More tenancy actions"
          aria-expanded={menuOpen}
          className={[
            "inline-flex h-9 w-9 items-center justify-center",
            "rounded-lg border border-gray-200",
            "text-gray-600 transition-colors",
            "hover:bg-gray-50 hover:text-gray-900",
            "focus:outline-none focus:ring-2 focus:ring-gray-400",
            isLoading
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer",
          ].join(" ")}
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </button>

        {menuOpen && (
          <>
            {/* ------------------------------------------------------------ */}
            {/* Backdrop */}
            {/* ------------------------------------------------------------ */}

            <button
              type="button"
              aria-label="Close actions menu"
              onClick={closeMenu}
              className="fixed inset-0 z-10 cursor-default"
            />

            {/* ------------------------------------------------------------ */}
            {/* Dropdown */}
            {/* ------------------------------------------------------------ */}

            <div
              className={[
                "absolute right-0 z-20 mt-2 w-56",
                "overflow-hidden rounded-xl",
                "border border-gray-200",
                "bg-white shadow-lg",
              ].join(" ")}
            >
              {/* ---------------------------------------------------------- */}
              {/* Header */}
              {/* ---------------------------------------------------------- */}

              <div className="border-b border-gray-100 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Tenancy actions
                </p>

                <p className="truncate text-sm font-medium text-gray-800">
                  {tenancyNumber}
                </p>
              </div>

              {/* ---------------------------------------------------------- */}
              {/* Activate */}
              {/* ---------------------------------------------------------- */}

              {!isActive &&
                !isDeleted &&
                !isTerminated &&
                !isCancelled &&
                onActivate && (
                  <MenuAction
                    label="Activate tenancy"
                    icon={Power}
                    onClick={handleActivate}
                    disabled={isLoading}
                  />
                )}

              {/* ---------------------------------------------------------- */}
              {/* Deactivate */}
              {/* ---------------------------------------------------------- */}

              {isActive &&
                !isDeleted &&
                onDeactivate && (
                  <MenuAction
                    label="Deactivate tenancy"
                    icon={PowerOff}
                    onClick={handleDeactivate}
                    disabled={isLoading}
                  />
                )}

              {/* ---------------------------------------------------------- */}
              {/* Renew */}
              {/* ---------------------------------------------------------- */}

              {!isDeleted &&
                !isTerminated &&
                !isCancelled &&
                onRenew && (
                  <MenuAction
                    label="Renew tenancy"
                    icon={RotateCcw}
                    onClick={handleRenew}
                    disabled={isLoading}
                  />
                )}

              {/* ---------------------------------------------------------- */}
              {/* Terminate */}
              {/* ---------------------------------------------------------- */}

              {!isDeleted &&
                !isTerminated &&
                !isCancelled &&
                onTerminate && (
                  <MenuAction
                    label="Terminate tenancy"
                    icon={Ban}
                    onClick={handleTerminate}
                    disabled={isLoading}
                    danger
                  />
                )}

              {/* ---------------------------------------------------------- */}
              {/* Cancel */}
              {/* ---------------------------------------------------------- */}

              {!isDeleted &&
                !isCancelled &&
                onCancel && (
                  <MenuAction
                    label="Cancel tenancy"
                    icon={XCircle}
                    onClick={handleCancel}
                    disabled={isLoading}
                    danger
                  />
                )}

              {/* ---------------------------------------------------------- */}
              {/* Restore */}
              {/* ---------------------------------------------------------- */}

              {isDeleted && onRestore && (
                <MenuAction
                  label="Restore tenancy"
                  icon={RotateCcw}
                  onClick={handleRestore}
                  disabled={isLoading}
                />
              )}

              {/* ---------------------------------------------------------- */}
              {/* Force Delete */}
              {/* ---------------------------------------------------------- */}

              {isDeleted && onForceDelete && (
                <>
                  <div className="my-1 border-t border-gray-100" />

                  <MenuAction
                    label="Permanently delete"
                    icon={Trash2}
                    onClick={handleForceDelete}
                    disabled={isLoading}
                    danger
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TenancyActions;