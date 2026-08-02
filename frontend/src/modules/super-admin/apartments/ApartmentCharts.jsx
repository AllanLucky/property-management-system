import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "#4F46E5",
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
];

const ApartmentCharts = ({ data = [] }) => {
  const featureData = [
    {
      name: "Elevators",
      value: data.filter((item) => item.elevator).length,
    },
    {
      name: "Parking",
      value: data.filter((item) => item.parking).length,
    },
    {
      name: "Security",
      value: data.filter((item) => item.security).length,
    },
    {
      name: "Generators",
      value: data.filter((item) => item.generator).length,
    },
  ];

  if (!data.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
        <h3 className="text-lg font-semibold text-gray-700">
          No Chart Data Available
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Apartment charts will appear once apartments are loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">

      {/* ==========================================
          Floors & Units Bar Chart
      ========================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Floors vs Units
        </h2>

        <ResponsiveContainer
          width="100%"
          height={320}
        >
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Legend />

            <Bar
              dataKey="floors"
              fill="#4F46E5"
              radius={[6, 6, 0, 0]}
            />

            <Bar
              dataKey="units"
              fill="#10B981"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

      </div>
            {/* ==========================================
          Apartment Features Pie Chart
      ========================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Apartment Features
        </h2>

        <ResponsiveContainer
          width="100%"
          height={320}
        >
          <PieChart>

            <Pie
              data={featureData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={50}
              paddingAngle={5}
              label
            >
              {featureData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />

            <Legend />

          </PieChart>
        </ResponsiveContainer>

        {/* Feature Summary */}

        <div className="mt-6 grid grid-cols-2 gap-4">

          {featureData.map((feature, index) => (
            <div
              key={feature.name}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <div className="flex items-center gap-3">

                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor:
                      COLORS[index % COLORS.length],
                  }}
                />

                <span className="text-sm font-medium text-gray-700">
                  {feature.name}
                </span>

              </div>

              <span className="rounded-full bg-white px-2 py-1 text-sm font-semibold text-gray-800 shadow-sm">
                {feature.value}
              </span>
            </div>
          ))}

        </div>

      </div>

    </div>
  );
};

export default ApartmentCharts;