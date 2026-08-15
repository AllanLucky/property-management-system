import api from "../api/axios"

/*
|--------------------------------------------------------------------------
| DASHBOARD SERVICE
|--------------------------------------------------------------------------
|
| Backend:
|
| GET /api/dashboard
|
| The authenticated Laravel user determines:
| - Dashboard configuration
| - Role
| - Permissions
| - Accessible statistics
| - Data scope
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| SAFE PARAMS
|--------------------------------------------------------------------------
*/

/**
 * Remove undefined/null/empty-string parameters.
 *
 * This prevents requests such as:
 *
 * /dashboard?property_id=&period=
 *
 * @param {Object} params
 * @returns {Object}
 */
const normalizeParams = (params = {}) => {
  if (
    !params ||
    typeof params !== "object" ||
    Array.isArray(params)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );
};

/*
|--------------------------------------------------------------------------
| FETCH DASHBOARD
|--------------------------------------------------------------------------
*/

/**
 * Fetch the authenticated user's dashboard.
 *
 * Example:
 *
 * fetchDashboard();
 *
 * With filters:
 *
 * fetchDashboard({
 *   property_id: 20,
 *   period: "month",
 * });
 *
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export const fetchDashboard = async (
  params = {}
) => {
  const normalizedParams =
    normalizeParams(params);

  const response = await api.get(
    "/dashboard",
    {
      params: normalizedParams,
    }
  );

  return response?.data ?? response;
};

/*
|--------------------------------------------------------------------------
| REFRESH DASHBOARD
|--------------------------------------------------------------------------
*/

/**
 * Refresh the authenticated user's dashboard.
 *
 * The dashboard endpoint calculates statistics
 * from the current database state, therefore
 * refresh uses the same endpoint.
 *
 * Example:
 *
 * refreshDashboard();
 *
 * With filters:
 *
 * refreshDashboard({
 *   property_id: 20,
 *   period: "month",
 * });
 *
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export const refreshDashboard = async (
  params = {}
) => {
  const normalizedParams =
    normalizeParams(params);

  const response = await api.get(
    "/dashboard",
    {
      params: normalizedParams,
      /*
       * Prevent browser/proxy caching where
       * supported by the Axios adapter.
       */
      headers: {
        "Cache-Control": "no-cache",
      },
    }
  );

  return response?.data ?? response;
};

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

export default {
  fetchDashboard,
  refreshDashboard,
};