import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
export default function PermissionGuard({
  children,
  permission = null,
  permissions = [],
  requireAll = false,
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
   * NORMALIZE ROLES
   * Supports:
   * ["super-admin"]
   *
   * OR
   *
   * [{ id:1, name:"super-admin" }]
   * --------------------------------------------------------------------------
   */
  const normalizedRoles = (user?.roles || [])
    .map((role) =>
      typeof role === "string"
        ? role
        : role?.name || role?.slug
    )
    .filter(Boolean);
    
  const normalizedPermissions = (
    user?.permissions || []
  )
    .map((perm) =>
      typeof perm === "string"
        ? perm
        : perm?.name || perm?.slug
    )
    .filter(Boolean);

  /**
   * --------------------------------------------------------------------------
   * SUPER ADMIN BYPASS
   * --------------------------------------------------------------------------
   */
  if (normalizedRoles.includes("super-admin")) {
    return children;
  }

  /**
   * --------------------------------------------------------------------------
   * BUILD REQUIRED PERMISSIONS
   * Supports:
   * permission="users.view"
   *
   * OR
   *
   * permissions={[
   *   "users.view",
   *   "users.create"
   * ]}
   * --------------------------------------------------------------------------
   */
  const requiredPermissions = [
    ...(permission ? [permission] : []),
    ...permissions,
  ];

  /**
   * --------------------------------------------------------------------------
   * NO PERMISSIONS REQUIRED
   * --------------------------------------------------------------------------
   */
  if (!requiredPermissions.length) {
    return children;
  }

  /**
   * --------------------------------------------------------------------------
   * CHECK ACCESS
   * --------------------------------------------------------------------------
   */
  const hasAccess = requireAll
    ? requiredPermissions.every((perm) =>
        normalizedPermissions.includes(perm)
      )
    : requiredPermissions.some((perm) =>
        normalizedPermissions.includes(perm)
      );

  /**
   * --------------------------------------------------------------------------
   * ACCESS DENIED
   * --------------------------------------------------------------------------
   */
  if (!hasAccess) {
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