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
*/

const CreateUnit = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    /*
    |--------------------------------------------------------------------------
    | UNIT HOOK
    |--------------------------------------------------------------------------
    */

    const {
        createUnit,
        loading: unitLoading,
        error: unitError,
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

    const [submitting, setSubmitting] =
        useState(false);

    const [fetching, setFetching] =
        useState(true);

    /*
    |--------------------------------------------------------------------------
    | LOAD FORM DATA
    |--------------------------------------------------------------------------
    */

    const loadFormData = useCallback(
        async () => {
            setFetching(true);

            try {
                /*
                |------------------------------------------------------------------
                | Load properties and apartments together.
                |------------------------------------------------------------------
                */

                const requests = [];

                if (
                    typeof getProperties ===
                    "function"
                ) {
                    requests.push(
                        getProperties({
                            with_relations: true,
                        })
                    );
                }

                if (
                    typeof getApartments ===
                    "function"
                ) {
                    requests.push(
                        getApartments({
                            with_relations: true,
                        })
                    );
                }

                await Promise.all(
                    requests
                );
            } catch (error) {
                console.error(
                    "FAILED TO LOAD UNIT FORM DATA:",
                    error
                );

                const message =
                    error?.response?.data
                        ?.message ||
                    error?.message ||
                    "Failed to load properties and apartments.";

                dispatch(
                    addNotification({
                        type: "error",
                        message,
                    })
                );
            } finally {
                setFetching(false);
            }
        },
        [
            getProperties,
            getApartments,
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
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    const handleSubmit =
        useCallback(
            async (payload) => {
                if (submitting) {
                    return;
                }

                setSubmitting(true);

                try {
                    const response =
                        await createUnit(
                            payload
                        );

                    console.log(
                        "CREATE UNIT RESPONSE:",
                        response
                    );

                    dispatch(
                        addNotification({
                            type: "success",
                            message:
                                response?.message ||
                                response
                                    ?.data
                                    ?.message ||
                                "Unit created successfully.",
                        })
                    );

                    /*
                    |--------------------------------------------------------------
                    | Redirect after successful creation
                    |--------------------------------------------------------------
                    */

                    navigate(
                        "/super-admin/units"
                    );
                } catch (error) {
                    console.error(
                        "CREATE UNIT ERROR:",
                        error
                    );

                    const message =
                        error
                            ?.response
                            ?.data
                            ?.message ||
                        error?.message ||
                        "Failed to create unit.";

                    dispatch(
                        addNotification({
                            type: "error",
                            message,
                        })
                    );

                    /*
                    |--------------------------------------------------------------
                    | Re-throw the error so UnitForm can handle its own
                    | submission state / validation.
                    |--------------------------------------------------------------
                    */

                    throw error;
                } finally {
                    setSubmitting(false);
                }
            },
            [
                createUnit,
                dispatch,
                navigate,
                submitting,
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
        apartmentsError;

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
                "Unable to load the unit form data."
            );
        }, []);

    /*
    |--------------------------------------------------------------------------
    | LOADING STATE
    |--------------------------------------------------------------------------
    */

    const formLoading =
        fetching ||
        propertiesLoading ||
        apartmentsLoading;

    /*
    |--------------------------------------------------------------------------
    | INITIAL LOADING SCREEN
    |--------------------------------------------------------------------------
    */

    if (fetching) {
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
                            Loading Unit Form
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Loading properties and
                            apartments. Please wait...
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
    | FORM DATA ERROR SCREEN
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
                                        Unit Form
                                    </h1>

                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        We could not
                                        load the
                                        properties
                                        and
                                        apartments
                                        required to
                                        create a
                                        unit.
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

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                                    <Building2Icon />
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                        Create Unit
                                    </h1>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Add a new unit to
                                        your property
                                        with pricing,
                                        features and
                                        availability
                                        information.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ---------------------------------------------------------- */}
                {/* BACKGROUND DATA LOADING */}
                {/* ---------------------------------------------------------- */}

                {formLoading &&
                    !submitting && (
                        <div className="mb-5 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
                            <Loader2
                                size={18}
                                className="animate-spin"
                            />

                            Updating unit form
                            data...
                        </div>
                    )}

                {/* ---------------------------------------------------------- */}
                {/* UNIT FORM */}
                {/* ---------------------------------------------------------- */}

                <UnitForm
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
                        propertiesLoading ||
                        apartmentsLoading ||
                        unitLoading
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
                    title="Create Unit"
                    submitLabel="Create Unit"
                />
            </div>
        </div>
    );
};

/*
|--------------------------------------------------------------------------
| SMALL HEADER ICON
|--------------------------------------------------------------------------
|
| Kept outside CreateUnit so it does not get recreated on every render.
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

export default CreateUnit;