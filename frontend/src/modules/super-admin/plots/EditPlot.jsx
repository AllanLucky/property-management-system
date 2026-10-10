
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

const unwrapPlot = (response) => {
  let result = response?.data ?? response;

  // Handle Laravel API envelopes.
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

  // Handle responses such as { plot: {...} }.
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

  if (response.status === false) {
    return true;
  }

  const code = Number(response.code);

  return Number.isFinite(code) && code >= 400;
};

const normalizePlot = (plot) => {
  if (!plot || typeof plot !== "object") {
    return null;
  }

  return {
    ...plot,
    id: plot.id ?? plot.plot_id ?? "",
    title: plot.title ?? plot.name ?? "",
    code: plot.code ?? "",
    property_id:
      plot.property_id ?? plot.property?.id ?? "",
    country_id:
      plot.country_id ?? plot.country?.id ?? "",
    region_id:
      plot.region_id ?? plot.region?.id ?? "",
    county_id:
      plot.county_id ?? plot.county?.id ?? "",
    city_id:
      plot.city_id ?? plot.city?.id ?? "",
    area_id:
      plot.area_id ?? plot.area?.id ?? "",
    size: plot.size ?? "",
    asking_price: plot.asking_price ?? "",
    status: plot.status ?? "available",
    description: plot.description ?? "",
    is_active:
      plot.is_active === undefined ? true : plot.is_active,
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

  /*
  |--------------------------------------------------------------------------
  | PLOT HOOK
  |--------------------------------------------------------------------------
  |
  | Expected usePlot methods:
  | - getPlot(id)
  | - updatePlot(id, payload)
  | - loading
  | - error
  | - clearError() (optional)
  |
  */

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
      setPageError("A valid plot ID is required to edit this plot.");
      setPlot(null);
      setPageLoading(false);
      return;
    }

    if (typeof getPlot !== "function") {
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
          response.message || "Unable to load the selected plot.",
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
            response.message || "Unable to update this plot.",
          );
        }

        await Swal.fire({
          icon: "success",
          title: "Plot Updated",
          text:
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
  | RENDER: LOADING
  |--------------------------------------------------------------------------
  */

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50/70">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <PlotHeader
            title="Edit Plot"
            description="Update plot details and availability information."
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
  | RENDER: PLOT NOT AVAILABLE
  |--------------------------------------------------------------------------
  */

  if (!plot) {
    return (
      <div className="min-h-screen bg-gray-50/70">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <PlotHeader
            title="Edit Plot"
            description="Update plot details and availability information."
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
                className="shrink-0 rounded-lg p-1 transition hover:bg-red-100"
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
                  className={`h-4 w-4 ${isBusy ? "animate-spin" : ""
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
  | RENDER: EDIT FORM
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-gray-50/70">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}

        <PlotHeader
          title="Edit Plot"
          description={`Update the details for ${plot.title || plot.code || `plot #${id}`}.`}
          loading={isBusy}
          onRefresh={handleRefresh}
          showRefresh
        />

        {/* Error Message */}

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
              className="shrink-0 rounded-lg p-1 transition hover:bg-red-100"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* Plot Summary */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <MapPin className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900">
                    {plot.title || "Plot Information"}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Plot code:{" "}
                    <span className="font-medium text-gray-700">
                      {plot.code || "Not assigned"}
                    </span>
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Edit the plot information below and save your changes.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isBusy}
                className="inline-flex min-h-9 items-center justify-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isBusy ? "animate-spin" : ""
                    }`}
                />
                Reload Plot
              </button>
            </div>
          </div>

          {/* Edit Form */}

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <PlotForm
              key={plot.id}
              mode="edit"
              plot={plot}
              initialValues={plot}
              loading={loading}
              submitting={submitting}
              onSubmit={handleUpdatePlot}
              onCancel={() => navigate("/super-admin/plots")}
            />
          </div>

          {/* Submission Indicator */}

          {submitting && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving plot changes, please wait...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditPlot;
