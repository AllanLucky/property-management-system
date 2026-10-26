
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import plotSaleService from "../services/plotSale.service";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  per_page: DEFAULT_PER_PAGE,
  total: 0,
  from: null,
  to: null,
};

const STATISTICS_KEYS = [
  "total_sales",
  "pending_sales",
  "reserved_sales",
  "approved_sales",
  "completed_sales",
  "cancelled_sales",
  "total_amount",
  "total_deposit",
  "total_discount",
  "total_paid",
  "total_outstanding",
];

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/

const initialState = {
  plotSales: [],
  selectedPlotSale: null,
  outstandingSales: [],
  statistics: null,
  report: null,

  pagination: { ...DEFAULT_PAGINATION },
  outstandingPagination: { ...DEFAULT_PAGINATION },
  filters: {},
  outstandingFilters: {},
  reportFilters: {},

  loading: false,
  detailsLoading: false,
  statisticsLoading: false,
  reportLoading: false,
  outstandingLoading: false,
  submitting: false,
  actionLoading: false,

  error: null,
  detailsError: null,
  statisticsError: null,
  reportError: null,
  outstandingError: null,
  validationErrors: null,
  message: null,
};

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Supports either:
 * 1. A normalized API envelope:
 *    { status, message, data, meta, links }
 *
 * 2. A raw Axios response:
 *    { data: { status, message, data, meta, links }, config, ... }
 */
const getEnvelope = (response) => {
  if (
    response?.config &&
    response?.data !== undefined
  ) {
    return response.data;
  }

  return response;
};

const getResponseData = (response) =>
  getEnvelope(response)?.data ?? null;

const getResponseMessage = (
  response,
  fallback = "Request completed successfully.",
) =>
  getEnvelope(response)?.message ||
  response?.message ||
  fallback;

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;
  const envelope = getEnvelope(responseData);
  const errors = envelope?.errors ?? responseData?.errors;

  if (typeof errors === "string") {
    return errors;
  }

  if (errors && typeof errors === "object") {
    const messages = Object.values(errors)
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
    envelope?.message ||
    responseData?.message ||
    error?.message ||
    "An unexpected error occurred. Please try again."
  );
};

const getValidationErrors = (error) => {
  const responseData = error?.response?.data;
  const envelope = getEnvelope(responseData);

  return (
    envelope?.errors ??
    responseData?.errors ??
    null
  );
};

const getRejectedMessage = (action, fallback) =>
  action.payload?.message ||
  action.error?.message ||
  fallback;

const rejectRequest = (error, rejectWithValue) =>
  rejectWithValue({
    message: getErrorMessage(error),
    validationErrors: getValidationErrors(error),
  });

/*
|--------------------------------------------------------------------------
| PAGINATION HELPER
|--------------------------------------------------------------------------
*/

const normalizePagination = (meta = {}, fallback = {}) => ({
  current_page:
    Number(meta.current_page ?? fallback.current_page) || 1,

  last_page:
    Number(meta.last_page ?? fallback.last_page) || 1,

  per_page:
    Number(meta.per_page ?? fallback.per_page) ||
    DEFAULT_PER_PAGE,

  total:
    Number(meta.total ?? fallback.total) || 0,

  from: meta.from ?? fallback.from ?? null,
  to: meta.to ?? fallback.to ?? null,
});

const getPagination = (response, fallback = {}) => {
  const envelope = getEnvelope(response);
  const data = envelope?.data;

  const candidates = [
    envelope?.meta,
    data?.meta,
    data?.pagination,
    data,
    data?.data,
  ];

  const meta = candidates.find(
    (item) =>
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      (
        item.current_page !== undefined ||
        item.last_page !== undefined ||
        item.total !== undefined ||
        item.per_page !== undefined
      ),
  );

  return normalizePagination(meta ?? {}, fallback);
};

/*
|--------------------------------------------------------------------------
| COLLECTION HELPER
|--------------------------------------------------------------------------
*/

/**
 * Supports standard Laravel envelopes and common resource wrappers.
 */
const getCollection = (response) => {
  const envelope = getEnvelope(response);
  let data = envelope?.data;

  for (let index = 0; index < 5; index += 1) {
    if (Array.isArray(data)) {
      return data;
    }

    if (!data || typeof data !== "object") {
      return [];
    }

    if (Array.isArray(data.items)) {
      return data.items;
    }

    if (Array.isArray(data.plot_sales)) {
      return data.plot_sales;
    }

    if (Array.isArray(data.sales)) {
      return data.sales;
    }

    if (Array.isArray(data.results)) {
      return data.results;
    }

    if (Array.isArray(data.data)) {
      data = data.data;
      continue;
    }

    return [];
  }

  return [];
};

/*
|--------------------------------------------------------------------------
| SINGLE SALE HELPER
|--------------------------------------------------------------------------
*/

const getSale = (response) => {
  let data = getResponseData(response);

  for (let index = 0; index < 5; index += 1) {
    if (!data || typeof data !== "object") {
      return null;
    }

    if (Array.isArray(data)) {
      return data[0] ?? null;
    }

    if (data.plot_sale) {
      data = data.plot_sale;
      continue;
    }

    if (data.sale) {
      data = data.sale;
      continue;
    }

    if (
      data.data &&
      typeof data.data === "object"
    ) {
      data = data.data;
      continue;
    }

    return data;
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| STATISTICS HELPER
|--------------------------------------------------------------------------
*/

const getStatistics = (response) => {
  let data = getResponseData(response);

  for (let index = 0; index < 5; index += 1) {
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return null;
    }

    if (
      STATISTICS_KEYS.some(
        (key) => data[key] !== undefined,
      )
    ) {
      return data;
    }

    if (
      data.statistics &&
      typeof data.statistics === "object"
    ) {
      data = data.statistics;
      continue;
    }

    if (
      data.data &&
      typeof data.data === "object"
    ) {
      data = data.data;
      continue;
    }

    return data;
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| REPORT HELPER
|--------------------------------------------------------------------------
*/

/**
 * Preserve the report's actual structure while supporting common wrappers.
 * The report component can decide how to render the returned object or array.
 */
const getReportData = (response) => {
  let data = getResponseData(response);

  for (let index = 0; index < 5; index += 1) {
    if (
      data === null ||
      data === undefined ||
      Array.isArray(data) ||
      typeof data !== "object"
    ) {
      return data;
    }

    if (data.report !== undefined) {
      data = data.report;
      continue;
    }

    if (data.report_data !== undefined) {
      data = data.report_data;
      continue;
    }

    if (data.data !== undefined) {
      data = data.data;
      continue;
    }

    return data;
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| SALE STATE HELPERS
|--------------------------------------------------------------------------
*/

const upsertSale = (state, sale) => {
  if (!sale?.id) return;

  const saleId = String(sale.id);

  const index = state.plotSales.findIndex(
    (item) => String(item.id) === saleId,
  );

  if (index === -1) {
    state.plotSales.unshift(sale);
  } else {
    state.plotSales[index] = {
      ...state.plotSales[index],
      ...sale,
    };
  }

  if (
    state.selectedPlotSale &&
    String(state.selectedPlotSale.id) === saleId
  ) {
    state.selectedPlotSale = {
      ...state.selectedPlotSale,
      ...sale,
    };
  }
};

const removeSale = (state, id) => {
  const saleId = String(id);

  const wasInList = state.plotSales.some(
    (sale) => String(sale.id) === saleId,
  );

  state.plotSales = state.plotSales.filter(
    (sale) => String(sale.id) !== saleId,
  );

  state.outstandingSales = state.outstandingSales.filter(
    (sale) => String(sale.id) !== saleId,
  );

  if (
    String(state.selectedPlotSale?.id) === saleId
  ) {
    state.selectedPlotSale = null;
  }

  if (wasInList) {
    state.pagination.total = Math.max(
      0,
      state.pagination.total - 1,
    );
  }

  const wasOutstanding = state.outstandingSales.some(
    (sale) => String(sale.id) === saleId,
  );

  if (wasOutstanding) {
    state.outstandingPagination.total = Math.max(
      0,
      state.outstandingPagination.total - 1,
    );
  }
};

/*
|--------------------------------------------------------------------------
| FETCH ALL PLOT SALES
|--------------------------------------------------------------------------
*/

export const fetchPlotSales = createAsyncThunk(
  "plotSales/fetchAll",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await plotSaleService.getAll(filters);

      return {
        items: getCollection(response),
        pagination: getPagination(response, {
          current_page: filters.page ?? 1,
          per_page: filters.per_page ?? DEFAULT_PER_PAGE,
        }),
        filters,
        message: getResponseMessage(
          response,
          "Plot sales fetched successfully.",
        ),
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

/*
|--------------------------------------------------------------------------
| SEARCH PLOT SALES
|--------------------------------------------------------------------------
*/

export const searchPlotSales = createAsyncThunk(
  "plotSales/search",
  async (
    { search = "", filters = {} } = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await plotSaleService.search(
        search,
        filters,
      );

      return {
        items: getCollection(response),
        pagination: getPagination(response, {
          current_page: filters.page ?? 1,
          per_page: filters.per_page ?? DEFAULT_PER_PAGE,
        }),
        filters: { ...filters, search },
        message: getResponseMessage(
          response,
          "Plot sales search completed.",
        ),
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

/*
|--------------------------------------------------------------------------
| FETCH SINGLE PLOT SALE
|--------------------------------------------------------------------------
*/

export const fetchPlotSaleById = createAsyncThunk(
  "plotSales/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await plotSaleService.getById(id);

      return {
        sale: getSale(response),
        message: getResponseMessage(
          response,
          "Plot sale details fetched successfully.",
        ),
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

/*
|--------------------------------------------------------------------------
| CREATE PLOT SALE
|--------------------------------------------------------------------------
*/

export const createPlotSale = createAsyncThunk(
  "plotSales/create",
  async (saleData, { rejectWithValue }) => {
    try {
      const response = await plotSaleService.create(saleData);

      return {
        sale: getSale(response),
        message: getResponseMessage(
          response,
          "Plot sale created successfully.",
        ),
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

/*
|--------------------------------------------------------------------------
| UPDATE PLOT SALE
|--------------------------------------------------------------------------
*/

export const updatePlotSale = createAsyncThunk(
  "plotSales/update",
  async ({ id, saleData }, { rejectWithValue }) => {
    try {
      const response = await plotSaleService.update(
        id,
        saleData,
      );

      return {
        sale: getSale(response),
        message: getResponseMessage(
          response,
          "Plot sale updated successfully.",
        ),
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

/*
|--------------------------------------------------------------------------
| DELETE PLOT SALE
|--------------------------------------------------------------------------
*/

export const deletePlotSale = createAsyncThunk(
  "plotSales/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await plotSaleService.delete(id);

      return {
        id,
        message: getResponseMessage(
          response,
          "Plot sale deleted successfully.",
        ),
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

/*
|--------------------------------------------------------------------------
| APPROVE PLOT SALE
|--------------------------------------------------------------------------
*/

export const approvePlotSale = createAsyncThunk(
  "plotSales/approve",
  async (id, { rejectWithValue }) => {
    try {
      const response = await plotSaleService.approve(id);

      return {
        sale: getSale(response),
        id,
        message: getResponseMessage(
          response,
          "Plot sale approved successfully.",
        ),
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

/*
|--------------------------------------------------------------------------
| CANCEL PLOT SALE
|--------------------------------------------------------------------------
*/

export const cancelPlotSale = createAsyncThunk(
  "plotSales/cancel",
  async (
    { id, reason = null },
    { rejectWithValue },
  ) => {
    try {
      const response = await plotSaleService.cancel(
        id,
        reason,
      );

      return {
        sale: getSale(response),
        id,
        message: getResponseMessage(
          response,
          "Plot sale cancelled successfully.",
        ),
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

/*
|--------------------------------------------------------------------------
| COMPLETE PLOT SALE
|--------------------------------------------------------------------------
*/

export const completePlotSale = createAsyncThunk(
  "plotSales/complete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await plotSaleService.complete(id);

      return {
        sale: getSale(response),
        id,
        message: getResponseMessage(
          response,
          "Plot sale completed successfully.",
        ),
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

/*
|--------------------------------------------------------------------------
| OUTSTANDING PLOT SALES
|--------------------------------------------------------------------------
*/

export const fetchOutstandingPlotSales = createAsyncThunk(
  "plotSales/fetchOutstanding",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response =
        await plotSaleService.getOutstanding(filters);

      return {
        items: getCollection(response),
        pagination: getPagination(response, {
          current_page: filters.page ?? 1,
          per_page: filters.per_page ?? DEFAULT_PER_PAGE,
        }),
        filters,
        message: getResponseMessage(
          response,
          "Outstanding plot sales fetched successfully.",
        ),
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

/*
|--------------------------------------------------------------------------
| PLOT SALES STATISTICS
|--------------------------------------------------------------------------
*/

export const fetchPlotSalesStatistics = createAsyncThunk(
  "plotSales/fetchStatistics",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response =
        await plotSaleService.getStatistics(filters);

      const statistics = getStatistics(response);

      if (
        !statistics ||
        typeof statistics !== "object" ||
        Array.isArray(statistics) ||
        !STATISTICS_KEYS.some(
          (key) => statistics[key] !== undefined,
        )
      ) {
        throw new Error(
          "The API response does not contain valid plot sales statistics.",
        );
      }

      return {
        statistics,
        message: getResponseMessage(
          response,
          "Plot sales statistics fetched successfully.",
        ),
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

/*
|--------------------------------------------------------------------------
| PLOT SALES REPORT
|--------------------------------------------------------------------------
*/

export const fetchPlotSalesReport = createAsyncThunk(
  "plotSales/fetchReport",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response =
        await plotSaleService.getReport(filters);

      const report = getReportData(response);

      if (report === null || report === undefined) {
        throw new Error(
          "The API returned an empty plot sales report.",
        );
      }

      return {
        report,
        filters,
        message: getResponseMessage(
          response,
          "Plot sales report generated successfully.",
        ),
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

/*
|--------------------------------------------------------------------------
| RESTORE PLOT SALE
|--------------------------------------------------------------------------
*/

export const restorePlotSale = createAsyncThunk(
  "plotSales/restore",
  async (id, { rejectWithValue }) => {
    try {
      const response = await plotSaleService.restore(id);

      return {
        sale: getSale(response),
        id,
        message: getResponseMessage(
          response,
          "Plot sale restored successfully.",
        ),
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

/*
|--------------------------------------------------------------------------
| PERMANENTLY DELETE PLOT SALE
|--------------------------------------------------------------------------
*/

export const forceDeletePlotSale = createAsyncThunk(
  "plotSales/forceDelete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await plotSaleService.forceDelete(id);

      return {
        id,
        message: getResponseMessage(
          response,
          "Plot sale permanently deleted.",
        ),
      };
    } catch (error) {
      return rejectRequest(error, rejectWithValue);
    }
  },
);

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/

const plotSalesSlice = createSlice({
  name: "plotSales",
  initialState,

  reducers: {
    setSelectedPlotSale: (state, action) => {
      state.selectedPlotSale = action.payload;
      state.detailsError = null;
      state.error = null;
      state.validationErrors = null;
    },

    clearSelectedPlotSale: (state) => {
      state.selectedPlotSale = null;
      state.detailsError = null;
    },

    setPlotSalesFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };

      state.pagination.current_page = 1;
    },

    clearPlotSalesFilters: (state) => {
      state.filters = {};
      state.pagination = { ...DEFAULT_PAGINATION };
    },

    setPlotSalesPage: (state, action) => {
      const nextPage = Number(action.payload) || 1;

      state.pagination.current_page = Math.max(
        1,
        Math.min(
          nextPage,
          Math.max(1, state.pagination.last_page),
        ),
      );
    },

    setPlotSalesPerPage: (state, action) => {
      state.pagination.per_page = Math.max(
        1,
        Math.min(
          100,
          Number(action.payload) || DEFAULT_PER_PAGE,
        ),
      );

      state.pagination.current_page = 1;
    },

    setOutstandingPlotSalesPage: (state, action) => {
      const nextPage = Number(action.payload) || 1;

      state.outstandingPagination.current_page = Math.max(
        1,
        Math.min(
          nextPage,
          Math.max(1, state.outstandingPagination.last_page),
        ),
      );
    },

    setOutstandingPlotSalesPerPage: (state, action) => {
      state.outstandingPagination.per_page = Math.max(
        1,
        Math.min(
          100,
          Number(action.payload) || DEFAULT_PER_PAGE,
        ),
      );

      state.outstandingPagination.current_page = 1;
    },

    setOutstandingPlotSalesFilters: (state, action) => {
      state.outstandingFilters = {
        ...state.outstandingFilters,
        ...action.payload,
      };

      state.outstandingPagination.current_page = 1;
    },

    clearOutstandingPlotSalesFilters: (state) => {
      state.outstandingFilters = {};
      state.outstandingPagination = {
        ...DEFAULT_PAGINATION,
      };
    },

    clearPlotSalesError: (state) => {
      state.error = null;
      state.detailsError = null;
      state.validationErrors = null;
    },

    clearPlotSalesStatisticsError: (state) => {
      state.statisticsError = null;
    },

    clearPlotSalesReportError: (state) => {
      state.reportError = null;
    },

    clearOutstandingPlotSalesError: (state) => {
      state.outstandingError = null;
    },

    clearPlotSalesMessage: (state) => {
      state.message = null;
    },

    clearPlotSalesReport: (state) => {
      state.report = null;
      state.reportError = null;
    },

    clearPlotSalesStatistics: (state) => {
      state.statistics = null;
      state.statisticsError = null;
    },

    clearPlotSalesState: () => ({
      ...initialState,
      pagination: { ...DEFAULT_PAGINATION },
      outstandingPagination: { ...DEFAULT_PAGINATION },
    }),
  },

  extraReducers: (builder) => {
    builder

      /*
      |----------------------------------------------------------------------
      | FETCH ALL
      |----------------------------------------------------------------------
      */

      .addCase(fetchPlotSales.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.validationErrors = null;
      })

      .addCase(fetchPlotSales.fulfilled, (state, action) => {
        state.loading = false;
        state.plotSales = action.payload.items;
        state.pagination = action.payload.pagination;
        state.filters = action.payload.filters;
        state.message = action.payload.message || null;
      })

      .addCase(fetchPlotSales.rejected, (state, action) => {
        state.loading = false;
        state.error = getRejectedMessage(
          action,
          "Failed to fetch plot sales.",
        );
        state.validationErrors =
          action.payload?.validationErrors ?? null;
      })

      /*
      |----------------------------------------------------------------------
      | SEARCH
      |----------------------------------------------------------------------
      */

      .addCase(searchPlotSales.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.validationErrors = null;
      })

      .addCase(searchPlotSales.fulfilled, (state, action) => {
        state.loading = false;
        state.plotSales = action.payload.items;
        state.pagination = action.payload.pagination;
        state.filters = action.payload.filters;
        state.message = action.payload.message || null;
      })

      .addCase(searchPlotSales.rejected, (state, action) => {
        state.loading = false;
        state.error = getRejectedMessage(
          action,
          "Failed to search plot sales.",
        );
        state.validationErrors =
          action.payload?.validationErrors ?? null;
      })

      /*
      |----------------------------------------------------------------------
      | SINGLE SALE
      |----------------------------------------------------------------------
      */

      .addCase(fetchPlotSaleById.pending, (state) => {
        state.detailsLoading = true;
        state.detailsError = null;
      })

      .addCase(fetchPlotSaleById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedPlotSale = action.payload.sale;
        state.message = action.payload.message || null;
        upsertSale(state, action.payload.sale);
      })

      .addCase(fetchPlotSaleById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.detailsError = getRejectedMessage(
          action,
          "Failed to fetch plot sale details.",
        );
      })

      /*
      |----------------------------------------------------------------------
      | CREATE
      |----------------------------------------------------------------------
      */

      .addCase(createPlotSale.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.validationErrors = null;
      })

      .addCase(createPlotSale.fulfilled, (state, action) => {
        state.submitting = false;
        state.message = action.payload.message;

        const sale = action.payload.sale;

        if (sale?.id) {
          const exists = state.plotSales.some(
            (item) => String(item.id) === String(sale.id),
          );

          upsertSale(state, sale);
          state.selectedPlotSale = sale;

          if (!exists) {
            state.pagination.total += 1;
          }
        }
      })

      .addCase(createPlotSale.rejected, (state, action) => {
        state.submitting = false;
        state.error = getRejectedMessage(
          action,
          "Failed to create plot sale.",
        );
        state.validationErrors =
          action.payload?.validationErrors ?? null;
      })

      /*
      |----------------------------------------------------------------------
      | UPDATE
      |----------------------------------------------------------------------
      */

      .addCase(updatePlotSale.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.validationErrors = null;
      })

      .addCase(updatePlotSale.fulfilled, (state, action) => {
        state.submitting = false;
        state.message = action.payload.message;
        upsertSale(state, action.payload.sale);
      })

      .addCase(updatePlotSale.rejected, (state, action) => {
        state.submitting = false;
        state.error = getRejectedMessage(
          action,
          "Failed to update plot sale.",
        );
        state.validationErrors =
          action.payload?.validationErrors ?? null;
      })

      /*
      |----------------------------------------------------------------------
      | DELETE
      |----------------------------------------------------------------------
      */

      .addCase(deletePlotSale.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(deletePlotSale.fulfilled, (state, action) => {
        state.actionLoading = false;
        removeSale(state, action.payload.id);
        state.message = action.payload.message;
      })

      .addCase(deletePlotSale.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = getRejectedMessage(
          action,
          "Failed to delete plot sale.",
        );
      })

      /*
      |----------------------------------------------------------------------
      | APPROVE
      |----------------------------------------------------------------------
      */

      .addCase(approvePlotSale.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(approvePlotSale.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.message = action.payload.message;
        upsertSale(state, action.payload.sale);
      })

      .addCase(approvePlotSale.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = getRejectedMessage(
          action,
          "Failed to approve plot sale.",
        );
      })

      /*
      |----------------------------------------------------------------------
      | CANCEL
      |----------------------------------------------------------------------
      */

      .addCase(cancelPlotSale.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(cancelPlotSale.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.message = action.payload.message;
        upsertSale(state, action.payload.sale);
      })

      .addCase(cancelPlotSale.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = getRejectedMessage(
          action,
          "Failed to cancel plot sale.",
        );
      })

      /*
      |----------------------------------------------------------------------
      | COMPLETE
      |----------------------------------------------------------------------
      */

      .addCase(completePlotSale.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(completePlotSale.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.message = action.payload.message;
        upsertSale(state, action.payload.sale);
      })

      .addCase(completePlotSale.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = getRejectedMessage(
          action,
          "Failed to complete plot sale.",
        );
      })

      /*
      |----------------------------------------------------------------------
      | OUTSTANDING SALES
      |----------------------------------------------------------------------
      */

      .addCase(fetchOutstandingPlotSales.pending, (state) => {
        state.outstandingLoading = true;
        state.outstandingError = null;
      })

      .addCase(
        fetchOutstandingPlotSales.fulfilled,
        (state, action) => {
          state.outstandingLoading = false;
          state.outstandingSales = action.payload.items;
          state.outstandingPagination = action.payload.pagination;
          state.outstandingFilters = action.payload.filters;
          state.message = action.payload.message || state.message;
        },
      )

      .addCase(
        fetchOutstandingPlotSales.rejected,
        (state, action) => {
          state.outstandingLoading = false;
          state.outstandingError = getRejectedMessage(
            action,
            "Failed to fetch outstanding plot sales.",
          );
        },
      )

      /*
      |----------------------------------------------------------------------
      | STATISTICS
      |----------------------------------------------------------------------
      */

      .addCase(fetchPlotSalesStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.statisticsError = null;
      })

      .addCase(
        fetchPlotSalesStatistics.fulfilled,
        (state, action) => {
          state.statisticsLoading = false;
          state.statistics = action.payload.statistics;
          state.message = action.payload.message || state.message;
        },
      )

      .addCase(
        fetchPlotSalesStatistics.rejected,
        (state, action) => {
          state.statisticsLoading = false;
          state.statisticsError = getRejectedMessage(
            action,
            "Failed to fetch plot sales statistics.",
          );
        },
      )

      /*
      |----------------------------------------------------------------------
      | REPORT
      |----------------------------------------------------------------------
      */

      .addCase(fetchPlotSalesReport.pending, (state) => {
        state.reportLoading = true;
        state.reportError = null;
      })

      .addCase(
        fetchPlotSalesReport.fulfilled,
        (state, action) => {
          state.reportLoading = false;
          state.report = action.payload.report;
          state.reportFilters = action.payload.filters;
          state.message = action.payload.message || state.message;
        },
      )

      .addCase(
        fetchPlotSalesReport.rejected,
        (state, action) => {
          state.reportLoading = false;
          state.reportError = getRejectedMessage(
            action,
            "Failed to generate plot sales report.",
          );
        },
      )

      /*
      |----------------------------------------------------------------------
      | RESTORE
      |----------------------------------------------------------------------
      */

      .addCase(restorePlotSale.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(restorePlotSale.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.message = action.payload.message;
        upsertSale(state, action.payload.sale);
      })

      .addCase(restorePlotSale.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = getRejectedMessage(
          action,
          "Failed to restore plot sale.",
        );
      })

      /*
      |----------------------------------------------------------------------
      | FORCE DELETE
      |----------------------------------------------------------------------
      */

      .addCase(forceDeletePlotSale.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(forceDeletePlotSale.fulfilled, (state, action) => {
        state.actionLoading = false;
        removeSale(state, action.payload.id);
        state.message = action.payload.message;
      })

      .addCase(forceDeletePlotSale.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = getRejectedMessage(
          action,
          "Failed to permanently delete plot sale.",
        );
      });
  },
});

/*
|--------------------------------------------------------------------------
| ACTIONS
|--------------------------------------------------------------------------
*/

export const {
  setSelectedPlotSale,
  clearSelectedPlotSale,
  setPlotSalesFilters,
  clearPlotSalesFilters,
  setPlotSalesPage,
  setPlotSalesPerPage,
  setOutstandingPlotSalesPage,
  setOutstandingPlotSalesPerPage,
  setOutstandingPlotSalesFilters,
  clearOutstandingPlotSalesFilters,
  clearPlotSalesError,
  clearPlotSalesStatisticsError,
  clearPlotSalesReportError,
  clearOutstandingPlotSalesError,
  clearPlotSalesMessage,
  clearPlotSalesReport,
  clearPlotSalesStatistics,
  clearPlotSalesState,
} = plotSalesSlice.actions;

/*
|--------------------------------------------------------------------------
| SELECTORS
|--------------------------------------------------------------------------
*/

export const selectPlotSalesState = (state) =>
  state.plotSales;

export const selectPlotSales = (state) =>
  state.plotSales.plotSales;

export const selectSelectedPlotSale = (state) =>
  state.plotSales.selectedPlotSale;

export const selectOutstandingPlotSales = (state) =>
  state.plotSales.outstandingSales;

export const selectPlotSalesStatistics = (state) =>
  state.plotSales.statistics;

export const selectPlotSalesReport = (state) =>
  state.plotSales.report;

export const selectPlotSalesPagination = (state) =>
  state.plotSales.pagination;

export const selectOutstandingPlotSalesPagination = (state) =>
  state.plotSales.outstandingPagination;

export const selectPlotSalesFilters = (state) =>
  state.plotSales.filters;

export const selectOutstandingPlotSalesFilters = (state) =>
  state.plotSales.outstandingFilters;

export const selectPlotSalesReportFilters = (state) =>
  state.plotSales.reportFilters;

export const selectPlotSalesLoading = (state) =>
  state.plotSales.loading;

export const selectPlotSaleDetailsLoading = (state) =>
  state.plotSales.detailsLoading;

export const selectPlotSalesSubmitting = (state) =>
  state.plotSales.submitting;

export const selectPlotSalesActionLoading = (state) =>
  state.plotSales.actionLoading;

export const selectPlotSalesStatisticsLoading = (state) =>
  state.plotSales.statisticsLoading;

export const selectPlotSalesReportLoading = (state) =>
  state.plotSales.reportLoading;

export const selectOutstandingPlotSalesLoading = (state) =>
  state.plotSales.outstandingLoading;

export const selectPlotSalesError = (state) =>
  state.plotSales.error;

export const selectPlotSaleDetailsError = (state) =>
  state.plotSales.detailsError;

export const selectPlotSalesStatisticsError = (state) =>
  state.plotSales.statisticsError;

export const selectPlotSalesReportError = (state) =>
  state.plotSales.reportError;

export const selectOutstandingPlotSalesError = (state) =>
  state.plotSales.outstandingError;

export const selectPlotSalesValidationErrors = (state) =>
  state.plotSales.validationErrors;

export const selectPlotSalesMessage = (state) =>
  state.plotSales.message;

/*
|--------------------------------------------------------------------------
| REDUCER
|--------------------------------------------------------------------------
*/

export default plotSalesSlice.reducer;
