import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
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
| Loading Component
|--------------------------------------------------------------------------
*/

const TenancyLoading = () => {
  return (
    <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
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

const TenancyError = ({ message, onRetry, loading = false }) => {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
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
            className={`h-4 w-4 ${loading ? "animate-spin" : ""
              }`}
            aria-hidden="true"
          />

          {loading ? "Retrying..." : "Try again"}
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

  const tenancies = useSelector(selectTenancies);
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
  | Prevent Duplicate Initial Request
  |--------------------------------------------------------------------------
  */

  const initialRequestRef = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | Normalize Tenancy Data
  |--------------------------------------------------------------------------
  |
  | Backend response:
  |
  | {
  |   status: true,
  |   code: 200,
  |   message: "...",
  |   data: [...]
  | }
  |
  | Redux already converts this into an array.
  | This extra normalization makes the component
  | tolerant of nested/paginated responses as well.
  |
  */

  const tenancyData = useMemo(() => {
    if (Array.isArray(tenancies)) {
      return tenancies;
    }

    if (
      tenancies &&
      Array.isArray(tenancies.data)
    ) {
      return tenancies.data;
    }

    if (
      tenancies &&
      Array.isArray(tenancies.data?.data)
    ) {
      return tenancies.data.data;
    }

    return [];
  }, [tenancies]);

  /*
  |--------------------------------------------------------------------------
  | Stable API Filters
  |--------------------------------------------------------------------------
  |
  | Only send filters that are actually supported by
  | the tenancy backend.
  |
  */

  const requestFilters = useMemo(() => {
    return {
      page: Number(filters?.page) || 1,

      per_page:
        Number(filters?.per_page) || 15,

      search: cleanValue(filters?.search),

      status: cleanValue(filters?.status),

      property_id:
        cleanValue(filters?.property_id),

      apartment_id:
        cleanValue(filters?.apartment_id),

      unit_id:
        cleanValue(filters?.unit_id),

      tenant_id:
        cleanValue(filters?.tenant_id),

      payment_frequency:
        cleanValue(
          filters?.payment_frequency
        ),

      start_date:
        cleanValue(filters?.start_date),

      end_date:
        cleanValue(filters?.end_date),

      sort_by:
        cleanValue(filters?.sort_by),

      sort_direction:
        cleanValue(filters?.sort_direction),
    };
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
    filters?.sort_direction,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Load Tenancies
  |--------------------------------------------------------------------------
  */

  const loadTenancies = useCallback(() => {
    dispatch(
      fetchTenancies(requestFilters)
    );
  }, [dispatch, requestFilters]);

  /*
  |--------------------------------------------------------------------------
  | Initial Fetch
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    /*
     * The first request is handled separately so that
     * React StrictMode does not accidentally produce
     * duplicate development requests.
     */
    if (!initialRequestRef.current) {
      initialRequestRef.current = true;

      loadTenancies();
    }
  }, [loadTenancies]);

  /*
  |--------------------------------------------------------------------------
  | Refetch When Filters Change
  |--------------------------------------------------------------------------
  */

  const previousFiltersRef = useRef(
    requestFilters
  );

  useEffect(() => {
    if (
      !initialRequestRef.current
    ) {
      return;
    }

    const previous =
      previousFiltersRef.current;

    const changed =
      JSON.stringify(previous) !==
      JSON.stringify(requestFilters);

    if (changed) {
      previousFiltersRef.current =
        requestFilters;

      loadTenancies();
    }
  }, [
    requestFilters,
    loadTenancies,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Retry
  |--------------------------------------------------------------------------
  */

  const handleRetry = useCallback(() => {
    dispatch(clearTenancyError());

    loadTenancies();
  }, [
    dispatch,
    loadTenancies,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Clear Filters
  |--------------------------------------------------------------------------
  */

  const handleClearFilters = useCallback(() => {
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
        sort_direction: "desc",
        per_page: 15,
        page: 1,
      })
    );
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | Filter Change
  |--------------------------------------------------------------------------
  */

  const handleFiltersChange = useCallback(
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

  const handlePageChange = useCallback(
    (page) => {
      const nextPage =
        Number(page) || 1;

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
          Number(perPage) || 15;

        dispatch(
          setTenancyFilters({
            per_page: nextPerPage,
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
  | Pagination
  |--------------------------------------------------------------------------
  */

  const total = useMemo(() => {
    if (
      pagination &&
      Number.isFinite(
        Number(pagination.total)
      )
    ) {
      return Number(
        pagination.total
      );
    }

    return tenancyData.length;
  }, [
    pagination,
    tenancyData.length,
  ]);

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

    return (
      error?.message ||
      error?.error ||
      "Unable to load tenancies."
    );
  }, [error]);

  /*
  |--------------------------------------------------------------------------
  | Initial Loading
  |--------------------------------------------------------------------------
  */

  const initialLoading =
    loading &&
    tenancyData.length === 0;

  /*
  |--------------------------------------------------------------------------
  | Refreshing Existing Data
  |--------------------------------------------------------------------------
  */

  const refreshing =
    loading &&
    tenancyData.length > 0;

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
        onChange={handleFiltersChange}
        onClear={handleClearFilters}
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
        tenancyData.length > 0 && (
          <>
            <TenancyTable
              tenancies={tenancyData}
              loading={loading}
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
              loading={loading}
            />
          </>
        )}

      {/* ------------------------------------------------------------------
          Empty State
      ------------------------------------------------------------------ */}

      {!initialLoading &&
        !errorMessage &&
        tenancyData.length === 0 && (
          <TenancyEmpty
            hasFilters={hasFilters}
            onClearFilters={
              handleClearFilters
            }
          />
        )}

      {/* ------------------------------------------------------------------
          Refreshing Existing Data
      ------------------------------------------------------------------ */}

      {refreshing && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
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