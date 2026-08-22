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
| Converts:
|
| 1. Axios errors
| 2. Redux Toolkit rejectWithValue errors
| 3. Laravel API errors
| 4. Plain strings
| 5. Normal JavaScript errors
|
| into one predictable object.
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
  | STRING
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
  | AXIOS RESPONSE
  |--------------------------------------------------------------------------
  */

  const response = error?.response;
  const responseData = response?.data;

  /*
  |--------------------------------------------------------------------------
  | HANDLE LARAVEL RESPONSE
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | {
  |   status: false,
  |   code: 500,
  |   message: "...",
  |   data: null,
  |   errors: {...}
  | }
  |
  */

  const message =
    responseData?.message ||
    responseData?.error ||
    responseData?.errors?.message ||
    responseData?.data?.message ||
    error?.message ||
    error?.raw?.message ||
    "An unexpected error occurred.";

  const status =
    response?.status ??
    responseData?.code ??
    error?.status ??
    error?.raw?.status ??
    null;

  const code =
    responseData?.code ??
    error?.code ??
    error?.raw?.code ??
    response?.status ??
    null;

  const errors =
    responseData?.errors ??
    responseData?.data?.errors ??
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
| Accepts:
|
| removeTenant(2)
|
| removeTenant("2")
|
| removeTenant({
|   id: 2
| })
|
| removeTenant({
|   tenant_id: 2
| })
|
| removeTenant({
|   tenant: {
|     id: 2
|   }
| })
|
*/

const getTenantId = (tenantOrId) => {
  /*
  |--------------------------------------------------------------------------
  | NULL / UNDEFINED
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

    return value || null;
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
| CREATE STANDARD ERROR
|--------------------------------------------------------------------------
*/

const createTenantError = (
  message,
  status = 400,
  code = 400,
  errors = null,
  raw = null
) => {
  return {
    message,
    status,
    code,
    errors,
    raw,
  };
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
  | FETCH TENANTS
  |--------------------------------------------------------------------------
  */

  const getTenants = useCallback(
    async (params = {}) => {
      try {
        return await dispatch(
          fetchTenants(params)
        ).unwrap();
      } catch (err) {
        const normalized =
          normalizeError(err);

        console.error(
          "Failed to fetch tenants:",
          normalized
        );

        throw normalized;
      }
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH SINGLE TENANT
  |--------------------------------------------------------------------------
  */

  const getTenant = useCallback(
    async (tenantId) => {
      const id =
        getTenantId(tenantId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      try {
        return await dispatch(
          fetchTenant(id)
        ).unwrap();
      } catch (err) {
        const normalized =
          normalizeError(err);

        console.error(
          "Failed to fetch tenant:",
          normalized
        );

        throw normalized;
      }
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
      if (!tenantData) {
        throw createTenantError(
          "Tenant data is required."
        );
      }

      try {
        return await dispatch(
          createTenant(tenantData)
        ).unwrap();
      } catch (err) {
        const normalized =
          normalizeError(err);

        console.error(
          "Failed to create tenant:",
          normalized
        );

        throw normalized;
      }
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
      tenantId,
      tenantData
    ) => {
      const id =
        getTenantId(tenantId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      if (!tenantData) {
        throw createTenantError(
          "Tenant data is required."
        );
      }

      try {
        console.log(
          "Updating tenant:",
          {
            tenantId: id,
            tenantData,
          }
        );

        return await dispatch(
          updateTenant({
            tenantId: id,
            tenantData,
          })
        ).unwrap();
      } catch (err) {
        const normalized =
          normalizeError(err);

        console.error(
          "Tenant update failed:",
          normalized
        );

        throw normalized;
      }
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | DELETE TENANT
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | TenantTable.jsx remains unchanged.
  |
  | It can call:
  |
  | removeTenant(tenantId)
  |
  | OR:
  |
  | removeTenant(tenant)
  |
  */

  const removeTenant = useCallback(
    async (tenantOrId) => {
      /*
      |--------------------------------------------------------------------------
      | RESOLVE ID
      |--------------------------------------------------------------------------
      */

      const id =
        getTenantId(
          tenantOrId
        );

      /*
      |--------------------------------------------------------------------------
      | VALIDATE ID
      |--------------------------------------------------------------------------
      */

      if (!id) {
        const normalized =
          createTenantError(
            "Unable to delete tenant because the tenant ID is missing.",
            400,
            400,
            null,
            tenantOrId
          );

        console.error(
          "Tenant deletion failed:",
          normalized
        );

        throw normalized;
      }

      /*
      |--------------------------------------------------------------------------
      | DEBUG
      |--------------------------------------------------------------------------
      */

      console.log(
        "Deleting tenant:",
        {
          tenantId: id,
          tenant:
            typeof tenantOrId ===
              "object"
              ? tenantOrId
              : null,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | DISPATCH DELETE
      |--------------------------------------------------------------------------
      */

      try {
        const result =
          await dispatch(
            deleteTenant(id)
          ).unwrap();

        /*
        |--------------------------------------------------------------------------
        | SUCCESS
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | If Redux thunk resolves, this is a successful
        | HTTP/API operation.
        |
        */

        console.log(
          "Tenant deleted successfully:",
          {
            tenantId: id,
            result,
          }
        );

        return result;
      } catch (err) {
        /*
        |--------------------------------------------------------------------------
        | NORMALIZE REAL ERROR
        |--------------------------------------------------------------------------
        */

        const normalized =
          normalizeError(err);

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT DEBUG
        |--------------------------------------------------------------------------
        |
        | This will expose the actual Laravel error rather
        | than only:
        |
        | "Failed to delete tenant."
        |
        */

        console.error(
          "Failed to delete tenant:",
          {
            tenantId: id,
            message:
              normalized.message,
            status:
              normalized.status,
            code:
              normalized.code,
            errors:
              normalized.errors,
            raw:
              normalized.raw,
          }
        );

        /*
        |--------------------------------------------------------------------------
        | THROW TO TENANT TABLE
        |--------------------------------------------------------------------------
        |
        | TenantTable.jsx can safely use:
        |
        | error.message
        |
        */

        throw normalized;
      }
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const search = useCallback(
    async (
      searchValue,
      limit = 20
    ) => {
      try {
        return await dispatch(
          searchTenants({
            search: searchValue,
            limit,
          })
        ).unwrap();
      } catch (err) {
        const normalized =
          normalizeError(err);

        console.error(
          "Tenant search failed:",
          normalized
        );

        throw normalized;
      }
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
        try {
          return await dispatch(
            fetchActiveTenants()
          ).unwrap();
        } catch (err) {
          const normalized =
            normalizeError(err);

          console.error(
            "Failed to fetch active tenants:",
            normalized
          );

          throw normalized;
        }
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
        try {
          return await dispatch(
            fetchPendingTenants()
          ).unwrap();
        } catch (err) {
          const normalized =
            normalizeError(err);

          console.error(
            "Failed to fetch pending tenants:",
            normalized
          );

          throw normalized;
        }
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
        try {
          return await dispatch(
            fetchInactiveTenants()
          ).unwrap();
        } catch (err) {
          const normalized =
            normalizeError(err);

          console.error(
            "Failed to fetch inactive tenants:",
            normalized
          );

          throw normalized;
        }
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
        try {
          return await dispatch(
            fetchBlacklistedTenants()
          ).unwrap();
        } catch (err) {
          const normalized =
            normalizeError(err);

          console.error(
            "Failed to fetch blacklisted tenants:",
            normalized
          );

          throw normalized;
        }
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE
  |--------------------------------------------------------------------------
  */

  const activate = useCallback(
    async (tenantId) => {
      const id =
        getTenantId(tenantId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      try {
        return await dispatch(
          activateTenant(id)
        ).unwrap();
      } catch (err) {
        const normalized =
          normalizeError(err);

        console.error(
          "Failed to activate tenant:",
          normalized
        );

        throw normalized;
      }
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE
  |--------------------------------------------------------------------------
  */

  const deactivate = useCallback(
    async (tenantId) => {
      const id =
        getTenantId(tenantId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      try {
        return await dispatch(
          deactivateTenant(id)
        ).unwrap();
      } catch (err) {
        const normalized =
          normalizeError(err);

        console.error(
          "Failed to deactivate tenant:",
          normalized
        );

        throw normalized;
      }
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | BLACKLIST
  |--------------------------------------------------------------------------
  */

  const blacklist = useCallback(
    async (tenantId) => {
      const id =
        getTenantId(tenantId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      try {
        return await dispatch(
          blacklistTenant(id)
        ).unwrap();
      } catch (err) {
        const normalized =
          normalizeError(err);

        console.error(
          "Failed to blacklist tenant:",
          normalized
        );

        throw normalized;
      }
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | SET PENDING
  |--------------------------------------------------------------------------
  */

  const setPending =
    useCallback(
      async (tenantId) => {
        const id =
          getTenantId(tenantId);

        if (!id) {
          throw createTenantError(
            "Tenant ID is required."
          );
        }

        try {
          return await dispatch(
            setTenantPending(id)
          ).unwrap();
        } catch (err) {
          const normalized =
            normalizeError(err);

          console.error(
            "Failed to set tenant pending:",
            normalized
          );

          throw normalized;
        }
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | VERIFY
  |--------------------------------------------------------------------------
  */

  const verify = useCallback(
    async (tenantId) => {
      const id =
        getTenantId(tenantId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      try {
        return await dispatch(
          verifyTenant(id)
        ).unwrap();
      } catch (err) {
        const normalized =
          normalizeError(err);

        console.error(
          "Failed to verify tenant:",
          normalized
        );

        throw normalized;
      }
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | UNVERIFY
  |--------------------------------------------------------------------------
  */

  const unverify = useCallback(
    async (tenantId) => {
      const id =
        getTenantId(tenantId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      try {
        return await dispatch(
          unverifyTenant(id)
        ).unwrap();
      } catch (err) {
        const normalized =
          normalizeError(err);

        console.error(
          "Failed to unverify tenant:",
          normalized
        );

        throw normalized;
      }
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | RESTORE
  |--------------------------------------------------------------------------
  */

  const restore = useCallback(
    async (tenantId) => {
      const id =
        getTenantId(tenantId);

      if (!id) {
        throw createTenantError(
          "Tenant ID is required."
        );
      }

      try {
        return await dispatch(
          restoreTenant(id)
        ).unwrap();
      } catch (err) {
        const normalized =
          normalizeError(err);

        console.error(
          "Failed to restore tenant:",
          normalized
        );

        throw normalized;
      }
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | FORCE DELETE
  |--------------------------------------------------------------------------
  */

  const forceDelete =
    useCallback(
      async (tenantId) => {
        const id =
          getTenantId(tenantId);

        if (!id) {
          throw createTenantError(
            "Tenant ID is required."
          );
        }

        try {
          return await dispatch(
            forceDeleteTenant(id)
          ).unwrap();
        } catch (err) {
          const normalized =
            normalizeError(err);

          console.error(
            "Failed to permanently delete tenant:",
            normalized
          );

          throw normalized;
        }
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const getStatistics =
    useCallback(
      async () => {
        try {
          return await dispatch(
            fetchTenantStatistics()
          ).unwrap();
        } catch (err) {
          const normalized =
            normalizeError(err);

          console.error(
            "Failed to fetch tenant statistics:",
            normalized
          );

          throw normalized;
        }
      },
      [dispatch]
    );

  /*
  |--------------------------------------------------------------------------
  | SET TENANT
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
  | CLEAR TENANT
  |--------------------------------------------------------------------------
  */

  const clear = useCallback(() => {
    dispatch(
      clearTenant()
    );
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | FILTERS
  |--------------------------------------------------------------------------
  */

  const updateFilters =
    useCallback(
      (newFilters) => {
        dispatch(
          setTenantFilters(
            newFilters
          )
        );
      },
      [dispatch]
    );

  const updateSearch =
    useCallback(
      (value) => {
        dispatch(
          setTenantSearch(value)
        );
      },
      [dispatch]
    );

  const updateStatus =
    useCallback(
      (status) => {
        dispatch(
          setTenantStatus(status)
        );
      },
      [dispatch]
    );

  const changePage =
    useCallback(
      (page) => {
        dispatch(
          setTenantPage(page)
        );
      },
      [dispatch]
    );

  const changePerPage =
    useCallback(
      (perPage) => {
        dispatch(
          setTenantPerPage(
            perPage
          )
        );
      },
      [dispatch]
    );

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
  | RETURN
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
    | ERROR HELPER
    |--------------------------------------------------------------------------
    */

    normalizeError,
  };
};

export default useTenant;