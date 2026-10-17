
import { useMemo } from "react";
import {
  Eye,
  Pencil,
  MoreHorizontal,
  MapPin,
  UserRound,
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertCircle,
  BadgeCheck,
  FileText,
  Wallet,
  ArrowUpRight,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getValue = (...values) =>
  values.find(
    (value) => value !== undefined && value !== null && value !== "",
  );

const getSaleId = (sale) => getValue(sale?.id, sale?.sale_id);

const getStatus = (sale) =>
  String(sale?.status || "pending").toLowerCase();

const formatCurrency = (value, currency = "KES") => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-KE")}`;
  }
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatLabel = (value) => {
  if (!value) return "—";

  return String(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getInitials = (name) => {
  if (!name) return "NA";

  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const getSaleAmount = (sale) =>
  getValue(sale?.net_sale_price, sale?.sale_price, 0);

const getPaidAmount = (sale) =>
  getValue(sale?.amount_paid, sale?.paid_amount, 0);

const getBalance = (sale) => {
  const explicitBalance = getValue(sale?.balance, sale?.outstanding_balance);

  if (explicitBalance !== undefined) {
    return Math.max(0, Number(explicitBalance) || 0);
  }

  return Math.max(
    0,
    Number(getSaleAmount(sale)) - Number(getPaidAmount(sale)),
  );
};

const getPaymentPercentage = (sale) => {
  const amount = Number(getSaleAmount(sale));
  const paid = Number(getPaidAmount(sale));

  if (sale?.payment_percentage !== undefined &&
    sale?.payment_percentage !== null &&
    sale?.payment_percentage !== "") {
    return Math.min(
      100,
      Math.max(0, Number(sale.payment_percentage) || 0),
    );
  }

  if (amount <= 0) return 0;

  return Math.min(100, Math.max(0, (paid / amount) * 100));
};

const getPaymentStatus = (sale) => {
  const explicitStatus = String(sale?.payment_status || "").toLowerCase();

  if (["paid", "partial", "unpaid", "pending", "failed", "refunded"].includes(
    explicitStatus,
  )) {
    return explicitStatus;
  }

  if (sale?.is_fully_paid === true) return "paid";
  if (getBalance(sale) <= 0 && Number(getSaleAmount(sale)) > 0) {
    return "paid";
  }

  if (Number(getPaidAmount(sale)) > 0) return "partial";

  return "unpaid";
};

/*
|--------------------------------------------------------------------------
| Status Badges
|--------------------------------------------------------------------------
*/

const SALE_STATUS_STYLES = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: Clock3,
  },
  reserved: {
    label: "Reserved",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
    icon: Clock3,
  },
  approved: {
    label: "Approved",
    className: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    icon: BadgeCheck,
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 ring-red-200",
    icon: XCircle,
  },
};

function PlotSaleStatusBadge({ status }) {
  const normalizedStatus = String(status || "pending").toLowerCase();

  const config = SALE_STATUS_STYLES[normalizedStatus] || {
    label: formatLabel(normalizedStatus),
    className: "bg-slate-50 text-slate-600 ring-slate-200",
    icon: AlertCircle,
  };

  const StatusIcon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${config.className}`}
    >
      <StatusIcon size={13} />
      {config.label}
    </span>
  );
}

const PAYMENT_STATUS_STYLES = {
  paid: "bg-emerald-50 text-emerald-700",
  partial: "bg-amber-50 text-amber-700",
  unpaid: "bg-red-50 text-red-700",
  pending: "bg-slate-100 text-slate-600",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-purple-50 text-purple-700",
};

function PaymentStatusBadge({ status }) {
  const normalizedStatus = String(status || "unpaid").toLowerCase();

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold ${PAYMENT_STATUS_STYLES[normalizedStatus] ||
        "bg-slate-100 text-slate-600"
        }`}
    >
      {formatLabel(normalizedStatus)}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Compact Payment Summary
|--------------------------------------------------------------------------
*/

function PaymentSummary({ sale, currency }) {
  const percentage = getPaymentPercentage(sale);
  const paid = getPaidAmount(sale);
  const balance = getBalance(sale);
  const paymentStatus = getPaymentStatus(sale);

  return (
    <div className="min-w-[155px] max-w-[190px]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <PaymentStatusBadge status={paymentStatus} />

        <span className="text-xs font-semibold tabular-nums text-slate-600">
          {Math.round(percentage)}%
        </span>
      </div>

      <div
        className="h-1.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Payment progress ${Math.round(percentage)} percent`}
      >
        <div
          className={`h-full rounded-full transition-all ${paymentStatus === "paid" ? "bg-emerald-500" : "bg-blue-600"
            }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">Paid</span>
          <span className="whitespace-nowrap text-xs font-semibold text-slate-800">
            {formatCurrency(paid, currency)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">Balance</span>
          <span
            className={`whitespace-nowrap text-xs font-semibold ${balance <= 0 ? "text-emerald-600" : "text-amber-700"
              }`}
          >
            {formatCurrency(balance, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Loading State
|--------------------------------------------------------------------------
*/

function PlotSaleTableSkeleton({ rows = 5 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px]">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Sale reference",
                "Plot",
                "Buyer",
                "Sale amount",
                "Payment",
                "Status",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: 7 }).map((__, cellIndex) => (
                  <td key={cellIndex} className="px-5 py-5">
                    <div className="animate-pulse space-y-2">
                      <div className="h-3 w-24 rounded bg-slate-200" />
                      <div className="h-2.5 w-16 rounded bg-slate-100" />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

function PlotSaleEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <FileText size={27} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">
        No plot sales found
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        No sales match this view. Try adjusting your filters or create a new
        plot sale to get started.
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Action Button
|--------------------------------------------------------------------------
*/

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon size={16} />
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| Main Plot Sale Table
|--------------------------------------------------------------------------
*/

export default function PlotSaleTable({
  plotSales,
  sales,
  loading = false,
  onView,
  onEdit,
  onApprove,
  onCancel,
  onComplete,
}) {
  const saleList = useMemo(() => {
    if (Array.isArray(plotSales)) return plotSales;
    if (Array.isArray(sales)) return sales;
    return [];
  }, [plotSales, sales]);

  if (loading && saleList.length === 0) {
    return <PlotSaleTableSkeleton />;
  }

  if (saleList.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <PlotSaleEmptyState />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Table heading */}
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Sales register
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Track sale agreements, buyers, payment progress and sale status.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
          <FileText size={15} className="text-slate-400" />
          {saleList.length} {saleList.length === 1 ? "record" : "records"}
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto">
        {loading && (
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-blue-100">
            <div className="h-full w-1/3 animate-pulse bg-blue-600" />
          </div>
        )}

        <table className="w-full min-w-[1000px] divide-y divide-slate-200">
          <thead className="bg-slate-50/90">
            <tr>
              <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Sale reference
              </th>

              <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Plot
              </th>

              <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Buyer
              </th>

              <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Sale amount
              </th>

              <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Payment progress
              </th>

              <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Status
              </th>

              <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {saleList.map((sale, index) => {
              const saleId = getSaleId(sale);
              const status = getStatus(sale);
              const currency =
                sale?.currency || sale?.plot?.currency || "KES";

              const saleNumber =
                sale?.sale_number || `SALE-${saleId ?? index + 1}`;

              const plot = sale?.plot || {};
              const buyer = sale?.buyer || {};

              const plotTitle =
                plot?.title ||
                plot?.name ||
                plot?.plot_number ||
                "Plot details unavailable";

              const plotCode =
                plot?.code || plot?.plot_code || "No plot code";

              const saleAmount = getValue(
                sale?.formatted_sale_price,
                formatCurrency(getSaleAmount(sale), currency),
              );

              const canEdit =
                Boolean(saleId) &&
                typeof onEdit === "function" &&
                !["cancelled", "completed"].includes(status);

              const canApprove =
                Boolean(saleId) &&
                ["pending", "reserved"].includes(status) &&
                typeof onApprove === "function";

              const canComplete =
                Boolean(saleId) &&
                ["approved", "reserved"].includes(status) &&
                typeof onComplete === "function";

              const canCancel =
                Boolean(saleId) &&
                !["cancelled", "completed"].includes(status) &&
                typeof onCancel === "function";

              return (
                <tr
                  key={saleId ?? `${saleNumber}-${index}`}
                  className="group transition-colors hover:bg-slate-50/80"
                >
                  {/* Sale reference */}
                  <td className="px-5 py-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition group-hover:border-blue-100 group-hover:bg-blue-50 group-hover:text-blue-700">
                        <FileText size={18} />
                      </div>

                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onView?.(saleId)}
                          disabled={!onView || !saleId}
                          className="max-w-[180px] truncate text-left text-sm font-bold text-slate-900 transition hover:text-blue-700 disabled:cursor-default"
                        >
                          {saleNumber}
                        </button>

                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays size={12} className="shrink-0" />
                          {formatDate(sale?.sale_date || sale?.created_at)}
                        </p>

                        {sale?.agreement_number && (
                          <p className="mt-1 max-w-[180px] truncate text-[11px] text-slate-400">
                            Agreement: {sale.agreement_number}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Plot */}
                  <td className="px-5 py-4 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <MapPin size={16} />
                      </div>

                      <div className="min-w-0 max-w-[190px]">
                        <p
                          className="truncate text-sm font-semibold text-slate-800"
                          title={plotTitle}
                        >
                          {plotTitle}
                        </p>

                        <p className="mt-1 truncate text-xs font-medium text-blue-700">
                          {plotCode}
                        </p>

                        {plot?.address && (
                          <p
                            className="mt-1 truncate text-xs text-slate-500"
                            title={plot.address}
                          >
                            {plot.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Buyer */}
                  <td className="px-5 py-4 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-600">
                        {getInitials(buyer?.name)}
                      </div>

                      <div className="min-w-0 max-w-[175px]">
                        <p
                          className="truncate text-sm font-semibold text-slate-800"
                          title={buyer?.name || ""}
                        >
                          {buyer?.name || "Buyer not assigned"}
                        </p>

                        {buyer?.email && (
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {buyer.email}
                          </p>
                        )}

                        {buyer?.phone && (
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {buyer.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Sale amount */}
                  <td className="px-5 py-4 text-right align-middle">
                    <p className="whitespace-nowrap text-sm font-bold tabular-nums text-slate-900">
                      {saleAmount}
                    </p>

                    {Number(sale?.discount_amount ?? sale?.discount ?? 0) > 0 && (
                      <p className="mt-1 whitespace-nowrap text-xs text-emerald-600">
                        Discount{" "}
                        {formatCurrency(
                          sale?.discount_amount ?? sale?.discount,
                          currency,
                        )}
                      </p>
                    )}

                    {Number(sale?.deposit_amount ?? sale?.deposit ?? 0) > 0 && (
                      <p className="mt-1 whitespace-nowrap text-xs text-slate-500">
                        Deposit{" "}
                        {formatCurrency(
                          sale?.deposit_amount ?? sale?.deposit,
                          currency,
                        )}
                      </p>
                    )}
                  </td>

                  {/* Payment */}
                  <td className="px-5 py-4 align-middle">
                    <PaymentSummary sale={sale} currency={currency} />
                  </td>

                  {/* Sale status */}
                  <td className="px-5 py-4 align-middle">
                    <div className="flex flex-col items-start gap-2">
                      <PlotSaleStatusBadge status={status} />

                      {sale?.is_active === false && (
                        <span className="text-[11px] text-slate-400">
                          Inactive record
                        </span>
                      )}

                      {status === "completed" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                          <CheckCircle2 size={12} />
                          Sale completed
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 align-middle">
                    <div className="flex items-center justify-end gap-1.5">
                      <ActionButton
                        label="View sale details"
                        icon={Eye}
                        disabled={!onView || !saleId}
                        onClick={() => onView?.(saleId)}
                      />

                      <ActionButton
                        label="Edit sale"
                        icon={Pencil}
                        disabled={!canEdit}
                        onClick={() => onEdit?.(saleId)}
                      />

                      {(canApprove || canComplete || canCancel) && (
                        <div className="group/menu relative">
                          <button
                            type="button"
                            aria-label={`More actions for ${saleNumber}`}
                            title="More actions"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          <div className="invisible absolute right-0 top-full z-30 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 opacity-0 shadow-xl transition-all group-hover/menu:visible group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:opacity-100">
                            {canApprove && (
                              <button
                                type="button"
                                onClick={() => onApprove(saleId)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                              >
                                <BadgeCheck size={15} />
                                Approve sale
                              </button>
                            )}

                            {canComplete && (
                              <button
                                type="button"
                                onClick={() => onComplete(saleId)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                              >
                                <CheckCircle2 size={15} />
                                Complete sale
                              </button>
                            )}

                            {canCancel && (
                              <button
                                type="button"
                                onClick={() => onCancel(saleId)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                <XCircle size={15} />
                                Cancel sale
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {onView && (
                        <button
                          type="button"
                          title="Open full details"
                          aria-label={`Open details for ${saleNumber}`}
                          disabled={!saleId}
                          onClick={() => onView(saleId)}
                          className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 2xl:inline-flex"
                        >
                          <ArrowUpRight size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">
            {saleList.length}
          </span>{" "}
          {saleList.length === 1 ? "plot sale" : "plot sales"} in this page.
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Paid
          </span>

          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Partial
          </span>

          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Unpaid
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Wallet size={13} />
            Payment balance
          </span>

          <span className="inline-flex items-center gap-1.5">
            <UserRound size={13} />
            Buyer information
          </span>
        </div>
      </div>
    </div>
  );
}
