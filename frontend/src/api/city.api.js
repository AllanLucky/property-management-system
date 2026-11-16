
import api from "./axios";

/*
|--------------------------------------------------------------------------
| CITY API
|--------------------------------------------------------------------------
*/

const CITY_URL = "/cities";

const cityApi = {
  /*
  |--------------------------------------------------------------------------
  | GET CITIES (PAGINATED)
  |--------------------------------------------------------------------------
  */

  getCities: async (params = {}) => {
    const response = await api.get(CITY_URL, { params });
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | GET ALL CITIES
  |--------------------------------------------------------------------------
  */

  getAllCities: async (params = {}) => {
    const response = await api.get(`${CITY_URL}/all`, { params });
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | CITY STATISTICS
  |--------------------------------------------------------------------------
  */

  getCityStatistics: async (params = {}) => {
    const response = await api.get(`${CITY_URL}/statistics`, { params });
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | CITY REPORTS
  |--------------------------------------------------------------------------
  */

  getCityReports: async (params = {}) => {
    const response = await api.get(`${CITY_URL}/reports`, { params });
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | ACTIVE CITIES
  |--------------------------------------------------------------------------
  */

  getActiveCities: async () => {
    const response = await api.get(`${CITY_URL}/active`);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | INACTIVE CITIES
  |--------------------------------------------------------------------------
  */

  getInactiveCities: async () => {
    const response = await api.get(`${CITY_URL}/inactive`);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | CITIES BY COUNTRY
  |--------------------------------------------------------------------------
  */

  getCitiesByCountry: async (countryId) => {
    const response = await api.get(
      `${CITY_URL}/country/${countryId}`
    );

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | CITIES BY REGION
  |--------------------------------------------------------------------------
  */

  getCitiesByRegion: async (regionId) => {
    const response = await api.get(
      `${CITY_URL}/region/${regionId}`
    );

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | CITIES BY COUNTY
  |--------------------------------------------------------------------------
  */

  getCitiesByCounty: async (countyId) => {
    const response = await api.get(
      `${CITY_URL}/county/${countyId}`
    );

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | GET CITY BY ID
  |--------------------------------------------------------------------------
  */

  getCity: async (id) => {
    const response = await api.get(`${CITY_URL}/${id}`);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | GET CITY BY SLUG
  |--------------------------------------------------------------------------
  */

  getCityBySlug: async (slug) => {
    const response = await api.get(
      `${CITY_URL}/slug/${encodeURIComponent(slug)}`
    );

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | GET CITY BY CODE
  |--------------------------------------------------------------------------
  */

  getCityByCode: async (code) => {
    const response = await api.get(
      `${CITY_URL}/code/${encodeURIComponent(code)}`
    );

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE CITY
  |--------------------------------------------------------------------------
  */

  createCity: async (payload) => {
    const response = await api.post(CITY_URL, payload);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE CITY
  |--------------------------------------------------------------------------
  */

  updateCity: async (id, payload) => {
    const response = await api.put(`${CITY_URL}/${id}`, payload);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | DELETE CITY (SOFT DELETE)
  |--------------------------------------------------------------------------
  */

  deleteCity: async (id) => {
    const response = await api.delete(`${CITY_URL}/${id}`);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE CITY
  |--------------------------------------------------------------------------
  */

  activateCity: async (id) => {
    const response = await api.patch(`${CITY_URL}/${id}/activate`);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE CITY
  |--------------------------------------------------------------------------
  */

  deactivateCity: async (id) => {
    const response = await api.patch(`${CITY_URL}/${id}/deactivate`);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | TOGGLE CITY STATUS
  |--------------------------------------------------------------------------
  */

  toggleCityStatus: async (id) => {
    const response = await api.patch(`${CITY_URL}/${id}/toggle-status`);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | GET TRASHED CITIES
  |--------------------------------------------------------------------------
  */

  getTrashedCities: async (params = {}) => {
    const response = await api.get(`${CITY_URL}/trashed`, { params });
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | GET TRASHED CITY
  |--------------------------------------------------------------------------
  */

  getTrashedCity: async (id) => {
    const response = await api.get(`${CITY_URL}/trashed/${id}`);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | RESTORE CITY
  |--------------------------------------------------------------------------
  */

  restoreCity: async (id) => {
    const response = await api.patch(`${CITY_URL}/${id}/restore`);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | FORCE DELETE CITY
  |--------------------------------------------------------------------------
  */

  forceDeleteCity: async (id) => {
    const response = await api.delete(`${CITY_URL}/${id}/force-delete`);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | CHECK CITY EXISTS
  |--------------------------------------------------------------------------
  */

  checkCityExists: async (id) => {
    const response = await api.get(`${CITY_URL}/${id}/exists`);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | CHECK CITY CODE
  |--------------------------------------------------------------------------
  */

  checkCityCode: async (params = {}) => {
    const response = await api.post(`${CITY_URL}/check-code`, params);
    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | CHECK CITY SLUG
  |--------------------------------------------------------------------------
  */

  checkCitySlug: async (params = {}) => {
    const response = await api.post(`${CITY_URL}/check-slug`, params);
    return response;
  },
};

export default cityApi;
