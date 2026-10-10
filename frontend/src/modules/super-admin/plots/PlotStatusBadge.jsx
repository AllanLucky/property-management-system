
import {
  Ban,
  CheckCircle2,
  Clock3,
  EyeOff,
  HelpCircle,
  ShoppingBag,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| PLOT STATUS CONFIGURATION
|--------------------------------------------------------------------------
*/

const PLOT_STATUS_CONFIG = {
  available: {
    label: "Available",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },

  reserved: {
    label: "Reserved",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock3,
  },

  sold: {
    label: "Sold",
    className:
      "border-blue-200 bg-blue-50 text-blue-700",
    icon: ShoppingBag,
  },

  unavailable: {
    label: "Unavailable",
    className:
      "border-gray-200 bg-gray-100 text-gray-600",
    icon: Ban,
  },
};

/*
|--------------------------------------------------------------------------
| NORMALIZE STATUS
|--------------------------------------------------------------------------
*/

const normalizeStatus = (status) => {
  if (status === null || status === undefined || status === "") {
    return "unknown";
  }

  return String(status)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
};

/*
|--------------------------------------------------------------------------
| FORMAT LABEL
|--------------------------------------------------------------------------
*/

const formatStatusLabel = (status) => {
  return String(status)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

/*
|--------------------------------------------------------------------------
| PLOT STATUS BADGE
|--------------------------------------------------------------------------
|
| Supported props:
| - status: available, reserved, sold, unavailable
| - isActive: optional active/inactive indicator
| - showIcon: show or hide the status icon
| - size: sm, md, lg
| - className: additional Tailwind classes
| - showInactive: display an additional Inactive badge
|
*/

const PlotStatusBadge = ({
  status = "available",
  isActive,
  showIcon = true,
  showInactive = true,
  size = "md",
  className = "",
}) => {
  const normalizedStatus = normalizeStatus(status);

  const config =
    PLOT_STATUS_CONFIG[normalizedStatus] || {
      label: formatStatusLabel(normalizedStatus),
      className:
        "border-gray-200 bg-gray-50 text-gray-600",
      icon: HelpCircle,
    };

  const StatusIcon = config.icon;

  const sizeClasses = {
    sm: {
      badge: "px-2 py-0.5 text-[10px] gap-1",
      icon: "h-3 w-3",
    },
    md: {
      badge: "px-2.5 py-1 text-xs gap-1.5",
      icon: "h-3.5 w-3.5",
    },
    lg: {
      badge: "px-3 py-1.5 text-sm gap-2",
      icon: "h-4 w-4",
    },
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  const isInactive =
    isActive === false ||
    isActive === 0 ||
    isActive === "0" ||
    isActive === "false";

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      {/* Plot Status */}

      <span
        className={`inline-flex items-center rounded-full border font-semibold leading-5 ${selectedSize.badge} ${config.className} ${className}`}
        title={`Plot status: ${config.label}`}
      >
        {showIcon && (
          <StatusIcon
            className={`${selectedSize.icon} shrink-0`}
            aria-hidden="true"
          />
        )}

        <span>{config.label}</span>
      </span>

      {/* Active / Inactive Status */}

      {showInactive && isInactive && (
        <span
          className={`inline-flex items-center rounded-full border border-red-200 bg-red-50 font-semibold leading-5 text-red-700 ${selectedSize.badge}`}
          title="This plot is inactive"
        >
          <EyeOff
            className={`${selectedSize.icon} shrink-0`}
            aria-hidden="true"
          />

          <span>Inactive</span>
        </span>
      )}
    </div>
  );
};

export default PlotStatusBadge;
