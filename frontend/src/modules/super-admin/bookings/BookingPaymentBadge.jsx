import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  RotateCcw,
  WalletCards,
  XCircle,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Payment Status Configuration
|--------------------------------------------------------------------------
*/

const PAYMENT_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock3,
  },

  partial: {
    label: "Partially Paid",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: WalletCards,
  },

  paid: {
    label: "Paid",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },

  failed: {
    label: "Failed",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: XCircle,
  },

  refunded: {
    label: "Refunded",
    className: "border-purple-200 bg-purple-50 text-purple-700",
    icon: RotateCcw,
  },
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Normalize payment status returned by the API.
 *
 * Examples:
 * pending       -> pending
 * PENDING       -> pending
 * "Partially Paid" -> partially_paid
 */
const normalizePaymentStatus = (status) => {
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
 * Convert an unknown payment status into a readable label.
 */
const formatPaymentStatusLabel = (status) => {
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

const BookingPaymentBadge = ({
  paymentStatus,
  status,
  showIcon = true,
  size = "md",
  className = "",
}) => {
  /*
  |--------------------------------------------------------------------------
  | Support Multiple Prop Names
  |--------------------------------------------------------------------------
  |
  | paymentStatus is preferred.
  | status is supported for convenience.
  |
  */

  const rawStatus = paymentStatus ?? status;

  const normalizedStatus = normalizePaymentStatus(rawStatus);

  /*
  |--------------------------------------------------------------------------
  | Handle Alternative API Values
  |--------------------------------------------------------------------------
  */

  const statusAliases = {
    partially_paid: "partial",
    partly_paid: "partial",
    unpaid: "pending",
    complete: "paid",
    completed: "paid",
    success: "paid",
    successful: "paid",
    cancelled: "failed",
    canceled: "failed",
  };

  const resolvedStatus =
    statusAliases[normalizedStatus] ?? normalizedStatus;

  const config =
    PAYMENT_STATUS_CONFIG[resolvedStatus] || {
      label: formatPaymentStatusLabel(rawStatus),
      className:
        "border-gray-200 bg-gray-50 text-gray-600",
      icon: AlertCircle,
    };

  const Icon = config.icon;

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

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <span
      title={`Payment status: ${config.label}`}
      className={[
        "inline-flex max-w-full items-center rounded-full border",
        "font-semibold leading-none whitespace-nowrap",
        "transition-colors duration-150",
        config.className,
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
        {config.label}
      </span>
    </span>
  );
};

export default BookingPaymentBadge;