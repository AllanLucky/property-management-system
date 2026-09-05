import leaseApi from "../api/lease.api";


const getResponseData = (response) => {
    return response?.data?.data ?? response?.data ?? null;
};

/**
 * Extract API message.
 */
const getResponseMessage = (response, fallback = "Request completed successfully.") => {
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
 * This allows hooks/components to work with:
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
 * Execute an API request and normalize errors.
 */
const execute = async (request) => {
    try {
        return await request();
    } catch (error) {
        throw normalizeError(error);
    }
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
     * @param {Object} params
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
            throw {
                message: "Lease ID is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
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
        if (!payload || typeof payload !== "object") {
            throw {
                message: "Lease data is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
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
            throw {
                message: "Lease ID is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
        }

        if (!payload || typeof payload !== "object") {
            throw {
                message: "Lease update data is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
        }

        const response = await execute(() =>
            leaseApi.updateLease(leaseId, payload)
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
     * Partially update a lease.
     *
     * @param {number|string} leaseId
     * @param {Object} payload
     */
    async patchLease(leaseId, payload) {
        if (!leaseId) {
            throw {
                message: "Lease ID is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
        }

        if (!payload || typeof payload !== "object") {
            throw {
                message: "Lease update data is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
        }

        const response = await execute(() =>
            leaseApi.patchLease(leaseId, payload)
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
            throw {
                message: "Lease ID is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
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
            throw {
                message: "Lease ID is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
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
    | Force Delete
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete a lease.
     *
     * @param {number|string} leaseId
     */
    async forceDeleteLease(leaseId) {
        if (!leaseId) {
            throw {
                message: "Lease ID is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
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
            throw {
                message: "Lease ID is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
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
    async signLease(leaseId, payload = {}) {
        if (!leaseId) {
            throw {
                message: "Lease ID is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
        }

        const response = await execute(() =>
            leaseApi.signLease(leaseId, payload)
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
    | Lifecycle: Terminate
    |--------------------------------------------------------------------------
    */

    /**
     * Terminate a lease.
     *
     * @param {number|string} leaseId
     * @param {Object} payload
     */
    async terminateLease(leaseId, payload = {}) {
        if (!leaseId) {
            throw {
                message: "Lease ID is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
        }

        const response = await execute(() =>
            leaseApi.terminateLease(leaseId, payload)
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
    async cancelLease(leaseId, payload = {}) {
        if (!leaseId) {
            throw {
                message: "Lease ID is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
        }

        const response = await execute(() =>
            leaseApi.cancelLease(leaseId, payload)
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
    async getLeaseStatistics(params = {}) {
        const response = await execute(() =>
            leaseApi.getLeaseStatistics(params)
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
    async uploadLeaseDocument(leaseId, formData) {
        if (!leaseId) {
            throw {
                message: "Lease ID is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
        }

        if (!(formData instanceof FormData)) {
            throw {
                message: "A valid FormData payload is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
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
            throw {
                message: "Lease ID is required.",
                errors: null,
                status: null,
                code: null,
                raw: null,
            };
        }

        const response = await execute(() =>
            leaseApi.deleteLeaseDocument(leaseId)
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

export const getLeases = leaseService.getLeases;
export const getLease = leaseService.getLease;

export const createLease = leaseService.createLease;
export const updateLease = leaseService.updateLease;
export const patchLease = leaseService.patchLease;

export const deleteLease = leaseService.deleteLease;
export const restoreLease = leaseService.restoreLease;
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