import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Eye,
  Filter,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { useBooking } from "../../../hooks/useBooking";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const PAGE_SIZE = 10;

const PAYMENT_STATUSES = [
  {
    value: "",
    label: "All Payment Statuses",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "partial",
    label: "Partial",
  },
  {
    value: "paid",
    label: "Paid",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "refunded",
    label: "Refunded",
  },
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const safeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  return [];
};

const getId = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  if (typeof value === "object") {
    return String(
      value.id ??
      value.booking_id ??
      value.value ??
      ""
    );
  }

  return "";
};

const getCustomerName = (booking) => {
  const customer =
    booking?.customer ||
    booking?.customer_user ||
    booking?.user ||
    booking?.customerUser ||
    null;

  if (customer) {
    const fullName =
      customer.full_name ||
      customer.name ||
      [
        customer.first_name,
        customer.last_name,
      ]
        .filter(Boolean)
        .join(" ");

    if (fullName) {
      return fullName;
    }
  }

  const snapshotName = [
    booking?.first_name,
    booking?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    snapshotName ||
    booking?.customer_name ||
    "Unknown Customer"
  );
};

const getCustomerEmail = (booking) => {
  return (
    booking?.email ||
    booking?.customer?.email ||
    booking?.customer_user?.email ||
    booking?.user?.email ||
    ""
  );
};

const getCustomerPhone = (booking) => {
  return (
    booking?.phone ||
    booking?.customer?.phone ||
    booking?.customer_user?.phone ||
    booking?.user?.phone ||
    ""
  );
};

const getBookingReference = (booking) => {
  return (
    booking?.booking_number ||
    booking?.booking_code ||
    booking?.reference ||
    booking?.code ||
    `#${booking?.id ?? "N/A"}`
  );
};

const getPropertyName = (booking) => {
  return (
    booking?.property?.name ||
    booking?.property_name ||
    booking?.tenancy?.property?.name ||
    "—"
  );
};

const getApartmentName = (booking) => {
  return (
    booking?.apartment?.name ||
    booking?.apartment?.title ||
    booking?.apartment_name ||
    booking?.tenancy?.apartment?.name ||
    ""
  );
};

const getUnitName = (booking) => {
  return (
    booking?.unit?.name ||
    booking?.unit?.unit_number ||
    booking?.unit?.number ||
    booking?.unit_number ||
    booking?.tenancy?.unit?.unit_number ||
    ""
  );
};

const getAmount = (booking) => {
  const financials =
    booking?.financials ||
    booking?.finance ||
    {};

  return Number(
    financials.total_amount ??
    financials.total ??
    booking?.total_amount ??
    booking?.total ??
    0
  );
};

const getPaidAmount = (booking) => {
  const financials =
    booking?.financials ||
    booking?.finance ||
    {};

  return Number(
    financials.amount_paid ??
    financials.paid ??
    booking?.amount_paid ??
    booking?.paid ??
    0
  );
};

const getBalanceAmount = (booking) => {
  const financials =
    booking?.financials ||
    booking?.finance ||
    {};

  const explicitBalance =
    financials.balance ??
    booking?.balance;

  if (
    explicitBalance !== undefined &&
    explicitBalance !== null
  ) {
    return Number(explicitBalance);
  }

  return Math.max(
    getAmount(booking) -
    getPaidAmount(booking),
    0
  );
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getCancelledDate = (booking) => {
  return (
    booking?.cancelled_at ||
    booking?.cancellation_date ||
    booking?.updated_at ||
    booking?.booking_date
  );
};

const getCancellationReason = (booking) => {
  return (
    booking?.cancellation_reason ||
    booking?.cancel_reason ||
    booking?.reason ||
    booking?.notes ||
    ""
  );
};

const normalizePaymentStatus = (booking) => {
  return String(
    booking?.payment_status ||
    booking?.paymentStatus ||
    booking?.financials?.payment_status ||
    "pending"
  ).toLowerCase();
};

const getPagination = (response) => {
  const meta =
    response?.meta ||
    response?.pagination ||
    {};

  return {
    currentPage: Number(
      meta.current_page ??
      meta.currentPage ??
      response?.current_page ??
      1
    ),
    lastPage: Number(
      meta.last_page ??
      meta.lastPage ??
      response?.last_page ??
      1
    ),
    total: Number(
      meta.total ??
      response?.total ??
      0
    ),
    perPage: Number(
      meta.per_page ??
      meta.perPage ??
      response?.per_page ??
      PAGE_SIZE
    ),
  };
};

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

const PaymentStatusBadge = ({ status }) => {
  const normalized = String(
    status || "pending"
  ).toLowerCase();

  const styles = {
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    partial: "bg-amber-50 text-amber-700 ring-amber-200",
    pending: "bg-slate-50 text-slate-700 ring-slate-200",
    failed: "bg-red-50 text-red-700 ring-red-200",
    refunded: "bg-purple-50 text-purple-700 ring-purple-200",
  };

  const labels = {
    paid: "Paid",
    partial: "Partial",
    pending: "Pending",
    failed: "Failed",
    refunded: "Refunded",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full",
        "px-2.5 py-1 text-xs font-semibold",
        "ring-1 ring-inset",
        styles[normalized] ||
        "bg-slate-50 text-slate-700 ring-slate-200",
      ].join(" ")}
    >
      {labels[normalized] ||
        normalized.replace(/_/g, " ")}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| Statistics Card
|--------------------------------------------------------------------------
*/

const StatisticCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconClassName = "",
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 truncate text-2xl font-bold text-slate-900">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center",
            "justify-center rounded-xl bg-slate-100",
            iconClassName,
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

export default function CancelledBookings() {
  const navigate = useNavigate();

  const {
    bookings,
    loading,
    error,
    fetchBookings,
    fetchBookingStatistics,
  } = useBooking();

  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] =
    useState("");

  const [page, setPage] = useState(1);

  const [statistics, setStatistics] =
    useState(null);

  const [statisticsLoading, setStatisticsLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load Cancelled Bookings
  |--------------------------------------------------------------------------
  */

  const loadBookings = useCallback(
    async ({
      pageNumber = 1,
      showLoader = false,
    } = {}) => {
      if (showLoader) {
        setRefreshing(true);
      }

      try {
        await fetchBookings({
          page: pageNumber,
          per_page: PAGE_SIZE,
          status: "cancelled",
          search:
            search.trim() || undefined,
          payment_status:
            paymentStatus || undefined,
        });
      } catch (requestError) {
        console.error(
          "[CancelledBookings] Failed to load bookings:",
          requestError
        );
      } finally {
        if (showLoader) {
          setRefreshing(false);
        }
      }
    },
    [
      fetchBookings,
      search,
      paymentStatus,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Load Statistics
  |--------------------------------------------------------------------------
  */

  const loadStatistics = useCallback(
    async () => {
      setStatisticsLoading(true);

      try {
        const response =
          await fetchBookingStatistics({
            status: "cancelled",
          });

        setStatistics(
          response?.data ??
          response ??
          null
        );
      } catch (requestError) {
        console.error(
          "[CancelledBookings] Failed to load statistics:",
          requestError
        );
      } finally {
        setStatisticsLoading(false);
      }
    },
    [fetchBookingStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadBookings({
      pageNumber: 1,
    });

    loadStatistics();
  }, [loadBookings, loadStatistics]);

  /*
  |--------------------------------------------------------------------------
  | Search / Filter
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);

      loadBookings({
        pageNumber: 1,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [
    search,
    paymentStatus,
    loadBookings,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Normalize Bookings
  |--------------------------------------------------------------------------
  */

  const cancelledBookings = useMemo(() => {
    const source = safeArray(bookings);

    return source.filter((booking) => {
      const status = String(
        booking?.status || ""
      ).toLowerCase();

      return status === "cancelled";
    });
  }, [bookings]);

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const pagination = useMemo(() => {
    return getPagination(bookings);
  }, [bookings]);

  const currentPage =
    pagination.currentPage || page;

  const lastPage =
    Math.max(
      pagination.lastPage || 1,
      1
    );

  /*
  |--------------------------------------------------------------------------
  | Local Statistics
  |--------------------------------------------------------------------------
  */

  const localStatistics = useMemo(() => {
    const total = cancelledBookings.length;

    const totalAmount =
      cancelledBookings.reduce(
        (sum, booking) =>
          sum + getAmount(booking),
        0
      );

    const totalPaid =
      cancelledBookings.reduce(
        (sum, booking) =>
          sum + getPaidAmount(booking),
        0
      );

    const totalBalance =
      cancelledBookings.reduce(
        (sum, booking) =>
          sum + getBalanceAmount(booking),
        0
      );

    return {
      total,
      totalAmount,
      totalPaid,
      totalBalance,
    };
  }, [cancelledBookings]);

  /*
  |--------------------------------------------------------------------------
  | API Statistics
  |--------------------------------------------------------------------------
  */

  const statisticsData = useMemo(() => {
    const source =
      statistics?.statistics ||
      statistics?.summary ||
      statistics ||
      {};

    return {
      total:
        Number(
          source.cancelled ??
          source.total_cancelled ??
          source.total ??
          localStatistics.total
        ) || 0,

      totalAmount:
        Number(
          source.total_amount ??
          source.cancelled_amount ??
          source.total_booking_amount ??
          localStatistics.totalAmount
        ) || 0,

      totalPaid:
        Number(
          source.total_paid ??
          source.cancelled_paid ??
          localStatistics.totalPaid
        ) || 0,

      totalBalance:
        Number(
          source.total_balance ??
          source.cancelled_balance ??
          localStatistics.totalBalance
        ) || 0,
    };
  }, [
    statistics,
    localStatistics,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleView = useCallback(
    (booking) => {
      const bookingId = getId(booking);

      if (!bookingId) {
        Swal.fire({
          icon: "error",
          title: "Booking Not Found",
          text: "Unable to determine the booking ID.",
          confirmButtonColor: "#4f46e5",
        });

        return;
      }

      navigate(
        `/super-admin/bookings/${encodeURIComponent(
          bookingId
        )}`
      );
    },
    [navigate]
  );

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {
    await Promise.all([
      loadBookings({
        pageNumber: currentPage,
        showLoader: true,
      }),
      loadStatistics(),
    ]);
  };

  /*
  |--------------------------------------------------------------------------
  | Pagination Navigation
  |--------------------------------------------------------------------------
  */

  const handlePageChange = (nextPage) => {
    if (
      nextPage < 1 ||
      nextPage > lastPage ||
      nextPage === currentPage
    ) {
      return;
    }

    setPage(nextPage);

    loadBookings({
      pageNumber: nextPage,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  const errorMessage =
    typeof error === "string"
      ? error
      : error?.message ||
      "Unable to load cancelled bookings.";

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
                  <XCircle className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Cancelled Bookings
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Review and manage bookings
                    that have been cancelled.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/super-admin/bookings"
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
                All Bookings
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={
                  refreshing ||
                  loading ||
                  statisticsLoading
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={[
                    "h-4 w-4",
                    refreshing
                      ? "animate-spin"
                      : "",
                  ].join(" ")}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatisticCard
            title="Cancelled Bookings"
            value={
              statisticsLoading
                ? "..."
                : statisticsData.total
            }
            description="Total cancelled bookings"
            icon={XCircle}
            iconClassName="text-red-600"
          />

          <StatisticCard
            title="Total Booking Value"
            value={
              statisticsLoading
                ? "..."
                : formatCurrency(
                  statisticsData.totalAmount
                )
            }
            description="Value of cancelled bookings"
            icon={CircleDollarSign}
            iconClassName="text-indigo-600"
          />

          <StatisticCard
            title="Amount Paid"
            value={
              statisticsLoading
                ? "..."
                : formatCurrency(
                  statisticsData.totalPaid
                )
            }
            description="Payments received"
            icon={CheckCircle2}
            iconClassName="text-emerald-600"
          />

          <StatisticCard
            title="Outstanding Balance"
            value={
              statisticsLoading
                ? "..."
                : formatCurrency(
                  statisticsData.totalBalance
                )
            }
            description="Remaining balance"
            icon={CircleDollarSign}
            iconClassName="text-amber-600"
          />
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />

            <h2 className="text-sm font-semibold text-slate-900">
              Search & Filters
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search booking, customer, property, unit..."
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Payment Status */}
            <select
              value={paymentStatus}
              onChange={(event) =>
                setPaymentStatus(
                  event.target.value
                )
              }
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {PAYMENT_STATUSES.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div className="min-w-0">
                <p className="font-semibold text-red-800">
                  Unable to load bookings
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {errorMessage}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadBookings({
                      pageNumber:
                        currentPage,
                    })
                  }
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table Card */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Cancelled Booking Records
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Showing cancelled bookings
                from the system.
              </p>
            </div>

            <div className="text-sm text-slate-500">
              {pagination.total || 0} record
              {pagination.total === 1
                ? ""
                : "s"}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />

                <p className="mt-3 text-sm font-medium text-slate-600">
                  Loading cancelled
                  bookings...
                </p>
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading &&
            !error &&
            cancelledBookings.length ===
            0 && (
              <div className="flex min-h-[320px] items-center justify-center px-6">
                <div className="max-w-md text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                    <XCircle className="h-7 w-7 text-slate-400" />
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    No cancelled bookings
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    There are currently no
                    cancelled bookings
                    matching your search
                    and filter criteria.
                  </p>

                  {(search ||
                    paymentStatus) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch(
                            ""
                          );
                          setPaymentStatus(
                            ""
                          );
                        }}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        Clear Filters
                      </button>
                    )}
                </div>
              </div>
            )}

          {/* Desktop Table */}
          {!loading &&
            cancelledBookings.length >
            0 && (
              <div className="overflow-x-auto">
                <table className="min-w-[1250px] w-full">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Booking
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Customer
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Property / Unit
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Cancelled
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Total
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Paid
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Balance
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Payment
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {cancelledBookings.map(
                      (booking) => {
                        const id =
                          getId(
                            booking
                          );

                        const customerName =
                          getCustomerName(
                            booking
                          );

                        const customerEmail =
                          getCustomerEmail(
                            booking
                          );

                        const customerPhone =
                          getCustomerPhone(
                            booking
                          );

                        const property =
                          getPropertyName(
                            booking
                          );

                        const apartment =
                          getApartmentName(
                            booking
                          );

                        const unit =
                          getUnitName(
                            booking
                          );

                        const payment =
                          normalizePaymentStatus(
                            booking
                          );

                        const reason =
                          getCancellationReason(
                            booking
                          );

                        return (
                          <tr
                            key={
                              id ||
                              `cancelled-${Math.random()}`
                            }
                            className="transition hover:bg-slate-50"
                          >
                            {/* Booking */}
                            <td className="px-5 py-4 align-top">
                              <div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleView(
                                      booking
                                    )
                                  }
                                  className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                                >
                                  {getBookingReference(
                                    booking
                                  )}
                                </button>

                                <div className="mt-1 text-xs text-slate-500">
                                  Booking
                                  date:{" "}
                                  {formatDate(
                                    booking?.booking_date
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Customer */}
                            <td className="px-5 py-4 align-top">
                              <div className="flex min-w-[220px] items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                                  <UserRound className="h-4 w-4" />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900">
                                    {
                                      customerName
                                    }
                                  </p>

                                  {customerEmail && (
                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                      <Mail className="h-3.5 w-3.5 shrink-0" />

                                      <span className="truncate">
                                        {
                                          customerEmail
                                        }
                                      </span>
                                    </div>
                                  )}

                                  {customerPhone && (
                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                      <Phone className="h-3.5 w-3.5 shrink-0" />

                                      <span>
                                        {
                                          customerPhone
                                        }
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Property */}
                            <td className="px-5 py-4 align-top">
                              <div className="min-w-[190px]">
                                <p className="font-medium text-slate-900">
                                  {
                                    property
                                  }
                                </p>

                                {apartment && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    Apartment:{" "}
                                    {
                                      apartment
                                    }
                                  </p>
                                )}

                                {unit && (
                                  <p className="mt-1 text-xs font-medium text-slate-600">
                                    Unit:{" "}
                                    {
                                      unit
                                    }
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Cancelled */}
                            <td className="px-5 py-4 align-top">
                              <div className="min-w-[160px]">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                  <CalendarDays className="h-4 w-4 text-red-500" />

                                  {formatDateTime(
                                    getCancelledDate(
                                      booking
                                    )
                                  )}
                                </div>

                                {reason && (
                                  <p
                                    className="mt-2 max-w-[220px] truncate text-xs text-slate-500"
                                    title={
                                      reason
                                    }
                                  >
                                    Reason:{" "}
                                    {
                                      reason
                                    }
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Total */}
                            <td className="px-5 py-4 text-right align-top">
                              <span className="whitespace-nowrap font-semibold text-slate-900">
                                {formatCurrency(
                                  getAmount(
                                    booking
                                  )
                                )}
                              </span>
                            </td>

                            {/* Paid */}
                            <td className="px-5 py-4 text-right align-top">
                              <span className="whitespace-nowrap font-semibold text-emerald-600">
                                {formatCurrency(
                                  getPaidAmount(
                                    booking
                                  )
                                )}
                              </span>
                            </td>

                            {/* Balance */}
                            <td className="px-5 py-4 text-right align-top">
                              <span className="whitespace-nowrap font-semibold text-amber-600">
                                {formatCurrency(
                                  getBalanceAmount(
                                    booking
                                  )
                                )}
                              </span>
                            </td>

                            {/* Payment */}
                            <td className="px-5 py-4 align-top">
                              <PaymentStatusBadge
                                status={
                                  payment
                                }
                              />
                            </td>

                            {/* Action */}
                            <td className="px-5 py-4 text-right align-top">
                              <button
                                type="button"
                                onClick={() =>
                                  handleView(
                                    booking
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}

          {/* Pagination */}
          {!loading &&
            cancelledBookings.length >
            0 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-slate-700">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {lastPage}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handlePageChange(
                        currentPage -
                        1
                      )
                    }
                    disabled={
                      currentPage <=
                      1
                    }
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="hidden items-center gap-1 sm:flex">
                    {Array.from(
                      {
                        length: Math.min(
                          lastPage,
                          5
                        ),
                      },
                      (
                        _,
                        index
                      ) => {
                        let pageNumber =
                          index +
                          1;

                        if (
                          lastPage >
                          5 &&
                          currentPage >
                          3
                        ) {
                          pageNumber =
                            currentPage -
                            2 +
                            index;
                        }

                        if (
                          pageNumber >
                          lastPage
                        ) {
                          pageNumber =
                            lastPage -
                            4 +
                            index;
                        }

                        return (
                          <button
                            key={
                              pageNumber
                            }
                            type="button"
                            onClick={() =>
                              handlePageChange(
                                pageNumber
                              )
                            }
                            className={[
                              "h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition",
                              pageNumber ===
                                currentPage
                                ? "bg-indigo-600 text-white"
                                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                            ].join(
                              " "
                            )}
                          >
                            {
                              pageNumber
                            }
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handlePageChange(
                        currentPage +
                        1
                      )
                    }
                    disabled={
                      currentPage >=
                      lastPage
                    }
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );

}