import {
    useCallback,
    useEffect,
    useMemo,
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
    Sparkles,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { addNotification } from "../../../store/uiSlice";

import UnitForm from "./unitForm";

import useUnit from "../../../hooks/useUnits";
import useProperty from "../../../hooks/useProperties";
import useApartment from "../../../hooks/useApartment";

/*
|--------------------------------------------------------------------------
| CREATE UNIT
|--------------------------------------------------------------------------
|
| Professional create-unit page.
|
| Responsibilities:
|
| - Load properties
| - Load apartments
| - Normalize API responses
| - Display loading/error states
| - Submit the unit
| - Handle navigation
|
*/

const CreateUnit = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    /*
    |--------------------------------------------------------------------------
    | REQUEST CONTROL
    |--------------------------------------------------------------------------
    |
    | Prevent state updates after the component has unmounted.
    |
    */

    const mountedRef = useRef(true);

    /*
    |--------------------------------------------------------------------------
    | UNIT HOOK
    |--------------------------------------------------------------------------
    */

    const {
        createUnit,
        loading: unitLoading,
        error: unitError,
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

    const [fetching, setFetching] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | CLEANUP
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | ERROR MESSAGE HELPER
    |--------------------------------------------------------------------------
    |
    | Supports:
    |
    | Laravel:
    | {
    |     message: "...",
    |     errors: {
    |         property_id: ["..."]
    |     }
    | }
    |
    | Axios:
    | error.response.data
    |
    | Custom API:
    | {
    |     error: "...",
    |     message: "..."
    | }
    |
    */

    const getErrorMessage = useCallback((error) => {
        if (!error) {
            return null;
        }

        if (typeof error === "string") {
            return error;
        }

        const responseData =
            error?.response?.data ?? {};

        const validationErrors =
            responseData?.errors ??
            error?.errors;

        /*
        |--------------------------------------------------------------------------
        | Laravel validation errors
        |--------------------------------------------------------------------------
        */

        if (
            validationErrors &&
            typeof validationErrors === "object" &&
            !Array.isArray(validationErrors)
        ) {
            /*
            | Prefer a general error/message first.
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

            /*
            | Otherwise find the first validation message.
            */

            const firstValidationError =
                Object.values(validationErrors).find(
                    (value) =>
                        Array.isArray(value)
                            ? value.length > 0
                            : Boolean(value)
                );

            if (Array.isArray(firstValidationError)) {
                return firstValidationError[0];
            }

            if (
                typeof firstValidationError ===
                "string"
            ) {
                return firstValidationError;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Standard API / Axios errors
        |--------------------------------------------------------------------------
        */

        return (
            responseData?.message ||
            responseData?.error ||
            error?.message ||
            error?.error ||
            "Unable to load the unit form data."
        );
    }, []);

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE COLLECTION
    |--------------------------------------------------------------------------
    |
    | Supports:
    |
    | []
    |
    | { data: [] }
    |
    | { data: { data: [] } }
    |
    | { properties: [] }
    |
    | { apartments: [] }
    |
    */

    const normalizeCollection = useCallback(
        (value, resourceKey = null) => {
            if (Array.isArray(value)) {
                return value;
            }

            if (
                value?.data &&
                Array.isArray(value.data)
            ) {
                return value.data;
            }

            if (
                value?.data?.data &&
                Array.isArray(value.data.data)
            ) {
                return value.data.data;
            }

            if (
                resourceKey &&
                Array.isArray(value?.[resourceKey])
            ) {
                return value[resourceKey];
            }

            if (
                resourceKey &&
                Array.isArray(
                    value?.data?.[resourceKey]
                )
            ) {
                return value.data[resourceKey];
            }

            return [];
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | NORMALIZED PROPERTIES
    |--------------------------------------------------------------------------
    */

    const normalizedProperties = useMemo(() => {
        return normalizeCollection(
            properties,
            "properties"
        );
    }, [
        properties,
        normalizeCollection,
    ]);

    /*
    |--------------------------------------------------------------------------
    | NORMALIZED APARTMENTS
    |--------------------------------------------------------------------------
    */

    const normalizedApartments = useMemo(() => {
        return normalizeCollection(
            apartments,
            "apartments"
        );
    }, [
        apartments,
        normalizeCollection,
    ]);

    /*
    |--------------------------------------------------------------------------
    | RESOURCE COUNTS
    |--------------------------------------------------------------------------
    */

    const propertyCount =
        normalizedProperties.length;

    const apartmentCount =
        normalizedApartments.length;

    /*
    |--------------------------------------------------------------------------
    | LOAD FORM DATA
    |--------------------------------------------------------------------------
    */

    const loadFormData = useCallback(
        async () => {
            if (!mountedRef.current) {
                return;
            }

            setFetching(true);

            try {
                const requests = [];

                /*
                |--------------------------------------------------------------------------
                | Load properties
                |--------------------------------------------------------------------------
                */

                if (
                    typeof getProperties ===
                    "function"
                ) {
                    requests.push(
                        getProperties({
                            with_relations: true,
                            _t: Date.now(),
                        })
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | Load apartments
                |--------------------------------------------------------------------------
                */

                if (
                    typeof getApartments ===
                    "function"
                ) {
                    requests.push(
                        getApartments({
                            with_relations: true,
                            _t: Date.now(),
                        })
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | Execute requests
                |--------------------------------------------------------------------------
                */

                await Promise.all(requests);
            } catch (error) {
                console.error(
                    "CREATE UNIT FORM LOAD ERROR:",
                    error
                );

                if (!mountedRef.current) {
                    return;
                }

                const message =
                    getErrorMessage(error) ||
                    "Failed to load properties and apartments.";

                dispatch(
                    addNotification({
                        type: "error",
                        message,
                    })
                );
            } finally {
                if (mountedRef.current) {
                    setFetching(false);
                }
            }
        },
        [
            getProperties,
            getApartments,
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
        loadFormData();
    }, [loadFormData]);

    /*
    |--------------------------------------------------------------------------
    | CREATE UNIT
    |--------------------------------------------------------------------------
    */

    const handleSubmit = useCallback(
        async (payload) => {
            if (
                submitting ||
                unitLoading
            ) {
                return;
            }

            setSubmitting(true);

            try {
                const response =
                    await createUnit(payload);

                console.log(
                    "CREATE UNIT RESPONSE:",
                    response
                );

                if (!mountedRef.current) {
                    return;
                }

                const successMessage =
                    response?.message ||
                    response?.data?.message ||
                    response?.data?.data?.message ||
                    "Unit created successfully.";

                dispatch(
                    addNotification({
                        type: "success",
                        message: successMessage,
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
                    "CREATE UNIT ERROR:",
                    error
                );

                if (!mountedRef.current) {
                    throw error;
                }

                const message =
                    getErrorMessage(error) ||
                    "Failed to create unit.";

                dispatch(
                    addNotification({
                        type: "error",
                        message,
                    })
                );

                /*
                |--------------------------------------------------------------------------
                | Re-throw
                |--------------------------------------------------------------------------
                |
                | Allows UnitForm to handle its own
                | submission state/error.
                |
                */

                throw error;
            } finally {
                if (mountedRef.current) {
                    setSubmitting(false);
                }
            }
        },
        [
            submitting,
            unitLoading,
            createUnit,
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
    }, [
        submitting,
        navigate,
    ]);

    /*
    |--------------------------------------------------------------------------
    | RETRY
    |--------------------------------------------------------------------------
    */

    const handleRetry = useCallback(() => {
        if (
            fetching ||
            submitting
        ) {
            return;
        }

        loadFormData();
    }, [
        fetching,
        submitting,
        loadFormData,
    ]);

    /*
    |--------------------------------------------------------------------------
    | FORM DATA ERROR
    |--------------------------------------------------------------------------
    */

    const formDataError =
        propertiesError ||
        apartmentsError;

    /*
    |--------------------------------------------------------------------------
    | FORM DATA LOADING
    |--------------------------------------------------------------------------
    */

    const formLoading =
        fetching ||
        propertiesLoading ||
        apartmentsLoading;

    /*
    |--------------------------------------------------------------------------
    | CRITICAL RESOURCE ERROR
    |--------------------------------------------------------------------------
    */

    const hasPropertyError =
        Boolean(propertiesError);

    const hasApartmentError =
        Boolean(apartmentsError);

    /*
    |--------------------------------------------------------------------------
    | INITIAL LOADING SCREEN
    |--------------------------------------------------------------------------
    */

    if (fetching) {
        return (
            <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto flex min-h-[560px] max-w-7xl items-center justify-center">
                    <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        {/* TOP ACCENT */}

                        <div className="h-1.5 bg-indigo-600" />

                        <div className="p-8 text-center sm:p-10">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 ring-8 ring-indigo-50/50">
                                <Loader2
                                    size={28}
                                    className="animate-spin text-indigo-600"
                                />
                            </div>

                            <div className="mt-6">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                                    Unit Management
                                </p>

                                <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                                    Preparing Unit Form
                                </h2>

                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                    Loading properties and
                                    apartments required to
                                    create your new unit.
                                </p>
                            </div>

                            {/* LOADING INDICATOR */}

                            <div className="mt-7">
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-600" />
                                </div>
                            </div>

                            {/* LOADING STEPS */}

                            <div className="mt-7 grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left">
                                    <div className="flex items-center gap-2">
                                        <Loader2
                                            size={15}
                                            className="animate-spin text-indigo-500"
                                        />

                                        <span className="text-xs font-semibold text-slate-600">
                                            Properties
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left">
                                    <div className="flex items-center gap-2">
                                        <Loader2
                                            size={15}
                                            className="animate-spin text-indigo-500"
                                        />

                                        <span className="text-xs font-semibold text-slate-600">
                                            Apartments
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-6 text-xs text-slate-400">
                                Please wait while we prepare
                                the form.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETE FORM DATA ERROR
    |--------------------------------------------------------------------------
    |
    | If neither properties nor apartments are available,
    | the user cannot reasonably create a unit.
    |
    */

    if (
        formDataError &&
        propertyCount === 0 &&
        apartmentCount === 0
    ) {
        const message =
            getErrorMessage(formDataError);

        return (
            <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full max-w-3xl">
                    {/* BACK */}

                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={
                                handleCancel
                            }
                            className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
                        >
                            <ArrowLeft
                                size={18}
                                className="transition-transform group-hover:-translate-x-0.5"
                            />

                            Back to Units
                        </button>
                    </div>

                    {/* ERROR CARD */}

                    <div className="overflow-hidden rounded-3xl border border-red-200 bg-white shadow-sm">
                        <div className="h-1.5 bg-red-500" />

                        <div className="p-6 sm:p-8 lg:p-10">
                            <div className="flex flex-col gap-6 sm:flex-row">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 ring-8 ring-red-50/50">
                                    <AlertTriangle
                                        size={26}
                                        className="text-red-600"
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-600">
                                        Unit Management
                                    </p>

                                    <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                        Unable to Load Unit Form
                                    </h1>

                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        We couldn't load the
                                        property and apartment
                                        information required to
                                        create a unit.
                                    </p>

                                    {message && (
                                        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-4">
                                            <div className="flex gap-3">
                                                <AlertTriangle
                                                    size={17}
                                                    className="mt-0.5 shrink-0 text-red-500"
                                                />

                                                <p className="text-sm font-medium leading-6 text-red-700">
                                                    {message}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={
                                                handleRetry
                                            }
                                            disabled={
                                                fetching
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
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
        <div className="min-h-full bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {/* ==========================================================
                    PAGE HEADER
                ========================================================== */}

                <div className="mb-7">
                    {/* BREADCRUMB / BACK */}

                    <button
                        type="button"
                        onClick={
                            handleCancel
                        }
                        disabled={
                            submitting
                        }
                        className="group mb-5 inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ArrowLeft
                            size={17}
                            className="transition-transform group-hover:-translate-x-0.5"
                        />

                        Back to Units
                    </button>

                    {/* HEADER */}

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
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
                                        Create Unit
                                    </h1>

                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                        <Sparkles
                                            size={12}
                                        />

                                        New
                                    </span>
                                </div>

                                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                                    Add a new property unit with
                                    its apartment, pricing,
                                    features and availability
                                    information.
                                </p>
                            </div>
                        </div>

                        {/* RESOURCE SUMMARY */}

                        <div className="flex flex-wrap gap-2">
                            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
                                <CheckCircle2
                                    size={16}
                                    className="text-emerald-500"
                                />

                                <span className="text-xs font-semibold text-slate-600">
                                    {propertyCount}{" "}
                                    {propertyCount === 1
                                        ? "Property"
                                        : "Properties"}
                                </span>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
                                <Building2
                                    size={16}
                                    className="text-indigo-500"
                                />

                                <span className="text-xs font-semibold text-slate-600">
                                    {apartmentCount}{" "}
                                    {apartmentCount === 1
                                        ? "Apartment"
                                        : "Apartments"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ==========================================================
                    RESOURCE WARNING
                ========================================================== */}

                {formDataError && (
                    <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
                        <div className="flex items-start gap-3 bg-amber-50 px-4 py-4 sm:px-5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                                <AlertTriangle
                                    size={18}
                                    className="text-amber-600"
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-amber-900">
                                            Some form data could not
                                            be loaded
                                        </p>

                                        <p className="mt-0.5 text-xs leading-5 text-amber-700">
                                            {hasPropertyError &&
                                                "Property options may be unavailable. "}

                                            {hasApartmentError &&
                                                "Apartment options may be unavailable."}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            handleRetry
                                        }
                                        disabled={
                                            fetching ||
                                            submitting
                                        }
                                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <RefreshCcw
                                            size={14}
                                            className={
                                                fetching
                                                    ? "animate-spin"
                                                    : ""
                                            }
                                        />

                                        Retry
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ==========================================================
                    BACKGROUND LOADING
                ========================================================== */}

                {formLoading &&
                    !fetching &&
                    !submitting && (
                        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3.5 text-sm font-medium text-indigo-700">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                                <Loader2
                                    size={17}
                                    className="animate-spin text-indigo-600"
                                />
                            </div>

                            <div>
                                <p className="font-semibold">
                                    Refreshing form data
                                </p>

                                <p className="text-xs font-normal text-indigo-600">
                                    Updating properties and
                                    apartments...
                                </p>
                            </div>
                        </div>
                    )}

                {/* ==========================================================
                    FORM CONTAINER
                ========================================================== */}

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    {/* FORM HEADER */}

                    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5 sm:px-7">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Unit Information
                                </h2>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Complete the details below to
                                    create the unit.
                                </p>
                            </div>

                            <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 sm:flex">
                                <Building2
                                    size={17}
                                    className="text-indigo-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* UNIT FORM */}

                    <div className="p-1 sm:p-2">
                        <UnitForm
                            properties={
                                normalizedProperties
                            }
                            apartments={
                                normalizedApartments
                            }
                            loading={
                                formLoading ||
                                unitLoading
                            }
                            submitting={
                                submitting ||
                                unitLoading
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
                            title="Create Unit"
                            submitLabel="Create Unit"
                        />
                    </div>
                </div>

                {/* ==========================================================
                    FOOTER NOTE
                ========================================================== */}

                <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                        <span>
                            All required fields should be
                            completed before saving.
                        </span>
                    </div>

                    <span className="text-xs font-medium text-slate-400">
                        Unit Management
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CreateUnit;