import {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import {
  Search,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import useApartment from "../../../hooks/useApartment";

import {
  ApartmentStats,
  ApartmentCharts,
  ApartmentFilters,
  ApartmentTable,
  ApartmentSkeleton,
  ApartmentHeader,
  ApartmentActions,
  ApartmentPagination,
  ApartmentEmptyState,
} from ".";

const ApartmentList = () => {
  const {
    apartments = [],
    loading,
    error,
    message,
    pagination,
    getApartments,
  } = useApartment();

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    property: "",
    status: "",
    elevator: "",
    parking: "",
    security: "",
    generator: "",
  });

  /*
  |--------------------------------------------------------------------------
  | DOCUMENT TITLE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    document.title = "Apartment Management";
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FETCH APARTMENTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    getApartments({
      page: currentPage,
    });
  }, [currentPage, getApartments]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = useCallback(() => {
    getApartments({
      page: currentPage,
    });
  }, [currentPage, getApartments]);

  /*
  |--------------------------------------------------------------------------
  | VIEW
  |--------------------------------------------------------------------------
  */

  const handleView = (apartment) => {
    console.log("View Apartment:", apartment);
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const handleEdit = (apartment) => {
    console.log("Edit Apartment:", apartment);
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const handleDelete = (apartment) => {
    console.log("Delete Apartment:", apartment);
  };

  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  const resetFilters = () => {
    setSearch("");

    setFilters({
      property: "",
      status: "",
      elevator: "",
      parking: "",
      security: "",
      generator: "",
    });

    setCurrentPage(1);
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER APARTMENTS
  |--------------------------------------------------------------------------
  |
  | Search fields:
  |
  | - Apartment name
  | | - Building / block
  | - Property title
  |
  | Removed:
  |
  | - slug
  | - property_code
  |
  */

  const filteredApartments = useMemo(() => {
    if (!apartments.length) {
      return [];
    }

    const keyword = search.trim().toLowerCase();

    return apartments.filter((apartment) => {
      const property = apartment?.property || {};
      const building = apartment?.building || {};
      const features = apartment?.features || {};

      const status =
        apartment?.status?.value ||
        apartment?.status ||
        "";

      /*
      |--------------------------------------------------------------------------
      | SEARCH
      |--------------------------------------------------------------------------
      */

      const matchesSearch =
        !keyword ||
        apartment?.name
          ?.toLowerCase()
          .includes(keyword) ||
        building?.block
          ?.toLowerCase()
          .includes(keyword) ||
        property?.title
          ?.toLowerCase()
          .includes(keyword);

      /*
      |--------------------------------------------------------------------------
      | PROPERTY
      |--------------------------------------------------------------------------
      */

      const matchesProperty =
        !filters.property ||
        String(property?.id) ===
          String(filters.property);

      /*
      |--------------------------------------------------------------------------
      | STATUS
      |--------------------------------------------------------------------------
      */

      const matchesStatus =
        !filters.status ||
        status === filters.status;

      /*
      |--------------------------------------------------------------------------
      | ELEVATOR
      |--------------------------------------------------------------------------
      */

      const matchesElevator =
        !filters.elevator ||
        Number(features?.has_elevator) ===
          Number(filters.elevator);

      /*
      |--------------------------------------------------------------------------
      | PARKING
      |--------------------------------------------------------------------------
      */

      const matchesParking =
        !filters.parking ||
        Number(features?.has_parking) ===
          Number(filters.parking);

      /*
      |--------------------------------------------------------------------------
      | SECURITY
      |--------------------------------------------------------------------------
      */

      const matchesSecurity =
        !filters.security ||
        Number(features?.has_security) ===
          Number(filters.security);

      /*
      |--------------------------------------------------------------------------
      | GENERATOR
      |--------------------------------------------------------------------------
      */

      const matchesGenerator =
        !filters.generator ||
        Number(features?.has_backup_generator) ===
          Number(filters.generator);

      return (
        matchesSearch &&
        matchesProperty &&
        matchesStatus &&
        matchesElevator &&
        matchesParking &&
        matchesSecurity &&
        matchesGenerator
      );
    });
  }, [
    apartments,
    search,
    filters,
  ]);

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD STATISTICS
  |--------------------------------------------------------------------------
  */

  const dashboardStats = useMemo(() => {
    return {
      totalApartments:
        filteredApartments.length,

      totalFloors:
        filteredApartments.reduce(
          (sum, item) =>
            sum +
            Number(
              item?.counts?.floors || 0
            ),
          0
        ),

      totalUnits:
        filteredApartments.reduce(
          (sum, item) =>
            sum +
            Number(
              item?.counts?.units || 0
            ),
          0
        ),

      activeApartments:
        filteredApartments.filter(
          (item) =>
            (
              item?.status?.value ||
              item?.status
            ) === "active"
        ).length,

      elevators:
        filteredApartments.filter(
          (item) =>
            Boolean(
              item?.features?.has_elevator
            )
        ).length,

      parking:
        filteredApartments.filter(
          (item) =>
            Boolean(
              item?.features?.has_parking
            )
        ).length,

      security:
        filteredApartments.filter(
          (item) =>
            Boolean(
              item?.features?.has_security
            )
        ).length,

      generators:
        filteredApartments.filter(
          (item) =>
            Boolean(
              item?.features
                ?.has_backup_generator
            )
        ).length,
    };
  }, [filteredApartments]);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOADING
  |--------------------------------------------------------------------------
  */

  if (
    loading &&
    apartments.length === 0
  ) {
    return <ApartmentSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">

      {/* Header */}

      <ApartmentHeader
        title="Apartment Management"
        description="
          Manage apartment blocks,
          floors, units, amenities,
          occupancy, and availability.
        "
      />

      {/* Actions */}

      <ApartmentActions
        loading={loading}
        onRefresh={handleRefresh}
        RefreshCw={RefreshCw}
        Loader2={Loader2}
      />

      {/* Error */}

      {error && (
        <div
          className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-red-200
            bg-red-50
            p-4
          "
        >
          <AlertTriangle
            className="
              mt-0.5
              h-5
              w-5
              text-red-600
            "
          />

          <div>
            <h3
              className="
                font-semibold
                text-red-700
              "
            >
              Unable to load apartments
            </h3>

            <p
              className="
                mt-1
                text-sm
                text-red-600
              "
            >
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Message */}

      {message && (
        <div
          className="
            rounded-xl
            border
            border-green-200
            bg-green-50
            px-4
            py-3
            text-sm
            text-green-700
          "
        >
          {message}
        </div>
      )}

      {/* Statistics */}

      <ApartmentStats
        stats={dashboardStats}
      />

      {/* Search + Filters */}

      <div
        className="
          rounded-xl
          border
          border-gray-200
          bg-white
          p-5
          shadow-sm
        "
      >
        <div
          className="
            grid
            gap-4
            lg:grid-cols-12
          "
        >
          {/* Search */}

          <div
            className="
              relative
              lg:col-span-5
            "
          >
            <Search
              className="
                absolute
                left-3
                top-3.5
                h-4
                w-4
                text-gray-400
              "
            />

            <input
              type="text"
              placeholder="Search apartment, block or property..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="
                w-full
                rounded-lg
                border
                border-gray-300
                py-2.5
                pl-10
                pr-4
                text-sm
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            />
          </div>

          {/* Filters */}

          <div className="lg:col-span-7">
            <ApartmentFilters
              filters={filters}
              setFilters={setFilters}
            />
          </div>
        </div>
      </div>

      {/* Charts */}

      <ApartmentCharts
        data={filteredApartments}
      />

      {/* Empty / Table */}

      {!loading &&
      filteredApartments.length === 0 ? (
        <ApartmentEmptyState
          onReset={resetFilters}
        />
      ) : (
        <div
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white
            shadow-sm
          "
        >
          <ApartmentTable
            apartments={filteredApartments}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}

      {/* Pagination */}

      {pagination?.lastPage > 1 && (
        <ApartmentPagination
          pagination={pagination}
          setCurrentPage={setCurrentPage}
        />
      )}

      {/* Footer */}

      <div
        className="
          border-t
          border-gray-200
          pt-6
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            justify-between
            gap-3
            text-sm
            text-gray-500
            md:flex-row
          "
        >
          <div>
            Showing{" "}

            <span
              className="
                font-semibold
                text-gray-700
              "
            >
              {filteredApartments.length}
            </span>

            {" "}of{" "}

            <span
              className="
                font-semibold
                text-gray-700
              "
            >
              {
                pagination?.total ??
                filteredApartments.length
              }
            </span>

            {" "}apartments.
          </div>

          <div>
            Last updated:{" "}
            {new Date().toLocaleString()}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ApartmentList;