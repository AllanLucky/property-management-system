import {
  FileBarChart,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const TENANT_ROUTES = {
  index: "/super-admin/tenants",
  create: "/super-admin/tenants/create",
  reports: "/super-admin/tenants/reports",
};

const TenantHeader = ({
  onRefresh,
  loading = false,
}) => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | NAVIGATION HANDLERS
  |--------------------------------------------------------------------------
  */

  const handleList = () => {
    navigate(TENANT_ROUTES.index);
  };

  const handleCreate = () => {
    navigate(TENANT_ROUTES.create);
  };

  const handleReports = () => {
    navigate(TENANT_ROUTES.reports);
  };

  /*
  |--------------------------------------------------------------------------
  | REFRESH HANDLER
  |--------------------------------------------------------------------------
  */

  const handleRefresh = () => {
    if (typeof onRefresh === "function") {
      onRefresh();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | KEYBOARD NAVIGATION
  |--------------------------------------------------------------------------
  */

  const handleListKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleList();
    }
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* ------------------------------------------------------------------
          PAGE INFORMATION
      ------------------------------------------------------------------ */}

      <div
        className="flex min-w-0 cursor-pointer items-start gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        onClick={handleList}
        onKeyDown={handleListKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Go to tenants"
      >
        {/* Icon */}

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Users className="h-6 w-6" />
        </div>

        {/* Title & Description */}

        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Tenants
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500">
            Manage tenants, tenancy information, and tenant accounts.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          HEADER ACTIONS
      ------------------------------------------------------------------ */}

      <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
        {/* --------------------------------------------------------------
            REFRESH
        -------------------------------------------------------------- */}

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="
            inline-flex
            min-h-[42px]
            flex-1
            items-center
            justify-center
            gap-2
            rounded-lg
            border
            border-gray-300
            bg-white
            px-3
            py-2.5
            text-sm
            font-medium
            text-gray-700
            shadow-sm
            transition
            duration-200
            hover:bg-gray-50
            focus:outline-none
            focus:ring-2
            focus:ring-primary-500
            focus:ring-offset-2
            disabled:cursor-not-allowed
            disabled:opacity-60
            sm:flex-none
            sm:px-4
          "
          aria-label="Refresh tenants"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""
              }`}
          />

          <span>Refresh</span>
        </button>

        {/* --------------------------------------------------------------
            REPORTS
        -------------------------------------------------------------- */}

        <button
          type="button"
          onClick={handleReports}
          className="
            inline-flex
            min-h-[42px]
            flex-1
            items-center
            justify-center
            gap-2
            rounded-lg
            border
            border-gray-300
            bg-white
            px-3
            py-2.5
            text-sm
            font-medium
            text-gray-700
            shadow-sm
            transition
            duration-200
            hover:border-primary-300
            hover:bg-primary-50
            hover:text-primary-700
            focus:outline-none
            focus:ring-2
            focus:ring-primary-500
            focus:ring-offset-2
            sm:flex-none
            sm:px-4
          "
          aria-label="View tenant reports"
        >
          <FileBarChart className="h-4 w-4" />

          <span>Reports</span>
        </button>

        {/* --------------------------------------------------------------
            CREATE TENANT
        -------------------------------------------------------------- */}

        <button
          type="button"
          onClick={handleCreate}
          className="
            inline-flex
            min-h-[42px]
            flex-1
            items-center
            justify-center
            gap-2
            rounded-lg
            bg-primary-600
            px-3
            py-2.5
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition
            duration-200
            hover:bg-primary-700
            focus:outline-none
            focus:ring-2
            focus:ring-primary-500
            focus:ring-offset-2
            sm:flex-none
            sm:px-4
          "
          aria-label="Add tenant"
        >
          <Plus className="h-4 w-4" />

          <span>Add Tenant</span>
        </button>
      </div>
    </div>
  );
};

export default TenantHeader;