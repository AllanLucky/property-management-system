
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
  ArrowDownRight,
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
| Configuration
|--------------------------------------------------------------------------
*/

const PAGE_SIZE = 10;
const API_PAGE_SIZE = 100;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "reserved", label: "Reserved" },
  { value: "approved", label: "Approved" },
];

/*
|--------------------------------------------------------------------------
| Value Helpers
|--------------------------------------------------------------------------
*/

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(String(value).replace(/[,\s]/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (amount, currency = "KES") => {
  const value = toNumber(amount);

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency || "KES",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `KES ${value.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE").format(toNumber(value));

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

const normalizeStatus = (status) =>
  String(status ?? "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_");

/*
|--------------------------------------------------------------------------
| Financial Helpers
|--------------------------------------------------------------------------
*/

const getEffectivePrice = (sale) => {
  const netSalePrice = sale?.net_sale_price ?? sale?.netSalePrice;

  if (netSalePrice !== null && netSalePrice !== undefined) {
    return Math.max(0, toNumber(netSalePrice));
  }

  const salePrice = toNumber(
    sale?.sale_price ??
    sale?.salePrice ??
    sale?.price ??
    sale?.amount
  );

  const discount = toNumber(
    sale?.discount_amount ??
    sale?.discount ??
    sale?.discountAmount
  );

  return Math.max(0, salePrice - discount);
};

const getAmountPaid = (sale) =>
  Math.max(
    0,
    toNumber(
      sale?.amount_paid ??
      sale?.total_paid ??
      sale?.amountPaid ??
      sale?.paid_amount
    )
  );

const getOutstandingBalance = (sale) => {
  const balance =
    sale?.balance ??
    sale?.outstanding_balance ??
    sale?.outstanding ??
    sale?.amount_outstanding;

  if (balance !== null && balance !== undefined && balance !== "") {
    return Math.max(0, toNumber(balance));
  }

  return Math.max(0, getEffectivePrice(sale) - getAmountPaid(sale));
};

/*
|--------------------------------------------------------------------------
| Sale Display Helpers
|--------------------------------------------------------------------------
*/

const getSaleNumber = (sale) =>
  sale?.sale_number ??
  sale?.saleNumber ??
  sale?.reference_number ??
  `Sale #${sale?.id ?? "—"}`;

const getPlotTitle = (sale) =>
  sale?.plot?.title ??
  sale?.plot?.name ??
  sale?.plot_title ??
  sale?.plot_name ??
  sale?.plot?.plot_number ??
  "Plot details unavailable";

const getPlotCode = (sale) =>
  sale?.plot?.code ??
  sale?.plot_code ??
  sale?.plot?.plot_number ??
  "—";

const getBuyerName = (sale) => {
  const buyer = sale?.buyer ?? sale?.customer;

  if (typeof buyer === "string") {
    return buyer;
  }

  const fullName = [
    buyer?.first_name,
    buyer?.middle_name,
    buyer?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    buyer?.name ??
    buyer?.full_name ??
    buyer?.fullName ??
    fullName ??
    buyer?.email ??
    sale?.buyer_name ??
    sale?.buyer_full_name ??
    "Buyer unavailable"
  );
};

const getSaleDate = (sale) =>
  sale?.sale_date ??
  sale?.saleDate ??
  sale?.agreement_date ??
  sale?.created_at ??
  sale?.createdAt ??
  null;

const getStatusClasses = (status) => {
  const styles = {
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    reserved: "bg-blue-50 text-blue-700 ring-blue-600/20",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    completed: "bg-green-50 text-green-700 ring-green-600/20",
    cancelled: "bg-red-50 text-red-700 ring-red-600/20",
  };

  return (
    styles[normalizeStatus(status)] ??
    "bg-gray-100 text-gray-700 ring-gray-500/20"
  );
};

/*
|--------------------------------------------------------------------------
| API Response Normalization
|--------------------------------------------------------------------------
*/

const isObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const isSaleRecord = (item) =>
  isObject(item) &&
  (
    item.id !== undefined ||
    item.sale_number !== undefined ||
    item.saleNumber !== undefined ||
    item.sale_price !== undefined ||
    item.plot_id !== undefined ||
    item.buyer_id !== undefined ||
    item.agreement_number !== undefined
  );

const getResponseRoots = (response) => {
  const roots = [];
  const queue = [response];
  const seen = new Set();

  while (queue.length > 0 && roots.length < 60) {
    const current = queue.shift();

    if (
      current === null ||
      current === undefined ||
      typeof current !== "object" ||
      seen.has(current)
    ) {
      continue;
    }

    seen.add(current);
    roots.push(current);

    if (Array.isArray(current)) {
      continue;
    }

    [
      "data",
      "payload",
      "result",
      "response",
      "sales",
      "items",
      "results",
    ].forEach((key) => {
      const child = current[key];

      if (child && typeof child === "object") {
        queue.push(child);
      }
    });
  }

  return roots;
};

const getSaleArray = (response) => {
  if (Array.isArray(response)) {
    return response.filter(isSaleRecord);
  }

  const roots = getResponseRoots(response);

  // Prefer explicitly named collections.
  for (const root of roots) {
    for (const key of ["sales", "items", "results"]) {
      if (Array.isArray(root[key])) {
        return root[key].filter(isSaleRecord);
      }
    }
  }

  // Find an array containing sale records.
  for (const root of roots) {
    if (Array.isArray(root) && root.every(isSaleRecord)) {
      return root;
    }

    if (
      Array.isArray(root.data) &&
      root.data.every(isSaleRecord)
    ) {
      return root.data;
    }
  }

  return [];
};

const getPaginationMeta = (response) => {
  const roots = getResponseRoots(response);

  for (const root of roots) {
    if (isObject(root.meta)) {
      return root.meta;
    }

    if (isObject(root.pagination)) {
      return root.pagination;
    }

    if (
      root.current_page !== undefined ||
      root.last_page !== undefined ||
      root.total !== undefined
    ) {
      return root;
    }
  }

  return {};
};

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;
  const errors = responseData?.errors;

  if (typeof errors === "string") {
    return errors;
  }

  if (Array.isArray(errors)) {
    return errors.join(", ");
  }

  if (isObject(errors)) {
    const firstError = Object.values(errors)
      .flat()
      .find((value) => typeof value === "string");

    if (firstError) return firstError;
  }

  return (
    responseData?.message ??
    error?.payload?.message ??
    error?.message ??
    "Unable to load outstanding plot sales. Please try again."
  );
};

/*
|--------------------------------------------------------------------------
| Statistic Card
|--------------------------------------------------------------------------
*/

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass = "bg-blue-50 text-blue-600",
  wide = false,
}) {
  return (
    <div
      className={[
        "flex min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm",
        "transition duration-200 hover:border-gray-300 hover:shadow-md",
        "min-h-[148px]",
        wide ? "items-center" : "items-start",
      ].join(" ")}
    >
      <div
        className={[
          "flex w-full gap-4",
          wide
            ? "flex-col justify-between sm:flex-row sm:items-center"
            : "items-start justify-between",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-3 break-words text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {value}
          </p>

          {description && (
            <p className="mt-2 text-xs leading-5 text-gray-500">
              {description}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={[
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              iconClass,
            ].join(" ")}
          >
            <Icon size={21} />
          </div>
        )}
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
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(status)}`}
    >
      {label}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Outstanding Plot Sales
|--------------------------------------------------------------------------
*/

export default function OutstandingPlotSales() {
  const navigate = useNavigate();

  // Prevent unrelated list/statistics requests from this page.
  const plotSalesHook = usePlotSales({ autoFetch: false }) ?? {};

  const {
    outstandingLoading: hookOutstandingLoading = false,
    outstandingError: hookOutstandingError = null,
    outstandingSales = [],
    fetchOutstandingPlotSales,
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

  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  // Keep the latest hook data without making the loader depend on it.
  const outstandingSalesRef = useRef(outstandingSales);

  useEffect(() => {
    outstandingSalesRef.current = outstandingSales;
  }, [outstandingSales]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Load Outstanding Records
  |--------------------------------------------------------------------------
  */

  const loadOutstandingSales = useCallback(
    async ({ silent = false } = {}) => {
      if (typeof fetchOutstandingPlotSales !== "function") {
        if (mountedRef.current) {
          setError(
            "The outstanding-sales loader is unavailable. Check that usePlotSales exports fetchOutstandingPlotSales."
          );
          setLoading(false);
          setRefreshing(false);
        }

        return;
      }

      const requestId = ++requestIdRef.current;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await fetchOutstandingPlotSales({
          page: 1,
          per_page: API_PAGE_SIZE,
        });

        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        if (response?.status === false || response?.error) {
          throw new Error(
            response?.message ??
            response?.payload?.message ??
            "The outstanding-sales request failed."
          );
        }

        let rows = getSaleArray(response);
        const meta = getPaginationMeta(response);

        // Use hook state only if the direct response has no sale records.
        if (rows.length === 0) {
          const fallbackRows = getSaleArray(
            outstandingSalesRef.current
          );

          if (fallbackRows.length > 0) {
            rows = fallbackRows;
          }
        }

        setRecords(rows);
        setPaginationMeta(meta);
        setCurrentPage(1);
      } catch (requestError) {
        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setError(getErrorMessage(requestError));
        setRecords([]);

        console.error(
          "Outstanding plot sales error:",
          requestError
        );
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
    [fetchOutstandingPlotSales]
  );

  useEffect(() => {
    loadOutstandingSales();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadOutstandingSales]);

  /*
  |--------------------------------------------------------------------------
  | Normalize Outstanding Records
  |--------------------------------------------------------------------------
  */

  const outstandingRecords = useMemo(() => {
    return records
      .map((sale) => ({
        ...sale,
        _outstandingBalance: getOutstandingBalance(sale),
        _effectivePrice: getEffectivePrice(sale),
        _amountPaid: getAmountPaid(sale),
      }))
      .filter((sale) => {
        const status = normalizeStatus(sale.status);

        return (
          sale._outstandingBalance > 0 &&
          !["cancelled", "completed"].includes(status)
        );
      });
  }, [records]);

  /*
  |--------------------------------------------------------------------------
  | Summary Cards
  |--------------------------------------------------------------------------
  */

  const summary = useMemo(
    () =>
      outstandingRecords.reduce(
        (total, sale) => ({
          count: total.count + 1,
          totalOutstanding:
            total.totalOutstanding + sale._outstandingBalance,
          totalPaid: total.totalPaid + sale._amountPaid,
          totalSaleValue:
            total.totalSaleValue + sale._effectivePrice,
        }),
        {
          count: 0,
          totalOutstanding: 0,
          totalPaid: 0,
          totalSaleValue: 0,
        }
      ),
    [outstandingRecords]
  );

  /*
  |--------------------------------------------------------------------------
  | Search, Filter, and Sort
  |--------------------------------------------------------------------------
  */

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
          normalizeStatus(sale.status) ===
          normalizeStatus(statusFilter)
      );
    }

    switch (sortBy) {
      case "balance_asc":
        result.sort(
          (a, b) =>
            a._outstandingBalance - b._outstandingBalance
        );
        break;

      case "date_desc":
        result.sort(
          (a, b) =>
            new Date(getSaleDate(b) ?? 0).getTime() -
            new Date(getSaleDate(a) ?? 0).getTime()
        );
        break;

      case "date_asc":
        result.sort(
          (a, b) =>
            new Date(getSaleDate(a) ?? 0).getTime() -
            new Date(getSaleDate(b) ?? 0).getTime()
        );
        break;

      default:
        result.sort(
          (a, b) =>
            b._outstandingBalance - a._outstandingBalance
        );
    }

    return result;
  }, [outstandingRecords, search, statusFilter, sortBy]);

  /*
  |--------------------------------------------------------------------------
  | Client-Side Pagination
  |--------------------------------------------------------------------------
  */

  const totalPages = Math.max(
    1,
    Math.ceil(visibleRecords.length / PAGE_SIZE)
  );

  // Keep the selected page valid when filters reduce the result count.
  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const pageRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return visibleRecords.slice(start, start + PAGE_SIZE);
  }, [visibleRecords, currentPage]);

  const startRecord =
    visibleRecords.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const endRecord = Math.min(
    currentPage * PAGE_SIZE,
    visibleRecords.length
  );

  /*
  |--------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------
  */

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
    if (!sale?.id) {
      Swal.fire({
        icon: "error",
        title: "Unable to record payment",
        text: "This sale record does not have a valid ID.",
      });

      return;
    }

    navigate(
      `/super-admin/plots/payments/create?plot_sale_id=${sale.id}`
    );
  };

  const hasFilters = Boolean(search.trim() || statusFilter);
  const displayedError = error || hookOutstandingError;

  // Use the component's request state to control the table spinner.
  const isLoading = loading;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div  className="w-full space-y-6">
      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <PlotSaleHeader
          title="Outstanding Plot Sales"
          description="Monitor unpaid plot sale balances and follow up on pending payments."
          loading={isLoading || refreshing}
          onRefresh={handleRefresh}
          showRefresh
          showCreate={false}
          showReports={false}
        />

        {displayedError && (
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
                {displayedError}
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

        {/* Statistics */}
        <section
          aria-label="Outstanding sales statistics"
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

            <div className="md:col-span-3">
              <StatCard
                title="Net Sale Value"
                value={formatCurrency(summary.totalSaleValue)}
                description="Sale price less discounts"
                icon={CircleDollarSign}
                iconClass="bg-violet-50 text-violet-600"
                wide
              />
            </div>
          </div>
        </section>

        {/* Outstanding transactions */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
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
                      {(search.trim() ? 1 : 0) +
                        (statusFilter ? 1 : 0)}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing || isLoading}
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
                    <option value="date_desc">
                      Newest sale first
                    </option>
                    <option value="date_asc">
                      Oldest sale first
                    </option>
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

          {/* Table loading state */}
          {isLoading ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-4 py-12">
              <Loader2
                className="animate-spin text-blue-600"
                size={34}
              />

              <p className="text-sm font-medium text-gray-600">
                Loading outstanding plot sales...
              </p>
            </div>
          ) : pageRecords.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
              <div className="mb-4 rounded-2xl bg-gray-100 p-4">
                {displayedError ? (
                  <AlertCircle size={30} className="text-red-500" />
                ) : (
                  <Banknote size={30} className="text-gray-400" />
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                {displayedError
                  ? "Outstanding sales unavailable"
                  : hasFilters
                    ? "No matching outstanding sales"
                    : "No outstanding plot sales"}
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                {displayedError
                  ? "Check the API response and try loading the records again."
                  : hasFilters
                    ? "Try changing your search terms or clearing the selected filters."
                    : "No unpaid sales with an outstanding balance were found."}
              </p>

              {displayedError ? (
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
                <table className="w-full min-w-[1050px] divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        ["Sale / Plot", "text-left"],
                        ["Buyer", "text-left"],
                        ["Sale Date", "text-left"],
                        ["Sale Value", "text-right"],
                        ["Amount Paid", "text-right"],
                        ["Outstanding", "text-right"],
                        ["Status", "text-left"],
                        ["Actions", "text-right"],
                      ].map(([heading, alignment]) => (
                        <th
                          key={heading}
                          scope="col"
                          className={`px-5 py-4 ${alignment} text-xs font-bold uppercase tracking-wider text-gray-500`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {pageRecords.map((sale, index) => {
                      const currency = sale.currency || "KES";
                      const saleValue = sale._effectivePrice;
                      const amountPaid = sale._amountPaid;
                      const balance = sale._outstandingBalance;

                      const paymentProgress =
                        saleValue > 0
                          ? Math.min(
                            100,
                            Math.max(
                              0,
                              (amountPaid / saleValue) * 100
                            )
                          )
                          : 0;

                      return (
                        <tr
                          key={
                            sale.id ??
                            sale.sale_number ??
                            `sale-${index}`
                          }
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

                            {(sale.buyer?.email ||
                              sale.customer?.email) && (
                                <p className="mt-1 max-w-52 truncate text-xs text-gray-500">
                                  {sale.buyer?.email ??
                                    sale.customer?.email}
                                </p>
                              )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <CalendarDays
                                size={15}
                                className="shrink-0 text-gray-400"
                              />
                              {formatDate(getSaleDate(sale))}
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

                            <div className="ml-auto mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{
                                  width: `${paymentProgress}%`,
                                }}
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
                  {" "}·{" "}
                  <span className="font-semibold text-gray-800">
                    {formatNumber(visibleRecords.length)}
                  </span>{" "}
                  records
                  {visibleRecords.length > 0 && (
                    <>
                      {" "}· Showing {formatNumber(startRecord)}–
                      {formatNumber(endRecord)}
                    </>
                  )}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
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
                    disabled={currentPage >= totalPages}
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
        </section>

        {/* Payment follow-up note */}
        {!isLoading &&
          !displayedError &&
          outstandingRecords.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Payment follow-up
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Confirm payment records against the relevant plot sale
                  before marking any balance as settled. Outstanding
                  amounts use the sale balance when available; otherwise,
                  the net sale value less the recorded amount paid is used.
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
