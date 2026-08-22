import { useCallback, useMemo } from "react";
import {
  Building2,
  CalendarDays,
  Home,
  UserRound,
  Wallet,
  FileText,
  Loader2,
} from "lucide-react";

import TenancyActions from "./TenancyActions";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely convert a value into a displayable string.
 */
const safeText = (value, fallback = "—") => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (typeof value === "object") {
    return fallback;
  }

  return String(value);
};

/**
 * Safely get the first usable primitive text value.
 */
const firstText = (...values) => {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      typeof value !== "object"
    ) {
      return String(value);
    }
  }

  return "";
};

/**
 * Safely format a date.
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
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

/**
 * Format currency as Kenyan Shillings.
 */
const formatCurrency = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(numericValue);
};

/**
 * Normalize status text for display.
 */
const formatStatus = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Unknown";
  }

  if (typeof value === "object") {
    return "Unknown";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

/*
|--------------------------------------------------------------------------
| Tenant Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get tenant relationship.
 *
 * Supports:
 * - tenancy.tenant
 * - tenancy.tenant_details
 */
const getTenant = (tenancy) => {
  if (!tenancy || typeof tenancy !== "object") {
    return null;
  }

  return (
    tenancy?.tenant ||
    tenancy?.tenant_details ||
    null
  );
};

/**
 * Get tenant user relationship.
 *
 * Supports:
 * - tenancy.tenant.user
 * - tenancy.tenant_user
 * - tenancy.user
 */
const getTenantUser = (tenancy) => {
  if (!tenancy || typeof tenancy !== "object") {
    return null;
  }

  return (
    tenancy?.tenant?.user ||
    tenancy?.tenant_user ||
    tenancy?.user ||
    null
  );
};

/**
 * Get tenant display name.
 */
const getTenantName = (tenancy) => {
  const tenant = getTenant(tenancy);
  const user = getTenantUser(tenancy);

  /*
   * Direct full-name fields.
   */
  const directFullName = firstText(
    tenant?.full_name,
    tenant?.name,
    tenant?.display_name,
    user?.full_name,
    user?.name,
    user?.display_name,
    tenancy?.tenant_name,
    tenancy?.tenant_full_name
  );

  if (directFullName) {
    return directFullName;
  }

  /*
   * Tenant first / middle / last names.
   */
  const tenantName = [
    tenant?.first_name,
    tenant?.other_names,
    tenant?.middle_name,
    tenant?.last_name,
  ]
    .filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== "" &&
        typeof value !== "object"
    )
    .map((value) => String(value).trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  if (tenantName) {
    return tenantName;
  }

  /*
   * User first / middle / last names.
   */
  const userName = [
    user?.first_name,
    user?.other_names,
    user?.middle_name,
    user?.last_name,
  ]
    .filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== "" &&
        typeof value !== "object"
    )
    .map((value) => String(value).trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  if (userName) {
    return userName;
  }

  /*
   * Some APIs may return a single name field directly
   * on the tenancy.
   */
  const tenancyName = firstText(
    tenancy?.name,
    tenancy?.tenant_display_name
  );

  if (tenancyName) {
    return tenancyName;
  }

  return "No tenant";
};

/**
 * Get tenant initials.
 */
const getTenantInitials = (tenancy) => {
  const tenantName = getTenantName(tenancy);

  if (
    tenantName &&
    tenantName !== "No tenant"
  ) {
    const initials = tenantName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((name) =>
        name.charAt(0).toUpperCase()
      )
      .join("");

    if (initials) {
      return initials;
    }
  }

  return "T";
};

/**
 * Get tenant phone.
 */
const getTenantPhone = (tenancy) => {
  const tenant = getTenant(tenancy);
  const user = getTenantUser(tenancy);

  return firstText(
    tenant?.phone,
    tenant?.phone_number,
    user?.phone,
    user?.phone_number,
    tenancy?.tenant_phone,
    tenancy?.tenant_phone_number
  );
};

/**
 * Get tenant number.
 */
const getTenantNumber = (tenancy) => {
  const tenant = getTenant(tenancy);

  return (
    firstText(
      tenant?.tenant_number,
      tenant?.number,
      tenant?.tenant_code,
      tenancy?.tenant_number,
      tenancy?.tenant_code
    ) || "Tenant"
  );
};

/**
 * Get tenant image.
 */
const getTenantImage = (tenancy) => {
  const tenant = getTenant(tenancy);
  const user = getTenantUser(tenancy);

  return (
    firstText(
      tenant?.photo_url,
      tenant?.image_url,
      tenant?.avatar_url,
      tenant?.photo,
      tenant?.image,
      tenant?.avatar,

      user?.photo_url,
      user?.image_url,
      user?.avatar_url,
      user?.photo,
      user?.image,
      user?.avatar,

      tenancy?.tenant_photo_url,
      tenancy?.tenant_image_url,
      tenancy?.tenant_avatar_url
    ) || null
  );
};

/*
|--------------------------------------------------------------------------
| Property Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get property relationship.
 */
const getProperty = (tenancy) => {
  if (!tenancy || typeof tenancy !== "object") {
    return null;
  }

  return (
    tenancy?.property ||
    tenancy?.apartment?.property ||
    tenancy?.unit?.property ||
    null
  );
};

/**
 * Get property name.
 */
const getPropertyName = (tenancy) => {
  const property = getProperty(tenancy);

  return (
    firstText(
      property?.title,
      property?.name,
      property?.property_name,
      property?.display_name,

      tenancy?.property_name,
      tenancy?.property_title,
      tenancy?.property_display_name,

      tenancy?.apartment?.property_title,
      tenancy?.apartment?.property_name
    ) || "No property"
  );
};

/**
 * Get property code.
 */
const getPropertyCode = (tenancy) => {
  const property = getProperty(tenancy);

  return firstText(
    property?.property_code,
    property?.code,
    property?.property_number,
    property?.reference_number,

    tenancy?.property_code,
    tenancy?.property_number
  );
};

/**
 * Get property location.
 */
const getPropertyLocation = (tenancy) => {
  const property = getProperty(tenancy);

  return firstText(
    property?.full_location,
    property?.location,
    property?.address,
    property?.physical_address,

    tenancy?.property_location,
    tenancy?.property_address
  );
};

/*
|--------------------------------------------------------------------------
| Apartment Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get apartment relationship.
 */
const getApartment = (tenancy) => {
  if (!tenancy || typeof tenancy !== "object") {
    return null;
  }

  return (
    tenancy?.apartment ||
    tenancy?.unit?.apartment ||
    null
  );
};

/**
 * Get apartment name.
 */
const getApartmentName = (tenancy) => {
  const apartment = getApartment(tenancy);

  return (
    firstText(
      apartment?.full_name,
      apartment?.name,
      apartment?.apartment_name,
      apartment?.apartment_number,
      apartment?.number,
      apartment?.code,

      tenancy?.apartment_name,
      tenancy?.apartment_number,
      tenancy?.apartment_code
    ) || "No apartment"
  );
};

/*
|--------------------------------------------------------------------------
| Unit Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get unit relationship.
 */
const getUnit = (tenancy) => {
  if (!tenancy || typeof tenancy !== "object") {
    return null;
  }

  return tenancy?.unit || null;
};

/**
 * Get unit name.
 */
const getUnitName = (tenancy) => {
  const unit = getUnit(tenancy);

  return (
    firstText(
      unit?.unit_number,
      unit?.name,
      unit?.unit_name,
      unit?.number,
      unit?.code,

      tenancy?.unit_number,
      tenancy?.unit_name,
      tenancy?.unit_code
    ) || "No unit"
  );
};

/**
 * Get unit status.
 */
const getUnitStatus = (tenancy) => {
  const unit = getUnit(tenancy);

  const status = firstText(
    unit?.status_label,
    unit?.status,
    unit?.status_code,
    tenancy?.unit_status_label,
    tenancy?.unit_status
  );

  if (!status) {
    return "";
  }

  return formatStatus(status);
};

/*
|--------------------------------------------------------------------------
| Status Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get raw tenancy status.
 */
const getRawStatus = (tenancy) => {
  if (!tenancy || typeof tenancy !== "object") {
    return "";
  }

  const value =
    tenancy?.status_code ||
    tenancy?.status ||
    tenancy?.status_label ||
    "";

  if (
    value === null ||
    value === undefined ||
    typeof value === "object"
  ) {
    return "";
  }

  return String(value)
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
    .trim();
};

/**
 * Get tenancy status label.
 */
const getStatus = (tenancy) => {
  return formatStatus(
    tenancy?.status_label ||
      tenancy?.status ||
      tenancy?.status_code ||
      "unknown"
  );
};

/**
 * Get status badge classes.
 */
const getStatusClasses = (tenancy) => {
  const status = getRawStatus(tenancy);

  const isActive =
    status === "active" ||
    status === "current" ||
    tenancy?.is_currently_active === true ||
    tenancy?.is_active === true;

  if (isActive) {
    return "bg-green-50 text-green-700 ring-green-600/20";
  }

  if (
    status === "pending" ||
    status === "draft" ||
    status === "upcoming"
  ) {
    return "bg-yellow-50 text-yellow-700 ring-yellow-600/20";
  }

  if (
    status === "expired" ||
    status === "expiring"
  ) {
    return "bg-orange-50 text-orange-700 ring-orange-600/20";
  }

  if (
    status === "terminated" ||
    status === "termination"
  ) {
    return "bg-red-50 text-red-700 ring-red-600/20";
  }

  if (
    status === "cancelled" ||
    status === "canceled"
  ) {
    return "bg-gray-100 text-gray-700 ring-gray-500/20";
  }

  if (
    status === "deleted" ||
    status === "trashed"
  ) {
    return "bg-red-100 text-red-800 ring-red-600/20";
  }

  if (
    status === "renewed" ||
    status === "renewal"
  ) {
    return "bg-blue-50 text-blue-700 ring-blue-600/20";
  }

  return "bg-gray-100 text-gray-700 ring-gray-500/20";
};

/*
|--------------------------------------------------------------------------
| Tenancy Number
|--------------------------------------------------------------------------
*/

/**
 * Get tenancy number.
 */
const getTenancyNumber = (tenancy) => {
  return (
    firstText(
      tenancy?.tenancy_number,
      tenancy?.number,
      tenancy?.code,
      tenancy?.reference_number
    ) ||
    (tenancy?.id
      ? `TEN-${tenancy.id}`
      : "TEN-—")
  );
};

/*
|--------------------------------------------------------------------------
| Rent Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get tenancy rent.
 */
const getTenancyRent = (tenancy) => {
  const unit = getUnit(tenancy);

  return (
    tenancy?.rent_amount ??
    tenancy?.monthly_rent ??
    tenancy?.rent ??
    tenancy?.rent_price ??
    tenancy?.amount ??

    unit?.rent_amount ??
    unit?.monthly_rent ??
    unit?.price ??
    unit?.rent ??
    null
  );
};

/**
 * Get payment frequency.
 */
const getPaymentFrequency = (tenancy) => {
  const value =
    tenancy?.payment_frequency ||
    tenancy?.rent_frequency ||
    tenancy?.frequency;

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    typeof value === "object"
  ) {
    return "";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .trim();
};

/**
 * Get service charge.
 */
const getServiceCharge = (tenancy) => {
  return (
    tenancy?.service_charge ??
    tenancy?.serviceCharge ??
    tenancy?.service_charge_amount ??
    tenancy?.monthly_service_charge ??
    tenancy?.unit?.service_charge ??
    tenancy?.unit?.serviceCharge ??
    null
  );
};

/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

const EmptyState = ({
  hasFilters = false,
}) => {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <FileText className="h-7 w-7 text-gray-400" />
      </div>

      <h3 className="text-base font-semibold text-gray-900">
        {hasFilters
          ? "No tenancies found"
          : "No tenancies available"}
      </h3>

      <p className="mt-1 max-w-md text-sm text-gray-500">
        {hasFilters
          ? "No tenancy records match the current search or filters."
          : "There are currently no tenancy records to display."}
      </p>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Loading State
|--------------------------------------------------------------------------
*/

const LoadingState = () => {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-gray-500" />

        <p className="text-sm text-gray-500">
          Loading tenancies...
        </p>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Tenancy Table
|--------------------------------------------------------------------------
*/

const TenancyTable = ({
  tenancies = [],
  loading = false,

  /*
  |--------------------------------------------------------------------------
  | Action callbacks
  |--------------------------------------------------------------------------
  */

  onDelete,
  onActivate,
  onDeactivate,
  onRenew,
  onTerminate,
  onCancel,
  onRestore,
  onForceDelete,

  /*
  |--------------------------------------------------------------------------
  | Configuration
  |--------------------------------------------------------------------------
  */

  hasFilters = false,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Normalize rows
  |--------------------------------------------------------------------------
  */

  const rows = useMemo(() => {
    if (!Array.isArray(tenancies)) {
      return [];
    }

    return tenancies.filter(
      (tenancy) =>
        tenancy &&
        typeof tenancy === "object"
    );
  }, [tenancies]);

  /*
  |--------------------------------------------------------------------------
  | Action handlers
  |--------------------------------------------------------------------------
  */

  const handleDelete = useCallback(
    async (id) => {
      if (typeof onDelete !== "function") {
        return;
      }

      return onDelete(id);
    },
    [onDelete]
  );

  const handleActivate = useCallback(
    async (id) => {
      if (typeof onActivate !== "function") {
        return;
      }

      return onActivate(id);
    },
    [onActivate]
  );

  const handleDeactivate = useCallback(
    async (id) => {
      if (typeof onDeactivate !== "function") {
        return;
      }

      return onDeactivate(id);
    },
    [onDeactivate]
  );

  const handleRenew = useCallback(
    async (id, data = {}) => {
      if (typeof onRenew !== "function") {
        return;
      }

      return onRenew(id, data);
    },
    [onRenew]
  );

  const handleTerminate = useCallback(
    async (id, data = {}) => {
      if (typeof onTerminate !== "function") {
        return;
      }

      return onTerminate(id, data);
    },
    [onTerminate]
  );

  const handleCancel = useCallback(
    async (id, data = {}) => {
      if (typeof onCancel !== "function") {
        return;
      }

      return onCancel(id, data);
    },
    [onCancel]
  );

  const handleRestore = useCallback(
    async (id) => {
      if (typeof onRestore !== "function") {
        return;
      }

      return onRestore(id);
    },
    [onRestore]
  );

  const handleForceDelete = useCallback(
    async (id) => {
      if (typeof onForceDelete !== "function") {
        return;
      }

      return onForceDelete(id);
    },
    [onForceDelete]
  );

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <LoadingState />
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Empty
  |--------------------------------------------------------------------------
  */

  if (rows.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <EmptyState hasFilters={hasFilters} />
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1250px] w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Tenancy */}
              <th
                scope="col"
                className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Tenancy
              </th>

              {/* Tenant */}
              <th
                scope="col"
                className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Tenant
              </th>

              {/* Property */}
              <th
                scope="col"
                className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Property
              </th>

              {/* Unit */}
              <th
                scope="col"
                className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Unit
              </th>

              {/* Period */}
              <th
                scope="col"
                className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Period
              </th>

              {/* Rent */}
              <th
                scope="col"
                className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Rent
              </th>

              {/* Status */}
              <th
                scope="col"
                className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Status
              </th>

              {/* Actions */}
              <th
                scope="col"
                className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map((tenancy) => {
              /*
              |--------------------------------------------------------------------------
              | Tenant
              |--------------------------------------------------------------------------
              */

              const tenantName =
                getTenantName(tenancy);

              const tenantInitials =
                getTenantInitials(tenancy);

              const tenantPhone =
                getTenantPhone(tenancy);

              const tenantNumber =
                getTenantNumber(tenancy);

              const tenantImage =
                getTenantImage(tenancy);

              /*
              |--------------------------------------------------------------------------
              | Property
              |--------------------------------------------------------------------------
              */

              const propertyName =
                getPropertyName(tenancy);

              const propertyCode =
                getPropertyCode(tenancy);

              const propertyLocation =
                getPropertyLocation(tenancy);

              /*
              |--------------------------------------------------------------------------
              | Apartment / Unit
              |--------------------------------------------------------------------------
              */

              const apartmentName =
                getApartmentName(tenancy);

              const unitName =
                getUnitName(tenancy);

              const unitStatus =
                getUnitStatus(tenancy);

              /*
              |--------------------------------------------------------------------------
              | Status
              |--------------------------------------------------------------------------
              */

              const statusLabel =
                getStatus(tenancy);

              const statusClasses =
                getStatusClasses(tenancy);

              /*
              |--------------------------------------------------------------------------
              | Tenancy
              |--------------------------------------------------------------------------
              */

              const tenancyNumber =
                getTenancyNumber(tenancy);

              const rentAmount =
                getTenancyRent(tenancy);

              const paymentFrequency =
                getPaymentFrequency(tenancy);

              const serviceCharge =
                getServiceCharge(tenancy);

              /*
              |--------------------------------------------------------------------------
              | Key
              |--------------------------------------------------------------------------
              */

              const rowKey =
                tenancy?.id ??
                tenancy?.tenancy_number ??
                tenancyNumber;

              return (
                <tr
                  key={rowKey}
                  className="group transition-colors hover:bg-gray-50/70"
                >
                  {/* Tenancy */}
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                        <FileText className="h-5 w-5 text-gray-500" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {safeText(
                            tenancyNumber,
                            "—"
                          )}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {tenancy?.id
                            ? `ID #${tenancy.id}`
                            : "No ID"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Tenant */}
                  <td className="px-5 py-4">
                    <div className="flex min-w-[210px] items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                        {tenantImage ? (
                          <img
                            src={tenantImage}
                            alt={tenantName}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";

                              const parent =
                                event.currentTarget.parentElement;

                              if (
                                parent &&
                                !parent.dataset.fallback
                              ) {
                                parent.dataset.fallback =
                                  "true";

                                parent.classList.add(
                                  "text-gray-600"
                                );

                                parent.appendChild(
                                  document.createTextNode(
                                    tenantInitials
                                  )
                                );
                              }
                            }}
                          />
                        ) : (
                          tenantInitials
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5 shrink-0 text-gray-400" />

                          <p className="truncate text-sm font-medium text-gray-900">
                            {safeText(
                              tenantName,
                              "No tenant"
                            )}
                          </p>
                        </div>

                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {safeText(
                            tenantNumber,
                            "Tenant"
                          )}
                        </p>

                        {tenantPhone && (
                          <p className="mt-0.5 truncate text-xs text-gray-400">
                            {safeText(
                              tenantPhone
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Property */}
                  <td className="px-5 py-4">
                    <div className="min-w-[220px]">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 shrink-0 text-gray-400" />

                        <p className="truncate text-sm font-medium text-gray-900">
                          {safeText(
                            propertyName,
                            "No property"
                          )}
                        </p>
                      </div>

                      {propertyCode && (
                        <p className="mt-1 pl-6 text-xs text-gray-500">
                          {safeText(propertyCode)}
                        </p>
                      )}

                      {propertyLocation && (
                        <p className="mt-1 max-w-[220px] truncate pl-6 text-xs text-gray-400">
                          {safeText(
                            propertyLocation
                          )}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Unit */}
                  <td className="px-5 py-4">
                    <div className="min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 shrink-0 text-gray-400" />

                        <p className="truncate text-sm font-medium text-gray-900">
                          {safeText(
                            unitName,
                            "No unit"
                          )}
                        </p>
                      </div>

                      <p className="mt-1 pl-6 text-xs text-gray-500">
                        {safeText(
                          apartmentName,
                          "No apartment"
                        )}
                      </p>

                      {unitStatus && (
                        <p className="mt-1 pl-6 text-xs text-gray-400">
                          {safeText(unitStatus)}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Period */}
                  <td className="px-5 py-4">
                    <div className="min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />

                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(
                              tenancy?.start_date
                            )}
                          </p>

                          <p className="text-xs text-gray-500">
                            to{" "}
                            {formatDate(
                              tenancy?.end_date
                            )}
                          </p>
                        </div>
                      </div>

                      {tenancy?.move_in_date && (
                        <p className="mt-1 pl-6 text-xs text-gray-400">
                          Move in:{" "}
                          {formatDate(
                            tenancy.move_in_date
                          )}
                        </p>
                      )}

                      {tenancy?.move_out_date && (
                        <p className="mt-1 pl-6 text-xs text-gray-400">
                          Move out:{" "}
                          {formatDate(
                            tenancy.move_out_date
                          )}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Rent */}
                  <td className="px-5 py-4">
                    <div className="min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 shrink-0 text-gray-400" />

                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(
                            rentAmount
                          )}
                        </p>
                      </div>

                      {paymentFrequency && (
                        <p className="mt-1 pl-6 text-xs capitalize text-gray-500">
                          {safeText(
                            paymentFrequency
                          )}
                        </p>
                      )}

                      {serviceCharge !== null &&
                        serviceCharge !== undefined &&
                        serviceCharge !== "" && (
                          <p className="mt-1 pl-6 text-xs text-gray-400">
                            Service:{" "}
                            {formatCurrency(
                              serviceCharge
                            )}
                          </p>
                        )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <div className="flex min-w-[120px] flex-col items-start gap-2">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2.5 py-1",
                          "text-xs font-medium capitalize",
                          "ring-1 ring-inset",
                          statusClasses,
                        ].join(" ")}
                      >
                        {safeText(
                          statusLabel,
                          "Unknown"
                        )}
                      </span>

                      {tenancy?.is_expired ===
                        true && (
                        <span className="text-xs text-orange-600">
                          Expired
                        </span>
                      )}

                      {tenancy?.has_moved_in ===
                        true &&
                        tenancy?.has_moved_out !==
                          true && (
                          <span className="text-xs text-green-600">
                            Moved in
                          </span>
                        )}

                      {tenancy?.has_moved_out ===
                        true && (
                        <span className="text-xs text-gray-500">
                          Moved out
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <TenancyActions
                      tenancy={tenancy}
                      onDelete={handleDelete}
                      onActivate={handleActivate}
                      onDeactivate={
                        handleDeactivate
                      }
                      onRenew={handleRenew}
                      onTerminate={
                        handleTerminate
                      }
                      onCancel={handleCancel}
                      onRestore={handleRestore}
                      onForceDelete={
                        handleForceDelete
                      }
                      loading={loading}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile overflow hint */}
      <div className="border-t border-gray-100 bg-gray-50 px-5 py-2 text-xs text-gray-400 lg:hidden">
        Scroll horizontally to view all tenancy information.
      </div>
    </div>
  );
};

export default TenancyTable;