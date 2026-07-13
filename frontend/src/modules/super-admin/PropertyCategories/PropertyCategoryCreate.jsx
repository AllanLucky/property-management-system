import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  FolderTree,
  FileText,
  Tag,
  AlertTriangle,
  Building2,
  Loader2,
  Save,
  BadgeCheck,
  Star,
  ImagePlus,
} from "lucide-react";

import { createPropertyCategory } from "../../../store/propertyCategorySlice";
import { addNotification } from "../../../store/uiSlice";
import api from "../../../api/axios";

const PropertyCategoryCreate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | REDUX STATE
  |--------------------------------------------------------------------------
  */
  const { creating, error } = useSelector(
    (state) => state.propertyCategories
  );

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: null,

    status: "active",
    is_featured: false,

    meta_title: "",
    meta_description: "",
    meta_keywords: "",

    sort_order: 0,

    property_ids: [],
  });

  const [imagePreview, setImagePreview] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | FETCH PROPERTIES
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    let isMounted = true;

    const fetchProperties = async () => {
      try {
        setLoadingProperties(true);

        const response = await api.get("/properties");

        if (isMounted) {
          setProperties(response?.data?.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch properties", err);
      } finally {
        if (isMounted) setLoadingProperties(false);
      }
    };

    fetchProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | HANDLE INPUT CHANGE
  |--------------------------------------------------------------------------
  */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | AUTO GENERATE SLUG
  |--------------------------------------------------------------------------
  */
  const handleNameChange = useCallback((e) => {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      name: value,
      slug: value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, ""),
    }));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | HANDLE PROPERTY SELECT
  |--------------------------------------------------------------------------
  */
  const handlePropertySelect = useCallback((e) => {
    const selected = Array.from(
      e.target.selectedOptions,
      (option) => Number(option.value)
    );

    setForm((prev) => ({
      ...prev,
      property_ids: selected,
    }));
  }, []);

  /*
  |--------------------------------------------------------------------------
  | HANDLE IMAGE
  |--------------------------------------------------------------------------
  */
  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      image: file,
    }));

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CLEAN IMAGE PREVIEW MEMORY
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  /*
  |--------------------------------------------------------------------------
  | BUILD FORM DATA
  |--------------------------------------------------------------------------
  */
  const buildFormData = (form) => {
    const payload = new FormData();

    payload.append("name", form.name);
    payload.append("slug", form.slug);
    payload.append("description", form.description || "");
    payload.append("status", form.status);
    payload.append("is_featured", form.is_featured ? 1 : 0);
    payload.append("meta_title", form.meta_title || "");
    payload.append("meta_description", form.meta_description || "");
    payload.append("meta_keywords", form.meta_keywords || "");
    payload.append("sort_order", Number(form.sort_order));

    if (form.image) {
      payload.append("image", form.image);
    }

    form.property_ids.forEach((id, index) => {
      payload.append(`property_ids[${index}]`, id);
    });

    return payload;
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT FORM
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = buildFormData(form);

      const resultAction = await dispatch(
        createPropertyCategory(payload)
      );

      if (createPropertyCategory.fulfilled.match(resultAction)) {
        dispatch(
          addNotification({
            type: "success",
            title: "Property Category Created",
            message:
              resultAction.payload?.message ||
              `${form.name} has been created successfully.`,
          })
        );

        navigate("/super-admin/property-categories");
      } else {
        dispatch(
          addNotification({
            type: "error",
            title: "Creation Failed",
            message:
              resultAction.payload?.message ||
              "Failed to create property category.",
          })
        );
      }
    } catch (err) {
      dispatch(
        addNotification({
          type: "error",
          title: "Error",
          message: err?.message || "An unexpected error occurred.",
        })
      );
    }
  };

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-11 w-11 rounded-xl border flex items-center justify-center hover:bg-gray-100 transition"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create Property Category
            </h1>
            <p className="text-gray-500">
              Add categories to organize your property listings.
            </p>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-600">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>
              {error?.message || error || "Failed to create property category."}
            </span>
          </div>
        </div>
      )}

      {/* FORM */}
      <div className="rounded-3xl border bg-white shadow-sm">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">

          {/* BASIC */}
          <div>
            <h2 className="text-lg font-semibold mb-5">
              Category Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* NAME */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <FolderTree size={16} />
                  Category Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleNameChange}
                  required
                  placeholder="Apartment, Villa..."
                  className="w-full rounded-xl border px-4 py-3 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* SLUG */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Tag size={16} />
                  Slug
                </label>

                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border px-4 py-3 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* IMAGE */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <ImagePlus size={16} />
                  Category Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full rounded-xl border px-4 py-3"
                />

                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-40 w-40 mt-4 object-cover rounded-xl border"
                  />
                )}
              </div>

              {/* PROPERTIES */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Building2 size={16} />
                  Select Properties
                </label>

                <select
                  multiple
                  name="property_ids"
                  value={form.property_ids}
                  onChange={handlePropertySelect}
                  className="w-full min-h-[180px] rounded-xl border px-4 py-3"
                >
                  {loadingProperties ? (
                    <option>Loading properties...</option>
                  ) : properties.length ? (
                    properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title || p.name}
                      </option>
                    ))
                  ) : (
                    <option>No properties available</option>
                  )}
                </select>
              </div>

              {/* DESCRIPTION */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <FileText size={16} />
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              {/* STATUS */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <BadgeCheck size={16} />
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border px-4 py-3"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* FEATURED */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3">
                  <Star size={16} />
                  Featured
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={form.is_featured}
                    onChange={handleChange}
                  />
                  Mark as featured
                </label>
              </div>

              {/* META */}
              <div className="md:col-span-2">
                <input
                  name="meta_title"
                  value={form.meta_title}
                  onChange={handleChange}
                  placeholder="Meta Title"
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div className="md:col-span-2">
                <textarea
                  name="meta_description"
                  value={form.meta_description}
                  onChange={handleChange}
                  placeholder="Meta Description"
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              <div className="md:col-span-2">
                <input
                  name="meta_keywords"
                  value={form.meta_keywords}
                  onChange={handleChange}
                  placeholder="Keywords"
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>

              {/* SORT */}
              <div>
                <input
                  type="number"
                  name="sort_order"
                  value={form.sort_order}
                  onChange={handleChange}
                  className="w-full rounded-xl border px-4 py-3"
                />
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 border-t pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={creating}
              className="px-5 py-3 rounded-xl border"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={creating}
              className="px-5 py-3 rounded-xl bg-blue-600 text-white flex items-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Create Category
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

export default PropertyCategoryCreate;