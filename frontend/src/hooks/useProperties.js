import { useCallback, useState } from "react";

import {
  fetchProperties,
  fetchProperty,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../api/property.api";

const useProperty = () => {
  const [properties, setProperties] = useState([]);
  const [property, setProperty] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const [message, setMessage] = useState(null);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  /*
  |--------------------------------------------------------------------------
  | GET PROPERTIES
  |--------------------------------------------------------------------------
  */

  const getProperties = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchProperties(params);

      let list = [];

      if (Array.isArray(response?.data)) {
        list = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        list = response.data.data;
      }

      setProperties(list);

      setPagination({
        currentPage:
          response?.data?.current_page ??
          response?.meta?.current_page ??
          1,

        lastPage:
          response?.data?.last_page ??
          response?.meta?.last_page ??
          1,

        total:
          response?.data?.total ??
          response?.meta?.total ??
          list.length,
      });

      setMessage(response?.message ?? null);

      return response;
    } catch (err) {
      setError(
        err?.message ||
          err?.response?.data?.message ||
          "Unable to load properties"
      );

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | GET PROPERTY
  |--------------------------------------------------------------------------
  */

  const getProperty = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchProperty(id);

      setProperty(response?.data ?? null);

      return response;
    } catch (err) {
      setError(
        err?.message ||
          err?.response?.data?.message ||
          "Unable to load property"
      );

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CREATE
  |--------------------------------------------------------------------------
  */

  const addProperty = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      const response = await createProperty(payload);

      setMessage(response?.message);

      return response;
    } catch (err) {
      setError(
        err?.message ||
          err?.response?.data?.message ||
          "Unable to create property"
      );

      throw err;
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE
  |--------------------------------------------------------------------------
  */

  const editProperty = async (id, payload) => {
    try {
      setLoading(true);
      setError(null);

      const response = await updateProperty(id, payload);

      setMessage(response?.message);

      return response;
    } catch (err) {
      setError(
        err?.message ||
          err?.response?.data?.message ||
          "Unable to update property"
      );

      throw err;
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const removeProperty = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const response = await deleteProperty(id);

      setProperties((prev) =>
        prev.filter((item) => item.id !== id)
      );

      setMessage(response?.message);

      return response;
    } catch (err) {
      setError(
        err?.message ||
          err?.response?.data?.message ||
          "Unable to delete property"
      );

      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    properties,
    property,

    loading,
    error,
    message,

    pagination,

    getProperties,
    getProperty,

    addProperty,
    editProperty,
    removeProperty,
  };
};

export default useProperty;