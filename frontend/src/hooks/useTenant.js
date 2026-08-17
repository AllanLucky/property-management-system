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
*/

const normalizeError = (error) => {
  if (!error) {
    return null;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error) {
    return error.error;
  }

  if (error?.data?.message) {
    return error.data.message;
  }

  if (error?.data?.error) {
    return error.data.error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  return "An unexpected error occurred.";
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
  | SELECTORS
  |--------------------------------------------------------------------------
  */

  const tenants = useSelector(selectTenants);
  const tenant = useSelector(selectTenant);
  const pagination = useSelector(selectTenantPagination);
  const filters = useSelector(selectTenantFilters);
  const statistics = useSelector(selectTenantStatistics);
  const searchResults = useSelector(selectTenantSearchResults);

  const activeTenants = useSelector(selectActiveTenants);
  const pendingTenants = useSelector(selectPendingTenants);
  const inactiveTenants = useSelector(selectInactiveTenants);
  const blacklistedTenants = useSelector(
    selectBlacklistedTenants
  );

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const loading = useSelector(selectTenantLoading);

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
        console.error(
          "Failed to fetch tenants:",
          err
        );

        throw err;
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
      if (!tenantId) {
        throw new Error(
          "Tenant ID is required."
        );
      }

      try {
        return await dispatch(
          fetchTenant(tenantId)
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to fetch tenant:",
          err
        );

        throw err;
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
      try {
        return await dispatch(
          createTenant(tenantData)
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to create tenant:",
          err
        );

        throw err;
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
    async (tenantId, tenantData) => {
      if (!tenantId) {
        throw new Error(
          "Tenant ID is required."
        );
      }

      if (!tenantData) {
        throw new Error(
          "Tenant data is required."
        );
      }

      try {
        console.log(
          "Updating tenant:",
          {
            tenantId,
            tenantData,
          }
        );

        const result = await dispatch(
          updateTenant({
            tenantId,
            tenantData,
          })
        ).unwrap();

        return result;
      } catch (err) {
        console.error(
          "Tenant update failed:",
          err
        );

        const normalizedMessage =
          normalizeError(err);

        throw {
          ...(
            typeof err === "object" &&
              err !== null
              ? err
              : {}
          ),
          message: normalizedMessage,
        };
      }
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | DELETE TENANT
  |--------------------------------------------------------------------------
  */

  const removeTenant = useCallback(
    async (tenantId) => {
      if (!tenantId) {
        throw new Error(
          "Tenant ID is required."
        );
      }

      try {
        return await dispatch(
          deleteTenant(tenantId)
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to delete tenant:",
          err
        );

        throw err;
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
        console.error(
          "Tenant search failed:",
          err
        );

        throw err;
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
    useCallback(async () => {
      try {
        return await dispatch(
          fetchActiveTenants()
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to fetch active tenants:",
          err
        );

        throw err;
      }
    }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | PENDING TENANTS
  |--------------------------------------------------------------------------
  */

  const getPendingTenants =
    useCallback(async () => {
      try {
        return await dispatch(
          fetchPendingTenants()
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to fetch pending tenants:",
          err
        );

        throw err;
      }
    }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | INACTIVE TENANTS
  |--------------------------------------------------------------------------
  */

  const getInactiveTenants =
    useCallback(async () => {
      try {
        return await dispatch(
          fetchInactiveTenants()
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to fetch inactive tenants:",
          err
        );

        throw err;
      }
    }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | BLACKLISTED TENANTS
  |--------------------------------------------------------------------------
  */

  const getBlacklistedTenants =
    useCallback(async () => {
      try {
        return await dispatch(
          fetchBlacklistedTenants()
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to fetch blacklisted tenants:",
          err
        );

        throw err;
      }
    }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE
  |--------------------------------------------------------------------------
  */

  const activate = useCallback(
    async (tenantId) => {
      try {
        return await dispatch(
          activateTenant(tenantId)
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to activate tenant:",
          err
        );

        throw err;
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
      try {
        return await dispatch(
          deactivateTenant(tenantId)
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to deactivate tenant:",
          err
        );

        throw err;
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
      try {
        return await dispatch(
          blacklistTenant(tenantId)
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to blacklist tenant:",
          err
        );

        throw err;
      }
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | SET PENDING
  |--------------------------------------------------------------------------
  */

  const setPending = useCallback(
    async (tenantId) => {
      try {
        return await dispatch(
          setTenantPending(tenantId)
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to set tenant pending:",
          err
        );

        throw err;
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
      try {
        return await dispatch(
          verifyTenant(tenantId)
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to verify tenant:",
          err
        );

        throw err;
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
      try {
        return await dispatch(
          unverifyTenant(tenantId)
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to unverify tenant:",
          err
        );

        throw err;
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
      try {
        return await dispatch(
          restoreTenant(tenantId)
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to restore tenant:",
          err
        );

        throw err;
      }
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | FORCE DELETE
  |--------------------------------------------------------------------------
  */

  const forceDelete = useCallback(
    async (tenantId) => {
      try {
        return await dispatch(
          forceDeleteTenant(tenantId)
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to permanently delete tenant:",
          err
        );

        throw err;
      }
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const getStatistics = useCallback(
    async () => {
      try {
        return await dispatch(
          fetchTenantStatistics()
        ).unwrap();
      } catch (err) {
        console.error(
          "Failed to fetch tenant statistics:",
          err
        );

        throw err;
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
    dispatch(clearTenant());
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | FILTERS
  |--------------------------------------------------------------------------
  */

  const updateFilters = useCallback(
    (newFilters) => {
      dispatch(
        setTenantFilters(newFilters)
      );
    },
    [dispatch]
  );

  const updateSearch = useCallback(
    (value) => {
      dispatch(
        setTenantSearch(value)
      );
    },
    [dispatch]
  );

  const updateStatus = useCallback(
    (status) => {
      dispatch(
        setTenantStatus(status)
      );
    },
    [dispatch]
  );

  const changePage = useCallback(
    (page) => {
      dispatch(
        setTenantPage(page)
      );
    },
    [dispatch]
  );

  const changePerPage = useCallback(
    (perPage) => {
      dispatch(
        setTenantPerPage(perPage)
      );
    },
    [dispatch]
  );

  const resetFilters = useCallback(() => {
    dispatch(
      resetTenantFilters()
    );
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | CLEAR SEARCH
  |--------------------------------------------------------------------------
  */

  const clearSearch = useCallback(() => {
    dispatch(
      clearTenantSearch()
    );
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | CLEAR ERROR
  |--------------------------------------------------------------------------
  */

  const clearError = useCallback(() => {
    dispatch(
      clearTenantError()
    );
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | CLEAR SUCCESS
  |--------------------------------------------------------------------------
  */

  const clearSuccess = useCallback(() => {
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
    | STATUS
    |--------------------------------------------------------------------------
    */

    getActiveTenants,
    getPendingTenants,
    getInactiveTenants,
    getBlacklistedTenants,

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
    | RESTORE / FORCE DELETE
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