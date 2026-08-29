import {
  ArrowLeft,
  BarChart3,
  RefreshCw,
} from "lucide-react";

import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  fetchTenancyStatistics,
  selectTenancyLoadingStatistics,
  selectTenancyStatistics,
  selectTenancyStatisticsError,
  selectTenancyStatisticsErrorDetails,
} from "../../../store/tenancySlice";

import TenancyStats from "./TenancyStats";

/*
|--------------------------------------------------------------------------
| TENANCY STATISTICS PAGE
|--------------------------------------------------------------------------
|
| Dedicated full-page tenancy statistics screen.
|
| URL:
| /super-admin/tenancies/statistics
|
*/

const TenancyStatistics = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | Redux
  |--------------------------------------------------------------------------
  */

  const statistics = useSelector(
    selectTenancyStatistics
  );

  const loading = useSelector(
    selectTenancyLoadingStatistics
  );

  const error = useSelector(
    selectTenancyStatisticsError
  );

  const errorDetails = useSelector(
    selectTenancyStatisticsErrorDetails
  );

  /*
  |--------------------------------------------------------------------------
  | Load Statistics
  |--------------------------------------------------------------------------
  */

  const loadStatistics = useCallback(() => {
    dispatch(
      fetchTenancyStatistics()
    );
  }, [dispatch]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  /*
  |--------------------------------------------------------------------------
  | Retry
  |--------------------------------------------------------------------------
  */

  const handleRetry = () => {
    loadStatistics();
  };

  /*
  |--------------------------------------------------------------------------
  | Back
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {
    navigate(
      "/super-admin/tenancies"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            {/* Left */}
            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                title="Back to Tenancies"
              >
                <ArrowLeft
                  size={20}
                />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <BarChart3
                    size={22}
                    className="text-indigo-600"
                  />

                  <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    Tenancy Statistics
                  </h1>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  Overview of tenancy performance,
                  occupancy and financial statistics.
                </p>
              </div>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={handleRetry}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              {loading
                ? "Refreshing..."
                : "Refresh Statistics"}
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================
          CONTENT
      ================================================================ */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-red-800">
                  Unable to load tenancy statistics
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>

                {errorDetails &&
                  Object.keys(errorDetails).length > 0 && (
                    <pre className="mt-3 overflow-auto rounded-lg bg-red-100 p-3 text-xs text-red-800">
                      {JSON.stringify(
                        errorDetails,
                        null,
                        2
                      )}
                    </pre>
                  )}
              </div>

              <button
                type="button"
                onClick={handleRetry}
                className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <TenancyStats
          statistics={statistics}
          loading={loading}
        />

      </main>
    </div>
  );
};

export default TenancyStatistics;
