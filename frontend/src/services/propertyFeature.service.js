/*
|--------------------------------------------------------------------------
| PROPERTY FEATURE SERVICE (AXIOS LAYER - PRODUCTION SAFE)
|--------------------------------------------------------------------------
*/

import api from "../api/axios";

/*
|--------------------------------------------------------------------------
| SAFE UNWRAPPER (Laravel-friendly)
|--------------------------------------------------------------------------
*/
const unwrap = async (promise) => {
  const res = await promise;
  return res?.data ?? res;
};

/*
|--------------------------------------------------------------------------
| VALIDATION HELPERS
|--------------------------------------------------------------------------
*/
const requireValue = (value, message) => {
  if (value === undefined || value === null || value === "") {
    throw new Error(message);
  }
};

/*
|--------------------------------------------------------------------------
| NORMALIZE ID
|--------------------------------------------------------------------------
*/
const getId = (value) =>
  typeof value === "object" ? value?.id : value;

/*
|--------------------------------------------------------------------------
| GET ALL FEATURES
|--------------------------------------------------------------------------
*/
export const getPropertyFeaturesApi = (params = {}) => {
  return unwrap(api.get("/property-features", { params }));
};

/*
|--------------------------------------------------------------------------
| GET FEATURE BY ID
|--------------------------------------------------------------------------
*/
export const getPropertyFeatureApi = (id) => {
  const safeId = getId(id);
  requireValue(safeId, "Feature ID is required");

  return unwrap(api.get(`/property-features/${safeId}`));
};

/*
|--------------------------------------------------------------------------
| GET FEATURE BY SLUG
|--------------------------------------------------------------------------
*/
export const getPropertyFeatureBySlugApi = (slug) => {
  requireValue(slug, "Feature slug is required");

  return unwrap(api.get(`/property-features/slug/${slug}`));
};

/*
|--------------------------------------------------------------------------
| GET FEATURES BY PROPERTY
|--------------------------------------------------------------------------
*/
export const getPropertyFeaturesByPropertyApi = (propertyId, params = {}) => {
  const safeId = getId(propertyId);
  requireValue(safeId, "Property ID is required");

  return unwrap(
    api.get(`/properties/${safeId}/features`, { params })
  );
};

/*
|--------------------------------------------------------------------------
| GET HIGHLIGHTED FEATURES
|--------------------------------------------------------------------------
*/
export const getHighlightedPropertyFeaturesApi = (params = {}) => {
  return unwrap(api.get("/property-features/highlighted", { params }));
};

/*
|--------------------------------------------------------------------------
| SEARCH FEATURES
|--------------------------------------------------------------------------
*/
export const searchPropertyFeaturesApi = (search, params = {}) => {
  requireValue(search, "Search term is required");

  return unwrap(
    api.get("/property-features/search", {
      params: { search, ...params },
    })
  );
};

/*
|--------------------------------------------------------------------------
| CREATE FEATURE
|--------------------------------------------------------------------------
*/
export const createPropertyFeatureApi = (data) => {
  requireValue(data, "Feature data is required");

  return unwrap(api.post("/property-features", data));
};

/*
|--------------------------------------------------------------------------
| UPDATE FEATURE
|--------------------------------------------------------------------------
*/
export const updatePropertyFeatureApi = (id, data) => {
  let safeId = id;
  let safeData = data;

  if (typeof id === "object" && id !== null) {
    safeId = id?.id;
    safeData = id?.data;
  }

  requireValue(safeId, "Feature ID is required");
  requireValue(safeData, "Update data is required");

  return unwrap(api.put(`/property-features/${safeId}`, safeData));
};

/*
|--------------------------------------------------------------------------
| DELETE FEATURE
|--------------------------------------------------------------------------
*/
export const deletePropertyFeatureApi = (id) => {
  const safeId = getId(id);
  requireValue(safeId, "Feature ID is required");

  return unwrap(api.delete(`/property-features/${safeId}`));
};

/*
|--------------------------------------------------------------------------
| TOGGLE STATUS
|--------------------------------------------------------------------------
*/
export const togglePropertyFeatureStatusApi = (id) => {
  const safeId = getId(id);
  requireValue(safeId, "Feature ID is required");

  return unwrap(
    api.patch(`/property-features/${safeId}/toggle-status`)
  );
};

/*
|--------------------------------------------------------------------------
| TOGGLE HIGHLIGHT
|--------------------------------------------------------------------------
*/
export const togglePropertyFeatureHighlightApi = (id) => {
  const safeId = getId(id);
  requireValue(safeId, "Feature ID is required");

  return unwrap(
    api.patch(`/property-features/${safeId}/toggle-highlight`)
  );
};

/*
|--------------------------------------------------------------------------
| ==============================================================
| 🆕 PROPERTY ↔ FEATURE ASSIGNMENT
| ==============================================================
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| GET ASSIGNED FEATURES (BY PROPERTY)
|--------------------------------------------------------------------------
*/
export const getAssignedPropertyFeaturesApi = (propertyId) => {
  const safeId = getId(propertyId);
  requireValue(safeId, "Property ID is required");

  return unwrap(api.get(`/properties/${safeId}/features`));
};

/*
|--------------------------------------------------------------------------
| ASSIGN FEATURE TO PROPERTY
|--------------------------------------------------------------------------
*/
export const assignPropertyFeatureApi = (propertyId, featureId) => {
  const safePropertyId = getId(propertyId);
  const safeFeatureId = getId(featureId);

  requireValue(safePropertyId, "Property ID is required");
  requireValue(safeFeatureId, "Feature ID is required");

  return unwrap(
    api.post(`/properties/${safePropertyId}/features`, {
      feature_id: safeFeatureId,
    })
  );
};

/*
|--------------------------------------------------------------------------
| REMOVE FEATURE FROM PROPERTY
|--------------------------------------------------------------------------
*/
export const removePropertyFeatureApi = (propertyId, featureId) => {
  const safePropertyId = getId(propertyId);
  const safeFeatureId = getId(featureId);

  requireValue(safePropertyId, "Property ID is required");
  requireValue(safeFeatureId, "Feature ID is required");

  return unwrap(
    api.delete(
      `/properties/${safePropertyId}/features/${safeFeatureId}`
    )
  );
};