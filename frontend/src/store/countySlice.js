
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import countyService from "../services/county.service";

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/

const initialState = {
  counties: [],
  selectedCounty: null,

  statistics: {
    total: 0,
    active: 0,
    inactive: 0,
    trashed: 0,
    with_cities: 0,
    without_cities: 0,
    with_areas: 0,
    without_areas: 0,
    with_properties: 0,
    without_properties: 0,
    by_country: [],
    by_region: [],
  },

  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
    from: 0,
    to: 0,
    has_more_pages: false,
  },

  filters: {
    search: "",
    country_id: "",
    region_id: "",
    status: "",
    is_active: "",
    per_page: 25,
    page: 1,
    sort_by: "created_at",
    sort_direction: "desc",
  },

  loading: false,
  detailsLoading: false,
  statisticsLoading: false,
  submitting: false,
  deleting: false,
  actionLoading: false,

  error: null,
  detailsError: null,
  statisticsError: null,
  validationErrors: {},
  message: null,
};

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

const getEnvelope = (response) => {
  const result = response?.data ?? response;

  if (
    result &&
    typeof result === "object" &&
    !Array.isArray(result) &&
    Object.prototype.hasOwnProperty.call(result, "data")
  ) {
    return result;
  }

  return {
    status: true,
    data: result,
    meta: null,
    message: "",
  };
};

const extractCounties = (response) => {
  const envelope = getEnvelope(response);
  const data = envelope?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.counties)) return data.counties;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;

  if (Array.isArray(response)) return response;

  return [];
};

const extractCounty = (response) => {
  const envelope = getEnvelope(response);
  const data = envelope?.data;

  if (data?.county) return data.county;
  if (data?.item) return data.item;

  if (data && !Array.isArray(data)) {
    return data;
  }

  return null;
};

const extractPagination = (response) => {
  const envelope = getEnvelope(response);

  return (
    envelope?.meta?.pagination ??
    envelope?.meta ??
    envelope?.data?.meta ??
    null
  );
};

const extractStatistics = (response) => {
  const envelope = getEnvelope(response);
  const data = envelope?.data;

  if (data?.statistics) return data.statistics;
  if (data?.stats) return data.stats;

  if (data && !Array.isArray(data)) {
    return data;
  }

  return null;
};

const getErrorMessage = (
  error,
  fallback = "Something went wrong."
) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

const getValidationErrors = (error) => {
  return error?.response?.data?.errors || {};
};

const rejectError = (error, rejectWithValue, fallback) => {
  return rejectWithValue({
    message: getErrorMessage(error, fallback),
    validationErrors: getValidationErrors(error),
  });
};

const isResponseSuccessful = (response) => {
  return getEnvelope(response)?.status !== false;
};

const upsertCounty = (counties, county) => {
  if (!county?.id) return counties;

  const index = counties.findIndex(
    (item) => Number(item.id) === Number(county.id)
  );

  if (index === -1) {
    return [county, ...counties];
  }

  const updated = [...counties];

  updated[index] = {
    ...updated[index],
    ...county,
  };

  return updated;
};

const updateStatusStatistics = (
  state,
  oldStatus,
  newStatus
) => {
  if (oldStatus === newStatus) return;

  if (oldStatus) {
    state.statistics.active = Math.max(
      0,
      state.statistics.active - 1
    );
  } else {
    state.statistics.inactive = Math.max(
      0,
      state.statistics.inactive - 1
    );
  }

  if (newStatus) {
    state.statistics.active += 1;
  } else {
    state.statistics.inactive += 1;
  }
};

const getRejectedMessage = (action, fallback) => {
  return action.payload?.message || action.error?.message || fallback;
};

/*
|--------------------------------------------------------------------------
| ASYNC THUNKS
|--------------------------------------------------------------------------
*/

/**
 * Fetch all counties.
 */
export const fetchCounties = createAsyncThunk(
  "counties/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await countyService.getCounties(params);

      return {
        counties: extractCounties(response),
        pagination: extractPagination(response),
        message: getEnvelope(response)?.message,
      };
    } catch (error) {
      return rejectError(
        error,
        rejectWithValue,
        "Failed to fetch counties."
      );
    }
  }
);

/**
 * Fetch county statistics.
 */
export const fetchCountyStatistics = createAsyncThunk(
  "counties/fetchStatistics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response =
        await countyService.getCountyStatistics(params);

      return {
        statistics: extractStatistics(response),
        message: getEnvelope(response)?.message,
      };
    } catch (error) {
      return rejectError(
        error,
        rejectWithValue,
        "Failed to fetch county statistics."
      );
    }
  }
);

/**
 * Fetch county reports.
 */
export const fetchCountyReports = createAsyncThunk(
  "counties/fetchReports",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await countyService.getCountyReports(params);

      return {
        data: getEnvelope(response)?.data,
        message: getEnvelope(response)?.message,
      };
    } catch (error) {
      return rejectError(
        error,
        rejectWithValue,
        "Failed to fetch county reports."
      );
    }
  }
);

/**
 * Fetch one county.
 */
export const fetchCountyById = createAsyncThunk(
  "counties/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await countyService.getCounty(id);

      return {
        county: extractCounty(response),
        message: getEnvelope(response)?.message,
      };
    } catch (error) {
      return rejectError(
        error,
        rejectWithValue,
        "Failed to fetch county details."
      );
    }
  }
);

/**
 * Fetch active counties.
 */
export const fetchActiveCounties = createAsyncThunk(
  "counties/fetchActive",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response =
        await countyService.getActiveCounties(params);

      return {
        counties: extractCounties(response),
        pagination: extractPagination(response),
      };
    } catch (error) {
      return rejectError(
        error,
        rejectWithValue,
        "Failed to fetch active counties."
      );
    }
  }
);

/**
 * Fetch inactive counties.
 */
export const fetchInactiveCounties = createAsyncThunk(
  "counties/fetchInactive",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response =
        await countyService.getInactiveCounties(params);

      return {
        counties: extractCounties(response),
        pagination: extractPagination(response),
      };
    } catch (error) {
      return rejectError(
        error,
        rejectWithValue,
        "Failed to fetch inactive counties."
      );
    }
  }
);

/**
 * Fetch counties by country.
 */
export const fetchCountiesByCountry = createAsyncThunk(
  "counties/fetchByCountry",
  async ({ countryId, params = {} }, { rejectWithValue }) => {
    try {
      const response =
        await countyService.getCountiesByCountry(countryId, params);

      return {
        counties: extractCounties(response),
        pagination: extractPagination(response),
      };
    } catch (error) {
      return rejectError(
        error,
        rejectWithValue,
        "Failed to fetch counties by country."
      );
    }
  }
);

/**
 * Fetch counties by region.
 */
export const fetchCountiesByRegion = createAsyncThunk(
  "counties/fetchByRegion",
  async ({ regionId, params = {} }, { rejectWithValue }) => {
    try {
      const response =
        await countyService.getCountiesByRegion(regionId, params);

      return {
        counties: extractCounties(response),
        pagination: extractPagination(response),
      };
    } catch (error) {
      return rejectError(
        error,
        rejectWithValue,
        "Failed to fetch counties by region."
      );
    }
  }
);

/**
 * Search counties.
 */
export const searchCounties = createAsyncThunk(
  "counties/search",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await countyService.searchCounties(params);

      return {
        counties: extractCounties(response),
        pagination: extractPagination(response),
      };
    } catch (error) {
      return rejectError(
        error,
        rejectWithValue,
        "Failed to search counties."
      );
    }
  }
);

/**
 * Create county.
 */
export const createCounty = createAsyncThunk(
  "counties/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await countyService.createCounty(payload);

      if (!isResponseSuccessful(response)) {
        return rejectWithValue({
          message:
            getEnvelope(response)?.message ||
            "Failed to create county.",
          validationErrors: getEnvelope(response)?.errors || {},
        });
      }

      return {
        county: extractCounty(response),
        message:
          getEnvelope(response)?.message ||
          "County created successfully.",
      };
    } catch (error) {
      return rejectError(
        error,
        rejectWithValue,
        "Failed to create county."
      );
    }
  }
);

/**
 * Update county.
 */
export const updateCounty = createAsyncThunk(
  "counties/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await countyService.updateCounty(id, payload);

      if (!isResponseSuccessful(response)) {
        return rejectWithValue({
          message:
            getEnvelope(response)?.message ||
            "Failed to update county.",
          validationErrors: getEnvelope(response)?.errors || {},
        });
      }

      return {
        county: extractCounty(response),
        message:
          getEnvelope(response)?.message ||
          "County updated successfully.",
      };
    } catch (error) {
      return rejectError(
        error,
        rejectWithValue,
        "Failed to update county."
      );
    }
  }
);

/**
 * Delete county.
 */
export const deleteCounty = createAsyncThunk(
  "counties/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await countyService.deleteCounty(id);

      if (!isResponseSuccessful(response)) {
        return rejectWithValue({
          message:
            getEnvelope(response)?.message ||
            "Failed to delete county.",
          validationErrors: getEnvelope(response)?.errors || {},
        });
      }

      return {
        id,
        message:
          getEnvelope(response)?.message ||
          "County deleted successfully.",
      };
    } catch (error) {
      return rejectError(
        error,
        rejectWithValue,
        "Failed to delete county."
      );
    }
  }
);

/**
 * Activate county.
 */
export const activateCounty = createAsyncThunk(
  "counties/activate",
  async (id, { rejectWithValue }) => {
    try {
      const response = await countyService.activateCounty(id);

      if (!isResponseSuccessful(response)) {
        return rejectWithValue({
          message:
            getEnvelope(response)?.message ||
            "Failed to activate county.",
          validationErrors: getEnvelope(response)?.errors || {},
        });
      }

      return {
        county: extractCounty(response),
        id,
        message:
          getEnvelope(response)?.message ||
          "County activated successfully.",
      };
    } catch (error) {
      return rejectError(
        error,
        rejectWithValue,
        "Failed to activate county."
      );
    }
  }
);

/**
 * Deactivate county.
 */
export const deactivateCounty = createAsyncThunk(
  "counties/deactivate",
  async (id, { rejectWithValue }) => {
    try {
      const response = await countyService.deactivateCounty(id);

      if (!isResponseSuccessful(response)) {
        return rejectWithValue({
          message:
            getEnvelope(response)?.message ||
            "Failed to deactivate county.",
          validationErrors: getEnvelope(response)?.errors || {},
        });
      }

      return {
        county: extractCounty(response),
        id,
        message:
          getEnvelope(response)?.message ||
          "County deactivated successfully.",
      };
    } catch (error) {
      return rejectError(
        error,
        rejectWithValue,
        "Failed to deactivate county."
      );
    }
  }
);

/**
 * Toggle county status.
 */
export const toggleCountyStatus = createAsyncThunk(
  "counties/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      const response = await countyService.toggleCountyStatus(id);

      if (!isResponseSuccessful(response)) {
        return rejectWithValue({
          message:
            getEnvelope(response)?.message ||
            "Failed to update county status.",
          validationErrors: getEnvelope(response)?.errors || {},
        });
      }

      return {
        county: extractCounty(response),
        id,
        message:
          getEnvelope(response)?.message ||
          "County status updated successfully.",
      };
    } catch (error) {
      return rejectError(
        error,
        rejectWithValue,
        "Failed to update county status."
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| MATCHER TYPE GROUPS
|--------------------------------------------------------------------------
*/

const filteredPendingTypes = [
  fetchActiveCounties.pending.type,
  fetchInactiveCounties.pending.type,
  fetchCountiesByCountry.pending.type,
  fetchCountiesByRegion.pending.type,
  searchCounties.pending.type,
];

const filteredFulfilledTypes = [
  fetchActiveCounties.fulfilled.type,
  fetchInactiveCounties.fulfilled.type,
  fetchCountiesByCountry.fulfilled.type,
  fetchCountiesByRegion.fulfilled.type,
  searchCounties.fulfilled.type,
];

const filteredRejectedTypes = [
  fetchActiveCounties.rejected.type,
  fetchInactiveCounties.rejected.type,
  fetchCountiesByCountry.rejected.type,
  fetchCountiesByRegion.rejected.type,
  searchCounties.rejected.type,
];

const statusPendingTypes = [
  activateCounty.pending.type,
  deactivateCounty.pending.type,
  toggleCountyStatus.pending.type,
];

const statusFulfilledTypes = [
  activateCounty.fulfilled.type,
  deactivateCounty.fulfilled.type,
  toggleCountyStatus.fulfilled.type,
];

const statusRejectedTypes = [
  activateCounty.rejected.type,
  deactivateCounty.rejected.type,
  toggleCountyStatus.rejected.type,
];

/*
|--------------------------------------------------------------------------
| COUNTY SLICE
|--------------------------------------------------------------------------
*/

const countySlice = createSlice({
  name: "counties",
  initialState,

  reducers: {
    /*
    |--------------------------------------------------------------------------
    | SELECT COUNTY
    |--------------------------------------------------------------------------
    */

    setSelectedCounty: (state, action) => {
      state.selectedCounty = action.payload;
    },

    clearSelectedCounty: (state) => {
      state.selectedCounty = null;
      state.detailsError = null;
    },

    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */

    setCountyFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
        page: 1,
      };
    },

    updateCountyFilter: (state, action) => {
      const { name, value } = action.payload;

      state.filters[name] = value;
      state.filters.page = 1;
    },

    resetCountyFilters: (state) => {
      state.filters = { ...initialState.filters };
    },

    /*
    |--------------------------------------------------------------------------
    | PAGINATION
    |--------------------------------------------------------------------------
    */

    setCountyPage: (state, action) => {
      state.filters.page = action.payload;
      state.pagination.current_page = action.payload;
    },

    setCountyPerPage: (state, action) => {
      state.filters.per_page = action.payload;
      state.filters.page = 1;
    },

    setCountyPagination: (state, action) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload,
      };
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR ERRORS AND MESSAGES
    |--------------------------------------------------------------------------
    */

    clearCountyError: (state) => {
      state.error = null;
      state.detailsError = null;
      state.statisticsError = null;
      state.validationErrors = {};
    },

    clearCountyMessage: (state) => {
      state.message = null;
    },

    clearCountyValidationErrors: (state) => {
      state.validationErrors = {};
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR STATE
    |--------------------------------------------------------------------------
    */

    clearCountyState: () => initialState,
  },

  extraReducers: (builder) => {
    /*
    |--------------------------------------------------------------------------
    | ALL ADD CASE HANDLERS FIRST
    |--------------------------------------------------------------------------
    */

    // FETCH ALL COUNTIES

    builder.addCase(fetchCounties.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(fetchCounties.fulfilled, (state, action) => {
      state.loading = false;
      state.counties = action.payload.counties || [];

      if (action.payload.pagination) {
        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination,
        };
      }

      state.message = action.payload.message || null;
    });

    builder.addCase(fetchCounties.rejected, (state, action) => {
      state.loading = false;
      state.error = getRejectedMessage(
        action,
        "Failed to fetch counties."
      );
      state.validationErrors =
        action.payload?.validationErrors || {};
    });

    // COUNTY STATISTICS

    builder.addCase(fetchCountyStatistics.pending, (state) => {
      state.statisticsLoading = true;
      state.statisticsError = null;
    });

    builder.addCase(
      fetchCountyStatistics.fulfilled,
      (state, action) => {
        state.statisticsLoading = false;

        if (action.payload.statistics) {
          state.statistics = {
            ...state.statistics,
            ...action.payload.statistics,
          };
        }

        state.message = action.payload.message || state.message;
      }
    );

    builder.addCase(
      fetchCountyStatistics.rejected,
      (state, action) => {
        state.statisticsLoading = false;
        state.statisticsError = getRejectedMessage(
          action,
          "Failed to fetch county statistics."
        );
      }
    );

    // COUNTY REPORTS

    builder.addCase(fetchCountyReports.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(fetchCountyReports.fulfilled, (state, action) => {
      state.loading = false;
      state.message = action.payload.message || null;
    });

    builder.addCase(fetchCountyReports.rejected, (state, action) => {
      state.loading = false;
      state.error = getRejectedMessage(
        action,
        "Failed to fetch county reports."
      );
    });

    // FETCH SINGLE COUNTY

    builder.addCase(fetchCountyById.pending, (state) => {
      state.detailsLoading = true;
      state.detailsError = null;
    });

    builder.addCase(fetchCountyById.fulfilled, (state, action) => {
      state.detailsLoading = false;
      state.selectedCounty = action.payload.county;
      state.message = action.payload.message || null;
    });

    builder.addCase(fetchCountyById.rejected, (state, action) => {
      state.detailsLoading = false;
      state.detailsError = getRejectedMessage(
        action,
        "Failed to fetch county details."
      );
    });

    // CREATE COUNTY

    builder.addCase(createCounty.pending, (state) => {
      state.submitting = true;
      state.error = null;
      state.validationErrors = {};
    });

    builder.addCase(createCounty.fulfilled, (state, action) => {
      state.submitting = false;

      const newCounty = action.payload.county;

      if (newCounty) {
        state.counties = upsertCounty(
          state.counties,
          newCounty
        );

        state.statistics.total += 1;

        if (newCounty.is_active) {
          state.statistics.active += 1;
        } else {
          state.statistics.inactive += 1;
        }
      }

      state.message = action.payload.message;
      state.validationErrors = {};
    });

    builder.addCase(createCounty.rejected, (state, action) => {
      state.submitting = false;
      state.error = getRejectedMessage(
        action,
        "Failed to create county."
      );
      state.validationErrors =
        action.payload?.validationErrors || {};
    });

    // UPDATE COUNTY

    builder.addCase(updateCounty.pending, (state) => {
      state.submitting = true;
      state.error = null;
      state.validationErrors = {};
    });

    builder.addCase(updateCounty.fulfilled, (state, action) => {
      state.submitting = false;

      const updatedCounty = action.payload.county;

      if (updatedCounty) {
        const existing = state.counties.find(
          (item) =>
            Number(item.id) === Number(updatedCounty.id)
        );

        if (existing) {
          updateStatusStatistics(
            state,
            Boolean(existing.is_active),
            Boolean(updatedCounty.is_active)
          );
        }

        state.counties = upsertCounty(
          state.counties,
          updatedCounty
        );

        if (
          Number(state.selectedCounty?.id) ===
          Number(updatedCounty.id)
        ) {
          state.selectedCounty = {
            ...state.selectedCounty,
            ...updatedCounty,
          };
        }
      }

      state.message = action.payload.message;
      state.validationErrors = {};
    });

    builder.addCase(updateCounty.rejected, (state, action) => {
      state.submitting = false;
      state.error = getRejectedMessage(
        action,
        "Failed to update county."
      );
      state.validationErrors =
        action.payload?.validationErrors || {};
    });

    // DELETE COUNTY

    builder.addCase(deleteCounty.pending, (state) => {
      state.deleting = true;
      state.error = null;
    });

    builder.addCase(deleteCounty.fulfilled, (state, action) => {
      state.deleting = false;

      const deletedId = Number(action.payload.id);

      const deletedCounty = state.counties.find(
        (item) => Number(item.id) === deletedId
      );

      state.counties = state.counties.filter(
        (item) => Number(item.id) !== deletedId
      );

      if (deletedCounty) {
        state.statistics.total = Math.max(
          0,
          state.statistics.total - 1
        );

        if (deletedCounty.is_active) {
          state.statistics.active = Math.max(
            0,
            state.statistics.active - 1
          );
        } else {
          state.statistics.inactive = Math.max(
            0,
            state.statistics.inactive - 1
          );
        }
      }

      if (
        Number(state.selectedCounty?.id) === deletedId
      ) {
        state.selectedCounty = null;
      }

      state.message = action.payload.message;
    });

    builder.addCase(deleteCounty.rejected, (state, action) => {
      state.deleting = false;
      state.error = getRejectedMessage(
        action,
        "Failed to delete county."
      );
    });

    /*
    |--------------------------------------------------------------------------
    | ALL ADD MATCHER HANDLERS LAST
    |--------------------------------------------------------------------------
    */

    // FILTERED REQUESTS: PENDING

    builder.addMatcher(
      (action) => filteredPendingTypes.includes(action.type),
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    // FILTERED REQUESTS: FULFILLED

    builder.addMatcher(
      (action) => filteredFulfilledTypes.includes(action.type),
      (state, action) => {
        state.loading = false;
        state.counties = action.payload.counties || [];

        if (action.payload.pagination) {
          state.pagination = {
            ...state.pagination,
            ...action.payload.pagination,
          };
        }
      }
    );

    // FILTERED REQUESTS: REJECTED

    builder.addMatcher(
      (action) => filteredRejectedTypes.includes(action.type),
      (state, action) => {
        state.loading = false;
        state.error = getRejectedMessage(
          action,
          "Failed to load counties."
        );
        state.validationErrors =
          action.payload?.validationErrors || {};
      }
    );

    // STATUS ACTIONS: PENDING

    builder.addMatcher(
      (action) => statusPendingTypes.includes(action.type),
      (state) => {
        state.actionLoading = true;
        state.error = null;
      }
    );

    // STATUS ACTIONS: FULFILLED

    builder.addMatcher(
      (action) => statusFulfilledTypes.includes(action.type),
      (state, action) => {
        state.actionLoading = false;

        const updatedCounty = action.payload.county;
        const id = updatedCounty?.id ?? action.payload.id;

        if (updatedCounty) {
          const existing = state.counties.find(
            (item) => Number(item.id) === Number(id)
          );

          if (existing) {
            updateStatusStatistics(
              state,
              Boolean(existing.is_active),
              Boolean(updatedCounty.is_active)
            );
          }

          state.counties = upsertCounty(
            state.counties,
            updatedCounty
          );

          if (
            Number(state.selectedCounty?.id) === Number(id)
          ) {
            state.selectedCounty = {
              ...state.selectedCounty,
              ...updatedCounty,
            };
          }
        }

        state.message = action.payload.message || null;
        state.validationErrors = {};
      }
    );

    // STATUS ACTIONS: REJECTED

    builder.addMatcher(
      (action) => statusRejectedTypes.includes(action.type),
      (state, action) => {
        state.actionLoading = false;
        state.error = getRejectedMessage(
          action,
          "Failed to update county status."
        );
        state.validationErrors =
          action.payload?.validationErrors || {};
      }
    );
  },
});

/*
|--------------------------------------------------------------------------
| ACTIONS
|--------------------------------------------------------------------------
*/

export const {
  setSelectedCounty,
  clearSelectedCounty,
  setCountyFilters,
  updateCountyFilter,
  resetCountyFilters,
  setCountyPage,
  setCountyPerPage,
  setCountyPagination,
  clearCountyError,
  clearCountyMessage,
  clearCountyValidationErrors,
  clearCountyState,
} = countySlice.actions;

/*
|--------------------------------------------------------------------------
| SELECTORS
|--------------------------------------------------------------------------
*/

export const selectCounties = (state) =>
  state.counties?.counties || [];

export const selectSelectedCounty = (state) =>
  state.counties?.selectedCounty || null;

export const selectCountyStatistics = (state) =>
  state.counties?.statistics || initialState.statistics;

export const selectCountyPagination = (state) =>
  state.counties?.pagination || initialState.pagination;

export const selectCountyFilters = (state) =>
  state.counties?.filters || initialState.filters;

export const selectCountyLoading = (state) =>
  state.counties?.loading || false;

export const selectCountyDetailsLoading = (state) =>
  state.counties?.detailsLoading || false;

export const selectCountyStatisticsLoading = (state) =>
  state.counties?.statisticsLoading || false;

export const selectCountySubmitting = (state) =>
  state.counties?.submitting || false;

export const selectCountyDeleting = (state) =>
  state.counties?.deleting || false;

export const selectCountyActionLoading = (state) =>
  state.counties?.actionLoading || false;

export const selectCountyError = (state) =>
  state.counties?.error || null;

export const selectCountyDetailsError = (state) =>
  state.counties?.detailsError || null;

export const selectCountyStatisticsError = (state) =>
  state.counties?.statisticsError || null;

export const selectCountyValidationErrors = (state) =>
  state.counties?.validationErrors || {};

export const selectCountyMessage = (state) =>
  state.counties?.message || null;

/*
|--------------------------------------------------------------------------
| EXPORT REDUCER
|--------------------------------------------------------------------------
*/

export default countySlice.reducer;
