
import regionApi from "../api/region.api";

/*
|--------------------------------------------------------------------------
| REGION SERVICE
|--------------------------------------------------------------------------
|
| Handles communication between the Region API and React hooks.
|
| Features:
| - Fetch regions
| - Fetch region statistics
| - Fetch region reports
| - Fetch active / inactive regions
| - Fetch regions by country
| - Search regions
| - Fetch single region by ID or slug
| - Create region
| - Update region
| - Delete region
| - Permanently delete region
| - Activate / deactivate region
| - Toggle region status
|
|--------------------------------------------------------------------------
*/

const regionService = {
  /*
  |--------------------------------------------------------------------------
  | GET ALL REGIONS
  |--------------------------------------------------------------------------
  */

  getRegions: (params = {}) => {
    return regionApi.getRegions(params);
  },

  /*
  |--------------------------------------------------------------------------
  | GET REGION STATISTICS
  |--------------------------------------------------------------------------
  */

  getRegionStatistics: (params = {}) => {
    return regionApi.getRegionStatistics(params);
  },

  /*
  |--------------------------------------------------------------------------
  | GET REGION REPORTS
  |--------------------------------------------------------------------------
  */

  getRegionReports: (params = {}) => {
    return regionApi.getRegionReports(params);
  },

  /*
  |--------------------------------------------------------------------------
  | GET ACTIVE REGIONS
  |--------------------------------------------------------------------------
  */

  getActiveRegions: () => {
    return regionApi.getActiveRegions();
  },

  /*
  |--------------------------------------------------------------------------
  | GET INACTIVE REGIONS
  |--------------------------------------------------------------------------
  */

  getInactiveRegions: () => {
    return regionApi.getInactiveRegions();
  },

  /*
  |--------------------------------------------------------------------------
  | GET REGIONS BY COUNTRY
  |--------------------------------------------------------------------------
  */

  getRegionsByCountry: (countryId) => {
    return regionApi.getRegionsByCountry(countryId);
  },

  /*
  |--------------------------------------------------------------------------
  | SEARCH REGIONS
  |--------------------------------------------------------------------------
  */

  searchRegions: (params = {}) => {
    return regionApi.searchRegions(params);
  },

  /*
  |--------------------------------------------------------------------------
  | GET SINGLE REGION
  |--------------------------------------------------------------------------
  */

  getRegion: (identifier) => {
    return regionApi.getRegion(identifier);
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE REGION
  |--------------------------------------------------------------------------
  */

  createRegion: (payload) => {
    return regionApi.createRegion(payload);
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE REGION
  |--------------------------------------------------------------------------
  */

  updateRegion: (identifier, payload) => {
    return regionApi.updateRegion(identifier, payload);
  },

  /*
  |--------------------------------------------------------------------------
  | PARTIAL UPDATE REGION
  |--------------------------------------------------------------------------
  */

  patchRegion: (identifier, payload) => {
    return regionApi.patchRegion(identifier, payload);
  },

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE REGION
  |--------------------------------------------------------------------------
  */

  activateRegion: (identifier) => {
    return regionApi.activateRegion(identifier);
  },

  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE REGION
  |--------------------------------------------------------------------------
  */

  deactivateRegion: (identifier) => {
    return regionApi.deactivateRegion(identifier);
  },

  /*
  |--------------------------------------------------------------------------
  | TOGGLE REGION STATUS
  |--------------------------------------------------------------------------
  */

  toggleRegionStatus: (identifier) => {
    return regionApi.toggleRegionStatus(identifier);
  },

  /*
  |--------------------------------------------------------------------------
  | DELETE REGION
  |--------------------------------------------------------------------------
  */

  deleteRegion: (identifier) => {
    return regionApi.deleteRegion(identifier);
  },

  /*
  |--------------------------------------------------------------------------
  | FORCE DELETE REGION
  |--------------------------------------------------------------------------
  */

  forceDeleteRegion: (identifier) => {
    return regionApi.forceDeleteRegion(identifier);
  },
};

export default regionService;
