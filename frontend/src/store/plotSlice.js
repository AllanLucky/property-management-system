
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import plotService from "../services/plot.service";

/*
|--------------------------------------------------------------------------
| Initial State
|--------------------------------------------------------------------------
*/

const initialState = {
  plots: [],
  availablePlots: [],
  currentPlot: null,

  statistics: {
    total: 0,
    available: 0,
    reserved: 0,
    sold: 0,
    unavailable: 0,
    total_value: 0,
  },

  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
    from: null,
    to: null,
  },

  filters: {
    search: "",
    status: "",
    county_id: "",
    city_id: "",
    area_id: "",
    property_id: "",
    min_price: "",
    max_price: "",
    size_unit: "",
    is_active: "",
    sort_by: "created_at",
    sort_direction: "desc",
  },

  loading: false,
  submitting: false,
  statisticsLoading: false,
  availabilityLoading: false,

  error: null,
  validationErrors: {},
  message: null,
};

/*
|--------------------------------------------------------------------------
| Response Helpers
|--------------------------------------------------------------------------
*/

const extractError = (error) => ({
  message:
    error?.response?.data?.message ||
    error?.message ||
    "An unexpected error occurred.",

  errors: error?.response?.data?.errors || error?.errors || {},
});

const extractPayload = (response) => {
  if (response?.data && !Array.isArray(response.data)) {
    return response.data;
  }

  return response;
};

const extractPlots = (response) => {
  const payload = extractPayload(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.plots)) {
    return payload.plots;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
};

const extractPlot = (response) => {
  const payload = extractPayload(response);

  if (payload?.plot && typeof payload.plot === "object") {
    return payload.plot;
  }

  if (
    payload?.data &&
    !Array.isArray(payload.data) &&
    typeof payload.data === "object"
  ) {
    return payload.data;
  }

  return payload;
};

const extractPagination = (response, fallback = {}) => {
  const payload = extractPayload(response);

  const meta =
    response?.meta ||
    payload?.meta ||
    payload?.pagination ||
    {};

  return {
    current_page:
      Number(meta.current_page ?? fallback.current_page ?? 1),

    last_page:
      Number(meta.last_page ?? fallback.last_page ?? 1),

    per_page:
      Number(meta.per_page ?? fallback.per_page ?? 25),

    total:
      Number(meta.total ?? fallback.total ?? 0),

    from: meta.from ?? fallback.from ?? null,
    to: meta.to ?? fallback.to ?? null,
  };
};

const extractStatistics = (response) => {
  const payload = extractPayload(response);

  const data =
    payload?.statistics ||
    payload?.stats ||
    payload?.data ||
    payload;

  return data && typeof data === "object" && !Array.isArray(data)
    ? data
    : {};
};

/*
|--------------------------------------------------------------------------
| Async Thunks
|--------------------------------------------------------------------------
*/

/**
 * Fetch all plots with filters and pagination.
 */
export const fetchPlots = createAsyncThunk(
  "plots/fetchPlots",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await plotService.getPlots(params);

      return {
        plots: extractPlots(response),
        pagination: extractPagination(response, {
          current_page: params.page ?? 1,
          per_page: params.per_page ?? 25,
        }),
        message: response?.message || null,
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/**
 * Fetch one plot.
 */
export const fetchPlotById = createAsyncThunk(
  "plots/fetchPlotById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await plotService.getPlotById(id);

      return {
        plot: extractPlot(response),
        message: response?.message || null,
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/**
 * Create a plot.
 */
export const createPlot = createAsyncThunk(
  "plots/createPlot",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await plotService.createPlot(payload);

      return {
        plot: extractPlot(response),
        message: response?.message || "Plot created successfully.",
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/**
 * Update a plot.
 */
export const updatePlot = createAsyncThunk(
  "plots/updatePlot",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await plotService.updatePlot(id, payload);

      return {
        plot: extractPlot(response),
        message: response?.message || "Plot updated successfully.",
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/**
 * Partially update a plot.
 */
export const patchPlot = createAsyncThunk(
  "plots/patchPlot",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await plotService.patchPlot(id, payload);

      return {
        plot: extractPlot(response),
        message: response?.message || "Plot updated successfully.",
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/**
 * Delete a plot.
 */
export const deletePlot = createAsyncThunk(
  "plots/deletePlot",
  async (id, { rejectWithValue }) => {
    try {
      const response = await plotService.deletePlot(id);

      return {
        id,
        message: response?.message || "Plot deleted successfully.",
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/**
 * Restore a soft-deleted plot.
 */
export const restorePlot = createAsyncThunk(
  "plots/restorePlot",
  async (id, { rejectWithValue }) => {
    try {
      const response = await plotService.restorePlot(id);

      return {
        id,
        plot: extractPlot(response),
        message: response?.message || "Plot restored successfully.",
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/**
 * Permanently delete a plot.
 */
export const forceDeletePlot = createAsyncThunk(
  "plots/forceDeletePlot",
  async (id, { rejectWithValue }) => {
    try {
      const response = await plotService.forceDeletePlot(id);

      return {
        id,
        message:
          response?.message ||
          "Plot permanently deleted successfully.",
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/**
 * Fetch plots available for sale.
 */
export const fetchAvailablePlots = createAsyncThunk(
  "plots/fetchAvailablePlots",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await plotService.getAvailablePlots(params);

      return {
        plots: extractPlots(response),
        pagination: extractPagination(response, {
          current_page: params.page ?? 1,
          per_page: params.per_page ?? 25,
        }),
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/**
 * Check a plot's availability.
 */
export const checkPlotAvailability = createAsyncThunk(
  "plots/checkAvailability",
  async (id, { rejectWithValue }) => {
    try {
      const response =
        await plotService.checkPlotAvailability(id);

      return {
        id,
        data: extractPayload(response),
        message: response?.message || null,
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/**
 * Update plot status.
 */
export const updatePlotStatus = createAsyncThunk(
  "plots/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await plotService.updatePlotStatus(
        id,
        status
      );

      return {
        plot: extractPlot(response),
        id,
        status,
        message: response?.message || "Plot status updated.",
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/**
 * Fetch general plot statistics.
 */
export const fetchPlotStatistics = createAsyncThunk(
  "plots/fetchStatistics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await plotService.getPlotStatistics(params);

      return {
        statistics: extractStatistics(response),
        message: response?.message || null,
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/**
 * Fetch inventory statistics.
 */
export const fetchPlotInventoryStatistics = createAsyncThunk(
  "plots/fetchInventoryStatistics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response =
        await plotService.getPlotInventoryStatistics(params);

      return {
        statistics: extractStatistics(response),
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/**
 * Fetch sales statistics.
 */
export const fetchPlotSalesStatistics = createAsyncThunk(
  "plots/fetchSalesStatistics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response =
        await plotService.getPlotSalesStatistics(params);

      return {
        statistics: extractStatistics(response),
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/**
 * Fetch payment statistics.
 */
export const fetchPlotPaymentStatistics = createAsyncThunk(
  "plots/fetchPaymentStatistics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response =
        await plotService.getPlotPaymentStatistics(params);

      return {
        statistics: extractStatistics(response),
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| Plot Slice
|--------------------------------------------------------------------------
*/

const plotSlice = createSlice({
  name: "plots",
  initialState,

  reducers: {
    /**
     * Set one filter.
     */
    setPlotFilter: (state, action) => {
      const { name, value } = action.payload || {};

      if (Object.prototype.hasOwnProperty.call(state.filters, name)) {
        state.filters[name] = value;
        state.pagination.current_page = 1;
      }
    },

    /**
     * Set multiple filters.
     */
    setPlotFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...(action.payload || {}),
      };

      state.pagination.current_page = 1;
    },

    /**
     * Reset filters.
     */
    resetPlotFilters: (state) => {
      state.filters = { ...initialState.filters };
      state.pagination.current_page = 1;
    },

    /**
     * Change pagination.
     */
    setPlotPage: (state, action) => {
      state.pagination.current_page = Math.max(
        1,
        Number(action.payload) || 1
      );
    },

    setPlotPerPage: (state, action) => {
      state.pagination.per_page = Math.min(
        100,
        Math.max(1, Number(action.payload) || 25)
      );

      state.pagination.current_page = 1;
    },

    /**
     * Set or clear the selected plot.
     */
    setCurrentPlot: (state, action) => {
      state.currentPlot = action.payload ?? null;
    },

    clearCurrentPlot: (state) => {
      state.currentPlot = null;
    },

    /**
     * Clear errors and messages.
     */
    clearPlotError: (state) => {
      state.error = null;
      state.validationErrors = {};
    },

    clearPlotMessage: (state) => {
      state.message = null;
    },

    clearPlotFeedback: (state) => {
      state.error = null;
      state.validationErrors = {};
      state.message = null;
    },

    /**
     * Reset the entire slice.
     */
    resetPlotState: () => ({ ...initialState }),
  },

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | Fetch Plots
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPlots.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.validationErrors = {};
      })
      .addCase(fetchPlots.fulfilled, (state, action) => {
        state.loading = false;
        state.plots = action.payload.plots;
        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination,
        };
        state.message = action.payload.message;
      })
      .addCase(fetchPlots.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to load plots.";
        state.validationErrors = action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | Fetch Single Plot
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPlotById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlotById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPlot = action.payload.plot;
        state.message = action.payload.message;
      })
      .addCase(fetchPlotById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to load plot.";
        state.validationErrors = action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | Create Plot
      |--------------------------------------------------------------------------
      */

      .addCase(createPlot.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.validationErrors = {};
        state.message = null;
      })
      .addCase(createPlot.fulfilled, (state, action) => {
        state.submitting = false;

        const plot = action.payload.plot;

        if (plot?.id) {
          const exists = state.plots.some(
            (item) => item.id === plot.id
          );

          if (!exists) {
            state.plots.unshift(plot);
            state.pagination.total += 1;
          }

          state.currentPlot = plot;
        }

        state.message = action.payload.message;
      })
      .addCase(createPlot.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to create plot.";
        state.validationErrors = action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | Update Plot
      |--------------------------------------------------------------------------
      */

      .addCase(updatePlot.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.validationErrors = {};
        state.message = null;
      })
      .addCase(updatePlot.fulfilled, (state, action) => {
        state.submitting = false;

        const plot = action.payload.plot;

        if (plot?.id) {
          state.plots = state.plots.map((item) =>
            item.id === plot.id ? { ...item, ...plot } : item
          );

          if (state.currentPlot?.id === plot.id) {
            state.currentPlot = {
              ...state.currentPlot,
              ...plot,
            };
          }
        }

        state.message = action.payload.message;
      })
      .addCase(updatePlot.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to update plot.";
        state.validationErrors = action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | Partial Update
      |--------------------------------------------------------------------------
      */

      .addCase(patchPlot.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.validationErrors = {};
      })
      .addCase(patchPlot.fulfilled, (state, action) => {
        state.submitting = false;

        const plot = action.payload.plot;

        if (plot?.id) {
          state.plots = state.plots.map((item) =>
            item.id === plot.id ? { ...item, ...plot } : item
          );

          if (state.currentPlot?.id === plot.id) {
            state.currentPlot = {
              ...state.currentPlot,
              ...plot,
            };
          }
        }

        state.message = action.payload.message;
      })
      .addCase(patchPlot.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to update plot.";
        state.validationErrors = action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | Delete Plot
      |--------------------------------------------------------------------------
      */

      .addCase(deletePlot.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(deletePlot.fulfilled, (state, action) => {
        state.submitting = false;

        const { id, message } = action.payload;

        state.plots = state.plots.filter(
          (plot) => plot.id !== id
        );

        state.availablePlots = state.availablePlots.filter(
          (plot) => plot.id !== id
        );

        if (state.currentPlot?.id === id) {
          state.currentPlot = null;
        }

        state.pagination.total = Math.max(
          0,
          state.pagination.total - 1
        );

        state.message = message;
      })
      .addCase(deletePlot.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to delete plot.";
        state.validationErrors = action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | Restore Plot
      |--------------------------------------------------------------------------
      */

      .addCase(restorePlot.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(restorePlot.fulfilled, (state, action) => {
        state.submitting = false;

        const plot = action.payload.plot;

        if (plot?.id) {
          const index = state.plots.findIndex(
            (item) => item.id === plot.id
          );

          if (index >= 0) {
            state.plots[index] = plot;
          } else {
            state.plots.unshift(plot);
          }

          state.currentPlot = plot;
        }

        state.message = action.payload.message;
      })
      .addCase(restorePlot.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to restore plot.";
      })

      /*
      |--------------------------------------------------------------------------
      | Force Delete
      |--------------------------------------------------------------------------
      */

      .addCase(forceDeletePlot.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(forceDeletePlot.fulfilled, (state, action) => {
        state.submitting = false;

        const { id, message } = action.payload;

        state.plots = state.plots.filter(
          (plot) => plot.id !== id
        );

        state.availablePlots = state.availablePlots.filter(
          (plot) => plot.id !== id
        );

        if (state.currentPlot?.id === id) {
          state.currentPlot = null;
        }

        state.pagination.total = Math.max(
          0,
          state.pagination.total - 1
        );

        state.message = message;
      })
      .addCase(forceDeletePlot.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to permanently delete plot.";
      })

      /*
      |--------------------------------------------------------------------------
      | Available Plots
      |--------------------------------------------------------------------------
      */

      .addCase(fetchAvailablePlots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailablePlots.fulfilled, (state, action) => {
        state.loading = false;
        state.availablePlots = action.payload.plots;
      })
      .addCase(fetchAvailablePlots.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to load available plots.";
      })

      /*
      |--------------------------------------------------------------------------
      | Availability Check
      |--------------------------------------------------------------------------
      */

      .addCase(checkPlotAvailability.pending, (state) => {
        state.availabilityLoading = true;
        state.error = null;
      })
      .addCase(checkPlotAvailability.fulfilled, (state, action) => {
        state.availabilityLoading = false;

        const { id, data } = action.payload;

        state.plots = state.plots.map((plot) =>
          plot.id === id
            ? { ...plot, availability: data }
            : plot
        );

        if (state.currentPlot?.id === id) {
          state.currentPlot = {
            ...state.currentPlot,
            availability: data,
          };
        }

        state.message = action.payload.message;
      })
      .addCase(checkPlotAvailability.rejected, (state, action) => {
        state.availabilityLoading = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to check plot availability.";
      })

      /*
      |--------------------------------------------------------------------------
      | Update Status
      |--------------------------------------------------------------------------
      */

      .addCase(updatePlotStatus.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updatePlotStatus.fulfilled, (state, action) => {
        state.submitting = false;

        const { id, status, plot, message } = action.payload;

        state.plots = state.plots.map((item) =>
          item.id === id
            ? { ...item, ...(plot || {}), status }
            : item
        );

        state.availablePlots = state.availablePlots.map((item) =>
          item.id === id
            ? { ...item, ...(plot || {}), status }
            : item
        );

        if (state.currentPlot?.id === id) {
          state.currentPlot = {
            ...state.currentPlot,
            ...(plot || {}),
            status,
          };
        }

        state.message = message;
      })
      .addCase(updatePlotStatus.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to update plot status.";
        state.validationErrors = action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | General Statistics
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPlotStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.error = null;
      })
      .addCase(fetchPlotStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.statistics = {
          ...state.statistics,
          ...action.payload.statistics,
        };
      })
      .addCase(fetchPlotStatistics.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to load plot statistics.";
      })

      /*
      |--------------------------------------------------------------------------
      | Inventory Statistics
      |--------------------------------------------------------------------------
      */

      .addCase(
        fetchPlotInventoryStatistics.pending,
        (state) => {
          state.statisticsLoading = true;
          state.error = null;
        }
      )
      .addCase(
        fetchPlotInventoryStatistics.fulfilled,
        (state, action) => {
          state.statisticsLoading = false;
          state.statistics = {
            ...state.statistics,
            ...action.payload.statistics,
          };
        }
      )
      .addCase(
        fetchPlotInventoryStatistics.rejected,
        (state, action) => {
          state.statisticsLoading = false;
          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to load inventory statistics.";
        }
      )

      /*
      |--------------------------------------------------------------------------
      | Sales Statistics
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPlotSalesStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.error = null;
      })
      .addCase(fetchPlotSalesStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.statistics = {
          ...state.statistics,
          ...action.payload.statistics,
        };
      })
      .addCase(fetchPlotSalesStatistics.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to load sales statistics.";
      })

      /*
      |--------------------------------------------------------------------------
      | Payment Statistics
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPlotPaymentStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.error = null;
      })
      .addCase(fetchPlotPaymentStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.statistics = {
          ...state.statistics,
          ...action.payload.statistics,
        };
      })
      .addCase(fetchPlotPaymentStatistics.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to load payment statistics.";
      });
  },
});

/*
|--------------------------------------------------------------------------
| Actions
|--------------------------------------------------------------------------
*/

export const {
  setPlotFilter,
  setPlotFilters,
  resetPlotFilters,
  setPlotPage,
  setPlotPerPage,
  setCurrentPlot,
  clearCurrentPlot,
  clearPlotError,
  clearPlotMessage,
  clearPlotFeedback,
  resetPlotState,
} = plotSlice.actions;

/*
|--------------------------------------------------------------------------
| Selectors
|--------------------------------------------------------------------------
*/

export const selectPlotState = (state) => state.plots;

export const selectPlots = (state) => state.plots?.plots ?? [];

export const selectAvailablePlots = (state) =>
  state.plots?.availablePlots ?? [];

export const selectCurrentPlot = (state) =>
  state.plots?.currentPlot ?? null;

export const selectPlotStatistics = (state) =>
  state.plots?.statistics ?? initialState.statistics;

export const selectPlotPagination = (state) =>
  state.plots?.pagination ?? initialState.pagination;

export const selectPlotFilters = (state) =>
  state.plots?.filters ?? initialState.filters;

export const selectPlotLoading = (state) =>
  state.plots?.loading ?? false;

export const selectPlotSubmitting = (state) =>
  state.plots?.submitting ?? false;

export const selectPlotStatisticsLoading = (state) =>
  state.plots?.statisticsLoading ?? false;

export const selectPlotAvailabilityLoading = (state) =>
  state.plots?.availabilityLoading ?? false;

export const selectPlotError = (state) => state.plots?.error ?? null;

export const selectPlotValidationErrors = (state) =>
  state.plots?.validationErrors ?? {};

export const selectPlotMessage = (state) => state.plots?.message ?? null;

export default plotSlice.reducer;
