import {
  Building2,
  Eye,
  Heart,
  Star,
  Home,
  DoorOpen,
} from "lucide-react";

const PropertyAnalyticsStats = ({ stats }) => {
  const cards = [
    {
      title: "Total Properties",
      value: stats?.totalProperties ?? 0,
      icon: Building2,
      bg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      border: "border-indigo-100",
    },
    {
      title: "Total Views",
      value: (stats?.totalViews ?? 0).toLocaleString(),
      icon: Eye,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      border: "border-blue-100",
    },
    {
      title: "Favorites",
      value: (stats?.totalFavorites ?? 0).toLocaleString(),
      icon: Heart,
      bg: "bg-pink-50",
      iconColor: "text-pink-600",
      border: "border-pink-100",
    },
    {
      title: "Average Rating",
      value: stats?.avgRating ?? 0,
      icon: Star,
      bg: "bg-yellow-50",
      iconColor: "text-yellow-600",
      border: "border-yellow-100",
    },
    {
      title: "Occupied Units",
      value: stats?.totalOccupied ?? 0,
      icon: Home,
      bg: "bg-green-50",
      iconColor: "text-green-600",
      border: "border-green-100",
    },
    {
      title: "Vacant Units",
      value: stats?.totalVacant ?? 0,
      icon: DoorOpen,
      bg: "bg-red-50",
      iconColor: "text-red-600",
      border: "border-red-100",
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`rounded-xl border ${card.border} bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {card.title}
                </p>

                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  {card.value}
                </h2>
              </div>

              <div
                className={`rounded-full p-4 ${card.bg}`}
              >
                <Icon
                  className={`h-7 w-7 ${card.iconColor}`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PropertyAnalyticsStats;