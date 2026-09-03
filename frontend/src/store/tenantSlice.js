import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import tenantService from "../services/tenant.service";

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/

const initialState = {
  /*
  |--------------------------------------------------------------------------
  | TENANTS
  |--------------------------------------------------------------------------
  */

  tenants: [],

  tenant: null,

  /*
  |--------------------------------------------------------------------------
  | AVAILABLE TENANT USERS
  |--------------------------------------------------------------------------
  |
  | Existing users who already have the `tenant` Spatie role.
  |
  | These users can be linked to a tenant profile through:
  |
  | tenant.user_id
  |
  | We do NOT create users here.
  |
  |--------------------------------------------------------------------------
  */

  availableTenantUsers: [],

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0,
  },

  /*
  |--------------------------------------------------------------------------
  | FILTERS
  |--------------------------------------------------------------------------
  */

  filters: {
    search: "",
    status: "",
    is_active: undefined,
    is_verified: undefined,
    gender: "",
    country: "",
    county: "",
    city: "",
    sort_by: "created_at",
    sort_direction: "desc",
    page: 1,
    per_page: 15,
  },

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  searchResults: [],

  /*
  |--------------------------------------------------------------------------
  | STATUS LISTS
  |--------------------------------------------------------------------------
  */

  activeTenants: [],
  pendingTenants: [],
  inactiveTenants: [],
  blacklistedTenants: [],

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  statistics: null,

  /*
  |--------------------------------------------------------------------------
  | LOADING STATES
  |--------------------------------------------------------------------------
  */

  loading: false,
  loadingTenant: false,

  creating: false,
  updating: false,
  deleting: false,
  searching: false,

  loadingActive: false,
  loadingPending: false,
  loadingInactive: false,
  loadingBlacklisted: false,
  loadingStatistics: false,

  /*
  |--------------------------------------------------------------------------
  | AVAILABLE TENANT USERS LOADING
  |--------------------------------------------------------------------------
  */

  loadingAvailableTenantUsers: false,

  actionLoading: false,

  /*
  |--------------------------------------------------------------------------
  | ERROR STATES
  |--------------------------------------------------------------------------
  */

  error: null,
  createError: null,
  updateError: null,
  deleteError: null,
  searchError: null,
  actionError: null,
  statisticsError: null,

  /*
  |--------------------------------------------------------------------------
  | AVAILABLE TENANT USERS ERROR
  |--------------------------------------------------------------------------
  */

  availableTenantUsersError: null,

  /*
  |--------------------------------------------------------------------------
  | SUCCESS
  |--------------------------------------------------------------------------
  */

  successMessage: null,
};


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Safely extract a tenant ID.
 *
 * Supports:
 *
 * 15
 * "15"
 *
 * {
 *   id: 15
 * }
 *
 * {
 *   tenant_id: 15
 * }
 *
 * {
 *   tenant: {
 *     id: 15
 *   }
 * }
 */
const getTenantId = (tenant) => {
  if (
    tenant === undefined ||
    tenant === null ||
    tenant === ""
  ) {
    return null;
  }

  if (
    typeof tenant === "object"
  ) {
    return (
      tenant?.id ??
      tenant?.tenant_id ??
      tenant?.tenant?.id ??
      null
    );
  }

  return tenant;
};


/**
 * Extract useful Laravel/Axios error message.
 */
const getErrorMessage = (error) => {
  if (!error) {
    return "Something went wrong.";
  }

  if (typeof error === "string") {
    return error;
  }

  const responseData =
    error?.response?.data;

  /*
   * Laravel:
   *
   * {
   *   message: "Validation failed."
   * }
   */
  if (responseData?.message) {
    return String(
      responseData.message
    );
  }

  /*
   * Laravel:
   *
   * {
   *   error: "Something went wrong."
   * }
   */
  if (responseData?.error) {
    return String(
      responseData.error
    );
  }

  /*
   * Laravel validation:
   *
   * errors: {
   *   email: [...]
   * }
   */
  if (
    responseData?.errors &&
    typeof responseData.errors === "object"
  ) {
    const errors =
      responseData.errors;

    const firstKey =
      Object.keys(errors)[0];

    if (firstKey) {
      const firstError =
        errors[firstKey];

      if (
        Array.isArray(firstError) &&
        firstError.length > 0
      ) {
        return String(
          firstError[0]
        );
      }

      if (
        typeof firstError === "string"
      ) {
        return firstError;
      }
    }
  }

  /*
   * Nested Laravel error.
   */
  if (
    responseData?.errors?.error
  ) {
    return String(
      responseData.errors.error
    );
  }

  /*
   * Nested data message.
   */
  if (
    responseData?.data?.message
  ) {
    return String(
      responseData.data.message
    );
  }

  /*
   * Nested data error.
   */
  if (
    responseData?.data?.error
  ) {
    return String(
      responseData.data.error
    );
  }

  /*
   * Normalized service error.
   */
  if (
    error?.message &&
    ![
      "Request failed with status code 400",
      "Request failed with status code 401",
      "Request failed with status code 403",
      "Request failed with status code 404",
      "Request failed with status code 409",
      "Request failed with status code 422",
      "Request failed with status code 500",
    ].includes(error.message)
  ) {
    return String(
      error.message
    );
  }

  return "Something went wrong.";
};


/*
|--------------------------------------------------------------------------
| RESPONSE NORMALIZERS
|--------------------------------------------------------------------------
*/

/**
 * Normalize paginated tenant response.
 */
const normalizeTenantListResponse = (
  response
) => {
  if (Array.isArray(response)) {
    return {
      data: response,
      pagination: null,
    };
  }

  const data =
    Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

  let pagination =
    response?.pagination ||
    response?.meta ||
    response?.data?.pagination ||
    response?.data?.meta ||
    null;

  /*
   * Some Laravel responses may expose
   * pagination directly.
   */
  if (
    !pagination &&
    response?.current_page !== undefined
  ) {
    pagination = {
      current_page:
        response.current_page,

      last_page:
        response.last_page,

      per_page:
        response.per_page,

      total:
        response.total,

      from:
        response.from,

      to:
        response.to,
    };
  }

  return {
    data,
    pagination,
  };
};


/**
 * Normalize array response.
 */
const normalizeTenantArrayResponse = (
  response
) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (
    Array.isArray(
      response?.data?.data
    )
  ) {
    return response.data.data;
  }

  return [];
};


/**
 * Normalize available tenant users.
 *
 * This supports both:
 *
 * [
 *   {
 *     id: 4,
 *     first_name: "Allan",
 *     last_name: "Nonda",
 *     name: "Allan Nonda",
 *     email: "...",
 *     phone: "..."
 *   }
 * ]
 *
 * and Laravel envelopes:
 *
 * {
 *   data: [...]
 * }
 *
 * {
 *   data: {
 *     data: [...]
 *   }
 * }
 */
const normalizeAvailableTenantUsers = (
  response
) => {
  let users = [];

  if (Array.isArray(response)) {
    users = response;
  } else if (
    Array.isArray(response?.data)
  ) {
    users = response.data;
  } else if (
    Array.isArray(
      response?.data?.data
    )
  ) {
    users = response.data.data;
  }

  const normalizedUsers =
    users
      .filter((user) => {
        if (
          !user ||
          typeof user !== "object"
        ) {
          return false;
        }

        return (
          user?.id !== undefined ||
          user?.user_id !== undefined
        );
      })
      .map((user) => {
        const id =
          user?.id ??
          user?.user_id ??
          null;

        const firstName =
          user?.first_name ??
          user?.firstName ??
          "";

        const lastName =
          user?.last_name ??
          user?.lastName ??
          "";

        const name =
          user?.name ??
          user?.full_name ??
          user?.fullName ??
          [
            firstName,
            lastName,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();

        return {
          ...user,

          /*
           * The ID used by the dropdown.
           */
          id,

          /*
           * The ID submitted to tenants.user_id.
           */
          user_id:
            user?.user_id ??
            id,

          first_name:
            String(
              firstName ?? ""
            ).trim(),

          last_name:
            String(
              lastName ?? ""
            ).trim(),

          name:
            String(
              name ||
              "Unnamed User"
            ).trim(),

          email:
            String(
              user?.email ?? ""
            ).trim(),

          phone:
            String(
              user?.phone ??
              user?.phone_number ??
              ""
            ).trim(),
        };
      });

  /*
   * Prevent duplicate users.
   *
   * The backend should already prevent this,
   * but keeping the frontend list unique protects
   * the dropdown from duplicate options.
   */
  const seen = new Set();

  return normalizedUsers.filter(
    (user) => {
      const key =
        String(
          user?.id ??
          user?.user_id ??
          ""
        );

      if (!key) {
        return false;
      }

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    }
  );
};


/**
 * Normalize a single tenant response.
 */
const normalizeTenantResponse = (
  response
) => {
  if (
    response === undefined ||
    response === null
  ) {
    return null;
  }

  /*
   * Direct tenant object.
   */
  if (
    response?.id !== undefined
  ) {
    return response;
  }

  /*
   * {
   *   data: tenant
   * }
   */
  if (
    response?.data?.id !== undefined
  ) {
    return response.data;
  }

  /*
   * {
   *   data: {
   *     data: tenant
   *   }
   * }
   */
  if (
    response?.data?.data?.id !== undefined
  ) {
    return response.data.data;
  }

  return null;
};


/**
 * Extract message from response.
 */
const getResponseMessage = (
  response,
  fallback
) => {
  return (
    response?.message ||
    response?.data?.message ||
    response?.data?.data?.message ||
    fallback
  );
};


/*
|--------------------------------------------------------------------------
| TENANT LIST HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Remove tenant from an array by ID.
 */
const removeTenantFromList = (
  list,
  tenantId
) => {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.filter(
    (item) =>
      String(item?.id) !==
      String(tenantId)
  );
};


/**
 * Replace or add tenant in an array.
 */
const updateTenantInList = (
  list,
  tenant
) => {
  if (!Array.isArray(list)) {
    return tenant
      ? [tenant]
      : [];
  }

  if (!tenant?.id) {
    return list;
  }

  const index =
    list.findIndex(
      (item) =>
        String(item?.id) ===
        String(tenant.id)
    );

  if (index === -1) {
    return [
      tenant,
      ...list,
    ];
  }

  const updated = [
    ...list,
  ];

  updated[index] =
    tenant;

  return updated;
};


/**
 * Remove tenant from all status lists.
 */
const removeTenantFromStatusLists = (
  state,
  tenantId
) => {
  state.activeTenants =
    removeTenantFromList(
      state.activeTenants,
      tenantId
    );

  state.pendingTenants =
    removeTenantFromList(
      state.pendingTenants,
      tenantId
    );

  state.inactiveTenants =
    removeTenantFromList(
      state.inactiveTenants,
      tenantId
    );

  state.blacklistedTenants =
    removeTenantFromList(
      state.blacklistedTenants,
      tenantId
    );
};


/**
 * Add tenant to correct status list.
 */
const syncTenantStatusLists = (
  state,
  tenant
) => {
  if (!tenant?.id) {
    return;
  }

  const tenantId =
    tenant.id;

  removeTenantFromStatusLists(
    state,
    tenantId
  );

  const status =
    String(
      tenant?.status || ""
    ).toLowerCase();

  if (status === "active") {
    state.activeTenants =
      updateTenantInList(
        state.activeTenants,
        tenant
      );

    return;
  }

  if (status === "pending") {
    state.pendingTenants =
      updateTenantInList(
        state.pendingTenants,
        tenant
      );

    return;
  }

  if (status === "inactive") {
    state.inactiveTenants =
      updateTenantInList(
        state.inactiveTenants,
        tenant
      );

    return;
  }

  if (status === "blacklisted") {
    state.blacklistedTenants =
      updateTenantInList(
        state.blacklistedTenants,
        tenant
      );
  }
};


/**
 * Update tenant everywhere.
 */
const syncTenantEverywhere = (
  state,
  tenant
) => {
  if (!tenant?.id) {
    return;
  }

  state.tenant =
    tenant;

  state.tenants =
    updateTenantInList(
      state.tenants,
      tenant
    );

  syncTenantStatusLists(
    state,
    tenant
  );
};


/**
 * Remove tenant everywhere.
 */
const removeTenantEverywhere = (
  state,
  tenantId
) => {
  if (!tenantId) {
    return;
  }

  state.tenants =
    removeTenantFromList(
      state.tenants,
      tenantId
    );

  removeTenantFromStatusLists(
    state,
    tenantId
  );

  state.searchResults =
    removeTenantFromList(
      state.searchResults,
      tenantId
    );

  if (
    state.tenant?.id &&
    String(state.tenant.id) ===
    String(tenantId)
  ) {
    state.tenant = null;
  }
};


/**
 * Keep pagination valid.
 */
const normalizePagination = (
  state
) => {
  const total =
    Number(
      state.pagination.total
    ) || 0;

  const perPage =
    Number(
      state.pagination.per_page
    ) || 15;

  const lastPage =
    Math.max(
      1,
      Math.ceil(
        total / perPage
      )
    );

  state.pagination.total =
    total;

  state.pagination.per_page =
    perPage;

  state.pagination.last_page =
    lastPage;

  if (
    state.pagination.current_page >
    lastPage
  ) {
    state.pagination.current_page =
      lastPage;
  }

  if (total === 0) {
    state.pagination.current_page = 1;
    state.pagination.last_page = 1;
    state.pagination.from = 0;
    state.pagination.to = 0;
  }
};


/*
|--------------------------------------------------------------------------
| ASYNC THUNKS
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| FETCH AVAILABLE TENANT USERS
|--------------------------------------------------------------------------
|
| Fetches existing users that already have
| the tenant Spatie role.
|
| GET /api/tenants/available-users
|
|--------------------------------------------------------------------------
*/

export const fetchAvailableTenantUsers =
  createAsyncThunk(
    "tenant/fetchAvailableTenantUsers",

    async (
      _,
      { rejectWithValue }
    ) => {
      try {
        console.log(
          "Redux: Fetching available tenant users..."
        );

        /*
         * tenant.service.js already unwraps and
         * normalizes the API response.
         */
        const users =
          await tenantService.getAvailableTenantUsers();

        const normalizedUsers =
          normalizeAvailableTenantUsers(
            users
          );

        console.log(
          "Redux: Available tenant users:",
          normalizedUsers
        );

        return normalizedUsers;
      } catch (error) {
        console.error(
          "Redux: Failed to fetch available tenant users:",
          error
        );

        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| FETCH TENANTS
|--------------------------------------------------------------------------
*/

export const fetchTenants =
  createAsyncThunk(
    "tenant/fetchTenants",

    async (
      params = {},
      { rejectWithValue }
    ) => {
      try {
        const response =
          await tenantService.getTenants(
            params
          );

        return normalizeTenantListResponse(
          response
        );
      } catch (error) {
        console.error(
          "Redux: Failed to fetch tenants:",
          error
        );

        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| FETCH SINGLE TENANT
|--------------------------------------------------------------------------
*/

export const fetchTenant =
  createAsyncThunk(
    "tenant/fetchTenant",

    async (
      tenantId,
      { rejectWithValue }
    ) => {
      try {
        const id =
          getTenantId(
            tenantId
          );

        if (!id) {
          return rejectWithValue(
            "Tenant ID is required."
          );
        }

        const response =
          await tenantService.getTenant(
            id
          );

        const tenant =
          normalizeTenantResponse(
            response
          );

        if (!tenant) {
          return rejectWithValue(
            "Tenant data was not found."
          );
        }

        return {
          data: tenant,

          message:
            getResponseMessage(
              response,
              null
            ),
        };
      } catch (error) {
        console.error(
          "Redux: Failed to fetch tenant:",
          error
        );

        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| CREATE TENANT
|--------------------------------------------------------------------------
*/

export const createTenant =
  createAsyncThunk(
    "tenant/createTenant",

    async (
      tenantData,
      { rejectWithValue }
    ) => {
      try {
        if (
          !tenantData ||
          typeof tenantData !==
          "object"
        ) {
          return rejectWithValue(
            "Tenant data is required."
          );
        }

        const response =
          await tenantService.createTenant(
            tenantData
          );

        const tenant =
          normalizeTenantResponse(
            response
          );

        return {
          data: tenant,

          message:
            getResponseMessage(
              response,
              "Tenant created successfully."
            ),
        };
      } catch (error) {
        console.error(
          "Redux: Failed to create tenant:",
          error
        );

        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| UPDATE TENANT
|--------------------------------------------------------------------------
*/

export const updateTenant =
  createAsyncThunk(
    "tenant/updateTenant",

    async (
      {
        tenantId,
        tenantData,
      } = {},
      { rejectWithValue }
    ) => {
      try {
        const id =
          getTenantId(
            tenantId
          );

        if (!id) {
          return rejectWithValue(
            "Tenant ID is required."
          );
        }

        if (
          !tenantData ||
          typeof tenantData !==
          "object"
        ) {
          return rejectWithValue(
            "Tenant data is required."
          );
        }

        const response =
          await tenantService.updateTenant(
            id,
            tenantData
          );

        const tenant =
          normalizeTenantResponse(
            response
          );

        return {
          data: tenant,

          message:
            getResponseMessage(
              response,
              "Tenant updated successfully."
            ),
        };
      } catch (error) {
        console.error(
          "Redux: Failed to update tenant:",
          error
        );

        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| DELETE TENANT
|--------------------------------------------------------------------------
*/

export const deleteTenant =
  createAsyncThunk(
    "tenant/deleteTenant",

    async (
      tenant,
      { rejectWithValue }
    ) => {
      try {
        const tenantId =
          getTenantId(
            tenant
          );

        if (!tenantId) {
          return rejectWithValue(
            "Tenant ID is required."
          );
        }

        const response =
          await tenantService.deleteTenant(
            tenantId
          );

        return {
          tenantId,

          message:
            getResponseMessage(
              response,
              "Tenant deleted successfully."
            ),
        };
      } catch (error) {
        console.error(
          "Redux: Failed to delete tenant:",
          error
        );

        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| SEARCH TENANTS
|--------------------------------------------------------------------------
*/

export const searchTenants =
  createAsyncThunk(
    "tenant/searchTenants",

    async (
      {
        search = "",
        limit = 20,
      } = {},
      { rejectWithValue }
    ) => {
      try {
        const response =
          await tenantService.searchTenants(
            search,
            limit
          );

        return normalizeTenantArrayResponse(
          response
        );
      } catch (error) {
        console.error(
          "Redux: Tenant search failed:",
          error
        );

        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| ACTIVE TENANTS
|--------------------------------------------------------------------------
*/

export const fetchActiveTenants =
  createAsyncThunk(
    "tenant/fetchActiveTenants",

    async (
      _,
      { rejectWithValue }
    ) => {
      try {
        const response =
          await tenantService.getActiveTenants();

        return normalizeTenantArrayResponse(
          response
        );
      } catch (error) {
        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| PENDING TENANTS
|--------------------------------------------------------------------------
*/

export const fetchPendingTenants =
  createAsyncThunk(
    "tenant/fetchPendingTenants",

    async (
      _,
      { rejectWithValue }
    ) => {
      try {
        const response =
          await tenantService.getPendingTenants();

        return normalizeTenantArrayResponse(
          response
        );
      } catch (error) {
        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| INACTIVE TENANTS
|--------------------------------------------------------------------------
*/

export const fetchInactiveTenants =
  createAsyncThunk(
    "tenant/fetchInactiveTenants",

    async (
      _,
      { rejectWithValue }
    ) => {
      try {
        const response =
          await tenantService.getInactiveTenants();

        return normalizeTenantArrayResponse(
          response
        );
      } catch (error) {
        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| BLACKLISTED TENANTS
|--------------------------------------------------------------------------
*/

export const fetchBlacklistedTenants =
  createAsyncThunk(
    "tenant/fetchBlacklistedTenants",

    async (
      _,
      { rejectWithValue }
    ) => {
      try {
        const response =
          await tenantService.getBlacklistedTenants();

        return normalizeTenantArrayResponse(
          response
        );
      } catch (error) {
        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| ACTIVATE TENANT
|--------------------------------------------------------------------------
*/

export const activateTenant =
  createAsyncThunk(
    "tenant/activateTenant",

    async (
      tenant,
      { rejectWithValue }
    ) => {
      try {
        const tenantId =
          getTenantId(
            tenant
          );

        if (!tenantId) {
          return rejectWithValue(
            "Tenant ID is required."
          );
        }

        const response =
          await tenantService.activateTenant(
            tenantId
          );

        return {
          tenantId,

          tenant:
            normalizeTenantResponse(
              response
            ),

          message:
            getResponseMessage(
              response,
              "Tenant activated successfully."
            ),
        };
      } catch (error) {
        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| DEACTIVATE TENANT
|--------------------------------------------------------------------------
*/

export const deactivateTenant =
  createAsyncThunk(
    "tenant/deactivateTenant",

    async (
      tenant,
      { rejectWithValue }
    ) => {
      try {
        const tenantId =
          getTenantId(
            tenant
          );

        if (!tenantId) {
          return rejectWithValue(
            "Tenant ID is required."
          );
        }

        const response =
          await tenantService.deactivateTenant(
            tenantId
          );

        return {
          tenantId,

          tenant:
            normalizeTenantResponse(
              response
            ),

          message:
            getResponseMessage(
              response,
              "Tenant deactivated successfully."
            ),
        };
      } catch (error) {
        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| BLACKLIST TENANT
|--------------------------------------------------------------------------
*/

export const blacklistTenant =
  createAsyncThunk(
    "tenant/blacklistTenant",

    async (
      tenant,
      { rejectWithValue }
    ) => {
      try {
        const tenantId =
          getTenantId(
            tenant
          );

        if (!tenantId) {
          return rejectWithValue(
            "Tenant ID is required."
          );
        }

        const response =
          await tenantService.blacklistTenant(
            tenantId
          );

        return {
          tenantId,

          tenant:
            normalizeTenantResponse(
              response
            ),

          message:
            getResponseMessage(
              response,
              "Tenant blacklisted successfully."
            ),
        };
      } catch (error) {
        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| SET TENANT PENDING
|--------------------------------------------------------------------------
*/

export const setTenantPending =
  createAsyncThunk(
    "tenant/setTenantPending",

    async (
      tenant,
      { rejectWithValue }
    ) => {
      try {
        const tenantId =
          getTenantId(
            tenant
          );

        if (!tenantId) {
          return rejectWithValue(
            "Tenant ID is required."
          );
        }

        const response =
          await tenantService.setTenantPending(
            tenantId
          );

        return {
          tenantId,

          tenant:
            normalizeTenantResponse(
              response
            ),

          message:
            getResponseMessage(
              response,
              "Tenant status changed to pending."
            ),
        };
      } catch (error) {
        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| VERIFY TENANT
|--------------------------------------------------------------------------
*/

export const verifyTenant =
  createAsyncThunk(
    "tenant/verifyTenant",

    async (
      tenant,
      { rejectWithValue }
    ) => {
      try {
        const tenantId =
          getTenantId(
            tenant
          );

        if (!tenantId) {
          return rejectWithValue(
            "Tenant ID is required."
          );
        }

        const response =
          await tenantService.verifyTenant(
            tenantId
          );

        return {
          tenantId,

          tenant:
            normalizeTenantResponse(
              response
            ),

          message:
            getResponseMessage(
              response,
              "Tenant verified successfully."
            ),
        };
      } catch (error) {
        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| UNVERIFY TENANT
|--------------------------------------------------------------------------
*/

export const unverifyTenant =
  createAsyncThunk(
    "tenant/unverifyTenant",

    async (
      tenant,
      { rejectWithValue }
    ) => {
      try {
        const tenantId =
          getTenantId(
            tenant
          );

        if (!tenantId) {
          return rejectWithValue(
            "Tenant ID is required."
          );
        }

        const response =
          await tenantService.unverifyTenant(
            tenantId
          );

        return {
          tenantId,

          tenant:
            normalizeTenantResponse(
              response
            ),

          message:
            getResponseMessage(
              response,
              "Tenant verification removed successfully."
            ),
        };
      } catch (error) {
        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| FETCH TENANT STATISTICS
|--------------------------------------------------------------------------
*/

export const fetchTenantStatistics =
  createAsyncThunk(
    "tenant/fetchTenantStatistics",

    async (
      _,
      { rejectWithValue }
    ) => {
      try {
        const response =
          await tenantService.getTenantStatistics();

        if (
          response?.data !== undefined &&
          response?.data !== null &&
          !Array.isArray(response?.data)
        ) {
          return response.data;
        }

        return response || null;
      } catch (error) {
        console.error(
          "Redux: Failed to fetch tenant statistics:",
          error
        );

        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| RESTORE TENANT
|--------------------------------------------------------------------------
*/

export const restoreTenant =
  createAsyncThunk(
    "tenant/restoreTenant",

    async (
      tenant,
      { rejectWithValue }
    ) => {
      try {
        const tenantId =
          getTenantId(
            tenant
          );

        if (!tenantId) {
          return rejectWithValue(
            "Tenant ID is required."
          );
        }

        const response =
          await tenantService.restoreTenant(
            tenantId
          );

        return {
          tenantId,

          tenant:
            normalizeTenantResponse(
              response
            ),

          message:
            getResponseMessage(
              response,
              "Tenant restored successfully."
            ),
        };
      } catch (error) {
        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| FORCE DELETE TENANT
|--------------------------------------------------------------------------
*/

export const forceDeleteTenant =
  createAsyncThunk(
    "tenant/forceDeleteTenant",

    async (
      tenant,
      { rejectWithValue }
    ) => {
      try {
        const tenantId =
          getTenantId(
            tenant
          );

        if (!tenantId) {
          return rejectWithValue(
            "Tenant ID is required."
          );
        }

        const response =
          await tenantService.forceDeleteTenant(
            tenantId
          );

        return {
          tenantId,

          message:
            getResponseMessage(
              response,
              "Tenant permanently deleted successfully."
            ),
        };
      } catch (error) {
        console.error(
          "Redux: Failed to permanently delete tenant:",
          error
        );

        return rejectWithValue(
          getErrorMessage(error)
        );
      }
    }
  );


/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/

const tenantSlice = createSlice({
  name: "tenant",

  initialState,

  reducers: {
    /*
    |--------------------------------------------------------------------------
    | SET TENANTS
    |--------------------------------------------------------------------------
    */

    setTenants: (
      state,
      action
    ) => {
      state.tenants =
        Array.isArray(
          action.payload
        )
          ? action.payload
          : [];
    },


    /*
    |--------------------------------------------------------------------------
    | SET TENANT
    |--------------------------------------------------------------------------
    */

    setTenant: (
      state,
      action
    ) => {
      state.tenant =
        action.payload || null;
    },


    /*
    |--------------------------------------------------------------------------
    | SET AVAILABLE TENANT USERS
    |--------------------------------------------------------------------------
    */

    setAvailableTenantUsers: (
      state,
      action
    ) => {
      state.availableTenantUsers =
        normalizeAvailableTenantUsers(
          action.payload
        );

      state.availableTenantUsersError =
        null;
    },


    /*
    |--------------------------------------------------------------------------
    | CLEAR AVAILABLE TENANT USERS
    |--------------------------------------------------------------------------
    */

    clearAvailableTenantUsers: (
      state
    ) => {
      state.availableTenantUsers = [];

      state.loadingAvailableTenantUsers =
        false;

      state.availableTenantUsersError =
        null;
    },


    /*
    |--------------------------------------------------------------------------
    | CLEAR TENANT
    |--------------------------------------------------------------------------
    */

    clearTenant: (
      state
    ) => {
      state.tenant = null;
    },


    /*
    |--------------------------------------------------------------------------
    | SET FILTERS
    |--------------------------------------------------------------------------
    */

    setTenantFilters: (
      state,
      action
    ) => {
      state.filters = {
        ...state.filters,
        ...(action.payload || {}),
        page: 1,
      };
    },


    /*
    |--------------------------------------------------------------------------
    | SET SEARCH
    |--------------------------------------------------------------------------
    */

    setTenantSearch: (
      state,
      action
    ) => {
      state.filters.search =
        action.payload || "";

      state.filters.page = 1;
    },


    /*
    |--------------------------------------------------------------------------
    | SET STATUS
    |--------------------------------------------------------------------------
    */

    setTenantStatus: (
      state,
      action
    ) => {
      state.filters.status =
        action.payload || "";

      state.filters.page = 1;
    },


    /*
    |--------------------------------------------------------------------------
    | SET PAGE
    |--------------------------------------------------------------------------
    */

    setTenantPage: (
      state,
      action
    ) => {
      const page =
        Number(
          action.payload
        ) || 1;

      state.filters.page =
        Math.max(
          1,
          page
        );
    },


    /*
    |--------------------------------------------------------------------------
    | SET PER PAGE
    |--------------------------------------------------------------------------
    */

    setTenantPerPage: (
      state,
      action
    ) => {
      const perPage =
        Number(
          action.payload
        ) || 15;

      state.filters.per_page =
        Math.max(
          1,
          perPage
        );

      state.pagination.per_page =
        Math.max(
          1,
          perPage
        );

      state.filters.page = 1;
    },


    /*
    |--------------------------------------------------------------------------
    | RESET FILTERS
    |--------------------------------------------------------------------------
    */

    resetTenantFilters: (
      state
    ) => {
      state.filters = {
        ...initialState.filters,
      };
    },


    /*
    |--------------------------------------------------------------------------
    | CLEAR SEARCH
    |--------------------------------------------------------------------------
    */

    clearTenantSearch: (
      state
    ) => {
      state.searchResults = [];
      state.searchError = null;
    },


    /*
    |--------------------------------------------------------------------------
    | CLEAR ERRORS
    |--------------------------------------------------------------------------
    */

    clearTenantError: (
      state
    ) => {
      state.error = null;
      state.createError = null;
      state.updateError = null;
      state.deleteError = null;
      state.searchError = null;
      state.actionError = null;
      state.statisticsError = null;
      state.availableTenantUsersError = null;
    },


    /*
    |--------------------------------------------------------------------------
    | CLEAR SUCCESS
    |--------------------------------------------------------------------------
    */

    clearTenantSuccess: (
      state
    ) => {
      state.successMessage = null;
    },


    /*
    |--------------------------------------------------------------------------
    | RESET STATE
    |--------------------------------------------------------------------------
    */

    resetTenantState: () => ({
      ...initialState,

      tenants: [],
      tenant: null,

      availableTenantUsers: [],

      pagination: {
        ...initialState.pagination,
      },

      filters: {
        ...initialState.filters,
      },

      searchResults: [],

      activeTenants: [],
      pendingTenants: [],
      inactiveTenants: [],
      blacklistedTenants: [],

      statistics: null,

      loadingAvailableTenantUsers: false,

      availableTenantUsersError: null,
    }),
  },


  /*
  |--------------------------------------------------------------------------
  | EXTRA REDUCERS
  |--------------------------------------------------------------------------
  */

  extraReducers: (
    builder
  ) => {

    /*
    |--------------------------------------------------------------------------
    | FETCH AVAILABLE TENANT USERS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchAvailableTenantUsers.pending,
        (
          state
        ) => {
          state.loadingAvailableTenantUsers =
            true;

          state.availableTenantUsersError =
            null;
        }
      )

      .addCase(
        fetchAvailableTenantUsers.fulfilled,
        (
          state,
          action
        ) => {
          state.loadingAvailableTenantUsers =
            false;

          /*
           * The thunk returns a clean array.
           */
          state.availableTenantUsers =
            Array.isArray(
              action.payload
            )
              ? action.payload
              : [];

          state.availableTenantUsersError =
            null;

          console.log(
            "Redux: Available tenant users stored:",
            state.availableTenantUsers
          );
        }
      )

      .addCase(
        fetchAvailableTenantUsers.rejected,
        (
          state,
          action
        ) => {
          state.loadingAvailableTenantUsers =
            false;

          state.availableTenantUsers = [];

          state.availableTenantUsersError =
            action.payload ||
            action.error?.message ||
            "Failed to fetch available tenant users.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | FETCH TENANTS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchTenants.pending,
        (
          state
        ) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        fetchTenants.fulfilled,
        (
          state,
          action
        ) => {
          state.loading = false;

          state.tenants =
            Array.isArray(
              action.payload?.data
            )
              ? action.payload.data
              : [];

          if (
            action.payload?.pagination
          ) {
            state.pagination = {
              ...state.pagination,
              ...action.payload.pagination,
            };
          }

          if (
            action.payload?.pagination
              ?.current_page !== undefined
          ) {
            state.filters.page =
              Number(
                action.payload.pagination.current_page
              ) || 1;
          }

          if (
            action.payload?.pagination
              ?.per_page !== undefined
          ) {
            state.filters.per_page =
              Number(
                action.payload.pagination.per_page
              ) || 15;
          }

          normalizePagination(
            state
          );

          state.error = null;
        }
      )

      .addCase(
        fetchTenants.rejected,
        (
          state,
          action
        ) => {
          state.loading = false;

          state.error =
            action.payload ||
            "Failed to fetch tenants.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | FETCH SINGLE TENANT
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchTenant.pending,
        (
          state
        ) => {
          state.loadingTenant = true;
          state.error = null;
        }
      )

      .addCase(
        fetchTenant.fulfilled,
        (
          state,
          action
        ) => {
          state.loadingTenant = false;

          const tenant =
            action.payload?.data;

          if (tenant) {
            syncTenantEverywhere(
              state,
              tenant
            );
          }

          state.error = null;
        }
      )

      .addCase(
        fetchTenant.rejected,
        (
          state,
          action
        ) => {
          state.loadingTenant = false;

          state.error =
            action.payload ||
            "Failed to fetch tenant.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | CREATE TENANT
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        createTenant.pending,
        (
          state
        ) => {
          state.creating = true;
          state.createError = null;
          state.successMessage = null;
        }
      )

      .addCase(
        createTenant.fulfilled,
        (
          state,
          action
        ) => {
          state.creating = false;

          const createdTenant =
            action.payload?.data;

          if (createdTenant) {
            state.tenant =
              createdTenant;

            state.tenants = [
              createdTenant,
              ...state.tenants.filter(
                (item) =>
                  String(item?.id) !==
                  String(createdTenant.id)
              ),
            ];

            syncTenantStatusLists(
              state,
              createdTenant
            );

            state.pagination.total =
              Number(
                state.pagination.total
              ) + 1;

            normalizePagination(
              state
            );

            /*
             * The selected user has now been
             * linked to a tenant profile.
             *
             * Remove that user from the
             * available-user list.
             */
            const createdUserId =
              createdTenant?.user_id ??
              createdTenant?.user?.id;

            if (
              createdUserId !==
              undefined &&
              createdUserId !== null
            ) {
              state.availableTenantUsers =
                state.availableTenantUsers.filter(
                  (user) =>
                    String(user?.id) !==
                    String(createdUserId) &&
                    String(user?.user_id) !==
                    String(createdUserId)
                );
            }
          }

          state.createError = null;

          state.successMessage =
            action.payload?.message ||
            "Tenant created successfully.";
        }
      )

      .addCase(
        createTenant.rejected,
        (
          state,
          action
        ) => {
          state.creating = false;

          state.createError =
            action.payload ||
            "Failed to create tenant.";

          state.successMessage = null;
        }
      );


    /*
    |--------------------------------------------------------------------------
    | UPDATE TENANT
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        updateTenant.pending,
        (
          state
        ) => {
          state.updating = true;
          state.updateError = null;
          state.successMessage = null;
        }
      )

      .addCase(
        updateTenant.fulfilled,
        (
          state,
          action
        ) => {
          state.updating = false;

          const updatedTenant =
            action.payload?.data;

          if (updatedTenant) {
            syncTenantEverywhere(
              state,
              updatedTenant
            );
          }

          state.updateError = null;

          state.successMessage =
            action.payload?.message ||
            "Tenant updated successfully.";
        }
      )

      .addCase(
        updateTenant.rejected,
        (
          state,
          action
        ) => {
          state.updating = false;

          state.updateError =
            action.payload ||
            "Failed to update tenant.";

          state.successMessage = null;
        }
      );


    /*
    |--------------------------------------------------------------------------
    | DELETE TENANT
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        deleteTenant.pending,
        (
          state
        ) => {
          state.deleting = true;
          state.deleteError = null;
          state.successMessage = null;
        }
      )

      .addCase(
        deleteTenant.fulfilled,
        (
          state,
          action
        ) => {
          state.deleting = false;

          const tenantId =
            action.payload?.tenantId;

          if (tenantId) {
            removeTenantEverywhere(
              state,
              tenantId
            );

            if (
              Number(
                state.pagination.total
              ) > 0
            ) {
              state.pagination.total -= 1;
            }

            normalizePagination(
              state
            );
          }

          state.deleteError = null;

          state.successMessage =
            action.payload?.message ||
            "Tenant deleted successfully.";
        }
      )

      .addCase(
        deleteTenant.rejected,
        (
          state,
          action
        ) => {
          state.deleting = false;

          state.deleteError =
            action.payload ||
            "Failed to delete tenant.";

          state.successMessage = null;
        }
      );


    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        searchTenants.pending,
        (
          state
        ) => {
          state.searching = true;
          state.searchError = null;
        }
      )

      .addCase(
        searchTenants.fulfilled,
        (
          state,
          action
        ) => {
          state.searching = false;

          state.searchResults =
            Array.isArray(
              action.payload
            )
              ? action.payload
              : [];

          state.searchError = null;
        }
      )

      .addCase(
        searchTenants.rejected,
        (
          state,
          action
        ) => {
          state.searching = false;

          state.searchError =
            action.payload ||
            "Failed to search tenants.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | ACTIVE TENANTS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchActiveTenants.pending,
        (
          state
        ) => {
          state.loadingActive = true;
        }
      )

      .addCase(
        fetchActiveTenants.fulfilled,
        (
          state,
          action
        ) => {
          state.loadingActive = false;

          state.activeTenants =
            Array.isArray(
              action.payload
            )
              ? action.payload
              : [];
        }
      )

      .addCase(
        fetchActiveTenants.rejected,
        (
          state,
          action
        ) => {
          state.loadingActive = false;

          state.error =
            action.payload ||
            "Failed to fetch active tenants.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | PENDING TENANTS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchPendingTenants.pending,
        (
          state
        ) => {
          state.loadingPending = true;
        }
      )

      .addCase(
        fetchPendingTenants.fulfilled,
        (
          state,
          action
        ) => {
          state.loadingPending = false;

          state.pendingTenants =
            Array.isArray(
              action.payload
            )
              ? action.payload
              : [];
        }
      )

      .addCase(
        fetchPendingTenants.rejected,
        (
          state,
          action
        ) => {
          state.loadingPending = false;

          state.error =
            action.payload ||
            "Failed to fetch pending tenants.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | INACTIVE TENANTS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchInactiveTenants.pending,
        (
          state
        ) => {
          state.loadingInactive = true;
        }
      )

      .addCase(
        fetchInactiveTenants.fulfilled,
        (
          state,
          action
        ) => {
          state.loadingInactive = false;

          state.inactiveTenants =
            Array.isArray(
              action.payload
            )
              ? action.payload
              : [];
        }
      )

      .addCase(
        fetchInactiveTenants.rejected,
        (
          state,
          action
        ) => {
          state.loadingInactive = false;

          state.error =
            action.payload ||
            "Failed to fetch inactive tenants.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | BLACKLISTED TENANTS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchBlacklistedTenants.pending,
        (
          state
        ) => {
          state.loadingBlacklisted = true;
        }
      )

      .addCase(
        fetchBlacklistedTenants.fulfilled,
        (
          state,
          action
        ) => {
          state.loadingBlacklisted = false;

          state.blacklistedTenants =
            Array.isArray(
              action.payload
            )
              ? action.payload
              : [];
        }
      )

      .addCase(
        fetchBlacklistedTenants.rejected,
        (
          state,
          action
        ) => {
          state.loadingBlacklisted = false;

          state.error =
            action.payload ||
            "Failed to fetch blacklisted tenants.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | COMMON TENANT ACTION HANDLER
    |--------------------------------------------------------------------------
    */

    const handleTenantAction = (
      state,
      action,
      defaultMessage
    ) => {
      state.actionLoading = false;

      const updatedTenant =
        action.payload?.tenant;

      if (updatedTenant) {
        syncTenantEverywhere(
          state,
          updatedTenant
        );
      }

      state.actionError = null;

      state.successMessage =
        action.payload?.message ||
        defaultMessage;
    };


    /*
    |--------------------------------------------------------------------------
    | ACTIVATE
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        activateTenant.pending,
        (
          state
        ) => {
          state.actionLoading = true;
          state.actionError = null;
          state.successMessage = null;
        }
      )

      .addCase(
        activateTenant.fulfilled,
        (
          state,
          action
        ) => {
          handleTenantAction(
            state,
            action,
            "Tenant activated successfully."
          );
        }
      )

      .addCase(
        activateTenant.rejected,
        (
          state,
          action
        ) => {
          state.actionLoading = false;

          state.actionError =
            action.payload ||
            "Failed to activate tenant.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        deactivateTenant.pending,
        (
          state
        ) => {
          state.actionLoading = true;
          state.actionError = null;
          state.successMessage = null;
        }
      )

      .addCase(
        deactivateTenant.fulfilled,
        (
          state,
          action
        ) => {
          handleTenantAction(
            state,
            action,
            "Tenant deactivated successfully."
          );
        }
      )

      .addCase(
        deactivateTenant.rejected,
        (
          state,
          action
        ) => {
          state.actionLoading = false;

          state.actionError =
            action.payload ||
            "Failed to deactivate tenant.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | BLACKLIST
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        blacklistTenant.pending,
        (
          state
        ) => {
          state.actionLoading = true;
          state.actionError = null;
          state.successMessage = null;
        }
      )

      .addCase(
        blacklistTenant.fulfilled,
        (
          state,
          action
        ) => {
          handleTenantAction(
            state,
            action,
            "Tenant blacklisted successfully."
          );
        }
      )

      .addCase(
        blacklistTenant.rejected,
        (
          state,
          action
        ) => {
          state.actionLoading = false;

          state.actionError =
            action.payload ||
            "Failed to blacklist tenant.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | PENDING
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        setTenantPending.pending,
        (
          state
        ) => {
          state.actionLoading = true;
          state.actionError = null;
          state.successMessage = null;
        }
      )

      .addCase(
        setTenantPending.fulfilled,
        (
          state,
          action
        ) => {
          handleTenantAction(
            state,
            action,
            "Tenant status changed to pending."
          );
        }
      )

      .addCase(
        setTenantPending.rejected,
        (
          state,
          action
        ) => {
          state.actionLoading = false;

          state.actionError =
            action.payload ||
            "Failed to update tenant status.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | VERIFY
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        verifyTenant.pending,
        (
          state
        ) => {
          state.actionLoading = true;
          state.actionError = null;
          state.successMessage = null;
        }
      )

      .addCase(
        verifyTenant.fulfilled,
        (
          state,
          action
        ) => {
          handleTenantAction(
            state,
            action,
            "Tenant verified successfully."
          );
        }
      )

      .addCase(
        verifyTenant.rejected,
        (
          state,
          action
        ) => {
          state.actionLoading = false;

          state.actionError =
            action.payload ||
            "Failed to verify tenant.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | UNVERIFY
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        unverifyTenant.pending,
        (
          state
        ) => {
          state.actionLoading = true;
          state.actionError = null;
          state.successMessage = null;
        }
      )

      .addCase(
        unverifyTenant.fulfilled,
        (
          state,
          action
        ) => {
          handleTenantAction(
            state,
            action,
            "Tenant verification removed successfully."
          );
        }
      )

      .addCase(
        unverifyTenant.rejected,
        (
          state,
          action
        ) => {
          state.actionLoading = false;

          state.actionError =
            action.payload ||
            "Failed to remove tenant verification.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchTenantStatistics.pending,
        (
          state
        ) => {
          state.loadingStatistics = true;
          state.statisticsError = null;
        }
      )

      .addCase(
        fetchTenantStatistics.fulfilled,
        (
          state,
          action
        ) => {
          state.loadingStatistics = false;

          state.statistics =
            action.payload || null;

          state.statisticsError = null;
        }
      )

      .addCase(
        fetchTenantStatistics.rejected,
        (
          state,
          action
        ) => {
          state.loadingStatistics = false;

          state.statisticsError =
            action.payload ||
            "Failed to fetch tenant statistics.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | RESTORE
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        restoreTenant.pending,
        (
          state
        ) => {
          state.actionLoading = true;
          state.actionError = null;
          state.successMessage = null;
        }
      )

      .addCase(
        restoreTenant.fulfilled,
        (
          state,
          action
        ) => {
          state.actionLoading = false;

          const restoredTenant =
            action.payload?.tenant;

          if (restoredTenant) {
            const exists =
              state.tenants.some(
                (item) =>
                  String(item?.id) ===
                  String(
                    restoredTenant.id
                  )
              );

            state.tenant =
              restoredTenant;

            if (exists) {
              state.tenants =
                updateTenantInList(
                  state.tenants,
                  restoredTenant
                );
            } else {
              state.tenants = [
                restoredTenant,
                ...state.tenants,
              ];

              state.pagination.total =
                Number(
                  state.pagination.total
                ) + 1;
            }

            syncTenantStatusLists(
              state,
              restoredTenant
            );

            normalizePagination(
              state
            );
          }

          state.actionError = null;

          state.successMessage =
            action.payload?.message ||
            "Tenant restored successfully.";
        }
      )

      .addCase(
        restoreTenant.rejected,
        (
          state,
          action
        ) => {
          state.actionLoading = false;

          state.actionError =
            action.payload ||
            "Failed to restore tenant.";
        }
      );


    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        forceDeleteTenant.pending,
        (
          state
        ) => {
          state.deleting = true;
          state.deleteError = null;
          state.successMessage = null;
        }
      )

      .addCase(
        forceDeleteTenant.fulfilled,
        (
          state,
          action
        ) => {
          state.deleting = false;

          const tenantId =
            action.payload?.tenantId;

          if (tenantId) {
            removeTenantEverywhere(
              state,
              tenantId
            );

            if (
              Number(
                state.pagination.total
              ) > 0
            ) {
              state.pagination.total -= 1;
            }

            normalizePagination(
              state
            );
          }

          state.deleteError = null;

          state.successMessage =
            action.payload?.message ||
            "Tenant permanently deleted successfully.";
        }
      )

      .addCase(
        forceDeleteTenant.rejected,
        (
          state,
          action
        ) => {
          state.deleting = false;

          state.deleteError =
            action.payload ||
            "Failed to permanently delete tenant.";
        }
      );
  },
});


/*
|--------------------------------------------------------------------------
| ACTIONS
|--------------------------------------------------------------------------
*/

export const {
  setTenants,
  setTenant,

  setAvailableTenantUsers,
  clearAvailableTenantUsers,

  clearTenant,

  setTenantFilters,
  setTenantSearch,
  setTenantStatus,
  setTenantPage,
  setTenantPerPage,

  resetTenantFilters,

  clearTenantSearch,
  clearTenantError,
  clearTenantSuccess,

  resetTenantState,
} = tenantSlice.actions;


/*
|--------------------------------------------------------------------------
| ROOT STATE HELPER
|--------------------------------------------------------------------------
|
| Supports:
|
| state.tenant
|
| and legacy:
|
| state.tenants
|
|--------------------------------------------------------------------------
*/

const getTenantState = (
  state
) => {
  return (
    state?.tenant ||
    state?.tenants ||
    initialState
  );
};


/*
|--------------------------------------------------------------------------
| DATA SELECTORS
|--------------------------------------------------------------------------
*/

/**
 * All tenants.
 */
export const selectTenants = (
  state
) =>
  getTenantState(state).tenants ||
  [];


/**
 * Single tenant.
 */
export const selectTenant = (
  state
) =>
  getTenantState(state).tenant ||
  null;


/**
 * Available existing tenant users.
 */
export const selectAvailableTenantUsers = (
  state
) => {
  const users =
    getTenantState(state)
      .availableTenantUsers;

  return Array.isArray(users)
    ? users
    : [];
};


/**
 * Tenant pagination.
 */
export const selectTenantPagination = (
  state
) =>
  getTenantState(state).pagination ||
  initialState.pagination;


/**
 * Tenant filters.
 */
export const selectTenantFilters = (
  state
) =>
  getTenantState(state).filters ||
  initialState.filters;


/**
 * Tenant statistics.
 */
export const selectTenantStatistics = (
  state
) =>
  getTenantState(state).statistics ||
  null;


/**
 * Search results.
 */
export const selectTenantSearchResults = (
  state
) =>
  getTenantState(state).searchResults ||
  [];


/**
 * Active tenants.
 */
export const selectActiveTenants = (
  state
) =>
  getTenantState(state).activeTenants ||
  [];


/**
 * Pending tenants.
 */
export const selectPendingTenants = (
  state
) =>
  getTenantState(state).pendingTenants ||
  [];


/**
 * Inactive tenants.
 */
export const selectInactiveTenants = (
  state
) =>
  getTenantState(state).inactiveTenants ||
  [];


/**
 * Blacklisted tenants.
 */
export const selectBlacklistedTenants = (
  state
) =>
  getTenantState(state).blacklistedTenants ||
  [];


/*
|--------------------------------------------------------------------------
| LOADING SELECTORS
|--------------------------------------------------------------------------
*/

export const selectTenantLoading = (
  state
) =>
  Boolean(
    getTenantState(state).loading
  );


export const selectTenantLoadingTenant = (
  state
) =>
  Boolean(
    getTenantState(state).loadingTenant
  );


export const selectTenantCreating = (
  state
) =>
  Boolean(
    getTenantState(state).creating
  );


export const selectTenantUpdating = (
  state
) =>
  Boolean(
    getTenantState(state).updating
  );


export const selectTenantDeleting = (
  state
) =>
  Boolean(
    getTenantState(state).deleting
  );


export const selectTenantSearching = (
  state
) =>
  Boolean(
    getTenantState(state).searching
  );


/*
|--------------------------------------------------------------------------
| AVAILABLE TENANT USERS LOADING
|--------------------------------------------------------------------------
|
| Both selector names are intentionally exported
| for compatibility with existing components/hooks.
|--------------------------------------------------------------------------
*/

export const selectLoadingAvailableTenantUsers = (
  state
) =>
  Boolean(
    getTenantState(state)
      .loadingAvailableTenantUsers
  );


export const selectTenantLoadingAvailableUsers = (
  state
) =>
  Boolean(
    getTenantState(state)
      .loadingAvailableTenantUsers
  );


export const selectTenantActionLoading = (
  state
) =>
  Boolean(
    getTenantState(state).actionLoading
  );


export const selectTenantLoadingActive = (
  state
) =>
  Boolean(
    getTenantState(state).loadingActive
  );


export const selectTenantLoadingPending = (
  state
) =>
  Boolean(
    getTenantState(state).loadingPending
  );


export const selectTenantLoadingInactive = (
  state
) =>
  Boolean(
    getTenantState(state).loadingInactive
  );


export const selectTenantLoadingBlacklisted = (
  state
) =>
  Boolean(
    getTenantState(state).loadingBlacklisted
  );


export const selectTenantLoadingStatistics = (
  state
) =>
  Boolean(
    getTenantState(state).loadingStatistics
  );


/*
|--------------------------------------------------------------------------
| ERROR SELECTORS
|--------------------------------------------------------------------------
*/

export const selectTenantError = (
  state
) =>
  getTenantState(state).error ||
  null;


export const selectTenantCreateError = (
  state
) =>
  getTenantState(state).createError ||
  null;


export const selectTenantUpdateError = (
  state
) =>
  getTenantState(state).updateError ||
  null;


export const selectTenantDeleteError = (
  state
) =>
  getTenantState(state).deleteError ||
  null;


export const selectTenantSearchError = (
  state
) =>
  getTenantState(state).searchError ||
  null;


export const selectTenantActionError = (
  state
) =>
  getTenantState(state).actionError ||
  null;


export const selectTenantStatisticsError = (
  state
) =>
  getTenantState(state).statisticsError ||
  null;


/**
 * Available tenant users error.
 */
export const selectAvailableTenantUsersError = (
  state
) =>
  getTenantState(state)
    .availableTenantUsersError ||
  null;


/*
|--------------------------------------------------------------------------
| SUCCESS SELECTOR
|--------------------------------------------------------------------------
*/

export const selectTenantSuccessMessage = (
  state
) =>
  getTenantState(state).successMessage ||
  null;


/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

export default tenantSlice.reducer;

