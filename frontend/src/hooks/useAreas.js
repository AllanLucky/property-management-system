
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import areaService from "../services/area.service";

/*
|--------------------------------------------------------------------------
| DEFAULT CONFIGURATION
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 25;

const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  per_page: DEFAULT_PER_PAGE,
  total: 0,
  from: 0,
  to: 0,
  has_more_pages: false,
};

const DEFAULT_STATISTICS = {
  total: 0,
  active: 0,
  inactive: 0,

  total_areas: 0,
  active_areas: 0,
  inactive_areas: 0,

  areas_with_properties: 0,
  areas_without_properties: 0,

  active_percentage: 0,
  inactive_percentage: 0,

  by_country: [],
  by_region: [],
  by_county: [],
  by_city: [],
};

const DEFAULT_FILTERS = {
  search: "",
  name: "",
  slug: "",
  code: "",

  country_id: "",
  region_id: "",
  county_id: "",
  city_id: "",

  is_active: "",
  status: "",

  date_from: "",
  date_to: "",

  per_page: DEFAULT_PER_PAGE,
  page: 1,

  sort_by: "created_at",
  sort_direction: "desc",
};

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Extract the actual payload from Laravel API responses.
 *
 * Supports:
 * response.data.data
 * response.data
 * response
 */
const getResponseData = (response) => {
  let result = response?.data ?? response;

  let depth = 0;

  while (
    result &&
    typeof result === "object" &&
    !Array.isArray(result) &&
    result.data !== undefined &&
    depth < 5
  ) {
    result = result.data;
    depth += 1;
  }

  return result;
};

/**
 * Extract API response message.
 */
const getResponseMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
};

/**
 * Extract validation errors.
 */
const getResponseErrors = (error) => {
  return (
    error?.response?.data?.errors ||
    error?.data?.errors ||
    null
  );
};

/**
 * Normalize collection responses.
 */
const normalizeList = (response) => {
  const result = getResponseData(response);

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.areas)) {
    return result.areas;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  return [];
};

/**
 * Extract pagination metadata.
 */
const getPaginationMeta = (response) => {
  return (
    response?.meta?.pagination ||
    response?.meta ||
    response?.data?.meta?.pagination ||
    response?.data?.meta ||
    {}
  );
};

/**
 * Normalize pagination.
 */
const normalizePagination = (response, fallback = {}) => {
  const meta = getPaginationMeta(response);

  return {
    ...DEFAULT_PAGINATION,
    ...fallback,

    current_page: Number(
      meta.current_page ??
      meta.currentPage ??
      fallback.current_page ??
      1
    ),

    last_page: Number(
      meta.last_page ??
      meta.lastPage ??
      fallback.last_page ??
      1
    ),

    per_page: Number(
      meta.per_page ??
      meta.perPage ??
      fallback.per_page ??
      DEFAULT_PER_PAGE
    ),

    total: Number(
      meta.total ??
      fallback.total ??
      0
    ),

    from: Number(
      meta.from ??
      fallback.from ??
      0
    ),

    to: Number(
      meta.to ??
      fallback.to ??
      0
    ),

    has_more_pages:
      meta.has_more_pages ??
      meta.hasMorePages ??
      false,
  };
};

/**
 * Safely convert values into numbers.
 */
const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

/**
 * Normalize area statistics.
 *
 * Supports short names and descriptive Laravel API names.
 */
const normalizeStatistics = (response) => {
  const result = getResponseData(response);

  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    return { ...DEFAULT_STATISTICS };
  }

  const total = toNumber(
    result.total_areas ??
    result.total ??
    result.areas_count ??
    0
  );

  const active = toNumber(
    result.active_areas ??
    result.active ??
    result.active_count ??
    0
  );

  const inactive = toNumber(
    result.inactive_areas ??
    result.inactive ??
    result.inactive_count ??
    0
  );

  const withProperties = toNumber(
    result.areas_with_properties ??
    result.with_properties ??
    0
  );

  const withoutProperties = toNumber(
    result.areas_without_properties ??
    result.without_properties ??
    0
  );

  const activePercentage = toNumber(
    result.active_percentage ??
    (total > 0 ? (active / total) * 100 : 0)
  );

  const inactivePercentage = toNumber(
    result.inactive_percentage ??
    (total > 0 ? (inactive / total) * 100 : 0)
  );

  return {
    ...DEFAULT_STATISTICS,
    ...result,

    total,
    active,
    inactive,

    total_areas: total,
    active_areas: active,
    inactive_areas: inactive,

    areas_with_properties: withProperties,
    areas_without_properties: withoutProperties,

    active_percentage: activePercentage,
    inactive_percentage: inactivePercentage,

    by_country: Array.isArray(result.by_country)
      ? result.by_country
      : [],

    by_region: Array.isArray(result.by_region)
      ? result.by_region
      : [],

    by_county: Array.isArray(result.by_county)
      ? result.by_county
      : [],

    by_city: Array.isArray(result.by_city)
      ? result.by_city
      : [],
  };
};

/**
 * Normalize single area response.
 */
const normalizeArea = (response) => {
  const result = getResponseData(response);

  if (!result || typeof result !== "object") {
    return null;
  }

  if (result.area && typeof result.area === "object") {
    return result.area;
  }

  return result;
};

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

const useAreas = ({
  autoFetch = true,
  initialFilters = {},
} = {}) => {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [areas, setAreas] = useState([]);

  const [selectedArea, setSelectedArea] = useState(null);

  const [statistics, setStatistics] = useState(
    { ...DEFAULT_STATISTICS }
  );

  const [pagination, setPagination] = useState(
    { ...DEFAULT_PAGINATION }
  );

  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  }));

  const [loading, setLoading] = useState(false);

  const [statisticsLoading, setStatisticsLoading] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState(null);

  const [statisticsError, setStatisticsError] =
    useState(null);

  const [validationErrors, setValidationErrors] =
    useState({});

  const [lastUpdated, setLastUpdated] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | REQUEST REFERENCES
  |--------------------------------------------------------------------------
  */

  const areasRequestId = useRef(0);

  const statisticsRequestId = useRef(0);

  /*
  |--------------------------------------------------------------------------
  | MEMOIZED FILTERS
  |--------------------------------------------------------------------------
  */

  const activeFilters = useMemo(
    () => ({
      ...filters,

      page: filters.page || 1,

      per_page:
        filters.per_page || DEFAULT_PER_PAGE,
    }),
    [filters]
  );

  /*
  |--------------------------------------------------------------------------
  | ERROR HANDLING
  |--------------------------------------------------------------------------
  */

  const clearErrors = useCallback(() => {
    setError(null);
    setStatisticsError(null);
    setValidationErrors({});
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FETCH AREAS
  |--------------------------------------------------------------------------
  */

  const fetchAreas = useCallback(
    async (params = {}) => {
      const requestId = ++areasRequestId.current;

      setLoading(true);
      setError(null);

      try {
        const requestParams = {
          ...activeFilters,
          ...params,
        };

        const response = await areaService.getAreas(
          requestParams
        );

        const result = normalizeList(response);

        // Ignore outdated requests.
        if (requestId !== areasRequestId.current) {
          return {
            success: true,
            data: result,
            response,
            stale: true,
          };
        }

        setAreas(result);

        setPagination((previous) =>
          normalizePagination(response, {
            ...previous,
            ...requestParams,
            total: result.length,
          })
        );

        setLastUpdated(new Date());

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to retrieve areas."
        );

        if (requestId === areasRequestId.current) {
          setError(message);
        }

        console.error(
          "Fetch areas failed:",
          requestError
        );

        return {
          success: false,
          message,
          errors: getResponseErrors(requestError),
        };
      } finally {
        if (requestId === areasRequestId.current) {
          setLoading(false);
        }
      }
    },
    [activeFilters]
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH AREA STATISTICS
  |--------------------------------------------------------------------------
  */

  const fetchAreaStatistics = useCallback(
    async (params = {}) => {
      const requestId = ++statisticsRequestId.current;

      setStatisticsLoading(true);
      setStatisticsError(null);

      try {
        const response =
          await areaService.getStatistics(params);

        const result = normalizeStatistics(response);

        // Ignore outdated requests.
        if (requestId !== statisticsRequestId.current) {
          return {
            success: true,
            data: result,
            response,
            stale: true,
          };
        }

        setStatistics(result);

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to retrieve area statistics."
        );

        if (requestId === statisticsRequestId.current) {
          setStatisticsError(message);
        }

        console.error(
          "Fetch area statistics failed:",
          requestError
        );

        return {
          success: false,
          message,
        };
      } finally {
        if (requestId === statisticsRequestId.current) {
          setStatisticsLoading(false);
        }
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH AREA REPORTS
  |--------------------------------------------------------------------------
  */

  const fetchAreaReports = useCallback(
    async (params = {}) => {
      try {
        const response =
          await areaService.getReports(params);

        return {
          success: true,
          data: getResponseData(response),
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to generate area reports."
        );

        setError(message);

        return {
          success: false,
          message,
        };
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH ACTIVE AREAS
  |--------------------------------------------------------------------------
  */

  const fetchActiveAreas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await areaService.getActiveAreas();

      const result = normalizeList(response);

      setAreas(result);

      return {
        success: true,
        data: result,
        response,
      };
    } catch (requestError) {
      const message = getResponseMessage(
        requestError,
        "Unable to retrieve active areas."
      );

      setError(message);

      return {
        success: false,
        message,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FETCH INACTIVE AREAS
  |--------------------------------------------------------------------------
  */

  const fetchInactiveAreas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await areaService.getInactiveAreas();

      const result = normalizeList(response);

      setAreas(result);

      return {
        success: true,
        data: result,
        response,
      };
    } catch (requestError) {
      const message = getResponseMessage(
        requestError,
        "Unable to retrieve inactive areas."
      );

      setError(message);

      return {
        success: false,
        message,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FETCH AREAS BY COUNTRY
  |--------------------------------------------------------------------------
  */

  const fetchAreasByCountry = useCallback(
    async (countryId) => {
      if (!countryId) {
        return {
          success: false,
          message: "Country ID is required.",
        };
      }

      setLoading(true);
      setError(null);

      try {
        const response =
          await areaService.getAreasByCountry(countryId);

        const result = normalizeList(response);

        setAreas(result);

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to retrieve areas by country."
        );

        setError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH AREAS BY REGION
  |--------------------------------------------------------------------------
  */

  const fetchAreasByRegion = useCallback(
    async (regionId) => {
      if (!regionId) {
        return {
          success: false,
          message: "Region ID is required.",
        };
      }

      setLoading(true);
      setError(null);

      try {
        const response =
          await areaService.getAreasByRegion(regionId);

        const result = normalizeList(response);

        setAreas(result);

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to retrieve areas by region."
        );

        setError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH AREAS BY COUNTY
  |--------------------------------------------------------------------------
  */

  const fetchAreasByCounty = useCallback(
    async (countyId) => {
      if (!countyId) {
        return {
          success: false,
          message: "County ID is required.",
        };
      }

      setLoading(true);
      setError(null);

      try {
        const response =
          await areaService.getAreasByCounty(countyId);

        const result = normalizeList(response);

        setAreas(result);

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to retrieve areas by county."
        );

        setError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH AREAS BY CITY
  |--------------------------------------------------------------------------
  */

  const fetchAreasByCity = useCallback(
    async (cityId) => {
      if (!cityId) {
        return {
          success: false,
          message: "City ID is required.",
        };
      }

      setLoading(true);
      setError(null);

      try {
        const response =
          await areaService.getAreasByCity(cityId);

        const result = normalizeList(response);

        setAreas(result);

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to retrieve areas by city."
        );

        setError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | SEARCH AREAS
  |--------------------------------------------------------------------------
  */

  const searchAreas = useCallback(
    async (search, params = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response = await areaService.searchAreas({
          ...activeFilters,
          ...params,
          search,
        });

        const result = normalizeList(response);

        setAreas(result);

        setPagination((previous) =>
          normalizePagination(response, previous)
        );

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to search areas."
        );

        setError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setLoading(false);
      }
    },
    [activeFilters]
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH SINGLE AREA
  |--------------------------------------------------------------------------
  */

  const fetchArea = useCallback(async (id) => {
    if (!id) {
      return {
        success: false,
        message: "Area ID is required.",
      };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await areaService.getArea(id);

      const result = normalizeArea(response);

      setSelectedArea(result);

      return {
        success: true,
        data: result,
        response,
      };
    } catch (requestError) {
      const message = getResponseMessage(
        requestError,
        "Unable to retrieve area."
      );

      setError(message);

      return {
        success: false,
        message,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CREATE AREA
  |--------------------------------------------------------------------------
  */

  const createArea = useCallback(
    async (payload) => {
      setSubmitting(true);
      setError(null);
      setValidationErrors({});

      try {
        const response =
          await areaService.createArea(payload);

        const result = normalizeArea(response);

        setSelectedArea(result);

        await Promise.all([
          fetchAreas(),
          fetchAreaStatistics(),
        ]);

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to create area."
        );

        const errors = getResponseErrors(requestError);

        setError(message);
        setValidationErrors(errors || {});

        return {
          success: false,
          message,
          errors,
        };
      } finally {
        setSubmitting(false);
      }
    },
    [fetchAreas, fetchAreaStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE AREA
  |--------------------------------------------------------------------------
  */

  const updateArea = useCallback(
    async (id, payload) => {
      if (!id) {
        return {
          success: false,
          message: "Area ID is required.",
        };
      }

      setSubmitting(true);
      setError(null);
      setValidationErrors({});

      try {
        const response = await areaService.updateArea(
          id,
          payload
        );

        const result = normalizeArea(response);

        setSelectedArea(result);

        setAreas((previous) =>
          previous.map((area) =>
            String(area.id) === String(id)
              ? { ...area, ...result }
              : area
          )
        );

        await fetchAreaStatistics();

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to update area."
        );

        const errors = getResponseErrors(requestError);

        setError(message);
        setValidationErrors(errors || {});

        return {
          success: false,
          message,
          errors,
        };
      } finally {
        setSubmitting(false);
      }
    },
    [fetchAreaStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | PATCH AREA
  |--------------------------------------------------------------------------
  */

  const patchArea = useCallback(
    async (id, payload) => {
      if (!id) {
        return {
          success: false,
          message: "Area ID is required.",
        };
      }

      setSubmitting(true);
      setError(null);

      try {
        const response = await areaService.patchArea(
          id,
          payload
        );

        const result = normalizeArea(response);

        setSelectedArea(result);

        setAreas((previous) =>
          previous.map((area) =>
            String(area.id) === String(id)
              ? { ...area, ...result }
              : area
          )
        );

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to update area."
        );

        setError(message);

        return {
          success: false,
          message,
          errors: getResponseErrors(requestError),
        };
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | DELETE AREA
  |--------------------------------------------------------------------------
  */

  const deleteArea = useCallback(
    async (id) => {
      if (!id) {
        return {
          success: false,
          message: "Area ID is required.",
        };
      }

      setSubmitting(true);
      setError(null);

      try {
        const response =
          await areaService.deleteArea(id);

        setAreas((previous) =>
          previous.filter(
            (area) => String(area.id) !== String(id)
          )
        );

        setSelectedArea((previous) =>
          String(previous?.id) === String(id)
            ? null
            : previous
        );

        await fetchAreaStatistics();

        return {
          success: true,
          data: getResponseData(response),
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to delete area."
        );

        setError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setSubmitting(false);
      }
    },
    [fetchAreaStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE AREA
  |--------------------------------------------------------------------------
  */

  const activateArea = useCallback(
    async (id) => {
      if (!id) {
        return {
          success: false,
          message: "Area ID is required.",
        };
      }

      setSubmitting(true);
      setError(null);

      try {
        const response =
          await areaService.activateArea(id);

        const result = normalizeArea(response);

        setSelectedArea(result);

        setAreas((previous) =>
          previous.map((area) =>
            String(area.id) === String(id)
              ? {
                ...area,
                ...result,
                is_active: true,
              }
              : area
          )
        );

        await fetchAreaStatistics();

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to activate area."
        );

        setError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setSubmitting(false);
      }
    },
    [fetchAreaStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE AREA
  |--------------------------------------------------------------------------
  */

  const deactivateArea = useCallback(
    async (id) => {
      if (!id) {
        return {
          success: false,
          message: "Area ID is required.",
        };
      }

      setSubmitting(true);
      setError(null);

      try {
        const response =
          await areaService.deactivateArea(id);

        const result = normalizeArea(response);

        setSelectedArea(result);

        setAreas((previous) =>
          previous.map((area) =>
            String(area.id) === String(id)
              ? {
                ...area,
                ...result,
                is_active: false,
              }
              : area
          )
        );

        await fetchAreaStatistics();

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to deactivate area."
        );

        setError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setSubmitting(false);
      }
    },
    [fetchAreaStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | TOGGLE AREA STATUS
  |--------------------------------------------------------------------------
  */

  const toggleAreaStatus = useCallback(
    async (id) => {
      if (!id) {
        return {
          success: false,
          message: "Area ID is required.",
        };
      }

      setSubmitting(true);
      setError(null);

      try {
        const response =
          await areaService.toggleAreaStatus(id);

        const result = normalizeArea(response);

        setSelectedArea(result);

        setAreas((previous) =>
          previous.map((area) =>
            String(area.id) === String(id)
              ? { ...area, ...result }
              : area
          )
        );

        await fetchAreaStatistics();

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to update area status."
        );

        setError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setSubmitting(false);
      }
    },
    [fetchAreaStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | CHECK AREA EXISTS
  |--------------------------------------------------------------------------
  */

  const checkAreaExists = useCallback(
    async (params = {}) => {
      try {
        const response =
          await areaService.checkAreaExists(params);

        return {
          success: true,
          data: getResponseData(response),
        };
      } catch (requestError) {
        return {
          success: false,
          message: getResponseMessage(
            requestError,
            "Unable to check area."
          ),
        };
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | CHECK AREA CODE
  |--------------------------------------------------------------------------
  */

  const checkAreaCode = useCallback(
    async (code, ignoreId = null) => {
      try {
        const response =
          await areaService.checkAreaCode(code, {
            ignore_id: ignoreId,
          });

        return {
          success: true,
          data: getResponseData(response),
        };
      } catch (requestError) {
        return {
          success: false,
          message: getResponseMessage(
            requestError,
            "Unable to check area code."
          ),
        };
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | CHECK AREA SLUG
  |--------------------------------------------------------------------------
  */

  const checkAreaSlug = useCallback(
    async (slug, ignoreId = null) => {
      try {
        const response =
          await areaService.checkAreaSlug(slug, {
            ignore_id: ignoreId,
          });

        return {
          success: true,
          data: getResponseData(response),
        };
      } catch (requestError) {
        return {
          success: false,
          message: getResponseMessage(
            requestError,
            "Unable to check area slug."
          ),
        };
      }
    },
    []
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
    setFilters((previous) => ({
      ...DEFAULT_FILTERS,
      per_page: previous.per_page || DEFAULT_PER_PAGE,
      page: 1,
    }));

    setPagination({ ...DEFAULT_PAGINATION });
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CHANGE PAGE
  |--------------------------------------------------------------------------
  */

  const changePage = useCallback((page) => {
    const nextPage = Math.max(
      Number(page) || 1,
      1
    );

    setFilters((previous) => ({
      ...previous,
      page: nextPage,
    }));

    return nextPage;
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CHANGE PER PAGE
  |--------------------------------------------------------------------------
  */

  const changePerPage = useCallback((value) => {
    const perPage = Math.max(
      Number(value) || DEFAULT_PER_PAGE,
      1
    );

    setFilters((previous) => ({
      ...previous,
      per_page: perPage,
      page: 1,
    }));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SORT AREAS
  |--------------------------------------------------------------------------
  */

  const sortAreas = useCallback(
    (sortBy, sortDirection = "asc") => {
      const nextFilters = {
        ...activeFilters,
        sort_by: sortBy,
        sort_direction: sortDirection,
        page: 1,
      };

      setFilters((previous) => ({
        ...previous,
        ...nextFilters,
      }));

      return fetchAreas(nextFilters);
    },
    [activeFilters, fetchAreas]
  );

  /*
  |--------------------------------------------------------------------------
  | REFRESH AREAS
  |--------------------------------------------------------------------------
  */

  const refreshAreas = useCallback(
    (params = {}) => {
      return fetchAreas({
        ...activeFilters,
        ...params,
      });
    },
    [activeFilters, fetchAreas]
  );

  /*
  |--------------------------------------------------------------------------
  | REFRESH ALL
  |--------------------------------------------------------------------------
  */

  const refreshAll = useCallback(
    async (params = {}) => {
      const [listResult, statisticsResult] =
        await Promise.all([
          fetchAreas({
            ...activeFilters,
            ...params,
          }),

          fetchAreaStatistics(params),
        ]);

      return {
        success:
          listResult.success &&
          statisticsResult.success,

        areas: listResult,
        statistics: statisticsResult,
      };
    },
    [
      activeFilters,
      fetchAreas,
      fetchAreaStatistics,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | CLEAR SELECTED AREA
  |--------------------------------------------------------------------------
  */

  const clearArea = useCallback(() => {
    setSelectedArea(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CLEAR AREA LIST
  |--------------------------------------------------------------------------
  */

  const clearAreas = useCallback(() => {
    setAreas([]);
    setPagination({ ...DEFAULT_PAGINATION });
  }, []);

  /*
  |--------------------------------------------------------------------------
  | INITIAL FETCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!autoFetch) {
      return undefined;
    }

    fetchAreas();
    fetchAreaStatistics();

    return undefined;
  }, [
    autoFetch,
    fetchAreas,
    fetchAreaStatistics,
  ]);

  /*
  |--------------------------------------------------------------------------
  | RETURN
  |--------------------------------------------------------------------------
  */

  return {
    // DATA
    areas,
    selectedArea,
    statistics,
    pagination,
    filters: activeFilters,

    // LOADING
    loading,
    statisticsLoading,
    submitting,

    // ERRORS
    error,
    statisticsError,
    validationErrors,

    // METADATA
    lastUpdated,

    // FETCH ACTIONS
    fetchAreas,
    fetchAreaStatistics,
    fetchAreaReports,
    fetchActiveAreas,
    fetchInactiveAreas,
    fetchAreasByCountry,
    fetchAreasByRegion,
    fetchAreasByCounty,
    fetchAreasByCity,
    searchAreas,
    fetchArea,

    // CRUD ACTIONS
    createArea,
    updateArea,
    patchArea,
    deleteArea,

    // STATUS ACTIONS
    activateArea,
    deactivateArea,
    toggleAreaStatus,

    // VALIDATION ACTIONS
    checkAreaExists,
    checkAreaCode,
    checkAreaSlug,

    // FILTER ACTIONS
    updateFilters,
    resetFilters,

    // PAGINATION ACTIONS
    changePage,
    changePerPage,
    sortAreas,

    // REFRESH ACTIONS
    refreshAreas,
    refreshAll,

    // CLEAR ACTIONS
    clearErrors,
    clearArea,
    clearAreas,
  };
};

export default useAreas;
