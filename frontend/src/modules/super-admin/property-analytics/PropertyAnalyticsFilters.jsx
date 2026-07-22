import { Filter, RotateCcw } from "lucide-react";

const PropertyAnalyticsFilters = ({
  filters,
  setFilters,
}) => {
  const handleChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      listingType: "",
      status: "",
      rating: "",
    });
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

      <div className="flex items-center gap-2 text-gray-600">
        <Filter className="h-5 w-5" />
        <span className="text-sm font-semibold">
          Filters
        </span>
      </div>

      {/* Listing Type */}
      <select
        value={filters.listingType}
        onChange={(e) =>
          handleChange("listingType", e.target.value)
        }
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <option value="">All Listing Types</option>
        <option value="sale">Sale</option>
        <option value="rent">Rent</option>
        <option value="lease">Lease</option>
      </select>

      {/* Property Status */}
      <select
        value={filters.status}
        onChange={(e) =>
          handleChange("status", e.target.value)
        }
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <option value="">All Statuses</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
        <option value="pending">Pending</option>
        <option value="archived">Archived</option>
      </select>

      {/* Rating */}
      <select
        value={filters.rating}
        onChange={(e) =>
          handleChange("rating", e.target.value)
        }
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <option value="">All Ratings</option>
        <option value="1">1★ & Above</option>
        <option value="2">2★ & Above</option>
        <option value="3">3★ & Above</option>
        <option value="4">4★ & Above</option>
        <option value="5">5★ Only</option>
      </select>

      {/* Reset */}
      <button
        type="button"
        onClick={resetFilters}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </button>

    </div>
  );
};

export default PropertyAnalyticsFilters;