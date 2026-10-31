
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
| QUERY PARAMETER HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Remove empty query parameters while preserving valid values such as:
 * 0, false, and numeric values.
 */
const cleanParams = (params = {}) => {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "",
    ),
  );
};

/**
 * Normalize pagination parameters.
 */
const normalizePagination = (params = {}) => {
  const perPage = Number(params.per_page);

  return cleanParams({
    ...params,
    per_page:
      Number.isFinite(perPage) && perPage > 0
        ? Math.min(perPage, MAX_PER_PAGE)
        : DEFAULT_PER_PAGE,
  });
};

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Extract the API response payload.
 *
 * Standard response:
 * {
 *   status: true,
 *   code: 200,
 *   message: "...",
 *   data: {},
 *   meta: {},
 *   links: {},
 *   errors: null
 * }
 */
const getResponseData = (response) => {
  return response?.data?.data ?? response?.data ?? null;
};

/**
 * Extract paginated response information.
 */
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
| PLOT PAYMENTS API
|--------------------------------------------------------------------------
*/

const plotPaymentsApi = {
  /*
  |--------------------------------------------------------------------------
  | GET ALL PAYMENTS
  |--------------------------------------------------------------------------
  |
  | GET /api/plot-payments
  |
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
  |
  | GET /api/plot-payments/{id}
  |
  */

  getById: async (id) => {
    if (!id) {
      throw new Error("Plot payment ID is required.");
    }

    const response = await api.get(
      `${BASE_URL}/${id}`,
    );

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE PAYMENT
  |--------------------------------------------------------------------------
  |
  | POST /api/plot-payments
  |
  */

  create: async (paymentData) => {
    if (!paymentData || typeof paymentData !== "object") {
      throw new Error(
        "Valid plot payment data is required.",
      );
    }

    const response = await api.post(
      BASE_URL,
      cleanParams(paymentData),
    );

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE PAYMENT
  |--------------------------------------------------------------------------
  |
  | PUT /api/plot-payments/{id}
  |
  */

  update: async (id, paymentData) => {
    if (!id) {
      throw new Error("Plot payment ID is required.");
    }

    if (
      !paymentData ||
      typeof paymentData !== "object"
    ) {
      throw new Error(
        "Valid plot payment data is required.",
      );
    }

    const response = await api.put(
      `${BASE_URL}/${id}`,
      cleanParams(paymentData),
    );

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | PARTIAL UPDATE PAYMENT
  |--------------------------------------------------------------------------
  |
  | PATCH /api/plot-payments/{id}
  |
  */

  patch: async (id, paymentData) => {
    if (!id) {
      throw new Error("Plot payment ID is required.");
    }

    if (
      !paymentData ||
      typeof paymentData !== "object"
    ) {
      throw new Error(
        "Valid plot payment data is required.",
      );
    }

    const response = await api.patch(
      `${BASE_URL}/${id}`,
      cleanParams(paymentData),
    );

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | DELETE PAYMENT
  |--------------------------------------------------------------------------
  |
  | DELETE /api/plot-payments/{id}
  |
  | Performs a soft delete.
  |
  */

  delete: async (id) => {
    if (!id) {
      throw new Error("Plot payment ID is required.");
    }

    const response = await api.delete(
      `${BASE_URL}/${id}`,
    );

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | SEARCH AND FILTER PAYMENTS
  |--------------------------------------------------------------------------
  |
  | GET /api/plot-payments/search
  |
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
  |
  | GET /api/plot-payments/statistics
  |
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
  | GET PAYMENTS BY PLOT SALE
  |--------------------------------------------------------------------------
  |
  | GET /api/plot-payments/sale/{plotSaleId}
  |
  */

  getBySale: async (
    plotSaleId,
    params = {},
  ) => {
    if (!plotSaleId) {
      throw new Error(
        "Plot sale ID is required.",
      );
    }

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
  |
  | GET /api/plot-payments/status/{status}
  |
  */

  getByStatus: async (
    status,
    params = {},
  ) => {
    if (!status) {
      throw new Error(
        "Payment status is required.",
      );
    }

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
  |
  | PATCH /api/plot-payments/{id}/status
  |
  | Supported statuses:
  | pending, completed, failed, cancelled, refunded
  |
  | Backend verification rules still apply.
  |
  */

  updateStatus: async (id, status) => {
    if (!id) {
      throw new Error("Plot payment ID is required.");
    }

    if (!status) {
      throw new Error(
        "Payment status is required.",
      );
    }

    const response = await api.patch(
      `${BASE_URL}/${id}/status`,
      {
        status,
      },
    );

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | RESTORE DELETED PAYMENT
  |--------------------------------------------------------------------------
  |
  | POST /api/plot-payments/{id}/restore
  |
  */

  restore: async (id) => {
    if (!id) {
      throw new Error("Plot payment ID is required.");
    }

    const response = await api.post(
      `${BASE_URL}/${id}/restore`,
    );

    return getResponseData(response);
  },

  /*
  |--------------------------------------------------------------------------
  | PERMANENTLY DELETE PAYMENT
  |--------------------------------------------------------------------------
  |
  | DELETE /api/plot-payments/{id}/force
  |
  */

  forceDelete: async (id) => {
    if (!id) {
      throw new Error("Plot payment ID is required.");
    }

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
