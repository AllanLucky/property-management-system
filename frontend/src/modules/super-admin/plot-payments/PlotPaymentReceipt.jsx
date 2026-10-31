import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Printer,
  Receipt,
  RefreshCw,
  User,
} from "lucide-react";

import PlotPaymentStatusBadge from "./PlotPaymentStatusBadge";
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

  if (typeof errors === "string") return errors;

  if (errors && typeof errors === "object") {
    const firstError = Object.values(errors)
      .flat()
      .find(Boolean);

    if (firstError) return firstError;
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load payment receipt. Please try again."
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
    return `${currency || "KES"} ${Number.isFinite(value)
      ? value.toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      : "0.00"
      }`;
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
    month: "long",
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

const getRelatedSale = (payment) =>
  payment?.plot_sale ||
  payment?.plotSale ||
  payment?.sale ||
  null;

const getSalePlot = (sale) =>
  sale?.plot ||
  sale?.plot_details ||
  null;

const getSaleBuyer = (sale) =>
  sale?.buyer ||
  sale?.customer ||
  sale?.client ||
  null;

/*
|--------------------------------------------------------------------------
| RECEIPT DETAIL COMPONENT
|--------------------------------------------------------------------------
*/

const ReceiptDetail = ({ label, value, bold = false }) => (
  <div className="grid grid-cols-1 gap-1 border-b border-dashed border-gray-200 py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:items-start sm:gap-4">
    <span className="min-w-0 text-xs font-medium text-gray-500 sm:text-sm">
      {label}
    </span>

    <span
      className={`min-w-0 break-words text-left text-sm sm:text-right ${bold
        ? "font-bold text-gray-900"
        : "font-medium text-gray-700"
        }`}
    >
      {value === null || value === undefined || value === ""
        ? "Not provided"
        : value}
    </span>
  </div>
);

/*
|--------------------------------------------------------------------------
| PLOT PAYMENT RECEIPT
|--------------------------------------------------------------------------
*/

const PlotPaymentReceipt = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const paymentNumber =
    payment?.payment_number ||
    `PAY-${payment?.id || id}`;

  const receiptNumber =
    payment?.receipt_number ||
    "Not generated";

  const buyerName =
    payment?.payer_name ||
    buyer?.name ||
    buyer?.full_name ||
    "Not provided";

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

  const amount = Number(payment?.amount || 0);
  const isCompleted = payment?.status === "completed";

  /*
  |--------------------------------------------------------------------------
  | PRINT RECEIPT
  |--------------------------------------------------------------------------
  */

  const handlePrint = () => {
    if (!isCompleted) {
      return;
    }

    window.print();
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-9 w-9 animate-spin text-blue-600" />

          <p className="text-sm font-medium text-gray-600">
            Preparing payment receipt...
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
      <div className="w-full space-y-6 px-1 sm:px-0">
        <button
          type="button"
          onClick={() => navigate("/super-admin/plot-payments")}
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to Plot Payments
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-red-800">
                Unable to prepare receipt
              </h2>

              <p className="mt-1 break-words text-sm text-red-700">
                {error || "The requested payment could not be found."}
              </p>

              <button
                type="button"
                onClick={fetchPayment}
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
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
    <div className="w-full min-w-0 space-y-5 px-1 sm:space-y-6 sm:px-0">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 print:hidden lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={() =>
              navigate("/super-admin/plot-payments")
            }
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-blue-600"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Payment Receipt
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Review and print the plot payment receipt.
            </p>

            <p className="mt-1 break-all text-xs font-semibold text-blue-700">
              {paymentNumber}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
          <div className="flex justify-start sm:justify-center">
            <PlotPaymentStatusBadge
              status={payment.status}
              size="sm"
              showIcon
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={fetchPayment}
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 sm:px-4"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={!isCompleted}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
            >
              <Printer size={17} />
              Print Receipt
            </button>
          </div>
        </div>
      </div>

      {/* PAYMENT STATUS NOTICE */}
      {!isCompleted && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:p-4 print:hidden">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              Payment is not completed
            </p>

            <p className="mt-1 break-words text-sm text-amber-700">
              This payment currently has a {formatLabel(payment.status)} status.
              It is not a confirmed payment receipt.
            </p>
          </div>
        </div>
      )}

      {/* RECEIPT */}
      <div
        id="plot-payment-receipt"
        className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none"
      >
        {/* RECEIPT HEADER */}
        <div className="border-b-2 border-blue-600 px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white sm:h-14 sm:w-14">
                <Building2 size={28} />
              </div>

              <div className="min-w-0">
                <h2 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">
                  EstateKenya
                </h2>

                <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-500 sm:text-xs">
                  Property Management System
                </p>
              </div>
            </div>

            <div className="min-w-0 text-left sm:text-right">
              <h1 className="text-xl font-extrabold uppercase tracking-wider text-blue-700 sm:text-2xl">
                Payment Receipt
              </h1>

              <p className="mt-2 break-words text-sm font-semibold text-gray-800">
                Receipt No: {receiptNumber}
              </p>

              <p className="mt-1 break-all text-xs text-gray-500">
                Payment No: {paymentNumber}
              </p>
            </div>
          </div>
        </div>

        {/* RECEIPT BODY */}
        <div className="space-y-6 px-4 py-6 sm:space-y-8 sm:px-8 sm:py-8 lg:px-10">
          {/* PAYMENT CONFIRMATION */}
          <div className="flex flex-col gap-4 rounded-xl bg-gray-50 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Amount Received
              </p>

              <p className="mt-2 break-words text-2xl font-extrabold leading-tight text-gray-900 sm:text-3xl">
                {formatCurrency(amount, currency)}
              </p>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              {isCompleted ? (
                <>
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />

                  <div className="min-w-0">
                    <p className="font-bold text-green-700">
                      Payment Completed
                    </p>

                    <p className="text-xs text-gray-500">
                      Payment recorded as completed
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Clock3 className="h-6 w-6 shrink-0 text-amber-600" />

                  <div className="min-w-0">
                    <p className="font-bold text-amber-700">
                      {formatLabel(payment.status)}
                    </p>

                    <p className="text-xs text-gray-500">
                      Not a confirmed payment receipt
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RECEIPT DETAILS */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
            <section className="min-w-0">
              <h3 className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-bold uppercase tracking-wide text-gray-800 sm:text-sm">
                <Receipt size={17} className="shrink-0 text-blue-600" />
                Payment Details
              </h3>

              <ReceiptDetail label="Payment Number" value={paymentNumber} />
              <ReceiptDetail label="Receipt Number" value={receiptNumber} />
              <ReceiptDetail
                label="Transaction Reference"
                value={payment.transaction_reference}
              />
              <ReceiptDetail
                label="Payment Date"
                value={formatDate(payment.payment_date)}
              />
              <ReceiptDetail
                label="Payment Type"
                value={formatLabel(payment.payment_type)}
              />
              <ReceiptDetail
                label="Payment Method"
                value={formatLabel(payment.payment_method)}
              />
              <ReceiptDetail label="Currency" value={currency} />
            </section>

            <section className="min-w-0">
              <h3 className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-bold uppercase tracking-wide text-gray-800 sm:text-sm">
                <User size={17} className="shrink-0 text-blue-600" />
                Received From
              </h3>

              <ReceiptDetail
                label="Payer Name"
                value={payment.payer_name || buyerName}
              />
              <ReceiptDetail
                label="Phone Number"
                value={payment.payer_phone}
              />
              <ReceiptDetail
                label="Email Address"
                value={payment.payer_email}
              />
              <ReceiptDetail
                label="Payment Recorded"
                value={formatDateTime(payment.created_at)}
              />
            </section>
          </div>

          {/* RELATED PLOT SALE */}
          <section className="min-w-0">
            <h3 className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2 text-xs font-bold uppercase tracking-wide text-gray-800 sm:text-sm">
              <MapPin size={17} className="shrink-0 text-blue-600" />
              Plot Sale Information
            </h3>

            {sale ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                <div className="min-w-0">
                  <ReceiptDetail label="Sale Number" value={saleNumber} />
                  <ReceiptDetail label="Plot Number" value={plotNumber} />
                  <ReceiptDetail
                    label="Plot Name"
                    value={plot?.title || plot?.name}
                  />
                </div>

                <div className="min-w-0">
                  <ReceiptDetail label="Buyer" value={buyerName} />
                  <ReceiptDetail
                    label="Sale Price"
                    value={formatCurrency(
                      sale.sale_price,
                      sale.currency || currency
                    )}
                  />
                  <ReceiptDetail
                    label="Sale Status"
                    value={formatLabel(sale.status)}
                  />
                </div>
              </div>
            ) : (
              <p className="rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-500 sm:p-4">
                Related plot sale details were not included in the payment response.
                {payment.plot_sale_id
                  ? ` Plot Sale ID: ${payment.plot_sale_id}`
                  : ""}
              </p>
            )}
          </section>

          {/* NOTES */}
          {payment.notes && (
            <section className="min-w-0">
              <h3 className="mb-3 border-b border-gray-200 pb-2 text-xs font-bold uppercase tracking-wide text-gray-800 sm:text-sm">
                Notes
              </h3>

              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                {payment.notes}
              </p>
            </section>
          )}

          {/* TOTAL */}
          <div className="border-t-2 border-gray-800 pt-5">
            <div className="ml-auto w-full max-w-sm">
              <ReceiptDetail
                label="Total Amount Received"
                value={formatCurrency(amount, currency)}
                bold
              />
            </div>
          </div>

          {/* SIGNATURES */}
          <div className="grid grid-cols-1 gap-8 pt-6 sm:grid-cols-2 sm:gap-10 sm:pt-8">
            <div>
              <div className="h-10 border-b border-gray-400" />

              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">
                Received By / Authorized Officer
              </p>
            </div>

            <div>
              <div className="h-10 border-b border-gray-400" />

              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">
                Payer Signature
              </p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="border-t border-gray-200 pt-5 text-center">
            <p className="text-sm font-semibold text-gray-800">
              Thank you for your payment.
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              This receipt records the payment information available in EstateKenya.
            </p>

            <p className="mt-3 text-[10px] text-gray-400">
              Generated on {formatDateTime(new Date().toISOString())}
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="flex flex-col-reverse gap-3 print:hidden sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() =>
            navigate("/super-admin/plot-payments")
          }
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
        >
          <ArrowLeft size={16} />
          Back to Payments
        </button>

        <button
          type="button"
          onClick={handlePrint}
          disabled={!isCompleted}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Printer size={16} />
          Print Receipt
        </button>
      </div>

      {/* PRINT STYLES */}
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 14mm;
            }

            html,
            body {
              width: 100% !important;
              min-width: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body * {
              visibility: hidden;
            }

            #plot-payment-receipt,
            #plot-payment-receipt * {
              visibility: visible;
            }

            #plot-payment-receipt {
              position: absolute;
              inset: 0;
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              overflow: visible !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }

            #plot-payment-receipt section,
            #plot-payment-receipt .grid {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            #plot-payment-receipt h1,
            #plot-payment-receipt h2,
            #plot-payment-receipt h3 {
              break-after: avoid;
              page-break-after: avoid;
            }

            #plot-payment-receipt p,
            #plot-payment-receipt span {
              overflow-wrap: anywhere;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PlotPaymentReceipt;