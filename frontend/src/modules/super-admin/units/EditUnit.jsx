
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
    CheckCircle2,
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

    const [currentUnit, setCurrentUnit] = useState(null);
    const [fetching, setFetching] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | REQUEST CONTROL
    |--------------------------------------------------------------------------
    */

    const requestIdRef = useRef(0);

    /*
    |--------------------------------------------------------------------------
    | ERROR MESSAGE HELPER
    |--------------------------------------------------------------------------
    */

    const getErrorMessage = useCallback((error) => {
        if (!error) {
            return null;
        }

        if (typeof error === "string") {
            return error;
        }

        const responseData = error?.response?.data;

        const validationErrors =
            responseData?.errors ??
            error?.errors;

        if (
            validationErrors &&
            typeof validationErrors === "object"
        ) {
            const firstError = Object.values(
                validationErrors
            ).find(Boolean);

            if (Array.isArray(firstError)) {
                return firstError[0];
            }

            if (typeof firstError === "string") {
                return firstError;
            }

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
    }, []);

    /*
    |--------------------------------------------------------------------------
    | RESOLVE SINGLE RESOURCE
    |--------------------------------------------------------------------------
    */

    const resolveUnitResponse = useCallback(
        (response) => {
            if (!response) {
                return null;
            }

            let result = response;

            if (
                result?.data &&
                typeof result.data === "object" &&
                !Array.isArray(result.data)
            ) {
                result = result.data;
            }

            if (
                result?.data &&
                typeof result.data === "object" &&
                !Array.isArray(result.data)
            ) {
                result = result.data;
            }

            if (
                result?.unit &&
                typeof result.unit === "object" &&
                !Array.isArray(result.unit)
            ) {
                result = result.unit;
            }

            if (
                result?.result &&
                typeof result.result === "object" &&
                !Array.isArray(result.result)
            ) {
                result = result.result;
            }

            if (
                !result ||
                typeof result !== "object" ||
                Array.isArray(result)
            ) {
                return null;
            }

            return result;
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | LOAD FORM DATA
    |--------------------------------------------------------------------------
    */

    const loadFormData = useCallback(async () => {
        if (!id) {
            setFetching(false);
            setCurrentUnit(null);
            return;
        }

        const requestId = ++requestIdRef.current;

        setFetching(true);

        try {
            const results = await Promise.allSettled([
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

            if (
                requestId !== requestIdRef.current
            ) {
                return;
            }

            const unitResult = results[0];

            let loadedUnit = null;

            if (
                unitResult?.status === "fulfilled"
            ) {
                loadedUnit =
                    resolveUnitResponse(
                        unitResult.value
                    );
            }

            if (
                !loadedUnit &&
                unit &&
                typeof unit === "object" &&
                !Array.isArray(unit)
            ) {
                loadedUnit = unit;
            }

            setCurrentUnit(
                loadedUnit || null
            );

            const failedResults = results.filter(
                (result) =>
                    result.status === "rejected"
            );

            if (failedResults.length > 0) {
                console.error(
                    "Some edit unit requests failed:",
                    failedResults
                );

                if (
                    unitResult?.status ===
                    "rejected"
                ) {
                    throw unitResult.reason;
                }
            }
        } catch (error) {
            if (
                requestId !== requestIdRef.current
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
                        getErrorMessage(error) ||
                        "Failed to load unit data.",
                })
            );
        } finally {
            if (
                requestId === requestIdRef.current
            ) {
                setFetching(false);
            }
        }
    }, [
        id,
        getUnit,
        getProperties,
        getApartments,
        resolveUnitResponse,
        unit,
        dispatch,
        getErrorMessage,
    ]);

    /*
    |--------------------------------------------------------------------------
    | INITIAL LOAD
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        loadFormData();

        return () => {
            requestIdRef.current += 1;
        };
    }, [id]);

    /*
    |--------------------------------------------------------------------------
    | KEEP LOCAL UNIT IN SYNC
    |--------------------------------------------------------------------------
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

    const handleSubmit = useCallback(
        async (payload) => {
            if (submitting || !id) {
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
                            response?.data?.message ||
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
                    getErrorMessage(error) ||
                    "Failed to update unit.";

                dispatch(
                    addNotification({
                        type: "error",
                        message,
                    })
                );

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

    const handleCancel = useCallback(() => {
        if (submitting) {
            return;
        }

        navigate(
            "/super-admin/units"
        );
    }, [navigate, submitting]);

    /*
    |--------------------------------------------------------------------------
    | RETRY
    |--------------------------------------------------------------------------
    */

    const handleRetry = useCallback(() => {
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
    */

    const normalizedProperties =
        Array.isArray(properties)
            ? properties
            : Array.isArray(properties?.data)
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
            : Array.isArray(apartments?.data)
            ? apartments.data
            : Array.isArray(
                  apartments?.data?.data
              )
            ? apartments.data.data
            : [];

    /*
    |--------------------------------------------------------------------------
    | UNIT NUMBER
    |--------------------------------------------------------------------------
    */

    const unitNumber =
        getUnitNumber(currentUnit);

    /*
    |--------------------------------------------------------------------------
    | INITIAL LOADING SCREEN
    |--------------------------------------------------------------------------
    */

    if (fetching && !currentUnit) {
        return (
            <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl">

                    {/* Header Skeleton */}

                    <div className="mb-8">
                        <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />

                        <div className="mt-6 flex items-center gap-4">
                            <div className="h-14 w-14 animate-pulse rounded-2xl bg-slate-200" />

                            <div className="space-y-2">
                                <div className="h-7 w-48 animate-pulse rounded-lg bg-slate-200" />
                                <div className="h-4 w-72 animate-pulse rounded-lg bg-slate-200" />
                            </div>
                        </div>
                    </div>

                    {/* Loading Card */}

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="h-1 bg-indigo-600" />

                        <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                                <Loader2
                                    size={28}
                                    className="animate-spin text-indigo-600"
                                />
                            </div>

                            <h2 className="mt-5 text-lg font-bold text-slate-900">
                                Loading Unit
                            </h2>

                            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                Preparing the unit,
                                property and apartment
                                information for editing.
                            </p>

                            <div className="mt-7 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-600" />
                            </div>

                            <div className="mt-5 flex items-center gap-2 text-xs font-medium text-slate-400">
                                <Loader2
                                    size={14}
                                    className="animate-spin"
                                />

                                Please wait...
                            </div>
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
                <div className="mx-auto max-w-4xl">

                    {/* Back */}

                    <button
                        type="button"
                        onClick={handleCancel}
                        className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
                    >
                        <ArrowLeft size={17} />

                        Back to Units
                    </button>

                    {/* Error Card */}

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                        <div className="h-1 bg-red-500" />

                        <div className="border-b border-slate-100 bg-gradient-to-r from-red-50 to-white px-6 py-6 sm:px-8">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100">
                                    <AlertTriangle
                                        size={24}
                                        className="text-red-600"
                                    />
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                                            Unable to Load Unit
                                        </h1>

                                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700">
                                            Error
                                        </span>
                                    </div>

                                    <p className="mt-1.5 text-sm text-slate-500">
                                        We couldn't retrieve the
                                        information required to
                                        edit this unit.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">

                            <div className="rounded-xl border border-red-100 bg-red-50/70 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle
                                        size={18}
                                        className="mt-0.5 shrink-0 text-red-600"
                                    />

                                    <p className="text-sm font-medium leading-6 text-red-700">
                                        {message}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-none"
                                >
                                    <ArrowLeft size={17} />

                                    Back to Units
                                </button>

                                <button
                                    type="button"
                                    onClick={handleRetry}
                                    disabled={fetching}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MAIN PAGE
    |--------------------------------------------------------------------------
    */

    return (
        <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">

                {/* =========================================================
                    PAGE HEADER
                ========================================================= */}

                <div className="mb-7">

                    {/* Breadcrumb / Back */}

                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={submitting}
                        className="group mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ArrowLeft
                            size={17}
                            className="transition-transform group-hover:-translate-x-0.5"
                        />

                        Back to Units
                    </button>

                    {/* Main Header */}

                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                        <div className="flex min-w-0 items-start gap-4">

                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 shadow-sm shadow-indigo-200">
                                <Building2
                                    size={25}
                                    className="text-white"
                                />
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                        Edit Unit
                                    </h1>

                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />

                                        {unitNumber}
                                    </span>
                                </div>

                                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                                    Update the unit's property,
                                    apartment, pricing, features
                                    and availability information.
                                </p>
                            </div>
                        </div>

                        {/* Status */}

                        <div className="hidden shrink-0 items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 md:flex">
                            <CheckCircle2
                                size={17}
                                className="text-emerald-600"
                            />

                            <span className="text-sm font-semibold text-emerald-700">
                                Unit loaded
                            </span>
                        </div>
                    </div>
                </div>

                {/* =========================================================
                    BACKGROUND REFRESH
                ========================================================= */}

                {fetching && currentUnit && (
                    <div className="mb-5 overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm">
                        <div className="flex items-center gap-3 px-4 py-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                                <Loader2
                                    size={17}
                                    className="animate-spin text-indigo-600"
                                />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    Refreshing unit information
                                </p>

                                <p className="text-xs text-slate-500">
                                    Updating the latest property
                                    and apartment options.
                                </p>
                            </div>
                        </div>

                        <div className="h-0.5 overflow-hidden bg-indigo-50">
                            <div className="h-full w-1/3 animate-pulse bg-indigo-600" />
                        </div>
                    </div>
                )}

                {/* =========================================================
                    RESOURCE WARNING
                ========================================================= */}

                {!fetching &&
                    currentUnit &&
                    formDataError && (
                        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                                    <AlertTriangle
                                        size={18}
                                        className="text-amber-600"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-amber-900">
                                        Some form options are
                                        unavailable
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-amber-800">
                                        The unit was loaded
                                        successfully, but some
                                        property or apartment
                                        options could not be
                                        retrieved. Please check
                                        your connection or retry
                                        before saving.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                {/* =========================================================
                    FORM CARD
                ========================================================= */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    {/* Card Top Accent */}

                    <div className="h-1 bg-indigo-600" />

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
                        submitLabel="Save Changes"
                    />
                </div>

                {/* =========================================================
                    FOOTER NOTE
                ========================================================= */}

                <div className="mt-5 flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        Changes to this unit will be
                        reflected across the estate
                        management system.
                    </p>

                    <p className="font-medium">
                        Unit ID: #{id}
                    </p>
                </div>
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

export default EditUnit;

