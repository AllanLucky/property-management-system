const DEFAULT_ROWS = 6;
const MAX_ROWS = 20;
const MAX_MOBILE_ROWS = 5;


const SkeletonBox = ({
  className = "",
  rounded = "rounded-md",
}) => {
  return (
    <div
      aria-hidden="true"
      className={[
        "animate-pulse bg-gray-200",
        rounded,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
};

/*
|----------------------------------------------------------------------------
| Safe Row Count
|----------------------------------------------------------------------------
*/

/**
 * Normalize the requested number of skeleton rows.
 */
const getSafeRowCount = (rows) => {
  const numericRows = Number(rows);

  if (
    !Number.isFinite(numericRows) ||
    numericRows <= 0
  ) {
    return DEFAULT_ROWS;
  }

  return Math.min(
    Math.max(Math.floor(numericRows), 1),
    MAX_ROWS
  );
};

/*
|----------------------------------------------------------------------------
| Stat Skeleton
|----------------------------------------------------------------------------
*/

/**
 * Skeleton for one tenancy statistic card.
 */
const StatSkeleton = ({
  compact = false,
}) => {
  return (
    <div
      className={[
        "rounded-xl border border-gray-200 bg-white shadow-sm",
        compact
          ? "p-4"
          : "p-5 sm:p-6",
      ].join(" ")}
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Statistic content */}

        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonBox className="h-3 w-24" />

          <SkeletonBox className="h-7 w-16" />

          <SkeletonBox className="h-3 w-32 max-w-full" />
        </div>

        {/* Statistic icon */}

        <SkeletonBox
          className={[
            "h-10 w-10 shrink-0",
            compact
              ? "rounded-lg"
              : "rounded-xl",
          ].join(" ")}
        />
      </div>
    </div>
  );
};

/*
|----------------------------------------------------------------------------
| Filter Skeleton
|----------------------------------------------------------------------------
*/

/**
 * Skeleton for a tenancy filter field.
 */
const FilterSkeleton = ({
  width = "w-24",
}) => {
  return (
    <div
      className="min-w-0 space-y-2"
      aria-hidden="true"
    >
      {/* Label */}

      <SkeletonBox
        className={`h-3.5 ${width}`}
      />

      {/* Input */}

      <SkeletonBox className="h-10 w-full rounded-lg" />
    </div>
  );
};

/*
|----------------------------------------------------------------------------
| Table Header Skeleton
|----------------------------------------------------------------------------
*/

/**
 * Skeleton for a desktop table heading.
 */
const TableHeaderSkeleton = ({
  width = "w-24",
  align = "left",
}) => {
  const isRightAligned = align === "right";

  return (
    <th
      scope="col"
      className={[
        "px-5 py-3.5",
        isRightAligned
          ? "text-right"
          : "text-left",
      ].join(" ")}
    >
      <div
        className={[
          "flex",
          isRightAligned
            ? "justify-end"
            : "justify-start",
        ].join(" ")}
      >
        <SkeletonBox
          className={`h-3 ${width}`}
        />
      </div>
    </th>
  );
};

/*
|----------------------------------------------------------------------------
| Desktop Tenancy Row Skeleton
|----------------------------------------------------------------------------
|
| Matches TenancyTable columns:
|
| 1. Tenancy
| 2. Tenant
| 3. Property
| 4. Unit
| 5. Period
| 6. Rent
| 7. Status
| 8. Actions
|
|----------------------------------------------------------------------------
*/

const TenancyRowSkeleton = () => {
  return (
    <tr
      className="group"
      aria-hidden="true"
    >
      {/* ================================================================== */}
      {/* TENANCY */}
      {/* ================================================================== */}

      <td className="whitespace-nowrap px-5 py-4">
        <div className="flex items-center gap-3">
          {/* Document icon */}

          <SkeletonBox className="h-10 w-10 shrink-0 rounded-lg" />

          <div className="min-w-0 space-y-2">
            {/* Tenancy number */}

            <SkeletonBox className="h-4 w-28" />

            {/* ID */}

            <SkeletonBox className="h-3 w-20" />
          </div>
        </div>
      </td>

      {/* ================================================================== */}
      {/* TENANT */}
      {/* ================================================================== */}

      <td className="px-5 py-4">
        <div className="flex min-w-[210px] items-center gap-3">
          {/* Avatar */}

          <SkeletonBox className="h-10 w-10 shrink-0 rounded-full" />

          {/* Tenant details */}

          <div className="min-w-0 space-y-2">
            {/* Name */}

            <SkeletonBox className="h-4 w-32 max-w-full" />

            {/* Tenant number */}

            <SkeletonBox className="h-3 w-28 max-w-full" />

            {/* Phone */}

            <SkeletonBox className="h-3 w-24 max-w-full" />
          </div>
        </div>
      </td>

      {/* ================================================================== */}
      {/* PROPERTY */}
      {/* ================================================================== */}

      <td className="px-5 py-4">
        <div className="min-w-[220px] space-y-2">
          {/* Property name */}

          <div className="flex items-center gap-2">
            <SkeletonBox className="h-4 w-4 shrink-0 rounded" />

            <SkeletonBox className="h-4 w-32 max-w-full" />
          </div>

          {/* Property code */}

          <div className="pl-6">
            <SkeletonBox className="h-3 w-20" />
          </div>

          {/* Property location */}

          <div className="pl-6">
            <SkeletonBox className="h-3 w-36 max-w-full" />
          </div>
        </div>
      </td>

      {/* ================================================================== */}
      {/* UNIT */}
      {/* ================================================================== */}

      <td className="px-5 py-4">
        <div className="min-w-[160px] space-y-2">
          {/* Unit */}

          <div className="flex items-center gap-2">
            <SkeletonBox className="h-4 w-4 shrink-0 rounded" />

            <SkeletonBox className="h-4 w-20 max-w-full" />
          </div>

          {/* Apartment */}

          <div className="pl-6">
            <SkeletonBox className="h-3 w-24 max-w-full" />
          </div>

          {/* Unit status */}

          <div className="pl-6">
            <SkeletonBox className="h-3 w-20 max-w-full" />
          </div>
        </div>
      </td>

      {/* ================================================================== */}
      {/* PERIOD */}
      {/* ================================================================== */}

      <td className="px-5 py-4">
        <div className="min-w-[180px] space-y-2">
          <div className="flex items-center gap-2">
            {/* Calendar icon */}

            <SkeletonBox className="h-4 w-4 shrink-0 rounded" />

            <div className="space-y-2">
              {/* Start date */}

              <SkeletonBox className="h-4 w-24" />

              {/* End date */}

              <SkeletonBox className="h-3 w-28" />
            </div>
          </div>

          {/* Move-in / additional date */}

          <div className="pl-6">
            <SkeletonBox className="h-3 w-28 max-w-full" />
          </div>
        </div>
      </td>

      {/* ================================================================== */}
      {/* RENT */}
      {/* ================================================================== */}

      <td className="px-5 py-4">
        <div className="min-w-[140px] space-y-2">
          {/* Rent amount */}

          <div className="flex items-center gap-2">
            <SkeletonBox className="h-4 w-4 shrink-0 rounded" />

            <SkeletonBox className="h-4 w-24 max-w-full" />
          </div>

          {/* Frequency */}

          <div className="pl-6">
            <SkeletonBox className="h-3 w-20 max-w-full" />
          </div>

          {/* Service charge */}

          <div className="pl-6">
            <SkeletonBox className="h-3 w-24 max-w-full" />
          </div>
        </div>
      </td>

      {/* ================================================================== */}
      {/* STATUS */}
      {/* ================================================================== */}

      <td className="px-5 py-4">
        <div className="flex min-w-[120px] flex-col items-start gap-2">
          {/* Status badge */}

          <SkeletonBox className="h-6 w-20 rounded-full" />

          {/* Secondary status */}

          <SkeletonBox className="h-3 w-16" />
        </div>
      </td>

      {/* ================================================================== */}
      {/* ACTIONS */}
      {/* ================================================================== */}

      <td className="whitespace-nowrap px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <SkeletonBox className="h-8 w-8 rounded-lg" />

          <SkeletonBox className="h-8 w-8 rounded-lg" />

          <SkeletonBox className="h-8 w-8 rounded-lg" />
        </div>
      </td>
    </tr>
  );
};

/*
|----------------------------------------------------------------------------
| Mobile Tenancy Skeleton
|----------------------------------------------------------------------------
*/

const MobileTenancySkeleton = () => {
  return (
    <article
      className="p-5"
      aria-hidden="true"
    >
      {/* ================================================================== */}
      {/* TOP / TENANCY + STATUS */}
      {/* ================================================================== */}

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {/* Tenancy icon */}

          <SkeletonBox className="h-10 w-10 shrink-0 rounded-lg" />

          <div className="min-w-0 space-y-2">
            {/* Tenancy number */}

            <SkeletonBox className="h-4 w-28 max-w-full" />

            {/* ID */}

            <SkeletonBox className="h-3 w-20 max-w-full" />
          </div>
        </div>

        {/* Status */}

        <SkeletonBox className="h-6 w-20 shrink-0 rounded-full" />
      </div>

      {/* ================================================================== */}
      {/* TENANT */}
      {/* ================================================================== */}

      <div className="mt-5 flex items-center gap-3">
        {/* Avatar */}

        <SkeletonBox className="h-10 w-10 shrink-0 rounded-full" />

        <div className="min-w-0 space-y-2">
          {/* Name */}

          <SkeletonBox className="h-4 w-32 max-w-full" />

          {/* Tenant number */}

          <SkeletonBox className="h-3 w-28 max-w-full" />

          {/* Phone */}

          <SkeletonBox className="h-3 w-24 max-w-full" />
        </div>
      </div>

      {/* ================================================================== */}
      {/* PROPERTY */}
      {/* ================================================================== */}

      <div className="mt-5 space-y-2">
        {/* Section label */}

        <SkeletonBox className="h-3 w-20" />

        {/* Property */}

        <div className="flex items-center gap-2">
          <SkeletonBox className="h-4 w-4 shrink-0 rounded" />

          <SkeletonBox className="h-4 w-40 max-w-full" />
        </div>

        {/* Property metadata */}

        <SkeletonBox className="ml-6 h-3 w-28 max-w-full" />

        <SkeletonBox className="ml-6 h-3 w-36 max-w-full" />
      </div>

      {/* ================================================================== */}
      {/* UNIT */}
      {/* ================================================================== */}

      <div className="mt-5 space-y-2">
        {/* Section label */}

        <SkeletonBox className="h-3 w-12" />

        {/* Unit */}

        <div className="flex items-center gap-2">
          <SkeletonBox className="h-4 w-4 shrink-0 rounded" />

          <SkeletonBox className="h-4 w-28 max-w-full" />
        </div>

        {/* Apartment */}

        <SkeletonBox className="ml-6 h-3 w-24 max-w-full" />

        {/* Unit status */}

        <SkeletonBox className="ml-6 h-3 w-20 max-w-full" />
      </div>

      {/* ================================================================== */}
      {/* DETAILS */}
      {/* ================================================================== */}

      <div className="mt-5 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
        {/* Period */}

        <div className="min-w-0 space-y-2">
          <SkeletonBox className="h-3 w-20" />

          <SkeletonBox className="h-4 w-28 max-w-full" />

          <SkeletonBox className="h-3 w-24 max-w-full" />

          <SkeletonBox className="h-3 w-28 max-w-full" />
        </div>

        {/* Rent */}

        <div className="min-w-0 space-y-2">
          <SkeletonBox className="h-3 w-16" />

          <SkeletonBox className="h-4 w-24 max-w-full" />

          <SkeletonBox className="h-3 w-20 max-w-full" />

          <SkeletonBox className="h-3 w-24 max-w-full" />
        </div>
      </div>

      {/* ================================================================== */}
      {/* ACTIONS */}
      {/* ================================================================== */}

      <div className="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
        <SkeletonBox className="h-9 w-20 rounded-lg" />

        <SkeletonBox className="h-9 w-20 rounded-lg" />

        <SkeletonBox className="h-9 w-9 rounded-lg" />
      </div>
    </article>
  );
};

/*
|----------------------------------------------------------------------------
| Pagination Skeleton
|----------------------------------------------------------------------------
*/

const PaginationSkeleton = () => {
  return (
    <div
      className="border-t border-gray-200 px-5 py-4 sm:px-6"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Pagination summary */}

        <SkeletonBox className="h-4 w-40 max-w-full" />

        {/* Pagination controls */}

        <div className="flex items-center gap-2">
          <SkeletonBox className="h-9 w-9 rounded-lg" />

          <SkeletonBox className="h-9 w-9 rounded-lg" />

          <SkeletonBox className="h-9 w-9 rounded-lg" />

          <SkeletonBox className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

/*
|----------------------------------------------------------------------------
| Main Tenancy Skeleton
|----------------------------------------------------------------------------
*/

const TenancySkeleton = ({
  rows = DEFAULT_ROWS,
}) => {
  const safeRows = getSafeRowCount(rows);

  const mobileRows = Math.min(
    safeRows,
    MAX_MOBILE_ROWS
  );

  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Loading tenancies"
    >
      {/* ================================================================== */}
      {/* HEADER / PAGE SUMMARY */}
      {/* ================================================================== */}

      <section
        className="rounded-xl border border-gray-200 bg-white shadow-sm"
        aria-hidden="true"
      >
        <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Header information */}

          <div className="flex min-w-0 items-center gap-3">
            <SkeletonBox className="h-11 w-11 shrink-0 rounded-xl" />

            <div className="min-w-0 space-y-2">
              <SkeletonBox className="h-5 w-40 max-w-full" />

              <SkeletonBox className="h-4 w-64 max-w-full" />
            </div>
          </div>

          {/* Header action */}

          <SkeletonBox className="h-10 w-32 shrink-0 rounded-lg" />
        </div>
      </section>

      {/* ================================================================== */}
      {/* STATISTICS */}
      {/* ================================================================== */}

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-hidden="true"
      >
        <StatSkeleton />

        <StatSkeleton />

        <StatSkeleton />

        <StatSkeleton />
      </section>

      {/* ================================================================== */}
      {/* FILTERS */}
      {/* ================================================================== */}

      <section
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        aria-hidden="true"
      >
        {/* Filter heading */}

        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-9 w-9 shrink-0 rounded-lg" />

            <div className="min-w-0 space-y-2">
              <SkeletonBox className="h-4 w-28" />

              <SkeletonBox className="h-3 w-48 max-w-full" />
            </div>
          </div>
        </div>

        {/* Filter controls */}

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
          <FilterSkeleton width="w-24" />

          <FilterSkeleton width="w-20" />

          <FilterSkeleton width="w-28" />

          <FilterSkeleton width="w-20" />
        </div>
      </section>

      {/* ================================================================== */}
      {/* TENANCY DATA CARD */}
      {/* ================================================================== */}

      <section
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        aria-hidden="true"
      >
        {/* ---------------------------------------------------------------- */}
        {/* Toolbar */}
        {/* ---------------------------------------------------------------- */}

        <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Toolbar title */}

            <div className="min-w-0 space-y-2">
              <SkeletonBox className="h-5 w-36" />

              <SkeletonBox className="h-3 w-56 max-w-full" />
            </div>

            {/* Toolbar action */}

            <SkeletonBox className="h-9 w-24 shrink-0 rounded-lg" />
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Desktop Table */}
        {/* ---------------------------------------------------------------- */}

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-[1250px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Tenancy */}

                <TableHeaderSkeleton width="w-32" />

                {/* Tenant */}

                <TableHeaderSkeleton width="w-36" />

                {/* Property */}

                <TableHeaderSkeleton width="w-32" />

                {/* Unit */}

                <TableHeaderSkeleton width="w-28" />

                {/* Period */}

                <TableHeaderSkeleton width="w-28" />

                {/* Rent */}

                <TableHeaderSkeleton width="w-24" />

                {/* Status */}

                <TableHeaderSkeleton width="w-20" />

                {/* Actions */}

                <TableHeaderSkeleton
                  width="w-20"
                  align="right"
                />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {Array.from({
                length: safeRows,
              }).map((_, index) => (
                <TenancyRowSkeleton
                  key={`tenancy-row-${index}`}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Mobile Cards */}
        {/* ---------------------------------------------------------------- */}

        <div className="divide-y divide-gray-100 md:hidden">
          {Array.from({
            length: mobileRows,
          }).map((_, index) => (
            <MobileTenancySkeleton
              key={`mobile-tenancy-${index}`}
            />
          ))}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Horizontal Scroll Hint */}
        {/* ---------------------------------------------------------------- */}

        <div className="hidden border-t border-gray-100 bg-gray-50 px-5 py-2 md:block lg:hidden">
          <SkeletonBox className="h-3 w-56" />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Pagination */}
        {/* ---------------------------------------------------------------- */}

        <PaginationSkeleton />
      </section>
    </div>
  );
};

/*
|----------------------------------------------------------------------------
| Exports
|----------------------------------------------------------------------------
|
| Default export is the main component.
| Named exports are also provided for optional reuse/testing.
|
|----------------------------------------------------------------------------
*/

export {
  SkeletonBox,
  StatSkeleton,
  FilterSkeleton,
  TableHeaderSkeleton,
  TenancyRowSkeleton,
  MobileTenancySkeleton,
  PaginationSkeleton,
};

export default TenancySkeleton;