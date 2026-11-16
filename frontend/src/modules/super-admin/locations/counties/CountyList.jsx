
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import Swal from "sweetalert2";

import useCounties from "../../../../hooks/useCounties";

import CountyHeader from "./CountyHeader";
import CountyStatistics from "./CountyStatistics";
import CountyTable from "./CountyTable";
import CountySkeleton from "./CountySkeleton";
import CountyFilters from "./CountyFilters";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

const COUNTY_ROUTES = {
  index: "/super-admin/counties",
  create: "/super-admin/counties/create",
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;

  return [];
};

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

/*
|--------------------------------------------------------------------------
| GET COUNTY ID
|--------------------------------------------------------------------------
| CountyTable passes a county object, not an ID.
| This helper safely supports both formats.
|--------------------------------------------------------------------------
*/

const getCountyId = (countyOrId) => {
  const id =
    countyOrId && typeof countyOrId === "object"
      ? countyOrId.id
      : countyOrId;

  if (
    id === null ||
    id === undefined ||
    String(id).trim() === ""
  ) {
    return null;
  }

  return String(id);
};

/*
|--------------------------------------------------------------------------
| NORMALIZE PAGINATION
|--------------------------------------------------------------------------
*/

const normalizePagination = (pagination, countyCount) => {
  const source = pagination?.data || pagination || {};

  const perPage = Math.max(
    getNumericValue(
      source?.per_page,
      source?.perPage,
      source?.limit,
      DEFAULT_PER_PAGE
    ),
    1
  );

  const total = getNumericValue(
    source?.total,
    source?.total_items,
    source?.count,
    countyCount
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

  const lastPage = Math.max(
    getNumericValue(
      source?.last_page,
      source?.lastPage,
      source?.total_pages,
      Math.ceil(total / perPage)
    ),
    1
  );

  const from = total > 0
    ? (currentPage - 1) * perPage + 1
    : 0;

  const to = total > 0
    ? Math.min(currentPage * perPage, total)
    : 0;

  return {
    currentPage,
    perPage,
    total,
    lastPage,
    from,
    to,
  };
};

/*
|--------------------------------------------------------------------------
| PAGINATION PAGE NUMBERS
|--------------------------------------------------------------------------
*/

const buildPaginationPages = (currentPage, lastPage) => {
  if (lastPage <= 7) {
    return Array.from(
      { length: lastPage },
      (_, index) => index + 1
    );
  }

  const pages = [1];

  if (currentPage > 4) {
    pages.push("...");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(lastPage - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < lastPage - 3) {
    pages.push("...");
  }

  pages.push(lastPage);

  return pages;
};

/*
|--------------------------------------------------------------------------
| COUNTY STATUS
|--------------------------------------------------------------------------
*/

const isCountyActive = (county) => {
  if (typeof county?.is_active === "boolean") {
    return county.is_active;
  }

  if (
    county?.is_active === 1 ||
    county?.is_active === "1"
  ) {
    return true;
  }

  if (
    county?.is_active === 0 ||
    county?.is_active === "0"
  ) {
    return false;
  }

  return String(county?.status || "").toLowerCase() === "active";
};

/*
|--------------------------------------------------------------------------
| DELETE RESPONSE HANDLER
|--------------------------------------------------------------------------
| Supports Axios responses, direct Laravel responses,
| and Redux Toolkit action results.
|--------------------------------------------------------------------------
*/

const validateDeleteResponse = (response) => {
  if (response?.meta?.requestStatus === "rejected") {
    throw new Error(
      response?.payload?.message ||
      response?.error?.message ||
      "County deletion failed."
    );
  }

  if (response?.meta?.requestStatus === "fulfilled") {
    const payload = response.payload;

    if (
      payload?.status === false ||
      payload?.success === false
    ) {
      throw new Error(
        payload?.message || "County deletion failed."
      );
    }

    return payload;
  }

  const result = response?.data ?? response;

  if (
    result?.status === false ||
    result?.success === false
  ) {
    throw new Error(
      result?.message || "County deletion failed."
    );
  }

  if (response?.error) {
    throw new Error(
      response.error.message || "County deletion failed."
    );
  }

  return result;
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

const CountyList = () => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | COUNTY HOOK
  |--------------------------------------------------------------------------
  */

  const {
    counties,
    pagination,
    filters,
    statistics: apiStatistics,
    loading,
    error,
    fetchCounties,
    fetchCountyStatistics,
    updateFilters,
    changePage,
    changePerPage,
    resetFilters,
    deleteCounty,
  } = useCounties({
    autoFetch: false,
    initialFilters: {
      per_page: DEFAULT_PER_PAGE,
      page: 1,
    },
  });

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [searchValue, setSearchValue] = useState(
    filters?.search || ""
  );

  const [showFilters, setShowFilters] = useState(false);
  const [errorDismissed, setErrorDismissed] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | COUNTY LIST
  |--------------------------------------------------------------------------
  */

  const countyList = useMemo(
    () => getArray(counties),
    [counties]
  );

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const statistics = useMemo(() => {
    const total = getNumericValue(
      apiStatistics?.total,
      apiStatistics?.total_counties,
      pagination?.total,
      countyList.length
    );

    const active = getNumericValue(
      apiStatistics?.active,
      apiStatistics?.active_counties,
      countyList.filter(isCountyActive).length
    );

    const inactive = getNumericValue(
      apiStatistics?.inactive,
      apiStatistics?.inactive_counties,
      Math.max(total - active, 0)
    );

    const withCities = getNumericValue(
      apiStatistics?.with_cities,
      apiStatistics?.counties_with_cities,
      countyList.filter((county) => county?.has_cities).length
    );

    const withoutCities = getNumericValue(
      apiStatistics?.without_cities,
      apiStatistics?.counties_without_cities,
      Math.max(total - withCities, 0)
    );

    const withAreas = getNumericValue(
      apiStatistics?.with_areas,
      apiStatistics?.counties_with_areas,
      countyList.filter((county) => county?.has_areas).length
    );

    const withoutAreas = getNumericValue(
      apiStatistics?.without_areas,
      apiStatistics?.counties_without_areas,
      Math.max(total - withAreas, 0)
    );

    const withProperties = getNumericValue(
      apiStatistics?.with_properties,
      apiStatistics?.counties_with_properties,
      countyList.filter((county) => county?.has_properties).length
    );

    const withoutProperties = getNumericValue(
      apiStatistics?.without_properties,
      apiStatistics?.counties_without_properties,
      Math.max(total - withProperties, 0)
    );

    return {
      ...apiStatistics,
      total,
      active,
      inactive,
      with_cities: withCities,
      without_cities: withoutCities,
      with_areas: withAreas,
      without_areas: withoutAreas,
      with_properties: withProperties,
      without_properties: withoutProperties,
      total_counties: total,
      active_counties: active,
      inactive_counties: inactive,
    };
  }, [apiStatistics, pagination, countyList]);

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const paginationData = useMemo(
    () => normalizePagination(
      pagination,
      countyList.length
    ),
    [pagination, countyList.length]
  );

  const {
    currentPage,
    perPage,
    total,
    lastPage,
    from,
    to,
  } = paginationData;

  /*
  |--------------------------------------------------------------------------
  | CURRENT FILTERS
  |--------------------------------------------------------------------------
  */

  const currentFilters = useMemo(
    () => ({
      search: filters?.search || "",
      country_id: filters?.country_id || "",
      region_id: filters?.region_id || "",
      is_active:
        filters?.is_active === undefined ||
          filters?.is_active === null
          ? ""
          : String(filters.is_active),
    }),
    [filters]
  );

  const activeFilterCount = useMemo(
    () => [
      currentFilters.country_id,
      currentFilters.region_id,
      currentFilters.is_active,
    ].filter((value) => value !== "").length,
    [currentFilters]
  );

  /*
  |--------------------------------------------------------------------------
  | INITIAL FETCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchCounties?.({
      page: 1,
      per_page: DEFAULT_PER_PAGE,
    });

    fetchCountyStatistics?.();
  }, [fetchCounties, fetchCountyStatistics]);

  /*
  |--------------------------------------------------------------------------
  | NAVIGATION HANDLERS
  |--------------------------------------------------------------------------
  */

  const handleView = useCallback(
    (countyOrId) => {
      const countyId = getCountyId(countyOrId);

      if (!countyId) {
        console.error(
          "Cannot view county: invalid county ID.",
          countyOrId
        );
        return;
      }

      navigate(`${COUNTY_ROUTES.index}/${countyId}`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (countyOrId) => {
      const countyId = getCountyId(countyOrId);

      if (!countyId) {
        console.error(
          "Cannot edit county: invalid county ID.",
          countyOrId
        );
        return;
      }

      navigate(`${COUNTY_ROUTES.index}/${countyId}/edit`);
    },
    [navigate]
  );

  /*
  |--------------------------------------------------------------------------
  | DELETE COUNTY
  |--------------------------------------------------------------------------
  */

  const handleDelete = useCallback(
    async (countyOrId) => {
      const countyId = getCountyId(countyOrId);

      const countyName =
        typeof countyOrId === "object"
          ? countyOrId?.name || "this county"
          : "this county";

      if (!countyId) {
        console.error(
          "Cannot delete county: invalid county ID.",
          countyOrId
        );

        await Swal.fire({
          icon: "error",
          title: "Invalid County",
          text: "The county ID could not be identified.",
          confirmButtonColor: "#4f46e5",
        });

        return;
      }

      if (typeof deleteCounty !== "function") {
        console.error(
          "deleteCounty is not available in useCounties."
        );

        await Swal.fire({
          icon: "error",
          title: "Delete Unavailable",
          text: "The county deletion function is not configured in useCounties.",
          confirmButtonColor: "#4f46e5",
        });

        return;
      }

      // CONFIRMATION
      const confirmation = await Swal.fire({
        title: "Delete County?",
        text: `Are you sure you want to delete ${countyName}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Delete",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b",
        reverseButtons: true,
        focusCancel: true,
      });

      if (!confirmation.isConfirmed) {
        return;
      }

      try {
        // LOADING
        Swal.fire({
          title: "Deleting County",
          text: "Please wait while the county is being deleted...",
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // API DELETE REQUEST
        const response = await deleteCounty(countyId);

        // VALIDATE RESPONSE
        validateDeleteResponse(response);

        // REFRESH LIST AND STATISTICS
        const refreshResults = await Promise.all([
          Promise.resolve(
            fetchCounties?.({
              ...currentFilters,
              page: currentPage,
              per_page: perPage,
            })
          ),
          Promise.resolve(fetchCountyStatistics?.()),
        ]);

        // Check for rejected Redux Toolkit refresh actions.
        const failedRefresh = refreshResults.find(
          (result) =>
            result?.meta?.requestStatus === "rejected"
        );

        if (failedRefresh) {
          console.error(
            "County deleted, but refreshing the list failed:",
            failedRefresh
          );
        }

        // SUCCESS
        await Swal.fire({
          icon: "success",
          title: "County Deleted",
          text: `${countyName} has been deleted successfully.`,
          confirmButtonText: "Done",
          confirmButtonColor: "#4f46e5",
        });
      } catch (deleteError) {
        console.error(
          "County deletion failed:",
          deleteError
        );

        const message =
          deleteError?.response?.data?.message ||
            deleteError?.response?.data?.errors
            ? deleteError?.response?.data?.message ||
            "Please check the county information and try again."
            : deleteError?.data?.message ||
            deleteError?.message ||
            "Something went wrong while deleting the county.";

        await Swal.fire({
          icon: "error",
          title: "Deletion Failed",
          text: typeof message === "string"
            ? message
            : "The county could not be deleted.",
          confirmButtonText: "Close",
          confirmButtonColor: "#dc2626",
        });
      }
    },
    [
      deleteCounty,
      fetchCounties,
      fetchCountyStatistics,
      currentFilters,
      currentPage,
      perPage,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const handleSearchChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();

      const value = searchValue.trim();

      fetchCounties?.({
        ...currentFilters,
        search: value,
        page: 1,
        per_page: perPage,
      });
    },
    [
      searchValue,
      currentFilters,
      perPage,
      fetchCounties,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | FILTERS
  |--------------------------------------------------------------------------
  | CountyFilters sends a complete filters object.
  |--------------------------------------------------------------------------
  */

  const handleFilterChange = useCallback(
    (updatedFilters) => {
      const nextFilters = {
        ...currentFilters,
        ...updatedFilters,
        page: 1,
        per_page: perPage,
      };

      setSearchValue(nextFilters.search || "");

      updateFilters?.(updatedFilters);

      fetchCounties?.(nextFilters);
    },
    [
      currentFilters,
      perPage,
      updateFilters,
      fetchCounties,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | CLEAR FILTERS
  |--------------------------------------------------------------------------
  */

  const handleClearFilters = useCallback(() => {
    setSearchValue("");
    setShowFilters(false);

    resetFilters?.();

    const clearedFilters = {
      search: "",
      country_id: "",
      region_id: "",
      is_active: "",
      status: "",
      page: 1,
      per_page: perPage,
    };

    fetchCounties?.(clearedFilters);
  }, [
    resetFilters,
    fetchCounties,
    perPage,
  ]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = useCallback(() => {
    setErrorDismissed(false);

    fetchCounties?.({
      ...currentFilters,
      page: currentPage,
      per_page: perPage,
    });

    fetchCountyStatistics?.();
  }, [
    fetchCounties,
    fetchCountyStatistics,
    currentFilters,
    currentPage,
    perPage,
  ]);

  /*
  |--------------------------------------------------------------------------
  | ERROR DISMISS
  |--------------------------------------------------------------------------
  */

  const handleDismissError = useCallback(() => {
    setErrorDismissed(true);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | PAGINATION ACTIONS
  |--------------------------------------------------------------------------
  */

  const handlePageChange = useCallback(
    (page) => {
      if (
        page < 1 ||
        page > lastPage ||
        loading
      ) {
        return;
      }

      changePage?.(page);
    },
    [lastPage, loading, changePage]
  );

  const handlePreviousPage = useCallback(() => {
    handlePageChange(currentPage - 1);
  }, [handlePageChange, currentPage]);

  const handleNextPage = useCallback(() => {
    handlePageChange(currentPage + 1);
  }, [handlePageChange, currentPage]);

  const handlePerPageChange = useCallback(
    (event) => {
      const value = Number(event.target.value);

      if (!Number.isFinite(value) || value <= 0) {
        return;
      }

      changePerPage?.(value);
    },
    [changePerPage]
  );

  const paginationPages = useMemo(
    () => buildPaginationPages(currentPage, lastPage),
    [currentPage, lastPage]
  );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 space-y-6">

      {/* COUNTY HEADER */}

      <CountyHeader
        onRefresh={handleRefresh}
        loading={loading}
        showRefresh
      />

      {/* ERROR MESSAGE */}

      {error && !errorDismissed && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Unable to load counties
            </p>

            <p className="mt-0.5 text-sm text-red-700">
              {typeof error === "string"
                ? error
                : error?.message ||
                "Something went wrong while loading counties."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismissError}
            className="rounded-lg p-1 text-red-500 transition hover:bg-red-100 hover:text-red-700"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* INITIAL LOADING */}

      {loading && countyList.length === 0 ? (
        <CountySkeleton
          showHeader={false}
          showStats
          showFilters
          showPagination
          rows={perPage}
        />
      ) : (
        <>
          {/* STATISTICS */}

          <CountyStatistics
            statistics={statistics}
            loading={loading}
          />

          {/* SEARCH AND FILTERS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">

              {/* SEARCH FORM */}

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
                    placeholder="Search county name, code, country, region..."
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

              {/* FILTER ACTIONS */}

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters((value) => !value)}
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

            {/* FILTER OPTIONS */}

            {showFilters && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <CountyFilters
                  filters={currentFilters}
                  onFilterChange={handleFilterChange}
                  onReset={handleClearFilters}
                  loading={loading}
                />
              </div>
            )}
          </div>

          {/* COUNTY TABLE CONTAINER */}

          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* TABLE HEADER */}

            <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900">
                  County Records
                </h2>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {total > 0
                    ? `Showing ${from}–${to} of ${total} counties`
                    : "No counties found"}
                </p>
              </div>

              {/* PER PAGE */}

              <div className="flex shrink-0 items-center gap-2">
                <label
                  htmlFor="county-per-page"
                  className="text-xs font-medium text-slate-500"
                >
                  Per page
                </label>

                <select
                  id="county-per-page"
                  value={perPage}
                  onChange={handlePerPageChange}
                  disabled={loading}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  {[10, 15, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* EMPTY STATE OR TABLE */}

            {countyList.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <MapPin className="h-7 w-7" />
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-900">
                  No counties found
                </h3>

                <p className="mt-1 max-w-md text-sm text-slate-500">
                  There are no counties matching your current search or filters.
                </p>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  {(activeFilterCount > 0 || searchValue) && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Clear Filters
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate(COUNTY_ROUTES.create)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    Add County
                  </button>
                </div>
              </div>
            ) : (
              <CountyTable
                counties={countyList}
                loading={loading}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}

            {/* PAGINATION */}

            {countyList.length > 0 && lastPage > 1 && (
              <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">

                {/* PAGINATION INFORMATION */}

                <div className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {from}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-700">
                    {to}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {total}
                  </span>{" "}
                  counties
                </div>

                {/* PAGINATION CONTROLS */}

                <div className="flex items-center justify-between gap-2 sm:justify-end">

                  {/* PREVIOUS */}

                  <button
                    type="button"
                    onClick={handlePreviousPage}
                    disabled={currentPage <= 1 || loading}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />

                    <span className="hidden sm:inline">
                      Previous
                    </span>
                  </button>

                  {/* PAGE NUMBERS */}

                  <div className="flex items-center gap-1">
                    {paginationPages.map((page, index) => {
                      if (page === "...") {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="hidden h-9 w-9 items-center justify-center text-sm text-slate-400 sm:flex"
                          >
                            ...
                          </span>
                        );
                      }

                      const isCurrent = page === currentPage;

                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => handlePageChange(page)}
                          disabled={loading}
                          aria-current={isCurrent ? "page" : undefined}
                          className={`hidden h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition sm:flex ${isCurrent
                            ? "bg-slate-900 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  {/* MOBILE PAGE INDICATOR */}

                  <div className="flex h-9 min-w-16 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-semibold text-slate-600 sm:hidden">
                    {currentPage} / {lastPage}
                  </div>

                  {/* NEXT */}

                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={currentPage >= lastPage || loading}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="hidden sm:inline">
                      Next
                    </span>

                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CountyList;
