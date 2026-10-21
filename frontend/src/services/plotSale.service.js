
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
  const responseErrors = error?.response?.data?.errors;

  if (typeof responseErrors === "string") {
    return responseErrors;
  }

  if (responseErrors && typeof responseErrors === "object") {
    const firstError = Object.values(responseErrors)
      .flat()
      .find(
        (message) =>
          typeof message === "string" &&
          message.trim() !== "",
      );

    if (firstError) {
      return firstError;
    }
  }

  return (
    error?.serviceMessage ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

/**
 * Execute an API operation.
 *
 * plotSalesApi already normalizes the Axios response.
 * Do not normalize the response a second time here.
 *
 * Successful responses retain this structure:
 * {
 *   status: true,
 *   code: 200,
 *   message: "...",
 *   data: { ... },
 *   meta: null,
 *   links: null,
 *   errors: null
 * }
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
    return execute(
      () => plotSalesApi.getPlotSales(cleanParams(filters)),
      "Failed to fetch plot sales.",
    );
  },

  /**
   * Alias for getAll.
   */
  async getPlotSales(filters = {}) {
    return this.getAll(filters);
  },

  /**
   * Search plot sales.
   */
  async search(search, filters = {}) {
    const searchTerm = String(search ?? "").trim();

    return execute(
      () =>
        plotSalesApi.searchPlotSales(
          searchTerm,
          cleanParams(filters),
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
    return this.getById(id);
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
    return this.create(saleData);
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
    return this.update(id, saleData);
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
    return this.delete(id);
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
    return this.approve(id);
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

    return execute(
      () => plotSalesApi.cancelPlotSale(saleId, reason),
      "Failed to cancel plot sale.",
    );
  },

  /**
   * Alias for cancel.
   */
  async cancelPlotSale(id, reason = null) {
    return this.cancel(id, reason);
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
    return this.complete(id);
  },

  /*
  |--------------------------------------------------------------------------
  | OUTSTANDING SALES
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch sales with outstanding balances.
   */
  async getOutstanding(params = {}) {
    return execute(
      () =>
        plotSalesApi.getOutstandingPlotSales(
          cleanParams(params),
        ),
      "Failed to fetch outstanding plot sales.",
    );
  },

  /**
   * Alias for getOutstanding.
   */
  async getOutstandingPlotSales(params = {}) {
    return this.getOutstanding(params);
  },

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch plot sale statistics.
   *
   * IMPORTANT:
   * Returns the normalized API envelope.
   * Statistics are available under response.data.
   */
  async getStatistics(filters = {}) {
    return execute(
      () =>
        plotSalesApi.getPlotSalesStatistics(
          cleanParams(filters),
        ),
      "Failed to fetch plot sales statistics.",
    );
  },

  /**
   * Alias for getStatistics.
   */
  async getPlotSalesStatistics(filters = {}) {
    return this.getStatistics(filters);
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
    return execute(
      () =>
        plotSalesApi.getPlotSalesReport(
          cleanParams(filters),
        ),
      "Failed to generate plot sales report.",
    );
  },

  /**
   * Alias for getReport.
   */
  async getPlotSalesReport(filters = {}) {
    return this.getReport(filters);
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
    return this.restore(id);
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
    return this.forceDelete(id);
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
