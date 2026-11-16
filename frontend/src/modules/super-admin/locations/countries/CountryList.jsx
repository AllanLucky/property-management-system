
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Globe,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import useCountries from "../../../../hooks/useCountries";

import CountryHeader from "./CountryHeader";
import CountryStatistics from "./CountryStatistics";
import CountryTable from "./CountryTable";
import CountrySkeleton from "./CountrySkeleton";
import FiltersCountry from "./CountryFilters";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

const COUNTRY_ROUTES = {
  index: "/super-admin/countries",
  create: "/super-admin/countries/create",
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Normalize country collection responses.
 */
const getArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;

  return [];
};

/**
 * Return the first valid numeric value.
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
 * Normalize Laravel pagination data.
 */
const normalizePagination = (pagination, countryCount) => {
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
    countryCount
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

/**
 * Generate compact pagination page numbers.
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

/**
 * Check whether a country is active.
 */
const isCountryActive = (country) => {
  return (
    country?.is_active === true ||
    country?.is_active === 1 ||
    country?.is_active === "1"
  );
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const CountryList = () => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | Country Hook
  |--------------------------------------------------------------------------
  */

  const {
    countries,
    pagination,
    filters,
    statistics: apiStatistics,
    loading,
    error,
    fetchCountries,
    searchCountries,
    filterCountries,
    changePage,
    changePerPage,
    resetFilters,
    clearErrors,
  } = useCountries();

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
  | Country List
  |--------------------------------------------------------------------------
  */

  const countryList = useMemo(
    () => getArray(countries),
    [countries]
  );

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  |
  | Prefer statistics from the API because the country list may be
  | paginated and therefore cannot provide accurate global totals.
  |
  */

  const statistics = useMemo(() => {
    const total = getNumericValue(
      apiStatistics?.total,
      apiStatistics?.total_countries,
      pagination?.total,
      countryList.length
    );

    const active = getNumericValue(
      apiStatistics?.active,
      apiStatistics?.active_countries,
      countryList.filter(isCountryActive).length
    );

    const inactive = getNumericValue(
      apiStatistics?.inactive,
      apiStatistics?.inactive_countries,
      Math.max(total - active, 0)
    );

    const trashed = getNumericValue(
      apiStatistics?.trashed,
      apiStatistics?.trashed_countries
    );

    return {
      ...apiStatistics,
      total,
      active,
      inactive,
      trashed,
      total_countries: total,
      active_countries: active,
      inactive_countries: inactive,
      trashed_countries: trashed,
      currencies: apiStatistics?.currencies || {},
    };
  }, [apiStatistics, pagination, countryList]);

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const paginationData = useMemo(
    () => normalizePagination(
      pagination,
      countryList.length
    ),
    [pagination, countryList.length]
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
  | Filters
  |--------------------------------------------------------------------------
  */

  const currentFilters = useMemo(
    () => ({
      search: filters?.search || "",
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
      currentFilters.is_active,
    ].filter(Boolean).length,
    [currentFilters]
  );

  /*
  |--------------------------------------------------------------------------
  | Initial Fetch
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchCountries?.();
  }, [fetchCountries]);

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const handleSearchChange = useCallback((event) => {
    setSearchValue(event.target.value);
  }, []);

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();

      const value = searchValue.trim();

      if (typeof searchCountries === "function") {
        searchCountries(value);
        return;
      }

      fetchCountries?.({
        ...currentFilters,
        search: value,
        page: 1,
      });
    },
    [
      searchValue,
      searchCountries,
      fetchCountries,
      currentFilters,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  const handleFilterChange = useCallback(
    (field, value) => {
      const updatedFilters = {
        ...currentFilters,
        [field]: value,
      };

      if (typeof filterCountries === "function") {
        filterCountries(updatedFilters);
        return;
      }

      fetchCountries?.({
        ...updatedFilters,
        page: 1,
      });
    },
    [
      currentFilters,
      filterCountries,
      fetchCountries,
    ]
  );

  const handleClearFilters = useCallback(() => {
    setSearchValue("");
    resetFilters?.();
    setShowFilters(false);
  }, [resetFilters]);

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const handleRefresh = useCallback(async () => {
    clearErrors?.();
    await fetchCountries?.();
  }, [clearErrors, fetchCountries]);

  /*
  |--------------------------------------------------------------------------
  | Pagination Actions
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
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 space-y-6">

      {/* ================================================================
          COUNTRY HEADER
      ================================================================ */}

      <CountryHeader
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
              Unable to load countries
            </p>

            <p className="mt-0.5 text-sm text-red-700">
              {typeof error === "string"
                ? error
                : error?.message ||
                "Something went wrong while loading countries."}
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

      {loading && countryList.length === 0 ? (
        <CountrySkeleton
          showHeader={false}
          showStats
          showFilters
          showPagination
          rows={perPage}
        />
      ) : (
        <>
          {/* ============================================================
              COUNTRY STATISTICS
          ============================================================ */}

          <CountryStatistics
            statistics={statistics}
            loading={loading}
          />

          {/* ============================================================
              SEARCH + FILTERS
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
                    placeholder="Search country name, code, currency..."
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

            {/* ========================================================
                FILTER OPTIONS
            ======================================================== */}

            {showFilters && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <FiltersCountry
                  filters={currentFilters}
                  onFilterChange={handleFilterChange}
                  onReset={handleClearFilters}
                  loading={loading}
                />
              </div>
            )}
          </div>

          {/* ============================================================
              COUNTRY TABLE
          ============================================================ */}

          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* Table Header */}

            <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900">
                  Country Records
                </h2>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {total > 0
                    ? `Showing ${from}–${to} of ${total} countries`
                    : "No countries found"}
                </p>
              </div>

              {/* Per Page */}

              <div className="flex shrink-0 items-center gap-2">
                <label
                  htmlFor="country-per-page"
                  className="text-xs font-medium text-slate-500"
                >
                  Per page
                </label>

                <select
                  id="country-per-page"
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

            {/* ========================================================
                EMPTY STATE
            ======================================================== */}

            {countryList.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <Globe className="h-7 w-7" />
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-900">
                  No countries found
                </h3>

                <p className="mt-1 max-w-md text-sm text-slate-500">
                  There are no countries matching your current search or filters.
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
                    onClick={() => navigate(COUNTRY_ROUTES.create)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    Add Country
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* COUNTRY TABLE CONTENT */}

                <CountryTable
                  countries={countryList}
                  loading={loading}
                  onView={(countryId) =>
                    navigate(`${COUNTRY_ROUTES.index}/${countryId}`)
                  }
                  onEdit={(countryId) =>
                    navigate(`${COUNTRY_ROUTES.index}/${countryId}/edit`)
                  }
                  onDelete={(countryId) =>
                    navigate(`${COUNTRY_ROUTES.index}/${countryId}`)
                  }
                />
              </>
            )}

            {/* ========================================================
                PAGINATION
            ======================================================== */}

            {countryList.length > 0 && lastPage > 1 && (
              <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">

                {/* Pagination Information */}

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
                  countries
                </div>

                {/* Pagination Controls */}

                <div className="flex items-center justify-between gap-2 sm:justify-end">

                  {/* Previous */}

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

                  {/* Page Numbers */}

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
                          aria-current={
                            isCurrent ? "page" : undefined
                          }
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

                  {/* Mobile Page Indicator */}

                  <div className="flex h-9 min-w-16 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-semibold text-slate-600 sm:hidden">
                    {currentPage} / {lastPage}
                  </div>

                  {/* Next */}

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

export default CountryList;
