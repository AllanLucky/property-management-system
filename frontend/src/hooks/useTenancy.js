import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    fetchTenancies,
    fetchTenancy,
    createTenancy,
    updateTenancy,
    deleteTenancy,
    restoreTenancy,
    forceDeleteTenancy,
    activateTenancy,
    deactivateTenancy,
    renewTenancy,
    terminateTenancy,
    cancelTenancy,
    assignUnit,
    fetchTenancyStatistics,
    clearTenancyError,
    setTenancyFilters,
} from '../store/tenancySlice';

import {
    selectTenancies,
    selectTenancy,
    selectTenancyPagination,
    selectTenancyFilters,
    selectTenancyLoading,
    selectTenancyError,
    selectTenancyStatistics,
} from '../store/tenancySlice';

const useTenancy = () => {
    const dispatch = useDispatch();

    /*
    |--------------------------------------------------------------------------
    | Redux State
    |--------------------------------------------------------------------------
    */

    const tenancies = useSelector(selectTenancies);
    const tenancy = useSelector(selectTenancy);
    const pagination = useSelector(selectTenancyPagination);
    const filters = useSelector(selectTenancyFilters);
    const loading = useSelector(selectTenancyLoading);
    const error = useSelector(selectTenancyError);
    const statistics = useSelector(selectTenancyStatistics);

    /*
    |--------------------------------------------------------------------------
    | Derived State
    |--------------------------------------------------------------------------
    */

    const isLoading = useMemo(
        () => Boolean(loading),
        [loading]
    );

    const hasError = useMemo(
        () => Boolean(error),
        [error]
    );

    const hasTenancies = useMemo(
        () => Array.isArray(tenancies) && tenancies.length > 0,
        [tenancies]
    );

    const tenancyCount = useMemo(
        () => (Array.isArray(tenancies) ? tenancies.length : 0),
        [tenancies]
    );

    /*
    |--------------------------------------------------------------------------
    | Fetch Tenancies
    |--------------------------------------------------------------------------
    */

    const getTenancies = useCallback(
        (params = {}) => {
            return dispatch(
                fetchTenancies({
                    ...filters,
                    ...params,
                })
            );
        },
        [dispatch, filters]
    );

    /*
    |--------------------------------------------------------------------------
    | Fetch Single Tenancy
    |--------------------------------------------------------------------------
    */

    const getTenancy = useCallback(
        (id) => {
            if (!id) {
                return Promise.reject(
                    new Error('Tenancy ID is required.')
                );
            }

            return dispatch(fetchTenancy(id));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    */

    const addTenancy = useCallback(
        (data) => {
            return dispatch(createTenancy(data));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    const editTenancy = useCallback(
        (id, data) => {
            if (!id) {
                return Promise.reject(
                    new Error('Tenancy ID is required.')
                );
            }

            return dispatch(
                updateTenancy({
                    id,
                    data,
                })
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    const removeTenancy = useCallback(
        (id) => {
            if (!id) {
                return Promise.reject(
                    new Error('Tenancy ID is required.')
                );
            }

            return dispatch(deleteTenancy(id));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Restore
    |--------------------------------------------------------------------------
    */

    const restore = useCallback(
        (id) => {
            if (!id) {
                return Promise.reject(
                    new Error('Tenancy ID is required.')
                );
            }

            return dispatch(restoreTenancy(id));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Force Delete
    |--------------------------------------------------------------------------
    */

    const forceDelete = useCallback(
        (id) => {
            if (!id) {
                return Promise.reject(
                    new Error('Tenancy ID is required.')
                );
            }

            return dispatch(forceDeleteTenancy(id));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Activate
    |--------------------------------------------------------------------------
    */

    const activate = useCallback(
        (id) => {
            if (!id) {
                return Promise.reject(
                    new Error('Tenancy ID is required.')
                );
            }

            return dispatch(activateTenancy(id));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Deactivate
    |--------------------------------------------------------------------------
    */

    const deactivate = useCallback(
        (id) => {
            if (!id) {
                return Promise.reject(
                    new Error('Tenancy ID is required.')
                );
            }

            return dispatch(deactivateTenancy(id));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Renew
    |--------------------------------------------------------------------------
    */

    const renew = useCallback(
        (id, data) => {
            if (!id) {
                return Promise.reject(
                    new Error('Tenancy ID is required.')
                );
            }

            return dispatch(
                renewTenancy({
                    id,
                    data,
                })
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Terminate
    |--------------------------------------------------------------------------
    */

    const terminate = useCallback(
        (id, data = {}) => {
            if (!id) {
                return Promise.reject(
                    new Error('Tenancy ID is required.')
                );
            }

            return dispatch(
                terminateTenancy({
                    id,
                    data,
                })
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Cancel
    |--------------------------------------------------------------------------
    */

    const cancel = useCallback(
        (id, data = {}) => {
            if (!id) {
                return Promise.reject(
                    new Error('Tenancy ID is required.')
                );
            }

            return dispatch(
                cancelTenancy({
                    id,
                    data,
                })
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Assign Unit
    |--------------------------------------------------------------------------
    */

    const assign = useCallback(
        (data) => {
            return dispatch(assignUnit(data));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    const getStatistics = useCallback(
        () => {
            return dispatch(fetchTenancyStatistics());
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Filters
    |--------------------------------------------------------------------------
    */

    const updateFilters = useCallback(
        (newFilters) => {
            dispatch(setTenancyFilters(newFilters));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Clear Error
    |--------------------------------------------------------------------------
    */

    const clearError = useCallback(
        () => {
            dispatch(clearTenancyError());
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Return API
    |--------------------------------------------------------------------------
    */

    return {
        // Data
        tenancies,
        tenancy,
        pagination,
        filters,
        statistics,

        // Derived state
        loading: isLoading,
        isLoading,
        error,
        hasError,
        hasTenancies,
        tenancyCount,

        // CRUD
        getTenancies,
        getTenancy,
        addTenancy,
        editTenancy,
        removeTenancy,

        // Delete / restore
        restore,
        forceDelete,

        // Status
        activate,
        deactivate,
        renew,
        terminate,
        cancel,

        // Assignment
        assign,

        // Statistics
        getStatistics,

        // Filters / errors
        updateFilters,
        clearError,
    };
};

export default useTenancy;