import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */
    fetchTenancies,
    fetchTenancy,
    createTenancy,
    updateTenancy,
    patchTenancy,
    deleteTenancy,

    /*
    |--------------------------------------------------------------------------
    | Restore / Force Delete
    |--------------------------------------------------------------------------
    */
    restoreTenancy,
    forceDeleteTenancy,

    /*
    |--------------------------------------------------------------------------
    | Status Management
    |--------------------------------------------------------------------------
    */
    activateTenancy,
    deactivateTenancy,
    renewTenancy,

    /*
    |--------------------------------------------------------------------------
    | Unit Assignment
    |--------------------------------------------------------------------------
    */
    assignUnit,

    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */
    fetchTenancyStatistics,

    /*
    |--------------------------------------------------------------------------
    | State Management
    |--------------------------------------------------------------------------
    */
    clearTenancyError,
    setTenancyFilters,
    clearTenancyFilters,

    /*
    |--------------------------------------------------------------------------
    | Selectors
    |--------------------------------------------------------------------------
    */
    selectTenancies,
    selectTenancy,
    selectTenancyPagination,
    selectTenancyFilters,
    selectTenancyLoading,
    selectTenancyError,
    selectTenancyStatistics,
    selectTenancyLoadingStatistics,
    selectTenancyCreating,
    selectTenancyUpdating,
    selectTenancyDeleting,
    selectTenancyRestoring,
    selectTenancyForceDeleting,
    selectTenancyActionLoading,
    selectTenancyStatisticsError,
    selectTenancyStatisticsErrorDetails,
    selectTenancyErrorDetails,
    selectTenancySuccess,
    selectHasTenancies,
    selectTenancyCount,
} from "../store/tenancySlice";

/*
|--------------------------------------------------------------------------
| useTenancy
|--------------------------------------------------------------------------
|
| Centralized React hook for tenancy management.
|
| Responsibilities:
|
| - Tenancy listing
| - Tenancy details
| - Create
| - Update
| - Patch
| - Delete
| - Restore
| - Force delete
| - Activate
| - Deactivate
| - Renew
| - Unit assignment
| - Statistics
| - Filters
| - Loading states
| - Error handling
|
| Tenant eligibility / duplicate tenant assignment is intentionally NOT
| managed here. Tenant data belongs to tenantSlice/useTenant.
|
|--------------------------------------------------------------------------
*/

const useTenancy = () => {
    const dispatch = useDispatch();

    /*
    |--------------------------------------------------------------------------
    | Redux State
    |--------------------------------------------------------------------------
    */

    const tenancies = useSelector(
        selectTenancies
    );

    const tenancy = useSelector(
        selectTenancy
    );

    const pagination = useSelector(
        selectTenancyPagination
    );

    const filters = useSelector(
        selectTenancyFilters
    );

    const loading = useSelector(
        selectTenancyLoading
    );

    const error = useSelector(
        selectTenancyError
    );

    const errorDetails = useSelector(
        selectTenancyErrorDetails
    );

    const success = useSelector(
        selectTenancySuccess
    );

    const statistics = useSelector(
        selectTenancyStatistics
    );

    /*
    |--------------------------------------------------------------------------
    | Individual Loading States
    |--------------------------------------------------------------------------
    */

    const loadingStatistics = useSelector(
        selectTenancyLoadingStatistics
    );

    const creating = useSelector(
        selectTenancyCreating
    );

    const updating = useSelector(
        selectTenancyUpdating
    );

    const deleting = useSelector(
        selectTenancyDeleting
    );

    const restoring = useSelector(
        selectTenancyRestoring
    );

    const forceDeleting = useSelector(
        selectTenancyForceDeleting
    );

    const actionLoading = useSelector(
        selectTenancyActionLoading
    );

    /*
    |--------------------------------------------------------------------------
    | Statistics Errors
    |--------------------------------------------------------------------------
    */

    const statisticsError = useSelector(
        selectTenancyStatisticsError
    );

    const statisticsErrorDetails = useSelector(
        selectTenancyStatisticsErrorDetails
    );

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

    const hasTenancies = useSelector(
        selectHasTenancies
    );

    const tenancyCount = useSelector(
        selectTenancyCount
    );

    const hasStatisticsError = useMemo(
        () => Boolean(statisticsError),
        [statisticsError]
    );

    /*
    |--------------------------------------------------------------------------
    | Internal Validation Helpers
    |--------------------------------------------------------------------------
    */

    const validateId = useCallback(
        (id) => {
            if (
                id === undefined ||
                id === null ||
                id === ""
            ) {
                return new Error(
                    "Tenancy ID is required."
                );
            }

            return null;
        },
        []
    );

    const validateObject = useCallback(
        (data, message) => {
            if (
                !data ||
                typeof data !== "object" ||
                Array.isArray(data)
            ) {
                return new Error(message);
            }

            return null;
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | FETCH TENANCIES
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch paginated tenancies.
     *
     * Current Redux filters are automatically merged with
     * optional parameters.
     *
     * Example:
     *
     * getTenancies({
     *     page: 1,
     *     search: "John",
     *     status: "active"
     * });
     */
    const getTenancies = useCallback(
        (params = {}) => {
            if (
                !params ||
                typeof params !== "object" ||
                Array.isArray(params)
            ) {
                params = {};
            }

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
    | FETCH SINGLE TENANCY
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch one tenancy.
     */
    const getTenancy = useCallback(
        (id) => {
            const validationError =
                validateId(id);

            if (validationError) {
                return Promise.reject(
                    validationError
                );
            }

            return dispatch(
                fetchTenancy(id)
            );
        },
        [dispatch, validateId]
    );

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new tenancy.
     */
    const addTenancy = useCallback(
        (data) => {
            const validationError =
                validateObject(
                    data,
                    "Tenancy data is required."
                );

            if (validationError) {
                return Promise.reject(
                    validationError
                );
            }

            return dispatch(
                createTenancy(data)
            );
        },
        [dispatch, validateObject]
    );

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    /**
     * Update an existing tenancy.
     */
    const editTenancy = useCallback(
        (id, data) => {
            const idError =
                validateId(id);

            if (idError) {
                return Promise.reject(
                    idError
                );
            }

            const dataError =
                validateObject(
                    data,
                    "Tenancy data is required."
                );

            if (dataError) {
                return Promise.reject(
                    dataError
                );
            }

            return dispatch(
                updateTenancy({
                    id,
                    data,
                })
            );
        },
        [
            dispatch,
            validateId,
            validateObject,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | PATCH
    |--------------------------------------------------------------------------
    */

    /**
     * Partially update an existing tenancy.
     */
    const patch = useCallback(
        (id, data) => {
            const idError =
                validateId(id);

            if (idError) {
                return Promise.reject(
                    idError
                );
            }

            const dataError =
                validateObject(
                    data,
                    "Tenancy data is required."
                );

            if (dataError) {
                return Promise.reject(
                    dataError
                );
            }

            return dispatch(
                patchTenancy({
                    id,
                    data,
                })
            );
        },
        [
            dispatch,
            validateId,
            validateObject,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete tenancy.
     */
    const removeTenancy = useCallback(
        (id) => {
            const validationError =
                validateId(id);

            if (validationError) {
                return Promise.reject(
                    validationError
                );
            }

            return dispatch(
                deleteTenancy(id)
            );
        },
        [dispatch, validateId]
    );

    /*
    |--------------------------------------------------------------------------
    | RESTORE
    |--------------------------------------------------------------------------
    */

    /**
     * Restore a soft-deleted tenancy.
     */
    const restore = useCallback(
        (id) => {
            const validationError =
                validateId(id);

            if (validationError) {
                return Promise.reject(
                    validationError
                );
            }

            return dispatch(
                restoreTenancy(id)
            );
        },
        [dispatch, validateId]
    );

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete tenancy.
     */
    const forceDelete = useCallback(
        (id) => {
            const validationError =
                validateId(id);

            if (validationError) {
                return Promise.reject(
                    validationError
                );
            }

            return dispatch(
                forceDeleteTenancy(id)
            );
        },
        [dispatch, validateId]
    );

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE
    |--------------------------------------------------------------------------
    */

    /**
     * Activate tenancy.
     */
    const activate = useCallback(
        (id) => {
            const validationError =
                validateId(id);

            if (validationError) {
                return Promise.reject(
                    validationError
                );
            }

            return dispatch(
                activateTenancy(id)
            );
        },
        [dispatch, validateId]
    );

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE
    |--------------------------------------------------------------------------
    */

    /**
     * Deactivate tenancy.
     */
    const deactivate = useCallback(
        (id) => {
            const validationError =
                validateId(id);

            if (validationError) {
                return Promise.reject(
                    validationError
                );
            }

            return dispatch(
                deactivateTenancy(id)
            );
        },
        [dispatch, validateId]
    );

    /*
    |--------------------------------------------------------------------------
    | RENEW
    |--------------------------------------------------------------------------
    */

    /**
     * Renew tenancy.
     *
     * Example:
     *
     * renew(26, {
     *     end_date: "2027-08-22"
     * });
     */
    const renew = useCallback(
        (id, data) => {
            const idError =
                validateId(id);

            if (idError) {
                return Promise.reject(
                    idError
                );
            }

            const dataError =
                validateObject(
                    data,
                    "Renewal data is required."
                );

            if (dataError) {
                return Promise.reject(
                    dataError
                );
            }

            return dispatch(
                renewTenancy({
                    id,
                    data,
                })
            );
        },
        [
            dispatch,
            validateId,
            validateObject,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | ASSIGN UNIT
    |--------------------------------------------------------------------------
    */

    /**
     * Assign a unit to a tenant.
     *
     * Example:
     *
     * assign({
     *     tenant_id: 2,
     *     unit_id: 344,
     *     start_date: "2026-08-22",
     *     end_date: "2027-08-22",
     *     rent_amount: 25000,
     *     deposit_amount: 50000
     * });
     */
    const assign = useCallback(
        (data) => {
            const validationError =
                validateObject(
                    data,
                    "Assignment data is required."
                );

            if (validationError) {
                return Promise.reject(
                    validationError
                );
            }

            return dispatch(
                assignUnit(data)
            );
        },
        [dispatch, validateObject]
    );

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch tenancy statistics.
     *
     * Statistics have an independent loading state and
     * do not interfere with tenancy table loading.
     */
    const getStatistics = useCallback(
        () => {
            return dispatch(
                fetchTenancyStatistics()
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */

    /**
     * Update tenancy filters.
     *
     * Automatically resets the page to 1 when
     * the caller does not explicitly provide a page.
     */
    const updateFilters = useCallback(
        (newFilters) => {
            if (
                !newFilters ||
                typeof newFilters !== "object" ||
                Array.isArray(newFilters)
            ) {
                return;
            }

            dispatch(
                setTenancyFilters(
                    newFilters
                )
            );
        },
        [dispatch]
    );

    /**
     * Clear all tenancy filters.
     *
     * Uses the slice's canonical DEFAULT_FILTERS
     * through clearTenancyFilters().
     */
    const clearFilters = useCallback(
        () => {
            dispatch(
                clearTenancyFilters()
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | CLEAR ERROR
    |--------------------------------------------------------------------------
    */

    const clearError = useCallback(
        () => {
            dispatch(
                clearTenancyError()
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | RETURN API
    |--------------------------------------------------------------------------
    */

    return {
        /*
        |--------------------------------------------------------------------------
        | Data
        |--------------------------------------------------------------------------
        */

        tenancies,
        tenancy,
        pagination,
        filters,
        statistics,

        /*
        |--------------------------------------------------------------------------
        | General Loading
        |--------------------------------------------------------------------------
        */

        loading: isLoading,
        isLoading,

        /*
        |--------------------------------------------------------------------------
        | Individual Loading States
        |--------------------------------------------------------------------------
        */

        creating,
        updating,
        deleting,
        restoring,
        forceDeleting,
        actionLoading,
        loadingStatistics,

        /*
        |--------------------------------------------------------------------------
        | Error
        |--------------------------------------------------------------------------
        */

        error,
        errorDetails,
        hasError,

        /*
        |--------------------------------------------------------------------------
        | Statistics Error
        |--------------------------------------------------------------------------
        */

        statisticsError,
        statisticsErrorDetails,
        hasStatisticsError,

        /*
        |--------------------------------------------------------------------------
        | Success
        |--------------------------------------------------------------------------
        */

        success,

        /*
        |--------------------------------------------------------------------------
        | Derived State
        |--------------------------------------------------------------------------
        */

        hasTenancies,
        tenancyCount,

        /*
        |--------------------------------------------------------------------------
        | CRUD
        |--------------------------------------------------------------------------
        */

        getTenancies,
        getTenancy,
        addTenancy,
        editTenancy,
        patch,
        removeTenancy,

        /*
        |--------------------------------------------------------------------------
        | Delete / Restore
        |--------------------------------------------------------------------------
        */

        restore,
        forceDelete,

        /*
        |--------------------------------------------------------------------------
        | Status Management
        |--------------------------------------------------------------------------
        */

        activate,
        deactivate,
        renew,

        /*
        |--------------------------------------------------------------------------
        | Unit Assignment
        |--------------------------------------------------------------------------
        */

        assign,

        /*
        |--------------------------------------------------------------------------
        | Statistics
        |--------------------------------------------------------------------------
        */

        getStatistics,

        /*
        |--------------------------------------------------------------------------
        | Filters
        |--------------------------------------------------------------------------
        */

        updateFilters,
        clearFilters,

        /*
        |--------------------------------------------------------------------------
        | Error Management
        |--------------------------------------------------------------------------
        */

        clearError,
    };
};

export default useTenancy;