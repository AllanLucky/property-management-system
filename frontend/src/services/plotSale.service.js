
import plotSalesApi from "../api/plotSales.api";

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Extract a readable error message from an API or Axios error.
 */
const getErrorMessage = (
  error,
  fallback = "An unexpected error occurred. Please try again.",
) => {
  const responseData = error?.response?.data;

  const responseErrors =
    responseData?.errors ??
    error?.errors ??
    null;

  if (typeof responseErrors === "string") {
    return responseErrors;
  }

  if (
    responseErrors &&
    typeof responseErrors === "object"
  ) {
    const messages = Object.values(responseErrors)
      .flat(Infinity)
      .filter(
        (message) =>
          typeof message === "string" &&
          message.trim() !== "",
      );

    if (messages.length > 0) {
      return messages[0];
    }
  }

  return (
    error?.serviceMessage ||
    responseData?.message ||
    error?.message ||
    fallback
  );
};

/**
 * Execute an API operation and preserve the API response envelope.
 *
 * plotSalesApi is responsible for normalizing Axios responses.
 * This service does not unwrap or normalize successful responses again.
 */
const execute = async (
  operation,
  fallbackMessage = "An unexpected error occurred.",
) => {
  try {
    return await operation();
  } catch (error) {
    if (error && typeof error === "object") {
      error.serviceMessage = getErrorMessage(
        error,
        fallbackMessage,
      );
    }

    throw error;
  }
};

/**
 * Remove empty parameters while preserving valid 0 and false values.
 */
const cleanParams = (params = {}) => {
  if (
    !params ||
    typeof params !== "object" ||
    Array.isArray(params)
  ) {
    return {};
  }

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
 * Validate a positive integer identifier.
 */
const validateId = (id, label = "ID") => {
  const normalizedId = Number(id);

  if (
    id === null ||
    id === undefined ||
    String(id).trim() === "" ||
    !Number.isSafeInteger(normalizedId) ||
    normalizedId <= 0
  ) {
    throw new Error(
      `${label} must be a positive integer.`,
    );
  }

  return normalizedId;
};

/**
 * Validate create/update payloads.
 */
const validateObject = (value, label = "Data") => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      `${label} must be a valid object.`,
    );
  }

  return value;
};

/**
 * Validate required strings.
 */
const validateRequiredString = (value, label) => {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    throw new Error(`${label} is required.`);
  }

  return normalizedValue;
};

/**
 * Validate an optional cancellation reason.
 */
const normalizeReason = (reason) => {
  if (reason === null || reason === undefined) {
    return null;
  }

  return String(reason).trim() || null;
};

/*
|--------------------------------------------------------------------------
| PLOT SALES SERVICE
|--------------------------------------------------------------------------
*/

const plotSaleService = {
  /*
  |--------------------------------------------------------------------------
  | LIST AND SEARCH
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch paginated plot sales.
   */
  async getAll(filters = {}) {
    const params = cleanParams(filters);

    return execute(
      () => plotSalesApi.getPlotSales(params),
      "Failed to fetch plot sales.",
    );
  },

  /**
   * Alias for getAll.
   */
  async getPlotSales(filters = {}) {
    return plotSaleService.getAll(filters);
  },

  /**
   * Search plot sales.
   */
  async search(search, filters = {}) {
    const searchTerm = String(search ?? "").trim();
    const params = cleanParams(filters);

    return execute(
      () =>
        plotSalesApi.searchPlotSales(
          searchTerm,
          params,
        ),
      "Failed to search plot sales.",
    );
  },

  /**
   * Fetch plot sales by status.
   */
  async getByStatus(status, params = {}) {
    const normalizedStatus = validateRequiredString(
      status,
      "Plot sale status",
    );

    return execute(
      () =>
        plotSalesApi.getPlotSalesByStatus(
          normalizedStatus,
          cleanParams(params),
        ),
      "Failed to fetch plot sales by status.",
    );
  },

  /**
   * Fetch sales associated with a particular plot.
   */
  async getByPlot(plotId, params = {}) {
    const id = validateId(plotId, "Plot ID");

    return execute(
      () =>
        plotSalesApi.getPlotSalesByPlot(
          id,
          cleanParams(params),
        ),
      "Failed to fetch sales for this plot.",
    );
  },

  /**
   * Fetch sales associated with a particular buyer.
   */
  async getByBuyer(buyerId, params = {}) {
    const id = validateId(buyerId, "Buyer ID");

    return execute(
      () =>
        plotSalesApi.getPlotSalesByBuyer(
          id,
          cleanParams(params),
        ),
      "Failed to fetch sales for this buyer.",
    );
  },

  /*
  |--------------------------------------------------------------------------
  | SINGLE PLOT SALE
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch one plot sale by ID.
   */
  async getById(id) {
    const saleId = validateId(id, "Plot sale ID");

    return execute(
      () => plotSalesApi.getPlotSaleById(saleId),
      "Failed to fetch plot sale details.",
    );
  },

  /**
   * Alias for getById.
   */
  async getPlotSaleById(id) {
    return plotSaleService.getById(id);
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE
  |--------------------------------------------------------------------------
  */

  /**
   * Create a plot sale.
   */
  async create(saleData) {
    const data = validateObject(
      saleData,
      "Plot sale data",
    );

    return execute(
      () => plotSalesApi.createPlotSale(data),
      "Failed to create plot sale.",
    );
  },

  /**
   * Alias for create.
   */
  async createPlotSale(saleData) {
    return plotSaleService.create(saleData);
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE
  |--------------------------------------------------------------------------
  */

  /**
   * Update an existing plot sale.
   */
  async update(id, saleData) {
    const saleId = validateId(id, "Plot sale ID");

    const data = validateObject(
      saleData,
      "Plot sale update data",
    );

    return execute(
      () => plotSalesApi.updatePlotSale(saleId, data),
      "Failed to update plot sale.",
    );
  },

  /**
   * Alias for update.
   */
  async updatePlotSale(id, saleData) {
    return plotSaleService.update(id, saleData);
  },

  /*
  |--------------------------------------------------------------------------
  | SOFT DELETE
  |--------------------------------------------------------------------------
  */

  /**
   * Soft-delete a plot sale.
   */
  async delete(id) {
    const saleId = validateId(id, "Plot sale ID");

    return execute(
      () => plotSalesApi.deletePlotSale(saleId),
      "Failed to delete plot sale.",
    );
  },

  /**
   * Alias for delete.
   */
  async deletePlotSale(id) {
    return plotSaleService.delete(id);
  },

  /*
  |--------------------------------------------------------------------------
  | APPROVAL
  |--------------------------------------------------------------------------
  */

  /**
   * Approve a plot sale.
   */
  async approve(id) {
    const saleId = validateId(id, "Plot sale ID");

    return execute(
      () => plotSalesApi.approvePlotSale(saleId),
      "Failed to approve plot sale.",
    );
  },

  /**
   * Alias for approve.
   */
  async approvePlotSale(id) {
    return plotSaleService.approve(id);
  },

  /*
  |--------------------------------------------------------------------------
  | CANCELLATION
  |--------------------------------------------------------------------------
  */

  /**
   * Cancel a plot sale.
   */
  async cancel(id, reason = null) {
    const saleId = validateId(id, "Plot sale ID");
    const cancellationReason = normalizeReason(reason);

    return execute(
      () =>
        plotSalesApi.cancelPlotSale(
          saleId,
          cancellationReason,
        ),
      "Failed to cancel plot sale.",
    );
  },

  /**
   * Alias for cancel.
   */
  async cancelPlotSale(id, reason = null) {
    return plotSaleService.cancel(id, reason);
  },

  /*
  |--------------------------------------------------------------------------
  | COMPLETION
  |--------------------------------------------------------------------------
  */

  /**
   * Mark a plot sale as completed.
   */
  async complete(id) {
    const saleId = validateId(id, "Plot sale ID");

    return execute(
      () => plotSalesApi.completePlotSale(saleId),
      "Failed to complete plot sale.",
    );
  },

  /**
   * Alias for complete.
   */
  async completePlotSale(id) {
    return plotSaleService.complete(id);
  },

  /*
  |--------------------------------------------------------------------------
  | OUTSTANDING SALES
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch sales with outstanding balances.
   *
   * Expected response envelope:
   * {
   *   status: true,
   *   code: 200,
   *   message: "...",
   *   data: [...],
   *   meta: {
   *     current_page: 1,
   *     last_page: 1,
   *     per_page: 15,
   *     total: 1
   *   },
   *   links: {...},
   *   errors: null
   * }
   *
   * The returned value remains the normalized API envelope.
   */
  async getOutstanding(params = {}) {
    const queryParams = cleanParams(params);

    return execute(
      () =>
        plotSalesApi.getOutstandingPlotSales(
          queryParams,
        ),
      "Failed to fetch outstanding plot sales.",
    );
  },

  /**
   * Alias for getOutstanding.
   */
  async getOutstandingPlotSales(params = {}) {
    return plotSaleService.getOutstanding(params);
  },

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch plot sales statistics.
   *
   * Statistics are expected under response.data.
   * The API envelope is preserved.
   */
  async getStatistics(filters = {}) {
    const params = cleanParams(filters);

    return execute(
      () =>
        plotSalesApi.getPlotSalesStatistics(params),
      "Failed to fetch plot sales statistics.",
    );
  },

  /**
   * Alias for getStatistics.
   */
  async getPlotSalesStatistics(filters = {}) {
    return plotSaleService.getStatistics(filters);
  },

  /*
  |--------------------------------------------------------------------------
  | REPORTS
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch plot sales report data.
   */
  async getReport(filters = {}) {
    const params = cleanParams(filters);

    return execute(
      () =>
        plotSalesApi.getPlotSalesReport(params),
      "Failed to generate plot sales report.",
    );
  },

  /**
   * Alias for getReport.
   */
  async getPlotSalesReport(filters = {}) {
    return plotSaleService.getReport(filters);
  },

  /*
  |--------------------------------------------------------------------------
  | RESTORE
  |--------------------------------------------------------------------------
  */

  /**
   * Restore a soft-deleted plot sale.
   */
  async restore(id) {
    const saleId = validateId(id, "Plot sale ID");

    return execute(
      () => plotSalesApi.restorePlotSale(saleId),
      "Failed to restore plot sale.",
    );
  },

  /**
   * Alias for restore.
   */
  async restorePlotSale(id) {
    return plotSaleService.restore(id);
  },

  /*
  |--------------------------------------------------------------------------
  | PERMANENT DELETE
  |--------------------------------------------------------------------------
  */

  /**
   * Permanently delete a plot sale.
   */
  async forceDelete(id) {
    const saleId = validateId(id, "Plot sale ID");

    return execute(
      () => plotSalesApi.forceDeletePlotSale(saleId),
      "Failed to permanently delete plot sale.",
    );
  },

  /**
   * Alias for forceDelete.
   */
  async forceDeletePlotSale(id) {
    return plotSaleService.forceDelete(id);
  },

  /*
  |--------------------------------------------------------------------------
  | ERROR HELPER
  |--------------------------------------------------------------------------
  */

  getErrorMessage,
};

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

export { getErrorMessage };

export default plotSaleService;
