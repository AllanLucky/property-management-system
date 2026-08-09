import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    AlertTriangle,
    ArrowLeft,
    Loader2,
    RefreshCcw,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";

import { addNotification } from "../../../store/uiSlice";

import UnitForm from "./unitForm";

import useUnit from "../../../hooks/useUnits";
import useProperty from "../../../hooks/useProperties";
import useApartment from "../../../hooks/useApartment";

/*
|--------------------------------------------------------------------------
| EDIT UNIT
|--------------------------------------------------------------------------
*/

const EditUnit = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id } = useParams();

    /*
    |--------------------------------------------------------------------------
    | UNIT HOOK
    |--------------------------------------------------------------------------
    */

    const {
        unit,
        loading: unitLoading,
        error: unitError,
        getUnit,
        updateUnit,
    } = useUnit();

    /*
    |--------------------------------------------------------------------------
    | PROPERTY HOOK
    |--------------------------------------------------------------------------
    */

    const {
        properties = [],
        loading: propertiesLoading,
        error: propertiesError,
        getProperties,
    } = useProperty();

    /*
    |--------------------------------------------------------------------------
    | APARTMENT HOOK
    |--------------------------------------------------------------------------
    */

    const {
        apartments = [],
        loading: apartmentsLoading,
        error: apartmentsError,
        getApartments,
    } = useApartment();

    /*
    |--------------------------------------------------------------------------
    | LOCAL STATE
    |--------------------------------------------------------------------------
    */

    const [currentUnit, setCurrentUnit] =
        useState(null);

    const [fetching, setFetching] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    /*
    |--------------------------------------------------------------------------
    | LOAD EDIT FORM DATA
    |--------------------------------------------------------------------------
    */

    const loadFormData = useCallback(
        async () => {
            if (!id) {
                return;
            }

            setFetching(true);

            try {
                const [
                    unitResponse,
                ] = await Promise.all([
                    typeof getUnit ===
                    "function"
                        ? getUnit(id)
                        : Promise.resolve(null),

                    typeof getProperties ===
                    "function"
                        ? getProperties({
                              with_relations:
                                  true,
                          })
                        : Promise.resolve(null),

                    typeof getApartments ===
                    "function"
                        ? getApartments({
                              with_relations:
                                  true,
                          })
                        : Promise.resolve(null),
                ]);

                /*
                |--------------------------------------------------------------------------
                | Resolve Unit Response
                |--------------------------------------------------------------------------
                */

                let loadedUnit =
                    unitResponse;

                /*
                |--------------------------------------------------------------------------
                | Some hooks return:
                |
                | {
                |     data: {...}
                | }
                |
                | or:
                |
                | {
                |     data: {
                |         data: {...}
                |     }
                | }
                |
                |--------------------------------------------------------------------------
                */

                if (
                    loadedUnit?.data
                ) {
                    loadedUnit =
                        loadedUnit.data;
                }

                if (
                    loadedUnit?.data
                ) {
                    loadedUnit =
                        loadedUnit.data;
                }

                /*
                |--------------------------------------------------------------------------
                | If getUnit does not return the
                | object, use hook state.
                |--------------------------------------------------------------------------
                */

                if (
                    !loadedUnit ||
                    typeof loadedUnit !==
                        "object" ||
                    Array.isArray(
                        loadedUnit
                    )
                ) {
                    loadedUnit = unit;
                }

                if (
                    loadedUnit
                ) {
                    setCurrentUnit(
                        loadedUnit
                    );
                }
            } catch (error) {
                console.error(
                    "FAILED TO LOAD UNIT EDIT DATA:",
                    error
                );

                dispatch(
                    addNotification({
                        type: "error",
                        message:
                            error?.response
                                ?.data
                                ?.message ||
                            error?.message ||
                            "Failed to load unit data.",
                    })
                );
            } finally {
                setFetching(false);
            }
        },
        [
            id,
            getUnit,
            getProperties,
            getApartments,
            unit,
            dispatch,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | INITIAL LOAD
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        loadFormData();
    }, [loadFormData]);

    /*
    |--------------------------------------------------------------------------
    | KEEP LOCAL UNIT IN SYNC
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (
            unit &&
            typeof unit ===
                "object" &&
            !Array.isArray(unit)
        ) {
            setCurrentUnit(unit);
        }
    }, [unit]);

    /*
    |--------------------------------------------------------------------------
    | UPDATE UNIT
    |--------------------------------------------------------------------------
    */

    const handleSubmit =
        useCallback(
            async (payload) => {
                if (
                    submitting ||
                    !id
                ) {
                    return;
                }

                setSubmitting(true);

                try {
                    const response =
                        await updateUnit(
                            id,
                            payload
                        );

                    console.log(
                        "UPDATE UNIT RESPONSE:",
                        response
                    );

                    dispatch(
                        addNotification({
                            type: "success",
                            message:
                                response
                                    ?.message ||
                                response
                                    ?.data
                                    ?.message ||
                                "Unit updated successfully.",
                        })
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | Redirect
                    |--------------------------------------------------------------------------
                    */

                    navigate(
                        "/super-admin/units"
                    );
                } catch (error) {
                    console.error(
                        "UPDATE UNIT ERROR:",
                        error
                    );

                    const message =
                        error
                            ?.response
                            ?.data
                            ?.message ||
                        error?.message ||
                        "Failed to update unit.";

                    dispatch(
                        addNotification({
                            type: "error",
                            message,
                        })
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | Let UnitForm handle submission
                    |--------------------------------------------------------------------------
                    */

                    throw error;
                } finally {
                    setSubmitting(
                        false
                    );
                }
            },
            [
                id,
                submitting,
                updateUnit,
                dispatch,
                navigate,
            ]
        );

    /*
    |--------------------------------------------------------------------------
    | CANCEL
    |--------------------------------------------------------------------------
    */

    const handleCancel =
        useCallback(() => {
            navigate(
                "/super-admin/units"
            );
        }, [navigate]);

    /*
    |--------------------------------------------------------------------------
    | RETRY
    |--------------------------------------------------------------------------
    */

    const handleRetry =
        useCallback(() => {
            loadFormData();
        }, [loadFormData]);

    /*
    |--------------------------------------------------------------------------
    | FORM DATA ERROR
    |--------------------------------------------------------------------------
    */

    const formDataError =
        propertiesError ||
        apartmentsError ||
        unitError;

    const getErrorMessage =
        useCallback((error) => {
            if (!error) {
                return null;
            }

            if (
                typeof error ===
                "string"
            ) {
                return error;
            }

            return (
                error?.response
                    ?.data
                    ?.message ||
                error?.message ||
                error?.error ||
                "Unable to load the unit data."
            );
        }, []);

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    const loading =
        fetching ||
        unitLoading ||
        propertiesLoading ||
        apartmentsLoading;

    /*
    |--------------------------------------------------------------------------
    | INITIAL LOADING SCREEN
    |--------------------------------------------------------------------------
    */

    if (
        fetching ||
        !currentUnit
    ) {
        return (
            <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto flex min-h-[500px] max-w-7xl items-center justify-center">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                            <Loader2
                                size={28}
                                className="animate-spin text-indigo-600"
                            />
                        </div>

                        <h2 className="mt-5 text-lg font-bold text-slate-900">
                            Loading Unit
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Loading unit,
                            properties and
                            apartments...
                        </p>

                        <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-500" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ERROR SCREEN
    |--------------------------------------------------------------------------
    */

    if (formDataError) {
        const message =
            getErrorMessage(
                formDataError
            );

        return (
            <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-3xl">
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={
                                handleCancel
                            }
                            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
                        >
                            <ArrowLeft
                                size={18}
                            />

                            Back to Units
                        </button>
                    </div>

                    <div className="rounded-2xl border border-red-200 bg-white shadow-sm">
                        <div className="p-6 sm:p-8">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50">
                                    <AlertTriangle
                                        size={
                                            26
                                        }
                                        className="text-red-600"
                                    />
                                </div>

                                <div className="flex-1">
                                    <h1 className="text-xl font-bold text-slate-900">
                                        Unable to Load
                                        Unit
                                    </h1>

                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        We could not
                                        load the
                                        unit
                                        information
                                        required
                                        for editing.
                                    </p>

                                    {message && (
                                        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                                            <p className="text-sm font-medium leading-6 text-red-700">
                                                {
                                                    message
                                                }
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={
                                                handleRetry
                                            }
                                            disabled={
                                                fetching
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <RefreshCcw
                                                size={
                                                    17
                                                }
                                                className={
                                                    fetching
                                                        ? "animate-spin"
                                                        : ""
                                                }
                                            />

                                            Try Again
                                        </button>

                                        <button
                                            type="button"
                                            onClick={
                                                handleCancel
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                        >
                                            <ArrowLeft
                                                size={
                                                    17
                                                }
                                            />

                                            Back to Units
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
                {/* ---------------------------------------------------------- */}
                {/* PAGE HEADER */}
                {/* ---------------------------------------------------------- */}

                <div className="mb-6">
                    <button
                        type="button"
                        onClick={
                            handleCancel
                        }
                        className="mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
                    >
                        <ArrowLeft
                            size={18}
                        />

                        Back to Units
                    </button>

                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                            <Building2Icon />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Edit Unit
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Update unit{" "}
                                <span className="font-semibold text-slate-700">
                                    {getUnitNumber(
                                        currentUnit
                                    )}
                                </span>{" "}
                                information,
                                pricing,
                                features and
                                availability.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ---------------------------------------------------------- */}
                {/* BACKGROUND LOADING */}
                {/* ---------------------------------------------------------- */}

                {loading &&
                    !submitting && (
                        <div className="mb-5 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
                            <Loader2
                                size={18}
                                className="animate-spin"
                            />

                            Loading unit
                            information...
                        </div>
                    )}

                {/* ---------------------------------------------------------- */}
                {/* FORM */}
                {/* ---------------------------------------------------------- */}

                <UnitForm
                    unit={
                        currentUnit
                    }
                    properties={
                        Array.isArray(
                            properties
                        )
                            ? properties
                            : []
                    }
                    apartments={
                        Array.isArray(
                            apartments
                        )
                            ? apartments
                            : []
                    }
                    loading={
                        unitLoading ||
                        propertiesLoading ||
                        apartmentsLoading
                    }
                    submitting={
                        submitting ||
                        unitLoading
                    }
                    error={
                        unitError
                    }
                    onSubmit={
                        handleSubmit
                    }
                    onCancel={
                        handleCancel
                    }
                    title="Edit Unit"
                    submitLabel="Update Unit"
                />
            </div>
        </div>
    );
};

/*
|--------------------------------------------------------------------------
| UNIT NUMBER HELPER
|--------------------------------------------------------------------------
*/

const getUnitNumber = (
    unit
) => {
    if (!unit) {
        return "Unit";
    }

    return (
        unit?.unit_number ??
        unit?.number ??
        unit?.name ??
        `#${unit?.id ?? ""}`
    );
};

/*
|--------------------------------------------------------------------------
| HEADER ICON
|--------------------------------------------------------------------------
*/

const Building2Icon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 text-indigo-600"
        aria-hidden="true"
    >
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
    </svg>
);

export default EditUnit;