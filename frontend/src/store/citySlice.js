
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import cityService from "../services/city.service";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getErrorMessage = (error, fallback = "Something went wrong.") =>
  error?.response?.data?.message || error?.message || fallback;

const getValidationErrors = (error) =>
  error?.response?.data?.errors || {};

const getResponseData = (response) =>
  response?.data?.data ?? response?.data ?? response;

const getResponseMeta = (response) =>
  response?.data?.meta || response?.meta || null;

const getResponseMessage = (response, fallback) =>
  response?.data?.message || response?.message || fallback;

const getArray = (data) => (Array.isArray(data) ? data : []);

const updateCityInList = (list, updatedCity) => {
  if (!updatedCity?.id) return list;

  return list.map((city) =>
    city.id === updatedCity.id ? updatedCity : city
  );
};

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/

const initialState = {
  cities: [],
  allCities: [],
  activeCities: [],
  inactiveCities: [],
  trashedCities: [],

  selectedCity: null,

  statistics: null,
  reports: null,

  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
    from: null,
    to: null,
    has_more_pages: false,
  },

  filters: {},

  loading: false,
  loadingAll: false,
  loadingStatistics: false,
  loadingReports: false,
  loadingDetails: false,
  loadingTrashed: false,

  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isChangingStatus: false,
  isRestoring: false,
  isForceDeleting: false,

  error: null,
  validationErrors: {},
  successMessage: null,
};

/*
|--------------------------------------------------------------------------
| FETCH CITIES
|--------------------------------------------------------------------------
*/

export const fetchCities = createAsyncThunk(
  "cities/fetchCities",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await cityService.getCities(params);

      return {
        data: getResponseData(response),
        meta: getResponseMeta(response),
        message: getResponseMessage(
          response,
          "Cities fetched successfully."
        ),
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch cities."),
        errors: getValidationErrors(error),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH ALL CITIES
|--------------------------------------------------------------------------
*/

export const fetchAllCities = createAsyncThunk(
  "cities/fetchAllCities",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await cityService.getAllCities(params);
      return getArray(getResponseData(response));
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch all cities."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH CITY STATISTICS
|--------------------------------------------------------------------------
*/

export const fetchCityStatistics = createAsyncThunk(
  "cities/fetchCityStatistics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await cityService.getCityStatistics(params);
      return getResponseData(response);
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch city statistics."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH CITY REPORTS
|--------------------------------------------------------------------------
*/

export const fetchCityReports = createAsyncThunk(
  "cities/fetchCityReports",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await cityService.getCityReports(params);
      return getResponseData(response);
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch city reports."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH ACTIVE CITIES
|--------------------------------------------------------------------------
*/

export const fetchActiveCities = createAsyncThunk(
  "cities/fetchActiveCities",
  async (_, { rejectWithValue }) => {
    try {
      const response = await cityService.getActiveCities();
      return getArray(getResponseData(response));
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch active cities."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH INACTIVE CITIES
|--------------------------------------------------------------------------
*/

export const fetchInactiveCities = createAsyncThunk(
  "cities/fetchInactiveCities",
  async (_, { rejectWithValue }) => {
    try {
      const response = await cityService.getInactiveCities();
      return getArray(getResponseData(response));
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch inactive cities."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH CITIES BY COUNTRY
|--------------------------------------------------------------------------
*/

export const fetchCitiesByCountry = createAsyncThunk(
  "cities/fetchCitiesByCountry",
  async (countryId, { rejectWithValue }) => {
    try {
      const response = await cityService.getCitiesByCountry(countryId);
      return getArray(getResponseData(response));
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch cities by country."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH CITIES BY REGION
|--------------------------------------------------------------------------
*/

export const fetchCitiesByRegion = createAsyncThunk(
  "cities/fetchCitiesByRegion",
  async (regionId, { rejectWithValue }) => {
    try {
      const response = await cityService.getCitiesByRegion(regionId);
      return getArray(getResponseData(response));
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch cities by region."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH CITIES BY COUNTY
|--------------------------------------------------------------------------
*/

export const fetchCitiesByCounty = createAsyncThunk(
  "cities/fetchCitiesByCounty",
  async (countyId, { rejectWithValue }) => {
    try {
      const response = await cityService.getCitiesByCounty(countyId);
      return getArray(getResponseData(response));
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch cities by county."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH CITY BY ID
|--------------------------------------------------------------------------
*/

export const fetchCityById = createAsyncThunk(
  "cities/fetchCityById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await cityService.getCity(id);
      return getResponseData(response);
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch city details."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH CITY BY SLUG
|--------------------------------------------------------------------------
*/

export const fetchCityBySlug = createAsyncThunk(
  "cities/fetchCityBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      const response = await cityService.getCityBySlug(slug);
      return getResponseData(response);
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch city by slug."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH CITY BY CODE
|--------------------------------------------------------------------------
*/

export const fetchCityByCode = createAsyncThunk(
  "cities/fetchCityByCode",
  async (code, { rejectWithValue }) => {
    try {
      const response = await cityService.getCityByCode(code);
      return getResponseData(response);
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch city by code."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE CITY
|--------------------------------------------------------------------------
*/

export const createCity = createAsyncThunk(
  "cities/createCity",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await cityService.createCity(payload);

      return {
        city: getResponseData(response),
        message: getResponseMessage(response, "City created successfully."),
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to create city."),
        errors: getValidationErrors(error),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE CITY
|--------------------------------------------------------------------------
*/

export const updateCity = createAsyncThunk(
  "cities/updateCity",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await cityService.updateCity(id, data);

      return {
        city: getResponseData(response),
        message: getResponseMessage(response, "City updated successfully."),
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to update city."),
        errors: getValidationErrors(error),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE CITY
|--------------------------------------------------------------------------
*/

export const deleteCity = createAsyncThunk(
  "cities/deleteCity",
  async (id, { rejectWithValue }) => {
    try {
      const response = await cityService.deleteCity(id);

      return {
        id,
        message: getResponseMessage(response, "City deleted successfully."),
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to delete city."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ACTIVATE CITY
|--------------------------------------------------------------------------
*/

export const activateCity = createAsyncThunk(
  "cities/activateCity",
  async (id, { rejectWithValue }) => {
    try {
      const response = await cityService.activateCity(id);

      return {
        city: getResponseData(response),
        id,
        message: getResponseMessage(response, "City activated successfully."),
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to activate city."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DEACTIVATE CITY
|--------------------------------------------------------------------------
*/

export const deactivateCity = createAsyncThunk(
  "cities/deactivateCity",
  async (id, { rejectWithValue }) => {
    try {
      const response = await cityService.deactivateCity(id);

      return {
        city: getResponseData(response),
        id,
        message: getResponseMessage(
          response,
          "City deactivated successfully."
        ),
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to deactivate city."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| TOGGLE CITY STATUS
|--------------------------------------------------------------------------
*/

export const toggleCityStatus = createAsyncThunk(
  "cities/toggleCityStatus",
  async (id, { rejectWithValue }) => {
    try {
      const response = await cityService.toggleCityStatus(id);

      return {
        city: getResponseData(response),
        id,
        message: getResponseMessage(
          response,
          "City status updated successfully."
        ),
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to update city status."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH TRASHED CITIES
|--------------------------------------------------------------------------
*/

export const fetchTrashedCities = createAsyncThunk(
  "cities/fetchTrashedCities",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await cityService.getTrashedCities(params);

      return {
        data: getArray(getResponseData(response)),
        meta: getResponseMeta(response),
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch trashed cities."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH TRASHED CITY
|--------------------------------------------------------------------------
*/

export const fetchTrashedCity = createAsyncThunk(
  "cities/fetchTrashedCity",
  async (id, { rejectWithValue }) => {
    try {
      const response = await cityService.getTrashedCity(id);
      return getResponseData(response);
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to fetch trashed city."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| RESTORE CITY
|--------------------------------------------------------------------------
*/

export const restoreCity = createAsyncThunk(
  "cities/restoreCity",
  async (id, { rejectWithValue }) => {
    try {
      const response = await cityService.restoreCity(id);

      return {
        city: getResponseData(response),
        id,
        message: getResponseMessage(response, "City restored successfully."),
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to restore city."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FORCE DELETE CITY
|--------------------------------------------------------------------------
*/

export const forceDeleteCity = createAsyncThunk(
  "cities/forceDeleteCity",
  async (id, { rejectWithValue }) => {
    try {
      const response = await cityService.forceDeleteCity(id);

      return {
        id,
        message: getResponseMessage(response, "City permanently deleted."),
      };
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to permanently delete city."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CHECK CITY EXISTS
|--------------------------------------------------------------------------
*/

export const checkCityExists = createAsyncThunk(
  "cities/checkCityExists",
  async (id, { rejectWithValue }) => {
    try {
      const response = await cityService.checkCityExists(id);
      return getResponseData(response);
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to check city."),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CHECK CITY CODE
|--------------------------------------------------------------------------
*/

export const checkCityCode = createAsyncThunk(
  "cities/checkCityCode",
  async (params, { rejectWithValue }) => {
    try {
      const response = await cityService.checkCityCode(params);
      return getResponseData(response);
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to check city code."),
        errors: getValidationErrors(error),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CHECK CITY SLUG
|--------------------------------------------------------------------------
*/

export const checkCitySlug = createAsyncThunk(
  "cities/checkCitySlug",
  async (params, { rejectWithValue }) => {
    try {
      const response = await cityService.checkCitySlug(params);
      return getResponseData(response);
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(error, "Failed to check city slug."),
        errors: getValidationErrors(error),
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CITY SLICE
|--------------------------------------------------------------------------
*/

const citySlice = createSlice({
  name: "cities",
  initialState,

  reducers: {
    setSelectedCity: (state, action) => {
      state.selectedCity = action.payload;
    },

    clearSelectedCity: (state) => {
      state.selectedCity = null;
    },

    setCityFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    clearCityFilters: (state) => {
      state.filters = {};
    },

    clearCityErrors: (state) => {
      state.error = null;
      state.validationErrors = {};
    },

    clearCitySuccessMessage: (state) => {
      state.successMessage = null;
    },

    clearCityState: () => initialState,
  },

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | FETCH CITIES
      |--------------------------------------------------------------------------
      */

      .addCase(fetchCities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCities.fulfilled, (state, action) => {
        state.loading = false;
        state.cities = action.payload.data;

        if (action.payload.meta) {
          state.pagination = {
            ...state.pagination,
            ...action.payload.meta,
          };
        }
      })
      .addCase(fetchCities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch cities.";
        state.validationErrors = action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | FETCH ALL CITIES
      |--------------------------------------------------------------------------
      */

      .addCase(fetchAllCities.pending, (state) => {
        state.loadingAll = true;
      })
      .addCase(fetchAllCities.fulfilled, (state, action) => {
        state.loadingAll = false;
        state.allCities = action.payload;
      })
      .addCase(fetchAllCities.rejected, (state, action) => {
        state.loadingAll = false;
        state.error = action.payload?.message;
      })

      /*
      |--------------------------------------------------------------------------
      | STATISTICS
      |--------------------------------------------------------------------------
      */

      .addCase(fetchCityStatistics.pending, (state) => {
        state.loadingStatistics = true;
      })
      .addCase(fetchCityStatistics.fulfilled, (state, action) => {
        state.loadingStatistics = false;
        state.statistics = action.payload;
      })
      .addCase(fetchCityStatistics.rejected, (state, action) => {
        state.loadingStatistics = false;
        state.error = action.payload?.message;
      })

      /*
      |--------------------------------------------------------------------------
      | REPORTS
      |--------------------------------------------------------------------------
      */

      .addCase(fetchCityReports.pending, (state) => {
        state.loadingReports = true;
      })
      .addCase(fetchCityReports.fulfilled, (state, action) => {
        state.loadingReports = false;
        state.reports = action.payload;
      })
      .addCase(fetchCityReports.rejected, (state, action) => {
        state.loadingReports = false;
        state.error = action.payload?.message;
      })

      /*
      |--------------------------------------------------------------------------
      | ACTIVE / INACTIVE CITIES
      |--------------------------------------------------------------------------
      */

      .addCase(fetchActiveCities.fulfilled, (state, action) => {
        state.activeCities = action.payload;
      })
      .addCase(fetchInactiveCities.fulfilled, (state, action) => {
        state.inactiveCities = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | CITIES BY LOCATION
      |--------------------------------------------------------------------------
      */

      .addCase(fetchCitiesByCountry.fulfilled, (state, action) => {
        state.allCities = action.payload;
      })
      .addCase(fetchCitiesByRegion.fulfilled, (state, action) => {
        state.allCities = action.payload;
      })
      .addCase(fetchCitiesByCounty.fulfilled, (state, action) => {
        state.allCities = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | CITY DETAILS
      |--------------------------------------------------------------------------
      */

      .addCase(fetchCityById.pending, (state) => {
        state.loadingDetails = true;
        state.error = null;
      })
      .addCase(fetchCityById.fulfilled, (state, action) => {
        state.loadingDetails = false;
        state.selectedCity = action.payload;
      })
      .addCase(fetchCityById.rejected, (state, action) => {
        state.loadingDetails = false;
        state.error = action.payload?.message;
      })

      .addCase(fetchCityBySlug.fulfilled, (state, action) => {
        state.selectedCity = action.payload;
      })
      .addCase(fetchCityByCode.fulfilled, (state, action) => {
        state.selectedCity = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | CREATE CITY
      |--------------------------------------------------------------------------
      */

      .addCase(createCity.pending, (state) => {
        state.isCreating = true;
        state.error = null;
        state.validationErrors = {};
      })
      .addCase(createCity.fulfilled, (state, action) => {
        state.isCreating = false;

        const city = action.payload.city;

        if (city?.id) {
          state.cities = [
            city,
            ...state.cities.filter((item) => item.id !== city.id),
          ];

          state.pagination.total += 1;
        }

        state.successMessage = action.payload.message;
      })
      .addCase(createCity.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload?.message;
        state.validationErrors = action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | UPDATE CITY
      |--------------------------------------------------------------------------
      */

      .addCase(updateCity.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
        state.validationErrors = {};
      })
      .addCase(updateCity.fulfilled, (state, action) => {
        state.isUpdating = false;

        const updatedCity = action.payload.city;

        state.cities = updateCityInList(state.cities, updatedCity);
        state.allCities = updateCityInList(state.allCities, updatedCity);
        state.activeCities = updateCityInList(
          state.activeCities,
          updatedCity
        );
        state.inactiveCities = updateCityInList(
          state.inactiveCities,
          updatedCity
        );

        if (state.selectedCity?.id === updatedCity?.id) {
          state.selectedCity = updatedCity;
        }

        state.successMessage = action.payload.message;
      })
      .addCase(updateCity.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload?.message;
        state.validationErrors = action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | DELETE CITY
      |--------------------------------------------------------------------------
      */

      .addCase(deleteCity.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteCity.fulfilled, (state, action) => {
        state.isDeleting = false;

        const id = action.payload.id;

        state.cities = state.cities.filter((city) => city.id !== id);
        state.allCities = state.allCities.filter((city) => city.id !== id);
        state.activeCities = state.activeCities.filter(
          (city) => city.id !== id
        );
        state.inactiveCities = state.inactiveCities.filter(
          (city) => city.id !== id
        );

        if (state.selectedCity?.id === id) {
          state.selectedCity = null;
        }

        state.pagination.total = Math.max(
          0,
          state.pagination.total - 1
        );

        state.successMessage = action.payload.message;
      })
      .addCase(deleteCity.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload?.message;
      })

      /*
      |--------------------------------------------------------------------------
      | FETCH TRASHED CITIES
      |--------------------------------------------------------------------------
      */

      .addCase(fetchTrashedCities.pending, (state) => {
        state.loadingTrashed = true;
        state.error = null;
      })
      .addCase(fetchTrashedCities.fulfilled, (state, action) => {
        state.loadingTrashed = false;
        state.trashedCities = action.payload.data;

        if (action.payload.meta) {
          state.pagination = {
            ...state.pagination,
            ...action.payload.meta,
          };
        }
      })
      .addCase(fetchTrashedCities.rejected, (state, action) => {
        state.loadingTrashed = false;
        state.error = action.payload?.message;
      })

      .addCase(fetchTrashedCity.fulfilled, (state, action) => {
        state.selectedCity = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | RESTORE CITY
      |--------------------------------------------------------------------------
      */

      .addCase(restoreCity.pending, (state) => {
        state.isRestoring = true;
      })
      .addCase(restoreCity.fulfilled, (state, action) => {
        state.isRestoring = false;

        const id = action.payload.id;
        const restoredCity = action.payload.city;

        state.trashedCities = state.trashedCities.filter(
          (city) => city.id !== id
        );

        if (restoredCity?.id) {
          state.cities = [
            restoredCity,
            ...state.cities.filter(
              (city) => city.id !== restoredCity.id
            ),
          ];
        }

        state.successMessage = action.payload.message;
      })
      .addCase(restoreCity.rejected, (state, action) => {
        state.isRestoring = false;
        state.error = action.payload?.message;
      })

      /*
      |--------------------------------------------------------------------------
      | FORCE DELETE CITY
      |--------------------------------------------------------------------------
      */

      .addCase(forceDeleteCity.pending, (state) => {
        state.isForceDeleting = true;
      })
      .addCase(forceDeleteCity.fulfilled, (state, action) => {
        state.isForceDeleting = false;

        const id = action.payload.id;

        state.trashedCities = state.trashedCities.filter(
          (city) => city.id !== id
        );

        if (state.selectedCity?.id === id) {
          state.selectedCity = null;
        }

        state.successMessage = action.payload.message;
      })
      .addCase(forceDeleteCity.rejected, (state, action) => {
        state.isForceDeleting = false;
        state.error = action.payload?.message;
      })

      /*
      |--------------------------------------------------------------------------
      | CHECK CITY CODE
      |--------------------------------------------------------------------------
      */

      .addCase(checkCityCode.rejected, (state, action) => {
        state.error = action.payload?.message;
        state.validationErrors = action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | CHECK CITY SLUG
      |--------------------------------------------------------------------------
      */

      .addCase(checkCitySlug.rejected, (state, action) => {
        state.error = action.payload?.message;
        state.validationErrors = action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | CITY STATUS MATCHERS
      |--------------------------------------------------------------------------
      | Keep all addCase declarations above these matchers.
      */

      .addMatcher(
        (action) =>
          [
            activateCity.pending.type,
            deactivateCity.pending.type,
            toggleCityStatus.pending.type,
          ].includes(action.type),
        (state) => {
          state.isChangingStatus = true;
          state.error = null;
        }
      )

      .addMatcher(
        (action) =>
          [
            activateCity.fulfilled.type,
            deactivateCity.fulfilled.type,
            toggleCityStatus.fulfilled.type,
          ].includes(action.type),
        (state, action) => {
          state.isChangingStatus = false;

          const updatedCity = action.payload.city;

          if (updatedCity?.id) {
            state.cities = updateCityInList(
              state.cities,
              updatedCity
            );

            state.allCities = updateCityInList(
              state.allCities,
              updatedCity
            );

            state.activeCities = updateCityInList(
              state.activeCities,
              updatedCity
            );

            state.inactiveCities = updateCityInList(
              state.inactiveCities,
              updatedCity
            );

            // Keep active and inactive collections consistent.
            state.activeCities = state.activeCities.filter(
              (city) => city.is_active === true
            );

            state.inactiveCities = state.inactiveCities.filter(
              (city) => city.is_active === false
            );

            if (updatedCity.is_active === true) {
              state.activeCities = [
                updatedCity,
                ...state.activeCities.filter(
                  (city) => city.id !== updatedCity.id
                ),
              ];

              state.inactiveCities = state.inactiveCities.filter(
                (city) => city.id !== updatedCity.id
              );
            } else if (updatedCity.is_active === false) {
              state.inactiveCities = [
                updatedCity,
                ...state.inactiveCities.filter(
                  (city) => city.id !== updatedCity.id
                ),
              ];

              state.activeCities = state.activeCities.filter(
                (city) => city.id !== updatedCity.id
              );
            }

            if (state.selectedCity?.id === updatedCity.id) {
              state.selectedCity = updatedCity;
            }
          }

          state.successMessage = action.payload.message;
        }
      )

      .addMatcher(
        (action) =>
          [
            activateCity.rejected.type,
            deactivateCity.rejected.type,
            toggleCityStatus.rejected.type,
          ].includes(action.type),
        (state, action) => {
          state.isChangingStatus = false;
          state.error =
            action.payload?.message || "Failed to update city status.";
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
  setSelectedCity,
  clearSelectedCity,
  setCityFilters,
  clearCityFilters,
  clearCityErrors,
  clearCitySuccessMessage,
  clearCityState,
} = citySlice.actions;

/*
|--------------------------------------------------------------------------
| SELECTORS
|--------------------------------------------------------------------------
*/

export const selectCities = (state) =>
  state.cities?.cities || [];

export const selectAllCities = (state) =>
  state.cities?.allCities || [];

export const selectActiveCities = (state) =>
  state.cities?.activeCities || [];

export const selectInactiveCities = (state) =>
  state.cities?.inactiveCities || [];

export const selectTrashedCities = (state) =>
  state.cities?.trashedCities || [];

export const selectSelectedCity = (state) =>
  state.cities?.selectedCity || null;

export const selectCityStatistics = (state) =>
  state.cities?.statistics || null;

export const selectCityReports = (state) =>
  state.cities?.reports || null;

export const selectCityPagination = (state) =>
  state.cities?.pagination || initialState.pagination;

export const selectCityFilters = (state) =>
  state.cities?.filters || {};

export const selectCityLoading = (state) =>
  state.cities?.loading || false;

export const selectCityError = (state) =>
  state.cities?.error || null;

export const selectCityValidationErrors = (state) =>
  state.cities?.validationErrors || {};

export default citySlice.reducer;
