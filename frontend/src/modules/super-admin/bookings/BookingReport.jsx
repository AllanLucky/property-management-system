import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import bookingApi from "../../../api/booking.api";
import BookingStatistics from "./BookingStatistics";

/*
|--------------------------------------------------------------------------
| BookingReport
|--------------------------------------------------------------------------
|
| EstateKenya Booking Reports
|
| Route:
| /super-admin/bookings/reports
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Filter Options
|--------------------------------------------------------------------------
*/

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "approved",
  "rejected",
  "cancelled",
  "completed",
  "expired",
];

const PAYMENT_STATUS_OPTIONS = [
  "pending",
  "partial",
  "paid",
  "failed",
  "refunded",
];

const BOOKING_TYPE_OPTIONS = [
  "viewing",
  "reservation",
  "rental",
];

const SOURCE_OPTIONS = [
  "website",
  "walk_in",
  "agent",
  "phone",
  "referral",
  "other",
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely convert a value to a number.
 */
const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

/**
 * Format Kenyan currency.
 */
const formatCurrency = (value) => {
  const amount = toNumber(value);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    currencyDisplay: "symbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format numbers.
 */
const formatNumber = (value) => {
  return new Intl.NumberFormat("en-KE").format(
    toNumber(value)
  );
};

/**
 * Convert snake_case / text to title case.
 */
const titleCase = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "—";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

/**
 * Extract an object from different Laravel/API
 * response shapes.
 */
const extractObject = (response) => {
  const root = response?.data ?? response;

  if (
    root?.data &&
    typeof root.data === "object" &&
    !Array.isArray(root.data)
  ) {
    return root.data;
  }

  if (
    root &&
    typeof root === "object" &&
    !Array.isArray(root)
  ) {
    return root;
  }

  return {};
};

/**
 * Extract an array from different Laravel/API
 * response shapes.
 */
const extractArray = (
  response,
  possibleKeys = []
) => {
  const root = response?.data ?? response;

  const candidates = [
    ...possibleKeys.map(
      (key) => root?.[key]
    ),
    root?.data,
    root,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (
      candidate &&
      typeof candidate === "object"
    ) {
      if (Array.isArray(candidate.data)) {
        return candidate.data;
      }

      if (Array.isArray(candidate.items)) {
        return candidate.items;
      }

      if (Array.isArray(candidate.results)) {
        return candidate.results;
      }

      if (Array.isArray(candidate.bookings)) {
        return candidate.bookings;
      }

      if (Array.isArray(candidate.records)) {
        return candidate.records;
      }
    }
  }

  return [];
};

/**
 * Convert a Laravel report breakdown object into
 * a frontend-friendly array.
 *
 * Backend example:
 *
 * {
 *   pending: 5,
 *   confirmed: 2,
 *   approved: 3
 * }
 *
 * becomes:
 *
 * [
 *   { key: "pending", count: 5 },
 *   { key: "confirmed", count: 2 },
 *   { key: "approved", count: 3 }
 * ]
 */
const extractBreakdown = (
  report,
  possibleKeys = []
) => {
  if (
    !report ||
    typeof report !== "object"
  ) {
    return [];
  }

  let value = null;

  for (const key of possibleKeys) {
    if (
      report[key] !== undefined &&
      report[key] !== null
    ) {
      value = report[key];
      break;
    }
  }

  if (!value) {
    return [];
  }

  /*
  |----------------------------------------------------------------------
  | Array format
  |----------------------------------------------------------------------
  */

  if (Array.isArray(value)) {
    return value;
  }

  /*
  |----------------------------------------------------------------------
  | Object/map format
  |----------------------------------------------------------------------
  |
  | Backend currently returns:
  |
  | {
  |     pending: 5,
  |     confirmed: 2
  | }
  |
  */

  if (
    typeof value === "object"
  ) {
    return Object.entries(value).map(
      ([key, count]) => ({
        key,
        count: toNumber(count),
      })
    );
  }

  return [];
};

/**
 * Resolve booking customer name safely.
 */
const getCustomerName = (booking) => {
  const firstName =
    booking?.first_name ??
    booking?.customer?.first_name ??
    booking?.tenant?.user?.first_name ??
    booking?.user?.first_name ??
    "";

  const lastName =
    booking?.last_name ??
    booking?.customer?.last_name ??
    booking?.tenant?.user?.last_name ??
    booking?.user?.last_name ??
    "";

  const snapshotName =
    `${firstName} ${lastName}`.trim();

  const customerName =
    booking?.customer?.name ??
    booking?.tenant?.name ??
    booking?.user?.name ??
    booking?.customer_name ??
    snapshotName;

  return customerName || "Unknown";
};

/**
 * Safely resolve booking financial values.
 */
const getFinancialValue = (
  booking,
  financialKey,
  bookingKey
) => {
  const financials =
    booking?.financials ?? {};

  const financialValue =
    financials?.[financialKey];

  if (
    financialValue !== undefined &&
    financialValue !== null &&
    financialValue !== ""
  ) {
    return financialValue;
  }

  const bookingValue =
    booking?.[bookingKey];

  if (
    bookingValue !== undefined &&
    bookingValue !== null &&
    bookingValue !== ""
  ) {
    return bookingValue;
  }

  return 0;
};

/**
 * Get a readable booking date.
 */
const getBookingDate = (booking) => {
  return (
    booking?.booking_date ??
    booking?.start_date ??
    booking?.created_at ??
    null
  );
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function BookingReport() {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | Current Date
  |--------------------------------------------------------------------------
  */

  const today = useMemo(
    () =>
      new Date()
        .toISOString()
        .split("T")[0],
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  const [filters, setFilters] =
    useState({
      start_date: "",
      end_date: "",
      status: "",
      payment_status: "",
      booking_type: "",
      source: "",
    });

  /*
  |--------------------------------------------------------------------------
  | Report State
  |--------------------------------------------------------------------------
  */

  const [statistics, setStatistics] =
    useState({});

  const [report, setReport] =
    useState({});

  const [reportBookings, setReportBookings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Fetch Report
  |--------------------------------------------------------------------------
  */

  const fetchReport = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        /*
        |--------------------------------------------------------------------------
        | Build API parameters
        |--------------------------------------------------------------------------
        */

        const params = {
          ...filters,
        };

        Object.keys(params).forEach(
          (key) => {
            if (
              params[key] === "" ||
              params[key] === null ||
              params[key] === undefined
            ) {
              delete params[key];
            }
          }
        );

        /*
        |--------------------------------------------------------------------------
        | Request report, statistics and booking
        | records.
        |--------------------------------------------------------------------------
        |
        | The report endpoint returns:
        |
        | summary
        | status_breakdown
        | payment_breakdown
        | booking_type_breakdown
        | source_breakdown
        | date_range
        |
        | It does not currently return the booking
        | records themselves, so getAll() is used
        | for the records table.
        |--------------------------------------------------------------------------
        */

        const [
          statisticsResponse,
          reportResponse,
          bookingsResponse,
        ] = await Promise.all([
          bookingApi.statistics(params),
          bookingApi.reports(params),
          bookingApi.getAll({
            ...params,
            per_page: 100,
          }),
        ]);

        /*
        |--------------------------------------------------------------------------
        | Normalize statistics
        |--------------------------------------------------------------------------
        */

        const statisticsData =
          extractObject(
            statisticsResponse
          );

        /*
        |--------------------------------------------------------------------------
        | Normalize report
        |--------------------------------------------------------------------------
        */

        const reportData =
          extractObject(
            reportResponse
          );

        /*
        |--------------------------------------------------------------------------
        | Normalize booking records
        |--------------------------------------------------------------------------
        */

        const bookingsData =
          extractArray(
            bookingsResponse,
            [
              "bookings",
              "items",
              "results",
              "records",
            ]
          );

        setStatistics(
          statisticsData
        );

        setReport(
          reportData
        );

        setReportBookings(
          bookingsData
        );

        /*
        |--------------------------------------------------------------------------
        | Debug
        |--------------------------------------------------------------------------
        */

        console.log(
          "[BookingReport] Statistics:",
          statisticsData
        );

        console.log(
          "[BookingReport] Report:",
          reportData
        );

        console.log(
          "[BookingReport] Report bookings:",
          bookingsData
        );
      } catch (err) {
        console.error(
          "[BookingReport] Failed to load report:",
          err
        );

        const responseMessage =
          err?.response?.data?.message;

        const errorMessage =
          responseMessage ??
          err?.message ??
          "Unable to generate booking report.";

        setError(errorMessage);

        /*
        |--------------------------------------------------------------------------
        | Clear stale report records after
        | an unsuccessful request.
        |--------------------------------------------------------------------------
        */

        setReportBookings([]);

        if (!silent) {
          Swal.fire({
            icon: "error",
            title: "Report Error",
            text: errorMessage,
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters]
  );

  /*
  |--------------------------------------------------------------------------
  | Load Report When Filters Change
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  /*
  |--------------------------------------------------------------------------
  | Report Breakdown Data
  |--------------------------------------------------------------------------
  */

  const statusBreakdown =
    useMemo(
      () =>
        extractBreakdown(
          report,
          [
            "status_breakdown",
            "statuses",
            "by_status",
          ]
        ),
      [report]
    );

  const paymentBreakdown =
    useMemo(
      () =>
        extractBreakdown(
          report,
          [
            "payment_breakdown",
            "payment_status_breakdown",
            "payment_statuses",
            "by_payment_status",
          ]
        ),
      [report]
    );

  const bookingTypeBreakdown =
    useMemo(
      () =>
        extractBreakdown(
          report,
          [
            "booking_type_breakdown",
            "booking_types",
            "by_booking_type",
          ]
        ),
      [report]
    );

  const sourceBreakdown =
    useMemo(
      () =>
        extractBreakdown(
          report,
          [
            "source_breakdown",
            "sources",
            "by_source",
          ]
        ),
      [report]
    );

  /*
  |--------------------------------------------------------------------------
  | Report Summary
  |--------------------------------------------------------------------------
  */

  const summary =
    report?.summary ?? {};

  const dateRange =
    report?.date_range ?? {};

  /*
  |--------------------------------------------------------------------------
  | Print
  |--------------------------------------------------------------------------
  */

  const handlePrint = () => {
    window.print();
  };

  /*
  |--------------------------------------------------------------------------
  | Export CSV
  |--------------------------------------------------------------------------
  */

  const handleExportCsv = () => {
    if (
      reportBookings.length === 0
    ) {
      Swal.fire({
        icon: "info",
        title: "Nothing to export",
        text:
          "There are no booking records in the current report.",
      });

      return;
    }

    const headers = [
      "Booking ID",
      "Customer",
      "Status",
      "Payment Status",
      "Booking Type",
      "Source",
      "Booking Date",
      "Start Date",
      "End Date",
      "Total Amount",
      "Amount Paid",
      "Balance",
    ];

    const rows =
      reportBookings.map(
        (booking) => {
          const total =
            getFinancialValue(
              booking,
              "total_amount",
              "total_amount"
            );

          const paid =
            getFinancialValue(
              booking,
              "amount_paid",
              "amount_paid"
            );

          const balance =
            getFinancialValue(
              booking,
              "balance",
              "balance"
            );

          return [
            booking?.id ?? "",
            getCustomerName(
              booking
            ),
            booking?.status ?? "",
            booking?.payment_status ??
            "",
            booking?.booking_type ?? "",
            booking?.source ?? "",
            booking?.booking_date ?? "",
            booking?.start_date ?? "",
            booking?.end_date ?? "",
            total,
            paid,
            balance,
          ];
        }
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(
                value ?? ""
              ).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `booking-report-${today}.csv`;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(url);
  };

  /*
  |--------------------------------------------------------------------------
  | Filter Change
  |--------------------------------------------------------------------------
  */

  const updateFilter = (
    field,
    value
  ) => {
    setFilters(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Reset Filters
  |--------------------------------------------------------------------------
  */

  const handleResetFilters = () => {
    setFilters({
      start_date: "",
      end_date: "",
      status: "",
      payment_status: "",
      booking_type: "",
      source: "",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Breakdown Row
  |--------------------------------------------------------------------------
  */

  const renderBreakdownRows = (
    items,
    emptyMessage
  ) => {
    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return (
        <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map(
          (item, index) => {
            const label =
              item?.key ??
              item?.status ??
              item?.payment_status ??
              item?.booking_type ??
              item?.type ??
              item?.source ??
              item?.name ??
              item?.label ??
              `Item ${index + 1}`;

            const count =
              item?.count ??
              item?.total ??
              item?.bookings ??
              0;

            return (
              <div
                key={`${label}-${index}`}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-700">
                  {titleCase(label)}
                </span>

                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2.5 text-xs font-bold text-slate-900 shadow-sm">
                  {formatNumber(count)}
                </span>
              </div>
            );
          }
        )}
      </div>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 space-y-6">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between print:mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <BarChart3
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Booking Reports
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Analyze bookings, revenue and
                payment performance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row print:hidden">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/super-admin/bookings"
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Bookings
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/super-admin/bookings/calendar"
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <CalendarDays
              className="h-4 w-4"
              aria-hidden="true"
            />

            Calendar
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FileText
              className="h-4 w-4"
              aria-hidden="true"
            />

            Print
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={
              loading ||
              reportBookings.length === 0
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download
              className="h-4 w-4"
              aria-hidden="true"
            />

            Export CSV
          </button>
        </div>
      </div>

      {/* ================================================================
          ERROR
      ================================================================ */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 print:hidden">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Unable to load booking report
            </p>

            <p className="mt-0.5 text-sm text-red-700">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 text-red-500 transition hover:bg-red-100 hover:text-red-700"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              fetchReport()
            }
            className="shrink-0 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* ================================================================
          REPORT FILTERS
      ================================================================ */}

      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:hidden">
        <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">
              Report Filters
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Narrow the report by period, status,
              booking type and source.
            </p>
          </div>

          <button
            type="button"
            disabled={
              loading ||
              refreshing
            }
            onClick={() =>
              fetchReport({
                silent: true,
              })
            }
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing
                ? "animate-spin"
                : ""
                }`}
              aria-hidden="true"
            />

            Refresh
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {/* Start Date */}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Start Date
              </span>

              <input
                type="date"
                value={
                  filters.start_date
                }
                onChange={(event) =>
                  updateFilter(
                    "start_date",
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            {/* End Date */}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                End Date
              </span>

              <input
                type="date"
                value={
                  filters.end_date
                }
                onChange={(event) =>
                  updateFilter(
                    "end_date",
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            {/* Status */}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Booking Status
              </span>

              <select
                value={filters.status}
                onChange={(event) =>
                  updateFilter(
                    "status",
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">
                  All statuses
                </option>

                {STATUS_OPTIONS.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {titleCase(status)}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* Payment Status */}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Payment Status
              </span>

              <select
                value={
                  filters.payment_status
                }
                onChange={(event) =>
                  updateFilter(
                    "payment_status",
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">
                  All payments
                </option>

                {PAYMENT_STATUS_OPTIONS.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {titleCase(status)}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* Booking Type */}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Booking Type
              </span>

              <select
                value={
                  filters.booking_type
                }
                onChange={(event) =>
                  updateFilter(
                    "booking_type",
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">
                  All types
                </option>

                {BOOKING_TYPE_OPTIONS.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {titleCase(type)}
                    </option>
                  )
                )}
              </select>
            </label>

            {/* Source */}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Source
              </span>

              <select
                value={filters.source}
                onChange={(event) =>
                  updateFilter(
                    "source",
                    event.target.value
                  )
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">
                  All sources
                </option>

                {SOURCE_OPTIONS.map(
                  (source) => (
                    <option
                      key={source}
                      value={source}
                    >
                      {titleCase(source)}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={
                handleResetFilters
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />

              Reset
            </button>

            <button
              type="button"
              onClick={() =>
                fetchReport()
              }
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}

              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================
          LOADING
      ================================================================ */}

      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <Loader2
              className="h-5 w-5 animate-spin"
              aria-hidden="true"
            />

            Generating booking report...
          </div>
        </div>
      ) : (
        <>
          {/* ============================================================
              BOOKING STATISTICS
          ============================================================ */}

          <BookingStatistics
            statistics={
              statistics?.data ??
              statistics ??
              {}
            }
            loading={false}
          />

          {/* ============================================================
              REPORT SUMMARY
          ============================================================ */}

          <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Bookings
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatNumber(
                  summary.total_bookings ??
                  reportBookings.length
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Amount
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(
                  summary.total_amount
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Amount Paid
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {formatCurrency(
                  summary.amount_paid
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Outstanding Balance
              </p>

              <p className="mt-2 text-2xl font-bold text-amber-600">
                {formatCurrency(
                  summary.outstanding_balance ??
                  summary.balance
                )}
              </p>
            </div>
          </div>

          {/* ============================================================
              REPORT DATE RANGE
          ============================================================ */}

          {(dateRange.first_booking_date ||
            dateRange.last_booking_date) && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">
                      Report Period
                    </span>

                    <span className="ml-2 text-slate-500">
                      {dateRange.start_date ??
                        dateRange.first_booking_date ??
                        "All time"}
                      {" — "}
                      {dateRange.end_date ??
                        dateRange.last_booking_date ??
                        "Present"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400">
                    {dateRange.first_booking_date &&
                      dateRange.last_booking_date && (
                        <>
                          Bookings from{" "}
                          {dateRange.first_booking_date}{" "}
                          to{" "}
                          {dateRange.last_booking_date}
                        </>
                      )}
                  </div>
                </div>
              </div>
            )}

          {/* ============================================================
              REPORT BREAKDOWNS
          ============================================================ */}

          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Booking Status */}

            <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <h2 className="text-base font-bold text-slate-900">
                  Booking Status
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Detailed booking workflow
                  distribution.
                </p>
              </div>

              <div className="flex-1 p-4 sm:p-5">
                {renderBreakdownRows(
                  statusBreakdown,
                  "No detailed status breakdown was returned for this report."
                )}
              </div>
            </div>

            {/* Payment Status */}

            <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <h2 className="text-base font-bold text-slate-900">
                  Payment Status
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Booking payment completion
                  distribution.
                </p>
              </div>

              <div className="flex-1 p-4 sm:p-5">
                {renderBreakdownRows(
                  paymentBreakdown,
                  "No payment breakdown available."
                )}
              </div>
            </div>

            {/* Booking Types */}

            <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <h2 className="text-base font-bold text-slate-900">
                  Booking Types
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Distribution by booking type.
                </p>
              </div>

              <div className="flex-1 p-4 sm:p-5">
                {renderBreakdownRows(
                  bookingTypeBreakdown,
                  "No booking type breakdown available."
                )}
              </div>
            </div>

            {/* Booking Sources */}

            <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                <h2 className="text-base font-bold text-slate-900">
                  Booking Sources
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Where booking requests
                  originated.
                </p>
              </div>

              <div className="flex-1 p-4 sm:p-5">
                {renderBreakdownRows(
                  sourceBreakdown,
                  "No booking source breakdown available."
                )}
              </div>
            </div>
          </div>

          {/* ============================================================
              BOOKING RECORDS
          ============================================================ */}

          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900">
                  Booking Records
                </h2>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Records included in this
                  report.
                </p>
              </div>

              <span className="flex h-7 shrink-0 items-center justify-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-600">
                {formatNumber(
                  reportBookings.length
                )}{" "}
                record
                {reportBookings.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            {reportBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                        Booking
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                        Customer
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                        Status
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                        Payment
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                        Type
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                        Date
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                        Total
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                        Paid
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5">
                        Balance
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {reportBookings.map(
                      (booking, index) => {
                        const total =
                          getFinancialValue(
                            booking,
                            "total_amount",
                            "total_amount"
                          );

                        const paid =
                          getFinancialValue(
                            booking,
                            "amount_paid",
                            "amount_paid"
                          );

                        const balance =
                          getFinancialValue(
                            booking,
                            "balance",
                            "balance"
                          );

                        const customer =
                          getCustomerName(
                            booking
                          );

                        const bookingId =
                          booking?.id ??
                          booking?.booking_number ??
                          `booking-${index}`;

                        return (
                          <tr
                            key={bookingId}
                            className="transition hover:bg-slate-50"
                          >
                            {/* Booking */}

                            <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                              <button
                                type="button"
                                disabled={
                                  !booking?.id
                                }
                                onClick={() =>
                                  navigate(
                                    `/super-admin/bookings/${booking.id}`
                                  )
                                }
                                className="font-semibold text-slate-900 transition hover:text-slate-600 disabled:cursor-default"
                              >
                                #
                                {booking?.id ??
                                  "—"}
                              </button>

                              <div className="mt-1 text-xs text-slate-500">
                                {getBookingDate(
                                  booking
                                ) ?? "—"}
                              </div>
                            </td>

                            {/* Customer */}

                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700 sm:px-5">
                              {customer}
                            </td>

                            {/* Status */}

                            <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                {titleCase(
                                  booking?.status
                                )}
                              </span>
                            </td>

                            {/* Payment */}

                            <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${booking?.payment_status ===
                                  "paid"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : booking?.payment_status ===
                                    "failed"
                                    ? "bg-red-50 text-red-700"
                                    : booking?.payment_status ===
                                      "refunded"
                                      ? "bg-purple-50 text-purple-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                              >
                                {titleCase(
                                  booking?.payment_status
                                )}
                              </span>
                            </td>

                            {/* Type */}

                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 sm:px-5">
                              {titleCase(
                                booking?.booking_type
                              )}
                            </td>

                            {/* Date */}

                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 sm:px-5">
                              {booking?.booking_date ??
                                "—"}
                            </td>

                            {/* Total */}

                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold text-slate-900 sm:px-5">
                              {formatCurrency(
                                total
                              )}
                            </td>

                            {/* Paid */}

                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold text-emerald-600 sm:px-5">
                              {formatCurrency(
                                paid
                              )}
                            </td>

                            {/* Balance */}

                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold text-amber-600 sm:px-5">
                              {formatCurrency(
                                balance
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <FileText className="h-7 w-7" />
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-900">
                  No booking records
                </h3>

                <p className="mt-1 max-w-md text-sm text-slate-500">
                  No bookings matched the
                  selected report filters.
                </p>

                <button
                  type="button"
                  onClick={
                    handleResetFilters
                  }
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 print:hidden"
                >
                  <RotateCcw className="h-4 w-4" />

                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* ============================================================
              REPORT FOOTER
          ============================================================ */}

          <div className="flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              EstateKenya Booking Report
            </span>

            <span>
              Generated: {today}
            </span>
          </div>
        </>
      )}
    </div>
  );
}