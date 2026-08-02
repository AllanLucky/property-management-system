import {
  Building2,
  SearchX,
  RefreshCcw,
} from "lucide-react";

const ApartmentEmptyState = ({
  onReset,
}) => {

  return (

    <div className="
      flex
      min-h-[350px]
      flex-col
      items-center
      justify-center
      rounded-2xl
      border
      border-dashed
      border-gray-300
      bg-white
      p-8
      text-center
    ">


      <div className="
        mb-5
        flex
        h-20
        w-20
        items-center
        justify-center
        rounded-full
        bg-gray-100
      ">

        <Building2 className="h-10 w-10 text-gray-400"/>

      </div>



      <h2 className="
        text-xl
        font-bold
        text-gray-800
      ">
        No Apartments Found
      </h2>



      <p className="
        mt-2
        max-w-md
        text-sm
        text-gray-500
      ">
        We could not find any apartments matching your search or filters.
        Try changing your filters or refresh the list.
      </p>



      <button

        onClick={onReset}

        className="
          mt-6
          flex
          items-center
          gap-2
          rounded-lg
          bg-indigo-600
          px-5
          py-2.5
          text-sm
          font-semibold
          text-white
          transition
          hover:bg-indigo-700
        "

      >

        <RefreshCcw className="h-4 w-4"/>

        Reset Filters

      </button>


    </div>

  );

};


export default ApartmentEmptyState;