import {
  Building2,
  Layers3,
  DoorOpen,
  Home,
} from "lucide-react";

const ApartmentHeader = ({
  title = "Apartment Management",
  description = "Manage apartment blocks, floors, units, amenities, occupancy, and availability.",
  stats = {},
}) => {
  /*
  |--------------------------------------------------------------------------
  | NORMALIZE STATISTICS
  |--------------------------------------------------------------------------
  */

  const normalizedStats =
    stats?.data && typeof stats.data === "object"
      ? stats.data
      : stats;

  const totalApartments = Number(
    normalizedStats?.totalApartments ?? 0
  );

  const totalFloors = Number(
    normalizedStats?.totalFloors ?? 0
  );

  const totalUnits = Number(
    normalizedStats?.totalUnits ?? 0
  );

  return (
    <div
      className="
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-6
        shadow-sm
      "
    >
      <div
        className="
          flex
          flex-col
          justify-between
          gap-5
          md:flex-row
          md:items-center
        "
      >
        {/* ================================================================
            LEFT CONTENT
        ================================================================= */}

        <div className="flex items-start gap-4">
          <div
            className="
              rounded-xl
              bg-indigo-100
              p-3
            "
          >
            <Building2
              className="h-8 w-8 text-indigo-600"
            />
          </div>

          <div>
            <h1
              className="
                text-2xl
                font-bold
                text-gray-900
              "
            >
              {title}
            </h1>

            <p
              className="
                mt-1
                max-w-2xl
                text-sm
                text-gray-500
              "
            >
              {description}
            </p>
          </div>
        </div>

        {/* ================================================================
            STATISTICS
        ================================================================= */}

        <div className="flex flex-wrap gap-3">

          {/* ============================================================
              APARTMENTS
          ============================================================ */}

          <div
            className="
              flex
              items-center
              gap-2
              rounded-xl
              bg-indigo-50
              px-4
              py-3
            "
          >
            <Home
              className="h-5 w-5 text-indigo-600"
            />

            <div>
              <p className="text-xs text-gray-500">
                Apartments
              </p>

              <p className="text-sm font-bold text-gray-900">
                {totalApartments.toLocaleString()}
              </p>
            </div>
          </div>

          {/* ============================================================
              FLOORS
          ============================================================ */}

          <div
            className="
              flex
              items-center
              gap-2
              rounded-xl
              bg-blue-50
              px-4
              py-3
            "
          >
            <Layers3
              className="h-5 w-5 text-blue-600"
            />

            <div>
              <p className="text-xs text-gray-500">
                Floors
              </p>

              <p className="text-sm font-bold text-gray-900">
                {totalFloors.toLocaleString()}
              </p>
            </div>
          </div>

          {/* ============================================================
              UNITS
          ============================================================ */}

          <div
            className="
              flex
              items-center
              gap-2
              rounded-xl
              bg-emerald-50
              px-4
              py-3
            "
          >
            <DoorOpen
              className="h-5 w-5 text-emerald-600"
            />

            <div>
              <p className="text-xs text-gray-500">
                Units
              </p>

              <p className="text-sm font-bold text-gray-900">
                {totalUnits.toLocaleString()}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ApartmentHeader;

