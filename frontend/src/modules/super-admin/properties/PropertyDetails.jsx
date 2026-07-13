import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../../api/axios";
import { Loader2 } from "lucide-react";

const PropertyDetails = () => {
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | FETCH PROPERTY DETAILS
  |--------------------------------------------------------------------------
  */
  const fetchProperty = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get(`/properties/${id}`);
      const data = res.data?.data;

      setProperty(data);

      // backend-safe fallback (PropertyResource or eager-loaded units)
      setUnits(data?.units || []);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Failed to load property details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="mt-2 text-sm">Loading property details...</p>
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
      <div className="p-6 bg-red-100 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-6 text-gray-500">
        Property not found
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {property.name}
        </h1>

        <Link
          to={`/super-admin/properties/edit/${property.id}`}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
        >
          Edit Property
        </Link>
      </div>

      {/* BASIC INFO */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow space-y-2">
        <p>
          <strong>Description:</strong>{" "}
          {property.description || "No description"}
        </p>

        <p>
          <strong>Location:</strong> {property.location}
        </p>

        <p>
          <strong>Owner:</strong>{" "}
          {property.owner?.name || "No owner assigned"}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          <span className="capitalize">{property.status}</span>
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

        <div className="bg-blue-100 p-4 rounded-xl text-center">
          <p className="text-sm">Total Units</p>
          <p className="text-xl font-bold">
            {property.stats?.total_units ?? 0}
          </p>
        </div>

        <div className="bg-green-100 p-4 rounded-xl text-center">
          <p className="text-sm">Occupied</p>
          <p className="text-xl font-bold">
            {property.stats?.occupied_units ?? 0}
          </p>
        </div>

        <div className="bg-yellow-100 p-4 rounded-xl text-center">
          <p className="text-sm">Vacant</p>
          <p className="text-xl font-bold">
            {property.stats?.vacant_units ?? 0}
          </p>
        </div>

        <div className="bg-red-100 p-4 rounded-xl text-center">
          <p className="text-sm">Maintenance</p>
          <p className="text-xl font-bold">
            {property.stats?.maintenance_units ?? 0}
          </p>
        </div>

        <div className="bg-purple-100 p-4 rounded-xl text-center">
          <p className="text-sm">Occupancy</p>
          <p className="text-xl font-bold">
            {property.stats?.occupancy_rate ?? 0}%
          </p>
        </div>

      </div>

      {/* INSIGHTS */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow">
        <h2 className="font-bold mb-3">Insights</h2>

        <div className="flex flex-wrap gap-4 text-sm">

          <span>
            {property.insights?.has_vacancy
              ? "🟢 Has Vacancy"
              : "🔴 No Vacancy"}
          </span>

          <span>
            {property.insights?.fully_occupied
              ? "🔴 Fully Occupied"
              : "🟢 Not Full"}
          </span>

          <span>
            {property.insights?.is_empty
              ? "⚪ Empty Property"
              : "🏠 Active"}
          </span>

        </div>
      </div>

      {/* UNITS */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow">
        <h2 className="font-bold mb-4">Units</h2>

        {units.length === 0 ? (
          <p className="text-gray-500">No units available</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">

            {units.map((unit) => (
              <div
                key={unit.id}
                className="border p-4 rounded-lg hover:shadow dark:border-slate-700"
              >
                <h3 className="font-semibold">
                  {unit.name} ({unit.unit_number})
                </h3>

                <p className="text-sm text-gray-500">
                  Status:{" "}
                  <span className="capitalize">{unit.status}</span>
                </p>

                <p className="text-sm">
                  Rent: {unit.rent_label || "KES 0.00"}
                </p>
              </div>
            ))}

          </div>
        )}
      </div>

    </div>
  );
};

export default PropertyDetails;