
import {
  ArrowLeft,
  MapPin,
  Eye,
  FilePlus2,
  Pencil,
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

/*
|--------------------------------------------------------------------------
| REGION ROUTES
|--------------------------------------------------------------------------
*/

const REGION_ROUTES = {
  index: "/super-admin/regions",
  create: "/super-admin/regions/create",
};

/*
|--------------------------------------------------------------------------
| REGION HEADER
|--------------------------------------------------------------------------
*/

const RegionHeader = ({
  onRefresh,
  loading = false,
  title: customTitle,
  description: customDescription,
  showRefresh = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname;

  /*
  |--------------------------------------------------------------------------
  | Page Detection
  |--------------------------------------------------------------------------
  */

  const isIndexPage =
    pathname === REGION_ROUTES.index;

  const isCreatePage =
    pathname === REGION_ROUTES.create;

  const isEditPage =
    pathname.includes("/super-admin/regions/") &&
    pathname.endsWith("/edit");

  const isDetailsPage =
    pathname.includes("/super-admin/regions/") &&
    !isIndexPage &&
    !isCreatePage &&
    !isEditPage;

  /*
  |--------------------------------------------------------------------------
  | Header Configuration
  |--------------------------------------------------------------------------
  */

  let title = "Regions";

  let description =
    "Manage regions, regional codes, countries and associated counties.";

  let icon = MapPin;

  if (isCreatePage) {
    title = "Create Region";
    description =
      "Add a new region and configure its name, regional code and associated country.";
    icon = FilePlus2;
  }

  if (isEditPage) {
    title = "Edit Region";
    description =
      "Update region information, regional code and associated country.";
    icon = Pencil;
  }

  if (isDetailsPage) {
    title = "Region Details";
    description =
      "View region information, associated country, regional code and county records.";
    icon = Eye;
  }

  /*
  |--------------------------------------------------------------------------
  | Custom Header Values
  |--------------------------------------------------------------------------
  */

  if (customTitle) {
    title = customTitle;
  }

  if (customDescription) {
    description = customDescription;
  }

  const Icon = icon;

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {
    navigate(REGION_ROUTES.index, {
      replace: true,
    });
  };

  const handleCreate = () => {
    navigate(REGION_ROUTES.create);
  };

  const handleViewRegions = () => {
    navigate(REGION_ROUTES.index);
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <header className="mb-6">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* ================================================================
            HEADER CONTENT
        ================================================================ */}

        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">

          {/* --------------------------------------------------------------
              Left
          -------------------------------------------------------------- */}

          <div className="flex min-w-0 items-start gap-4">

            {/* Back Button */}

            {!isIndexPage && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                aria-label="Go back to regions"
                title="Back to regions"
                className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            {/* Icon */}

            <div className="hidden shrink-0 sm:flex">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="h-6 w-6" />
              </div>
            </div>

            {/* Title / Description */}

            <div className="min-w-0">
              <div className="flex items-center gap-2">

                {/* Mobile Icon */}

                <div className="sm:hidden">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <h1 className="truncate text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                  {title}
                </h1>
              </div>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                {description}
              </p>
            </div>
          </div>

          {/* --------------------------------------------------------------
              Actions
          -------------------------------------------------------------- */}

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">

            {/* ============================================================
                REGION INDEX PAGE
            ============================================================ */}

            {isIndexPage && (
              <>
                {/* Refresh */}

                {showRefresh && (
                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading || !onRefresh}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""
                        }`}
                    />

                    <span className="hidden sm:inline">
                      {loading ? "Refreshing..." : "Refresh"}
                    </span>
                  </button>
                )}

                {/* New Region */}

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />

                  <span>New Region</span>
                </button>
              </>
            )}

            {/* ============================================================
                CREATE / EDIT / DETAILS
            ============================================================ */}

            {!isIndexPage && (
              <button
                type="button"
                onClick={handleViewRegions}
                disabled={loading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MapPin className="h-4 w-4" />

                <span className="hidden sm:inline">
                  All Regions
                </span>

                <span className="sm:hidden">
                  Regions
                </span>
              </button>
            )}

            {/* ============================================================
                DETAILS / EDIT
            ============================================================ */}

            {(isDetailsPage || isEditPage) && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />

                <span className="hidden sm:inline">
                  New Region
                </span>

                <span className="sm:hidden">
                  New
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ================================================================
            PAGE CONTEXT BAR
        ================================================================ */}

        <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">

            {/* Dashboard */}

            <button
              type="button"
              onClick={() => navigate("/super-admin")}
              className="transition hover:text-indigo-600"
            >
              Dashboard
            </button>

            <span>/</span>

            {/* Regions */}

            <button
              type="button"
              onClick={handleViewRegions}
              className={`transition ${isIndexPage
                ? "font-medium text-gray-700"
                : "hover:text-indigo-600"
                }`}
            >
              Regions
            </button>

            {/* Create / Edit / Details */}

            {!isIndexPage && (
              <>
                <span>/</span>

                <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                  {isCreatePage && (
                    <>
                      <FilePlus2 className="h-3.5 w-3.5" />
                      Create
                    </>
                  )}

                  {isEditPage && (
                    <>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </>
                  )}

                  {isDetailsPage && (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      Details
                    </>
                  )}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default RegionHeader;
