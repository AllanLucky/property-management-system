
const DEFAULT_ROWS = 8;

/*
|--------------------------------------------------------------------------
| Skeleton Primitive
|--------------------------------------------------------------------------
*/

function SkeletonBlock({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-gray-200 ${className}`}
    />
  );
}

/*
|--------------------------------------------------------------------------
| County Table Row Skeleton
|--------------------------------------------------------------------------
*/

function CountyRowSkeleton() {
  return (
    <tr className="border-b border-gray-100 last:border-b-0">
      {/* County */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-lg" />

          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
        </div>
      </td>

      {/* Country */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-8 w-8 shrink-0 rounded-lg" />

          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
        </div>
      </td>

      {/* Region */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-3 w-16" />
        </div>
      </td>

      {/* Location Records */}
      <td className="px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <SkeletonBlock className="h-4 w-10" />
          <SkeletonBlock className="h-4 w-10" />
          <SkeletonBlock className="h-4 w-10" />
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
        <div className="flex items-center justify-end gap-2">
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
| Mobile County Card Skeleton
|--------------------------------------------------------------------------
*/

function CountyCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* County Header */}
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

      {/* County Information */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        {/* Country */}
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-4 w-24" />
        </div>

        {/* Region */}
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-4 w-24" />
        </div>

        {/* Cities */}
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-4 w-12" />
        </div>

        {/* Areas */}
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-4 w-12" />
        </div>

        {/* Properties */}
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-4 w-12" />
        </div>

        {/* Created Date */}
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

function CountyStatsSkeleton() {
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

function CountyHeaderSkeleton() {
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

function CountyFiltersSkeleton() {
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

function CountyPaginationSkeleton() {
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

function CountyTableSkeleton({
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
                <SkeletonBlock className="h-3 w-28" />
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
              <CountyRowSkeleton key={index} />
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && <CountyPaginationSkeleton />}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Mobile List Skeleton
|--------------------------------------------------------------------------
*/

function CountyMobileSkeleton({ rows = 6 }) {
  const safeRows =
    Number.isFinite(Number(rows)) && Number(rows) > 0
      ? Math.floor(Number(rows))
      : 6;

  return (
    <div className="grid grid-cols-1 gap-4 lg:hidden">
      {Array.from({ length: safeRows }).map((_, index) => (
        <CountyCardSkeleton key={index} />
      ))}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Full County List Skeleton
|--------------------------------------------------------------------------
*/

export default function CountySkeleton({
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
      aria-label="Loading counties"
    >
      {/* Header */}
      {showHeader && <CountyHeaderSkeleton />}

      {/* Statistics */}
      {showStats && (
        <div className="mb-6">
          <CountyStatsSkeleton />
        </div>
      )}

      {/* Filters */}
      {showFilters && <CountyFiltersSkeleton />}

      {/* Desktop Table */}
      <CountyTableSkeleton
        rows={rows}
        showPagination={showPagination}
      />

      {/* Mobile Cards */}
      <CountyMobileSkeleton rows={rows} />

      {/* Mobile Pagination */}
      {showPagination && (
        <div className="mt-4 lg:hidden">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <CountyPaginationSkeleton />
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
| Reusable skeleton sections for County Management pages.
|
|--------------------------------------------------------------------------
*/

export {
  SkeletonBlock,
  CountyRowSkeleton,
  CountyCardSkeleton,
  CountyStatsSkeleton,
  CountyHeaderSkeleton,
  CountyFiltersSkeleton,
  CountyPaginationSkeleton,
  CountyTableSkeleton,
  CountyMobileSkeleton,
};
