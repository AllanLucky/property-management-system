import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";

import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Building2,
  Eye,
  RefreshCcw,
  Home,
  TrendingUp,
  Wrench,
  AlertTriangle,
  Search,
  DollarSign,
  Hash,
  CheckCircle2,
} from "lucide-react";

const UnitList = () => {
  const navigate = useNavigate();

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE VALUE
  |--------------------------------------------------------------------------
  */
  const normalize = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "-";
    }

    if (typeof value === "object") {
      return (
        value?.name ||
        value?.title ||
        value?.value ||
        "-"
      );
    }

    return value;
  };

  /*
  |--------------------------------------------------------------------------
  | GET UNIT NAME
  |--------------------------------------------------------------------------
  */
  const getUnitName = (unit) => {
    return (
      unit?.name ||
      unit?.unit_number ||
      `Unit #${unit?.id}`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | GET UNIT TYPE
  |--------------------------------------------------------------------------
  */
  const getUnitType = (unit) => {
    return (
      unit?.type ||
      unit?.unit_type ||
      "-"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | GET RENT
  |--------------------------------------------------------------------------
  */
  const getRent = (unit) => {
    return (
      unit?.rent_amount ??
      unit?.pricing?.rent_amount ??
      unit?.rent ??
      unit?.rent_price ??
      0
    );
  };

  /*
  |--------------------------------------------------------------------------
  | GET STATUS
  |--------------------------------------------------------------------------
  */
  const getStatus = (unit) => {
    return (
      unit?.status?.current ||
      unit?.status ||
      "unknown"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS FORMAT
  |--------------------------------------------------------------------------
  */
  const formatStatus = (unit) => {
    const status = getStatus(unit);

    switch (status) {
      case "occupied":
        return {
          label: "Occupied",
          color:
            "bg-red-100 text-red-700 border border-red-200",
        };

      case "vacant":
        return {
          label: "Vacant",
          color:
            "bg-green-100 text-green-700 border border-green-200",
        };

      case "reserved":
        return {
          label: "Reserved",
          color:
            "bg-purple-100 text-purple-700 border border-purple-200",
        };

      case "maintenance":
        return {
          label: "Maintenance",
          color:
            "bg-yellow-100 text-yellow-700 border border-yellow-200",
        };

      case "inactive":
        return {
          label: "Inactive",
          color:
            "bg-gray-100 text-gray-700 border border-gray-200",
        };

      default:
        return {
          label: "Unknown",
          color:
            "bg-slate-100 text-slate-700 border border-slate-200",
        };
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FETCH UNITS
  |--------------------------------------------------------------------------
  */
  const fetchUnits = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(
        "/units?with_relations=true"
      );

      const data =
        response?.data?.data ||
        response?.data ||
        [];

      setUnits(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("FAILED TO FETCH UNITS", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load units."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | DELETE UNIT
  |--------------------------------------------------------------------------
  */
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this unit?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(`/units/${id}`);

      setUnits((prev) =>
        prev.filter((unit) => unit.id !== id)
      );

      setSuccess("Unit deleted successfully.");
    } catch (err) {
      console.error("DELETE FAILED", err);

      setError(
        err?.response?.data?.message ||
          "Failed to delete unit."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTERED UNITS
  |--------------------------------------------------------------------------
  */
  const filteredUnits = useMemo(() => {
    const query = search.toLowerCase();

    return units.filter((unit) => {
      return (
        getUnitName(unit)
          ?.toLowerCase()
          ?.includes(query) ||
        unit?.unit_number
          ?.toLowerCase()
          ?.includes(query) ||
        getUnitType(unit)
          ?.toLowerCase()
          ?.includes(query) ||
        unit?.property?.name
          ?.toLowerCase()
          ?.includes(query)
      );
    });
  }, [units, search]);

  /*
  |--------------------------------------------------------------------------
  | STATS
  |--------------------------------------------------------------------------
  */
  const stats = useMemo(() => {
    return units.reduce(
      (acc, unit) => {
        acc.total++;

        const status = getStatus(unit);

        if (status === "vacant") {
          acc.vacant++;
        }

        if (status === "occupied") {
          acc.occupied++;
        }

        if (status === "maintenance") {
          acc.maintenance++;
        }

        return acc;
      },
      {
        total: 0,
        vacant: 0,
        occupied: 0,
        maintenance: 0,
      }
    );
  }, [units]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">

        <Loader2
          size={38}
          className="animate-spin text-blue-600"
        />

        <p className="mt-4 text-gray-500">
          Loading units...
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>

          <h1 className="text-3xl font-bold text-gray-900">
            Units
          </h1>

          <p className="text-gray-500 mt-1">
            Manage apartment, office, shop and rental units.
          </p>

        </div>

        <div className="flex items-center gap-3">

          <button
            onClick={() => fetchUnits(true)}
            className="h-11 px-5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-2 transition"
          >
            <RefreshCcw
              size={16}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            onClick={() =>
              navigate(
                "/super-admin/units/create"
              )
            }
            className="h-11 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg shadow-blue-200 transition"
          >
            <Plus size={18} />
            Create Unit
          </button>

        </div>

      </div>

      {/* ALERTS */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-center gap-2">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl flex items-center gap-2">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* TOTAL */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Total Units
              </p>

              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {stats.total}
              </h3>

            </div>

            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Building2 className="text-blue-600" />
            </div>

          </div>

        </div>

        {/* VACANT */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Vacant
              </p>

              <h3 className="text-3xl font-bold text-green-600 mt-2">
                {stats.vacant}
              </h3>

            </div>

            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
              <Home className="text-green-600" />
            </div>

          </div>

        </div>

        {/* OCCUPIED */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Occupied
              </p>

              <h3 className="text-3xl font-bold text-red-600 mt-2">
                {stats.occupied}
              </h3>

            </div>

            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
              <TrendingUp className="text-red-600" />
            </div>

          </div>

        </div>

        {/* MAINTENANCE */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Maintenance
              </p>

              <h3 className="text-3xl font-bold text-yellow-600 mt-2">
                {stats.maintenance}
              </h3>

            </div>

            <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center">
              <Wrench className="text-yellow-600" />
            </div>

          </div>

        </div>

      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">

        <div className="relative">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search by unit number, type or property..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
          />

        </div>

      </div>

      {/* TABLE */}
      <div className="overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50 border-b border-gray-100">

              <tr>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                  Unit
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                  Type
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                  Property
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                  Rent
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredUnits.length > 0 ? (
                filteredUnits.map((unit) => {
                  const status =
                    formatStatus(unit);

                  return (
                    <tr
                      key={unit.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >

                      {/* UNIT */}
                      <td className="px-6 py-5">

                        <div className="flex items-start gap-3">

                          <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center">
                            <Building2
                              size={18}
                              className="text-blue-600"
                            />
                          </div>

                          <div>

                            <p className="font-semibold text-gray-900">
                              {getUnitName(unit)}
                            </p>

                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Hash size={12} />
                              {normalize(
                                unit.unit_number
                              )}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* TYPE */}
                      <td className="px-6 py-5 text-gray-700 capitalize">
                        {normalize(
                          getUnitType(unit)
                        )}
                      </td>

                      {/* PROPERTY */}
                      <td className="px-6 py-5">

                        <div className="flex items-center gap-2 text-gray-700">

                          <Building2 size={16} />

                          <span>
                            {unit?.property
                              ?.name ||
                              `Property #${unit.property_id}`}
                          </span>

                        </div>

                      </td>

                      {/* RENT */}
                      <td className="px-6 py-5">

                        <div className="flex items-center gap-1 font-semibold text-gray-900">

                          <DollarSign size={15} />

                          KES{" "}
                          {Number(
                            getRent(unit)
                          ).toLocaleString()}

                        </div>

                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-5">

                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${status.color}`}
                        >
                          {status.label}
                        </span>

                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-5">

                        <div className="flex items-center justify-end gap-2">

                          <button
                            onClick={() =>
                              navigate(
                                `/super-admin/units/${unit.id}`
                              )
                            }
                            className="w-10 h-10 rounded-xl bg-green-100 hover:bg-green-200 text-green-600 flex items-center justify-center transition"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/super-admin/units/edit/${unit.id}`
                              )
                            }
                            className="w-10 h-10 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(unit.id)
                            }
                            className="w-10 h-10 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>

                  <td
                    colSpan="6"
                    className="py-20 text-center"
                  >

                    <div className="flex flex-col items-center justify-center text-gray-400">

                      <Building2
                        size={42}
                        className="mb-3"
                      />

                      <p className="text-lg font-semibold">
                        No units found
                      </p>

                      <p className="text-sm mt-1">
                        Try adjusting your search
                        or create a new unit.
                      </p>

                    </div>

                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
};

export default UnitList;