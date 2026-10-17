import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock3,
  CreditCard,
  LoaderCircle,
  ShieldCheck,
  Wallet,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Status Configuration
|--------------------------------------------------------------------------
*/

const SALE_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    description: "Awaiting processing",
    className:
      "border-amber-200/80 bg-amber-50/80 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300",
    icon: Clock3,
    dotClassName: "bg-amber-500",
  },

  reserved: {
    label: "Reserved",
    description: "Plot reserved for the buyer",
    className:
      "border-blue-200/80 bg-blue-50/80 text-blue-800 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300",
    icon: ShieldCheck,
    dotClassName: "bg-blue-500",
  },

  approved: {
    label: "Approved",
    description: "Sale approved",
    className:
      "border-indigo-200/80 bg-indigo-50/80 text-indigo-800 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300",
    icon: CheckCircle2,
    dotClassName: "bg-indigo-500",
  },

  completed: {
    label: "Completed",
    description: "Sale completed",
    className:
      "border-emerald-200/80 bg-emerald-50/80 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: CheckCircle2,
    dotClassName: "bg-emerald-500",
  },

  cancelled: {
    label: "Cancelled",
    description: "Sale cancelled",
    className:
      "border-rose-200/80 bg-rose-50/80 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300",
    icon: Ban,
    dotClassName: "bg-rose-500",
  },
};

const PAYMENT_STATUS_CONFIG = {
  paid: {
    label: "Paid",
    description: "Payment completed",
    className:
      "border-emerald-200/80 bg-emerald-50/80 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: CheckCircle2,
    dotClassName: "bg-emerald-500",
  },

  partial: {
    label: "Partially Paid",
    description: "Payment partially completed",
    className:
      "border-amber-200/80 bg-amber-50/80 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300",
    icon: Wallet,
    dotClassName: "bg-amber-500",
  },

  unpaid: {
    label: "Unpaid",
    description: "No payment recorded",
    className:
      "border-rose-200/80 bg-rose-50/80 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300",
    icon: CreditCard,
    dotClassName: "bg-rose-500",
  },

  outstanding: {
    label: "Outstanding",
    description: "Payment balance remains",
    className:
      "border-orange-200/80 bg-orange-50/80 text-orange-800 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300",
    icon: AlertCircle,
    dotClassName: "bg-orange-500",
  },

  overdue: {
    label: "Overdue",
    description: "Payment requires attention",
    className:
      "border-rose-200/80 bg-rose-50/80 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300",
    icon: Clock3,
    dotClassName: "bg-rose-500",
  },
};

const GENERAL_STATUS_CONFIG = {
  active: {
    label: "Active",
    description: "Currently active",
    className:
      "border-emerald-200/80 bg-emerald-50/80 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: CheckCircle2,
    dotClassName: "bg-emerald-500",
  },

  inactive: {
    label: "Inactive",
    description: "Currently inactive",
    className:
      "border-gray-200 bg-gray-100/80 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
    icon: Ban,
    dotClassName: "bg-gray-400",
  },

  processing: {
    label: "Processing",
    description: "Currently processing",
    className:
      "border-blue-200/80 bg-blue-50/80 text-blue-800 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300",
    icon: LoaderCircle,
    dotClassName: "bg-blue-500",
  },

  failed: {
    label: "Failed",
    description: "Operation failed",
    className:
      "border-rose-200/80 bg-rose-50/80 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300",
    icon: AlertCircle,
    dotClassName: "bg-rose-500",
  },
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normalizeStatus = (status) => {
  if (status === null || status === undefined || status === "") {
    return "";
  }

  return String(status)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
};

const formatStatusLabel = (status) => {
  if (status === null || status === undefined || status === "") {
    return "Unknown";
  }

  return String(status)
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

/*
|--------------------------------------------------------------------------
| Plot Sale Status Badge
|--------------------------------------------------------------------------
*/

const PlotSaleStatusBadge = ({
  status,
  type = "sale",
  variant,
  size = "md",
  showIcon = false,
  showDot = true,
  showLabel = true,
  className = "",
  title,
}) => {
  const normalizedStatus = normalizeStatus(status);
  const normalizedType = normalizeStatus(variant || type);

  /*
  |--------------------------------------------------------------------------
  | Resolve Status Configuration
  |--------------------------------------------------------------------------
  */

  let configuration = {};

  if (
    normalizedType === "payment" ||
    normalizedType === "payment_status"
  ) {
    configuration =
      PAYMENT_STATUS_CONFIG[normalizedStatus] || {};
  } else if (
    ["general", "account", "active"].includes(normalizedType)
  ) {
    configuration =
      GENERAL_STATUS_CONFIG[normalizedStatus] || {};
  } else {
    configuration =
      SALE_STATUS_CONFIG[normalizedStatus] || {};
  }

  /*
  |--------------------------------------------------------------------------
  | Fallback Values
  |--------------------------------------------------------------------------
  */

  const label =
    configuration.label || formatStatusLabel(status);

  const description =
    configuration.description || `${label} status`;

  const badgeClass =
    configuration.className ||
    "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300";

  const StatusIcon = configuration.icon;
  const dotClass = configuration.dotClassName || "bg-gray-400";

  /*
  |--------------------------------------------------------------------------
  | Size Configuration
  |--------------------------------------------------------------------------
  */

  const sizeClasses = {
    sm: {
      badge: "min-h-6 gap-1.5 px-2 py-0.5 text-[11px]",
      icon: "h-3 w-3",
      dot: "h-1.5 w-1.5",
    },

    md: {
      badge: "min-h-7 gap-1.5 px-2.5 py-1 text-xs",
      icon: "h-3.5 w-3.5",
      dot: "h-1.5 w-1.5",
    },

    lg: {
      badge: "min-h-8 gap-2 px-3 py-1.5 text-sm",
      icon: "h-4 w-4",
      dot: "h-2 w-2",
    },
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <span
      className={[
        "inline-flex max-w-full shrink-0 items-center justify-center",
        "rounded-full border font-semibold tracking-[0.01em]",
        "leading-4 transition-colors duration-150",
        selectedSize.badge,
        badgeClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={title || description}
      aria-label={`${label} status`}
    >
      {showDot && (
        <span
          className={[
            "relative inline-flex shrink-0 rounded-full",
            selectedSize.dot,
            dotClass,
          ].join(" ")}
          aria-hidden="true"
        />
      )}

      {showIcon && StatusIcon && (
        <StatusIcon
          className={[
            "shrink-0",
            selectedSize.icon,
            normalizedStatus === "processing" ? "animate-spin" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden="true"
        />
      )}

      {showLabel && (
        <span className="truncate">{label}</span>
      )}
    </span>
  );
};

export default PlotSaleStatusBadge;

export {
  SALE_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  GENERAL_STATUS_CONFIG
};
