import api from "./axios";

/*
|--------------------------------------------------------------------------
| PROPERTY TYPE API
|--------------------------------------------------------------------------
| Handles all CRUD operations for Property Types module
*/

/**
 * Get all property types
 * GET: /api/property-types
 */
export const getPropertyTypesApi = async (params = {}) => {
  const response = await api.get("/property-types", {
    params,
  });

  return response.data;
};

/**
 * Get single property type
 * GET: /api/property-types/{id}
 */
export const getPropertyTypeApi = async (id) => {
  const response = await api.get(`/property-types/${id}`);

  return response.data;
};

/**
 * Create new property type
 * POST: /api/property-types
 */
export const createPropertyTypeApi = async (data) => {
  const response = await api.post("/property-types", data);

  return response.data;
};

/**
 * Update property type
 * PUT: /api/property-types/{id}
 */
export const updatePropertyTypeApi = async (id, data) => {
  const response = await api.put(`/property-types/${id}`, data);

  return response.data;
};

/**
 * Delete property type
 * DELETE: /api/property-types/{id}
 */
export const deletePropertyTypeApi = async (id) => {
  const response = await api.delete(`/property-types/${id}`);

  return response.data;
};

/**
 * Toggle status (if backend supports it)
 * PATCH: /api/property-types/{id}/toggle-status
 */
export const togglePropertyTypeStatusApi = async (id) => {
  const response = await api.patch(
    `/property-types/${id}/toggle-status`
  );

  return response.data;
};

/**
 * Toggle featured
 * PATCH: /api/property-types/{id}/toggle-featured
 */
export const togglePropertyTypeFeaturedApi = async (id) => {
  const response = await api.patch(
    `/property-types/${id}/toggle-featured`
  );

  return response.data;
};