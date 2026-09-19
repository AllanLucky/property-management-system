import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileEdit,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Wallet,
  X,
} from "lucide-react";

import { useBooking } from "../../../hooks/useBooking";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
  { value: "expired", label: "Expired" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All payments" },
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const BOOKING_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "viewing", label: "Viewing" },
  { value: "reservation", label: "Reservation" },
  { value: "rental", label: "Rental" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "All sources" },
  { value: "website", label: "Website" },
  { value: "agent", label: "Agent" },
  { value: "phone", label: "Phone" },
  { value: "referral", label: "Referral" },
  { value: "walk_in", label: "Walk-in" },
  { value: "offline", label: "Offline" },
];

const STATUS_STYLES = {
  pending:
    "bg-amber-50 text-amber-700 ring-amber-600/20",
  confirmed:
    "bg-blue-50 text-blue-700 ring-blue-600/20",
  approved:
    "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  rejected:
    "bg-red-50 text-red-700 ring-red-600/20",
  cancelled:
    "bg-slate-100 text-slate-600 ring-slate-500/20",
  completed:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  expired:
    "bg-orange-50 text-orange-700 ring-orange-600/20",
};

const PAYMENT_STYLES = {
  pending:
    "bg-amber-50 text-amber-700 ring-amber-600/20",
  partial:
    "bg-blue-50 text-blue-700 ring-blue-600/20",
  paid:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  failed:
    "bg-red-50 text-red-700 ring-red-600/20",
  refunded:
    "bg-purple-50 text-purple-700 ring-purple-600/20",
};

/*
|--------------------------------------------------------------------------
| FORMATTERS
|--------------------------------------------------------------------------
*/

const formatCurrency = (value) => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "KES 0";
  }

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

const formatLabel = (value) => {
  if (!value) {
    return "—";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

/*
|--------------------------------------------------------------------------
| DATA HELPERS
|--------------------------------------------------------------------------
*/

const getNumericValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return 0;
};

const getArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  return [];
};

const getCustomerName = (booking) => {
  const customer =
    booking?.customer ||
    booking?.customer_user ||
    booking?.user;

  const directName =
    customer?.name ||
    customer?.full_name ||
    customer?.fullName;

  if (directName) {
    return directName;
  }

  const composedName = [
    customer?.first_name,
    customer?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  if (composedName) {
    return composedName;
  }

  return `Customer #${booking?.customer_id ??
    booking?.user_id ??
    "—"
    }`;
};

const getCustomerEmail = (booking) => {
  return (
    booking?.customer?.email ||
    booking?.customer_user?.email ||
    booking?.user?.email ||
    ""
  );
};

const getTenantName = (booking) => {
  const tenantUser = booking?.tenant?.user;

  return (
    tenantUser?.name ||
    tenantUser?.full_name ||
    [
      tenantUser?.first_name,
      tenantUser?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    booking?.tenant?.name ||
    booking?.tenant?.full_name ||
    (booking?.tenant_id
      ? `Tenant #${booking.tenant_id}`
      : "Not assigned")
  );
};

const getPropertyName = (booking) => {
  return (
    booking?.property?.name ||
    booking?.property?.title ||
    booking?.property?.slug ||
    (booking?.property_id
      ? `Property #${booking.property_id}`
      : "Property not assigned")
  );
};

const getApartmentName = (booking) => {
  return (
    booking?.apartment?.name ||
    booking?.apartment?.title ||
    booking?.apartment?.slug ||
    (booking?.apartment_id
      ? `Apartment #${booking.apartment_id}`
      : "—")
  );
};

const getUnitName = (booking) => {
  return (
    booking?.unit?.unit_number ||
    booking?.unit?.name ||
    booking?.unit?.code ||
    (booking?.unit_id
      ? `Unit #${booking.unit_id}`
      : "—")
  );
};

const getTotalAmount = (booking) => {
  return getNumericValue(
    booking?.financials?.total,
    booking?.total,
    booking?.total_amount
  );
};

const getPaidAmount = (booking) => {
  return getNumericValue(
    booking?.financials?.paid,
    booking?.paid,
    booking?.paid_amount
  );
};

const getBalanceAmount = (booking) => {
  const explicitBalance =
    booking?.financials?.balance ??
    booking?.balance ??
    booking?.balance_amount;

  if (
    explicitBalance !== undefined &&
    explicitBalance !== null &&
    explicitBalance !== ""
  ) {
    return Math.max(
      getNumericValue(explicitBalance),
      0
    );
  }

  return Math.max(
    getTotalAmount(booking) -
    getPaidAmount(booking),
    0
  );
};

const getBookingPeriod = (booking) => {
  const start =
    booking?.start_date ||
    booking?.check_in_date;

  const end =
    booking?.end_date ||
    booking?.check_out_date;

  if (!start && !end) {
    return "—";
  }

  if (start && end) {
    return `${formatDate(start)} – ${formatDate(
      end
    )}`;
  }

  return formatDate(start || end);
};

/*
|--------------------------------------------------------------------------
| STATUS BADGES
|--------------------------------------------------------------------------
*/

const BookingStatusBadge = ({ status }) => {
  const normalized = String(
    status || "pending"
  ).toLowerCase();

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${STATUS_STYLES[normalized] ||
        "bg-slate-100 text-slate-600 ring-slate-500/20"
        }`}
    >
      <span className="truncate">
        {formatLabel(normalized)}
      </span>
    </span>
  );
};

const BookingPaymentBadge = ({ status }) => {
  const normalized = String(
    status || "pending"
  ).toLowerCase();

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${PAYMENT_STYLES[normalized] ||
        "bg-slate-100 text-slate-600 ring-slate-500/20"
        }`}
    >
      <span className="truncate">
        {formatLabel(normalized)}
      </span>
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  loading,
  iconClassName = "bg-slate-100 text-slate-700",
  valueClassName = "text-slate-900",
}) => {
  return (
    <div
      className="
        group
        flex
        min-w-0
        min-h-[132px]
        flex-col
        justify-between
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-4
        shadow-sm
        transition
        duration-200
        hover:-translate-y-0.5
        hover:border-slate-300
        hover:shadow-md
        sm:p-5
      "
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm sm:normal-case sm:tracking-normal">
            {title}
          </p>

          {loading ? (
            <div className="mt-3 h-8 w-24 max-w-full animate-pulse rounded-lg bg-slate-200" />
          ) : (
            <p
              className={`
                mt-2
                min-w-0
                max-w-full
                break-words
                text-xl
                font-bold
                leading-tight
                tracking-tight
                sm:text-2xl
                ${valueClassName}
              `}
              title={String(value ?? "")}
            >
              {value}
            </p>
          )}
        </div>

        <div
          className={`
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            transition
            group-hover:scale-105
            ${iconClassName}
          `}
        >
          <Icon
            className="h-5 w-5"
            aria-hidden="true"
          />
        </div>
      </div>

      {description && (
        <p className="mt-3 truncate text-xs text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| MAIN COMPONENT
|--------------------------------------------------------------------------
*/

const BookingList = () => {
  const navigate = useNavigate();

  const {
    bookings,
    pagination,
    filters,
    loading,
    error,
    statistics,

    getBookings,
    search,
    getStatistics,

    setFilters,
    clearFilters,
    setPage,
    setPerPage,
    clearError,
  } = useBooking();

  /*
  |--------------------------------------------------------------------------
  | LOCAL UI STATE
  |--------------------------------------------------------------------------
  */

  const [searchValue, setSearchValue] = useState(
    filters?.search || ""
  );

  const [showFilters, setShowFilters] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | NORMALIZED DATA
  |--------------------------------------------------------------------------
  */

  const bookingList = useMemo(
    () => getArray(bookings),
    [bookings]
  );

  const safeFilters = filters || {};

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const currentPage =
    Number(
      pagination?.current_page ??
      pagination?.currentPage ??
      pagination?.page ??
      1
    ) || 1;

  const lastPage =
    Number(
      pagination?.last_page ??
      pagination?.lastPage ??
      1
    ) || 1;

  const perPage =
    Number(
      pagination?.per_page ??
      pagination?.perPage ??
      DEFAULT_PER_PAGE
    ) || DEFAULT_PER_PAGE;

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const statisticData = useMemo(() => {
    const stats = statistics || {};

    const total = getNumericValue(
      stats?.total,
      stats?.total_bookings,
      stats?.bookings_count,
      pagination?.total,
      bookingList.length
    );

    const pending = getNumericValue(
      stats?.pending,
      stats?.pending_bookings
    );

    const confirmed = getNumericValue(
      stats?.confirmed,
      stats?.confirmed_bookings
    );

    const completed = getNumericValue(
      stats?.completed,
      stats?.completed_bookings
    );

    const cancelled = getNumericValue(
      stats?.cancelled,
      stats?.cancelled_bookings
    );

    const paid = getNumericValue(
      stats?.paid,
      stats?.paid_bookings,
      stats?.fully_paid,
      stats?.payment_paid
    );

    const revenue = getNumericValue(
      stats?.revenue,
      stats?.total_revenue,
      stats?.total_booking_value,
      stats?.booking_value,
      stats?.total_amount,
      stats?.paid_amount,
      stats?.total_paid,
      stats?.amount_paid
    );

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      paid,
      revenue,
    };
  }, [
    statistics,
    pagination?.total,
    bookingList.length,
  ]);

  /*
  |--------------------------------------------------------------------------
  | TOTAL / RANGE
  |--------------------------------------------------------------------------
  */

  const total =
    Number(
      pagination?.total ??
      statisticData.total ??
      bookingList.length
    ) || 0;

  const from =
    Number(
      pagination?.from ??
      (total > 0
        ? (currentPage - 1) * perPage + 1
        : 0)
    ) || 0;

  const to =
    Number(
      pagination?.to ??
      Math.min(
        currentPage * perPage,
        total
      )
    ) || 0;

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const load = async () => {
      try {
        await getBookings({
          ...safeFilters,
          page: 1,
          per_page: perPage,
        });

        await getStatistics?.(safeFilters);
      } catch {
        // Hook/service handles the error.
      }
    };

    load();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const handleSearch = async (event) => {
    event?.preventDefault?.();

    const value = searchValue.trim();

    const nextFilters = {
      ...safeFilters,
      search: value,
    };

    setFilters({
      search: value,
    });

    try {
      if (value) {
        await search({
          ...nextFilters,
          search: value,
          page: 1,
          per_page: perPage,
        });
      } else {
        await getBookings({
          ...nextFilters,
          page: 1,
          per_page: perPage,
        });
      }

      await getStatistics?.(nextFilters);
    } catch {
      // Hook handles the error.
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER CHANGE
  |--------------------------------------------------------------------------
  */

  const handleFilterChange = async (
    name,
    value
  ) => {
    const nextFilters = {
      ...safeFilters,
      [name]: value,
    };

    setFilters({
      [name]: value,
    });

    try {
      await getBookings({
        ...nextFilters,
        page: 1,
        per_page: perPage,
      });

      await getStatistics?.(nextFilters);
    } catch {
      // Hook handles the error.
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CLEAR FILTERS
  |--------------------------------------------------------------------------
  */

  const handleClearFilters = async () => {
    setSearchValue("");

    clearFilters();

    try {
      await getBookings({
        page: 1,
        per_page: perPage,
      });

      await getStatistics?.({});
    } catch {
      // Hook handles the error.
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await getBookings({
        ...safeFilters,
        page: currentPage,
        per_page: perPage,
      });

      await getStatistics?.(safeFilters);
    } finally {
      setRefreshing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const handlePageChange = async (page) => {
    if (
      page < 1 ||
      page > lastPage ||
      page === currentPage
    ) {
      return;
    }

    setPage(page);

    try {
      await getBookings({
        ...safeFilters,
        page,
        per_page: perPage,
      });
    } catch {
      // Hook handles the error.
    }
  };

  const handlePerPageChange = async (event) => {
    const value =
      Number(event.target.value) ||
      DEFAULT_PER_PAGE;

    setPerPage(value);

    try {
      await getBookings({
        ...safeFilters,
        page: 1,
        per_page: value,
      });
    } catch {
      // Hook handles the error.
    }
  };

  /*
  |--------------------------------------------------------------------------
  | PAGINATION RANGE
  |--------------------------------------------------------------------------
  */

  const pageNumbers = useMemo(() => {
    if (lastPage <= 1) {
      return [1];
    }

    const pages = [];

    const start = Math.max(
      1,
      currentPage - 2
    );

    const end = Math.min(
      lastPage,
      currentPage + 2
    );

    if (start > 1) {
      pages.push(1);

      if (start > 2) {
        pages.push("...");
      }
    }

    for (
      let page = start;
      page <= end;
      page += 1
    ) {
      pages.push(page);
    }

    if (end < lastPage) {
      if (end < lastPage - 1) {
        pages.push("...");
      }

      pages.push(lastPage);
    }

    return pages;
  }, [currentPage, lastPage]);

  /*
  |--------------------------------------------------------------------------
  | ACTIVE FILTER COUNT
  |--------------------------------------------------------------------------
  */

  const activeFilterCount = useMemo(() => {
    return [
      safeFilters.status,
      safeFilters.payment_status,
      safeFilters.booking_type,
      safeFilters.source,
      safeFilters.property_id,
      safeFilters.apartment_id,
      safeFilters.unit_id,
    ].filter(Boolean).length;
  }, [
    safeFilters.status,
    safeFilters.payment_status,
    safeFilters.booking_type,
    safeFilters.source,
    safeFilters.property_id,
    safeFilters.apartment_id,
    safeFilters.unit_id,
  ]);

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  const errorMessage =
    typeof error === "string"
      ? error
      : error?.message ||
      error?.error ||
      "Unable to load bookings.";

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full min-w-0 space-y-6 overflow-x-hidden p-4 sm:p-6 lg:p-8">
      {/* PAGE HEADER */}

      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Super Admin</span>
            <span>/</span>
            <span className="text-slate-700">
              Bookings
            </span>
          </div>

          <div className="mt-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Booking Management
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Manage property bookings, reservations,
              viewings, payments and booking workflows.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Refresh
          </button>

          <Link
            to="/super-admin/bookings/create"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New Booking
          </Link>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Unable to load bookings
            </p>

            <p className="mt-1 break-words text-sm text-red-600">
              {errorMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={clearError}
            className="shrink-0 rounded-lg p-1 text-red-500 transition hover:bg-red-100"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* STATISTICS */}

      <section className="min-w-0">
        <div
          className="
            grid
            min-w-0
            grid-cols-1
            gap-4
            sm:grid-cols-2
            lg:grid-cols-3
            2xl:grid-cols-6
          "
        >
          {/* 1. TOTAL */}

          <StatCard
            title="Total Bookings"
            value={statisticData.total}
            icon={CalendarDays}
            description="All booking records"
            loading={loading}
            iconClassName="bg-slate-100 text-slate-700"
            valueClassName="text-slate-900"
          />

          {/* 2. PENDING */}

          <StatCard
            title="Pending"
            value={statisticData.pending}
            icon={Clock3}
            description="Awaiting action"
            loading={loading}
            iconClassName="bg-amber-50 text-amber-600"
            valueClassName="text-amber-700"
          />

          {/* 3. CONFIRMED */}

          <StatCard
            title="Confirmed"
            value={statisticData.confirmed}
            icon={CheckCircle2}
            description="Confirmed bookings"
            loading={loading}
            iconClassName="bg-blue-50 text-blue-600"
            valueClassName="text-blue-700"
          />

          {/* 4. COMPLETED */}

          <StatCard
            title="Completed"
            value={statisticData.completed}
            icon={CheckCircle2}
            description="Successfully completed"
            loading={loading}
            iconClassName="bg-emerald-50 text-emerald-600"
            valueClassName="text-emerald-700"
          />

          {/* 5. REVENUE */}

          <StatCard
            title="Revenue"
            value={formatCurrency(
              statisticData.revenue
            )}
            icon={Wallet}
            description="Recorded booking revenue"
            loading={loading}
            iconClassName="bg-indigo-50 text-indigo-600"
            valueClassName="text-indigo-700"
          />

          {/* 6. PAID */}

          <StatCard
            title="Paid"
            value={statisticData.paid}
            icon={Wallet}
            description="Fully paid bookings"
            loading={loading}
            iconClassName="bg-emerald-50 text-emerald-600"
            valueClassName="text-emerald-700"
          />
        </div>
      </section>

      {/* SEARCH & FILTER BAR */}

      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
          <form
            onSubmit={handleSearch}
            className="min-w-0 flex-1"
          >
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(
                    event.target.value
                  )
                }
                placeholder="Search booking number, customer, tenant..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-24 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />

              {searchValue && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchValue("")
                  }
                  className="absolute right-20 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  (value) => !value
                )
              }
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${showFilters ||
                activeFilterCount > 0
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
            >
              <Filter className="h-4 w-4" />

              Filters

              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-slate-900">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {(activeFilterCount > 0 ||
              searchValue) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear
                </button>
              )}
          </div>
        </div>

        {/* FILTERS */}

        {showFilters && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="booking-status"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Status
                </label>

                <select
                  id="booking-status"
                  value={safeFilters.status || ""}
                  onChange={(event) =>
                    handleFilterChange(
                      "status",
                      event.target.value
                    )
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  {STATUS_OPTIONS.map(
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

              <div>
                <label
                  htmlFor="booking-payment-status"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Payment
                </label>

                <select
                  id="booking-payment-status"
                  value={
                    safeFilters.payment_status ||
                    ""
                  }
                  onChange={(event) =>
                    handleFilterChange(
                      "payment_status",
                      event.target.value
                    )
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  {PAYMENT_STATUS_OPTIONS.map(
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

              <div>
                <label
                  htmlFor="booking-type"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Booking Type
                </label>

                <select
                  id="booking-type"
                  value={
                    safeFilters.booking_type || ""
                  }
                  onChange={(event) =>
                    handleFilterChange(
                      "booking_type",
                      event.target.value
                    )
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  {BOOKING_TYPE_OPTIONS.map(
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

              <div>
                <label
                  htmlFor="booking-source"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Source
                </label>

                <select
                  id="booking-source"
                  value={safeFilters.source || ""}
                  onChange={(event) =>
                    handleFilterChange(
                      "source",
                      event.target.value
                    )
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  {SOURCE_OPTIONS.map(
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
          </div>
        )}
      </div>

      {/* TABLE */}

      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">
              Bookings
            </h2>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {total > 0
                ? `Showing ${from}–${to} of ${total} bookings`
                : "No bookings found"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <label
              htmlFor="booking-per-page"
              className="text-xs font-medium text-slate-500"
            >
              Per page
            </label>

            <select
              id="booking-per-page"
              value={perPage}
              onChange={handlePerPageChange}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        {/* LOADING */}

        {loading && bookingList.length === 0 ? (
          <div className="p-4 sm:p-6">
            <div className="space-y-3">
              {Array.from({
                length: 6,
              }).map((_, index) => (
                <div
                  key={index}
                  className="grid animate-pulse grid-cols-1 gap-4 rounded-xl border border-slate-100 p-4 md:grid-cols-5"
                >
                  <div className="h-4 rounded bg-slate-200" />
                  <div className="h-4 rounded bg-slate-200" />
                  <div className="h-4 rounded bg-slate-200" />
                  <div className="h-4 rounded bg-slate-200" />
                  <div className="h-4 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        ) : bookingList.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <CalendarDays className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              No bookings found
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              There are no bookings matching
              your current search or filters.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              {(activeFilterCount > 0 ||
                searchValue) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Clear Filters
                  </button>
                )}

              <Link
                to="/super-admin/bookings/create"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Create Booking
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1450px] w-full text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  {[
                    "Booking",
                    "Customer",
                    "Tenant",
                    "Property",
                    "Apartment / Unit",
                    "Type",
                    "Booking Date",
                    "Period",
                    "Total",
                    "Paid",
                    "Balance",
                    "Status",
                    "Payment",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}

                  <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {bookingList.map((booking) => {
                  const bookingId =
                    booking?.id ??
                    booking?.booking_id;

                  const bookingNumber =
                    booking?.booking_number ||
                    booking?.reference ||
                    `BK-${bookingId ?? "—"}`;

                  const customerName =
                    getCustomerName(booking);

                  const customerEmail =
                    getCustomerEmail(booking);

                  const tenantName =
                    getTenantName(booking);

                  const propertyName =
                    getPropertyName(booking);

                  const apartmentName =
                    getApartmentName(booking);

                  const unitName =
                    getUnitName(booking);

                  const totalAmount =
                    getTotalAmount(booking);

                  const paidAmount =
                    getPaidAmount(booking);

                  const balanceAmount =
                    getBalanceAmount(booking);

                  return (
                    <tr
                      key={
                        bookingId ||
                        bookingNumber
                      }
                      className="group transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4 align-top">
                        <div>
                          <Link
                            to={`/super-admin/bookings/${bookingId}`}
                            className="font-semibold text-slate-900 transition hover:text-slate-600"
                          >
                            {bookingNumber}
                          </Link>

                          {booking?.reference && (
                            <p className="mt-1 text-xs text-slate-400">
                              Ref:{" "}
                              {booking.reference}
                            </p>
                          )}

                          {booking?.source && (
                            <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium capitalize text-slate-500">
                              {formatLabel(
                                booking.source
                              )}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="min-w-[180px]">
                          <p className="font-semibold text-slate-800">
                            {customerName}
                          </p>

                          {customerEmail && (
                            <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                              {customerEmail}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="min-w-[150px]">
                          <p
                            className={`font-medium ${booking?.tenant_id
                              ? "text-slate-700"
                              : "text-slate-400"
                              }`}
                          >
                            {tenantName}
                          </p>

                          {booking?.tenant
                            ?.tenant_number && (
                              <p className="mt-1 text-xs text-slate-400">
                                {
                                  booking.tenant
                                    .tenant_number
                                }
                              </p>
                            )}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="min-w-[180px]">
                          <p className="font-medium text-slate-800">
                            {propertyName}
                          </p>

                          {booking?.property
                            ?.code && (
                              <p className="mt-1 text-xs text-slate-400">
                                {
                                  booking.property
                                    .code
                                }
                              </p>
                            )}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="min-w-[160px]">
                          <p className="font-medium text-slate-700">
                            {apartmentName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Unit: {unitName}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                          {formatLabel(
                            booking?.booking_type
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="min-w-[120px]">
                          <p className="text-sm font-medium text-slate-700">
                            {formatDate(
                              booking?.booking_date
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatDateTime(
                              booking?.booking_date
                            )}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="min-w-[160px]">
                          <p className="text-sm font-medium text-slate-700">
                            {getBookingPeriod(
                              booking
                            )}
                          </p>

                          {booking?.check_in_date && (
                            <p className="mt-1 text-xs text-slate-400">
                              Check-in:{" "}
                              {formatDate(
                                booking.check_in_date
                              )}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="whitespace-nowrap text-sm font-bold text-slate-800">
                          {formatCurrency(
                            totalAmount
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="whitespace-nowrap text-sm font-semibold text-emerald-600">
                          {formatCurrency(
                            paidAmount
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p
                          className={`whitespace-nowrap text-sm font-semibold ${balanceAmount > 0
                            ? "text-amber-600"
                            : "text-slate-500"
                            }`}
                        >
                          {formatCurrency(
                            balanceAmount
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <BookingStatusBadge
                          status={
                            booking?.status
                          }
                        />
                      </td>

                      <td className="px-5 py-4 align-top">
                        <BookingPaymentBadge
                          status={
                            booking?.payment_status
                          }
                        />
                      </td>

                      <td className="px-5 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="View booking"
                            onClick={() =>
                              navigate(
                                `/super-admin/bookings/${bookingId}`
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            title="Edit booking"
                            onClick={() =>
                              navigate(
                                `/super-admin/bookings/${bookingId}/edit`
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            <FileEdit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}

        {bookingList.length > 0 && (
          <div className="flex min-w-0 flex-col gap-4 border-t border-slate-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {from}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700">
                {to}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {total}
              </span>{" "}
              bookings
            </p>

            <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                disabled={
                  currentPage <= 1 ||
                  loading
                }
                onClick={() =>
                  handlePageChange(
                    currentPage - 1
                  )
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />

                <span className="hidden sm:inline">
                  Previous
                </span>
              </button>

              <div className="hidden items-center gap-1 sm:flex">
                {pageNumbers.map(
                  (page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-sm text-slate-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          handlePageChange(
                            page
                          )
                        }
                        className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition ${page === currentPage
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                          }`}
                      >
                        {page}
                      </button>
                    )
                )}
              </div>

              <div className="flex items-center gap-1 sm:hidden">
                <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                  Page {currentPage} of{" "}
                  {lastPage}
                </span>
              </div>

              <button
                type="button"
                disabled={
                  currentPage >= lastPage ||
                  loading
                }
                onClick={() =>
                  handlePageChange(
                    currentPage + 1
                  )
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="hidden sm:inline">
                  Next
                </span>

                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE SUMMARY */}

      {bookingList.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">
              Completed
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {statisticData.completed}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">
              Cancelled
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {statisticData.cancelled}
            </p>
          </div>
        </div>
      )}

      {/* LOADING INDICATOR */}

      {loading &&
        bookingList.length > 0 && (
          <div className="pointer-events-none fixed bottom-5 right-5 z-50">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating bookings...
            </div>
          </div>
        )}
    </div>
  );
};

export default BookingList;