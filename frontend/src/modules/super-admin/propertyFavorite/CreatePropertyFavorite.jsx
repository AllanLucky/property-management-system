import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  ArrowLeft,
  Heart,
  Loader2,
  Save,
  AlertTriangle,
} from "lucide-react";

import {
  createPropertyFavorite,
  selectFavoriteSubmitting,
  selectFavoriteError,
  clearErrors,
} from "../../../store/propertyFavoriteSlice";

import { addNotification } from "../../../store/uiSlice";
import api from "../../../api/axios";

const CreatePropertyFavorite = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | REDUX
  |--------------------------------------------------------------------------
  */

  const submitting = useSelector(selectFavoriteSubmitting);
  const error = useSelector(selectFavoriteError);

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [units, setUnits] = useState([]);

  /*
  |--------------------------------------------------------------------------
  | FORM STATE
  |--------------------------------------------------------------------------
  */

  const [form, setForm] = useState({
    user_id: "",
    property_id: "",
    apartment_id: "",
    unit_id: "",
    notes: "",
    source: "manual",
    is_active: true,
  });

  /*
  |--------------------------------------------------------------------------
  | VALIDATION ERRORS
  |--------------------------------------------------------------------------
  */

  const [errors, setErrors] = useState({});

  /*
  |--------------------------------------------------------------------------
  | LOAD DROPDOWN DATA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadData();
    dispatch(clearErrors());
  }, [dispatch]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        usersRes,
        propertiesRes,
        apartmentsRes,
        unitsRes,
      ] = await Promise.all([
        api.get("/users"),
        api.get("/properties"),
        api.get("/apartments"),
        api.get("/units"),
      ]);

      setUsers(usersRes?.data?.data ?? []);
      setProperties(propertiesRes?.data?.data ?? []);
      setApartments(apartmentsRes?.data?.data ?? []);
      setUnits(unitsRes?.data?.data ?? []);
    } catch (err) {
      dispatch(
        addNotification({
          type: "error",
          message:
            err?.response?.data?.message ||
            "Failed to load form data.",
        })
      );
    } finally {
      setLoading(false);
    }
  };
  /*
|--------------------------------------------------------------------------
| HANDLE INPUT CHANGE
|--------------------------------------------------------------------------
*/

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear validation error for the changed field
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDATE FORM
  |--------------------------------------------------------------------------
  */

  const validate = () => {
    const validation = {};

    if (!form.user_id) {
      validation.user_id = "User is required.";
    }

    if (!form.property_id) {
      validation.property_id = "Property is required.";
    }

    setErrors(validation);

    return Object.keys(validation).length === 0;
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT FORM
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      dispatch(
        addNotification({
          type: "error",
          message: "Please correct the highlighted fields.",
        })
      );
      return;
    }

    try {
      const payload = {
        ...form,
        apartment_id: form.apartment_id || null,
        unit_id: form.unit_id || null,
      };

      const response = await dispatch(
        createPropertyFavorite(payload)
      ).unwrap();

      dispatch(
        addNotification({
          type: "success",
          message:
            response?.message ||
            "Property favorite created successfully.",
        })
      );

      navigate("/super-admin/property-favorites");
    } catch (err) {
      dispatch(
        addNotification({
          type: "error",
          message:
            err?.message ||
            err?.error ||
            err?.response?.data?.message ||
            "Unable to create property favorite.",
        })
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* ==========================================================
          HEADER
      ========================================================== */}

      <div className="bg-white rounded-xl shadow border mb-6">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 border-b">

          <div>

            <Link
              to="/super-admin/property-favorites"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 mb-3"
            >
              <ArrowLeft size={16} />
              Back to Property Favorites
            </Link>

            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Heart className="w-6 h-6 text-red-600 fill-red-500" />
              Create Property Favorite
            </h1>

            <p className="text-gray-500 mt-1">
              Add a property to a user's favorites list.
            </p>

          </div>

        </div>

        {(error || Object.keys(errors).length > 0) && (
          <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">

            <AlertTriangle className="w-5 h-5 text-red-600" />

            <span className="text-red-700">
              {error?.message ||
                error?.error ||
                "Please correct the highlighted fields."}
            </span>

          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white"
        >

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* ================= USER ================= */}

            <div>
              <label className="block text-sm font-medium mb-2">
                User <span className="text-red-500">*</span>
              </label>

              <select
                name="user_id"
                value={form.user_id}
                onChange={handleChange}
                className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.user_id
                    ? "border-red-500"
                    : "border-gray-300"
                  }`}
              >
                <option value="">Select User</option>

                {users.map((user) => (
                  <option
                    key={user.id}
                    value={user.id}
                  >
                    {user.first_name} {user.last_name}
                    {user.email ? ` (${user.email})` : ""}
                  </option>
                ))}
              </select>

              {errors.user_id && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.user_id}
                </p>
              )}
            </div>

            {/* ================= PROPERTY ================= */}

            <div>
              <label className="block text-sm font-medium mb-2">
                Property <span className="text-red-500">*</span>
              </label>

              <select
                name="property_id"
                value={form.property_id}
                onChange={handleChange}
                className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.property_id
                    ? "border-red-500"
                    : "border-gray-300"
                  }`}
              >
                <option value="">Select Property</option>

                {properties.map((property) => (
                  <option
                    key={property.id}
                    value={property.id}
                  >
                    {property.title}
                  </option>
                ))}
              </select>

              {errors.property_id && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.property_id}
                </p>
              )}
            </div>

            {/* ================= APARTMENT ================= */}

            <div>
              <label className="block text-sm font-medium mb-2">
                Apartment
              </label>

              <select
                name="apartment_id"
                value={form.apartment_id}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select Apartment</option>

                {apartments.map((apartment) => (
                  <option
                    key={apartment.id}
                    value={apartment.id}
                  >
                    {apartment.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ================= UNIT ================= */}

            <div>
              <label className="block text-sm font-medium mb-2">
                Unit
              </label>

              <select
                name="unit_id"
                value={form.unit_id}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select Unit</option>

                {units.map((unit) => (
                  <option
                    key={unit.id}
                    value={unit.id}
                  >
                    {unit.name || unit.unit_number}
                  </option>
                ))}
              </select>
            </div>
            {/* ================= NOTES ================= */}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Notes
              </label>

              <textarea
                name="notes"
                rows={4}
                value={form.notes}
                onChange={handleChange}
                placeholder="Optional notes..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* ================= SOURCE ================= */}

            <div>
              <label className="block text-sm font-medium mb-2">
                Source
              </label>

              <input
                type="text"
                name="source"
                value={form.source}
                onChange={handleChange}
                placeholder="manual"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* ================= ACTIVE ================= */}

            <div className="flex items-center gap-3">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />

              <label
                htmlFor="is_active"
                className="text-sm font-medium text-gray-700"
              >
                Favorite is Active
              </label>
            </div>

          </div>

          {/* ================= ACTIONS ================= */}

          <div className="flex justify-end gap-3 border-t p-6">

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-gray-300 px-6 py-3 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Favorite
                </>
              )}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default CreatePropertyFavorite;