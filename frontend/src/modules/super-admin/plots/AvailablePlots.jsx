
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  MapPin,
  RefreshCw,
  RotateCcw,
  Ruler,
  Search,
  X,
} from "lucide-react";

import PlotHeader from "./PlotHeader";
import PlotStatusBadge from "./PlotStatusBadge";
import { usePlot } from "../../../hooks/usePlots";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;

  if (responseData?.errors) {
    const firstError = Object.values(responseData.errors)
      .flat()
      .find((message) => typeof message === "string");

    if (firstError) return firstError;
  }

  return (
    responseData?.message ||
    error?.message ||
    "Unable to load available plots. Please try again."
  );
};

const unwrapResponse = (response) => {
  let result = response?.data ?? response;

  for (let index = 0; index < 4; index += 1) {
    if (
      result &&
      typeof result === "object" &&
      !Array.isArray(result) &&
      result.data !== undefined
    ) {
      result = result.data;
      continue;
    }

    break;
  }

  return result;
};

const extractPlots = (response) => {
  const result = unwrapResponse(response);

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.plots)) return result.plots;

  return [];
};

const isFailedResponse = (response) => {
  if (!response || typeof response !== "object") return false;
  if (response.status === false) return true;

  const code = Number(response.code);

  return Number.isFinite(code) && code >= 400;
};

const formatCurrency = (value, currency = "KES") => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return `${currency} 0.00`;

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
    maximumFractionDigits: 4,
  });
};

const getPlotId = (plot) => plot?.id ?? plot?.plot_id;

const getPlotTitle = (plot) =>
  plot?.title || plot?.name || "Untitled Plot";

const getPlotCode = (plot) =>
  plot?.code || plot?.plot_code || "Code not assigned";

const getPlotSize = (plot) => {
  const size = plot?.size ?? plot?.plot_size;

  if (size === null || size === undefined || size === "") {
    return "Not specified";
  }

  if (typeof size === "string") return size;

  const unit = plot?.size_unit ?? plot?.measurement_unit;

  return `${formatNumber(size)}${unit ? ` ${unit}` : ""}`;
};

const getPlotLocation = (plot) => {
  const parts = [
    plot?.area?.name ?? plot?.area_name,
    plot?.city?.name ?? plot?.city_name,
    plot?.county?.name ?? plot?.county_name,
    plot?.region?.name ?? plot?.region_name,
  ].filter(
    (value, index, array) =>
      typeof value === "string" &&
      value.trim() &&
      array.indexOf(value) === index,
  );

  return parts.length ? parts.join(", ") : "Location not specified";
};

const getActiveState = (value) =>
  !(
    value === false ||
    value === 0 ||
    value === "0" ||
    value === "false"
  );

const getPagination = (response, fallbackPage, fallbackPerPage) => {
  const result = unwrapResponse(response);

  const meta =
    response?.meta ||
    response?.data?.meta ||
    result?.meta ||
    {};

  const currentPage = Number(
    meta.current_page ??
    result?.current_page ??
    response?.current_page ??
    fallbackPage,
  );

  const perPage = Number(
    meta.per_page ??
    result?.per_page ??
    response?.per_page ??
    fallbackPerPage,
  );

  const total = Number(
    meta.total ??
    result?.total ??
    response?.total ??
    (Array.isArray(result) ? result.length : 0),
  );

  const lastPage = Number(
    meta.last_page ??
    result?.last_page ??
    response?.last_page ??
    Math.max(1, Math.ceil(total / Math.max(perPage, 1))),
  );

  return {
    currentPage: Number.isFinite(currentPage) && currentPage > 0
      ? currentPage
      : 1,
    perPage: Number.isFinite(perPage) && perPage > 0
      ? perPage
      : fallbackPerPage,
    total: Number.isFinite(total) && total >= 0 ? total : 0,
    lastPage: Number.isFinite(lastPage) && lastPage > 0
      ? lastPage
      : 1,
  };
};

/*
|--------------------------------------------------------------------------
| AVAILABLE PLOT CARD
|--------------------------------------------------------------------------
*/

const AvailablePlotCard = ({ plot, onView, onEdit }) => {
  const id = getPlotId(plot);
  const title = getPlotTitle(plot);
  const code = getPlotCode(plot);
  const location = getPlotLocation(plot);
  const size = getPlotSize(plot);
  const currency = plot?.currency || "KES";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      {/* Card Header */}

      <div className="border-b border-gray-100 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <MapPin className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="break-words text-base font-semibold text-gray-900 transition group-hover:text-emerald-700">
                {title}
              </h2>

              <p className="mt-1 break-words text-xs font-medium text-gray-500">
                {code}
              </p>
            </div>
          </div>

          <PlotStatusBadge
            status={plot?.status || "available"}
            isActive={plot?.is_active}
          />
        </div>

        <div className="mt-4 flex items-start gap-2 text-sm text-gray-500">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p className="break-words">{location}</p>
        </div>
      </div>

      {/* Price and Size */}

      <div className="flex-1 space-y-4 p-5">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-emerald-800">
            <Banknote className="h-4 w-4" />
            Asking Price
          </p>

          <p className="mt-2 break-words text-xl font-bold text-gray-900">
            {formatCurrency(plot?.asking_price, currency)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Ruler className="h-3.5 w-3.5" />
              Plot Size
            </p>

            <p className="mt-2 break-words text-sm font-semibold text-gray-900">
              {size}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Availability
            </p>

            <p className="mt-2 text-sm font-semibold text-emerald-700">
              Available
            </p>
          </div>
        </div>

        {plot?.description && (
          <p className="line-clamp-3 text-sm leading-6 text-gray-500">
            {plot.description}
          </p>
        )}
      </div>

      {/* Actions */}

      <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50/60 p-4">
        <button
          type="button"
          onClick={() => onView(id)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <Eye className="h-4 w-4" />
          View
        </button>

        <button
          type="button"
          onClick={() => onEdit(id)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Edit Plot
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
};

/*
|--------------------------------------------------------------------------
| AVAILABLE PLOTS
|--------------------------------------------------------------------------
*/

const AvailablePlots = () => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | PLOT HOOK
  |--------------------------------------------------------------------------
  |
  | Expected usePlot methods:
  | - getPlots(params)
  | - getStatistics() (optional)
  | - loading
  | - error
  | - clearError() (optional)
  |
  */

  const {
    loading: hookLoading = false,
    error: hookError,
    getPlots,
    getStatistics,
    clearError,
  } = usePlot();

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [plots, setPlots] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minSize, setMinSize] = useState("");
  const [maxSize, setMaxSize] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 12,
    total: 0,
    lastPage: 1,
  });

  /*
  |--------------------------------------------------------------------------
  | FILTER OPTIONS
  |--------------------------------------------------------------------------
  */

  const countyOptions = useMemo(() => {
    const names = plots
      .map(
        (plot) =>
          plot?.county?.name ??
          plot?.county_name ??
          "",
      )
      .filter((name) => typeof name === "string" && name.trim());

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [plots]);

  const activeFilterCount = [
    countyFilter,
    minPrice,
    maxPrice,
    minSize,
    maxSize,
  ].filter((value) => value !== "").length;

  /*
  |--------------------------------------------------------------------------
  | LOAD PLOTS
  |--------------------------------------------------------------------------
  */

  const loadPlots = useCallback(
    async ({ showRefresh = false, page = currentPage } = {}) => {
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
        clearError?.();

        const params = {
          page,
          per_page: perPage,
          search: search || undefined,
          status: "available",
          county: countyFilter || undefined,
          county_name: countyFilter || undefined,
          min_price: minPrice !== "" ? minPrice : undefined,
          max_price: maxPrice !== "" ? maxPrice : undefined,
          min_size: minSize !== "" ? minSize : undefined,
          max_size: maxSize !== "" ? maxSize : undefined,
        };

        Object.keys(params).forEach((key) => {
          if (params[key] === undefined || params[key] === "") {
            delete params[key];
          }
        });

        const response = await getPlots(params);

        if (isFailedResponse(response)) {
          throw new Error(
            response.message || "Unable to load available plots.",
          );
        }

        const result = unwrapResponse(response);
        const records = extractPlots(response);

        // Some hooks return the normalized records directly.
        const resolvedRecords = Array.isArray(result)
          ? result
          : records;

        setPlots(
          resolvedRecords.filter((plot) => {
            const status = String(plot?.status || "available")
              .toLowerCase()
              .trim();

            return (
              status === "available" &&
              getActiveState(plot?.is_active)
            );
          }),
        );

        setPagination(getPagination(response, page, perPage));

        if (typeof getStatistics === "function") {
          try {
            const statsResponse = await getStatistics();

            if (!isFailedResponse(statsResponse)) {
              setStatistics(unwrapResponse(statsResponse));
            }
          } catch {
            // Statistics are optional; the plot list can still be shown.
          }
        }
      } catch (loadError) {
        setPageError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      getPlots,
      getStatistics,
      clearError,
      currentPage,
      perPage,
      search,
      countyFilter,
      minPrice,
      maxPrice,
      minSize,
      maxSize,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD AND FILTER CHANGES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadPlots({ page: currentPage });
  }, [loadPlots, currentPage]);

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setCurrentPage(1);
    setSearch(searchInput.trim());
  };

  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setCountyFilter("");
    setMinPrice("");
    setMaxPrice("");
    setMinSize("");
    setMaxSize("");
    setCurrentPage(1);
    setPageError("");
  };

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = () => {
    loadPlots({ showRefresh: true, page: currentPage });
  };

  /*
  |--------------------------------------------------------------------------
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const handleView = (plotId) => {
    if (plotId === undefined || plotId === null) return;

    navigate(`/super-admin/plots/${plotId}`);
  };

  const handleEdit = (plotId) => {
    if (plotId === undefined || plotId === null) return;

    navigate(`/super-admin/plots/${plotId}/edit`);
  };

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const totalAvailable =
    statistics?.available ??
    statistics?.available_plots ??
    statistics?.inventory?.available ??
    pagination.total;

  const totalInventoryValue =
    statistics?.available_value ??
    statistics?.inventory_value ??
    statistics?.inventory?.available_value;

  const averagePrice =
    statistics?.average_plot_value ??
    statistics?.average_price ??
    statistics?.inventory?.average_price;

  const hasStatistics = statistics !== null;

  /*
  |--------------------------------------------------------------------------
  | ERROR DISPLAY
  |--------------------------------------------------------------------------
  */

  const displayedError =
    pageError ||
    (typeof hookError === "string"
      ? hookError
      : hookError?.message);

  const isBusy = loading || hookLoading;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-gray-50/70">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}

        <PlotHeader
          title="Available Plots"
          description="Browse available land plots, compare prices and manage plot records."
          loading={isBusy || refreshing}
          onRefresh={handleRefresh}
          showRefresh
        />

        {/* Error */}

        {displayedError && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Unable to Load Available Plots
              </p>

              <p className="mt-1 break-words">
                {displayedError}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPageError("")}
              className="rounded-lg p-1 transition hover:bg-red-100"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Summary Cards */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Available Plots
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {isBusy && !plots.length
                    ? "—"
                    : formatNumber(totalAvailable)}
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  Ready for sale
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Inventory Value
                </p>

                <p className="mt-2 break-words text-xl font-bold text-gray-900">
                  {totalInventoryValue !== undefined
                    ? formatCurrency(totalInventoryValue)
                    : "—"}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Available plot value
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Banknote className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Average Asking Price
                </p>

                <p className="mt-2 break-words text-xl font-bold text-gray-900">
                  {averagePrice !== undefined
                    ? formatCurrency(averagePrice)
                    : "—"}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Per plot
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Banknote className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Current Results
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatNumber(pagination.total)}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Matching available plots
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <MapPin className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Find Available Plots
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Search by plot name, code or location.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen((previous) => !previous)}
                className={`inline-flex items-center justify-center gap-2 self-start rounded-lg border px-3.5 py-2.5 text-sm font-medium transition ${filtersOpen || activeFilterCount > 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <Filter className="h-4 w-4" />
                Filters

                {activeFilterCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-xs font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(event.target.value)
                  }
                  placeholder="Search plot title, code, county or area..."
                  className="min-h-11 w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                Search
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </form>

            {filtersOpen && (
              <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2 xl:grid-cols-5">
                <div>
                  <label
                    htmlFor="available-county"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    County
                  </label>

                  <select
                    id="available-county"
                    value={countyFilter}
                    onChange={(event) => {
                      setCountyFilter(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="min-h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">All counties</option>

                    {countyOptions.map((county) => (
                      <option key={county} value={county}>
                        {county}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="available-min-price"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Minimum Price (KES)
                  </label>

                  <input
                    id="available-min-price"
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(event) => {
                      setMinPrice(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="0"
                    className="min-h-10 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="available-max-price"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Maximum Price (KES)
                  </label>

                  <input
                    id="available-max-price"
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(event) => {
                      setMaxPrice(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Any"
                    className="min-h-10 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="available-min-size"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Minimum Size
                  </label>

                  <input
                    id="available-min-size"
                    type="number"
                    min="0"
                    step="any"
                    value={minSize}
                    onChange={(event) => {
                      setMinSize(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Any"
                    className="min-h-10 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="available-max-size"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Maximum Size
                  </label>

                  <input
                    id="available-max-size"
                    type="number"
                    min="0"
                    step="any"
                    value={maxSize}
                    onChange={(event) => {
                      setMaxSize(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Any"
                    className="min-h-10 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {minPrice !== "" &&
                  maxPrice !== "" &&
                  Number(minPrice) > Number(maxPrice) && (
                    <p className="text-sm text-red-600 sm:col-span-2 xl:col-span-5">
                      Minimum price cannot exceed maximum price.
                    </p>
                  )}

                {minSize !== "" &&
                  maxSize !== "" &&
                  Number(minSize) > Number(maxSize) && (
                    <p className="text-sm text-red-600 sm:col-span-2 xl:col-span-5">
                      Minimum size cannot exceed maximum size.
                    </p>
                  )}

                <div className="sm:col-span-2 xl:col-span-5">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage(1);
                      loadPlots({ page: 1 });
                    }}
                    disabled={isBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Filter className="h-4 w-4" />
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Results Header */}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Available Inventory
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {loading
                ? "Loading plot inventory..."
                : `${pagination.total.toLocaleString("en-KE")} plot(s) found`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="available-per-page"
              className="text-sm text-gray-500"
            >
              Show
            </label>

            <select
              id="available-per-page"
              value={perPage}
              onChange={(event) => {
                setPerPage(Number(event.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isBusy || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""
                  }`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}

        {loading && plots.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 shadow-sm">
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />

              <p className="mt-4 text-sm font-semibold text-gray-900">
                Loading available plots
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Please wait while we retrieve the inventory.
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}

        {!loading && plots.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm sm:px-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MapPin className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No Available Plots Found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              There are no available plots matching your current search
              and filters. Try changing your search criteria or reset
              the filters.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Filters
              </button>

              <button
                type="button"
                onClick={() => navigate("/super-admin/plots/create")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Register a Plot
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Plot Grid */}

        {plots.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {plots.map((plot, index) => {
                const plotId = getPlotId(plot);

                return (
                  <AvailablePlotCard
                    key={plotId ?? `${getPlotCode(plot)}-${index}`}
                    plot={plot}
                    onView={handleView}
                    onEdit={handleEdit}
                  />
                );
              })}
            </div>

            {/* Pagination */}

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {pagination.total === 0
                    ? 0
                    : (pagination.currentPage - 1) * pagination.perPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(
                    pagination.currentPage * pagination.perPage,
                    pagination.total,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900">
                  {pagination.total}
                </span>{" "}
                plots
              </p>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={pagination.currentPage <= 1 || isBusy}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <span className="whitespace-nowrap px-2 text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.lastPage}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(pagination.lastPage, page + 1),
                    )
                  }
                  disabled={
                    pagination.currentPage >= pagination.lastPage ||
                    isBusy
                  }
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Refresh Overlay */}

        {refreshing && (
          <div className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            Refreshing available plots...
          </div>
        )}

        {/* Statistics Loading Note */}

        {!hasStatistics && !loading && plots.length > 0 && (
          <p className="mt-4 text-xs text-gray-400">
            Inventory summary figures will appear when the statistics
            endpoint returns the required values.
          </p>
        )}
      </div>
    </div>
  );
};

export default AvailablePlots;
