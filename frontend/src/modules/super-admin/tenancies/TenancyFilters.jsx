import {
  CalendarDays,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

/**
 * TenancyFilters
 *
 * Reusable filters for the tenancy listing.
 *
 * Props:
 * - filters
 * - onChange
 * - onReset
 * - onApply
 * - loading
 * - properties
 * - apartments
 * - units
 * - tenants
 * - showAdvanced
 */
const TenancyFilters = ({
  filters = {},
  onChange,
  onReset,
  onApply,
  loading = false,

  properties = [],
  apartments = [],
  units = [],
  tenants = [],

  showAdvanced = true,
}) => {
  /*
  |--------------------------------------------------------------------------
  | NORMALIZE FILTERS
  |--------------------------------------------------------------------------
  */

  const currentFilters = {
    search: "",
    status: "",
    property_id: "",
    apartment_id: "",
    unit_id: "",
    tenant_id: "",
    payment_frequency: "",
    start_date: "",
    end_date: "",
    per_page: 15,
    sort_by: "created_at",
    sort_direction: "desc",
    ...filters,
  };

  /*
  |--------------------------------------------------------------------------
  | HANDLE CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (field, value) => {
    if (typeof onChange !== "function") {
      return;
    }

    /*
     * Changing a parent filter should clear dependent filters.
     */
    if (field === "property_id") {
      onChange({
        ...currentFilters,
        property_id: value,
        apartment_id: "",
        unit_id: "",
      });

      return;
    }

    if (field === "apartment_id") {
      onChange({
        ...currentFilters,
        apartment_id: value,
        unit_id: "",
      });

      return;
    }

    onChange({
      ...currentFilters,
      [field]: value,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | HANDLE RESET
  |--------------------------------------------------------------------------
  */

  const handleReset = () => {
    if (typeof onReset === "function") {
      onReset();
      return;
    }

    if (typeof onChange === "function") {
      onChange({
        search: "",
        status: "",
        property_id: "",
        apartment_id: "",
        unit_id: "",
        tenant_id: "",
        payment_frequency: "",
        start_date: "",
        end_date: "",
        per_page: 15,
        sort_by: "created_at",
        sort_direction: "desc",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | HANDLE APPLY
  |--------------------------------------------------------------------------
  */

  const handleApply = () => {
    if (typeof onApply === "function") {
      onApply(currentFilters);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ACTIVE FILTER COUNT
  |--------------------------------------------------------------------------
  */

  const activeFilterCount = [
    currentFilters.status,
    currentFilters.property_id,
    currentFilters.apartment_id,
    currentFilters.unit_id,
    currentFilters.tenant_id,
    currentFilters.payment_frequency,
    currentFilters.start_date,
    currentFilters.end_date,
  ].filter(Boolean).length;

  /*
  |--------------------------------------------------------------------------
  | FILTERED APARTMENTS
  |--------------------------------------------------------------------------
  */

  const filteredApartments = Array.isArray(apartments)
    ? apartments.filter((apartment) => {
      if (!currentFilters.property_id) {
        return true;
      }

      return (
        String(apartment.property_id) ===
        String(currentFilters.property_id)
      );
    })
    : [];

  /*
  |--------------------------------------------------------------------------
  | FILTERED UNITS
  |--------------------------------------------------------------------------
  */

  const filteredUnits = Array.isArray(units)
    ? units.filter((unit) => {
      if (currentFilters.apartment_id) {
        return (
          String(unit.apartment_id) ===
          String(currentFilters.apartment_id)
        );
      }

      if (currentFilters.property_id) {
        return (
          String(unit.property_id) ===
          String(currentFilters.property_id)
        );
      }

      return true;
    })
    : [];

  /*
  |--------------------------------------------------------------------------
  | SAFE ARRAYS
  |--------------------------------------------------------------------------
  */

  const propertyOptions = Array.isArray(properties)
    ? properties
    : [];

  const apartmentOptions = filteredApartments;

  const unitOptions = filteredUnits;

  const tenantOptions = Array.isArray(tenants)
    ? tenants
    : [];

  return (
    <div
      className="
        mb-6
        rounded-xl
        border
        border-gray-200
        bg-white
        shadow-sm
        dark:border-gray-700
        dark:bg-gray-800
      "
    >
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div
        className="
          flex
          flex-col
          gap-3
          border-b
          border-gray-200
          px-5
          py-4
          sm:flex-row
          sm:items-center
          sm:justify-between
          dark:border-gray-700
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              bg-indigo-50
              text-indigo-600
              dark:bg-indigo-950/40
              dark:text-indigo-400
            "
          >
            <Filter size={18} />
          </div>

          <div>
            <h2
              className="
                text-sm
                font-semibold
                text-gray-900
                dark:text-white
              "
            >
              Filter Tenancies
            </h2>

            <p
              className="
                text-xs
                text-gray-500
                dark:text-gray-400
              "
            >
              Search and filter tenancy records.
            </p>
          </div>

          {activeFilterCount > 0 && (
            <span
              className="
                inline-flex
                min-w-6
                items-center
                justify-center
                rounded-full
                bg-indigo-100
                px-2
                py-1
                text-xs
                font-semibold
                text-indigo-700
                dark:bg-indigo-950/60
                dark:text-indigo-300
              "
            >
              {activeFilterCount}
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="
              inline-flex
              items-center
              gap-2
              self-start
              text-sm
              font-medium
              text-gray-500
              transition
              hover:text-red-600
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:self-auto
              dark:text-gray-400
              dark:hover:text-red-400
            "
          >
            <RotateCcw size={15} />

            Reset filters
          </button>
        )}
      </div>

      {/* ================================================================
          FILTER CONTENT
      ================================================================ */}

      <div className="p-5">
        {/* ============================================================
            SEARCH
        ============================================================ */}

        <div className="mb-5">
          <label
            htmlFor="tenancy-search"
            className="
              mb-2
              block
              text-sm
              font-medium
              text-gray-700
              dark:text-gray-300
            "
          >
            Search
          </label>

          <div className="relative">
            <Search
              size={18}
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-gray-400
              "
            />

            <input
              id="tenancy-search"
              type="search"
              value={currentFilters.search ?? ""}
              onChange={(event) =>
                handleChange(
                  "search",
                  event.target.value
                )
              }
              placeholder="Search tenancy number, tenant name, email, phone..."
              disabled={loading}
              className="
                h-11
                w-full
                rounded-lg
                border
                border-gray-300
                bg-white
                pl-10
                pr-10
                text-sm
                text-gray-900
                outline-none
                transition
                placeholder:text-gray-400
                focus:border-indigo-500
                focus:ring-2
                focus:ring-indigo-500/20
                disabled:cursor-not-allowed
                disabled:bg-gray-100
                dark:border-gray-600
                dark:bg-gray-900
                dark:text-white
                dark:placeholder:text-gray-500
                dark:disabled:bg-gray-800
              "
            />

            {currentFilters.search && (
              <button
                type="button"
                onClick={() =>
                  handleChange("search", "")
                }
                disabled={loading}
                aria-label="Clear search"
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                  transition
                  hover:text-gray-700
                  disabled:opacity-50
                  dark:hover:text-white
                "
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>

        {/* ============================================================
            BASIC FILTERS
        ============================================================ */}

        <div
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          {/* STATUS */}
          <FilterSelect
            label="Status"
            value={currentFilters.status}
            onChange={(value) =>
              handleChange("status", value)
            }
            disabled={loading}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
            <option value="cancelled">Cancelled</option>
            <option value="inactive">Inactive</option>
          </FilterSelect>

          {/* PROPERTY */}
          <FilterSelect
            label="Property"
            value={currentFilters.property_id}
            onChange={(value) =>
              handleChange("property_id", value)
            }
            disabled={loading}
          >
            <option value="">All properties</option>

            {propertyOptions.map((property) => (
              <option
                key={property.id}
                value={property.id}
              >
                {property.title ||
                  property.name ||
                  property.property_code ||
                  `Property #${property.id}`}
              </option>
            ))}
          </FilterSelect>

          {/* APARTMENT */}
          <FilterSelect
            label="Apartment"
            value={currentFilters.apartment_id}
            onChange={(value) =>
              handleChange("apartment_id", value)
            }
            disabled={loading}
          >
            <option value="">All apartments</option>

            {apartmentOptions.map((apartment) => (
              <option
                key={apartment.id}
                value={apartment.id}
              >
                {apartment.name ||
                  apartment.full_name ||
                  apartment.apartment_number ||
                  `Apartment #${apartment.id}`}
              </option>
            ))}
          </FilterSelect>

          {/* UNIT */}
          <FilterSelect
            label="Unit"
            value={currentFilters.unit_id}
            onChange={(value) =>
              handleChange("unit_id", value)
            }
            disabled={loading}
          >
            <option value="">All units</option>

            {unitOptions.map((unit) => (
              <option
                key={unit.id}
                value={unit.id}
              >
                {unit.unit_number ||
                  unit.name ||
                  `Unit #${unit.id}`}
              </option>
            ))}
          </FilterSelect>
        </div>

        {/* ============================================================
            ADVANCED FILTERS
        ============================================================ */}

        {showAdvanced && (
          <div
            className="
              mt-5
              border-t
              border-gray-200
              pt-5
              dark:border-gray-700
            "
          >
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal
                size={16}
                className="text-gray-500 dark:text-gray-400"
              />

              <h3
                className="
                  text-sm
                  font-medium
                  text-gray-700
                  dark:text-gray-300
                "
              >
                Advanced Filters
              </h3>
            </div>

            <div
              className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
                lg:grid-cols-4
              "
            >
              {/* TENANT */}
              <FilterSelect
                label="Tenant"
                value={currentFilters.tenant_id}
                onChange={(value) =>
                  handleChange("tenant_id", value)
                }
                disabled={loading}
              >
                <option value="">All tenants</option>

                {tenantOptions.map((tenant) => (
                  <option
                    key={tenant.id}
                    value={tenant.id}
                  >
                    {tenant.full_name ||
                      [
                        tenant.first_name,
                        tenant.last_name,
                        tenant.other_names,
                      ]
                        .filter(Boolean)
                        .join(" ") ||
                      tenant.tenant_number ||
                      `Tenant #${tenant.id}`}
                  </option>
                ))}
              </FilterSelect>

              {/* PAYMENT FREQUENCY */}
              <FilterSelect
                label="Payment Frequency"
                value={
                  currentFilters.payment_frequency
                }
                onChange={(value) =>
                  handleChange(
                    "payment_frequency",
                    value
                  )
                }
                disabled={loading}
              >
                <option value="">
                  All frequencies
                </option>

                <option value="monthly">
                  Monthly
                </option>

                <option value="quarterly">
                  Quarterly
                </option>

                <option value="biannually">
                  Biannually
                </option>

                <option value="annually">
                  Annually
                </option>
              </FilterSelect>

              {/* START DATE */}
              <DateFilter
                label="Start Date"
                value={currentFilters.start_date}
                onChange={(value) =>
                  handleChange(
                    "start_date",
                    value
                  )
                }
                disabled={loading}
              />

              {/* END DATE */}
              <DateFilter
                label="End Date"
                value={currentFilters.end_date}
                onChange={(value) =>
                  handleChange(
                    "end_date",
                    value
                  )
                }
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* ============================================================
            SORTING / PAGINATION
        ============================================================ */}

        <div
          className="
            mt-5
            border-t
            border-gray-200
            pt-5
            dark:border-gray-700
          "
        >
          <div
            className="
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            {/* SORT BY */}
            <FilterSelect
              label="Sort By"
              value={currentFilters.sort_by}
              onChange={(value) =>
                handleChange("sort_by", value)
              }
              disabled={loading}
            >
              <option value="created_at">
                Created Date
              </option>

              <option value="start_date">
                Start Date
              </option>

              <option value="end_date">
                End Date
              </option>

              <option value="rent_amount">
                Rent Amount
              </option>

              <option value="status">
                Status
              </option>

              <option value="tenancy_number">
                Tenancy Number
              </option>
            </FilterSelect>

            {/* SORT DIRECTION */}
            <FilterSelect
              label="Sort Direction"
              value={currentFilters.sort_direction}
              onChange={(value) =>
                handleChange(
                  "sort_direction",
                  value
                )
              }
              disabled={loading}
            >
              <option value="desc">
                Descending
              </option>

              <option value="asc">
                Ascending
              </option>
            </FilterSelect>

            {/* PER PAGE */}
            <FilterSelect
              label="Per Page"
              value={currentFilters.per_page}
              onChange={(value) =>
                handleChange(
                  "per_page",
                  Number(value)
                )
              }
              disabled={loading}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </FilterSelect>

            {/* APPLY */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleApply}
                disabled={loading}
                className="
                  inline-flex
                  h-11
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-indigo-600
                  px-4
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-indigo-700
                  focus:outline-none
                  focus:ring-2
                  focus:ring-indigo-500
                  focus:ring-offset-2
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:bg-indigo-500
                  dark:hover:bg-indigo-600
                "
              >
                {loading ? (
                  <>
                    <span
                      className="
                        h-4
                        w-4
                        animate-spin
                        rounded-full
                        border-2
                        border-white/30
                        border-t-white
                      "
                    />

                    Applying...
                  </>
                ) : (
                  <>
                    <Filter size={17} />

                    Apply Filters
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| FILTER SELECT
|--------------------------------------------------------------------------
*/

const FilterSelect = ({
  label,
  value,
  onChange,
  disabled = false,
  children,
}) => {
  const id = `tenancy-filter-${label
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  return (
    <div>
      <label
        htmlFor={id}
        className="
          mb-2
          block
          text-sm
          font-medium
          text-gray-700
          dark:text-gray-300
        "
      >
        {label}
      </label>

      <select
        id={id}
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
        disabled={disabled}
        className="
          h-11
          w-full
          rounded-lg
          border
          border-gray-300
          bg-white
          px-3
          text-sm
          text-gray-900
          outline-none
          transition
          focus:border-indigo-500
          focus:ring-2
          focus:ring-indigo-500/20
          disabled:cursor-not-allowed
          disabled:bg-gray-100
          dark:border-gray-600
          dark:bg-gray-900
          dark:text-white
          dark:disabled:bg-gray-800
        "
      >
        {children}
      </select>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| DATE FILTER
|--------------------------------------------------------------------------
*/

const DateFilter = ({
  label,
  value,
  onChange,
  disabled = false,
}) => {
  const id = `tenancy-date-${label
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  return (
    <div>
      <label
        htmlFor={id}
        className="
          mb-2
          block
          text-sm
          font-medium
          text-gray-700
          dark:text-gray-300
        "
      >
        {label}
      </label>

      <div className="relative">
        <CalendarDays
          size={17}
          className="
            pointer-events-none
            absolute
            left-3
            top-1/2
            -translate-y-1/2
            text-gray-400
          "
        />

        <input
          id={id}
          type="date"
          value={value ?? ""}
          onChange={(event) =>
            onChange(event.target.value)
          }
          disabled={disabled}
          className="
            h-11
            w-full
            rounded-lg
            border
            border-gray-300
            bg-white
            pl-10
            pr-3
            text-sm
            text-gray-900
            outline-none
            transition
            focus:border-indigo-500
            focus:ring-2
            focus:ring-indigo-500/20
            disabled:cursor-not-allowed
            disabled:bg-gray-100
            dark:border-gray-600
            dark:bg-gray-900
            dark:text-white
            dark:disabled:bg-gray-800
          "
        />
      </div>
    </div>
  );
};

export default TenancyFilters;