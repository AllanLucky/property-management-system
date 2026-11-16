import areaService from "../services/area.service";

const areaApi = {
  /*
  |--------------------------------------------------------------------------
  | Areas
  |--------------------------------------------------------------------------
  */

  getAreas: (params = {}) =>
    areaService.getAreas(params),

  getArea: (id) =>
    areaService.getArea(id),

  createArea: (data) =>
    areaService.createArea(data),

  updateArea: (id, data) =>
    areaService.updateArea(id, data),

  patchArea: (id, data) =>
    areaService.patchArea(id, data),

  deleteArea: (id) =>
    areaService.deleteArea(id),

  /*
  |--------------------------------------------------------------------------
  | Statistics and Reports
  |--------------------------------------------------------------------------
  */

  getStatistics: (params = {}) =>
    areaService.getStatistics(params),

  getReports: (params = {}) =>
    areaService.getReports(params),

  /*
  |--------------------------------------------------------------------------
  | Status
  |--------------------------------------------------------------------------
  */

  getActiveAreas: (params = {}) =>
    areaService.getActiveAreas(params),

  getInactiveAreas: (params = {}) =>
    areaService.getInactiveAreas(params),

  activateArea: (id) =>
    areaService.activateArea(id),

  deactivateArea: (id) =>
    areaService.deactivateArea(id),

  toggleAreaStatus: (id) =>
    areaService.toggleAreaStatus(id),

  /*
  |--------------------------------------------------------------------------
  | Location Hierarchy
  |--------------------------------------------------------------------------
  */

  getAreasByCountry: (countryId, params = {}) =>
    areaService.getAreasByCountry(countryId, params),

  getAreasByRegion: (regionId, params = {}) =>
    areaService.getAreasByRegion(regionId, params),

  getAreasByCounty: (countyId, params = {}) =>
    areaService.getAreasByCounty(countyId, params),

  getAreasByCity: (cityId, params = {}) =>
    areaService.getAreasByCity(cityId, params),

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  searchAreas: (params = {}) =>
    areaService.searchAreas(params),

  /*
  |--------------------------------------------------------------------------
  | Validation
  |--------------------------------------------------------------------------
  */

  checkAreaExists: (params = {}) =>
    areaService.checkAreaExists(params),

  checkAreaCode: (code, params = {}) =>
    areaService.checkAreaCode(code, params),

  checkAreaSlug: (slug, params = {}) =>
    areaService.checkAreaSlug(slug, params),
};

export default areaApi;
