
import { useCallback, useState } from "react";

import {
  fetchProperties,
  fetchProperty,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../api/property.api";

const useProperty = () => {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

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

  const getProperties = useCallback(
    async (params = {}) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchProperties(params);

        /*
        |--------------------------------------------------------------------------
        | NORMALIZE RESPONSE
        |--------------------------------------------------------------------------
        */

        let list = [];

        if (Array.isArray(response?.data)) {
          list = response.data;
        } else if (
          Array.isArray(response?.data?.data)
        ) {
          list = response.data.data;
        } else if (Array.isArray(response)) {
          list = response;
        }

        /*
        |--------------------------------------------------------------------------
        | SET PROPERTIES
        |--------------------------------------------------------------------------
        */

        setProperties(list);

        /*
        |--------------------------------------------------------------------------
        | PAGINATION
        |--------------------------------------------------------------------------
        */

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

        /*
        |--------------------------------------------------------------------------
        | MESSAGE
        |--------------------------------------------------------------------------
        */

        setMessage(
          response?.message ?? null
        );

        return response;
      } catch (err) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load properties";

        setError(errorMessage);

        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | GET SINGLE PROPERTY
  |--------------------------------------------------------------------------
  */

  const getProperty = useCallback(
    async (id) => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await fetchProperty(id);

        /*
        |--------------------------------------------------------------------------
        | SET PROPERTY
        |--------------------------------------------------------------------------
        */

        setProperty(
          response?.data ?? null
        );

        setMessage(
          response?.message ?? null
        );

        return response;
      } catch (err) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load property";

        setError(errorMessage);

        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | CREATE PROPERTY
  |--------------------------------------------------------------------------
  */

  const addProperty = useCallback(
    async (payload) => {
      try {
        setLoading(true);
        setError(null);
        setMessage(null);

        /*
        |--------------------------------------------------------------------------
        | CREATE REQUEST
        |--------------------------------------------------------------------------
        */

        const response =
          await createProperty(payload);

        /*
        |--------------------------------------------------------------------------
        | UPDATE CURRENT PROPERTY
        |--------------------------------------------------------------------------
        */

        if (response?.data) {
          setProperty(response.data);
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE PROPERTY LIST
        |--------------------------------------------------------------------------
        */

        const createdProperty =
          response?.data;

        if (createdProperty) {
          setProperties((prev) => [
            createdProperty,
            ...prev,
          ]);
        }

        /*
        |--------------------------------------------------------------------------
        | SUCCESS MESSAGE
        |--------------------------------------------------------------------------
        */

        setMessage(
          response?.message ||
            "Property created successfully"
        );

        return response;
      } catch (err) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to create property";

        setError(errorMessage);

        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE PROPERTY
  |--------------------------------------------------------------------------
  */

  const editProperty = useCallback(
    async (id, payload) => {
      try {
        setLoading(true);
        setError(null);
        setMessage(null);

        /*
        |--------------------------------------------------------------------------
        | UPDATE REQUEST
        |--------------------------------------------------------------------------
        */

        const response =
          await updateProperty(
            id,
            payload
          );

        const updatedProperty =
          response?.data;

        /*
        |--------------------------------------------------------------------------
        | UPDATE CURRENT PROPERTY
        |--------------------------------------------------------------------------
        */

        if (updatedProperty) {
          setProperty(
            updatedProperty
          );
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE PROPERTY LIST
        |--------------------------------------------------------------------------
        */

        setProperties((prev) =>
          prev.map((item) =>
            item.id === id
              ? updatedProperty ||
                item
              : item
          )
        );

        /*
        |--------------------------------------------------------------------------
        | SUCCESS MESSAGE
        |--------------------------------------------------------------------------
        */

        setMessage(
          response?.message ||
            "Property updated successfully"
        );

        return response;
      } catch (err) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to update property";

        setError(errorMessage);

        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | DELETE PROPERTY
  |--------------------------------------------------------------------------
  */

  const removeProperty = useCallback(
    async (id) => {
      try {
        setLoading(true);
        setError(null);
        setMessage(null);

        /*
        |--------------------------------------------------------------------------
        | DELETE REQUEST
        |--------------------------------------------------------------------------
        */

        const response =
          await deleteProperty(id);

        /*
        |--------------------------------------------------------------------------
        | REMOVE FROM LIST
        |--------------------------------------------------------------------------
        */

        setProperties((prev) =>
          prev.filter(
            (item) => item.id !== id
          )
        );

        /*
        |--------------------------------------------------------------------------
        | CLEAR CURRENT PROPERTY
        |--------------------------------------------------------------------------
        */

        setProperty((current) =>
          current?.id === id
            ? null
            : current
        );

        /*
        |--------------------------------------------------------------------------
        | UPDATE PAGINATION TOTAL
        |--------------------------------------------------------------------------
        */

        setPagination((prev) => ({
          ...prev,
          total: Math.max(
            0,
            prev.total - 1
          ),
        }));

        /*
        |--------------------------------------------------------------------------
        | SUCCESS MESSAGE
        |--------------------------------------------------------------------------
        */

        setMessage(
          response?.message ||
            "Property deleted successfully"
        );

        return response;
      } catch (err) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to delete property";

        setError(errorMessage);

        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | CLEAR ERROR
  |--------------------------------------------------------------------------
  */

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CLEAR MESSAGE
  |--------------------------------------------------------------------------
  */

  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CLEAR CURRENT PROPERTY
  |--------------------------------------------------------------------------
  */

  const clearProperty = useCallback(() => {
    setProperty(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | RETURN
  |--------------------------------------------------------------------------
  */

  return {
    /*
    |--------------------------------------------------------------------------
    | DATA
    |--------------------------------------------------------------------------
    */

    properties,
    property,

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    loading,
    error,
    message,

    /*
    |--------------------------------------------------------------------------
    | PAGINATION
    |--------------------------------------------------------------------------
    */

    pagination,

    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */

    getProperties,
    getProperty,

    addProperty,
    editProperty,
    removeProperty,

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    clearError,
    clearMessage,
    clearProperty,
  };
};

export default useProperty;
