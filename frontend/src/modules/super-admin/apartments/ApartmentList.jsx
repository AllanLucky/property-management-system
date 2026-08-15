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

import Swal from "sweetalert2";
import { useDispatch } from "react-redux";

import { addNotification } from "../../../store/uiSlice";

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
  const dispatch = useDispatch();

  const {
    apartments = [],
    loading,
    error,
    message,
    pagination,
    getApartments,
    deleteApartment,
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

  const [deletingId, setDeletingId] = useState(null);

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

  const handleView = useCallback((apartment) => {
    console.log("View Apartment:", apartment);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const handleEdit = useCallback((apartment) => {
    console.log("Edit Apartment:", apartment);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | DELETE APARTMENT
  |--------------------------------------------------------------------------
  |
  | SweetAlert confirmation
  | API deletion
  | Toast notification
  | Success/Error feedback
  |
  |--------------------------------------------------------------------------
  */

  const handleDelete = useCallback(
    async (apartment) => {
      if (!apartment?.id) {
        dispatch(
          addNotification({
            type: "error",
            message:
              "Unable to delete apartment. Apartment ID is missing.",
          })
        );

        return;
      }

      if (deletingId) {
        return;
      }

      const apartmentName =
        apartment?.name ||
        apartment?.building?.block ||
        `Apartment #${apartment.id}`;

      /*
      |--------------------------------------------------------------------------
      | SWEETALERT CONFIRMATION
      |--------------------------------------------------------------------------
      */

      const result = await Swal.fire({
        title: "Delete Apartment?",
        html: `
          <div style="font-size: 15px; line-height: 1.6;">
            Are you sure you want to delete
            <strong>${apartmentName}</strong>?
            <br />
            <span style="color: #dc2626;">
              This action cannot be undone.
            </span>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Delete",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        focusCancel: true,
        allowOutsideClick: false,
        allowEscapeKey: true,
      });

      /*
      |--------------------------------------------------------------------------
      | USER CANCELLED
      |--------------------------------------------------------------------------
      */

      if (!result.isConfirmed) {
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | START DELETE
      |--------------------------------------------------------------------------
      */

      try {
        setDeletingId(apartment.id);

        /*
        |--------------------------------------------------------------------------
        | DELETE FROM API
        |--------------------------------------------------------------------------
        */

        await deleteApartment(apartment.id);

        /*
        |--------------------------------------------------------------------------
        | SUCCESS TOAST
        |--------------------------------------------------------------------------
        */

        dispatch(
          addNotification({
            type: "success",
            message: `${apartmentName} was deleted successfully.`,
          })
        );

        /*
        |--------------------------------------------------------------------------
        | SUCCESS SWEETALERT
        |--------------------------------------------------------------------------
        */

        await Swal.fire({
          title: "Deleted!",
          text: `${apartmentName} has been deleted successfully.`,
          icon: "success",
          timer: 1800,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });

        /*
        |--------------------------------------------------------------------------
        | REFRESH DATA
        |--------------------------------------------------------------------------
        */

        await getApartments({
          page: currentPage,
        });
      } catch (deleteError) {
        console.error(
          "Failed to delete apartment:",
          deleteError
        );

        const errorMessage =
          deleteError?.response?.data?.message ||
          deleteError?.message ||
          "Failed to delete apartment. Please try again.";

        /*
        |--------------------------------------------------------------------------
        | ERROR TOAST
        |--------------------------------------------------------------------------
        */

        dispatch(
          addNotification({
            type: "error",
            message: errorMessage,
          })
        );

        /*
        |--------------------------------------------------------------------------
        | ERROR SWEETALERT
        |--------------------------------------------------------------------------
        */

        await Swal.fire({
          title: "Delete Failed",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "OK",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [
      currentPage,
      deleteApartment,
      deletingId,
      dispatch,
      getApartments,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  const resetFilters = useCallback(() => {
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
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FILTER APARTMENTS
  |--------------------------------------------------------------------------
  |
  | Search:
  | - Apartment name
  | - Building / block
  | - Property title
  |
  | Removed:
  | - slug
  | - property_code
  |
  |--------------------------------------------------------------------------
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
        Number(
          features?.has_backup_generator
        ) === Number(filters.generator);

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
    const totalUnits =
      filteredApartments.reduce(
        (sum, item) =>
          sum +
          Number(
            item?.counts?.units || 0
          ),
        0
      );

    const occupiedUnits =
      filteredApartments.reduce(
        (sum, item) =>
          sum +
          Number(
            item?.counts?.occupied_units || 0
          ),
        0
      );

    const vacantUnits =
      filteredApartments.reduce(
        (sum, item) =>
          sum +
          Number(
            item?.counts?.vacant_units || 0
          ),
        0
      );

    const maintenanceUnits =
      filteredApartments.reduce(
        (sum, item) =>
          sum +
          Number(
            item?.counts?.maintenance_units || 0
          ),
        0
      );

    const occupancyRate =
      totalUnits > 0
        ? Number(
            (
              (occupiedUnits / totalUnits) *
              100
            ).toFixed(1)
          )
        : 0;

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

      totalUnits,

      occupiedUnits,

      vacantUnits,

      maintenanceUnits,

      occupancyRate,

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
  |
  | Show a full-page apartment skeleton while there is no existing data.
  |
  |--------------------------------------------------------------------------
  */

  if (
    loading &&
    apartments.length === 0
  ) {
    return (
      <div className="space-y-6">
        <ApartmentSkeleton />

        <div className="flex min-h-[160px] items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />

            <p className="text-sm font-medium text-gray-600">
              Loading apartments...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="relative space-y-6">

      {/* ================================================================
          LOADING OVERLAY
      ================================================================ */}

      {loading && apartments.length > 0 && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/20
            backdrop-blur-[2px]
          "
        >
          <div
            className="
              flex
              min-w-[180px]
              flex-col
              items-center
              justify-center
              gap-3
              rounded-2xl
              bg-white
              px-8
              py-6
              shadow-2xl
            "
          >
            <Loader2
              className="
                h-9
                w-9
                animate-spin
                text-indigo-600
              "
            />

            <p className="
              text-sm
              font-semibold
              text-gray-700
            ">
              Loading apartments...
            </p>
          </div>
        </div>
      )}

      {/* ================================================================
          HEADER
      ================================================================ */}

      <ApartmentHeader
        title="Apartment Management"
        description="
          Manage apartment blocks,
          floors, units, amenities,
          occupancy, and availability.
        "
      />

      {/* ================================================================
          ACTIONS
      ================================================================ */}

      <ApartmentActions
        loading={loading}
        onRefresh={handleRefresh}
        RefreshCw={RefreshCw}
        Loader2={Loader2}
      />

      {/* ================================================================
          ERROR
      ================================================================ */}

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
              shrink-0
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

      {/* ================================================================
          MESSAGE
      ================================================================ */}

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

      {/* ================================================================
          STATISTICS
      ================================================================ */}

      <ApartmentStats
        stats={dashboardStats}
      />

      {/* ================================================================
          SEARCH + FILTERS
      ================================================================ */}

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
          {/* SEARCH */}

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

          {/* FILTERS */}

          <div className="lg:col-span-7">
            <ApartmentFilters
              filters={filters}
              setFilters={setFilters}
            />
          </div>
        </div>
      </div>

      {/* ================================================================
          CHARTS
      ================================================================ */}

      <ApartmentCharts
        data={filteredApartments}
      />

      {/* ================================================================
          EMPTY / TABLE
      ================================================================ */}

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
            deletingId={deletingId}
          />
        </div>
      )}

      {/* ================================================================
          PAGINATION
      ================================================================ */}

      {pagination?.lastPage > 1 && (
        <ApartmentPagination
          pagination={pagination}
          setCurrentPage={setCurrentPage}
        />
      )}

      {/* ================================================================
          FOOTER
      ================================================================ */}

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