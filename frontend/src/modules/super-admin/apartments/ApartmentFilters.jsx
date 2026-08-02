import { Building2, Filter } from "lucide-react";

const ApartmentFilters = ({
  filters,
  setFilters,
  properties = [],
}) => {
  const handleChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

      {/* ============================================
          Property Filter
      ============================================ */}

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
          <Building2 className="h-4 w-4 text-indigo-600" />
          Property
        </label>

        <select
          value={filters.property}
          onChange={(e) =>
            handleChange("property", e.target.value)
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">All Properties</option>

          {properties.map((property) => (
            <option
              key={property.id}
              value={property.id}
            >
              {property.title}
            </option>
          ))}
        </select>
      </div>

      {/* ============================================
          Status Filter
      ============================================ */}

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
          <Filter className="h-4 w-4 text-green-600" />
          Status
        </label>

        <select
          value={filters.status}
          onChange={(e) =>
            handleChange("status", e.target.value)
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>
            {/* ============================================
          Elevator Filter
      ============================================ */}

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
          Elevator
        </label>

        <select
          value={filters.elevator}
          onChange={(e) =>
            handleChange("elevator", e.target.value)
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">All</option>
          <option value="1">Available</option>
          <option value="0">Not Available</option>
        </select>
      </div>

      {/* ============================================
          Parking Filter
      ============================================ */}

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
          Parking
        </label>

        <select
          value={filters.parking}
          onChange={(e) =>
            handleChange("parking", e.target.value)
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">All</option>
          <option value="1">Available</option>
          <option value="0">Not Available</option>
        </select>
      </div>

      {/* ============================================
          Security Filter
      ============================================ */}

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
          Security
        </label>

        <select
          value={filters.security}
          onChange={(e) =>
            handleChange("security", e.target.value)
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">All</option>
          <option value="1">Available</option>
          <option value="0">Not Available</option>
        </select>
      </div>

      {/* ============================================
          Generator Filter
      ============================================ */}

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
          Backup Generator
        </label>

        <select
          value={filters.generator}
          onChange={(e) =>
            handleChange("generator", e.target.value)
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">All</option>
          <option value="1">Available</option>
          <option value="0">Not Available</option>
        </select>
      </div>

      {/* ============================================
          Reset Filters
      ============================================ */}

      <div className="flex items-end">
        <button
          type="button"
          onClick={() =>
            setFilters({
              property: "",
              status: "",
              elevator: "",
              parking: "",
              security: "",
              generator: "",
            })
          }
          className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Reset Filters
        </button>
      </div>

    </div>
  );
};

export default ApartmentFilters;