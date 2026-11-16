
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    ArrowLeft,
    Loader2,
    RefreshCw,
} from "lucide-react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import Swal from "sweetalert2";

import CountryForm from "./CountryForm";
import useCountries from "../../../../hooks/useCountries";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const COUNTRY_INDEX_PATH = "/super-admin/countries";

const INITIAL_FORM_VALUES = {
    name: "",
    slug: "",
    code: "",
    phone_code: "",
    currency: "",
    is_active: true,
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getCountryRecord = (response) => {
    if (!response || typeof response !== "object") {
        return null;
    }

    if (
        response.id &&
        response.name &&
        response.code
    ) {
        return response;
    }

    const candidates = [
        response.country,
        response.data?.country,
        response.data?.data?.country,
        response.data?.data,
        response.data,
        response.payload?.country,
        response.payload?.data,
        response.payload,
    ];

    for (const candidate of candidates) {
        if (
            candidate &&
            typeof candidate === "object" &&
            candidate.id &&
            candidate.name &&
            candidate.code
        ) {
            return candidate;
        }
    }

    return null;
};

const getCountryFormValues = (country) => ({
    name: country?.name || "",
    slug: country?.slug || "",
    code: country?.code || "",
    phone_code: country?.phone_code || "",
    currency: country?.currency || "",
    is_active: Boolean(country?.is_active),
});

const getErrorMessage = (error) => {
    if (typeof error === "string") {
        return error;
    }

    return (
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.payload?.message ||
        error?.message ||
        "Unable to update country. Please try again."
    );
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const EditCountry = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    /*
    |--------------------------------------------------------------------------
    | Countries Hook
    |--------------------------------------------------------------------------
    |
    | Use the actual function names exported by useCountries.js.
    |
    */

    const {
        selectedCountry,
        fetchCountry,
        updateCountry,
        detailsLoading,
        submitting,
        error,
        validationErrors,
        clearErrors,
    } = useCountries({
        autoFetch: false,
    });

    /*
    |--------------------------------------------------------------------------
    | Local State
    |--------------------------------------------------------------------------
    */

    const [formValues, setFormValues] = useState(
        INITIAL_FORM_VALUES
    );

    const [countryLoaded, setCountryLoaded] = useState(false);
    const [localError, setLocalError] = useState("");

    const loading =
        Boolean(detailsLoading) ||
        Boolean(submitting);

    /*
    |--------------------------------------------------------------------------
    | Resolve Selected Country
    |--------------------------------------------------------------------------
    */

    const country = useMemo(
        () => getCountryRecord(selectedCountry),
        [selectedCountry]
    );

    const isCorrectCountry = useMemo(
        () =>
            Boolean(
                country &&
                String(country.id) === String(id)
            ),
        [country, id]
    );

    /*
    |--------------------------------------------------------------------------
    | Fetch Country Details
    |--------------------------------------------------------------------------
    */

    const loadCountry = useCallback(async () => {
        if (!id) {
            setLocalError("Country ID was not provided.");
            setCountryLoaded(false);
            return;
        }

        try {
            setLocalError("");
            setCountryLoaded(false);

            clearErrors?.();

            if (typeof fetchCountry !== "function") {
                throw new Error(
                    "fetchCountry is not available in useCountries. Check your hook export."
                );
            }

            await fetchCountry(id);
        } catch (requestError) {
            setLocalError(
                getErrorMessage(requestError)
            );
        }
    }, [
        id,
        fetchCountry,
        clearErrors,
    ]);

    useEffect(() => {
        loadCountry();
    }, [loadCountry]);

    /*
    |--------------------------------------------------------------------------
    | Populate Form
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!isCorrectCountry) {
            return;
        }

        setFormValues(
            getCountryFormValues(country)
        );

        setCountryLoaded(true);
    }, [
        country,
        isCorrectCountry,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Handle Input Changes
    |--------------------------------------------------------------------------
    */

    const handleChange = useCallback((name, value) => {
        setFormValues((previous) => ({
            ...previous,
            [name]: value,
        }));

        setLocalError("");
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Submit Updated Country
    |--------------------------------------------------------------------------
    */

    const handleSubmit = useCallback(
        async (payload) => {
            if (!id || submitting) {
                return;
            }

            try {
                setLocalError("");

                clearErrors?.();

                if (typeof updateCountry !== "function") {
                    throw new Error(
                        "updateCountry is not available in useCountries."
                    );
                }

                /*
                 * Correct hook signature:
                 * updateCountry(id, payload)
                 */
                const response = await updateCountry(
                    id,
                    payload
                );

                if (
                    response === false ||
                    response?.error ||
                    response?.status === false ||
                    response?.payload?.status === false
                ) {
                    throw (
                        response?.error ||
                        response?.payload ||
                        response
                    );
                }

                const successMessage =
                    response?.data?.message ||
                    response?.payload?.message ||
                    response?.message ||
                    "Country updated successfully.";

                await Swal.fire({
                    icon: "success",
                    title: "Country Updated",
                    text: successMessage,
                    confirmButtonColor: "#0f172a",
                });

                navigate(COUNTRY_INDEX_PATH);
            } catch (submitError) {
                const message =
                    getErrorMessage(submitError);

                setLocalError(message);

                await Swal.fire({
                    icon: "error",
                    title: "Unable to Update Country",
                    text: message,
                    confirmButtonColor: "#0f172a",
                });
            }
        },
        [
            id,
            submitting,
            updateCountry,
            clearErrors,
            navigate,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | Cancel
    |--------------------------------------------------------------------------
    */

    const handleCancel = useCallback(() => {
        if (loading) {
            return;
        }

        navigate(COUNTRY_INDEX_PATH);
    }, [
        loading,
        navigate,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Retry Loading
    |--------------------------------------------------------------------------
    */

    const handleRetry = useCallback(() => {
        setLocalError("");
        loadCountry();
    }, [loadCountry]);

    /*
    |--------------------------------------------------------------------------
    | Loading State
    |--------------------------------------------------------------------------
    */

    if (detailsLoading && !isCorrectCountry) {
        return (
            <div className="min-w-0 space-y-6">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Edit Country
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Loading country information...
                            </p>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="animate-pulse space-y-6">

                        <div className="h-5 w-40 rounded bg-slate-200" />

                        <div className="space-y-2">
                            <div className="h-4 w-32 rounded bg-slate-200" />
                            <div className="h-11 w-full rounded-xl bg-slate-100" />
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div className="space-y-2">
                                <div className="h-4 w-32 rounded bg-slate-200" />
                                <div className="h-11 rounded-xl bg-slate-100" />
                            </div>

                            <div className="space-y-2">
                                <div className="h-4 w-32 rounded bg-slate-200" />
                                <div className="h-11 rounded-xl bg-slate-100" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="h-4 w-32 rounded bg-slate-200" />
                            <div className="h-11 rounded-xl bg-slate-100" />
                        </div>

                        <div className="h-20 rounded-xl bg-slate-100" />
                    </div>
                </div>
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Country Not Found / Loading Error
    |--------------------------------------------------------------------------
    */

    if (
        !isCorrectCountry &&
        !detailsLoading &&
        !countryLoaded
    ) {
        const errorMessage =
            localError ||
            (typeof error === "string"
                ? error
                : getErrorMessage(error)) ||
            "The requested country could not be found.";

        return (
            <div className="min-w-0 space-y-6">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Edit Country
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Update country information.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleCancel}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Countries
                    </button>
                </div>

                <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <AlertCircle className="h-7 w-7" />
                    </div>

                    <h2 className="mt-4 text-lg font-bold text-slate-900">
                        Unable to Load Country
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                        {errorMessage}
                    </p>

                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">

                        <button
                            type="button"
                            onClick={handleRetry}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </button>

                        <button
                            type="button"
                            onClick={handleCancel}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Countries
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Render Edit Form
    |--------------------------------------------------------------------------
    */

    return (
        <div className="min-w-0 space-y-6">

            {/* PAGE HEADER */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-slate-900">
                            Edit Country
                        </h1>

                        {country?.is_active ? (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                Active
                            </span>
                        ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                Inactive
                            </span>
                        )}
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                        Update the information for{" "}
                        <span className="font-semibold text-slate-700">
                            {country?.name}
                        </span>
                        .
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Countries
                </button>
            </div>

            {/* GENERAL ERROR */}

            {localError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                    <div>
                        <p className="text-sm font-semibold text-red-800">
                            Something went wrong
                        </p>

                        <p className="mt-1 text-sm text-red-700">
                            {localError}
                        </p>
                    </div>
                </div>
            )}

            {/* COUNTRY FORM */}

            <CountryForm
                key={country?.id}
                mode="edit"
                values={formValues}
                errors={validationErrors || {}}
                loading={detailsLoading}
                submitting={submitting}
                onChange={handleChange}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
            />
        </div>
    );
};

export default EditCountry;
