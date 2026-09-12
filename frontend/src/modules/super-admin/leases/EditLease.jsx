import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import LeaseForm from "./LeaseForm";
import { useLease } from "../../../hooks/useLease";
import useTenancy from "../../../hooks/useTenancy";

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

const LEASE_LIST_ROUTE = "/super-admin/leases";

/*
|--------------------------------------------------------------------------
| Tenancy Request Parameters
|--------------------------------------------------------------------------
*/

const TENANCY_LIST_PARAMS = Object.freeze({
  per_page: 100,
});

/*
|--------------------------------------------------------------------------
| Utility Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely extract a readable error message from:
 *
 * - Axios errors
 * - Laravel API responses
 * - Redux thunk errors
 * - Hook errors
 * - Validation responses
 */
const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  if (
    typeof error?.response?.data?.message === "string" &&
    error.response.data.message.trim()
  ) {
    return error.response.data.message.trim();
  }

  if (
    typeof error?.response?.data?.error === "string" &&
    error.response.data.error.trim()
  ) {
    return error.response.data.error.trim();
  }

  if (
    typeof error?.data?.message === "string" &&
    error.data.message.trim()
  ) {
    return error.data.message.trim();
  }

  if (
    typeof error?.data?.error === "string" &&
    error.data.error.trim()
  ) {
    return error.data.error.trim();
  }

  if (
    typeof error?.payload?.message === "string" &&
    error.payload.message.trim()
  ) {
    return error.payload.message.trim();
  }

  if (
    typeof error?.payload?.error === "string" &&
    error.payload.error.trim()
  ) {
    return error.payload.error.trim();
  }

  if (typeof error?.raw === "string" && error.raw.trim()) {
    return error.raw.trim();
  }

  return fallback;
};

/**
 * Normalize tenancy responses into an array.
 *
 * Supported response structures:
 *
 * [
 *   ...
 * ]
 *
 * {
 *   data: [...]
 * }
 *
 * {
 *   data: {
 *     data: [...]
 *   }
 * }
 *
 * {
 *   value: [...]
 * }
 *
 * {
 *   results: [...]
 * }
 */
const normalizeTenancies = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.value)) {
    return response.value;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  return [];
};

/**
 * Safely extract a successful API operation message.
 */
const getResultMessage = (
  response,
  fallback = "Lease updated successfully."
) => {
  if (typeof response === "string" && response.trim()) {
    return response.trim();
  }

  return (
    response?.message ||
    response?.data?.message ||
    response?.meta?.message ||
    response?.data?.data?.message ||
    fallback
  );
};

/**
 * Build a clean payload for the Lease update endpoint.
 *
 * Protected fields are deliberately removed because:
 *
 * - tenancy_id identifies the lease relationship
 * - lease_number is system-generated
 *
 * Neither should be modified from the edit screen.
 */
const buildLeaseUpdatePayload = (payload = {}) => {
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    return {};
  }

  const sanitizedPayload = { ...payload };

  /*
  |--------------------------------------------------------------------------
  | Protected Fields
  |--------------------------------------------------------------------------
  */

  delete sanitizedPayload.tenancy_id;
  delete sanitizedPayload.tenancyId;

  delete sanitizedPayload.lease_number;
  delete sanitizedPayload.leaseNumber;

  /*
  |--------------------------------------------------------------------------
  | Remove Undefined Values
  |--------------------------------------------------------------------------
  */

  Object.keys(sanitizedPayload).forEach((key) => {
    if (sanitizedPayload[key] === undefined) {
      delete sanitizedPayload[key];
    }
  });

  return sanitizedPayload;
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const EditLease = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [pageError, setPageError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Lease Hook
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | The current useLease hook exposes:
  |
  | - currentLease
  | - loadingDetails
  | - loadingUpdate
  | - fetchOne
  | - update
  |
  | Do not use `lease` or `loadingOne`.
  |
  */

  const {
    currentLease,
    loadingDetails,
    loadingUpdate,
    error: leaseError,
    errors: leaseErrors,
    fetchOne,
    update,
    clearError,
  } = useLease();

  /*
  |--------------------------------------------------------------------------
  | Tenancy Hook
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | The current useTenancy hook exposes:
  |
  | - tenancies
  | - loading
  | - error
  | - getTenancies
  |
  | It does NOT expose fetchTenancies().
  |
  | Therefore this component uses getTenancies() without changing
  | useTenancy.js.
  |
  */

  const {
    tenancies,
    loading: loadingTenancies,
    error: tenancyError,
    getTenancies,
  } = useTenancy();

  /*
  |--------------------------------------------------------------------------
  | Normalize Lease ID
  |--------------------------------------------------------------------------
  */

  const leaseId = useMemo(() => {
    if (!id) {
      return "";
    }

    return String(id).trim();
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Load Lease + Tenancies
  |--------------------------------------------------------------------------
  */

  const loadPage = useCallback(async () => {
    if (!leaseId) {
      setHasLoaded(true);
      setPageError("A valid lease ID is required.");
      return;
    }

    setPageError("");
    setHasLoaded(false);

    try {
      /*
      |--------------------------------------------------------------------------
      | Load Both Resources
      |--------------------------------------------------------------------------
      |
      | These requests are independent, so they can execute concurrently.
      |
      */

      await Promise.all([
        fetchOne(leaseId),
        getTenancies(TENANCY_LIST_PARAMS),
      ]);

      setHasLoaded(true);
    } catch (error) {
      setHasLoaded(true);

      setPageError(
        getErrorMessage(
          error,
          "Unable to load the lease information. Please try again."
        )
      );
    }
  }, [fetchOne, getTenancies, leaseId]);

  /*
  |--------------------------------------------------------------------------
  | Initial Page Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    const executeLoad = async () => {
      try {
        await loadPage();
      } catch (error) {
        if (!mounted) {
          return;
        }

        setHasLoaded(true);

        setPageError(
          getErrorMessage(
            error,
            "Unable to load the lease information. Please try again."
          )
        );
      }
    };

    executeLoad();

    return () => {
      mounted = false;
    };
  }, [loadPage]);

  /*
  |--------------------------------------------------------------------------
  | Cleanup Lease Errors
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      if (typeof clearError === "function") {
        clearError();
      }
    };
  }, [clearError]);

  /*
  |--------------------------------------------------------------------------
  | Submit Lease Update
  |--------------------------------------------------------------------------
  */

  const handleSubmit = useCallback(
    async (formPayload) => {
      if (!leaseId) {
        setPageError("A valid lease ID is required.");
        return;
      }

      setPageError("");

      const updatePayload = buildLeaseUpdatePayload(formPayload);

      /*
      |--------------------------------------------------------------------------
      | Development Logging
      |--------------------------------------------------------------------------
      */

      if (import.meta.env.DEV) {
        console.debug("[EditLease] Lease ID:", leaseId);
        console.debug(
          "[EditLease] Update payload:",
          updatePayload
        );
      }

      try {
        const response = await update(
          leaseId,
          updatePayload
        );

        const message = getResultMessage(
          response,
          "Lease updated successfully."
        );

        /*
        |--------------------------------------------------------------------------
        | Redirect After Successful Update
        |--------------------------------------------------------------------------
        */

        navigate(LEASE_LIST_ROUTE, {
          replace: true,
          state: {
            success: true,
            message,
          },
        });
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to update the lease. Please review the form and try again."
        );

        setPageError(message);
      }
    },
    [leaseId, navigate, update]
  );

  /*
  |--------------------------------------------------------------------------
  | Cancel
  |--------------------------------------------------------------------------
  */

  const handleCancel = useCallback(() => {
    navigate(LEASE_LIST_ROUTE);
  }, [navigate]);

  /*
  |--------------------------------------------------------------------------
  | Retry
  |--------------------------------------------------------------------------
  */

  const handleRetry = useCallback(async () => {
    if (!leaseId) {
      setHasLoaded(true);
      setPageError("A valid lease ID is required.");
      return;
    }

    await loadPage();
  }, [leaseId, loadPage]);

  /*
  |--------------------------------------------------------------------------
  | Normalize Tenancies
  |--------------------------------------------------------------------------
  */

  const normalizedTenancies = useMemo(() => {
    return normalizeTenancies(tenancies);
  }, [tenancies]);

  /*
  |--------------------------------------------------------------------------
  | Normalize Lease Validation Errors
  |--------------------------------------------------------------------------
  */

  const normalizedLeaseErrors = useMemo(() => {
    if (!leaseErrors) {
      return "";
    }

    if (typeof leaseErrors === "string") {
      return leaseErrors;
    }

    if (
      typeof leaseErrors?.message === "string" &&
      leaseErrors.message.trim()
    ) {
      return leaseErrors.message;
    }

    if (
      typeof leaseErrors?.error === "string" &&
      leaseErrors.error.trim()
    ) {
      return leaseErrors.error;
    }

    if (
      leaseErrors?.errors &&
      typeof leaseErrors.errors === "object"
    ) {
      const validationErrors = Object.values(
        leaseErrors.errors
      )
        .flat()
        .filter(Boolean)
        .map((message) => String(message));

      if (validationErrors.length > 0) {
        return validationErrors.join(" ");
      }
    }

    return "";
  }, [leaseErrors]);

  /*
  |--------------------------------------------------------------------------
  | Normalize Lease Error
  |--------------------------------------------------------------------------
  */

  const normalizedLeaseError = useMemo(() => {
    return getErrorMessage(leaseError, "");
  }, [leaseError]);

  /*
  |--------------------------------------------------------------------------
  | Normalize Tenancy Error
  |--------------------------------------------------------------------------
  */

  const normalizedTenancyError = useMemo(() => {
    return getErrorMessage(tenancyError, "");
  }, [tenancyError]);

  /*
  |--------------------------------------------------------------------------
  | Combined Error
  |--------------------------------------------------------------------------
  */

  const combinedError =
    pageError ||
    normalizedLeaseError ||
    normalizedTenancyError ||
    normalizedLeaseErrors;

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Do not use:
  |
  |     loading || !lease
  |
  | The actual single-record state is `currentLease`.
  |
  */

  const isInitialLoading =
    !hasLoaded ||
    Boolean(loadingDetails) ||
    (Boolean(loadingTenancies) && !currentLease);

  const isSaving = Boolean(loadingUpdate);

  /*
  |--------------------------------------------------------------------------
  | Initial Loading Screen
  |--------------------------------------------------------------------------
  */

  if (isInitialLoading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 px-4 py-12 dark:bg-gray-950">
        <div className="mx-auto flex min-h-[45vh] w-full max-w-4xl items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600 dark:text-blue-400" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
              Loading lease
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
              Please wait while we load the lease information
              and available tenancies.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Lease Not Found / Load Failure
  |--------------------------------------------------------------------------
  */

  if (!currentLease) {
    return (
      <div className="min-h-[60vh] bg-gray-50 px-4 py-8 dark:bg-gray-950 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[45vh] w-full max-w-4xl items-center justify-center">
          <div className="w-full overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm dark:border-red-900/50 dark:bg-gray-900">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
                  <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
                </div>

                <h1 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
                  Unable to load lease
                </h1>

                <p className="mt-2 max-w-lg text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {combinedError ||
                    "The requested lease could not be loaded. It may have been removed or you may not have permission to view it."}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={
                      Boolean(loadingDetails) ||
                      Boolean(loadingTenancies)
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loadingDetails ||
                        loadingTenancies
                        ? "animate-spin"
                        : ""
                        }`}
                    />

                    Try Again
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Leases
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Main Edit Page
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/*
        |--------------------------------------------------------------------------
        | Page Header
        |--------------------------------------------------------------------------
        */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Back to leases"
              className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Edit Lease
                </h1>

                {currentLease?.status_label && (
                  <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {currentLease.status_label}
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Update the lease terms, financial details, dates,
                and lifecycle information.
              </p>

              {currentLease?.lease_number && (
                <p className="mt-2 text-xs font-medium text-gray-400 dark:text-gray-500">
                  Lease #{currentLease.lease_number}
                </p>
              )}
            </div>
          </div>

          {isSaving && (
            <div className="inline-flex items-center gap-2 self-start rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 sm:self-auto">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving changes...
            </div>
          )}
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Page-Level Error
        |--------------------------------------------------------------------------
        */}

        {combinedError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">
                {normalizedTenancyError &&
                  !pageError &&
                  !normalizedLeaseError
                  ? "Unable to load tenancies"
                  : "Lease operation failed"}
              </h2>

              <p className="mt-1 text-sm leading-6 text-red-700 dark:text-red-400">
                {combinedError}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setPageError("");

                if (typeof clearError === "function") {
                  clearError();
                }
              }}
              aria-label="Dismiss error"
              className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-950/50"
            >
              Dismiss
            </button>
          </div>
        )}

        {/*
        |--------------------------------------------------------------------------
        | Lease Form
        |--------------------------------------------------------------------------
        */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <LeaseForm
            lease={currentLease}
            tenancies={normalizedTenancies}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={isSaving}
            isEdit
            tenancyReadOnly
            leaseNumberReadOnly
            tenancyError={
              normalizedTenancyError || undefined
            }
          />
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Protected Fields Notice
        |--------------------------------------------------------------------------
        */}

        {!isSaving && (
          <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

            <span>
              Tenancy and lease number are protected fields and
              cannot be changed during a lease update.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditLease;

