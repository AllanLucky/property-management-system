
const DEFAULT_ROWS = 8;

/*
|--------------------------------------------------------------------------
| Skeleton Primitive
|--------------------------------------------------------------------------
*/

function SkeletonBlock({
  className = "",
}) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-gray-200 ${className}`}
    />
  );
}

/*
|--------------------------------------------------------------------------
| Country Table Row Skeleton
|--------------------------------------------------------------------------
*/

function CountryRowSkeleton() {
  return (
    <tr className="border-b border-gray-100 last:border-b-0">
      {/* Country */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-lg" />

          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
        </div>
      </td>

      {/* Country Code */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-3 w-20" />
        </div>
      </td>

      {/* Phone Code */}
      <td className="px-6 py-4">
        <SkeletonBlock className="h-4 w-20" />
      </td>

      {/* Currency */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <SkeletonBlock className="h-6 w-20 rounded-full" />
      </td>

      {/* Created Date */}
      <td className="px-6 py-4">
        <SkeletonBlock className="h-4 w-24" />
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-8 w-8 rounded-lg" />
          <SkeletonBlock className="h-8 w-8 rounded-lg" />
          <SkeletonBlock className="h-8 w-8 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

/*
|--------------------------------------------------------------------------
| Mobile Country Card Skeleton
|--------------------------------------------------------------------------
*/

function CountryCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Country Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SkeletonBlock className="h-11 w-11 shrink-0 rounded-lg" />

          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
        </div>

        <SkeletonBlock className="h-6 w-20 shrink-0 rounded-full" />
      </div>

      {/* Country Information */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-4 w-16" />
        </div>

        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-4 w-20" />
        </div>

        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-4 w-16" />
        </div>

        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-4 w-24" />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Statistics Skeleton
|--------------------------------------------------------------------------
*/

function CountryStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-8 w-16" />
              <SkeletonBlock className="h-3 w-28" />
            </div>

            <SkeletonBlock className="h-11 w-11 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Header Skeleton
|--------------------------------------------------------------------------
*/

function CountryHeaderSkeleton() {
  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <SkeletonBlock className="hidden h-12 w-12 shrink-0 rounded-xl sm:block" />

          <div className="space-y-3">
            <SkeletonBlock className="h-7 w-40" />
            <SkeletonBlock className="h-4 w-64 max-w-full" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SkeletonBlock className="h-10 w-24 rounded-xl" />
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-3 w-2" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Filter Skeleton
|--------------------------------------------------------------------------
*/

function CountryFiltersSkeleton() {
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        {/* Search */}
        <div className="flex min-w-0 flex-1 gap-2">
          <SkeletonBlock className="h-11 flex-1 rounded-xl" />
          <SkeletonBlock className="h-11 w-24 rounded-xl" />
        </div>

        {/* Filter Actions */}
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-11 w-28 rounded-xl" />
          <SkeletonBlock className="h-11 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Pagination Skeleton
|--------------------------------------------------------------------------
*/

function CountryPaginationSkeleton() {
  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <SkeletonBlock className="h-4 w-44" />

      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Table Skeleton
|--------------------------------------------------------------------------
*/

function CountryTableSkeleton({
  rows = DEFAULT_ROWS,
  showPagination = true,
}) {
  const safeRows =
    Number.isFinite(Number(rows)) && Number(rows) > 0
      ? Math.floor(Number(rows))
      : DEFAULT_ROWS;

  return (
    <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-4 text-left">
                <SkeletonBlock className="h-3 w-20" />
              </th>

              <th className="px-6 py-4 text-left">
                <SkeletonBlock className="h-3 w-20" />
              </th>

              <th className="px-6 py-4 text-left">
                <SkeletonBlock className="h-3 w-20" />
              </th>

              <th className="px-6 py-4 text-left">
                <SkeletonBlock className="h-3 w-20" />
              </th>

              <th className="px-6 py-4 text-left">
                <SkeletonBlock className="h-3 w-16" />
              </th>

              <th className="px-6 py-4 text-left">
                <SkeletonBlock className="h-3 w-24" />
              </th>

              <th className="px-6 py-4 text-right">
                <SkeletonBlock className="ml-auto h-3 w-16" />
              </th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: safeRows }).map((_, index) => (
              <CountryRowSkeleton key={index} />
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && <CountryPaginationSkeleton />}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Mobile List Skeleton
|--------------------------------------------------------------------------
*/

function CountryMobileSkeleton({
  rows = 6,
}) {
  const safeRows =
    Number.isFinite(Number(rows)) && Number(rows) > 0
      ? Math.floor(Number(rows))
      : 6;

  return (
    <div className="grid grid-cols-1 gap-4 lg:hidden">
      {Array.from({ length: safeRows }).map((_, index) => (
        <CountryCardSkeleton key={index} />
      ))}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Full Country List Skeleton
|--------------------------------------------------------------------------
*/

export default function CountrySkeleton({
  rows = DEFAULT_ROWS,
  showHeader = true,
  showStats = true,
  showFilters = true,
  showPagination = true,
  className = "",
}) {
  return (
    <div
      className={`w-full ${className}`}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading countries"
    >
      {/* Header */}
      {showHeader && <CountryHeaderSkeleton />}

      {/* Statistics */}
      {showStats && (
        <div className="mb-6">
          <CountryStatsSkeleton />
        </div>
      )}

      {/* Filters */}
      {showFilters && <CountryFiltersSkeleton />}

      {/* Desktop Table */}
      <CountryTableSkeleton
        rows={rows}
        showPagination={showPagination}
      />

      {/* Mobile Cards */}
      <CountryMobileSkeleton rows={rows} />

      {/* Mobile Pagination */}
      {showPagination && (
        <div className="mt-4 lg:hidden">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <CountryPaginationSkeleton />
          </div>
        </div>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Named Skeleton Components
|--------------------------------------------------------------------------
|
| Reusable skeleton sections for Country Management pages.
|
|--------------------------------------------------------------------------
*/

export {
  SkeletonBlock,
  CountryRowSkeleton,
  CountryCardSkeleton,
  CountryStatsSkeleton,
  CountryHeaderSkeleton,
  CountryFiltersSkeleton,
  CountryPaginationSkeleton,
  CountryTableSkeleton,
  CountryMobileSkeleton,
};
