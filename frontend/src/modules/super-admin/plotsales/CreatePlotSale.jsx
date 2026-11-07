import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";

import PlotSaleHeader from "./PlotSaleHeader";
import PlotSaleForm from "./PlotSaleForm";
import { usePlotSales } from "../../../hooks/usePlotSales";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
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
    "Unable to create the plot sale. Please try again."
  );
};

const getCollection = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  return [];
};

/*
|--------------------------------------------------------------------------
| Create Plot Sale
|--------------------------------------------------------------------------
*/

const CreatePlotSale = ({
  plots: initialPlots,
  buyers: initialBuyers,
  agents: initialAgents,
  onCreated,
}) => {
  const navigate = useNavigate();

  const {
    createPlotSale,
    loading: hookLoading,
    submitting: hookSubmitting,
    error: hookError,
    fetchPlots,
    fetchBuyers,
    fetchAgents,
  } = usePlotSales();

  const [plots, setPlots] = useState(initialPlots ?? []);
  const [buyers, setBuyers] = useState(initialBuyers ?? []);
  const [agents, setAgents] = useState(initialAgents ?? []);

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [pageError, setPageError] = useState("");

  const [loaded, setLoaded] = useState({
    plots: Array.isArray(initialPlots),
    buyers: Array.isArray(initialBuyers),
    agents: Array.isArray(initialAgents),
  });

  const submitting = Boolean(hookSubmitting);

  /*
  |--------------------------------------------------------------------------
  | Load dropdown data
  |--------------------------------------------------------------------------
  |
  | The hook may expose these methods if your existing implementation
  | supports loading plots, buyers and agents. If your hook uses different
  | method names, update these references to match your implementation.
  */

  const loadOptions = useCallback(
    async ({ force = false } = {}) => {
      if (loadingOptions) return;

      setLoadingOptions(true);
      setPageError("");

      try {
        const jobs = [];

        if (
          (force || !loaded.plots) &&
          typeof fetchPlots === "function"
        ) {
          jobs.push(
            fetchPlots().then((response) => {
              setPlots(getCollection(response));
              setLoaded((previous) => ({
                ...previous,
                plots: true,
              }));
            }),
          );
        }

        if (
          (force || !loaded.buyers) &&
          typeof fetchBuyers === "function"
        ) {
          jobs.push(
            fetchBuyers().then((response) => {
              setBuyers(getCollection(response));
              setLoaded((previous) => ({
                ...previous,
                buyers: true,
              }));
            }),
          );
        }

        if (
          (force || !loaded.agents) &&
          typeof fetchAgents === "function"
        ) {
          jobs.push(
            fetchAgents().then((response) => {
              setAgents(getCollection(response));
              setLoaded((previous) => ({
                ...previous,
                agents: true,
              }));
            }),
          );
        }

        await Promise.all(jobs);

        if (jobs.length === 0 && !loaded.plots) {
          setPageError(
            "Plot options are not available. Pass plots, buyers and agents as props or connect the corresponding loading methods in usePlotSales.",
          );
        }
      } catch (error) {
        setPageError(getErrorMessage(error));
      } finally {
        setLoadingOptions(false);
      }
    },
    [
      loadingOptions,
      loaded,
      fetchPlots,
      fetchBuyers,
      fetchAgents,
    ],
  );

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  /*
  |--------------------------------------------------------------------------
  | Create sale
  |--------------------------------------------------------------------------
  */

  const handleCreate = async (payload) => {
    setPageError("");

    if (typeof createPlotSale !== "function") {
      throw new Error(
        "createPlotSale is not available in usePlotSales. Add this method to your hook or update the import to match your existing API integration.",
      );
    }

    /*
     * Match StorePlotSaleRequest:
     * - deposit_amount, not deposit
     * - discount_amount, not discount
     * - no amount_paid or balance
     * - no completion_date, is_active or cancellation_reason
     * - new sale status must be pending or reserved
     */
    const requestPayload = {
      plot_id: Number(payload.plot_id),
      buyer_id: Number(payload.buyer_id),

      agent_id:
        payload.agent_id === "" ||
        payload.agent_id === null ||
        payload.agent_id === undefined
          ? null
          : Number(payload.agent_id),

      sale_price: Number(payload.sale_price),

      deposit_amount:
        payload.deposit_amount === "" ||
        payload.deposit_amount === null ||
        payload.deposit_amount === undefined
          ? 0
          : Number(payload.deposit_amount),

      discount_amount:
        payload.discount_amount === "" ||
        payload.discount_amount === null ||
        payload.discount_amount === undefined
          ? 0
          : Number(payload.discount_amount),

      currency: payload.currency || "KES",

      payment_frequency: payload.payment_frequency || null,

      sale_date: payload.sale_date || null,

      agreement_number:
        String(payload.agreement_number ?? "").trim() || null,

      agreement_date: payload.agreement_date || null,

      due_date: payload.due_date || null,

      notes: String(payload.notes ?? "").trim() || null,

      status: payload.status || "pending",
    };

    if (requestPayload.status !== "pending" &&
        requestPayload.status !== "reserved") {
      throw new Error(
        "A new plot sale must have pending or reserved status.",
      );
    }

    try {
      const response = await createPlotSale(requestPayload);

      await Swal.fire({
        icon: "success",
        title: "Plot Sale Created",
        text:
          response?.message ||
          response?.data?.message ||
          "The plot sale has been created successfully.",
        confirmButtonText: "View Sales",
        confirmButtonColor: "#059669",
      });

      if (typeof onCreated === "function") {
        onCreated(response);
      } else {
        navigate("/super-admin/plots/sales");
      }

      return response;
    } catch (error) {
      const message = getErrorMessage(error);

      setPageError(message);

      await Swal.fire({
        icon: "error",
        title: "Unable to Create Sale",
        text: message,
        confirmButtonColor: "#059669",
      });

      throw error;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleCancel = () => {
    if (submitting) return;

    navigate("/super-admin/plots/sales");
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  const pageLoading =
    loadingOptions ||
    (Boolean(hookLoading) && plots.length === 0);

  return (
    <div className="min-h-screen bg-gray-50/70">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <PlotSaleHeader
          title="Create Plot Sale"
          description="Register a new plot sale, assign the buyer and capture the financial agreement."
          showRefresh
          showCreate={false}
          showReports={false}
          loading={pageLoading}
          onRefresh={() => loadOptions({ force: true })}
        />

        {/* Back navigation */}
        <div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-gray-600 transition hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Plot Sales
          </button>
        </div>

        {/* Page error */}
        {(pageError || hookError) && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {pageError
                  ? "Unable to load or save plot sale"
                  : "Plot sale request failed"}
              </p>

              <p className="mt-1 whitespace-pre-line">
                {pageError || getErrorMessage(hookError)}
              </p>

              <button
                type="button"
                onClick={() => loadOptions({ force: true })}
                disabled={loadingOptions}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                {loadingOptions ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Retry loading options
              </button>
            </div>
          </div>
        )}

        {/* Dropdown data loading */}
        {pageLoading && (
          <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-12 shadow-sm">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />

              <p className="mt-3 text-sm font-semibold text-gray-800">
                Preparing sale form
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Loading available plots, buyers and agents...
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        {!pageLoading && (
          <PlotSaleForm
            mode="create"
            plots={plots}
            buyers={buyers}
            agents={agents}
            loading={false}
            submitting={submitting}
            onSubmit={handleCreate}
            onCancel={handleCancel}
            title="Create New Plot Sale"
            description="Complete the required information below to register the sale."
            submitLabel="Create Plot Sale"
            showSaleNumber
            showAgent
            showAgreement
            showPaymentDetails
            showNotes
            showActiveStatus={false}
          />
        )}
      </div>
    </div>
  );
};

export default CreatePlotSale;
