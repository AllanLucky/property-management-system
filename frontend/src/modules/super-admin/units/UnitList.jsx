import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";

import useUnit from "../../../hooks/useUnits";
import { addNotification } from "../../../store/uiSlice";

import {
  Plus,
  Loader2,
  RefreshCcw,
  Building2,
} from "lucide-react";

import {
  UnitTable,
  UnitFilters,
  UnitStats,
} from "./";

const UnitList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    units = [],
    loading,
    error,
    getUnits,
    removeUnit,
  } = useUnit();

  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  const normalize = useCallback((value) => {
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
  }, []);

  const getUnitName = useCallback(
    (unit) => {
      const name = normalize(unit?.name);

      if (name !== "-") {
        return name;
      }

      const unitNumber =
        normalize(unit?.unit_number);

      if (unitNumber !== "-") {
        return unitNumber;
      }

      return `Unit #${unit?.id}`;
    },
    [normalize]
  );

  const getUnitType = useCallback(
    (unit) => {
      return normalize(
        unit?.type ??
        unit?.unit_type ??
        unit?.category
      );
    },
    [normalize]
  );

  const getRent = useCallback((unit) => {
    return (
      unit?.rent_amount ??
      unit?.pricing?.rent_amount ??
      unit?.rent ??
      unit?.rent_price ??
      unit?.price ??
      0
    );
  }, []);

  const getStatus = useCallback((unit) => {
    const status = unit?.status;

    if (typeof status === "object") {
      return String(
        status?.value ??
        status?.current ??
        status?.name ??
        "unknown"
      ).toLowerCase();
    }

    return String(status || "unknown").toLowerCase();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Fetch Units
  |--------------------------------------------------------------------------
  */

  const fetchUnits = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        }

        await getUnits();

        if (isRefresh) {
          dispatch(
            addNotification({
              type: "success",
              message:
                "Units refreshed successfully.",
            })
          );
        }
      } catch (err) {
        console.error(
          "FAILED TO FETCH UNITS:",
          err
        );

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
    },
    [getUnits, dispatch]
  );

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchUnits(false);
  }, [fetchUnits]);

  /*
  |--------------------------------------------------------------------------
  | Delete Unit
  |--------------------------------------------------------------------------
  */

  const handleDelete = useCallback(
    async (id) => {
      if (!id) {
        return;
      }

      const unit = units.find(
        (item) =>
          String(item.id) === String(id)
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

        await removeUnit(id);

        Swal.close();

        dispatch(
          addNotification({
            type: "success",
            message:
              "Unit deleted successfully.",
          })
        );

        await getUnits();
      } catch (err) {
        console.error(
          "DELETE UNIT FAILED:",
          err
        );

        Swal.close();

        dispatch(
          addNotification({
            type: "error",
            message:
              err?.message ||
              err?.response?.data
                ?.message ||
              "Failed to delete unit.",
          })
        );
      } finally {
        setDeletingId(null);
      }
    },
    [
      units,
      getUnitName,
      removeUnit,
      getUnits,
      dispatch,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Filter Units
  |--------------------------------------------------------------------------
  */

  const filteredUnits = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return units;
    }

    return units.filter((unit) => {
      const unitName =
        getUnitName(unit).toLowerCase();

      const unitNumber =
        normalize(
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
  }, [
    units,
    search,
    normalize,
    getUnitName,
    getUnitType,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const stats = useMemo(() => {
    return units.reduce(
      (acc, unit) => {
        acc.total++;

        const status =
          getStatus(unit);

        if (status === "vacant") {
          acc.vacant++;
        }

        if (status === "occupied") {
          acc.occupied++;
        }

        if (status === "maintenance") {
          acc.maintenance++;
        }

        if (status === "reserved") {
          acc.reserved++;
        }

        return acc;
      },
      {
        total: 0,
        vacant: 0,
        occupied: 0,
        maintenance: 0,
        reserved: 0,
      }
    );
  }, [units, getStatus]);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading && units.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2
            size={36}
            className="animate-spin text-blue-600"
          />

          <p className="mt-4 text-gray-500">
            Loading units...
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Units
          </h1>

          <p className="mt-1 text-gray-500">
            Manage apartment, office, shop
            and rental units.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              fetchUnits(true)
            }
            disabled={refreshing}
            className="flex h-11 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
          >
            <Plus size={18} />

            Create Unit
          </button>
        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          <Building2 size={18} />

          <span className="font-medium">
            {typeof error ===
              "string"
              ? error
              : error?.message ||
              "Failed to load units."}
          </span>
        </div>
      )}

      {/* Stats */}

      <UnitStats stats={stats} />

      {/* Filters */}

      <UnitFilters
        search={search}
        onSearchChange={setSearch}
        onRefresh={() =>
          fetchUnits(true)
        }
        refreshing={refreshing}
      />

      {/* Table */}

      <UnitTable
        units={filteredUnits}
        search={search}
        deletingId={deletingId}
        onView={(id) =>
          navigate(
            `/super-admin/units/${id}`
          )
        }
        onEdit={(id) =>
          navigate(
            `/super-admin/units/edit/${id}`
          )
        }
        onDelete={handleDelete}
        getUnitName={getUnitName}
        getUnitType={getUnitType}
        getRent={getRent}
        getStatus={getStatus}
        normalize={normalize}
        onCreate={() =>
          navigate(
            "/super-admin/units/create"
          )
        }
      />
    </div>
  );
};

export default UnitList;