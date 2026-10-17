import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  FileText,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Swal from "sweetalert2";

import PlotSaleHeader from "./PlotSaleHeader";
import { usePlotSales } from "../../../hooks/usePlotSales";

/*
|--------------------------------------------------------------------------
| Helpers
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
    return `${currency || "KES"} ${value.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

const formatDate = (value) => {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not provided";

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return String(status)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getStatusClasses = (status) => {
  const normalized = String(status ?? "").toLowerCase();

  if (normalized === "approved") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }

  if (normalized === "completed") {
    return "bg-blue-50 text-blue-700 ring-blue-600/20";
  }

  if (normalized === "reserved") {
    return "bg-violet-50 text-violet-700 ring-violet-600/20";
  }

  if (normalized === "cancelled") {
    return "bg-rose-50 text-rose-700 ring-rose-600/20";
  }

  if (normalized === "pending") {
    return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }

  return "bg-gray-50 text-gray-700 ring-gray-600/20";
};

const getSalePrice = (sale) => {
  const price = Number(sale?.sale_price ?? 0);
  const discount = Number(
    sale?.discount_amount ?? sale?.discount ?? 0,
  );

  return Math.max(0, price - discount);
};

const getBalance = (sale) => {
  if (sale?.balance !== undefined && sale?.balance !== null) {
    const balance = Number(sale.balance);

    if (Number.isFinite(balance)) {
      return Math.max(0, balance);
    }
  }

  const paid = Number(sale?.amount_paid ?? 0);

  return Math.max(0, getSalePrice(sale) - paid);
};

const getPaymentPercentage = (sale) => {
  const price = getSalePrice(sale);

  if (price <= 0) return 0;

  const paid = Number(sale?.amount_paid ?? 0);

  return Math.min(100, Math.max(0, (paid / price) * 100));
};

const unwrapSale = (response) => {
  if (!response) return null;

  let result = response?.data ?? response;

  if (result?.data && !result?.id) {
    result = result.data;
  }

  if (result?.sale && !result?.id) {
    result = result.sale;
  }

  return result && typeof result === "object" ? result : null;
};

const getErrorMessage = (error) => {
  const errors = error?.response?.data?.errors;

  if (errors && typeof errors === "object") {
    const firstError = Object.values(errors).flat().find(Boolean);

    if (firstError) return firstError;
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

/*
|--------------------------------------------------------------------------
| Reusable UI
|--------------------------------------------------------------------------
*/

const InfoItem = ({ label, value, icon: Icon }) => (
  <div className="flex min-w-0 items-start gap-3">
    {Icon && (
      <div className="mt-0.5 rounded-lg bg-gray-100 p-2 text-gray-500">
        <Icon size={17} />
      </div>
    )}

    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-gray-900">
        {value || "Not provided"}
      </p>
    </div>
  </div>
);

const SectionCard = ({ title, description, icon: Icon, children }) => (
  <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
            <Icon size={19} />
          </div>
        )}

        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>

    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

/*
|--------------------------------------------------------------------------
| Complete Plot Sale
|--------------------------------------------------------------------------
*/

const CompletePlotSale = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const plotSalesHook = usePlotSales();

  const {
    fetchPlotSale,
    getPlotSale,
    fetchPlotSaleById,
    getPlotSaleById,
    completePlotSale,
    updatePlotSale,
  } = plotSalesHook;

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [completionDate, setCompletionDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [completionNotes, setCompletionNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load sale
  |--------------------------------------------------------------------------
  */

  const loadSale = useCallback(async () => {
    if (!id) {
      setError("A plot sale ID was not provided.");
      setLoading(false);
      return;
    }

    const fetchSale =
      fetchPlotSale ||
      getPlotSale ||
      fetchPlotSaleById ||
      getPlotSaleById;

    if (typeof fetchSale !== "function") {
      setError(
        "The plot sale details method is missing from usePlotSales. Add fetchPlotSale(id) or getPlotSale(id) to your hook.",
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetchSale(id);
      const result = unwrapSale(response);

      if (!result || !result.id) {
        throw new Error("The plot sale could not be found.");
      }

      setSale(result);

      if (result.completion_date) {
        setCompletionDate(
          String(result.completion_date).slice(0, 10),
        );
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [
    id,
    fetchPlotSale,
    getPlotSale,
    fetchPlotSaleById,
    getPlotSaleById,
  ]);

  useEffect(() => {
    loadSale();
  }, [loadSale]);

  /*
  |--------------------------------------------------------------------------
  | Derived values
  |--------------------------------------------------------------------------
  */

  const currency = sale?.currency || sale?.plot?.currency || "KES";

  const effectivePrice = useMemo(
    () => getSalePrice(sale),
    [sale],
  );

  const balance = useMemo(() => getBalance(sale), [sale]);

  const amountPaid = Number(sale?.amount_paid ?? 0);

  const paymentPercentage = useMemo(
    () => getPaymentPercentage(sale),
    [sale],
  );

  const status = String(sale?.status ?? "").toLowerCase();

  /*
   * Completion is available for approved sales only.
   * The backend must independently enforce its completion rules.
   */
  const canComplete = status === "approved";

  const plot = sale?.plot || {};
  const buyer = sale?.buyer || sale?.customer || {};
  const agent = sale?.agent || {};

  const saleNumber =
    sale?.sale_number || `SALE-${String(sale?.id ?? id).padStart(5, "0")}`;

  const hasOutstandingBalance = balance > 0.009;

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {
    navigate(`/super-admin/plots/sales/${id}`);
  };

  /*
  |--------------------------------------------------------------------------
  | Complete sale
  |--------------------------------------------------------------------------
  */

  const handleCompleteSale = async (event) => {
    event.preventDefault();

    if (!sale || !id || completing) return;

    if (!canComplete) {
      await Swal.fire({
        icon: "info",
        title: "Completion unavailable",
        text: `Only approved sales can be completed from this page. This sale is currently ${formatStatus(
          sale.status,
        )}.`,
        confirmButtonColor: "#4f46e5",
      });

      return;
    }

    if (!completionDate) {
      await Swal.fire({
        icon: "warning",
        title: "Completion date required",
        text: "Please select the completion date.",
        confirmButtonColor: "#4f46e5",
      });

      return;
    }

    if (hasOutstandingBalance) {
      await Swal.fire({
        icon: "warning",
        title: "Outstanding balance detected",
        html: `
          <p style="text-align:left">
            This sale still has an outstanding balance of
            <strong>${formatCurrency(balance, currency)}</strong>.
          </p>
          <p style="text-align:left;margin-top:10px">
            Verify that your business rules permit completion before
            proceeding. Completing the sale will not itself collect
            outstanding payments.
          </p>
        `,
        confirmButtonText: "Review sale",
        confirmButtonColor: "#4f46e5",
      });

      return;
    }

    if (!confirmed) {
      await Swal.fire({
        icon: "warning",
        title: "Confirmation required",
        text: "Please confirm that the transaction has been reviewed and all completion requirements have been met.",
        confirmButtonColor: "#4f46e5",
      });

      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "Complete this plot sale?",
      html: `
        <div style="text-align:left">
          <p>Sale number</p>
          <p style="margin-top:4px;font-weight:600">
            ${String(saleNumber)}
          </p>
          <p style="margin-top:12px">Plot</p>
          <p style="margin-top:4px;font-weight:600">
            ${String(plot.title || plot.code || sale.plot_title || "Plot sale")}
          </p>
          <p style="margin-top:12px">Net sale price</p>
          <p style="margin-top:4px;font-weight:600">
            ${formatCurrency(effectivePrice, currency)}
          </p>
          <p style="margin-top:12px">Completion date</p>
          <p style="margin-top:4px;font-weight:600">
            ${formatDate(completionDate)}
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, complete sale",
      cancelButtonText: "Review again",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) return;

    const dedicatedCompleteMethod =
      typeof completePlotSale === "function"
        ? completePlotSale
        : null;

    const updateMethod =
      typeof updatePlotSale === "function"
        ? updatePlotSale
        : null;

    if (!dedicatedCompleteMethod && !updateMethod) {
      await Swal.fire({
        icon: "error",
        title: "Completion action unavailable",
        text:
          "Your usePlotSales hook must expose completePlotSale(id, payload) or updatePlotSale(id, payload), and the Laravel backend must support the selected operation.",
        confirmButtonColor: "#4f46e5",
      });

      return;
    }

    setCompleting(true);

    try {
      let response;

      const payload = {
        completion_date: completionDate,
        notes: completionNotes.trim() || undefined,
      };

      if (dedicatedCompleteMethod) {
        // Preferred: dedicated backend completion endpoint.
        response = await dedicatedCompleteMethod(id, payload);
      } else {
        /*
         * Use this fallback only if your backend explicitly supports
         * changing status to completed through the update endpoint.
         */
        response = await updateMethod(id, {
          status: "completed",
          completion_date: completionDate,
          notes: completionNotes.trim() || sale.notes || null,
        });
      }

      const updatedSale = unwrapSale(response);

      if (updatedSale?.id) {
        setSale(updatedSale);
      } else {
        await loadSale();
      }

      await Swal.fire({
        icon: "success",
        title: "Plot sale completed",
        text: "The completion request was submitted successfully.",
        confirmButtonColor: "#059669",
      });

      navigate(`/super-admin/plots/sales/${id}`);
    } catch (requestError) {
      await Swal.fire({
        icon: "error",
        title: "Completion failed",
        text: getErrorMessage(requestError),
        confirmButtonColor: "#4f46e5",
      });
    } finally {
      setCompleting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Loading state
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <PlotSaleHeader
          title="Complete Plot Sale"
          description="Review and complete an approved plot sale."
          loading
          showRefresh={false}
          showCreate={false}
          showReports={false}
        />

        <div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <LoaderCircle className="h-9 w-9 animate-spin text-indigo-600" />

          <p className="mt-4 text-sm font-semibold text-gray-800">
            Loading plot sale
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Retrieving transaction details...
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error state
  |--------------------------------------------------------------------------
  */

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <PlotSaleHeader
          title="Complete Plot Sale"
          description="Review and complete an approved plot sale."
          loading={false}
          showRefresh={false}
          showCreate={false}
          showReports={false}
        />

        <div className="mt-6 rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <div className="rounded-full bg-red-50 p-4 text-red-600">
              <AlertCircle size={30} />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Unable to load plot sale
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {error || "The requested plot sale was not found."}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={loadSale}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <RefreshCw size={16} />
                Try again
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/super-admin/plots/sales")
                }
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <ArrowLeft size={16} />
                Back to sales
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Main page
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <PlotSaleHeader
        title="Complete Plot Sale"
        description="Verify the transaction and record its completion."
        loading={completing}
        onRefresh={loadSale}
        showRefresh
        showCreate={false}
        showReports={false}
      />

      <div className="mx-auto mt-6 max-w-7xl space-y-6">
        {/* Navigation and status */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft size={17} />
            Back to sale details
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(
                sale.status,
              )}`}
            >
              {formatStatus(sale.status)}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
              <FileText size={14} />
              {saleNumber}
            </span>
          </div>
        </div>

        {/* Status notice */}
        <div
          className={`rounded-2xl border p-4 sm:p-5 ${
            canComplete
              ? "border-emerald-200 bg-emerald-50"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`rounded-xl p-2 ${
                canComplete
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {canComplete ? (
                <FileCheck size={21} />
              ) : (
                <Clock size={21} />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">
                {canComplete
                  ? "This sale is approved and ready for review"
                  : `This sale is ${formatStatus(sale.status).toLowerCase()}`}
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-600">
                {canComplete
                  ? "Verify that the payment requirements, agreement, and other completion conditions have been satisfied before completing the transaction."
                  : "Only approved sales can be completed from this page. Review the current status or return to the sales list."}
              </p>
            </div>
          </div>
        </div>

        {/* Financial summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Net sale price
              </p>

              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <DollarSign size={19} />
              </div>
            </div>

            <p className="mt-4 text-xl font-bold text-gray-900">
              {formatCurrency(effectivePrice, currency)}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              After discount
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Amount paid
              </p>

              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <CheckCircle2 size={19} />
              </div>
            </div>

            <p className="mt-4 text-xl font-bold text-gray-900">
              {formatCurrency(amountPaid, currency)}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Recorded payments
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Outstanding balance
              </p>

              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                <DollarSign size={19} />
              </div>
            </div>

            <p className="mt-4 text-xl font-bold text-gray-900">
              {formatCurrency(balance, currency)}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Remaining amount due
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Payment progress
              </p>

              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <BadgeCheck size={19} />
              </div>
            </div>

            <p className="mt-4 text-xl font-bold text-gray-900">
              {paymentPercentage.toFixed(1)}%
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${paymentPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sale details */}
        <SectionCard
          title="Sale information"
          description="Verify the sale and agreement details."
          icon={FileText}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Sale number"
              value={saleNumber}
              icon={FileText}
            />

            <InfoItem
              label="Sale date"
              value={formatDate(sale.sale_date)}
              icon={CalendarDays}
            />

            <InfoItem
              label="Agreement number"
              value={sale.agreement_number}
              icon={FileText}
            />

            <InfoItem
              label="Agreement date"
              value={formatDate(sale.agreement_date)}
              icon={CalendarDays}
            />

            <InfoItem
              label="Payment frequency"
              value={formatStatus(sale.payment_frequency)}
              icon={CalendarDays}
            />

            <InfoItem
              label="Due date"
              value={formatDate(sale.due_date)}
              icon={CalendarDays}
            />
          </div>
        </SectionCard>

        {/* Plot information */}
        <SectionCard
          title="Plot information"
          description="Confirm the plot associated with the completed sale."
          icon={Building2}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Plot code"
              value={plot.code || sale.plot_code}
              icon={Building2}
            />

            <InfoItem
              label="Plot title"
              value={plot.title || sale.plot_title}
              icon={Building2}
            />

            <InfoItem
              label="Plot number"
              value={plot.plot_number || sale.plot_number}
              icon={FileText}
            />

            <InfoItem
              label="Title number"
              value={plot.title_number || sale.title_number}
              icon={FileText}
            />

            <InfoItem
              label="Location"
              value={
                plot.area?.name ||
                plot.area_name ||
                plot.address ||
                plot.location ||
                sale.location
              }
              icon={Building2}
            />

            <InfoItem
              label="Plot size"
              value={
                plot.size
                  ? `${plot.size} ${plot.size_unit || "units"}`
                  : sale.plot_size
                    ? `${sale.plot_size} ${sale.size_unit || ""}`
                    : "Not provided"
              }
              icon={Building2}
            />
          </div>
        </SectionCard>

        {/* Buyer and agent */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SectionCard
            title="Buyer information"
            description="Verify the buyer details."
            icon={UserRound}
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem
                label="Buyer name"
                value={
                  buyer.name ||
                  buyer.full_name ||
                  sale.buyer_name
                }
                icon={UserRound}
              />

              <InfoItem
                label="Email"
                value={buyer.email || sale.buyer_email}
                icon={UserRound}
              />

              <InfoItem
                label="Phone"
                value={
                  buyer.phone ||
                  buyer.phone_number ||
                  sale.buyer_phone
                }
                icon={UserRound}
              />

              <InfoItem
                label="Buyer ID"
                value={buyer.id || sale.buyer_id}
                icon={FileText}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Agent information"
            description="Review the agent linked to the sale."
            icon={UserRound}
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem
                label="Agent name"
                value={
                  agent.name ||
                  agent.full_name ||
                  sale.agent_name ||
                  "Not assigned"
                }
                icon={UserRound}
              />

              <InfoItem
                label="Email"
                value={agent.email || sale.agent_email}
                icon={UserRound}
              />

              <InfoItem
                label="Phone"
                value={
                  agent.phone ||
                  agent.phone_number ||
                  sale.agent_phone
                }
                icon={UserRound}
              />

              <InfoItem
                label="Agent ID"
                value={agent.id || sale.agent_id || "Not assigned"}
                icon={FileText}
              />
            </div>
          </SectionCard>
        </div>

        {/* Financial review */}
        <SectionCard
          title="Financial review"
          description="Check payment and balance records before completion."
          icon={DollarSign}
        >
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-sm text-gray-600">
                  Original sale price
                </span>

                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(sale.sale_price, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-sm text-gray-600">
                  Discount
                </span>

                <span className="text-sm font-semibold text-gray-900">
                  −
                  {formatCurrency(
                    sale.discount_amount ?? sale.discount ?? 0,
                    currency,
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 bg-gray-50 px-4 py-4">
                <span className="text-sm font-semibold text-gray-800">
                  Net sale price
                </span>

                <span className="text-base font-bold text-gray-900">
                  {formatCurrency(effectivePrice, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-sm text-gray-600">
                  Deposit
                </span>

                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(
                    sale.deposit_amount ?? sale.deposit ?? 0,
                    currency,
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-sm text-gray-600">
                  Amount paid
                </span>

                <span className="text-sm font-semibold text-emerald-700">
                  {formatCurrency(amountPaid, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-sm text-gray-600">
                  Outstanding balance
                </span>

                <span
                  className={`text-sm font-semibold ${
                    hasOutstandingBalance
                      ? "text-amber-700"
                      : "text-emerald-700"
                  }`}
                >
                  {formatCurrency(balance, currency)}
                </span>
              </div>
            </div>
          </div>

          {hasOutstandingBalance && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle
                size={19}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Outstanding balance detected
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  The balance must be settled or explicitly permitted by
                  your business rules before completing the sale. This
                  page does not record a payment or waive the balance.
                </p>
              </div>
            </div>
          )}

          {!hasOutstandingBalance && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-emerald-700"
              />

              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  No outstanding balance detected
                </p>

                <p className="mt-1 text-sm leading-6 text-emerald-800">
                  The displayed sale balance is zero. Confirm that the
                  underlying payment records are correct before proceeding.
                </p>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Completion details */}
        <SectionCard
          title="Completion details"
          description="Record the completion date and any relevant notes."
          icon={FileCheck}
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="completion_date"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Completion date
                <span className="ml-1 text-red-600">*</span>
              </label>

              <input
                id="completion_date"
                name="completion_date"
                type="date"
                required
                value={completionDate}
                onChange={(event) =>
                  setCompletionDate(event.target.value)
                }
                disabled={!canComplete || completing}
                className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-50"
              />

              <p className="mt-2 text-xs text-gray-500">
                Select the date the sale was actually completed.
              </p>
            </div>

            <div>
              <label
                htmlFor="completion_status"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Current sale status
              </label>

              <div className="flex min-h-12 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(
                    sale.status,
                  )}`}
                >
                  {formatStatus(sale.status)}
                </span>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                The backend should set the final status to Completed.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="completion_notes"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Completion notes
              <span className="ml-1 font-normal text-gray-400">
                (optional)
              </span>
            </label>

            <textarea
              id="completion_notes"
              name="completion_notes"
              rows={4}
              maxLength={2000}
              value={completionNotes}
              onChange={(event) =>
                setCompletionNotes(event.target.value)
              }
              disabled={!canComplete || completing}
              placeholder="Add handover details, document references, or other completion notes..."
              className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-50"
            />

            <p className="mt-2 text-xs text-gray-500">
              {completionNotes.length}/2000 characters
            </p>
          </div>
        </SectionCard>

        {/* Final confirmation */}
        <form
          onSubmit={handleCompleteSale}
          className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm"
        >
          <div className="border-b border-emerald-100 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <ShieldCheck size={21} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Confirm sale completion
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Verify that all required agreements, payments, and
                  handover requirements have been completed.
                </p>
              </div>
            </div>

            <label
              className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${
                !canComplete
                  ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-70"
                  : "cursor-pointer border-gray-200 bg-gray-50 hover:border-emerald-300"
              }`}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) =>
                  setConfirmed(event.target.checked)
                }
                disabled={!canComplete || completing}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />

              <span className="text-sm leading-6 text-gray-700">
                I confirm that I have reviewed the sale, verified the
                financial and agreement details, and ensured that the
                required completion conditions have been satisfied.
              </span>
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={completing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowLeft size={16} />
              Back to sale
            </button>

            <button
              type="submit"
              disabled={
                !canComplete ||
                !confirmed ||
                !completionDate ||
                hasOutstandingBalance ||
                completing
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 disabled:shadow-none"
            >
              {completing ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Completing sale...
                </>
              ) : (
                <>
                  <CheckCircle2 size={17} />
                  Complete plot sale
                </>
              )}
            </button>
          </div>
        </form>

        <p className="pb-4 text-center text-xs leading-5 text-gray-400">
          Completion is subject to backend authorization and validation.
          The backend should verify payment records and update related
          plot and sale records consistently.
        </p>
      </div>
    </div>
  );
};

export default CompletePlotSale;
