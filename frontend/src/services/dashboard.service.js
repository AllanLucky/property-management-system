import api from "../api/axios";

/*
|--------------------------------------------------------------------------
| DASHBOARD SERVICE
|--------------------------------------------------------------------------
|
| Backend endpoint:
|
| GET /api/dashboard
|
| The authenticated Laravel user determines:
|
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
| NORMALIZE PARAMETERS
|--------------------------------------------------------------------------
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
      ([, value]) => {
        if (
          value === undefined ||
          value === null ||
          value === ""
        ) {
          return false;
        }

        return true;
      }
    )
  );
};

/*
|--------------------------------------------------------------------------
| FETCH DASHBOARD
|--------------------------------------------------------------------------
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

  /*
  |--------------------------------------------------------------------------
  | Return Axios response data.
  |
  | Example:
  |
  | {
  |   status: true,
  |   code: 200,
  |   message: "...",
  |   data: {...}
  | }
  |--------------------------------------------------------------------------
  */

  return (
    response?.data ??
    response
  );
};

/*
|--------------------------------------------------------------------------
| REFRESH DASHBOARD
|--------------------------------------------------------------------------
|
| Dashboard statistics are calculated from the
| current database state, so refresh uses the
| same endpoint with cache prevention headers.
|
|--------------------------------------------------------------------------
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

      headers: {
        "Cache-Control":
          "no-cache",

        Pragma:
          "no-cache",
      },
    }
  );

  return (
    response?.data ??
    response
  );
};

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

const dashboardService = {
  fetchDashboard,
  refreshDashboard,
};

export default dashboardService;