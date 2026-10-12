import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  MapPin,
  RefreshCw,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

import PlotHeader from "./PlotHeader";
import PlotForm from "./PlotForm";
import { usePlot } from "../../../hooks/usePlots";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;

  if (responseData?.errors) {
    const firstError = Object.values(responseData.errors)
      .flat()
      .find((message) => typeof message === "string");

    if (firstError) {
      return firstError;
    }
  }

  return (
    responseData?.message ||
    error?.message ||
    "Unable to complete the request. Please try again."
  );
};

/**
 * Supports Axios responses, Laravel API envelopes, and nested plot data.
 */
const unwrapPlot = (response) => {
  let result = response?.data ?? response;

  for (let index = 0; index < 5; index += 1) {
    if (!result || typeof result !== "object" || Array.isArray(result)) {
      break;
    }

    if (
      result.plot &&
      typeof result.plot === "object" &&
      !Array.isArray(result.plot)
    ) {
      result = result.plot;
      continue;
    }

    if (
      result.data !== undefined &&
      result.data !== null &&
      typeof result.data === "object"
    ) {
      result = result.data;
      continue;
    }

    break;
  }

  return result;
};

const isFailedResponse = (response) => {
  if (!response || typeof response !== "object") {
    return false;
  }

  const body =
    response.data && typeof response.data === "object"
      ? response.data
      : response;

  if (body.success === false || body.status === false) {
    return true;
  }

  const code = Number(body.code);

  return Number.isFinite(code) && code >= 400;
};

const normalizePlot = (plot) => {
  if (!plot || typeof plot !== "object" || Array.isArray(plot)) {
    return null;
  }

  return {
    ...plot,
    id: plot.id ?? plot.plot_id ?? "",
    title: plot.title ?? plot.name ?? "",
    code: plot.code ?? "",
    property_id: plot.property_id ?? plot.property?.id ?? "",
    country_id: plot.country_id ?? plot.country?.id ?? "",
    region_id: plot.region_id ?? plot.region?.id ?? "",
    county_id: plot.county_id ?? plot.county?.id ?? "",
    city_id: plot.city_id ?? plot.city?.id ?? "",
    area_id: plot.area_id ?? plot.area?.id ?? "",
    size: plot.size ?? "",
    asking_price: plot.asking_price ?? "",
    status: plot.status ?? "available",
    description: plot.description ?? "",
    is_active: plot.is_active === undefined ? true : plot.is_active,
  };
};

/*
|--------------------------------------------------------------------------
| EDIT PLOT
|--------------------------------------------------------------------------
*/

const EditPlot = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    loading = false,
    error,
    getPlot,
    updatePlot,
    clearError,
  } = usePlot();

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [plot, setPlot] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD PLOT
  |--------------------------------------------------------------------------
  */

  const loadPlot = useCallback(async () => {
    if (!id) {
      setPlot(null);
      setPageError("A valid plot ID is required to edit this plot.");
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

    if (typeof clearError === "function") {
      clearError();
    }

    try {
      const response = await getPlot(id);

      if (isFailedResponse(response)) {
        throw new Error(
          response?.data?.message ||
          response?.message ||
          "Unable to load the selected plot.",
        );
      }

      const result = unwrapPlot(response);
      const normalizedPlot = normalizePlot(result);

      if (!normalizedPlot || !normalizedPlot.id) {
        throw new Error(
          "The plot could not be found or the API returned invalid plot data.",
        );
      }

      setPlot(normalizedPlot);
    } catch (loadError) {
      setPlot(null);
      setPageError(getErrorMessage(loadError));
    } finally {
      setPageLoading(false);
    }
  }, [id, getPlot, clearError]);

  useEffect(() => {
    void loadPlot();
  }, [loadPlot]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = useCallback(() => {
    void loadPlot();
  }, [loadPlot]);

  /*
  |--------------------------------------------------------------------------
  | UPDATE PLOT
  |--------------------------------------------------------------------------
  */

  const handleUpdatePlot = useCallback(
    async (payload) => {
      if (!id) {
        setPageError("A valid plot ID is required.");
        return;
      }

      if (typeof updatePlot !== "function") {
        const message =
          "The updatePlot action is unavailable. Check your usePlot hook.";

        setPageError(message);

        await Swal.fire({
          icon: "error",
          title: "Configuration Error",
          text: message,
          confirmButtonColor: "#059669",
        });

        return;
      }

      setSubmitting(true);
      setPageError("");

      try {
        const response = await updatePlot(id, payload);

        if (isFailedResponse(response)) {
          throw new Error(
            response?.data?.message ||
            response?.message ||
            "Unable to update this plot.",
          );
        }

        await Swal.fire({
          icon: "success",
          title: "Plot Updated",
          text:
            response?.data?.message ||
            response?.message ||
            "The plot information has been updated successfully.",
          confirmButtonText: "View Plots",
          confirmButtonColor: "#059669",
        });

        navigate("/super-admin/plots", {
          replace: true,
          state: { refresh: true },
        });
      } catch (updateError) {
        const message = getErrorMessage(updateError);

        setPageError(message);

        await Swal.fire({
          icon: "error",
          title: "Unable to Update Plot",
          text: message,
          confirmButtonColor: "#059669",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [id, updatePlot, navigate],
  );

  /*
  |--------------------------------------------------------------------------
  | ERROR DISPLAY
  |--------------------------------------------------------------------------
  */

  const displayedError =
    pageError ||
    (typeof error === "string" ? error : error?.message);

  const isBusy = loading || pageLoading || submitting;

  /*
  |--------------------------------------------------------------------------
  | SHARED PAGE HEADER
  |--------------------------------------------------------------------------
  */

  const pageHeader = (
    <PlotHeader
      title="Edit Plot"
      description="Update plot details and availability information."
      loading={isBusy}
      onRefresh={handleRefresh}
      showRefresh
    />
  );

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (pageLoading) {
    return (
      <div className="min-w-0 w-full space-y-6">
        {pageHeader}

        <section className="flex min-w-0 items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-14 shadow-sm sm:py-20">
          <div className="flex max-w-md flex-col items-center text-center">
            <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />

            <h2 className="mt-4 text-base font-semibold text-gray-900">
              Loading plot details
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              Please wait while we retrieve the plot information.
            </p>
          </div>
        </section>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PLOT NOT AVAILABLE
  |--------------------------------------------------------------------------
  */

  if (!plot) {
    return (
      <div className="min-w-0 w-full space-y-6">
        {pageHeader}

        {displayedError && (
          <div
            role="alert"
            className="flex min-w-0 items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">Unable to Load Plot</p>
              <p className="mt-1 break-words">{displayedError}</p>
            </div>

            <button
              type="button"
              onClick={() => setPageError("")}
              className="shrink-0 rounded-lg p-1 transition hover:bg-red-100"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white px-5 py-10 text-center shadow-sm sm:px-8 sm:py-14">
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
                className={`h-4 w-4 ${isBusy ? "animate-spin" : ""}`}
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
        </section>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | EDIT FORM
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 w-full space-y-6">
      {/* Page Header */}

      {pageHeader}

      {/* Error Message */}

      {displayedError && (
        <div
          role="alert"
          className="flex min-w-0 items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1 break-words">{displayedError}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPageError("");

              if (typeof clearError === "function") {
                clearError();
              }
            }}
            className="shrink-0 rounded-lg p-1 transition hover:bg-red-100"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Plot Summary */}

      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex min-w-0 flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <MapPin className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="break-words text-base font-semibold text-gray-900 [overflow-wrap:anywhere]">
                {plot.title || "Plot Information"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Plot code:{" "}
                <span className="break-all font-medium text-gray-700">
                  {plot.code || "Not assigned"}
                </span>
              </p>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Edit the plot information below and save your changes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isBusy}
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
          >
            <RefreshCw
              className={`h-4 w-4 ${isBusy ? "animate-spin" : ""}`}
            />
            Reload Plot
          </button>
        </div>
      </section>

      {/* Edit Form */}

      <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <PlotForm
          key={plot.id}
          mode="edit"
          plot={plot}
          initialValues={plot}
          loading={loading || pageLoading}
          submitting={submitting}
          onSubmit={handleUpdatePlot}
          onCancel={() => navigate("/super-admin/plots")}
        />
      </section>

      {/* Submission Indicator */}

      {submitting && (
        <div className="flex min-w-0 items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          <span>Saving plot changes, please wait...</span>
        </div>
      )}

      {/* Bottom Actions */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => navigate("/super-admin/plots")}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Plots
        </button>

        <p className="self-center text-center text-xs text-gray-500 sm:text-right">
          Review your changes before saving the plot.
        </p>
      </div>
    </div>
  );
};

export default EditPlot;