
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import countryService from "../services/country.service";

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/

const initialState = {
  countries: [],
  selectedCountry: null,

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
    is_active: "",
    per_page: 25,
    page: 1,
  },

  loading: false,
  detailsLoading: false,
  submitting: false,
  deleting: false,
  statusUpdating: false,

  error: null,
  validationErrors: {},

  successMessage: null,
};

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

const getErrorPayload = (error) => ({
  message:
    error?.message ||
    "Something went wrong. Please try again.",

  errors: error?.errors ||
    error?.response?.data?.errors ||
    {},

  status:
    error?.status ||
    error?.response?.status ||
    500,
});

const getResponseData = (response) => {
  return response?.data ?? response;
};

/*
|--------------------------------------------------------------------------
| FETCH COUNTRIES
|--------------------------------------------------------------------------
*/

export const fetchCountries = createAsyncThunk(
  "countries/fetchCountries",

  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await countryService.getCountries(params);

      const data = getResponseData(response);

      return {
        countries: Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [],

        pagination:
          response?.meta ||
          data?.meta ||
          {},

        message: response?.message || "Countries fetched successfully.",
      };
    } catch (error) {
      return rejectWithValue(getErrorPayload(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH SINGLE COUNTRY
|--------------------------------------------------------------------------
*/

export const fetchCountryById = createAsyncThunk(
  "countries/fetchCountryById",

  async (id, { rejectWithValue }) => {
    try {
      const response = await countryService.getCountryById(id);

      return {
        country: getResponseData(response),
        message: response?.message || "Country fetched successfully.",
      };
    } catch (error) {
      return rejectWithValue(getErrorPayload(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE COUNTRY
|--------------------------------------------------------------------------
*/

export const createCountry = createAsyncThunk(
  "countries/createCountry",

  async (payload, { rejectWithValue }) => {
    try {
      const response = await countryService.createCountry(payload);

      return {
        country: getResponseData(response),
        message: response?.message || "Country created successfully.",
      };
    } catch (error) {
      return rejectWithValue(getErrorPayload(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE COUNTRY
|--------------------------------------------------------------------------
*/

export const updateCountry = createAsyncThunk(
  "countries/updateCountry",

  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await countryService.updateCountry(id, payload);

      return {
        country: getResponseData(response),
        message: response?.message || "Country updated successfully.",
      };
    } catch (error) {
      return rejectWithValue(getErrorPayload(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE COUNTRY
|--------------------------------------------------------------------------
*/

export const deleteCountry = createAsyncThunk(
  "countries/deleteCountry",

  async (id, { rejectWithValue }) => {
    try {
      const response = await countryService.deleteCountry(id);

      return {
        id,
        message: response?.message || "Country deleted successfully.",
      };
    } catch (error) {
      return rejectWithValue(getErrorPayload(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| TOGGLE COUNTRY STATUS
|--------------------------------------------------------------------------
*/

export const toggleCountryStatus = createAsyncThunk(
  "countries/toggleCountryStatus",

  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await countryService.toggleCountryStatus(
        id,
        isActive
      );

      return {
        id,
        country: getResponseData(response),
        isActive,
        message:
          response?.message || "Country status updated successfully.",
      };
    } catch (error) {
      return rejectWithValue(getErrorPayload(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| COUNTRY SLICE
|--------------------------------------------------------------------------
*/

const countrySlice = createSlice({
  name: "countries",

  initialState,

  reducers: {

    /*
    |--------------------------------------------------------------------------
    | SET FILTERS
    |--------------------------------------------------------------------------
    */

    setCountryFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    /*
    |--------------------------------------------------------------------------
    | SET SEARCH
    |--------------------------------------------------------------------------
    */

    setCountrySearch: (state, action) => {
      state.filters.search = action.payload;
      state.filters.page = 1;
    },

    /*
    |--------------------------------------------------------------------------
    | SET STATUS FILTER
    |--------------------------------------------------------------------------
    */

    setCountryStatusFilter: (state, action) => {
      state.filters.is_active = action.payload;
      state.filters.page = 1;
    },

    /*
    |--------------------------------------------------------------------------
    | SET PAGE
    |--------------------------------------------------------------------------
    */

    setCountryPage: (state, action) => {
      state.filters.page = action.payload;
    },

    /*
    |--------------------------------------------------------------------------
    | SET PER PAGE
    |--------------------------------------------------------------------------
    */

    setCountryPerPage: (state, action) => {
      state.filters.per_page = Number(action.payload) || 25;
      state.filters.page = 1;
    },

    /*
    |--------------------------------------------------------------------------
    | RESET FILTERS
    |--------------------------------------------------------------------------
    */

    resetCountryFilters: (state) => {
      state.filters = {
        ...initialState.filters,
      };
    },

    /*
    |--------------------------------------------------------------------------
    | SELECT COUNTRY
    |--------------------------------------------------------------------------
    */

    setSelectedCountry: (state, action) => {
      state.selectedCountry = action.payload;
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR SELECTED COUNTRY
    |--------------------------------------------------------------------------
    */

    clearSelectedCountry: (state) => {
      state.selectedCountry = null;
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR ERRORS
    |--------------------------------------------------------------------------
    */

    clearCountryErrors: (state) => {
      state.error = null;
      state.validationErrors = {};
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR SUCCESS MESSAGE
    |--------------------------------------------------------------------------
    */

    clearCountrySuccessMessage: (state) => {
      state.successMessage = null;
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR COUNTRY STATE
    |--------------------------------------------------------------------------
    */

    clearCountryState: () => {
      return { ...initialState };
    },
  },

  /*
  |--------------------------------------------------------------------------
  | EXTRA REDUCERS
  |--------------------------------------------------------------------------
  */

  extraReducers: (builder) => {

    /*
    |--------------------------------------------------------------------------
    | FETCH COUNTRIES
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchCountries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.loading = false;

        state.countries = action.payload.countries;

        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination,
        };
      })

      .addCase(fetchCountries.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          action.error.message ||
          "Failed to fetch countries.";

        state.validationErrors = action.payload?.errors || {};
      });

    /*
    |--------------------------------------------------------------------------
    | FETCH SINGLE COUNTRY
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchCountryById.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })

      .addCase(fetchCountryById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedCountry = action.payload.country;
      })

      .addCase(fetchCountryById.rejected, (state, action) => {
        state.detailsLoading = false;

        state.error =
          action.payload?.message ||
          action.error.message ||
          "Failed to fetch country.";
      });

    /*
    |--------------------------------------------------------------------------
    | CREATE COUNTRY
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(createCountry.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.validationErrors = {};
        state.successMessage = null;
      })

      .addCase(createCountry.fulfilled, (state, action) => {
        state.submitting = false;

        const country = action.payload.country;

        if (country?.id) {
          const exists = state.countries.some(
            (item) => item.id === country.id
          );

          if (!exists) {
            state.countries.unshift(country);
            state.pagination.total += 1;
          }
        }

        state.successMessage = action.payload.message;
      })

      .addCase(createCountry.rejected, (state, action) => {
        state.submitting = false;

        state.error =
          action.payload?.message ||
          action.error.message ||
          "Failed to create country.";

        state.validationErrors = action.payload?.errors || {};
      });

    /*
    |--------------------------------------------------------------------------
    | UPDATE COUNTRY
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(updateCountry.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.validationErrors = {};
        state.successMessage = null;
      })

      .addCase(updateCountry.fulfilled, (state, action) => {
        state.submitting = false;

        const country = action.payload.country;

        if (country?.id) {
          const index = state.countries.findIndex(
            (item) => item.id === country.id
          );

          if (index !== -1) {
            state.countries[index] = country;
          }

          if (state.selectedCountry?.id === country.id) {
            state.selectedCountry = country;
          }
        }

        state.successMessage = action.payload.message;
      })

      .addCase(updateCountry.rejected, (state, action) => {
        state.submitting = false;

        state.error =
          action.payload?.message ||
          action.error.message ||
          "Failed to update country.";

        state.validationErrors = action.payload?.errors || {};
      });

    /*
    |--------------------------------------------------------------------------
    | DELETE COUNTRY
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(deleteCountry.pending, (state) => {
        state.deleting = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(deleteCountry.fulfilled, (state, action) => {
        state.deleting = false;

        const deletedId = action.payload.id;

        state.countries = state.countries.filter(
          (country) => country.id !== deletedId
        );

        state.pagination.total = Math.max(
          0,
          state.pagination.total - 1
        );

        if (state.selectedCountry?.id === deletedId) {
          state.selectedCountry = null;
        }

        state.successMessage = action.payload.message;
      })

      .addCase(deleteCountry.rejected, (state, action) => {
        state.deleting = false;

        state.error =
          action.payload?.message ||
          action.error.message ||
          "Failed to delete country.";
      });

    /*
    |--------------------------------------------------------------------------
    | TOGGLE COUNTRY STATUS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(toggleCountryStatus.pending, (state) => {
        state.statusUpdating = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(toggleCountryStatus.fulfilled, (state, action) => {
        state.statusUpdating = false;

        const updatedCountry = action.payload.country;
        const countryId = action.payload.id;

        const index = state.countries.findIndex(
          (country) => country.id === countryId
        );

        if (index !== -1) {
          state.countries[index] = updatedCountry?.id
            ? updatedCountry
            : {
              ...state.countries[index],
              is_active: action.payload.isActive,
              status_label: action.payload.isActive
                ? "Active"
                : "Inactive",
            };
        }

        if (state.selectedCountry?.id === countryId) {
          state.selectedCountry = updatedCountry?.id
            ? updatedCountry
            : {
              ...state.selectedCountry,
              is_active: action.payload.isActive,
              status_label: action.payload.isActive
                ? "Active"
                : "Inactive",
            };
        }

        state.successMessage = action.payload.message;
      })

      .addCase(toggleCountryStatus.rejected, (state, action) => {
        state.statusUpdating = false;

        state.error =
          action.payload?.message ||
          action.error.message ||
          "Failed to update country status.";
      });
  },
});

/*
|--------------------------------------------------------------------------
| EXPORT ACTIONS
|--------------------------------------------------------------------------
*/

export const {
  setCountryFilters,
  setCountrySearch,
  setCountryStatusFilter,
  setCountryPage,
  setCountryPerPage,
  resetCountryFilters,
  setSelectedCountry,
  clearSelectedCountry,
  clearCountryErrors,
  clearCountrySuccessMessage,
  clearCountryState,
} = countrySlice.actions;

/*
|--------------------------------------------------------------------------
| SELECTORS
|--------------------------------------------------------------------------
*/

export const selectCountries = (state) =>
  state.countries?.countries || [];

export const selectSelectedCountry = (state) =>
  state.countries?.selectedCountry || null;

export const selectCountryPagination = (state) =>
  state.countries?.pagination || initialState.pagination;

export const selectCountryFilters = (state) =>
  state.countries?.filters || initialState.filters;

export const selectCountryLoading = (state) =>
  state.countries?.loading || false;

export const selectCountryDetailsLoading = (state) =>
  state.countries?.detailsLoading || false;

export const selectCountrySubmitting = (state) =>
  state.countries?.submitting || false;

export const selectCountryDeleting = (state) =>
  state.countries?.deleting || false;

export const selectCountryStatusUpdating = (state) =>
  state.countries?.statusUpdating || false;

export const selectCountryError = (state) =>
  state.countries?.error || null;

export const selectCountryValidationErrors = (state) =>
  state.countries?.validationErrors || {};

export const selectCountrySuccessMessage = (state) =>
  state.countries?.successMessage || null;

/*
|--------------------------------------------------------------------------
| EXPORT REDUCER
|--------------------------------------------------------------------------
*/

export default countrySlice.reducer;
