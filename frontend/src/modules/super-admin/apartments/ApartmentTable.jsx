import {
  Building2,
  Home,
  Layers3,
  DoorOpen,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

const ApartmentTable = ({
  apartments = [],
  onView,
  onEdit,
  onDelete,
}) => {
  if (!apartments.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center bg-white">
        <Building2 className="mb-3 h-12 w-12 text-gray-300" />

        <h3 className="text-lg font-semibold text-gray-700">
          No Apartments Found
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          There are no apartments available.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">

        {/* ==========================================
            Table Header
        ========================================== */}

        <thead className="bg-gray-50">
          <tr>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Apartment
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              Property
            </th>

            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
              Block
            </th>

            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
              Floors
            </th>

            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
              Units
            </th>

            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
              Features
            </th>

            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
              Status
            </th>

            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
              Actions
            </th>

          </tr>
        </thead>

        {/* ==========================================
            Table Body
        ========================================== */}

        <tbody className="divide-y divide-gray-200 bg-white">

          {apartments.map((apartment) => {
            const property = apartment.property || {};

            return (
              <tr
                key={apartment.id}
                className="transition hover:bg-gray-50"
              >

                {/* Apartment */}

                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">

                    <img
                      src={
                        apartment.thumbnail ||
                        property.thumbnail ||
                        "/images/default-apartment.jpg"
                      }
                      alt={apartment.name}
                      className="h-14 w-14 rounded-xl object-cover"
                    />

                    <div>

                      <h3 className="font-semibold text-gray-900">
                        {apartment.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {apartment.slug}
                      </p>

                    </div>

                  </div>
                </td>

                {/* Property */}

                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">

                    <Building2 className="h-4 w-4 text-indigo-600" />

                    <span className="font-medium text-gray-700">
                      {property.title || "-"}
                    </span>

                  </div>
                </td>

                {/* Block */}

                <td className="px-6 py-5 text-center">

                  <div className="inline-flex items-center gap-2">

                    <Home className="h-4 w-4 text-blue-600" />

                    <span className="font-medium">
                      {apartment.block}
                    </span>

                  </div>

                </td>

                {/* Floors */}

                <td className="px-6 py-5 text-center">

                  <div className="inline-flex items-center gap-2">

                    <Layers3 className="h-4 w-4 text-indigo-600" />

                    <span className="font-semibold">
                      {apartment.total_floors}
                    </span>

                  </div>

                </td>

                {/* Units */}

                <td className="px-6 py-5 text-center">

                  <div className="inline-flex items-center gap-2">

                    <DoorOpen className="h-4 w-4 text-emerald-600" />

                    <span className="font-semibold">
                      {apartment.units_count ??
                        apartment.total_units}
                    </span>

                  </div>

                </td>

                                {/* Features */}

                <td className="px-6 py-5">
                  <div className="flex flex-wrap justify-center gap-2">

                    {apartment.has_elevator && (
                      <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">
                        Elevator
                      </span>
                    )}

                    {apartment.has_parking && (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                        Parking
                      </span>
                    )}

                    {apartment.has_security && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        Security
                      </span>
                    )}

                    {apartment.has_backup_generator && (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                        Generator
                      </span>
                    )}

                    {!apartment.has_elevator &&
                      !apartment.has_parking &&
                      !apartment.has_security &&
                      !apartment.has_backup_generator && (
                        <span className="text-xs text-gray-400">
                          None
                        </span>
                      )}

                  </div>
                </td>

                {/* Status */}

                <td className="px-6 py-5 text-center">

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      apartment.status === "active"
                        ? "bg-green-100 text-green-700"
                        : apartment.status === "inactive"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {apartment.status}
                  </span>

                </td>

                {/* Actions */}

                <td className="px-6 py-5">

                  <div className="flex items-center justify-center gap-2">

                    <button
                      onClick={() => onView?.(apartment)}
                      className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-indigo-700 transition hover:bg-indigo-100"
                      title="View Apartment"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onEdit?.(apartment)}
                      className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100"
                      title="Edit Apartment"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onDelete?.(apartment)}
                      className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100"
                      title="Delete Apartment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                  </div>

                </td>

              </tr>
            );
          })}

        </tbody>

      </table>
    </div>
  );
};

export default ApartmentTable;