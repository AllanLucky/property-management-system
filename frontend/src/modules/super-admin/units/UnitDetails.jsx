
import {
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Home,
  MapPin,
  User,
  DollarSign,
  Loader2,
  BadgeCheck,
  Building2,
  BedDouble,
  Bath,
  Layers3,
  Hash,
  CalendarDays,
  FileText,
  RefreshCcw,
  AlertTriangle,
  ShieldCheck,
  Wrench,
  Mail,
  Phone,
  CircleCheck,
  CircleX,
  Clock3,
  Activity,
  Pencil,
} from "lucide-react";

import useUnit from "../../../hooks/useUnits";

const UnitDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | UNIT HOOK
  |--------------------------------------------------------------------------
  */

  const {
    getUnit,
    loading: hookLoading,
    error: hookError,
  } = useUnit();

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | SAFE VALUE
  |--------------------------------------------------------------------------
  */

  const safeValue = useCallback(
    (value, fallback = "N/A") => {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return fallback;
      }

      if (typeof value === "object") {
        return (
          value?.label ||
          value?.name ||
          value?.title ||
          value?.value ||
          fallback
        );
      }

      return value;
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | FORMAT DATE
  |--------------------------------------------------------------------------
  */

  const formatDate = useCallback((date) => {
    if (!date) {
      return "Recently";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date);
    }

    return parsedDate.toLocaleString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const currentStatus = useMemo(() => {
    const status = unit?.status;

    if (typeof status === "object") {
      return String(
        status?.value ||
          status?.current ||
          status?.name ||
          "vacant"
      ).toLowerCase();
    }

    return String(
      status || "vacant"
    ).toLowerCase();
  }, [unit]);

  /*
  |--------------------------------------------------------------------------
  | STATUS CONFIG
  |--------------------------------------------------------------------------
  */

  const statusConfig = useMemo(() => {
    switch (currentStatus) {
      case "occupied":
        return {
          label: "Occupied",
          color: "bg-red-50 text-red-700 border-red-200",
          icon: CircleCheck,
          iconColor: "text-red-600",
        };

      case "maintenance":
        return {
          label: "Maintenance",
          color:
            "bg-orange-50 text-orange-700 border-orange-200",
          icon: Wrench,
          iconColor: "text-orange-600",
        };

      case "reserved":
        return {
          label: "Reserved",
          color:
            "bg-purple-50 text-purple-700 border-purple-200",
          icon: Clock3,
          iconColor: "text-purple-600",
        };

      case "inactive":
        return {
          label: "Inactive",
          color: "bg-gray-100 text-gray-700 border-gray-200",
          icon: CircleX,
          iconColor: "text-gray-500",
        };

      case "active":
        return {
          label: "Active",
          color:
            "bg-blue-50 text-blue-700 border-blue-200",
          icon: CircleCheck,
          iconColor: "text-blue-600",
        };

      case "vacant":
      default:
        return {
          label: "Vacant",
          color:
            "bg-green-50 text-green-700 border-green-200",
          icon: Home,
          iconColor: "text-green-600",
        };
    }
  }, [currentStatus]);

  const StatusIcon = statusConfig.icon;

  /*
  |--------------------------------------------------------------------------
  | PRICING
  |--------------------------------------------------------------------------
  */

  const rentAmount = useMemo(() => {
    return (
      unit?.pricing?.rent_amount ??
      unit?.rent_amount ??
      unit?.rent ??
      unit?.rent_price ??
      0
    );
  }, [unit]);

  const depositAmount = useMemo(() => {
    return (
      unit?.pricing?.deposit_amount ??
      unit?.deposit_amount ??
      unit?.deposit ??
      0
    );
  }, [unit]);

  /*
  |--------------------------------------------------------------------------
  | DETAILS
  |--------------------------------------------------------------------------
  */

  const bedrooms = useMemo(() => {
    return (
      unit?.details?.bedrooms ??
      unit?.bedrooms ??
      0
    );
  }, [unit]);

  const bathrooms = useMemo(() => {
    return (
      unit?.details?.bathrooms ??
      unit?.bathrooms ??
      0
    );
  }, [unit]);

  const floor = useMemo(() => {
    return (
      unit?.details?.floor ??
      unit?.floor ??
      "N/A"
    );
  }, [unit]);

  const size = useMemo(() => {
    return (
      unit?.details?.size ??
      unit?.size ??
      unit?.area ??
      0
    );
  }, [unit]);

  /*
  |--------------------------------------------------------------------------
  | UNIT NAME
  |--------------------------------------------------------------------------
  */

  const unitName = useMemo(() => {
    return (
      safeValue(unit?.name, "") ||
      safeValue(unit?.unit_number, "") ||
      `Unit #${unit?.id || id}`
    );
  }, [unit, id, safeValue]);

  /*
  |--------------------------------------------------------------------------
  | UNIT TYPE
  |--------------------------------------------------------------------------
  */

  const unitType = useMemo(() => {
    return safeValue(
      unit?.type ??
        unit?.unit_type ??
        unit?.category,
      "N/A"
    );
  }, [unit, safeValue]);

  /*
  |--------------------------------------------------------------------------
  | PROPERTY
  |--------------------------------------------------------------------------
  */

  const propertyName = useMemo(() => {
    return safeValue(
      unit?.property?.name ??
        unit?.property?.title,
      unit?.property_id
        ? `Property #${unit.property_id}`
        : "No property assigned"
    );
  }, [unit, safeValue]);

  /*
  |--------------------------------------------------------------------------
  | APARTMENT
  |--------------------------------------------------------------------------
  */

  const apartmentName = useMemo(() => {
    return safeValue(
      unit?.apartment?.name ??
        unit?.apartment?.title,
      "No apartment assigned"
    );
  }, [unit, safeValue]);

  /*
  |--------------------------------------------------------------------------
  | TENANT
  |--------------------------------------------------------------------------
  */

  const tenantName = useMemo(() => {
    const tenant = unit?.tenant;

    if (!tenant) {
      return "No tenant assigned";
    }

    return (
      tenant?.name ||
      tenant?.full_name ||
      [
        tenant?.first_name,
        tenant?.last_name,
      ]
        .filter(Boolean)
        .join(" ") ||
      "Tenant assigned"
    );
  }, [unit]);

  /*
  |--------------------------------------------------------------------------
  | FETCH UNIT
  |--------------------------------------------------------------------------
  */

  const fetchUnit = useCallback(
    async (showRefresh = false) => {
      if (!id || typeof getUnit !== "function") {
        return;
      }

      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await getUnit(id);

        /*
         * Support different hook response structures.
         */

        const data =
          response?.data?.data ??
          response?.data ??
          response ??
          null;

        setUnit(data);
      } catch (err) {
        console.error(
          "FAILED TO FETCH UNIT:",
          err
        );

        setUnit(null);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            hookError ||
            "Failed to load unit details."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, getUnit, hookError]
  );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (id) {
      fetchUnit(false);
    }
  }, [id, fetchUnit]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    (loading || hookLoading) &&
    !unit
  ) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>

          <p className="mt-4 text-sm font-medium text-gray-700">
            Loading unit details...
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Please wait while we retrieve the unit information.
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error && !unit) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-bold text-red-800">
                Failed to Load Unit
              </h2>

              <p className="mt-2 text-sm leading-6 text-red-600">
                {error}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    fetchUnit(true)
                  }
                  disabled={refreshing}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw
                    size={16}
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  />

                  {refreshing
                    ? "Retrying..."
                    : "Retry"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/super-admin/units"
                    )
                  }
                  className="inline-flex h-11 items-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Back to Units
                </button>
              </div>
            </div>
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

  if (!unit) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100">
          <Home className="h-10 w-10 text-gray-400" />
        </div>

        <h2 className="mt-6 text-2xl font-bold text-gray-900">
          Unit Not Found
        </h2>

        <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
          The requested unit could not be found or may have
          been removed from the system.
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/super-admin/units")
          }
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Back to Units
        </button>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAINTENANCE
  |--------------------------------------------------------------------------
  */

  const maintenance = {
    total:
      unit?.maintenance?.total ??
      unit?.maintenance_count ??
      0,

    pending:
      unit?.maintenance?.pending ??
      0,

    in_progress:
      unit?.maintenance?.in_progress ??
      0,

    completed:
      unit?.maintenance?.completed ??
      0,
  };

  /*
  |--------------------------------------------------------------------------
  | INSIGHTS
  |--------------------------------------------------------------------------
  */

  const insights = {
    is_vacant:
      unit?.insights?.is_vacant ??
      currentStatus === "vacant",

    is_occupied:
      unit?.insights?.is_occupied ??
      currentStatus === "occupied",

    has_tenant:
      unit?.insights?.has_tenant ??
      Boolean(unit?.tenant),

    has_active_tenancy:
      unit?.insights?.has_active_tenancy ??
      Boolean(unit?.tenancy),
  };

  /*
  |--------------------------------------------------------------------------
  | PROPERTY LOCATION
  |--------------------------------------------------------------------------
  */

  const propertyLocation =
    safeValue(
      unit?.property?.location?.address ??
        unit?.property?.location?.full_address ??
        unit?.property?.location?.city ??
        unit?.property?.address,
      "No location available"
    );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() =>
              navigate("/super-admin/units")
            }
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={17} />
            Back to Units
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {unitName}
            </h1>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusConfig.color}`}
            >
              <StatusIcon
                className={`h-3.5 w-3.5 ${statusConfig.iconColor}`}
              />

              {statusConfig.label}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Complete information and management overview for
            this unit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              fetchUnit(true)
            }
            disabled={refreshing}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/super-admin/units/edit/${unit.id}`
              )
            }
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Pencil size={16} />
            Edit Unit
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SUMMARY CARDS */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Status */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </p>

              <p className="mt-2 text-lg font-bold capitalize text-gray-900">
                {statusConfig.label}
              </p>
            </div>

            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${statusConfig.color}`}
            >
              <StatusIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Rent */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Monthly Rent
              </p>

              <p className="mt-2 text-lg font-bold text-gray-900">
                KES{" "}
                {Number(
                  rentAmount
                ).toLocaleString()}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Property */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Property
              </p>

              <p className="mt-2 truncate text-lg font-bold text-gray-900">
                {propertyName}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
              <Building2 className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Tenant */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Tenant
              </p>

              <p className="mt-2 truncate text-lg font-bold text-gray-900">
                {tenantName}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50">
              <User className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN GRID */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---------------------------------------------------------------- */}
        {/* LEFT */}
        {/* ---------------------------------------------------------------- */}

        <div className="space-y-6 xl:col-span-2">
          {/* UNIT OVERVIEW */}
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                    <Home className="h-7 w-7 text-blue-600" />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Unit
                    </p>

                    <h2 className="mt-1 text-2xl font-bold text-gray-900">
                      {unitName}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Unit #
                      {safeValue(
                        unit?.unit_number,
                        unit?.id || id
                      )}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-400">
                    Unit Type
                  </p>

                  <p className="mt-1 font-semibold capitalize text-gray-900">
                    {unitType}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              {/* Rent */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <DollarSign size={16} />
                  Monthly Rent
                </div>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  KES{" "}
                  {Number(
                    rentAmount
                  ).toLocaleString()}
                </p>
              </div>

              {/* Deposit */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <DollarSign size={16} />
                  Deposit
                </div>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  KES{" "}
                  {Number(
                    depositAmount
                  ).toLocaleString()}
                </p>
              </div>

              {/* Bedrooms */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <BedDouble size={16} />
                  Bedrooms
                </div>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  {bedrooms}
                </p>
              </div>

              {/* Bathrooms */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Bath size={16} />
                  Bathrooms
                </div>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  {bathrooms}
                </p>
              </div>

              {/* Floor */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Layers3 size={16} />
                  Floor
                </div>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  {floor}
                </p>
              </div>

              {/* Size */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Hash size={16} />
                  Size
                </div>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  {Number(
                    size || 0
                  ).toLocaleString()}{" "}
                  <span className="text-sm font-medium text-gray-500">
                    sq ft
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Description
                </h2>

                <p className="text-xs text-gray-500">
                  Unit description and additional information
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
                {safeValue(
                  unit?.description,
                  "No description available for this unit."
                )}
              </p>
            </div>
          </div>

          {/* TENANT DETAILS */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <User className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Tenant Information
                </h2>

                <p className="text-xs text-gray-500">
                  Current tenant assigned to this unit
                </p>
              </div>
            </div>

            {unit?.tenant ? (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {tenantName}
                    </p>

                    {unit?.tenant?.email && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                        <Mail size={15} />
                        {unit.tenant.email}
                      </div>
                    )}

                    {unit?.tenant?.phone && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <Phone size={15} />
                        {unit.tenant.phone}
                      </div>
                    )}
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                <User className="mx-auto h-8 w-8 text-gray-300" />

                <p className="mt-3 text-sm font-semibold text-gray-700">
                  No tenant assigned
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  This unit currently has no assigned tenant.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* RIGHT */}
        {/* ---------------------------------------------------------------- */}

        <div className="space-y-6">
          {/* PROPERTY */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Property
                </h2>

                <p className="text-xs text-gray-500">
                  Parent property
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Property Name
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {propertyName}
                </p>
              </div>

              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

                <span>{propertyLocation}</span>
              </div>
            </div>
          </div>

          {/* APARTMENT */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <Building2 className="h-5 w-5 text-indigo-600" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Apartment
                </h2>

                <p className="text-xs text-gray-500">
                  Building assignment
                </p>
              </div>
            </div>

            <p className="font-bold text-gray-900">
              {apartmentName}
            </p>

            {unit?.apartment?.description && (
              <p className="mt-3 text-sm leading-6 text-gray-500">
                {unit.apartment.description}
              </p>
            )}
          </div>

          {/* MAINTENANCE */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Maintenance
                </h2>

                <p className="text-xs text-gray-500">
                  Maintenance activity
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-500">
                  Total
                </span>

                <span className="font-bold text-gray-900">
                  {maintenance.total}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">
                <span className="text-sm text-orange-700">
                  Pending
                </span>

                <span className="font-bold text-orange-700">
                  {maintenance.pending}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
                <span className="text-sm text-blue-700">
                  In Progress
                </span>

                <span className="font-bold text-blue-700">
                  {maintenance.in_progress}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
                <span className="text-sm text-green-700">
                  Completed
                </span>

                <span className="font-bold text-green-700">
                  {maintenance.completed}
                </span>
              </div>
            </div>
          </div>

          {/* INSIGHTS */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Unit Insights
                </h2>

                <p className="text-xs text-gray-500">
                  Current unit state
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  label: "Vacant",
                  value: insights.is_vacant,
                },
                {
                  label: "Occupied",
                  value: insights.is_occupied,
                },
                {
                  label: "Has Tenant",
                  value: insights.has_tenant,
                },
                {
                  label: "Active Tenancy",
                  value:
                    insights.has_active_tenancy,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                >
                  <span className="text-sm text-gray-500">
                    {item.label}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                      item.value
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {item.value ? (
                      <CircleCheck
                        size={15}
                      />
                    ) : (
                      <CircleX
                        size={15}
                      />
                    )}

                    {item.value
                      ? "Yes"
                      : "No"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SYSTEM INFORMATION */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <Activity className="h-5 w-5 text-gray-600" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  System Information
                </h2>

                <p className="text-xs text-gray-500">
                  Unit record information
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">
                  Unit ID
                </span>

                <span className="font-semibold text-gray-900">
                  #{unit.id}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">
                  Created
                </span>

                <span className="text-right font-medium text-gray-700">
                  {formatDate(
                    unit.created_at
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">
                  Last Updated
                </span>

                <span className="text-right font-medium text-gray-700">
                  {formatDate(
                    unit.updated_at
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* FOOTER STATUS */}
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 text-white shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <BadgeCheck className="h-6 w-6" />
              </div>

              <div>
                <h3 className="font-bold">
                  Unit Record Active
                </h3>

                <p className="mt-1 text-sm leading-6 text-blue-100">
                  This unit is successfully tracked and
                  managed in the estate management system.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-blue-100">
              <CalendarDays size={14} />

              Last updated{" "}
              {formatDate(
                unit.updated_at
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitDetails;

