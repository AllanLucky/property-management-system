import api from "../api/axios";

const BASE_URL = "/areas";

/*
|--------------------------------------------------------------------------
| RESPONSE HANDLER
|--------------------------------------------------------------------------
*/

const handleResponse = (response) => response.data;

/*
|--------------------------------------------------------------------------
| QUERY PARAMETER HELPER
|--------------------------------------------------------------------------
*/

const buildQueryParams = (params = {}) => {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );
};

/*
|--------------------------------------------------------------------------
| AREA SERVICE
|--------------------------------------------------------------------------
*/

const areaService = {
  /*
  |--------------------------------------------------------------------------
  | RETRIEVE AREAS
  |--------------------------------------------------------------------------
  */

  getAreas: async (params = {}) => {
    const response = await api.get(BASE_URL, {
      params: buildQueryParams(params),
    });

    return handleResponse(response);
  },

  getAllAreas: async (params = {}) => {
    const response = await api.get(`${BASE_URL}/all`, {
      params: buildQueryParams(params),
    });

    return handleResponse(response);
  },

  getArea: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);

    return handleResponse(response);
  },

  getAreaBySlug: async (slug) => {
    const response = await api.get(
      `${BASE_URL}/slug/${encodeURIComponent(slug)}`
    );

    return handleResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | AREA STATISTICS
  |--------------------------------------------------------------------------
  */

  getStatistics: async (params = {}) => {
    const response = await api.get(
      `${BASE_URL}/statistics`,
      {
        params: buildQueryParams(params),
      }
    );

    return handleResponse(response);
  },

  getTotalCount: async (params = {}) => {
    const response = await api.get(
      `${BASE_URL}/count/total`,
      {
        params: buildQueryParams(params),
      }
    );

    return handleResponse(response);
  },

  getActiveCount: async (params = {}) => {
    const response = await api.get(
      `${BASE_URL}/count/active`,
      {
        params: buildQueryParams(params),
      }
    );

    return handleResponse(response);
  },

  getInactiveCount: async (params = {}) => {
    const response = await api.get(
      `${BASE_URL}/count/inactive`,
      {
        params: buildQueryParams(params),
      }
    );

    return handleResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | ACTIVE AND INACTIVE AREAS
  |--------------------------------------------------------------------------
  | These use the index endpoint with filters because the controller
  | does not define separate /active or /inactive endpoints.
  |--------------------------------------------------------------------------
  */

  getActiveAreas: async (params = {}) => {
    const response = await api.get(BASE_URL, {
      params: buildQueryParams({
        ...params,
        is_active: true,
      }),
    });

    return handleResponse(response);
  },

  getInactiveAreas: async (params = {}) => {
    const response = await api.get(BASE_URL, {
      params: buildQueryParams({
        ...params,
        is_active: false,
      }),
    });

    return handleResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | AREAS BY LOCATION
  |--------------------------------------------------------------------------
  */

  getAreasByCountry: async (countryId) => {
    const response = await api.get(
      `${BASE_URL}/country/${countryId}`
    );

    return handleResponse(response);
  },

  getAreasByRegion: async (regionId) => {
    const response = await api.get(
      `${BASE_URL}/region/${regionId}`
    );

    return handleResponse(response);
  },

  getAreasByCounty: async (countyId) => {
    const response = await api.get(
      `${BASE_URL}/county/${countyId}`
    );

    return handleResponse(response);
  },

  getAreasByCity: async (cityId) => {
    const response = await api.get(
      `${BASE_URL}/city/${cityId}`
    );

    return handleResponse(response);
  },

  getActiveAreasByCity: async (cityId) => {
    const response = await api.get(
      `${BASE_URL}/city/${cityId}/active`
    );

    return handleResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | SEARCH AREAS
  |--------------------------------------------------------------------------
  | Controller expects q, not search.
  |--------------------------------------------------------------------------
  */

  searchAreas: async (params = {}) => {
    const { search, q, ...filters } = params;

    const response = await api.get(
      `${BASE_URL}/search`,
      {
        params: buildQueryParams({
          ...filters,
          q: q || search,
        }),
      }
    );

    return handleResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE AREA
  |--------------------------------------------------------------------------
  */

  createArea: async (data) => {
    const response = await api.post(BASE_URL, data);

    return handleResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE AREA
  |--------------------------------------------------------------------------
  */

  updateArea: async (id, data) => {
    const response = await api.put(
      `${BASE_URL}/${id}`,
      data
    );

    return handleResponse(response);
  },

  patchArea: async (id, data) => {
    const response = await api.patch(
      `${BASE_URL}/${id}`,
      data
    );

    return handleResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | DELETE AREA
  |--------------------------------------------------------------------------
  */

  deleteArea: async (id) => {
    const response = await api.delete(
      `${BASE_URL}/${id}`
    );

    return handleResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | AREA STATUS MANAGEMENT
  |--------------------------------------------------------------------------
  */

  activateArea: async (id) => {
    const response = await api.patch(
      `${BASE_URL}/${id}/activate`
    );

    return handleResponse(response);
  },

  deactivateArea: async (id) => {
    const response = await api.patch(
      `${BASE_URL}/${id}/deactivate`
    );

    return handleResponse(response);
  },

  updateAreaStatus: async (id, isActive) => {
    const response = await api.patch(
      `${BASE_URL}/${id}/status`,
      {
        is_active: Boolean(isActive),
      }
    );

    return handleResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | AREA COUNTS BY LOCATION
  |--------------------------------------------------------------------------
  */

  getCountByCountry: async () => {
    const response = await api.get(
      `${BASE_URL}/count-by-country`
    );

    return handleResponse(response);
  },

  getCountByRegion: async () => {
    const response = await api.get(
      `${BASE_URL}/count-by-region`
    );

    return handleResponse(response);
  },

  getCountByCounty: async () => {
    const response = await api.get(
      `${BASE_URL}/count-by-county`
    );

    return handleResponse(response);
  },

  getCountByCity: async () => {
    const response = await api.get(
      `${BASE_URL}/count-by-city`
    );

    return handleResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | PROPERTY STATISTICS
  |--------------------------------------------------------------------------
  */

  getAreasWithPropertiesCount: async () => {
    const response = await api.get(
      `${BASE_URL}/with-properties/count`
    );

    return handleResponse(response);
  },

  getAreasWithoutPropertiesCount: async () => {
    const response = await api.get(
      `${BASE_URL}/without-properties/count`
    );

    return handleResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | AREA REPORTS
  |--------------------------------------------------------------------------
  */

  getReports: async (params = {}) => {
    const response = await api.get(
      `${BASE_URL}/reports`,
      {
        params: buildQueryParams(params),
      }
    );

    return handleResponse(response);
  },

  getStatusBreakdown: async (params = {}) => {
    const response = await api.get(
      `${BASE_URL}/reports/status-breakdown`,
      {
        params: buildQueryParams(params),
      }
    );

    return handleResponse(response);
  },

  getCountryBreakdown: async (params = {}) => {
    const response = await api.get(
      `${BASE_URL}/reports/country-breakdown`,
      {
        params: buildQueryParams(params),
      }
    );

    return handleResponse(response);
  },

  getRegionBreakdown: async (params = {}) => {
    const response = await api.get(
      `${BASE_URL}/reports/region-breakdown`,
      {
        params: buildQueryParams(params),
      }
    );

    return handleResponse(response);
  },

  getCountyBreakdown: async (params = {}) => {
    const response = await api.get(
      `${BASE_URL}/reports/county-breakdown`,
      {
        params: buildQueryParams(params),
      }
    );

    return handleResponse(response);
  },

  getCityBreakdown: async (params = {}) => {
    const response = await api.get(
      `${BASE_URL}/reports/city-breakdown`,
      {
        params: buildQueryParams(params),
      }
    );

    return handleResponse(response);
  },
};

export default areaService;
