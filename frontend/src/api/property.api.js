import {
  getPropertiesApi,
  getPropertyApi,
  createPropertyApi,
  updatePropertyApi,
  deletePropertyApi,
} from "../services/property.service";

/*
|--------------------------------------------------------------------------
| SAFE ERROR HANDLER
|--------------------------------------------------------------------------
*/
const handleError = (error, label) => {
  console.error(`❌ ${label}:`, error?.response?.data || error.message);
  throw error?.response?.data || error;
};

/*
|--------------------------------------------------------------------------
| SAFE EXECUTOR (NO DOUBLE "data" UNWRAPPING BUG)
|--------------------------------------------------------------------------
| NOTE:
| Your service already returns normalized data via handleResponse()
| so we ONLY return result directly here.
*/
const safe = async (promise, label) => {
  try {
    return await promise;
  } catch (error) {
    handleError(error, label);
  }
};

/*
|--------------------------------------------------------------------------
| PROPERTY API WRAPPERS (CLEAN & CONSISTENT)
|--------------------------------------------------------------------------
*/

export const fetchProperties = async (params = {}) => {
  return safe(getPropertiesApi(params), "FETCH PROPERTIES");
};

export const fetchProperty = async (id, params = {}) => {
  return safe(getPropertyApi(id, params), "FETCH PROPERTY");
};

export const createProperty = async (data) => {
  return safe(createPropertyApi(data), "CREATE PROPERTY");
};

export const updateProperty = async (id, data) => {
  return safe(updatePropertyApi(id, data), "UPDATE PROPERTY");
};

export const deleteProperty = async (id) => {
  return safe(deletePropertyApi(id), "DELETE PROPERTY");
};