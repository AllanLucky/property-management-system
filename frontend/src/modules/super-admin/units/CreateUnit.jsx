
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    ArrowLeft,
    Loader2,
} from "lucide-react";

import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { addNotification } from "../../../store/uiSlice";

import useUnit from "../../../hooks/useUnits";
import useProperty from "../../../hooks/useProperties";
import useApartment from "../../../hooks/useApartment";

import UnitForm from "./unitForm";

const CreateUnit = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    /*
    |--------------------------------------------------------------------------
    | HOOKS
    |--------------------------------------------------------------------------
    */

    const {
        createUnit,
        loading: unitLoading,
        error: unitError,
    } = useUnit();

    const {
        properties,
        loading: propertiesLoading,
        getProperties,
    } = useProperty();

    const {
        apartments,
        loading: apartmentsLoading,
        getApartments,
    } = useApartment();

    /*
    |--------------------------------------------------------------------------
    | LOCAL STATE
    |--------------------------------------------------------------------------
    */

    const [submitting, setSubmitting] =
        useState(false);

    /*
    |--------------------------------------------------------------------------
    | LOAD PROPERTIES
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const loadProperties = async () => {
            try {
                await getProperties({
                    with_relations: true,
                });
            } catch (error) {
                console.error(
                    "Failed to load properties:",
                    error
                );

                dispatch(
                    addNotification({
                        type: "error",
                        message:
                            error?.response?.data
                                ?.message ||
                            "Failed to load properties.",
                    })
                );
            }
        };

        loadProperties();
    }, [
        getProperties,
        dispatch,
    ]);

    /*
    |--------------------------------------------------------------------------
    | LOAD APARTMENTS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const loadApartments = async () => {
            try {
                await getApartments({
                    with_relations: true,
                });
            } catch (error) {
                console.error(
                    "Failed to load apartments:",
                    error
                );

                dispatch(
                    addNotification({
                        type: "error",
                        message:
                            error?.response?.data
                                ?.message ||
                            "Failed to load apartments.",
                    })
                );
            }
        };

        loadApartments();
    }, [
        getApartments,
        dispatch,
    ]);

    /*
    |--------------------------------------------------------------------------
    | CREATE UNIT
    |--------------------------------------------------------------------------
    */

    const handleSubmit = useCallback(
        async (payload) => {
            try {
                setSubmitting(true);

                const response =
                    await createUnit(payload);

                console.log(
                    "CREATE UNIT RESPONSE:",
                    response
                );

                dispatch(
                    addNotification({
                        type: "success",
                        message:
                            response?.message ||
                            response?.data?.message ||
                            "Unit created successfully.",
                    })
                );

                /*
                |--------------------------------------------------------------------------
                | REDIRECT
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

                const message =
                    error?.response?.data
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
                |--------------------------------------------------------------------------
                | IMPORTANT
                |--------------------------------------------------------------------------
                | Throw the error back to UnitForm so
                | it can handle submission state correctly.
                |--------------------------------------------------------------------------
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
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | CANCEL
    |--------------------------------------------------------------------------
    */

    const handleCancel = useCallback(() => {
        navigate(
            "/super-admin/units"
        );
    }, [navigate]);

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    const loading =
        propertiesLoading ||
        apartmentsLoading ||
        unitLoading;

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
                {/* ------------------------------------------------------ */}
                {/* PAGE HEADER */}
                {/* ------------------------------------------------------ */}

                <div className="mb-6">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(-1)
                        }
                        className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            px-3
                            py-2
                            text-sm
                            font-medium
                            text-slate-600
                            transition
                            hover:bg-white
                            hover:text-slate-900
                        "
                    >
                        <ArrowLeft
                            size={18}
                        />

                        Back
                    </button>
                </div>

                {/* ------------------------------------------------------ */}
                {/* GLOBAL LOADING */}
                {/* ------------------------------------------------------ */}

                {loading &&
                    !submitting && (
                        <div className="mb-5 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                            <Loader2
                                size={18}
                                className="animate-spin"
                            />

                            Loading unit data...
                        </div>
                    )}

                {/* ------------------------------------------------------ */}
                {/* FORM */}
                {/* ------------------------------------------------------ */}

                <UnitForm
                    properties={
                        properties || []
                    }
                    apartments={
                        apartments || []
                    }
                    loading={loading}
                    submitting={
                        submitting ||
                        unitLoading
                    }
                    error={unitError}
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

export default CreateUnit;

