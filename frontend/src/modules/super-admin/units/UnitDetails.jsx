import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/axios";

import {
  ArrowLeft,
  Home,
  MapPin,
  User,
  DollarSign,
  Settings,
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
} from "lucide-react";

const UnitDetails = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [unit, setUnit] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | SAFE VALUE
  |--------------------------------------------------------------------------
  */
  const safeValue = (value, fallback = "N/A") => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return fallback;
    }

    if (typeof value === "object") {
      return fallback;
    }

    return value;
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */
  const currentStatus = useMemo(() => {
    return (
      unit?.status?.current ||
      unit?.status ||
      "vacant"
    );
  }, [unit]);

  /*
  |--------------------------------------------------------------------------
  | STATUS STYLE
  |--------------------------------------------------------------------------
  */
  const statusStyle = useMemo(() => {
    switch (currentStatus) {
      case "occupied":
        return "bg-red-100 text-red-700";

      case "maintenance":
        return "bg-yellow-100 text-yellow-700";

      case "reserved":
        return "bg-purple-100 text-purple-700";

      case "inactive":
        return "bg-gray-200 text-gray-700";

      default:
        return "bg-green-100 text-green-700";
    }
  }, [currentStatus]);

  /*
  |--------------------------------------------------------------------------
  | PRICING
  |--------------------------------------------------------------------------
  */
  const rentAmount =
    unit?.pricing?.rent_amount ||
    unit?.rent_amount ||
    0;

  const depositAmount =
    unit?.pricing?.deposit_amount ||
    unit?.deposit_amount ||
    0;

  /*
  |--------------------------------------------------------------------------
  | DETAILS
  |--------------------------------------------------------------------------
  */
  const bedrooms =
    unit?.details?.bedrooms ??
    unit?.bedrooms ??
    0;

  const bathrooms =
    unit?.details?.bathrooms ??
    unit?.bathrooms ??
    0;

  const floor =
    unit?.details?.floor ??
    unit?.floor ??
    "N/A";

  const size =
    unit?.details?.size ??
    unit?.size ??
    0;

  /*
  |--------------------------------------------------------------------------
  | FETCH UNIT
  |--------------------------------------------------------------------------
  */
  const fetchUnit = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get(
          `/units/${id}`
        );

        const data =
          response?.data?.data ||
          response?.data ||
          null;

        console.log(
          "UNIT DETAILS:",
          data
        );

        setUnit(data);
      } catch (err) {
        console.error(
          "FAILED TO FETCH UNIT",
          err
        );

        setUnit(null);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load unit details."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (id) {
      fetchUnit();
    }
  }, [id, fetchUnit]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />

        <p className="mt-4 text-sm text-gray-500">
          Loading unit details...
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */
  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6">

          <div className="flex items-start gap-3">

            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="text-red-600" />
            </div>

            <div className="flex-1">

              <h2 className="text-lg font-bold text-red-700">
                Failed to Load Unit
              </h2>

              <p className="text-red-600 mt-2">
                {error}
              </p>

              <div className="flex gap-3 mt-5">

                <button
                  onClick={() =>
                    fetchUnit(true)
                  }
                  className="h-11 px-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 transition"
                >
                  <RefreshCcw
                    size={16}
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Retry
                </button>

                <button
                  onClick={() =>
                    navigate(
                      "/super-admin/units"
                    )
                  }
                  className="h-11 px-5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-100 transition"
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
      <div className="text-center py-32">

        <div className="w-20 h-20 mx-auto rounded-3xl bg-gray-100 flex items-center justify-center">
          <Home className="w-10 h-10 text-gray-400" />
        </div>

        <h2 className="mt-6 text-2xl font-bold text-gray-900">
          Unit Not Found
        </h2>

        <p className="mt-2 text-gray-500">
          The requested unit does not exist.
        </p>

        <button
          onClick={() =>
            navigate("/super-admin/units")
          }
          className="mt-6 h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white transition"
        >
          Back to Units
        </button>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div>

            <button
              onClick={() =>
                navigate(
                  "/super-admin/units"
                )
              }
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={18} />
              Back
            </button>

            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Unit Details
            </h1>

            <p className="text-gray-500 mt-2">
              Complete information about this property unit.
            </p>

          </div>

          <button
            onClick={() =>
              fetchUnit(true)
            }
            className="h-12 px-5 rounded-2xl bg-white border border-gray-200 hover:bg-gray-100 flex items-center gap-2 transition"
          >
            <RefreshCcw
              size={18}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">

            {/* UNIT CARD */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

              <div className="border-b border-gray-100 p-6">

                <div className="flex items-center gap-4">

                  <div className="w-16 h-16 rounded-3xl bg-blue-100 flex items-center justify-center">
                    <Home className="text-blue-600" />
                  </div>

                  <div>

                    <h2 className="text-2xl font-bold text-gray-900">
                      {safeValue(
                        unit?.name,
                        "Unnamed Unit"
                      )}
                    </h2>

                    <p className="text-gray-500 mt-1">
                      Unit #
                      {safeValue(
                        unit?.unit_number
                      )}
                    </p>

                  </div>

                </div>

              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* TYPE */}
                <div className="bg-gray-50 rounded-2xl p-5">

                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Home size={16} />
                    Unit Type
                  </div>

                  <h3 className="mt-2 text-lg font-bold text-gray-900 capitalize">
                    {safeValue(
                      unit?.type
                    )}
                  </h3>

                </div>

                {/* STATUS */}
                <div className="bg-gray-50 rounded-2xl p-5">

                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Settings size={16} />
                    Status
                  </div>

                  <div className="mt-3">

                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${statusStyle}`}
                    >
                      {currentStatus}
                    </span>

                  </div>

                </div>

                {/* RENT */}
                <div className="bg-gray-50 rounded-2xl p-5">

                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <DollarSign size={16} />
                    Rent Amount
                  </div>

                  <h3 className="mt-2 text-lg font-bold text-gray-900">
                    KES{" "}
                    {Number(
                      rentAmount
                    ).toLocaleString()}
                  </h3>

                </div>

                {/* DEPOSIT */}
                <div className="bg-gray-50 rounded-2xl p-5">

                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <DollarSign size={16} />
                    Deposit Amount
                  </div>

                  <h3 className="mt-2 text-lg font-bold text-gray-900">
                    KES{" "}
                    {Number(
                      depositAmount
                    ).toLocaleString()}
                  </h3>

                </div>

                {/* BEDROOMS */}
                <div className="bg-gray-50 rounded-2xl p-5">

                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <BedDouble size={16} />
                    Bedrooms
                  </div>

                  <h3 className="mt-2 text-lg font-bold text-gray-900">
                    {bedrooms}
                  </h3>

                </div>

                {/* BATHROOMS */}
                <div className="bg-gray-50 rounded-2xl p-5">

                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Bath size={16} />
                    Bathrooms
                  </div>

                  <h3 className="mt-2 text-lg font-bold text-gray-900">
                    {bathrooms}
                  </h3>

                </div>

                {/* FLOOR */}
                <div className="bg-gray-50 rounded-2xl p-5">

                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Layers3 size={16} />
                    Floor
                  </div>

                  <h3 className="mt-2 text-lg font-bold text-gray-900">
                    {floor}
                  </h3>

                </div>

                {/* SIZE */}
                <div className="bg-gray-50 rounded-2xl p-5">

                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Hash size={16} />
                    Size
                  </div>

                  <h3 className="mt-2 text-lg font-bold text-gray-900">
                    {size} sq ft
                  </h3>

                </div>

              </div>

            </div>

            {/* DESCRIPTION */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">

              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-blue-600" />

                <h2 className="text-xl font-bold text-gray-900">
                  Description
                </h2>
              </div>

              <p className="text-gray-600 leading-7">
                {safeValue(
                  unit?.description,
                  "No description available for this unit."
                )}
              </p>

            </div>

          </div>

          {/* RIGHT */}
          <div className="space-y-6">

            {/* PROPERTY */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">

              <div className="flex items-center gap-2 mb-5">
                <Building2 className="text-blue-600" />

                <h2 className="text-xl font-bold text-gray-900">
                  Property
                </h2>
              </div>

              <div className="space-y-4">

                <div>

                  <p className="text-sm text-gray-500">
                    Property Name
                  </p>

                  <h3 className="font-bold text-gray-900 mt-1">
                    {safeValue(
                      unit?.property?.name,
                      `Property #${unit?.property_id || "N/A"}`
                    )}
                  </h3>

                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={16} />

                  <span>
                    {safeValue(
                      unit?.property?.location
                        ?.address ||
                        unit?.property
                          ?.location
                          ?.full_address ||
                        unit?.property
                          ?.location
                          ?.city ||
                        unit?.property
                          ?.location,
                      "No location available"
                    )}
                  </span>

                </div>

              </div>

            </div>

            {/* APARTMENT */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">

              <div className="flex items-center gap-2 mb-5">
                <Building2 className="text-indigo-600" />

                <h2 className="text-xl font-bold text-gray-900">
                  Apartment
                </h2>
              </div>

              <div className="space-y-3">

                <h3 className="font-bold text-gray-900">
                  {safeValue(
                    unit?.apartment?.name,
                    "No apartment assigned"
                  )}
                </h3>

                <p className="text-sm text-gray-500">
                  {safeValue(
                    unit?.apartment?.description,
                    ""
                  )}
                </p>

              </div>

            </div>

            {/* TENANT */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">

              <div className="flex items-center gap-2 mb-5">
                <User className="text-blue-600" />

                <h2 className="text-xl font-bold text-gray-900">
                  Tenant
                </h2>
              </div>

              <div className="space-y-3">

                <p className="font-semibold text-gray-900">
                  {safeValue(
                    unit?.tenant?.name ||
                      unit?.tenant
                        ?.full_name,
                    "No tenant assigned"
                  )}
                </p>

                {unit?.tenant?.email && (
                  <p className="text-sm text-gray-500">
                    {unit?.tenant?.email}
                  </p>
                )}

              </div>

            </div>

            {/* MAINTENANCE */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">

              <div className="flex items-center gap-2 mb-5">
                <Wrench className="text-yellow-600" />

                <h2 className="text-xl font-bold text-gray-900">
                  Maintenance
                </h2>
              </div>

              <div className="space-y-4">

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    Total
                  </span>

                  <span className="font-bold">
                    {unit?.maintenance
                      ?.total ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    Pending
                  </span>

                  <span className="font-bold text-yellow-600">
                    {unit?.maintenance
                      ?.pending ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    In Progress
                  </span>

                  <span className="font-bold text-blue-600">
                    {unit?.maintenance
                      ?.in_progress ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    Completed
                  </span>

                  <span className="font-bold text-green-600">
                    {unit?.maintenance
                      ?.completed ?? 0}
                  </span>
                </div>

              </div>

            </div>

            {/* INSIGHTS */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">

              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck className="text-green-600" />

                <h2 className="text-xl font-bold text-gray-900">
                  Insights
                </h2>
              </div>

              <div className="space-y-3">

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    Vacant
                  </span>

                  <span className="font-semibold">
                    {unit?.insights
                      ?.is_vacant
                      ? "Yes"
                      : "No"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    Occupied
                  </span>

                  <span className="font-semibold">
                    {unit?.insights
                      ?.is_occupied
                      ? "Yes"
                      : "No"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    Has Tenant
                  </span>

                  <span className="font-semibold">
                    {unit?.insights
                      ?.has_tenant
                      ? "Yes"
                      : "No"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    Active Tenancy
                  </span>

                  <span className="font-semibold">
                    {unit?.insights
                      ?.has_active_tenancy
                      ? "Yes"
                      : "No"}
                  </span>
                </div>

              </div>

            </div>

            {/* FOOTER */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg">

              <div className="flex items-center gap-3">

                <BadgeCheck />

                <div>

                  <h3 className="font-bold">
                    Unit Active
                  </h3>

                  <p className="text-sm text-blue-100 mt-1">
                    This unit is successfully
                    tracked in the system.
                  </p>

                </div>

              </div>

              <div className="mt-5 flex items-center gap-2 text-sm text-blue-100">
                <CalendarDays size={15} />

                Last updated:
                {" "}
                {safeValue(
                  unit?.updated_at,
                  "Recently"
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default UnitDetails;