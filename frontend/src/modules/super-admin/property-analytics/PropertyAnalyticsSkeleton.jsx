const SkeletonCard = () => (
  <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    {/* Image */}
    <div className="h-60 w-full bg-gray-200" />

    <div className="space-y-5 p-5">
      {/* Title */}
      <div>
        <div className="h-6 w-3/4 rounded bg-gray-200" />
        <div className="mt-3 h-4 w-1/3 rounded bg-gray-200" />
        <div className="mt-4 h-4 w-full rounded bg-gray-200" />
      </div>

      {/* Price */}
      <div className="rounded-xl bg-gray-100 p-4">
        <div className="h-6 w-40 rounded bg-gray-200" />
        <div className="mt-3 h-4 w-28 rounded bg-gray-200" />
      </div>

      {/* Features */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg bg-gray-100 p-3"
          >
            <div className="mx-auto h-6 w-6 rounded-full bg-gray-200" />
            <div className="mx-auto mt-3 h-3 w-12 rounded bg-gray-200" />
            <div className="mx-auto mt-2 h-5 w-8 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg bg-gray-100 p-4"
          >
            <div className="mx-auto h-6 w-6 rounded-full bg-gray-200" />
            <div className="mx-auto mt-3 h-6 w-12 rounded bg-gray-200" />
            <div className="mx-auto mt-2 h-3 w-14 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Progress */}
      <div>
        <div className="mb-3 flex justify-between">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-4 w-12 rounded bg-gray-200" />
        </div>

        <div className="h-3 w-full rounded-full bg-gray-200" />

        <div className="mt-3 flex justify-between">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-200" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="h-4 w-24 rounded bg-gray-200" />

        <div className="flex gap-2">
          <div className="h-10 w-20 rounded-lg bg-gray-200" />
          <div className="h-10 w-24 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  </div>
);

const PropertyAnalyticsSkeleton = () => {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="animate-pulse">
        <div className="h-8 w-72 rounded bg-gray-200" />
        <div className="mt-3 h-4 w-96 rounded bg-gray-200" />
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="mt-4 h-8 w-20 rounded bg-gray-200" />
              </div>

              <div className="h-14 w-14 rounded-full bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="h-11 rounded bg-gray-200 lg:col-span-5" />

          <div className="flex gap-3 lg:col-span-7">
            <div className="h-11 flex-1 rounded bg-gray-200" />
            <div className="h-11 flex-1 rounded bg-gray-200" />
            <div className="h-11 flex-1 rounded bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="h-6 w-52 rounded bg-gray-200" />
            <div className="mt-6 h-72 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>

    </div>
  );
};

export default PropertyAnalyticsSkeleton;