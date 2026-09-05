import {
  FileText,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

/**
 * ============================================================================
 * LEASE EMPTY STATE
 * ============================================================================
 *
 * Reusable empty-state component for the Lease Management module.
 *
 * Supported scenarios:
 * - No leases exist yet.
 * - Search/filter returned no results.
 * - User wants to reset the current filters.
 * - User can create a new lease.
 *
 * The component is intentionally independent from Redux/useLease so it can
 * safely be reused in different lease screens.
 * ============================================================================
 */

/**
 * ============================================================================
 * CONSTANTS
 * ============================================================================
 */

const DEFAULT_TITLE = "No leases found";

const DEFAULT_DESCRIPTION =
  "There are no lease records to display at the moment.";

/**
 * ============================================================================
 * HELPER COMPONENTS
 * ============================================================================
 */

/**
 * Empty-state action button.
 */
function ActionButton({
  children,
  icon: Icon,
  onClick,
  variant = "primary",
  disabled = false,
}) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 " +
    "text-sm font-medium transition-colors duration-200 " +
    "focus:outline-none focus:ring-2 focus:ring-offset-2 " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  const variantClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",

    secondary:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 " +
      "focus:ring-gray-400",

    ghost:
      "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 " +
      "focus:ring-gray-400",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${
        variantClasses[variant] || variantClasses.primary
      }`}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}

      <span>{children}</span>
    </button>
  );
}

/**
 * ============================================================================
 * MAIN COMPONENT
 * ============================================================================
 */

export default function LeaseEmptyState({
  /**
   * Visual / content configuration.
   */
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,

  /**
   * Indicates that the empty state is caused by active search/filter criteria.
   *
   * When true, the component presents messaging appropriate for a filtered
   * result set and can display a reset action.
   */
  hasFilters = false,

  /**
   * Optional action handlers.
   */
  onCreate,
  onReset,
  onRefresh,

  /**
   * Action visibility.
   */
  showCreate = true,
  showReset = true,
  showRefresh = false,

  /**
   * Loading state for refresh/reset operations.
   */
  loading = false,

  /**
   * Optional custom labels.
   */
  createLabel = "Create Lease",
  resetLabel = "Clear Filters",
  refreshLabel = "Refresh",

  /**
   * Visual configuration.
   */
  icon: CustomIcon = null,
  compact = false,
  className = "",
}) {
  /**
   * --------------------------------------------------------------------------
   * DERIVED VALUES
   * --------------------------------------------------------------------------
   */

  const EmptyIcon = CustomIcon || (hasFilters ? Search : FileText);

  const resolvedTitle = hasFilters
    ? "No leases match your filters"
    : title;

  const resolvedDescription = hasFilters
    ? "Try adjusting your search or filters to find the lease records you are looking for."
    : description;

  /**
   * --------------------------------------------------------------------------
   * RENDER
   * --------------------------------------------------------------------------
   */

  return (
    <div
      className={[
        "flex w-full items-center justify-center rounded-xl border border-dashed",
        "border-gray-300 bg-white text-center",
        compact ? "min-h-[280px] p-6" : "min-h-[420px] p-8",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mx-auto flex max-w-lg flex-col items-center">
        {/* ------------------------------------------------------------------
            ICON
        ------------------------------------------------------------------ */}

        <div
          className={[
            "flex items-center justify-center rounded-full",
            compact ? "mb-4 h-14 w-14" : "mb-5 h-16 w-16",
            hasFilters
              ? "bg-gray-100 text-gray-500"
              : "bg-blue-50 text-blue-600",
          ].join(" ")}
        >
          <EmptyIcon
            className={compact ? "h-6 w-6" : "h-8 w-8"}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </div>

        {/* ------------------------------------------------------------------
            TITLE
        ------------------------------------------------------------------ */}

        <h3
          className={[
            "font-semibold text-gray-900",
            compact ? "text-base" : "text-lg",
          ].join(" ")}
        >
          {resolvedTitle}
        </h3>

        {/* ------------------------------------------------------------------
            DESCRIPTION
        ------------------------------------------------------------------ */}

        <p
          className={[
            "mt-2 max-w-md leading-6 text-gray-500",
            compact ? "text-sm" : "text-sm",
          ].join(" ")}
        >
          {resolvedDescription}
        </p>

        {/* ------------------------------------------------------------------
            ACTIONS
        ------------------------------------------------------------------ */}

        {(onCreate || (hasFilters && onReset) || onRefresh) && (
          <div
            className={[
              "mt-6 flex flex-wrap items-center justify-center gap-3",
              compact ? "gap-2" : "",
            ].join(" ")}
          >
            {/* Reset filters */}
            {hasFilters && showReset && onReset && (
              <ActionButton
                icon={RefreshCw}
                variant="secondary"
                onClick={onReset}
                disabled={loading}
              >
                {resetLabel}
              </ActionButton>
            )}

            {/* Refresh */}
            {showRefresh && onRefresh && (
              <ActionButton
                icon={RefreshCw}
                variant="secondary"
                onClick={onRefresh}
                disabled={loading}
              >
                {refreshLabel}
              </ActionButton>
            )}

            {/* Create lease */}
            {showCreate && onCreate && (
              <ActionButton
                icon={Plus}
                variant="primary"
                onClick={onCreate}
                disabled={loading}
              >
                {createLabel}
              </ActionButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * PRESET EMPTY STATES
 * ============================================================================
 *
 * These named components make common Lease UI scenarios easier to express
 * without duplicating configuration throughout the module.
 * ============================================================================
 */

/**
 * Empty state for a completely empty lease database.
 */
export function LeaseNoRecords({
  onCreate,
  onRefresh,
  loading = false,
  className = "",
}) {
  return (
    <LeaseEmptyState
      title="No leases yet"
      description="You have not created any lease records yet. Create a lease to start managing your tenant agreements."
      hasFilters={false}
      onCreate={onCreate}
      onRefresh={onRefresh}
      showRefresh={Boolean(onRefresh)}
      loading={loading}
      className={className}
    />
  );
}

/**
 * Empty state for filtered/search results.
 */
export function LeaseNoResults({
  onReset,
  onCreate,
  loading = false,
  className = "",
}) {
  return (
    <LeaseEmptyState
      title="No leases found"
      description="Try adjusting your search or filters to find matching lease records."
      hasFilters
      onReset={onReset}
      onCreate={onCreate}
      loading={loading}
      className={className}
    />
  );
}

/**
 * Compact empty state for cards, dashboards, or smaller containers.
 */
export function LeaseEmptyStateCompact({
  title = "No leases found",
  description = "There are no lease records to display.",
  hasFilters = false,
  onCreate,
  onReset,
  onRefresh,
  loading = false,
  className = "",
}) {
  return (
    <LeaseEmptyState
      title={title}
      description={description}
      hasFilters={hasFilters}
      onCreate={onCreate}
      onReset={onReset}
      onRefresh={onRefresh}
      showRefresh={Boolean(onRefresh)}
      loading={loading}
      compact
      className={className}
    />
  );
}