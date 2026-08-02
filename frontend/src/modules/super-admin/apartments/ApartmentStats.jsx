import {
  Building2,
  Layers3,
  DoorOpen,
  CheckCircle2,
  TrendingUp,
  Activity,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";

const ApartmentStats = ({ stats = {} }) => {
  const cards = [
    {
      title: "Total Apartments",
      value: stats.totalApartments ?? 0,
      icon: Building2,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
    {
      title: "Total Floors",
      value: stats.totalFloors ?? 0,
      icon: Layers3,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      title: "Total Units",
      value: stats.totalUnits ?? 0,
      icon: DoorOpen,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      title: "Active Apartments",
      value: stats.activeApartments ?? 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`group rounded-2xl border ${card.border} bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {card.title}
                </p>

                <h2 className="mt-3 text-4xl font-bold text-gray-900">
                  {card.value}
                </h2>
              </div>

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl ${card.bg}`}
              >
                <Icon
                  className={`h-7 w-7 ${card.color} transition-transform duration-300 group-hover:scale-110`}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>Updated</span>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Activity className="h-3.5 w-3.5" />
                Live Data
              </div>
            </div>
          </div>
        );
      })}
            <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Building Features
            </p>

            <h3 className="mt-2 text-lg font-semibold text-gray-900">
              Amenities Summary
            </h3>

            <div className="mt-5 space-y-4">

              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  Elevators
                </span>

                <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                  {stats.elevators ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  Parking
                </span>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                  {stats.parking ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  Security
                </span>

                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                  {stats.security ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  Backup Generators
                </span>

                <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                  {stats.generators ?? 0}
                </span>
              </div>

            </div>
          </div>

          <div className="rounded-xl bg-amber-50 p-3">
            <BarChart3 className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Overall Building Health
            </span>

            <div className="flex items-center gap-1 font-semibold text-green-600">
              Excellent
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApartmentStats;