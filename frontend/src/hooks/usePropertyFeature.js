/*
|--------------------------------------------------------------------------
| PROPERTY FEATURE HOOK
|--------------------------------------------------------------------------
| Handles all Property Feature API interactions
|--------------------------------------------------------------------------
*/

import { useState } from "react";

import {
  fetchPropertyFeatures,
  fetchPropertyFeature,
  fetchPropertyFeatureBySlug,
  fetchPropertyFeaturesByProperty,
  fetchHighlightedPropertyFeatures,
  searchPropertyFeatures,
  createPropertyFeature,
  updatePropertyFeature,
  deletePropertyFeature,
  togglePropertyFeatureStatus,
  togglePropertyFeatureHighlight,
} from "../api/propertyFeature.api";

export const usePropertyFeature = () => {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | RESET ERROR
  |--------------------------------------------------------------------------
  */

  const resetError = () => setError(null);

  /*
  |--------------------------------------------------------------------------
  | GET ALL FEATURES
  |--------------------------------------------------------------------------
  */

  const getAllFeatures = async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      return await fetchPropertyFeatures(params);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | GET FEATURE BY ID
  |--------------------------------------------------------------------------
  */

  const getFeature = async (id) => {
    setLoading(true);
    setError(null);

    try {
      return await fetchPropertyFeature(id);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | GET BY SLUG
  |--------------------------------------------------------------------------
  */

  const getFeatureBySlug = async (slug) => {
    setLoading(true);
    setError(null);

    try {
      return await fetchPropertyFeatureBySlug(slug);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | GET BY PROPERTY
  |--------------------------------------------------------------------------
  */

  const getByProperty = async (propertyId, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      return await fetchPropertyFeaturesByProperty(propertyId, params);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | HIGHLIGHTED
  |--------------------------------------------------------------------------
  */

  const getHighlighted = async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      return await fetchHighlightedPropertyFeatures(params);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const searchFeatures = async (search, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      return await searchPropertyFeatures(search, params);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CREATE
  |--------------------------------------------------------------------------
  */

  const createFeature = async (data) => {
    setLoading(true);
    setError(null);

    try {
      return await createPropertyFeature(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE
  |--------------------------------------------------------------------------
  */

  const updateFeature = async (id, data) => {
    setLoading(true);
    setError(null);

    try {
      return await updatePropertyFeature(id, data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const deleteFeature = async (id) => {
    setLoading(true);
    setError(null);

    try {
      return await deletePropertyFeature(id);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | TOGGLE STATUS
  |--------------------------------------------------------------------------
  */

  const toggleStatus = async (id) => {
    setLoading(true);
    setError(null);

    try {
      return await togglePropertyFeatureStatus(id);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | TOGGLE HIGHLIGHT
  |--------------------------------------------------------------------------
  */

  const toggleHighlight = async (id) => {
    setLoading(true);
    setError(null);

    try {
      return await togglePropertyFeatureHighlight(id);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RETURN HOOK API
  |--------------------------------------------------------------------------
  */

  return {
    loading,
    error,
    resetError,

    getAllFeatures,
    getFeature,
    getFeatureBySlug,
    getByProperty,
    getHighlighted,
    searchFeatures,

    createFeature,
    updateFeature,
    deleteFeature,
    toggleStatus,
    toggleHighlight,
  };
};