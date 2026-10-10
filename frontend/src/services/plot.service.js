
import plotApi from "../api/plot.api";

/*
|--------------------------------------------------------------------------
| EstateKenya - Plot Service
|--------------------------------------------------------------------------
|
| Responsibilities:
| - Communicate with plot.api.js
| - Normalize Laravel API responses
| - Extract plot records and pagination metadata
| - Handle plot CRUD operations
| - Search and filter plots
| - Retrieve statistics and reports
| - Manage plot status and availability
| - Restore and permanently delete plots
|
*/

/*
|--------------------------------------------------------------------------
| Debug Configuration
|--------------------------------------------------------------------------
*/

const DEBUG_PLOT_SERVICE = import.meta.env.DEV;

const logDebug = (...args) => {
  if (DEBUG_PLOT_SERVICE) {
    console.log("[PlotService]", ...args);
  }
};

const logError = (...args) => {
  if (DEBUG_PLOT_SERVICE) {
    console.error("[PlotService]", ...args);
  }
};

/*
|--------------------------------------------------------------------------
| Error Helpers
|--------------------------------------------------------------------------
*/

/**
 * Extract a readable error message from Axios or service errors.
 */
const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

/**
 * Extract Laravel validation errors.
 */
const getValidationErrors = (error) => {
  return (
    error?.response?.data?.errors ||
    error?.errors ||
    {}
  );
};

/**
 * Run a service operation with consistent logging.
 */
const execute = async (operation, callback) => {
  logDebug(`${operation}: started`);

  try {
    const result = await callback();

    logDebug(`${operation}: completed`);

    return result;
  } catch (error) {
    logError(`${operation}: failed`, {
      message: getErrorMessage(error),
      status: error?.response?.status,
      errors: getValidationErrors(error),
    });

    throw error;
  }
};

/*
|--------------------------------------------------------------------------
| Response Normalization
|--------------------------------------------------------------------------
*/

/**
 * Unwrap the API envelope returned by plot.api.js.
 *
 * Expected:
 * {
 *   status: true,
 *   code: 200,
 *   message: "...",
 *   data: ...
 * }
 *
 * Important:
 * plot.api.js already unwraps Axios's response.data.
 * Do not unwrap Axios a second time here.
 */
const normalizeResponse = (response) => {
  if (response == null) {
    return {
      status: false,
      message: "No response received from the plot API.",
      data: null,
      meta: null,
      links: null,
    };
  }

  return {
    status: response.status ?? true,
    code: response.code ?? null,
    message: response.message ?? "",
    data: response.data ?? null,
    meta: response.meta ?? null,
    links: response.links ?? null,
    errors: response.errors ?? null,
  };
};

/**
 * Extract plot arrays from common Laravel response shapes.
 */
const extractPlots = (response) => {
  const normalized = normalizeResponse(response);
  const data = normalized.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.plots)) {
    return data.plots;
  }

  return [];
};

/**
 * Extract one plot from a response.
 */
const extractPlot = (response) => {
  const normalized = normalizeResponse(response);
  const data = normalized.data;

  if (data == null) {
    return null;
  }

  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  if (data.plot && typeof data.plot === "object") {
    return data.plot;
  }

  if (
    data.data &&
    !Array.isArray(data.data) &&
    typeof data.data === "object"
  ) {
    return data.data;
  }

  return data;
};

/**
 * Normalize pagination metadata.
 */
const extractPagination = (
  response,
  defaults = {}
) => {
  const normalized = normalizeResponse(response);

  const meta =
    normalized.meta ??
    normalized.data?.meta ??
    normalized.data?.pagination ??
    {};

  const currentPage = Number(
    meta.current_page ??
    meta.currentPage ??
    defaults.page ??
    1
  );

  const perPage = Number(
    meta.per_page ??
    meta.perPage ??
    defaults.per_page ??
    15
  );

  const total = Number(
    meta.total ??
    meta.total_items ??
    meta.totalItems ??
    0
  );

  const lastPage = Number(
    meta.last_page ??
    meta.lastPage ??
    (perPage > 0 ? Math.ceil(total / perPage) : 1)
  );

  return {
    current_page: currentPage,
    last_page: Math.max(1, lastPage || 1),
    per_page: perPage,
    total,
    from: meta.from ?? null,
    to: meta.to ?? null,
    links: normalized.links,
  };
};

/**
 * Normalize a paginated plot response.
 */
const normalizePlotCollection = (
  response,
  defaults = {}
) => {
  return {
    ...normalizeResponse(response),
    data: extractPlots(response),
    meta: extractPagination(response, defaults),
  };
};

/*
|--------------------------------------------------------------------------
| Plot Listing
|--------------------------------------------------------------------------
*/

/**
 * Retrieve paginated plots.
 *
 * GET /api/plots
 */
const getPlots = (params = {}) =>
  execute("Get plots", async () => {
    const response = await plotApi.getAll(params);

    return normalizePlotCollection(response, params);
  });

/**
 * Retrieve one plot.
 *
 * GET /api/plots/{id}
 */
const getPlotById = (id) =>
  execute("Get plot details", async () => {
    const response = await plotApi.getById(id);

    return {
      ...normalizeResponse(response),
      data: extractPlot(response),
    };
  });

/*
|--------------------------------------------------------------------------
| Plot Creation
|--------------------------------------------------------------------------
*/

/**
 * Create a plot.
 *
 * POST /api/plots
 */
const createPlot = (payload) =>
  execute("Create plot", async () => {
    const response = await plotApi.create(payload);

    return {
      ...normalizeResponse(response),
      data: extractPlot(response),
    };
  });

/*
|--------------------------------------------------------------------------
| Plot Updates
|--------------------------------------------------------------------------
*/

/**
 * Update a complete plot record.
 *
 * PUT /api/plots/{id}
 */
const updatePlot = (id, payload) =>
  execute("Update plot", async () => {
    const response = await plotApi.update(id, payload);

    return {
      ...normalizeResponse(response),
      data: extractPlot(response),
    };
  });

/**
 * Partially update a plot.
 *
 * PATCH /api/plots/{id}
 */
const patchPlot = (id, payload) =>
  execute("Partially update plot", async () => {
    const response = await plotApi.patch(id, payload);

    return {
      ...normalizeResponse(response),
      data: extractPlot(response),
    };
  });

/*
|--------------------------------------------------------------------------
| Plot Deletion
|--------------------------------------------------------------------------
*/

/**
 * Soft-delete a plot.
 *
 * DELETE /api/plots/{id}
 */
const deletePlot = (id) =>
  execute("Delete plot", async () => {
    const response = await plotApi.delete(id);

    return normalizeResponse(response);
  });

/**
 * Restore a soft-deleted plot.
 *
 * POST /api/plots/{id}/restore
 */
const restorePlot = (id) =>
  execute("Restore plot", async () => {
    const response = await plotApi.restore(id);

    return {
      ...normalizeResponse(response),
      data: extractPlot(response),
    };
  });

/**
 * Permanently delete a plot.
 *
 * DELETE /api/plots/{id}/force
 */
const forceDeletePlot = (id) =>
  execute("Permanently delete plot", async () => {
    const response = await plotApi.forceDelete(id);

    return normalizeResponse(response);
  });

/*
|--------------------------------------------------------------------------
| Plot Search
|--------------------------------------------------------------------------
*/

/**
 * Search plots.
 *
 * GET /api/plots/search
 */
const searchPlots = (searchTerm, params = {}) =>
  execute("Search plots", async () => {
    const response = await plotApi.search(
      searchTerm,
      params
    );

    return normalizePlotCollection(response, params);
  });

/*
|--------------------------------------------------------------------------
| Available Plots
|--------------------------------------------------------------------------
*/

/**
 * Retrieve available plots.
 *
 * GET /api/plots/available
 */
const getAvailablePlots = (params = {}) =>
  execute("Get available plots", async () => {
    const response = await plotApi.getAvailable(params);

    return normalizePlotCollection(response, params);
  });

/**
 * Check a plot's availability.
 *
 * GET /api/plots/{id}/availability
 */
const checkPlotAvailability = (id) =>
  execute("Check plot availability", async () => {
    const response = await plotApi.checkAvailability(id);

    return normalizeResponse(response);
  });

/*
|--------------------------------------------------------------------------
| Status Operations
|--------------------------------------------------------------------------
*/

/**
 * Retrieve plots by status.
 *
 * GET /api/plots/status/{status}
 */
const getPlotsByStatus = (status, params = {}) =>
  execute("Get plots by status", async () => {
    const response = await plotApi.getByStatus(
      status,
      params
    );

    return normalizePlotCollection(response, params);
  });

/**
 * Change a plot's status.
 *
 * PATCH /api/plots/{id}/status
 */
const updatePlotStatus = (id, status) =>
  execute("Update plot status", async () => {
    const response = await plotApi.updateStatus(id, status);

    return {
      ...normalizeResponse(response),
      data: extractPlot(response),
    };
  });

/*
|--------------------------------------------------------------------------
| Location Filters
|--------------------------------------------------------------------------
*/

/**
 * Retrieve plots by county.
 *
 * GET /api/plots/county/{countyId}
 */
const getPlotsByCounty = (countyId, params = {}) =>
  execute("Get plots by county", async () => {
    const response = await plotApi.getByCounty(
      countyId,
      params
    );

    return normalizePlotCollection(response, params);
  });

/**
 * Retrieve plots by city.
 *
 * GET /api/plots/city/{cityId}
 */
const getPlotsByCity = (cityId, params = {}) =>
  execute("Get plots by city", async () => {
    const response = await plotApi.getByCity(
      cityId,
      params
    );

    return normalizePlotCollection(response, params);
  });

/**
 * Retrieve plots by area.
 *
 * GET /api/plots/area/{areaId}
 */
const getPlotsByArea = (areaId, params = {}) =>
  execute("Get plots by area", async () => {
    const response = await plotApi.getByArea(
      areaId,
      params
    );

    return normalizePlotCollection(response, params);
  });

/*
|--------------------------------------------------------------------------
| Statistics
|--------------------------------------------------------------------------
*/

const getStatistics = (params = {}) =>
  execute("Get plot statistics", async () => {
    const response = await plotApi.getStatistics(params);

    return normalizeResponse(response);
  });

const getInventoryStatistics = (params = {}) =>
  execute("Get inventory statistics", async () => {
    const response =
      await plotApi.getInventoryStatistics(params);

    return normalizeResponse(response);
  });

const getSalesStatistics = (params = {}) =>
  execute("Get sales statistics", async () => {
    const response =
      await plotApi.getSalesStatistics(params);

    return normalizeResponse(response);
  });

const getPaymentStatistics = (params = {}) =>
  execute("Get payment statistics", async () => {
    const response =
      await plotApi.getPaymentStatistics(params);

    return normalizeResponse(response);
  });

const getLocationStatistics = (params = {}) =>
  execute("Get location statistics", async () => {
    const response =
      await plotApi.getLocationStatistics(params);

    return normalizeResponse(response);
  });

/*
|--------------------------------------------------------------------------
| Reports
|--------------------------------------------------------------------------
*/

const getInventoryReport = (params = {}) =>
  execute("Get inventory report", async () => {
    const response =
      await plotApi.getInventoryReport(params);

    return normalizePlotCollection(response, params);
  });

const getSalesReport = (params = {}) =>
  execute("Get sales report", async () => {
    const response = await plotApi.getSalesReport(params);

    return normalizePlotCollection(response, params);
  });

const getPaymentReport = (params = {}) =>
  execute("Get payment report", async () => {
    const response =
      await plotApi.getPaymentReport(params);

    return normalizePlotCollection(response, params);
  });

const getOutstandingReport = (params = {}) =>
  execute("Get outstanding report", async () => {
    const response =
      await plotApi.getOutstandingReport(params);

    return normalizePlotCollection(response, params);
  });

const getAgentReport = (params = {}) =>
  execute("Get agent report", async () => {
    const response = await plotApi.getAgentReport(params);

    return normalizePlotCollection(response, params);
  });

const getLocationReport = (params = {}) =>
  execute("Get location report", async () => {
    const response =
      await plotApi.getLocationReport(params);

    return normalizePlotCollection(response, params);
  });

/*
|--------------------------------------------------------------------------
| Service Export
|--------------------------------------------------------------------------
*/

const plotService = {
  // Response helpers
  normalizeResponse,
  normalizePlotCollection,
  extractPlots,
  extractPlot,
  extractPagination,
  getErrorMessage,
  getValidationErrors,

  // CRUD
  getPlots,
  getPlotById,
  createPlot,
  updatePlot,
  patchPlot,
  deletePlot,
  restorePlot,
  forceDeletePlot,

  // Search and availability
  searchPlots,
  getAvailablePlots,
  checkPlotAvailability,

  // Status
  getPlotsByStatus,
  updatePlotStatus,

  // Location
  getPlotsByCounty,
  getPlotsByCity,
  getPlotsByArea,

  // Statistics
  getStatistics,
  getInventoryStatistics,
  getSalesStatistics,
  getPaymentStatistics,
  getLocationStatistics,

  // Reports
  getInventoryReport,
  getSalesReport,
  getPaymentReport,
  getOutstandingReport,
  getAgentReport,
  getLocationReport,
};

export default plotService;
