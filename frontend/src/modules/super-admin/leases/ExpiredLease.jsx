import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

import { useLease } from "../../../hooks/useLease";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const LEASE_ROUTES = {
  index: "/super-admin/leases",
};

const DEFAULT_PAGE_SIZE = 10;

/*
|--------------------------------------------------------------------------
| Formatting Helpers
|--------------------------------------------------------------------------
*/

const safeText = (value, fallback = "—") => {
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

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const formatCurrency = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(numericValue);
};

const formatNumber = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0";
  }

  return new Intl.NumberFormat("en-KE").format(
    numericValue
  );
};

const formatStatus = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Unknown";
  }

  if (typeof value === "object") {
    return "Unknown";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

/*
|--------------------------------------------------------------------------
| API / Collection Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely extract a collection from common Laravel API
 * response structures.
 */
const getCollection = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.data?.data)) {
    return value.data.data;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  if (Array.isArray(value?.results)) {
    return value.results;
  }

  return [];
};

/**
 * Extract pagination from common Laravel response structures.
 */
const getPagination = (
  value,
  fallbackLength = 0
) => {
  const pagination =
    value?.meta ||
    value?.pagination ||
    value?.data?.meta ||
    value?.data?.pagination ||
    null;

  if (
    !pagination ||
    typeof pagination !== "object"
  ) {
    return {
      currentPage: 1,
      lastPage: 1,
      perPage: DEFAULT_PAGE_SIZE,
      total: fallbackLength,
      from:
        fallbackLength > 0
          ? 1
          : 0,
      to: fallbackLength,
    };
  }

  return {
    currentPage: Number(
      pagination.current_page ??
      pagination.currentPage ??
      1
    ),

    lastPage: Number(
      pagination.last_page ??
      pagination.lastPage ??
      1
    ),

    perPage: Number(
      pagination.per_page ??
      pagination.perPage ??
      DEFAULT_PAGE_SIZE
    ),

    total: Number(
      pagination.total ??
      fallbackLength
    ),

    from: Number(
      pagination.from ??
      (fallbackLength > 0
        ? 1
        : 0)
    ),

    to: Number(
      pagination.to ??
      fallbackLength
    ),
  };
};

/*
|--------------------------------------------------------------------------
| Tenant Helpers
|--------------------------------------------------------------------------
*/

const getTenant = (lease) => {
  return (
    lease?.tenancy?.tenant ||
    lease?.tenant ||
    null
  );
};

const getTenantUser = (lease) => {
  return (
    lease?.tenancy?.tenant?.user ||
    lease?.tenant?.user ||
    null
  );
};

const getTenantName = (lease) => {
  const tenant = getTenant(lease);
  const user = getTenantUser(lease);

  if (
    tenant?.full_name &&
    typeof tenant.full_name === "string"
  ) {
    return tenant.full_name;
  }

  if (
    user?.full_name &&
    typeof user.full_name === "string"
  ) {
    return user.full_name;
  }

  const tenantName = [
    tenant?.first_name,
    tenant?.other_names,
    tenant?.middle_name,
    tenant?.last_name,
  ]
    .filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== ""
    )
    .join(" ")
    .trim();

  if (tenantName) {
    return tenantName;
  }

  const userName = [
    user?.first_name,
    user?.other_names,
    user?.middle_name,
    user?.last_name,
  ]
    .filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== ""
    )
    .join(" ")
    .trim();

  return userName || "No tenant assigned";
};

const getTenantEmail = (lease) => {
  const tenant = getTenant(lease);
  const user = getTenantUser(lease);

  return (
    tenant?.email ||
    user?.email ||
    "—"
  );
};

const getTenantPhone = (lease) => {
  const tenant = getTenant(lease);
  const user = getTenantUser(lease);

  return (
    tenant?.phone ||
    user?.phone ||
    "—"
  );
};

/*
|--------------------------------------------------------------------------
| Property Helpers
|--------------------------------------------------------------------------
*/

const getProperty = (lease) => {
  return (
    lease?.tenancy?.property ||
    lease?.property ||
    null
  );
};

const getPropertyName = (lease) => {
  const property = getProperty(lease);

  return (
    property?.name ||
    property?.property_name ||
    property?.title ||
    "Property not assigned"
  );
};

const getApartmentName = (lease) => {
  const apartment =
    lease?.tenancy?.apartment ||
    lease?.apartment ||
    null;

  return (
    apartment?.name ||
    apartment?.apartment_name ||
    apartment?.title ||
    null
  );
};

const getUnitName = (lease) => {
  const unit =
    lease?.tenancy?.unit ||
    lease?.unit ||
    null;

  return (
    unit?.unit_name ||
    unit?.name ||
    unit?.unit_number ||
    null
  );
};

const getLocation = (lease) => {
  const property = getProperty(lease);

  return (
    property?.location ||
    property?.address ||
    property?.city ||
    null
  );
};

/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

function ExpiredBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Expired
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Summary Card
|--------------------------------------------------------------------------
*/

function SummaryCard({
  icon: Icon,
  title,
  value,
  description,
  loading = false,
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>

          {loading ? (
            <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-slate-200" />
          ) : (
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {typeof value === "string"
                ? value
                : formatNumber(value)}
            </p>
          )}

          {description && (
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 transition group-hover:bg-slate-100">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Loading State
|--------------------------------------------------------------------------
*/

function LoadingState() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>

        <h3 className="mt-5 text-sm font-bold text-slate-900">
          Loading expired leases
        </h3>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          Please wait while we retrieve expired lease
          records.
        </p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

function EmptyState({
  onRefresh,
  loading,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>

        <h3 className="mt-5 text-base font-bold text-slate-900">
          No expired leases
        </h3>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          Great news. There are currently no lease
          agreements recorded as expired.
        </p>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={
              loading
                ? "h-4 w-4 animate-spin"
                : "h-4 w-4"
            }
          />

          Refresh records
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Error State
|--------------------------------------------------------------------------
*/

function ErrorState({
  error,
  onRetry,
  loading,
}) {
  const message =
    typeof error === "string"
      ? error
      : error?.message ||
      "Unable to load expired leases. Please try again.";

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-red-900">
            Unable to load expired leases
          </h3>

          <p className="mt-1 text-sm leading-6 text-red-700">
            {message}
          </p>

          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            {loading
              ? "Retrying..."
              : "Try again"}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Lease Row
|--------------------------------------------------------------------------
*/

function LeaseRow({
  lease,
  onView,
}) {
  const tenantName = getTenantName(lease);
  const tenantEmail = getTenantEmail(lease);
  const tenantPhone = getTenantPhone(lease);

  const propertyName = getPropertyName(lease);
  const apartmentName = getApartmentName(lease);
  const unitName = getUnitName(lease);
  const location = getLocation(lease);

  const leaseNumber = safeText(
    lease?.lease_number,
    lease?.id
      ? `Lease #${lease.id}`
      : "Lease"
  );

  const startDate =
    lease?.start_date ||
    lease?.starts_at ||
    lease?.lease_start_date;

  const endDate =
    lease?.end_date ||
    lease?.ends_at ||
    lease?.lease_end_date;

  const rentAmount =
    lease?.rent_amount ??
    lease?.monthly_rent ??
    lease?.amount ??
    lease?.tenancy?.rent_amount;

  const paymentFrequency =
    lease?.payment_frequency ||
    lease?.tenancy?.payment_frequency ||
    "monthly";

  return (
    <tr className="group border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/80">
      {/* Lease */}
      <td className="px-5 py-5 align-top">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            <FileText className="h-[18px] w-[18px] text-slate-500" />
          </div>

          <div className="min-w-0">
            <button
              type="button"
              onClick={() =>
                onView(lease?.id)
              }
              className="block max-w-[180px] truncate text-left text-sm font-bold text-slate-900 transition hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {leaseNumber}
            </button>

            {lease?.tenancy?.tenancy_number && (
              <p className="mt-1 truncate text-xs text-slate-400">
                {lease.tenancy.tenancy_number}
              </p>
            )}

            <div className="mt-2">
              <ExpiredBadge />
            </div>
          </div>
        </div>
      </td>

      {/* Tenant */}
      <td className="px-5 py-5 align-top">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <UserRound className="h-4 w-4 text-blue-600" />
          </div>

          <div className="min-w-0">
            <p className="max-w-[190px] truncate text-sm font-semibold text-slate-900">
              {tenantName}
            </p>

            {tenantEmail !== "—" && (
              <p className="mt-1 max-w-[210px] truncate text-xs text-slate-500">
                {tenantEmail}
              </p>
            )}

            {tenantPhone !== "—" && (
              <p className="mt-0.5 text-xs text-slate-500">
                {tenantPhone}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Property */}
      <td className="px-5 py-5 align-top">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <Building2 className="h-4 w-4 text-emerald-600" />
          </div>

          <div className="min-w-0">
            <p className="max-w-[220px] truncate text-sm font-semibold text-slate-900">
              {safeText(propertyName)}
            </p>

            {location && (
              <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                {safeText(location)}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-1.5">
              {apartmentName && (
                <span className="max-w-[120px] truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
                  {safeText(apartmentName)}
                </span>
              )}

              {unitName && (
                <span className="max-w-[120px] truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
                  Unit {safeText(unitName)}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Dates */}
      <td className="px-5 py-5 align-top">
        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Started
              </p>

              <p className="mt-0.5 text-sm font-medium text-slate-700">
                {formatDate(startDate)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                Expired
              </p>

              <p className="mt-0.5 text-sm font-bold text-red-700">
                {formatDate(endDate)}
              </p>
            </div>
          </div>
        </div>
      </td>

      {/* Rent */}
      <td className="px-5 py-5 align-top">
        <div className="flex items-start gap-2.5">
          <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

          <div>
            <p className="text-sm font-bold text-slate-900">
              {formatCurrency(rentAmount)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {formatStatus(paymentFrequency)}
            </p>
          </div>
        </div>
      </td>

      {/* Action */}
      <td className="px-5 py-5 text-right align-top">
        <button
          type="button"
          onClick={() =>
            onView(lease?.id)
          }
          disabled={!lease?.id}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-slate-400 transition hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          title="View lease"
          aria-label={`View ${leaseNumber}`}
        >
          <Eye className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

function Pagination({
  currentPage,
  lastPage,
  total,
  from,
  to,
  onPrevious,
  onNext,
  loading,
}) {
  if (lastPage <= 1) {
    return null;
  }

  return (
    <div className="border-t border-slate-200 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 sm:text-sm">
          Showing{" "}
          <span className="font-semibold text-slate-700">
            {from}
          </span>{" "}
          –{" "}
          <span className="font-semibold text-slate-700">
            {to}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-700">
            {formatNumber(total)}
          </span>
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={
              loading ||
              currentPage <= 1
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />

            <span className="hidden sm:inline">
              Previous
            </span>
          </button>

          <div className="inline-flex h-9 min-w-[70px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700">
            {currentPage} / {lastPage}
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={
              loading ||
              currentPage >= lastPage
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="hidden sm:inline">
              Next
            </span>

            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

export default function ExpiredLease() {
  const navigate = useNavigate();

  const {
    /*
     * IMPORTANT:
     * Use expiredLeases, not leases.
     */
    expiredLeases: hookExpiredLeases = [],

    expiredPagination,

    loadingExpired,
    loadingExpireEnded,

    error,

    fetchExpired,
    expireEnded,
    clearError,
  } = useLease();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState(null);
  const [processing, setProcessing] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Normalize Expired Collection
  |--------------------------------------------------------------------------
  */

  const expiredLeases = useMemo(() => {
    return getCollection(
      hookExpiredLeases
    );
  }, [hookExpiredLeases]);

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const pagination = useMemo(() => {
    /*
     * Prefer pagination directly supplied
     * by the Redux hook.
     */
    if (
      expiredPagination &&
      typeof expiredPagination ===
      "object"
    ) {
      return {
        currentPage: Number(
          expiredPagination.current_page ??
          expiredPagination.currentPage ??
          page
        ),

        lastPage: Number(
          expiredPagination.last_page ??
          expiredPagination.lastPage ??
          1
        ),

        perPage: Number(
          expiredPagination.per_page ??
          expiredPagination.perPage ??
          DEFAULT_PAGE_SIZE
        ),

        total: Number(
          expiredPagination.total ??
          expiredLeases.length
        ),

        from: Number(
          expiredPagination.from ??
          (expiredLeases.length > 0
            ? 1
            : 0)
        ),

        to: Number(
          expiredPagination.to ??
          expiredLeases.length
        ),
      };
    }

    /*
     * Fallback for APIs where pagination
     * is embedded in the collection.
     */
    return getPagination(
      hookExpiredLeases,
      expiredLeases.length
    );
  }, [
    expiredPagination,
    hookExpiredLeases,
    expiredLeases.length,
    page,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleViewLease = useCallback(
    (leaseId) => {
      if (!leaseId) {
        return;
      }

      navigate(
        `/super-admin/leases/${leaseId}`
      );
    },
    [navigate]
  );

  /*
  |--------------------------------------------------------------------------
  | Load Expired Leases
  |--------------------------------------------------------------------------
  */

  const loadExpiredLeases =
    useCallback(
      async (targetPage = 1) => {
        try {
          clearError?.();
          setNotice(null);

          await fetchExpired({
            page: targetPage,
            per_page:
              DEFAULT_PAGE_SIZE,
          });

          setPage(targetPage);
        } catch (fetchError) {
          console.error(
            "Failed to load expired leases:",
            fetchError
          );
        }
      },
      [
        clearError,
        fetchExpired,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadExpiredLeases(1);
  }, [loadExpiredLeases]);

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const filteredLeases = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    if (!normalizedSearch) {
      return expiredLeases;
    }

    return expiredLeases.filter(
      (lease) => {
        const searchableValues = [
          lease?.lease_number,
          lease?.status,
          lease?.tenancy?.tenancy_number,

          getTenantName(lease),
          getTenantEmail(lease),
          getTenantPhone(lease),

          getPropertyName(lease),
          getApartmentName(lease),
          getUnitName(lease),
        ];

        return searchableValues.some(
          (value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(
                normalizedSearch
              )
        );
      }
    );
  }, [
    expiredLeases,
    search,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Clear Search
  |--------------------------------------------------------------------------
  */

  const clearSearch = useCallback(() => {
    setSearch("");
    setPage(1);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const handleRefresh = useCallback(() => {
    loadExpiredLeases(page);
  }, [
    loadExpiredLeases,
    page,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Process Expired
  |--------------------------------------------------------------------------
  */

  const handleProcessExpired =
    useCallback(async () => {
      if (
        processing ||
        loadingExpireEnded
      ) {
        return;
      }

      try {
        setProcessing(true);
        clearError?.();
        setNotice(null);

        const result =
          await expireEnded();

        const expiredCount = Number(
          result?.expired_count ??
          result?.data?.expired_count ??
          result?.data?.data
            ?.expired_count ??
          0
        );

        setNotice({
          type:
            expiredCount > 0
              ? "success"
              : "info",

          message:
            expiredCount > 0
              ? `${formatNumber(
                expiredCount
              )} lease${expiredCount === 1
                ? ""
                : "s"
              } expired successfully.`
              : "No active leases required expiration.",
        });

        await loadExpiredLeases(1);
        setPage(1);
      } catch (processError) {
        console.error(
          "Failed to process expired leases:",
          processError
        );

        setNotice({
          type: "error",
          message:
            processError?.message ||
            "Unable to process expired leases.",
        });
      } finally {
        setProcessing(false);
      }
    }, [
      processing,
      loadingExpireEnded,
      clearError,
      expireEnded,
      loadExpiredLeases,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Pagination Actions
  |--------------------------------------------------------------------------
  */

  const handlePrevious =
    useCallback(() => {
      if (
        page <= 1 ||
        loadingExpired
      ) {
        return;
      }

      loadExpiredLeases(page - 1);
    }, [
      page,
      loadingExpired,
      loadExpiredLeases,
    ]);

  const handleNext =
    useCallback(() => {
      if (
        page >= pagination.lastPage ||
        loadingExpired
      ) {
        return;
      }

      loadExpiredLeases(page + 1);
    }, [
      page,
      pagination.lastPage,
      loadingExpired,
      loadExpiredLeases,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Summary
  |--------------------------------------------------------------------------
  */

  const expiredCount =
    pagination.total ||
    expiredLeases.length;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">

        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    LEASE_ROUTES.index
                  )
                }
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                title="Back to leases"
                aria-label="Back to leases"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    Expired Leases
                  </h1>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />

                    {formatNumber(
                      expiredCount
                    )}{" "}
                    {expiredCount === 1
                      ? "lease"
                      : "leases"}
                  </span>
                </div>

                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                  Review lease agreements that have
                  reached their contractual end date.
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loadingExpired}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={
                    loadingExpired
                      ? "h-4 w-4 animate-spin"
                      : "h-4 w-4"
                  }
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={
                  handleProcessExpired
                }
                disabled={
                  processing ||
                  loadingExpireEnded
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ||
                  loadingExpireEnded ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}

                {processing ||
                  loadingExpireEnded
                  ? "Processing..."
                  : "Process Expired"}
              </button>
            </div>
          </div>
        </header>

        {/* Notice */}
        {notice && (
          <div
            className={`mb-6 rounded-2xl border p-4 shadow-sm ${notice.type === "success"
                ? "border-emerald-200 bg-emerald-50"
                : notice.type === "error"
                  ? "border-red-200 bg-red-50"
                  : "border-blue-200 bg-blue-50"
              }`}
          >
            <div className="flex items-start gap-3">
              {notice.type ===
                "success" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle
                  className={`mt-0.5 h-5 w-5 shrink-0 ${notice.type ===
                      "error"
                      ? "text-red-600"
                      : "text-blue-600"
                    }`}
                />
              )}

              <p
                className={`min-w-0 flex-1 text-sm font-medium leading-6 ${notice.type ===
                    "success"
                    ? "text-emerald-800"
                    : notice.type ===
                      "error"
                      ? "text-red-800"
                      : "text-blue-800"
                  }`}
              >
                {notice.message}
              </p>

              <button
                type="button"
                onClick={() =>
                  setNotice(null)
                }
                className="rounded-lg p-1 text-slate-500 transition hover:bg-black/5 hover:text-slate-800"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error &&
          !loadingExpired && (
            <div className="mb-6">
              <ErrorState
                error={error}
                onRetry={() =>
                  loadExpiredLeases(
                    page
                  )
                }
                loading={
                  loadingExpired
                }
              />
            </div>
          )}

        {/* Summary */}
        {!error && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard
              icon={FileText}
              title="Expired Leases"
              value={expiredCount}
              description="Persisted expired lease records"
              loading={
                loadingExpired
              }
            />

            <SummaryCard
              icon={CalendarDays}
              title="Current Page"
              value={page}
              description={`Page ${page} of ${Math.max(
                pagination.lastPage,
                1
              )}`}
              loading={
                loadingExpired
              }
            />

            <SummaryCard
              icon={CheckCircle2}
              title="Lifecycle"
              value={
                expiredCount > 0
                  ? "Expired"
                  : "Clear"
              }
              description="Automatic lease expiration tracking"
              loading={
                loadingExpired
              }
            />
          </div>
        )}

        {/* Search */}
        {!error && (
          <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xl">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(
                      event.target.value
                    );
                    setPage(1);
                  }}
                  placeholder="Search lease, tenant, property or unit..."
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />

                {search && (
                  <button
                    type="button"
                    onClick={
                      clearSearch
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 text-xs text-slate-500 sm:text-sm lg:justify-end">
                <span>
                  {search
                    ? `${formatNumber(
                      filteredLeases.length
                    )} matching`
                    : `${formatNumber(
                      expiredLeases.length
                    )} displayed`}
                </span>

                {search && (
                  <button
                    type="button"
                    onClick={
                      clearSearch
                    }
                    className="font-semibold text-slate-700 transition hover:text-slate-900"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Table */}
        {loadingExpired ? (
          <LoadingState />
        ) : !error &&
          expiredLeases.length ===
          0 ? (
          <EmptyState
            onRefresh={
              handleRefresh
            }
            loading={
              loadingExpired
            }
          />
        ) : !error ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Expired lease records
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Contractual agreements requiring attention
                </p>
              </div>

              <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 sm:flex">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Expired
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Lease
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Tenant
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Property / Unit
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Contract Dates
                    </th>

                    <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Rent
                    </th>

                    <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLeases.length >
                    0 ? (
                    filteredLeases.map(
                      (lease) => (
                        <LeaseRow
                          key={
                            lease?.id ||
                            lease?.lease_number
                          }
                          lease={lease}
                          onView={
                            handleViewLease
                          }
                        />
                      )
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-16 text-center"
                      >
                        <div className="mx-auto flex max-w-md flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                            <Search className="h-6 w-6 text-slate-400" />
                          </div>

                          <h3 className="mt-4 text-sm font-bold text-slate-900">
                            No matching leases
                          </h3>

                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            We couldn't find any expired
                            leases matching your search.
                          </p>

                          <button
                            type="button"
                            onClick={
                              clearSearch
                            }
                            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                          >
                            <X className="h-4 w-4" />
                            Clear search
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!search && (
              <Pagination
                currentPage={
                  pagination.currentPage ||
                  page
                }
                lastPage={
                  pagination.lastPage ||
                  1
                }
                total={
                  pagination.total ||
                  expiredLeases.length
                }
                from={
                  pagination.from ||
                  (expiredLeases.length
                    ? 1
                    : 0)
                }
                to={
                  pagination.to ||
                  expiredLeases.length
                }
                onPrevious={
                  handlePrevious
                }
                onNext={handleNext}
                loading={
                  loadingExpired
                }
              />
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}