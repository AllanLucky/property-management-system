
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
 * 1. Axios response containing an API envelope.
 * 2. Already-unwrapped API response data.
 * 3. Service-level response objects.
 */
const extractData = (response) => {
  if (response === null || response === undefined) {
    return null;
  }

  // Already-unwrapped API envelope:
  // { status, code, message, data, meta, links }
  if (
    response?.data !== undefined &&
    (response?.meta !== undefined ||
      response?.links !== undefined)
  ) {
    return response.data;
  }

  // Axios response containing an API envelope:
  // { data: { status, code, message, data, meta, links } }
  if (
    response?.data?.data !== undefined &&
    (
      response?.data?.meta !== undefined ||
      response?.data?.links !== undefined
    )
  ) {
    return response.data.data;
  }

  // Axios response containing a regular payload.
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

  const currentPage = Number(
    meta.current_page ?? 1,
  );

  const lastPage = Number(
    meta.last_page ?? 1,
  );

  return {
    current_page: currentPage,
    last_page: lastPage,
    per_page: Number(
      meta.per_page ?? DEFAULT_PER_PAGE,
    ),
    total: Number(meta.total ?? 0),
    from: meta.from ?? null,
    to: meta.to ?? null,

    has_more_pages:
      meta.has_more_pages ??
      currentPage < lastPage,
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

/**
 * Normalize paginated service responses.
 */
const normalizePaginatedResponse = (
  response,
  fallbackMessage = "Plot payments retrieved successfully.",
) => ({
  data: normalizePlotPayments(
    extractCollection(response),
  ),

  meta: extractPagination(response),

  links: extractLinks(response),

  message: extractMessage(
    response,
    fallbackMessage,
  ),

  status: response?.status ?? true,
});

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
      .find(
        (message) => typeof message === "string",
      );

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
const handleServiceError = (error, fallback) => {
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
| VALIDATION HELPERS
|--------------------------------------------------------------------------
*/

const validateId = (id, label = "Payment ID") => {
  if (
    id === undefined ||
    id === null ||
    id === "" ||
    !Number.isFinite(Number(id)) ||
    Number(id) <= 0
  ) {
    throw new Error(`${label} is required.`);
  }

  return id;
};

const validateStatus = (status) => {
  if (!PAYMENT_STATUSES.includes(status)) {
    throw new Error(
      `Invalid payment status. Allowed statuses: ${PAYMENT_STATUSES.join(", ")}.`,
    );
  }

  return status;
};

/*
|--------------------------------------------------------------------------
| FILTER HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Remove empty filter values.
 *
 * Preserves valid values such as:
 * 0, false, and numeric values.
 */
export const cleanPlotPaymentFilters = (
  filters = {},
) => {
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

  const page = Number(normalized.page);

  const perPage = Number(normalized.per_page);

  return {
    ...normalized,

    page:
      Number.isFinite(page) && page > 0
        ? Math.floor(page)
        : 1,

    per_page:
      Number.isFinite(perPage) && perPage > 0
        ? Math.min(
          Math.floor(perPage),
          MAX_PER_PAGE,
        )
        : DEFAULT_PER_PAGE,
  };
};

/**
 * Normalize a payment search term.
 */
export const normalizePlotPaymentSearch = (
  search,
) => {
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
export const normalizePlotPayment = (
  payment = {},
) => {
  if (
    !payment ||
    typeof payment !== "object" ||
    Array.isArray(payment)
  ) {
    return null;
  }

  return {
    ...payment,

    id: payment.id ?? null,

    amount: toPlotPaymentNumber(
      payment.amount,
    ),

    currency:
      payment.currency || DEFAULT_CURRENCY,

    payment_type:
      payment.payment_type || "other",

    payment_method:
      payment.payment_method || "other",

    status:
      payment.status || "pending",

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
export const normalizePlotPayments = (
  payments,
) => {
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
    const query =
      normalizePlotPaymentParams(params);

    const response =
      await plotPaymentsApi.getAll(query);

    return normalizePaginatedResponse(
      response,
      "Plot payments fetched successfully.",
    );
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
    validateId(id);

    const response =
      await plotPaymentsApi.getById(id);

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
    if (
      !paymentData ||
      typeof paymentData !== "object" ||
      Array.isArray(paymentData)
    ) {
      throw new Error(
        "Payment information is required.",
      );
    }

    if (!paymentData.plot_sale_id) {
      throw new Error(
        "Please select a plot sale.",
      );
    }

    if (
      toPlotPaymentNumber(paymentData.amount) <= 0
    ) {
      throw new Error(
        "Payment amount must be greater than zero.",
      );
    }

    const payload =
      cleanPlotPaymentFilters(paymentData);

    const response =
      await plotPaymentsApi.create(payload);

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
    validateId(id);

    if (
      !paymentData ||
      typeof paymentData !== "object" ||
      Array.isArray(paymentData)
    ) {
      throw new Error(
        "Payment information is required.",
      );
    }

    const payload =
      cleanPlotPaymentFilters(paymentData);

    if (
      payload.status === "completed" ||
      payload.status === "refunded"
    ) {
      throw new Error(
        "Use the authorized payment verification workflow to complete or refund this payment.",
      );
    }

    const response =
      await plotPaymentsApi.update(
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
| Performs a soft delete.
|
*/

const remove = async (id) => {
  try {
    validateId(id);

    const response =
      await plotPaymentsApi.delete(id);

    return {
      data: normalizePlotPayment(
        extractRecord(response),
      ),

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

const search = async (
  searchTerm,
  filters = {},
) => {
  try {
    const term =
      normalizePlotPaymentSearch(searchTerm);

    const params =
      normalizePlotPaymentParams({
        ...filters,
        search: term || undefined,
      });

    const response =
      await plotPaymentsApi.search(params);

    return normalizePaginatedResponse(
      response,
      "Plot payment search completed successfully.",
    );
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
    const params =
      cleanPlotPaymentFilters(filters);

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
| PLOT PAYMENT REPORTS
|--------------------------------------------------------------------------
|
| GET /plot-payments/reports
|
*/

const getReports = async (filters = {}) => {
  try {
    const params =
      cleanPlotPaymentFilters(filters);

    const response =
      await plotPaymentsApi.getReports(params);

    return extractData(response) ?? {};
  } catch (error) {
    handleServiceError(
      error,
      "Failed to fetch plot payment reports.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| OUTSTANDING PLOT PAYMENTS
|--------------------------------------------------------------------------
|
| GET /plot-payments/outstanding
|
*/

const getOutstanding = async (params = {}) => {
  try {
    const query =
      normalizePlotPaymentParams(params);

    const response =
      await plotPaymentsApi.getOutstanding(query);

    return normalizePaginatedResponse(
      response,
      "Outstanding plot payments fetched successfully.",
    );
  } catch (error) {
    handleServiceError(
      error,
      "Failed to fetch outstanding plot payments.",
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

const getBySale = async (
  plotSaleId,
  params = {},
) => {
  try {
    validateId(
      plotSaleId,
      "Plot sale ID",
    );

    const response =
      await plotPaymentsApi.getBySale(
        plotSaleId,
        normalizePlotPaymentParams(params),
      );

    return normalizePaginatedResponse(
      response,
      "Plot sale payments fetched successfully.",
    );
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

const getByStatus = async (
  status,
  params = {},
) => {
  try {
    validateStatus(status);

    const response =
      await plotPaymentsApi.getByStatus(
        status,
        normalizePlotPaymentParams(params),
      );

    return normalizePaginatedResponse(
      response,
      "Plot payments fetched successfully.",
    );
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
| Ordinary status transitions only.
|
| Completed and refunded payments must use their
| authorized verification workflows.
|
*/

const updateStatus = async (
  id,
  statusData,
) => {
  try {
    validateId(id);

    const status =
      typeof statusData === "string"
        ? statusData
        : statusData?.status;

    validateStatus(status);

    if (
      status === "completed" ||
      status === "refunded"
    ) {
      throw new Error(
        "Use the authorized payment verification workflow to complete or refund this payment.",
      );
    }

    const response =
      await plotPaymentsApi.updateStatus(
        id,
        status,
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
| CONFIRM PAYMENT
|--------------------------------------------------------------------------
|
| POST /plot-payments/{id}/confirm
|
| Confirms payment through the authorized backend workflow.
|
| Expected payload:
| {
|   verification_reference: "CASH-EST-20261031-001",
|   verification_notes: "Cash received and verified."
| }
|
*/

const confirmPayment = async (
  id,
  verificationData = {},
) => {
  try {
    validateId(id);

    if (
      !verificationData ||
      typeof verificationData !== "object" ||
      Array.isArray(verificationData)
    ) {
      throw new Error(
        "Payment verification information is required.",
      );
    }

    const verificationReference =
      typeof verificationData.verification_reference === "string"
        ? verificationData.verification_reference.trim()
        : "";

    const verificationNotes =
      typeof verificationData.verification_notes === "string"
        ? verificationData.verification_notes.trim()
        : "";

    if (!verificationReference) {
      throw new Error(
        "A payment verification reference is required.",
      );
    }

    const payload = {
      verification_reference: verificationReference,
      ...(verificationNotes
        ? {
          verification_notes: verificationNotes,
        }
        : {}),
    };

    const response =
      await plotPaymentsApi.confirmPayment(
        id,
        payload,
      );

    const payment = normalizePlotPayment(
      extractRecord(response),
    );

    if (!payment) {
      throw new Error(
        "Payment confirmation succeeded but no payment record was returned.",
      );
    }

    return payment;
  } catch (error) {
    handleServiceError(
      error,
      "Failed to confirm plot payment.",
    );
  }
};

/*
|--------------------------------------------------------------------------
| RESTORE PAYMENT
|--------------------------------------------------------------------------
|
| PATCH /plot-payments/{id}/restore
|
*/

const restore = async (id) => {
  try {
    validateId(id);

    const response =
      await plotPaymentsApi.restore(id);

    return {
      data: normalizePlotPayment(
        extractRecord(response),
      ),

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
    validateId(id);

    const response =
      await plotPaymentsApi.forceDelete(id);

    return {
      data: normalizePlotPayment(
        extractRecord(response),
      ),

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
  const value =
    toPlotPaymentNumber(amount);

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
  if (!date) {
    return "—";
  }

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
export const formatPlotPaymentStatus = (
  status,
) => {
  if (!status) {
    return "Unknown";
  }

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
};

/**
 * Format payment type.
 */
export const formatPlotPaymentType = (type) => {
  if (!type) {
    return "Other";
  }

  const labels = {
    deposit: "Deposit",
    installment: "Installment",
    balance: "Balance",
    full_payment: "Full Payment",
    other: "Other",
  };

  return (
    labels[type] ||
    formatPlotPaymentStatus(type)
  );
};

/**
 * Format payment method.
 */
export const formatPlotPaymentMethod = (
  method,
) => {
  if (!method) {
    return "Other";
  }

  const labels = {
    mpesa: "M-Pesa",
    bank_transfer: "Bank Transfer",
    cash: "Cash",
    card: "Card",
    cheque: "Cheque",
    online: "Online",
    other: "Other",
  };

  return (
    labels[method] ||
    formatPlotPaymentStatus(method)
  );
};

/*
|--------------------------------------------------------------------------
| PAYMENT VALIDATION
|--------------------------------------------------------------------------
*/

export const validatePlotPayment = (
  payment = {},
) => {
  const errors = {};

  if (!payment.plot_sale_id) {
    errors.plot_sale_id =
      "Please select a plot sale.";
  }

  if (
    payment.amount === undefined ||
    payment.amount === null ||
    payment.amount === "" ||
    toPlotPaymentNumber(payment.amount) <= 0
  ) {
    errors.amount =
      "Enter a valid payment amount.";
  }

  if (
    payment.payment_type &&
    !PAYMENT_TYPES.includes(
      payment.payment_type,
    )
  ) {
    errors.payment_type =
      "Select a valid payment type.";
  }

  if (
    payment.payment_method &&
    !PAYMENT_METHODS.includes(
      payment.payment_method,
    )
  ) {
    errors.payment_method =
      "Select a valid payment method.";
  }

  if (
    payment.status &&
    !PAYMENT_STATUSES.includes(
      payment.status,
    )
  ) {
    errors.status =
      "Select a valid payment status.";
  }

  if (
    payment.payer_email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      payment.payer_email,
    )
  ) {
    errors.payer_email =
      "Enter a valid email address.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/*
|--------------------------------------------------------------------------
| PAYMENT CONFIRMATION VALIDATION
|--------------------------------------------------------------------------
*/

export const validatePlotPaymentConfirmation = (
  verificationData = {},
) => {
  const errors = {};

  if (
    !verificationData.verification_reference ||
    typeof verificationData.verification_reference !== "string" ||
    !verificationData.verification_reference.trim()
  ) {
    errors.verification_reference =
      "A payment verification reference is required.";
  }

  if (
    verificationData.verification_notes !== undefined &&
    typeof verificationData.verification_notes !== "string"
  ) {
    errors.verification_notes =
      "Verification notes must be valid text.";
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
  /*
  |--------------------------------------------------------------------------
  | CONSTANTS
  |--------------------------------------------------------------------------
  */

  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
  DEFAULT_CURRENCY,

  PAYMENT_STATUSES,
  PAYMENT_TYPES,
  PAYMENT_METHODS,

  /*
  |--------------------------------------------------------------------------
  | LIST AND DETAILS
  |--------------------------------------------------------------------------
  */

  getAll,
  getById,

  /*
  |--------------------------------------------------------------------------
  | CRUD
  |--------------------------------------------------------------------------
  */

  create,
  update,
  delete: remove,

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  search,

  /*
  |--------------------------------------------------------------------------
  | STATISTICS AND REPORTS
  |--------------------------------------------------------------------------
  */

  getStatistics,
  getReports,
  getOutstanding,

  /*
  |--------------------------------------------------------------------------
  | RELATED PAYMENTS
  |--------------------------------------------------------------------------
  */

  getBySale,
  getByStatus,

  /*
  |--------------------------------------------------------------------------
  | PAYMENT STATUS AND CONFIRMATION
  |--------------------------------------------------------------------------
  */

  updateStatus,
  confirmPayment,

  /*
  |--------------------------------------------------------------------------
  | RESTORE AND PERMANENT DELETE
  |--------------------------------------------------------------------------
  */

  restore,
  forceDelete,

  /*
  |--------------------------------------------------------------------------
  | RESPONSE HELPERS
  |--------------------------------------------------------------------------
  */

  extractData,
  extractCollection,
  extractRecord,
  extractPagination,
  extractLinks,
  extractMessage,

  /*
  |--------------------------------------------------------------------------
  | FILTER HELPERS
  |--------------------------------------------------------------------------
  */

  cleanFilters: cleanPlotPaymentFilters,
  normalizeParams: normalizePlotPaymentParams,
  normalizeSearch: normalizePlotPaymentSearch,

  /*
  |--------------------------------------------------------------------------
  | PAYMENT HELPERS
  |--------------------------------------------------------------------------
  */

  normalizePayment: normalizePlotPayment,
  normalizePayments: normalizePlotPayments,
  toNumber: toPlotPaymentNumber,

  /*
  |--------------------------------------------------------------------------
  | FORMATTING
  |--------------------------------------------------------------------------
  */

  formatAmount: formatPlotPaymentAmount,
  formatDate: formatPlotPaymentDate,
  formatStatus: formatPlotPaymentStatus,
  formatType: formatPlotPaymentType,
  formatMethod: formatPlotPaymentMethod,

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  validate: validatePlotPayment,
  validateConfirmation:
    validatePlotPaymentConfirmation,

  /*
  |--------------------------------------------------------------------------
  | ERROR HANDLING
  |--------------------------------------------------------------------------
  */

  getErrorMessage: getPlotPaymentErrorMessage,
};

export default plotPaymentService;
