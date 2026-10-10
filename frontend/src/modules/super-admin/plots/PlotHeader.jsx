
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  FilePlus2,
  LandPlot,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| PLOT ROUTES
|--------------------------------------------------------------------------
*/

const PLOT_ROUTES = {
  index: "/super-admin/plots",
  create: "/super-admin/plots/create",
  available: "/super-admin/plots/available",
  reserved: "/super-admin/plots/reserved",
  sales: "/super-admin/plots/sales",
};

/*
|--------------------------------------------------------------------------
| PLOT HEADER
|--------------------------------------------------------------------------
*/

const PlotHeader = ({
  onRefresh,
  loading = false,
  title: customTitle,
  description: customDescription,
  showRefresh = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname.replace(/\/+$/, "") || "/";

  /*
  |--------------------------------------------------------------------------
  | Page Detection
  |--------------------------------------------------------------------------
  */

  const isIndexPage = pathname === PLOT_ROUTES.index;

  const isCreatePage = pathname === PLOT_ROUTES.create;

  const isAvailablePage = pathname === PLOT_ROUTES.available;

  const isReservedPage = pathname === PLOT_ROUTES.reserved;

  const isSalesPage =
    pathname === PLOT_ROUTES.sales ||
    pathname.startsWith(`${PLOT_ROUTES.sales}/`);

  const isEditPage =
    pathname.startsWith(`${PLOT_ROUTES.index}/`) &&
    pathname.endsWith("/edit");

  const isDetailsPage =
    pathname.startsWith(`${PLOT_ROUTES.index}/`) &&
    !isIndexPage &&
    !isCreatePage &&
    !isAvailablePage &&
    !isReservedPage &&
    !isSalesPage &&
    !isEditPage;

  /*
  |--------------------------------------------------------------------------
  | Header Configuration
  |--------------------------------------------------------------------------
  */

  let title = "Plot Management";
  let description =
    "Manage land plots, availability, pricing and property inventory.";
  let icon = LandPlot;

  if (isCreatePage) {
    title = "Create Plot";
    description =
      "Register a new land plot and enter its location, size and asking price.";
    icon = FilePlus2;
  }

  if (isEditPage) {
    title = "Edit Plot";
    description =
      "Update plot details, location, pricing and availability.";
    icon = Pencil;
  }

  if (isDetailsPage) {
    title = "Plot Details";
    description =
      "View plot information, location, pricing and current status.";
    icon = Eye;
  }

  if (isAvailablePage) {
    title = "Available Plots";
    description =
      "Browse available land plots and manage plots ready for sale.";
    icon = CheckCircle2;
  }

  if (isReservedPage) {
    title = "Reserved Plots";
    description =
      "View and manage plots currently reserved by prospective buyers.";
    icon = ShoppingBag;
  }

  if (isSalesPage) {
    title = "Plot Sales";
    description =
      "Manage plot sales, buyer details, sale agreements and transaction status.";
    icon = ShoppingBag;
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
    navigate(PLOT_ROUTES.index, { replace: true });
  };

  const handleCreate = () => {
    navigate(PLOT_ROUTES.create);
  };

  const handleViewPlots = () => {
    navigate(PLOT_ROUTES.index);
  };

  const handleViewAvailable = () => {
    navigate(PLOT_ROUTES.available);
  };

  const handleViewReserved = () => {
    navigate(PLOT_ROUTES.reserved);
  };

 

  /*
  |--------------------------------------------------------------------------
  | Shared Button Styles
  |--------------------------------------------------------------------------
  */

  const secondaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50";

  const primaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <header className="mb-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          {/* --------------------------------------------------------------
              Left: Back Button, Icon, Title and Description
          -------------------------------------------------------------- */}

          <div className="flex min-w-0 items-start gap-4">
            {!isIndexPage && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                aria-label="Back to plot management"
                title="Back to plots"
                className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            {/* Desktop Icon */}

            <div className="hidden shrink-0 sm:flex">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${isReservedPage
                  ? "bg-amber-50 text-amber-600"
                  : isSalesPage
                    ? "bg-blue-50 text-blue-600"
                    : "bg-emerald-50 text-emerald-600"
                  }`}
              >
                <Icon className="h-6 w-6" />
              </div>
            </div>

            {/* Title and Description */}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {/* Mobile Icon */}

                <div className="shrink-0 sm:hidden">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${isReservedPage
                      ? "bg-amber-50 text-amber-600"
                      : isSalesPage
                        ? "bg-blue-50 text-blue-600"
                        : "bg-emerald-50 text-emerald-600"
                      }`}
                  >
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
              Right: Actions
          -------------------------------------------------------------- */}

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Main Plot Index */}

            {isIndexPage && (
              <>
                {showRefresh && (
                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading || !onRefresh}
                    className={secondaryButton}
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

                <button
                  type="button"
                  onClick={handleViewAvailable}
                  disabled={loading}
                  className={`${secondaryButton} border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800`}
                >
                  <CheckCircle2 className="h-4 w-4" />

                  <span className="hidden sm:inline">
                    Available Plots
                  </span>

                  <span className="sm:hidden">Available</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className={primaryButton}
                >
                  <Plus className="h-4 w-4" />
                  <span>New Plot</span>
                </button>
              </>
            )}

            {/* Available Plots */}

            {isAvailablePage && (
              <>
                <button
                  type="button"
                  onClick={handleViewPlots}
                  disabled={loading}
                  className={secondaryButton}
                >
                  <LandPlot className="h-4 w-4" />
                  <span>All Plots</span>
                </button>

                <button
                  type="button"
                  onClick={handleViewReserved}
                  disabled={loading}
                  className={secondaryButton}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    Reserved Plots
                  </span>
                  <span className="sm:hidden">Reserved</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className={primaryButton}
                >
                  <Plus className="h-4 w-4" />
                  <span>New Plot</span>
                </button>
              </>
            )}

            {/* Reserved Plots */}

            {isReservedPage && (
              <>
                <button
                  type="button"
                  onClick={handleViewPlots}
                  disabled={loading}
                  className={secondaryButton}
                >
                  <LandPlot className="h-4 w-4" />
                  <span>All Plots</span>
                </button>

                <button
                  type="button"
                  onClick={handleViewAvailable}
                  disabled={loading}
                  className={secondaryButton}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    Available Plots
                  </span>
                  <span className="sm:hidden">Available</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className={primaryButton}
                >
                  <Plus className="h-4 w-4" />
                  <span>New Plot</span>
                </button>
              </>
            )}

            {/* Plot Sales */}

            {isSalesPage && (
              <>
                <button
                  type="button"
                  onClick={handleViewPlots}
                  disabled={loading}
                  className={secondaryButton}
                >
                  <LandPlot className="h-4 w-4" />
                  <span>All Plots</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className={primaryButton}
                >
                  <Plus className="h-4 w-4" />
                  <span>New Plot</span>
                </button>
              </>
            )}

            {/* Create, Edit and Details */}

            {!isIndexPage &&
              !isAvailablePage &&
              !isReservedPage &&
              !isSalesPage && (
                <>
                  <button
                    type="button"
                    onClick={handleViewPlots}
                    disabled={loading}
                    className={secondaryButton}
                  >
                    <LandPlot className="h-4 w-4" />

                    <span className="hidden sm:inline">
                      All Plots
                    </span>

                    <span className="sm:hidden">Plots</span>
                  </button>

                  {(isDetailsPage || isEditPage) && (
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={loading}
                      className={primaryButton}
                    >
                      <Plus className="h-4 w-4" />

                      <span className="hidden sm:inline">
                        New Plot
                      </span>

                      <span className="sm:hidden">New</span>
                    </button>
                  )}
                </>
              )}
          </div>
        </div>

        {/* --------------------------------------------------------------
            Breadcrumb / Page Context Bar
        -------------------------------------------------------------- */}

        <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
            <button
              type="button"
              onClick={() => navigate("/super-admin")}
              className="transition hover:text-emerald-600"
            >
              Dashboard
            </button>

            <span>/</span>

            <button
              type="button"
              onClick={handleViewPlots}
              className={`transition ${isIndexPage
                ? "font-medium text-gray-700"
                : "hover:text-emerald-600"
                }`}
            >
              Plots
            </button>

            {isAvailablePage && (
              <>
                <span>/</span>
                <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Available
                </span>
              </>
            )}

            {isReservedPage && (
              <>
                <span>/</span>
                <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Reserved
                </span>
              </>
            )}

            {isSalesPage && (
              <>
                <span>/</span>
                <span className="inline-flex items-center gap-1 font-medium text-blue-700">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Sales
                </span>
              </>
            )}

            {!isIndexPage &&
              !isAvailablePage &&
              !isReservedPage &&
              !isSalesPage && (
                <>
                  <span>/</span>

                  <span className="font-medium text-gray-700">
                    {isCreatePage
                      ? "Create"
                      : isEditPage
                        ? "Edit"
                        : isDetailsPage
                          ? "Details"
                          : title}
                  </span>
                </>
              )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PlotHeader;
