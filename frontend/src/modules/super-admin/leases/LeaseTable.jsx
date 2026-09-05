import {
  CalendarDays,
  ChevronRight,
  FileText,
  Home,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";

import LeaseActions from "./LeaseActions";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_CURRENCY = "KES";

const DEFAULT_LOADING_ROWS = 6;
const DEFAULT_MOBILE_LOADING_ROWS = 4;

/*
|--------------------------------------------------------------------------
| Formatting Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely convert a value to a finite number.
 */
const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

/**
 * Safely convert a value to a string.
 */
const toSafeString = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return fallback;
};

/**
 * Format a monetary value.
 */
const formatCurrency = (
  value,
  currency = DEFAULT_CURRENCY
) => {
  const amount = toNumber(value);

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-KE")}`;
  }
};

/**
 * Format a date safely.
 */
const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return toSafeString(value, "—");
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

/**
 * Normalize a status value.
 */
const normalizeStatus = (status) => {
  if (
    status === null ||
    status === undefined ||
    status === ""
  ) {
    return "unknown";
  }

  return String(status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
};

/**
 * Convert snake_case / kebab-case values into readable text.
 */
const humanize = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
};

/*
|--------------------------------------------------------------------------
| Lease Data Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely retrieve the tenancy relation.
 */
const getTenancy = (lease) => {
  return lease?.tenancy &&
    typeof lease.tenancy === "object"
    ? lease.tenancy
    : null;
};

/**
 * Safely retrieve the tenant relation.
 */
const getTenant = (lease) => {
  const tenancy = getTenancy(lease);

  return tenancy?.tenant &&
    typeof tenancy.tenant === "object"
    ? tenancy.tenant
    : null;
};

/**
 * Safely retrieve the user relation.
 */
const getUser = (lease) => {
  const tenancy = getTenancy(lease);

  return tenancy?.user &&
    typeof tenancy.user === "object"
    ? tenancy.user
    : null;
};

/**
 * Safely retrieve the property relation.
 */
const getProperty = (lease) => {
  const tenancy = getTenancy(lease);

  return tenancy?.property &&
    typeof tenancy.property === "object"
    ? tenancy.property
    : null;
};

/**
 * Safely retrieve the apartment relation.
 */
const getApartment = (lease) => {
  const tenancy = getTenancy(lease);

  return tenancy?.apartment &&
    typeof tenancy.apartment === "object"
    ? tenancy.apartment
    : null;
};

/**
 * Safely retrieve the unit relation.
 */
const getUnit = (lease) => {
  const tenancy = getTenancy(lease);

  return tenancy?.unit &&
    typeof tenancy.unit === "object"
    ? tenancy.unit
    : null;
};

/**
 * Get tenant display name.
 *
 * Priority:
 * 1. tenant.full_name
 * 2. tenant first/other/last names
 * 3. user.full_name
 * 4. user first/last names
 */
const getTenantName = (lease) => {
  const tenant = getTenant(lease);
  const user = getUser(lease);

  if (tenant?.full_name) {
    return toSafeString(
      tenant.full_name,
      "Unassigned"
    );
  }

  if (tenant) {
    const tenantName = [
      tenant.first_name,
      tenant.other_names,
      tenant.last_name,
    ]
      .map((value) => toSafeString(value))
      .filter(Boolean)
      .join(" ")
      .trim();

    if (tenantName) {
      return tenantName;
    }
  }

  if (user?.full_name) {
    return toSafeString(
      user.full_name,
      "Unassigned"
    );
  }

  if (user) {
    const userName = [
      user.first_name,
      user.last_name,
    ]
      .map((value) => toSafeString(value))
      .filter(Boolean)
      .join(" ")
      .trim();

    if (userName) {
      return userName;
    }
  }

  return "Unassigned";
};

/**
 * Get tenant email.
 */
const getTenantEmail = (lease) => {
  const tenant = getTenant(lease);
  const user = getUser(lease);

  return (
    toSafeString(tenant?.email) ||
    toSafeString(user?.email) ||
    ""
  );
};

/**
 * Get tenant phone.
 */
const getTenantPhone = (lease) => {
  const tenant = getTenant(lease);
  const user = getUser(lease);

  return (
    toSafeString(tenant?.phone) ||
    toSafeString(user?.phone) ||
    ""
  );
};

/**
 * Get tenant avatar.
 */
const getTenantImage = (lease) => {
  const tenant = getTenant(lease);
  const user = getUser(lease);

  return (
    toSafeString(tenant?.photo_url) ||
    toSafeString(tenant?.photo) ||
    toSafeString(user?.image_url) ||
    toSafeString(user?.image) ||
    ""
  );
};

/**
 * Get property name.
 */
const getPropertyName = (lease) => {
  const property = getProperty(lease);

  return (
    toSafeString(property?.name) ||
    toSafeString(property?.property_name) ||
    toSafeString(property?.title) ||
    toSafeString(property?.property_number) ||
    "Property not specified"
  );
};

/**
 * Get property location.
 */
const getPropertyLocation = (lease) => {
  const property = getProperty(lease);

  return (
    toSafeString(property?.location) ||
    toSafeString(property?.address) ||
    ""
  );
};

/**
 * Get apartment name.
 */
const getApartmentName = (lease) => {
  const apartment = getApartment(lease);

  return (
    toSafeString(apartment?.full_name) ||
    toSafeString(apartment?.name) ||
    toSafeString(apartment?.apartment_name) ||
    toSafeString(apartment?.title) ||
    toSafeString(apartment?.apartment_number) ||
    ""
  );
};

/**
 * Get unit name.
 */
const getUnitName = (lease) => {
  const unit = getUnit(lease);

  return (
    toSafeString(unit?.unit_name) ||
    toSafeString(unit?.name) ||
    toSafeString(unit?.unit_number) ||
    toSafeString(unit?.number) ||
    ""
  );
};

/**
 * Get lease number.
 */
const getLeaseNumber = (lease) => {
  return (
    toSafeString(lease?.lease_number) ||
    (lease?.id
      ? `LSE-${String(lease.id).padStart(6, "0")}`
      : "LSE-—")
  );
};

/**
 * Get tenancy number.
 */
const getTenancyNumber = (lease) => {
  return (
    toSafeString(
      getTenancy(lease)?.tenancy_number
    ) || "—"
  );
};

/**
 * Get lease status label.
 */
const getStatusLabel = (lease) => {
  const explicitLabel = toSafeString(
    lease?.status_label
  );

  if (explicitLabel) {
    return explicitLabel;
  }

  return humanize(lease?.status) || "Unknown";
};

/**
 * Get lease type label.
 */
const getLeaseTypeLabel = (lease) => {
  return (
    toSafeString(lease?.lease_type_label) ||
    humanize(lease?.lease_type) ||
    "Lease"
  );
};

/**
 * Get payment frequency label.
 */
const getPaymentFrequencyLabel = (lease) => {
  return (
    toSafeString(
      lease?.payment_frequency_label
    ) ||
    humanize(lease?.payment_frequency) ||
    "—"
  );
};

/*
|--------------------------------------------------------------------------
| Status Configuration
|--------------------------------------------------------------------------
*/

const STATUS_STYLES = {
  draft: {
    wrapper:
      "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:ring-slate-700",
    dot: "bg-slate-500",
  },

  active: {
    wrapper:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800",
    dot: "bg-emerald-500",
  },

  expired: {
    wrapper:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800",
    dot: "bg-amber-500",
  },

  terminated: {
    wrapper:
      "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-800",
    dot: "bg-red-500",
  },

  cancelled: {
    wrapper:
      "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-900/40 dark:text-gray-300 dark:ring-gray-700",
    dot: "bg-gray-500",
  },

  pending: {
    wrapper:
      "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-800",
    dot: "bg-blue-500",
  },

  signed: {
    wrapper:
      "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:ring-indigo-800",
    dot: "bg-indigo-500",
  },

  unknown: {
    wrapper:
      "bg-gray-50 text-gray-600 ring-gray-200 dark:bg-gray-900/40 dark:text-gray-400 dark:ring-gray-700",
    dot: "bg-gray-400",
  },
};

/*
|--------------------------------------------------------------------------
| Small UI Components
|--------------------------------------------------------------------------
*/

/**
 * Lease status badge.
 */
function StatusBadge({ lease }) {
  const status = normalizeStatus(lease?.status);

  const styles =
    STATUS_STYLES[status] ||
    STATUS_STYLES.unknown;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${styles.wrapper}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`}
        aria-hidden="true"
      />

      <span className="whitespace-nowrap">
        {getStatusLabel(lease)}
      </span>
    </span>
  );
}

/**
 * Generate initials from a name.
 */
const getInitials = (name) => {
  const safeName = toSafeString(name);

  if (!safeName) {
    return "";
  }

  return safeName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
};

/**
 * Tenant avatar.
 */
function TenantAvatar({
  lease,
  size = "md",
}) {
  const name = getTenantName(lease);
  const image = getTenantImage(lease);
  const initials = getInitials(name);

  const sizeClass =
    size === "sm"
      ? "h-9 w-9 text-xs"
      : "h-11 w-11 text-sm";

  if (image) {
    return (
      <img
        src={image}
        alt={`${name} profile`}
        className={`${sizeClass} shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm dark:ring-gray-900`}
        onError={(event) => {
          event.currentTarget.style.display =
            "none";
        }}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600 ring-2 ring-white shadow-sm dark:bg-slate-800 dark:text-slate-300 dark:ring-gray-900`}
      aria-hidden="true"
    >
      {initials || (
        <User
          className="h-5 w-5"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/**
 * Small information item.
 */
function InfoItem({
  icon: Icon,
  children,
  className = "",
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ${className}`}
    >
      <Icon
        className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
        aria-hidden="true"
      />

      <span className="min-w-0 truncate">
        {children}
      </span>
    </div>
  );
}

/**
 * Small section label.
 */
function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
      {children}
    </p>
  );
}

/**
 * Skeleton block.
 */
function SkeletonBlock({
  className = "",
}) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`}
      aria-hidden="true"
    />
  );
}

/*
|--------------------------------------------------------------------------
| Desktop Table Row
|--------------------------------------------------------------------------
*/

function LeaseTableRow({
  lease,
  currency,
  showActions,
  actionProps,
  onRowClick,
}) {
  const property = getProperty(lease);

  const tenantName = getTenantName(lease);
  const tenantEmail = getTenantEmail(lease);
  const tenantPhone = getTenantPhone(lease);

  const propertyName = getPropertyName(lease);
  const propertyLocation =
    getPropertyLocation(lease);

  const apartmentName =
    getApartmentName(lease);

  const unitName = getUnitName(lease);

  const leaseNumber =
    getLeaseNumber(lease);

  const tenancyNumber =
    getTenancyNumber(lease);

  const clickable =
    typeof onRowClick === "function";

  const handleRowClick = () => {
    if (!clickable) {
      return;
    }

    onRowClick(lease);
  };

  const handleKeyDown = (event) => {
    if (!clickable) {
      return;
    }

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      onRowClick(lease);
    }
  };

  const propertyParts = [
    apartmentName,
    unitName,
  ].filter(Boolean);

  return (
    <tr
      className={`group border-b border-slate-100 bg-white transition-colors last:border-b-0 dark:border-gray-800 dark:bg-gray-900 ${clickable
        ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800/60"
        : "hover:bg-slate-50/60 dark:hover:bg-gray-800/40"
        }`}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? "button" : undefined}
      aria-label={
        clickable
          ? `View lease ${leaseNumber}`
          : undefined
      }
    >
      {/* Lease */}
      <td className="px-5 py-4 align-middle">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors group-hover:border-slate-300 group-hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-slate-300 dark:group-hover:border-gray-600 dark:group-hover:bg-gray-800">
            <FileText
              className="h-4 w-4"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {leaseNumber}
              </p>

              {clickable && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400"
                  aria-hidden="true"
                />
              )}
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Tenancy{" "}
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {tenancyNumber}
              </span>
            </p>

            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
              {getLeaseTypeLabel(lease)}
            </p>
          </div>
        </div>
      </td>

      {/* Tenant */}
      <td className="px-5 py-4 align-middle">
        <div className="flex items-center gap-3">
          <TenantAvatar lease={lease} />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {tenantName}
            </p>

            {tenantEmail && (
              <InfoItem
                icon={Mail}
                className="mt-1"
              >
                {tenantEmail}
              </InfoItem>
            )}

            {tenantPhone && (
              <InfoItem
                icon={Phone}
                className="mt-1"
              >
                {tenantPhone}
              </InfoItem>
            )}
          </div>
        </div>
      </td>

      {/* Property / Unit */}
      <td className="px-5 py-4 align-middle">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-gray-800 dark:text-slate-500">
            <MapPin
              className="h-4 w-4"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <p className="max-w-[240px] truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
              {propertyName}
            </p>

            {propertyParts.length > 0 && (
              <p className="mt-1 max-w-[240px] truncate text-xs text-slate-500 dark:text-slate-400">
                {propertyParts.join(" • ")}
              </p>
            )}

            {propertyLocation && (
              <p className="mt-1.5 flex max-w-[240px] items-center gap-1 truncate text-[11px] text-slate-400 dark:text-slate-500">
                <Home
                  className="h-3 w-3 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">
                  {propertyLocation}
                </span>
              </p>
            )}

            {!property && (
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                Property details unavailable
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Lease Period */}
      <td className="px-5 py-4 align-middle">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-gray-800 dark:text-slate-500">
            <CalendarDays
              className="h-4 w-4"
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {formatDate(lease?.start_date)}
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              → {formatDate(lease?.end_date)}
            </p>

            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              {getPaymentFrequencyLabel(
                lease
              )}
            </p>
          </div>
        </div>
      </td>

      {/* Financial Terms */}
      <td className="px-5 py-4 align-middle">
        <div>
          <SectionLabel>
            Rent
          </SectionLabel>

          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
            {formatCurrency(
              lease?.rent_amount,
              currency
            )}
          </p>

          <div className="mt-2 space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deposit{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatCurrency(
                  lease?.deposit_amount,
                  currency
                )}
              </span>
            </p>

            {toNumber(
              lease?.service_charge
            ) > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Service{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatCurrency(
                      lease?.service_charge,
                      currency
                    )}
                  </span>
                </p>
              )}
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-4 align-middle">
        <StatusBadge lease={lease} />

        {lease?.signed_at && (
          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
            Signed{" "}
            {formatDate(lease.signed_at)}
          </p>
        )}

        {lease?.is_expired && (
          <p className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            Lease expired
          </p>
        )}

        {lease?.is_terminated &&
          lease?.terminated_at && (
            <p className="mt-1 text-[11px] text-red-500 dark:text-red-400">
              Terminated{" "}
              {formatDate(
                lease.terminated_at
              )}
            </p>
          )}
      </td>

      {/* Actions */}
      {showActions && (
        <td
          className="px-5 py-4 text-right align-middle"
          onClick={(event) => {
            event.stopPropagation();
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
        >
          <LeaseActions
            lease={lease}
            compact
            {...actionProps}
          />
        </td>
      )}
    </tr>
  );
}

/*
|--------------------------------------------------------------------------
| Mobile Lease Card
|--------------------------------------------------------------------------
*/

function LeaseMobileCard({
  lease,
  currency,
  showActions,
  actionProps,
  onRowClick,
}) {
  const propertyName =
    getPropertyName(lease);

  const propertyLocation =
    getPropertyLocation(lease);

  const apartmentName =
    getApartmentName(lease);

  const unitName = getUnitName(lease);

  const clickable =
    typeof onRowClick === "function";

  const handleRowClick = () => {
    if (!clickable) {
      return;
    }

    onRowClick(lease);
  };

  const handleKeyDown = (event) => {
    if (!clickable) {
      return;
    }

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      onRowClick(lease);
    }
  };

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900 ${clickable
        ? "cursor-pointer active:scale-[0.995] hover:border-slate-300 hover:shadow-md dark:hover:border-gray-700"
        : ""
        }`}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? "button" : undefined}
      aria-label={
        clickable
          ? `View lease ${getLeaseNumber(
            lease
          )}`
          : undefined
      }
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4 dark:border-gray-800">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-300">
            <FileText
              className="h-5 w-5"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {getLeaseNumber(lease)}
              </p>

              {clickable && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600"
                  aria-hidden="true"
                />
              )}
            </div>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Tenancy{" "}
              {getTenancyNumber(lease)}
            </p>

            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
              {getLeaseTypeLabel(lease)}
            </p>
          </div>
        </div>

        <StatusBadge lease={lease} />
      </div>

      {/* Tenant */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <TenantAvatar lease={lease} />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {getTenantName(lease)}
            </p>

            {getTenantEmail(lease) && (
              <div className="mt-1 flex min-w-0 items-center gap-1.5">
                <Mail
                  className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />

                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {getTenantEmail(lease)}
                </p>
              </div>
            )}

            {getTenantPhone(lease) && (
              <div className="mt-1 flex items-center gap-1.5">
                <Phone
                  className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {getTenantPhone(lease)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Property */}
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm dark:bg-gray-800 dark:text-slate-500">
              <Home
                className="h-4 w-4"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                {propertyName}
              </p>

              {(apartmentName ||
                unitName) && (
                  <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                    {[
                      apartmentName,
                      unitName,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}

              {propertyLocation && (
                <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-[11px] text-slate-400 dark:text-slate-500">
                  <MapPin
                    className="h-3 w-3 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    {propertyLocation}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <SectionLabel>
              Start Date
            </SectionLabel>

            <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {formatDate(
                lease?.start_date
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <SectionLabel>
              End Date
            </SectionLabel>

            <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {formatDate(
                lease?.end_date
              )}
            </p>
          </div>
        </div>

        {/* Financials */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-gray-800 dark:bg-gray-800/40">
            <SectionLabel>
              Rent
            </SectionLabel>

            <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(
                lease?.rent_amount,
                currency
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-gray-800 dark:bg-gray-800/40">
            <SectionLabel>
              Deposit
            </SectionLabel>

            <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(
                lease?.deposit_amount,
                currency
              )}
            </p>
          </div>
        </div>

        {/* Additional details */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {lease?.payment_frequency && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <CalendarDays
                className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />

              <span>
                {getPaymentFrequencyLabel(
                  lease
                )}
              </span>
            </div>
          )}

          {toNumber(
            lease?.service_charge
          ) > 0 && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Service{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(
                    lease?.service_charge,
                    currency
                  )}
                </span>
              </div>
            )}
        </div>

        {/* Signed information */}
        {lease?.signed_at && (
          <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
            Signed{" "}
            {formatDate(lease.signed_at)}
          </p>
        )}

        {/* Expired information */}
        {lease?.is_expired && (
          <p className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            This lease has expired.
          </p>
        )}

        {/* Terminated information */}
        {lease?.is_terminated &&
          lease?.terminated_at && (
            <p className="mt-1 text-[11px] text-red-500 dark:text-red-400">
              Terminated{" "}
              {formatDate(
                lease.terminated_at
              )}
            </p>
          )}

        {/* Actions */}
        {showActions && (
          <div
            className="mt-4 border-t border-slate-100 pt-4 dark:border-gray-800"
            onClick={(event) => {
              event.stopPropagation();
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
            }}
          >
            <LeaseActions
              lease={lease}
              compact={false}
              {...actionProps}
            />
          </div>
        )}
      </div>
    </article>
  );
}

/*
|--------------------------------------------------------------------------
| Loading State
|--------------------------------------------------------------------------
*/

/**
 * Desktop table skeleton.
 */
function LeaseTableLoading({
  columns,
  rows = DEFAULT_LOADING_ROWS,
}) {
  return (
    <>
      {Array.from({ length: rows }).map(
        (_, index) => (
          <tr
            key={`lease-skeleton-${index}`}
            className="border-b border-slate-100 last:border-b-0 dark:border-gray-800"
          >
            {Array.from({
              length: columns,
            }).map((_, columnIndex) => (
              <td
                key={`skeleton-cell-${index}-${columnIndex}`}
                className="px-5 py-5"
              >
                <div className="flex items-center gap-3">
                  {columnIndex === 0 && (
                    <SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl" />
                  )}

                  <div className="min-w-0 space-y-2">
                    <SkeletonBlock
                      className={
                        columnIndex === 0
                          ? "h-4 w-28"
                          : "h-4 w-24"
                      }
                    />

                    <SkeletonBlock className="h-3 w-20" />
                  </div>
                </div>
              </td>
            ))}
          </tr>
        )
      )}
    </>
  );
}

/**
 * Mobile skeleton card.
 */
function LeaseMobileSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-10 w-10 rounded-xl" />

        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-4 w-32" />

          <SkeletonBlock className="mt-2 h-3 w-24" />

          <SkeletonBlock className="mt-2 h-3 w-20" />
        </div>

        <SkeletonBlock className="h-6 w-16 rounded-full" />
      </div>

      <SkeletonBlock className="mt-5 h-16 w-full rounded-xl" />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-16 w-full rounded-xl" />
        <SkeletonBlock className="h-16 w-full rounded-xl" />
      </div>

      <SkeletonBlock className="mt-4 h-10 w-full rounded-xl" />
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

function LeaseTableEmpty({
  colSpan,
  title = "No leases found",
  description = "There are no lease records to display.",
  icon: Icon = FileText,
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-6 py-16 text-center"
      >
        <div className="mx-auto flex max-w-md flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-500">
            <Icon
              className="h-7 w-7"
              aria-hidden="true"
            />
          </div>

          <h3 className="mt-5 text-sm font-bold text-slate-900 dark:text-white">
            {title}
          </h3>

          <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </td>
    </tr>
  );
}

/*
|--------------------------------------------------------------------------
| Main LeaseTable Component
|--------------------------------------------------------------------------
*/

export default function LeaseTable({
  leases = [],
  loading = false,
  showActions = true,
  currency = DEFAULT_CURRENCY,
  onRowClick,
  actionProps = {},
  emptyTitle = "No leases found",
  emptyDescription =
  "There are no lease records to display.",
  className = "",
}) {
  const leaseList = Array.isArray(leases)
    ? leases.filter(
      (lease) =>
        lease &&
        typeof lease === "object"
    )
    : [];

  const columnCount = showActions ? 7 : 6;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* ----------------------------------------------------------------
          Desktop / Tablet Table
      ----------------------------------------------------------------- */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1240px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-gray-800 dark:bg-gray-800/60">
              <th
                scope="col"
                className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400"
              >
                Lease
              </th>

              <th
                scope="col"
                className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400"
              >
                Tenant
              </th>

              <th
                scope="col"
                className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400"
              >
                Property / Unit
              </th>

              <th
                scope="col"
                className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400"
              >
                Lease Period
              </th>

              <th
                scope="col"
                className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400"
              >
                Financial Terms
              </th>

              <th
                scope="col"
                className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400"
              >
                Status
              </th>

              {showActions && (
                <th
                  scope="col"
                  className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400"
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
            {loading ? (
              <LeaseTableLoading
                columns={columnCount}
                rows={DEFAULT_LOADING_ROWS}
              />
            ) : leaseList.length === 0 ? (
              <LeaseTableEmpty
                colSpan={columnCount}
                title={emptyTitle}
                description={emptyDescription}
              />
            ) : (
              leaseList.map((lease, index) => (
                <LeaseTableRow
                  key={
                    lease?.id ??
                    lease?.lease_number ??
                    `lease-${index}`
                  }
                  lease={lease}
                  currency={currency}
                  showActions={showActions}
                  actionProps={actionProps}
                  onRowClick={onRowClick}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ----------------------------------------------------------------
          Mobile Cards
      ----------------------------------------------------------------- */}
      <div className="space-y-3 bg-slate-50/70 p-3 dark:bg-gray-950/40 lg:hidden">
        {loading ? (
          Array.from({
            length: DEFAULT_MOBILE_LOADING_ROWS,
          }).map((_, index) => (
            <LeaseMobileSkeleton
              key={`mobile-skeleton-${index}`}
            />
          ))
        ) : leaseList.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-500">
              <FileText
                className="h-7 w-7"
                aria-hidden="true"
              />
            </div>

            <h3 className="mt-5 text-sm font-bold text-slate-900 dark:text-white">
              {emptyTitle}
            </h3>

            <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              {emptyDescription}
            </p>
          </div>
        ) : (
          leaseList.map((lease, index) => (
            <LeaseMobileCard
              key={
                lease?.id ??
                lease?.lease_number ??
                `mobile-lease-${index}`
              }
              lease={lease}
              currency={currency}
              showActions={showActions}
              actionProps={actionProps}
              onRowClick={onRowClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Named Variants
|--------------------------------------------------------------------------
*/

/**
 * Compact lease table.
 */
export function LeaseTableCompact(props) {
  return (
    <LeaseTable
      {...props}
      className={`text-sm ${props.className || ""
        }`}
    />
  );
}

/**
 * Read-only lease table.
 */
export function LeaseTableReadOnly(props) {
  return (
    <LeaseTable
      {...props}
      showActions={false}
    />
  );
}