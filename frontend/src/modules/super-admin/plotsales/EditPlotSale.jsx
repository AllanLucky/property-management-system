import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  LoaderCircle,
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

const getCollection = (response) => {
  const candidates = [
    response?.data?.data?.data,
    response?.data?.data?.items,
    response?.data?.data,
    response?.data?.items,
    response?.data,
    response?.items,
    response,
  ];

  return candidates.find(Array.isArray) ?? [];
};

const unwrapResponse = (response) => {
  let result = response;

  // Unwrap common Axios responses and Laravel API envelopes.
  for (let i = 0; i < 5; i += 1) {
    if (!result || typeof result !== "object" || Array.isArray(result)) {
      break;
    }

    if (
      result.plot_sale &&
      typeof result.plot_sale === "object"
    ) {
      result = result.plot_sale;
      continue;
    }

    if (
      result.sale &&
      typeof result.sale === "object"
    ) {
      result = result.sale;
      continue;
    }

    if (
      result.data &&
      typeof result.data === "object" &&
      !Array.isArray(result.data)
    ) {
      result = result.data;
      continue;
    }

    break;
  }

  return result;
};

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;

  if (responseData?.errors) {
    const firstError = Object.values(responseData.errors)
      .flat()
      .find(Boolean);

    if (firstError) {
      return firstError;
    }
  }

  return (
    responseData?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

const formatDateForInput = (value) => {
  if (!value) return "";

  const date = String(value).slice(0, 10);

  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
};

const normalizeSale = (rawSale) => {
  const sale = unwrapResponse(rawSale);

  if (!sale || typeof sale !== "object" || !sale.id) {
    return null;
  }

  const plot = sale.plot ?? {};
  const buyer = sale.buyer ?? {};
  const agent = sale.agent ?? {};

  return {
    ...sale,

    // Keep the API's actual field names available to the form.
    plot_id: sale.plot_id ?? plot.id ?? "",
    buyer_id: sale.buyer_id ?? buyer.id ?? "",
    agent_id: sale.agent_id ?? agent.id ?? "",

    sale_number: sale.sale_number ?? "",
    agreement_number: sale.agreement_number ?? "",

    sale_date: formatDateForInput(sale.sale_date),
    agreement_date: formatDateForInput(sale.agreement_date),
    due_date: formatDateForInput(sale.due_date),

    sale_price: sale.sale_price ?? "",

    // The backend uses deposit_amount and discount_amount.
    deposit_amount:
      sale.deposit_amount ?? sale.deposit ?? "",

    discount_amount:
      sale.discount_amount ?? sale.discount ?? "",

    currency: String(sale.currency ?? "KES").toUpperCase(),
    payment_frequency: sale.payment_frequency ?? "once",
    status: sale.status ?? "pending",
    notes: sale.notes ?? "",
  };
};

const formatCurrency = (value, currency = "KES") => {
  const amount = Number(value ?? 0);

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  } catch {
    return `${currency} ${amount.toLocaleString("en-KE")}`;
  }
};

/*
|--------------------------------------------------------------------------
| Edit Plot Sale
|--------------------------------------------------------------------------
*/

const EditPlotSale = ({
  plots: initialPlots = [],
  buyers: initialBuyers = [],
  agents: initialAgents = [],
  onUpdated,
}) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const plotSalesApi = usePlotSales();

  const {
    loading: hookLoading = false,
    submitting: hookSubmitting = false,
    error: hookError = null,
  } = plotSalesApi;

  /*
  |--------------------------------------------------------------------------
  | API Methods
  |--------------------------------------------------------------------------
  | These fallbacks support common method names. Prefer matching the names
  | exposed by your actual usePlotSales hook.
  */

  const fetchSaleMethod =
    plotSalesApi.fetchPlotSale ??
    plotSalesApi.getPlotSale ??
    plotSalesApi.fetchPlotSaleById ??
    plotSalesApi.getPlotSaleById;

  const updateSaleMethod =
    plotSalesApi.updatePlotSale;

  const fetchPlotsMethod =
    plotSalesApi.fetchPlots;

  const fetchBuyersMethod =
    plotSalesApi.fetchBuyers;

  const fetchAgentsMethod =
    plotSalesApi.fetchAgents;

  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [sale, setSale] = useState(null);

  const [plots, setPlots] = useState(initialPlots);
  const [buyers, setBuyers] = useState(initialBuyers);
  const [agents, setAgents] = useState(initialAgents);

  const [loadingSale, setLoadingSale] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [pageError, setPageError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Plot Sale
  |--------------------------------------------------------------------------
  */

  const loadSale = useCallback(async () => {
    if (!id) {
      setPageError("The plot sale ID is missing.");
      setLoadingSale(false);
      return;
    }

    if (typeof fetchSaleMethod !== "function") {
      setPageError(
        "Your usePlotSales hook does not expose a method for loading one plot sale. Add fetchPlotSale(id) or getPlotSale(id) to the hook."
      );
      setLoadingSale(false);
      return;
    }

    setLoadingSale(true);
    setPageError("");

    try {
      const response = await fetchSaleMethod(id);
      const normalizedSale = normalizeSale(response);

      if (!normalizedSale) {
        throw new Error(
          "The requested plot sale could not be found."
        );
      }

      setSale(normalizedSale);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoadingSale(false);
    }
  }, [id, fetchSaleMethod]);

  useEffect(() => {
    loadSale();
  }, [loadSale]);

  /*
  |--------------------------------------------------------------------------
  | Load Form Options
  |--------------------------------------------------------------------------
  */

  const loadOptions = useCallback(async () => {
    const jobs = [];

    if (
      plots.length === 0 &&
      typeof fetchPlotsMethod === "function"
    ) {
      jobs.push(
        Promise.resolve()
          .then(() => fetchPlotsMethod())
          .then((response) => {
            const collection = getCollection(response);

            if (collection.length > 0) {
              setPlots(collection);
            }
          })
      );
    }

    if (
      buyers.length === 0 &&
      typeof fetchBuyersMethod === "function"
    ) {
      jobs.push(
        Promise.resolve()
          .then(() => fetchBuyersMethod())
          .then((response) => {
            const collection = getCollection(response);

            if (collection.length > 0) {
              setBuyers(collection);
            }
          })
      );
    }

    if (
      agents.length === 0 &&
      typeof fetchAgentsMethod === "function"
    ) {
      jobs.push(
        Promise.resolve()
          .then(() => fetchAgentsMethod())
          .then((response) => {
            const collection = getCollection(response);

            if (collection.length > 0) {
              setAgents(collection);
            }
          })
      );
    }

    if (jobs.length === 0) return;

    setLoadingOptions(true);

    try {
      const results = await Promise.allSettled(jobs);

      const failed = results.some(
        (result) => result.status === "rejected"
      );

      if (failed) {
        setPageError((current) =>
          current ||
          "Some form options could not be loaded. You can retry or check your API connection."
        );
      }
    } finally {
      setLoadingOptions(false);
    }
  }, [
    plots.length,
    buyers.length,
    agents.length,
    fetchPlotsMethod,
    fetchBuyersMethod,
    fetchAgentsMethod,
  ]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  /*
  |--------------------------------------------------------------------------
  | Form Initial Values
  |--------------------------------------------------------------------------
  */

  const initialValues = useMemo(() => {
    if (!sale) return {};

    return {
      ...sale,

      plot_id: String(sale.plot_id ?? ""),
      buyer_id: String(sale.buyer_id ?? ""),
      agent_id:
        sale.agent_id == null ? "" : String(sale.agent_id),

      sale_price: String(sale.sale_price ?? ""),
      deposit: String(
        sale.deposit_amount ?? sale.deposit ?? 0
      ),
      discount: String(
        sale.discount_amount ?? sale.discount ?? 0
      ),

      sale_date: formatDateForInput(sale.sale_date),
      agreement_date: formatDateForInput(sale.agreement_date),
      due_date: formatDateForInput(sale.due_date),

      currency: String(sale.currency ?? "KES").toUpperCase(),
      payment_frequency: sale.payment_frequency ?? "once",
      status: sale.status ?? "pending",
      notes: sale.notes ?? "",
    };
  }, [sale]);

  /*
  |--------------------------------------------------------------------------
  | Update Plot Sale
  |--------------------------------------------------------------------------
  */

  const handleUpdate = useCallback(
    async (formValues) => {
      if (!sale?.id) {
        throw new Error("Cannot update a plot sale without an ID.");
      }

      if (typeof updateSaleMethod !== "function") {
        throw new Error(
          "Your usePlotSales hook does not expose updatePlotSale(id, payload)."
        );
      }

      const values = formValues ?? {};

      const salePrice = Number(values.sale_price);
      const depositAmount = Number(
        values.deposit_amount ?? values.deposit ?? 0
      );
      const discountAmount = Number(
        values.discount_amount ?? values.discount ?? 0
      );

      if (!Number.isFinite(salePrice) || salePrice <= 0) {
        throw new Error("Sale price must be greater than zero.");
      }

      if (
        !Number.isFinite(depositAmount) ||
        depositAmount < 0
      ) {
        throw new Error(
          "Deposit amount must be zero or greater."
        );
      }

      if (
        !Number.isFinite(discountAmount) ||
        discountAmount < 0
      ) {
        throw new Error(
          "Discount amount must be zero or greater."
        );
      }

      const allowedStatuses = [
        "pending",
        "reserved",
        "approved",
      ];

      const status = String(
        values.status ?? sale.status ?? "pending"
      ).toLowerCase();

      if (!allowedStatuses.includes(status)) {
        throw new Error(
          "Only pending, reserved, or approved statuses can be set here. Use the dedicated operation for completion or cancellation."
        );
      }

      const currency = String(
        values.currency ?? sale.currency ?? "KES"
      )
        .trim()
        .toUpperCase();

      if (!/^[A-Z]{3}$/.test(currency)) {
        throw new Error(
          "Please provide a valid three-letter currency code, such as KES."
        );
      }

      /*
       * Send only fields accepted by UpdatePlotSaleRequest.
       * Payment totals, completion and cancellation are managed separately.
       */
      const payload = {
        plot_id: Number(values.plot_id),
        buyer_id: Number(values.buyer_id),
        agent_id:
          values.agent_id === "" ||
          values.agent_id == null
            ? null
            : Number(values.agent_id),

        sale_number: String(
          values.sale_number ?? sale.sale_number ?? ""
        ).trim(),

        agreement_number:
          String(values.agreement_number ?? "").trim() || null,

        sale_date: values.sale_date || sale.sale_date || null,

        agreement_date:
          values.agreement_date || null,

        sale_price: salePrice,
        deposit_amount: depositAmount,
        discount_amount: discountAmount,

        currency,

        payment_frequency:
          values.payment_frequency || null,

        due_date: values.due_date || null,

        status,

        notes: String(values.notes ?? "").trim() || null,
      };

      if (
        !Number.isInteger(payload.plot_id) ||
        payload.plot_id <= 0
      ) {
        throw new Error("Please select a valid plot.");
      }

      if (
        !Number.isInteger(payload.buyer_id) ||
        payload.buyer_id <= 0
      ) {
        throw new Error("Please select a valid buyer.");
      }

      if (
        payload.agent_id !== null &&
        (!Number.isInteger(payload.agent_id) ||
          payload.agent_id <= 0)
      ) {
        throw new Error(
          "Please select a valid sales agent or leave it blank."
        );
      }

      setSubmitting(true);
      setPageError("");

      try {
        await updateSaleMethod(sale.id, payload);

        await Swal.fire({
          icon: "success",
          title: "Plot sale updated",
          text: "The plot sale details have been updated successfully.",
          confirmButtonText: "Continue",
          confirmButtonColor: "#059669",
        });

        if (typeof onUpdated === "function") {
          await onUpdated(sale.id, payload);
        }

        navigate("/super-admin/plots/sales");
      } catch (error) {
        const message = getErrorMessage(error);

        setPageError(message);

        await Swal.fire({
          icon: "error",
          title: "Update failed",
          text: message,
          confirmButtonColor: "#059669",
        });

        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [
      sale,
      updateSaleMethod,
      navigate,
      onUpdated,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loadingSale) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex min-h-[50vh] max-w-7xl flex-col items-center justify-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
            <LoaderCircle
              size={30}
              className="animate-spin text-emerald-700"
            />
          </div>

          <h2 className="text-lg font-semibold text-slate-800">
            Loading plot sale
          </h2>

          <p className="mt-2 text-center text-sm text-slate-500">
            Retrieving the sale details. Please wait.
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error State
  |--------------------------------------------------------------------------
  */

  if (pageError && !sale) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => navigate("/super-admin/plots/sales")}
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Back to Plot Sales
          </button>

          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <AlertCircle
                size={24}
                className="text-red-600"
              />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Unable to load plot sale
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {pageError || getErrorMessage(hookError)}
            </p>

            <button
              type="button"
              onClick={loadSale}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Main Page
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <PlotSaleHeader
          title="Edit Plot Sale"
          description="Update sale details, buyer information, agreement terms, and payment arrangements."
          showRefresh
          onRefresh={loadSale}
          loading={loadingSale || loadingOptions}
          showCreate={false}
          showReports={false}
        />

        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <button
            type="button"
            onClick={() => navigate("/super-admin/plots/sales")}
            className="font-medium transition hover:text-emerald-700"
          >
            Plot Sales
          </button>

          <span>/</span>

          <span className="font-medium text-slate-700">
            Edit Sale
          </span>

          <span>/</span>

          <span className="font-semibold text-emerald-700">
            {sale?.sale_number || `Sale #${sale?.id}`}
          </span>
        </div>

        {/* Sale Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sale Number
            </p>
            <p className="mt-2 break-words text-lg font-bold text-slate-900">
              {sale?.sale_number || "Not assigned"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sale Price
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {formatCurrency(
                sale?.sale_price,
                sale?.currency || "KES"
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Amount Paid
            </p>
            <p className="mt-2 text-lg font-bold text-emerald-700">
              {formatCurrency(
                sale?.amount_paid,
                sale?.currency || "KES"
              )}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Maintained by recorded payments
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Outstanding Balance
            </p>
            <p className="mt-2 text-lg font-bold text-amber-700">
              {formatCurrency(
                sale?.balance,
                sale?.currency || "KES"
              )}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Calculated by the application
            </p>
          </div>
        </div>

        {/* Form Error */}
        {pageError && sale && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Some form options may not be available
              </p>
              <p className="mt-1">{pageError}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setPageError("");
                loadOptions();
              }}
              className="shrink-0 font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Edit Form */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Sale Information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Edit the details below and save your changes.
                </p>
              </div>

              <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold capitalize text-emerald-700 ring-1 ring-inset ring-emerald-100">
                {String(sale?.status || "pending").replace(
                  /_/g,
                  " "
                )}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <PlotSaleForm
              key={sale?.id}
              mode="edit"
              sale={sale}
              initialData={initialValues}
              initialValues={initialValues}
              plots={plots}
              buyers={buyers}
              agents={agents}
              loading={loadingOptions}
              submitting={
                submitting ||
                hookSubmitting ||
                hookLoading
              }
              onSubmit={handleUpdate}
              onCancel={() =>
                navigate("/super-admin/plots/sales")
              }
              showActiveStatus={false}
            />
          </div>
        </div>

        {/* Financial Integrity Notice */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-blue-700"
          />

          <div>
            <h3 className="text-sm font-bold text-blue-900">
              Payment and sale status protection
            </h3>
            <p className="mt-1 text-sm leading-6 text-blue-800">
              Amount paid and outstanding balance are managed by
              recorded plot payments. Completion, cancellation, and
              active-status changes must use their dedicated backend
              operations. This form only permits pending, reserved,
              and approved statuses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPlotSale;