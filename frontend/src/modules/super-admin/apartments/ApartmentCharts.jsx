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
];


const ApartmentCharts = ({
  data = [],
}) => {


  const featureData = [

    {
      name: "Elevators",
      value: data.filter(
        (item) =>
          item?.features?.has_elevator
      ).length,
    },


    {
      name: "Parking",
      value: data.filter(
        (item) =>
          item?.features?.has_parking
      ).length,
    },


    {
      name: "Security",
      value: data.filter(
        (item) =>
          item?.features?.has_security
      ).length,
    },


    {
      name: "Generators",
      value: data.filter(
        (item) =>
          item?.features?.has_backup_generator
      ).length,
    },

  ];



  const chartData = data
    .slice(0,10)
    .map((item)=>({

      name:
        item?.building?.block ||
        "Apartment",


      floors:
        item?.counts?.floors || 0,


      units:
        item?.counts?.units || 0,


      occupied:
        item?.counts?.occupied_units || 0,


      vacant:
        item?.counts?.vacant_units || 0,


    }));



  if(!data.length){

    return (

      <div className="
        rounded-2xl
        border
        border-dashed
        border-gray-300
        bg-white
        py-20
        text-center
      ">

        <h3 className="
          text-lg
          font-semibold
          text-gray-700
        ">
          No Chart Data Available
        </h3>


        <p className="
          mt-2
          text-sm
          text-gray-500
        ">
          Apartment charts will appear once apartments are loaded.
        </p>


      </div>

    );

  }



  return (

    <div className="
      grid
      gap-6
      xl:grid-cols-2
    ">



      {/* Floors / Units / Occupancy */}

      <div className="
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-6
        shadow-sm
      ">


        <h2 className="
          mb-5
          text-lg
          font-semibold
          text-gray-900
        ">
          Apartment Capacity
        </h2>



        <ResponsiveContainer
          width="100%"
          height={320}
        >

          <BarChart
            data={chartData}
          >

            <CartesianGrid
              strokeDasharray="3 3"
            />


            <XAxis
              dataKey="name"
            />


            <YAxis />


            <Tooltip />


            <Legend />



            <Bar
              dataKey="floors"
              name="Floors"
              fill="#4F46E5"
              radius={[
                6,
                6,
                0,
                0
              ]}
            />



            <Bar
              dataKey="units"
              name="Units"
              fill="#10B981"
              radius={[
                6,
                6,
                0,
                0
              ]}
            />



            <Bar
              dataKey="occupied"
              name="Occupied"
              fill="#F59E0B"
              radius={[
                6,
                6,
                0,
                0
              ]}
            />



            <Bar
              dataKey="vacant"
              name="Vacant"
              fill="#EF4444"
              radius={[
                6,
                6,
                0,
                0
              ]}
            />


          </BarChart>


        </ResponsiveContainer>


      </div>





      {/* Features Pie */}

      <div className="
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-6
        shadow-sm
      ">


        <h2 className="
          mb-5
          text-lg
          font-semibold
          text-gray-900
        ">
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


              {
                featureData.map(
                  (entry,index)=>(
                    
                    <Cell
                      key={
                        `feature-${index}`
                      }
                      fill={
                        COLORS[index]
                      }
                    />

                  )
                )
              }


            </Pie>



            <Tooltip />


            <Legend />


          </PieChart>


        </ResponsiveContainer>




        <div className="
          mt-6
          grid
          grid-cols-2
          gap-4
        ">


          {
            featureData.map(
              (feature,index)=>(


                <div
                  key={
                    feature.name
                  }
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-lg
                    border
                    border-gray-100
                    bg-gray-50
                    p-3
                  "
                >


                  <div className="
                    flex
                    items-center
                    gap-3
                  ">


                    <span
                      className="
                        h-3
                        w-3
                        rounded-full
                      "
                      style={{
                        backgroundColor:
                          COLORS[index]
                      }}
                    />



                    <span className="
                      text-sm
                      font-medium
                      text-gray-700
                    ">
                      {feature.name}
                    </span>


                  </div>




                  <span className="
                    rounded-full
                    bg-white
                    px-2
                    py-1
                    text-sm
                    font-semibold
                    text-gray-800
                    shadow-sm
                  ">
                    {feature.value}
                  </span>


                </div>


              )
            )
          }


        </div>


      </div>


    </div>

  );

};


export default ApartmentCharts;