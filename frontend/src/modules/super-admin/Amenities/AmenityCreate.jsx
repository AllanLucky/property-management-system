import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";

import {
  ArrowLeft,
  Loader2,
  Save,
} from "lucide-react";

const AmenityCreate = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    display_name: "",
    icon: "",
    color: "#3B82F6",
    description: "",
    sort_order: 0,
    is_active: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await api.post("/amenities", form);

      navigate("/super-admin/property-amenities");
    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.message ||
          "Failed to create amenity."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow">

      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">
          Create Amenity
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-6 space-y-5"
      >
        <div>
          <label>Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-2"
            required
          />
        </div>

        <div>
          <label>Display Name</label>
          <input
            name="display_name"
            value={form.display_name}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-2"
          />
        </div>

        <div>
          <label>Icon</label>
          <input
            name="icon"
            value={form.icon}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-2"
          />
        </div>

        <div>
          <label>Color</label>
          <input
            type="color"
            name="color"
            value={form.color}
            onChange={handleChange}
            className="h-12 w-24"
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            rows={4}
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-2"
          />
        </div>

        <div>
          <label>Sort Order</label>
          <input
            type="number"
            name="sort_order"
            value={form.sort_order}
            onChange={handleChange}
            className="w-full border rounded-xl px-4 py-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />

          <span>Active</span>
        </div>

        <div className="flex gap-3">
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
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2"
          >
            {loading ? (
              <Loader2
                className="animate-spin"
                size={16}
              />
            ) : (
              <Save size={16} />
            )}

            Save Amenity
          </button>
        </div>
      </form>
    </div>
  );
};

export default AmenityCreate;