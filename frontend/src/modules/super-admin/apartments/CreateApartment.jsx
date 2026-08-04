import { useEffect, useState } from "react";
import {
  Building2,
  Image as ImageIcon,
  Layers3,
  FileText,
  Hash,
  Save,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

import useApartment from "../../../hooks/useApartment";
import useProperty from "../../../hooks/useProperties";

const CreateApartment = () => {
  const { createApartment, loading } = useApartment();
  const { properties, fetchProperties } = useProperty();

  const propertyList = Array.isArray(properties)
    ? properties
    : properties?.data || [];

  const [form, setForm] = useState({
    property_id: "",
    name: "",
    slug: "",
    code: "",
    description: "",
    total_floors: 0,
    status: "active",
    image: null,
  });

  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];

    setForm((prev) => ({
      ...prev,
      image: file,
    }));

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (
        form[key] !== null &&
        form[key] !== ""
      ) {
        formData.append(key, form[key]);
      }
    });

    await createApartment(formData);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create Apartment
          </h1>

          <p className="mt-1 text-gray-500">
            Add a new apartment block to a property.
          </p>
        </div>

        <Link
          to="/super-admin/apartments"
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-white p-8 shadow"
      >
        <div className="grid gap-6 md:grid-cols-2">
          {/* Property */}
          <div>
            <label className="mb-2 flex items-center gap-2 font-medium">
              <Building2 className="h-4 w-4" />
              Property
            </label>

            <select
              name="property_id"
              value={form.property_id}
              onChange={handleChange}
              required
              className="w-full rounded-lg border px-4 py-3"
            >
              <option value="">
                Select Property
              </option>

              {propertyList.map((property) => (
                <option
                  key={property.id}
                  value={property.id}
                >
                  {property.title}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="mb-2 flex items-center gap-2 font-medium">
              <Building2 className="h-4 w-4" />
              Apartment Name
            </label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Apartment Name"
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-2 flex items-center gap-2 font-medium">
              <Hash className="h-4 w-4" />
              Slug
            </label>

            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          {/* Code */}
          <div>
            <label className="mb-2 flex items-center gap-2 font-medium">
              <Hash className="h-4 w-4" />
              Code
            </label>

            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          {/* Floors */}
          <div>
            <label className="mb-2 flex items-center gap-2 font-medium">
              <Layers3 className="h-4 w-4" />
              Total Floors
            </label>

            <input
              type="number"
              name="total_floors"
              min="0"
              value={form.total_floors}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 font-medium">
              Status
            </label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-3"
            >
              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="maintenance">
                Maintenance
              </option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <label className="mb-2 flex items-center gap-2 font-medium">
            <FileText className="h-4 w-4" />
            Description
          </label>

          <textarea
            rows={5}
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Apartment description..."
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        {/* Image */}
        <div className="mt-6">
          <label className="mb-2 flex items-center gap-2 font-medium">
            <ImageIcon className="h-4 w-4" />
            Apartment Image
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="w-full rounded-lg border px-4 py-3"
          />

          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-4 h-48 w-full rounded-lg object-cover"
            />
          )}
        </div>

        {/* Buttons */}
        <div className="mt-8 flex justify-end gap-4">
          <Link
            to="/super-admin/apartments"
            className="rounded-lg border border-gray-300 px-6 py-3 hover:bg-gray-100"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Create Apartment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateApartment;