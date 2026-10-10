
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
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import PlotHeader from "./PlotHeader";
import PlotStatusBadge from "./PlotStatusBadge";
import { usePlot } from "../../../hooks/usePlots";

/*
|--------------------------------------------------------------------------
| Constants and helpers
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

const unwrapResponse = (response) => {
  let result = response;

  // Axios response -> Laravel API envelope.
  if (
    result &&
    typeof result === "object" &&
    result.data &&
    typeof result.data === "object" &&
    !Array.isArray(result.data)
  ) {
    result = result.data;
  }

  return result;
};

const isFailedResponse = (response) => {
  if (!response || typeof response !== "object") {
    return false;
  }

  return (
    response.success === false ||
    response.status === false ||
    (typeof response.code === "number" && response.code >= 400)
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
  const result = unwrapResponse(response);

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.plots)) {
    return result.plots;
  }

  if (Array.isArray(result?.data?.plots)) {
    return result.data.plots;
  }

  return [];
};

const extractPagination = (response, fallback = {}) => {
  const result = unwrapResponse(response);

  const meta =
    result?.meta ||
    result?.data?.meta ||
    result?.pagination ||
    result?.data?.pagination ||
    {};

  const links = result?.links || result?.data?.links || {};

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
    fallback.total ??
    0,
  );

  const safePage = Math.max(1, currentPage || 1);
  const safePerPage = Math.max(1, perPage || DEFAULT_PER_PAGE);
  const safeTotal = Math.max(0, total || 0);

  const lastPage = Number(
    meta.last_page ??
    meta.lastPage ??
    Math.max(1, Math.ceil(safeTotal / safePerPage)),
  );

  return {
    currentPage: safePage,
    perPage: safePerPage,
    total: safeTotal,
    lastPage: Math.max(1, lastPage || 1),
    from:
      meta.from ??
      (safeTotal ? (safePage - 1) * safePerPage + 1 : 0),
    to: meta.to ?? Math.min(safePage * safePerPage, safeTotal),
    prevPageUrl: links.prev ?? null,
    nextPageUrl: links.next ?? null,
  };
};

const formatCurrency = (amount) => {
  const value = Number(amount ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
};

const formatNumber = (value) => {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
};

const formatDate = (value) => {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getPlotId = (plot) => plot?.id ?? plot?.plot_id;

const getPlotTitle = (plot) =>
  plot?.title ||
  plot?.name ||
  plot?.plot_name ||
  "Untitled plot";

const getPlotCode = (plot) =>
  plot?.code ||
  plot?.plot_code ||
  `PLT-${getPlotId(plot) ?? "N/A"}`;

const getPlotSize = (plot) => {
  const size = plot?.size ?? plot?.plot_size;

  if (size === null || size === undefined || size === "") {
    return "Not specified";
  }

  const unit =
    plot?.size_unit ||
    plot?.measurement_unit ||
    plot?.unit_of_measure;

  if (typeof size === "string" && /[a-z]/i.test(size)) {
    return size;
  }

  return `${formatNumber(size)}${unit ? ` ${unit}` : ""}`;
};

const getLocation = (plot) => {
  const area =
    plot?.area?.name ||
    plot?.area_name ||
    plot?.area?.title;

  const city =
    plot?.city?.name ||
    plot?.city_name ||
    plot?.city?.title;

  const county =
    plot?.county?.name ||
    plot?.county_name ||
    plot?.county?.title;

  const location = [area, city, county]
    .filter(Boolean)
    .filter(
      (value, index, values) => values.indexOf(value) === index,
    );

  return location.length
    ? location.join(", ")
    : plot?.location || "Location not specified";
};

const getReservedDate = (plot) =>
  plot?.reserved_at ||
  plot?.reservation_date ||
  plot?.updated_at ||
  plot?.created_at ||
  null;

const isActivePlot = (plot) =>
  plot?.is_active === undefined ||
  plot?.is_active === null ||
  plot?.is_active === true ||
  plot?.is_active === 1 ||
  plot?.is_active === "1";

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
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-gray-500">
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
| Reserved plot card
|--------------------------------------------------------------------------
*/

function ReservedPlotCard({ plot, onView, onEdit }) {
  const id = getPlotId(plot);
  const reservedDate = getReservedDate(plot);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {getPlotCode(plot)}
            </p>

            <h3 className="mt-1 break-words text-base font-semibold text-gray-900">
              {getPlotTitle(plot)}
            </h3>
          </div>

          <PlotStatusBadge
            status={plot?.status || RESERVED_STATUS}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Asking price</p>
            <p className="mt-1 break-words text-sm font-bold text-gray-900">
              {formatCurrency(getAskingPrice(plot))}
            </p>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Plot size</p>
            <p className="mt-1 break-words text-sm font-semibold text-gray-900">
              {getPlotSize(plot)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <span className="break-words">{getLocation(plot)}</span>
        </div>

        <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <span>
            Reserved date:{" "}
            <span className="font-medium text-gray-800">
              {formatDate(reservedDate)}
            </span>
          </span>
        </div>

        {plot?.property?.name && (
          <div className="mt-3 text-sm text-gray-600">
            Property:{" "}
            <span className="font-medium text-gray-800">
              {plot.property.name}
            </span>
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 border-t border-gray-100 pt-4 mt-5">
          <button
            type="button"
            onClick={() => onView(id)}
            disabled={!id}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            View
          </button>

          <button
            type="button"
            onClick={() => onEdit(id)}
            disabled={!id}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Edit plot
          </button>
        </div>
      </div>
    </article>
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
  const mountedRef = useRef(true);

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

  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
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

        // Ignore responses from an older request.
        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        if (isFailedResponse(response)) {
          throw new Error(
            response?.message || "Failed to load reserved plots.",
          );
        }

        const records = extractPlots(response);

        const reservedPlots = records.filter(
          (plot) =>
            String(plot?.status || "").toLowerCase() ===
            RESERVED_STATUS && isActivePlot(plot),
        );

        setPlots(reservedPlots);

        const serverPagination = extractPagination(response, {
          currentPage: requestedPage,
          perPage: pagination.perPage,
          total: reservedPlots.length,
        });

        setPagination((previous) => ({
          ...previous,
          ...serverPagination,
          currentPage: requestedPage,
          perPage: previous.perPage,
        }));
      } catch (error) {
        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setPlots([]);
        setPageError(
          getErrorMessage(error, "Unable to load reserved plots."),
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
  | Load statistics independently
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
        // Statistics are optional. Keep the inventory usable.
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

    const nextSearch = searchInput.trim();

    setPagination((previous) => ({
      ...previous,
      currentPage: 1,
    }));

    setSearch(nextSearch);
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

  const handleView = (id) => {
    if (!id) return;

    navigate(`/super-admin/plots/${id}`);
  };

  const handleEdit = (id) => {
    if (!id) return;

    navigate(`/super-admin/plots/${id}/edit`);
  };

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
      averageFromApi ??
      (count > 0
        ? value / count
        : 0);

    return {
      count: Math.max(0, count),
      value: Math.max(0, value),
      averagePrice: Math.max(0, averagePrice),
    };
  }, [statistics, pagination.total, plots]);

  const hasActiveFilters = Object.values(appliedFilters).some(
    (value) => String(value).trim() !== "",
  );

  const displayError = pageError || hookError;
  const isLoading = loadingPlots || Boolean(hookLoading);

  const activeFilterCount = Object.values(appliedFilters).filter(
    (value) => String(value).trim() !== "",
  ).length;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen space-y-6 bg-gray-50/70 p-4 sm:p-6 lg:p-8">
      <PlotHeader
        title="Reserved Plots"
        subtitle="Review and manage plots that have been reserved."
        activeTab="reserved"
      />

      {/* Page heading and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Reserved Plots
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor reserved inventory, reservation values, and plot details.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <form
            onSubmit={handleSearch}
            className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search by plot name, code, or location..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
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
            className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${showFilters || hasActiveFilters
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
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
          <div className="space-y-4 border-b border-gray-100 bg-gray-50/70 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label
                  htmlFor="reserved-county"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="reserved-min-price"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="reserved-max-price"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="reserved-min-size"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="reserved-max-size"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                <Filter className="h-4 w-4" />
                Apply filters
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
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
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
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
            className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Reserved inventory */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Reserved inventory
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {formatNumber(pagination.total)} reserved{" "}
              {pagination.total === 1 ? "plot" : "plots"} found
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="reserved-per-page"
              className="whitespace-nowrap text-sm text-gray-500"
            >
              Show
            </label>

            <select
              id="reserved-per-page"
              value={pagination.perPage}
              onChange={handlePerPageChange}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-8">
            <LoaderCircle className="h-9 w-9 animate-spin text-emerald-600" />

            <p className="mt-3 text-sm font-medium text-gray-700">
              Loading reserved plots...
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Please wait while we retrieve your inventory.
            </p>
          </div>
        ) : plots.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <MapPin className="h-7 w-7 text-amber-600" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-900">
              No reserved plots found
            </h3>

            <p className="mt-2 max-w-md text-sm text-gray-500">
              There are no plots matching your current search or
              filters. Try adjusting your criteria or refreshing
              the list.
            </p>

            {(search || hasActiveFilters) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {plots.map((plot) => (
              <ReservedPlotCard
                key={getPlotId(plot) ?? getPlotCode(plot)}
                plot={plot}
                onView={handleView}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pagination */}
      {!isLoading && plots.length > 0 && (
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-900">
              {pagination.from || 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-gray-900">
              {pagination.to || plots.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-900">
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
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
