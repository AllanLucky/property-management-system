
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
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

import PlotSaleHeader from "./PlotSaleHeader";
import { usePlotSales } from "../../../hooks/usePlotSales";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const PAGE_SIZE = 10;

const SALE_STATUSES = [
  { value: "", label: "All sale statuses" },
  { value: "pending", label: "Pending" },
  { value: "reserved", label: "Reserved" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_BREAKDOWN = [
  { key: "pending", label: "Pending", colorClass: "bg-amber-500" },
  { key: "reserved", label: "Reserved", colorClass: "bg-blue-500" },
  { key: "approved", label: "Approved", colorClass: "bg-violet-500" },
  { key: "completed", label: "Completed", colorClass: "bg-emerald-500" },
  { key: "cancelled", label: "Cancelled", colorClass: "bg-red-500" },
];

const REPORT_ROUTES = {
  index: "/super-admin/plot-sales",
  details: (id) => `/super-admin/plot-sales/${id}`,
};

/*
|--------------------------------------------------------------------------
| Formatting Helpers
|--------------------------------------------------------------------------
*/

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const formatCurrency = (amount, currency = "KES") => {
  const value = toNumber(amount);
  const code = currency || "KES";

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${code} ${value.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

const formatCompactCurrency = (amount, currency = "KES") => {
  const value = toNumber(amount);

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency || "KES",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return formatCurrency(value, currency);
  }
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE").format(toNumber(value));

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Use the most relevant available date field.
 * The supplied report records include completion_date and created_at,
 * and may not include sale_date.
 */
const getSaleDate = (sale) =>
  sale?.sale_date ??
  sale?.saleDate ??
  sale?.agreement_date ??
  sale?.completion_date ??
  sale?.created_at ??
  sale?.updated_at ??
  null;

const getSaleNumber = (sale) =>
  sale?.sale_number ??
  sale?.saleNumber ??
  sale?.sale_code ??
  (sale?.id ? `SALE-${sale.id}` : "—");

const getNetSalePrice = (sale) => {
  const salePrice = toNumber(sale?.sale_price);
  const discount = toNumber(
    sale?.discount_amount ?? sale?.discount
  );

  const explicitNet = sale?.net_sale_price;

  if (
    explicitNet !== null &&
    explicitNet !== undefined &&
    explicitNet !== ""
  ) {
    return Math.max(0, toNumber(explicitNet));
  }

  return Math.max(0, salePrice - discount);
};

const getAmountPaid = (sale) =>
  Math.max(0, toNumber(sale?.amount_paid));

const getOutstandingBalance = (sale) => {
  if (
    sale?.balance !== null &&
    sale?.balance !== undefined &&
    sale?.balance !== ""
  ) {
    return Math.max(0, toNumber(sale.balance));
  }

  return Math.max(
    0,
    getNetSalePrice(sale) - getAmountPaid(sale)
  );
};

const getPlotName = (sale) =>
  sale?.plot?.title ??
  sale?.plot?.name ??
  sale?.plot_title ??
  sale?.plot_name ??
  "Plot information unavailable";

const getPlotCode = (sale) =>
  sale?.plot?.code ??
  sale?.plot_code ??
  sale?.plot?.plot_number ??
  "—";

const getPersonName = (person, fallback = "—") => {
  if (!person) return fallback;

  const fullName = [
    person.first_name,
    person.middle_name,
    person.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    person.name ??
    person.full_name ??
    person.fullName ??
    fullName ??
    person.email ??
    fallback
  );
};

const getBuyerName = (sale) =>
  getPersonName(
    sale?.buyer,
    sale?.buyer_name ??
    sale?.buyer_full_name ??
    "Buyer unavailable"
  );

const getAgentName = (sale) =>
  getPersonName(sale?.agent, sale?.agent_name ?? "—");

const getStatusLabel = (status) =>
  String(status ?? "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getStatusClasses = (status) => {
  const styles = {
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    reserved: "bg-blue-50 text-blue-700 ring-blue-600/20",
    approved: "bg-violet-50 text-violet-700 ring-violet-600/20",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    cancelled: "bg-red-50 text-red-700 ring-red-600/20",
  };

  return (
    styles[String(status ?? "").toLowerCase()] ??
    "bg-gray-100 text-gray-700 ring-gray-500/20"
  );
};

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;
  const errors = responseData?.errors;

  if (typeof errors === "string") {
    return errors;
  }

  if (errors && typeof errors === "object") {
    const firstError = Object.values(errors)
      .flat()
      .find((message) => typeof message === "string");

    if (firstError) return firstError;
  }

  return (
    responseData?.message ??
    error?.message ??
    "Unable to load plot sale reports. Please try again."
  );
};

/*
|--------------------------------------------------------------------------
| Response Normalizers
|--------------------------------------------------------------------------
*/

/**
 * Supports:
 *
 * Axios + EstateKenya envelope:
 * response.data = { status, message, data: [...] }
 *
 * Direct EstateKenya envelope:
 * { status, message, data: [...] }
 *
 * Direct array:
 * [...]
 */
const getRootPayload = (response) => {
  let result = response?.data ?? response;

  if (
    result &&
    typeof result === "object" &&
    !Array.isArray(result) &&
    Object.prototype.hasOwnProperty.call(result, "data")
  ) {
    result = result.data;
  }

  return result;
};

const getSaleArray = (response) => {
  const payload = getRootPayload(response);

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.sales)) return payload.sales;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.records)) return payload.records;

  return [];
};

/**
 * Distinguishes an actual empty sales list from a response that
 * contains no sales array at all.
 */
const hasSaleArray = (response) => {
  if (response === null || response === undefined) return false;

  const payload = getRootPayload(response);

  return (
    Array.isArray(payload) ||
    Array.isArray(payload?.data) ||
    Array.isArray(payload?.sales) ||
    Array.isArray(payload?.items) ||
    Array.isArray(payload?.records)
  );
};

const getPaginationMeta = (response) => {
  const axiosPayload = response?.data ?? response;
  const payload = getRootPayload(response);

  return (
    axiosPayload?.meta ??
    payload?.meta ??
    axiosPayload?.pagination ??
    payload?.pagination ??
    (payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      (
        "current_page" in payload ||
        "last_page" in payload ||
        "total" in payload
      )
      ? payload
      : {})
  );
};

const getReportPayload = (response) => {
  const payload = getRootPayload(response);

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  if (payload.report && typeof payload.report === "object") {
    return payload.report;
  }

  if (payload.statistics && typeof payload.statistics === "object") {
    return payload.statistics;
  }

  if (payload.stats && typeof payload.stats === "object") {
    return payload.stats;
  }

  if (payload.summary && typeof payload.summary === "object") {
    return payload.summary;
  }

  return payload;
};

/**
 * Read a backend statistic without assuming a single naming convention.
 */
const getStatNumber = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key];

    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| CSV Export
|--------------------------------------------------------------------------
*/

const downloadCsv = (filename, rows) => {
  const escapeCell = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csvContent = rows
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/*
|--------------------------------------------------------------------------
| Reusable UI Components
|--------------------------------------------------------------------------
*/

function ReportStatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass = "bg-blue-50 text-blue-600",
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-2 break-words text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {value}
          </p>

          {description && (
            <p className="mt-2 text-xs leading-5 text-gray-500">
              {description}
            </p>
          )}
        </div>

        <div className={`shrink-0 rounded-xl p-3 ${iconClass}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(
        status
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function SectionHeading({ title, description, icon: Icon }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-gray-100 p-2.5 text-gray-600">
        <Icon size={20} />
      </div>

      <div className="min-w-0">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>

        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
}

function StatusBreakdownRow({
  label,
  count,
  amount,
  totalCount,
  currency,
  colorClass,
}) {
  const percentage =
    totalCount > 0
      ? Math.min(100, (count / totalCount) * 100)
      : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${colorClass}`}
          />
          <span className="truncate text-sm font-medium text-gray-700">
            {label}
          </span>
        </div>

        <span className="shrink-0 text-sm font-semibold text-gray-900">
          {formatNumber(count)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-start justify-between gap-3 text-xs text-gray-500">
        <span>{percentage.toFixed(1)}% of displayed sales</span>
        <span className="text-right font-medium text-gray-700">
          {formatCurrency(amount, currency)}
        </span>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 py-12">
      <Loader2 size={32} className="animate-spin text-blue-600" />
      <p className="text-sm font-medium text-gray-600">
        Loading plot sale report...
      </p>
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
      <div className="mb-4 rounded-2xl bg-gray-100 p-4">
        <FileText size={30} className="text-gray-400" />
      </div>

      <h3 className="text-lg font-bold text-gray-900">
        No report records found
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
        No plot sales match your current filters. Try changing the
        reporting period, status, or search term.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <X size={16} />
        Reset filters
      </button>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Plot Sale Reports Page
|--------------------------------------------------------------------------
*/

export default function PlotSaleReports() {
  const navigate = useNavigate();
  const plotSalesHook = usePlotSales({ autoFetch: false }) ?? {};

  const {
    loading: hookLoading = false,
    error: hookError = null,
    plotSales,
    sales,
    fetchPlotSales,
    fetchSales,
    fetchPlotSaleReports,
    fetchPlotSalesReports,
    fetchPlotSaleStatistics,
    fetchPlotSalesStatistics,
    getPlotSaleReports,
    getPlotSalesReports,
    getPlotSaleStatistics,
    getPlotSalesStatistics,
  } = plotSalesHook;

  const today = useMemo(() => new Date(), []);

  const firstDayOfMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );

  const [startDate, setStartDate] = useState(
    toDateInputValue(firstDayOfMonth)
  );
  const [endDate, setEndDate] = useState(toDateInputValue(today));
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);

  const [records, setRecords] = useState([]);
  const [reportData, setReportData] = useState({});
  const [paginationMeta, setPaginationMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const requestSequence = useRef(0);

  /*
  |--------------------------------------------------------------------------
  | Keep Fallback Hook Data Current
  |--------------------------------------------------------------------------
  */

  const fallbackRecords = useMemo(() => {
    if (Array.isArray(plotSales)) return plotSales;
    if (Array.isArray(sales)) return sales;
    return null;
  }, [plotSales, sales]);

  const fallbackRecordsRef = useRef(fallbackRecords);

  useEffect(() => {
    fallbackRecordsRef.current = fallbackRecords;
  }, [fallbackRecords]);

  /*
  |--------------------------------------------------------------------------
  | Load Report Data
  |--------------------------------------------------------------------------
  */

  const loadReports = useCallback(
    async ({ silent = false } = {}) => {
      const requestId = ++requestSequence.current;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        if (startDate && endDate && startDate > endDate) {
          throw new Error("Start date cannot be after the end date.");
        }

        const params = {
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          from_date: startDate || undefined,
          to_date: endDate || undefined,
          status: statusFilter || undefined,
          search: search.trim() || undefined,
          sort_by: sortBy,
          page: currentPage,
          per_page: PAGE_SIZE,
          perPage: PAGE_SIZE,
        };

        const reportsLoader =
          fetchPlotSaleReports ??
          fetchPlotSalesReports ??
          getPlotSaleReports ??
          getPlotSalesReports;

        const statisticsLoader =
          fetchPlotSaleStatistics ??
          fetchPlotSalesStatistics ??
          getPlotSaleStatistics ??
          getPlotSalesStatistics;

        const salesLoader = fetchPlotSales ?? fetchSales;

        let reportResponse = null;
        let statisticsResponse = null;
        let salesResponse = null;

        let reportError = null;
        let salesError = null;

        /*
         * The report endpoint is the primary source of transaction rows.
         */
        if (typeof reportsLoader === "function") {
          try {
            reportResponse = await reportsLoader(params);
          } catch (requestError) {
            reportError = requestError;
          }
        }

        /*
         * Statistics are loaded separately because the report endpoint
         * may return only a sales array.
         */
        if (typeof statisticsLoader === "function") {
          try {
            statisticsResponse = await statisticsLoader(params);
          } catch (requestError) {
            reportError = reportError ?? requestError;
          }
        }

        /*
         * Use the list endpoint only if the report response did not
         * actually contain a sales array.
         */
        const reportContainsSales = hasSaleArray(reportResponse);

        if (
          !reportContainsSales &&
          typeof salesLoader === "function"
        ) {
          try {
            salesResponse = await salesLoader(params);
          } catch (requestError) {
            salesError = requestError;
          }
        }

        if (requestId !== requestSequence.current) return;

        const chosenResponse = reportContainsSales
          ? reportResponse
          : hasSaleArray(salesResponse)
            ? salesResponse
            : null;

        if (chosenResponse) {
          setRecords(getSaleArray(chosenResponse));
          setPaginationMeta(getPaginationMeta(chosenResponse));
        } else if (fallbackRecordsRef.current) {
          setRecords(fallbackRecordsRef.current);
          setPaginationMeta({});
        } else {
          setRecords([]);
          setPaginationMeta({});
        }

        /*
         * Prefer the dedicated statistics endpoint.
         * Fall back to report aggregates when the report endpoint returns
         * an object containing summary/statistics fields.
         */
        const statisticsPayload = getReportPayload(statisticsResponse);
        const reportPayload = getReportPayload(reportResponse);

        const hasStatistics =
          statisticsResponse !== null &&
          statisticsResponse !== undefined &&
          Object.keys(statisticsPayload).length > 0;

        const hasReportStatistics =
          reportResponse !== null &&
          reportResponse !== undefined &&
          Object.keys(reportPayload).length > 0 &&
          !Array.isArray(getRootPayload(reportResponse));

        if (hasStatistics) {
          setReportData(statisticsPayload);
        } else if (hasReportStatistics) {
          setReportData(reportPayload);
        } else {
          setReportData({});
        }

        if (
          !chosenResponse &&
          !fallbackRecordsRef.current &&
          !statisticsResponse &&
          !reportResponse
        ) {
          throw (
            salesError ??
            reportError ??
            new Error(
              "No plot sale data loader is available. Check the report methods in usePlotSales."
            )
          );
        }
      } catch (requestError) {
        if (requestId !== requestSequence.current) return;

        setError(getErrorMessage(requestError));
        console.error("Plot sale reports error:", requestError);
      } finally {
        if (requestId === requestSequence.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      startDate,
      endDate,
      statusFilter,
      search,
      sortBy,
      currentPage,
      fetchPlotSaleReports,
      fetchPlotSalesReports,
      getPlotSaleReports,
      getPlotSalesReports,
      fetchPlotSaleStatistics,
      fetchPlotSalesStatistics,
      getPlotSaleStatistics,
      getPlotSalesStatistics,
      fetchPlotSales,
      fetchSales,
    ]
  );

  useEffect(() => {
    loadReports();

    return () => {
      requestSequence.current += 1;
    };
  }, [loadReports]);

  /*
  |--------------------------------------------------------------------------
  | Normalize Records
  |--------------------------------------------------------------------------
  */

  const normalizedRecords = useMemo(
    () =>
      records.map((sale) => ({
        ...sale,
        _netPrice: getNetSalePrice(sale),
        _amountPaid: getAmountPaid(sale),
        _outstanding: getOutstandingBalance(sale),
        _reportDate: getSaleDate(sale),
      })),
    [records]
  );

  /*
  |--------------------------------------------------------------------------
  | Filter And Sort Records
  |--------------------------------------------------------------------------
  */

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = normalizedRecords.filter((sale) => {
      const saleDateValue = sale._reportDate;
      const saleDate = saleDateValue ? new Date(saleDateValue) : null;
      const validSaleDate =
        saleDate && !Number.isNaN(saleDate.getTime());

      if (startDate && validSaleDate) {
        if (toDateInputValue(saleDate) < startDate) return false;
      }

      if (endDate && validSaleDate) {
        if (toDateInputValue(saleDate) > endDate) return false;
      }

      if (
        statusFilter &&
        String(sale.status ?? "").toLowerCase() !==
        statusFilter.toLowerCase()
      ) {
        return false;
      }

      if (normalizedSearch) {
        const searchableValues = [
          getSaleNumber(sale),
          sale.agreement_number,
          getPlotName(sale),
          getPlotCode(sale),
          getBuyerName(sale),
          getAgentName(sale),
          sale.status,
        ];

        const matches = searchableValues.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(normalizedSearch)
        );

        if (!matches) return false;
      }

      return true;
    });

    const getTimestamp = (sale) => {
      const value = sale._reportDate;
      const timestamp = value ? new Date(value).getTime() : 0;

      return Number.isFinite(timestamp) ? timestamp : 0;
    };

    switch (sortBy) {
      case "date_asc":
        result.sort((a, b) => getTimestamp(a) - getTimestamp(b));
        break;

      case "amount_desc":
        result.sort((a, b) => b._netPrice - a._netPrice);
        break;

      case "amount_asc":
        result.sort((a, b) => a._netPrice - b._netPrice);
        break;

      case "balance_desc":
        result.sort((a, b) => b._outstanding - a._outstanding);
        break;

      default:
        result.sort((a, b) => getTimestamp(b) - getTimestamp(a));
    }

    return result;
  }, [
    normalizedRecords,
    startDate,
    endDate,
    statusFilter,
    search,
    sortBy,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Summary Calculations
  |--------------------------------------------------------------------------
  */

  const summary = useMemo(() => {
    const activeRecords = filteredRecords.filter(
      (sale) =>
        String(sale.status ?? "").toLowerCase() !== "cancelled"
    );

    const completedRecords = filteredRecords.filter(
      (sale) =>
        String(sale.status ?? "").toLowerCase() === "completed"
    );

    const outstandingRecords = activeRecords.filter(
      (sale) => sale._outstanding > 0
    );

    const localTotalSalePrice = activeRecords.reduce(
      (total, sale) => total + toNumber(sale.sale_price),
      0
    );

    const localTotalDiscount = activeRecords.reduce(
      (total, sale) =>
        total + toNumber(sale.discount_amount ?? sale.discount),
      0
    );

    const localNetSaleValue = activeRecords.reduce(
      (total, sale) => total + sale._netPrice,
      0
    );

    const localTotalAmountPaid = activeRecords.reduce(
      (total, sale) => total + sale._amountPaid,
      0
    );

    const localTotalOutstanding = outstandingRecords.reduce(
      (total, sale) => total + sale._outstanding,
      0
    );

    const localCompletedValue = completedRecords.reduce(
      (total, sale) => total + sale._netPrice,
      0
    );

    const statusCounts = {};
    const statusAmounts = {};

    filteredRecords.forEach((sale) => {
      const status = String(sale.status ?? "unknown").toLowerCase();

      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
      statusAmounts[status] =
        (statusAmounts[status] ?? 0) + sale._netPrice;
    });

    /*
     * Backend aliases are based on the statistics response fields used
     * by the EstateKenya plot-sales API.
     */
    const backendTotalSales = getStatNumber(reportData, [
      "total_sales",
      "total_records",
      "total",
    ]);

    const backendCancelledSales = getStatNumber(reportData, [
      "cancelled_sales",
      "cancelled_count",
    ]);

    const backendPendingSales = getStatNumber(reportData, [
      "pending_sales",
    ]);

    const backendReservedSales = getStatNumber(reportData, [
      "reserved_sales",
    ]);

    const backendApprovedSales = getStatNumber(reportData, [
      "approved_sales",
    ]);

    const backendCompletedSales = getStatNumber(reportData, [
      "completed_sales",
    ]);

    const backendTotalAmount = getStatNumber(reportData, [
      "total_amount",
      "total_sale_price",
      "total_sales_value",
    ]);

    const backendTotalDiscount = getStatNumber(reportData, [
      "total_discount",
      "total_discounts",
    ]);

    const backendNetSaleValue = getStatNumber(reportData, [
      "total_net_sale_value",
      "net_sale_value",
      "total_net_amount",
    ]);

    const backendTotalPaid = getStatNumber(reportData, [
      "total_paid",
      "total_amount_paid",
      "amount_paid",
      "total_collected",
    ]);

    const backendOutstanding = getStatNumber(reportData, [
      "total_outstanding",
      "total_balance",
      "outstanding_balance",
      "total_outstanding_balance",
    ]);

    const backendCompletedValue = getStatNumber(reportData, [
      "completed_value",
      "completed_amount",
      "total_completed_amount",
    ]);

    const totalSalePrice =
      backendTotalAmount ?? localTotalSalePrice;

    const totalDiscount =
      backendTotalDiscount ?? localTotalDiscount;

    const totalSaleValue =
      backendNetSaleValue ??
      (backendTotalAmount !== null
        ? Math.max(0, backendTotalAmount - totalDiscount)
        : localNetSaleValue);

    const totalAmountPaid =
      backendTotalPaid ?? localTotalAmountPaid;

    const totalOutstanding =
      backendOutstanding ?? localTotalOutstanding;

    const completedSales =
      backendCompletedSales ?? completedRecords.length;

    const completedValue =
      backendCompletedValue ?? localCompletedValue;

    const activeSales =
      backendTotalSales !== null
        ? Math.max(
          0,
          backendTotalSales -
          (backendCancelledSales ?? statusCounts.cancelled ?? 0)
        )
        : activeRecords.length;

    const outstandingSales =
      totalOutstanding > 0
        ? backendOutstanding !== null
          ? outstandingRecords.length ||
          (backendTotalSales !== null ? undefined : 0)
          : outstandingRecords.length
        : 0;

    const collectionRate =
      totalSaleValue > 0
        ? Math.min(100, (totalAmountPaid / totalSaleValue) * 100)
        : 0;

    return {
      totalRecords: backendTotalSales ?? filteredRecords.length,
      activeSales,
      completedSales,
      outstandingSales:
        outstandingSales === undefined
          ? outstandingRecords.length
          : outstandingSales,
      totalSalePrice,
      totalDiscount,
      totalSaleValue,
      totalAmountPaid,
      totalOutstanding,
      completedValue,
      collectionRate,
      statusCounts: {
        ...statusCounts,
        ...(backendPendingSales !== null && {
          pending: backendPendingSales,
        }),
        ...(backendReservedSales !== null && {
          reserved: backendReservedSales,
        }),
        ...(backendApprovedSales !== null && {
          approved: backendApprovedSales,
        }),
        ...(backendCompletedSales !== null && {
          completed: backendCompletedSales,
        }),
        ...(backendCancelledSales !== null && {
          cancelled: backendCancelledSales,
        }),
      },
      statusAmounts,
    };
  }, [filteredRecords, reportData]);

  const currency =
    filteredRecords[0]?.currency ??
    records[0]?.currency ??
    "KES";

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const serverLastPage = toNumber(
    paginationMeta?.last_page ??
    paginationMeta?.lastPage ??
    paginationMeta?.total_pages
  );

  const serverCurrentPage = toNumber(
    paginationMeta?.current_page ??
    paginationMeta?.currentPage
  );

  const serverTotal = toNumber(
    paginationMeta?.total ??
    paginationMeta?.total_records,
    filteredRecords.length
  );

  const hasServerPagination =
    serverLastPage > 0 ||
    paginationMeta?.current_page !== undefined ||
    paginationMeta?.currentPage !== undefined;

  const totalPages = hasServerPagination
    ? Math.max(1, serverLastPage || 1)
    : Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));

  const displayedPage = hasServerPagination
    ? serverCurrentPage || currentPage
    : currentPage;

  const pageRecords = useMemo(() => {
    if (hasServerPagination) return filteredRecords;

    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage, hasServerPagination]);

  /*
  |--------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------
  */

  const handleRefresh = useCallback(() => {
    loadReports({ silent: true });
  }, [loadReports]);

  const handleClearFilters = useCallback(() => {
    setStartDate(toDateInputValue(firstDayOfMonth));
    setEndDate(toDateInputValue(today));
    setStatusFilter("");
    setSearch("");
    setSortBy("date_desc");
    setCurrentPage(1);
    setError("");
  }, [firstDayOfMonth, today]);

  const handleViewSale = useCallback(
    (sale) => {
      if (!sale?.id) {
        Swal.fire({
          icon: "error",
          title: "Unable to open sale",
          text: "The selected sale does not have a valid ID.",
        });

        return;
      }

      navigate(REPORT_ROUTES.details(sale.id));
    },
    [navigate]
  );

  const handleExportCsv = useCallback(async () => {
    if (filteredRecords.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "No records to export",
        text: "There are no plot sales matching the current report filters.",
      });

      return;
    }

    const rows = [
      [
        "Sale Number",
        "Sale Date",
        "Agreement Number",
        "Plot",
        "Plot Code",
        "Buyer",
        "Agent",
        "Sale Price",
        "Discount",
        "Net Sale Value",
        "Amount Paid",
        "Outstanding Balance",
        "Currency",
        "Status",
      ],
      ...filteredRecords.map((sale) => [
        getSaleNumber(sale),
        getSaleDate(sale) ?? "",
        sale.agreement_number ?? "",
        getPlotName(sale),
        getPlotCode(sale),
        getBuyerName(sale),
        getAgentName(sale),
        toNumber(sale.sale_price).toFixed(2),
        toNumber(sale.discount_amount ?? sale.discount).toFixed(2),
        sale._netPrice.toFixed(2),
        sale._amountPaid.toFixed(2),
        sale._outstanding.toFixed(2),
        sale.currency ?? "KES",
        sale.status ?? "",
      ]),
    ];

    const filename =
      `plot-sale-report-${startDate || "all"}-to-${endDate || "all"}.csv`;

    downloadCsv(filename, rows);

    await Swal.fire({
      icon: "success",
      title: "Report exported",
      text: `${formatNumber(
        filteredRecords.length
      )} plot sale records were exported to CSV.`,
      timer: 1800,
      showConfirmButton: false,
    });
  }, [filteredRecords, startDate, endDate]);

  const activeFilterCount =
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0) +
    (statusFilter ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const startRecord =
    pageRecords.length === 0
      ? 0
      : hasServerPagination
        ? (Math.max(1, displayedPage) - 1) * PAGE_SIZE + 1
        : (currentPage - 1) * PAGE_SIZE + 1;

  const endRecord =
    pageRecords.length === 0
      ? 0
      : hasServerPagination
        ? startRecord + pageRecords.length - 1
        : Math.min(
          currentPage * PAGE_SIZE,
          filteredRecords.length
        );

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50/70 pb-10">
      <div className="w-full min-w-0 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <PlotSaleHeader
          title="Plot Sale Reports"
          description="Review plot sales performance, collections, outstanding balances and transaction status."
          loading={loading || hookLoading || refreshing}
          onRefresh={handleRefresh}
          showRefresh
          showCreate={false}
          showReports={false}
        />

        {(error || hookError) && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-start"
          >
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-red-800">
                Unable to load report data
              </p>

              <p className="mt-1 break-words text-sm text-red-700">
                {error || getErrorMessage(hookError)}
              </p>

              <button
                type="button"
                onClick={() => loadReports()}
                disabled={loading}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Report filters */}
        <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Filter size={20} />
              </div>

              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Report Filters
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Select a reporting period and narrow down the results.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters((visible) => !visible)}
                aria-expanded={showFilters}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <CalendarDays size={16} />
                {showFilters ? "Hide filters" : "Show filters"}
                <ChevronDown
                  size={16}
                  className={`transition ${showFilters ? "rotate-180" : ""
                    }`}
                />
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={loading || filteredRecords.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:p-5">
              <div>
                <label
                  htmlFor="plot-report-start-date"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Start date
                </label>

                <input
                  id="plot-report-start-date"
                  type="date"
                  value={startDate}
                  max={endDate || toDateInputValue(today)}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="plot-report-end-date"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  End date
                </label>

                <input
                  id="plot-report-end-date"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  max={toDateInputValue(today)}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="plot-report-status"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Sale status
                </label>

                <select
                  id="plot-report-status"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {SALE_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="plot-report-sort"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Sort records
                </label>

                <select
                  id="plot-report-sort"
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="date_desc">Newest first</option>
                  <option value="date_asc">Oldest first</option>
                  <option value="amount_desc">Highest sale value</option>
                  <option value="amount_asc">Lowest sale value</option>
                  <option value="balance_desc">Highest outstanding</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="plot-report-search"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Search records
                </label>

                <div className="relative">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="plot-report-search"
                    type="search"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Sale, plot, buyer..."
                    className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setCurrentPage(1);
                      }}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-5">
                <button
                  type="button"
                  onClick={() => loadReports()}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Filter size={16} />
                  )}
                  Apply filters
                </button>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <X size={16} />
                  Reset
                </button>

                <span className="ml-auto text-xs text-gray-500">
                  {activeFilterCount} filter field
                  {activeFilterCount === 1 ? "" : "s"} populated
                </span>
              </div>
            </div>
          )}
        </section>

        {/* KPI cards */}
        <section className="w-full min-w-0 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Sales Overview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Summary of the sales matching your current report filters.
              </p>
            </div>

            <span className="text-xs font-medium text-gray-500">
              {formatDate(startDate)} — {formatDate(endDate)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ReportStatCard
              title="Net Sale Value"
              value={formatCompactCurrency(summary.totalSaleValue, currency)}
              description={`${formatNumber(summary.activeSales)} non-cancelled sales`}
              icon={CircleDollarSign}
              iconClass="bg-blue-50 text-blue-600"
            />

            <ReportStatCard
              title="Amount Collected"
              value={formatCompactCurrency(summary.totalAmountPaid, currency)}
              description={`${summary.collectionRate.toFixed(1)}% of net sale value`}
              icon={Wallet}
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <ReportStatCard
              title="Outstanding Balance"
              value={formatCompactCurrency(summary.totalOutstanding, currency)}
              description={`${formatNumber(summary.outstandingSales)} sales with balances`}
              icon={Clock}
              iconClass="bg-amber-50 text-amber-600"
            />

            <ReportStatCard
              title="Completed Sales"
              value={formatNumber(summary.completedSales)}
              description={`Net value: ${formatCompactCurrency(summary.completedValue, currency)}`}
              icon={CheckCircle2}
              iconClass="bg-violet-50 text-violet-600"
            />
          </div>
        </section>

        {/* Collection and status performance */}
        <section className="grid w-full min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
            <SectionHeading
              title="Collection Performance"
              description="Compare payments received with net sale value."
              icon={TrendingUp}
            />

            <div className="mt-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-gray-500">Collection rate</p>

                  <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                    {summary.collectionRate.toFixed(1)}%
                  </p>
                </div>

                <p className="text-sm text-gray-500">
                  {formatCurrency(summary.totalAmountPaid, currency)} collected
                </p>
              </div>

              <div
                className="mt-4 h-4 overflow-hidden rounded-full bg-gray-100"
                role="progressbar"
                aria-label="Collection rate"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(summary.collectionRate)}
              >
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${summary.collectionRate}%` }}
                />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500">
                    Net sale value
                  </p>
                  <p className="mt-2 break-words text-base font-bold text-gray-900">
                    {formatCurrency(summary.totalSaleValue, currency)}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-medium text-emerald-700">
                    Payments collected
                  </p>
                  <p className="mt-2 break-words text-base font-bold text-emerald-800">
                    {formatCurrency(summary.totalAmountPaid, currency)}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-medium text-amber-700">
                    Outstanding
                  </p>
                  <p className="mt-2 break-words text-base font-bold text-amber-800">
                    {formatCurrency(summary.totalOutstanding, currency)}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-gray-500">
                Collection rate is calculated from recorded payments divided
                by net sale value. Outstanding balances are based on the
                balance field returned by the API.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <SectionHeading
              title="Sale Status Breakdown"
              description="Distribution of records by sale status."
              icon={BarChart3}
            />

            <div className="mt-6 space-y-5">
              {STATUS_BREAKDOWN.map((item) => (
                <StatusBreakdownRow
                  key={item.key}
                  label={item.label}
                  count={summary.statusCounts[item.key] ?? 0}
                  amount={summary.statusAmounts[item.key] ?? 0}
                  totalCount={summary.totalRecords}
                  currency={currency}
                  colorClass={item.colorClass}
                />
              ))}

              {summary.totalRecords === 0 && (
                <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                  No sale records are available for this reporting period.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Sales report table */}
        <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Plot Sales Report
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Transactions matching your selected report filters.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={loading || filteredRecords.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileSpreadsheet size={17} />
              Export filtered records
            </button>
          </div>

          {loading ? (
            <LoadingState />
          ) : filteredRecords.length === 0 ? (
            <EmptyState onReset={handleClearFilters} />
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1050px] divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        ["Sale / Plot", "left"],
                        ["Buyer", "left"],
                        ["Agent", "left"],
                        ["Sale Date", "left"],
                        ["Net Sale Value", "right"],
                        ["Amount Paid", "right"],
                        ["Balance", "right"],
                        ["Status", "left"],
                        ["Action", "right"],
                      ].map(([label, align]) => (
                        <th
                          key={label}
                          scope="col"
                          className={`px-5 py-4 ${align === "right" ? "text-right" : "text-left"
                            } text-xs font-bold uppercase tracking-wider text-gray-500`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {pageRecords.map((sale) => {
                      const saleCurrency = sale.currency || currency;

                      return (
                        <tr
                          key={sale.id ?? getSaleNumber(sale)}
                          className="transition hover:bg-gray-50/80"
                        >
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => handleViewSale(sale)}
                              className="group text-left"
                            >
                              <span className="block font-semibold text-gray-900 transition group-hover:text-blue-700">
                                {getSaleNumber(sale)}
                              </span>

                              <span className="mt-1 block max-w-56 truncate text-sm text-gray-600">
                                {getPlotName(sale)}
                              </span>

                              <span className="mt-1 block text-xs text-gray-400">
                                Plot: {getPlotCode(sale)}
                              </span>
                            </button>
                          </td>

                          <td className="px-5 py-4">
                            <span className="block max-w-48 truncate text-sm font-medium text-gray-800">
                              {getBuyerName(sale)}
                            </span>

                            {sale.buyer?.email && (
                              <span className="mt-1 block max-w-48 truncate text-xs text-gray-500">
                                {sale.buyer.email}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="block max-w-40 truncate text-sm text-gray-700">
                              {getAgentName(sale)}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span className="text-sm text-gray-700">
                              {formatDate(getSaleDate(sale))}
                            </span>

                            {sale.agreement_number && (
                              <span className="mt-1 block max-w-40 truncate text-xs text-gray-400">
                                Agreement: {sale.agreement_number}
                              </span>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(sale._netPrice, saleCurrency)}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <span className="text-sm font-semibold text-emerald-700">
                              {formatCurrency(sale._amountPaid, saleCurrency)}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <span
                              className={`text-sm font-semibold ${sale._outstanding > 0
                                ? "text-red-600"
                                : "text-gray-500"
                                }`}
                            >
                              {formatCurrency(sale._outstanding, saleCurrency)}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <StatusBadge status={sale.status} />
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleViewSale(sale)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            >
                              View
                              <ArrowRight size={14} />
                            </button>
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
                  Showing{" "}
                  <span className="font-semibold text-gray-800">
                    {formatNumber(startRecord)}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-800">
                    {formatNumber(endRecord)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-800">
                    {formatNumber(
                      hasServerPagination
                        ? serverTotal
                        : filteredRecords.length
                    )}
                  </span>{" "}
                  records
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={displayedPage <= 1 || loading}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft size={15} />
                    Previous
                  </button>

                  <span className="whitespace-nowrap px-2 text-sm text-gray-600">
                    Page {displayedPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={displayedPage >= totalPages || loading}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Report notes */}
        {!loading && filteredRecords.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0 text-blue-700"
            />

            <div>
              <p className="text-sm font-semibold text-blue-900">
                About these figures
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                Financial summaries use the backend statistics when the
                statistics endpoint provides them; otherwise, they are
                calculated from the loaded sales records. If your API
                paginates the report, confirm that backend statistics apply
                the same filters as the report before treating the totals as
                organization-wide figures.
              </p>
            </div>
          </div>
        )}

        {/* Footer action */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="font-semibold text-gray-900">
              Need to inspect a transaction?
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Open the full plot sale register to view or manage individual
              sales.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(REPORT_ROUTES.index)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            View all plot sales
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
