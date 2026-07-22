import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchPropertyAnalytics,
  fetchPropertyAnalyticsById,
  createPropertyAnalytics,
  updatePropertyAnalytics,
  deletePropertyAnalytics,
  clearPropertyAnalyticsError,
  clearPropertyAnalyticsMessage,
  clearPropertyAnalyticsDetails,
  resetPropertyAnalyticsState,
} from "../store/propertyAnalyticsSlice";

const usePropertyAnalytics = () => {
  const dispatch = useDispatch();

  const {
    analytics,
    analyticsDetails,
    loading,
    actionLoading,
    success,
    error,
    message,
    pagination,
  } = useSelector((state) => state.propertyAnalytics);

  /**
   * Fetch all property analytics
   */
  const getPropertyAnalytics = useCallback(
    (params = {}) => dispatch(fetchPropertyAnalytics(params)),
    [dispatch]
  );

  /**
   * Fetch single property analytics
   */
  const getPropertyAnalyticsById = useCallback(
    (id) => dispatch(fetchPropertyAnalyticsById(id)),
    [dispatch]
  );

  /**
   * Create property analytics
   */
  const addPropertyAnalytics = useCallback(
    (data) => dispatch(createPropertyAnalytics(data)),
    [dispatch]
  );

  /**
   * Update property analytics
   */
  const editPropertyAnalytics = useCallback(
    (id, data) => dispatch(updatePropertyAnalytics({ id, data })),
    [dispatch]
  );

  /**
   * Delete property analytics
   */
  const removePropertyAnalytics = useCallback(
    (id) => dispatch(deletePropertyAnalytics(id)),
    [dispatch]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    dispatch(clearPropertyAnalyticsError());
  }, [dispatch]);

  /**
   * Clear success message
   */
  const clearMessage = useCallback(() => {
    dispatch(clearPropertyAnalyticsMessage());
  }, [dispatch]);

  /**
   * Clear selected analytics
   */
  const clearDetails = useCallback(() => {
    dispatch(clearPropertyAnalyticsDetails());
  }, [dispatch]);

  /**
   * Reset state
   */
  const resetState = useCallback(() => {
    dispatch(resetPropertyAnalyticsState());
  }, [dispatch]);

  return {
    // State
    analytics,
    analyticsDetails,
    loading,
    actionLoading,
    success,
    error,
    message,
    pagination,

    // Actions
    getPropertyAnalytics,
    getPropertyAnalyticsById,
    addPropertyAnalytics,
    editPropertyAnalytics,
    removePropertyAnalytics,

    // Helpers
    clearError,
    clearMessage,
    clearDetails,
    resetState,
  };
};

export default usePropertyAnalytics;