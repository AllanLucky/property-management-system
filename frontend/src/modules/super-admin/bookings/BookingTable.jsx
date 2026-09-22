import {
  ArrowRight,
  CalendarDays,
  Eye,
  FileText,
  Home,
  MoreHorizontal,
  Pencil,
  UserRound,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import BookingPaymentBadge from "./BookingPaymentBadge";
import BookingStatusBadge from "./BookingStatusBadge";

/*
|--------------------------------------------------------------------------
| Formatting Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely convert a value to a number.
 */
const toNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "object") {
    if (value.amount !== undefined) {
      return toNumber(value.amount);
    }

    if (value.value !== undefined) {
      return toNumber(value.value);
    }

    if (value.total !== undefined) {
      return toNumber(value.total);
    }

    return 0;
  }

  const parsed = Number(
    String(value).replace(/[^0-9.-]/g, ""),
  );

  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Safely convert a value to boolean.
 */
const toBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    return [
      "1",
      "true",
      "yes",
      "on",
    ].includes(value.toLowerCase());
  }

  return false;
};

/**
 * Format currency using Kenyan Shillings.
 *
 * Financial values are never truncated.
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    currencyDisplay: "symbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
};

/**
 * Format date.
 */
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

/*
|--------------------------------------------------------------------------
| Generic Helpers
|--------------------------------------------------------------------------
*/

/**
 * Determine whether a value is a plain object.
 */
const isObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

/**
 * Determine whether a value is actually present.
 */
const hasValue = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "";

/*
|--------------------------------------------------------------------------
| Booking Source
|--------------------------------------------------------------------------
*/

/**
 * Get the actual booking object.
 *
 * Supports:
 *
 * booking
 *
 * or:
 *
 * {
 *   data: booking
 * }
 */
const getBookingSource = (booking) => {
  if (!isObject(booking)) {
    return {};
  }

  if (
    !booking.id &&
    !booking.booking_number &&
    isObject(booking.data)
  ) {
    return booking.data;
  }

  return booking;
};

/*
|--------------------------------------------------------------------------
| Financial Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get the financial object.
 *
 * Supports:
 *
 * financials: {...}
 *
 * financials: {
 *   data: {...}
 * }
 *
 * or financial values directly on booking.
 */
const getFinancialObject = (booking) => {
  const source = getBookingSource(booking);

  const financials = source?.financials;

  if (isObject(financials?.data)) {
    return financials.data;
  }

  if (isObject(financials)) {
    return financials;
  }

  return source;
};

/**
 * Get a financial field.
 *
 * Financial object is checked first.
 * Booking-level fields are used as fallback.
 */
const getFinancialValue = (
  booking,
  financial,
  bookingFields = [],
) => {
  const source = getBookingSource(booking);
  const financials = getFinancialObject(source);

  if (hasValue(financials?.[financial])) {
    return financials[financial];
  }

  if (hasValue(source?.[financial])) {
    return source[financial];
  }

  for (const field of bookingFields) {
    if (hasValue(financials?.[field])) {
      return financials[field];
    }

    if (hasValue(source?.[field])) {
      return source[field];
    }
  }

  return undefined;
};

/**
 * Get all booking financials.
 */
const getBookingFinancials = (booking) => {
  const source = getBookingSource(booking);
  const financials = getFinancialObject(source);

  /*
   * Charges
   */

  const rentRaw = getFinancialValue(
    source,
    "rent_amount",
    [
      "rentAmount",
      "rent",
    ],
  );

  const depositRaw = getFinancialValue(
    source,
    "deposit_amount",
    [
      "depositAmount",
      "deposit",
    ],
  );

  const serviceChargeRaw = getFinancialValue(
    source,
    "service_charge",
    [
      "serviceCharge",
      "service_charge_amount",
      "serviceChargeAmount",
    ],
  );

  const bookingFeeRaw = getFinancialValue(
    source,
    "booking_fee",
    [
      "bookingFee",
      "booking_fee_amount",
      "bookingFeeAmount",
    ],
  );

  const discountRaw = getFinancialValue(
    source,
    "discount_amount",
    [
      "discountAmount",
      "discount",
    ],
  );

  /*
   * Total
   */

  const totalRaw = getFinancialValue(
    source,
    "total_amount",
    [
      "totalAmount",
      "grand_total",
      "grandTotal",
      "booking_total",
      "bookingTotal",
      "total",
      "total_due",
      "totalDue",
      "total_payable",
      "totalPayable",
    ],
  );

  /*
   * Paid
   */

  const paidRaw = getFinancialValue(
    source,
    "amount_paid",
    [
      "amountPaid",
      "paid_amount",
      "paidAmount",
      "total_paid",
      "totalPaid",
      "paid",
      "payments_total",
      "paymentsTotal",
    ],
  );

  /*
   * Balance
   */

  const balanceRaw = getFinancialValue(
    source,
    "balance",
    [
      "balance_amount",
      "balanceAmount",
      "amount_balance",
      "amountBalance",
    ],
  );

  /*
   * Numeric values
   */

  const rentAmount = toNumber(rentRaw);
  const depositAmount = toNumber(depositRaw);
  const serviceCharge = toNumber(serviceChargeRaw);
  const bookingFee = toNumber(bookingFeeRaw);
  const discountAmount = toNumber(discountRaw);

  let total = toNumber(totalRaw);
  const paid = toNumber(paidRaw);

  /*
   * If backend total is unavailable, calculate it.
   *
   * total =
   * rent + deposit + service charge + booking fee - discount
   */
  if (
    !hasValue(totalRaw) &&
    [
      rentRaw,
      depositRaw,
      serviceChargeRaw,
      bookingFeeRaw,
      discountRaw,
    ].some(hasValue)
  ) {
    total = Math.max(
      rentAmount +
      depositAmount +
      serviceCharge +
      bookingFee -
      discountAmount,
      0,
    );
  }

  /*
   * Balance
   */

  const balance = hasValue(balanceRaw)
    ? Math.max(toNumber(balanceRaw), 0)
    : Math.max(total - paid, 0);

  /*
   * Payment flags
   */

  const isFullyPaidRaw =
    financials?.is_fully_paid ??
    source?.is_fully_paid;

  const isPartiallyPaidRaw =
    financials?.is_partially_paid ??
    source?.is_partially_paid;

  const hasBalanceRaw =
    financials?.has_balance ??
    source?.has_balance;

  const isFullyPaid = hasValue(isFullyPaidRaw)
    ? toBoolean(isFullyPaidRaw)
    : total > 0 &&
    paid >= total &&
    balance <= 0;

  const isPartiallyPaid = hasValue(
    isPartiallyPaidRaw,
  )
    ? toBoolean(isPartiallyPaidRaw)
    : paid > 0 &&
    paid < total &&
    balance > 0;

  const hasBalance = hasValue(hasBalanceRaw)
    ? toBoolean(hasBalanceRaw)
    : balance > 0;

  /*
   * Financial data detection
   */

  const hasFinancialData = [
    rentRaw,
    depositRaw,
    serviceChargeRaw,
    bookingFeeRaw,
    discountRaw,
    totalRaw,
    paidRaw,
    balanceRaw,
  ].some(hasValue);

  return {
    rentAmount,
    depositAmount,
    serviceCharge,
    bookingFee,
    discountAmount,

    total,
    paid,
    balance,

    isFullyPaid,
    isPartiallyPaid,
    hasBalance,

    hasFinancialData,
  };
};

/**
 * Format financial value.
 *
 * No truncation.
 * No labels.
 * No surrounding box.
 */
const formatFinancialValue = (
  value,
  hasFinancialData = true,
) => {
  if (!hasFinancialData) {
    return "—";
  }

  return formatCurrency(value);
};

/*
|--------------------------------------------------------------------------
| Customer Helpers
|--------------------------------------------------------------------------
*/

const getCustomerName = (booking) => {
  const source = getBookingSource(booking);

  if (source.customer?.full_name) {
    return source.customer.full_name;
  }

  if (source.customer?.name) {
    return source.customer.name;
  }

  if (source.customer) {
    const fullName = [
      source.customer.first_name,
      source.customer.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) {
      return fullName;
    }
  }

  if (source.customer_user?.name) {
    return source.customer_user.name;
  }

  if (source.customer_user) {
    const fullName = [
      source.customer_user.first_name,
      source.customer_user.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) {
      return fullName;
    }
  }

  if (source.user?.name) {
    return source.user.name;
  }

  if (source.user) {
    const fullName = [
      source.user.first_name,
      source.user.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) {
      return fullName;
    }
  }

  return "Unknown Customer";
};

const getCustomerEmail = (booking) => {
  const source = getBookingSource(booking);

  return (
    source.customer?.email ||
    source.customer_user?.email ||
    source.user?.email ||
    "—"
  );
};

const getCustomerPhone = (booking) => {
  const source = getBookingSource(booking);

  return (
    source.customer?.phone ||
    source.customer_user?.phone ||
    source.user?.phone ||
    "—"
  );
};

/*
|--------------------------------------------------------------------------
| Property Helpers
|--------------------------------------------------------------------------
*/

const getPropertyName = (booking) => {
  const source = getBookingSource(booking);

  return (
    source.property?.name ||
    source.property?.title ||
    source.property?.code ||
    source.property?.slug ||
    "Property"
  );
};

const getApartmentName = (booking) => {
  const source = getBookingSource(booking);

  return (
    source.apartment?.name ||
    source.apartment?.title ||
    source.apartment?.code ||
    source.apartment?.slug ||
    "Apartment"
  );
};

const getUnitName = (booking) => {
  const source = getBookingSource(booking);

  return (
    source.unit?.unit_number ||
    source.unit?.name ||
    source.unit?.code ||
    source.unit_number ||
    source.unit_code ||
    (source.unit_id
      ? String(source.unit_id)
      : "—")
  );
};

/*
|--------------------------------------------------------------------------
| Booking Helpers
|--------------------------------------------------------------------------
*/

const getBookingType = (booking) => {
  const source = getBookingSource(booking);

  const type = source.booking_type || "—";

  return String(type)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
};

const getBookingNumber = (booking) => {
  const source = getBookingSource(booking);

  return (
    source.booking_number ||
    source.reference ||
    `#${source.id || "—"}`
  );
};

const getBookingSourceLabel = (booking) => {
  const source = getBookingSource(booking);

  const value = source.source || "—";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
};

/**
 * Get the stable booking identifier.
 *
 * IMPORTANT:
 * Always prefer the numeric/database ID.
 * Never return the entire booking object.
 */
const getBookingId = (booking) => {
  const source = getBookingSource(booking);

  const id =
    source?.id ??
    source?.booking_id ??
    source?.booking?.id ??
    null;

  if (
    id !== null &&
    id !== undefined &&
    id !== ""
  ) {
    return String(id);
  }

  /*
   * Fallback identifiers are only used when an actual
   * database ID is unavailable.
   */
  const fallback =
    source?.slug ??
    source?.booking_number ??
    source?.reference ??
    null;

  if (
    fallback !== null &&
    fallback !== undefined &&
    fallback !== ""
  ) {
    return String(fallback);
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| Booking Row Normalization
|--------------------------------------------------------------------------
*/

const normalizeBooking = (booking, index) => {
  const source = getBookingSource(booking);

  const bookingId = getBookingId(source);
  const bookingNumber = getBookingNumber(source);

  return {
    key:
      bookingId ||
      bookingNumber ||
      `booking-${index}`,

    source,

    bookingId,
    bookingNumber,

    bookingType: getBookingType(source),
    sourceLabel: getBookingSourceLabel(source),

    customerName: getCustomerName(source),
    customerEmail: getCustomerEmail(source),
    customerPhone: getCustomerPhone(source),

    propertyName: getPropertyName(source),
    apartmentName: getApartmentName(source),
    unitName: getUnitName(source),

    startDate: source.start_date,
    endDate: source.end_date,

    status: source.status,
    paymentStatus: source.payment_status,

    financials: getBookingFinancials(source),
  };
};

/*
|--------------------------------------------------------------------------
| Date Range
|--------------------------------------------------------------------------
*/

const DateRange = ({
  startDate,
  endDate,
  mobile = false,
}) => {
  return (
    <div
      className={`flex items-center ${mobile ? "gap-2.5" : "gap-2"
        } whitespace-nowrap`}
    >
      <CalendarDays
        className={`shrink-0 text-gray-400 ${mobile
          ? "h-4 w-4"
          : "h-3.5 w-3.5"
          }`}
      />

      <span
        className={`font-medium text-gray-800 ${mobile ? "text-sm" : "text-sm"
          }`}
      >
        {formatDate(startDate)}
      </span>

      <ArrowRight
        className={`shrink-0 text-gray-300 ${mobile
          ? "h-3.5 w-3.5"
          : "h-3.5 w-3.5"
          }`}
      />

      <span
        className={`font-medium text-gray-800 ${mobile ? "text-sm" : "text-sm"
          }`}
      >
        {formatDate(endDate)}
      </span>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const BookingTable = ({
  bookings = [],
  loading = false,
  onEdit,
  onDelete,
  onView,
}) => {
  /*
   * -----------------------------------------------------------------------
   * Normalize collection
   * -----------------------------------------------------------------------
   */

  const bookingRows = useMemo(() => {
    if (Array.isArray(bookings)) {
      return bookings;
    }

    if (Array.isArray(bookings?.data)) {
      return bookings.data;
    }

    return [];
  }, [bookings]);

  /*
   * -----------------------------------------------------------------------
   * Normalize bookings
   * -----------------------------------------------------------------------
   */

  const normalizedBookings = useMemo(() => {
    return bookingRows.map(normalizeBooking);
  }, [bookingRows]);

  /*
   * -----------------------------------------------------------------------
   * Loading State
   * -----------------------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {/* Desktop Skeleton */}

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-[1700px] table-auto">
            <thead className="bg-gray-50/70">
              <tr>
                {[
                  "Booking",
                  "Customer",
                  "Property / Unit",
                  "Dates",
                  "Total",
                  "Paid",
                  "Balance",
                  "Status",
                  "Payment",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className={`whitespace-nowrap px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 ${[
                      "Total",
                      "Paid",
                      "Balance",
                    ].includes(heading)
                      ? "text-right"
                      : heading === "Actions"
                        ? "text-right"
                        : "text-left"
                      }`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {Array.from({
                length: 6,
              }).map((_, index) => (
                <tr
                  key={index}
                  className="animate-pulse"
                >
                  {Array.from({
                    length: 10,
                  }).map((__, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-5 py-5"
                    >
                      <div className="h-4 rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Skeleton */}

        <div className="space-y-3 p-4 lg:hidden">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-xl bg-gray-50 p-4"
            >
              <div className="h-5 w-1/2 rounded bg-gray-200" />

              <div className="mt-3 h-4 w-3/4 rounded bg-gray-200" />

              <div className="mt-3 h-4 w-1/2 rounded bg-gray-200" />

              <div className="mt-4 h-12 rounded-lg bg-gray-100" />

              <div className="mt-4 h-10 rounded-lg bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /*
   * -----------------------------------------------------------------------
   * Empty State
   * -----------------------------------------------------------------------
   */

  if (normalizedBookings.length === 0) {
    return (
      <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <CalendarDays className="h-7 w-7 text-gray-400" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-gray-900">
          No bookings found
        </h3>

        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
          There are no bookings matching the
          current filters.
        </p>
      </div>
    );
  }

  /*
   * -----------------------------------------------------------------------
   * Main Table
   * -----------------------------------------------------------------------
   */

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* ================================================================
          DESKTOP
      ================================================================ */}

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-[1700px] table-auto">
          <thead className="bg-gray-50/70">
            <tr>
              <th className="min-w-[170px] whitespace-nowrap px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Booking
              </th>

              <th className="min-w-[190px] whitespace-nowrap px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Customer
              </th>

              <th className="min-w-[220px] whitespace-nowrap px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Property / Unit
              </th>

              <th className="min-w-[245px] whitespace-nowrap px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Dates
              </th>

              <th className="min-w-[145px] whitespace-nowrap px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Total
              </th>

              <th className="min-w-[145px] whitespace-nowrap px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Paid
              </th>

              <th className="min-w-[155px] whitespace-nowrap px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Balance
              </th>

              <th className="min-w-[120px] whitespace-nowrap px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Status
              </th>

              <th className="min-w-[120px] whitespace-nowrap px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Payment
              </th>

              <th className="min-w-[145px] whitespace-nowrap px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {normalizedBookings.map((booking) => {
              const {
                key,
                source,
                bookingId,
                bookingNumber,
                bookingType,
                sourceLabel,
                customerName,
                customerEmail,
                customerPhone,
                propertyName,
                apartmentName,
                unitName,
                startDate,
                endDate,
                status,
                paymentStatus,
                financials,
              } = booking;

              const {
                total,
                paid,
                balance,
                hasBalance,
                hasFinancialData,
              } = financials;

              return (
                <tr
                  key={key}
                  className="group transition-colors duration-150 hover:bg-gray-50/60"
                >
                  {/* Booking */}

                  <td className="px-5 py-5 align-middle">
                    <div className="flex min-w-[155px] items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                        <FileText className="h-4 w-4 text-gray-500" />
                      </div>

                      <div className="min-w-0">
                        <div
                          className="truncate text-sm font-bold text-gray-900"
                          title={bookingNumber}
                        >
                          {bookingNumber}
                        </div>

                        <div className="mt-0.5 text-[11px] font-medium text-gray-500">
                          {bookingType}
                        </div>

                        <div className="mt-0.5 text-[10px] text-gray-400">
                          {sourceLabel}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Customer */}

                  <td className="px-5 py-5 align-middle">
                    <div className="flex min-w-[180px] items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <UserRound className="h-3.5 w-3.5 text-blue-600" />
                      </div>

                      <div className="min-w-0">
                        <div
                          className="truncate text-sm font-semibold text-gray-900"
                          title={customerName}
                        >
                          {customerName}
                        </div>

                        {customerEmail !== "—" ? (
                          <div
                            className="mt-0.5 max-w-[180px] truncate text-[11px] text-gray-500"
                            title={customerEmail}
                          >
                            {customerEmail}
                          </div>
                        ) : customerPhone !== "—" ? (
                          <div className="mt-0.5 text-[11px] text-gray-500">
                            {customerPhone}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  {/* Property / Unit */}

                  <td className="px-5 py-5 align-middle">
                    <div className="flex min-w-[200px] items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                        <Home className="h-3.5 w-3.5 text-emerald-600" />
                      </div>

                      <div className="min-w-0">
                        <div
                          className="max-w-[210px] truncate text-sm font-semibold text-gray-900"
                          title={propertyName}
                        >
                          {propertyName}
                        </div>

                        <div
                          className="mt-0.5 max-w-[210px] truncate text-[11px] text-gray-500"
                          title={apartmentName}
                        >
                          {apartmentName}
                        </div>

                        <div className="mt-0.5 text-[11px] font-semibold text-gray-700">
                          Unit {unitName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Dates */}

                  <td className="px-5 py-5 align-middle">
                    <DateRange
                      startDate={startDate}
                      endDate={endDate}
                    />
                  </td>

                  {/* Total */}

                  <td className="px-5 py-5 text-right align-middle">
                    <span
                      className="whitespace-nowrap text-sm font-bold text-gray-900"
                      title={formatFinancialValue(
                        total,
                        hasFinancialData,
                      )}
                    >
                      {formatFinancialValue(
                        total,
                        hasFinancialData,
                      )}
                    </span>
                  </td>

                  {/* Paid */}

                  <td className="px-5 py-5 text-right align-middle">
                    <span
                      className={`whitespace-nowrap text-sm font-semibold ${paid > 0
                        ? "text-emerald-600"
                        : "text-gray-500"
                        }`}
                      title={formatFinancialValue(
                        paid,
                        hasFinancialData,
                      )}
                    >
                      {formatFinancialValue(
                        paid,
                        hasFinancialData,
                      )}
                    </span>
                  </td>

                  {/* Balance */}

                  <td className="px-5 py-5 text-right align-middle">
                    <span
                      className={`whitespace-nowrap text-sm font-semibold ${hasBalance
                        ? "text-amber-600"
                        : "text-emerald-600"
                        }`}
                      title={formatFinancialValue(
                        balance,
                        hasFinancialData,
                      )}
                    >
                      {formatFinancialValue(
                        balance,
                        hasFinancialData,
                      )}
                    </span>
                  </td>

                  {/* Status */}

                  <td className="px-5 py-5 align-middle">
                    <BookingStatusBadge
                      status={status}
                    />
                  </td>

                  {/* Payment */}

                  <td className="px-5 py-5 align-middle">
                    <BookingPaymentBadge
                      status={paymentStatus}
                    />
                  </td>

                  {/* Actions */}

                  <td className="px-5 py-5 align-middle">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View */}

                      {bookingId && (
                        <Link
                          to={`/super-admin/bookings/${encodeURIComponent(
                            bookingId,
                          )}`}
                          onClick={() =>
                            onView?.(source)
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          title="View booking"
                          aria-label="View booking"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      )}

                      {/* Edit
                       *
                       * IMPORTANT:
                       * Do NOT pass the complete booking object
                       * into the URL.
                       *
                       * bookingId is already normalized to a
                       * primitive string.
                       */}

                      {bookingId && (
                        <Link
                          to={`/super-admin/bookings/${encodeURIComponent(
                            bookingId,
                          )}/edit`}
                          onClick={() =>
                            onEdit?.(bookingId, source)
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          title="Edit booking"
                          aria-label="Edit booking"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      )}

                      {/* More / Delete */}

                      {onDelete && (
                        <button
                          type="button"
                          onClick={() =>
                            onDelete(source)
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="More actions"
                          aria-label="More actions"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================================================================
          MOBILE
      ================================================================ */}

      <div className="divide-y divide-gray-100 lg:hidden">
        {normalizedBookings.map((booking) => {
          const {
            key,
            source,
            bookingId,
            bookingNumber,
            bookingType,
            sourceLabel,
            customerName,
            customerEmail,
            customerPhone,
            propertyName,
            apartmentName,
            unitName,
            startDate,
            endDate,
            status,
            paymentStatus,
            financials,
          } = booking;

          const {
            total,
            paid,
            balance,
            hasBalance,
            hasFinancialData,
          } = financials;

          return (
            <div
              key={key}
              className="p-4 transition-colors hover:bg-gray-50/60"
            >
              {/* Header */}

              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <FileText className="h-5 w-5 text-gray-500" />
                  </div>

                  <div className="min-w-0">
                    <div
                      className="truncate text-sm font-bold text-gray-900"
                      title={bookingNumber}
                    >
                      {bookingNumber}
                    </div>

                    <div className="mt-0.5 text-xs font-medium text-gray-500">
                      {bookingType}
                    </div>

                    <div className="mt-0.5 text-[10px] text-gray-400">
                      {sourceLabel}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <BookingStatusBadge
                    status={status}
                  />
                </div>
              </div>

              {/* Customer */}

              <div className="mt-4 bg-gray-50/80 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
                    <UserRound className="h-4 w-4 text-blue-600" />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900">
                      {customerName}
                    </div>

                    {customerEmail !== "—" ? (
                      <div className="mt-0.5 truncate text-xs text-gray-500">
                        {customerEmail}
                      </div>
                    ) : customerPhone !== "—" ? (
                      <div className="mt-0.5 text-xs text-gray-500">
                        {customerPhone}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Property */}

              <div className="mt-4 bg-white p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                    <Home className="h-4 w-4 text-emerald-600" />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900">
                      {propertyName}
                    </div>

                    <div className="mt-0.5 truncate text-xs text-gray-500">
                      {apartmentName}
                    </div>

                    <div className="mt-0.5 text-xs font-semibold text-gray-700">
                      Unit {unitName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates */}

              <div className="mt-4 bg-gray-50/70 p-3">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Booking Period
                </div>

                <DateRange
                  startDate={startDate}
                  endDate={endDate}
                  mobile
                />
              </div>

              {/* Amounts */}

              <div className="mt-4 grid grid-cols-3 gap-3">
                {/* Total */}

                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Total
                  </div>

                  <div
                    className="mt-1 whitespace-nowrap text-sm font-bold text-gray-900"
                    title={formatFinancialValue(
                      total,
                      hasFinancialData,
                    )}
                  >
                    {formatFinancialValue(
                      total,
                      hasFinancialData,
                    )}
                  </div>
                </div>

                {/* Paid */}

                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Paid
                  </div>

                  <div
                    className={`mt-1 whitespace-nowrap text-sm font-semibold ${paid > 0
                      ? "text-emerald-600"
                      : "text-gray-500"
                      }`}
                    title={formatFinancialValue(
                      paid,
                      hasFinancialData,
                    )}
                  >
                    {formatFinancialValue(
                      paid,
                      hasFinancialData,
                    )}
                  </div>
                </div>

                {/* Balance */}

                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Balance
                  </div>

                  <div
                    className={`mt-1 whitespace-nowrap text-sm font-semibold ${hasBalance
                      ? "text-amber-600"
                      : "text-emerald-600"
                      }`}
                    title={formatFinancialValue(
                      balance,
                      hasFinancialData,
                    )}
                  >
                    {formatFinancialValue(
                      balance,
                      hasFinancialData,
                    )}
                  </div>
                </div>
              </div>

              {/* Payment */}

              <div className="mt-4 flex items-center justify-between bg-white px-1 py-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Payment
                </span>

                <BookingPaymentBadge
                  status={paymentStatus}
                />
              </div>

              {/* Source */}

              <div className="flex items-center justify-between px-1 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Source
                </span>

                <span className="text-xs font-semibold text-gray-600">
                  {sourceLabel}
                </span>
              </div>

              {/* Actions */}

              <div className="mt-4 flex items-center gap-2">
                {/* View */}

                {bookingId && (
                  <Link
                    to={`/super-admin/bookings/${encodeURIComponent(
                      bookingId,
                    )}`}
                    onClick={() =>
                      onView?.(source)
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Link>
                )}

                {/* Edit */}

                {bookingId && (
                  <Link
                    to={`/super-admin/bookings/${encodeURIComponent(
                      bookingId,
                    )}/edit`}
                    onClick={() =>
                      onEdit?.(bookingId, source)
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                )}

                {/* More / Delete */}

                {onDelete && (
                  <button
                    type="button"
                    onClick={() =>
                      onDelete(source)
                    }
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="More actions"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingTable;

