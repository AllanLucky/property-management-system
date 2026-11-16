
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| County Status Badge
|--------------------------------------------------------------------------
*/

const CountyStatusBadge = ({
  county,
  status,
  isActive,
  className = "",
  showIcon = true,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Determine Status
  |--------------------------------------------------------------------------
  */

  const resolveStatus = () => {
    const value =
      status ??
      county?.status ??
      county?.is_active ??
      isActive;

    if (value === true || value === 1 || value === "1") {
      return "active";
    }

    if (value === false || value === 0 || value === "0") {
      return "inactive";
    }

    const normalized = String(value || "").toLowerCase().trim();

    if (["active", "enabled", "approved"].includes(normalized)) {
      return "active";
    }

    if (["inactive", "disabled", "suspended"].includes(normalized)) {
      return "inactive";
    }

    return "unknown";
  };

  const currentStatus = resolveStatus();

  /*
  |--------------------------------------------------------------------------
  | Badge Configuration
  |--------------------------------------------------------------------------
  */

  const configurations = {
    active: {
      label: county?.status_label || "Active",
      icon: CheckCircle2,
      styles: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      iconColor: "text-emerald-600",
    },

    inactive: {
      label: county?.status_label || "Inactive",
      icon: XCircle,
      styles: "bg-red-50 text-red-700 ring-red-600/20",
      iconColor: "text-red-600",
    },

    unknown: {
      label: county?.status_label || "Unknown",
      icon: AlertCircle,
      styles: "bg-gray-100 text-gray-600 ring-gray-500/20",
      iconColor: "text-gray-500",
    },
  };

  const config = configurations[currentStatus];
  const StatusIcon = config.icon;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        whitespace-nowrap
        rounded-full
        px-2.5
        py-1
        text-xs
        font-semibold
        ring-1
        ring-inset
        ${config.styles}
        ${className}
      `}
    >
      {showIcon && (
        <StatusIcon
          className={`h-3.5 w-3.5 ${config.iconColor}`}
        />
      )}

      {config.label}
    </span>
  );
};

export default CountyStatusBadge;
