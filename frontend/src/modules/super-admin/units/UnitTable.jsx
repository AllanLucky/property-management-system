
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
                value?.name ??
                value?.title ??
                value?.label ??
                value?.value ??
                value?.current ??
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
        const name = normalize(
            unit?.name
        );

        if (name !== "-") {
            return name;
        }

        const unitNumber = normalize(
            unit?.unit_number
        );

        if (unitNumber !== "-") {
            return unitNumber;
        }

        return `Unit #${unit?.id ?? "-"}`;
    };

    /*
    |--------------------------------------------------------------------------
    | UNIT TYPE
    |--------------------------------------------------------------------------
    */

    const getUnitType = (unit) => {
        return normalize(
            unit?.type ??
                unit?.unit_type ??
                unit?.category
        );
    };

    /*
    |--------------------------------------------------------------------------
    | APARTMENT NAME
    |--------------------------------------------------------------------------
    */

    const getApartmentName = (unit) => {
        const apartment =
            unit?.apartment;

        if (apartment) {
            return (
                apartment?.name ??
                apartment?.title ??
                apartment?.block ??
                `Apartment #${
                    apartment?.id ??
                    unit?.apartment_id ??
                    "-"
                }`
            );
        }

        if (unit?.apartment_id) {
            return `Apartment #${unit.apartment_id}`;
        }

        return "-";
    };

    /*
    |--------------------------------------------------------------------------
    | PROPERTY NAME
    |--------------------------------------------------------------------------
    */

    const getPropertyName = (unit) => {
        const property =
            unit?.property;

        if (property) {
            return (
                property?.title ??
                property?.name ??
                property?.property_name ??
                `Property #${
                    property?.id ??
                    unit?.property_id ??
                    "-"
                }`
            );
        }

        if (unit?.property_id) {
            return `Property #${unit.property_id}`;
        }

        return "-";
    };

    /*
    |--------------------------------------------------------------------------
    | RENT
    |--------------------------------------------------------------------------
    |
    | Priority:
    |
    | 1. Unit rent_amount
    | 2. Unit rent
    | 3. Unit rent_price
    | 4. Unit pricing.rent_amount
    | 5. Unit pricing.monthly_rent
    | 6. Property pricing.monthly_rent
    | 7. Property monthly_rent
    | 8. 0
    |
    */

    const getRent = (unit) => {
        const rent =
            unit?.rent_amount ??
            unit?.rent ??
            unit?.rent_price ??
            unit?.pricing?.rent_amount ??
            unit?.pricing?.monthly_rent ??
            unit?.property?.pricing?.monthly_rent ??
            unit?.property?.monthly_rent ??
            0;

        /*
        |--------------------------------------------------------------------------
        | Handle nested rent objects
        |--------------------------------------------------------------------------
        */

        if (
            typeof rent === "object" &&
            rent !== null
        ) {
            return (
                rent?.amount ??
                rent?.value ??
                rent?.price ??
                rent?.monthly_rent ??
                0
            );
        }

        return rent;
    };

    /*
    |--------------------------------------------------------------------------
    | FORMAT RENT
    |--------------------------------------------------------------------------
    */

    const formatRent = (unit) => {
        const rent = Number(
            getRent(unit)
        );

        if (
            Number.isNaN(rent) ||
            rent <= 0
        ) {
            return "KES 0";
        }

        return `KES ${rent.toLocaleString(
            "en-KE",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }
        )}`;
    };

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    const getStatus = (unit) => {
        const status =
            unit?.status;

        if (
            status &&
            typeof status === "object"
        ) {
            return String(
                status?.current ??
                    status?.value ??
                    status?.name ??
                    status?.label ??
                    "unknown"
            )
                .toLowerCase()
                .trim()
                .replace(
                    /[\s-]+/g,
                    "_"
                );
        }

        return String(
            status ?? "unknown"
        )
            .toLowerCase()
            .trim()
            .replace(
                /[\s-]+/g,
                "_"
            );
    };

    /*
    |--------------------------------------------------------------------------
    | STATUS FORMAT
    |--------------------------------------------------------------------------
    */

    const formatStatus = (unit) => {
        const status =
            getStatus(unit);

        switch (status) {
            case "occupied":
                return {
                    label: "Occupied",
                    className:
                        "bg-red-50 text-red-700 border border-red-200",
                };

            case "vacant":
                return {
                    label: "Vacant",
                    className:
                        "bg-green-50 text-green-700 border border-green-200",
                };

            case "reserved":
                return {
                    label: "Reserved",
                    className:
                        "bg-purple-50 text-purple-700 border border-purple-200",
                };

            case "maintenance":
                return {
                    label: "Maintenance",
                    className:
                        "bg-yellow-50 text-yellow-700 border border-yellow-200",
                };

            case "inactive":
                return {
                    label: "Inactive",
                    className:
                        "bg-gray-100 text-gray-700 border border-gray-200",
                };

            case "available":
                return {
                    label: "Available",
                    className:
                        "bg-emerald-50 text-emerald-700 border border-emerald-200",
                };

            default: {
                const rawLabel =
                    unit?.status?.label ??
                    unit?.status?.name ??
                    unit?.status?.value ??
                    unit?.status ??
                    "Unknown";

                const label =
                    normalize(
                        rawLabel
                    );

                return {
                    label:
                        label === "-"
                            ? "Unknown"
                            : label
                                  .charAt(
                                      0
                                  )
                                  .toUpperCase() +
                              label.slice(
                                  1
                              ),
                    className:
                        "bg-slate-50 text-slate-700 border border-slate-200",
                };
            }
        }
    };

    /*
    |--------------------------------------------------------------------------
    | EMPTY STATE
    |--------------------------------------------------------------------------
    */

    if (!units.length) {
        return (
            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                        <Building2
                            size={30}
                            className="text-gray-400"
                        />
                    </div>

                    <p className="mt-4 text-lg font-semibold text-gray-700">
                        No units found
                    </p>

                    <p className="mt-1 max-w-md text-sm text-gray-500">
                        There are no units
                        matching your
                        current filters.
                    </p>
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
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                    {/* HEADER */}
                    <thead className="border-b border-gray-100 bg-gray-50">
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
                        {units.map(
                            (unit) => {
                                const status =
                                    formatStatus(
                                        unit
                                    );

                                const isDeleting =
                                    String(
                                        deletingId
                                    ) ===
                                    String(
                                        unit?.id
                                    );

                                return (
                                    <tr
                                        key={
                                            unit?.id
                                        }
                                        className={`transition-colors ${
                                            isDeleting
                                                ? "bg-red-50 opacity-60"
                                                : "hover:bg-gray-50"
                                        }`}
                                    >
                                        {/* UNIT */}
                                        <td className="px-6 py-5">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100">
                                                    <Building2
                                                        size={
                                                            18
                                                        }
                                                        className="text-blue-600"
                                                    />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="max-w-[180px] truncate font-semibold text-gray-900">
                                                        {getUnitName(
                                                            unit
                                                        )}
                                                    </p>

                                                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                                                        <Hash
                                                            size={
                                                                12
                                                            }
                                                        />

                                                        {normalize(
                                                            unit?.unit_number
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* TYPE */}
                                        <td className="px-6 py-5">
                                            <span className="font-medium capitalize text-gray-700">
                                                {getUnitType(
                                                    unit
                                                )}
                                            </span>
                                        </td>

                                        {/* APARTMENT */}
                                        <td className="px-6 py-5">
                                            <div className="flex max-w-[220px] items-center gap-2 text-gray-700">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                                                    <Building2
                                                        size={
                                                            15
                                                        }
                                                        className="text-indigo-500"
                                                    />
                                                </div>

                                                <span className="truncate text-sm font-medium">
                                                    {getApartmentName(
                                                        unit
                                                    )}
                                                </span>
                                            </div>
                                        </td>

                                        {/* PROPERTY */}
                                        <td className="px-6 py-5">
                                            <div className="flex max-w-[220px] items-center gap-2 text-gray-700">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                                    <Building2
                                                        size={
                                                            15
                                                        }
                                                        className="text-gray-500"
                                                    />
                                                </div>

                                                <span className="truncate text-sm font-medium">
                                                    {getPropertyName(
                                                        unit
                                                    )}
                                                </span>
                                            </div>
                                        </td>

                                        {/* RENT */}
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                <DollarSign
                                                    size={
                                                        15
                                                    }
                                                    className="text-gray-400"
                                                />

                                                <span className="font-semibold text-gray-900">
                                                    {formatRent(
                                                        unit
                                                    )}
                                                </span>
                                            </div>
                                        </td>

                                        {/* STATUS */}
                                        <td className="px-6 py-5">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${status.className}`}
                                            >
                                                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />

                                                {
                                                    status.label
                                                }
                                            </span>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* VIEW */}
                                                <button
                                                    type="button"
                                                    disabled={
                                                        deletingId !==
                                                        null
                                                    }
                                                    onClick={() =>
                                                        onView?.(
                                                            unit?.id
                                                        )
                                                    }
                                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600 transition hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="View Unit"
                                                    aria-label="View Unit"
                                                >
                                                    <Eye
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </button>

                                                {/* EDIT */}
                                                <button
                                                    type="button"
                                                    disabled={
                                                        deletingId !==
                                                        null
                                                    }
                                                    onClick={() =>
                                                        onEdit?.(
                                                            unit?.id
                                                        )
                                                    }
                                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Edit Unit"
                                                    aria-label="Edit Unit"
                                                >
                                                    <Edit
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </button>

                                                {/* DELETE */}
                                                <button
                                                    type="button"
                                                    disabled={
                                                        deletingId !==
                                                        null
                                                    }
                                                    onClick={() =>
                                                        onDelete?.(
                                                            unit?.id
                                                        )
                                                    }
                                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                                                    title="Delete Unit"
                                                    aria-label="Delete Unit"
                                                >
                                                    {isDeleting ? (
                                                        <Loader2
                                                            size={
                                                                17
                                                            }
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Trash2
                                                            size={
                                                                16
                                                            }
                                                        />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UnitTable;
