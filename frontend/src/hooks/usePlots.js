
import { useCallback, useState } from "react";
import plotApi from "../api/plot.api";

/**
 * EstateKenya - Plot Management Hook
 *
 * Supports:
 * - Listing and searching plots
 * - Retrieving plot details
 * - Creating, updating, and deleting plots
 * - Plot statistics and reports
 * - Available and reserved plots
 * - Updating plot status
 *
 * Exports:
 * import usePlot from "../hooks/usePlots";
 * import { usePlot } from "../hooks/usePlots";
 * import { usePlots } from "../hooks/usePlots";
 */
export function usePlot() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Extract a useful error message from Laravel responses.
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

  /**
   * Execute API requests with shared loading and error handling.
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

  /**
   * Retrieve plots with filters and pagination.
   */
  const getPlots = useCallback(
    async (params = {}) =>
      execute(
        () => plotApi.getPlots(params),
        "Failed to load plots."
      ),
    [execute]
  );

  /**
   * Retrieve a single plot.
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

  /**
   * Create a plot.
   */
  const createPlot = useCallback(
    async (payload) =>
      execute(
        () => plotApi.createPlot(payload),
        "Failed to create plot."
      ),
    [execute]
  );

  /**
   * Update a plot.
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

  /**
   * Delete a plot.
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

  /**
   * Retrieve plot statistics.
   */
  const getStatistics = useCallback(
    async (params = {}) =>
      execute(
        () => plotApi.getStatistics(params),
        "Failed to load plot statistics."
      ),
    [execute]
  );

  /**
   * Retrieve a plot report.
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
        throw new Error(
          `Unsupported plot report: ${reportType}`
        );
      }

      return execute(
        () => plotApi.getPlotReport(reportType, params),
        "Failed to generate plot report."
      );
    },
    [execute]
  );

  /**
   * Retrieve available plots.
   */
  const getAvailablePlots = useCallback(
    async (params = {}) =>
      execute(
        () =>
          plotApi.getPlots({
            ...params,
            status: "available",
          }),
        "Failed to load available plots."
      ),
    [execute]
  );

  /**
   * Retrieve reserved plots.
   */
  const getReservedPlots = useCallback(
    async (params = {}) =>
      execute(
        () =>
          plotApi.getPlots({
            ...params,
            status: "reserved",
          }),
        "Failed to load reserved plots."
      ),
    [execute]
  );

  /**
   * Update plot status.
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

  /**
   * Search plots.
   */
  const searchPlots = useCallback(
    async (search, params = {}) =>
      execute(
        () =>
          plotApi.searchPlots({
            ...params,
            search,
          }),
        "Failed to search plots."
      ),
    [execute]
  );

  /**
   * Clear any displayed error.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    clearError,

    getPlots,
    getPlot,
    createPlot,
    updatePlot,
    deletePlot,

    getStatistics,
    getPlotReport,

    getAvailablePlots,
    getReservedPlots,
    updatePlotStatus,
    searchPlots,
  };
}
export const usePlots = usePlot;
export default usePlot;
