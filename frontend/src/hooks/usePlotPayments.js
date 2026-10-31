
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import plotPaymentsApi from "../api/plotPayments.api";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  per_page: DEFAULT_PER_PAGE,
  total: 0,
  from: null,
  to: null,
  has_more_pages: false,
};

const DEFAULT_LINKS = {
  first: null,
  last: null,
  prev: null,
  next: null,
};

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

const getErrorMessage = (
  error,
  fallback = "An unexpected error occurred. Please try again.",
) => {
  const responseData = error?.response?.data;

  if (typeof responseData?.message === "string") {
    return responseData.message;
  }

  const validationErrors = responseData?.errors;

  if (typeof validationErrors === "string") {
    return validationErrors;
  }

  if (
    validationErrors &&
    typeof validationErrors === "object"
  ) {
    const firstError = Object.values(validationErrors)
      .flat()
      .find((message) => typeof message === "string");

    if (firstError) return firstError;
  }

  return error?.message || fallback;
};

const getCollection = (response) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
};

const getRecord = (response) => {
  if (!response) return null;

  if (response?.data?.data !== undefined) {
    return response.data.data;
  }

  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
};

const getPagination = (response) => {
  const meta =
    response?.meta ??
    response?.data?.meta ??
    {};

  return {
    ...DEFAULT_PAGINATION,
    ...meta,
  };
};

const getLinks = (response) => ({
  ...DEFAULT_LINKS,
  ...(response?.links ??
    response?.data?.links ??
    {}),
});

const cleanFilters = (filters = {}) =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "",
    ),
  );

/*
|--------------------------------------------------------------------------
| CUSTOM HOOK
|--------------------------------------------------------------------------
*/

const usePlotPayments = ({
  autoFetch = true,
  initialFilters = {},
  perPage = DEFAULT_PER_PAGE,
  initialPage = 1,
} = {}) => {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [payments, setPayments] = useState([]);

  const [selectedPayment, setSelectedPayment] =
    useState(null);

  const [statistics, setStatistics] = useState({});

  const [salePayments, setSalePayments] = useState([]);

  const [statusPayments, setStatusPayments] = useState([]);

  const [pagination, setPagination] = useState({
    ...DEFAULT_PAGINATION,
    current_page: initialPage,
    per_page: perPage,
  });

  const [links, setLinks] = useState(DEFAULT_LINKS);

  const [filters, setFilters] = useState(() =>
    cleanFilters(initialFilters),
  );

  const [search, setSearch] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOADING STATES
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(autoFetch);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [statisticsLoading, setStatisticsLoading] =
    useState(autoFetch);

  const [salePaymentsLoading, setSalePaymentsLoading] =
    useState(false);

  const [statusPaymentsLoading, setStatusPaymentsLoading] =
    useState(false);

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [forceDeleting, setForceDeleting] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | ERROR STATES
  |--------------------------------------------------------------------------
  */

  const [error, setError] = useState(null);
  const [detailsError, setDetailsError] = useState(null);
  const [statisticsError, setStatisticsError] = useState(null);
  const [salePaymentsError, setSalePaymentsError] = useState(null);
  const [statusPaymentsError, setStatusPaymentsError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | REQUEST REFERENCES
  |--------------------------------------------------------------------------
  */

  const mountedRef = useRef(false);

  const listRequestRef = useRef(0);
  const detailsRequestRef = useRef(0);
  const statisticsRequestRef = useRef(0);
  const saleRequestRef = useRef(0);
  const statusRequestRef = useRef(0);

  /*
  |--------------------------------------------------------------------------
  | MOUNT / UNMOUNT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      listRequestRef.current += 1;
      detailsRequestRef.current += 1;
      statisticsRequestRef.current += 1;
      saleRequestRef.current += 1;
      statusRequestRef.current += 1;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | QUERY PARAMETERS
  |--------------------------------------------------------------------------
  */

  const queryParams = useMemo(
    () =>
      cleanFilters({
        ...filters,
        search: search.trim() || undefined,
        page: pagination.current_page,
        per_page: pagination.per_page,
      }),
    [
      filters,
      search,
      pagination.current_page,
      pagination.per_page,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH PAYMENTS
  |--------------------------------------------------------------------------
  |
  | GET /plot-payments
  |
  */

  const getPlotPayments = useCallback(
    async (params = {}) => {
      const requestId = ++listRequestRef.current;

      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      try {
        const requestParams = cleanFilters({
          ...queryParams,
          ...params,
        });

        const response = requestParams.search
          ? await plotPaymentsApi.search(requestParams)
          : await plotPaymentsApi.getAll(requestParams);

        if (
          !mountedRef.current ||
          requestId !== listRequestRef.current
        ) {
          return response;
        }

        setPayments(getCollection(response));
        setPagination(getPagination(response));
        setLinks(getLinks(response));

        return response;
      } catch (err) {
        if (
          mountedRef.current &&
          requestId === listRequestRef.current
        ) {
          setError(
            getErrorMessage(
              err,
              "Failed to fetch plot payments.",
            ),
          );

          setPayments([]);
        }

        throw err;
      } finally {
        if (
          mountedRef.current &&
          requestId === listRequestRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [queryParams],
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH SINGLE PAYMENT
  |--------------------------------------------------------------------------
  |
  | GET /plot-payments/{id}
  |
  */

  const getPlotPaymentById = useCallback(async (id) => {
    const requestId = ++detailsRequestRef.current;

    setDetailsLoading(true);
    setDetailsError(null);

    try {
      const response = await plotPaymentsApi.getById(id);

      if (
        !mountedRef.current ||
        requestId !== detailsRequestRef.current
      ) {
        return response;
      }

      const payment = getRecord(response);

      setSelectedPayment(payment);

      return payment;
    } catch (err) {
      if (
        mountedRef.current &&
        requestId === detailsRequestRef.current
      ) {
        setDetailsError(
          getErrorMessage(
            err,
            "Failed to fetch plot payment details.",
          ),
        );
      }

      throw err;
    } finally {
      if (
        mountedRef.current &&
        requestId === detailsRequestRef.current
      ) {
        setDetailsLoading(false);
      }
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CREATE PAYMENT
  |--------------------------------------------------------------------------
  |
  | POST /plot-payments
  |
  */

  const createPlotPayment = useCallback(
    async (paymentData) => {
      setCreating(true);
      setError(null);

      try {
        const response =
          await plotPaymentsApi.create(paymentData);

        const payment = getRecord(response);

        if (mountedRef.current) {
          setSelectedPayment(payment);
          await getPlotPayments();
        }

        return payment;
      } catch (err) {
        const message = getErrorMessage(
          err,
          "Failed to create plot payment.",
        );

        if (mountedRef.current) {
          setError(message);
        }

        throw err;
      } finally {
        if (mountedRef.current) {
          setCreating(false);
        }
      }
    },
    [getPlotPayments],
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE PAYMENT
  |--------------------------------------------------------------------------
  |
  | PUT /plot-payments/{id}
  |
  */

  const updatePlotPayment = useCallback(
    async (id, paymentData) => {
      setUpdating(true);
      setError(null);

      try {
        const response = await plotPaymentsApi.update(
          id,
          paymentData,
        );

        const payment = getRecord(response);

        if (mountedRef.current) {
          setSelectedPayment(payment);
          await getPlotPayments();
        }

        return payment;
      } catch (err) {
        const message = getErrorMessage(
          err,
          "Failed to update plot payment.",
        );

        if (mountedRef.current) {
          setError(message);
        }

        throw err;
      } finally {
        if (mountedRef.current) {
          setUpdating(false);
        }
      }
    },
    [getPlotPayments],
  );

  /*
  |--------------------------------------------------------------------------
  | DELETE PAYMENT
  |--------------------------------------------------------------------------
  |
  | DELETE /plot-payments/{id}
  |
  */

  const deletePlotPayment = useCallback(
    async (id) => {
      setDeleting(true);
      setError(null);

      try {
        const response = await plotPaymentsApi.delete(id);

        if (mountedRef.current) {
          setPayments((previous) =>
            previous.filter(
              (payment) => Number(payment.id) !== Number(id),
            ),
          );

          setSelectedPayment((previous) =>
            Number(previous?.id) === Number(id)
              ? null
              : previous,
          );

          await getPlotPayments();
        }

        return getRecord(response);
      } catch (err) {
        const message = getErrorMessage(
          err,
          "Failed to delete plot payment.",
        );

        if (mountedRef.current) {
          setError(message);
        }

        throw err;
      } finally {
        if (mountedRef.current) {
          setDeleting(false);
        }
      }
    },
    [getPlotPayments],
  );

  /*
  |--------------------------------------------------------------------------
  | SEARCH PAYMENTS
  |--------------------------------------------------------------------------
  */

  const searchPlotPayments = useCallback(
    async (searchTerm, additionalFilters = {}) => {
      setSearch(searchTerm ?? "");

      setFilters((previous) => ({
        ...previous,
        ...cleanFilters(additionalFilters),
      }));

      setPagination((previous) => ({
        ...previous,
        current_page: 1,
      }));

      setLoading(true);

      return true;
    },
    [],
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE FILTERS
  |--------------------------------------------------------------------------
  */

  const updateFilters = useCallback((newFilters = {}) => {
    setFilters((previous) => ({
      ...previous,
      ...cleanFilters(newFilters),
    }));

    setPagination((previous) => ({
      ...previous,
      current_page: 1,
    }));

    setLoading(true);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  const resetFilters = useCallback(() => {
    setFilters(cleanFilters(initialFilters));
    setSearch("");

    setPagination((previous) => ({
      ...previous,
      current_page: 1,
    }));

    setLoading(true);
  }, [initialFilters]);

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const goToPage = useCallback(
    (page) => {
      const next = Math.max(
        1,
        Math.min(
          Number(page) || 1,
          pagination.last_page || 1,
        ),
      );

      setPagination((previous) => ({
        ...previous,
        current_page: next,
      }));

      setLoading(true);
    },
    [pagination.last_page],
  );

  const nextPage = useCallback(() => {
    if (pagination.current_page < pagination.last_page) {
      goToPage(pagination.current_page + 1);
    }
  }, [pagination.current_page, pagination.last_page, goToPage]);

  const previousPage = useCallback(() => {
    if (pagination.current_page > 1) {
      goToPage(pagination.current_page - 1);
    }
  }, [pagination.current_page, goToPage]);

  const changePerPage = useCallback((value) => {
    setPagination((previous) => ({
      ...previous,
      per_page: Math.min(
        100,
        Math.max(1, Number(value) || DEFAULT_PER_PAGE),
      ),
      current_page: 1,
    }));

    setLoading(true);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | PAYMENT STATISTICS
  |--------------------------------------------------------------------------
  |
  | GET /plot-payments/statistics
  |
  */

  const getPlotPaymentsStatistics = useCallback(
    async (params = {}) => {
      const requestId = ++statisticsRequestRef.current;

      setStatisticsLoading(true);
      setStatisticsError(null);

      try {
        const response =
          await plotPaymentsApi.getStatistics(
            cleanFilters({
              ...filters,
              ...params,
            }),
          );

        if (
          !mountedRef.current ||
          requestId !== statisticsRequestRef.current
        ) {
          return response;
        }

        const result = getRecord(response) ?? {};

        setStatistics(result);

        return result;
      } catch (err) {
        if (
          mountedRef.current &&
          requestId === statisticsRequestRef.current
        ) {
          setStatisticsError(
            getErrorMessage(
              err,
              "Failed to fetch plot payment statistics.",
            ),
          );
        }

        throw err;
      } finally {
        if (
          mountedRef.current &&
          requestId === statisticsRequestRef.current
        ) {
          setStatisticsLoading(false);
        }
      }
    },
    [filters],
  );

  /*
  |--------------------------------------------------------------------------
  | PAYMENTS BY PLOT SALE
  |--------------------------------------------------------------------------
  |
  | GET /plot-payments/sale/{plotSaleId}
  |
  */

  const getPaymentsBySale = useCallback(
    async (plotSaleId, params = {}) => {
      const requestId = ++saleRequestRef.current;

      setSalePaymentsLoading(true);
      setSalePaymentsError(null);

      try {
        const response = await plotPaymentsApi.getBySale(
          plotSaleId,
          params,
        );

        if (
          !mountedRef.current ||
          requestId !== saleRequestRef.current
        ) {
          return response;
        }

        const records = getCollection(response);

        setSalePayments(records);

        return records;
      } catch (err) {
        if (
          mountedRef.current &&
          requestId === saleRequestRef.current
        ) {
          setSalePaymentsError(
            getErrorMessage(
              err,
              "Failed to fetch payments for this plot sale.",
            ),
          );
        }

        throw err;
      } finally {
        if (
          mountedRef.current &&
          requestId === saleRequestRef.current
        ) {
          setSalePaymentsLoading(false);
        }
      }
    },
    [],
  );

  /*
  |--------------------------------------------------------------------------
  | PAYMENTS BY STATUS
  |--------------------------------------------------------------------------
  |
  | GET /plot-payments/status/{status}
  |
  */

  const getPaymentsByStatus = useCallback(
    async (status, params = {}) => {
      const requestId = ++statusRequestRef.current;

      setStatusPaymentsLoading(true);
      setStatusPaymentsError(null);

      try {
        const response = await plotPaymentsApi.getByStatus(
          status,
          params,
        );

        if (
          !mountedRef.current ||
          requestId !== statusRequestRef.current
        ) {
          return response;
        }

        const records = getCollection(response);

        setStatusPayments(records);

        return records;
      } catch (err) {
        if (
          mountedRef.current &&
          requestId === statusRequestRef.current
        ) {
          setStatusPaymentsError(
            getErrorMessage(
              err,
              "Failed to fetch payments by status.",
            ),
          );
        }

        throw err;
      } finally {
        if (
          mountedRef.current &&
          requestId === statusRequestRef.current
        ) {
          setStatusPaymentsLoading(false);
        }
      }
    },
    [],
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE PAYMENT STATUS
  |--------------------------------------------------------------------------
  |
  | PATCH /plot-payments/{id}/status
  |
  */

  const updatePlotPaymentStatus = useCallback(
    async (id, status) => {
      setStatusUpdating(true);
      setError(null);

      try {
        const response =
          await plotPaymentsApi.updateStatus(id, status);

        const payment = getRecord(response);

        if (mountedRef.current) {
          setSelectedPayment((previous) =>
            Number(previous?.id) === Number(id)
              ? payment
              : previous,
          );

          await getPlotPayments();
        }

        return payment;
      } catch (err) {
        const message = getErrorMessage(
          err,
          "Failed to update payment status.",
        );

        if (mountedRef.current) {
          setError(message);
        }

        throw err;
      } finally {
        if (mountedRef.current) {
          setStatusUpdating(false);
        }
      }
    },
    [getPlotPayments],
  );

  /*
  |--------------------------------------------------------------------------
  | RESTORE PAYMENT
  |--------------------------------------------------------------------------
  |
  | POST /plot-payments/{id}/restore
  |
  */

  const restorePlotPayment = useCallback(
    async (id) => {
      setRestoring(true);
      setError(null);

      try {
        const response = await plotPaymentsApi.restore(id);

        if (mountedRef.current) {
          await getPlotPayments();
        }

        return getRecord(response);
      } catch (err) {
        const message = getErrorMessage(
          err,
          "Failed to restore plot payment.",
        );

        if (mountedRef.current) {
          setError(message);
        }

        throw err;
      } finally {
        if (mountedRef.current) {
          setRestoring(false);
        }
      }
    },
    [getPlotPayments],
  );

  /*
  |--------------------------------------------------------------------------
  | PERMANENTLY DELETE PAYMENT
  |--------------------------------------------------------------------------
  |
  | DELETE /plot-payments/{id}/force
  |
  */

  const forceDeletePlotPayment = useCallback(
    async (id) => {
      setForceDeleting(true);
      setError(null);

      try {
        const response =
          await plotPaymentsApi.forceDelete(id);

        if (mountedRef.current) {
          setPayments((previous) =>
            previous.filter(
              (payment) => Number(payment.id) !== Number(id),
            ),
          );

          setSelectedPayment((previous) =>
            Number(previous?.id) === Number(id)
              ? null
              : previous,
          );

          await getPlotPayments();
        }

        return getRecord(response);
      } catch (err) {
        const message = getErrorMessage(
          err,
          "Failed to permanently delete plot payment.",
        );

        if (mountedRef.current) {
          setError(message);
        }

        throw err;
      } finally {
        if (mountedRef.current) {
          setForceDeleting(false);
        }
      }
    },
    [getPlotPayments],
  );

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const refresh = useCallback(async () => {
    return Promise.allSettled([
      getPlotPayments(),
      getPlotPaymentsStatistics(),
    ]);
  }, [
    getPlotPayments,
    getPlotPaymentsStatistics,
  ]);

  /*
  |--------------------------------------------------------------------------
  | INITIAL FETCH AND FILTER/PAGINATION FETCH
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | Do not call getPlotPayments() or getPlotPaymentsStatistics()
  | from these effects because those functions synchronously set
  | loading state before making their API requests.
  |
  | These effects perform the requests first and update state only
  | after the asynchronous requests complete.
  |
  */

  useEffect(() => {
    if (!autoFetch) return undefined;

    let active = true;
    const requestId = ++listRequestRef.current;

    const loadPayments = async () => {
      try {
        const response = queryParams.search
          ? await plotPaymentsApi.search(queryParams)
          : await plotPaymentsApi.getAll(queryParams);

        if (
          !active ||
          !mountedRef.current ||
          requestId !== listRequestRef.current
        ) {
          return;
        }

        setPayments(getCollection(response));
        setPagination(getPagination(response));
        setLinks(getLinks(response));
        setError(null);
      } catch (err) {
        if (
          active &&
          mountedRef.current &&
          requestId === listRequestRef.current
        ) {
          setError(
            getErrorMessage(
              err,
              "Failed to fetch plot payments.",
            ),
          );

          setPayments([]);
        }
      } finally {
        if (
          active &&
          mountedRef.current &&
          requestId === listRequestRef.current
        ) {
          setLoading(false);
        }
      }
    };

    loadPayments();

    return () => {
      active = false;
      listRequestRef.current += 1;
    };
  }, [autoFetch, queryParams]);

  /*
  |--------------------------------------------------------------------------
  | AUTOMATIC STATISTICS FETCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!autoFetch) return undefined;

    let active = true;
    const requestId = ++statisticsRequestRef.current;

    const loadStatistics = async () => {
      try {
        const response =
          await plotPaymentsApi.getStatistics(
            cleanFilters(filters),
          );

        if (
          !active ||
          !mountedRef.current ||
          requestId !== statisticsRequestRef.current
        ) {
          return;
        }

        setStatistics(getRecord(response) ?? {});
        setStatisticsError(null);
      } catch (err) {
        if (
          active &&
          mountedRef.current &&
          requestId === statisticsRequestRef.current
        ) {
          setStatisticsError(
            getErrorMessage(
              err,
              "Failed to fetch plot payment statistics.",
            ),
          );
        }
      } finally {
        if (
          active &&
          mountedRef.current &&
          requestId === statisticsRequestRef.current
        ) {
          setStatisticsLoading(false);
        }
      }
    };

    loadStatistics();

    return () => {
      active = false;
      statisticsRequestRef.current += 1;
    };
  }, [autoFetch, filters]);

  /*
  |--------------------------------------------------------------------------
  | RETURN
  |--------------------------------------------------------------------------
  */

  return {
    // Records
    payments,
    plotPayments: payments,
    selectedPayment,
    statistics,
    salePayments,
    statusPayments,

    // Pagination
    pagination,
    links,
    currentPage: pagination.current_page,
    lastPage: pagination.last_page,
    total: pagination.total,
    perPage: pagination.per_page,
    goToPage,
    nextPage,
    previousPage,
    changePerPage,

    // Filters
    filters,
    search,
    queryParams,
    setSearch,
    setFilters,
    updateFilters,
    searchPlotPayments,
    resetFilters,

    // Loading states
    loading,
    detailsLoading,
    statisticsLoading,
    salePaymentsLoading,
    statusPaymentsLoading,
    creating,
    updating,
    deleting,
    statusUpdating,
    restoring,
    forceDeleting,

    // Errors
    error,
    detailsError,
    statisticsError,
    salePaymentsError,
    statusPaymentsError,

    // List and details
    getPlotPayments,
    getPlotPaymentById,

    // CRUD
    createPlotPayment,
    updatePlotPayment,
    deletePlotPayment,

    // Statistics
    getPlotPaymentsStatistics,

    // Related payments
    getPaymentsBySale,
    getPaymentsByStatus,

    // Status
    updatePlotPaymentStatus,

    // Restore and permanent delete
    restorePlotPayment,
    forceDeletePlotPayment,

    // Refresh
    refresh,

    // Selected payment
    setSelectedPayment,
    clearSelectedPayment: () => setSelectedPayment(null),

    // Clear errors
    clearError: () => setError(null),
    clearDetailsError: () => setDetailsError(null),
    clearStatisticsError: () => setStatisticsError(null),
  };
};

export default usePlotPayments;
