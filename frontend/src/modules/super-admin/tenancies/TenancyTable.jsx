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

const formatCurrency = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const getTenantName = (tenancy) => {
  const tenant = tenancy?.tenant;

  if (!tenant) {
    return "No tenant";
  }

  if (tenant.full_name) {
    return tenant.full_name;
  }

  return [tenant.first_name, tenant.other_names, tenant.last_name]
    .filter(Boolean)
    .join(" ")
    .trim() || "No tenant";
};

const getTenantInitials = (tenancy) => {
  const tenant = tenancy?.tenant;

  if (!tenant) {
    return "T";
  }

  if (tenant.full_name) {
    return tenant.full_name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase();
  }

  return [tenant.first_name, tenant.last_name]
    .filter(Boolean)
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase() || "T";
};

const getPropertyName = (tenancy) => {
  return (
    tenancy?.property?.title ||
    tenancy?.property?.name ||
    tenancy?.apartment?.property_title ||
    tenancy?.apartment?.property?.title ||
    "No property"
  );
};

const getApartmentName = (tenancy) => {
  return (
    tenancy?.apartment?.full_name ||
    tenancy?.apartment?.name ||
    tenancy?.apartment?.apartment_number ||
    "No apartment"
  );
};

const getUnitName = (tenancy) => {
  return (
    tenancy?.unit?.unit_number ||
    tenancy?.unit?.name ||
    "No unit"
  );
};

const getStatus = (tenancy) => {
  const rawStatus =
    tenancy?.status_label ||
    tenancy?.status ||
    "unknown";

  return String(rawStatus)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getStatusClasses = (tenancy) => {
  const status = String(tenancy?.status || "").toLowerCase();

  if (
    status === "active" ||
    tenancy?.is_currently_active ||
    tenancy?.is_active
  ) {
    return "bg-green-50 text-green-700 ring-green-600/20";
  }

  if (status === "pending") {
    return "bg-yellow-50 text-yellow-700 ring-yellow-600/20";
  }

  if (status === "expired") {
    return "bg-orange-50 text-orange-700 ring-orange-600/20";
  }

  if (status === "terminated") {
    return "bg-red-50 text-red-700 ring-red-600/20";
  }

  if (status === "cancelled" || status === "canceled") {
    return "bg-gray-100 text-gray-700 ring-gray-500/20";
  }

  if (
    status === "deleted" ||
    status === "trashed"
  ) {
    return "bg-red-100 text-red-800 ring-red-600/20";
  }

  return "bg-gray-100 text-gray-700 ring-gray-500/20";
};

/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

const EmptyState = ({ hasFilters }) => {
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
  | Optional table configuration
  |--------------------------------------------------------------------------
  */

  hasFilters = false,
  emptyMessage,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Normalize data
  |--------------------------------------------------------------------------
  */

  const rows = useMemo(() => {
    if (!Array.isArray(tenancies)) {
      return [];
    }

    return tenancies.filter(Boolean);
  }, [tenancies]);

  /*
  |--------------------------------------------------------------------------
  | Action handlers
  |--------------------------------------------------------------------------
  */

  const handleDelete = useCallback(
    async (id) => {
      if (!onDelete) {
        return;
      }

      return onDelete(id);
    },
    [onDelete]
  );

  const handleActivate = useCallback(
    async (id) => {
      if (!onActivate) {
        return;
      }

      return onActivate(id);
    },
    [onActivate]
  );

  const handleDeactivate = useCallback(
    async (id) => {
      if (!onDeactivate) {
        return;
      }

      return onDeactivate(id);
    },
    [onDeactivate]
  );

  const handleRenew = useCallback(
    async (id, data) => {
      if (!onRenew) {
        return;
      }

      return onRenew(id, data);
    },
    [onRenew]
  );

  const handleTerminate = useCallback(
    async (id, data) => {
      if (!onTerminate) {
        return;
      }

      return onTerminate(id, data);
    },
    [onTerminate]
  );

  const handleCancel = useCallback(
    async (id, data) => {
      if (!onCancel) {
        return;
      }

      return onCancel(id, data);
    },
    [onCancel]
  );

  const handleRestore = useCallback(
    async (id) => {
      if (!onRestore) {
        return;
      }

      return onRestore(id);
    },
    [onRestore]
  );

  const handleForceDelete = useCallback(
    async (id) => {
      if (!onForceDelete) {
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

              {/* Dates */}
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
              const tenantName = getTenantName(tenancy);
              const tenantInitials = getTenantInitials(tenancy);

              const propertyName = getPropertyName(tenancy);
              const apartmentName = getApartmentName(tenancy);
              const unitName = getUnitName(tenancy);

              const statusLabel = getStatus(tenancy);
              const statusClasses = getStatusClasses(tenancy);

              return (
                <tr
                  key={tenancy.id}
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
                          {tenancy.tenancy_number ||
                            `TEN-${tenancy.id}`}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          ID #{tenancy.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Tenant */}
                  <td className="px-5 py-4">
                    <div className="flex min-w-[210px] items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                        {tenancy?.tenant?.photo ||
                          tenancy?.tenant?.image ? (
                          <img
                            src={
                              tenancy?.tenant?.photo ||
                              tenancy?.tenant?.image
                            }
                            alt={tenantName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          tenantInitials
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5 text-gray-400" />

                          <p className="truncate text-sm font-medium text-gray-900">
                            {tenantName}
                          </p>
                        </div>

                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {tenancy?.tenant?.tenant_number ||
                            "Tenant"}
                        </p>

                        {tenancy?.tenant?.phone && (
                          <p className="mt-0.5 truncate text-xs text-gray-400">
                            {tenancy.tenant.phone}
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

                      {tenancy?.property?.property_code && (
                        <p className="mt-1 pl-6 text-xs text-gray-500">
                          {tenancy.property.property_code}
                        </p>
                      )}

                      {tenancy?.property?.full_location && (
                        <p className="mt-1 max-w-[220px] truncate pl-6 text-xs text-gray-400">
                          {tenancy.property.full_location}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Unit */}
                  <td className="px-5 py-4">
                    <div className="min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 shrink-0 text-gray-400" />

                        <p className="text-sm font-medium text-gray-900">
                          {unitName}
                        </p>
                      </div>

                      <p className="mt-1 pl-6 text-xs text-gray-500">
                        {apartmentName}
                      </p>

                      {tenancy?.unit?.status_label && (
                        <p className="mt-1 pl-6 text-xs text-gray-400">
                          {tenancy.unit.status_label}
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
                            {formatDate(tenancy.start_date)}
                          </p>

                          <p className="text-xs text-gray-500">
                            to{" "}
                            {formatDate(tenancy.end_date)}
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
                    </div>
                  </td>

                  {/* Rent */}
                  <td className="px-5 py-4">
                    <div className="min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 shrink-0 text-gray-400" />

                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(
                            tenancy.rent_amount
                          )}
                        </p>
                      </div>

                      {tenancy.payment_frequency && (
                        <p className="mt-1 pl-6 text-xs capitalize text-gray-500">
                          {String(
                            tenancy.payment_frequency
                          ).replace(/_/g, " ")}
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

                      {tenancy.is_expired && (
                        <span className="text-xs text-orange-600">
                          Expired
                        </span>
                      )}

                      {tenancy.has_moved_in &&
                        !tenancy.has_moved_out && (
                          <span className="text-xs text-green-600">
                            Moved in
                          </span>
                        )}

                      {tenancy.has_moved_out && (
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
                      onDeactivate={handleDeactivate}
                      onRenew={handleRenew}
                      onTerminate={handleTerminate}
                      onCancel={handleCancel}
                      onRestore={handleRestore}
                      onForceDelete={handleForceDelete}
                      loading={loading}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile/table overflow hint */}
      <div className="border-t border-gray-100 bg-gray-50 px-5 py-2 text-xs text-gray-400 lg:hidden">
        Scroll horizontally to view all tenancy information.
      </div>
    </div>
  );
};

export default TenancyTable;