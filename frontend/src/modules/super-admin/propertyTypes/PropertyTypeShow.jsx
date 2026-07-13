import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";

import {
  Loader2,
  ArrowLeft,
  Pencil,
  BadgeCheck,
  Star,
  Calendar,
  FileText,
  Layers,
} from "lucide-react";

import { fetchPropertyType } from "../../../store/propertyTypeSlice";

const PropertyTypeShow = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [propertyType, setPropertyType] = useState(null);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | LOAD PROPERTY TYPE
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const loadPropertyType = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await dispatch(
          fetchPropertyType(id)
        ).unwrap();

        const data = response?.data || response;

        console.log("Property Type Details:", data);

        setPropertyType(data);

      } catch (err) {
        console.error("Load Error:", err);

        setError(
          err?.message ||
          "Failed to load property type details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPropertyType();
    }
  }, [dispatch, id]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />

        <p className="mt-3 text-gray-500">
          Loading property type...
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-5 rounded-xl">
        {error}
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NO DATA
  |--------------------------------------------------------------------------
  */
  if (!propertyType) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-5 rounded-xl">
        Property type not found.
      </div>
    );
  }

  // Extract API status object safely
  const status = propertyType.status || {};
  const statusValue = status.value || "inactive";
  const statusLabel = status.label || "Unknown";
  const isFeatured = status.is_featured ?? propertyType.is_featured ?? false;
  const featuredLabel =
    status.featured_label ||
    (isFeatured ? "Featured" : "Not Featured");

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
                {propertyType.name}
              </h1>

              <p className="text-gray-500 text-sm">
                Property Type Details
              </p>
            </div>

          </div>

          <Link
            to={`/super-admin/property-types/edit/${propertyType.id}`}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition"
          >
            <Pencil size={18} />
            Edit Property Type
          </Link>

        </div>
      </div>


      {/* OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* NAME */}
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Layers className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">
              Property Type
            </h3>
          </div>

          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {propertyType.name}
          </p>
        </div>


        {/* STATUS */}
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm">

          <div className="flex items-center gap-3 mb-3">
            <BadgeCheck className="w-5 h-5 text-green-600" />

            <h3 className="font-semibold">
              Status
            </h3>
          </div>

          <span
            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              statusValue === "active"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {statusLabel}
          </span>

        </div>


        {/* FEATURED */}
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm">

          <div className="flex items-center gap-3 mb-3">
            <Star className="w-5 h-5 text-yellow-500" />

            <h3 className="font-semibold">
              Featured
            </h3>
          </div>

          <span
            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              isFeatured
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {featuredLabel}
          </span>

        </div>

      </div>


      {/* DESCRIPTION */}
      <div className="bg-white dark:bg-slate-900 border rounded-2xl shadow-sm p-6">

        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-indigo-600" />

          <h2 className="text-lg font-semibold">
            Description
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          {propertyType.description || "No description provided."}
        </p>

      </div>


      {/* TIMESTAMPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <div className="bg-white dark:bg-slate-900 border rounded-2xl shadow-sm p-5">

          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-5 h-5 text-blue-600" />

            <h3 className="font-semibold">
              Created At
            </h3>
          </div>

          <p className="text-gray-600">
            {propertyType.created_at
              ? new Date(propertyType.created_at).toLocaleString()
              : "-"}
          </p>

        </div>


        <div className="bg-white dark:bg-slate-900 border rounded-2xl shadow-sm p-5">

          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-5 h-5 text-green-600" />

            <h3 className="font-semibold">
              Updated At
            </h3>
          </div>

          <p className="text-gray-600">
            {propertyType.updated_at
              ? new Date(propertyType.updated_at).toLocaleString()
              : "-"}
          </p>

        </div>

      </div>

    </div>
  );
};

export default PropertyTypeShow;