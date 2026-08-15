
import { useMemo, useCallback } from "react";

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
|
| Supports:
|
| - Direct arrays
| - { data: [] }
| - { data: { data: [] } }
| - { results: [] }
| - { items: [] }
| - Laravel API resources
| - Nested property resources
| - Nested apartment resources
| - Unit API structure:
|
|   property: {
|       id,
|       title,
|       property_code
|   }
|
|   apartment: {
|       id,
|       name,
|       block,
|       total_floors,
|       total_units
|   }
|
|   details: {
|       type,
|       floor
|   }
|
|   pricing: {
|       price,
|       formatted_price
|   }
|
|   status: {
|       value,
|       label
|   }
|
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

    const status = normalizeValue(
        filters?.status
    );

    const propertyId = normalizeId(
        filters?.property_id
    );

    const apartmentId = normalizeId(
        filters?.apartment_id
    );

    const floor = filters?.floor ?? "";

    const type = normalizeValue(
        filters?.type
    );

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE COLLECTIONS
    |--------------------------------------------------------------------------
    */

    const normalizedProperties = useMemo(
        () => normalizeCollection(properties),
        [properties]
    );

    const normalizedApartments = useMemo(
        () => normalizeCollection(apartments),
        [apartments]
    );

    const normalizedUnitTypes = useMemo(
        () => {
            const collection =
                normalizeCollection(unitTypes);

            /*
            |--------------------------------------------------------------------------
            | If unitTypes was not supplied, derive types from units if possible.
            |--------------------------------------------------------------------------
            |
            | This keeps the filter flexible if the parent later passes units.
            |--------------------------------------------------------------------------
            */

            return collection;
        },
        [unitTypes]
    );

    /*
    |--------------------------------------------------------------------------
    | STATUS OPTIONS
    |--------------------------------------------------------------------------
    */

    const statusOptions = useMemo(
        () => [
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
        ],
        []
    );

    /*
    |--------------------------------------------------------------------------
    | APARTMENTS FOR SELECTED PROPERTY
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Your API apartment object may look like:
    |
    | {
    |     id: 80,
    |     name: "Vista Grande Apartments Block E",
    |     block: "Block E"
    | }
    |
    | But the property relationship may be:
    |
    | apartment.property_id
    |
    | OR
    |
    | apartment.property.id
    |
    | OR
    |
    | apartment.property.data.id
    |
    |--------------------------------------------------------------------------
    */

    const availableApartments = useMemo(() => {
        if (!propertyId) {
            return normalizedApartments;
        }

        return normalizedApartments.filter(
            (apartment) => {
                const apartmentPropertyId =
                    getApartmentPropertyId(
                        apartment
                    );

                return (
                    normalizeId(
                        apartmentPropertyId
                    ) ===
                    normalizeId(
                        propertyId
                    )
                );
            }
        );
    }, [
        normalizedApartments,
        propertyId,
    ]);

    /*
    |--------------------------------------------------------------------------
    | SELECTED PROPERTY
    |--------------------------------------------------------------------------
    */

    const selectedProperty = useMemo(() => {
        if (!propertyId) {
            return null;
        }

        return (
            normalizedProperties.find(
                (property) =>
                    normalizeId(
                        getId(property)
                    ) ===
                    normalizeId(
                        propertyId
                    )
            ) ?? null
        );
    }, [
        normalizedProperties,
        propertyId,
    ]);

    /*
    |--------------------------------------------------------------------------
    | SELECTED APARTMENT
    |--------------------------------------------------------------------------
    */

    const selectedApartment = useMemo(() => {
        if (!apartmentId) {
            return null;
        }

        return (
            normalizedApartments.find(
                (apartment) =>
                    normalizeId(
                        getId(apartment)
                    ) ===
                    normalizeId(
                        apartmentId
                    )
            ) ?? null
        );
    }, [
        normalizedApartments,
        apartmentId,
    ]);

    /*
    |--------------------------------------------------------------------------
    | SELECTED STATUS
    |--------------------------------------------------------------------------
    */

    const selectedStatus = useMemo(
        () =>
            statusOptions.find(
                (option) =>
                    option.value ===
                    status
            ) ?? null,
        [
            status,
            statusOptions,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | SELECTED TYPE
    |--------------------------------------------------------------------------
    */

    const selectedUnitType = useMemo(() => {
        if (!type) {
            return null;
        }

        return (
            normalizedUnitTypes.find(
                (item) =>
                    normalizeValue(
                        getTypeValue(item)
                    ) ===
                    normalizeValue(type)
            ) ?? null
        );
    }, [
        normalizedUnitTypes,
        type,
    ]);

    /*
    |--------------------------------------------------------------------------
    | HANDLE FILTER CHANGE
    |--------------------------------------------------------------------------
    */

    const handleChange = useCallback(
        (field, value) => {
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
            | PROPERTY CHANGED
            |--------------------------------------------------------------------------
            |
            | Apartment belongs to property.
            | Therefore clear apartment whenever
            | the property changes.
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
        },
        [onFilterChange]
    );

    /*
    |--------------------------------------------------------------------------
    | REMOVE SINGLE FILTER
    |--------------------------------------------------------------------------
    */

    const removeFilter = useCallback(
        (field) => {
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

            /*
            |--------------------------------------------------------------------------
            | Removing property also removes apartment.
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
        },
        [onFilterChange]
    );

    /*
    |--------------------------------------------------------------------------
    | RESET FILTERS
    |--------------------------------------------------------------------------
    */

    const handleReset = useCallback(() => {
        if (
            typeof onReset ===
            "function"
        ) {
            onReset();
        }
    }, [onReset]);

    /*
    |--------------------------------------------------------------------------
    | ACTIVE FILTER COUNT
    |--------------------------------------------------------------------------
    */

    const activeFilterCount = useMemo(
        () =>
            [
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
                    value !==
                        undefined
            ).length,
        [
            search,
            status,
            propertyId,
            apartmentId,
            floor,
            type,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | SHARED CLASSES
    |--------------------------------------------------------------------------
    */

    const selectClass =
        "w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-10 text-sm font-medium text-gray-800 outline-none transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

    const inputClass =
        "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            {/* HEADER */}

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
                                Search and refine your unit inventory
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

            {/* FILTER BODY */}

            <div className="p-5 sm:p-6">

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

                    {/* SEARCH */}

                    <div className="xl:col-span-2">

                        <FilterLabel
                            icon={Search}
                            label="Search Units"
                        />

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
                                    aria-label="Clear search"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* PROPERTY */}

                    <div>

                        <FilterLabel
                            icon={
                                Building2
                            }
                            label="Property"
                        />

                        <SelectWrapper>

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
                                        property,
                                        index
                                    ) => {
                                        const id =
                                            getId(
                                                property
                                            );

                                        if (
                                            !id
                                        ) {
                                            return null;
                                        }

                                        const title =
                                            getPropertyName(
                                                property,
                                                `Property #${id}`
                                            );

                                        return (
                                            <option
                                                key={`${id}-${index}`}
                                                value={
                                                    id
                                                }
                                            >
                                                {
                                                    title
                                                }
                                            </option>
                                        );
                                    }
                                )}
                            </select>

                            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                        </SelectWrapper>
                    </div>

                    {/* APARTMENT */}

                    <div>

                        <FilterLabel
                            icon={
                                Home
                            }
                            label="Apartment"
                        />

                        <SelectWrapper>

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
                                    propertyId
                                        ? availableApartments.length ===
                                          0
                                        : normalizedApartments.length ===
                                          0
                                }
                                className={
                                    selectClass
                                }
                            >

                                <option value="">
                                    {propertyId
                                        ? availableApartments.length >
                                          0
                                            ? "All Apartments"
                                            : "No apartments found"
                                        : normalizedApartments.length >
                                            0
                                          ? "All Apartments"
                                          : "No apartments found"}
                                </option>

                                {availableApartments.map(
                                    (
                                        apartment,
                                        index
                                    ) => {
                                        const id =
                                            getId(
                                                apartment
                                            );

                                        if (
                                            !id
                                        ) {
                                            return null;
                                        }

                                        const label =
                                            getApartmentName(
                                                apartment,
                                                `Apartment #${id}`
                                            );

                                        return (
                                            <option
                                                key={`${id}-${index}`}
                                                value={
                                                    id
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

                        </SelectWrapper>

                        {propertyId &&
                            availableApartments.length ===
                                0 && (
                                <p className="mt-1.5 text-xs font-medium text-amber-600">
                                    No apartments found for the selected property.
                                </p>
                            )}
                    </div>

                    {/* STATUS */}

                    <div>

                        <FilterLabel
                            label="Status"
                            customIcon={
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                            }
                        />

                        <SelectWrapper>

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

                        </SelectWrapper>
                    </div>

                    {/* FLOOR */}

                    <div>

                        <FilterLabel
                            icon={
                                Layers3
                            }
                            label="Floor"
                        />

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

                    {/* UNIT TYPE */}

                    <div>

                        <FilterLabel
                            icon={
                                Home
                            }
                            label="Unit Type"
                        />

                        <SelectWrapper>

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
                                            getTypeValue(
                                                option
                                            );

                                        const label =
                                            getTypeLabel(
                                                option,
                                                value
                                            );

                                        if (
                                            !value
                                        ) {
                                            return null;
                                        }

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

                        </SelectWrapper>
                    </div>
                </div>

                {/* ACTIVE FILTERS */}

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

                            {/* SEARCH */}

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

                            {/* PROPERTY */}

                            {propertyId && (
                                <FilterBadge
                                    label={`Property: ${getPropertyName(
                                        selectedProperty,
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

                            {/* APARTMENT */}

                            {apartmentId && (
                                <FilterBadge
                                    label={`Apartment: ${getApartmentName(
                                        selectedApartment,
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

                            {/* STATUS */}

                            {status && (
                                <FilterBadge
                                    label={`Status: ${
                                        selectedStatus?.label ??
                                        formatLabel(
                                            status
                                        )
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

                            {/* FLOOR */}

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

                            {/* TYPE */}

                            {type && (
                                <FilterBadge
                                    label={`Type: ${getTypeLabel(
                                        selectedUnitType,
                                        type
                                    )}`}
                                    onRemove={() =>
                                        removeFilter(
                                            "type"
                                        )
                                    }
                                    color="indigo"
                                />
                            )}

                            {/* NONE */}

                            {activeFilterCount ===
                                0 && (
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />

                                    No filters applied
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
| FILTER LABEL
|--------------------------------------------------------------------------
*/

const FilterLabel = ({
    icon: Icon,
    customIcon,
    label,
}) => {
    return (
        <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
            {customIcon ??
                (Icon && (
                    <Icon className="h-3.5 w-3.5 text-gray-400" />
                ))}

            <span>{label}</span>
        </label>
    );
};

/*
|--------------------------------------------------------------------------
| SELECT WRAPPER
|--------------------------------------------------------------------------
*/

const SelectWrapper = ({
    children,
}) => {
    return (
        <div className="relative">
            {children}
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
            className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                colorClasses[
                    color
                ] ??
                colorClasses.gray
            }`}
        >
            <span className="max-w-[220px] truncate">
                {label}
            </span>

            <button
                type="button"
                onClick={onRemove}
                className="shrink-0 rounded-full p-0.5 opacity-60 transition hover:bg-black/5 hover:opacity-100"
                title="Remove filter"
                aria-label={`Remove ${label}`}
            >
                <X className="h-3 w-3" />
            </button>
        </span>
    );
};

/*
|--------------------------------------------------------------------------
| NORMALIZE COLLECTION
|--------------------------------------------------------------------------
*/

const normalizeCollection = (
    response
) => {
    if (!response) {
        return [];
    }

    if (Array.isArray(response)) {
        return response;
    }

    if (
        Array.isArray(
            response?.data
        )
    ) {
        return response.data;
    }

    if (
        Array.isArray(
            response?.data?.data
        )
    ) {
        return response.data.data;
    }

    if (
        Array.isArray(
            response?.results
        )
    ) {
        return response.results;
    }

    if (
        Array.isArray(
            response?.items
        )
    ) {
        return response.items;
    }

    return [];
};

/*
|--------------------------------------------------------------------------
| GET ID
|--------------------------------------------------------------------------
*/

const getId = (item) => {
    if (!item) {
        return "";
    }

    if (
        typeof item !==
        "object"
    ) {
        return item;
    }

    return (
        item?.id ??
        item?.value ??
        item?.data?.id ??
        item?.data?.value ??
        item?.property_id ??
        item?.apartment_id ??
        ""
    );
};

/*
|--------------------------------------------------------------------------
| NORMALIZE ID
|--------------------------------------------------------------------------
*/

const normalizeId = (
    value
) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "";
    }

    if (
        typeof value ===
        "object"
    ) {
        return String(
            value?.id ??
                value?.value ??
                value?.data?.id ??
                value?.data?.value ??
                ""
        );
    }

    return String(value);
};

/*
|--------------------------------------------------------------------------
| GET PROPERTY NAME
|--------------------------------------------------------------------------
|
| Supports:
|
| property.title
| property.name
| property.label
| property.display_name
|
|--------------------------------------------------------------------------
*/

const getPropertyName = (
    item,
    fallback = ""
) => {
    if (!item) {
        return fallback;
    }

    if (
        typeof item !==
        "object"
    ) {
        return String(item);
    }

    return (
        item?.title ??
        item?.name ??
        item?.label ??
        item?.display_name ??
        item?.property_name ??
        item?.data?.title ??
        item?.data?.name ??
        item?.data?.label ??
        fallback
    );
};

/*
|--------------------------------------------------------------------------
| GET APARTMENT NAME
|--------------------------------------------------------------------------
|
| Your API returns:
|
| "name": "Vista Grande Apartments Block E"
|
| "block": "Block E"
|
|--------------------------------------------------------------------------
*/

const getApartmentName = (
    item,
    fallback = ""
) => {
    if (!item) {
        return fallback;
    }

    if (
        typeof item !==
        "object"
    ) {
        return String(item);
    }

    const name =
        item?.name ??
        item?.title ??
        item?.label ??
        item?.display_name ??
        item?.apartment_name ??
        item?.data?.name ??
        item?.data?.title ??
        item?.data?.label;

    if (name) {
        return String(name);
    }

    if (item?.block) {
        return `Block ${String(
            item.block
        ).replace(
            /^Block\s+/i,
            ""
        )}`;
    }

    return fallback;
};

/*
|--------------------------------------------------------------------------
| GET APARTMENT PROPERTY ID
|--------------------------------------------------------------------------
|
| Handles all common Laravel relationship shapes.
|--------------------------------------------------------------------------
*/

const getApartmentPropertyId = (
    apartment
) => {
    if (!apartment) {
        return "";
    }

    return (
        apartment?.property_id ??
        apartment?.property?.id ??
        apartment?.property?.value ??
        apartment?.property?.data?.id ??
        apartment?.property?.data?.value ??
        apartment?.data?.property_id ??
        apartment?.data?.property?.id ??
        apartment?.data?.property?.value ??
        ""
    );
};

/*
|--------------------------------------------------------------------------
| NORMALIZE VALUE
|--------------------------------------------------------------------------
*/

const normalizeValue = (
    value,
    fallback = ""
) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return fallback;
    }

    if (
        typeof value ===
        "object"
    ) {
        return String(
            value?.value ??
                value?.id ??
                value?.data?.value ??
                value?.data?.id ??
                fallback
        );
    }

    return String(value);
};

/*
|--------------------------------------------------------------------------
| TYPE VALUE
|--------------------------------------------------------------------------
|
| Supports:
|
| "bedsitter"
|
| {
|     value: "bedsitter",
|     label: "Bedsitter"
| }
|
| {
|     type: "bedsitter"
| }
|
|--------------------------------------------------------------------------
*/

const getTypeValue = (
    item
) => {
    if (
        item === null ||
        item === undefined
    ) {
        return "";
    }

    if (
        typeof item !==
        "object"
    ) {
        return String(item);
    }

    return normalizeValue(
        item?.value ??
            item?.id ??
            item?.type ??
            item?.data?.value ??
            item?.data?.id ??
            item?.data?.type ??
            ""
    );
};

/*
|--------------------------------------------------------------------------
| TYPE LABEL
|--------------------------------------------------------------------------
*/

const getTypeLabel = (
    item,
    fallback = ""
) => {
    if (!item) {
        return formatLabel(
            fallback
        );
    }

    if (
        typeof item !==
        "object"
    ) {
        return formatLabel(
            String(item)
        );
    }

    return (
        item?.label ??
        item?.name ??
        item?.title ??
        item?.type_label ??
        item?.data?.label ??
        item?.data?.name ??
        item?.data?.title ??
        formatLabel(
            getTypeValue(
                item
            ) ||
                fallback
        )
    );
};

/*
|--------------------------------------------------------------------------
| FORMAT LABEL
|--------------------------------------------------------------------------
*/

const formatLabel = (
    value
) => {
    if (!value) {
        return "";
    }

    return String(value)
        .replace(
            /[_-]+/g,
            " "
        )
        .replace(
            /\b\w/g,
            (char) =>
                char.toUpperCase()
        );
};

export default UnitFilters;

