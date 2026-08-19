import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Edit3,
  FileText,
  Home,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  UserCheck,
  UserX,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Swal from "sweetalert2";

import { useTenant } from "../../../hooks/useTenant";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const isObject = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};

const isTruthy = (value) => {
  if (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  ) {
    return true;
  }

  return false;
};

const valueOrFallback = (
  value,
  fallback = "—"
) => {
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
    return (
      value?.name ||
      value?.title ||
      value?.label ||
      value?.value ||
      fallback
    );
  }

  return String(value);
};

const capitalize = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(
      /\b\w/g,
      (char) => char.toUpperCase()
    );
};

const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return valueOrFallback(date);
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  ).format(parsed);
};

const formatDateTime = (date) => {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return valueOrFallback(date);
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(parsed);
};

const formatMoney = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const numericValue = Number(
    String(value).replace(/,/g, "")
  );

  if (
    Number.isNaN(
      numericValue
    )
  ) {
    return String(value);
  }

  return new Intl.NumberFormat(
    "en-KE",
    {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(numericValue);
};

const getInitials = (tenant) => {
  const firstName =
    tenant?.first_name ||
    tenant?.firstName ||
    tenant?.user?.first_name ||
    "";

  const lastName =
    tenant?.last_name ||
    tenant?.lastName ||
    tenant?.user?.last_name ||
    "";

  const initials = `${String(
    firstName
  ).charAt(0)}${String(
    lastName
  ).charAt(0)}`.toUpperCase();

  if (initials) {
    return initials;
  }

  const name =
    tenant?.full_name ||
    tenant?.fullName ||
    tenant?.name ||
    tenant?.user?.name ||
    "";

  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0)
    )
    .join("")
    .toUpperCase() || "T";
};

const getFullName = (tenant) => {
  if (!tenant) {
    return "Tenant";
  }

  if (
    tenant?.full_name &&
    typeof tenant.full_name === "string"
  ) {
    return tenant.full_name;
  }

  if (
    tenant?.fullName &&
    typeof tenant.fullName === "string"
  ) {
    return tenant.fullName;
  }

  if (
    tenant?.name &&
    typeof tenant.name === "string"
  ) {
    return tenant.name;
  }

  if (
    tenant?.user?.full_name &&
    typeof tenant.user.full_name === "string"
  ) {
    return tenant.user.full_name;
  }

  if (
    tenant?.user?.name &&
    typeof tenant.user.name === "string"
  ) {
    return tenant.user.name;
  }

  return [
    tenant?.first_name ||
    tenant?.firstName ||
    tenant?.user?.first_name,

    tenant?.other_names ||
    tenant?.middle_name ||
    tenant?.middleName ||
    tenant?.user?.other_names ||
    tenant?.user?.middle_name,

    tenant?.last_name ||
    tenant?.lastName ||
    tenant?.user?.last_name,
  ]
    .filter(Boolean)
    .join(" ") || "Tenant";
};

const getStatus = (tenant) => {
  if (!tenant) {
    return "unknown";
  }

  const rawStatus =
    tenant?.status ||
    tenant?.tenant_status ||
    tenant?.account_status;

  if (
    rawStatus &&
    typeof rawStatus === "string"
  ) {
    return rawStatus
      .toLowerCase()
      .replace(/\s+/g, "_");
  }

  const active = isTruthy(
    tenant?.is_active
  );

  const blacklisted =
    tenant?.is_blacklisted === true ||
    tenant?.is_blacklisted === 1 ||
    tenant?.is_blacklisted === "1" ||
    tenant?.blacklisted === true ||
    tenant?.blacklisted === 1;

  if (blacklisted) {
    return "blacklisted";
  }

  if (active) {
    return "active";
  }

  return "inactive";
};

const getStatusLabel = (tenant) => {
  return capitalize(
    getStatus(tenant)
  );
};

const getStatusClasses = (tenant) => {
  const status = getStatus(tenant);

  switch (status) {
    case "active":
    case "approved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "inactive":
      return "bg-slate-50 text-slate-700 ring-slate-200";

    case "pending":
    case "pending_approval":
      return "bg-amber-50 text-amber-700 ring-amber-200";

    case "blacklisted":
    case "blacklist":
      return "bg-red-50 text-red-700 ring-red-200";

    case "suspended":
      return "bg-orange-50 text-orange-700 ring-orange-200";

    case "terminated":
      return "bg-red-50 text-red-700 ring-red-200";

    case "verified":
      return "bg-blue-50 text-blue-700 ring-blue-200";

    default:
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
};

const getStatusIcon = (tenant) => {
  const status = getStatus(tenant);

  switch (status) {
    case "active":
    case "approved":
      return (
        <CheckCircle2 size={15} />
      );

    case "pending":
    case "pending_approval":
      return (
        <Clock3 size={15} />
      );

    case "blacklisted":
    case "blacklist":
      return (
        <Ban size={15} />
      );

    case "inactive":
      return (
        <UserX size={15} />
      );

    case "suspended":
      return (
        <UserX size={15} />
      );

    default:
      return (
        <ShieldCheck size={15} />
      );
  }
};

const getLocationName = (
  value
) => {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  if (
    typeof value === "number"
  ) {
    return String(value);
  }

  if (isObject(value)) {
    return (
      value?.name ||
      value?.title ||
      value?.label ||
      ""
    );
  }

  return "";
};

const getPropertyName = (
  tenancy
) => {
  return (
    tenancy?.property?.title ||
    tenancy?.property?.name ||
    tenancy?.property?.property_name ||
    tenancy?.property_title ||
    tenancy?.property_name ||
    tenancy?.unit?.property?.title ||
    tenancy?.unit?.property?.name ||
    "Not assigned"
  );
};

const getApartmentName = (
  tenancy
) => {
  return (
    tenancy?.apartment?.name ||
    tenancy?.apartment?.title ||
    tenancy?.apartment?.apartment_name ||
    tenancy?.apartment_name ||
    tenancy?.unit?.apartment?.name ||
    tenancy?.unit?.apartment?.title ||
    "Not assigned"
  );
};

const getUnitName = (
  tenancy
) => {
  return (
    tenancy?.unit?.full_unit_name ||
    tenancy?.unit?.unit_name ||
    tenancy?.unit?.unit_number ||
    tenancy?.unit?.name ||
    tenancy?.unit_name ||
    tenancy?.unit_number ||
    "Not assigned"
  );
};

const getRent = (tenancy) => {
  return (
    tenancy?.rent_amount ??
    tenancy?.monthly_rent ??
    tenancy?.rent ??
    tenancy?.rent_price ??
    tenancy?.pricing?.rent_amount ??
    tenancy?.unit?.rent_amount ??
    tenancy?.unit?.price ??
    tenancy?.unit?.rent ??
    null
  );
};

const getDeposit = (tenancy) => {
  return (
    tenancy?.deposit_amount ??
    tenancy?.security_deposit ??
    tenancy?.deposit ??
    tenancy?.pricing?.deposit_amount ??
    tenancy?.unit?.deposit ??
    null
  );
};

/*
|--------------------------------------------------------------------------
| TENANCY NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizeTenancies = (
  tenant
) => {
  if (!tenant) {
    return [];
  }

  const possibleSources = [
    tenant?.tenancies,
    tenant?.active_tenancies,
    tenant?.tenancy_history,
    tenant?.tenancy,
  ];

  for (
    const source of possibleSources
  ) {
    if (Array.isArray(source)) {
      return source;
    }

    if (
      source &&
      typeof source === "object"
    ) {
      return [source];
    }
  }

  return [];
};

/*
|--------------------------------------------------------------------------
| INFO ITEM
|--------------------------------------------------------------------------
*/

const InfoItem = ({
  icon: Icon,
  label,
  value,
  children,
}) => {
  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        {Icon && (
          <Icon size={18} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        {children || (
          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {valueOrFallback(value)}
          </p>
        )}
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| SECTION
|--------------------------------------------------------------------------
*/

const Section = ({
  title,
  description,
  icon: Icon,
  children,
}) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Icon size={18} />
            </div>
          )}

          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {title}
            </h2>

            {description && (
              <p className="mt-0.5 text-xs text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
};

/*
|--------------------------------------------------------------------------
| LOADING SKELETON
|--------------------------------------------------------------------------
*/

const TenantShowSkeleton = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="h-32 animate-pulse bg-slate-200" />

          <div className="space-y-4 p-6">
            <div className="h-7 w-56 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-slate-200" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| ERROR STATE
|--------------------------------------------------------------------------
*/

const TenantError = ({
  message,
  onRetry,
}) => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <UserX size={25} />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Unable to load tenant
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {valueOrFallback(
            message,
            "The tenant could not be loaded."
          )}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| TENANT SHOW
|--------------------------------------------------------------------------
*/

const TenantShow = () => {
  const navigate =
    useNavigate();

  const { id } =
    useParams();

  const [refreshing, setRefreshing] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | TENANT HOOK
  |--------------------------------------------------------------------------
  */

  const {
    tenant,
    loadingTenant,
    loading,
    error,
    getTenant,
    fetchTenant,
  } = useTenant({
    autoFetch: false,
  });

  /*
  |--------------------------------------------------------------------------
  | FETCH FUNCTION
  |--------------------------------------------------------------------------
  */

  const loadTenant =
    useCallback(
      async () => {
        if (!id) {
          return;
        }

        try {
          if (
            typeof getTenant ===
            "function"
          ) {
            await getTenant(id);
            return;
          }

          if (
            typeof fetchTenant ===
            "function"
          ) {
            await fetchTenant(id);
          }
        } catch (err) {
          console.error(
            "Failed to load tenant:",
            err
          );
        }
      },
      [
        id,
        getTenant,
        fetchTenant,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | INITIAL FETCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadTenant();
  }, [loadTenant]);

  /*
  |--------------------------------------------------------------------------
  | NORMALIZED TENANT
  |--------------------------------------------------------------------------
  */

  const tenantData =
    useMemo(() => {
      if (!tenant) {
        return null;
      }

      /*
       * Supports:
       *
       * {
       *   data: {...}
       * }
       *
       * {
       *   tenant: {...}
       * }
       *
       * {
       *   data: {
       *      tenant: {...}
       *   }
       * }
       *
       * and direct tenant objects.
       */

      let data =
        tenant?.data ??
        tenant?.tenant ??
        tenant;

      if (
        data?.tenant &&
        isObject(data.tenant)
      ) {
        data = data.tenant;
      }

      return isObject(data)
        ? data
        : null;
    }, [tenant]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const isLoading =
    Boolean(
      loadingTenant ??
      loading ??
      false
    );

  /*
  |--------------------------------------------------------------------------
  | BASIC DETAILS
  |--------------------------------------------------------------------------
  */

  const fullName =
    getFullName(
      tenantData
    );

  const initials =
    getInitials(
      tenantData
    );

  const statusLabel =
    getStatusLabel(
      tenantData
    );

  const statusClasses =
    getStatusClasses(
      tenantData
    );

  const statusIcon =
    getStatusIcon(
      tenantData
    );

  /*
  |--------------------------------------------------------------------------
  | TENANT NUMBER
  |--------------------------------------------------------------------------
  */

  const tenantNumber =
    tenantData?.tenant_number ||
    tenantData?.tenantNumber ||
    "";

  /*
  |--------------------------------------------------------------------------
  | USER DETAILS
  |--------------------------------------------------------------------------
  */

  const userData =
    isObject(
      tenantData?.user
    )
      ? tenantData.user
      : null;

  const email =
    tenantData?.email ||
    userData?.email ||
    "";

  const phone =
    tenantData?.phone ||
    tenantData?.phone_number ||
    userData?.phone ||
    userData?.phone_number ||
    "";

  /*
  |--------------------------------------------------------------------------
  | PERSONAL INFORMATION
  |--------------------------------------------------------------------------
  */

  const firstName =
    tenantData?.first_name ||
    tenantData?.firstName ||
    userData?.first_name ||
    "";

  const lastName =
    tenantData?.last_name ||
    tenantData?.lastName ||
    userData?.last_name ||
    "";

  const otherNames =
    tenantData?.other_names ||
    tenantData?.middle_name ||
    tenantData?.middleName ||
    userData?.other_names ||
    "";

  const gender =
    tenantData?.gender ||
    "";

  const dateOfBirth =
    tenantData?.date_of_birth ||
    tenantData?.dob ||
    "";

  const nationalId =
    tenantData?.national_id ||
    tenantData?.id_number ||
    tenantData?.national_id_number ||
    tenantData?.identity_number ||
    "";

  const passportNumber =
    tenantData?.passport_number ||
    tenantData?.passport ||
    "";

  const nationality =
    tenantData?.nationality ||
    "";

  /*
  |--------------------------------------------------------------------------
  | EMPLOYMENT
  |--------------------------------------------------------------------------
  */

  const occupation =
    tenantData?.occupation ||
    "";

  const employer =
    tenantData?.employer ||
    tenantData?.company ||
    "";

  /*
  |--------------------------------------------------------------------------
  | LOCATION
  |--------------------------------------------------------------------------
  */

  const country =
    getLocationName(
      tenantData?.country
    ) ||
    tenantData?.country_name ||
    "";

  const region =
    getLocationName(
      tenantData?.region
    ) ||
    tenantData?.region_name ||
    "";

  const county =
    getLocationName(
      tenantData?.county
    ) ||
    tenantData?.county_name ||
    "";

  const city =
    getLocationName(
      tenantData?.city
    ) ||
    tenantData?.city_name ||
    "";

  const area =
    getLocationName(
      tenantData?.area
    ) ||
    tenantData?.area_name ||
    "";

  const address =
    tenantData?.address ||
    tenantData?.street_address ||
    tenantData?.physical_address ||
    "";

  /*
  |--------------------------------------------------------------------------
  | DATES
  |--------------------------------------------------------------------------
  */

  const createdAt =
    tenantData?.created_at ||
    tenantData?.createdAt ||
    "";

  const updatedAt =
    tenantData?.updated_at ||
    tenantData?.updatedAt ||
    "";

  const verifiedAt =
    tenantData?.verified_at ||
    tenantData?.verification_date ||
    "";

  /*
  |--------------------------------------------------------------------------
  | STATUS FLAGS
  |--------------------------------------------------------------------------
  */

  const isVerified =
    isTruthy(
      tenantData?.is_verified
    ) ||
    tenantData?.verified === true;

  const isActive =
    isTruthy(
      tenantData?.is_active
    );

  const isBlacklisted =
    tenantData?.is_blacklisted === true ||
    tenantData?.is_blacklisted === 1 ||
    tenantData?.is_blacklisted === "1" ||
    tenantData?.blacklisted === true ||
    tenantData?.blacklisted === 1 ||
    getStatus(tenantData) ===
    "blacklisted";

  /*
  |--------------------------------------------------------------------------
  | RELATED TENANCIES
  |--------------------------------------------------------------------------
  */

  const tenancyList =
    useMemo(
      () =>
        normalizeTenancies(
          tenantData
        ),
      [tenantData]
    );

  /*
  |--------------------------------------------------------------------------
  | ACTIVE TENANCY
  |--------------------------------------------------------------------------
  */

  const activeTenancy =
    useMemo(() => {
      if (
        tenantData?.active_tenancy &&
        isObject(
          tenantData.active_tenancy
        )
      ) {
        return tenantData.active_tenancy;
      }

      return (
        tenancyList.find(
          (tenancy) => {
            const tenancyStatus =
              String(
                tenancy?.status ||
                tenancy?.tenancy_status ||
                ""
              ).toLowerCase();

            return (
              isTruthy(
                tenancy?.is_active
              ) ||
              tenancyStatus ===
              "active" ||
              tenancyStatus ===
              "ongoing"
            );
          }
        ) || null
      );
    }, [
      tenantData,
      tenancyList,
    ]);

  /*
  |--------------------------------------------------------------------------
  | TENANCY COUNT
  |--------------------------------------------------------------------------
  */

  const tenancyCount =
    Number(
      tenantData?.tenancies_count ??
      tenantData?.tenancy_count ??
      tenancyList.length
    ) || 0;

  /*
  |--------------------------------------------------------------------------
  | PROFILE IMAGE
  |--------------------------------------------------------------------------
  */

  const avatar =
    tenantData?.avatar ||
    tenantData?.profile_photo ||
    tenantData?.profile_image ||
    tenantData?.avatar_url ||
    tenantData?.profile_photo_url ||
    "";

  /*
  |--------------------------------------------------------------------------
  | COPY TENANT ID
  |--------------------------------------------------------------------------
  */

  const handleCopyId =
    useCallback(
      async () => {
        const copyValue =
          tenantNumber ||
          tenantData?.id;

        if (!copyValue) {
          return;
        }

        try {
          if (
            navigator?.clipboard
          ) {
            await navigator.clipboard.writeText(
              String(copyValue)
            );
          } else {
            throw new Error(
              "Clipboard unavailable"
            );
          }

          await Swal.fire({
            icon: "success",
            title: "Copied",
            text: "Tenant identifier copied to clipboard.",
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (copyError) {
          console.error(
            "Failed to copy tenant identifier:",
            copyError
          );

          await Swal.fire({
            icon: "error",
            title: "Copy Failed",
            text: "Unable to copy the tenant identifier.",
          });
        }
      },
      [
        tenantNumber,
        tenantData?.id,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh =
    useCallback(
      async () => {
        if (refreshing) {
          return;
        }

        setRefreshing(true);

        try {
          await loadTenant();

          await Swal.fire({
            icon: "success",
            title: "Refreshed",
            text: "Tenant information has been refreshed.",
            timer: 1200,
            showConfirmButton: false,
          });
        } finally {
          setRefreshing(false);
        }
      },
      [
        loadTenant,
        refreshing,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | BACK
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {
    navigate(-1);
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const handleEdit = () => {
    if (!id) {
      return;
    }

    navigate(
      `/tenants/${id}/edit`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    isLoading &&
    !tenantData
  ) {
    return (
      <TenantShowSkeleton />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (
    error &&
    !tenantData
  ) {
    const errorMessage =
      typeof error === "string"
        ? error
        : error?.message ||
        error?.error ||
        "The tenant could not be loaded.";

    return (
      <TenantError
        message={errorMessage}
        onRetry={loadTenant}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (!tenantData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <User size={28} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Tenant not found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            The tenant you're looking for does not exist.
          </p>

          <button
            type="button"
            onClick={handleBack}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">

        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft size={17} />
              Back to Tenants
            </button>

            <div className="mt-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Tenant Details
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View tenant profile, account status and tenancy information.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={
                refreshing ||
                isLoading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Edit3 size={17} />
              Edit Tenant
            </button>
          </div>
        </div>

        {/* REFRESH ERROR */}

        {error && tenantData && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Unable to refresh tenant information
                </p>

                <p className="mt-1 text-sm text-amber-700">
                  {typeof error === "string"
                    ? error
                    : error?.message ||
                    error?.error ||
                    "An unexpected error occurred."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* PROFILE CARD */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700" />

          <div className="px-5 pb-6 sm:px-6">
            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                {/* AVATAR */}

                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-slate-100 text-2xl font-bold text-slate-700 shadow-md">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={fullName}
                      className="h-full w-full object-cover"
                      onError={(
                        event
                      ) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  ) : (
                    initials
                  )}
                </div>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      {fullName}
                    </h2>

                    {isVerified && (
                      <span
                        title="Verified tenant"
                        className="text-blue-600"
                      >
                        <BadgeCheck
                          size={19}
                          fill="currentColor"
                          className="text-blue-500"
                        />
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses}`}
                    >
                      {statusIcon}
                      {statusLabel}
                    </span>

                    {tenantNumber && (
                      <button
                        type="button"
                        onClick={
                          handleCopyId
                        }
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                        title="Copy tenant number"
                      >
                        <Copy size={12} />
                        {tenantNumber}
                      </button>
                    )}

                    {tenantData?.id && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                        ID #{tenantData.id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CONTACT SUMMARY */}

            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem
                icon={Mail}
                label="Email"
                value={email}
              />

              <InfoItem
                icon={Phone}
                label="Phone"
                value={phone}
              />

              <InfoItem
                icon={MapPin}
                label="Location"
                value={
                  [
                    area,
                    city,
                    county,
                  ]
                    .filter(Boolean)
                    .join(", ") ||
                  country ||
                  "—"
                }
              />

              <InfoItem
                icon={CalendarDays}
                label="Member Since"
                value={formatDate(
                  createdAt
                )}
              />
            </div>
          </div>
        </section>

        {/* MAIN CONTENT */}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* LEFT */}

          <div className="space-y-6 lg:col-span-2">

            {/* PERSONAL INFORMATION */}

            <Section
              title="Personal Information"
              description="Basic identity and personal details."
              icon={User}
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoItem
                  icon={User}
                  label="First Name"
                  value={firstName}
                />

                <InfoItem
                  icon={User}
                  label="Other Names"
                  value={otherNames}
                />

                <InfoItem
                  icon={User}
                  label="Last Name"
                  value={lastName}
                />

                <InfoItem
                  icon={User}
                  label="Gender"
                  value={capitalize(
                    gender
                  )}
                />

                <InfoItem
                  icon={CalendarDays}
                  label="Date of Birth"
                  value={formatDate(
                    dateOfBirth
                  )}
                />

                <InfoItem
                  icon={FileText}
                  label="National ID"
                  value={nationalId}
                />

                <InfoItem
                  icon={FileText}
                  label="Passport Number"
                  value={
                    passportNumber
                  }
                />

                <InfoItem
                  icon={MapPin}
                  label="Nationality"
                  value={nationality}
                />

                <InfoItem
                  icon={UserCheck}
                  label="Occupation"
                  value={occupation}
                />

                <InfoItem
                  icon={Building2}
                  label="Employer"
                  value={employer}
                />

                <InfoItem
                  icon={BadgeCheck}
                  label="Verification"
                  value={
                    isVerified
                      ? "Verified"
                      : "Not Verified"
                  }
                />

                <InfoItem
                  icon={ShieldCheck}
                  label="Account"
                  value={
                    isActive
                      ? "Active"
                      : "Inactive"
                  }
                />
              </div>
            </Section>

            {/* CONTACT INFORMATION */}

            <Section
              title="Contact Information"
              description="Tenant contact and residential location details."
              icon={MapPin}
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoItem
                  icon={Mail}
                  label="Email Address"
                  value={email}
                />

                <InfoItem
                  icon={Phone}
                  label="Phone Number"
                  value={phone}
                />

                <InfoItem
                  icon={MapPin}
                  label="Country"
                  value={country}
                />

                <InfoItem
                  icon={MapPin}
                  label="Region"
                  value={region}
                />

                <InfoItem
                  icon={MapPin}
                  label="County"
                  value={county}
                />

                <InfoItem
                  icon={MapPin}
                  label="City"
                  value={city}
                />

                <InfoItem
                  icon={MapPin}
                  label="Area"
                  value={area}
                />

                <div className="sm:col-span-2">
                  <InfoItem
                    icon={Home}
                    label="Residential Address"
                    value={address}
                  />
                </div>
              </div>
            </Section>

            {/* EMERGENCY CONTACT */}

            <Section
              title="Emergency Contact"
              description="Person to contact in case of an emergency."
              icon={Phone}
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoItem
                  icon={User}
                  label="Name"
                  value={
                    tenantData?.emergency_contact_name
                  }
                />

                <InfoItem
                  icon={Phone}
                  label="Phone"
                  value={
                    tenantData?.emergency_contact_phone
                  }
                />

                <InfoItem
                  icon={UserCheck}
                  label="Relationship"
                  value={
                    tenantData?.emergency_contact_relationship
                  }
                />
              </div>
            </Section>

            {/* TENANCIES */}

            <Section
              title="Tenancy Information"
              description={`${tenancyCount} tenancy record${tenancyCount === 1
                ? ""
                : "s"
                } associated with this tenant.`}
              icon={Building2}
            >
              {tenancyList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                    <Home size={22} />
                  </div>

                  <h3 className="mt-3 text-sm font-semibold text-slate-800">
                    No tenancy records
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    This tenant does not currently have tenancy records.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tenancyList.map(
                    (
                      tenancy,
                      index
                    ) => {
                      const propertyName =
                        getPropertyName(
                          tenancy
                        );

                      const apartmentName =
                        getApartmentName(
                          tenancy
                        );

                      const unitName =
                        getUnitName(
                          tenancy
                        );

                      const tenancyStatus =
                        tenancy?.status ||
                        tenancy?.tenancy_status ||
                        (isTruthy(
                          tenancy?.is_active
                        )
                          ? "active"
                          : "unknown");

                      const rent =
                        getRent(
                          tenancy
                        );

                      const startDate =
                        tenancy?.start_date ||
                        tenancy?.lease_start_date ||
                        tenancy?.started_at;

                      const endDate =
                        tenancy?.end_date ||
                        tenancy?.lease_end_date ||
                        tenancy?.ended_at;

                      return (
                        <div
                          key={
                            tenancy?.id ||
                            `tenancy-${index}`
                          }
                          className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                <Home
                                  size={20}
                                />
                              </div>

                              <div className="min-w-0">
                                <h3 className="break-words text-sm font-semibold text-slate-900">
                                  {
                                    propertyName
                                  }
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    apartmentName
                                  }
                                  {" • "}
                                  {
                                    unitName
                                  }
                                </p>
                              </div>
                            </div>

                            <span
                              className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(
                                {
                                  status:
                                    tenancyStatus,
                                }
                              )
                                }`}
                            >
                              {capitalize(
                                tenancyStatus
                              )}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="text-xs text-slate-400">
                                Rent
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {formatMoney(
                                  rent
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">
                                Deposit
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {formatMoney(
                                  getDeposit(
                                    tenancy
                                  )
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">
                                Start Date
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {formatDate(
                                  startDate
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">
                                End Date
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {formatDate(
                                  endDate
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </Section>

            {/* NOTES */}

            <Section
              title="Notes"
              description="Additional information recorded for this tenant."
              icon={FileText}
            >
              {tenantData?.notes ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {String(
                    tenantData.notes
                  )}
                </p>
              ) : (
                <p className="text-sm text-slate-400">
                  No additional notes have been added.
                </p>
              )}
            </Section>
          </div>

          {/* SIDEBAR */}

          <div className="space-y-6">

            {/* ACCOUNT STATUS */}

            <Section
              title="Account Status"
              description="Current tenant account state."
              icon={ShieldCheck}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">
                    Status
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses}`}
                  >
                    {statusIcon}
                    {statusLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">
                    Account
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold ${isActive
                      ? "text-emerald-600"
                      : "text-slate-500"
                      }`}
                  >
                    {isActive ? (
                      <>
                        <CheckCircle2
                          size={16}
                        />
                        Active
                      </>
                    ) : (
                      <>
                        <UserX
                          size={16}
                        />
                        Inactive
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">
                    Verification
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold ${isVerified
                      ? "text-emerald-600"
                      : "text-slate-500"
                      }`}
                  >
                    {isVerified ? (
                      <>
                        <CheckCircle2
                          size={16}
                        />
                        Verified
                      </>
                    ) : (
                      <>
                        <Clock3
                          size={16}
                        />
                        Unverified
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">
                    Blacklisted
                  </span>

                  <span
                    className={`text-sm font-semibold ${isBlacklisted
                      ? "text-red-600"
                      : "text-emerald-600"
                      }`}
                  >
                    {isBlacklisted
                      ? "Yes"
                      : "No"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">
                    Tenancies
                  </span>

                  <span className="text-sm font-semibold text-slate-800">
                    {tenancyCount}
                  </span>
                </div>
              </div>
            </Section>

            {/* CURRENT TENANCY */}

            <Section
              title="Current Tenancy"
              description="Current property assignment."
              icon={Home}
            >
              {activeTenancy ? (
                <div className="space-y-4">
                  <InfoItem
                    icon={Building2}
                    label="Property"
                    value={getPropertyName(
                      activeTenancy
                    )}
                  />

                  <InfoItem
                    icon={Building2}
                    label="Apartment"
                    value={getApartmentName(
                      activeTenancy
                    )}
                  />

                  <InfoItem
                    icon={Home}
                    label="Unit"
                    value={getUnitName(
                      activeTenancy
                    )}
                  />

                  <InfoItem
                    icon={FileText}
                    label="Monthly Rent"
                    value={formatMoney(
                      getRent(
                        activeTenancy
                      )
                    )}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <Home
                    size={24}
                    className="mx-auto text-slate-400"
                  />

                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    No Active Tenancy
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    This tenant currently has no active unit assignment.
                  </p>
                </div>
              )}
            </Section>

            {/* RECORD INFORMATION */}

            <Section
              title="Record Information"
              description="Tenant record timestamps."
              icon={CalendarDays}
            >
              <div className="space-y-5">
                <InfoItem
                  icon={CalendarDays}
                  label="Created"
                  value={formatDateTime(
                    createdAt
                  )}
                />

                <InfoItem
                  icon={Clock3}
                  label="Last Updated"
                  value={formatDateTime(
                    updatedAt
                  )}
                />

                {verifiedAt && (
                  <InfoItem
                    icon={BadgeCheck}
                    label="Verified At"
                    value={formatDateTime(
                      verifiedAt
                    )}
                  />
                )}
              </div>
            </Section>

            {/* QUICK ACTIONS */}

            <Section
              title="Quick Actions"
              description="Common tenant actions."
              icon={ShieldCheck}
            >
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Edit3 size={17} />
                  Edit Tenant
                </button>

                <button
                  type="button"
                  onClick={handleCopyId}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Copy size={17} />
                  Copy Tenant ID
                </button>

                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Mail size={17} />
                    Send Email
                  </a>
                )}

                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Phone size={17} />
                    Call Tenant
                  </a>
                )}
              </div>
            </Section>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p>
              Tenant ID:{" "}
              <span className="font-medium text-slate-600">
                #{tenantData?.id || "—"}
              </span>
            </p>

            {tenantNumber && (
              <p>
                Tenant Number:{" "}
                <span className="font-medium text-slate-600">
                  {tenantNumber}
                </span>
              </p>
            )}
          </div>

          <p>
            Last updated:{" "}
            <span className="font-medium text-slate-600">
              {formatDateTime(
                updatedAt
              )}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenantShow;