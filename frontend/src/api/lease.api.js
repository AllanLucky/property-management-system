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
*/

const leaseApi = {
    /**
     * ----------------------------------------------------------------------
     * Get Leases
     * ----------------------------------------------------------------------
     *
     * GET /api/leases
     *
     * Supports query parameters such as:
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
        return api.get(`${LEASE_ENDPOINT}/${leaseId}`);
    },

    /**
     * ----------------------------------------------------------------------
     * Create Lease
     * ----------------------------------------------------------------------
     *
     * POST /api/leases
     */
    createLease(payload) {
        return api.post(LEASE_ENDPOINT, payload);
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

export const getLeases = leaseApi.getLeases;
export const getLease = leaseApi.getLease;
export const createLease = leaseApi.createLease;
export const updateLease = leaseApi.updateLease;
export const patchLease = leaseApi.patchLease;
export const deleteLease = leaseApi.deleteLease;
export const restoreLease = leaseApi.restoreLease;
export const forceDeleteLease = leaseApi.forceDeleteLease;

export const activateLease = leaseApi.activateLease;
export const signLease = leaseApi.signLease;
export const terminateLease = leaseApi.terminateLease;
export const cancelLease = leaseApi.cancelLease;

export const getLeaseStatistics =
    leaseApi.getLeaseStatistics;

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