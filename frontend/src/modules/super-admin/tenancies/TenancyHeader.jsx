import {
  ArrowLeft,
  BarChart3,
  Plus,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * TenancyHeader
 *
 * Header for the Tenancy management module.
 *
 * Supports:
 * - Back navigation
 * - Create tenancy
 * - Assign unit
 * - Statistics
 * - Refresh
 *
 * Props:
 * - title
 * - description
 * - showBack
 * - showCreate
 * - showAssign
 * - showStatistics
 * - showRefresh
 * - onRefresh
 * - loading
 */
const TenancyHeader = ({
  title = "Tenancies",
  description = "Manage tenant agreements, unit assignments, payments and tenancy status.",
  showBack = false,
  showCreate = true,
  showAssign = true,
  showStatistics = true,
  showRefresh = true,
  onRefresh,
  loading = false,
}) => {
  const navigate = useNavigate();

  /**
   * Navigate to tenancy list.
   */
  const handleBack = () => {
    navigate("/super-admin/tenancies");
  };

  /**
   * Navigate to create tenancy.
   */
  const handleCreate = () => {
    navigate("/super-admin/tenancies/create");
  };

  /**
   * Navigate to assign unit.
   */
  const handleAssignUnit = () => {
    navigate("/super-admin/tenancies/assign-unit");
  };

  /**
   * Navigate to statistics.
   */
  const handleStatistics = () => {
    navigate("/super-admin/tenancies/statistics");
  };

  /**
   * Refresh tenancy data.
   */
  const handleRefresh = () => {
    if (typeof onRefresh === "function") {
      onRefresh();
    }
  };

  return (
    <div className="mb-6">
      {/* ================================================================
          HEADER
      ================================================================ */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* ============================================================
            LEFT SIDE
        ============================================================ */}
        <div className="flex items-start gap-3">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back to tenancies"
              className="
                mt-1
                inline-flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-lg
                border
                border-gray-200
                bg-white
                text-gray-600
                shadow-sm
                transition
                hover:bg-gray-50
                hover:text-gray-900
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-500
                focus:ring-offset-2
                dark:border-gray-700
                dark:bg-gray-800
                dark:text-gray-300
                dark:hover:bg-gray-700
                dark:hover:text-white
              "
            >
              <ArrowLeft size={19} />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1
                className="
                  text-2xl
                  font-bold
                  tracking-tight
                  text-gray-900
                  dark:text-white
                "
              >
                {title}
              </h1>
            </div>

            {description && (
              <p
                className="
                  mt-1
                  max-w-3xl
                  text-sm
                  leading-6
                  text-gray-500
                  dark:text-gray-400
                "
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* ============================================================
            ACTIONS
        ============================================================ */}
        <div className="flex flex-wrap items-center gap-2">
          {/* ========================================================
              REFRESH
          ======================================================== */}
          {showRefresh && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh tenancies"
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-gray-200
                bg-white
                px-3
                text-sm
                font-medium
                text-gray-700
                shadow-sm
                transition
                hover:bg-gray-50
                disabled:cursor-not-allowed
                disabled:opacity-50
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-500
                focus:ring-offset-2
                dark:border-gray-700
                dark:bg-gray-800
                dark:text-gray-200
                dark:hover:bg-gray-700
              "
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>
          )}

          {/* ========================================================
              STATISTICS
          ======================================================== */}
          {showStatistics && (
            <button
              type="button"
              onClick={handleStatistics}
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-gray-200
                bg-white
                px-3
                text-sm
                font-medium
                text-gray-700
                shadow-sm
                transition
                hover:bg-gray-50
                hover:text-gray-900
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-500
                focus:ring-offset-2
                dark:border-gray-700
                dark:bg-gray-800
                dark:text-gray-200
                dark:hover:bg-gray-700
              "
            >
              <BarChart3 size={17} />

              <span className="hidden sm:inline">
                Statistics
              </span>
            </button>
          )}

          {/* ========================================================
              ASSIGN UNIT
          ======================================================== */}
          {showAssign && (
            <button
              type="button"
              onClick={handleAssignUnit}
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-indigo-200
                bg-indigo-50
                px-3
                text-sm
                font-medium
                text-indigo-700
                shadow-sm
                transition
                hover:bg-indigo-100
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-500
                focus:ring-offset-2
                dark:border-indigo-800
                dark:bg-indigo-950/40
                dark:text-indigo-300
                dark:hover:bg-indigo-950/70
              "
            >
              <UserPlus size={17} />

              <span className="hidden sm:inline">
                Assign Unit
              </span>
            </button>
          )}

          {/* ========================================================
              CREATE TENANCY
          ======================================================== */}
          {showCreate && (
            <button
              type="button"
              onClick={handleCreate}
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-indigo-600
                px-4
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-indigo-700
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-500
                focus:ring-offset-2
                dark:bg-indigo-500
                dark:hover:bg-indigo-600
              "
            >
              <Plus size={18} />

              <span>
                Create Tenancy
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenancyHeader;