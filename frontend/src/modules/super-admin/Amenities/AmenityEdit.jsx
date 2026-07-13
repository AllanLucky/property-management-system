import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api/axios";

import {
  ArrowLeft,
  Loader2,
  Save,
} from "lucide-react";

const AmenityEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    icon: "",
    color: "#3B82F6",
    description: "",
    sort_order: 0,
    is_active: true,
  });


  /*
  |--------------------------------------------------------------------------
  | LOAD AMENITY
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (id) {
      loadAmenity();
    }
  }, [id]);


  const loadAmenity = async () => {
    try {
      setError(null);

      const res = await api.get(`/amenities/${id}`);

      console.log("Amenity API:", res.data);

      const amenity = res?.data?.data;

      if (amenity) {
        setForm((prev) => ({
          ...prev,
          name: amenity.name || "",
          icon: amenity.icon || "",
          color: amenity.color || "#3B82F6",
          description: amenity.description || "",
          sort_order: amenity.sort_order || 0,
          is_active: Boolean(amenity.is_active),
        }));
      }
    } catch (err) {
      console.error("Load amenity error:", err);

      setError(
        err?.response?.data?.message ||
        "Failed to load amenity."
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
    const {
      name,
      value,
      checked,
      type,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };


  /*
  |--------------------------------------------------------------------------
  | UPDATE AMENITY
  |--------------------------------------------------------------------------
  */
  const updateAmenity = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      await api.put(`/amenities/${id}`, form);

      navigate("/super-admin/property-amenities");

    } catch (err) {
      console.error("Update error:", err);

      setError(
        err?.response?.data?.message ||
        "Failed to update amenity."
      );
    } finally {
      setSaving(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }


  return (
    <div className="bg-white rounded-xl border shadow">

      {/* HEADER */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">
          Edit Amenity
        </h1>
      </div>


      {/* ERROR */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600">
          {error}
        </div>
      )}


      {/* FORM */}
      <form
        onSubmit={updateAmenity}
        className="p-6 space-y-4"
      >

        {/* NAME */}
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Amenity name"
          className="w-full border rounded-xl px-4 py-2"
          required
        />


        {/* ICON */}
        <input
          name="icon"
          value={form.icon}
          onChange={handleChange}
          placeholder="Icon name e.g. wifi"
          className="w-full border rounded-xl px-4 py-2"
        />


        {/* COLOR */}
        <div>
          <label className="block mb-2 text-sm text-gray-600">
            Icon Color
          </label>

          <input
            type="color"
            name="color"
            value={form.color}
            onChange={handleChange}
            className="w-20 h-10 border rounded-lg cursor-pointer"
          />
        </div>


        {/* DESCRIPTION */}
        <textarea
          rows={4}
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full border rounded-xl px-4 py-2"
        />


        {/* SORT ORDER */}
        <input
          type="number"
          name="sort_order"
          value={form.sort_order}
          onChange={handleChange}
          placeholder="Sort order"
          className="w-full border rounded-xl px-4 py-2"
        />


        {/* ACTIVE */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />

          Active Amenity
        </label>


        {/* ACTIONS */}
        <div className="flex gap-3 pt-3">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded-xl flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </button>


          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2"
          >
            {saving ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Save size={16} />
            )}

            Save Changes
          </button>

        </div>

      </form>

    </div>
  );
};

export default AmenityEdit;