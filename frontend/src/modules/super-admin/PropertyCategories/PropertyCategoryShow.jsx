import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useParams,
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Loader2,
  ArrowLeft,
  Pencil,
  FolderTree,
  BadgeCheck,
  Star,
  FileText,
  Calendar,
  Tag,
  Search,
  Image as ImageIcon,
} from "lucide-react";

import {
  fetchPropertyCategory,
} from "../../../store/propertyCategorySlice";

const PropertyCategoryShow = () => {

  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    category,
    loading,
    error,
  } = useSelector(
    (state) => state.propertyCategories || {}
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchPropertyCategory(id));
    }
  }, [id, dispatch]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="mt-3 text-gray-500">
          Loading property category...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-5 rounded-xl">
        {typeof error === "string"
          ? error
          : error?.message ||
            "Failed to load property category."}
      </div>
    );
  }

  if (!category) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-5 rounded-xl">
        Property category not found.
      </div>
    );
  }

  // ✅ SAFE IMAGE RESOLVER
  const categoryImage =
    category.image_url ||
    category.image ||
    category.media?.url ||
    category.media?.image_url ||
    null;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border p-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 border rounded-xl hover:bg-gray-100 transition"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {category.name}
              </h1>

              <p className="text-sm text-gray-500">
                Property Category Details
              </p>
            </div>

          </div>

          <Link
            to={`/super-admin/property-categories/edit/${category.id}`}
            className="
              inline-flex items-center gap-2
              bg-blue-600 text-white
              px-5 py-3 rounded-xl
              hover:bg-blue-700 transition
            "
          >
            <Pencil size={18} />
            Edit Category
          </Link>

        </div>
      </div>

      {/* IMAGE SECTION (NEW) */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">

        <div className="flex items-center gap-3 mb-4">
          <ImageIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Category Image</h2>
        </div>

        {categoryImage ? (
          <img
            src={categoryImage}
            alt={category.name}
            className="w-full max-h-[400px] object-cover rounded-xl border"
          />
        ) : (
          <div className="w-full h-64 flex items-center justify-center border rounded-xl bg-gray-50 text-gray-400">
            No image available
          </div>
        )}

      </div>

      {/* OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* CATEGORY */}
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <FolderTree className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Category</h3>
          </div>

          <p className="text-lg font-bold dark:text-white">
            {category.name}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            Slug: {category.slug}
          </p>
        </div>

        {/* STATUS */}
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <BadgeCheck className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold">Status</h3>
          </div>

          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium
            ${category.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
            }`}
          >
            {category.status || "Unknown"}
          </span>
        </div>

        {/* FEATURED */}
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Star className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold">Featured</h3>
          </div>

          {category.flags?.is_featured ? (
            <span className="inline-flex px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
              Featured
            </span>
          ) : (
            <span className="inline-flex px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
              Not Featured
            </span>
          )}
        </div>

      </div>

      {/* DESCRIPTION */}
      <div className="bg-white border rounded-2xl shadow-sm p-6">

        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold">Description</h2>
        </div>

        <p className="text-gray-600 leading-relaxed">
          {category.description || "No description provided."}
        </p>

      </div>

      {/* SEO */}
      <div className="bg-white border rounded-2xl shadow-sm p-6">

        <div className="flex items-center gap-3 mb-5">
          <Search className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">SEO Information</h2>
        </div>

        <div className="space-y-4">

          <div>
            <p className="text-sm text-gray-500">Meta Title</p>
            <p>{category.seo?.meta_title || "N/A"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Meta Description</p>
            <p>{category.seo?.meta_description || "N/A"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Meta Keywords</p>
            <p>{category.seo?.meta_keywords || "N/A"}</p>
          </div>

        </div>
      </div>

      {/* META */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <div className="bg-white border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Tag className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Sort Order</h3>
          </div>

          <p>{category.display?.sort_order ?? 0}</p>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold">Created At</h3>
          </div>

          <p>{category.created_at || "N/A"}</p>
        </div>

      </div>

    </div>
  );
};

export default PropertyCategoryShow;