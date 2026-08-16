import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  Home,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  UserCheck,
  UserX,
} from "lucide-react";

import {  useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo } from "react";

import Swal from "sweetalert2";

import {
  useTenant,
} from "../../../hooks/useTenant";


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};


const formatDateTime = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


const getInitials = (tenant) => {
  const firstName =
    tenant?.first_name ||
    tenant?.firstName ||
    "";

  const lastName =
    tenant?.last_name ||
    tenant?.lastName ||
    "";

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  if (initials) {
    return initials;
  }

  const name =
    tenant?.name ||
    tenant?.full_name ||
    tenant?.fullName ||
    "";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase() || "T";
};


const getFullName = (tenant) => {
  if (!tenant) return "Tenant";

  if (tenant.full_name) {
    return tenant.full_name;
  }

  if (tenant.fullName) {
    return tenant.fullName;
  }

  if (tenant.name) {
    return tenant.name;
  }

  return [
    tenant.first_name || tenant.firstName,
    tenant.middle_name || tenant.middleName,
    tenant.last_name || tenant.lastName,
  ]
    .filter(Boolean)
    .join(" ") || "Tenant";
};


const getStatus = (tenant) => {
  if (!tenant) return "unknown";

  return (
    tenant.status ||
    tenant.account_status ||
    tenant.tenant_status ||
    "unknown"
  )
    .toString()
    .toLowerCase();
};


const getStatusLabel = (tenant) => {
  const status = getStatus(tenant);

  switch (status) {
    case "active":
      return "Active";

    case "inactive":
      return "Inactive";

    case "pending":
      return "Pending";

    case "blacklisted":
      return "Blacklisted";

    case "suspended":
      return "Suspended";

    case "verified":
      return "Verified";

    default:
      return (
        status.charAt(0).toUpperCase() +
        status.slice(1)
      );
  }
};


const getStatusClasses = (tenant) => {
  const status = getStatus(tenant);

  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "inactive":
      return "bg-slate-50 text-slate-700 ring-slate-200";

    case "pending":
      return "bg-amber-50 text-amber-700 ring-amber-200";

    case "blacklisted":
      return "bg-red-50 text-red-700 ring-red-200";

    case "suspended":
      return "bg-orange-50 text-orange-700 ring-orange-200";

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
      return <CheckCircle2 size={15} />;

    case "pending":
      return <Clock3 size={15} />;

    case "blacklisted":
      return <Ban size={15} />;

    case "inactive":
      return <UserX size={15} />;

    default:
      return <ShieldCheck size={15} />;
  }
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
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        {children || (
          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {value || "—"}
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
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
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
          {message || "The tenant could not be loaded."}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
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
  const navigate = useNavigate();

  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | TENANT HOOK
  |--------------------------------------------------------------------------
  */

  const {
    tenant,
    loadingUnit,
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
  | NORMALIZED LOADING STATE
  |--------------------------------------------------------------------------
  */

  const isLoading =
    loadingTenant ??
    loadingUnit ??
    loading ??
    false;


  /*
  |--------------------------------------------------------------------------
  | FETCH TENANT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!id) return;

    const loadTenant = async () => {
      try {
        if (typeof getTenant === "function") {
          await getTenant(id);
          return;
        }

        if (typeof fetchTenant === "function") {
          await fetchTenant(id);
        }
      } catch (err) {
        console.error(
          "Failed to load tenant:",
          err
        );
      }
    };

    loadTenant();
  }, [
    id,
    getTenant,
    fetchTenant,
  ]);


  /*
  |--------------------------------------------------------------------------
  | TENANT DATA
  |--------------------------------------------------------------------------
  */

  const tenantData = useMemo(() => {
    if (!tenant) return null;

    return (
      tenant?.data ||
      tenant?.tenant ||
      tenant
    );
  }, [tenant]);


  /*
  |--------------------------------------------------------------------------
  | TENANT DETAILS
  |--------------------------------------------------------------------------
  */

  const fullName = getFullName(
    tenantData
  );

  const initials = getInitials(
    tenantData
  );

  const statusLabel = getStatusLabel(
    tenantData
  );

  const statusClasses = getStatusClasses(
    tenantData
  );

  const statusIcon = getStatusIcon(
    tenantData
  );


  /*
  |--------------------------------------------------------------------------
  | FIELDS
  |--------------------------------------------------------------------------
  */

  const email =
    tenantData?.email ||
    tenantData?.user?.email ||
    "";

  const phone =
    tenantData?.phone ||
    tenantData?.phone_number ||
    tenantData?.user?.phone ||
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
    tenantData?.identity_number ||
    "";

  const occupation =
    tenantData?.occupation ||
    "";

  const employer =
    tenantData?.employer ||
    tenantData?.company ||
    "";

  const country =
    tenantData?.country?.name ||
    tenantData?.country ||
    "";

  const county =
    tenantData?.county?.name ||
    tenantData?.county ||
    "";

  const city =
    tenantData?.city?.name ||
    tenantData?.city ||
    "";

  const area =
    tenantData?.area?.name ||
    tenantData?.area ||
    "";

  const address =
    tenantData?.address ||
    tenantData?.street_address ||
    tenantData?.physical_address ||
    "";

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

  const isVerified =
    tenantData?.is_verified === true ||
    tenantData?.is_verified === 1 ||
    tenantData?.verified === true;


  /*
  |--------------------------------------------------------------------------
  | RELATED TENANCIES
  |--------------------------------------------------------------------------
  */

  const tenancies =
    tenantData?.tenancies ||
    tenantData?.active_tenancies ||
    tenantData?.tenancy ||
    [];


  const tenancyList = Array.isArray(
    tenancies
  )
    ? tenancies
    : tenancies
      ? [tenancies]
      : [];


  /*
  |--------------------------------------------------------------------------
  | ACTIONS
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {
    navigate(-1);
  };


  const handleEdit = () => {
    if (!id) return;

    navigate(
      `/tenants/${id}/edit`
    );
  };


  const handleCopyId = async () => {
    if (!tenantData?.id) return;

    try {
      await navigator.clipboard.writeText(
        String(tenantData.id)
      );

      Swal.fire({
        icon: "success",
        title: "Copied",
        text: "Tenant ID copied to clipboard.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(
        "Failed to copy tenant ID:",
        error
      );
    }
  };


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (isLoading && !tenantData) {
    return <TenantShowSkeleton />;
  }


  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error && !tenantData) {
    return (
      <TenantError
        message={
          typeof error === "string"
            ? error
            : error?.message
        }
        onRetry={() => {
          if (typeof getTenant === "function") {
            getTenant(id);
          } else if (
            typeof fetchTenant === "function"
          ) {
            fetchTenant(id);
          }
        }}
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
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
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

        {/* --------------------------------------------------------------- */}
        {/* HEADER                                                          */}
        {/* --------------------------------------------------------------- */}

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
                View tenant profile and tenancy information.
              </p>
            </div>
          </div>


          <button
            type="button"
            onClick={handleEdit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Edit3 size={17} />
            Edit Tenant
          </button>

        </div>


        {/* --------------------------------------------------------------- */}
        {/* PROFILE CARD                                                     */}
        {/* --------------------------------------------------------------- */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="h-28 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700" />

          <div className="px-5 pb-6 sm:px-6">

            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">

                {/* Avatar */}
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 text-2xl font-bold text-slate-700 shadow-md">
                  {tenantData?.avatar ||
                  tenantData?.profile_photo ||
                  tenantData?.profile_image ? (
                    <img
                      src={
                        tenantData.avatar ||
                        tenantData.profile_photo ||
                        tenantData.profile_image
                      }
                      alt={fullName}
                      className="h-full w-full rounded-xl object-cover"
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

                    {tenantData?.id && (
                      <button
                        type="button"
                        onClick={handleCopyId}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                        title="Copy tenant ID"
                      >
                        ID #{tenantData.id}
                      </button>
                    )}

                  </div>

                </div>

              </div>

            </div>


            {/* Contact summary */}
            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">

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
                icon={CalendarDays}
                label="Member Since"
                value={formatDate(createdAt)}
              />

            </div>

          </div>
        </section>


        {/* --------------------------------------------------------------- */}
        {/* MAIN CONTENT                                                     */}
        {/* --------------------------------------------------------------- */}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* ------------------------------------------------------------- */}
          {/* PERSONAL INFORMATION                                           */}
          {/* ------------------------------------------------------------- */}

          <div className="space-y-6 lg:col-span-2">

            <Section
              title="Personal Information"
              description="Basic identity and personal details."
              icon={User}
            >

              <div className="grid gap-6 sm:grid-cols-2">

                <InfoItem
                  icon={User}
                  label="First Name"
                  value={
                    tenantData?.first_name ||
                    tenantData?.firstName
                  }
                />

                <InfoItem
                  icon={User}
                  label="Last Name"
                  value={
                    tenantData?.last_name ||
                    tenantData?.lastName
                  }
                />

                <InfoItem
                  icon={User}
                  label="Gender"
                  value={gender}
                />

                <InfoItem
                  icon={CalendarDays}
                  label="Date of Birth"
                  value={formatDate(dateOfBirth)}
                />

                <InfoItem
                  icon={FileText}
                  label="National ID"
                  value={nationalId}
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

              </div>

            </Section>


            {/* ----------------------------------------------------------- */}
            {/* CONTACT INFORMATION                                           */}
            {/* ----------------------------------------------------------- */}

            <Section
              title="Contact Information"
              description="Tenant contact and location details."
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
                    label="Address"
                    value={address}
                  />
                </div>

              </div>

            </Section>


            {/* ----------------------------------------------------------- */}
            {/* TENANCIES                                                     */}
            {/* ----------------------------------------------------------- */}

            <Section
              title="Tenancy Information"
              description="Properties and units associated with this tenant."
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

                  {tenancyList.map((tenancy, index) => {

                    const property =
                      tenancy?.property;

                    const apartment =
                      tenancy?.apartment;

                    const unit =
                      tenancy?.unit;

                    const tenancyStatus =
                      tenancy?.status ||
                      tenancy?.tenancy_status ||
                      "Unknown";

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
                              <Home size={20} />
                            </div>

                            <div>

                              <h3 className="text-sm font-semibold text-slate-900">
                                {property?.name ||
                                  property?.title ||
                                  tenancy?.property_name ||
                                  "Property"}
                              </h3>

                              <p className="mt-1 text-xs text-slate-500">
                                {apartment?.name ||
                                  apartment?.title ||
                                  tenancy?.apartment_name ||
                                  "Apartment"}
                                {" • "}
                                {unit?.unit_number ||
                                  unit?.unit_name ||
                                  tenancy?.unit_number ||
                                  "Unit"}
                              </p>

                            </div>

                          </div>


                          <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {tenancyStatus}
                          </span>

                        </div>


                        <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">

                          <div>
                            <p className="text-xs text-slate-400">
                              Rent
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-800">
                              {tenancy?.rent_amount ??
                                tenancy?.rent ??
                                "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Start Date
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-800">
                              {formatDate(
                                tenancy?.start_date ||
                                tenancy?.started_at
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              End Date
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-800">
                              {formatDate(
                                tenancy?.end_date ||
                                tenancy?.ended_at
                              )}
                            </p>
                          </div>

                        </div>

                      </div>
                    );
                  })}

                </div>

              )}

            </Section>

          </div>


          {/* ------------------------------------------------------------- */}
          {/* SIDEBAR                                                        */}
          {/* ------------------------------------------------------------- */}

          <div className="space-y-6">

            {/* Account status */}
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
                    Verification
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                      isVerified
                        ? "text-emerald-600"
                        : "text-slate-500"
                    }`}
                  >
                    {isVerified ? (
                      <>
                        <CheckCircle2 size={16} />
                        Verified
                      </>
                    ) : (
                      <>
                        <Clock3 size={16} />
                        Pending
                      </>
                    )}
                  </span>

                </div>


                {tenantData?.is_active !== undefined && (
                  <div className="flex items-center justify-between gap-4">

                    <span className="text-sm text-slate-500">
                      Active
                    </span>

                    <span
                      className={`text-sm font-semibold ${
                        tenantData.is_active
                          ? "text-emerald-600"
                          : "text-slate-500"
                      }`}
                    >
                      {tenantData.is_active
                        ? "Yes"
                        : "No"}
                    </span>

                  </div>
                )}

              </div>

            </Section>


            {/* Dates */}
            <Section
              title="Record Information"
              description="Tenant record timestamps."
              icon={CalendarDays}
            >

              <div className="space-y-5">

                <InfoItem
                  icon={CalendarDays}
                  label="Created"
                  value={formatDateTime(createdAt)}
                />

                <InfoItem
                  icon={Clock3}
                  label="Last Updated"
                  value={formatDateTime(updatedAt)}
                />

                {verifiedAt && (
                  <InfoItem
                    icon={BadgeCheck}
                    label="Verified At"
                    value={formatDateTime(verifiedAt)}
                  />
                )}

              </div>

            </Section>


            {/* Quick actions */}
            <Section
              title="Quick Actions"
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


        {/* --------------------------------------------------------------- */}
        {/* FOOTER                                                          */}
        {/* --------------------------------------------------------------- */}

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">

          <p>
            Tenant ID:{" "}
            <span className="font-medium text-slate-600">
              #{tenantData?.id || "—"}
            </span>
          </p>

          <p>
            Last updated:{" "}
            <span className="font-medium text-slate-600">
              {formatDateTime(updatedAt)}
            </span>
          </p>

        </div>

      </div>

    </div>
  );
};

export default TenantShow;