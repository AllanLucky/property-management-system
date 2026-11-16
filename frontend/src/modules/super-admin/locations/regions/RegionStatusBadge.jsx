
import {
  CheckCircle2,
  XCircle,
  CircleHelp,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Region Status Configuration
|--------------------------------------------------------------------------
*/

const STATUS_CONFIG = {
  active: {
    label: "Active",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    dotColor: "bg-emerald-500",
  },

  inactive: {
    label: "Inactive",
    className:
      "bg-gray-100 text-gray-600 ring-gray-500/20",
    icon: XCircle,
    iconColor: "text-gray-500",
    dotColor: "bg-gray-400",
  },

  unknown: {
    label: "Unknown",
    className:
      "bg-amber-50 text-amber-700 ring-amber-600/20",
    icon: CircleHelp,
    iconColor: "text-amber-600",
    dotColor: "bg-amber-500",
  },
};

/*
|--------------------------------------------------------------------------
| Normalize Region Status
|--------------------------------------------------------------------------
*/

const normalizeStatus = (status) => {
  if (
    status === null ||
    status === undefined ||
    status === ""
  ) {
    return "unknown";
  }

  if (typeof status === "boolean") {
    return status ? "active" : "inactive";
  }

  if (typeof status === "number") {
    return status === 1 ? "active" : "inactive";
  }

  if (typeof status === "object") {
    if (status.is_active !== undefined) {
      return normalizeStatus(status.is_active);
    }

    status =
      status.status_label ||
      status.status ||
      status.label ||
      status.value ||
      "";
  }

  const normalized = String(status)
    .trim()
    .toLowerCase();

  if (
    [
      "1",
      "true",
      "yes",
      "on",
      "active",
      "enabled",
    ].includes(normalized)
  ) {
    return "active";
  }

  if (
    [
      "0",
      "false",
      "no",
      "off",
      "inactive",
      "disabled",
    ].includes(normalized)
  ) {
    return "inactive";
  }

  return "unknown";
};

/*
|--------------------------------------------------------------------------
| Region Status Badge
|--------------------------------------------------------------------------
*/

const RegionStatusBadge = ({
  status,
  isActive,
  showIcon = false,
  showDot = true,
  size = "sm",
  className = "",
}) => {
  const resolvedStatus = normalizeStatus(
    status ?? isActive
  );

  const config =
    STATUS_CONFIG[resolvedStatus] ||
    STATUS_CONFIG.unknown;

  const Icon = config.icon;

  const sizeStyles = {
    xs: "px-2 py-0.5 text-[10px]",
    sm: "px-2.5 py-1 text-[11px]",
    md: "px-3 py-1.5 text-xs",
  };

  const badgeSize =
    sizeStyles[size] || sizeStyles.sm;

  return (
    <span
      className={`
                inline-flex
                w-fit
                items-center
                gap-1.5
                whitespace-nowrap
                rounded-full
                font-semibold
                ring-1
                ring-inset
                ${config.className}
                ${badgeSize}
                ${className}
            `}
    >
      {showIcon ? (
        <Icon
          className={`
                        h-3.5
                        w-3.5
                        shrink-0
                        ${config.iconColor}
                    `}
        />
      ) : showDot ? (
        <span
          className={`
                        h-1.5
                        w-1.5
                        shrink-0
                        rounded-full
                        ${config.dotColor}
                    `}
        />
      ) : null}

      {config.label}
    </span>
  );
};

export default RegionStatusBadge;
