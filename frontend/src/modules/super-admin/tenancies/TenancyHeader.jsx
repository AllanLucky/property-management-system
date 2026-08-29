
import {
  ArrowLeft,
  BarChart3,
  Plus,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * ============================================================================
 * TENANCY HEADER
 * ============================================================================
 *
 * Header for the Tenancy management module.
 *
 * Supports:
 * - Back navigation
 * - Create tenancy
 * - Navigate to Assign Unit page
 * - Statistics
 * - Refresh
 *
 * IMPORTANT:
 *
 * Assign Unit only NAVIGATES to:
 *
 * /super-admin/tenancies/:tenancyId/assign-unit
 *
 * It does NOT assign the unit here.
 *
 * The actual POST request is made inside the AssignUnit page
 * after the user selects a unit and clicks "Assign Unit".
 *
 * Props:
 * - title
 * - description
 * - showBack
 * - showCreate
 * - showAssign
 * - showStatistics
 * - showRefresh
 * - tenancyId
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
  tenancyId = null,
  onRefresh,
  loading = false,
}) => {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  /**
   * Navigate back to tenancy list.
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
   * Navigate to Assign Unit page.
   *
   * IMPORTANT:
   * This does NOT call the API.
   *
   * Example:
   *
   * tenancyId = 26
   *
   * Result:
   *
   * /super-admin/tenancies/26/assign-unit
   */
  const handleAssignUnit = () => {
    if (
      tenancyId === null ||
      tenancyId === undefined ||
      String(tenancyId).trim() === ""
    ) {
      console.warn(
        "TenancyHeader: tenancyId is required to open Assign Unit page."
      );

      return;
    }

    navigate(
      `/super-admin/tenancies/${tenancyId}/assign-unit`
    );
  };

  /**
   * Navigate to statistics.
   */
  const handleStatistics = () => {
    navigate("/super-admin/tenancies/statistics");
  };

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const handleRefresh = () => {
    if (loading) {
      return;
    }

    if (typeof onRefresh === "function") {
      onRefresh();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ASSIGN UNIT AVAILABILITY
  |--------------------------------------------------------------------------
  */

  const canAssignUnit =
    tenancyId !== null &&
    tenancyId !== undefined &&
    String(tenancyId).trim() !== "";

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mb-6">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div
        className="
          flex
          flex-col
          gap-4
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        {/* ============================================================
            LEFT SIDE
        ============================================================ */}

        <div className="flex min-w-0 items-start gap-3">
          {/* ==========================================================
              BACK BUTTON
          ========================================================== */}

          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back to tenancies"
              title="Back to tenancies"
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
                duration-200
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

          {/* ==========================================================
              TITLE / DESCRIPTION
          ========================================================== */}

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
              {title}
            </h1>

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

        <div
          className="
            flex
            w-full
            shrink-0
            flex-wrap
            items-center
            justify-start
            gap-2
            lg:w-auto
            lg:justify-end
          "
        >
          {/* ========================================================
              REFRESH
          ======================================================== */}

          {showRefresh && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              aria-label={
                loading
                  ? "Refreshing tenancies"
                  : "Refresh tenancies"
              }
              title={
                loading
                  ? "Refreshing..."
                  : "Refresh tenancies"
              }
              className="
                inline-flex
                h-10
                min-w-[42px]
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
                transition-all
                duration-200
                hover:border-gray-300
                hover:bg-gray-50
                hover:text-gray-900
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-60
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-500
                focus:ring-offset-2
                dark:border-gray-700
                dark:bg-gray-800
                dark:text-gray-200
                dark:hover:bg-gray-700
                dark:hover:text-white
              "
            >
              <RefreshCw
                size={17}
                strokeWidth={2}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              <span className="hidden sm:inline">
                {loading
                  ? "Refreshing..."
                  : "Refresh"}
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
              title="View tenancy statistics"
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
                transition-all
                duration-200
                hover:border-gray-300
                hover:bg-gray-50
                hover:text-gray-900
                active:scale-[0.98]
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-500
                focus:ring-offset-2
                dark:border-gray-700
                dark:bg-gray-800
                dark:text-gray-200
                dark:hover:bg-gray-700
                dark:hover:text-white
              "
            >
              <BarChart3
                size={17}
                strokeWidth={2}
              />

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
              disabled={!canAssignUnit}
              aria-label={
                canAssignUnit
                  ? "Open Assign Unit page"
                  : "Tenancy ID is required"
              }
              title={
                canAssignUnit
                  ? "Open Assign Unit page"
                  : "Tenancy ID is required"
              }
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
                transition-all
                duration-200
                hover:border-indigo-300
                hover:bg-indigo-100
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
                disabled:hover:border-indigo-200
                disabled:hover:bg-indigo-50
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-500
                focus:ring-offset-2
                dark:border-indigo-800
                dark:bg-indigo-950/40
                dark:text-indigo-300
                dark:hover:bg-indigo-950/70
                dark:disabled:hover:bg-indigo-950/40
              "
            >
              <UserPlus
                size={17}
                strokeWidth={2}
              />

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
              title="Create new tenancy"
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
                transition-all
                duration-200
                hover:bg-indigo-700
                active:scale-[0.98]
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-500
                focus:ring-offset-2
                dark:bg-indigo-500
                dark:hover:bg-indigo-600
              "
            >
              <Plus
                size={18}
                strokeWidth={2}
              />

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
