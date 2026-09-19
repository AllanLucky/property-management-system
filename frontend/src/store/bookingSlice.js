import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import bookingService from "../services/booking.service";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

const INITIAL_FILTERS = {
    search: "",
    status: "",
    payment_status: "",
    booking_type: "",
    source: "",
    property_id: "",
    apartment_id: "",
    unit_id: "",
    customer_id: "",
    tenant_id: "",
    tenancy_id: "",
    start_date: "",
    end_date: "",
    booking_date: "",
    paid_date: "",
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Extract a useful error message from a service response.
 */
const getErrorMessage = (result) => {
    return (
        result?.message ??
        result?.error?.message ??
        "Something went wrong. Please try again."
    );
};

/**
 * Extract validation errors.
 */
const getValidationErrors = (result) => {
    return (
        result?.errors ??
        result?.error?.errors ??
        null
    );
};

/**
 * Safely normalize an array.
 */
const safeArray = (value) => {
    return Array.isArray(value) ? value : [];
};

/**
 * Get a generic resource ID.
 */
const getId = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        return value;
    }

    return (
        value?.id ??
        value?.value ??
        value?.booking_id ??
        value?.tenancy_id ??
        value?.unit_id ??
        value?.apartment_id ??
        value?.property_id ??
        null
    );
};

/**
 * Get the USER ID of a booking customer.
 *
 * Customer = users.id
 *
 * Tenant profile = tenants.id
 * Tenant profile user = tenants.user_id
 *
 * These must not be confused.
 */
const getCustomerUserId = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        return value;
    }

    return (
        value?.user_id ??
        value?.user?.id ??
        value?.customer_id ??
        value?.customer?.id ??
        value?.id ??
        value?.value ??
        null
    );
};

/**
 * Get the TENANT PROFILE ID.
 *
 * Tenancy queries require tenants.id,
 * not users.id.
 */
const getTenantProfileId = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        return value;
    }

    return (
        value?.tenant_id ??
        value?.tenant?.id ??
        value?.id ??
        value?.value ??
        null
    );
};

/**
 * Get a tenancy ID.
 */
const getTenancyId = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        return value;
    }

    return (
        value?.tenancy_id ??
        value?.id ??
        value?.value ??
        null
    );
};

/**
 * Unwrap the useful data portion from a service response.
 */
const unwrapData = (result) => {
    if (
        result === null ||
        result === undefined
    ) {
        return null;
    }

    if (
        result?.data !== undefined &&
        result?.data !== null
    ) {
        return result.data;
    }

    return result;
};

/**
 * Normalize collection responses.
 *
 * Supports:
 *
 * []
 *
 * { data: [] }
 *
 * { items: [] }
 *
 * { results: [] }
 *
 * { records: [] }
 */
const normalizeCollection = (value) => {
    if (Array.isArray(value)) {
        return value;
    }

    if (
        value &&
        typeof value === "object"
    ) {
        if (Array.isArray(value.data)) {
            return value.data;
        }

        if (Array.isArray(value.items)) {
            return value.items;
        }

        if (Array.isArray(value.results)) {
            return value.results;
        }

        if (Array.isArray(value.records)) {
            return value.records;
        }
    }

    return [];
};

/**
 * Extract a collection from different service response shapes.
 */
const extractCollection = (result) => {
    const candidates = [
        result,
        result?.data,
        result?.data?.data,
        result?.data?.items,
        result?.data?.results,
        result?.data?.records,
    ];

    for (const candidate of candidates) {
        const collection =
            normalizeCollection(candidate);

        if (collection.length > 0) {
            return collection;
        }
    }

    return [];
};

/**
 * Extract tenant from different service response shapes.
 */
const extractTenant = (result) => {
    const candidates = [
        result?.tenant,
        result?.data?.tenant,
        result?.data?.data?.tenant,
        result?.data?.data?.data?.tenant,
    ];

    for (const tenant of candidates) {
        if (
            tenant &&
            typeof tenant === "object" &&
            !Array.isArray(tenant)
        ) {
            return tenant;
        }
    }

    /*
     * Sometimes the service returns the tenant
     * directly as data.
     */
    const directCandidates = [
        result?.data,
        result?.data?.data,
    ];

    for (const candidate of directCandidates) {
        if (
            candidate &&
            typeof candidate === "object" &&
            !Array.isArray(candidate) &&
            candidate?.id
        ) {
            if (!Array.isArray(candidate?.data)) {
                return candidate;
            }
        }
    }

    return null;
};

/**
 * Extract tenancies embedded inside a tenant.
 */
const extractEmbeddedTenantTenancies = (
    tenant
) => {
    if (!tenant) {
        return [];
    }

    const candidates = [
        tenant?.tenancies,
        tenant?.active_tenancies,
        tenant?.activeTenancies,
        tenant?.tenancy,
    ];

    for (const candidate of candidates) {
        const collection =
            normalizeCollection(candidate);

        if (collection.length > 0) {
            return collection;
        }
    }

    return [];
};

/**
 * Extract tenancies from a relationship response.
 */
const extractTenancies = (result) => {
    const candidates = [
        result?.tenancies,
        result?.data?.tenancies,
        result?.data?.data?.tenancies,
        result?.data?.data?.data?.tenancies,
    ];

    for (const candidate of candidates) {
        const collection =
            normalizeCollection(candidate);

        if (collection.length > 0) {
            return collection;
        }
    }

    return extractCollection(result);
};

/**
 * Merge collections without duplicate tenancy IDs.
 */
const mergeUniqueById = (
    ...collections
) => {
    const merged = [];
    const seen = new Set();

    collections
        .flatMap((collection) =>
            safeArray(collection)
        )
        .forEach((item) => {
            if (!item) {
                return;
            }

            const id = getTenancyId(item);

            if (
                id !== null &&
                id !== undefined &&
                id !== ""
            ) {
                const key = String(id);

                if (seen.has(key)) {
                    return;
                }

                seen.add(key);
            }

            merged.push(item);
        });

    return merged;
};

/**
 * Normalize Laravel pagination metadata.
 */
const normalizePagination = (
    meta,
    fallback = {}
) => {
    const source =
        meta?.pagination ??
        meta ??
        {};

    return {
        current_page:
            source?.current_page ??
            fallback?.current_page ??
            1,

        last_page:
            source?.last_page ??
            fallback?.last_page ??
            1,

        per_page:
            source?.per_page ??
            fallback?.per_page ??
            DEFAULT_PER_PAGE,

        total:
            source?.total ??
            fallback?.total ??
            0,

        from:
            source?.from ??
            fallback?.from ??
            null,

        to:
            source?.to ??
            fallback?.to ??
            null,

        path:
            source?.path ??
            fallback?.path ??
            null,

        first_page_url:
            source?.first_page_url ??
            fallback?.first_page_url ??
            null,

        last_page_url:
            source?.last_page_url ??
            fallback?.last_page_url ??
            null,

        next_page_url:
            source?.next_page_url ??
            fallback?.next_page_url ??
            null,

        prev_page_url:
            source?.prev_page_url ??
            fallback?.prev_page_url ??
            null,
    };
};

/*
|--------------------------------------------------------------------------
| Normalize Available User Search
|--------------------------------------------------------------------------
*/

const normalizeAvailableUserSearch = (
    value
) => {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        return String(value).trim();
    }

    if (
        typeof value === "object"
    ) {
        if (
            typeof value.search ===
            "string"
        ) {
            return value.search.trim();
        }

        if (
            typeof value.search ===
            "number"
        ) {
            return String(
                value.search
            ).trim();
        }

        if (
            value.search &&
            typeof value.search ===
            "object"
        ) {
            if (
                typeof value.search.search ===
                "string"
            ) {
                return value.search.search.trim();
            }

            if (
                typeof value.search.search ===
                "number"
            ) {
                return String(
                    value.search.search
                ).trim();
            }
        }
    }

    return "";
};

/*
|--------------------------------------------------------------------------
| Initial State
|--------------------------------------------------------------------------
*/

const initialState = {
    bookings: [],
    currentBooking: null,

    statistics: null,
    reports: null,

    availableUnits: [],
    availableUsers: [],

    /*
    |--------------------------------------------------------------------------
    | Customer → Tenant → Tenancy
    |--------------------------------------------------------------------------
    */

    selectedCustomer: null,
    selectedTenant: null,
    customerTenancies: [],

    customerRelationshipLoading: false,
    customerRelationshipError: null,
    customerRelationshipErrors: null,
    customerRelationshipLoaded: false,

    pagination: {
        current_page: 1,
        last_page: 1,
        per_page: DEFAULT_PER_PAGE,
        total: 0,
        from: null,
        to: null,
        path: null,
        first_page_url: null,
        last_page_url: null,
        next_page_url: null,
        prev_page_url: null,
    },

    filters: {
        ...INITIAL_FILTERS,
    },

    page: 1,
    perPage: DEFAULT_PER_PAGE,

    total: 0,
    lastPage: 1,
    from: null,
    to: null,

    loading: false,
    loadingList: false,
    loadingSingle: false,
    loadingCreate: false,
    loadingUpdate: false,
    loadingDelete: false,
    loadingSearch: false,
    loadingStatistics: false,
    loadingReports: false,
    loadingAction: false,
    loadingAvailability: false,
    loadingUsers: false,
    loadingRestore: false,
    loadingForceDelete: false,

    error: null,
    errors: null,

    initialized: false,
};

/*
|--------------------------------------------------------------------------
| Fetch Bookings
|--------------------------------------------------------------------------
*/

export const fetchBookings = createAsyncThunk(
    "bookings/fetchBookings",
    async (
        params = {},
        { rejectWithValue }
    ) => {
        const result =
            await bookingService.getAll(
                params
            );

        if (!result.success) {
            return rejectWithValue({
                message: getErrorMessage(result),
                errors: getValidationErrors(result),
                code: result.code,
            });
        }

        return result;
    }
);

/*
|--------------------------------------------------------------------------
| Fetch Single Booking
|--------------------------------------------------------------------------
*/

export const fetchBooking = createAsyncThunk(
    "bookings/fetchBooking",
    async (
        id,
        { rejectWithValue }
    ) => {
        const result =
            await bookingService.getById(id);

        if (!result.success) {
            return rejectWithValue({
                message: getErrorMessage(result),
                errors: getValidationErrors(result),
                code: result.code,
            });
        }

        return result;
    }
);

/*
|--------------------------------------------------------------------------
| Create Booking
|--------------------------------------------------------------------------
*/

export const createBooking = createAsyncThunk(
    "bookings/createBooking",
    async (
        payload,
        { rejectWithValue }
    ) => {
        const result =
            await bookingService.create(
                payload
            );

        if (!result.success) {
            return rejectWithValue({
                message: getErrorMessage(result),
                errors: getValidationErrors(result),
                code: result.code,
            });
        }

        return result;
    }
);

/*
|--------------------------------------------------------------------------
| Update Booking
|--------------------------------------------------------------------------
*/

export const updateBooking = createAsyncThunk(
    "bookings/updateBooking",
    async (
        { id, data },
        { rejectWithValue }
    ) => {
        const result =
            await bookingService.update(
                id,
                data
            );

        if (!result.success) {
            return rejectWithValue({
                message: getErrorMessage(result),
                errors: getValidationErrors(result),
                code: result.code,
            });
        }

        return result;
    }
);

/*
|--------------------------------------------------------------------------
| Delete Booking
|--------------------------------------------------------------------------
*/

export const deleteBooking = createAsyncThunk(
    "bookings/deleteBooking",
    async (
        id,
        { rejectWithValue }
    ) => {
        const result =
            await bookingService.delete(id);

        if (!result.success) {
            return rejectWithValue({
                message: getErrorMessage(result),
                errors: getValidationErrors(result),
                code: result.code,
            });
        }

        return {
            ...result,
            deletedId: id,
        };
    }
);

/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
*/

export const searchBookings =
    createAsyncThunk(
        "bookings/searchBookings",
        async (
            {
                search = "",
                ...params
            } = {},
            { rejectWithValue }
        ) => {
            const result =
                await bookingService.search(
                    search,
                    params
                );

            if (!result.success) {
                return rejectWithValue({
                    message:
                        getErrorMessage(result),
                    errors:
                        getValidationErrors(
                            result
                        ),
                    code:
                        result.code,
                });
            }

            return result;
        }
    );

/*
|--------------------------------------------------------------------------
| Statistics
|--------------------------------------------------------------------------
*/

export const fetchBookingStatistics =
    createAsyncThunk(
        "bookings/fetchBookingStatistics",
        async (
            params = {},
            { rejectWithValue }
        ) => {
            const result =
                await bookingService.statistics(
                    params
                );

            if (!result.success) {
                return rejectWithValue({
                    message:
                        getErrorMessage(result),
                    errors:
                        getValidationErrors(
                            result
                        ),
                    code:
                        result.code,
                });
            }

            return result;
        }
    );

/*
|--------------------------------------------------------------------------
| Reports
|--------------------------------------------------------------------------
*/

export const fetchBookingReports =
    createAsyncThunk(
        "bookings/fetchBookingReports",
        async (
            params = {},
            { rejectWithValue }
        ) => {
            const result =
                await bookingService.reports(
                    params
                );

            if (!result.success) {
                return rejectWithValue({
                    message:
                        getErrorMessage(result),
                    errors:
                        getValidationErrors(
                            result
                        ),
                    code:
                        result.code,
                });
            }

            return result;
        }
    );

/*
|--------------------------------------------------------------------------
| Status Lists
|--------------------------------------------------------------------------
*/

const createStatusThunk = (
    name,
    serviceMethod
) =>
    createAsyncThunk(
        `bookings/${name}`,
        async (
            params = {},
            { rejectWithValue }
        ) => {
            const result =
                await bookingService[
                    serviceMethod
                ](params);

            if (!result.success) {
                return rejectWithValue({
                    message:
                        getErrorMessage(result),
                    errors:
                        getValidationErrors(
                            result
                        ),
                    code:
                        result.code,
                });
            }

            return result;
        }
    );

export const fetchPendingBookings =
    createStatusThunk(
        "fetchPendingBookings",
        "pending"
    );

export const fetchConfirmedBookings =
    createStatusThunk(
        "fetchConfirmedBookings",
        "confirmed"
    );

export const fetchActiveBookings =
    createStatusThunk(
        "fetchActiveBookings",
        "active"
    );

export const fetchCompletedBookings =
    createStatusThunk(
        "fetchCompletedBookings",
        "completed"
    );

export const fetchCancelledBookings =
    createStatusThunk(
        "fetchCancelledBookings",
        "cancelled"
    );

export const fetchExpiredBookings =
    createStatusThunk(
        "fetchExpiredBookings",
        "expired"
    );

export const fetchRejectedBookings =
    createStatusThunk(
        "fetchRejectedBookings",
        "rejected"
    );

/*
|--------------------------------------------------------------------------
| Booking Workflow
|--------------------------------------------------------------------------
*/

const createActionThunk = (
    name,
    serviceMethod
) =>
    createAsyncThunk(
        `bookings/${name}`,
        async (
            payload,
            { rejectWithValue }
        ) => {
            const result =
                Array.isArray(payload)
                    ? await bookingService[
                        serviceMethod
                    ](...payload)
                    : await bookingService[
                        serviceMethod
                    ](payload);

            if (!result.success) {
                return rejectWithValue({
                    message:
                        getErrorMessage(result),
                    errors:
                        getValidationErrors(
                            result
                        ),
                    code:
                        result.code,
                });
            }

            return result;
        }
    );

/*
|--------------------------------------------------------------------------
| Workflow Actions
|--------------------------------------------------------------------------
*/

export const confirmBooking =
    createActionThunk(
        "confirmBooking",
        "confirm"
    );

export const approveBooking =
    createActionThunk(
        "approveBooking",
        "approve"
    );

export const checkInBooking =
    createActionThunk(
        "checkInBooking",
        "checkIn"
    );

export const completeBooking =
    createActionThunk(
        "completeBooking",
        "complete"
    );

export const expireBooking =
    createActionThunk(
        "expireBooking",
        "expire"
    );

/*
|--------------------------------------------------------------------------
| Cancel
|--------------------------------------------------------------------------
*/

export const cancelBooking =
    createAsyncThunk(
        "bookings/cancelBooking",
        async (
            {
                id,
                data = {},
            },
            { rejectWithValue }
        ) => {
            const result =
                await bookingService.cancel(
                    id,
                    data
                );

            if (!result.success) {
                return rejectWithValue({
                    message:
                        getErrorMessage(result),
                    errors:
                        getValidationErrors(
                            result
                        ),
                    code:
                        result.code,
                });
            }

            return result;
        }
    );

/*
|--------------------------------------------------------------------------
| Reject
|--------------------------------------------------------------------------
*/

export const rejectBooking =
    createAsyncThunk(
        "bookings/rejectBooking",
        async (
            {
                id,
                rejection_reason,
            },
            { rejectWithValue }
        ) => {
            const result =
                await bookingService.reject(
                    id,
                    rejection_reason
                );

            if (!result.success) {
                return rejectWithValue({
                    message:
                        getErrorMessage(result),
                    errors:
                        getValidationErrors(
                            result
                        ),
                    code:
                        result.code,
                });
            }

            return result;
        }
    );

/*
|--------------------------------------------------------------------------
| Availability
|--------------------------------------------------------------------------
*/

export const fetchAvailableUnits =
    createAsyncThunk(
        "bookings/fetchAvailableUnits",
        async (
            params = {},
            { rejectWithValue }
        ) => {
            const result =
                await bookingService.availableUnits(
                    params
                );

            if (!result.success) {
                return rejectWithValue({
                    message:
                        getErrorMessage(result),
                    errors:
                        getValidationErrors(
                            result
                        ),
                    code:
                        result.code,
                });
            }

            return result;
        }
    );

/*
|--------------------------------------------------------------------------
| Available Users
|--------------------------------------------------------------------------
*/

export const fetchAvailableUsers =
    createAsyncThunk(
        "bookings/fetchAvailableUsers",
        async (
            search = "",
            { rejectWithValue }
        ) => {
            const normalizedSearch =
                normalizeAvailableUserSearch(
                    search
                );

            const result =
                normalizedSearch
                    ? await bookingService.availableUsers(
                        normalizedSearch
                    )
                    : await bookingService.availableUsers();

            if (!result.success) {
                return rejectWithValue({
                    message:
                        getErrorMessage(result),
                    errors:
                        getValidationErrors(
                            result
                        ),
                    code:
                        result.code,
                });
            }

            return result;
        }
    );

/*
|--------------------------------------------------------------------------
| Customer → Tenant → Tenancy
|--------------------------------------------------------------------------
*/

/**
 * Resolve:
 *
 * User/customer
 *      ↓
 * Tenant profile
 *      ↓
 * Tenancies
 *
 * IDs:
 *
 * customer = users.id
 * tenant   = tenants.id
 * tenancy  = tenancies.id
 */
export const resolveCustomerTenancies =
    createAsyncThunk(
        "bookings/resolveCustomerTenancies",
        async (
            customer,
            { rejectWithValue }
        ) => {
            const customerId =
                getCustomerUserId(
                    customer
                );

            if (!customerId) {
                return rejectWithValue({
                    message:
                        "Customer ID is required.",
                    errors: null,
                    code: 422,
                });
            }

            const result =
                await bookingService.resolveCustomerTenancies(
                    customerId
                );

            if (!result.success) {
                return rejectWithValue({
                    message:
                        getErrorMessage(result),
                    errors:
                        getValidationErrors(
                            result
                        ),
                    code:
                        result.code,
                });
            }

            const tenant =
                extractTenant(result);

            const responseTenancies =
                extractTenancies(result);

            const embeddedTenancies =
                extractEmbeddedTenantTenancies(
                    tenant
                );

            const tenancies =
                mergeUniqueById(
                    responseTenancies,
                    embeddedTenancies
                );

            return {
                ...result,

                customer:
                    result?.customer ??
                    result?.data?.customer ??
                    customer ??
                    null,

                tenant,
                tenancies,
            };
        }
    );

/*
|--------------------------------------------------------------------------
| Get Tenant By Customer
|--------------------------------------------------------------------------
*/

export const fetchTenantByCustomer =
    createAsyncThunk(
        "bookings/fetchTenantByCustomer",
        async (
            customer,
            { rejectWithValue }
        ) => {
            const customerId =
                getCustomerUserId(
                    customer
                );

            if (!customerId) {
                return rejectWithValue({
                    message:
                        "Customer ID is required.",
                    errors: null,
                    code: 422,
                });
            }

            const result =
                await bookingService.getTenantByCustomer(
                    customerId
                );

            if (!result.success) {
                return rejectWithValue({
                    message:
                        getErrorMessage(result),
                    errors:
                        getValidationErrors(
                            result
                        ),
                    code:
                        result.code,
                });
            }

            const tenant =
                extractTenant(result);

            const tenancies =
                extractEmbeddedTenantTenancies(
                    tenant
                );

            return {
                ...result,

                customer:
                    customer ?? null,

                tenant,
                tenancies,
            };
        }
    );

/*
|--------------------------------------------------------------------------
| Get Tenancies By Tenant
|--------------------------------------------------------------------------
*/

export const fetchTenanciesByTenant =
    createAsyncThunk(
        "bookings/fetchTenanciesByTenant",
        async (
            {
                tenant,
                params = {},
            } = {},
            { rejectWithValue }
        ) => {
            const tenantId =
                getTenantProfileId(
                    tenant
                );

            if (!tenantId) {
                return rejectWithValue({
                    message:
                        "Tenant ID is required.",
                    errors: null,
                    code: 422,
                });
            }

            const result =
                await bookingService.getTenanciesByTenant(
                    tenantId,
                    params
                );

            if (!result.success) {
                return rejectWithValue({
                    message:
                        getErrorMessage(result),
                    errors:
                        getValidationErrors(
                            result
                        ),
                    code:
                        result.code,
                });
            }

            const responseTenancies =
                extractTenancies(result);

            const embeddedTenancies =
                extractEmbeddedTenantTenancies(
                    tenant
                );

            return {
                ...result,

                tenant:
                    tenant ?? null,

                tenancies:
                    mergeUniqueById(
                        responseTenancies,
                        embeddedTenancies
                    ),
            };
        }
    );

/*
|--------------------------------------------------------------------------
| Get Active Tenancies By Tenant
|--------------------------------------------------------------------------
*/

export const fetchActiveTenanciesByTenant =
    createAsyncThunk(
        "bookings/fetchActiveTenanciesByTenant",
        async (
            {
                tenant,
                params = {},
            } = {},
            { rejectWithValue }
        ) => {
            const tenantId =
                getTenantProfileId(
                    tenant
                );

            if (!tenantId) {
                return rejectWithValue({
                    message:
                        "Tenant ID is required.",
                    errors: null,
                    code: 422,
                });
            }

            const result =
                await bookingService.getActiveTenanciesByTenant(
                    tenantId,
                    params
                );

            if (!result.success) {
                return rejectWithValue({
                    message:
                        getErrorMessage(result),
                    errors:
                        getValidationErrors(
                            result
                        ),
                    code:
                        result.code,
                });
            }

            const responseTenancies =
                extractTenancies(result);

            const embeddedTenancies =
                extractEmbeddedTenantTenancies(
                    tenant
                );

            return {
                ...result,

                tenant:
                    tenant ?? null,

                tenancies:
                    mergeUniqueById(
                        responseTenancies,
                        embeddedTenancies
                    ),
            };
        }
    );

/*
|--------------------------------------------------------------------------
| Clear Customer Relationship
|--------------------------------------------------------------------------
*/

export const clearCustomerRelationship =
    createAsyncThunk(
        "bookings/clearCustomerRelationship",
        async () => ({
            success: true,
            data: null,
        })
    );

/*
|--------------------------------------------------------------------------
| Restore
|--------------------------------------------------------------------------
*/

export const restoreBooking =
    createActionThunk(
        "restoreBooking",
        "restore"
    );

/*
|--------------------------------------------------------------------------
| Force Delete
|--------------------------------------------------------------------------
*/

export const forceDeleteBooking =
    createActionThunk(
        "forceDeleteBooking",
        "forceDelete"
    );

/*
|--------------------------------------------------------------------------
| Slice
|--------------------------------------------------------------------------
*/

const bookingSlice = createSlice({
    name: "bookings",

    initialState,

    reducers: {
        /*
        |--------------------------------------------------------------------------
        | Filters
        |--------------------------------------------------------------------------
        */

        setFilters: (
            state,
            action
        ) => {
            state.filters = {
                ...state.filters,
                ...(action.payload ?? {}),
            };

            state.page = 1;
        },

        clearFilters: (state) => {
            state.filters = {
                ...INITIAL_FILTERS,
            };

            state.page = 1;
        },

        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */

        setPage: (
            state,
            action
        ) => {
            const page =
                Number(
                    action.payload
                ) || 1;

            state.page = Math.max(
                1,
                page
            );
        },

        setPerPage: (
            state,
            action
        ) => {
            const perPage =
                Number(
                    action.payload
                ) ||
                DEFAULT_PER_PAGE;

            state.perPage = Math.min(
                Math.max(
                    perPage,
                    1
                ),
                100
            );

            state.page = 1;
        },

        /*
        |--------------------------------------------------------------------------
        | Current Booking
        |--------------------------------------------------------------------------
        */

        clearCurrentBooking: (
            state
        ) => {
            state.currentBooking = null;
        },

        /*
        |--------------------------------------------------------------------------
        | Customer Relationship
        |--------------------------------------------------------------------------
        */

        setSelectedCustomer: (
            state,
            action
        ) => {
            state.selectedCustomer =
                action.payload ?? null;
        },

        setSelectedTenant: (
            state,
            action
        ) => {
            state.selectedTenant =
                action.payload ?? null;
        },

        setCustomerTenancies: (
            state,
            action
        ) => {
            state.customerTenancies =
                safeArray(
                    action.payload
                );
        },

        clearCustomerRelationship: (
            state
        ) => {
            state.selectedCustomer =
                null;

            state.selectedTenant =
                null;

            state.customerTenancies =
                [];

            state.customerRelationshipLoading =
                false;

            state.customerRelationshipError =
                null;

            state.customerRelationshipErrors =
                null;

            state.customerRelationshipLoaded =
                false;
        },

        /*
        |--------------------------------------------------------------------------
        | Errors
        |--------------------------------------------------------------------------
        */

        clearError: (
            state
        ) => {
            state.error = null;
            state.errors = null;
        },

        clearCustomerRelationshipError: (
            state
        ) => {
            state.customerRelationshipError =
                null;

            state.customerRelationshipErrors =
                null;
        },

        /*
        |--------------------------------------------------------------------------
        | Reset
        |--------------------------------------------------------------------------
        */

        resetBookingState: () => ({
            ...initialState,
        }),
    },

    extraReducers: (builder) => {
        /*
        |--------------------------------------------------------------------------
        | Fetch Bookings
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                fetchBookings.pending,
                (state) => {
                    state.loading = true;
                    state.loadingList = true;
                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                fetchBookings.fulfilled,
                (
                    state,
                    action
                ) => {
                    const result =
                        action.payload;

                    state.loading = false;
                    state.loadingList = false;

                    state.bookings =
                        extractCollection(
                            result
                        );

                    state.pagination =
                        normalizePagination(
                            result?.meta,
                            state.pagination
                        );

                    state.page =
                        state.pagination
                            .current_page;

                    state.perPage =
                        state.pagination
                            .per_page;

                    state.total =
                        state.pagination.total;

                    state.lastPage =
                        state.pagination
                            .last_page;

                    state.from =
                        state.pagination.from;

                    state.to =
                        state.pagination.to;

                    state.initialized = true;

                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                fetchBookings.rejected,
                (
                    state,
                    action
                ) => {
                    state.loading = false;
                    state.loadingList = false;

                    state.error =
                        action.payload?.message ??
                        action.error?.message ??
                        "Failed to fetch bookings.";

                    state.errors =
                        action.payload?.errors ??
                        null;

                    state.initialized = true;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Single Booking
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                fetchBooking.pending,
                (state) => {
                    state.loadingSingle = true;
                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                fetchBooking.fulfilled,
                (
                    state,
                    action
                ) => {
                    state.loadingSingle = false;

                    state.currentBooking =
                        unwrapData(
                            action.payload
                        );

                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                fetchBooking.rejected,
                (
                    state,
                    action
                ) => {
                    state.loadingSingle = false;

                    state.error =
                        action.payload?.message ??
                        action.error?.message ??
                        "Failed to fetch booking.";

                    state.errors =
                        action.payload?.errors ??
                        null;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Create
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                createBooking.pending,
                (state) => {
                    state.loadingCreate = true;
                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                createBooking.fulfilled,
                (
                    state,
                    action
                ) => {
                    state.loadingCreate = false;

                    const booking =
                        unwrapData(
                            action.payload
                        );

                    if (booking) {
                        state.currentBooking =
                            booking;

                        state.bookings = [
                            booking,
                            ...state.bookings,
                        ];

                        if (
                            state.total >= 0
                        ) {
                            state.total += 1;
                        }
                    }

                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                createBooking.rejected,
                (
                    state,
                    action
                ) => {
                    state.loadingCreate = false;

                    state.error =
                        action.payload?.message ??
                        action.error?.message ??
                        "Failed to create booking.";

                    state.errors =
                        action.payload?.errors ??
                        null;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Update
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                updateBooking.pending,
                (state) => {
                    state.loadingUpdate = true;
                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                updateBooking.fulfilled,
                (
                    state,
                    action
                ) => {
                    state.loadingUpdate = false;

                    const booking =
                        unwrapData(
                            action.payload
                        );

                    if (booking) {
                        state.currentBooking =
                            booking;

                        const index =
                            state.bookings.findIndex(
                                (item) =>
                                    String(
                                        item?.id
                                    ) ===
                                    String(
                                        booking?.id
                                    )
                            );

                        if (index !== -1) {
                            state.bookings[index] =
                                booking;
                        }
                    }

                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                updateBooking.rejected,
                (
                    state,
                    action
                ) => {
                    state.loadingUpdate = false;

                    state.error =
                        action.payload?.message ??
                        action.error?.message ??
                        "Failed to update booking.";

                    state.errors =
                        action.payload?.errors ??
                        null;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Delete
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                deleteBooking.pending,
                (state) => {
                    state.loadingDelete = true;
                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                deleteBooking.fulfilled,
                (
                    state,
                    action
                ) => {
                    state.loadingDelete = false;

                    const deletedId =
                        action.payload?.deletedId;

                    state.bookings =
                        state.bookings.filter(
                            (booking) =>
                                String(
                                    booking?.id
                                ) !==
                                String(
                                    deletedId
                                )
                        );

                    if (
                        String(
                            state.currentBooking?.id
                        ) ===
                        String(
                            deletedId
                        )
                    ) {
                        state.currentBooking = null;
                    }

                    if (state.total > 0) {
                        state.total -= 1;
                    }

                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                deleteBooking.rejected,
                (
                    state,
                    action
                ) => {
                    state.loadingDelete = false;

                    state.error =
                        action.payload?.message ??
                        action.error?.message ??
                        "Failed to delete booking.";

                    state.errors =
                        action.payload?.errors ??
                        null;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                searchBookings.pending,
                (state) => {
                    state.loadingSearch = true;
                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                searchBookings.fulfilled,
                (
                    state,
                    action
                ) => {
                    const result =
                        action.payload;

                    state.loadingSearch = false;

                    state.bookings =
                        extractCollection(
                            result
                        );

                    state.pagination =
                        normalizePagination(
                            result?.meta,
                            state.pagination
                        );

                    state.page =
                        state.pagination
                            .current_page;

                    state.perPage =
                        state.pagination
                            .per_page;

                    state.total =
                        state.pagination.total;

                    state.lastPage =
                        state.pagination
                            .last_page;

                    state.from =
                        state.pagination.from;

                    state.to =
                        state.pagination.to;

                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                searchBookings.rejected,
                (
                    state,
                    action
                ) => {
                    state.loadingSearch = false;

                    state.error =
                        action.payload?.message ??
                        action.error?.message ??
                        "Booking search failed.";

                    state.errors =
                        action.payload?.errors ??
                        null;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Statistics
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                fetchBookingStatistics.pending,
                (state) => {
                    state.loadingStatistics = true;
                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                fetchBookingStatistics.fulfilled,
                (
                    state,
                    action
                ) => {
                    state.loadingStatistics = false;

                    state.statistics =
                        unwrapData(
                            action.payload
                        );

                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                fetchBookingStatistics.rejected,
                (
                    state,
                    action
                ) => {
                    state.loadingStatistics = false;

                    state.error =
                        action.payload?.message ??
                        action.error?.message ??
                        "Failed to fetch booking statistics.";

                    state.errors =
                        action.payload?.errors ??
                        null;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Reports
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                fetchBookingReports.pending,
                (state) => {
                    state.loadingReports = true;
                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                fetchBookingReports.fulfilled,
                (
                    state,
                    action
                ) => {
                    state.loadingReports = false;

                    state.reports =
                        unwrapData(
                            action.payload
                        );

                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                fetchBookingReports.rejected,
                (
                    state,
                    action
                ) => {
                    state.loadingReports = false;

                    state.error =
                        action.payload?.message ??
                        action.error?.message ??
                        "Failed to fetch booking reports.";

                    state.errors =
                        action.payload?.errors ??
                        null;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Status Lists
        |--------------------------------------------------------------------------
        */

        const statusCases = [
            fetchPendingBookings,
            fetchConfirmedBookings,
            fetchActiveBookings,
            fetchCompletedBookings,
            fetchCancelledBookings,
            fetchExpiredBookings,
            fetchRejectedBookings,
        ];

        statusCases.forEach(
            (thunk) => {
                builder
                    .addCase(
                        thunk.pending,
                        (state) => {
                            state.loadingList = true;
                            state.error = null;
                            state.errors = null;
                        }
                    )

                    .addCase(
                        thunk.fulfilled,
                        (
                            state,
                            action
                        ) => {
                            const result =
                                action.payload;

                            state.loadingList = false;

                            state.bookings =
                                extractCollection(
                                    result
                                );

                            state.pagination =
                                normalizePagination(
                                    result?.meta,
                                    state.pagination
                                );

                            state.page =
                                state.pagination
                                    .current_page;

                            state.perPage =
                                state.pagination
                                    .per_page;

                            state.total =
                                state.pagination.total;

                            state.lastPage =
                                state.pagination
                                    .last_page;

                            state.from =
                                state.pagination.from;

                            state.to =
                                state.pagination.to;

                            state.error = null;
                            state.errors = null;
                        }
                    )

                    .addCase(
                        thunk.rejected,
                        (
                            state,
                            action
                        ) => {
                            state.loadingList = false;

                            state.error =
                                action.payload?.message ??
                                action.error?.message ??
                                "Failed to fetch bookings.";

                            state.errors =
                                action.payload?.errors ??
                                null;
                        }
                    );
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Workflow Actions
        |--------------------------------------------------------------------------
        */

        const workflowCases = [
            confirmBooking,
            approveBooking,
            checkInBooking,
            completeBooking,
            cancelBooking,
            rejectBooking,
            expireBooking,
        ];

        workflowCases.forEach(
            (thunk) => {
                builder
                    .addCase(
                        thunk.pending,
                        (state) => {
                            state.loadingAction = true;
                            state.error = null;
                            state.errors = null;
                        }
                    )

                    .addCase(
                        thunk.fulfilled,
                        (
                            state,
                            action
                        ) => {
                            state.loadingAction = false;

                            const booking =
                                unwrapData(
                                    action.payload
                                );

                            if (booking) {
                                state.currentBooking =
                                    booking;

                                const index =
                                    state.bookings.findIndex(
                                        (item) =>
                                            String(
                                                item?.id
                                            ) ===
                                            String(
                                                booking?.id
                                            )
                                    );

                                if (
                                    index !== -1
                                ) {
                                    state.bookings[
                                        index
                                    ] = booking;
                                }
                            }

                            state.error = null;
                            state.errors = null;
                        }
                    )

                    .addCase(
                        thunk.rejected,
                        (
                            state,
                            action
                        ) => {
                            state.loadingAction = false;

                            state.error =
                                action.payload?.message ??
                                action.error?.message ??
                                "Booking action failed.";

                            state.errors =
                                action.payload?.errors ??
                                null;
                        }
                    );
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Available Units
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                fetchAvailableUnits.pending,
                (state) => {
                    state.loadingAvailability = true;
                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                fetchAvailableUnits.fulfilled,
                (
                    state,
                    action
                ) => {
                    state.loadingAvailability = false;

                    state.availableUnits =
                        extractCollection(
                            action.payload
                        );

                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                fetchAvailableUnits.rejected,
                (
                    state,
                    action
                ) => {
                    state.loadingAvailability = false;

                    state.error =
                        action.payload?.message ??
                        action.error?.message ??
                        "Failed to fetch available units.";

                    state.errors =
                        action.payload?.errors ??
                        null;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Available Users
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                fetchAvailableUsers.pending,
                (state) => {
                    state.loadingUsers = true;
                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                fetchAvailableUsers.fulfilled,
                (
                    state,
                    action
                ) => {
                    state.loadingUsers = false;

                    state.availableUsers =
                        extractCollection(
                            action.payload
                        );

                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                fetchAvailableUsers.rejected,
                (
                    state,
                    action
                ) => {
                    state.loadingUsers = false;

                    state.error =
                        action.payload?.message ??
                        action.error?.message ??
                        "Failed to fetch available booking users.";

                    state.errors =
                        action.payload?.errors ??
                        null;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Customer → Tenant → Tenancy
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                resolveCustomerTenancies.pending,
                (
                    state,
                    action
                ) => {
                    state.customerRelationshipLoading =
                        true;

                    state.customerRelationshipError =
                        null;

                    state.customerRelationshipErrors =
                        null;

                    state.customerRelationshipLoaded =
                        false;

                    state.selectedCustomer =
                        action.meta?.arg ??
                        null;

                    state.selectedTenant = null;
                    state.customerTenancies = [];
                }
            )

            .addCase(
                resolveCustomerTenancies.fulfilled,
                (
                    state,
                    action
                ) => {
                    state.customerRelationshipLoading =
                        false;

                    state.customerRelationshipLoaded =
                        true;

                    state.selectedCustomer =
                        action.payload?.customer ??
                        state.selectedCustomer ??
                        null;

                    state.selectedTenant =
                        action.payload?.tenant ??
                        null;

                    state.customerTenancies =
                        mergeUniqueById(
                            action.payload?.tenancies,
                            extractEmbeddedTenantTenancies(
                                action.payload?.tenant
                            )
                        );

                    state.customerRelationshipError =
                        null;

                    state.customerRelationshipErrors =
                        null;
                }
            )

            .addCase(
                resolveCustomerTenancies.rejected,
                (
                    state,
                    action
                ) => {
                    state.customerRelationshipLoading =
                        false;

                    state.customerRelationshipLoaded =
                        true;

                    state.selectedTenant = null;
                    state.customerTenancies = [];

                    state.customerRelationshipError =
                        action.payload?.message ??
                        action.error?.message ??
                        "Failed to load customer tenant and tenancy information.";

                    state.customerRelationshipErrors =
                        action.payload?.errors ??
                        null;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Fetch Tenant By Customer
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                fetchTenantByCustomer.pending,
                (
                    state,
                    action
                ) => {
                    state.customerRelationshipLoading =
                        true;

                    state.customerRelationshipError =
                        null;

                    state.customerRelationshipErrors =
                        null;

                    state.customerRelationshipLoaded =
                        false;

                    state.selectedCustomer =
                        action.meta?.arg ??
                        null;

                    state.selectedTenant = null;
                    state.customerTenancies = [];
                }
            )

            .addCase(
                fetchTenantByCustomer.fulfilled,
                (
                    state,
                    action
                ) => {
                    state.customerRelationshipLoading =
                        false;

                    state.customerRelationshipLoaded =
                        true;

                    state.selectedCustomer =
                        action.payload?.customer ??
                        state.selectedCustomer ??
                        null;

                    state.selectedTenant =
                        action.payload?.tenant ??
                        null;

                    state.customerTenancies =
                        mergeUniqueById(
                            action.payload?.tenancies,
                            extractEmbeddedTenantTenancies(
                                action.payload?.tenant
                            )
                        );

                    state.customerRelationshipError =
                        null;

                    state.customerRelationshipErrors =
                        null;
                }
            )

            .addCase(
                fetchTenantByCustomer.rejected,
                (
                    state,
                    action
                ) => {
                    state.customerRelationshipLoading =
                        false;

                    state.customerRelationshipLoaded =
                        true;

                    state.selectedTenant = null;
                    state.customerTenancies = [];

                    state.customerRelationshipError =
                        action.payload?.message ??
                        action.error?.message ??
                        "Failed to load tenant information.";

                    state.customerRelationshipErrors =
                        action.payload?.errors ??
                        null;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Fetch Tenancies By Tenant
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                fetchTenanciesByTenant.pending,
                (state) => {
                    state.customerRelationshipLoading =
                        true;

                    state.customerRelationshipError =
                        null;

                    state.customerRelationshipErrors =
                        null;
                }
            )

            .addCase(
                fetchTenanciesByTenant.fulfilled,
                (
                    state,
                    action
                ) => {
                    state.customerRelationshipLoading =
                        false;

                    state.customerRelationshipLoaded =
                        true;

                    if (
                        action.payload?.tenant
                    ) {
                        state.selectedTenant =
                            action.payload.tenant;
                    }

                    state.customerTenancies =
                        mergeUniqueById(
                            action.payload?.tenancies,
                            extractEmbeddedTenantTenancies(
                                action.payload?.tenant
                            )
                        );

                    state.customerRelationshipError =
                        null;

                    state.customerRelationshipErrors =
                        null;
                }
            )

            .addCase(
                fetchTenanciesByTenant.rejected,
                (
                    state,
                    action
                ) => {
                    state.customerRelationshipLoading =
                        false;

                    state.customerRelationshipLoaded =
                        true;

                    state.customerTenancies = [];

                    state.customerRelationshipError =
                        action.payload?.message ??
                        action.error?.message ??
                        "Failed to load tenant tenancies.";

                    state.customerRelationshipErrors =
                        action.payload?.errors ??
                        null;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Fetch Active Tenancies By Tenant
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                fetchActiveTenanciesByTenant.pending,
                (state) => {
                    state.customerRelationshipLoading =
                        true;

                    state.customerRelationshipError =
                        null;

                    state.customerRelationshipErrors =
                        null;
                }
            )

            .addCase(
                fetchActiveTenanciesByTenant.fulfilled,
                (
                    state,
                    action
                ) => {
                    state.customerRelationshipLoading =
                        false;

                    state.customerRelationshipLoaded =
                        true;

                    if (
                        action.payload?.tenant
                    ) {
                        state.selectedTenant =
                            action.payload.tenant;
                    }

                    state.customerTenancies =
                        mergeUniqueById(
                            action.payload?.tenancies,
                            extractEmbeddedTenantTenancies(
                                action.payload?.tenant
                            )
                        );

                    state.customerRelationshipError =
                        null;

                    state.customerRelationshipErrors =
                        null;
                }
            )

            .addCase(
                fetchActiveTenanciesByTenant.rejected,
                (
                    state,
                    action
                ) => {
                    state.customerRelationshipLoading =
                        false;

                    state.customerRelationshipLoaded =
                        true;

                    state.customerTenancies = [];

                    state.customerRelationshipError =
                        action.payload?.message ??
                        action.error?.message ??
                        "Failed to load active tenant tenancies.";

                    state.customerRelationshipErrors =
                        action.payload?.errors ??
                        null;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Clear Customer Relationship
        |--------------------------------------------------------------------------
        */

        builder.addCase(
            clearCustomerRelationship.fulfilled,
            (state) => {
                state.selectedCustomer = null;
                state.selectedTenant = null;
                state.customerTenancies = [];

                state.customerRelationshipLoading =
                    false;

                state.customerRelationshipError =
                    null;

                state.customerRelationshipErrors =
                    null;

                state.customerRelationshipLoaded =
                    false;
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Restore
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                restoreBooking.pending,
                (state) => {
                    state.loadingRestore = true;
                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                restoreBooking.fulfilled,
                (
                    state,
                    action
                ) => {
                    state.loadingRestore = false;

                    const booking =
                        unwrapData(
                            action.payload
                        );

                    if (booking) {
                        state.currentBooking =
                            booking;

                        const index =
                            state.bookings.findIndex(
                                (item) =>
                                    String(
                                        item?.id
                                    ) ===
                                    String(
                                        booking?.id
                                    )
                            );

                        if (index !== -1) {
                            state.bookings[index] =
                                booking;
                        } else {
                            state.bookings.unshift(
                                booking
                            );
                        }
                    }

                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                restoreBooking.rejected,
                (
                    state,
                    action
                ) => {
                    state.loadingRestore = false;

                    state.error =
                        action.payload?.message ??
                        action.error?.message ??
                        "Failed to restore booking.";

                    state.errors =
                        action.payload?.errors ??
                        null;
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Force Delete
        |--------------------------------------------------------------------------
        */

        builder
            .addCase(
                forceDeleteBooking.pending,
                (state) => {
                    state.loadingForceDelete = true;
                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                forceDeleteBooking.fulfilled,
                (
                    state,
                    action
                ) => {
                    state.loadingForceDelete = false;

                    const deletedId =
                        getId(
                            action.meta?.arg
                        );

                    state.bookings =
                        state.bookings.filter(
                            (booking) =>
                                String(
                                    booking?.id
                                ) !==
                                String(
                                    deletedId
                                )
                        );

                    if (
                        String(
                            state.currentBooking?.id
                        ) ===
                        String(
                            deletedId
                        )
                    ) {
                        state.currentBooking = null;
                    }

                    if (state.total > 0) {
                        state.total -= 1;
                    }

                    state.error = null;
                    state.errors = null;
                }
            )

            .addCase(
                forceDeleteBooking.rejected,
                (
                    state,
                    action
                ) => {
                    state.loadingForceDelete = false;

                    state.error =
                        action.payload?.message ??
                        action.error?.message ??
                        "Failed to permanently delete booking.";

                    state.errors =
                        action.payload?.errors ??
                        null;
                }
            );
    },
});

/*
|--------------------------------------------------------------------------
| Actions
|--------------------------------------------------------------------------
*/

export const {
    setFilters,
    clearFilters,
    setPage,
    setPerPage,
    clearCurrentBooking,

    setSelectedCustomer,
    setSelectedTenant,
    setCustomerTenancies,
    clearCustomerRelationshipError,

    clearError,
    resetBookingState,
} = bookingSlice.actions;

/*
|--------------------------------------------------------------------------
| Selectors
|--------------------------------------------------------------------------
*/

export const selectBookings = (
    state
) =>
    state.bookings?.bookings ?? [];

export const selectCurrentBooking = (
    state
) =>
    state.bookings?.currentBooking ??
    null;

export const selectBookingStatistics = (
    state
) =>
    state.bookings?.statistics ??
    null;

export const selectBookingReports = (
    state
) =>
    state.bookings?.reports ??
    null;

export const selectAvailableUnits = (
    state
) =>
    state.bookings?.availableUnits ??
    [];

export const selectAvailableUsers = (
    state
) =>
    state.bookings?.availableUsers ??
    [];

/*
|--------------------------------------------------------------------------
| Customer → Tenant → Tenancy Selectors
|--------------------------------------------------------------------------
*/

export const selectSelectedCustomer = (
    state
) =>
    state.bookings?.selectedCustomer ??
    null;

export const selectSelectedTenant = (
    state
) =>
    state.bookings?.selectedTenant ??
    null;

export const selectCustomerTenancies = (
    state
) =>
    state.bookings?.customerTenancies ??
    [];

export const selectCustomerTenancyCount = (
    state
) =>
    state.bookings?.customerTenancies
        ?.length ?? 0;

export const selectHasCustomerTenant = (
    state
) =>
    Boolean(
        state.bookings?.selectedTenant
    );

export const selectHasCustomerTenancies = (
    state
) =>
    (
        state.bookings
            ?.customerTenancies ?? []
    ).length > 0;

export const selectCustomerRelationshipLoading =
    (state) =>
        state.bookings
            ?.customerRelationshipLoading ??
        false;

export const selectCustomerRelationshipError =
    (state) =>
        state.bookings
            ?.customerRelationshipError ??
        null;

export const selectCustomerRelationshipErrors =
    (state) =>
        state.bookings
            ?.customerRelationshipErrors ??
        null;

export const selectCustomerRelationshipLoaded =
    (state) =>
        state.bookings
            ?.customerRelationshipLoaded ??
        false;

/*
|--------------------------------------------------------------------------
| Pagination Selectors
|--------------------------------------------------------------------------
*/

export const selectBookingPagination = (
    state
) =>
    state.bookings?.pagination ??
    {};

export const selectBookingFilters = (
    state
) =>
    state.bookings?.filters ??
    {};

export const selectBookingPage = (
    state
) =>
    state.bookings?.page ??
    1;

export const selectBookingPerPage = (
    state
) =>
    state.bookings?.perPage ??
    DEFAULT_PER_PAGE;

export const selectBookingTotal = (
    state
) =>
    state.bookings?.total ??
    0;

export const selectBookingLastPage = (
    state
) =>
    state.bookings?.lastPage ??
    1;

export const selectBookingFrom = (
    state
) =>
    state.bookings?.from ??
    null;

export const selectBookingTo = (
    state
) =>
    state.bookings?.to ??
    null;

/*
|--------------------------------------------------------------------------
| Loading Selectors
|--------------------------------------------------------------------------
*/

export const selectBookingLoading = (
    state
) =>
    state.bookings?.loading ??
    false;

export const selectBookingListLoading = (
    state
) =>
    state.bookings?.loadingList ??
    false;

export const selectBookingSingleLoading = (
    state
) =>
    state.bookings?.loadingSingle ??
    false;

export const selectBookingCreateLoading = (
    state
) =>
    state.bookings?.loadingCreate ??
    false;

export const selectBookingUpdateLoading = (
    state
) =>
    state.bookings?.loadingUpdate ??
    false;

export const selectBookingDeleteLoading = (
    state
) =>
    state.bookings?.loadingDelete ??
    false;

export const selectBookingSearchLoading = (
    state
) =>
    state.bookings?.loadingSearch ??
    false;

export const selectBookingStatisticsLoading = (
    state
) =>
    state.bookings?.loadingStatistics ??
    false;

export const selectBookingReportsLoading = (
    state
) =>
    state.bookings?.loadingReports ??
    false;

export const selectBookingActionLoading = (
    state
) =>
    state.bookings?.loadingAction ??
    false;

export const selectBookingAvailabilityLoading = (
    state
) =>
    state.bookings?.loadingAvailability ??
    false;

export const selectBookingUsersLoading = (
    state
) =>
    state.bookings?.loadingUsers ??
    false;

export const selectBookingRestoreLoading = (
    state
) =>
    state.bookings?.loadingRestore ??
    false;

export const selectBookingForceDeleteLoading = (
    state
) =>
    state.bookings?.loadingForceDelete ??
    false;

/*
|--------------------------------------------------------------------------
| Error Selectors
|--------------------------------------------------------------------------
*/

export const selectBookingError = (
    state
) =>
    state.bookings?.error ??
    null;

export const selectBookingErrors = (
    state
) =>
    state.bookings?.errors ??
    null;

/*
|--------------------------------------------------------------------------
| Initialization Selector
|--------------------------------------------------------------------------
*/

export const selectBookingsInitialized = (
    state
) =>
    state.bookings?.initialized ??
    false;

/*
|--------------------------------------------------------------------------
| Reducer
|--------------------------------------------------------------------------
*/

export default bookingSlice.reducer;