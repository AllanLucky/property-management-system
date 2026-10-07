import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  MapPin,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import bookingApi from "../../../api/booking.api";

/*
|--------------------------------------------------------------------------
| CalendarBooking
|--------------------------------------------------------------------------
|
| EstateKenya Booking Calendar
|
| Route:
| /super-admin/bookings/calendar
|
|--------------------------------------------------------------------------
*/

const STATUS_STYLES = {
  pending: {
    label: "Pending",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
  },

  confirmed: {
    label: "Confirmed",
    className:
      "border-blue-200 bg-blue-50 text-blue-700",
  },

  approved: {
    label: "Approved",
    className:
      "border-indigo-200 bg-indigo-50 text-indigo-700",
  },

  rejected: {
    label: "Rejected",
    className:
      "border-red-200 bg-red-50 text-red-700",
  },

  cancelled: {
    label: "Cancelled",
    className:
      "border-slate-200 bg-slate-100 text-slate-600",
  },

  completed: {
    label: "Completed",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  },

  expired: {
    label: "Expired",
    className:
      "border-gray-200 bg-gray-100 text-gray-600",
  },
};

const WEEK_DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const pad = (value) =>
  String(value).padStart(2, "0");

const toDateString = (date) => {
  if (
    !(date instanceof Date) ||
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;
};

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const formatDate = (value) => {
  const date = parseDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatTime = (value) => {
  const date = parseDate(value);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-KE", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatCurrency = (value) => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "KES 0.00";
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(amount);
};

const getBookingDate = (booking) =>
  booking?.booking_date ??
  booking?.start_date ??
  booking?.check_in ??
  booking?.created_at ??
  null;

const getBookingName = (booking) => {
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

  const fullName =
    `${firstName} ${lastName}`.trim();

  return (
    fullName ||
    booking?.customer?.name ||
    booking?.tenant?.name ||
    booking?.user?.name ||
    booking?.customer_name ||
    "Unknown customer"
  );
};

const getPropertyName = (booking) =>
  booking?.property?.name ??
  booking?.property_name ??
  "Property not specified";

const getApartmentName = (booking) =>
  booking?.apartment?.name ??
  booking?.apartment?.number ??
  booking?.apartment_name ??
  "";

const getUnitName = (booking) =>
  booking?.unit?.unit_number ??
  booking?.unit?.name ??
  booking?.unit_number ??
  "";

const getBookingStatus = (booking) =>
  String(
    booking?.status ?? "pending"
  ).toLowerCase();

const getStatusStyle = (status) =>
  STATUS_STYLES[status] ?? {
    label: status
      ? status.charAt(0).toUpperCase() +
      status.slice(1)
      : "Unknown",

    className:
      "border-slate-200 bg-slate-50 text-slate-600",
  };

/*
|--------------------------------------------------------------------------
| Normalize API response
|--------------------------------------------------------------------------
*/

const extractBookings = (response) => {
  const root = response?.data ?? response;

  const candidates = [
    root?.data?.data,
    root?.data,
    root?.bookings,
    root?.results,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (
      candidate &&
      typeof candidate === "object" &&
      Array.isArray(candidate.data)
    ) {
      return candidate.data;
    }
  }

  return [];
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function CalendarBooking() {
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] =
    useState(() => new Date());

  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedBooking, setSelectedBooking] =
    useState(null);

  /*
  |--------------------------------------------------------------------------
  | Month calculations
  |--------------------------------------------------------------------------
  */

  const monthStart = useMemo(
    () =>
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ),
    [currentDate]
  );

  const monthEnd = useMemo(
    () =>
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ),
    [currentDate]
  );

  const calendarStart = useMemo(() => {
    const date = new Date(monthStart);

    date.setDate(
      date.getDate() - date.getDay()
    );

    return date;
  }, [monthStart]);

  const calendarEnd = useMemo(() => {
    const date = new Date(monthEnd);

    date.setDate(
      date.getDate() +
      (6 - date.getDay())
    );

    return date;
  }, [monthEnd]);

  const calendarDays = useMemo(() => {
    const days = [];

    const cursor = new Date(
      calendarStart
    );

    while (cursor <= calendarEnd) {
      days.push(new Date(cursor));

      cursor.setDate(
        cursor.getDate() + 1
      );
    }

    return days;
  }, [
    calendarStart,
    calendarEnd,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Fetch bookings
  |--------------------------------------------------------------------------
  */

  const fetchBookings = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await bookingApi.getAll({
            start_date:
              toDateString(
                calendarStart
              ),

            end_date:
              toDateString(
                calendarEnd
              ),

            per_page: 100,
          });

        setBookings(
          extractBookings(response)
        );
      } catch (err) {
        console.error(
          "[CalendarBooking] Failed to fetch bookings:",
          err
        );

        const message =
          err?.response?.data
            ?.message ??
          err?.message ??
          "Unable to load booking calendar.";

        setError(message);

        if (!silent) {
          Swal.fire({
            icon: "error",
            title: "Calendar Error",
            text: message,
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      calendarStart,
      calendarEnd,
    ]
  );

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  /*
  |--------------------------------------------------------------------------
  | Calendar bookings
  |--------------------------------------------------------------------------
  */

  const bookingsByDate = useMemo(() => {
    const grouped = {};

    bookings.forEach((booking) => {
      const rawDate =
        getBookingDate(booking);

      const date = parseDate(rawDate);

      if (!date) {
        return;
      }

      const key =
        toDateString(date);

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(booking);
    });

    return grouped;
  }, [bookings]);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const previousMonth = () => {
    setCurrentDate(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() - 1,
          1
        )
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() + 1,
          1
        )
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  /*
  |--------------------------------------------------------------------------
  | Header title
  |--------------------------------------------------------------------------
  */

  const monthLabel =
    new Intl.DateTimeFormat("en-KE", {
      month: "long",
      year: "numeric",
    }).format(currentDate);

  const todayKey = toDateString(
    new Date()
  );

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 space-y-6">

      {/* Header */}
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <CalendarDays className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Booking Calendar
            </h1>

            <p className="mt-0.5 text-sm text-slate-500">
              View and manage bookings by date.
            </p>
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
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            Bookings
          </button>

          <button
            type="button"
            onClick={goToToday}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            Today
          </button>

          <button
            type="button"
            disabled={
              refreshing ||
              loading
            }
            onClick={() =>
              fetchBookings({
                silent: true,
              })
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing
                ? "animate-spin"
                : ""
                }`}
            />

            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              <X className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="font-semibold">
                Unable to load booking calendar
              </p>

              <p className="mt-0.5">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar card */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Calendar toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">
              {monthLabel}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {bookings.length} booking
              {bookings.length === 1
                ? ""
                : "s"} in view
            </p>
          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={
                previousMonth
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={
                nextMonth
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3 sm:px-6">
          {Object.entries(
            STATUS_STYLES
          ).map(
            ([
              status,
              config,
            ]) => (
              <span
                key={status}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
              >
                {config.label}
              </span>
            )
          )}
        </div>

        {/* Calendar */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">

            {/* Week headings */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {WEEK_DAYS.map(
                (day) => (
                  <div
                    key={day}
                    className="border-r border-slate-200 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 last:border-r-0"
                  >
                    {day}
                  </div>
                )
              )}
            </div>

            {/* Days */}
            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />

                  Loading bookings...
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {calendarDays.map(
                  (day) => {
                    const key =
                      toDateString(
                        day
                      );

                    const dayBookings =
                      bookingsByDate[
                      key
                      ] ?? [];

                    const isCurrentMonth =
                      day.getMonth() ===
                      currentDate.getMonth();

                    const isToday =
                      key ===
                      todayKey;

                    return (
                      <div
                        key={key}
                        className={`min-h-[150px] border-b border-r border-slate-200 p-2 last:border-r-0 ${!isCurrentMonth
                          ? "bg-slate-50/70"
                          : "bg-white"
                          }`}
                      >

                        {/* Day header */}
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${isToday
                              ? "bg-slate-900 text-white"
                              : isCurrentMonth
                                ? "text-slate-700"
                                : "text-slate-400"
                              }`}
                          >
                            {day.getDate()}
                          </span>

                          {dayBookings.length >
                            0 && (
                              <span className="text-[10px] font-medium text-slate-400">
                                {
                                  dayBookings.length
                                }
                              </span>
                            )}
                        </div>

                        {/* Bookings */}
                        <div className="space-y-1.5">
                          {dayBookings
                            .slice(
                              0,
                              4
                            )
                            .map(
                              (
                                booking
                              ) => {
                                const status =
                                  getBookingStatus(
                                    booking
                                  );

                                const style =
                                  getStatusStyle(
                                    status
                                  );

                                return (
                                  <button
                                    key={
                                      booking.id
                                    }
                                    type="button"
                                    onClick={() =>
                                      setSelectedBooking(
                                        booking
                                      )
                                    }
                                    className={`block w-full truncate rounded-lg border px-2 py-1.5 text-left text-[11px] font-medium transition hover:shadow-sm ${style.className}`}
                                  >
                                    <div className="truncate font-semibold">
                                      {getBookingName(
                                        booking
                                      )}
                                    </div>

                                    <div className="mt-0.5 truncate opacity-80">
                                      {getUnitName(
                                        booking
                                      ) ||
                                        getPropertyName(
                                          booking
                                        )}
                                    </div>
                                  </button>
                                );
                              }
                            )}

                          {dayBookings.length >
                            4 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedBooking(
                                    dayBookings[4]
                                  )
                                }
                                className="w-full rounded-lg px-2 py-1 text-left text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                +
                                {" "}
                                {dayBookings.length -
                                  4}{" "}
                                more
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking details modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedBooking(
                null
              );
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>
                <h3 className="font-semibold text-slate-900">
                  Booking Details
                </h3>

                <p className="text-xs text-slate-500">
                  Booking #
                  {selectedBooking.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedBooking(
                    null
                  )
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close booking details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-4 px-5 py-5">

              {/* Customer */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-slate-900">
                    {getBookingName(
                      selectedBooking
                    )}
                  </p>

                  <p className="truncate text-sm text-slate-500">
                    {selectedBooking.email ??
                      selectedBooking
                        .customer
                        ?.email ??
                      "No email"}
                  </p>
                </div>

                {(() => {
                  const status =
                    getBookingStatus(
                      selectedBooking
                    );

                  const style =
                    getStatusStyle(
                      status
                    );

                  return (
                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${style.className}`}
                    >
                      {
                        style.label
                      }
                    </span>
                  );
                })()}
              </div>

              {/* Details grid */}
              <div className="grid gap-3 sm:grid-cols-2">

                {/* Booking date */}
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Clock3 className="h-4 w-4" />

                    Booking Date
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    {formatDate(
                      getBookingDate(
                        selectedBooking
                      )
                    )}
                  </p>

                  {formatTime(
                    getBookingDate(
                      selectedBooking
                    )
                  ) && (
                      <p className="text-xs text-slate-500">
                        {formatTime(
                          getBookingDate(
                            selectedBooking
                          )
                        )}
                      </p>
                    )}
                </div>

                {/* Booking type */}
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <UserRound className="h-4 w-4" />

                    Booking Type
                  </div>

                  <p className="text-sm font-semibold capitalize text-slate-900">
                    {String(
                      selectedBooking.booking_type ??
                      "—"
                    ).replace(
                      /_/g,
                      " "
                    )}
                  </p>
                </div>

                {/* Property */}
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <MapPin className="h-4 w-4" />

                    Property
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    {getPropertyName(
                      selectedBooking
                    )}
                  </p>

                  {getApartmentName(
                    selectedBooking
                  ) && (
                      <p className="text-xs text-slate-500">
                        {
                          getApartmentName(
                            selectedBooking
                          )
                        }
                      </p>
                    )}
                </div>

                {/* Unit */}
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-1 text-xs font-medium text-slate-500">
                    Unit
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    {getUnitName(
                      selectedBooking
                    ) ||
                      "Not specified"}
                  </p>
                </div>
              </div>

              {/* Financial summary */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">
                    Total Amount
                  </span>

                  <span className="font-bold text-slate-900">
                    {formatCurrency(
                      selectedBooking
                        ?.financials
                        ?.total_amount ??
                      selectedBooking.total_amount
                    )}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-500">
                    Amount Paid
                  </span>

                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(
                      selectedBooking
                        ?.financials
                        ?.amount_paid ??
                      selectedBooking.amount_paid
                    )}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-4 border-t border-slate-200 pt-2">
                  <span className="text-sm font-medium text-slate-700">
                    Balance
                  </span>

                  <span className="font-bold text-amber-600">
                    {formatCurrency(
                      selectedBooking
                        ?.financials
                        ?.balance ??
                      selectedBooking.balance
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">

              <button
                type="button"
                onClick={() =>
                  setSelectedBooking(
                    null
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>

              {selectedBooking.id && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/super-admin/bookings/${selectedBooking.id}`
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Eye className="h-4 w-4" />

                  View Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}