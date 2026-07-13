import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Loader2, ArrowLeft, Pencil } from "lucide-react";

/*
|--------------------------------------------------------------------------
| ACTION
|--------------------------------------------------------------------------
*/
import {
  fetchPropertyFeatureById,
} from "../../../store/propertyFeatureSlice";

const PropertyFeatureShow = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const [feature, setFeature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | SAFE RESPONSE EXTRACTOR (🔥 FIX)
  |--------------------------------------------------------------------------
  */
  const extractFeature = (res) => {
    const data = res?.data ?? res;

    return (
      data?.data ||
      data?.feature ||
      data?.property_feature ||
      data ||
      null
    );
  };

  /*
  |--------------------------------------------------------------------------
  | LOAD FEATURE
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await dispatch(
          fetchPropertyFeatureById(id)
        ).unwrap();

        const featureData = extractFeature(res);

        if (!featureData || typeof featureData !== "object") {
          throw new Error("Invalid feature response format");
        }

        setFeature(featureData);

      } catch (err) {
        setError(err?.message || "Failed to load feature");
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id, dispatch]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 mt-3">Loading feature...</p>
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
      <div className="p-4 bg-red-50 text-red-600 border rounded">
        {error}
      </div>
    );
  }

  if (!feature) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {feature.name}
          </h1>
          <p className="text-gray-500">
            Property Feature Details
          </p>
        </div>

        <div className="flex gap-2">

          <Link
            to="/super-admin/property-features"
            className="flex items-center gap-2 border px-4 py-2 rounded-xl"
          >
            <ArrowLeft size={18} />
            Back
          </Link>

          <Link
            to={`/super-admin/property-features/edit/${feature.id}`}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            <Pencil size={18} />
            Edit
          </Link>

        </div>
      </div>

      {/* DETAILS */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">

        <Detail label="ID" value={feature.id} />
        <Detail label="Name" value={feature.name} />
        <Detail label="Type" value={feature.type} />
        <Detail label="Icon" value={feature.icon ?? "-"} />
        <Detail label="Slug" value={feature.slug} />
        <Detail label="Sort Order" value={feature.sort_order} />

        <Detail
          label="Active"
          value={feature.is_active ? "Yes" : "No"}
        />

        <Detail
          label="Highlighted"
          value={feature.is_highlighted ? "Yes" : "No"}
        />

      </div>

      {/* DESCRIPTION */}
      <div className="mt-6">
        <h2 className="font-semibold mb-2">Description</h2>
        <p className="text-gray-600">
          {feature.description || "No description"}
        </p>
      </div>

      {/* META */}
      <div className="mt-6 text-sm text-gray-400">
        Created: {feature.created_at || "-"} <br />
        Updated: {feature.updated_at || "-"}
      </div>

    </div>
  );
};

/*
|--------------------------------------------------------------------------
| DETAIL COMPONENT
|--------------------------------------------------------------------------
*/
const Detail = ({ label, value }) => (
  <div className="border rounded-lg p-3">
    <p className="text-gray-500 text-sm">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

export default PropertyFeatureShow;