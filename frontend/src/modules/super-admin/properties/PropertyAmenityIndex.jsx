import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../../../api/axios";
import Swal from "sweetalert2";
import {
  Loader2,
  Trash2,
  Sparkles,
} from "lucide-react";

const STORAGE_KEY = "property_amenity_state";

const PropertyAmenityIndex = () => {
  const [amenities, setAmenities] = useState([]);
  const [propertyAmenities, setPropertyAmenities] = useState([]);
  const [propertyList, setPropertyList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  /*
  |--------------------------------------------------------------------------
  | RESTORE STATE
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      if (parsed.selectedPropertyId) {
        setSelectedPropertyId(parsed.selectedPropertyId);
      }

      if (parsed.selectedAmenities) {
        setSelectedAmenities(parsed.selectedAmenities);
      }
    } catch (e) {
      console.error("Failed to restore state", e);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SAVE STATE
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedPropertyId,
        selectedAmenities,
      })
    );
  }, [selectedPropertyId, selectedAmenities]);

  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [amenitiesRes, propertiesRes] = await Promise.all([
        api.get("/amenities?_t=" + Date.now()),
        api.get("/properties"),
      ]);

      setAmenities(amenitiesRes?.data?.data ?? []);
      setPropertyList(propertiesRes?.data?.data ?? []);
    } catch (err) {
      Swal.fire(
        "Error",
        err?.response?.data?.message || "Failed to load data",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOAD PROPERTY AMENITIES
  |--------------------------------------------------------------------------
  */
  const loadPropertyAmenities = useCallback(async () => {
    if (!selectedPropertyId) {
      setPropertyAmenities([]);
      return;
    }

    try {
      const res = await api.get(
        `/properties/${selectedPropertyId}/amenities`
      );

      const data = Array.isArray(res?.data?.data)
        ? res.data.data
        : [];

      setPropertyAmenities(data);
    } catch (err) {
      console.error(err?.response?.data || err);

      setPropertyAmenities([]);

      Swal.fire(
        "Error",
        err?.response?.data?.message ||
        "Failed to load property amenities",
        "error"
      );
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadPropertyAmenities();
  }, [loadPropertyAmenities]);

  /*
  |--------------------------------------------------------------------------
  | FILTER
  |--------------------------------------------------------------------------
  */
  const filteredAmenities = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return amenities;

    return amenities.filter((a) =>
      (a?.name || "")
        .toLowerCase()
        .includes(q)
    );
  }, [amenities, search]);

  /*
  |--------------------------------------------------------------------------
  | SELECT ALL
  |--------------------------------------------------------------------------
  */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAmenities(
        filteredAmenities.map((a) => a.id)
      );
    } else {
      setSelectedAmenities([]);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ASSIGN SELECTED
  |--------------------------------------------------------------------------
  */
  const handleSync = async () => {
    if (!selectedPropertyId) {
      return Swal.fire(
        "Error",
        "Please select a property first",
        "warning"
      );
    }

    if (selectedAmenities.length === 0) {
      return Swal.fire(
        "Error",
        "Please select amenities",
        "warning"
      );
    }

    try {
      setSyncing(true);

      const payload = {
        amenities: selectedAmenities.map((id) => ({
          id,
          is_included: true,
          is_available: true,
          distance: null,
          walking_minutes: null,
          note: null,
        })),
      };

      await api.post(
        `/properties/${selectedPropertyId}/amenities/sync`,
        payload
      );

      await loadPropertyAmenities();

      setSelectedAmenities([]);

      Swal.fire(
        "Success",
        "Amenities assigned successfully",
        "success"
      );
    } catch (err) {
      Swal.fire(
        "Error",
        err?.response?.data?.message ||
        "Assignment failed",
        "error"
      );
    } finally {
      setSyncing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ASSIGN ALL
  |--------------------------------------------------------------------------
  */
  const handleAssignAll = async () => {
    if (!selectedPropertyId) {
      return Swal.fire(
        "Error",
        "Please select a property first",
        "warning"
      );
    }

    try {
      setSyncing(true);

      const payload = {
        amenities: amenities.map((amenity) => ({
          id: amenity.id,
          is_included: true,
          is_available: true,
          distance: null,
          walking_minutes: null,
          note: null,
        })),
      };

      await api.post(
        `/properties/${selectedPropertyId}/amenities/sync`,
        payload
      );

      await loadPropertyAmenities();

      setSelectedAmenities([]);

      Swal.fire(
        "Success",
        "All amenities assigned successfully",
        "success"
      );
    } catch (err) {
      Swal.fire(
        "Error",
        err?.response?.data?.message ||
        "Assignment failed",
        "error"
      );
    } finally {
      setSyncing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REMOVE
  |--------------------------------------------------------------------------
  */
  const handleRemove = async (amenityId) => {
    if (!selectedPropertyId) {
      return Swal.fire(
        "Error",
        "Select property first",
        "warning"
      );
    }

    const confirm = await Swal.fire({
      title: "Remove amenity?",
      text: "Remove from this property only",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(
        `/properties/${selectedPropertyId}/amenities/${amenityId}`
      );

      setPropertyAmenities((prev) =>
        prev.filter(
          (item) =>
            (item.amenity_id ?? item.id) !== amenityId
        )
      );

      Swal.fire(
        "Removed",
        "Amenity removed successfully",
        "success"
      );
    } catch (err) {
      Swal.fire(
        "Error",
        err?.response?.data?.message ||
        "Failed to remove amenity",
        "error"
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | TOGGLE STATUS
  |--------------------------------------------------------------------------
  */
  const toggleAssignedStatus = async (
    amenityId
  ) => {
    if (!selectedPropertyId) {
      return Swal.fire(
        "Error",
        "Select property first",
        "warning"
      );
    }

    try {
      await api.patch(
        `/properties/${selectedPropertyId}/amenities/${amenityId}/toggle`
      );

      await loadPropertyAmenities();
    } catch {
      Swal.fire(
        "Error",
        "Failed to toggle status",
        "error"
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING UI
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2
          className="animate-spin text-blue-600"
          size={40}
        />
        <p className="text-gray-500 mt-2">
          Loading amenities...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow border">
      {/* CONTROLS */}
      <div className="p-5 flex flex-wrap gap-3 items-center">
        <select
          className="border p-2 rounded-lg min-w-[300px]"
          value={selectedPropertyId}
          onChange={(e) => {
            setSelectedPropertyId(e.target.value);
            setSelectedAmenities([]);
          }}
        >
          <option value="">
            Select Property
          </option>

          {propertyList.map((p) => (
            <option
              key={p.id}
              value={p.id}
            >
              {p.title ||
                p.name ||
                `Property #${p.id}`}
            </option>
          ))}
        </select>

        <input
          className="border p-2 rounded-lg flex-1"
          placeholder="Search amenities..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <div className="text-sm text-gray-500">
          {selectedAmenities.length} selected
        </div>

        <button
          onClick={handleSync}
          disabled={
            syncing || !selectedPropertyId
          }
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {syncing
            ? "Syncing..."
            : "Assign Selected"}
        </button>

        <button
          onClick={handleAssignAll}
          disabled={
            syncing || !selectedPropertyId
          }
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Assign All
        </button>
      </div>

      {/* TABLE */}
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    filteredAmenities.length >
                    0 &&
                    selectedAmenities.length ===
                    filteredAmenities.length
                  }
                  onChange={handleSelectAll}
                />

                <span>Amenity</span>
              </div>
            </th>

            <th className="text-center">
              Availability
            </th>

            <th className="text-right p-3">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredAmenities.map((amenity) => {
            const assigned = propertyAmenities.find(
              (item) =>
                Number(item.amenity_id) === Number(amenity.id)
            );

            const isAvailable =
              assigned?.availability?.is_available ?? false;

            return (
              <tr
                key={amenity.id}
                className="border-t hover:bg-gray-50"
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(
                        amenity.id
                      )}
                      onChange={() =>
                        setSelectedAmenities((prev) =>
                          prev.includes(amenity.id)
                            ? prev.filter(
                              (x) => x !== amenity.id
                            )
                            : [...prev, amenity.id]
                        )
                      }
                    />

                    <Sparkles
                      size={16}
                      className="text-purple-600"
                    />

                    <div>
                      <p className="font-medium">
                        {amenity.name}
                      </p>

                      <p className="text-xs text-gray-400">
                        {amenity.description}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="text-center">
                  {assigned ? (
                    <button
                      onClick={() =>
                        toggleAssignedStatus(
                          amenity.id
                        )
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${isAvailable
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                    >
                      {isAvailable
                        ? "Available"
                        : "Unavailable"}
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs">
                      Not Assigned
                    </span>
                  )}
                </td>

                <td className="text-right p-3">
                  {assigned && (
                    <button
                      onClick={() =>
                        handleRemove(amenity.id)
                      }
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PropertyAmenityIndex;