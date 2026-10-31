
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Receipt,
  User,
  Wallet,
} from "lucide-react";

import PlotPaymentStatusBadge from "./PlotPaymentStatusBadge";
import usePlotPayments from "../../../hooks/usePlotPayments";
import plotPaymentService from "../../../services/plotPayment.service";

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

const extractRecord = (response) => {
  if (!response) return null;

  const candidates = [
    response.data?.data?.payment,
    response.data?.data,
    response.data?.payment,
    response.data,
    response.payment,
    response,
  ];

  return (
    candidates.find(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        (item.id || item.payment_number)
    ) || null
  );
};

const getErrorMessage = (error) => {
  const errors = error?.response?.data?.errors;

  if (typeof errors === "string") {
    return errors;
  }

  if (errors && typeof errors === "object") {
    const firstError = Object.values(errors)
      .flat()
      .find(Boolean);

    if (firstError) return firstError;
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load payment details. Please try again."
  );
};

/*
|--------------------------------------------------------------------------
| FORMATTING HELPERS
|--------------------------------------------------------------------------
*/

const formatCurrency = (amount, currency = "KES") => {
  const value = Number(amount ?? 0);

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency || "KES",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  } catch {
    return `${currency || "KES"} ${Number.isFinite(value) ? value.toLocaleString("en-KE") : "0.00"}`;
  }
};

const formatDate = (date) => {
  if (!date) return "Not provided";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
};

const formatDateTime = (date) => {
  if (!date) return "Not provided";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
};

const formatLabel = (value) => {
  if (!value) return "Not provided";

  return String(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getRelatedSale = (payment) => {
  return (
    payment?.plot_sale ||
    payment?.plotSale ||
    payment?.sale ||
    null
  );
};

const getSalePlot = (sale) => {
  return sale?.plot || sale?.plot_details || null;
};

const getSaleBuyer = (sale) => {
  return (
    sale?.buyer ||
    sale?.customer ||
    sale?.client ||
    null
  );
};

/*
|--------------------------------------------------------------------------
| REUSABLE INFORMATION COMPONENTS
|--------------------------------------------------------------------------
*/

const DetailItem = ({
  label,
  value,
  icon: Icon,
  className = "",
}) => (
  <div className={`flex min-w-0 items-start gap-3 ${className}`}>
    {Icon && (
      <div className="mt-0.5 rounded-lg bg-gray-100 p-2 text-gray-500">
        <Icon size={17} />
      </div>
    )}

    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-gray-800">
        {value === null || value === undefined || value === ""
          ? "Not provided"
          : value}
      </p>
    </div>
  </div>
);

const SectionCard = ({
  title,
  description,
  icon: Icon,
  children,
  action,
}) => (
  <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <Icon size={19} />
          </div>
        )}

        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>

          {description && (
            <p className="mt-0.5 text-xs text-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>

    <div className="p-5">{children}</div>
  </section>
);

const SummaryCard = ({
  label,
  value,
  icon: Icon,
  color = "blue",
}) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className={`rounded-lg p-2 ${colors[color] || colors.blue}`}>
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| PLOT PAYMENT DETAILS PAGE
|--------------------------------------------------------------------------
*/

const PlotPaymentDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const {
    updating,
  } = usePlotPayments({
    autoFetch: false,
  });

  /*
  |--------------------------------------------------------------------------
  | LOAD PAYMENT
  |--------------------------------------------------------------------------
  */

  const fetchPayment = useCallback(async () => {
    if (!id) {
      setError("Payment ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      let response;

      if (typeof plotPaymentService.getPlotPayment === "function") {
        response = await plotPaymentService.getPlotPayment(id);
      } else if (typeof plotPaymentService.show === "function") {
        response = await plotPaymentService.show(id);
      } else if (typeof plotPaymentService.getById === "function") {
        response = await plotPaymentService.getById(id);
      } else {
        throw new Error(
          "Payment details method is missing from plotPayment.service.js."
        );
      }

      const record = extractRecord(response);

      if (!record) {
        throw new Error("The requested payment could not be found.");
      }

      setPayment(record);
    } catch (fetchError) {
      setPayment(null);
      setError(getErrorMessage(fetchError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  /*
  |--------------------------------------------------------------------------
  | DERIVED DATA
  |--------------------------------------------------------------------------
  */

  const sale = getRelatedSale(payment);
  const plot = getSalePlot(sale);
  const buyer = getSaleBuyer(sale);

  const currency =
    payment?.currency ||
    sale?.currency ||
    "KES";

  const amount = Number(payment?.amount || 0);

  const paymentNumber =
    payment?.payment_number || `PAY-${payment?.id || id}`;

  const receiptNumber =
    payment?.receipt_number || "Not generated";

  const saleNumber =
    sale?.sale_number ||
    sale?.agreement_number ||
    sale?.code ||
    "Not available";

  const plotNumber =
    plot?.code ||
    plot?.plot_number ||
    plot?.title_number ||
    "Not available";

  const buyerName =
    payment?.payer_name ||
    buyer?.name ||
    buyer?.full_name ||
    "Not provided";

  const paymentStatus = payment?.status || "pending";

  /*
  |--------------------------------------------------------------------------
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const handleEdit = () => {
    navigate(`/super-admin/plot-payments/${id}/edit`);
  };

  const handleBack = () => {
    navigate("/super-admin/plot-payments");
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-blue-600" />

          <p className="text-sm font-medium text-gray-600">
            Loading payment details...
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR STATE
  |--------------------------------------------------------------------------
  */

  if (error || !payment) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to Plot Payments
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />

            <div className="flex-1">
              <h2 className="font-semibold text-red-800">
                Unable to load payment
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error || "The requested payment could not be found."}
              </p>

              <button
                type="button"
                onClick={fetchPayment}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                <RefreshCw size={15} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="mt-1 rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-50 hover:text-blue-600"
            title="Back to payments"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                <Wallet size={21} />
              </div>

              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Plot Payment Details
              </h1>

              <PlotPaymentStatusBadge status={paymentStatus} />
            </div>

            <p className="mt-2 text-sm text-gray-500">
              View payment information, transaction details, and associated plot sale.
            </p>

            <p className="mt-1 text-xs font-semibold text-blue-700">
              {paymentNumber}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchPayment}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleEdit}
            disabled={
              updating ||
              ["completed", "refunded"].includes(paymentStatus)
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil size={16} />
            Edit Payment
          </button>
        </div>
      </div>

      {/* PAYMENT SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Payment Amount"
          value={formatCurrency(amount, currency)}
          icon={Banknote}
          color="blue"
        />

        <SummaryCard
          label="Payment Type"
          value={formatLabel(payment.payment_type)}
          icon={Wallet}
          color="purple"
        />

        <SummaryCard
          label="Payment Method"
          value={formatLabel(payment.payment_method)}
          icon={CreditCard}
          color="amber"
        />

        <SummaryCard
          label="Payment Status"
          value={formatLabel(paymentStatus)}
          icon={
            paymentStatus === "completed"
              ? CheckCircle2
              : Clock3
          }
          color={
            paymentStatus === "completed"
              ? "green"
              : "amber"
          }
        />
      </div>

      {/* PAYMENT INFORMATION */}
      <SectionCard
        title="Payment Information"
        description="General payment and receipt information."
        icon={Receipt}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Payment Number"
            value={paymentNumber}
            icon={Receipt}
          />

          <DetailItem
            label="Receipt Number"
            value={receiptNumber}
            icon={FileText}
          />

          <DetailItem
            label="Transaction Reference"
            value={payment.transaction_reference}
            icon={CreditCard}
          />

          <DetailItem
            label="Payment Amount"
            value={formatCurrency(amount, currency)}
            icon={Banknote}
          />

          <DetailItem
            label="Payment Currency"
            value={currency}
            icon={Wallet}
          />

          <DetailItem
            label="Payment Type"
            value={formatLabel(payment.payment_type)}
            icon={FileText}
          />

          <DetailItem
            label="Payment Method"
            value={formatLabel(payment.payment_method)}
            icon={CreditCard}
          />

          <DetailItem
            label="Payment Date"
            value={formatDate(payment.payment_date)}
            icon={CalendarDays}
          />

          <DetailItem
            label="Created At"
            value={formatDateTime(payment.created_at)}
            icon={Clock3}
          />

          <DetailItem
            label="Last Updated"
            value={formatDateTime(payment.updated_at)}
            icon={RefreshCw}
          />

          <DetailItem
            label="Active Status"
            value={payment.is_active ? "Active" : "Inactive"}
            icon={CheckCircle2}
          />
        </div>
      </SectionCard>

      {/* PAYER INFORMATION */}
      <SectionCard
        title="Payer Information"
        description="Contact information associated with this payment."
        icon={User}
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label="Payer Name"
            value={payment.payer_name || buyerName}
            icon={User}
          />

          <DetailItem
            label="Phone Number"
            value={payment.payer_phone}
            icon={Phone}
          />

          <DetailItem
            label="Email Address"
            value={payment.payer_email}
            icon={Mail}
          />
        </div>
      </SectionCard>

      {/* RELATED PLOT SALE */}
      <SectionCard
        title="Related Plot Sale"
        description="Plot sale associated with this payment."
        icon={MapPin}
        action={
          sale?.id ? (
            <button
              type="button"
              onClick={() =>
                navigate(`/super-admin/plot-sales/${sale.id}`)
              }
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-800"
            >
              View Plot Sale
            </button>
          ) : null
        }
      >
        {sale ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem
              label="Sale Number"
              value={saleNumber}
              icon={FileText}
            />

            <DetailItem
              label="Plot Number"
              value={plotNumber}
              icon={MapPin}
            />

            <DetailItem
              label="Plot Title"
              value={plot?.title || plot?.name}
              icon={MapPin}
            />

            <DetailItem
              label="Buyer"
              value={buyerName}
              icon={User}
            />

            <DetailItem
              label="Sale Price"
              value={formatCurrency(
                sale.sale_price,
                sale.currency || currency
              )}
              icon={Banknote}
            />

            <DetailItem
              label="Sale Status"
              value={formatLabel(sale.status)}
              icon={CheckCircle2}
            />

            <DetailItem
              label="Amount Paid"
              value={formatCurrency(
                sale.amount_paid,
                sale.currency || currency
              )}
              icon={Wallet}
            />

            <DetailItem
              label="Outstanding Balance"
              value={formatCurrency(
                sale.balance,
                sale.currency || currency
              )}
              icon={Banknote}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />

            <p className="mt-2 text-sm font-medium text-gray-700">
              Related plot sale information is unavailable.
            </p>

            <p className="mt-1 text-xs text-gray-500">
              The payment record does not include its related plot sale.
            </p>

            {payment.plot_sale_id && (
              <p className="mt-2 text-xs font-semibold text-gray-600">
                Plot Sale ID: {payment.plot_sale_id}
              </p>
            )}
          </div>
        )}
      </SectionCard>

      {/* NOTES */}
      <SectionCard
        title="Payment Notes"
        description="Additional information recorded for this payment."
        icon={FileText}
      >
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
            {payment.notes || "No additional notes were provided."}
          </p>
        </div>
      </SectionCard>

      {/* FOOTER ACTIONS */}
      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Back to Payments
        </button>

        <button
          type="button"
          onClick={handleEdit}
          disabled={
            updating ||
            ["completed", "refunded"].includes(paymentStatus)
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil size={16} />
          Edit Payment
        </button>
      </div>
    </div>
  );
};

export default PlotPaymentDetails;
