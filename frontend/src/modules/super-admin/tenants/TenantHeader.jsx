import {
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const TenantHeader = ({
  onRefresh,
  loading = false,
}) => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | NAVIGATE TO CREATE TENANT PAGE
  |--------------------------------------------------------------------------
  */

  const handleCreate = () => {
    navigate("/super-admin/tenants/create");
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/*
      |--------------------------------------------------------------------------
      | PAGE INFORMATION
      |--------------------------------------------------------------------------
      */}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Users className="h-6 w-6" />
        </div>

        {/* Title & Description */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Tenants
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage tenants, tenancy information,
            and tenant accounts.
          </p>
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | HEADER ACTIONS
      |--------------------------------------------------------------------------
      */}

      <div className="flex items-center gap-2">
        {/* --------------------------------------------------------------
            REFRESH BUTTON
        -------------------------------------------------------------- */}

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="
            inline-flex
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
            focus:ring-2
            focus:ring-primary-500
            focus:ring-offset-2
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
          aria-label="Refresh tenants"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""
              }`}
          />

          <span className="hidden sm:inline">
            Refresh
          </span>
        </button>

        {/* --------------------------------------------------------------
            CREATE TENANT BUTTON
        -------------------------------------------------------------- */}

        <button
          type="button"
          onClick={handleCreate}
          className="
            inline-flex
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
            focus:ring-2
            focus:ring-primary-500
            focus:ring-offset-2
          "
        >
          <Plus className="h-4 w-4" />

          <span>
            Add Tenant
          </span>
        </button>
      </div>
    </div>
  );
};

export default TenantHeader;