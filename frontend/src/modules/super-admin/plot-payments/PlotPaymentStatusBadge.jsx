
import {
  CheckCircle2,
  Clock3,
  XCircle,
  Ban,
  RefreshCcw,
  HelpCircle,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| PAYMENT STATUS CONFIGURATION
|--------------------------------------------------------------------------
*/

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "yellow",
    icon: Clock3,
    container:
      "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    dot: "bg-yellow-500",
  },

  completed: {
    label: "Completed",
    color: "green",
    icon: CheckCircle2,
    container:
      "bg-green-50 text-green-700 ring-green-600/20",
    dot: "bg-green-500",
  },

  failed: {
    label: "Failed",
    color: "red",
    icon: XCircle,
    container:
      "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
  },

  cancelled: {
    label: "Cancelled",
    color: "gray",
    icon: Ban,
    container:
      "bg-gray-100 text-gray-700 ring-gray-500/20",
    dot: "bg-gray-500",
  },

  refunded: {
    label: "Refunded",
    color: "purple",
    icon: RefreshCcw,
    container:
      "bg-purple-50 text-purple-700 ring-purple-600/20",
    dot: "bg-purple-500",
  },
};

const UNKNOWN_STATUS = {
  label: "Unknown",
  color: "gray",
  icon: HelpCircle,
  container:
    "bg-gray-100 text-gray-600 ring-gray-500/20",
  dot: "bg-gray-400",
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const normalizeStatus = (status) => {
  if (!status) return "";

  return String(status)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
};

const formatStatusLabel = (status) => {
  if (!status) return "Unknown";

  return String(status)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

/*
|--------------------------------------------------------------------------
| PLOT PAYMENT STATUS BADGE
|--------------------------------------------------------------------------
*/

const PlotPaymentStatusBadge = ({
  status,
  size = "md",
  showIcon = true,
  showDot = false,
  className = "",
  label,
}) => {
  const normalizedStatus = normalizeStatus(status);

  const config =
    STATUS_CONFIG[normalizedStatus] || UNKNOWN_STATUS;

  const Icon = config.icon;

  const displayLabel =
    label ||
    (STATUS_CONFIG[normalizedStatus]
      ? config.label
      : formatStatusLabel(status));

  const sizeClasses = {
    xs: "px-2 py-0.5 text-[10px] gap-1",
    sm: "px-2.5 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-xs gap-1.5",
    lg: "px-3.5 py-2 text-sm gap-2",
  };

  const iconSizes = {
    xs: 11,
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      title={`Payment status: ${displayLabel}`}
      className={`
        inline-flex w-fit items-center whitespace-nowrap
        rounded-full font-semibold ring-1 ring-inset
        ${config.container}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
    >
      {showDot ? (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dot}`}
          aria-hidden="true"
        />
      ) : (
        showIcon && (
          <Icon
            size={iconSizes[size] || iconSizes.md}
            strokeWidth={2.2}
            className="shrink-0"
            aria-hidden="true"
          />
        )
      )}

      <span>{displayLabel}</span>
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| NAMED EXPORTS
|--------------------------------------------------------------------------
*/

export { STATUS_CONFIG };

export default PlotPaymentStatusBadge;
