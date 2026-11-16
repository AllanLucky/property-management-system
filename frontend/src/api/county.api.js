
import api from "./axios";

/*
|--------------------------------------------------------------------------
| COUNTY API
|--------------------------------------------------------------------------
|
| Handles HTTP requests for the Counties module.
|
| Base endpoint:
| /api/counties
|
|--------------------------------------------------------------------------
*/

const BASE_URL = "/counties";

const countyApi = {
  /*
  |--------------------------------------------------------------------------
  | GET ALL COUNTIES
  |--------------------------------------------------------------------------
  */

  getCounties: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | GET COUNTY STATISTICS
  |--------------------------------------------------------------------------
  */

  getCountyStatistics: async (params = {}) => {
    const response = await api.get(`${BASE_URL}/statistics`, {
      params,
    });

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | GET COUNTY REPORTS
  |--------------------------------------------------------------------------
  */

  getCountyReports: async (params = {}) => {
    const response = await api.get(`${BASE_URL}/reports`, {
      params,
    });

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | GET ACTIVE COUNTIES
  |--------------------------------------------------------------------------
  */

  getActiveCounties: async (params = {}) => {
    const response = await api.get(`${BASE_URL}/active`, {
      params,
    });

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | GET INACTIVE COUNTIES
  |--------------------------------------------------------------------------
  */

  getInactiveCounties: async (params = {}) => {
    const response = await api.get(`${BASE_URL}/inactive`, {
      params,
    });

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | GET COUNTIES BY COUNTRY
  |--------------------------------------------------------------------------
  */

  getCountiesByCountry: async (countryId, params = {}) => {
    const response = await api.get(
      `${BASE_URL}/country/${countryId}`,
      { params }
    );

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | GET COUNTIES BY REGION
  |--------------------------------------------------------------------------
  */

  getCountiesByRegion: async (regionId, params = {}) => {
    const response = await api.get(
      `${BASE_URL}/region/${regionId}`,
      { params }
    );

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | SEARCH COUNTIES
  |--------------------------------------------------------------------------
  */

  searchCounties: async (params = {}) => {
    const response = await api.get(`${BASE_URL}/search`, {
      params,
    });

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | GET SINGLE COUNTY
  |--------------------------------------------------------------------------
  */

  getCounty: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE COUNTY
  |--------------------------------------------------------------------------
  */

  createCounty: async (payload) => {
    const response = await api.post(BASE_URL, payload);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE COUNTY
  |--------------------------------------------------------------------------
  */

  updateCounty: async (id, payload) => {
    const response = await api.put(`${BASE_URL}/${id}`, payload);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | PATCH COUNTY
  |--------------------------------------------------------------------------
  */

  patchCounty: async (id, payload) => {
    const response = await api.patch(`${BASE_URL}/${id}`, payload);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | DELETE COUNTY
  |--------------------------------------------------------------------------
  */

  deleteCounty: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE COUNTY
  |--------------------------------------------------------------------------
  */

  activateCounty: async (id) => {
    const response = await api.patch(
      `${BASE_URL}/${id}/activate`
    );

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE COUNTY
  |--------------------------------------------------------------------------
  */

  deactivateCounty: async (id) => {
    const response = await api.patch(
      `${BASE_URL}/${id}/deactivate`
    );

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | TOGGLE COUNTY STATUS
  |--------------------------------------------------------------------------
  */

  toggleCountyStatus: async (id) => {
    const response = await api.patch(
      `${BASE_URL}/${id}/toggle-status`
    );

    return response;
  },
};

export default countyApi;
