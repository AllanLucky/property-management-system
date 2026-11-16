
import {
  MapPin,
  Globe2,
  Layers3,
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Hash,
  Building2,
  Navigation,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import AreaStatusBadge from "./AreaStatusBadge";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value) => {
  return toNumber(value).toLocaleString("en-KE");
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name = "") => {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "A"
  );
};

const isAreaActive = (area) => {
  return (
    area?.is_active === true ||
    area?.is_active === 1 ||
    area?.is_active === "1"
  );
};

const formatCoordinate = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toFixed(4)
    : "—";
};

/*
|--------------------------------------------------------------------------
| AREA TABLE
|--------------------------------------------------------------------------
*/

const AreaTable = ({
  areas = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [activeMenu, setActiveMenu] = useState(null);

  const menuRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | CLOSE MENU WHEN CLICKING OUTSIDE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setActiveMenu(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setActiveMenu(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | ACTION HANDLERS
  |--------------------------------------------------------------------------
  */

  const handleMenuToggle = (areaId) => {
    setActiveMenu((current) =>
      current === areaId ? null : areaId
    );
  };

  const handleAction = (callback, area) => {
    setActiveMenu(null);

    if (typeof callback === "function") {
      callback(area);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | EMPTY STATE
  |--------------------------------------------------------------------------
  */

  if (!loading && areas.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
          <MapPin className="h-8 w-8" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-gray-900">
          No areas found
        </h3>

        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
          There are no areas available matching your current
          filters. Try adjusting your search or add a new area.
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
    <div className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* ================================================================
          TABLE HEADER
      ================================================================ */}

      <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Area Records
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Manage areas and their associated geographical locations.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
          <MapPin className="h-3.5 w-3.5" />
          {formatNumber(areas.length)} Records
        </div>

      </div>

      {/* ================================================================
          TABLE CONTENT
      ================================================================ */}

      <div className="overflow-x-auto">

        <table className="min-w-[1250px] w-full divide-y divide-gray-100">

          {/* TABLE HEAD */}

          <thead className="bg-gray-50/80">
            <tr>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 sm:px-6">
                Area
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Location
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Coordinates
              </th>

              <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                Properties
              </th>

              <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Created
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 sm:px-6">
                Actions
              </th>

            </tr>
          </thead>

          {/* TABLE BODY */}

          <tbody className="divide-y divide-gray-100 bg-white">

            {areas.map((area) => {
              const active = isAreaActive(area);

              const latitude =
                area.latitude ??
                area.coordinates?.latitude;

              const longitude =
                area.longitude ??
                area.coordinates?.longitude;

              const location =
                area.full_location ||
                [
                  area.name,
                  area.city?.name,
                  area.county?.name,
                  area.region?.name,
                  area.country?.name,
                ]
                  .filter(Boolean)
                  .join(", ");

              return (
                <tr
                  key={area.id}
                  className="transition hover:bg-gray-50/70"
                >

                  {/* ==================================================
                      AREA INFORMATION
                  ================================================== */}

                  <td className="px-5 py-4 sm:px-6">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
                        {getInitials(area.name)}
                      </div>

                      <div className="min-w-0">

                        <button
                          type="button"
                          onClick={() =>
                            handleAction(onView, area)
                          }
                          className="max-w-[220px] truncate text-left text-sm font-semibold text-gray-900 transition hover:text-indigo-600"
                          title={`View ${area.name}`}
                        >
                          {area.name || "Unnamed Area"}
                        </button>

                        <div className="mt-1 flex flex-wrap items-center gap-2">

                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Hash className="h-3 w-3" />
                            {area.code || "No code"}
                          </span>

                          <span className="text-gray-300">
                            •
                          </span>

                          <span className="text-xs text-gray-400">
                            ID: {area.id}
                          </span>

                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ==================================================
                      LOCATION INFORMATION
                  ================================================== */}

                  <td className="px-5 py-4">

                    <div className="max-w-[350px]">

                      <div className="flex items-start gap-2">

                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />

                        <span
                          className="text-sm font-medium leading-5 text-gray-700"
                          title={location}
                        >
                          {location || "Location unavailable"}
                        </span>

                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 pl-6 text-xs text-gray-400">

                        <span className="inline-flex items-center gap-1">
                          <Globe2 className="h-3 w-3" />
                          {area.country?.name || "—"}
                        </span>

                        <span className="text-gray-300">
                          /
                        </span>

                        <span>
                          {area.region?.name || "—"}
                        </span>

                        <span className="text-gray-300">
                          /
                        </span>

                        <span>
                          {area.county?.name || "—"}
                        </span>

                      </div>

                      <div className="mt-1 flex items-center gap-1 pl-6 text-xs text-gray-400">
                        <Building2 className="h-3 w-3" />
                        <span>
                          {area.city?.name || "City unavailable"}
                        </span>
                      </div>

                    </div>
                  </td>

                  {/* ==================================================
                      COORDINATES
                  ================================================== */}

                  <td className="px-5 py-4">

                    <div className="flex items-start gap-2">

                      <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />

                      <div className="min-w-0">

                        <p className="text-xs font-medium text-gray-700">
                          Lat: {formatCoordinate(latitude)}
                        </p>

                        <p className="mt-1 text-xs font-medium text-gray-500">
                          Long: {formatCoordinate(longitude)}
                        </p>

                      </div>
                    </div>

                  </td>

                  {/* ==================================================
                      PROPERTIES COUNT
                  ================================================== */}

                  <td className="px-5 py-4 text-center">

                    <div className="inline-flex flex-col items-center gap-1">

                      <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-purple-50 px-2 text-sm font-semibold text-purple-700">
                        {formatNumber(area.properties_count)}
                      </span>

                      <span className="text-xs text-gray-400">
                        Properties
                      </span>

                    </div>

                  </td>

                  {/* ==================================================
                      STATUS
                  ================================================== */}

                  <td className="px-5 py-4 text-center">

                    <AreaStatusBadge
                      status={active ? "active" : "inactive"}
                      label={
                        area.status_label ||
                        (active ? "Active" : "Inactive")
                      }
                    />

                  </td>

                  {/* ==================================================
                      CREATED DATE
                  ================================================== */}

                  <td className="px-5 py-4">

                    <div className="inline-flex items-center gap-2 text-sm text-gray-600">

                      <CalendarDays className="h-4 w-4 text-gray-400" />

                      {formatDate(area.created_at)}

                    </div>

                  </td>

                  {/* ==================================================
                      ACTIONS
                  ================================================== */}

                  <td className="px-5 py-4 text-right sm:px-6">

                    <div className="inline-flex items-center justify-end gap-1">

                      {/* VIEW */}

                      <button
                        type="button"
                        onClick={() =>
                          handleAction(onView, area)
                        }
                        title="View area"
                        aria-label={`View ${area.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* EDIT */}

                      <button
                        type="button"
                        onClick={() =>
                          handleAction(onEdit, area)
                        }
                        title="Edit area"
                        aria-label={`Edit ${area.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {/* THREE-DOT MENU */}

                      <div
                        className="relative"
                        ref={
                          activeMenu === area.id
                            ? menuRef
                            : null
                        }
                      >

                        <button
                          type="button"
                          onClick={() =>
                            handleMenuToggle(area.id)
                          }
                          title="More actions"
                          aria-label={`More actions for ${area.name}`}
                          aria-expanded={activeMenu === area.id}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${activeMenu === area.id
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenu === area.id && (

                          <div className="absolute right-0 top-10 z-30 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 text-left shadow-xl">

                            {/* VIEW DETAILS */}

                            <button
                              type="button"
                              onClick={() =>
                                handleAction(onView, area)
                              }
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
                            >
                              <Eye className="h-4 w-4 text-gray-400" />
                              View Details
                            </button>

                            {/* EDIT AREA */}

                            <button
                              type="button"
                              onClick={() =>
                                handleAction(onEdit, area)
                              }
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
                            >
                              <Pencil className="h-4 w-4 text-gray-400" />
                              Edit Area
                            </button>

                            {/* ACTIVATE / DEACTIVATE */}

                            {typeof onToggleStatus === "function" && (

                              <button
                                type="button"
                                disabled={loading}
                                onClick={() =>
                                  handleAction(
                                    onToggleStatus,
                                    area
                                  )
                                }
                                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${active
                                  ? "text-rose-600"
                                  : "text-emerald-600"
                                  }`}
                              >

                                {active ? (
                                  <>
                                    <XCircle className="h-4 w-4" />
                                    Deactivate Area
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Activate Area
                                  </>
                                )}

                              </button>
                            )}

                            {/* DELETE */}

                            {typeof onDelete === "function" && (

                              <>
                                <div className="my-1 border-t border-gray-100" />

                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() =>
                                    handleAction(onDelete, area)
                                  }
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete Area
                                </button>
                              </>
                            )}

                          </div>
                        )}

                      </div>

                    </div>

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>

      {/* ================================================================
          TABLE FOOTER
      ================================================================ */}

      <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">

        <p className="text-xs text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-700">
            {formatNumber(areas.length)}
          </span>{" "}
          areas on this page
        </p>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Layers3 className="h-3.5 w-3.5" />
          Area Management
        </div>

      </div>

    </div>
  );
};

export default AreaTable;
