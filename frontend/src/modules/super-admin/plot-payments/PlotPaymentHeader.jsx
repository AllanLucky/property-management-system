
import {
  ArrowLeft,
  Eye,
  FilePlus2,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Wallet,
  Trash2,
  Printer,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| PLOT PAYMENT ROUTES
|--------------------------------------------------------------------------
*/

const PAYMENT_ROUTES = {
  index: "/super-admin/plot-payments",
  create: "/super-admin/plot-payments/create",
};

/*
|--------------------------------------------------------------------------
| PLOT PAYMENT HEADER
|--------------------------------------------------------------------------
*/

const PlotPaymentHeader = ({
  onRefresh,
  loading = false,
  title: customTitle,
  description: customDescription,
  showRefresh = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const pathname =
    location.pathname.replace(/\/+$/, "") || "/";

  /*
  |--------------------------------------------------------------------------
  | PAGE DETECTION
  |--------------------------------------------------------------------------
  */

  const isIndexPage = pathname === PAYMENT_ROUTES.index;

  const isCreatePage = pathname === PAYMENT_ROUTES.create;

  const isReceiptPage =
    pathname.startsWith(`${PAYMENT_ROUTES.index}/`) &&
    pathname.endsWith("/receipt");

  const isDeletePage =
    pathname.startsWith(`${PAYMENT_ROUTES.index}/`) &&
    pathname.endsWith("/delete");

  const isEditPage =
    pathname.startsWith(`${PAYMENT_ROUTES.index}/`) &&
    pathname.endsWith("/edit");

  const isDetailsPage =
    pathname.startsWith(`${PAYMENT_ROUTES.index}/`) &&
    !isIndexPage &&
    !isCreatePage &&
    !isEditPage &&
    !isDeletePage &&
    !isReceiptPage;

  /*
  |--------------------------------------------------------------------------
  | HEADER CONFIGURATION
  |--------------------------------------------------------------------------
  */

  let title = "Plot Payments";

  let description =
    "Monitor transactions, deposits, installments and plot sale balances.";

  let Icon = Wallet;

  if (isCreatePage) {
    title = "Record Plot Payment";
    description =
      "Record a new plot payment and capture transaction, payer and payment details.";
    Icon = FilePlus2;
  } else if (isEditPage) {
    title = "Edit Plot Payment";
    description =
      "Update payment information, transaction references and payer details.";
    Icon = Pencil;
  } else if (isDetailsPage) {
    title = "Plot Payment Details";
    description =
      "View payment information, transaction details, receipt and payment history.";
    Icon = Eye;
  } else if (isReceiptPage) {
    title = "Payment Receipt";
    description =
      "View and print the official receipt for this plot payment.";
    Icon = Printer;
  } else if (isDeletePage) {
    title = "Delete Plot Payment";
    description =
      "Review the selected payment before removing it from the payment records.";
    Icon = Trash2;
  }

  /*
  |--------------------------------------------------------------------------
  | CUSTOM HEADER VALUES
  |--------------------------------------------------------------------------
  */

  if (customTitle) {
    title = customTitle;
  }

  if (customDescription) {
    description = customDescription;
  }

  /*
  |--------------------------------------------------------------------------
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {
    navigate(PAYMENT_ROUTES.index);
  };

  const handleCreate = () => {
    navigate(PAYMENT_ROUTES.create);
  };

  const handleViewPayments = () => {
    navigate(PAYMENT_ROUTES.index);
  };

  /*
  |--------------------------------------------------------------------------
  | BUTTON STYLES
  |--------------------------------------------------------------------------
  */

  const secondaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const primaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  /*
  |--------------------------------------------------------------------------
  | ICON STYLES
  |--------------------------------------------------------------------------
  */

  const iconContainerClass = isCreatePage
    ? "bg-sky-50 text-sky-600"
    : isEditPage
      ? "bg-amber-50 text-amber-600"
      : isDetailsPage
        ? "bg-blue-50 text-blue-600"
        : isReceiptPage
          ? "bg-emerald-50 text-emerald-600"
          : isDeletePage
            ? "bg-red-50 text-red-600"
            : "bg-sky-100 text-sky-600";

  /*
  |--------------------------------------------------------------------------
  | BREADCRUMB CONFIGURATION
  |--------------------------------------------------------------------------
  */

  const breadcrumbLabel = isCreatePage
    ? "Record Payment"
    : isEditPage
      ? "Edit Payment"
      : isDetailsPage
        ? "Payment Details"
        : isReceiptPage
          ? "Payment Receipt"
          : isDeletePage
            ? "Delete Payment"
            : "All Payments";

  const breadcrumbIcon = isCreatePage
    ? FilePlus2
    : isEditPage
      ? Pencil
      : isDetailsPage
        ? Eye
        : isReceiptPage
          ? Printer
          : isDeletePage
            ? Trash2
            : Wallet;

  const BreadcrumbIcon = breadcrumbIcon;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <header className="mb-6 min-w-0">

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ================================================================
            HEADER CONTENT
        ================================================================ */}

        <div className="flex flex-col gap-5 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">

          {/* LEFT: TITLE */}

          <div className="flex min-w-0 items-start gap-3">

            {!isIndexPage && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                aria-label="Back to plot payments"
                title="Back to payments"
                className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            {/* DESKTOP ICON */}

            <div
              className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:flex ${iconContainerClass}`}
            >
              <Icon className="h-6 w-6" />
            </div>

            {/* TITLE AND DESCRIPTION */}

            <div className="min-w-0">

              <div className="flex items-center gap-2">

                {/* MOBILE ICON */}

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:hidden ${iconContainerClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {title}
                </h1>

              </div>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                {description}
              </p>

            </div>
          </div>

          {/* RIGHT: ACTIONS */}

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">

            {/* ============================================================
                PAYMENT INDEX
            ============================================================ */}

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
                  onClick={handleCreate}
                  disabled={loading}
                  className={primaryButton}
                >
                  <Plus className="h-4 w-4" />
                  <span>Record Payment</span>
                </button>
              </>
            )}

            {/* ============================================================
                CREATE PAYMENT
            ============================================================ */}

            {isCreatePage && (
              <button
                type="button"
                onClick={handleViewPayments}
                disabled={loading}
                className={secondaryButton}
              >
                <Receipt className="h-4 w-4" />
                <span>All Payments</span>
              </button>
            )}

            {/* ============================================================
                EDIT PAYMENT
            ============================================================ */}

            {isEditPage && (
              <>
                <button
                  type="button"
                  onClick={handleViewPayments}
                  disabled={loading}
                  className={secondaryButton}
                >
                  <Receipt className="h-4 w-4" />
                  <span>All Payments</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className={primaryButton}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    New Payment
                  </span>
                  <span className="sm:hidden">New</span>
                </button>
              </>
            )}

            {/* ============================================================
                PAYMENT DETAILS
            ============================================================ */}

            {isDetailsPage && (
              <>
                <button
                  type="button"
                  onClick={handleViewPayments}
                  disabled={loading}
                  className={secondaryButton}
                >
                  <Receipt className="h-4 w-4" />
                  <span>All Payments</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className={primaryButton}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    New Payment
                  </span>
                  <span className="sm:hidden">New</span>
                </button>
              </>
            )}

            {/* ============================================================
                PAYMENT RECEIPT
            ============================================================ */}

            {isReceiptPage && (
              <button
                type="button"
                onClick={handleViewPayments}
                disabled={loading}
                className={secondaryButton}
              >
                <Receipt className="h-4 w-4" />
                <span>All Payments</span>
              </button>
            )}

            {/* ============================================================
                DELETE PAYMENT
            ============================================================ */}

            {isDeletePage && (
              <button
                type="button"
                onClick={handleViewPayments}
                disabled={loading}
                className={secondaryButton}
              >
                <Receipt className="h-4 w-4" />
                <span>All Payments</span>
              </button>
            )}

          </div>
        </div>

        {/* ================================================================
            BREADCRUMB BAR
        ================================================================ */}

        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">

          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500"
          >

            <button
              type="button"
              onClick={() => navigate("/super-admin")}
              className="transition hover:text-sky-600"
            >
              Dashboard
            </button>

            <span className="text-slate-300">/</span>

            <button
              type="button"
              onClick={handleViewPayments}
              className={`transition ${isIndexPage
                ? "font-semibold text-slate-700"
                : "hover:text-sky-600"
                }`}
            >
              Plot Payments
            </button>

            {!isIndexPage && (
              <>
                <span className="text-slate-300">/</span>

                <span
                  className={`inline-flex items-center gap-1.5 font-semibold ${isCreatePage
                    ? "text-sky-700"
                    : isEditPage
                      ? "text-amber-700"
                      : isReceiptPage
                        ? "text-emerald-700"
                        : isDeletePage
                          ? "text-red-700"
                          : "text-blue-700"
                    }`}
                >
                  <BreadcrumbIcon className="h-3.5 w-3.5" />
                  {breadcrumbLabel}
                </span>
              </>
            )}

          </nav>
        </div>

      </div>
    </header>
  );
};

export default PlotPaymentHeader;
