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
  useCallback,
  useEffect,
  useMemo,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import Swal from "sweetalert2";

import {
  useDispatch,
  useSelector,
} from "react-redux";

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
  const location = useLocation();

  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | REDUX STATE
  |--------------------------------------------------------------------------
  */

  const {
    tenant = null,
    loading = false,
    error = null,
    activating = false,
    deactivating = false,
    blacklisting = false,
    verifying = false,
    unverifying = false,
  } = useSelector(
    (state) => state.tenants || {}
  );

  /*
  |--------------------------------------------------------------------------
  | LOAD TENANT
  |--------------------------------------------------------------------------
  */

  const loadTenant = useCallback(async () => {
    if (!id) {
      return null;
    }

    dispatch(clearTenantError());

    return dispatch(fetchTenant(id));
  }, [dispatch, id]);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    loadTenant();

    return () => {
      dispatch(clearTenant());
      dispatch(clearTenantError());
    };
  }, [
    id,
    loadTenant,
    dispatch,
  ]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH AFTER EDIT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !id ||
      location.state?.updated !== true
    ) {
      return;
    }

    loadTenant();

    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }, [
    id,
    location.state?.updated,
    location.pathname,
    loadTenant,
    navigate,
  ]);

  /*
  |--------------------------------------------------------------------------
  | TENANT DATA NORMALIZATION
  |--------------------------------------------------------------------------
  |
  | Supports both:
  |
  | {
  |   id: 1,
  |   other_names: "John"
  | }
  |
  | and:
  |
  | {
  |   data: {
  |     id: 1,
  |     other_names: "John"
  |   }
  | }
  |
  */

  const tenantData = useMemo(() => {
    if (
      tenant?.data &&
      typeof tenant.data === "object" &&
      !Array.isArray(tenant.data)
    ) {
      return tenant.data;
    }

    return tenant;
  }, [tenant]);

  /*
  |--------------------------------------------------------------------------
  | USER NORMALIZATION
  |--------------------------------------------------------------------------
  */

  const tenantUser = useMemo(() => {
    const user =
      tenantData?.user ??
      tenant?.user;

    if (
      user &&
      typeof user === "object" &&
      !Array.isArray(user)
    ) {
      return user;
    }

    return null;
  }, [
    tenantData,
    tenant?.user,
  ]);

  /*
  |--------------------------------------------------------------------------
  | PERSONAL INFORMATION
  |--------------------------------------------------------------------------
  */

  const firstName =
    tenantData?.first_name ??
    tenantUser?.first_name ??
    "";

  const lastName =
    tenantData?.last_name ??
    tenantUser?.last_name ??
    "";

  /*
  | IMPORTANT:
  | other_names belongs to the tenant profile.
  | The tenant record is checked first.
  |
  | Some older responses may use other_name,
  | so that is also supported.
  */

  const otherNames =
    tenantData?.other_names ??
    tenantData?.other_name ??
    tenantUser?.other_names ??
    tenantUser?.other_name ??
    "";

  const email =
    tenantData?.email ??
    tenantUser?.email ??
    "";

  const phone =
    tenantData?.phone ??
    tenantUser?.phone ??
    "";

  /*
  |--------------------------------------------------------------------------
  | FULL NAME
  |--------------------------------------------------------------------------
  |
  | Build from the individual fields first so newly
  | updated other_names is reflected immediately.
  |
  */

  const fullName = useMemo(() => {
    const name = [
      firstName,
      otherNames,
      lastName,
    ]
      .map((value) =>
        String(value || "").trim()
      )
      .filter(Boolean)
      .join(" ")
      .trim();

    if (name) {
      return name;
    }

    if (tenantData?.full_name) {
      return String(
        tenantData.full_name
      );
    }

    if (tenantUser?.full_name) {
      return String(
        tenantUser.full_name
      );
    }

    return "Tenant";
  }, [
    tenantData?.full_name,
    tenantUser?.full_name,
    firstName,
    otherNames,
    lastName,
  ]);

  /*
  |--------------------------------------------------------------------------
  | INITIALS
  |--------------------------------------------------------------------------
  */

  const initials = useMemo(() => {
    const first =
      String(firstName || "")
        .trim()
        .charAt(0);

    const last =
      String(lastName || "")
        .trim()
        .charAt(0);

    if (first || last) {
      return `${first}${last}`.toUpperCase();
    }

    const fallback =
      String(fullName || "Tenant")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) =>
          part.charAt(0)
        )
        .join("");

    return (
      fallback || "T"
    ).toUpperCase();
  }, [
    firstName,
    lastName,
    fullName,
  ]);

  /*
  |--------------------------------------------------------------------------
  | BOOLEAN NORMALIZATION
  |--------------------------------------------------------------------------
  */

  const toBoolean = useCallback(
    (value) => {
      if (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true" ||
        value === "TRUE" ||
        value === "yes" ||
        value === "YES" ||
        value === "active" ||
        value === "ACTIVE" ||
        value === "verified" ||
        value === "VERIFIED"
      ) {
        return true;
      }

      return false;
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const status = useMemo(() => {
    const rawStatus =
      tenantData?.status ??
      tenantData?.account_status ??
      tenantUser?.status ??
      tenantUser?.account_status ??
      "pending";

    if (
      typeof rawStatus === "object" &&
      rawStatus !== null
    ) {
      return String(
        rawStatus?.value ??
        rawStatus?.name ??
        rawStatus?.status ??
        "pending"
      )
        .toLowerCase()
        .trim();
    }

    return String(rawStatus)
      .toLowerCase()
      .trim();
  }, [
    tenantData?.status,
    tenantData?.account_status,
    tenantUser?.status,
    tenantUser?.account_status,
  ]);

  /*
  |--------------------------------------------------------------------------
  | ACTIVE ACCOUNT
  |--------------------------------------------------------------------------
  */

  const isActive = useMemo(() => {
    if (
      tenantData?.is_active !== undefined &&
      tenantData?.is_active !== null
    ) {
      return toBoolean(
        tenantData.is_active
      );
    }

    if (
      tenantData?.active !== undefined &&
      tenantData?.active !== null
    ) {
      return toBoolean(
        tenantData.active
      );
    }

    if (
      tenantUser?.is_active !== undefined &&
      tenantUser?.is_active !== null
    ) {
      return toBoolean(
        tenantUser.is_active
      );
    }

    if (
      tenantUser?.active !== undefined &&
      tenantUser?.active !== null
    ) {
      return toBoolean(
        tenantUser.active
      );
    }

    return (
      status === "active" ||
      status === "approved"
    );
  }, [
    tenantData?.is_active,
    tenantData?.active,
    tenantUser?.is_active,
    tenantUser?.active,
    status,
    toBoolean,
  ]);

  /*
  |--------------------------------------------------------------------------
  | VERIFIED
  |--------------------------------------------------------------------------
  */

  const isVerified = useMemo(() => {
    if (
      tenantData?.is_verified !== undefined &&
      tenantData?.is_verified !== null
    ) {
      return toBoolean(
        tenantData.is_verified
      );
    }

    if (
      tenantData?.verified !== undefined &&
      tenantData?.verified !== null
    ) {
      return toBoolean(
        tenantData.verified
      );
    }

    if (
      tenantUser?.is_verified !== undefined &&
      tenantUser?.is_verified !== null
    ) {
      return toBoolean(
        tenantUser.is_verified
      );
    }

    if (
      tenantUser?.verified !== undefined &&
      tenantUser?.verified !== null
    ) {
      return toBoolean(
        tenantUser.verified
      );
    }

    return Boolean(
      tenantData?.verified_at ||
      tenantUser?.verified_at
    );
  }, [
    tenantData?.is_verified,
    tenantData?.verified,
    tenantUser?.is_verified,
    tenantUser?.verified,
    tenantData?.verified_at,
    tenantUser?.verified_at,
    toBoolean,
  ]);

  /*
  |--------------------------------------------------------------------------
  | STATUS LABEL
  |--------------------------------------------------------------------------
  */

  const statusLabel = useMemo(() => {
    return capitalize(
      String(status || "pending")
        .replace(/_/g, " ")
    );
  }, [status]);

  /*
  |--------------------------------------------------------------------------
  | EMERGENCY CONTACT
  |--------------------------------------------------------------------------
  */

  const emergencyContact = useMemo(() => {
    const nested =
      tenantData?.emergency_contact;

    const nestedContact =
      nested &&
        typeof nested === "object" &&
        !Array.isArray(nested)
        ? nested
        : {};

    return {
      name:
        nestedContact?.name ??
        tenantData?.emergency_contact_name ??
        tenantData?.emergency_name ??
        "",

      phone:
        nestedContact?.phone ??
        tenantData?.emergency_contact_phone ??
        tenantData?.emergency_phone ??
        "",

      relationship:
        nestedContact?.relationship ??
        tenantData?.emergency_contact_relationship ??
        tenantData?.emergency_relationship ??
        "",
    };
  }, [
    tenantData?.emergency_contact,
    tenantData?.emergency_contact_name,
    tenantData?.emergency_contact_phone,
    tenantData?.emergency_contact_relationship,
    tenantData?.emergency_name,
    tenantData?.emergency_phone,
    tenantData?.emergency_relationship,
  ]);

  /*
  |--------------------------------------------------------------------------
  | DATE
  |--------------------------------------------------------------------------
  */

  const formatDate = useCallback(
    (
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
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | DATE TIME
  |--------------------------------------------------------------------------
  */

  const formatDateTime = useCallback(
    (
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
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | SAFE VALUE
  |--------------------------------------------------------------------------
  */

  const valueOrFallback = useCallback(
    (
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

      if (
        typeof value === "object"
      ) {
        if (
          value.name !== undefined &&
          value.name !== null
        ) {
          return String(
            value.name
          );
        }

        if (
          value.title !== undefined &&
          value.title !== null
        ) {
          return String(
            value.title
          );
        }

        if (
          value.label !== undefined &&
          value.label !== null
        ) {
          return String(
            value.label
          );
        }

        if (
          value.value !== undefined &&
          typeof value.value !== "object"
        ) {
          return String(
            value.value
          );
        }

        return fallback;
      }

      return String(value);
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | LOCATION
  |--------------------------------------------------------------------------
  */

  const locationName = useMemo(() => {
    const getLocationValue = (
      objectValue,
      stringValue
    ) => {
      if (
        objectValue &&
        typeof objectValue === "object"
      ) {
        return (
          objectValue.name ??
          objectValue.title ??
          objectValue.label ??
          null
        );
      }

      if (
        typeof objectValue === "string"
      ) {
        return objectValue;
      }

      return stringValue || null;
    };

    const parts = [
      getLocationValue(
        tenantData?.area,
        tenantData?.area_name
      ),
      getLocationValue(
        tenantData?.city,
        tenantData?.city_name
      ),
      getLocationValue(
        tenantData?.county,
        tenantData?.county_name
      ),
      getLocationValue(
        tenantData?.region,
        tenantData?.region_name
      ),
      getLocationValue(
        tenantData?.country,
        tenantData?.country_name
      ),
    ].filter(Boolean);

    return (
      parts.join(", ") ||
      "Location not provided"
    );
  }, [tenantData]);

  /*
  |--------------------------------------------------------------------------
  | TENANCY NORMALIZATION
  |--------------------------------------------------------------------------
  */

  const tenancies = useMemo(() => {
    const candidates = [
      tenantData?.tenancies,
      tenantData?.tenancy_history,
      tenantData?.tenancy_records,
      tenantData?.tenancyRecords,
      tenantData?.active_tenancies,
      tenantData?.data?.tenancies,
      tenantData?.data?.tenancy_history,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate.filter(
          (item) =>
            item &&
            typeof item === "object"
        );
      }
    }

    const singleCandidates = [
      tenantData?.current_tenancy,
      tenantData?.active_tenancy,
      tenantData?.tenancy,
      tenantData?.currentTenancy,
      tenantData?.activeTenancy,
    ];

    const single =
      singleCandidates.find(
        (item) =>
          item &&
          typeof item === "object" &&
          !Array.isArray(item)
      );

    return single
      ? [single]
      : [];
  }, [tenantData]);

  /*
  |--------------------------------------------------------------------------
  | ACTIVE TENANCY
  |--------------------------------------------------------------------------
  */

  const activeTenancy = useMemo(() => {
    const explicitCandidates = [
      tenantData?.active_tenancy,
      tenantData?.current_tenancy,
      tenantData?.activeTenancy,
      tenantData?.currentTenancy,
    ];

    const explicit =
      explicitCandidates.find(
        (item) =>
          item &&
          typeof item === "object" &&
          !Array.isArray(item)
      );

    if (explicit) {
      const explicitStatus =
        normalizeTenancyStatus(
          explicit?.status
        );

      if (
        !isInactiveTenancyStatus(
          explicitStatus
        )
      ) {
        return explicit;
      }
    }

    const active =
      tenancies.find((item) => {
        const itemStatus =
          normalizeTenancyStatus(
            item?.status
          );

        if (
          isActiveTenancyStatus(
            itemStatus
          )
        ) {
          return true;
        }

        return (
          toBoolean(
            item?.is_active
          ) &&
          !isInactiveTenancyStatus(
            itemStatus
          )
        );
      });

    return active || null;
  }, [
    tenantData?.active_tenancy,
    tenantData?.current_tenancy,
    tenantData?.activeTenancy,
    tenantData?.currentTenancy,
    tenancies,
    toBoolean,
  ]);

  /*
  |--------------------------------------------------------------------------
  | TENANCY COUNT
  |--------------------------------------------------------------------------
  */

  const tenancyCount = useMemo(() => {
    const count =
      tenantData?.tenancies_count ??
      tenantData?.tenancy_count ??
      tenantData?.tenanciesCount ??
      tenantData?.data?.tenancies_count;

    if (
      count !== null &&
      count !== undefined &&
      count !== ""
    ) {
      const numeric =
        Number(count);

      if (
        Number.isFinite(
          numeric
        )
      ) {
        return numeric;
      }
    }

    return tenancies.length;
  }, [
    tenantData?.tenancies_count,
    tenantData?.tenancy_count,
    tenantData?.tenanciesCount,
    tenantData?.data?.tenancies_count,
    tenancies.length,
  ]);

  /*
  |--------------------------------------------------------------------------
  | ACTION LOADING
  |--------------------------------------------------------------------------
  */

  const actionLoading =
    Boolean(
      activating ||
      deactivating ||
      blacklisting ||
      verifying ||
      unverifying
    );

  /*
  |--------------------------------------------------------------------------
  | GENERIC TENANT ACTION
  |--------------------------------------------------------------------------
  */

  const runTenantAction = useCallback(
    async ({
      action,
      title,
      successMessage,
      confirmText,
      confirmButtonColor,
    }) => {
      if (!tenantData?.id) {
        return;
      }

      const result =
        await Swal.fire({
          icon: "warning",
          title,
          text:
            "Are you sure you want to continue?",
          showCancelButton: true,
          confirmButtonText:
            confirmText || "Continue",
          cancelButtonText:
            "Cancel",
          confirmButtonColor:
            confirmButtonColor ||
            "#2563eb",
          reverseButtons: true,
        });

      if (!result.isConfirmed) {
        return;
      }

      try {
        dispatch(
          clearTenantError()
        );

        const response =
          await dispatch(
            action(tenantData.id)
          );

        if (
          response?.meta?.requestStatus ===
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

          await loadTenant();

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
    },
    [
      tenantData?.id,
      dispatch,
      loadTenant,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | ACTION HANDLERS
  |--------------------------------------------------------------------------
  */

  const handleActivate = useCallback(
    () =>
      runTenantAction({
        action: activateTenant,
        title: "Activate Tenant?",
        successMessage:
          "Tenant activated successfully.",
        confirmText:
          "Activate Tenant",
        confirmButtonColor:
          "#16a34a",
      }),
    [runTenantAction]
  );

  const handleDeactivate = useCallback(
    () =>
      runTenantAction({
        action: deactivateTenant,
        title: "Deactivate Tenant?",
        successMessage:
          "Tenant deactivated successfully.",
        confirmText:
          "Deactivate",
        confirmButtonColor:
          "#d97706",
      }),
    [runTenantAction]
  );

  const handleBlacklist = useCallback(
    () =>
      runTenantAction({
        action: blacklistTenant,
        title: "Blacklist Tenant?",
        successMessage:
          "Tenant blacklisted successfully.",
        confirmText:
          "Blacklist Tenant",
        confirmButtonColor:
          "#dc2626",
      }),
    [runTenantAction]
  );

  const handleVerify = useCallback(
    () =>
      runTenantAction({
        action: verifyTenant,
        title: "Verify Tenant?",
        successMessage:
          "Tenant verified successfully.",
        confirmText:
          "Verify Tenant",
        confirmButtonColor:
          "#2563eb",
      }),
    [runTenantAction]
  );

  const handleUnverify = useCallback(
    () =>
      runTenantAction({
        action: unverifyTenant,
        title: "Remove Verification?",
        successMessage:
          "Tenant verification removed successfully.",
        confirmText:
          "Remove Verification",
        confirmButtonColor:
          "#d97706",
      }),
    [runTenantAction]
  );

  /*
  |--------------------------------------------------------------------------
  | RETRY
  |--------------------------------------------------------------------------
  */

  const handleRetry = useCallback(() => {
    loadTenant();
  }, [loadTenant]);

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const handleEdit = useCallback(() => {
    if (!tenantData?.id) {
      return;
    }

    navigate(
      `/super-admin/tenants/${tenantData.id}/edit`
    );
  }, [
    tenantData?.id,
    navigate,
  ]);

  /*
  |--------------------------------------------------------------------------
  | NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (
    !loading &&
    !tenantData
  ) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Tenant Details"
          subtitle="Tenant information"
          onBack={() =>
            navigate(
              "/super-admin/tenants"
            )
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
              {getErrorMessage(
                error,
                "The requested tenant could not be found."
              )}
            </p>

            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/super-admin/tenants"
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
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

  if (
    loading &&
    !tenantData
  ) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Tenant Details"
          subtitle="Loading tenant information..."
          onBack={() =>
            navigate(
              "/super-admin/tenants"
            )
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
      <PageHeader
        title="Tenant Details"
        subtitle="View tenant profile, account status and tenancy information."
        onBack={() =>
          navigate(
            "/super-admin/tenants"
          )
        }
      >
        <button
          type="button"
          onClick={handleEdit}
          disabled={actionLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Edit3 className="h-4 w-4" />
          Edit Tenant
        </button>
      </PageHeader>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Unable to refresh tenant information
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {getErrorMessage(
                    error,
                    "An unexpected error occurred."
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* PROFILE */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-primary-50 via-white to-white px-5 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-lg font-bold text-primary-700">
                  {initials}
                </div>

                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-2">

                    <h2 className="break-words text-xl font-bold text-gray-900">
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
                    Tenant Number:{" "}
                    <span className="font-medium text-gray-700">
                      {valueOrFallback(
                        tenantData?.tenant_number,
                        `#${tenantData?.id ?? "N/A"}`
                      )}
                    </span>
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Record ID: #{tenantData?.id}
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
                  value={valueOrFallback(email)}
                />

                <ContactCard
                  icon={
                    <Phone className="h-4 w-4" />
                  }
                  label="Phone"
                  value={valueOrFallback(phone)}
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
                  onClick={handleActivate}
                  loading={activating}
                  disabled={actionLoading}
                  variant="success"
                />
              )}

              {isActive && (
                <ActionButton
                  icon={
                    <UserRoundX className="h-4 w-4" />
                  }
                  label="Deactivate"
                  onClick={handleDeactivate}
                  loading={deactivating}
                  disabled={actionLoading}
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
                  disabled={actionLoading}
                  variant="primary"
                />
              )}

              {isVerified && (
                <ActionButton
                  icon={
                    <XCircle className="h-4 w-4" />
                  }
                  label="Unverify"
                  onClick={handleUnverify}
                  loading={unverifying}
                  disabled={actionLoading}
                  variant="warning"
                />
              )}

              {status !== "blacklisted" && (
                <ActionButton
                  icon={
                    <UserRoundX className="h-4 w-4" />
                  }
                  label="Blacklist"
                  onClick={handleBlacklist}
                  loading={blacklisting}
                  disabled={actionLoading}
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
                className="ml-auto inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* PERSONAL + ACCOUNT */}

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">

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
                  firstName
                )}
              />

              <InfoItem
                label="Other Names"
                value={valueOrFallback(
                  otherNames
                )}
              />

              <InfoItem
                label="Last Name"
                value={valueOrFallback(
                  lastName
                )}
              />

              <InfoItem
                label="Email"
                value={valueOrFallback(
                  email
                )}
                icon={
                  <Mail className="h-4 w-4" />
                }
              />

              <InfoItem
                label="Phone"
                value={valueOrFallback(
                  phone
                )}
                icon={
                  <Phone className="h-4 w-4" />
                }
              />

              <InfoItem
                label="National ID"
                value={valueOrFallback(
                  tenantData?.id_number ??
                  tenantData?.national_id ??
                  tenantData?.national_id_number
                )}
              />

              <InfoItem
                label="Passport Number"
                value={valueOrFallback(
                  tenantData?.passport_number
                )}
              />

              <InfoItem
                label="Gender"
                value={capitalize(
                  valueOrFallback(
                    tenantData?.gender
                  )
                )}
              />

              <InfoItem
                label="Date of Birth"
                value={formatDate(
                  tenantData?.date_of_birth
                )}
                icon={
                  <CalendarDays className="h-4 w-4" />
                }
              />

              <InfoItem
                label="Nationality"
                value={valueOrFallback(
                  tenantData?.nationality ??
                  tenantData?.country
                )}
                icon={
                  <Globe2 className="h-4 w-4" />
                }
              />

            </InfoGrid>
          </InfoSection>

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
                  tenantData?.created_at
                )}
              />

              <StatusRow
                label="Last Updated"
                value={formatDateTime(
                  tenantData?.updated_at
                )}
              />

              {(
                tenantData?.verified_at ||
                tenantUser?.verified_at
              ) && (
                  <StatusRow
                    label="Verified At"
                    value={formatDateTime(
                      tenantData?.verified_at ??
                      tenantUser?.verified_at
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
                  getLocationPart(
                    tenantData?.country,
                    tenantData?.country_name
                  )
                )}
              />

              <InfoItem
                label="Region"
                value={valueOrFallback(
                  getLocationPart(
                    tenantData?.region,
                    tenantData?.region_name
                  )
                )}
              />

              <InfoItem
                label="County"
                value={valueOrFallback(
                  getLocationPart(
                    tenantData?.county,
                    tenantData?.county_name
                  )
                )}
              />

              <InfoItem
                label="City"
                value={valueOrFallback(
                  getLocationPart(
                    tenantData?.city,
                    tenantData?.city_name
                  )
                )}
              />

              <InfoItem
                label="Area"
                value={valueOrFallback(
                  getLocationPart(
                    tenantData?.area,
                    tenantData?.area_name
                  )
                )}
              />

              <InfoItem
                label="Full Location"
                value={locationName}
                icon={
                  <MapPin className="h-4 w-4" />
                }
              />

              <div className="lg:col-span-3">
                <InfoItem
                  label="Residential Address"
                  value={valueOrFallback(
                    tenantData?.address ??
                    tenantData?.street_address
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
                  tenantData?.occupation
                )}
              />

              <InfoItem
                label="Employer"
                value={valueOrFallback(
                  tenantData?.employer ??
                  tenantData?.company
                )}
              />

              <InfoItem
                label="Monthly Income"
                value={
                  tenantData?.monthly_income !== null &&
                    tenantData?.monthly_income !== undefined &&
                    tenantData?.monthly_income !== ""
                    ? formatMoney(
                      tenantData.monthly_income
                    )
                    : "Not provided"
                }
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
                  emergencyContact.name
                )}
                icon={
                  <User className="h-4 w-4" />
                }
              />

              <InfoItem
                label="Phone"
                value={valueOrFallback(
                  emergencyContact.phone
                )}
                icon={
                  <Phone className="h-4 w-4" />
                }
              />

              <InfoItem
                label="Relationship"
                value={valueOrFallback(
                  emergencyContact.relationship
                )}
              />

            </InfoGrid>
          </InfoSection>

        </div>

        {/* CURRENT TENANCY */}

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
                        Tenancy
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Property
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Apartment
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
                      ) => {

                        const tenancyStatus =
                          normalizeTenancyStatus(
                            tenancy?.status
                          );

                        return (
                          <tr
                            key={
                              tenancy?.id ??
                              tenancy?.tenancy_number ??
                              index
                            }
                            className="hover:bg-gray-50"
                          >

                            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                              {valueOrFallbackStatic(
                                tenancy?.tenancy_number,
                                tenancy?.id
                                  ? `#${tenancy.id}`
                                  : "Not assigned"
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                              {getPropertyName(
                                tenancy
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                              {getApartmentName(
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
                                tenancy?.start_date ??
                                tenancy?.lease_start_date
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                              {formatDate(
                                tenancy?.end_date ??
                                tenancy?.lease_end_date
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4">

                              <StatusBadge
                                status={
                                  tenancyStatus ||
                                  "unknown"
                                }
                                label={capitalize(
                                  (
                                    tenancyStatus ||
                                    "Unknown"
                                  ).replace(
                                    /_/g,
                                    " "
                                  )
                                )}
                              />

                            </td>

                          </tr>
                        );
                      }
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
            {tenantData?.notes ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {String(
                  tenantData.notes
                )}
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                No additional notes
                have been added.
              </p>
            )}
          </InfoSection>

        </div>

        {/* FOOTER ACTIONS */}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/super-admin/tenants"
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tenants
          </button>

          <button
            type="button"
            onClick={handleEdit}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
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
}) => (
  <header className="border-b border-gray-200 bg-white">

    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
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
}) => (
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

/*
|--------------------------------------------------------------------------
| INFO GRID
|--------------------------------------------------------------------------
*/

const InfoGrid = ({
  children,
  columns = "sm:grid-cols-2",
}) => (
  <div
    className={`grid grid-cols-1 gap-x-6 gap-y-5 ${columns}`}
  >
    {children}
  </div>
);

/*
|--------------------------------------------------------------------------
| INFO ITEM
|--------------------------------------------------------------------------
*/

const InfoItem = ({
  label,
  value,
  icon,
}) => (
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

/*
|--------------------------------------------------------------------------
| STATUS ROW
|--------------------------------------------------------------------------
*/

const StatusRow = ({
  label,
  value,
}) => (
  <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0">

    <span className="text-sm text-gray-500">
      {label}
    </span>

    <div className="text-right">
      {value}
    </div>

  </div>
);

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

const StatusBadge = ({
  status,
  label,
}) => {
  const normalized =
    normalizeTenancyStatus(
      status
    );

  let classes =
    "bg-gray-100 text-gray-700";

  if (
    normalized === "active" ||
    normalized === "approved" ||
    normalized === "ongoing" ||
    normalized === "current"
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
    normalized === "terminated" ||
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "expired"
  ) {
    classes =
      "bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {label ||
        capitalize(
          normalized ||
          "Unknown"
        )}
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
}) =>
  active ? (
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

/*
|--------------------------------------------------------------------------
| CONTACT CARD
|--------------------------------------------------------------------------
*/

const ContactCard = ({
  icon,
  label,
  value,
}) => (
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

/*
|--------------------------------------------------------------------------
| MINI STAT
|--------------------------------------------------------------------------
*/

const MiniStatCard = ({
  icon,
  label,
  value,
  description,
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

    <div className="flex items-start justify-between gap-3">

      <div className="min-w-0">

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
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] ||
        variants.neutral
        }`}
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

  const rent =
    tenancy?.rent_amount ??
    tenancy?.monthly_rent ??
    tenancy?.rent ??
    tenancy?.pricing?.rent_amount ??
    tenancy?.unit?.rent_amount ??
    tenancy?.unit?.price;

  const deposit =
    tenancy?.deposit_amount ??
    tenancy?.deposit ??
    tenancy?.security_deposit ??
    tenancy?.unit?.deposit;

  const serviceCharge =
    tenancy?.service_charge ??
    tenancy?.service_charge_amount ??
    tenancy?.unit?.service_charge;

  const tenancyStatus =
    normalizeTenancyStatus(
      tenancy?.status
    );

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

        <TenancyValue
          label="Tenancy Number"
          value={valueOrFallbackStatic(
            tenancy?.tenancy_number,
            tenancy?.id
              ? `#${tenancy.id}`
              : "Not assigned"
          )}
          icon={
            <FileText className="h-4 w-4" />
          }
        />

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
            (
              tenancyStatus ||
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
            tenancy?.start_date ??
            tenancy?.lease_start_date
          )}
          icon={
            <CalendarDays className="h-4 w-4" />
          }
        />

        <TenancyValue
          label="End Date"
          value={formatDate(
            tenancy?.end_date ??
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
              rent !== null &&
              rent !== ""
              ? formatMoney(rent)
              : "Not provided"
          }
        />

        <TenancyValue
          label="Deposit"
          value={
            deposit !== undefined &&
              deposit !== null &&
              deposit !== ""
              ? formatMoney(deposit)
              : "Not provided"
          }
        />

        {serviceCharge !==
          undefined &&
          serviceCharge !== null &&
          serviceCharge !== "" && (
            <TenancyValue
              label="Service Charge"
              value={formatMoney(
                serviceCharge
              )}
            />
          )}

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
}) => (
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

      <p className="break-words text-sm font-semibold text-gray-800">
        {value}
      </p>

    </div>
  </div>
);

/*
|--------------------------------------------------------------------------
| EMPTY TENANCY
|--------------------------------------------------------------------------
*/

const EmptyTenancy = () => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">

    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
      <Home className="h-6 w-6" />
    </div>

    <h4 className="mt-3 text-sm font-semibold text-gray-800">
      No Active Tenancy
    </h4>

    <p className="mt-1 max-w-md text-sm text-gray-500">
      This tenant currently has no active property or unit assignment.
    </p>

  </div>
);

/*
|--------------------------------------------------------------------------
| SKELETON
|--------------------------------------------------------------------------
*/

const TenantDetailsSkeleton = () => (
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

/*
|--------------------------------------------------------------------------
| PROPERTY NAME
|--------------------------------------------------------------------------
*/

const getPropertyName = (
  tenancy
) => {
  if (!tenancy) {
    return "Not assigned";
  }

  const property =
    tenancy?.property ??
    tenancy?.property_details ??
    tenancy?.propertyDetail ??
    tenancy?.unit?.property ??
    tenancy?.apartment?.property ??
    null;

  if (
    typeof property === "string"
  ) {
    return property;
  }

  if (
    property &&
    typeof property === "object"
  ) {
    return (
      property?.title ??
      property?.name ??
      property?.property_name ??
      property?.property_title ??
      property?.display_name ??
      "Not assigned"
    );
  }

  return (
    tenancy?.property_title ??
    tenancy?.property_name ??
    tenancy?.property_label ??
    "Not assigned"
  );
};

/*
|--------------------------------------------------------------------------
| APARTMENT NAME
|--------------------------------------------------------------------------
*/

const getApartmentName = (
  tenancy
) => {
  if (!tenancy) {
    return "Not assigned";
  }

  const apartment =
    tenancy?.apartment ??
    tenancy?.apartment_details ??
    tenancy?.apartmentDetail ??
    tenancy?.unit?.apartment ??
    null;

  if (
    typeof apartment === "string"
  ) {
    return apartment;
  }

  if (
    apartment &&
    typeof apartment === "object"
  ) {
    return (
      apartment?.name ??
      apartment?.title ??
      apartment?.apartment_name ??
      apartment?.apartment_title ??
      apartment?.display_name ??
      apartment?.code ??
      "Not assigned"
    );
  }

  return (
    tenancy?.apartment_name ??
    tenancy?.apartment_title ??
    tenancy?.apartment_label ??
    "Not assigned"
  );
};

/*
|--------------------------------------------------------------------------
| UNIT NAME
|--------------------------------------------------------------------------
*/

const getUnitName = (
  tenancy
) => {
  if (!tenancy) {
    return "Not assigned";
  }

  const unit =
    tenancy?.unit ??
    tenancy?.unit_details ??
    tenancy?.unitDetail ??
    null;

  if (
    typeof unit === "string"
  ) {
    return unit;
  }

  if (
    unit &&
    typeof unit === "object"
  ) {
    return (
      unit?.full_unit_name ??
      unit?.unit_name ??
      unit?.name ??
      unit?.unit_number ??
      unit?.number ??
      unit?.display_name ??
      "Not assigned"
    );
  }

  return (
    tenancy?.full_unit_name ??
    tenancy?.unit_name ??
    tenancy?.unit_number ??
    tenancy?.unit_label ??
    "Not assigned"
  );
};

/*
|--------------------------------------------------------------------------
| TENANCY STATUS NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizeTenancyStatus = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (
    typeof value === "object"
  ) {
    return String(
      value?.value ??
      value?.name ??
      value?.status ??
      value?.label ??
      ""
    )
      .toLowerCase()
      .trim();
  }

  return String(value)
    .toLowerCase()
    .trim();
};

/*
|--------------------------------------------------------------------------
| ACTIVE TENANCY STATUS
|--------------------------------------------------------------------------
*/

const isActiveTenancyStatus = (
  status
) => {
  const normalized =
    normalizeTenancyStatus(
      status
    );

  return (
    normalized === "active" ||
    normalized === "ongoing" ||
    normalized === "current" ||
    normalized === "occupied"
  );
};

/*
|--------------------------------------------------------------------------
| INACTIVE TENANCY STATUS
|--------------------------------------------------------------------------
*/

const isInactiveTenancyStatus = (
  status
) => {
  const normalized =
    normalizeTenancyStatus(
      status
    );

  return (
    normalized === "expired" ||
    normalized === "terminated" ||
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "inactive" ||
    normalized === "ended" ||
    normalized === "closed"
  );
};

/*
|--------------------------------------------------------------------------
| LOCATION PART
|--------------------------------------------------------------------------
*/

const getLocationPart = (
  objectValue,
  stringValue
) => {
  if (
    objectValue &&
    typeof objectValue === "object"
  ) {
    return (
      objectValue.name ??
      objectValue.title ??
      objectValue.label ??
      stringValue ??
      null
    );
  }

  if (
    typeof objectValue === "string"
  ) {
    return objectValue;
  }

  return stringValue ?? null;
};

/*
|--------------------------------------------------------------------------
| STATIC SAFE VALUE
|--------------------------------------------------------------------------
*/

const valueOrFallbackStatic = (
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

  if (
    typeof value === "object"
  ) {
    return (
      value?.name ??
      value?.title ??
      value?.label ??
      value?.value ??
      fallback
    );
  }

  return String(value);
};

/*
|--------------------------------------------------------------------------
| MONEY
|--------------------------------------------------------------------------
*/

const formatMoney = (
  value
) => {
  const numericValue =
    Number(value);

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

/*
|--------------------------------------------------------------------------
| ERROR MESSAGE
|--------------------------------------------------------------------------
*/

const getErrorMessage = (
  error,
  fallback
) => {
  if (!error) {
    return fallback;
  }

  if (
    typeof error === "string"
  ) {
    return error;
  }

  return (
    error?.message ??
    error?.error ??
    error?.errors?.message ??
    fallback
  );
};

/*
|--------------------------------------------------------------------------
| CAPITALIZE
|--------------------------------------------------------------------------
*/

const capitalize = (
  value
) => {
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