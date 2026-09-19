import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";

import bookingApi from "../api/booking.api";

import {
    fetchBookings,
    fetchBooking,
    createBooking,
    updateBooking,
    deleteBooking,
    searchBookings,
    fetchBookingStatistics,
    fetchBookingReports,

    fetchPendingBookings,
    fetchConfirmedBookings,
    fetchActiveBookings,
    fetchCompletedBookings,
    fetchCancelledBookings,
    fetchExpiredBookings,
    fetchRejectedBookings,

    confirmBooking,
    approveBooking,
    checkInBooking,
    completeBooking,
    cancelBooking,
    rejectBooking,
    expireBooking,

    fetchAvailableUnits,
    fetchAvailableUsers,

    restoreBooking,
    forceDeleteBooking,

    setFilters,
    clearFilters,
    setPage,
    setPerPage,
    clearCurrentBooking,
    clearError,
    resetBookingState,
} from "../store/bookingSlice";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely extract an ID from:
 *
 * 123
 * "123"
 * { id: 123 }
 * { value: 123 }
 * { user_id: 123 }
 */
const getBookingId = (value) => {
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
            null
        );
    }

    return value;
};

/**
 * Normalize API / Redux errors into a predictable shape.
 */
const normalizeError = (error) => {
    if (!error) {
        return null;
    }

    if (typeof error === "string") {
        return {
            message: error,
            errors: null,
            code: null,
        };
    }

    const responseData =
        error?.response?.data ??
        error?.payload ??
        error;

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
            error?.response?.status ??
            null,
    };
};

/**
 * Remove empty values before sending filters
 * to Redux/API.
 *
 * Keeps:
 * - 0
 * - false
 * - valid strings
 * - valid dates
 */
const cleanFilters = (filters = {}) => {
    if (
        !filters ||
        typeof filters !== "object" ||
        Array.isArray(filters)
    ) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(filters).filter(
            ([, value]) =>
                value !== undefined &&
                value !== null &&
                value !== ""
        )
    );
};

/**
 * Clean nested search parameters.
 *
 * Example:
 *
 * {
 *     search: {
 *         search: ""
 *     }
 * }
 *
 * becomes:
 *
 * {}
 */
const cleanSearchParams = (params = {}) => {
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
        const nestedSearch =
            cleanFilters(
                cleaned.search
            );

        if (
            Object.keys(
                nestedSearch
            ).length > 0
        ) {
            cleaned.search =
                nestedSearch;
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

    return cleanFilters(
        cleaned
    );
};

/**
 * Normalize Laravel collection / pagination responses.
 *
 * Supports:
 *
 * 1. Axios:
 *
 * response.data.data = []
 *
 * 2. Axios:
 *
 * response.data.data = {
 *     data: []
 * }
 *
 * 3. Axios:
 *
 * response.data.data = {
 *     id: 1
 * }
 *
 * 4. Direct:
 *
 * []
 *
 * 5. Direct:
 *
 * {
 *     id: 1
 * }
 */
const extractCollection = (response) => {
    let payload =
        response?.data?.data ??
        response?.data ??
        response ??
        [];

    /*
    |--------------------------------------------------------------------------
    | Laravel pagination wrapper
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
    | Array
    |--------------------------------------------------------------------------
    */

    if (Array.isArray(payload)) {
        return payload;
    }

    /*
    |--------------------------------------------------------------------------
    | Single resource
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
 * Extract the first resource from a Laravel
 * collection/resource response.
 *
 * Handles both:
 *
 * data: []
 *
 * and:
 *
 * data: {}
 */
const extractFirstResource = (response) => {
    const payload =
        response?.data?.data ??
        response?.data ??
        response ??
        null;

    if (!payload) {
        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Collection
    |--------------------------------------------------------------------------
    */

    if (Array.isArray(payload)) {
        return payload[0] ?? null;
    }

    /*
    |--------------------------------------------------------------------------
    | Pagination wrapper
    |--------------------------------------------------------------------------
    */

    if (
        payload &&
        typeof payload === "object" &&
        Array.isArray(payload.data)
    ) {
        return payload.data[0] ?? null;
    }

    /*
    |--------------------------------------------------------------------------
    | Single resource
    |--------------------------------------------------------------------------
    */

    if (
        payload &&
        typeof payload === "object" &&
        payload.id
    ) {
        return payload;
    }

    return null;
};

/**
 * Extract tenancies embedded inside a tenant resource.
 *
 * Your tenant API currently returns:
 *
 * tenant.tenancies
 *
 * and:
 *
 * tenant.active_tenancies
 *
 * We use these before making another API request.
 */
const extractTenantTenancies = (tenant) => {
    if (
        !tenant ||
        typeof tenant !== "object"
    ) {
        return [];
    }

    const tenancies = [
        ...(
            Array.isArray(
                tenant?.tenancies
            )
                ? tenant.tenancies
                : []
        ),

        ...(
            Array.isArray(
                tenant?.active_tenancies
            )
                ? tenant.active_tenancies
                : []
        ),

        ...(
            Array.isArray(
                tenant?.activeTenancies
            )
                ? tenant.activeTenancies
                : []
        ),
    ];

    /*
    |--------------------------------------------------------------------------
    | Remove duplicate tenancy IDs
    |--------------------------------------------------------------------------
    */

    const seen = new Set();

    return tenancies.filter(
        (tenancy) => {
            const id =
                getBookingId(
                    tenancy
                );

            if (!id) {
                return true;
            }

            const key =
                String(id);

            if (
                seen.has(key)
            ) {
                return false;
            }

            seen.add(key);

            return true;
        }
    );
};

/**
 * Extract user/customer ID from a customer object.
 *
 * Booking customer_id represents the USER ID.
 */
const getCustomerUserId = (
    customer
) => {
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
        customer?.customer_id ??
        customer?.id ??
        null
    );
};

/*
|--------------------------------------------------------------------------
| Hook
|--------------------------------------------------------------------------
*/

export const useBooking = ({
    autoFetch = true,
    initialFilters = {},
    initialPerPage = 15,
} = {}) => {
    const dispatch = useDispatch();

    /*
    |--------------------------------------------------------------------------
    | Redux State
    |--------------------------------------------------------------------------
    */

    const bookingState = useSelector(
        (state) =>
            state.bookings ?? {}
    );

    const {
        bookings = [],
        currentBooking = null,

        loading = false,
        loadingList = false,
        loadingSingle = false,
        loadingCreate = false,
        loadingUpdate = false,
        loadingDelete = false,
        loadingSearch = false,
        loadingStatistics = false,
        loadingReports = false,
        loadingAction = false,
        loadingAvailability = false,
        loadingUsers = false,
        loadingRestore = false,
        loadingForceDelete = false,

        error = null,
        errors = null,

        statistics = null,
        reports = null,

        availableUnits = [],
        availableUsers = [],

        pagination = {},
        filters: reduxFilters = {},

        page = 1,
        perPage = initialPerPage,

        total = 0,
        lastPage = 1,
        from = null,
        to = null,

        initialized = false,
    } = bookingState;

    /*
    |--------------------------------------------------------------------------
    | Customer → Tenant → Tenancy State
    |--------------------------------------------------------------------------
    */

    const [
        selectedCustomer,
        setSelectedCustomer,
    ] = useState(null);

    const [
        selectedTenant,
        setSelectedTenant,
    ] = useState(null);

    const [
        customerTenancies,
        setCustomerTenancies,
    ] = useState([]);

    const [
        customerTenancyLoading,
        setCustomerTenancyLoading,
    ] = useState(false);

    const [
        customerTenancyError,
        setCustomerTenancyError,
    ] = useState(null);

    /*
    |--------------------------------------------------------------------------
    | Derived State
    |--------------------------------------------------------------------------
    */

    const mergedFilters = useMemo(
        () => ({
            ...initialFilters,
            ...reduxFilters,
        }),
        [
            initialFilters,
            reduxFilters,
        ]
    );

    const normalizedBookings =
        useMemo(
            () =>
                Array.isArray(bookings)
                    ? bookings
                    : [],
            [bookings]
        );

    const normalizedAvailableUnits =
        useMemo(
            () =>
                Array.isArray(
                    availableUnits
                )
                    ? availableUnits
                    : [],
            [availableUnits]
        );

    const normalizedAvailableUsers =
        useMemo(
            () =>
                Array.isArray(
                    availableUsers
                )
                    ? availableUsers
                    : [],
            [availableUsers]
        );

    const normalizedCustomerTenancies =
        useMemo(
            () =>
                Array.isArray(
                    customerTenancies
                )
                    ? customerTenancies
                    : [],
            [customerTenancies]
        );

    /*
    |--------------------------------------------------------------------------
    | Fetch Bookings
    |--------------------------------------------------------------------------
    */

    const getBookings = useCallback(
        (params = {}) => {
            return dispatch(
                fetchBookings({
                    ...cleanFilters(
                        mergedFilters
                    ),

                    page,
                    per_page:
                        perPage,

                    ...cleanFilters(
                        params
                    ),
                })
            );
        },
        [
            dispatch,
            mergedFilters,
            page,
            perPage,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | Fetch Single Booking
    |--------------------------------------------------------------------------
    */

    const getBooking = useCallback(
        (bookingId) => {
            const id =
                getBookingId(
                    bookingId
                );

            if (!id) {
                return Promise.reject(
                    new Error(
                        "Booking ID is required."
                    )
                );
            }

            return dispatch(
                fetchBooking(id)
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    */

    const addBooking = useCallback(
        (payload) => {
            return dispatch(
                createBooking(
                    payload
                )
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    const editBooking = useCallback(
        (
            bookingId,
            payload
        ) => {
            const id =
                getBookingId(
                    bookingId
                );

            if (!id) {
                return Promise.reject(
                    new Error(
                        "Booking ID is required."
                    )
                );
            }

            return dispatch(
                updateBooking({
                    id,
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

    const removeBooking =
        useCallback(
            (bookingId) => {
                const id =
                    getBookingId(
                        bookingId
                    );

                if (!id) {
                    return Promise.reject(
                        new Error(
                            "Booking ID is required."
                        )
                    );
                }

                return dispatch(
                    deleteBooking(id)
                );
            },
            [dispatch]
        );

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    const search = useCallback(
        (
            searchTerm,
            params = {}
        ) => {
            return dispatch(
                searchBookings({
                    search:
                        searchTerm,

                    page,

                    per_page:
                        perPage,

                    ...cleanFilters(
                        mergedFilters
                    ),

                    ...cleanFilters(
                        params
                    ),
                })
            );
        },
        [
            dispatch,
            page,
            perPage,
            mergedFilters,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    const getStatistics =
        useCallback(
            (params = {}) => {
                return dispatch(
                    fetchBookingStatistics({
                        ...cleanFilters(
                            mergedFilters
                        ),

                        ...cleanFilters(
                            params
                        ),
                    })
                );
            },
            [
                dispatch,
                mergedFilters,
            ]
        );

    /*
    |--------------------------------------------------------------------------
    | Reports
    |--------------------------------------------------------------------------
    */

    const getReports =
        useCallback(
            (params = {}) => {
                return dispatch(
                    fetchBookingReports({
                        ...cleanFilters(
                            mergedFilters
                        ),

                        ...cleanFilters(
                            params
                        ),
                    })
                );
            },
            [
                dispatch,
                mergedFilters,
            ]
        );

    /*
    |--------------------------------------------------------------------------
    | Status Lists
    |--------------------------------------------------------------------------
    */

    const getPending =
        useCallback(
            (params = {}) => {
                return dispatch(
                    fetchPendingBookings({
                        page,
                        per_page:
                            perPage,

                        ...cleanFilters(
                            mergedFilters
                        ),

                        ...cleanFilters(
                            params
                        ),
                    })
                );
            },
            [
                dispatch,
                page,
                perPage,
                mergedFilters,
            ]
        );

    const getConfirmed =
        useCallback(
            (params = {}) => {
                return dispatch(
                    fetchConfirmedBookings({
                        page,
                        per_page:
                            perPage,

                        ...cleanFilters(
                            mergedFilters
                        ),

                        ...cleanFilters(
                            params
                        ),
                    })
                );
            },
            [
                dispatch,
                page,
                perPage,
                mergedFilters,
            ]
        );

    const getActive =
        useCallback(
            (params = {}) => {
                return dispatch(
                    fetchActiveBookings({
                        page,
                        per_page:
                            perPage,

                        ...cleanFilters(
                            mergedFilters
                        ),

                        ...cleanFilters(
                            params
                        ),
                    })
                );
            },
            [
                dispatch,
                page,
                perPage,
                mergedFilters,
            ]
        );

    const getCompleted =
        useCallback(
            (params = {}) => {
                return dispatch(
                    fetchCompletedBookings({
                        page,
                        per_page:
                            perPage,

                        ...cleanFilters(
                            mergedFilters
                        ),

                        ...cleanFilters(
                            params
                        ),
                    })
                );
            },
            [
                dispatch,
                page,
                perPage,
                mergedFilters,
            ]
        );

    const getCancelled =
        useCallback(
            (params = {}) => {
                return dispatch(
                    fetchCancelledBookings({
                        page,
                        per_page:
                            perPage,

                        ...cleanFilters(
                            mergedFilters
                        ),

                        ...cleanFilters(
                            params
                        ),
                    })
                );
            },
            [
                dispatch,
                page,
                perPage,
                mergedFilters,
            ]
        );

    const getExpired =
        useCallback(
            (params = {}) => {
                return dispatch(
                    fetchExpiredBookings({
                        page,
                        per_page:
                            perPage,

                        ...cleanFilters(
                            mergedFilters
                        ),

                        ...cleanFilters(
                            params
                        ),
                    })
                );
            },
            [
                dispatch,
                page,
                perPage,
                mergedFilters,
            ]
        );

    const getRejected =
        useCallback(
            (params = {}) => {
                return dispatch(
                    fetchRejectedBookings({
                        page,
                        per_page:
                            perPage,

                        ...cleanFilters(
                            mergedFilters
                        ),

                        ...cleanFilters(
                            params
                        ),
                    })
                );
            },
            [
                dispatch,
                page,
                perPage,
                mergedFilters,
            ]
        );

    /*
    |--------------------------------------------------------------------------
    | Customer → Tenant → Tenancy
    |--------------------------------------------------------------------------
    */

    /**
     * Resolve:
     *
     * Customer/User
     *      ↓
     * Tenant Profile
     *      ↓
     * Embedded Tenancies
     *
     * IMPORTANT:
     *
     * customerId = USER ID
     *
     * tenant.id = TENANT PROFILE ID
     *
     * The tenant endpoint already returns:
     *
     * tenant.tenancies
     *
     * and:
     *
     * tenant.active_tenancies
     *
     * Therefore those are used first.
     */
    const resolveCustomerTenancies =
        useCallback(
            async (
                customer,
                params = {}
            ) => {
                const customerId =
                    getCustomerUserId(
                        customer
                    );

                /*
                |--------------------------------------------------------------------------
                | No customer selected
                |--------------------------------------------------------------------------
                */

                if (!customerId) {
                    setSelectedCustomer(
                        null
                    );

                    setSelectedTenant(
                        null
                    );

                    setCustomerTenancies(
                        []
                    );

                    setCustomerTenancyError(
                        null
                    );

                    setCustomerTenancyLoading(
                        false
                    );

                    return {
                        customer: null,
                        customerId: null,
                        tenant: null,
                        tenancies: [],
                        tenantResponse:
                            null,
                        tenancyResponse:
                            null,
                    };
                }

                /*
                |--------------------------------------------------------------------------
                | Start relationship loading
                |--------------------------------------------------------------------------
                */

                setCustomerTenancyLoading(
                    true
                );

                setCustomerTenancyError(
                    null
                );

                /*
                |--------------------------------------------------------------------------
                | Preserve selected customer
                |--------------------------------------------------------------------------
                */

                if (
                    customer &&
                    typeof customer ===
                    "object"
                ) {
                    setSelectedCustomer(
                        customer
                    );
                } else {
                    setSelectedCustomer({
                        id: customerId,
                    });
                }

                /*
                |--------------------------------------------------------------------------
                | Clear previous relationship
                |--------------------------------------------------------------------------
                */

                setSelectedTenant(
                    null
                );

                setCustomerTenancies(
                    []
                );

                try {
                    /*
                    |--------------------------------------------------------------------------
                    | STEP 1
                    | Resolve tenant profile using USER ID.
                    |--------------------------------------------------------------------------
                    */

                    const tenantResponse =
                        await bookingApi.getTenantByUser(
                            customerId
                        );

                    /*
                    |--------------------------------------------------------------------------
                    | STEP 2
                    | Extract tenant profile.
                    |--------------------------------------------------------------------------
                    */

                    const tenant =
                        extractFirstResource(
                            tenantResponse
                        );

                    /*
                    |--------------------------------------------------------------------------
                    | STEP 3
                    | No tenant profile.
                    |--------------------------------------------------------------------------
                    */

                    if (!tenant?.id) {
                        setSelectedTenant(
                            null
                        );

                        setCustomerTenancies(
                            []
                        );

                        return {
                            customer:
                                customer ??
                                {
                                    id:
                                        customerId,
                                },

                            customerId,

                            tenant: null,

                            tenancies: [],

                            tenantResponse,

                            tenancyResponse:
                                null,
                        };
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | STEP 4
                    | Store tenant profile.
                    |--------------------------------------------------------------------------
                    */

                    setSelectedTenant(
                        tenant
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | STEP 5
                    | Use embedded tenancies first.
                    |--------------------------------------------------------------------------
                    */

                    const embeddedTenancies =
                        extractTenantTenancies(
                            tenant
                        );

                    /*
                    |--------------------------------------------------------------------------
                    | STEP 6
                    | If tenant resource already contains tenancies,
                    | use them directly.
                    |--------------------------------------------------------------------------
                    */

                    if (
                        embeddedTenancies.length >
                        0
                    ) {
                        setCustomerTenancies(
                            embeddedTenancies
                        );

                        return {
                            customer:
                                customer ??
                                {
                                    id:
                                        customerId,
                                },

                            customerId,

                            tenant,

                            tenancies:
                                embeddedTenancies,

                            tenantResponse,

                            tenancyResponse:
                                null,
                        };
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | STEP 7
                    | Fallback:
                    | Resolve tenancies using TENANT ID.
                    |--------------------------------------------------------------------------
                    */

                    const tenancyResponse =
                        await bookingApi.getTenanciesByTenant(
                            tenant.id,
                            cleanSearchParams(
                                params
                            )
                        );

                    /*
                    |--------------------------------------------------------------------------
                    | STEP 8
                    | Normalize tenancy collection.
                    |--------------------------------------------------------------------------
                    */

                    const tenancies =
                        extractCollection(
                            tenancyResponse
                        );

                    /*
                    |--------------------------------------------------------------------------
                    | STEP 9
                    | Store tenancies.
                    |--------------------------------------------------------------------------
                    */

                    setCustomerTenancies(
                        tenancies
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | STEP 10
                    | Return complete relationship.
                    |--------------------------------------------------------------------------
                    */

                    return {
                        customer:
                            customer ??
                            {
                                id:
                                    customerId,
                            },

                        customerId,

                        tenant,

                        tenancies,

                        tenantResponse,

                        tenancyResponse,
                    };
                } catch (error) {
                    const normalized =
                        normalizeError(
                            error
                        );

                    setSelectedTenant(
                        null
                    );

                    setCustomerTenancies(
                        []
                    );

                    setCustomerTenancyError(
                        normalized
                    );

                    throw error;
                } finally {
                    setCustomerTenancyLoading(
                        false
                    );
                }
            },
            []
        );

    /**
     * Fetch tenant profile for a user/customer.
     *
     * Customer ID = User ID.
     */
    const getTenantByCustomer =
        useCallback(
            async (
                customer
            ) => {
                const customerId =
                    getCustomerUserId(
                        customer
                    );

                if (!customerId) {
                    setSelectedTenant(
                        null
                    );

                    return null;
                }

                setCustomerTenancyError(
                    null
                );

                try {
                    const response =
                        await bookingApi.getTenantByUser(
                            customerId
                        );

                    const tenant =
                        extractFirstResource(
                            response
                        );

                    setSelectedTenant(
                        tenant
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | Also hydrate tenancies from tenant resource.
                    |--------------------------------------------------------------------------
                    */

                    const embeddedTenancies =
                        extractTenantTenancies(
                            tenant
                        );

                    setCustomerTenancies(
                        embeddedTenancies
                    );

                    return tenant;
                } catch (error) {
                    const normalized =
                        normalizeError(
                            error
                        );

                    setCustomerTenancyError(
                        normalized
                    );

                    setSelectedTenant(
                        null
                    );

                    setCustomerTenancies(
                        []
                    );

                    throw error;
                }
            },
            []
        );

    /**
     * Fetch all tenancies for a tenant.
     *
     * tenant.id is the tenant profile ID.
     */
    const getTenanciesByTenant =
        useCallback(
            async (
                tenant,
                params = {}
            ) => {
                const tenantId =
                    getBookingId(
                        tenant
                    );

                if (!tenantId) {
                    setCustomerTenancies(
                        []
                    );

                    return [];
                }

                /*
                |--------------------------------------------------------------------------
                | Use embedded tenancies if already available.
                |--------------------------------------------------------------------------
                */

                if (
                    tenant &&
                    typeof tenant ===
                    "object"
                ) {
                    const embeddedTenancies =
                        extractTenantTenancies(
                            tenant
                        );

                    if (
                        embeddedTenancies.length >
                        0
                    ) {
                        setCustomerTenancies(
                            embeddedTenancies
                        );

                        return embeddedTenancies;
                    }
                }

                setCustomerTenancyLoading(
                    true
                );

                setCustomerTenancyError(
                    null
                );

                try {
                    const response =
                        await bookingApi.getTenanciesByTenant(
                            tenantId,
                            cleanSearchParams(
                                params
                            )
                        );

                    const tenancies =
                        extractCollection(
                            response
                        );

                    setCustomerTenancies(
                        tenancies
                    );

                    return tenancies;
                } catch (error) {
                    const normalized =
                        normalizeError(
                            error
                        );

                    setCustomerTenancies(
                        []
                    );

                    setCustomerTenancyError(
                        normalized
                    );

                    throw error;
                } finally {
                    setCustomerTenancyLoading(
                        false
                    );
                }
            },
            []
        );

    /**
     * Fetch active tenancies for a tenant.
     */
    const getActiveTenanciesByTenant =
        useCallback(
            async (
                tenant,
                params = {}
            ) => {
                const tenantId =
                    getBookingId(
                        tenant
                    );

                if (!tenantId) {
                    setCustomerTenancies(
                        []
                    );

                    return [];
                }

                /*
                |--------------------------------------------------------------------------
                | Use embedded active tenancies first.
                |--------------------------------------------------------------------------
                */

                if (
                    tenant &&
                    typeof tenant ===
                    "object"
                ) {
                    const embeddedActiveTenancies =
                        Array.isArray(
                            tenant?.active_tenancies
                        )
                            ? tenant.active_tenancies
                            : Array.isArray(
                                tenant?.activeTenancies
                            )
                                ? tenant.activeTenancies
                                : [];

                    if (
                        embeddedActiveTenancies.length >
                        0
                    ) {
                        setCustomerTenancies(
                            embeddedActiveTenancies
                        );

                        return embeddedActiveTenancies;
                    }
                }

                setCustomerTenancyLoading(
                    true
                );

                setCustomerTenancyError(
                    null
                );

                try {
                    const response =
                        await bookingApi.getActiveTenanciesByTenant(
                            tenantId,
                            cleanSearchParams(
                                params
                            )
                        );

                    const tenancies =
                        extractCollection(
                            response
                        );

                    setCustomerTenancies(
                        tenancies
                    );

                    return tenancies;
                } catch (error) {
                    const normalized =
                        normalizeError(
                            error
                        );

                    setCustomerTenancies(
                        []
                    );

                    setCustomerTenancyError(
                        normalized
                    );

                    throw error;
                } finally {
                    setCustomerTenancyLoading(
                        false
                    );
                }
            },
            []
        );

    /**
     * Clear selected customer relationship data.
     */
    const clearCustomerRelationship =
        useCallback(() => {
            setSelectedCustomer(
                null
            );

            setSelectedTenant(
                null
            );

            setCustomerTenancies(
                []
            );

            setCustomerTenancyError(
                null
            );

            setCustomerTenancyLoading(
                false
            );
        }, []);

    /*
    |--------------------------------------------------------------------------
    | Booking Workflow
    |--------------------------------------------------------------------------
    */

    const confirm = useCallback(
        (bookingId) => {
            const id =
                getBookingId(
                    bookingId
                );

            if (!id) {
                return Promise.reject(
                    new Error(
                        "Booking ID is required."
                    )
                );
            }

            return dispatch(
                confirmBooking(id)
            );
        },
        [dispatch]
    );

    const approve = useCallback(
        (bookingId) => {
            const id =
                getBookingId(
                    bookingId
                );

            if (!id) {
                return Promise.reject(
                    new Error(
                        "Booking ID is required."
                    )
                );
            }

            return dispatch(
                approveBooking(id)
            );
        },
        [dispatch]
    );

    const checkIn = useCallback(
        (bookingId) => {
            const id =
                getBookingId(
                    bookingId
                );

            if (!id) {
                return Promise.reject(
                    new Error(
                        "Booking ID is required."
                    )
                );
            }

            return dispatch(
                checkInBooking(id)
            );
        },
        [dispatch]
    );

    const complete = useCallback(
        (bookingId) => {
            const id =
                getBookingId(
                    bookingId
                );

            if (!id) {
                return Promise.reject(
                    new Error(
                        "Booking ID is required."
                    )
                );
            }

            return dispatch(
                completeBooking(id)
            );
        },
        [dispatch]
    );

    const cancel = useCallback(
        (
            bookingId,
            payload = {}
        ) => {
            const id =
                getBookingId(
                    bookingId
                );

            if (!id) {
                return Promise.reject(
                    new Error(
                        "Booking ID is required."
                    )
                );
            }

            return dispatch(
                cancelBooking({
                    id,
                    data: payload,
                })
            );
        },
        [dispatch]
    );

    const reject = useCallback(
        (
            bookingId,
            rejectionReason
        ) => {
            const id =
                getBookingId(
                    bookingId
                );

            if (!id) {
                return Promise.reject(
                    new Error(
                        "Booking ID is required."
                    )
                );
            }

            return dispatch(
                rejectBooking({
                    id,
                    rejection_reason:
                        rejectionReason,
                })
            );
        },
        [dispatch]
    );

    const expire = useCallback(
        (bookingId) => {
            const id =
                getBookingId(
                    bookingId
                );

            if (!id) {
                return Promise.reject(
                    new Error(
                        "Booking ID is required."
                    )
                );
            }

            return dispatch(
                expireBooking(id)
            );
        },
        [dispatch]
    );

    /*
    |--------------------------------------------------------------------------
    | Availability
    |--------------------------------------------------------------------------
    */

    /**
     * Fetch available units.
     */
    const getAvailableUnits =
        useCallback(
            (params = {}) => {
                const cleanedParams =
                    cleanSearchParams(
                        params
                    );

                return dispatch(
                    fetchAvailableUnits(
                        cleanedParams
                    )
                );
            },
            [dispatch]
        );

    /**
     * Fetch available booking users.
     */
    const getAvailableUsers =
        useCallback(
            (searchTerm = "") => {
                /*
                |--------------------------------------------------------------------------
                | No search
                |--------------------------------------------------------------------------
                */

                if (
                    searchTerm === null ||
                    searchTerm === undefined
                ) {
                    return dispatch(
                        fetchAvailableUsers()
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | String search
                |--------------------------------------------------------------------------
                */

                if (
                    typeof searchTerm ===
                    "string"
                ) {
                    const trimmedSearch =
                        searchTerm.trim();

                    if (!trimmedSearch) {
                        return dispatch(
                            fetchAvailableUsers()
                        );
                    }

                    return dispatch(
                        fetchAvailableUsers(
                            trimmedSearch
                        )
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | Object search
                |--------------------------------------------------------------------------
                */

                if (
                    typeof searchTerm ===
                    "object" &&
                    !Array.isArray(
                        searchTerm
                    )
                ) {
                    const params = {
                        ...searchTerm,
                    };

                    /*
                    |--------------------------------------------------------------------------
                    | search: ""
                    |--------------------------------------------------------------------------
                    */

                    if (
                        typeof params.search ===
                        "string"
                    ) {
                        const trimmedSearch =
                            params.search.trim();

                        if (!trimmedSearch) {
                            delete params.search;
                        } else {
                            params.search =
                                trimmedSearch;
                        }
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | search: { search: "" }
                    |--------------------------------------------------------------------------
                    */

                    if (
                        params.search &&
                        typeof params.search ===
                        "object" &&
                        !Array.isArray(
                            params.search
                        )
                    ) {
                        const nestedSearch =
                            cleanFilters(
                                params.search
                            );

                        if (
                            Object.keys(
                                nestedSearch
                            ).length > 0
                        ) {
                            params.search =
                                nestedSearch;
                        } else {
                            delete params.search;
                        }
                    }

                    const cleanedParams =
                        cleanSearchParams(
                            params
                        );

                    if (
                        Object.keys(
                            cleanedParams
                        ).length === 0
                    ) {
                        return dispatch(
                            fetchAvailableUsers()
                        );
                    }

                    return dispatch(
                        fetchAvailableUsers(
                            cleanedParams
                        )
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | Fallback
                |--------------------------------------------------------------------------
                */

                return dispatch(
                    fetchAvailableUsers()
                );
            },
            [dispatch]
        );

    /*
    |--------------------------------------------------------------------------
    | Restore / Force Delete
    |--------------------------------------------------------------------------
    */

    const restore = useCallback(
        (bookingId) => {
            const id =
                getBookingId(
                    bookingId
                );

            if (!id) {
                return Promise.reject(
                    new Error(
                        "Booking ID is required."
                    )
                );
            }

            return dispatch(
                restoreBooking(id)
            );
        },
        [dispatch]
    );

    const forceDelete =
        useCallback(
            (bookingId) => {
                const id =
                    getBookingId(
                        bookingId
                    );

                if (!id) {
                    return Promise.reject(
                        new Error(
                            "Booking ID is required."
                        )
                    );
                }

                return dispatch(
                    forceDeleteBooking(
                        id
                    )
                );
            },
            [dispatch]
        );

    /*
    |--------------------------------------------------------------------------
    | Filters / Pagination
    |--------------------------------------------------------------------------
    */

    const updateFilters =
        useCallback(
            (newFilters = {}) => {
                dispatch(
                    setFilters(
                        cleanFilters(
                            newFilters
                        )
                    )
                );
            },
            [dispatch]
        );

    const resetFilters =
        useCallback(() => {
            dispatch(
                clearFilters()
            );
        }, [dispatch]);

    const changePage =
        useCallback(
            (newPage) => {
                dispatch(
                    setPage(newPage)
                );
            },
            [dispatch]
        );

    const changePerPage =
        useCallback(
            (newPerPage) => {
                dispatch(
                    setPerPage(
                        newPerPage
                    )
                );
            },
            [dispatch]
        );

    /*
    |--------------------------------------------------------------------------
    | Clear State
    |--------------------------------------------------------------------------
    */

    const clearCurrent =
        useCallback(() => {
            dispatch(
                clearCurrentBooking()
            );
        }, [dispatch]);

    const clearBookingError =
        useCallback(() => {
            dispatch(
                clearError()
            );
        }, [dispatch]);

    const reset =
        useCallback(() => {
            dispatch(
                resetBookingState()
            );

            clearCustomerRelationship();
        }, [
            dispatch,
            clearCustomerRelationship,
        ]);

    /*
    |--------------------------------------------------------------------------
    | Initial Fetch
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (
            !autoFetch ||
            initialized
        ) {
            return;
        }

        dispatch(
            fetchBookings({
                ...cleanFilters(
                    initialFilters
                ),

                page,

                per_page:
                    perPage,
            })
        );
    }, [
        autoFetch,
        initialized,
        dispatch,
        initialFilters,
        page,
        perPage,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Return API
    |--------------------------------------------------------------------------
    */

    return {
        /*
        |--------------------------------------------------------------------------
        | Booking Data
        |--------------------------------------------------------------------------
        */

        bookings:
            normalizedBookings,

        currentBooking,

        statistics,

        reports,

        availableUnits:
            normalizedAvailableUnits,

        availableUsers:
            normalizedAvailableUsers,

        pagination,

        page,

        perPage,

        total,

        lastPage,

        from,

        to,

        filters:
            mergedFilters,

        /*
        |--------------------------------------------------------------------------
        | Customer → Tenant → Tenancy
        |--------------------------------------------------------------------------
        */

        selectedCustomer,

        selectedTenant,

        customerTenancies:
            normalizedCustomerTenancies,

        customerTenancyLoading,

        customerTenancyError,

        resolveCustomerTenancies,

        getTenantByCustomer,

        getTenanciesByTenant,

        getActiveTenanciesByTenant,

        clearCustomerRelationship,

        /*
        |--------------------------------------------------------------------------
        | Loading
        |--------------------------------------------------------------------------
        */

        loading,

        loadingList,

        loadingSingle,

        loadingCreate,

        loadingUpdate,

        loadingDelete,

        loadingSearch,

        loadingStatistics,

        loadingReports,

        loadingAction,

        loadingAvailability,

        loadingUsers,

        loadingRestore,

        loadingForceDelete,

        /*
        |--------------------------------------------------------------------------
        | Errors
        |--------------------------------------------------------------------------
        */

        error:
            normalizeError(
                error
            ),

        errors,

        /*
        |--------------------------------------------------------------------------
        | CRUD
        |--------------------------------------------------------------------------
        */

        getBookings,

        getBooking,

        addBooking,

        editBooking,

        removeBooking,

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        search,

        /*
        |--------------------------------------------------------------------------
        | Statistics / Reports
        |--------------------------------------------------------------------------
        */

        getStatistics,

        getReports,

        /*
        |--------------------------------------------------------------------------
        | Status Lists
        |--------------------------------------------------------------------------
        */

        getPending,

        getConfirmed,

        getActive,

        getCompleted,

        getCancelled,

        getExpired,

        getRejected,

        /*
        |--------------------------------------------------------------------------
        | Workflow
        |--------------------------------------------------------------------------
        */

        confirm,

        approve,

        checkIn,

        complete,

        cancel,

        reject,

        expire,

        /*
        |--------------------------------------------------------------------------
        | Availability
        |--------------------------------------------------------------------------
        */

        getAvailableUnits,

        getAvailableUsers,

        /*
        |--------------------------------------------------------------------------
        | Restore / Delete
        |--------------------------------------------------------------------------
        */

        restore,

        forceDelete,

        /*
        |--------------------------------------------------------------------------
        | Filters / Pagination
        |--------------------------------------------------------------------------
        */

        updateFilters,

        resetFilters,

        changePage,

        changePerPage,

        /*
        |--------------------------------------------------------------------------
        | State Controls
        |--------------------------------------------------------------------------
        */

        clearCurrent,

        clearBookingError,

        reset,
    };
};

export default useBooking;