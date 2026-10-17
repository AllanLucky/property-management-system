import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Wallet,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

import PlotSaleHeader from "./PlotSaleHeader";
import { usePlotSales } from "../../../hooks/usePlotSales";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "reserved", label: "Reserved" },
  { value: "approved", label: "Approved" },
];

const formatCurrency = (amount, currency = "KES") => {
  const value = Number(amount ?? 0);

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency || "KES",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  } catch {
    return `KES ${Number.isFinite(value) ? value.toLocaleString("en-KE") : "0.00"}`;
  }
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE").format(Number(value ?? 0));

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getEffectivePrice = (sale) => {
  const salePrice = Number(sale?.sale_price ?? 0);
  const discount = Number(
    sale?.discount_amount ?? sale?.discount ?? 0
  );

  return Math.max(0, salePrice - discount);
};

const getAmountPaid = (sale) =>
  Math.max(0, Number(sale?.amount_paid ?? 0));

const getOutstandingBalance = (sale) => {
  const balance = Number(sale?.balance);

  if (
    sale?.balance !== null &&
    sale?.balance !== undefined &&
    sale?.balance !== "" &&
    Number.isFinite(balance)
  ) {
    return Math.max(0, balance);
  }

  return Math.max(0, getEffectivePrice(sale) - getAmountPaid(sale));
};

const getStatusClasses = (status) => {
  const styles = {
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    reserved: "bg-blue-50 text-blue-700 ring-blue-600/20",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    completed: "bg-green-50 text-green-700 ring-green-600/20",
    cancelled: "bg-red-50 text-red-700 ring-red-600/20",
  };

  return (
    styles[String(status ?? "").toLowerCase()] ??
    "bg-gray-100 text-gray-700 ring-gray-500/20"
  );
};

const getSaleNumber = (sale) =>
  sale?.sale_number ?? sale?.saleNumber ?? `Sale #${sale?.id ?? "—"}`;

const getPlotTitle = (sale) =>
  sale?.plot?.title ??
  sale?.plot?.name ??
  sale?.plot_title ??
  sale?.plot_name ??
  "Plot details unavailable";

const getPlotCode = (sale) =>
  sale?.plot?.code ??
  sale?.plot_code ??
  sale?.plot?.plot_number ??
  "—";

const getBuyerName = (sale) => {
  const buyer = sale?.buyer;

  if (!buyer) {
    return (
      sale?.buyer_name ??
      sale?.buyer_full_name ??
      "Buyer unavailable"
    );
  }

  const fullName = [
    buyer.first_name,
    buyer.middle_name,
    buyer.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    buyer.name ??
    buyer.full_name ??
    buyer.fullName ??
    fullName ??
    buyer.email ??
    sale?.buyer_name ??
    "Buyer unavailable"
  );
};

const unwrapResponse = (response) => {
  let result = response?.data ?? response;

  // Support Axios response -> API envelope -> resource payload.
  if (result?.data !== undefined) {
    result = result.data;
  }

  return result;
};

const getPaginationMeta = (response) => {
  const root = response?.data ?? response;
  const payload = root?.data ?? root;

  return (
    root?.meta ??
    payload?.meta ??
    root?.pagination ??
    payload?.pagination ??
    {}
  );
};

const getSaleArray = (response) => {
  const root = response?.data ?? response;
  const payload = root?.data ?? root;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.sales)) return payload.sales;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(root?.sales)) return root.sales;

  return [];
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ??
  error?.response?.data?.errors?.message?.[0] ??
  error?.message ??
  "Unable to load outstanding plot sales. Please try again.";

/*
|--------------------------------------------------------------------------
| Stat Card
|--------------------------------------------------------------------------
*/

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass = "bg-blue-50 text-blue-600",
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 break-words text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {value}
          </p>
          {description && (
            <p className="mt-2 text-xs text-gray-500">{description}</p>
          )}
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

function StatusBadge({ status }) {
  const label = String(status ?? "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(
        status
      )}`}
    >
      {label}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Outstanding Plot Sales Page
|--------------------------------------------------------------------------
*/

export default function OutstandingPlotSales() {
  const navigate = useNavigate();

  const plotSalesHook = usePlotSales() ?? {};

  const {
    loading: hookLoading = false,
    error: hookError = null,
    outstandingPlotSales,
    outstandingSales,
    plotSales,
    sales,
    fetchOutstandingPlotSales,
    fetchOutstandingSales,
    fetchOutstanding,
    fetchPlotSales,
    fetchSales,
    getOutstandingPlotSales,
  } = plotSalesHook;

  const [records, setRecords] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("balance_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const loadOutstandingSales = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const loader =
          fetchOutstandingPlotSales ??
          fetchOutstandingSales ??
          fetchOutstanding ??
          getOutstandingPlotSales ??
          fetchPlotSales ??
          fetchSales;

        if (typeof loader !== "function") {
          // Use existing hook state if it already contains the records.
          const existing =
            outstandingPlotSales ??
            outstandingSales ??
            plotSales ??
            sales;

          if (Array.isArray(existing)) {
            setRecords(existing);
            setPaginationMeta({});
            setError("");
            return;
          }

          throw new Error(
            "No outstanding-sales loader was found in usePlotSales. Add fetchOutstandingPlotSales() to the hook or connect the existing outstanding-sales API method."
          );
        }

        // Dedicated outstanding endpoint is preferred. Generic loaders are
        // retained as a compatibility fallback for existing hook versions.
        const response = await loader({
          page: currentPage,
          per_page: PAGE_SIZE,
          perPage: PAGE_SIZE,
          status: statusFilter || undefined,
          search: search.trim() || undefined,
          sort_by: sortBy,
        });

        const data = getSaleArray(response);
        const meta = getPaginationMeta(response);

        setRecords(data);
        setPaginationMeta(meta);
      } catch (requestError) {
        const message = getErrorMessage(requestError);

        setError(message);

        if (!silent) {
          console.error("Outstanding plot sales error:", requestError);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      fetchOutstandingPlotSales,
      fetchOutstandingSales,
      fetchOutstanding,
      getOutstandingPlotSales,
      fetchPlotSales,
      fetchSales,
      outstandingPlotSales,
      outstandingSales,
      plotSales,
      sales,
      currentPage,
      statusFilter,
      search,
      sortBy,
    ]
  );

  useEffect(() => {
    loadOutstandingSales();
  }, [loadOutstandingSales]);

  const outstandingRecords = useMemo(
    () =>
      records
        .map((sale) => ({
          ...sale,
          _outstandingBalance: getOutstandingBalance(sale),
          _effectivePrice: getEffectivePrice(sale),
          _amountPaid: getAmountPaid(sale),
        }))
        .filter((sale) => {
          const status = String(sale.status ?? "").toLowerCase();

          return (
            sale._outstandingBalance > 0 &&
            !["cancelled", "completed"].includes(status)
          );
        }),
    [records]
  );

  const summary = useMemo(() => {
    const totalOutstanding = outstandingRecords.reduce(
      (total, sale) => total + sale._outstandingBalance,
      0
    );

    const totalPaid = outstandingRecords.reduce(
      (total, sale) => total + sale._amountPaid,
      0
    );

    const totalSaleValue = outstandingRecords.reduce(
      (total, sale) => total + sale._effectivePrice,
      0
    );

    return {
      count: outstandingRecords.length,
      totalOutstanding,
      totalPaid,
      totalSaleValue,
    };
  }, [outstandingRecords]);

  const visibleRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    let result = [...outstandingRecords];

    if (normalizedSearch) {
      result = result.filter((sale) => {
        const searchableValues = [
          getSaleNumber(sale),
          sale.agreement_number,
          getPlotTitle(sale),
          getPlotCode(sale),
          getBuyerName(sale),
          sale.agent?.name,
          sale.agent?.full_name,
          sale.agent_name,
          sale.status,
        ];

        return searchableValues.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(normalizedSearch)
        );
      });
    }

    if (statusFilter) {
      result = result.filter(
        (sale) =>
          String(sale.status ?? "").toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    switch (sortBy) {
      case "balance_asc":
        result.sort(
          (a, b) => a._outstandingBalance - b._outstandingBalance
        );
        break;

      case "date_desc":
        result.sort(
          (a, b) =>
            new Date(b.sale_date ?? 0).getTime() -
            new Date(a.sale_date ?? 0).getTime()
        );
        break;

      case "date_asc":
        result.sort(
          (a, b) =>
            new Date(a.sale_date ?? 0).getTime() -
            new Date(b.sale_date ?? 0).getTime()
        );
        break;

      default:
        result.sort(
          (a, b) => b._outstandingBalance - a._outstandingBalance
        );
    }

    return result;
  }, [outstandingRecords, search, statusFilter, sortBy]);

  const serverTotal = Number(
    paginationMeta?.total ??
    paginationMeta?.total_records ??
    paginationMeta?.totalRecords ??
    0
  );

  const serverLastPage = Number(
    paginationMeta?.last_page ??
    paginationMeta?.lastPage ??
    paginationMeta?.total_pages ??
    0
  );

  const totalPages = serverLastPage
    ? Math.max(1, serverLastPage)
    : Math.max(1, Math.ceil(visibleRecords.length / PAGE_SIZE));

  const pageRecords = useMemo(() => {
    // Laravel paginator responses contain the current page's data already.
    const hasServerPagination =
      serverLastPage > 0 ||
      paginationMeta?.current_page !== undefined ||
      paginationMeta?.currentPage !== undefined;

    if (hasServerPagination) return visibleRecords;

    const start = (currentPage - 1) * PAGE_SIZE;

    return visibleRecords.slice(start, start + PAGE_SIZE);
  }, [visibleRecords, currentPage, paginationMeta, serverLastPage]);

  const startRecord =
    visibleRecords.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const endRecord = Math.min(
    currentPage * PAGE_SIZE,
    serverTotal || visibleRecords.length
  );

  const handleRefresh = useCallback(() => {
    loadOutstandingSales({ silent: true });
  }, [loadOutstandingSales]);

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSortBy("balance_desc");
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleViewSale = (sale) => {
    if (!sale?.id) {
      Swal.fire({
        icon: "error",
        title: "Unable to open sale",
        text: "This sale record does not have a valid ID.",
      });
      return;
    }

    navigate(`/super-admin/plots/sales/${sale.id}`);
  };

  const handleRecordPayment = (sale) => {
    if (!sale?.id) return;

    // Update this route if your payment-entry page uses another URL.
    navigate(
      `/super-admin/plots/payments/create?plot_sale_id=${sale.id}`
    );
  };

  const hasFilters = Boolean(search.trim() || statusFilter);

  return (
    <div className="min-h-screen bg-gray-50/70 pb-10">
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <PlotSaleHeader
          title="Outstanding Plot Sales"
          description="Monitor unpaid plot sale balances and follow up on pending payments."
          loading={loading}
          onRefresh={handleRefresh}
          showRefresh
          showCreate={false}
          showReports={false}
        />

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-start"
          >
            <AlertCircle
              className="mt-0.5 shrink-0 text-red-600"
              size={20}
            />

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-red-800">
                Unable to load outstanding sales
              </p>
              <p className="mt-1 break-words text-sm text-red-700">
                {error}
              </p>
              <button
                type="button"
                onClick={() => loadOutstandingSales()}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Outstanding Sales"
            value={formatNumber(summary.count)}
            description="Sales with unpaid balances"
            icon={FileText}
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Total Outstanding"
            value={formatCurrency(summary.totalOutstanding)}
            description="Amount still due"
            icon={Wallet}
            iconClass="bg-red-50 text-red-600"
          />

          <StatCard
            title="Amount Collected"
            value={formatCurrency(summary.totalPaid)}
            description="Payments received for listed sales"
            icon={ArrowDownRight}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Net Sale Value"
            value={formatCurrency(summary.totalSaleValue)}
            description="Sale price less discounts"
            icon={CircleDollarSign}
            iconClass="bg-violet-50 text-violet-600"
          />
        </div>

        {/* Main table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="border-b border-gray-200 p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Outstanding Transactions
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Review balances, buyers, sale status and payment progress.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 sm:w-72">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      handleSearchChange(event.target.value)
                    }
                    placeholder="Search sale, plot or buyer..."
                    aria-label="Search outstanding plot sales"
                    className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange("")}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowFilters((value) => !value)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${showFilters || hasFilters
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <SlidersHorizontal size={17} />
                  Filters
                  {hasFilters && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                      {(search.trim() ? 1 : 0) + (statusFilter ? 1 : 0)}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label
                    htmlFor="outstanding-status"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Sale status
                  </label>
                  <select
                    id="outstanding-status"
                    value={statusFilter}
                    onChange={(event) =>
                      handleStatusChange(event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="outstanding-sort"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Sort by
                  </label>
                  <select
                    id="outstanding-sort"
                    value={sortBy}
                    onChange={(event) =>
                      handleSortChange(event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="balance_desc">
                      Highest balance first
                    </option>
                    <option value="balance_asc">
                      Lowest balance first
                    </option>
                    <option value="date_desc">Newest sale first</option>
                    <option value="date_asc">Oldest sale first</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    disabled={!hasFilters && sortBy === "balance_desc"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={16} />
                    Clear filters
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing{" "}
                <span className="font-semibold text-gray-800">
                  {formatNumber(pageRecords.length)}
                </span>{" "}
                outstanding sale{pageRecords.length === 1 ? "" : "s"}
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1 self-start font-medium text-blue-600 hover:text-blue-800 sm:self-auto"
                >
                  <X size={14} />
                  Clear active filters
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-4 py-12">
              <Loader2 className="animate-spin text-blue-600" size={34} />
              <p className="text-sm font-medium text-gray-600">
                Loading outstanding plot sales...
              </p>
            </div>
          ) : pageRecords.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
              <div className="mb-4 rounded-2xl bg-gray-100 p-4">
                {error ? (
                  <AlertCircle size={30} className="text-red-500" />
                ) : (
                  <Banknote size={30} className="text-gray-400" />
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                {error
                  ? "Outstanding sales unavailable"
                  : hasFilters
                    ? "No matching outstanding sales"
                    : "No outstanding plot sales"}
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                {error
                  ? "Check your connection and try loading the records again."
                  : hasFilters
                    ? "Try changing your search terms or clearing the selected filters."
                    : "There are no unpaid plot sale balances in the records returned by the API."}
              </p>

              {error ? (
                <button
                  type="button"
                  onClick={() => loadOutstandingSales()}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <RefreshCw size={16} />
                  Try again
                </button>
              ) : hasFilters ? (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <X size={16} />
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[1050px] w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        Sale / Plot
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        Buyer
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        Sale Date
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        Sale Value
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        Amount Paid
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        Outstanding
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {pageRecords.map((sale) => {
                      const currency = sale.currency || "KES";
                      const saleValue = sale._effectivePrice;
                      const amountPaid = sale._amountPaid;
                      const balance = sale._outstandingBalance;
                      const paymentProgress =
                        saleValue > 0
                          ? Math.min(
                            100,
                            Math.max(0, (amountPaid / saleValue) * 100)
                          )
                          : 0;

                      return (
                        <tr
                          key={sale.id ?? getSaleNumber(sale)}
                          className="transition hover:bg-gray-50/80"
                        >
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => handleViewSale(sale)}
                              className="text-left"
                            >
                              <span className="block font-semibold text-gray-900 transition hover:text-blue-700">
                                {getSaleNumber(sale)}
                              </span>
                              <span className="mt-1 block text-sm text-gray-600">
                                {getPlotTitle(sale)}
                              </span>
                              <span className="mt-1 block text-xs text-gray-400">
                                Plot: {getPlotCode(sale)}
                              </span>
                            </button>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-800">
                              {getBuyerName(sale)}
                            </p>
                            {sale.buyer?.email && (
                              <p className="mt-1 max-w-52 truncate text-xs text-gray-500">
                                {sale.buyer.email}
                              </p>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <CalendarDays
                                size={15}
                                className="shrink-0 text-gray-400"
                              />
                              {formatDate(sale.sale_date)}
                            </div>
                            {sale.due_date && (
                              <p className="mt-1 text-xs text-gray-500">
                                Due: {formatDate(sale.due_date)}
                              </p>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <span className="font-medium text-gray-800">
                              {formatCurrency(saleValue, currency)}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <span className="font-medium text-emerald-700">
                              {formatCurrency(amountPaid, currency)}
                            </span>
                            <div className="mt-2 ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${paymentProgress}%` }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-400">
                              {paymentProgress.toFixed(0)}% paid
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <span className="font-bold text-red-600">
                              {formatCurrency(balance, currency)}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <StatusBadge status={sale.status} />
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleViewSale(sale)}
                                title="View sale details"
                                aria-label={`View ${getSaleNumber(sale)}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                              >
                                <Eye size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRecordPayment(sale)}
                                title="Record payment"
                                aria-label={`Record payment for ${getSaleNumber(sale)}`}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                              >
                                <Wallet size={15} />
                                Payment
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-4 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-sm text-gray-500">
                  Page{" "}
                  <span className="font-semibold text-gray-800">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-800">
                    {totalPages}
                  </span>
                  {serverTotal > 0 && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="font-semibold text-gray-800">
                        {formatNumber(serverTotal)}
                      </span>{" "}
                      records
                    </>
                  )}
                  {!serverLastPage && visibleRecords.length > 0 && (
                    <>
                      {" "}
                      · Showing {formatNumber(startRecord)}–
                      {formatNumber(endRecord)}
                    </>
                  )}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1 || loading}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages || loading}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer note */}
        {!loading && !error && outstandingRecords.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <ArrowUpRight
              size={19}
              className="mt-0.5 shrink-0 text-amber-700"
            />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Payment follow-up
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Confirm payment records against the relevant plot sale before
                marking any balance as settled. Outstanding amounts shown here
                are calculated from the sale balance when available, otherwise
                from the net sale value less the recorded amount paid.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
