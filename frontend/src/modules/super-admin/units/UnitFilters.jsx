
import { useMemo } from "react";

import {
    Search,
    SlidersHorizontal,
    RotateCcw,
    Building2,
    Home,
    Layers3,
    X,
    ChevronDown,
    Hash,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| UNIT FILTERS
|--------------------------------------------------------------------------
*/

const UnitFilters = ({
    filters = {},
    onFilterChange,
    onReset,
    properties = [],
    apartments = [],
    unitTypes = [],
}) => {
    /*
    |--------------------------------------------------------------------------
    | FILTER VALUES
    |--------------------------------------------------------------------------
    */

    const search = filters?.search ?? "";
    const status = filters?.status ?? "";
    const propertyId = filters?.property_id ?? "";
    const apartmentId = filters?.apartment_id ?? "";
    const floor = filters?.floor ?? "";
    const type = filters?.type ?? "";

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE COLLECTIONS
    |--------------------------------------------------------------------------
    */

    const normalizedProperties = useMemo(() => {
        return Array.isArray(properties)
            ? properties
            : [];
    }, [properties]);

    const normalizedApartments = useMemo(() => {
        return Array.isArray(apartments)
            ? apartments
            : [];
    }, [apartments]);

    const normalizedUnitTypes = useMemo(() => {
        return Array.isArray(unitTypes)
            ? unitTypes
            : [];
    }, [unitTypes]);

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    const getId = (item) => {
        if (!item) {
            return "";
        }

        return (
            item?.id ??
            item?.value ??
            ""
        );
    };

    const getName = (
        item,
        fallback = ""
    ) => {
        if (!item) {
            return fallback;
        }

        return (
            item?.name ??
            item?.title ??
            item?.label ??
            item?.property_name ??
            item?.apartment_name ??
            fallback
        );
    };

    /*
    |--------------------------------------------------------------------------
    | APARTMENTS FOR SELECTED PROPERTY
    |--------------------------------------------------------------------------
    */

    const availableApartments = useMemo(() => {
        if (!propertyId) {
            return normalizedApartments;
        }

        return normalizedApartments.filter(
            (apartment) => {
                const apartmentPropertyId =
                    apartment?.property_id ??
                    apartment?.property?.id ??
                    apartment?.property?.value;

                return (
                    String(
                        apartmentPropertyId
                    ) ===
                    String(propertyId)
                );
            }
        );
    }, [
        normalizedApartments,
        propertyId,
    ]);

    /*
    |--------------------------------------------------------------------------
    | STATUS OPTIONS
    |--------------------------------------------------------------------------
    */

    const statusOptions = [
        {
            value: "",
            label: "All Statuses",
        },
        {
            value: "vacant",
            label: "Vacant",
        },
        {
            value: "occupied",
            label: "Occupied",
        },
        {
            value: "reserved",
            label: "Reserved",
        },
        {
            value: "maintenance",
            label: "Maintenance",
        },
    ];

    /*
    |--------------------------------------------------------------------------
    | HANDLE FILTER CHANGE
    |--------------------------------------------------------------------------
    */

    const handleChange = (
        field,
        value
    ) => {
        if (
            typeof onFilterChange !==
            "function"
        ) {
            return;
        }

        onFilterChange(
            field,
            value
        );

        /*
        |--------------------------------------------------------------------------
        | Reset apartment when property changes
        |--------------------------------------------------------------------------
        */

        if (
            field ===
            "property_id"
        ) {
            onFilterChange(
                "apartment_id",
                ""
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | REMOVE SINGLE FILTER
    |--------------------------------------------------------------------------
    */

    const removeFilter = (
        field
    ) => {
        if (
            typeof onFilterChange !==
            "function"
        ) {
            return;
        }

        onFilterChange(
            field,
            ""
        );
    };

    /*
    |--------------------------------------------------------------------------
    | RESET FILTERS
    |--------------------------------------------------------------------------
    */

    const handleReset = () => {
        if (
            typeof onReset ===
            "function"
        ) {
            onReset();
        }
    };

    /*
    |--------------------------------------------------------------------------
    | ACTIVE FILTER COUNT
    |--------------------------------------------------------------------------
    */

    const activeFilterCount = [
        search,
        status,
        propertyId,
        apartmentId,
        floor,
        type,
    ].filter(
        (value) =>
            value !== "" &&
            value !== null &&
            value !== undefined
    ).length;

    /*
    |--------------------------------------------------------------------------
    | SELECT CLASS
    |--------------------------------------------------------------------------
    */

    const selectClass =
        "w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-10 text-sm font-medium text-gray-800 outline-none transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

    const inputClass =
        "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* ------------------------------------------------------------ */}
            {/* HEADER */}
            {/* ------------------------------------------------------------ */}

            <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                            <SlidersHorizontal className="h-5 w-5 text-blue-600" />
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-gray-900">
                                    Unit Filters
                                </h3>

                                {activeFilterCount >
                                    0 && (
                                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
                                        {
                                            activeFilterCount
                                        }
                                    </span>
                                )}
                            </div>

                            <p className="mt-0.5 text-xs text-gray-500">
                                Search and refine
                                your unit
                                inventory
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={
                            handleReset
                        }
                        disabled={
                            activeFilterCount ===
                            0
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <RotateCcw className="h-4 w-4" />

                        Reset Filters
                    </button>
                </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* FILTER BODY */}
            {/* ------------------------------------------------------------ */}

            <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {/* -------------------------------------------------- */}
                    {/* SEARCH */}
                    {/* -------------------------------------------------- */}

                    <div className="xl:col-span-2">
                        <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                            <Search className="h-3.5 w-3.5" />

                            Search Units
                        </label>

                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                            <input
                                type="text"
                                value={
                                    search
                                }
                                onChange={(
                                    event
                                ) =>
                                    handleChange(
                                        "search",
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Unit number, name, property..."
                                className={`${inputClass} pl-10 pr-10`}
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        removeFilter(
                                            "search"
                                        )
                                    }
                                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                    title="Clear search"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* -------------------------------------------------- */}
                    {/* PROPERTY */}
                    {/* -------------------------------------------------- */}

                    <div>
                        <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                            <Building2 className="h-3.5 w-3.5" />

                            Property
                        </label>

                        <div className="relative">
                            <select
                                value={
                                    propertyId
                                }
                                onChange={(
                                    event
                                ) =>
                                    handleChange(
                                        "property_id",
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className={
                                    selectClass
                                }
                            >
                                <option value="">
                                    All Properties
                                </option>

                                {normalizedProperties.map(
                                    (
                                        property
                                    ) => {
                                        const id =
                                            getId(
                                                property
                                            );

                                        return (
                                            <option
                                                key={
                                                    id
                                                }
                                                value={
                                                    id
                                                }
                                            >
                                                {getName(
                                                    property,
                                                    `Property #${id}`
                                                )}
                                            </option>
                                        );
                                    }
                                )}
                            </select>

                            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {/* -------------------------------------------------- */}
                    {/* APARTMENT */}
                    {/* -------------------------------------------------- */}

                    <div>
                        <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                            <Home className="h-3.5 w-3.5" />

                            Apartment
                        </label>

                        <div className="relative">
                            <select
                                value={
                                    apartmentId
                                }
                                onChange={(
                                    event
                                ) =>
                                    handleChange(
                                        "apartment_id",
                                        event
                                            .target
                                            .value
                                    )
                                }
                                disabled={
                                    !propertyId &&
                                    normalizedApartments.length ===
                                        0
                                }
                                className={`${selectClass} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400`}
                            >
                                <option value="">
                                    {propertyId
                                        ? "All Apartments"
                                        : "All Apartments"}
                                </option>

                                {availableApartments.map(
                                    (
                                        apartment
                                    ) => {
                                        const id =
                                            getId(
                                                apartment
                                            );

                                        return (
                                            <option
                                                key={
                                                    id
                                                }
                                                value={
                                                    id
                                                }
                                            >
                                                {getName(
                                                    apartment,
                                                    `Apartment #${id}`
                                                )}
                                            </option>
                                        );
                                    }
                                )}
                            </select>

                            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {/* -------------------------------------------------- */}
                    {/* STATUS */}
                    {/* -------------------------------------------------- */}

                    <div>
                        <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />

                            Status
                        </label>

                        <div className="relative">
                            <select
                                value={
                                    status
                                }
                                onChange={(
                                    event
                                ) =>
                                    handleChange(
                                        "status",
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className={
                                    selectClass
                                }
                            >
                                {statusOptions.map(
                                    (
                                        option
                                    ) => (
                                        <option
                                            key={
                                                option.value ||
                                                "all"
                                            }
                                            value={
                                                option.value
                                            }
                                        >
                                            {
                                                option.label
                                            }
                                        </option>
                                    )
                                )}
                            </select>

                            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {/* -------------------------------------------------- */}
                    {/* FLOOR */}
                    {/* -------------------------------------------------- */}

                    <div>
                        <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                            <Layers3 className="h-3.5 w-3.5" />

                            Floor
                        </label>

                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                value={
                                    floor
                                }
                                onChange={(
                                    event
                                ) =>
                                    handleChange(
                                        "floor",
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Any floor"
                                className={
                                    inputClass
                                }
                            />

                            <Hash className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                        </div>
                    </div>

                    {/* -------------------------------------------------- */}
                    {/* UNIT TYPE */}
                    {/* -------------------------------------------------- */}

                    {normalizedUnitTypes.length >
                        0 && (
                        <div>
                            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                                <Home className="h-3.5 w-3.5" />

                                Unit Type
                            </label>

                            <div className="relative">
                                <select
                                    value={
                                        type
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        handleChange(
                                            "type",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    className={
                                        selectClass
                                    }
                                >
                                    <option value="">
                                        All Types
                                    </option>

                                    {normalizedUnitTypes.map(
                                        (
                                            option,
                                            index
                                        ) => {
                                            const value =
                                                typeof option ===
                                                "object"
                                                    ? option?.value ??
                                                      option?.id ??
                                                      ""
                                                    : option;

                                            const label =
                                                typeof option ===
                                                "object"
                                                    ? option?.label ??
                                                      option?.name ??
                                                      option?.title ??
                                                      value
                                                    : option;

                                            return (
                                                <option
                                                    key={`${value}-${index}`}
                                                    value={
                                                        value
                                                    }
                                                >
                                                    {
                                                        label
                                                    }
                                                </option>
                                            );
                                        }
                                    )}
                                </select>

                                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                    )}
                </div>

                {/* ------------------------------------------------------ */}
                {/* ACTIVE FILTERS */}
                {/* ------------------------------------------------------ */}

                <div className="mt-6 border-t border-gray-100 pt-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <div className="flex shrink-0 items-center gap-2 pt-1">
                            <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                Active Filters
                            </span>

                            {activeFilterCount >
                                0 && (
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                                    {
                                        activeFilterCount
                                    }
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search */}
                            {search && (
                                <FilterBadge
                                    label={`Search: ${search}`}
                                    onRemove={() =>
                                        removeFilter(
                                            "search"
                                        )
                                    }
                                />
                            )}

                            {/* Property */}
                            {propertyId && (
                                <FilterBadge
                                    label={`Property: ${getName(
                                        normalizedProperties.find(
                                            (
                                                item
                                            ) =>
                                                String(
                                                    getId(
                                                        item
                                                    )
                                                ) ===
                                                String(
                                                    propertyId
                                                )
                                        ),
                                        `#${propertyId}`
                                    )}`}
                                    onRemove={() =>
                                        removeFilter(
                                            "property_id"
                                        )
                                    }
                                    color="blue"
                                />
                            )}

                            {/* Apartment */}
                            {apartmentId && (
                                <FilterBadge
                                    label={`Apartment: ${getName(
                                        normalizedApartments.find(
                                            (
                                                item
                                            ) =>
                                                String(
                                                    getId(
                                                        item
                                                    )
                                                ) ===
                                                String(
                                                    apartmentId
                                                )
                                        ),
                                        `#${apartmentId}`
                                    )}`}
                                    onRemove={() =>
                                        removeFilter(
                                            "apartment_id"
                                        )
                                    }
                                    color="purple"
                                />
                            )}

                            {/* Status */}
                            {status && (
                                <FilterBadge
                                    label={`Status: ${
                                        statusOptions.find(
                                            (
                                                item
                                            ) =>
                                                item.value ===
                                                status
                                        )
                                            ?.label ??
                                        status
                                    }`}
                                    onRemove={() =>
                                        removeFilter(
                                            "status"
                                        )
                                    }
                                    color={
                                        status ===
                                        "vacant"
                                            ? "green"
                                            : status ===
                                                "occupied"
                                              ? "blue"
                                              : status ===
                                                  "maintenance"
                                                ? "orange"
                                                : "purple"
                                    }
                                />
                            )}

                            {/* Floor */}
                            {floor !==
                                "" && (
                                <FilterBadge
                                    label={`Floor: ${floor}`}
                                    onRemove={() =>
                                        removeFilter(
                                            "floor"
                                        )
                                    }
                                    color="gray"
                                />
                            )}

                            {/* Type */}
                            {type && (
                                <FilterBadge
                                    label={`Type: ${
                                        normalizedUnitTypes.find(
                                            (
                                                item
                                            ) =>
                                                (typeof item ===
                                                "object"
                                                    ? item?.value
                                                    : item) ===
                                                type
                                        )?.label ??
                                        normalizedUnitTypes.find(
                                            (
                                                item
                                            ) =>
                                                (typeof item ===
                                                "object"
                                                    ? item?.value
                                                    : item) ===
                                                type
                                        )?.name ??
                                        type
                                    }`}
                                    onRemove={() =>
                                        removeFilter(
                                            "type"
                                        )
                                    }
                                    color="indigo"
                                />
                            )}

                            {/* None */}
                            {activeFilterCount ===
                                0 && (
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />

                                    No filters
                                    applied
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/*
|--------------------------------------------------------------------------
| FILTER BADGE
|--------------------------------------------------------------------------
*/

const FilterBadge = ({
    label,
    onRemove,
    color = "gray",
}) => {
    const colorClasses = {
        gray:
            "border-gray-200 bg-gray-50 text-gray-700",
        blue:
            "border-blue-100 bg-blue-50 text-blue-700",
        green:
            "border-emerald-100 bg-emerald-50 text-emerald-700",
        purple:
            "border-purple-100 bg-purple-50 text-purple-700",
        orange:
            "border-orange-100 bg-orange-50 text-orange-700",
        indigo:
            "border-indigo-100 bg-indigo-50 text-indigo-700",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${colorClasses[color] ?? colorClasses.gray}`}
        >
            <span className="max-w-[220px] truncate">
                {label}
            </span>

            <button
                type="button"
                onClick={onRemove}
                className="rounded-full p-0.5 opacity-60 transition hover:bg-black/5 hover:opacity-100"
                title="Remove filter"
            >
                <X className="h-3 w-3" />
            </button>
        </span>
    );
};

export default UnitFilters;

