
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
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
    "Unable to create the plot. Please try again."
  );
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

/*
|--------------------------------------------------------------------------
| CREATE PLOT
|--------------------------------------------------------------------------
*/

const CreatePlot = () => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | PLOT HOOK
  |--------------------------------------------------------------------------
  */

  const {
    loading = false,
    error,
    createPlot,
    clearError,
  } = usePlot();

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | CLEAR ERRORS ON MOUNT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    clearError?.();
    setPageError("");
  }, [clearError]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  |
  | Reference-data loading has not been connected because the actual
  | property and location API methods are not available in this file.
  | This refresh clears errors without making guessed API requests.
  |
  */

  const handleRefresh = useCallback(() => {
    setPageError("");
    clearError?.();
  }, [clearError]);

  /*
  |--------------------------------------------------------------------------
  | CREATE PLOT
  |--------------------------------------------------------------------------
  */

  const handleCreatePlot = useCallback(
    async (payload) => {
      if (typeof createPlot !== "function") {
        const message =
          "The createPlot action is unavailable. Check your usePlot hook.";

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
        const response = await createPlot(payload);

        if (isFailedResponse(response)) {
          throw new Error(
            response.message || "The plot could not be created.",
          );
        }

        const responseMessage =
          response?.message ||
          response?.data?.message ||
          "The plot has been created successfully.";

        await Swal.fire({
          icon: "success",
          title: "Plot Created",
          text: responseMessage,
          confirmButtonText: "View Plots",
          confirmButtonColor: "#059669",
        });

        navigate("/super-admin/plots", {
          replace: true,
          state: { refresh: true },
        });
      } catch (submissionError) {
        const message = getErrorMessage(submissionError);

        setPageError(message);

        await Swal.fire({
          icon: "error",
          title: "Unable to Create Plot",
          text: message,
          confirmButtonColor: "#059669",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [createPlot, navigate],
  );

  /*
  |--------------------------------------------------------------------------
  | ERROR DISPLAY
  |--------------------------------------------------------------------------
  */

  const displayedError =
    pageError ||
    (typeof error === "string" ? error : error?.message);

  const isBusy = loading || submitting;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-gray-50/70">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}

        <PlotHeader
          title="Create Plot"
          description="Register a new land plot and add it to your property inventory."
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
          {/* Introductory Card */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    New Plot Information
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                    Enter the plot identification, location, size,
                    asking price and availability details.
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

                Refresh
              </button>
            </div>
          </div>

          {/* Plot Form */}

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <PlotForm
              mode="create"
              loading={loading}
              submitting={submitting}
              onSubmit={handleCreatePlot}
              onCancel={() => navigate("/super-admin/plots")}
            />
          </div>

          {/* Submission Indicator */}

          {submitting && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating plot, please wait...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePlot;
