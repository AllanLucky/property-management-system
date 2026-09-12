import api from "./axios";

/*
|--------------------------------------------------------------------------
| Base Endpoint
|--------------------------------------------------------------------------
*/

const LEASE_ENDPOINT = "/leases";

/*
|--------------------------------------------------------------------------
| Lease API
|--------------------------------------------------------------------------
|
| Centralized HTTP layer for all Lease-related endpoints.
|
| Architecture:
|
| Component
|     ↓
| useLease
|     ↓
| leaseSlice
|     ↓
| lease.service
|     ↓
| lease.api
|     ↓
| Axios
|
*/

/*
|--------------------------------------------------------------------------
| Lease API
|--------------------------------------------------------------------------
*/

const leaseApi = {
    /*
    |--------------------------------------------------------------------------
    | Lease Queries
    |--------------------------------------------------------------------------
    */

    /**
     * ----------------------------------------------------------------------
     * Get Leases
     * ----------------------------------------------------------------------
     *
     * GET /api/leases
     *
     * Supported query parameters may include:
     *
     * - page
     * - per_page
     * - search
     * - status
     * - lease_type
     * - tenancy_id
     * - tenant_id
     * - property_id
     * - apartment_id
     * - unit_id
     * - payment_frequency
     * - start_date
     * - end_date
     */
    getLeases(params = {}) {
        return api.get(LEASE_ENDPOINT, {
            params,
        });
    },

    /**
     * ----------------------------------------------------------------------
     * Get Single Lease
     * ----------------------------------------------------------------------
     *
     * GET /api/leases/{id}
     */
    getLease(leaseId) {
        return api.get(
            `${LEASE_ENDPOINT}/${leaseId}`
        );
    },

    /**
     * ----------------------------------------------------------------------
     * Get Expired Leases
     * ----------------------------------------------------------------------
     *
     * GET /api/leases/expired
     *
     * Uses the dedicated backend endpoint rather than relying on:
     *
     * GET /api/leases?status=expired
     *
     * This keeps the frontend aligned with the backend lease lifecycle.
     */
    getExpiredLeases(params = {}) {
        return api.get(
            `${LEASE_ENDPOINT}/expired`,
            {
                params,
            }
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Lease Creation & Updates
    |--------------------------------------------------------------------------
    */

    /**
     * ----------------------------------------------------------------------
     * Create Lease
     * ----------------------------------------------------------------------
     *
     * POST /api/leases
     */
    createLease(payload) {
        return api.post(
            LEASE_ENDPOINT,
            payload
        );
    },

    /**
     * ----------------------------------------------------------------------
     * Update Lease
     * ----------------------------------------------------------------------
     *
     * PUT /api/leases/{id}
     */
    updateLease(leaseId, payload) {
        return api.put(
            `${LEASE_ENDPOINT}/${leaseId}`,
            payload
        );
    },

    /**
     * ----------------------------------------------------------------------
     * Partially Update Lease
     * ----------------------------------------------------------------------
     *
     * PATCH /api/leases/{id}
     */
    patchLease(leaseId, payload) {
        return api.patch(
            `${LEASE_ENDPOINT}/${leaseId}`,
            payload
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Lease Deletion & Restoration
    |--------------------------------------------------------------------------
    */

    /**
     * ----------------------------------------------------------------------
     * Delete Lease
     * ----------------------------------------------------------------------
     *
     * DELETE /api/leases/{id}
     */
    deleteLease(leaseId) {
        return api.delete(
            `${LEASE_ENDPOINT}/${leaseId}`
        );
    },

    /**
     * ----------------------------------------------------------------------
     * Restore Lease
     * ----------------------------------------------------------------------
     *
     * PATCH /api/leases/{id}/restore
     */
    restoreLease(leaseId) {
        return api.patch(
            `${LEASE_ENDPOINT}/${leaseId}/restore`
        );
    },

    /**
     * ----------------------------------------------------------------------
     * Force Delete Lease
     * ----------------------------------------------------------------------
     *
     * DELETE /api/leases/{id}/force
     */
    forceDeleteLease(leaseId) {
        return api.delete(
            `${LEASE_ENDPOINT}/${leaseId}/force`
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Lease Lifecycle Actions
    |--------------------------------------------------------------------------
    */

    /**
     * ----------------------------------------------------------------------
     * Activate Lease
     * ----------------------------------------------------------------------
     *
     * PATCH /api/leases/{id}/activate
     */
    activateLease(leaseId) {
        return api.patch(
            `${LEASE_ENDPOINT}/${leaseId}/activate`
        );
    },

    /**
     * ----------------------------------------------------------------------
     * Sign Lease
     * ----------------------------------------------------------------------
     *
     * PATCH /api/leases/{id}/sign
     */
    signLease(leaseId, payload = {}) {
        return api.patch(
            `${LEASE_ENDPOINT}/${leaseId}/sign`,
            payload
        );
    },

    /**
     * ----------------------------------------------------------------------
     * Expire Single Lease
     * ----------------------------------------------------------------------
     *
     * POST /api/leases/{id}/expire
     *
     * Explicitly expires one lease after the backend verifies:
     *
     * - lease exists
     * - lease is active
     * - lease has reached its end date
     * - lease is not terminated
     * - lease is not cancelled
     *
     * The backend remains the source of truth for lifecycle validation.
     */
    expireLease(leaseId) {
        return api.post(
            `${LEASE_ENDPOINT}/${leaseId}/expire`
        );
    },

    /**
     * ----------------------------------------------------------------------
     * Expire Ended Leases
     * ----------------------------------------------------------------------
     *
     * POST /api/leases/expire-ended
     *
     * Automatically expires all active leases whose end date has passed.
     *
     * This endpoint is idempotent:
     *
     * - Already expired leases are ignored.
     * - Active leases ending today are not expired.
     * - Active leases ending in the future are not expired.
     */
    expireEndedLeases() {
        return api.post(
            `${LEASE_ENDPOINT}/expire-ended`
        );
    },

    /**
     * ----------------------------------------------------------------------
     * Terminate Lease
     * ----------------------------------------------------------------------
     *
     * PATCH /api/leases/{id}/terminate
     */
    terminateLease(leaseId, payload = {}) {
        return api.patch(
            `${LEASE_ENDPOINT}/${leaseId}/terminate`,
            payload
        );
    },

    /**
     * ----------------------------------------------------------------------
     * Cancel Lease
     * ----------------------------------------------------------------------
     *
     * PATCH /api/leases/{id}/cancel
     */
    cancelLease(leaseId, payload = {}) {
        return api.patch(
            `${LEASE_ENDPOINT}/${leaseId}/cancel`,
            payload
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Lease Statistics
    |--------------------------------------------------------------------------
    */

    /**
     * ----------------------------------------------------------------------
     * Get Lease Statistics
     * ----------------------------------------------------------------------
     *
     * GET /api/leases/statistics
     */
    getLeaseStatistics(params = {}) {
        return api.get(
            `${LEASE_ENDPOINT}/statistics`,
            {
                params,
            }
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Lease Documents
    |--------------------------------------------------------------------------
    */

    /**
     * ----------------------------------------------------------------------
     * Upload Lease Document
     * ----------------------------------------------------------------------
     *
     * POST /api/leases/{id}/document
     *
     * Expected payload:
     *
     * FormData
     */
    uploadLeaseDocument(leaseId, formData) {
        return api.post(
            `${LEASE_ENDPOINT}/${leaseId}/document`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
    },

    /**
     * ----------------------------------------------------------------------
     * Delete Lease Document
     * ----------------------------------------------------------------------
     *
     * DELETE /api/leases/{id}/document
     */
    deleteLeaseDocument(leaseId) {
        return api.delete(
            `${LEASE_ENDPOINT}/${leaseId}/document`
        );
    },
};

/*
|--------------------------------------------------------------------------
| Named Exports
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Lease Queries
|--------------------------------------------------------------------------
*/

export const getLeases =
    leaseApi.getLeases;

export const getLease =
    leaseApi.getLease;

export const getExpiredLeases =
    leaseApi.getExpiredLeases;

/*
|--------------------------------------------------------------------------
| Lease Creation & Updates
|--------------------------------------------------------------------------
*/

export const createLease =
    leaseApi.createLease;

export const updateLease =
    leaseApi.updateLease;

export const patchLease =
    leaseApi.patchLease;

/*
|--------------------------------------------------------------------------
| Lease Deletion & Restoration
|--------------------------------------------------------------------------
*/

export const deleteLease =
    leaseApi.deleteLease;

export const restoreLease =
    leaseApi.restoreLease;

export const forceDeleteLease =
    leaseApi.forceDeleteLease;

/*
|--------------------------------------------------------------------------
| Lease Lifecycle Actions
|--------------------------------------------------------------------------
*/

export const activateLease =
    leaseApi.activateLease;

export const signLease =
    leaseApi.signLease;

export const expireLease =
    leaseApi.expireLease;

export const expireEndedLeases =
    leaseApi.expireEndedLeases;

export const terminateLease =
    leaseApi.terminateLease;

export const cancelLease =
    leaseApi.cancelLease;

/*
|--------------------------------------------------------------------------
| Lease Statistics
|--------------------------------------------------------------------------
*/

export const getLeaseStatistics =
    leaseApi.getLeaseStatistics;

/*
|--------------------------------------------------------------------------
| Lease Documents
|--------------------------------------------------------------------------
*/

export const uploadLeaseDocument =
    leaseApi.uploadLeaseDocument;

export const deleteLeaseDocument =
    leaseApi.deleteLeaseDocument;

/*
|--------------------------------------------------------------------------
| Default Export
|--------------------------------------------------------------------------
*/

export default leaseApi;
