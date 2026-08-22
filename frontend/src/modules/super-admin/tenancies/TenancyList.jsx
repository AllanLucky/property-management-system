import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

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

import {
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Loading Spinner
|--------------------------------------------------------------------------
*/

const TenancyLoading = () => {
  return (
    <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />

        <p className="text-sm font-medium text-gray-600">
          Loading tenancies...
        </p>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Error State
|--------------------------------------------------------------------------
*/

const TenancyError = ({ message, onRetry }) => {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>

        <h3 className="text-base font-semibold text-red-800">
          Failed to load tenancies
        </h3>

        <p className="mt-1 max-w-lg text-sm text-red-600">
          {message || "Something went wrong while loading tenancies."}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

const TenancyEmpty = ({ hasFilters, onClearFilters }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-10">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <AlertCircle className="h-7 w-7 text-gray-400" />
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
            className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
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
  const pagination = useSelector(selectTenancyPagination);
  const filters = useSelector(selectTenancyFilters);
  const loading = useSelector(selectTenancyLoading);
  const error = useSelector(selectTenancyError);
  const statistics = useSelector(selectTenancyStatistics);

  /*
  |--------------------------------------------------------------------------
  | Initial Fetch
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | Do NOT create a loadTenancies function and leave it unused.
  |
  | The thunk is dispatched directly here.
  |
  */

  useEffect(() => {
    dispatch(fetchTenancies(filters));
  }, [dispatch, filters]);

  /*
  |--------------------------------------------------------------------------
  | Retry
  |--------------------------------------------------------------------------
  */

  const handleRetry = () => {
    dispatch(clearTenancyError());
    dispatch(fetchTenancies(filters));
  };

  /*
  |--------------------------------------------------------------------------
  | Clear Filters
  |--------------------------------------------------------------------------
  */

  const handleClearFilters = () => {
    dispatch(
      setTenancyFilters({
        search: "",
        status: "",
        property_id: "",
        apartment_id: "",
        unit_id: "",
        tenant_id: "",
        start_date: "",
        end_date: "",
        sort_by: "created_at",
        sort_direction: "desc",
        per_page: 10,
        page: 1,
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Filter Change
  |--------------------------------------------------------------------------
  */

  const handleFiltersChange = (nextFilters) => {
    dispatch(
      setTenancyFilters({
        ...nextFilters,
        page: 1,
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Pagination Change
  |--------------------------------------------------------------------------
  */

  const handlePageChange = (page) => {
    dispatch(
      setTenancyFilters({
        ...filters,
        page,
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Per Page Change
  |--------------------------------------------------------------------------
  */

  const handlePerPageChange = (perPage) => {
    dispatch(
      setTenancyFilters({
        ...filters,
        per_page: perPage,
        page: 1,
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Search / Filter Detection
  |--------------------------------------------------------------------------
  */

  const hasFilters = Boolean(
    filters?.search ||
    filters?.status ||
    filters?.property_id ||
    filters?.apartment_id ||
    filters?.unit_id ||
    filters?.tenant_id ||
    filters?.start_date ||
    filters?.end_date
  );

  /*
  |--------------------------------------------------------------------------
  | Normalize Data
  |--------------------------------------------------------------------------
  */

  const tenancyData = Array.isArray(tenancies)
    ? tenancies
    : Array.isArray(tenancies?.data)
      ? tenancies.data
      : [];

  const total =
    pagination?.total ??
    tenancies?.total ??
    tenancyData.length;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/* Header */}
      <TenancyHeader />

      {/* Statistics */}
      <TenancyStats
        statistics={statistics}
        loading={loading}
      />

      {/* Filters */}
      <TenancyFilters
        filters={filters}
        onChange={handleFiltersChange}
        onClear={handleClearFilters}
        loading={loading}
      />

      {/* Error */}
      {error && !loading && (
        <TenancyError
          message={
            typeof error === "string"
              ? error
              : error?.message ||
              error?.error ||
              "Unable to load tenancies."
          }
          onRetry={handleRetry}
        />
      )}

      {/* Loading */}
      {loading && tenancyData.length === 0 && (
        <TenancyLoading />
      )}

      {/* Table */}
      {!loading && !error && tenancyData.length > 0 && (
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
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
            loading={loading}
          />
        </>
      )}

      {/* Empty */}
      {!loading &&
        !error &&
        tenancyData.length === 0 && (
          <TenancyEmpty
            hasFilters={hasFilters}
            onClearFilters={handleClearFilters}
          />
        )}

      {/* Loading overlay when refreshing existing data */}
      {loading && tenancyData.length > 0 && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Updating tenancies...
        </div>
      )}
    </div>
  );
};

export default TenancyList;