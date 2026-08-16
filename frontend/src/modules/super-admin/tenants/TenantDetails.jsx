import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  Globe2,
  Home,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  UserCheck,
  UserRoundX,
  XCircle,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Swal from "sweetalert2";

import {
  useCallback,
  useEffect,
  useMemo,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

/*
|--------------------------------------------------------------------------
| REDUX
|--------------------------------------------------------------------------
|
| IMPORTANT:
| pendingTenant was removed because tenantSlice.js does not export it.
|
*/

import {
  activateTenant,
  blacklistTenant,
  clearTenant,
  clearTenantError,
  deactivateTenant,
  fetchTenant,
  unverifyTenant,
  verifyTenant,
} from "../../../store/tenantSlice";

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

const TenantDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | REDUX STATE
  |--------------------------------------------------------------------------
  */

  const {
    tenant,
    loading,
    error,
    activating,
    deactivating,
    blacklisting,
    verifying,
    unverifying,
  } = useSelector(
    (state) => state.tenants || {}
  );

  /*
  |--------------------------------------------------------------------------
  | LOAD TENANT
  |--------------------------------------------------------------------------
  */

  const loadTenant = useCallback(() => {
    if (!id) {
      return;
    }

    dispatch(clearTenantError());
    dispatch(fetchTenant(id));
  }, [dispatch, id]);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadTenant();

    return () => {
      dispatch(clearTenant());
      dispatch(clearTenantError());
    };
  }, [dispatch, loadTenant]);

  /*
  |--------------------------------------------------------------------------
  | NORMALIZED VALUES
  |--------------------------------------------------------------------------
  */

  const fullName = useMemo(() => {
    if (tenant?.full_name) {
      return tenant.full_name;
    }

    return [
      tenant?.first_name,
      tenant?.last_name,
    ]
      .filter(Boolean)
      .join(" ") || "Tenant";
  }, [tenant]);

  const initials = useMemo(() => {
    const first = String(
      tenant?.first_name || ""
    ).charAt(0);

    const last = String(
      tenant?.last_name || ""
    ).charAt(0);

    const result = `${first}${last}`.trim();

    return (
      result || "T"
    ).toUpperCase();
  }, [tenant]);

  const status = String(
    tenant?.status || "pending"
  ).toLowerCase();

  const isActive = Boolean(
    tenant?.is_active
  );

  const isVerified = Boolean(
    tenant?.is_verified
  );

  /*
  |--------------------------------------------------------------------------
  | STATUS LABEL
  |--------------------------------------------------------------------------
  */

  const statusLabel = status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );

  /*
  |--------------------------------------------------------------------------
  | DATE FORMATTER
  |--------------------------------------------------------------------------
  */

  const formatDate = (
    value,
    fallback = "Not provided"
  ) => {
    if (!value) {
      return fallback;
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return fallback;
    }

    return new Intl.DateTimeFormat(
      "en-KE",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(date);
  };

  /*
  |--------------------------------------------------------------------------
  | DATE + TIME FORMATTER
  |--------------------------------------------------------------------------
  */

  const formatDateTime = (
    value,
    fallback = "Not available"
  ) => {
    if (!value) {
      return fallback;
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return fallback;
    }

    return new Intl.DateTimeFormat(
      "en-KE",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(date);
  };

  /*
  |--------------------------------------------------------------------------
  | SAFE VALUE
  |--------------------------------------------------------------------------
  */

  const valueOrFallback = (
    value,
    fallback = "Not provided"
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return fallback;
    }

    return value;
  };

  /*
  |--------------------------------------------------------------------------
  | LOCATION
  |--------------------------------------------------------------------------
  */

  const location = useMemo(() => {
    const parts = [
      tenant?.area?.name ||
      tenant?.area_name ||
      (
        typeof tenant?.area ===
          "string"
          ? tenant.area
          : null
      ),

      tenant?.city?.name ||
      tenant?.city_name ||
      (
        typeof tenant?.city ===
          "string"
          ? tenant.city
          : null
      ),

      tenant?.county?.name ||
      tenant?.county_name ||
      (
        typeof tenant?.county ===
          "string"
          ? tenant.county
          : null
      ),

      tenant?.region?.name ||
      tenant?.region_name ||
      (
        typeof tenant?.region ===
          "string"
          ? tenant.region
          : null
      ),

      tenant?.country?.name ||
      tenant?.country_name ||
      (
        typeof tenant?.country ===
          "string"
          ? tenant.country
          : null
      ),
    ].filter(Boolean);

    return (
      parts.join(", ") ||
      "Location not provided"
    );
  }, [tenant]);

  /*
  |--------------------------------------------------------------------------
  | TENANCIES
  |--------------------------------------------------------------------------
  */

  const tenancies = useMemo(() => {
    if (
      Array.isArray(
        tenant?.tenancies
      )
    ) {
      return tenant.tenancies;
    }

    if (
      Array.isArray(
        tenant?.active_tenancies
      )
    ) {
      return tenant.active_tenancies;
    }

    if (
      Array.isArray(
        tenant?.tenancy_history
      )
    ) {
      return tenant.tenancy_history;
    }

    return [];
  }, [tenant]);

  /*
  |--------------------------------------------------------------------------
  | ACTIVE TENANCY
  |--------------------------------------------------------------------------
  */

  const activeTenancy = useMemo(() => {
    if (tenant?.active_tenancy) {
      return tenant.active_tenancy;
    }

    return tenancies.find(
      (item) =>
        item?.is_active === true ||
        item?.status === "active" ||
        item?.status === "ongoing"
    );
  }, [tenant, tenancies]);

  /*
  |--------------------------------------------------------------------------
  | TENANCY COUNT
  |--------------------------------------------------------------------------
  */

  const tenancyCount =
    tenant?.tenancies_count ??
    tenant?.tenancy_count ??
    tenancies.length ??
    0;

  /*
  |--------------------------------------------------------------------------
  | ACTION LOADING
  |--------------------------------------------------------------------------
  */

  const actionLoading =
    activating ||
    deactivating ||
    blacklisting ||
    verifying ||
    unverifying;

  /*
  |--------------------------------------------------------------------------
  | GENERIC ACTION HANDLER
  |--------------------------------------------------------------------------
  */

  const runTenantAction = async ({
    action,
    title,
    successMessage,
    confirmText,
    confirmButtonColor,
  }) => {
    if (!tenant?.id) {
      return;
    }

    const result =
      await Swal.fire({
        icon: "warning",
        title,
        text: "Are you sure you want to continue?",
        showCancelButton: true,
        confirmButtonText:
          confirmText || "Continue",
        cancelButtonText: "Cancel",
        confirmButtonColor:
          confirmButtonColor ||
          "#2563eb",
        reverseButtons: true,
      });

    if (!result.isConfirmed) {
      return;
    }

    try {
      dispatch(clearTenantError());

      const response = await dispatch(
        action(tenant.id)
      );

      if (
        response?.meta
          ?.requestStatus ===
        "fulfilled"
      ) {
        await Swal.fire({
          icon: "success",
          title: "Success",
          text:
            response?.payload
              ?.message ||
            successMessage,
          confirmButtonColor:
            "#2563eb",
        });

        loadTenant();

        return;
      }

      throw new Error(
        response?.payload?.message ||
        response?.payload?.error ||
        response?.error?.message ||
        "The tenant action failed."
      );
    } catch (actionError) {
      await Swal.fire({
        icon: "error",
        title: "Action Failed",
        text:
          actionError?.message ||
          "Unable to complete this action.",
        confirmButtonColor:
          "#dc2626",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE
  |--------------------------------------------------------------------------
  */

  const handleActivate = () => {
    return runTenantAction({
      action: activateTenant,
      title: "Activate Tenant?",
      successMessage:
        "Tenant activated successfully.",
      confirmText: "Activate Tenant",
      confirmButtonColor: "#16a34a",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE
  |--------------------------------------------------------------------------
  */

  const handleDeactivate = () => {
    return runTenantAction({
      action: deactivateTenant,
      title: "Deactivate Tenant?",
      successMessage:
        "Tenant deactivated successfully.",
      confirmText: "Deactivate",
      confirmButtonColor: "#d97706",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | BLACKLIST
  |--------------------------------------------------------------------------
  */

  const handleBlacklist = () => {
    return runTenantAction({
      action: blacklistTenant,
      title: "Blacklist Tenant?",
      successMessage:
        "Tenant blacklisted successfully.",
      confirmText: "Blacklist Tenant",
      confirmButtonColor: "#dc2626",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | VERIFY
  |--------------------------------------------------------------------------
  */

  const handleVerify = () => {
    return runTenantAction({
      action: verifyTenant,
      title: "Verify Tenant?",
      successMessage:
        "Tenant verified successfully.",
      confirmText: "Verify Tenant",
      confirmButtonColor: "#2563eb",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | UNVERIFY
  |--------------------------------------------------------------------------
  */

  const handleUnverify = () => {
    return runTenantAction({
      action: unverifyTenant,
      title: "Remove Verification?",
      successMessage:
        "Tenant verification removed successfully.",
      confirmText:
        "Remove Verification",
      confirmButtonColor: "#d97706",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | RETRY
  |--------------------------------------------------------------------------
  */

  const handleRetry = () => {
    loadTenant();
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const handleEdit = () => {
    if (!tenant?.id) {
      return;
    }

    navigate(
      `/tenants/${tenant.id}/edit`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (!loading && !tenant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Tenant Details"
          subtitle="Tenant information"
          onBack={() =>
            navigate("/tenants")
          }
        />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <UserRoundX className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Tenant Not Found
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
              {typeof error ===
                "string"
                ? error
                : error?.message ||
                error?.error ||
                "The requested tenant could not be found."}
            </p>

            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleRetry}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-gray-700
                  hover:bg-gray-50
                "
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/tenants")
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  bg-primary-600
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-primary-700
                "
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Tenants
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOADING
  |--------------------------------------------------------------------------
  */

  if (loading && !tenant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Tenant Details"
          subtitle="Loading tenant information..."
          onBack={() =>
            navigate("/tenants")
          }
        />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <TenantDetailsSkeleton />
        </main>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PAGE HEADER */}

      <PageHeader
        title="Tenant Details"
        subtitle="View tenant profile, account status and tenancy information."
        onBack={() =>
          navigate("/tenants")
        }
      >
        <button
          type="button"
          onClick={handleEdit}
          disabled={actionLoading}
          className="
            inline-flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-lg
            bg-primary-600
            px-4
            py-2.5
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-primary-700
            disabled:cursor-not-allowed
            disabled:opacity-50
            sm:w-auto
          "
        >
          <Edit3 className="h-4 w-4" />
          Edit Tenant
        </button>
      </PageHeader>

      {/* MAIN */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Unable to refresh tenant information
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {typeof error ===
                    "string"
                    ? error
                    : error?.message ||
                    error?.error ||
                    "An unexpected error occurred."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRetry}
                className="
                  inline-flex
                  shrink-0
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  border
                  border-red-200
                  bg-white
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-red-700
                  hover:bg-red-50
                "
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* PROFILE HEADER */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-primary-50 via-white to-white px-5 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-lg font-bold text-primary-700">
                  {initials}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      {fullName}
                    </h2>

                    {isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    Tenant ID:{" "}
                    <span className="font-medium text-gray-700">
                      #{tenant?.id}
                    </span>
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={status}
                      label={statusLabel}
                    />

                    <ActivityBadge
                      active={isActive}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:min-w-[420px]">
                <ContactCard
                  icon={
                    <Mail className="h-4 w-4" />
                  }
                  label="Email"
                  value={valueOrFallback(
                    tenant?.email
                  )}
                />

                <ContactCard
                  icon={
                    <Phone className="h-4 w-4" />
                  }
                  label="Phone"
                  value={valueOrFallback(
                    tenant?.phone
                  )}
                />
              </div>
            </div>
          </div>

          {/* ACTION BAR */}

          <div className="border-t border-gray-200 bg-gray-50 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {!isActive && (
                <ActionButton
                  icon={
                    <UserCheck className="h-4 w-4" />
                  }
                  label="Activate"
                  onClick={
                    handleActivate
                  }
                  loading={activating}
                  disabled={
                    actionLoading
                  }
                  variant="success"
                />
              )}

              {isActive && (
                <ActionButton
                  icon={
                    <UserRoundX className="h-4 w-4" />
                  }
                  label="Deactivate"
                  onClick={
                    handleDeactivate
                  }
                  loading={deactivating}
                  disabled={
                    actionLoading
                  }
                  variant="warning"
                />
              )}

              {!isVerified && (
                <ActionButton
                  icon={
                    <ShieldCheck className="h-4 w-4" />
                  }
                  label="Verify"
                  onClick={handleVerify}
                  loading={verifying}
                  disabled={
                    actionLoading
                  }
                  variant="primary"
                />
              )}

              {isVerified && (
                <ActionButton
                  icon={
                    <XCircle className="h-4 w-4" />
                  }
                  label="Unverify"
                  onClick={
                    handleUnverify
                  }
                  loading={unverifying}
                  disabled={
                    actionLoading
                  }
                  variant="warning"
                />
              )}

              {status !==
                "blacklisted" && (
                  <ActionButton
                    icon={
                      <UserRoundX className="h-4 w-4" />
                    }
                    label="Blacklist"
                    onClick={
                      handleBlacklist
                    }
                    loading={
                      blacklisting
                    }
                    disabled={
                      actionLoading
                    }
                    variant="danger"
                  />
                )}

              <button
                type="button"
                onClick={handleRetry}
                disabled={
                  loading ||
                  actionLoading
                }
                className="
                  ml-auto
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-gray-700
                  transition
                  hover:bg-gray-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading
                    ? "animate-spin"
                    : ""
                    }`}
                />

                Refresh
              </button>
            </div>
          </div>
        </section>

        {/* STATISTICS */}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStatCard
            icon={
              <Building2 className="h-5 w-5" />
            }
            label="Tenancies"
            value={tenancyCount}
            description="Total tenancy records"
          />

          <MiniStatCard
            icon={
              <Home className="h-5 w-5" />
            }
            label="Current Unit"
            value={
              activeTenancy
                ? getUnitName(
                  activeTenancy
                )
                : "None"
            }
            description="Current active unit"
          />

          <MiniStatCard
            icon={
              <UserCheck className="h-5 w-5" />
            }
            label="Account"
            value={
              isActive
                ? "Active"
                : "Inactive"
            }
            description="Current account status"
          />

          <MiniStatCard
            icon={
              <ShieldCheck className="h-5 w-5" />
            }
            label="Verification"
            value={
              isVerified
                ? "Verified"
                : "Unverified"
            }
            description="Tenant verification status"
          />
        </div>

        {/* DETAILS GRID */}

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
          {/* PERSONAL INFORMATION */}

          <InfoSection
            className="xl:col-span-2"
            icon={
              <User className="h-5 w-5" />
            }
            title="Personal Information"
            description="Tenant identification and personal details."
          >
            <InfoGrid>
              <InfoItem
                label="First Name"
                value={valueOrFallback(
                  tenant?.first_name
                )}
              />

              <InfoItem
                label="Last Name"
                value={valueOrFallback(
                  tenant?.last_name
                )}
              />

              <InfoItem
                label="Email"
                value={valueOrFallback(
                  tenant?.email
                )}
                icon={
                  <Mail className="h-4 w-4" />
                }
              />

              <InfoItem
                label="Phone"
                value={valueOrFallback(
                  tenant?.phone
                )}
                icon={
                  <Phone className="h-4 w-4" />
                }
              />

              <InfoItem
                label="National ID"
                value={valueOrFallback(
                  tenant?.id_number ||
                  tenant?.national_id ||
                  tenant?.national_id_number
                )}
              />

              <InfoItem
                label="Passport Number"
                value={valueOrFallback(
                  tenant?.passport_number
                )}
              />

              <InfoItem
                label="Gender"
                value={capitalize(
                  valueOrFallback(
                    tenant?.gender
                  )
                )}
              />

              <InfoItem
                label="Date of Birth"
                value={formatDate(
                  tenant?.date_of_birth
                )}
                icon={
                  <CalendarDays className="h-4 w-4" />
                }
              />

              <InfoItem
                label="Nationality"
                value={valueOrFallback(
                  tenant?.nationality
                )}
                icon={
                  <Globe2 className="h-4 w-4" />
                }
              />
            </InfoGrid>
          </InfoSection>

          {/* ACCOUNT */}

          <InfoSection
            icon={
              <ShieldCheck className="h-5 w-5" />
            }
            title="Account"
            description="Tenant account and verification status."
          >
            <div className="space-y-4">
              <StatusRow
                label="Status"
                value={
                  <StatusBadge
                    status={status}
                    label={statusLabel}
                  />
                }
              />

              <StatusRow
                label="Account"
                value={
                  <ActivityBadge
                    active={isActive}
                  />
                }
              />

              <StatusRow
                label="Verification"
                value={
                  isVerified ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500">
                      <XCircle className="h-4 w-4" />
                      Unverified
                    </span>
                  )
                }
              />

              <StatusRow
                label="Created"
                value={formatDateTime(
                  tenant?.created_at
                )}
              />

              <StatusRow
                label="Last Updated"
                value={formatDateTime(
                  tenant?.updated_at
                )}
              />

              {tenant?.verified_at && (
                <StatusRow
                  label="Verified At"
                  value={formatDateTime(
                    tenant.verified_at
                  )}
                />
              )}
            </div>
          </InfoSection>
        </div>

        {/* LOCATION */}

        <div className="mt-5">
          <InfoSection
            icon={
              <MapPin className="h-5 w-5" />
            }
            title="Address & Location"
            description="Tenant residential and location information."
          >
            <InfoGrid columns="lg:grid-cols-3">
              <InfoItem
                label="Country"
                value={valueOrFallback(
                  tenant?.country?.name ||
                  tenant?.country_name ||
                  (
                    typeof tenant?.country ===
                      "string"
                      ? tenant.country
                      : null
                  )
                )}
              />

              <InfoItem
                label="Region"
                value={valueOrFallback(
                  tenant?.region?.name ||
                  tenant?.region_name ||
                  (
                    typeof tenant?.region ===
                      "string"
                      ? tenant.region
                      : null
                  )
                )}
              />

              <InfoItem
                label="County"
                value={valueOrFallback(
                  tenant?.county?.name ||
                  tenant?.county_name ||
                  (
                    typeof tenant?.county ===
                      "string"
                      ? tenant.county
                      : null
                  )
                )}
              />

              <InfoItem
                label="City"
                value={valueOrFallback(
                  tenant?.city?.name ||
                  tenant?.city_name ||
                  (
                    typeof tenant?.city ===
                      "string"
                      ? tenant.city
                      : null
                  )
                )}
              />

              <InfoItem
                label="Area"
                value={valueOrFallback(
                  tenant?.area?.name ||
                  tenant?.area_name ||
                  (
                    typeof tenant?.area ===
                      "string"
                      ? tenant.area
                      : null
                  )
                )}
              />

              <InfoItem
                label="Full Location"
                value={location}
                icon={
                  <MapPin className="h-4 w-4" />
                }
              />

              <div className="lg:col-span-3">
                <InfoItem
                  label="Residential Address"
                  value={valueOrFallback(
                    tenant?.address ||
                    tenant?.street_address
                  )}
                />
              </div>
            </InfoGrid>
          </InfoSection>
        </div>

        {/* EMPLOYMENT + EMERGENCY */}

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <InfoSection
            icon={
              <FileText className="h-5 w-5" />
            }
            title="Employment Information"
            description="Tenant occupation and employment details."
          >
            <InfoGrid>
              <InfoItem
                label="Occupation"
                value={valueOrFallback(
                  tenant?.occupation
                )}
              />

              <InfoItem
                label="Employer"
                value={valueOrFallback(
                  tenant?.employer ||
                  tenant?.company
                )}
              />
            </InfoGrid>
          </InfoSection>

          <InfoSection
            icon={
              <Phone className="h-5 w-5" />
            }
            title="Emergency Contact"
            description="Person to contact in case of an emergency."
          >
            <InfoGrid>
              <InfoItem
                label="Name"
                value={valueOrFallback(
                  tenant?.emergency_contact_name
                )}
              />

              <InfoItem
                label="Phone"
                value={valueOrFallback(
                  tenant?.emergency_contact_phone
                )}
              />

              <InfoItem
                label="Relationship"
                value={valueOrFallback(
                  tenant?.emergency_contact_relationship
                )}
              />
            </InfoGrid>
          </InfoSection>
        </div>

        {/* ACTIVE TENANCY */}

        <div className="mt-5">
          <InfoSection
            icon={
              <Building2 className="h-5 w-5" />
            }
            title="Current Tenancy"
            description="Current property, apartment and unit assignment."
          >
            {activeTenancy ? (
              <TenancyCard
                tenancy={activeTenancy}
                formatDate={formatDate}
              />
            ) : (
              <EmptyTenancy />
            )}
          </InfoSection>
        </div>

        {/* TENANCY HISTORY */}

        {tenancies.length > 0 && (
          <div className="mt-5">
            <InfoSection
              icon={
                <Clock3 className="h-5 w-5" />
              }
              title="Tenancy History"
              description={`${tenancyCount} tenancy record${tenancyCount === 1
                ? ""
                : "s"
                } associated with this tenant.`}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Property
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Unit
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Start
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        End
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {tenancies.map(
                      (
                        tenancy,
                        index
                      ) => (
                        <tr
                          key={
                            tenancy?.id ||
                            index
                          }
                          className="hover:bg-gray-50"
                        >
                          <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                            {getPropertyName(
                              tenancy
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                            {getUnitName(
                              tenancy
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                            {formatDate(
                              tenancy?.start_date ||
                              tenancy?.lease_start_date
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                            {formatDate(
                              tenancy?.end_date ||
                              tenancy?.lease_end_date
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <StatusBadge
                              status={String(
                                tenancy?.status ||
                                "unknown"
                              ).toLowerCase()}
                              label={capitalize(
                                String(
                                  tenancy?.status ||
                                  "Unknown"
                                ).replace(
                                  /_/g,
                                  " "
                                )
                              )}
                            />
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </InfoSection>
          </div>
        )}

        {/* NOTES */}

        <div className="mt-5">
          <InfoSection
            icon={
              <FileText className="h-5 w-5" />
            }
            title="Notes"
            description="Additional information recorded for this tenant."
          >
            {tenant?.notes ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {tenant.notes}
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                No additional notes have been
                added.
              </p>
            )}
          </InfoSection>
        </div>

        {/* FOOTER ACTIONS */}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() =>
              navigate("/tenants")
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-gray-300
              bg-white
              px-4
              py-2.5
              text-sm
              font-medium
              text-gray-700
              shadow-sm
              transition
              hover:bg-gray-50
            "
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tenants
          </button>

          <button
            type="button"
            onClick={handleEdit}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-primary-600
              px-5
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-primary-700
            "
          >
            <Edit3 className="h-4 w-4" />
            Edit Tenant
          </button>
        </div>
      </main>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| PAGE HEADER
|--------------------------------------------------------------------------
*/

const PageHeader = ({
  title,
  subtitle,
  onBack,
  children,
}) => {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-lg
                border
                border-gray-200
                bg-white
                text-gray-600
                transition
                hover:bg-gray-50
                hover:text-gray-900
              "
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                {title}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {subtitle}
              </p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </header>
  );
};

/*
|--------------------------------------------------------------------------
| INFO SECTION
|--------------------------------------------------------------------------
*/

const InfoSection = ({
  icon,
  title,
  description,
  children,
  className = "",
}) => {
  return (
    <section
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {title}
          </h3>

          <p className="mt-0.5 text-xs leading-5 text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
};

/*
|--------------------------------------------------------------------------
| INFO GRID
|--------------------------------------------------------------------------
*/

const InfoGrid = ({
  children,
  columns = "sm:grid-cols-2",
}) => {
  return (
    <div
      className={`grid grid-cols-1 gap-x-6 gap-y-5 ${columns}`}
    >
      {children}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| INFO ITEM
|--------------------------------------------------------------------------
*/

const InfoItem = ({
  label,
  value,
  icon,
}) => {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <div className="mt-1.5 flex items-center gap-2">
        {icon && (
          <span className="shrink-0 text-gray-400">
            {icon}
          </span>
        )}

        <p className="break-words text-sm font-medium text-gray-800">
          {value}
        </p>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| STATUS ROW
|--------------------------------------------------------------------------
*/

const StatusRow = ({
  label,
  value,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-gray-500">
        {label}
      </span>

      <div className="text-right">
        {value}
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

const StatusBadge = ({
  status,
  label,
}) => {
  const normalized = String(
    status || ""
  ).toLowerCase();

  let classes =
    "bg-gray-100 text-gray-700";

  if (
    normalized === "active" ||
    normalized === "approved"
  ) {
    classes =
      "bg-green-50 text-green-700";
  } else if (
    normalized === "pending" ||
    normalized === "pending_approval"
  ) {
    classes =
      "bg-yellow-50 text-yellow-700";
  } else if (
    normalized === "inactive"
  ) {
    classes =
      "bg-gray-100 text-gray-600";
  } else if (
    normalized === "blacklisted" ||
    normalized === "blacklist"
  ) {
    classes =
      "bg-red-50 text-red-700";
  } else if (
    normalized === "terminated"
  ) {
    classes =
      "bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| ACTIVITY BADGE
|--------------------------------------------------------------------------
*/

const ActivityBadge = ({
  active,
}) => {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
      Inactive
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| CONTACT CARD
|--------------------------------------------------------------------------
*/

const ContactCard = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white/80 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-primary-600">
          {icon}
        </span>

        <span className="text-xs font-medium text-gray-400">
          {label}
        </span>
      </div>

      <p className="mt-1 truncate text-sm font-medium text-gray-800">
        {value}
      </p>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| MINI STAT CARD
|--------------------------------------------------------------------------
*/

const MiniStatCard = ({
  icon,
  label,
  value,
  description,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {label}
          </p>

          <p className="mt-2 break-words text-lg font-bold text-gray-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          {icon}
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| ACTION BUTTON
|--------------------------------------------------------------------------
*/

const ActionButton = ({
  icon,
  label,
  onClick,
  loading = false,
  disabled = false,
  variant = "neutral",
}) => {
  const variants = {
    primary:
      "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",

    success:
      "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",

    warning:
      "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100",

    danger:
      "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",

    neutral:
      "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={
        disabled || loading
      }
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-lg
        border
        px-3
        py-2
        text-sm
        font-medium
        transition
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variants[variant] ||
        variants.neutral
        }
      `}
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        icon
      )}

      {loading
        ? "Processing..."
        : label}
    </button>
  );
};

/*
|--------------------------------------------------------------------------
| TENANCY CARD
|--------------------------------------------------------------------------
*/

const TenancyCard = ({
  tenancy,
  formatDate,
}) => {
  const propertyName =
    getPropertyName(tenancy);

  const apartmentName =
    getApartmentName(tenancy);

  const unitName =
    getUnitName(tenancy);

  const rent =
    tenancy?.rent_amount ??
    tenancy?.monthly_rent ??
    tenancy?.rent ??
    tenancy?.pricing
      ?.rent_amount;

  const deposit =
    tenancy?.deposit_amount ??
    tenancy?.deposit ??
    tenancy?.security_deposit;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <TenancyValue
          label="Property"
          value={propertyName}
          icon={
            <Building2 className="h-4 w-4" />
          }
        />

        <TenancyValue
          label="Apartment"
          value={apartmentName}
          icon={
            <Building2 className="h-4 w-4" />
          }
        />

        <TenancyValue
          label="Unit"
          value={unitName}
          icon={
            <Home className="h-4 w-4" />
          }
        />

        <TenancyValue
          label="Status"
          value={capitalize(
            String(
              tenancy?.status ||
              "Active"
            ).replace(
              /_/g,
              " "
            )
          )}
          icon={
            <CheckCircle2 className="h-4 w-4" />
          }
        />

        <TenancyValue
          label="Start Date"
          value={formatDate(
            tenancy?.start_date ||
            tenancy?.lease_start_date
          )}
          icon={
            <CalendarDays className="h-4 w-4" />
          }
        />

        <TenancyValue
          label="End Date"
          value={formatDate(
            tenancy?.end_date ||
            tenancy?.lease_end_date
          )}
          icon={
            <CalendarDays className="h-4 w-4" />
          }
        />

        <TenancyValue
          label="Monthly Rent"
          value={
            rent !== undefined &&
              rent !== null
              ? formatMoney(rent)
              : "Not provided"
          }
        />

        <TenancyValue
          label="Deposit"
          value={
            deposit !== undefined &&
              deposit !== null
              ? formatMoney(deposit)
              : "Not provided"
          }
        />
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| TENANCY VALUE
|--------------------------------------------------------------------------
*/

const TenancyValue = ({
  label,
  value,
  icon,
}) => {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <div className="mt-1.5 flex items-center gap-2">
        {icon && (
          <span className="text-gray-400">
            {icon}
          </span>
        )}

        <p className="break-words text-sm font-semibold text-gray-800">
          {value}
        </p>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| EMPTY TENANCY
|--------------------------------------------------------------------------
*/

const EmptyTenancy = () => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Home className="h-6 w-6" />
      </div>

      <h4 className="mt-3 text-sm font-semibold text-gray-800">
        No Active Tenancy
      </h4>

      <p className="mt-1 max-w-md text-sm text-gray-500">
        This tenant currently has no active
        property or unit assignment.
      </p>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| TENANT DETAILS SKELETON
|--------------------------------------------------------------------------
*/

const TenantDetailsSkeleton = () => {
  return (
    <div className="space-y-5">
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gray-200" />

          <div className="space-y-2">
            <div className="h-5 w-48 rounded bg-gray-200" />

            <div className="h-4 w-32 rounded bg-gray-200" />

            <div className="h-5 w-20 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="h-5 w-40 rounded bg-gray-200" />

              <div className="mt-6 grid grid-cols-2 gap-5">
                {[1, 2, 3, 4].map(
                  (field) => (
                    <div
                      key={field}
                      className="space-y-2"
                    >
                      <div className="h-3 w-20 rounded bg-gray-200" />

                      <div className="h-4 w-32 rounded bg-gray-200" />
                    </div>
                  )
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| GET PROPERTY NAME
|--------------------------------------------------------------------------
*/

const getPropertyName = (
  tenancy
) => {
  return (
    tenancy?.property?.title ||
    tenancy?.property?.name ||
    tenancy?.property_title ||
    tenancy?.property_name ||
    tenancy?.unit?.property
      ?.title ||
    tenancy?.unit?.property
      ?.name ||
    "Not assigned"
  );
};

/*
|--------------------------------------------------------------------------
| GET APARTMENT NAME
|--------------------------------------------------------------------------
*/

const getApartmentName = (
  tenancy
) => {
  return (
    tenancy?.apartment?.name ||
    tenancy?.apartment_name ||
    tenancy?.unit?.apartment
      ?.name ||
    "Not assigned"
  );
};

/*
|--------------------------------------------------------------------------
| GET UNIT NAME
|--------------------------------------------------------------------------
*/

const getUnitName = (
  tenancy
) => {
  return (
    tenancy?.unit?.full_unit_name ||
    tenancy?.unit?.unit_name ||
    tenancy?.unit?.unit_number ||
    tenancy?.unit_name ||
    tenancy?.unit_number ||
    "Not assigned"
  );
};

/*
|--------------------------------------------------------------------------
| FORMAT MONEY
|--------------------------------------------------------------------------
*/

const formatMoney = (value) => {
  const numericValue = Number(
    value
  );

  if (
    Number.isNaN(
      numericValue
    )
  ) {
    return value;
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

/*
|--------------------------------------------------------------------------
| CAPITALIZE
|--------------------------------------------------------------------------
*/

const capitalize = (value) => {
  if (!value) {
    return "";
  }

  return String(value)
    .toLowerCase()
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
};

export default TenantDetails;