
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

const STATISTICS_KEYS = [
  "total_sales",
  "pending_sales",
  "reserved_sales",
  "approved_sales",
  "completed_sales",
  "cancelled_sales",
  "total_amount",
  "total_deposit",
  "total_discount",
  "total_paid",
  "total_outstanding",
];

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again.",
) =>
  error?.response?.data?.message ||
  error?.response?.data?.errors?.message?.[0] ||
  error?.message ||
  fallback;

const getPayload = (response) => {
  let payload = response?.data ?? response;

  for (let index = 0; index < 5; index += 1) {
    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      return payload;
    }

    if (
      STATISTICS_KEYS.some(
        (key) => payload[key] !== undefined,
      )
    ) {
      return payload;
    }

    if (
      payload.data !== undefined &&
      payload.data !== null
    ) {
      payload = payload.data;
      continue;
    }

    return payload;
  }

  return payload;
};

const getRows = (response) => {
  const payload = getPayload(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const getPagination = (
  response,
  fallbackPage = 1,
  fallbackPerPage = DEFAULT_PER_PAGE,
) => {
  const payload = response?.data ?? response;

  const candidates = [
    payload?.meta,
    payload?.data?.meta,
    payload?.data?.data?.meta,
    payload?.data,
    payload?.data?.data,
  ];

  const metadata = candidates.find(
    (item) =>
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      (
        item.current_page !== undefined ||
        item.last_page !== undefined ||
        item.total !== undefined ||
        item.per_page !== undefined
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
    from: metadata?.from ?? null,
    to: metadata?.to ?? null,
  };
};

const getRecord = (response) => {
  const payload = getPayload(response);

  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload)
  ) {
    return payload;
  }

  return null;
};

const normalizeFilters = (filters = {}) =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) =>
        value !== undefined && value !== null,
    ),
  );

const getStatisticsFilters = (filters = {}) =>
  normalizeFilters(filters);

/*
|--------------------------------------------------------------------------
| CUSTOM HOOK
|--------------------------------------------------------------------------
*/

export const usePlotSales = ({
  autoFetch = true,
  initialFilters = {},
  initialPerPage = DEFAULT_PER_PAGE,
} = {}) => {
  "use no memo";

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
  */

  const mountedRef = useRef(false);
  const listRequestId = useRef(0);
  const statisticsRequestId = useRef(0);

  /*
  |--------------------------------------------------------------------------
  | FILTERS
  |--------------------------------------------------------------------------
  */

  const setFilters = useCallback((nextFilters = {}) => {
    setFiltersState((previous) => ({
      ...previous,
      ...nextFilters,
    }));

    setPageState(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({ ...DEFAULT_FILTERS });
    setPageState(1);
  }, []);

  const setSearch = useCallback((search) => {
    setFiltersState((previous) => ({
      ...previous,
      search: search ?? "",
    }));

    setPageState(1);
  }, []);

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

  const fetchPlotSales = useCallback(
    async (overrides = {}) => {
      const requestId = ++listRequestId.current;

      const requestFilters = normalizeFilters({
        ...filters,
        ...overrides,
        page: overrides.page ?? page,
        per_page: overrides.per_page ?? perPage,
      });

      setLoading(true);
      setError(null);

      try {
        const response = await plotSalesApi.getPlotSales(
          requestFilters,
        );

        if (
          !mountedRef.current ||
          requestId !== listRequestId.current
        ) {
          return response;
        }

        setSales(getRows(response));

        setPagination(
          getPagination(
            response,
            Number(requestFilters.page) || 1,
            Number(requestFilters.per_page) || DEFAULT_PER_PAGE,
          ),
        );

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

  const fetchPlotSaleById = useCallback(async (id) => {
    setDetailsLoading(true);
    setDetailsError(null);

    try {
      const response =
        await plotSalesApi.getPlotSaleById(id);

      const record = getRecord(response);

      setSelectedSale(record);

      return record;
    } catch (requestError) {
      setDetailsError(
        getErrorMessage(
          requestError,
          "Failed to fetch plot sale details.",
        ),
      );

      throw requestError;
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const clearSelectedSale = useCallback(() => {
    setSelectedSale(null);
    setDetailsError(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FILTERED SALES
  |--------------------------------------------------------------------------
  */

  const fetchFilteredSales = useCallback(
    async (request, fallbackMessage, params = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response = await request({
          page: params.page ?? page,
          per_page: params.per_page ?? perPage,
        });

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
          getErrorMessage(requestError, fallbackMessage),
        );

        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    [page, perPage],
  );

  const fetchPlotSalesByStatus = useCallback(
    (status, params = {}) =>
      fetchFilteredSales(
        (paginationParams) =>
          plotSalesApi.getPlotSalesByStatus(
            status,
            paginationParams,
          ),
        "Failed to fetch plot sales by status.",
        params,
      ),
    [fetchFilteredSales],
  );

  const fetchPlotSalesByPlot = useCallback(
    (plotId, params = {}) =>
      fetchFilteredSales(
        (paginationParams) =>
          plotSalesApi.getPlotSalesByPlot(
            plotId,
            paginationParams,
          ),
        "Failed to fetch sales for this plot.",
        params,
      ),
    [fetchFilteredSales],
  );

  const fetchPlotSalesByBuyer = useCallback(
    (buyerId, params = {}) =>
      fetchFilteredSales(
        (paginationParams) =>
          plotSalesApi.getPlotSalesByBuyer(
            buyerId,
            paginationParams,
          ),
        "Failed to fetch sales for this buyer.",
        params,
      ),
    [fetchFilteredSales],
  );

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const fetchPlotSalesStatistics = useCallback(
    async (customFilters = {}) => {
      const requestId = ++statisticsRequestId.current;

      setStatisticsLoading(true);
      setStatisticsError(null);

      try {
        const response =
          await plotSalesApi.getPlotSalesStatistics({
            ...getStatisticsFilters(filters),
            ...getStatisticsFilters(customFilters),
          });

        const payload = getPayload(response);

        if (
          !payload ||
          typeof payload !== "object" ||
          Array.isArray(payload) ||
          !STATISTICS_KEYS.some(
            (key) => payload[key] !== undefined,
          )
        ) {
          throw new Error(
            "No plot sales statistics fields were found in the API response.",
          );
        }

        if (
          mountedRef.current &&
          requestId === statisticsRequestId.current
        ) {
          setStatistics(payload);
        }

        return payload;
      } catch (requestError) {
        if (
          mountedRef.current &&
          requestId === statisticsRequestId.current
        ) {
          setStatisticsError(
            getErrorMessage(
              requestError,
              "Failed to fetch plot sales statistics.",
            ),
          );
        }

        throw requestError;
      } finally {
        if (
          mountedRef.current &&
          requestId === statisticsRequestId.current
        ) {
          setStatisticsLoading(false);
        }
      }
    },
    [filters],
  );

  /*
  |--------------------------------------------------------------------------
  | OUTSTANDING SALES
  |--------------------------------------------------------------------------
  */

  const fetchOutstandingPlotSales = useCallback(
    async (params = {}) => {
      setOutstandingLoading(true);
      setOutstandingError(null);

      try {
        const response =
          await plotSalesApi.getOutstandingPlotSales({
            page: params.page ?? 1,
            per_page: params.per_page ?? perPage,
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
  | REPORTS
  |--------------------------------------------------------------------------
  */

  const fetchPlotSalesReport = useCallback(
    async (customFilters = {}) => {
      setReportLoading(true);
      setReportError(null);

      try {
        const response =
          await plotSalesApi.getPlotSalesReport({
            ...getStatisticsFilters(filters),
            ...getStatisticsFilters(customFilters),
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
  | REFRESH AFTER SALE CHANGES
  |--------------------------------------------------------------------------
  */

  const refreshAfterSaleChange = useCallback(async () => {
    const results = await Promise.allSettled([
      fetchPlotSales(),
      fetchPlotSalesStatistics(),
    ]);

    const failedRequest = results.find(
      (result) => result.status === "rejected",
    );

    if (failedRequest) {
      throw failedRequest.reason;
    }
  }, [fetchPlotSales, fetchPlotSalesStatistics]);

  /*
  |--------------------------------------------------------------------------
  | CREATE SALE
  |--------------------------------------------------------------------------
  */

  const createPlotSale = useCallback(
    async (saleData) => {
      setActionLoading(true);
      setError(null);

      try {
        const response =
          await plotSalesApi.createPlotSale(saleData);

        const record = getRecord(response);

        if (record?.id) {
          setSelectedSale(record);
        }

        await refreshAfterSaleChange();

        return record;
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
    [refreshAfterSaleChange],
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE SALE
  |--------------------------------------------------------------------------
  */

  const updatePlotSale = useCallback(
    async (id, saleData) => {
      setActionLoading(true);
      setError(null);

      try {
        const response =
          await plotSalesApi.updatePlotSale(id, saleData);

        const record = getRecord(response);

        if (String(selectedSale?.id) === String(id)) {
          setSelectedSale(record);
        }

        await refreshAfterSaleChange();

        return record;
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
    [refreshAfterSaleChange, selectedSale],
  );

  /*
  |--------------------------------------------------------------------------
  | DELETE SALE
  |--------------------------------------------------------------------------
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

        if (String(selectedSale?.id) === String(id)) {
          setSelectedSale(null);
        }

        await refreshAfterSaleChange();

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
    [refreshAfterSaleChange, selectedSale],
  );

  /*
  |--------------------------------------------------------------------------
  | APPROVE SALE
  |--------------------------------------------------------------------------
  */

  const approvePlotSale = useCallback(
    async (id) => {
      setActionLoading(true);
      setError(null);

      try {
        const response =
          await plotSalesApi.approvePlotSale(id);

        const record = getRecord(response);

        if (String(selectedSale?.id) === String(id)) {
          setSelectedSale(record);
        }

        await refreshAfterSaleChange();

        return record;
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
    [refreshAfterSaleChange, selectedSale],
  );

  /*
  |--------------------------------------------------------------------------
  | CANCEL SALE
  |--------------------------------------------------------------------------
  */

  const cancelPlotSale = useCallback(
    async (id, reason = null) => {
      setActionLoading(true);
      setError(null);

      try {
        const response =
          await plotSalesApi.cancelPlotSale(id, reason);

        const record = getRecord(response);

        if (String(selectedSale?.id) === String(id)) {
          setSelectedSale(record);
        }

        await refreshAfterSaleChange();

        return record;
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
    [refreshAfterSaleChange, selectedSale],
  );

  /*
  |--------------------------------------------------------------------------
  | COMPLETE SALE
  |--------------------------------------------------------------------------
  */

  const completePlotSale = useCallback(
    async (id) => {
      setActionLoading(true);
      setError(null);

      try {
        const response =
          await plotSalesApi.completePlotSale(id);

        const record = getRecord(response);

        if (String(selectedSale?.id) === String(id)) {
          setSelectedSale(record);
        }

        await refreshAfterSaleChange();

        return record;
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
    [refreshAfterSaleChange, selectedSale],
  );

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
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

  const setPerPage = useCallback((nextPerPage) => {
    const normalized = Math.max(
      1,
      Math.min(
        100,
        Number(nextPerPage) || DEFAULT_PER_PAGE,
      ),
    );

    setPerPageState(normalized);

    setPagination((previous) => ({
      ...previous,
      per_page: normalized,
    }));

    setPageState(1);
  }, []);

  const nextPage = useCallback(() => {
    setPageState((previous) =>
      Math.min(pagination.last_page, previous + 1),
    );
  }, [pagination.last_page]);

  const previousPage = useCallback(() => {
    setPageState((previous) =>
      Math.max(1, previous - 1),
    );
  }, []);

  const refresh = useCallback(
    () => fetchPlotSales(),
    [fetchPlotSales],
  );

  /*
  |--------------------------------------------------------------------------
  | LIFECYCLE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      listRequestId.current += 1;
      statisticsRequestId.current += 1;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | AUTOMATIC LIST FETCH
  |--------------------------------------------------------------------------
  |
  | Schedule the request outside the synchronous effect body.
  | Cleanup prevents a queued request from starting after unmount
  | or after this effect has been replaced.
  */

  useEffect(() => {
    if (!autoFetch) return undefined;

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      fetchPlotSales().catch(() => {
        // The hook stores the error in its error state.
      });
    });

    return () => {
      cancelled = true;
    };
  }, [autoFetch, fetchPlotSales]);

  /*
  |--------------------------------------------------------------------------
  | AUTOMATIC STATISTICS FETCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!autoFetch) return undefined;

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      fetchPlotSalesStatistics().catch(() => {
        // The hook stores the error in statisticsError.
      });
    });

    return () => {
      cancelled = true;
    };
  }, [autoFetch, fetchPlotSalesStatistics]);

  /*
  |--------------------------------------------------------------------------
  | DERIVED VALUES
  |--------------------------------------------------------------------------
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
    // Data
    sales,
    plotSales: sales,
    selectedSale,
    outstandingSales,
    statistics,
    report,

    // Filters
    filters,
    setFilters,
    setSearch,
    setStatus,
    clearFilters,

    // Pagination
    page,
    perPage,
    pagination,
    paginationState,
    summary,
    setPage,
    setPerPage,
    nextPage,
    previousPage,

    // Loading
    loading,
    detailsLoading,
    statisticsLoading,
    reportLoading,
    outstandingLoading,
    actionLoading,

    // Errors
    error,
    detailsError,
    statisticsError,
    reportError,
    outstandingError,

    // List and details
    fetchPlotSales,
    refresh,
    fetchPlotSaleById,
    clearSelectedSale,
    fetchPlotSalesByStatus,
    fetchPlotSalesByPlot,
    fetchPlotSalesByBuyer,

    // CRUD and workflow
    createPlotSale,
    updatePlotSale,
    deletePlotSale,
    approvePlotSale,
    cancelPlotSale,
    completePlotSale,

    // Financial data
    fetchOutstandingPlotSales,
    fetchPlotSalesStatistics,
    fetchPlotSalesReport,
  };
};

export default usePlotSales;
