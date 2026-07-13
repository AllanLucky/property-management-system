import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../../api/axios";

import {
  Building2,
  MapPin,
  FileText,
  Loader2,
  UploadCloud,
  BadgeCheck,
  X,
  ImagePlus,
  ArrowLeft,
} from "lucide-react";

const EditProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    status: "active",
    cover_image: null,
    remove_image: false,
  });

  /*
  |--------------------------------------------------------------------------
  | FETCH PROPERTY
  |--------------------------------------------------------------------------
  */
  const fetchProperty = async () => {
    try {
      const res = await api.get(`/properties/${id}`);
      const property = res.data?.data;

      setForm({
        name: property?.name || "",
        description: property?.description || "",
        location: property?.location || "",
        status: property?.status || "active",
        cover_image: null,
        remove_image: false,
      });

      // FIX: match PropertyResource accessor
      setPreview(property?.cover_image_url || null);
    } catch (err) {
      console.error("FETCH ERROR:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | HANDLE CHANGE
  |--------------------------------------------------------------------------
  */
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | IMAGE CHANGE
  |--------------------------------------------------------------------------
  */
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      cover_image: file,
      remove_image: false,
    }));

    setPreview(URL.createObjectURL(file));
  };

  /*
  |--------------------------------------------------------------------------
  | REMOVE IMAGE
  |--------------------------------------------------------------------------
  */
  const handleRemoveImage = () => {
    setForm((prev) => ({
      ...prev,
      cover_image: null,
      remove_image: true,
    }));

    setPreview(null);
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setErrors({});

    try {
      const formData = new FormData();

      formData.append("_method", "PUT");
      formData.append("name", form.name);
      formData.append("description", form.description || "");
      formData.append("location", form.location);
      formData.append("status", form.status);

      if (form.cover_image) {
        formData.append("cover_image", form.cover_image);
      }

      if (form.remove_image) {
        formData.append("remove_image", "1");
      }

      await api.post(`/properties/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/super-admin/properties");
    } catch (err) {
      console.error("UPDATE ERROR:", err);
      setErrors(err?.response?.data?.errors || {});
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */
  if (fetching) {
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="animate-spin text-blue-600" size={34} />
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */
  return (
    <div className="max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Edit Property</h1>
          <p className="text-gray-500">
            Edit and publish a Update property listing
          </p>
        </div>

        <Link
          to="/super-admin/properties"
          className="flex items-center gap-2 border px-4 py-2 rounded-xl"
        >
          <ArrowLeft size={18} />
          Back
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow space-y-5"
        >

          {/* NAME */}
          <div>
            <label className="text-sm font-medium">Property Name</label>
            <div className="relative mt-1">
              <Building2 className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded-xl pl-10 py-3 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* LOCATION */}
          <div>
            <label className="text-sm font-medium">Location</label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full border rounded-xl pl-10 py-3 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* STATUS */}
          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border rounded-xl p-3 dark:bg-slate-800"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-sm font-medium">Description</label>
            <div className="relative mt-1">
              <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
              <textarea
                rows="5"
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full border rounded-xl pl-10 py-3 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {loading ? "Updating..." : "Update Property"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/super-admin/properties")}
              className="bg-gray-300 px-6 py-3 rounded-xl"
            >
              Cancel
            </button>
          </div>

        </form>

        {/* IMAGE PANEL */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-5">

          <h3 className="text-lg font-bold mb-3">Property Image</h3>

          {/* IMAGE PREVIEW */}
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                className="w-full h-52 object-cover rounded-xl"
              />

              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center bg-gray-100 rounded-xl">
              <UploadCloud className="text-gray-400" size={40} />
              <p className="text-xs text-gray-500 mt-2">No image selected</p>
            </div>
          )}

          {/* UPLOAD */}
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <ImagePlus size={16} />
              Replace Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="text-sm w-full"
            />
          </div>

          {/* STATUS BADGE */}
          <div className="mt-5">
            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
              <BadgeCheck size={14} />
              {form.status}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default EditProperty;