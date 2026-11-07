import api from "./axios";

/*
|--------------------------------------------------------------------------
| API CONFIGURATION
|--------------------------------------------------------------------------
*/

const BASE_URL = "/plot-sales";
const DEFAULT_PER_PAGE = 15;

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Normalize the application's standard API response envelope.
 *
 * Expected structure:
 * {
 *   status, code, message, data, meta, links,
 *   errors, timestamp, request_id
 * }
 */
const normalizeResponse = (response) => {
  const payload = response?.data ?? response;

  return {
    status: payload?.status ?? "success",
    code: payload?.code ?? response?.status ?? null,
    message: payload?.message ?? "",
    data: payload?.data ?? null,
    meta: payload?.meta ?? null,
    links: payload?.links ?? null,
    errors: payload?.errors ?? null,
    timestamp: payload?.timestamp ?? null,
    request_id: payload?.request_id ?? null,
  };
};

/**
 * Execute a request and normalize its response.
 * Axios errors are allowed to propagate to the service layer.
 */
const request = async (promise) => {
  const response = await promise;
  return normalizeResponse(response);
};

/**
 * Remove empty parameters while preserving 0 and false.
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

/**
 * Validate a positive integer identifier.
 */
const validateId = (id, label = "ID") => {
  const normalizedId = Number(id);

  if (
    id === "" ||
    id === null ||
    id === undefined ||
    !Number.isSafeInteger(normalizedId) ||
    normalizedId <= 0
  ) {
    throw new Error(`${ label } must be a positive integer.`);
  }

  return normalizedId;
};

/**
 * Validate a sale status.
 */
const validateStatus = (status) => {
  const normalizedStatus = String(status ?? "").trim();

  if (!normalizedStatus) {
    throw new Error("A valid plot sale status is required.");
  }

  return normalizedStatus;
};

/**
 * Validate an object payload.
 */
const validateObject = (value, label = "Data") => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(`${ label } must be a valid object.`);
  }

  return value;
};

/**
 * Build standard pagination parameters.
 */
const buildPaginationParams = (params = {}) =>
  cleanParams({
    per_page: params.per_page ?? DEFAULT_PER_PAGE,
    page: params.page ?? 1,
  });

/*
|--------------------------------------------------------------------------
| LIST FILTERS
|--------------------------------------------------------------------------
*/

/**
 * Build plot sale list parameters.
 *
 * Confirm these filter names against your PlotSaleRequest,
 * PlotSaleService, and repository implementation.
 */
const buildListParams = (filters = {}) =>
  cleanParams({
    search: filters.search,
    plot_id: filters.plot_id,
    buyer_id: filters.buyer_id,
    agent_id: filters.agent_id,
    status: filters.status,
    payment_status: filters.payment_status,
    sale_type: filters.sale_type,
    currency: filters.currency,
    date_from: filters.date_from,
    date_to: filters.date_to,
    min_amount: filters.min_amount,
    max_amount: filters.max_amount,
    outstanding_only: filters.outstanding_only,
    per_page: filters.per_page ?? DEFAULT_PER_PAGE,
    page: filters.page ?? 1,
  });

/**
 * Build statistics filter parameters.
 */
const buildStatisticsParams = (filters = {}) =>
  cleanParams({
    plot_id: filters.plot_id,
    buyer_id: filters.buyer_id,
    agent_id: filters.agent_id,
    status: filters.status,
    payment_status: filters.payment_status,
    sale_type: filters.sale_type,
    currency: filters.currency,
    date_from: filters.date_from,
    date_to: filters.date_to,
    min_amount: filters.min_amount,
    max_amount: filters.max_amount,
    outstanding_only: filters.outstanding_only,
  });

/*
|--------------------------------------------------------------------------
| LIST AND SEARCH
|--------------------------------------------------------------------------
*/

/**
 * GET /plot-sales
 */
export const getPlotSales = (filters = {}) =>
  request(
    api.get(BASE_URL, {
      params: buildListParams(filters),
    }),
  );

/**
 * Alias for getPlotSales.
 */
export const fetchPlotSales = getPlotSales;

/**
 * GET /plot-sales?search=...
 */
export const searchPlotSales = (search, filters = {}) =>
  getPlotSales({
    ...filters,
    search: String(search ?? "").trim(),
    page: filters.page ?? 1,
  });

/**
 * GET /plot-sales/status/{status}
 */
export const getPlotSalesByStatus = (
  status,
  filters = {},
) => {
  const normalizedStatus = validateStatus(status);

  return request(
    api.get(
      `${ BASE_URL } /status/${ encodeURIComponent(normalizedStatus) } `,
      {
        params: buildPaginationParams(filters),
      },
    ),
  );
};

export const fetchPlotSalesByStatus =
  getPlotSalesByStatus;

/**
 * GET /plot-sales/plot/{plotId}
 */
export const getPlotSalesByPlot = (
  plotId,
  params = {},
) => {
  const id = validateId(plotId, "Plot ID");

  return request(
    api.get(`${ BASE_URL } /plot/${ id } `, {
      params: buildPaginationParams(params),
    }),
  );
};

/**
 * GET /plot-sales/buyer/{buyerId}
 */
export const getPlotSalesByBuyer = (
  buyerId,
  params = {},
) => {
  const id = validateId(buyerId, "Buyer ID");

  return request(
    api.get(`${ BASE_URL } /buyer/${ id } `, {
      params: buildPaginationParams(params),
    }),
  );
};

/*
|--------------------------------------------------------------------------
| SINGLE SALE
|--------------------------------------------------------------------------
*/

/**
 * GET /plot-sales/{id}
 */
export const getPlotSaleById = (id) => {
  const saleId = validateId(id, "Plot sale ID");

  return request(
    api.get(`${ BASE_URL }/${saleId}`),
  );
};

export const fetchPlotSaleById = getPlotSaleById;

/*
|--------------------------------------------------------------------------
| CREATE, UPDATE AND DELETE
|--------------------------------------------------------------------------
*/

/**
 * POST /plot-sales
 */
export const createPlotSale = (saleData) => {
  validateObject(saleData, "Plot sale data");

  return request(
    api.post(BASE_URL, saleData),
  );
};

/**
 * PUT /plot-sales/{id}
 */
export const updatePlotSale = (id, saleData) => {
  const saleId = validateId(id, "Plot sale ID");

  validateObject(saleData, "Plot sale update data");

  return request(
    api.put(`${BASE_URL}/${saleId}`, saleData),
  );
};

/**
 * DELETE /plot-sales/{id}
 */
export const deletePlotSale = (id) => {
  const saleId = validateId(id, "Plot sale ID");

  return request(
    api.delete(`${BASE_URL}/${saleId}`),
  );
};

/*
|--------------------------------------------------------------------------
| SALE WORKFLOW
|--------------------------------------------------------------------------
*/

/**
 * POST /plot-sales/{id}/approve
 *
 * Requires a matching Laravel route and controller action.
 */
export const approvePlotSale = (id) => {
  const saleId = validateId(id, "Plot sale ID");

  return request(
    api.post(`${BASE_URL}/${saleId}/approve`),
  );
};

/**
 * POST /plot-sales/{id}/cancel
 */
export const cancelPlotSale = (
  id,
  reason = null,
) => {
  const saleId = validateId(id, "Plot sale ID");

  return request(
    api.post(`${BASE_URL}/${saleId}/cancel`, {
      reason,
    }),
  );
};

/**
 * POST /plot-sales/{id}/complete
 */
export const completePlotSale = (id) => {
  const saleId = validateId(id, "Plot sale ID");

  return request(
    api.post(`${BASE_URL}/${saleId}/complete`),
  );
};

/*
|--------------------------------------------------------------------------
| OUTSTANDING SALES
|--------------------------------------------------------------------------
*/

/**
 * GET /plot-sales/outstanding
 */
export const getOutstandingPlotSales = (
  params = {},
) =>
  request(
    api.get(`${BASE_URL}/outstanding`, {
      params: buildPaginationParams(params),
    }),
  );

export const fetchOutstandingPlotSales =
  getOutstandingPlotSales;

/*
|--------------------------------------------------------------------------
| STATISTICS AND REPORTS
|--------------------------------------------------------------------------
*/

/**
 * GET /plot-sales/statistics
 */
export const getPlotSalesStatistics = (
  filters = {},
) =>
  request(
    api.get(`${BASE_URL}/statistics`, {
      params: buildStatisticsParams(filters),
    }),
  );

export const fetchPlotSalesStatistics =
  getPlotSalesStatistics;

/**
 * GET /plot-sales/reports
 */
export const getPlotSalesReport = (
  filters = {},
) =>
  request(
    api.get(`${BASE_URL}/reports`, {
      params: buildListParams(filters),
    }),
  );

export const fetchPlotSalesReport =
  getPlotSalesReport;

/*
|--------------------------------------------------------------------------
| SOFT-DELETED SALES
|--------------------------------------------------------------------------
*/

/**
 * POST /plot-sales/{id}/restore
 */
export const restorePlotSale = (id) => {
  const saleId = validateId(id, "Plot sale ID");

  return request(
    api.post(`${BASE_URL}/${saleId}/restore`),
  );
};

/**
 * DELETE /plot-sales/{id}/force
 */
export const forceDeletePlotSale = (id) => {
  const saleId = validateId(id, "Plot sale ID");

  return request(
    api.delete(`${BASE_URL}/${saleId}/force`),
  );
};

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

const plotSalesApi = {
  // List and search
  getPlotSales,
  fetchPlotSales,
  searchPlotSales,
  getPlotSalesByStatus,
  fetchPlotSalesByStatus,
  getPlotSalesByPlot,
  getPlotSalesByBuyer,

  // Single sale
  getPlotSaleById,
  fetchPlotSaleById,

  // CRUD
  createPlotSale,
  updatePlotSale,
  deletePlotSale,

  // Workflow
  approvePlotSale,
  cancelPlotSale,
  completePlotSale,

  // Outstanding sales
  getOutstandingPlotSales,
  fetchOutstandingPlotSales,

  // Statistics and reports
  getPlotSalesStatistics,
  fetchPlotSalesStatistics,
  getPlotSalesReport,
  fetchPlotSalesReport,

  // Soft-deleted sales
  restorePlotSale,
  forceDeletePlotSale,
};

export default plotSalesApi;
