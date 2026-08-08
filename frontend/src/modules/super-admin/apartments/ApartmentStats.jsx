import {
  Building2,
  Layers3,
  DoorOpen,
  CheckCircle2,
  Home,
  Wrench,
  Users,
  TrendingUp,
  Activity,
  BarChart3,
  ArrowUpRight,
  Car,
  ShieldCheck,
  Zap,
} from "lucide-react";

const ApartmentStats = ({ stats = {} }) => {
  /*
  |--------------------------------------------------------------------------
  | NORMALIZE STATISTICS
  |--------------------------------------------------------------------------
  */

  const totalApartments = Number(stats?.totalApartments ?? 0);
  const totalFloors = Number(stats?.totalFloors ?? 0);
  const totalUnits = Number(stats?.totalUnits ?? 0);
  const activeApartments = Number(stats?.activeApartments ?? 0);

  const occupiedUnits = Number(stats?.occupiedUnits ?? 0);
  const vacantUnits = Number(stats?.vacantUnits ?? 0);
  const maintenanceUnits = Number(stats?.maintenanceUnits ?? 0);

  const occupancyRate = Number(stats?.occupancyRate ?? 0);

  const elevators = Number(stats?.elevators ?? 0);
  const parking = Number(stats?.parking ?? 0);
  const security = Number(stats?.security ?? 0);
  const generators = Number(stats?.generators ?? 0);

  /*
  |--------------------------------------------------------------------------
  | OVERVIEW CARDS
  |--------------------------------------------------------------------------
  */

  const overviewCards = [
    {
      title: "Total Apartments",
      value: totalApartments,
      icon: Building2,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Total Floors",
      value: totalFloors,
      icon: Layers3,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Units",
      value: totalUnits,
      icon: DoorOpen,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Active Apartments",
      value: activeApartments,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | OCCUPANCY CARDS
  |--------------------------------------------------------------------------
  */

  const occupancyCards = [
    {
      title: "Occupied Units",
      value: occupiedUnits,
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Vacant Units",
      value: vacantUnits,
      icon: Home,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Maintenance Units",
      value: maintenanceUnits,
      icon: Wrench,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | BUILDING FEATURES
  |--------------------------------------------------------------------------
  */

  const features = [
    {
      name: "Elevators",
      value: elevators,
      icon: Building2,
    },
    {
      name: "Parking",
      value: parking,
      icon: Car,
    },
    {
      name: "Security",
      value: security,
      icon: ShieldCheck,
    },
    {
      name: "Generators",
      value: generators,
      icon: Zap,
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">

      {/* ================================================================
          OVERVIEW STATISTICS
      ================================================================= */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {overviewCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="
                group
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-6
                shadow-sm
                transition
                hover:-translate-y-1
                hover:shadow-xl
              "
            >
              <div className="flex items-start justify-between">

                <div>
                  <p className="
                    text-sm
                    font-medium
                    text-gray-500
                  ">
                    {card.title}
                  </p>

                  <h2 className="
                    mt-3
                    text-4xl
                    font-bold
                    text-gray-900
                  ">
                    {card.value.toLocaleString()}
                  </h2>
                </div>

                <div className={`
                  rounded-xl
                  p-4
                  ${card.bg}
                `}>
                  <Icon
                    className={`
                      h-7
                      w-7
                      ${card.color}
                    `}
                  />
                </div>

              </div>

              <div className="
                mt-6
                flex
                justify-between
                border-t
                border-gray-100
                pt-4
                text-sm
              ">

                <span className="
                  flex
                  items-center
                  gap-2
                  text-green-600
                ">
                  <TrendingUp className="h-4 w-4" />
                  Updated
                </span>

                <span className="
                  flex
                  items-center
                  gap-1
                  text-gray-400
                ">
                  <Activity className="h-4 w-4" />
                  Live Data
                </span>

              </div>
            </div>
          );
        })}

      </div>

      {/* ================================================================
          OCCUPANCY ANALYTICS
      ================================================================= */}

      <div className="
        grid
        gap-6
        md:grid-cols-2
        xl:grid-cols-4
      ">

        {occupancyCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-5
                shadow-sm
                transition
                hover:-translate-y-1
                hover:shadow-md
              "
            >

              <div className="
                flex
                items-center
                justify-between
              ">

                <div>
                  <p className="
                    text-sm
                    font-medium
                    text-gray-500
                  ">
                    {card.title}
                  </p>

                  <h3 className="
                    mt-2
                    text-3xl
                    font-bold
                    text-gray-900
                  ">
                    {card.value}
                  </h3>
                </div>

                <div className={`
                  rounded-xl
                  p-3
                  ${card.bg}
                `}>
                  <Icon
                    className={`
                      h-6
                      w-6
                      ${card.color}
                    `}
                  />
                </div>

              </div>

              {/* Occupancy progress bar */}

              {card.title === "Occupancy Rate" && (
                <div className="mt-5">

                  <div className="
                    h-2
                    w-full
                    overflow-hidden
                    rounded-full
                    bg-gray-100
                  ">
                    <div
                      className="
                        h-full
                        rounded-full
                        bg-purple-500
                        transition-all
                        duration-500
                      "
                      style={{
                        width: `${Math.min(
                          Math.max(occupancyRate, 0),
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="
                    mt-2
                    flex
                    justify-between
                    text-xs
                    text-gray-500
                  ">
                    <span>
                      {occupiedUnits.toLocaleString()} occupied
                    </span>

                    <span>
                      {totalUnits.toLocaleString()} total
                    </span>
                  </div>

                </div>
              )}

            </div>
          );
        })}

      </div>

      {/* ================================================================
          UNIT STATUS SUMMARY
      ================================================================= */}

      <div className="
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-6
        shadow-sm
      ">

        <div className="
          flex
          items-center
          justify-between
        ">

          <div>
            <p className="
              text-sm
              font-medium
              text-gray-500
            ">
              Unit Status
            </p>

            <h3 className="
              text-xl
              font-bold
              text-gray-900
            ">
              Occupancy Summary
            </h3>
          </div>

          <div className="
            rounded-xl
            bg-purple-50
            p-3
          ">
            <TrendingUp className="
              h-7
              w-7
              text-purple-600
            " />
          </div>

        </div>

        <div className="
          mt-6
          grid
          gap-4
          md:grid-cols-3
        ">

          {/* Occupied */}

          <div className="
            rounded-xl
            border
            border-green-100
            bg-green-50
            p-4
          ">
            <div className="
              flex
              items-center
              justify-between
            ">

              <div>
                <p className="
                  text-sm
                  font-medium
                  text-green-700
                ">
                  Occupied
                </p>

                <p className="
                  mt-1
                  text-2xl
                  font-bold
                  text-green-800
                ">
                  {occupiedUnits.toLocaleString()}
                </p>
              </div>

              <Users className="
                h-6
                w-6
                text-green-600
              " />

            </div>
          </div>

          {/* Vacant */}

          <div className="
            rounded-xl
            border
            border-blue-100
            bg-blue-50
            p-4
          ">
            <div className="
              flex
              items-center
              justify-between
            ">

              <div>
                <p className="
                  text-sm
                  font-medium
                  text-blue-700
                ">
                  Vacant
                </p>

                <p className="
                  mt-1
                  text-2xl
                  font-bold
                  text-blue-800
                ">
                  {vacantUnits.toLocaleString()}
                </p>
              </div>

              <Home className="
                h-6
                w-6
                text-blue-600
              " />

            </div>
          </div>

          {/* Maintenance */}

          <div className="
            rounded-xl
            border
            border-orange-100
            bg-orange-50
            p-4
          ">
            <div className="
              flex
              items-center
              justify-between
            ">

              <div>
                <p className="
                  text-sm
                  font-medium
                  text-orange-700
                ">
                  Maintenance
                </p>

                <p className="
                  mt-1
                  text-2xl
                  font-bold
                  text-orange-800
                ">
                  {maintenanceUnits.toLocaleString()}
                </p>
              </div>

              <Wrench className="
                h-6
                w-6
                text-orange-600
              " />

            </div>
          </div>

        </div>

      </div>

      {/* ================================================================
          BUILDING FEATURES
      ================================================================= */}

      <div className="
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-6
        shadow-sm
      ">

        <div className="
          flex
          items-center
          justify-between
        ">

          <div>
            <p className="
              text-sm
              font-medium
              text-gray-500
            ">
              Building Features
            </p>

            <h3 className="
              text-xl
              font-bold
              text-gray-900
            ">
              Amenities Summary
            </h3>
          </div>

          <div className="
            rounded-xl
            bg-amber-50
            p-3
          ">
            <BarChart3 className="
              h-8
              w-8
              text-amber-600
            " />
          </div>

        </div>

        <div className="
          mt-6
          grid
          gap-4
          md:grid-cols-2
          xl:grid-cols-4
        ">

          {features.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.name}
                className="
                  flex
                  items-center
                  justify-between
                  rounded-xl
                  bg-gray-50
                  p-4
                "
              >

                <div className="
                  flex
                  items-center
                  gap-3
                ">
                  <Icon className="
                    h-5
                    w-5
                    text-indigo-600
                  " />

                  <span className="
                    text-sm
                    font-medium
                    text-gray-700
                  ">
                    {item.name}
                  </span>
                </div>

                <span className="
                  rounded-full
                  bg-white
                  px-3
                  py-1
                  font-bold
                  text-gray-900
                  shadow-sm
                ">
                  {item.value.toLocaleString()}
                </span>

              </div>
            );
          })}

        </div>

        <div className="
          mt-6
          flex
          items-center
          justify-between
          border-t
          border-gray-100
          pt-4
          text-sm
        ">

          <span className="text-gray-500">
            Overall Building Health
          </span>

          <span className="
            flex
            items-center
            gap-1
            font-semibold
            text-green-600
          ">
            Excellent
            <ArrowUpRight className="h-4 w-4" />
          </span>

        </div>

      </div>

    </div>
  );
};

export default ApartmentStats;

