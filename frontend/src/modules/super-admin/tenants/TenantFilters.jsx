import {
  ChevronDown,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";



const TenantFilters = ({
  filters = {},
  onChange,
  onSearch,
  onStatusChange,
  loading = false,
}) => {
  /*
  |--------------------------------------------------------------------------
  | LOCAL SEARCH STATE
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState(
    filters?.search || ""
  );

  const [showAdvanced, setShowAdvanced] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | SYNC SEARCH WITH REDUX FILTERS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setSearch(filters?.search || "");
  }, [filters?.search]);

  /*
  |--------------------------------------------------------------------------
  | SEARCH HANDLER
  |--------------------------------------------------------------------------
  */

  const handleSearchChange = (event) => {
    const value = event.target.value;

    setSearch(value);

    if (typeof onSearch === "function") {
      onSearch(value);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CLEAR SEARCH
  |--------------------------------------------------------------------------
  */

  const handleClearSearch = () => {
    setSearch("");

    if (typeof onSearch === "function") {
      onSearch("");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER CHANGE
  |--------------------------------------------------------------------------
  */

  const handleFilterChange = (
    field,
    value
  ) => {
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
  | STATUS CHANGE
  |--------------------------------------------------------------------------
  */

  const handleStatusChange = (event) => {
    const value = event.target.value;

    if (typeof onStatusChange === "function") {
      onStatusChange(value);
      return;
    }

    handleFilterChange(
      "status",
      value
    );
  };

  /*
  |--------------------------------------------------------------------------
  | BOOLEAN VALUE
  |--------------------------------------------------------------------------
  */

  const getBooleanValue = (value) => {
    if (
      value === true ||
      value === false
    ) {
      return value;
    }

    if (
      value === "true" ||
      value === "1"
    ) {
      return true;
    }

    if (
      value === "false" ||
      value === "0"
    ) {
      return false;
    }

    return null;
  };

  /*
  |--------------------------------------------------------------------------
  | ACTIVE FILTER
  |--------------------------------------------------------------------------
  */

  const handleActiveChange = (event) => {
    const value = event.target.value;

    if (value === "") {
      handleFilterChange(
        "is_active",
        undefined
      );
      return;
    }

    handleFilterChange(
      "is_active",
      value === "true"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | VERIFIED FILTER
  |--------------------------------------------------------------------------
  */

  const handleVerifiedChange = (event) => {
    const value = event.target.value;

    if (value === "") {
      handleFilterChange(
        "is_verified",
        undefined
      );
      return;
    }

    handleFilterChange(
      "is_verified",
      value === "true"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | RESET FILTERS
  |--------------------------------------------------------------------------
  */

  const handleReset = () => {
    setSearch("");

    if (typeof onChange === "function") {
      onChange({
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
      });
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

  const activeFilterCount = [
    filters?.status,
    getBooleanValue(filters?.is_active) !== null
      ? filters?.is_active
      : null,
    getBooleanValue(filters?.is_verified) !== null
      ? filters?.is_verified
      : null,
    filters?.gender,
    filters?.country,
    filters?.county,
    filters?.city,
    filters?.sort_by &&
      filters?.sort_by !== "created_at"
      ? filters?.sort_by
      : null,
  ].filter(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  ).length;

  /*
  |--------------------------------------------------------------------------
  | SELECT STYLES
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
  `;

  /*
  |--------------------------------------------------------------------------
  | INPUT STYLES
  |--------------------------------------------------------------------------
  */

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
        {/* --------------------------------------------------------------
            SEARCH
        -------------------------------------------------------------- */}

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
          />

          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search tenants..."
            className={`${inputClassName} pl-10 pr-10`}
            disabled={loading}
            aria-label="Search tenants"
          />

          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
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
              "
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* --------------------------------------------------------------
            QUICK FILTERS / ACTIONS
        -------------------------------------------------------------- */}

        <div className="flex flex-wrap items-center gap-2">
          {/* STATUS */}

          <div className="relative min-w-[150px]">
            <select
              value={filters?.status || ""}
              onChange={handleStatusChange}
              disabled={loading}
              className={selectClassName}
              aria-label="Filter by status"
            >
              <option value="">
                All Statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="blacklisted">
                Blacklisted
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
            />
          </div>

          {/* ADVANCED FILTER BUTTON */}

          <button
            type="button"
            onClick={() =>
              setShowAdvanced(
                (previous) => !previous
              )
            }
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
              ${showAdvanced
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }
            `}
            aria-expanded={showAdvanced}
          >
            <SlidersHorizontal className="h-4 w-4" />

            <span className="hidden sm:inline">
              Filters
            </span>

            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* RESET */}

          {activeFilterCount > 0 ||
            search ? (
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
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <RotateCcw className="h-4 w-4" />

              <span className="hidden sm:inline">
                Reset
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {/* ================================================================
          ADVANCED FILTERS
      ================================================================= */}

      {showAdvanced && (
        <div className="border-b border-gray-200 bg-gray-50/70 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* ----------------------------------------------------------
                ACTIVE STATUS
            ---------------------------------------------------------- */}

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
                  value={
                    filters?.is_active ===
                      undefined ||
                      filters?.is_active ===
                      null
                      ? ""
                      : String(
                        filters.is_active
                      )
                  }
                  onChange={
                    handleActiveChange
                  }
                  disabled={loading}
                  className={selectClassName}
                >
                  <option value="">
                    All Accounts
                  </option>

                  <option value="true">
                    Active Accounts
                  </option>

                  <option value="false">
                    Inactive Accounts
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
                />
              </div>
            </div>

            {/* ----------------------------------------------------------
                VERIFICATION
            ---------------------------------------------------------- */}

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
                  value={
                    filters?.is_verified ===
                      undefined ||
                      filters?.is_verified ===
                      null
                      ? ""
                      : String(
                        filters.is_verified
                      )
                  }
                  onChange={
                    handleVerifiedChange
                  }
                  disabled={loading}
                  className={selectClassName}
                >
                  <option value="">
                    All Profiles
                  </option>

                  <option value="true">
                    Verified
                  </option>

                  <option value="false">
                    Unverified
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
                />
              </div>
            </div>

            {/* ----------------------------------------------------------
                GENDER
            ---------------------------------------------------------- */}

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
                  value={
                    filters?.gender || ""
                  }
                  onChange={(event) =>
                    handleFilterChange(
                      "gender",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  className={selectClassName}
                >
                  <option value="">
                    All Genders
                  </option>

                  <option value="male">
                    Male
                  </option>

                  <option value="female">
                    Female
                  </option>

                  <option value="other">
                    Other
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
                />
              </div>
            </div>

            {/* ----------------------------------------------------------
                COUNTRY
            ---------------------------------------------------------- */}

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
                value={
                  filters?.country || ""
                }
                onChange={(event) =>
                  handleFilterChange(
                    "country",
                    event.target.value
                  )
                }
                placeholder="e.g. Kenya"
                disabled={loading}
                className={inputClassName}
              />
            </div>

            {/* ----------------------------------------------------------
                COUNTY
            ---------------------------------------------------------- */}

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
                value={
                  filters?.county || ""
                }
                onChange={(event) =>
                  handleFilterChange(
                    "county",
                    event.target.value
                  )
                }
                placeholder="e.g. Nairobi"
                disabled={loading}
                className={inputClassName}
              />
            </div>

            {/* ----------------------------------------------------------
                CITY
            ---------------------------------------------------------- */}

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
                value={
                  filters?.city || ""
                }
                onChange={(event) =>
                  handleFilterChange(
                    "city",
                    event.target.value
                  )
                }
                placeholder="e.g. Nairobi"
                disabled={loading}
                className={inputClassName}
              />
            </div>

            {/* ----------------------------------------------------------
                SORT BY
            ---------------------------------------------------------- */}

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
                  value={
                    filters?.sort_by ||
                    "created_at"
                  }
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
                />
              </div>
            </div>

            {/* ----------------------------------------------------------
                SORT DIRECTION
            ---------------------------------------------------------- */}

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
                  value={
                    filters?.sort_direction ||
                    "desc"
                  }
                  onChange={(event) =>
                    handleFilterChange(
                      "sort_direction",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  className={selectClassName}
                >
                  <option value="desc">
                    Descending
                  </option>

                  <option value="asc">
                    Ascending
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
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          FILTER SUMMARY
      ================================================================= */}

      {(search ||
        filters?.status ||
        filters?.is_active !==
        undefined ||
        filters?.is_verified !==
        undefined ||
        filters?.gender ||
        filters?.country ||
        filters?.county ||
        filters?.city) && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <div className="mr-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Filter className="h-3.5 w-3.5" />

              Active filters:
            </div>

            {search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                Search: {search}

                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="rounded-full hover:bg-blue-100"
                  aria-label="Remove search filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters?.status && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium capitalize text-purple-700">
                Status:{" "}
                {filters.status}

                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange(
                      "status",
                      ""
                    )
                  }
                  className="rounded-full hover:bg-purple-100"
                  aria-label="Remove status filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters?.is_active !==
              undefined &&
              filters?.is_active !==
              null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                  Account:{" "}
                  {filters.is_active
                    ? "Active"
                    : "Inactive"}

                  <button
                    type="button"
                    onClick={() =>
                      handleFilterChange(
                        "is_active",
                        undefined
                      )
                    }
                    className="rounded-full hover:bg-green-100"
                    aria-label="Remove account status filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

            {filters?.is_verified !==
              undefined &&
              filters?.is_verified !==
              null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Verification:{" "}
                  {filters.is_verified
                    ? "Verified"
                    : "Unverified"}

                  <button
                    type="button"
                    onClick={() =>
                      handleFilterChange(
                        "is_verified",
                        undefined
                      )
                    }
                    className="rounded-full hover:bg-emerald-100"
                    aria-label="Remove verification filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

            {filters?.gender && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium capitalize text-pink-700">
                Gender:{" "}
                {filters.gender}

                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange(
                      "gender",
                      ""
                    )
                  }
                  className="rounded-full hover:bg-pink-100"
                  aria-label="Remove gender filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters?.country && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                Country:{" "}
                {filters.country}

                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange(
                      "country",
                      ""
                    )
                  }
                  className="rounded-full hover:bg-gray-200"
                  aria-label="Remove country filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters?.county && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                County:{" "}
                {filters.county}

                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange(
                      "county",
                      ""
                    )
                  }
                  className="rounded-full hover:bg-gray-200"
                  aria-label="Remove county filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters?.city && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                City:{" "}
                {filters.city}

                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange(
                      "city",
                      ""
                    )
                  }
                  className="rounded-full hover:bg-gray-200"
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