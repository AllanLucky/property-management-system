import {
  CalendarDays,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_FILTERS = {
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
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely convert a value into a string.
 */
const safeText = (value, fallback = "") => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (typeof value === "object") {
    return fallback;
  }

  return String(value);
};

/**
 * Get the first valid primitive value.
 */
const firstText = (...values) => {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      typeof value !== "object"
    ) {
      return String(value);
    }
  }

  return "";
};

/**
 * Safely normalize an ID.
 */
const normalizeId = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (typeof value === "object") {
    return "";
  }

  return String(value);
};

/**
 * Build a readable status label.
 */
const formatStatusLabel = (value) => {
  const text = firstText(value);

  if (!text) {
    return "";
  }

  return text
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

/*
|--------------------------------------------------------------------------
| Property Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get property ID.
 */
const getPropertyId = (property) => {
  return normalizeId(
    property?.id ??
      property?.property_id ??
      property?.property?.id
  );
};

/**
 * Get property name.
 */
const getPropertyName = (property) => {
  return (
    firstText(
      property?.title,
      property?.name,
      property?.property_name,
      property?.property_title,
      property?.property_code,
      property?.property_number
    ) ||
    (property?.id
      ? `Property #${property.id}`
      : "Property")
  );
};

/*
|--------------------------------------------------------------------------
| Apartment Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get apartment ID.
 */
const getApartmentId = (apartment) => {
  return normalizeId(
    apartment?.id ??
      apartment?.apartment_id
  );
};

/**
 * Get apartment property ID.
 */
const getApartmentPropertyId = (apartment) => {
  return normalizeId(
    apartment?.property_id ??
      apartment?.property?.id ??
      apartment?.property?.property_id
  );
};

/**
 * Get apartment name.
 */
const getApartmentName = (apartment) => {
  return (
    firstText(
      apartment?.full_name,
      apartment?.name,
      apartment?.apartment_name,
      apartment?.apartment_number,
      apartment?.number,
      apartment?.code
    ) ||
    (apartment?.id
      ? `Apartment #${apartment.id}`
      : "Apartment")
  );
};

/*
|--------------------------------------------------------------------------
| Unit Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get unit ID.
 */
const getUnitId = (unit) => {
  return normalizeId(
    unit?.id ??
      unit?.unit_id
  );
};

/**
 * Get unit apartment ID.
 */
const getUnitApartmentId = (unit) => {
  return normalizeId(
    unit?.apartment_id ??
      unit?.apartment?.id ??
      unit?.apartment?.apartment_id
  );
};

/**
 * Get unit property ID.
 */
const getUnitPropertyId = (unit) => {
  return normalizeId(
    unit?.property_id ??
      unit?.property?.id ??
      unit?.apartment?.property_id ??
      unit?.apartment?.property?.id
  );
};

/**
 * Get unit name.
 */
const getUnitName = (unit) => {
  return (
    firstText(
      unit?.unit_number,
      unit?.name,
      unit?.unit_name,
      unit?.number,
      unit?.code
    ) ||
    (unit?.id
      ? `Unit #${unit.id}`
      : "Unit")
  );
};

/*
|--------------------------------------------------------------------------
| Tenant Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get tenant ID.
 */
const getTenantId = (tenant) => {
  return normalizeId(
    tenant?.id ??
      tenant?.tenant_id
  );
};

/**
 * Get tenant display name.
 */
const getTenantName = (tenant) => {
  const directName = firstText(
    tenant?.full_name,
    tenant?.name,
    tenant?.tenant_name
  );

  if (directName) {
    return directName;
  }

  const fullName = [
    tenant?.first_name,
    tenant?.other_names,
    tenant?.middle_name,
    tenant?.last_name,
  ]
    .filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== "" &&
        typeof value !== "object"
    )
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  return (
    firstText(
      tenant?.tenant_number,
      tenant?.number
    ) ||
    (tenant?.id
      ? `Tenant #${tenant.id}`
      : "Tenant")
  );
};

/*
|--------------------------------------------------------------------------
| Filter Normalization
|--------------------------------------------------------------------------
*/

const normalizeFilters = (filters) => {
  const source =
    filters &&
    typeof filters === "object"
      ? filters
      : {};

  return {
    ...DEFAULT_FILTERS,

    ...source,

    search: safeText(
      source.search,
      ""
    ),

    status: safeText(
      source.status,
      ""
    ),

    property_id: normalizeId(
      source.property_id
    ),

    apartment_id: normalizeId(
      source.apartment_id
    ),

    unit_id: normalizeId(
      source.unit_id
    ),

    tenant_id: normalizeId(
      source.tenant_id
    ),

    payment_frequency: safeText(
      source.payment_frequency,
      ""
    ),

    start_date: safeText(
      source.start_date,
      ""
    ),

    end_date: safeText(
      source.end_date,
      ""
    ),

    per_page:
      Number(source.per_page) > 0
        ? Number(source.per_page)
        : DEFAULT_FILTERS.per_page,

    sort_by:
      safeText(
        source.sort_by,
        DEFAULT_FILTERS.sort_by
      ) || DEFAULT_FILTERS.sort_by,

    sort_direction:
      safeText(
        source.sort_direction,
        DEFAULT_FILTERS.sort_direction
      ) || DEFAULT_FILTERS.sort_direction,
  };
};

/*
|--------------------------------------------------------------------------
| Tenancy Filters
|--------------------------------------------------------------------------
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
  | Normalize Current Filters
  |--------------------------------------------------------------------------
  */

  const currentFilters =
    normalizeFilters(filters);

  /*
  |--------------------------------------------------------------------------
  | Handle Change
  |--------------------------------------------------------------------------
  */

  const handleChange = (
    field,
    value
  ) => {
    if (
      typeof onChange !== "function"
    ) {
      return;
    }

    const normalizedValue =
      field === "per_page"
        ? Number(value) || 15
        : safeText(value, "");

    /*
     * Property controls apartment and unit.
     */
    if (
      field === "property_id"
    ) {
      onChange({
        ...currentFilters,
        property_id:
          normalizedValue,
        apartment_id: "",
        unit_id: "",
      });

      return;
    }

    /*
     * Apartment controls unit.
     */
    if (
      field === "apartment_id"
    ) {
      onChange({
        ...currentFilters,
        apartment_id:
          normalizedValue,
        unit_id: "",
      });

      return;
    }

    /*
     * Changing page size should normally
     * reset pagination to page one.
     */
    if (
      field === "per_page"
    ) {
      onChange({
        ...currentFilters,
        per_page:
          Number(normalizedValue) ||
          15,
        page: 1,
      });

      return;
    }

    onChange({
      ...currentFilters,
      [field]: normalizedValue,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Handle Reset
  |--------------------------------------------------------------------------
  */

  const handleReset = () => {
    if (
      typeof onReset === "function"
    ) {
      onReset();
      return;
    }

    if (
      typeof onChange === "function"
    ) {
      onChange({
        ...DEFAULT_FILTERS,
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Handle Apply
  |--------------------------------------------------------------------------
  */

  const handleApply = () => {
    if (
      typeof onApply !== "function"
    ) {
      return;
    }

    /*
     * Do not send UI-only or invalid values.
     */
    const payload = {
      ...currentFilters,
      search:
        currentFilters.search.trim(),
      status:
        currentFilters.status || "",
      property_id:
        currentFilters.property_id || "",
      apartment_id:
        currentFilters.apartment_id || "",
      unit_id:
        currentFilters.unit_id || "",
      tenant_id:
        currentFilters.tenant_id || "",
      payment_frequency:
        currentFilters.payment_frequency ||
        "",
      start_date:
        currentFilters.start_date || "",
      end_date:
        currentFilters.end_date || "",
      per_page:
        Number(currentFilters.per_page) ||
        15,
      sort_by:
        currentFilters.sort_by ||
        "created_at",
      sort_direction:
        currentFilters.sort_direction ||
        "desc",
    };

    onApply(payload);
  };

  /*
  |--------------------------------------------------------------------------
  | Active Filter Count
  |--------------------------------------------------------------------------
  */

  const activeFilterCount = [
    currentFilters.search,
    currentFilters.status,
    currentFilters.property_id,
    currentFilters.apartment_id,
    currentFilters.unit_id,
    currentFilters.tenant_id,
    currentFilters.payment_frequency,
    currentFilters.start_date,
    currentFilters.end_date,
  ].filter(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
  ).length;

  /*
  |--------------------------------------------------------------------------
  | Safe Arrays
  |--------------------------------------------------------------------------
  */

  const propertyOptions =
    Array.isArray(properties)
      ? properties.filter(
          (item) =>
            item &&
            typeof item === "object"
        )
      : [];

  const apartmentOptions =
    Array.isArray(apartments)
      ? apartments.filter(
          (item) =>
            item &&
            typeof item === "object"
        )
      : [];

  const unitOptions =
    Array.isArray(units)
      ? units.filter(
          (item) =>
            item &&
            typeof item === "object"
        )
      : [];

  const tenantOptions =
    Array.isArray(tenants)
      ? tenants.filter(
          (item) =>
            item &&
            typeof item === "object"
        )
      : [];

  /*
  |--------------------------------------------------------------------------
  | Filter Apartments
  |--------------------------------------------------------------------------
  */

  const filteredApartments =
    apartmentOptions.filter(
      (apartment) => {
        if (
          !currentFilters.property_id
        ) {
          return true;
        }

        return (
          getApartmentPropertyId(
            apartment
          ) ===
          String(
            currentFilters.property_id
          )
        );
      }
    );

  /*
  |--------------------------------------------------------------------------
  | Filter Units
  |--------------------------------------------------------------------------
  */

  const filteredUnits =
    unitOptions.filter((unit) => {
      if (
        currentFilters.apartment_id
      ) {
        return (
          getUnitApartmentId(unit) ===
          String(
            currentFilters.apartment_id
          )
        );
      }

      if (
        currentFilters.property_id
      ) {
        return (
          getUnitPropertyId(unit) ===
          String(
            currentFilters.property_id
          )
        );
      }

      return true;
    });

  /*
  |--------------------------------------------------------------------------
  | Current Selected Dependencies
  |--------------------------------------------------------------------------
  |
  | If the selected apartment/unit no longer exists after filtering,
  | the select still displays its current value instead of unexpectedly
  | changing state during render.
  |
  */

  const selectedApartment =
    filteredApartments.find(
      (apartment) =>
        getApartmentId(apartment) ===
        String(
          currentFilters.apartment_id
        )
    );

  const selectedUnit =
    filteredUnits.find(
      (unit) =>
        getUnitId(unit) ===
        String(
          currentFilters.unit_id
        )
    );

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="
        mb-6
        overflow-hidden
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
              shrink-0
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

          <div className="min-w-0">
            <div className="flex items-center gap-2">
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

            <p
              className="
                text-xs
                text-gray-500
                dark:text-gray-400
              "
            >
              Search and filter tenancy
              records.
            </p>
          </div>
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
              value={
                currentFilters.search
              }
              onChange={(event) =>
                handleChange(
                  "search",
                  event.target.value
                )
              }
              placeholder="
                Search tenancy number, tenant name,
                email, phone...
              "
              disabled={loading}
              autoComplete="off"
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
                  handleChange(
                    "search",
                    ""
                  )
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
                  disabled:cursor-not-allowed
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
            value={
              currentFilters.status
            }
            onChange={(value) =>
              handleChange(
                "status",
                value
              )
            }
            disabled={loading}
          >
            <option value="">
              All statuses
            </option>

            <option value="active">
              Active
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="expired">
              Expired
            </option>

            <option value="terminated">
              Terminated
            </option>

            <option value="cancelled">
              Cancelled
            </option>

            <option value="canceled">
              Canceled
            </option>

            <option value="inactive">
              Inactive
            </option>

            <option value="renewed">
              Renewed
            </option>

            <option value="draft">
              Draft
            </option>
          </FilterSelect>

          {/* PROPERTY */}

          <FilterSelect
            label="Property"
            value={
              currentFilters.property_id
            }
            onChange={(value) =>
              handleChange(
                "property_id",
                value
              )
            }
            disabled={loading}
          >
            <option value="">
              All properties
            </option>

            {propertyOptions.map(
              (property) => {
                const id =
                  getPropertyId(
                    property
                  );

                if (!id) {
                  return null;
                }

                return (
                  <option
                    key={id}
                    value={id}
                  >
                    {getPropertyName(
                      property
                    )}
                  </option>
                );
              }
            )}
          </FilterSelect>

          {/* APARTMENT */}

          <FilterSelect
            label="Apartment"
            value={
              currentFilters.apartment_id
            }
            onChange={(value) =>
              handleChange(
                "apartment_id",
                value
              )
            }
            disabled={
              loading ||
              Boolean(
                currentFilters.property_id
              ) &&
                filteredApartments.length ===
                  0
            }
          >
            <option value="">
              All apartments
            </option>

            {filteredApartments.map(
              (apartment) => {
                const id =
                  getApartmentId(
                    apartment
                  );

                if (!id) {
                  return null;
                }

                return (
                  <option
                    key={id}
                    value={id}
                  >
                    {getApartmentName(
                      apartment
                    )}
                  </option>
                );
              }
            )}

            {currentFilters.apartment_id &&
              !selectedApartment && (
                <option
                  value={
                    currentFilters.apartment_id
                  }
                >
                  Selected apartment
                </option>
              )}
          </FilterSelect>

          {/* UNIT */}

          <FilterSelect
            label="Unit"
            value={
              currentFilters.unit_id
            }
            onChange={(value) =>
              handleChange(
                "unit_id",
                value
              )
            }
            disabled={
              loading ||
              Boolean(
                currentFilters.apartment_id ||
                currentFilters.property_id
              ) &&
                filteredUnits.length === 0
            }
          >
            <option value="">
              All units
            </option>

            {filteredUnits.map(
              (unit) => {
                const id =
                  getUnitId(unit);

                if (!id) {
                  return null;
                }

                return (
                  <option
                    key={id}
                    value={id}
                  >
                    {getUnitName(unit)}
                  </option>
                );
              }
            )}

            {currentFilters.unit_id &&
              !selectedUnit && (
                <option
                  value={
                    currentFilters.unit_id
                  }
                >
                  Selected unit
                </option>
              )}
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
                className="
                  text-gray-500
                  dark:text-gray-400
                "
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
                value={
                  currentFilters.tenant_id
                }
                onChange={(value) =>
                  handleChange(
                    "tenant_id",
                    value
                  )
                }
                disabled={loading}
              >
                <option value="">
                  All tenants
                </option>

                {tenantOptions.map(
                  (tenant) => {
                    const id =
                      getTenantId(
                        tenant
                      );

                    if (!id) {
                      return null;
                    }

                    return (
                      <option
                        key={id}
                        value={id}
                      >
                        {getTenantName(
                          tenant
                        )}
                      </option>
                    );
                  }
                )}
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
                value={
                  currentFilters.start_date
                }
                onChange={(value) =>
                  handleChange(
                    "start_date",
                    value
                  )
                }
                disabled={loading}
                max={
                  currentFilters.end_date ||
                  undefined
                }
              />

              {/* END DATE */}

              <DateFilter
                label="End Date"
                value={
                  currentFilters.end_date
                }
                onChange={(value) =>
                  handleChange(
                    "end_date",
                    value
                  )
                }
                disabled={loading}
                min={
                  currentFilters.start_date ||
                  undefined
                }
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
              value={
                currentFilters.sort_by
              }
              onChange={(value) =>
                handleChange(
                  "sort_by",
                  value
                )
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
              value={
                currentFilters.sort_direction
              }
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
              value={
                currentFilters.per_page
              }
              onChange={(value) =>
                handleChange(
                  "per_page",
                  value
                )
              }
              disabled={loading}
            >
              <option value="10">
                10
              </option>

              <option value="15">
                15
              </option>

              <option value="25">
                25
              </option>

              <option value="50">
                50
              </option>

              <option value="100">
                100
              </option>
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
| Filter Select
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
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

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
        value={
          value === null ||
          value === undefined
            ? ""
            : String(value)
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
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
| Date Filter
|--------------------------------------------------------------------------
*/

const DateFilter = ({
  label,
  value,
  onChange,
  disabled = false,
  min,
  max,
}) => {
  const id = `tenancy-date-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

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
          min={min}
          max={max}
          onChange={(event) =>
            onChange(
              event.target.value
            )
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