
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
        trend,
        trendLabel,
    }) => {
        return (
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md">
                {/* Decorative background */}
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gray-50 opacity-70 transition-transform duration-300 group-hover:scale-125" />

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
                            <Icon
                                className={`h-5 w-5 ${iconClassName}`}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between gap-2">
                        {subtitle && (
                            <p className="truncate text-xs font-medium text-gray-500">
                                {subtitle}
                            </p>
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
| UNIT STATS
|--------------------------------------------------------------------------
*/

const UnitStats = ({ units = [] }) => {
    /*
    |--------------------------------------------------------------------------
    | Normalize Units
    |--------------------------------------------------------------------------
    */

    const normalizedUnits = useMemo(() => {
        return Array.isArray(units) ? units : [];
    }, [units]);

    /*
    |--------------------------------------------------------------------------
    | Calculate Statistics
    |--------------------------------------------------------------------------
    */

    const stats = useMemo(() => {
        const total = normalizedUnits.length;

        let vacant = 0;
        let occupied = 0;
        let maintenance = 0;
        let reserved = 0;

        normalizedUnits.forEach((unit) => {
            const rawStatus =
                typeof unit?.status === "object"
                    ? unit?.status?.value ??
                      unit?.status?.current ??
                      unit?.status?.name
                    : unit?.status;

            const status = String(
                rawStatus || ""
            ).toLowerCase();

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

        const available = vacant;

        const occupancyRate =
            total > 0
                ? Number(
                      (
                          (occupied / total) *
                          100
                      ).toFixed(1)
                  )
                : 0;

        const vacancyRate =
            total > 0
                ? Number(
                      (
                          (vacant / total) *
                          100
                      ).toFixed(1)
                  )
                : 0;

        return {
            total,
            vacant,
            occupied,
            maintenance,
            reserved,
            available,
            occupancyRate,
            vacancyRate,
        };
    }, [normalizedUnits]);

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div className="space-y-6">
            {/* ------------------------------------------------------------ */}
            {/* Statistics Cards */}
            {/* ------------------------------------------------------------ */}

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

            {/* ------------------------------------------------------------ */}
            {/* Occupancy Overview */}
            {/* ------------------------------------------------------------ */}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="p-5 sm:p-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
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

                                <p className="mt-0.5 text-2xl font-bold text-gray-900">
                                    {stats.occupancyRate}%
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-6">
                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-700 ease-out"
                                style={{
                                    width: `${Math.min(
                                        stats.occupancyRate,
                                        100
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                                </div>

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                                    <Home className="h-4 w-4 text-emerald-600" />
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
                                </div>

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                                    <Wrench className="h-4 w-4 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-5 flex flex-col gap-2 border-t border-gray-100 pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-gray-500">
                            <span className="h-2 w-2 rounded-full bg-indigo-500" />

                            <span>
                                {stats.occupied.toLocaleString()} of{" "}
                                {stats.total.toLocaleString()} units occupied
                            </span>
                        </div>

                        <div className="font-medium text-gray-600">
                            {stats.vacancyRate}% vacancy rate
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnitStats;

