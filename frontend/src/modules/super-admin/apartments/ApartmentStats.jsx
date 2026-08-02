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
  Elevator,
} from "lucide-react";


const ApartmentStats = ({
  stats = {},
}) => {


  const overviewCards = [
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



  const occupancyCards = [
    {
      title:"Occupied Units",
      value: stats.occupiedUnits ?? 0,
      icon: Users,
      color:"text-green-600",
      bg:"bg-green-50",
    },

    {
      title:"Vacant Units",
      value: stats.vacantUnits ?? 0,
      icon: Home,
      color:"text-blue-600",
      bg:"bg-blue-50",
    },

    {
      title:"Maintenance Units",
      value: stats.maintenanceUnits ?? 0,
      icon: Wrench,
      color:"text-orange-600",
      bg:"bg-orange-50",
    },

    {
      title:"Occupancy Rate",
      value:`${stats.occupancyRate ?? 0}%`,
      icon: TrendingUp,
      color:"text-purple-600",
      bg:"bg-purple-50",
    },
  ];



  return (

    <div className="space-y-6">



      {/* ===============================
          Overview Cards
      =============================== */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">


        {
          overviewCards.map((card)=>{

            const Icon = card.icon;


            return (

              <div
                key={card.title}
                className="
                  group
                  rounded-2xl
                  border
                  bg-white
                  p-6
                  shadow-sm
                  transition
                  hover:-translate-y-1
                  hover:shadow-xl
                "
              >

                <div className="
                  flex
                  items-start
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


                    <h2 className="
                      mt-3
                      text-4xl
                      font-bold
                      text-gray-900
                    ">
                      {card.value}
                    </h2>


                  </div>



                  <div
                    className={`
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-xl
                      ${card.bg}
                    `}
                  >

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
                  pt-4
                  text-sm
                ">


                  <span className="
                    flex
                    items-center
                    gap-2
                    text-green-600
                  ">

                    <TrendingUp className="h-4 w-4"/>

                    Updated

                  </span>



                  <span className="
                    flex
                    items-center
                    gap-1
                    text-gray-400
                  ">

                    <Activity className="h-4 w-4"/>

                    Live

                  </span>


                </div>


              </div>

            );

          })
        }


      </div>





      {/* ===============================
          Occupancy Analytics
      =============================== */}


      <div className="
        grid
        gap-6
        md:grid-cols-2
        xl:grid-cols-4
      ">


        {
          occupancyCards.map((card)=>{


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


              </div>

            );

          })

        }


      </div>






      {/* ===============================
          Building Features
      =============================== */}


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

            <BarChart3
              className="
                h-8
                w-8
                text-amber-600
              "
            />

          </div>


        </div>




        <div className="
          mt-6
          grid
          gap-4
          md:grid-cols-2
          xl:grid-cols-4
        ">


          {
            [
              {
                name:"Elevators",
                value:stats.elevators ?? 0,
                icon:Elevator,
              },

              {
                name:"Parking",
                value:stats.parking ?? 0,
                icon:Car,
              },

              {
                name:"Security",
                value:stats.security ?? 0,
                icon:ShieldCheck,
              },

              {
                name:"Generators",
                value:stats.generators ?? 0,
                icon:Zap,
              },

            ].map((item)=>{


              const Icon=item.icon;


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
                    "/>


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
                    {item.value}
                  </span>


                </div>

              );


            })
          }


        </div>





        <div className="
          mt-6
          flex
          items-center
          justify-between
          border-t
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

            <ArrowUpRight className="h-4 w-4"/>

          </span>


        </div>



      </div>


    </div>

  );

};


export default ApartmentStats;