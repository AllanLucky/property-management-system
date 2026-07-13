import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";

import { Plus, Loader2, ArrowLeft } from "lucide-react";
import api from "../../../api/axios";

/*
|--------------------------------------------------------------------------
| ACTION
|--------------------------------------------------------------------------
*/
import { createPropertyFeature } from "../../../store/propertyFeatureSlice";

const PropertyFeatureCreate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  const [form, setForm] = useState({
    property_id: "",
    name: "",
    value: "",
    type: "text",
    icon: "",
    description: "",
    is_active: true,
    is_highlighted: false,
    sort_order: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | SAFE EXTRACT
  |--------------------------------------------------------------------------
  */
  const extractData = (res) =>
    res?.data?.data ??
    res?.data?.properties ??
    res?.data ??
    [];

  /*
  |--------------------------------------------------------------------------
  | FETCH PROPERTIES
  |--------------------------------------------------------------------------
  */
  const fetchProperties = useCallback(async () => {
    try {
      setLoadingProperties(true);
      setError(null);

      const response = await api.get(
        `/properties?with_relations=true&_t=${Date.now()}`
      );

      const data = extractData(response);

      setProperties(Array.isArray(data) ? data : []);

    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Failed to load properties";

      setError(message);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
      });

    } finally {
      setLoadingProperties(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  /*
  |--------------------------------------------------------------------------
  | HANDLE CHANGE
  |--------------------------------------------------------------------------
  */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name?.trim()) {
      setError("Feature name is required");

      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Feature name is required",
      });

      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...form,
        sort_order: Number(form.sort_order || 1),
      };

      await dispatch(createPropertyFeature(payload)).unwrap();

      await Swal.fire({
        icon: "success",
        title: "Created",
        text: "Property feature created successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/super-admin/property-features");

    } catch (err) {
      const message =
        err?.message || "Failed to create property feature";

      setError(message);

      Swal.fire({
        icon: "error",
        title: "Creation Failed",
        text: message,
      });

    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */
  if (loadingProperties) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 mt-3">
          Loading properties...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Create Property Feature</h1>
          <p className="text-gray-500">
            Attach features like Bedrooms, Bathrooms, etc.
          </p>
        </div>

        <Link
          to="/super-admin/property-features"
          className="flex items-center gap-2 border px-4 py-2 rounded-xl"
        >
          <ArrowLeft size={18} />
          Back
        </Link>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 border rounded">
          {error}
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">

        {/* PROPERTY */}
        <div>
          <label className="text-sm font-medium">Property</label>

          <select
            name="property_id"
            value={form.property_id}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg mt-1"
            required
          >
            <option value="">Select Property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.title}
              </option>
            ))}
          </select>
        </div>

        {/* FEATURE NAME */}
        <div>
          <label className="text-sm font-medium">Feature Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg mt-1"
            placeholder="e.g. Swimming Pool"
            required
          />
        </div>

        {/* VALUE */}
        <div>
          <label className="text-sm font-medium">Value</label>
          <input
            name="value"
            value={form.value}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg mt-1"
          />
        </div>

        {/* TYPE */}
        <div>
          <label className="text-sm font-medium">Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg mt-1"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
          </select>
        </div>

        {/* ICON */}
        <div>
          <label className="text-sm font-medium">Icon</label>
          <input
            name="icon"
            value={form.icon}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg mt-1"
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg mt-1"
            rows={3}
          />
        </div>

        {/* SORT ORDER */}
        <div>
          <label className="text-sm font-medium">Sort Order</label>
          <input
            type="number"
            name="sort_order"
            value={form.sort_order}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-lg mt-1"
          />
        </div>

        {/* CHECKBOXES */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            Active
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_highlighted"
              checked={form.is_highlighted}
              onChange={handleChange}
            />
            Highlighted
          </label>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pt-4">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Plus size={18} />
            )}
            Create
          </button>

        </div>
      </form>
    </div>
  );
};

export default PropertyFeatureCreate;