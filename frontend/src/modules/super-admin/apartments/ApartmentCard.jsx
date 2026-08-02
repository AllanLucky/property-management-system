import {
  Building2,
  Home,
  Layers3,
  DoorOpen,
  MapPin,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Car,
  Zap,
  ArrowUpDown,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

const ApartmentCard = ({
  apartment,
  onView,
  onEdit,
  onDelete,
}) => {
  const property = apartment?.property || {};

  const image =
    apartment?.thumbnail ||
    property?.thumbnail ||
    "/images/default-apartment.jpg";

  /**
   * Normalize status
   * Supports:
   * status: "active"
   * OR
   * status: {
   *   value:"active",
   *   label:"Active"
   * }
   */
  const status =
    typeof apartment?.status === "object" &&
      apartment?.status !== null
      ? apartment.status
      : {
        value: apartment?.status || "",
        label: apartment?.status || "Unknown",
      };

  const statusValue = String(status.value || "").toLowerCase();
  const statusLabel = status.label || "Unknown";

  const statusColor = {
    active:
      "bg-green-100 text-green-700 border-green-200",

    inactive:
      "bg-red-100 text-red-700 border-red-200",

    maintenance:
      "bg-yellow-100 text-yellow-700 border-yellow-200",
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">

      {/* Image */}

      <div className="relative h-56 w-full overflow-hidden">

        <img
          src={image}
          alt={apartment?.name || "Apartment"}
          className="h-full w-full object-cover transition duration-500 hover:scale-110"
        />

        <span
          className={`absolute right-4 top-4 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusColor[statusValue] ||
            "bg-gray-100 text-gray-700 border-gray-200"
            }`}
        >
          {statusLabel}
        </span>

      </div>


      {/* Content */}

      <div className="space-y-5 p-6">


        {/* Apartment */}

        <div>

          <h2 className="text-xl font-bold text-gray-900">
            {apartment?.name || "Unnamed Apartment"}
          </h2>


          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">

            <Building2 className="h-4 w-4 text-indigo-600" />

            <span>
              {property?.title || "No Property"}
            </span>

          </div>

        </div>


        {/* Basic Information */}

        <div className="grid gap-3 text-sm">


          {/* Block */}

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <Home className="h-4 w-4 text-indigo-500" />

              <span className="text-gray-500">
                Block
              </span>

            </div>


            <span className="font-semibold">
              {apartment?.block || "-"}
            </span>

          </div>


          {/* Floors */}

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <Layers3 className="h-4 w-4 text-blue-500" />

              <span className="text-gray-500">
                Floors
              </span>

            </div>


            <span className="font-semibold">
              {apartment?.total_floors ?? 0}
            </span>

          </div>


          {/* Units */}

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <DoorOpen className="h-4 w-4 text-emerald-500" />

              <span className="text-gray-500">
                Units
              </span>

            </div>


            <span className="font-semibold">
              {apartment?.units_count ??
                apartment?.total_units ??
                0}
            </span>

          </div>


          {/* Property */}

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <MapPin className="h-4 w-4 text-red-500" />

              <span className="text-gray-500">
                Property
              </span>

            </div>


            <span className="max-w-[180px] truncate font-semibold">
              {property?.title || "-"}
            </span>

          </div>


        </div>


        {/* Features */}

        <div>

          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Apartment Features
          </h3>


          <div className="grid grid-cols-2 gap-3">


            {/* Elevator */}

            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">

              {apartment?.has_elevator ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}

              <div>

                <p className="text-xs text-gray-500">
                  Elevator
                </p>

                <p className="text-sm font-semibold">
                  {apartment?.has_elevator
                    ? "Available"
                    : "No"}
                </p>

              </div>

            </div>
            {/* Parking */}

            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">

              {apartment?.has_parking ? (
                <Car className="h-5 w-5 text-blue-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}

              <div>

                <p className="text-xs text-gray-500">
                  Parking
                </p>

                <p className="text-sm font-semibold">
                  {apartment?.has_parking
                    ? "Available"
                    : "No"}
                </p>

              </div>

            </div>


            {/* Security */}

            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">

              {apartment?.has_security ? (
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}

              <div>

                <p className="text-xs text-gray-500">
                  Security
                </p>

                <p className="text-sm font-semibold">
                  {apartment?.has_security
                    ? "Available"
                    : "No"}
                </p>

              </div>

            </div>


            {/* Generator */}

            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">

              {apartment?.has_backup_generator ? (
                <Zap className="h-5 w-5 text-amber-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}

              <div>

                <p className="text-xs text-gray-500">
                  Generator
                </p>

                <p className="text-sm font-semibold">
                  {apartment?.has_backup_generator
                    ? "Available"
                    : "No"}
                </p>

              </div>

            </div>


          </div>

        </div>


      </div>



      {/* Statistics */}

      <div className="grid grid-cols-3 border-y border-gray-200 bg-gray-50">


        <div className="p-4 text-center">

          <Layers3 className="mx-auto h-5 w-5 text-indigo-600" />

          <p className="mt-2 text-xs text-gray-500">
            Floors
          </p>

          <p className="font-bold text-gray-900">
            {apartment?.total_floors ?? 0}
          </p>

        </div>



        <div className="border-x border-gray-200 p-4 text-center">

          <DoorOpen className="mx-auto h-5 w-5 text-emerald-600" />

          <p className="mt-2 text-xs text-gray-500">
            Units
          </p>

          <p className="font-bold text-gray-900">
            {apartment?.units_count ??
              apartment?.total_units ??
              0}
          </p>

        </div>



        <div className="p-4 text-center">

          <ArrowUpDown className="mx-auto h-5 w-5 text-blue-600" />

          <p className="mt-2 text-xs text-gray-500">
            Status
          </p>


          <p className="font-bold capitalize text-gray-900">
            {statusLabel}
          </p>


        </div>


      </div>



      {/* Actions */}

      <div className="flex items-center justify-between gap-3 p-5">


        <button
          onClick={() => onView?.(apartment)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
        >

          <Eye className="h-4 w-4" />

          View

        </button>



        <button
          onClick={() => onEdit?.(apartment)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >

          <Pencil className="h-4 w-4" />

          Edit

        </button>



        <button
          onClick={() => onDelete?.(apartment)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >

          <Trash2 className="h-4 w-4" />

          Delete

        </button>


      </div>


    </div>
  );
};


export default ApartmentCard;