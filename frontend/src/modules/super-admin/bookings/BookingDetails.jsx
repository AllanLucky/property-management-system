import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  Copy,
  Database,
  Edit3,
  FileText,
  Home,
  Loader2,
  Mail,
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
| Constants
|--------------------------------------------------------------------------
*/

const BOOKINGS_PATH = "/super-admin/bookings";

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  completed: "Completed",
  expired: "Expired",
};

const BOOKING_TYPE_LABELS = {
  viewing: "Viewing",
  reservation: "Reservation",
  rental: "Rental",
};

const SOURCE_LABELS = {
  website: "Website",
  walk_in: "Walk In",
  phone: "Phone",
  referral: "Referral",
  agent: "Agent",
  social_media: "Social Media",
  other: "Other",
};

const PAYMENT_METHOD_LABELS = {
  mpesa: "M-Pesa",
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  card: "Card",
  cheque: "Cheque",
  online: "Online",
  other: "Other",
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
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

  const number = Number(
    String(value).replace(/[^0-9.-]/g, "")
  );

  return Number.isFinite(number) ? number : 0;
};

const isObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const hasValue = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    currencyDisplay: "symbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(toNumber(value));

const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE").format(
    toNumber(value)
  );

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

const formatFieldLabel = (key) => {
  if (!key) {
    return "—";
  }

  return String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
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

/*
|--------------------------------------------------------------------------
| Booking Response Resolver
|--------------------------------------------------------------------------
*/

const unwrapBookingResponse = (response) => {
  let current = response;
  const visited = new Set();

  for (let i = 0; i < 15; i += 1) {
    if (
      current === null ||
      current === undefined
    ) {
      break;
    }

    if (
      typeof current !== "object" ||
      visited.has(current)
    ) {
      break;
    }

    visited.add(current);

    if (Array.isArray(current)) {
      if (current.length === 0) {
        return null;
      }

      current = current[0];
      continue;
    }

    if (
      current.payload &&
      typeof current.payload === "object"
    ) {
      current = current.payload;
      continue;
    }

    if (
      current.id !== undefined ||
      current.booking_number !== undefined ||
      current.reference !== undefined ||
      current.booking_type !== undefined
    ) {
      return current;
    }

    if (
      current.booking &&
      typeof current.booking === "object"
    ) {
      current = current.booking;
      continue;
    }

    if (
      current.result &&
      typeof current.result === "object"
    ) {
      current = current.result;
      continue;
    }

    if (
      current.data &&
      typeof current.data === "object"
    ) {
      current = current.data;
      continue;
    }

    break;
  }

  return current;
};

/*
|--------------------------------------------------------------------------
| Person Helpers
|--------------------------------------------------------------------------
*/

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
    person?.middle_name,
    person?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return composedName || "—";
};

/*
|--------------------------------------------------------------------------
| Customer Helpers
|--------------------------------------------------------------------------
*/

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

  const snapshotName = [
    booking?.first_name,
    booking?.middle_name,
    booking?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (snapshotName) {
    return snapshotName;
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
    booking?.email ||
    booking?.customer_email ||
    "—"
  );
};

const getCustomerPhone = (booking) => {
  const customer = getCustomer(booking);

  return (
    customer?.phone ||
    customer?.phone_number ||
    booking?.phone ||
    booking?.customer_phone ||
    "—"
  );
};

/*
|--------------------------------------------------------------------------
| Tenant Helpers
|--------------------------------------------------------------------------
*/

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

  const tenantUserName =
    getFullName(tenantUser);

  if (tenantUserName !== "—") {
    return tenantUserName;
  }

  const tenantName = getFullName(tenant);

  if (tenantName !== "—") {
    return tenantName;
  }

  return booking?.tenant_id
    ? `Tenant #${booking.tenant_id}`
    : "Not linked";
};

/*
|--------------------------------------------------------------------------
| Property Helpers
|--------------------------------------------------------------------------
*/

const getPropertyName = (booking) => {
  const property =
    booking?.property ||
    booking?.unit?.property ||
    booking?.apartment?.property;

  return (
    property?.name ||
    property?.title ||
    property?.property_name ||
    property?.code ||
    property?.slug ||
    (booking?.property_id
      ? `Property #${booking.property_id}`
      : "—")
  );
};

const getApartmentName = (booking) => {
  const apartment =
    booking?.apartment ||
    booking?.unit?.apartment;

  return (
    apartment?.name ||
    apartment?.title ||
    apartment?.block_name ||
    apartment?.code ||
    apartment?.slug ||
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

/*
|--------------------------------------------------------------------------
| Booking Labels
|--------------------------------------------------------------------------
*/

const getBookingTypeLabel = (value) =>
  BOOKING_TYPE_LABELS[value] ||
  value ||
  "—";

const getSourceLabel = (value) =>
  SOURCE_LABELS[value] ||
  value ||
  "—";

const getPaymentMethodLabel = (value) =>
  PAYMENT_METHOD_LABELS[value] ||
  value ||
  "—";

const getStatusLabel = (value) => {
  const normalized = String(
    value || ""
  ).toLowerCase();

  return (
    STATUS_LABELS[normalized] ||
    value ||
    "—"
  );
};

const getBookingNumber = (booking) =>
  booking?.booking_number ||
  booking?.reference ||
  `Booking #${booking?.id ?? "—"}`;

/*
|--------------------------------------------------------------------------
| Financial Helpers
|--------------------------------------------------------------------------
*/

const getFinancialValue = (
  booking,
  key,
  aliases = []
) => {
  const sources = [
    booking?.financials,
    booking?.financial,
    booking,
    booking?.payment,
    booking?.payments,
  ];

  for (const source of sources) {
    if (
      !source ||
      typeof source !== "object"
    ) {
      continue;
    }

    if (hasValue(source[key])) {
      return source[key];
    }

    for (const alias of aliases) {
      if (hasValue(source[alias])) {
        return source[alias];
      }
    }
  }

  return 0;
};

const getTotal = (booking) => {
  const explicitTotal =
    getFinancialValue(
      booking,
      "total_amount",
      [
        "totalAmount",
        "total",
        "grand_total",
        "grandTotal",
        "booking_total",
        "bookingTotal",
        "total_due",
        "totalDue",
        "total_payable",
        "totalPayable",
      ]
    );

  if (hasValue(explicitTotal)) {
    return toNumber(explicitTotal);
  }

  return Math.max(
    toNumber(
      getFinancialValue(
        booking,
        "rent_amount",
        ["rentAmount", "rent"]
      )
    ) +
    toNumber(
      getFinancialValue(
        booking,
        "deposit_amount",
        ["depositAmount", "deposit"]
      )
    ) +
    toNumber(
      getFinancialValue(
        booking,
        "service_charge",
        [
          "serviceCharge",
          "service_charge_amount",
          "serviceChargeAmount",
        ]
      )
    ) +
    toNumber(
      getFinancialValue(
        booking,
        "booking_fee",
        [
          "bookingFee",
          "booking_fee_amount",
          "bookingFeeAmount",
        ]
      )
    ) -
    toNumber(
      getFinancialValue(
        booking,
        "discount",
        [
          "discount_amount",
          "discountAmount",
        ]
      )
    ),
    0
  );
};

const getPaid = (booking) =>
  toNumber(
    getFinancialValue(
      booking,
      "amount_paid",
      [
        "paid_amount",
        "amountPaid",
        "paidAmount",
        "total_paid",
        "totalPaid",
        "paid",
        "payments_total",
        "paymentsTotal",
      ]
    )
  );

const getBalance = (booking) => {
  const explicitBalance =
    getFinancialValue(
      booking,
      "balance",
      [
        "balance_amount",
        "balanceAmount",
        "amount_balance",
        "amountBalance",
      ]
    );

  if (hasValue(explicitBalance)) {
    return Math.max(
      toNumber(explicitBalance),
      0
    );
  }

  return Math.max(
    getTotal(booking) -
    getPaid(booking),
    0
  );
};

/*
|--------------------------------------------------------------------------
| Status Helpers
|--------------------------------------------------------------------------
*/

const getStatus = (booking) =>
  String(
    booking?.status || ""
  ).toLowerCase();

const getPaymentStatus = (booking) =>
  String(
    booking?.payment_status ||
    booking?.payment?.status ||
    ""
  ).toLowerCase();

/*
|--------------------------------------------------------------------------
| Error Helpers
|--------------------------------------------------------------------------
*/

const extractErrorMessage = (
  error,
  fallback = "Unable to load booking."
) =>
  error?.message ||
  error?.error ||
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.payload?.message ||
  fallback;

/*
|--------------------------------------------------------------------------
| Display Helpers
|--------------------------------------------------------------------------
*/

const isDateField = (key) => {
  const normalized = String(
    key
  ).toLowerCase();

  return (
    normalized.includes("date") ||
    normalized.endsWith("_at") ||
    normalized === "check_in" ||
    normalized === "check_out"
  );
};

const isCurrencyField = (key) => {
  const normalized = String(
    key
  ).toLowerCase();

  return [
    "amount",
    "rent",
    "deposit",
    "charge",
    "fee",
    "discount",
    "balance",
    "paid",
    "price",
    "total",
  ].some((term) =>
    normalized.includes(term)
  );
};

const getValueType = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "NULL";
  }

  if (Array.isArray(value)) {
    return "ARRAY";
  }

  if (isObject(value)) {
    return "OBJECT";
  }

  if (typeof value === "boolean") {
    return "BOOLEAN";
  }

  if (typeof value === "number") {
    return "NUMBER";
  }

  return "STRING";
};

const getTypeBadgeClass = (type) => {
  const classes = {
    NULL:
      "bg-slate-100 text-slate-500 ring-slate-200",
    STRING:
      "bg-blue-50 text-blue-600 ring-blue-100",
    NUMBER:
      "bg-violet-50 text-violet-600 ring-violet-100",
    BOOLEAN:
      "bg-emerald-50 text-emerald-600 ring-emerald-100",
    OBJECT:
      "bg-amber-50 text-amber-700 ring-amber-100",
    ARRAY:
      "bg-indigo-50 text-indigo-600 ring-indigo-100",
  };

  return (
    classes[type] ||
    classes.STRING
  );
};

const renderPrimitiveValue = (
  key,
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return (
      <span className="font-medium text-slate-400">
        —
      </span>
    );
  }

  if (typeof value === "boolean") {
    return (
      <span
        className={
          value
            ? "font-semibold text-emerald-700"
            : "font-semibold text-slate-500"
        }
      >
        {value ? "Yes" : "No"}
      </span>
    );
  }

  if (
    typeof value === "number" &&
    isCurrencyField(key)
  ) {
    return (
      <span className="font-semibold text-slate-900">
        {formatCurrency(value)}
      </span>
    );
  }

  if (
    typeof value === "string" &&
    isDateField(key)
  ) {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return (
        <span className="font-semibold text-slate-900">
          {formatDateTime(value)}
        </span>
      );
    }
  }

  return (
    <span className="break-words font-medium text-slate-900">
      {String(value)}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| Raw Data Node
|--------------------------------------------------------------------------
*/

const RawDataNode = ({
  label,
  value,
  level = 0,
  expandedFields,
  onToggle,
  loadingField,
  path,
}) => {
  const isArray = Array.isArray(value);
  const objectValue = isObject(value);
  const expandable =
    isArray || objectValue;

  const fieldPath =
    path || String(label);

  const isExpanded =
    Boolean(
      expandedFields?.[fieldPath]
    );

  const isLoading =
    loadingField === fieldPath;

  const valueType =
    getValueType(value);

  if (!expandable) {
    return (
      <div
        className={`group ${level === 0
            ? "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            : "border-b border-slate-100 py-3 last:border-b-0"
          }`}
      >
        <div
          className={`flex flex-col gap-2 ${level === 0
              ? ""
              : "sm:flex-row sm:items-start sm:justify-between sm:gap-6"
            }`}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-800">
                {formatFieldLabel(label)}
              </span>

              <span
                className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ring-1 ${getTypeBadgeClass(
                  valueType
                )}`}
              >
                {valueType}
              </span>
            </div>

            <p className="mt-1 break-all font-mono text-[10px] text-slate-400">
              {fieldPath}
            </p>
          </div>

          <div
            className={`min-w-0 ${level === 0
                ? "mt-2 rounded-lg bg-slate-50 px-3 py-2.5"
                : "sm:max-w-[65%] sm:text-right"
              }`}
          >
            {renderPrimitiveValue(
              label,
              value
            )}
          </div>
        </div>
      </div>
    );
  }

  const entries = isArray
    ? value.map((item, index) => [
      String(index),
      item,
    ])
    : Object.entries(value);

  const itemCount = isArray
    ? value.length
    : Object.keys(value).length;

  return (
    <div
      className={
        level === 0
          ? "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          : "border-l-2 border-slate-100 pl-3"
      }
    >
      <button
        type="button"
        disabled={isLoading}
        onClick={() =>
          onToggle(fieldPath)
        }
        className={`group flex w-full items-center gap-3 text-left transition ${level === 0
            ? "px-4 py-4 hover:bg-slate-50"
            : "py-3 hover:bg-slate-50/80"
          } ${isLoading
            ? "cursor-wait"
            : "cursor-pointer"
          }`}
      >
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg ${level === 0
              ? "h-9 w-9 bg-slate-900 text-white"
              : "h-7 w-7 bg-slate-100 text-slate-500"
            }`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                level === 0
                  ? "text-sm font-bold text-slate-900"
                  : "text-xs font-bold text-slate-700"
              }
            >
              {formatFieldLabel(label)}
            </span>

            <span
              className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ring-1 ${getTypeBadgeClass(
                valueType
              )}`}
            >
              {valueType}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            {isLoading
              ? "Loading nested data..."
              : isExpanded
                ? `Showing ${itemCount} ${isArray
                  ? itemCount === 1
                    ? "item"
                    : "items"
                  : itemCount === 1
                    ? "field"
                    : "fields"
                }`
                : `${itemCount} ${isArray
                  ? itemCount === 1
                    ? "item"
                    : "items"
                  : itemCount === 1
                    ? "field"
                    : "fields"
                } • Click to expand`}
          </p>
        </div>

        <div className="hidden shrink-0 sm:block">
          {isLoading ? (
            <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-600">
              Loading
            </span>
          ) : (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 transition group-hover:bg-slate-200">
              {isExpanded
                ? "Collapse"
                : "View"}
            </span>
          )}
        </div>
      </button>

      {isExpanded && !isLoading ? (
        <div
          className={`${level === 0
              ? "border-t border-slate-200 bg-slate-50/50 p-3 sm:p-4"
              : "pb-2 pt-1"
            }`}
        >
          {entries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-xs italic text-slate-400">
              Empty{" "}
              {isArray ? "array" : "object"}
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map(
                ([childKey, childValue]) => {
                  const childPath =
                    `${fieldPath}.${childKey}`;

                  return (
                    <RawDataNode
                      key={childPath}
                      label={
                        isArray
                          ? `Item ${Number(childKey) +
                          1
                          }`
                          : childKey
                      }
                      value={childValue}
                      level={level + 1}
                      expandedFields={
                        expandedFields
                      }
                      onToggle={
                        onToggle
                      }
                      loadingField={
                        loadingField
                      }
                      path={childPath}
                    />
                  );
                }
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| UI Components
|--------------------------------------------------------------------------
*/

const DetailItem = ({
  label,
  value,
  icon: Icon,
  children,
  className = "",
}) => (
  <div
    className={`group min-w-0 rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-slate-200 hover:bg-white ${className}`}
  >
    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
      {Icon ? (
        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      ) : null}

      <span>{label}</span>
    </div>

    <div className="mt-2 break-words text-sm font-semibold text-slate-900">
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
    <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}

          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">
              {title}
            </h2>

            {description ? (
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {action ? (
          <div className="shrink-0">
            {action}
          </div>
        ) : null}
      </div>
    </div>

    <div className="p-4 sm:p-6">
      {children}
    </div>
  </section>
);

const LoadingBlock = () => (
  <div className="space-y-6">
    <div className="h-44 animate-pulse rounded-2xl bg-slate-200" />

    <div className="grid gap-6 lg:grid-cols-2">
      {[1, 2, 3, 4].map(
        (item) => (
          <div
            key={item}
            className="h-64 animate-pulse rounded-2xl bg-slate-200"
          />
        )
      )}
    </div>

    <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
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
    <div className="group p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>

          <p className="mt-2 truncate text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 transition group-hover:scale-105 ${tones[tone] || tones.slate
            }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const InfoPill = ({
  icon: Icon,
  children,
}) => (
  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-white/10">
    {Icon ? (
      <Icon className="h-3.5 w-3.5" />
    ) : null}

    {children}
  </span>
);

const FinancialCard = ({
  label,
  value,
  tone = "slate",
  description,
}) => {
  const tones = {
    slate:
      "bg-slate-50 border-slate-100 text-slate-900",
    emerald:
      "bg-emerald-50 border-emerald-100 text-emerald-900",
    amber:
      "bg-amber-50 border-amber-100 text-amber-900",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${tones[tone] || tones.slate
        }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">
        {label}
      </p>

      <p className="mt-2 text-xl font-extrabold tracking-tight">
        {value}
      </p>

      {description ? (
        <p className="mt-1 text-xs opacity-70">
          {description}
        </p>
      ) : null}
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
    error,
  } = useBooking();

  const [booking, setBooking] =
    useState(null);

  const [loadingPage, setLoadingPage] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [activeAction, setActiveAction] =
    useState("");

  const [pageError, setPageError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Complete Data UI State
  |--------------------------------------------------------------------------
  */

  const [
    completeDataExpanded,
    setCompleteDataExpanded,
  ] = useState(false);

  const [
    expandedFields,
    setExpandedFields,
  ] = useState({});

  const [
    loadingField,
    setLoadingField,
  ] = useState("");

  const loadingTimerRef =
    useRef(null);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        window.clearTimeout(
          loadingTimerRef.current
        );
      }
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Load Booking
  |--------------------------------------------------------------------------
  */

  const loadBooking = useCallback(
    async () => {
      if (!id) {
        setPageError(
          "Booking ID is missing."
        );
        setLoadingPage(false);
        return;
      }

      setLoadingPage(true);
      setPageError("");

      try {
        const response =
          await getBooking(id);

        if (import.meta.env.DEV) {
          console.debug(
            "[BookingDetails] getBooking response:",
            response
          );
        }

        const resolvedBooking =
          unwrapBookingResponse(
            response
          );

        if (import.meta.env.DEV) {
          console.debug(
            "[BookingDetails] Resolved booking:",
            resolvedBooking
          );
        }

        if (
          !resolvedBooking ||
          typeof resolvedBooking !==
          "object" ||
          Array.isArray(
            resolvedBooking
          )
        ) {
          throw new Error(
            "Booking details were not found."
          );
        }

        setBooking(
          resolvedBooking
        );

        setExpandedFields({});
        setCompleteDataExpanded(false);
        setLoadingField("");
      } catch (requestError) {
        console.error(
          "[BookingDetails] Failed to load booking:",
          requestError
        );

        setBooking(null);

        setPageError(
          extractErrorMessage(
            requestError,
            "Unable to load booking details."
          )
        );
      } finally {
        setLoadingPage(false);
      }
    },
    [getBooking, id]
  );

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  /*
  |--------------------------------------------------------------------------
  | Booking ID
  |--------------------------------------------------------------------------
  */

  const bookingId =
    getId(booking?.id) ||
    getId(id);

  /*
  |--------------------------------------------------------------------------
  | Complete Data Handlers
  |--------------------------------------------------------------------------
  */

  const toggleCompleteData =
    useCallback(() => {
      if (!booking) {
        return;
      }

      setCompleteDataExpanded(
        (current) => !current
      );
    }, [booking]);

  const toggleCompleteField =
    useCallback(
      (fieldPath) => {
        if (!booking) {
          return;
        }

        const getNestedValue = (
          source,
          path
        ) => {
          const parts =
            path.split(".");

          let current = source;

          for (const part of parts) {
            if (
              current === null ||
              current === undefined
            ) {
              return undefined;
            }

            if (
              Array.isArray(
                current
              )
            ) {
              const index =
                Number(part);

              if (
                Number.isNaN(index)
              ) {
                return undefined;
              }

              current =
                current[index];
            } else {
              current =
                current[part];
            }
          }

          return current;
        };

        const value =
          getNestedValue(
            booking,
            fieldPath
          );

        const expandable =
          Array.isArray(value) ||
          isObject(value);

        if (!expandable) {
          return;
        }

        const currentlyOpen =
          Boolean(
            expandedFields[fieldPath]
          );

        if (currentlyOpen) {
          setExpandedFields(
            (current) => ({
              ...current,
              [fieldPath]: false,
            })
          );

          return;
        }

        if (loadingTimerRef.current) {
          window.clearTimeout(
            loadingTimerRef.current
          );
        }

        setLoadingField(
          fieldPath
        );

        loadingTimerRef.current =
          window.setTimeout(() => {
            setExpandedFields(
              (current) => ({
                ...current,
                [fieldPath]: true,
              })
            );

            setLoadingField("");
            loadingTimerRef.current =
              null;
          }, 250);
      },
      [booking, expandedFields]
    );

  const getExpandableFields =
    useCallback(() => {
      if (!booking) {
        return {};
      }

      return Object.entries(
        booking
      ).reduce(
        (result, [key, value]) => {
          if (
            Array.isArray(value) ||
            isObject(value)
          ) {
            result[key] = true;
          }

          return result;
        },
        {}
      );
    }, [booking]);

  const expandAllCompleteFields =
    useCallback(() => {
      setExpandedFields(
        getExpandableFields()
      );
    }, [getExpandableFields]);

  const collapseAllCompleteFields =
    useCallback(() => {
      setExpandedFields({});
      setLoadingField("");

      if (loadingTimerRef.current) {
        window.clearTimeout(
          loadingTimerRef.current
        );

        loadingTimerRef.current =
          null;
      }
    }, []);

  /*
  |--------------------------------------------------------------------------
  | Copy JSON
  |--------------------------------------------------------------------------
  */

  const copyBookingJson =
    useCallback(async () => {
      if (!booking) {
        return;
      }

      try {
        const json =
          JSON.stringify(
            booking,
            null,
            2
          );

        if (
          navigator.clipboard &&
          window.isSecureContext
        ) {
          await navigator.clipboard.writeText(
            json
          );
        } else {
          const textarea =
            document.createElement(
              "textarea"
            );

          textarea.value = json;
          textarea.style.position =
            "fixed";
          textarea.style.left =
            "-9999px";
          textarea.style.top =
            "-9999px";
          textarea.style.opacity =
            "0";

          document.body.appendChild(
            textarea
          );

          textarea.focus();
          textarea.select();

          const copied =
            document.execCommand(
              "copy"
            );

          document.body.removeChild(
            textarea
          );

          if (!copied) {
            throw new Error(
              "Clipboard copy failed."
            );
          }
        }

        await Swal.fire({
          icon: "success",
          title: "Copied",
          text: "Booking JSON copied to clipboard.",
          timer: 1600,
          showConfirmButton: false,
        });
      } catch (copyError) {
        console.error(
          "[BookingDetails] Copy failed:",
          copyError
        );

        await Swal.fire({
          icon: "error",
          title: "Copy Failed",
          text:
            "Unable to copy the booking JSON.",
        });
      }
    }, [booking]);

  /*
  |--------------------------------------------------------------------------
  | Action Helper
  |--------------------------------------------------------------------------
  */

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
        await Swal.fire({
          icon: "error",
          title: "Invalid Booking",
          text:
            "A valid booking ID is required.",
        });

        return;
      }

      if (actionLoading) {
        return;
      }

      let reason = "";

      if (input) {
        const result =
          await Swal.fire({
            title,
            input: "textarea",
            inputLabel,
            inputPlaceholder,
            inputAttributes: {
              "aria-label":
                inputLabel,
            },
            showCancelButton: true,
            confirmButtonText:
              confirmText,
            cancelButtonText:
              "Cancel",
            reverseButtons: true,
            inputValidator: (
              value
            ) => {
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
        const result =
          await Swal.fire({
            title,
            text:
              "This action will update the booking workflow status.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText:
              confirmText,
            cancelButtonText:
              "Cancel",
            reverseButtons: true,
          });

        if (!result.isConfirmed) {
          return;
        }
      }

      setActionLoading(true);
      setActiveAction(action);
      setPageError("");

      try {
        let response;

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        | Keep the action method calls compatible with useBooking().
        */

        switch (action) {
          case "confirm":
            if (
              typeof confirmBooking !==
              "function"
            ) {
              throw new Error(
                "Confirm booking action is not available."
              );
            }

            response =
              await confirmBooking(
                bookingId
              );
            break;

          case "approve":
            if (
              typeof approveBooking !==
              "function"
            ) {
              throw new Error(
                "Approve booking action is not available."
              );
            }

            response =
              await approveBooking(
                bookingId
              );
            break;

          case "check-in":
            if (
              typeof checkInBooking !==
              "function"
            ) {
              throw new Error(
                "Check-in booking action is not available."
              );
            }

            response =
              await checkInBooking(
                bookingId
              );
            break;

          case "complete":
            if (
              typeof completeBooking !==
              "function"
            ) {
              throw new Error(
                "Complete booking action is not available."
              );
            }

            response =
              await completeBooking(
                bookingId
              );
            break;

          case "cancel":
            if (
              typeof cancelBooking !==
              "function"
            ) {
              throw new Error(
                "Cancel booking action is not available."
              );
            }

            response =
              await cancelBooking(
                bookingId
              );
            break;

          case "reject":
            if (
              typeof rejectBooking !==
              "function"
            ) {
              throw new Error(
                "Reject booking action is not available."
              );
            }

            response =
              await rejectBooking(
                bookingId,
                reason
              );
            break;

          case "expire":
            if (
              typeof expireBooking !==
              "function"
            ) {
              throw new Error(
                "Expire booking action is not available."
              );
            }

            response =
              await expireBooking(
                bookingId
              );
            break;

          default:
            throw new Error(
              "Unsupported booking action."
            );
        }

        if (
          response?.success ===
          false
        ) {
          throw new Error(
            response?.message ||
            response?.error ||
            "The booking action failed."
          );
        }

        await Swal.fire({
          icon: "success",
          title: "Booking Updated",
          text:
            response?.message ||
            successMessage ||
            "Booking updated successfully.",
          confirmButtonText: "OK",
        });

        await loadBooking();
      } catch (requestError) {
        console.error(
          `[BookingDetails] ${action} action failed:`,
          requestError
        );

        const message =
          extractErrorMessage(
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
        setActiveAction("");
      }
    },
    [
      actionLoading,
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
  */

  const bookingStatus =
    getStatus(booking);

  const paymentStatus =
    getPaymentStatus(booking);

  const totalAmount =
    getTotal(booking);

  const paidAmount =
    getPaid(booking);

  const balanceAmount =
    getBalance(booking);

  const paymentProgress =
    totalAmount > 0
      ? Math.min(
        Math.max(
          Math.round(
            (paidAmount /
              totalAmount) *
            100
          ),
          0
        ),
        100
      )
      : 0;

  /*
  |--------------------------------------------------------------------------
  | Guest Information
  |--------------------------------------------------------------------------
  */

  const adults = toNumber(
    booking?.occupancy
      ?.number_of_adults ??
    booking?.occupancy?.adults ??
    booking?.number_of_adults ??
    booking?.adults
  );

  const children = toNumber(
    booking?.occupancy
      ?.number_of_children ??
    booking?.occupancy?.children ??
    booking?.number_of_children ??
    booking?.children
  );

  const hasExplicitGuestTotal =
    hasValue(
      booking?.occupancy
        ?.total_guests
    ) ||
    hasValue(
      booking?.occupancy?.total
    ) ||
    hasValue(
      booking?.total_guests
    );

  const guestTotal =
    hasExplicitGuestTotal
      ? toNumber(
        booking?.occupancy
          ?.total_guests ??
        booking?.occupancy
          ?.total ??
        booking?.total_guests
      )
      : adults + children;

  /*
  |--------------------------------------------------------------------------
  | Payment Information
  |--------------------------------------------------------------------------
  */

  const paymentMethod =
    booking?.payment?.method ||
    booking?.payment_method ||
    "—";

  const paymentReference =
    booking?.payment?.reference ||
    booking?.payment_reference ||
    booking?.mpesa_reference ||
    booking?.mpesa_receipt ||
    booking?.transaction_reference ||
    "—";

  const paidDate =
    booking?.payment?.paid_at ||
    booking?.paid_date ||
    booking?.paid_at ||
    null;

  /*
  |--------------------------------------------------------------------------
  | Workflow Actions
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | Store the actual imported Lucide component in `icon`.
  | Do not store SVG strings or rendered SVG markup.
  |
  */

  const workflowActions =
    useMemo(() => {
      if (!booking) {
        return [];
      }

      const actions = [];

      if (bookingStatus === "pending") {
        actions.push({
          key: "confirm",
          label: "Confirm Booking",
          icon: CheckCircle2,
          className:
            "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
          run: () =>
            runAction({
              action: "confirm",
              title:
                "Confirm this booking?",
              successMessage:
                "Booking confirmed successfully.",
              confirmText:
                "Yes, confirm booking",
            }),
        });
      }

      if (
        bookingStatus === "pending" ||
        bookingStatus === "confirmed"
      ) {
        actions.push({
          key: "approve",
          label: "Approve",
          icon: CheckCircle2,
          className:
            "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
          run: () =>
            runAction({
              action: "approve",
              title:
                "Approve this booking?",
              successMessage:
                "Booking approved successfully.",
              confirmText:
                "Yes, approve",
            }),
        });
      }

      if (
        bookingStatus === "confirmed" ||
        bookingStatus === "approved"
      ) {
        actions.push({
          key: "check-in",
          label: "Check In",
          icon: Clock3,
          className:
            "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
          run: () =>
            runAction({
              action: "check-in",
              title:
                "Check in this booking?",
              successMessage:
                "Booking checked in successfully.",
              confirmText:
                "Yes, check in",
            }),
        });
      }

      if (
        bookingStatus === "approved" ||
        bookingStatus === "confirmed"
      ) {
        actions.push({
          key: "complete",
          label: "Complete",
          icon: CheckCircle2,
          className:
            "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500",
          run: () =>
            runAction({
              action: "complete",
              title:
                "Complete this booking?",
              successMessage:
                "Booking completed successfully.",
              confirmText:
                "Yes, complete",
            }),
        });
      }

      if (
        ![
          "cancelled",
          "completed",
          "expired",
          "rejected",
        ].includes(bookingStatus)
      ) {
        actions.push({
          key: "cancel",
          label: "Cancel",
          icon: XCircle,
          className:
            "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 focus:ring-rose-500",
          run: () =>
            runAction({
              action: "cancel",
              title:
                "Cancel this booking?",
              successMessage:
                "Booking cancelled successfully.",
              confirmText:
                "Yes, cancel",
            }),
        });
      }

      if (
        ![
          "completed",
          "cancelled",
          "expired",
          "rejected",
        ].includes(bookingStatus)
      ) {
        actions.push({
          key: "reject",
          label: "Reject",
          icon: XCircle,
          className:
            "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 focus:ring-rose-500",
          run: () =>
            runAction({
              action: "reject",
              title:
                "Reject this booking?",
              input: true,
              inputLabel:
                "Rejection reason",
              inputPlaceholder:
                "Enter the reason for rejecting this booking...",
              inputRequired: true,
              successMessage:
                "Booking rejected successfully.",
              confirmText:
                "Yes, reject",
            }),
        });
      }

      if (
        ![
          "completed",
          "cancelled",
          "expired",
        ].includes(bookingStatus)
      ) {
        actions.push({
          key: "expire",
          label: "Mark Expired",
          icon: Clock3,
          className:
            "border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 focus:ring-amber-500",
          run: () =>
            runAction({
              action: "expire",
              title:
                "Mark this booking as expired?",
              successMessage:
                "Booking marked as expired successfully.",
              confirmText:
                "Yes, mark expired",
            }),
        });
      }

      return actions;
    }, [
      booking,
      bookingStatus,
      runAction,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Raw Booking Data
  |--------------------------------------------------------------------------
  */

  const rawBookingEntries =
    useMemo(() => {
      if (
        !booking ||
        typeof booking !==
        "object"
      ) {
        return [];
      }

      return Object.entries(
        booking
      );
    }, [booking]);

  const expandableFieldCount =
    useMemo(
      () =>
        rawBookingEntries.filter(
          ([, value]) =>
            Array.isArray(value) ||
            isObject(value)
        ).length,
      [rawBookingEntries]
    );

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loadingPage) {
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
  | Error / Not Found
  |--------------------------------------------------------------------------
  */

  if (!booking) {
    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/60">
              <AlertCircle className="h-8 w-8" />
            </div>

            <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">
              Unable to load booking
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              {pageError ||
                extractErrorMessage(
                  error,
                  "The requested booking could not be found."
                )}
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={loadBooking}
                disabled={loadingPage}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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
                    BOOKINGS_PATH
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
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
        <BookingHeader
          title={getBookingNumber(
            booking
          )}
          subtitle="Complete booking details and workflow"
          onRefresh={loadBooking}
          loading={
            loadingPage ||
            loading ||
            actionLoading
          }
        />

        {pageError ? (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-rose-900">
                Something went wrong
              </p>

              <p className="mt-1 text-sm leading-5 text-rose-700">
                {pageError}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setPageError("")
              }
              className="ml-auto shrink-0 rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-100"
              aria-label="Dismiss error"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        ) : null}

        {/* Booking Hero */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-5 py-7 text-white sm:px-7 lg:px-8 lg:py-8">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

            <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide text-white ring-1 ring-white/10">
                    {getBookingNumber(
                      booking
                    )}
                  </span>

                  {booking?.reference ? (
                    <span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-white/10">
                      Ref:{" "}
                      {
                        booking.reference
                      }
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-4 truncate text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                  {getCustomerName(
                    booking
                  )}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <InfoPill
                    icon={CalendarDays}
                  >
                    {getBookingTypeLabel(
                      booking?.booking_type
                    )}
                  </InfoPill>

                  {booking?.source ? (
                    <InfoPill>
                      {getSourceLabel(
                        booking.source
                      )}
                    </InfoPill>
                  ) : null}

                  {booking?.unit_id ? (
                    <InfoPill
                      icon={Home}
                    >
                      Unit{" "}
                      {getUnitName(
                        booking
                      )}
                    </InfoPill>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <BookingStatusBadge
                  status={
                    booking?.status
                  }
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
                guestTotal
              )}
              icon={Users}
              tone="slate"
            />
          </div>
        </section>

        {/* ================================================================
            WORKFLOW ACTIONS
        ================================================================= */}

        {workflowActions.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Clock3 className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Booking Actions
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Manage the booking workflow from confirmation through completion.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {workflowActions.map(
                  (item) => {
                    const ActionIcon =
                      item.icon;

                    const isThisActionLoading =
                      actionLoading &&
                      activeAction ===
                      item.key;

                    return (
                      <button
                        key={
                          item.key
                        }
                        type="button"
                        disabled={
                          actionLoading
                        }
                        onClick={() =>
                          item.run()
                        }
                        aria-label={
                          item.label
                        }
                        title={
                          item.label
                        }
                        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm outline-none transition hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${item.className}`}
                      >
                        {isThisActionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ActionIcon
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0"
                          />
                        )}

                        <span>
                          {isThisActionLoading
                            ? "Processing..."
                            : item.label}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  No Workflow Actions Available
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  This booking is already in a final workflow state.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Customer + Property */}

        <div className="grid gap-6 lg:grid-cols-2">
          <Section
            title="Customer Information"
            description="Customer and tenant information attached to this booking."
            icon={UserRound}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Customer"
                value={getCustomerName(
                  booking
                )}
                icon={UserRound}
              />

              <DetailItem
                label="Email"
                icon={Mail}
              >
                {getCustomerEmail(
                  booking
                ) !== "—" ? (
                  <a
                    href={`mailto:${getCustomerEmail(
                      booking
                    )}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {getCustomerEmail(
                      booking
                    )}
                  </a>
                ) : (
                  "—"
                )}
              </DetailItem>

              <DetailItem
                label="Phone"
                icon={Phone}
              >
                {getCustomerPhone(
                  booking
                ) !== "—" ? (
                  <a
                    href={`tel:${getCustomerPhone(
                      booking
                    )}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {getCustomerPhone(
                      booking
                    )}
                  </a>
                ) : (
                  "—"
                )}
              </DetailItem>

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
                    : "Not linked"
                }
              />
            </div>
          </Section>

          <Section
            title="Property & Unit"
            description="Property hierarchy associated with the booking."
            icon={Home}
          >
            <div className="grid gap-4 sm:grid-cols-2">
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

              <DetailItem
                label="Unit Listed Price"
                value={formatCurrency(
                  booking?.unit
                    ?.price
                )}
              />

              <DetailItem
                label="Unit Deposit"
                value={formatCurrency(
                  booking?.unit
                    ?.deposit
                )}
              />

              <DetailItem
                label="Unit Service Charge"
                value={formatCurrency(
                  booking?.unit
                    ?.service_charge
                )}
              />
            </div>
          </Section>
        </div>

        {/* Booking Details + Payment */}

        <div className="grid gap-6 lg:grid-cols-2">
          <Section
            title="Booking Details"
            description="Dates, type, source and workflow information."
            icon={CalendarDays}
          >
            <div className="grid gap-4 sm:grid-cols-2">
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
                  booking?.check_in_date ??
                  booking?.check_in_at ??
                  booking?.check_in
                )}
              />

              <DetailItem
                label="Check Out"
                value={formatDateTime(
                  booking?.check_out_date ??
                  booking?.check_out_at ??
                  booking?.check_out
                )}
              />

              <DetailItem
                label="Confirmed At"
                value={formatDateTime(
                  booking?.confirmed_at
                )}
              />

              <DetailItem
                label="Approved At"
                value={formatDateTime(
                  booking?.approved_at
                )}
              />

              <DetailItem
                label="Completed At"
                value={formatDateTime(
                  booking?.completed_at
                )}
              />

              <DetailItem label="Status">
                <BookingStatusBadge
                  status={
                    booking?.status
                  }
                />
              </DetailItem>

              <DetailItem label="Payment Status">
                <BookingPaymentBadge
                  status={
                    booking?.payment_status
                  }
                />
              </DetailItem>
            </div>
          </Section>

          <Section
            title="Payment Information"
            description="Payment method, references and collection progress."
            icon={Wallet}
          >
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
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
                    paymentMethod
                  )}
                />

                <DetailItem
                  label="Payment Reference"
                  value={
                    paymentReference
                  }
                />

                <DetailItem
                  label="Paid Date"
                  value={formatDateTime(
                    paidDate
                  )}
                />

                <DetailItem
                  label="M-Pesa Reference"
                  value={
                    booking?.payment
                      ?.reference ||
                    booking?.mpesa_reference ||
                    booking?.mpesa_receipt ||
                    "—"
                  }
                />

                <DetailItem
                  label="Transaction Reference"
                  value={
                    booking?.transaction_reference ||
                    booking?.transaction_id ||
                    "—"
                  }
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <FinancialCard
                  label="Total"
                  value={formatCurrency(
                    totalAmount
                  )}
                  tone="slate"
                />

                <FinancialCard
                  label="Paid"
                  value={formatCurrency(
                    paidAmount
                  )}
                  tone="emerald"
                />

                <FinancialCard
                  label="Balance"
                  value={formatCurrency(
                    balanceAmount
                  )}
                  tone={
                    balanceAmount > 0
                      ? "amber"
                      : "emerald"
                  }
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Payment progress
                  </span>

                  <span className="text-xs font-extrabold text-slate-700">
                    {paymentProgress}%
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem
              label="Rent Amount"
              value={formatCurrency(
                getFinancialValue(
                  booking,
                  "rent_amount",
                  [
                    "rentAmount",
                    "rent",
                  ]
                )
              )}
            />

            <DetailItem
              label="Deposit"
              value={formatCurrency(
                getFinancialValue(
                  booking,
                  "deposit_amount",
                  [
                    "depositAmount",
                    "deposit",
                  ]
                )
              )}
            />

            <DetailItem
              label="Service Charge"
              value={formatCurrency(
                getFinancialValue(
                  booking,
                  "service_charge",
                  [
                    "serviceCharge",
                    "service_charge_amount",
                  ]
                )
              )}
            />

            <DetailItem
              label="Booking Fee"
              value={formatCurrency(
                getFinancialValue(
                  booking,
                  "booking_fee",
                  [
                    "bookingFee",
                    "booking_fee_amount",
                  ]
                )
              )}
            />

            <DetailItem
              label="Discount"
              value={formatCurrency(
                getFinancialValue(
                  booking,
                  "discount",
                  [
                    "discount_amount",
                    "discountAmount",
                  ]
                )
              )}
            />

            <DetailItem
              label="Total Amount"
              value={formatCurrency(
                totalAmount
              )}
            />

            <DetailItem
              label="Amount Paid"
              value={formatCurrency(
                paidAmount
              )}
            />

            <DetailItem
              label="Balance"
              value={formatCurrency(
                balanceAmount
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
          <div className="grid gap-4 sm:grid-cols-3">
            <DetailItem
              label="Adults"
              value={formatNumber(
                adults
              )}
              icon={Users}
            />

            <DetailItem
              label="Children"
              value={formatNumber(
                children
              )}
            />

            <DetailItem
              label="Total Guests"
              value={formatNumber(
                guestTotal
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Tenancy Number"
                value={
                  booking.tenancy
                    ?.tenancy_number ||
                  booking.tenancy
                    ?.number ||
                  "—"
                }
              />

              <DetailItem
                label="Tenancy ID"
                value={
                  booking.tenancy
                    ?.id
                    ? `#${booking.tenancy.id}`
                    : "—"
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
                    ?.status ||
                  "—"
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
                label="Deposit"
                value={formatCurrency(
                  booking.tenancy
                    ?.deposit_amount
                )}
              />

              <DetailItem
                label="Service Charge"
                value={formatCurrency(
                  booking.tenancy
                    ?.service_charge
                )}
              />

              <DetailItem
                label="Late Fee"
                value={formatCurrency(
                  booking.tenancy
                    ?.late_fee
                )}
              />
            </div>
          </Section>
        ) : null}

        {/* Additional Information */}

        <Section
          title="Additional Information"
          description="Special requests, notes and workflow remarks."
          icon={FileText}
        >
          <div className="grid gap-5 md:grid-cols-2">
            {[
              {
                label: "Special Request",
                value:
                  booking?.special_request ||
                  booking?.special_requests,
                empty:
                  "No special request provided.",
              },
              {
                label: "Notes",
                value:
                  booking?.notes,
                empty:
                  "No notes provided.",
              },
              {
                label: "Description",
                value:
                  booking?.description,
                empty:
                  "No description provided.",
              },
              {
                label: "Rejection Reason",
                value:
                  booking?.rejection_reason ||
                  booking?.reject_reason,
                empty:
                  "No rejection reason provided.",
              },
              {
                label: "Cancellation Reason",
                value:
                  booking?.cancellation_reason,
                empty:
                  "No cancellation reason provided.",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {item.label}
                </p>

                <div className="mt-2 min-h-20 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {item.value || (
                    <span className="italic text-slate-400">
                      {item.empty}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Metadata */}

        <Section
          title="Booking Metadata"
          description="System information and audit details for this booking."
          icon={FileText}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem
              label="Booking ID"
              value={
                booking?.id
                  ? `#${booking.id}`
                  : "—"
              }
            />

            <DetailItem
              label="Booking Number"
              value={
                booking?.booking_number ||
                "—"
              }
            />

            <DetailItem
              label="Reference"
              value={
                booking?.reference ||
                "—"
              }
            />

            <DetailItem
              label="Slug"
              value={
                booking?.slug ||
                "—"
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

            <DetailItem
              label="Created By"
              value={getFullName(
                booking?.created_by
              )}
            />

            <DetailItem
              label="Updated By"
              value={getFullName(
                booking?.updated_by
              )}
            />
          </div>
        </Section>

        {/* Complete Booking Data */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <button
                type="button"
                onClick={
                  toggleCompleteData
                }
                className="group flex min-w-0 items-start gap-3 text-left"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${completeDataExpanded
                      ? "bg-blue-600 text-white"
                      : "bg-slate-900 text-white"
                    }`}
                >
                  <Database className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      Complete Booking Data
                    </h2>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold text-slate-500 ring-1 ring-slate-200">
                      {rawBookingEntries.length}{" "}
                      fields
                    </span>
                  </div>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Inspect every field returned by the booking API, including nested objects and arrays.
                  </p>
                </div>

                <div className="ml-auto hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-slate-100 group-hover:text-slate-700 sm:flex">
                  {completeDataExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                  {expandableFieldCount} expandable
                </span>

                <button
                  type="button"
                  onClick={
                    copyBookingJson
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy JSON
                </button>

                <button
                  type="button"
                  onClick={
                    toggleCompleteData
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
                >
                  {completeDataExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}

                  {completeDataExpanded
                    ? "Hide Data"
                    : "View Data"}
                </button>
              </div>
            </div>
          </div>

          {!completeDataExpanded ? (
            <div className="p-4 sm:p-6">
              <button
                type="button"
                onClick={
                  toggleCompleteData
                }
                className="group flex w-full items-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50/30 sm:p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition group-hover:bg-blue-600 group-hover:text-white">
                  <Database className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    Click to load complete API data
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The complete response contains{" "}
                    {rawBookingEntries.length}{" "}
                    top-level fields. Objects and arrays can be expanded individually.
                  </p>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition group-hover:text-blue-600">
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </button>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="mb-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    API Response Fields
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Each field is displayed in a clean column. Click an object or array to load its nested data.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      expandAllCompleteFields
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                    Expand All
                  </button>

                  <button
                    type="button"
                    onClick={
                      collapseAllCompleteFields
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                    Collapse All
                  </button>
                </div>
              </div>

              {rawBookingEntries.length ===
                0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                  <Database className="mx-auto h-8 w-8 text-slate-300" />

                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    No booking data returned.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rawBookingEntries.map(
                    ([key, value]) => (
                      <RawDataNode
                        key={key}
                        label={key}
                        value={value}
                        level={0}
                        expandedFields={
                          expandedFields
                        }
                        onToggle={
                          toggleCompleteField
                        }
                        loadingField={
                          loadingField
                        }
                        path={key}
                      />
                    )
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Complete API response
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">
                    {rawBookingEntries.length}{" "}
                    top-level fields •{" "}
                    {expandableFieldCount}{" "}
                    expandable fields
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    toggleCompleteData
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-100"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                  Hide Complete Data
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Raw JSON */}

        <Section
          title="Raw API Response"
          description="Exact booking object currently loaded by this page."
          icon={FileText}
        >
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100">
              <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />

              <span>
                Show Raw JSON
              </span>

              <span className="ml-auto text-xs font-medium text-slate-400">
                Developer view
              </span>
            </summary>

            <pre className="mt-3 max-h-[600px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-200 shadow-inner">
              {JSON.stringify(
                booking,
                null,
                2
              )}
            </pre>
          </details>
        </Section>

        {/* Footer Actions */}

        <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <button
            type="button"
            onClick={() =>
              navigate(
                BOOKINGS_PATH
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to={`/super-admin/bookings/${booking.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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