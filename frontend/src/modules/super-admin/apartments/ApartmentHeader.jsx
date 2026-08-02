import {
  Building2,
  Layers3,
  DoorOpen,
} from "lucide-react";

const ApartmentHeader = ({
  title = "Apartment Management",
  description = "Manage apartment blocks, floors, units, amenities, occupancy, and availability.",
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

        {/* Left Content */}

        <div className="flex items-start gap-4">

          <div className="rounded-xl bg-indigo-100 p-3">
            <Building2 className="h-8 w-8 text-indigo-600" />
          </div>


          <div>

            <h1 className="text-2xl font-bold text-gray-900">
              {title}
            </h1>


            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {description}
            </p>


          </div>

        </div>



        {/* Quick Summary */}

        <div className="flex gap-3">


          <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3">

            <Layers3 className="h-5 w-5 text-indigo-600" />

            <div>
              <p className="text-xs text-gray-500">
                Floors
              </p>

              <p className="text-sm font-bold text-gray-900">
                Manage
              </p>
            </div>

          </div>



          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">

            <DoorOpen className="h-5 w-5 text-emerald-600" />

            <div>
              <p className="text-xs text-gray-500">
                Units
              </p>

              <p className="text-sm font-bold text-gray-900">
                Manage
              </p>
            </div>

          </div>


        </div>


      </div>


    </div>
  );
};


export default ApartmentHeader;