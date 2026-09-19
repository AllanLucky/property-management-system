import axios from "./axios";

/*
|--------------------------------------------------------------------------
| Booking API
|--------------------------------------------------------------------------
|
| Centralized API client for the EstateKenya Booking module.
|
| Backend base route:
| /api/bookings
|
| Standard API response:
|
| {
|     status: true,
|     code: 200,
|     message: "...",
|     data: [],
|     meta: {},
|     links: {},
|     errors: {}
| }
|
|--------------------------------------------------------------------------
*/

const BOOKING_BASE_URL = "/bookings";
const TENANT_BASE_URL = "/tenants";
const TENANCY_BASE_URL = "/tenancies";
const USER_BASE_URL = "/users";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Remove undefined, null and empty-string values.
 *
 * Keeps valid values such as:
 * - 0
 * - false
 * - valid strings
 * - valid dates
 */
const cleanParams = (params = {}) => {
    if (
        !params ||
        typeof params !== "object" ||
        Array.isArray(params)
    ) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(params).filter(
            ([, value]) =>
                value !== undefined &&
                value !== null &&
                value !== ""
        )
    );
};

/**
 * Clean nested query parameters.
 *
 * Prevents requests such as:
 *
 * ?search[search]=
 */
const cleanNestedParams = (params = {}) => {
    if (
        !params ||
        typeof params !== "object" ||
        Array.isArray(params)
    ) {
        return {};
    }

    const cleaned = {
        ...params,
    };

    /*
    |--------------------------------------------------------------------------
    | Nested search object
    |--------------------------------------------------------------------------
    */

    if (
        cleaned.search &&
        typeof cleaned.search === "object" &&
        !Array.isArray(cleaned.search)
    ) {
        const nestedSearch = cleanParams(
            cleaned.search
        );

        if (
            Object.keys(
                nestedSearch
            ).length > 0
        ) {
            cleaned.search = nestedSearch;
        } else {
            delete cleaned.search;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Empty search string
    |--------------------------------------------------------------------------
    */

    if (
        typeof cleaned.search === "string" &&
        !cleaned.search.trim()
    ) {
        delete cleaned.search;
    }

    return cleanParams(cleaned);
};

/**
 * Normalize an ID.
 *
 * Supports:
 *
 * 5
 * "5"
 * { id: 5 }
 * { id: "5" }
 * { value: 5 }
 */
const getId = (value) => {
    if (
        value !== null &&
        typeof value === "object"
    ) {
        return (
            value?.id ??
            value?.value ??
            null
        );
    }

    return value;
};

/**
 * Normalize an ID as a comparable string.
 */
const normalizeId = (value) => {
    const id = getId(value);

    if (
        id === null ||
        id === undefined ||
        id === ""
    ) {
        return null;
    }

    return String(id);
};

/**
 * Build a safe URL using an ID.
 */
const withId = (baseUrl, id) => {
    const normalizedId = getId(id);

    return `${baseUrl}/${normalizedId}`;
};

/**
 * Normalize API collection responses.
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
 *     id: 1
 * }
 */
const normalizeCollection = (response) => {
    let payload =
        response?.data?.data ??
        response?.data ??
        response ??
        [];

    /*
    |--------------------------------------------------------------------------
    | Nested data collection
    |--------------------------------------------------------------------------
    */

    if (
        payload &&
        typeof payload === "object" &&
        !Array.isArray(payload) &&
        Array.isArray(payload.data)
    ) {
        payload = payload.data;
    }

    /*
    |--------------------------------------------------------------------------
    | Array response
    |--------------------------------------------------------------------------
    */

    if (Array.isArray(payload)) {
        return payload;
    }

    /*
    |--------------------------------------------------------------------------
    | Single resource response
    |--------------------------------------------------------------------------
    */

    if (
        payload &&
        typeof payload === "object" &&
        payload.id
    ) {
        return [payload];
    }

    return [];
};

/**
 * Normalize tenant response.
 *
 * Supports:
 *
 * GET /tenants?user_id=24
 *
 * returning:
 *
 * data: [...]
 *
 * or:
 *
 * data: {
 *     id: 17,
 *     user_id: 24,
 *     ...
 * }
 */
const normalizeTenant = (response) => {
    const tenants =
        normalizeCollection(
            response
        );

    return tenants[0] ?? null;
};

/**
 * Normalize tenancy response.
 */
const normalizeTenancies = (response) => {
    return normalizeCollection(
        response
    );
};

/**
 * Extract tenancies embedded inside a tenant resource.
 *
 * Your TenantResource already returns:
 *
 * tenancies: [...]
 * active_tenancies: [...]
 *
 * Therefore we can use those directly without depending
 * on another tenancy request.
 */
const getTenantEmbeddedTenancies = (
    tenant
) => {
    if (
        !tenant ||
        typeof tenant !== "object"
    ) {
        return [];
    }

    const tenancies = Array.isArray(
        tenant.tenancies
    )
        ? tenant.tenancies
        : [];

    const activeTenancies =
        Array.isArray(
            tenant.active_tenancies
        )
            ? tenant.active_tenancies
            : [];

    return [
        ...tenancies,
        ...activeTenancies,
    ];
};

/**
 * Remove duplicate tenancy records.
 *
 * A tenancy can exist in both:
 *
 * tenant.tenancies
 * tenant.active_tenancies
 */
const uniqueTenancies = (
    tenancies = []
) => {
    const map = new Map();

    for (const tenancy of tenancies) {
        if (
            !tenancy ||
            typeof tenancy !== "object"
        ) {
            continue;
        }

        const id =
            normalizeId(
                tenancy.id
            );

        if (!id) {
            continue;
        }

        if (!map.has(id)) {
            map.set(
                id,
                tenancy
            );
        }
    }

    return Array.from(
        map.values()
    );
};

/*
|--------------------------------------------------------------------------
| Booking API
|--------------------------------------------------------------------------
*/

const bookingApi = {
    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch paginated bookings.
     */
    getAll: (params = {}) =>
        axios.get(
            BOOKING_BASE_URL,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    /**
     * Fetch a single booking.
     */
    getById: (id) =>
        axios.get(
            withId(
                BOOKING_BASE_URL,
                id
            )
        ),

    /**
     * Create a booking.
     */
    create: (payload = {}) =>
        axios.post(
            BOOKING_BASE_URL,
            payload
        ),

    /**
     * Update a booking.
     */
    update: (
        id,
        payload = {}
    ) =>
        axios.put(
            withId(
                BOOKING_BASE_URL,
                id
            ),
            payload
        ),

    /**
     * Soft-delete a booking.
     */
    delete: (id) =>
        axios.delete(
            withId(
                BOOKING_BASE_URL,
                id
            )
        ),

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    search: (params = {}) =>
        axios.get(
            `${BOOKING_BASE_URL}/search`,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    statistics: (params = {}) =>
        axios.get(
            `${BOOKING_BASE_URL}/statistics`,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    /*
    |--------------------------------------------------------------------------
    | REPORTS
    |--------------------------------------------------------------------------
    */

    reports: (params = {}) =>
        axios.get(
            `${BOOKING_BASE_URL}/reports`,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    /*
    |--------------------------------------------------------------------------
    | STATUS LISTS
    |--------------------------------------------------------------------------
    */

    pending: (params = {}) =>
        axios.get(
            `${BOOKING_BASE_URL}/pending`,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    confirmed: (params = {}) =>
        axios.get(
            `${BOOKING_BASE_URL}/confirmed`,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    active: (params = {}) =>
        axios.get(
            `${BOOKING_BASE_URL}/active`,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    completed: (params = {}) =>
        axios.get(
            `${BOOKING_BASE_URL}/completed`,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    cancelled: (params = {}) =>
        axios.get(
            `${BOOKING_BASE_URL}/cancelled`,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    rejected: (params = {}) =>
        axios.get(
            `${BOOKING_BASE_URL}/rejected`,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    expired: (params = {}) =>
        axios.get(
            `${BOOKING_BASE_URL}/expired`,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    /*
    |--------------------------------------------------------------------------
    | BOOKING WORKFLOW
    |--------------------------------------------------------------------------
    */

    confirm: (id) =>
        axios.post(
            `${BOOKING_BASE_URL}/${getId(
                id
            )}/confirm`
        ),

    approve: (id) =>
        axios.post(
            `${BOOKING_BASE_URL}/${getId(
                id
            )}/approve`
        ),

    checkIn: (id) =>
        axios.post(
            `${BOOKING_BASE_URL}/${getId(
                id
            )}/check-in`
        ),

    complete: (id) =>
        axios.post(
            `${BOOKING_BASE_URL}/${getId(
                id
            )}/complete`
        ),

    cancel: (
        id,
        payload = {}
    ) =>
        axios.post(
            `${BOOKING_BASE_URL}/${getId(
                id
            )}/cancel`,
            payload
        ),

    reject: (
        id,
        rejectionReason
    ) =>
        axios.post(
            `${BOOKING_BASE_URL}/${getId(
                id
            )}/reject`,
            {
                rejection_reason:
                    rejectionReason,
            }
        ),

    expire: (id) =>
        axios.post(
            `${BOOKING_BASE_URL}/${getId(
                id
            )}/expire`
        ),

    /*
    |--------------------------------------------------------------------------
    | AVAILABILITY
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch units available for booking.
     */
    availableUnits: (
        params = {}
    ) =>
        axios.get(
            `${BOOKING_BASE_URL}/available-units`,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    /**
     * Fetch users eligible to make bookings.
     *
     * Empty:
     *
     * GET /bookings/available-users
     *
     * Search:
     *
     * GET /bookings/available-users?search=Allan
     */
    availableUsers: (
        params = {}
    ) => {
        const cleanedParams =
            cleanNestedParams(
                params
            );

        if (
            Object.keys(
                cleanedParams
            ).length === 0
        ) {
            return axios.get(
                `${BOOKING_BASE_URL}/available-users`
            );
        }

        return axios.get(
            `${BOOKING_BASE_URL}/available-users`,
            {
                params:
                    cleanedParams,
            }
        );
    },

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER / USER INFORMATION
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch users.
     */
    users: (params = {}) =>
        axios.get(
            USER_BASE_URL,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    /**
     * Fetch one user/customer.
     */
    getUser: (id) =>
        axios.get(
            withId(
                USER_BASE_URL,
                id
            )
        ),

    /*
    |--------------------------------------------------------------------------
    | TENANT INFORMATION
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch tenant profiles.
     */
    tenants: (
        params = {}
    ) =>
        axios.get(
            TENANT_BASE_URL,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    /**
     * Fetch one tenant profile.
     */
    getTenant: (id) =>
        axios.get(
            withId(
                TENANT_BASE_URL,
                id
            )
        ),

    /**
     * Fetch tenant profile belonging to a user/customer.
     *
     * GET /tenants?user_id={userId}
     *
     * Example:
     *
     * user_id = 24
     *
     * returns:
     *
     * tenant.id = 17
     * tenant.user_id = 24
     */
    getTenantByUser: (
        userId
    ) => {
        const normalizedUserId =
            getId(userId);

        if (
            !normalizedUserId
        ) {
            return Promise.resolve(
                null
            );
        }

        return axios.get(
            TENANT_BASE_URL,
            {
                params: {
                    user_id:
                        normalizedUserId,
                },
            }
        );
    },

    /**
     * Fetch available tenant users.
     *
     * These are users who can still be linked
     * to a tenant profile.
     */
    availableTenantUsers: (
        params = {}
    ) =>
        axios.get(
            `${TENANT_BASE_URL}/available-users`,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    /*
    |--------------------------------------------------------------------------
    | TENANCY INFORMATION
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch tenancies.
     */
    tenancies: (
        params = {}
    ) =>
        axios.get(
            TENANCY_BASE_URL,
            {
                params:
                    cleanNestedParams(
                        params
                    ),
            }
        ),

    /**
     * Fetch one tenancy.
     */
    getTenancy: (id) =>
        axios.get(
            withId(
                TENANCY_BASE_URL,
                id
            )
        ),

    /**
     * Fetch tenancies belonging to a tenant.
     *
     * tenantId = TENANT PROFILE ID.
     *
     * Example:
     *
     * tenantId = 17
     *
     * NOT user ID 24.
     */
    getTenanciesByTenant: (
        tenantId,
        params = {}
    ) => {
        const normalizedTenantId =
            getId(tenantId);

        if (
            !normalizedTenantId
        ) {
            return Promise.resolve({
                data: {
                    data: [],
                },
            });
        }

        return axios.get(
            TENANCY_BASE_URL,
            {
                params:
                    cleanNestedParams({
                        ...params,
                        tenant_id:
                            normalizedTenantId,
                    }),
            }
        );
    },

    /**
     * Fetch active tenancies belonging to a tenant.
     */
    getActiveTenanciesByTenant: (
        tenantId,
        params = {}
    ) => {
        const normalizedTenantId =
            getId(tenantId);

        if (
            !normalizedTenantId
        ) {
            return Promise.resolve({
                data: {
                    data: [],
                },
            });
        }

        return axios.get(
            TENANCY_BASE_URL,
            {
                params:
                    cleanNestedParams({
                        ...params,
                        tenant_id:
                            normalizedTenantId,
                        status: "active",
                    }),
            }
        );
    },

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER → TENANT → TENANCY
    |--------------------------------------------------------------------------
    */

    /**
     * Resolve customer information.
     *
     * Customer ID = USER ID.
     */
    resolveCustomer: async (
        customerId
    ) => {
        const id =
            getId(
                customerId
            );

        if (!id) {
            return null;
        }

        return axios.get(
            withId(
                USER_BASE_URL,
                id
            )
        );
    },

    /**
     * Resolve tenant belonging to a customer.
     *
     * Customer:
     *
     * User ID = 24
     *
     * Tenant:
     *
     * Tenant ID = 17
     *
     * Request:
     *
     * GET /tenants?user_id=24
     */
    resolveTenantFromCustomer:
        async (
            customerId
        ) => {
            const userId =
                getId(
                    customerId
                );

            if (!userId) {
                return null;
            }

            return axios.get(
                TENANT_BASE_URL,
                {
                    params: {
                        user_id:
                            userId,
                    },
                }
            );
        },

    /**
     * Resolve:
     *
     * Customer/User
     *        ↓
     * Tenant Profile
     *        ↓
     * Tenancies
     *
     * IMPORTANT:
     *
     * Customer ID = USER ID
     *
     * Tenant ID = TENANT PROFILE ID
     *
     * Example:
     *
     * Customer/User:
     *     id = 24
     *
     * Tenant:
     *     id = 17
     *     user_id = 24
     *
     * Tenancy:
     *     tenant_id = 17
     *
     * The tenant endpoint already returns:
     *
     *     tenancies
     *     active_tenancies
     *
     * Therefore those embedded records are used first.
     */
    resolveCustomerTenancies:
        async (
            customerId,
            params = {}
        ) => {
            const userId =
                getId(
                    customerId
                );

            /*
            |--------------------------------------------------------------------------
            | No customer
            |--------------------------------------------------------------------------
            */

            if (!userId) {
                return {
                    customerId:
                        null,

                    customer:
                        null,

                    tenant:
                        null,

                    tenancies:
                        [],

                    tenantResponse:
                        null,

                    tenancyResponse:
                        null,
                };
            }

            /*
            |--------------------------------------------------------------------------
            | STEP 1
            |--------------------------------------------------------------------------
            | Resolve tenant using USER ID.
            |--------------------------------------------------------------------------
            */

            const tenantResponse =
                await axios.get(
                    TENANT_BASE_URL,
                    {
                        params: {
                            user_id:
                                userId,
                        },
                    }
                );

            /*
            |--------------------------------------------------------------------------
            | STEP 2
            |--------------------------------------------------------------------------
            | Extract tenant.
            |--------------------------------------------------------------------------
            */

            const tenant =
                normalizeTenant(
                    tenantResponse
                );

            /*
            |--------------------------------------------------------------------------
            | STEP 3
            |--------------------------------------------------------------------------
            | No tenant profile.
            |--------------------------------------------------------------------------
            */

            if (!tenant?.id) {
                return {
                    customerId:
                        userId,

                    customer:
                        null,

                    tenant:
                        null,

                    tenancies:
                        [],

                    tenantResponse,

                    tenancyResponse:
                        null,
                };
            }

            /*
            |--------------------------------------------------------------------------
            | STEP 4
            |--------------------------------------------------------------------------
            | Read tenancies already embedded
            | inside the TenantResource.
            |--------------------------------------------------------------------------
            */

            const embeddedTenancies =
                getTenantEmbeddedTenancies(
                    tenant
                );

            /*
            |--------------------------------------------------------------------------
            | STEP 5
            |--------------------------------------------------------------------------
            | If tenant already supplied tenancies,
            | use them immediately.
            |--------------------------------------------------------------------------
            */

            let tenancies =
                uniqueTenancies(
                    embeddedTenancies
                );

            let tenancyResponse =
                null;

            /*
            |--------------------------------------------------------------------------
            | STEP 6
            |--------------------------------------------------------------------------
            | Supplement using /tenancies only when
            | embedded tenancies are unavailable.
            |--------------------------------------------------------------------------
            |
            | This prevents the frontend from failing simply
            | because the tenancy endpoint has a different
            | response shape or filtering behavior.
            |--------------------------------------------------------------------------
            */

            if (
                tenancies.length === 0
            ) {
                tenancyResponse =
                    await axios.get(
                        TENANCY_BASE_URL,
                        {
                            params:
                                cleanNestedParams(
                                    {
                                        ...params,
                                        tenant_id:
                                            tenant.id,
                                    }
                                ),
                        }
                    );

                tenancies =
                    uniqueTenancies(
                        normalizeTenancies(
                            tenancyResponse
                        )
                    );
            }

            /*
            |--------------------------------------------------------------------------
            | STEP 7
            |--------------------------------------------------------------------------
            | Return complete relationship.
            |--------------------------------------------------------------------------
            */

            return {
                customerId:
                    userId,

                customer:
                    null,

                tenant,

                tenancies,

                tenantResponse,

                tenancyResponse,
            };
        },

    /*
    |--------------------------------------------------------------------------
    | RESTORE
    |--------------------------------------------------------------------------
    */

    /**
     * Restore a soft-deleted booking.
     *
     * PATCH /bookings/{booking}/restore
     */
    restore: (id) =>
        axios.patch(
            `${BOOKING_BASE_URL}/${getId(
                id
            )}/restore`
        ),

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete a booking.
     *
     * DELETE /bookings/{booking}/force
     */
    forceDelete: (id) =>
        axios.delete(
            `${BOOKING_BASE_URL}/${getId(
                id
            )}/force`
        ),
};

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default bookingApi;