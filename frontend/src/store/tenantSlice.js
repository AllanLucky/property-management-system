import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
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
  | SUCCESS MESSAGE
  |--------------------------------------------------------------------------
  */

  successMessage: null,
};

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const getErrorMessage = (error) => {
  return (
    error?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    "Something went wrong."
  );
};

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Normalize Laravel API collection responses.
 *
 * Supports:
 *
 * {
 *   data: [],
 *   pagination: {}
 * }
 *
 * and Laravel paginator:
 *
 * {
 *   data: [],
 *   current_page: 1,
 *   last_page: 10,
 *   per_page: 15,
 *   total: 100
 * }
 */
const normalizeTenantListResponse = (response) => {
  const data = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response)
      ? response
      : [];

  const pagination =
    response?.pagination ||
    response?.meta ||
    (response?.current_page !== undefined
      ? {
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
        from: response.from,
        to: response.to,
      }
      : null);

  return {
    data,
    pagination,
  };
};

/**
 * Normalize simple tenant lists.
 */
const normalizeTenantArrayResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

/**
 * Normalize a single tenant response.
 */
const normalizeTenantResponse = (response) => {
  if (response?.data) {
    return response.data;
  }

  return response || null;
};

/*
|--------------------------------------------------------------------------
| ASYNC THUNKS
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| FETCH TENANTS
|--------------------------------------------------------------------------
*/

export const fetchTenants = createAsyncThunk(
  "tenant/fetchTenants",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await tenantService.getTenants(params);

      return normalizeTenantListResponse(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH SINGLE TENANT
|--------------------------------------------------------------------------
*/

export const fetchTenant = createAsyncThunk(
  "tenant/fetchTenant",
  async (tenantId, { rejectWithValue }) => {
    try {
      const response = await tenantService.getTenant(tenantId);

      return {
        data: normalizeTenantResponse(response),
        message: response?.message,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE TENANT
|--------------------------------------------------------------------------
*/

export const createTenant = createAsyncThunk(
  "tenant/createTenant",
  async (tenantData, { rejectWithValue }) => {
    try {
      const response =
        await tenantService.createTenant(tenantData);

      return {
        ...response,
        data: normalizeTenantResponse(response),
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE TENANT
|--------------------------------------------------------------------------
*/

export const updateTenant = createAsyncThunk(
  "tenant/updateTenant",
  async (
    { tenantId, tenantData },
    { rejectWithValue }
  ) => {
    try {
      const response =
        await tenantService.updateTenant(
          tenantId,
          tenantData
        );

      return {
        ...response,
        data: normalizeTenantResponse(response),
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE TENANT
|--------------------------------------------------------------------------
*/

export const deleteTenant = createAsyncThunk(
  "tenant/deleteTenant",
  async (tenantId, { rejectWithValue }) => {
    try {
      const response =
        await tenantService.deleteTenant(tenantId);

      return {
        tenantId,
        ...response,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| SEARCH TENANTS
|--------------------------------------------------------------------------
*/

export const searchTenants = createAsyncThunk(
  "tenant/searchTenants",
  async (
    { search, limit = 20 },
    { rejectWithValue }
  ) => {
    try {
      const response =
        await tenantService.searchTenants(
          search,
          limit
        );

      return normalizeTenantArrayResponse(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH ACTIVE TENANTS
|--------------------------------------------------------------------------
*/

export const fetchActiveTenants = createAsyncThunk(
  "tenant/fetchActiveTenants",
  async (_, { rejectWithValue }) => {
    try {
      const response =
        await tenantService.getActiveTenants();

      return normalizeTenantArrayResponse(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH PENDING TENANTS
|--------------------------------------------------------------------------
*/

export const fetchPendingTenants = createAsyncThunk(
  "tenant/fetchPendingTenants",
  async (_, { rejectWithValue }) => {
    try {
      const response =
        await tenantService.getPendingTenants();

      return normalizeTenantArrayResponse(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH INACTIVE TENANTS
|--------------------------------------------------------------------------
*/

export const fetchInactiveTenants = createAsyncThunk(
  "tenant/fetchInactiveTenants",
  async (_, { rejectWithValue }) => {
    try {
      const response =
        await tenantService.getInactiveTenants();

      return normalizeTenantArrayResponse(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH BLACKLISTED TENANTS
|--------------------------------------------------------------------------
*/

export const fetchBlacklistedTenants = createAsyncThunk(
  "tenant/fetchBlacklistedTenants",
  async (_, { rejectWithValue }) => {
    try {
      const response =
        await tenantService.getBlacklistedTenants();

      return normalizeTenantArrayResponse(response);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| ACTIVATE TENANT
|--------------------------------------------------------------------------
*/

export const activateTenant = createAsyncThunk(
  "tenant/activateTenant",
  async (tenantId, { rejectWithValue }) => {
    try {
      const response =
        await tenantService.activateTenant(tenantId);

      return {
        tenantId,
        tenant: normalizeTenantResponse(response),
        message: response?.message,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| DEACTIVATE TENANT
|--------------------------------------------------------------------------
*/

export const deactivateTenant = createAsyncThunk(
  "tenant/deactivateTenant",
  async (tenantId, { rejectWithValue }) => {
    try {
      const response =
        await tenantService.deactivateTenant(tenantId);

      return {
        tenantId,
        tenant: normalizeTenantResponse(response),
        message: response?.message,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| BLACKLIST TENANT
|--------------------------------------------------------------------------
*/

export const blacklistTenant = createAsyncThunk(
  "tenant/blacklistTenant",
  async (tenantId, { rejectWithValue }) => {
    try {
      const response =
        await tenantService.blacklistTenant(tenantId);

      return {
        tenantId,
        tenant: normalizeTenantResponse(response),
        message: response?.message,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| SET TENANT PENDING
|--------------------------------------------------------------------------
*/

export const setTenantPending = createAsyncThunk(
  "tenant/setTenantPending",
  async (tenantId, { rejectWithValue }) => {
    try {
      const response =
        await tenantService.setTenantPending(tenantId);

      return {
        tenantId,
        tenant: normalizeTenantResponse(response),
        message: response?.message,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| VERIFY TENANT
|--------------------------------------------------------------------------
*/

export const verifyTenant = createAsyncThunk(
  "tenant/verifyTenant",
  async (tenantId, { rejectWithValue }) => {
    try {
      const response =
        await tenantService.verifyTenant(tenantId);

      return {
        tenantId,
        tenant: normalizeTenantResponse(response),
        message: response?.message,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| UNVERIFY TENANT
|--------------------------------------------------------------------------
*/

export const unverifyTenant = createAsyncThunk(
  "tenant/unverifyTenant",
  async (tenantId, { rejectWithValue }) => {
    try {
      const response =
        await tenantService.unverifyTenant(tenantId);

      return {
        tenantId,
        tenant: normalizeTenantResponse(response),
        message: response?.message,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH STATISTICS
|--------------------------------------------------------------------------
*/

export const fetchTenantStatistics = createAsyncThunk(
  "tenant/fetchTenantStatistics",
  async (_, { rejectWithValue }) => {
    try {
      const response =
        await tenantService.getTenantStatistics();

      return response?.data ?? response ?? null;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| RESTORE TENANT
|--------------------------------------------------------------------------
*/

export const restoreTenant = createAsyncThunk(
  "tenant/restoreTenant",
  async (tenantId, { rejectWithValue }) => {
    try {
      const response =
        await tenantService.restoreTenant(tenantId);

      return {
        tenantId,
        tenant: normalizeTenantResponse(response),
        message: response?.message,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| FORCE DELETE TENANT
|--------------------------------------------------------------------------
*/

export const forceDeleteTenant = createAsyncThunk(
  "tenant/forceDeleteTenant",
  async (tenantId, { rejectWithValue }) => {
    try {
      const response =
        await tenantService.forceDeleteTenant(tenantId);

      return {
        tenantId,
        ...response,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
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

    setTenants: (state, action) => {
      state.tenants = Array.isArray(action.payload)
        ? action.payload
        : [];
    },

    /*
    |--------------------------------------------------------------------------
    | SET SINGLE TENANT
    |--------------------------------------------------------------------------
    */

    setTenant: (state, action) => {
      state.tenant = action.payload || null;
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR TENANT
    |--------------------------------------------------------------------------
    */

    clearTenant: (state) => {
      state.tenant = null;
    },

    /*
    |--------------------------------------------------------------------------
    | SET FILTERS
    |--------------------------------------------------------------------------
    */

    setTenantFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...(action.payload || {}),
      };
    },

    /*
    |--------------------------------------------------------------------------
    | SET SEARCH
    |--------------------------------------------------------------------------
    */

    setTenantSearch: (state, action) => {
      state.filters.search = action.payload || "";
      state.filters.page = 1;
    },

    /*
    |--------------------------------------------------------------------------
    | SET STATUS
    |--------------------------------------------------------------------------
    */

    setTenantStatus: (state, action) => {
      state.filters.status = action.payload || "";
      state.filters.page = 1;
    },

    /*
    |--------------------------------------------------------------------------
    | SET PAGE
    |--------------------------------------------------------------------------
    */

    setTenantPage: (state, action) => {
      state.filters.page = action.payload || 1;
    },

    /*
    |--------------------------------------------------------------------------
    | SET PER PAGE
    |--------------------------------------------------------------------------
    */

    setTenantPerPage: (state, action) => {
      state.filters.per_page = action.payload || 15;
      state.filters.page = 1;
    },

    /*
    |--------------------------------------------------------------------------
    | RESET FILTERS
    |--------------------------------------------------------------------------
    */

    resetTenantFilters: (state) => {
      state.filters = {
        ...initialState.filters,
      };
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR SEARCH RESULTS
    |--------------------------------------------------------------------------
    */

    clearTenantSearch: (state) => {
      state.searchResults = [];
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR ERRORS
    |--------------------------------------------------------------------------
    */

    clearTenantError: (state) => {
      state.error = null;
      state.createError = null;
      state.updateError = null;
      state.deleteError = null;
      state.searchError = null;
      state.actionError = null;
      state.statisticsError = null;
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR SUCCESS
    |--------------------------------------------------------------------------
    */

    clearTenantSuccess: (state) => {
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
    }),
  },

  /*
  |--------------------------------------------------------------------------
  | EXTRA REDUCERS
  |--------------------------------------------------------------------------
  */

  extraReducers: (builder) => {
    /*
    |--------------------------------------------------------------------------
    | FETCH TENANTS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchTenants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.loading = false;

        state.tenants = Array.isArray(action.payload?.data)
          ? action.payload.data
          : [];

        if (action.payload?.pagination) {
          state.pagination = {
            ...state.pagination,
            ...action.payload.pagination,
          };
        }

        state.error = null;
      })

      .addCase(fetchTenants.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload ||
          "Failed to fetch tenants.";
      });

    /*
    |--------------------------------------------------------------------------
    | FETCH SINGLE TENANT
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchTenant.pending, (state) => {
        state.loadingTenant = true;
        state.error = null;
      })

      .addCase(fetchTenant.fulfilled, (state, action) => {
        state.loadingTenant = false;

        state.tenant =
          action.payload?.data || null;

        state.error = null;
      })

      .addCase(fetchTenant.rejected, (state, action) => {
        state.loadingTenant = false;

        state.error =
          action.payload ||
          "Failed to fetch tenant.";
      });

    /*
    |--------------------------------------------------------------------------
    | CREATE TENANT
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(createTenant.pending, (state) => {
        state.creating = true;
        state.createError = null;
        state.successMessage = null;
      })

      .addCase(createTenant.fulfilled, (state, action) => {
        state.creating = false;

        const createdTenant =
          action.payload?.data;

        if (createdTenant) {
          state.tenant = createdTenant;

          state.tenants.unshift(createdTenant);

          state.pagination.total += 1;
        }

        state.createError = null;

        state.successMessage =
          action.payload?.message ||
          "Tenant created successfully.";
      })

      .addCase(createTenant.rejected, (state, action) => {
        state.creating = false;

        state.createError =
          action.payload ||
          "Failed to create tenant.";
      });

    /*
    |--------------------------------------------------------------------------
    | UPDATE TENANT
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(updateTenant.pending, (state) => {
        state.updating = true;
        state.updateError = null;
        state.successMessage = null;
      })

      .addCase(updateTenant.fulfilled, (state, action) => {
        state.updating = false;

        const updatedTenant =
          action.payload?.data;

        if (updatedTenant) {
          state.tenant = updatedTenant;

          const index =
            state.tenants.findIndex(
              (item) =>
                item.id === updatedTenant.id
            );

          if (index !== -1) {
            state.tenants[index] = updatedTenant;
          }
        }

        state.updateError = null;

        state.successMessage =
          action.payload?.message ||
          "Tenant updated successfully.";
      })

      .addCase(updateTenant.rejected, (state, action) => {
        state.updating = false;

        state.updateError =
          action.payload ||
          "Failed to update tenant.";
      });

    /*
    |--------------------------------------------------------------------------
    | DELETE TENANT
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(deleteTenant.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
        state.successMessage = null;
      })

      .addCase(deleteTenant.fulfilled, (state, action) => {
        state.deleting = false;

        const tenantId =
          action.payload?.tenantId;

        state.tenants =
          state.tenants.filter(
            (item) => item.id !== tenantId
          );

        if (state.tenant?.id === tenantId) {
          state.tenant = null;
        }

        if (state.pagination.total > 0) {
          state.pagination.total -= 1;
        }

        state.deleteError = null;

        state.successMessage =
          action.payload?.message ||
          "Tenant deleted successfully.";
      })

      .addCase(deleteTenant.rejected, (state, action) => {
        state.deleting = false;

        state.deleteError =
          action.payload ||
          "Failed to delete tenant.";
      });

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(searchTenants.pending, (state) => {
        state.searching = true;
        state.searchError = null;
      })

      .addCase(searchTenants.fulfilled, (state, action) => {
        state.searching = false;

        state.searchResults =
          Array.isArray(action.payload)
            ? action.payload
            : [];

        state.searchError = null;
      })

      .addCase(searchTenants.rejected, (state, action) => {
        state.searching = false;

        state.searchError =
          action.payload ||
          "Failed to search tenants.";
      });

    /*
    |--------------------------------------------------------------------------
    | ACTIVE TENANTS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchActiveTenants.pending, (state) => {
        state.loadingActive = true;
        state.error = null;
      })

      .addCase(fetchActiveTenants.fulfilled, (state, action) => {
        state.loadingActive = false;

        state.activeTenants =
          Array.isArray(action.payload)
            ? action.payload
            : [];
      })

      .addCase(fetchActiveTenants.rejected, (state, action) => {
        state.loadingActive = false;

        state.error =
          action.payload ||
          "Failed to fetch active tenants.";
      });

    /*
    |--------------------------------------------------------------------------
    | PENDING TENANTS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchPendingTenants.pending, (state) => {
        state.loadingPending = true;
        state.error = null;
      })

      .addCase(fetchPendingTenants.fulfilled, (state, action) => {
        state.loadingPending = false;

        state.pendingTenants =
          Array.isArray(action.payload)
            ? action.payload
            : [];
      })

      .addCase(fetchPendingTenants.rejected, (state, action) => {
        state.loadingPending = false;

        state.error =
          action.payload ||
          "Failed to fetch pending tenants.";
      });

    /*
    |--------------------------------------------------------------------------
    | INACTIVE TENANTS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchInactiveTenants.pending, (state) => {
        state.loadingInactive = true;
        state.error = null;
      })

      .addCase(fetchInactiveTenants.fulfilled, (state, action) => {
        state.loadingInactive = false;

        state.inactiveTenants =
          Array.isArray(action.payload)
            ? action.payload
            : [];
      })

      .addCase(fetchInactiveTenants.rejected, (state, action) => {
        state.loadingInactive = false;

        state.error =
          action.payload ||
          "Failed to fetch inactive tenants.";
      });

    /*
    |--------------------------------------------------------------------------
    | BLACKLISTED TENANTS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchBlacklistedTenants.pending, (state) => {
        state.loadingBlacklisted = true;
        state.error = null;
      })

      .addCase(fetchBlacklistedTenants.fulfilled, (state, action) => {
        state.loadingBlacklisted = false;

        state.blacklistedTenants =
          Array.isArray(action.payload)
            ? action.payload
            : [];
      })

      .addCase(fetchBlacklistedTenants.rejected, (state, action) => {
        state.loadingBlacklisted = false;

        state.error =
          action.payload ||
          "Failed to fetch blacklisted tenants.";
      });

    /*
    |--------------------------------------------------------------------------
    | TENANT ACTION HELPER
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
        state.tenant = updatedTenant;

        const index =
          state.tenants.findIndex(
            (item) =>
              item.id === updatedTenant.id
          );

        if (index !== -1) {
          state.tenants[index] =
            updatedTenant;
        }
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
      .addCase(activateTenant.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })

      .addCase(activateTenant.fulfilled, (state, action) => {
        handleTenantAction(
          state,
          action,
          "Tenant activated successfully."
        );
      })

      .addCase(activateTenant.rejected, (state, action) => {
        state.actionLoading = false;

        state.actionError =
          action.payload ||
          "Failed to activate tenant.";
      });

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(deactivateTenant.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })

      .addCase(deactivateTenant.fulfilled, (state, action) => {
        handleTenantAction(
          state,
          action,
          "Tenant deactivated successfully."
        );
      })

      .addCase(deactivateTenant.rejected, (state, action) => {
        state.actionLoading = false;

        state.actionError =
          action.payload ||
          "Failed to deactivate tenant.";
      });

    /*
    |--------------------------------------------------------------------------
    | BLACKLIST
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(blacklistTenant.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })

      .addCase(blacklistTenant.fulfilled, (state, action) => {
        handleTenantAction(
          state,
          action,
          "Tenant blacklisted successfully."
        );
      })

      .addCase(blacklistTenant.rejected, (state, action) => {
        state.actionLoading = false;

        state.actionError =
          action.payload ||
          "Failed to blacklist tenant.";
      });

    /*
    |--------------------------------------------------------------------------
    | PENDING
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(setTenantPending.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })

      .addCase(setTenantPending.fulfilled, (state, action) => {
        handleTenantAction(
          state,
          action,
          "Tenant status changed to pending."
        );
      })

      .addCase(setTenantPending.rejected, (state, action) => {
        state.actionLoading = false;

        state.actionError =
          action.payload ||
          "Failed to update tenant status.";
      });

    /*
    |--------------------------------------------------------------------------
    | VERIFY
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(verifyTenant.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })

      .addCase(verifyTenant.fulfilled, (state, action) => {
        handleTenantAction(
          state,
          action,
          "Tenant verified successfully."
        );
      })

      .addCase(verifyTenant.rejected, (state, action) => {
        state.actionLoading = false;

        state.actionError =
          action.payload ||
          "Failed to verify tenant.";
      });

    /*
    |--------------------------------------------------------------------------
    | UNVERIFY
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(unverifyTenant.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })

      .addCase(unverifyTenant.fulfilled, (state, action) => {
        handleTenantAction(
          state,
          action,
          "Tenant verification removed successfully."
        );
      })

      .addCase(unverifyTenant.rejected, (state, action) => {
        state.actionLoading = false;

        state.actionError =
          action.payload ||
          "Failed to remove tenant verification.";
      });

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(fetchTenantStatistics.pending, (state) => {
        state.loadingStatistics = true;
        state.statisticsError = null;
      })

      .addCase(
        fetchTenantStatistics.fulfilled,
        (state, action) => {
          state.loadingStatistics = false;

          state.statistics =
            action.payload || null;

          state.statisticsError = null;
        }
      )

      .addCase(
        fetchTenantStatistics.rejected,
        (state, action) => {
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
      .addCase(restoreTenant.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })

      .addCase(restoreTenant.fulfilled, (state, action) => {
        state.actionLoading = false;

        const restoredTenant =
          action.payload?.tenant;

        if (restoredTenant) {
          state.tenant = restoredTenant;

          const index =
            state.tenants.findIndex(
              (item) =>
                item.id === restoredTenant.id
            );

          if (index !== -1) {
            state.tenants[index] =
              restoredTenant;
          } else {
            state.tenants.unshift(
              restoredTenant
            );
          }
        }

        state.actionError = null;

        state.successMessage =
          action.payload?.message ||
          "Tenant restored successfully.";
      })

      .addCase(restoreTenant.rejected, (state, action) => {
        state.actionLoading = false;

        state.actionError =
          action.payload ||
          "Failed to restore tenant.";
      });

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(forceDeleteTenant.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
      })

      .addCase(
        forceDeleteTenant.fulfilled,
        (state, action) => {
          state.deleting = false;

          const tenantId =
            action.payload?.tenantId;

          state.tenants =
            state.tenants.filter(
              (item) =>
                item.id !== tenantId
            );

          if (state.tenant?.id === tenantId) {
            state.tenant = null;
          }

          state.deleteError = null;

          state.successMessage =
            action.payload?.message ||
            "Tenant permanently deleted successfully.";
        }
      )

      .addCase(
        forceDeleteTenant.rejected,
        (state, action) => {
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
| SELECTOR ROOT
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| The normal Redux store registration should be:
|
| tenant: tenantReducer
|
| But these selectors also tolerate:
|
| tenants: tenantReducer
|
| This prevents:
|
| Cannot read properties of undefined (reading 'tenants')
|
|--------------------------------------------------------------------------
*/

const getTenantState = (state) => {
  return state?.tenant || state?.tenants || initialState;
};

/*
|--------------------------------------------------------------------------
| SELECTORS
|--------------------------------------------------------------------------
*/

export const selectTenants = (state) =>
  getTenantState(state).tenants || [];

export const selectTenant = (state) =>
  getTenantState(state).tenant || null;

export const selectTenantPagination = (state) =>
  getTenantState(state).pagination ||
  initialState.pagination;

export const selectTenantFilters = (state) =>
  getTenantState(state).filters ||
  initialState.filters;

export const selectTenantStatistics = (state) =>
  getTenantState(state).statistics || null;

export const selectTenantSearchResults = (state) =>
  getTenantState(state).searchResults || [];

export const selectActiveTenants = (state) =>
  getTenantState(state).activeTenants || [];

export const selectPendingTenants = (state) =>
  getTenantState(state).pendingTenants || [];

export const selectInactiveTenants = (state) =>
  getTenantState(state).inactiveTenants || [];

export const selectBlacklistedTenants = (state) =>
  getTenantState(state).blacklistedTenants || [];

/*
|--------------------------------------------------------------------------
| LOADING SELECTORS
|--------------------------------------------------------------------------
*/

export const selectTenantLoading = (state) =>
  Boolean(getTenantState(state).loading);

export const selectTenantLoadingTenant = (state) =>
  Boolean(getTenantState(state).loadingTenant);

export const selectTenantCreating = (state) =>
  Boolean(getTenantState(state).creating);

export const selectTenantUpdating = (state) =>
  Boolean(getTenantState(state).updating);

export const selectTenantDeleting = (state) =>
  Boolean(getTenantState(state).deleting);

export const selectTenantSearching = (state) =>
  Boolean(getTenantState(state).searching);

export const selectTenantActionLoading = (state) =>
  Boolean(getTenantState(state).actionLoading);

export const selectTenantLoadingStatistics = (state) =>
  Boolean(getTenantState(state).loadingStatistics);

/*
|--------------------------------------------------------------------------
| ERROR SELECTORS
|--------------------------------------------------------------------------
*/

export const selectTenantError = (state) =>
  getTenantState(state).error || null;

export const selectTenantCreateError = (state) =>
  getTenantState(state).createError || null;

export const selectTenantUpdateError = (state) =>
  getTenantState(state).updateError || null;

export const selectTenantDeleteError = (state) =>
  getTenantState(state).deleteError || null;

export const selectTenantActionError = (state) =>
  getTenantState(state).actionError || null;

export const selectTenantStatisticsError = (state) =>
  getTenantState(state).statisticsError || null;

/*
|--------------------------------------------------------------------------
| SUCCESS SELECTOR
|--------------------------------------------------------------------------
*/

export const selectTenantSuccessMessage = (state) =>
  getTenantState(state).successMessage || null;

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

export default tenantSlice.reducer;