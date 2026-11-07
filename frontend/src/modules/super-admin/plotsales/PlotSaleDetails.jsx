import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  Home,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

import PlotSaleHeader from "./PlotSaleHeader";
import { usePlotSales } from "../../../hooks/usePlotSales";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const formatCurrency = (value, currency = "KES") => {
  const amount = Number(value);

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(amount)
  ) {
    return `${currency} 0.00`;
  }

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatNumber = (value) => {
  const number = Number(value);

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(number)
  ) {
    return "Not specified";
  }

  return number.toLocaleString("en-KE", {
    maximumFractionDigits: 2,
  });
};

const formatStatus = (value) => {
  if (!value) return "Not specified";

  return String(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;

  if (responseData?.errors) {
    const firstError = Object.values(responseData.errors)
      .flat()
      .find((message) => typeof message === "string");

    if (firstError) return firstError;
  }

  return (
    responseData?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

/*
|--------------------------------------------------------------------------
| API RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

const unwrapPlotSale = (response) => {
  let result = response?.data ?? response;

  for (let index = 0; index < 6; index += 1) {
    if (
      !result ||
      typeof result !== "object" ||
      Array.isArray(result)
    ) {
      break;
    }

    if (
      result.plot_sale &&
      typeof result.plot_sale === "object" &&
      !Array.isArray(result.plot_sale)
    ) {
      result = result.plot_sale;
      continue;
    }

    if (
      result.sale &&
      typeof result.sale === "object" &&
      !Array.isArray(result.sale)
    ) {
      result = result.sale;
      continue;
    }

    if (
      result.data !== undefined &&
      result.data !== null &&
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

const isFailedResponse = (response) => {
  if (!response || typeof response !== "object") {
    return false;
  }

  const body =
    response.data && typeof response.data === "object"
      ? response.data
      : response;

  if (body.success === false || body.status === false) {
    return true;
  }

  const code = Number(body.code);

  return Number.isFinite(code) && code >= 400;
};

const getPersonName = (person) => {
  if (!person) return "Not assigned";

  if (typeof person === "string") return person;

  const fullName = [
    person.first_name,
    person.middle_name,
    person.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    person.name ||
    person.full_name ||
    person.username ||
    fullName ||
    person.email ||
    (person.id ? `User #${person.id}` : "Not assigned")
  );
};

const getPlotName = (plotSale) => {
  const plot = plotSale?.plot;

  if (!plot) {
    return plotSale?.plot_id
      ? `Plot #${plotSale.plot_id}`
      : "Not assigned";
  }

  if (typeof plot === "string") return plot;

  return (
    plot.title ||
    plot.name ||
    plot.code ||
    (plot.id ? `Plot #${plot.id}` : "Not assigned")
  );
};

const getPlotLocation = (plot) => {
  const values = [
    plot?.area?.name ?? plot?.area_name,
    plot?.city?.name ?? plot?.city_name,
    plot?.county?.name ?? plot?.county_name,
    plot?.region?.name ?? plot?.region_name,
    plot?.country?.name ?? plot?.country_name,
  ];

  const parts = values.filter(
    (value, index, array) =>
      typeof value === "string" &&
      value.trim() &&
      array.indexOf(value) === index
  );

  return parts.length
    ? parts.join(", ")
    : "Location not specified";
};

const getPlotSize = (plot) => {
  const size = plot?.size ?? plot?.plot_size;

  if (size === null || size === undefined || size === "") {
    return "Not specified";
  }

  const unit = plot?.size_unit ?? plot?.measurement_unit;

  if (typeof size === "string") return size;

  return `${formatNumber(size)}${unit ? ` ${unit}` : ""}`;
};

const getEffectivePrice = (sale) => {
  const price = Number(sale?.sale_price ?? 0);
  const discount = Number(
    sale?.discount_amount ?? sale?.discount ?? 0
  );

  return Math.max(0, price - discount);
};

const getDepositAmount = (sale) =>
  Number(sale?.deposit_amount ?? sale?.deposit ?? 0);

const getBalance = (sale) => {
  if (
    sale?.balance !== null &&
    sale?.balance !== undefined &&
    sale?.balance !== "" &&
    Number.isFinite(Number(sale.balance))
  ) {
    return Number(sale.balance);
  }

  const effectivePrice = getEffectivePrice(sale);
  const paid = Number(sale?.amount_paid ?? 0);

  return Math.max(0, effectivePrice - paid);
};

const getPaidPercentage = (sale) => {
  const effectivePrice = getEffectivePrice(sale);
  const paid = Number(sale?.amount_paid ?? 0);

  if (effectivePrice <= 0) return 0;

  return Math.min(
    100,
    Math.max(0, (paid / effectivePrice) * 100)
  );
};

const getStatusClasses = (status) => {
  const normalized = String(status || "").toLowerCase();

  const styles = {
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    reserved: "bg-blue-50 text-blue-700 ring-blue-600/20",
    approved: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    cancelled: "bg-red-50 text-red-700 ring-red-600/20",
    rejected: "bg-red-50 text-red-700 ring-red-600/20",
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    inactive: "bg-gray-100 text-gray-600 ring-gray-500/20",
  };

  return (
    styles[normalized] ||
    "bg-gray-100 text-gray-700 ring-gray-500/20"
  );
};

/*
|--------------------------------------------------------------------------
| REUSABLE DETAIL COMPONENTS
|--------------------------------------------------------------------------
*/

const DetailItem = ({ icon: Icon, label, value, children }) => (
  <div className="flex min-w-0 items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm ring-1 ring-gray-100">
      <Icon className="h-5 w-5" />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      {children || (
        <p className="mt-1 break-words text-sm font-semibold text-gray-900 [overflow-wrap:anywhere]">
          {value ?? "Not available"}
        </p>
      )}
    </div>
  </div>
);

const SectionCard = ({
  title,
  description,
  icon: Icon,
  children,
}) => (
  <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Icon className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm leading-5 text-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>

    <div className="min-w-0 p-5 sm:p-6">{children}</div>
  </section>
);

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(status)}`}
  >
    {formatStatus(status)}
  </span>
);

/*
|--------------------------------------------------------------------------
| PLOT SALE DETAILS PAGE
|--------------------------------------------------------------------------
*/

const PlotSaleDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const plotSalesApi = usePlotSales();

  const {
    loading = false,
    error,
    clearError,
  } = plotSalesApi;

  /*
  |--------------------------------------------------------------------------
  | API METHODS
  |--------------------------------------------------------------------------
  | The hook should expose fetchPlotSale(id) or getPlotSale(id).
  */

  const getPlotSale =
    plotSalesApi.fetchPlotSale ??
    plotSalesApi.getPlotSale ??
    plotSalesApi.fetchPlotSaleById ??
    plotSalesApi.getPlotSaleById;

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [sale, setSale] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD PLOT SALE
  |--------------------------------------------------------------------------
  */

  const loadPlotSale = useCallback(async () => {
    if (!id) {
      setSale(null);
      setPageError("A valid plot sale ID is required.");
      setPageLoading(false);
      return;
    }

    if (typeof getPlotSale !== "function") {
      setSale(null);
      setPageError(
        "The plot sale details action is unavailable. Add fetchPlotSale(id) or getPlotSale(id) to your usePlotSales hook."
      );
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setPageError("");

    if (typeof clearError === "function") {
      clearError();
    }

    try {
      const response = await getPlotSale(id);

      if (isFailedResponse(response)) {
        throw new Error(
          response?.data?.message ||
          response?.message ||
          "Unable to load plot sale details."
        );
      }

      const result = unwrapPlotSale(response);

      if (
        !result ||
        typeof result !== "object" ||
        Array.isArray(result) ||
        !(result.id ?? result.plot_sale_id)
      ) {
        throw new Error(
          "The plot sale was not found or the API returned invalid data."
        );
      }

      setSale({
        ...result,
        id: result.id ?? result.plot_sale_id,
      });
    } catch (loadError) {
      setSale(null);
      setPageError(getErrorMessage(loadError));
    } finally {
      setPageLoading(false);
    }
  }, [id, getPlotSale, clearError]);

  useEffect(() => {
    void loadPlotSale();
  }, [loadPlotSale]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = useCallback(() => {
    void loadPlotSale();
  }, [loadPlotSale]);

  /*
  |--------------------------------------------------------------------------
  | DERIVED VALUES
  |--------------------------------------------------------------------------
  */

  const plot = sale?.plot ?? null;

  const plotName = useMemo(
    () => getPlotName(sale),
    [sale]
  );

  const plotLocation = useMemo(
    () => getPlotLocation(plot),
    [plot]
  );

  const plotSize = useMemo(
    () => getPlotSize(plot),
    [plot]
  );

  const currency = sale?.currency || "KES";

  const salePrice = Number(sale?.sale_price ?? 0);
  const depositAmount = getDepositAmount(sale);
  const discountAmount = Number(
    sale?.discount_amount ?? sale?.discount ?? 0
  );
  const amountPaid = Number(sale?.amount_paid ?? 0);
  const balance = getBalance(sale);
  const effectivePrice = getEffectivePrice(sale);
  const paidPercentage = getPaidPercentage(sale);

  const buyerName = getPersonName(sale?.buyer);
  const agentName = getPersonName(sale?.agent);

  const displayedError =
    pageError ||
    (typeof error === "string" ? error : error?.message);

  const isBusy = Boolean(loading || pageLoading);

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (pageLoading) {
    return (
      <div className="min-w-0 w-full space-y-6">
        <PlotSaleHeader
          title="Plot Sale Details"
          description="View sale information, buyer details and financial records."
          loading
          onRefresh={handleRefresh}
          showRefresh
          showCreate={false}
          showReports={false}
        />

        <section className="flex min-w-0 items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-14 shadow-sm sm:py-20">
          <div className="flex max-w-md flex-col items-center text-center">
            <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />

            <h2 className="mt-4 text-base font-semibold text-gray-900">
              Loading plot sale details
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              Please wait while we retrieve the sale information.
            </p>
          </div>
        </section>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NOT FOUND / ERROR STATE
  |--------------------------------------------------------------------------
  */

  if (!sale) {
    return (
      <div className="min-w-0 w-full space-y-6">
        <PlotSaleHeader
          title="Plot Sale Details"
          description="View sale information, buyer details and financial records."
          loading={isBusy}
          onRefresh={handleRefresh}
          showRefresh
          showCreate={false}
          showReports={false}
        />

        {displayedError && (
          <div
            role="alert"
            className="flex min-w-0 items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Unable to load plot sale
              </p>
              <p className="mt-1 break-words">
                {displayedError}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPageError("")}
              className="shrink-0 rounded-lg p-1 transition hover:bg-red-100"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white px-5 py-10 text-center shadow-sm sm:px-8 sm:py-14">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <FileText className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Plot Sale Not Found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            We could not load this sale. It may have been deleted,
            the ID may be invalid, or the request may have failed.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isBusy}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isBusy ? "animate-spin" : ""}`}
              />
              Try Again
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/super-admin/plots/sales")
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Plot Sales
            </button>
          </div>
        </section>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN DETAILS PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 w-full space-y-6">
      {/* Header */}

      <PlotSaleHeader
        title="Plot Sale Details"
        description={`Viewing ${sale.sale_number || `sale #${sale.id}`}.`}
        loading={isBusy}
        onRefresh={handleRefresh}
        showRefresh
        showCreate={false}
        showReports={false}
      />

      {/* Page Error */}

      {displayedError && (
        <div
          role="alert"
          className="flex min-w-0 items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1 break-words">{displayedError}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPageError("");
              clearError?.();
            }}
            className="shrink-0 rounded-lg p-1 transition hover:bg-red-100"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Sale Summary */}

      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5 sm:p-6 lg:p-8">
          <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FileText className="h-7 w-7" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="break-words text-xl font-bold text-gray-900 sm:text-2xl [overflow-wrap:anywhere]">
                    {sale.sale_number || `Sale #${sale.id}`}
                  </h1>

                  <StatusBadge status={sale.status} />
                </div>

                <p className="mt-2 break-words text-sm text-gray-500">
                  Plot:{" "}
                  <span className="font-semibold text-gray-700">
                    {plotName}
                  </span>
                </p>

                <div className="mt-3 flex min-w-0 items-start gap-2 text-sm text-gray-500">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="break-words [overflow-wrap:anywhere]">
                    {plotLocation}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate("/super-admin/plots/sales")
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/super-admin/plots/sales/${sale.id}/edit`
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Edit className="h-4 w-4" />
                Edit Sale
              </button>
            </div>
          </div>

          {/* Key Metrics */}

          <div className="mt-7 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                <Banknote className="h-4 w-4 shrink-0" />
                Sale Price
              </div>

              <p className="mt-3 break-words text-xl font-bold text-gray-900 [overflow-wrap:anywhere]">
                {formatCurrency(salePrice, currency)}
              </p>
            </div>

            <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Amount Paid
              </div>

              <p className="mt-3 break-words text-xl font-bold text-emerald-700 [overflow-wrap:anywhere]">
                {formatCurrency(amountPaid, currency)}
              </p>
            </div>

            <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Clock className="h-4 w-4 shrink-0" />
                Outstanding
              </div>

              <p className="mt-3 break-words text-xl font-bold text-amber-700 [overflow-wrap:anywhere]">
                {formatCurrency(balance, currency)}
              </p>
            </div>

            <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Payment Progress
              </div>

              <p className="mt-3 text-xl font-bold text-gray-900">
                {paidPercentage.toFixed(1)}%
              </p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${paidPercentage}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sale and Customer Information */}

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Sale Information"
          description="Sale identification and transaction dates."
          icon={FileText}
        >
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem
              icon={FileText}
              label="Sale Number"
              value={sale.sale_number}
            />

            <DetailItem
              icon={ShieldCheck}
              label="Sale Status"
            >
              <div className="mt-2">
                <StatusBadge status={sale.status} />
              </div>
            </DetailItem>

            <DetailItem
              icon={CalendarDays}
              label="Sale Date"
              value={formatDate(sale.sale_date)}
            />

            <DetailItem
              icon={CalendarDays}
              label="Due Date"
              value={formatDate(sale.due_date)}
            />

            <DetailItem
              icon={CalendarDays}
              label="Created On"
              value={formatDate(sale.created_at)}
            />

            <DetailItem
              icon={Clock}
              label="Last Updated"
              value={formatDate(sale.updated_at)}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Buyer and Agent"
          description="People associated with this plot sale."
          icon={UserRound}
        >
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem
              icon={UserRound}
              label="Buyer"
              value={buyerName}
            />

            <DetailItem
              icon={FileText}
              label="Buyer ID"
              value={
                sale.buyer_id
                  ? `#${sale.buyer_id}`
                  : sale.buyer?.id
                    ? `#${sale.buyer.id}`
                    : "Not assigned"
              }
            />

            <DetailItem
              icon={UserRound}
              label="Sales Agent"
              value={agentName}
            />

            <DetailItem
              icon={FileText}
              label="Agent ID"
              value={
                sale.agent_id
                  ? `#${sale.agent_id}`
                  : sale.agent?.id
                    ? `#${sale.agent.id}`
                    : "Not assigned"
              }
            />
          </div>

          <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem
              icon={UserRound}
              label="Buyer Email"
              value={sale.buyer?.email || "Not available"}
            />

            <DetailItem
              icon={UserRound}
              label="Agent Email"
              value={sale.agent?.email || "Not available"}
            />
          </div>
        </SectionCard>
      </div>

      {/* Plot and Agreement */}

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Plot Information"
          description="Details of the plot associated with this sale."
          icon={Home}
        >
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem
              icon={Home}
              label="Plot"
              value={plotName}
            />

            <DetailItem
              icon={FileText}
              label="Plot Code"
              value={plot?.code || "Not available"}
            />

            <DetailItem
              icon={MapPin}
              label="Location"
              value={plotLocation}
            />

            <DetailItem
              icon={Home}
              label="Property"
              value={
                plot?.property?.name ||
                plot?.property?.title ||
                plot?.property_name ||
                (plot?.property_id
                  ? `Property #${plot.property_id}`
                  : "Not assigned")
              }
            />

            <DetailItem
              icon={FileText}
              label="Plot ID"
              value={
                sale.plot_id
                  ? `#${sale.plot_id}`
                  : plot?.id
                    ? `#${plot.id}`
                    : "Not available"
              }
            />

            <DetailItem
              icon={Home}
              label="Plot Size"
              value={plotSize}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Agreement Information"
          description="Agreement reference and contract dates."
          icon={FileText}
        >
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem
              icon={FileText}
              label="Agreement Number"
              value={sale.agreement_number || "Not provided"}
            />

            <DetailItem
              icon={CalendarDays}
              label="Agreement Date"
              value={formatDate(sale.agreement_date)}
            />

            <DetailItem
              icon={CalendarDays}
              label="Sale Date"
              value={formatDate(sale.sale_date)}
            />

            <DetailItem
              icon={CalendarDays}
              label="Payment Due Date"
              value={formatDate(sale.due_date)}
            />
          </div>
        </SectionCard>
      </div>

      {/* Financial Information */}

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard
          title="Financial Summary"
          description="Sale price, deposit, discount and payment totals."
          icon={Banknote}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5">
              <p className="text-sm font-medium text-emerald-800">
                Sale Price
              </p>

              <p className="mt-2 break-words text-2xl font-bold text-gray-900 sm:text-3xl [overflow-wrap:anywhere]">
                {formatCurrency(salePrice, currency)}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Currency: {currency}
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem
                icon={Banknote}
                label="Deposit Amount"
                value={formatCurrency(depositAmount, currency)}
              />

              <DetailItem
                icon={Banknote}
                label="Discount"
                value={formatCurrency(discountAmount, currency)}
              />

              <DetailItem
                icon={CheckCircle2}
                label="Effective Sale Price"
                value={formatCurrency(effectivePrice, currency)}
              />

              <DetailItem
                icon={Banknote}
                label="Amount Paid"
                value={formatCurrency(amountPaid, currency)}
              />

              <DetailItem
                icon={Clock}
                label="Outstanding Balance"
                value={formatCurrency(balance, currency)}
              />

              <DetailItem
                icon={CalendarDays}
                label="Payment Frequency"
                value={formatStatus(sale.payment_frequency)}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Payment Progress"
          description="Summary of recorded payments against the sale."
          icon={CheckCircle2}
        >
          <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-gray-800">
                Amount Paid
              </p>

              <span className="text-sm font-bold text-emerald-700">
                {paidPercentage.toFixed(1)}%
              </span>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${paidPercentage}%`,
                }}
              />
            </div>

            <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="break-words text-gray-600">
                {formatCurrency(amountPaid, currency)} received
              </span>

              <span className="break-words font-semibold text-gray-900">
                {formatCurrency(balance, currency)} remaining
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex min-w-0 items-start gap-3 rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Received Payments
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  {formatCurrency(amountPaid, currency)} has been recorded
                  as paid on this sale.
                </p>
              </div>
            </div>

            <div className="flex min-w-0 items-start gap-3 rounded-xl border border-gray-100 bg-white p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Outstanding Balance
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  {formatCurrency(balance, currency)} remains outstanding
                  based on the available sale totals.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-gray-500">
            Payment totals and balances are displayed for reference.
            They must be maintained by the backend and plot payment
            module, not edited from this page.
          </p>
        </SectionCard>
      </div>

      {/* Notes */}

      <SectionCard
        title="Sale Notes"
        description="Additional information saved against this sale."
        icon={FileText}
      >
        {sale.notes ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-700 [overflow-wrap:anywhere]">
            {sale.notes}
          </p>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-5 py-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-gray-400" />

            <p className="mt-3 text-sm font-medium text-gray-700">
              No notes available
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Edit this sale to add additional information.
            </p>
          </div>
        )}
      </SectionCard>

      {/* Record Metadata */}

      <SectionCard
        title="Record Information"
        description="System record timestamps and identifiers."
        icon={Clock}
      >
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DetailItem
            icon={FileText}
            label="Sale ID"
            value={`#${sale.id}`}
          />

          <DetailItem
            icon={CalendarDays}
            label="Created At"
            value={formatDateTime(sale.created_at)}
          />

          <DetailItem
            icon={RefreshCw}
            label="Last Updated"
            value={formatDateTime(sale.updated_at)}
          />

          <DetailItem
            icon={ShieldCheck}
            label="Current Status"
          >
            <div className="mt-2">
              <StatusBadge status={sale.status} />
            </div>
          </DetailItem>
        </div>
      </SectionCard>

      {/* Bottom Actions */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() =>
            navigate("/super-admin/plots/sales")
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Plot Sales
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(
              `/super-admin/plots/sales/${sale.id}/edit`
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Edit className="h-4 w-4" />
          Edit Plot Sale
        </button>
      </div>
    </div>
  );
};

export default PlotSaleDetails;