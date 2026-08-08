
import {
  Building2,
  DollarSign,
  Edit,
  Eye,
  Hash,
  Loader2,
  Trash2,
} from "lucide-react";

const UnitTable = ({
  units = [],
  deletingId = null,
  onView,
  onEdit,
  onDelete,
}) => {
  /*
  |--------------------------------------------------------------------------
  | NORMALIZE VALUE
  |--------------------------------------------------------------------------
  */
  const normalize = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "-";
    }

    if (typeof value === "object") {
      return (
        value?.name ||
        value?.title ||
        value?.label ||
        value?.value ||
        "-"
      );
    }

    return String(value);
  };

  /*
  |--------------------------------------------------------------------------
  | UNIT NAME
  |--------------------------------------------------------------------------
  */
  const getUnitName = (unit) => {
    return (
      unit?.name ||
      unit?.unit_number ||
      `Unit #${unit?.id ?? "-"}`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | UNIT TYPE
  |--------------------------------------------------------------------------
  */
  const getUnitType = (unit) => {
    return (
      unit?.type ||
      unit?.unit_type ||
      unit?.category ||
      "-"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | RENT
  |--------------------------------------------------------------------------
  */
  const getRent = (unit) => {
    return (
      unit?.rent_amount ??
      unit?.pricing?.rent_amount ??
      unit?.rent ??
      unit?.rent_price ??
      0
    );
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */
  const getStatus = (unit) => {
    const status =
      unit?.status?.current ??
      unit?.status?.value ??
      unit?.status ??
      "unknown";

    return String(status).toLowerCase();
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS FORMAT
  |--------------------------------------------------------------------------
  */
  const formatStatus = (unit) => {
    const status = getStatus(unit);

    switch (status) {
      case "occupied":
        return {
          label: "Occupied",
          className:
            "bg-red-100 text-red-700 border border-red-200",
        };

      case "vacant":
        return {
          label: "Vacant",
          className:
            "bg-green-100 text-green-700 border border-green-200",
        };

      case "reserved":
        return {
          label: "Reserved",
          className:
            "bg-purple-100 text-purple-700 border border-purple-200",
        };

      case "maintenance":
        return {
          label: "Maintenance",
          className:
            "bg-yellow-100 text-yellow-700 border border-yellow-200",
        };

      case "inactive":
        return {
          label: "Inactive",
          className:
            "bg-gray-100 text-gray-700 border border-gray-200",
        };

      default:
        return {
          label: normalize(
            unit?.status?.label ||
              unit?.status ||
              "Unknown"
          ),
          className:
            "bg-slate-100 text-slate-700 border border-slate-200",
        };
    }
  };

  /*
  |--------------------------------------------------------------------------
  | EMPTY STATE
  |--------------------------------------------------------------------------
  */
  if (!units.length) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="py-20 px-6 text-center">
          <div className="flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Building2 size={30} />
            </div>

            <p className="text-lg font-semibold text-gray-700">
              No units found
            </p>

            <p className="text-sm mt-1 text-gray-500">
              There are no units matching your current filters.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TABLE
  |--------------------------------------------------------------------------
  */
  return (
    <div className="overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px]">
          {/* HEADER */}
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Unit
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Type
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Apartment
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Property
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Rent
              </th>

              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Status
              </th>

              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-gray-100">
            {units.map((unit) => {
              const status = formatStatus(unit);
              const isDeleting =
                deletingId === unit.id;

              const apartmentName =
                unit?.apartment?.name ||
                unit?.apartment?.title ||
                (unit?.apartment_id
                  ? `Apartment #${unit.apartment_id}`
                  : "-");

              const propertyName =
                unit?.property?.name ||
                unit?.property?.title ||
                (unit?.property_id
                  ? `Property #${unit.property_id}`
                  : "-");

              return (
                <tr
                  key={unit.id}
                  className={`transition ${
                    isDeleting
                      ? "bg-red-50 opacity-60"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* UNIT */}
                  <td className="px-6 py-5">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                        <Building2
                          size={18}
                          className="text-blue-600"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {getUnitName(unit)}
                        </p>

                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Hash size={12} />

                          {normalize(
                            unit?.unit_number
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* TYPE */}
                  <td className="px-6 py-5">
                    <span className="text-gray-700 capitalize">
                      {normalize(
                        getUnitType(unit)
                      )}
                    </span>
                  </td>

                  {/* APARTMENT */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Building2
                        size={16}
                        className="text-gray-400"
                      />

                      <span>
                        {apartmentName}
                      </span>
                    </div>
                  </td>

                  {/* PROPERTY */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Building2
                        size={16}
                        className="text-gray-400"
                      />

                      <span>
                        {propertyName}
                      </span>
                    </div>
                  </td>

                  {/* RENT */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1 font-semibold text-gray-900 whitespace-nowrap">
                      <DollarSign size={15} />

                      <span>
                        KES{" "}
                        {Number(
                          getRent(unit)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      {/* VIEW */}
                      <button
                        type="button"
                        disabled={deletingId !== null}
                        onClick={() =>
                          onView?.(unit)
                        }
                        className="w-10 h-10 rounded-xl bg-green-100 hover:bg-green-200 text-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
                        title="View Unit"
                      >
                        <Eye size={16} />
                      </button>

                      {/* EDIT */}
                      <button
                        type="button"
                        disabled={deletingId !== null}
                        onClick={() =>
                          onEdit?.(unit)
                        }
                        className="w-10 h-10 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
                        title="Edit Unit"
                      >
                        <Edit size={16} />
                      </button>

                      {/* DELETE */}
                      <button
                        type="button"
                        disabled={
                          deletingId !== null
                        }
                        onClick={() =>
                          onDelete?.(unit)
                        }
                        className="w-10 h-10 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
                        title="Delete Unit"
                      >
                        {isDeleting ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2
                            size={16}
                          />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UnitTable;

