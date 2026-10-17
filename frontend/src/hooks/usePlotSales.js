import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import plotSalesApi from "../api/plotSales.api";

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

const DEFAULT_FILTERS = {
  search: "",
  plot_id: "",
  buyer_id: "",
  agent_id: "",
  status: "",
  payment_status: "",
  sale_type: "",
  currency: "",
  date_from: "",
  date_to: "",
  min_amount: "",
  max_amount: "",
  outstanding_only: "",
};

const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  per_page: DEFAULT_PER_PAGE,
  total: 0,
  from: null,
  to: null,
};

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Extract a useful error message from Axios/API errors.
 */
const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again.",
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.message?.[0] ||
    error?.message ||
    fallback
  );
};

/**
 * Extract the API payload.
 *
 * Supports responses such as:
 *
 * { data: [...] }
 *
 * { data: { data: [...] } }
 *
 * { data: { data: { data: [...] }, meta: {...} } }
 */
const getPayload = (response) => {
  return response?.data ?? response;
};

/**
 * Extract the list of records from a normalized API response.
 */
const getRows = (response) => {
  const payload = getPayload(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  if (Array.isArray(payload?.data?.data?.data)) {
    return payload.data.data.data;
  }

  return [];
};

/**
 * Extract pagination information without assuming one response format.
 */
const getPagination = (
  response,
  fallbackPage = 1,
  fallbackPerPage = DEFAULT_PER_PAGE,
) => {
  const payload = getPayload(response);

  const candidates = [
    payload?.meta,
    payload?.data?.meta,
    payload?.data?.data?.meta,
    payload?.data?.data?.data?.meta,
    payload?.data,
    payload?.data?.data,
  ];

  const metadata = candidates.find(
    (candidate) =>
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate) &&
      (
        candidate.current_page !== undefined ||
        candidate.last_page !== undefined ||
        candidate.total !== undefined ||
        candidate.per_page !== undefined
      ),
  );

  return {
    current_page:
      Number(metadata?.current_page) || fallbackPage,

    last_page:
      Number(metadata?.last_page) || 1,

    per_page:
      Number(metadata?.per_page) || fallbackPerPage,

    total:
      Number(metadata?.total) || 0,

    from:
      metadata?.from ?? null,

    to:
      metadata?.to ?? null,
  };
};

/**
 * Extract a single record from the normalized API response.
 */
const getRecord = (response) => {
  const payload = getPayload(response);

  if (
    payload?.data &&
    !Array.isArray(payload.data) &&
    typeof payload.data === "object"
  ) {
    if (
      payload.data.data &&
      !Array.isArray(payload.data.data) &&
      typeof payload.data.data === "object"
    ) {
      return payload.data.data;
    }

    return payload.data;
  }

  return payload ?? null;
};

/**
 * Normalize filter values.
 */
const normalizeFilters = (filters = {}) => {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null,
    ),
  );
};

/*
|--------------------------------------------------------------------------
| CUSTOM HOOK
|--------------------------------------------------------------------------
*/

/**
 * Manage Plot Sales API operations and UI state.
 *
 * @param {Object} options
 * @param {boolean} options.autoFetch Automatically fetch sales on mount.
 * @param {Object} options.initialFilters Initial filter values.
 * @param {number} options.initialPerPage Initial page size.
 *
 * @returns {Object} Plot Sales state and actions.
 */
export const usePlotSales = ({
  autoFetch = true,
  initialFilters = {},
  initialPerPage = DEFAULT_PER_PAGE,
} = {}) => {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [sales, setSales] = useState([]);

  const [selectedSale, setSelectedSale] = useState(null);

  const [outstandingSales, setOutstandingSales] = useState([]);

  const [statistics, setStatistics] = useState(null);

  const [report, setReport] = useState([]);

  const [filters, setFiltersState] = useState(() => ({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  }));

  const [pagination, setPagination] = useState(() => ({
    ...DEFAULT_PAGINATION,
    per_page: initialPerPage,
  }));

  const [page, setPageState] = useState(1);

  const [perPage, setPerPageState] = useState(initialPerPage);

  const [loading, setLoading] = useState(false);

  const [detailsLoading, setDetailsLoading] = useState(false);

  const [statisticsLoading, setStatisticsLoading] = useState(false);

  const [reportLoading, setReportLoading] = useState(false);

  const [outstandingLoading, setOutstandingLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState(null);

  const [detailsError, setDetailsError] = useState(null);

  const [statisticsError, setStatisticsError] = useState(null);

  const [reportError, setReportError] = useState(null);

  const [outstandingError, setOutstandingError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | REQUEST TRACKING
  |--------------------------------------------------------------------------
  |
  | Prevent older list requests from overwriting newer results when users
  | search, paginate, or rapidly change filters.
  */

  const listRequestId = useRef(0);

  const mountedRef = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | FILTERS
  |--------------------------------------------------------------------------
  */

  /**
   * Replace or merge filter values.
   *
   * Passing a filter value of "" clears that filter.
   */
  const setFilters = useCallback((nextFilters = {}) => {
    setFiltersState((previous) => ({
      ...previous,
      ...nextFilters,
    }));

    setPageState(1);
  }, []);

  /**
   * Clear all filters.
   */
  const clearFilters = useCallback(() => {
    setFiltersState({
      ...DEFAULT_FILTERS,
    });

    setPageState(1);
  }, []);

  /**
   * Update the search field.
   */
  const setSearch = useCallback((search) => {
    setFiltersState((previous) => ({
      ...previous,
      search: search ?? "",
    }));

    setPageState(1);
  }, []);

  /**
   * Update the selected status.
   */
  const setStatus = useCallback((status) => {
    setFiltersState((previous) => ({
      ...previous,
      status: status ?? "",
    }));

    setPageState(1);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FETCH PLOT SALES
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch paginated plot sales.
   *
   * @param {Object} overrides Optional filters and pagination overrides.
   */
  const fetchPlotSales = useCallback(
    async (overrides = {}) => {
      const requestId = ++listRequestId.current;

      const requestFilters = normalizeFilters({
        ...filters,
        ...overrides,
        page: overrides.page ?? page,
        per_page: overrides.per_page ?? perPage,
      });

      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await plotSalesApi.getPlotSales(
          requestFilters,
        );

        /*
         * Ignore stale requests.
         */
        if (
          !mountedRef.current ||
          requestId !== listRequestId.current
        ) {
          return response;
        }

        const records = getRows(response);

        const paginationData = getPagination(
          response,
          Number(requestFilters.page) || 1,
          Number(requestFilters.per_page) || DEFAULT_PER_PAGE,
        );

        setSales(records);

        setPagination(paginationData);

        return response;
      } catch (requestError) {
        if (
          mountedRef.current &&
          requestId === listRequestId.current
        ) {
          setError(
            getErrorMessage(
              requestError,
              "Failed to fetch plot sales.",
            ),
          );
        }

        throw requestError;
      } finally {
        if (
          mountedRef.current &&
          requestId === listRequestId.current
        ) {
          setLoading(false);
        }
      }
    },
    [filters, page, perPage],
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH SALE DETAILS
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch a specific plot sale by ID.
   */
  const fetchPlotSaleById = useCallback(async (id) => {
    setDetailsLoading(true);
    setDetailsError(null);

    try {
      const response = await plotSalesApi.getPlotSaleById(id);

      const record = getRecord(response);

      setSelectedSale(record);

      return record;
    } catch (requestError) {
      const message = getErrorMessage(
        requestError,
        "Failed to fetch plot sale details.",
      );

      setDetailsError(message);

      throw requestError;
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  /**
   * Clear the currently selected sale.
   */
  const clearSelectedSale = useCallback(() => {
    setSelectedSale(null);
    setDetailsError(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FETCH BY STATUS
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch sales using the dedicated status endpoint.
   */
  const fetchPlotSalesByStatus = useCallback(
    async (status, params = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await plotSalesApi.getPlotSalesByStatus(
            status,
            {
              per_page: params.per_page ?? perPage,
              page: params.page ?? page,
            },
          );

        setSales(getRows(response));

        setPagination(
          getPagination(
            response,
            params.page ?? page,
            params.per_page ?? perPage,
          ),
        );

        return response;
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Failed to fetch plot sales by status.",
          ),
        );

        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    [page, perPage],
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH BY PLOT
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch sales associated with a particular plot.
   */
  const fetchPlotSalesByPlot = useCallback(
    async (plotId, params = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await plotSalesApi.getPlotSalesByPlot(
            plotId,
            {
              per_page: params.per_page ?? perPage,
              page: params.page ?? page,
            },
          );

        setSales(getRows(response));

        setPagination(
          getPagination(
            response,
            params.page ?? page,
            params.per_page ?? perPage,
          ),
        );

        return response;
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Failed to fetch sales for this plot.",
          ),
        );

        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    [page, perPage],
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH BY BUYER
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch sales associated with a particular buyer.
   */
  const fetchPlotSalesByBuyer = useCallback(
    async (buyerId, params = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await plotSalesApi.getPlotSalesByBuyer(
            buyerId,
            {
              per_page: params.per_page ?? perPage,
              page: params.page ?? page,
            },
          );

        setSales(getRows(response));

        setPagination(
          getPagination(
            response,
            params.page ?? page,
            params.per_page ?? perPage,
          ),
        );

        return response;
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Failed to fetch sales for this buyer.",
          ),
        );

        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    [page, perPage],
  );

  /*
  |--------------------------------------------------------------------------
  | CREATE SALE
  |--------------------------------------------------------------------------
  */

  /**
   * Create a plot sale and refresh the list.
   */
  const createPlotSale = useCallback(
    async (saleData) => {
      setActionLoading(true);
      setError(null);

      try {
        const response =
          await plotSalesApi.createPlotSale(saleData);

        const createdSale = getRecord(response);

        setSelectedSale(createdSale);

        /*
         * Refresh using the current filters.
         */
        await fetchPlotSales({
          page: 1,
        });

        setPageState(1);

        return createdSale;
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Failed to create plot sale.",
          ),
        );

        throw requestError;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchPlotSales],
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE SALE
  |--------------------------------------------------------------------------
  */

  /**
   * Update an existing plot sale and refresh its data.
   */
  const updatePlotSale = useCallback(
    async (id, saleData) => {
      setActionLoading(true);
      setError(null);

      try {
        const response =
          await plotSalesApi.updatePlotSale(
            id,
            saleData,
          );

        const updatedSale = getRecord(response);

        if (
          String(selectedSale?.id) === String(id)
        ) {
          setSelectedSale(updatedSale);
        }

        await fetchPlotSales();

        return updatedSale;
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Failed to update plot sale.",
          ),
        );

        throw requestError;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchPlotSales, selectedSale],
  );

  /*
  |--------------------------------------------------------------------------
  | DELETE SALE
  |--------------------------------------------------------------------------
  */

  /**
   * Soft-delete a plot sale.
   */
  const deletePlotSale = useCallback(
    async (id) => {
      setActionLoading(true);
      setError(null);

      try {
        const response =
          await plotSalesApi.deletePlotSale(id);

        setSales((previous) =>
          previous.filter(
            (sale) => String(sale.id) !== String(id),
          ),
        );

        setPagination((previous) => ({
          ...previous,
          total: Math.max(0, previous.total - 1),
        }));

        if (
          String(selectedSale?.id) === String(id)
        ) {
          setSelectedSale(null);
        }

        await fetchPlotSales();

        return response;
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Failed to delete plot sale.",
          ),
        );

        throw requestError;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchPlotSales, selectedSale],
  );

  /*
  |--------------------------------------------------------------------------
  | APPROVE SALE
  |--------------------------------------------------------------------------
  */

  /**
   * Approve a plot sale.
   */
  const approvePlotSale = useCallback(
    async (id) => {
      setActionLoading(true);
      setError(null);

      try {
        const response =
          await plotSalesApi.approvePlotSale(id);

        const updatedSale = getRecord(response);

        if (
          String(selectedSale?.id) === String(id)
        ) {
          setSelectedSale(updatedSale);
        }

        await fetchPlotSales();

        return updatedSale;
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Failed to approve plot sale.",
          ),
        );

        throw requestError;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchPlotSales, selectedSale],
  );

  /*
  |--------------------------------------------------------------------------
  | CANCEL SALE
  |--------------------------------------------------------------------------
  */

  /**
   * Cancel a plot sale.
   */
  const cancelPlotSale = useCallback(
    async (id, reason = null) => {
      setActionLoading(true);
      setError(null);

      try {
        const response =
          await plotSalesApi.cancelPlotSale(
            id,
            reason,
          );

        const cancelledSale = getRecord(response);

        if (
          String(selectedSale?.id) === String(id)
        ) {
          setSelectedSale(cancelledSale);
        }

        await fetchPlotSales();

        return cancelledSale;
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Failed to cancel plot sale.",
          ),
        );

        throw requestError;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchPlotSales, selectedSale],
  );

  /*
  |--------------------------------------------------------------------------
  | COMPLETE SALE
  |--------------------------------------------------------------------------
  */

  /**
   * Mark a plot sale as completed.
   */
  const completePlotSale = useCallback(
    async (id) => {
      setActionLoading(true);
      setError(null);

      try {
        const response =
          await plotSalesApi.completePlotSale(id);

        const completedSale = getRecord(response);

        if (
          String(selectedSale?.id) === String(id)
        ) {
          setSelectedSale(completedSale);
        }

        await fetchPlotSales();

        return completedSale;
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "Failed to complete plot sale.",
          ),
        );

        throw requestError;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchPlotSales, selectedSale],
  );

  /*
  |--------------------------------------------------------------------------
  | OUTSTANDING SALES
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch sales with outstanding balances.
   */
  const fetchOutstandingPlotSales = useCallback(
    async (params = {}) => {
      setOutstandingLoading(true);
      setOutstandingError(null);

      try {
        const response =
          await plotSalesApi.getOutstandingPlotSales({
            per_page: params.per_page ?? perPage,
            page: params.page ?? 1,
          });

        setOutstandingSales(getRows(response));

        return response;
      } catch (requestError) {
        setOutstandingError(
          getErrorMessage(
            requestError,
            "Failed to fetch outstanding plot sales.",
          ),
        );

        throw requestError;
      } finally {
        setOutstandingLoading(false);
      }
    },
    [perPage],
  );

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch plot sale statistics.
   */
  const fetchPlotSalesStatistics = useCallback(
    async (customFilters = {}) => {
      setStatisticsLoading(true);
      setStatisticsError(null);

      try {
        const response =
          await plotSalesApi.getPlotSalesStatistics({
            ...filters,
            ...customFilters,
          });

        setStatistics(getRecord(response));

        return response;
      } catch (requestError) {
        setStatisticsError(
          getErrorMessage(
            requestError,
            "Failed to fetch plot sales statistics.",
          ),
        );

        throw requestError;
      } finally {
        setStatisticsLoading(false);
      }
    },
    [filters],
  );

  /*
  |--------------------------------------------------------------------------
  | REPORTS
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch report data using the supplied filters.
   */
  const fetchPlotSalesReport = useCallback(
    async (customFilters = {}) => {
      setReportLoading(true);
      setReportError(null);

      try {
        const response =
          await plotSalesApi.getPlotSalesReport({
            ...filters,
            ...customFilters,
          });

        setReport(getRows(response));

        return response;
      } catch (requestError) {
        setReportError(
          getErrorMessage(
            requestError,
            "Failed to generate plot sales report.",
          ),
        );

        throw requestError;
      } finally {
        setReportLoading(false);
      }
    },
    [filters],
  );

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  /**
   * Change the current page.
   */
  const setPage = useCallback((nextPage) => {
    setPageState((previous) => {
      const value =
        typeof nextPage === "function"
          ? nextPage(previous)
          : nextPage;

      return Math.max(1, Number(value) || 1);
    });
  }, []);

  /**
   * Change the page size.
   */
  const setPerPage = useCallback((nextPerPage) => {
    const normalized = Math.max(
      1,
      Math.min(100, Number(nextPerPage) || DEFAULT_PER_PAGE),
    );

    setPerPageState(normalized);

    setPagination((previous) => ({
      ...previous,
      per_page: normalized,
    }));

    setPageState(1);
  }, []);

  /**
   * Navigate to the next page.
   */
  const nextPage = useCallback(() => {
    setPageState((previous) =>
      Math.min(
        pagination.last_page,
        previous + 1,
      ),
    );
  }, [pagination.last_page]);

  /**
   * Navigate to the previous page.
   */
  const previousPage = useCallback(() => {
    setPageState((previous) =>
      Math.max(1, previous - 1),
    );
  }, []);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  /**
   * Refresh the current list.
   */
  const refresh = useCallback(
    () => fetchPlotSales(),
    [fetchPlotSales],
  );

  /*
  |--------------------------------------------------------------------------
  | AUTOMATIC FETCHING
  |--------------------------------------------------------------------------
  */

  /**
   * Track component lifecycle.
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      /*
       * Invalidate pending list requests.
       */
      listRequestId.current += 1;
    };
  }, []);

  /**
   * Automatically load plot sales when filters or pagination change.
   *
   * The mounted check also avoids running the request before the lifecycle
   * effect has initialized the hook.
   */
  useEffect(() => {
    if (!autoFetch || !mountedRef.current) {
      return;
    }

    fetchPlotSales().catch(() => {
      /*
       * Errors are stored in hook state and can be displayed by the page.
       */
    });
  }, [
    autoFetch,
    fetchPlotSales,
  ]);

  /*
  |--------------------------------------------------------------------------
  | DERIVED VALUES
  |--------------------------------------------------------------------------
  */

  /**
   * Useful pagination flags for table components.
   */
  const paginationState = useMemo(
    () => ({
      ...pagination,
      current_page: page,
      per_page: perPage,
      has_previous_page: page > 1,
      has_next_page: page < pagination.last_page,
    }),
    [pagination, page, perPage],
  );

  /**
   * Expose a convenient summary for UI components.
   */
  const summary = useMemo(
    () => ({
      total: pagination.total,
      current_page: page,
      last_page: pagination.last_page,
      per_page: perPage,
      showing: sales.length,
      has_sales: sales.length > 0,
      is_empty: !loading && sales.length === 0,
    }),
    [
      pagination.total,
      pagination.last_page,
      page,
      perPage,
      sales.length,
      loading,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | RETURN
  |--------------------------------------------------------------------------
  */

  return {
    /*
    |--------------------------------------------------------------------------
    | Data
    |--------------------------------------------------------------------------
    */

    sales,
    plotSales: sales,
    selectedSale,
    outstandingSales,
    statistics,
    report,

    /*
    |--------------------------------------------------------------------------
    | Filters
    |--------------------------------------------------------------------------
    */

    filters,
    setFilters,
    setSearch,
    setStatus,
    clearFilters,

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    page,
    perPage,
    pagination,
    paginationState,
    summary,
    setPage,
    setPerPage,
    nextPage,
    previousPage,

    /*
    |--------------------------------------------------------------------------
    | Loading states
    |--------------------------------------------------------------------------
    */

    loading,
    detailsLoading,
    statisticsLoading,
    reportLoading,
    outstandingLoading,
    actionLoading,

    /*
    |--------------------------------------------------------------------------
    | Errors
    |--------------------------------------------------------------------------
    */

    error,
    detailsError,
    statisticsError,
    reportError,
    outstandingError,

    /*
    |--------------------------------------------------------------------------
    | List and details
    |--------------------------------------------------------------------------
    */

    fetchPlotSales,
    refresh,
    fetchPlotSaleById,
    clearSelectedSale,
    fetchPlotSalesByStatus,
    fetchPlotSalesByPlot,
    fetchPlotSalesByBuyer,

    /*
    |--------------------------------------------------------------------------
    | CRUD actions
    |--------------------------------------------------------------------------
    */

    createPlotSale,
    updatePlotSale,
    deletePlotSale,

    /*
    |--------------------------------------------------------------------------
    | Workflow actions
    |--------------------------------------------------------------------------
    */

    approvePlotSale,
    cancelPlotSale,
    completePlotSale,

    /*
    |--------------------------------------------------------------------------
    | Financial data
    |--------------------------------------------------------------------------
    */

    fetchOutstandingPlotSales,
    fetchPlotSalesStatistics,
    fetchPlotSalesReport,
  };
};

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

export default usePlotSales;