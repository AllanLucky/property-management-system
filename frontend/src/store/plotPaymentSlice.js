
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import plotPaymentService from "../services/plotPayment.service";

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

const initialPagination = {
  current_page: 1,
  last_page: 1,
  per_page: DEFAULT_PER_PAGE,
  total: 0,
  from: null,
  to: null,
  has_more_pages: false,
};

const initialLinks = {
  first: null,
  last: null,
  prev: null,
  next: null,
};

const initialState = {
  // Payment records
  payments: [],
  selectedPayment: null,
  salePayments: [],
  statusPayments: [],

  // Statistics
  statistics: {},

  // Pagination
  pagination: initialPagination,
  links: initialLinks,

  // Filters
  filters: {},
  search: "",

  // Loading states
  loading: false,
  detailsLoading: false,
  statisticsLoading: false,
  salePaymentsLoading: false,
  statusPaymentsLoading: false,

  creating: false,
  updating: false,
  deleting: false,
  statusUpdating: false,
  restoring: false,
  forceDeleting: false,

  // Error states
  error: null,
  detailsError: null,
  statisticsError: null,
  salePaymentsError: null,
  statusPaymentsError: null,

  // Last successful operation
  lastMessage: null,
};

/*
|--------------------------------------------------------------------------
| ERROR HELPER
|--------------------------------------------------------------------------
*/

const getErrorMessage = (
  error,
  fallback = "An unexpected error occurred. Please try again.",
) => {
  if (typeof error === "string") {
    return error;
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  return plotPaymentService.getErrorMessage
    ? plotPaymentService.getErrorMessage(error, fallback)
    : fallback;
};

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

const normalizeListResponse = (response) => ({
  data: Array.isArray(response?.data)
    ? response.data
    : [],

  meta: {
    ...initialPagination,
    ...(response?.meta ?? {}),
  },

  links: {
    ...initialLinks,
    ...(response?.links ?? {}),
  },

  message: response?.message ?? null,
});

const normalizeRelatedResponse = (response) => ({
  data: Array.isArray(response?.data)
    ? response.data
    : [],

  meta: {
    ...initialPagination,
    ...(response?.meta ?? {}),
  },

  links: {
    ...initialLinks,
    ...(response?.links ?? {}),
  },

  message: response?.message ?? null,
});

/*
|--------------------------------------------------------------------------
| FETCH ALL PLOT PAYMENTS
|--------------------------------------------------------------------------
|
| GET /api/plot-payments
|
*/

export const fetchPlotPayments = createAsyncThunk(
  "plotPayments/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await plotPaymentService.getAll(params);

      return normalizeListResponse(response);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to fetch plot payments.",
        ),
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| FETCH SINGLE PLOT PAYMENT
|--------------------------------------------------------------------------
|
| GET /api/plot-payments/{id}
|
*/

export const fetchPlotPaymentById = createAsyncThunk(
  "plotPayments/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Payment ID is required.");
      }

      return await plotPaymentService.getById(id);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to fetch plot payment details.",
        ),
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| CREATE PLOT PAYMENT
|--------------------------------------------------------------------------
|
| POST /api/plot-payments
|
*/

export const createPlotPayment = createAsyncThunk(
  "plotPayments/create",
  async (paymentData, { rejectWithValue }) => {
    try {
      return await plotPaymentService.create(paymentData);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to create plot payment.",
        ),
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| UPDATE PLOT PAYMENT
|--------------------------------------------------------------------------
|
| PUT /api/plot-payments/{id}
|
*/

export const updatePlotPayment = createAsyncThunk(
  "plotPayments/update",
  async (
    { id, paymentData },
    { rejectWithValue },
  ) => {
    try {
      if (!id) {
        return rejectWithValue("Payment ID is required.");
      }

      return await plotPaymentService.update(
        id,
        paymentData,
      );
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to update plot payment.",
        ),
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| DELETE PLOT PAYMENT
|--------------------------------------------------------------------------
|
| DELETE /api/plot-payments/{id}
|
*/

export const deletePlotPayment = createAsyncThunk(
  "plotPayments/delete",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Payment ID is required.");
      }

      const response = await plotPaymentService.delete(id);

      return {
        id: Number(id),
        message:
          response?.message ??
          "Plot payment deleted successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to delete plot payment.",
        ),
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| SEARCH PLOT PAYMENTS
|--------------------------------------------------------------------------
|
| GET /api/plot-payments/search
|
*/

export const searchPlotPayments = createAsyncThunk(
  "plotPayments/search",
  async (
    { search, filters = {} } = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await plotPaymentService.search(
        search,
        filters,
      );

      return {
        ...normalizeListResponse(response),
        search: search ?? "",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to search plot payments.",
        ),
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| FETCH PLOT PAYMENT STATISTICS
|--------------------------------------------------------------------------
|
| GET /api/plot-payments/statistics
|
*/

export const fetchPlotPaymentStatistics = createAsyncThunk(
  "plotPayments/fetchStatistics",
  async (filters = {}, { rejectWithValue }) => {
    try {
      return await plotPaymentService.getStatistics(filters);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to fetch plot payment statistics.",
        ),
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| FETCH PAYMENTS BY PLOT SALE
|--------------------------------------------------------------------------
|
| GET /api/plot-payments/sale/{plotSaleId}
|
*/

export const fetchPaymentsBySale = createAsyncThunk(
  "plotPayments/fetchBySale",
  async (
    { plotSaleId, params = {} },
    { rejectWithValue },
  ) => {
    try {
      if (!plotSaleId) {
        return rejectWithValue("Plot sale ID is required.");
      }

      const response = await plotPaymentService.getBySale(
        plotSaleId,
        params,
      );

      return normalizeRelatedResponse(response);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to fetch payments for this plot sale.",
        ),
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| FETCH PAYMENTS BY STATUS
|--------------------------------------------------------------------------
|
| GET /api/plot-payments/status/{status}
|
*/

export const fetchPaymentsByStatus = createAsyncThunk(
  "plotPayments/fetchByStatus",
  async (
    { status, params = {} },
    { rejectWithValue },
  ) => {
    try {
      if (!status) {
        return rejectWithValue("Payment status is required.");
      }

      const response = await plotPaymentService.getByStatus(
        status,
        params,
      );

      return normalizeRelatedResponse(response);
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to fetch payments by status.",
        ),
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| UPDATE PLOT PAYMENT STATUS
|--------------------------------------------------------------------------
|
| PATCH /api/plot-payments/{id}/status
|
*/

export const updatePlotPaymentStatus = createAsyncThunk(
  "plotPayments/updateStatus",
  async (
    { id, status },
    { rejectWithValue },
  ) => {
    try {
      if (!id) {
        return rejectWithValue("Payment ID is required.");
      }

      if (!status) {
        return rejectWithValue("Payment status is required.");
      }

      return await plotPaymentService.updateStatus(
        id,
        status,
      );
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to update payment status.",
        ),
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| RESTORE PLOT PAYMENT
|--------------------------------------------------------------------------
|
| POST /api/plot-payments/{id}/restore
|
*/

export const restorePlotPayment = createAsyncThunk(
  "plotPayments/restore",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Payment ID is required.");
      }

      const response = await plotPaymentService.restore(id);

      return {
        id: Number(id),
        payment: response?.data ?? null,
        message:
          response?.message ??
          "Plot payment restored successfully.",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to restore plot payment.",
        ),
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| PERMANENTLY DELETE PLOT PAYMENT
|--------------------------------------------------------------------------
|
| DELETE /api/plot-payments/{id}/force
|
*/

export const forceDeletePlotPayment = createAsyncThunk(
  "plotPayments/forceDelete",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue("Payment ID is required.");
      }

      const response =
        await plotPaymentService.forceDelete(id);

      return {
        id: Number(id),
        message:
          response?.message ??
          "Plot payment permanently deleted.",
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to permanently delete plot payment.",
        ),
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/

const plotPaymentSlice = createSlice({
  name: "plotPayments",

  initialState,

  reducers: {
    /*
    |--------------------------------------------------------------------------
    | SELECT PAYMENT
    |--------------------------------------------------------------------------
    */

    setSelectedPlotPayment: (state, action) => {
      state.selectedPayment = action.payload;
    },

    clearSelectedPlotPayment: (state) => {
      state.selectedPayment = null;
      state.detailsError = null;
    },

    /*
    |--------------------------------------------------------------------------
    | SET PAYMENTS
    |--------------------------------------------------------------------------
    */

    setPlotPayments: (state, action) => {
      state.payments = Array.isArray(action.payload)
        ? action.payload
        : [];
    },

    /*
    |--------------------------------------------------------------------------
    | SET STATISTICS
    |--------------------------------------------------------------------------
    */

    setPlotPaymentStatistics: (state, action) => {
      state.statistics = action.payload ?? {};
    },

    /*
    |--------------------------------------------------------------------------
    | SET FILTERS
    |--------------------------------------------------------------------------
    */

    setPlotPaymentFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...(action.payload ?? {}),
      };

      state.pagination.current_page = 1;
    },

    clearPlotPaymentFilters: (state) => {
      state.filters = {};
      state.search = "";
      state.pagination.current_page = 1;
    },

    /*
    |--------------------------------------------------------------------------
    | SET SEARCH
    |--------------------------------------------------------------------------
    */

    setPlotPaymentSearch: (state, action) => {
      state.search = action.payload ?? "";
      state.pagination.current_page = 1;
    },

    /*
    |--------------------------------------------------------------------------
    | SET PAGINATION
    |--------------------------------------------------------------------------
    */

    setPlotPaymentPage: (state, action) => {
      const page = Math.max(1, Number(action.payload) || 1);

      state.pagination.current_page = Math.min(
        page,
        state.pagination.last_page || 1,
      );
    },

    setPlotPaymentPerPage: (state, action) => {
      state.pagination.per_page = Math.min(
        100,
        Math.max(1, Number(action.payload) || DEFAULT_PER_PAGE),
      );

      state.pagination.current_page = 1;
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR ERRORS
    |--------------------------------------------------------------------------
    */

    clearPlotPaymentErrors: (state) => {
      state.error = null;
      state.detailsError = null;
      state.statisticsError = null;
      state.salePaymentsError = null;
      state.statusPaymentsError = null;
    },

    clearPlotPaymentError: (state) => {
      state.error = null;
    },

    clearPlotPaymentDetailsError: (state) => {
      state.detailsError = null;
    },

    clearPlotPaymentStatisticsError: (state) => {
      state.statisticsError = null;
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR LAST MESSAGE
    |--------------------------------------------------------------------------
    */

    clearPlotPaymentMessage: (state) => {
      state.lastMessage = null;
    },

    /*
    |--------------------------------------------------------------------------
    | RESET SLICE
    |--------------------------------------------------------------------------
    */

    resetPlotPayments: () => initialState,
  },

  /*
  |--------------------------------------------------------------------------
  | EXTRA REDUCERS
  |--------------------------------------------------------------------------
  */

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | FETCH ALL
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPlotPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchPlotPayments.fulfilled, (state, action) => {
        state.loading = false;

        state.payments = action.payload.data;

        state.pagination = {
          ...initialPagination,
          ...action.payload.meta,
        };

        state.links = {
          ...initialLinks,
          ...action.payload.links,
        };

        state.lastMessage = action.payload.message;
      })

      .addCase(fetchPlotPayments.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ??
          "Failed to fetch plot payments.";
      })

      /*
      |--------------------------------------------------------------------------
      | FETCH SINGLE PAYMENT
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPlotPaymentById.pending, (state) => {
        state.detailsLoading = true;
        state.detailsError = null;
      })

      .addCase(fetchPlotPaymentById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedPayment = action.payload;
      })

      .addCase(fetchPlotPaymentById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.detailsError =
          action.payload ??
          "Failed to fetch plot payment details.";
      })

      /*
      |--------------------------------------------------------------------------
      | CREATE PAYMENT
      |--------------------------------------------------------------------------
      */

      .addCase(createPlotPayment.pending, (state) => {
        state.creating = true;
        state.error = null;
        state.lastMessage = null;
      })

      .addCase(createPlotPayment.fulfilled, (state, action) => {
        state.creating = false;

        state.selectedPayment = action.payload;

        if (
          action.payload &&
          !state.payments.some(
            (payment) => payment.id === action.payload.id,
          )
        ) {
          state.payments.unshift(action.payload);
          state.pagination.total += 1;
        }

        state.lastMessage = "Plot payment created successfully.";
      })

      .addCase(createPlotPayment.rejected, (state, action) => {
        state.creating = false;
        state.error =
          action.payload ??
          "Failed to create plot payment.";
      })

      /*
      |--------------------------------------------------------------------------
      | UPDATE PAYMENT
      |--------------------------------------------------------------------------
      */

      .addCase(updatePlotPayment.pending, (state) => {
        state.updating = true;
        state.error = null;
      })

      .addCase(updatePlotPayment.fulfilled, (state, action) => {
        state.updating = false;

        const updatedPayment = action.payload;

        if (updatedPayment) {
          const index = state.payments.findIndex(
            (payment) => payment.id === updatedPayment.id,
          );

          if (index !== -1) {
            state.payments[index] = updatedPayment;
          }

          if (
            state.selectedPayment?.id === updatedPayment.id
          ) {
            state.selectedPayment = updatedPayment;
          }
        }

        state.lastMessage = "Plot payment updated successfully.";
      })

      .addCase(updatePlotPayment.rejected, (state, action) => {
        state.updating = false;
        state.error =
          action.payload ??
          "Failed to update plot payment.";
      })

      /*
      |--------------------------------------------------------------------------
      | DELETE PAYMENT
      |--------------------------------------------------------------------------
      */

      .addCase(deletePlotPayment.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })

      .addCase(deletePlotPayment.fulfilled, (state, action) => {
        state.deleting = false;

        const deletedId = action.payload.id;

        state.payments = state.payments.filter(
          (payment) => Number(payment.id) !== deletedId,
        );

        if (
          Number(state.selectedPayment?.id) === deletedId
        ) {
          state.selectedPayment = null;
        }

        state.pagination.total = Math.max(
          0,
          state.pagination.total - 1,
        );

        state.lastMessage = action.payload.message;
      })

      .addCase(deletePlotPayment.rejected, (state, action) => {
        state.deleting = false;
        state.error =
          action.payload ??
          "Failed to delete plot payment.";
      })

      /*
      |--------------------------------------------------------------------------
      | SEARCH PAYMENTS
      |--------------------------------------------------------------------------
      */

      .addCase(searchPlotPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(searchPlotPayments.fulfilled, (state, action) => {
        state.loading = false;

        state.payments = action.payload.data;
        state.pagination = {
          ...initialPagination,
          ...action.payload.meta,
        };

        state.links = {
          ...initialLinks,
          ...action.payload.links,
        };

        state.search = action.payload.search;
        state.lastMessage = action.payload.message;
      })

      .addCase(searchPlotPayments.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ??
          "Failed to search plot payments.";
      })

      /*
      |--------------------------------------------------------------------------
      | STATISTICS
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPlotPaymentStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.statisticsError = null;
      })

      .addCase(fetchPlotPaymentStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.statistics = action.payload ?? {};
      })

      .addCase(fetchPlotPaymentStatistics.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.statisticsError =
          action.payload ??
          "Failed to fetch plot payment statistics.";
      })

      /*
      |--------------------------------------------------------------------------
      | PAYMENTS BY SALE
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPaymentsBySale.pending, (state) => {
        state.salePaymentsLoading = true;
        state.salePaymentsError = null;
      })

      .addCase(fetchPaymentsBySale.fulfilled, (state, action) => {
        state.salePaymentsLoading = false;
        state.salePayments = action.payload.data;
      })

      .addCase(fetchPaymentsBySale.rejected, (state, action) => {
        state.salePaymentsLoading = false;
        state.salePaymentsError =
          action.payload ??
          "Failed to fetch payments for this plot sale.";
      })

      /*
      |--------------------------------------------------------------------------
      | PAYMENTS BY STATUS
      |--------------------------------------------------------------------------
      */

      .addCase(fetchPaymentsByStatus.pending, (state) => {
        state.statusPaymentsLoading = true;
        state.statusPaymentsError = null;
      })

      .addCase(fetchPaymentsByStatus.fulfilled, (state, action) => {
        state.statusPaymentsLoading = false;
        state.statusPayments = action.payload.data;
      })

      .addCase(fetchPaymentsByStatus.rejected, (state, action) => {
        state.statusPaymentsLoading = false;
        state.statusPaymentsError =
          action.payload ??
          "Failed to fetch payments by status.";
      })

      /*
      |--------------------------------------------------------------------------
      | UPDATE PAYMENT STATUS
      |--------------------------------------------------------------------------
      */

      .addCase(updatePlotPaymentStatus.pending, (state) => {
        state.statusUpdating = true;
        state.error = null;
      })

      .addCase(updatePlotPaymentStatus.fulfilled, (state, action) => {
        state.statusUpdating = false;

        const updatedPayment = action.payload;

        if (updatedPayment) {
          const index = state.payments.findIndex(
            (payment) => payment.id === updatedPayment.id,
          );

          if (index !== -1) {
            state.payments[index] = updatedPayment;
          }

          if (
            state.selectedPayment?.id === updatedPayment.id
          ) {
            state.selectedPayment = updatedPayment;
          }
        }

        state.lastMessage = "Payment status updated successfully.";
      })

      .addCase(updatePlotPaymentStatus.rejected, (state, action) => {
        state.statusUpdating = false;
        state.error =
          action.payload ??
          "Failed to update payment status.";
      })

      /*
      |--------------------------------------------------------------------------
      | RESTORE PAYMENT
      |--------------------------------------------------------------------------
      */

      .addCase(restorePlotPayment.pending, (state) => {
        state.restoring = true;
        state.error = null;
      })

      .addCase(restorePlotPayment.fulfilled, (state, action) => {
        state.restoring = false;

        const restoredPayment = action.payload.payment;

        if (
          restoredPayment &&
          !state.payments.some(
            (payment) => payment.id === restoredPayment.id,
          )
        ) {
          state.payments.unshift(restoredPayment);
          state.pagination.total += 1;
        }

        state.lastMessage = action.payload.message;
      })

      .addCase(restorePlotPayment.rejected, (state, action) => {
        state.restoring = false;
        state.error =
          action.payload ??
          "Failed to restore plot payment.";
      })

      /*
      |--------------------------------------------------------------------------
      | FORCE DELETE PAYMENT
      |--------------------------------------------------------------------------
      */

      .addCase(forceDeletePlotPayment.pending, (state) => {
        state.forceDeleting = true;
        state.error = null;
      })

      .addCase(forceDeletePlotPayment.fulfilled, (state, action) => {
        state.forceDeleting = false;

        const deletedId = action.payload.id;

        state.payments = state.payments.filter(
          (payment) => Number(payment.id) !== deletedId,
        );

        if (
          Number(state.selectedPayment?.id) === deletedId
        ) {
          state.selectedPayment = null;
        }

        state.pagination.total = Math.max(
          0,
          state.pagination.total - 1,
        );

        state.lastMessage = action.payload.message;
      })

      .addCase(forceDeletePlotPayment.rejected, (state, action) => {
        state.forceDeleting = false;
        state.error =
          action.payload ??
          "Failed to permanently delete plot payment.";
      });
  },
});

/*
|--------------------------------------------------------------------------
| ACTIONS
|--------------------------------------------------------------------------
*/

export const {
  setSelectedPlotPayment,
  clearSelectedPlotPayment,
  setPlotPayments,
  setPlotPaymentStatistics,
  setPlotPaymentFilters,
  clearPlotPaymentFilters,
  setPlotPaymentSearch,
  setPlotPaymentPage,
  setPlotPaymentPerPage,
  clearPlotPaymentErrors,
  clearPlotPaymentError,
  clearPlotPaymentDetailsError,
  clearPlotPaymentStatisticsError,
  clearPlotPaymentMessage,
  resetPlotPayments,
} = plotPaymentSlice.actions;

/*
|--------------------------------------------------------------------------
| SELECTORS
|--------------------------------------------------------------------------
*/

export const selectPlotPayments = (state) =>
  state.plotPayments?.payments ?? [];

export const selectSelectedPlotPayment = (state) =>
  state.plotPayments?.selectedPayment ?? null;

export const selectPlotPaymentStatistics = (state) =>
  state.plotPayments?.statistics ?? {};

export const selectPlotPaymentPagination = (state) =>
  state.plotPayments?.pagination ?? initialPagination;

export const selectPlotPaymentLinks = (state) =>
  state.plotPayments?.links ?? initialLinks;

export const selectPlotPaymentFilters = (state) =>
  state.plotPayments?.filters ?? {};

export const selectPlotPaymentSearch = (state) =>
  state.plotPayments?.search ?? "";

export const selectPlotPaymentLoading = (state) =>
  state.plotPayments?.loading ?? false;

export const selectPlotPaymentStatisticsLoading = (state) =>
  state.plotPayments?.statisticsLoading ?? false;

export const selectPlotPaymentError = (state) =>
  state.plotPayments?.error ?? null;

/*
|--------------------------------------------------------------------------
| EXPORT REDUCER
|--------------------------------------------------------------------------
*/

export default plotPaymentSlice.reducer;
