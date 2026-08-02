import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Search,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import useApartment from "../../../hooks/useApartment";

import {
  ApartmentStats,
  ApartmentCharts,
  ApartmentFilters,
  ApartmentCard,
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


  const [search, setSearch] = useState("");

  const [viewMode, setViewMode] = useState("cards");

  const [currentPage, setCurrentPage] = useState(1);


  const [filters, setFilters] = useState({
    property: "",
    status: "",
    elevator: "",
    parking: "",
    security: "",
    generator: "",
  });



  useEffect(() => {
    document.title = "Apartment Management";
  }, []);



  useEffect(() => {

    getApartments({
      page: currentPage,
    });

  }, [
    currentPage,
    getApartments,
  ]);



  const handleRefresh = useCallback(() => {

    getApartments({
      page: currentPage,
    });

  }, [
    currentPage,
    getApartments,
  ]);



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
  | Filter Apartments
  |--------------------------------------------------------------------------
  */


  const filteredApartments = useMemo(() => {


    if (!apartments.length) {
      return [];
    }



    return apartments.filter((apartment)=>{


      const property =
        apartment.property || {};



      const keyword =
        search.toLowerCase();



      const matchesSearch =
        !search ||

        apartment.name
          ?.toLowerCase()
          .includes(keyword) ||

        apartment.block
          ?.toLowerCase()
          .includes(keyword) ||

        apartment.slug
          ?.toLowerCase()
          .includes(keyword) ||

        property.title
          ?.toLowerCase()
          .includes(keyword) ||

        property.property_code
          ?.toLowerCase()
          .includes(keyword);



      const matchesProperty =
        !filters.property ||

        String(property.id)
          === String(filters.property);



      const matchesStatus =
        !filters.status ||

        apartment.status
          === filters.status;



      const matchesElevator =
        !filters.elevator ||

        Number(apartment.has_elevator)
        === Number(filters.elevator);



      const matchesParking =
        !filters.parking ||

        Number(apartment.has_parking)
        === Number(filters.parking);



      const matchesSecurity =
        !filters.security ||

        Number(apartment.has_security)
        === Number(filters.security);



      const matchesGenerator =
        !filters.generator ||

        Number(apartment.has_backup_generator)
        === Number(filters.generator);



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


  },[
    apartments,
    search,
    filters
  ]);



  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */


  const dashboardStats = useMemo(()=>{


    return {


      totalApartments:
        filteredApartments.length,



      totalFloors:
        filteredApartments.reduce(
          (sum,item)=>
            sum +
            Number(
              item.total_floors || 0
            ),
          0
        ),



      totalUnits:
        filteredApartments.reduce(
          (sum,item)=>
            sum +
            Number(
              item.units_count ??
              item.total_units ??
              0
            ),
          0
        ),



      activeApartments:
        filteredApartments.filter(
          item =>
            item.status === "active"
        ).length,



      elevators:
        filteredApartments.filter(
          item =>
            item.has_elevator
        ).length,



      parking:
        filteredApartments.filter(
          item =>
            item.has_parking
        ).length,



      security:
        filteredApartments.filter(
          item =>
            item.has_security
        ).length,



      generators:
        filteredApartments.filter(
          item =>
            item.has_backup_generator
        ).length,


    };


  },[
    filteredApartments
  ]);



  const chartData = useMemo(()=>{


    return filteredApartments
      .slice(0,10)
      .map(apartment=>({

        name:
          apartment.block
            ?.substring(0,18)
            || "Apartment",


        floors:
          Number(
            apartment.total_floors || 0
          ),


        units:
          Number(
            apartment.units_count ??
            apartment.total_units ??
            0
          ),


        elevator:
          apartment.has_elevator ? 1 : 0,


        parking:
          apartment.has_parking ? 1 : 0,


        security:
          apartment.has_security ? 1 : 0,


        generator:
          apartment.has_backup_generator
          ? 1
          : 0,


      }));


  },[
    filteredApartments
  ]);



  if(
    loading &&
    apartments.length === 0
  ){

    return (
      <ApartmentSkeleton />
    );

  }
    return (
    <div className="space-y-6">


      {/* ==========================================================
          Header
      ========================================================== */}

      <ApartmentHeader
        title="Apartment Management"
        description="Manage apartment blocks, floors, units, amenities, occupancy, and availability."
      />


      {/* ==========================================================
          Actions
      ========================================================== */}

      <ApartmentActions
        loading={loading}
        onRefresh={handleRefresh}
        viewMode={viewMode}
        setViewMode={setViewMode}
        LayoutGrid={LayoutGrid}
        TableIcon={TableIcon}
        RefreshCw={RefreshCw}
        Loader2={Loader2}
      />



      {/* ==========================================================
          Error Message
      ========================================================== */}

      {error && (

        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">

          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />


          <div>

            <h3 className="font-semibold text-red-700">
              Unable to load apartments
            </h3>


            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>


          </div>


        </div>

      )}



      {/* ==========================================================
          Success Message
      ========================================================== */}

      {message && (

        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

          {message}

        </div>

      )}




      {/* ==========================================================
          Statistics
      ========================================================== */}

      <ApartmentStats
        stats={dashboardStats}
      />





      {/* ==========================================================
          Search + Filters
      ========================================================== */}


      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">


        <div className="grid gap-4 lg:grid-cols-12">


          <div className="relative lg:col-span-5">


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

              onChange={(e)=>setSearch(e.target.value)}

              className="
                w-full
                rounded-lg
                border
                border-gray-300
                py-2.5
                pl-10
                pr-4
                text-sm
                focus:border-indigo-500
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-200
              "

            />


          </div>



          <div className="lg:col-span-7">


            <ApartmentFilters

              filters={filters}

              setFilters={setFilters}

            />


          </div>


        </div>


      </div>





      {/* ==========================================================
          Charts
      ========================================================== */}


      <ApartmentCharts

        data={chartData}

      />





      {/* ==========================================================
          Empty State
      ========================================================== */}


      {
        !loading &&
        filteredApartments.length === 0

        ?

        (

          <ApartmentEmptyState

            onReset={resetFilters}

          />

        )


        :

        (

          <>


            {/* Cards */}

            {
              viewMode === "cards" && (

                <div
                  className="
                    grid
                    gap-6
                    sm:grid-cols-1
                    lg:grid-cols-2
                    xl:grid-cols-3
                  "
                >


                  {
                    filteredApartments.map(
                      (apartment)=>(

                        <ApartmentCard

                          key={apartment.id}

                          apartment={apartment}

                        />

                      )
                    )
                  }


                </div>

              )
            }





            {/* Table */}


            {
              viewMode === "table" && (

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

                  />

                </div>

              )
            }



          </>

        )
      }





      {/* ==========================================================
          Pagination
      ========================================================== */}


      {
        pagination?.lastPage > 1 && (

          <ApartmentPagination

            pagination={pagination}

            setCurrentPage={setCurrentPage}

          />

        )
      }





      {/* ==========================================================
          Footer
      ========================================================== */}


      <div className="border-t border-gray-200 pt-6">


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

            <span className="font-semibold text-gray-700">

              {filteredApartments.length}

            </span>


            {" "}of{" "}


            <span className="font-semibold text-gray-700">

              {
                pagination?.total ??
                filteredApartments.length
              }

            </span>


            {" "}apartments.


          </div>




          <div className="flex items-center gap-2">


            <span>

              Last updated:

              {" "}

              {new Date()
                .toLocaleString()}

            </span>


          </div>



        </div>


      </div>


    </div>
  );

};


export default ApartmentList;