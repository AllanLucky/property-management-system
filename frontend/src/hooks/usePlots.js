import { useCallback, useState } from "react";
import plotApi from "../api/plot.api";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const extractArray = (response) => {
  // plotApi normally returns the Laravel response envelope.
  const body = response?.data ?? response;

  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.data)) {
    return body.data;
  }

  if (Array.isArray(body?.data?.data)) {
    return body.data.data;
  }

  return [];
};

const extractPagination = (response, itemCount, params = {}) => {
  const body = response?.data ?? response;
  const meta = body?.meta ?? response?.meta ?? {};
  const pagination =
    meta?.pagination ??
    body?.pagination ??
    body?.data?.pagination ??
    {};

  const perPage = Number(
    pagination.per_page ??
    pagination.perPage ??
    meta.per_page ??
    params.per_page ??
    params.perPage ??
    15
  );

  const currentPage = Number(
    pagination.current_page ??
    pagination.currentPage ??
    meta.current_page ??
    params.page ??
    1
  );

  const total = Number(
    pagination.total ??
    pagination.total_items ??
    meta.total ??
    body?.total ??
    itemCount
  );

  const safePerPage =
    Number.isFinite(perPage) && perPage > 0 ? perPage : 15;

  const safePage =
    Number.isFinite(currentPage) && currentPage > 0
      ? currentPage
      : 1;

  const safeTotal =
    Number.isFinite(total) && total >= 0 ? total : itemCount;

  return {
    current_page: safePage,
    currentPage: safePage,
    per_page: safePerPage,
    perPage: safePerPage,
    total: safeTotal,
    last_page: Math.max(1, Math.ceil(safeTotal / safePerPage)),
    lastPage: Math.max(1, Math.ceil(safeTotal / safePerPage)),
  };
};

const extractStatistics = (response) => {
  const body = response?.data ?? response;

  return (
    body?.data?.statistics ??
    body?.data ??
    body?.statistics ??
    body ??
    {}
  );
};

/*
|--------------------------------------------------------------------------
| EstateKenya Plot Management Hook
|--------------------------------------------------------------------------
*/

export function usePlot() {
  const [plots, setPlots] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    currentPage: 1,
    per_page: 15,
    perPage: 15,
    total: 0,
    last_page: 1,
    lastPage: 1,
  });

  const [filters, setFiltersState] = useState({
    search: "",
    status: "",
  });

  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Error Handling
  |--------------------------------------------------------------------------
  */

  const getErrorMessage = useCallback((err, fallback) => {
    const responseData = err?.response?.data;

    if (responseData?.errors) {
      const firstError = Object.values(responseData.errors)
        .flat()
        .find((message) => typeof message === "string");

      if (firstError) {
        return firstError;
      }
    }

    return (
      responseData?.message ||
      err?.message ||
      fallback ||
      "An unexpected error occurred."
    );
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Shared Request Handler
  |--------------------------------------------------------------------------
  */

  const execute = useCallback(
    async (request, fallbackMessage = "Request failed.") => {
      setLoading(true);
      setError(null);

      try {
        return await request();
      } catch (err) {
        setError(getErrorMessage(err, fallbackMessage));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getErrorMessage]
  );

  /*
  |--------------------------------------------------------------------------
  | Load All Plots
  |--------------------------------------------------------------------------
  */

  const getPlots = useCallback(
    async (params = {}) =>
      execute(async () => {
        const requestParams = {
          page: pagination.current_page,
          per_page: pagination.per_page,
          ...filters,
          ...params,
        };

        // Do not send empty filters.
        Object.keys(requestParams).forEach((key) => {
          if (
            requestParams[key] === "" ||
            requestParams[key] === null ||
            requestParams[key] === undefined
          ) {
            delete requestParams[key];
          }
        });

        // IMPORTANT: getPlots must call GET /plots, not /plots/available.
        const response = await plotApi.getPlots(requestParams);
        const list = extractArray(response);

        setPlots(list);
        setPagination(
          extractPagination(response, list.length, requestParams)
        );

        return list;
      }, "Failed to load plots."),
    [execute, filters, pagination.current_page, pagination.per_page]
  );

  /*
  |--------------------------------------------------------------------------
  | Plot Details
  |--------------------------------------------------------------------------
  */

  const getPlot = useCallback(
    async (id) => {
      if (!id) {
        throw new Error("A plot ID is required.");
      }

      return execute(
        () => plotApi.getPlot(id),
        "Failed to load plot details."
      );
    },
    [execute]
  );

  /*
  |--------------------------------------------------------------------------
  | Create Plot
  |--------------------------------------------------------------------------
  */

  const createPlot = useCallback(
    async (payload) =>
      execute(
        () => plotApi.createPlot(payload),
        "Failed to create plot."
      ),
    [execute]
  );

  /*
  |--------------------------------------------------------------------------
  | Update Plot
  |--------------------------------------------------------------------------
  */

  const updatePlot = useCallback(
    async (id, payload) => {
      if (!id) {
        throw new Error("A plot ID is required.");
      }

      return execute(
        () => plotApi.updatePlot(id, payload),
        "Failed to update plot."
      );
    },
    [execute]
  );

  /*
  |--------------------------------------------------------------------------
  | Delete Plot
  |--------------------------------------------------------------------------
  */

  const deletePlot = useCallback(
    async (id) => {
      if (!id) {
        throw new Error("A plot ID is required.");
      }

      return execute(
        () => plotApi.deletePlot(id),
        "Failed to delete plot."
      );
    },
    [execute]
  );

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const getStatistics = useCallback(
    async (params = {}) =>
      execute(async () => {
        const response = await plotApi.getStatistics(params);
        setStatistics(extractStatistics(response));
        return response;
      }, "Failed to load plot statistics."),
    [execute]
  );

  /*
  |--------------------------------------------------------------------------
  | Reports
  |--------------------------------------------------------------------------
  */

  const getPlotReport = useCallback(
    async (reportType = "inventory", params = {}) => {
      const supportedReports = [
        "inventory",
        "sales",
        "payments",
        "outstanding",
        "agents",
        "locations",
      ];

      if (!supportedReports.includes(reportType)) {
        throw new Error(`Unsupported plot report: ${reportType}`);
      }

      return execute(
        () => plotApi.getPlotReport(reportType, params),
        "Failed to generate plot report."
      );
    },
    [execute]
  );

  /*
  |--------------------------------------------------------------------------
  | Available Plots
  |--------------------------------------------------------------------------
  */

  const getAvailablePlots = useCallback(
    async (params = {}) =>
      execute(async () => {
        const response = await plotApi.getAvailablePlots(params);
        const list = extractArray(response);
        setPlots(list);
        setPagination(extractPagination(response, list.length, params));
        return list;
      }, "Failed to load available plots."),
    [execute]
  );

  /*
  |--------------------------------------------------------------------------
  | Reserved Plots
  |--------------------------------------------------------------------------
  */

  const getReservedPlots = useCallback(
    async (params = {}) =>
      execute(async () => {
        const response = await plotApi.getPlots({
          ...params,
          status: "reserved",
        });

        const list = extractArray(response);
        setPlots(list);
        setPagination(extractPagination(response, list.length, params));
        return list;
      }, "Failed to load reserved plots."),
    [execute]
  );

  /*
  |--------------------------------------------------------------------------
  | Update Plot Status
  |--------------------------------------------------------------------------
  */

  const updatePlotStatus = useCallback(
    async (id, status) => {
      const allowedStatuses = [
        "available",
        "reserved",
        "sold",
        "unavailable",
      ];

      if (!id) {
        throw new Error("A plot ID is required.");
      }

      if (!allowedStatuses.includes(status)) {
        throw new Error("Invalid plot status.");
      }

      return execute(
        () => plotApi.updatePlotStatus(id, status),
        "Failed to update plot status."
      );
    },
    [execute]
  );

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const searchPlots = useCallback(
    async (searchTerm, params = {}) => {
      const nextFilters = {
        ...filters,
        search: searchTerm ?? "",
      };

      setFiltersState(nextFilters);

      return execute(async () => {
        const requestParams = {
          ...params,
          ...nextFilters,
          page: 1,
        };

        Object.keys(requestParams).forEach((key) => {
          if (
            requestParams[key] === "" ||
            requestParams[key] === null ||
            requestParams[key] === undefined
          ) {
            delete requestParams[key];
          }
        });

        const response = await plotApi.getPlots(requestParams);
        const list = extractArray(response);

        setPlots(list);
        setPagination(
          extractPagination(response, list.length, requestParams)
        );

        return list;
      }, "Failed to search plots.");
    },
    [execute, filters]
  );

  /*
  |--------------------------------------------------------------------------
  | List Filters
  |--------------------------------------------------------------------------
  */

  const setFilters = useCallback((updates = {}) => {
    setFiltersState((previous) => ({
      ...previous,
      ...updates,
    }));

    setPagination((previous) => ({
      ...previous,
      current_page: 1,
      currentPage: 1,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({
      search: "",
      status: "",
    });

    setPagination((previous) => ({
      ...previous,
      current_page: 1,
      currentPage: 1,
    }));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Pagination Controls
  |--------------------------------------------------------------------------
  */

  const setPage = useCallback((page) => {
    const nextPage = Math.max(1, Number(page) || 1);

    setPagination((previous) => ({
      ...previous,
      current_page: nextPage,
      currentPage: nextPage,
    }));
  }, []);

  const setPerPage = useCallback((perPage) => {
    const nextPerPage = Math.max(1, Number(perPage) || 15);

    setPagination((previous) => ({
      ...previous,
      per_page: nextPerPage,
      perPage: nextPerPage,
      current_page: 1,
      currentPage: 1,
    }));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Error Controls
  |--------------------------------------------------------------------------
  */

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    plots,
    pagination,
    filters,
    statistics,
    loading,
    error,

    // CRUD
    getPlots,
    getPlot,
    createPlot,
    updatePlot,
    deletePlot,

    // Statistics and reports
    getStatistics,
    getPlotReport,

    // Plot status lists
    getAvailablePlots,
    getReservedPlots,
    updatePlotStatus,

    // Search and filters
    search: searchPlots,
    searchPlots,
    setFilters,
    clearFilters,

    // Pagination
    setPage,
    setPerPage,

    // Errors
    clearError,
  };
}

export const usePlots = usePlot;
export default usePlot;