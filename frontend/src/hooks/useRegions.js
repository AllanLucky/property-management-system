
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import regionService from "../services/region.service";

/*
|--------------------------------------------------------------------------
| USE REGIONS HOOK
|--------------------------------------------------------------------------
|
| Handles:
| - Fetch regions
| - Search and filter regions
| - Filter by country and status
| - Pagination
| - Fetch single region by ID or slug
| - Create, update and delete regions
| - Permanently delete regions
| - Activate / deactivate regions
| - Toggle region status
| - Fetch region statistics
| - Fetch region reports
| - Refresh regions and statistics
|
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
  country_id: "",
  code: "",
  name: "",
  status: "",
  is_active: "",
  date_from: "",
  date_to: "",
  per_page: 25,
  page: 1,
  sort_by: "created_at",
  sort_direction: "desc",
};

const DEFAULT_STATISTICS = {
  total: 0,
  active: 0,
  inactive: 0,
  with_counties: 0,
  without_counties: 0,
};

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Extract the API envelope.
 *
 * Supports:
 * - Axios response: { data: { status, data, meta } }
 * - Direct API response: { status, data, meta }
 */
const getPayload = (response) => {
  if (!response || typeof response !== "object") {
    return {};
  }

  // Axios response contains its API envelope in response.data.
  if (
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data) &&
    (
      "status" in response.data ||
      "message" in response.data ||
      "meta" in response.data ||
      "errors" in response.data
    )
  ) {
    return response.data;
  }

  return response;
};

/**
 * Extract collection records.
 */
const extractData = (response) => {
  const payload = getPayload(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

/**
 * Extract pagination metadata.
 */
const extractMeta = (response) => {
  const payload = getPayload(response);
  const meta = payload?.meta ?? {};

  return {
    ...DEFAULT_PAGINATION,
    ...meta,
    total: Number(meta.total ?? 0),
    current_page: Number(meta.current_page ?? 1),
    last_page: Number(meta.last_page ?? 1),
    per_page: Number(meta.per_page ?? 25),
  };
};

/**
 * Extract region statistics.
 *
 * Expected API response:
 *
 * {
 *   status: true,
 *   data: {
 *     total: 8,
 *     active: 8,
 *     inactive: 0,
 *     with_counties: 8,
 *     without_counties: 0
 *   }
 * }
 */
const extractStatistics = (response) => {
  const payload = getPayload(response);

  // The statistics are inside the API envelope's data property.
  const source =
    payload?.data &&
      typeof payload.data === "object" &&
      !Array.isArray(payload.data)
      ? payload.data
      : payload;

  return {
    total: Number(source?.total ?? 0),
    active: Number(source?.active ?? 0),
    inactive: Number(source?.inactive ?? 0),
    with_counties: Number(source?.with_counties ?? 0),
    without_counties: Number(source?.without_counties ?? 0),
  };
};

/**
 * Extract a single record.
 */
const extractRecord = (response) => {
  const payload = getPayload(response);

  return payload?.data ?? payload;
};

/**
 * Extract error message.
 */
const extractError = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
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

/**
 * Remove empty query parameters.
 */
const cleanParams = (params = {}) => {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== "" &&
        value !== null &&
        value !== undefined
    )
  );
};

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

const useRegions = ({
  autoFetch = true,
  initialFilters = {},
} = {}) => {
  /*
  |--------------------------------------------------------------------------
  | INITIAL FILTERS
  |--------------------------------------------------------------------------
  */

  const initialFiltersRef = useRef({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  /*
  |--------------------------------------------------------------------------
  | DATA STATES
  |--------------------------------------------------------------------------
  */

  const [regions, setRegions] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState(null);

  const [statistics, setStatistics] = useState({
    ...DEFAULT_STATISTICS,
  });

  const [reports, setReports] = useState(null);

  const [pagination, setPagination] = useState({
    ...DEFAULT_PAGINATION,
  });

  const [filters, setFilters] = useState(
    initialFiltersRef.current
  );

  /*
  |--------------------------------------------------------------------------
  | LOADING STATES
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [forceDeleting, setForceDeleting] = useState(false);

  const [statusUpdating, setStatusUpdating] = useState(false);

  const [statisticsLoading, setStatisticsLoading] = useState(false);

  const [reportsLoading, setReportsLoading] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | ERROR STATES
  |--------------------------------------------------------------------------
  */

  const [error, setError] = useState(null);

  const [statisticsError, setStatisticsError] = useState(null);

  const [reportsError, setReportsError] = useState(null);

  const [validationErrors, setValidationErrors] = useState({});

  /*
  |--------------------------------------------------------------------------
  | REQUEST REFERENCES
  |--------------------------------------------------------------------------
  */

  const requestIdRef = useRef(0);

  const statisticsRequestIdRef = useRef(0);

  const reportsRequestIdRef = useRef(0);

  /*
  |--------------------------------------------------------------------------
  | FETCH REGIONS
  |--------------------------------------------------------------------------
  */

  const fetchRegions = useCallback(
    async (customFilters = {}) => {
      const requestId = ++requestIdRef.current;

      setLoading(true);
      setError(null);

      try {
        const params = cleanParams({
          ...filters,
          ...customFilters,
        });

        const response = await regionService.getRegions(params);

        if (requestId !== requestIdRef.current) {
          return [];
        }

        const records = extractData(response);
        const meta = extractMeta(response);

        setRegions(records);
        setPagination(meta);

        return records;
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setError(extractError(err));
        }

        throw err;
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [filters]
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH REGION STATISTICS
  |--------------------------------------------------------------------------
  */

  const fetchRegionStatistics = useCallback(
    async (customFilters = {}) => {
      const requestId = ++statisticsRequestIdRef.current;

      setStatisticsLoading(true);
      setStatisticsError(null);

      try {
        const params = cleanParams({
          country_id: filters.country_id,
          search: filters.search,
          date_from: filters.date_from,
          date_to: filters.date_to,
          ...customFilters,
        });

        const response =
          await regionService.getRegionStatistics(params);

        if (requestId !== statisticsRequestIdRef.current) {
          return null;
        }

        const data = extractStatistics(response);

        setStatistics(data);

        return data;
      } catch (err) {
        if (requestId === statisticsRequestIdRef.current) {
          setStatisticsError(extractError(err));
        }

        throw err;
      } finally {
        if (requestId === statisticsRequestIdRef.current) {
          setStatisticsLoading(false);
        }
      }
    },
    [
      filters.country_id,
      filters.search,
      filters.date_from,
      filters.date_to,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH REGION REPORTS
  |--------------------------------------------------------------------------
  */

  const fetchRegionReports = useCallback(
    async (customFilters = {}) => {
      const requestId = ++reportsRequestIdRef.current;

      setReportsLoading(true);
      setReportsError(null);

      try {
        const params = cleanParams({
          search: filters.search,
          country_id: filters.country_id,
          is_active: filters.is_active,
          status: filters.status,
          date_from: filters.date_from,
          date_to: filters.date_to,
          sort_by: filters.sort_by,
          sort_direction: filters.sort_direction,
          ...customFilters,
        });

        const response =
          await regionService.getRegionReports(params);

        if (requestId !== reportsRequestIdRef.current) {
          return null;
        }

        const data = extractRecord(response);

        setReports(data);

        return data;
      } catch (err) {
        if (requestId === reportsRequestIdRef.current) {
          setReportsError(extractError(err));
        }

        throw err;
      } finally {
        if (requestId === reportsRequestIdRef.current) {
          setReportsLoading(false);
        }
      }
    },
    [filters]
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH ACTIVE REGIONS
  |--------------------------------------------------------------------------
  */

  const fetchActiveRegions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await regionService.getActiveRegions();
      const records = extractData(response);

      setRegions(records);

      return records;
    } catch (err) {
      setError(extractError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FETCH INACTIVE REGIONS
  |--------------------------------------------------------------------------
  */

  const fetchInactiveRegions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await regionService.getInactiveRegions();
      const records = extractData(response);

      setRegions(records);

      return records;
    } catch (err) {
      setError(extractError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FETCH REGIONS BY COUNTRY
  |--------------------------------------------------------------------------
  */

  const fetchRegionsByCountry = useCallback(
    async (countryId) => {
      if (!countryId) {
        setRegions([]);
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const response =
          await regionService.getRegionsByCountry(countryId);

        const records = extractData(response);

        setRegions(records);

        return records;
      } catch (err) {
        setError(extractError(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | SEARCH REGIONS
  |--------------------------------------------------------------------------
  */

  const performRegionSearch = useCallback(
    async (search, customFilters = {}) => {
      if (!search?.trim()) {
        return fetchRegions(customFilters);
      }

      setLoading(true);
      setError(null);

      try {
        const params = cleanParams({
          ...filters,
          ...customFilters,
          search: search.trim(),
        });

        const response = await regionService.searchRegions(params);

        const records = extractData(response);

        setRegions(records);
        setPagination(extractMeta(response));

        return records;
      } catch (err) {
        setError(extractError(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [filters, fetchRegions]
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH SINGLE REGION
  |--------------------------------------------------------------------------
  */

  const fetchRegion = useCallback(async (identifier) => {
    if (!identifier) {
      throw new Error("Region ID or slug is required.");
    }

    setLoading(true);
    setError(null);

    try {
      const response = await regionService.getRegion(identifier);

      const record = extractRecord(response);

      setSelectedRegion(record);

      return record;
    } catch (err) {
      setError(extractError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | REFRESH DATA AFTER MUTATIONS
  |--------------------------------------------------------------------------
  */

  const refreshRegions = useCallback(async () => {
    return Promise.all([
      fetchRegions(),
      fetchRegionStatistics(),
    ]);
  }, [fetchRegions, fetchRegionStatistics]);

  /*
  |--------------------------------------------------------------------------
  | CREATE REGION
  |--------------------------------------------------------------------------
  */

  const createRegion = useCallback(
    async (payload) => {
      setSubmitting(true);
      setError(null);
      setValidationErrors({});

      try {
        const response = await regionService.createRegion(payload);

        const record = extractRecord(response);

        await refreshRegions();

        return record;
      } catch (err) {
        setError(extractError(err));
        setValidationErrors(extractValidationErrors(err));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [refreshRegions]
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE REGION
  |--------------------------------------------------------------------------
  */

  const updateRegion = useCallback(
    async (identifier, payload) => {
      setSubmitting(true);
      setError(null);
      setValidationErrors({});

      try {
        const response = await regionService.updateRegion(
          identifier,
          payload
        );

        const record = extractRecord(response);

        setSelectedRegion(record);

        await refreshRegions();

        return record;
      } catch (err) {
        setError(extractError(err));
        setValidationErrors(extractValidationErrors(err));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [refreshRegions]
  );

  /*
  |--------------------------------------------------------------------------
  | DELETE REGION
  |--------------------------------------------------------------------------
  */

  const deleteRegion = useCallback(
    async (identifier) => {
      setDeleting(true);
      setError(null);

      try {
        const response =
          await regionService.deleteRegion(identifier);

        setSelectedRegion(null);

        await refreshRegions();

        return response;
      } catch (err) {
        setError(extractError(err));
        throw err;
      } finally {
        setDeleting(false);
      }
    },
    [refreshRegions]
  );

  /*
  |--------------------------------------------------------------------------
  | FORCE DELETE REGION
  |--------------------------------------------------------------------------
  */

  const forceDeleteRegion = useCallback(async (identifier) => {
    setForceDeleting(true);
    setError(null);

    try {
      const response =
        await regionService.forceDeleteRegion(identifier);

      return response;
    } catch (err) {
      setError(extractError(err));
      throw err;
    } finally {
      setForceDeleting(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE REGION
  |--------------------------------------------------------------------------
  */

  const activateRegion = useCallback(
    async (identifier) => {
      setStatusUpdating(true);
      setError(null);

      try {
        const response =
          await regionService.activateRegion(identifier);

        const record = extractRecord(response);

        if (
          selectedRegion &&
          String(selectedRegion.id) === String(record?.id)
        ) {
          setSelectedRegion(record);
        }

        await refreshRegions();

        return response;
      } catch (err) {
        setError(extractError(err));
        throw err;
      } finally {
        setStatusUpdating(false);
      }
    },
    [selectedRegion, refreshRegions]
  );

  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE REGION
  |--------------------------------------------------------------------------
  */

  const deactivateRegion = useCallback(
    async (identifier) => {
      setStatusUpdating(true);
      setError(null);

      try {
        const response =
          await regionService.deactivateRegion(identifier);

        const record = extractRecord(response);

        if (
          selectedRegion &&
          String(selectedRegion.id) === String(record?.id)
        ) {
          setSelectedRegion(record);
        }

        await refreshRegions();

        return response;
      } catch (err) {
        setError(extractError(err));
        throw err;
      } finally {
        setStatusUpdating(false);
      }
    },
    [selectedRegion, refreshRegions]
  );

  /*
  |--------------------------------------------------------------------------
  | TOGGLE REGION STATUS
  |--------------------------------------------------------------------------
  */

  const toggleRegionStatus = useCallback(
    async (identifier) => {
      setStatusUpdating(true);
      setError(null);

      try {
        const response =
          await regionService.toggleRegionStatus(identifier);

        const record = extractRecord(response);

        if (
          selectedRegion &&
          String(selectedRegion.id) === String(record?.id)
        ) {
          setSelectedRegion(record);
        }

        await refreshRegions();

        return response;
      } catch (err) {
        setError(extractError(err));
        throw err;
      } finally {
        setStatusUpdating(false);
      }
    },
    [selectedRegion, refreshRegions]
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE FILTERS
  |--------------------------------------------------------------------------
  */

  const updateFilters = useCallback((newFilters = {}) => {
    setFilters((previous) => ({
      ...previous,
      ...newFilters,
      page: 1,
    }));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  const resetFilters = useCallback(() => {
    setFilters({
      ...initialFiltersRef.current,
    });
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SEARCH FILTER
  |--------------------------------------------------------------------------
  */

  const searchRegions = useCallback((search) => {
    setFilters((previous) => ({
      ...previous,
      search,
      page: 1,
    }));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FILTER BY COUNTRY
  |--------------------------------------------------------------------------
  */

  const filterByCountry = useCallback((countryId) => {
    setFilters((previous) => ({
      ...previous,
      country_id: countryId,
      page: 1,
    }));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FILTER BY STATUS
  |--------------------------------------------------------------------------
  */

  const filterByStatus = useCallback((status) => {
    setFilters((previous) => ({
      ...previous,
      status,
      is_active:
        status === "active"
          ? true
          : status === "inactive"
            ? false
            : "",
      page: 1,
    }));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CHANGE PAGE
  |--------------------------------------------------------------------------
  */

  const changePage = useCallback((page) => {
    setFilters((previous) => ({
      ...previous,
      page: Number(page) || 1,
    }));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CHANGE PER PAGE
  |--------------------------------------------------------------------------
  */

  const changePerPage = useCallback((perPage) => {
    setFilters((previous) => ({
      ...previous,
      per_page: Number(perPage) || 25,
      page: 1,
    }));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CLEAR SELECTED REGION
  |--------------------------------------------------------------------------
  */

  const clearSelectedRegion = useCallback(() => {
    setSelectedRegion(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CLEAR ERRORS
  |--------------------------------------------------------------------------
  */

  const clearErrors = useCallback(() => {
    setError(null);
    setStatisticsError(null);
    setReportsError(null);
    setValidationErrors({});
  }, []);

  /*
  |--------------------------------------------------------------------------
  | AUTOMATIC FETCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    fetchRegions().catch(() => { });
    fetchRegionStatistics().catch(() => { });
  }, [
    autoFetch,
    fetchRegions,
    fetchRegionStatistics,
  ]);

  /*
  |--------------------------------------------------------------------------
  | RETURN HOOK DATA
  |--------------------------------------------------------------------------
  */

  return {
    // Data
    regions,
    selectedRegion,
    statistics,
    reports,
    pagination,
    filters,

    // Loading states
    loading,
    submitting,
    deleting,
    forceDeleting,
    statusUpdating,
    statisticsLoading,
    reportsLoading,

    // Errors
    error,
    statisticsError,
    reportsError,
    validationErrors,

    // Fetch
    fetchRegions,
    fetchRegion,
    fetchActiveRegions,
    fetchInactiveRegions,
    fetchRegionsByCountry,
    fetchRegionStatistics,
    fetchRegionReports,

    // Search
    performRegionSearch,

    // CRUD
    createRegion,
    updateRegion,
    deleteRegion,
    forceDeleteRegion,

    // Status
    activateRegion,
    deactivateRegion,
    toggleRegionStatus,

    // Filters
    updateFilters,
    resetFilters,
    searchRegions,
    filterByCountry,
    filterByStatus,

    // Pagination
    changePage,
    changePerPage,

    // Utilities
    refreshRegions,
    clearSelectedRegion,
    clearErrors,

    // Convenience
    hasRegions: regions.length > 0,
    isEmpty: !loading && regions.length === 0,

    totalRegions: pagination.total || 0,
    currentPage: pagination.current_page || 1,
    lastPage: pagination.last_page || 1,
    perPage: pagination.per_page || 25,

    hasNextPage:
      pagination.current_page < pagination.last_page,

    hasPreviousPage:
      pagination.current_page > 1,
  };
};

export default useRegions;
