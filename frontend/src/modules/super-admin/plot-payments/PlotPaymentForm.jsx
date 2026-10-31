
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  FileText,
  Loader2,
  Save,
  ShieldCheck,
  User,
  Wallet,
  RefreshCw,
  Clock3,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const PAYMENT_TYPES = [
  { value: "deposit", label: "Deposit" },
  { value: "installment", label: "Installment" },
  { value: "balance", label: "Balance Payment" },
  { value: "full_payment", label: "Full Payment" },
  { value: "other", label: "Other" },
];

const PAYMENT_METHODS = [
  { value: "mpesa", label: "M-Pesa" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online Payment" },
  { value: "other", label: "Other" },
];

const CURRENCIES = [
  { value: "KES", label: "KES - Kenyan Shilling" },
  { value: "UGX", label: "UGX - Ugandan Shilling" },
  { value: "TZS", label: "TZS - Tanzanian Shilling" },
  { value: "RWF", label: "RWF - Rwandan Franc" },
  { value: "NGN", label: "NGN - Nigerian Naira" },
];

const PAYMENT_STATUSES = [
  {
    value: "pending",
    label: "Pending",
    description: "Payment is awaiting verification.",
    icon: Clock3,
    className: "text-amber-700 bg-amber-50 border-amber-200",
  },
  {
    value: "completed",
    label: "Completed",
    description: "Payment has been verified and completed.",
    icon: CheckCircle2,
    className: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  {
    value: "failed",
    label: "Failed",
    description: "Payment transaction was unsuccessful.",
    icon: XCircle,
    className: "text-rose-700 bg-rose-50 border-rose-200",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    description: "Payment transaction has been cancelled.",
    icon: XCircle,
    className: "text-slate-700 bg-slate-100 border-slate-200",
  },
  {
    value: "refunded",
    label: "Refunded",
    description: "Payment amount has been refunded.",
    icon: RotateCcw,
    className: "text-violet-700 bg-violet-50 border-violet-200",
  },
];

const INITIAL_FORM = {
  plot_sale_id: "",
  amount: "",
  currency: "KES",
  payment_type: "deposit",
  payment_method: "mpesa",
  payment_date: new Date().toISOString().slice(0, 10),
  transaction_reference: "",
  payer_name: "",
  payer_phone: "",
  payer_email: "",
  notes: "",
  status: "pending",
  is_active: true,
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const formatCurrency = (amount, currency = "KES") => {
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(toNumber(amount));
  } catch {
    return `${currency} ${toNumber(amount).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

const getSaleId = (sale) =>
  sale?.id ?? sale?.plot_sale_id ?? "";

const getSaleNumber = (sale) =>
  sale?.sale_number ??
  sale?.agreement_number ??
  (sale?.id ? `Sale #${sale.id}` : "Unknown sale");

const getPlotName = (sale) =>
  sale?.plot?.title ??
  sale?.plot?.name ??
  sale?.plot?.plot_number ??
  sale?.plot?.code ??
  "Plot details unavailable";

const getPlotCode = (sale) =>
  sale?.plot?.code ?? "";

const getBuyerName = (sale) =>
  sale?.buyer?.name ??
  sale?.buyer?.full_name ??
  sale?.buyer_name ??
  "Buyer details unavailable";

const getBuyerPhone = (sale) =>
  sale?.buyer?.phone ??
  sale?.buyer?.phone_number ??
  sale?.buyer_phone ??
  "";

const getBuyerEmail = (sale) =>
  sale?.buyer?.email ??
  sale?.buyer_email ??
  "";

const getOutstandingBalance = (sale) => {
  if (!sale) return 0;

  if (sale.balance !== null && sale.balance !== undefined) {
    return Math.max(0, toNumber(sale.balance));
  }

  const netSalePrice = toNumber(
    sale.net_sale_price ?? sale.sale_price ?? 0,
  );

  const amountPaid = toNumber(sale.amount_paid ?? 0);

  return Math.max(0, netSalePrice - amountPaid);
};

const getInitialValues = (payment) => {
  if (!payment) {
    return { ...INITIAL_FORM };
  }

  return {
    plot_sale_id: String(payment.plot_sale_id ?? ""),
    amount: payment.amount ?? "",
    currency: payment.currency ?? "KES",
    payment_type: payment.payment_type ?? "deposit",
    payment_method: payment.payment_method ?? "mpesa",
    payment_date: payment.payment_date
      ? String(payment.payment_date).slice(0, 10)
      : "",
    transaction_reference: payment.transaction_reference ?? "",
    payer_name: payment.payer_name ?? "",
    payer_phone: payment.payer_phone ?? "",
    payer_email: payment.payer_email ?? "",
    notes: payment.notes ?? "",
    status: payment.status ?? "pending",
    is_active: payment.is_active ?? true,
  };
};

const getErrorMessage = (error) => {
  const response = error?.response?.data;

  if (response?.errors && typeof response.errors === "object") {
    const messages = Object.values(response.errors)
      .flat()
      .filter(Boolean);

    if (messages.length) {
      return messages.join("\n");
    }
  }

  return (
    response?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

/*
|--------------------------------------------------------------------------
| REUSABLE FORM FIELD
|--------------------------------------------------------------------------
*/

const FormField = ({
  label,
  name,
  required = false,
  error,
  icon: Icon,
  hint,
  children,
}) => (
  <div className="space-y-1.5">
    <label
      htmlFor={name}
      className="block text-sm font-semibold text-gray-700"
    >
      {label}

      {required && (
        <span className="ml-1 text-red-500">*</span>
      )}
    </label>

    <div className="relative">
      {Icon && (
        <Icon
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
      )}

      {children}
    </div>

    {hint && !error && (
      <p className="text-xs text-gray-500">{hint}</p>
    )}

    {error && (
      <p className="flex items-center gap-1 text-xs text-red-600">
        <AlertCircle size={13} />
        {error}
      </p>
    )}
  </div>
);

const inputClass = `
  w-full rounded-lg border border-gray-300 bg-white
  px-3 py-2.5 text-sm text-gray-800 outline-none
  transition placeholder:text-gray-400
  focus:border-blue-500 focus:ring-2 focus:ring-blue-100
  disabled:cursor-not-allowed disabled:bg-gray-100
`;

const iconInputClass = `${inputClass} pl-10`;

/*
|--------------------------------------------------------------------------
| PLOT PAYMENT FORM
|--------------------------------------------------------------------------
*/

const PlotPaymentForm = ({
  payment = null,
  plotSales = [],
  loading = false,
  submitting = false,
  error = null,
  onSubmit,
  onCancel,
  onRefreshSales,
  submitLabel,
  currency = "KES",
  className = "",
}) => {
  const navigate = useNavigate();

  const isEdit = Boolean(payment);

  const [formData, setFormData] = useState(() =>
    getInitialValues(payment),
  );

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE SALES
  |--------------------------------------------------------------------------
  */

  const normalizedSales = useMemo(() => {
    const sales = Array.isArray(plotSales) ? [...plotSales] : [];

    if (payment?.plot_sale_id) {
      const existingSale = sales.find(
        (sale) =>
          String(getSaleId(sale)) ===
          String(payment.plot_sale_id),
      );

      if (!existingSale && payment.plot_sale) {
        sales.push(payment.plot_sale);
      }
    }

    return sales;
  }, [plotSales, payment]);

  /*
  |--------------------------------------------------------------------------
  | RESET FORM WHEN PAYMENT CHANGES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setFormData(getInitialValues(payment));
    setErrors({});
    setGeneralError("");
  }, [payment]);

  /*
  |--------------------------------------------------------------------------
  | SELECTED SALE
  |--------------------------------------------------------------------------
  */

  const selectedSale = useMemo(
    () =>
      normalizedSales.find(
        (sale) =>
          String(getSaleId(sale)) ===
          String(formData.plot_sale_id),
      ),
    [normalizedSales, formData.plot_sale_id],
  );

  const outstandingBalance = selectedSale
    ? getOutstandingBalance(selectedSale)
    : 0;

  const netSalePrice = toNumber(
    selectedSale?.net_sale_price ??
    selectedSale?.sale_price ??
    0,
  );

  const amountPaid = toNumber(selectedSale?.amount_paid);

  const selectedCurrency =
    selectedSale?.currency ||
    formData.currency ||
    currency ||
    "KES";

  const selectedStatus = PAYMENT_STATUSES.find(
    (item) => item.value === formData.status,
  );

  /*
  |--------------------------------------------------------------------------
  | FORM CHANGE HANDLERS
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setGeneralError("");
  };

  const handleSaleChange = (event) => {
    const saleId = event.target.value;

    const sale = normalizedSales.find(
      (item) =>
        String(getSaleId(item)) === String(saleId),
    );

    setFormData((previous) => ({
      ...previous,
      plot_sale_id: saleId,
      currency:
        sale?.currency || previous.currency || currency,
      payer_name: sale
        ? getBuyerName(sale)
        : previous.payer_name,
      payer_phone: sale
        ? getBuyerPhone(sale)
        : previous.payer_phone,
      payer_email: sale
        ? getBuyerEmail(sale)
        : previous.payer_email,
      amount: "",
    }));

    setErrors((previous) => ({
      ...previous,
      plot_sale_id: "",
      amount: "",
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    const validationErrors = {};

    if (!formData.plot_sale_id) {
      validationErrors.plot_sale_id =
        "Please select a plot sale.";
    }

    const amount = Number(formData.amount);

    if (
      formData.amount === "" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      validationErrors.amount =
        "Enter a valid payment amount greater than zero.";
    }

    if (
      formData.amount !== "" &&
      amount > 0 &&
      !/^\d+(\.\d{1,2})?$/.test(String(formData.amount))
    ) {
      validationErrors.amount =
        "The payment amount can have a maximum of two decimal places.";
    }

    if (
      selectedSale &&
      !isEdit &&
      amount > outstandingBalance
    ) {
      validationErrors.amount =
        `Payment cannot exceed the outstanding balance of ${formatCurrency(
          outstandingBalance,
          selectedCurrency,
        )}.`;
    }

    if (
      selectedSale &&
      !isEdit &&
      outstandingBalance <= 0
    ) {
      validationErrors.plot_sale_id =
        "This plot sale has no outstanding balance.";
    }

    if (!formData.payment_type) {
      validationErrors.payment_type =
        "Please select a payment type.";
    }

    if (!formData.payment_method) {
      validationErrors.payment_method =
        "Please select a payment method.";
    }

    if (
      formData.payer_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.payer_email,
      )
    ) {
      validationErrors.payer_email =
        "Please enter a valid email address.";
    }

    if (formData.transaction_reference.length > 150) {
      validationErrors.transaction_reference =
        "Transaction reference cannot exceed 150 characters.";
    }

    if (
      isEdit &&
      !PAYMENT_STATUSES.some(
        (item) => item.value === formData.status,
      )
    ) {
      validationErrors.status = "Please select a valid payment status.";
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setGeneralError("");

    if (submitting || loading) return;

    if (!validateForm()) {
      Swal.fire({
        icon: "warning",
        title: "Check the form",
        text: "Please correct the highlighted fields before continuing.",
        confirmButtonColor: "#2563eb",
      });

      return;
    }

    const payload = {
      plot_sale_id: Number(formData.plot_sale_id),
      amount: Number(formData.amount),
      currency: selectedCurrency,
      payment_type: formData.payment_type,
      payment_method: formData.payment_method,
      payment_date: formData.payment_date || null,
      transaction_reference:
        formData.transaction_reference.trim() || null,
      payer_name: formData.payer_name.trim() || null,
      payer_phone: formData.payer_phone.trim() || null,
      payer_email: formData.payer_email.trim() || null,
      notes: formData.notes.trim() || null,

      // New payments always start as pending.
      // Only edit mode can submit a changed status.
      status: isEdit ? formData.status : "pending",

      is_active: Boolean(formData.is_active),
    };

    try {
      if (typeof onSubmit !== "function") {
        throw new Error(
          "Form submission handler is not configured.",
        );
      }

      await onSubmit(payload);

      await Swal.fire({
        icon: "success",
        title: isEdit ? "Payment Updated" : "Payment Recorded",
        text: isEdit
          ? "The plot payment was updated successfully."
          : "The plot payment was recorded successfully and is pending verification.",
        confirmButtonColor: "#2563eb",
      });
    } catch (submitError) {
      const message = getErrorMessage(submitError);

      setGeneralError(message);

      Swal.fire({
        icon: "error",
        title: "Unable to Save Payment",
        text: message,
        confirmButtonColor: "#dc2626",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

  const handleCancel = () => {
    if (typeof onCancel === "function") {
      onCancel();
      return;
    }

    navigate("/super-admin/plot-payments");
  };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
      noValidate
    >
      {/* PAGE INTRODUCTION */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? "Edit Plot Payment" : "Payment Information"}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {isEdit
              ? "Update the payment information and verification status."
              : "Enter the details of the payment received for a plot sale."}
          </p>
        </div>

        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700 ring-1 ring-yellow-600/20">
          <Clock3 size={14} />
          {isEdit
            ? `Current status: ${formData.status.replace(/_/g, " ")}`
            : "Pending Verification"}
        </span>
      </div>

      {/* ERROR MESSAGE */}

      {(generalError || error) && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <div>
            <p className="font-semibold">
              Unable to process payment
            </p>

            <p className="mt-1 whitespace-pre-line">
              {generalError || getErrorMessage(error)}
            </p>
          </div>
        </div>
      )}

      {/* SALE INFORMATION */}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
            <FileText size={19} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">
              Plot Sale Information
            </h3>

            <p className="text-xs text-gray-500">
              Select the sale associated with this payment.
            </p>
          </div>

          {onRefreshSales && (
            <button
              type="button"
              onClick={onRefreshSales}
              disabled={loading}
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={loading ? "animate-spin" : ""}
              />
              Refresh sales
            </button>
          )}
        </div>

        <div className="space-y-4 p-5">
          <FormField
            label="Plot Sale"
            name="plot_sale_id"
            required
            error={errors.plot_sale_id}
            icon={FileText}
          >
            <select
              id="plot_sale_id"
              name="plot_sale_id"
              value={formData.plot_sale_id}
              onChange={handleSaleChange}
              disabled={
                loading ||
                (isEdit && Boolean(payment?.plot_sale_id))
              }
              className={`
                ${iconInputClass}
                ${errors.plot_sale_id
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : ""
                }
              `}
            >
              <option value="">
                {loading
                  ? "Loading outstanding plot sales..."
                  : "Select an outstanding plot sale"}
              </option>

              {normalizedSales.map((sale) => (
                <option
                  key={getSaleId(sale)}
                  value={getSaleId(sale)}
                >
                  {getSaleNumber(sale)} — {getBuyerName(sale)}
                </option>
              ))}
            </select>
          </FormField>

          {selectedSale && (
            <>
              <div className="grid grid-cols-1 gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-gray-500">Plot</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {getPlotName(selectedSale)}
                  </p>

                  {getPlotCode(selectedSale) && (
                    <p className="mt-1 text-xs text-gray-500">
                      {getPlotCode(selectedSale)}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">Buyer</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {getBuyerName(selectedSale)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Net Sale Value
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatCurrency(netSalePrice, selectedCurrency)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Amount Paid
                  </p>
                  <p className="mt-1 text-sm font-semibold text-green-700">
                    {formatCurrency(amountPaid, selectedCurrency)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-lg border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-orange-800">
                    Outstanding Balance
                  </p>

                  <p className="mt-1 text-xl font-bold text-orange-700">
                    {formatCurrency(outstandingBalance, selectedCurrency)}
                  </p>
                </div>

                <div className="text-sm text-orange-800">
                  <p>
                    Payment progress:{" "}
                    <strong>
                      {toNumber(selectedSale.payment_percentage)}%
                    </strong>
                  </p>

                  <p className="mt-1 text-xs">
                    Sale: {getSaleNumber(selectedSale)}
                  </p>
                </div>
              </div>
            </>
          )}

          {!loading && normalizedSales.length === 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-start gap-2 text-yellow-800">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />

                <div>
                  <p className="text-sm font-semibold">
                    No outstanding plot sales available
                  </p>

                  <p className="mt-1 text-xs leading-5">
                    There are currently no plot sales with unpaid balances available for payment recording.
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              <Loader2 size={17} className="animate-spin" />
              Loading outstanding plot sales...
            </div>
          )}
        </div>
      </section>

      {/* PAYMENT DETAILS */}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
          <div className="rounded-lg bg-green-100 p-2 text-green-700">
            <Wallet size={19} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">
              Payment Details
            </h3>

            <p className="text-xs text-gray-500">
              Enter the amount and payment method.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
          <FormField
            label="Payment Amount"
            name="amount"
            required
            error={errors.amount}
            icon={Banknote}
            hint={
              selectedSale
                ? `Maximum allowed: ${formatCurrency(
                  outstandingBalance,
                  selectedCurrency,
                )}`
                : "Select a plot sale to see the available balance."
            }
          >
            <input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              max={
                selectedSale && !isEdit
                  ? outstandingBalance
                  : undefined
              }
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter payment amount"
              disabled={!selectedSale}
              className={`
                ${iconInputClass}
                ${errors.amount
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : ""
                }
              `}
            />
          </FormField>

          <FormField label="Currency" name="currency" required>
            <select
              id="currency"
              name="currency"
              value={selectedCurrency}
              onChange={handleChange}
              disabled={Boolean(selectedSale)}
              className={inputClass}
            >
              {CURRENCIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Payment Type"
            name="payment_type"
            required
            error={errors.payment_type}
          >
            <select
              id="payment_type"
              name="payment_type"
              value={formData.payment_type}
              onChange={handleChange}
              className={`${inputClass} ${errors.payment_type ? "border-red-400" : ""
                }`}
            >
              {PAYMENT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Payment Method"
            name="payment_method"
            required
            error={errors.payment_method}
          >
            <select
              id="payment_method"
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              className={`${inputClass} ${errors.payment_method ? "border-red-400" : ""
                }`}
            >
              {PAYMENT_METHODS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Payment Date"
            name="payment_date"
            icon={CalendarDays}
          >
            <input
              id="payment_date"
              name="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={handleChange}
              className={iconInputClass}
            />
          </FormField>

          <FormField
            label="Transaction Reference"
            name="transaction_reference"
            error={errors.transaction_reference}
            hint="Optional M-Pesa code, bank reference, or transaction ID."
          >
            <input
              id="transaction_reference"
              name="transaction_reference"
              type="text"
              maxLength={150}
              value={formData.transaction_reference}
              onChange={handleChange}
              placeholder="e.g. QGH7X9ABC"
              className={inputClass}
            />
          </FormField>
        </div>
      </section>

      {/* PAYER INFORMATION */}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
          <div className="rounded-lg bg-purple-100 p-2 text-purple-700">
            <User size={19} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">
              Payer Information
            </h3>

            <p className="text-xs text-gray-500">
              Record the person making the payment.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
          <FormField label="Payer Name" name="payer_name" icon={User}>
            <input
              id="payer_name"
              name="payer_name"
              type="text"
              maxLength={150}
              value={formData.payer_name}
              onChange={handleChange}
              placeholder="Enter payer name"
              className={iconInputClass}
            />
          </FormField>

          <FormField label="Phone Number" name="payer_phone">
            <input
              id="payer_phone"
              name="payer_phone"
              type="tel"
              maxLength={30}
              value={formData.payer_phone}
              onChange={handleChange}
              placeholder="e.g. 0712345678"
              className={inputClass}
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField
              label="Email Address"
              name="payer_email"
              error={errors.payer_email}
            >
              <input
                id="payer_email"
                name="payer_email"
                type="email"
                maxLength={150}
                value={formData.payer_email}
                onChange={handleChange}
                placeholder="payer@example.com"
                className={inputClass}
              />
            </FormField>
          </div>
        </div>
      </section>

      {/* STATUS - EDIT ONLY */}

      {isEdit && (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
              <ShieldCheck size={19} />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                Payment Verification Status
              </h3>

              <p className="text-xs text-gray-500">
                Update the verification status of this payment.
              </p>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <FormField
              label="Payment Status"
              name="status"
              required
              error={errors.status}
              icon={ShieldCheck}
              hint="Choose the status that reflects the verified payment outcome."
            >
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`
                  ${iconInputClass}
                  ${errors.status ? "border-red-400" : ""}
                `}
              >
                {PAYMENT_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>

            {selectedStatus && (
              <div
                className={`flex items-start gap-3 rounded-lg border p-4 ${selectedStatus.className}`}
              >
                <selectedStatus.icon size={20} className="mt-0.5 shrink-0" />

                <div>
                  <p className="text-sm font-semibold">
                    {selectedStatus.label}
                  </p>

                  <p className="mt-1 text-xs">
                    {selectedStatus.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* NOTES AND ACTIVATION */}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
          <div className="rounded-lg bg-orange-100 p-2 text-orange-700">
            <FileText size={19} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">
              Additional Information
            </h3>

            <p className="text-xs text-gray-500">
              Add internal notes or manage payment availability.
            </p>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <FormField label="Payment Notes" name="notes">
            <textarea
              id="notes"
              name="notes"
              rows={4}
              maxLength={5000}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Enter additional payment information..."
              className={`${inputClass} resize-y`}
            />
          </FormField>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50">
            <input
              type="checkbox"
              name="is_active"
              checked={Boolean(formData.is_active)}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />

            <span>
              <span className="block text-sm font-semibold text-gray-800">
                Active Payment Record
              </span>

              <span className="mt-1 block text-xs text-gray-500">
                Keep this payment record active and available in the system.
              </span>
            </span>
          </label>
        </div>
      </section>

      {/* PAYMENT SECURITY NOTICE */}

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <ShieldCheck
          size={21}
          className="mt-0.5 shrink-0 text-blue-700"
        />

        <div>
          <p className="text-sm font-semibold text-blue-900">
            Payment Verification
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-800">
            {isEdit
              ? "Status changes are submitted when you update this payment. Only mark a payment completed after verifying that the funds were received."
              : "Newly recorded payments are always submitted with pending status. Payment completion, refunds, and other verified status changes can be updated later by an authorized user."}
          </p>
        </div>
      </div>

      {/* FORM ACTIONS */}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleCancel}
          disabled={submitting}
          className="
            inline-flex items-center justify-center gap-2 rounded-lg
            border border-gray-300 bg-white px-5 py-2.5
            text-sm font-semibold text-gray-700 transition
            hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          <ArrowLeft size={16} />
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            submitting ||
            loading ||
            normalizedSales.length === 0 ||
            !selectedSale
          }
          className="
            inline-flex items-center justify-center gap-2 rounded-lg
            bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white
            shadow-sm transition hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-60
          "
        >
          {submitting ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Saving Payment...
            </>
          ) : (
            <>
              <Save size={17} />
              {submitLabel ||
                (isEdit ? "Update Payment" : "Record Payment")}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default PlotPaymentForm;
