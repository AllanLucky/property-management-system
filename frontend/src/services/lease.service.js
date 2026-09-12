
import leaseApi from "../api/lease.api";


const getResponseData = (response) => {
    return (
        response?.data?.data ??
        response?.data ??
        null
    );
};

/**
 * Extract the API response message.
 */
const getResponseMessage = (
    response,
    fallback = "Request completed successfully."
) => {
    return (
        response?.data?.message ||
        response?.data?.data?.message ||
        fallback
    );
};

/*
|--------------------------------------------------------------------------
| Error Handling
|--------------------------------------------------------------------------
*/

/**
 * Normalize Axios/Laravel errors into a predictable structure.
 *
 * Consumers can safely work with:
 *
 * {
 *     message,
 *     errors,
 *     status,
 *     code,
 *     raw
 * }
 */
const normalizeError = (error) => {
    const response = error?.response;
    const responseData = response?.data;

    return {
        message:
            responseData?.message ||
            error?.message ||
            "An unexpected error occurred.",

        errors:
            responseData?.errors ||
            null,

        status:
            response?.status ||
            null,

        code:
            responseData?.code ||
            response?.status ||
            null,

        raw: error,
    };
};

/**
 * Execute an API request and normalize any error.
 */
const execute = async (request) => {
    try {
        return await request();
    } catch (error) {
        throw normalizeError(error);
    }
};

/**
 * Create a standard client-side validation error.
 */
const validationError = (message) => {
    return {
        message,
        errors: null,
        status: null,
        code: null,
        raw: null,
    };
};

/*
|--------------------------------------------------------------------------
| Lease Service
|--------------------------------------------------------------------------
*/

const leaseService = {
    /*
    |--------------------------------------------------------------------------
    | Fetch Leases
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch paginated/filterable leases.
     *
     * Supported filters may include:
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
     *
     * @param {Object} params
     */
    async getLeases(params = {}) {
        const response = await execute(() =>
            leaseApi.getLeases(params)
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Leases fetched successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Fetch Expired Leases
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch leases that have already expired.
     *
     * Uses the dedicated backend endpoint:
     *
     * GET /leases/expired
     *
     * This is preferred over fetching all leases and filtering
     * them in the frontend.
     *
     * @param {Object} params
     */
    async getExpiredLeases(params = {}) {
        const response = await execute(() =>
            leaseApi.getExpiredLeases(params)
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Expired leases fetched successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Fetch Single Lease
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch a single lease by ID.
     *
     * @param {number|string} leaseId
     */
    async getLease(leaseId) {
        if (!leaseId) {
            throw validationError(
                "Lease ID is required."
            );
        }

        const response = await execute(() =>
            leaseApi.getLease(leaseId)
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Lease fetched successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Create Lease
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new lease.
     *
     * @param {Object} payload
     */
    async createLease(payload) {
        if (
            !payload ||
            typeof payload !== "object"
        ) {
            throw validationError(
                "Lease data is required."
            );
        }

        const response = await execute(() =>
            leaseApi.createLease(payload)
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Lease created successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Update Lease
    |--------------------------------------------------------------------------
    */

    /**
     * Fully update an existing lease.
     *
     * @param {number|string} leaseId
     * @param {Object} payload
     */
    async updateLease(leaseId, payload) {
        if (!leaseId) {
            throw validationError(
                "Lease ID is required."
            );
        }

        if (
            !payload ||
            typeof payload !== "object"
        ) {
            throw validationError(
                "Lease update data is required."
            );
        }

        const response = await execute(() =>
            leaseApi.updateLease(
                leaseId,
                payload
            )
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Lease updated successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Patch Lease
    |--------------------------------------------------------------------------
    */

    /**
     * Partially update an existing lease.
     *
     * @param {number|string} leaseId
     * @param {Object} payload
     */
    async patchLease(leaseId, payload) {
        if (!leaseId) {
            throw validationError(
                "Lease ID is required."
            );
        }

        if (
            !payload ||
            typeof payload !== "object"
        ) {
            throw validationError(
                "Lease update data is required."
            );
        }

        const response = await execute(() =>
            leaseApi.patchLease(
                leaseId,
                payload
            )
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Lease updated successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Delete Lease
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete a lease.
     *
     * @param {number|string} leaseId
     */
    async deleteLease(leaseId) {
        if (!leaseId) {
            throw validationError(
                "Lease ID is required."
            );
        }

        const response = await execute(() =>
            leaseApi.deleteLease(leaseId)
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Lease deleted successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Restore Lease
    |--------------------------------------------------------------------------
    */

    /**
     * Restore a soft-deleted lease.
     *
     * @param {number|string} leaseId
     */
    async restoreLease(leaseId) {
        if (!leaseId) {
            throw validationError(
                "Lease ID is required."
            );
        }

        const response = await execute(() =>
            leaseApi.restoreLease(leaseId)
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Lease restored successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Force Delete Lease
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete a lease.
     *
     * @param {number|string} leaseId
     */
    async forceDeleteLease(leaseId) {
        if (!leaseId) {
            throw validationError(
                "Lease ID is required."
            );
        }

        const response = await execute(() =>
            leaseApi.forceDeleteLease(leaseId)
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Lease permanently deleted successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Lifecycle: Activate
    |--------------------------------------------------------------------------
    */

    /**
     * Activate a lease.
     *
     * @param {number|string} leaseId
     */
    async activateLease(leaseId) {
        if (!leaseId) {
            throw validationError(
                "Lease ID is required."
            );
        }

        const response = await execute(() =>
            leaseApi.activateLease(leaseId)
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Lease activated successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Lifecycle: Sign
    |--------------------------------------------------------------------------
    */

    /**
     * Sign a lease.
    *
     * @param {number|string} leaseId
     * @param {Object} payload
     */
    async signLease(
        leaseId,
        payload = {}
    ) {
        if (!leaseId) {
            throw validationError(
                "Lease ID is required."
            );
        }

        const response = await execute(() =>
            leaseApi.signLease(
                leaseId,
                payload
            )
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Lease signed successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Lifecycle: Expire Single Lease
    |--------------------------------------------------------------------------
    */

    /**
     * Expire a single ended lease.
     *
     * Uses:
     *
     * POST /leases/{lease}/expire
     *
     * The backend remains responsible for determining whether
     * the lease is actually eligible for expiration.
     *
     * @param {number|string} leaseId
     */
    async expireLease(leaseId) {
        if (!leaseId) {
            throw validationError(
                "Lease ID is required."
            );
        }

        const response = await execute(() =>
            leaseApi.expireLease(leaseId)
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Lease expired successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Lifecycle: Expire Ended Leases
    |--------------------------------------------------------------------------
    */

    /**
     * Automatically expire all active leases whose end date
     * has already passed.
     *
     * Uses:
     *
     * POST /leases/expire-ended
     *
     * The operation is idempotent. If no active leases require
     * expiration, the backend returns expired_count = 0.
     */
    async expireEndedLeases() {
        const response = await execute(() =>
            leaseApi.expireEndedLeases()
        );

        const data =
            getResponseData(response) || {};

        return {
            data,

            expiredCount:
                Number(
                    data?.expired_count ?? 0
                ),

            message: getResponseMessage(
                response,
                "Ended leases processed successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Lifecycle: Terminate
    |--------------------------------------------------------------------------
    */

    /**
     * Terminate a lease.
     *
     * @param {number|string} leaseId
     * @param {Object} payload
     */
    async terminateLease(
        leaseId,
        payload = {}
    ) {
        if (!leaseId) {
            throw validationError(
                "Lease ID is required."
            );
        }

        const response = await execute(() =>
            leaseApi.terminateLease(
                leaseId,
                payload
            )
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Lease terminated successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Lifecycle: Cancel
    |--------------------------------------------------------------------------
    */

    /**
     * Cancel a lease.
     *
     * @param {number|string} leaseId
     * @param {Object} payload
     */
    async cancelLease(
        leaseId,
        payload = {}
    ) {
        if (!leaseId) {
            throw validationError(
                "Lease ID is required."
            );
        }

        const response = await execute(() =>
            leaseApi.cancelLease(
                leaseId,
                payload
            )
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Lease cancelled successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch lease statistics.
     *
     * @param {Object} params
     */
    async getLeaseStatistics(
        params = {}
    ) {
        const response = await execute(() =>
            leaseApi.getLeaseStatistics(
                params
            )
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Lease statistics fetched successfully."
            ),

            response,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Documents
    |--------------------------------------------------------------------------
    */

    /**
     * Upload a lease document.
     *
     * @param {number|string} leaseId
     * @param {FormData} formData
     */
    async uploadLeaseDocument(
        leaseId,
        formData
    ) {
        if (!leaseId) {
            throw validationError(
                "Lease ID is required."
            );
        }

        if (
            typeof FormData !== "undefined" &&
            !(formData instanceof FormData)
        ) {
            throw validationError(
                "A valid FormData payload is required."
            );
        }

        const response = await execute(() =>
            leaseApi.uploadLeaseDocument(
                leaseId,
                formData
            )
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Lease document uploaded successfully."
            ),

            response,
        };
    },

    /**
     * Delete the current lease document.
     *
     * @param {number|string} leaseId
     */
    async deleteLeaseDocument(leaseId) {
        if (!leaseId) {
            throw validationError(
                "Lease ID is required."
            );
        }

        const response = await execute(() =>
            leaseApi.deleteLeaseDocument(
                leaseId
            )
        );

        return {
            data: getResponseData(response),

            message: getResponseMessage(
                response,
                "Lease document deleted successfully."
            ),

            response,
        };
    },
};

/*
|--------------------------------------------------------------------------
| Named Exports
|--------------------------------------------------------------------------
*/

export const getLeases =
    leaseService.getLeases;

export const getExpiredLeases =
    leaseService.getExpiredLeases;

export const getLease =
    leaseService.getLease;

export const createLease =
    leaseService.createLease;

export const updateLease =
    leaseService.updateLease;

export const patchLease =
    leaseService.patchLease;

export const deleteLease =
    leaseService.deleteLease;

export const restoreLease =
    leaseService.restoreLease;

export const forceDeleteLease =
    leaseService.forceDeleteLease;

/*
|--------------------------------------------------------------------------
| Lifecycle Exports
|--------------------------------------------------------------------------
*/

export const activateLease =
    leaseService.activateLease;

export const signLease =
    leaseService.signLease;

export const expireLease =
    leaseService.expireLease;

export const expireEndedLeases =
    leaseService.expireEndedLeases;

export const terminateLease =
    leaseService.terminateLease;

export const cancelLease =
    leaseService.cancelLease;

/*
|--------------------------------------------------------------------------
| Statistics Exports
|--------------------------------------------------------------------------
*/

export const getLeaseStatistics =
    leaseService.getLeaseStatistics;

/*
|--------------------------------------------------------------------------
| Document Exports
|--------------------------------------------------------------------------
*/

export const uploadLeaseDocument =
    leaseService.uploadLeaseDocument;

export const deleteLeaseDocument =
    leaseService.deleteLeaseDocument;

/*
|--------------------------------------------------------------------------
| Default Export
|--------------------------------------------------------------------------
*/

export default leaseService;
