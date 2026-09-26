
import {
    AlertCircle,
    CalendarDays,
    CircleDollarSign,
    Clock3,
    CreditCard,
    RefreshCw,
    TrendingDown,
    UsersRound,
    XCircle,
} from "lucide-react";
import { useMemo } from "react";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const toNumber = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        maximumFractionDigits: 0,
    }).format(toNumber(value));
};

const formatNumber = (value) => {
    return new Intl.NumberFormat("en-KE").format(
        toNumber(value)
    );
};

const safeArray = (value) => {
    if (Array.isArray(value)) {
        return value;
    }

    if (Array.isArray(value?.data)) {
        return value.data;
    }

    return [];
};

const getFinancials = (booking) => {
    return (
        booking?.financials ||
        booking?.finance ||
        {}
    );
};

const getTotalAmount = (booking) => {
    const financials =
        getFinancials(booking);

    return toNumber(
        financials.total_amount ??
            financials.total ??
            booking?.total_amount ??
            booking?.total ??
            0
    );
};

const getPaidAmount = (booking) => {
    const financials =
        getFinancials(booking);

    return toNumber(
        financials.amount_paid ??
            financials.paid ??
            booking?.amount_paid ??
            booking?.paid ??
            0
    );
};

const getBalanceAmount = (booking) => {
    const financials =
        getFinancials(booking);

    if (
        financials.balance !==
            undefined &&
        financials.balance !== null
    ) {
        return toNumber(
            financials.balance
        );
    }

    if (
        booking?.balance !==
            undefined &&
        booking?.balance !== null
    ) {
        return toNumber(
            booking.balance
        );
    }

    return Math.max(
        getTotalAmount(booking) -
            getPaidAmount(booking),
        0
    );
};

const getPaymentStatus = (booking) => {
    const financials =
        getFinancials(booking);

    return String(
        booking?.payment_status ??
            booking?.paymentStatus ??
            financials.payment_status ??
            "pending"
    ).toLowerCase();
};

const getCancellationDate = (booking) => {
    return (
        booking?.cancelled_at ||
        booking?.cancellation_date ||
        null
    );
};

const formatDate = (value) => {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
};

/*
|--------------------------------------------------------------------------
| Statistic Card
|--------------------------------------------------------------------------
*/

const StatisticCard = ({
    title,
    value,
    description,
    icon: Icon,
    iconWrapperClassName,
    valueClassName = "text-slate-900",
}) => {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p
                        className={[
                            "mt-2 truncate text-2xl font-bold",
                            valueClassName,
                        ].join(" ")}
                    >
                        {value}
                    </p>

                    {description && (
                        <p className="mt-1 text-xs text-slate-500">
                            {description}
                        </p>
                    )}
                </div>

                <div
                    className={[
                        "flex h-11 w-11 shrink-0 items-center",
                        "justify-center rounded-xl",
                        iconWrapperClassName ||
                            "bg-slate-100 text-slate-600",
                    ].join(" ")}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
};

/*
|--------------------------------------------------------------------------
| Payment Distribution
|--------------------------------------------------------------------------
*/

const PaymentDistribution = ({
    statistics,
}) => {
    const paymentStatuses = [
        {
            key: "paid",
            label: "Paid",
            count: statistics.paidCount,
            amount: statistics.paidAmount,
            className:
                "bg-emerald-500",
            badgeClassName:
                "bg-emerald-50 text-emerald-700 ring-emerald-200",
        },
        {
            key: "partial",
            label: "Partial",
            count: statistics.partialCount,
            amount: statistics.partialAmount,
            className:
                "bg-amber-500",
            badgeClassName:
                "bg-amber-50 text-amber-700 ring-amber-200",
        },
        {
            key: "pending",
            label: "Pending",
            count: statistics.pendingCount,
            amount: statistics.pendingAmount,
            className:
                "bg-slate-400",
            badgeClassName:
                "bg-slate-50 text-slate-700 ring-slate-200",
        },
        {
            key: "failed",
            label: "Failed",
            count: statistics.failedCount,
            amount: statistics.failedAmount,
            className:
                "bg-red-500",
            badgeClassName:
                "bg-red-50 text-red-700 ring-red-200",
        },
        {
            key: "refunded",
            label: "Refunded",
            count: statistics.refundedCount,
            amount: statistics.refundedAmount,
            className:
                "bg-purple-500",
            badgeClassName:
                "bg-purple-50 text-purple-700 ring-purple-200",
        },
    ];

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <CreditCard className="h-4 w-4" />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                            Payment Distribution
                        </h3>

                        <p className="mt-0.5 text-xs text-slate-500">
                            Payment status across cancelled
                            bookings.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className="space-y-4">
                    {paymentStatuses.map(
                        (item) => (
                            <div
                                key={item.key}
                                className="space-y-2"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={[
                                                "h-2.5 w-2.5 rounded-full",
                                                item.className,
                                            ].join(
                                                " "
                                            )}
                                        />

                                        <span className="text-sm font-medium text-slate-700">
                                            {
                                                item.label
                                            }
                                        </span>
                                    </div>

                                    <span
                                        className={[
                                            "inline-flex items-center rounded-full",
                                            "px-2 py-0.5 text-xs font-semibold",
                                            "ring-1 ring-inset",
                                            item.badgeClassName,
                                        ].join(
                                            " "
                                        )}
                                    >
                                        {formatNumber(
                                            item.count
                                        )}
                                    </span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className={[
                                            "h-full rounded-full transition-all",
                                            item.className,
                                        ].join(
                                            " "
                                        )}
                                        style={{
                                            width: `${Math.min(
                                                item.count /
                                                    Math.max(
                                                        statistics.totalBookings,
                                                        1
                                                    ) *
                                                    100,
                                                100
                                            )}%`,
                                        }}
                                    />
                                </div>

                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>
                                        {
                                            item.count
                                        }{" "}
                                        booking
                                        {item.count ===
                                        1
                                            ? ""
                                            : "s"}
                                    </span>

                                    <span className="font-medium text-slate-600">
                                        {formatCurrency(
                                            item.amount
                                        )}
                                    </span>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

/*
|--------------------------------------------------------------------------
| Cancellation Summary
|--------------------------------------------------------------------------
*/

const CancellationSummary = ({
    statistics,
}) => {
    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <XCircle className="h-4 w-4" />
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                            Cancellation Summary
                        </h3>

                        <p className="mt-0.5 text-xs text-slate-500">
                            Overview of cancelled booking
                            activity.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                            <CalendarDays className="h-4 w-4" />

                            <span className="text-xs font-semibold uppercase tracking-wide">
                                First Cancellation
                            </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-900">
                            {formatDate(
                                statistics.firstCancellation
                            )}
                        </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                            <CalendarDays className="h-4 w-4" />

                            <span className="text-xs font-semibold uppercase tracking-wide">
                                Latest Cancellation
                            </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-900">
                            {formatDate(
                                statistics.latestCancellation
                            )}
                        </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                            <CircleDollarSign className="h-4 w-4" />

                            <span className="text-xs font-semibold uppercase tracking-wide">
                                Average Booking Value
                            </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-900">
                            {formatCurrency(
                                statistics.averageBookingValue
                            )}
                        </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                            <TrendingDown className="h-4 w-4" />

                            <span className="text-xs font-semibold uppercase tracking-wide">
                                Average Paid
                            </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-900">
                            {formatCurrency(
                                statistics.averagePaid
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

export default function CancelledBookingStatistics({
    bookings = [],
    statistics: apiStatistics = null,
    loading = false,
    error = null,
    onRefresh,
    compact = false,
}) {
    /*
    |--------------------------------------------------------------------------
    | Normalize Data
    |--------------------------------------------------------------------------
    */

    const normalizedBookings = useMemo(
        () => safeArray(bookings),
        [bookings]
    );

    /*
    |--------------------------------------------------------------------------
    | Calculate Statistics
    |--------------------------------------------------------------------------
    */

    const calculated = useMemo(() => {
        const result = {
            totalBookings:
                normalizedBookings.length,

            totalAmount: 0,
            totalPaid: 0,
            totalBalance: 0,

            paidCount: 0,
            partialCount: 0,
            pendingCount: 0,
            failedCount: 0,
            refundedCount: 0,

            paidAmount: 0,
            partialAmount: 0,
            pendingAmount: 0,
            failedAmount: 0,
            refundedAmount: 0,

            firstCancellation: null,
            latestCancellation: null,

            averageBookingValue: 0,
            averagePaid: 0,

            uniqueCustomers: 0,
        };

        const customerIds =
            new Set();

        normalizedBookings.forEach(
            (booking) => {
                const total =
                    getTotalAmount(
                        booking
                    );

                const paid =
                    getPaidAmount(
                        booking
                    );

                const balance =
                    getBalanceAmount(
                        booking
                    );

                const status =
                    getPaymentStatus(
                        booking
                    );

                const cancelledDate =
                    getCancellationDate(
                        booking
                    );

                result.totalAmount +=
                    total;

                result.totalPaid +=
                    paid;

                result.totalBalance +=
                    balance;

                if (status === "paid") {
                    result.paidCount += 1;
                    result.paidAmount +=
                        total;
                } else if (
                    status === "partial"
                ) {
                    result.partialCount +=
                        1;
                    result.partialAmount +=
                        total;
                } else if (
                    status === "failed"
                ) {
                    result.failedCount +=
                        1;
                    result.failedAmount +=
                        total;
                } else if (
                    status === "refunded"
                ) {
                    result.refundedCount +=
                        1;
                    result.refundedAmount +=
                        total;
                } else {
                    result.pendingCount +=
                        1;
                    result.pendingAmount +=
                        total;
                }

                const customerId =
                    booking?.customer_id ??
                    booking?.customer?.id ??
                    booking?.customer_user?.id ??
                    booking?.user_id ??
                    booking?.user?.id;

                if (
                    customerId !==
                        null &&
                    customerId !==
                        undefined &&
                    customerId !== ""
                ) {
                    customerIds.add(
                        String(
                            customerId
                        )
                    );
                }

                if (cancelledDate) {
                    const timestamp =
                        new Date(
                            cancelledDate
                        ).getTime();

                    if (
                        !Number.isNaN(
                            timestamp
                        )
                    ) {
                        if (
                            !result.firstCancellation ||
                            timestamp <
                                new Date(
                                    result.firstCancellation
                                ).getTime()
                        ) {
                            result.firstCancellation =
                                cancelledDate;
                        }

                        if (
                            !result.latestCancellation ||
                            timestamp >
                                new Date(
                                    result.latestCancellation
                                ).getTime()
                        ) {
                            result.latestCancellation =
                                cancelledDate;
                        }
                    }
                }
            }
        );

        result.averageBookingValue =
            result.totalBookings >
            0
                ? result.totalAmount /
                  result.totalBookings
                : 0;

        result.averagePaid =
            result.totalBookings >
            0
                ? result.totalPaid /
                  result.totalBookings
                : 0;

        result.uniqueCustomers =
            customerIds.size;

        return result;
    }, [normalizedBookings]);

    /*
    |--------------------------------------------------------------------------
    | Merge API Statistics
    |--------------------------------------------------------------------------
    */

    const mergedStatistics = useMemo(() => {
        const source =
            apiStatistics?.statistics ||
            apiStatistics?.summary ||
            apiStatistics ||
            {};

        const totalBookings = toNumber(
            source.cancelled ??
                source.total_cancelled ??
                source.total ??
                calculated.totalBookings
        );

        const totalAmount = toNumber(
            source.total_amount ??
                source.cancelled_amount ??
                calculated.totalAmount
        );

        const totalPaid = toNumber(
            source.total_paid ??
                source.cancelled_paid ??
                calculated.totalPaid
        );

        const totalBalance = toNumber(
            source.total_balance ??
                source.cancelled_balance ??
                calculated.totalBalance
        );

        return {
            ...calculated,

            totalBookings:
                totalBookings ||
                calculated.totalBookings,

            totalAmount:
                totalAmount ||
                calculated.totalAmount,

            totalPaid:
                totalPaid ||
                calculated.totalPaid,

            totalBalance:
                totalBalance ||
                calculated.totalBalance,

            uniqueCustomers:
                toNumber(
                    source.unique_customers ??
                        source.uniqueCustomers ??
                        calculated.uniqueCustomers
                ) ||
                calculated.uniqueCustomers,
        };
    }, [
        apiStatistics,
        calculated,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Loading State
    |--------------------------------------------------------------------------
    */

    if (
        loading &&
        normalizedBookings.length === 0
    ) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({
                        length: 4,
                    }).map(
                        (_, index) => (
                            <div
                                key={index}
                                className="h-[132px] animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex justify-between">
                                    <div className="space-y-3">
                                        <div className="h-4 w-28 rounded bg-slate-200" />
                                        <div className="h-7 w-36 rounded bg-slate-200" />
                                        <div className="h-3 w-24 rounded bg-slate-100" />
                                    </div>

                                    <div className="h-11 w-11 rounded-xl bg-slate-100" />
                                </div>
                            </div>
                        )
                    )}
                </div>

                {!compact && (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <div className="h-[400px] animate-pulse rounded-xl border border-slate-200 bg-white" />

                        <div className="h-[400px] animate-pulse rounded-xl border border-slate-200 bg-white" />
                    </div>
                )}
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Error State
    |--------------------------------------------------------------------------
    */

    if (
        error &&
        normalizedBookings.length === 0
    ) {
        const message =
            typeof error === "string"
                ? error
                : error?.message ||
                  "Unable to load cancelled booking statistics.";

        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-red-800">
                            Statistics unavailable
                        </h3>

                        <p className="mt-1 text-sm text-red-700">
                            {message}
                        </p>

                        {typeof onRefresh ===
                            "function" && (
                            <button
                                type="button"
                                onClick={
                                    onRefresh
                                }
                                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Try Again
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Compact Statistics
    |--------------------------------------------------------------------------
    */

    if (compact) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatisticCard
                    title="Cancelled"
                    value={formatNumber(
                        mergedStatistics.totalBookings
                    )}
                    description="Cancelled bookings"
                    icon={XCircle}
                    iconWrapperClassName="bg-red-50 text-red-600"
                    valueClassName="text-slate-900"
                />

                <StatisticCard
                    title="Total Value"
                    value={formatCurrency(
                        mergedStatistics.totalAmount
                    )}
                    description="Booking value"
                    icon={CircleDollarSign}
                    iconWrapperClassName="bg-indigo-50 text-indigo-600"
                    valueClassName="text-slate-900"
                />

                <StatisticCard
                    title="Amount Paid"
                    value={formatCurrency(
                        mergedStatistics.totalPaid
                    )}
                    description="Payments received"
                    icon={CreditCard}
                    iconWrapperClassName="bg-emerald-50 text-emerald-600"
                    valueClassName="text-emerald-700"
                />

                <StatisticCard
                    title="Outstanding"
                    value={formatCurrency(
                        mergedStatistics.totalBalance
                    )}
                    description="Remaining balance"
                    icon={Clock3}
                    iconWrapperClassName="bg-amber-50 text-amber-600"
                    valueClassName="text-amber-700"
                />
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Full Statistics
    |--------------------------------------------------------------------------
    */

    return (
        <div className="space-y-5">
            {/* Main Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatisticCard
                    title="Cancelled Bookings"
                    value={formatNumber(
                        mergedStatistics.totalBookings
                    )}
                    description="Total cancelled bookings"
                    icon={XCircle}
                    iconWrapperClassName="bg-red-50 text-red-600"
                />

                <StatisticCard
                    title="Total Booking Value"
                    value={formatCurrency(
                        mergedStatistics.totalAmount
                    )}
                    description="Value of cancelled bookings"
                    icon={CircleDollarSign}
                    iconWrapperClassName="bg-indigo-50 text-indigo-600"
                />

                <StatisticCard
                    title="Amount Paid"
                    value={formatCurrency(
                        mergedStatistics.totalPaid
                    )}
                    description={`${formatNumber(
                        mergedStatistics.paidCount
                    )} fully paid booking${
                        mergedStatistics.paidCount ===
                        1
                            ? ""
                            : "s"
                    }`}
                    icon={CreditCard}
                    iconWrapperClassName="bg-emerald-50 text-emerald-600"
                    valueClassName="text-emerald-700"
                />

                <StatisticCard
                    title="Outstanding Balance"
                    value={formatCurrency(
                        mergedStatistics.totalBalance
                    )}
                    description={`${formatNumber(
                        mergedStatistics.partialCount +
                            mergedStatistics.pendingCount
                    )} booking${
                        mergedStatistics.partialCount +
                            mergedStatistics.pendingCount ===
                        1
                            ? ""
                            : "s"
                    } with balance`}
                    icon={Clock3}
                    iconWrapperClassName="bg-amber-50 text-amber-600"
                    valueClassName="text-amber-700"
                />
            </div>

            {/* Secondary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatisticCard
                    title="Customers"
                    value={formatNumber(
                        mergedStatistics.uniqueCustomers
                    )}
                    description="Unique customers affected"
                    icon={UsersRound}
                    iconWrapperClassName="bg-slate-100 text-slate-600"
                />

                <StatisticCard
                    title="Average Booking"
                    value={formatCurrency(
                        mergedStatistics.averageBookingValue
                    )}
                    description="Average cancelled booking value"
                    icon={CircleDollarSign}
                    iconWrapperClassName="bg-slate-100 text-slate-600"
                />

                <StatisticCard
                    title="Average Paid"
                    value={formatCurrency(
                        mergedStatistics.averagePaid
                    )}
                    description="Average amount received"
                    icon={CreditCard}
                    iconWrapperClassName="bg-slate-100 text-slate-600"
                />

                <StatisticCard
                    title="Latest Cancellation"
                    value={formatDate(
                        mergedStatistics.latestCancellation
                    )}
                    description="Most recent cancellation"
                    icon={CalendarDays}
                    iconWrapperClassName="bg-red-50 text-red-600"
                />
            </div>

            {/* Detail Panels */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <PaymentDistribution
                    statistics={
                        mergedStatistics
                    }
                />

                <CancellationSummary
                    statistics={
                        mergedStatistics
                    }
                />
            </div>

            {/* Refresh */}
            {typeof onRefresh ===
                "function" && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={
                            onRefresh
                        }
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            className={[
                                "h-4 w-4",
                                loading
                                    ? "animate-spin"
                                    : "",
                            ].join(
                                " "
                            )}
                        />
                        Refresh Statistics
                    </button>
                </div>
            )}
        </div>
    );
}

