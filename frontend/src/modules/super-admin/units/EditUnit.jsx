import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    Loader2,
    RefreshCcw,
} from "lucide-react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import { useDispatch } from "react-redux";

import {
    addNotification,
} from "../../../store/uiSlice";

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
    |
    | Disable automatic fetching because this page controls
    | the initial loading process.
    |
    */

    const {
        unit,
        loading: unitLoading,
        error: unitError,
        getUnit,
        updateUnit,
    } = useUnit({
        autoFetch: false,
    });

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
    } = useProperty({
        autoFetch: false,
    });

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
    } = useApartment({
        autoFetch: false,
    });

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
    | REQUEST CONTROL
    |--------------------------------------------------------------------------
    |
    | Prevents an old request from replacing newer data.
    |
    */

    const requestIdRef = useRef(0);

    /*
    |--------------------------------------------------------------------------
    | ERROR MESSAGE HELPER
    |--------------------------------------------------------------------------
    */

    const getErrorMessage = useCallback(
        (error) => {
            if (!error) {
                return null;
            }

            if (typeof error === "string") {
                return error;
            }

            /*
            | Laravel / Axios errors
            */

            const responseData =
                error?.response?.data;

            /*
            | Validation error object
            */

            const validationErrors =
                responseData?.errors ??
                error?.errors;

            if (
                validationErrors &&
                typeof validationErrors ===
                    "object"
            ) {
                /*
                | Laravel often returns:
                |
                | errors: {
                |   property_id: ["The property..."],
                |   unit_number: ["The unit..."]
                | }
                */

                const firstError =
                    Object.values(
                        validationErrors
                    ).find(Boolean);

                if (Array.isArray(firstError)) {
                    return firstError[0];
                }

                if (
                    typeof firstError ===
                    "string"
                ) {
                    return firstError;
                }

                /*
                | Some APIs return:
                |
                | errors: {
                |   error: "..."
                | }
                */

                if (
                    typeof validationErrors.error ===
                    "string"
                ) {
                    return validationErrors.error;
                }

                if (
                    typeof validationErrors.message ===
                    "string"
                ) {
                    return validationErrors.message;
                }
            }

            return (
                responseData?.message ||
                responseData?.error ||
                error?.message ||
                error?.error ||
                "Unable to load the unit data."
            );
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | RESOLVE SINGLE RESOURCE
    |--------------------------------------------------------------------------
    |
    | Supports:
    |
    | { data: {...} }
    |
    | { data: { data: {...} } }
    |
    | { result: {...} }
    |
    | { unit: {...} }
    |
    | Direct object
    |
    */

    const resolveUnitResponse =
        useCallback((response) => {
            if (!response) {
                return null;
            }

            let result = response;

            /*
            | Axios response:
            |
            | {
            |   data: {
            |      ...
            |   }
            | }
            |
            */

            if (
                result?.data &&
                typeof result.data ===
                    "object" &&
                !Array.isArray(result.data)
            ) {
                result = result.data;
            }

            /*
            | Laravel resource:
            |
            | {
            |   data: {
            |      id: 1,
            |      ...
            |   }
            | }
            |
            */

            if (
                result?.data &&
                typeof result.data ===
                    "object" &&
                !Array.isArray(result.data)
            ) {
                result = result.data;
            }

            /*
            | Some APIs:
            |
            | {
            |   unit: {...}
            | }
            */

            if (
                result?.unit &&
                typeof result.unit ===
                    "object" &&
                !Array.isArray(result.unit)
            ) {
                result = result.unit;
            }

            /*
            | Some APIs:
            |
            | {
            |   result: {...}
            | }
            */

            if (
                result?.result &&
                typeof result.result ===
                    "object" &&
                !Array.isArray(result.result)
            ) {
                result = result.result;
            }

            if (
                !result ||
                typeof result !==
                    "object" ||
                Array.isArray(result)
            ) {
                return null;
            }

            return result;
        }, []);

    /*
    |--------------------------------------------------------------------------
    | LOAD FORM DATA
    |--------------------------------------------------------------------------
    */

    const loadFormData = useCallback(
        async () => {
            if (!id) {
                setFetching(false);
                setCurrentUnit(null);
                return;
            }

            const requestId =
                ++requestIdRef.current;

            setFetching(true);

            try {
                /*
                |--------------------------------------------------------------------------
                | Load all required resources in parallel
                |--------------------------------------------------------------------------
                */

                const results =
                    await Promise.allSettled([
                        getUnit(id),

                        getProperties({
                            with_relations: true,
                            _t: Date.now(),
                        }),

                        getApartments({
                            with_relations: true,
                            _t: Date.now(),
                        }),
                    ]);

                /*
                |--------------------------------------------------------------------------
                | Ignore stale requests
                |--------------------------------------------------------------------------
                */

                if (
                    requestId !==
                    requestIdRef.current
                ) {
                    return;
                }

                /*
                |--------------------------------------------------------------------------
                | UNIT RESULT
                |--------------------------------------------------------------------------
                */

                const unitResult =
                    results[0];

                let loadedUnit = null;

                if (
                    unitResult?.status ===
                    "fulfilled"
                ) {
                    loadedUnit =
                        resolveUnitResponse(
                            unitResult.value
                        );
                }

                /*
                |--------------------------------------------------------------------------
                | FALLBACK TO HOOK UNIT STATE
                |--------------------------------------------------------------------------
                */

                if (
                    !loadedUnit &&
                    unit &&
                    typeof unit ===
                        "object" &&
                    !Array.isArray(unit)
                ) {
                    loadedUnit = unit;
                }

                /*
                |--------------------------------------------------------------------------
                | SAVE CURRENT UNIT
                |--------------------------------------------------------------------------
                */

                if (loadedUnit) {
                    setCurrentUnit(
                        loadedUnit
                    );
                } else {
                    setCurrentUnit(null);
                }

                /*
                |--------------------------------------------------------------------------
                | CHECK FAILED REQUESTS
                |--------------------------------------------------------------------------
                */

                const failedResults =
                    results.filter(
                        (result) =>
                            result.status ===
                            "rejected"
                    );

                if (
                    failedResults.length >
                    0
                ) {
                    console.error(
                        "Some edit unit requests failed:",
                        failedResults
                    );

                    /*
                    | Unit is critical.
                    |
                    | If unit failed, show the
                    | complete error screen.
                    */

                    if (
                        unitResult?.status ===
                        "rejected"
                    ) {
                        throw unitResult.reason;
                    }

                    /*
                    | Properties/apartments can
                    | still be handled by their
                    | hook errors.
                    */
                }
            } catch (error) {
                if (
                    requestId !==
                    requestIdRef.current
                ) {
                    return;
                }

                console.error(
                    "FAILED TO LOAD UNIT EDIT DATA:",
                    error
                );

                setCurrentUnit(null);

                dispatch(
                    addNotification({
                        type: "error",
                        message:
                            getErrorMessage(
                                error
                            ) ||
                            "Failed to load unit data.",
                    })
                );
            } finally {
                if (
                    requestId ===
                    requestIdRef.current
                ) {
                    setFetching(false);
                }
            }
        },
        [
            id,
            getUnit,
            getProperties,
            getApartments,
            resolveUnitResponse,
            unit,
            dispatch,
            getErrorMessage,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | INITIAL LOAD
    |--------------------------------------------------------------------------
    |
    | Run whenever the route ID changes.
    |
    */

    useEffect(() => {
        let mounted = true;

        if (!mounted) {
            return;
        }

        loadFormData();

        return () => {
            mounted = false;
            requestIdRef.current += 1;
        };
    }, [id]);

    /*
    |--------------------------------------------------------------------------
    | KEEP LOCAL UNIT IN SYNC
    |--------------------------------------------------------------------------
    |
    | If the hook receives the unit independently, use it only
    | when we don't already have a locally loaded unit.
    |
    */

    useEffect(() => {
        if (
            !currentUnit &&
            unit &&
            typeof unit === "object" &&
            !Array.isArray(unit)
        ) {
            setCurrentUnit(unit);
        }
    }, [unit, currentUnit]);

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
                                response?.message ||
                                response?.data
                                    ?.message ||
                                "Unit updated successfully.",
                        })
                    );

                    navigate(
                        "/super-admin/units"
                    );
                } catch (error) {
                    console.error(
                        "UPDATE UNIT ERROR:",
                        error
                    );

                    const message =
                        getErrorMessage(
                            error
                        ) ||
                        "Failed to update unit.";

                    dispatch(
                        addNotification({
                            type: "error",
                            message,
                        })
                    );

                    /*
                    | Important:
                    | Re-throw so UnitForm can also
                    | handle the failed submission.
                    */

                    throw error;
                } finally {
                    setSubmitting(false);
                }
            },
            [
                id,
                submitting,
                updateUnit,
                dispatch,
                navigate,
                getErrorMessage,
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
            setCurrentUnit(null);
            loadFormData();
        }, [loadFormData]);

    /*
    |--------------------------------------------------------------------------
    | FORM DATA ERROR
    |--------------------------------------------------------------------------
    */

    const formDataError =
        unitError ||
        propertiesError ||
        apartmentsError;

    /*
    |--------------------------------------------------------------------------
    | FORM DATA LOADING
    |--------------------------------------------------------------------------
    */

    const formDataLoading =
        unitLoading ||
        propertiesLoading ||
        apartmentsLoading;

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE PROPERTIES
    |--------------------------------------------------------------------------
    |
    | The hook may return an array directly or a nested response.
    |
    */

    const normalizedProperties =
        Array.isArray(properties)
            ? properties
            : Array.isArray(
                  properties?.data
              )
            ? properties.data
            : Array.isArray(
                  properties?.data?.data
              )
            ? properties.data.data
            : [];

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE APARTMENTS
    |--------------------------------------------------------------------------
    */

    const normalizedApartments =
        Array.isArray(apartments)
            ? apartments
            : Array.isArray(
                  apartments?.data
              )
            ? apartments.data
            : Array.isArray(
                  apartments?.data?.data
              )
            ? apartments.data.data
            : [];

    /*
    |--------------------------------------------------------------------------
    | INITIAL PAGE LOADING
    |--------------------------------------------------------------------------
    */

    if (
        fetching &&
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

                        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                            <Loader2
                                size={14}
                                className="animate-spin"
                            />
                            Please wait...
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
    |
    | Only show the full-page error if the unit itself could not
    | be loaded.
    |
    */

    if (
        !currentUnit &&
        (formDataError || !id)
    ) {
        const message = !id
            ? "No unit ID was provided."
            : getErrorMessage(
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

                    <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
                        <div className="border-b border-red-100 bg-red-50/50 px-6 py-5 sm:px-8">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100">
                                    <AlertTriangle
                                        size={24}
                                        className="text-red-600"
                                    />
                                </div>

                                <div>
                                    <h1 className="text-lg font-bold text-slate-900">
                                        Unable to
                                        Load Unit
                                    </h1>

                                    <p className="mt-1 text-sm text-slate-500">
                                        The unit
                                        information
                                        could not
                                        be loaded.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">
                            {message && (
                                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                                    <p className="text-sm font-medium leading-6 text-red-700">
                                        {message}
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
                                        size={17}
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
                                        size={17}
                                    />

                                    Back to Units
                                </button>
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
                {/* PAGE HEADER */}

                <div className="mb-6">
                    <button
                        type="button"
                        onClick={
                            handleCancel
                        }
                        disabled={
                            submitting
                        }
                        className="mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ArrowLeft
                            size={18}
                        />

                        Back to Units
                    </button>

                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                            <Building2 className="h-5 w-5 text-indigo-600" />
                        </div>

                        <div className="min-w-0">
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

                {/* BACKGROUND REFRESH */}

                {fetching &&
                    currentUnit && (
                        <div className="mb-5 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
                            <Loader2
                                size={18}
                                className="animate-spin"
                            />

                            Refreshing unit
                            information...
                        </div>
                    )}

                {/* RESOURCE WARNING */}

                {!fetching &&
                    currentUnit &&
                    formDataError && (
                        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            <AlertTriangle
                                size={18}
                                className="mt-0.5 shrink-0"
                            />

                            <div>
                                <p className="font-semibold">
                                    Some form data
                                    could not be
                                    loaded.
                                </p>

                                <p className="mt-1">
                                    You can still
                                    review the
                                    unit, but
                                    property or
                                    apartment
                                    options may
                                    be incomplete.
                                </p>
                            </div>
                        </div>
                    )}

                {/* FORM */}

                <UnitForm
                    unit={currentUnit}
                    properties={
                        normalizedProperties
                    }
                    apartments={
                        normalizedApartments
                    }
                    loading={
                        fetching ||
                        formDataLoading
                    }
                    submitting={
                        submitting
                    }
                    error={
                        unitError ||
                        propertiesError ||
                        apartmentsError
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

const getUnitNumber = (unit) => {
    if (!unit) {
        return "Unit";
    }

    return (
        unit?.unit_number ??
        unit?.number ??
        unit?.unit_name ??
        unit?.name ??
        (unit?.id
            ? `#${unit.id}`
            : "Unit")
    );
};

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

export default EditUnit;