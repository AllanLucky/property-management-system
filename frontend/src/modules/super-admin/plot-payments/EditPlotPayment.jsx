
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
  Wallet,
} from "lucide-react";

import PlotPaymentForm from "./PlotPaymentForm";
import usePlotPayments from "../../../hooks/usePlotPayments";
import plotPaymentService from "../../../services/plotPayment.service";
import plotSaleService from "../../../services/plotSale.service";

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Extract a single record from the standard API response envelope.
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

/**
 * Extract collection data from paginated or non-paginated responses.
 */
const extractCollection = (response) => {
  if (!response) return [];

  const candidates = [
    response.data?.data?.data,
    response.data?.data?.items,
    response.data?.data,
    response.data?.items,
    response.data,
    response.items,
  ];

  return candidates.find(Array.isArray) || [];
};

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

    if (firstError) return firstError;
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to process your request. Please try again."
  );
};

/*
|--------------------------------------------------------------------------
| EDIT PLOT PAYMENT PAGE
|--------------------------------------------------------------------------
*/

const EditPlotPayment = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [payment, setPayment] = useState(null);
  const [plotSales, setPlotSales] = useState([]);

  const [paymentLoading, setPaymentLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(false);

  const [pageError, setPageError] = useState("");
  const [salesError, setSalesError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | PAYMENT HOOK
  |--------------------------------------------------------------------------
  */

  const {
    updatePlotPayment,
    updating,
  } = usePlotPayments({
    autoFetch: false,
  });

  /*
  |--------------------------------------------------------------------------
  | LOAD PAYMENT RECORD
  |--------------------------------------------------------------------------
  */

  const fetchPaymentRecord = useCallback(async (paymentId) => {
    if (typeof plotPaymentService.getPlotPayment === "function") {
      return plotPaymentService.getPlotPayment(paymentId);
    }

    if (typeof plotPaymentService.show === "function") {
      return plotPaymentService.show(paymentId);
    }

    if (typeof plotPaymentService.getById === "function") {
      return plotPaymentService.getById(paymentId);
    }

    throw new Error(
      "Payment details method is missing from plotPayment.service.js."
    );
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FETCH PAYMENT
  |--------------------------------------------------------------------------
  */

  const fetchPayment = useCallback(async () => {
    if (!id) {
      setPageError("Payment ID is missing.");
      setPaymentLoading(false);
      return;
    }

    try {
      setPaymentLoading(true);
      setPageError("");

      const response = await fetchPaymentRecord(id);
      const record = extractRecord(response);

      if (!record) {
        throw new Error(
          "The requested plot payment could not be found."
        );
      }

      setPayment(record);
    } catch (error) {
      setPayment(null);
      setPageError(getErrorMessage(error));
    } finally {
      setPaymentLoading(false);
    }
  }, [id, fetchPaymentRecord]);

  /*
  |--------------------------------------------------------------------------
  | LOAD OUTSTANDING PLOT SALES
  |--------------------------------------------------------------------------
  */

  const fetchAvailablePlotSales = useCallback(async () => {
    try {
      setSalesLoading(true);
      setSalesError("");

      if (
        typeof plotSaleService.getOutstandingPlotSales !== "function"
      ) {
        throw new Error(
          "getOutstandingPlotSales() is not available in plotSale.service.js."
        );
      }

      const response =
        await plotSaleService.getOutstandingPlotSales({
          per_page: 100,
        });

      setPlotSales(extractCollection(response));
    } catch (error) {
      setSalesError(getErrorMessage(error));
    } finally {
      setSalesLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchPayment();
    fetchAvailablePlotSales();
  }, [fetchPayment, fetchAvailablePlotSales]);

  /*
  |--------------------------------------------------------------------------
  | UPDATE PAYMENT
  |--------------------------------------------------------------------------
  */

  const handleUpdatePayment = useCallback(
    async (payload) => {
      try {
        const response = await updatePlotPayment(id, payload);

        if (response?.status === false) {
          throw new Error(
            response.message || "Failed to update plot payment."
          );
        }

        navigate("/super-admin/plot-payments", {
          replace: true,
          state: {
            successMessage: "Plot payment updated successfully.",
          },
        });

        return response;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    [id, navigate, updatePlotPayment]
  );

  /*
  |--------------------------------------------------------------------------
  | RETRY
  |--------------------------------------------------------------------------
  */

  const handleRetry = useCallback(() => {
    fetchPayment();
    fetchAvailablePlotSales();
  }, [fetchPayment, fetchAvailablePlotSales]);

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (paymentLoading) {
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

  if (pageError || !payment) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate("/super-admin/plot-payments")}
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
                {pageError ||
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
            onClick={() => navigate("/super-admin/plot-payments")}
            className="mt-1 rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-50 hover:text-blue-600"
            title="Back to payments"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                <Wallet size={21} />
              </div>

              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Edit Plot Payment
              </h1>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Update payment information and payer details.
            </p>

            <p className="mt-1 text-xs font-semibold text-blue-700">
              {payment.payment_number || `Payment #${payment.id}`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRetry}
          disabled={paymentLoading || salesLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              paymentLoading || salesLoading ? "animate-spin" : ""
            }
          />
          Refresh
        </button>
      </div>

      {/* SALES ERROR */}
      {salesError && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Unable to load outstanding plot sales
            </p>

            <p className="mt-1 text-sm text-amber-700">
              {salesError}
            </p>

            <button
              type="button"
              onClick={fetchAvailablePlotSales}
              className="mt-2 text-sm font-semibold text-amber-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* FORM */}
      <PlotPaymentForm
        payment={payment}
        plotSales={plotSales}
        loading={salesLoading}
        submitting={updating}
        error={null}
        onSubmit={handleUpdatePayment}
        onCancel={() =>
          navigate("/super-admin/plot-payments")
        }
        onRefreshSales={fetchAvailablePlotSales}
        submitLabel="Update Payment"
      />
    </div>
  );
};

export default EditPlotPayment;
