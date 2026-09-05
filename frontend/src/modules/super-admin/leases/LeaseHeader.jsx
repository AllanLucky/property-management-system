import {
  ArrowLeft,
  Edit3,
  FileText,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

const LEASE_ROUTES = {
  index: "/super-admin/leases",
  create: "/super-admin/leases/create",
};

/*
|--------------------------------------------------------------------------
| Lease Header
|--------------------------------------------------------------------------
*/

const LeaseHeader = ({
  onRefresh,
  loading = false,
  mode = "list",
}) => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | Normalize Mode
  |--------------------------------------------------------------------------
  */

  const currentMode =
    mode === "create" || mode === "edit"
      ? mode
      : "list";

  const isListPage = currentMode === "list";
  const isCreatePage = currentMode === "create";
  const isEditPage = currentMode === "edit";

  /*
  |--------------------------------------------------------------------------
  | Page Configuration
  |--------------------------------------------------------------------------
  */

  const pageConfig = {
    list: {
      title: "Leases",
      description:
        "Manage lease agreements, tenancy contracts, financial terms, and lease lifecycle activities.",
      icon: FileText,
    },

    create: {
      title: "Create Lease",
      description:
        "Create a new lease agreement and define its tenancy, financial, payment, and contract terms.",
      icon: Plus,
    },

    edit: {
      title: "Edit Lease",
      description:
        "Update the lease agreement, financial terms, payment schedule, and other contract details.",
      icon: Edit3,
    },
  };

  const config = pageConfig[currentMode];
  const PageIcon = config.icon;

  /*
  |--------------------------------------------------------------------------
  | Navigation Handlers
  |--------------------------------------------------------------------------
  */

  /**
   * Navigate back to the Lease Management list.
   */
  const handleBack = () => {
    navigate(LEASE_ROUTES.index);
  };

  /**
   * Navigate to the Create Lease page.
   */
  const handleCreate = () => {
    navigate(LEASE_ROUTES.create);
  };

  /*
  |--------------------------------------------------------------------------
  | Refresh Handler
  |--------------------------------------------------------------------------
  */

  const handleRefresh = () => {
    if (typeof onRefresh !== "function" || loading) {
      return;
    }

    onRefresh();
  };

  /*
  |--------------------------------------------------------------------------
  | Header
  |--------------------------------------------------------------------------
  */

  return (
    <header
      className="
        flex
        flex-col
        gap-4
        lg:flex-row
        lg:items-center
        lg:justify-between
      "
      aria-label={`${config.title} page`}
    >
      {/* ------------------------------------------------------------------
          PAGE INFORMATION
      ------------------------------------------------------------------ */}

      <div className="flex min-w-0 items-start gap-3">
        {/* --------------------------------------------------------------
            BACK BUTTON - CREATE / EDIT ONLY
        -------------------------------------------------------------- */}

        {!isListPage && (
          <button
            type="button"
            onClick={handleBack}
            className="
              mt-0.5
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-gray-200
              bg-white
              text-gray-600
              shadow-sm
              transition
              hover:border-gray-300
              hover:bg-gray-50
              hover:text-gray-900
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-primary-500
              focus-visible:ring-offset-2
              active:bg-gray-100
              dark:border-gray-800
              dark:bg-gray-900
              dark:text-gray-300
              dark:hover:border-gray-700
              dark:hover:bg-gray-800
              dark:hover:text-white
              dark:focus-visible:ring-offset-gray-950
            "
            aria-label="Back to Lease Management"
            title="Back to Lease Management"
          >
            <ArrowLeft
              className="h-5 w-5"
              aria-hidden="true"
            />
          </button>
        )}

        {/* --------------------------------------------------------------
            PAGE ICON
        -------------------------------------------------------------- */}

        <span
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-primary-50
            text-primary-600
            dark:bg-primary-950/40
            dark:text-primary-400
          "
          aria-hidden="true"
        >
          <PageIcon className="h-6 w-6" />
        </span>

        {/* --------------------------------------------------------------
            TITLE & DESCRIPTION
        -------------------------------------------------------------- */}

        <div className="min-w-0">
          <h1
            className="
              text-2xl
              font-bold
              tracking-tight
              text-gray-900
              dark:text-white
            "
          >
            {config.title}
          </h1>

          <p
            className="
              mt-1
              max-w-2xl
              text-sm
              leading-6
              text-gray-500
              dark:text-gray-400
            "
          >
            {config.description}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          HEADER ACTIONS
      ------------------------------------------------------------------ */}

      <div
        className="
          flex
          w-full
          items-center
          gap-2
          sm:w-auto
        "
      >
        {/* ==============================================================
            LIST PAGE ACTIONS
        ============================================================== */}

        {isListPage && (
          <>
            {/* ----------------------------------------------------------
                REFRESH
            ---------------------------------------------------------- */}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="
                inline-flex
                min-h-10
                flex-1
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-gray-300
                bg-white
                px-4
                py-2.5
                text-sm
                font-medium
                text-gray-700
                shadow-sm
                transition
                hover:bg-gray-50
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-primary-500
                focus-visible:ring-offset-2
                disabled:cursor-not-allowed
                disabled:opacity-60
                sm:flex-none
                dark:border-gray-700
                dark:bg-gray-900
                dark:text-gray-200
                dark:hover:bg-gray-800
                dark:focus-visible:ring-offset-gray-950
              "
              aria-label={
                loading
                  ? "Refreshing leases"
                  : "Refresh leases"
              }
              aria-busy={loading}
            >
              <RefreshCw
                className={`
                  h-4
                  w-4
                  shrink-0
                  ${loading ? "animate-spin" : ""}
                `}
                aria-hidden="true"
              />

              <span>
                {loading ? "Refreshing..." : "Refresh"}
              </span>
            </button>

            {/* ----------------------------------------------------------
                ADD LEASE
            ---------------------------------------------------------- */}

            <button
              type="button"
              onClick={handleCreate}
              className="
                inline-flex
                min-h-10
                flex-1
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-primary-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-primary-700
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-primary-500
                focus-visible:ring-offset-2
                active:bg-primary-800
                sm:flex-none
                dark:focus-visible:ring-offset-gray-950
              "
              aria-label="Add new lease"
            >
              <Plus
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />

              <span>
                Add Lease
              </span>
            </button>
          </>
        )}

        {/* ==============================================================
            CREATE PAGE ACTIONS
        ============================================================== */}

        {isCreatePage && (
          <button
            type="button"
            onClick={handleBack}
            className="
              inline-flex
              min-h-10
              w-full
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-gray-300
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-gray-700
              shadow-sm
              transition
              hover:bg-gray-50
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-primary-500
              focus-visible:ring-offset-2
              active:bg-gray-100
              sm:w-auto
              dark:border-gray-700
              dark:bg-gray-900
              dark:text-gray-200
              dark:hover:bg-gray-800
              dark:focus-visible:ring-offset-gray-950
            "
            aria-label="Back to Lease Management"
          >
            <ArrowLeft
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            />

            <span>
              Back to Leases
            </span>
          </button>
        )}

        {/* ==============================================================
            EDIT PAGE ACTIONS
        ============================================================== */}

        {isEditPage && (
          <button
            type="button"
            onClick={handleBack}
            className="
              inline-flex
              min-h-10
              w-full
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-gray-300
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-gray-700
              shadow-sm
              transition
              hover:bg-gray-50
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-primary-500
              focus-visible:ring-offset-2
              active:bg-gray-100
              sm:w-auto
              dark:border-gray-700
              dark:bg-gray-900
              dark:text-gray-200
              dark:hover:bg-gray-800
              dark:focus-visible:ring-offset-gray-950
            "
            aria-label="Back to Lease Management"
          >
            <ArrowLeft
              className="h-4 w-4 shrink-0"
              aria-hidden="true"
            />

            <span>
              Back to Leases
            </span>
          </button>
        )}
      </div>
    </header>
  );
};

export default LeaseHeader;