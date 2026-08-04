import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ApartmentPagination = ({
  pagination = {},
  onPageChange,
}) => {
  const {
    current_page = 1,
    last_page = 1,
    per_page = 10,
    total = 0,
    from = total > 0 ? (current_page - 1) * per_page + 1 : 0,
    to = Math.min(current_page * per_page, total),
  } = pagination;

  const handlePageChange = (page) => {
    if (
      page < 1 ||
      page > last_page ||
      page === current_page
    ) {
      return;
    }

    if (typeof onPageChange === "function") {
      onPageChange(page);
    }
  };

  const getPages = () => {
    const pages = [];

    if (last_page <= 7) {
      for (let i = 1; i <= last_page; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (current_page > 3) {
        pages.push("...");
      }

      const start = Math.max(2, current_page - 1);
      const end = Math.min(last_page - 1, current_page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current_page < last_page - 2) {
        pages.push("...");
      }

      pages.push(last_page);
    }

    return pages;
  };

  if (last_page <= 1) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      {/* Results */}
      <div className="text-sm text-gray-600">
        Showing{" "}
        <span className="font-semibold text-gray-900">
          {from}
        </span>{" "}
        to{" "}
        <span className="font-semibold text-gray-900">
          {to}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-gray-900">
          {total}
        </span>{" "}
        apartments
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-2">
        {/* Previous */}
        <button
          type="button"
          onClick={() =>
            handlePageChange(current_page - 1)
          }
          disabled={current_page === 1}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Numbers */}
        {getPages().map((page, index) =>
          page === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-gray-500"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() =>
                handlePageChange(page)
              }
              className={`h-10 min-w-[40px] rounded-lg border text-sm font-medium transition ${
                page === current_page
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() =>
            handlePageChange(current_page + 1)
          }
          disabled={current_page === last_page}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ApartmentPagination;