const SkeletonCard = () => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm animate-pulse">

    {/* Image */}
    <div className="h-56 w-full bg-gray-200" />

    {/* Content */}
    <div className="space-y-4 p-6">

      <div className="h-6 w-3/4 rounded bg-gray-200" />

      <div className="h-4 w-1/2 rounded bg-gray-200" />

      <div className="space-y-3">

        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />

      </div>

      <div className="grid grid-cols-2 gap-3">

        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="h-14 rounded-lg bg-gray-200"
          />
        ))}

      </div>

    </div>

    {/* Statistics */}
    <div className="grid grid-cols-3 border-y border-gray-200">

      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="flex flex-col items-center gap-2 p-4"
        >
          <div className="h-5 w-5 rounded-full bg-gray-200" />
          <div className="h-3 w-12 rounded bg-gray-200" />
          <div className="h-5 w-8 rounded bg-gray-200" />
        </div>
      ))}

    </div>

    {/* Actions */}
    <div className="flex gap-3 p-5">

      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="h-10 flex-1 rounded-lg bg-gray-200"
        />
      ))}

    </div>

  </div>
);

const ApartmentSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

export default ApartmentSkeleton;