import {
  Building2,
  Home,
  Layers3,
  DoorOpen,
  Eye,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const ApartmentTable = ({ apartments = [],  onDelete }) => {
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
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
              Apartment
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-500">
              Property
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-500">
              Block
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-500">
              Floors
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-500">
              Units
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-500">
              Occupancy
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-500">
              Status
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-500">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {apartments.map((apartment) => {
            const property = apartment?.property || {};
            const building = apartment?.building || {};
            const counts = apartment?.counts || {};
            const media = apartment?.media || {};
            const status = apartment?.status || {};
            const occupancy = apartment?.statistics?.occupancy_rate ?? 0;

            return (
              <tr key={apartment.id} className="transition hover:bg-gray-50">
                {/* Apartment */}
                <td className="px-6 py-5">
                  <Link
                    to={`/super-admin/apartments/${apartment.id}`}
                    className="flex items-center gap-4"
                  >
                    <img
                      src={media.thumbnail_url || "/images/default-apartment.jpg"}
                      alt={apartment.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {apartment.name}
                      </p>
                      <p className="text-sm text-gray-500">{apartment.slug}</p>
                    </div>
                  </Link>
                </td>

                {/* Property */}
                <td className="px-6 py-5">
                  <Link
                    to={`/super-admin/properties/${property.id}`}
                    className="flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="font-medium text-gray-700">
                        {property.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {property.property_code}
                      </p>
                    </div>
                  </Link>
                </td>

                {/* Block */}
                <td className="px-6 py-5 text-center">
                  <div className="inline-flex items-center gap-2">
                    <Home className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">{building.block}</span>
                  </div>
                </td>

                {/* Floors */}
                <td className="px-6 py-5 text-center">
                  <div className="inline-flex items-center gap-2">
                    <Layers3 className="h-4 w-4 text-indigo-600" />
                    <span className="font-semibold">{counts.floors ?? 0}</span>
                  </div>
                </td>

                {/* Units */}
                <td className="px-6 py-5 text-center">
                  <div className="inline-flex items-center gap-2">
                    <DoorOpen className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold">{counts.units ?? 0}</span>
                  </div>
                </td>

                {/* Occupancy */}
                <td className="px-6 py-5 text-center">
                  <div className="flex flex-col items-center">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold">{occupancy}%</span>
                    <span className="text-xs text-gray-500">
                      {counts.occupied_units ?? 0}/{counts.units ?? 0}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-5 text-center">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold
                      ${status.value === "active"
                        ? "bg-green-100 text-green-700"
                        : status.value === "maintenance"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    {status.label}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-5">
                  <div className="flex justify-center gap-2">
                    <Link
                      to={`/super-admin/apartments/${apartment.id}`}
                      className="rounded-lg bg-indigo-50 p-2 text-indigo-700 hover:bg-indigo-100"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>

                    <Link
                      to={`/super-admin/apartments/${apartment.id}/edit`}
                      className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>

                    <button
                      onClick={() => onDelete?.(apartment)}
                      className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100"
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
