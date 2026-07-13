import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api/axios";

import { ArrowLeft, Loader2, BadgeCheck } from "lucide-react";

const AmenityShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [amenity, setAmenity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const loadAmenity = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/amenities/${id}`);
        const data = res?.data?.data;

        if (isMounted) {
          setAmenity(data || null);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("Failed to load amenity details.");
          setAmenity(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAmenity();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (!amenity) {
    return (
      <div className="p-10 text-center text-gray-500">
        Amenity not found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow">

      <div className="p-6 border-b flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Amenity Details
        </h1>

        <button
          onClick={() => navigate(-1)}
          className="border rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      <div className="p-6 space-y-5">

        <div>
          <label className="text-gray-500 text-sm">Name</label>
          <p className="font-semibold">{amenity?.name}</p>
        </div>

        <div>
          <label className="text-gray-500 text-sm">Display Name</label>
          <p>{amenity?.display_name || "-"}</p>
        </div>

        <div>
          <label className="text-gray-500 text-sm">Slug</label>
          <p>{amenity?.slug || "-"}</p>
        </div>

        <div>
          <label className="text-gray-500 text-sm">Description</label>
          <p>{amenity?.description || "-"}</p>
        </div>

        <div>
          <label className="text-gray-500 text-sm">Status</label>

          <div className="mt-2">
            {amenity?.is_active ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                <BadgeCheck size={14} />
                Active
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-200 rounded-full">
                Inactive
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="text-gray-500 text-sm">Sort Order</label>
          <p>{amenity?.sort_order ?? "-"}</p>
        </div>

      </div>
    </div>
  );
};

export default AmenityShow;