
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import countyService from "../services/county.service";

/*
|--------------------------------------------------------------------------
| Default Values
|--------------------------------------------------------------------------
*/

const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  per_page: 25,
  total: 0,
  from: 0,
  to: 0,
  has_more_pages: false,
};

const DEFAULT_STATISTICS = {
  total: 0,
  active: 0,
  inactive: 0,
  with_cities: 0,
  without_cities: 0,
  with_areas: 0,
  without_areas: 0,
  with_properties: 0,
  without_properties: 0,
};

const DEFAULT_FILTERS = {
  search: "",
  country_id: "",
  region_id: "",
  status: "",
  is_active: "",
  per_page: 25,
  page: 1,
  sort_by: "created_at",
  sort_direction: "desc",
};

/*
|--------------------------------------------------------------------------
| Response Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely unwrap the API response.
 *
 * Supports:
 * response.data.data
 * response.data
 * response
 */
const getPayload = (response) => {
  if (!response) return null;

  const body = response?.data ?? response;

  if (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    Object.prototype.hasOwnProperty.call(body, "data")
  ) {
    return body.data;
  }

  return body;
};

/**
 * Extract Laravel pagination metadata.
 */
const getPagination = (response, fallback = {}) => {
  const body = response?.data ?? response;

  const meta =
    body?.meta ||
    body?.data?.meta ||
    {};

  return {
    ...DEFAULT_PAGINATION,
    ...fallback,
    ...meta,
    current_page: Number(
      meta.current_page ??
      fallback.current_page ??
      1
    ),
    last_page: Number(
      meta.last_page ??
      fallback.last_page ??
      1
    ),
    per_page: Number(
      meta.per_page ??
      fallback.per_page ??
      25
    ),
    total: Number(
      meta.total ??
      fallback.total ??
      0
    ),
    from: Number(meta.from ?? 0),
    to: Number(meta.to ?? 0),
    has_more_pages:
      meta.has_more_pages ??
      (Number(meta.current_page ?? 1) <
        Number(meta.last_page ?? 1)),
  };
};

/**
 * Extract county list from API response.
 */
const extractCounties = (response) => {
  const payload = getPayload(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
};

/**
 * Extract a single county.
 */
const extractCounty = (response) => {
  const payload = getPayload(response);

  if (!payload) return null;

  if (payload?.county) {
    return payload.county;
  }

  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }

  if (
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    payload.id !== undefined
  ) {
    return payload;
  }

  return null;
};

/**
 * Extract statistics.
 */
const extractStatistics = (response) => {
  const payload = getPayload(response);

  const statistics =
    payload?.statistics ||
    payload?.stats ||
    payload?.data ||
    payload ||
    {};

  return {
    total: Number(
      statistics.total ??
      statistics.total_counties ??
      0
    ),

    active: Number(
      statistics.active ??
      statistics.active_counties ??
      0
    ),

    inactive: Number(
      statistics.inactive ??
      statistics.inactive_counties ??
      0
    ),

    with_cities: Number(
      statistics.with_cities ??
      0
    ),

    without_cities: Number(
      statistics.without_cities ??
      0
    ),

    with_areas: Number(
      statistics.with_areas ??
      0
    ),

    without_areas: Number(
      statistics.without_areas ??
      0
    ),

    with_properties: Number(
      statistics.with_properties ??
      0
    ),

    without_properties: Number(
      statistics.without_properties ??
      0
    ),
  };
};

/**
 * Check whether an API response represents success.
 */
const isSuccessfulResponse = (response) => {
  if (!response) return false;

  if (response?.success === true) {
    return true;
  }

  if (response?.status === true) {
    return true;
  }

  if (
    response?.status >= 200 &&
    response?.status < 300
  ) {
    return true;
  }

  const payload = getPayload(response);

  if (
    payload?.id !== undefined ||
    Array.isArray(payload)
  ) {
    return true;
  }

  return false;
};

/**
 * Extract a useful error message.
 */
const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.errors?.county?.[0] ||
  error?.response?.data?.errors?.name?.[0] ||
  error?.message ||
  fallback;

/*
|--------------------------------------------------------------------------
| Hook
|--------------------------------------------------------------------------
*/

const useCounties = ({
  autoFetch = true,
  initialFilters = {},
} = {}) => {
  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [counties, setCounties] = useState([]);

  const [county, setCounty] = useState(null);

  const [statistics, setStatistics] = useState(
    DEFAULT_STATISTICS
  );

  const [pagination, setPagination] = useState(
    DEFAULT_PAGINATION
  );

  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const [loading, setLoading] = useState(false);

  const [detailsLoading, setDetailsLoading] = useState(false);

  const [statisticsLoading, setStatisticsLoading] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState(null);

  const [detailsError, setDetailsError] = useState(null);

  const [statisticsError, setStatisticsError] =
    useState(null);

  const [lastUpdated, setLastUpdated] = useState(null);

  const mountedRef = useRef(false);

  const requestRef = useRef(0);

  /*
  |--------------------------------------------------------------------------
  | Error Handler
  |--------------------------------------------------------------------------
  */

  const handleError = useCallback(
    (err, fallback = "Something went wrong.") => {
      const message = getErrorMessage(err, fallback);

      setError(message);

      return {
        success: false,
        message,
        errors:
          err?.response?.data?.errors ||
          err?.errors ||
          {},
        error: err,
      };
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Fetch Counties
  |--------------------------------------------------------------------------
  */

  const fetchCounties = useCallback(
    async (params = {}) => {
      const requestId = ++requestRef.current;

      setLoading(true);
      setError(null);

      try {
        const query = {
          ...filters,
          ...params,
        };

        Object.keys(query).forEach((key) => {
          if (
            query[key] === "" ||
            query[key] === null ||
            query[key] === undefined
          ) {
            delete query[key];
          }
        });

        const response =
          await countyService.getCounties(query);

        const countyData = extractCounties(response);

        const pageData = getPagination(response, {
          current_page: query.page,
          per_page: query.per_page,
        });

        if (
          mountedRef.current &&
          requestId === requestRef.current
        ) {
          setCounties(countyData);
          setPagination(pageData);
          setLastUpdated(new Date());
        }

        return {
          success: true,
          data: countyData,
          pagination: pageData,
          response,
        };
      } catch (err) {
        if (
          mountedRef.current &&
          requestId === requestRef.current
        ) {
          handleError(
            err,
            "Unable to fetch counties."
          );
        }

        return {
          success: false,
          data: [],
          error: err,
          message: getErrorMessage(
            err,
            "Unable to fetch counties."
          ),
        };
      } finally {
        if (
          mountedRef.current &&
          requestId === requestRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [filters, handleError]
  );

  /*
  |--------------------------------------------------------------------------
  | Fetch Statistics
  |--------------------------------------------------------------------------
  */

  const fetchCountyStatistics = useCallback(
    async (params = {}) => {
      setStatisticsLoading(true);
      setStatisticsError(null);

      try {
        const response =
          await countyService.getCountyStatistics(params);

        const stats = extractStatistics(response);

        if (mountedRef.current) {
          setStatistics(stats);
        }

        return {
          success: true,
          data: stats,
          response,
        };
      } catch (err) {
        const message = getErrorMessage(
          err,
          "Unable to fetch county statistics."
        );

        if (mountedRef.current) {
          setStatisticsError(message);
        }

        return {
          success: false,
          message,
          error: err,
        };
      } finally {
        if (mountedRef.current) {
          setStatisticsLoading(false);
        }
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Fetch Reports
  |--------------------------------------------------------------------------
  */

  const fetchCountyReports = useCallback(
    async (params = {}) => {
      try {
        const response =
          await countyService.getCountyReports(params);

        return {
          success: true,
          data: getPayload(response),
          response,
        };
      } catch (err) {
        return {
          success: false,
          message: getErrorMessage(
            err,
            "Unable to fetch county reports."
          ),
          error: err,
        };
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Fetch Active Counties
  |--------------------------------------------------------------------------
  */

  const fetchActiveCounties = useCallback(
    async (params = {}) => {
      try {
        const response =
          await countyService.getActiveCounties(params);

        return {
          success: true,
          data: extractCounties(response),
          response,
        };
      } catch (err) {
        return {
          success: false,
          data: [],
          message: getErrorMessage(
            err,
            "Unable to fetch active counties."
          ),
          error: err,
        };
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Fetch Inactive Counties
  |--------------------------------------------------------------------------
  */

  const fetchInactiveCounties = useCallback(
    async (params = {}) => {
      try {
        const response =
          await countyService.getInactiveCounties(params);

        return {
          success: true,
          data: extractCounties(response),
          response,
        };
      } catch (err) {
        return {
          success: false,
          data: [],
          message: getErrorMessage(
            err,
            "Unable to fetch inactive counties."
          ),
          error: err,
        };
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Fetch Counties By Country
  |--------------------------------------------------------------------------
  */

  const fetchCountiesByCountry = useCallback(
    async (countryId, params = {}) => {
      if (!countryId) {
        return {
          success: false,
          data: [],
          message: "Country ID is required.",
        };
      }

      try {
        const response =
          await countyService.getCountiesByCountry(
            countryId,
            params
          );

        return {
          success: true,
          data: extractCounties(response),
          response,
        };
      } catch (err) {
        return {
          success: false,
          data: [],
          message: getErrorMessage(
            err,
            "Unable to fetch counties for this country."
          ),
          error: err,
        };
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Fetch Counties By Region
  |--------------------------------------------------------------------------
  */

  const fetchCountiesByRegion = useCallback(
    async (regionId, params = {}) => {
      if (!regionId) {
        return {
          success: false,
          data: [],
          message: "Region ID is required.",
        };
      }

      try {
        const response =
          await countyService.getCountiesByRegion(
            regionId,
            params
          );

        return {
          success: true,
          data: extractCounties(response),
          response,
        };
      } catch (err) {
        return {
          success: false,
          data: [],
          message: getErrorMessage(
            err,
            "Unable to fetch counties for this region."
          ),
          error: err,
        };
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Search Counties
  |--------------------------------------------------------------------------
  */

  const searchCounties = useCallback(
    async (search, params = {}) => {
      try {
        const response =
          await countyService.searchCounties({
            ...params,
            search,
          });

        return {
          success: true,
          data: extractCounties(response),
          response,
        };
      } catch (err) {
        return {
          success: false,
          data: [],
          message: getErrorMessage(
            err,
            "Unable to search counties."
          ),
          error: err,
        };
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Fetch Single County
  |--------------------------------------------------------------------------
  */

  const fetchCounty = useCallback(
    async (id) => {
      if (!id) {
        return {
          success: false,
          message: "County ID is required.",
        };
      }

      setDetailsLoading(true);
      setDetailsError(null);

      try {
        const response =
          await countyService.getCounty(id);

        const countyData = extractCounty(response);

        if (!countyData) {
          throw new Error(
            "County information was not returned by the server."
          );
        }

        if (mountedRef.current) {
          setCounty(countyData);
        }

        return {
          success: true,
          data: countyData,
          response,
        };
      } catch (err) {
        const message = getErrorMessage(
          err,
          "Unable to fetch county details."
        );

        if (mountedRef.current) {
          setDetailsError(message);
        }

        return {
          success: false,
          message,
          error: err,
        };
      } finally {
        if (mountedRef.current) {
          setDetailsLoading(false);
        }
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Create County
  |--------------------------------------------------------------------------
  */

  const createCounty = useCallback(
    async (payload) => {
      setSubmitting(true);
      setError(null);

      try {
        const response =
          await countyService.createCounty(payload);

        if (!isSuccessfulResponse(response)) {
          throw new Error(
            response?.message ||
            "County could not be created."
          );
        }

        const createdCounty = extractCounty(response);

        if (mountedRef.current) {
          if (createdCounty) {
            setCounties((previous) => [
              createdCounty,
              ...previous.filter(
                (item) => item.id !== createdCounty.id
              ),
            ]);
          }
        }

        return {
          success: true,
          data: createdCounty,
          response,
          message:
            response?.message ||
            "County created successfully.",
        };
      } catch (err) {
        return handleError(
          err,
          "Unable to create county."
        );
      } finally {
        if (mountedRef.current) {
          setSubmitting(false);
        }
      }
    },
    [handleError]
  );

  /*
  |--------------------------------------------------------------------------
  | Update County
  |--------------------------------------------------------------------------
  */

  const updateCounty = useCallback(
    async (id, payload) => {
      if (!id) {
        return {
          success: false,
          message: "County ID is required.",
        };
      }

      setSubmitting(true);
      setError(null);

      try {
        const response =
          await countyService.updateCounty(id, payload);

        if (!isSuccessfulResponse(response)) {
          throw new Error(
            response?.message ||
            "County could not be updated."
          );
        }

        const updatedCounty = extractCounty(response);

        if (mountedRef.current && updatedCounty) {
          setCounties((previous) =>
            previous.map((item) =>
              item.id === Number(id) ||
                item.id === id
                ? updatedCounty
                : item
            )
          );

          setCounty((previous) =>
            previous?.id === Number(id) ||
              previous?.id === id
              ? updatedCounty
              : previous
          );
        }

        return {
          success: true,
          data: updatedCounty,
          response,
          message:
            response?.message ||
            "County updated successfully.",
        };
      } catch (err) {
        return handleError(
          err,
          "Unable to update county."
        );
      } finally {
        if (mountedRef.current) {
          setSubmitting(false);
        }
      }
    },
    [handleError]
  );

  /*
  |--------------------------------------------------------------------------
  | Delete County
  |--------------------------------------------------------------------------
  */

  const deleteCounty = useCallback(
    async (id) => {
      if (!id) {
        return {
          success: false,
          message: "County ID is required.",
        };
      }

      setDeleting(true);
      setError(null);

      try {
        const response =
          await countyService.deleteCounty(id);

        if (
          response?.success === false ||
          response?.status === false
        ) {
          throw new Error(
            response?.message ||
            "County could not be deleted."
          );
        }

        if (mountedRef.current) {
          setCounties((previous) =>
            previous.filter(
              (item) =>
                String(item.id) !== String(id)
            )
          );

          setCounty((previous) =>
            String(previous?.id) === String(id)
              ? null
              : previous
          );

          setStatistics((previous) => ({
            ...previous,
            total: Math.max(0, previous.total - 1),
          }));
        }

        return {
          success: true,
          response,
          message:
            response?.message ||
            "County deleted successfully.",
        };
      } catch (err) {
        return handleError(
          err,
          "Unable to delete county."
        );
      } finally {
        if (mountedRef.current) {
          setDeleting(false);
        }
      }
    },
    [handleError]
  );

  /*
  |--------------------------------------------------------------------------
  | Activate County
  |--------------------------------------------------------------------------
  */

  const activateCounty = useCallback(
    async (id) => {
      try {
        const response =
          await countyService.activateCounty(id);

        if (!isSuccessfulResponse(response)) {
          throw new Error(
            response?.message ||
            "Unable to activate county."
          );
        }

        if (mountedRef.current) {
          setCounties((previous) =>
            previous.map((item) =>
              String(item.id) === String(id)
                ? {
                  ...item,
                  is_active: true,
                  status: "active",
                  status_label: "Active",
                }
                : item
            )
          );

          setCounty((previous) =>
            String(previous?.id) === String(id)
              ? {
                ...previous,
                is_active: true,
                status: "active",
                status_label: "Active",
              }
              : previous
          );
        }

        return {
          success: true,
          response,
          message:
            response?.message ||
            "County activated successfully.",
        };
      } catch (err) {
        return handleError(
          err,
          "Unable to activate county."
        );
      }
    },
    [handleError]
  );

  /*
  |--------------------------------------------------------------------------
  | Deactivate County
  |--------------------------------------------------------------------------
  */

  const deactivateCounty = useCallback(
    async (id) => {
      try {
        const response =
          await countyService.deactivateCounty(id);

        if (!isSuccessfulResponse(response)) {
          throw new Error(
            response?.message ||
            "Unable to deactivate county."
          );
        }

        if (mountedRef.current) {
          setCounties((previous) =>
            previous.map((item) =>
              String(item.id) === String(id)
                ? {
                  ...item,
                  is_active: false,
                  status: "inactive",
                  status_label: "Inactive",
                }
                : item
            )
          );

          setCounty((previous) =>
            String(previous?.id) === String(id)
              ? {
                ...previous,
                is_active: false,
                status: "inactive",
                status_label: "Inactive",
              }
              : previous
          );
        }

        return {
          success: true,
          response,
          message:
            response?.message ||
            "County deactivated successfully.",
        };
      } catch (err) {
        return handleError(
          err,
          "Unable to deactivate county."
        );
      }
    },
    [handleError]
  );

  /*
  |--------------------------------------------------------------------------
  | Toggle County Status
  |--------------------------------------------------------------------------
  */

  const toggleCountyStatus = useCallback(
    async (id) => {
      try {
        const response =
          await countyService.toggleCountyStatus(id);

        if (!isSuccessfulResponse(response)) {
          throw new Error(
            response?.message ||
            "Unable to change county status."
          );
        }

        const returnedCounty = extractCounty(response);

        if (mountedRef.current) {
          setCounties((previous) =>
            previous.map((item) => {
              if (String(item.id) !== String(id)) {
                return item;
              }

              if (returnedCounty) {
                return returnedCounty;
              }

              const nextActive = !(
                item.is_active === true ||
                item.is_active === 1 ||
                item.is_active === "1"
              );

              return {
                ...item,
                is_active: nextActive,
                status: nextActive ? "active" : "inactive",
                status_label: nextActive ? "Active" : "Inactive",
              };
            })
          );
        }

        return {
          success: true,
          data: returnedCounty,
          response,
          message:
            response?.message ||
            "County status updated successfully.",
        };
      } catch (err) {
        return handleError(
          err,
          "Unable to change county status."
        );
      }
    },
    [handleError]
  );

  /*
  |--------------------------------------------------------------------------
  | Update Filters
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
  | Reset Filters
  |--------------------------------------------------------------------------
  */

  const resetFilters = useCallback(() => {
    setFilters({
      ...DEFAULT_FILTERS,
      ...initialFilters,
    });
  }, [initialFilters]);

  /*
  |--------------------------------------------------------------------------
  | Change Page
  |--------------------------------------------------------------------------
  */

  const changePage = useCallback((page) => {
    setFilters((previous) => ({
      ...previous,
      page,
    }));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Change Per Page
  |--------------------------------------------------------------------------
  */

  const changePerPage = useCallback((perPage) => {
    setFilters((previous) => ({
      ...previous,
      per_page: perPage,
      page: 1,
    }));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Sort Counties
  |--------------------------------------------------------------------------
  */

  const sortCounties = useCallback(
    (sortBy, sortDirection = "asc") => {
      setFilters((previous) => ({
        ...previous,
        sort_by: sortBy,
        sort_direction: sortDirection,
        page: 1,
      }));
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Refresh Counties
  |--------------------------------------------------------------------------
  */

  const refreshCounties = useCallback(
    async (params = {}) => {
      return fetchCounties(params);
    },
    [fetchCounties]
  );

  /*
  |--------------------------------------------------------------------------
  | Refresh All
  |--------------------------------------------------------------------------
  */

  const refreshAll = useCallback(
    async () => {
      const [countyResult, statisticsResult] =
        await Promise.all([
          fetchCounties(),
          fetchCountyStatistics(),
        ]);

      return {
        success:
          countyResult.success &&
          statisticsResult.success,
        counties: countyResult,
        statistics: statisticsResult,
      };
    },
    [fetchCounties, fetchCountyStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | Clear Selected County
  |--------------------------------------------------------------------------
  */

  const clearCounty = useCallback(() => {
    setCounty(null);
    setDetailsError(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Lifecycle
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Auto Fetch
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!autoFetch) return;

    fetchCounties();
  }, [autoFetch, fetchCounties]);

  /*
  |--------------------------------------------------------------------------
  | Return
  |--------------------------------------------------------------------------
  */

  return {
    // Data
    counties,
    county,
    statistics,
    pagination,
    filters,

    // Loading
    loading,
    detailsLoading,
    statisticsLoading,
    submitting,
    deleting,

    // Errors
    error,
    detailsError,
    statisticsError,

    // Metadata
    lastUpdated,

    // Fetch
    fetchCounties,
    fetchCounty,
    fetchCountyStatistics,
    fetchCountyReports,
    fetchActiveCounties,
    fetchInactiveCounties,
    fetchCountiesByCountry,
    fetchCountiesByRegion,
    searchCounties,

    // CRUD
    createCounty,
    updateCounty,
    deleteCounty,

    // Status
    activateCounty,
    deactivateCounty,
    toggleCountyStatus,

    // Filters and pagination
    updateFilters,
    resetFilters,
    changePage,
    changePerPage,
    sortCounties,

    // Refresh
    refreshCounties,
    refreshAll,

    // Utilities
    clearCounty,
    setCounty,
    setCounties,
    setFilters,
    setStatistics,
    setPagination,
    setError,
  };
};

export default useCounties;
