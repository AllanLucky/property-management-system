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
    | Search
    |--------------------------------------------------------------------------
    */
    searchTenancies,

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
    terminateTenancy,
    cancelTenancy,

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
} from "../store/tenancySlice";

import {
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
} from "../store/tenancySlice";

/*
|--------------------------------------------------------------------------
| useTenancy
|--------------------------------------------------------------------------
|
| Centralized React hook for tenancy management.
|
| Provides:
|
| - Tenancy listing
| - Tenancy details
| - Search
| - Create
| - Update
| - Patch
| - Delete
| - Restore
| - Force delete
| - Activate
| - Deactivate
| - Renew
| - Terminate
| - Cancel
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
     * This is the number currently stored in Redux,
     * not necessarily the database total.
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
    | Internal Validation Helpers
    |--------------------------------------------------------------------------
    */

    const validateId = useCallback((id) => {
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
    }, []);

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
    | Fetch Tenancies
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch paginated tenancies.
     *
     * Current Redux filters are merged with
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
    | Search
    |--------------------------------------------------------------------------
    */

    /**
     * Search tenancies.
     *
     * This uses the Redux searchTenancies thunk
     * when available.
     */
    const search = useCallback(
        (searchTerm = "", params = {}) => {
            return dispatch(
                searchTenancies({
                    search: searchTerm,
                    ...params,
                })
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
     * renew(id, {
     *     end_date: "2027-03-18"
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
    | TERMINATE
    |--------------------------------------------------------------------------
    */

    /**
     * Terminate tenancy.
     *
     * Example:
     *
     * terminate(id, {
     *     termination_date: "2026-08-22",
     *     reason: "Tenant moved out"
     * });
     */
    const terminate = useCallback(
        (id, data = {}) => {
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
                    "Termination data is required."
                );

            if (dataError) {
                return Promise.reject(
                    dataError
                );
            }

            return dispatch(
                terminateTenancy({
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
    | CANCEL
    |--------------------------------------------------------------------------
    */

    /**
     * Cancel tenancy.
     */
    const cancel = useCallback(
        (id, data = {}) => {
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
                    "Cancellation data is required."
                );

            if (dataError) {
                return Promise.reject(
                    dataError
                );
            }

            return dispatch(
                cancelTenancy({
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
     * Example:
     *
     * updateFilters({
     *     search: "John",
     *     status: "active"
     * });
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
     */
    const clearFilters = useCallback(
        () => {
            dispatch(
                setTenancyFilters({
                    search: "",
                    status: "",
                    property_id: "",
                    apartment_id: "",
                    unit_id: "",
                    tenant_id: "",
                    payment_frequency: "",
                    start_date: "",
                    end_date: "",
                    page: 1,
                    per_page: 10,
                    sort_by: "",
                    sort_order: "",
                })
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
        | Derived State
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
        patch,
        removeTenancy,

        /*
        |----------------------------------------------------------------------
        | Search
        |----------------------------------------------------------------------
        */

        search,

        /*
        |----------------------------------------------------------------------
        | Delete / Restore
        |----------------------------------------------------------------------
        */

        restore,
        forceDelete,

        /*
        |----------------------------------------------------------------------
        | Status Management
        |----------------------------------------------------------------------
        */

        activate,
        deactivate,
        renew,
        terminate,
        cancel,

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
        | Filters
        |----------------------------------------------------------------------
        */

        updateFilters,
        clearFilters,

        /*
        |----------------------------------------------------------------------
        | Error
        |----------------------------------------------------------------------
        */

        clearError,
    };
};

export default useTenancy;