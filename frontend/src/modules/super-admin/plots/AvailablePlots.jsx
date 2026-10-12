
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
  ArrowRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  Loader2,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import PlotHeader from "./PlotHeader";
import PlotTable from "./PlotTable";
import { usePlot } from "../../../hooks/usePlots";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 12;
const AVAILABLE_STATUS = "available";

const EMPTY_FILTERS = {
  county: "",
  min_price: "",
  max_price: "",
  min_size: "",
  max_size: "",
};

/*
|--------------------------------------------------------------------------
| API HELPERS
|--------------------------------------------------------------------------
*/

const getResponseBody = (response) => {
  if (
    response &&
    typeof response === "object" &&
    response.data &&
    typeof response.data === "object" &&
    (
      "config" in response ||
      "headers" in response ||
      typeof response.status === "number"
    )
  ) {
    return response.data;
  }

  return response;
};

const unwrapResponse = (response) => {
  let result = getResponseBody(response);

  for (let index = 0; index < 4; index += 1) {
    if (
      result &&
      typeof result === "object" &&
      !Array.isArray(result) &&
      result.data !== undefined &&
      result.data !== null &&
      (
        "code" in result ||
        "message" in result ||
        "meta" in result ||
        "links" in result ||
        typeof result.status === "boolean"
      )
    ) {
      result = result.data;
      continue;
    }

    break;
  }

  return result;
};

const extractPlots = (response) => {
  const body = getResponseBody(response);
  const result = unwrapResponse(response);

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.plots)) return result.plots;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data)) return result.data;

  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.plots)) return body.plots;
  if (Array.isArray(body?.data?.plots)) {
    return body.data.plots;
  }

  return [];
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
  fallback = "Unable to load available plots. Please try again.",
) => {
  const responseData = error?.response?.data;

  if (responseData?.errors) {
    const firstError = Object.values(responseData.errors)
      .flat()
      .find((message) => typeof message === "string");

    if (firstError) return firstError;
  }

  return (
    responseData?.message ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
};

const getPagination = (
  response,
  fallbackPage = 1,
  fallbackPerPage = DEFAULT_PER_PAGE,
) => {
  const body = getResponseBody(response);
  const result = unwrapResponse(response);

  const meta =
    body?.meta ||
    body?.data?.meta ||
    result?.meta ||
    result?.pagination ||
    result?.data?.meta ||
    {};

  const currentPage = Number(
    meta.current_page ??
      meta.currentPage ??
      result?.current_page ??
      fallbackPage,
  );

  const perPage = Number(
    meta.per_page ??
      meta.perPage ??
      result?.per_page ??
      fallbackPerPage,
  );

  const total = Number(
    meta.total ??
      meta.total_records ??
      result?.total ??
      body?.total ??
      (Array.isArray(result) ? result.length : 0),
  );

  const safePage =
    Number.isFinite(currentPage) && currentPage > 0
      ? currentPage
      : 1;

  const safePerPage =
    Number.isFinite(perPage) && perPage > 0
      ? perPage
      : fallbackPerPage;

  const safeTotal =
    Number.isFinite(total) && total >= 0 ? total : 0;

  const lastPage = Number(
    meta.last_page ??
      meta.lastPage ??
      result?.last_page ??
      Math.max(1, Math.ceil(safeTotal / safePerPage)),
  );

  return {
    currentPage: safePage,
    perPage: safePerPage,
    total: safeTotal,
    lastPage:
      Number.isFinite(lastPage) && lastPage > 0
        ? lastPage
        : 1,
  };
};

/*
|--------------------------------------------------------------------------
| FORMATTING HELPERS
|--------------------------------------------------------------------------
*/

const formatCurrency = (value, currency = "KES") => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-KE")}`;
  }
};

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return number.toLocaleString("en-KE", {
    maximumFractionDigits: 2,
  });
};

const getNumericValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
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

const getActiveState = (value) => {
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

const getPlotStatus = (plot) =>
  String(plot?.status ?? AVAILABLE_STATUS)
    .trim()
    .toLowerCase();

const getPlotPrice = (plot) =>
  Number(
    plot?.asking_price ??
      plot?.price ??
      plot?.sale_price ??
      0,
  ) || 0;


/*
|--------------------------------------------------------------------------
| STATISTICS CARD
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
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
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
| AVAILABLE PLOTS PAGE
|--------------------------------------------------------------------------
*/

export default function AvailablePlots() {
  const navigate = useNavigate();

  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  const {
    loading: hookLoading = false,
    error: hookError,
    getPlots,
    getStatistics,
    clearError,
  } = usePlot();

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [plots, setPlots] = useState([]);
  const [statistics, setStatistics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    ...EMPTY_FILTERS,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: DEFAULT_PER_PAGE,
    total: 0,
    lastPage: 1,
  });

  const [refreshKey, setRefreshKey] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | REQUEST LIFECYCLE
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
  | FILTER VALIDATION
  |--------------------------------------------------------------------------
  */

  const invalidPriceRange =
    appliedFilters.min_price !== "" &&
    appliedFilters.max_price !== "" &&
    Number(appliedFilters.min_price) >
      Number(appliedFilters.max_price);

  const invalidSizeRange =
    appliedFilters.min_size !== "" &&
    appliedFilters.max_size !== "" &&
    Number(appliedFilters.min_size) >
      Number(appliedFilters.max_size);

  const hasInvalidFilters =
    invalidPriceRange || invalidSizeRange;

  const activeFilterCount = Object.values(appliedFilters).filter(
    (value) => String(value).trim() !== "",
  ).length;

  /*
  |--------------------------------------------------------------------------
  | LOAD PLOTS
  |--------------------------------------------------------------------------
  */

  const loadPlots = useCallback(
    async ({ page = 1, showRefresh = false } = {}) => {
      const requestId = ++requestIdRef.current;

      if (typeof getPlots !== "function") {
        setPageError(
          "The getPlots action is unavailable. Check your usePlot hook.",
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setPageError("");

      try {
        const params = {
          page,
          per_page: perPage,
          status: AVAILABLE_STATUS,
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
              "Unable to load available plots.",
          );
        }

        const records = extractPlots(response);

        const availablePlots = records.filter(
          (plot) =>
            getPlotStatus(plot) === AVAILABLE_STATUS &&
            getActiveState(plot?.is_active),
        );

        const nextPagination = getPagination(
          response,
          page,
          perPage,
        );

        setPlots(availablePlots);

        setPagination({
          ...nextPagination,
          currentPage: page,
          perPage,
        });

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
          lastPage: 1,
        }));

        setPageError(getErrorMessage(error));
      } finally {
        if (
          mountedRef.current &&
          requestId === requestIdRef.current
        ) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      getPlots,
      search,
      appliedFilters,
      perPage,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | LOAD STATISTICS
  |--------------------------------------------------------------------------
  */

  const loadStatistics = useCallback(async () => {
    if (typeof getStatistics !== "function") {
      return;
    }

    try {
      const response = await getStatistics();

      if (
        !mountedRef.current ||
        isFailedResponse(response)
      ) {
        return;
      }

      const result = unwrapResponse(response);

      const nextStatistics =
        result?.statistics ||
        result?.data?.statistics ||
        result?.data ||
        result ||
        {};

      if (
        nextStatistics &&
        typeof nextStatistics === "object"
      ) {
        setStatistics(nextStatistics);
      }
    } catch {
      // Statistics are optional. Inventory can still be displayed.
    }
  }, [getStatistics]);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD AND REFRESH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadPlots({ page: currentPage });
  }, [loadPlots, currentPage, refreshKey]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics, refreshKey]);

  /*
  |--------------------------------------------------------------------------
  | COUNTY OPTIONS
  |--------------------------------------------------------------------------
  */

  const countyOptions = useMemo(() => {
    const names = plots
      .map(
        (plot) =>
          plot?.county?.name ??
          plot?.county_name ??
          plot?.area?.county?.name ??
          "",
      )
      .filter(
        (name) =>
          typeof name === "string" && name.trim(),
      );

    return [...new Set(names)].sort((a, b) =>
      a.localeCompare(b),
    );
  }, [plots]);

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    setPageError("");
    setCurrentPage(1);
    setSearch(searchInput.trim());
  };

  /*
  |--------------------------------------------------------------------------
  | APPLY FILTERS
  |--------------------------------------------------------------------------
  */

  const handleApplyFilters = () => {
    const invalidPrice =
      filters.min_price !== "" &&
      filters.max_price !== "" &&
      Number(filters.min_price) > Number(filters.max_price);

    const invalidSize =
      filters.min_size !== "" &&
      filters.max_size !== "" &&
      Number(filters.min_size) > Number(filters.max_size);

    if (invalidPrice || invalidSize) {
      setPageError(
        "Please check your filters. Minimum values cannot exceed maximum values.",
      );
      return;
    }

    setPageError("");
    setCurrentPage(1);
    setAppliedFilters({ ...filters });
  };

  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
    setCurrentPage(1);
    setPageError("");
  };

  /*
  |--------------------------------------------------------------------------
  | PAGE SIZE
  |--------------------------------------------------------------------------
  */

  const handlePerPageChange = (event) => {
    const nextPerPage = Number(event.target.value);

    if (!Number.isFinite(nextPerPage) || nextPerPage < 1) {
      return;
    }

    setPerPage(nextPerPage);
    setCurrentPage(1);
  };

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = () => {
    clearError?.();
    setPageError("");
    setRefreshKey((previous) => previous + 1);
  };

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const handlePageChange = (nextPage) => {
    if (
      nextPage < 1 ||
      nextPage > pagination.lastPage ||
      nextPage === currentPage
    ) {
      return;
    }

    setCurrentPage(nextPage);
  };

  /*
  |--------------------------------------------------------------------------
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const handleView = useCallback(
    (plotId) => {
      if (plotId === undefined || plotId === null) {
        return;
      }

      navigate(`/super-admin/plots/${plotId}`);
    },
    [navigate],
  );

  const handleEdit = useCallback(
    (plotId) => {
      if (plotId === undefined || plotId === null) {
        return;
      }

      navigate(`/super-admin/plots/${plotId}/edit`);
    },
    [navigate],
  );

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const totalAvailable =
    getNumericValue(
      statistics?.available_count,
      statistics?.available,
      statistics?.available_plots,
      statistics?.inventory?.available,
    ) ?? pagination.total;

  const totalInventoryValue = getNumericValue(
    statistics?.available_value,
    statistics?.inventory_value,
    statistics?.inventory?.available_value,
  );

  const averagePrice = getNumericValue(
    statistics?.average_available_price,
    statistics?.average_plot_value,
    statistics?.average_price,
    statistics?.inventory?.average_price,
  );

  const visibleInventoryValue = useMemo(
    () =>
      plots.reduce(
        (total, plot) => total + getPlotPrice(plot),
        0,
      ),
    [plots],
  );

  const visibleAveragePrice =
    plots.length > 0
      ? visibleInventoryValue / plots.length
      : 0;

  /*
  |--------------------------------------------------------------------------
  | PAGE STATUS
  |--------------------------------------------------------------------------
  */

  const displayedError =
    pageError ||
    (typeof hookError === "string"
      ? hookError
      : hookError?.message || "");

  const isBusy = loading || Boolean(hookLoading);

  const showingFrom =
    pagination.total === 0
      ? 0
      : (currentPage - 1) * perPage + 1;

  const showingTo = Math.min(
    currentPage * perPage,
    pagination.total,
  );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 w-full space-y-6">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <MapPin className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Available Plots
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Browse available land plots, compare prices, and manage plot inventory.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isBusy || refreshing}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* Shared plot navigation/header */}
      <PlotHeader
        title="Available Plots"
        subtitle="Manage available plots and land inventory."
        activeTab="available"
      />

      {/* ================================================================
          ERROR MESSAGE
      ================================================================ */}

      {displayedError && (
        <div
          role="alert"
          className="flex min-w-0 items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-800">
              Unable to load available plots
            </p>

            <p className="mt-1 break-words text-sm text-red-700">
              {getErrorMessage(displayedError)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPageError("")}
            aria-label="Dismiss error"
            className="shrink-0 rounded-lg p-1 text-red-600 transition hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ================================================================
          STATISTICS
      ================================================================ */}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticCard
          title="Available plots"
          value={
            isBusy && !statistics
              ? "..."
              : formatNumber(totalAvailable)
          }
          description="Plots currently available for sale"
          icon={CheckCircle2}
          iconClass="text-emerald-600"
          iconBackground="bg-emerald-50"
        />

        <StatisticCard
          title="Total inventory value"
          value={
            totalInventoryValue !== null
              ? formatCurrency(totalInventoryValue)
              : formatCurrency(visibleInventoryValue)
          }
          description="Combined asking value of available inventory"
          icon={Banknote}
          iconClass="text-blue-600"
          iconBackground="bg-blue-50"
        />

        <StatisticCard
          title="Average asking price"
          value={formatCurrency(
            averagePrice !== null
              ? averagePrice
              : visibleAveragePrice,
          )}
          description="Average price per displayed plot"
          icon={Banknote}
          iconClass="text-violet-600"
          iconBackground="bg-violet-50"
        />

        <StatisticCard
          title="Matching results"
          value={formatNumber(pagination.total)}
          description="Plots matching your current search and filters"
          icon={ClipboardList}
          iconClass="text-amber-600"
          iconBackground="bg-amber-50"
        />
      </div>

      {/* ================================================================
          SEARCH AND FILTERS
      ================================================================ */}

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-w-0 flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <form
            onSubmit={handleSearchSubmit}
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
                placeholder="Search plot name, code, county, or area..."
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </form>

          <button
            type="button"
            onClick={() =>
              setFiltersOpen((previous) => !previous)
            }
            aria-expanded={filtersOpen}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              filtersOpen || activeFilterCount > 0
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters

            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {filtersOpen && (
          <div className="space-y-4 border-b border-slate-100 bg-slate-50/70 p-4">
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="min-w-0">
                <label
                  htmlFor="available-county"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  County
                </label>

                <select
                  id="available-county"
                  value={filters.county}
                  onChange={(event) =>
                    setFilters((previous) => ({
                      ...previous,
                      county: event.target.value,
                    }))
                  }
                  className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">All counties</option>

                  {countyOptions.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="available-min-price"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Minimum price (KES)
                </label>

                <input
                  id="available-min-price"
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
                  htmlFor="available-max-price"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Maximum price (KES)
                </label>

                <input
                  id="available-max-price"
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
                  htmlFor="available-min-size"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Minimum size
                </label>

                <input
                  id="available-min-size"
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
                  htmlFor="available-max-size"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Maximum size
                </label>

                <input
                  id="available-max-size"
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
                disabled={isBusy}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Filter className="h-4 w-4" />
                Apply filters
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset filters
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================
          INVENTORY HEADING
      ================================================================ */}

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">
            Available inventory
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {isBusy
              ? "Loading plot inventory..."
              : `${formatNumber(pagination.total)} plot(s) found`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <label
            htmlFor="available-per-page"
            className="whitespace-nowrap text-sm text-slate-500"
          >
            Rows per page
          </label>

          <select
            id="available-per-page"
            value={perPage}
            onChange={(event) => {
              const nextPerPage = Number(event.target.value);
              setPerPage(nextPerPage);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
        </div>
      </div>

      {/* ================================================================
          LOADING STATE
      ================================================================ */}

      {isBusy && plots.length === 0 && (
        <div className="flex min-h-64 w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />

          <p className="mt-3 text-sm font-medium text-slate-700">
            Loading available plots...
          </p>

          <p className="mt-1 text-center text-xs text-slate-500">
            Please wait while we retrieve your inventory.
          </p>
        </div>
      )}

      {/* ================================================================
          EMPTY STATE
      ================================================================ */}

      {!isBusy && plots.length === 0 && (
        <div className="flex min-h-72 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <MapPin className="h-7 w-7 text-emerald-600" />
          </div>

          <h3 className="mt-4 text-base font-semibold text-slate-900">
            No available plots found
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            There are no available plots matching your current search
            or filters. Try adjusting your criteria or clearing
            your filters.
          </p>

          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Clear search and filters
            </button>

            <button
              type="button"
              onClick={() => navigate("/super-admin/plots/create")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Register a plot
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================================================================
          PLOT TABLE
      ================================================================ */}

      {plots.length > 0 && (
        <section className="min-w-0 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ClipboardList className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-900">
                  Plot inventory
                </h3>

                <p className="mt-0.5 text-sm text-slate-500">
                  Review plot locations, sizes, asking prices, and details.
                </p>
              </div>
            </div>

            <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {formatNumber(pagination.total)} available
            </div>
          </div>

          <div className="w-full min-w-0 overflow-x-auto">
            <PlotTable
              plots={plots}
              loading={isBusy || refreshing}
              onView={handleView}
              onEdit={handleEdit}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {plots.length}
              </span>{" "}
              plot(s) displayed on this page
            </p>

            <p className="text-xs text-slate-400">
              Default currency: KES
            </p>
          </div>
        </section>
      )}

      {/* ================================================================
          PAGINATION
      ================================================================ */}

      {!isBusy && plots.length > 0 && (
        <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {showingFrom}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-900">
              {showingTo}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">
              {formatNumber(pagination.total)}
            </span>{" "}
            plots
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                handlePageChange(currentPage - 1)
              }
              disabled={currentPage <= 1 || isBusy}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              Page {currentPage} of {pagination.lastPage}
            </span>

            <button
              type="button"
              onClick={() =>
                handlePageChange(currentPage + 1)
              }
              disabled={
                currentPage >= pagination.lastPage || isBusy
              }
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================================================================
          REFRESH INDICATOR
      ================================================================ */}

      {refreshing && (
        <div className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          Refreshing available plots...
        </div>
      )}
    </div>
  );
}
