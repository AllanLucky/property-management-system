
import api from "./axios";

/*
|--------------------------------------------------------------------------
| API CONFIGURATION
|--------------------------------------------------------------------------
*/

const BASE_URL = "/plot-payments";

const DEFAULT_PER_PAGE = 15;
const MAX_PER_PAGE = 100;

/*
|--------------------------------------------------------------------------
| SUPPORTED PAYMENT STATUSES
|--------------------------------------------------------------------------
*/

export const PLOT_PAYMENT_STATUSES = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
};

/*
|--------------------------------------------------------------------------
| QUERY PARAMETER HELPERS
|--------------------------------------------------------------------------
*/

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "",
    ),
  );

const normalizePagination = (params = {}) => {
  const perPage = Number(params.per_page);

  return cleanParams({
    ...params,
    per_page:
      Number.isFinite(perPage) && perPage > 0
        ? Math.min(Math.floor(perPage), MAX_PER_PAGE)
        : DEFAULT_PER_PAGE,
  });
};

const validateId = (id) => {
  if (
    id === undefined ||
    id === null ||
    id === "" ||
    !Number.isFinite(Number(id)) ||
    Number(id) <= 0
  ) {
    throw new Error("A valid plot payment ID is required.");
  }

  return id;
};

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

const getResponseData = (response) =>
  response?.data?.data ?? response?.data ?? null;

const getPaginatedResponse = (response) => {
  const payload = response?.data ?? {};

  return {
    data: Array.isArray(payload?.data)
      ? payload.data
      : [],

    meta: payload?.meta ?? {
      current_page: 1,
      last_page: 1,
      per_page: DEFAULT_PER_PAGE,
      total: 0,
      from: null,
      to: null,
      has_more_pages: false,
    },

    links: payload?.links ?? {
      first: null,
      last: null,
      prev: null,
      next: null,
    },

    message:
      payload?.message ??
      "Plot payments retrieved successfully.",

    status: payload?.status ?? true,
  };
};

/*
|--------------------------------------------------------------------------
| VALIDATION HELPERS
|--------------------------------------------------------------------------
*/

const validatePaymentData = (paymentData) => {
  if (
    !paymentData ||
    typeof paymentData !== "object" ||
    Array.isArray(paymentData)
  ) {
    throw new Error("Valid plot payment data is required.");
  }

  return cleanParams(paymentData);
};

const validateStatus = (status) => {
  const allowedStatuses = Object.values(
    PLOT_PAYMENT_STATUSES,
  );

  if (!allowedStatuses.includes(status)) {
    throw new Error(
      `Invalid payment status. Allowed statuses: ${allowedStatuses.join(", ")}.`,
    );
  }

  return status;
};

const validateVerificationData = (verificationData = {}) => {
  if (
    !verificationData ||
    typeof verificationData !== "object" ||
    Array.isArray(verificationData)
  ) {
    throw new Error("Valid payment verification data is required.");
  }

  const reference =
    typeof verificationData.verification_reference === "string"
      ? verificationData.verification_reference.trim()
      : "";

  if (!reference) {
    throw new Error(
      "A payment verification reference is required.",
    );
  }

  return {
    verification_reference: reference,
    verification_notes:
      typeof verificationData.verification_notes === "string"
        ? verificationData.verification_notes.trim() || null
        : null,
  };
};

/*
|--------------------------------------------------------------------------
| CONFIRM PAYMENT REQUEST
|--------------------------------------------------------------------------
*/

const confirmPaymentRequest = async (id, verificationData = {}) => {
  validateId(id);

  const payload = validateVerificationData(verificationData);

  const response = await api.post(
    `${BASE_URL}/${id}/confirm`,
    payload,
  );

  return getResponseData(response);
};

/*
|--------------------------------------------------------------------------
| PLOT PAYMENTS API
|--------------------------------------------------------------------------
*/

const plotPaymentsApi = {
  /*
  |--------------------------------------------------------------------------
  | GET ALL PAYMENTS
  |--------------------------------------------------------------------------
  | GET /api/plot-payments
  */

  getAll: async (params = {}) => {
    const response = await api.get(BASE_URL, {
      params: normalizePagination(params),
    });

    return getPaginatedResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | GET SINGLE PAYMENT
  |--------------------------------------------------------------------------
  | GET /api/plot-payments/{id}
  */

  getById: async (id) => {
    validateId(id);

    const response = await api.get(`${BASE_URL}/${id}`);

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE PAYMENT
  |--------------------------------------------------------------------------
  | POST /api/plot-payments
  */

  create: async (paymentData) => {
    const payload = validatePaymentData(paymentData);

    const response = await api.post(BASE_URL, payload);

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE PAYMENT
  |--------------------------------------------------------------------------
  | PUT /api/plot-payments/{id}
  |
  | General payment details only.
  | Do not use this method to complete or refund payments.
  */

  update: async (id, paymentData) => {
    validateId(id);

    const payload = validatePaymentData(paymentData);

    if (
      payload.status === PLOT_PAYMENT_STATUSES.COMPLETED ||
      payload.status === PLOT_PAYMENT_STATUSES.REFUNDED
    ) {
      throw new Error(
        "Use the authorized payment verification workflow to complete or refund this payment.",
      );
    }

    const response = await api.put(
      `${BASE_URL}/${id}`,
      payload,
    );

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | PARTIAL UPDATE PAYMENT
  |--------------------------------------------------------------------------
  | PATCH /api/plot-payments/{id}
  */

  patch: async (id, paymentData) => {
    validateId(id);

    const payload = validatePaymentData(paymentData);

    if (
      payload.status === PLOT_PAYMENT_STATUSES.COMPLETED ||
      payload.status === PLOT_PAYMENT_STATUSES.REFUNDED
    ) {
      throw new Error(
        "Use the authorized payment verification workflow to complete or refund this payment.",
      );
    }

    const response = await api.patch(
      `${BASE_URL}/${id}`,
      payload,
    );

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | DELETE PAYMENT
  |--------------------------------------------------------------------------
  | DELETE /api/plot-payments/{id}
  |
  | Performs a soft delete.
  */

  delete: async (id) => {
    validateId(id);

    const response = await api.delete(`${BASE_URL}/${id}`);

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | SEARCH AND FILTER PAYMENTS
  |--------------------------------------------------------------------------
  | GET /api/plot-payments/search
  */

  search: async (params = {}) => {
    const response = await api.get(
      `${BASE_URL}/search`,
      {
        params: normalizePagination(params),
      },
    );

    return getPaginatedResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | PAYMENT STATISTICS
  |--------------------------------------------------------------------------
  | GET /api/plot-payments/statistics
  */

  getStatistics: async (params = {}) => {
    const response = await api.get(
      `${BASE_URL}/statistics`,
      {
        params: cleanParams(params),
      },
    );

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | PAYMENT REPORTS
  |--------------------------------------------------------------------------
  | GET /api/plot-payments/reports
  */

  getReports: async (params = {}) => {
    const response = await api.get(
      `${BASE_URL}/reports`,
      {
        params: cleanParams(params),
      },
    );

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | OUTSTANDING PAYMENTS
  |--------------------------------------------------------------------------
  | GET /api/plot-payments/outstanding
  */

  getOutstanding: async (params = {}) => {
    const response = await api.get(
      `${BASE_URL}/outstanding`,
      {
        params: normalizePagination(params),
      },
    );

    return getPaginatedResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | GET PAYMENTS BY PLOT SALE
  |--------------------------------------------------------------------------
  | GET /api/plot-payments/sale/{plotSaleId}
  */

  getBySale: async (plotSaleId, params = {}) => {
    validateId(plotSaleId);

    const response = await api.get(
      `${BASE_URL}/sale/${plotSaleId}`,
      {
        params: normalizePagination(params),
      },
    );

    return getPaginatedResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | GET PAYMENTS BY STATUS
  |--------------------------------------------------------------------------
  | GET /api/plot-payments/status/{status}
  */

  getByStatus: async (status, params = {}) => {
    validateStatus(status);

    const response = await api.get(
      `${BASE_URL}/status/${status}`,
      {
        params: normalizePagination(params),
      },
    );

    return getPaginatedResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE PAYMENT STATUS
  |--------------------------------------------------------------------------
  | PATCH /api/plot-payments/{id}/status
  |
  | Ordinary status transitions only.
  | Completion and refund require authorized workflows.
  */

  updateStatus: async (id, status) => {
    validateId(id);
    validateStatus(status);

    if (
      status === PLOT_PAYMENT_STATUSES.COMPLETED ||
      status === PLOT_PAYMENT_STATUSES.REFUNDED
    ) {
      throw new Error(
        "Use the authorized payment verification workflow to complete or refund this payment.",
      );
    }

    const response = await api.patch(
      `${BASE_URL}/${id}/status`,
      { status },
    );

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | CONFIRM PAYMENT
  |--------------------------------------------------------------------------
  | POST /api/plot-payments/{id}/confirm
  |
  | Used by an authorized user to confirm actual payment receipt.
  |
  | Example payload:
  | {
  |   verification_reference: "CASH-EST-20261031-001",
  |   verification_notes: "Cash received and verified."
  | }
  */

  confirm: confirmPaymentRequest,

  /*
  |--------------------------------------------------------------------------
  | BACKWARD-COMPATIBLE CONFIRMATION METHOD
  |--------------------------------------------------------------------------
  |
  | Retained for existing components using confirmPayment().
  */

  confirmPayment: confirmPaymentRequest,

  /*
  |--------------------------------------------------------------------------
  | RESTORE DELETED PAYMENT
  |--------------------------------------------------------------------------
  | PATCH /api/plot-payments/{id}/restore
  */

  restore: async (id) => {
    validateId(id);

    const response = await api.patch(
      `${BASE_URL}/${id}/restore`,
    );

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | PERMANENTLY DELETE PAYMENT
  |--------------------------------------------------------------------------
  | DELETE /api/plot-payments/{id}/force
  */

  forceDelete: async (id) => {
    validateId(id);

    const response = await api.delete(
      `${BASE_URL}/${id}/force`,
    );

    return getResponseData(response);
  },
};

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export default plotPaymentsApi;
