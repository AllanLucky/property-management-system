
import {
  CalendarDays,
  Coins,
  Eye,
  FileText,
  Globe,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";

import { useMemo } from "react";
import { Link } from "react-router-dom";

const COUNTRY_INDEX_PATH = "/super-admin/countries";

/*
|--------------------------------------------------------------------------
| Formatting Helpers
|--------------------------------------------------------------------------
*/

const isObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const hasValue = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "";

const toStringValue = (value, fallback = "—") => {
  if (!hasValue(value)) return fallback;

  if (isObject(value)) {
    return (
      value.name ||
      value.label ||
      value.code ||
      value.value ||
      fallback
    );
  }

  return String(value);
};

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    return ["1", "true", "yes", "on", "active"].includes(
      value.toLowerCase().trim()
    );
  }

  return false;
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

/*
|--------------------------------------------------------------------------
| Extract Countries From API Response
|--------------------------------------------------------------------------
*/

const extractCountryRows = (input) => {
  if (Array.isArray(input)) {
    return input;
  }

  if (!isObject(input)) {
    return [];
  }

  if (Array.isArray(input.data)) {
    return input.data;
  }

  if (isObject(input.data)) {
    if (Array.isArray(input.data.data)) {
      return input.data.data;
    }

    if (
      isObject(input.data.data) &&
      Array.isArray(input.data.data.data)
    ) {
      return input.data.data.data;
    }
  }

  return [];
};

/*
|--------------------------------------------------------------------------
| Country Source
|--------------------------------------------------------------------------
*/

const getCountrySource = (country) => {
  if (!isObject(country)) return {};

  if (
    !hasValue(country.id) &&
    !hasValue(country.code) &&
    !hasValue(country.name) &&
    isObject(country.data)
  ) {
    return country.data;
  }

  return country;
};

/*
|--------------------------------------------------------------------------
| Country Helpers
|--------------------------------------------------------------------------
*/

const getCountryId = (country) => {
  const source = getCountrySource(country);

  const id =
    source.id ??
    source.country_id ??
    source.uuid ??
    null;

  if (hasValue(id)) {
    return String(id);
  }

  const fallback =
    source.slug ??
    source.code ??
    source.country_code ??
    null;

  return hasValue(fallback) ? String(fallback) : null;
};

const getCountryName = (country) => {
  const source = getCountrySource(country);

  return (
    toStringValue(source.name, "") ||
    toStringValue(source.display_name, "") ||
    toStringValue(source.displayName, "") ||
    toStringValue(source.name_with_code, "") ||
    "Unknown Country"
  );
};

const getCountryCode = (country) => {
  const source = getCountrySource(country);

  return toStringValue(
    source.code ??
    source.country_code ??
    source.countryCode ??
    source.iso_code ??
    source.isoCode ??
    source.iso2 ??
    source.alpha_2
  ).toUpperCase();
};

const getPhoneCode = (country) => {
  const source = getCountrySource(country);

  const value =
    source.phone_code ??
    source.phoneCode ??
    source.calling_code ??
    source.callingCode ??
    source.dial_code ??
    source.dialCode;

  if (!hasValue(value)) return "—";

  const phoneCode = String(value).trim();

  if (!phoneCode) return "—";

  return phoneCode.startsWith("+")
    ? phoneCode
    : `+${phoneCode}`;
};

const getCurrencyInformation = (country) => {
  const source = getCountrySource(country);

  const currency =
    source.currency ??
    source.currency_code ??
    source.currencyCode ??
    source.currency_symbol ??
    source.currencySymbol;

  if (!hasValue(currency)) {
    return {
      code: "—",
      name: "Currency not specified",
      symbol: "",
    };
  }

  if (isObject(currency)) {
    return {
      code: toStringValue(
        currency.code ??
        currency.currency_code ??
        currency.iso_code ??
        currency.name
      ).toUpperCase(),

      name: toStringValue(
        currency.name ??
        currency.label ??
        currency.code,
        "Currency"
      ),

      symbol: toStringValue(currency.symbol, ""),
    };
  }

  const currencyCode = String(currency).trim();

  return {
    code: currencyCode.toUpperCase(),
    name: currencyCode,
    symbol: "",
  };
};

const getCountryStatus = (country) => {
  const source = getCountrySource(country);

  if (hasValue(source.is_active)) {
    return toBoolean(source.is_active)
      ? "Active"
      : "Inactive";
  }

  const status = String(
    source.status_label ||
    source.status ||
    ""
  ).toLowerCase();

  if (status === "active") return "Active";
  if (status === "inactive") return "Inactive";

  return "Unknown";
};

const getCountrySlug = (country) => {
  const source = getCountrySource(country);

  return toStringValue(source.slug, "Country record");
};

const getCountryCreatedAt = (country) => {
  const source = getCountrySource(country);

  return (
    source.created_at ||
    source.createdAt ||
    source.creation_date ||
    source.created_date ||
    null
  );
};

/*
|--------------------------------------------------------------------------
| Country Row Normalization
|--------------------------------------------------------------------------
*/

const normalizeCountry = (country, index) => {
  const source = getCountrySource(country);

  const countryId = getCountryId(source);

  return {
    key:
      countryId ||
      source.slug ||
      source.code ||
      `country-${index}`,

    source,
    countryId,

    countryName: getCountryName(source),
    countryCode: getCountryCode(source),
    phoneCode: getPhoneCode(source),

    currency: getCurrencyInformation(source),

    slug: getCountrySlug(source),
    status: getCountryStatus(source),

    createdAt: getCountryCreatedAt(source),
  };
};

/*
|--------------------------------------------------------------------------
| Country Status Badge
|--------------------------------------------------------------------------
*/

const CountryStatusBadge = ({ status }) => {
  const styles = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Inactive: "bg-gray-100 text-gray-600 ring-gray-500/20",
    Unknown: "bg-amber-50 text-amber-700 ring-amber-600/20",
  };

  const dotStyles = {
    Active: "bg-emerald-500",
    Inactive: "bg-gray-400",
    Unknown: "bg-amber-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${styles[status] || styles.Unknown
        }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dotStyles[status] || dotStyles.Unknown
          }`}
      />

      {status}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| Country Identity
|--------------------------------------------------------------------------
*/

const CountryIdentity = ({
  countryName,
  slug,
  mobile = false,
}) => (
  <div className="flex min-w-0 items-center gap-3">
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-indigo-50 ${mobile ? "h-11 w-11" : "h-10 w-10"
        }`}
    >
      <Globe
        className={`text-indigo-600 ${mobile ? "h-5 w-5" : "h-4 w-4"
          }`}
      />
    </div>

    <div className="min-w-0">
      <div
        className="truncate text-sm font-bold text-gray-900"
        title={countryName}
      >
        {countryName}
      </div>

      <div
        className="mt-0.5 truncate text-[11px] text-gray-500"
        title={slug}
      >
        {slug}
      </div>
    </div>
  </div>
);

/*
|--------------------------------------------------------------------------
| Country Table Skeleton
|--------------------------------------------------------------------------
*/

const CountryTableSkeleton = () => (
  <div className="min-w-0">
    <div className="hidden overflow-x-auto lg:block">
      <table className="min-w-[1100px] w-full table-auto">
        <thead className="bg-gray-50/70">
          <tr>
            {[
              "Country",
              "Country Code",
              "Phone Code",
              "Currency",
              "Status",
              "Created Date",
              "Actions",
            ].map((heading) => (
              <th
                key={heading}
                className={`whitespace-nowrap px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 ${heading === "Actions"
                    ? "text-right"
                    : "text-left"
                  }`}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, index) => (
            <tr key={index} className="animate-pulse">
              <td className="px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-200" />

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3.5 w-32 rounded bg-gray-200" />
                    <div className="h-2.5 w-40 rounded bg-gray-100" />
                  </div>
                </div>
              </td>

              {Array.from({ length: 5 }).map((__, cellIndex) => (
                <td key={cellIndex} className="px-5 py-5">
                  <div className="h-4 w-20 rounded bg-gray-200" />
                </td>
              ))}

              <td className="px-5 py-5">
                <div className="ml-auto h-8 w-24 rounded bg-gray-200" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="space-y-3 p-4 lg:hidden">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl border border-gray-100 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gray-200" />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-gray-200" />
              <div className="h-3 w-3/4 rounded bg-gray-100" />
            </div>

            <div className="h-6 w-16 rounded-full bg-gray-200" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((__, cellIndex) => (
              <div key={cellIndex} className="space-y-2">
                <div className="h-2.5 w-16 rounded bg-gray-100" />
                <div className="h-4 w-20 rounded bg-gray-200" />
              </div>
            ))}
          </div>

          <div className="mt-5 h-10 rounded-lg bg-gray-100" />
        </div>
      ))}
    </div>
  </div>
);

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const CountryTable = ({
  countries = [],
  loading = false,
  onView,
  onEdit,
}) => {
  const countryRows = useMemo(
    () => extractCountryRows(countries),
    [countries]
  );

  const normalizedCountries = useMemo(
    () =>
      countryRows.map((country, index) =>
        normalizeCountry(country, index)
      ),
    [countryRows]
  );

  /*
  |--------------------------------------------------------------------------
  | Navigation Helpers
  |--------------------------------------------------------------------------
  */

  const handleView = (event, country) => {
    if (typeof onView === "function") {
      event.preventDefault();
      onView(country.countryId, country.source);
    }
  };

  const handleEdit = (event, country) => {
    if (typeof onEdit === "function") {
      event.preventDefault();
      onEdit(country.countryId, country.source);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading && normalizedCountries.length === 0) {
    return <CountryTableSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Empty State
  |--------------------------------------------------------------------------
  */

  if (normalizedCountries.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <Globe className="h-7 w-7 text-gray-400" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-gray-900">
          No countries found
        </h3>

        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
          There are no countries available to display.
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Reusable Actions
  |--------------------------------------------------------------------------
  */

  const renderActions = (country, mobile = false) => {
    const countryUrl = country.countryId
      ? `${COUNTRY_INDEX_PATH}/${encodeURIComponent(
        country.countryId
      )}`
      : COUNTRY_INDEX_PATH;

    const editUrl = `${countryUrl}/edit`;
    const deleteUrl = `${countryUrl}/delete`;

    const viewClass = mobile
      ? "inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
      : "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700";

    const editClass = mobile
      ? "inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
      : "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600";

    const deleteClass = mobile
      ? "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
      : "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600";

    if (!country.countryId) {
      return (
        <span className="text-xs text-gray-400">
          No country ID
        </span>
      );
    }

    return (
      <div
        className={`flex items-center ${mobile ? "gap-2" : "justify-end gap-1.5"
          }`}
      >
        {/* View */}

        <Link
          to={countryUrl}
          onClick={(event) => handleView(event, country)}
          className={viewClass}
          title="View country"
          aria-label={`View ${country.countryName}`}
        >
          <Eye
            className={mobile ? "h-4 w-4" : "h-3.5 w-3.5"}
          />

          {mobile && "View"}
        </Link>

        {/* Edit */}

        <Link
          to={editUrl}
          onClick={(event) => handleEdit(event, country)}
          className={editClass}
          title="Edit country"
          aria-label={`Edit ${country.countryName}`}
        >
          <Pencil
            className={mobile ? "h-4 w-4" : "h-3.5 w-3.5"}
          />

          {mobile && "Edit"}
        </Link>

        {/* Delete - Always navigate to DeleteCountry */}

        <Link
          to={deleteUrl}
          className={deleteClass}
          title="Delete country"
          aria-label={`Delete ${country.countryName}`}
        >
          <Trash2
            className={mobile ? "h-4 w-4" : "h-3.5 w-3.5"}
          />

          {mobile && (
            <span className="sr-only">Delete</span>
          )}
        </Link>
      </div>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Main Table
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-w-0">
      {/* Desktop Table */}

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-[1100px] w-full table-auto">
          <thead className="bg-gray-50/70">
            <tr>
              {[
                "Country",
                "Country Code",
                "Phone Code",
                "Currency",
                "Status",
                "Created Date",
              ].map((heading) => (
                <th
                  key={heading}
                  className="min-w-[130px] whitespace-nowrap px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500"
                >
                  {heading}
                </th>
              ))}

              <th className="min-w-[135px] whitespace-nowrap px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {normalizedCountries.map((country) => (
              <tr
                key={country.key}
                className="group transition-colors duration-150 hover:bg-gray-50/60"
              >
                {/* Country */}

                <td className="px-5 py-5 align-middle">
                  <CountryIdentity
                    countryName={country.countryName}
                    slug={country.slug}
                  />
                </td>

                {/* Country Code */}

                <td className="px-5 py-5 align-middle">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                    </div>

                    <span className="text-sm font-bold tracking-wide text-gray-800">
                      {country.countryCode}
                    </span>
                  </div>
                </td>

                {/* Phone Code */}

                <td className="px-5 py-5 align-middle">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    </div>

                    <span className="whitespace-nowrap text-sm font-medium text-gray-700">
                      {country.phoneCode}
                    </span>
                  </div>
                </td>

                {/* Currency */}

                <td className="px-5 py-5 align-middle">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                      <Coins className="h-3.5 w-3.5 text-amber-600" />
                    </div>

                    <div className="min-w-0">
                      <div
                        className="text-sm font-bold text-gray-800"
                        title={country.currency.name}
                      >
                        {country.currency.code}
                      </div>

                      {country.currency.symbol && (
                        <div className="mt-0.5 text-[11px] text-gray-500">
                          {country.currency.symbol}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Status */}

                <td className="px-5 py-5 align-middle">
                  <CountryStatusBadge status={country.status} />
                </td>

                {/* Created Date */}

                <td className="px-5 py-5 align-middle">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-400" />

                    <span className="whitespace-nowrap text-sm font-medium text-gray-700">
                      {formatDate(country.createdAt)}
                    </span>
                  </div>
                </td>

                {/* Actions */}

                <td className="px-5 py-5 align-middle">
                  {renderActions(country)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}

      <div className="divide-y divide-gray-100 lg:hidden">
        {normalizedCountries.map((country) => (
          <div
            key={country.key}
            className="p-4 transition-colors hover:bg-gray-50/60"
          >
            {/* Country Header */}

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CountryIdentity
                  countryName={country.countryName}
                  slug={country.slug}
                  mobile
                />
              </div>

              <div className="shrink-0">
                <CountryStatusBadge status={country.status} />
              </div>
            </div>

            {/* Country Information */}

            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 rounded-xl bg-gray-50/70 p-3">
              {/* Country Code */}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <FileText className="h-3 w-3" />
                  Country Code
                </div>

                <div className="mt-1.5 truncate text-sm font-bold tracking-wide text-gray-800">
                  {country.countryCode}
                </div>
              </div>

              {/* Phone Code */}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <Phone className="h-3 w-3" />
                  Phone Code
                </div>

                <div className="mt-1.5 truncate text-sm font-semibold text-gray-800">
                  {country.phoneCode}
                </div>
              </div>

              {/* Currency */}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <Coins className="h-3 w-3" />
                  Currency
                </div>

                <div
                  className="mt-1.5 truncate text-sm font-bold text-gray-800"
                  title={country.currency.name}
                >
                  {country.currency.code}
                </div>

                {country.currency.symbol && (
                  <div className="mt-0.5 text-xs text-gray-500">
                    {country.currency.symbol}
                  </div>
                )}
              </div>

              {/* Created Date */}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <CalendarDays className="h-3 w-3" />
                  Created Date
                </div>

                <div className="mt-1.5 truncate text-sm font-medium text-gray-800">
                  {formatDate(country.createdAt)}
                </div>
              </div>
            </div>

            {/* Actions */}

            <div className="mt-4">
              {renderActions(country, true)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountryTable;
