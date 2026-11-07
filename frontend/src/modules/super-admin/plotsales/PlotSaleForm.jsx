import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  FileText,
  Info,
  LandPlot,
  Loader2,
  Save,
  Wallet,
  X,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Options
|--------------------------------------------------------------------------
*/

const SALE_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "reserved", label: "Reserved" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_FREQUENCY_OPTIONS = [
  { value: "once", label: "One-time payment" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
  { value: "custom", label: "Custom arrangement" },
];

const CURRENCY_OPTIONS = [
  { value: "KES", label: "KES - Kenyan Shilling" },
  { value: "UGX", label: "UGX - Ugandan Shilling" },
  { value: "TZS", label: "TZS - Tanzanian Shilling" },
  { value: "RWF", label: "RWF - Rwandan Franc" },
  { value: "NGN", label: "NGN - Nigerian Naira" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
];

const DEFAULT_FORM_VALUES = {
  plot_id: "",
  buyer_id: "",
  agent_id: "",
  sale_number: "",
  sale_date: new Date().toISOString().slice(0, 10),
  agreement_number: "",
  agreement_date: "",
  sale_price: "",
  deposit: "",
  discount: "0",
  amount_paid: "0",
  currency: "KES",
  payment_frequency: "once",
  due_date: "",
  completion_date: "",
  status: "pending",
  is_active: true,
  notes: "",
  cancellation_reason: "",
};

/*
|--------------------------------------------------------------------------
| Styling
|--------------------------------------------------------------------------
*/

const inputClass =
  "block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";
const errorClass = "mt-1.5 text-xs leading-5 text-red-600";
const sectionClass =
  "rounded-2xl border border-gray-200 bg-white shadow-sm";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getId = (value) =>
  value === null || value === undefined || value === ""
    ? ""
    : String(value);

const getErrorMessage = (errors, field) => {
  if (!errors || typeof errors !== "object") return "";

  const value = errors[field];

  if (Array.isArray(value)) return value[0] || "";

  return typeof value === "string" ? value : "";
};

const normalizeOptions = (items = [], labelFields = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (item === null || item === undefined) return null;

      if (typeof item !== "object") {
        return {
          value: String(item),
          label: String(item),
        };
      }

      const value =
        item.id ??
        item.value ??
        item.uuid ??
        item.plot_id ??
        item.user_id;

      const preferredFields = [
        ...labelFields,
        "name",
        "title",
        "full_name",
        "username",
        "email",
        "code",
      ];

      let label = "";

      for (const field of preferredFields) {
        if (
          item[field] !== undefined &&
          item[field] !== null &&
          String(item[field]).trim() !== ""
        ) {
          label = String(item[field]);
          break;
        }
      }

      if (!label && value !== undefined && value !== null) {
        label = String(value);
      }

      if (value === null || value === undefined || label === "") {
        return null;
      }

      return {
        value: String(value),
        label,
        raw: item,
      };
    })
    .filter(Boolean);
};

const normalizeBoolean = (value) =>
  ![false, 0, "0", "false", null].includes(
    typeof value === "string" ? value.toLowerCase() : value,
  );

const getInitialValues = (sale = {}) => {
  const plotId =
    sale.plot_id ??
    sale.plot?.id ??
    sale.plot?.plot_id ??
    "";

  const buyerId =
    sale.buyer_id ??
    sale.buyer?.id ??
    sale.buyer?.user_id ??
    "";

  const agentId =
    sale.agent_id ??
    sale.agent?.id ??
    sale.agent?.user_id ??
    "";

  return {
    ...DEFAULT_FORM_VALUES,

    plot_id: getId(plotId),
    buyer_id: getId(buyerId),
    agent_id: getId(agentId),

    sale_number: sale.sale_number ?? "",
    sale_date: sale.sale_date ?? DEFAULT_FORM_VALUES.sale_date,

    agreement_number: sale.agreement_number ?? "",
    agreement_date: sale.agreement_date ?? "",

    sale_price: sale.sale_price ?? "",
    deposit: sale.deposit ?? sale.deposit_amount ?? "",
    discount: sale.discount ?? sale.discount_amount ?? "0",
    amount_paid: sale.amount_paid ?? "0",

    currency: sale.currency ?? sale.plot?.currency ?? "KES",
    payment_frequency: sale.payment_frequency ?? "once",

    due_date: sale.due_date ?? "",
    completion_date: sale.completion_date ?? "",

    status: sale.status ?? "pending",
    is_active:
      sale.is_active === undefined || sale.is_active === null
        ? true
        : normalizeBoolean(sale.is_active),

    notes: sale.notes ?? "",
    cancellation_reason: sale.cancellation_reason ?? "",
  };
};

const formatCurrency = (amount, currency = "KES") => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) return "—";

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toLocaleString("en-KE", {
      maximumFractionDigits: 2,
    })}`;
  }
};

const isValidDate = (value) => {
  if (!value) return true;

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
};

const FormField = ({
  label,
  name,
  required = false,
  error,
  hint,
  children,
  className = "",
}) => (
  <div className={className}>
    <label htmlFor={name} className={labelClass}>
      {label}
      {required && (
        <span className="ml-1 text-red-500" aria-hidden="true">
          *
        </span>
      )}
    </label>

    {children}

    {error && <p className={errorClass}>{error}</p>}

    {!error && hint && (
      <p className="mt-1.5 text-xs leading-5 text-gray-500">{hint}</p>
    )}
  </div>
);

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
      <Icon className="h-5 w-5" />
    </div>

    <div className="min-w-0">
      <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
        {title}
      </h2>

      <p className="mt-1 text-sm leading-5 text-gray-500">
        {description}
      </p>
    </div>
  </div>
);

/*
|--------------------------------------------------------------------------
| Plot Sale Form
|--------------------------------------------------------------------------
*/

const PlotSaleForm = ({
  initialValues,
  plotSale,
  onSubmit,
  onCancel,
  loading = false,
  submitting = false,
  errors = {},
  plots = [],
  buyers = [],
  agents = [],
  mode,
  title: customTitle,
  description: customDescription,
  submitLabel,
  showSaleNumber = true,
  showAgent = true,
  showAgreement = true,
  showNotes = true,
  showActiveStatus = true,
}) => {
  const existingSale = initialValues ?? plotSale ?? {};

  const isEdit = mode === "edit" || Boolean(existingSale.id);
  const busy = loading || submitting;

  const initial = getInitialValues(existingSale);

  const initialSignature = JSON.stringify({
    id: existingSale.id ?? null,
    ...initial,
  });

  const [form, setForm] = useState(() =>
    JSON.parse(initialSignature),
  );

  const [localErrors, setLocalErrors] = useState({});

  const plotOptions = useMemo(
    () =>
      normalizeOptions(plots, [
        "title",
        "plot_number",
        "plot_code",
        "code",
      ]).map((option) => {
        const plot = option.raw;

        const title =
          plot?.title ??
          plot?.name ??
          plot?.plot_number ??
          option.label;

        const code = plot?.code ?? plot?.plot_number;

        const location =
          plot?.area?.name ??
          plot?.city?.name ??
          plot?.county?.name ??
          "";

        const price = plot?.asking_price;

        return {
          ...option,
          label: [
            title,
            code && code !== title ? `(${code})` : "",
            location,
            price !== undefined && price !== null
              ? `- ${formatCurrency(price, plot?.currency ?? "KES")}`
              : "",
          ]
            .filter(Boolean)
            .join(" "),
          status: plot?.status,
          currency: plot?.currency ?? "KES",
        };
      }),
    [plots],
  );

  const buyerOptions = useMemo(
    () =>
      normalizeOptions(buyers, [
        "full_name",
        "name",
        "username",
        "email",
      ]),
    [buyers],
  );

  const agentOptions = useMemo(
    () =>
      normalizeOptions(agents, [
        "full_name",
        "name",
        "username",
        "email",
      ]),
    [agents],
  );

  useEffect(() => {
    setForm(JSON.parse(initialSignature));
    setLocalErrors({});
  }, [initialSignature]);

  const selectedPlot = useMemo(
    () =>
      plotOptions.find(
        (option) => option.value === String(form.plot_id),
      ),
    [plotOptions, form.plot_id],
  );

  const salePrice = Number(form.sale_price) || 0;
  const deposit = Number(form.deposit) || 0;
  const discount = Number(form.discount) || 0;
  const amountPaid = Number(form.amount_paid) || 0;

  const netSalePrice = Math.max(0, salePrice - discount);
  const balance = netSalePrice - amountPaid;
  const paymentPercentage =
    netSalePrice > 0
      ? Math.min(100, Math.max(0, (amountPaid / netSalePrice) * 100))
      : 0;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    const nextValue = type === "checkbox" ? checked : value;

    setForm((previous) => {
      const next = {
        ...previous,
        [name]: nextValue,
      };

      if (name === "plot_id") {
        const nextPlot = plotOptions.find(
          (option) => option.value === String(value),
        );

        if (nextPlot?.currency && !isEdit) {
          next.currency = nextPlot.currency;
        }
      }

      return next;
    });

    setLocalErrors((previous) => ({
      ...previous,
      [name]: "",
      general: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    const saleNumber = String(form.sale_number ?? "").trim();
    const agreementNumber = String(
      form.agreement_number ?? "",
    ).trim();

    const notes = String(form.notes ?? "").trim();
    const cancellationReason = String(
      form.cancellation_reason ?? "",
    ).trim();

    if (!form.plot_id) {
      nextErrors.plot_id = "Select a plot for this sale.";
    } else if (
      !plotOptions.some(
        (option) => option.value === String(form.plot_id),
      )
    ) {
      nextErrors.plot_id =
        "The selected plot is not available in the supplied options.";
    }

    if (!form.buyer_id) {
      nextErrors.buyer_id = "Select the buyer for this sale.";
    }

    if (
      form.buyer_id &&
      !buyerOptions.some(
        (option) => option.value === String(form.buyer_id),
      )
    ) {
      nextErrors.buyer_id =
        "The selected buyer is not available in the supplied options.";
    }

    if (
      showAgent &&
      form.agent_id &&
      !agentOptions.some(
        (option) => option.value === String(form.agent_id),
      )
    ) {
      nextErrors.agent_id =
        "The selected agent is not available in the supplied options.";
    }

    if (showSaleNumber && saleNumber.length > 100) {
      nextErrors.sale_number =
        "Sale number cannot exceed 100 characters.";
    }

    if (!form.sale_date || !isValidDate(form.sale_date)) {
      nextErrors.sale_date = "Enter a valid sale date.";
    }

    if (agreementNumber.length > 100) {
      nextErrors.agreement_number =
        "Agreement number cannot exceed 100 characters.";
    }

    if (form.agreement_date && !isValidDate(form.agreement_date)) {
      nextErrors.agreement_date = "Enter a valid agreement date.";
    }

    const priceText = String(form.sale_price ?? "").trim();
    const price = Number(priceText);

    if (
      !priceText ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      nextErrors.sale_price =
        "Enter a sale price greater than zero.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(priceText)) {
      nextErrors.sale_price =
        "Sale price cannot have more than two decimal places.";
    }

    const numericFields = [
      ["deposit", "Deposit"],
      ["discount", "Discount"],
      ["amount_paid", "Amount paid"],
    ];

    numericFields.forEach(([field, label]) => {
      const valueText = String(form[field] ?? "").trim();
      const value = Number(valueText);

      if (
        valueText === "" ||
        !Number.isFinite(value) ||
        value < 0
      ) {
        nextErrors[field] = `${label} must be zero or greater.`;
      } else if (!/^\d+(\.\d{1,2})?$/.test(valueText)) {
        nextErrors[field] =
          `${label} cannot have more than two decimal places.`;
      }
    });

    if (
      Number.isFinite(price) &&
      price > 0 &&
      Number.isFinite(discount) &&
      discount > price
    ) {
      nextErrors.discount =
        "Discount cannot exceed the sale price.";
    }

    if (
      Number.isFinite(price) &&
      Number.isFinite(discount) &&
      Number.isFinite(amountPaid) &&
      amountPaid > Math.max(0, price - discount)
    ) {
      nextErrors.amount_paid =
        "Amount paid cannot exceed the net sale price.";
    }

    if (deposit > price && price > 0) {
      nextErrors.deposit =
        "Deposit cannot exceed the sale price.";
    }

    if (
      !CURRENCY_OPTIONS.some(
        (option) => option.value === form.currency,
      )
    ) {
      nextErrors.currency = "Select a supported currency.";
    }

    if (
      !PAYMENT_FREQUENCY_OPTIONS.some(
        (option) => option.value === form.payment_frequency,
      )
    ) {
      nextErrors.payment_frequency =
        "Select a valid payment frequency.";
    }

    if (
      !SALE_STATUS_OPTIONS.some(
        (option) => option.value === form.status,
      )
    ) {
      nextErrors.status = "Select a valid sale status.";
    }

    if (form.due_date && !isValidDate(form.due_date)) {
      nextErrors.due_date = "Enter a valid due date.";
    }

    if (
      form.completion_date &&
      !isValidDate(form.completion_date)
    ) {
      nextErrors.completion_date =
        "Enter a valid completion date.";
    }

    if (notes.length > 10000) {
      nextErrors.notes =
        "Notes cannot exceed 10,000 characters.";
    }

    if (cancellationReason.length > 2000) {
      nextErrors.cancellation_reason =
        "Cancellation reason cannot exceed 2,000 characters.";
    }

    if (
      form.status === "cancelled" &&
      !cancellationReason
    ) {
      nextErrors.cancellation_reason =
        "Provide a reason for cancelling this sale.";
    }

    setLocalErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (busy || typeof onSubmit !== "function") return;
    if (!validate()) return;

    const payload = {
      plot_id: Number(form.plot_id),
      buyer_id: Number(form.buyer_id),

      sale_date: form.sale_date,
      sale_price: Number(form.sale_price),
      deposit: Number(form.deposit || 0),
      discount: Number(form.discount || 0),
      currency: form.currency,
      payment_frequency: form.payment_frequency,
      status: form.status,
      is_active: Boolean(form.is_active),

      agent_id:
        showAgent && form.agent_id !== ""
          ? Number(form.agent_id)
          : null,

      agreement_number:
        String(form.agreement_number ?? "").trim() || null,

      agreement_date: form.agreement_date || null,
      due_date: form.due_date || null,
      completion_date: form.completion_date || null,

      notes: String(form.notes ?? "").trim() || null,

      cancellation_reason:
        form.status === "cancelled"
          ? String(form.cancellation_reason ?? "").trim()
          : null,
    };

    /*
     * Do not submit derived balance, net_sale_price or payment_percentage.
     * These should be calculated and maintained by the backend.
     *
     * Do not submit amount_paid by default. In a sale/payment system,
     * payments should normally be recorded through the PlotPayment API.
     * If your StorePlotSaleRequest explicitly supports amount_paid,
     * add it to this payload only after confirming the backend contract.
     */

    const saleNumber = String(form.sale_number ?? "").trim();

    if (showSaleNumber && saleNumber) {
      payload.sale_number = saleNumber;
    }

    try {
      await onSubmit(payload);
      setLocalErrors({});
    } catch (error) {
      const responseErrors = error?.response?.data?.errors ?? {};

      const normalizedErrors = Object.fromEntries(
        Object.entries(responseErrors).map(([field, messages]) => [
          field,
          Array.isArray(messages)
            ? messages[0]
            : String(messages),
        ]),
      );

      setLocalErrors((previous) => ({
        ...previous,
        ...normalizedErrors,
        general:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to save the plot sale. Please try again.",
      }));
    }
  };

  const fieldError = (field) =>
    localErrors[field] || getErrorMessage(errors, field);

  const heading =
    customTitle ||
    (isEdit ? "Edit Plot Sale" : "Create Plot Sale");

  const subtitle =
    customDescription ||
    (isEdit
      ? "Update the plot sale details and save your changes."
      : "Record a new land sale and capture its financial and agreement details.");

  const buttonText =
    submitLabel || (isEdit ? "Save Changes" : "Create Sale");

  const generalError =
    localErrors.general ||
    errors.message ||
    errors.error ||
    "";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6"
    >
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <LandPlot className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              {heading}
            </h1>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>
            Fields marked <span className="text-red-500">*</span> are
            required
          </span>
        </div>
      </div>

      {/* General errors */}
      {generalError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">
              Unable to save plot sale
            </p>
            <p className="mt-1">{generalError}</p>
          </div>
        </div>
      )}

      {/* Plot and customer */}
      <section className={sectionClass}>
        <SectionHeader
          icon={LandPlot}
          title="Sale Information"
          description="Choose the plot, buyer and agent responsible for this transaction."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          {showSaleNumber && (
            <FormField
              label="Sale Number"
              name="sale_number"
              error={fieldError("sale_number")}
              hint={
                isEdit
                  ? "The existing sale reference."
                  : "Optional. Leave blank if the backend generates the sale number."
              }
            >
              <input
                id="sale_number"
                name="sale_number"
                type="text"
                value={form.sale_number}
                onChange={handleChange}
                placeholder="Generated by the system if blank"
                maxLength={100}
                disabled={busy}
                className={inputClass}
              />
            </FormField>
          )}

          <FormField
            label="Plot"
            name="plot_id"
            required
            error={fieldError("plot_id")}
            hint="Select the plot being sold."
            className="sm:col-span-2"
          >
            <select
              id="plot_id"
              name="plot_id"
              value={form.plot_id}
              onChange={handleChange}
              required
              disabled={busy}
              aria-invalid={Boolean(fieldError("plot_id"))}
              className={inputClass}
            >
              <option value="">Select a plot</option>

              {plotOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={
                    !isEdit &&
                    ["sold", "unavailable"].includes(option.status)
                  }
                >
                  {option.label}
                  {!isEdit &&
                    ["sold", "unavailable"].includes(option.status)
                    ? ` - ${option.status}`
                    : ""}
                </option>
              ))}
            </select>

            {selectedPlot && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />

                <span className="text-sm font-medium text-gray-800">
                  {selectedPlot.label}
                </span>

                {selectedPlot.status && (
                  <span className="ml-auto rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                    {selectedPlot.status}
                  </span>
                )}
              </div>
            )}
          </FormField>

          <FormField
            label="Buyer"
            name="buyer_id"
            required
            error={fieldError("buyer_id")}
          >
            <select
              id="buyer_id"
              name="buyer_id"
              value={form.buyer_id}
              onChange={handleChange}
              required
              disabled={busy}
              aria-invalid={Boolean(fieldError("buyer_id"))}
              className={inputClass}
            >
              <option value="">Select buyer</option>

              {buyerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          {showAgent && (
            <FormField
              label="Sales Agent"
              name="agent_id"
              error={fieldError("agent_id")}
              hint="Optional, if an agent is responsible for the sale."
            >
              <select
                id="agent_id"
                name="agent_id"
                value={form.agent_id}
                onChange={handleChange}
                disabled={busy}
                className={inputClass}
              >
                <option value="">No assigned agent</option>

                {agentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <FormField
            label="Sale Date"
            name="sale_date"
            required
            error={fieldError("sale_date")}
          >
            <input
              id="sale_date"
              name="sale_date"
              type="date"
              value={form.sale_date}
              onChange={handleChange}
              required
              disabled={busy}
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Sale Status"
            name="status"
            required
            error={fieldError("status")}
          >
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              required
              disabled={busy}
              className={inputClass}
            >
              {SALE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </section>

      {/* Agreement */}
      {showAgreement && (
        <section className={sectionClass}>
          <SectionHeader
            icon={FileText}
            title="Agreement Details"
            description="Capture the agreement reference and important dates."
          />

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <FormField
              label="Agreement Number"
              name="agreement_number"
              error={fieldError("agreement_number")}
              hint="Optional legal agreement or contract reference."
            >
              <input
                id="agreement_number"
                name="agreement_number"
                type="text"
                value={form.agreement_number}
                onChange={handleChange}
                placeholder="Enter agreement number"
                maxLength={100}
                disabled={busy}
                className={inputClass}
              />
            </FormField>

            <FormField
              label="Agreement Date"
              name="agreement_date"
              error={fieldError("agreement_date")}
            >
              <input
                id="agreement_date"
                name="agreement_date"
                type="date"
                value={form.agreement_date}
                onChange={handleChange}
                disabled={busy}
                className={inputClass}
              />
            </FormField>

            <FormField
              label="Payment Due Date"
              name="due_date"
              error={fieldError("due_date")}
              hint="Optional date by which the outstanding balance should be settled."
            >
              <input
                id="due_date"
                name="due_date"
                type="date"
                value={form.due_date}
                onChange={handleChange}
                disabled={busy}
                className={inputClass}
              />
            </FormField>

            <FormField
              label="Completion Date"
              name="completion_date"
              error={fieldError("completion_date")}
              hint="Enter the date the sale was completed, if applicable."
            >
              <input
                id="completion_date"
                name="completion_date"
                type="date"
                value={form.completion_date}
                onChange={handleChange}
                disabled={busy}
                className={inputClass}
              />
            </FormField>
          </div>
        </section>
      )}

      {/* Financial details */}
      <section className={sectionClass}>
        <SectionHeader
          icon={Wallet}
          title="Financial Details"
          description="Enter the agreed sale price, deposit, discount and payment arrangement."
        />

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <FormField
            label="Sale Price"
            name="sale_price"
            required
            error={fieldError("sale_price")}
            hint="Enter the agreed price before discount."
          >
            <input
              id="sale_price"
              name="sale_price"
              type="number"
              min="0.01"
              step="0.01"
              value={form.sale_price}
              onChange={handleChange}
              placeholder="e.g. 12500000"
              required
              disabled={busy}
              aria-invalid={Boolean(fieldError("sale_price"))}
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Currency"
            name="currency"
            required
            error={fieldError("currency")}
          >
            <select
              id="currency"
              name="currency"
              value={form.currency}
              onChange={handleChange}
              required
              disabled={busy}
              className={inputClass}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Deposit"
            name="deposit"
            error={fieldError("deposit")}
            hint="The agreed deposit amount. Record actual payments through Plot Payments."
          >
            <input
              id="deposit"
              name="deposit"
              type="number"
              min="0"
              step="0.01"
              value={form.deposit}
              onChange={handleChange}
              placeholder="e.g. 1000000"
              disabled={busy}
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Discount"
            name="discount"
            error={fieldError("discount")}
            hint="Enter the discount amount, or leave it at zero."
          >
            <input
              id="discount"
              name="discount"
              type="number"
              min="0"
              step="0.01"
              value={form.discount}
              onChange={handleChange}
              placeholder="0"
              disabled={busy}
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Payment Frequency"
            name="payment_frequency"
            required
            error={fieldError("payment_frequency")}
          >
            <select
              id="payment_frequency"
              name="payment_frequency"
              value={form.payment_frequency}
              onChange={handleChange}
              required
              disabled={busy}
              className={inputClass}
            >
              {PAYMENT_FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Amount Paid (Preview)"
            name="amount_paid"
            error={fieldError("amount_paid")}
            hint="Read-only preview from existing sale data. Record new payments using Plot Payments."
          >
            <input
              id="amount_paid"
              name="amount_paid"
              type="number"
              min="0"
              step="0.01"
              value={form.amount_paid}
              readOnly
              disabled={busy}
              className={`${inputClass} cursor-not-allowed bg-gray-50`}
            />
          </FormField>
        </div>

        {/* Financial summary */}
        <div className="border-t border-gray-100 bg-gray-50/70 p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Sale Summary
            </h3>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Calculated preview based on the amounts entered above.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-500">
                Sale Price
              </p>
              <p className="mt-2 break-words text-lg font-bold text-gray-900">
                {formatCurrency(salePrice, form.currency)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-500">
                Discount
              </p>
              <p className="mt-2 break-words text-lg font-bold text-gray-900">
                {formatCurrency(discount, form.currency)}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <p className="text-xs font-medium text-emerald-700">
                Net Sale Price
              </p>
              <p className="mt-2 break-words text-lg font-bold text-emerald-800">
                {formatCurrency(netSalePrice, form.currency)}
              </p>
            </div>

            <div
              className={`rounded-xl border p-4 ${balance > 0
                ? "border-amber-200 bg-amber-50/70"
                : balance < 0
                  ? "border-red-200 bg-red-50/70"
                  : "border-gray-200 bg-white"
                }`}
            >
              <p
                className={`text-xs font-medium ${balance > 0
                  ? "text-amber-700"
                  : balance < 0
                    ? "text-red-700"
                    : "text-gray-500"
                  }`}
              >
                Outstanding Balance Preview
              </p>

              <p
                className={`mt-2 break-words text-lg font-bold ${balance > 0
                  ? "text-amber-800"
                  : balance < 0
                    ? "text-red-800"
                    : "text-gray-900"
                  }`}
              >
                {formatCurrency(Math.max(0, balance), form.currency)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-gray-600">
                Recorded payment progress
              </span>
              <span className="text-xs font-semibold text-gray-800">
                {paymentPercentage.toFixed(1)}%
              </span>
            </div>

            <div
              className="h-2 overflow-hidden rounded-full bg-gray-200"
              role="progressbar"
              aria-label="Recorded payment progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={paymentPercentage}
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${paymentPercentage}%` }}
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Financial totals are previews. The backend should remain
              the source of truth for payment totals and outstanding
              balances.
            </p>
          </div>
        </div>
      </section>

      {/* Cancellation */}
      {form.status === "cancelled" && (
        <section className="rounded-2xl border border-red-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-red-100 px-5 py-4 sm:px-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Ban className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
                Cancellation Details
              </h2>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                Explain why this sale is being cancelled.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <FormField
              label="Cancellation Reason"
              name="cancellation_reason"
              required
              error={fieldError("cancellation_reason")}
            >
              <textarea
                id="cancellation_reason"
                name="cancellation_reason"
                rows={3}
                value={form.cancellation_reason}
                onChange={handleChange}
                placeholder="Enter the reason for cancellation..."
                maxLength={2000}
                required
                disabled={busy}
                className={`${inputClass} resize-y`}
              />
            </FormField>
          </div>
        </section>
      )}

      {/* Notes */}
      {showNotes && (
        <section className={sectionClass}>
          <SectionHeader
            icon={Info}
            title="Additional Information"
            description="Add internal notes or relevant details about this transaction."
          />

          <div className="p-5 sm:p-6">
            <FormField
              label="Sale Notes"
              name="notes"
              error={fieldError("notes")}
              hint="Optional. Add payment arrangements, conditions or other important information."
            >
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={form.notes}
                onChange={handleChange}
                placeholder="Enter additional sale information..."
                maxLength={10000}
                disabled={busy}
                className={`${inputClass} resize-y`}
              />
            </FormField>
          </div>
        </section>
      )}

      {/* Active status */}
      {showActiveStatus && (
        <section className={sectionClass}>
          <div className="p-5 sm:p-6">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="is_active"
                checked={Boolean(form.is_active)}
                onChange={handleChange}
                disabled={busy}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />

              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900">
                  Active sale record
                </span>

                <span className="mt-1 block text-sm leading-5 text-gray-500">
                  Keep this sale visible in active management screens.
                </span>
              </span>

              <span
                className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${form.is_active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 bg-gray-100 text-gray-600"
                  }`}
              >
                {form.is_active ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Ban className="h-3.5 w-3.5" />
                )}

                {form.is_active ? "Active" : "Inactive"}
              </span>
            </label>

            {fieldError("is_active") && (
              <p className={errorClass}>
                {fieldError("is_active")}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Sticky actions */}
      <div className="sticky bottom-0 z-10 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:p-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs leading-5 text-gray-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              Review the buyer, plot, agreed price and agreement details
              before saving. Record actual payments in the Plot Payments
              module.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={busy || typeof onSubmit !== "function"}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {buttonText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlotSaleForm;
