import bookingApi from "../api/booking.api";

/*
|--------------------------------------------------------------------------
| Response Helpers
|--------------------------------------------------------------------------
*/

/**
 * Extract the normalized data payload from the EstateKenya API response.
 *
 * Supported API structures:
 *
 * {
 *     status: true,
 *     code: 200,
 *     message: "...",
 *     data: ...,
 *     meta: ...,
 *     links: ...,
 *     errors: ...
 * }
 *
 * Also supports Axios responses where the API envelope is inside
 * response.data.
 */
const getResponseData = (response) => {
    if (!response) {
        return null;
    }

    /*
     * Axios response:
     *
     * response.data = {
     *     status: true,
     *     data: [...]
     * }
     */
    if (
        response?.data &&
        typeof response.data === "object" &&
        Object.prototype.hasOwnProperty.call(
            response.data,
            "data"
        )
    ) {
        return response.data.data;
    }

    /*
     * Already-normalized service response:
     *
     * {
     *     data: [...]
     * }
     */
    if (
        Object.prototype.hasOwnProperty.call(
            response,
            "data"
        )
    ) {
        return response.data;
    }

    return response;
};

/**
 * Extract pagination/meta information.
 */
const getResponseMeta = (response) => {
    return (
        response?.data?.meta ??
        response?.meta ??
        null
    );
};

/**
 * Extract API links.
 */
const getResponseLinks = (response) => {
    return (
        response?.data?.links ??
        response?.links ??
        null
    );
};

/**
 * Extract API message.
 */
const getResponseMessage = (response) => {
    return (
        response?.data?.message ??
        response?.message ??
        "Request completed successfully."
    );
};

/**
 * Normalize Axios / Laravel errors.
 */
const normalizeError = (error) => {
    const response = error?.response;
    const responseData = response?.data;

    return {
        message:
            responseData?.message ??
            error?.message ??
            "Something went wrong. Please try again.",

        errors:
            responseData?.errors ??
            null,

        code:
            responseData?.code ??
            response?.status ??
            null,

        status:
            responseData?.status ??
            false,

        raw:
            responseData ??
            null,
    };
};

/**
 * Execute an API request and return a consistent service response.
 */
const handleRequest = async (request) => {
    try {
        const response = await request;

        return {
            success:
                response?.data?.status ??
                true,

            code:
                response?.data?.code ??
                response?.status ??
                200,

            message:
                getResponseMessage(
                    response
                ),

            data:
                getResponseData(
                    response
                ),

            meta:
                getResponseMeta(
                    response
                ),

            links:
                getResponseLinks(
                    response
                ),

            errors:
                response?.data?.errors ??
                null,

            response,
        };
    } catch (error) {
        const normalized =
            normalizeError(error);

        return {
            success: false,

            code:
                normalized.code,

            message:
                normalized.message,

            data: null,

            meta: null,

            links: null,

            errors:
                normalized.errors,

            error:
                normalized,

            response:
                error?.response ??
                null,
        };
    }
};

/*
|--------------------------------------------------------------------------
| Local Helpers
|--------------------------------------------------------------------------
*/

/**
 * Extract a single resource.
 *
 * Supports:
 *
 * data: {...}
 *
 * data: [...]
 *
 * data: {
 *     data: [...]
 * }
 *
 * data: {
 *     items: [...]
 * }
 */
const extractResource = (response) => {
    let payload =
        response?.data ??
        null;

    if (!payload) {
        return null;
    }

    /*
     * Handle:
     *
     * {
     *     data: {
     *         data: [...]
     *     }
     * }
     */
    if (
        typeof payload === "object" &&
        !Array.isArray(payload) &&
        Array.isArray(payload.data)
    ) {
        return payload.data[0] ?? null;
    }

    /*
     * Handle:
     *
     * {
     *     data: [...]
     * }
     */
    if (Array.isArray(payload)) {
        return payload[0] ?? null;
    }

    /*
     * Handle:
     *
     * {
     *     data: {
     *         items: [...]
     *     }
     * }
     */
    if (
        typeof payload === "object" &&
        !Array.isArray(payload) &&
        Array.isArray(payload.items)
    ) {
        return payload.items[0] ?? null;
    }

    /*
     * Direct resource.
     */
    if (
        typeof payload === "object" &&
        !Array.isArray(payload)
    ) {
        if (
            payload.id !== undefined &&
            payload.id !== null
        ) {
            return payload;
        }

        /*
         * Some APIs return:
         *
         * {
         *     data: {
         *         tenant: {...}
         *     }
         * }
         */
        if (
            payload.tenant &&
            typeof payload.tenant === "object"
        ) {
            return payload.tenant;
        }

        if (
            payload.user &&
            typeof payload.user === "object"
        ) {
            return payload.user;
        }

        if (
            payload.resource &&
            typeof payload.resource === "object"
        ) {
            return payload.resource;
        }
    }

    return null;
};

/**
 * Extract a collection.
 *
 * Supports:
 *
 * data: []
 *
 * data: {
 *     data: []
 * }
 *
 * data: {
 *     items: []
 * }
 *
 * data: {...resource}
 */
const extractCollection = (response) => {
    let payload =
        response?.data ??
        null;

    if (!payload) {
        return [];
    }

    /*
     * Direct array.
     */
    if (Array.isArray(payload)) {
        return payload;
    }

    /*
     * Laravel resource collection:
     *
     * {
     *     data: [...]
     * }
     */
    if (
        typeof payload === "object" &&
        Array.isArray(payload.data)
    ) {
        return payload.data;
    }

    /*
     * Generic items collection.
     */
    if (
        typeof payload === "object" &&
        Array.isArray(payload.items)
    ) {
        return payload.items;
    }

    /*
     * Nested collection:
     *
     * {
     *     data: {
     *         data: [...]
     *     }
     * }
     */
    if (
        typeof payload === "object" &&
        payload.data &&
        typeof payload.data === "object" &&
        Array.isArray(payload.data.data)
    ) {
        return payload.data.data;
    }

    /*
     * Nested items:
     *
     * {
     *     data: {
     *         items: [...]
     *     }
     * }
     */
    if (
        typeof payload === "object" &&
        payload.data &&
        typeof payload.data === "object" &&
        Array.isArray(payload.data.items)
    ) {
        return payload.data.items;
    }

    /*
     * Direct resource.
     */
    if (
        typeof payload === "object" &&
        payload.id !== undefined &&
        payload.id !== null
    ) {
        return [payload];
    }

    return [];
};

/**
 * Extract an ID from:
 *
 * 5
 * "5"
 * { id: 5 }
 * { value: 5 }
 *
 * For customer/user objects we also support:
 *
 * { user_id: 5 }
 * { user: { id: 5 } }
 */
const getId = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    if (
        typeof value === "object"
    ) {
        return (
            value?.id ??
            value?.value ??
            value?.user_id ??
            value?.user?.id ??
            null
        );
    }

    return value;
};

/**
 * Extract customer/user ID specifically.
 *
 * Customer in the booking module is a User.
 *
 * This helper intentionally prioritizes:
 *
 * 1. user_id
 * 2. user.id
 * 3. id
 * 4. value
 */
const getCustomerUserId = (customer) => {
    if (
        customer === null ||
        customer === undefined
    ) {
        return null;
    }

    if (
        typeof customer !== "object"
    ) {
        return customer;
    }

    return (
        customer?.user_id ??
        customer?.user?.id ??
        customer?.id ??
        customer?.value ??
        null
    );
};

/**
 * Extract tenant profile ID.
 *
 * Tenant profile is different from User.
 */
const getTenantId = (tenant) => {
    if (
        tenant === null ||
        tenant === undefined
    ) {
        return null;
    }

    if (
        typeof tenant !== "object"
    ) {
        return tenant;
    }

    return (
        tenant?.id ??
        tenant?.tenant_id ??
        null
    );
};

/**
 * Extract embedded tenancies from a tenant resource.
 *
 * Supports:
 *
 * tenant.tenancies
 * tenant.active_tenancies
 * tenant.activeTenancies
 * tenant.tenancy
 */
const extractTenantTenancies = (tenant) => {
    if (
        !tenant ||
        typeof tenant !== "object"
    ) {
        return [];
    }

    const embedded =
        tenant?.tenancies ??
        tenant?.active_tenancies ??
        tenant?.activeTenancies ??
        tenant?.tenancy ??
        [];

    if (!embedded) {
        return [];
    }

    /*
     * Direct array.
     */
    if (Array.isArray(embedded)) {
        return embedded;
    }

    /*
     * Paginated/resource collection.
     */
    if (
        typeof embedded === "object"
    ) {
        if (
            Array.isArray(
                embedded.data
            )
        ) {
            return embedded.data;
        }

        if (
            Array.isArray(
                embedded.items
            )
        ) {
            return embedded.items;
        }
    }

    /*
     * Single tenancy resource.
     */
    if (
        typeof embedded === "object" &&
        embedded.id !== undefined
    ) {
        return [embedded];
    }

    return [];
};

/**
 * Remove duplicate resources by ID.
 */
const uniqueById = (items = []) => {
    const map = new Map();

    items.forEach((item) => {
        const id =
            item?.id ??
            item?.value ??
            item?.tenancy_id ??
            null;

        if (
            id !== null &&
            id !== undefined
        ) {
            map.set(
                String(id),
                item
            );
        }
    });

    return Array.from(
        map.values()
    );
};

/**
 * Standard validation response.
 */
const requiredIdResponse = (
    message
) => ({
    success: false,
    code: 400,
    message,
    data: null,
    meta: null,
    links: null,
    errors: null,
});

/*
|--------------------------------------------------------------------------
| Booking Service
|--------------------------------------------------------------------------
*/

const bookingService = {
    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch paginated bookings.
     */
    async getAll(params = {}) {
        return handleRequest(
            bookingApi.getAll(params)
        );
    },

    /**
     * Fetch a single booking.
     */
    async getById(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        return handleRequest(
            bookingApi.getById(
                normalizedId
            )
        );
    },

    /**
     * Create booking.
     */
    async create(payload = {}) {
        return handleRequest(
            bookingApi.create(
                payload
            )
        );
    },

    /**
     * Update booking.
     */
    async update(
        id,
        payload = {}
    ) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        return handleRequest(
            bookingApi.update(
                normalizedId,
                payload
            )
        );
    },

    /**
     * Delete booking.
     */
    async delete(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        return handleRequest(
            bookingApi.delete(
                normalizedId
            )
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    /**
     * Search bookings.
     */
    async search(
        searchTerm = "",
        params = {}
    ) {
        const normalizedSearch =
            typeof searchTerm === "string"
                ? searchTerm.trim()
                : "";

        const requestParams = {
            ...params,
        };

        if (normalizedSearch) {
            requestParams.search =
                normalizedSearch;
        } else {
            delete requestParams.search;
        }

        return handleRequest(
            bookingApi.search(
                requestParams
            )
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch booking statistics.
     */
    async statistics(
        params = {}
    ) {
        return handleRequest(
            bookingApi.statistics(
                params
            )
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Reports
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch booking reports.
     */
    async reports(
        params = {}
    ) {
        return handleRequest(
            bookingApi.reports(
                params
            )
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Status Lists
    |--------------------------------------------------------------------------
    */

    /**
     * Pending bookings.
     */
    async pending(
        params = {}
    ) {
        return handleRequest(
            bookingApi.pending(
                params
            )
        );
    },

    /**
     * Confirmed bookings.
     */
    async confirmed(
        params = {}
    ) {
        return handleRequest(
            bookingApi.confirmed(
                params
            )
        );
    },

    /**
     * Active bookings.
     */
    async active(
        params = {}
    ) {
        return handleRequest(
            bookingApi.active(
                params
            )
        );
    },

    /**
     * Completed bookings.
     */
    async completed(
        params = {}
    ) {
        return handleRequest(
            bookingApi.completed(
                params
            )
        );
    },

    /**
     * Cancelled bookings.
     */
    async cancelled(
        params = {}
    ) {
        return handleRequest(
            bookingApi.cancelled(
                params
            )
        );
    },

    /**
     * Expired bookings.
     */
    async expired(
        params = {}
    ) {
        return handleRequest(
            bookingApi.expired(
                params
            )
        );
    },

    /**
     * Rejected bookings.
     */
    async rejected(
        params = {}
    ) {
        return handleRequest(
            bookingApi.rejected(
                params
            )
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Booking Workflow
    |--------------------------------------------------------------------------
    */

    /**
     * Confirm booking.
     */
    async confirm(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        return handleRequest(
            bookingApi.confirm(
                normalizedId
            )
        );
    },

    /**
     * Approve booking.
     */
    async approve(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        return handleRequest(
            bookingApi.approve(
                normalizedId
            )
        );
    },

    /**
     * Check in booking.
     */
    async checkIn(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        return handleRequest(
            bookingApi.checkIn(
                normalizedId
            )
        );
    },

    /**
     * Complete booking.
     */
    async complete(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        return handleRequest(
            bookingApi.complete(
                normalizedId
            )
        );
    },

    /**
     * Cancel booking.
     *
     * Payload may contain:
     *
     * {
     *     cancellation_reason: "...",
     *     notes: "..."
     * }
     */
    async cancel(
        id,
        payload = {}
    ) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        return handleRequest(
            bookingApi.cancel(
                normalizedId,
                payload
            )
        );
    },

    /**
     * Reject booking.
     */
    async reject(
        id,
        rejectionReason
    ) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        const normalizedReason =
            typeof rejectionReason === "string"
                ? rejectionReason.trim()
                : "";

        if (!normalizedReason) {
            return {
                success: false,
                code: 422,
                message:
                    "Rejection reason is required.",
                data: null,
                meta: null,
                links: null,
                errors: {
                    rejection_reason: [
                        "The rejection reason field is required.",
                    ],
                },
            };
        }

        return handleRequest(
            bookingApi.reject(
                normalizedId,
                normalizedReason
            )
        );
    },

    /**
     * Expire booking.
     */
    async expire(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        return handleRequest(
            bookingApi.expire(
                normalizedId
            )
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Availability
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch available units for a booking period.
     *
     * Required:
     * - start_date
     * - end_date
     *
     * Optional:
     * - property_id
     * - apartment_id
     * - booking_id
     */
    async availableUnits(
        params = {}
    ) {
        return handleRequest(
            bookingApi.availableUnits(
                params
            )
        );
    },

    /**
     * Fetch users available for booking.
     *
     * Customer = User account.
     *
     * When no search term is supplied:
     *
     * GET /api/bookings/available-users
     */
    async availableUsers(
        search = ""
    ) {
        let normalizedSearch = "";

        if (
            typeof search === "string"
        ) {
            normalizedSearch =
                search.trim();
        } else if (
            search &&
            typeof search === "object"
        ) {
            if (
                typeof search.search ===
                "string"
            ) {
                normalizedSearch =
                    search.search.trim();
            } else if (
                search.search &&
                typeof search.search ===
                "object"
            ) {
                normalizedSearch =
                    typeof search.search.search ===
                        "string"
                        ? search.search.search.trim()
                        : "";
            }
        }

        /*
         * Never send an empty search parameter.
         */
        if (!normalizedSearch) {
            return handleRequest(
                bookingApi.availableUsers()
            );
        }

        return handleRequest(
            bookingApi.availableUsers({
                search:
                    normalizedSearch,
            })
        );
    },

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER / USER INFORMATION
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch customers/users.
     */
    async users(
        params = {}
    ) {
        return handleRequest(
            bookingApi.users(
                params
            )
        );
    },

    /**
     * Fetch one customer/user.
     */
    async getUser(id) {
        const normalizedId =
            getCustomerUserId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Customer ID is required."
            );
        }

        return handleRequest(
            bookingApi.getUser(
                normalizedId
            )
        );
    },

    /**
     * Fetch tenant profiles.
     */
    async tenants(
        params = {}
    ) {
        return handleRequest(
            bookingApi.tenants(
                params
            )
        );
    },

    /**
     * Fetch one tenant.
     */
    async getTenant(id) {
        const normalizedId =
            getTenantId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Tenant ID is required."
            );
        }

        return handleRequest(
            bookingApi.getTenant(
                normalizedId
            )
        );
    },

    /**
     * Fetch tenant belonging to a customer/user.
     *
     * Customer ID is a USER ID.
     *
     * Example:
     *
     * GET /api/tenants?user_id=4
     */
    async getTenantByCustomer(
        customerId
    ) {
        const normalizedId =
            getCustomerUserId(
                customerId
            );

        if (!normalizedId) {
            return requiredIdResponse(
                "Customer ID is required."
            );
        }

        const result =
            await handleRequest(
                bookingApi.getTenantByUser(
                    normalizedId
                )
            );

        /*
         * Normalize the returned tenant so callers
         * don't have to understand the API envelope.
         */
        const tenant =
            extractResource(result);

        return {
            ...result,

            data: tenant,
        };
    },

    /**
     * Fetch available tenant users.
     */
    async availableTenantUsers(
        params = {}
    ) {
        return handleRequest(
            bookingApi.availableTenantUsers(
                params
            )
        );
    },

    /*
    |--------------------------------------------------------------------------
    | TENANCY INFORMATION
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch tenancies.
     */
    async tenancies(
        params = {}
    ) {
        return handleRequest(
            bookingApi.tenancies(
                params
            )
        );
    },

    /**
     * Fetch one tenancy.
     */
    async getTenancy(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Tenancy ID is required."
            );
        }

        return handleRequest(
            bookingApi.getTenancy(
                normalizedId
            )
        );
    },

    /**
     * Fetch tenancies belonging to a tenant.
     *
     * IMPORTANT:
     *
     * tenantId here is the TENANT PROFILE ID,
     * not the USER ID.
     */
    async getTenanciesByTenant(
        tenantId,
        params = {}
    ) {
        const normalizedId =
            getTenantId(
                tenantId
            );

        if (!normalizedId) {
            return requiredIdResponse(
                "Tenant ID is required."
            );
        }

        return handleRequest(
            bookingApi.getTenanciesByTenant(
                normalizedId,
                params
            )
        );
    },

    /**
     * Fetch active tenancies belonging to a tenant.
     */
    async getActiveTenanciesByTenant(
        tenantId,
        params = {}
    ) {
        const normalizedId =
            getTenantId(
                tenantId
            );

        if (!normalizedId) {
            return requiredIdResponse(
                "Tenant ID is required."
            );
        }

        return handleRequest(
            bookingApi.getActiveTenanciesByTenant(
                normalizedId,
                params
            )
        );
    },

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER → TENANT → TENANCY
    |--------------------------------------------------------------------------
    |
    | Customer/User
    |      ↓
    | Tenant Profile
    |      ↓
    | Tenancy
    |
    |--------------------------------------------------------------------------
    */

    /**
     * Resolve a customer's tenant and tenancies.
     *
     * This is the main relationship method used by BookingForm.
     *
     * IMPORTANT:
     *
     * customerId = USER ID
     *
     * tenant.id = TENANT PROFILE ID
     *
     * tenancy.tenant_id = TENANT PROFILE ID
     */
    async resolveCustomerTenancies(
        customerId,
        params = {}
    ) {
        const normalizedCustomerId =
            getCustomerUserId(
                customerId
            );

        if (!normalizedCustomerId) {
            return requiredIdResponse(
                "Customer ID is required."
            );
        }

        try {
            /*
             * Step 1:
             *
             * Resolve the tenant profile using
             * the customer/user ID.
             */
            const tenantResult =
                await this.getTenantByCustomer(
                    normalizedCustomerId
                );

            if (
                !tenantResult?.success
            ) {
                return {
                    success:
                        false,

                    code:
                        tenantResult?.code ??
                        404,

                    message:
                        tenantResult?.message ??
                        "Unable to resolve the customer tenant.",

                    data: {
                        customerId:
                            normalizedCustomerId,

                        customer: null,

                        tenant: null,

                        tenancies: [],
                    },

                    meta:
                        tenantResult?.meta ??
                        null,

                    links:
                        tenantResult?.links ??
                        null,

                    errors:
                        tenantResult?.errors ??
                        null,

                    response:
                        tenantResult?.response ??
                        null,
                };
            }

            const tenant =
                tenantResult?.data ??
                null;

            /*
             * No tenant profile.
             *
             * This is not an API failure.
             *
             * The selected user simply has no
             * tenant profile linked to the account.
             */
            if (!tenant) {
                return {
                    success: true,

                    code: 200,

                    message:
                        "Customer does not have a tenant profile.",

                    data: {
                        customerId:
                            normalizedCustomerId,

                        customer: null,

                        tenant: null,

                        tenancies: [],
                    },

                    meta: null,

                    links: null,

                    errors: null,

                    response: {
                        tenantResponse:
                            tenantResult?.response ??
                            null,

                        tenancyResponse:
                            null,
                    },
                };
            }

            /*
             * Step 2:
             *
             * Resolve tenant profile ID.
             */
            const tenantId =
                getTenantId(
                    tenant
                );

            if (!tenantId) {
                return {
                    success: true,

                    code: 200,

                    message:
                        "Tenant profile was found, but no tenant ID is available.",

                    data: {
                        customerId:
                            normalizedCustomerId,

                        customer: null,

                        tenant,

                        tenancies:
                            extractTenantTenancies(
                                tenant
                            ),
                    },

                    meta: null,

                    links: null,

                    errors: null,

                    response: {
                        tenantResponse:
                            tenantResult?.response ??
                            null,

                        tenancyResponse:
                            null,
                    },
                };
            }

            /*
             * Step 3:
             *
             * Fetch tenancies using TENANT PROFILE ID.
             */
            const tenancyResult =
                await this.getTenanciesByTenant(
                    tenantId,
                    params
                );

            /*
             * Tenancies returned directly by
             * /tenancies?tenant_id=...
             */
            const apiTenancies =
                tenancyResult?.success
                    ? extractCollection(
                        tenancyResult
                    )
                    : [];

            /*
             * Some tenant resources already contain:
             *
             * tenancies
             * active_tenancies
             * activeTenancies
             *
             * Keep those as a fallback.
             */
            const embeddedTenancies =
                extractTenantTenancies(
                    tenant
                );

            /*
             * Merge both sources and remove duplicates.
             */
            const tenancies =
                uniqueById([
                    ...apiTenancies,
                    ...embeddedTenancies,
                ]);

            /*
             * The tenancy request itself may fail while
             * the tenant profile exists.
             *
             * We preserve the tenant information and
             * return any embedded tenancies available.
             */
            if (
                !tenancyResult?.success
            ) {
                return {
                    success: true,

                    code:
                        tenancyResult?.code ??
                        200,

                    message:
                        "Tenant profile loaded, but tenancy information could not be loaded.",

                    data: {
                        customerId:
                            normalizedCustomerId,

                        customer: null,

                        tenant,

                        tenancies,
                    },

                    meta: null,

                    links: null,

                    errors:
                        tenancyResult?.errors ??
                        null,

                    response: {
                        tenantResponse:
                            tenantResult?.response ??
                            null,

                        tenancyResponse:
                            tenancyResult?.response ??
                            null,
                    },
                };
            }

            /*
             * Everything resolved successfully.
             */
            return {
                success: true,

                code: 200,

                message:
                    tenancies.length > 0
                        ? "Customer tenant and tenancy information loaded successfully."
                        : "Customer tenant profile loaded successfully, but no tenancies were found.",

                data: {
                    customerId:
                        normalizedCustomerId,

                    customer: null,

                    tenant,

                    tenancies,
                },

                meta:
                    tenancyResult?.meta ??
                    null,

                links:
                    tenancyResult?.links ??
                    null,

                errors: null,

                response: {
                    tenantResponse:
                        tenantResult?.response ??
                        null,

                    tenancyResponse:
                        tenancyResult?.response ??
                        null,
                },
            };
        } catch (error) {
            const normalized =
                normalizeError(error);

            return {
                success: false,

                code:
                    normalized.code,

                message:
                    normalized.message,

                data: {
                    customerId:
                        normalizedCustomerId,

                    customer: null,

                    tenant: null,

                    tenancies: [],
                },

                meta: null,

                links: null,

                errors:
                    normalized.errors,

                error:
                    normalized,

                response:
                    error?.response ??
                    null,
            };
        }
    },

    /**
     * Resolve only the customer/user.
     */
    async resolveCustomer(
        customerId
    ) {
        const normalizedId =
            getCustomerUserId(
                customerId
            );

        if (!normalizedId) {
            return requiredIdResponse(
                "Customer ID is required."
            );
        }

        return handleRequest(
            bookingApi.resolveCustomer(
                normalizedId
            )
        );
    },

    /**
     * Resolve tenant from customer.
     */
    async resolveTenantFromCustomer(
        customerId
    ) {
        const normalizedId =
            getCustomerUserId(
                customerId
            );

        if (!normalizedId) {
            return requiredIdResponse(
                "Customer ID is required."
            );
        }

        return this.getTenantByCustomer(
            normalizedId
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Restore
    |--------------------------------------------------------------------------
    */

    /**
     * Restore soft-deleted booking.
     */
    async restore(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        return handleRequest(
            bookingApi.restore(
                normalizedId
            )
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Force Delete
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete booking.
     */
    async forceDelete(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        return handleRequest(
            bookingApi.forceDelete(
                normalizedId
            )
        );
    },
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

export {
    normalizeError,
    getResponseData,
    getResponseMeta,
    getResponseLinks,
    getResponseMessage,
    handleRequest,
    extractResource,
    extractCollection,
    getId,
    getCustomerUserId,
    getTenantId,
    extractTenantTenancies,
    uniqueById,
};

export default bookingService;