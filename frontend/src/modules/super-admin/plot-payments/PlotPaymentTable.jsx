
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  FileText,
  MapPin,
  MoreVertical,
  Pencil,
  Receipt,
  RefreshCw,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 2,
  }).format(toNumber(value));

const formatCurrency = (amount, currency = "KES") => {
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency || "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(toNumber(amount));
  } catch {
    return `${currency || "KES"} ${formatNumber(amount)}`;
  }
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const formatLabel = (value) => {
  if (!value) return "—";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getInitials = (name) => {
  if (!name) return "NA";

  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

/*
|--------------------------------------------------------------------------
| PAYMENT ID
|--------------------------------------------------------------------------
*/

const getPaymentId = (payment) => {
  if (!payment || typeof payment !== "object") return null;

  const id =
    payment.id ??
    payment.payment_id ??
    payment.plot_payment_id ??
    payment.uuid ??
    payment.payment?.id;

  if (
    id === null ||
    id === undefined ||
    typeof id === "object" ||
    String(id).trim() === ""
  ) {
    return null;
  }

  return String(id);
};

/*
|--------------------------------------------------------------------------
| PAYMENT DATA HELPERS
|--------------------------------------------------------------------------
*/

const getPayerName = (payment) =>
  payment?.payer_name ||
  payment?.payer?.name ||
  payment?.plot_sale?.buyer?.name ||
  payment?.plotSale?.buyer?.name ||
  payment?.buyer?.name ||
  "Unknown Payer";

const getPlotSale = (payment) =>
  payment?.plot_sale || payment?.plotSale || null;

const getPlot = (payment) => {
  const sale = getPlotSale(payment);

  return (
    payment?.plot ||
    sale?.plot ||
    sale?.plot_details ||
    null
  );
};

const getPaymentNumber = (payment) =>
  payment?.payment_number ||
  payment?.number ||
  `PAY-${getPaymentId(payment) || "N/A"}`;

const getReceiptNumber = (payment) =>
  payment?.receipt_number || null;

const getPaymentReference = (payment) =>
  payment?.transaction_reference ||
  payment?.reference ||
  payment?.transaction_id ||
  null;

const getPaymentAmount = (payment) =>
  payment?.amount ?? payment?.payment_amount ?? 0;

const getPaymentCurrency = (payment, defaultCurrency = "KES") =>
  payment?.currency ||
  getPlotSale(payment)?.currency ||
  defaultCurrency;

const getPaymentDate = (payment) =>
  payment?.payment_date ||
  payment?.created_at ||
  payment?.date ||
  null;

const getPaymentMethod = (payment) =>
  payment?.payment_method || payment?.method || "other";

const getPaymentType = (payment) =>
  payment?.payment_type || payment?.type || "other";

const getPlotSaleNumber = (payment) => {
  const sale = getPlotSale(payment);

  return (
    sale?.sale_number ||
    sale?.agreement_number ||
    sale?.code ||
    (sale?.id ? `SALE-${sale.id}` : null) ||
    (payment?.plot_sale_id
      ? `SALE-${payment.plot_sale_id}`
      : "—")
  );
};

const getPlotName = (payment) => {
  const plot = getPlot(payment);

  return (
    plot?.title ||
    plot?.name ||
    plot?.plot_number ||
    plot?.code ||
    "Plot details unavailable"
  );
};

const getPlotLocation = (payment) => {
  const plot = getPlot(payment);
  const location = plot?.location;

  return (
    (typeof location === "object" ? location?.name : location) ||
    plot?.location_name ||
    plot?.county?.name ||
    null
  );
};

const getPayerContact = (payment) =>
  payment?.payer_phone ||
  payment?.payer?.phone ||
  getPlotSale(payment)?.buyer?.phone ||
  payment?.payer_email ||
  payment?.payer?.email ||
  null;

/*
|--------------------------------------------------------------------------
| SAFE ACTION HANDLERS
|--------------------------------------------------------------------------
*/

const createPaymentAction = (callback, payment, actionName) => {
  const id = getPaymentId(payment);

  if (!id) {
    console.error(
      `Cannot ${actionName} payment: payment ID is missing.`,
      payment
    );

    return null;
  }

  if (typeof callback === "function") {
    callback(id);
  }

  return id;
};

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

const STATUS_CONFIG = {
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
    icon: Clock3,
  },
  failed: {
    label: "Failed",
    className: "bg-rose-50 text-rose-700 ring-rose-600/20",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-600 ring-slate-500/20",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    className: "bg-violet-50 text-violet-700 ring-violet-600/20",
    icon: RefreshCw,
  },
};

const PlotPaymentStatusBadge = ({ status }) => {
  const normalizedStatus = String(status || "pending").toLowerCase();

  const config = STATUS_CONFIG[normalizedStatus] || {
    label: formatLabel(normalizedStatus),
    className: "bg-slate-100 text-slate-600 ring-slate-500/20",
    icon: Clock3,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| PAYMENT METHOD BADGE
|--------------------------------------------------------------------------
*/

const METHOD_CONFIG = {
  mpesa: {
    label: "M-Pesa",
    className: "bg-emerald-50 text-emerald-700",
    icon: Wallet,
  },
  bank_transfer: {
    label: "Bank Transfer",
    className: "bg-blue-50 text-blue-700",
    icon: Banknote,
  },
  cash: {
    label: "Cash",
    className: "bg-amber-50 text-amber-700",
    icon: Banknote,
  },
  card: {
    label: "Card",
    className: "bg-violet-50 text-violet-700",
    icon: CreditCard,
  },
  cheque: {
    label: "Cheque",
    className: "bg-cyan-50 text-cyan-700",
    icon: FileText,
  },
  online: {
    label: "Online",
    className: "bg-indigo-50 text-indigo-700",
    icon: CreditCard,
  },
  other: {
    label: "Other",
    className: "bg-slate-100 text-slate-600",
    icon: Wallet,
  },
};

const PaymentMethodBadge = ({ method }) => {
  const normalizedMethod = String(method || "other").toLowerCase();
  const config = METHOD_CONFIG[normalizedMethod] || METHOD_CONFIG.other;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| PAYMENT TYPE BADGE
|--------------------------------------------------------------------------
*/

const PAYMENT_TYPE_CONFIG = {
  deposit: "bg-indigo-50 text-indigo-700",
  installment: "bg-blue-50 text-blue-700",
  balance: "bg-emerald-50 text-emerald-700",
  full_payment: "bg-violet-50 text-violet-700",
  other: "bg-slate-100 text-slate-600",
};

const PaymentTypeBadge = ({ type }) => {
  const normalizedType = String(type || "other").toLowerCase();

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
        PAYMENT_TYPE_CONFIG[normalizedType] ||
        PAYMENT_TYPE_CONFIG.other
      }`}
    >
      {formatLabel(normalizedType)}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| LOADING SKELETON
|--------------------------------------------------------------------------
*/

const PaymentTableSkeleton = ({ rows = 5 }) => (
  <div className="animate-pulse">
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className="grid grid-cols-6 gap-4 border-b border-slate-100 px-5 py-5"
      >
        <div className="space-y-2">
          <div className="h-3 w-28 rounded bg-slate-200" />
          <div className="h-3 w-20 rounded bg-slate-100" />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-3 w-16 rounded bg-slate-100" />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-3 w-20 rounded bg-slate-100" />
        </div>

        <div className="h-6 w-20 rounded-full bg-slate-200" />
        <div className="h-6 w-24 rounded-full bg-slate-200" />

        <div className="flex justify-end gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-200" />
          <div className="h-8 w-8 rounded-lg bg-slate-200" />
        </div>
      </div>
    ))}
  </div>
);

/*
|--------------------------------------------------------------------------
| EMPTY STATE
|--------------------------------------------------------------------------
*/

const EmptyPaymentState = ({ onRefresh, hasFilters = false }) => (
  <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
      <Receipt className="h-8 w-8 text-indigo-400" />
    </div>

    <h3 className="text-base font-bold text-slate-900">
      {hasFilters
        ? "No matching payments found"
        : "No plot payments recorded"}
    </h3>

    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
      {hasFilters
        ? "Try adjusting your search or filters to find the payment you are looking for."
        : "Payment transactions will appear here once they have been recorded in the system."}
    </p>

    {onRefresh && (
      <button
        type="button"
        onClick={onRefresh}
        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh Payments
      </button>
    )}
  </div>
);

/*
|--------------------------------------------------------------------------
| ACTION BUTTON
|--------------------------------------------------------------------------
*/

const ActionButton = ({
  title,
  icon: Icon,
  onClick,
  color = "slate",
  disabled = false,
}) => {
  const colors = {
    slate: "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
    indigo: "text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700",
    amber: "text-amber-600 hover:bg-amber-50 hover:text-amber-700",
    rose: "text-rose-600 hover:bg-rose-50 hover:text-rose-700",
    emerald: "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${
        colors[color] || colors.slate
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};

/*
|--------------------------------------------------------------------------
| PAYMENT ROW
|--------------------------------------------------------------------------
*/

const PlotPaymentRow = ({
  payment,
  onView,
  onEdit,
  onDelete,
  onViewReceipt,
  onNavigateReceipt,
  defaultCurrency,
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const paymentId = getPaymentId(payment);
  const paymentNumber = getPaymentNumber(payment);
  const receiptNumber = getReceiptNumber(payment);
  const reference = getPaymentReference(payment);
  const payerName = getPayerName(payment);
  const payerContact = getPayerContact(payment);
  const saleNumber = getPlotSaleNumber(payment);
  const plotName = getPlotName(payment);
  const plotLocation = getPlotLocation(payment);
  const amount = getPaymentAmount(payment);
  const currency = getPaymentCurrency(payment, defaultCurrency);
  const paymentDate = getPaymentDate(payment);
  const status = payment?.status || "pending";
  const method = getPaymentMethod(payment);
  const type = getPaymentType(payment);

  const handleView = () =>
    createPaymentAction(onView, payment, "view");

  const handleEdit = () =>
    createPaymentAction(onEdit, payment, "edit");

  const handleDelete = () =>
    createPaymentAction(onDelete, payment, "delete");

  const handleReceipt = () => {
    const id = getPaymentId(payment);

    if (!id) {
      console.error("Cannot view receipt: payment ID is missing.", payment);
      return;
    }

    if (typeof onViewReceipt === "function") {
      onViewReceipt(id);
      return;
    }

    if (typeof onNavigateReceipt === "function") {
      onNavigateReceipt(id);
      return;
    }

    navigate(`/super-admin/plot-payments/${encodeURIComponent(id)}/receipt`);
  };

  return (
    <tr className="group transition-colors hover:bg-slate-50/80">
      <td className="px-5 py-4">
        <div className="min-w-[190px]">
          <button
            type="button"
            onClick={handleView}
            disabled={!paymentId || !onView}
            className="text-left text-sm font-bold text-indigo-700 transition hover:text-indigo-900 hover:underline disabled:opacity-50"
          >
            {paymentNumber}
          </button>

          {receiptNumber && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <Receipt className="h-3 w-3" />
              <span>{receiptNumber}</span>
            </div>
          )}

          {reference && (
            <p className="mt-1 max-w-[190px] truncate text-xs text-slate-400">
              Ref: {reference}
            </p>
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex min-w-[190px] items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700">
            {getInitials(payerName)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {payerName}
            </p>

            {payerContact && (
              <p className="mt-1 max-w-[170px] truncate text-xs text-slate-500">
                {payerContact}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="min-w-[180px]">
          <p className="text-sm font-semibold text-slate-800">
            {saleNumber}
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="max-w-[180px] truncate">{plotName}</span>
          </p>

          {plotLocation && (
            <p className="mt-1 truncate text-xs text-slate-400">
              {plotLocation}
            </p>
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="min-w-[150px]">
          <p className="text-sm font-bold text-slate-900">
            {formatCurrency(amount, currency)}
          </p>

          <div className="mt-1">
            <PaymentTypeBadge type={type} />
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <PaymentMethodBadge method={method} />
      </td>

      <td className="px-5 py-4">
        <div className="min-w-[130px]">
          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
            {formatDate(paymentDate)}
          </p>

          {payment?.created_at && paymentDate !== payment?.created_at && (
            <p className="mt-1 text-xs text-slate-400">
              Recorded: {formatDate(payment.created_at)}
            </p>
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <PlotPaymentStatusBadge status={status} />
      </td>

      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <ActionButton
            title="View payment"
            icon={Eye}
            color="indigo"
            onClick={handleView}
            disabled={!paymentId || !onView}
          />

          <ActionButton
            title="View receipt"
            icon={Receipt}
            color="emerald"
            onClick={handleReceipt}
            disabled={!paymentId}
          />

          <ActionButton
            title="Edit payment"
            icon={Pencil}
            color="amber"
            onClick={handleEdit}
            disabled={!paymentId || !onEdit}
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              title="More actions"
              aria-label="More payment actions"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close actions menu"
                  className="fixed inset-0 z-20 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />

                <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl">
                  <button
                    type="button"
                    disabled={!paymentId || !onView}
                    onClick={() => {
                      setMenuOpen(false);
                      handleView();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>

                  <button
                    type="button"
                    disabled={!paymentId}
                    onClick={() => {
                      setMenuOpen(false);
                      handleReceipt();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-40"
                  >
                    <Receipt className="h-4 w-4" />
                    View Receipt
                  </button>

                  <button
                    type="button"
                    disabled={!paymentId || !onEdit}
                    onClick={() => {
                      setMenuOpen(false);
                      handleEdit();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-amber-600 transition hover:bg-amber-50 disabled:opacity-40"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Payment
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    disabled={!paymentId || !onDelete}
                    onClick={() => {
                      setMenuOpen(false);
                      handleDelete();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Payment
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

/*
|--------------------------------------------------------------------------
| MOBILE PAYMENT CARD
|--------------------------------------------------------------------------
*/

const MobilePaymentCard = ({
  payment,
  onView,
  onEdit,
  onDelete,
  onViewReceipt,
  onNavigateReceipt,
  defaultCurrency,
}) => {
  const navigate = useNavigate();

  const paymentId = getPaymentId(payment);
  const payerName = getPayerName(payment);
  const currency = getPaymentCurrency(payment, defaultCurrency);
  const amount = getPaymentAmount(payment);
  const paymentNumber = getPaymentNumber(payment);
  const receiptNumber = getReceiptNumber(payment);
  const saleNumber = getPlotSaleNumber(payment);
  const plotName = getPlotName(payment);
  const paymentDate = getPaymentDate(payment);

  const handleView = () =>
    createPaymentAction(onView, payment, "view");

  const handleEdit = () =>
    createPaymentAction(onEdit, payment, "edit");

  const handleDelete = () =>
    createPaymentAction(onDelete, payment, "delete");

  const handleReceipt = () => {
    const id = getPaymentId(payment);

    if (!id) {
      console.error("Cannot view receipt: payment ID is missing.", payment);
      return;
    }

    if (typeof onViewReceipt === "function") {
      onViewReceipt(id);
      return;
    }

    if (typeof onNavigateReceipt === "function") {
      onNavigateReceipt(id);
      return;
    }

    navigate(`/super-admin/plot-payments/${encodeURIComponent(id)}/receipt`);
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700">
            {getInitials(payerName)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {paymentNumber}
            </p>

            <p className="mt-1 truncate text-xs text-slate-500">
              {payerName}
            </p>
          </div>
        </div>

        <PlotPaymentStatusBadge status={payment?.status} />
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-medium text-slate-500">
          Payment Amount
        </p>

        <p className="mt-1 text-xl font-bold text-slate-900">
          {formatCurrency(amount, currency)}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <PaymentTypeBadge type={getPaymentType(payment)} />
          <PaymentMethodBadge method={getPaymentMethod(payment)} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-400">Plot Sale</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-700">
            {saleNumber}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">Payment Date</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {formatDate(paymentDate)}
          </p>
        </div>

        <div className="col-span-2">
          <p className="text-xs text-slate-400">Plot</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-700">
            {plotName}
          </p>
        </div>

        {receiptNumber && (
          <div className="col-span-2">
            <p className="text-xs text-slate-400">Receipt Number</p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {receiptNumber}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={handleView}
          disabled={!paymentId || !onView}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-40"
        >
          <Eye className="h-4 w-4" />
          Details
        </button>

        <div className="flex items-center gap-1">
          <ActionButton
            title="View receipt"
            icon={Receipt}
            color="emerald"
            onClick={handleReceipt}
            disabled={!paymentId}
          />

          <ActionButton
            title="Edit payment"
            icon={Pencil}
            color="amber"
            onClick={handleEdit}
            disabled={!paymentId || !onEdit}
          />

          <ActionButton
            title="Delete payment"
            icon={Trash2}
            color="rose"
            onClick={handleDelete}
            disabled={!paymentId || !onDelete}
          />
        </div>
      </div>
    </article>
  );
};

/*
|--------------------------------------------------------------------------
| MAIN TABLE COMPONENT
|--------------------------------------------------------------------------
*/

const PlotPaymentTable = ({
  payments = [],
  loading = false,
  error = null,
  onView,
  onEdit,
  onDelete,
  onViewReceipt,
  onNavigateReceipt,
  onRefresh,
  hasFilters = false,
  currency = "KES",
  className = "",
}) => {
  const paymentList = Array.isArray(payments) ? payments : [];

  if (error && !loading && paymentList.length === 0) {
    return (
      <div
        className={`overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm ${className}`}
      >
        <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
            <XCircle className="h-7 w-7 text-rose-500" />
          </div>

          <h3 className="text-base font-bold text-slate-900">
            Unable to load payments
          </h3>

          <p className="mt-2 max-w-md text-sm text-slate-500">
            {typeof error === "string"
              ? error
              : error?.message ||
                "An unexpected error occurred while loading plot payments."}
          </p>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">
            Plot Payment Records
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Manage and monitor recorded plot payment transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
            {formatNumber(paymentList.length)}{" "}
            {paymentList.length === 1 ? "Record" : "Records"}
          </span>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh payments"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 p-4 md:hidden">
        {loading && paymentList.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : paymentList.length === 0 ? (
          <EmptyPaymentState
            onRefresh={onRefresh}
            hasFilters={hasFilters}
          />
        ) : (
          paymentList.map((payment, index) => (
            <MobilePaymentCard
              key={getPaymentId(payment) ?? getPaymentNumber(payment) ?? index}
              payment={payment}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewReceipt={onViewReceipt}
              onNavigateReceipt={onNavigateReceipt}
              defaultCurrency={currency}
            />
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-[1250px] w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/80">
            <tr>
              {[
                "Payment Details",
                "Payer",
                "Plot Sale",
                "Amount",
                "Method",
                "Payment Date",
                "Status",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 ${
                    heading === "Actions" ? "text-right" : "text-left"
                  }`}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && paymentList.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-0">
                  <PaymentTableSkeleton rows={5} />
                </td>
              </tr>
            ) : paymentList.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyPaymentState
                    onRefresh={onRefresh}
                    hasFilters={hasFilters}
                  />
                </td>
              </tr>
            ) : (
              paymentList.map((payment, index) => (
                <PlotPaymentRow
                  key={getPaymentId(payment) ?? getPaymentNumber(payment) ?? index}
                  payment={payment}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onViewReceipt={onViewReceipt}
                  onNavigateReceipt={onNavigateReceipt}
                  defaultCurrency={currency}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {loading && paymentList.length > 0 && (
        <div className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Updating payment records...
        </div>
      )}

      {!loading && paymentList.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Showing {formatNumber(paymentList.length)} payment{" "}
            {paymentList.length === 1 ? "record" : "records"} on this page.
          </p>

          <p className="text-xs text-slate-400">
            Payment information is displayed according to the selected filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlotPaymentTable;
