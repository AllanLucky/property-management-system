import {
    useCallback,
    useMemo,
} from "react";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import {
    fetchLeases,
    fetchLease,
    createLease,
    updateLease,
    patchLease,
    deleteLease,
    restoreLease,
    forceDeleteLease,
    activateLease,
    signLease,
    terminateLease,
    cancelLease,
    fetchLeaseStatistics,
    uploadLeaseDocument,
    deleteLeaseDocument,
    clearLeaseError,
    clearCurrentLease,
    clearLeaseMessage,
    resetLeaseState,
} from "../store/leaseSlice";

/*
|--------------------------------------------------------------------------
| useLease
|--------------------------------------------------------------------------
|
| Centralized React hook for Lease state and operations.
|
| IMPORTANT:
| This hook uses a NAMED EXPORT:
|
|     import { useLease } from "../../../hooks/useLease";
|
| The Redux store is expected to register the reducer as:
|
|     leases: leaseReducer
|
| Therefore the selector below intentionally uses:
|
|     state.leases
|
|--------------------------------------------------------------------------
*/

export const useLease = () => {
    const dispatch = useDispatch();

    /*
    |--------------------------------------------------------------------------
    | Redux State
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | The Redux store uses:
    |
    |     leases: leaseReducer
    |
    | Therefore this MUST be state.leases rather than state.lease.
    |
    */

    const leaseState = useSelector(
        (state) => state.leases || {}
    );

    /*
    |--------------------------------------------------------------------------
    | Core State
    |--------------------------------------------------------------------------
    */

    const {
        leases = [],
        currentLease = null,
        selectedLease = null,

        statistics = null,

        pagination = null,

        loading = false,
        loadingList = false,
        loadingDetails = false,
        loadingCreate = false,
        loadingUpdate = false,
        loadingDelete = false,
        loadingRestore = false,
        loadingLifecycle = false,
        loadingStatistics = false,
        loadingDocument = false,

        error = null,
        errors = null,

        message = null,

        success = false,
    } = leaseState;

    /*
    |--------------------------------------------------------------------------
    | Fetch Leases
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch leases with optional filters and pagination.
     *
     * Example:
     *
     * fetchAll({
     *     page: 1,
     *     per_page: 15,
     *     search: "LSE-000005",
     *     status: "active",
     * });
     */
    const fetchAll = useCallback(
        (params = {}) => {
            return dispatch(
                fetchLeases(params)
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Fetch Single Lease
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch one lease by ID.
     */
    const fetchOne = useCallback(
        (leaseId) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(
                fetchLease(leaseId)
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Create Lease
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new lease.
     */
    const create = useCallback(
        (payload) => {
            if (!payload) {
                return Promise.reject(
                    new Error("Lease payload is required.")
                );
            }

            return dispatch(
                createLease(payload)
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Update Lease
    |--------------------------------------------------------------------------
    */

    /**
     * Fully update an existing lease.
     */
    const update = useCallback(
        (leaseId, payload) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            if (!payload) {
                return Promise.reject(
                    new Error("Lease payload is required.")
                );
            }

            return dispatch(
                updateLease({
                    leaseId,
                    payload,
                })
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Patch Lease
    |--------------------------------------------------------------------------
    */

    /**
     * Partially update an existing lease.
     */
    const patch = useCallback(
        (leaseId, payload) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            if (!payload) {
                return Promise.reject(
                    new Error("Lease payload is required.")
                );
            }

            return dispatch(
                patchLease({
                    leaseId,
                    payload,
                })
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Delete Lease
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete a lease.
     */
    const remove = useCallback(
        (leaseId) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(
                deleteLease(leaseId)
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Restore Lease
    |--------------------------------------------------------------------------
    */

    /**
     * Restore a soft-deleted lease.
     */
    const restore = useCallback(
        (leaseId) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(
                restoreLease(leaseId)
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Force Delete Lease
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete a lease.
     */
    const forceDelete = useCallback(
        (leaseId) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(
                forceDeleteLease(leaseId)
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Lease Lifecycle
    |--------------------------------------------------------------------------
    */

    /**
     * Activate lease.
     */
    const activate = useCallback(
        (leaseId) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(
                activateLease(leaseId)
            );
        },
        [dispatch]
    );

    /**
     * Sign lease.
     *
     * Payload is optional because some APIs only require
     * the lease ID for signing.
     */
    const sign = useCallback(
        (leaseId, payload = {}) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(
                signLease({
                    leaseId,
                    payload,
                })
            );
        },
        [dispatch]
    );

    /**
     * Terminate lease.
     */
    const terminate = useCallback(
        (leaseId, payload = {}) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(
                terminateLease({
                    leaseId,
                    payload,
                })
            );
        },
        [dispatch]
    );

    /**
     * Cancel lease.
     */
    const cancel = useCallback(
        (leaseId, payload = {}) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(
                cancelLease({
                    leaseId,
                    payload,
                })
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch lease statistics.
     */
    const fetchStatistics = useCallback(
        (params = {}) => {
            return dispatch(
                fetchLeaseStatistics(params)
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Lease Documents
    |--------------------------------------------------------------------------
    */

    /**
     * Upload a lease document.
     *
     * @param {number|string} leaseId
     * @param {FormData} formData
     */
    const uploadDocument = useCallback(
        (leaseId, formData) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            if (!formData) {
                return Promise.reject(
                    new Error("Document data is required.")
                );
            }

            return dispatch(
                uploadLeaseDocument({
                    leaseId,
                    formData,
                })
            );
        },
        [dispatch]
    );

    /**
     * Delete a lease document.
     */
    const deleteDocument = useCallback(
        (leaseId) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(
                deleteLeaseDocument(leaseId)
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | State Cleanup
    |--------------------------------------------------------------------------
    */

    /**
     * Clear current/single lease.
     */
    const clearCurrent = useCallback(
        () => {
            dispatch(
                clearCurrentLease()
            );
        },
        [dispatch]
    );

    /**
     * Clear lease errors.
     */
    const clearError = useCallback(
        () => {
            dispatch(
                clearLeaseError()
            );
        },
        [dispatch]
    );

    /**
     * Clear lease success/message state.
     */
    const clearMessage = useCallback(
        () => {
            dispatch(
                clearLeaseMessage()
            );
        },
        [dispatch]
    );

    /**
     * Reset the complete lease state.
     */
    const reset = useCallback(
        () => {
            dispatch(
                resetLeaseState()
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Derived State
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether there are no leases.
     */
    const isEmpty = useMemo(
        () =>
            !loadingList &&
            Array.isArray(leases) &&
            leases.length === 0,
        [
            loadingList,
            leases,
        ]
    );

    /**
     * Determine whether any lease operation is loading.
     */
    const isBusy = useMemo(
        () =>
            Boolean(
                loading ||
                loadingList ||
                loadingDetails ||
                loadingCreate ||
                loadingUpdate ||
                loadingDelete ||
                loadingRestore ||
                loadingLifecycle ||
                loadingStatistics ||
                loadingDocument
            ),
        [
            loading,
            loadingList,
            loadingDetails,
            loadingCreate,
            loadingUpdate,
            loadingDelete,
            loadingRestore,
            loadingLifecycle,
            loadingStatistics,
            loadingDocument,
        ]
    );

    /**
     * Determine whether lease creation is running.
     */
    const isCreating = useMemo(
        () => Boolean(loadingCreate),
        [loadingCreate]
    );

    /**
     * Determine whether lease update is running.
     */
    const isUpdating = useMemo(
        () => Boolean(loadingUpdate),
        [loadingUpdate]
    );

    /**
     * Determine whether lease deletion is running.
     */
    const isDeleting = useMemo(
        () => Boolean(loadingDelete),
        [loadingDelete]
    );

    /**
     * Determine whether statistics are loading.
     */
    const isLoadingStatistics = useMemo(
        () => Boolean(loadingStatistics),
        [loadingStatistics]
    );

    /**
     * Determine whether a document operation is running.
     */
    const isDocumentLoading = useMemo(
        () => Boolean(loadingDocument),
        [loadingDocument]
    );

    /**
     * Determine whether there is a lease error.
     */
    const hasError = useMemo(
        () => Boolean(error || errors),
        [
            error,
            errors,
        ]
    );

    /**
     * Determine whether the latest operation succeeded.
     */
    const isSuccess = useMemo(
        () => Boolean(success),
        [success]
    );

    /*
    |--------------------------------------------------------------------------
    | Lease Lookup Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Find a lease by ID in the currently loaded collection.
     */
    const findLease = useCallback(
        (leaseId) => {
            if (
                !leaseId ||
                !Array.isArray(leases)
            ) {
                return null;
            }

            return (
                leases.find(
                    (lease) =>
                        String(lease?.id) ===
                        String(leaseId)
                ) || null
            );
        },
        [leases]
    );

    /**
     * Find lease by lease number.
     */
    const findByLeaseNumber = useCallback(
        (leaseNumber) => {
            if (
                !leaseNumber ||
                !Array.isArray(leases)
            ) {
                return null;
            }

            const normalizedLeaseNumber =
                String(leaseNumber)
                    .trim()
                    .toLowerCase();

            return (
                leases.find(
                    (lease) =>
                        String(
                            lease?.lease_number || ""
                        )
                            .trim()
                            .toLowerCase() ===
                        normalizedLeaseNumber
                ) || null
            );
        },
        [leases]
    );

    /**
     * Find lease by tenancy ID.
     */
    const findByTenancy = useCallback(
        (tenancyId) => {
            if (
                !tenancyId ||
                !Array.isArray(leases)
            ) {
                return null;
            }

            return (
                leases.find(
                    (lease) =>
                        String(
                            lease?.tenancy_id ??
                            lease?.tenancy?.id ??
                            ""
                        ) ===
                        String(tenancyId)
                ) || null
            );
        },
        [leases]
    );

    /*
    |--------------------------------------------------------------------------
    | Tenant Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Get tenant from lease.
     *
     * Expected relationship:
     *
     * lease
     *   └── tenancy
     *       └── tenant
     */
    const getTenant = useCallback(
        (lease) => {
            return (
                lease?.tenancy?.tenant ||
                lease?.tenant ||
                null
            );
        },
        []
    );

    /**
     * Get tenant full name.
     */
    const getTenantName = useCallback(
        (lease) => {
            const tenant =
                lease?.tenancy?.tenant ||
                lease?.tenant ||
                null;

            if (!tenant) {
                return "—";
            }

            return (
                tenant.full_name ||
                [
                    tenant.first_name,
                    tenant.other_names,
                    tenant.last_name,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .trim() ||
                "—"
            );
        },
        []
    );

    /**
     * Get tenant email.
     */
    const getTenantEmail = useCallback(
        (lease) => {
            return (
                lease?.tenancy?.tenant?.email ||
                lease?.tenant?.email ||
                lease?.tenancy?.user?.email ||
                lease?.user?.email ||
                "—"
            );
        },
        []
    );

    /**
     * Get tenant phone.
     */
    const getTenantPhone = useCallback(
        (lease) => {
            return (
                lease?.tenancy?.tenant?.phone ||
                lease?.tenant?.phone ||
                lease?.tenancy?.user?.phone ||
                lease?.user?.phone ||
                "—"
            );
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | Property Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Get property ID.
     */
    const getPropertyId = useCallback(
        (lease) => {
            return (
                lease?.tenancy?.property_id ??
                lease?.property_id ??
                null
            );
        },
        []
    );

    /**
     * Get apartment ID.
     */
    const getApartmentId = useCallback(
        (lease) => {
            return (
                lease?.tenancy?.apartment_id ??
                lease?.apartment_id ??
                null
            );
        },
        []
    );

    /**
     * Get unit ID.
     */
    const getUnitId = useCallback(
        (lease) => {
            return (
                lease?.tenancy?.unit_id ??
                lease?.unit_id ??
                null
            );
        },
        []
    );

    /**
     * Get property object.
     */
    const getProperty = useCallback(
        (lease) => {
            return (
                lease?.tenancy?.property ||
                lease?.property ||
                null
            );
        },
        []
    );

    /**
     * Get apartment object.
     */
    const getApartment = useCallback(
        (lease) => {
            return (
                lease?.tenancy?.apartment ||
                lease?.apartment ||
                null
            );
        },
        []
    );

    /**
     * Get unit object.
     */
    const getUnit = useCallback(
        (lease) => {
            return (
                lease?.tenancy?.unit ||
                lease?.unit ||
                null
            );
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | Status Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether lease is active.
     */
    const isActiveLease = useCallback(
        (lease) => {
            return Boolean(
                lease?.is_active ||
                lease?.status === "active"
            );
        },
        []
    );

    /**
     * Determine whether lease is expired.
     */
    const isExpiredLease = useCallback(
        (lease) => {
            return Boolean(
                lease?.is_expired ||
                lease?.status === "expired"
            );
        },
        []
    );

    /**
     * Determine whether lease is terminated.
     */
    const isTerminatedLease = useCallback(
        (lease) => {
            return Boolean(
                lease?.is_terminated ||
                lease?.status === "terminated"
            );
        },
        []
    );

    /**
     * Determine whether lease is draft.
     */
    const isDraftLease = useCallback(
        (lease) => {
            return (
                lease?.status === "draft"
            );
        },
        []
    );

    /**
     * Determine whether lease is cancelled.
     */
    const isCancelledLease = useCallback(
        (lease) => {
            return (
                lease?.status === "cancelled"
            );
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | Financial Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Get rent amount.
     */
    const getRentAmount = useCallback(
        (lease) => {
            return (
                lease?.rent_amount ??
                lease?.tenancy?.rent_amount ??
                0
            );
        },
        []
    );

    /**
     * Get deposit amount.
     */
    const getDepositAmount = useCallback(
        (lease) => {
            return (
                lease?.deposit_amount ??
                lease?.tenancy?.deposit_amount ??
                0
            );
        },
        []
    );

    /**
     * Get service charge.
     */
    const getServiceCharge = useCallback(
        (lease) => {
            return (
                lease?.service_charge ??
                lease?.tenancy?.service_charge ??
                0
            );
        },
        []
    );

    /**
     * Get late fee.
     */
    const getLateFee = useCallback(
        (lease) => {
            return (
                lease?.late_fee ??
                lease?.tenancy?.late_fee ??
                0
            );
        },
        []
    );

    /**
     * Get payment frequency.
     */
    const getPaymentFrequency = useCallback(
        (lease) => {
            return (
                lease?.payment_frequency ??
                lease?.tenancy?.payment_frequency ??
                null
            );
        },
        []
    );

    /**
     * Get due day.
     */
    const getDueDay = useCallback(
        (lease) => {
            return (
                lease?.due_day ??
                lease?.tenancy?.due_day ??
                null
            );
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | Memoized API
    |--------------------------------------------------------------------------
    */

    return useMemo(
        () => ({
            /*
            |--------------------------------------------------------------------------
            | State
            |--------------------------------------------------------------------------
            */

            leases,

            currentLease,

            selectedLease,

            statistics,

            pagination,

            loading,

            loadingList,

            loadingDetails,

            loadingCreate,

            loadingUpdate,

            loadingDelete,

            loadingRestore,

            loadingLifecycle,

            loadingStatistics,

            loadingDocument,

            error,

            errors,

            message,

            success,

            /*
            |--------------------------------------------------------------------------
            | Derived State
            |--------------------------------------------------------------------------
            */

            isEmpty,

            isBusy,

            isCreating,

            isUpdating,

            isDeleting,

            isLoadingStatistics,

            isDocumentLoading,

            hasError,

            isSuccess,

            /*
            |--------------------------------------------------------------------------
            | CRUD
            |--------------------------------------------------------------------------
            */

            fetchAll,

            fetchOne,

            create,

            update,

            patch,

            remove,

            restore,

            forceDelete,

            /*
            |--------------------------------------------------------------------------
            | Lifecycle
            |--------------------------------------------------------------------------
            */

            activate,

            sign,

            terminate,

            cancel,

            /*
            |--------------------------------------------------------------------------
            | Statistics
            |--------------------------------------------------------------------------
            */

            fetchStatistics,

            /*
            |--------------------------------------------------------------------------
            | Documents
            |--------------------------------------------------------------------------
            */

            uploadDocument,

            deleteDocument,

            /*
            |--------------------------------------------------------------------------
            | State Management
            |--------------------------------------------------------------------------
            */

            clearCurrent,

            clearError,

            clearMessage,

            reset,

            /*
            |--------------------------------------------------------------------------
            | Lookup Helpers
            |--------------------------------------------------------------------------
            */

            findLease,

            findByLeaseNumber,

            findByTenancy,

            /*
            |--------------------------------------------------------------------------
            | Tenant Helpers
            |--------------------------------------------------------------------------
            */

            getTenant,

            getTenantName,

            getTenantEmail,

            getTenantPhone,

            /*
            |--------------------------------------------------------------------------
            | Property Helpers
            |--------------------------------------------------------------------------
            */

            getPropertyId,

            getApartmentId,

            getUnitId,

            getProperty,

            getApartment,

            getUnit,

            /*
            |--------------------------------------------------------------------------
            | Status Helpers
            |--------------------------------------------------------------------------
            */

            isActiveLease,

            isExpiredLease,

            isTerminatedLease,

            isDraftLease,

            isCancelledLease,

            /*
            |--------------------------------------------------------------------------
            | Financial Helpers
            |--------------------------------------------------------------------------
            */

            getRentAmount,

            getDepositAmount,

            getServiceCharge,

            getLateFee,

            getPaymentFrequency,

            getDueDay,
        }),
        [
            /*
            |--------------------------------------------------------------------------
            | State
            |--------------------------------------------------------------------------
            */

            leases,
            currentLease,
            selectedLease,
            statistics,
            pagination,

            loading,
            loadingList,
            loadingDetails,
            loadingCreate,
            loadingUpdate,
            loadingDelete,
            loadingRestore,
            loadingLifecycle,
            loadingStatistics,
            loadingDocument,

            error,
            errors,
            message,
            success,

            /*
            |--------------------------------------------------------------------------
            | Derived State
            |--------------------------------------------------------------------------
            */

            isEmpty,
            isBusy,
            isCreating,
            isUpdating,
            isDeleting,
            isLoadingStatistics,
            isDocumentLoading,
            hasError,
            isSuccess,

            /*
            |--------------------------------------------------------------------------
            | CRUD Actions
            |--------------------------------------------------------------------------
            */

            fetchAll,
            fetchOne,
            create,
            update,
            patch,
            remove,
            restore,
            forceDelete,

            /*
            |--------------------------------------------------------------------------
            | Lifecycle Actions
            |--------------------------------------------------------------------------
            */

            activate,
            sign,
            terminate,
            cancel,

            /*
            |--------------------------------------------------------------------------
            | Statistics
            |--------------------------------------------------------------------------
            */

            fetchStatistics,

            /*
            |--------------------------------------------------------------------------
            | Documents
            |--------------------------------------------------------------------------
            */

            uploadDocument,
            deleteDocument,

            /*
            |--------------------------------------------------------------------------
            | State Management
            |--------------------------------------------------------------------------
            */

            clearCurrent,
            clearError,
            clearMessage,
            reset,

            /*
            |--------------------------------------------------------------------------
            | Lookup Helpers
            |--------------------------------------------------------------------------
            */

            findLease,
            findByLeaseNumber,
            findByTenancy,

            /*
            |--------------------------------------------------------------------------
            | Tenant Helpers
            |--------------------------------------------------------------------------
            */

            getTenant,
            getTenantName,
            getTenantEmail,
            getTenantPhone,

            /*
            |--------------------------------------------------------------------------
            | Property Helpers
            |--------------------------------------------------------------------------
            */

            getPropertyId,
            getApartmentId,
            getUnitId,
            getProperty,
            getApartment,
            getUnit,

            /*
            |--------------------------------------------------------------------------
            | Status Helpers
            |--------------------------------------------------------------------------
            */

            isActiveLease,
            isExpiredLease,
            isTerminatedLease,
            isDraftLease,
            isCancelledLease,

            /*
            |--------------------------------------------------------------------------
            | Financial Helpers
            |--------------------------------------------------------------------------
            */

            getRentAmount,
            getDepositAmount,
            getServiceCharge,
            getLateFee,
            getPaymentFrequency,
            getDueDay,
        ]
    );
};