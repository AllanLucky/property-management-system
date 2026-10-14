
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Filter,
  LoaderCircle,
  RefreshCw,
  Search,
  Wallet,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

import PlotHeader from "./PlotHeader";
import { usePlot } from "../../../hooks/usePlots";

/*
|--------------------------------------------------------------------------
| Report configuration
|--------------------------------------------------------------------------
*/

const REPORT_TYPES = [
  {
    value: "inventory",
    label: "Inventory Report",
    description: "Review plot inventory, prices, and availability.",
  },
  {
    value: "sales",
    label: "Sales Report",
    description: "Review plot sales and transaction records.",
  },
  {
    value: "payments",
    label: "Payments Report",
    description: "Review payments recorded against plot sales.",
  },
  {
    value: "outstanding",
    label: "Outstanding Balances",
    description: "Identify outstanding amounts for plot sales.",
  },
  {
    value: "agents",
    label: "Agents Report",
    description: "Review plot sales and performance by agent.",
  },
  {
    value: "locations",
    label: "Locations Report",
    description: "Summarize plot inventory by location.",
  },
];

const DEFAULT_FILTERS = {
  start_date: "",
  end_date: "",
  status: "",
  search: "",
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
  { value: "unavailable", label: "Unavailable" },
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const unwrapResponse = (response) => {
  let result = response;

  // Axios response: { data: { ... } }
  if (
    result &&
    typeof result === "object" &&
    result.data &&
    typeof result.data === "object" &&
    !Array.isArray(result.data)
  ) {
    result = result.data;
  }

  // Laravel API envelope: { data: [...], meta: {...} }
  return result;
};

const getErrorMessage = (error) => {
  if (typeof error === "string") return error;

  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    "Unable to load the selected report."
  );
};

const isFailedResponse = (response) => {
  if (!response || typeof response !== "object") return false;

  return (
    response.success === false ||
    response.status === false ||
    (typeof response.code === "number" && response.code >= 400)
  );
};

const extractRows = (response) => {
  const result = unwrapResponse(response);

  const candidates = [
    result?.data,
    result?.report,
    result?.results,
    result?.records,
    result?.items,
    result?.data?.data,
    result?.data?.results,
    result?.data?.records,
    result?.data?.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  // Some report endpoints return a single aggregate record.
  if (
    result?.data &&
    typeof result.data === "object" &&
    !Array.isArray(result.data)
  ) {
    const values = Object.values(result.data);

    if (
      values.length &&
      values.every(
        (value) =>
          value === null ||
          ["string", "number", "boolean"].includes(typeof value),
      )
    ) {
      return [result.data];
    }
  }

  return [];
};

const extractSummary = (response) => {
  const result = unwrapResponse(response);

  return (
    result?.summary ||
    result?.statistics ||
    result?.totals ||
    result?.meta?.summary ||
    result?.data?.summary ||
    result?.data?.statistics ||
    result?.data?.totals ||
    {}
  );
};

const formatCurrency = (value) => {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
};

const formatNumber = (value) => {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const humanize = (value) =>
  String(value ?? "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const isDateField = (key) =>
  /(^date$|_date$|_at$|created_at|updated_at|start_date|end_date)/i.test(
    key,
  );

const isMoneyField = (key) =>
  /(price|amount|revenue|payment|paid|balance|outstanding|deposit|commission|total|rent|value|fee|cost)/i.test(
    key,
  );

const isCountField = (key) =>
  /(count|quantity|number_of|total_plots|plots_count|units_count|size|area)/i.test(
    key,
  );

const formatCell = (value, key) => {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).join(", ");
    }

    return (
      value.name ||
      value.title ||
      value.label ||
      value.code ||
      JSON.stringify(value)
    );
  }

  if (isDateField(key)) return formatDate(value);

  if (isMoneyField(key) && Number.isFinite(Number(value))) {
    return formatCurrency(value);
  }

  if (isCountField(key) && Number.isFinite(Number(value))) {
    return formatNumber(value);
  }

  return String(value);
};

const csvValue = (value) => {
  if (value === null || value === undefined) return "";

  const normalized =
    typeof value === "object" ? JSON.stringify(value) : String(value);

  return `"${normalized.replace(/"/g, '""')}"`;
};

const downloadCsv = (filename, rows, columns) => {
  const header = columns.map((column) => csvValue(column.label)).join(",");

  const body = rows.map((row) =>
    columns
      .map((column) => csvValue(row?.[column.key]))
      .join(","),
  );

  const csv = [header, ...body].join("\r\n");
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};

const getReportFilename = (reportType) => {
  const date = new Date().toISOString().slice(0, 10);
  return `estatekenya-plot-${reportType}-report-${date}.csv`;
};

const getReportTitle = (reportType) =>
  REPORT_TYPES.find((report) => report.value === reportType)?.label ||
  "Plot Report";

/*
|--------------------------------------------------------------------------
| Summary Card
|--------------------------------------------------------------------------
*/

function ReportSummaryCard({
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
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
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
| Report Table
|--------------------------------------------------------------------------
*/

function ReportTable({ rows, columns }) {
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <FileSpreadsheet className="h-7 w-7 text-gray-500" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-gray-900">
          No report records found
        </h3>

        <p className="mt-2 max-w-md text-sm text-gray-500">
          Try changing the date range or filters, then generate the report
          again.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row, index) => (
            <tr
              key={
                row?.id ??
                row?.sale_id ??
                row?.payment_id ??
                row?.plot_id ??
                `${index}`
              }
              className="transition hover:bg-gray-50"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="max-w-xs px-5 py-4 text-sm text-gray-700"
                >
                  <span className="block break-words">
                    {formatCell(row?.[column.key], column.key)}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Main Plot Reports Page
|--------------------------------------------------------------------------
*/

export default function PlotReports() {
  const {
    getPlotReport,
    loading: hookLoading,
    error: hookError,
    clearError,
  } = usePlot();

  const [reportType, setReportType] = useState("inventory");
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({
    ...DEFAULT_FILTERS,
  });

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [pageError, setPageError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | Generate report
  |--------------------------------------------------------------------------
  */

  const generateReport = useCallback(
    async (type = reportType, reportFilters = appliedFilters) => {
      if (typeof getPlotReport !== "function") {
        setPageError(
          "Your usePlot hook must provide getPlotReport(reportType, filters).",
        );
        setRows([]);
        setSummary({});
        setHasGenerated(true);
        return;
      }

      setLoading(true);
      setPageError("");

      try {
        const params = {};

        Object.entries(reportFilters).forEach(([key, value]) => {
          if (value !== "" && value !== null && value !== undefined) {
            params[key] = value;
          }
        });

        const response = await getPlotReport(type, params);

        if (isFailedResponse(response)) {
          throw new Error(
            response?.message || "The report request was unsuccessful.",
          );
        }

        const records = extractRows(response);
        const reportSummary = extractSummary(response);

        setRows(records);
        setSummary(reportSummary);
        setHasGenerated(true);
      } catch (error) {
        setRows([]);
        setSummary({});
        setPageError(getErrorMessage(error));
        setHasGenerated(true);
      } finally {
        setLoading(false);
      }
    },
    [getPlotReport, reportType, appliedFilters],
  );

  useEffect(() => {
    generateReport(reportType, appliedFilters);
  }, [generateReport, refreshKey]);

  /*
  |--------------------------------------------------------------------------
  | Filter handlers
  |--------------------------------------------------------------------------
  */

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleGenerate = (event) => {
    event.preventDefault();

    if (
      filters.start_date &&
      filters.end_date &&
      filters.start_date > filters.end_date
    ) {
      Swal.fire({
        icon: "warning",
        title: "Invalid date range",
        text: "The start date must not be later than the end date.",
        confirmButtonColor: "#059669",
      });

      return;
    }

    const nextFilters = { ...filters };

    setAppliedFilters(nextFilters);
    generateReport(reportType, nextFilters);
  };

  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
    setRows([]);
    setSummary({});
    setHasGenerated(false);
    setPageError("");
  };

  const handleReset = () => {
    const resetFilters = { ...DEFAULT_FILTERS };

    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setPageError("");
    setRows([]);
    setSummary({});
    setHasGenerated(false);

    if (typeof clearError === "function") {
      clearError();
    }
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
  | Build report columns
  |--------------------------------------------------------------------------
  */

  const columns = useMemo(() => {
    if (!rows.length) return [];

    const preferredKeys = [
      "code",
      "plot_code",
      "title",
      "plot_title",
      "name",
      "sale_number",
      "payment_number",
      "receipt_number",
      "customer_name",
      "buyer_name",
      "agent_name",
      "location",
      "county_name",
      "city_name",
      "area_name",
      "size",
      "asking_price",
      "sale_price",
      "total_amount",
      "amount_paid",
      "paid_amount",
      "balance",
      "outstanding_amount",
      "status",
      "payment_status",
      "payment_method",
      "sale_date",
      "payment_date",
      "created_at",
    ];

    const keys = new Set();

    rows.forEach((row) => {
      if (row && typeof row === "object" && !Array.isArray(row)) {
        Object.keys(row).forEach((key) => {
          if (typeof row[key] !== "object" || row[key] === null) {
            keys.add(key);
          } else if (
            row[key] &&
            !Array.isArray(row[key]) &&
            (row[key].name || row[key].title || row[key].code)
          ) {
            keys.add(key);
          }
        });
      }
    });

    const orderedKeys = [
      ...preferredKeys.filter((key) => keys.has(key)),
      ...Array.from(keys).filter((key) => !preferredKeys.includes(key)),
    ];

    return orderedKeys.map((key) => ({
      key,
      label: humanize(key),
    }));
  }, [rows]);

  /*
  |--------------------------------------------------------------------------
  | Summary values
  |--------------------------------------------------------------------------
  */

  const summaryCards = useMemo(() => {
    const inventoryCount =
      summary.total_plots ??
      summary.plots_count ??
      summary.total ??
      summary.count ??
      rows.length;

    const totalValue =
      summary.total_value ??
      summary.inventory_value ??
      summary.total_amount ??
      summary.total_sales ??
      summary.total_revenue ??
      0;

    const paidAmount =
      summary.amount_paid ??
      summary.total_paid ??
      summary.paid_amount ??
      summary.total_payments ??
      0;

    const outstanding =
      summary.outstanding_amount ??
      summary.total_outstanding ??
      summary.total_balance ??
      summary.balance ??
      0;

    return [
      {
        title: "Report records",
        value: formatNumber(inventoryCount),
        description: "Records returned by this report",
        icon: BarChart3,
        iconClass: "text-emerald-600",
        iconBackground: "bg-emerald-50",
      },
      {
        title: "Total value",
        value: formatCurrency(totalValue),
        description: "Value reported by the API",
        icon: Wallet,
        iconClass: "text-blue-600",
        iconBackground: "bg-blue-50",
      },
      {
        title: "Amount paid",
        value: formatCurrency(paidAmount),
        description: "Payments reported by the API",
        icon: CheckCircle2,
        iconClass: "text-green-600",
        iconBackground: "bg-green-50",
      },
      {
        title: "Outstanding",
        value: formatCurrency(outstanding),
        description: "Outstanding amount reported by the API",
        icon: AlertCircle,
        iconClass: "text-amber-600",
        iconBackground: "bg-amber-50",
      },
    ];
  }, [summary, rows.length]);

  const currentReport = REPORT_TYPES.find(
    (report) => report.value === reportType,
  );

  const isLoading = loading || Boolean(hookLoading);
  const displayError = pageError || hookError;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen space-y-6 bg-gray-50/70 p-4 sm:p-6 lg:p-8">
      <PlotHeader
        title="Plot Reports"
        subtitle="Generate and export plot inventory, sales, and payment reports."
        activeTab="reports"
      />

      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Plot Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Analyze plot inventory, transactions, payments, and outstanding balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <button
            type="button"
            onClick={() => {
              if (!rows.length || !columns.length) return;

              downloadCsv(
                getReportFilename(reportType),
                rows,
                columns,
              );
            }}
            disabled={isLoading || !rows.length || !columns.length}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report type selection */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
            <BarChart3 className="h-5 w-5 text-emerald-700" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Select report
            </h2>
            <p className="text-sm text-gray-500">
              Choose the report you want to generate.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {REPORT_TYPES.map((report) => {
            const selected = reportType === report.value;

            return (
              <button
                key={report.value}
                type="button"
                onClick={() =>
                  handleReportTypeChange({
                    target: { value: report.value },
                  })
                }
                className={`rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`text-sm font-semibold ${
                      selected ? "text-emerald-800" : "text-gray-900"
                    }`}
                  >
                    {report.label}
                  </span>

                  <span
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border ${
                      selected
                        ? "border-4 border-emerald-600 bg-white"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                </div>

                <p className="mt-2 text-sm leading-5 text-gray-500">
                  {report.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filters */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
            <Filter className="h-4 w-4 text-gray-700" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Report filters
            </h2>
            <p className="text-sm text-gray-500">
              {currentReport?.description}
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label
                htmlFor="plot-report-start-date"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Start date
              </label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  id="plot-report-start-date"
                  type="date"
                  name="start_date"
                  value={filters.start_date}
                  max={filters.end_date || undefined}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="plot-report-end-date"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                End date
              </label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  id="plot-report-end-date"
                  type="date"
                  name="end_date"
                  value={filters.end_date}
                  min={filters.start_date || undefined}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="plot-report-status"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Plot status
              </label>

              <div className="relative">
                <select
                  id="plot-report-status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label
                htmlFor="plot-report-search"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Search
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  id="plot-report-search"
                  type="search"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Plot, code, location..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              Generate report
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Reset filters
            </button>
          </div>
        </form>
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
              Report generation failed
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

      {/* Summary cards */}
      {hasGenerated && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {getReportTitle(reportType)} Summary
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Summary values are taken from the report API response.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <ReportSummaryCard key={card.title} {...card} />
            ))}
          </div>
        </section>
      )}

      {/* Results table */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {getReportTitle(reportType)}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {hasGenerated
                ? `${formatNumber(rows.length)} record(s) returned`
                : "Generate a report to display results."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (rows.length && columns.length) {
                downloadCsv(
                  getReportFilename(reportType),
                  rows,
                  columns,
                );
              }
            }}
            disabled={isLoading || !rows.length || !columns.length}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export results
          </button>
        </div>

        {isLoading ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8">
            <LoaderCircle className="h-9 w-9 animate-spin text-emerald-600" />
            <p className="mt-3 text-sm font-medium text-gray-700">
              Generating report...
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Please wait while we retrieve the report data.
            </p>
          </div>
        ) : displayError ? (
          <div className="px-6 py-12 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
            <p className="mt-3 text-sm font-medium text-gray-800">
              The report could not be loaded.
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : (
          <ReportTable rows={rows} columns={columns} />
        )}

        {!isLoading && !displayError && rows.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/70 px-5 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Displaying {formatNumber(rows.length)} returned records.
            </span>
            <span>
              Currency: KES · Export format: CSV
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
