
import { memo, useMemo } from "react";

import {
    Building2,
    CheckCircle2,
    Wrench,
    CalendarClock,
    Home,
    DoorOpen,
    TrendingUp,
    TrendingDown,
    CircleHelp,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
| Keep this component OUTSIDE UnitStats.
|--------------------------------------------------------------------------
*/

const StatCard = memo(
    ({
        title,
        value,
        subtitle,
        icon: Icon,
        iconWrapperClassName = "",
        iconClassName = "",
        valueClassName = "text-gray-900",
        trend = null,
        trendLabel = "",
    }) => {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                {/* Decorative background */}
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gray-50 opacity-70" />

                <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-500">
                                {title}
                            </p>

                            <h3
                                className={`mt-2 text-3xl font-bold tracking-tight ${valueClassName}`}
                            >
                                {value}
                            </h3>
                        </div>

                        {/* Icon */}
                        <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconWrapperClassName}`}
                        >
                            {Icon && (
                                <Icon
                                    className={`h-5 w-5 ${iconClassName}`}
                                />
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex min-h-[24px] items-center justify-between gap-2">
                        {subtitle ? (
                            <p className="truncate text-xs font-medium text-gray-500">
                                {subtitle}
                            </p>
                        ) : (
                            <span />
                        )}

                        {trend && (
                            <div
                                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                                    trend === "up"
                                        ? "bg-green-50 text-green-700"
                                        : "bg-red-50 text-red-700"
                                }`}
                            >
                                {trend === "up" ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : (
                                    <TrendingDown className="h-3 w-3" />
                                )}

                                {trendLabel}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
);

StatCard.displayName = "StatCard";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Normalize status values returned by Laravel resources.
 *
 * Supports:
 *
 * "vacant"
 *
 * {
 *     value: "vacant",
 *     label: "Vacant"
 * }
 *
 * {
 *     value: "vacant",
 *     is_active: true
 * }
 */
const normalizeStatus = (value) => {
    if (value === null || value === undefined) {
        return "";
    }

    if (typeof value === "object") {
        return String(
            value?.value ??
                value?.current ??
                value?.name ??
                value?.status ??
                ""
        )
            .trim()
            .toLowerCase();
    }

    return String(value).trim().toLowerCase();
};

/**
 * Normalize possible API collection responses.
 *
 * Supports:
 *
 * []
 * { data: [] }
 * { data: { data: [] } }
 * { results: [] }
 * { items: [] }
 */
const normalizeUnitsCollection = (response) => {
    if (!response) {
        return [];
    }

    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.data?.data)) {
        return response.data.data;
    }

    if (Array.isArray(response?.results)) {
        return response.results;
    }

    if (Array.isArray(response?.items)) {
        return response.items;
    }

    return [];
};

/*
|--------------------------------------------------------------------------
| UNIT STATS
|--------------------------------------------------------------------------
*/

const UnitStats = ({ units = [] }) => {
    /*
    |--------------------------------------------------------------------------
    | NORMALIZE UNITS
    |--------------------------------------------------------------------------
    */

    const normalizedUnits = useMemo(
        () => normalizeUnitsCollection(units),
        [units]
    );

    /*
    |--------------------------------------------------------------------------
    | CALCULATE STATISTICS
    |--------------------------------------------------------------------------
    */

    const stats = useMemo(() => {
        const total = normalizedUnits.length;

        let vacant = 0;
        let occupied = 0;
        let maintenance = 0;
        let reserved = 0;

        normalizedUnits.forEach((unit) => {
            const status = normalizeStatus(unit?.status);

            switch (status) {
                case "vacant":
                    vacant++;
                    break;

                case "occupied":
                    occupied++;
                    break;

                case "maintenance":
                    maintenance++;
                    break;

                case "reserved":
                    reserved++;
                    break;

                default:
                    break;
            }
        });

        /*
        |--------------------------------------------------------------------------
        | AVAILABLE UNITS
        |--------------------------------------------------------------------------
        |
        | A unit is considered available when its status is vacant.
        |
        */

        const available = vacant;

        /*
        |--------------------------------------------------------------------------
        | UNAVAILABLE UNITS
        |--------------------------------------------------------------------------
        */

        const unavailable =
            occupied + reserved + maintenance;

        /*
        |--------------------------------------------------------------------------
        | PERCENTAGES
        |--------------------------------------------------------------------------
        */

        const occupancyRate =
            total > 0
                ? Number(
                      ((occupied / total) * 100).toFixed(1)
                  )
                : 0;

        const vacancyRate =
            total > 0
                ? Number(
                      ((vacant / total) * 100).toFixed(1)
                  )
                : 0;

        const reservedRate =
            total > 0
                ? Number(
                      ((reserved / total) * 100).toFixed(1)
                  )
                : 0;

        const maintenanceRate =
            total > 0
                ? Number(
                      ((maintenance / total) * 100).toFixed(1)
                  )
                : 0;

        const unavailableRate =
            total > 0
                ? Number(
                      ((unavailable / total) * 100).toFixed(1)
                  )
                : 0;

        return {
            total,
            vacant,
            occupied,
            maintenance,
            reserved,
            available,
            unavailable,
            occupancyRate,
            vacancyRate,
            reservedRate,
            maintenanceRate,
            unavailableRate,
        };
    }, [normalizedUnits]);

    /*
    |--------------------------------------------------------------------------
    | OCCUPANCY TREND
    |--------------------------------------------------------------------------
    */

    const occupancyTrend = useMemo(() => {
        if (stats.total === 0) {
            return {
                type: null,
                label: "No data",
            };
        }

        if (stats.occupancyRate >= 70) {
            return {
                type: "up",
                label: "Healthy",
            };
        }

        if (stats.occupancyRate < 50) {
            return {
                type: "down",
                label: "Low",
            };
        }

        return {
            type: null,
            label: "Moderate",
        };
    }, [stats.occupancyRate, stats.total]);

    /*
    |--------------------------------------------------------------------------
    | PROGRESS WIDTH
    |--------------------------------------------------------------------------
    */

    const occupancyProgress = Math.min(
        Math.max(stats.occupancyRate, 0),
        100
    );

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <div className="space-y-6">
            {/* -------------------------------------------------------- */}
            {/* STATISTICS CARDS */}
            {/* -------------------------------------------------------- */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {/* Total */}
                <StatCard
                    title="Total Units"
                    value={stats.total.toLocaleString()}
                    subtitle="All registered units"
                    icon={Building2}
                    iconWrapperClassName="bg-blue-50"
                    iconClassName="text-blue-600"
                />

                {/* Vacant */}
                <StatCard
                    title="Vacant"
                    value={stats.vacant.toLocaleString()}
                    subtitle="Available units"
                    icon={Home}
                    iconWrapperClassName="bg-emerald-50"
                    iconClassName="text-emerald-600"
                    valueClassName="text-emerald-700"
                />

                {/* Occupied */}
                <StatCard
                    title="Occupied"
                    value={stats.occupied.toLocaleString()}
                    subtitle="Currently occupied"
                    icon={CheckCircle2}
                    iconWrapperClassName="bg-indigo-50"
                    iconClassName="text-indigo-600"
                    valueClassName="text-indigo-700"
                    trend={occupancyTrend.type}
                    trendLabel={occupancyTrend.label}
                />

                {/* Maintenance */}
                <StatCard
                    title="Maintenance"
                    value={stats.maintenance.toLocaleString()}
                    subtitle="Under maintenance"
                    icon={Wrench}
                    iconWrapperClassName="bg-orange-50"
                    iconClassName="text-orange-600"
                    valueClassName="text-orange-700"
                />

                {/* Reserved */}
                <StatCard
                    title="Reserved"
                    value={stats.reserved.toLocaleString()}
                    subtitle="Reserved units"
                    icon={CalendarClock}
                    iconWrapperClassName="bg-purple-50"
                    iconClassName="text-purple-600"
                    valueClassName="text-purple-700"
                />

                {/* Available */}
                <StatCard
                    title="Available"
                    value={stats.available.toLocaleString()}
                    subtitle="Ready for booking"
                    icon={DoorOpen}
                    iconWrapperClassName="bg-teal-50"
                    iconClassName="text-teal-600"
                    valueClassName="text-teal-700"
                />
            </div>

            {/* -------------------------------------------------------- */}
            {/* OCCUPANCY OVERVIEW */}
            {/* -------------------------------------------------------- */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="p-5 sm:p-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                                <TrendingUp className="h-5 w-5 text-indigo-600" />
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-gray-900">
                                    Occupancy Overview
                                </h3>

                                <p className="mt-0.5 text-sm text-gray-500">
                                    Current unit occupancy performance
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Occupancy Rate
                                </p>

                                <div className="mt-0.5 flex items-center justify-end gap-2">
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats.occupancyRate}%
                                    </p>

                                    {occupancyTrend.type === "up" && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-700">
                                            <TrendingUp className="h-3 w-3" />
                                            Healthy
                                        </span>
                                    )}

                                    {occupancyTrend.type === "down" && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">
                                            <TrendingDown className="h-3 w-3" />
                                            Low
                                        </span>
                                    )}

                                    {!occupancyTrend.type &&
                                        stats.total > 0 && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-600">
                                                {occupancyTrend.label}
                                            </span>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-gray-500">
                                Occupied
                            </span>

                            <span className="font-semibold text-gray-700">
                                {stats.occupied.toLocaleString()} of{" "}
                                {stats.total.toLocaleString()}
                            </span>
                        </div>

                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-700 ease-out"
                                style={{
                                    width: `${occupancyProgress}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Occupied */}
                        <div className="rounded-xl bg-indigo-50/70 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-indigo-600">
                                        Occupied
                                    </p>

                                    <p className="mt-1 text-xl font-bold text-indigo-900">
                                        {stats.occupied.toLocaleString()}
                                    </p>

                                    <p className="mt-1 text-[11px] text-indigo-600">
                                        {stats.occupancyRate}% of total
                                    </p>
                                </div>

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                                    <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                                </div>
                            </div>
                        </div>

                        {/* Vacant */}
                        <div className="rounded-xl bg-emerald-50/70 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-emerald-600">
                                        Vacant
                                    </p>

                                    <p className="mt-1 text-xl font-bold text-emerald-900">
                                        {stats.vacant.toLocaleString()}
                                    </p>

                                    <p className="mt-1 text-[11px] text-emerald-600">
                                        {stats.vacancyRate}% of total
                                    </p>
                                </div>

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                                    <Home className="h-4 w-4 text-emerald-600" />
                                </div>
                            </div>
                        </div>

                        {/* Reserved */}
                        <div className="rounded-xl bg-purple-50/70 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-purple-600">
                                        Reserved
                                    </p>

                                    <p className="mt-1 text-xl font-bold text-purple-900">
                                        {stats.reserved.toLocaleString()}
                                    </p>

                                    <p className="mt-1 text-[11px] text-purple-600">
                                        {stats.reservedRate}% of total
                                    </p>
                                </div>

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                                    <CalendarClock className="h-4 w-4 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        {/* Maintenance */}
                        <div className="rounded-xl bg-orange-50/70 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-orange-600">
                                        Maintenance
                                    </p>

                                    <p className="mt-1 text-xl font-bold text-orange-900">
                                        {stats.maintenance.toLocaleString()}
                                    </p>

                                    <p className="mt-1 text-[11px] text-orange-600">
                                        {stats.maintenanceRate}% of total
                                    </p>
                                </div>

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                                    <Wrench className="h-4 w-4 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-500">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-indigo-500" />

                                <span>
                                    {stats.occupied.toLocaleString()} occupied
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                                <span>
                                    {stats.vacant.toLocaleString()} vacant
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-orange-500" />

                                <span>
                                    {stats.maintenance.toLocaleString()}{" "}
                                    maintenance
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-purple-500" />

                                <span>
                                    {stats.reserved.toLocaleString()} reserved
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 font-medium text-gray-600">
                            <CircleHelp className="h-3.5 w-3.5 text-gray-400" />

                            <span>
                                {stats.vacancyRate}% vacancy rate
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

export default UnitStats;

