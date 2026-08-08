
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";

import useUnit from "../../../hooks/useUnits";
import { addNotification } from "../../../store/uiSlice";

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
  Search,
  DollarSign,
  Hash,
} from "lucide-react";

const UnitList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /*
  |--------------------------------------------------------------------------
  | UNIT HOOK
  |--------------------------------------------------------------------------
  */

  const {
    units = [],
    loading,
    error,
    getUnits,
    removeUnit,
  } = useUnit();

  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

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
        value?.label ||
        value?.value ||
        "-"
      );
    }

    return String(value);
  };

  /*
  |--------------------------------------------------------------------------
  | GET UNIT NAME
  |--------------------------------------------------------------------------
  */

  const getUnitName = (unit) => {
    return (
      normalize(unit?.name) !== "-"
        ? normalize(unit?.name)
        : normalize(unit?.unit_number) !== "-"
          ? normalize(unit?.unit_number)
          : `Unit #${unit?.id}`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | GET UNIT TYPE
  |--------------------------------------------------------------------------
  */

  const getUnitType = (unit) => {
    return normalize(
      unit?.type ??
      unit?.unit_type ??
      unit?.category
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
    const status = unit?.status;

    if (typeof status === "object") {
      return (
        status?.value ||
        status?.current ||
        status?.name ||
        "unknown"
      )
        .toString()
        .toLowerCase();
    }

    return String(
      status || unit?.status?.current || "unknown"
    ).toLowerCase();
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

      case "active":
        return {
          label: "Active",
          color:
            "bg-blue-100 text-blue-700 border border-blue-200",
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
      if (isRefresh) {
        setRefreshing(true);
      }

      await getUnits();

      if (isRefresh) {
        dispatch(
          addNotification({
            type: "success",
            message: "Units refreshed successfully.",
          })
        );
      }
    } catch (err) {
      console.error("FAILED TO FETCH UNITS:", err);

      dispatch(
        addNotification({
          type: "error",
          message:
            err?.message ||
            "Failed to load units.",
        })
      );
    } finally {
      setRefreshing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchUnits(false);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | DELETE UNIT
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (id) => {
    if (!id) {
      return;
    }

    const unit = units.find(
      (item) => item.id === id
    );

    const unitName = unit
      ? getUnitName(unit)
      : `Unit #${id}`;

    const result = await Swal.fire({
      title: "Delete Unit?",
      html: `
        <p class="text-gray-600">
          You are about to delete
          <strong>${unitName}</strong>.
        </p>
        <p class="text-sm text-red-500 mt-2">
          This action cannot be undone.
        </p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: "rounded-3xl",
        confirmButton:
          "px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold ml-2",
        cancelButton:
          "px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold",
      },
      buttonsStyling: false,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeletingId(id);

      /*
      |--------------------------------------------------------------------------
      | SHOW DELETE LOADING
      |--------------------------------------------------------------------------
      */

      Swal.fire({
        title: "Deleting Unit...",
        html: `
          <div class="flex flex-col items-center justify-center py-3">
            <div
              class="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"
            ></div>

            <p class="mt-4 text-sm text-gray-500">
              Please wait while the unit is being deleted.
            </p>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        customClass: {
          popup: "rounded-3xl",
        },
      });

      /*
      |--------------------------------------------------------------------------
      | DELETE THROUGH HOOK
      |--------------------------------------------------------------------------
      */

      await removeUnit(id);

      /*
      |--------------------------------------------------------------------------
      | CLOSE LOADING
      |--------------------------------------------------------------------------
      */

      await Swal.close();

      /*
      |--------------------------------------------------------------------------
      | SUCCESS NOTIFICATION
      |--------------------------------------------------------------------------
      */

      dispatch(
        addNotification({
          type: "success",
          message: "Unit deleted successfully.",
        })
      );

      /*
      |--------------------------------------------------------------------------
      | RELOAD LIST
      |--------------------------------------------------------------------------
      */

      await getUnits();
    } catch (err) {
      console.error("DELETE UNIT FAILED:", err);

      await Swal.close();

      dispatch(
        addNotification({
          type: "error",
          message:
            err?.message ||
            err?.response?.data?.message ||
            "Failed to delete unit.",
        })
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTERED UNITS
  |--------------------------------------------------------------------------
  */

  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return units;
    }

    return units.filter((unit) => {
      const unitName =
        getUnitName(unit).toLowerCase();

      const unitNumber = normalize(
        unit?.unit_number
      ).toLowerCase();

      const unitType =
        getUnitType(unit).toLowerCase();

      const propertyName =
        normalize(
          unit?.property?.name
        ).toLowerCase();

      const apartmentName =
        normalize(
          unit?.apartment?.name
        ).toLowerCase();

      return (
        unitName.includes(query) ||
        unitNumber.includes(query) ||
        unitType.includes(query) ||
        propertyName.includes(query) ||
        apartmentName.includes(query)
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

  if (loading && units.length === 0) {
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

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">

      {/* ------------------------------------------------------------------ */}
      {/* HEADER */}
      {/* ------------------------------------------------------------------ */}

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
            type="button"
            onClick={() => fetchUnits(true)}
            disabled={refreshing}
            className="h-11 px-5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition"
          >
            <RefreshCcw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            type="button"
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

      {/* ------------------------------------------------------------------ */}
      {/* ERROR */}
      {/* ------------------------------------------------------------------ */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-center gap-2">
          <span className="font-medium">
            {typeof error === "string"
              ? error
              : error?.message ||
              "Failed to load units."}
          </span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* STATS */}
      {/* ------------------------------------------------------------------ */}

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
              <Building2
                className="text-blue-600"
              />
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
              <Home
                className="text-green-600"
              />
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
              <TrendingUp
                className="text-red-600"
              />
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
              <Wrench
                className="text-yellow-600"
              />
            </div>

          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SEARCH */}
      {/* ------------------------------------------------------------------ */}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">

        <div className="relative">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search by unit number, type, apartment or property..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
          />

        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TABLE */}
      {/* ------------------------------------------------------------------ */}

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

                  const isDeleting =
                    deletingId === unit.id;

                  return (
                    <tr
                      key={unit.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >

                      {/* UNIT */}

                      <td className="px-6 py-5">

                        <div className="flex items-start gap-3">

                          <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
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
                                unit?.unit_number
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

                        <div className="flex flex-col gap-1">

                          <div className="flex items-center gap-2 text-gray-700">

                            <Building2 size={16} />

                            <span>
                              {unit?.property?.name ||
                                `Property #${unit?.property_id}`}
                            </span>

                          </div>

                          {unit?.apartment?.name && (
                            <span className="text-xs text-gray-400 ml-6">
                              {unit.apartment.name}
                            </span>
                          )}

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

                          {/* VIEW */}

                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() =>
                              navigate(
                                `/super-admin/units/${unit.id}`
                              )
                            }
                            className="w-10 h-10 rounded-xl bg-green-100 hover:bg-green-200 disabled:opacity-50 text-green-600 flex items-center justify-center transition"
                            title="View Unit"
                          >
                            <Eye size={16} />
                          </button>

                          {/* EDIT */}

                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() =>
                              navigate(
                                `/super-admin/units/edit/${unit.id}`
                              )
                            }
                            className="w-10 h-10 rounded-xl bg-blue-100 hover:bg-blue-200 disabled:opacity-50 text-blue-600 flex items-center justify-center transition"
                            title="Edit Unit"
                          >
                            <Edit size={16} />
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() =>
                              handleDelete(unit.id)
                            }
                            className="w-10 h-10 rounded-xl bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed text-red-600 flex items-center justify-center transition"
                            title="Delete Unit"
                          >
                            {isDeleting ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={16} />
                            )}
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
                        {search
                          ? "Try adjusting your search."
                          : "Create a new unit to get started."}
                      </p>

                      {!search && (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "/super-admin/units/create"
                            )
                          }
                          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                        >
                          <Plus size={16} />
                          Create Unit
                        </button>
                      )}

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

