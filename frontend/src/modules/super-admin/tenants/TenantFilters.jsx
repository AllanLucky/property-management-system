import {
  ChevronDown,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const TenantFilters = ({
  filters = {},
  onChange,
  onSearch,
  onStatusChange,
  loading = false,
}) => {
  /*
  |--------------------------------------------------------------------------
  | LOCAL STATE
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState(filters?.search ?? "");
  const [showAdvanced, setShowAdvanced] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | SYNC SEARCH WITH PARENT / REDUX FILTERS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setSearch(filters?.search ?? "");
  }, [filters?.search]);

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */

  const normalizeBoolean = (value) => {
    if (value === true || value === false) {
      return value;
    }

    if (value === "true" || value === "1" || value === 1) {
      return true;
    }

    if (value === "false" || value === "0" || value === 0) {
      return false;
    }

    return null;
  };

  const isActive = normalizeBoolean(filters?.is_active);
  const isVerified = normalizeBoolean(filters?.is_verified);

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const handleSearchChange = (event) => {
    const value = event.target.value;

    setSearch(value);

    if (typeof onSearch === "function") {
      onSearch(value);
    } else {
      handleFilterChange("search", value);
    }
  };

  const handleClearSearch = () => {
    setSearch("");

    if (typeof onSearch === "function") {
      onSearch("");
    } else {
      handleFilterChange("search", "");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER CHANGE
  |--------------------------------------------------------------------------
  */

  const handleFilterChange = (field, value) => {
    if (typeof onChange !== "function") {
      return;
    }

    onChange({
      [field]: value,
      page: 1,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const handleStatusChange = (event) => {
    const value = event.target.value;

    if (typeof onStatusChange === "function") {
      onStatusChange(value);
      return;
    }

    handleFilterChange("status", value);
  };

  /*
  |--------------------------------------------------------------------------
  | ACCOUNT STATUS
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | `undefined` is used for "All Accounts".
  | This prevents the frontend from sending `is_active=undefined`
  | as an actual filter value.
  |
  */

  const handleActiveChange = (event) => {
    const value = event.target.value;

    if (value === "") {
      handleFilterChange("is_active", undefined);
      return;
    }

    handleFilterChange("is_active", value === "true");
  };

  /*
  |--------------------------------------------------------------------------
  | VERIFICATION
  |--------------------------------------------------------------------------
  */

  const handleVerifiedChange = (event) => {
    const value = event.target.value;

    if (value === "") {
      handleFilterChange("is_verified", undefined);
      return;
    }

    handleFilterChange("is_verified", value === "true");
  };

  /*
  |--------------------------------------------------------------------------
  | RESET
  |--------------------------------------------------------------------------
  */

  const handleReset = () => {
    setSearch("");

    const resetFilters = {
      search: "",
      status: "",
      is_active: undefined,
      is_verified: undefined,
      gender: "",
      country: "",
      county: "",
      city: "",
      sort_by: "created_at",
      sort_direction: "desc",
      per_page: 15,
      page: 1,
    };

    if (typeof onChange === "function") {
      onChange(resetFilters);
    }

    if (typeof onSearch === "function") {
      onSearch("");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ACTIVE FILTER COUNT
  |--------------------------------------------------------------------------
  */

  const activeFilterCount = useMemo(() => {
    return [
      filters?.status,
      isActive !== null ? isActive : null,
      isVerified !== null ? isVerified : null,
      filters?.gender,
      filters?.country,
      filters?.county,
      filters?.city,
      filters?.sort_by && filters.sort_by !== "created_at"
        ? filters.sort_by
        : null,
      filters?.sort_direction && filters.sort_direction !== "desc"
        ? filters.sort_direction
        : null,
    ].filter(
      (value) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    ).length;
  }, [
    filters?.status,
    filters?.gender,
    filters?.country,
    filters?.county,
    filters?.city,
    filters?.sort_by,
    filters?.sort_direction,
    isActive,
    isVerified,
  ]);

  /*
  |--------------------------------------------------------------------------
  | FILTER SUMMARY VISIBILITY
  |--------------------------------------------------------------------------
  */

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(filters?.status) ||
    isActive !== null ||
    isVerified !== null ||
    Boolean(filters?.gender) ||
    Boolean(filters?.country) ||
    Boolean(filters?.county) ||
    Boolean(filters?.city);

  /*
  |--------------------------------------------------------------------------
  | STYLES
  |--------------------------------------------------------------------------
  */

  const selectClassName = `
    w-full
    appearance-none
    rounded-lg
    border
    border-gray-300
    bg-white
    px-3
    py-2.5
    pr-10
    text-sm
    text-gray-700
    shadow-sm
    outline-none
    transition
    focus:border-primary-500
    focus:ring-2
    focus:ring-primary-500/20
    disabled:cursor-not-allowed
    disabled:bg-gray-50
    disabled:text-gray-400
  `;

  const inputClassName = `
    w-full
    rounded-lg
    border
    border-gray-300
    bg-white
    px-3
    py-2.5
    text-sm
    text-gray-700
    shadow-sm
    outline-none
    transition
    placeholder:text-gray-400
    focus:border-primary-500
    focus:ring-2
    focus:ring-primary-500/20
    disabled:cursor-not-allowed
    disabled:bg-gray-50
    disabled:text-gray-400
  `;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* ================================================================
          FILTER HEADER
      ================================================================= */}

      <div className="flex flex-col gap-4 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* ==============================================================
            SEARCH
        ============================================================== */}

        <div className="relative w-full lg:max-w-md">
          <Search
            className="
              pointer-events-none
              absolute
              left-3
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-gray-400
            "
            aria-hidden="true"
          />

          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search tenants..."
            className={`${inputClassName} pl-10 pr-10`}
            disabled={loading}
            aria-label="Search tenants"
            autoComplete="off"
          />

          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              disabled={loading}
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                rounded
                p-1
                text-gray-400
                transition
                hover:bg-gray-100
                hover:text-gray-600
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ==============================================================
            QUICK FILTERS / ACTIONS
        ============================================================== */}

        <div className="flex flex-wrap items-center gap-2">
          {/* STATUS */}

          <div className="relative min-w-[150px]">
            <select
              value={filters?.status ?? ""}
              onChange={handleStatusChange}
              disabled={loading}
              className={selectClassName}
              aria-label="Filter tenants by status"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
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
                text-gray-400
              "
              aria-hidden="true"
            />
          </div>

          {/* ADVANCED FILTERS */}

          <button
            type="button"
            onClick={() => setShowAdvanced((previous) => !previous)}
            disabled={loading}
            className={`
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              px-3
              py-2.5
              text-sm
              font-medium
              shadow-sm
              transition
              focus:outline-none
              focus:ring-2
              focus:ring-primary-500/20
              disabled:cursor-not-allowed
              disabled:opacity-50
              ${showAdvanced
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }
            `}
            aria-expanded={showAdvanced}
            aria-controls="tenant-advanced-filters"
          >
            <SlidersHorizontal
              className="h-4 w-4"
              aria-hidden="true"
            />

            <span className="hidden sm:inline">
              Filters
            </span>

            {activeFilterCount > 0 && (
              <span
                className="
                  flex
                  h-5
                  min-w-5
                  items-center
                  justify-center
                  rounded-full
                  bg-primary-600
                  px-1.5
                  text-xs
                  font-semibold
                  text-white
                "
                aria-label={`${activeFilterCount} active filters`}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* RESET */}

          {(activeFilterCount > 0 || search) && (
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-gray-300
                bg-white
                px-3
                py-2.5
                text-sm
                font-medium
                text-gray-700
                shadow-sm
                transition
                hover:bg-gray-50
                focus:outline-none
                focus:ring-2
                focus:ring-primary-500/20
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              aria-label="Reset all tenant filters"
            >
              <RotateCcw
                className="h-4 w-4"
                aria-hidden="true"
              />

              <span className="hidden sm:inline">
                Reset
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ================================================================
          ADVANCED FILTERS
      ================================================================= */}

      {showAdvanced && (
        <div
          id="tenant-advanced-filters"
          className="border-b border-gray-200 bg-gray-50/70 p-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* ==========================================================
                ACCOUNT STATUS
            ========================================================== */}

            <div>
              <label
                htmlFor="tenant-is-active"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Account Status
              </label>

              <div className="relative">
                <select
                  id="tenant-is-active"
                  value={isActive === null ? "" : String(isActive)}
                  onChange={handleActiveChange}
                  disabled={loading}
                  className={selectClassName}
                >
                  <option value="">All Accounts</option>
                  <option value="true">Active Accounts</option>
                  <option value="false">Inactive Accounts</option>
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
                    text-gray-400
                  "
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* ==========================================================
                VERIFICATION
            ========================================================== */}

            <div>
              <label
                htmlFor="tenant-is-verified"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Verification
              </label>

              <div className="relative">
                <select
                  id="tenant-is-verified"
                  value={isVerified === null ? "" : String(isVerified)}
                  onChange={handleVerifiedChange}
                  disabled={loading}
                  className={selectClassName}
                >
                  <option value="">All Profiles</option>
                  <option value="true">Verified</option>
                  <option value="false">Unverified</option>
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
                    text-gray-400
                  "
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* ==========================================================
                GENDER
            ========================================================== */}

            <div>
              <label
                htmlFor="tenant-gender"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Gender
              </label>

              <div className="relative">
                <select
                  id="tenant-gender"
                  value={filters?.gender ?? ""}
                  onChange={(event) =>
                    handleFilterChange(
                      "gender",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  className={selectClassName}
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
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
                    text-gray-400
                  "
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* ==========================================================
                COUNTRY
            ========================================================== */}

            <div>
              <label
                htmlFor="tenant-country"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Country
              </label>

              <input
                id="tenant-country"
                type="text"
                value={filters?.country ?? ""}
                onChange={(event) =>
                  handleFilterChange(
                    "country",
                    event.target.value
                  )
                }
                placeholder="e.g. Kenya"
                disabled={loading}
                className={inputClassName}
                autoComplete="country-name"
              />
            </div>

            {/* ==========================================================
                COUNTY
            ========================================================== */}

            <div>
              <label
                htmlFor="tenant-county"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                County
              </label>

              <input
                id="tenant-county"
                type="text"
                value={filters?.county ?? ""}
                onChange={(event) =>
                  handleFilterChange(
                    "county",
                    event.target.value
                  )
                }
                placeholder="e.g. Nairobi"
                disabled={loading}
                className={inputClassName}
                autoComplete="address-level1"
              />
            </div>

            {/* ==========================================================
                CITY
            ========================================================== */}

            <div>
              <label
                htmlFor="tenant-city"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                City
              </label>

              <input
                id="tenant-city"
                type="text"
                value={filters?.city ?? ""}
                onChange={(event) =>
                  handleFilterChange(
                    "city",
                    event.target.value
                  )
                }
                placeholder="e.g. Nairobi"
                disabled={loading}
                className={inputClassName}
                autoComplete="address-level2"
              />
            </div>

            {/* ==========================================================
                SORT BY
            ========================================================== */}

            <div>
              <label
                htmlFor="tenant-sort-by"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Sort By
              </label>

              <div className="relative">
                <select
                  id="tenant-sort-by"
                  value={filters?.sort_by ?? "created_at"}
                  onChange={(event) =>
                    handleFilterChange(
                      "sort_by",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  className={selectClassName}
                >
                  <option value="created_at">
                    Date Created
                  </option>
                  <option value="updated_at">
                    Last Updated
                  </option>
                  <option value="first_name">
                    First Name
                  </option>
                  <option value="last_name">
                    Last Name
                  </option>
                  <option value="tenant_number">
                    Tenant Number
                  </option>
                  <option value="status">
                    Status
                  </option>
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
                    text-gray-400
                  "
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* ==========================================================
                SORT DIRECTION
            ========================================================== */}

            <div>
              <label
                htmlFor="tenant-sort-direction"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Sort Direction
              </label>

              <div className="relative">
                <select
                  id="tenant-sort-direction"
                  value={filters?.sort_direction ?? "desc"}
                  onChange={(event) =>
                    handleFilterChange(
                      "sort_direction",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  className={selectClassName}
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
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
                    text-gray-400
                  "
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          FILTER SUMMARY
      ================================================================= */}

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <div className="mr-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Filter
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />

            Active filters:
          </div>

          {/* SEARCH */}

          {search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              Search: {search}

              <button
                type="button"
                onClick={handleClearSearch}
                disabled={loading}
                className="rounded-full hover:bg-blue-100 disabled:opacity-50"
                aria-label="Remove search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* STATUS */}

          {filters?.status && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium capitalize text-purple-700">
              Status: {filters.status}

              <button
                type="button"
                onClick={() =>
                  handleFilterChange("status", "")
                }
                disabled={loading}
                className="rounded-full hover:bg-purple-100 disabled:opacity-50"
                aria-label="Remove status filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* ACCOUNT STATUS */}

          {isActive !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
              Account: {isActive ? "Active" : "Inactive"}

              <button
                type="button"
                onClick={() =>
                  handleFilterChange(
                    "is_active",
                    undefined
                  )
                }
                disabled={loading}
                className="rounded-full hover:bg-green-100 disabled:opacity-50"
                aria-label="Remove account status filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* VERIFICATION */}

          {isVerified !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Verification:{" "}
              {isVerified ? "Verified" : "Unverified"}

              <button
                type="button"
                onClick={() =>
                  handleFilterChange(
                    "is_verified",
                    undefined
                  )
                }
                disabled={loading}
                className="rounded-full hover:bg-emerald-100 disabled:opacity-50"
                aria-label="Remove verification filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* GENDER */}

          {filters?.gender && (
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium capitalize text-pink-700">
              Gender: {filters.gender}

              <button
                type="button"
                onClick={() =>
                  handleFilterChange("gender", "")
                }
                disabled={loading}
                className="rounded-full hover:bg-pink-100 disabled:opacity-50"
                aria-label="Remove gender filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* COUNTRY */}

          {filters?.country && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              Country: {filters.country}

              <button
                type="button"
                onClick={() =>
                  handleFilterChange("country", "")
                }
                disabled={loading}
                className="rounded-full hover:bg-gray-200 disabled:opacity-50"
                aria-label="Remove country filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* COUNTY */}

          {filters?.county && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              County: {filters.county}

              <button
                type="button"
                onClick={() =>
                  handleFilterChange("county", "")
                }
                disabled={loading}
                className="rounded-full hover:bg-gray-200 disabled:opacity-50"
                aria-label="Remove county filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* CITY */}

          {filters?.city && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              City: {filters.city}

              <button
                type="button"
                onClick={() =>
                  handleFilterChange("city", "")
                }
                disabled={loading}
                className="rounded-full hover:bg-gray-200 disabled:opacity-50"
                aria-label="Remove city filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TenantFilters;