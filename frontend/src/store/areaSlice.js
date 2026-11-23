
import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import areaService from "../services/area.service";

/*
|--------------------------------------------------------------------------
| DEFAULT CONFIGURATION
|--------------------------------------------------------------------------
*/

const DEFAULT_FILTERS = {
  search: "",
  name: "",
  slug: "",
  code: "",

  country_id: "",
  region_id: "",
  county_id: "",
  city_id: "",

  is_active: "",
  status: "",

  date_from: "",
  date_to: "",

  page: 1,
  per_page: 15,

  sort_by: "created_at",
  sort_direction: "desc",
};

const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
  from: null,
  to: null,
};

const DEFAULT_STATISTICS = {
  total: 0,
  active: 0,
  inactive: 0,
  with_properties: 0,
  without_properties: 0,
};

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| EXTRACT API RESPONSE
|--------------------------------------------------------------------------
| Supports Axios responses and the API response envelope:
| { status, code, message, data, meta, links }
|--------------------------------------------------------------------------
*/

const getResponseData = (response) => {
  return response?.data ?? response;
};

/*
|--------------------------------------------------------------------------
| EXTRACT LIST DATA
|--------------------------------------------------------------------------
*/

const getListData = (response) => {
  const result = getResponseData(response);

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.items)) {
    return result.items;
  }

  return [];
};

/*
|--------------------------------------------------------------------------
| EXTRACT PAGINATION
|--------------------------------------------------------------------------
*/

const getPagination = (response) => {
  const result = getResponseData(response);

  return (
    result?.meta?.pagination ||
    result?.meta ||
    result?.pagination ||
    result?.data?.meta?.pagination ||
    result?.data?.meta ||
    {}
  );
};

/*
|--------------------------------------------------------------------------
| EXTRACT SINGLE ITEM
|--------------------------------------------------------------------------
*/

const getItemData = (response) => {
  const result = getResponseData(response);

  if (result?.data && !Array.isArray(result.data)) {
    return result.data;
  }

  return result;
};

/*
|--------------------------------------------------------------------------
| EXTRACT STATISTICS
|--------------------------------------------------------------------------
*/

const getStatisticsData = (response) => {
  const result = getResponseData(response);

  const data =
    result?.data?.statistics ||
    result?.data ||
    result?.statistics ||
    result ||
    {};

  return {
    ...data,

    total:
      data.total ??
      data.total_areas ??
      0,

    active:
      data.active ??
      data.active_areas ??
      0,

    inactive:
      data.inactive ??
      data.inactive_areas ??
      0,

    with_properties:
      data.with_properties ??
      data.areas_with_properties ??
      0,

    without_properties:
      data.without_properties ??
      data.areas_without_properties ??
      0,
  };
};

/*
|--------------------------------------------------------------------------
| EXTRACT COUNT
|--------------------------------------------------------------------------
*/

const getCountValue = (response, key) => {
  const result = getResponseData(response);
  const data = result?.data ?? result;

  if (typeof data === "number" || typeof data === "string") {
    return Number(data) || 0;
  }

  return Number(data?.[key] ?? 0);
};

/*
|--------------------------------------------------------------------------
| ERROR PAYLOAD
|--------------------------------------------------------------------------
*/

const getRejectedPayload = (
  error,
  fallbackMessage
) => ({
  message: getErrorMessage(error, fallbackMessage),
  errors: getValidationErrors(error),
  status: error?.response?.status || null,
});

/*
|--------------------------------------------------------------------------
| GENERIC ASYNC THUNK
|--------------------------------------------------------------------------
*/

const createAreaThunk = (
  type,
  serviceMethod,
  fallbackMessage = "Unable to complete area request."
) => {
  return createAsyncThunk(
    type,
    async (payload, { rejectWithValue }) => {
      try {
        return await serviceMethod(payload);
      } catch (error) {
        return rejectWithValue(
          getRejectedPayload(error, fallbackMessage)
        );
      }
    }
  );
};

/*
|--------------------------------------------------------------------------
| FETCH AREAS
|--------------------------------------------------------------------------
*/

export const fetchAreas = createAreaThunk(
  "areas/fetchAreas",
  (params = {}) => areaService.getAreas(params),
  "Failed to fetch areas."
);

/*
|--------------------------------------------------------------------------
| FETCH ALL AREAS WITHOUT PAGINATION
|--------------------------------------------------------------------------
*/

export const fetchAllAreas = createAreaThunk(
  "areas/fetchAllAreas",
  (params = {}) => areaService.getAllAreas(params),
  "Failed to fetch all areas."
);

/*
|--------------------------------------------------------------------------
| FETCH SINGLE AREA
|--------------------------------------------------------------------------
*/

export const fetchArea = createAreaThunk(
  "areas/fetchArea",
  (id) => areaService.getArea(id),
  "Failed to fetch area details."
);

/*
|--------------------------------------------------------------------------
| FETCH AREA BY SLUG
|--------------------------------------------------------------------------
*/

export const fetchAreaBySlug = createAreaThunk(
  "areas/fetchAreaBySlug",
  (slug) => areaService.getAreaBySlug(slug),
  "Failed to fetch area."
);

/*
|--------------------------------------------------------------------------
| FETCH AREA STATISTICS
|--------------------------------------------------------------------------
*/

export const fetchAreaStatistics = createAreaThunk(
  "areas/fetchAreaStatistics",
  (params = {}) => areaService.getStatistics(params),
  "Failed to fetch area statistics."
);

/*
|--------------------------------------------------------------------------
| FETCH AREA REPORTS
|--------------------------------------------------------------------------
*/

export const fetchAreaReports = createAreaThunk(
  "areas/fetchAreaReports",
  (params = {}) => areaService.getReports(params),
  "Failed to fetch area reports."
);

/*
|--------------------------------------------------------------------------
| FETCH ACTIVE AREAS
|--------------------------------------------------------------------------
*/

export const fetchActiveAreas = createAreaThunk(
  "areas/fetchActiveAreas",
  (params = {}) => areaService.getActiveAreas(params),
  "Failed to fetch active areas."
);

/*
|--------------------------------------------------------------------------
| FETCH INACTIVE AREAS
|--------------------------------------------------------------------------
*/

export const fetchInactiveAreas = createAreaThunk(
  "areas/fetchInactiveAreas",
  (params = {}) => areaService.getInactiveAreas(params),
  "Failed to fetch inactive areas."
);

/*
|--------------------------------------------------------------------------
| AREAS BY COUNTRY
|--------------------------------------------------------------------------
| Payload: { country_id, ...filters }
|--------------------------------------------------------------------------
*/

export const fetchAreasByCountry = createAreaThunk(
  "areas/fetchAreasByCountry",
  (payload = {}) => {
    const { country_id, ...params } = payload;

    return areaService.getAreasByCountry(
      country_id,
      params
    );
  },
  "Failed to fetch areas by country."
);

/*
|--------------------------------------------------------------------------
| AREAS BY REGION
|--------------------------------------------------------------------------
| Payload: { region_id, ...filters }
|--------------------------------------------------------------------------
*/

export const fetchAreasByRegion = createAreaThunk(
  "areas/fetchAreasByRegion",
  (payload = {}) => {
    const { region_id, ...params } = payload;

    return areaService.getAreasByRegion(
      region_id,
      params
    );
  },
  "Failed to fetch areas by region."
);

/*
|--------------------------------------------------------------------------
| AREAS BY COUNTY
|--------------------------------------------------------------------------
| Payload: { county_id, ...filters }
|--------------------------------------------------------------------------
*/

export const fetchAreasByCounty = createAreaThunk(
  "areas/fetchAreasByCounty",
  (payload = {}) => {
    const { county_id, ...params } = payload;

    return areaService.getAreasByCounty(
      county_id,
      params
    );
  },
  "Failed to fetch areas by county."
);

/*
|--------------------------------------------------------------------------
| AREAS BY CITY
|--------------------------------------------------------------------------
| Payload: { city_id, ...filters }
|--------------------------------------------------------------------------
*/

export const fetchAreasByCity = createAreaThunk(
  "areas/fetchAreasByCity",
  (payload = {}) => {
    const { city_id, ...params } = payload;

    return areaService.getAreasByCity(
      city_id,
      params
    );
  },
  "Failed to fetch areas by city."
);

/*
|--------------------------------------------------------------------------
| ACTIVE AREAS BY CITY
|--------------------------------------------------------------------------
*/

export const fetchActiveAreasByCity = createAreaThunk(
  "areas/fetchActiveAreasByCity",
  (city_id) => areaService.getActiveAreasByCity(city_id),
  "Failed to fetch active areas by city."
);

/*
|--------------------------------------------------------------------------
| SEARCH AREAS
|--------------------------------------------------------------------------
*/

export const searchAreas = createAreaThunk(
  "areas/searchAreas",
  (params = {}) => areaService.searchAreas(params),
  "Failed to search areas."
);

/*
|--------------------------------------------------------------------------
| CREATE AREA
|--------------------------------------------------------------------------
*/

export const createArea = createAreaThunk(
  "areas/createArea",
  (data) => areaService.createArea(data),
  "Failed to create area."
);

/*
|--------------------------------------------------------------------------
| UPDATE AREA
|--------------------------------------------------------------------------
| Payload: { id, ...data }
|--------------------------------------------------------------------------
*/

export const updateArea = createAreaThunk(
  "areas/updateArea",
  ({ id, ...data }) => areaService.updateArea(id, data),
  "Failed to update area."
);

/*
|--------------------------------------------------------------------------
| PATCH AREA
|--------------------------------------------------------------------------
| Payload: { id, ...data }
|--------------------------------------------------------------------------
*/

export const patchArea = createAreaThunk(
  "areas/patchArea",
  ({ id, ...data }) => areaService.patchArea(id, data),
  "Failed to update area."
);

/*
|--------------------------------------------------------------------------
| DELETE AREA
|--------------------------------------------------------------------------
*/

export const deleteArea = createAreaThunk(
  "areas/deleteArea",
  (id) => areaService.deleteArea(id),
  "Failed to delete area."
);

/*
|--------------------------------------------------------------------------
| ACTIVATE AREA
|--------------------------------------------------------------------------
*/

export const activateArea = createAreaThunk(
  "areas/activateArea",
  (id) => areaService.activateArea(id),
  "Failed to activate area."
);

/*
|--------------------------------------------------------------------------
| DEACTIVATE AREA
|--------------------------------------------------------------------------
*/

export const deactivateArea = createAreaThunk(
  "areas/deactivateArea",
  (id) => areaService.deactivateArea(id),
  "Failed to deactivate area."
);

/*
|--------------------------------------------------------------------------
| UPDATE AREA STATUS
|--------------------------------------------------------------------------
| Payload: { id, is_active }
|--------------------------------------------------------------------------
*/

export const updateAreaStatus = createAreaThunk(
  "areas/updateAreaStatus",
  ({ id, is_active }) =>
    areaService.updateAreaStatus(id, is_active),
  "Failed to update area status."
);

/*
|--------------------------------------------------------------------------
| AREA COUNTS
|--------------------------------------------------------------------------
*/

export const fetchAreaTotalCount = createAreaThunk(
  "areas/fetchAreaTotalCount",
  () => areaService.getTotalCount(),
  "Failed to fetch total area count."
);

export const fetchAreaActiveCount = createAreaThunk(
  "areas/fetchAreaActiveCount",
  () => areaService.getActiveCount(),
  "Failed to fetch active area count."
);

export const fetchAreaInactiveCount = createAreaThunk(
  "areas/fetchAreaInactiveCount",
  () => areaService.getInactiveCount(),
  "Failed to fetch inactive area count."
);

/*
|--------------------------------------------------------------------------
| AREA COUNTS BY LOCATION
|--------------------------------------------------------------------------
*/

export const fetchAreaCountByCountry = createAreaThunk(
  "areas/fetchAreaCountByCountry",
  () => areaService.getCountByCountry(),
  "Failed to fetch area counts by country."
);

export const fetchAreaCountByRegion = createAreaThunk(
  "areas/fetchAreaCountByRegion",
  () => areaService.getCountByRegion(),
  "Failed to fetch area counts by region."
);

export const fetchAreaCountByCounty = createAreaThunk(
  "areas/fetchAreaCountByCounty",
  () => areaService.getCountByCounty(),
  "Failed to fetch area counts by county."
);

export const fetchAreaCountByCity = createAreaThunk(
  "areas/fetchAreaCountByCity",
  () => areaService.getCountByCity(),
  "Failed to fetch area counts by city."
);

/*
|--------------------------------------------------------------------------
| AREAS WITH / WITHOUT PROPERTIES
|--------------------------------------------------------------------------
*/

export const fetchAreasWithPropertiesCount = createAreaThunk(
  "areas/fetchAreasWithPropertiesCount",
  () => areaService.getAreasWithPropertiesCount(),
  "Failed to fetch areas with properties count."
);

export const fetchAreasWithoutPropertiesCount = createAreaThunk(
  "areas/fetchAreasWithoutPropertiesCount",
  () => areaService.getAreasWithoutPropertiesCount(),
  "Failed to fetch areas without properties count."
);

/*
|--------------------------------------------------------------------------
| REPORT BREAKDOWNS
|--------------------------------------------------------------------------
*/

export const fetchAreaStatusBreakdown = createAreaThunk(
  "areas/fetchAreaStatusBreakdown",
  (params = {}) => areaService.getStatusBreakdown(params),
  "Failed to fetch area status breakdown."
);

export const fetchAreaCountryBreakdown = createAreaThunk(
  "areas/fetchAreaCountryBreakdown",
  (params = {}) => areaService.getCountryBreakdown(params),
  "Failed to fetch area country breakdown."
);

export const fetchAreaRegionBreakdown = createAreaThunk(
  "areas/fetchAreaRegionBreakdown",
  (params = {}) => areaService.getRegionBreakdown(params),
  "Failed to fetch area region breakdown."
);

export const fetchAreaCountyBreakdown = createAreaThunk(
  "areas/fetchAreaCountyBreakdown",
  (params = {}) => areaService.getCountyBreakdown(params),
  "Failed to fetch area county breakdown."
);

export const fetchAreaCityBreakdown = createAreaThunk(
  "areas/fetchAreaCityBreakdown",
  (params = {}) => areaService.getCityBreakdown(params),
  "Failed to fetch area city breakdown."
);

/*
|--------------------------------------------------------------------------
| REFRESH AREAS
|--------------------------------------------------------------------------
*/

export const refreshAreas = createAsyncThunk(
  "areas/refreshAreas",
  async (params = {}, { dispatch, rejectWithValue }) => {
    try {
      return await dispatch(fetchAreas(params)).unwrap();
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| REFRESH ALL AREA DATA
|--------------------------------------------------------------------------
*/

export const refreshAll = createAsyncThunk(
  "areas/refreshAll",
  async (params = {}, { dispatch, rejectWithValue }) => {
    try {
      const [areas, statistics] = await Promise.all([
        dispatch(fetchAreas(params)).unwrap(),
        dispatch(fetchAreaStatistics()).unwrap(),
      ]);

      return {
        areas,
        statistics,
      };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/

const initialState = {
  areas: [],
  selectedArea: null,

  statistics: {
    ...DEFAULT_STATISTICS,
  },

  reports: {},

  countByCountry: [],
  countByRegion: [],
  countByCounty: [],
  countByCity: [],

  statusBreakdown: [],
  countryBreakdown: [],
  regionBreakdown: [],
  countyBreakdown: [],
  cityBreakdown: [],

  pagination: {
    ...DEFAULT_PAGINATION,
  },

  filters: {
    ...DEFAULT_FILTERS,
  },

  loading: false,
  detailsLoading: false,
  statisticsLoading: false,
  reportsLoading: false,
  submitting: false,
  deleting: false,
  countsLoading: false,
  breakdownsLoading: false,

  error: null,
  detailsError: null,
  statisticsError: null,
  reportsError: null,

  validationErrors: {},

  lastUpdated: null,
};

/*
|--------------------------------------------------------------------------
| STATE HELPERS
|--------------------------------------------------------------------------
*/

const updateAreaInState = (state, updatedArea) => {
  if (!updatedArea?.id) {
    return;
  }

  const index = state.areas.findIndex(
    (area) => String(area.id) === String(updatedArea.id)
  );

  if (index !== -1) {
    state.areas[index] = {
      ...state.areas[index],
      ...updatedArea,
    };
  }

  if (
    String(state.selectedArea?.id) ===
    String(updatedArea.id)
  ) {
    state.selectedArea = {
      ...state.selectedArea,
      ...updatedArea,
    };
  }
};

/*
|--------------------------------------------------------------------------
| AREA SLICE
|--------------------------------------------------------------------------
*/

const areaSlice = createSlice({
  name: "area",
  initialState,

  /*
  |--------------------------------------------------------------------------
  | SYNCHRONOUS REDUCERS
  |--------------------------------------------------------------------------
  */

  reducers: {
    updateFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
        page: 1,
      };
    },

    resetFilters: (state) => {
      state.filters = {
        ...DEFAULT_FILTERS,
      };
    },

    changePage: (state, action) => {
      state.filters.page = Math.max(
        1,
        Number(action.payload) || 1
      );
    },

    changePerPage: (state, action) => {
      state.filters.per_page = Math.max(
        1,
        Number(action.payload) || 15
      );

      state.filters.page = 1;
    },

    sortAreas: (state, action) => {
      state.filters.sort_by =
        action.payload?.sort_by || "created_at";

      state.filters.sort_direction =
        action.payload?.sort_direction || "desc";

      state.filters.page = 1;
    },

    clearErrors: (state) => {
      state.error = null;
      state.detailsError = null;
      state.statisticsError = null;
      state.reportsError = null;
      state.validationErrors = {};
    },

    clearArea: (state) => {
      state.selectedArea = null;
      state.detailsError = null;
    },

    clearAreas: (state) => {
      state.areas = [];

      state.pagination = {
        ...DEFAULT_PAGINATION,
      };
    },

    setSelectedArea: (state, action) => {
      state.selectedArea = action.payload;
    },
  },

  /*
  |--------------------------------------------------------------------------
  | ASYNC REDUCERS
  |--------------------------------------------------------------------------
  */

  extraReducers: (builder) => {
    /*
    |--------------------------------------------------------------------------
    | FETCH AREAS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchAreas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchAreas.fulfilled, (state, action) => {
        state.loading = false;

        state.areas = getListData(action.payload);

        state.pagination = {
          ...DEFAULT_PAGINATION,
          ...getPagination(action.payload),
        };

        state.lastUpdated = new Date().toISOString();
      })

      .addCase(fetchAreas.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to fetch areas.";

        state.validationErrors =
          action.payload?.errors || {};
      });

    /*
    |--------------------------------------------------------------------------
    | FETCH ALL AREAS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchAllAreas.fulfilled, (state, action) => {
        const areas = getListData(action.payload);

        state.areas = areas;

        state.pagination = {
          ...DEFAULT_PAGINATION,
          current_page: 1,
          last_page: 1,
          total: areas.length,
        };

        state.lastUpdated = new Date().toISOString();
      });

    /*
    |--------------------------------------------------------------------------
    | FETCH SINGLE AREA
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchArea.pending, (state) => {
        state.detailsLoading = true;
        state.detailsError = null;
      })

      .addCase(fetchArea.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedArea = getItemData(action.payload);
      })

      .addCase(fetchArea.rejected, (state, action) => {
        state.detailsLoading = false;

        state.detailsError =
          action.payload?.message ||
          action.error?.message ||
          "Failed to fetch area details.";
      });

    /*
    |--------------------------------------------------------------------------
    | FETCH AREA BY SLUG
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchAreaBySlug.pending, (state) => {
        state.detailsLoading = true;
        state.detailsError = null;
      })

      .addCase(fetchAreaBySlug.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedArea = getItemData(action.payload);
      })

      .addCase(fetchAreaBySlug.rejected, (state, action) => {
        state.detailsLoading = false;

        state.detailsError =
          action.payload?.message ||
          action.error?.message ||
          "Failed to fetch area.";
      });

    /*
    |--------------------------------------------------------------------------
    | FETCH STATISTICS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchAreaStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.statisticsError = null;
      })

      .addCase(fetchAreaStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false;

        state.statistics = {
          ...DEFAULT_STATISTICS,
          ...getStatisticsData(action.payload),
        };
      })

      .addCase(fetchAreaStatistics.rejected, (state, action) => {
        state.statisticsLoading = false;

        state.statisticsError =
          action.payload?.message ||
          action.error?.message ||
          "Failed to fetch area statistics.";
      });

    /*
    |--------------------------------------------------------------------------
    | FETCH REPORTS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchAreaReports.pending, (state) => {
        state.reportsLoading = true;
        state.reportsError = null;
      })

      .addCase(fetchAreaReports.fulfilled, (state, action) => {
        state.reportsLoading = false;
        state.reports = getItemData(action.payload) || {};
      })

      .addCase(fetchAreaReports.rejected, (state, action) => {
        state.reportsLoading = false;

        state.reportsError =
          action.payload?.message ||
          action.error?.message ||
          "Failed to fetch area reports.";
      });

    /*
    |--------------------------------------------------------------------------
    | ACTIVE / INACTIVE AREAS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchActiveAreas.fulfilled, (state, action) => {
        state.areas = getListData(action.payload);

        state.pagination = {
          ...DEFAULT_PAGINATION,
          ...getPagination(action.payload),
        };
      })

      .addCase(fetchInactiveAreas.fulfilled, (state, action) => {
        state.areas = getListData(action.payload);

        state.pagination = {
          ...DEFAULT_PAGINATION,
          ...getPagination(action.payload),
        };
      });

    /*
    |--------------------------------------------------------------------------
    | AREAS BY LOCATION
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchAreasByCountry.fulfilled, (state, action) => {
        state.areas = getListData(action.payload);
        state.pagination = {
          ...DEFAULT_PAGINATION,
          ...getPagination(action.payload),
        };
      })

      .addCase(fetchAreasByRegion.fulfilled, (state, action) => {
        state.areas = getListData(action.payload);
        state.pagination = {
          ...DEFAULT_PAGINATION,
          ...getPagination(action.payload),
        };
      })

      .addCase(fetchAreasByCounty.fulfilled, (state, action) => {
        state.areas = getListData(action.payload);
        state.pagination = {
          ...DEFAULT_PAGINATION,
          ...getPagination(action.payload),
        };
      })

      .addCase(fetchAreasByCity.fulfilled, (state, action) => {
        state.areas = getListData(action.payload);
        state.pagination = {
          ...DEFAULT_PAGINATION,
          ...getPagination(action.payload),
        };
      })

      .addCase(fetchActiveAreasByCity.fulfilled, (state, action) => {
        state.areas = getListData(action.payload);
        state.pagination = {
          ...DEFAULT_PAGINATION,
          ...getPagination(action.payload),
        };
      });

    /*
    |--------------------------------------------------------------------------
    | SEARCH AREAS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(searchAreas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(searchAreas.fulfilled, (state, action) => {
        state.loading = false;
        state.areas = getListData(action.payload);

        state.pagination = {
          ...DEFAULT_PAGINATION,
          ...getPagination(action.payload),
        };
      })

      .addCase(searchAreas.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to search areas.";
      });

    /*
    |--------------------------------------------------------------------------
    | CREATE AREA
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(createArea.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.validationErrors = {};
      })

      .addCase(createArea.fulfilled, (state, action) => {
        state.submitting = false;

        const newArea = getItemData(action.payload);

        if (newArea?.id) {
          state.areas.unshift(newArea);
          state.selectedArea = newArea;

          state.pagination.total =
            Number(state.pagination.total || 0) + 1;
        }

        state.lastUpdated = new Date().toISOString();
      })

      .addCase(createArea.rejected, (state, action) => {
        state.submitting = false;

        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to create area.";

        state.validationErrors =
          action.payload?.errors || {};
      });

    /*
    |--------------------------------------------------------------------------
    | UPDATE AREA
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(updateArea.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.validationErrors = {};
      })

      .addCase(updateArea.fulfilled, (state, action) => {
        state.submitting = false;

        updateAreaInState(
          state,
          getItemData(action.payload)
        );

        state.lastUpdated = new Date().toISOString();
      })

      .addCase(updateArea.rejected, (state, action) => {
        state.submitting = false;

        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to update area.";

        state.validationErrors =
          action.payload?.errors || {};
      });

    /*
    |--------------------------------------------------------------------------
    | PATCH AREA
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(patchArea.fulfilled, (state, action) => {
        updateAreaInState(
          state,
          getItemData(action.payload)
        );

        state.lastUpdated = new Date().toISOString();
      });

    /*
    |--------------------------------------------------------------------------
    | DELETE AREA
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(deleteArea.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })

      .addCase(deleteArea.fulfilled, (state, action) => {
        state.deleting = false;

        const deletedId = action.meta.arg;

        state.areas = state.areas.filter(
          (area) => String(area.id) !== String(deletedId)
        );

        if (
          String(state.selectedArea?.id) ===
          String(deletedId)
        ) {
          state.selectedArea = null;
        }

        state.pagination.total = Math.max(
          0,
          Number(state.pagination.total || 0) - 1
        );

        state.lastUpdated = new Date().toISOString();
      })

      .addCase(deleteArea.rejected, (state, action) => {
        state.deleting = false;

        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to delete area.";
      });

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE AREA
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(activateArea.fulfilled, (state, action) => {
        updateAreaInState(state, {
          ...getItemData(action.payload),
          is_active: true,
        });

        state.lastUpdated = new Date().toISOString();
      });

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE AREA
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(deactivateArea.fulfilled, (state, action) => {
        updateAreaInState(state, {
          ...getItemData(action.payload),
          is_active: false,
        });

        state.lastUpdated = new Date().toISOString();
      });

    /*
    |--------------------------------------------------------------------------
    | UPDATE AREA STATUS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(updateAreaStatus.fulfilled, (state, action) => {
        updateAreaInState(
          state,
          getItemData(action.payload)
        );

        state.lastUpdated = new Date().toISOString();
      });

    /*
    |--------------------------------------------------------------------------
    | AREA COUNTS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchAreaTotalCount.fulfilled, (state, action) => {
        state.statistics.total = getCountValue(
          action.payload,
          "total"
        );
      })

      .addCase(fetchAreaActiveCount.fulfilled, (state, action) => {
        state.statistics.active = getCountValue(
          action.payload,
          "active"
        );
      })

      .addCase(fetchAreaInactiveCount.fulfilled, (state, action) => {
        state.statistics.inactive = getCountValue(
          action.payload,
          "inactive"
        );
      })

      .addCase(fetchAreasWithPropertiesCount.fulfilled, (state, action) => {
        state.statistics.with_properties = getCountValue(
          action.payload,
          "with_properties"
        );
      })

      .addCase(fetchAreasWithoutPropertiesCount.fulfilled, (state, action) => {
        state.statistics.without_properties = getCountValue(
          action.payload,
          "without_properties"
        );
      });

    /*
    |--------------------------------------------------------------------------
    | LOCATION COUNTS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchAreaCountByCountry.fulfilled, (state, action) => {
        state.countByCountry = getListData(action.payload);
      })

      .addCase(fetchAreaCountByRegion.fulfilled, (state, action) => {
        state.countByRegion = getListData(action.payload);
      })

      .addCase(fetchAreaCountByCounty.fulfilled, (state, action) => {
        state.countByCounty = getListData(action.payload);
      })

      .addCase(fetchAreaCountByCity.fulfilled, (state, action) => {
        state.countByCity = getListData(action.payload);
      });

    /*
    |--------------------------------------------------------------------------
    | REPORT BREAKDOWNS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchAreaStatusBreakdown.fulfilled, (state, action) => {
        state.statusBreakdown = getListData(action.payload);
      })

      .addCase(fetchAreaCountryBreakdown.fulfilled, (state, action) => {
        state.countryBreakdown = getListData(action.payload);
      })

      .addCase(fetchAreaRegionBreakdown.fulfilled, (state, action) => {
        state.regionBreakdown = getListData(action.payload);
      })

      .addCase(fetchAreaCountyBreakdown.fulfilled, (state, action) => {
        state.countyBreakdown = getListData(action.payload);
      })

      .addCase(fetchAreaCityBreakdown.fulfilled, (state, action) => {
        state.cityBreakdown = getListData(action.payload);
      });

    /*
    |--------------------------------------------------------------------------
    | REFRESH AREAS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(refreshAreas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(refreshAreas.fulfilled, (state) => {
        state.loading = false;
      })

      .addCase(refreshAreas.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to refresh areas.";
      });

    /*
    |--------------------------------------------------------------------------
    | REFRESH ALL
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(refreshAll.pending, (state) => {
        state.loading = true;
        state.statisticsLoading = true;
      })

      .addCase(refreshAll.fulfilled, (state) => {
        state.loading = false;
        state.statisticsLoading = false;
      })

      .addCase(refreshAll.rejected, (state, action) => {
        state.loading = false;
        state.statisticsLoading = false;

        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to refresh area data.";
      });
  },
});

/*
|--------------------------------------------------------------------------
| ACTIONS
|--------------------------------------------------------------------------
*/

export const {
  updateFilters,
  resetFilters,
  changePage,
  changePerPage,
  sortAreas,
  clearErrors,
  clearArea,
  clearAreas,
  setSelectedArea,
} = areaSlice.actions;

/*
|--------------------------------------------------------------------------
| SELECTORS
|--------------------------------------------------------------------------
*/

export const selectAreas = (state) =>
  state.area?.areas || [];

export const selectSelectedArea = (state) =>
  state.area?.selectedArea || null;

export const selectAreaStatistics = (state) =>
  state.area?.statistics || DEFAULT_STATISTICS;

export const selectAreaReports = (state) =>
  state.area?.reports || {};

export const selectAreaPagination = (state) =>
  state.area?.pagination || DEFAULT_PAGINATION;

export const selectAreaFilters = (state) =>
  state.area?.filters || DEFAULT_FILTERS;

export const selectAreaLoading = (state) =>
  state.area?.loading || false;

export const selectAreaDetailsLoading = (state) =>
  state.area?.detailsLoading || false;

export const selectAreaStatisticsLoading = (state) =>
  state.area?.statisticsLoading || false;

export const selectAreaSubmitting = (state) =>
  state.area?.submitting || false;

export const selectAreaDeleting = (state) =>
  state.area?.deleting || false;

export const selectAreaError = (state) =>
  state.area?.error || null;

export const selectAreaDetailsError = (state) =>
  state.area?.detailsError || null;

export const selectAreaValidationErrors = (state) =>
  state.area?.validationErrors || {};

export const selectAreaCountByCountry = (state) =>
  state.area?.countByCountry || [];

export const selectAreaCountByRegion = (state) =>
  state.area?.countByRegion || [];

export const selectAreaCountByCounty = (state) =>
  state.area?.countByCounty || [];

export const selectAreaCountByCity = (state) =>
  state.area?.countByCity || [];

export const selectAreaStatusBreakdown = (state) =>
  state.area?.statusBreakdown || [];

export const selectAreaCountryBreakdown = (state) =>
  state.area?.countryBreakdown || [];

export const selectAreaRegionBreakdown = (state) =>
  state.area?.regionBreakdown || [];

export const selectAreaCountyBreakdown = (state) =>
  state.area?.countyBreakdown || [];

export const selectAreaCityBreakdown = (state) =>
  state.area?.cityBreakdown || [];

/*
|--------------------------------------------------------------------------
| EXPORT REDUCER
|--------------------------------------------------------------------------
*/

export default areaSlice.reducer;
