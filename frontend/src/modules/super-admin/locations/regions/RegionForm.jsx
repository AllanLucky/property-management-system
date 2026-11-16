
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Globe2,
  Hash,
  Loader2,
  MapPin,
  Save,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const createSlug = (value = "") => {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

/*
|--------------------------------------------------------------------------
| Region Form
|--------------------------------------------------------------------------
*/

const RegionForm = ({
  initialData = null,
  countries = [],
  onSubmit,
  submitting = false,
  validationErrors = {},
  mode = "create",
}) => {
  const navigate = useNavigate();

  const isEdit = mode === "edit" || Boolean(initialData?.id);

  /*
  |--------------------------------------------------------------------------
  | Form State
  |--------------------------------------------------------------------------
  */

  const [formData, setFormData] = useState({
    country_id: "",
    name: "",
    slug: "",
    code: "",
    is_active: true,
  });

  const [errors, setErrors] = useState({});

  /*
  |--------------------------------------------------------------------------
  | Populate Form
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (initialData) {
      setFormData({
        country_id: initialData.country_id
          ? String(initialData.country_id)
          : "",
        name: initialData.name || "",
        slug: initialData.slug || "",
        code: initialData.code || "",
        is_active: initialData.is_active ?? true,
      });
    }
  }, [initialData]);

  /*
  |--------------------------------------------------------------------------
  | Validation Errors
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (validationErrors) {
      setErrors(validationErrors);
    }
  }, [validationErrors]);

  /*
  |--------------------------------------------------------------------------
  | Selected Country
  |--------------------------------------------------------------------------
  */

  const selectedCountry = useMemo(() => {
    return countries.find(
      (country) =>
        String(country.id) === String(formData.country_id)
    );
  }, [countries, formData.country_id]);

  /*
  |--------------------------------------------------------------------------
  | Input Handler
  |--------------------------------------------------------------------------
  */

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const nextValue = type === "checkbox" ? checked : value;

    setFormData((previous) => {
      const updated = {
        ...previous,
        [name]: nextValue,
      };

      // Automatically generate the slug when the region name changes.
      if (name === "name") {
        updated.slug = createSlug(value);
      }

      // Region codes are always uppercase.
      if (name === "code") {
        updated.code = value.toUpperCase();
      }

      return updated;
    });

    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Form Submission
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({});

    const payload = {
      country_id: Number(formData.country_id),
      name: formData.name.trim(),
      slug: formData.slug.trim() || createSlug(formData.name),
      code: formData.code.trim().toUpperCase(),
      is_active: Boolean(formData.is_active),
    };

    const localErrors = {};

    if (!payload.country_id) {
      localErrors.country_id = ["Please select a country."];
    }

    if (!payload.name) {
      localErrors.name = ["The region name is required."];
    } else if (payload.name.length < 2) {
      localErrors.name = [
        "The region name must contain at least 2 characters.",
      ];
    }

    if (!payload.code) {
      localErrors.code = ["The region code is required."];
    } else if (payload.code.length < 2) {
      localErrors.code = [
        "The region code must contain at least 2 characters.",
      ];
    }

    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    try {
      await onSubmit?.(payload);
    } catch (error) {
      const serverErrors =
        error?.response?.data?.errors ||
        error?.errors ||
        {};

      setErrors(serverErrors);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Error Helper
  |--------------------------------------------------------------------------
  */

  const getError = (field) => {
    const error = errors?.[field];

    if (Array.isArray(error)) {
      return error[0];
    }

    if (typeof error === "string") {
      return error;
    }

    return null;
  };

  /*
  |--------------------------------------------------------------------------
  | Input Styling
  |--------------------------------------------------------------------------
  */

  const inputClass = (field) => `
    h-11 w-full rounded-xl border bg-gray-50/50 px-4 text-sm
    text-gray-700 outline-none transition
    placeholder:text-gray-400
    focus:bg-white focus:ring-2
    disabled:cursor-not-allowed disabled:opacity-60
    ${getError(field)
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-gray-200 focus:border-indigo-400 focus:ring-indigo-100"
    }
  `;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? "Update Region" : "Create New Region"}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {isEdit
              ? "Update the region information below."
              : "Enter the details below to register a new region."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* General Error */}

      {getError("general") && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <p className="text-sm text-red-700">
            {getError("general")}
          </p>
        </div>
      )}

      {/* Region Information */}

      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
            <MapPin className="h-5 w-5 text-indigo-600" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Region Information
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Provide the basic details of this region.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Country */}

          <div className="md:col-span-2">
            <label
              htmlFor="country_id"
              className="mb-2 block text-xs font-semibold text-gray-600"
            >
              Country <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <select
                id="country_id"
                name="country_id"
                value={formData.country_id}
                onChange={handleChange}
                disabled={submitting}
                className={`${inputClass("country_id")} appearance-none pl-10 pr-10`}
              >
                <option value="">Select Country</option>

                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                    {country.code ? ` (${country.code})` : ""}
                  </option>
                ))}
              </select>

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                ▼
              </span>
            </div>

            {getError("country_id") && (
              <p className="mt-1.5 text-xs text-red-600">
                {getError("country_id")}
              </p>
            )}

            {selectedCountry && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2">
                <Globe2 className="h-4 w-4 text-indigo-600" />

                <span className="text-xs font-medium text-indigo-700">
                  Selected country: {selectedCountry.name}
                </span>
              </div>
            )}
          </div>

          {/* Region Name */}

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-xs font-semibold text-gray-600"
            >
              Region Name <span className="text-red-500">*</span>
            </label>

            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Nairobi Region"
              disabled={submitting}
              className={inputClass("name")}
              maxLength={100}
            />

            {getError("name") && (
              <p className="mt-1.5 text-xs text-red-600">
                {getError("name")}
              </p>
            )}
          </div>

          {/* Region Code */}

          <div>
            <label
              htmlFor="code"
              className="mb-2 block text-xs font-semibold text-gray-600"
            >
              Region Code <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                id="code"
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. NBI"
                disabled={submitting}
                className={`${inputClass("code")} pl-10 uppercase`}
                maxLength={10}
              />
            </div>

            {getError("code") && (
              <p className="mt-1.5 text-xs text-red-600">
                {getError("code")}
              </p>
            )}

            <p className="mt-1 text-[11px] text-gray-400">
              Use 2–10 characters. Letters, numbers, dashes and underscores.
            </p>
          </div>

          {/* Region Slug */}

          <div className="md:col-span-2">
            <label
              htmlFor="slug"
              className="mb-2 block text-xs font-semibold text-gray-600"
            >
              Region Slug
            </label>

            <input
              id="slug"
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="e.g. nairobi-region"
              disabled={submitting}
              className={inputClass("slug")}
              maxLength={150}
            />

            {getError("slug") && (
              <p className="mt-1.5 text-xs text-red-600">
                {getError("slug")}
              </p>
            )}

            <p className="mt-1 text-[11px] text-gray-400">
              Automatically generated from the region name. You can edit it.
            </p>
          </div>
        </div>
      </div>

      {/* Region Status */}

      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Region Status
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Control whether this region is active.
            </p>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="is_active"
            checked={Boolean(formData.is_active)}
            onChange={handleChange}
            disabled={submitting}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />

          <span>
            <span className="block text-sm font-semibold text-gray-800">
              Active Region
            </span>

            <span className="mt-1 block text-xs text-gray-500">
              {formData.is_active
                ? "This region is active and available for use."
                : "This region is inactive and may not be available for selection."}
            </span>
          </span>
        </label>
      </div>

      {/* Form Actions */}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEdit ? "Updating Region..." : "Creating Region..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEdit ? "Update Region" : "Create Region"}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default RegionForm;
