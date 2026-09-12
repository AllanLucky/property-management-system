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
| Lease Table Row Skeleton
|--------------------------------------------------------------------------
*/

function LeaseRowSkeleton() {
  return (
    <tr className="border-b border-gray-100 last:border-b-0">
      {/* Lease */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-lg" />

          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        </div>
      </td>

      {/* Tenant */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-3 w-40" />
        </div>
      </td>

      {/* Property / Unit */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      </td>

      {/* Lease Period */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      </td>

      {/* Financial Terms */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-3 w-20" />
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <SkeletonBlock className="h-6 w-20 rounded-full" />
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
| Mobile Card Skeleton
|--------------------------------------------------------------------------
*/

function LeaseCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-lg" />

          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-3 w-36" />
          </div>
        </div>

        <SkeletonBlock className="h-6 w-20 shrink-0 rounded-full" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-4 w-28" />
        </div>

        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-4 w-24" />
        </div>

        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-4 w-28" />
        </div>

        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-4 w-24" />
        </div>
      </div>

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

function LeaseStatsSkeleton() {
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

function LeaseHeaderSkeleton() {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-40" />
        <SkeletonBlock className="h-4 w-64" />
      </div>

      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-10 w-24 rounded-lg" />
        <SkeletonBlock className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Filter Skeleton
|--------------------------------------------------------------------------
*/

function LeaseFiltersSkeleton() {
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>

        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>

        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>

        <div className="flex items-end gap-2">
          <SkeletonBlock className="h-10 flex-1 rounded-lg" />
          <SkeletonBlock className="h-10 w-10 rounded-lg" />
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

function LeasePaginationSkeleton() {
  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <SkeletonBlock className="h-4 w-40" />

      <div className="flex items-center gap-2">
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

function LeaseTableSkeleton({
  rows = DEFAULT_ROWS,
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
                <SkeletonBlock className="h-3 w-16" />
              </th>

              <th className="px-6 py-4 text-left">
                <SkeletonBlock className="h-3 w-16" />
              </th>

              <th className="px-6 py-4 text-left">
                <SkeletonBlock className="h-3 w-24" />
              </th>

              <th className="px-6 py-4 text-left">
                <SkeletonBlock className="h-3 w-20" />
              </th>

              <th className="px-6 py-4 text-left">
                <SkeletonBlock className="h-3 w-24" />
              </th>

              <th className="px-6 py-4 text-left">
                <SkeletonBlock className="h-3 w-16" />
              </th>

              <th className="px-6 py-4 text-right">
                <SkeletonBlock className="ml-auto h-3 w-16" />
              </th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: safeRows }).map((_, index) => (
              <LeaseRowSkeleton key={index} />
            ))}
          </tbody>
        </table>
      </div>

      <LeasePaginationSkeleton />
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Mobile List Skeleton
|--------------------------------------------------------------------------
*/

function LeaseMobileSkeleton({
  rows = 6,
}) {
  const safeRows =
    Number.isFinite(Number(rows)) && Number(rows) > 0
      ? Math.floor(Number(rows))
      : 6;

  return (
    <div className="grid grid-cols-1 gap-4 lg:hidden">
      {Array.from({ length: safeRows }).map((_, index) => (
        <LeaseCardSkeleton key={index} />
      ))}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Full Lease List Skeleton
|--------------------------------------------------------------------------
*/

export default function LeaseSkeleton({
  rows = DEFAULT_ROWS,
  showHeader = true,
  showStats = false,
  showFilters = true,
  showPagination = true,
  className = "",
}) {
  return (
    <div
      className={`w-full ${className}`}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading leases"
    >
      {/* Header */}
      {showHeader && <LeaseHeaderSkeleton />}

      {/* Statistics */}
      {showStats && (
        <div className="mb-6">
          <LeaseStatsSkeleton />
        </div>
      )}

      {/* Filters */}
      {showFilters && <LeaseFiltersSkeleton />}

      {/* Desktop Table */}
      <LeaseTableSkeleton rows={rows} />

      {/* Mobile Cards */}
      <LeaseMobileSkeleton rows={rows} />

      {/* Optional standalone pagination */}
      {showPagination && (
        <div className="mt-4 lg:hidden">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <LeasePaginationSkeleton />
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
| Exporting these allows individual Lease pages/components to reuse
| specific skeleton sections when needed.
|
|--------------------------------------------------------------------------
*/

export {
  SkeletonBlock,
  LeaseRowSkeleton,
  LeaseCardSkeleton,
  LeaseStatsSkeleton,
  LeaseHeaderSkeleton,
  LeaseFiltersSkeleton,
  LeasePaginationSkeleton,
  LeaseTableSkeleton,
  LeaseMobileSkeleton,
};