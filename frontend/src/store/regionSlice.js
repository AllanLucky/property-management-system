
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import regionService from "../services/region.service";

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/

const initialState = {
  regions: [],
  selectedRegion: null,
  activeRegions: [],
  inactiveRegions: [],
  regionsByCountry: [],

  statistics: {
    total: 0,
    active: 0,
    inactive: 0,
    countries: 0,
    counties: 0,
  },

  reports: [],

  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
    from: null,
    to: null,
    has_more_pages: false,
  },

  filters: {
    search: "",
    country_id: "",
    code: "",
    name: "",
    status: "",
    is_active: "",
    date_from: "",
    date_to: "",
    per_page: 25,
    page: 1,
    sort_by: "created_at",
    sort_direction: "desc",
  },

  loading: false,
  submitting: false,
  deleting: false,
  forceDeleting: false,
  statusUpdating: false,
  statisticsLoading: false,
  reportsLoading: false,

  error: null,
  statisticsError: null,
  reportsError: null,
  validationErrors: {},
};

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

const extractData = (response) => {
  if (!response) return null;

  if (response.data !== undefined) {
    return response.data;
  }

  return response;
};

const extractList = (response) => {
  const data = extractData(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.regions)) return data.regions;

  return [];
};

const extractPagination = (response) => {
  const data = extractData(response);

  return (
    response?.meta ||
    data?.meta ||
    response?.pagination ||
    data?.pagination ||
    {}
  );
};

const extractRecord = (response) => {
  const data = extractData(response);

  if (!data) return null;

  if (Array.isArray(data)) return data[0] || null;

  return (
    data.region ||
    data.record ||
    data.data ||
    data
  );
};

const extractStatistics = (response) => {
  const data = extractData(response);

  if (!data) return {};

  return data.statistics || data;
};

const extractError = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

const extractValidationErrors = (error) => {
  return error?.response?.data?.errors || {};
};

/*
|--------------------------------------------------------------------------
| FETCH REGIONS
|--------------------------------------------------------------------------
*/

export const fetchRegions = createAsyncThunk(
  "regions/fetchRegions",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await regionService.getRegions(params);

      return {
        regions: extractList(response),
        pagination: extractPagination(response),
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH SINGLE REGION
|--------------------------------------------------------------------------
*/

export const fetchRegion = createAsyncThunk(
  "regions/fetchRegion",
  async (identifier, { rejectWithValue }) => {
    try {
      const response = await regionService.getRegion(identifier);
      return extractRecord(response);
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH REGION STATISTICS
|--------------------------------------------------------------------------
*/

export const fetchRegionStatistics = createAsyncThunk(
  "regions/fetchStatistics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response =
        await regionService.getRegionStatistics(params);

      return extractStatistics(response);
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH REGION REPORTS
|--------------------------------------------------------------------------
*/

export const fetchRegionReports = createAsyncThunk(
  "regions/fetchReports",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response =
        await regionService.getRegionReports(params);

      return extractList(response);
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH ACTIVE REGIONS
|--------------------------------------------------------------------------
*/

export const fetchActiveRegions = createAsyncThunk(
  "regions/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const response = await regionService.getActiveRegions();
      return extractList(response);
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH INACTIVE REGIONS
|--------------------------------------------------------------------------
*/

export const fetchInactiveRegions = createAsyncThunk(
  "regions/fetchInactive",
  async (_, { rejectWithValue }) => {
    try {
      const response = await regionService.getInactiveRegions();
      return extractList(response);
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH REGIONS BY COUNTRY
|--------------------------------------------------------------------------
*/

export const fetchRegionsByCountry = createAsyncThunk(
  "regions/fetchByCountry",
  async (countryId, { rejectWithValue }) => {
    try {
      const response =
        await regionService.getRegionsByCountry(countryId);

      return extractList(response);
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| SEARCH REGIONS
|--------------------------------------------------------------------------
*/

export const searchRegions = createAsyncThunk(
  "regions/search",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await regionService.searchRegions(params);

      return {
        regions: extractList(response),
        pagination: extractPagination(response),
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE REGION
|--------------------------------------------------------------------------
*/

export const createRegion = createAsyncThunk(
  "regions/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await regionService.createRegion(payload);
      return extractRecord(response);
    } catch (error) {
      return rejectWithValue({
        message: extractError(error),
        validationErrors: extractValidationErrors(error),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE REGION
|--------------------------------------------------------------------------
*/

export const updateRegion = createAsyncThunk(
  "regions/update",
  async ({ identifier, payload }, { rejectWithValue }) => {
    try {
      const response = await regionService.updateRegion(
        identifier,
        payload
      );

      return extractRecord(response);
    } catch (error) {
      return rejectWithValue({
        message: extractError(error),
        validationErrors: extractValidationErrors(error),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE REGION
|--------------------------------------------------------------------------
*/

export const deleteRegion = createAsyncThunk(
  "regions/delete",
  async (identifier, { rejectWithValue }) => {
    try {
      await regionService.deleteRegion(identifier);
      return identifier;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| FORCE DELETE REGION
|--------------------------------------------------------------------------
*/

export const forceDeleteRegion = createAsyncThunk(
  "regions/forceDelete",
  async (identifier, { rejectWithValue }) => {
    try {
      await regionService.forceDeleteRegion(identifier);
      return identifier;
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| ACTIVATE REGION
|--------------------------------------------------------------------------
*/

export const activateRegion = createAsyncThunk(
  "regions/activate",
  async (identifier, { rejectWithValue }) => {
    try {
      const response =
        await regionService.activateRegion(identifier);

      return {
        identifier,
        region: extractRecord(response),
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| DEACTIVATE REGION
|--------------------------------------------------------------------------
*/

export const deactivateRegion = createAsyncThunk(
  "regions/deactivate",
  async (identifier, { rejectWithValue }) => {
    try {
      const response =
        await regionService.deactivateRegion(identifier);

      return {
        identifier,
        region: extractRecord(response),
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| TOGGLE REGION STATUS
|--------------------------------------------------------------------------
*/

export const toggleRegionStatus = createAsyncThunk(
  "regions/toggleStatus",
  async (identifier, { rejectWithValue }) => {
    try {
      const response =
        await regionService.toggleRegionStatus(identifier);

      return {
        identifier,
        region: extractRecord(response),
      };
    } catch (error) {
      return rejectWithValue(extractError(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| REGION SLICE
|--------------------------------------------------------------------------
*/

const regionSlice = createSlice({
  name: "regions",
  initialState,

  reducers: {
    setSelectedRegion: (state, action) => {
      state.selectedRegion = action.payload;
    },

    clearSelectedRegion: (state) => {
      state.selectedRegion = null;
    },

    setRegionFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
        page: 1,
      };
    },

    updateRegionFilter: (state, action) => {
      const { name, value } = action.payload;

      state.filters[name] = value;
      state.filters.page = 1;
    },

    resetRegionFilters: (state) => {
      state.filters = initialState.filters;
    },

    setRegionPage: (state, action) => {
      state.filters.page = action.payload;
      state.pagination.current_page = action.payload;
    },

    setRegionPerPage: (state, action) => {
      state.filters.per_page = action.payload;
      state.filters.page = 1;
    },

    clearRegionErrors: (state) => {
      state.error = null;
      state.statisticsError = null;
      state.reportsError = null;
      state.validationErrors = {};
    },

    clearRegionState: () => initialState,
  },

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | FETCH REGIONS
      |--------------------------------------------------------------------------
      */

      .addCase(fetchRegions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchRegions.fulfilled, (state, action) => {
        state.loading = false;
        state.regions = action.payload.regions;

        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination,
        };
      })

      .addCase(fetchRegions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch regions.";
      })

      /*
      |--------------------------------------------------------------------------
      | FETCH SINGLE REGION
      |--------------------------------------------------------------------------
      */

      .addCase(fetchRegion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchRegion.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedRegion = action.payload;
      })

      .addCase(fetchRegion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch region.";
      })

      /*
      |--------------------------------------------------------------------------
      | STATISTICS
      |--------------------------------------------------------------------------
      */

      .addCase(fetchRegionStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.statisticsError = null;
      })

      .addCase(fetchRegionStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false;

        state.statistics = {
          ...state.statistics,
          ...action.payload,
        };
      })

      .addCase(fetchRegionStatistics.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.statisticsError =
          action.payload || "Failed to fetch region statistics.";
      })

      /*
      |--------------------------------------------------------------------------
      | REPORTS
      |--------------------------------------------------------------------------
      */

      .addCase(fetchRegionReports.pending, (state) => {
        state.reportsLoading = true;
        state.reportsError = null;
      })

      .addCase(fetchRegionReports.fulfilled, (state, action) => {
        state.reportsLoading = false;
        state.reports = action.payload;
      })

      .addCase(fetchRegionReports.rejected, (state, action) => {
        state.reportsLoading = false;
        state.reportsError =
          action.payload || "Failed to fetch region reports.";
      })

      /*
      |--------------------------------------------------------------------------
      | ACTIVE REGIONS
      |--------------------------------------------------------------------------
      */

      .addCase(fetchActiveRegions.fulfilled, (state, action) => {
        state.activeRegions = action.payload;
      })

      .addCase(fetchActiveRegions.rejected, (state, action) => {
        state.error = action.payload || "Failed to fetch active regions.";
      })

      /*
      |--------------------------------------------------------------------------
      | INACTIVE REGIONS
      |--------------------------------------------------------------------------
      */

      .addCase(fetchInactiveRegions.fulfilled, (state, action) => {
        state.inactiveRegions = action.payload;
      })

      .addCase(fetchInactiveRegions.rejected, (state, action) => {
        state.error = action.payload || "Failed to fetch inactive regions.";
      })

      /*
      |--------------------------------------------------------------------------
      | REGIONS BY COUNTRY
      |--------------------------------------------------------------------------
      */

      .addCase(fetchRegionsByCountry.fulfilled, (state, action) => {
        state.regionsByCountry = action.payload;
      })

      .addCase(fetchRegionsByCountry.rejected, (state, action) => {
        state.error =
          action.payload || "Failed to fetch regions by country.";
      })

      /*
      |--------------------------------------------------------------------------
      | SEARCH REGIONS
      |--------------------------------------------------------------------------
      */

      .addCase(searchRegions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(searchRegions.fulfilled, (state, action) => {
        state.loading = false;
        state.regions = action.payload.regions;

        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination,
        };
      })

      .addCase(searchRegions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Region search failed.";
      })

      /*
      |--------------------------------------------------------------------------
      | CREATE REGION
      |--------------------------------------------------------------------------
      */

      .addCase(createRegion.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.validationErrors = {};
      })

      .addCase(createRegion.fulfilled, (state, action) => {
        state.submitting = false;

        if (action.payload) {
          state.regions.unshift(action.payload);
          state.pagination.total += 1;
          state.statistics.total += 1;

          if (action.payload.is_active) {
            state.statistics.active += 1;
          } else {
            state.statistics.inactive += 1;
          }
        }

        state.selectedRegion = action.payload || null;
      })

      .addCase(createRegion.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload?.message ||
          action.payload ||
          "Failed to create region.";

        state.validationErrors =
          action.payload?.validationErrors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | UPDATE REGION
      |--------------------------------------------------------------------------
      */

      .addCase(updateRegion.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.validationErrors = {};
      })

      .addCase(updateRegion.fulfilled, (state, action) => {
        state.submitting = false;

        const updatedRegion = action.payload;

        if (updatedRegion) {
          state.regions = state.regions.map((region) =>
            String(region.id) === String(updatedRegion.id)
              ? updatedRegion
              : region
          );

          state.selectedRegion = updatedRegion;
        }
      })

      .addCase(updateRegion.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.payload?.message ||
          action.payload ||
          "Failed to update region.";

        state.validationErrors =
          action.payload?.validationErrors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | DELETE REGION
      |--------------------------------------------------------------------------
      */

      .addCase(deleteRegion.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })

      .addCase(deleteRegion.fulfilled, (state, action) => {
        state.deleting = false;

        const identifier = action.payload;

        state.regions = state.regions.filter(
          (region) =>
            String(region.id) !== String(identifier) &&
            String(region.slug) !== String(identifier)
        );

        if (
          state.selectedRegion &&
          (
            String(state.selectedRegion.id) === String(identifier) ||
            String(state.selectedRegion.slug) === String(identifier)
          )
        ) {
          state.selectedRegion = null;
        }

        state.pagination.total = Math.max(
          0,
          state.pagination.total - 1
        );

        state.statistics.total = Math.max(
          0,
          state.statistics.total - 1
        );
      })

      .addCase(deleteRegion.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Failed to delete region.";
      })

      /*
      |--------------------------------------------------------------------------
      | FORCE DELETE REGION
      |--------------------------------------------------------------------------
      */

      .addCase(forceDeleteRegion.pending, (state) => {
        state.forceDeleting = true;
        state.error = null;
      })

      .addCase(forceDeleteRegion.fulfilled, (state, action) => {
        state.forceDeleting = false;

        const identifier = action.payload;

        state.regions = state.regions.filter(
          (region) =>
            String(region.id) !== String(identifier) &&
            String(region.slug) !== String(identifier)
        );

        state.pagination.total = Math.max(
          0,
          state.pagination.total - 1
        );

        state.statistics.total = Math.max(
          0,
          state.statistics.total - 1
        );
      })

      .addCase(forceDeleteRegion.rejected, (state, action) => {
        state.forceDeleting = false;
        state.error = action.payload || "Failed to permanently delete region.";
      })

      /*
      |--------------------------------------------------------------------------
      | ACTIVATE REGION
      |--------------------------------------------------------------------------
      */

      .addCase(activateRegion.pending, (state) => {
        state.statusUpdating = true;
        state.error = null;
      })

      .addCase(activateRegion.fulfilled, (state, action) => {
        state.statusUpdating = false;

        const { identifier, region } = action.payload;

        if (region) {
          state.regions = state.regions.map((item) =>
            String(item.id) === String(region.id) ||
              String(item.slug) === String(identifier)
              ? region
              : item
          );

          if (
            state.selectedRegion &&
            String(state.selectedRegion.id) === String(region.id)
          ) {
            state.selectedRegion = region;
          }
        }
      })

      .addCase(activateRegion.rejected, (state, action) => {
        state.statusUpdating = false;
        state.error = action.payload || "Failed to activate region.";
      })

      /*
      |--------------------------------------------------------------------------
      | DEACTIVATE REGION
      |--------------------------------------------------------------------------
      */

      .addCase(deactivateRegion.pending, (state) => {
        state.statusUpdating = true;
        state.error = null;
      })

      .addCase(deactivateRegion.fulfilled, (state, action) => {
        state.statusUpdating = false;

        const { identifier, region } = action.payload;

        if (region) {
          state.regions = state.regions.map((item) =>
            String(item.id) === String(region.id) ||
              String(item.slug) === String(identifier)
              ? region
              : item
          );

          if (
            state.selectedRegion &&
            String(state.selectedRegion.id) === String(region.id)
          ) {
            state.selectedRegion = region;
          }
        }
      })

      .addCase(deactivateRegion.rejected, (state, action) => {
        state.statusUpdating = false;
        state.error = action.payload || "Failed to deactivate region.";
      })

      /*
      |--------------------------------------------------------------------------
      | TOGGLE REGION STATUS
      |--------------------------------------------------------------------------
      */

      .addCase(toggleRegionStatus.pending, (state) => {
        state.statusUpdating = true;
        state.error = null;
      })

      .addCase(toggleRegionStatus.fulfilled, (state, action) => {
        state.statusUpdating = false;

        const { identifier, region } = action.payload;

        if (region) {
          state.regions = state.regions.map((item) =>
            String(item.id) === String(region.id) ||
              String(item.slug) === String(identifier)
              ? region
              : item
          );

          if (
            state.selectedRegion &&
            String(state.selectedRegion.id) === String(region.id)
          ) {
            state.selectedRegion = region;
          }
        }
      })

      .addCase(toggleRegionStatus.rejected, (state, action) => {
        state.statusUpdating = false;
        state.error = action.payload || "Failed to toggle region status.";
      });
  },
});

/*
|--------------------------------------------------------------------------
| ACTIONS
|--------------------------------------------------------------------------
*/

export const {
  setSelectedRegion,
  clearSelectedRegion,
  setRegionFilters,
  updateRegionFilter,
  resetRegionFilters,
  setRegionPage,
  setRegionPerPage,
  clearRegionErrors,
  clearRegionState,
} = regionSlice.actions;

/*
|--------------------------------------------------------------------------
| SELECTORS
|--------------------------------------------------------------------------
*/

export const selectRegions = (state) =>
  state.regions?.regions || [];

export const selectSelectedRegion = (state) =>
  state.regions?.selectedRegion || null;

export const selectRegionStatistics = (state) =>
  state.regions?.statistics || initialState.statistics;

export const selectRegionReports = (state) =>
  state.regions?.reports || [];

export const selectRegionPagination = (state) =>
  state.regions?.pagination || initialState.pagination;

export const selectRegionFilters = (state) =>
  state.regions?.filters || initialState.filters;

export const selectRegionLoading = (state) =>
  state.regions?.loading || false;

export const selectRegionError = (state) =>
  state.regions?.error || null;

/*
|--------------------------------------------------------------------------
| EXPORT REDUCER
|--------------------------------------------------------------------------
*/

export default regionSlice.reducer;
