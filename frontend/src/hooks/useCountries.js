
import { useCallback, useEffect, useRef, useState } from "react";
import countryService from "../services/country.service";

/*
|--------------------------------------------------------------------------
| USE COUNTRIES HOOK
|--------------------------------------------------------------------------
|
| Handles:
| - Fetch countries
| - Search countries
| - Filter countries
| - Pagination
| - Fetch single country
| - Create country
| - Update country
| - Delete country
| - Toggle country status
| - Refresh countries
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| DEFAULT CONFIGURATION
|--------------------------------------------------------------------------
*/

const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  per_page: 25,
  total: 0,
  from: null,
  to: null,
  has_more_pages: false,
};

const DEFAULT_FILTERS = {
  search: "",
  is_active: "",
  per_page: 25,
  page: 1,
};

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Normalize boolean filter values.
 */
const normalizeBoolean = (value) => {
  if (value === "" || value === null || value === undefined) {
    return "";
  }

  if (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  ) {
    return true;
  }

  if (
    value === false ||
    value === 0 ||
    value === "0" ||
    value === "false"
  ) {
    return false;
  }

  return value;
};

/**
 * Extract API error message.
 */
const extractErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

/**
 * Extract validation errors.
 */
const extractValidationErrors = (error) => {
  return error?.response?.data?.errors || {};
};

const extractCountryData = (response) => {
  if (!response) return null;

  return response?.data ?? response;
};

/**
 * Extract country collection.
 *
 * Supports:
 * - Direct array
 * - Laravel: { data: [...] }
 * - Axios + Laravel: { data: { data: [...] } }
 */
const extractCountryList = (response) => {
  if (!response) return [];

  // Direct array
  if (Array.isArray(response)) {
    return response;
  }

  // Axios response containing Laravel envelope
  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  // Laravel response already unwrapped
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  // Nested response
  if (Array.isArray(response?.data?.data?.data)) {
    return response.data.data.data;
  }

  // Direct data property
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

/**
 * Extract Laravel pagination metadata.
 */
const extractPagination = (response) => {
  return (
    response?.meta ||
    response?.data?.meta ||
    response?.data?.data?.meta ||
    DEFAULT_PAGINATION
  );
};

/**
 * Extract a single country from different response structures.
 */
const extractSingleCountry = (response) => {
  if (!response) return null;

  let data = response?.data ?? response;

  // Laravel single-resource envelope
  if (
    data?.data &&
    !Array.isArray(data.data) &&
    typeof data.data === "object"
  ) {
    data = data.data;
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| USE COUNTRIES HOOK
|--------------------------------------------------------------------------
*/

const useCountries = (options = {}) => {
  const {
    autoFetch = true,
    initialFilters = {},
  } = options;

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [countries, setCountries] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const [pagination, setPagination] = useState({
    ...DEFAULT_PAGINATION,
  });

  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  }));

  /*
  |--------------------------------------------------------------------------
  | REFS
  |--------------------------------------------------------------------------
  */

  // Keep the latest filters without recreating fetchCountries.
  const filtersRef = useRef(filters);

  // Prevent outdated requests from overwriting newer results.
  const requestIdRef = useRef(0);

  // Keep track of whether the initial fetch has started.
  const initialFetchRef = useRef(false);

  // Keep latest filter values available to asynchronous callbacks.
  filtersRef.current = filters;

  /*
  |--------------------------------------------------------------------------
  | FETCH COUNTRIES
  |--------------------------------------------------------------------------
  */

  const fetchCountries = useCallback(async (customFilters = {}) => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const appliedFilters = {
        ...filtersRef.current,
        ...customFilters,
      };

      const params = {
        ...appliedFilters,
        is_active: normalizeBoolean(appliedFilters.is_active),
      };

      // Remove empty query parameters.
      Object.keys(params).forEach((key) => {
        if (
          params[key] === "" ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      const response = await countryService.getCountries(params);

      const countryList = extractCountryList(response);
      const paginationData = extractPagination(response);

      // Ignore outdated requests.
      if (requestId !== requestIdRef.current) {
        return {
          success: false,
          stale: true,
          data: countryList,
        };
      }

      setCountries(countryList);

      setPagination({
        ...DEFAULT_PAGINATION,
        ...paginationData,
      });

      // Update filters only when custom filters are supplied.
      if (Object.keys(customFilters).length > 0) {
        const updatedFilters = {
          ...filtersRef.current,
          ...customFilters,
        };

        filtersRef.current = updatedFilters;
        setFilters(updatedFilters);
      }

      return {
        success: true,
        data: countryList,
        response,
      };
    } catch (err) {
      const message = extractErrorMessage(err);

      // Ignore errors from outdated requests.
      if (requestId !== requestIdRef.current) {
        return {
          success: false,
          stale: true,
          message,
        };
      }

      setError(message);

      // Preserve previously loaded countries on refresh failure.

      return {
        success: false,
        message,
        errors: extractValidationErrors(err),
      };
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | UPDATE FILTER STATE
  |--------------------------------------------------------------------------
  */

  const updateFilters = useCallback((updatedFilters) => {
    filtersRef.current = updatedFilters;
    setFilters(updatedFilters);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FETCH SINGLE COUNTRY
  |--------------------------------------------------------------------------
  */

  const fetchCountry = useCallback(async (id) => {
    if (!id) {
      return {
        success: false,
        message: "Country ID is required.",
      };
    }

    setError(null);

    try {
      const response = await countryService.getCountryById(id);

      const country = extractSingleCountry(response);

      setSelectedCountry(country);

      return {
        success: true,
        data: country,
      };
    } catch (err) {
      const message = extractErrorMessage(err);

      setError(message);

      return {
        success: false,
        message,
        errors: extractValidationErrors(err),
      };
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CREATE COUNTRY
  |--------------------------------------------------------------------------
  */

  const createCountry = useCallback(async (payload) => {
    setSubmitting(true);
    setError(null);
    setValidationErrors({});

    try {
      const response = await countryService.createCountry(payload);

      await fetchCountries();

      return {
        success: true,
        data: extractSingleCountry(response),
        message:
          response?.data?.message ||
          response?.message ||
          "Country created successfully.",
      };
    } catch (err) {
      const message = extractErrorMessage(err);
      const errors = extractValidationErrors(err);

      setError(message);
      setValidationErrors(errors);

      return {
        success: false,
        message,
        errors,
      };
    } finally {
      setSubmitting(false);
    }
  }, [fetchCountries]);

  /*
  |--------------------------------------------------------------------------
  | UPDATE COUNTRY
  |--------------------------------------------------------------------------
  */

  const updateCountry = useCallback(async (id, payload) => {
    if (!id) {
      return {
        success: false,
        message: "Country ID is required.",
      };
    }

    setSubmitting(true);
    setError(null);
    setValidationErrors({});

    try {
      const response = await countryService.updateCountry(id, payload);

      await fetchCountries();

      if (Number(selectedCountry?.id) === Number(id)) {
        await fetchCountry(id);
      }

      return {
        success: true,
        data: extractSingleCountry(response),
        message:
          response?.data?.message ||
          response?.message ||
          "Country updated successfully.",
      };
    } catch (err) {
      const message = extractErrorMessage(err);
      const errors = extractValidationErrors(err);

      setError(message);
      setValidationErrors(errors);

      return {
        success: false,
        message,
        errors,
      };
    } finally {
      setSubmitting(false);
    }
  }, [fetchCountries, fetchCountry, selectedCountry]);

  /*
  |--------------------------------------------------------------------------
  | DELETE COUNTRY
  |--------------------------------------------------------------------------
  */

  const deleteCountry = useCallback(async (id) => {
    if (!id) {
      return {
        success: false,
        message: "Country ID is required.",
      };
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await countryService.deleteCountry(id);

      if (Number(selectedCountry?.id) === Number(id)) {
        setSelectedCountry(null);
      }

      await fetchCountries();

      return {
        success: true,
        message:
          response?.data?.message ||
          response?.message ||
          "Country deleted successfully.",
      };
    } catch (err) {
      const message = extractErrorMessage(err);

      setError(message);

      return {
        success: false,
        message,
        errors: extractValidationErrors(err),
      };
    } finally {
      setDeleting(false);
    }
  }, [fetchCountries, selectedCountry]);

  /*
  |--------------------------------------------------------------------------
  | TOGGLE COUNTRY STATUS
  |--------------------------------------------------------------------------
  */

  const toggleCountryStatus = useCallback(async (id, isActive) => {
    if (!id) {
      return {
        success: false,
        message: "Country ID is required.",
      };
    }

    setStatusUpdating(true);
    setError(null);

    try {
      const response = await countryService.toggleCountryStatus(
        id,
        isActive
      );

      await fetchCountries();

      if (Number(selectedCountry?.id) === Number(id)) {
        await fetchCountry(id);
      }

      return {
        success: true,
        data: extractSingleCountry(response),
        message:
          response?.data?.message ||
          response?.message ||
          "Country status updated successfully.",
      };
    } catch (err) {
      const message = extractErrorMessage(err);

      setError(message);

      return {
        success: false,
        message,
        errors: extractValidationErrors(err),
      };
    } finally {
      setStatusUpdating(false);
    }
  }, [fetchCountries, fetchCountry, selectedCountry]);

  /*
  |--------------------------------------------------------------------------
  | SEARCH COUNTRIES
  |--------------------------------------------------------------------------
  */

  const searchCountries = useCallback((search) => {
    const updatedFilters = {
      ...filtersRef.current,
      search: String(search ?? "").trim(),
      page: 1,
    };

    updateFilters(updatedFilters);

    return fetchCountries(updatedFilters);
  }, [fetchCountries, updateFilters]);

  /*
  |--------------------------------------------------------------------------
  | FILTER COUNTRIES
  |--------------------------------------------------------------------------
  */

  const filterCountries = useCallback((newFilters = {}) => {
    const updatedFilters = {
      ...filtersRef.current,
      ...newFilters,
      page: 1,
    };

    updateFilters(updatedFilters);

    return fetchCountries(updatedFilters);
  }, [fetchCountries, updateFilters]);

  /*
  |--------------------------------------------------------------------------
  | CHANGE PAGE
  |--------------------------------------------------------------------------
  */

  const changePage = useCallback((page) => {
    const updatedFilters = {
      ...filtersRef.current,
      page: Number(page) || 1,
    };

    updateFilters(updatedFilters);

    return fetchCountries(updatedFilters);
  }, [fetchCountries, updateFilters]);

  /*
  |--------------------------------------------------------------------------
  | CHANGE PER PAGE
  |--------------------------------------------------------------------------
  */

  const changePerPage = useCallback((perPage) => {
    const updatedFilters = {
      ...filtersRef.current,
      per_page: Number(perPage) || 25,
      page: 1,
    };

    updateFilters(updatedFilters);

    return fetchCountries(updatedFilters);
  }, [fetchCountries, updateFilters]);

  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  const resetFilters = useCallback(() => {
    const reset = {
      ...DEFAULT_FILTERS,
      ...initialFilters,
    };

    updateFilters(reset);

    return fetchCountries(reset);
  }, [fetchCountries, initialFilters, updateFilters]);

  /*
  |--------------------------------------------------------------------------
  | CLEAR SELECTED COUNTRY
  |--------------------------------------------------------------------------
  */

  const clearSelectedCountry = useCallback(() => {
    setSelectedCountry(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CLEAR ERRORS
  |--------------------------------------------------------------------------
  */

  const clearErrors = useCallback(() => {
    setError(null);
    setValidationErrors({});
  }, []);

  /*
  |--------------------------------------------------------------------------
  | REFRESH COUNTRIES
  |--------------------------------------------------------------------------
  */

  const refreshCountries = useCallback(() => {
    return fetchCountries();
  }, [fetchCountries]);

  /*
  |--------------------------------------------------------------------------
  | AUTO FETCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!autoFetch || initialFetchRef.current) {
      return;
    }

    initialFetchRef.current = true;

    fetchCountries();
  }, [autoFetch, fetchCountries]);

  /*
  |--------------------------------------------------------------------------
  | RETURN
  |--------------------------------------------------------------------------
  */

  return {
    // DATA
    countries,
    selectedCountry,
    pagination,
    filters,

    // LOADING STATES
    loading,
    submitting,
    deleting,
    statusUpdating,

    // ERRORS
    error,
    validationErrors,

    // FETCH ACTIONS
    fetchCountries,
    fetchCountry,
    refreshCountries,

    // CRUD ACTIONS
    createCountry,
    updateCountry,
    deleteCountry,
    toggleCountryStatus,

    // FILTER ACTIONS
    searchCountries,
    filterCountries,
    changePage,
    changePerPage,
    resetFilters,

    // SELECTION
    clearSelectedCountry,

    // ERROR MANAGEMENT
    clearErrors,
  };
};

export default useCountries;
