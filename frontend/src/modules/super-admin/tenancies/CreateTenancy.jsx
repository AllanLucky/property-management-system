import {
  ArrowLeft,
  Building2,
  Loader2,
} from "lucide-react";
import {
  useCallback,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { addNotification } from "../../../store/uiSlice";
import TenancyForm from "./TenancyForm";

/**
 * ============================================================================
 * CREATE TENANCY
 * ============================================================================
 *
 * Responsibilities:
 * - Render the create tenancy page
 * - Submit tenancy data
 * - Display API errors through TenancyForm
 * - Show success notification
 * - Redirect after successful creation
 * - Prevent duplicate submissions
 *
 * The actual form state and validation are handled by TenancyForm.
 */

/**
 * ============================================================================
 * ERROR HELPERS
 * ============================================================================
 */

/**
 * Extract a useful error message from Laravel/Axios errors.
 */
const getErrorMessage = (error) => {
  if (!error) {
    return "Failed to create tenancy. Please try again.";
  }

  if (typeof error === "string") {
    return error;
  }

  const responseData =
    error?.response?.data;

  if (
    responseData?.message &&
    typeof responseData.message === "string"
  ) {
    return responseData.message;
  }

  if (
    responseData?.error &&
    typeof responseData.error === "string"
  ) {
    return responseData.error;
  }

  if (
    error?.message &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Failed to create tenancy. Please try again.";
};

/**
 * ============================================================================
 * COMPONENT
 * ============================================================================
 */

const CreateTenancy = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState(null);

  /**
   * --------------------------------------------------------------------------
   * BACK / CANCEL
   * --------------------------------------------------------------------------
   */

  const handleCancel = useCallback(() => {
    if (submitting) {
      return;
    }

    navigate("/super-admin/tenancies");
  }, [navigate, submitting]);

  /**
   * --------------------------------------------------------------------------
   * SUBMIT
   * --------------------------------------------------------------------------
   */

  const handleSubmit = useCallback(
    async (payload) => {
      if (submitting) {
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        /**
         * Import the tenancy service only when submission happens.
         *
         * Expected export:
         *
         * createTenancy(payload)
         */
        const tenancyService =
          await import(
            "../../../services/tenancy.service"
          );

        const createTenancy =
          tenancyService.createTenancy ||
          tenancyService.default
            ?.createTenancy;

        if (
          typeof createTenancy !==
          "function"
        ) {
          throw new Error(
            "createTenancy service function was not found."
          );
        }

        const response =
          await createTenancy(payload);

        /**
         * Some API services return the raw Axios response,
         * while others return response.data.
         *
         * Support both.
         */
        const responseData =
          response?.data ?? response;

        /**
         * Treat an explicit API failure as an error.
         */
        if (
          responseData?.status === false
        ) {
          throw new Error(
            responseData?.message ||
            "Failed to create tenancy."
          );
        }

        /**
         * Success notification.
         */
        dispatch(
          addNotification({
            type: "success",
            message:
              responseData?.message ||
              "Tenancy created successfully.",
          })
        );

        /**
         * Redirect to tenancy list.
         */
        navigate(
          "/super-admin/tenancies",
          {
            replace: true,
          }
        );
      } catch (submitError) {
        const message =
          getErrorMessage(
            submitError
          );

        /**
         * Keep the error object available to
         * TenancyForm.
         */
        setError({
          message,
        });

        /**
         * Do not show a success notification.
         *
         * The form receives the error and displays it.
         */

        throw submitError;
      } finally {
        setSubmitting(false);
      }
    },
    [
      dispatch,
      navigate,
      submitting,
    ]
  );

  /**
   * ==========================================================================
   * RENDER
   * ==========================================================================
   */

  return (
    <div className="min-h-full space-y-6">
      {/* ================================================================== */}
      {/* PAGE HEADER */}
      {/* ================================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div
          className="
            flex
            flex-col
            gap-4
            px-5
            py-5
            sm:px-6
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          {/* -------------------------------------------------------------- */}
          {/* LEFT SIDE */}
          {/* -------------------------------------------------------------- */}

          <div className="flex items-center gap-3">
            {/* Back button */}

            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              aria-label="Back to tenancies"
              title="Back to tenancies"
              className="
                inline-flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-lg
                border
                border-gray-300
                bg-white
                text-gray-600
                shadow-sm
                transition
                hover:bg-gray-50
                hover:text-gray-900
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500/20
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {/* Page icon */}

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Building2 className="h-5 w-5" />
            </div>

            {/* Page title */}

            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900">
                Create Tenancy
              </h1>

              <p className="mt-0.5 text-sm text-gray-500">
                Create a new tenancy and assign
                it to a tenant and unit.
              </p>
            </div>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* SUBMITTING INDICATOR */}
          {/* -------------------------------------------------------------- */}

          {submitting && (
            <div className="inline-flex items-center gap-2 self-start text-sm text-gray-500 lg:self-auto">
              <Loader2 className="h-4 w-4 animate-spin" />

              <span>
                Creating tenancy...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* TENANCY FORM */}
      {/* ================================================================== */}

      <TenancyForm
        mode="create"
        loading={false}
        submitting={submitting}
        error={error}
        initialValues={{}}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default CreateTenancy;