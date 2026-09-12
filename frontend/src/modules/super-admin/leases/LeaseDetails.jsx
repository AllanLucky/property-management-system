import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Edit3,
  ExternalLink,
  FileCheck2,
  FileText,
  Home,
  Loader2,
  MapPin,
  Phone,
  Trash2,
  User,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import { useLease } from "../../../hooks/useLease";
import { addNotification } from "../../../store/uiSlice";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_CURRENCY = "KES";
const LEASE_LIST_ROUTE = "/super-admin/leases";

/*
|--------------------------------------------------------------------------
| Formatting Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely extract a human-readable error message from
 * common Laravel / Axios response structures.
 */
const getErrorMessage = (error) => {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (
    typeof error?.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  if (
    typeof error?.error === "string" &&
    error.error.trim()
  ) {
    return error.error;
  }

  if (error?.errors) {
    if (typeof error.errors === "string") {
      return error.errors;
    }

    if (
      typeof error.errors === "object" &&
      !Array.isArray(error.errors)
    ) {
      const messages = Object.values(error.errors)
        .flat()
        .filter(Boolean)
        .map((message) => String(message));

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }
  }

  const responseData = error?.response?.data;

  if (responseData) {
    if (typeof responseData === "string") {
      return responseData;
    }

    if (
      typeof responseData.message === "string" &&
      responseData.message.trim()
    ) {
      return responseData.message;
    }

    if (
      typeof responseData.error === "string" &&
      responseData.error.trim()
    ) {
      return responseData.error;
    }

    if (responseData.errors) {
      if (typeof responseData.errors === "string") {
        return responseData.errors;
      }

      if (
        typeof responseData.errors === "object" &&
        !Array.isArray(responseData.errors)
      ) {
        const messages = Object.values(responseData.errors)
          .flat()
          .filter(Boolean)
          .map((message) => String(message));

        if (messages.length > 0) {
          return messages.join(" ");
        }
      }
    }
  }

  return "Failed to process the lease. Please try again.";
};

/**
 * Format a date for display.
 *
 * Example:
 * 2026-01-01 -> 01 Jan 2026
 */
const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

/**
 * Format date and time.
 */
const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/**
 * Format currency using Kenyan Shillings.
 */
const formatCurrency = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return `${DEFAULT_CURRENCY} 0.00`;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `${DEFAULT_CURRENCY} 0.00`;
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Normalize Laravel/API boolean values.
 */
const normalizeBoolean = (value) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
};

/**
 * Check whether a value can safely be displayed.
 */
const hasValue = (value) => {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ""
  );
};

/**
 * Safely convert an object/person into a readable full name.
 */
const getFullName = (person) => {
  if (!person) {
    return "—";
  }

  if (typeof person === "string") {
    return person;
  }

  if (person.full_name) {
    return String(person.full_name);
  }

  if (person.fullName) {
    return String(person.fullName);
  }

  const firstName =
    person.first_name ||
    person.firstName ||
    "";

  const otherNames =
    person.other_names ||
    person.otherNames ||
    "";

  const lastName =
    person.last_name ||
    person.lastName ||
    "";

  const fullName = `${firstName} ${otherNames} ${lastName}`
    .replace(/\s+/g, " ")
    .trim();

  return (
    fullName ||
    person.name ||
    person.label ||
    "—"
  );
};

/**
 * Generate initials for tenant avatar.
 */
const getInitials = (person) => {
  const fullName = getFullName(person);

  if (!fullName || fullName === "—") {
    return "T";
  }

  const parts = fullName
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
};

/**
 * Format enum-like values.
 *
 * Example:
 * fixed_term -> Fixed Term
 */
const formatTypeLabel = (value) => {
  if (!value || typeof value !== "string") {
    return "—";
  }

  return value
    .replace(/[_-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase(),
    )
    .join(" ");
};

/**
 * Resolve lease status.
 */
const getLeaseStatus = (lease) => {
  if (!lease) {
    return "unknown";
  }

  if (hasValue(lease.status)) {
    return String(lease.status).toLowerCase();
  }

  if (hasValue(lease.lease_status)) {
    return String(lease.lease_status).toLowerCase();
  }

  if (
    lease.is_active !== null &&
    lease.is_active !== undefined
  ) {
    return normalizeBoolean(lease.is_active)
      ? "active"
      : "inactive";
  }

  return "unknown";
};

/**
 * Resolve readable status label.
 */
const getStatusLabel = (status) => {
  if (!status) {
    return "Unknown";
  }

  return String(status)
    .replace(/[_-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase(),
    )
    .join(" ");
};

/**
 * Resolve lease type label.
 */
const getLeaseTypeLabel = (lease) => {
  return (
    lease?.lease_type_label ||
    formatTypeLabel(
      lease?.lease_type ||
        lease?.type,
    )
  );
};

/**
 * Resolve payment frequency label.
 */
const getPaymentFrequencyLabel = (frequency) => {
  if (!frequency) {
    return "—";
  }

  return formatTypeLabel(frequency);
};

/*
|--------------------------------------------------------------------------
| Reusable UI Components
|--------------------------------------------------------------------------
*/

/**
 * Status badge.
 */
const StatusBadge = ({ status }) => {
  const normalized = String(
    status || "",
  ).toLowerCase();

  let classes =
    "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300";

  let icon = (
    <Clock3
      className="h-3.5 w-3.5"
      aria-hidden="true"
    />
  );

  if (normalized === "active") {
    classes =
      "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-400";

    icon = (
      <CheckCircle2
        className="h-3.5 w-3.5"
        aria-hidden="true"
      />
    );
  }

  if (
    normalized === "pending" ||
    normalized === "draft"
  ) {
    classes =
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400";

    icon = (
      <Clock3
        className="h-3.5 w-3.5"
        aria-hidden="true"
      />
    );
  }

  if (normalized === "expired") {
    classes =
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-400";
  }

  if (
    normalized === "terminated" ||
    normalized === "cancelled" ||
    normalized === "inactive"
  ) {
    classes =
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400";

    icon = (
      <XCircle
        className="h-3.5 w-3.5"
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1
        text-xs
        font-semibold
        ${classes}
      `}
    >
      {icon}
      {getStatusLabel(status)}
    </span>
  );
};

/**
 * Active/inactive badge.
 */
const ActiveBadge = ({ active }) => {
  const isActive = normalizeBoolean(active);

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1
        text-xs
        font-semibold
        ${
          isActive
            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-400"
            : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        }
      `}
    >
      {isActive ? (
        <CheckCircle2
          className="h-3.5 w-3.5"
          aria-hidden="true"
        />
      ) : (
        <XCircle
          className="h-3.5 w-3.5"
          aria-hidden="true"
        />
      )}

      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

/**
 * Information item used throughout the page.
 */
const InfoItem = ({
  icon,
  label,
  value,
  children,
}) => {
  return (
    <div className="flex min-w-0 gap-3">
      <div
        className="
          mt-0.5
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-gray-50
          text-gray-500
          dark:bg-gray-800
          dark:text-gray-400
        "
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className="
            text-[11px]
            font-semibold
            uppercase
            tracking-wider
            text-gray-400
            dark:text-gray-500
          "
        >
          {label}
        </p>

        {children || (
          <p
            className="
              mt-1
              break-words
              text-sm
              font-medium
              text-gray-900
              dark:text-gray-100
            "
          >
            {hasValue(value) ? value : "—"}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Standard page section.
 */
const DetailsSection = ({
  icon,
  title,
  description,
  children,
}) => {
  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-white
        shadow-sm
        dark:border-gray-800
        dark:bg-gray-900
      "
    >
      <div
        className="
          flex
          items-start
          gap-3
          border-b
          border-gray-200
          px-5
          py-4
          sm:px-6
          dark:border-gray-800
        "
      >
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-primary-50
            text-primary-600
            dark:bg-primary-950/40
            dark:text-primary-400
          "
        >
          {icon}
        </div>

        <div className="min-w-0">
          <h2
            className="
              text-sm
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            {title}
          </h2>

          {description && (
            <p
              className="
                mt-0.5
                text-xs
                leading-5
                text-gray-500
                dark:text-gray-400
              "
            >
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
};

/**
 * Action button.
 */
const ActionButton = ({
  children,
  icon,
  onClick,
  disabled = false,
  variant = "secondary",
  className = "",
}) => {
  const variants = {
    primary:
      "border-primary-600 bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",

    secondary:
      "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800",

    danger:
      "border-red-200 bg-white text-red-600 hover:bg-red-50 focus:ring-red-500 dark:border-red-900/60 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/30",

    warning:
      "border-orange-200 bg-white text-orange-600 hover:bg-orange-50 focus:ring-orange-500 dark:border-orange-900/60 dark:bg-gray-900 dark:text-orange-400 dark:hover:bg-orange-950/30",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-lg
        border
        px-4
        py-2.5
        text-sm
        font-semibold
        shadow-sm
        transition
        focus:outline-none
        focus:ring-2
        focus:ring-offset-2
        disabled:cursor-not-allowed
        disabled:opacity-50
        dark:focus:ring-offset-gray-950
        ${variants[variant] || variants.secondary}
        ${className}
      `}
    >
      {icon}
      {children}
    </button>
  );
};

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

const LeaseDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const [actionLoading, setActionLoading] =
    useState(false);

  const {
    currentLease,
    loadingDetails,
    error,
    fetchOne,
    remove,
    activate,
    terminate,
    cancel,
    clearError,
  } = useLease();

  const lease = currentLease;

  /*
  |--------------------------------------------------------------------------
  | Load Lease
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    let cancelled = false;

    const loadLease = async () => {
      try {
        await fetchOne(id);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        dispatch(
          addNotification({
            type: "error",
            message:
              getErrorMessage(requestError),
          }),
        );
      }
    };

    void loadLease();

    return () => {
      cancelled = true;
    };
  }, [dispatch, fetchOne, id]);

  /*
  |--------------------------------------------------------------------------
  | Clear Errors On Unmount
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  /*
  |--------------------------------------------------------------------------
  | Related Records
  |--------------------------------------------------------------------------
  */

  const tenancy =
    lease?.tenancy ||
    lease?.tenancy_details ||
    null;

  const tenant =
    lease?.tenant ||
    lease?.tenant_details ||
    tenancy?.tenant ||
    tenancy?.tenant_details ||
    null;

  const tenantUser =
    lease?.user ||
    lease?.tenant?.user ||
    lease?.tenant?.user_account ||
    tenant?.user ||
    tenant?.user_account ||
    tenancy?.user ||
    tenancy?.tenant?.user ||
    null;

  const property =
    lease?.property ||
    lease?.property_details ||
    tenancy?.property ||
    tenancy?.property_details ||
    null;

  const apartment =
    lease?.apartment ||
    lease?.apartment_details ||
    tenancy?.apartment ||
    tenancy?.apartment_details ||
    null;

  const unit =
    lease?.unit ||
    lease?.unit_details ||
    tenancy?.unit ||
    tenancy?.unit_details ||
    null;

  /*
  |--------------------------------------------------------------------------
  | Lease Status
  |--------------------------------------------------------------------------
  */

  const status = getLeaseStatus(lease);

  const isActive =
    status === "active";

  const isDraft =
    status === "draft";

  const isPending =
    status === "pending";

  const canActivate =
    isDraft || isPending;

  const canTerminate =
    isActive;

  const canCancel =
    isDraft || isPending;

  /*
  |--------------------------------------------------------------------------
  | Lease Identity
  |--------------------------------------------------------------------------
  */

  const leaseId =
    lease?.id ?? null;

  const leaseNumber =
    lease?.lease_number ||
    (leaseId
      ? `LSE-${String(
          leaseId,
        ).padStart(6, "0")}`
      : "—");

  /*
  |--------------------------------------------------------------------------
  | Tenant Information
  |--------------------------------------------------------------------------
  */

  const tenantName =
    getFullName(tenant);

  const tenantDisplayName =
    tenantName !== "—"
      ? tenantName
      : getFullName(tenantUser);

  const tenantInitials =
    getInitials(
      tenantName !== "—"
        ? tenant
        : tenantUser,
    );

  /*
  |--------------------------------------------------------------------------
  | Property Information
  |--------------------------------------------------------------------------
  */

  const propertyName =
    property?.name ||
    property?.title ||
    tenancy?.property_name ||
    "—";

  const apartmentName =
    apartment?.full_name ||
    apartment?.name ||
    apartment?.apartment_number ||
    apartment?.block ||
    tenancy?.apartment_name ||
    "—";

  const unitName =
    unit?.full_unit_name ||
    unit?.unit_name ||
    unit?.name ||
    unit?.unit_number ||
    tenancy?.unit_name ||
    "—";

  /*
  |--------------------------------------------------------------------------
  | Lease Financial Values
  |--------------------------------------------------------------------------
  |
  | Always use lease-level financial fields.
  |
  */

  const rentAmount =
    lease?.rent_amount;

  const depositAmount =
    lease?.deposit_amount;

  const serviceCharge =
    lease?.service_charge;

  const lateFee =
    lease?.late_fee;

  /*
  |--------------------------------------------------------------------------
  | Agreement
  |--------------------------------------------------------------------------
  |
  | The API may expose the agreement as:
  |
  | lease.agreement.file
  | lease.agreement_file
  | lease.agreement.url
  |
  */

  const agreementFile =
    lease?.agreement?.file ||
    lease?.agreement_file ||
    lease?.agreement?.url ||
    null;

  const agreementAvailable =
    normalizeBoolean(
      lease?.agreement?.has_agreement,
    ) || Boolean(agreementFile);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {
    if (actionLoading) {
      return;
    }

    navigate(LEASE_LIST_ROUTE);
  };

  const handleEdit = () => {
    if (!leaseId || actionLoading) {
      return;
    }

    navigate(
      `${LEASE_LIST_ROUTE}/${leaseId}/edit`,
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const refreshLease = async () => {
    if (!leaseId) {
      return;
    }

    try {
      await fetchOne(leaseId);
    } catch (requestError) {
      dispatch(
        addNotification({
          type: "error",
          message:
            getErrorMessage(requestError),
        }),
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Activate Lease
  |--------------------------------------------------------------------------
  */

  const handleActivate = async () => {
    if (
      !leaseId ||
      actionLoading ||
      !canActivate
    ) {
      return;
    }

    setActionLoading(true);

    try {
      await activate(leaseId);

      dispatch(
        addNotification({
          type: "success",
          message:
            "Lease activated successfully.",
        }),
      );

      await refreshLease();
    } catch (actionError) {
      dispatch(
        addNotification({
          type: "error",
          message:
            getErrorMessage(actionError),
        }),
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Terminate Lease
  |--------------------------------------------------------------------------
  */

  const handleTerminate = async () => {
    if (
      !leaseId ||
      actionLoading ||
      !canTerminate
    ) {
      return;
    }

    const result =
      await Swal.fire({
        title: "Terminate Lease?",
        text: "This will terminate the current lease. This action should only be used when the tenancy is ending.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText:
          "Yes, terminate",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        focusCancel: true,
      });

    if (!result.isConfirmed) {
      return;
    }

    setActionLoading(true);

    try {
      await terminate(leaseId);

      dispatch(
        addNotification({
          type: "success",
          message:
            "Lease terminated successfully.",
        }),
      );

      await refreshLease();
    } catch (actionError) {
      dispatch(
        addNotification({
          type: "error",
          message:
            getErrorMessage(actionError),
        }),
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Cancel Lease
  |--------------------------------------------------------------------------
  */

  const handleCancelLease = async () => {
    if (
      !leaseId ||
      actionLoading ||
      !canCancel
    ) {
      return;
    }

    const result =
      await Swal.fire({
        title: "Cancel Lease?",
        text: "This will cancel the lease before it becomes active.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText:
          "Yes, cancel",
        cancelButtonText:
          "Keep Lease",
        reverseButtons: true,
        focusCancel: true,
      });

    if (!result.isConfirmed) {
      return;
    }

    setActionLoading(true);

    try {
      await cancel(leaseId);

      dispatch(
        addNotification({
          type: "success",
          message:
            "Lease cancelled successfully.",
        }),
      );

      await refreshLease();
    } catch (actionError) {
      dispatch(
        addNotification({
          type: "error",
          message:
            getErrorMessage(actionError),
        }),
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Lease
  |--------------------------------------------------------------------------
  */

  const handleDelete = async () => {
    if (!leaseId || actionLoading) {
      return;
    }

    const result =
      await Swal.fire({
        title: "Delete Lease?",
        text: "The lease will be moved to the trash. You can restore it later.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText:
          "Yes, delete it",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        focusCancel: true,
      });

    if (!result.isConfirmed) {
      return;
    }

    setActionLoading(true);

    try {
      await remove(leaseId);

      dispatch(
        addNotification({
          type: "success",
          message:
            "Lease deleted successfully.",
        }),
      );

      navigate(LEASE_LIST_ROUTE);
    } catch (deleteError) {
      dispatch(
        addNotification({
          type: "error",
          message:
            getErrorMessage(deleteError),
        }),
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Invalid Lease ID
  |--------------------------------------------------------------------------
  */

  if (!id) {
    return (
      <div className="min-h-full bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <ActionButton
            onClick={() =>
              navigate(LEASE_LIST_ROUTE)
            }
            icon={
              <ArrowLeft
                className="h-4 w-4"
                aria-hidden="true"
              />
            }
          >
            Back to Leases
          </ActionButton>

          <div
            className="
              rounded-2xl
              border
              border-red-200
              bg-red-50
              p-6
              dark:border-red-900/60
              dark:bg-red-950/30
            "
          >
            <h2 className="text-base font-bold text-red-900 dark:text-red-300">
              Invalid Lease
            </h2>

            <p className="mt-2 text-sm text-red-700 dark:text-red-400">
              No lease ID was provided.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loadingDetails && !lease) {
    return (
      <div className="min-h-full bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <ActionButton
            onClick={() =>
              navigate(LEASE_LIST_ROUTE)
            }
            icon={
              <ArrowLeft
                className="h-4 w-4"
                aria-hidden="true"
              />
            }
          >
            Back to Leases
          </ActionButton>

          <div
            className="
              flex
              min-h-[450px]
              items-center
              justify-center
              rounded-2xl
              border
              border-gray-200
              bg-white
              shadow-sm
              dark:border-gray-800
              dark:bg-gray-900
            "
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex flex-col items-center text-center">
              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-primary-50
                  dark:bg-primary-950/40
                "
              >
                <Loader2
                  className="h-7 w-7 animate-spin text-primary-600 dark:text-primary-400"
                  aria-hidden="true"
                />
              </div>

              <h2 className="mt-4 text-sm font-bold text-gray-900 dark:text-white">
                Loading Lease
              </h2>

              <p className="mt-1 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
                Please wait while we load the lease
                details.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error / Empty State
  |--------------------------------------------------------------------------
  */

  if (!lease) {
    return (
      <div className="min-h-full bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <ActionButton
            onClick={() =>
              navigate(LEASE_LIST_ROUTE)
            }
            icon={
              <ArrowLeft
                className="h-4 w-4"
                aria-hidden="true"
              />
            }
          >
            Back to Leases
          </ActionButton>

          <div
            className="
              overflow-hidden
              rounded-2xl
              border
              border-red-200
              bg-white
              shadow-sm
              dark:border-red-900/60
              dark:bg-gray-900
            "
          >
            <div className="flex min-h-[360px] flex-col items-center justify-center p-6 text-center">
              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-red-50
                  dark:bg-red-950/30
                "
              >
                <XCircle
                  className="h-7 w-7 text-red-600 dark:text-red-400"
                  aria-hidden="true"
                />
              </div>

              <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                Unable to Load Lease
              </h2>

              <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500 dark:text-gray-400">
                {getErrorMessage(error)}
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <ActionButton
                  variant="primary"
                  onClick={() =>
                    void refreshLease()
                  }
                  disabled={loadingDetails}
                  icon={
                    loadingDetails ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )
                  }
                >
                  Try Again
                </ActionButton>

                <ActionButton
                  onClick={() =>
                    navigate(LEASE_LIST_ROUTE)
                  }
                  icon={
                    <ArrowLeft className="h-4 w-4" />
                  }
                >
                  Back to Leases
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Main View
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* ---------------------------------------------------------------- */}
        {/* PAGE HEADER                                                      */}
        {/* ---------------------------------------------------------------- */}

        <div
          className="
            flex
            flex-col
            gap-5
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div className="min-w-0">
            <button
              type="button"
              onClick={handleBack}
              disabled={actionLoading}
              className="
                mb-4
                inline-flex
                items-center
                gap-2
                text-sm
                font-medium
                text-gray-500
                transition
                hover:text-gray-900
                disabled:cursor-not-allowed
                disabled:opacity-50
                dark:text-gray-400
                dark:hover:text-white
              "
            >
              <ArrowLeft
                className="h-4 w-4"
                aria-hidden="true"
              />
              Back to Leases
            </button>

            <div className="flex items-start gap-3">
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-primary-50
                  text-primary-600
                  dark:bg-primary-950/40
                  dark:text-primary-400
                "
              >
                <FileText
                  className="h-6 w-6"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    className="
                      text-2xl
                      font-bold
                      tracking-tight
                      text-gray-900
                      dark:text-white
                    "
                  >
                    Lease Details
                  </h1>

                  <StatusBadge status={status} />

                  {lease.is_active !==
                    undefined && (
                    <ActiveBadge
                      active={
                        lease.is_active
                      }
                    />
                  )}
                </div>

                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  View lease agreement, tenant,
                  property, payment and lifecycle
                  information.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ActionButton
              onClick={handleEdit}
              disabled={actionLoading}
              icon={
                <Edit3
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              }
            >
              Edit
            </ActionButton>

            {canActivate && (
              <ActionButton
                variant="primary"
                onClick={handleActivate}
                disabled={actionLoading}
                icon={
                  actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )
                }
              >
                Activate
              </ActionButton>
            )}

            {canTerminate && (
              <ActionButton
                variant="warning"
                onClick={handleTerminate}
                disabled={actionLoading}
                icon={
                  <XCircle
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                }
              >
                Terminate
              </ActionButton>
            )}

            {canCancel && (
              <ActionButton
                onClick={handleCancelLease}
                disabled={actionLoading}
                icon={
                  <XCircle
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                }
              >
                Cancel
              </ActionButton>
            )}

            <ActionButton
              variant="danger"
              onClick={handleDelete}
              disabled={actionLoading}
              icon={
                <Trash2
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              }
            >
              Delete
            </ActionButton>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* ERROR                                                            */}
        {/* ---------------------------------------------------------------- */}

        {error && (
          <div
            className="
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              dark:border-red-900/60
              dark:bg-red-950/30
            "
            role="alert"
          >
            <div className="flex items-start gap-3">
              <XCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
                aria-hidden="true"
              />

              <div className="min-w-0">
                <p className="text-sm font-bold text-red-900 dark:text-red-300">
                  Lease Error
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700 dark:text-red-400">
                  {getErrorMessage(error)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* LEASE SUMMARY                                                    */}
        {/* ---------------------------------------------------------------- */}

        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-gray-200
            bg-white
            shadow-sm
            dark:border-gray-800
            dark:bg-gray-900
          "
        >
          <div className="p-5 sm:p-6">
            <div
              className="
                flex
                flex-col
                gap-6
                xl:flex-row
                xl:items-center
                xl:justify-between
              "
            >
              <div className="flex items-center gap-4">
                <div
                  className="
                    flex
                    h-14
                    w-14
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-primary-50
                    text-base
                    font-bold
                    text-primary-600
                    dark:bg-primary-950/40
                    dark:text-primary-400
                  "
                >
                  {tenantInitials}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Lease
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    {leaseNumber}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {tenantDisplayName}
                  </p>
                </div>
              </div>

              <div
                className="
                  grid
                  grid-cols-2
                  gap-5
                  sm:grid-cols-3
                  xl:grid-cols-5
                "
              >
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Status
                  </p>

                  <div className="mt-1">
                    <StatusBadge
                      status={status}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Start Date
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDate(
                      lease.start_date,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    End Date
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDate(
                      lease.end_date,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Rent
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(
                      rentAmount,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Lease Type
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {getLeaseTypeLabel(
                      lease,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* TENANT INFORMATION                                               */}
        {/* ---------------------------------------------------------------- */}

        <DetailsSection
          icon={
            <UserRound
              className="h-5 w-5"
              aria-hidden="true"
            />
          }
          title="Tenant Information"
          description="Personal, identification and contact information associated with this lease."
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={<User className="h-4 w-4" />}
              label="Full Name"
              value={tenantName}
            />

            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Tenant Number"
              value={
                tenant?.tenant_number
              }
            />

            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="User Account ID"
              value={
                tenant?.user_id ??
                tenantUser?.id
              }
            />

            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="National ID"
              value={tenant?.id_number}
            />

            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Passport Number"
              value={
                tenant?.passport_number
              }
            />

            <InfoItem
              icon={
                <Phone className="h-4 w-4" />
              }
              label="Phone"
              value={
                tenant?.phone ||
                tenantUser?.phone
              }
            />

            <InfoItem
              icon={
                <User className="h-4 w-4" />
              }
              label="Email"
              value={
                tenant?.email ||
                tenantUser?.email
              }
            />

            <InfoItem
              icon={
                <User className="h-4 w-4" />
              }
              label="Gender"
              value={formatTypeLabel(
                tenant?.gender,
              )}
            />

            <InfoItem
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Date of Birth"
              value={formatDate(
                tenant?.date_of_birth,
              )}
            />

            <InfoItem
              icon={
                <MapPin className="h-4 w-4" />
              }
              label="Nationality"
              value={tenant?.nationality}
            />

            <InfoItem
              icon={
                <MapPin className="h-4 w-4" />
              }
              label="Country"
              value={tenant?.country}
            />

            <InfoItem
              icon={
                <MapPin className="h-4 w-4" />
              }
              label="County"
              value={tenant?.county}
            />

            <InfoItem
              icon={
                <MapPin className="h-4 w-4" />
              }
              label="City"
              value={tenant?.city}
            />

            <InfoItem
              icon={
                <MapPin className="h-4 w-4" />
              }
              label="Postal Code"
              value={
                tenant?.postal_code
              }
            />

            <InfoItem
              icon={
                <MapPin className="h-4 w-4" />
              }
              label="Address"
              value={tenant?.address}
            />

            <InfoItem
              icon={
                <BadgeCheck className="h-4 w-4" />
              }
              label="Tenant Status"
            >
              <div className="mt-1">
                <StatusBadge
                  status={tenant?.status}
                />
              </div>
            </InfoItem>

            <InfoItem
              icon={
                <CheckCircle2 className="h-4 w-4" />
              }
              label="Verification"
              value={
                tenant?.verification_status ||
                (normalizeBoolean(
                  tenant?.is_verified,
                )
                  ? "Verified"
                  : "Not Verified")
              }
            />
          </div>
        </DetailsSection>

        {/* ---------------------------------------------------------------- */}
        {/* PROPERTY & UNIT                                                  */}
        {/* ---------------------------------------------------------------- */}

        <DetailsSection
          icon={
            <Building2
              className="h-5 w-5"
              aria-hidden="true"
            />
          }
          title="Property & Unit"
          description="Property, apartment and unit assigned to the lease through the tenancy."
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={
                <Building2 className="h-4 w-4" />
              }
              label="Property"
              value={propertyName}
            />

            <InfoItem
              icon={
                <Home className="h-4 w-4" />
              }
              label="Apartment"
              value={apartmentName}
            />

            <InfoItem
              icon={
                <Home className="h-4 w-4" />
              }
              label="Unit"
              value={unitName}
            />

            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Property ID"
              value={
                tenancy?.property_id ??
                property?.id
              }
            />

            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Apartment ID"
              value={
                tenancy?.apartment_id ??
                apartment?.id
              }
            />

            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Unit ID"
              value={
                tenancy?.unit_id ??
                unit?.id
              }
            />

            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Property Code"
              value={
                property?.property_code
              }
            />

            <InfoItem
              icon={
                <MapPin className="h-4 w-4" />
              }
              label="Location"
              value={
                property?.full_location
              }
            />

            <InfoItem
              icon={
                <MapPin className="h-4 w-4" />
              }
              label="Street Address"
              value={
                property?.street_address ||
                property?.address
              }
            />

            <InfoItem
              icon={
                <Home className="h-4 w-4" />
              }
              label="Unit Number"
              value={
                unit?.unit_number
              }
            />

            <InfoItem
              icon={
                <Home className="h-4 w-4" />
              }
              label="Unit Type"
              value={
                unit?.type_label ||
                formatTypeLabel(
                  unit?.unit_type ||
                    unit?.type,
                )
              }
            />

            <InfoItem
              icon={
                <Wallet className="h-4 w-4" />
              }
              label="Unit Price"
              value={formatCurrency(
                unit?.price,
              )}
            />

            <InfoItem
              icon={
                <Home className="h-4 w-4" />
              }
              label="Bedrooms"
              value={unit?.bedrooms}
            />

            <InfoItem
              icon={
                <Home className="h-4 w-4" />
              }
              label="Bathrooms"
              value={unit?.bathrooms}
            />

            <InfoItem
              icon={
                <Home className="h-4 w-4" />
              }
              label="Floor"
              value={unit?.floor}
            />

            <InfoItem
              icon={
                <Home className="h-4 w-4" />
              }
              label="Unit Size"
              value={
                hasValue(unit?.size)
                  ? `${unit.size} ${
                      unit?.size_unit ||
                      "sqm"
                    }`
                  : "—"
              }
            />

            <InfoItem
              icon={
                <BadgeCheck className="h-4 w-4" />
              }
              label="Unit Status"
              value={
                unit?.status_label ||
                formatTypeLabel(
                  unit?.status,
                )
              }
            />
          </div>
        </DetailsSection>

        {/* ---------------------------------------------------------------- */}
        {/* LEASE CONFIGURATION                                               */}
        {/* ---------------------------------------------------------------- */}

        <DetailsSection
          icon={
            <FileCheck2
              className="h-5 w-5"
              aria-hidden="true"
            />
          }
          title="Lease Configuration"
          description="Core lease identification, duration, status and notice requirements."
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Lease Number"
              value={leaseNumber}
            />

            <InfoItem
              icon={
                <BadgeCheck className="h-4 w-4" />
              }
              label="Lease Status"
            >
              <div className="mt-1">
                <StatusBadge
                  status={status}
                />
              </div>
            </InfoItem>

            <InfoItem
              icon={
                <FileCheck2 className="h-4 w-4" />
              }
              label="Lease Type"
              value={getLeaseTypeLabel(
                lease,
              )}
            />

            <InfoItem
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Start Date"
              value={formatDate(
                lease.start_date,
              )}
            />

            <InfoItem
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="End Date"
              value={formatDate(
                lease.end_date,
              )}
            />

            <InfoItem
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Signed At"
              value={formatDateTime(
                lease.signed_at,
              )}
            />

            <InfoItem
              icon={
                <Clock3 className="h-4 w-4" />
              }
              label="Notice Period"
              value={
                hasValue(
                  lease.notice_period_days,
                )
                  ? `${lease.notice_period_days} days`
                  : "—"
              }
            />

            <InfoItem
              icon={
                <Clock3 className="h-4 w-4" />
              }
              label="Expired"
              value={
                lease.is_expired !==
                undefined
                  ? normalizeBoolean(
                      lease.is_expired,
                    )
                    ? "Yes"
                    : "No"
                  : "—"
              }
            />

            <InfoItem
              icon={
                <CheckCircle2 className="h-4 w-4" />
              }
              label="Active"
              value={
                lease.is_active !==
                undefined
                  ? normalizeBoolean(
                      lease.is_active,
                    )
                    ? "Yes"
                    : "No"
                  : "—"
              }
            />

            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Tenancy Number"
              value={
                tenancy?.tenancy_number
              }
            />

            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Tenancy ID"
              value={
                lease.tenancy_id ??
                tenancy?.id
              }
            />

            <InfoItem
              icon={
                <CheckCircle2 className="h-4 w-4" />
              }
              label="Tenancy Currently Active"
              value={
                tenancy?.is_currently_active !==
                undefined
                  ? normalizeBoolean(
                      tenancy.is_currently_active,
                    )
                    ? "Yes"
                    : "No"
                  : "—"
              }
            />
          </div>
        </DetailsSection>

        {/* ---------------------------------------------------------------- */}
        {/* RENTAL & PAYMENT                                                 */}
        {/* ---------------------------------------------------------------- */}

        <DetailsSection
          icon={
            <Wallet
              className="h-5 w-5"
              aria-hidden="true"
            />
          }
          title="Rental & Payment Information"
          description="Financial and payment configuration defined specifically for this lease."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className="
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                p-4
                dark:border-gray-800
                dark:bg-gray-800/50
              "
            >
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary-600 dark:text-primary-400" />

                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Monthly Rent
                </p>
              </div>

              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(
                  rentAmount,
                )}
              </p>
            </div>

            <div
              className="
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                p-4
                dark:border-gray-800
                dark:bg-gray-800/50
              "
            >
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary-600 dark:text-primary-400" />

                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Security Deposit
                </p>
              </div>

              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(
                  depositAmount,
                )}
              </p>
            </div>

            <div
              className="
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                p-4
                dark:border-gray-800
                dark:bg-gray-800/50
              "
            >
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary-600 dark:text-primary-400" />

                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Service Charge
                </p>
              </div>

              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(
                  serviceCharge,
                )}
              </p>
            </div>

            <div
              className="
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                p-4
                dark:border-gray-800
                dark:bg-gray-800/50
              "
            >
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary-600 dark:text-primary-400" />

                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Late Fee
                </p>
              </div>

              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(
                  lateFee,
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={
                <CreditCard className="h-4 w-4" />
              }
              label="Payment Frequency"
              value={getPaymentFrequencyLabel(
                lease.payment_frequency,
              )}
            />

            <InfoItem
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Payment Due Day"
              value={
                lease.due_day !== null &&
                lease.due_day !== undefined &&
                lease.due_day !== ""
                  ? `Day ${lease.due_day}`
                  : "—"
              }
            />
          </div>
        </DetailsSection>

        {/* ---------------------------------------------------------------- */}
        {/* TERMINATION INFORMATION                                          */}
        {/* ---------------------------------------------------------------- */}

        {(lease.terminated_at ||
          lease.termination_reason) && (
          <DetailsSection
            icon={
              <XCircle
                className="h-5 w-5"
                aria-hidden="true"
              />
            }
            title="Termination Information"
            description="Information recorded when this lease was terminated."
          >
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem
                icon={
                  <CalendarDays className="h-4 w-4" />
                }
                label="Terminated At"
                value={formatDateTime(
                  lease.terminated_at,
                )}
              />

              <InfoItem
                icon={
                  <FileText className="h-4 w-4" />
                }
                label="Termination Reason"
                value={
                  lease.termination_reason
                }
              />

              <InfoItem
                icon={
                  <XCircle className="h-4 w-4" />
                }
                label="Terminated"
                value={
                  normalizeBoolean(
                    lease.is_terminated,
                  )
                    ? "Yes"
                    : "No"
                }
              />
            </div>
          </DetailsSection>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* LEASE AGREEMENT                                                  */}
        {/* ---------------------------------------------------------------- */}

        <DetailsSection
          icon={
            <FileCheck2
              className="h-5 w-5"
              aria-hidden="true"
            />
          }
          title="Lease Agreement"
          description="Agreement document information associated with this lease."
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Agreement Status"
              value={
                agreementAvailable
                  ? "Available"
                  : "No Agreement"
              }
            />

            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Document Path"
              value={
                lease.document_path
              }
            />

            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Public ID"
              value={
                lease.agreement_public_id ||
                lease.agreement?.public_id
              }
            />

            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Agreement File"
            >
              {agreementFile ? (
                <div className="mt-1">
                  <a
                    href={agreementFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      inline-flex
                      items-center
                      gap-2
                      text-sm
                      font-semibold
                      text-primary-600
                      transition
                      hover:text-primary-700
                      dark:text-primary-400
                      dark:hover:text-primary-300
                    "
                  >
                    <FileText className="h-4 w-4" />

                    View Agreement

                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : (
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  No agreement uploaded
                </p>
              )}
            </InfoItem>
          </div>
        </DetailsSection>

        {/* ---------------------------------------------------------------- */}
        {/* NOTES                                                            */}
        {/* ---------------------------------------------------------------- */}

        {hasValue(lease.notes) && (
          <DetailsSection
            icon={
              <FileText
                className="h-5 w-5"
                aria-hidden="true"
              />
            }
            title="Notes"
            description="Additional information recorded for this lease."
          >
            <div
              className="
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                p-4
                dark:border-gray-800
                dark:bg-gray-800/50
              "
            >
              <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700 dark:text-gray-300">
                {lease.notes}
              </p>
            </div>
          </DetailsSection>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* RECORD INFORMATION                                               */}
        {/* ---------------------------------------------------------------- */}

        <DetailsSection
          icon={
            <Clock3
              className="h-5 w-5"
              aria-hidden="true"
            />
          }
          title="Record Information"
          description="System identifiers and timestamps for this lease record."
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Lease ID"
              value={lease.id}
            />

            <InfoItem
              icon={
                <FileText className="h-4 w-4" />
              }
              label="Tenancy ID"
              value={
                lease.tenancy_id ??
                tenancy?.id
              }
            />

            <InfoItem
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Created At"
              value={formatDateTime(
                lease.created_at,
              )}
            />

            <InfoItem
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Last Updated"
              value={formatDateTime(
                lease.updated_at,
              )}
            />

            <InfoItem
              icon={
                <CalendarDays className="h-4 w-4" />
              }
              label="Deleted At"
              value={formatDateTime(
                lease.deleted_at,
              )}
            />
          </div>
        </DetailsSection>

        {/* ---------------------------------------------------------------- */}
        {/* STICKY FOOTER ACTIONS                                            */}
        {/* ---------------------------------------------------------------- */}
        {/*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        | The bottom action bar intentionally contains ONLY:
        |
        |   1. Back to Leases
        |   2. Edit Lease
        |
        | Lifecycle and destructive actions remain in the page header.
        |--------------------------------------------------------------------------
        */}

        <div
          className="
            sticky
            bottom-0
            z-20
            rounded-2xl
            border
            border-gray-200
            bg-white/95
            p-4
            shadow-xl
            backdrop-blur
            dark:border-gray-800
            dark:bg-gray-900/95
          "
        >
          <div
            className="
              flex
              flex-col-reverse
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            {/* Back */}
            <ActionButton
              onClick={handleBack}
              disabled={actionLoading}
              icon={
                <ArrowLeft
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              }
              className="w-full sm:w-auto"
            >
              Back to Leases
            </ActionButton>

            {/* Edit */}
            <ActionButton
              variant="primary"
              onClick={handleEdit}
              disabled={actionLoading}
              icon={
                <Edit3
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              }
              className="w-full sm:w-auto"
            >
              Edit Lease
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaseDetails;