import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

/**
 * ============================================================================
 * AUTH GUARD
 * ============================================================================
 * - Checks authentication
 * - Optionally checks roles
 * - Supports roles as strings or objects
 * - Redirects unauthenticated users to login
 * - Redirects unauthorized users to /unauthorized
 * ============================================================================
 */
export default function AuthGuard({
  children,
  roles = [],
}) {
  const location = useLocation();

  const { user, token } = useSelector(
    (state) => state.auth
  );

  /**
   * --------------------------------------------------------------------------
   * NOT LOGGED IN
   * --------------------------------------------------------------------------
   */
  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  /**
   * --------------------------------------------------------------------------
   * USER ROLES
   * Handles:
   * ["super-admin"]
   *
   * OR
   *
   * [{ id:1, name:"super-admin" }]
   * --------------------------------------------------------------------------
   */
  const userRoles = (user?.roles || []).map((role) =>
    typeof role === "string"
      ? role
      : role?.name || role?.slug
  );

  /**
   * --------------------------------------------------------------------------
   * ROLE CHECK
   * --------------------------------------------------------------------------
   */
  if (roles.length > 0) {
    const hasRole = roles.some((role) =>
      userRoles.includes(role)
    );

    if (!hasRole) {
      return (
        <Navigate
          to="/unauthorized"
          replace
        />
      );
    }
  }

  /**
   * --------------------------------------------------------------------------
   * AUTHORIZED
   * --------------------------------------------------------------------------
   */
  return children;
}