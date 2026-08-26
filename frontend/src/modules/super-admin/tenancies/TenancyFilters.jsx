import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronDown,
  Filter,
  Loader2,
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

const SEARCH_DEBOUNCE_MS = 350;

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

  if (
    typeof value === "object" ||
    typeof value === "boolean"
  ) {
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
      typeof value !== "object" &&
      typeof value !== "boolean"
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

  if (
    typeof value === "object" ||
    typeof value === "boolean"
  ) {
    return "";
  }

  return String(value);
};

/**
 * Normalize filter direction.
 *
 * Supports both:
 * - sort_direction
 * - sort_order
 */
const normalizeSortDirection = (source) => {
  const value =
    source?.sort_direction ??
    source?.sort_order ??
    DEFAULT_FILTERS.sort_direction;

  const direction = safeText(
    value,
    DEFAULT_FILTERS.sort_direction
  ).toLowerCase();

  return direction === "asc"
    ? "asc"
    : "desc";
};

/*
|--------------------------------------------------------------------------
| Property Helpers
|--------------------------------------------------------------------------
*/

const getPropertyId = (property) => {
  return normalizeId(
    property?.id ??
    property?.property_id ??
    property?.property?.id
  );
};

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

const getApartmentId = (apartment) => {
  return normalizeId(
    apartment?.id ??
    apartment?.apartment_id
  );
};

const getApartmentPropertyId = (apartment) => {
  return normalizeId(
    apartment?.property_id ??
    apartment?.property?.id ??
    apartment?.property?.property_id
  );
};

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

const getUnitId = (unit) => {
  return normalizeId(
    unit?.id ??
    unit?.unit_id
  );
};

const getUnitApartmentId = (unit) => {
  return normalizeId(
    unit?.apartment_id ??
    unit?.apartment?.id ??
    unit?.apartment?.apartment_id
  );
};

const getUnitPropertyId = (unit) => {
  return normalizeId(
    unit?.property_id ??
    unit?.property?.id ??
    unit?.apartment?.property_id ??
    unit?.apartment?.property?.id
  );
};

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

const getTenantId = (tenant) => {
  return normalizeId(
    tenant?.id ??
    tenant?.tenant_id
  );
};

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
        typeof value !== "object" &&
        typeof value !== "boolean"
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
      normalizeSortDirection(source),
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
  | Local Search State
  |--------------------------------------------------------------------------
  |
  | Search is kept locally while the user is typing.
  | This prevents an API request for every single keystroke.
  |
  */

  const [
    searchValue,
    setSearchValue,
  ] = useState(
    currentFilters.search
  );

  const searchTimerRef =
    useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Sync Search With Redux
  |--------------------------------------------------------------------------
  |
  | This is important when:
  | - Filters are reset
  | - Pagination changes
  | - Another component changes the filters
  |
  */

  useEffect(() => {
    setSearchValue(
      currentFilters.search
    );
  }, [currentFilters.search]);

  /*
  |--------------------------------------------------------------------------
  | Cleanup Search Timer
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(
          searchTimerRef.current
        );
      }
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Apply Filters Safely
  |--------------------------------------------------------------------------
  */

  const emitChange = (
    nextFilters
  ) => {
    if (
      typeof onChange !== "function"
    ) {
      return;
    }

    onChange({
      ...nextFilters,
      page: 1,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Search Request
  |--------------------------------------------------------------------------
  */

  const executeSearch = (
    value
  ) => {
    const normalizedSearch =
      safeText(value, "").trim();

    /*
     * Keep local search immediately synchronized.
     */
    setSearchValue(
      safeText(value, "")
    );

    /*
     * Cancel previous pending search.
     */
    if (searchTimerRef.current) {
      clearTimeout(
        searchTimerRef.current
      );

      searchTimerRef.current = null;
    }

    /*
     * Immediately update Redux/API.
     */
    emitChange({
      ...currentFilters,
      search:
        normalizedSearch,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Debounced Search
  |--------------------------------------------------------------------------
  */

  const handleSearchChange = (
    value
  ) => {
    setSearchValue(value);

    if (searchTimerRef.current) {
      clearTimeout(
        searchTimerRef.current
      );
    }

    searchTimerRef.current =
      setTimeout(() => {
        const normalizedSearch =
          safeText(
            value,
            ""
          ).trim();

        emitChange({
          ...currentFilters,
          search:
            normalizedSearch,
        });

        searchTimerRef.current =
          null;
      }, SEARCH_DEBOUNCE_MS);
  };

  /*
  |--------------------------------------------------------------------------
  | Search Submit
  |--------------------------------------------------------------------------
  */

  const handleSearchSubmit = (
    event
  ) => {
    event?.preventDefault();

    executeSearch(
      searchValue
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Handle Normal Filter Change
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
     * Property controls apartment
     * and unit.
     */
    if (
      field === "property_id"
    ) {
      emitChange({
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
      emitChange({
        ...currentFilters,
        apartment_id:
          normalizedValue,
        unit_id: "",
      });

      return;
    }

    /*
     * Page size resets pagination.
     */
    if (
      field === "per_page"
    ) {
      emitChange({
        ...currentFilters,
        per_page:
          Number(normalizedValue) ||
          15,
      });

      return;
    }

    /*
     * Sort direction compatibility.
     */
    if (
      field === "sort_direction"
    ) {
      emitChange({
        ...currentFilters,
        sort_direction:
          normalizedValue ||
          "desc",
        sort_order:
          normalizedValue ||
          "desc",
      });

      return;
    }

    emitChange({
      ...currentFilters,
      [field]:
        normalizedValue,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Handle Reset
  |--------------------------------------------------------------------------
  */

  const handleReset = () => {
    if (searchTimerRef.current) {
      clearTimeout(
        searchTimerRef.current
      );

      searchTimerRef.current = null;
    }

    setSearchValue("");

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
        search: "",
        page: 1,
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Handle Apply
  |--------------------------------------------------------------------------
  */

  const handleApply = () => {
    if (searchTimerRef.current) {
      clearTimeout(
        searchTimerRef.current
      );

      searchTimerRef.current = null;
    }

    const payload = {
      ...currentFilters,

      search:
        safeText(
          searchValue,
          ""
        ).trim(),

      status:
        currentFilters.status ||
        "",

      property_id:
        currentFilters.property_id ||
        "",

      apartment_id:
        currentFilters.apartment_id ||
        "",

      unit_id:
        currentFilters.unit_id ||
        "",

      tenant_id:
        currentFilters.tenant_id ||
        "",

      payment_frequency:
        currentFilters.payment_frequency ||
        "",

      start_date:
        currentFilters.start_date ||
        "",

      end_date:
        currentFilters.end_date ||
        "",

      per_page:
        Number(
          currentFilters.per_page
        ) || 15,

      sort_by:
        currentFilters.sort_by ||
        "created_at",

      sort_direction:
        currentFilters.sort_direction ||
        "desc",

      sort_order:
        currentFilters.sort_direction ||
        "desc",

      page: 1,
    };

    /*
     * If parent supplied onApply,
     * use it.
     */
    if (
      typeof onApply === "function"
    ) {
      onApply(payload);
      return;
    }

    /*
     * Otherwise use onChange.
     *
     * This is important because your
     * current TenancyList passes onChange
     * but does not pass onApply.
     */
    if (
      typeof onChange === "function"
    ) {
      onChange(payload);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Active Filter Count
  |--------------------------------------------------------------------------
  */

  const activeFilterCount = [
    searchValue,
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
          getUnitApartmentId(
            unit
          ) ===
          String(
            currentFilters.apartment_id
          )
        );
      }

      if (
        currentFilters.property_id
      ) {
        return (
          getUnitPropertyId(
            unit
          ) ===
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
  */

  const selectedApartment =
    filteredApartments.find(
      (apartment) =>
        getApartmentId(
          apartment
        ) ===
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
    <section
      aria-label="Tenancy filters"
      className="
        mb-6
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
        shadow-slate-200/50
        dark:border-slate-700
        dark:bg-slate-900
        dark:shadow-none
      "
    >
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div
        className="
          border-b
          border-slate-200
          bg-gradient-to-r
          from-slate-50
          to-white
          px-5
          py-4
          dark:border-slate-700
          dark:from-slate-900
          dark:to-slate-900
          sm:px-6
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-indigo-50
                text-indigo-600
                ring-1
                ring-inset
                ring-indigo-100
                dark:bg-indigo-950/40
                dark:text-indigo-400
                dark:ring-indigo-900/50
              "
            >
              <Filter
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  className="
                    text-sm
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  Filter Tenancies
                </h2>

                {activeFilterCount > 0 && (
                  <span
                    className="
                      inline-flex
                      items-center
                      rounded-full
                      bg-indigo-100
                      px-2
                      py-0.5
                      text-[11px]
                      font-bold
                      text-indigo-700
                      dark:bg-indigo-950/60
                      dark:text-indigo-300
                    "
                  >
                    {activeFilterCount} active
                  </span>
                )}
              </div>

              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Search and refine tenancy
                records by tenant, property,
                status and dates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loading && (
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-indigo-50
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-indigo-700
                  dark:bg-indigo-950/40
                  dark:text-indigo-300
                "
                aria-live="polite"
              >
                <Loader2
                  className="
                    h-3.5
                    w-3.5
                    animate-spin
                  "
                  aria-hidden="true"
                />

                Searching...
              </div>
            )}

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  px-3
                  py-2
                  text-xs
                  font-semibold
                  text-slate-600
                  transition
                  hover:border-red-200
                  hover:bg-red-50
                  hover:text-red-600
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:border-slate-700
                  dark:bg-slate-800
                  dark:text-slate-300
                  dark:hover:border-red-900/50
                  dark:hover:bg-red-950/30
                  dark:hover:text-red-400
                "
              >
                <RotateCcw
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />

                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================
          FILTER BODY
      ================================================================ */}

      <div className="p-5 sm:p-6">

        {/* ============================================================
            SEARCH
        ============================================================ */}

        <form
          onSubmit={
            handleSearchSubmit
          }
          className="mb-6"
        >
          <label
            htmlFor="tenancy-search"
            className="
              mb-2
              flex
              items-center
              justify-between
              text-xs
              font-bold
              uppercase
              tracking-wide
              text-slate-600
              dark:text-slate-300
            "
          >
            <span>
              Search tenancy records
            </span>

            <span
              className="
                hidden
                text-[10px]
                font-medium
                normal-case
                tracking-normal
                text-slate-400
                sm:inline
              "
            >
              Tenancy number, tenant,
              email or phone
            </span>
          </label>

          <div className="relative">
            <Search
              className="
                pointer-events-none
                absolute
                left-3.5
                top-1/2
                h-4.5
                w-4.5
                -translate-y-1/2
                text-slate-400
              "
              aria-hidden="true"
            />

            <input
              id="tenancy-search"
              type="search"
              value={searchValue}
              onChange={(event) =>
                handleSearchChange(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  handleSearchSubmit(
                    event
                  );
                }
              }}
              placeholder="
                Search by tenancy number,
                tenant name, email or phone...
              "
              autoComplete="off"
              spellCheck="false"
              className="
                h-12
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                pl-10
                pr-24
                text-sm
                text-slate-900
                outline-none
                transition-all
                placeholder:text-slate-400
                hover:border-slate-300
                focus:border-indigo-500
                focus:bg-white
                focus:ring-4
                focus:ring-indigo-500/10
                dark:border-slate-700
                dark:bg-slate-800
                dark:text-white
                dark:placeholder:text-slate-500
                dark:hover:border-slate-600
                dark:focus:border-indigo-500
                dark:focus:bg-slate-800
              "
              aria-label="Search tenancy records"
            />

            <div
              className="
                absolute
                right-2
                top-1/2
                flex
                -translate-y-1/2
                items-center
                gap-1
              "
            >
              {loading && (
                <span
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    text-indigo-500
                  "
                  title="Searching"
                >
                  <Loader2
                    className="
                      h-4
                      w-4
                      animate-spin
                    "
                    aria-hidden="true"
                  />
                </span>
              )}

              {searchValue && !loading && (
                <button
                  type="button"
                  onClick={() =>
                    executeSearch("")
                  }
                  aria-label="Clear search"
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-400
                    transition
                    hover:bg-slate-100
                    hover:text-slate-700
                    dark:hover:bg-slate-700
                    dark:hover:text-white
                  "
                >
                  <X
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>
              )}

              {!loading && (
                <button
                  type="submit"
                  className="
                    hidden
                    h-8
                    items-center
                    gap-1.5
                    rounded-lg
                    bg-indigo-600
                    px-3
                    text-xs
                    font-bold
                    text-white
                    transition
                    hover:bg-indigo-700
                    focus:outline-none
                    focus:ring-2
                    focus:ring-indigo-500
                    focus:ring-offset-1
                    sm:inline-flex
                  "
                >
                  <Search
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />

                  Search
                </button>
              )}
            </div>
          </div>

          <div
            className="
              mt-2
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <p
              className="
                text-[11px]
                text-slate-400
                dark:text-slate-500
              "
            >
              Results update automatically
              as you type.
            </p>

            {searchValue.trim() && (
              <p
                className="
                  text-[11px]
                  font-medium
                  text-indigo-600
                  dark:text-indigo-400
                "
              >
                Searching for "
                {searchValue.trim()}"
              </p>
            )}
          </div>
        </form>

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
              (
                Boolean(
                  currentFilters.property_id
                ) &&
                filteredApartments.length ===
                0
              )
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
              (
                Boolean(
                  currentFilters.apartment_id ||
                  currentFilters.property_id
                ) &&
                filteredUnits.length === 0
              )
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
              mt-7
              border-t
              border-slate-200
              pt-6
              dark:border-slate-700
            "
          >
            <div className="mb-4 flex items-center gap-2">
              <div
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-lg
                  bg-slate-100
                  text-slate-600
                  dark:bg-slate-800
                  dark:text-slate-300
                "
              >
                <SlidersHorizontal
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </div>

              <div>
                <h3
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wide
                    text-slate-700
                    dark:text-slate-300
                  "
                >
                  Advanced Filters
                </h3>

                <p
                  className="
                    mt-0.5
                    text-[11px]
                    text-slate-400
                  "
                >
                  Narrow results using tenancy
                  details and dates.
                </p>
              </div>
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
            SORTING
        ============================================================ */}

        <div
          className="
            mt-7
            border-t
            border-slate-200
            pt-6
            dark:border-slate-700
          "
        >
          <div className="mb-4 flex items-center gap-2">
            <div
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-lg
                bg-slate-100
                text-slate-600
                dark:bg-slate-800
                dark:text-slate-300
              "
            >
              <SlidersHorizontal
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
            </div>

            <div>
              <h3
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-wide
                  text-slate-700
                  dark:text-slate-300
                "
              >
                Results & Sorting
              </h3>

              <p
                className="
                  mt-0.5
                  text-[11px]
                  text-slate-400
                "
              >
                Choose how tenancy results
                should be displayed.
              </p>
            </div>
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

            <FilterSelect
              label="Results Per Page"
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
                10 records
              </option>

              <option value="15">
                15 records
              </option>

              <option value="25">
                25 records
              </option>

              <option value="50">
                50 records
              </option>

              <option value="100">
                100 records
              </option>
            </FilterSelect>

            <div className="flex items-end">
              <button
                type="button"
                onClick={
                  handleApply
                }
                disabled={loading}
                className="
                  inline-flex
                  h-11
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-indigo-600
                  px-4
                  text-sm
                  font-bold
                  text-white
                  shadow-sm
                  shadow-indigo-600/20
                  transition-all
                  hover:-translate-y-0.5
                  hover:bg-indigo-700
                  hover:shadow-md
                  hover:shadow-indigo-600/20
                  focus:outline-none
                  focus:ring-4
                  focus:ring-indigo-500/20
                  disabled:cursor-not-allowed
                  disabled:translate-y-0
                  disabled:opacity-60
                  dark:bg-indigo-500
                  dark:hover:bg-indigo-600
                "
              >
                {loading ? (
                  <>
                    <Loader2
                      className="
                        h-4
                        w-4
                        animate-spin
                      "
                      aria-hidden="true"
                    />

                    Loading...
                  </>
                ) : (
                  <>
                    <Filter
                      className="h-4 w-4"
                      aria-hidden="true"
                    />

                    Apply Filters
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================
            ACTIVE FILTER SUMMARY
        ============================================================ */}

        {activeFilterCount > 0 && (
          <div
            className="
              mt-6
              flex
              flex-col
              gap-3
              rounded-xl
              border
              border-indigo-100
              bg-indigo-50/70
              p-3
              sm:flex-row
              sm:items-center
              sm:justify-between
              dark:border-indigo-900/50
              dark:bg-indigo-950/20
            "
          >
            <div className="flex min-w-0 items-center gap-2">
              <div
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-white
                  text-indigo-600
                  shadow-sm
                  dark:bg-slate-800
                  dark:text-indigo-400
                "
              >
                <Filter
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-xs
                    font-semibold
                    text-indigo-900
                    dark:text-indigo-200
                  "
                >
                  {activeFilterCount} filter
                  {activeFilterCount === 1
                    ? ""
                    : "s"} selected
                </p>

                <p
                  className="
                    truncate
                    text-[11px]
                    text-indigo-700
                    dark:text-indigo-300
                  "
                >
                  {searchValue.trim()
                    ? `Searching tenancy records for "${searchValue.trim()}".`
                    : "Results will reflect the selected filter criteria."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={
                handleApply
              }
              disabled={loading}
              className="
                inline-flex
                shrink-0
                items-center
                justify-center
                gap-1.5
                rounded-lg
                border
                border-indigo-200
                bg-white
                px-3
                py-2
                text-xs
                font-bold
                text-indigo-700
                transition
                hover:bg-indigo-100
                disabled:cursor-not-allowed
                disabled:opacity-50
                dark:border-indigo-800
                dark:bg-slate-800
                dark:text-indigo-300
                dark:hover:bg-indigo-950/50
              "
            >
              {loading ? (
                <Loader2
                  className="
                    h-3.5
                    w-3.5
                    animate-spin
                  "
                  aria-hidden="true"
                />
              ) : (
                <Search
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
              )}

              {loading
                ? "Updating..."
                : "Update Results"}
            </button>
          </div>
        )}
      </div>
    </section>
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
  const id =
    `tenancy-filter-${label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`;

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="
          mb-2
          block
          text-xs
          font-bold
          uppercase
          tracking-wide
          text-slate-600
          dark:text-slate-300
        "
      >
        {label}
      </label>

      <div className="relative">
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
            appearance-none
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            px-3
            pr-10
            text-sm
            font-medium
            text-slate-800
            outline-none
            transition-all
            hover:border-slate-300
            focus:border-indigo-500
            focus:bg-white
            focus:ring-4
            focus:ring-indigo-500/10
            disabled:cursor-not-allowed
            disabled:opacity-60
            dark:border-slate-700
            dark:bg-slate-800
            dark:text-slate-100
            dark:hover:border-slate-600
            dark:focus:border-indigo-500
            dark:focus:bg-slate-800
          "
        >
          {children}
        </select>

        <ChevronDown
          className="
            pointer-events-none
            absolute
            right-3
            top-1/2
            h-4
            w-4
            -translate-y-1/2
            text-slate-400
          "
          aria-hidden="true"
        />
      </div>
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
  const id =
    `tenancy-date-${label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`;

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="
          mb-2
          block
          text-xs
          font-bold
          uppercase
          tracking-wide
          text-slate-600
          dark:text-slate-300
        "
      >
        {label}
      </label>

      <div className="relative">
        <CalendarDays
          className="
            pointer-events-none
            absolute
            left-3
            top-1/2
            h-4
            w-4
            -translate-y-1/2
            text-slate-400
          "
          aria-hidden="true"
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
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            pl-10
            pr-3
            text-sm
            font-medium
            text-slate-800
            outline-none
            transition-all
            hover:border-slate-300
            focus:border-indigo-500
            focus:bg-white
            focus:ring-4
            focus:ring-indigo-500/10
            disabled:cursor-not-allowed
            disabled:opacity-60
            dark:border-slate-700
            dark:bg-slate-800
            dark:text-slate-100
            dark:hover:border-slate-600
            dark:focus:border-indigo-500
            dark:focus:bg-slate-800
          "
        />
      </div>
    </div>
  );
};

export default TenancyFilters;