import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  Home,
  Loader2,
  Phone,
  RefreshCw,
  UserRound,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import BookingHeader from "./BookingHeader";
import BookingStatusBadge from "./BookingStatusBadge";
import BookingPaymentBadge from "./BookingPaymentBadge";
import { useBooking } from "../../../hooks/useBooking";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(toNumber(value));

const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE").format(toNumber(value));

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

const formatDateTime = (value) => {
  if (!value) return "—";

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

const getId = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (typeof value === "object") {
    return String(value?.id ?? "");
  }

  return String(value);
};

const getFullName = (person) => {
  if (!person) {
    return "—";
  }

  const directName =
    person?.name ||
    person?.full_name ||
    person?.fullName;

  if (directName) {
    return directName;
  }

  const composedName = [
    person?.first_name,
    person?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return composedName || "—";
};

const getCustomer = (booking) =>
  booking?.customer ||
  booking?.customer_user ||
  booking?.user ||
  null;

const getCustomerName = (booking) => {
  const customer = getCustomer(booking);

  const name = getFullName(customer);

  if (name !== "—") {
    return name;
  }

  const customerId =
    booking?.customer_id ??
    booking?.user_id;

  return customerId
    ? `Customer #${customerId}`
    : "—";
};

const getCustomerEmail = (booking) => {
  const customer = getCustomer(booking);

  return (
    customer?.email ||
    booking?.customer_email ||
    "—"
  );
};

const getCustomerPhone = (booking) => {
  const customer = getCustomer(booking);

  return (
    customer?.phone ||
    customer?.phone_number ||
    booking?.customer_phone ||
    "—"
  );
};

const getTenant = (booking) =>
  booking?.tenant ||
  booking?.tenant_profile ||
  null;

const getTenantUser = (booking) =>
  getTenant(booking)?.user ||
  booking?.tenant?.user ||
  null;

const getTenantName = (booking) => {
  const tenant = getTenant(booking);
  const tenantUser = getTenantUser(booking);

  const tenantUserName = getFullName(tenantUser);

  if (tenantUserName !== "—") {
    return tenantUserName;
  }

  const tenantName = getFullName(tenant);

  if (tenantName !== "—") {
    return tenantName;
  }

  return booking?.tenant_id
    ? `Tenant #${booking.tenant_id}`
    : "—";
};

const getPropertyName = (booking) => {
  const property = booking?.property;

  return (
    property?.name ||
    property?.title ||
    property?.property_name ||
    property?.slug ||
    (booking?.property_id
      ? `Property #${booking.property_id}`
      : "—")
  );
};

const getApartmentName = (booking) => {
  const apartment = booking?.apartment;

  return (
    apartment?.name ||
    apartment?.title ||
    apartment?.block_name ||
    (booking?.apartment_id
      ? `Apartment #${booking.apartment_id}`
      : "—")
  );
};

const getUnitName = (booking) => {
  const unit = booking?.unit;

  return (
    unit?.unit_number ||
    unit?.number ||
    unit?.name ||
    unit?.code ||
    (booking?.unit_id
      ? `Unit #${booking.unit_id}`
      : "—")
  );
};

const getBookingTypeLabel = (value) => {
  const labels = {
    viewing: "Viewing",
    reservation: "Reservation",
    rental: "Rental",
  };

  return labels[value] || value || "—";
};

const getSourceLabel = (value) => {
  const labels = {
    website: "Website",
    walk_in: "Walk In",
    phone: "Phone",
    referral: "Referral",
    agent: "Agent",
    social_media: "Social Media",
    other: "Other",
  };

  return labels[value] || value || "—";
};

const getPaymentMethodLabel = (value) => {
  const labels = {
    mpesa: "M-Pesa",
    bank_transfer: "Bank Transfer",
    cash: "Cash",
    card: "Card",
    cheque: "Cheque",
    online: "Online",
    other: "Other",
  };

  return labels[value] || value || "—";
};

const getBookingNumber = (booking) =>
  booking?.booking_number ||
  booking?.reference ||
  `Booking #${booking?.id ?? "—"}`;

const getFinancialValue = (booking, key) =>
  booking?.[key] ??
  booking?.financials?.[key] ??
  booking?.payment?.[key] ??
  0;

const getTotal = (booking) => {
  const explicitTotal =
    booking?.total_amount ??
    booking?.financials?.total_amount ??
    booking?.financials?.total;

  if (
    explicitTotal !== undefined &&
    explicitTotal !== null &&
    explicitTotal !== ""
  ) {
    return toNumber(explicitTotal);
  }

  return (
    toNumber(
      getFinancialValue(
        booking,
        "rent_amount"
      )
    ) +
    toNumber(
      getFinancialValue(
        booking,
        "deposit_amount"
      )
    ) +
    toNumber(
      getFinancialValue(
        booking,
        "service_charge"
      )
    ) +
    toNumber(
      getFinancialValue(
        booking,
        "booking_fee"
      )
    ) -
    toNumber(
      getFinancialValue(
        booking,
        "discount"
      )
    )
  );
};

const getPaid = (booking) =>
  toNumber(
    booking?.paid_amount ??
    booking?.amount_paid ??
    booking?.financials?.paid_amount ??
    booking?.financials?.paid ??
    booking?.payment?.amount_paid
  );

const getBalance = (booking) => {
  const explicitBalance =
    booking?.balance_amount ??
    booking?.balance ??
    booking?.financials?.balance_amount ??
    booking?.financials?.balance;

  if (
    explicitBalance !== undefined &&
    explicitBalance !== null &&
    explicitBalance !== ""
  ) {
    return toNumber(explicitBalance);
  }

  return Math.max(
    getTotal(booking) - getPaid(booking),
    0
  );
};

const getStatus = (booking) =>
  String(
    booking?.status || ""
  ).toLowerCase();

const getPaymentStatus = (booking) =>
  String(
    booking?.payment_status || ""
  ).toLowerCase();

const extractErrorMessage = (
  error,
  fallback = "Unable to load booking."
) =>
  error?.message ||
  error?.error ||
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

/*
|--------------------------------------------------------------------------
| Small UI Components
|--------------------------------------------------------------------------
*/

const DetailItem = ({
  label,
  value,
  icon: Icon,
  children,
  className = "",
}) => (
  <div className={`min-w-0 ${className}`}>
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
      {Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}

      <span>{label}</span>
    </div>

    <div className="mt-1 break-words text-sm font-semibold text-slate-900">
      {children ?? value ?? "—"}
    </div>
  </div>
);

const Section = ({
  title,
  description,
  icon: Icon,
  children,
  action,
}) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}

        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">
            {title}
          </h2>

          {description ? (
            <p className="mt-0.5 text-sm text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {action}
    </div>

    <div className="p-4 sm:p-6">
      {children}
    </div>
  </section>
);

const LoadingBlock = () => (
  <div className="space-y-6">
    <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />

    <div className="grid gap-6 lg:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-52 animate-pulse rounded-2xl bg-slate-100"
        />
      ))}
    </div>
  </div>
);

const StatCard = ({
  label,
  value,
  icon: Icon,
  tone = "slate",
}) => {
  const tones = {
    slate:
      "bg-slate-50 text-slate-700 ring-slate-200",
    emerald:
      "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber:
      "bg-amber-50 text-amber-700 ring-amber-200",
    rose:
      "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>

          <p className="mt-2 truncate text-xl font-bold text-slate-900 sm:text-2xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${tones[tone] || tones.slate
            }`}
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

const BookingDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    getBooking,
    confirmBooking,
    approveBooking,
    checkInBooking,
    completeBooking,
    cancelBooking,
    rejectBooking,
    expireBooking,
    loading,
    loadingGet,
    error,
  } = useBooking();

  const [booking, setBooking] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Booking
  |--------------------------------------------------------------------------
  */

  const loadBooking = useCallback(async () => {
    if (!id) {
      setPageError("Booking ID is missing.");
      setLoadingPage(false);
      return;
    }

    setLoadingPage(true);
    setPageError("");

    try {
      const response = await getBooking(id);

      const result =
        response?.data?.data ??
        response?.data ??
        response;

      const resolvedBooking =
        result?.data ??
        result?.booking ??
        result;

      if (
        !resolvedBooking ||
        typeof resolvedBooking !== "object" ||
        Array.isArray(resolvedBooking)
      ) {
        throw new Error(
          "Booking details were not found."
        );
      }

      setBooking(resolvedBooking);
    } catch (requestError) {
      setPageError(
        extractErrorMessage(
          requestError,
          "Unable to load booking details."
        )
      );
    } finally {
      setLoadingPage(false);
    }
  }, [getBooking, id]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  /*
  |--------------------------------------------------------------------------
  | Action Helper
  |--------------------------------------------------------------------------
  */

  const bookingId = booking?.id;

  const runAction = useCallback(
    async ({
      action,
      title,
      successMessage,
      confirmText = "Yes, continue",
      input = false,
      inputLabel = "",
      inputPlaceholder = "",
      inputRequired = false,
    }) => {
      if (!bookingId) {
        return;
      }

      let reason = "";

      if (input) {
        const result = await Swal.fire({
          title,
          input: "textarea",
          inputLabel,
          inputPlaceholder,
          inputAttributes: {
            "aria-label": inputLabel,
          },
          showCancelButton: true,
          confirmButtonText: confirmText,
          cancelButtonText: "Cancel",
          reverseButtons: true,
          inputValidator: (value) => {
            if (
              inputRequired &&
              !value?.trim()
            ) {
              return "This field is required.";
            }

            return undefined;
          },
        });

        if (!result.isConfirmed) {
          return;
        }

        reason =
          result.value?.trim() || "";
      } else {
        const result = await Swal.fire({
          title,
          text:
            "This action will update the booking workflow status.",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: confirmText,
          cancelButtonText: "Cancel",
          reverseButtons: true,
        });

        if (!result.isConfirmed) {
          return;
        }
      }

      setActionLoading(true);
      setPageError("");

      try {
        let response;

        switch (action) {
          case "confirm":
            response =
              await confirmBooking(bookingId);
            break;

          case "approve":
            response =
              await approveBooking(bookingId);
            break;

          case "check-in":
            response =
              await checkInBooking(bookingId);
            break;

          case "complete":
            response =
              await completeBooking(bookingId);
            break;

          case "cancel":
            response =
              await cancelBooking(bookingId);
            break;

          case "reject":
            response =
              await rejectBooking(
                bookingId,
                reason
              );
            break;

          case "expire":
            response =
              await expireBooking(bookingId);
            break;

          default:
            throw new Error(
              "Unsupported booking action."
            );
        }

        if (response?.success === false) {
          throw new Error(
            response?.message ||
            response?.error ||
            "The booking action failed."
          );
        }

        await Swal.fire({
          icon: "success",
          title: "Updated",
          text:
            response?.message ||
            successMessage ||
            "Booking updated successfully.",
          confirmButtonText: "OK",
        });

        await loadBooking();
      } catch (requestError) {
        const message = extractErrorMessage(
          requestError,
          "Unable to update the booking."
        );

        setPageError(message);

        await Swal.fire({
          icon: "error",
          title: "Action Failed",
          text: message,
          confirmButtonText: "OK",
        });
      } finally {
        setActionLoading(false);
      }
    },
    [
      approveBooking,
      bookingId,
      cancelBooking,
      checkInBooking,
      completeBooking,
      confirmBooking,
      expireBooking,
      loadBooking,
      rejectBooking,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Derived Values
  |--------------------------------------------------------------------------
  |
  | These are intentionally plain calculations instead of useMemo().
  | They are inexpensive and this keeps the component React Compiler friendly.
  |
  */

  const bookingStatus = getStatus(booking);
  const paymentStatus = getPaymentStatus(booking);

  const totalAmount = getTotal(booking);
  const paidAmount = getPaid(booking);
  const balanceAmount = getBalance(booking);

  const paymentProgress =
    totalAmount > 0
      ? Math.min(
        Math.round(
          (paidAmount / totalAmount) * 100
        ),
        100
      )
      : 0;

  /*
  |--------------------------------------------------------------------------
  | Workflow Actions
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | Do NOT wrap this in useMemo().
  |
  | React Compiler was reporting:
  | "inferred dependency was booking"
  |
  | The array is small and cheap to create.
  |--------------------------------------------------------------------------
  */

  const workflowActions = [];

  if (booking) {
    if (bookingStatus === "pending") {
      workflowActions.push({
        key: "confirm",
        label: "Confirm Booking",
        icon: CheckCircle2,
        className:
          "bg-blue-600 text-white hover:bg-blue-700",
        onClick: () =>
          runAction({
            action: "confirm",
            title: "Confirm this booking?",
            successMessage:
              "Booking confirmed successfully.",
          }),
      });
    }

    if (
      bookingStatus === "pending" ||
      bookingStatus === "confirmed"
    ) {
      workflowActions.push({
        key: "approve",
        label: "Approve",
        icon: CheckCircle2,
        className:
          "bg-emerald-600 text-white hover:bg-emerald-700",
        onClick: () =>
          runAction({
            action: "approve",
            title: "Approve this booking?",
            successMessage:
              "Booking approved successfully.",
          }),
      });
    }

    if (
      bookingStatus === "confirmed" ||
      bookingStatus === "approved"
    ) {
      workflowActions.push({
        key: "check-in",
        label: "Check In",
        icon: Clock3,
        className:
          "bg-indigo-600 text-white hover:bg-indigo-700",
        onClick: () =>
          runAction({
            action: "check-in",
            title: "Check in this booking?",
            successMessage:
              "Booking checked in successfully.",
          }),
      });
    }

    if (
      bookingStatus === "approved" ||
      bookingStatus === "confirmed"
    ) {
      workflowActions.push({
        key: "complete",
        label: "Complete",
        icon: CheckCircle2,
        className:
          "bg-slate-900 text-white hover:bg-slate-800",
        onClick: () =>
          runAction({
            action: "complete",
            title: "Complete this booking?",
            successMessage:
              "Booking completed successfully.",
          }),
      });
    }

    if (
      bookingStatus !== "cancelled" &&
      bookingStatus !== "completed" &&
      bookingStatus !== "expired" &&
      bookingStatus !== "rejected"
    ) {
      workflowActions.push({
        key: "cancel",
        label: "Cancel",
        icon: XCircle,
        className:
          "bg-rose-600 text-white hover:bg-rose-700",
        onClick: () =>
          runAction({
            action: "cancel",
            title: "Cancel this booking?",
            successMessage:
              "Booking cancelled successfully.",
          }),
      });
    }

    if (
      bookingStatus !== "completed" &&
      bookingStatus !== "cancelled" &&
      bookingStatus !== "expired" &&
      bookingStatus !== "rejected"
    ) {
      workflowActions.push({
        key: "reject",
        label: "Reject",
        icon: XCircle,
        className:
          "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
        onClick: () =>
          runAction({
            action: "reject",
            title: "Reject this booking?",
            input: true,
            inputLabel: "Rejection reason",
            inputPlaceholder:
              "Enter the reason for rejecting this booking...",
            inputRequired: true,
            successMessage:
              "Booking rejected successfully.",
          }),
      });
    }

    if (
      bookingStatus !== "completed" &&
      bookingStatus !== "cancelled" &&
      bookingStatus !== "expired"
    ) {
      workflowActions.push({
        key: "expire",
        label: "Mark Expired",
        icon: Clock3,
        className:
          "border border-amber-200 bg-white text-amber-700 hover:bg-amber-50",
        onClick: () =>
          runAction({
            action: "expire",
            title:
              "Mark this booking as expired?",
            successMessage:
              "Booking marked as expired successfully.",
          }),
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loadingPage || loadingGet) {
    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <LoadingBlock />
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error / Not Found State
  |--------------------------------------------------------------------------
  */

  if (!booking) {
    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertCircle className="h-7 w-7" />
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Unable to load booking
            </h1>

            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              {pageError ||
                extractErrorMessage(
                  error,
                  "The requested booking could not be found."
                )}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={loadBooking}
                disabled={loadingPage}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingPage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}

                Try Again
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/super-admin/bookings"
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Bookings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Main Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">

        {/* Page Header */}

        <BookingHeader
          title={getBookingNumber(booking)}
          subtitle="Booking details and workflow"
          onRefresh={loadBooking}
          loading={
            loadingPage ||
            loading ||
            actionLoading
          }
        />

        {/* Error */}

        {pageError ? (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0">
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1">
                {pageError}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPageError("")}
              className="ml-auto shrink-0 rounded-lg p-1 text-rose-500 hover:bg-rose-100"
              aria-label="Dismiss error"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        ) : null}

        {/* Booking Summary */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-6 text-white sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-slate-200">
                    {getBookingNumber(booking)}
                  </span>

                  {booking?.reference ? (
                    <span className="rounded-lg bg-white/10 px-3 py-1 text-xs text-slate-300">
                      Ref: {booking.reference}
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
                  {getCustomerName(booking)}
                </h1>

                <p className="mt-2 text-sm text-slate-300">
                  {getBookingTypeLabel(
                    booking?.booking_type
                  )}

                  {booking?.source
                    ? ` • ${getSourceLabel(
                      booking.source
                    )}`
                    : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <BookingStatusBadge
                  status={booking?.status}
                />

                <BookingPaymentBadge
                  status={
                    booking?.payment_status
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-100 sm:grid-cols-4">
            <StatCard
              label="Booking Value"
              value={formatCurrency(
                totalAmount
              )}
              icon={Wallet}
              tone="slate"
            />

            <StatCard
              label="Amount Paid"
              value={formatCurrency(
                paidAmount
              )}
              icon={CheckCircle2}
              tone="emerald"
            />

            <StatCard
              label="Outstanding"
              value={formatCurrency(
                balanceAmount
              )}
              icon={Clock3}
              tone={
                balanceAmount > 0
                  ? "amber"
                  : "emerald"
              }
            />

            <StatCard
              label="Guests"
              value={formatNumber(
                booking?.total_guests ??
                booking?.occupancy?.total ??
                toNumber(
                  booking?.adults
                ) +
                toNumber(
                  booking?.children
                )
              )}
              icon={Users}
              tone="slate"
            />
          </div>
        </section>

        {/* Workflow Actions */}

        {workflowActions.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Booking Actions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Use workflow actions to update this booking.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {workflowActions.map(
                  (item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        disabled={
                          actionLoading
                        }
                        onClick={
                          item.onClick
                        }
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${item.className}`}
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}

                        {item.label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </section>
        ) : null}

        {/* Main Information */}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Customer */}

          <Section
            title="Customer Information"
            description="Customer and tenant information attached to this booking."
            icon={UserRound}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Customer"
                value={getCustomerName(
                  booking
                )}
                icon={UserRound}
              />

              <DetailItem
                label="Email"
                value={getCustomerEmail(
                  booking
                )}
              />

              <DetailItem
                label="Phone"
                value={getCustomerPhone(
                  booking
                )}
                icon={Phone}
              />

              <DetailItem
                label="Customer ID"
                value={
                  booking?.customer_id
                    ? `#${booking.customer_id}`
                    : "—"
                }
              />

              <DetailItem
                label="Tenant"
                value={getTenantName(
                  booking
                )}
                icon={Users}
              />

              <DetailItem
                label="Tenant ID"
                value={
                  booking?.tenant_id
                    ? `#${booking.tenant_id}`
                    : "—"
                }
              />
            </div>
          </Section>

          {/* Property */}

          <Section
            title="Property & Unit"
            description="Property hierarchy associated with the booking."
            icon={Home}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Property"
                value={getPropertyName(
                  booking
                )}
                icon={Home}
              />

              <DetailItem
                label="Property ID"
                value={
                  booking?.property_id
                    ? `#${booking.property_id}`
                    : "—"
                }
              />

              <DetailItem
                label="Apartment"
                value={getApartmentName(
                  booking
                )}
              />

              <DetailItem
                label="Apartment ID"
                value={
                  booking?.apartment_id
                    ? `#${booking.apartment_id}`
                    : "—"
                }
              />

              <DetailItem
                label="Unit"
                value={getUnitName(
                  booking
                )}
              />

              <DetailItem
                label="Unit ID"
                value={
                  booking?.unit_id
                    ? `#${booking.unit_id}`
                    : "—"
                }
              />
            </div>
          </Section>

          {/* Booking Details */}

          <Section
            title="Booking Details"
            description="Dates, type and booking source."
            icon={CalendarDays}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Booking Type"
                value={getBookingTypeLabel(
                  booking?.booking_type
                )}
              />

              <DetailItem
                label="Source"
                value={getSourceLabel(
                  booking?.source
                )}
              />

              <DetailItem
                label="Booking Date"
                value={formatDateTime(
                  booking?.booking_date
                )}
                icon={CalendarDays}
              />

              <DetailItem
                label="Start Date"
                value={formatDate(
                  booking?.start_date
                )}
              />

              <DetailItem
                label="End Date"
                value={formatDate(
                  booking?.end_date
                )}
              />

              <DetailItem
                label="Check In"
                value={formatDateTime(
                  booking?.check_in_at ??
                  booking?.check_in
                )}
              />

              <DetailItem
                label="Check Out"
                value={formatDateTime(
                  booking?.check_out_at ??
                  booking?.check_out
                )}
              />

              <DetailItem
                label="Completed At"
                value={formatDateTime(
                  booking?.completed_at
                )}
              />
            </div>
          </Section>

          {/* Payment */}

          <Section
            title="Payment Information"
            description="Financial summary and payment information."
            icon={Wallet}
          >
            <div className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <DetailItem label="Payment Status">
                  <BookingPaymentBadge
                    status={
                      paymentStatus
                    }
                  />
                </DetailItem>

                <DetailItem
                  label="Payment Method"
                  value={getPaymentMethodLabel(
                    booking?.payment_method
                  )}
                />

                <DetailItem
                  label="Payment Reference"
                  value={
                    booking?.payment_reference ||
                    booking?.mpesa_reference ||
                    booking?.transaction_reference ||
                    "—"
                  }
                />

                <DetailItem
                  label="Paid Date"
                  value={formatDateTime(
                    booking?.paid_date
                  )}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Total
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatCurrency(
                      totalAmount
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                    Paid
                  </p>

                  <p className="mt-1 text-lg font-bold text-emerald-800">
                    {formatCurrency(
                      paidAmount
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                    Balance
                  </p>

                  <p className="mt-1 text-lg font-bold text-amber-800">
                    {formatCurrency(
                      balanceAmount
                    )}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500">
                    Payment progress
                  </span>

                  <span className="text-slate-700">
                    {paymentProgress}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${paymentProgress}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Financial Breakdown */}

        <Section
          title="Financial Breakdown"
          description="Detailed booking charges and payment calculation."
          icon={Wallet}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem
              label="Rent Amount"
              value={formatCurrency(
                getFinancialValue(
                  booking,
                  "rent_amount"
                )
              )}
            />

            <DetailItem
              label="Deposit"
              value={formatCurrency(
                getFinancialValue(
                  booking,
                  "deposit_amount"
                )
              )}
            />

            <DetailItem
              label="Service Charge"
              value={formatCurrency(
                getFinancialValue(
                  booking,
                  "service_charge"
                )
              )}
            />

            <DetailItem
              label="Booking Fee"
              value={formatCurrency(
                getFinancialValue(
                  booking,
                  "booking_fee"
                )
              )}
            />

            <DetailItem
              label="Discount"
              value={formatCurrency(
                getFinancialValue(
                  booking,
                  "discount"
                )
              )}
            />

            <DetailItem
              label="Total Amount"
              value={formatCurrency(
                totalAmount
              )}
            />
          </div>
        </Section>

        {/* Occupancy */}

        <Section
          title="Occupancy"
          description="Guest information for this booking."
          icon={Users}
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <DetailItem
              label="Adults"
              value={formatNumber(
                booking?.adults ??
                booking?.occupancy?.adults ??
                0
              )}
              icon={Users}
            />

            <DetailItem
              label="Children"
              value={formatNumber(
                booking?.children ??
                booking?.occupancy?.children ??
                0
              )}
            />

            <DetailItem
              label="Total Guests"
              value={formatNumber(
                booking?.total_guests ??
                booking?.occupancy?.total ??
                toNumber(
                  booking?.adults ??
                  booking?.occupancy
                    ?.adults
                ) +
                toNumber(
                  booking?.children ??
                  booking?.occupancy
                    ?.children
                )
              )}
            />
          </div>
        </Section>

        {/* Tenancy */}

        {booking?.tenancy ? (
          <Section
            title="Tenancy Information"
            description="Tenancy linked to this booking."
            icon={FileText}
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Tenancy Number"
                value={
                  booking.tenancy
                    ?.tenancy_number ||
                  booking.tenancy?.number ||
                  "—"
                }
              />

              <DetailItem
                label="Start Date"
                value={formatDate(
                  booking.tenancy
                    ?.start_date
                )}
              />

              <DetailItem
                label="End Date"
                value={formatDate(
                  booking.tenancy
                    ?.end_date
                )}
              />

              <DetailItem
                label="Status"
                value={
                  booking.tenancy
                    ?.status || "—"
                }
              />

              <DetailItem
                label="Rent"
                value={formatCurrency(
                  booking.tenancy
                    ?.rent_amount
                )}
              />

              <DetailItem
                label="Service Charge"
                value={formatCurrency(
                  booking.tenancy
                    ?.service_charge
                )}
              />
            </div>
          </Section>
        ) : null}

        {/* Additional Information */}

        <Section
          title="Additional Information"
          description="Special requests and internal booking notes."
          icon={FileText}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Special Request
              </p>

              <div className="mt-2 min-h-24 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {booking?.special_request ||
                  booking?.special_requests ||
                  "No special request provided."}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Notes
              </p>

              <div className="mt-2 min-h-24 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {booking?.notes ||
                  "No notes provided."}
              </div>
            </div>
          </div>
        </Section>

        {/* Metadata */}

        <Section
          title="Booking Metadata"
          description="System information for this booking."
          icon={FileText}
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem
              label="Booking ID"
              value={
                booking?.id
                  ? `#${booking.id}`
                  : "—"
              }
            />

            <DetailItem
              label="Slug"
              value={
                booking?.slug || "—"
              }
            />

            <DetailItem
              label="Created At"
              value={formatDateTime(
                booking?.created_at
              )}
            />

            <DetailItem
              label="Updated At"
              value={formatDateTime(
                booking?.updated_at
              )}
            />
          </div>
        </Section>

        {/* Footer Actions */}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/super-admin/bookings"
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to={`/super-admin/bookings/${booking.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Edit3 className="h-4 w-4" />
              Edit Booking
            </Link>

            <button
              type="button"
              onClick={loadBooking}
              disabled={
                loadingPage ||
                loading ||
                actionLoading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingPage ||
                loading ||
                actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;