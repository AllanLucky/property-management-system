import {
  getPropertyCategoriesApi,
  getPropertyCategoryApi,
  createPropertyCategoryApi,
  updatePropertyCategoryApi,
  deletePropertyCategoryApi,
} from "../services/propertyCategory.service";

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
| SAFE EXECUTOR
|--------------------------------------------------------------------------
*/
const safe = async (promise, label) => {
  try {
    const response = await promise;
    return response?.data; // normalize here
  } catch (error) {
    handleError(error, label);
  }
};

/*
|--------------------------------------------------------------------------
| PROPERTY CATEGORY WRAPPERS
|--------------------------------------------------------------------------
*/

export const fetchPropertyCategories = async (params = {}) => {
  return safe(getPropertyCategoriesApi(params), "FETCH PROPERTY CATEGORIES");
};

export const fetchPropertyCategory = async (id, params = {}) => {
  return safe(getPropertyCategoryApi(id, params), "FETCH PROPERTY CATEGORY");
};

export const createPropertyCategory = async (data) => {
  return safe(createPropertyCategoryApi(data), "CREATE PROPERTY CATEGORY");
};

export const updatePropertyCategory = async (id, data) => {
  return safe(updatePropertyCategoryApi(id, data), "UPDATE PROPERTY CATEGORY");
};

export const deletePropertyCategory = async (id) => {
  return safe(deletePropertyCategoryApi(id), "DELETE PROPERTY CATEGORY");
};