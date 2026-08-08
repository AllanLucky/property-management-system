
import { ArrowLeft, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const PropertyHeader = ({
  title = "Property",
  description = "",
  backLabel = "Back to Properties",
  backTo = "/super-admin/properties",
}) => {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* ============================================================
              TITLE
          ============================================================ */}

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 size={22} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                {title}
              </h1>

              {description && (
                <p className="mt-1 text-sm text-gray-500">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* ============================================================
              BACK BUTTON
          ============================================================ */}

          <Link
            to={backTo}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <ArrowLeft size={17} />

            <span>{backLabel}</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default PropertyHeader;
