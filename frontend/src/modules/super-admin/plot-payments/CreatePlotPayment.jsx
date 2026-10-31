
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Wallet,
} from "lucide-react";

import PlotPaymentForm from "./PlotPaymentForm";
import usePlotPayments from "../../../hooks/usePlotPayments";
import plotSaleService from "../../../services/plotSale.service";

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Extract a readable error message from API/Axios errors.
 */
const getErrorMessage = (error) => {
  const response = error?.response?.data;

  if (response?.errors && typeof response.errors === "object") {
    const messages = Object.values(response.errors)
      .flat()
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join("\n");
    }
  }

  return (
    response?.message ||
    error?.message ||
    "An unexpected error occurred. Please try again."
  );
};

/**
 * Extract collection data from different API response structures.
 */
const extractCollection = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  const candidates = [
    response?.data?.data?.data,
    response?.data?.data?.items,
    response?.data?.data,
    response?.data?.items,
    response?.data,
    response?.items,
  ];

  return candidates.find(Array.isArray) || [];
};

/**
 * Check whether the API returned an unsuccessful response.
 */
const isFailedResponse = (response) => {
  return (
    response?.status === false ||
    response?.data?.status === false
  );
};

/*
|--------------------------------------------------------------------------
| CREATE PLOT PAYMENT PAGE
|--------------------------------------------------------------------------
*/

const CreatePlotPayment = () => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | PAYMENT HOOK
  |--------------------------------------------------------------------------
  */

  const {
    createPlotPayment,
    creating,
    loading: paymentLoading,
  } = usePlotPayments({
    autoFetch: false,
  });

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [plotSales, setPlotSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD OUTSTANDING PLOT SALES
  |--------------------------------------------------------------------------
  */

  const fetchAvailablePlotSales = useCallback(async () => {
    setSalesLoading(true);
    setSalesError("");

    try {
      const getOutstandingSales =
        plotSaleService.getOutstandingPlotSales ||
        plotSaleService.getOutstanding;

      if (typeof getOutstandingSales !== "function") {
        throw new Error(
          "The outstanding plot sales service method is missing. Check plotSale.service.js."
        );
      }

      const response = await getOutstandingSales.call(
        plotSaleService,
        {
          page: 1,
          per_page: 100,
        }
      );

      if (isFailedResponse(response)) {
        throw new Error(
          response?.message ||
          response?.data?.message ||
          "Failed to fetch outstanding plot sales."
        );
      }

      const sales = extractCollection(response);

      setPlotSales(sales);

      if (sales.length === 0) {
        setSalesError(
          "No outstanding plot sales were found. Create or activate a plot sale before recording a payment."
        );
      }
    } catch (error) {
      const message = getErrorMessage(error);

      console.error(
        "Failed to load outstanding plot sales:",
        error
      );

      setSalesError(message);
      setPlotSales([]);
    } finally {
      setSalesLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | INITIAL DATA FETCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchAvailablePlotSales();
  }, [fetchAvailablePlotSales]);

  /*
  |--------------------------------------------------------------------------
  | CREATE PAYMENT
  |--------------------------------------------------------------------------
  */

  const handleCreatePayment = useCallback(
    async (payload) => {
      try {
        if (typeof createPlotPayment !== "function") {
          throw new Error(
            "The create plot payment function is not configured."
          );
        }

        const response = await createPlotPayment(payload);

        if (isFailedResponse(response)) {
          throw new Error(
            response?.message ||
            response?.data?.message ||
            "Failed to create plot payment."
          );
        }

        navigate("/super-admin/plot-payments", {
          replace: true,
        });

        return response;
      } catch (error) {
        console.error(
          "Plot payment creation failed:",
          error
        );

        throw new Error(getErrorMessage(error));
      }
    },
    [createPlotPayment, navigate]
  );

  /*
  |--------------------------------------------------------------------------
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const handleCancel = useCallback(() => {
    navigate("/super-admin/plot-payments");
  }, [navigate]);

  const handleViewPlotSales = useCallback(() => {
    navigate("/super-admin/plot-sales");
  }, [navigate]);

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
            title="Back to payments"
            aria-label="Back to plot payments"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <div className="flex items-center gap-2">

              <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                <Wallet size={21} />
              </div>

              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Record Plot Payment
              </h1>

            </div>

            <p className="mt-2 text-sm text-gray-500">
              Record a deposit, installment, balance, or full payment
              against an existing plot sale.
            </p>

            <p className="mt-1 text-xs font-semibold text-blue-700">
              New Payment
            </p>
          </div>
        </div>

        {/* REFRESH BUTTON */}

        <button
          type="button"
          onClick={fetchAvailablePlotSales}
          disabled={salesLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={salesLoading ? "animate-spin" : ""}
          />

          Refresh
        </button>
      </div>

      {/* INFORMATION BANNER */}

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
          <ShieldCheck size={20} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-blue-900">
            Secure Payment Recording
          </h3>

          <p className="mt-1 text-xs leading-5 text-blue-800">
            All newly recorded payments are initially marked as pending.
            Payment completion and refunds must be verified through
            authorized payment processing workflows.
          </p>
        </div>
      </div>

      {/* SALES LOADING */}

      {salesLoading && plotSales.length === 0 && (
        <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-gray-200 bg-white p-8">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw
              size={32}
              className="animate-spin text-blue-600"
            />

            <p className="text-sm font-medium text-gray-600">
              Loading outstanding plot sales...
            </p>
          </div>
        </div>
      )}

      {/* SALES ERROR */}

      {salesError && !salesLoading && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">

          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Unable to load outstanding plot sales
            </p>

            <p className="mt-1 whitespace-pre-line text-sm text-amber-700">
              {salesError}
            </p>

            <button
              type="button"
              onClick={fetchAvailablePlotSales}
              disabled={salesLoading}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-800 underline disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={salesLoading ? "animate-spin" : ""}
              />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* PAYMENT FORM */}

      {(plotSales.length > 0 || salesLoading) && (
        <PlotPaymentForm
          plotSales={plotSales}
          loading={salesLoading || paymentLoading}
          submitting={creating}
          error={null}
          onSubmit={handleCreatePayment}
          onCancel={handleCancel}
          onRefreshSales={fetchAvailablePlotSales}
          submitLabel="Record Payment"
          currency="KES"
        />
      )}

      {/* EMPTY STATE */}

      {!salesLoading &&
        !salesError &&
        plotSales.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Banknote size={26} />
            </div>

            <h3 className="text-lg font-bold text-gray-900">
              No Plot Sales Available
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              You need an outstanding plot sale before you can record
              a payment.
            </p>

            <button
              type="button"
              onClick={handleViewPlotSales}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View Plot Sales
            </button>

          </div>
        )}

    </div>
  );
};

export default CreatePlotPayment;
