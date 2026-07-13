import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../../../api/axios";
import Swal from "sweetalert2";
import { Loader2, Trash2 } from "lucide-react";

const STORAGE_KEY = "property_feature_state";

const PropertyFeatureIndex = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [propertyList, setPropertyList] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [syncing, setSyncing] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | RESTORE STATE ON LOAD
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (parsed.selectedPropertyId) {
          setSelectedPropertyId(parsed.selectedPropertyId);
        }

        if (parsed.selectedFeatures) {
          setSelectedFeatures(parsed.selectedFeatures);
        }
      } catch (e) {
        console.error("Failed to parse saved state");
      }
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SAVE STATE AUTOMATICALLY
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedPropertyId,
        selectedFeatures,
      })
    );
  }, [selectedPropertyId, selectedFeatures]);

  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [featuresRes, propertiesRes] = await Promise.all([
        api.get("/property-features?_t=" + Date.now()),
        api.get("/properties"),
      ]);

      setFeatures(featuresRes?.data?.data ?? []);
      setPropertyList(propertiesRes?.data?.data ?? []);
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.message || "Failed", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /*
  |--------------------------------------------------------------------------
  | FILTER FEATURES
  |--------------------------------------------------------------------------
  */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return features;
    return features.filter((f) =>
      (f?.name || "").toLowerCase().includes(q)
    );
  }, [features, search]);

  /*
  |--------------------------------------------------------------------------
  | SELECT ALL
  |--------------------------------------------------------------------------
  */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedFeatures(filtered.map((f) => f.id));
    } else {
      setSelectedFeatures([]);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ASSIGN ALL FEATURES
  |--------------------------------------------------------------------------
  */
  const handleAssignAll = async () => {
    if (!selectedPropertyId) {
      return Swal.fire("Error", "Please select a property first", "warning");
    }

    try {
      setSyncing(true);

      const payload = {
        features: features.map((feature) => ({
          feature_id: feature.id,
          value: null,
          note: null,
          is_active: true,
          sort_order: 0,
        })),
      };

      const res = await api.post(
        `/properties/${selectedPropertyId}/features/sync`,
        payload
      );

      setFeatures(res?.data?.data || []);
      setSelectedFeatures([]);

      Swal.fire("Success", "All features assigned successfully", "success");
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.message || "Assignment failed", "error");
    } finally {
      setSyncing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SYNC SELECTED FEATURES
  |--------------------------------------------------------------------------
  */
  const handleSync = async () => {
    if (!selectedPropertyId) {
      return Swal.fire("Error", "Select property", "warning");
    }

    if (selectedFeatures.length === 0) {
      return Swal.fire("Error", "Select features", "warning");
    }

    try {
      setSyncing(true);

      const payload = {
        features: selectedFeatures.map((id) => ({
          feature_id: id,
          value: null,
          note: null,
          is_active: true,
          sort_order: 0,
        })),
      };

      const res = await api.post(
        `/properties/${selectedPropertyId}/features/sync`,
        payload
      );

      setFeatures(res?.data?.data ?? []);
      setSelectedFeatures([]);

      Swal.fire("Success", "Synced successfully", "success");
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.message || "Sync failed", "error");
    } finally {
      setSyncing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REMOVE FEATURE
  |--------------------------------------------------------------------------
  */
  const handleRemove = async (id) => {
    if (!selectedPropertyId) {
      return Swal.fire("Error", "Select property first", "warning");
    }

    const confirm = await Swal.fire({
      title: "Remove feature?",
      text: "Remove from this property only",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(
        `/properties/${selectedPropertyId}/features/${id}`
      );

      setFeatures((prev) => prev.filter((f) => f.id !== id));
      setSelectedFeatures((prev) => prev.filter((x) => x !== id));

      Swal.fire("Removed", "Feature removed successfully", "success");
    } catch {
      Swal.fire("Error", "Failed to remove", "error");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | TOGGLE STATUS
  |--------------------------------------------------------------------------
  */
  const toggleAssignedStatus = async (featureId) => {
    if (!selectedPropertyId) {
      return Swal.fire("Error", "Select property first", "warning");
    }

    try {
      await api.patch(
        `/properties/${selectedPropertyId}/features/${featureId}/toggle`
      );

      setFeatures((prev) =>
        prev.map((f) =>
          f.id === featureId
            ? {
                ...f,
                pivot: {
                  ...f.pivot,
                  is_active: !f.pivot?.is_active,
                },
              }
            : f
        )
      );
    } catch {
      Swal.fire("Error", "Toggle failed", "error");
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
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-gray-500 mt-2">Loading...</p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */
  return (
    <div className="bg-white rounded-xl shadow border">

      {/* CONTROLS */}
      <div className="p-5 flex flex-wrap gap-3 items-center">

        <select
          className="border p-2 rounded-lg min-w-[300px]"
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
        >
          <option value="">Select Property</option>
          {propertyList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title || p.name || `Property #${p.id}`}
            </option>
          ))}
        </select>

        <input
          className="border p-2 rounded-lg flex-1"
          placeholder="Search features..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="text-sm text-gray-500">
          {selectedFeatures.length} selected
        </div>

        <button
          onClick={handleSync}
          disabled={syncing || !selectedPropertyId}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "Assign Selected"}
        </button>

        <button
          onClick={handleAssignAll}
          disabled={syncing || !selectedPropertyId}
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
                    filtered.length > 0 &&
                    selectedFeatures.length === filtered.length
                  }
                  onChange={handleSelectAll}
                />
                <span>Feature</span>
              </div>
            </th>
            <th className="text-center">Type</th>
            <th className="text-center">Status</th>
            <th className="text-right p-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((f) => (
            <tr key={f.id} className="border-t hover:bg-gray-50">

              <td className="p-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(f.id)}
                  onChange={() =>
                    setSelectedFeatures((prev) =>
                      prev.includes(f.id)
                        ? prev.filter((x) => x !== f.id)
                        : [...prev, f.id]
                    )
                  }
                />

                <div>
                  <p className="font-medium">{f.name}</p>
                  <p className="text-xs text-gray-400">
                    {f.description}
                  </p>
                </div>
              </td>

              <td className="text-center">{f.type}</td>

              <td className="text-center">
                <button
                  onClick={() => toggleAssignedStatus(f.id)}
                  className={`px-2 py-1 rounded text-xs ${
                    f.pivot?.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {f.pivot?.is_active ? "Active" : "Inactive"}
                </button>
              </td>

              <td className="text-right p-3">
                <button
                  onClick={() => handleRemove(f.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PropertyFeatureIndex;