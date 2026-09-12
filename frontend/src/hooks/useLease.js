import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
    fetchLeases,
    fetchExpiredLeases,
    fetchLease,
    createLease,
    updateLease,
    patchLease,
    deleteLease,
    restoreLease,
    forceDeleteLease,
    activateLease,
    signLease,
    expireLease,
    expireEndedLeases,
    terminateLease,
    cancelLease,
    fetchLeaseStatistics,
    uploadLeaseDocument,
    deleteLeaseDocument,

    clearLeaseError,
    clearCurrentLease,
    clearLeaseMessage,
    resetLeaseState,

    selectLeases,
    selectExpiredLeases,
    selectCurrentLease,
    selectSelectedLease,
    selectLeaseStatistics,
    selectLeasePagination,
    selectExpiredLeasePagination,

    selectLeaseLoading,
    selectLeaseListLoading,
    selectLeaseDetailsLoading,
    selectLeaseCreateLoading,
    selectLeaseUpdateLoading,
    selectLeaseDeleteLoading,
    selectLeaseRestoreLoading,
    selectLeaseLifecycleLoading,
    selectLeaseExpiredLoading,
    selectLeaseExpireLoading,
    selectLeaseExpireEndedLoading,
    selectLeaseStatisticsLoading,
    selectLeaseDocumentLoading,

    selectLeaseError,
    selectLeaseErrors,
    selectLeaseMessage,
    selectLeaseSuccess,
} from "../store/leaseSlice";

const useLease = () => {
    const dispatch = useDispatch();

    /*
    |--------------------------------------------------------------------------
    | Data
    |--------------------------------------------------------------------------
    */

    const leases = useSelector(selectLeases);

    const expiredLeases = useSelector(selectExpiredLeases);

    const currentLease = useSelector(selectCurrentLease);

    const selectedLease = useSelector(selectSelectedLease);

    const statistics = useSelector(selectLeaseStatistics);

    const pagination = useSelector(selectLeasePagination);

    const expiredPagination = useSelector(
        selectExpiredLeasePagination
    );

    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    const loading = useSelector(selectLeaseLoading);

    const loadingList = useSelector(selectLeaseListLoading);

    const loadingDetails = useSelector(
        selectLeaseDetailsLoading
    );

    const loadingCreate = useSelector(
        selectLeaseCreateLoading
    );

    const loadingUpdate = useSelector(
        selectLeaseUpdateLoading
    );

    const loadingDelete = useSelector(
        selectLeaseDeleteLoading
    );

    const loadingRestore = useSelector(
        selectLeaseRestoreLoading
    );

    const loadingLifecycle = useSelector(
        selectLeaseLifecycleLoading
    );

    const loadingExpired = useSelector(
        selectLeaseExpiredLoading
    );

    const loadingExpire = useSelector(
        selectLeaseExpireLoading
    );

    const loadingExpireEnded = useSelector(
        selectLeaseExpireEndedLoading
    );

    const loadingStatistics = useSelector(
        selectLeaseStatisticsLoading
    );

    const loadingDocument = useSelector(
        selectLeaseDocumentLoading
    );

    /*
    |--------------------------------------------------------------------------
    | Errors / Status
    |--------------------------------------------------------------------------
    */

    const error = useSelector(selectLeaseError);

    const errors = useSelector(selectLeaseErrors);

    const message = useSelector(selectLeaseMessage);

    const success = useSelector(selectLeaseSuccess);

    /*
    |--------------------------------------------------------------------------
    | Fetch All Leases
    |--------------------------------------------------------------------------
    */

    const fetchAll = useCallback(
        (params = {}) => {
            return dispatch(fetchLeases(params));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Fetch Expired Leases
    |--------------------------------------------------------------------------
    */

    const fetchExpired = useCallback(
        (params = {}) => {
            return dispatch(fetchExpiredLeases(params));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Fetch Single Lease
    |--------------------------------------------------------------------------
    */

    const fetchOne = useCallback(
        (leaseId) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(fetchLease(leaseId));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    */

    const create = useCallback(
        (payload) => {
            return dispatch(createLease(payload));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    const update = useCallback(
        (leaseId, payload) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(
                updateLease({
                    leaseId,
                    data: payload,
                })
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Patch
    |--------------------------------------------------------------------------
    */

    const patch = useCallback(
        (leaseId, payload) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(
                patchLease({
                    leaseId,
                    data: payload,
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

    const remove = useCallback(
        (leaseId) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(deleteLease(leaseId));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Restore
    |--------------------------------------------------------------------------
    */

    const restore = useCallback(
        (leaseId) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(restoreLease(leaseId));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Force Delete
    |--------------------------------------------------------------------------
    */

    const forceDelete = useCallback(
        (leaseId) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(forceDeleteLease(leaseId));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Activate
    |--------------------------------------------------------------------------
    */

    const activate = useCallback(
        (leaseId) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(activateLease(leaseId));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Sign
    |--------------------------------------------------------------------------
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
                    data: payload,
                })
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Expire Individual Lease
    |--------------------------------------------------------------------------
    */

    const expire = useCallback(
        (leaseId) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(expireLease(leaseId));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Process Ended Leases
    |--------------------------------------------------------------------------
    */

    const expireEnded = useCallback(() => {
        return dispatch(expireEndedLeases());
    }, [dispatch]);

    /*
    |--------------------------------------------------------------------------
    | Terminate
    |--------------------------------------------------------------------------
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
                    data: payload,
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
        (leaseId, payload = {}) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            return dispatch(
                cancelLease({
                    leaseId,
                    data: payload,
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

    const fetchStatistics = useCallback(
        (params = {}) => {
            return dispatch(fetchLeaseStatistics(params));
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Upload Document
    |--------------------------------------------------------------------------
    */

    const uploadDocument = useCallback(
        (leaseId, file) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            if (!file) {
                return Promise.reject(
                    new Error("Document file is required.")
                );
            }

            return dispatch(
                uploadLeaseDocument({
                    leaseId,
                    file,
                })
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Delete Document
    |--------------------------------------------------------------------------
    */

    const deleteDocument = useCallback(
        (leaseId, documentId) => {
            if (!leaseId) {
                return Promise.reject(
                    new Error("Lease ID is required.")
                );
            }

            if (!documentId) {
                return Promise.reject(
                    new Error("Document ID is required.")
                );
            }

            return dispatch(
                deleteLeaseDocument({
                    leaseId,
                    documentId,
                })
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Clear Error
    |--------------------------------------------------------------------------
    */

    const clearError = useCallback(() => {
        dispatch(clearLeaseError());
    }, [dispatch]);

    /*
    |--------------------------------------------------------------------------
    | Clear Current Lease
    |--------------------------------------------------------------------------
    */

    const clearCurrent = useCallback(() => {
        dispatch(clearCurrentLease());
    }, [dispatch]);

    /*
    |--------------------------------------------------------------------------
    | Clear Message
    |--------------------------------------------------------------------------
    */

    const clearMessage = useCallback(() => {
        dispatch(clearLeaseMessage());
    }, [dispatch]);

    /*
    |--------------------------------------------------------------------------
    | Reset
    |--------------------------------------------------------------------------
    */

    const reset = useCallback(() => {
        dispatch(resetLeaseState());
    }, [dispatch]);

    /*
    |--------------------------------------------------------------------------
    | Busy State
    |--------------------------------------------------------------------------
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
                    loadingExpired ||
                    loadingExpire ||
                    loadingExpireEnded ||
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
            loadingExpired,
            loadingExpire,
            loadingExpireEnded,
            loadingStatistics,
            loadingDocument,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | Public API
    |--------------------------------------------------------------------------
    */

    return useMemo(
        () => ({
            /*
            |--------------------------------------------------------------------------
            | Data
            |--------------------------------------------------------------------------
            */

            leases,

            expiredLeases,

            currentLease,

            selectedLease,

            statistics,

            pagination,

            expiredPagination,

            /*
            |--------------------------------------------------------------------------
            | Loading
            |--------------------------------------------------------------------------
            */

            loading,

            loadingList,

            loadingDetails,

            loadingCreate,

            loadingUpdate,

            loadingDelete,

            loadingRestore,

            loadingLifecycle,

            loadingExpired,

            loadingExpire,

            loadingExpireEnded,

            loadingStatistics,

            loadingDocument,

            isBusy,

            /*
            |--------------------------------------------------------------------------
            | Errors / Status
            |--------------------------------------------------------------------------
            */

            error,

            errors,

            message,

            success,

            /*
            |--------------------------------------------------------------------------
            | List
            |--------------------------------------------------------------------------
            */

            fetchAll,

            fetchLeases: fetchAll,

            /*
            |--------------------------------------------------------------------------
            | Expired
            |--------------------------------------------------------------------------
            */

            fetchExpired,

            fetchExpiredLeases: fetchExpired,

            /*
            |--------------------------------------------------------------------------
            | Details
            |--------------------------------------------------------------------------
            */

            fetchOne,

            fetchLease: fetchOne,

            /*
            |--------------------------------------------------------------------------
            | CRUD
            |--------------------------------------------------------------------------
            */

            create,

            createLease: create,

            update,

            updateLease: update,

            patch,

            patchLease: patch,

            remove,

            deleteLease: remove,

            restore,

            restoreLease: restore,

            forceDelete,

            forceDeleteLease: forceDelete,

            /*
            |--------------------------------------------------------------------------
            | Lifecycle
            |--------------------------------------------------------------------------
            */

            activate,

            activateLease: activate,

            sign,

            signLease: sign,

            expire,

            expireLease: expire,

            expireEnded,

            expireEndedLeases: expireEnded,

            terminate,

            terminateLease: terminate,

            cancel,

            cancelLease: cancel,

            /*
            |--------------------------------------------------------------------------
            | Statistics
            |--------------------------------------------------------------------------
            */

            fetchStatistics,

            fetchLeaseStatistics: fetchStatistics,

            /*
            |--------------------------------------------------------------------------
            | Documents
            |--------------------------------------------------------------------------
            */

            uploadDocument,

            uploadLeaseDocument: uploadDocument,

            deleteDocument,

            deleteLeaseDocument: deleteDocument,

            /*
            |--------------------------------------------------------------------------
            | State Controls
            |--------------------------------------------------------------------------
            */

            clearError,

            clearCurrent,

            clearMessage,

            reset,
        }),
        [
            leases,
            expiredLeases,
            currentLease,
            selectedLease,
            statistics,
            pagination,
            expiredPagination,

            loading,
            loadingList,
            loadingDetails,
            loadingCreate,
            loadingUpdate,
            loadingDelete,
            loadingRestore,
            loadingLifecycle,
            loadingExpired,
            loadingExpire,
            loadingExpireEnded,
            loadingStatistics,
            loadingDocument,

            isBusy,

            error,
            errors,
            message,
            success,

            fetchAll,
            fetchExpired,
            fetchOne,
            create,
            update,
            patch,
            remove,
            restore,
            forceDelete,
            activate,
            sign,
            expire,
            expireEnded,
            terminate,
            cancel,
            fetchStatistics,
            uploadDocument,
            deleteDocument,

            clearError,
            clearCurrent,
            clearMessage,
            reset,
        ]
    );
};

export { useLease };

export default useLease;