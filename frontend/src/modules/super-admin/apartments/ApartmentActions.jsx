import {
  Plus,
  LayoutGrid,
  Table2,
  RefreshCw,
  Download,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

const ApartmentActions = ({
  view = "grid",
  setView,
  onRefresh,
  onExport,
  loading = false,
}) => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      {/* Left Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Create */}
        <Link
          to="/super-admin/apartments/create"
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-indigo-600
            px-4
            py-2.5
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-indigo-700
          "
        >
          <Plus className="h-4 w-4" />
          New Apartment
        </Link>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            border
            border-gray-300
            bg-white
            px-4
            py-2.5
            text-sm
            font-medium
            text-gray-700
            transition
            hover:bg-gray-100
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}

          {loading ? "Refreshing..." : "Refresh"}
        </button>

        {/* Export */}
        <button
          onClick={onExport}
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            border
            border-emerald-300
            bg-emerald-50
            px-4
            py-2.5
            text-sm
            font-medium
            text-emerald-700
            transition
            hover:bg-emerald-100
          "
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* View Switcher */}
      <div
        className="
          flex
          items-center
          rounded-lg
          border
          border-gray-200
          bg-gray-100
          p-1
        "
      >
        {/* Grid */}
        <button
          type="button"
          onClick={() => setView?.("grid")}
          className={`
            flex
            items-center
            gap-2
            rounded-md
            px-4
            py-2
            text-sm
            font-medium
            transition
            ${view === "grid"
              ? "bg-white text-indigo-600 shadow"
              : "text-gray-600 hover:text-indigo-600"
            }
          `}
        >
          <LayoutGrid className="h-4 w-4" />
          Grid
        </button>

        {/* Table */}
        <button
          type="button"
          onClick={() => setView?.("table")}
          className={`
            flex
            items-center
            gap-2
            rounded-md
            px-4
            py-2
            text-sm
            font-medium
            transition
            ${view === "table"
              ? "bg-white text-indigo-600 shadow"
              : "text-gray-600 hover:text-indigo-600"
            }
          `}
        >
          <Table2 className="h-4 w-4" />
          Table
        </button>
      </div>
    </div>
  );
};

export default ApartmentActions;