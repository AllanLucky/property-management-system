
import api from "./axios";

/*
|--------------------------------------------------------------------------
| REGION API
|--------------------------------------------------------------------------
|
| Handles HTTP requests for:
| - Fetching and searching regions
| - Region statistics and reports
| - Active / inactive regions
| - Filtering regions by country
| - Fetching a single region by ID or slug
| - Creating and updating regions
| - Activating and deactivating regions
| - Deleting and permanently deleting regions
|
|--------------------------------------------------------------------------
*/

const BASE_URL = "/regions";

const regionApi = {
  /*
  |--------------------------------------------------------------------------
  | GET ALL REGIONS
  |--------------------------------------------------------------------------
  */

  getRegions: async (params = {}) => {
    const response = await api.get(BASE_URL, {
      params,
    });

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | GET REGION STATISTICS
  |--------------------------------------------------------------------------
  */

  getRegionStatistics: async (params = {}) => {
    const response = await api.get(`${BASE_URL}/statistics`, {
      params,
    });

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | GET REGION REPORTS
  |--------------------------------------------------------------------------
  */

  getRegionReports: async (params = {}) => {
    const response = await api.get(`${BASE_URL}/reports`, {
      params,
    });

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | GET ACTIVE REGIONS
  |--------------------------------------------------------------------------
  */

  getActiveRegions: async () => {
    const response = await api.get(`${BASE_URL}/active`);

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | GET INACTIVE REGIONS
  |--------------------------------------------------------------------------
  */

  getInactiveRegions: async () => {
    const response = await api.get(`${BASE_URL}/inactive`);

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | GET REGIONS BY COUNTRY
  |--------------------------------------------------------------------------
  */

  getRegionsByCountry: async (countryId) => {
    const response = await api.get(
      `${BASE_URL}/by-country/${countryId}`
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | SEARCH REGIONS
  |--------------------------------------------------------------------------
  */

  searchRegions: async (params = {}) => {
    const response = await api.get(`${BASE_URL}/search`, {
      params,
    });

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | GET SINGLE REGION BY ID OR SLUG
  |--------------------------------------------------------------------------
  */

  getRegion: async (identifier) => {
    const response = await api.get(
      `${BASE_URL}/${encodeURIComponent(identifier)}`
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE REGION
  |--------------------------------------------------------------------------
  */

  createRegion: async (payload) => {
    const response = await api.post(BASE_URL, payload);

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE REGION
  |--------------------------------------------------------------------------
  */

  updateRegion: async (identifier, payload) => {
    const response = await api.put(
      `${BASE_URL}/${encodeURIComponent(identifier)}`,
      payload
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | PARTIAL UPDATE REGION
  |--------------------------------------------------------------------------
  */

  patchRegion: async (identifier, payload) => {
    const response = await api.patch(
      `${BASE_URL}/${encodeURIComponent(identifier)}`,
      payload
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE REGION
  |--------------------------------------------------------------------------
  */

  activateRegion: async (identifier) => {
    const response = await api.patch(
      `${BASE_URL}/${encodeURIComponent(identifier)}/activate`
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE REGION
  |--------------------------------------------------------------------------
  */

  deactivateRegion: async (identifier) => {
    const response = await api.patch(
      `${BASE_URL}/${encodeURIComponent(identifier)}/deactivate`
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | TOGGLE REGION STATUS
  |--------------------------------------------------------------------------
  */

  toggleRegionStatus: async (identifier) => {
    const response = await api.patch(
      `${BASE_URL}/${encodeURIComponent(identifier)}/toggle-status`
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | DELETE REGION
  |--------------------------------------------------------------------------
  */

  deleteRegion: async (identifier) => {
    const response = await api.delete(
      `${BASE_URL}/${encodeURIComponent(identifier)}`
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | PERMANENTLY DELETE REGION
  |--------------------------------------------------------------------------
  */

  forceDeleteRegion: async (identifier) => {
    const response = await api.delete(
      `${BASE_URL}/${encodeURIComponent(identifier)}/force-delete`
    );

    return response.data;
  },
};

export default regionApi;
