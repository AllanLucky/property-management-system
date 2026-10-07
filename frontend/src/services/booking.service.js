import bookingApi from "../api/booking.api";

/*
|--------------------------------------------------------------------------
| Debug
|--------------------------------------------------------------------------
*/

const DEBUG_BOOKING_SERVICE = true;

/*
|--------------------------------------------------------------------------
| Response Helpers
|--------------------------------------------------------------------------
*/

/**
 * Check whether a value is a plain object.
 */
const isPlainObject = (value) => {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
};

/**
 * Safely get the first meaningful value.
 */
const firstDefined = (...values) => {
    for (const value of values) {
        if (
            value !== null &&
            value !== undefined &&
            value !== ""
        ) {
            return value;
        }
    }

    return undefined;
};

/**
 * Safely parse a JSON object.
 */
const parseFinancialObject = (value) => {
    if (!value) {
        return {};
    }

    if (isPlainObject(value)) {
        if (isPlainObject(value.data)) {
            const nested = value.data;

            if (Object.keys(nested).length > 0) {
                return nested;
            }
        }

        return value;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();

        if (!trimmed) {
            return {};
        }

        try {
            const parsed = JSON.parse(trimmed);

            if (isPlainObject(parsed)) {
                if (
                    isPlainObject(parsed.data) &&
                    Object.keys(parsed.data).length > 0
                ) {
                    return parsed.data;
                }

                return parsed;
            }
        } catch {
            return {};
        }
    }

    return {};
};

/**
 * Extract the normalized data payload from an API response.
 */
const getResponseData = (response) => {
    if (
        response === null ||
        response === undefined
    ) {
        return null;
    }

    /*
     * Axios response:
     *
     * {
     *   data: {
     *      data: ...
     *   }
     * }
     */
    if (
        response?.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data) &&
        Object.prototype.hasOwnProperty.call(
            response.data,
            "data"
        )
    ) {
        return response.data.data;
    }

    /*
     * Already normalized:
     *
     * {
     *   data: ...
     * }
     */
    if (
        typeof response === "object" &&
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

    const errorMessage =
        typeof error?.message === "string"
            ? error.message.toLowerCase()
            : "";

    const isTimeout =
        error?.code === "ECONNABORTED" ||
        error?.code === "ETIMEDOUT" ||
        errorMessage.includes("timeout");

    const isNetworkError =
        !response &&
        (
            errorMessage.includes("network") ||
            error?.code === "ERR_NETWORK"
        );

    let message =
        responseData?.message ??
        error?.message ??
        "Something went wrong. Please try again.";

    if (isTimeout) {
        message =
            "The booking API request timed out. Please check the API server, browser connection, CORS configuration, or duplicate requests.";
    } else if (isNetworkError) {
        message =
            "Unable to connect to the booking API. Please check that the Laravel API is running and accessible from the browser.";
    }

    return {
        message,

        errors:
            responseData?.errors ??
            null,

        code:
            responseData?.code ??
            response?.status ??
            error?.code ??
            null,

        status:
            responseData?.status ??
            false,

        raw:
            responseData ??
            null,

        axiosCode:
            error?.code ??
            null,

        isTimeout,

        isNetworkError,

        request:
            error?.request ??
            null,
    };
};

/*
|--------------------------------------------------------------------------
| Request Handler
|--------------------------------------------------------------------------
*/

/**
 * Execute an API request and return a consistent service response.
 *
 * No automatic retry is performed.
 */
const handleRequest = async (
    request,
    options = {}
) => {
    const startedAt = Date.now();

    const {
        label = "BookingService request",
    } = options;

    if (DEBUG_BOOKING_SERVICE) {
        console.debug(
            `[BookingService] ${label} → START`
        );
    }

    try {
        const response = await request;

        const duration =
            Date.now() - startedAt;

        if (DEBUG_BOOKING_SERVICE) {
            console.debug(
                `[BookingService] ${label} → SUCCESS`,
                {
                    duration: `${duration}ms`,
                    httpStatus:
                        response?.status,
                    apiStatus:
                        response?.data?.status,
                    code:
                        response?.data?.code,
                    message:
                        response?.data?.message,
                }
            );
        }

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
        const duration =
            Date.now() - startedAt;

        const normalized =
            normalizeError(error);

        if (DEBUG_BOOKING_SERVICE) {
            console.error(
                `[BookingService] ${label} → FAILED`,
                {
                    duration: `${duration}ms`,
                    message:
                        normalized.message,
                    code:
                        normalized.code,
                    axiosCode:
                        normalized.axiosCode,
                    status:
                        error?.response?.status,
                    url:
                        error?.config?.url,
                    method:
                        error?.config?.method,
                    baseURL:
                        error?.config?.baseURL,
                    timeout:
                        error?.config?.timeout,
                    isTimeout:
                        normalized.isTimeout,
                    isNetworkError:
                        normalized.isNetworkError,
                }
            );
        }

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
| Money Helpers
|--------------------------------------------------------------------------
*/

/**
 * Convert a value to a finite number.
 */
const toNumber = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    if (typeof value === "number") {
        return Number.isFinite(value)
            ? value
            : null;
    }

    if (typeof value === "bigint") {
        return Number(value);
    }

    if (isPlainObject(value)) {
        const nestedValue =
            firstDefined(
                value.value,
                value.amount,
                value.total,
                value.numeric_value,
                value.numericValue,
                value.raw,
                value.number
            );

        return nestedValue !== undefined
            ? toNumber(nestedValue)
            : null;
    }

    if (typeof value !== "string") {
        return null;
    }

    let cleaned =
        value
            .replace(/KES/gi, "")
            .replace(/KSHS/gi, "")
            .replace(/KSH/gi, "")
            .replace(/,/g, "")
            .trim();

    if (!cleaned) {
        return null;
    }

    const isParenthesized =
        cleaned.startsWith("(") &&
        cleaned.endsWith(")");

    if (isParenthesized) {
        cleaned =
            cleaned
                .slice(1, -1)
                .trim();
    }

    cleaned =
        cleaned.replace(
            /[^0-9.-]/g,
            ""
        );

    if (!cleaned) {
        return null;
    }

    const numeric =
        Number(cleaned);

    if (!Number.isFinite(numeric)) {
        return null;
    }

    return isParenthesized
        ? -Math.abs(numeric)
        : numeric;
};

/**
 * Normalize a monetary value.
 */
const normalizeMoney = (
    value,
    fallback = 0
) => {
    const numeric =
        toNumber(value);

    return numeric === null
        ? fallback
        : Number(
            numeric.toFixed(2)
        );
};

/**
 * Return whether a value is explicitly meaningful.
 */
const hasValue = (value) => {
    return (
        value !== null &&
        value !== undefined &&
        value !== ""
    );
};

/**
 * Safely normalize boolean values.
 */
const normalizeBoolean = (
    value,
    fallback = false
) => {
    if (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true" ||
        value === "TRUE" ||
        value === "yes" ||
        value === "YES"
    ) {
        return true;
    }

    if (
        value === false ||
        value === 0 ||
        value === "0" ||
        value === "false" ||
        value === "FALSE" ||
        value === "no" ||
        value === "NO"
    ) {
        return false;
    }

    return fallback;
};

/*
|--------------------------------------------------------------------------
| ID Helpers
|--------------------------------------------------------------------------
*/

/**
 * Normalize an entity ID.
 *
 * Prevents:
 *
 * [object Object]
 *
 * from ever being sent to the API.
 */
const normalizeEntityId = (
    value
) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    if (typeof value === "object") {
        if (Array.isArray(value)) {
            return null;
        }

        return normalizeEntityId(
            firstDefined(
                value.id,
                value.value,
                value.booking_id,
                value.user_id,
                value.customer_id,
                value.tenant_id,
                value.tenancy_id,
                value.property_id,
                value.apartment_id,
                value.unit_id,
                value.resource?.id,
                value.data?.id
            )
        );
    }

    if (typeof value === "string") {
        const trimmed =
            value.trim();

        if (
            !trimmed ||
            trimmed === "[object Object]"
        ) {
            return null;
        }

        return trimmed;
    }

    if (typeof value === "number") {
        return Number.isFinite(value)
            ? value
            : null;
    }

    return null;
};

/*
|--------------------------------------------------------------------------
| Booking Update Payload Sanitization
|--------------------------------------------------------------------------
*/

const BOOKING_UPDATE_SERVER_MANAGED_FIELDS = [
    "payment_status",
    "paymentStatus",

    "total_amount",
    "totalAmount",
    "grand_total",
    "grandTotal",
    "booking_total",
    "bookingTotal",
    "total_due",
    "totalDue",
    "amount_due",
    "amountDue",
    "total_payable",
    "totalPayable",

    "balance",
    "balance_amount",
    "balanceAmount",
    "outstanding_balance",
    "outstandingBalance",
    "amount_balance",
    "amountBalance",
    "amount_outstanding",
    "amountOutstanding",

    "is_fully_paid",
    "isFullyPaid",
    "is_partially_paid",
    "isPartiallyPaid",
    "has_balance",
    "hasBalance",

    "total",
    "paid",
    "total_paid",
    "totalPaid",
    "paid_amount",
    "paidAmount",

    "status",

    "confirmed_at",
    "confirmedAt",

    "approved_at",
    "approvedAt",

    "rejected_at",
    "rejectedAt",

    "cancelled_at",
    "canceled_at",
    "cancelledAt",
    "canceledAt",

    "completed_at",
    "completedAt",

    "expired_at",
    "expiredAt",

    "paid_at",
    "paidAt",

    "refunded_at",
    "refundedAt",

    "rejection_reason",
    "rejectionReason",

    "cancellation_reason",
    "cancellationReason",

    "refund_amount",
    "refundAmount",

    "refund_reference",
    "refundReference",

    "id",
    "booking_number",
    "bookingNumber",
    "reference",
    "slug",

    "created_at",
    "createdAt",

    "updated_at",
    "updatedAt",

    "deleted_at",
    "deletedAt",
];

/**
 * Sanitize a normal booking update payload.
 *
 * amount_paid remains allowed.
 */
const sanitizeBookingUpdatePayload = (
    payload = {}
) => {
    if (!isPlainObject(payload)) {
        return {};
    }

    const sanitized = {
        ...payload,
    };

    const removedFields = [];

    BOOKING_UPDATE_SERVER_MANAGED_FIELDS.forEach(
        (field) => {
            if (
                Object.prototype.hasOwnProperty.call(
                    sanitized,
                    field
                )
            ) {
                removedFields.push(field);

                delete sanitized[field];
            }
        }
    );

    /*
     * Customer identity is represented by customer_id.
     */
    if (
        Object.prototype.hasOwnProperty.call(
            sanitized,
            "user_id"
        )
    ) {
        removedFields.push("user_id");

        delete sanitized.user_id;
    }

    /*
     * Never send object values for ID fields.
     */
    const idFields = [
        "customer_id",
        "tenant_id",
        "tenancy_id",
        "property_id",
        "apartment_id",
        "unit_id",
    ];

    idFields.forEach(
        (field) => {
            if (
                Object.prototype.hasOwnProperty.call(
                    sanitized,
                    field
                )
            ) {
                sanitized[field] =
                    normalizeEntityId(
                        sanitized[field]
                    );
            }
        }
    );

    if (DEBUG_BOOKING_SERVICE) {
        console.debug(
            "[BookingService] Booking update payload sanitized",
            {
                removedFields,

                originalKeys:
                    Object.keys(payload),

                sanitizedKeys:
                    Object.keys(sanitized),

                preservedAmountPaid:
                    Object.prototype.hasOwnProperty.call(
                        sanitized,
                        "amount_paid"
                    )
                        ? sanitized.amount_paid
                        : undefined,
            }
        );
    }

    return sanitized;
};

/*
|--------------------------------------------------------------------------
| Availability Helpers
|--------------------------------------------------------------------------
*/

const normalizeAvailableUnitsParams = (
    params = {}
) => {
    if (!isPlainObject(params)) {
        return {
            valid: false,
            params: {},
            message:
                "Availability parameters must be an object.",
        };
    }

    const startDate =
        firstDefined(
            params.start_date,
            params.startDate
        );

    const endDate =
        firstDefined(
            params.end_date,
            params.endDate
        );

    const propertyId =
        normalizeEntityId(
            firstDefined(
                params.property_id,
                params.propertyId,
                params.property
            )
        );

    const apartmentId =
        normalizeEntityId(
            firstDefined(
                params.apartment_id,
                params.apartmentId,
                params.apartment
            )
        );

    const bookingId =
        normalizeEntityId(
            firstDefined(
                params.booking_id,
                params.bookingId,
                params.booking
            )
        );

    if (!hasValue(startDate)) {
        return {
            valid: false,
            params: {},
            message:
                "Start date is required to check available units.",
        };
    }

    if (!hasValue(endDate)) {
        return {
            valid: false,
            params: {},
            message:
                "End date is required to check available units.",
        };
    }

    const normalized = {
        start_date: startDate,
        end_date: endDate,
    };

    if (propertyId !== null) {
        normalized.property_id =
            propertyId;
    }

    if (apartmentId !== null) {
        normalized.apartment_id =
            apartmentId;
    }

    if (bookingId !== null) {
        normalized.booking_id =
            bookingId;
    }

    return {
        valid: true,
        params: normalized,
        message: null,
    };
};

/*
|--------------------------------------------------------------------------
| Financial Source Helpers
|--------------------------------------------------------------------------
*/

const resolveFinancialSources = (
    booking = {}
) => {
    const nestedBooking =
        isPlainObject(booking?.data)
            ? booking.data
            : {};

    const sources = [];

    const candidates = [
        booking?.financials,
        booking?.financial_summary,
        booking?.financialSummary,
        booking?.payment_summary,
        booking?.paymentSummary,
        booking?.amounts,
        booking?.summary,

        nestedBooking?.financials,
        nestedBooking?.financial_summary,
        nestedBooking?.financialSummary,
        nestedBooking?.payment_summary,
        nestedBooking?.paymentSummary,
        nestedBooking?.amounts,
        nestedBooking?.summary,
    ];

    candidates.forEach(
        (candidate) => {
            const parsed =
                parseFinancialObject(
                    candidate
                );

            if (
                isPlainObject(parsed) &&
                Object.keys(parsed).length > 0
            ) {
                sources.push(parsed);
            }
        }
    );

    return sources;
};

const resolveFinancialSource = (
    booking = {}
) => {
    const sources =
        resolveFinancialSources(
            booking
        );

    return (
        sources[0] ??
        {}
    );
};

const findFinancialValue = (
    booking,
    source,
    keys = []
) => {
    const nestedBooking =
        isPlainObject(booking?.data)
            ? booking.data
            : {};

    const sources = [
        source,
        ...resolveFinancialSources(
            booking
        ),
        nestedBooking,
        booking,
    ];

    for (const key of keys) {
        for (const currentSource of sources) {
            if (
                isPlainObject(
                    currentSource
                )
            ) {
                const value =
                    currentSource?.[key];

                if (hasValue(value)) {
                    return {
                        value,
                        key,
                    };
                }
            }
        }
    }

    return {
        value: undefined,
        key: null,
    };
};

const extractPayments = (
    booking = {},
    source = {}
) => {
    const nestedBooking =
        isPlainObject(booking?.data)
            ? booking.data
            : {};

    const candidates = [
        source?.payments,
        source?.payment_items,
        source?.paymentItems,

        booking?.payments,
        booking?.payment_items,
        booking?.paymentItems,

        nestedBooking?.payments,
        nestedBooking?.payment_items,
        nestedBooking?.paymentItems,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }

        if (isPlainObject(candidate)) {
            if (Array.isArray(candidate.data)) {
                return candidate.data;
            }

            if (Array.isArray(candidate.items)) {
                return candidate.items;
            }
        }
    }

    return [];
};

const isPaymentCountable = (
    payment
) => {
    if (!isPlainObject(payment)) {
        return false;
    }

    const status =
        String(
            firstDefined(
                payment.status,
                payment.payment_status,
                payment.paymentStatus
            ) ?? ""
        )
            .trim()
            .toLowerCase();

    if (!status) {
        return true;
    }

    if (
        [
            "failed",
            "cancelled",
            "canceled",
            "rejected",
            "refunded",
            "void",
            "voided",
        ].includes(status)
    ) {
        return false;
    }

    if (
        [
            "paid",
            "completed",
            "confirmed",
            "successful",
            "success",
            "approved",
            "processed",
        ].includes(status)
    ) {
        return true;
    }

    return false;
};

const calculatePaidFromPayments = (
    payments = []
) => {
    if (
        !Array.isArray(payments) ||
        payments.length === 0
    ) {
        return null;
    }

    let total = 0;
    let foundPaymentAmount = false;

    payments.forEach(
        (payment) => {
            if (!isPaymentCountable(payment)) {
                return;
            }

            const amount =
                firstDefined(
                    payment?.amount_paid,
                    payment?.amountPaid,
                    payment?.paid_amount,
                    payment?.paidAmount,
                    payment?.amount,
                    payment?.total_amount,
                    payment?.total
                );

            const numeric =
                toNumber(amount);

            if (numeric !== null) {
                total += numeric;
                foundPaymentAmount = true;
            }
        }
    );

    return foundPaymentAmount
        ? Number(total.toFixed(2))
        : null;
};

/*
|--------------------------------------------------------------------------
| Booking Financial Normalization
|--------------------------------------------------------------------------
*/

const normalizeBookingFinancials = (
    financials = {},
    booking = {}
) => {
    const source =
        parseFinancialObject(
            financials
        );

    const nestedBooking =
        isPlainObject(booking?.data)
            ? booking.data
            : {};

    const nestedFinancials =
        parseFinancialObject(
            nestedBooking?.financials
        );

    const rentResult =
        findFinancialValue(
            booking,
            source,
            [
                "rent_amount",
                "rentAmount",
                "rent",
                "rent_total",
            ]
        );

    const depositResult =
        findFinancialValue(
            booking,
            source,
            [
                "deposit_amount",
                "depositAmount",
                "deposit",
                "security_deposit",
                "securityDeposit",
            ]
        );

    const serviceChargeResult =
        findFinancialValue(
            booking,
            source,
            [
                "service_charge",
                "serviceCharge",
                "service_charge_amount",
                "serviceChargeAmount",
            ]
        );

    const bookingFeeResult =
        findFinancialValue(
            booking,
            source,
            [
                "booking_fee",
                "bookingFee",
                "booking_fee_amount",
                "bookingFeeAmount",
            ]
        );

    const discountResult =
        findFinancialValue(
            booking,
            source,
            [
                "discount_amount",
                "discountAmount",
                "discount",
            ]
        );

    const rentAmount =
        normalizeMoney(
            rentResult.value
        );

    const depositAmount =
        normalizeMoney(
            depositResult.value
        );

    const serviceCharge =
        normalizeMoney(
            serviceChargeResult.value
        );

    const bookingFee =
        normalizeMoney(
            bookingFeeResult.value
        );

    const discountAmount =
        normalizeMoney(
            discountResult.value
        );

    const totalResult =
        findFinancialValue(
            booking,
            source,
            [
                "total_amount",
                "totalAmount",
                "grand_total",
                "grandTotal",
                "booking_total",
                "bookingTotal",
                "total_due",
                "totalDue",
                "amount_due",
                "amountDue",
                "total_payable",
                "totalPayable",
                "total",
            ]
        );

    let totalAmount =
        toNumber(
            totalResult.value
        );

    let totalSource =
        totalResult.key;

    if (totalAmount === null) {
        const hasComponentData =
            [
                rentResult.value,
                depositResult.value,
                serviceChargeResult.value,
                bookingFeeResult.value,
                discountResult.value,
            ].some(hasValue);

        if (hasComponentData) {
            totalAmount =
                rentAmount +
                depositAmount +
                serviceCharge +
                bookingFee -
                discountAmount;

            totalAmount =
                Math.max(
                    0,
                    Number(
                        totalAmount.toFixed(2)
                    )
                );

            totalSource =
                "calculated_from_components";
        }
    }

    const paidResult =
        findFinancialValue(
            booking,
            source,
            [
                "amount_paid",
                "amountPaid",
                "paid_amount",
                "paidAmount",
                "total_paid",
                "totalPaid",
                "payments_total",
                "paymentsTotal",
                "paid",
            ]
        );

    let amountPaid =
        toNumber(
            paidResult.value
        );

    let paidSource =
        paidResult.key;

    if (amountPaid === null) {
        const payments =
            extractPayments(
                booking,
                source
            );

        const paymentsTotal =
            calculatePaidFromPayments(
                payments
            );

        if (paymentsTotal !== null) {
            amountPaid =
                paymentsTotal;

            paidSource =
                "calculated_from_payments";
        }
    }

    const balanceResult =
        findFinancialValue(
            booking,
            source,
            [
                "balance",
                "balance_amount",
                "balanceAmount",
                "outstanding_balance",
                "outstandingBalance",
                "amount_balance",
                "amountBalance",
                "amount_outstanding",
                "amountOutstanding",
            ]
        );

    let balance =
        toNumber(
            balanceResult.value
        );

    let balanceSource =
        balanceResult.key;

    if (
        balance === null &&
        totalAmount !== null &&
        amountPaid !== null
    ) {
        balance =
            Math.max(
                0,
                totalAmount - amountPaid
            );

        balance =
            Number(
                balance.toFixed(2)
            );

        balanceSource =
            "calculated_from_total_minus_paid";
    }

    if (totalAmount === null) {
        totalAmount = 0;
    }

    if (amountPaid === null) {
        amountPaid = 0;
    }

    if (balance === null) {
        balance = 0;
    }

    totalAmount =
        Number(
            totalAmount.toFixed(2)
        );

    amountPaid =
        Number(
            amountPaid.toFixed(2)
        );

    balance =
        Number(
            Math.max(0, balance).toFixed(2)
        );

    const backendFullyPaid =
        firstDefined(
            source?.is_fully_paid,
            source?.isFullyPaid,
            nestedFinancials?.is_fully_paid,
            nestedFinancials?.isFullyPaid,
            nestedBooking?.is_fully_paid,
            nestedBooking?.isFullyPaid,
            booking?.is_fully_paid,
            booking?.isFullyPaid
        );

    const backendPartiallyPaid =
        firstDefined(
            source?.is_partially_paid,
            source?.isPartiallyPaid,
            nestedFinancials?.is_partially_paid,
            nestedFinancials?.isPartiallyPaid,
            nestedBooking?.is_partially_paid,
            nestedBooking?.isPartiallyPaid,
            booking?.is_partially_paid,
            booking?.isPartiallyPaid
        );

    const backendHasBalance =
        firstDefined(
            source?.has_balance,
            source?.hasBalance,
            nestedFinancials?.has_balance,
            nestedFinancials?.hasBalance,
            nestedBooking?.has_balance,
            nestedBooking?.hasBalance,
            booking?.has_balance,
            booking?.hasBalance
        );

    const hasBackendFinancialData = [
        totalResult.value,
        paidResult.value,
        balanceResult.value,
        rentResult.value,
        depositResult.value,
        serviceChargeResult.value,
        bookingFeeResult.value,
        discountResult.value,
    ].some(hasValue);

    const payments =
        extractPayments(
            booking,
            source
        );

    const hasPaymentCollection =
        payments.length > 0;

    const hasFinancialData =
        hasBackendFinancialData ||
        hasPaymentCollection;

    const calculatedFullyPaid =
        totalAmount > 0 &&
        amountPaid >= totalAmount &&
        balance <= 0;

    const calculatedPartiallyPaid =
        totalAmount > 0 &&
        amountPaid > 0 &&
        amountPaid < totalAmount &&
        balance > 0;

    const calculatedHasBalance =
        balance > 0;

    const isFullyPaid =
        backendFullyPaid !== undefined
            ? normalizeBoolean(
                backendFullyPaid
            )
            : calculatedFullyPaid;

    const isPartiallyPaid =
        backendPartiallyPaid !== undefined
            ? normalizeBoolean(
                backendPartiallyPaid
            )
            : calculatedPartiallyPaid;

    const hasBalance =
        backendHasBalance !== undefined
            ? normalizeBoolean(
                backendHasBalance
            )
            : calculatedHasBalance;

    if (DEBUG_BOOKING_SERVICE) {
        console.debug(
            "[BookingService] Financial normalization",
            {
                bookingId:
                    booking?.id ??
                    nestedBooking?.id ??
                    null,

                bookingNumber:
                    booking?.booking_number ??
                    nestedBooking?.booking_number ??
                    null,

                rawTotal:
                    totalResult.value,

                rawPaid:
                    paidResult.value,

                rawBalance:
                    balanceResult.value,

                rentAmount,
                depositAmount,
                serviceCharge,
                bookingFee,
                discountAmount,

                totalAmount,
                amountPaid,
                balance,

                totalSource,
                paidSource,
                balanceSource,

                isFullyPaid,
                isPartiallyPaid,
                hasBalance,

                hasBackendFinancialData,
                hasPaymentCollection,
                hasFinancialData,
            }
        );
    }

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

        total:
            totalAmount,

        paid:
            amountPaid,

        total_paid:
            amountPaid,

        balance_amount:
            balance,

        outstanding_balance:
            balance,

        is_fully_paid:
            isFullyPaid,

        is_partially_paid:
            isPartiallyPaid,

        has_balance:
            hasBalance,

        has_financial_data:
            hasFinancialData,

        financial_total:
            totalAmount,

        financial_amount_paid:
            amountPaid,

        financial_balance:
            balance,

        currency:
            firstDefined(
                source?.currency,
                nestedFinancials?.currency,
                nestedBooking?.currency,
                booking?.currency,
                "KES"
            ),

        _normalization: {
            total_source:
                totalSource,

            paid_source:
                paidSource,

            balance_source:
                balanceSource,

            calculated_total:
                totalSource ===
                "calculated_from_components",

            calculated_paid:
                paidSource ===
                "calculated_from_payments",

            calculated_balance:
                balanceSource ===
                "calculated_from_total_minus_paid",
        },
    };
};

/*
|--------------------------------------------------------------------------
| Booking Normalization
|--------------------------------------------------------------------------
*/

const normalizeBookingResource = (
    booking
) => {
    if (
        !booking ||
        typeof booking !== "object" ||
        Array.isArray(booking)
    ) {
        return booking;
    }

    const actualBooking =
        isPlainObject(booking.data) &&
            (
                booking.data.id !== undefined ||
                booking.data.booking_number !== undefined
            )
            ? booking.data
            : booking;

    const financialSource =
        resolveFinancialSource(
            actualBooking
        );

    const financials =
        normalizeBookingFinancials(
            financialSource,
            actualBooking
        );

    const normalizedBooking = {
        ...actualBooking,

        financials,

        total_amount:
            financials.total_amount,

        amount_paid:
            financials.amount_paid,

        paid_amount:
            financials.amount_paid,

        total_paid:
            financials.amount_paid,

        balance:
            financials.balance,

        balance_amount:
            financials.balance,

        outstanding_balance:
            financials.balance,

        total:
            financials.total_amount,

        paid:
            financials.amount_paid,

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

        is_fully_paid:
            financials.is_fully_paid,

        is_partially_paid:
            financials.is_partially_paid,

        has_balance:
            financials.has_balance,

        has_financial_data:
            financials.has_financial_data,

        financial_total:
            financials.total_amount,

        financial_amount_paid:
            financials.amount_paid,

        financial_balance:
            financials.balance,

        currency:
            firstDefined(
                financials.currency,
                actualBooking?.currency,
                "KES"
            ),
    };

    if (actualBooking !== booking) {
        return {
            ...booking,

            data:
                normalizedBooking,
        };
    }

    return normalizedBooking;
};

const normalizeBookingCollection = (
    bookings
) => {
    if (!Array.isArray(bookings)) {
        return [];
    }

    return bookings.map(
        normalizeBookingResource
    );
};

/*
|--------------------------------------------------------------------------
| Generic Resource Helpers
|--------------------------------------------------------------------------
*/

const extractResource = (
    response
) => {
    let payload =
        response?.data ??
        null;

    if (
        payload === null ||
        payload === undefined
    ) {
        return null;
    }

    if (
        typeof payload === "object" &&
        !Array.isArray(payload) &&
        Array.isArray(payload.data)
    ) {
        return payload.data[0] ?? null;
    }

    if (Array.isArray(payload)) {
        return payload[0] ?? null;
    }

    if (
        typeof payload === "object" &&
        !Array.isArray(payload) &&
        Array.isArray(payload.items)
    ) {
        return payload.items[0] ?? null;
    }

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

        if (
            payload.resource &&
            typeof payload.resource === "object"
        ) {
            return payload.resource;
        }

        if (
            payload.booking &&
            typeof payload.booking === "object"
        ) {
            return payload.booking;
        }

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
            payload.tenancy &&
            typeof payload.tenancy === "object"
        ) {
            return payload.tenancy;
        }

        if (
            payload.property &&
            typeof payload.property === "object"
        ) {
            return payload.property;
        }

        if (
            payload.apartment &&
            typeof payload.apartment === "object"
        ) {
            return payload.apartment;
        }

        if (
            payload.unit &&
            typeof payload.unit === "object"
        ) {
            return payload.unit;
        }
    }

    return null;
};

const extractCollection = (
    response
) => {
    let payload =
        response?.data ??
        null;

    if (
        payload === null ||
        payload === undefined
    ) {
        return [];
    }

    if (Array.isArray(payload)) {
        return payload;
    }

    if (
        typeof payload === "object" &&
        Array.isArray(payload.data)
    ) {
        return payload.data;
    }

    if (
        typeof payload === "object" &&
        Array.isArray(payload.items)
    ) {
        return payload.items;
    }

    if (
        typeof payload === "object" &&
        payload.data &&
        typeof payload.data === "object" &&
        Array.isArray(payload.data.data)
    ) {
        return payload.data.data;
    }

    if (
        typeof payload === "object" &&
        payload.data &&
        typeof payload.data === "object" &&
        Array.isArray(payload.data.items)
    ) {
        return payload.data.items;
    }

    if (
        typeof payload === "object" &&
        payload.id !== undefined &&
        payload.id !== null
    ) {
        return [payload];
    }

    return [];
};

const normalizeCollectionResponse = (
    result,
    mapper = null
) => {
    const collection =
        extractCollection(
            result
        );

    return {
        ...result,

        data:
            typeof mapper === "function"
                ? collection.map(mapper)
                : collection,
    };
};

const normalizeResourceResponse = (
    result,
    mapper = null
) => {
    const resource =
        extractResource(
            result
        );

    return {
        ...result,

        data:
            resource && typeof mapper === "function"
                ? mapper(resource)
                : resource,
    };
};

/*
|--------------------------------------------------------------------------
| ID / Relationship Helpers
|--------------------------------------------------------------------------
*/

const getId = (
    value
) => {
    return normalizeEntityId(
        value
    );
};

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
        return normalizeEntityId(
            customer
        );
    }

    return normalizeEntityId(
        firstDefined(
            customer?.user_id,
            customer?.customer_id,
            customer?.user?.id,
            customer?.id,
            customer?.value
        )
    );
};

const getTenantId = (
    tenant
) => {
    if (
        tenant === null ||
        tenant === undefined
    ) {
        return null;
    }

    if (
        typeof tenant !== "object"
    ) {
        return normalizeEntityId(
            tenant
        );
    }

    return normalizeEntityId(
        firstDefined(
            tenant?.id,
            tenant?.tenant_id,
            tenant?.value
        )
    );
};

const extractTenantTenancies = (
    tenant
) => {
    if (
        !tenant ||
        typeof tenant !== "object"
    ) {
        return [];
    }

    const candidates = [
        tenant?.tenancies,
        tenant?.active_tenancies,
        tenant?.activeTenancies,
        tenant?.current_tenancies,
        tenant?.currentTenancies,
        tenant?.tenancy,
    ];

    for (const embedded of candidates) {
        if (!embedded) {
            continue;
        }

        if (Array.isArray(embedded)) {
            return embedded;
        }

        if (typeof embedded === "object") {
            if (Array.isArray(embedded.data)) {
                return embedded.data;
            }

            if (Array.isArray(embedded.items)) {
                return embedded.items;
            }

            if (
                embedded.id !== undefined &&
                embedded.id !== null
            ) {
                return [embedded];
            }
        }
    }

    return [];
};

const uniqueById = (
    items = []
) => {
    const map = new Map();

    items.forEach(
        (item) => {
            if (
                !item ||
                typeof item !== "object"
            ) {
                return;
            }

            const id =
                normalizeEntityId(
                    firstDefined(
                        item?.id,
                        item?.value,
                        item?.tenancy_id,
                        item?.booking_id,
                        item?.tenant_id,
                        item?.property_id,
                        item?.apartment_id,
                        item?.unit_id
                    )
                );

            if (
                id !== null &&
                id !== undefined
            ) {
                map.set(
                    String(id),
                    item
                );
            }
        }
    );

    return Array.from(
        map.values()
    );
};

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

    async getAll(params = {}) {
        const result =
            await handleRequest(
                bookingApi.getAll(params),
                {
                    label:
                        "GET /bookings",
                }
            );

        return {
            ...result,

            data:
                Array.isArray(result?.data)
                    ? normalizeBookingCollection(
                        result.data
                    )
                    : result.data,
        };
    },

    async getById(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        const result =
            await handleRequest(
                bookingApi.getById(
                    normalizedId
                ),
                {
                    label:
                        `GET /bookings/${normalizedId}`,
                }
            );

        return {
            ...result,

            data:
                normalizeBookingResource(
                    result?.data
                ),
        };
    },

    async create(payload = {}) {
        const result =
            await handleRequest(
                bookingApi.create(payload),
                {
                    label:
                        "POST /bookings",
                }
            );

        return {
            ...result,

            data:
                normalizeBookingResource(
                    result?.data
                ),
        };
    },

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

        const sanitizedPayload =
            sanitizeBookingUpdatePayload(
                payload
            );

        if (DEBUG_BOOKING_SERVICE) {
            console.debug(
                `[BookingService] PUT /bookings/${normalizedId} → PAYLOAD`,
                {
                    bookingId:
                        normalizedId,

                    payload:
                        sanitizedPayload,
                }
            );
        }

        const result =
            await handleRequest(
                bookingApi.update(
                    normalizedId,
                    sanitizedPayload
                ),
                {
                    label:
                        `PUT /bookings/${normalizedId}`,
                }
            );

        return {
            ...result,

            data:
                normalizeBookingResource(
                    result?.data
                ),
        };
    },

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
            ),
            {
                label:
                    `DELETE /bookings/${normalizedId}`,
            }
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
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

        const result =
            await handleRequest(
                bookingApi.search(
                    requestParams
                ),
                {
                    label:
                        "GET /bookings/search",
                }
            );

        return {
            ...result,

            data:
                Array.isArray(result?.data)
                    ? normalizeBookingCollection(
                        result.data
                    )
                    : result.data,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    async statistics(params = {}) {
        return handleRequest(
            bookingApi.statistics(params),
            {
                label:
                    "GET /bookings/statistics",
            }
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Reports
    |--------------------------------------------------------------------------
    */

    async reports(params = {}) {
        return handleRequest(
            bookingApi.reports(params),
            {
                label:
                    "GET /bookings/reports",
            }
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Status Lists
    |--------------------------------------------------------------------------
    */

    async pending(params = {}) {
        const result =
            await handleRequest(
                bookingApi.pending(params),
                {
                    label:
                        "GET /bookings/pending",
                }
            );

        return {
            ...result,

            data:
                Array.isArray(result?.data)
                    ? normalizeBookingCollection(
                        result.data
                    )
                    : result.data,
        };
    },

    async confirmed(params = {}) {
        const result =
            await handleRequest(
                bookingApi.confirmed(params),
                {
                    label:
                        "GET /bookings/confirmed",
                }
            );

        return {
            ...result,

            data:
                Array.isArray(result?.data)
                    ? normalizeBookingCollection(
                        result.data
                    )
                    : result.data,
        };
    },

    async active(params = {}) {
        const result =
            await handleRequest(
                bookingApi.active(params),
                {
                    label:
                        "GET /bookings/active",
                }
            );

        return {
            ...result,

            data:
                Array.isArray(result?.data)
                    ? normalizeBookingCollection(
                        result.data
                    )
                    : result.data,
        };
    },

    async completed(params = {}) {
        const result =
            await handleRequest(
                bookingApi.completed(params),
                {
                    label:
                        "GET /bookings/completed",
                }
            );

        return {
            ...result,

            data:
                Array.isArray(result?.data)
                    ? normalizeBookingCollection(
                        result.data
                    )
                    : result.data,
        };
    },

    async cancelled(params = {}) {
        const result =
            await handleRequest(
                bookingApi.cancelled(params),
                {
                    label:
                        "GET /bookings/cancelled",
                }
            );

        return {
            ...result,

            data:
                Array.isArray(result?.data)
                    ? normalizeBookingCollection(
                        result.data
                    )
                    : result.data,
        };
    },

    async expired(params = {}) {
        const result =
            await handleRequest(
                bookingApi.expired(params),
                {
                    label:
                        "GET /bookings/expired",
                }
            );

        return {
            ...result,

            data:
                Array.isArray(result?.data)
                    ? normalizeBookingCollection(
                        result.data
                    )
                    : result.data,
        };
    },

    async rejected(params = {}) {
        const result =
            await handleRequest(
                bookingApi.rejected(params),
                {
                    label:
                        "GET /bookings/rejected",
                }
            );

        return {
            ...result,

            data:
                Array.isArray(result?.data)
                    ? normalizeBookingCollection(
                        result.data
                    )
                    : result.data,
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Booking Workflow
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | confirmBooking() is the canonical public method.
    | confirm() is retained as a backwards-compatible alias.
    |
    |--------------------------------------------------------------------------
    */

    async confirmBooking(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required to confirm the booking."
            );
        }

        /*
         * Protect against accidental:
         *
         * /bookings/[object Object]/confirm
         */
        if (
            String(normalizedId) ===
            "[object Object]"
        ) {
            return requiredIdResponse(
                "A valid booking ID is required to confirm the booking."
            );
        }

        if (
            typeof bookingApi.confirm !==
            "function"
        ) {
            console.error(
                "[BookingService] bookingApi.confirm is not available."
            );

            return {
                success: false,

                code: 500,

                message:
                    "The booking confirmation API method is not available.",

                data: null,

                meta: null,

                links: null,

                errors: {
                    confirm: [
                        "bookingApi.confirm is not defined.",
                    ],
                },
            };
        }

        if (DEBUG_BOOKING_SERVICE) {
            console.debug(
                "[BookingService] Confirm booking",
                {
                    bookingId:
                        normalizedId,

                    endpoint:
                        `/bookings/${normalizedId}/confirm`,
                }
            );
        }

        const result =
            await handleRequest(
                bookingApi.confirm(
                    normalizedId
                ),
                {
                    label:
                        `POST /bookings/${normalizedId}/confirm`,
                }
            );

        return {
            ...result,

            data:
                normalizeBookingResource(
                    result?.data
                ),
        };
    },

    /**
     * Backward-compatible alias.
     *
     * Existing code can continue calling:
     *
     * bookingService.confirm(id)
     */
    async confirm(id) {
        return this.confirmBooking(id);
    },

    async approve(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        if (
            typeof bookingApi.approve !==
            "function"
        ) {
            return {
                success: false,

                code: 500,

                message:
                    "The booking approval API method is not available.",

                data: null,

                meta: null,

                links: null,

                errors: {
                    approve: [
                        "bookingApi.approve is not defined.",
                    ],
                },
            };
        }

        const result =
            await handleRequest(
                bookingApi.approve(
                    normalizedId
                ),
                {
                    label:
                        `POST /bookings/${normalizedId}/approve`,
                }
            );

        return {
            ...result,

            data:
                normalizeBookingResource(
                    result?.data
                ),
        };
    },

    async checkIn(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        if (
            typeof bookingApi.checkIn !==
            "function"
        ) {
            return {
                success: false,

                code: 500,

                message:
                    "The booking check-in API method is not available.",

                data: null,

                meta: null,

                links: null,

                errors: {
                    checkIn: [
                        "bookingApi.checkIn is not defined.",
                    ],
                },
            };
        }

        const result =
            await handleRequest(
                bookingApi.checkIn(
                    normalizedId
                ),
                {
                    label:
                        `POST /bookings/${normalizedId}/check-in`,
                }
            );

        return {
            ...result,

            data:
                normalizeBookingResource(
                    result?.data
                ),
        };
    },

    async complete(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        if (
            typeof bookingApi.complete !==
            "function"
        ) {
            return {
                success: false,

                code: 500,

                message:
                    "The booking completion API method is not available.",

                data: null,

                meta: null,

                links: null,

                errors: {
                    complete: [
                        "bookingApi.complete is not defined.",
                    ],
                },
            };
        }

        const result =
            await handleRequest(
                bookingApi.complete(
                    normalizedId
                ),
                {
                    label:
                        `POST /bookings/${normalizedId}/complete`,
                }
            );

        return {
            ...result,

            data:
                normalizeBookingResource(
                    result?.data
                ),
        };
    },

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

        if (
            typeof bookingApi.cancel !==
            "function"
        ) {
            return {
                success: false,

                code: 500,

                message:
                    "The booking cancellation API method is not available.",

                data: null,

                meta: null,

                links: null,

                errors: {
                    cancel: [
                        "bookingApi.cancel is not defined.",
                    ],
                },
            };
        }

        const result =
            await handleRequest(
                bookingApi.cancel(
                    normalizedId,
                    payload
                ),
                {
                    label:
                        `POST /bookings/${normalizedId}/cancel`,
                }
            );

        return {
            ...result,

            data:
                normalizeBookingResource(
                    result?.data
                ),
        };
    },

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

        if (
            typeof bookingApi.reject !==
            "function"
        ) {
            return {
                success: false,

                code: 500,

                message:
                    "The booking rejection API method is not available.",

                data: null,

                meta: null,

                links: null,

                errors: {
                    reject: [
                        "bookingApi.reject is not defined.",
                    ],
                },
            };
        }

        const result =
            await handleRequest(
                bookingApi.reject(
                    normalizedId,
                    normalizedReason
                ),
                {
                    label:
                        `POST /bookings/${normalizedId}/reject`,
                }
            );

        return {
            ...result,

            data:
                normalizeBookingResource(
                    result?.data
                ),
        };
    },

    async expire(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        if (
            typeof bookingApi.expire !==
            "function"
        ) {
            return {
                success: false,

                code: 500,

                message:
                    "The booking expiry API method is not available.",

                data: null,

                meta: null,

                links: null,

                errors: {
                    expire: [
                        "bookingApi.expire is not defined.",
                    ],
                },
            };
        }

        const result =
            await handleRequest(
                bookingApi.expire(
                    normalizedId
                ),
                {
                    label:
                        `POST /bookings/${normalizedId}/expire`,
                }
            );

        return {
            ...result,

            data:
                normalizeBookingResource(
                    result?.data
                ),
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Availability
    |--------------------------------------------------------------------------
    */

    async availableUnits(
        params = {}
    ) {
        const normalized =
            normalizeAvailableUnitsParams(
                params
            );

        if (!normalized.valid) {
            if (DEBUG_BOOKING_SERVICE) {
                console.warn(
                    "[BookingService] Available units request skipped",
                    {
                        reason:
                            normalized.message,
                        params,
                    }
                );
            }

            return {
                success: false,

                code: 422,

                message:
                    normalized.message,

                data: [],

                meta: null,

                links: null,

                errors: {
                    availability: [
                        normalized.message,
                    ],
                },
            };
        }

        const result =
            await handleRequest(
                bookingApi.availableUnits(
                    normalized.params
                ),
                {
                    label:
                        "GET /bookings/available-units",
                }
            );

        return {
            ...result,

            data:
                extractCollection(
                    result
                ),
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Users
    |--------------------------------------------------------------------------
    */

    async availableUsers(
        search = ""
    ) {
        let normalizedSearch = "";

        if (typeof search === "string") {
            normalizedSearch =
                search.trim();
        } else if (
            search &&
            typeof search === "object"
        ) {
            normalizedSearch =
                String(
                    firstDefined(
                        search.search,
                        search.q
                    ) ?? ""
                ).trim();
        }

        const result =
            await handleRequest(
                normalizedSearch
                    ? bookingApi.availableUsers({
                        search:
                            normalizedSearch,
                    })
                    : bookingApi.availableUsers(),
                {
                    label:
                        "GET /bookings/available-users",
                }
            );

        return normalizeCollectionResponse(
            result
        );
    },

    async users(
        params = {}
    ) {
        const result =
            await handleRequest(
                bookingApi.users(params),
                {
                    label:
                        "GET /users",
                }
            );

        return normalizeCollectionResponse(
            result
        );
    },

    async getUser(id) {
        const normalizedId =
            getCustomerUserId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Customer ID is required."
            );
        }

        const result =
            await handleRequest(
                bookingApi.getUser(
                    normalizedId
                ),
                {
                    label:
                        `GET /users/${normalizedId}`,
                }
            );

        return normalizeResourceResponse(
            result
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Tenants
    |--------------------------------------------------------------------------
    */

    async tenants(
        params = {}
    ) {
        const normalizedParams = {
            ...params,
        };

        if (
            normalizedParams.user_id !==
            undefined
        ) {
            normalizedParams.user_id =
                normalizeEntityId(
                    normalizedParams.user_id
                );
        }

        if (
            normalizedParams.userId !==
            undefined
        ) {
            normalizedParams.userId =
                normalizeEntityId(
                    normalizedParams.userId
                );
        }

        const result =
            await handleRequest(
                bookingApi.tenants(
                    normalizedParams
                ),
                {
                    label:
                        "GET /tenants",
                }
            );

        return normalizeCollectionResponse(
            result
        );
    },

    async getTenant(id) {
        const normalizedId =
            getTenantId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Tenant ID is required."
            );
        }

        const result =
            await handleRequest(
                bookingApi.getTenant(
                    normalizedId
                ),
                {
                    label:
                        `GET /tenants/${normalizedId}`,
                }
            );

        return normalizeResourceResponse(
            result
        );
    },

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
                ),
                {
                    label:
                        `GET /users/${normalizedId}/tenant`,
                }
            );

        return normalizeResourceResponse(
            result
        );
    },

    async availableTenantUsers(
        params = {}
    ) {
        const result =
            await handleRequest(
                bookingApi.availableTenantUsers(
                    params
                ),
                {
                    label:
                        "GET /tenants/available-users",
                }
            );

        return normalizeCollectionResponse(
            result
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Tenancies
    |--------------------------------------------------------------------------
    */

    async tenancies(
        params = {}
    ) {
        const normalizedParams = {
            ...params,
        };

        [
            "tenant_id",
            "tenantId",
            "property_id",
            "propertyId",
            "apartment_id",
            "apartmentId",
            "unit_id",
            "unitId",
        ].forEach(
            (field) => {
                if (
                    normalizedParams[field] !==
                    undefined
                ) {
                    normalizedParams[field] =
                        normalizeEntityId(
                            normalizedParams[field]
                        );
                }
            }
        );

        const result =
            await handleRequest(
                bookingApi.tenancies(
                    normalizedParams
                ),
                {
                    label:
                        "GET /tenancies",
                }
            );

        return normalizeCollectionResponse(
            result
        );
    },

    async getTenancy(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Tenancy ID is required."
            );
        }

        const result =
            await handleRequest(
                bookingApi.getTenancy(
                    normalizedId
                ),
                {
                    label:
                        `GET /tenancies/${normalizedId}`,
                }
            );

        return normalizeResourceResponse(
            result
        );
    },

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

        const result =
            await handleRequest(
                bookingApi.getTenanciesByTenant(
                    normalizedId,
                    params
                ),
                {
                    label:
                        `GET /tenants/${normalizedId}/tenancies`,
                }
            );

        return {
            ...normalizeCollectionResponse(
                result
            ),

            data:
                uniqueById(
                    extractCollection(
                        result
                    )
                ),
        };
    },

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

        const result =
            await handleRequest(
                bookingApi.getActiveTenanciesByTenant(
                    normalizedId,
                    params
                ),
                {
                    label:
                        `GET /tenants/${normalizedId}/active-tenancies`,
                }
            );

        return {
            ...normalizeCollectionResponse(
                result
            ),

            data:
                uniqueById(
                    extractCollection(
                        result
                    )
                ),
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Properties
    |--------------------------------------------------------------------------
    */

    async properties(
        params = {}
    ) {
        const result =
            await handleRequest(
                bookingApi.properties(params),
                {
                    label:
                        "GET /properties",
                }
            );

        return normalizeCollectionResponse(
            result
        );
    },

    async getProperty(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Property ID is required."
            );
        }

        const result =
            await handleRequest(
                bookingApi.getProperty(
                    normalizedId
                ),
                {
                    label:
                        `GET /properties/${normalizedId}`,
                }
            );

        return normalizeResourceResponse(
            result
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Apartments
    |--------------------------------------------------------------------------
    */

    async apartments(
        params = {}
    ) {
        const normalizedParams = {
            ...params,
        };

        [
            "property_id",
            "propertyId",
        ].forEach(
            (field) => {
                if (
                    normalizedParams[field] !==
                    undefined
                ) {
                    normalizedParams[field] =
                        normalizeEntityId(
                            normalizedParams[field]
                        );
                }
            }
        );

        const result =
            await handleRequest(
                bookingApi.apartments(
                    normalizedParams
                ),
                {
                    label:
                        "GET /apartments",
                }
            );

        return normalizeCollectionResponse(
            result
        );
    },

    async getApartment(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Apartment ID is required."
            );
        }

        const result =
            await handleRequest(
                bookingApi.getApartment(
                    normalizedId
                ),
                {
                    label:
                        `GET /apartments/${normalizedId}`,
                }
            );

        return normalizeResourceResponse(
            result
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Units
    |--------------------------------------------------------------------------
    */

    async units(
        params = {}
    ) {
        const normalizedParams = {
            ...params,
        };

        [
            "property_id",
            "propertyId",
            "apartment_id",
            "apartmentId",
            "unit_id",
            "unitId",
        ].forEach(
            (field) => {
                if (
                    normalizedParams[field] !==
                    undefined
                ) {
                    normalizedParams[field] =
                        normalizeEntityId(
                            normalizedParams[field]
                        );
                }
            }
        );

        const result =
            await handleRequest(
                bookingApi.units(
                    normalizedParams
                ),
                {
                    label:
                        "GET /units",
                }
            );

        return normalizeCollectionResponse(
            result
        );
    },

    async getUnit(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Unit ID is required."
            );
        }

        const result =
            await handleRequest(
                bookingApi.getUnit(
                    normalizedId
                ),
                {
                    label:
                        `GET /units/${normalizedId}`,
                }
            );

        return normalizeResourceResponse(
            result
        );
    },

    /*
    |--------------------------------------------------------------------------
    | Customer → Tenant → Tenancy
    |--------------------------------------------------------------------------
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
            const customerResult =
                await this.getUser(
                    normalizedCustomerId
                );

            const customer =
                customerResult?.success
                    ? customerResult?.data ?? null
                    : null;

            const tenantResult =
                await this.getTenantByCustomer(
                    normalizedCustomerId
                );

            if (!tenantResult?.success) {
                return {
                    success: false,

                    code:
                        tenantResult?.code ??
                        404,

                    message:
                        tenantResult?.message ??
                        "Unable to resolve the customer tenant.",

                    data: {
                        customerId:
                            normalizedCustomerId,

                        customer,

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

                    response: {
                        customerResponse:
                            customerResult?.response ??
                            null,

                        tenantResponse:
                            tenantResult?.response ??
                            null,

                        tenancyResponse:
                            null,
                    },
                };
            }

            const tenant =
                tenantResult?.data ??
                null;

            if (!tenant) {
                return {
                    success: true,

                    code: 200,

                    message:
                        "Customer does not have a tenant profile.",

                    data: {
                        customerId:
                            normalizedCustomerId,

                        customer,

                        tenant: null,

                        tenancies: [],
                    },

                    meta: null,

                    links: null,

                    errors: null,
                };
            }

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

                        customer,

                        tenant,

                        tenancies:
                            uniqueById(
                                extractTenantTenancies(
                                    tenant
                                )
                            ),
                    },

                    meta: null,

                    links: null,

                    errors: null,
                };
            }

            const tenancyResult =
                await this.getTenanciesByTenant(
                    tenantId,
                    {
                        ...params,
                        tenant_id:
                            tenantId,
                    }
                );

            const apiTenancies =
                tenancyResult?.success
                    ? extractCollection(
                        tenancyResult
                    )
                    : [];

            const embeddedTenancies =
                extractTenantTenancies(
                    tenant
                );

            const tenancies =
                uniqueById([
                    ...apiTenancies,
                    ...embeddedTenancies,
                ]);

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

                    customer,

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
                    customerResponse:
                        customerResult?.response ??
                        null,

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

        const result =
            await handleRequest(
                bookingApi.resolveCustomer(
                    normalizedId
                ),
                {
                    label:
                        `GET /users/${normalizedId}/resolve`,
                }
            );

        return normalizeResourceResponse(
            result
        );
    },

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

    async restore(id) {
        const normalizedId =
            getId(id);

        if (!normalizedId) {
            return requiredIdResponse(
                "Booking ID is required."
            );
        }

        const result =
            await handleRequest(
                bookingApi.restore(
                    normalizedId
                ),
                {
                    label:
                        `POST /bookings/${normalizedId}/restore`,
                }
            );

        return {
            ...result,

            data:
                normalizeBookingResource(
                    result?.data
                ),
        };
    },

    /*
    |--------------------------------------------------------------------------
    | Force Delete
    |--------------------------------------------------------------------------
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
            ),
            {
                label:
                    `DELETE /bookings/${normalizedId}/force-delete`,
            }
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

    toNumber,
    normalizeMoney,
    normalizeBoolean,

    parseFinancialObject,
    resolveFinancialSource,
    resolveFinancialSources,

    normalizeBookingFinancials,
    normalizeBookingResource,
    normalizeBookingCollection,

    sanitizeBookingUpdatePayload,

    normalizeAvailableUnitsParams,

    extractResource,
    extractCollection,
    normalizeCollectionResponse,
    normalizeResourceResponse,

    getId,
    getCustomerUserId,
    getTenantId,

    extractTenantTenancies,
    uniqueById,
};

export default bookingService;