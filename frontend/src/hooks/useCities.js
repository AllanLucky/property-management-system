
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import cityService from "../services/city.service";

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
  trashed: 0,

  total_cities: 0,
  active_cities: 0,
  inactive_cities: 0,

  cities_with_areas: 0,
  cities_without_areas: 0,
  cities_with_properties: 0,
  cities_without_properties: 0,

  active_percentage: 0,
  inactive_percentage: 0,

  by_country: [],
  by_region: [],
  by_county: [],
};

const DEFAULT_FILTERS = {
  search: "",
  name: "",
  slug: "",
  code: "",
  country_id: "",
  region_id: "",
  county_id: "",
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

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.cities)) {
    return result.cities;
  }

  return [];
};

/**
 * Extract pagination metadata.
 */
const getPaginationMeta = (response) => {
  return (
    response?.data?.meta ||
    response?.meta ||
    response?.data?.data?.meta ||
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
 * Normalize city statistics.
 *
 * Supports both short names and Laravel API names.
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
    result.total_cities ??
    result.total ??
    result.cities_count ??
    0
  );

  const active = toNumber(
    result.active_cities ??
    result.active ??
    result.active_count ??
    0
  );

  const inactive = toNumber(
    result.inactive_cities ??
    result.inactive ??
    result.inactive_count ??
    0
  );

  const withAreas = toNumber(
    result.cities_with_areas ??
    result.with_areas ??
    0
  );

  const withoutAreas = toNumber(
    result.cities_without_areas ??
    result.without_areas ??
    0
  );

  const withProperties = toNumber(
    result.cities_with_properties ??
    result.with_properties ??
    0
  );

  const withoutProperties = toNumber(
    result.cities_without_properties ??
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

    total_cities: total,
    active_cities: active,
    inactive_cities: inactive,

    trashed: toNumber(
      result.trashed_cities ??
      result.trashed ??
      0
    ),

    cities_with_areas: withAreas,
    cities_without_areas: withoutAreas,

    cities_with_properties: withProperties,
    cities_without_properties: withoutProperties,

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
  };
};

/**
 * Normalize single city response.
 */
const normalizeCity = (response) => {
  const result = getResponseData(response);

  if (!result || typeof result !== "object") {
    return null;
  }

  if (result.city && typeof result.city === "object") {
    return result.city;
  }

  return result;
};

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

const useCities = ({
  autoFetch = true,
  initialFilters = {},
} = {}) => {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [cities, setCities] = useState([]);

  const [selectedCity, setSelectedCity] = useState(null);

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

  const citiesRequestId = useRef(0);

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
  | FETCH CITIES
  |--------------------------------------------------------------------------
  */

  const fetchCities = useCallback(
    async (params = {}) => {
      const requestId = ++citiesRequestId.current;

      setLoading(true);
      setError(null);

      try {
        const requestParams = {
          ...activeFilters,
          ...params,
        };

        const response = await cityService.getCities(
          requestParams
        );

        const result = normalizeList(response);

        // Ignore outdated requests.
        if (requestId !== citiesRequestId.current) {
          return {
            success: true,
            data: result,
            response,
            stale: true,
          };
        }

        setCities(result);

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
          "Unable to retrieve cities."
        );

        if (requestId === citiesRequestId.current) {
          setError(message);
        }

        console.error(
          "Fetch cities failed:",
          requestError
        );

        return {
          success: false,
          message,
          errors: getResponseErrors(requestError),
        };
      } finally {
        if (requestId === citiesRequestId.current) {
          setLoading(false);
        }
      }
    },
    [activeFilters]
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH CITY STATISTICS
  |--------------------------------------------------------------------------
  */

  const fetchCityStatistics = useCallback(
    async (params = {}) => {
      const requestId = ++statisticsRequestId.current;

      setStatisticsLoading(true);
      setStatisticsError(null);

      try {
        const response =
          await cityService.getCityStatistics(params);

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
          "Unable to retrieve city statistics."
        );

        if (requestId === statisticsRequestId.current) {
          setStatisticsError(message);
        }

        console.error(
          "Fetch city statistics failed:",
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
  | FETCH CITY REPORTS
  |--------------------------------------------------------------------------
  */

  const fetchCityReports = useCallback(
    async (params = {}) => {
      try {
        const response =
          await cityService.getCityReports(params);

        return {
          success: true,
          data: getResponseData(response),
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to generate city reports."
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
  | FETCH ACTIVE CITIES
  |--------------------------------------------------------------------------
  */

  const fetchActiveCities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await cityService.getActiveCities();

      const result = normalizeList(response);

      setCities(result);

      return {
        success: true,
        data: result,
        response,
      };
    } catch (requestError) {
      const message = getResponseMessage(
        requestError,
        "Unable to retrieve active cities."
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
  | FETCH INACTIVE CITIES
  |--------------------------------------------------------------------------
  */

  const fetchInactiveCities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await cityService.getInactiveCities();

      const result = normalizeList(response);

      setCities(result);

      return {
        success: true,
        data: result,
        response,
      };
    } catch (requestError) {
      const message = getResponseMessage(
        requestError,
        "Unable to retrieve inactive cities."
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
  | FETCH CITIES BY COUNTRY
  |--------------------------------------------------------------------------
  */

  const fetchCitiesByCountry = useCallback(
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
          await cityService.getCitiesByCountry(countryId);

        const result = normalizeList(response);

        setCities(result);

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to retrieve cities by country."
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
  | FETCH CITIES BY REGION
  |--------------------------------------------------------------------------
  */

  const fetchCitiesByRegion = useCallback(
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
          await cityService.getCitiesByRegion(regionId);

        const result = normalizeList(response);

        setCities(result);

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to retrieve cities by region."
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
  | FETCH CITIES BY COUNTY
  |--------------------------------------------------------------------------
  */

  const fetchCitiesByCounty = useCallback(
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
          await cityService.getCitiesByCounty(countyId);

        const result = normalizeList(response);

        setCities(result);

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to retrieve cities by county."
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
  | SEARCH CITIES
  |--------------------------------------------------------------------------
  */

  const searchCities = useCallback(
    async (search, params = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response = await cityService.searchCities({
          ...activeFilters,
          ...params,
          search,
        });

        const result = normalizeList(response);

        setCities(result);

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
          "Unable to search cities."
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
  | FETCH SINGLE CITY
  |--------------------------------------------------------------------------
  */

  const fetchCity = useCallback(async (id) => {
    if (!id) {
      return {
        success: false,
        message: "City ID is required.",
      };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await cityService.getCity(id);

      const result = normalizeCity(response);

      setSelectedCity(result);

      return {
        success: true,
        data: result,
        response,
      };
    } catch (requestError) {
      const message = getResponseMessage(
        requestError,
        "Unable to retrieve city."
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
  | CREATE CITY
  |--------------------------------------------------------------------------
  */

  const createCity = useCallback(
    async (payload) => {
      setSubmitting(true);
      setError(null);
      setValidationErrors({});

      try {
        const response =
          await cityService.createCity(payload);

        const result = normalizeCity(response);

        setSelectedCity(result);

        await fetchCityStatistics();

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to create city."
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
    [fetchCityStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE CITY
  |--------------------------------------------------------------------------
  */

  const updateCity = useCallback(
    async (id, payload) => {
      if (!id) {
        return {
          success: false,
          message: "City ID is required.",
        };
      }

      setSubmitting(true);
      setError(null);
      setValidationErrors({});

      try {
        const response = await cityService.updateCity(
          id,
          payload
        );

        const result = normalizeCity(response);

        setSelectedCity(result);

        setCities((previous) =>
          previous.map((city) =>
            String(city.id) === String(id)
              ? { ...city, ...result }
              : city
          )
        );

        await fetchCityStatistics();

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to update city."
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
    [fetchCityStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | PATCH CITY
  |--------------------------------------------------------------------------
  */

  const patchCity = useCallback(
    async (id, payload) => {
      if (!id) {
        return {
          success: false,
          message: "City ID is required.",
        };
      }

      setSubmitting(true);
      setError(null);

      try {
        const response = await cityService.patchCity(
          id,
          payload
        );

        const result = normalizeCity(response);

        setSelectedCity(result);

        setCities((previous) =>
          previous.map((city) =>
            String(city.id) === String(id)
              ? { ...city, ...result }
              : city
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
          "Unable to update city."
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
  | DELETE CITY (SOFT DELETE)
  |--------------------------------------------------------------------------
  */

  const deleteCity = useCallback(
    async (id) => {
      if (!id) {
        return {
          success: false,
          message: "City ID is required.",
        };
      }

      setSubmitting(true);
      setError(null);

      try {
        const response =
          await cityService.deleteCity(id);

        setCities((previous) =>
          previous.filter(
            (city) => String(city.id) !== String(id)
          )
        );

        setSelectedCity((previous) =>
          String(previous?.id) === String(id)
            ? null
            : previous
        );

        await fetchCityStatistics();

        return {
          success: true,
          data: getResponseData(response),
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to delete city."
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
    [fetchCityStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH TRASHED CITIES
  |--------------------------------------------------------------------------
  */

  const fetchTrashedCities = useCallback(
    async (params = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await cityService.getTrashedCities({
            ...activeFilters,
            ...params,
          });

        const result = normalizeList(response);

        setCities(result);

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
          "Unable to retrieve deleted cities."
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
  | FETCH TRASHED CITY
  |--------------------------------------------------------------------------
  */

  const fetchTrashedCity = useCallback(async (id) => {
    if (!id) {
      return {
        success: false,
        message: "City ID is required.",
      };
    }

    setLoading(true);
    setError(null);

    try {
      const response =
        await cityService.getTrashedCity(id);

      const result = normalizeCity(response);

      setSelectedCity(result);

      return {
        success: true,
        data: result,
        response,
      };
    } catch (requestError) {
      const message = getResponseMessage(
        requestError,
        "Unable to retrieve deleted city."
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
  | RESTORE CITY
  |--------------------------------------------------------------------------
  */

  const restoreCity = useCallback(
    async (id) => {
      if (!id) {
        return {
          success: false,
          message: "City ID is required.",
        };
      }

      setSubmitting(true);
      setError(null);

      try {
        const response =
          await cityService.restoreCity(id);

        const result = normalizeCity(response);

        setSelectedCity(result);

        await Promise.all([
          fetchCities(),
          fetchCityStatistics(),
        ]);

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to restore city."
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
    [fetchCities, fetchCityStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | FORCE DELETE CITY
  |--------------------------------------------------------------------------
  */

  const forceDeleteCity = useCallback(
    async (id) => {
      if (!id) {
        return {
          success: false,
          message: "City ID is required.",
        };
      }

      setSubmitting(true);
      setError(null);

      try {
        const response =
          await cityService.forceDeleteCity(id);

        setCities((previous) =>
          previous.filter(
            (city) => String(city.id) !== String(id)
          )
        );

        setSelectedCity((previous) =>
          String(previous?.id) === String(id)
            ? null
            : previous
        );

        await fetchCityStatistics();

        return {
          success: true,
          data: getResponseData(response),
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to permanently delete city."
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
    [fetchCityStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE CITY
  |--------------------------------------------------------------------------
  */

  const activateCity = useCallback(
    async (id) => {
      if (!id) {
        return {
          success: false,
          message: "City ID is required.",
        };
      }

      setSubmitting(true);
      setError(null);

      try {
        const response =
          await cityService.activateCity(id);

        const result = normalizeCity(response);

        setSelectedCity(result);

        setCities((previous) =>
          previous.map((city) =>
            String(city.id) === String(id)
              ? { ...city, ...result }
              : city
          )
        );

        await fetchCityStatistics();

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to activate city."
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
    [fetchCityStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE CITY
  |--------------------------------------------------------------------------
  */

  const deactivateCity = useCallback(
    async (id) => {
      if (!id) {
        return {
          success: false,
          message: "City ID is required.",
        };
      }

      setSubmitting(true);
      setError(null);

      try {
        const response =
          await cityService.deactivateCity(id);

        const result = normalizeCity(response);

        setSelectedCity(result);

        setCities((previous) =>
          previous.map((city) =>
            String(city.id) === String(id)
              ? { ...city, ...result }
              : city
          )
        );

        await fetchCityStatistics();

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to deactivate city."
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
    [fetchCityStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | TOGGLE CITY STATUS
  |--------------------------------------------------------------------------
  */

  const toggleCityStatus = useCallback(
    async (id) => {
      if (!id) {
        return {
          success: false,
          message: "City ID is required.",
        };
      }

      setSubmitting(true);
      setError(null);

      try {
        const response =
          await cityService.toggleCityStatus(id);

        const result = normalizeCity(response);

        setSelectedCity(result);

        setCities((previous) =>
          previous.map((city) =>
            String(city.id) === String(id)
              ? { ...city, ...result }
              : city
          )
        );

        await fetchCityStatistics();

        return {
          success: true,
          data: result,
          response,
        };
      } catch (requestError) {
        const message = getResponseMessage(
          requestError,
          "Unable to update city status."
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
    [fetchCityStatistics]
  );

  /*
  |--------------------------------------------------------------------------
  | CHECK CITY EXISTS
  |--------------------------------------------------------------------------
  */

  const checkCityExists = useCallback(async (id) => {
    try {
      const response =
        await cityService.checkCityExists(id);

      return {
        success: true,
        data: getResponseData(response),
      };
    } catch (requestError) {
      return {
        success: false,
        message: getResponseMessage(
          requestError,
          "Unable to check city."
        ),
      };
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CHECK CITY CODE
  |--------------------------------------------------------------------------
  */

  const checkCityCode = useCallback(
    async (code, ignoreId = null) => {
      try {
        const response =
          await cityService.checkCityCode({
            code,
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
            "Unable to check city code."
          ),
        };
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | CHECK CITY SLUG
  |--------------------------------------------------------------------------
  */

  const checkCitySlug = useCallback(
    async (slug, ignoreId = null) => {
      try {
        const response =
          await cityService.checkCitySlug({
            slug,
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
            "Unable to check city slug."
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
  | SORT CITIES
  |--------------------------------------------------------------------------
  */

  const sortCities = useCallback(
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

      return fetchCities(nextFilters);
    },
    [activeFilters, fetchCities]
  );

  /*
  |--------------------------------------------------------------------------
  | REFRESH CITIES
  |--------------------------------------------------------------------------
  */

  const refreshCities = useCallback(
    (params = {}) => {
      return fetchCities({
        ...activeFilters,
        ...params,
      });
    },
    [activeFilters, fetchCities]
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
          fetchCities({
            ...activeFilters,
            ...params,
          }),

          fetchCityStatistics(params),
        ]);

      return {
        success:
          listResult.success &&
          statisticsResult.success,

        cities: listResult,
        statistics: statisticsResult,
      };
    },
    [
      activeFilters,
      fetchCities,
      fetchCityStatistics,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | CLEAR SELECTED CITY
  |--------------------------------------------------------------------------
  */

  const clearCity = useCallback(() => {
    setSelectedCity(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CLEAR CITY LIST
  |--------------------------------------------------------------------------
  */

  const clearCities = useCallback(() => {
    setCities([]);
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

    fetchCities();
    fetchCityStatistics();

    return undefined;
  }, [
    autoFetch,
    fetchCities,
    fetchCityStatistics,
  ]);

  /*
  |--------------------------------------------------------------------------
  | RETURN
  |--------------------------------------------------------------------------
  */

  return {
    // DATA
    cities,
    selectedCity,
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
    fetchCities,
    fetchCityStatistics,
    fetchCityReports,
    fetchActiveCities,
    fetchInactiveCities,
    fetchCitiesByCountry,
    fetchCitiesByRegion,
    fetchCitiesByCounty,
    searchCities,
    fetchCity,
    fetchTrashedCities,
    fetchTrashedCity,

    // CRUD ACTIONS
    createCity,
    updateCity,
    patchCity,
    deleteCity,

    // STATUS ACTIONS
    activateCity,
    deactivateCity,
    toggleCityStatus,

    // TRASH ACTIONS
    restoreCity,
    forceDeleteCity,

    // VALIDATION ACTIONS
    checkCityExists,
    checkCityCode,
    checkCitySlug,

    // FILTER ACTIONS
    updateFilters,
    resetFilters,

    // PAGINATION ACTIONS
    changePage,
    changePerPage,
    sortCities,

    // REFRESH ACTIONS
    refreshCities,
    refreshAll,

    // CLEAR ACTIONS
    clearErrors,
    clearCity,
    clearCities,
  };
};

export default useCities;
