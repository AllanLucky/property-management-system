/*
|--------------------------------------------------------------------------
| PROPERTY FEATURE SERVICES (FIXED + ASSIGNMENT READY)
|--------------------------------------------------------------------------
*/

import {
  getPropertyFeaturesApi,
  getPropertyFeatureApi,
  getPropertyFeatureBySlugApi,
  getPropertyFeaturesByPropertyApi,
  getHighlightedPropertyFeaturesApi,
  searchPropertyFeaturesApi,
  createPropertyFeatureApi,
  updatePropertyFeatureApi,
  deletePropertyFeatureApi,
  togglePropertyFeatureStatusApi,
  togglePropertyFeatureHighlightApi,

  // 🆕 ASSIGNMENT APIS
  getAssignedPropertyFeaturesApi,
  assignPropertyFeatureApi,
  removePropertyFeatureApi,
} from "../services/propertyFeature.service";

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/
const handleError = (error, label) => {
  console.error(`❌ ${label}:`, error?.response?.data || error?.message);
  throw error?.response?.data || error;
};

/*
|--------------------------------------------------------------------------
| RESPONSE NORMALIZER
|--------------------------------------------------------------------------
*/
const normalize = (res) => {
  if (!res) return null;
  if (res?.data) return res.data;
  return res;
};

/*
|--------------------------------------------------------------------------
| SAFE EXECUTOR
|--------------------------------------------------------------------------
*/
const safe = async (promise, label) => {
  try {
    const response = await promise;
    return normalize(response);
  } catch (error) {
    handleError(error, label);
  }
};

/*
|--------------------------------------------------------------------------
| ID NORMALIZER
|--------------------------------------------------------------------------
*/
const getId = (value) =>
  typeof value === "object" ? value?.id : value;

/*
|--------------------------------------------------------------------------
| CORE FEATURE WRAPPERS
|--------------------------------------------------------------------------
*/

/*
| GET ALL FEATURES
*/
export const fetchPropertyFeatures = async (params = {}) => {
  return safe(
    getPropertyFeaturesApi(params),
    "FETCH PROPERTY FEATURES"
  );
};

/*
| GET SINGLE FEATURE
*/
export const fetchPropertyFeature = async (id) => {
  const safeId = getId(id);
  if (!safeId) throw new Error("Feature ID is required");

  return safe(
    getPropertyFeatureApi(safeId),
    "FETCH PROPERTY FEATURE"
  );
};

/*
| GET BY SLUG
*/
export const fetchPropertyFeatureBySlug = async (slug) => {
  if (!slug) throw new Error("Feature slug is required");

  return safe(
    getPropertyFeatureBySlugApi(slug),
    "FETCH PROPERTY FEATURE BY SLUG"
  );
};

/*
| GET BY PROPERTY
*/
export const fetchPropertyFeaturesByProperty = async (
  propertyId,
  params = {}
) => {
  const safeId = getId(propertyId);
  if (!safeId) throw new Error("Property ID is required");

  return safe(
    getPropertyFeaturesByPropertyApi(safeId, params),
    "FETCH PROPERTY FEATURES BY PROPERTY"
  );
};

/*
| GET HIGHLIGHTED
*/
export const fetchHighlightedPropertyFeatures = async (params = {}) => {
  return safe(
    getHighlightedPropertyFeaturesApi(params),
    "FETCH HIGHLIGHTED PROPERTY FEATURES"
  );
};

/*
| SEARCH
*/
export const searchPropertyFeatures = async (search, params = {}) => {
  if (!search) throw new Error("Search term is required");

  return safe(
    searchPropertyFeaturesApi(search, params),
    "SEARCH PROPERTY FEATURES"
  );
};

/*
| CREATE
*/
export const createPropertyFeature = async (data) => {
  if (!data) throw new Error("Feature data is required");

  return safe(
    createPropertyFeatureApi(data),
    "CREATE PROPERTY FEATURE"
  );
};

/*
| UPDATE
*/
export const updatePropertyFeature = async (id, data) => {
  let safeId = id;
  let safeData = data;

  if (typeof id === "object" && id !== null) {
    safeId = id?.id;
    safeData = id?.data;
  }

  if (!safeId) throw new Error("Feature ID is required");
  if (!safeData) throw new Error("Update data is required");

  return safe(
    updatePropertyFeatureApi(safeId, safeData),
    "UPDATE PROPERTY FEATURE"
  );
};

/*
| DELETE
*/
export const deletePropertyFeature = async (id) => {
  const safeId = getId(id);
  if (!safeId) throw new Error("Feature ID is required");

  return safe(
    deletePropertyFeatureApi(safeId),
    "DELETE PROPERTY FEATURE"
  );
};

/*
| TOGGLE STATUS
*/
export const togglePropertyFeatureStatus = async (id) => {
  const safeId = getId(id);
  if (!safeId) throw new Error("Feature ID is required");

  return safe(
    togglePropertyFeatureStatusApi(safeId),
    "TOGGLE PROPERTY FEATURE STATUS"
  );
};

/*
| TOGGLE HIGHLIGHT
*/
export const togglePropertyFeatureHighlight = async (id) => {
  const safeId = getId(id);
  if (!safeId) throw new Error("Feature ID is required");

  return safe(
    togglePropertyFeatureHighlightApi(safeId),
    "TOGGLE PROPERTY FEATURE HIGHLIGHT"
  );
};

/*
|--------------------------------------------------------------------------
| ==============================================================
| 🆕 PROPERTY ↔ FEATURE ASSIGNMENT WRAPPERS
| ==============================================================
|--------------------------------------------------------------------------
*/

/*
| GET ASSIGNED FEATURES
*/
export const fetchAssignedPropertyFeatures = async (propertyId) => {
  const safeId = getId(propertyId);
  if (!safeId) throw new Error("Property ID is required");

  return safe(
    getAssignedPropertyFeaturesApi(safeId),
    "FETCH ASSIGNED PROPERTY FEATURES"
  );
};

/*
| ASSIGN FEATURE TO PROPERTY
*/
export const assignPropertyFeature = async (propertyId, featureId) => {
  const safePropertyId = getId(propertyId);
  const safeFeatureId = getId(featureId);

  if (!safePropertyId) throw new Error("Property ID is required");
  if (!safeFeatureId) throw new Error("Feature ID is required");

  return safe(
    assignPropertyFeatureApi(safePropertyId, safeFeatureId),
    "ASSIGN PROPERTY FEATURE"
  );
};

/*
| REMOVE FEATURE FROM PROPERTY
*/
export const removePropertyFeature = async (propertyId, featureId) => {
  const safePropertyId = getId(propertyId);
  const safeFeatureId = getId(featureId);

  if (!safePropertyId) throw new Error("Property ID is required");
  if (!safeFeatureId) throw new Error("Feature ID is required");

  return safe(
    removePropertyFeatureApi(safePropertyId, safeFeatureId),
    "REMOVE PROPERTY FEATURE"
  );
};