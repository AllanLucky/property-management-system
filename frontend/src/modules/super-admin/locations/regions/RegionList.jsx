
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import Swal from "sweetalert2";

import useRegions from "../../../../hooks/useRegions";
import useCountries from "../../../../hooks/useCountries";

import RegionHeader from "./RegionHeader";
import RegionStatistics from "./RegionStatistics";
import RegionTable from "./RegionTable";
import RegionSkeleton from "./RegionSkeleton";
import RegionFilters from "./RegionFilters";
import RegionPagination from "./RegionPagination";
import RegionEmptyState from "./RegionEmptyState";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

const REGION_ROUTES = {
  index: "/super-admin/regions",
  create: "/super-admin/regions/create",
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Normalize collection responses.
 */
const getArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.data?.data)) {
    return value.data.data;
  }

  return [];
};

/**
 * Safely convert values to numbers.
 */
const getNumericValue = (...values) => {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return 0;
};

/**
 * Normalize Laravel pagination metadata.
 */
const normalizePagination = (pagination, regionCount) => {
  const source =
    pagination?.meta ||
    pagination?.pagination ||
    pagination?.data?.meta ||
    pagination?.data ||
    pagination ||
    {};

  const perPage = Math.max(
    getNumericValue(
      source?.per_page,
      source?.perPage,
      source?.page_size,
      source?.limit,
      DEFAULT_PER_PAGE
    ),
    1
  );

  const total = Math.max(
    getNumericValue(
      source?.total,
      source?.total_items,
      source?.totalItems,
      source?.count,
      regionCount
    ),
    0
  );

  const currentPage = Math.max(
    getNumericValue(
      source?.current_page,
      source?.currentPage,
      source?.page,
      1
    ),
    1
  );

  const calculatedLastPage = Math.max(
    1,
    Math.ceil(total / perPage)
  );

  const lastPage = Math.max(
    getNumericValue(
      source?.last_page,
      source?.lastPage,
      source?.total_pages,
      calculatedLastPage
    ),
    1
  );

  const from =
    total > 0
      ? getNumericValue(
        source?.from,
        (currentPage - 1) * perPage + 1
      )
      : 0;

  const to =
    total > 0
      ? getNumericValue(
        source?.to,
        Math.min(currentPage * perPage, total)
      )
      : 0;

  return {
    current_page: currentPage,
    per_page: perPage,
    total,
    last_page: lastPage,
    from,
    to,
    has_more_pages:
      source?.has_more_pages ??
      source?.hasMorePages ??
      currentPage < lastPage,
  };
};

/**
 * Check whether a region is active.
 */
const isRegionActive = (region) => {
  if (typeof region?.is_active === "boolean") {
    return region.is_active;
  }

  if (typeof region?.is_active === "number") {
    return region.is_active === 1;
  }

  if (typeof region?.is_active === "string") {
    return ["1", "true", "active", "yes"].includes(
      region.is_active.toLowerCase()
    );
  }

  return region?.status === "active";
};

/**
 * Extract readable error messages.
 */
const getErrorMessage = (error) => {
  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const RegionList = () => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | Regions Hook
  |--------------------------------------------------------------------------
  */

  const {
    regions,
    pagination,
    filters,
    statistics: apiStatistics,
    loading,
    error,
    fetchRegions,
    fetchRegionStatistics,
    updateFilters,
    changePage,
    changePerPage,
    resetFilters,
    refreshRegions,
    deleteRegion,
    toggleRegionStatus,
    clearErrors,
  } = useRegions({
    autoFetch: true,
    initialFilters: {
      per_page: DEFAULT_PER_PAGE,
    },
  });

  /*
  |--------------------------------------------------------------------------
  | Countries Hook
  |--------------------------------------------------------------------------
  */

  const {
    countries: countryRecords = [],
  } = useCountries({
    autoFetch: true,
  });

  const countries = useMemo(
    () => getArray(countryRecords),
    [countryRecords]
  );

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [searchValue, setSearchValue] = useState(
    filters?.search || ""
  );

  const [showFilters, setShowFilters] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Region List
  |--------------------------------------------------------------------------
  */

  const regionList = useMemo(
    () => getArray(regions),
    [regions]
  );

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const statistics = useMemo(() => {
    const total = getNumericValue(
      apiStatistics?.total,
      apiStatistics?.total_regions,
      pagination?.total,
      regionList.length
    );

    const active = getNumericValue(
      apiStatistics?.active,
      apiStatistics?.active_regions,
      regionList.filter(isRegionActive).length
    );

    const inactive = getNumericValue(
      apiStatistics?.inactive,
      apiStatistics?.inactive_regions,
      Math.max(total - active, 0)
    );

    const withCounties = getNumericValue(
      apiStatistics?.with_counties,
      apiStatistics?.withCounties
    );

    const withoutCounties = getNumericValue(
      apiStatistics?.without_counties,
      apiStatistics?.withoutCounties
    );

    return {
      ...apiStatistics,
      total,
      active,
      inactive,
      with_counties: withCounties,
      without_counties: withoutCounties,
    };
  }, [apiStatistics, pagination, regionList]);

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const paginationData = useMemo(
    () => normalizePagination(
      pagination,
      regionList.length
    ),
    [pagination, regionList.length]
  );

  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  const currentFilters = useMemo(
    () => ({
      search: filters?.search || "",
      country_id: filters?.country_id || "",
      code: filters?.code || "",
      name: filters?.name || "",
      status: filters?.status || "",
      is_active:
        filters?.is_active === undefined ||
          filters?.is_active === null
          ? ""
          : String(filters.is_active),
      date_from: filters?.date_from || "",
      date_to: filters?.date_to || "",
    }),
    [filters]
  );

  const activeFilterCount = useMemo(
    () =>
      [
        currentFilters.country_id,
        currentFilters.code,
        currentFilters.name,
        currentFilters.status,
        currentFilters.is_active,
        currentFilters.date_from,
        currentFilters.date_to,
      ].filter(Boolean).length,
    [currentFilters]
  );

  /*
  |--------------------------------------------------------------------------
  | Synchronize Search
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setSearchValue(filters?.search || "");
  }, [filters?.search]);

  /*
  |--------------------------------------------------------------------------
  | Search Actions
  |--------------------------------------------------------------------------
  */

  const handleSearchChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();

      updateFilters?.({
        search: searchValue.trim(),
        page: 1,
      });
    },
    [searchValue, updateFilters]
  );

  /*
  |--------------------------------------------------------------------------
  | Filter Actions
  |--------------------------------------------------------------------------
  */

  const handleFilterChange = useCallback(
    (field, value) => {
      updateFilters?.({
        [field]: value,
        page: 1,
      });
    },
    [updateFilters]
  );

  const handleClearFilters = useCallback(() => {
    setSearchValue("");
    setShowFilters(false);
    resetFilters?.();
  }, [resetFilters]);

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const handleRefresh = useCallback(async () => {
    clearErrors?.();

    try {
      if (typeof refreshRegions === "function") {
        await refreshRegions();
      } else {
        await Promise.all([
          fetchRegions?.(),
          fetchRegionStatistics?.(),
        ]);
      }
    } catch (refreshError) {
      console.error(
        "[RegionList] Refresh failed:",
        refreshError
      );
    }
  }, [
    clearErrors,
    refreshRegions,
    fetchRegions,
    fetchRegionStatistics,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleView = useCallback(
    (region) => {
      const regionId =
        typeof region === "object"
          ? region?.id
          : region;

      if (!regionId) {
        return;
      }

      navigate(`${REGION_ROUTES.index}/${regionId}`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (region) => {
      const regionId =
        typeof region === "object"
          ? region?.id
          : region;

      if (!regionId) {
        return;
      }

      navigate(
        `${REGION_ROUTES.index}/${regionId}/edit`
      );
    },
    [navigate]
  );

  /*
  |--------------------------------------------------------------------------
  | Delete Region
  |--------------------------------------------------------------------------
  */

  const handleDelete = useCallback(
    async (region) => {
      const regionId =
        typeof region === "object"
          ? region?.id
          : region;

      const regionName =
        typeof region === "object"
          ? region?.name
          : "this region";

      if (
        !regionId ||
        typeof deleteRegion !== "function"
      ) {
        return;
      }

      const confirmation = await Swal.fire({
        title: "Delete Region?",
        text: `Are you sure you want to delete ${regionName}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });

      if (!confirmation.isConfirmed) {
        return;
      }

      try {
        const response = await deleteRegion(regionId);

        if (response?.status === false) {
          throw new Error(
            response?.message || "Unable to delete region."
          );
        }

        await Swal.fire({
          title: "Deleted!",
          text: "The region has been deleted successfully.",
          icon: "success",
          confirmButtonColor: "#0f172a",
        });

        await handleRefresh();
      } catch (deleteError) {
        Swal.fire({
          title: "Delete Failed",
          text: getErrorMessage(deleteError),
          icon: "error",
          confirmButtonColor: "#0f172a",
        });
      }
    },
    [deleteRegion, handleRefresh]
  );

  /*
  |--------------------------------------------------------------------------
  | Toggle Region Status
  |--------------------------------------------------------------------------
  */

  const handleToggleStatus = useCallback(
    async (region) => {
      const regionId =
        typeof region === "object"
          ? region?.id
          : region;

      const regionName =
        typeof region === "object"
          ? region?.name
          : "this region";

      if (
        !regionId ||
        typeof toggleRegionStatus !== "function"
      ) {
        return;
      }

      const currentlyActive =
        typeof region === "object"
          ? isRegionActive(region)
          : false;

      const nextStatus = currentlyActive
        ? "deactivate"
        : "activate";

      const confirmation = await Swal.fire({
        title: `${currentlyActive ? "Deactivate" : "Activate"} Region?`,
        text: `Are you sure you want to ${nextStatus} ${regionName}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#0f172a",
        cancelButtonColor: "#64748b",
        confirmButtonText: `Yes, ${nextStatus}`,
        cancelButtonText: "Cancel",
      });

      if (!confirmation.isConfirmed) {
        return;
      }

      try {
        const response = await toggleRegionStatus(regionId);

        if (response?.status === false) {
          throw new Error(
            response?.message ||
            "Unable to update region status."
          );
        }

        await Swal.fire({
          title: "Status Updated",
          text: `${regionName} has been ${currentlyActive ? "deactivated" : "activated"}.`,
          icon: "success",
          confirmButtonColor: "#0f172a",
        });

        await handleRefresh();
      } catch (statusError) {
        Swal.fire({
          title: "Update Failed",
          text: getErrorMessage(statusError),
          icon: "error",
          confirmButtonColor: "#0f172a",
        });
      }
    },
    [toggleRegionStatus, handleRefresh]
  );

  /*
  |--------------------------------------------------------------------------
  | Create Region
  |--------------------------------------------------------------------------
  */

  const handleCreate = useCallback(() => {
    navigate(REGION_ROUTES.create);
  }, [navigate]);

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 space-y-6">

      {/* ================================================================
          REGION HEADER
      ================================================================ */}

      <RegionHeader
        onRefresh={handleRefresh}
        loading={loading}
        showRefresh
      />

      {/* ================================================================
          ERROR MESSAGE
      ================================================================ */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">

          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Unable to load regions
            </p>

            <p className="mt-0.5 text-sm text-red-700">
              {getErrorMessage(error)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => clearErrors?.()}
            className="rounded-lg p-1 text-red-500 transition hover:bg-red-100 hover:text-red-700"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ================================================================
          INITIAL LOADING SKELETON
      ================================================================ */}

      {loading && regionList.length === 0 ? (
        <RegionSkeleton
          showHeader={false}
          showStats
          showFilters
          showPagination
          rows={paginationData.per_page}
        />
      ) : (
        <>
          {/* ============================================================
              REGION STATISTICS
          ============================================================ */}

          <RegionStatistics
            statistics={statistics}
            loading={loading}
          />

          {/* ============================================================
              SEARCH AND FILTERS
          ============================================================ */}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">

              {/* Search Form */}

              <form
                onSubmit={handleSearchSubmit}
                className="flex min-w-0 flex-1 gap-2"
              >
                <div className="relative min-w-0 flex-1">

                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={searchValue}
                    onChange={handleSearchChange}
                    placeholder="Search region name, code, country..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}

                  <span className="hidden sm:inline">
                    Search
                  </span>
                </button>
              </form>

              {/* Filter Actions */}

              <div className="flex shrink-0 items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setShowFilters((value) => !value)
                  }
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${showFilters || activeFilterCount > 0
                    ? "border-slate-300 bg-slate-100 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  <span>Filters</span>

                  {activeFilterCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {(activeFilterCount > 0 || searchValue) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    <RotateCcw className="h-4 w-4" />

                    <span className="hidden sm:inline">
                      Clear
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Options */}

            {showFilters && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <RegionFilters
                  filters={currentFilters}
                  countries={countries}
                  onFilterChange={handleFilterChange}
                  onReset={handleClearFilters}
                  loading={loading}
                />
              </div>
            )}
          </div>

          {/* ============================================================
              REGION RECORDS
          ============================================================ */}

          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* Table Header */}

            <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900">
                  Region Records
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Manage your regions and their country associations.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Add Region
              </button>
            </div>

            {/* ========================================================
                REGION EMPTY STATE OR TABLE
            ======================================================== */}

            {regionList.length === 0 ? (
              <RegionEmptyState
                search={filters?.search || ""}
                hasFilters={activeFilterCount > 0}
                onCreate={handleCreate}
                onReset={handleClearFilters}
              />
            ) : (
              <RegionTable
                regions={regionList}
                loading={loading}
                search={filters?.search || ""}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onReset={handleClearFilters}
                onCreate={handleCreate}
              />
            )}

            {/* ========================================================
                REGION PAGINATION
            ======================================================== */}

            {regionList.length > 0 && (
              <RegionPagination
                pagination={paginationData}
                currentPage={paginationData.current_page}
                perPage={paginationData.per_page}
                total={paginationData.total}
                lastPage={paginationData.last_page}
                from={paginationData.from}
                to={paginationData.to}
                loading={loading}
                onPageChange={changePage}
                onPerPageChange={changePerPage}
                perPageOptions={[10, 15, 25, 50, 100]}
                showPageSize
                showPageInfo
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RegionList;
