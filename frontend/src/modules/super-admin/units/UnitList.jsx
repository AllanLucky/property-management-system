import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { useDispatch } from "react-redux";

import Swal from "sweetalert2";

import {
    Plus,
    Loader2,
    RefreshCcw,
    AlertTriangle,
} from "lucide-react";

import useUnit from "../../../hooks/useUnits";

import {
    addNotification,
} from "../../../store/uiSlice";

import {
    UnitTable,
    UnitFilters,
    UnitStats,
} from "./";

/*
|--------------------------------------------------------------------------
| UNIT LIST
|--------------------------------------------------------------------------
*/

const UnitList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    /*
    |--------------------------------------------------------------------------
    | UNIT HOOK
    |--------------------------------------------------------------------------
    |
    | The page explicitly controls fetching.
    |
    */

    const {
        units = [],
        loading,
        error,
        getUnits,
        removeUnit,
        stats: hookStats,
    } = useUnit({
        autoFetch: false,
    });

    /*
    |--------------------------------------------------------------------------
    | LOCAL STATE
    |--------------------------------------------------------------------------
    */

    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState("");

    const [deletingId, setDeletingId] = useState(null);

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE VALUE
    |--------------------------------------------------------------------------
    */

    const normalize = useCallback((value) => {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "-";
        }

        if (typeof value === "object") {
            return String(
                value?.name ??
                    value?.title ??
                    value?.label ??
                    value?.value ??
                    value?.current ??
                    "-"
            );
        }

        return String(value);
    }, []);

    /*
    |--------------------------------------------------------------------------
    | ERROR MESSAGE
    |--------------------------------------------------------------------------
    */

    const getErrorMessage = useCallback((err) => {
        if (!err) {
            return "Failed to load units.";
        }

        if (typeof err === "string") {
            return err;
        }

        /*
        |--------------------------------------------------------------------------
        | Laravel normalized error
        |--------------------------------------------------------------------------
        */

        if (
            typeof err?.errors?.error === "string"
        ) {
            return err.errors.error;
        }

        if (
            typeof err?.errors?.message === "string"
        ) {
            return err.errors.message;
        }

        /*
        |--------------------------------------------------------------------------
        | Axios response
        |--------------------------------------------------------------------------
        */

        if (
            typeof err?.response?.data?.message ===
            "string"
        ) {
            return err.response.data.message;
        }

        /*
        |--------------------------------------------------------------------------
        | Axios validation/server error
        |--------------------------------------------------------------------------
        */

        if (
            typeof err?.response?.data?.errors?.error ===
            "string"
        ) {
            return err.response.data.errors.error;
        }

        /*
        |--------------------------------------------------------------------------
        | Standard Error
        |--------------------------------------------------------------------------
        */

        if (
            typeof err?.message === "string"
        ) {
            return err.message;
        }

        return "Failed to load units.";
    }, []);

    /*
    |--------------------------------------------------------------------------
    | UNIT NAME
    |--------------------------------------------------------------------------
    */

    const getUnitName = useCallback(
        (unit) => {
            const name = normalize(
                unit?.unit_name
            );

            if (name !== "-") {
                return name;
            }

            const nameFallback = normalize(
                unit?.name
            );

            if (nameFallback !== "-") {
                return nameFallback;
            }

            const unitNumber = normalize(
                unit?.unit_number
            );

            if (unitNumber !== "-") {
                return unitNumber;
            }

            return `Unit #${unit?.id ?? "-"}`;
        },
        [normalize]
    );

    /*
    |--------------------------------------------------------------------------
    | UNIT TYPE
    |--------------------------------------------------------------------------
    */

    const getUnitType = useCallback(
        (unit) => {
            const type =
                unit?.details?.type ??
                unit?.type ??
                unit?.unit_type ??
                unit?.category ??
                unit?.unit_category;

            if (
                type === null ||
                type === undefined ||
                type === ""
            ) {
                return "-";
            }

            /*
            |--------------------------------------------------------------------------
            | Object type
            |--------------------------------------------------------------------------
            */

            if (
                typeof type === "object"
            ) {
                const objectType =
                    type?.label ??
                    type?.name ??
                    type?.value ??
                    type?.title;

                if (!objectType) {
                    return "-";
                }

                return String(objectType)
                    .trim()
                    .replace(
                        /[_-]+/g,
                        " "
                    )
                    .replace(
                        /\b\w/g,
                        (char) =>
                            char.toUpperCase()
                    );
            }

            /*
            |--------------------------------------------------------------------------
            | String type
            |--------------------------------------------------------------------------
            */

            return String(type)
                .trim()
                .replace(
                    /[_-]+/g,
                    " "
                )
                .replace(
                    /\b\w/g,
                    (char) =>
                        char.toUpperCase()
                );
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | APARTMENT NAME
    |--------------------------------------------------------------------------
    */

    const getApartmentName = useCallback(
        (unit) => {
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
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | PROPERTY NAME
    |--------------------------------------------------------------------------
    */

    const getPropertyName = useCallback(
        (unit) => {
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
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | PRICE
    |--------------------------------------------------------------------------
    */

    const getPrice = useCallback(
        (unit) => {
            const price =
                unit?.pricing?.price ??
                unit?.pricing?.rent ??
                unit?.price ??
                unit?.rent_amount ??
                unit?.rent ??
                unit?.rent_price ??
                0;

            if (
                typeof price === "object" &&
                price !== null
            ) {
                return (
                    price?.amount ??
                    price?.value ??
                    price?.price ??
                    0
                );
            }

            return price;
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | FORMAT PRICE
    |--------------------------------------------------------------------------
    */

    const formatPrice = useCallback(
        (unit) => {
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
        },
        [getPrice]
    );

    /*
    |--------------------------------------------------------------------------
    | RENT
    |--------------------------------------------------------------------------
    */

    const getRent = useCallback(
        (unit) => {
            return getPrice(unit);
        },
        [getPrice]
    );

    /*
    |--------------------------------------------------------------------------
    | DEPOSIT
    |--------------------------------------------------------------------------
    */

    const getDeposit = useCallback(
        (unit) => {
            const deposit =
                unit?.pricing?.deposit ??
                unit?.deposit ??
                0;

            if (
                typeof deposit === "object" &&
                deposit !== null
            ) {
                return (
                    deposit?.amount ??
                    deposit?.value ??
                    deposit?.price ??
                    0
                );
            }

            return deposit;
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | SERVICE CHARGE
    |--------------------------------------------------------------------------
    */

    const getServiceCharge = useCallback(
        (unit) => {
            const serviceCharge =
                unit?.pricing?.service_charge ??
                unit?.service_charge ??
                0;

            if (
                typeof serviceCharge === "object" &&
                serviceCharge !== null
            ) {
                return (
                    serviceCharge?.amount ??
                    serviceCharge?.value ??
                    serviceCharge?.price ??
                    0
                );
            }

            return serviceCharge;
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | FORMAT MONEY
    |--------------------------------------------------------------------------
    */

    const formatMoney = useCallback(
        (value) => {
            const amount = Number(value);

            if (
                Number.isNaN(amount) ||
                amount <= 0
            ) {
                return "KES 0";
            }

            return `KES ${amount.toLocaleString(
                "en-KE",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                }
            )}`;
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    |
    | Handles:
    |
    | "occupied"
    |
    | {
    |     value: "occupied",
    |     label: "Occupied"
    | }
    |
    | {
    |     current: "occupied"
    | }
    |
    */

    const getStatus = useCallback(
        (unit) => {
            const status =
                unit?.status;

            if (
                status &&
                typeof status === "object"
            ) {
                return String(
                    status?.value ??
                        status?.current ??
                        status?.status ??
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
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | FETCH UNITS
    |--------------------------------------------------------------------------
    */

    const fetchUnits = useCallback(
        async (isRefresh = false) => {
            try {
                if (isRefresh) {
                    setRefreshing(true);
                }

                /*
                |--------------------------------------------------------------------------
                | IMPORTANT
                |--------------------------------------------------------------------------
                | Do not pass _t unless necessary.
                | with_relations gives UnitStats all unit data it needs.
                |--------------------------------------------------------------------------
                */

                await getUnits({
                    with_relations: true,
                });

                if (isRefresh) {
                    dispatch(
                        addNotification({
                            type: "success",
                            message:
                                "Units refreshed successfully.",
                        })
                    );
                }
            } catch (err) {
                console.error(
                    "FAILED TO FETCH UNITS:",
                    err
                );

                dispatch(
                    addNotification({
                        type: "error",
                        message:
                            getErrorMessage(err),
                    })
                );
            } finally {
                setRefreshing(false);
            }
        },
        [
            getUnits,
            dispatch,
            getErrorMessage,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | INITIAL LOAD
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        fetchUnits(false);
    }, [fetchUnits]);

    /*
    |--------------------------------------------------------------------------
    | DELETE UNIT
    |--------------------------------------------------------------------------
    */

    const handleDelete = useCallback(
        async (id) => {
            if (!id) {
                return;
            }

            const selectedUnit =
                units.find(
                    (item) =>
                        String(item?.id) ===
                        String(id)
                );

            const unitName =
                selectedUnit
                    ? getUnitName(
                          selectedUnit
                      )
                    : `Unit #${id}`;

            const result =
                await Swal.fire({
                    title: "Delete Unit?",

                    html: `
                        <p class="text-gray-600">
                            You are about to delete
                            <strong>${unitName}</strong>.
                        </p>

                        <p class="text-sm text-red-500 mt-2">
                            This action cannot be undone.
                        </p>
                    `,

                    icon: "warning",

                    showCancelButton: true,

                    confirmButtonText:
                        "Yes, delete it",

                    cancelButtonText:
                        "Cancel",

                    reverseButtons: true,

                    focusCancel: true,

                    customClass: {
                        popup:
                            "rounded-3xl",

                        confirmButton:
                            "px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold ml-2",

                        cancelButton:
                            "px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold",
                    },

                    buttonsStyling: false,
                });

            if (!result.isConfirmed) {
                return;
            }

            try {
                setDeletingId(id);

                Swal.fire({
                    title:
                        "Deleting Unit...",

                    html: `
                        <div class="flex flex-col items-center justify-center py-3">
                            <div
                                class="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"
                            ></div>

                            <p class="mt-4 text-sm text-gray-500">
                                Please wait while the unit is being deleted.
                            </p>
                        </div>
                    `,

                    allowOutsideClick: false,

                    allowEscapeKey: false,

                    showConfirmButton: false,

                    customClass: {
                        popup:
                            "rounded-3xl",
                    },
                });

                await removeUnit(id);

                Swal.close();

                dispatch(
                    addNotification({
                        type: "success",
                        message:
                            "Unit deleted successfully.",
                    })
                );

                await getUnits({
                    with_relations: true,
                });
            } catch (err) {
                console.error(
                    "DELETE UNIT FAILED:",
                    err
                );

                Swal.close();

                dispatch(
                    addNotification({
                        type: "error",
                        message:
                            getErrorMessage(err),
                    })
                );
            } finally {
                setDeletingId(null);
            }
        },
        [
            units,
            getUnitName,
            removeUnit,
            getUnits,
            dispatch,
            getErrorMessage,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | FILTER UNITS
    |--------------------------------------------------------------------------
    */

    const filteredUnits = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        if (!query) {
            return units;
        }

        return units.filter((unit) => {
            const unitName =
                getUnitName(unit)
                    .toLowerCase();

            const unitNumber =
                normalize(
                    unit?.unit_number
                ).toLowerCase();

            const unitType =
                getUnitType(unit)
                    .toLowerCase();

            const propertyName =
                getPropertyName(unit)
                    .toLowerCase();

            const apartmentName =
                getApartmentName(unit)
                    .toLowerCase();

            const propertyCode =
                normalize(
                    unit?.property
                        ?.property_code
                ).toLowerCase();

            const apartmentBlock =
                normalize(
                    unit?.apartment?.block
                ).toLowerCase();

            return (
                unitName.includes(query) ||
                unitNumber.includes(query) ||
                unitType.includes(query) ||
                propertyName.includes(query) ||
                propertyCode.includes(query) ||
                apartmentName.includes(query) ||
                apartmentBlock.includes(query)
            );
        });
    }, [
        units,
        search,
        normalize,
        getUnitName,
        getUnitType,
        getPropertyName,
        getApartmentName,
    ]);

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE HOOK STATS
    |--------------------------------------------------------------------------
    */

    const normalizedHookStats = useMemo(() => {
        if (
            !hookStats ||
            typeof hookStats !== "object"
        ) {
            return null;
        }

        return {
            total: Number(
                hookStats.total ?? 0
            ),

            vacant: Number(
                hookStats.vacant ?? 0
            ),

            occupied: Number(
                hookStats.occupied ?? 0
            ),

            maintenance: Number(
                hookStats.maintenance ?? 0
            ),

            reserved: Number(
                hookStats.reserved ?? 0
            ),

            inactive: Number(
                hookStats.inactive ?? 0
            ),

            available: Number(
                hookStats.available ??
                    hookStats.vacant ??
                    0
            ),

            unavailable: Number(
                hookStats.unavailable ??
                    0
            ),
        };
    }, [hookStats]);

    /*
    |--------------------------------------------------------------------------
    | FALLBACK STATISTICS
    |--------------------------------------------------------------------------
    |
    | Calculate directly from the loaded units.
    |
    | This protects the UI even if the hook stats structure changes.
    |
    */

    const calculatedStats = useMemo(() => {
        const result = {
            total: units.length,
            vacant: 0,
            occupied: 0,
            maintenance: 0,
            reserved: 0,
            inactive: 0,
            available: 0,
            unavailable: 0,
            unknown: 0,
        };

        units.forEach((unit) => {
            const status =
                getStatus(unit);

            switch (status) {
                case "vacant":
                    result.vacant += 1;
                    result.available += 1;
                    break;

                case "available":
                    result.vacant += 1;
                    result.available += 1;
                    break;

                case "occupied":
                    result.occupied += 1;
                    break;

                case "maintenance":
                    result.maintenance += 1;
                    break;

                case "reserved":
                    result.reserved += 1;
                    break;

                case "inactive":
                    result.inactive += 1;
                    break;

                default:
                    result.unknown += 1;
                    break;
            }
        });

        result.unavailable =
            result.occupied +
            result.reserved +
            result.maintenance;

        /*
        |--------------------------------------------------------------------------
        | Rates
        |--------------------------------------------------------------------------
        */

        result.occupancyRate =
            result.total > 0
                ? Number(
                      (
                          (result.occupied /
                              result.total) *
                          100
                      ).toFixed(1)
                  )
                : 0;

        result.vacancyRate =
            result.total > 0
                ? Number(
                      (
                          (result.vacant /
                              result.total) *
                          100
                      ).toFixed(1)
                  )
                : 0;

        result.reservedRate =
            result.total > 0
                ? Number(
                      (
                          (result.reserved /
                              result.total) *
                          100
                      ).toFixed(1)
                  )
                : 0;

        result.maintenanceRate =
            result.total > 0
                ? Number(
                      (
                          (result.maintenance /
                              result.total) *
                          100
                      ).toFixed(1)
                  )
                : 0;

        result.unavailableRate =
            result.total > 0
                ? Number(
                      (
                          (result.unavailable /
                              result.total) *
                          100
                      ).toFixed(1)
                  )
                : 0;

        return result;
    }, [
        units,
        getStatus,
    ]);

    /*
    |--------------------------------------------------------------------------
    | FINAL STATISTICS
    |--------------------------------------------------------------------------
    |
    | Prefer calculated statistics because they are guaranteed to correspond
    | to the actual units currently displayed.
    |
    */

    const stats = useMemo(() => {
        /*
        |--------------------------------------------------------------------------
        | If units have loaded, calculate from them.
        |--------------------------------------------------------------------------
        */

        if (units.length > 0) {
            return calculatedStats;
        }

        /*
        |--------------------------------------------------------------------------
        | If there are no units but hook has valid server stats,
        | preserve those values.
        |--------------------------------------------------------------------------
        */

        if (
            normalizedHookStats &&
            normalizedHookStats.total > 0
        ) {
            const total =
                normalizedHookStats.total;

            const occupied =
                normalizedHookStats.occupied;

            const vacant =
                normalizedHookStats.vacant;

            const reserved =
                normalizedHookStats.reserved;

            const maintenance =
                normalizedHookStats.maintenance;

            const unavailable =
                occupied +
                reserved +
                maintenance;

            return {
                ...normalizedHookStats,

                total,

                occupancyRate:
                    total > 0
                        ? Number(
                              (
                                  (occupied /
                                      total) *
                                  100
                              ).toFixed(1)
                          )
                        : 0,

                vacancyRate:
                    total > 0
                        ? Number(
                              (
                                  (vacant /
                                      total) *
                                  100
                              ).toFixed(1)
                          )
                        : 0,

                reservedRate:
                    total > 0
                        ? Number(
                              (
                                  (reserved /
                                      total) *
                                  100
                              ).toFixed(1)
                          )
                        : 0,

                maintenanceRate:
                    total > 0
                        ? Number(
                              (
                                  (maintenance /
                                      total) *
                                  100
                              ).toFixed(1)
                          )
                        : 0,

                unavailable,
            };
        }

        /*
        |--------------------------------------------------------------------------
        | Empty state
        |--------------------------------------------------------------------------
        */

        return calculatedStats;
    }, [
        units.length,
        calculatedStats,
        normalizedHookStats,
    ]);

    /*
    |--------------------------------------------------------------------------
    | DEBUG STATISTICS
    |--------------------------------------------------------------------------
    |
    | Keep this temporarily while testing.
    |
    */

    useEffect(() => {
        console.log(
            "UNIT LIST - UNITS:",
            units
        );

        console.log(
            "UNIT LIST - HOOK STATS:",
            hookStats
        );

        console.log(
            "UNIT LIST - CALCULATED STATS:",
            calculatedStats
        );

        console.log(
            "UNIT LIST - FINAL STATS:",
            stats
        );
    }, [
        units,
        hookStats,
        calculatedStats,
        stats,
    ]);

    /*
    |--------------------------------------------------------------------------
    | INITIAL LOADING
    |--------------------------------------------------------------------------
    */

    if (
        loading &&
        units.length === 0
    ) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                    <Loader2
                        className="h-7 w-7 animate-spin text-blue-600"
                    />
                </div>

                <p className="mt-4 text-sm font-semibold text-gray-700">
                    Loading units...
                </p>

                <p className="mt-1 text-xs text-gray-400">
                    Please wait while we
                    load the units.
                </p>
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6">

            {/* ------------------------------------------------------------ */}
            {/* HEADER */}
            {/* ------------------------------------------------------------ */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Units
                    </h1>

                    <p className="mt-1 text-gray-500">
                        Manage apartment,
                        office, shop and
                        rental units.
                    </p>
                </div>

                <div className="flex items-center gap-3">

                    {/* REFRESH */}

                    <button
                        type="button"
                        onClick={() =>
                            fetchUnits(true)
                        }
                        disabled={
                            refreshing ||
                            loading
                        }
                        className="flex h-11 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCcw
                            size={16}
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>

                    {/* CREATE */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/super-admin/units/create"
                            )
                        }
                        className="flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
                    >
                        <Plus size={18} />

                        Create Unit
                    </button>
                </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* ERROR */}
            {/* ------------------------------------------------------------ */}

            {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
                    <div className="mt-0.5 shrink-0">
                        <AlertTriangle
                            size={19}
                        />
                    </div>

                    <div className="min-w-0">
                        <p className="font-semibold">
                            Unable to load units
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                            {getErrorMessage(
                                error
                            )}
                        </p>

                        {error?.code && (
                            <p className="mt-1 text-xs text-red-500">
                                Error code:{" "}
                                {error.code}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* STATS */}
            {/* ------------------------------------------------------------ */}
            {/*
                IMPORTANT:
                UnitStats expects `units`, not `stats`.
            */}

            <UnitStats
                units={units}
            />

            {/* ------------------------------------------------------------ */}
            {/* FILTERS */}
            {/* ------------------------------------------------------------ */}

            <UnitFilters
                search={search}
                onSearchChange={setSearch}
                onRefresh={() =>
                    fetchUnits(true)
                }
                refreshing={refreshing}
            />

            {/* ------------------------------------------------------------ */}
            {/* TABLE */}
            {/* ------------------------------------------------------------ */}

            <UnitTable
                units={filteredUnits}
                search={search}
                deletingId={deletingId}
                onView={(id) =>
                    navigate(
                        `/super-admin/units/${id}`
                    )
                }
                onEdit={(id) =>
                    navigate(
                        `/super-admin/units/edit/${id}`
                    )
                }
                onDelete={handleDelete}
                getUnitName={getUnitName}
                getUnitType={getUnitType}
                getRent={getRent}
                getPrice={getPrice}
                formatPrice={formatPrice}
                getDeposit={getDeposit}
                getServiceCharge={
                    getServiceCharge
                }
                formatMoney={formatMoney}
                getStatus={getStatus}
                normalize={normalize}
                onCreate={() =>
                    navigate(
                        "/super-admin/units/create"
                    )
                }
            />
        </div>
    );
};

export default UnitList;