const TenancySkeleton = ({ rows = 6 }) => {
  const safeRows =
    Number.isFinite(Number(rows)) && Number(rows) > 0
      ? Math.min(Math.floor(Number(rows)), 20)
      : 6;

  return (
    <div className="space-y-6">
      {/* ================================================================== */}
      {/* HEADER / PAGE SUMMARY */}
      {/* ================================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-11 w-11 rounded-xl" />

            <div className="space-y-2">
              <SkeletonBox className="h-5 w-40" />
              <SkeletonBox className="h-4 w-64 max-w-full" />
            </div>
          </div>

          <SkeletonBox className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* ================================================================== */}
      {/* STATISTICS */}
      {/* ================================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>

      {/* ================================================================== */}
      {/* FILTERS */}
      {/* ================================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-9 w-9 rounded-lg" />

            <div className="space-y-2">
              <SkeletonBox className="h-4 w-28" />
              <SkeletonBox className="h-3 w-48" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
          <FilterSkeleton />
          <FilterSkeleton />
          <FilterSkeleton />
          <FilterSkeleton />
        </div>
      </div>

      {/* ================================================================== */}
      {/* TABLE */}
      {/* ================================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Table header */}

        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <SkeletonBox className="h-5 w-36" />
              <SkeletonBox className="h-3 w-56" />
            </div>

            <SkeletonBox className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        {/* Desktop table */}

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <TableHeaderSkeleton width="w-32" />
                <TableHeaderSkeleton width="w-36" />
                <TableHeaderSkeleton width="w-32" />
                <TableHeaderSkeleton width="w-28" />
                <TableHeaderSkeleton width="w-28" />
                <TableHeaderSkeleton width="w-24" />
                <TableHeaderSkeleton width="w-20" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {Array.from({ length: safeRows }).map((_, index) => (
                <TenancyRowSkeleton key={`tenancy-row-${index}`} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}

        <div className="divide-y divide-gray-100 md:hidden">
          {Array.from({ length: Math.min(safeRows, 5) }).map(
            (_, index) => (
              <MobileTenancySkeleton
                key={`mobile-tenancy-${index}`}
              />
            )
          )}
        </div>

        {/* Pagination */}

        <div className="border-t border-gray-200 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SkeletonBox className="h-4 w-40" />

            <div className="flex items-center gap-2">
              <SkeletonBox className="h-9 w-9 rounded-lg" />
              <SkeletonBox className="h-9 w-9 rounded-lg" />
              <SkeletonBox className="h-9 w-9 rounded-lg" />
              <SkeletonBox className="h-9 w-9 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ============================================================================
 * GENERIC SKELETON BOX
 * ============================================================================
 */

const SkeletonBox = ({ className = "" }) => {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
    />
  );
};

/**
 * ============================================================================
 * STAT SKELETON
 * ============================================================================
 */

const StatSkeleton = () => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-7 w-16" />
          <SkeletonBox className="h-3 w-32" />
        </div>

        <SkeletonBox className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
};

/**
 * ============================================================================
 * FILTER SKELETON
 * ============================================================================
 */

const FilterSkeleton = () => {
  return (
    <div className="space-y-2">
      <SkeletonBox className="h-3.5 w-24" />

      <SkeletonBox className="h-10 w-full rounded-lg" />
    </div>
  );
};

/**
 * ============================================================================
 * TABLE HEADER SKELETON
 * ============================================================================
 */

const TableHeaderSkeleton = ({ width = "w-24" }) => {
  return (
    <th className="px-5 py-3 text-left">
      <SkeletonBox className={`h-3 ${width}`} />
    </th>
  );
};

/**
 * ============================================================================
 * DESKTOP TENANCY ROW
 * ============================================================================
 */

const TenancyRowSkeleton = () => {
  return (
    <tr>
      {/* Tenancy number */}

      <td className="whitespace-nowrap px-5 py-4">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-9 w-9 shrink-0 rounded-lg" />

          <div className="space-y-2">
            <SkeletonBox className="h-4 w-28" />
            <SkeletonBox className="h-3 w-20" />
          </div>
        </div>
      </td>

      {/* Tenant */}

      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-9 w-9 shrink-0 rounded-full" />

          <div className="space-y-2">
            <SkeletonBox className="h-4 w-32" />
            <SkeletonBox className="h-3 w-40" />
          </div>
        </div>
      </td>

      {/* Property */}

      <td className="px-5 py-4">
        <div className="space-y-2">
          <SkeletonBox className="h-4 w-32" />
          <SkeletonBox className="h-3 w-24" />
        </div>
      </td>

      {/* Unit */}

      <td className="px-5 py-4">
        <div className="space-y-2">
          <SkeletonBox className="h-4 w-20" />
          <SkeletonBox className="h-3 w-16" />
        </div>
      </td>

      {/* Dates */}

      <td className="px-5 py-4">
        <div className="space-y-2">
          <SkeletonBox className="h-4 w-24" />
          <SkeletonBox className="h-3 w-24" />
        </div>
      </td>

      {/* Status */}

      <td className="px-5 py-4">
        <SkeletonBox className="h-6 w-20 rounded-full" />
      </td>

      {/* Actions */}

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-8 w-8 rounded-lg" />
          <SkeletonBox className="h-8 w-8 rounded-lg" />
        </div>
      </td>
    </tr>
  );
};

/**
 * ============================================================================
 * MOBILE TENANCY SKELETON
 * ============================================================================
 */

const MobileTenancySkeleton = () => {
  return (
    <div className="p-5">
      {/* Top */}

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <SkeletonBox className="h-10 w-10 shrink-0 rounded-lg" />

          <div className="min-w-0 space-y-2">
            <SkeletonBox className="h-4 w-28" />
            <SkeletonBox className="h-3 w-36" />
          </div>
        </div>

        <SkeletonBox className="h-6 w-20 shrink-0 rounded-full" />
      </div>

      {/* Tenant */}

      <div className="mt-5 flex items-center gap-3">
        <SkeletonBox className="h-9 w-9 shrink-0 rounded-full" />

        <div className="space-y-2">
          <SkeletonBox className="h-4 w-32" />
          <SkeletonBox className="h-3 w-40" />
        </div>
      </div>

      {/* Details */}

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-4 w-28" />
        </div>

        <div className="space-y-2">
          <SkeletonBox className="h-3 w-16" />
          <SkeletonBox className="h-4 w-24" />
        </div>

        <div className="space-y-2">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-4 w-24" />
        </div>

        <div className="space-y-2">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-4 w-24" />
        </div>
      </div>

      {/* Actions */}

      <div className="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
        <SkeletonBox className="h-9 w-20 rounded-lg" />
        <SkeletonBox className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  );
};

export default TenancySkeleton;