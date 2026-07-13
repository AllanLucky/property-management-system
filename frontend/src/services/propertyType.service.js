import {
  getPropertyTypesApi,
  getPropertyTypeApi,
  createPropertyTypeApi,
  updatePropertyTypeApi,
  deletePropertyTypeApi,
  togglePropertyTypeStatusApi,
  togglePropertyTypeFeaturedApi,
} from "../api/propertyType.api";

/*
|--------------------------------------------------------------------------
| PROPERTY TYPE SERVICE
|--------------------------------------------------------------------------
| Business logic layer between API and Redux / UI
|--------------------------------------------------------------------------
*/

/**
 * Normalize API response safely
 * Handles both:
 * - { status: true, data: ... }
 * - axios raw response
 */
const extractData = (response) => {
  return response?.data ?? response;
};

/*
|--------------------------------------------------------------------------
| GET ALL PROPERTY TYPES
|--------------------------------------------------------------------------
*/
export const getPropertyTypesService = async (params = {}) => {
  try {
    const response = await getPropertyTypesApi(params);

    // backend structure: { status, message, data }
    return extractData(response);
  } catch (error) {
    throw error?.response?.data || error;
  }
};

/*
|--------------------------------------------------------------------------
| GET SINGLE PROPERTY TYPE
|--------------------------------------------------------------------------
*/
export const getPropertyTypeService = async (id) => {
  try {
    const response = await getPropertyTypeApi(id);
    return extractData(response);
  } catch (error) {
    throw error?.response?.data || error;
  }
};

/*
|--------------------------------------------------------------------------
| CREATE PROPERTY TYPE
|--------------------------------------------------------------------------
*/
export const createPropertyTypeService = async (data) => {
  try {
    const response = await createPropertyTypeApi(data);
    return extractData(response);
  } catch (error) {
    throw error?.response?.data || error;
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE PROPERTY TYPE
|--------------------------------------------------------------------------
*/
export const updatePropertyTypeService = async (id, data) => {
  try {
    const response = await updatePropertyTypeApi(id, data);
    return extractData(response);
  } catch (error) {
    throw error?.response?.data || error;
  }
};

/*
|--------------------------------------------------------------------------
| DELETE PROPERTY TYPE
|--------------------------------------------------------------------------
*/
export const deletePropertyTypeService = async (id) => {
  try {
    const response = await deletePropertyTypeApi(id);
    return extractData(response);
  } catch (error) {
    throw error?.response?.data || error;
  }
};

/*
|--------------------------------------------------------------------------
| TOGGLE STATUS
|--------------------------------------------------------------------------
*/
export const togglePropertyTypeStatusService = async (id) => {
  try {
    const response = await togglePropertyTypeStatusApi(id);
    return extractData(response);
  } catch (error) {
    throw error?.response?.data || error;
  }
};

/*
|--------------------------------------------------------------------------
| TOGGLE FEATURED
|--------------------------------------------------------------------------
*/
export const togglePropertyTypeFeaturedService = async (id) => {
  try {
    const response = await togglePropertyTypeFeaturedApi(id);
    return extractData(response);
  } catch (error) {
    throw error?.response?.data || error;
  }
};