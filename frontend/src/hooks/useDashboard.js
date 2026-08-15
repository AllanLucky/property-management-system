import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  fetchDashboard,
  refreshDashboard,
} from "../services/dashboard.service";

/*
|--------------------------------------------------------------------------
| TYPES / DEFAULT DATA
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| DEFAULT DASHBOARD
|--------------------------------------------------------------------------
*/

const DEFAULT_DASHBOARD = {
  id: null,
  name: "Dashboard",
  slug: null,
  description: null,
  type: null,

  layout: {
    columns: 12,
    responsive: true,
    cards: {
      small: 3,
      medium: 4,
      large: 6,
      full: 12,
    },
  },

  widgets: [],
  filters: [],

  is_default: false,
  is_active: true,
  sort_order: 0,
};

/*
|--------------------------------------------------------------------------
| DEFAULT USER
|--------------------------------------------------------------------------
*/

const DEFAULT_USER = {
  id: null,
  name: "User",
  first_name: null,
  last_name: null,
  email: null,
  roles: [],
};

/*
|--------------------------------------------------------------------------
| DEFAULT OVERVIEW
|--------------------------------------------------------------------------
*/

const DEFAULT_OVERVIEW = {
  properties: 0,
  apartments: 0,
  units: 0,
  occupied_units: 0,
  vacant_units: 0,
  occupancy_rate: 0,
  active_tenancies: 0,
  bookings: 0,
  rent_collected: 0,
  outstanding_rent: 0,
  expenses: 0,
  net_income: 0,
  maintenance_requests: 0,
};

/*
|--------------------------------------------------------------------------
| DEFAULT PROPERTIES
|--------------------------------------------------------------------------
*/

const DEFAULT_PROPERTIES = {
  total: 0,
  active: 0,
  featured: 0,
  verified: 0,
};

/*
|--------------------------------------------------------------------------
| DEFAULT APARTMENTS
|--------------------------------------------------------------------------
*/

const DEFAULT_APARTMENTS = {
  total: 0,
  active: 0,
};

/*
|--------------------------------------------------------------------------
| DEFAULT UNITS
|--------------------------------------------------------------------------
*/

const DEFAULT_UNITS = {
  total: 0,
  vacant: 0,
  occupied: 0,
  maintenance: 0,
  reserved: 0,
};

/*
|--------------------------------------------------------------------------
| DEFAULT OCCUPANCY
|--------------------------------------------------------------------------
*/

const DEFAULT_OCCUPANCY = {
  total_units: 0,
  occupied: 0,
  vacant: 0,
  maintenance: 0,
  reserved: 0,
  rate: 0,
};

/*
|--------------------------------------------------------------------------
| DEFAULT TENANCIES
|--------------------------------------------------------------------------
*/

const DEFAULT_TENANCIES = {
  total: 0,
  active: 0,
  pending: 0,
  expired: 0,
  terminated: 0,
};

/*
|--------------------------------------------------------------------------
| DEFAULT BOOKINGS
|--------------------------------------------------------------------------
*/

const DEFAULT_BOOKINGS = {
  total: 0,
  pending: 0,
  confirmed: 0,
  completed: 0,
  cancelled: 0,
};

/*
|--------------------------------------------------------------------------
| DEFAULT FINANCIALS
|--------------------------------------------------------------------------
*/

const DEFAULT_FINANCIALS = {
  rent_due: 0,
  rent_collected: 0,
  outstanding: 0,
  expenses: 0,
  net_income: 0,
};

/*
|--------------------------------------------------------------------------
| DEFAULT MAINTENANCE
|--------------------------------------------------------------------------
*/

const DEFAULT_MAINTENANCE = {
  total: 0,
  pending: 0,
  in_progress: 0,
  completed: 0,
  cancelled: 0,
};

/*
|--------------------------------------------------------------------------
| NORMALIZE NUMBER
|--------------------------------------------------------------------------
*/

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

/*
|--------------------------------------------------------------------------
| NORMALIZE ARRAY
|--------------------------------------------------------------------------
*/

const toArray = (value) => {
  return Array.isArray(value)
    ? value
    : [];
};

/*
|--------------------------------------------------------------------------
| NORMALIZE OBJECT
|--------------------------------------------------------------------------
*/

const toObject = (
  value,
  fallback = {}
) => {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return fallback;
};

/*
|--------------------------------------------------------------------------
| NORMALIZE DASHBOARD
|--------------------------------------------------------------------------
*/

const normalizeDashboard = (
  dashboard
) => {
  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  |
  | The API is allowed to return:
  |
  | "dashboard": null
  |
  | In that case we preserve null.
  |
  */

  if (dashboard === null || dashboard === undefined) {
    return null;
  }

  const value = toObject(
    dashboard,
    DEFAULT_DASHBOARD
  );

  return {
    ...DEFAULT_DASHBOARD,

    ...value,

    id:
      value.id ??
      null,

    name:
      value.name ||
      DEFAULT_DASHBOARD.name,

    slug:
      value.slug ??
      null,

    description:
      value.description ??
      null,

    type:
      value.type ??
      null,

    layout: {
      ...DEFAULT_DASHBOARD.layout,

      ...toObject(
        value.layout
      ),

      cards: {
        ...DEFAULT_DASHBOARD.layout.cards,

        ...toObject(
          value.layout?.cards
        ),
      },
    },

    widgets:
      toArray(value.widgets),

    filters:
      toArray(value.filters),

    is_default:
      Boolean(value.is_default),

    is_active:
      value.is_active === undefined
        ? true
        : Boolean(value.is_active),

    sort_order:
      toNumber(
        value.sort_order
      ),
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE USER
|--------------------------------------------------------------------------
*/

const normalizeUser = (
  user
) => {
  const value = toObject(
    user,
    DEFAULT_USER
  );

  const fullName = [
    value.first_name,
    value.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    ...DEFAULT_USER,

    ...value,

    id:
      value.id ??
      null,

    name:
      value.name ||
      fullName ||
      value.email ||
      "User",

    first_name:
      value.first_name ??
      null,

    last_name:
      value.last_name ??
      null,

    email:
      value.email ??
      null,

    roles:
      toArray(value.roles),
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE OVERVIEW
|--------------------------------------------------------------------------
*/

const normalizeOverview = (
  overview
) => {
  const value = toObject(
    overview,
    DEFAULT_OVERVIEW
  );

  return {
    ...DEFAULT_OVERVIEW,

    properties:
      toNumber(value.properties),

    apartments:
      toNumber(value.apartments),

    units:
      toNumber(value.units),

    occupied_units:
      toNumber(
        value.occupied_units
      ),

    vacant_units:
      toNumber(
        value.vacant_units
      ),

    occupancy_rate:
      toNumber(
        value.occupancy_rate
      ),

    active_tenancies:
      toNumber(
        value.active_tenancies
      ),

    bookings:
      toNumber(value.bookings),

    rent_collected:
      toNumber(
        value.rent_collected
      ),

    outstanding_rent:
      toNumber(
        value.outstanding_rent
      ),

    expenses:
      toNumber(value.expenses),

    net_income:
      toNumber(value.net_income),

    maintenance_requests:
      toNumber(
        value.maintenance_requests
      ),
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE PROPERTIES
|--------------------------------------------------------------------------
*/

const normalizeProperties = (
  properties
) => {
  const value =
    toObject(properties);

  return {
    ...DEFAULT_PROPERTIES,

    total:
      toNumber(value.total),

    active:
      toNumber(value.active),

    featured:
      toNumber(value.featured),

    verified:
      toNumber(value.verified),
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE APARTMENTS
|--------------------------------------------------------------------------
*/

const normalizeApartments = (
  apartments
) => {
  const value =
    toObject(apartments);

  return {
    ...DEFAULT_APARTMENTS,

    total:
      toNumber(value.total),

    active:
      toNumber(value.active),
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE UNITS
|--------------------------------------------------------------------------
*/

const normalizeUnits = (
  units
) => {
  const value =
    toObject(units);

  return {
    ...DEFAULT_UNITS,

    total:
      toNumber(value.total),

    vacant:
      toNumber(value.vacant),

    occupied:
      toNumber(value.occupied),

    maintenance:
      toNumber(value.maintenance),

    reserved:
      toNumber(value.reserved),
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE OCCUPANCY
|--------------------------------------------------------------------------
*/

const normalizeOccupancy = (
  occupancy
) => {
  const value =
    toObject(occupancy);

  return {
    ...DEFAULT_OCCUPANCY,

    total_units:
      toNumber(
        value.total_units
      ),

    occupied:
      toNumber(value.occupied),

    vacant:
      toNumber(value.vacant),

    maintenance:
      toNumber(
        value.maintenance
      ),

    reserved:
      toNumber(value.reserved),

    rate:
      toNumber(value.rate),
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE TENANCIES
|--------------------------------------------------------------------------
*/

const normalizeTenancies = (
  tenancies
) => {
  const value =
    toObject(tenancies);

  return {
    ...DEFAULT_TENANCIES,

    total:
      toNumber(value.total),

    active:
      toNumber(value.active),

    pending:
      toNumber(value.pending),

    expired:
      toNumber(value.expired),

    terminated:
      toNumber(value.terminated),
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE BOOKINGS
|--------------------------------------------------------------------------
*/

const normalizeBookings = (
  bookings
) => {
  const value =
    toObject(bookings);

  return {
    ...DEFAULT_BOOKINGS,

    total:
      toNumber(value.total),

    pending:
      toNumber(value.pending),

    confirmed:
      toNumber(value.confirmed),

    completed:
      toNumber(value.completed),

    cancelled:
      toNumber(value.cancelled),
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE FINANCIALS
|--------------------------------------------------------------------------
*/

const normalizeFinancials = (
  financials
) => {
  const value =
    toObject(financials);

  return {
    ...DEFAULT_FINANCIALS,

    rent_due:
      toNumber(value.rent_due),

    rent_collected:
      toNumber(
        value.rent_collected
      ),

    outstanding:
      toNumber(
        value.outstanding
      ),

    expenses:
      toNumber(value.expenses),

    net_income:
      toNumber(value.net_income),
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE MAINTENANCE
|--------------------------------------------------------------------------
*/

const normalizeMaintenance = (
  maintenance
) => {
  const value =
    toObject(maintenance);

  return {
    ...DEFAULT_MAINTENANCE,

    total:
      toNumber(value.total),

    pending:
      toNumber(value.pending),

    in_progress:
      toNumber(
        value.in_progress
      ),

    completed:
      toNumber(value.completed),

    cancelled:
      toNumber(value.cancelled),
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE DASHBOARD RESPONSE
|--------------------------------------------------------------------------
*/

const normalizeDashboardResponse = (
  response
) => {
  /*
  |--------------------------------------------------------------------------
  | Supported structures
  |--------------------------------------------------------------------------
  |
  | Axios:
  |
  | response.data.data
  |
  | Direct:
  |
  | response.data
  |
  | Already unwrapped:
  |
  | response
  |
  */

  const payload =
    response?.data?.data ??
    response?.data ??
    response ??
    {};

  return {
    dashboard:
      normalizeDashboard(
        payload.dashboard
      ),

    user:
      normalizeUser(
        payload.user
      ),

    overview:
      normalizeOverview(
        payload.overview
      ),

    properties:
      payload.properties === null
        ? null
        : normalizeProperties(
          payload.properties
        ),

    apartments:
      payload.apartments === null
        ? null
        : normalizeApartments(
          payload.apartments
        ),

    units:
      payload.units === null
        ? null
        : normalizeUnits(
          payload.units
        ),

    occupancy:
      payload.occupancy === null
        ? null
        : normalizeOccupancy(
          payload.occupancy
        ),

    tenancies:
      payload.tenancies === null
        ? null
        : normalizeTenancies(
          payload.tenancies
        ),

    bookings:
      payload.bookings === null
        ? null
        : normalizeBookings(
          payload.bookings
        ),

    financials:
      payload.financials === null
        ? null
        : normalizeFinancials(
          payload.financials
        ),

    maintenance:
      payload.maintenance === null
        ? null
        : normalizeMaintenance(
          payload.maintenance
        ),

    activity:
      toArray(
        payload.activity
      ),

    meta:
      payload.meta ??
      null,

    links:
      payload.links ??
      null,
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE ERROR
|--------------------------------------------------------------------------
*/

const normalizeError = (
  error
) => {
  const response =
    error?.response;

  return {
    message:
      response?.data?.message ||
      error?.message ||
      "Failed to load dashboard.",

    code:
      response?.data?.code ??
      response?.status ??
      500,

    status:
      response?.data?.status ??
      false,

    errors:
      response?.data?.errors ??
      null,
  };
};

/*
|--------------------------------------------------------------------------
| DASHBOARD HOOK
|--------------------------------------------------------------------------
*/

const useDashboard = (
  options = {}
) => {
  const {
    autoFetch = true,
    initialParams = {},
    onSuccess,
    onError,
  } = options;

  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(
    Boolean(autoFetch)
  );

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);

  const [
    params,
    setParams,
  ] = useState(
    initialParams
  );

  /*
  |--------------------------------------------------------------------------
  | Refs
  |--------------------------------------------------------------------------
  */

  const mountedRef =
    useRef(true);

  const requestRef =
    useRef(0);

  /*
  |--------------------------------------------------------------------------
  | Mounted
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Fetch Dashboard
  |--------------------------------------------------------------------------
  */

  const getDashboard =
    useCallback(
      async (
        nextParams = {},
        requestOptions = {}
      ) => {
        const {
          silent = false,
          refresh = false,
        } = requestOptions;

        const requestId =
          ++requestRef.current;

        /*
        |--------------------------------------------------------------------------
        | Loading
        |--------------------------------------------------------------------------
        */

        if (
          !silent &&
          !refresh
        ) {
          setLoading(true);
        }

        if (refresh) {
          setRefreshing(true);
        }

        setError(null);

        try {
          /*
          |--------------------------------------------------------------------------
          | API
          |--------------------------------------------------------------------------
          */

          const response =
            refresh
              ? await refreshDashboard(
                nextParams
              )
              : await fetchDashboard(
                nextParams
              );

          /*
          |--------------------------------------------------------------------------
          | Normalize
          |--------------------------------------------------------------------------
          */

          const normalized =
            normalizeDashboardResponse(
              response
            );

          /*
          |--------------------------------------------------------------------------
          | Ignore stale request
          |--------------------------------------------------------------------------
          */

          if (
            !mountedRef.current ||
            requestId !==
            requestRef.current
          ) {
            return normalized;
          }

          /*
          |--------------------------------------------------------------------------
          | Store dashboard
          |--------------------------------------------------------------------------
          */

          setDashboard(
            normalized
          );

          setParams(
            nextParams
          );

          /*
          |--------------------------------------------------------------------------
          | Success
          |--------------------------------------------------------------------------
          */

          if (
            typeof onSuccess ===
            "function"
          ) {
            onSuccess(
              normalized,
              response
            );
          }

          return normalized;
        } catch (err) {
          const normalizedError =
            normalizeError(err);

          /*
          |--------------------------------------------------------------------------
          | Store error
          |--------------------------------------------------------------------------
          */

          if (
            mountedRef.current &&
            requestId ===
            requestRef.current
          ) {
            setError(
              normalizedError
            );

            if (
              typeof onError ===
              "function"
            ) {
              onError(
                normalizedError,
                err
              );
            }
          }

          throw err;
        } finally {
          /*
          |--------------------------------------------------------------------------
          | Reset loading
          |--------------------------------------------------------------------------
          */

          if (
            mountedRef.current &&
            requestId ===
            requestRef.current
          ) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      },
      [
        onSuccess,
        onError,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Initial Fetch
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    getDashboard(
      initialParams
    ).catch(() => { });

    // Fetch only on initial mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]);

  /*
  |--------------------------------------------------------------------------
  | Refresh Dashboard
  |--------------------------------------------------------------------------
  */

  const refresh =
    useCallback(
      async (
        nextParams = params
      ) => {
        try {
          return await getDashboard(
            nextParams,
            {
              refresh: true,
            }
          );
        } catch {
          return null;
        }
      },
      [
        getDashboard,
        params,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Update Parameters
  |--------------------------------------------------------------------------
  */

  const updateParams =
    useCallback(
      (nextParams = {}) => {
        setParams(
          (current) => ({
            ...current,
            ...nextParams,
          })
        );
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Clear Parameters
  |--------------------------------------------------------------------------
  */

  const clearParams =
    useCallback(() => {
      setParams({});
    }, []);

  /*
  |--------------------------------------------------------------------------
  | Fetch With Parameters
  |--------------------------------------------------------------------------
  */

  const fetchWithParams =
    useCallback(
      async (
        nextParams = {}
      ) => {
        const mergedParams = {
          ...params,
          ...nextParams,
        };

        try {
          return await getDashboard(
            mergedParams
          );
        } catch {
          return null;
        }
      },
      [
        params,
        getDashboard,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Widget Helper
  |--------------------------------------------------------------------------
  */

  const hasWidget =
    useCallback(
      (widgetName) => {
        if (!widgetName) {
          return false;
        }

        return (
          dashboard
            ?.dashboard
            ?.widgets
            ?.includes(
              widgetName
            ) ?? false
        );
      },
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Role Helper
  |--------------------------------------------------------------------------
  */

  const hasRole =
    useCallback(
      (roleName) => {
        if (!roleName) {
          return false;
        }

        return (
          dashboard
            ?.user
            ?.roles
            ?.includes(
              roleName
            ) ?? false
        );
      },
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Dashboard Permission
  |--------------------------------------------------------------------------
  */

  const hasDashboardAccess =
    useMemo(() => {
      return Boolean(
        dashboard?.dashboard
      );
    }, [dashboard]);

  /*
  |--------------------------------------------------------------------------
  | User
  |--------------------------------------------------------------------------
  */

  const user =
    useMemo(
      () =>
        dashboard?.user ??
        DEFAULT_USER,
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Dashboard Config
  |--------------------------------------------------------------------------
  */

  const dashboardConfig =
    useMemo(
      () =>
        dashboard?.dashboard ??
        null,
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Overview
  |--------------------------------------------------------------------------
  */

  const overview =
    useMemo(
      () =>
        dashboard?.overview ??
        DEFAULT_OVERVIEW,
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Properties
  |--------------------------------------------------------------------------
  */

  const properties =
    useMemo(
      () =>
        dashboard?.properties ??
        null,
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Apartments
  |--------------------------------------------------------------------------
  */

  const apartments =
    useMemo(
      () =>
        dashboard?.apartments ??
        null,
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Units
  |--------------------------------------------------------------------------
  */

  const units =
    useMemo(
      () =>
        dashboard?.units ??
        null,
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Occupancy
  |--------------------------------------------------------------------------
  */

  const occupancy =
    useMemo(
      () =>
        dashboard?.occupancy ??
        null,
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Tenancies
  |--------------------------------------------------------------------------
  */

  const tenancies =
    useMemo(
      () =>
        dashboard?.tenancies ??
        null,
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Bookings
  |--------------------------------------------------------------------------
  */

  const bookings =
    useMemo(
      () =>
        dashboard?.bookings ??
        null,
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Financials
  |--------------------------------------------------------------------------
  */

  const financials =
    useMemo(
      () =>
        dashboard?.financials ??
        null,
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Maintenance
  |--------------------------------------------------------------------------
  */

  const maintenance =
    useMemo(
      () =>
        dashboard?.maintenance ??
        null,
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Activity
  |--------------------------------------------------------------------------
  */

  const activity =
    useMemo(
      () =>
        dashboard?.activity ??
        [],
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Return
  |--------------------------------------------------------------------------
  */

  return {
    /*
    |--------------------------------------------------------------------------
    | Main Dashboard
    |--------------------------------------------------------------------------
    */

    dashboard,

    dashboardConfig,

    user,

    overview,

    properties,

    apartments,

    units,

    occupancy,

    tenancies,

    bookings,

    financials,

    maintenance,

    activity,

    /*
    |--------------------------------------------------------------------------
    | State
    |--------------------------------------------------------------------------
    */

    loading,

    refreshing,

    error,

    params,

    /*
    |--------------------------------------------------------------------------
    | Actions
    |--------------------------------------------------------------------------
    */

    getDashboard,

    fetchDashboard:
      getDashboard,

    fetchWithParams,

    refresh,

    updateParams,

    clearParams,

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    hasWidget,

    hasRole,

    hasDashboardAccess,

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------

    */

    hasDashboard:
      Boolean(dashboard),

    hasDashboardConfig:
      Boolean(
        dashboardConfig?.id
      ),

    isEmpty:
      !dashboard &&
      !loading,

    isLoading:
      loading,

    isRefreshing:
      refreshing,

    hasError:
      Boolean(error),
  };
};

export default useDashboard;