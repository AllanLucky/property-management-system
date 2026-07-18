import api from "./axios";

/**
 * Get all property visits
 */
export const getPropertyVisits = async (params = {}) => {
  const { data } = await api.get("/property-visits", { params });
  return data;
};

/**
 * Get a single property visit
 */
export const getPropertyVisit = async (id) => {
  const { data } = await api.get(`/property-visits/${id}`);
  return data;
};

/**
 * Create a property visit
 */
export const createPropertyVisit = async (payload) => {
  const { data } = await api.post("/property-visits", payload);
  return data;
};

/**
 * Update a property visit
 */
export const updatePropertyVisit = async (id, payload) => {
  const { data } = await api.put(`/property-visits/${id}`, payload);
  return data;
};

/**
 * Partially update a property visit
 */
export const patchPropertyVisit = async (id, payload) => {
  const { data } = await api.patch(`/property-visits/${id}`, payload);
  return data;
};

/**
 * Delete a property visit
 */
export const deletePropertyVisit = async (id) => {
  const { data } = await api.delete(`/property-visits/${id}`);
  return data;
};

const propertyVisitApi = {
  getPropertyVisits,
  getPropertyVisit,
  createPropertyVisit,
  updatePropertyVisit,
  patchPropertyVisit,
  deletePropertyVisit,
};

export default propertyVisitApi;