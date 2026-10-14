import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import PlotHeader from "./PlotHeader";
import PlotTable from "./PlotTable";
import { usePlot } from "../../../hooks/usePlots";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 12;
const RESERVED_STATUS = "reserved";

const EMPTY_FILTERS = {
  county: "",
  min_price: "",
  max_price: "",
  min_size: "",
  max_size: "",
};

/*
|--------------------------------------------------------------------------
| API response helpers
|--------------------------------------------------------------------------
*/

const getResponseBody = (response) => {
  if (
    response &&
    typeof response === "object" &&
    response.data &&
    typeof response.data === "object" &&
    ("config" in response ||
      "headers" in response ||
      typeof response.status === "number")
  ) {
    return response.data;
  }

  return response;
};

const unwrapResponse = (response) => {
  const body = getResponseBody(response);

  if (
    body &&
    typeof body === "object" &&
    body.data !== undefined &&
    body.data !== null &&
    (
      "code" in body ||
      "message" in body ||
      "meta" in body ||
      "links" in body ||
      typeof body.status === "boolean"
    )
  ) {
    return body.data;
  }

  return body;
};

const isFailedResponse = (response) => {
  const body = getResponseBody(response);

  if (!body || typeof body !== "object") {
    return false;
  }

  return (
    body.success === false ||
    body.status === false ||
    (typeof body.code === "number" && body.code >= 400)
  );
};

const getErrorMessage = (
  error,
  fallback = "Something went wrong.",
) => {
  if (typeof error === "string") {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
};

const extractPlots = (response) => {
  const body = getResponseBody(response);
  const result = unwrapResponse(response);

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.plots)) {
    return result.plots;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.data?.plots)) {
    return result.data.plots;
  }

  if (Array.isArray(body?.data)) {
    return body.data;
  }

  if (Array.isArray(body?.plots)) {
    return body.plots;
  }

  return [];
};

const extractPagination = (response, fallback = {}) => {
  const body = getResponseBody(response);
  const result = unwrapResponse(response);

  const meta =
    body?.meta ||
    body?.data?.meta ||
    result?.meta ||
    result?.pagination ||
    result?.data?.meta ||
    result?.data?.pagination ||
    {};

  const links =
    body?.links ||
    body?.data?.links ||
    result?.links ||
    result?.data?.links ||
    {};

  const currentPage = Number(
    meta.current_page ??
    meta.currentPage ??
    fallback.currentPage ??
    1,
  );

  const perPage = Number(
    meta.per_page ??
    meta.perPage ??
    fallback.perPage ??
    DEFAULT_PER_PAGE,
  );

  const total = Number(
    meta.total ??
    meta.total_records ??
    meta.totalRecords ??
    result?.total ??
    fallback.total ??
    0,
  );

  const safePage = Math.max(1, currentPage || 1);
  const safePerPage = Math.max(1, perPage || DEFAULT_PER_PAGE);
  const safeTotal = Math.max(0, total || 0);

  const calculatedLastPage = Math.max(
    1,
    Math.ceil(safeTotal / safePerPage),
  );

  const lastPage = Number(
    meta.last_page ??
    meta.lastPage ??
    result?.last_page ??
    calculatedLastPage,
  );

  return {
    currentPage: safePage,
    perPage: safePerPage,
    total: safeTotal,
    lastPage: Math.max(1, lastPage || 1),
    from:
      meta.from ??
      (safeTotal ? (safePage - 1) * safePerPage + 1 : 0),
    to:
      meta.to ??
      Math.min(safePage * safePerPage, safeTotal),
    prevPageUrl: links.prev ?? null,
    nextPageUrl: links.next ?? null,
  };
};

/*
|--------------------------------------------------------------------------
| Formatting helpers
|--------------------------------------------------------------------------
*/

const formatCurrency = (amount, currency = "KES") => {
  const value = Number(amount ?? 0);

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  } catch {
    return `KES ${new Intl.NumberFormat("en-KE").format(
      Number.isFinite(value) ? value : 0,
    )}`;
  }
};

const formatNumber = (value) => {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
};

const getAskingPrice = (plot) =>
  Number(
    plot?.asking_price ??
    plot?.price ??
    plot?.sale_price ??
    0,
  ) || 0;

const getNumericStat = (...values) => {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      typeof value !== "object"
    ) {
      const number = Number(value);

      if (Number.isFinite(number)) {
        return number;
      }
    }
  }

  return null;
};

const isActivePlot = (plot) => {
  const value = plot?.is_active;

  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === "string") {
    return !["false", "0", "inactive", "no"].includes(
      value.trim().toLowerCase(),
    );
  }

  return value === true || value === 1;
};

/*
|--------------------------------------------------------------------------
| Statistics card
|--------------------------------------------------------------------------
*/

function StatisticCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass = "text-emerald-600",
  iconBackground = "bg-emerald-50",
}) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 break-words text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs leading-5 text-gray-500">
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBackground}`}
        >
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Main reserved plots page
|--------------------------------------------------------------------------
*/

export default function ReservedPlots() {
  const navigate = useNavigate();

  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  const {
    getPlots,
    getStatistics,
    loading: hookLoading,
    error: hookError,
    clearError,
  } = usePlot();

  const [plots, setPlots] = useState([]);
  const [statistics, setStatistics] = useState({});

  const [loadingPlots, setLoadingPlots] = useState(true);
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  const [pageError, setPageError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    ...EMPTY_FILTERS,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: DEFAULT_PER_PAGE,
    total: 0,
    lastPage: 1,
    from: 0,
    to: 0,
  });

  const [refreshKey, setRefreshKey] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | Request lifecycle
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Load reserved plots
  |--------------------------------------------------------------------------
  */

  const loadPlots = useCallback(
    async (requestedPage = 1) => {
      const requestId = ++requestIdRef.current;

      if (typeof getPlots !== "function") {
        setPageError(
          "The usePlot hook must provide a getPlots(params) function.",
        );

        setPlots([]);
        setPagination((previous) => ({
          ...previous,
          total: 0,
          from: 0,
          to: 0,
          lastPage: 1,
        }));
        setLoadingPlots(false);
        return;
      }

      setLoadingPlots(true);
      setPageError("");

      try {
        const params = {
          page: requestedPage,
          per_page: pagination.perPage,
          status: RESERVED_STATUS,
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        if (appliedFilters.county.trim()) {
          params.county = appliedFilters.county.trim();
        }

        if (appliedFilters.min_price !== "") {
          params.min_price = appliedFilters.min_price;
        }

        if (appliedFilters.max_price !== "") {
          params.max_price = appliedFilters.max_price;
        }

        if (appliedFilters.min_size !== "") {
          params.min_size = appliedFilters.min_size;
        }

        if (appliedFilters.max_size !== "") {
          params.max_size = appliedFilters.max_size;
        }

        const response = await getPlots(params);

        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        if (isFailedResponse(response)) {
          throw new Error(
            getResponseBody(response)?.message ||
            "Failed to load reserved plots.",
          );
        }

        const records = extractPlots(response);

        const reservedPlots = records.filter(
          (plot) =>
            String(plot?.status || "").toLowerCase() ===
            RESERVED_STATUS && isActivePlot(plot),
        );

        const serverPagination = extractPagination(response, {
          currentPage: requestedPage,
          perPage: pagination.perPage,
          total: reservedPlots.length,
        });

        setPlots(reservedPlots);

        setPagination((previous) => ({
          ...previous,
          ...serverPagination,
          currentPage: requestedPage,
          perPage: previous.perPage,
        }));

        setPageError("");
      } catch (error) {
        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setPlots([]);

        setPagination((previous) => ({
          ...previous,
          total: 0,
          from: 0,
          to: 0,
          lastPage: 1,
        }));

        setPageError(
          getErrorMessage(
            error,
            "Unable to load reserved plots.",
          ),
        );
      } finally {
        if (
          mountedRef.current &&
          requestId === requestIdRef.current
        ) {
          setLoadingPlots(false);
        }
      }
    },
    [
      getPlots,
      search,
      appliedFilters,
      pagination.perPage,
    ],
  );

  useEffect(() => {
    loadPlots(pagination.currentPage);
  }, [loadPlots, pagination.currentPage, refreshKey]);

  /*
  |--------------------------------------------------------------------------
  | Load statistics
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    const loadStatistics = async () => {
      if (typeof getStatistics !== "function") {
        setLoadingStatistics(false);
        return;
      }

      setLoadingStatistics(true);

      try {
        const response = await getStatistics();

        if (cancelled || isFailedResponse(response)) {
          return;
        }

        const result = unwrapResponse(response);

        const nextStatistics =
          result?.statistics ||
          result?.data?.statistics ||
          result?.data ||
          result ||
          {};

        setStatistics(
          nextStatistics &&
            typeof nextStatistics === "object"
            ? nextStatistics
            : {},
        );
      } catch {
        // The page remains usable if statistics fail to load.
      } finally {
        if (!cancelled) {
          setLoadingStatistics(false);
        }
      }
    };

    loadStatistics();

    return () => {
      cancelled = true;
    };
  }, [getStatistics, refreshKey]);

  /*
  |--------------------------------------------------------------------------
  | Search and filters
  |--------------------------------------------------------------------------
  */

  const handleSearch = (event) => {
    event.preventDefault();

    setPagination((previous) => ({
      ...previous,
      currentPage: 1,
    }));

    setSearch(searchInput.trim());
  };

  const handleApplyFilters = () => {
    setPagination((previous) => ({
      ...previous,
      currentPage: 1,
    }));

    setAppliedFilters({ ...filters });
  };

  const handleResetFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
    setSearchInput("");
    setSearch("");

    setPagination((previous) => ({
      ...previous,
      currentPage: 1,
    }));
  };

  const handlePerPageChange = (event) => {
    const nextPerPage = Number(event.target.value);

    if (!Number.isFinite(nextPerPage) || nextPerPage < 1) {
      return;
    }

    setPagination((previous) => ({
      ...previous,
      currentPage: 1,
      perPage: nextPerPage,
    }));
  };

  const handlePageChange = (nextPage) => {
    if (
      nextPage < 1 ||
      nextPage > pagination.lastPage ||
      nextPage === pagination.currentPage
    ) {
      return;
    }

    setPagination((previous) => ({
      ...previous,
      currentPage: nextPage,
    }));
  };

  const handleRefresh = () => {
    if (typeof clearError === "function") {
      clearError();
    }

    setPageError("");
    setRefreshKey((previous) => previous + 1);
  };

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleView = useCallback(
    (id) => {
      if (!id) return;
      navigate(`/super-admin/plots/${id}`);
    },
    [navigate],
  );

  const handleEdit = useCallback(
    (id) => {
      if (!id) return;
      navigate(`/super-admin/plots/${id}/edit`);
    },
    [navigate],
  );

  /*
  |--------------------------------------------------------------------------
  | Derived values
  |--------------------------------------------------------------------------
  */

  const statValues = useMemo(() => {
    const inventory = statistics?.inventory || {};

    const reservedObject =
      statistics?.reserved &&
        typeof statistics.reserved === "object"
        ? statistics.reserved
        : {};

    const countFromApi = getNumericStat(
      statistics?.reserved_count,
      statistics?.reserved_plots,
      reservedObject?.count,
      inventory?.reserved,
    );

    const valueFromApi = getNumericStat(
      statistics?.reserved_value,
      statistics?.reserved_amount,
      reservedObject?.value,
      inventory?.reserved_value,
    );

    const averageFromApi = getNumericStat(
      statistics?.average_reserved_price,
      statistics?.average_price,
      reservedObject?.average_price,
    );

    const visibleValue = plots.reduce(
      (sum, plot) => sum + getAskingPrice(plot),
      0,
    );

    const count = countFromApi ?? pagination.total;
    const value = valueFromApi ?? visibleValue;

    const averagePrice =
      averageFromApi ?? (count > 0 ? value / count : 0);

    return {
      count: Math.max(0, count),
      value: Math.max(0, value),
      averagePrice: Math.max(0, averagePrice),
    };
  }, [statistics, pagination.total, plots]);

  const hasActiveFilters = Object.values(appliedFilters).some(
    (value) => String(value).trim() !== "",
  );

  const activeFilterCount = Object.values(appliedFilters).filter(
    (value) => String(value).trim() !== "",
  ).length;

  const displayError = pageError || hookError;
  const isLoading = loadingPlots || Boolean(hookLoading);

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 w-full space-y-6">
      {/* Header */}
      <PlotHeader
        title="Reserved Plots"
        subtitle="Review and manage plots that have been reserved."
        activeTab="reserved"
      />

      {/* Page heading and actions */}
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <MapPin className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Reserved Plots
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Manage reserved land plots, reservation values, and inventory.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""
              }`}
          />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatisticCard
          title="Reserved plots"
          value={
            loadingStatistics
              ? "..."
              : formatNumber(statValues.count)
          }
          description="Plots currently marked as reserved"
          icon={Clock}
          iconClass="text-amber-600"
          iconBackground="bg-amber-50"
        />

        <StatisticCard
          title="Reserved inventory value"
          value={
            loadingStatistics && !Object.keys(statistics).length
              ? "..."
              : formatCurrency(statValues.value)
          }
          description="Based on available reservation-value data"
          icon={ArrowUp}
          iconClass="text-emerald-600"
          iconBackground="bg-emerald-50"
        />

        <StatisticCard
          title="Average plot price"
          value={
            loadingStatistics && !Object.keys(statistics).length
              ? "..."
              : formatCurrency(statValues.averagePrice)
          }
          description="Average value per reserved plot"
          icon={ArrowDown}
          iconClass="text-blue-600"
          iconBackground="bg-blue-50"
        />
      </div>

      {/* Search and filters */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <form
            onSubmit={handleSearch}
            className="flex min-w-0 w-full flex-col gap-2 sm:flex-row lg:max-w-2xl"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search by plot name, code, or location..."
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <button
              type="submit"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </form>

          <button
            type="button"
            onClick={() =>
              setShowFilters((previous) => !previous)
            }
            aria-expanded={showFilters}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${showFilters || hasActiveFilters
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters

            {hasActiveFilters && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-4 border-b border-slate-100 bg-slate-50/70 p-4">
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="min-w-0">
                <label
                  htmlFor="reserved-county"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  County
                </label>

                <input
                  id="reserved-county"
                  type="text"
                  value={filters.county}
                  onChange={(event) =>
                    setFilters((previous) => ({
                      ...previous,
                      county: event.target.value,
                    }))
                  }
                  placeholder="Enter county"
                  className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="reserved-min-price"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Minimum price (KES)
                </label>

                <input
                  id="reserved-min-price"
                  type="number"
                  min="0"
                  value={filters.min_price}
                  onChange={(event) =>
                    setFilters((previous) => ({
                      ...previous,
                      min_price: event.target.value,
                    }))
                  }
                  placeholder="Minimum price"
                  className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="reserved-max-price"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Maximum price (KES)
                </label>

                <input
                  id="reserved-max-price"
                  type="number"
                  min="0"
                  value={filters.max_price}
                  onChange={(event) =>
                    setFilters((previous) => ({
                      ...previous,
                      max_price: event.target.value,
                    }))
                  }
                  placeholder="Maximum price"
                  className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="reserved-min-size"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Minimum size
                </label>

                <input
                  id="reserved-min-size"
                  type="number"
                  min="0"
                  step="any"
                  value={filters.min_size}
                  onChange={(event) =>
                    setFilters((previous) => ({
                      ...previous,
                      min_size: event.target.value,
                    }))
                  }
                  placeholder="Minimum size"
                  className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="reserved-max-size"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Maximum size
                </label>

                <input
                  id="reserved-max-size"
                  type="number"
                  min="0"
                  step="any"
                  value={filters.max_size}
                  onChange={(event) =>
                    setFilters((previous) => ({
                      ...previous,
                      max_size: event.target.value,
                    }))
                  }
                  placeholder="Maximum size"
                  className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                <Filter className="h-4 w-4" />
                Apply filters
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Reset filters
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Error message */}
      {displayError && (
        <div
          role="alert"
          className="flex min-w-0 items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-800">
              Unable to load reserved plots
            </p>

            <p className="mt-1 break-words text-sm text-red-700">
              {getErrorMessage(displayError)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Reserved inventory */}
      <section className="min-w-0 space-y-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">
              Reserved inventory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {formatNumber(pagination.total)} reserved{" "}
              {pagination.total === 1 ? "plot" : "plots"} found
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <label
              htmlFor="reserved-per-page"
              className="whitespace-nowrap text-sm text-slate-500"
            >
              Show
            </label>

            <select
              id="reserved-per-page"
              value={pagination.perPage}
              onChange={handlePerPageChange}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-64 w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8">
            <LoaderCircle className="h-9 w-9 animate-spin text-emerald-600" />

            <p className="mt-3 text-sm font-medium text-slate-700">
              Loading reserved plots...
            </p>

            <p className="mt-1 text-center text-xs text-slate-500">
              Please wait while we retrieve your inventory.
            </p>
          </div>
        ) : plots.length === 0 ? (
          <div className="flex min-h-72 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <MapPin className="h-7 w-7 text-amber-600" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No reserved plots found
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              There are no plots matching your current search or
              filters. Try adjusting your criteria or refreshing
              the list.
            </p>

            {(search || hasActiveFilters) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Clear search and filters
              </button>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh plots
            </button>
          </div>
        ) : (
          <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="w-full min-w-0 overflow-x-auto">
              <PlotTable
                plots={plots}
                loading={false}
                onView={handleView}
                onEdit={handleEdit}
              />
            </div>
          </div>
        )}
      </section>

      {/* Pagination */}
      {!isLoading && plots.length > 0 && (
        <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-900">
              {pagination.from || 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-slate-900">
              {pagination.to || plots.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-900">
              {pagination.total || plots.length}
            </span>{" "}
            plots
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                handlePageChange(pagination.currentPage - 1)
              }
              disabled={pagination.currentPage <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              Page {pagination.currentPage} of {pagination.lastPage}
            </span>

            <button
              type="button"
              onClick={() =>
                handlePageChange(pagination.currentPage + 1)
              }
              disabled={
                pagination.currentPage >= pagination.lastPage
              }
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}