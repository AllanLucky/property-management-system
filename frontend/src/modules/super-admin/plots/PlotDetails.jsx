
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  Home,
  Loader2,
  MapPin,
  RefreshCw,
  Ruler,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

import PlotHeader from "./PlotHeader";
import PlotStatusBadge from "./PlotStatusBadge";
import { usePlot } from "../../../hooks/usePlots";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const formatCurrency = (value, currency = "KES") => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `${currency} 0.00`;
  }

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Not specified";
  }

  return number.toLocaleString("en-KE", {
    maximumFractionDigits: 4,
  });
};

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;

  if (responseData?.errors) {
    const firstError = Object.values(responseData.errors)
      .flat()
      .find((message) => typeof message === "string");

    if (firstError) return firstError;
  }

  return (
    responseData?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

const unwrapPlot = (response) => {
  let result = response?.data ?? response;

  for (let index = 0; index < 4; index += 1) {
    if (
      result &&
      typeof result === "object" &&
      !Array.isArray(result) &&
      result.data !== undefined
    ) {
      result = result.data;
      continue;
    }

    break;
  }

  if (
    result &&
    typeof result === "object" &&
    !Array.isArray(result) &&
    result.plot &&
    typeof result.plot === "object"
  ) {
    result = result.plot;
  }

  return result;
};

const isFailedResponse = (response) => {
  if (!response || typeof response !== "object") {
    return false;
  }

  if (response.status === false) return true;

  const code = Number(response.code);

  return Number.isFinite(code) && code >= 400;
};

const getLocation = (plot) => {
  const parts = [
    plot?.area?.name ?? plot?.area_name,
    plot?.city?.name ?? plot?.city_name,
    plot?.county?.name ?? plot?.county_name,
    plot?.region?.name ?? plot?.region_name,
    plot?.country?.name ?? plot?.country_name,
  ].filter(
    (value, index, array) =>
      typeof value === "string" &&
      value.trim() &&
      array.indexOf(value) === index,
  );

  return parts.length ? parts.join(", ") : "Location not specified";
};

const getPropertyName = (plot) => {
  if (typeof plot?.property === "string") {
    return plot.property;
  }

  return (
    plot?.property?.name ||
    plot?.property?.title ||
    plot?.property_name ||
    (plot?.property_id ? `Property #${plot.property_id}` : "Not assigned")
  );
};

const getPlotSize = (plot) => {
  const size = plot?.size ?? plot?.plot_size;

  if (size === null || size === undefined || size === "") {
    return "Not specified";
  }

  const unit = plot?.size_unit ?? plot?.measurement_unit;

  if (typeof size === "string") {
    return size;
  }

  return `${formatNumber(size)}${unit ? ` ${unit}` : ""}`;
};

const getActiveState = (value) => {
  return !(
    value === false ||
    value === 0 ||
    value === "0" ||
    value === "false"
  );
};

/*
|--------------------------------------------------------------------------
| REUSABLE DETAIL COMPONENTS
|--------------------------------------------------------------------------
*/

const DetailItem = ({ icon: Icon, label, value, children }) => (
  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm ring-1 ring-gray-100">
      <Icon className="h-5 w-5" />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      {children || (
        <p className="mt-1 break-words text-sm font-semibold text-gray-900">
          {value ?? "Not available"}
        </p>
      )}
    </div>
  </div>
);

const SectionCard = ({ title, description, icon: Icon, children }) => (
  <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Icon className="h-5 w-5" />
          </div>
        )}

        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm leading-5 text-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>

    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

/*
|--------------------------------------------------------------------------
| PLOT DETAILS
|--------------------------------------------------------------------------
*/

const PlotDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | PLOT HOOK
  |--------------------------------------------------------------------------
  |
  | Expected usePlot methods:
  | - getPlot(id)
  | - deletePlot(id)
  | - loading
  | - error
  | - clearError() (optional)
  |
  */

  const {
    loading = false,
    error,
    getPlot,
    deletePlot,
    clearError,
  } = usePlot();

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [plot, setPlot] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [deleting, setDeleting] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD PLOT
  |--------------------------------------------------------------------------
  */

  const loadPlot = useCallback(async () => {
    if (!id) {
      setPlot(null);
      setPageError("A valid plot ID is required.");
      setPageLoading(false);
      return;
    }

    if (typeof getPlot !== "function") {
      setPlot(null);
      setPageError(
        "The getPlot action is unavailable. Check your usePlot hook.",
      );
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setPageError("");
    clearError?.();

    try {
      const response = await getPlot(id);

      if (isFailedResponse(response)) {
        throw new Error(
          response.message || "Unable to load plot details.",
        );
      }

      const result = unwrapPlot(response);

      if (
        !result ||
        typeof result !== "object" ||
        Array.isArray(result) ||
        !(result.id ?? result.plot_id)
      ) {
        throw new Error(
          "The plot was not found or the API returned invalid data.",
        );
      }

      setPlot({
        ...result,
        id: result.id ?? result.plot_id,
      });
    } catch (loadError) {
      setPlot(null);
      setPageError(getErrorMessage(loadError));
    } finally {
      setPageLoading(false);
    }
  }, [id, getPlot, clearError]);

  useEffect(() => {
    loadPlot();
  }, [loadPlot]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = useCallback(() => {
    loadPlot();
  }, [loadPlot]);

  /*
  |--------------------------------------------------------------------------
  | DELETE PLOT
  |--------------------------------------------------------------------------
  */

  const handleDelete = useCallback(async () => {
    if (!plot?.id) return;

    if (typeof deletePlot !== "function") {
      await Swal.fire({
        icon: "error",
        title: "Action Unavailable",
        text: "The deletePlot action is missing from your usePlot hook.",
        confirmButtonColor: "#059669",
      });

      return;
    }

    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Delete this plot?",
      text: `Are you sure you want to delete "${plot.title || plot.code || `Plot #${plot.id}`}"?`,
      showCancelButton: true,
      confirmButtonText: "Yes, delete plot",
      cancelButtonText: "Keep plot",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!confirmation.isConfirmed) return;

    setDeleting(true);
    setPageError("");

    try {
      const response = await deletePlot(plot.id);

      if (isFailedResponse(response)) {
        throw new Error(
          response.message || "Unable to delete this plot.",
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Plot Deleted",
        text:
          response?.message ||
          "The plot has been deleted successfully.",
        confirmButtonColor: "#059669",
      });

      navigate("/super-admin/plots", {
        replace: true,
        state: { refresh: true },
      });
    } catch (deleteError) {
      const message = getErrorMessage(deleteError);
      setPageError(message);

      await Swal.fire({
        icon: "error",
        title: "Unable to Delete Plot",
        text: message,
        confirmButtonColor: "#059669",
      });
    } finally {
      setDeleting(false);
    }
  }, [plot, deletePlot, navigate]);

  /*
  |--------------------------------------------------------------------------
  | DERIVED VALUES
  |--------------------------------------------------------------------------
  */

  const location = useMemo(
    () => getLocation(plot),
    [plot],
  );

  const propertyName = useMemo(
    () => getPropertyName(plot),
    [plot],
  );

  const plotSize = useMemo(
    () => getPlotSize(plot),
    [plot],
  );

  const active = getActiveState(plot?.is_active);

  const displayedError =
    pageError ||
    (typeof error === "string" ? error : error?.message);

  const isBusy = loading || pageLoading || deleting;

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50/70">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <PlotHeader
            title="Plot Details"
            description="View plot information, location and pricing."
            loading
            onRefresh={handleRefresh}
            showRefresh
          />

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />

              <h2 className="mt-4 text-base font-semibold text-gray-900">
                Loading plot details
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Please wait while we retrieve the plot information.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NOT FOUND STATE
  |--------------------------------------------------------------------------
  */

  if (!plot) {
    return (
      <div className="min-h-screen bg-gray-50/70">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <PlotHeader
            title="Plot Details"
            description="View plot information, location and pricing."
            loading={isBusy}
            onRefresh={handleRefresh}
            showRefresh
          />

          {displayedError && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  Unable to Load Plot
                </p>

                <p className="mt-1 break-words">
                  {displayedError}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPageError("")}
                className="rounded-lg p-1 transition hover:bg-red-100"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MapPin className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Plot Not Found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              We could not load this plot. It may have been deleted,
              the ID may be invalid, or the request may have failed.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isBusy}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    isBusy ? "animate-spin" : ""
                  }`}
                />
                Try Again
              </button>

              <button
                type="button"
                onClick={() => navigate("/super-admin/plots")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Plots
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN DETAILS PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-gray-50/70">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}

        <PlotHeader
          title="Plot Details"
          description={`Viewing ${plot.title || plot.code || `plot #${plot.id}`}.`}
          loading={isBusy}
          onRefresh={handleRefresh}
          showRefresh
        />

        {/* Page Error */}

        {displayedError && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1 break-words">
                {displayedError}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setPageError("");
                clearError?.();
              }}
              className="rounded-lg p-1 transition hover:bg-red-100"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* Plot Summary */}

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <MapPin className="h-7 w-7" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="break-words text-xl font-bold text-gray-900 sm:text-2xl">
                        {plot.title || "Untitled Plot"}
                      </h1>

                      <PlotStatusBadge
                        status={plot.status || "available"}
                        isActive={plot.is_active}
                      />
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      Plot code:{" "}
                      <span className="font-semibold text-gray-700">
                        {plot.code || "Not assigned"}
                      </span>
                    </p>

                    <div className="mt-3 flex items-start gap-2 text-sm text-gray-500">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="break-words">{location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/super-admin/plots")}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/super-admin/plots/${plot.id}/edit`)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Plot
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </button>
                </div>
              </div>

              {/* Key Metrics */}

              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                    <Banknote className="h-4 w-4" />
                    Asking Price
                  </div>

                  <p className="mt-3 break-words text-xl font-bold text-gray-900">
                    {formatCurrency(
                      plot.asking_price,
                      plot.currency || "KES",
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Ruler className="h-4 w-4" />
                    Plot Size
                  </div>

                  <p className="mt-3 break-words text-xl font-bold text-gray-900">
                    {plotSize}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <ShieldCheck className="h-4 w-4" />
                    Availability
                  </div>

                  <div className="mt-3">
                    <PlotStatusBadge
                      status={plot.status || "available"}
                      isActive={plot.is_active}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Record Status
                  </div>

                  <p className="mt-3 text-xl font-bold text-gray-900">
                    {active ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Plot Information */}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SectionCard
              title="Plot Information"
              description="Identification and physical characteristics."
              icon={FileText}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={FileText}
                  label="Plot Title"
                  value={plot.title || "Not specified"}
                />

                <DetailItem
                  icon={ShieldCheck}
                  label="Plot Code"
                  value={plot.code || "Not assigned"}
                />

                <DetailItem
                  icon={Ruler}
                  label="Size"
                  value={plotSize}
                />

                <DetailItem
                  icon={Home}
                  label="Linked Property"
                  value={propertyName}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Created On"
                  value={formatDate(plot.created_at)}
                />

                <DetailItem
                  icon={Clock}
                  label="Last Updated"
                  value={formatDate(plot.updated_at)}
                />
              </div>
            </SectionCard>

            {/* Location */}

            <SectionCard
              title="Location Information"
              description="The recorded geographical location of this plot."
              icon={MapPin}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem
                  icon={MapPin}
                  label="Country"
                  value={
                    plot.country?.name ||
                    plot.country_name ||
                    "Not specified"
                  }
                />

                <DetailItem
                  icon={MapPin}
                  label="Region"
                  value={
                    plot.region?.name ||
                    plot.region_name ||
                    "Not specified"
                  }
                />

                <DetailItem
                  icon={MapPin}
                  label="County"
                  value={
                    plot.county?.name ||
                    plot.county_name ||
                    "Not specified"
                  }
                />

                <DetailItem
                  icon={MapPin}
                  label="City / Town"
                  value={
                    plot.city?.name ||
                    plot.city_name ||
                    "Not specified"
                  }
                />

                <DetailItem
                  icon={MapPin}
                  label="Area"
                  value={
                    plot.area?.name ||
                    plot.area_name ||
                    "Not specified"
                  }
                />

                <DetailItem
                  icon={Home}
                  label="Property"
                  value={propertyName}
                />
              </div>

              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Full Location
                </p>

                <p className="mt-2 break-words text-sm font-semibold text-gray-900">
                  {location}
                </p>
              </div>
            </SectionCard>
          </div>

          {/* Pricing and Status */}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SectionCard
              title="Pricing Information"
              description="The current asking price and recorded financial details."
              icon={Banknote}
            >
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <p className="text-sm font-medium text-emerald-800">
                    Current Asking Price
                  </p>

                  <p className="mt-2 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
                    {formatCurrency(
                      plot.asking_price,
                      plot.currency || "KES",
                    )}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    Currency: {plot.currency || "KES"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailItem
                    icon={Banknote}
                    label="Asking Price (Raw)"
                    value={Number.isFinite(Number(plot.asking_price))
                      ? Number(plot.asking_price).toLocaleString("en-KE")
                      : "Not specified"}
                  />

                  <DetailItem
                    icon={Ruler}
                    label="Measurement"
                    value={
                      plot.size_unit ||
                      plot.measurement_unit ||
                      (typeof plot.size === "string"
                        ? "As recorded"
                        : "Not specified")
                    }
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Availability and Record Status"
              description="Current plot availability and record activity."
              icon={ShieldCheck}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Plot Availability
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Current inventory status
                    </p>
                  </div>

                  <PlotStatusBadge
                    status={plot.status || "available"}
                    isActive={plot.is_active}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Active Record
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Whether this plot record is enabled
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        active ? "bg-emerald-500" : "bg-gray-500"
                      }`}
                    />
                    {active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Created
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Date this record was created
                    </p>
                  </div>

                  <span className="text-right text-sm font-medium text-gray-700">
                    {formatDate(plot.created_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Last Modified
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Most recent record update
                    </p>
                  </div>

                  <span className="text-right text-sm font-medium text-gray-700">
                    {formatDate(plot.updated_at)}
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Description */}

          <SectionCard
            title="Description and Notes"
            description="Additional details saved against this plot."
            icon={FileText}
          >
            {plot.description ? (
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">
                {plot.description}
              </p>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-5 py-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-gray-400" />

                <p className="mt-3 text-sm font-medium text-gray-700">
                  No description available
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Edit this plot to add additional information.
                </p>
              </div>
            )}
          </SectionCard>

          {/* Bottom Actions */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => navigate("/super-admin/plots")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Plots
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(`/super-admin/plots/${plot.id}/edit`)
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Edit className="h-4 w-4" />
              Edit Plot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlotDetails;
