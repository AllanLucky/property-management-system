import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
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

    if (Number.isFinite(balance)) return Math.max(0, balance);
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

  // Support common Laravel API response envelopes.
  if (result?.data && !result?.id) {
    result = result.data;
  }

  if (result?.sale && !result?.id) {
    result = result.sale;
  }

  return result && typeof result === "object" ? result : null;
};

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.status?.[0] ||
    error?.response?.data?.errors?.[0] ||
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
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
    </div>

    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

/*
|--------------------------------------------------------------------------
| Approve Plot Sale
|--------------------------------------------------------------------------
*/

const ApprovePlotSale = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const plotSalesHook = usePlotSales();

  const {
    fetchPlotSale,
    getPlotSale,
    fetchPlotSaleById,
    getPlotSaleById,
    approvePlotSale,
    updatePlotSale,
  } = plotSalesHook;

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);

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

  const currency = sale?.currency || sale?.plot?.currency || "KES";

  const effectivePrice = useMemo(
    () => getSalePrice(sale),
    [sale],
  );

  const balance = useMemo(() => getBalance(sale), [sale]);

  const paymentPercentage = useMemo(
    () => getPaymentPercentage(sale),
    [sale],
  );

  const status = String(sale?.status ?? "").toLowerCase();

  const canApprove = status === "pending" || status === "reserved";

  const handleBack = () => {
    navigate(`/super-admin/plots/sales/${id}`);
  };

  const handleApprove = async (event) => {
    event.preventDefault();

    if (!sale || !id || approving) return;

    if (!canApprove) {
      await Swal.fire({
        icon: "info",
        title: "Approval unavailable",
        text: `This sale is currently ${formatStatus(
          sale.status,
        )} and cannot be approved from this screen.`,
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    if (!confirmed) {
      await Swal.fire({
        icon: "warning",
        title: "Confirmation required",
        text: "Please confirm that you have reviewed the sale details before approving.",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "Approve this plot sale?",
      html: `
        <div style="text-align:left">
          <p>You are about to approve plot sale</p>
          <p style="margin-top:8px;font-weight:600">
            ${String(sale.sale_number || `Sale #${sale.id}`)}
          </p>
          <p style="margin-top:8px">
            Sale price: ${formatCurrency(effectivePrice, currency)}
          </p>
          <p style="margin-top:4px">
            Outstanding balance: ${formatCurrency(balance, currency)}
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, approve sale",
      cancelButtonText: "Review again",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) return;

    const approveMethod =
      typeof approvePlotSale === "function"
        ? approvePlotSale
        : null;

    const updateMethod =
      typeof updatePlotSale === "function"
        ? updatePlotSale
        : null;

    if (!approveMethod && !updateMethod) {
      await Swal.fire({
        icon: "error",
        title: "Approval action unavailable",
        text:
          "Your usePlotSales hook must expose approvePlotSale(id) or updatePlotSale(id, payload), and the backend must support the selected operation.",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    setApproving(true);

    try {
      let response;

      if (approveMethod) {
        // Preferred: use the dedicated backend approval endpoint.
        response = await approveMethod(id, {
          notes: approvalNotes.trim() || undefined,
        });
      } else {
        /*
         * Fallback only if your backend explicitly supports approving
         * a sale by updating its status to "approved".
         */
        response = await updateMethod(id, {
          status: "approved",
          notes: approvalNotes.trim() || sale.notes || null,
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
        title: "Plot sale approved",
        text: "The approval request has been submitted successfully.",
        confirmButtonColor: "#059669",
      });

      navigate(`/super-admin/plots/sales/${id}`);
    } catch (requestError) {
      await Swal.fire({
        icon: "error",
        title: "Approval failed",
        text: getErrorMessage(requestError),
        confirmButtonColor: "#4f46e5",
      });
    } finally {
      setApproving(false);
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
          title="Approve Plot Sale"
          description="Review and approve a plot sale."
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
            Retrieving sale details...
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
          title="Approve Plot Sale"
          description="Review and approve a plot sale."
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

  const plot = sale.plot || {};
  const buyer = sale.buyer || sale.customer || {};
  const agent = sale.agent || {};
  const saleNumber =
    sale.sale_number || `SALE-${String(sale.id).padStart(5, "0")}`;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <PlotSaleHeader
        title="Approve Plot Sale"
        description="Review the transaction details before making an approval decision."
        loading={approving}
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

        {/* Approval notice */}
        <div
          className={`rounded-2xl border p-4 sm:p-5 ${
            canApprove
              ? "border-amber-200 bg-amber-50"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`rounded-xl p-2 ${
                canApprove
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {canApprove ? (
                <Clock size={21} />
              ) : (
                <ShieldCheck size={21} />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">
                {canApprove
                  ? "This sale is awaiting approval"
                  : `This sale is ${formatStatus(sale.status).toLowerCase()}`}
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-600">
                {canApprove
                  ? "Check the plot, buyer, agreement and financial information below. Approval should only proceed after the details have been verified."
                  : "The current status does not permit approval from this page. Review the sale details or return to the sales list."}
              </p>
            </div>
          </div>
        </div>

        {/* Overview */}
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
              After applicable discount
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
              {formatCurrency(sale.amount_paid, currency)}
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

        {/* Sale information */}
        <SectionCard
          title="Sale information"
          description="Confirm the transaction identifiers and dates."
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
          description="Verify that the correct plot is being sold."
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
            description="Confirm the buyer's identity and contact details."
            icon={UserRound}
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoItem
                label="Buyer name"
                value={
                  buyer.name ||
                  buyer.full_name ||
                  sale.buyer_name ||
                  "Not provided"
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
            description="Review the agent associated with this transaction."
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
          description="Review the amounts before confirming approval."
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
                <span className="text-sm text-gray-600">Discount</span>
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
                  Deposit recorded
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(
                    sale.deposit_amount ?? sale.deposit ?? 0,
                    currency,
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-sm text-gray-600">Amount paid</span>
                <span className="text-sm font-semibold text-emerald-700">
                  {formatCurrency(sale.amount_paid, currency)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                <span className="text-sm text-gray-600">
                  Outstanding balance
                </span>
                <span className="text-sm font-semibold text-amber-700">
                  {formatCurrency(balance, currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                Payment completion
              </span>
              <span className="font-semibold text-gray-900">
                {paymentPercentage.toFixed(1)}%
              </span>
            </div>

            <div
              className="h-2.5 overflow-hidden rounded-full bg-gray-100"
              role="progressbar"
              aria-valuenow={Math.round(paymentPercentage)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Payment completion"
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${paymentPercentage}%` }}
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Verify the recorded payments and outstanding balance against
              your payment records before approving the sale.
            </p>
          </div>
        </SectionCard>

        {/* Notes */}
        <SectionCard
          title="Notes and approval review"
          description="Read the existing notes and optionally add a review note."
          icon={FileText}
        >
          {sale.notes && (
            <div className="mb-5 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Existing sale notes
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {sale.notes}
              </p>
            </div>
          )}

          <label
            htmlFor="approval_notes"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Approval review note
            <span className="ml-1 font-normal text-gray-400">
              (optional)
            </span>
          </label>

          <textarea
            id="approval_notes"
            name="approval_notes"
            rows={4}
            maxLength={2000}
            value={approvalNotes}
            onChange={(event) => setApprovalNotes(event.target.value)}
            disabled={!canApprove || approving}
            placeholder="Add any internal review notes or relevant approval comments..."
            className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-50"
          />

          <p className="mt-2 text-xs text-gray-500">
            {approvalNotes.length}/2000 characters
          </p>
        </SectionCard>

        {/* Confirmation and actions */}
        <form
          onSubmit={handleApprove}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <ShieldCheck size={21} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Approval confirmation
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Confirm that you have reviewed the transaction information
                  and are authorized to approve this sale.
                </p>
              </div>
            </div>

            <label
              className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${
                !canApprove
                  ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-70"
                  : "cursor-pointer border-gray-200 bg-gray-50 hover:border-indigo-300"
              }`}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={!canApprove || approving}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />

              <span className="text-sm leading-6 text-gray-700">
                I confirm that I have reviewed the plot, buyer, agreement,
                sale price, and payment information. I am authorized to
                approve this transaction.
              </span>
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={approving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowLeft size={16} />
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canApprove || !confirmed || approving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 disabled:shadow-none"
            >
              {approving ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Approving sale...
                </>
              ) : (
                <>
                  <BadgeCheck size={17} />
                  Approve plot sale
                </>
              )}
            </button>
          </div>
        </form>

        <p className="pb-4 text-center text-xs leading-5 text-gray-400">
          Approval actions are subject to your account permissions and the
          backend's validation rules.
        </p>
      </div>
    </div>
  );
};

export default ApprovePlotSale;
