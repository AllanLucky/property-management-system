import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  fetchTenancies,
  selectTenancies,
  selectTenancyPagination,
  selectTenancyFilters,
  selectTenancyLoading,
  selectTenancyError,
  selectTenancyStatistics,
  clearTenancyError,
  setTenancyFilters,
} from "../../../store/tenancySlice";

import TenancyHeader from "./TenancyHeader";
import TenancyStats from "./TenancyStats";
import TenancyFilters from "./TenancyFilters";
import TenancyTable from "./TenancyTable";
import TenancyPagination from "./TenancyPagination";
import TenancyEmptyState from "./TenancyEmptyState";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

/*
|--------------------------------------------------------------------------
| Loading Component
|--------------------------------------------------------------------------
*/

const TenancyLoading = () => {
  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-white
        shadow-sm
        dark:border-gray-700
        dark:bg-gray-800
      "
      role="status"
      aria-live="polite"
      aria-label="Loading tenancies"
    >
      <div
        className="
          flex
          min-h-[360px]
          flex-col
          items-center
          justify-center
          px-6
          py-12
        "
      >
        <div
          className="
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-2xl
            bg-indigo-50
            dark:bg-indigo-950/40
          "
        >
          <Loader2
            className="
              h-8
              w-8
              animate-spin
              text-indigo-600
              dark:text-indigo-400
            "
            aria-hidden="true"
          />
        </div>

        <h3
          className="
            mt-5
            text-sm
            font-semibold
            text-gray-900
            dark:text-white
          "
        >
          Loading tenancies
        </h3>

        <p
          className="
            mt-1
            max-w-sm
            text-center
            text-sm
            text-gray-500
            dark:text-gray-400
          "
        >
          Please wait while we retrieve the latest
          tenancy records.
        </p>

        <div
          className="
            mt-5
            h-1
            w-32
            overflow-hidden
            rounded-full
            bg-gray-100
            dark:bg-gray-700
          "
        >
          <div
            className="
              h-full
              w-1/2
              animate-[loading_1.2s_ease-in-out_infinite]
              rounded-full
              bg-indigo-600
              dark:bg-indigo-400
            "
          />
        </div>
      </div>
    </section>
  );
};

/*
|--------------------------------------------------------------------------
| Error Component
|--------------------------------------------------------------------------
*/

const TenancyError = ({
  message,
  onRetry,
  loading = false,
}) => {
  return (
    <section
      className="
        rounded-2xl
        border
        border-red-200
        bg-red-50
        p-6
        dark:border-red-900/50
        dark:bg-red-950/20
      "
      role="alert"
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div
          className="
            mb-4
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-red-100
            text-red-600
            dark:bg-red-950/60
            dark:text-red-400
          "
        >
          <AlertCircle
            className="h-7 w-7"
            aria-hidden="true"
          />
        </div>

        <h3
          className="
            text-base
            font-semibold
            text-red-900
            dark:text-red-200
          "
        >
          Failed to load tenancies
        </h3>

        <p
          className="
            mt-1
            max-w-lg
            text-sm
            leading-6
            text-red-700
            dark:text-red-300
          "
        >
          {message ||
            "Something went wrong while loading tenancies."}
        </p>

        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className="
            mt-5
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-red-600
            px-4
            py-2.5
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-red-700
            focus:outline-none
            focus:ring-2
            focus:ring-red-500
            focus:ring-offset-2
            disabled:cursor-not-allowed
            disabled:opacity-60
            dark:focus:ring-offset-gray-900
          "
        >
          <RefreshCw
            className={
              `h-4 w-4 ${loading
                ? "animate-spin"
                : ""
              }`
            }
            aria-hidden="true"
          />

          {loading
            ? "Retrying..."
            : "Try again"}
        </button>
      </div>
    </section>
  );
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Normalize nullable values before sending
 * them to the API.
 */
const cleanValue = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return value;
};

/**
 * Normalize tenancy collections returned
 * by Redux/API.
 */
const normalizeTenancies = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    value &&
    Array.isArray(value.data)
  ) {
    return value.data;
  }

  if (
    value?.data &&
    Array.isArray(value.data.data)
  ) {
    return value.data.data;
  }

  return [];
};

/*
|--------------------------------------------------------------------------
| Tenancy List
|--------------------------------------------------------------------------
*/

const TenancyList = () => {
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | Redux State
  |--------------------------------------------------------------------------
  */

  const tenancies = useSelector(
    selectTenancies
  );

  const pagination = useSelector(
    selectTenancyPagination
  );

  const filters = useSelector(
    selectTenancyFilters
  );

  const loading = useSelector(
    selectTenancyLoading
  );

  const error = useSelector(
    selectTenancyError
  );

  const statistics = useSelector(
    selectTenancyStatistics
  );

  /*
  |--------------------------------------------------------------------------
  | Request Tracking
  |--------------------------------------------------------------------------
  */

  const initialRequestRef =
    useRef(false);

  const initialRequestCompletedRef =
    useRef(false);

  const previousFiltersRef =
    useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Initial Request State
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | We intentionally start with false.
  |
  | This allows the UI to show the initial loader
  | immediately after a browser refresh, before
  | Redux has updated loading=true.
  |
  */

  const [
    initialRequestCompleted,
    setInitialRequestCompleted,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Normalize Tenancies
  |--------------------------------------------------------------------------
  */

  const tenancyData = useMemo(() => {
    const normalized =
      normalizeTenancies(tenancies);

    return normalized.filter(
      (tenancy) =>
        tenancy &&
        typeof tenancy === "object"
    );
  }, [tenancies]);

  /*
  |--------------------------------------------------------------------------
  | API Request Filters
  |--------------------------------------------------------------------------
  */

  const requestFilters = useMemo(
    () => ({
      page:
        Number(filters?.page) || 1,

      per_page:
        Number(filters?.per_page) ||
        DEFAULT_PER_PAGE,

      search:
        cleanValue(
          filters?.search
        ),

      status:
        cleanValue(
          filters?.status
        ),

      property_id:
        cleanValue(
          filters?.property_id
        ),

      apartment_id:
        cleanValue(
          filters?.apartment_id
        ),

      unit_id:
        cleanValue(
          filters?.unit_id
        ),

      tenant_id:
        cleanValue(
          filters?.tenant_id
        ),

      payment_frequency:
        cleanValue(
          filters?.payment_frequency
        ),

      start_date:
        cleanValue(
          filters?.start_date
        ),

      end_date:
        cleanValue(
          filters?.end_date
        ),

      sort_by:
        cleanValue(
          filters?.sort_by
        ),

      sort_order:
        cleanValue(
          filters?.sort_order
        ),
    }),
    [
      filters?.page,
      filters?.per_page,
      filters?.search,
      filters?.status,
      filters?.property_id,
      filters?.apartment_id,
      filters?.unit_id,
      filters?.tenant_id,
      filters?.payment_frequency,
      filters?.start_date,
      filters?.end_date,
      filters?.sort_by,
      filters?.sort_order,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Loading States
  |--------------------------------------------------------------------------
  |
  | Initial loading:
  |
  | - Browser refresh
  | - First page load
  | - First tenancy request
  |
  | Refreshing:
  |
  | - Existing tenancy data is already visible
  | - A new request is running
  |
  */

  const initialLoading =
    !initialRequestCompleted;

  const refreshing =
    initialRequestCompleted &&
    loading;

  /*
  |--------------------------------------------------------------------------
  | Error Message
  |--------------------------------------------------------------------------
  */

  const errorMessage = useMemo(() => {
    if (!error) {
      return null;
    }

    if (typeof error === "string") {
      return error;
    }

    if (
      typeof error?.message === "string" &&
      error.message.trim()
    ) {
      return error.message;
    }

    if (
      typeof error?.error === "string" &&
      error.error.trim()
    ) {
      return error.error;
    }

    if (
      typeof error?.errors?.message ===
      "string" &&
      error.errors.message.trim()
    ) {
      return error.errors.message;
    }

    if (
      typeof error?.response?.data?.message ===
      "string" &&
      error.response.data.message.trim()
    ) {
      return error.response.data.message;
    }

    return "Unable to load tenancies.";
  }, [error]);

  /*
  |--------------------------------------------------------------------------
  | Filter State
  |--------------------------------------------------------------------------
  */

  const hasFilters = useMemo(
    () =>
      Boolean(
        filters?.search ||
        filters?.status ||
        filters?.property_id ||
        filters?.apartment_id ||
        filters?.unit_id ||
        filters?.tenant_id ||
        filters?.payment_frequency ||
        filters?.start_date ||
        filters?.end_date
      ),
    [
      filters?.search,
      filters?.status,
      filters?.property_id,
      filters?.apartment_id,
      filters?.unit_id,
      filters?.tenant_id,
      filters?.payment_frequency,
      filters?.start_date,
      filters?.end_date,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Pagination Total
  |--------------------------------------------------------------------------
  */

  const total = useMemo(() => {
    const value = Number(
      pagination?.total
    );

    if (
      Number.isFinite(value) &&
      value >= 0
    ) {
      return value;
    }

    return tenancyData.length;
  }, [
    pagination?.total,
    tenancyData.length,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Load Tenancies
  |--------------------------------------------------------------------------
  */

  const loadTenancies = useCallback(
    async (customFilters) => {
      const finalFilters =
        customFilters ||
        requestFilters;

      try {
        const result =
          await dispatch(
            fetchTenancies(
              finalFilters
            )
          );

        /*
         * Mark the first request as complete
         * only after the Redux thunk resolves.
         */
        if (
          !initialRequestCompletedRef.current
        ) {
          initialRequestCompletedRef.current =
            true;

          setInitialRequestCompleted(
            true
          );
        }

        return result;
      } catch (requestError) {
        /*
         * Even if the request fails, the initial
         * loading screen must stop so the error
         * component can be displayed.
         */
        if (
          !initialRequestCompletedRef.current
        ) {
          initialRequestCompletedRef.current =
            true;

          setInitialRequestCompleted(
            true
          );
        }

        throw requestError;
      }
    },
    [
      dispatch,
      requestFilters,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Initial Fetch
  |--------------------------------------------------------------------------
  |
  | This runs immediately when the page mounts.
  |
  | Because initialLoading is based on
  | initialRequestCompleted instead of Redux loading,
  | the loader is visible immediately during a
  | browser refresh.
  |
  */

  useEffect(() => {
    if (initialRequestRef.current) {
      return;
    }

    initialRequestRef.current = true;

    previousFiltersRef.current =
      requestFilters;

    loadTenancies(
      requestFilters
    ).catch(() => {
      /*
       * Redux manages the request error.
       */
    });
  }, [
    loadTenancies,
    requestFilters,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Refetch When Filters Change
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!initialRequestCompleted) {
      return;
    }

    const previous =
      previousFiltersRef.current;

    if (!previous) {
      previousFiltersRef.current =
        requestFilters;

      return;
    }

    const changed =
      JSON.stringify(previous) !==
      JSON.stringify(requestFilters);

    if (!changed) {
      return;
    }

    previousFiltersRef.current =
      requestFilters;

    loadTenancies(
      requestFilters
    ).catch(() => {
      /*
       * Redux manages rejected requests.
       */
    });
  }, [
    initialRequestCompleted,
    requestFilters,
    loadTenancies,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Retry
  |--------------------------------------------------------------------------
  */

  const handleRetry =
    useCallback(() => {
      dispatch(
        clearTenancyError()
      );

      previousFiltersRef.current =
        requestFilters;

      return loadTenancies(
        requestFilters
      ).catch(() => {
        /*
         * Redux manages the error state.
         */
      });
    }, [
      dispatch,
      loadTenancies,
      requestFilters,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Clear Filters
  |--------------------------------------------------------------------------
  */

  const handleClearFilters =
    useCallback(() => {
      dispatch(
        setTenancyFilters({
          search: "",
          status: "",
          property_id: "",
          apartment_id: "",
          unit_id: "",
          tenant_id: "",
          payment_frequency: "",
          start_date: "",
          end_date: "",
          sort_by: "created_at",
          sort_order: "desc",
          per_page:
            DEFAULT_PER_PAGE,
          page: 1,
        })
      );
    }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | Filter Change
  |--------------------------------------------------------------------------
  */

  const handleFiltersChange =
    useCallback(
      (nextFilters) => {
        dispatch(
          setTenancyFilters({
            ...(nextFilters || {}),
            page: 1,
          })
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | Pagination Change
  |--------------------------------------------------------------------------
  */

  const handlePageChange =
    useCallback(
      (page) => {
        dispatch(
          setTenancyFilters({
            page:
              Number(page) || 1,
          })
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | Per Page Change
  |--------------------------------------------------------------------------
  */

  const handlePerPageChange =
    useCallback(
      (perPage) => {
        dispatch(
          setTenancyFilters({
            per_page:
              Number(perPage) ||
              DEFAULT_PER_PAGE,
            page: 1,
          })
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">

      {/* ================================================================
          HEADER
      ================================================================ */}

      <TenancyHeader />

      {/* ================================================================
          STATISTICS
      ================================================================ */}

      <TenancyStats
        statistics={statistics}
        loading={loading}
      />

      {/* ================================================================
          FILTERS
      ================================================================ */}

      <TenancyFilters
        filters={filters}
        onChange={
          handleFiltersChange
        }
        onReset={
          handleClearFilters
        }
        onApply={
          handleFiltersChange
        }
        loading={loading}
      />

      {/* ================================================================
          INITIAL LOADING
      ================================================================ */}

      {initialLoading && (
        <TenancyLoading />
      )}

      {/* ================================================================
          INITIAL ERROR
      ================================================================ */}

      {!initialLoading &&
        errorMessage &&
        tenancyData.length === 0 && (
          <TenancyError
            message={errorMessage}
            onRetry={handleRetry}
            loading={loading}
          />
        )}

      {/* ================================================================
          TENANCY DATA
      ================================================================ */}

      {!initialLoading &&
        tenancyData.length > 0 && (
          <>
            <div
              className="
                relative
                overflow-hidden
                rounded-2xl
              "
            >
              <TenancyTable
                tenancies={tenancyData}
                loading={refreshing}
              />

              {/* ========================================================
                  TABLE REFRESH OVERLAY
              ======================================================== */}

              {refreshing && (
                <div
                  className="
                    absolute
                    inset-0
                    z-10
                    flex
                    items-center
                    justify-center
                    bg-white/50
                    backdrop-blur-[1px]
                    dark:bg-gray-900/50
                  "
                  role="status"
                  aria-live="polite"
                  aria-label="Refreshing tenancies"
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      px-4
                      py-3
                      text-sm
                      font-medium
                      text-gray-700
                      shadow-lg
                      dark:border-gray-700
                      dark:bg-gray-800
                      dark:text-gray-200
                    "
                  >
                    <Loader2
                      className="
                        h-5
                        w-5
                        animate-spin
                        text-indigo-600
                        dark:text-indigo-400
                      "
                      aria-hidden="true"
                    />

                    Refreshing tenancies...
                  </div>
                </div>
              )}
            </div>

            {/* ==========================================================
                BACKGROUND REFRESH ERROR
            ========================================================== */}

            {errorMessage && (
              <div
                className="
                  flex
                  flex-col
                  gap-3
                  rounded-xl
                  border
                  border-amber-200
                  bg-amber-50
                  px-4
                  py-3
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  dark:border-amber-900/50
                  dark:bg-amber-950/20
                "
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className="
                      mt-0.5
                      h-4
                      w-4
                      shrink-0
                      text-amber-600
                      dark:text-amber-400
                    "
                  />

                  <div>
                    <p
                      className="
                        text-xs
                        font-semibold
                        text-amber-800
                        dark:text-amber-300
                      "
                    >
                      Unable to refresh tenancy data.
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-xs
                        text-amber-700
                        dark:text-amber-400
                      "
                    >
                      {errorMessage}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={loading}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    self-start
                    rounded-lg
                    border
                    border-amber-300
                    bg-white
                    px-3
                    py-2
                    text-xs
                    font-semibold
                    text-amber-800
                    transition
                    hover:bg-amber-100
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    sm:self-auto
                    dark:border-amber-800
                    dark:bg-amber-950/30
                    dark:text-amber-300
                    dark:hover:bg-amber-950/50
                  "
                >
                  <RefreshCw
                    className={
                      `h-3.5 w-3.5 ${loading
                        ? "animate-spin"
                        : ""
                      }`
                    }
                  />

                  Retry
                </button>
              </div>
            )}

            {/* ==========================================================
                PAGINATION
            ========================================================== */}

            <TenancyPagination
              pagination={{
                ...pagination,
                total,
              }}
              onPageChange={
                handlePageChange
              }
              onPerPageChange={
                handlePerPageChange
              }
              loading={loading}
            />
          </>
        )}

      {/* ================================================================
          EMPTY STATE
      ================================================================ */}

      {!initialLoading &&
        !loading &&
        !errorMessage &&
        initialRequestCompleted &&
        tenancyData.length === 0 && (
          <TenancyEmptyState
            hasFilters={hasFilters}
            searchQuery={
              filters?.search || ""
            }
            onCreate={() => {
              window.location.href =
                "/super-admin/tenancies/create";
            }}
            onClearFilters={
              handleClearFilters
            }
            onRetry={handleRetry}
            showCreateButton={
              !hasFilters
            }
            showRetryButton={false}
            loading={loading}
          />
        )}

      {/* ================================================================
          GLOBAL REFRESH INDICATOR
      ================================================================ */}

      {refreshing && (
        <div
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-indigo-100
            bg-indigo-50
            px-4
            py-2.5
            text-sm
            font-medium
            text-indigo-700
            dark:border-indigo-900/50
            dark:bg-indigo-950/30
            dark:text-indigo-300
          "
          role="status"
          aria-live="polite"
        >
          <Loader2
            className="
              h-4
              w-4
              animate-spin
            "
            aria-hidden="true"
          />

          Updating tenancy records...
        </div>
      )}
    </div>
  );
};

export default TenancyList;