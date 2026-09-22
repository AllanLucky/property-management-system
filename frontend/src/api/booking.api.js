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
|--------------------------------------------------------------------------
*/

const BOOKING_BASE_URL = "/bookings";
const TENANT_BASE_URL = "/tenants";
const TENANCY_BASE_URL = "/tenancies";
const USER_BASE_URL = "/users";

/*
|--------------------------------------------------------------------------
| Parameter Helpers
|--------------------------------------------------------------------------
*/

/**
 * Remove undefined, null and empty-string values.
 *
 * Also removes empty arrays and empty objects.
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
            ([, value]) => {
                if (
                    value === undefined ||
                    value === null ||
                    value === ""
                ) {
                    return false;
                }

                if (
                    Array.isArray(value) &&
                    value.length === 0
                ) {
                    return false;
                }

                if (
                    typeof value === "object" &&
                    !Array.isArray(value) &&
                    Object.keys(value).length === 0
                ) {
                    return false;
                }

                return true;
            }
        )
    );
};

/**
 * Clean nested query parameters.
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

    if (
        cleaned.search &&
        typeof cleaned.search === "object" &&
        !Array.isArray(cleaned.search)
    ) {
        const nestedSearch = cleanParams(
            cleaned.search
        );

        if (
            Object.keys(nestedSearch).length > 0
        ) {
            cleaned.search = nestedSearch;
        } else {
            delete cleaned.search;
        }
    }

    if (
        typeof cleaned.search === "string" &&
        !cleaned.search.trim()
    ) {
        delete cleaned.search;
    }

    return cleanParams(cleaned);
};

/*
|--------------------------------------------------------------------------
| ID Helpers
|--------------------------------------------------------------------------
*/

const getId = (value) => {
    if (
        value !== null &&
        typeof value === "object"
    ) {
        return (
            value?.id ??
            value?.value ??
            value?.key ??
            null
        );
    }

    return value;
};

const normalizeId = (value) => {
    const id = getId(value);

    if (
        id === null ||
        id === undefined ||
        id === ""
    ) {
        return null;
    }

    if (
        typeof id === "number" &&
        !Number.isFinite(id)
    ) {
        return null;
    }

    const normalized = String(id).trim();

    if (!normalized) {
        return null;
    }

    return normalized;
};

const normalizeIntegerId = (value) => {
    const normalized = normalizeId(value);

    if (!normalized) {
        return null;
    }

    if (!/^\d+$/.test(normalized)) {
        return null;
    }

    const numeric = Number(normalized);

    if (
        !Number.isSafeInteger(numeric) ||
        numeric <= 0
    ) {
        return null;
    }

    return String(numeric);
};

const withId = (baseUrl, id) => {
    const normalizedId = normalizeId(id);

    if (!normalizedId) {
        return baseUrl;
    }

    return `${baseUrl}/${encodeURIComponent(
        normalizedId
    )}`;
};

/*
|--------------------------------------------------------------------------
| Generic Object Helpers
|--------------------------------------------------------------------------
*/

const isObject = (value) => {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
};

const parseObject = (value) => {
    if (isObject(value)) {
        return value;
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);

            if (isObject(parsed)) {
                return parsed;
            }
        } catch {
            return {};
        }
    }

    return {};
};

const firstDefined = (...values) => {
    for (const value of values) {
        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            return value;
        }
    }

    return undefined;
};

/*
|--------------------------------------------------------------------------
| Response Normalization
|--------------------------------------------------------------------------
*/

const normalizeCollection = (response) => {
    let payload =
        response?.data?.data ??
        response?.data ??
        response ??
        [];

    if (
        payload &&
        typeof payload === "object" &&
        !Array.isArray(payload) &&
        Array.isArray(payload.data)
    ) {
        payload = payload.data;
    }

    if (Array.isArray(payload)) {
        return payload;
    }

    if (
        payload &&
        typeof payload === "object" &&
        payload.id !== undefined &&
        payload.id !== null
    ) {
        return [payload];
    }

    return [];
};

const normalizeResource = (response) => {
    let payload =
        response?.data?.data ??
        response?.data ??
        response ??
        null;

    if (
        payload &&
        typeof payload === "object" &&
        !Array.isArray(payload) &&
        Array.isArray(payload.data)
    ) {
        payload = payload.data[0] ?? null;
    }

    if (Array.isArray(payload)) {
        return payload[0] ?? null;
    }

    if (
        payload &&
        typeof payload === "object" &&
        payload.id !== undefined &&
        payload.id !== null
    ) {
        return payload;
    }

    return null;
};

/*
|--------------------------------------------------------------------------
| Financial Helpers
|--------------------------------------------------------------------------
*/

const normalizeAmount = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "0.00";
    }

    if (typeof value === "string") {
        const cleaned = value
            .replace(/KES/gi, "")
            .replace(/Ksh/gi, "")
            .replace(/,/g, "")
            .trim();

        const number = Number(cleaned);

        if (!Number.isFinite(number)) {
            return "0.00";
        }

        return number.toFixed(2);
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0.00";
    }

    return number.toFixed(2);
};

const normalizeBoolean = (value) => {
    return (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true"
    );
};

const resolveFinancialSource = (booking) => {
    const directFinancials = parseObject(
        booking?.financials
    );

    if (
        Object.keys(directFinancials).length > 0
    ) {
        return directFinancials;
    }

    const nestedFinancials = parseObject(
        booking?.data?.financials
    );

    if (
        Object.keys(nestedFinancials).length > 0
    ) {
        return nestedFinancials;
    }

    return {};
};

const normalizeBookingFinancials = (
    financials,
    booking = null
) => {
    const source = parseObject(financials);

    const bookingSource = isObject(booking)
        ? booking
        : {};

    const nestedBooking = isObject(
        bookingSource.data
    )
        ? bookingSource.data
        : {};

    const rentRaw = firstDefined(
        source.rent_amount,
        source.rentAmount,
        source.rent,

        bookingSource.rent_amount,
        bookingSource.rentAmount,
        bookingSource.rent,

        nestedBooking.rent_amount,
        nestedBooking.rentAmount,
        nestedBooking.rent
    );

    const depositRaw = firstDefined(
        source.deposit_amount,
        source.depositAmount,
        source.deposit,

        bookingSource.deposit_amount,
        bookingSource.depositAmount,
        bookingSource.deposit,

        nestedBooking.deposit_amount,
        nestedBooking.depositAmount,
        nestedBooking.deposit
    );

    const serviceChargeRaw = firstDefined(
        source.service_charge,
        source.serviceCharge,

        bookingSource.service_charge,
        bookingSource.serviceCharge,

        nestedBooking.service_charge,
        nestedBooking.serviceCharge
    );

    const bookingFeeRaw = firstDefined(
        source.booking_fee,
        source.bookingFee,
        source.fee,

        bookingSource.booking_fee,
        bookingSource.bookingFee,
        bookingSource.fee,

        nestedBooking.booking_fee,
        nestedBooking.bookingFee,
        nestedBooking.fee
    );

    const discountRaw = firstDefined(
        source.discount_amount,
        source.discountAmount,
        source.discount,

        bookingSource.discount_amount,
        bookingSource.discountAmount,
        bookingSource.discount,

        nestedBooking.discount_amount,
        nestedBooking.discountAmount,
        nestedBooking.discount
    );

    const totalRaw = firstDefined(
        source.total_amount,
        source.total,
        source.totalAmount,

        bookingSource.total_amount,
        bookingSource.total,
        bookingSource.totalAmount,

        nestedBooking.total_amount,
        nestedBooking.total,
        nestedBooking.totalAmount
    );

    const amountPaidRaw = firstDefined(
        source.amount_paid,
        source.paid_amount,
        source.amountPaid,
        source.paid,

        bookingSource.amount_paid,
        bookingSource.paid_amount,
        bookingSource.amountPaid,
        bookingSource.paid,

        nestedBooking.amount_paid,
        nestedBooking.paid_amount,
        nestedBooking.amountPaid,
        nestedBooking.paid
    );

    const balanceRaw = firstDefined(
        source.balance,
        source.balance_amount,
        source.balanceAmount,

        bookingSource.balance,
        bookingSource.balance_amount,
        bookingSource.balanceAmount,

        nestedBooking.balance,
        nestedBooking.balance_amount,
        nestedBooking.balanceAmount
    );

    const fullyPaidRaw = firstDefined(
        source.is_fully_paid,
        source.isFullyPaid,
        source.fully_paid,

        bookingSource.is_fully_paid,
        bookingSource.isFullyPaid,
        bookingSource.fully_paid,

        nestedBooking.is_fully_paid,
        nestedBooking.isFullyPaid,
        nestedBooking.fully_paid
    );

    const partiallyPaidRaw = firstDefined(
        source.is_partially_paid,
        source.isPartiallyPaid,
        source.partially_paid,

        bookingSource.is_partially_paid,
        bookingSource.isPartiallyPaid,
        bookingSource.partially_paid,

        nestedBooking.is_partially_paid,
        nestedBooking.isPartiallyPaid,
        nestedBooking.partially_paid
    );

    const balanceNumber = Number(
        balanceRaw ?? 0
    );

    const safeBalance = Number.isFinite(
        balanceNumber
    )
        ? balanceNumber
        : 0;

    const hasFinancialData = [
        rentRaw,
        depositRaw,
        serviceChargeRaw,
        bookingFeeRaw,
        discountRaw,
        totalRaw,
        amountPaidRaw,
        balanceRaw,
    ].some(
        (value) =>
            value !== undefined &&
            value !== null &&
            value !== ""
    );

    const explicitHasBalance = firstDefined(
        source.has_balance,
        source.hasBalance,

        bookingSource.has_balance,
        bookingSource.hasBalance,

        nestedBooking.has_balance,
        nestedBooking.hasBalance
    );

    return {
        rent_amount: normalizeAmount(
            rentRaw
        ),

        deposit_amount: normalizeAmount(
            depositRaw
        ),

        service_charge: normalizeAmount(
            serviceChargeRaw
        ),

        booking_fee: normalizeAmount(
            bookingFeeRaw
        ),

        discount_amount: normalizeAmount(
            discountRaw
        ),

        total_amount: normalizeAmount(
            totalRaw
        ),

        amount_paid: normalizeAmount(
            amountPaidRaw
        ),

        balance: normalizeAmount(
            balanceRaw
        ),

        is_fully_paid: normalizeBoolean(
            fullyPaidRaw
        ),

        is_partially_paid: normalizeBoolean(
            partiallyPaidRaw
        ),

        has_balance:
            normalizeBoolean(
                explicitHasBalance
            ) || safeBalance > 0,

        has_financial_data:
            hasFinancialData,
    };
};

/*
|--------------------------------------------------------------------------
| Booking Normalization
|--------------------------------------------------------------------------
*/

const normalizeBooking = (booking) => {
    if (
        !booking ||
        typeof booking !== "object" ||
        Array.isArray(booking)
    ) {
        return booking;
    }

    const financialSource =
        resolveFinancialSource(booking);

    return {
        ...booking,

        financials:
            normalizeBookingFinancials(
                financialSource,
                booking
            ),
    };
};

const normalizeBookingCollection = (
    response
) => {
    const bookings =
        normalizeCollection(response);

    return bookings.map(
        normalizeBooking
    );
};

const normalizeSingleBooking = (
    response
) => {
    const booking =
        normalizeResource(response);

    if (!booking) {
        return null;
    }

    return normalizeBooking(booking);
};

/*
|--------------------------------------------------------------------------
| Response Wrappers
|--------------------------------------------------------------------------
*/

const withNormalizedCollectionResponse = (
    response
) => {
    const bookings =
        normalizeBookingCollection(response);

    return {
        ...response,

        data: {
            ...(response?.data ?? {}),

            data: bookings,
        },
    };
};

const withNormalizedResourceResponse = (
    response
) => {
    const booking =
        normalizeSingleBooking(response);

    return {
        ...response,

        data: {
            ...(response?.data ?? {}),

            data: booking,
        },
    };
};

/*
|--------------------------------------------------------------------------
| Booking Collection Request
|--------------------------------------------------------------------------
*/

const getBookingCollection = async (
    url,
    params = {},
    config = {}
) => {
    const cleanedParams =
        cleanNestedParams(params);

    const response = await axios.get(
        url,
        {
            ...config,

            params: cleanedParams,
        }
    );

    return withNormalizedCollectionResponse(
        response
    );
};

/*
|--------------------------------------------------------------------------
| Generic Booking Action
|--------------------------------------------------------------------------
*/

const postBookingAction = (
    action,
    id,
    payload = {},
    config = {}
) => {
    const normalizedId =
        normalizeId(id);

    if (!normalizedId) {
        return Promise.reject(
            new Error(
                "A valid booking ID is required."
            )
        );
    }

    const url =
        `${BOOKING_BASE_URL}/${encodeURIComponent(
            normalizedId
        )}/${action}`;

    return axios.post(
        url,
        payload,
        config
    );
};

/*
|--------------------------------------------------------------------------
| Tenant / Tenancy Helpers
|--------------------------------------------------------------------------
*/

const normalizeTenant = (response) => {
    const tenants =
        normalizeCollection(response);

    return tenants[0] ?? null;
};

const normalizeTenancies = (response) => {
    return normalizeCollection(response);
};

const getTenantEmbeddedTenancies = (
    tenant
) => {
    if (
        !tenant ||
        typeof tenant !== "object"
    ) {
        return [];
    }

    const tenancies =
        Array.isArray(
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

        const id = normalizeId(
            tenancy.id
        );

        if (!id) {
            continue;
        }

        if (!map.has(id)) {
            map.set(id, tenancy);
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

    getAll: (
        params = {},
        config = {}
    ) =>
        getBookingCollection(
            BOOKING_BASE_URL,
            params,
            config
        ),

    getById: async (
        id,
        config = {}
    ) => {
        const normalizedId =
            normalizeId(id);

        if (!normalizedId) {
            throw new Error(
                "A valid booking ID is required."
            );
        }

        const url = withId(
            BOOKING_BASE_URL,
            normalizedId
        );

        const response =
            await axios.get(
                url,
                config
            );

        return withNormalizedResourceResponse(
            response
        );
    },

    create: async (
        payload = {},
        config = {}
    ) => {
        const response =
            await axios.post(
                BOOKING_BASE_URL,
                payload,
                config
            );

        return withNormalizedResourceResponse(
            response
        );
    },

    update: async (
        id,
        payload = {},
        config = {}
    ) => {
        const normalizedId =
            normalizeId(id);

        if (!normalizedId) {
            throw new Error(
                "A valid booking ID is required."
            );
        }

        const url = withId(
            BOOKING_BASE_URL,
            normalizedId
        );

        const response =
            await axios.put(
                url,
                payload,
                config
            );

        return withNormalizedResourceResponse(
            response
        );
    },

    patch: async (
        id,
        payload = {},
        config = {}
    ) => {
        const normalizedId =
            normalizeId(id);

        if (!normalizedId) {
            throw new Error(
                "A valid booking ID is required."
            );
        }

        const url = withId(
            BOOKING_BASE_URL,
            normalizedId
        );

        const response =
            await axios.patch(
                url,
                payload,
                config
            );

        return withNormalizedResourceResponse(
            response
        );
    },

    delete: (
        id,
        config = {}
    ) => {
        const normalizedId =
            normalizeId(id);

        if (!normalizedId) {
            return Promise.reject(
                new Error(
                    "A valid booking ID is required."
                )
            );
        }

        const url = withId(
            BOOKING_BASE_URL,
            normalizedId
        );

        return axios.delete(
            url,
            config
        );
    },

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    search: (
        params = {},
        config = {}
    ) =>
        getBookingCollection(
            `${BOOKING_BASE_URL}/search`,
            params,
            config
        ),

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    statistics: (
        params = {},
        config = {}
    ) => {
        const cleanedParams =
            cleanNestedParams(params);

        return axios.get(
            `${BOOKING_BASE_URL}/statistics`,
            {
                ...config,

                params: cleanedParams,
            }
        );
    },

    /*
    |--------------------------------------------------------------------------
    | REPORTS
    |--------------------------------------------------------------------------
    */

    reports: (
        params = {},
        config = {}
    ) => {
        const cleanedParams =
            cleanNestedParams(params);

        return axios.get(
            `${BOOKING_BASE_URL}/reports`,
            {
                ...config,

                params: cleanedParams,
            }
        );
    },

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE UNITS
    |--------------------------------------------------------------------------
    */

    availableUnits: (
        params = {},
        config = {}
    ) => {
        const source =
            params &&
                typeof params === "object" &&
                !Array.isArray(params)
                ? params
                : {};

        /*
        |--------------------------------------------------------------------------
        | Resolve IDs
        |--------------------------------------------------------------------------
        */

        const propertyId =
            normalizeIntegerId(
                firstDefined(
                    source.property_id,
                    source.propertyId,
                    source.property
                )
            );

        const apartmentId =
            normalizeIntegerId(
                firstDefined(
                    source.apartment_id,
                    source.apartmentId,
                    source.apartment
                )
            );

        const unitId =
            normalizeIntegerId(
                firstDefined(
                    source.unit_id,
                    source.unitId,
                    source.unit
                )
            );

        /*
        |--------------------------------------------------------------------------
        | Build final parameters
        |--------------------------------------------------------------------------
        */

        const finalParams = {
            ...source,
        };

        /*
        |--------------------------------------------------------------------------
        | Remove alternate frontend parameter names
        |--------------------------------------------------------------------------
        */

        delete finalParams.propertyId;
        delete finalParams.apartmentId;
        delete finalParams.unitId;

        delete finalParams.property;
        delete finalParams.apartment;
        delete finalParams.unit;

        /*
        |--------------------------------------------------------------------------
        | Add normalized API parameter names
        |--------------------------------------------------------------------------
        */

        if (propertyId) {
            finalParams.property_id =
                propertyId;
        } else {
            delete finalParams.property_id;
        }

        if (apartmentId) {
            finalParams.apartment_id =
                apartmentId;
        } else {
            delete finalParams.apartment_id;
        }

        if (unitId) {
            finalParams.unit_id =
                unitId;
        } else {
            delete finalParams.unit_id;
        }

        const cleanedParams =
            cleanNestedParams(
                finalParams
            );

        /*
        |--------------------------------------------------------------------------
        | Request
        |--------------------------------------------------------------------------
        */

        return axios.get(
            `${BOOKING_BASE_URL}/available-units`,
            {
                ...config,

                params: cleanedParams,
            }
        );
    },

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE USERS
    |--------------------------------------------------------------------------
    */

    availableUsers: (
        params = {},
        config = {}
    ) => {
        const cleanedParams =
            cleanNestedParams(params);

        return axios.get(
            `${BOOKING_BASE_URL}/available-users`,
            {
                ...config,

                params: cleanedParams,
            }
        );
    },

    /*
    |--------------------------------------------------------------------------
    | STATUS LISTS
    |--------------------------------------------------------------------------
    */

    pending: (
        params = {},
        config = {}
    ) =>
        getBookingCollection(
            `${BOOKING_BASE_URL}/pending`,
            params,
            config
        ),

    confirmed: (
        params = {},
        config = {}
    ) =>
        getBookingCollection(
            `${BOOKING_BASE_URL}/confirmed`,
            params,
            config
        ),

    active: (
        params = {},
        config = {}
    ) =>
        getBookingCollection(
            `${BOOKING_BASE_URL}/active`,
            params,
            config
        ),

    completed: (
        params = {},
        config = {}
    ) =>
        getBookingCollection(
            `${BOOKING_BASE_URL}/completed`,
            params,
            config
        ),

    cancelled: (
        params = {},
        config = {}
    ) =>
        getBookingCollection(
            `${BOOKING_BASE_URL}/cancelled`,
            params,
            config
        ),

    rejected: (
        params = {},
        config = {}
    ) =>
        getBookingCollection(
            `${BOOKING_BASE_URL}/rejected`,
            params,
            config
        ),

    expired: (
        params = {},
        config = {}
    ) =>
        getBookingCollection(
            `${BOOKING_BASE_URL}/expired`,
            params,
            config
        ),

    /*
    |--------------------------------------------------------------------------
    | BOOKING WORKFLOW
    |--------------------------------------------------------------------------
    */

    confirm: (
        id,
        config = {}
    ) =>
        postBookingAction(
            "confirm",
            id,
            {},
            config
        ),

    approve: (
        id,
        config = {}
    ) =>
        postBookingAction(
            "approve",
            id,
            {},
            config
        ),

    checkIn: (
        id,
        config = {}
    ) =>
        postBookingAction(
            "check-in",
            id,
            {},
            config
        ),

    complete: (
        id,
        config = {}
    ) =>
        postBookingAction(
            "complete",
            id,
            {},
            config
        ),

    cancel: (
        id,
        payload = {},
        config = {}
    ) =>
        postBookingAction(
            "cancel",
            id,
            payload,
            config
        ),

    reject: (
        id,
        rejectionReason,
        config = {}
    ) =>
        postBookingAction(
            "reject",
            id,
            {
                rejection_reason:
                    rejectionReason,
            },
            config
        ),

    expire: (
        id,
        config = {}
    ) =>
        postBookingAction(
            "expire",
            id,
            {},
            config
        ),

    /*
    |--------------------------------------------------------------------------
    | RESTORE
    |--------------------------------------------------------------------------
    */

    restore: (
        id,
        config = {}
    ) => {
        const normalizedId =
            normalizeId(id);

        if (!normalizedId) {
            return Promise.reject(
                new Error(
                    "A valid booking ID is required."
                )
            );
        }

        const url =
            `${BOOKING_BASE_URL}/${encodeURIComponent(
                normalizedId
            )}/restore`;

        return axios.patch(
            url,
            {},
            config
        );
    },

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    */

    forceDelete: (
        id,
        config = {}
    ) => {
        const normalizedId =
            normalizeId(id);

        if (!normalizedId) {
            return Promise.reject(
                new Error(
                    "A valid booking ID is required."
                )
            );
        }

        const url =
            `${BOOKING_BASE_URL}/${encodeURIComponent(
                normalizedId
            )}/force`;

        return axios.delete(
            url,
            config
        );
    },

    /*
    |--------------------------------------------------------------------------
    | USER INFORMATION
    |--------------------------------------------------------------------------
    */

    users: (
        params = {},
        config = {}
    ) => {
        const cleanedParams =
            cleanNestedParams(params);

        return axios.get(
            USER_BASE_URL,
            {
                ...config,

                params: cleanedParams,
            }
        );
    },

    getUser: (
        id,
        config = {}
    ) => {
        const normalizedId =
            normalizeId(id);

        if (!normalizedId) {
            return Promise.reject(
                new Error(
                    "A valid user ID is required."
                )
            );
        }

        const url = withId(
            USER_BASE_URL,
            normalizedId
        );

        return axios.get(
            url,
            config
        );
    },

    /*
    |--------------------------------------------------------------------------
    | TENANT INFORMATION
    |--------------------------------------------------------------------------
    */

    tenants: (
        params = {},
        config = {}
    ) => {
        const cleanedParams =
            cleanNestedParams(params);

        return axios.get(
            TENANT_BASE_URL,
            {
                ...config,

                params: cleanedParams,
            }
        );
    },

    getTenant: (
        id,
        config = {}
    ) => {
        const normalizedId =
            normalizeId(id);

        if (!normalizedId) {
            return Promise.reject(
                new Error(
                    "A valid tenant ID is required."
                )
            );
        }

        const url = withId(
            TENANT_BASE_URL,
            normalizedId
        );

        return axios.get(
            url,
            config
        );
    },

    getTenantByUser: (
        userId,
        config = {}
    ) => {
        const normalizedUserId =
            normalizeId(userId);

        if (!normalizedUserId) {
            return Promise.resolve(null);
        }

        const params = {
            user_id: normalizedUserId,
        };

        return axios.get(
            TENANT_BASE_URL,
            {
                ...config,

                params,
            }
        );
    },

    availableTenantUsers: (
        params = {},
        config = {}
    ) => {
        const cleanedParams =
            cleanNestedParams(params);

        return axios.get(
            `${TENANT_BASE_URL}/available-users`,
            {
                ...config,

                params: cleanedParams,
            }
        );
    },

    /*
    |--------------------------------------------------------------------------
    | TENANCY INFORMATION
    |--------------------------------------------------------------------------
    */

    tenancies: (
        params = {},
        config = {}
    ) => {
        const cleanedParams =
            cleanNestedParams(params);

        return axios.get(
            TENANCY_BASE_URL,
            {
                ...config,

                params: cleanedParams,
            }
        );
    },

    getTenancy: (
        id,
        config = {}
    ) => {
        const normalizedId =
            normalizeId(id);

        if (!normalizedId) {
            return Promise.reject(
                new Error(
                    "A valid tenancy ID is required."
                )
            );
        }

        const url = withId(
            TENANCY_BASE_URL,
            normalizedId
        );

        return axios.get(
            url,
            config
        );
    },

    getTenanciesByTenant: (
        tenantId,
        params = {},
        config = {}
    ) => {
        const normalizedTenantId =
            normalizeId(tenantId);

        if (!normalizedTenantId) {
            return Promise.resolve({
                data: {
                    data: [],
                },
            });
        }

        const finalParams =
            cleanNestedParams({
                ...params,

                tenant_id:
                    normalizedTenantId,
            });

        return axios.get(
            TENANCY_BASE_URL,
            {
                ...config,

                params: finalParams,
            }
        );
    },

    getActiveTenanciesByTenant: (
        tenantId,
        params = {},
        config = {}
    ) => {
        const normalizedTenantId =
            normalizeId(tenantId);

        if (!normalizedTenantId) {
            return Promise.resolve({
                data: {
                    data: [],
                },
            });
        }

        const finalParams =
            cleanNestedParams({
                ...params,

                tenant_id:
                    normalizedTenantId,

                status: "active",
            });

        return axios.get(
            TENANCY_BASE_URL,
            {
                ...config,

                params: finalParams,
            }
        );
    },

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER → TENANT → TENANCY
    |--------------------------------------------------------------------------
    */

    resolveCustomer: async (
        customerId,
        config = {}
    ) => {
        const normalizedId =
            normalizeId(customerId);

        if (!normalizedId) {
            return null;
        }

        const url = withId(
            USER_BASE_URL,
            normalizedId
        );

        return axios.get(
            url,
            config
        );
    },

    resolveTenantFromCustomer:
        async (
            customerId,
            config = {}
        ) => {
            const normalizedUserId =
                normalizeId(customerId);

            if (!normalizedUserId) {
                return null;
            }

            const params = {
                user_id:
                    normalizedUserId,
            };

            return axios.get(
                TENANT_BASE_URL,
                {
                    ...config,

                    params,
                }
            );
        },

    resolveCustomerTenancies:
        async (
            customerId,
            params = {},
            config = {}
        ) => {
            const normalizedUserId =
                normalizeId(customerId);

            if (!normalizedUserId) {
                return {
                    customerId: null,
                    customer: null,
                    tenant: null,
                    tenancies: [],
                    customerResponse: null,
                    tenantResponse: null,
                    tenancyResponse: null,
                };
            }

            /*
            |--------------------------------------------------------------------------
            | STEP 1 — Resolve customer + tenant
            |--------------------------------------------------------------------------
            */

            const customerPromise =
                axios.get(
                    withId(
                        USER_BASE_URL,
                        normalizedUserId
                    ),
                    config
                );

            const tenantParams = {
                user_id:
                    normalizedUserId,
            };

            const tenantPromise =
                axios.get(
                    TENANT_BASE_URL,
                    {
                        ...config,

                        params:
                            tenantParams,
                    }
                );

            const [
                customerResponse,
                tenantResponse,
            ] = await Promise.all([
                customerPromise,
                tenantPromise,
            ]);

            const customer =
                normalizeResource(
                    customerResponse
                );

            const tenant =
                normalizeTenant(
                    tenantResponse
                );

            /*
            |--------------------------------------------------------------------------
            | STEP 2 — No tenant profile
            |--------------------------------------------------------------------------
            */

            if (!tenant?.id) {
                return {
                    customerId:
                        normalizedUserId,

                    customer,

                    tenant: null,

                    tenancies: [],

                    customerResponse,

                    tenantResponse,

                    tenancyResponse: null,
                };
            }

            /*
            |--------------------------------------------------------------------------
            | STEP 3 — Embedded tenancies
            |--------------------------------------------------------------------------
            */

            const embeddedTenancies =
                getTenantEmbeddedTenancies(
                    tenant
                );

            let tenancies =
                uniqueTenancies(
                    embeddedTenancies
                );

            let tenancyResponse = null;

            /*
            |--------------------------------------------------------------------------
            | STEP 4 — Fallback to /tenancies
            |--------------------------------------------------------------------------
            */

            if (
                tenancies.length === 0
            ) {
                const tenancyUrl =
                    TENANCY_BASE_URL;

                const finalParams =
                    cleanNestedParams({
                        ...params,

                        tenant_id:
                            tenant.id,
                    });

                tenancyResponse =
                    await axios.get(
                        tenancyUrl,
                        {
                            ...config,

                            params:
                                finalParams,
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
            | COMPLETE
            |--------------------------------------------------------------------------
            */

            return {
                customerId:
                    normalizedUserId,

                customer,

                tenant,

                tenancies,

                customerResponse,

                tenantResponse,

                tenancyResponse,
            };
        },
};

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default bookingApi;