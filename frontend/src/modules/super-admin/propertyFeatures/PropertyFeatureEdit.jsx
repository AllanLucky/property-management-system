import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import { Loader2, ArrowLeft, Save } from "lucide-react";

/*
|--------------------------------------------------------------------------
| ACTIONS
|--------------------------------------------------------------------------
*/
import {
  fetchPropertyFeatureById,
  updatePropertyFeature,
} from "../../../store/propertyFeatureSlice";

const PropertyFeatureEdit = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */
  const [form, setForm] = useState({
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
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | SAFE RESPONSE EXTRACTOR
  |--------------------------------------------------------------------------
  */
  const extractFeature = (res) => {
    return (
      res?.data?.data ??
      res?.payload?.data ??
      res?.data?.feature ??
      res?.data?.property_feature ??
      res?.data ??
      res
    );
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD FEATURE
  |--------------------------------------------------------------------------
  */
  const loadFeature = useCallback(async () => {
    if (!id) {
      setError("Missing feature ID");
      setFetching(false);
      return;
    }

    try {
      setFetching(true);
      setError(null);

      const res = await dispatch(fetchPropertyFeatureById(id)).unwrap();
      const feature = extractFeature(res);

      if (!feature) throw new Error("Invalid feature response");

      setForm({
        name: feature.name ?? "",
        value: feature.value ?? "",
        type: feature.type ?? "text",
        icon: feature.icon ?? "",
        description: feature.description ?? "",
        is_active: Boolean(feature.is_active),
        is_highlighted: Boolean(feature.is_highlighted),
        sort_order: Number(feature.sort_order ?? 1),
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load feature";

      setError(message);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
      });
    } finally {
      setFetching(false);
    }
  }, [id, dispatch]);

  useEffect(() => {
    loadFeature();
  }, [loadFeature]);

  /*
  |--------------------------------------------------------------------------
  | HANDLE CHANGE
  |--------------------------------------------------------------------------
  */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value)
          : value,
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
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: form.name,
        value: form.value,
        type: form.type,
        icon: form.icon,
        description: form.description,
        is_active: form.is_active,
        is_highlighted: form.is_highlighted,
        sort_order: Number(form.sort_order || 1),
      };

      await dispatch(
        updatePropertyFeature({
          id: Number(id),
          data: payload,
        })
      ).unwrap();

      await Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Property feature updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/super-admin/property-features");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update feature";

      setError(message);

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING UI
  |--------------------------------------------------------------------------
  */
  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 mt-3">Loading feature...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Edit Property Feature</h1>
          <p className="text-gray-500">Update feature information</p>
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

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-lg"
          placeholder="Feature Name"
        />

        <input
          name="value"
          value={form.value}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-lg"
          placeholder="Value"
        />

        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-lg"
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="boolean">Boolean</option>
        </select>

        <input
          name="icon"
          value={form.icon}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-lg"
          placeholder="Icon"
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-lg"
          rows={3}
          placeholder="Description"
        />

        <input
          type="number"
          name="sort_order"
          value={form.sort_order}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-lg"
        />

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
              <Save size={18} />
            )}
            Update
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyFeatureEdit;