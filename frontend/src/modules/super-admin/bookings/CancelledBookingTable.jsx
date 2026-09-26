import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

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

const toNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
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

const getFinancials = (booking) => {
  return (
    booking?.financials ||
    booking?.finance ||
    {}
  );
};

const getTotalAmount = (booking) => {
  const financials =
    getFinancials(booking);

  return toNumber(
    financials.total_amount ??
    financials.total ??
    booking?.total_amount ??
    booking?.total ??
    0
  );
};

const getPaidAmount = (booking) => {
  const financials =
    getFinancials(booking);

  return toNumber(
    financials.amount_paid ??
    financials.paid ??
    booking?.amount_paid ??
    booking?.paid ??
    0
  );
};

const getBalanceAmount = (booking) => {
  const financials =
    getFinancials(booking);

  if (
    financials.balance !==
    undefined &&
    financials.balance !== null
  ) {
    return toNumber(
      financials.balance
    );
  }

  if (
    booking?.balance !==
    undefined &&
    booking?.balance !== null
  ) {
    return toNumber(
      booking.balance
    );
  }

  return Math.max(
    getTotalAmount(booking) -
    getPaidAmount(booking),
    0
  );
};

const getBookingReference = (
  booking
) => {
  return (
    booking?.booking_number ||
    booking?.booking_code ||
    booking?.reference ||
    booking?.code ||
    (booking?.id
      ? `BK-${booking.id}`
      : "—")
  );
};

const getCustomer = (booking) => {
  return (
    booking?.customer ||
    booking?.customer_user ||
    booking?.user ||
    booking?.customerUser ||
    null
  );
};

const getCustomerName = (
  booking
) => {
  const customer =
    getCustomer(booking);

  const nestedName =
    customer?.full_name ||
    customer?.name ||
    [
      customer?.first_name,
      customer?.last_name,
    ]
      .filter(Boolean)
      .join(" ");

  if (nestedName) {
    return nestedName;
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

const getCustomerEmail = (
  booking
) => {
  const customer =
    getCustomer(booking);

  return (
    booking?.email ||
    customer?.email ||
    ""
  );
};

const getCustomerPhone = (
  booking
) => {
  const customer =
    getCustomer(booking);

  return (
    booking?.phone ||
    customer?.phone ||
    ""
  );
};

const getProperty = (booking) => {
  return (
    booking?.property ||
    booking?.tenancy?.property ||
    null
  );
};

const getPropertyName = (
  booking
) => {
  const property =
    getProperty(booking);

  return (
    property?.name ||
    booking?.property_name ||
    "Property not specified"
  );
};

const getPropertyLocation = (
  booking
) => {
  const property =
    getProperty(booking);

  return (
    property?.address ||
    property?.location ||
    property?.area ||
    booking?.property_location ||
    ""
  );
};

const getApartment = (
  booking
) => {
  return (
    booking?.apartment ||
    booking?.tenancy?.apartment ||
    null
  );
};

const getApartmentName = (
  booking
) => {
  const apartment =
    getApartment(booking);

  return (
    apartment?.name ||
    apartment?.title ||
    booking?.apartment_name ||
    ""
  );
};

const getUnit = (booking) => {
  return (
    booking?.unit ||
    booking?.tenancy?.unit ||
    null
  );
};

const getUnitName = (
  booking
) => {
  const unit =
    getUnit(booking);

  return (
    unit?.name ||
    unit?.unit_number ||
    unit?.number ||
    booking?.unit_number ||
    ""
  );
};

const getBookingType = (
  booking
) => {
  return String(
    booking?.booking_type ||
    booking?.type ||
    "reservation"
  ).replace(/_/g, " ");
};

const getPaymentStatus = (
  booking
) => {
  const financials =
    getFinancials(booking);

  return String(
    booking?.payment_status ??
    booking?.paymentStatus ??
    financials.payment_status ??
    "pending"
  ).toLowerCase();
};

const getCancelledAt = (
  booking
) => {
  return (
    booking?.cancelled_at ||
    booking?.cancellation_date ||
    null
  );
};

const getCancellationReason = (
  booking
) => {
  return (
    booking?.cancellation_reason ||
    booking?.cancel_reason ||
    booking?.reason ||
    ""
  );
};

/*
|--------------------------------------------------------------------------
| Payment Badge
|--------------------------------------------------------------------------
*/

const PaymentStatusBadge = ({
  status,
}) => {
  const config = {
    paid: {
      label: "Paid",
      className:
        "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },

    partial: {
      label: "Partial",
      className:
        "bg-amber-50 text-amber-700 ring-amber-200",
    },

    pending: {
      label: "Pending",
      className:
        "bg-slate-50 text-slate-700 ring-slate-200",
    },

    failed: {
      label: "Failed",
      className:
        "bg-red-50 text-red-700 ring-red-200",
    },

    refunded: {
      label: "Refunded",
      className:
        "bg-purple-50 text-purple-700 ring-purple-200",
    },
  };

  const current =
    config[status] ||
    config.pending;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full",
        "px-2.5 py-1 text-xs font-semibold",
        "ring-1 ring-inset",
        current.className,
      ].join(" ")}
    >
      {current.label}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| Booking Type Badge
|--------------------------------------------------------------------------
*/

const BookingTypeBadge = ({
  type,
}) => {
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700 ring-1 ring-inset ring-indigo-200">
      {type}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| Sort Icon
|--------------------------------------------------------------------------
*/

const SortIcon = ({
  active,
  direction,
}) => {
  if (!active) {
    return (
      <ChevronDown className="h-3.5 w-3.5 text-slate-300" />
    );
  }

  return direction ===
    "asc" ? (
    <ChevronUp className="h-3.5 w-3.5 text-indigo-600" />
  ) : (
    <ChevronDown className="h-3.5 w-3.5 text-indigo-600" />
  );
};

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

export default function CancelledBookingTable({
  bookings = [],
  loading = false,
  onView,
  onRefresh,
  emptyMessage = "No cancelled bookings found.",
  showPagination = false,
  pagination = null,
  onPageChange,
}) {
  const [sortField, setSortField] =
    useState("cancelled_at");

  const [sortDirection, setSortDirection] =
    useState("desc");

  /*
  |--------------------------------------------------------------------------
  | Sorting
  |--------------------------------------------------------------------------
  */

  const sortedBookings = useMemo(() => {
    const source =
      safeArray(bookings);

    const items = [...source];

    items.sort(
      (a, b) => {
        let first;
        let second;

        switch (sortField) {
          case "reference":
            first =
              getBookingReference(
                a
              );
            second =
              getBookingReference(
                b
              );
            break;

          case "customer":
            first =
              getCustomerName(
                a
              );
            second =
              getCustomerName(
                b
              );
            break;

          case "total":
            first =
              getTotalAmount(
                a
              );
            second =
              getTotalAmount(
                b
              );
            break;

          case "paid":
            first =
              getPaidAmount(
                a
              );
            second =
              getPaidAmount(
                b
              );
            break;

          case "balance":
            first =
              getBalanceAmount(
                a
              );
            second =
              getBalanceAmount(
                b
              );
            break;

          case "cancelled_at":
          default:
            first = new Date(
              getCancelledAt(
                a
              ) || 0
            ).getTime();

            second = new Date(
              getCancelledAt(
                b
              ) || 0
            ).getTime();
            break;
        }

        if (
          typeof first ===
          "string" ||
          typeof second ===
          "string"
        ) {
          const result =
            String(
              first || ""
            ).localeCompare(
              String(
                second || ""
              ),
              undefined,
              {
                numeric: true,
                sensitivity:
                  "base",
              }
            );

          return sortDirection ===
            "asc"
            ? result
            : -result;
        }

        const result =
          Number(
            first || 0
          ) -
          Number(
            second || 0
          );

        return sortDirection ===
          "asc"
          ? result
          : -result;
      }
    );

    return items;
  }, [
    bookings,
    sortField,
    sortDirection,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Sorting Handler
  |--------------------------------------------------------------------------
  */

  const handleSort = (
    field
  ) => {
    if (
      sortField === field
    ) {
      setSortDirection(
        (current) =>
          current === "asc"
            ? "desc"
            : "asc"
      );

      return;
    }

    setSortField(field);
    setSortDirection("asc");
  };

  /*
  |--------------------------------------------------------------------------
  | View Handler
  |--------------------------------------------------------------------------
  */

  const handleView = (
    booking
  ) => {
    if (
      typeof onView ===
      "function"
    ) {
      onView(booking);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (
    loading &&
    sortedBookings.length === 0
  ) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
              <XCircle className="h-6 w-6 animate-pulse text-indigo-600" />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              Loading cancelled
              bookings...
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Please wait while we
              retrieve the records.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Empty State
  |--------------------------------------------------------------------------
  */

  if (
    !loading &&
    sortedBookings.length === 0
  ) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-h-[420px] items-center justify-center px-6">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <XCircle className="h-7 w-7 text-slate-400" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No cancelled
              bookings
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {emptyMessage}
            </p>

            {typeof onRefresh ===
              "function" && (
                <button
                  type="button"
                  onClick={
                    onRefresh
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Refresh
                </button>
              )}
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Cancelled Bookings
            </h2>

            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-100">
              {
                sortedBookings.length
              }
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Bookings marked as
            cancelled.
          </p>
        </div>

        {loading && (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-indigo-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-600" />
            Updating...
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-[1450px] w-full">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              {/* Booking */}
              <th className="px-5 py-3 text-left">
                <button
                  type="button"
                  onClick={() =>
                    handleSort(
                      "reference"
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition hover:text-slate-800"
                >
                  Booking
                  <SortIcon
                    active={
                      sortField ===
                      "reference"
                    }
                    direction={
                      sortDirection
                    }
                  />
                </button>
              </th>

              {/* Customer */}
              <th className="px-5 py-3 text-left">
                <button
                  type="button"
                  onClick={() =>
                    handleSort(
                      "customer"
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition hover:text-slate-800"
                >
                  Customer
                  <SortIcon
                    active={
                      sortField ===
                      "customer"
                    }
                    direction={
                      sortDirection
                    }
                  />
                </button>
              </th>

              {/* Property */}
              <th className="px-5 py-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Property / Unit
                </span>
              </th>

              {/* Booking Type */}
              <th className="px-5 py-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Type
                </span>
              </th>

              {/* Cancelled */}
              <th className="px-5 py-3 text-left">
                <button
                  type="button"
                  onClick={() =>
                    handleSort(
                      "cancelled_at"
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition hover:text-slate-800"
                >
                  Cancelled
                  <SortIcon
                    active={
                      sortField ===
                      "cancelled_at"
                    }
                    direction={
                      sortDirection
                    }
                  />
                </button>
              </th>

              {/* Total */}
              <th className="px-5 py-3 text-right">
                <button
                  type="button"
                  onClick={() =>
                    handleSort(
                      "total"
                    )
                  }
                  className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition hover:text-slate-800"
                >
                  Total
                  <SortIcon
                    active={
                      sortField ===
                      "total"
                    }
                    direction={
                      sortDirection
                    }
                  />
                </button>
              </th>

              {/* Paid */}
              <th className="px-5 py-3 text-right">
                <button
                  type="button"
                  onClick={() =>
                    handleSort(
                      "paid"
                    )
                  }
                  className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition hover:text-slate-800"
                >
                  Paid
                  <SortIcon
                    active={
                      sortField ===
                      "paid"
                    }
                    direction={
                      sortDirection
                    }
                  />
                </button>
              </th>

              {/* Balance */}
              <th className="px-5 py-3 text-right">
                <button
                  type="button"
                  onClick={() =>
                    handleSort(
                      "balance"
                    )
                  }
                  className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition hover:text-slate-800"
                >
                  Balance
                  <SortIcon
                    active={
                      sortField ===
                      "balance"
                    }
                    direction={
                      sortDirection
                    }
                  />
                </button>
              </th>

              {/* Payment */}
              <th className="px-5 py-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Payment
                </span>
              </th>

              {/* Action */}
              <th className="px-5 py-3 text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Action
                </span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sortedBookings.map(
              (
                booking,
                index
              ) => {
                const bookingId =
                  getId(
                    booking
                  );

                const reference =
                  getBookingReference(
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

                const propertyName =
                  getPropertyName(
                    booking
                  );

                const propertyLocation =
                  getPropertyLocation(
                    booking
                  );

                const apartmentName =
                  getApartmentName(
                    booking
                  );

                const unitName =
                  getUnitName(
                    booking
                  );

                const total =
                  getTotalAmount(
                    booking
                  );

                const paid =
                  getPaidAmount(
                    booking
                  );

                const balance =
                  getBalanceAmount(
                    booking
                  );

                const paymentStatus =
                  getPaymentStatus(
                    booking
                  );

                const bookingType =
                  getBookingType(
                    booking
                  );

                const cancelledAt =
                  getCancelledAt(
                    booking
                  );

                const cancellationReason =
                  getCancellationReason(
                    booking
                  );

                return (
                  <tr
                    key={
                      bookingId ||
                      `cancelled-${index}`
                    }
                    className="group transition hover:bg-slate-50"
                  >
                    {/* Booking */}
                    <td className="px-5 py-4 align-top">
                      <div className="min-w-[170px]">
                        <button
                          type="button"
                          onClick={() =>
                            handleView(
                              booking
                            )
                          }
                          className="font-semibold text-indigo-600 transition hover:text-indigo-800 hover:underline"
                        >
                          {
                            reference
                          }
                        </button>

                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays className="h-3.5 w-3.5" />

                          {formatDate(
                            booking?.booking_date
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-4 align-top">
                      <div className="flex min-w-[250px] items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                          <UserRound className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleView(
                                booking
                              )
                            }
                            className="truncate text-left text-sm font-semibold text-slate-900 transition hover:text-indigo-600"
                          >
                            {
                              customerName
                            }
                          </button>

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
                      <div className="min-w-[230px]">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {
                                propertyName
                              }
                            </p>

                            {propertyLocation && (
                              <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                                {
                                  propertyLocation
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {apartmentName && (
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                              Apt:{" "}
                              {
                                apartmentName
                              }
                            </span>
                          )}

                          {unitName && (
                            <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                              Unit:{" "}
                              {
                                unitName
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4 align-top">
                      <BookingTypeBadge
                        type={
                          bookingType
                        }
                      />

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <UsersRound className="h-3.5 w-3.5" />

                        <span>
                          {toNumber(
                            booking?.number_of_adults ??
                            booking?.adults ??
                            0
                          )}{" "}
                          adult
                          {toNumber(
                            booking?.number_of_adults ??
                            booking?.adults ??
                            0
                          ) ===
                            1
                            ? ""
                            : "s"}
                        </span>

                        {toNumber(
                          booking?.number_of_children ??
                          booking?.children ??
                          0
                        ) >
                          0 && (
                            <span>
                              +
                              {toNumber(
                                booking?.number_of_children ??
                                booking?.children ??
                                0
                              )}{" "}
                              child
                            </span>
                          )}
                      </div>
                    </td>

                    {/* Cancelled */}
                    <td className="px-5 py-4 align-top">
                      <div className="min-w-[190px]">
                        <div className="flex items-start gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                            <XCircle className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatDate(
                                cancelledAt
                              )}
                            </p>

                            {cancelledAt && (
                              <p className="mt-0.5 text-xs text-slate-500">
                                {formatDateTime(
                                  cancelledAt
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        {cancellationReason && (
                          <div
                            className="mt-2 flex items-start gap-1.5 text-xs text-slate-500"
                            title={
                              cancellationReason
                            }
                          >
                            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                            <span className="line-clamp-2 max-w-[210px]">
                              {
                                cancellationReason
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-5 py-4 text-right align-top">
                      <div className="flex min-w-[130px] items-center justify-end gap-1.5">
                        <CircleDollarSign className="h-4 w-4 text-slate-400" />

                        <span className="whitespace-nowrap text-sm font-semibold text-slate-900">
                          {formatCurrency(
                            total
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Paid */}
                    <td className="px-5 py-4 text-right align-top">
                      <span className="whitespace-nowrap text-sm font-semibold text-emerald-600">
                        {formatCurrency(
                          paid
                        )}
                      </span>
                    </td>

                    {/* Balance */}
                    <td className="px-5 py-4 text-right align-top">
                      <span
                        className={[
                          "whitespace-nowrap text-sm font-semibold",
                          balance >
                            0
                            ? "text-amber-600"
                            : "text-slate-500",
                        ].join(
                          " "
                        )}
                      >
                        {formatCurrency(
                          balance
                        )}
                      </span>
                    </td>

                    {/* Payment */}
                    <td className="px-5 py-4 align-top">
                      <PaymentStatusBadge
                        status={
                          paymentStatus
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
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
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

      {/* Footer / Pagination */}
      {(showPagination ||
        pagination) && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              {pagination?.total !==
                undefined && (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {
                        pagination.from ??
                        0
                      }
                    </span>
                    {" "}to{" "}
                    <span className="font-semibold text-slate-700">
                      {
                        pagination.to ??
                        0
                      }
                    </span>
                    {" "}of{" "}
                    <span className="font-semibold text-slate-700">
                      {
                        pagination.total
                      }
                    </span>{" "}
                    bookings
                  </>
                )}
            </div>

            {pagination &&
              typeof onPageChange ===
              "function" && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      !pagination.current_page ||
                      pagination.current_page <=
                      1
                    }
                    onClick={() =>
                      onPageChange(
                        pagination.current_page -
                        1
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                    {
                      pagination.current_page
                    }{" "}
                    /{" "}
                    {
                      pagination.last_page
                    }
                  </span>

                  <button
                    type="button"
                    disabled={
                      !pagination.last_page ||
                      pagination.current_page >=
                      pagination.last_page
                    }
                    onClick={() =>
                      onPageChange(
                        pagination.current_page +
                        1
                      )
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
          </div>
        )}
    </div>
  );
}

