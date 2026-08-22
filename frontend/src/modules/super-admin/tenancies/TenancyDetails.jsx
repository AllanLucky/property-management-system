import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Edit3,
  FileText,
  Home,
  Loader2,
  MapPin,
  Phone,
  User,
  UserRound,
  Wallet,
  XCircle,
  Trash2,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import {
  activateTenancy,
  clearTenancyError,
  deactivateTenancy,
  deleteTenancy,
  fetchTenancy,
} from "../../../store/tenancySlice";

import { addNotification } from "../../../store/uiSlice";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getErrorMessage = (error) => {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error?.message) {
    return String(error.message);
  }

  if (error?.error) {
    return String(error.error);
  }

  if (error?.errors) {
    if (typeof error.errors === "string") {
      return error.errors;
    }

    if (typeof error.errors === "object") {
      const messages = Object.values(error.errors)
        .flat()
        .filter(Boolean)
        .map((message) => String(message));

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }
  }

  if (error?.response?.data) {
    const data = error.response.data;

    if (typeof data === "string") {
      return data;
    }

    if (data?.message) {
      return String(data.message);
    }

    if (data?.error) {
      return String(data.error);
    }

    if (data?.errors) {
      if (typeof data.errors === "string") {
        return data.errors;
      }

      if (typeof data.errors === "object") {
        const messages = Object.values(data.errors)
          .flat()
          .filter(Boolean)
          .map((message) => String(message));

        if (messages.length > 0) {
          return messages.join(" ");
        }
      }
    }
  }

  return "Failed to process the tenancy. Please try again.";
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatCurrency = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "KES 0.00";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "KES 0.00";
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};

const normalizeBoolean = (value) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
};

const getFullName = (person) => {
  if (!person) {
    return "—";
  }

  if (person.full_name) {
    return person.full_name;
  }

  const firstName =
    person.first_name ||
    person.firstName ||
    "";

  const lastName =
    person.last_name ||
    person.lastName ||
    "";

  const name = `${firstName} ${lastName}`.trim();

  return name || person.name || "—";
};

const getInitials = (person) => {
  const fullName = getFullName(person);

  if (!fullName || fullName === "—") {
    return "T";
  }

  const parts = fullName
    .split(" ")
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`
    .toUpperCase();
};

const getObjectName = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value.name ||
    value.title ||
    value.label ||
    value.full_name ||
    value.unit_number ||
    value.apartment_number ||
    ""
  );
};

const getTenancyStatus = (tenancy) => {
  if (!tenancy) {
    return "unknown";
  }

  if (tenancy.status) {
    return String(tenancy.status).toLowerCase();
  }

  if (tenancy.tenancy_status) {
    return String(tenancy.tenancy_status).toLowerCase();
  }

  if (
    tenancy.is_active !== undefined
  ) {
    return normalizeBoolean(
      tenancy.is_active
    )
      ? "active"
      : "inactive";
  }

  return "unknown";
};

const getStatusLabel = (status) => {
  if (!status) {
    return "Unknown";
  }

  const normalized = String(status)
    .replace(/[_-]/g, " ")
    .trim();

  return normalized
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
};

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

const StatusBadge = ({ status }) => {
  const normalized = String(status || "")
    .toLowerCase();

  const active =
    normalized === "active";

  const inactive =
    normalized === "inactive" ||
    normalized === "terminated" ||
    normalized === "cancelled" ||
    normalized === "expired";

  const classes = active
    ? "border-green-200 bg-green-50 text-green-700"
    : inactive
      ? "border-gray-200 bg-gray-50 text-gray-600"
      : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        border
        px-2.5
        py-1
        text-xs
        font-semibold
        ${classes}
      `}
    >
      {getStatusLabel(status)}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| INFO ITEM
|--------------------------------------------------------------------------
*/

const InfoItem = ({
  icon,
  label,
  value,
  children,
}) => {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>

        {children || (
          <p className="mt-1 break-words text-sm font-medium text-gray-900">
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

const DetailsSection = ({
  icon,
  title,
  description,
  children,
}) => {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          {icon}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            {title}
          </h2>

          {description && (
            <p className="mt-0.5 text-xs leading-5 text-gray-500">
              {description}
            </p>
          )}
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
| COMPONENT
|--------------------------------------------------------------------------
*/

const TenancyDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const [actionLoading, setActionLoading] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | TENANCY
  |--------------------------------------------------------------------------
  */

  const tenancy = useSelector((state) => {
    const tenancyState = state?.tenancy;

    return (
      tenancyState?.currentTenancy ||
      tenancyState?.selectedTenancy ||
      tenancyState?.tenancy ||
      null
    );
  });

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const loading = useSelector((state) => {
    const tenancyState = state?.tenancy;

    if (!tenancyState) {
      return false;
    }

    if (
      typeof tenancyState.loading ===
      "boolean"
    ) {
      return tenancyState.loading;
    }

    return Boolean(
      tenancyState.loading?.fetch ||
      tenancyState.loading?.single ||
      tenancyState.loading?.fetchTenancy
    );
  });

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  const error = useSelector((state) => {
    const tenancyState = state?.tenancy;

    return (
      tenancyState?.error ||
      tenancyState?.fetchError ||
      null
    );
  });

  /*
  |--------------------------------------------------------------------------
  | LOAD TENANCY
  |--------------------------------------------------------------------------
  */

  const loadTenancy = useCallback(async () => {
    if (!id) {
      return null;
    }

    try {
      return await dispatch(
        fetchTenancy(id)
      ).unwrap();
    } catch (requestError) {
      dispatch(
        addNotification({
          type: "error",
          message: getErrorMessage(
            requestError
          ),
        })
      );

      throw requestError;
    }
  }, [dispatch, id]);

  /*
  |--------------------------------------------------------------------------
  | FETCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    let cancelled = false;

    const request = async () => {
      try {
        await loadTenancy();
      } catch {
        if (cancelled) {
          return;
        }
      }
    };

    void request();

    return () => {
      cancelled = true;
    };
  }, [id, loadTenancy]);

  /*
  |--------------------------------------------------------------------------
  | CLEAR ERROR
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      dispatch(clearTenancyError());
    };
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | DERIVED DATA
  |--------------------------------------------------------------------------
  */

  const status = useMemo(
    () => getTenancyStatus(tenancy),
    [tenancy]
  );

  const isActive = useMemo(
    () => status === "active",
    [status]
  );

  const tenant = useMemo(() => {
    if (!tenancy) {
      return null;
    }

    return (
      tenancy.tenant ||
      tenancy.tenant_details ||
      tenancy.user ||
      null
    );
  }, [tenancy]);

  const property = useMemo(() => {
    if (!tenancy) {
      return null;
    }

    return (
      tenancy.property ||
      tenancy.property_details ||
      null
    );
  }, [tenancy]);

  const apartment = useMemo(() => {
    if (!tenancy) {
      return null;
    }

    return (
      tenancy.apartment ||
      tenancy.apartment_details ||
      null
    );
  }, [tenancy]);

  const unit = useMemo(() => {
    if (!tenancy) {
      return null;
    }

    return (
      tenancy.unit ||
      tenancy.unit_details ||
      null
    );
  }, [tenancy]);

  const tenantName = useMemo(
    () => getFullName(tenant),
    [tenant]
  );

  const tenantInitials = useMemo(
    () => getInitials(tenant),
    [tenant]
  );

  const propertyName = useMemo(
    () =>
      getObjectName(property) ||
      tenancy?.property_name ||
      "—",
    [property, tenancy]
  );

  const apartmentName = useMemo(
    () =>
      getObjectName(apartment) ||
      tenancy?.apartment_name ||
      tenancy?.apartment_number ||
      "—",
    [apartment, tenancy]
  );

  const unitName = useMemo(
    () =>
      getObjectName(unit) ||
      tenancy?.unit_number ||
      tenancy?.unit_name ||
      "—",
    [unit, tenancy]
  );

  /*
  |--------------------------------------------------------------------------
  | ACTION HANDLER
  |--------------------------------------------------------------------------
  */

  const handleStatusChange = async () => {
    if (!tenancy?.id || actionLoading) {
      return;
    }

    setActionLoading(true);

    try {
      if (isActive) {
        await dispatch(
          deactivateTenancy(
            tenancy.id
          )
        ).unwrap();

        dispatch(
          addNotification({
            type: "success",
            message:
              "Tenancy deactivated successfully.",
          })
        );
      } else {
        await dispatch(
          activateTenancy(
            tenancy.id
          )
        ).unwrap();

        dispatch(
          addNotification({
            type: "success",
            message:
              "Tenancy activated successfully.",
          })
        );
      }

      await loadTenancy();
    } catch (actionError) {
      dispatch(
        addNotification({
          type: "error",
          message:
            getErrorMessage(actionError),
        })
      );

      throw actionError;
    } finally {
      setActionLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const handleDelete = async () => {
    if (!tenancy?.id || actionLoading) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this tenancy? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);

    try {
      await dispatch(
        deleteTenancy(tenancy.id)
      ).unwrap();

      dispatch(
        addNotification({
          type: "success",
          message:
            "Tenancy deleted successfully.",
        })
      );

      navigate("/super-admin/tenancies");
    } catch (deleteError) {
      dispatch(
        addNotification({
          type: "error",
          message:
            getErrorMessage(deleteError),
        })
      );

      throw deleteError;
    } finally {
      setActionLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {
    if (actionLoading) {
      return;
    }

    navigate("/super-admin/tenancies");
  };

  const handleEdit = () => {
    if (!tenancy?.id || actionLoading) {
      return;
    }

    navigate(
      `/super-admin/tenancies/${tenancy.id}/edit`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | INVALID ID
  |--------------------------------------------------------------------------
  */

  if (!id) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={handleBack}
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            border
            border-gray-300
            bg-white
            px-4
            py-2
            text-sm
            font-medium
            text-gray-700
            shadow-sm
            transition
            hover:bg-gray-50
          "
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tenancies
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-base font-semibold text-red-900">
            Invalid Tenancy
          </h2>

          <p className="mt-2 text-sm text-red-700">
            No tenancy ID was provided.
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading && !tenancy) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={handleBack}
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            border
            border-gray-300
            bg-white
            px-4
            py-2
            text-sm
            font-medium
            text-gray-700
            shadow-sm
            transition
            hover:bg-gray-50
          "
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tenancies
        </button>

        <div className="flex min-h-[450px] items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />

            <p className="text-sm font-semibold text-gray-700">
              Loading tenancy...
            </p>

            <p className="text-xs text-gray-500">
              Please wait while we load the tenancy details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (!tenancy) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={handleBack}
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            border
            border-gray-300
            bg-white
            px-4
            py-2
            text-sm
            font-medium
            text-gray-700
            shadow-sm
            transition
            hover:bg-gray-50
          "
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tenancies
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-red-900">
              Unable to Load Tenancy
            </h2>

            <p className="mt-2 max-w-lg text-sm text-red-700">
              {getErrorMessage(error)}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  void loadTenancy().catch(
                    () => { }
                  );
                }}
                disabled={loading}
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
                  transition
                  hover:bg-primary-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Try Again
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-5
                  py-2.5
                  text-sm
                  font-medium
                  text-gray-700
                  transition
                  hover:bg-gray-50
                "
              >
                Back to Tenancies
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={handleBack}
            disabled={actionLoading}
            className="
              mb-4
              inline-flex
              items-center
              gap-2
              text-sm
              font-medium
              text-gray-600
              transition
              hover:text-gray-900
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tenancies
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Tenancy Details
            </h1>

            <StatusBadge status={status} />
          </div>

          <p className="mt-1 text-sm text-gray-500">
            View complete tenancy information and rental details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleEdit}
            disabled={actionLoading}
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
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </button>

          <button
            type="button"
            onClick={handleStatusChange}
            disabled={actionLoading}
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
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isActive ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}

            {isActive
              ? "Deactivate"
              : "Activate"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={actionLoading}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-red-200
              bg-white
              px-4
              py-2.5
              text-sm
              font-medium
              text-red-600
              shadow-sm
              transition
              hover:bg-red-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <p className="text-sm font-semibold text-red-800">
                Tenancy Error
              </p>

              <p className="mt-1 text-sm text-red-700">
                {getErrorMessage(error)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TENANCY SUMMARY */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-50 text-lg font-bold text-primary-600">
                {tenantInitials}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Tenant
                </p>

                <h2 className="mt-1 text-xl font-bold text-gray-900">
                  {tenantName}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {tenancy.tenancy_number ||
                    tenancy.number ||
                    `TEN-${tenancy.id}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-400">
                  Start Date
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(
                    tenancy.start_date
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  End Date
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(
                    tenancy.end_date
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Rent
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatCurrency(
                    tenancy.rent_amount ??
                    tenancy.monthly_rent ??
                    tenancy.rent
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Deposit
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatCurrency(
                    tenancy.deposit_amount ??
                    tenancy.deposit
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TENANT */}

      <DetailsSection
        icon={<UserRound className="h-5 w-5" />}
        title="Tenant Information"
        description="Personal and contact information for the tenant."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            icon={<User className="h-4 w-4" />}
            label="Full Name"
            value={tenantName}
          />

          <InfoItem
            icon={<FileText className="h-4 w-4" />}
            label="Tenant Number"
            value={
              tenant?.tenant_number ||
              tenancy.tenant_number
            }
          />

          <InfoItem
            icon={<FileText className="h-4 w-4" />}
            label="National ID"
            value={
              tenant?.id_number ||
              tenant?.national_id ||
              tenant?.national_id_number
            }
          />

          <InfoItem
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
            value={
              tenant?.phone ||
              tenant?.phone_number
            }
          />

          <InfoItem
            icon={<User className="h-4 w-4" />}
            label="Gender"
            value={tenant?.gender}
          />

          <InfoItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Date of Birth"
            value={formatDate(
              tenant?.date_of_birth ||
              tenant?.dob
            )}
          />

          <InfoItem
            icon={<MapPin className="h-4 w-4" />}
            label="County"
            value={
              getObjectName(
                tenant?.county
              ) ||
              tenant?.county_name
            }
          />

          <InfoItem
            icon={<MapPin className="h-4 w-4" />}
            label="City"
            value={
              getObjectName(
                tenant?.city
              ) ||
              tenant?.city_name
            }
          />

          <InfoItem
            icon={<MapPin className="h-4 w-4" />}
            label="Address"
            value={
              tenant?.address ||
              tenant?.street_address
            }
          />
        </div>
      </DetailsSection>

      {/* PROPERTY */}

      <DetailsSection
        icon={<Building2 className="h-5 w-5" />}
        title="Property & Unit"
        description="Property, apartment and unit assigned to this tenancy."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            icon={<Building2 className="h-4 w-4" />}
            label="Property"
            value={propertyName}
          />

          <InfoItem
            icon={<Home className="h-4 w-4" />}
            label="Apartment"
            value={apartmentName}
          />

          <InfoItem
            icon={<Home className="h-4 w-4" />}
            label="Unit"
            value={unitName}
          />

          <InfoItem
            icon={<FileText className="h-4 w-4" />}
            label="Property ID"
            value={
              tenancy.property_id ||
              property?.id
            }
          />

          <InfoItem
            icon={<FileText className="h-4 w-4" />}
            label="Apartment ID"
            value={
              tenancy.apartment_id ||
              apartment?.id
            }
          />

          <InfoItem
            icon={<FileText className="h-4 w-4" />}
            label="Unit ID"
            value={
              tenancy.unit_id ||
              unit?.id
            }
          />
        </div>
      </DetailsSection>

      {/* RENTAL */}

      <DetailsSection
        icon={<Wallet className="h-5 w-5" />}
        title="Rental Information"
        description="Financial and lease information for this tenancy."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Start Date"
            value={formatDate(
              tenancy.start_date
            )}
          />

          <InfoItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="End Date"
            value={formatDate(
              tenancy.end_date
            )}
          />

          <InfoItem
            icon={<Wallet className="h-4 w-4" />}
            label="Monthly Rent"
            value={formatCurrency(
              tenancy.rent_amount ??
              tenancy.monthly_rent ??
              tenancy.rent
            )}
          />

          <InfoItem
            icon={<Wallet className="h-4 w-4" />}
            label="Security Deposit"
            value={formatCurrency(
              tenancy.deposit_amount ??
              tenancy.deposit
            )}
          />

          <InfoItem
            icon={<Wallet className="h-4 w-4" />}
            label="Service Charge"
            value={formatCurrency(
              tenancy.service_charge ??
              tenancy.service_charge_amount
            )}
          />

          <InfoItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Created At"
            value={formatDateTime(
              tenancy.created_at
            )}
          />
        </div>
      </DetailsSection>

      {/* NOTES */}

      {(tenancy.notes ||
        tenancy.description) && (
          <DetailsSection
            icon={<FileText className="h-5 w-5" />}
            title="Notes"
            description="Additional information recorded for this tenancy."
          >
            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {tenancy.notes ||
                tenancy.description}
            </p>
          </DetailsSection>
        )}

      {/* FOOTER ACTIONS */}

      <div className="sticky bottom-0 z-10 rounded-xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:p-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={actionLoading}
            className="
              inline-flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-gray-300
              bg-white
              px-5
              py-2.5
              text-sm
              font-medium
              text-gray-700
              transition
              hover:bg-gray-50
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:w-auto
            "
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
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
                px-6
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-primary-700
                disabled:cursor-not-allowed
                disabled:opacity-60
                sm:w-auto
              "
            >
              <Edit3 className="h-4 w-4" />
              Edit Tenancy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenancyDetails;