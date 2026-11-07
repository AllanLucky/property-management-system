
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Banknote,
  Trash2,
  XCircle,
  Wallet,
} from "lucide-react";
import Swal from "sweetalert2";

import usePlotPayments from "../../../hooks/usePlotPayments";
import plotPaymentService from "../../../services/plotPayment.service";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Extract a readable error message.
 */
const getErrorMessage = (error) => {
  const responseErrors = error?.response?.data?.errors;

  if (typeof responseErrors === "string") {
    return responseErrors;
  }

  if (responseErrors && typeof responseErrors === "object") {
    const firstError = Object.values(responseErrors)
      .flat()
      .find(Boolean);

    if (firstError) {
      return firstError;
    }
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to delete this plot payment. Please try again."
  );
};

/**
 * Format currency.
 */
const formatCurrency = (amount, currency = "KES") => {
  const value = Number(amount ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currency || "KES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
};

/**
 * Format labels.
 */
const formatLabel = (value) => {
  if (!value) return "N/A";

  return String(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

/**
 * Normalize payment response.
 */
const extractPayment = (response) => {
  if (!response) return null;

  const candidates = [
    response?.data?.data?.payment,
    response?.data?.data,
    response?.data?.payment,
    response?.data,
    response?.payment,
    response,
  ];

  return (
    candidates.find(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        item.id
    ) || null
  );
};

/**
 * Safely format a date.
 */
const formatDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Payment status styling.
 */
const getStatusStyles = (status) => {
  const styles = {
    pending: "bg-amber-100 text-amber-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-700",
    refunded: "bg-purple-100 text-purple-700",
  };

  return (
    styles[String(status || "").toLowerCase()] ||
    "bg-gray-100 text-gray-700"
  );
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

const DeletePlotPayment = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | PAYMENT HOOK
  |--------------------------------------------------------------------------
  */

  const {
    deletePlotPayment,
    deleting,
  } = usePlotPayments({
    autoFetch: false,
  });

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [payment, setPayment] = useState(null);
  const [fetchingPayment, setFetchingPayment] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | FETCH PAYMENT
  |--------------------------------------------------------------------------
  */

  const fetchPayment = useCallback(async () => {
    if (!id) {
      setFetchError("Payment ID is missing.");
      setFetchingPayment(false);
      return;
    }

    setFetchingPayment(true);
    setFetchError("");

    try {
      let response;

      if (
        typeof plotPaymentService.getPlotPayment === "function"
      ) {
        response =
          await plotPaymentService.getPlotPayment(id);
      } else if (
        typeof plotPaymentService.show === "function"
      ) {
        response = await plotPaymentService.show(id);
      } else if (
        typeof plotPaymentService.getById === "function"
      ) {
        response = await plotPaymentService.getById(id);
      } else {
        throw new Error(
          "The plot payment service does not provide a payment details method."
        );
      }

      const record = extractPayment(response);

      if (!record) {
        throw new Error(
          "The requested plot payment could not be found."
        );
      }

      setPayment(record);
    } catch (error) {
      console.error(
        "Failed to fetch plot payment:",
        error
      );

      setFetchError(getErrorMessage(error));
      setPayment(null);
    } finally {
      setFetchingPayment(false);
    }
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | INITIAL FETCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  /*
  |--------------------------------------------------------------------------
  | DELETE PAYMENT
  |--------------------------------------------------------------------------
  */

  const handleDelete = useCallback(async () => {
    if (!payment?.id || deleting) return;

    const status = String(
      payment.status || ""
    ).toLowerCase();

    /*
     * Completed and refunded payments are protected.
     */
    if (["completed", "refunded"].includes(status)) {
      await Swal.fire({
        icon: "warning",
        title: "Deletion not allowed",
        text:
          status === "completed"
            ? "Completed payments cannot be deleted through this action."
            : "Refunded payments cannot be deleted through this action.",
        confirmButtonColor: "#2563eb",
      });

      return;
    }

    setDeleteError("");

    const paymentNumber =
      payment.payment_number || `#${payment.id}`;

    const amount = formatCurrency(
      payment.amount,
      payment.currency
    );

    const result = await Swal.fire({
      title: "Delete plot payment?",
      html: `
        <div style="text-align:left">
          <p>Are you sure you want to delete this payment?</p>

          <p style="margin-top:12px">
            <strong>Payment:</strong>
            ${String(paymentNumber).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char])}
          </p>

          <p>
            <strong>Amount:</strong>
            ${amount}
          </p>

          <p style="margin-top:12px;color:#dc2626">
            This action will remove the payment from active records.
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete payment",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deletePlotPayment(payment.id);

      if (
        response?.status === false ||
        response?.data?.status === false
      ) {
        throw new Error(
          response?.message ||
          response?.data?.message ||
          "Failed to delete the plot payment."
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Payment deleted",
        text: "The plot payment has been deleted successfully.",
        confirmButtonColor: "#2563eb",
      });

      navigate("/super-admin/plot-payments", {
        replace: true,
      });
    } catch (error) {
      const message = getErrorMessage(error);

      console.error(
        "Plot payment deletion failed:",
        error
      );

      setDeleteError(message);

      await Swal.fire({
        icon: "error",
        title: "Deletion failed",
        text: message,
        confirmButtonColor: "#dc2626",
      });
    }
  }, [payment, deleting, deletePlotPayment, navigate]);

  /*
  |--------------------------------------------------------------------------
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const handleCancel = useCallback(() => {
    navigate(
      payment?.id
        ? `/super-admin/plot-payments/${payment.id}`
        : "/super-admin/plot-payments"
    );
  }, [navigate, payment]);

  /*
  |--------------------------------------------------------------------------
  | RETRY
  |--------------------------------------------------------------------------
  */

  const handleRetry = useCallback(() => {
    fetchPayment();
  }, [fetchPayment]);

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (fetchingPayment) {
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

  if (fetchError || !payment) {
    return (
      <div className="space-y-6">

        {/* HEADER */}

        <button
          type="button"
          onClick={() =>
            navigate("/super-admin/plot-payments")
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to Plot Payments
        </button>

        {/* ERROR */}

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">

            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-red-800">
                Unable to load payment
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {fetchError ||
                  "The requested payment could not be found."}
              </p>

              <button
                type="button"
                onClick={handleRetry}
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
  | PAYMENT DETAILS
  |--------------------------------------------------------------------------
  */

  const sale =
    payment.plot_sale ||
    payment.plotSale ||
    payment.sale ||
    {};

  const plot =
    sale.plot ||
    payment.plot ||
    {};

  const buyer =
    sale.buyer ||
    payment.buyer ||
    {};

  const paymentNumber =
    payment.payment_number || `#${payment.id}`;

  const saleNumber =
    sale.sale_number ||
    sale.agreement_number ||
    sale.reference_number ||
    "N/A";

  const buyerName =
    buyer.name ||
    buyer.full_name ||
    payment.payer_name ||
    "N/A";

  const status = String(
    payment.status || ""
  ).toLowerCase();

  const isProtected = [
    "completed",
    "refunded",
  ].includes(status);

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
            onClick={handleCancel}
            className="mt-1 rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-50 hover:text-blue-600"
            aria-label="Back to payments"
            title="Back to payments"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <div className="flex items-center gap-2">

              <div className="rounded-lg bg-red-100 p-2 text-red-700">
                <Trash2 size={21} />
              </div>

              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Delete Plot Payment
              </h1>

            </div>

            <p className="mt-2 text-sm text-gray-500">
              Review the payment details before confirming deletion.
            </p>

            <p className="mt-1 text-xs font-semibold text-red-700">
              {paymentNumber}
            </p>
          </div>
        </div>

        {/* REFRESH BUTTON */}

        <button
          type="button"
          onClick={handleRetry}
          disabled={fetchingPayment}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={fetchingPayment ? "animate-spin" : ""}
          />

          Refresh
        </button>

      </div>

      {/* WARNING */}

      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

        <div>
          <h2 className="text-sm font-semibold text-red-800">
            Important: Please review before deleting
          </h2>

          <p className="mt-1 text-sm leading-6 text-red-700">
            Deleting this payment removes it from active payment records.
            Make sure the payment information is correct before proceeding.
            Your backend should preserve financial audit history where
            required.
          </p>
        </div>

      </div>

      {/* PROTECTED PAYMENT WARNING */}

      {isProtected && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">

          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <div>
            <h2 className="text-sm font-semibold text-amber-800">
              This payment cannot be deleted
            </h2>

            <p className="mt-1 text-sm text-amber-700">
              {status === "completed"
                ? "Completed payments are protected from ordinary deletion."
                : "Refunded payments are protected from ordinary deletion."}
            </p>
          </div>

        </div>
      )}

      {/* DELETE ERROR */}

      {deleteError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <h3 className="text-sm font-semibold text-red-800">
              Failed to delete payment
            </h3>

            <p className="mt-1 text-sm text-red-700">
              {deleteError}
            </p>
          </div>

        </div>
      )}

      {/* PAYMENT INFORMATION */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">

          <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
            <Wallet size={20} />
          </div>

          <div>
            <h2 className="font-bold text-gray-900">
              Payment Information
            </h2>

            <p className="text-xs text-gray-500">
              Payment reference: {paymentNumber}
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Payment Number
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {paymentNumber}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Receipt Number
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {payment.receipt_number || "Not issued"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Amount
            </p>

            <p className="mt-1 text-lg font-bold text-gray-900">
              {formatCurrency(
                payment.amount,
                payment.currency
              )}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Payment Status
            </p>

            <p className="mt-1">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyles(status)}`}
              >
                {formatLabel(status)}
              </span>
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Payment Type
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {formatLabel(payment.payment_type)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Payment Method
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {formatLabel(payment.payment_method)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Payment Date
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {formatDate(payment.payment_date)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Transaction Reference
            </p>

            <p className="mt-1 break-all font-medium text-gray-900">
              {payment.transaction_reference || "N/A"}
            </p>
          </div>

        </div>
      </div>

      {/* RELATED PLOT SALE */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">

          <div className="rounded-lg bg-green-100 p-2 text-green-700">
            <Banknote size={20} />
          </div>

          <div>
            <h2 className="font-bold text-gray-900">
              Related Plot Sale
            </h2>

            <p className="text-xs text-gray-500">
              Sale and buyer information associated with this payment.
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Sale Reference
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {saleNumber}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Plot
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {plot.title ||
                plot.plot_number ||
                plot.code ||
                "N/A"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Buyer
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {buyerName}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Payer Phone
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {payment.payer_phone ||
                buyer.phone ||
                "N/A"}
            </p>
          </div>

        </div>
      </div>

      {/* ACTIONS */}

      <div className="flex flex-col-reverse gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

        <button
          type="button"
          onClick={handleCancel}
          disabled={deleting}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft size={16} />
          Cancel
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting || isProtected}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 size={16} />
              Delete Payment
            </>
          )}
        </button>

      </div>

    </div>
  );
};

export default DeletePlotPayment;
