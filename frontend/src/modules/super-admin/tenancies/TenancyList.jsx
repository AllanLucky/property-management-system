// frontend/src/modules/super-admin/tenancies/TenancyList.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

/*
|--------------------------------------------------------------------------
| Debug Configuration
|--------------------------------------------------------------------------
|
| Set this to false when you no longer want tenancy console logs.
|
*/

const TENANCY_DEBUG = true;

/*
|--------------------------------------------------------------------------
| Debug Helpers
|--------------------------------------------------------------------------
*/

const tenancyLog = (...args) => {
  if (!TENANCY_DEBUG) {
    return;
  }

  console.log(
    "[TenancyList]",
    ...args
  );
};

const tenancyGroup = (
  title,
  callback
) => {
  if (!TENANCY_DEBUG) {
    callback?.();
    return;
  }

  console.group(
    `[TenancyList] ${title}`
  );

  try {
    callback?.();
  } finally {
    console.groupEnd();
  }
};

/*
|--------------------------------------------------------------------------
| Loading Component
|--------------------------------------------------------------------------
*/

const TenancyLoading = () => {
  return (
    <div
      className="flex min-h-[300px] items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm"
      role="status"
      aria-live="polite"
      aria-label="Loading tenancies"
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <Loader2
          className="h-8 w-8 animate-spin text-gray-600"
          aria-hidden="true"
        />

        <p className="text-sm font-medium text-gray-600">
          Loading tenancies...
        </p>
      </div>
    </div>
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
    <div
      className="rounded-xl border border-red-200 bg-red-50 p-6"
      role="alert"
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle
            className="h-6 w-6 text-red-600"
            aria-hidden="true"
          />
        </div>

        <h3 className="text-base font-semibold text-red-800">
          Failed to load tenancies
        </h3>

        <p className="mt-1 max-w-lg text-sm text-red-600">
          {message ||
            "Something went wrong while loading tenancies."}
        </p>

        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading
              ? "animate-spin"
              : ""
              }`}
            aria-hidden="true"
          />

          {loading
            ? "Retrying..."
            : "Try again"}
        </button>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Empty Component
|--------------------------------------------------------------------------
*/

const TenancyEmpty = ({
  hasFilters,
  onClearFilters,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <AlertCircle
            className="h-7 w-7 text-gray-400"
            aria-hidden="true"
          />
        </div>

        <h3 className="text-base font-semibold text-gray-900">
          No tenancies found
        </h3>

        <p className="mt-1 max-w-md text-sm text-gray-500">
          {hasFilters
            ? "No tenancies match your current filters."
            : "There are no tenancies available yet."}
        </p>

        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Helper: Normalize Value
|--------------------------------------------------------------------------
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
  | Initial Request Tracking
  |--------------------------------------------------------------------------
  */

  const initialRequestRef =
    useRef(false);

  /*
  |--------------------------------------------------------------------------
  | Request Counter
  |--------------------------------------------------------------------------
  |
  | Useful for identifying duplicate requests.
  |
  */

  const requestCountRef =
    useRef(0);

  /*
  |--------------------------------------------------------------------------
  | Normalize Tenancy Data
  |--------------------------------------------------------------------------
  */

  const tenancyData = useMemo(() => {
    /*
     * Case 1:
     *
     * Redux already contains:
     *
     * [
     *   {...},
     *   {...}
     * ]
     */

    if (Array.isArray(tenancies)) {
      return tenancies;
    }

    /*
     * Case 2:
     *
     * Redux contains:
     *
     * {
     *   data: [...]
     * }
     */

    if (
      tenancies &&
      Array.isArray(
        tenancies.data
      )
    ) {
      return tenancies.data;
    }

    /*
     * Case 3:
     *
     * Redux contains:
     *
     * {
     *   data: {
     *     data: [...]
     *   }
     * }
     */

    if (
      tenancies &&
      tenancies.data &&
      Array.isArray(
        tenancies.data.data
      )
    ) {
      return tenancies.data.data;
    }

    /*
     * Case 4:
     *
     * Laravel paginator:
     *
     * {
     *   current_page: 1,
     *   data: [...]
     * }
     */

    if (
      tenancies &&
      Array.isArray(
        tenancies.data
      )
    ) {
      return tenancies.data;
    }

    return [];
  }, [tenancies]);

  /*
  |--------------------------------------------------------------------------
  | API Request Filters
  |--------------------------------------------------------------------------
  */

  const requestFilters = useMemo(() => {
    const normalizedFilters = {
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
    };

    return normalizedFilters;
  }, [
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
  ]);

  /*
  |--------------------------------------------------------------------------
  | Load Tenancies
  |--------------------------------------------------------------------------
  */

  const loadTenancies = useCallback(
    (
      customFilters = requestFilters
    ) => {
      requestCountRef.current += 1;

      const requestNumber =
        requestCountRef.current;

      tenancyGroup(
        `REQUEST #${requestNumber}`,
        () => {
          tenancyLog(
            "Dispatching fetchTenancies..."
          );

          tenancyLog(
            "Request filters:",
            customFilters
          );

          tenancyLog(
            "Current Redux tenancies before request:",
            tenancies
          );

          tenancyLog(
            "Current normalized tenancy count:",
            tenancyData.length
          );

          tenancyLog(
            "Current loading:",
            loading
          );

          tenancyLog(
            "Current error:",
            error
          );
        }
      );

      const action = dispatch(
        fetchTenancies(
          customFilters
        )
      );

      /*
       * Log thunk result.
       *
       * This is especially useful for detecting
       * rejected API requests.
       */

      action
        ?.then?.((result) => {
          tenancyGroup(
            `REQUEST #${requestNumber} RESULT`,
            () => {
              tenancyLog(
                "Thunk result:",
                result
              );

              tenancyLog(
                "Thunk type:",
                result?.type
              );

              tenancyLog(
                "Thunk payload:",
                result?.payload
              );

              tenancyLog(
                "Thunk meta:",
                result?.meta
              );

              if (
                result?.meta?.requestStatus ===
                "fulfilled"
              ) {
                tenancyLog(
                  "Request completed successfully."
                );
              }

              if (
                result?.meta?.requestStatus ===
                "rejected"
              ) {
                console.error(
                  "[TenancyList] Request rejected:",
                  result
                );
              }
            }
          );
        })
        ?.catch?.((requestError) => {
          console.error(
            `[TenancyList] REQUEST #${requestNumber} promise error:`,
            requestError
          );
        });

      return action;
    },
    [
      dispatch,
      requestFilters,
      tenancies,
      tenancyData.length,
      loading,
      error,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Log Redux State
  |--------------------------------------------------------------------------
  |
  | This effect runs whenever the relevant Redux data changes.
  |
  | This will help identify whether the problem is:
  |
  | API -> service -> thunk -> Redux -> component
  |
  */

  useEffect(() => {
    tenancyGroup(
      "REDUX STATE",
      () => {
        tenancyLog(
          "Raw tenancies:",
          tenancies
        );

        tenancyLog(
          "Raw tenancies type:",
          Array.isArray(tenancies)
            ? "array"
            : typeof tenancies
        );

        tenancyLog(
          "Raw tenancy count:",
          Array.isArray(tenancies)
            ? tenancies.length
            : "not an array"
        );

        tenancyLog(
          "Normalized tenancyData:",
          tenancyData
        );

        tenancyLog(
          "Normalized tenancy count:",
          tenancyData.length
        );

        tenancyLog(
          "Pagination:",
          pagination
        );

        tenancyLog(
          "Filters:",
          filters
        );

        tenancyLog(
          "Request filters:",
          requestFilters
        );

        tenancyLog(
          "Loading:",
          loading
        );

        tenancyLog(
          "Error:",
          error
        );

        tenancyLog(
          "Statistics:",
          statistics
        );
      }
    );
  }, [
    tenancies,
    tenancyData,
    pagination,
    filters,
    requestFilters,
    loading,
    error,
    statistics,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Log First Tenancy
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      tenancyData.length === 0
    ) {
      tenancyLog(
        "No normalized tenancy records available."
      );

      return;
    }

    tenancyLog(
      "First tenancy record:",
      tenancyData[0]
    );

    tenancyLog(
      "Tenancy IDs:",
      tenancyData.map(
        (tenancy) =>
          tenancy?.id
      )
    );

    tenancyLog(
      "Tenancy numbers:",
      tenancyData.map(
        (tenancy) =>
          tenancy?.tenancy_number
      )
    );
  }, [tenancyData]);

  /*
  |--------------------------------------------------------------------------
  | Initial Fetch
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      initialRequestRef.current
    ) {
      tenancyLog(
        "Initial request already executed. Skipping."
      );

      return;
    }

    initialRequestRef.current = true;

    tenancyGroup(
      "INITIAL LOAD",
      () => {
        tenancyLog(
          "Initial tenancy request starting..."
        );

        tenancyLog(
          "Initial request filters:",
          requestFilters
        );
      }
    );

    loadTenancies(
      requestFilters
    );
  }, [
    loadTenancies,
    requestFilters,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Previous Request Filters
  |--------------------------------------------------------------------------
  */

  const previousFiltersRef =
    useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Refetch When Filters Change
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !initialRequestRef.current
    ) {
      return;
    }

    const previous =
      previousFiltersRef.current;

    /*
     * First execution after initial request.
     */

    if (previous === null) {
      previousFiltersRef.current =
        requestFilters;

      tenancyLog(
        "Stored initial request filters. No duplicate request."
      );

      return;
    }

    const previousString =
      JSON.stringify(
        previous
      );

    const currentString =
      JSON.stringify(
        requestFilters
      );

    const changed =
      previousString !==
      currentString;

    tenancyGroup(
      "FILTER COMPARISON",
      () => {
        tenancyLog(
          "Previous filters:",
          previous
        );

        tenancyLog(
          "Current filters:",
          requestFilters
        );

        tenancyLog(
          "Filters changed:",
          changed
        );
      }
    );

    if (!changed) {
      return;
    }

    previousFiltersRef.current =
      requestFilters;

    tenancyLog(
      "Filters changed. Reloading tenancies..."
    );

    loadTenancies(
      requestFilters
    );
  }, [
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
      tenancyGroup(
        "RETRY",
        () => {
          tenancyLog(
            "Retry clicked."
          );

          tenancyLog(
            "Retry filters:",
            requestFilters
          );

          tenancyLog(
            "Current tenancy count:",
            tenancyData.length
          );
        }
      );

      dispatch(
        clearTenancyError()
      );

      previousFiltersRef.current =
        requestFilters;

      loadTenancies(
        requestFilters
      );
    }, [
      dispatch,
      loadTenancies,
      requestFilters,
      tenancyData.length,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Clear Filters
  |--------------------------------------------------------------------------
  */

  const handleClearFilters =
    useCallback(() => {
      const clearedFilters = {
        search: "",
        status: "",
        property_id: "",
        apartment_id: "",
        unit_id: "",
        tenant_id: "",
        payment_frequency: "",
        start_date: "",
        end_date: "",
        sort_by: "",
        sort_order: "",
        per_page:
          DEFAULT_PER_PAGE,
        page: 1,
      };

      tenancyLog(
        "Clearing tenancy filters:",
        clearedFilters
      );

      dispatch(
        setTenancyFilters(
          clearedFilters
        )
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
        const updatedFilters = {
          ...(nextFilters || {}),
          page: 1,
        };

        tenancyLog(
          "Tenancy filters changed:",
          updatedFilters
        );

        dispatch(
          setTenancyFilters(
            updatedFilters
          )
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
        const nextPage =
          Number(page) || 1;

        tenancyLog(
          "Tenancy page changed:",
          nextPage
        );

        dispatch(
          setTenancyFilters({
            page: nextPage,
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
        const nextPerPage =
          Number(perPage) ||
          DEFAULT_PER_PAGE;

        tenancyLog(
          "Tenancies per page changed:",
          nextPerPage
        );

        dispatch(
          setTenancyFilters({
            per_page:
              nextPerPage,
            page: 1,
          })
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | Has Filters
  |--------------------------------------------------------------------------
  */

  const hasFilters = useMemo(() => {
    return Boolean(
      filters?.search ||
      filters?.status ||
      filters?.property_id ||
      filters?.apartment_id ||
      filters?.unit_id ||
      filters?.tenant_id ||
      filters?.payment_frequency ||
      filters?.start_date ||
      filters?.end_date
    );
  }, [
    filters?.search,
    filters?.status,
    filters?.property_id,
    filters?.apartment_id,
    filters?.unit_id,
    filters?.tenant_id,
    filters?.payment_frequency,
    filters?.start_date,
    filters?.end_date,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Pagination Total
  |--------------------------------------------------------------------------
  */

  const total = useMemo(() => {
    const paginationTotal =
      Number(
        pagination?.total
      );

    if (
      Number.isFinite(
        paginationTotal
      ) &&
      paginationTotal >= 0
    ) {
      return paginationTotal;
    }

    return tenancyData.length;
  }, [
    pagination?.total,
    tenancyData.length,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Error Message
  |--------------------------------------------------------------------------
  */

  const errorMessage =
    useMemo(() => {
      if (!error) {
        return null;
      }

      if (
        typeof error ===
        "string"
      ) {
        return error;
      }

      return (
        error?.message ||
        error?.error ||
        error?.errors?.message ||
        "Unable to load tenancies."
      );
    }, [error]);

  /*
  |--------------------------------------------------------------------------
  | Loading States
  |--------------------------------------------------------------------------
  */

  const initialLoading =
    loading &&
    tenancyData.length === 0;

  const refreshing =
    loading &&
    tenancyData.length > 0;

  /*
  |--------------------------------------------------------------------------
  | Render Decision Logging
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    tenancyGroup(
      "RENDER STATE",
      () => {
        tenancyLog(
          "tenancyData.length:",
          tenancyData.length
        );

        tenancyLog(
          "initialLoading:",
          initialLoading
        );

        tenancyLog(
          "refreshing:",
          refreshing
        );

        tenancyLog(
          "errorMessage:",
          errorMessage
        );

        tenancyLog(
          "hasFilters:",
          hasFilters
        );

        tenancyLog(
          "total:",
          total
        );

        if (
          initialLoading
        ) {
          tenancyLog(
            "UI decision: SHOW LOADING"
          );
        } else if (
          errorMessage
        ) {
          tenancyLog(
            "UI decision: SHOW ERROR"
          );
        } else if (
          tenancyData.length > 0
        ) {
          tenancyLog(
            "UI decision: SHOW TABLE"
          );
        } else {
          tenancyLog(
            "UI decision: SHOW EMPTY STATE"
          );

          console.warn(
            "[TenancyList] EMPTY STATE ACTIVE",
            {
              rawTenancies:
                tenancies,
              normalizedTenancies:
                tenancyData,
              filters,
              requestFilters,
              pagination,
              loading,
              error,
            }
          );
        }
      }
    );
  }, [
    tenancyData,
    initialLoading,
    refreshing,
    errorMessage,
    hasFilters,
    total,
    tenancies,
    filters,
    requestFilters,
    pagination,
    loading,
    error,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">

      {/* ------------------------------------------------------------------
          Header
      ------------------------------------------------------------------ */}

      <TenancyHeader />

      {/* ------------------------------------------------------------------
          Statistics
      ------------------------------------------------------------------ */}

      <TenancyStats
        statistics={statistics}
        loading={loading}
      />

      {/* ------------------------------------------------------------------
          Filters
      ------------------------------------------------------------------ */}

      <TenancyFilters
        filters={filters}
        onChange={
          handleFiltersChange
        }
        onClear={
          handleClearFilters
        }
        loading={loading}
      />

      {/* ------------------------------------------------------------------
          Error
      ------------------------------------------------------------------ */}

      {errorMessage &&
        !initialLoading && (
          <TenancyError
            message={errorMessage}
            onRetry={handleRetry}
            loading={loading}
          />
        )}

      {/* ------------------------------------------------------------------
          Initial Loading
      ------------------------------------------------------------------ */}

      {initialLoading && (
        <TenancyLoading />
      )}

      {/* ------------------------------------------------------------------
          Table
      ------------------------------------------------------------------ */}

      {!initialLoading &&
        !errorMessage &&
        tenancyData.length >
        0 && (
          <>
            <TenancyTable
              tenancies={
                tenancyData
              }
              loading={
                false
              }
            />

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
              loading={
                loading
              }
            />
          </>
        )}

      {/* ------------------------------------------------------------------
          Empty State
      ------------------------------------------------------------------ */}

      {!initialLoading &&
        !errorMessage &&
        tenancyData.length ===
        0 && (
          <TenancyEmpty
            hasFilters={
              hasFilters
            }
            onClearFilters={
              handleClearFilters
            }
          />
        )}

      {/* ------------------------------------------------------------------
          Refreshing Existing Data
      ------------------------------------------------------------------ */}

      {refreshing && (
        <div
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2
            className="h-4 w-4 animate-spin"
            aria-hidden="true"
          />

          <span>
            Updating tenancies...
          </span>
        </div>
      )}
    </div>
  );
};

export default TenancyList;