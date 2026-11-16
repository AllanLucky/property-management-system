
import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Globe,
    Hash,
    Loader2,
    Phone,
    Save,
    Wallet,
    X,
    Search,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import countryService from "../../../../services/country.service";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const COUNTRY_INDEX_PATH = "/super-admin/countries";

const INITIAL_FORM_DATA = {
    name: "",
    slug: "",
    code: "",
    phone_code: "",
    currency: "",
    is_active: true,
};

/*
|--------------------------------------------------------------------------
| Currency Data
|--------------------------------------------------------------------------
|
| Includes international ISO 4217 currency codes.
| Intl.supportedValuesOf provides the browser's available currency list.
| Additional common currencies are included as a fallback and supplement.
|
*/

const EXTRA_CURRENCIES = {
    KES: "Kenyan Shilling",
    UGX: "Ugandan Shilling",
    TZS: "Tanzanian Shilling",
    RWF: "Rwandan Franc",
    NGN: "Nigerian Naira",
    ZAR: "South African Rand",
    GHS: "Ghanaian Cedi",
    ETB: "Ethiopian Birr",
    EGP: "Egyptian Pound",
    ZMW: "Zambian Kwacha",
    BWP: "Botswana Pula",
    USD: "US Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    JPY: "Japanese Yen",
    CNY: "Chinese Yuan",
    INR: "Indian Rupee",
    CAD: "Canadian Dollar",
    AUD: "Australian Dollar",
    CHF: "Swiss Franc",
    AED: "UAE Dirham",
    SAR: "Saudi Riyal",
    XOF: "West African CFA Franc",
    XAF: "Central African CFA Franc",
    XCD: "East Caribbean Dollar",
    MAD: "Moroccan Dirham",
    DZD: "Algerian Dinar",
    TND: "Tunisian Dinar",
    MUR: "Mauritian Rupee",
    SCR: "Seychellois Rupee",
    SZL: "Swazi Lilangeni",
    LSL: "Lesotho Loti",
    NAD: "Namibian Dollar",
    MWK: "Malawian Kwacha",
    AOA: "Angolan Kwanza",
    MZN: "Mozambican Metical",
    CDF: "Congolese Franc",
    SOS: "Somali Shilling",
    SDG: "Sudanese Pound",
    SSP: "South Sudanese Pound",
    BIF: "Burundian Franc",
    DJF: "Djiboutian Franc",
    ERN: "Eritrean Nakfa",
    GMD: "Gambian Dalasi",
    GNF: "Guinean Franc",
    LRD: "Liberian Dollar",
    SLL: "Sierra Leonean Leone",
    CVE: "Cape Verdean Escudo",
    STN: "São Tomé and Príncipe Dobra",
    MRU: "Mauritanian Ouguiya",
    KMF: "Comorian Franc",
    PHP: "Philippine Peso",
    SGD: "Singapore Dollar",
    MYR: "Malaysian Ringgit",
    THB: "Thai Baht",
    IDR: "Indonesian Rupiah",
    PKR: "Pakistani Rupee",
    BDT: "Bangladeshi Taka",
    NPR: "Nepalese Rupee",
    KRW: "South Korean Won",
    HKD: "Hong Kong Dollar",
    NZD: "New Zealand Dollar",
    TRY: "Turkish Lira",
    RUB: "Russian Ruble",
    BRL: "Brazilian Real",
    MXN: "Mexican Peso",
    ARS: "Argentine Peso",
    CLP: "Chilean Peso",
    COP: "Colombian Peso",
    PEN: "Peruvian Sol",
    UYU: "Uruguayan Peso",
    PLN: "Polish Zloty",
    SEK: "Swedish Krona",
    NOK: "Norwegian Krone",
    DKK: "Danish Krone",
    CZK: "Czech Koruna",
    HUF: "Hungarian Forint",
    RON: "Romanian Leu",
    BGN: "Bulgarian Lev",
    ISK: "Icelandic Krona",
    ILS: "Israeli New Shekel",
    QAR: "Qatari Riyal",
    KWD: "Kuwaiti Dinar",
    BHD: "Bahraini Dinar",
    OMR: "Omani Rial",
    JOD: "Jordanian Dinar",
    IRR: "Iranian Rial",
    IQD: "Iraqi Dinar",
    AFN: "Afghan Afghani",
    UAH: "Ukrainian Hryvnia",
    GEL: "Georgian Lari",
    AMD: "Armenian Dram",
    AZN: "Azerbaijani Manat",
    KZT: "Kazakhstani Tenge",
    UZS: "Uzbekistani Som",
    VND: "Vietnamese Dong",
    KHR: "Cambodian Riel",
    LAK: "Lao Kip",
    MMK: "Myanmar Kyat",
    LKR: "Sri Lankan Rupee",
    MVR: "Maldivian Rufiyaa",
    FJD: "Fijian Dollar",
    PGK: "Papua New Guinean Kina",
};

/*
|--------------------------------------------------------------------------
| Get All Currency Options
|--------------------------------------------------------------------------
*/

const getCurrencyOptions = () => {
    const currencyMap = {
        ...EXTRA_CURRENCIES,
    };

    try {
        if (typeof Intl.supportedValuesOf === "function") {
            const supportedCurrencies =
                Intl.supportedValuesOf("currency");

            const displayNames = new Intl.DisplayNames(
                ["en"],
                { type: "currency" }
            );

            supportedCurrencies.forEach((code) => {
                try {
                    currencyMap[code] =
                        displayNames.of(code) || code;
                } catch {
                    currencyMap[code] = code;
                }
            });
        }
    } catch (error) {
        console.warn(
            "[CountryForm] Currency list fallback:",
            error
        );
    }

    return Object.entries(currencyMap)
        .map(([code, name]) => ({
            code,
            name,
        }))
        .sort((a, b) =>
            a.code.localeCompare(b.code)
        );
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const createSlug = (value = "") => {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-$/g, "");
};

const normalizeErrorMessage = (error) => {
    if (typeof error === "string") {
        return error;
    }

    return (
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again."
    );
};

const getValidationErrors = (error) => {
    const errors =
        error?.response?.data?.errors ||
        error?.errors;

    if (!errors || typeof errors !== "object") {
        return {};
    }

    return Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [
            field,
            Array.isArray(messages)
                ? messages[0]
                : messages,
        ])
    );
};

/*
|--------------------------------------------------------------------------
| Reusable Form Components
|--------------------------------------------------------------------------
*/

const FormField = ({
    label,
    name,
    icon: Icon,
    required = false,
    error,
    hint,
    children,
}) => (
    <div className="min-w-0">
        <label
            htmlFor={name}
            className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700"
        >
            {Icon && (
                <Icon className="h-4 w-4 text-slate-400" />
            )}

            {label}

            {required && (
                <span className="text-red-500">*</span>
            )}
        </label>

        {children}

        {error ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
            </p>
        ) : hint ? (
            <p className="mt-1.5 text-xs text-slate-400">
                {hint}
            </p>
        ) : null}
    </div>
);

const inputClassName = (error) =>
    `h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${error
        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
        : "border-slate-200 focus:border-slate-400 focus:ring-slate-200"
    }`;

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const CountryForm = ({
    mode = "create",
    initialData,
    initialValues,
    values,
    errors: externalErrors,
    loading: externalLoading = false,
    submitting = false,
    onChange: externalOnChange,
    onSubmit: externalOnSubmit,
    onCancel,
    onSuccess,
    currencyOptions: externalCurrencyOptions,
}) => {
    const navigate = useNavigate();

    const isControlled = Boolean(values);

    /*
    |--------------------------------------------------------------------------
    | Currency Options
    |--------------------------------------------------------------------------
    */

    const currencyOptions = useMemo(
        () =>
            externalCurrencyOptions?.length
                ? externalCurrencyOptions.map((item) => ({
                    code: item.value ?? item.code,
                    name: item.label
                        ? item.label.replace(
                            new RegExp(`^${item.value ?? item.code} - `),
                            ""
                        )
                        : item.name,
                }))
                : getCurrencyOptions(),
        [externalCurrencyOptions]
    );

    /*
    |--------------------------------------------------------------------------
    | State
    |--------------------------------------------------------------------------
    */

    const [formData, setFormData] = useState(
        initialValues ||
        initialData ||
        INITIAL_FORM_DATA
    );

    const [localErrors, setLocalErrors] = useState({});

    const [localLoading, setLocalLoading] = useState(false);

    const [slugManuallyEdited, setSlugManuallyEdited] =
        useState(false);

    const [currencySearch, setCurrencySearch] = useState("");

    const currentValues = isControlled
        ? values
        : formData;

    const errors = {
        ...localErrors,
        ...(externalErrors || {}),
    };

    const loading =
        Boolean(localLoading) ||
        Boolean(externalLoading) ||
        Boolean(submitting);

    /*
    |--------------------------------------------------------------------------
    | Synchronize Initial Values
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!isControlled) {
            setFormData(
                initialValues ||
                initialData ||
                INITIAL_FORM_DATA
            );
        }
    }, [initialData, initialValues, isControlled]);

    /*
    |--------------------------------------------------------------------------
    | Generated Slug
    |--------------------------------------------------------------------------
    */

    const generatedSlug = useMemo(
        () => createSlug(currentValues.name || ""),
        [currentValues.name]
    );

    useEffect(() => {
        if (
            !isControlled &&
            !slugManuallyEdited
        ) {
            setFormData((previous) => ({
                ...previous,
                slug: generatedSlug,
            }));
        }
    }, [
        generatedSlug,
        slugManuallyEdited,
        isControlled,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Filter Currency Options
    |--------------------------------------------------------------------------
    */

    const filteredCurrencies = useMemo(() => {
        const search = currencySearch
            .trim()
            .toLowerCase();

        if (!search) {
            return currencyOptions;
        }

        return currencyOptions.filter((currency) =>
            `${currency.code} ${currency.name}`
                .toLowerCase()
                .includes(search)
        );
    }, [currencyOptions, currencySearch]);

    /*
    |--------------------------------------------------------------------------
    | Input Handler
    |--------------------------------------------------------------------------
    */

    const handleChange = (event) => {
        const { name, value, type, checked } =
            event.target;

        let nextValue =
            type === "checkbox"
                ? checked
                : value;

        if (name === "code") {
            nextValue = value
                .toUpperCase()
                .replace(/[^A-Z]/g, "")
                .slice(0, 2);
        }

        if (name === "currency") {
            nextValue = value
                .toUpperCase()
                .slice(0, 3);
        }

        if (name === "phone_code") {
            nextValue = value.replace(
                /[^0-9+]/g,
                ""
            );

            if (nextValue.includes("+")) {
                nextValue =
                    "+" +
                    nextValue
                        .replace(/\+/g, "")
                        .slice(0, 9);
            } else {
                nextValue = nextValue.slice(0, 9);
            }
        }

        if (name === "slug") {
            nextValue = value
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "");

            setSlugManuallyEdited(true);
        }

        if (typeof externalOnChange === "function") {
            externalOnChange(name, nextValue);
        } else {
            setFormData((previous) => ({
                ...previous,
                [name]: nextValue,
            }));
        }

        setLocalErrors((previous) => ({
            ...previous,
            [name]: "",
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | Slug Reset
    |--------------------------------------------------------------------------
    */

    const handleGenerateSlug = () => {
        setSlugManuallyEdited(false);

        const slug = createSlug(currentValues.name);

        if (typeof externalOnChange === "function") {
            externalOnChange("slug", slug);
        } else {
            setFormData((previous) => ({
                ...previous,
                slug,
            }));
        }

        setLocalErrors((previous) => ({
            ...previous,
            slug: "",
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | Client Validation
    |--------------------------------------------------------------------------
    */

    const validateForm = (data = currentValues) => {
        const validationErrors = {};

        const name = String(data.name || "").trim();
        const code = String(data.code || "").trim();
        const phoneCode = String(data.phone_code || "").trim();
        const currency = String(data.currency || "").trim();
        const slug = String(data.slug || "").trim();

        if (!name) {
            validationErrors.name =
                "Country name is required.";
        } else if (
            name.length < 2 ||
            name.length > 100
        ) {
            validationErrors.name =
                "Country name must contain between 2 and 100 characters.";
        }

        if (!code) {
            validationErrors.code =
                "ISO country code is required.";
        } else if (!/^[A-Z]{2}$/.test(code)) {
            validationErrors.code =
                "Enter a valid two-letter uppercase ISO code.";
        }

        if (!phoneCode) {
            validationErrors.phone_code =
                "International phone code is required.";
        } else if (
            !/^\+[1-9][0-9]{0,8}$/.test(phoneCode)
        ) {
            validationErrors.phone_code =
                "Enter a valid international phone code, e.g. +254.";
        }

        if (!currency) {
            validationErrors.currency =
                "Currency code is required.";
        } else if (!/^[A-Z]{3}$/.test(currency)) {
            validationErrors.currency =
                "Currency code must contain exactly 3 uppercase letters.";
        }

        if (slug && slug.length > 120) {
            validationErrors.slug =
                "Country slug cannot exceed 120 characters.";
        } else if (
            slug &&
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
        ) {
            validationErrors.slug =
                "Slug may only contain lowercase letters, numbers and hyphens.";
        }

        setLocalErrors(validationErrors);

        return Object.keys(validationErrors).length === 0;
    };

    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) {
            return;
        }

        if (typeof externalOnSubmit === "function") {
            if (!validateForm()) {
                return;
            }

            await externalOnSubmit({
                ...currentValues,
                name: String(currentValues.name || "").trim(),
                slug:
                    String(currentValues.slug || "").trim() ||
                    createSlug(currentValues.name),
                code: String(currentValues.code || "")
                    .trim()
                    .toUpperCase(),
                phone_code: String(currentValues.phone_code || "").trim(),
                currency: String(currentValues.currency || "")
                    .trim()
                    .toUpperCase(),
                is_active: Boolean(currentValues.is_active),
            });

            return;
        }

        if (!validateForm()) {
            return;
        }

        const payload = {
            name: currentValues.name.trim(),
            slug:
                currentValues.slug.trim() ||
                createSlug(currentValues.name),
            code: currentValues.code.trim().toUpperCase(),
            phone_code: currentValues.phone_code.trim(),
            currency: currentValues.currency.trim().toUpperCase(),
            is_active: Boolean(currentValues.is_active),
        };

        try {
            setLocalLoading(true);
            setLocalErrors({});

            const response =
                await countryService.createCountry(payload);

            const successMessage =
                response?.data?.message ||
                response?.message ||
                "Country created successfully.";

            await Swal.fire({
                icon: "success",
                title: "Country Created",
                text: successMessage,
                confirmButtonColor: "#0f172a",
            });

            if (typeof onSuccess === "function") {
                onSuccess(response);
            } else {
                navigate(COUNTRY_INDEX_PATH);
            }
        } catch (error) {
            const validationErrors =
                getValidationErrors(error);

            if (
                Object.keys(validationErrors).length > 0
            ) {
                setLocalErrors(validationErrors);

                await Swal.fire({
                    icon: "warning",
                    title: "Validation Failed",
                    text: normalizeErrorMessage(error),
                    confirmButtonColor: "#0f172a",
                });

                return;
            }

            await Swal.fire({
                icon: "error",
                title: "Unable to Create Country",
                text: normalizeErrorMessage(error),
                confirmButtonColor: "#0f172a",
            });
        } finally {
            setLocalLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Cancel
    |--------------------------------------------------------------------------
    */

    const handleCancel = () => {
        if (loading) {
            return;
        }

        if (typeof onCancel === "function") {
            onCancel();
            return;
        }

        navigate(COUNTRY_INDEX_PATH);
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div className="min-w-0 space-y-6">

            {/* FORM HEADER */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                        <Globe className="h-6 w-6" />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Country Information
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Enter the country details to register a new country.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Countries
                </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit} noValidate>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <h3 className="text-sm font-bold text-slate-900">
                            Basic Information
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            Fields marked with an asterisk are required.
                        </p>
                    </div>

                    <div className="space-y-6 p-5 sm:p-6">

                        {/* COUNTRY NAME */}

                        <FormField
                            label="Country Name"
                            name="name"
                            icon={Globe}
                            required
                            error={errors.name}
                            hint="Enter the official country name."
                        >
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={currentValues.name || ""}
                                onChange={handleChange}
                                placeholder="e.g. South Africa"
                                maxLength={100}
                                disabled={loading}
                                className={inputClassName(errors.name)}
                            />
                        </FormField>

                        {/* ISO + PHONE */}

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                            <FormField
                                label="ISO Country Code"
                                name="code"
                                icon={Hash}
                                required
                                error={errors.code}
                                hint="Two-letter ISO code, e.g. ZA."
                            >
                                <input
                                    id="code"
                                    name="code"
                                    type="text"
                                    value={currentValues.code || ""}
                                    onChange={handleChange}
                                    placeholder="ZA"
                                    maxLength={2}
                                    disabled={loading}
                                    className={`${inputClassName(errors.code)} uppercase`}
                                />
                            </FormField>

                            <FormField
                                label="International Phone Code"
                                name="phone_code"
                                icon={Phone}
                                required
                                error={errors.phone_code}
                                hint="Include the + prefix, e.g. +27."
                            >
                                <input
                                    id="phone_code"
                                    name="phone_code"
                                    type="text"
                                    inputMode="tel"
                                    value={currentValues.phone_code || ""}
                                    onChange={handleChange}
                                    placeholder="+27"
                                    maxLength={10}
                                    disabled={loading}
                                    className={inputClassName(errors.phone_code)}
                                />
                            </FormField>
                        </div>

                        {/* CURRENCY */}

                        <FormField
                            label="Currency Code"
                            name="currency"
                            icon={Wallet}
                            required
                            error={errors.currency}
                            hint="Search and select the official currency."
                        >
                            <div className="space-y-2">

                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                    <input
                                        type="text"
                                        value={currencySearch}
                                        onChange={(event) =>
                                            setCurrencySearch(event.target.value)
                                        }
                                        placeholder="Search currency, e.g. ZAR or Rand..."
                                        disabled={loading}
                                        className={`${inputClassName(false)} pl-9`}
                                    />
                                </div>

                                <select
                                    id="currency"
                                    name="currency"
                                    value={currentValues.currency || ""}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className={inputClassName(errors.currency)}
                                >
                                    <option value="">
                                        Select currency
                                    </option>

                                    {filteredCurrencies.map((currency) => (
                                        <option
                                            key={currency.code}
                                            value={currency.code}
                                        >
                                            {currency.code} - {currency.name}
                                        </option>
                                    ))}
                                </select>

                                {currentValues.currency && (
                                    <p className="text-xs font-medium text-emerald-700">
                                        Selected currency: {currentValues.currency}
                                    </p>
                                )}
                            </div>
                        </FormField>

                        {/* SLUG */}

                        <FormField
                            label="Country Slug"
                            name="slug"
                            icon={Hash}
                            error={errors.slug}
                            hint="Automatically generated from the country name. You can edit it."
                        >
                            <div className="flex gap-2">
                                <input
                                    id="slug"
                                    name="slug"
                                    type="text"
                                    value={currentValues.slug || ""}
                                    onChange={handleChange}
                                    placeholder="south-africa"
                                    maxLength={120}
                                    disabled={loading}
                                    className={inputClassName(errors.slug)}
                                />

                                <button
                                    type="button"
                                    onClick={handleGenerateSlug}
                                    disabled={
                                        loading ||
                                        !currentValues.name?.trim()
                                    }
                                    className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Generate
                                </button>
                            </div>
                        </FormField>

                        {/* STATUS */}

                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            Country Status
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Determine whether this country is available for use.
                                        </p>
                                    </div>
                                </div>

                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={Boolean(currentValues.is_active)}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="peer sr-only"
                                    />

                                    <div className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 after:absolute after:left-[3px] after:top-[3px] after:h-[18px] after:w-[18px] after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
                                </label>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                                <span
                                    className={`h-2 w-2 rounded-full ${currentValues.is_active
                                        ? "bg-emerald-500"
                                        : "bg-slate-400"
                                        }`}
                                />

                                <span className="text-xs font-semibold text-slate-600">
                                    {currentValues.is_active
                                        ? "Active"
                                        : "Inactive"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* FORM FOOTER */}

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">

                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={loading}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {mode === "edit"
                                        ? "Updating Country..."
                                        : "Creating Country..."}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    {mode === "edit"
                                        ? "Update Country"
                                        : "Create Country"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CountryForm;
