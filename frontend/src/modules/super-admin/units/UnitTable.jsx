
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
    | FORMAT TEXT
    |--------------------------------------------------------------------------
    */

    const formatText = (value) => {
        const text = normalize(value);

        if (text === "-") {
            return "-";
        }

        return text
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (char) =>
                char.toUpperCase()
            );
    };

    /*
    |--------------------------------------------------------------------------
    | UNIT NAME
    |--------------------------------------------------------------------------
    */

    const getUnitName = (unit) => {
        const name = normalize(
            unit?.unit_name ??
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
    |
    | API response:
    |
    | "details": {
    |     "type": "bedsitter"
    | }
    |
    | Therefore details.type must be checked first.
    |
    */

    const getUnitType = (unit) => {
        const type =
            unit?.details?.type ??
            unit?.type ??
            unit?.unit_type ??
            unit?.category ??
            unit?.unit_category ??
            unit?.details?.unit_type ??
            null;

        if (
            type === null ||
            type === undefined ||
            type === ""
        ) {
            return "-";
        }

        return formatText(type);
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
    | PRICE
    |--------------------------------------------------------------------------
    |
    | The database field remains "price".
    |
    | A unit can represent:
    |
    | - rental price
    | - sale price
    | - another listing price
    |
    | We therefore use "Price" instead of "Rent".
    |
    | API:
    |
    | pricing.price
    |
    */

    const getPrice = (unit) => {
        const price =
            unit?.price ??
            unit?.pricing?.price ??
            unit?.sale_price ??
            unit?.rent_amount ??
            unit?.rent ??
            unit?.rent_price ??
            unit?.pricing?.rent_amount ??
            unit?.pricing?.monthly_rent ??
            0;

        /*
        |--------------------------------------------------------------------------
        | Handle nested price object
        |--------------------------------------------------------------------------
        */

        if (
            typeof price === "object" &&
            price !== null
        ) {
            return (
                price?.amount ??
                price?.value ??
                price?.price ??
                price?.sale_price ??
                price?.monthly_rent ??
                0
            );
        }

        return price;
    };

    /*
    |--------------------------------------------------------------------------
    | FORMAT PRICE
    |--------------------------------------------------------------------------
    */

    const formatPrice = (unit) => {
        const price = Number(
            getPrice(unit)
        );

        if (
            Number.isNaN(price) ||
            price <= 0
        ) {
            return "KES 0";
        }

        return `KES ${price.toLocaleString(
            "en-KE",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }
        )}`;
    };

    /*
    |--------------------------------------------------------------------------
    | PRICE TYPE
    |--------------------------------------------------------------------------
    |
    | If your API later provides:
    |
    | listing_type: "rent"
    | listing_type: "sale"
    | listing_type: "rent_and_sale"
    |
    | this will display it automatically.
    |
    */

    const getPriceType = (unit) => {
        const type =
            unit?.listing_type ??
            unit?.price_type ??
            unit?.transaction_type ??
            unit?.availability?.listing_type ??
            null;

        if (!type) {
            return null;
        }

        return formatText(type);
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
                status?.value ??
                    status?.current ??
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
                            : formatText(
                                  label
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
                <table className="w-full min-w-[1150px]">
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
                                Price
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

                                const priceType =
                                    getPriceType(
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
                                            <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold capitalize text-blue-700">
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

                                        {/* PRICE */}

                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                    <DollarSign
                                                        size={
                                                            15
                                                        }
                                                        className="text-gray-400"
                                                    />

                                                    <span className="font-semibold text-gray-900">
                                                        {formatPrice(
                                                            unit
                                                        )}
                                                    </span>
                                                </div>

                                                {priceType && (
                                                    <span className="mt-1 text-xs text-gray-400">
                                                        {
                                                            priceType
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* STATUS */}

                                        <td className="px-6 py-5">
                                            <span
                                                className={`inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${status.className}`}
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

