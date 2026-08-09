
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Building2,
    CalendarDays,
    Check,
    ChevronDown,
    DollarSign,
    FileText,
    Home,
    Loader2,
    Save,
    Sparkles,
    SquareStack,
    X,
} from "lucide-react";

import Swal from "sweetalert2";

/*
|--------------------------------------------------------------------------
| DEFAULT FORM
|--------------------------------------------------------------------------
*/

const DEFAULT_FORM = {
    property_id: "",
    apartment_id: "",

    unit_number: "",
    unit_name: "",
    description: "",

    status: "vacant",
    type: "apartment",

    bedrooms: 1,
    bathrooms: 1,
    toilets: 1,
    floor: 1,

    size: "",
    size_unit: "sqm",

    price: "",
    deposit: "",
    service_charge: "",

    has_balcony: false,
    has_wifi: false,
    has_furnished: false,
    has_air_conditioning: false,

    thumbnail: "",
    available_from: "",

    notes: "",
};

/*
|--------------------------------------------------------------------------
| STATUS OPTIONS
|--------------------------------------------------------------------------
*/

const STATUS_OPTIONS = [
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
| TYPE OPTIONS
|--------------------------------------------------------------------------
*/

const TYPE_OPTIONS = [
    {
        value: "bedsitter",
        label: "Bedsitter",
    },
    {
        value: "studio",
        label: "Studio",
    },
    {
        value: "apartment",
        label: "Apartment",
    },
    {
        value: "one_bedroom",
        label: "1 Bedroom",
    },
    {
        value: "two_bedroom",
        label: "2 Bedroom",
    },
    {
        value: "three_bedroom",
        label: "3 Bedroom",
    },
    {
        value: "four_bedroom",
        label: "4 Bedroom",
    },
    {
        value: "penthouse",
        label: "Penthouse",
    },
    {
        value: "shop",
        label: "Shop",
    },
    {
        value: "office",
        label: "Office",
    },
];

/*
|--------------------------------------------------------------------------
| SIZE UNITS
|--------------------------------------------------------------------------
*/

const SIZE_UNITS = [
    {
        value: "sqm",
        label: "Square Metres (m²)",
    },
    {
        value: "sqft",
        label: "Square Feet (ft²)",
    },
];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Normalize Laravel/API collection responses.
 *
 * Supports:
 * []
 *
 * {
 *     data: []
 * }
 *
 * {
 *     data: {
 *         data: []
 *     }
 * }
 *
 * {
 *     results: []
 * }
 *
 * {
 *     items: []
 * }
 */
const normalizeCollection = (response) => {
    if (!response) {
        return [];
    }

    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response.data)) {
        return response.data;
    }

    if (Array.isArray(response.data?.data)) {
        return response.data.data;
    }

    if (Array.isArray(response.results)) {
        return response.results;
    }

    if (Array.isArray(response.items)) {
        return response.items;
    }

    return [];
};

/**
 * Safely extract an ID.
 */
const getId = (item) => {
    if (
        item === null ||
        item === undefined ||
        item === ""
    ) {
        return "";
    }

    if (typeof item === "object") {
        return (
            item.id ??
            item.value ??
            item.property_id ??
            item.apartment_id ??
            ""
        );
    }

    return item;
};

/**
 * Safely extract a display name.
 */
const getName = (
    item,
    fallback = ""
) => {
    if (!item) {
        return fallback;
    }

    if (typeof item === "string") {
        return item;
    }

    return (
        item.name ??
        item.title ??
        item.label ??
        item.property_name ??
        item.apartment_name ??
        item.display_name ??
        fallback
    );
};

/**
 * Normalize IDs that may arrive as:
 *
 * number
 * string
 * object
 * Laravel resource
 */
const normalizeId = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "";
    }

    if (typeof value === "object") {
        return String(
            value.id ??
                value.value ??
                value.property_id ??
                value.apartment_id ??
                ""
        );
    }

    return String(value);
};

/**
 * Normalize enum/resource values.
 *
 * Supports:
 *
 * "vacant"
 *
 * {
 *     value: "vacant",
 *     label: "Vacant"
 * }
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

    if (typeof value === "object") {
        return String(
            value.value ??
                value.id ??
                fallback
        );
    }

    return String(value);
};

/**
 * Convert API date into HTML date input format.
 */
const formatDateForInput = (value) => {
    if (!value) {
        return "";
    }

    if (
        typeof value === "string"
    ) {
        return value.substring(0, 10);
    }

    try {
        return new Date(value)
            .toISOString()
            .substring(0, 10);
    } catch {
        return "";
    }
};

/**
 * Convert API boolean-ish values into
 * real JavaScript booleans.
 */
const normalizeBoolean = (value) => {
    return (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true"
    );
};

/**
 * Safely convert numeric values.
 */
const normalizeNumber = (
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

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
};

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

const UnitForm = ({
    unit = null,

    properties = [],
    apartments = [],

    loading = false,
    submitting = false,

    error = null,

    onSubmit,
    onCancel,

    title,
    submitLabel,
}) => {
    const isEditing = Boolean(unit?.id);

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [form, setForm] = useState({
        ...DEFAULT_FORM,
    });

    const [errors, setErrors] = useState({});

    const [
        thumbnailPreview,
        setThumbnailPreview,
    ] = useState("");

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE PROPERTIES
    |--------------------------------------------------------------------------
    */

    const propertyOptions = useMemo(
        () =>
            normalizeCollection(
                properties
            ),
        [properties]
    );

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE APARTMENTS
    |--------------------------------------------------------------------------
    */

    const apartmentOptions = useMemo(
        () =>
            normalizeCollection(
                apartments
            ),
        [apartments]
    );

    /*
    |--------------------------------------------------------------------------
    | FILTER APARTMENTS BY PROPERTY
    |--------------------------------------------------------------------------
    */

    const filteredApartments =
        useMemo(() => {
            if (!form.property_id) {
                return [];
            }

            return apartmentOptions.filter(
                (apartment) => {
                    const apartmentPropertyId =
                        apartment?.property_id ??
                        apartment?.property?.id ??
                        apartment?.property?.value ??
                        apartment?.property?.property_id;

                    return (
                        normalizeId(
                            apartmentPropertyId
                        ) ===
                        normalizeId(
                            form.property_id
                        )
                    );
                }
            );
        }, [
            apartmentOptions,
            form.property_id,
        ]);

    /*
    |--------------------------------------------------------------------------
    | POPULATE FORM
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!unit) {
            setForm({
                ...DEFAULT_FORM,
            });

            setErrors({});
            setThumbnailPreview("");

            return;
        }

        const propertyId =
            unit.property_id ??
            unit.property?.id ??
            unit.property?.value ??
            unit.property?.property_id ??
            "";

        const apartmentId =
            unit.apartment_id ??
            unit.apartment?.id ??
            unit.apartment?.value ??
            unit.apartment?.apartment_id ??
            "";

        const thumbnail =
            unit.thumbnail_url ??
            unit.thumbnail ??
            unit.image_url ??
            unit.image ??
            "";

        setForm({
            property_id:
                normalizeId(propertyId),

            apartment_id:
                normalizeId(apartmentId),

            unit_number:
                unit.unit_number ??
                unit.number ??
                "",

            unit_name:
                unit.unit_name ??
                unit.name ??
                "",

            description:
                unit.description ??
                "",

            status:
                normalizeValue(
                    unit.status,
                    "vacant"
                ),

            type:
                normalizeValue(
                    unit.type ??
                        unit.unit_type,
                    "apartment"
                ),

            bedrooms:
                normalizeNumber(
                    unit.bedrooms,
                    1
                ),

            bathrooms:
                normalizeNumber(
                    unit.bathrooms,
                    1
                ),

            toilets:
                normalizeNumber(
                    unit.toilets,
                    1
                ),

            floor:
                normalizeNumber(
                    unit.floor ??
                        unit.floor_number,
                    1
                ),

            size:
                normalizeNumber(
                    unit.size ??
                        unit.area,
                    ""
                ),

            size_unit:
                normalizeValue(
                    unit.size_unit,
                    "sqm"
                ),

            price:
                normalizeNumber(
                    unit.price ??
                        unit.rent ??
                        unit.rent_amount,
                    ""
                ),

            deposit:
                normalizeNumber(
                    unit.deposit,
                    ""
                ),

            service_charge:
                normalizeNumber(
                    unit.service_charge,
                    ""
                ),

            has_balcony:
                normalizeBoolean(
                    unit.has_balcony
                ),

            has_wifi:
                normalizeBoolean(
                    unit.has_wifi
                ),

            has_furnished:
                normalizeBoolean(
                    unit.has_furnished
                ),

            has_air_conditioning:
                normalizeBoolean(
                    unit.has_air_conditioning
                ),

            thumbnail:
                unit.thumbnail ??
                "",

            available_from:
                formatDateForInput(
                    unit.available_from
                ),

            notes:
                unit.notes ??
                "",
        });

        setErrors({});
        setThumbnailPreview(
            thumbnail
        );
    }, [unit]);

    /*
    |--------------------------------------------------------------------------
    | KEEP APARTMENT VALID
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!form.apartment_id) {
            return;
        }

        const exists =
            filteredApartments.some(
                (apartment) =>
                    normalizeId(
                        getId(apartment)
                    ) ===
                    normalizeId(
                        form.apartment_id
                    )
            );

        if (!exists) {
            setForm((previous) => ({
                ...previous,
                apartment_id: "",
            }));
        }
    }, [
        filteredApartments,
        form.apartment_id,
    ]);

    /*
    |--------------------------------------------------------------------------
    | INPUT CHANGE
    |--------------------------------------------------------------------------
    */

    const handleChange =
        useCallback((event) => {
            const {
                name,
                value,
                type,
                checked,
            } = event.target;

            setForm((previous) => ({
                ...previous,

                [name]:
                    type === "checkbox"
                        ? checked
                        : value,
            }));

            setErrors((previous) => {
                if (!previous[name]) {
                    return previous;
                }

                const next = {
                    ...previous,
                };

                delete next[name];

                return next;
            });
        }, []);

    /*
    |--------------------------------------------------------------------------
    | PROPERTY CHANGE
    |--------------------------------------------------------------------------
    */

    const handlePropertyChange =
        useCallback((event) => {
            const propertyId =
                event.target.value;

            setForm((previous) => ({
                ...previous,
                property_id:
                    propertyId,
                apartment_id: "",
            }));

            setErrors((previous) => {
                const next = {
                    ...previous,
                };

                delete next.property_id;
                delete next.apartment_id;

                return next;
            });
        }, []);

    /*
    |--------------------------------------------------------------------------
    | THUMBNAIL CHANGE
    |--------------------------------------------------------------------------
    */

    const handleThumbnailChange =
        useCallback((event) => {
            const value =
                event.target.value;

            setForm((previous) => ({
                ...previous,
                thumbnail: value,
            }));

            setThumbnailPreview(value);

            setErrors((previous) => {
                if (!previous.thumbnail) {
                    return previous;
                }

                const next = {
                    ...previous,
                };

                delete next.thumbnail;

                return next;
            });
        }, []);

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    const validate =
        useCallback(() => {
            const validationErrors =
                {};

            if (!form.property_id) {
                validationErrors.property_id =
                    "Please select a property.";
            }

            if (
                !form.unit_number?.trim()
            ) {
                validationErrors.unit_number =
                    "Unit number is required.";
            }

            if (!form.type) {
                validationErrors.type =
                    "Please select the unit type.";
            }

            if (!form.status) {
                validationErrors.status =
                    "Please select the unit status.";
            }

            if (
                form.price !== "" &&
                (
                    !Number.isFinite(
                        Number(form.price)
                    ) ||
                    Number(form.price) < 0
                )
            ) {
                validationErrors.price =
                    "Enter a valid non-negative rent amount.";
            }

            if (
                form.deposit !== "" &&
                (
                    !Number.isFinite(
                        Number(form.deposit)
                    ) ||
                    Number(form.deposit) < 0
                )
            ) {
                validationErrors.deposit =
                    "Enter a valid non-negative deposit.";
            }

            if (
                form.service_charge !== "" &&
                (
                    !Number.isFinite(
                        Number(
                            form.service_charge
                        )
                    ) ||
                    Number(
                        form.service_charge
                    ) < 0
                )
            ) {
                validationErrors.service_charge =
                    "Enter a valid non-negative service charge.";
            }

            if (
                form.size !== "" &&
                (
                    !Number.isFinite(
                        Number(form.size)
                    ) ||
                    Number(form.size) < 0
                )
            ) {
                validationErrors.size =
                    "Enter a valid non-negative size.";
            }

            if (
                form.bedrooms !== "" &&
                Number(form.bedrooms) < 0
            ) {
                validationErrors.bedrooms =
                    "Bedrooms cannot be negative.";
            }

            if (
                form.bathrooms !== "" &&
                Number(form.bathrooms) < 0
            ) {
                validationErrors.bathrooms =
                    "Bathrooms cannot be negative.";
            }

            if (
                form.toilets !== "" &&
                Number(form.toilets) < 0
            ) {
                validationErrors.toilets =
                    "Toilets cannot be negative.";
            }

            if (
                form.floor !== "" &&
                Number(form.floor) < 0
            ) {
                validationErrors.floor =
                    "Floor cannot be negative.";
            }

            setErrors(
                validationErrors
            );

            return (
                Object.keys(
                    validationErrors
                ).length === 0
            );
        }, [form]);

    /*
    |--------------------------------------------------------------------------
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        if (!validate()) {
            await Swal.fire({
                icon: "warning",
                title: "Check the form",
                text:
                    "Please correct the highlighted fields.",
                confirmButtonText:
                    "Okay",
            });

            return;
        }

        const payload = {
            property_id:
                form.property_id
                    ? Number(
                          form.property_id
                      )
                    : null,

            apartment_id:
                form.apartment_id
                    ? Number(
                          form.apartment_id
                      )
                    : null,

            unit_number:
                form.unit_number.trim(),

            unit_name:
                form.unit_name?.trim() ||
                null,

            description:
                form.description?.trim() ||
                null,

            status:
                normalizeValue(
                    form.status,
                    "vacant"
                ),

            type:
                normalizeValue(
                    form.type,
                    "apartment"
                ),

            bedrooms:
                form.bedrooms === ""
                    ? 0
                    : Number(
                          form.bedrooms
                      ),

            bathrooms:
                form.bathrooms === ""
                    ? 0
                    : Number(
                          form.bathrooms
                      ),

            toilets:
                form.toilets === ""
                    ? 0
                    : Number(
                          form.toilets
                      ),

            floor:
                form.floor === ""
                    ? 0
                    : Number(
                          form.floor
                      ),

            size:
                form.size === ""
                    ? null
                    : Number(
                          form.size
                      ),

            size_unit:
                form.size_unit ||
                "sqm",

            price:
                form.price === ""
                    ? null
                    : Number(
                          form.price
                      ),

            deposit:
                form.deposit === ""
                    ? null
                    : Number(
                          form.deposit
                      ),

            service_charge:
                form.service_charge === ""
                    ? null
                    : Number(
                          form.service_charge
                      ),

            has_balcony:
                Boolean(
                    form.has_balcony
                ),

            has_wifi:
                Boolean(
                    form.has_wifi
                ),

            has_furnished:
                Boolean(
                    form.has_furnished
                ),

            has_air_conditioning:
                Boolean(
                    form.has_air_conditioning
                ),

            thumbnail:
                form.thumbnail?.trim() ||
                null,

            available_from:
                form.available_from ||
                null,

            notes:
                form.notes?.trim() ||
                null,
        };

        try {
            await onSubmit?.(payload);
        } catch (submitError) {
            console.error(
                "Unit form submission failed:",
                submitError
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | FIELD ERROR
    |--------------------------------------------------------------------------
    */

    const getFieldError = (
        field
    ) => {
        if (errors[field]) {
            return errors[field];
        }

        if (
            error?.errors &&
            typeof error.errors ===
                "object"
        ) {
            const serverError =
                error.errors[field];

            if (
                Array.isArray(
                    serverError
                )
            ) {
                return serverError[0];
            }

            if (
                typeof serverError ===
                "string"
            ) {
                return serverError;
            }
        }

        return null;
    };

    /*
    |--------------------------------------------------------------------------
    | SERVER ERROR MESSAGE
    |--------------------------------------------------------------------------
    */

    const serverErrorMessage =
        typeof error === "string"
            ? error
            : error?.message ??
              error?.error ??
              "Unable to save the unit. Please try again.";

    /*
    |--------------------------------------------------------------------------
    | SHARED INPUT CLASS
    |--------------------------------------------------------------------------
    */

    const inputClass = (field) => `
        w-full
        rounded-xl
        border
        ${
            getFieldError(field)
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
        }
        bg-white
        px-4
        py-3
        text-sm
        text-slate-900
        outline-none
        transition
        placeholder:text-slate-400
        focus:ring-4
        disabled:cursor-not-allowed
        disabled:bg-slate-50
        disabled:text-slate-500
    `;

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6"
            noValidate
        >
            {/* HEADER */}

            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Home size={22} />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {title ??
                                (isEditing
                                    ? "Edit Unit"
                                    : "Create Unit")}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {isEditing
                                ? "Update unit information and availability."
                                : "Add a new unit to your property."}
                        </p>
                    </div>
                </div>
            </div>

            {/* SERVER ERROR */}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-semibold">
                        Unable to save unit
                    </p>

                    <p className="mt-1">
                        {serverErrorMessage}
                    </p>
                </div>
            )}

            {/* PROPERTY & APARTMENT */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeader
                    icon={Building2}
                    title="Property & Location"
                    description="Select the property and apartment where this unit belongs."
                />

                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field
                        label="Property"
                        required
                        error={getFieldError(
                            "property_id"
                        )}
                    >
                        <div className="relative">
                            <select
                                name="property_id"
                                value={
                                    form.property_id
                                }
                                onChange={
                                    handlePropertyChange
                                }
                                disabled={
                                    loading ||
                                    submitting
                                }
                                className={`${inputClass(
                                    "property_id"
                                )} appearance-none pr-10`}
                            >
                                <option value="">
                                    Select property
                                </option>

                                {propertyOptions.map(
                                    (
                                        property
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

                                        return (
                                            <option
                                                key={String(
                                                    id
                                                )}
                                                value={String(
                                                    id
                                                )}
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

                            <ChevronDown
                                size={18}
                                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </div>
                    </Field>

                    <Field
                        label="Apartment"
                        error={getFieldError(
                            "apartment_id"
                        )}
                    >
                        <div className="relative">
                            <select
                                name="apartment_id"
                                value={
                                    form.apartment_id
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    loading ||
                                    submitting ||
                                    !form.property_id
                                }
                                className={`${inputClass(
                                    "apartment_id"
                                )} appearance-none pr-10`}
                            >
                                <option value="">
                                    {form.property_id
                                        ? "Select apartment"
                                        : "Select property first"}
                                </option>

                                {filteredApartments.map(
                                    (
                                        apartment
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

                                        return (
                                            <option
                                                key={String(
                                                    id
                                                )}
                                                value={String(
                                                    id
                                                )}
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

                            <ChevronDown
                                size={18}
                                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </div>

                        {form.property_id &&
                            filteredApartments.length ===
                                0 && (
                                <p className="mt-2 text-xs text-amber-600">
                                    No apartments are available for this property.
                                </p>
                            )}
                    </Field>
                </div>
            </section>

            {/* BASIC INFORMATION */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeader
                    icon={SquareStack}
                    title="Unit Information"
                    description="Enter the basic identification and classification details."
                />

                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    <Field
                        label="Unit Number"
                        required
                        error={getFieldError(
                            "unit_number"
                        )}
                    >
                        <input
                            type="text"
                            name="unit_number"
                            value={
                                form.unit_number
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="e.g. A101"
                            disabled={
                                submitting
                            }
                            className={inputClass(
                                "unit_number"
                            )}
                        />
                    </Field>

                    <Field
                        label="Unit Name"
                        error={getFieldError(
                            "unit_name"
                        )}
                    >
                        <input
                            type="text"
                            name="unit_name"
                            value={
                                form.unit_name
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="e.g. Grand Royale A101"
                            disabled={
                                submitting
                            }
                            className={inputClass(
                                "unit_name"
                            )}
                        />
                    </Field>

                    <Field
                        label="Unit Type"
                        required
                        error={getFieldError(
                            "type"
                        )}
                    >
                        <div className="relative">
                            <select
                                name="type"
                                value={
                                    form.type
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    submitting
                                }
                                className={`${inputClass(
                                    "type"
                                )} appearance-none pr-10`}
                            >
                                {TYPE_OPTIONS.map(
                                    (
                                        option
                                    ) => (
                                        <option
                                            key={
                                                option.value
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

                            <ChevronDown
                                size={18}
                                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </div>
                    </Field>

                    <Field
                        label="Status"
                        required
                        error={getFieldError(
                            "status"
                        )}
                    >
                        <div className="relative">
                            <select
                                name="status"
                                value={
                                    form.status
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    submitting
                                }
                                className={`${inputClass(
                                    "status"
                                )} appearance-none pr-10`}
                            >
                                {STATUS_OPTIONS.map(
                                    (
                                        option
                                    ) => (
                                        <option
                                            key={
                                                option.value
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

                            <ChevronDown
                                size={18}
                                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </div>
                    </Field>

                    <NumberField
                        label="Floor"
                        name="floor"
                        value={
                            form.floor
                        }
                        onChange={
                            handleChange
                        }
                        error={getFieldError(
                            "floor"
                        )}
                        disabled={
                            submitting
                        }
                    />
                </div>

                <div className="mt-5">
                    <Field
                        label="Description"
                        error={getFieldError(
                            "description"
                        )}
                    >
                        <textarea
                            name="description"
                            rows={4}
                            value={
                                form.description
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Describe the unit, layout, finishes, location and other useful details..."
                            disabled={
                                submitting
                            }
                            className={`${inputClass(
                                "description"
                            )} resize-none`}
                        />
                    </Field>
                </div>
            </section>

            {/* ROOMS & SIZE */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeader
                    icon={SquareStack}
                    title="Rooms & Size"
                    description="Specify the room configuration and unit size."
                />

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <NumberField
                        label="Bedrooms"
                        name="bedrooms"
                        value={
                            form.bedrooms
                        }
                        onChange={
                            handleChange
                        }
                        error={getFieldError(
                            "bedrooms"
                        )}
                        disabled={
                            submitting
                        }
                    />

                    <NumberField
                        label="Bathrooms"
                        name="bathrooms"
                        value={
                            form.bathrooms
                        }
                        onChange={
                            handleChange
                        }
                        error={getFieldError(
                            "bathrooms"
                        )}
                        disabled={
                            submitting
                        }
                    />

                    <NumberField
                        label="Toilets"
                        name="toilets"
                        value={
                            form.toilets
                        }
                        onChange={
                            handleChange
                        }
                        error={getFieldError(
                            "toilets"
                        )}
                        disabled={
                            submitting
                        }
                    />

                    <Field
                        label="Size"
                        error={getFieldError(
                            "size"
                        )}
                    >
                        <div className="flex">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                name="size"
                                value={
                                    form.size
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="0.00"
                                disabled={
                                    submitting
                                }
                                className={`${inputClass(
                                    "size"
                                )} rounded-r-none`}
                            />

                            <select
                                name="size_unit"
                                value={
                                    form.size_unit
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    submitting
                                }
                                className="rounded-r-xl border border-l-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none"
                            >
                                {SIZE_UNITS.map(
                                    (
                                        option
                                    ) => (
                                        <option
                                            key={
                                                option.value
                                            }
                                            value={
                                                option.value
                                            }
                                        >
                                            {
                                                option.value
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                    </Field>
                </div>
            </section>

            {/* PRICING */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeader
                    icon={DollarSign}
                    title="Pricing"
                    description="Configure monthly rent, deposit and service charges."
                />

                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                    <MoneyField
                        label="Rent Amount"
                        name="price"
                        value={
                            form.price
                        }
                        onChange={
                            handleChange
                        }
                        error={getFieldError(
                            "price"
                        )}
                        disabled={
                            submitting
                        }
                        placeholder="e.g. 35000"
                    />

                    <MoneyField
                        label="Deposit"
                        name="deposit"
                        value={
                            form.deposit
                        }
                        onChange={
                            handleChange
                        }
                        error={getFieldError(
                            "deposit"
                        )}
                        disabled={
                            submitting
                        }
                        placeholder="e.g. 35000"
                    />

                    <MoneyField
                        label="Service Charge"
                        name="service_charge"
                        value={
                            form.service_charge
                        }
                        onChange={
                            handleChange
                        }
                        error={getFieldError(
                            "service_charge"
                        )}
                        disabled={
                            submitting
                        }
                        placeholder="e.g. 5000"
                    />
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4">
                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            Currency
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                            Kenyan Shilling
                        </p>
                    </div>

                    <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm">
                        KES
                    </span>
                </div>
            </section>

            {/* FEATURES */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeader
                    icon={Sparkles}
                    title="Unit Features"
                    description="Select the facilities and features available in this unit."
                />

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <FeatureCheckbox
                        name="has_balcony"
                        label="Balcony"
                        description="Unit has a balcony"
                        checked={
                            form.has_balcony
                        }
                        onChange={
                            handleChange
                        }
                        disabled={
                            submitting
                        }
                    />

                    <FeatureCheckbox
                        name="has_wifi"
                        label="Wi-Fi"
                        description="Internet available"
                        checked={
                            form.has_wifi
                        }
                        onChange={
                            handleChange
                        }
                        disabled={
                            submitting
                        }
                    />

                    <FeatureCheckbox
                        name="has_furnished"
                        label="Furnished"
                        description="Fully or partially furnished"
                        checked={
                            form.has_furnished
                        }
                        onChange={
                            handleChange
                        }
                        disabled={
                            submitting
                        }
                    />

                    <FeatureCheckbox
                        name="has_air_conditioning"
                        label="Air Conditioning"
                        description="AC available"
                        checked={
                            form.has_air_conditioning
                        }
                        onChange={
                            handleChange
                        }
                        disabled={
                            submitting
                        }
                    />
                </div>
            </section>

            {/* AVAILABILITY & MEDIA */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeader
                    icon={CalendarDays}
                    title="Availability & Media"
                    description="Set the availability date and unit thumbnail."
                />

                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field
                        label="Available From"
                        error={getFieldError(
                            "available_from"
                        )}
                    >
                        <div className="relative">
                            <CalendarDays
                                size={18}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="date"
                                name="available_from"
                                value={
                                    form.available_from
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={
                                    submitting
                                }
                                className={`${inputClass(
                                    "available_from"
                                )} pl-11`}
                            />
                        </div>
                    </Field>

                    <Field
                        label="Thumbnail URL"
                        error={getFieldError(
                            "thumbnail"
                        )}
                    >
                        <input
                            type="url"
                            name="thumbnail"
                            value={
                                form.thumbnail
                            }
                            onChange={
                                handleThumbnailChange
                            }
                            placeholder="https://example.com/unit.jpg"
                            disabled={
                                submitting
                            }
                            className={inputClass(
                                "thumbnail"
                            )}
                        />
                    </Field>
                </div>

                {thumbnailPreview && (
                    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        <div className="aspect-[16/7] w-full">
                            <img
                                src={
                                    thumbnailPreview
                                }
                                alt="Unit preview"
                                className="h-full w-full object-cover"
                                onError={() =>
                                    setThumbnailPreview(
                                        ""
                                    )
                                }
                            />
                        </div>
                    </div>
                )}
            </section>

            {/* NOTES */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeader
                    icon={FileText}
                    title="Additional Notes"
                    description="Add internal notes or additional information about the unit."
                />

                <div className="mt-6">
                    <Field
                        label="Notes"
                        error={getFieldError(
                            "notes"
                        )}
                    >
                        <textarea
                            name="notes"
                            rows={5}
                            value={
                                form.notes
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Add any additional notes..."
                            disabled={
                                submitting
                            }
                            className={`${inputClass(
                                "notes"
                            )} resize-none`}
                        />
                    </Field>
                </div>
            </section>

            {/* ACTIONS */}

            <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:justify-end">
                {onCancel && (
                    <button
                        type="button"
                        onClick={
                            onCancel
                        }
                        disabled={
                            submitting
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={18} />
                        Cancel
                    </button>
                )}

                <button
                    type="submit"
                    disabled={
                        submitting ||
                        loading
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {submitting ? (
                        <>
                            <Loader2
                                size={18}
                                className="animate-spin"
                            />

                            Saving...
                        </>
                    ) : (
                        <>
                            {isEditing ? (
                                <Check
                                    size={18}
                                />
                            ) : (
                                <Save
                                    size={18}
                                />
                            )}

                            {submitLabel ??
                                (isEditing
                                    ? "Update Unit"
                                    : "Create Unit")}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

/*
|--------------------------------------------------------------------------
| SECTION HEADER
|--------------------------------------------------------------------------
*/

const SectionHeader = ({
    icon: Icon,
    title,
    description,
}) => {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon size={20} />
            </div>

            <div>
                <h3 className="text-base font-bold text-slate-900">
                    {title}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    {description}
                </p>
            </div>
        </div>
    );
};

/*
|--------------------------------------------------------------------------
| FIELD
|--------------------------------------------------------------------------
*/

const Field = ({
    label,
    required = false,
    error,
    children,
}) => {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
                {label}

                {required && (
                    <span className="ml-1 text-red-500">
                        *
                    </span>
                )}
            </label>

            {children}

            {error && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
};

/*
|--------------------------------------------------------------------------
| NUMBER FIELD
|--------------------------------------------------------------------------
*/

const NumberField = ({
    label,
    name,
    value,
    onChange,
    error,
    disabled,
}) => {
    return (
        <Field
            label={label}
            error={error}
        >
            <input
                type="number"
                min="0"
                step="1"
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`
                    w-full
                    rounded-xl
                    border
                    ${
                        error
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                            : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                    }
                    bg-white
                    px-4
                    py-3
                    text-sm
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:ring-4
                    disabled:cursor-not-allowed
                    disabled:bg-slate-50
                    disabled:text-slate-500
                `}
            />
        </Field>
    );
};

/*
|--------------------------------------------------------------------------
| MONEY FIELD
|--------------------------------------------------------------------------
*/

const MoneyField = ({
    label,
    name,
    value,
    onChange,
    error,
    disabled,
    placeholder,
}) => {
    return (
        <Field
            label={label}
            error={error}
        >
            <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-xs font-bold text-slate-500">
                    KES
                </span>

                <input
                    type="number"
                    min="0"
                    step="0.01"
                    name={name}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    placeholder={
                        placeholder
                    }
                    className={`
                        w-full
                        rounded-xl
                        border
                        ${
                            error
                                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                                : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                        }
                        bg-white
                        py-3
                        pl-16
                        pr-4
                        text-sm
                        text-slate-900
                        outline-none
                        transition
                        placeholder:text-slate-400
                        focus:ring-4
                        disabled:cursor-not-allowed
                        disabled:bg-slate-50
                        disabled:text-slate-500
                    `}
                />
            </div>
        </Field>
    );
};

/*
|--------------------------------------------------------------------------
| FEATURE CHECKBOX
|--------------------------------------------------------------------------
*/

const FeatureCheckbox = ({
    name,
    label,
    description,
    checked,
    onChange,
    disabled,
}) => {
    return (
        <label
            htmlFor={name}
            className={`
                flex
                items-start
                gap-3
                rounded-xl
                border
                p-4
                transition
                ${
                    checked
                        ? "border-indigo-200 bg-indigo-50/60"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                }
                ${
                    disabled
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer"
                }
            `}
        >
            <input
                id={name}
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="sr-only"
            />

            <div
                className={`
                    flex
                    h-5
                    w-5
                    shrink-0
                    items-center
                    justify-center
                    rounded-md
                    border
                    transition
                    ${
                        checked
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-slate-300 bg-white"
                    }
                `}
            >
                {checked && (
                    <Check
                        size={14}
                        className="text-white"
                    />
                )}
            </div>

            <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                    {label}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                    {description}
                </p>
            </div>
        </label>
    );
};

export default UnitForm;

