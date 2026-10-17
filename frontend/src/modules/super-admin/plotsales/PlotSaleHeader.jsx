import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  Eye,
  FilePlus2,
  LandPlot,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| PLOT SALE ROUTES
|--------------------------------------------------------------------------
*/

const PLOT_SALE_ROUTES = {
  dashboard: "/super-admin",
  plots: "/super-admin/plots",
  sales: "/super-admin/plots/sales",
  create: "/super-admin/plots/sales/create",
  reports: "/super-admin/plots/sales/reports",
};

/*
|--------------------------------------------------------------------------
| PLOT SALE HEADER
|--------------------------------------------------------------------------
*/

const PlotSaleHeader = ({
  onRefresh,
  onCreate,
  onViewReports,
  loading = false,
  title: customTitle,
  description: customDescription,
  showRefresh = true,
  showCreate = true,
  showReports = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname.replace(/\/+$/, "") || "/";

  /*
  |--------------------------------------------------------------------------
  | Page Detection
  |--------------------------------------------------------------------------
  */

  const isSalesIndexPage = pathname === PLOT_SALE_ROUTES.sales;

  const isCreatePage = pathname === PLOT_SALE_ROUTES.create;

  const isReportsPage =
    pathname === PLOT_SALE_ROUTES.reports ||
    pathname.startsWith(`${PLOT_SALE_ROUTES.reports}/`);

  const isEditPage =
    pathname.startsWith(`${PLOT_SALE_ROUTES.sales}/`) &&
    pathname.endsWith("/edit");

  const isDetailsPage =
    pathname.startsWith(`${PLOT_SALE_ROUTES.sales}/`) &&
    !isSalesIndexPage &&
    !isCreatePage &&
    !isReportsPage &&
    !isEditPage;

  /*
  |--------------------------------------------------------------------------
  | Header Configuration
  |--------------------------------------------------------------------------
  */

  let title = "Plot Sales";

  let description =
    "Manage plot sales, buyers, sale agreements, payments and transaction status.";

  let icon = ShoppingBag;

  if (isCreatePage) {
    title = "Create Plot Sale";

    description =
      "Record a new plot sale, select the buyer and plot, and configure the sale agreement and payment terms.";

    icon = FilePlus2;
  }

  if (isEditPage) {
    title = "Edit Plot Sale";

    description =
      "Update sale information, buyer details, pricing, agreement information and transaction status.";

    icon = Pencil;
  }

  if (isDetailsPage) {
    title = "Plot Sale Details";

    description =
      "View sale information, plot and buyer details, agreement records, payment progress and outstanding balance.";

    icon = Eye;
  }

  if (isReportsPage) {
    title = "Plot Sales Reports";

    description =
      "Review sales performance, completed transactions, payment collections, outstanding balances and sales trends.";

    icon = BarChart3;
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
    if (isCreatePage || isReportsPage) {
      navigate(PLOT_SALE_ROUTES.sales);
      return;
    }

    if (isEditPage || isDetailsPage) {
      navigate(PLOT_SALE_ROUTES.sales);
      return;
    }

    navigate(PLOT_SALE_ROUTES.plots);
  };

  const handleViewSales = () => {
    navigate(PLOT_SALE_ROUTES.sales);
  };

  const handleViewPlots = () => {
    navigate(PLOT_SALE_ROUTES.plots);
  };

  const handleCreateSale = () => {
    if (typeof onCreate === "function") {
      onCreate();
      return;
    }

    navigate(PLOT_SALE_ROUTES.create);
  };

  const handleViewReports = () => {
    if (typeof onViewReports === "function") {
      onViewReports();
      return;
    }

    navigate(PLOT_SALE_ROUTES.reports);
  };

  const handleRefresh = () => {
    if (typeof onRefresh === "function") {
      onRefresh();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Shared Button Styles
  |--------------------------------------------------------------------------
  */

  const secondaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl " +
    "border border-gray-200 bg-white px-4 py-2 text-sm font-medium " +
    "text-gray-700 shadow-sm transition " +
    "hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  const primaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl " +
    "bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm " +
    "transition hover:bg-blue-700 focus:outline-none " +
    "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  const reportButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl " +
    "border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium " +
    "text-violet-700 shadow-sm transition hover:border-violet-300 " +
    "hover:bg-violet-100 hover:text-violet-800 " +
    "focus:outline-none focus:ring-2 focus:ring-violet-500 " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  /*
  |--------------------------------------------------------------------------
  | Breadcrumb Context
  |--------------------------------------------------------------------------
  */

  const currentPageLabel = isCreatePage
    ? "Create Sale"
    : isEditPage
      ? "Edit Sale"
      : isDetailsPage
        ? "Sale Details"
        : isReportsPage
          ? "Reports"
          : "All Sales";

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <header className="mb-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* --------------------------------------------------------------
            Header Content
        -------------------------------------------------------------- */}

        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          {/* ------------------------------------------------------------
              Left: Back Button, Icon, Title and Description
          ------------------------------------------------------------ */}

          <div className="flex min-w-0 items-start gap-4">
            {!isSalesIndexPage && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                aria-label="Back to plot sales"
                title="Back"
                className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            {/* Desktop Icon */}

            <div className="hidden shrink-0 sm:flex">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  isReportsPage
                    ? "bg-violet-50 text-violet-600"
                    : isCreatePage
                      ? "bg-emerald-50 text-emerald-600"
                      : isEditPage
                        ? "bg-amber-50 text-amber-600"
                        : isDetailsPage
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-blue-50 text-blue-600"
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
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isReportsPage
                        ? "bg-violet-50 text-violet-600"
                        : isCreatePage
                          ? "bg-emerald-50 text-emerald-600"
                          : isEditPage
                            ? "bg-amber-50 text-amber-600"
                            : isDetailsPage
                              ? "bg-indigo-50 text-indigo-600"
                              : "bg-blue-50 text-blue-600"
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

          {/* ------------------------------------------------------------
              Right: Actions
          ------------------------------------------------------------ */}

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* All Sales Page */}

            {isSalesIndexPage && (
              <>
                {showRefresh && (
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={loading || !onRefresh}
                    className={secondaryButton}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        loading ? "animate-spin" : ""
                      }`}
                    />

                    <span className="hidden sm:inline">
                      {loading ? "Refreshing..." : "Refresh"}
                    </span>
                  </button>
                )}

                {showReports && (
                  <button
                    type="button"
                    onClick={handleViewReports}
                    disabled={loading}
                    className={reportButton}
                  >
                    <BarChart3 className="h-4 w-4" />

                    <span className="hidden sm:inline">
                      Sales Reports
                    </span>

                    <span className="sm:hidden">Reports</span>
                  </button>
                )}

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

                {showCreate && (
                  <button
                    type="button"
                    onClick={handleCreateSale}
                    disabled={loading}
                    className={primaryButton}
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Sale</span>
                  </button>
                )}
              </>
            )}

            {/* Sales Reports Page */}

            {isReportsPage && (
              <>
                {showRefresh && (
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={loading || !onRefresh}
                    className={secondaryButton}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        loading ? "animate-spin" : ""
                      }`}
                    />

                    <span>
                      {loading ? "Refreshing..." : "Refresh"}
                    </span>
                  </button>
                )}

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
                  onClick={handleViewSales}
                  disabled={loading}
                  className={primaryButton}
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>All Sales</span>
                </button>
              </>
            )}

            {/* Create, Edit and Details Pages */}

            {!isSalesIndexPage &&
              !isReportsPage && (
                <>
                  <button
                    type="button"
                    onClick={handleViewSales}
                    disabled={loading}
                    className={secondaryButton}
                  >
                    <ShoppingBag className="h-4 w-4" />

                    <span className="hidden sm:inline">
                      All Sales
                    </span>

                    <span className="sm:hidden">Sales</span>
                  </button>

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

                  {showReports && (
                    <button
                      type="button"
                      onClick={handleViewReports}
                      disabled={loading}
                      className={reportButton}
                    >
                      <TrendingUp className="h-4 w-4" />

                      <span className="hidden sm:inline">
                        Reports
                      </span>
                    </button>
                  )}

                  {(isDetailsPage || isEditPage) &&
                    showCreate && (
                      <button
                        type="button"
                        onClick={handleCreateSale}
                        disabled={loading}
                        className={primaryButton}
                      >
                        <Plus className="h-4 w-4" />

                        <span className="hidden sm:inline">
                          New Sale
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
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500"
          >
            <button
              type="button"
              onClick={() => navigate(PLOT_SALE_ROUTES.dashboard)}
              className="transition hover:text-blue-600"
            >
              Dashboard
            </button>

            <span aria-hidden="true">/</span>

            <button
              type="button"
              onClick={handleViewPlots}
              className="transition hover:text-blue-600"
            >
              Plots
            </button>

            <span aria-hidden="true">/</span>

            <button
              type="button"
              onClick={handleViewSales}
              className={`inline-flex items-center gap-1 transition ${
                isSalesIndexPage
                  ? "font-medium text-gray-800"
                  : "hover:text-blue-600"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Plot Sales
            </button>

            {!isSalesIndexPage && (
              <>
                <span aria-hidden="true">/</span>

                <span
                  className={`inline-flex items-center gap-1 font-medium ${
                    isReportsPage
                      ? "text-violet-700"
                      : isCreatePage
                        ? "text-emerald-700"
                        : isEditPage
                          ? "text-amber-700"
                          : "text-indigo-700"
                  }`}
                  aria-current="page"
                >
                  {isReportsPage ? (
                    <BarChart3 className="h-3.5 w-3.5" />
                  ) : isCreatePage ? (
                    <FilePlus2 className="h-3.5 w-3.5" />
                  ) : isEditPage ? (
                    <Pencil className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}

                  {currentPageLabel}
                </span>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default PlotSaleHeader;