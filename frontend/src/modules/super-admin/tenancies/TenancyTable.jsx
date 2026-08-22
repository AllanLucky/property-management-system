// frontend/src/modules/super-admin/tenancies/TenancyTable.jsx

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

  if (
    typeof value === "object"
  ) {
    return fallback;
  }

  return String(value);
};

/**
 * Format date for Kenyan users.
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

  if (Number.isNaN(numericValue)) {
    return "—";
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(numericValue);
};

/**
 * Normalize status text.
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
 * Get tenant from tenancy.
 *
 * Supports:
 * tenancy.tenant
 * tenancy.tenant.user
 */
const getTenant = (tenancy) => {
  return tenancy?.tenant || null;
};

/**
 * Get tenant user.
 */
const getTenantUser = (tenancy) => {
  return (
    tenancy?.tenant?.user ||
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
   * Direct tenant full name.
   */
  if (
    tenant?.full_name &&
    typeof tenant.full_name === "string"
  ) {
    return tenant.full_name;
  }

  /*
   * User full name.
   */
  if (
    user?.full_name &&
    typeof user.full_name === "string"
  ) {
    return user.full_name;
  }

  /*
   * Direct tenant names.
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
        value !== ""
    )
    .join(" ")
    .trim();

  if (tenantName) {
    return tenantName;
  }

  /*
   * User names.
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
        value !== ""
    )
    .join(" ")
    .trim();

  if (userName) {
    return userName;
  }

  return "No tenant";
};

/**
 * Get tenant initials.
 */
const getTenantInitials = (tenancy) => {
  const tenant = getTenant(tenancy);
  const user = getTenantUser(tenancy);

  const fullName =
    tenant?.full_name ||
    user?.full_name;

  if (
    fullName &&
    typeof fullName === "string"
  ) {
    const initials = fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) =>
        name.charAt(0)
      )
      .join("")
      .toUpperCase();

    if (initials) {
      return initials;
    }
  }

  const names = [
    tenant?.first_name ||
    user?.first_name,

    tenant?.last_name ||
    user?.last_name,
  ].filter(Boolean);

  const initials = names
    .map((name) =>
      String(name)
        .charAt(0)
        .toUpperCase()
    )
    .join("");

  return initials || "T";
};

/**
 * Get tenant phone.
 */
const getTenantPhone = (tenancy) => {
  const tenant = getTenant(tenancy);
  const user = getTenantUser(tenancy);

  return (
    tenant?.phone ||
    user?.phone ||
    ""
  );
};

/**
 * Get tenant number.
 */
const getTenantNumber = (tenancy) => {
  return (
    tenancy?.tenant?.tenant_number ||
    tenancy?.tenant_number ||
    "Tenant"
  );
};

/**
 * Get tenant image.
 */
const getTenantImage = (tenancy) => {
  const tenant = getTenant(tenancy);
  const user = getTenantUser(tenancy);

  return (
    tenant?.photo ||
    tenant?.image ||
    tenant?.avatar ||
    user?.photo ||
    user?.image ||
    user?.avatar ||
    null
  );
};

/*
|--------------------------------------------------------------------------
| Property Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get property.
 */
const getProperty = (tenancy) => {
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
    property?.title ||
    property?.name ||
    property?.property_name ||
    tenancy?.property_name ||
    tenancy?.apartment?.property_title ||
    "No property"
  );
};

/**
 * Get property code.
 */
const getPropertyCode = (tenancy) => {
  const property = getProperty(tenancy);

  return (
    property?.property_code ||
    property?.code ||
    tenancy?.property_code ||
    ""
  );
};

/**
 * Get property location.
 */
const getPropertyLocation = (tenancy) => {
  const property = getProperty(tenancy);

  return (
    property?.full_location ||
    property?.location ||
    property?.address ||
    tenancy?.property_location ||
    ""
  );
};

/*
|--------------------------------------------------------------------------
| Apartment Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get apartment.
 */
const getApartment = (tenancy) => {
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
    apartment?.full_name ||
    apartment?.name ||
    apartment?.apartment_number ||
    apartment?.number ||
    tenancy?.apartment_name ||
    "No apartment"
  );
};

/*
|--------------------------------------------------------------------------
| Unit Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get unit.
 */
const getUnit = (tenancy) => {
  return (
    tenancy?.unit ||
    null
  );
};

/**
 * Get unit name.
 */
const getUnitName = (tenancy) => {
  const unit = getUnit(tenancy);

  return (
    unit?.unit_number ||
    unit?.name ||
    unit?.unit_name ||
    unit?.number ||
    tenancy?.unit_number ||
    "No unit"
  );
};

/**
 * Get unit status.
 */
const getUnitStatus = (tenancy) => {
  const unit = getUnit(tenancy);

  const status =
    unit?.status_label ||
    unit?.status;

  if (
    !status ||
    typeof status === "object"
  ) {
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
 * Get tenancy status.
 */
const getStatus = (tenancy) => {
  return formatStatus(
    tenancy?.status_label ||
    tenancy?.status ||
    "unknown"
  );
};

/**
 * Get status classes.
 */
const getStatusClasses = (tenancy) => {
  const status = String(
    tenancy?.status || ""
  ).toLowerCase();

  if (
    status === "active" ||
    tenancy?.is_currently_active === true ||
    tenancy?.is_active === true
  ) {
    return "bg-green-50 text-green-700 ring-green-600/20";
  }

  if (
    status === "pending"
  ) {
    return "bg-yellow-50 text-yellow-700 ring-yellow-600/20";
  }

  if (
    status === "expired"
  ) {
    return "bg-orange-50 text-orange-700 ring-orange-600/20";
  }

  if (
    status === "terminated"
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
    status === "renewed"
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

const getTenancyNumber = (tenancy) => {
  return (
    tenancy?.tenancy_number ||
    tenancy?.number ||
    (tenancy?.id
      ? `TEN-${tenancy.id}`
      : "TEN-—")
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
  emptyMessage,
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
  | Action Handlers
  |--------------------------------------------------------------------------
  */

  const handleDelete = useCallback(
    async (id) => {
      if (
        typeof onDelete !== "function"
      ) {
        return;
      }

      return onDelete(id);
    },
    [onDelete]
  );

  const handleActivate = useCallback(
    async (id) => {
      if (
        typeof onActivate !== "function"
      ) {
        return;
      }

      return onActivate(id);
    },
    [onActivate]
  );

  const handleDeactivate = useCallback(
    async (id) => {
      if (
        typeof onDeactivate !== "function"
      ) {
        return;
      }

      return onDeactivate(id);
    },
    [onDeactivate]
  );

  const handleRenew = useCallback(
    async (id, data) => {
      if (
        typeof onRenew !== "function"
      ) {
        return;
      }

      return onRenew(id, data);
    },
    [onRenew]
  );

  const handleTerminate = useCallback(
    async (id, data) => {
      if (
        typeof onTerminate !== "function"
      ) {
        return;
      }

      return onTerminate(id, data);
    },
    [onTerminate]
  );

  const handleCancel = useCallback(
    async (id, data) => {
      if (
        typeof onCancel !== "function"
      ) {
        return;
      }

      return onCancel(id, data);
    },
    [onCancel]
  );

  const handleRestore = useCallback(
    async (id) => {
      if (
        typeof onRestore !== "function"
      ) {
        return;
      }

      return onRestore(id);
    },
    [onRestore]
  );

  const handleForceDelete = useCallback(
    async (id) => {
      if (
        typeof onForceDelete !== "function"
      ) {
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
        <EmptyState
          hasFilters={hasFilters}
          message={emptyMessage}
        />
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

              const propertyName =
                getPropertyName(tenancy);

              const propertyCode =
                getPropertyCode(tenancy);

              const propertyLocation =
                getPropertyLocation(
                  tenancy
                );

              const apartmentName =
                getApartmentName(
                  tenancy
                );

              const unitName =
                getUnitName(tenancy);

              const unitStatus =
                getUnitStatus(tenancy);

              const statusLabel =
                getStatus(tenancy);

              const statusClasses =
                getStatusClasses(
                  tenancy
                );

              const tenancyNumber =
                getTenancyNumber(
                  tenancy
                );

              return (
                <tr
                  key={
                    tenancy.id ??
                    tenancy.tenancy_number
                  }
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
                          {tenancy.id
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
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
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
                            {tenantName}
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
                            {tenantPhone}
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
                          {propertyName}
                        </p>
                      </div>

                      {propertyCode && (
                        <p className="mt-1 pl-6 text-xs text-gray-500">
                          {propertyCode}
                        </p>
                      )}

                      {propertyLocation && (
                        <p className="mt-1 max-w-[220px] truncate pl-6 text-xs text-gray-400">
                          {propertyLocation}
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
                          {unitName}
                        </p>
                      </div>

                      <p className="mt-1 pl-6 text-xs text-gray-500">
                        {apartmentName}
                      </p>

                      {unitStatus && (
                        <p className="mt-1 pl-6 text-xs text-gray-400">
                          {unitStatus}
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
                              tenancy.start_date
                            )}
                          </p>

                          <p className="text-xs text-gray-500">
                            to{" "}
                            {formatDate(
                              tenancy.end_date
                            )}
                          </p>
                        </div>
                      </div>

                      {tenancy.move_in_date && (
                        <p className="mt-1 pl-6 text-xs text-gray-400">
                          Move in:{" "}
                          {formatDate(
                            tenancy.move_in_date
                          )}
                        </p>
                      )}

                      {tenancy.move_out_date && (
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
                            tenancy.rent_amount ??
                            tenancy.rent ??
                            tenancy.monthly_rent
                          )}
                        </p>
                      </div>

                      {tenancy.payment_frequency && (
                        <p className="mt-1 pl-6 text-xs capitalize text-gray-500">
                          {String(
                            tenancy.payment_frequency
                          ).replace(
                            /_/g,
                            " "
                          )}
                        </p>
                      )}

                      {tenancy.service_charge !==
                        null &&
                        tenancy.service_charge !==
                        undefined && (
                          <p className="mt-1 pl-6 text-xs text-gray-400">
                            Service:{" "}
                            {formatCurrency(
                              tenancy.service_charge
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
                        {statusLabel}
                      </span>

                      {tenancy.is_expired ===
                        true && (
                          <span className="text-xs text-orange-600">
                            Expired
                          </span>
                        )}

                      {tenancy.has_moved_in ===
                        true &&
                        tenancy.has_moved_out !==
                        true && (
                          <span className="text-xs text-green-600">
                            Moved in
                          </span>
                        )}

                      {tenancy.has_moved_out ===
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
                      onActivate={
                        handleActivate
                      }
                      onDeactivate={
                        handleDeactivate
                      }
                      onRenew={handleRenew}
                      onTerminate={
                        handleTerminate
                      }
                      onCancel={handleCancel}
                      onRestore={
                        handleRestore
                      }
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