
import cityApi from "../api/city.api";

/*
|--------------------------------------------------------------------------
| CITY SERVICE
|--------------------------------------------------------------------------
*/

const cityService = {
  /*
  |--------------------------------------------------------------------------
  | GET CITIES
  |--------------------------------------------------------------------------
  */

  getCities: async (params = {}) => {
    return await cityApi.getCities(params);
  },

  /*
  |--------------------------------------------------------------------------
  | GET ALL CITIES WITHOUT PAGINATION
  |--------------------------------------------------------------------------
  */

  getAllCities: async (params = {}) => {
    return await cityApi.getAllCities(params);
  },

  /*
  |--------------------------------------------------------------------------
  | CITY STATISTICS
  |--------------------------------------------------------------------------
  */

  getCityStatistics: async (params = {}) => {
    return await cityApi.getCityStatistics(params);
  },

  /*
  |--------------------------------------------------------------------------
  | CITY REPORTS
  |--------------------------------------------------------------------------
  */

  getCityReports: async (params = {}) => {
    return await cityApi.getCityReports(params);
  },

  /*
  |--------------------------------------------------------------------------
  | ACTIVE CITIES
  |--------------------------------------------------------------------------
  */

  getActiveCities: async () => {
    return await cityApi.getActiveCities();
  },

  /*
  |--------------------------------------------------------------------------
  | INACTIVE CITIES
  |--------------------------------------------------------------------------
  */

  getInactiveCities: async () => {
    return await cityApi.getInactiveCities();
  },

  /*
  |--------------------------------------------------------------------------
  | CITIES BY COUNTRY
  |--------------------------------------------------------------------------
  */

  getCitiesByCountry: async (countryId) => {
    return await cityApi.getCitiesByCountry(countryId);
  },

  /*
  |--------------------------------------------------------------------------
  | CITIES BY REGION
  |--------------------------------------------------------------------------
  */

  getCitiesByRegion: async (regionId) => {
    return await cityApi.getCitiesByRegion(regionId);
  },

  /*
  |--------------------------------------------------------------------------
  | CITIES BY COUNTY
  |--------------------------------------------------------------------------
  */

  getCitiesByCounty: async (countyId) => {
    return await cityApi.getCitiesByCounty(countyId);
  },

  /*
  |--------------------------------------------------------------------------
  | GET CITY BY ID
  |--------------------------------------------------------------------------
  */

  getCity: async (id) => {
    return await cityApi.getCity(id);
  },

  /*
  |--------------------------------------------------------------------------
  | GET CITY BY SLUG
  |--------------------------------------------------------------------------
  */

  getCityBySlug: async (slug) => {
    return await cityApi.getCityBySlug(slug);
  },

  /*
  |--------------------------------------------------------------------------
  | GET CITY BY CODE
  |--------------------------------------------------------------------------
  */

  getCityByCode: async (code) => {
    return await cityApi.getCityByCode(code);
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE CITY
  |--------------------------------------------------------------------------
  */

  createCity: async (payload) => {
    return await cityApi.createCity(payload);
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE CITY
  |--------------------------------------------------------------------------
  */

  updateCity: async (id, payload) => {
    return await cityApi.updateCity(id, payload);
  },

  /*
  |--------------------------------------------------------------------------
  | DELETE CITY (SOFT DELETE)
  |--------------------------------------------------------------------------
  */

  deleteCity: async (id) => {
    return await cityApi.deleteCity(id);
  },

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE CITY
  |--------------------------------------------------------------------------
  */

  activateCity: async (id) => {
    return await cityApi.activateCity(id);
  },

  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE CITY
  |--------------------------------------------------------------------------
  */

  deactivateCity: async (id) => {
    return await cityApi.deactivateCity(id);
  },

  /*
  |--------------------------------------------------------------------------
  | TOGGLE CITY STATUS
  |--------------------------------------------------------------------------
  */

  toggleCityStatus: async (id) => {
    return await cityApi.toggleCityStatus(id);
  },

  /*
  |--------------------------------------------------------------------------
  | TRASHED CITIES
  |--------------------------------------------------------------------------
  */

  getTrashedCities: async (params = {}) => {
    return await cityApi.getTrashedCities(params);
  },

  /*
  |--------------------------------------------------------------------------
  | GET TRASHED CITY
  |--------------------------------------------------------------------------
  */

  getTrashedCity: async (id) => {
    return await cityApi.getTrashedCity(id);
  },

  /*
  |--------------------------------------------------------------------------
  | RESTORE CITY
  |--------------------------------------------------------------------------
  */

  restoreCity: async (id) => {
    return await cityApi.restoreCity(id);
  },

  /*
  |--------------------------------------------------------------------------
  | FORCE DELETE CITY
  |--------------------------------------------------------------------------
  */

  forceDeleteCity: async (id) => {
    return await cityApi.forceDeleteCity(id);
  },

  /*
  |--------------------------------------------------------------------------
  | CHECK CITY EXISTS
  |--------------------------------------------------------------------------
  */

  checkCityExists: async (id) => {
    return await cityApi.checkCityExists(id);
  },

  /*
  |--------------------------------------------------------------------------
  | CHECK CITY CODE
  |--------------------------------------------------------------------------
  */

  checkCityCode: async (params = {}) => {
    return await cityApi.checkCityCode(params);
  },

  /*
  |--------------------------------------------------------------------------
  | CHECK CITY SLUG
  |--------------------------------------------------------------------------
  */

  checkCitySlug: async (params = {}) => {
    return await cityApi.checkCitySlug(params);
  },
};

export default cityService;
