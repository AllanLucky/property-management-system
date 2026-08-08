import {
  Building2,
  Filter,
  Zap,
  Car,
  ShieldCheck,
  RefreshCcw,
} from "lucide-react";

const ApartmentFilters = ({
  filters,
  setFilters,
  properties = [],
}) => {
  // Support both:
  // 1. properties = [...]
  // 2. properties = { data: [...] }
  const propertyList = Array.isArray(properties)
    ? properties
    : Array.isArray(properties?.data)
    ? properties.data
    : [];

  const handleChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      property: "",
      status: "",
      elevator: "",
      parking: "",
      security: "",
      generator: "",
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Property */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
          <Building2 className="h-4 w-4 text-indigo-600" />
          Property
        </label>

        <select
          value={filters.property}
          onChange={(e) => handleChange("property", e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">All Properties</option>

          {propertyList.length > 0 ? (
            propertyList.map((property) => (
              <option key={property.id} value={property.id}>
                {property.title}
              </option>
            ))
          ) : (
            <option disabled value="">
              No Properties Found
            </option>
          )}
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
          <Filter className="h-4 w-4 text-green-600" />
          Status
        </label>

        <select
          value={filters.status}
          onChange={(e) => handleChange("status", e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Elevator */}
      <FeatureSelect
        label="Elevator"
        icon={<Zap className="h-4 w-4 text-yellow-500" />}
        value={filters.elevator}
        onChange={(value) => handleChange("elevator", value)}
      />

      {/* Parking */}
      <FeatureSelect
        label="Parking"
        icon={<Car className="h-4 w-4 text-blue-600" />}
        value={filters.parking}
        onChange={(value) => handleChange("parking", value)}
      />

      {/* Security */}
      <FeatureSelect
        label="Security"
        icon={<ShieldCheck className="h-4 w-4 text-green-600" />}
        value={filters.security}
        onChange={(value) => handleChange("security", value)}
      />

      {/* Generator */}
      <FeatureSelect
        label="Backup Generator"
        icon={<Zap className="h-4 w-4 text-orange-600" />}
        value={filters.generator}
        onChange={(value) => handleChange("generator", value)}
      />

      {/* Reset */}
      <div className="flex items-end">
        <button
          type="button"
          onClick={resetFilters}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          <RefreshCcw className="h-4 w-4" />
          Reset Filters
        </button>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Reusable Feature Select
|--------------------------------------------------------------------------
*/

const FeatureSelect = ({
  label,
  icon,
  value,
  onChange,
}) => {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
        {icon}
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
      >
        <option value="">All</option>
        <option value="1">Available</option>
        <option value="0">Not Available</option>
      </select>
    </div>
  );
};

export default ApartmentFilters;