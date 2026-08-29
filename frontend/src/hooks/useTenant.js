import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchTenants,
  fetchTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  searchTenants,
  fetchActiveTenants,
  fetchPendingTenants,
  fetchInactiveTenants,
  fetchBlacklistedTenants,
  activateTenant,
  deactivateTenant,
  blacklistTenant,
  setTenantPending,
  verifyTenant,
  unverifyTenant,
  fetchTenantStatistics,
  restoreTenant,
  forceDeleteTenant,

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

  selectTenants,
  selectTenant,
  selectTenantPagination,
  selectTenantFilters,
  selectTenantStatistics,
  selectTenantSearchResults,
  selectActiveTenants,
  selectPendingTenants,
  selectInactiveTenants,
  selectBlacklistedTenants,

  selectTenantLoading,
  selectTenantLoadingTenant,
  selectTenantCreating,
  selectTenantUpdating,
  selectTenantDeleting,
  selectTenantSearching,
  selectTenantActionLoading,
  selectTenantLoadingStatistics,

  selectTenantError,
  selectTenantCreateError,
  selectTenantUpdateError,
  selectTenantDeleteError,
  selectTenantActionError,
  selectTenantStatisticsError,
  selectTenantSuccessMessage,
} from "../store/tenantSlice";

/*
|--------------------------------------------------------------------------
| ERROR NORMALIZER
|--------------------------------------------------------------------------
|
| Converts all supported Laravel / Axios / Redux errors into:
|
| {
|   message,
|   status,
|   code,
|   errors,
|   raw
| }
|
*/

const normalizeError = (error) => {
  /*
  |--------------------------------------------------------------------------
  | EMPTY ERROR
  |--------------------------------------------------------------------------
  */

  if (!error) {
    return {
      message: "An unexpected error occurred.",
      status: null,
      code: null,
      errors: null,
      raw: error,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | STRING ERROR
  |--------------------------------------------------------------------------
  */

  if (typeof error === "string") {
    return {
      message: error,
      status: null,
      code: null,
      errors: null,
      raw: error,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | POSSIBLE RESPONSE OBJECTS
  |--------------------------------------------------------------------------
  */

  const response = error?.response ?? null;
  const responseData = response?.data ?? null;

  /*
  |--------------------------------------------------------------------------
  | SUPPORT REDUX REJECT WITH VALUE
  |--------------------------------------------------------------------------
  */

  const data =
    responseData ??
    error?.data ??
    error?.raw?.response?.data ??
    error?.raw?.data ??
    null;

  /*
  |--------------------------------------------------------------------------
  | MESSAGE
  |--------------------------------------------------------------------------
  */

  const message =
    data?.message ??
    data?.error ??
    data?.errors?.message ??
    data?.data?.message ??
    error?.message ??
    error?.raw?.message ??
    "An unexpected error occurred.";

  /*
  |--------------------------------------------------------------------------
  | HTTP STATUS
  |--------------------------------------------------------------------------
  */

  const status =
    response?.status ??
    data?.code ??
    error?.status ??
    error?.raw?.status ??
    null;

  /*
  |--------------------------------------------------------------------------
  | APPLICATION CODE
  |--------------------------------------------------------------------------
  */

  const code =
    data?.code ??
    error?.code ??
    error?.raw?.code ??
    response?.status ??
    null;

  /*
  |--------------------------------------------------------------------------
  | VALIDATION / API ERRORS
  |--------------------------------------------------------------------------
  */

  const errors =
    data?.errors ??
    data?.data?.errors ??
    error?.errors ??
    error?.raw?.errors ??
    null;

  return {
    message,
    status,
    code,
    errors,
    raw: error,
  };
};

/*
|--------------------------------------------------------------------------
| TENANT ID HELPER
|--------------------------------------------------------------------------
|
| Supports:
|
| getTenant(12)
| getTenant("12")
|
| getTenant({
|   id: 12
| })
|
| getTenant({
|   tenant_id: 12
| })
|
| getTenant({
|   tenant: {
|     id: 12
|   }
| })
|
| getTenant({
|   data: {
|     id: 12
|   }
| })
|
*/

const getTenantId = (tenantOrId) => {
  /*
  |--------------------------------------------------------------------------
  | NULL
  |--------------------------------------------------------------------------
  */

  if (
    tenantOrId === null ||
    tenantOrId === undefined
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | DIRECT ID
  |--------------------------------------------------------------------------
  */

  if (
    typeof tenantOrId === "string" ||
    typeof tenantOrId === "number"
  ) {
    const value = String(
      tenantOrId
    ).trim();

    return value !== "" ? value : null;
  }

  /*
  |--------------------------------------------------------------------------
  | OBJECT
  |--------------------------------------------------------------------------
  */

  if (
    typeof tenantOrId === "object"
  ) {
    const id =
      tenantOrId?.id ??
      tenantOrId?.tenant_id ??
      tenantOrId?.tenant?.id ??
      tenantOrId?.data?.id ??
      tenantOrId?.data?.tenant_id ??
      tenantOrId?.data?.tenant?.id;

    if (
      id !== null &&
      id !== undefined &&
      String(id).trim() !== ""
    ) {
      return String(id).trim();
    }
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| STANDARD ERROR
|--------------------------------------------------------------------------
*/

const createTenantError = (
  message,
  status = 400,
  code = 400,
  errors = null,
  raw = null
) => ({
  message,
  status,
  code,
  errors,
  raw,
});

/*
|--------------------------------------------------------------------------
| SAFE DISPATCH
|--------------------------------------------------------------------------
|
| Centralizes:
|
| dispatch(thunk).unwrap()
|
| and normalizes every error.
|
*/

const executeTenantAction = async (
  dispatch,
  thunk,
  errorContext
) => {
  try {
    return await dispatch(thunk).unwrap();
  } catch (error) {
    const normalized = normalizeError(error);

    console.error(
      errorContext,
      normalized
    );

    throw normalized;
  }
};

/*
|--------------------------------------------------------------------------
| useTenant
|--------------------------------------------------------------------------
*/

export const useTenant = () => {
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | DATA
  |--------------------------------------------------------------------------
  */

  const tenants = useSelector(
    selectTenants
  );

  const tenant = useSelector(
    selectTenant
  );

  const pagination = useSelector(
    selectTenantPagination
  );

  const filters = useSelector(
    selectTenantFilters
  );

  const statistics = useSelector(
    selectTenantStatistics
  );

  const searchResults = useSelector(
    selectTenantSearchResults
  );

  const activeTenants = useSelector(
    selectActiveTenants
  );

  const pendingTenants = useSelector(
    selectPendingTenants
  );

  const inactiveTenants = useSelector(
    selectInactiveTenants
  );

  const blacklistedTenants = useSelector(
    selectBlacklistedTenants
  );

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const loading = useSelector(
    selectTenantLoading
  );

  const loadingTenant = useSelector(
    selectTenantLoadingTenant
  );

  const creating = useSelector(
    selectTenantCreating
  );

  const updating = useSelector(
    selectTenantUpdating
  );

  const deleting = useSelector(
    selectTenantDeleting
  );

  const searching = useSelector(
    selectTenantSearching
  );

  const actionLoading = useSelector(
    selectTenantActionLoading
  );

  const loadingStatistics = useSelector(
    selectTenantLoadingStatistics
  );

  /*
  |--------------------------------------------------------------------------
  | ERRORS
  |--------------------------------------------------------------------------
  */

  const error = useSelector(
    selectTenantError
  );

  const createError = useSelector(
    selectTenantCreateError
  );

  const updateError = useSelector(
    selectTenantUpdateError
  );

  const deleteError = useSelector(
    selectTenantDeleteError
  );

  const actionError = useSelector(
    selectTenantActionError
  );

  const statisticsError = useSelector(
    selectTenantStatisticsError
  );

  const successMessage = useSelector(
    selectTenantSuccessMessage
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH ALL TENANTS
  |--------------------------------------------------------------------------
  */

  const getTenants = useCallback(
    async (params = {}) => {
      return executeTenantAction(
        dispatch,
        fetchTenants(params),
        "Failed to fetch tenants:"
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH SINGLE TENANT
  |--------------------------------------------------------------------------
  */

  const getTenant = useCallback(
    async (tenantOrId) => {
      const id =
        getTenantId(tenantOrId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      return executeTenantAction(
        dispatch,
        fetchTenant(id),
        "Failed to fetch tenant:"
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | CREATE TENANT
  |--------------------------------------------------------------------------
  */

  const addTenant = useCallback(
    async (tenantData) => {
      if (
        !tenantData ||
        typeof tenantData !== "object"
      ) {
        throw createTenantError(
          "Tenant data is required."
        );
      }

      return executeTenantAction(
        dispatch,
        createTenant(tenantData),
        "Failed to create tenant:"
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE TENANT
  |--------------------------------------------------------------------------
  */

  const editTenant = useCallback(
    async (
      tenantOrId,
      tenantData
    ) => {
      const id =
        getTenantId(tenantOrId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      if (
        !tenantData ||
        typeof tenantData !== "object"
      ) {
        throw createTenantError(
          "Tenant data is required."
        );
      }

      console.log(
        "Updating tenant:",
        {
          tenantId: id,
          tenantData,
        }
      );

      return executeTenantAction(
        dispatch,
        updateTenant({
          tenantId: id,
          tenantData,
        }),
        "Tenant update failed:"
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | DELETE TENANT
  |--------------------------------------------------------------------------
  */

  const removeTenant = useCallback(
    async (tenantOrId) => {
      const id =
        getTenantId(tenantOrId);

      if (!id) {
        throw createTenantError(
          "Unable to delete tenant because the tenant ID is missing.",
          400,
          400,
          null,
          tenantOrId
        );
      }

      console.log(
        "Deleting tenant:",
        {
          tenantId: id,
        }
      );

      return executeTenantAction(
        dispatch,
        deleteTenant(id),
        "Failed to delete tenant:"
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | SEARCH TENANTS
  |--------------------------------------------------------------------------
  */

  const search = useCallback(
    async (
      searchValue = "",
      limit = 20
    ) => {
      return executeTenantAction(
        dispatch,
        searchTenants({
          search: searchValue,
          limit,
        }),
        "Tenant search failed:"
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | ACTIVE TENANTS
  |--------------------------------------------------------------------------
  */

  const getActiveTenants =
    useCallback(
      async () => {
        return executeTenantAction(
          dispatch,
          fetchActiveTenants(),
          "Failed to fetch active tenants:"
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | PENDING TENANTS
  |--------------------------------------------------------------------------
  */

  const getPendingTenants =
    useCallback(
      async () => {
        return executeTenantAction(
          dispatch,
          fetchPendingTenants(),
          "Failed to fetch pending tenants:"
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | INACTIVE TENANTS
  |--------------------------------------------------------------------------
  */

  const getInactiveTenants =
    useCallback(
      async () => {
        return executeTenantAction(
          dispatch,
          fetchInactiveTenants(),
          "Failed to fetch inactive tenants:"
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | BLACKLISTED TENANTS
  |--------------------------------------------------------------------------
  */

  const getBlacklistedTenants =
    useCallback(
      async () => {
        return executeTenantAction(
          dispatch,
          fetchBlacklistedTenants(),
          "Failed to fetch blacklisted tenants:"
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE TENANT
  |--------------------------------------------------------------------------
  */

  const activate = useCallback(
    async (tenantOrId) => {
      const id =
        getTenantId(tenantOrId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      return executeTenantAction(
        dispatch,
        activateTenant(id),
        "Failed to activate tenant:"
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE TENANT
  |--------------------------------------------------------------------------
  */

  const deactivate = useCallback(
    async (tenantOrId) => {
      const id =
        getTenantId(tenantOrId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      return executeTenantAction(
        dispatch,
        deactivateTenant(id),
        "Failed to deactivate tenant:"
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | BLACKLIST TENANT
  |--------------------------------------------------------------------------
  */

  const blacklist = useCallback(
    async (tenantOrId) => {
      const id =
        getTenantId(tenantOrId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      return executeTenantAction(
        dispatch,
        blacklistTenant(id),
        "Failed to blacklist tenant:"
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | SET TENANT PENDING
  |--------------------------------------------------------------------------
  */

  const setPending =
    useCallback(
      async (tenantOrId) => {
        const id =
          getTenantId(tenantOrId);

        if (!id) {
          throw createTenantError(
            "Tenant ID is required."
          );
        }

        return executeTenantAction(
          dispatch,
          setTenantPending(id),
          "Failed to set tenant pending:"
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | VERIFY TENANT
  |--------------------------------------------------------------------------
  */

  const verify = useCallback(
    async (tenantOrId) => {
      const id =
        getTenantId(tenantOrId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      return executeTenantAction(
        dispatch,
        verifyTenant(id),
        "Failed to verify tenant:"
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | UNVERIFY TENANT
  |--------------------------------------------------------------------------
  */

  const unverify = useCallback(
    async (tenantOrId) => {
      const id =
        getTenantId(tenantOrId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      return executeTenantAction(
        dispatch,
        unverifyTenant(id),
        "Failed to unverify tenant:"
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | RESTORE TENANT
  |--------------------------------------------------------------------------
  */

  const restore = useCallback(
    async (tenantOrId) => {
      const id =
        getTenantId(tenantOrId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      return executeTenantAction(
        dispatch,
        restoreTenant(id),
        "Failed to restore tenant:"
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | FORCE DELETE TENANT
  |--------------------------------------------------------------------------
  */

  const forceDelete =
    useCallback(
      async (tenantOrId) => {
        const id =
          getTenantId(tenantOrId);

        if (!id) {
          throw createTenantError(
            "Tenant ID is required."
          );
        }

        return executeTenantAction(
          dispatch,
          forceDeleteTenant(id),
          "Failed to permanently delete tenant:"
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | TENANT STATISTICS
  |--------------------------------------------------------------------------
  */

  const getStatistics =
    useCallback(
      async () => {
        return executeTenantAction(
          dispatch,
          fetchTenantStatistics(),
          "Failed to fetch tenant statistics:"
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | SELECT TENANT
  |--------------------------------------------------------------------------
  */

  const select = useCallback(
    (tenantData) => {
      dispatch(
        setTenant(tenantData)
      );
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | CLEAR SELECTED TENANT
  |--------------------------------------------------------------------------
  */

  const clear = useCallback(() => {
    dispatch(
      clearTenant()
    );
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | UPDATE FILTERS
  |--------------------------------------------------------------------------
  */

  const updateFilters =
    useCallback(
      (newFilters) => {
        dispatch(
          setTenantFilters(
            newFilters ?? {}
          )
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | UPDATE SEARCH
  |--------------------------------------------------------------------------
  */

  const updateSearch =
    useCallback(
      (value) => {
        dispatch(
          setTenantSearch(
            value ?? ""
          )
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | UPDATE STATUS
  |--------------------------------------------------------------------------
  */

  const updateStatus =
    useCallback(
      (status) => {
        dispatch(
          setTenantStatus(
            status ?? ""
          )
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | CHANGE PAGE
  |--------------------------------------------------------------------------
  */

  const changePage =
    useCallback(
      (page) => {
        dispatch(
          setTenantPage(page)
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | CHANGE PER PAGE
  |--------------------------------------------------------------------------
  */

  const changePerPage =
    useCallback(
      (perPage) => {
        dispatch(
          setTenantPerPage(perPage)
        );
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  const resetFilters =
    useCallback(() => {
      dispatch(
        resetTenantFilters()
      );
    }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | CLEAR SEARCH
  |--------------------------------------------------------------------------
  */

  const clearSearch =
    useCallback(() => {
      dispatch(
        clearTenantSearch()
      );
    }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | CLEAR ERROR
  |--------------------------------------------------------------------------
  */

  const clearError =
    useCallback(() => {
      dispatch(
        clearTenantError()
      );
    }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | CLEAR SUCCESS
  |--------------------------------------------------------------------------
  */

  const clearSuccess =
    useCallback(() => {
      dispatch(
        clearTenantSuccess()
      );
    }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | RETURN API
  |--------------------------------------------------------------------------
  */

  return {
    /*
    |--------------------------------------------------------------------------
    | DATA
    |--------------------------------------------------------------------------
    */

    tenants,
    tenant,
    pagination,
    filters,
    statistics,
    searchResults,

    activeTenants,
    pendingTenants,
    inactiveTenants,
    blacklistedTenants,

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    loading,
    loadingTenant,
    creating,
    updating,
    deleting,
    searching,
    actionLoading,
    loadingStatistics,

    /*
    |--------------------------------------------------------------------------
    | ERRORS
    |--------------------------------------------------------------------------
    */

    error,
    createError,
    updateError,
    deleteError,
    actionError,
    statisticsError,

    successMessage,

    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */

    getTenants,
    getTenant,
    addTenant,
    editTenant,
    removeTenant,

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    search,

    /*
    |--------------------------------------------------------------------------
    | STATUS LISTS
    |--------------------------------------------------------------------------
    */

    getActiveTenants,
    getPendingTenants,
    getInactiveTenants,
    getBlacklistedTenants,

    /*
    |--------------------------------------------------------------------------
    | STATUS ACTIONS
    |--------------------------------------------------------------------------
    */

    activate,
    deactivate,
    blacklist,
    setPending,

    /*
    |--------------------------------------------------------------------------
    | VERIFICATION
    |--------------------------------------------------------------------------
    */

    verify,
    unverify,

    /*
    |--------------------------------------------------------------------------
    | RESTORE / DELETE
    |--------------------------------------------------------------------------
    */

    restore,
    forceDelete,

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    getStatistics,

    /*
    |--------------------------------------------------------------------------
    | STATE HELPERS
    |--------------------------------------------------------------------------
    */

    select,
    clear,

    /*
    |--------------------------------------------------------------------------
    | FILTER HELPERS
    |--------------------------------------------------------------------------
    */

    updateFilters,
    updateSearch,
    updateStatus,
    changePage,
    changePerPage,
    resetFilters,

    /*
    |--------------------------------------------------------------------------
    | CLEAR HELPERS
    |--------------------------------------------------------------------------
    */

    clearSearch,
    clearError,
    clearSuccess,

    /*
    |--------------------------------------------------------------------------
    | UTILITY
    |--------------------------------------------------------------------------
    */

    normalizeError,
    getTenantId,
  };
};

export default useTenant;

