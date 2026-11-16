
import { useMemo, useState } from "react";

import {
  MapPin,
  Globe2,
  Hash,
  Building2,
  CalendarDays,
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  CheckCircle2,
  ArrowUpDown,
  Layers3,
  Power,
  Unlink,
} from "lucide-react";

import RegionStatusBadge from "./RegionStatusBadge";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

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

const formatNumber = (value) =>
  new Intl.NumberFormat("en-KE").format(
    Number(value) || 0
  );

const getCountryName = (region) =>
  region?.country?.name ||
  region?.country_name ||
  "Unknown Country";

const getCountryCode = (region) =>
  region?.country?.code || "";

const getRegionStatus = (region) =>
  region?.status ||
  (region?.is_active ? "active" : "inactive");

const isRegionActive = (region) =>
  region?.is_active === true ||
  region?.is_active === 1 ||
  region?.status === "active";

const getCountyCount = (region) =>
  Number(region?.counties_count ?? 0);

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

/*
|--------------------------------------------------------------------------
| Sort Button
|--------------------------------------------------------------------------
| IMPORTANT: Declared outside RegionTable to prevent component
| recreation during rendering.
|--------------------------------------------------------------------------
*/

const SortButton = ({
  field,
  sortBy,
  sortDirection,
  onSort,
  children,
}) => (
  <button
    type="button"
    onClick={() => {
      if (!onSort) return;

      const nextDirection =
        sortBy === field && sortDirection === "asc"
          ? "desc"
          : "asc";

      onSort(field, nextDirection);
    }}
    className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 transition hover:text-indigo-600"
  >
    {children}

    <ArrowUpDown
      className={`h-3 w-3 ${sortBy === field
          ? "text-indigo-600"
          : "text-gray-300"
        }`}
    />
  </button>
);

/*
|--------------------------------------------------------------------------
| Action Dropdown
|--------------------------------------------------------------------------
*/

const RegionActionMenu = ({
  region,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  canView = true,
  canEdit = true,
  canDelete = true,
  canToggleStatus = true,
}) => {
  const [open, setOpen] = useState(false);

  const active = isRegionActive(region);

  const handleAction = (callback) => {
    setOpen(false);
    callback?.(region);
  };

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        aria-label={`Actions for ${region?.name || "region"}`}
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close actions menu"
          />

          <div className="absolute right-0 top-10 z-40 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
            {canView && (
              <button
                type="button"
                onClick={() => handleAction(onView)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 text-gray-400" />
                View Details
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={() => handleAction(onEdit)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4 text-gray-400" />
                Edit Region
              </button>
            )}

            {canToggleStatus && (
              <button
                type="button"
                onClick={() => handleAction(onToggleStatus)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
              >
                <Power
                  className={`h-4 w-4 ${active
                      ? "text-amber-500"
                      : "text-emerald-500"
                    }`}
                />
                {active ? "Deactivate" : "Activate"}
              </button>
            )}

            {canDelete && (
              <>
                <div className="my-1 border-t border-gray-100" />

                <button
                  type="button"
                  onClick={() => handleAction(onDelete)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Region
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Country Information
|--------------------------------------------------------------------------
*/

const CountryInformation = ({ region }) => {
  const countryName = getCountryName(region);
  const countryCode = getCountryCode(region);
  const countryActive = region?.country?.is_active;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
        <Globe2 className="h-4 w-4 text-gray-500" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-800">
          {countryName}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {countryCode && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
              {countryCode}
            </span>
          )}

          {typeof countryActive === "boolean" && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-medium ${countryActive
                  ? "text-emerald-600"
                  : "text-amber-600"
                }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${countryActive
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                  }`}
              />

              {countryActive
                ? "Active country"
                : "Inactive country"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Region Information
|--------------------------------------------------------------------------
*/

const RegionInformation = ({ region, onView }) => {
  const name = region?.name || "Unnamed Region";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
        {getInitials(name) || (
          <MapPin className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0">
        <button
          type="button"
          onClick={() => onView?.(region)}
          className="block max-w-full truncate text-left text-sm font-bold text-gray-900 transition hover:text-indigo-600"
          title={name}
        >
          {name}
        </button>

        <p
          className="mt-1 truncate text-xs text-gray-400"
          title={region?.slug || ""}
        >
          {region?.slug || "No slug available"}
        </p>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Region Code
|--------------------------------------------------------------------------
*/

const RegionCode = ({ code }) => (
  <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 font-mono text-xs font-bold tracking-wide text-gray-700">
    <Hash className="h-3 w-3 text-gray-400" />
    {code || "—"}
  </span>
);

/*
|--------------------------------------------------------------------------
| County Information
|--------------------------------------------------------------------------
*/

const CountyInformation = ({ region }) => {
  const count = getCountyCount(region);

  const hasCounties =
    region?.has_counties === true || count > 0;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${hasCounties
            ? "bg-violet-50 text-violet-600"
            : "bg-gray-100 text-gray-400"
          }`}
      >
        {hasCounties ? (
          <Building2 className="h-4 w-4" />
        ) : (
          <Unlink className="h-4 w-4" />
        )}
      </div>

      <div>
        <p className="text-sm font-bold text-gray-800">
          {formatNumber(count)}
        </p>

        <p className="text-[10px] text-gray-400">
          {count === 1 ? "County" : "Counties"}
        </p>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

const RegionTableEmptyState = ({
  search = "",
  onReset,
  onCreate,
}) => (
  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
      <MapPin className="h-7 w-7 text-gray-400" />
    </div>

    <h3 className="mt-5 text-base font-bold text-gray-900">
      {search
        ? "No matching regions found"
        : "No regions found"}
    </h3>

    <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
      {search
        ? "Try adjusting your search or filters to find the region you are looking for."
        : "There are currently no regions registered. Create your first region to get started."}
    </p>

    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
      {search && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Clear Filters
        </button>
      )}

      {!search && onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <MapPin className="h-4 w-4" />
          Create Region
        </button>
      )}
    </div>
  </div>
);

/*
|--------------------------------------------------------------------------
| Main Region Table
|--------------------------------------------------------------------------
*/

const RegionTable = ({
  regions = [],
  loading = false,
  search = "",

  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onReset,
  onCreate,

  onSort,
  sortBy = "created_at",
  sortDirection = "desc",

  canView = true,
  canEdit = true,
  canDelete = true,
  canToggleStatus = true,

  emptyMessage,
}) => {
  /*
  |--------------------------------------------------------------------------
  | Normalize Data
  |--------------------------------------------------------------------------
  */

  const regionList = useMemo(() => {
    if (!Array.isArray(regions)) return [];

    return regions.filter(
      (region) =>
        region &&
        typeof region === "object" &&
        region.id !== undefined
    );
  }, [regions]);

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="space-y-4 p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse items-center gap-4"
            >
              <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-200" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-40 max-w-full rounded bg-gray-200" />
                <div className="h-3 w-28 max-w-full rounded bg-gray-100" />
              </div>

              <div className="hidden h-7 w-20 rounded bg-gray-100 md:block" />
              <div className="hidden h-7 w-24 rounded bg-gray-100 lg:block" />
              <div className="h-8 w-8 shrink-0 rounded-lg bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Empty State
  |--------------------------------------------------------------------------
  */

  if (regionList.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {emptyMessage ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <RegionTableEmptyState
            search={search}
            onReset={onReset}
            onCreate={onCreate}
          />
        )}
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Table
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">

      {/* Table Header */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
            <Layers3 className="h-4 w-4 text-indigo-600" />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900">
              Region Records
            </h3>

            <p className="mt-0.5 text-xs text-gray-500">
              Manage registered regions and their counties
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />

          <span className="text-xs font-semibold text-gray-600">
            {formatNumber(regionList.length)}{" "}
            {regionList.length === 1 ? "Region" : "Regions"}
          </span>
        </div>
      </div>

      {/* Responsive Table */}

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse text-left">

          {/* Table Head */}

          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="px-5 py-4">
                <SortButton
                  field="name"
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={onSort}
                >
                  Region
                </SortButton>
              </th>

              <th className="px-5 py-4">
                <SortButton
                  field="code"
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={onSort}
                >
                  Code
                </SortButton>
              </th>

              <th className="px-5 py-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Country
                </span>
              </th>

              <th className="px-5 py-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Counties
                </span>
              </th>

              <th className="px-5 py-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Status
                </span>
              </th>

              <th className="px-5 py-4">
                <SortButton
                  field="created_at"
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={onSort}
                >
                  Created
                </SortButton>
              </th>

              <th className="px-5 py-4 text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Actions
                </span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}

          <tbody className="divide-y divide-gray-100">
            {regionList.map((region) => {
              const active = isRegionActive(region);

              return (
                <tr
                  key={region.id}
                  className="group transition-colors duration-150 hover:bg-gray-50/80"
                >
                  {/* Region */}

                  <td className="px-5 py-4">
                    <RegionInformation
                      region={region}
                      onView={onView}
                    />
                  </td>

                  {/* Code */}

                  <td className="px-5 py-4">
                    <RegionCode code={region.code} />
                  </td>

                  {/* Country */}

                  <td className="px-5 py-4">
                    <CountryInformation region={region} />
                  </td>

                  {/* Counties */}

                  <td className="px-5 py-4">
                    <CountyInformation region={region} />
                  </td>

                  {/* Status */}

                  <td className="px-5 py-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <RegionStatusBadge
                        status={getRegionStatus(region)}
                        isActive={active}
                      />

                      {region?.country?.is_active === false && (
                        <span className="text-[10px] font-medium text-amber-600">
                          Parent country inactive
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Created */}

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-400" />

                      <span className="whitespace-nowrap">
                        {formatDate(region.created_at)}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}

                  <td className="px-5 py-4">
                    <RegionActionMenu
                      region={region}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleStatus={onToggleStatus}
                      canView={canView}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      canToggleStatus={canToggleStatus}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-3">
        <p className="text-xs text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-700">
            {formatNumber(regionList.length)}
          </span>{" "}
          {regionList.length === 1 ? "region" : "regions"}
        </p>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>Region records loaded</span>
        </div>
      </div>
    </div>
  );
};

export default RegionTable;
