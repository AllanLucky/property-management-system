
import plotPaymentsApi from "../api/plotPayments.api";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;
const MAX_PER_PAGE = 100;

const DEFAULT_CURRENCY = "KES";

const PAYMENT_STATUSES = [
  "pending",
  "completed",
  "failed",
  "cancelled",
  "refunded",
];

const PAYMENT_TYPES = [
  "deposit",
  "installment",
  "balance",
  "full_payment",
  "other",
];

const PAYMENT_METHODS = [
  "mpesa",
  "bank_transfer",
  "cash",
  "card",
  "cheque",
  "online",
  "other",
];

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Extract the standard API response payload.
 *
 * Supports:
 * {
 *   status,
 *   code,
 *   message,
 *   data,
 *   meta,
 *   links,
 *   errors
 * }
 */
const extractData = (response) => {
  if (response === null || response === undefined) {
    return null;
  }

  if (
    response?.data !== undefined &&
    response?.meta !== undefined
  ) {
    return response.data;
  }

  if (
    response?.data?.data !== undefined &&
    response?.data?.meta !== undefined
  ) {
    return response.data.data;
  }

  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
};

/**
 * Extract a collection from an API response.
 */
const extractCollection = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
};

/**
 * Extract one payment record.
 */
const extractRecord = (response) => {
  const data = extractData(response);

  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data;
};

/**
 * Extract pagination metadata.
 */
const extractPagination = (response) => {
  const meta =
    response?.meta ??
    response?.data?.meta ??
    {};

  return {
    current_page: Number(meta.current_page ?? 1),
    last_page: Number(meta.last_page ?? 1),
    per_page: Number(meta.per_page ?? DEFAULT_PER_PAGE),
    total: Number(meta.total ?? 0),
    from: meta.from ?? null,
    to: meta.to ?? null,
    has_more_pages:
      meta.has_more_pages ??
      Number(meta.current_page ?? 1) <
        Number(meta.last_page ?? 1),
  };
};

/**
 * Extract pagination links.
 */
const extractLinks = (response) => ({
  first:
    response?.links?.first ??
    response?.data?.links?.first ??
    null,

  last:
    response?.links?.last ??
    response?.data?.links?.last ??
    null,

  prev:
    response?.links?.prev ??
    response?.data?.links?.prev ??
    null,

  next:
    response?.links?.next ??
    response?.data?.links?.next ??
    null,
});

/**
 * Extract API message.
 */
const extractMessage = (
  response,
  fallback = "Request completed successfully.",
) => {
  return (
    response?.message ??
    response?.data?.message ??
    fallback
  );
};

/*
|--------------------------------------------------------------------------
| ERROR HANDLING
|--------------------------------------------------------------------------
*/

/**
 * Extract readable API and validation errors.
 */
export const getPlotPaymentErrorMessage = (
  error,
  fallback = "An unexpected error occurred. Please try again.",
) => {
  const responseData = error?.response?.data;

  if (typeof responseData?.message === "string") {
    return responseData.message;
  }

  const validationErrors = responseData?.errors;

  if (typeof validationErrors === "string") {
    return validationErrors;
  }

  if (
    validationErrors &&
    typeof validationErrors === "object"
  ) {
    const firstError = Object.values(validationErrors)
      .flat()
      .find((message) => typeof message === "string");

    if (firstError) {
      return firstError;
    }
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  return fallback;
};

/**
 * Normalize errors before passing them to components.
 */
const handleServiceError = (
  error,
  fallback,
) => {
  const message = getPlotPaymentErrorMessage(
    error,
    fallback,
  );

  const serviceError = new Error(message);

  serviceError.originalError = error;
  serviceError.response = error?.response;
  serviceError.status = error?.response?.status;
  serviceError.errors =
    error?.response?.data?.errors ?? null;

  throw serviceError;
};

/*
|--------------------------------------------------------------------------
| FILTER HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Remove empty filter values.
 */
export const cleanPlotPaymentFilters = (filters = {}) => {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "",
    ),
  );
};

/**
 * Normalize list query parameters.
 */
export const normalizePlotPaymentParams = (
  params = {},
) => {
  const normalized = cleanPlotPaymentFilters(params);

  return {
    ...normalized,
    page: Math.max(1, Number(normalized.page) || 1),
    per_page: Math.min(
      MAX_PER_PAGE,
      Math.max(
        1,
        Number(normalized.per_page) || DEFAULT_PER_PAGE,
      ),
    ),
  };
};

/**
 * Normalize a payment search term.
 */
export const normalizePlotPaymentSearch = (search) => {
  return typeof search === "string"
    ? search.trim()
    : "";
};

/*
|--------------------------------------------------------------------------
| PAYMENT NORMALIZATION
|--------------------------------------------------------------------------
*/

/**
 * Convert an amount into a valid number.
 */
export const toPlotPaymentNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

/**
 * Normalize a payment record without changing backend fields.
 */
export const normalizePlotPayment = (payment = {}) => {
  if (!payment || typeof payment !== "object") {
    return null;
  }

  return {
    ...payment,

    id: payment.id ?? null,

    amount: toPlotPaymentNumber(payment.amount),

    currency: payment.currency || DEFAULT_CURRENCY,

    payment_type: payment.payment_type || "other",

    payment_method: payment.payment_method || "other",

    status: payment.status || "pending",

    is_active:
      payment.is_active === undefined
        ? true
        : Boolean(payment.is_active),

    plot_sale: payment.plot_sale ?? null,

    created_at: payment.created_at ?? null,

    updated_at: payment.updated_at ?? null,
  };
};

/**
 * Normalize a collection of payment records.
 */
export const normalizePlotPayments = (payments) => {
  return Array.isArray(payments)
    ? payments
        .map(normalizePlotPayment)
        .filter(Boolean)
    : [];
};

/*
|--------------------------------------------------------------------------
| LIST PLOT PAYMENTS
|--------------------------------------------------------------------------
|
| GET /plot-payments
|
*/

const getAll = async (params = {}) => {
  try {
    const query = normalizePlotPaymentParams(params);

    const response = await plotPaymentsApi.getAll(query);

    return {
      data: normalizePlotPayments(
        extractCollection(response),
      ),
      meta: extractPagination(response),
      links: extractLinks(response),
      message: extractMessage(
        response,
        "Plot payments fetched successfully.",
      ),
      status: true,
    };
  } catch (error) {
    handleServiceError(
      error,
      "Failed to fetch plot payments.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| GET SINGLE PLOT PAYMENT
|--------------------------------------------------------------------------
|
| GET /plot-payments/{id}
|
*/

const getById = async (id) => {
  try {
    if (!id) {
      throw new Error("Payment ID is required.");
    }

    const response = await plotPaymentsApi.getById(id);

    return normalizePlotPayment(
      extractRecord(response),
    );
  } catch (error) {
    handleServiceError(
      error,
      "Failed to fetch plot payment details.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| CREATE PLOT PAYMENT
|--------------------------------------------------------------------------
|
| POST /plot-payments
|
*/

const create = async (paymentData) => {
  try {
    if (!paymentData || typeof paymentData !== "object") {
      throw new Error("Payment information is required.");
    }

    if (!paymentData.plot_sale_id) {
      throw new Error("Please select a plot sale.");
    }

    if (
      toPlotPaymentNumber(paymentData.amount) <= 0
    ) {
      throw new Error("Payment amount must be greater than zero.");
    }

    const payload = cleanPlotPaymentFilters({
      ...paymentData,
    });

    const response = await plotPaymentsApi.create(payload);

    return normalizePlotPayment(
      extractRecord(response),
    );
  } catch (error) {
    handleServiceError(
      error,
      "Failed to create plot payment.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE PLOT PAYMENT
|--------------------------------------------------------------------------
|
| PUT /plot-payments/{id}
|
*/

const update = async (id, paymentData) => {
  try {
    if (!id) {
      throw new Error("Payment ID is required.");
    }

    if (!paymentData || typeof paymentData !== "object") {
      throw new Error("Payment information is required.");
    }

    const payload = cleanPlotPaymentFilters({
      ...paymentData,
    });

    const response = await plotPaymentsApi.update(
      id,
      payload,
    );

    return normalizePlotPayment(
      extractRecord(response),
    );
  } catch (error) {
    handleServiceError(
      error,
      "Failed to update plot payment.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| DELETE PLOT PAYMENT
|--------------------------------------------------------------------------
|
| DELETE /plot-payments/{id}
|
*/

const remove = async (id) => {
  try {
    if (!id) {
      throw new Error("Payment ID is required.");
    }

    const response = await plotPaymentsApi.delete(id);

    return {
      data: extractRecord(response),
      message: extractMessage(
        response,
        "Plot payment deleted successfully.",
      ),
      status: true,
    };
  } catch (error) {
    handleServiceError(
      error,
      "Failed to delete plot payment.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| SEARCH PLOT PAYMENTS
|--------------------------------------------------------------------------
|
| GET /plot-payments/search
|
*/

const search = async (searchTerm, filters = {}) => {
  try {
    const term = normalizePlotPaymentSearch(searchTerm);

    const params = normalizePlotPaymentParams({
      ...filters,
      search: term || undefined,
    });

    const response = await plotPaymentsApi.search(params);

    return {
      data: normalizePlotPayments(
        extractCollection(response),
      ),
      meta: extractPagination(response),
      links: extractLinks(response),
      message: extractMessage(
        response,
        "Plot payment search completed successfully.",
      ),
      status: true,
    };
  } catch (error) {
    handleServiceError(
      error,
      "Failed to search plot payments.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| PLOT PAYMENT STATISTICS
|--------------------------------------------------------------------------
|
| GET /plot-payments/statistics
|
*/

const getStatistics = async (filters = {}) => {
  try {
    const params = cleanPlotPaymentFilters(filters);

    const response =
      await plotPaymentsApi.getStatistics(params);

    return extractRecord(response) ?? {};
  } catch (error) {
    handleServiceError(
      error,
      "Failed to fetch plot payment statistics.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| PAYMENTS BY PLOT SALE
|--------------------------------------------------------------------------
|
| GET /plot-payments/sale/{plotSaleId}
|
*/

const getBySale = async (plotSaleId, params = {}) => {
  try {
    if (!plotSaleId) {
      throw new Error("Plot sale ID is required.");
    }

    const response = await plotPaymentsApi.getBySale(
      plotSaleId,
      normalizePlotPaymentParams(params),
    );

    return {
      data: normalizePlotPayments(
        extractCollection(response),
      ),
      meta: extractPagination(response),
      links: extractLinks(response),
      message: extractMessage(
        response,
        "Plot sale payments fetched successfully.",
      ),
      status: true,
    };
  } catch (error) {
    handleServiceError(
      error,
      "Failed to fetch payments for this plot sale.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| PAYMENTS BY STATUS
|--------------------------------------------------------------------------
|
| GET /plot-payments/status/{status}
|
*/

const getByStatus = async (status, params = {}) => {
  try {
    if (!PAYMENT_STATUSES.includes(status)) {
      throw new Error("Invalid payment status.");
    }

    const response = await plotPaymentsApi.getByStatus(
      status,
      normalizePlotPaymentParams(params),
    );

    return {
      data: normalizePlotPayments(
        extractCollection(response),
      ),
      meta: extractPagination(response),
      links: extractLinks(response),
      message: extractMessage(
        response,
        "Plot payments fetched successfully.",
      ),
      status: true,
    };
  } catch (error) {
    handleServiceError(
      error,
      "Failed to fetch payments by status.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE PAYMENT STATUS
|--------------------------------------------------------------------------
|
| PATCH /plot-payments/{id}/status
|
*/

const updateStatus = async (id, statusData) => {
  try {
    if (!id) {
      throw new Error("Payment ID is required.");
    }

    const status =
      typeof statusData === "string"
        ? statusData
        : statusData?.status;

    if (!PAYMENT_STATUSES.includes(status)) {
      throw new Error("Invalid payment status.");
    }

    const response = await plotPaymentsApi.updateStatus(
      id,
      statusData,
    );

    return normalizePlotPayment(
      extractRecord(response),
    );
  } catch (error) {
    handleServiceError(
      error,
      "Failed to update plot payment status.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| RESTORE PAYMENT
|--------------------------------------------------------------------------
|
| POST /plot-payments/{id}/restore
|
*/

const restore = async (id) => {
  try {
    if (!id) {
      throw new Error("Payment ID is required.");
    }

    const response = await plotPaymentsApi.restore(id);

    return {
      data: extractRecord(response),
      message: extractMessage(
        response,
        "Plot payment restored successfully.",
      ),
      status: true,
    };
  } catch (error) {
    handleServiceError(
      error,
      "Failed to restore plot payment.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| FORCE DELETE PAYMENT
|--------------------------------------------------------------------------
|
| DELETE /plot-payments/{id}/force
|
*/

const forceDelete = async (id) => {
  try {
    if (!id) {
      throw new Error("Payment ID is required.");
    }

    const response =
      await plotPaymentsApi.forceDelete(id);

    return {
      data: extractRecord(response),
      message: extractMessage(
        response,
        "Plot payment permanently deleted.",
      ),
      status: true,
    };
  } catch (error) {
    handleServiceError(
      error,
      "Failed to permanently delete plot payment.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| FORMATTING HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Format payment amount.
 */
export const formatPlotPaymentAmount = (
  amount,
  currency = DEFAULT_CURRENCY,
) => {
  const value = toPlotPaymentNumber(amount);

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency || DEFAULT_CURRENCY,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency || DEFAULT_CURRENCY} ${value.toLocaleString(
      "en-KE",
    )}`;
  }
};

/**
 * Format a date.
 */
export const formatPlotPaymentDate = (
  date,
  options = {},
) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(parsedDate);
};

/**
 * Format payment status.
 */
export const formatPlotPaymentStatus = (status) => {
  if (!status) return "Unknown";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
};

/**
 * Format payment type.
 */
export const formatPlotPaymentType = (type) => {
  if (!type) return "Other";

  const labels = {
    deposit: "Deposit",
    installment: "Installment",
    balance: "Balance",
    full_payment: "Full Payment",
    other: "Other",
  };

  return labels[type] || formatPlotPaymentStatus(type);
};

/**
 * Format payment method.
 */
export const formatPlotPaymentMethod = (method) => {
  if (!method) return "Other";

  const labels = {
    mpesa: "M-Pesa",
    bank_transfer: "Bank Transfer",
    cash: "Cash",
    card: "Card",
    cheque: "Cheque",
    online: "Online",
    other: "Other",
  };

  return labels[method] || formatPlotPaymentStatus(method);
};

/*
|--------------------------------------------------------------------------
| VALIDATION HELPERS
|--------------------------------------------------------------------------
*/

export const validatePlotPayment = (payment = {}) => {
  const errors = {};

  if (!payment.plot_sale_id) {
    errors.plot_sale_id = "Please select a plot sale.";
  }

  if (
    !payment.amount ||
    toPlotPaymentNumber(payment.amount) <= 0
  ) {
    errors.amount = "Enter a valid payment amount.";
  }

  if (
    payment.payment_type &&
    !PAYMENT_TYPES.includes(payment.payment_type)
  ) {
    errors.payment_type = "Select a valid payment type.";
  }

  if (
    payment.payment_method &&
    !PAYMENT_METHODS.includes(payment.payment_method)
  ) {
    errors.payment_method = "Select a valid payment method.";
  }

  if (
    payment.status &&
    !PAYMENT_STATUSES.includes(payment.status)
  ) {
    errors.status = "Select a valid payment status.";
  }

  if (
    payment.payer_email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      payment.payer_email,
    )
  ) {
    errors.payer_email = "Enter a valid email address.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/*
|--------------------------------------------------------------------------
| SERVICE OBJECT
|--------------------------------------------------------------------------
*/

const plotPaymentService = {
  // Constants
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
  DEFAULT_CURRENCY,
  PAYMENT_STATUSES,
  PAYMENT_TYPES,
  PAYMENT_METHODS,

  // List and details
  getAll,
  getById,

  // CRUD
  create,
  update,
  delete: remove,

  // Search
  search,

  // Statistics
  getStatistics,

  // Related payments
  getBySale,
  getByStatus,

  // Status
  updateStatus,

  // Restore and permanent delete
  restore,
  forceDelete,

  // Response helpers
  extractData,
  extractCollection,
  extractRecord,
  extractPagination,
  extractLinks,

  // Filter helpers
  cleanFilters: cleanPlotPaymentFilters,
  normalizeParams: normalizePlotPaymentParams,

  // Payment helpers
  normalizePayment: normalizePlotPayment,
  normalizePayments: normalizePlotPayments,
  toNumber: toPlotPaymentNumber,

  // Formatting
  formatAmount: formatPlotPaymentAmount,
  formatDate: formatPlotPaymentDate,
  formatStatus: formatPlotPaymentStatus,
  formatType: formatPlotPaymentType,
  formatMethod: formatPlotPaymentMethod,

  // Validation
  validate: validatePlotPayment,

  // Error handling
  getErrorMessage: getPlotPaymentErrorMessage,
};

export default plotPaymentService;
