import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Edit3,
  ExternalLink,
  FileCheck2,
  FileText,
  Home,
  Loader2,
  MapPin,
  Phone,
  Trash2,
  User,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

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

    if (
      typeof error.errors === "object" &&
      !Array.isArray(error.errors)
    ) {
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

      if (
        typeof data.errors === "object" &&
        !Array.isArray(data.errors)
      ) {
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

  if (typeof person === "string") {
    return person;
  }

  if (person.full_name) {
    return String(person.full_name);
  }

  if (person.fullName) {
    return String(person.fullName);
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

  return (
    name ||
    person.name ||
    person.label ||
    "—"
  );
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

  return `${parts[0][0]}${parts[parts.length - 1][0]
    }`.toUpperCase();
};

const getObjectName = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value !== "object") {
    return String(value);
  }

  return (
    value.name ||
    value.title ||
    value.label ||
    value.full_name ||
    value.fullName ||
    value.unit_name ||
    value.unit_number ||
    value.apartment_name ||
    value.apartment_number ||
    value.property_name ||
    ""
  );
};

const formatTypeLabel = (value) => {
  if (!value) {
    return "—";
  }

  if (typeof value !== "string") {
    return getObjectName(value) || "—";
  }

  return value
    .replace(/[_-]/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
};

const getUnitTypeLabel = (unit) => {
  if (!unit) {
    return "—";
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  | Backend TenancyResource now returns:
  |
  | type       => "office"
  | unit_type  => "office"
  | type_label => "Office"
  |
  | Always prioritize type_label.
  |--------------------------------------------------------------------------
  */

  if (
    unit.type_label !== null &&
    unit.type_label !== undefined &&
    String(unit.type_label).trim() !== ""
  ) {
    return String(unit.type_label);
  }

  if (
    unit.unit_type !== null &&
    unit.unit_type !== undefined &&
    String(unit.unit_type).trim() !== ""
  ) {
    return formatTypeLabel(unit.unit_type);
  }

  if (
    unit.type !== null &&
    unit.type !== undefined &&
    String(unit.type).trim() !== ""
  ) {
    return formatTypeLabel(unit.type);
  }

  if (
    unit.type_name !== null &&
    unit.type_name !== undefined &&
    String(unit.type_name).trim() !== ""
  ) {
    return String(unit.type_name);
  }

  return "—";
};

const getTenancyStatus = (tenancy) => {
  if (!tenancy) {
    return "unknown";
  }

  if (
    tenancy.status !== null &&
    tenancy.status !== undefined &&
    tenancy.status !== ""
  ) {
    return String(tenancy.status).toLowerCase();
  }

  if (
    tenancy.tenancy_status !== null &&
    tenancy.tenancy_status !== undefined &&
    tenancy.tenancy_status !== ""
  ) {
    return String(
      tenancy.tenancy_status
    ).toLowerCase();
  }

  if (tenancy.is_active !== undefined) {
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

const getPaymentFrequencyLabel = (
  frequency
) => {
  if (!frequency) {
    return "—";
  }

  return getStatusLabel(frequency);
};

const hasValue = (value) => {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ""
  );
};

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

const StatusBadge = ({ status }) => {
  const normalized = String(status || "")
    .toLowerCase();

  let classes =
    "border-gray-200 bg-gray-50 text-gray-600";

  let icon = (
    <Clock3 className="h-3.5 w-3.5" />
  );

  if (normalized === "active") {
    classes =
      "border-green-200 bg-green-50 text-green-700";

    icon = (
      <CheckCircle2 className="h-3.5 w-3.5" />
    );
  }

  if (normalized === "pending") {
    classes =
      "border-amber-200 bg-amber-50 text-amber-700";

    icon = (
      <Clock3 className="h-3.5 w-3.5" />
    );
  }

  if (normalized === "expired") {
    classes =
      "border-orange-200 bg-orange-50 text-orange-700";

    icon = (
      <Clock3 className="h-3.5 w-3.5" />
    );
  }

  if (
    normalized === "terminated" ||
    normalized === "cancelled" ||
    normalized === "inactive"
  ) {
    classes =
      "border-red-200 bg-red-50 text-red-700";

    icon = (
      <XCircle className="h-3.5 w-3.5" />
    );
  }

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1
        text-xs
        font-semibold
        ${classes}
      `}
    >
      {icon}
      {getStatusLabel(status)}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| ACTIVE BADGE
|--------------------------------------------------------------------------
*/

const ActiveBadge = ({ active }) => {
  const isActive = normalizeBoolean(active);

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1
        text-xs
        font-semibold
        ${isActive
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-gray-200 bg-gray-50 text-gray-600"
        }
      `}
    >
      {isActive ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}

      {isActive ? "Active" : "Inactive"}
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
            {hasValue(value) ? value : "—"}
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

  const isPending = useMemo(
    () => status === "pending",
    [status]
  );

  const isEndedStatus = useMemo(
    () =>
      [
        "expired",
        "terminated",
        "cancelled",
        "inactive",
      ].includes(status),
    [status]
  );

  const tenant = useMemo(() => {
    if (!tenancy) {
      return null;
    }

    return (
      tenancy.tenant ||
      tenancy.tenant_details ||
      null
    );
  }, [tenancy]);

  const tenantUser = useMemo(() => {
    if (!tenancy) {
      return null;
    }

    return (
      tenancy.user ||
      tenancy.tenant?.user ||
      tenancy.tenant?.user_account ||
      tenancy.user_account ||
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
    () =>
      getFullName(tenant) !== "—"
        ? getFullName(tenant)
        : getFullName(tenantUser),
    [tenant, tenantUser]
  );

  const tenantInitials = useMemo(
    () =>
      getInitials(
        getFullName(tenant) !== "—"
          ? tenant
          : tenantUser
      ),
    [tenant, tenantUser]
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
      tenancy?.unit_name ||
      tenancy?.unit_number ||
      "—",
    [unit, tenancy]
  );

  const unitType = useMemo(
    () => getUnitTypeLabel(unit),
    [unit]
  );

  const tenancyIsActive = useMemo(
    () =>
      tenancy?.is_active !== undefined
        ? normalizeBoolean(
          tenancy.is_active
        )
        : isActive,
    [tenancy, isActive]
  );

  const canToggleStatus = useMemo(() => {
    return (
      status === "active" ||
      status === "pending"
    );
  }, [status]);

  /*
  |--------------------------------------------------------------------------
  | AGREEMENT
  |--------------------------------------------------------------------------
  */

  const agreementFile = useMemo(
    () =>
      tenancy?.agreement_file ||
      tenancy?.agreement_url ||
      tenancy?.agreement?.url ||
      null,
    [tenancy]
  );

  const agreementPublicId = useMemo(
    () =>
      tenancy?.agreement_public_id ||
      tenancy?.agreement?.public_id ||
      null,
    [tenancy]
  );

  /*
  |--------------------------------------------------------------------------
  | ACTION HANDLER
  |--------------------------------------------------------------------------
  */

  const handleStatusChange = async () => {
    if (
      !tenancy?.id ||
      actionLoading ||
      !canToggleStatus
    ) {
      return;
    }

    setActionLoading(true);

    try {
      if (isActive) {
        await dispatch(
          deactivateTenancy(tenancy.id)
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
          activateTenancy(tenancy.id)
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

            {tenancyIsActive && (
              <ActiveBadge active={tenancyIsActive} />
            )}
          </div>

          <p className="mt-1 text-sm text-gray-500">
            View complete tenancy information,
            rental details and lease configuration.
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

          {canToggleStatus && (
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
          )}

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

      {/* SUMMARY */}

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

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-5">
              <div>
                <p className="text-xs text-gray-400">
                  Status
                </p>

                <div className="mt-1">
                  <StatusBadge status={status} />
                </div>
              </div>

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
                  Active
                </p>

                <div className="mt-1">
                  <ActiveBadge
                    active={tenancyIsActive}
                  />
                </div>
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
              tenant?.phone_number ||
              tenantUser?.phone ||
              tenantUser?.phone_number
            }
          />

          <InfoItem
            icon={<User className="h-4 w-4" />}
            label="Email"
            value={
              tenant?.email ||
              tenantUser?.email
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
            label="Nationality"
            value={tenant?.nationality}
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
              tenancy.property_id ??
              property?.id
            }
          />

          <InfoItem
            icon={<FileText className="h-4 w-4" />}
            label="Apartment ID"
            value={
              tenancy.apartment_id ??
              apartment?.id
            }
          />

          <InfoItem
            icon={<FileText className="h-4 w-4" />}
            label="Unit ID"
            value={
              tenancy.unit_id ??
              unit?.id
            }
          />

          <InfoItem
            icon={<Home className="h-4 w-4" />}
            label="Unit Number"
            value={
              unit?.unit_number ||
              tenancy.unit_number
            }
          />

          <InfoItem
            icon={<Home className="h-4 w-4" />}
            label="Unit Type"
            value={unitType}
          />

          <InfoItem
            icon={<Wallet className="h-4 w-4" />}
            label="Unit Price"
            value={formatCurrency(
              unit?.price
            )}
          />

          <InfoItem
            icon={<Home className="h-4 w-4" />}
            label="Bedrooms"
            value={unit?.bedrooms}
          />

          <InfoItem
            icon={<Home className="h-4 w-4" />}
            label="Bathrooms"
            value={unit?.bathrooms}
          />

          <InfoItem
            icon={<Home className="h-4 w-4" />}
            label="Floor"
            value={unit?.floor}
          />

          <InfoItem
            icon={<Home className="h-4 w-4" />}
            label="Unit Status"
            value={
              unit?.status_label ||
              formatTypeLabel(unit?.status)
            }
          />
        </div>
      </DetailsSection>

      {/* TENANCY / LEASE CONFIGURATION */}

      <DetailsSection
        icon={<FileCheck2 className="h-5 w-5" />}
        title="Tenancy & Lease Configuration"
        description="Core tenancy identification, status and lease dates."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            icon={<FileText className="h-4 w-4" />}
            label="Tenancy Number"
            value={
              tenancy.tenancy_number ||
              tenancy.number
            }
          />

          <InfoItem
            icon={<BadgeCheck className="h-4 w-4" />}
            label="Tenancy Status"
          >
            <div className="mt-1">
              <StatusBadge status={status} />
            </div>
          </InfoItem>

          <InfoItem
            icon={<BadgeCheck className="h-4 w-4" />}
            label="Active Status"
          >
            <div className="mt-1">
              <ActiveBadge
                active={tenancyIsActive}
              />
            </div>
          </InfoItem>

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
            icon={<CalendarDays className="h-4 w-4" />}
            label="Move-In Date"
            value={formatDate(
              tenancy.move_in_date
            )}
          />

          <InfoItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Move-Out Date"
            value={formatDate(
              tenancy.move_out_date
            )}
          />

          <InfoItem
            icon={<Clock3 className="h-4 w-4" />}
            label="Expired"
            value={
              tenancy.is_expired !== undefined
                ? normalizeBoolean(
                  tenancy.is_expired
                )
                  ? "Yes"
                  : "No"
                : "—"
            }
          />

          <InfoItem
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Currently Active"
            value={
              tenancy.is_currently_active !==
                undefined
                ? normalizeBoolean(
                  tenancy.is_currently_active
                )
                  ? "Yes"
                  : "No"
                : "—"
            }
          />
        </div>
      </DetailsSection>

      {/* RENTAL */}

      <DetailsSection
        icon={<Wallet className="h-5 w-5" />}
        title="Rental & Payment Information"
        description="Financial and payment configuration for this tenancy."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            icon={<Wallet className="h-4 w-4" />}
            label="Late Fee"
            value={formatCurrency(
              tenancy.late_fee
            )}
          />

          <InfoItem
            icon={<CreditCard className="h-4 w-4" />}
            label="Payment Frequency"
            value={getPaymentFrequencyLabel(
              tenancy.payment_frequency
            )}
          />

          <InfoItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Payment Due Day"
            value={
              tenancy.due_day !== null &&
                tenancy.due_day !== undefined &&
                tenancy.due_day !== ""
                ? `Day ${tenancy.due_day}`
                : "—"
            }
          />
        </div>
      </DetailsSection>

      {/* AGREEMENT */}

      {(agreementFile ||
        agreementPublicId) && (
          <DetailsSection
            icon={<FileCheck2 className="h-5 w-5" />}
            title="Tenancy Agreement"
            description="Agreement file and document information associated with this tenancy."
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem
                icon={<FileText className="h-4 w-4" />}
                label="Agreement File"
              >
                {agreementFile ? (
                  <div className="mt-1">
                    <a
                      href={agreementFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                      inline-flex
                      items-center
                      gap-2
                      text-sm
                      font-semibold
                      text-primary-600
                      hover:text-primary-700
                    "
                    >
                      <FileText className="h-4 w-4" />
                      View Agreement
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : (
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    —
                  </p>
                )}
              </InfoItem>

              <InfoItem
                icon={<FileText className="h-4 w-4" />}
                label="Agreement Public ID"
                value={agreementPublicId}
              />
            </div>
          </DetailsSection>
        )}

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

      {/* RECORD INFORMATION */}

      <DetailsSection
        icon={<Clock3 className="h-5 w-5" />}
        title="Record Information"
        description="System timestamps for this tenancy record."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            icon={<FileText className="h-4 w-4" />}
            label="Tenancy ID"
            value={tenancy.id}
          />

          <InfoItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Created At"
            value={formatDateTime(
              tenancy.created_at
            )}
          />

          <InfoItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Last Updated"
            value={formatDateTime(
              tenancy.updated_at
            )}
          />

          <InfoItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Deleted At"
            value={formatDateTime(
              tenancy.deleted_at
            )}
          />
        </div>
      </DetailsSection>

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
            {canToggleStatus && (
              <button
                type="button"
                onClick={handleStatusChange}
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
                  font-semibold
                  text-gray-700
                  transition
                  hover:bg-gray-50
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  sm:w-auto
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
            )}

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