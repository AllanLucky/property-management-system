import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  fetchDashboard as fetchDashboardService,
  refreshDashboard as refreshDashboardService,
} from "../services/dashboard.service";

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

    breakpoints: {
      mobile: 1,
      tablet: 6,
      desktop: 12,
    },
  },

  widgets: [],
  filters: [],

  is_default: false,
  is_active: true,
  sort_order: 0,

  meta: {
    is_system: false,
    is_user_dashboard: false,
    widget_count: 0,
    filter_count: 0,
  },
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
  primary_role: null,
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
  inactive: 0,
  featured: 0,
  verified: 0,
  verification_rate: 0,
};

/*
|--------------------------------------------------------------------------
| DEFAULT APARTMENTS
|--------------------------------------------------------------------------
*/

const DEFAULT_APARTMENTS = {
  total: 0,
  active: 0,
  inactive: 0,
  active_rate: 0,
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
  available: 0,

  occupied_rate: 0,
  vacant_rate: 0,
  maintenance_rate: 0,
  reserved_rate: 0,

  status_breakdown: [],
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
  available_rate: 0,

  status_breakdown: [],
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
  cancelled: 0,

  active_rate: 0,

  status_breakdown: [],
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

  pending_rate: 0,
  confirmed_rate: 0,
  completed_rate: 0,
  cancelled_rate: 0,

  status_breakdown: [],
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

  collection_rate: 0,
  expense_rate: 0,
  net_margin: 0,
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
  open: 0,

  completion_rate: 0,

  status_breakdown: [],
};

/*
|--------------------------------------------------------------------------
| DEFAULT META
|--------------------------------------------------------------------------
*/

const DEFAULT_META = {
  generated_at: null,
  currency: "KES",
  timezone: "Africa/Nairobi",

  has_properties: false,
  has_apartments: false,
  has_units: false,
  has_occupancy: false,
  has_tenancies: false,
  has_bookings: false,
  has_financials: false,
  has_maintenance: false,
  has_activity: false,
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
| NORMALIZE BOOLEAN
|--------------------------------------------------------------------------
*/

const toBoolean = (
  value,
  fallback = false
) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === 1 || value === "1") {
    return true;
  }

  if (value === 0 || value === "0") {
    return false;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return Boolean(value);
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
| NORMALIZE STATUS BREAKDOWN
|--------------------------------------------------------------------------
*/

const normalizeStatusBreakdown = (
  value
) => {
  return toArray(value).map(
    (item) => {
      const statusItem =
        toObject(item);

      return {
        ...statusItem,

        status:
          statusItem.status ??
          null,

        label:
          statusItem.label ??
          statusItem.status ??
          "",

        count:
          toNumber(
            statusItem.count
          ),

        percentage:
          toNumber(
            statusItem.percentage
          ),
      };
    }
  );
};

/*
|--------------------------------------------------------------------------
| NORMALIZE WIDGET
|--------------------------------------------------------------------------
*/

const normalizeWidget = (
  widget
) => {
  const value =
    toObject(widget);

  return {
    ...value,

    key:
      value.key ??
      null,

    type:
      value.type ??
      "stat",

    title:
      value.title ??
      "",

    enabled:
      toBoolean(
        value.enabled,
        true
      ),

    order:
      toNumber(
        value.order
      ),
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE DASHBOARD META
|--------------------------------------------------------------------------
*/

const normalizeDashboardMeta = (
  meta
) => {
  const value =
    toObject(meta);

  return {
    is_system:
      toBoolean(
        value.is_system
      ),

    is_user_dashboard:
      toBoolean(
        value.is_user_dashboard
      ),

    widget_count:
      toNumber(
        value.widget_count
      ),

    filter_count:
      toNumber(
        value.filter_count
      ),
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE DASHBOARD
|--------------------------------------------------------------------------
*/

const normalizeDashboard = (
  dashboard
) => {
  if (
    dashboard === null ||
    dashboard === undefined
  ) {
    return null;
  }

  const value =
    toObject(
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

      columns:
        toNumber(
          value.layout?.columns,
          12
        ),

      responsive:
        toBoolean(
          value.layout?.responsive,
          true
        ),

      cards: {
        ...DEFAULT_DASHBOARD.layout.cards,

        ...toObject(
          value.layout?.cards
        ),

        small:
          toNumber(
            value.layout?.cards?.small,
            3
          ),

        medium:
          toNumber(
            value.layout?.cards?.medium,
            4
          ),

        large:
          toNumber(
            value.layout?.cards?.large,
            6
          ),

        full:
          toNumber(
            value.layout?.cards?.full,
            12
          ),
      },

      breakpoints: {
        ...DEFAULT_DASHBOARD.layout.breakpoints,

        ...toObject(
          value.layout?.breakpoints
        ),

        mobile:
          toNumber(
            value.layout?.breakpoints?.mobile,
            1
          ),

        tablet:
          toNumber(
            value.layout?.breakpoints?.tablet,
            6
          ),

        desktop:
          toNumber(
            value.layout?.breakpoints?.desktop,
            12
          ),
      },
    },

    widgets:
      toArray(
        value.widgets
      )
        .map(normalizeWidget)
        .sort(
          (a, b) =>
            a.order - b.order
        ),

    filters:
      toArray(
        value.filters
      ),

    is_default:
      toBoolean(
        value.is_default,
        false
      ),

    is_active:
      toBoolean(
        value.is_active,
        true
      ),

    sort_order:
      toNumber(
        value.sort_order
      ),

    meta:
      normalizeDashboardMeta(
        value.meta
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
  const value =
    toObject(
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
      toArray(
        value.roles
      ),

    primary_role:
      value.primary_role ??
      value.roles?.[0] ??
      null,
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
  const value =
    toObject(
      overview,
      DEFAULT_OVERVIEW
    );

  return {
    ...DEFAULT_OVERVIEW,

    properties:
      toNumber(
        value.properties
      ),

    apartments:
      toNumber(
        value.apartments
      ),

    units:
      toNumber(
        value.units
      ),

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
      toNumber(
        value.bookings
      ),

    rent_collected:
      toNumber(
        value.rent_collected
      ),

    outstanding_rent:
      toNumber(
        value.outstanding_rent
      ),

    expenses:
      toNumber(
        value.expenses
      ),

    net_income:
      toNumber(
        value.net_income
      ),

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
    toObject(
      properties
    );

  return {
    ...DEFAULT_PROPERTIES,

    total:
      toNumber(
        value.total
      ),

    active:
      toNumber(
        value.active
      ),

    inactive:
      toNumber(
        value.inactive
      ),

    featured:
      toNumber(
        value.featured
      ),

    verified:
      toNumber(
        value.verified
      ),

    verification_rate:
      toNumber(
        value.verification_rate
      ),
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
    toObject(
      apartments
    );

  return {
    ...DEFAULT_APARTMENTS,

    total:
      toNumber(
        value.total
      ),

    active:
      toNumber(
        value.active
      ),

    inactive:
      toNumber(
        value.inactive
      ),

    active_rate:
      toNumber(
        value.active_rate
      ),
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
    toObject(
      units
    );

  return {
    ...DEFAULT_UNITS,

    total:
      toNumber(
        value.total
      ),

    vacant:
      toNumber(
        value.vacant
      ),

    occupied:
      toNumber(
        value.occupied
      ),

    maintenance:
      toNumber(
        value.maintenance
      ),

    reserved:
      toNumber(
        value.reserved
      ),

    available:
      toNumber(
        value.available
      ),

    occupied_rate:
      toNumber(
        value.occupied_rate
      ),

    vacant_rate:
      toNumber(
        value.vacant_rate
      ),

    maintenance_rate:
      toNumber(
        value.maintenance_rate
      ),

    reserved_rate:
      toNumber(
        value.reserved_rate
      ),

    status_breakdown:
      normalizeStatusBreakdown(
        value.status_breakdown
      ),
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
    toObject(
      occupancy
    );

  return {
    ...DEFAULT_OCCUPANCY,

    total_units:
      toNumber(
        value.total_units
      ),

    occupied:
      toNumber(
        value.occupied
      ),

    vacant:
      toNumber(
        value.vacant
      ),

    maintenance:
      toNumber(
        value.maintenance
      ),

    reserved:
      toNumber(
        value.reserved
      ),

    rate:
      toNumber(
        value.rate
      ),

    available_rate:
      toNumber(
        value.available_rate
      ),

    status_breakdown:
      normalizeStatusBreakdown(
        value.status_breakdown
      ),
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
    toObject(
      tenancies
    );

  return {
    ...DEFAULT_TENANCIES,

    total:
      toNumber(
        value.total
      ),

    active:
      toNumber(
        value.active
      ),

    pending:
      toNumber(
        value.pending
      ),

    expired:
      toNumber(
        value.expired
      ),

    terminated:
      toNumber(
        value.terminated
      ),

    cancelled:
      toNumber(
        value.cancelled
      ),

    active_rate:
      toNumber(
        value.active_rate
      ),

    status_breakdown:
      normalizeStatusBreakdown(
        value.status_breakdown
      ),
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
    toObject(
      bookings
    );

  return {
    ...DEFAULT_BOOKINGS,

    total:
      toNumber(
        value.total
      ),

    pending:
      toNumber(
        value.pending
      ),

    confirmed:
      toNumber(
        value.confirmed
      ),

    completed:
      toNumber(
        value.completed
      ),

    cancelled:
      toNumber(
        value.cancelled
      ),

    pending_rate:
      toNumber(
        value.pending_rate
      ),

    confirmed_rate:
      toNumber(
        value.confirmed_rate
      ),

    completed_rate:
      toNumber(
        value.completed_rate
      ),

    cancelled_rate:
      toNumber(
        value.cancelled_rate
      ),

    status_breakdown:
      normalizeStatusBreakdown(
        value.status_breakdown
      ),
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
    toObject(
      financials
    );

  return {
    ...DEFAULT_FINANCIALS,

    rent_due:
      toNumber(
        value.rent_due
      ),

    rent_collected:
      toNumber(
        value.rent_collected
      ),

    outstanding:
      toNumber(
        value.outstanding
      ),

    expenses:
      toNumber(
        value.expenses
      ),

    net_income:
      toNumber(
        value.net_income
      ),

    collection_rate:
      toNumber(
        value.collection_rate
      ),

    expense_rate:
      toNumber(
        value.expense_rate
      ),

    net_margin:
      toNumber(
        value.net_margin
      ),
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
    toObject(
      maintenance
    );

  return {
    ...DEFAULT_MAINTENANCE,

    total:
      toNumber(
        value.total
      ),

    pending:
      toNumber(
        value.pending
      ),

    in_progress:
      toNumber(
        value.in_progress
      ),

    completed:
      toNumber(
        value.completed
      ),

    cancelled:
      toNumber(
        value.cancelled
      ),

    open:
      toNumber(
        value.open
      ),

    completion_rate:
      toNumber(
        value.completion_rate
      ),

    status_breakdown:
      normalizeStatusBreakdown(
        value.status_breakdown
      ),
  };
};

/*
|--------------------------------------------------------------------------
| NORMALIZE META
|--------------------------------------------------------------------------
*/

const normalizeMeta = (
  meta
) => {
  const value =
    toObject(
      meta
    );

  return {
    ...DEFAULT_META,

    generated_at:
      value.generated_at ??
      null,

    currency:
      value.currency ||
      DEFAULT_META.currency,

    timezone:
      value.timezone ||
      DEFAULT_META.timezone,

    has_properties:
      toBoolean(
        value.has_properties
      ),

    has_apartments:
      toBoolean(
        value.has_apartments
      ),

    has_units:
      toBoolean(
        value.has_units
      ),

    has_occupancy:
      toBoolean(
        value.has_occupancy
      ),

    has_tenancies:
      toBoolean(
        value.has_tenancies
      ),

    has_bookings:
      toBoolean(
        value.has_bookings
      ),

    has_financials:
      toBoolean(
        value.has_financials
      ),

    has_maintenance:
      toBoolean(
        value.has_maintenance
      ),

    has_activity:
      toBoolean(
        value.has_activity
      ),
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
  | Supported API structures
  |--------------------------------------------------------------------------
  |
  | Axios response:
  |
  | response.data.data
  |
  | Axios response already unwrapped:
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
      normalizeMeta(
        payload.meta
      ),

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
          | API Request
          |--------------------------------------------------------------------------
          */

          const response =
            refresh
              ? await refreshDashboardService(
                  nextParams
                )
              : await fetchDashboardService(
                  nextParams
                );

          /*
          |--------------------------------------------------------------------------
          | Normalize Response
          |--------------------------------------------------------------------------
          */

          const normalized =
            normalizeDashboardResponse(
              response
            );

          /*
          |--------------------------------------------------------------------------
          | Ignore Stale Request
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
          | Store Dashboard
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
          | Success Callback
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
          | Store Error
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
          | Reset Loading
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
    ).catch(() => {});

    // Intentionally fetch only on initial mount.
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
  |
  | API widgets are objects:
  |
  | {
  |   key: "properties",
  |   type: "stat",
  |   title: "Properties",
  |   enabled: true,
  |   order: 1
  | }
  |
  */

  const hasWidget =
    useCallback(
      (widgetKey) => {
        if (!widgetKey) {
          return false;
        }

        const widgets =
          dashboard
            ?.dashboard
            ?.widgets ?? [];

        return widgets.some(
          (widget) => {
            if (
              typeof widget ===
              "string"
            ) {
              return (
                widget ===
                widgetKey
              );
            }

            return (
              widget?.key ===
                widgetKey &&
              widget?.enabled !==
                false
            );
          }
        );
      },
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Get Widget
  |--------------------------------------------------------------------------
  */

  const getWidget =
    useCallback(
      (widgetKey) => {
        if (!widgetKey) {
          return null;
        }

        const widgets =
          dashboard
            ?.dashboard
            ?.widgets ?? [];

        return (
          widgets.find(
            (widget) => {
              if (
                typeof widget ===
                "string"
              ) {
                return (
                  widget ===
                  widgetKey
                );
              }

              return (
                widget?.key ===
                widgetKey
              );
            }
          ) ?? null
        );
      },
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Get Enabled Widgets
  |--------------------------------------------------------------------------
  */

  const enabledWidgets =
    useMemo(() => {
      return (
        dashboard
          ?.dashboard
          ?.widgets
          ?.filter(
            (widget) =>
              widget?.enabled !==
              false
          ) ?? []
      );
    }, [dashboard]);

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
  | Dashboard Layout
  |--------------------------------------------------------------------------
  */

  const layout =
    useMemo(
      () =>
        dashboardConfig?.layout ??
        DEFAULT_DASHBOARD.layout,
      [dashboardConfig]
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
  | Meta
  |--------------------------------------------------------------------------
  */

  const meta =
    useMemo(
      () =>
        dashboard?.meta ??
        DEFAULT_META,
      [dashboard]
    );

  /*
  |--------------------------------------------------------------------------
  | Currency
  |--------------------------------------------------------------------------
  */

  const currency =
    meta?.currency ??
    "KES";

  /*
  |--------------------------------------------------------------------------
  | Timezone
  |--------------------------------------------------------------------------
  */

  const timezone =
    meta?.timezone ??
    "Africa/Nairobi";

  /*
  |--------------------------------------------------------------------------
  | Primary Role
  |--------------------------------------------------------------------------
  */

  const primaryRole =
    user?.primary_role ??
    user?.roles?.[0] ??
    null;

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

    layout,

    enabledWidgets,

    getWidget,

    user,

    primaryRole,

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

    meta,

    currency,

    timezone,

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
      Boolean(
        dashboard
      ),

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