
import { useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Building2,
  Home,
  Layers3,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| UNIT FILTERS
|--------------------------------------------------------------------------
*/

const UnitFilters = ({
  filters = {},
  onFilterChange,
  onReset,
  properties = [],
  apartments = [],
  unitTypes = [],
}) => {
  /*
  |--------------------------------------------------------------------------
  | FILTER VALUES
  |--------------------------------------------------------------------------
  */

  const search = filters?.search ?? "";
  const status = filters?.status ?? "";
  const propertyId = filters?.property_id ?? "";
  const apartmentId = filters?.apartment_id ?? "";
  const floor = filters?.floor ?? "";
  const type = filters?.type ?? "";

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE PROPERTIES
  |--------------------------------------------------------------------------
  */

  const normalizedProperties = useMemo(() => {
    return Array.isArray(properties) ? properties : [];
  }, [properties]);

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE APARTMENTS
  |--------------------------------------------------------------------------
  */

  const normalizedApartments = useMemo(() => {
    return Array.isArray(apartments) ? apartments : [];
  }, [apartments]);

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE UNIT TYPES
  |--------------------------------------------------------------------------
  |
  | No useMemo is necessary here.
  | This avoids React Compiler dependency warnings.
  |
  */

  const normalizedUnitTypes = Array.isArray(unitTypes)
    ? unitTypes
    : [];

  /*
  |--------------------------------------------------------------------------
  | APARTMENTS FOR SELECTED PROPERTY
  |--------------------------------------------------------------------------
  */

  const availableApartments = useMemo(() => {
    if (!propertyId) {
      return normalizedApartments;
    }

    return normalizedApartments.filter((apartment) => {
      const apartmentPropertyId =
        apartment?.property_id ??
        apartment?.property?.id;

      return (
        String(apartmentPropertyId) ===
        String(propertyId)
      );
    });
  }, [normalizedApartments, propertyId]);

  /*
  |--------------------------------------------------------------------------
  | STATUS OPTIONS
  |--------------------------------------------------------------------------
  */

  const statusOptions = [
    {
      value: "",
      label: "All Statuses",
    },
    {
      value: "vacant",
      label: "Vacant",
    },
    {
      value: "occupied",
      label: "Occupied",
    },
    {
      value: "reserved",
      label: "Reserved",
    },
    {
      value: "maintenance",
      label: "Maintenance",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | HANDLE FILTER CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (field, value) => {
    if (typeof onFilterChange !== "function") {
      return;
    }

    /*
     * Change selected filter.
     */
    onFilterChange(field, value);

    /*
     * When property changes, reset apartment.
     */
    if (field === "property_id") {
      onFilterChange("apartment_id", "");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  const handleReset = () => {
    if (typeof onReset === "function") {
      onReset();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ACTIVE FILTER COUNT
  |--------------------------------------------------------------------------
  */

  const activeFilterCount = [
    search,
    status,
    propertyId,
    apartmentId,
    floor,
    type,
  ].filter((value) => value !== "" && value !== null)
    .length;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <SlidersHorizontal className="h-5 w-5 text-gray-700" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Unit Filters
              </h3>

              {activeFilterCount > 0 && (
                <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Search and filter your units
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
        >
          <RotateCcw className="h-4 w-4" />

          Reset
        </button>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Search */}
        <div className="xl:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-gray-700">
            Search
          </label>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                handleChange(
                  "search",
                  event.target.value
                )
              }
              placeholder="Search unit number or name..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </div>
        </div>

        {/* Property */}
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-700">
            <Building2 className="h-3.5 w-3.5" />

            Property
          </label>

          <select
            value={propertyId}
            onChange={(event) =>
              handleChange(
                "property_id",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          >
            <option value="">
              All Properties
            </option>

            {normalizedProperties.map((property) => (
              <option
                key={property.id}
                value={property.id}
              >
                {property.name ||
                  property.title ||
                  property.property_name ||
                  `Property #${property.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* Apartment */}
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-700">
            <Home className="h-3.5 w-3.5" />

            Apartment
          </label>

          <select
            value={apartmentId}
            onChange={(event) =>
              handleChange(
                "apartment_id",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">
              All Apartments
            </option>

            {availableApartments.map((apartment) => (
              <option
                key={apartment.id}
                value={apartment.id}
              >
                {apartment.name ||
                  apartment.title ||
                  apartment.apartment_name ||
                  `Apartment #${apartment.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">
            Status
          </label>

          <select
            value={status}
            onChange={(event) =>
              handleChange(
                "status",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          >
            {statusOptions.map((option) => (
              <option
                key={option.value || "all"}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Floor */}
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-700">
            <Layers3 className="h-3.5 w-3.5" />

            Floor
          </label>

          <input
            type="number"
            min="0"
            value={floor}
            onChange={(event) =>
              handleChange(
                "floor",
                event.target.value
              )
            }
            placeholder="Any floor"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
        </div>

        {/* Unit Type */}
        {normalizedUnitTypes.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Unit Type
            </label>

            <select
              value={type}
              onChange={(event) =>
                handleChange(
                  "type",
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            >
              <option value="">
                All Types
              </option>

              {normalizedUnitTypes.map(
                (option, index) => {
                  const value =
                    typeof option === "object"
                      ? option?.value
                      : option;

                  const label =
                    typeof option === "object"
                      ? option?.label
                      : option;

                  return (
                    <option
                      key={`${value}-${index}`}
                      value={value}
                    >
                      {label}
                    </option>
                  );
                }
              )}
            </select>
          </div>
        )}
      </div>

      {/* Active Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">
          Active filters:
        </span>

        {search && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
            Search: {search}
          </span>
        )}

        {propertyId && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
            Property
          </span>
        )}

        {apartmentId && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
            Apartment
          </span>
        )}

        {status && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize text-gray-700">
            {status}
          </span>
        )}

        {floor !== "" && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
            Floor {floor}
          </span>
        )}

        {type && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize text-gray-700">
            {type}
          </span>
        )}

        {activeFilterCount === 0 && (
          <span className="text-xs text-gray-400">
            None
          </span>
        )}
      </div>
    </div>
  );
};

export default UnitFilters;

