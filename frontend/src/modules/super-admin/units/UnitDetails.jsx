import {
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

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
  Ruler,
  CalendarDays,
  FileText,
  RefreshCcw,
  ShieldCheck,
  Wrench,
  Mail,
  Phone,
  CircleCheck,
  CircleX,
  Clock3,
  Activity,
  Pencil,
  Car,
  Wifi,
  Sofa,
  Wind,
  Zap,
  DoorOpen,
  Receipt,
  CalendarCheck,
  AlertTriangle,
  Banknote,
  ClipboardList,
} from "lucide-react";

import useUnit from "../../../hooks/useUnits";

/*
|--------------------------------------------------------------------------
| UNIT DETAILS
|--------------------------------------------------------------------------
*/

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
          value?.label ??
          value?.name ??
          value?.title ??
          value?.value ??
          fallback
        );
      }

      return value;
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | NUMBER FORMAT
  |--------------------------------------------------------------------------
  */

  const formatNumber = useCallback(
    (value, fallback = "0") => {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return fallback;
      }

      const number = Number(value);

      if (Number.isNaN(number)) {
        return String(value);
      }

      return number.toLocaleString("en-KE");
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | CURRENCY
  |--------------------------------------------------------------------------
  */

  const formatCurrency = useCallback(
    (
      value,
      currency = "KES"
    ) => {
      const number = Number(value ?? 0);

      if (Number.isNaN(number)) {
        return `${currency} 0`;
      }

      return `${currency} ${number.toLocaleString(
        "en-KE",
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }
      )}`;
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | DATE FORMAT
  |--------------------------------------------------------------------------
  */

  const formatDate = useCallback(
    (date, fallback = "Not available") => {
      if (!date) {
        return fallback;
      }

      const parsedDate =
        new Date(date);

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        return String(date);
      }

      return parsedDate.toLocaleString(
        "en-KE",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | DATE ONLY
  |--------------------------------------------------------------------------
  */

  const formatDateOnly = useCallback(
    (date, fallback = "Not available") => {
      if (!date) {
        return fallback;
      }

      const parsedDate =
        new Date(date);

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        return String(date);
      }

      return parsedDate.toLocaleDateString(
        "en-KE",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | CURRENT STATUS
  |--------------------------------------------------------------------------
  */

  const currentStatus = useMemo(() => {
    const status = unit?.status;

    if (
      status &&
      typeof status === "object"
    ) {
      return String(
        status?.value ??
          status?.current ??
          status?.name ??
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
          color:
            "bg-red-50 text-red-700 border-red-200",
          icon: CircleCheck,
          iconColor:
            "text-red-600",
        };

      case "maintenance":
        return {
          label: "Maintenance",
          color:
            "bg-orange-50 text-orange-700 border-orange-200",
          icon: Wrench,
          iconColor:
            "text-orange-600",
        };

      case "reserved":
        return {
          label: "Reserved",
          color:
            "bg-purple-50 text-purple-700 border-purple-200",
          icon: Clock3,
          iconColor:
            "text-purple-600",
        };

      case "inactive":
        return {
          label: "Inactive",
          color:
            "bg-gray-100 text-gray-700 border-gray-200",
          icon: CircleX,
          iconColor:
            "text-gray-500",
        };

      case "active":
        return {
          label: "Active",
          color:
            "bg-blue-50 text-blue-700 border-blue-200",
          icon: CircleCheck,
          iconColor:
            "text-blue-600",
        };

      case "vacant":
      default:
        return {
          label:
            unit?.status?.label ||
            "Vacant",
          color:
            "bg-green-50 text-green-700 border-green-200",
          icon: Home,
          iconColor:
            "text-green-600",
        };
    }
  }, [
    currentStatus,
    unit,
  ]);

  const StatusIcon =
    statusConfig.icon;

  /*
  |--------------------------------------------------------------------------
  | UNIT NAME
  |--------------------------------------------------------------------------
  */

  const unitName = useMemo(() => {
    return (
      safeValue(
        unit?.unit_name,
        ""
      ) ||
      safeValue(
        unit?.full_unit_name,
        ""
      ) ||
      safeValue(
        unit?.name,
        ""
      ) ||
      safeValue(
        unit?.unit_number,
        ""
      ) ||
      `Unit #${unit?.id || id}`
    );
  }, [
    unit,
    id,
    safeValue,
  ]);

  /*
  |--------------------------------------------------------------------------
  | UNIT NUMBER
  |--------------------------------------------------------------------------
  */

  const unitNumber = useMemo(() => {
    return safeValue(
      unit?.unit_number,
      unit?.id || id
    );
  }, [
    unit,
    id,
    safeValue,
  ]);

  /*
  |--------------------------------------------------------------------------
  | UNIT TYPE
  |--------------------------------------------------------------------------
  */

  const unitType = useMemo(() => {
    const type =
      unit?.details?.type ??
      unit?.type ??
      unit?.unit_type ??
      unit?.category;

    if (!type) {
      return "N/A";
    }

    return String(type)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }, [unit]);

  /*
  |--------------------------------------------------------------------------
  | PRICING
  |--------------------------------------------------------------------------
  */

  const rentAmount = useMemo(() => {
    return (
      unit?.pricing?.price ??
      unit?.pricing?.rent ??
      unit?.rent ??
      unit?.rent_amount ??
      unit?.rent_price ??
      0
    );
  }, [unit]);

  const depositAmount = useMemo(() => {
    return (
      unit?.pricing?.deposit ??
      unit?.deposit ??
      unit?.deposit_amount ??
      0
    );
  }, [unit]);

  const serviceCharge = useMemo(() => {
    return (
      unit?.pricing?.service_charge ??
      unit?.service_charge ??
      0
    );
  }, [unit]);

  const currency = useMemo(() => {
    return (
      unit?.pricing?.currency ||
      "KES"
    );
  }, [unit]);

  /*
  |--------------------------------------------------------------------------
  | UNIT DETAILS
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

  const toilets = useMemo(() => {
    return (
      unit?.details?.toilets ??
      unit?.toilets ??
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

  const sizeUnit = useMemo(() => {
    return (
      unit?.details?.size_unit ||
      unit?.size_unit ||
      "sqm"
    );
  }, [unit]);

  /*
  |--------------------------------------------------------------------------
  | PROPERTY
  |--------------------------------------------------------------------------
  */

  const propertyName = useMemo(() => {
    return safeValue(
      unit?.property?.title ??
        unit?.property?.name,
      unit?.property_id
        ? `Property #${unit.property_id}`
        : "No property assigned"
    );
  }, [
    unit,
    safeValue,
  ]);

  const propertyCode = useMemo(() => {
    return safeValue(
      unit?.property?.property_code,
      "N/A"
    );
  }, [
    unit,
    safeValue,
  ]);

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
  }, [
    unit,
    safeValue,
  ]);

  const apartmentBlock = useMemo(() => {
    return safeValue(
      unit?.apartment?.block,
      "N/A"
    );
  }, [
    unit,
    safeValue,
  ]);

  /*
  |--------------------------------------------------------------------------
  | TENANT
  |--------------------------------------------------------------------------
  */

  const tenantName = useMemo(() => {
    const tenant =
      unit?.tenant;

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
  | TENANCY STATISTICS
  |--------------------------------------------------------------------------
  */

  const tenancyStatistics =
    useMemo(() => {
      return {
        total:
          unit?.tenancy_statistics
            ?.total ?? 0,

        active:
          unit?.tenancy_statistics
            ?.active ?? 0,

        pending:
          unit?.tenancy_statistics
            ?.pending ?? 0,

        expired:
          unit?.tenancy_statistics
            ?.expired ?? 0,

        terminated:
          unit?.tenancy_statistics
            ?.terminated ?? 0,

        cancelled:
          unit?.tenancy_statistics
            ?.cancelled ?? 0,
      };
    }, [unit]);

  /*
  |--------------------------------------------------------------------------
  | MAINTENANCE
  |--------------------------------------------------------------------------
  */

  const maintenance =
    useMemo(() => {
      return {
        total:
          unit?.maintenance?.total ??
          0,

        open:
          unit?.maintenance?.open ??
          0,

        pending:
          unit?.maintenance?.pending ??
          0,

        assigned:
          unit?.maintenance?.assigned ??
          0,

        in_progress:
          unit?.maintenance
            ?.in_progress ?? 0,

        on_hold:
          unit?.maintenance
            ?.on_hold ?? 0,

        completed:
          unit?.maintenance
            ?.completed ?? 0,

        cancelled:
          unit?.maintenance
            ?.cancelled ?? 0,

        rejected:
          unit?.maintenance
            ?.rejected ?? 0,

        estimated_cost:
          unit?.maintenance
            ?.estimated_cost ?? 0,

        actual_cost:
          unit?.maintenance
            ?.actual_cost ?? 0,
      };
    }, [unit]);

  /*
  |--------------------------------------------------------------------------
  | MAINTENANCE SUMMARY
  |--------------------------------------------------------------------------
  */

  const maintenanceSummary =
    useMemo(() => {
      return {
        has_maintenance:
          unit?.maintenance_summary
            ?.has_maintenance ??
          false,

        has_open_maintenance:
          unit?.maintenance_summary
            ?.has_open_maintenance ??
          false,

        needs_attention:
          unit?.maintenance_summary
            ?.needs_attention ??
          false,

        completion_rate:
          unit?.maintenance_summary
            ?.completion_rate ??
          0,
      };
    }, [unit]);

  /*
  |--------------------------------------------------------------------------
  | INSIGHTS
  |--------------------------------------------------------------------------
  */

  const insights = useMemo(() => {
    return {
      has_tenant:
        unit?.insights?.has_tenant ??
        Boolean(unit?.tenant),

      has_active_tenancy:
        unit?.insights
          ?.has_active_tenancy ??
        Boolean(unit?.tenancy),

      is_vacant:
        unit?.insights?.is_vacant ??
        currentStatus ===
          "vacant",

      is_occupied:
        unit?.insights?.is_occupied ??
        currentStatus ===
          "occupied",

      is_reserved:
        unit?.insights?.is_reserved ??
        currentStatus ===
          "reserved",

      needs_maintenance:
        unit?.insights
          ?.needs_maintenance ??
        false,

      has_open_maintenance:
        unit?.insights
          ?.has_open_maintenance ??
        false,

      maintenance_requests:
        unit?.insights
          ?.maintenance_requests ??
        0,

      has_rental_income:
        unit?.insights
          ?.has_rental_income ??
        false,
    };
  }, [
    unit,
    currentStatus,
  ]);

  /*
  |--------------------------------------------------------------------------
  | AVAILABILITY
  |--------------------------------------------------------------------------
  */

  const availability =
    useMemo(() => {
      return {
        available_from:
          unit?.availability
            ?.available_from ??
          null,

        status:
          unit?.availability
            ?.status ??
          currentStatus,

        is_available:
          unit?.availability
            ?.is_available ??
          false,

        is_vacant:
          unit?.availability
            ?.is_vacant ??
          false,

        is_occupied:
          unit?.availability
            ?.is_occupied ??
          false,

        is_reserved:
          unit?.availability
            ?.is_reserved ??
          false,
      };
    }, [
      unit,
      currentStatus,
    ]);

  /*
  |--------------------------------------------------------------------------
  | FEATURES
  |--------------------------------------------------------------------------
  */

  const features = useMemo(() => {
    return {
      has_balcony:
        unit?.features
          ?.has_balcony ?? false,

      has_wifi:
        unit?.features
          ?.has_wifi ?? false,

      has_furnished:
        unit?.features
          ?.has_furnished ?? false,

      has_air_conditioning:
        unit?.features
          ?.has_air_conditioning ??
        false,

      has_parking:
        unit?.features
          ?.has_parking ?? false,

      has_security:
        unit?.features
          ?.has_security ?? false,

      has_backup_generator:
        unit?.features
          ?.has_backup_generator ??
        false,
    };
  }, [unit]);

  /*
  |--------------------------------------------------------------------------
  | MEDIA
  |--------------------------------------------------------------------------
  */

  const thumbnailUrl = useMemo(() => {
    const thumbnail =
      unit?.media
        ?.thumbnail_url ??
      unit?.media?.thumbnail;

    if (!thumbnail) {
      return null;
    }

    if (
      thumbnail.startsWith(
        "http://"
      ) ||
      thumbnail.startsWith(
        "https://"
      )
    ) {
      return thumbnail;
    }

    return thumbnail;
  }, [unit]);

  /*
  |--------------------------------------------------------------------------
  | PROPERTY LOCATION
  |--------------------------------------------------------------------------
  */

  const propertyLocation =
    useMemo(() => {
      return safeValue(
        unit?.property?.location
          ?.address ??
          unit?.property?.location
            ?.full_address ??
          unit?.property?.location
            ?.city ??
          unit?.property?.address,
        "No location available"
      );
    }, [
      unit,
      safeValue,
    ]);

  /*
  |--------------------------------------------------------------------------
  | FETCH UNIT
  |--------------------------------------------------------------------------
  */

  const fetchUnit = useCallback(
    async (
      showRefresh = false
    ) => {
      if (
        !id ||
        typeof getUnit !==
          "function"
      ) {
        return;
      }

      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response =
          await getUnit(id);

        /*
        |--------------------------------------------------------------------------
        | Support:
        |
        | {
        |   status: true,
        |   data: {...}
        | }
        |
        | OR:
        |
        | {
        |   data: {
        |     status: true,
        |     data: {...}
        |   }
        | }
        |--------------------------------------------------------------------------
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
          err?.errors?.message ||
            err?.response?.data
              ?.message ||
            err?.message ||
            hookError ||
            "Failed to load unit details."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      id,
      getUnit,
      hookError,
    ]
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
  }, [
    id,
    fetchUnit,
  ]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    (loading ||
      hookLoading) &&
    !unit
  ) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>

          <p className="mt-4 text-sm font-semibold text-gray-800">
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

  if (
    error &&
    !unit
  ) {
    return (
      <div className="p-6">
        <div className="mx-auto flex max-w-2xl items-start gap-4 rounded-3xl border border-red-200 bg-red-50 p-6">
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
                disabled={
                  refreshing
                }
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
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (!unit) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <Home className="h-7 w-7 text-gray-400" />
          </div>

          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Unit Not Found
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
            The requested unit could not
            be found or may have been
            removed from the system.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/super-admin/units"
              )
            }
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Units
          </button>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FEATURE LIST
  |--------------------------------------------------------------------------
  */

  const featureList = [
    {
      label: "Balcony",
      value: features.has_balcony,
      icon: DoorOpen,
    },
    {
      label: "Wi-Fi",
      value: features.has_wifi,
      icon: Wifi,
    },
    {
      label: "Furnished",
      value: features.has_furnished,
      icon: Sofa,
    },
    {
      label: "Air Conditioning",
      value:
        features.has_air_conditioning,
      icon: Wind,
    },
    {
      label: "Parking",
      value: features.has_parking,
      icon: Car,
    },
    {
      label: "Security",
      value: features.has_security,
      icon: ShieldCheck,
    },
    {
      label: "Backup Generator",
      value:
        features.has_backup_generator,
      icon: Zap,
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ---------------------------------------------------------------- */}
      {/* HEADER */}
      {/* ---------------------------------------------------------------- */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() =>
              navigate(
                "/super-admin/units"
              )
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
            Complete information and
            management overview for this
            unit.
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

      {/* ---------------------------------------------------------------- */}
      {/* UNIT IMAGE */}
      {/* ---------------------------------------------------------------- */}

      {thumbnailUrl && (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="relative h-64 w-full overflow-hidden bg-gray-100 md:h-80">
            <img
              src={thumbnailUrl}
              alt={unitName}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <p className="text-sm font-medium text-white/80">
                {propertyName}
              </p>

              <h2 className="mt-1 text-2xl font-bold text-white">
                {unitName}
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* SUMMARY CARDS */}
      {/* ---------------------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {/* Status */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </p>

              <p className="mt-2 text-lg font-bold text-gray-900">
                {statusConfig.label}
              </p>
            </div>

            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${statusConfig.color}`}
            >
              <StatusIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Rent */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Monthly Rent
              </p>

              <p className="mt-2 text-lg font-bold text-gray-900">
                {formatCurrency(
                  rentAmount,
                  currency
                )}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
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

        {/* Apartment */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Apartment
              </p>

              <p className="mt-2 truncate text-lg font-bold text-gray-900">
                {apartmentName}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50">
              <Building2 className="h-5 w-5 text-purple-600" />
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

      {/* ---------------------------------------------------------------- */}
      {/* MAIN GRID */}
      {/* ---------------------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ============================================================ */}
        {/* LEFT */}
        {/* ============================================================ */}

        <div className="space-y-6 xl:col-span-2">
          {/* ---------------------------------------------------------- */}
          {/* UNIT OVERVIEW */}
          {/* ---------------------------------------------------------- */}

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
                      Unit #{unitNumber}
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
                  {formatCurrency(
                    rentAmount,
                    currency
                  )}
                </p>
              </div>

              {/* Deposit */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Banknote size={16} />
                  Security Deposit
                </div>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  {formatCurrency(
                    depositAmount,
                    currency
                  )}
                </p>
              </div>

              {/* Service Charge */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Receipt size={16} />
                  Service Charge
                </div>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  {formatCurrency(
                    serviceCharge,
                    currency
                  )}
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

              {/* Toilets */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <DoorOpen size={16} />
                  Toilets
                </div>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  {toilets}
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
                  <Ruler size={16} />
                  Unit Size
                </div>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  {formatNumber(size)}{" "}
                  <span className="text-sm font-medium uppercase text-gray-500">
                    {sizeUnit}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* DESCRIPTION */}
          {/* ---------------------------------------------------------- */}

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

          {/* ---------------------------------------------------------- */}
          {/* FEATURES */}
          {/* ---------------------------------------------------------- */}

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Unit Features
                </h2>

                <p className="text-xs text-gray-500">
                  Amenities and features available in this unit
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featureList.map(
                (feature) => {
                  const Icon =
                    feature.icon;

                  return (
                    <div
                      key={
                        feature.label
                      }
                      className={`flex items-center justify-between rounded-2xl border px-4 py-4 ${
                        feature.value
                          ? "border-green-100 bg-green-50"
                          : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`h-5 w-5 ${
                            feature.value
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        />

                        <span
                          className={`text-sm font-medium ${
                            feature.value
                              ? "text-green-800"
                              : "text-gray-500"
                          }`}
                        >
                          {
                            feature.label
                          }
                        </span>
                      </div>

                      {feature.value ? (
                        <CircleCheck className="h-5 w-5 text-green-600" />
                      ) : (
                        <CircleX className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* TENANT */}
          {/* ---------------------------------------------------------- */}

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

                    {unit
                      ?.tenant
                      ?.email && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                        <Mail size={15} />
                        {
                          unit
                            .tenant
                            .email
                        }
                      </div>
                    )}

                    {unit
                      ?.tenant
                      ?.phone && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <Phone size={15} />
                        {
                          unit
                            .tenant
                            .phone
                        }
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
                  This unit currently has
                  no assigned tenant.
                </p>
              </div>
            )}
          </div>

          {/* ---------------------------------------------------------- */}
          {/* TENANCY STATISTICS */}
          {/* ---------------------------------------------------------- */}

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                <ClipboardList className="h-5 w-5 text-purple-600" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Tenancy Statistics
                </h2>

                <p className="text-xs text-gray-500">
                  Historical and current tenancy records
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {[
                {
                  label: "Total",
                  value:
                    tenancyStatistics.total,
                },
                {
                  label: "Active",
                  value:
                    tenancyStatistics.active,
                },
                {
                  label: "Pending",
                  value:
                    tenancyStatistics.pending,
                },
                {
                  label: "Expired",
                  value:
                    tenancyStatistics.expired,
                },
                {
                  label: "Terminated",
                  value:
                    tenancyStatistics.terminated,
                },
                {
                  label: "Cancelled",
                  value:
                    tenancyStatistics.cancelled,
                },
              ].map((item) => (
                <div
                  key={
                    item.label
                  }
                  className="rounded-2xl bg-gray-50 p-4"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {item.label}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT */}
        {/* ============================================================ */}

        <div className="space-y-6">
          {/* ---------------------------------------------------------- */}
          {/* PROPERTY */}
          {/* ---------------------------------------------------------- */}

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

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Property Code
                </p>

                <p className="mt-1 font-semibold text-gray-700">
                  {propertyCode}
                </p>
              </div>

              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

                <span>
                  {propertyLocation}
                </span>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* APARTMENT */}
          {/* ---------------------------------------------------------- */}

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

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Apartment Name
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {apartmentName}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-500">
                  Block
                </span>

                <span className="font-semibold text-gray-900">
                  {apartmentBlock}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-500">
                  Floor
                </span>

                <span className="font-semibold text-gray-900">
                  {floor}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-500">
                  Total Floors
                </span>

                <span className="font-semibold text-gray-900">
                  {formatNumber(
                    unit
                      ?.apartment
                      ?.total_floors
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-500">
                  Total Units
                </span>

                <span className="font-semibold text-gray-900">
                  {formatNumber(
                    unit
                      ?.apartment
                      ?.total_units
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* AVAILABILITY */}
          {/* ---------------------------------------------------------- */}

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <CalendarCheck className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Availability
                </h2>

                <p className="text-xs text-gray-500">
                  Current availability status
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-500">
                  Available
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                    availability.is_available
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {availability.is_available ? (
                    <CircleCheck
                      size={15}
                    />
                  ) : (
                    <CircleX
                      size={15}
                    />
                  )}

                  {availability.is_available
                    ? "Yes"
                    : "No"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-500">
                  Available From
                </span>

                <span className="text-right text-sm font-semibold text-gray-900">
                  {formatDateOnly(
                    availability.available_from
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-500">
                  Status
                </span>

                <span className="font-semibold capitalize text-gray-900">
                  {safeValue(
                    availability.status,
                    "N/A"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* MAINTENANCE */}
          {/* ---------------------------------------------------------- */}

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
              {[
                {
                  label: "Total",
                  value:
                    maintenance.total,
                  className:
                    "bg-gray-50 text-gray-900",
                },
                {
                  label: "Open",
                  value:
                    maintenance.open,
                  className:
                    "bg-red-50 text-red-700",
                },
                {
                  label: "Pending",
                  value:
                    maintenance.pending,
                  className:
                    "bg-orange-50 text-orange-700",
                },
                {
                  label: "Assigned",
                  value:
                    maintenance.assigned,
                  className:
                    "bg-purple-50 text-purple-700",
                },
                {
                  label: "In Progress",
                  value:
                    maintenance.in_progress,
                  className:
                    "bg-blue-50 text-blue-700",
                },
                {
                  label: "On Hold",
                  value:
                    maintenance.on_hold,
                  className:
                    "bg-yellow-50 text-yellow-700",
                },
                {
                  label: "Completed",
                  value:
                    maintenance.completed,
                  className:
                    "bg-green-50 text-green-700",
                },
                {
                  label: "Cancelled",
                  value:
                    maintenance.cancelled,
                  className:
                    "bg-gray-100 text-gray-500",
                },
              ].map((item) => (
                <div
                  key={
                    item.label
                  }
                  className={`flex items-center justify-between rounded-xl px-4 py-3 ${item.className}`}
                >
                  <span className="text-sm">
                    {item.label}
                  </span>

                  <span className="font-bold">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Completion Rate
                </span>

                <span className="font-bold text-gray-900">
                  {
                    maintenanceSummary.completion_rate
                  }
                  %
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        Number(
                          maintenanceSummary.completion_rate
                        )
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            {(maintenance.estimated_cost >
              0 ||
              maintenance.actual_cost >
                0) && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-400">
                    Estimated Cost
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {formatCurrency(
                      maintenance.estimated_cost,
                      currency
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-400">
                    Actual Cost
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {formatCurrency(
                      maintenance.actual_cost,
                      currency
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ---------------------------------------------------------- */}
          {/* MAINTENANCE SUMMARY */}
          {/* ---------------------------------------------------------- */}

          <div
            className={`rounded-3xl border p-6 shadow-sm ${
              maintenanceSummary.needs_attention
                ? "border-orange-200 bg-orange-50"
                : "border-gray-100 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  maintenanceSummary.needs_attention
                    ? "bg-orange-100"
                    : "bg-green-50"
                }`}
              >
                {maintenanceSummary.needs_attention ? (
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                )}
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  {maintenanceSummary.needs_attention
                    ? "Maintenance Attention Required"
                    : "Maintenance Status Good"}
                </h3>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  {maintenanceSummary.has_open_maintenance
                    ? "This unit currently has open maintenance activity."
                    : "There are currently no open maintenance issues for this unit."}
                </p>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* INSIGHTS */}
          {/* ---------------------------------------------------------- */}

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
                  value:
                    insights.is_vacant,
                },
                {
                  label: "Occupied",
                  value:
                    insights.is_occupied,
                },
                {
                  label: "Reserved",
                  value:
                    insights.is_reserved,
                },
                {
                  label: "Has Tenant",
                  value:
                    insights.has_tenant,
                },
                {
                  label: "Active Tenancy",
                  value:
                    insights.has_active_tenancy,
                },
                {
                  label: "Rental Income",
                  value:
                    insights.has_rental_income,
                },
              ].map((item) => (
                <div
                  key={
                    item.label
                  }
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

              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-500">
                  Maintenance Requests
                </span>

                <span className="font-bold text-gray-900">
                  {
                    insights.maintenance_requests
                  }
                </span>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* SYSTEM INFORMATION */}
          {/* ---------------------------------------------------------- */}

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
                  Unit Number
                </span>

                <span className="font-semibold text-gray-900">
                  {unitNumber}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500">
                  Slug
                </span>

                <span className="max-w-[180px] truncate text-right font-medium text-gray-700">
                  {safeValue(
                    unit.slug
                  )}
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

          {/* ---------------------------------------------------------- */}
          {/* FOOTER STATUS */}
          {/* ---------------------------------------------------------- */}

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
                  This unit is successfully
                  tracked and managed in the
                  estate management system.
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