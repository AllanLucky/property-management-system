import {
  AlertCircle,
  Ban,
  CheckCircle2,
  CircleCheck,
  Clock3,
  FileCheck2,
  XCircle,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Status Configuration
|--------------------------------------------------------------------------
*/

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock3,
  },

  confirmed: {
    label: "Confirmed",
    className:
      "border-blue-200 bg-blue-50 text-blue-700",
    icon: CircleCheck,
  },

  approved: {
    label: "Approved",
    className:
      "border-indigo-200 bg-indigo-50 text-indigo-700",
    icon: FileCheck2,
  },

  rejected: {
    label: "Rejected",
    className:
      "border-red-200 bg-red-50 text-red-700",
    icon: XCircle,
  },

  cancelled: {
    label: "Cancelled",
    className:
      "border-gray-200 bg-gray-50 text-gray-600",
    icon: Ban,
  },

  completed: {
    label: "Completed",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },

  expired: {
    label: "Expired",
    className:
      "border-orange-200 bg-orange-50 text-orange-700",
    icon: AlertCircle,
  },
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Normalize status values coming from the API.
 *
 * Examples:
 * pending       -> pending
 * PENDING       -> pending
 * " Pending "   -> pending
 */
const normalizeStatus = (status) => {
  if (!status) {
    return "pending";
  }

  return String(status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
};

/**
 * Convert an unknown status into a readable label.
 */
const formatStatusLabel = (status) => {
  if (!status) {
    return "Unknown";
  }

  return String(status)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const BookingStatusBadge = ({
  status,
  showIcon = true,
  size = "md",
  className = "",
}) => {
  const normalizedStatus = normalizeStatus(status);

  const config = STATUS_CONFIG[normalizedStatus];

  const statusConfig = config || {
    label: formatStatusLabel(status),
    className:
      "border-gray-200 bg-gray-50 text-gray-600",
    icon: AlertCircle,
  };

  const Icon = statusConfig.icon;

  /*
  |--------------------------------------------------------------------------
  | Size Variants
  |--------------------------------------------------------------------------
  */

  const sizeClasses = {
    sm: {
      wrapper: "gap-1 px-2 py-0.5 text-[11px]",
      icon: "h-3 w-3",
    },

    md: {
      wrapper: "gap-1.5 px-2.5 py-1 text-xs",
      icon: "h-3.5 w-3.5",
    },

    lg: {
      wrapper: "gap-2 px-3 py-1.5 text-sm",
      icon: "h-4 w-4",
    },
  };

  const selectedSize =
    sizeClasses[size] || sizeClasses.md;

  return (
    <span
      title={`Booking status: ${statusConfig.label}`}
      className={[
        "inline-flex max-w-full items-center rounded-full border font-semibold leading-none whitespace-nowrap",
        "transition-colors duration-150",
        statusConfig.className,
        selectedSize.wrapper,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showIcon && (
        <Icon
          className={`shrink-0 ${selectedSize.icon}`}
          aria-hidden="true"
        />
      )}

      <span className="truncate">
        {statusConfig.label}
      </span>
    </span>
  );
};

export default BookingStatusBadge;