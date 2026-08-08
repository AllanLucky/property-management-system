import { memo, useMemo } from "react";
import {
  Building2,
  CheckCircle2,
  Wrench,
  CalendarClock,
  Home,
  DoorOpen,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
| IMPORTANT:
| Keep this component OUTSIDE UnitStats.
|--------------------------------------------------------------------------
*/
const StatCard = memo(
  ({
    title,
    value,
    subtitle,
    icon: Icon,
    iconClassName = "",
  }) => {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-500">
              {title}
            </p>

            <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
              {value}
            </h3>

            {subtitle && (
              <p className="mt-1 text-xs text-gray-500">
                {subtitle}
              </p>
            )}
          </div>

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 ${iconClassName}`}
          >
            <Icon className="h-5 w-5" />
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
  | Normalize units
  |--------------------------------------------------------------------------
  */
  const normalizedUnits = useMemo(() => {
    return Array.isArray(units) ? units : [];
  }, [units]);

  /*
  |--------------------------------------------------------------------------
  | Calculate statistics
  |--------------------------------------------------------------------------
  */
  const stats = useMemo(() => {
    const total = normalizedUnits.length;

    let vacant = 0;
    let occupied = 0;
    let maintenance = 0;
    let reserved = 0;

    normalizedUnits.forEach((unit) => {
      const status =
        typeof unit?.status === "object"
          ? unit?.status?.value
          : unit?.status;

      switch (String(status || "").toLowerCase()) {
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
        ? Number(((occupied / total) * 100).toFixed(1))
        : 0;

    return {
      total,
      vacant,
      occupied,
      maintenance,
      reserved,
      available,
      occupancyRate,
    };
  }, [normalizedUnits]);

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */
  return (
    <div className="space-y-6">
      {/* Main statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total */}
        <StatCard
          title="Total Units"
          value={stats.total.toLocaleString()}
          subtitle="All registered units"
          icon={Building2}
          iconClassName="text-gray-700"
        />

        {/* Vacant */}
        <StatCard
          title="Vacant"
          value={stats.vacant.toLocaleString()}
          subtitle="Available units"
          icon={Home}
          iconClassName="text-green-600"
        />

        {/* Occupied */}
        <StatCard
          title="Occupied"
          value={stats.occupied.toLocaleString()}
          subtitle="Currently occupied"
          icon={CheckCircle2}
          iconClassName="text-blue-600"
        />

        {/* Maintenance */}
        <StatCard
          title="Maintenance"
          value={stats.maintenance.toLocaleString()}
          subtitle="Under maintenance"
          icon={Wrench}
          iconClassName="text-orange-600"
        />

        {/* Reserved */}
        <StatCard
          title="Reserved"
          value={stats.reserved.toLocaleString()}
          subtitle="Reserved units"
          icon={CalendarClock}
          iconClassName="text-purple-600"
        />

        {/* Available */}
        <StatCard
          title="Available"
          value={stats.available.toLocaleString()}
          subtitle="Ready for booking"
          icon={DoorOpen}
          iconClassName="text-emerald-600"
        />
      </div>

      {/* Occupancy overview */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Occupancy Rate
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Percentage of units currently occupied
            </p>
          </div>

          <div className="text-2xl font-bold text-gray-900">
            {stats.occupancyRate}%
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{
              width: `${Math.min(stats.occupancyRate, 100)}%`,
            }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            {stats.occupied.toLocaleString()} occupied
          </span>

          <span>
            {stats.total.toLocaleString()} total
          </span>
        </div>
      </div>
    </div>
  );
};

export default UnitStats;