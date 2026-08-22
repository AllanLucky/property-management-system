import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

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
    assignUnit,
    fetchTenancyStatistics,
    clearTenancyError,
    setTenancyFilters,
} from "../store/tenancySlice";

import {
    selectTenancies,
    selectTenancy,
    selectTenancyPagination,
    selectTenancyFilters,
    selectTenancyLoading,
    selectTenancyError,
    selectTenancyStatistics,
} from "../store/tenancySlice";

/*
|--------------------------------------------------------------------------
| useTenancy
|--------------------------------------------------------------------------
|
| Centralized React hook for tenancy management.
|
| This hook provides:
|
| - Tenancy listing
| - Tenancy details
| - Create
| - Update
| - Delete
| - Restore
| - Force delete
| - Activate
| - Deactivate
| - Renew
| - Unit assignment
| - Statistics
| - Filters
| - Error handling
|
*/

const useTenancy = () => {
    const dispatch = useDispatch();

    /*
    |--------------------------------------------------------------------------
    | Redux State
    |--------------------------------------------------------------------------
    */

    const tenancies = useSelector(selectTenancies);

    const tenancy = useSelector(selectTenancy);

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

    const statistics = useSelector(
        selectTenancyStatistics
    );

    /*
    |--------------------------------------------------------------------------
    | Derived State
    |--------------------------------------------------------------------------
    */

    /**
     * Whether any tenancy request is currently loading.
     */
    const isLoading = useMemo(
        () => Boolean(loading),
        [loading]
    );

    /**
     * Whether the tenancy state contains an error.
     */
    const hasError = useMemo(
        () => Boolean(error),
        [error]
    );

    /**
     * Whether tenancies exist.
     */
    const hasTenancies = useMemo(
        () =>
            Array.isArray(tenancies) &&
            tenancies.length > 0,
        [tenancies]
    );

    /**
     * Number of currently loaded tenancies.
     *
     * NOTE:
     * This is the number of records currently loaded in Redux,
     * not necessarily the total number of records in the database.
     */
    const tenancyCount = useMemo(
        () =>
            Array.isArray(tenancies)
                ? tenancies.length
                : 0,
        [tenancies]
    );

    /*
    |--------------------------------------------------------------------------
    | Fetch Tenancies
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch paginated tenancies.
     *
     * Merges current Redux filters with optional parameters.
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

    /**
     * Fetch a single tenancy.
     */
    const getTenancy = useCallback(
        (id) => {
            if (
                id === undefined ||
                id === null ||
                id === ""
            ) {
                return Promise.reject(
                    new Error(
                        "Tenancy ID is required."
                    )
                );
            }

            return dispatch(
                fetchTenancy(id)
            );
        },
        [dispatch]
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
            if (
                !data ||
                typeof data !== "object" ||
                Array.isArray(data)
            ) {
                return Promise.reject(
                    new Error(
                        "Tenancy data is required."
                    )
                );
            }

            return dispatch(
                createTenancy(data)
            );
        },
        [dispatch]
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
            if (
                id === undefined ||
                id === null ||
                id === ""
            ) {
                return Promise.reject(
                    new Error(
                        "Tenancy ID is required."
                    )
                );
            }

            if (
                !data ||
                typeof data !== "object" ||
                Array.isArray(data)
            ) {
                return Promise.reject(
                    new Error(
                        "Tenancy data is required."
                    )
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
    | DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete a tenancy.
     */
    const removeTenancy = useCallback(
        (id) => {
            if (
                id === undefined ||
                id === null ||
                id === ""
            ) {
                return Promise.reject(
                    new Error(
                        "Tenancy ID is required."
                    )
                );
            }

            return dispatch(
                deleteTenancy(id)
            );
        },
        [dispatch]
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
            if (
                id === undefined ||
                id === null ||
                id === ""
            ) {
                return Promise.reject(
                    new Error(
                        "Tenancy ID is required."
                    )
                );
            }

            return dispatch(
                restoreTenancy(id)
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete a tenancy.
     */
    const forceDelete = useCallback(
        (id) => {
            if (
                id === undefined ||
                id === null ||
                id === ""
            ) {
                return Promise.reject(
                    new Error(
                        "Tenancy ID is required."
                    )
                );
            }

            return dispatch(
                forceDeleteTenancy(id)
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE
    |--------------------------------------------------------------------------
    */

    /**
     * Activate a tenancy.
     */
    const activate = useCallback(
        (id) => {
            if (
                id === undefined ||
                id === null ||
                id === ""
            ) {
                return Promise.reject(
                    new Error(
                        "Tenancy ID is required."
                    )
                );
            }

            return dispatch(
                activateTenancy(id)
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE
    |--------------------------------------------------------------------------
    */

    /**
     * Deactivate a tenancy.
     */
    const deactivate = useCallback(
        (id) => {
            if (
                id === undefined ||
                id === null ||
                id === ""
            ) {
                return Promise.reject(
                    new Error(
                        "Tenancy ID is required."
                    )
                );
            }

            return dispatch(
                deactivateTenancy(id)
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | RENEW
    |--------------------------------------------------------------------------
    */

    /**
     * Renew an existing tenancy.
     *
     * Expected data:
     *
     * {
     *     end_date: "YYYY-MM-DD"
     * }
     */
    const renew = useCallback(
        (id, data) => {
            if (
                id === undefined ||
                id === null ||
                id === ""
            ) {
                return Promise.reject(
                    new Error(
                        "Tenancy ID is required."
                    )
                );
            }

            if (
                !data ||
                typeof data !== "object" ||
                Array.isArray(data)
            ) {
                return Promise.reject(
                    new Error(
                        "Renewal data is required."
                    )
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
    | ASSIGN UNIT
    |--------------------------------------------------------------------------
    */

    /**
     * Assign a unit to a tenant.
     *
     * Expected data:
     *
     * {
     *     tenant_id,
     *     unit_id,
     *     start_date,
     *     end_date,
     *     rent_amount,
     *     deposit_amount
     * }
     */
    const assign = useCallback(
        (data) => {
            if (
                !data ||
                typeof data !== "object" ||
                Array.isArray(data)
            ) {
                return Promise.reject(
                    new Error(
                        "Assignment data is required."
                    )
                );
            }

            return dispatch(
                assignUnit(data)
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch tenancy statistics.
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

    /*
    |--------------------------------------------------------------------------
    | CLEAR ERROR
    |--------------------------------------------------------------------------
    */

    /**
     * Clear tenancy error.
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
        |----------------------------------------------------------------------
        | Data
        |----------------------------------------------------------------------
        */

        tenancies,
        tenancy,
        pagination,
        filters,
        statistics,

        /*
        |----------------------------------------------------------------------
        | Loading / Error
        |----------------------------------------------------------------------
        */

        loading: isLoading,
        isLoading,

        error,
        hasError,

        /*
        |----------------------------------------------------------------------
        | Derived
        |----------------------------------------------------------------------
        */

        hasTenancies,
        tenancyCount,

        /*
        |----------------------------------------------------------------------
        | CRUD
        |----------------------------------------------------------------------
        */

        getTenancies,
        getTenancy,
        addTenancy,
        editTenancy,
        removeTenancy,

        /*
        |----------------------------------------------------------------------
        | Delete / Restore
        |----------------------------------------------------------------------
        */

        restore,
        forceDelete,

        /*
        |----------------------------------------------------------------------
        | Status
        |----------------------------------------------------------------------
        */

        activate,
        deactivate,
        renew,

        /*
        |----------------------------------------------------------------------
        | Unit Assignment
        |----------------------------------------------------------------------
        */

        assign,

        /*
        |----------------------------------------------------------------------
        | Statistics
        |----------------------------------------------------------------------
        */

        getStatistics,

        /*
        |----------------------------------------------------------------------
        | Filters / Errors
        |----------------------------------------------------------------------
        */

        updateFilters,
        clearError,
    };
};

export default useTenancy;