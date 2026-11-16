
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Area Status Badge
|--------------------------------------------------------------------------
*/

const AreaStatusBadge = ({
  status,
  label,
  size = "md",
  showIcon = true,
  className = "",
}) => {
  /*
  |--------------------------------------------------------------------------
  | Normalize Status
  |--------------------------------------------------------------------------
  */

  const normalizeStatus = () => {
    if (typeof status === "boolean") {
      return status ? "active" : "inactive";
    }

    if (typeof status === "number") {
      return status === 1 ? "active" : "inactive";
    }

    const normalized = String(
      status ?? label ?? ""
    )
      .trim()
      .toLowerCase();

    if (
      ["active", "enabled", "published", "1", "true"].includes(normalized)
    ) {
      return "active";
    }

    if (
      ["inactive", "disabled", "unpublished", "0", "false"].includes(normalized)
    ) {
      return "inactive";
    }

    return "unknown";
  };

  const normalizedStatus = normalizeStatus();

  /*
  |--------------------------------------------------------------------------
  | Badge Configuration
  |--------------------------------------------------------------------------
  */

  const configurations = {
    active: {
      text: "Active",
      icon: CheckCircle2,
      styles: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    },

    inactive: {
      text: "Inactive",
      icon: XCircle,
      styles: "bg-slate-100 text-slate-600 ring-slate-500/20",
    },

    unknown: {
      text: "Unknown",
      icon: AlertCircle,
      styles: "bg-amber-50 text-amber-700 ring-amber-600/20",
    },
  };

  const config = configurations[normalizedStatus];

  const StatusIcon = config.icon;

  /*
  |--------------------------------------------------------------------------
  | Size Configuration
  |--------------------------------------------------------------------------
  */

  const sizeStyles = {
    sm: {
      wrapper: "px-2 py-0.5 text-[10px]",
      icon: "h-3 w-3",
    },

    md: {
      wrapper: "px-2.5 py-1 text-xs",
      icon: "h-3.5 w-3.5",
    },

    lg: {
      wrapper: "px-3 py-1.5 text-sm",
      icon: "h-4 w-4",
    },
  };

  const selectedSize = sizeStyles[size] || sizeStyles.md;

  /*
  |--------------------------------------------------------------------------
  | Display Label
  |--------------------------------------------------------------------------
  */

  const displayLabel =
    label ||
    config.text;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${selectedSize.wrapper} ${config.styles} ${className}`}
    >
      {showIcon && (
        <StatusIcon className={selectedSize.icon} />
      )}

      <span>{displayLabel}</span>
    </span>
  );
};

export default AreaStatusBadge;
