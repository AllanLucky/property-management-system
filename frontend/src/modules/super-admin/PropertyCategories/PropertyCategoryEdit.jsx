import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useParams,
  useNavigate,
  Link,
} from "react-router-dom";

import {
  fetchPropertyCategory,
  updatePropertyCategory,
} from "../../../store/propertyCategorySlice";

import { addNotification } from "../../../store/uiSlice";

import {
  ArrowLeft,
  Save,
  Loader2,
  FolderTree,
  FileText,
  Tag,
  AlertTriangle,
  Star,
  Search,
  Hash,
} from "lucide-react";

const PropertyCategoryEdit = () => {
  const { id } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | REDUX STATE
  |--------------------------------------------------------------------------
  */
  const {
    category,
    loading,
    updating,
    error,
  } = useSelector(
    (state) => state.propertyCategories
  );

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    status: "active",
    is_featured: false,
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    sort_order: 0,
    image: null
  });

  /*
  |--------------------------------------------------------------------------
  | FETCH CATEGORY
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (id) {
      dispatch(fetchPropertyCategory(id));
    }
  }, [dispatch, id]);

  /*
  |--------------------------------------------------------------------------
  | FILL FORM FROM API RESPONSE
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!category) return;

    setForm({
      name: category.name ?? "",
      slug: category.slug ?? "",
      description: category.description ?? "",
      status: category.status ?? "active",
      is_featured: category.flags?.is_featured ?? false,
      meta_title: category.seo?.meta_title ?? "",
      meta_description: category.seo?.meta_description ?? "",
      meta_keywords: category.seo?.meta_keywords ?? "",
      sort_order: category.display?.sort_order ?? 0,
      image: null,
    });

    setImagePreview(
      category?.media?.image_url || null
    );

    console.log("CATEGORY DATA", category);
  }, [category]);
  /*
  |--------------------------------------------------------------------------
  | HANDLE INPUT CHANGE
  |--------------------------------------------------------------------------
  */
  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
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
  | AUTO GENERATE SLUG
  |--------------------------------------------------------------------------
  */
  const handleNameChange = (e) => {
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
  };

  // IMAGE 

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      image: file,
    }));

    setImagePreview(URL.createObjectURL(file));
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE CATEGORY
  |--------------------------------------------------------------------------
  */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = new FormData();

      // =========================
      // BASIC FIELDS
      // =========================
      payload.append("name", form.name);
      payload.append("slug", form.slug);
      payload.append("description", form.description);
      payload.append("status", form.status);

      // =========================
      // FLAGS
      // =========================
      payload.append(
        "flags[is_featured]",
        form.is_featured ? 1 : 0
      );

      // =========================
      // SEO
      // =========================
      payload.append("seo[meta_title]", form.meta_title);
      payload.append("seo[meta_description]", form.meta_description);
      payload.append("seo[meta_keywords]", form.meta_keywords);

      // =========================
      // DISPLAY
      // =========================
      payload.append(
        "display[sort_order]",
        Number(form.sort_order)
      );

      // =========================
      // IMAGE (NEW ADDED)
      // =========================
      if (form.image) {
        payload.append("image", form.image);
      }

      const resultAction = await dispatch(
        updatePropertyCategory({
          id,
          data: payload,
        })
      );

      // =========================
      // SUCCESS
      // =========================
      if (
        updatePropertyCategory.fulfilled.match(resultAction)
      ) {
        dispatch(
          addNotification({
            type: "success",
            title: "Category Updated",
            message:
              resultAction.payload?.message ||
              `${form.name} has been updated successfully.`,
          })
        );

        navigate("/super-admin/property-categories");
      }

      // =========================
      // ERROR FROM THUNK
      // =========================
      if (
        updatePropertyCategory.rejected.match(resultAction)
      ) {
        const message =
          resultAction.payload?.message ||
          resultAction.error?.message ||
          "Failed to update property category.";

        dispatch(
          addNotification({
            type: "error",
            title: "Update Failed",
            message,
          })
        );
      }

    } catch (err) {
      dispatch(
        addNotification({
          type: "error",
          title: "Unexpected Error",
          message:
            err?.message ||
            "Something went wrong while updating category.",
        })
      );
    }
  };
  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          {/* BREADCRUMB */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">

            <Link
              to="/super-admin/property-categories"
              className="hover:text-blue-600 transition"
            >
              Property Categories
            </Link>

            <span>/</span>

            <span className="text-gray-700">
              Edit
            </span>

          </div>

          {/* TITLE */}
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">

            <FolderTree className="w-8 h-8 text-blue-600" />

            Edit Property Category

          </h1>

          <p className="text-gray-500 mt-2">
            Update and manage property category details.
          </p>

        </div>

        {/* BACK BUTTON */}
        <Link
          to="/super-admin/property-categories"
          className="
          inline-flex items-center justify-center gap-2
          rounded-2xl border border-gray-300 bg-white
          px-5 py-3 text-sm font-medium text-gray-700
          hover:bg-gray-50 transition
        "
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">

          <div className="flex items-start gap-3">

            <div className="
            w-10 h-10 rounded-xl
            bg-red-100 flex items-center justify-center
          ">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>

            <div>
              <h3 className="font-semibold text-red-700">
                Failed to load category
              </h3>
              <p className="text-sm text-red-600 mt-1">
                {error?.message || error || "Something went wrong while loading category."}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* LOADING */}
      {loading ? (

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-16">

          <div className="flex flex-col items-center text-center">

            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />

            <h3 className="text-lg font-semibold text-gray-800">
              Loading Category
            </h3>

            <p className="text-gray-500 mt-1">
              Please wait while we fetch the category details...
            </p>

          </div>

        </div>

      ) : (

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* BASIC INFORMATION */}
          <div className="
          bg-white border border-gray-200
          rounded-3xl shadow-sm overflow-hidden
        ">

            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-blue-600" />
                Basic Information
              </h2>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* CATEGORY NAME */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>

                <div className="relative">
                  <FolderTree className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleNameChange}
                    placeholder="Apartment"
                    required
                    className="
                    w-full rounded-xl border border-gray-300
                    pl-11 pr-4 py-3
                    focus:ring-2 focus:ring-blue-500
                    focus:border-blue-500 outline-none
                  "
                  />
                </div>

              </div>

              {/* IMAGE FIELD (DB + PREVIEW - CLEAN PROFESSIONAL VERSION) */}
              {/* IMAGE FIELD (DB + CHANGE CLICKABLE) */}
              {/* CATEGORY IMAGE */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Category Image
                </label>

                <div className="space-y-4">

                  {/* LARGE IMAGE PREVIEW */}
                  <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">

                    <img
                      src={
                        imagePreview ||
                        category?.media?.image_url ||
                        "/placeholder.png"
                      }
                      alt={category?.name || "Category"}
                      className="
          w-full
          h-72
          md:h-96
          object-cover
        "
                      onError={(e) => {
                        e.target.src = "/placeholder.png";
                      }}
                    />

                    {/* CHANGE IMAGE BUTTON OVERLAY */}
                    <label
                      htmlFor="categoryImage"
                      className="
          absolute bottom-4 right-4
          px-4 py-2
          rounded-xl
          bg-white/90
          backdrop-blur-sm
          shadow-lg
          text-sm
          font-medium
          text-gray-700
          cursor-pointer
          hover:bg-white
          transition
        "
                    >
                      Change Image
                    </label>
                  </div>

                  {/* FILE INPUT */}
                  <input
                    id="categoryImage"
                    name="image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Recommended size: 1200 × 800px
                    </p>

                    {form.image && (
                      <span className="text-sm font-medium text-green-600">
                        {form.image.name}
                      </span>
                    )}
                  </div>

                </div>
              </div>
              {/* SLUG */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug
                </label>

                <div className="relative">
                  <Tag className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />

                  <input
                    type="text"
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    placeholder="apartment"
                    required
                    className="
                    w-full rounded-xl border border-gray-300
                    pl-11 pr-4 py-3
                    focus:ring-2 focus:ring-blue-500
                    focus:border-blue-500 outline-none
                  "
                  />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="md:col-span-2">

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>

                <div className="relative">
                  <FileText className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={5}
                    className="
                    w-full rounded-xl border border-gray-300
                    pl-11 pr-4 py-3
                    focus:ring-2 focus:ring-blue-500
                    focus:border-blue-500 outline-none resize-none
                  "
                  />
                </div>

              </div>

              {/* STATUS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="
                  w-full rounded-xl border border-gray-300
                  px-4 py-3
                  focus:ring-2 focus:ring-blue-500
                  focus:border-blue-500 outline-none
                "
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* SORT ORDER */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>

                <div className="relative">
                  <Hash className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />

                  <input
                    type="number"
                    name="sort_order"
                    value={form.sort_order}
                    onChange={handleChange}
                    className="
                    w-full rounded-xl border border-gray-300
                    pl-11 pr-4 py-3
                    focus:ring-2 focus:ring-blue-500
                    focus:border-blue-500 outline-none
                  "
                  />
                </div>

              </div>

              {/* FEATURED */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">

                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={form.is_featured}
                    onChange={handleChange}
                    className="w-5 h-5"
                  />

                  <div>
                    <span className="flex items-center gap-2 font-medium">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Featured Category
                    </span>

                    <p className="text-sm text-gray-500">
                      Featured categories appear in listings.
                    </p>
                  </div>

                </label>
              </div>

            </div>

          </div>
          {/* SEO INFORMATION */}
          <div className="
            bg-white border border-gray-200
            rounded-3xl shadow-sm overflow-hidden
          ">

            <div className="border-b border-gray-100 px-6 py-4">

              <h2 className="text-lg font-semibold flex items-center gap-2">

                <Search className="w-5 h-5 text-green-600" />

                SEO Information

              </h2>

            </div>


            <div className="p-6 space-y-5">


              {/* META TITLE */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>

                <input
                  type="text"
                  name="meta_title"
                  value={form.meta_title}
                  onChange={handleChange}
                  placeholder="SEO title..."
                  className="
                    w-full rounded-xl border border-gray-300
                    px-4 py-3
                    focus:ring-2 focus:ring-green-500
                    focus:border-green-500 outline-none
                  "
                />

              </div>


              {/* META DESCRIPTION */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>

                <textarea
                  name="meta_description"
                  value={form.meta_description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="SEO description..."
                  className="
                    w-full rounded-xl border border-gray-300
                    px-4 py-3
                    focus:ring-2 focus:ring-green-500
                    focus:border-green-500 outline-none resize-none
                  "
                />

              </div>


              {/* META KEYWORDS */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Keywords
                </label>

                <input
                  type="text"
                  name="meta_keywords"
                  value={form.meta_keywords}
                  onChange={handleChange}
                  placeholder="apartment, villa, office"
                  className="
                    w-full rounded-xl border border-gray-300
                    px-4 py-3
                    focus:ring-2 focus:ring-green-500
                    focus:border-green-500 outline-none
                  "
                />

              </div>


              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-4">


                <Link
                  to="/super-admin/property-categories"
                  className="
                    px-6 py-3 rounded-xl
                    border border-gray-300 bg-white
                    text-gray-700 font-medium
                    hover:bg-gray-50 transition
                  "
                >
                  Cancel
                </Link>


                <button
                  type="submit"
                  disabled={updating}
                  className="
                    inline-flex items-center gap-2
                    rounded-xl bg-blue-600
                    px-6 py-3 text-white
                    font-semibold
                    hover:bg-blue-700 transition
                    disabled:opacity-60
                  "
                >

                  {updating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Update Category
                    </>
                  )}

                </button>


              </div>

            </div>

          </div>

        </form>

      )}

    </div>
  );
};

export default PropertyCategoryEdit;