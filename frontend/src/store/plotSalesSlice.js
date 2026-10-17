import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import plotSaleService from "../services/plotSale.service";

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

  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: null,
    to: null,
  },

  filters: {},

  loading: false,
  detailsLoading: false,
  statisticsLoading: false,
  reportLoading: false,
  outstandingLoading: false,
  submitting: false,
  actionLoading: false,

  error: null,
  validationErrors: null,
  message: null,
};

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Extract normalized API data.
 *
 * Supports the API envelope:
 * { status, message, data, meta, links, errors }
 */
const getResponseData = (response) => response?.data ?? null;

const getResponseMessage = (response, fallback) =>
  response?.message || fallback;

const getPagination = (response, fallback = {}) => {
  const meta = response?.meta ?? {};
  const data = getResponseData(response);

  return {
    current_page:
      meta.current_page ??
      data?.current_page ??
      fallback.current_page ??
      1,

    last_page:
      meta.last_page ??
      data?.last_page ??
      fallback.last_page ??
      1,

    per_page:
      meta.per_page ??
      data?.per_page ??
      fallback.per_page ??
      15,

    total:
      meta.total ??
      data?.total ??
      fallback.total ??
      0,

    from:
      meta.from ??
      data?.from ??
      fallback.from ??
      null,

    to:
      meta.to ??
      data?.to ??
      fallback.to ??
      null,
  };
};

const getErrorMessage = (error) =>
  error?.serviceMessage ||
  error?.response?.data?.message ||
  error?.response?.data?.errors?.message?.[0] ||
  error?.message ||
  "An unexpected error occurred. Please try again.";

const getValidationErrors = (error) =>
  error?.response?.data?.errors ?? null;

/**
 * Laravel resources may return a collection directly or inside
 * a data object containing a collection.
 */
const getCollection = (response) => {
  const data = getResponseData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.plot_sales)) {
    return data.plot_sales;
  }

  if (Array.isArray(data?.sales)) {
    return data.sales;
  }

  return [];
};

/**
 * Extract a single sale resource.
 */
const getSale = (response) => {
  const data = getResponseData(response);

  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  if (data?.plot_sale) {
    return data.plot_sale;
  }

  if (data?.sale) {
    return data.sale;
  }

  if (data?.data && !Array.isArray(data.data)) {
    return data.data;
  }

  return data;
};

/**
 * Update an existing sale in the Redux collection.
 */
const upsertSale = (state, sale) => {
  if (!sale?.id) return;

  const index = state.plotSales.findIndex(
    (item) => Number(item.id) === Number(sale.id),
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
    Number(state.selectedPlotSale.id) === Number(sale.id)
  ) {
    state.selectedPlotSale = {
      ...state.selectedPlotSale,
      ...sale,
    };
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
        pagination: getPagination(response),
        filters,
        message: response.message,
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error),
        validationErrors: getValidationErrors(error),
      });
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
        pagination: getPagination(response),
        filters: { ...filters, search },
        message: response.message,
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error),
        validationErrors: getValidationErrors(error),
      });
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
        message: response.message,
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error),
        validationErrors: getValidationErrors(error),
      });
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
      return rejectWithValue({
        message: getErrorMessage(error),
        validationErrors: getValidationErrors(error),
      });
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
      return rejectWithValue({
        message: getErrorMessage(error),
        validationErrors: getValidationErrors(error),
      });
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
      return rejectWithValue({
        message: getErrorMessage(error),
        validationErrors: getValidationErrors(error),
      });
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
      return rejectWithValue({
        message: getErrorMessage(error),
        validationErrors: getValidationErrors(error),
      });
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
  async ({ id, reason = null }, { rejectWithValue }) => {
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
      return rejectWithValue({
        message: getErrorMessage(error),
        validationErrors: getValidationErrors(error),
      });
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
      return rejectWithValue({
        message: getErrorMessage(error),
        validationErrors: getValidationErrors(error),
      });
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
        pagination: getPagination(response),
        message: response.message,
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error),
        validationErrors: getValidationErrors(error),
      });
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

      return {
        statistics: getResponseData(response),
        message: response.message,
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error),
        validationErrors: getValidationErrors(error),
      });
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

      return {
        report: getResponseData(response),
        message: response.message,
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error),
        validationErrors: getValidationErrors(error),
      });
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
      return rejectWithValue({
        message: getErrorMessage(error),
        validationErrors: getValidationErrors(error),
      });
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
      const response =
        await plotSaleService.forceDelete(id);

      return {
        id,
        message: getResponseMessage(
          response,
          "Plot sale permanently deleted.",
        ),
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error),
        validationErrors: getValidationErrors(error),
      });
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
    /*
    |--------------------------------------------------------------------------
    | LOCAL STATE
    |--------------------------------------------------------------------------
    */

    setSelectedPlotSale: (state, action) => {
      state.selectedPlotSale = action.payload;
      state.error = null;
      state.validationErrors = null;
    },

    clearSelectedPlotSale: (state) => {
      state.selectedPlotSale = null;
    },

    setPlotSalesFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    clearPlotSalesFilters: (state) => {
      state.filters = {};
    },

    setPlotSalesPage: (state, action) => {
      state.pagination.current_page = action.payload;
    },

    setPlotSalesPerPage: (state, action) => {
      state.pagination.per_page = action.payload;
      state.pagination.current_page = 1;
    },

    clearPlotSalesError: (state) => {
      state.error = null;
      state.validationErrors = null;
    },

    clearPlotSalesMessage: (state) => {
      state.message = null;
    },

    clearPlotSalesReport: (state) => {
      state.report = null;
    },

    clearPlotSalesStatistics: (state) => {
      state.statistics = null;
    },

    clearPlotSalesState: () => initialState,
  },

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | FETCH ALL
      |--------------------------------------------------------------------------
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
        state.error =
          action.payload?.message ||
          "Failed to fetch plot sales.";
        state.validationErrors =
          action.payload?.validationErrors || null;
      })

      /*
      |--------------------------------------------------------------------------
      | SEARCH
      |--------------------------------------------------------------------------
      */

      .addCase(searchPlotSales.pending, (state) => {
        state.loading = true;
        state.error = null;
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
        state.error =
          action.payload?.message ||
          "Failed to search plot sales.";
        state.validationErrors =
          action.payload?.validationErrors || null;
      })

      /*
      |--------------------------------------------------------------------------
      | FETCH SINGLE
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPlotSaleById.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })

      .addCase(fetchPlotSaleById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedPlotSale = action.payload.sale;
        state.message = action.payload.message || null;

        upsertSale(state, action.payload.sale);
      })

      .addCase(fetchPlotSaleById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to fetch plot sale details.";
      })

      /*
      |--------------------------------------------------------------------------
      | CREATE
      |--------------------------------------------------------------------------
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

        if (sale) {
          upsertSale(state, sale);
          state.selectedPlotSale = sale;
          state.pagination.total += 1;
        }
      })

      .addCase(createPlotSale.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload?.message ||
          "Failed to create plot sale.";
        state.validationErrors =
          action.payload?.validationErrors || null;
      })

      /*
      |--------------------------------------------------------------------------
      | UPDATE
      |--------------------------------------------------------------------------
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
        state.error =
          action.payload?.message ||
          "Failed to update plot sale.";
        state.validationErrors =
          action.payload?.validationErrors || null;
      })

      /*
      |--------------------------------------------------------------------------
      | DELETE
      |--------------------------------------------------------------------------
      */

      .addCase(deletePlotSale.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(deletePlotSale.fulfilled, (state, action) => {
        state.actionLoading = false;

        const id = Number(action.payload.id);

        state.plotSales = state.plotSales.filter(
          (sale) => Number(sale.id) !== id,
        );

        state.outstandingSales =
          state.outstandingSales.filter(
            (sale) => Number(sale.id) !== id,
          );

        if (
          Number(state.selectedPlotSale?.id) === id
        ) {
          state.selectedPlotSale = null;
        }

        state.pagination.total = Math.max(
          0,
          state.pagination.total - 1,
        );

        state.message = action.payload.message;
      })

      .addCase(deletePlotSale.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to delete plot sale.";
      })

      /*
      |--------------------------------------------------------------------------
      | APPROVE
      |--------------------------------------------------------------------------
      */

      .addCase(approvePlotSale.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(approvePlotSale.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.message = action.payload.message;

        if (action.payload.sale) {
          upsertSale(state, action.payload.sale);
        }
      })

      .addCase(approvePlotSale.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to approve plot sale.";
      })

      /*
      |--------------------------------------------------------------------------
      | CANCEL
      |--------------------------------------------------------------------------
      */

      .addCase(cancelPlotSale.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(cancelPlotSale.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.message = action.payload.message;

        if (action.payload.sale) {
          upsertSale(state, action.payload.sale);
        }
      })

      .addCase(cancelPlotSale.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to cancel plot sale.";
      })

      /*
      |--------------------------------------------------------------------------
      | COMPLETE
      |--------------------------------------------------------------------------
      */

      .addCase(completePlotSale.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(completePlotSale.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.message = action.payload.message;

        if (action.payload.sale) {
          upsertSale(state, action.payload.sale);
        }
      })

      .addCase(completePlotSale.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to complete plot sale.";
      })

      /*
      |--------------------------------------------------------------------------
      | OUTSTANDING
      |--------------------------------------------------------------------------
      */

      .addCase(fetchOutstandingPlotSales.pending, (state) => {
        state.outstandingLoading = true;
        state.error = null;
      })

      .addCase(
        fetchOutstandingPlotSales.fulfilled,
        (state, action) => {
          state.outstandingLoading = false;
          state.outstandingSales = action.payload.items;
        },
      )

      .addCase(
        fetchOutstandingPlotSales.rejected,
        (state, action) => {
          state.outstandingLoading = false;
          state.error =
            action.payload?.message ||
            "Failed to fetch outstanding plot sales.";
        },
      )

      /*
      |--------------------------------------------------------------------------
      | STATISTICS
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPlotSalesStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.error = null;
      })

      .addCase(
        fetchPlotSalesStatistics.fulfilled,
        (state, action) => {
          state.statisticsLoading = false;
          state.statistics = action.payload.statistics;
        },
      )

      .addCase(
        fetchPlotSalesStatistics.rejected,
        (state, action) => {
          state.statisticsLoading = false;
          state.error =
            action.payload?.message ||
            "Failed to fetch plot sales statistics.";
        },
      )

      /*
      |--------------------------------------------------------------------------
      | REPORT
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPlotSalesReport.pending, (state) => {
        state.reportLoading = true;
        state.error = null;
      })

      .addCase(
        fetchPlotSalesReport.fulfilled,
        (state, action) => {
          state.reportLoading = false;
          state.report = action.payload.report;
        },
      )

      .addCase(
        fetchPlotSalesReport.rejected,
        (state, action) => {
          state.reportLoading = false;
          state.error =
            action.payload?.message ||
            "Failed to generate plot sales report.";
        },
      )

      /*
      |--------------------------------------------------------------------------
      | RESTORE
      |--------------------------------------------------------------------------
      */

      .addCase(restorePlotSale.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(restorePlotSale.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.message = action.payload.message;

        if (action.payload.sale) {
          upsertSale(state, action.payload.sale);
        }
      })

      .addCase(restorePlotSale.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to restore plot sale.";
      })

      /*
      |--------------------------------------------------------------------------
      | FORCE DELETE
      |--------------------------------------------------------------------------
      */

      .addCase(forceDeletePlotSale.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })

      .addCase(
        forceDeletePlotSale.fulfilled,
        (state, action) => {
          state.actionLoading = false;

          const id = Number(action.payload.id);

          state.plotSales = state.plotSales.filter(
            (sale) => Number(sale.id) !== id,
          );

          state.outstandingSales =
            state.outstandingSales.filter(
              (sale) => Number(sale.id) !== id,
            );

          if (
            Number(state.selectedPlotSale?.id) === id
          ) {
            state.selectedPlotSale = null;
          }

          state.pagination.total = Math.max(
            0,
            state.pagination.total - 1,
          );

          state.message = action.payload.message;
        },
      )

      .addCase(
        forceDeletePlotSale.rejected,
        (state, action) => {
          state.actionLoading = false;
          state.error =
            action.payload?.message ||
            "Failed to permanently delete plot sale.";
        },
      );
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
  clearPlotSalesError,
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

export const selectPlotSalesFilters = (state) =>
  state.plotSales.filters;

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

export const selectPlotSalesValidationErrors = (state) =>
  state.plotSales.validationErrors;

export const selectPlotSalesMessage = (state) =>
  state.plotSales.message;

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export default plotSalesSlice.reducer;