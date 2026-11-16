
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
| COUNTY ROUTES
|--------------------------------------------------------------------------
*/

const COUNTY_ROUTES = {
  index: "/super-admin/counties",
  create: "/super-admin/counties/create",
};

/*
|--------------------------------------------------------------------------
| COUNTY HEADER
|--------------------------------------------------------------------------
*/

const CountyHeader = ({
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
    pathname === COUNTY_ROUTES.index ||
    pathname === `${COUNTY_ROUTES.index}/`;

  const isCreatePage =
    pathname === COUNTY_ROUTES.create;

  const isEditPage =
    pathname.startsWith(`${COUNTY_ROUTES.index}/`) &&
    pathname.endsWith("/edit");

  const isDetailsPage =
    pathname.startsWith(`${COUNTY_ROUTES.index}/`) &&
    !isIndexPage &&
    !isCreatePage &&
    !isEditPage;

  /*
  |--------------------------------------------------------------------------
  | Header Configuration
  |--------------------------------------------------------------------------
  */

  let title = "Counties";

  let description =
    "Manage counties, county codes, regions and associated location records.";

  let icon = MapPin;

  if (isCreatePage) {
    title = "Create County";
    description =
      "Add a new county and assign it to the appropriate country and region.";
    icon = FilePlus2;
  }

  if (isEditPage) {
    title = "Edit County";
    description =
      "Update county information, county code and regional assignment.";
    icon = Pencil;
  }

  if (isDetailsPage) {
    title = "County Details";
    description =
      "View county information, country, region and associated location records.";
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
    navigate(COUNTY_ROUTES.index, {
      replace: true,
    });
  };

  const handleCreate = () => {
    navigate(COUNTY_ROUTES.create);
  };

  const handleViewCounties = () => {
    navigate(COUNTY_ROUTES.index);
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
                aria-label="Go back to counties"
                title="Back to counties"
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
                COUNTY INDEX PAGE
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

                {/* New County */}

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />

                  <span>New County</span>
                </button>
              </>
            )}

            {/* ============================================================
                CREATE / EDIT / DETAILS
            ============================================================ */}

            {!isIndexPage && (
              <button
                type="button"
                onClick={handleViewCounties}
                disabled={loading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MapPin className="h-4 w-4" />

                <span className="hidden sm:inline">
                  All Counties
                </span>

                <span className="sm:hidden">
                  Counties
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
                  New County
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

            {/* Counties */}

            <button
              type="button"
              onClick={handleViewCounties}
              className={`transition ${isIndexPage
                ? "font-medium text-gray-700"
                : "hover:text-indigo-600"
                }`}
            >
              Counties
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

export default CountyHeader;
