
import api from "./axios";


const BASE_URL = "/plots";
const DEBUG_PLOT_API = import.meta.env.DEV;

/*
|--------------------------------------------------------------------------
| Debug Logger
|--------------------------------------------------------------------------
*/

const logDebug = (...args) => {
  if (DEBUG_PLOT_API) {
    console.log("[PlotAPI]", ...args);
  }
};

const logError = (...args) => {
  if (DEBUG_PLOT_API) {
    console.error("[PlotAPI]", ...args);
  }
};

/*
|--------------------------------------------------------------------------
| Response Helpers
|--------------------------------------------------------------------------
*/

/**
 * Preserve the Laravel response envelope:
 * { status, code, message, data, meta, links, errors }
 */
const unwrapResponse = (response) => {
  const body = response?.data;

  if (!body || typeof body !== "object") {
    throw new Error("Invalid response received from the plot API.");
  }

  if (body.status === false) {
    const error = new Error(
      body.message || "The plot request failed."
    );

    error.code = body.code;
    error.errors = body.errors ?? null;

    throw error;
  }

  return body;
};

/**
 * Execute requests consistently.
 *
 * Returns the Laravel response envelope, not the raw Axios response.
 */
const request = async (label, callback) => {
  logDebug(`${label}: started`);

  try {
    const response = await callback();
    const result = unwrapResponse(response);

    logDebug(`${label}: success`, {
      code: result.code,
      message: result.message,
    });

    return result;
  } catch (error) {
    logError(`${label}: failed`, {
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Unknown API error",
      status: error?.response?.status,
      errors: error?.response?.data?.errors,
    });

    throw error;
  }
};

/*
|--------------------------------------------------------------------------
| Query Parameter Helpers
|--------------------------------------------------------------------------
*/

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false;
      }

      if (typeof value === "string" && value.trim() === "") {
        return false;
      }

      return true;
    })
  );

const buildParams = (params = {}) => cleanParams(params);

/*
|--------------------------------------------------------------------------
| Standard CRUD Endpoints
|--------------------------------------------------------------------------
*/

/**
 * GET /api/plots
 */
const getAll = (params = {}) =>
  request("Get plots", () =>
    api.get(BASE_URL, {
      params: buildParams(params),
    })
  );

/**
 * GET /api/plots/{id}
 */
const getById = (id) => {
  if (!id) {
    throw new Error("A plot ID is required.");
  }

  return request("Get plot details", () =>
    api.get(`${BASE_URL}/${id}`)
  );
};

/**
 * POST /api/plots
 */
const create = (payload) =>
  request("Create plot", () =>
    api.post(BASE_URL, payload)
  );

/**
 * PUT /api/plots/{id}
 */
const update = (id, payload) => {
  if (!id) {
    throw new Error("A plot ID is required for updating.");
  }

  return request("Update plot", () =>
    api.put(`${BASE_URL}/${id}`, payload)
  );
};

/**
 * PATCH /api/plots/{id}
 */
const patch = (id, payload) => {
  if (!id) {
    throw new Error("A plot ID is required for updating.");
  }

  return request("Partially update plot", () =>
    api.patch(`${BASE_URL}/${id}`, payload)
  );
};

/**
 * DELETE /api/plots/{id}
 */
const remove = (id) => {
  if (!id) {
    throw new Error("A plot ID is required for deletion.");
  }

  return request("Delete plot", () =>
    api.delete(`${BASE_URL}/${id}`)
  );
};

/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
*/

/**
 * GET /api/plots/search?search=athi
 */
const search = (searchTerm, params = {}) => {
  const term = String(searchTerm ?? "").trim();

  if (!term) {
    throw new Error("Enter a search term to search plots.");
  }

  return request("Search plots", () =>
    api.get(`${BASE_URL}/search`, {
      params: buildParams({
        ...params,
        search: term,
      }),
    })
  );
};

/*
|--------------------------------------------------------------------------
| Availability
|--------------------------------------------------------------------------
*/

/**
 * GET /api/plots/available
 */
const getAvailable = (params = {}) =>
  request("Get available plots", () =>
    api.get(`${BASE_URL}/available`, {
      params: buildParams(params),
    })
  );

/**
 * GET /api/plots/{id}/availability
 *
 * Optional params can include dates if supported by your backend.
 */
const checkAvailability = (id, params = {}) => {
  if (!id) {
    throw new Error("A plot ID is required.");
  }

  return request("Check plot availability", () =>
    api.get(`${BASE_URL}/${id}/availability`, {
      params: buildParams(params),
    })
  );
};

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

/**
 * GET /api/plots/status/{status}
 */
const getByStatus = (status, params = {}) => {
  if (!status) {
    throw new Error("A plot status is required.");
  }

  return request("Get plots by status", () =>
    api.get(
      `${BASE_URL}/status/${encodeURIComponent(status)}`,
      {
        params: buildParams(params),
      }
    )
  );
};

/**
 * PATCH /api/plots/{id}/status
 */
const updateStatus = (id, status) => {
  if (!id || !status) {
    throw new Error("A plot ID and status are required.");
  }

  return request("Update plot status", () =>
    api.patch(`${BASE_URL}/${id}/status`, { status })
  );
};

/*
|--------------------------------------------------------------------------
| Statistics
|--------------------------------------------------------------------------
*/

const getStatistics = (params = {}) =>
  request("Get plot statistics", () =>
    api.get(`${BASE_URL}/statistics`, {
      params: buildParams(params),
    })
  );

const getInventoryStatistics = (params = {}) =>
  request("Get plot inventory statistics", () =>
    api.get(`${BASE_URL}/statistics/inventory`, {
      params: buildParams(params),
    })
  );

const getSalesStatistics = (params = {}) =>
  request("Get plot sales statistics", () =>
    api.get(`${BASE_URL}/statistics/sales`, {
      params: buildParams(params),
    })
  );

const getPaymentStatistics = (params = {}) =>
  request("Get plot payment statistics", () =>
    api.get(`${BASE_URL}/statistics/payments`, {
      params: buildParams(params),
    })
  );

const getLocationStatistics = (params = {}) =>
  request("Get plot location statistics", () =>
    api.get(`${BASE_URL}/statistics/locations`, {
      params: buildParams(params),
    })
  );

/*
|--------------------------------------------------------------------------
| Reports
|--------------------------------------------------------------------------
*/

const getInventoryReport = (params = {}) =>
  request("Get plot inventory report", () =>
    api.get(`${BASE_URL}/reports/inventory`, {
      params: buildParams(params),
    })
  );

const getSalesReport = (params = {}) =>
  request("Get plot sales report", () =>
    api.get(`${BASE_URL}/reports/sales`, {
      params: buildParams(params),
    })
  );

const getPaymentReport = (params = {}) =>
  request("Get plot payment report", () =>
    api.get(`${BASE_URL}/reports/payments`, {
      params: buildParams(params),
    })
  );

const getOutstandingReport = (params = {}) =>
  request("Get outstanding plot report", () =>
    api.get(`${BASE_URL}/reports/outstanding`, {
      params: buildParams(params),
    })
  );

const getAgentReport = (params = {}) =>
  request("Get plot agent report", () =>
    api.get(`${BASE_URL}/reports/agents`, {
      params: buildParams(params),
    })
  );

const getLocationReport = (params = {}) =>
  request("Get plot location report", () =>
    api.get(`${BASE_URL}/reports/locations`, {
      params: buildParams(params),
    })
  );

/**
 * Unified report method for PlotReports.jsx.
 */
const getPlotReport = (reportType, params = {}) => {
  const reports = {
    inventory: getInventoryReport,
    sales: getSalesReport,
    payments: getPaymentReport,
    outstanding: getOutstandingReport,
    agents: getAgentReport,
    locations: getLocationReport,
  };

  const reportMethod = reports[reportType];

  if (!reportMethod) {
    throw new Error(
      `Unsupported plot report type: ${reportType}`
    );
  }

  return reportMethod(params);
};

/*
|--------------------------------------------------------------------------
| Location Filters
|--------------------------------------------------------------------------
*/

const getByCounty = (countyId, params = {}) => {
  if (!countyId) {
    throw new Error("A county ID is required.");
  }

  return request("Get plots by county", () =>
    api.get(
      `${BASE_URL}/county/${encodeURIComponent(countyId)}`,
      {
        params: buildParams(params),
      }
    )
  );
};

const getByCity = (cityId, params = {}) => {
  if (!cityId) {
    throw new Error("A city ID is required.");
  }

  return request("Get plots by city", () =>
    api.get(
      `${BASE_URL}/city/${encodeURIComponent(cityId)}`,
      {
        params: buildParams(params),
      }
    )
  );
};

const getByArea = (areaId, params = {}) => {
  if (!areaId) {
    throw new Error("An area ID is required.");
  }

  return request("Get plots by area", () =>
    api.get(
      `${BASE_URL}/area/${encodeURIComponent(areaId)}`,
      {
        params: buildParams(params),
      }
    )
  );
};

/*
|--------------------------------------------------------------------------
| Soft Delete Management
|--------------------------------------------------------------------------
*/

/**
 * POST /api/plots/{id}/restore
 */
const restore = (id) => {
  if (!id) {
    throw new Error("A plot ID is required for restoration.");
  }

  return request("Restore plot", () =>
    api.post(`${BASE_URL}/${id}/restore`)
  );
};

/**
 * DELETE /api/plots/{id}/force
 */
const forceDelete = (id) => {
  if (!id) {
    throw new Error(
      "A plot ID is required for permanent deletion."
    );
  }

  return request("Permanently delete plot", () =>
    api.delete(`${BASE_URL}/${id}/force`)
  );
};

/*
|--------------------------------------------------------------------------
| Export Plot API
|--------------------------------------------------------------------------
|
| Both the original method names and the names expected by existing
| hooks/components are provided to avoid breaking imports.
|
*/

const plotApi = {
  // CRUD - original names
  getAll,
  getById,
  create,
  update,
  patch,
  delete: remove,

  // CRUD - hook/page compatibility
  getPlots: getAll,
  getPlot: getById,
  createPlot: create,
  updatePlot: update,
  deletePlot: remove,

  // Search
  search,
  searchPlots: search,

  // Availability
  getAvailable,
  getAvailablePlots: getAvailable,
  checkAvailability,

  // Status
  getByStatus,
  getPlotsByStatus: getByStatus,
  updateStatus,
  updatePlotStatus: updateStatus,

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
  getPlotReport,

  // Location filters
  getByCounty,
  getByCity,
  getByArea,
  getPlotsByCounty: getByCounty,
  getPlotsByCity: getByCity,
  getPlotsByArea: getByArea,

  // Soft delete
  restore,
  restorePlot: restore,
  forceDelete,
  forceDeletePlot: forceDelete,
};

export default plotApi;
