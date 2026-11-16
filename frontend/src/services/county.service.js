
import countyApi from "../api/county.api";

/*
|--------------------------------------------------------------------------
| COUNTY SERVICE
|--------------------------------------------------------------------------
|
| Handles all county-related API operations.
|
| Responsibilities:
| - Fetch counties
| - Fetch county statistics
| - Fetch county reports
| - Fetch active/inactive counties
| - Fetch counties by country
| - Fetch counties by region
| - Search counties
| - Fetch single county
| - Create county
| - Update county
| - Delete county
| - Activate/deactivate county
| - Toggle county status
|
|--------------------------------------------------------------------------
*/

const countyService = {
  /*
  |--------------------------------------------------------------------------
  | GET ALL COUNTIES
  |--------------------------------------------------------------------------
  */

  getCounties: async (params = {}) => {
    return await countyApi.getCounties(params);
  },

  /*
  |--------------------------------------------------------------------------
  | GET COUNTY STATISTICS
  |--------------------------------------------------------------------------
  */

  getCountyStatistics: async (params = {}) => {
    return await countyApi.getCountyStatistics(params);
  },

  /*
  |--------------------------------------------------------------------------
  | GET COUNTY REPORTS
  |--------------------------------------------------------------------------
  */

  getCountyReports: async (params = {}) => {
    return await countyApi.getCountyReports(params);
  },

  /*
  |--------------------------------------------------------------------------
  | GET ACTIVE COUNTIES
  |--------------------------------------------------------------------------
  */

  getActiveCounties: async (params = {}) => {
    return await countyApi.getActiveCounties(params);
  },

  /*
  |--------------------------------------------------------------------------
  | GET INACTIVE COUNTIES
  |--------------------------------------------------------------------------
  */

  getInactiveCounties: async (params = {}) => {
    return await countyApi.getInactiveCounties(params);
  },

  /*
  |--------------------------------------------------------------------------
  | GET COUNTIES BY COUNTRY
  |--------------------------------------------------------------------------
  */

  getCountiesByCountry: async (countryId, params = {}) => {
    return await countyApi.getCountiesByCountry(
      countryId,
      params
    );
  },

  /*
  |--------------------------------------------------------------------------
  | GET COUNTIES BY REGION
  |--------------------------------------------------------------------------
  */

  getCountiesByRegion: async (regionId, params = {}) => {
    return await countyApi.getCountiesByRegion(
      regionId,
      params
    );
  },

  /*
  |--------------------------------------------------------------------------
  | SEARCH COUNTIES
  |--------------------------------------------------------------------------
  */

  searchCounties: async (params = {}) => {
    return await countyApi.searchCounties(params);
  },

  /*
  |--------------------------------------------------------------------------
  | GET SINGLE COUNTY
  |--------------------------------------------------------------------------
  */

  getCounty: async (id) => {
    return await countyApi.getCounty(id);
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE COUNTY
  |--------------------------------------------------------------------------
  */

  createCounty: async (payload) => {
    return await countyApi.createCounty(payload);
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE COUNTY
  |--------------------------------------------------------------------------
  */

  updateCounty: async (id, payload) => {
    return await countyApi.updateCounty(id, payload);
  },

  /*
  |--------------------------------------------------------------------------
  | PATCH COUNTY
  |--------------------------------------------------------------------------
  */

  patchCounty: async (id, payload) => {
    return await countyApi.patchCounty(id, payload);
  },

  /*
  |--------------------------------------------------------------------------
  | DELETE COUNTY
  |--------------------------------------------------------------------------
  */

  deleteCounty: async (id) => {
    return await countyApi.deleteCounty(id);
  },

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE COUNTY
  |--------------------------------------------------------------------------
  */

  activateCounty: async (id) => {
    return await countyApi.activateCounty(id);
  },

  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE COUNTY
  |--------------------------------------------------------------------------
  */

  deactivateCounty: async (id) => {
    return await countyApi.deactivateCounty(id);
  },

  /*
  |--------------------------------------------------------------------------
  | TOGGLE COUNTY STATUS
  |--------------------------------------------------------------------------
  */

  toggleCountyStatus: async (id) => {
    return await countyApi.toggleCountyStatus(id);
  },
};

export default countyService;
