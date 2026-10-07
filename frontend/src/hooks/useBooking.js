import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";

import bookingApi from "../api/booking.api";

import {
    fetchBookings,
    fetchBooking,
    createBooking,
    updateBooking as updateBookingAction,
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
} from "../store/bookingSlice";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const EMPTY_FILTERS = Object.freeze({});
const DEFAULT_PER_PAGE = 15;

/*
|--------------------------------------------------------------------------
| Object Helpers
|--------------------------------------------------------------------------
*/

const isPlainObject = (value) => {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
};

const parseObject = (value) => {
    if (isPlainObject(value)) {
        return value;
    }

    if (typeof value !== "string") {
        return {};
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return {};
    }

    try {
        const parsed = JSON.parse(trimmed);

        return isPlainObject(parsed)
            ? parsed
            : {};
    } catch {
        return {};
    }
};

const getNestedValue = (object, path) => {
    if (
        object === null ||
        object === undefined ||
        path === null ||
        path === undefined ||
        path === ""
    ) {
        return undefined;
    }

    const parts = Array.isArray(path)
        ? path
        : String(path)
            .split(".")
            .filter(Boolean);

    return parts.reduce((current, key) => {
        if (
            current === null ||
            current === undefined ||
            typeof current !== "object"
        ) {
            return undefined;
        }

        return current[key];
    }, object);
};

const firstDefinedNested = (
    object,
    paths = [],
    fallback = undefined
) => {
    for (const path of paths) {
        const value = getNestedValue(object, path);

        if (
            value !== undefined &&
            value !== null
        ) {
            return value;
        }
    }

    return fallback;
};

const firstPresent = (...values) => {
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
| ID Helpers
|--------------------------------------------------------------------------
*/

/**
 * Extract a clean scalar ID.
 *
 * IMPORTANT:
 * This helper intentionally does not guess unrelated IDs such as
 * tenant_id or tenancy_id when the supplied object itself represents
 * another resource.
 */
const normalizeId = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    if (typeof value === "number") {
        return Number.isFinite(value)
            ? value
            : null;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();

        if (
            !trimmed ||
            trimmed === "[object Object]"
        ) {
            return null;
        }

        return trimmed;
    }

    if (!isPlainObject(value)) {
        return null;
    }

    const directCandidates = [
        value.id,
        value.value,
    ];

    for (const candidate of directCandidates) {
        const id = normalizeId(candidate);

        if (id !== null) {
            return id;
        }
    }

    return null;
};

/**
 * Booking ID resolver.
 */
const getBookingId = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    const direct = normalizeId(value);

    if (direct !== null) {
        return direct;
    }

    if (!isPlainObject(value)) {
        return null;
    }

    const candidates = [
        value.booking_id,
        value.booking?.id,
        value.data?.id,
        value.data?.booking_id,
        value.data?.booking?.id,
    ];

    for (const candidate of candidates) {
        const resolved = normalizeId(candidate);

        if (resolved !== null) {
            return resolved;
        }
    }

    return null;
};

/**
 * Tenant ID resolver.
 */
const getTenantId = (tenant) => {
    if (
        tenant === null ||
        tenant === undefined
    ) {
        return null;
    }

    const direct = normalizeId(tenant);

    if (direct !== null) {
        return direct;
    }

    if (!isPlainObject(tenant)) {
        return null;
    }

    const candidates = [
        tenant.tenant_id,
        tenant.tenant?.id,
        tenant.data?.id,
        tenant.data?.tenant_id,
        tenant.data?.tenant?.id,
    ];

    for (const candidate of candidates) {
        const resolved = normalizeId(candidate);

        if (resolved !== null) {
            return resolved;
        }
    }

    return null;
};

/**
 * Tenancy ID resolver.
 */
const getTenancyId = (tenancy) => {
    if (
        tenancy === null ||
        tenancy === undefined
    ) {
        return null;
    }

    const direct = normalizeId(tenancy);

    if (direct !== null) {
        return direct;
    }

    if (!isPlainObject(tenancy)) {
        return null;
    }

    const candidates = [
        tenancy.tenancy_id,
        tenancy.tenancy?.id,
        tenancy.data?.id,
        tenancy.data?.tenancy_id,
        tenancy.data?.tenancy?.id,
    ];

    for (const candidate of candidates) {
        const resolved = normalizeId(candidate);

        if (resolved !== null) {
            return resolved;
        }
    }

    return null;
};

/**
 * Property ID resolver.
 */
const getPropertyId = (property) => {
    if (
        property === null ||
        property === undefined
    ) {
        return null;
    }

    const direct = normalizeId(property);

    if (direct !== null) {
        return direct;
    }

    if (!isPlainObject(property)) {
        return null;
    }

    const candidates = [
        property.property_id,
        property.property?.id,
        property.data?.id,
        property.data?.property_id,
        property.data?.property?.id,
    ];

    for (const candidate of candidates) {
        const resolved = normalizeId(candidate);

        if (resolved !== null) {
            return resolved;
        }
    }

    return null;
};

/**
 * Apartment ID resolver.
 */
const getApartmentId = (apartment) => {
    if (
        apartment === null ||
        apartment === undefined
    ) {
        return null;
    }

    const direct = normalizeId(apartment);

    if (direct !== null) {
        return direct;
    }

    if (!isPlainObject(apartment)) {
        return null;
    }

    const candidates = [
        apartment.apartment_id,
        apartment.apartment?.id,
        apartment.data?.id,
        apartment.data?.apartment_id,
        apartment.data?.apartment?.id,
    ];

    for (const candidate of candidates) {
        const resolved = normalizeId(candidate);

        if (resolved !== null) {
            return resolved;
        }
    }

    return null;
};

/**
 * Unit ID resolver.
 */
const getUnitId = (unit) => {
    if (
        unit === null ||
        unit === undefined
    ) {
        return null;
    }

    const direct = normalizeId(unit);

    if (direct !== null) {
        return direct;
    }

    if (!isPlainObject(unit)) {
        return null;
    }

    const candidates = [
        unit.unit_id,
        unit.unit?.id,
        unit.data?.id,
        unit.data?.unit_id,
        unit.data?.unit?.id,
    ];

    for (const candidate of candidates) {
        const resolved = normalizeId(candidate);

        if (resolved !== null) {
            return resolved;
        }
    }

    return null;
};

/*
|--------------------------------------------------------------------------
| Booking Resource Detection
|--------------------------------------------------------------------------
*/

const isBookingResource = (value) => {
    if (!isPlainObject(value)) {
        return false;
    }

    return (
        value.booking_number !== undefined ||
        value.reference !== undefined ||
        value.booking_type !== undefined ||
        (
            value.id !== undefined &&
            (
                value.property_id !== undefined ||
                value.customer_id !== undefined ||
                value.unit_id !== undefined
            )
        )
    );
};

const extractBookingResource = (
    response,
    visited = new Set()
) => {
    if (
        response === null ||
        response === undefined
    ) {
        return null;
    }

    if (typeof response === "object") {
        if (visited.has(response)) {
            return null;
        }

        visited.add(response);
    }

    if (isBookingResource(response)) {
        return response;
    }

    if (Array.isArray(response)) {
        for (const item of response) {
            const resolved =
                extractBookingResource(
                    item,
                    visited
                );

            if (resolved) {
                return resolved;
            }
        }

        return null;
    }

    if (!isPlainObject(response)) {
        return null;
    }

    const candidates = [
        response?.data?.data,
        response?.data?.booking,
        response?.data,
        response?.payload?.data?.data,
        response?.payload?.data?.booking,
        response?.payload?.data,
        response?.payload?.booking,
        response?.payload,
        response?.booking,
        response?.result?.data,
        response?.result?.booking,
        response?.result,
        response?.response?.data?.data,
        response?.response?.data?.booking,
        response?.response?.data,
    ];

    for (const candidate of candidates) {
        if (
            candidate === undefined ||
            candidate === null
        ) {
            continue;
        }

        const resolved =
            extractBookingResource(
                candidate,
                visited
            );

        if (resolved) {
            return resolved;
        }
    }

    for (const value of Object.values(response)) {
        if (
            value === null ||
            value === undefined ||
            typeof value !== "object"
        ) {
            continue;
        }

        const resolved =
            extractBookingResource(
                value,
                visited
            );

        if (resolved) {
            return resolved;
        }
    }

    return null;
};

/*
|--------------------------------------------------------------------------
| Error Helpers
|--------------------------------------------------------------------------
*/

const normalizeError = (error) => {
    if (!error) {
        return null;
    }

    const payload =
        error?.payload ??
        error;

    const message =
        payload?.message ??
        payload?.error?.message ??
        error?.message ??
        "An unexpected error occurred.";

    const errors =
        payload?.errors ??
        payload?.data?.errors ??
        error?.errors ??
        null;

    const status =
        payload?.status ??
        payload?.code ??
        error?.status ??
        error?.response?.status ??
        null;

    return {
        message,
        errors,
        status,
        raw: error,
    };
};

/*
|--------------------------------------------------------------------------
| Filter Helpers
|--------------------------------------------------------------------------
*/

const cleanFilters = (filters = {}) => {
    if (!isPlainObject(filters)) {
        return {};
    }

    return Object.entries(filters).reduce(
        (result, [key, value]) => {
            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                result[key] = value;
            }

            return result;
        },
        {}
    );
};

const cleanSearchParams = (params = {}) => {
    if (!isPlainObject(params)) {
        return {};
    }

    const cleaned = cleanFilters(params);

    if (isPlainObject(cleaned.search)) {
        cleaned.search =
            cleanFilters(
                cleaned.search
            );
    }

    return cleaned;
};

/*
|--------------------------------------------------------------------------
| Update Payload Helpers
|--------------------------------------------------------------------------
*/

const PROTECTED_UPDATE_FIELDS = [
    "id",
    "booking_id",
    "user_id",
    "booking_number",
    "reference",
    "slug",
    "created_at",
    "updated_at",
    "deleted_at",
];

const sanitizeBookingUpdatePayload = (data) => {
    if (!isPlainObject(data)) {
        return {};
    }

    const payload = {
        ...data,
    };

    PROTECTED_UPDATE_FIELDS.forEach(
        (field) => {
            delete payload[field];
        }
    );

    return payload;
};

/*
|--------------------------------------------------------------------------
| Stable Request Keys
|--------------------------------------------------------------------------
*/

const createRequestKey = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return String(value);
    }

    if (typeof value !== "object") {
        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        return `[${value
            .map(createRequestKey)
            .join(",")}]`;
    }

    return `{${Object.keys(value)
        .sort()
        .map(
            (key) =>
                `${JSON.stringify(
                    key
                )}:${createRequestKey(
                    value[key]
                )}`
        )
        .join(",")}}`;
};

/*
|--------------------------------------------------------------------------
| Number / Money Helpers
|--------------------------------------------------------------------------
*/

const toFiniteNumber = (
    value,
    fallback = null
) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return fallback;
    }

    if (typeof value === "number") {
        return Number.isFinite(value)
            ? Number(value)
            : fallback;
    }

    if (typeof value !== "string") {
        return fallback;
    }

    let normalized = value.trim();

    if (!normalized) {
        return fallback;
    }

    const negative =
        normalized.startsWith("(") &&
        normalized.endsWith(")");

    normalized = normalized
        .replace(/,/g, "")
        .replace(/[^\d.-]/g, "");

    if (!normalized) {
        return fallback;
    }

    const number = Number(normalized);

    if (!Number.isFinite(number)) {
        return fallback;
    }

    return negative
        ? -Math.abs(number)
        : number;
};

const normalizeBookingAmount = (
    value,
    fallback = null
) => {
    const number =
        toFiniteNumber(
            value,
            fallback
        );

    if (
        number === null ||
        !Number.isFinite(number)
    ) {
        return fallback;
    }

    return Number(
        Number(number).toFixed(2)
    );
};

const roundMoney = (value) => {
    const number =
        toFiniteNumber(
            value,
            0
        );

    return Number(
        Number(number).toFixed(2)
    );
};

/*
|--------------------------------------------------------------------------
| Boolean Helpers
|--------------------------------------------------------------------------
*/

const normalizeBoolean = (
    value,
    fallback = false
) => {
    if (
        value === true ||
        value === false
    ) {
        return value;
    }

    if (typeof value === "number") {
        return value !== 0;
    }

    if (typeof value === "string") {
        const normalized =
            value
                .trim()
                .toLowerCase();

        if (
            [
                "true",
                "1",
                "yes",
                "on",
            ].includes(normalized)
        ) {
            return true;
        }

        if (
            [
                "false",
                "0",
                "no",
                "off",
            ].includes(normalized)
        ) {
            return false;
        }
    }

    return fallback;
};

/*
|--------------------------------------------------------------------------
| Payment Helpers
|--------------------------------------------------------------------------
*/

const isPaymentCountable = (payment) => {
    if (!isPlainObject(payment)) {
        return false;
    }

    const status =
        String(
            firstPresent(
                payment.status,
                payment.payment_status,
                payment.transaction_status,
                payment.state
            ) ?? ""
        )
            .trim()
            .toLowerCase();

    if (!status) {
        return true;
    }

    return [
        "paid",
        "completed",
        "complete",
        "successful",
        "success",
        "confirmed",
        "approved",
        "processed",
    ].includes(status);
};

const sumPaymentCollection = (payments) => {
    if (!Array.isArray(payments)) {
        return null;
    }

    let total = 0;
    let foundAmount = false;

    for (const payment of payments) {
        if (
            !isPaymentCountable(
                payment
            )
        ) {
            continue;
        }

        const amount =
            firstPresent(
                payment?.amount_paid,
                payment?.paid_amount,
                payment?.amount,
                payment?.payment_amount,
                payment?.total_amount
            );

        const numericAmount =
            toFiniteNumber(
                amount,
                null
            );

        if (
            numericAmount !== null
        ) {
            total += numericAmount;
            foundAmount = true;
        }
    }

    return foundAmount
        ? roundMoney(total)
        : null;
};

/*
|--------------------------------------------------------------------------
| Financial Normalization
|--------------------------------------------------------------------------
*/

const normalizeBookingFinancials = (
    financials,
    booking = {}
) => {
    const root =
        isPlainObject(booking)
            ? booking
            : {};

    const primaryFinancials =
        parseObject(financials);

    const financialContainers = [
        parseObject(
            root.financial_summary
        ),
        parseObject(
            root.payment_summary
        ),
        parseObject(
            root.amounts
        ),
        parseObject(
            root.summary
        ),
        primaryFinancials,
    ];

    const source =
        Object.assign(
            {},
            ...financialContainers
        );

    const rentAmount =
        normalizeBookingAmount(
            firstDefinedNested(
                source,
                [
                    "rent_amount",
                    "rent",
                ],
                firstPresent(
                    root.rent_amount,
                    root.rent
                )
            ),
            null
        );

    const depositAmount =
        normalizeBookingAmount(
            firstDefinedNested(
                source,
                [
                    "deposit_amount",
                    "deposit",
                ],
                firstPresent(
                    root.deposit_amount,
                    root.deposit
                )
            ),
            null
        );

    const serviceCharge =
        normalizeBookingAmount(
            firstDefinedNested(
                source,
                [
                    "service_charge",
                    "service_charge_amount",
                ],
                firstPresent(
                    root.service_charge,
                    root.service_charge_amount
                )
            ),
            null
        );

    const bookingFee =
        normalizeBookingAmount(
            firstDefinedNested(
                source,
                [
                    "booking_fee",
                    "booking_fee_amount",
                ],
                firstPresent(
                    root.booking_fee,
                    root.booking_fee_amount
                )
            ),
            null
        );

    const discountAmount =
        normalizeBookingAmount(
            firstDefinedNested(
                source,
                [
                    "discount_amount",
                    "discount",
                ],
                firstPresent(
                    root.discount_amount,
                    root.discount
                )
            ),
            null
        );

    let totalAmount =
        normalizeBookingAmount(
            firstDefinedNested(
                source,
                [
                    "total_amount",
                    "grand_total",
                    "booking_total",
                    "total",
                    "total_due",
                    "total_payable",
                ],
                firstPresent(
                    root.total_amount,
                    root.grand_total,
                    root.booking_total,
                    root.total,
                    root.total_due,
                    root.total_payable
                )
            ),
            null
        );

    if (totalAmount === null) {
        const hasCharge = [
            rentAmount,
            depositAmount,
            serviceCharge,
            bookingFee,
            discountAmount,
        ].some(
            (value) =>
                value !== null
        );

        if (hasCharge) {
            const charges =
                (rentAmount ?? 0) +
                (depositAmount ?? 0) +
                (serviceCharge ?? 0) +
                (bookingFee ?? 0);

            const discount =
                discountAmount ?? 0;

            totalAmount =
                roundMoney(
                    Math.max(
                        charges -
                        discount,
                        0
                    )
                );
        }
    }

    let amountPaid =
        normalizeBookingAmount(
            firstDefinedNested(
                source,
                [
                    "amount_paid",
                    "paid_amount",
                    "amountPaid",
                    "paid",
                    "total_paid",
                    "paid_total",
                    "payments_total",
                ],
                firstPresent(
                    root.amount_paid,
                    root.paid_amount,
                    root.amountPaid,
                    root.paid,
                    root.total_paid,
                    root.paid_total,
                    root.payments_total
                )
            ),
            null
        );

    if (amountPaid === null) {
        const paymentCollections = [
            source?.payments,
            root?.payments,
            source?.payment_records,
            root?.payment_records,
        ];

        for (const payments of paymentCollections) {
            const calculatedPaid =
                sumPaymentCollection(
                    payments
                );

            if (
                calculatedPaid !== null
            ) {
                amountPaid =
                    calculatedPaid;

                break;
            }
        }
    }

    if (
        amountPaid === null &&
        (
            totalAmount !== null ||
            rentAmount !== null ||
            depositAmount !== null ||
            serviceCharge !== null ||
            bookingFee !== null ||
            discountAmount !== null
        )
    ) {
        amountPaid = 0;
    }

    let balance =
        normalizeBookingAmount(
            firstDefinedNested(
                source,
                [
                    "balance",
                    "balance_amount",
                    "amount_due",
                    "remaining_balance",
                ],
                firstPresent(
                    root.balance,
                    root.balance_amount,
                    root.amount_due,
                    root.remaining_balance
                )
            ),
            null
        );

    if (
        totalAmount !== null &&
        amountPaid !== null
    ) {
        balance =
            roundMoney(
                Math.max(
                    totalAmount -
                    amountPaid,
                    0
                )
            );
    }

    let paymentStatus =
        firstDefinedNested(
            source,
            [
                "payment_status",
                "paymentStatus",
            ],
            firstPresent(
                root.payment_status,
                root.paymentStatus
            )
        );

    if (
        paymentStatus !==
        undefined &&
        paymentStatus !==
        null &&
        paymentStatus !== ""
    ) {
        paymentStatus =
            String(
                paymentStatus
            )
                .trim()
                .toLowerCase();
    } else {
        paymentStatus = null;
    }

    if (
        !paymentStatus &&
        totalAmount !== null &&
        amountPaid !== null
    ) {
        if (amountPaid <= 0) {
            paymentStatus =
                "pending";
        } else if (
            totalAmount <= 0 ||
            amountPaid >= totalAmount
        ) {
            paymentStatus =
                "paid";
        } else {
            paymentStatus =
                "partial";
        }
    }

    const backendFullyPaid =
        firstDefinedNested(
            source,
            [
                "is_fully_paid",
                "isFullyPaid",
            ],
            firstPresent(
                root.is_fully_paid,
                root.isFullyPaid
            )
        );

    const backendPartiallyPaid =
        firstDefinedNested(
            source,
            [
                "is_partially_paid",
                "isPartiallyPaid",
            ],
            firstPresent(
                root.is_partially_paid,
                root.isPartiallyPaid
            )
        );

    const backendHasBalance =
        firstDefinedNested(
            source,
            [
                "has_balance",
                "hasBalance",
            ],
            firstPresent(
                root.has_balance,
                root.hasBalance
            )
        );

    const isFullyPaid =
        backendFullyPaid !==
            undefined
            ? normalizeBoolean(
                backendFullyPaid
            )
            : (
                totalAmount !== null &&
                amountPaid !== null &&
                (
                    totalAmount <= 0 ||
                    amountPaid >=
                    totalAmount
                )
            );

    const isPartiallyPaid =
        backendPartiallyPaid !==
            undefined
            ? normalizeBoolean(
                backendPartiallyPaid
            )
            : (
                totalAmount !== null &&
                amountPaid !== null &&
                amountPaid > 0 &&
                amountPaid <
                totalAmount
            );

    const hasBalance =
        backendHasBalance !==
            undefined
            ? normalizeBoolean(
                backendHasBalance
            )
            : (
                balance !== null &&
                balance > 0
            );

    const hasActualFinancialData =
        [
            rentAmount,
            depositAmount,
            serviceCharge,
            bookingFee,
            discountAmount,
            totalAmount,
            amountPaid,
            balance,
        ].some(
            (value) =>
                value !== null
        );

    return {
        ...source,

        rent_amount:
            rentAmount,

        deposit_amount:
            depositAmount,

        service_charge:
            serviceCharge,

        booking_fee:
            bookingFee,

        discount_amount:
            discountAmount,

        total_amount:
            totalAmount,

        amount_paid:
            amountPaid,

        paid_amount:
            amountPaid,

        balance,

        payment_status:
            paymentStatus,

        total:
            totalAmount,

        paid:
            amountPaid,

        remaining_balance:
            balance,

        is_fully_paid:
            isFullyPaid,

        isFullyPaid:
            isFullyPaid,

        is_partially_paid:
            isPartiallyPaid,

        isPartiallyPaid:
            isPartiallyPaid,

        has_balance:
            hasBalance,

        hasBalance:
            hasBalance,

        has_actual_financial_data:
            hasActualFinancialData,

        hasActualFinancialData:
            hasActualFinancialData,
    };
};

/*
|--------------------------------------------------------------------------
| Booking Normalization
|--------------------------------------------------------------------------
*/

const normalizeBooking = (booking) => {
    if (!isPlainObject(booking)) {
        return booking;
    }

    const financials =
        normalizeBookingFinancials(
            booking.financials,
            booking
        );

    return {
        ...booking,

        financials,

        rent_amount:
            financials.rent_amount,

        deposit_amount:
            financials.deposit_amount,

        service_charge:
            financials.service_charge,

        booking_fee:
            financials.booking_fee,

        discount_amount:
            financials.discount_amount,

        total_amount:
            financials.total_amount,

        amount_paid:
            financials.amount_paid,

        paid_amount:
            financials.amount_paid,

        balance:
            financials.balance,

        payment_status:
            financials.payment_status,

        total:
            financials.total_amount,

        paid:
            financials.amount_paid,

        remaining_balance:
            financials.balance,

        is_fully_paid:
            financials.is_fully_paid,

        isFullyPaid:
            financials.isFullyPaid,

        is_partially_paid:
            financials.is_partially_paid,

        isPartiallyPaid:
            financials.isPartiallyPaid,

        has_balance:
            financials.has_balance,

        hasBalance:
            financials.hasBalance,

        has_actual_financial_data:
            financials.has_actual_financial_data,

        hasActualFinancialData:
            financials.hasActualFinancialData,
    };
};

const normalizeBookings = (bookings) => {
    if (!Array.isArray(bookings)) {
        return [];
    }

    return bookings.map(
        normalizeBooking
    );
};

/*
|--------------------------------------------------------------------------
| Response Helpers
|--------------------------------------------------------------------------
*/

const extractCollection = (
    response,
    visited = new Set()
) => {
    if (
        response === null ||
        response === undefined
    ) {
        return [];
    }

    if (Array.isArray(response)) {
        return response;
    }

    if (typeof response === "object") {
        if (visited.has(response)) {
            return [];
        }

        visited.add(response);
    }

    if (!isPlainObject(response)) {
        return [];
    }

    const candidates = [
        response?.data?.data,
        response?.data?.items,
        response?.data?.bookings,
        response?.data?.tenancies,
        response?.data?.tenants,
        response?.data?.users,
        response?.data,
        response?.payload?.data?.data,
        response?.payload?.data?.items,
        response?.payload?.data?.bookings,
        response?.payload?.data?.tenancies,
        response?.payload?.data?.tenants,
        response?.payload?.data,
        response?.payload,
        response?.bookings,
        response?.tenancies,
        response?.tenants,
        response?.users,
        response?.items,
        response?.result?.data,
        response?.result,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }
    }

    return [];
};

const extractFirstResource = (
    response,
    visited = new Set()
) => {
    if (
        response === null ||
        response === undefined
    ) {
        return null;
    }

    if (Array.isArray(response)) {
        return response[0] ?? null;
    }

    if (typeof response === "object") {
        if (visited.has(response)) {
            return null;
        }

        visited.add(response);
    }

    if (!isPlainObject(response)) {
        return null;
    }

    if (
        response.id !== undefined &&
        response.id !== null
    ) {
        return response;
    }

    const candidates = [
        response?.data?.data,
        response?.data?.tenant,
        response?.data?.tenancy,
        response?.data,
        response?.payload?.data?.data,
        response?.payload?.data?.tenant,
        response?.payload?.data?.tenancy,
        response?.payload?.data,
        response?.payload?.tenant,
        response?.payload?.tenancy,
        response?.payload,
        response?.tenant,
        response?.tenancy,
        response?.result?.data,
        response?.result,
    ];

    for (const candidate of candidates) {
        if (
            candidate === null ||
            candidate === undefined
        ) {
            continue;
        }

        const resource =
            extractFirstResource(
                candidate,
                visited
            );

        if (resource) {
            return resource;
        }
    }

    return null;
};

/*
|--------------------------------------------------------------------------
| Tenant / Tenancy Helpers
|--------------------------------------------------------------------------
*/

const extractTenantTenancies = (tenant) => {
    if (!tenant) {
        return [];
    }

    const candidates = [
        tenant.tenancies,
        tenant.data?.tenancies,
        tenant.data?.data?.tenancies,
        tenant.activeTenancies,
        tenant.active_tenancies,
        tenant.tenancy,
        tenant.data?.tenancy,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }

        if (
            isPlainObject(candidate) &&
            getTenancyId(candidate)
        ) {
            return [candidate];
        }
    }

    return [];
};

const getCustomerUserId = (customer) => {
    if (!customer) {
        return null;
    }

    return normalizeId(
        firstPresent(
            customer.user_id,
            customer.user?.id,
            customer.customer_id,
            customer.id
        )
    );
};

/*
|--------------------------------------------------------------------------
| Tenancy Relationship Normalization
|--------------------------------------------------------------------------
*/

/**
 * Normalize tenancy relationships without changing the original
 * backend resource.
 */
const normalizeTenancy = (tenancy) => {
    if (!isPlainObject(tenancy)) {
        return tenancy;
    }

    const tenant =
        tenancy.tenant ??
        tenancy.tenantProfile ??
        tenancy.tenant_profile ??
        null;

    const property =
        tenancy.property ??
        null;

    const apartment =
        tenancy.apartment ??
        null;

    const unit =
        tenancy.unit ??
        null;

    const tenantId =
        normalizeId(
            firstPresent(
                tenancy.tenant_id,
                tenant?.id,
                tenant?.tenant_id
            )
        );

    const propertyId =
        normalizeId(
            firstPresent(
                tenancy.property_id,
                property?.id,
                property?.property_id
            )
        );

    const apartmentId =
        normalizeId(
            firstPresent(
                tenancy.apartment_id,
                apartment?.id,
                apartment?.apartment_id
            )
        );

    const unitId =
        normalizeId(
            firstPresent(
                tenancy.unit_id,
                unit?.id,
                unit?.unit_id
            )
        );

    return {
        ...tenancy,

        tenant_id:
            tenantId,

        property_id:
            propertyId,

        apartment_id:
            apartmentId,

        unit_id:
            unitId,

        tenant:
            tenant,

        property:
            property,

        apartment:
            apartment,

        unit:
            unit,
    };
};

const normalizeTenancies = (items) => {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .filter(
            (item) =>
                isPlainObject(item)
        )
        .map(
            normalizeTenancy
        );
};

const dedupeById = (
    items,
    getId
) => {
    if (!Array.isArray(items)) {
        return [];
    }

    const seen = new Set();
    const result = [];

    for (const item of items) {
        const id =
            getId(item);

        const key =
            id !== null &&
                id !== undefined
                ? String(id)
                : null;

        if (
            key !== null &&
            seen.has(key)
        ) {
            continue;
        }

        if (key !== null) {
            seen.add(key);
        }

        result.push(item);
    }

    return result;
};

/*
|--------------------------------------------------------------------------
| Hook
|--------------------------------------------------------------------------
*/

export const useBooking = (
    options = {}
) => {
    const dispatch =
        useDispatch();

    const {
        autoFetch = true,
        initialFilters =
        EMPTY_FILTERS,
        initialPage,
        initialPerPage,
    } = options;

    /*
    |--------------------------------------------------------------------------
    | Redux state
    |--------------------------------------------------------------------------
    */

    const bookingState =
        useSelector(
            (state) =>
                state.bookings ??
                {}
        );

    const {
        bookings:
        rawBookings = [],

        currentBooking:
        rawCurrentBooking =
        null,

        loading = false,
        isLoading = false,
        loadingList = false,
        loadingDetails = false,
        loadingCreate = false,
        loadingUpdate = false,
        loadingDelete = false,
        loadingSearch = false,
        loadingStatistics = false,
        loadingReports = false,
        loadingWorkflow = false,
        loadingAvailability = false,

        error = null,
        errors = null,

        statistics:
        rawStatistics = null,

        reports:
        rawReports = null,

        availableUnits:
        rawAvailableUnits = [],

        availableUsers:
        rawAvailableUsers = [],

        tenancies:
        rawTenancies = [],

        pagination:
        rawPagination = null,

        filters:
        rawFilters =
        EMPTY_FILTERS,

        page:
        reduxPage = 1,

        perPage:
        reduxPerPage =
        DEFAULT_PER_PAGE,

        total:
        reduxTotal = 0,

        lastPage:
        reduxLastPage = 1,

        from:
        reduxFrom = null,

        to:
        reduxTo = null,

        initialized = false,
    } = bookingState;

    /*
    |--------------------------------------------------------------------------
    | Stable filters
    |--------------------------------------------------------------------------
    */

    const safeInitialFilters =
        useMemo(
            () =>
                cleanFilters(
                    initialFilters
                ),
            [initialFilters]
        );

    const safeReduxFilters =
        useMemo(
            () =>
                cleanFilters(
                    rawFilters
                ),
            [rawFilters]
        );

    const mergedFilters =
        useMemo(
            () => ({
                ...safeInitialFilters,
                ...safeReduxFilters,
            }),
            [
                safeInitialFilters,
                safeReduxFilters,
            ]
        );

    /*
    |--------------------------------------------------------------------------
    | Request refs
    |--------------------------------------------------------------------------
    */

    const initialFetchStartedRef =
        useRef(false);

    const activeBookingsRequestRef =
        useRef(null);

    const activeStatisticsRequestRef =
        useRef(null);

    /*
    |--------------------------------------------------------------------------
    | Customer -> Tenant -> Tenancy
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
        customerTenanciesLoading,
        setCustomerTenanciesLoading,
    ] = useState(false);

    const [
        customerTenanciesError,
        setCustomerTenanciesError,
    ] = useState(null);

    /*
    |--------------------------------------------------------------------------
    | Derived state
    |--------------------------------------------------------------------------
    */

    const bookings =
        useMemo(
            () =>
                normalizeBookings(
                    rawBookings
                ),
            [rawBookings]
        );

    const currentBooking =
        useMemo(
            () =>
                normalizeBooking(
                    rawCurrentBooking
                ),
            [rawCurrentBooking]
        );

    const availableUnits =
        useMemo(
            () => {
                const collection =
                    Array.isArray(
                        rawAvailableUnits
                    )
                        ? rawAvailableUnits
                        : extractCollection(
                            rawAvailableUnits
                        );

                return collection;
            },
            [rawAvailableUnits]
        );

    const availableUsers =
        useMemo(
            () => {
                const collection =
                    Array.isArray(
                        rawAvailableUsers
                    )
                        ? rawAvailableUsers
                        : extractCollection(
                            rawAvailableUsers
                        );

                return collection;
            },
            [rawAvailableUsers]
        );

    const tenancies =
        useMemo(
            () => {
                const collection =
                    Array.isArray(
                        rawTenancies
                    )
                        ? rawTenancies
                        : extractCollection(
                            rawTenancies
                        );

                return dedupeById(
                    normalizeTenancies(
                        collection
                    ),
                    getTenancyId
                );
            },
            [rawTenancies]
        );

    const normalizedCustomerTenancies =
        useMemo(
            () =>
                dedupeById(
                    normalizeTenancies(
                        customerTenancies
                    ),
                    getTenancyId
                ),
            [customerTenancies]
        );

    const statistics =
        useMemo(
            () =>
                rawStatistics ?? {},
            [rawStatistics]
        );

    const reports =
        useMemo(
            () =>
                rawReports ?? {},
            [rawReports]
        );

    const pagination =
        useMemo(
            () => ({
                ...(isPlainObject(
                    rawPagination
                )
                    ? rawPagination
                    : {}),

                current_page:
                    rawPagination?.current_page ??
                    reduxPage,

                per_page:
                    rawPagination?.per_page ??
                    reduxPerPage,

                total:
                    rawPagination?.total ??
                    reduxTotal,

                last_page:
                    rawPagination?.last_page ??
                    reduxLastPage,

                from:
                    rawPagination?.from ??
                    reduxFrom,

                to:
                    rawPagination?.to ??
                    reduxTo,
            }),
            [
                rawPagination,
                reduxPage,
                reduxPerPage,
                reduxTotal,
                reduxLastPage,
                reduxFrom,
                reduxTo,
            ]
        );

    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    const isAnyLoading =
        Boolean(
            loading ||
            isLoading ||
            loadingList ||
            loadingDetails ||
            loadingCreate ||
            loadingUpdate ||
            loadingDelete ||
            loadingSearch ||
            loadingStatistics ||
            loadingReports ||
            loadingWorkflow ||
            loadingAvailability ||
            customerTenanciesLoading
        );

    /*
    |--------------------------------------------------------------------------
    | Fetch bookings
    |--------------------------------------------------------------------------
    */

    const getBookings =
        useCallback(
            async (params = {}) => {
                const cleanedParams =
                    cleanFilters(
                        params
                    );

                const requestKey =
                    createRequestKey(
                        cleanedParams
                    );

                if (
                    activeBookingsRequestRef
                        .current
                        ?.key ===
                    requestKey
                ) {
                    return activeBookingsRequestRef
                        .current
                        .promise;
                }

                const promise =
                    dispatch(
                        fetchBookings(
                            cleanedParams
                        )
                    );

                activeBookingsRequestRef.current =
                {
                    key:
                        requestKey,
                    promise,
                };

                Promise.resolve(
                    promise
                ).then(
                    () => {
                        if (
                            activeBookingsRequestRef
                                .current
                                ?.promise ===
                            promise
                        ) {
                            activeBookingsRequestRef.current =
                                null;
                        }
                    },
                    () => {
                        if (
                            activeBookingsRequestRef
                                .current
                                ?.promise ===
                            promise
                        ) {
                            activeBookingsRequestRef.current =
                                null;
                        }
                    }
                );

                return promise;
            },
            [dispatch]
        );

    /*
    |--------------------------------------------------------------------------
    | Get single booking
    |--------------------------------------------------------------------------
    */

    const getBooking =
        useCallback(
            async (value) => {
                const id =
                    getBookingId(
                        value
                    );

                if (
                    id === null ||
                    id === undefined ||
                    id === ""
                ) {
                    throw new Error(
                        "A valid booking ID is required."
                    );
                }

                try {
                    const dispatched =
                        dispatch(
                            fetchBooking(id)
                        );

                    let result;

                    if (
                        dispatched &&
                        typeof dispatched.unwrap ===
                        "function"
                    ) {
                        result =
                            await dispatched.unwrap();
                    } else {
                        result =
                            await dispatched;
                    }

                    const resolvedBooking =
                        extractBookingResource(
                            result
                        );

                    if (
                        !resolvedBooking
                    ) {
                        throw new Error(
                            "Booking details were not returned by the server."
                        );
                    }

                    return normalizeBooking(
                        resolvedBooking
                    );
                } catch (
                requestError
                ) {
                    console.error(
                        "[useBooking] Failed to fetch booking:",
                        {
                            bookingId:
                                id,
                            error:
                                requestError,
                        }
                    );

                    throw requestError;
                }
            },
            [dispatch]
        );

    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    */

    const addBooking =
        useCallback(
            async (data) => {
                if (!isPlainObject(data)) {
                    throw new Error(
                        "Booking data must be a valid object."
                    );
                }

                return dispatch(
                    createBooking(
                        data
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

    const updateBooking =
        useCallback(
            async (
                value,
                data
            ) => {
                const id =
                    getBookingId(
                        value
                    );

                if (
                    id === null ||
                    id === undefined ||
                    id === ""
                ) {
                    throw new Error(
                        "A valid booking ID is required."
                    );
                }

                if (
                    !isPlainObject(data)
                ) {
                    throw new Error(
                        "Booking update data must be a valid object."
                    );
                }

                const sanitizedPayload =
                    sanitizeBookingUpdatePayload(
                        data
                    );

                try {
                    const dispatched =
                        dispatch(
                            updateBookingAction({
                                id,
                                data:
                                    sanitizedPayload,
                            })
                        );

                    if (
                        dispatched &&
                        typeof dispatched.unwrap ===
                        "function"
                    ) {
                        return await dispatched.unwrap();
                    }

                    return await dispatched;
                } catch (
                requestError
                ) {
                    const normalized =
                        normalizeError(
                            requestError
                        );

                    console.error(
                        "[useBooking] Failed to update booking:",
                        {
                            id,
                            sanitizedPayload,
                            message:
                                normalized?.message,
                            errors:
                                normalized?.errors,
                            status:
                                normalized?.status,
                            raw:
                                requestError,
                        }
                    );

                    throw requestError;
                }
            },
            [dispatch]
        );

    const editBooking =
        updateBooking;

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    const removeBooking =
        useCallback(
            async (value) => {
                const id =
                    getBookingId(
                        value
                    );

                if (
                    id === null ||
                    id === undefined ||
                    id === ""
                ) {
                    throw new Error(
                        "A valid booking ID is required."
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

    const search =
        useCallback(
            async (
                queryOrParams,
                perPage =
                    DEFAULT_PER_PAGE
            ) => {
                if (
                    isPlainObject(
                        queryOrParams
                    )
                ) {
                    return dispatch(
                        searchBookings(
                            cleanSearchParams(
                                queryOrParams
                            )
                        )
                    );
                }

                return dispatch(
                    searchBookings({
                        search:
                            queryOrParams ??
                            "",
                        per_page:
                            perPage,
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

    const getStatistics =
        useCallback(
            async (
                filters = {}
            ) => {
                const cleaned =
                    cleanFilters(
                        filters
                    );

                const requestKey =
                    createRequestKey(
                        cleaned
                    );

                if (
                    activeStatisticsRequestRef
                        .current
                        ?.key ===
                    requestKey
                ) {
                    return activeStatisticsRequestRef
                        .current
                        .promise;
                }

                const promise =
                    dispatch(
                        fetchBookingStatistics(
                            cleaned
                        )
                    );

                activeStatisticsRequestRef.current =
                {
                    key:
                        requestKey,
                    promise,
                };

                Promise.resolve(
                    promise
                ).then(
                    () => {
                        if (
                            activeStatisticsRequestRef
                                .current
                                ?.promise ===
                            promise
                        ) {
                            activeStatisticsRequestRef.current =
                                null;
                        }
                    },
                    () => {
                        if (
                            activeStatisticsRequestRef
                                .current
                                ?.promise ===
                            promise
                        ) {
                            activeStatisticsRequestRef.current =
                                null;
                        }
                    }
                );

                return promise;
            },
            [dispatch]
        );

    /*
    |--------------------------------------------------------------------------
    | Reports
    |--------------------------------------------------------------------------
    */

    const getReports =
        useCallback(
            async (
                filters = {}
            ) => {
                return dispatch(
                    fetchBookingReports(
                        cleanFilters(
                            filters
                        )
                    )
                );
            },
            [dispatch]
        );

    /*
    |--------------------------------------------------------------------------
    | Status Methods
    |--------------------------------------------------------------------------
    */

    const getPending =
        useCallback(
            async (
                params = {}
            ) => {
                return dispatch(
                    fetchPendingBookings(
                        cleanFilters(
                            params
                        )
                    )
                );
            },
            [dispatch]
        );

    const getConfirmed =
        useCallback(
            async (
                params = {}
            ) => {
                return dispatch(
                    fetchConfirmedBookings(
                        cleanFilters(
                            params
                        )
                    )
                );
            },
            [dispatch]
        );

    const getActive =
        useCallback(
            async (
                params = {}
            ) => {
                return dispatch(
                    fetchActiveBookings(
                        cleanFilters(
                            params
                        )
                    )
                );
            },
            [dispatch]
        );

    const getCompleted =
        useCallback(
            async (
                params = {}
            ) => {
                return dispatch(
                    fetchCompletedBookings(
                        cleanFilters(
                            params
                        )
                    )
                );
            },
            [dispatch]
        );

    const getCancelled =
        useCallback(
            async (
                params = {}
            ) => {
                return dispatch(
                    fetchCancelledBookings(
                        cleanFilters(
                            params
                        )
                    )
                );
            },
            [dispatch]
        );

    const getExpired =
        useCallback(
            async (
                params = {}
            ) => {
                return dispatch(
                    fetchExpiredBookings(
                        cleanFilters(
                            params
                        )
                    )
                );
            },
            [dispatch]
        );

    /*
    |--------------------------------------------------------------------------
    | Customer -> Tenant -> Tenancy
    |--------------------------------------------------------------------------
    */

    const resolveCustomerTenancies =
        useCallback(
            async (customer) => {
                setSelectedCustomer(
                    customer ?? null
                );

                setSelectedTenant(
                    null
                );

                setCustomerTenancies(
                    []
                );

                setCustomerTenanciesError(
                    null
                );

                const customerUserId =
                    getCustomerUserId(
                        customer
                    );

                if (
                    !customerUserId
                ) {
                    return [];
                }

                setCustomerTenanciesLoading(
                    true
                );

                try {
                    let response =
                        null;

                    /*
                     * First attempt:
                     * dedicated customer relationship endpoint.
                     */
                    if (
                        typeof bookingApi.resolveCustomerTenancies ===
                        "function"
                    ) {
                        response =
                            await bookingApi.resolveCustomerTenancies(
                                customerUserId
                            );
                    }

                    let tenant =
                        extractFirstResource(
                            response
                        );

                    /*
                     * Second attempt:
                     * tenant by user.
                     */
                    if (
                        !tenant &&
                        typeof bookingApi.getTenantByUser ===
                        "function"
                    ) {
                        const tenantResponse =
                            await bookingApi.getTenantByUser(
                                customerUserId
                            );

                        tenant =
                            extractFirstResource(
                                tenantResponse
                            );
                    }

                    if (tenant) {
                        setSelectedTenant(
                            tenant
                        );
                    }

                    /*
                     * Try nested tenancy data first.
                     */
                    let tenancyList =
                        extractTenantTenancies(
                            tenant
                        );

                    /*
                     * If the API response itself contains a
                     * tenancy collection, use it.
                     */
                    if (
                        tenancyList.length ===
                        0 &&
                        response
                    ) {
                        const responseTenancies =
                            extractCollection(
                                response
                            );

                        if (
                            responseTenancies.length >
                            0
                        ) {
                            tenancyList =
                                responseTenancies;
                        }
                    }

                    const tenantId =
                        getTenantId(
                            tenant
                        );

                    /*
                     * Fetch all tenant tenancies.
                     */
                    if (
                        tenancyList.length ===
                        0 &&
                        tenantId &&
                        typeof bookingApi.getTenanciesByTenant ===
                        "function"
                    ) {
                        const tenancyResponse =
                            await bookingApi.getTenanciesByTenant(
                                tenantId
                            );

                        tenancyList =
                            extractCollection(
                                tenancyResponse
                            );
                    }

                    /*
                     * Fallback to active tenant tenancies.
                     */
                    if (
                        tenancyList.length ===
                        0 &&
                        tenantId &&
                        typeof bookingApi.getActiveTenanciesByTenant ===
                        "function"
                    ) {
                        const activeResponse =
                            await bookingApi.getActiveTenanciesByTenant(
                                tenantId
                            );

                        tenancyList =
                            extractCollection(
                                activeResponse
                            );
                    }

                    const normalizedTenancies =
                        dedupeById(
                            normalizeTenancies(
                                tenancyList
                            ),
                            getTenancyId
                        );

                    setCustomerTenancies(
                        normalizedTenancies
                    );

                    return normalizedTenancies;
                } catch (
                requestError
                ) {
                    const normalized =
                        normalizeError(
                            requestError
                        );

                    setCustomerTenanciesError(
                        normalized
                    );

                    setCustomerTenancies(
                        []
                    );

                    console.error(
                        "[useBooking] Failed to resolve customer tenancies:",
                        requestError
                    );

                    throw requestError;
                } finally {
                    setCustomerTenanciesLoading(
                        false
                    );
                }
            },
            []
        );

    /*
    |--------------------------------------------------------------------------
    | Find tenant by customer/user
    |--------------------------------------------------------------------------
    */

    const getTenantByCustomer =
        useCallback(
            async (customer) => {
                const customerUserId =
                    getCustomerUserId(
                        customer
                    );

                if (!customerUserId) {
                    return null;
                }

                try {
                    if (
                        typeof bookingApi.getTenantByUser ===
                        "function"
                    ) {
                        const response =
                            await bookingApi.getTenantByUser(
                                customerUserId
                            );

                        return extractFirstResource(
                            response
                        );
                    }

                    if (
                        typeof bookingApi.resolveCustomerTenancies ===
                        "function"
                    ) {
                        const response =
                            await bookingApi.resolveCustomerTenancies(
                                customerUserId
                            );

                        return extractFirstResource(
                            response
                        );
                    }

                    return null;
                } catch (
                requestError
                ) {
                    console.error(
                        "[useBooking] Failed to resolve tenant by customer:",
                        {
                            customerUserId,
                            error:
                                requestError,
                        }
                    );

                    return null;
                }
            },
            []
        );

    /*
    |--------------------------------------------------------------------------
    | Direct tenant tenancies
    |--------------------------------------------------------------------------
    */

    const getTenanciesByTenant =
        useCallback(
            async (tenant) => {
                const tenantId =
                    getTenantId(
                        tenant
                    );

                if (!tenantId) {
                    return [];
                }

                if (
                    typeof bookingApi.getTenanciesByTenant !==
                    "function"
                ) {
                    return [];
                }

                const response =
                    await bookingApi.getTenanciesByTenant(
                        tenantId
                    );

                return dedupeById(
                    normalizeTenancies(
                        extractCollection(
                            response
                        )
                    ),
                    getTenancyId
                );
            },
            []
        );

    const getActiveTenanciesByTenant =
        useCallback(
            async (tenant) => {
                const tenantId =
                    getTenantId(
                        tenant
                    );

                if (!tenantId) {
                    return [];
                }

                if (
                    typeof bookingApi.getActiveTenanciesByTenant !==
                    "function"
                ) {
                    return [];
                }

                const response =
                    await bookingApi.getActiveTenanciesByTenant(
                        tenantId
                    );

                return dedupeById(
                    normalizeTenancies(
                        extractCollection(
                            response
                        )
                    ),
                    getTenancyId
                );
            },
            []
        );

    /*
    |--------------------------------------------------------------------------
    | Resolve tenancy relationships
    |--------------------------------------------------------------------------
    */

    const resolveTenancyRelationships =
        useCallback(
            (tenancy) => {
                const normalized =
                    normalizeTenancy(
                        tenancy
                    );

                if (
                    !isPlainObject(
                        normalized
                    )
                ) {
                    return {
                        tenancy: null,
                        tenancyId: null,
                        tenantId: null,
                        propertyId: null,
                        apartmentId: null,
                        unitId: null,
                        tenant: null,
                        property: null,
                        apartment: null,
                        unit: null,
                    };
                }

                return {
                    tenancy:
                        normalized,

                    tenancyId:
                        getTenancyId(
                            normalized
                        ),

                    tenantId:
                        normalized.tenant_id ??
                        getTenantId(
                            normalized.tenant
                        ),

                    propertyId:
                        normalized.property_id ??
                        getPropertyId(
                            normalized.property
                        ),

                    apartmentId:
                        normalized.apartment_id ??
                        getApartmentId(
                            normalized.apartment
                        ),

                    unitId:
                        normalized.unit_id ??
                        getUnitId(
                            normalized.unit
                        ),

                    tenant:
                        normalized.tenant ??
                        null,

                    property:
                        normalized.property ??
                        null,

                    apartment:
                        normalized.apartment ??
                        null,

                    unit:
                        normalized.unit ??
                        null,
                };
            },
            []
        );

    /*
    |--------------------------------------------------------------------------
    | Workflow
    |--------------------------------------------------------------------------
    */

    const confirm =
        useCallback(
            async (value) => {
                const id =
                    getBookingId(
                        value
                    );

                if (!id) {
                    throw new Error(
                        "A valid booking ID is required."
                    );
                }

                return dispatch(
                    confirmBooking(id)
                );
            },
            [dispatch]
        );

    const approve =
        useCallback(
            async (value) => {
                const id =
                    getBookingId(
                        value
                    );

                if (!id) {
                    throw new Error(
                        "A valid booking ID is required."
                    );
                }

                return dispatch(
                    approveBooking(id)
                );
            },
            [dispatch]
        );

    const checkIn =
        useCallback(
            async (value) => {
                const id =
                    getBookingId(
                        value
                    );

                if (!id) {
                    throw new Error(
                        "A valid booking ID is required."
                    );
                }

                return dispatch(
                    checkInBooking(id)
                );
            },
            [dispatch]
        );

    const complete =
        useCallback(
            async (value) => {
                const id =
                    getBookingId(
                        value
                    );

                if (!id) {
                    throw new Error(
                        "A valid booking ID is required."
                    );
                }

                return dispatch(
                    completeBooking(id)
                );
            },
            [dispatch]
        );

    const cancel =
        useCallback(
            async (
                value,
                reason
            ) => {
                const id =
                    getBookingId(
                        value
                    );

                if (!id) {
                    throw new Error(
                        "A valid booking ID is required."
                    );
                }

                return dispatch(
                    cancelBooking({
                        id,
                        reason,
                    })
                );
            },
            [dispatch]
        );

    const reject =
        useCallback(
            async (
                value,
                reason
            ) => {
                const id =
                    getBookingId(
                        value
                    );

                if (!id) {
                    throw new Error(
                        "A valid booking ID is required."
                    );
                }

                return dispatch(
                    rejectBooking({
                        id,
                        reason,
                    })
                );
            },
            [dispatch]
        );

    const expire =
        useCallback(
            async (value) => {
                const id =
                    getBookingId(
                        value
                    );

                if (!id) {
                    throw new Error(
                        "A valid booking ID is required."
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
    |
    | GET /bookings/available-units
    |
    | Required:
    | start_date
    | end_date
    |
    | Optional:
    | property_id
    | apartment_id
    | booking_id
    |
    | unit_id is deliberately NOT sent.
    |--------------------------------------------------------------------------
    */

    const getAvailableUnits =
        useCallback(
            async (params = {}) => {
                const normalized =
                    isPlainObject(params)
                        ? {
                            ...params,
                        }
                        : {};

                const propertyId =
                    getPropertyId(
                        firstPresent(
                            normalized.property_id,
                            normalized.propertyId,
                            normalized.property
                        )
                    );

                const apartmentId =
                    getApartmentId(
                        firstPresent(
                            normalized.apartment_id,
                            normalized.apartmentId,
                            normalized.apartment
                        )
                    );

                const bookingId =
                    getBookingId(
                        firstPresent(
                            normalized.booking_id,
                            normalized.bookingId,
                            normalized.booking
                        )
                    );

                const startDate =
                    firstPresent(
                        normalized.start_date,
                        normalized.startDate
                    );

                const endDate =
                    firstPresent(
                        normalized.end_date,
                        normalized.endDate
                    );

                if (!startDate) {
                    console.warn(
                        "[useBooking] Available units request skipped: start_date is missing."
                    );

                    return [];
                }

                if (!endDate) {
                    console.warn(
                        "[useBooking] Available units request skipped: end_date is missing."
                    );

                    return [];
                }

                const requestParams = {
                    start_date:
                        startDate,

                    end_date:
                        endDate,

                    ...(propertyId
                        ? {
                            property_id:
                                propertyId,
                        }
                        : {}),

                    ...(apartmentId
                        ? {
                            apartment_id:
                                apartmentId,
                        }
                        : {}),

                    ...(bookingId
                        ? {
                            booking_id:
                                bookingId,
                        }
                        : {}),
                };

                console.debug(
                    "[useBooking] Fetching available units:",
                    requestParams
                );

                try {
                    const dispatched =
                        dispatch(
                            fetchAvailableUnits(
                                requestParams
                            )
                        );

                    if (
                        dispatched &&
                        typeof dispatched.unwrap ===
                        "function"
                    ) {
                        return await dispatched.unwrap();
                    }

                    return await dispatched;
                } catch (
                requestError
                ) {
                    console.error(
                        "[useBooking] Failed to fetch available units:",
                        {
                            requestParams,
                            error:
                                requestError,
                        }
                    );

                    throw requestError;
                }
            },
            [dispatch]
        );

    /*
    |--------------------------------------------------------------------------
    | Available Users
    |--------------------------------------------------------------------------
    */

    const getAvailableUsers =
        useCallback(
            async (params = {}) => {
                let normalizedParams =
                    params;

                if (
                    typeof params ===
                    "string"
                ) {
                    normalizedParams = {
                        search: params,
                    };
                } else if (
                    !isPlainObject(
                        params
                    )
                ) {
                    normalizedParams = {};
                }

                try {
                    const dispatched =
                        dispatch(
                            fetchAvailableUsers(
                                cleanFilters(
                                    normalizedParams
                                )
                            )
                        );

                    if (
                        dispatched &&
                        typeof dispatched.unwrap ===
                        "function"
                    ) {
                        return await dispatched.unwrap();
                    }

                    return await dispatched;
                } catch (
                requestError
                ) {
                    console.error(
                        "[useBooking] Failed to fetch available users:",
                        requestError
                    );

                    throw requestError;
                }
            },
            [dispatch]
        );

    /*
    |--------------------------------------------------------------------------
    | Restore / Force Delete
    |--------------------------------------------------------------------------
    */

    const restore =
        useCallback(
            async (value) => {
                const id =
                    getBookingId(
                        value
                    );

                if (!id) {
                    throw new Error(
                        "A valid booking ID is required."
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
            async (value) => {
                const id =
                    getBookingId(
                        value
                    );

                if (!id) {
                    throw new Error(
                        "A valid booking ID is required."
                    );
                }

                return dispatch(
                    forceDeleteBooking(id)
                );
            },
            [dispatch]
        );

    /*
    |--------------------------------------------------------------------------
    | Filters
    |--------------------------------------------------------------------------
    */

    const updateFilters =
        useCallback(
            (filters = {}) => {
                return dispatch(
                    setFilters(
                        cleanFilters(
                            filters
                        )
                    )
                );
            },
            [dispatch]
        );

    const resetFilters =
        useCallback(
            () => {
                return dispatch(
                    clearFilters()
                );
            },
            [dispatch]
        );

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const changePage =
        useCallback(
            (nextPage) => {
                return dispatch(
                    setPage(
                        Math.max(
                            Number(
                                nextPage
                            ) || 1,
                            1
                        )
                    )
                );
            },
            [dispatch]
        );

    const changePerPage =
        useCallback(
            (nextPerPage) => {
                const normalized =
                    Math.min(
                        Math.max(
                            Number(
                                nextPerPage
                            ) ||
                            DEFAULT_PER_PAGE,
                            1
                        ),
                        100
                    );

                return dispatch(
                    setPerPage(
                        normalized
                    )
                );
            },
            [dispatch]
        );

    /*
    |--------------------------------------------------------------------------
    | Clear current booking
    |--------------------------------------------------------------------------
    */

    const clearCurrent =
        useCallback(
            () => {
                return dispatch(
                    clearCurrentBooking()
                );
            },
            [dispatch]
        );

    /*
    |--------------------------------------------------------------------------
    | Initial Fetch
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (
            !autoFetch ||
            initialFetchStartedRef.current
        ) {
            return;
        }

        initialFetchStartedRef.current =
            true;

        const page =
            initialPage ??
            reduxPage ??
            1;

        const perPage =
            initialPerPage ??
            reduxPerPage ??
            DEFAULT_PER_PAGE;

        const params =
            cleanFilters({
                ...mergedFilters,
                page,
                per_page:
                    perPage,
            });

        getBookings(
            params
        ).catch(() => {
            /*
             * Redux owns the request error state.
             */
        });
    }, [
        autoFetch,
        initialPage,
        initialPerPage,
        reduxPage,
        reduxPerPage,
        mergedFilters,
        getBookings,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Compatibility Loading Aliases
    |--------------------------------------------------------------------------
    */

    const loadingGet =
        Boolean(
            loadingDetails ||
            loading
        );

    const loadingAvailableUnits =
        Boolean(
            loadingAvailability
        );

    const loadingAvailableUsers =
        Boolean(
            loadingAvailability
        );

    /*
    |--------------------------------------------------------------------------
    | Return
    |--------------------------------------------------------------------------
    */

    return {
        /*
         * Data
         */

        bookings,

        currentBooking,

        availableUnits,

        availableUsers,

        tenancies,

        customerTenancies:
            normalizedCustomerTenancies,

        statistics,

        reports,

        pagination,

        normalizedBookings:
            bookings,

        normalizedCurrentBooking:
            currentBooking,

        /*
         * Customer relationship state
         */

        selectedCustomer,

        setSelectedCustomer,

        selectedTenant,

        setSelectedTenant,

        customerTenanciesLoading,

        customerTenanciesError,

        /*
         * Redux state
         */

        filters:
            mergedFilters,

        page:
            pagination.current_page,

        perPage:
            pagination.per_page,

        total:
            pagination.total,

        lastPage:
            pagination.last_page,

        from:
            pagination.from,

        to:
            pagination.to,

        initialized,

        /*
         * Loading
         */

        loading,

        isLoading,

        isAnyLoading,

        loadingList,

        loadingDetails,

        loadingCreate,

        loadingUpdate,

        loadingDelete,

        loadingSearch,

        loadingStatistics,

        loadingReports,

        loadingWorkflow,

        loadingAvailability,

        loadingGet,

        loadingAvailableUnits,

        loadingAvailableUsers,

        /*
         * Errors
         */

        error,

        errors,

        normalizedError:
            normalizeError(
                error ?? errors
            ),

        /*
         * CRUD
         */

        getBookings,

        getBooking,

        addBooking,

        updateBooking,

        editBooking,

        removeBooking,

        /*
         * Search
         */

        search,

        /*
         * Statistics / Reports
         */

        getStatistics,

        getReports,

        /*
         * Status
         */

        getPending,

        getConfirmed,

        getActive,

        getCompleted,

        getCancelled,

        getExpired,

        /*
         * Customer / Tenant / Tenancy
         */

        resolveCustomerTenancies,

        getTenantByCustomer,

        getTenanciesByTenant,

        getActiveTenanciesByTenant,

        resolveTenancyRelationships,

        /*
         * Workflow
         */

        confirm,

        approve,

        checkIn,

        complete,

        cancel,

        reject,

        expire,

        /*
         * Availability
         */

        getAvailableUnits,

        getAvailableUsers,

        /*
         * Delete lifecycle
         */

        restore,

        forceDelete,

        /*
         * Filters / Pagination
         */

        updateFilters,

        resetFilters,

        changePage,

        changePerPage,

        /*
         * Current booking
         */

        clearCurrent,

        /*
         * Utility helpers
         */

        normalizeId,

        getBookingId,

        getTenantId,

        getTenancyId,

        getPropertyId,

        getApartmentId,

        getUnitId,

        getNestedValue,

        normalizeBooking,

        normalizeBookingFinancials,

        normalizeBookingAmount,

        normalizeTenancy,

        normalizeTenancies,

        toFiniteNumber,

        extractBookingResource,

        extractCollection,

        extractFirstResource,

        sanitizeBookingUpdatePayload,
    };
};

export default useBooking;