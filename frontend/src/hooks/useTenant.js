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

  const creating = useSelector(selectTenantCreating);
  const updating = useSelector(selectTenantUpdating);
  const deleting = useSelector(selectTenantDeleting);
  const searching = useSelector(selectTenantSearching);

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

  const error = useSelector(selectTenantError);
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
    (params = {}) => {
      return dispatch(
        fetchTenants(params)
      ).unwrap();
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH SINGLE TENANT
  |--------------------------------------------------------------------------
  */

  const getTenant = useCallback(
    (tenantId) => {
      return dispatch(
        fetchTenant(tenantId)
      ).unwrap();
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | CREATE
  |--------------------------------------------------------------------------
  */

  const addTenant = useCallback(
    (tenantData) => {
      return dispatch(
        createTenant(tenantData)
      ).unwrap();
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE
  |--------------------------------------------------------------------------
  */

  const editTenant = useCallback(
    (tenantId, tenantData) => {
      return dispatch(
        updateTenant({
          tenantId,
          tenantData,
        })
      ).unwrap();
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const removeTenant = useCallback(
    (tenantId) => {
      return dispatch(
        deleteTenant(tenantId)
      ).unwrap();
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const search = useCallback(
    (searchValue, limit = 20) => {
      return dispatch(
        searchTenants({
          search: searchValue,
          limit,
        })
      ).unwrap();
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | ACTIVE TENANTS
  |--------------------------------------------------------------------------
  */

  const getActiveTenants = useCallback(() => {
    return dispatch(
      fetchActiveTenants()
    ).unwrap();
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | PENDING TENANTS
  |--------------------------------------------------------------------------
  */

  const getPendingTenants = useCallback(() => {
    return dispatch(
      fetchPendingTenants()
    ).unwrap();
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | INACTIVE TENANTS
  |--------------------------------------------------------------------------
  */

  const getInactiveTenants = useCallback(() => {
    return dispatch(
      fetchInactiveTenants()
    ).unwrap();
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | BLACKLISTED TENANTS
  |--------------------------------------------------------------------------
  */

  const getBlacklistedTenants = useCallback(() => {
    return dispatch(
      fetchBlacklistedTenants()
    ).unwrap();
  }, [dispatch]);

  /*
  |--------------------------------------------------------------------------
  | ACTIVATE
  |--------------------------------------------------------------------------
  */

  const activate = useCallback(
    (tenantId) => {
      return dispatch(
        activateTenant(tenantId)
      ).unwrap();
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | DEACTIVATE
  |--------------------------------------------------------------------------
  */

  const deactivate = useCallback(
    (tenantId) => {
      return dispatch(
        deactivateTenant(tenantId)
      ).unwrap();
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | BLACKLIST
  |--------------------------------------------------------------------------
  */

  const blacklist = useCallback(
    (tenantId) => {
      return dispatch(
        blacklistTenant(tenantId)
      ).unwrap();
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | SET PENDING
  |--------------------------------------------------------------------------
  */

  const setPending = useCallback(
    (tenantId) => {
      return dispatch(
        setTenantPending(tenantId)
      ).unwrap();
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | VERIFY
  |--------------------------------------------------------------------------
  */

  const verify = useCallback(
    (tenantId) => {
      return dispatch(
        verifyTenant(tenantId)
      ).unwrap();
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | UNVERIFY
  |--------------------------------------------------------------------------
  */

  const unverify = useCallback(
    (tenantId) => {
      return dispatch(
        unverifyTenant(tenantId)
      ).unwrap();
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | RESTORE
  |--------------------------------------------------------------------------
  */

  const restore = useCallback(
    (tenantId) => {
      return dispatch(
        restoreTenant(tenantId)
      ).unwrap();
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | FORCE DELETE
  |--------------------------------------------------------------------------
  */

  const forceDelete = useCallback(
    (tenantId) => {
      return dispatch(
        forceDeleteTenant(tenantId)
      ).unwrap();
    },
    [dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const getStatistics = useCallback(() => {
    return dispatch(
      fetchTenantStatistics()
    ).unwrap();
  }, [dispatch]);

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
  };
};

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

export default useTenant;