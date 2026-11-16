
import {
  MapPin,
  Globe2,
  Layers3,
  Building2,
  Home,
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Map,
} from "lucide-react";

import { useState } from "react";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value) =>
  toNumber(value).toLocaleString("en-KE");

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const getCountyId = (county) => {
  const value =
    county && typeof county === "object"
      ? county.id
      : county;

  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return null;
  }

  return value;
};

const getCountyName = (county) =>
  county?.name || "Unnamed County";

const getCountryName = (county) =>
  county?.country?.name || "Unknown Country";

const getRegionName = (county) =>
  county?.region?.name || "Unassigned Region";

const getCountyCode = (county) =>
  county?.code || "—";

const isCountyActive = (county) => {
  if (typeof county?.is_active === "boolean") {
    return county.is_active;
  }

  if (
    county?.is_active === 1 ||
    county?.is_active === "1"
  ) {
    return true;
  }

  if (
    county?.is_active === 0 ||
    county?.is_active === "0"
  ) {
    return false;
  }

  return String(county?.status || "").toLowerCase() === "active";
};

/*
|--------------------------------------------------------------------------
| SAFE ACTION HANDLER
|--------------------------------------------------------------------------
*/

const executeCountyAction = (callback, county) => {
  const countyId = getCountyId(county);

  if (!countyId) {
    console.error("County action failed: missing county ID.", county);
    return;
  }

  if (typeof callback !== "function") {
    console.error("County action callback is not defined.");
    return;
  }

  // Always pass the complete county object.
  callback(county);
};

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/

const CountyStatusBadge = ({ county }) => {
  const isActive = isCountyActive(county);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${isActive
        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
        : "bg-gray-100 text-gray-600 ring-gray-500/20"
        }`}
    >
      {isActive ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}

      {county?.status_label || (isActive ? "Active" : "Inactive")}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| COUNT DISPLAY
|--------------------------------------------------------------------------
*/

const CountItem = ({
  icon: Icon,
  value,
  label,
  colorClass,
}) => (
  <div className="flex min-w-0 items-center gap-1.5">
    <Icon
      className={`h-3.5 w-3.5 shrink-0 ${colorClass}`}
      aria-hidden="true"
    />

    <span className="text-xs font-semibold tabular-nums text-gray-800">
      {formatNumber(value)}
    </span>

    <span className="hidden text-xs text-gray-400 xl:inline">
      {label}
    </span>
  </div>
);

/*
|--------------------------------------------------------------------------
| ACTION MENU
|--------------------------------------------------------------------------
*/

const CountyActions = ({
  county,
  onView,
  onEdit,
  onDelete,
}) => {
  const [open, setOpen] = useState(false);

  const countyId = getCountyId(county);

  const handleAction = (callback) => {
    setOpen(false);

    executeCountyAction(callback, county);
  };

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label={`Actions for ${getCountyName(county)}`}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close actions menu"
            tabIndex={-1}
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div
            role="menu"
            className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(onView)}
              disabled={!onView || !countyId}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(onEdit)}
              disabled={!onEdit || !countyId}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pencil className="h-4 w-4" />
              Edit County
            </button>

            <div className="my-1 border-t border-gray-100" />

            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction(onDelete)}
              disabled={!onDelete || !countyId}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete County
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| LOADING SKELETON
|--------------------------------------------------------------------------
*/

const CountyTableSkeleton = ({ rows = 5 }) => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="min-w-[1050px] w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            {[
              "County",
              "Country",
              "Region",
              "Location Records",
              "Status",
              "Created",
              "Actions",
            ].map((heading) => (
              <th
                key={heading}
                className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, index) => (
            <tr key={index} className="animate-pulse">
              {Array.from({ length: 7 }).map((__, cellIndex) => (
                <td key={cellIndex} className="px-5 py-5">
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-16 rounded bg-gray-100" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/*
|--------------------------------------------------------------------------
| EMPTY STATE
|--------------------------------------------------------------------------
*/

const CountyTableEmpty = () => (
  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
      <MapPin className="h-8 w-8" />
    </div>

    <h3 className="mt-5 text-base font-bold text-gray-900">
      No counties found
    </h3>

    <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
      There are no counties matching your current search or filter
      criteria. Try adjusting your filters or add a new county.
    </p>
  </div>
);

/*
|--------------------------------------------------------------------------
| MAIN COMPONENT
|--------------------------------------------------------------------------
*/

const CountyTable = ({
  counties = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
}) => {
  const records = Array.isArray(counties) ? counties : [];

  if (loading && records.length === 0) {
    return <CountyTableSkeleton rows={5} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* TABLE HEADER */}

      <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            County Records
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Manage registered counties and their location information.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
          <MapPin className="h-3.5 w-3.5" />
          {formatNumber(records.length)} Records
        </div>
      </div>

      {/* TABLE */}

      {records.length === 0 ? (
        <CountyTableEmpty />
      ) : (
        <div className="relative overflow-x-auto">
          <table className="min-w-[1100px] w-full divide-y divide-gray-100">

            {/* TABLE HEAD */}

            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  County
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Country
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Region
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Location Records
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Created
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            {/* TABLE BODY */}

            <tbody className="divide-y divide-gray-100">
              {records.map((county, index) => {
                const countyId = getCountyId(county);

                return (
                  <tr
                    key={countyId ?? `county-${index}`}
                    className="group transition-colors hover:bg-gray-50/80"
                  >
                    {/* COUNTY */}

                    <td className="px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                          <MapPin className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => executeCountyAction(onView, county)}
                            disabled={!countyId || !onView}
                            className="block max-w-[220px] truncate text-left text-sm font-semibold text-gray-900 transition hover:text-indigo-600 disabled:cursor-default"
                          >
                            {getCountyName(county)}
                          </button>

                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                              {getCountyCode(county)}
                            </span>

                            <span className="truncate text-xs text-gray-400">
                              ID: {countyId ?? "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* COUNTRY */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Globe2 className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[160px] truncate text-sm font-medium text-gray-800">
                            {getCountryName(county)}
                          </p>

                          {county?.country?.code && (
                            <p className="mt-0.5 text-xs text-gray-400">
                              {county.country.code}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* REGION */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                          <Layers3 className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[180px] truncate text-sm font-medium text-gray-800">
                            {getRegionName(county)}
                          </p>

                          {county?.region?.code && (
                            <p className="mt-0.5 text-xs text-gray-400">
                              {county.region.code}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* LOCATION RECORDS */}

                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <CountItem
                            icon={Building2}
                            value={county?.cities_count}
                            label="Cities"
                            colorClass="text-blue-500"
                          />

                          <CountItem
                            icon={Map}
                            value={county?.areas_count}
                            label="Areas"
                            colorClass="text-violet-500"
                          />
                        </div>

                        <CountItem
                          icon={Home}
                          value={county?.properties_count}
                          label="Properties"
                          colorClass="text-emerald-500"
                        />
                      </div>
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4">
                      <CountyStatusBadge county={county} />
                    </td>

                    {/* CREATED */}

                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap text-sm font-medium text-gray-700">
                        {formatDate(county?.created_at)}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Created date
                      </p>
                    </td>

                    {/* ACTIONS */}

                    <td className="px-5 py-4">
                      <CountyActions
                        county={county}
                        onView={onView}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLE FOOTER */}

      {records.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {formatNumber(records.length)}
            </span>{" "}
            county records on this page
          </p>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 text-indigo-500" />
            <span>County management</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountyTable;
