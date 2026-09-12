import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AlertCircle,
  Filter,
  Loader2,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import { useLease } from "../../../hooks/useLease";

import LeaseHeader from "./LeaseHeader";
import LeaseTable from "./LeaseTable";
import LeasePagination from "./LeasePagination";
import LeaseStatistics from "./LeaseStatistics";
import LeaseSkeleton from "./LeaseSkeleton";
import LeaseEmptyState from "./LeaseEmptyState";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

const LEASE_LIST_ROUTE = "/super-admin/leases";
const LEASE_CREATE_ROUTE = "/super-admin/leases/create";

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  lease_type: "",
  payment_frequency: "",
};

/*
|--------------------------------------------------------------------------
| Lease Status Options
|--------------------------------------------------------------------------
*/

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All Statuses",
  },
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "expired",
    label: "Expired",
  },
  {
    value: "terminated",
    label: "Terminated",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

/*
|--------------------------------------------------------------------------
| Lease Type Options
|--------------------------------------------------------------------------
|
| Keep these values synchronized with the backend validation/database.
|
| Current Lease API:
| - fixed_term
|
|--------------------------------------------------------------------------
*/

const LEASE_TYPE_OPTIONS = [
  {
    value: "",
    label: "All Lease Types",
  },
  {
    value: "fixed_term",
    label: "Fixed Term",
  },
];

/*
|--------------------------------------------------------------------------
| Payment Frequency Options
|--------------------------------------------------------------------------
*/

const PAYMENT_FREQUENCY_OPTIONS = [
  {
    value: "",
    label: "All Frequencies",
  },
  {
    value: "daily",
    label: "Daily",
  },
  {
    value: "weekly",
    label: "Weekly",
  },
  {
    value: "monthly",
    label: "Monthly",
  },
  {
    value: "quarterly",
    label: "Quarterly",
  },
  {
    value: "semi_annually",
    label: "Semi Annually",
  },
  {
    value: "annually",
    label: "Annually",
  },
  {
    value: "one_time",
    label: "One Time",
  },
];

/*
|--------------------------------------------------------------------------
| Helper Functions
|--------------------------------------------------------------------------
*/

/**
 * Safely convert a collection into an array.
 *
 * This protects LeaseTable from malformed or unexpected API responses.
 */
function getSafeArray(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * Safely normalize a numeric value.
 */
function getSafeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

/**
 * Extract a human-readable error message from common Laravel/API
 * error structures.
 */
function getErrorMessage(error, errors) {
  /*
  |--------------------------------------------------------------------------
  | Direct string
  |--------------------------------------------------------------------------
  */

  if (
    typeof error === "string" &&
    error.trim()
  ) {
    return error.trim();
  }

  /*
  |--------------------------------------------------------------------------
  | Error object message
  |--------------------------------------------------------------------------
  */

  if (
    error &&
    typeof error === "object" &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  /*
  |--------------------------------------------------------------------------
  | Errors object message
  |--------------------------------------------------------------------------
  */

  if (
    errors &&
    typeof errors === "object" &&
    typeof errors.message === "string" &&
    errors.message.trim()
  ) {
    return errors.message.trim();
  }

  /*
  |--------------------------------------------------------------------------
  | Laravel validation errors
  |--------------------------------------------------------------------------
  */

  if (
    errors &&
    typeof errors === "object"
  ) {
    for (const value of Object.values(errors)) {
      if (Array.isArray(value)) {
        const message = value.find(
          (item) =>
            typeof item === "string" &&
            item.trim(),
        );

        if (message) {
          return message.trim();
        }
      }

      if (
        typeof value === "string" &&
        value.trim()
      ) {
        return value.trim();
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Axios response errors
  |--------------------------------------------------------------------------
  */

  const responseMessage =
    error?.response?.data?.message;

  if (
    typeof responseMessage === "string" &&
    responseMessage.trim()
  ) {
    return responseMessage.trim();
  }

  /*
  |--------------------------------------------------------------------------
  | Default
  |--------------------------------------------------------------------------
  */

  return "Unable to load leases. Please try again.";
}

/**
 * Normalize filter values before sending them to the API.
 *
 * Empty values are removed so the backend does not receive unnecessary
 * empty query parameters.
 */
function normalizeFilters(filters) {
  const normalized = {};

  Object.entries(filters || {}).forEach(
    ([key, value]) => {
      const normalizedValue =
        String(value ?? "").trim();

      if (normalizedValue !== "") {
        normalized[key] = normalizedValue;
      }
    },
  );

  return normalized;
}

/*
|--------------------------------------------------------------------------
| Main Lease List Component
|--------------------------------------------------------------------------
*/

const LeaseList = () => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | Lease Hook
  |--------------------------------------------------------------------------
  */

  const {
    leases,
    pagination,
    loadingList,
    error,
    errors,
    fetchAll,
    clearError,
  } = useLease();

  /*
  |--------------------------------------------------------------------------
  | Local State
  |--------------------------------------------------------------------------
  */

  const [filters, setFilters] =
    useState(DEFAULT_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState(DEFAULT_FILTERS);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Normalized Pagination
  |--------------------------------------------------------------------------
  */

  const currentPage = getSafeNumber(
    pagination?.current_page,
    1,
  );

  const currentPerPage = getSafeNumber(
    pagination?.per_page,
    DEFAULT_PER_PAGE,
  );

  const lastPage = Math.max(
    getSafeNumber(
      pagination?.last_page,
      1,
    ),
    1,
  );

  const totalRecords = getSafeNumber(
    pagination?.total,
    0,
  );

  /*
  |--------------------------------------------------------------------------
  | Lease Collection
  |--------------------------------------------------------------------------
  */

  const leaseCollection =
    getSafeArray(leases);

  /*
  |--------------------------------------------------------------------------
  | Active Filters
  |--------------------------------------------------------------------------
  */

  const hasFilters = Object.values(
    appliedFilters,
  ).some(
    (value) =>
      String(value ?? "").trim() !== "",
  );

  /*
  |--------------------------------------------------------------------------
  | Error Message
  |--------------------------------------------------------------------------
  */

  const errorMessage =
    getErrorMessage(error, errors);

  /*
  |--------------------------------------------------------------------------
  | Initial Loading
  |--------------------------------------------------------------------------
  |
  | Only display the complete skeleton when there are no existing records.
  |
  | During pagination or refresh, existing records remain visible while
  | a lightweight loading indicator is displayed.
  |
  |--------------------------------------------------------------------------
  */

  const showInitialSkeleton =
    Boolean(
      loadingList &&
      leaseCollection.length === 0,
    );

  /*
  |--------------------------------------------------------------------------
  | Initial Lease Request
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    const loadLeases = async () => {
      try {
        if (cancelled) {
          return;
        }

        await fetchAll({
          page: 1,
          per_page: DEFAULT_PER_PAGE,
        });
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load leases:",
          requestError,
        );
      }
    };

    void loadLeases();

    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  /*
  |--------------------------------------------------------------------------
  | Filter Change
  |--------------------------------------------------------------------------
  */

  const handleFilterChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Search / Apply Filters
  |--------------------------------------------------------------------------
  */

  const handleSearchSubmit = async (
    event,
  ) => {
    event.preventDefault();

    const nextFilters = {
      ...filters,
    };

    setAppliedFilters(nextFilters);

    if (error) {
      clearError();
    }

    try {
      await fetchAll({
        ...normalizeFilters(nextFilters),
        page: 1,
        per_page: currentPerPage,
      });
    } catch (requestError) {
      console.error(
        "Lease search failed:",
        requestError,
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Clear Filters
  |--------------------------------------------------------------------------
  */

  const handleClearFilters = async () => {
    setFilters({
      ...DEFAULT_FILTERS,
    });

    setAppliedFilters({
      ...DEFAULT_FILTERS,
    });

    if (error) {
      clearError();
    }

    try {
      await fetchAll({
        page: 1,
        per_page: currentPerPage,
      });
    } catch (requestError) {
      console.error(
        "Failed to reset lease filters:",
        requestError,
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {
    if (
      isRefreshing ||
      loadingList
    ) {
      return;
    }

    setIsRefreshing(true);

    if (error) {
      clearError();
    }

    try {
      await fetchAll({
        ...normalizeFilters(
          appliedFilters,
        ),
        page: currentPage,
        per_page: currentPerPage,
      });
    } catch (requestError) {
      console.error(
        "Failed to refresh leases:",
        requestError,
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Pagination - Page Change
  |--------------------------------------------------------------------------
  */

  const handlePageChange = async ({
    page,
    per_page,
  }) => {
    const nextPage = Number(page);

    if (
      !Number.isInteger(nextPage) ||
      nextPage < 1 ||
      nextPage > lastPage
    ) {
      return;
    }

    const nextPerPage =
      Number(per_page) ||
      currentPerPage;

    try {
      await fetchAll({
        ...normalizeFilters(
          appliedFilters,
        ),
        page: nextPage,
        per_page: nextPerPage,
      });
    } catch (requestError) {
      console.error(
        "Failed to change lease page:",
        requestError,
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Pagination - Per Page Change
  |--------------------------------------------------------------------------
  */

  const handlePerPageChange = async ({
    page = 1,
    per_page,
  }) => {
    const nextPerPage =
      Number(per_page);

    if (
      !Number.isInteger(nextPerPage) ||
      nextPerPage < 1
    ) {
      return;
    }

    const nextPage =
      Number(page) || 1;

    try {
      await fetchAll({
        ...normalizeFilters(
          appliedFilters,
        ),
        page: nextPage,
        per_page: nextPerPage,
      });
    } catch (requestError) {
      console.error(
        "Failed to change lease page size:",
        requestError,
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Navigation - Create Lease
  |--------------------------------------------------------------------------
  */

  const handleCreateLease = () => {
    navigate(
      LEASE_CREATE_ROUTE,
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Navigation - View Lease
  |--------------------------------------------------------------------------
  */

  const handleViewLease = (lease) => {
    const leaseId =
      typeof lease === "object"
        ? lease?.id
        : lease;

    if (!leaseId) {
      return;
    }

    navigate(
      `${LEASE_LIST_ROUTE}/${leaseId}`,
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/* ==================================================================
          PAGE HEADER
      ================================================================== */}

      <LeaseHeader
        onRefresh={handleRefresh}
        loading={
          isRefreshing ||
          loadingList
        }
      />

      {/* ==================================================================
          LEASE STATISTICS
      ================================================================== */}

      <LeaseStatistics
        autoLoad
        showHeader
        className="w-full"
      />

      {/* ==================================================================
          ERROR ALERT
      ================================================================== */}

      {error && (
        <div
          className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            p-4
            dark:border-red-900/50
            dark:bg-red-950/30
          "
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="
                mt-0.5
                h-5
                w-5
                shrink-0
                text-red-600
                dark:text-red-400
              "
              aria-hidden="true"
            />

            <div className="min-w-0 flex-1">
              <h3
                className="
                  text-sm
                  font-semibold
                  text-red-800
                  dark:text-red-300
                "
              >
                Unable to load leases
              </h3>

              <p
                className="
                  mt-1
                  text-sm
                  text-red-700
                  dark:text-red-400
                "
              >
                {errorMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={clearError}
              className="
                rounded-md
                p-1
                text-red-500
                transition
                hover:bg-red-100
                hover:text-red-700
                focus:outline-none
                focus:ring-2
                focus:ring-red-500
                focus:ring-offset-1
                dark:hover:bg-red-950/50
              "
              aria-label="Dismiss error"
            >
              <X
                className="h-4 w-4"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================
          INITIAL LOADING
      ================================================================== */}

      {showInitialSkeleton ? (
        <LeaseSkeleton
          rows={DEFAULT_PER_PAGE}
          showHeader={false}
          showStats={false}
          showFilters={true}
          showPagination={true}
        />
      ) : (
        <>
          {/* ==============================================================
              SEARCH & FILTERS
          ============================================================== */}

          <div
            className="
              overflow-hidden
              rounded-xl
              border
              border-gray-200
              bg-white
              shadow-sm
              dark:border-gray-800
              dark:bg-gray-900
            "
          >
            <form
              onSubmit={
                handleSearchSubmit
              }
            >
              {/* ----------------------------------------------------------
                  Filter Header
              ---------------------------------------------------------- */}

              <div
                className="
                  border-b
                  border-gray-100
                  px-6
                  py-4
                  dark:border-gray-800
                "
              >
                <div className="flex items-center gap-2">
                  <Filter
                    className="
                      h-5
                      w-5
                      text-gray-500
                      dark:text-gray-400
                    "
                    aria-hidden="true"
                  />

                  <h2
                    className="
                      text-sm
                      font-semibold
                      text-gray-900
                      dark:text-white
                    "
                  >
                    Search & Filters
                  </h2>
                </div>
              </div>

              {/* ----------------------------------------------------------
                  Filter Fields
              ---------------------------------------------------------- */}

              <div
                className="
                  grid
                  grid-cols-1
                  gap-4
                  p-6
                  md:grid-cols-2
                  lg:grid-cols-4
                "
              >
                {/* Search */}

                <div>
                  <label
                    htmlFor="lease-search"
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-gray-700
                      dark:text-gray-300
                    "
                  >
                    Search
                  </label>

                  <div className="relative">
                    <Search
                      className="
                        pointer-events-none
                        absolute
                        left-3
                        top-1/2
                        h-4
                        w-4
                        -translate-y-1/2
                        text-gray-400
                      "
                      aria-hidden="true"
                    />

                    <input
                      id="lease-search"
                      name="search"
                      type="search"
                      value={
                        filters.search
                      }
                      onChange={
                        handleFilterChange
                      }
                      placeholder="Lease number or tenant..."
                      autoComplete="off"
                      className="
                        block
                        w-full
                        rounded-lg
                        border
                        border-gray-300
                        bg-white
                        py-2.5
                        pl-10
                        pr-3
                        text-sm
                        text-gray-900
                        outline-none
                        transition
                        placeholder:text-gray-400
                        focus:border-primary-500
                        focus:ring-2
                        focus:ring-primary-500/20
                        dark:border-gray-700
                        dark:bg-gray-950
                        dark:text-white
                        dark:placeholder:text-gray-500
                      "
                    />
                  </div>
                </div>

                {/* Status */}

                <div>
                  <label
                    htmlFor="lease-status"
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-gray-700
                      dark:text-gray-300
                    "
                  >
                    Status
                  </label>

                  <select
                    id="lease-status"
                    name="status"
                    value={
                      filters.status
                    }
                    onChange={
                      handleFilterChange
                    }
                    className="
                      block
                      w-full
                      rounded-lg
                      border
                      border-gray-300
                      bg-white
                      px-3
                      py-2.5
                      text-sm
                      text-gray-900
                      outline-none
                      transition
                      focus:border-primary-500
                      focus:ring-2
                      focus:ring-primary-500/20
                      dark:border-gray-700
                      dark:bg-gray-950
                      dark:text-white
                    "
                  >
                    {STATUS_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value ||
                            "all-statuses"
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* Lease Type */}

                <div>
                  <label
                    htmlFor="lease-type"
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-gray-700
                      dark:text-gray-300
                    "
                  >
                    Lease Type
                  </label>

                  <select
                    id="lease-type"
                    name="lease_type"
                    value={
                      filters.lease_type
                    }
                    onChange={
                      handleFilterChange
                    }
                    className="
                      block
                      w-full
                      rounded-lg
                      border
                      border-gray-300
                      bg-white
                      px-3
                      py-2.5
                      text-sm
                      text-gray-900
                      outline-none
                      transition
                      focus:border-primary-500
                      focus:ring-2
                      focus:ring-primary-500/20
                      dark:border-gray-700
                      dark:bg-gray-950
                      dark:text-white
                    "
                  >
                    {LEASE_TYPE_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value ||
                            "all-types"
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* Payment Frequency */}

                <div>
                  <label
                    htmlFor="payment-frequency"
                    className="
                      mb-2
                      block
                      text-sm
                      font-medium
                      text-gray-700
                      dark:text-gray-300
                    "
                  >
                    Payment Frequency
                  </label>

                  <select
                    id="payment-frequency"
                    name="payment_frequency"
                    value={
                      filters.payment_frequency
                    }
                    onChange={
                      handleFilterChange
                    }
                    className="
                      block
                      w-full
                      rounded-lg
                      border
                      border-gray-300
                      bg-white
                      px-3
                      py-2.5
                      text-sm
                      text-gray-900
                      outline-none
                      transition
                      focus:border-primary-500
                      focus:ring-2
                      focus:ring-primary-500/20
                      dark:border-gray-700
                      dark:bg-gray-950
                      dark:text-white
                    "
                  >
                    {PAYMENT_FREQUENCY_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value ||
                            "all-frequencies"
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              {/* ----------------------------------------------------------
                  Filter Actions
              ---------------------------------------------------------- */}

              <div
                className="
                  flex
                  flex-col
                  gap-3
                  border-t
                  border-gray-100
                  px-6
                  py-4
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  dark:border-gray-800
                "
              >
                <p
                  className="
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  {hasFilters
                    ? "Filters are currently applied."
                    : "Showing all leases."}
                </p>

                <div className="flex items-center gap-2">
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={
                        handleClearFilters
                      }
                      disabled={
                        loadingList
                      }
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-lg
                        border
                        border-gray-300
                        bg-white
                        px-4
                        py-2
                        text-sm
                        font-medium
                        text-gray-700
                        transition
                        hover:bg-gray-50
                        focus:outline-none
                        focus:ring-2
                        focus:ring-gray-400
                        focus:ring-offset-2
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        dark:border-gray-700
                        dark:bg-gray-900
                        dark:text-gray-200
                        dark:hover:bg-gray-800
                      "
                    >
                      <RotateCcw
                        className="h-4 w-4"
                        aria-hidden="true"
                      />

                      Reset
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={loadingList}
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-lg
                      bg-gray-900
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      text-white
                      transition
                      hover:bg-gray-800
                      focus:outline-none
                      focus:ring-2
                      focus:ring-gray-500
                      focus:ring-offset-2
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      dark:bg-white
                      dark:text-gray-900
                      dark:hover:bg-gray-100
                    "
                  >
                    {loadingList ? (
                      <>
                        <Loader2
                          className="
                            h-4
                            w-4
                            animate-spin
                          "
                          aria-hidden="true"
                        />

                        Searching...
                      </>
                    ) : (
                      <>
                        <Search
                          className="h-4 w-4"
                          aria-hidden="true"
                        />

                        Search
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* ==============================================================
              LEASE RECORDS
          ============================================================== */}

          <div
            className="
              overflow-hidden
              rounded-xl
              border
              border-gray-200
              bg-white
              shadow-sm
              dark:border-gray-800
              dark:bg-gray-900
            "
          >
            {/* ------------------------------------------------------------
                Records Header
            ------------------------------------------------------------ */}

            <div
              className="
                flex
                flex-col
                gap-2
                border-b
                border-gray-100
                px-6
                py-4
                sm:flex-row
                sm:items-center
                sm:justify-between
                dark:border-gray-800
              "
            >
              <div>
                <h2
                  className="
                    text-base
                    font-semibold
                    text-gray-900
                    dark:text-white
                  "
                >
                  Lease Records
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  {totalRecords > 0
                    ? `${totalRecords.toLocaleString()} lease${totalRecords === 1
                      ? ""
                      : "s"
                    }`
                    : "Lease records"}
                </p>
              </div>

              {hasFilters && (
                <span
                  className="
                    inline-flex
                    w-fit
                    items-center
                    rounded-full
                    bg-indigo-50
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-indigo-700
                    dark:bg-indigo-950/40
                    dark:text-indigo-300
                  "
                >
                  Filtered results
                </span>
              )}
            </div>

            {/* ------------------------------------------------------------
                Loading Indicator
            ------------------------------------------------------------ */}

            {loadingList &&
              leaseCollection.length > 0 && (
                <div
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                    border-b
                    border-gray-100
                    bg-gray-50
                    px-6
                    py-2.5
                    text-sm
                    text-gray-600
                    dark:border-gray-800
                    dark:bg-gray-950
                    dark:text-gray-300
                  "
                  role="status"
                  aria-live="polite"
                >
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />

                  Updating lease records...
                </div>
              )}

            {/* ------------------------------------------------------------
                Empty State
            ------------------------------------------------------------ */}

            {!loadingList &&
              leaseCollection.length === 0 && (
                <LeaseEmptyState
                  hasFilters={hasFilters}
                  onCreate={
                    hasFilters
                      ? undefined
                      : handleCreateLease
                  }
                  onReset={
                    hasFilters
                      ? handleClearFilters
                      : undefined
                  }
                  onRefresh={
                    !hasFilters
                      ? handleRefresh
                      : undefined
                  }
                  showCreate={!hasFilters}
                  showReset={hasFilters}
                  showRefresh={!hasFilters}
                  loading={
                    loadingList ||
                    isRefreshing
                  }
                />
              )}

            {/* ------------------------------------------------------------
                Lease Table
            ------------------------------------------------------------ */}

            {leaseCollection.length > 0 && (
              <LeaseTable
                leases={leaseCollection}
                loading={loadingList}
                showActions
                onRowClick={
                  handleViewLease
                }
              />
            )}

            {/* ------------------------------------------------------------
                Pagination
            ------------------------------------------------------------ */}

            {!loadingList &&
              leaseCollection.length > 0 && (
                <LeasePagination
                  pagination={pagination}
                  loading={loadingList}
                  onPageChange={
                    handlePageChange
                  }
                  onPerPageChange={
                    handlePerPageChange
                  }
                  showPerPage
                  showSummary
                  showFirstLast
                />
              )}
          </div>
        </>
      )}
    </div>
  );
};

export default LeaseList;