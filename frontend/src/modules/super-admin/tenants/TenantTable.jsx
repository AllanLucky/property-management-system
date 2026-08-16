import {
  CheckCircle2,
  CircleUserRound,
  Eye,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
import { useState } from "react";

/*
|--------------------------------------------------------------------------
| TenantTable
|--------------------------------------------------------------------------
| Professional tenant directory table.
|
| Designed to work with the current Tenant API response:
|
| tenant
| ├── id
| ├── tenant_number
| ├── user_id
| ├── first_name
| ├── last_name
| ├── other_names
| ├── email
| ├── phone
| ├── country
| ├── county
| ├── city
| ├── status
| ├── is_verified
| ├── verified_at
| ├── created_at
| ├── user
| ├── tenancies
| └── active_tenancy
|
| The component is intentionally defensive because tenancy/unit
| information may not be returned by the tenant index endpoint.
|--------------------------------------------------------------------------
*/

const TenantTable = ({
  tenants = [],
  loading = false,
  onEdit,
  onView,
  onDelete,
  onRefresh,
}) => {
  const [openMenu, setOpenMenu] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | SAFE TENANT LIST
  |--------------------------------------------------------------------------
  */

  const tenantList = Array.isArray(tenants)
    ? tenants
    : [];

  /*
  |--------------------------------------------------------------------------
  | SAFE BOOLEAN
  |--------------------------------------------------------------------------
  */

  const isTrue = (value) => {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value === 1;
    }

    if (typeof value === "string") {
      return [
        "1",
        "true",
        "yes",
        "active",
        "verified",
      ].includes(value.trim().toLowerCase());
    }

    return false;
  };

  /*
  |--------------------------------------------------------------------------
  | SAFE STRING
  |--------------------------------------------------------------------------
  */

  const getString = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
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

    return "";
  };

  /*
  |--------------------------------------------------------------------------
  | FULL NAME
  |--------------------------------------------------------------------------
  */

  const getFullName = (tenant) => {
    if (!tenant) {
      return "Unknown Tenant";
    }

    if (
      typeof tenant.full_name === "string" &&
      tenant.full_name.trim()
    ) {
      return tenant.full_name.trim();
    }

    const user = tenant.user;

    if (
      user &&
      typeof user.full_name === "string" &&
      user.full_name.trim()
    ) {
      return user.full_name.trim();
    }

    const parts = [
      tenant.first_name,
      tenant.other_names,
      tenant.last_name,
    ].filter(
      (value) =>
        typeof value === "string" &&
        value.trim()
    );

    if (parts.length > 0) {
      return parts.join(" ");
    }

    const userParts = [
      user?.first_name,
      user?.other_names,
      user?.last_name,
    ].filter(
      (value) =>
        typeof value === "string" &&
        value.trim()
    );

    return userParts.length > 0
      ? userParts.join(" ")
      : "Unknown Tenant";
  };

  /*
  |--------------------------------------------------------------------------
  | INITIALS
  |--------------------------------------------------------------------------
  */

  const getInitials = (tenant) => {
    const name = getFullName(tenant);

    if (
      !name ||
      name === "Unknown Tenant"
    ) {
      return "T";
    }

    const parts = name
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return `${parts[0][0]}${
      parts[parts.length - 1][0]
    }`.toUpperCase();
  };

  /*
  |--------------------------------------------------------------------------
  | TENANT NUMBER
  |--------------------------------------------------------------------------
  */

  const getTenantNumber = (tenant) => {
    return (
      getString(tenant?.tenant_number) ||
      getString(tenant?.tenant_code) ||
      getString(tenant?.code) ||
      (
        tenant?.id
          ? `TNT-${String(tenant.id).padStart(6, "0")}`
          : "N/A"
      )
    );
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const getStatus = (tenant) => {
    return String(
      tenant?.status ||
      tenant?.tenant_status ||
      tenant?.account_status ||
      ""
    )
      .trim()
      .toLowerCase();
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS LABEL
  |--------------------------------------------------------------------------
  */

  const getStatusLabel = (tenant) => {
    if (
      typeof tenant?.status_label === "string" &&
      tenant.status_label.trim()
    ) {
      return tenant.status_label.trim();
    }

    const status = getStatus(tenant);

    if (!status) {
      return "Unknown";
    }

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS STYLES
  |--------------------------------------------------------------------------
  */

  const getStatusClasses = (tenant) => {
    switch (getStatus(tenant)) {
      case "active":
        return {
          wrapper:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
          icon: CheckCircle2,
        };

      case "pending":
        return {
          wrapper:
            "bg-amber-50 text-amber-700 ring-amber-600/20",
          icon: UserCheck,
        };

      case "inactive":
        return {
          wrapper:
            "bg-slate-100 text-slate-600 ring-slate-500/20",
          icon: UserX,
        };

      case "blacklisted":
        return {
          wrapper:
            "bg-red-50 text-red-700 ring-red-600/20",
          icon: ShieldAlert,
        };

      default:
        return {
          wrapper:
            "bg-gray-100 text-gray-600 ring-gray-500/20",
          icon: CircleUserRound,
        };
    }
  };

  /*
  |--------------------------------------------------------------------------
  | VERIFIED
  |--------------------------------------------------------------------------
  */

  const isVerified = (tenant) => {
    return isTrue(
      tenant?.is_verified ??
      tenant?.verified ??
      tenant?.user?.is_verified
    );
  };

  /*
  |--------------------------------------------------------------------------
  | ACTIVE ACCOUNT
  |--------------------------------------------------------------------------
  */

  const isActive = (tenant) => {
    if (
      tenant?.is_active !== undefined &&
      tenant?.is_active !== null
    ) {
      return isTrue(tenant.is_active);
    }

    if (
      tenant?.account_status !== undefined &&
      tenant?.account_status !== null
    ) {
      return (
        String(tenant.account_status)
          .toLowerCase() === "active"
      );
    }

    return getStatus(tenant) === "active";
  };

  /*
  |--------------------------------------------------------------------------
  | TENANCIES
  |--------------------------------------------------------------------------
  */

  const getTenancies = (tenant) => {
    if (
      Array.isArray(tenant?.tenancies)
    ) {
      return tenant.tenancies;
    }

    if (
      Array.isArray(tenant?.tenancy)
    ) {
      return tenant.tenancy;
    }

    return [];
  };

  /*
  |--------------------------------------------------------------------------
  | ACTIVE TENANCY
  |--------------------------------------------------------------------------
  */

  const getActiveTenancy = (tenant) => {
    if (
      tenant?.active_tenancy &&
      typeof tenant.active_tenancy === "object"
    ) {
      return tenant.active_tenancy;
    }

    if (
      tenant?.current_tenancy &&
      typeof tenant.current_tenancy === "object"
    ) {
      return tenant.current_tenancy;
    }

    const tenancies = getTenancies(tenant);

    if (tenancies.length === 0) {
      return null;
    }

    return (
      tenancies.find((tenancy) =>
        isTrue(
          tenancy?.is_currently_active
        )
      ) ||
      tenancies.find((tenancy) =>
        isTrue(tenancy?.is_active)
      ) ||
      tenancies.find(
        (tenancy) =>
          String(
            tenancy?.status || ""
          ).toLowerCase() === "active"
      ) ||
      null
    );
  };

  /*
  |--------------------------------------------------------------------------
  | HAS ACTIVE TENANCY
  |--------------------------------------------------------------------------
  */

  const hasActiveTenancy = (tenant) => {
    return Boolean(
      getActiveTenancy(tenant)
    );
  };

  /*
  |--------------------------------------------------------------------------
  | PHONE
  |--------------------------------------------------------------------------
  */

  const getPhone = (tenant) => {
    return (
      getString(tenant?.phone) ||
      getString(tenant?.phone_number) ||
      getString(tenant?.user?.phone) ||
      "—"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | EMAIL
  |--------------------------------------------------------------------------
  */

  const getEmail = (tenant) => {
    return (
      getString(tenant?.email) ||
      getString(tenant?.user?.email) ||
      "—"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | UNIT
  |--------------------------------------------------------------------------
  */

  const getUnitName = (tenant) => {
    /*
    | Direct unit relation
    */

    const directUnit = tenant?.unit;

    if (
      directUnit &&
      typeof directUnit === "object"
    ) {
      return (
        getString(
          directUnit.full_unit_name
        ) ||
        getString(
          directUnit.unit_name
        ) ||
        getString(
          directUnit.unit_number
        ) ||
        (
          directUnit.id
            ? `Unit #${directUnit.id}`
            : "—"
        )
      );
    }

    /*
    | Direct tenant unit fields
    */

    if (
      tenant?.unit_name ||
      tenant?.unit_number
    ) {
      return (
        getString(tenant.unit_name) ||
        getString(tenant.unit_number)
      );
    }

    /*
    | Active tenancy
    */

    const activeTenancy =
      getActiveTenancy(tenant);

    if (activeTenancy) {
      const tenancyUnit =
        activeTenancy.unit;

      if (
        tenancyUnit &&
        typeof tenancyUnit === "object"
      ) {
        return (
          getString(
            tenancyUnit.full_unit_name
          ) ||
          getString(
            tenancyUnit.unit_name
          ) ||
          getString(
            tenancyUnit.unit_number
          ) ||
          (
            tenancyUnit.id
              ? `Unit #${tenancyUnit.id}`
              : "—"
          )
        );
      }

      if (
        activeTenancy.unit_name ||
        activeTenancy.unit_number
      ) {
        return (
          getString(
            activeTenancy.unit_name
          ) ||
          getString(
            activeTenancy.unit_number
          )
        );
      }

      if (activeTenancy.unit_id) {
        return `Unit #${activeTenancy.unit_id}`;
      }
    }

    /*
    | First tenancy
    */

    const tenancies = getTenancies(tenant);

    const firstTenancy =
      tenancies.find(
        (tenancy) =>
          tenancy?.unit_id ||
          tenancy?.unit
      );

    if (firstTenancy) {
      const tenancyUnit =
        firstTenancy.unit;

      if (
        tenancyUnit &&
        typeof tenancyUnit === "object"
      ) {
        return (
          getString(
            tenancyUnit.full_unit_name
          ) ||
          getString(
            tenancyUnit.unit_name
          ) ||
          getString(
            tenancyUnit.unit_number
          ) ||
          (
            tenancyUnit.id
              ? `Unit #${tenancyUnit.id}`
              : "—"
          )
        );
      }

      if (firstTenancy.unit_name) {
        return getString(
          firstTenancy.unit_name
        );
      }

      if (firstTenancy.unit_number) {
        return getString(
          firstTenancy.unit_number
        );
      }

      if (firstTenancy.unit_id) {
        return `Unit #${firstTenancy.unit_id}`;
      }
    }

    /*
    | Direct unit ID
    */

    if (tenant?.unit_id) {
      return `Unit #${tenant.unit_id}`;
    }

    /*
    | No tenancy/unit supplied by API
    */

    return "Not assigned";
  };

  /*
  |--------------------------------------------------------------------------
  | LOCATION VALUE
  |--------------------------------------------------------------------------
  */

  const getLocationValue = (value) => {
    if (!value) {
      return "";
    }

    if (typeof value === "string") {
      return value.trim();
    }

    if (typeof value === "object") {
      return (
        getString(value.name) ||
        getString(value.title) ||
        getString(value.label) ||
        ""
      );
    }

    return "";
  };

  /*
  |--------------------------------------------------------------------------
  | LOCATION
  |--------------------------------------------------------------------------
  */

  const getLocation = (tenant) => {
    const city =
      getLocationValue(
        tenant?.city
      ) ||
      getLocationValue(
        tenant?.city_name
      );

    const county =
      getLocationValue(
        tenant?.county
      ) ||
      getLocationValue(
        tenant?.county_name
      );

    if (city && county) {
      return `${city}, ${county}`;
    }

    return (
      city ||
      county ||
      getLocationValue(tenant?.address) ||
      "—"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | CREATED DATE
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

    return date.toLocaleDateString(
      "en-KE",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /*
  |--------------------------------------------------------------------------
  | PHOTO
  |--------------------------------------------------------------------------
  */

  const getPhoto = (tenant) => {
    const documents =
      tenant?.documents &&
      typeof tenant.documents === "object"
        ? tenant.documents
        : {};

    return (
      getString(tenant?.avatar) ||
      getString(tenant?.profile_photo) ||
      getString(tenant?.photo_url) ||
      getString(
        tenant?.profile_photo_url
      ) ||
      getString(tenant?.photo) ||
      getString(documents?.photo) ||
      null
    );
  };

  /*
  |--------------------------------------------------------------------------
  | VERIFICATION LABEL
  |--------------------------------------------------------------------------
  */

  const getVerificationLabel = (tenant) => {
    if (
      typeof tenant?.verification_status ===
        "string" &&
      tenant.verification_status.trim()
    ) {
      return tenant.verification_status.trim();
    }

    if (isVerified(tenant)) {
      return "Verified";
    }

    return "Unverified";
  };

  /*
  |--------------------------------------------------------------------------
  | MENU
  |--------------------------------------------------------------------------
  */

  const toggleMenu = (tenantId) => {
    setOpenMenu((current) =>
      current === tenantId
        ? null
        : tenantId
    );
  };

  /*
  |--------------------------------------------------------------------------
  | ACTIONS
  |--------------------------------------------------------------------------
  */

  const handleView = (tenant) => {
    setOpenMenu(null);

    if (typeof onView === "function") {
      onView(tenant);
    }
  };

  const handleEdit = (tenant) => {
    setOpenMenu(null);

    if (typeof onEdit === "function") {
      onEdit(tenant);
    }
  };

  const handleDelete = (tenant) => {
    setOpenMenu(null);

    if (typeof onDelete === "function") {
      onDelete(tenant);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | TABLE HEADER
  |--------------------------------------------------------------------------
  */

  const tableHeadClass =
    "px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500";

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (
    loading &&
    tenantList.length === 0
  ) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-white px-5 py-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-3 w-48 rounded bg-gray-100" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                {[
                  "Tenant",
                  "Contact",
                  "Unit",
                  "Location",
                  "Status",
                  "Verification",
                  "Created",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className={tableHeadClass}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({
                length: 7,
              }).map((_, index) => (
                <tr
                  key={index}
                  className="animate-pulse border-b border-gray-100"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200" />

                      <div className="space-y-2">
                        <div className="h-3.5 w-32 rounded bg-gray-200" />
                        <div className="h-3 w-20 rounded bg-gray-100" />
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      <div className="h-3 w-36 rounded bg-gray-200" />
                      <div className="h-3 w-28 rounded bg-gray-100" />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-7 w-24 rounded-lg bg-gray-200" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-3.5 w-28 rounded bg-gray-200" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-6 w-20 rounded-full bg-gray-200" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      <div className="h-6 w-24 rounded-full bg-gray-200" />
                      <div className="h-3 w-20 rounded bg-gray-100" />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="h-3.5 w-24 rounded bg-gray-200" />
                  </td>

                  <td className="px-5 py-4">
                    <div className="ml-auto h-9 w-9 rounded-lg bg-gray-200" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | EMPTY STATE
  |--------------------------------------------------------------------------
  */

  if (
    !loading &&
    tenantList.length === 0
  ) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
            <CircleUserRound className="h-8 w-8" />
          </div>

          <h3 className="mt-5 text-base font-semibold text-gray-900">
            No tenants found
          </h3>

          <p className="mt-1.5 max-w-md text-sm leading-6 text-gray-500">
            There are no tenants matching
            your current filters. Try
            adjusting your search or
            refreshing the tenant list.
          </p>

          {typeof onRefresh ===
            "function" && (
              <button
                type="button"
                onClick={onRefresh}
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                Refresh tenant list
              </button>
            )}
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TABLE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* HEADER */}

      <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-gray-900">
              Tenant Directory
            </h3>

            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {tenantList.length.toLocaleString()}
            </span>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            Manage tenant profiles,
            contact details and occupancy
            information.
          </p>
        </div>

        {loading && (
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 sm:self-auto">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-600" />
            Updating tenant list...
          </div>
        )}
      </div>

      {/* TABLE */}

      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full">

          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">

              <th className={tableHeadClass}>
                Tenant
              </th>

              <th className={tableHeadClass}>
                Contact
              </th>

              <th className={tableHeadClass}>
                Unit
              </th>

              <th className={tableHeadClass}>
                Location
              </th>

              <th className={tableHeadClass}>
                Status
              </th>

              <th className={tableHeadClass}>
                Verification
              </th>

              <th className={tableHeadClass}>
                Created
              </th>

              <th
                className={`${tableHeadClass} text-right`}
              >
                Actions
              </th>

            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">

            {tenantList.map((tenant) => {
              const tenantId =
                tenant?.id ??
                tenant?.tenant_number ??
                Math.random();

              const statusClasses =
                getStatusClasses(tenant);

              const StatusIcon =
                statusClasses.icon;

              const verified =
                isVerified(tenant);

              const active =
                isActive(tenant);

              const activeTenancy =
                hasActiveTenancy(tenant);

              const photo =
                getPhoto(tenant);

              const verificationLabel =
                getVerificationLabel(
                  tenant
                );

              return (
                <tr
                  key={tenantId}
                  className="group transition-colors duration-150 hover:bg-gray-50/70"
                >

                  {/* TENANT */}

                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex items-center gap-3.5">

                      <div className="relative shrink-0">

                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary-50 text-sm font-bold text-primary-700 ring-2 ring-white ring-offset-1 ring-offset-gray-100">

                          {photo ? (
                            <img
                              src={photo}
                              alt={getFullName(
                                tenant
                              )}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display =
                                  "none";
                                event.currentTarget.parentElement.textContent =
                                  getInitials(
                                    tenant
                                  );
                              }}
                            />
                          ) : (
                            getInitials(
                              tenant
                            )
                          )}

                        </div>

                        {active && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                        )}

                      </div>

                      <div className="min-w-0">

                        <button
                          type="button"
                          onClick={() =>
                            handleView(
                              tenant
                            )
                          }
                          className="block max-w-[230px] truncate text-left text-sm font-semibold text-gray-900 transition hover:text-primary-600"
                          title={getFullName(
                            tenant
                          )}
                        >
                          {getFullName(
                            tenant
                          )}
                        </button>

                        <div className="mt-1 flex items-center gap-1.5">

                          <span className="text-[11px] font-medium tracking-wide text-gray-400">
                            {getTenantNumber(
                              tenant
                            )}
                          </span>

                          {activeTenancy && (
                            <>
                              <span className="text-gray-300">
                                •
                              </span>

                              <span className="text-[11px] font-medium text-emerald-600">
                                Occupied
                              </span>
                            </>
                          )}

                        </div>

                      </div>

                    </div>
                  </td>

                  {/* CONTACT */}

                  <td className="px-5 py-4">
                    <div className="space-y-2">

                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                          <Mail className="h-3.5 w-3.5" />
                        </span>

                        <span
                          className="max-w-[220px] truncate text-xs font-medium text-gray-700"
                          title={getEmail(
                            tenant
                          )}
                        >
                          {getEmail(
                            tenant
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                          <Phone className="h-3.5 w-3.5" />
                        </span>

                        <span className="text-xs text-gray-600">
                          {getPhone(
                            tenant
                          )}
                        </span>
                      </div>

                    </div>
                  </td>

                  {/* UNIT */}

                  <td className="px-5 py-4">

                    <button
                      type="button"
                      onClick={() =>
                        handleView(
                          tenant
                        )
                      }
                      className="group/unit inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-primary-200 hover:bg-primary-50/70 hover:shadow-none"
                    >

                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-[10px] font-bold text-gray-500 transition group-hover/unit:bg-primary-100 group-hover/unit:text-primary-700">
                        U
                      </span>

                      <span className="max-w-[120px] truncate text-xs font-semibold text-gray-700 group-hover/unit:text-primary-700">
                        {getUnitName(
                          tenant
                        )}
                      </span>

                    </button>

                  </td>

                  {/* LOCATION */}

                  <td className="px-5 py-4">

                    <div className="flex items-center gap-2">

                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                        <MapPin className="h-3.5 w-3.5" />
                      </span>

                      <span className="max-w-[150px] truncate text-xs font-medium text-gray-600">
                        {getLocation(
                          tenant
                        )}
                      </span>

                    </div>

                  </td>

                  {/* STATUS */}

                  <td className="px-5 py-4">

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold ring-1 ring-inset ${statusClasses.wrapper}`}
                    >

                      <StatusIcon className="h-3.5 w-3.5" />

                      {getStatusLabel(
                        tenant
                      )}

                    </span>

                  </td>

                  {/* VERIFICATION */}

                  <td className="px-5 py-4">

                    <div className="space-y-1.5">

                      {verified ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">

                          <CheckCircle2 className="h-3.5 w-3.5" />

                          {verificationLabel}

                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 ring-1 ring-inset ring-gray-500/20">

                          <XCircle className="h-3.5 w-3.5" />

                          {verificationLabel}

                        </span>
                      )}

                      <div className="flex items-center gap-1.5 text-[11px]">

                        <span className="text-gray-400">
                          Account
                        </span>

                        <span
                          className={`font-semibold ${
                            active
                              ? "text-emerald-600"
                              : "text-gray-500"
                          }`}
                        >
                          {active
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </div>

                      {activeTenancy && (
                        <div className="flex items-center gap-1.5 text-[11px]">

                          <span className="text-gray-400">
                            Tenancy
                          </span>

                          <span className="font-semibold text-emerald-600">
                            Active
                          </span>

                        </div>
                      )}

                    </div>

                  </td>

                  {/* CREATED */}

                  <td className="whitespace-nowrap px-5 py-4">

                    <div className="text-xs font-medium text-gray-600">
                      {formatDate(
                        tenant?.created_at
                      )}
                    </div>

                  </td>

                  {/* ACTIONS */}

                  <td className="px-5 py-4 text-right">

                    <div className="relative flex justify-end">

                      <button
                        type="button"
                        onClick={() =>
                          toggleMenu(
                            tenantId
                          )
                        }
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                          openMenu ===
                          tenantId
                            ? "border-gray-300 bg-gray-100 text-gray-800"
                            : "border-transparent text-gray-400 hover:border-gray-200 hover:bg-gray-100 hover:text-gray-700"
                        }`}
                        aria-label={`Actions for ${getFullName(
                          tenant
                        )}`}
                        aria-expanded={
                          openMenu ===
                          tenantId
                        }
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>

                      {openMenu ===
                        tenantId && (
                        <>

                          <button
                            type="button"
                            className="fixed inset-0 z-10 cursor-default"
                            onClick={() =>
                              setOpenMenu(
                                null
                              )
                            }
                            aria-label="Close menu"
                          />

                          <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 text-left shadow-xl shadow-gray-200/50">

                            {typeof onView ===
                              "function" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleView(
                                    tenant
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
                              >

                                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100">
                                  <Eye className="h-4 w-4 text-gray-500" />
                                </span>

                                <span>
                                  View Tenant
                                </span>

                              </button>
                            )}

                            {typeof onEdit ===
                              "function" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    tenant
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
                              >

                                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100">
                                  <Pencil className="h-4 w-4 text-gray-500" />
                                </span>

                                <span>
                                  Edit Tenant
                                </span>

                              </button>
                            )}

                            {(typeof onView ===
                              "function" ||
                              typeof onEdit ===
                                "function") &&
                              typeof onDelete ===
                                "function" && (
                                <div className="my-1.5 border-t border-gray-100" />
                              )}

                            {typeof onDelete ===
                              "function" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    tenant
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                              >

                                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </span>

                                <span>
                                  Delete Tenant
                                </span>

                              </button>
                            )}

                          </div>
                        </>
                      )}

                    </div>

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>
      </div>

      {/* FOOTER */}

      <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50/50 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-2 text-xs text-gray-500">

          <span>
            Showing
          </span>

          <span className="font-semibold text-gray-700">
            {tenantList.length.toLocaleString()}
          </span>

          <span>
            tenant
            {tenantList.length !== 1
              ? "s"
              : ""}
          </span>

        </div>

        {loading && (
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary-600">

            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-600" />

            Syncing tenant data...

          </div>
        )}

      </div>

    </div>
  );
};

export default TenantTable;