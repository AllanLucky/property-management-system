import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import propertyAnalyticsService from "../services/propertyAnalytics.service";

/* -------------------------------------------------------------------------- */
/*                               Async Thunks                                 */
/* -------------------------------------------------------------------------- */

// Get all property analytics
export const fetchPropertyAnalytics = createAsyncThunk(
  "propertyAnalytics/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await propertyAnalyticsService.getAll(params);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Get single property analytics
export const fetchPropertyAnalyticsById = createAsyncThunk(
  "propertyAnalytics/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      return await propertyAnalyticsService.getById(id);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Create property analytics
export const createPropertyAnalytics = createAsyncThunk(
  "propertyAnalytics/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await propertyAnalyticsService.create(payload);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Update property analytics
export const updatePropertyAnalytics = createAsyncThunk(
  "propertyAnalytics/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await propertyAnalyticsService.update(id, data);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Delete property analytics
export const deletePropertyAnalytics = createAsyncThunk(
  "propertyAnalytics/delete",
  async (id, { rejectWithValue }) => {
    try {
      await propertyAnalyticsService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/* -------------------------------------------------------------------------- */
/*                                Initial State                               */
/* -------------------------------------------------------------------------- */

const initialState = {
  analytics: [],
  analyticsDetails: null,

  loading: false,
  actionLoading: false,

  success: false,
  error: null,
  message: "",

  pagination: {
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  },
};

/* -------------------------------------------------------------------------- */
/*                                   Slice                                    */
/* -------------------------------------------------------------------------- */

const propertyAnalyticsSlice = createSlice({
  name: "propertyAnalytics",
  initialState,
  reducers: {
    clearPropertyAnalyticsError(state) {
      state.error = null;
    },

    clearPropertyAnalyticsMessage(state) {
      state.message = "";
    },

    clearPropertyAnalyticsDetails(state) {
      state.analyticsDetails = null;
    },

    resetPropertyAnalyticsState(state) {
      state.loading = false;
      state.actionLoading = false;
      state.success = false;
      state.error = null;
      state.message = "";
    },
  },

  extraReducers: (builder) => {
    builder

      /* ================= FETCH ALL ================= */

      .addCase(fetchPropertyAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchPropertyAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        const payload = action.payload;

        if (payload?.data?.data) {
          // Laravel Pagination
          state.analytics = payload.data.data;
          state.pagination = {
            currentPage: payload.data.current_page,
            lastPage: payload.data.last_page,
            perPage: payload.data.per_page,
            total: payload.data.total,
          };
        } else {
          // Normal Collection
          state.analytics = payload.data || [];
        }

        state.message = payload.message || "";
      })

      .addCase(fetchPropertyAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch property analytics.";
      })

      /* ================= FETCH ONE ================= */

      .addCase(fetchPropertyAnalyticsById.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchPropertyAnalyticsById.fulfilled, (state, action) => {
        state.loading = false;
        state.analyticsDetails = action.payload.data;
        state.message = action.payload.message || "";
      })

      .addCase(fetchPropertyAnalyticsById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          "Failed to fetch property analytics details.";
      })

      /* ================= CREATE ================= */

      .addCase(createPropertyAnalytics.pending, (state) => {
        state.actionLoading = true;
      })

      .addCase(createPropertyAnalytics.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.analytics.unshift(action.payload.data);
        state.message = action.payload.message || "Created successfully.";
      })

      .addCase(createPropertyAnalytics.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to create property analytics.";
      })

      /* ================= UPDATE ================= */

      .addCase(updatePropertyAnalytics.pending, (state) => {
        state.actionLoading = true;
      })

      .addCase(updatePropertyAnalytics.fulfilled, (state, action) => {
        state.actionLoading = false;

        const updated = action.payload.data;

        state.analytics = state.analytics.map((item) =>
          item.id === updated.id ? updated : item
        );

        if (
          state.analyticsDetails &&
          state.analyticsDetails.id === updated.id
        ) {
          state.analyticsDetails = updated;
        }

        state.message = action.payload.message || "Updated successfully.";
      })

      .addCase(updatePropertyAnalytics.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to update property analytics.";
      })

      /* ================= DELETE ================= */

      .addCase(deletePropertyAnalytics.pending, (state) => {
        state.actionLoading = true;
      })

      .addCase(deletePropertyAnalytics.fulfilled, (state, action) => {
        state.actionLoading = false;

        state.analytics = state.analytics.filter(
          (item) => item.id !== action.payload
        );

        state.message = "Property analytics deleted successfully.";
      })

      .addCase(deletePropertyAnalytics.rejected, (state, action) => {
        state.actionLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to delete property analytics.";
      });
  },
});

/* -------------------------------------------------------------------------- */
/*                                   Export                                   */
/* -------------------------------------------------------------------------- */

export const {
  clearPropertyAnalyticsError,
  clearPropertyAnalyticsMessage,
  clearPropertyAnalyticsDetails,
  resetPropertyAnalyticsState,
} = propertyAnalyticsSlice.actions;

export default propertyAnalyticsSlice.reducer;

