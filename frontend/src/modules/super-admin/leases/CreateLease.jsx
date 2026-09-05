import { useCallback, useEffect, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import LeaseForm from "./LeaseForm";
import LeaseHeader from "./LeaseHeader";
import { useLease } from "../../../hooks/useLease";
import useTenancy from "../../../hooks/useTenancy";

/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/

const LEASE_LIST_ROUTE = "/super-admin/leases";
const TENANCY_LIST_ROUTE = "/super-admin/tenancies";

/*
|--------------------------------------------------------------------------
| TENANCY REQUEST PARAMETERS
|--------------------------------------------------------------------------
|
| Fetch enough tenancy records for the lease form.
|
*/

const TENANCY_LIST_PARAMS = {
  page: 1,
  per_page: 100,
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Safely extract a readable error message.
 *
 * Supports:
 * - Plain strings
 * - Error objects
 * - Axios errors
 * - Laravel API responses
 * - Redux thunk errors
 * - Nested data/message structures
 */
function getErrorMessage(
  error,
  fallback = "An unexpected error occurred.",
) {
  if (!error) {
    return fallback;
  }

  if (
    typeof error === "string" &&
    error.trim()
  ) {
    return error.trim();
  }

  const candidates = [
    error?.message,
    error?.error,
    error?.data?.message,
    error?.response?.data?.message,
    error?.payload?.message,
    error?.payload?.error,
    error?.response?.data?.error,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === "string" &&
      candidate.trim()
    ) {
      return candidate.trim();
    }
  }

  return fallback;
}

/**
 * Normalize tenancy collection.
 *
 * Supported shapes:
 *
 * []
 * { data: [] }
 * { data: { data: [] } }
 * { results: [] }
 * { items: [] }
 */
function normalizeTenancies(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.data?.data)) {
    return value.data.data;
  }

  if (Array.isArray(value?.results)) {
    return value.results;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  return [];
}

/**
 * Safely convert a possible message
 * into renderable text.
 */
function getDisplayMessage(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (
    typeof value?.message === "string"
  ) {
    return value.message.trim();
  }

  return "";
}

/**
 * Extract a successful create result.
 *
 * Some Redux implementations return:
 *
 * {
 *   payload: {
 *     data: {...},
 *     message: "..."
 *   }
 * }
 *
 * while others return the API response directly.
 */
function normalizeCreateResult(result) {
  if (!result) {
    return null;
  }

  if (result?.payload) {
    return result.payload;
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| CREATE LEASE
|--------------------------------------------------------------------------
*/

export default function CreateLease() {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | LEASE STATE / ACTIONS
  |--------------------------------------------------------------------------
  */

  const {
    create,
    loadingCreate,
    error: leaseError,
    errors: leaseErrors,
    message: leaseMessage,
    clearError,
    clearMessage,
  } = useLease();

  /*
  |--------------------------------------------------------------------------
  | TENANCY STATE / ACTIONS
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | Do not modify useTenancy.
  |
  | This page uses the existing API:
  |
  | - tenancies
  | - isLoading
  | - getTenancies()
  | - error
  | - clearError()
  |
  */

  const {
    tenancies,
    isLoading: loadingTenancies,
    getTenancies,
    error: tenancyError,
    clearError: clearTenancyError,
  } = useTenancy();

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE TENANCIES
  |--------------------------------------------------------------------------
  */

  const tenancyList = useMemo(
    () => normalizeTenancies(tenancies),
    [tenancies],
  );

  const hasTenancies =
    tenancyList.length > 0;

  /*
  |--------------------------------------------------------------------------
  | LOAD TENANCIES
  |--------------------------------------------------------------------------
  |
  | A lease requires an existing tenancy.
  |
  */

  const loadTenancies = useCallback(
    async () => {
      try {
        await getTenancies(
          TENANCY_LIST_PARAMS,
        );
      } catch (error) {
        /*
         * The hook owns the actual error state.
         * This catch prevents unhandled rejections.
         */
        console.error(
          "Failed to load tenancies for lease creation:",
          error,
        );
      }
    },
    [getTenancies],
  );

  useEffect(() => {
    void loadTenancies();
  }, [loadTenancies]);

  /*
  |--------------------------------------------------------------------------
  | CLEAR PAGE MESSAGES ON UNMOUNT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      clearError();
      clearMessage();

      if (
        typeof clearTenancyError ===
        "function"
      ) {
        clearTenancyError();
      }
    };
  }, [
    clearError,
    clearMessage,
    clearTenancyError,
  ]);

  /*
  |--------------------------------------------------------------------------
  | SUBMIT LEASE
  |--------------------------------------------------------------------------
  */

  const handleSubmit = useCallback(
    async (payload) => {
      /*
       * Clear stale messages before
       * submitting a new lease.
       */
      clearError();
      clearMessage();

      try {
        const result = await create(payload);

        const normalizedResult =
          normalizeCreateResult(result);

        /*
         * Do not redirect if no result was returned.
         */
        if (!normalizedResult) {
          return null;
        }

        const successMessage =
          getDisplayMessage(
            normalizedResult?.message,
          ) ||
          "Lease created successfully.";

        /*
         * Redirect to the lease list.
         *
         * The message is passed through router state
         * so the Lease List can display it.
         */
        navigate(LEASE_LIST_ROUTE, {
          replace: true,
          state: {
            successMessage,
          },
        });

        return normalizedResult;
      } catch (error) {
        console.error(
          "Lease creation failed:",
          error,
        );

        /*
         * LeaseForm can still handle/display
         * the submission error.
         */
        throw error;
      }
    },
    [
      clearError,
      clearMessage,
      create,
      navigate,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

  const handleCancel = useCallback(() => {
    clearError();
    clearMessage();

    navigate(LEASE_LIST_ROUTE);
  }, [
    clearError,
    clearMessage,
    navigate,
  ]);

  /*
  |--------------------------------------------------------------------------
  | RETRY TENANCIES
  |--------------------------------------------------------------------------
  */

  const handleRetryTenancies =
    useCallback(async () => {
      /*
       * Clear only the relevant tenancy error.
       */
      if (
        typeof clearTenancyError ===
        "function"
      ) {
        clearTenancyError();
      }

      try {
        await getTenancies(
          TENANCY_LIST_PARAMS,
        );
      } catch (error) {
        console.error(
          "Failed to reload tenancies:",
          error,
        );
      }
    }, [
      clearTenancyError,
      getTenancies,
    ]);

  /*
  |--------------------------------------------------------------------------
  | MANAGE TENANCIES
  |--------------------------------------------------------------------------
  */

  const handleManageTenancies =
    useCallback(() => {
      navigate(TENANCY_LIST_ROUTE);
    }, [navigate]);

  /*
  |--------------------------------------------------------------------------
  | ERROR / MESSAGE VALUES
  |--------------------------------------------------------------------------
  */

  const tenancyErrorMessage =
    getErrorMessage(
      tenancyError,
      "We could not load the available tenancies.",
    );

  const leaseErrorMessage =
    getErrorMessage(
      leaseError,
      "The lease could not be created.",
    );

  const leaseMessageText =
    getDisplayMessage(leaseMessage);

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950">
      {/* ==================================================================
          PAGE HEADER
      ================================================================== */}

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <LeaseHeader
          onRefresh={handleRetryTenancies}
          loading={
            loadingTenancies ||
            loadingCreate
          }
        />
      </div>

      {/* ==================================================================
          MAIN CONTENT
      ================================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ================================================================
            TENANCY LOADING
        ================================================================ */}

        {loadingTenancies ? (
          <section
            className="
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-8
              shadow-sm
              dark:border-gray-800
              dark:bg-gray-900
            "
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-gray-100
                  dark:bg-gray-800
                "
              >
                <Loader2
                  className="
                    h-7
                    w-7
                    animate-spin
                    text-gray-600
                    dark:text-gray-300
                  "
                  aria-hidden="true"
                />
              </div>

              <h2 className="mt-5 text-base font-semibold text-gray-900 dark:text-white">
                Loading Tenancies
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
                Please wait while we load the
                available tenancies for this
                lease.
              </p>
            </div>
          </section>
        ) : (
          <>
            {/* ============================================================
                TENANCY ERROR
            ============================================================ */}

            {tenancyError && (
              <section
                className="
                  mb-6
                  rounded-2xl
                  border
                  border-red-200
                  bg-red-50
                  p-5
                  dark:border-red-900/50
                  dark:bg-red-950/30
                "
                role="alert"
                aria-live="assertive"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-red-100
                      dark:bg-red-900/40
                    "
                  >
                    <AlertCircle
                      className="
                        h-5
                        w-5
                        text-red-600
                        dark:text-red-400
                      "
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-red-900 dark:text-red-300">
                      Unable to Load Tenancies
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-red-700 dark:text-red-400">
                      {tenancyErrorMessage}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={
                          handleRetryTenancies
                        }
                        disabled={
                          loadingTenancies
                        }
                        className="
                          inline-flex
                          items-center
                          rounded-lg
                          border
                          border-red-300
                          bg-white
                          px-4
                          py-2
                          text-sm
                          font-medium
                          text-red-700
                          shadow-sm
                          transition
                          hover:bg-red-100
                          focus:outline-none
                          focus:ring-2
                          focus:ring-red-300
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                          dark:border-red-800
                          dark:bg-gray-900
                          dark:text-red-400
                          dark:hover:bg-red-950/40
                        "
                      >
                        {loadingTenancies ? (
                          <>
                            <Loader2
                              className="
                                mr-2
                                h-4
                                w-4
                                animate-spin
                              "
                              aria-hidden="true"
                            />

                            Retrying...
                          </>
                        ) : (
                          <>
                            <RefreshCw
                              className="
                                mr-2
                                h-4
                                w-4
                              "
                              aria-hidden="true"
                            />

                            Retry
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleManageTenancies
                        }
                        className="
                          inline-flex
                          items-center
                          rounded-lg
                          border
                          border-gray-300
                          bg-white
                          px-4
                          py-2
                          text-sm
                          font-medium
                          text-gray-700
                          shadow-sm
                          transition
                          hover:bg-gray-50
                          focus:outline-none
                          focus:ring-2
                          focus:ring-gray-300
                          dark:border-gray-700
                          dark:bg-gray-900
                          dark:text-gray-300
                          dark:hover:bg-gray-800
                        "
                      >
                        Manage Tenancies
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ============================================================
                NO TENANCIES
            ============================================================ */}

            {!tenancyError &&
              !hasTenancies && (
                <section
                  className="
                    mb-6
                    rounded-2xl
                    border
                    border-amber-200
                    bg-amber-50
                    p-5
                    dark:border-amber-900/50
                    dark:bg-amber-950/30
                  "
                  role="status"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-amber-100
                        dark:bg-amber-900/40
                      "
                    >
                      <AlertCircle
                        className="
                          h-5
                          w-5
                          text-amber-600
                          dark:text-amber-400
                        "
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                        No Tenancies Available
                      </h2>

                      <p className="mt-1 max-w-2xl text-sm leading-6 text-amber-800 dark:text-amber-400">
                        A lease must be linked to
                        an existing tenancy. Create
                        or activate a tenancy before
                        creating a lease.
                      </p>

                      <button
                        type="button"
                        onClick={
                          handleManageTenancies
                        }
                        className="
                          mt-4
                          inline-flex
                          items-center
                          rounded-lg
                          border
                          border-amber-300
                          bg-white
                          px-4
                          py-2
                          text-sm
                          font-medium
                          text-amber-800
                          shadow-sm
                          transition
                          hover:bg-amber-100
                          focus:outline-none
                          focus:ring-2
                          focus:ring-amber-300
                          dark:border-amber-800
                          dark:bg-gray-900
                          dark:text-amber-400
                          dark:hover:bg-amber-950/40
                        "
                      >
                        Manage Tenancies
                      </button>
                    </div>
                  </div>
                </section>
              )}

            {/* ============================================================
                LEASE FORM
            ============================================================ */}

            {hasTenancies && (
              <LeaseForm
                tenancies={tenancyList}
                loadingTenancies={
                  loadingTenancies
                }
                submitting={loadingCreate}
                loading={loadingCreate}
                serverError={leaseError}
                serverErrors={leaseErrors}
                submitLabel="Create Lease"
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            )}

            {/* ============================================================
                LEASE CREATION ERROR
            ============================================================ */}

            {leaseError &&
              !tenancyError && (
                <section
                  className="
                    mt-6
                    rounded-2xl
                    border
                    border-red-200
                    bg-red-50
                    p-5
                    dark:border-red-900/50
                    dark:bg-red-950/30
                  "
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-red-100
                        dark:bg-red-900/40
                      "
                    >
                      <AlertCircle
                        className="
                          h-5
                          w-5
                          text-red-600
                          dark:text-red-400
                        "
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-red-900 dark:text-red-300">
                        Unable to Create Lease
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-red-700 dark:text-red-400">
                        {leaseErrorMessage}
                      </p>
                    </div>
                  </div>
                </section>
              )}

            {/* ============================================================
                SUCCESS MESSAGE
            ============================================================ */}

            {leaseMessageText && (
              <section
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-green-200
                  bg-green-50
                  p-5
                  dark:border-green-900/50
                  dark:bg-green-950/30
                "
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-green-100
                      dark:bg-green-900/40
                    "
                  >
                    <CheckCircle2
                      className="
                        h-5
                        w-5
                        text-green-600
                        dark:text-green-400
                      "
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-green-900 dark:text-green-300">
                      Lease Created
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-green-700 dark:text-green-400">
                      {leaseMessageText}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}