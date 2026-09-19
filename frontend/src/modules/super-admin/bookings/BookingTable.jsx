import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Home,
  MoreHorizontal,
  Pencil,
  UserRound,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

import BookingStatusBadge from "./BookingStatusBadge";
import BookingPaymentBadge from "./BookingPaymentBadge";

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

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

/**
 * Format currency using Kenyan Shillings.
 */
const formatCurrency = (value) => {
  const amount = toNumber(value);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date safely.
 */
const formatDate = (value) => {
  if (!value) return "—";

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
| Customer Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get customer object from all supported booking structures.
 */
const getCustomer = (booking) => {
  return (
    booking?.customer ||
    booking?.customer_user ||
    booking?.user ||
    null
  );
};

/**
 * Get customer name.
 */
const getCustomerName = (booking) => {
  const customer = getCustomer(booking);

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

/**
 * Get customer email.
 */
const getCustomerEmail = (booking) => {
  const customer = getCustomer(booking);

  return customer?.email || "No email";
};

/**
 * Get customer phone.
 */
const getCustomerPhone = (booking) => {
  const customer = getCustomer(booking);

  return (
    customer?.phone ||
    customer?.phone_number ||
    ""
  );
};

/*
|--------------------------------------------------------------------------
| Property Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get property name safely.
 */
const getPropertyName = (booking) => {
  const property = booking?.property;

  return (
    property?.name ||
    property?.title ||
    property?.property_name ||
    property?.slug ||
    (booking?.property_id
      ? `Property #${booking.property_id}`
      : "No property")
  );
};

/**
 * Get apartment name safely.
 */
const getApartmentName = (booking) => {
  const apartment = booking?.apartment;

  return (
    apartment?.name ||
    apartment?.title ||
    apartment?.apartment_name ||
    apartment?.slug ||
    (booking?.apartment_id
      ? `Apartment #${booking.apartment_id}`
      : null)
  );
};

/**
 * Get unit name/number safely.
 */
const getUnitName = (booking) => {
  const unit = booking?.unit;

  return (
    unit?.unit_number ||
    unit?.number ||
    unit?.name ||
    unit?.unit_name ||
    (booking?.unit_id
      ? `Unit #${booking.unit_id}`
      : "—")
  );
};

/*
|--------------------------------------------------------------------------
| Booking Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get booking type label.
 */
const getBookingTypeLabel = (type) => {
  const labels = {
    viewing: "Viewing",
    reservation: "Reservation",
    rental: "Rental",
  };

  return labels[type] || type || "—";
};

/**
 * Get booking type badge classes.
 */
const getBookingTypeClasses = (type) => {
  const classes = {
    viewing:
      "bg-blue-50 text-blue-700 ring-blue-600/10",

    reservation:
      "bg-purple-50 text-purple-700 ring-purple-600/10",

    rental:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  };

  return (
    classes[type] ||
    "bg-gray-50 text-gray-700 ring-gray-600/10"
  );
};

/**
 * Get booking number.
 */
const getBookingNumber = (booking) => {
  return (
    booking?.booking_number ||
    booking?.reference ||
    booking?.slug ||
    `#${booking?.id ?? "—"}`
  );
};

/*
|--------------------------------------------------------------------------
| Financial Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get booking financial information.
 *
 * IMPORTANT:
 * The backend returns financial information inside:
 *
 * booking.financials
 *
 * Example:
 *
 * financials: {
 *   rent_amount: "70000.00",
 *   deposit_amount: "70000.00",
 *   service_charge: "6000.00",
 *   booking_fee: "3000.00",
 *   discount_amount: "2000.00",
 *   total_amount: "147000.00",
 *   amount_paid: "147000.00",
 *   balance: "0.00",
 *   is_fully_paid: true,
 *   is_partially_paid: false,
 *   has_balance: false
 * }
 *
 * We intentionally prioritize the nested financials object.
 */
const getBookingFinancials = (booking) => {
  const financials = booking?.financials ?? {};

  const total = toNumber(
    financials?.total_amount ??
    booking?.total_amount ??
    booking?.total ??
    booking?.amount
  );

  /*
   * Total Paid MUST come from:
   *
   * booking.financials.amount_paid
   */
  const paid = toNumber(
    financials?.amount_paid ??
    booking?.amount_paid ??
    booking?.paid_amount ??
    booking?.paid
  );

  /*
   * Balance comes directly from the backend.
   *
   * Do not calculate this in the frontend because
   * deposits, service charges, booking fees and discounts
   * may affect the final balance.
   */
  const balance = toNumber(
    financials?.balance ??
    booking?.balance ??
    booking?.balance_amount ??
    booking?.outstanding_balance
  );

  const isFullyPaid =
    financials?.is_fully_paid === true;

  const isPartiallyPaid =
    financials?.is_partially_paid === true;

  const hasBalance =
    financials?.has_balance === true ||
    balance > 0;

  return {
    total,
    paid,
    balance,
    isFullyPaid,
    isPartiallyPaid,
    hasBalance,
  };
};

/*
|--------------------------------------------------------------------------
| Booking Table
|--------------------------------------------------------------------------
*/

const BookingTable = ({
  bookings = [],
  loading = false,
  onView,
  onEdit,
  onAction,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Empty State
  |--------------------------------------------------------------------------
  */

  if (
    !loading &&
    (!Array.isArray(bookings) ||
      bookings.length === 0)
  ) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <FileText
              className="h-8 w-8 text-gray-400"
              aria-hidden="true"
            />
          </div>

          <h3 className="text-base font-semibold text-gray-900">
            No bookings found
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
            There are no bookings matching your current
            filters. Try adjusting your search or filter
            criteria.
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Booking",
                  "Customer",
                  "Property",
                  "Booking Date",
                  "Amount",
                  "Status",
                  "Payment",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {Array.from({ length: 6 }).map(
                (_, index) => (
                  <tr
                    key={index}
                    className="animate-pulse"
                  >
                    {Array.from({ length: 8 }).map(
                      (_, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-6 py-5"
                        >
                          <div className="h-4 rounded bg-gray-200" />
                        </td>
                      )
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile loading */}
        <div className="space-y-4 p-4 lg:hidden">
          {Array.from({ length: 5 }).map(
            (_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-xl border border-gray-200 p-4"
              >
                <div className="mb-4 h-4 w-1/3 rounded bg-gray-200" />
                <div className="mb-3 h-4 w-2/3 rounded bg-gray-200" />
                <div className="mb-3 h-4 w-1/2 rounded bg-gray-200" />
                <div className="h-4 w-1/4 rounded bg-gray-200" />
              </div>
            )
          )}
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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Desktop / Tablet Table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/80">
            <tr>
              <th
                scope="col"
                className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Booking
              </th>

              <th
                scope="col"
                className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Customer
              </th>

              <th
                scope="col"
                className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Property
              </th>

              <th
                scope="col"
                className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Date
              </th>

              <th
                scope="col"
                className="whitespace-nowrap px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Amount
              </th>

              <th
                scope="col"
                className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Status
              </th>

              <th
                scope="col"
                className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Payment
              </th>

              <th
                scope="col"
                className="whitespace-nowrap px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {bookings.map((booking) => {
              const bookingId = booking?.id;

              const financials =
                getBookingFinancials(booking);

              const propertyName =
                getPropertyName(booking);

              const apartmentName =
                getApartmentName(booking);

              const unitName =
                getUnitName(booking);

              const customerName =
                getCustomerName(booking);

              const customerEmail =
                getCustomerEmail(booking);

              const customerPhone =
                getCustomerPhone(booking);

              return (
                <tr
                  key={bookingId}
                  className="group transition-colors hover:bg-gray-50/70"
                >
                  {/* Booking */}
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <FileText
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0">
                        <Link
                          to={`/super-admin/bookings/${bookingId}`}
                          className="block max-w-[180px] truncate text-sm font-semibold text-gray-900 transition-colors hover:text-indigo-600"
                          title={getBookingNumber(
                            booking
                          )}
                        >
                          {getBookingNumber(booking)}
                        </Link>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getBookingTypeClasses(
                              booking?.booking_type
                            )}`}
                          >
                            {getBookingTypeLabel(
                              booking?.booking_type
                            )}
                          </span>

                          {booking?.source && (
                            <span className="text-xs text-gray-400">
                              {booking.source}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                        <UserRound
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="max-w-[180px] truncate text-sm font-semibold text-gray-900">
                          {customerName}
                        </div>

                        <div className="mt-1 max-w-[190px] truncate text-xs text-gray-500">
                          {customerEmail}
                        </div>

                        {customerPhone && (
                          <div className="mt-0.5 text-xs text-gray-400">
                            {customerPhone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Property */}
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <Home
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0">
                        <div
                          className="max-w-[210px] truncate text-sm font-medium text-gray-900"
                          title={propertyName}
                        >
                          {propertyName}
                        </div>

                        {apartmentName && (
                          <div
                            className="mt-1 max-w-[210px] truncate text-xs text-gray-500"
                            title={apartmentName}
                          >
                            {apartmentName}
                          </div>
                        )}

                        <div className="mt-1 text-xs text-gray-400">
                          Unit {unitName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Booking Date */}
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-start gap-2">
                      <CalendarDays
                        className="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
                        aria-hidden="true"
                      />

                      <div>
                        <div className="whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatDate(
                            booking?.booking_date
                          )}
                        </div>

                        {booking?.start_date && (
                          <div className="mt-1 text-xs text-gray-500">
                            {formatDate(
                              booking.start_date
                            )}

                            {booking?.end_date &&
                              ` – ${formatDate(
                                booking.end_date
                              )}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-5 text-right align-top">
                    <div className="flex justify-end">
                      <div className="text-right">
                        {/* Total */}
                        <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                          Total
                        </div>

                        <div className="mt-0.5 text-sm font-bold text-gray-900">
                          {formatCurrency(
                            financials.total
                          )}
                        </div>

                        {/* Total Paid */}
                        <div className="mt-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                          Total Paid
                        </div>

                        <div className="mt-0.5 flex items-center justify-end gap-1 text-sm font-semibold text-emerald-600">
                          <CheckCircle2
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />

                          {formatCurrency(
                            financials.paid
                          )}
                        </div>

                        {/* Balance */}
                        {financials.hasBalance && (
                          <div className="mt-1 flex items-center justify-end gap-1 text-xs font-medium text-amber-600">
                            <Clock3
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />

                            Balance{" "}
                            {formatCurrency(
                              financials.balance
                            )}
                          </div>
                        )}

                        {/* Fully Paid */}
                        {financials.isFullyPaid &&
                          !financials.hasBalance && (
                            <div className="mt-0.5 text-[11px] font-medium text-emerald-500">
                              Fully paid
                            </div>
                          )}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-5 align-top">
                    <BookingStatusBadge
                      status={booking?.status}
                    />
                  </td>

                  {/* Payment */}
                  <td className="px-6 py-5 align-top">
                    <BookingPaymentBadge
                      status={booking?.payment_status}
                    />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-5 text-right align-top">
                    <div className="flex items-center justify-end gap-1">
                      {/* View */}
                      <Link
                        to={`/super-admin/bookings/${bookingId}`}
                        onClick={() =>
                          onView?.(booking)
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        title="View booking"
                        aria-label={`View booking ${getBookingNumber(
                          booking
                        )}`}
                      >
                        <Eye
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </Link>

                      {/* Edit */}
                      <Link
                        to={`/super-admin/bookings/${bookingId}/edit`}
                        onClick={() =>
                          onEdit?.(booking)
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        title="Edit booking"
                        aria-label={`Edit booking ${getBookingNumber(
                          booking
                        )}`}
                      >
                        <Pencil
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </Link>

                      {/* More */}
                      {onAction && (
                        <button
                          type="button"
                          onClick={() =>
                            onAction(booking)
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          title="More actions"
                          aria-label={`More actions for ${getBookingNumber(
                            booking
                          )}`}
                        >
                          <MoreHorizontal
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
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

      {/* Mobile / Small Tablet Cards */}
      <div className="divide-y divide-gray-100 lg:hidden">
        {bookings.map((booking) => {
          const bookingId = booking?.id;

          const financials =
            getBookingFinancials(booking);

          const propertyName =
            getPropertyName(booking);

          const apartmentName =
            getApartmentName(booking);

          const unitName =
            getUnitName(booking);

          const customerName =
            getCustomerName(booking);

          const customerEmail =
            getCustomerEmail(booking);

          const customerPhone =
            getCustomerPhone(booking);

          return (
            <div
              key={bookingId}
              className="p-4 transition-colors hover:bg-gray-50/70 sm:p-5"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <FileText
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <Link
                      to={`/super-admin/bookings/${bookingId}`}
                      className="block truncate text-sm font-bold text-gray-900 hover:text-indigo-600"
                    >
                      {getBookingNumber(booking)}
                    </Link>

                    <div className="mt-1 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getBookingTypeClasses(
                          booking?.booking_type
                        )}`}
                      >
                        {getBookingTypeLabel(
                          booking?.booking_type
                        )}
                      </span>

                      {booking?.source && (
                        <span className="text-xs text-gray-400">
                          {booking.source}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <BookingStatusBadge
                    status={booking?.status}
                  />
                </div>
              </div>

              {/* Customer */}
              <div className="mt-5 rounded-xl bg-gray-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm ring-1 ring-gray-200">
                    <UserRound
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900">
                      {customerName}
                    </div>

                    <div className="truncate text-xs text-gray-500">
                      {customerEmail}
                    </div>

                    {customerPhone && (
                      <div className="text-xs text-gray-400">
                        {customerPhone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Property */}
              <div className="mt-4 flex items-start gap-3">
                <Home
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />

                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-900">
                    {propertyName}
                  </div>

                  {apartmentName && (
                    <div className="mt-1 truncate text-xs text-gray-500">
                      {apartmentName}
                    </div>
                  )}

                  <div className="mt-1 text-xs text-gray-400">
                    Unit {unitName}
                  </div>
                </div>
              </div>

              {/* Date */}
              <div className="mt-4 flex items-start gap-3">
                <CalendarDays
                  className="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
                  aria-hidden="true"
                />

                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(
                      booking?.booking_date
                    )}
                  </div>

                  {booking?.start_date && (
                    <div className="mt-1 text-xs text-gray-500">
                      {formatDate(
                        booking.start_date
                      )}

                      {booking?.end_date &&
                        ` – ${formatDate(
                          booking.end_date
                        )}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* Total */}
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Wallet
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />

                    Total
                  </div>

                  <div className="mt-1 text-sm font-bold text-gray-900">
                    {formatCurrency(
                      financials.total
                    )}
                  </div>
                </div>

                {/* Total Paid */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-emerald-600"
                      aria-hidden="true"
                    />

                    Total Paid
                  </div>

                  <div className="mt-1 text-sm font-bold text-emerald-600">
                    {formatCurrency(
                      financials.paid
                    )}
                  </div>
                </div>

                {/* Balance */}
                {financials.hasBalance && (
                  <div className="col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
                      <Clock3
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />

                      Outstanding Balance
                    </div>

                    <div className="mt-1 text-sm font-bold text-amber-800">
                      {formatCurrency(
                        financials.balance
                      )}
                    </div>
                  </div>
                )}

                {/* Fully Paid */}
                {financials.isFullyPaid &&
                  !financials.hasBalance && (
                    <div className="col-span-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
                      <CheckCircle2
                        className="h-4 w-4"
                        aria-hidden="true"
                      />

                      Booking fully paid
                    </div>
                  )}
              </div>

              {/* Payment */}
              <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-3">
                <span className="text-xs font-medium text-gray-500">
                  Payment Status
                </span>

                <BookingPaymentBadge
                  status={booking?.payment_status}
                />
              </div>

              {/* Actions */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  to={`/super-admin/bookings/${bookingId}`}
                  onClick={() =>
                    onView?.(booking)
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <Eye
                    className="h-4 w-4"
                    aria-hidden="true"
                  />

                  View
                </Link>

                <Link
                  to={`/super-admin/bookings/${bookingId}/edit`}
                  onClick={() =>
                    onEdit?.(booking)
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  <Pencil
                    className="h-4 w-4"
                    aria-hidden="true"
                  />

                  Edit
                </Link>
              </div>

              {onAction && (
                <button
                  type="button"
                  onClick={() =>
                    onAction(booking)
                  }
                  className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <MoreHorizontal
                    className="h-4 w-4"
                    aria-hidden="true"
                  />

                  More Actions
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Table Footer */}
      {bookings.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50/50 px-4 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {bookings.length}
            </span>{" "}
            {bookings.length === 1
              ? "booking"
              : "bookings"}
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2
              className="h-3.5 w-3.5 text-emerald-500"
              aria-hidden="true"
            />

            <span>
              Booking information updated from the
              latest available records.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingTable;