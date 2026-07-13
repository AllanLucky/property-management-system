import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";


export default function RoleGuard({
  children,
  roles = [],
}) {
  const location = useLocation();

  const { user, token } = useSelector(
    (state) => state.auth
  );

  /**
   * --------------------------------------------------------------------------
   * NOT AUTHENTICATED
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
   * NORMALIZE USER ROLES
   *
   * Supports:
   * ["super-admin"]
   *
   * OR
   *
   * [
   *   {
   *     id: 1,
   *     name: "super-admin"
   *   }
   * ]
   * --------------------------------------------------------------------------
   */
  const normalizedUserRoles = (
    user?.roles || []
  )
    .map((role) =>
      typeof role === "string"
        ? role
        : role?.name || role?.slug
    )
    .filter(Boolean);

  /**
   * --------------------------------------------------------------------------
   * SUPER ADMIN BYPASS
   * --------------------------------------------------------------------------
   */
  if (normalizedUserRoles.includes("super-admin")) {
    return children;
  }

  /**
   * --------------------------------------------------------------------------
   * NO ROLE RESTRICTION
   * --------------------------------------------------------------------------
   */
  if (!roles.length) {
    return children;
  }

  /**
   * --------------------------------------------------------------------------
   * ROLE CHECK
   * --------------------------------------------------------------------------
   */
  const hasRole = roles.some((role) =>
    normalizedUserRoles.includes(role)
  );

  /**
   * --------------------------------------------------------------------------
   * ACCESS DENIED
   * --------------------------------------------------------------------------
   */
  if (!hasRole) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{ from: location }}
      />
    );
  }

  /**
   * --------------------------------------------------------------------------
   * ACCESS GRANTED
   * --------------------------------------------------------------------------
   */
  return children;
}