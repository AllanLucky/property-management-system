import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = [
  "#4F46E5",
  "#EC4899",
  "#10B981",
  "#F59E0B",
  "#EF4444",
];

const PropertyAnalyticsCharts = ({ data = [] }) => {
  const occupancyData = data.map((item) => ({
    name: item.name,
    Occupied: item.occupied,
    Vacant: item.vacant,
  }));

  const pieData = [
    {
      name: "Views",
      value: data.reduce((sum, item) => sum + (item.views || 0), 0),
    },
    {
      name: "Favorites",
      value: data.reduce((sum, item) => sum + (item.favorites || 0), 0),
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-2">

      {/* =======================================================
          Views & Favorites
      ======================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Property Views vs Favorites
        </h2>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="name"
              angle={-20}
              textAnchor="end"
              interval={0}
              height={70}
            />

            <YAxis />

            <Tooltip />

            <Legend />

            <Bar
              dataKey="views"
              fill="#4F46E5"
              radius={[5, 5, 0, 0]}
            />

            <Bar
              dataKey="favorites"
              fill="#EC4899"
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* =======================================================
          Rating Trend
      ======================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Property Ratings
        </h2>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="name"
              angle={-20}
              textAnchor="end"
              interval={0}
              height={70}
            />

            <YAxis domain={[0, 5]} />

            <Tooltip />

            <Legend />

            <Line
              type="monotone"
              dataKey="rating"
              stroke="#F59E0B"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* =======================================================
          Occupancy
      ======================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Occupancy Overview
        </h2>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={occupancyData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="name"
              angle={-20}
              textAnchor="end"
              interval={0}
              height={70}
            />

            <YAxis />

            <Tooltip />

            <Legend />

            <Bar
              dataKey="Occupied"
              fill="#10B981"
              radius={[5, 5, 0, 0]}
            />

            <Bar
              dataKey="Vacant"
              fill="#EF4444"
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* =======================================================
          Pie Chart
      ======================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Engagement Distribution
        </h2>

        <ResponsiveContainer width="100%" height={320}>
          <PieChart>

            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />

            <Legend />

          </PieChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default PropertyAnalyticsCharts;