import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  FilePlus2,
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
| CONSTANTS
|--------------------------------------------------------------------------
*/

const PLOTS_ROUTE = "/super-admin/plots";

const SUCCESS_COLOR = "#059669";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Extract a useful error message from Laravel/API responses.
 */
const getErrorMessage = (error) => {
  const responseData = error?.response?.data;

  if (responseData?.errors) {
    const firstError = Object.values(responseData.errors)
      .flat()
      .find((message) => typeof message === "string" && message.trim());

    if (firstError) {
      return firstError;
    }
  }

  return (
    responseData?.message ||
    error?.message ||
    "Unable to create the plot. Please check your details and try again."
  );
};

/**
 * Detect unsuccessful API responses.
 *
 * Supports the EstateKenya response envelope:
 * { status, code, message, data, errors }
 */
const isFailedResponse = (response) => {
  if (!response || typeof response !== "object") {
    return false;
  }

  if (response.status === false) {
    return true;
  }

  const code = Number(response.code);

  if (Number.isFinite(code) && code >= 400) {
    return true;
  }

  return false;
};

/**
 * Get the most useful success message from an API response.
 */
const getSuccessMessage = (response) => {
  return (
    response?.message ||
    response?.data?.message ||
    "The plot has been created successfully."
  );
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

  const isBusy = Boolean(loading || submitting);

  /*
  |--------------------------------------------------------------------------
  | INITIALIZE PAGE
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
  | This clears errors and resets the current page feedback.
  | It does not make guessed API requests for reference data.
  |
  */

  const handleRefresh = useCallback(() => {
    if (isBusy) {
      return;
    }

    setPageError("");
    clearError?.();
  }, [isBusy, clearError]);

  /*
  |--------------------------------------------------------------------------
  | DISMISS ERROR
  |--------------------------------------------------------------------------
  */

  const handleDismissError = useCallback(() => {
    setPageError("");
    clearError?.();
  }, [clearError]);

  /*
  |--------------------------------------------------------------------------
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const handleCancel = useCallback(() => {
    if (submitting) {
      return;
    }

    navigate(PLOTS_ROUTE);
  }, [navigate, submitting]);

  /*
  |--------------------------------------------------------------------------
  | CREATE PLOT
  |--------------------------------------------------------------------------
  */

  const handleCreatePlot = useCallback(
    async (payload) => {
      if (submitting) {
        return;
      }

      if (typeof createPlot !== "function") {
        const message =
          "The createPlot action is unavailable. Please check your usePlot hook configuration.";

        setPageError(message);

        await Swal.fire({
          icon: "error",
          title: "Configuration Error",
          text: message,
          confirmButtonColor: SUCCESS_COLOR,
        });

        return;
      }

      setSubmitting(true);
      setPageError("");
      clearError?.();

      try {
        const response = await createPlot(payload);

        if (isFailedResponse(response)) {
          throw new Error(
            response?.message ||
            response?.data?.message ||
            "The plot could not be created.",
          );
        }

        const responseMessage = getSuccessMessage(response);

        await Swal.fire({
          icon: "success",
          title: "Plot Created Successfully",
          text: responseMessage,
          confirmButtonText: "View Plots",
          confirmButtonColor: SUCCESS_COLOR,
          iconColor: SUCCESS_COLOR,
          allowOutsideClick: false,
        });

        navigate(PLOTS_ROUTE, {
          replace: true,
          state: {
            refresh: true,
            message: responseMessage,
          },
        });
      } catch (submissionError) {
        const message = getErrorMessage(submissionError);

        setPageError(message);

        await Swal.fire({
          icon: "error",
          title: "Unable to Create Plot",
          text: message,
          confirmButtonText: "Try Again",
          confirmButtonColor: SUCCESS_COLOR,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [createPlot, navigate, clearError, submitting],
  );

  /*
  |--------------------------------------------------------------------------
  | ERROR DISPLAY
  |--------------------------------------------------------------------------
  */

  const hookError =
    typeof error === "string"
      ? error
      : error?.message || "";

  const displayedError = pageError || hookError;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 w-full space-y-6">
      {/* ================================================================
          PAGE HEADER
      ================================================================= */}

      <PlotHeader
        title="Create Plot"
        description="Register a new land plot and add it to your property inventory."
        loading={isBusy}
        onRefresh={handleRefresh}
        showRefresh
      />

      {/* ================================================================
          ERROR MESSAGE
      ================================================================= */}

      {displayedError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex min-w-0 items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="mt-1 break-words leading-6">
              {displayedError}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismissError}
            className="shrink-0 rounded-lg p-1.5 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ================================================================
          INTRODUCTION CARD
      ================================================================= */}

      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 lg:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
              <FilePlus2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900">
                New Plot Information
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Enter the plot identification, property association,
                location, size, asking price, and availability details.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isBusy}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
          >
            <RefreshCw
              className={`h - 4 w - 4 ${isBusy ? "animate-spin" : ""
                } `}
            />

            Refresh
          </button>
        </div>
      </section>

      {/* ================================================================
          FORM SECTION
      ================================================================= */}

      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
              <MapPin className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">
                Plot Details
              </h2>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Complete the form below to add a plot to EstateKenya.
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 p-4 sm:p-6 lg:p-8">
          <PlotForm
            mode="create"
            loading={loading}
            submitting={submitting}
            onSubmit={handleCreatePlot}
            onCancel={handleCancel}
          />
        </div>
      </section>

      {/* ================================================================
          SUBMISSION STATUS
      ================================================================= */}

      {submitting && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800"
        >
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-600" />

          <div className="min-w-0">
            <p className="font-semibold">
              Creating plot...
            </p>

            <p className="mt-0.5 text-emerald-700">
              Please wait while your plot information is being saved.
            </p>
          </div>
        </div>
      )}

      {/* ================================================================
          FOOTER NOTE
      ================================================================= */}

      {!submitting && !displayedError && (
        <div className="flex items-start gap-2 px-1 text-xs leading-5 text-gray-500">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

          <p>
            Review the plot details before submitting. The plot will be
            saved using the fields and validation rules configured by
            your EstateKenya backend.
          </p>
        </div>
      )}
    </div>
  );
};

export default CreatePlot;
