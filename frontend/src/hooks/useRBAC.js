import { useSelector } from "react-redux";

/*
|--------------------------------------------------------------------------
| 🧠 SAFE NORMALIZERS
|--------------------------------------------------------------------------
*/
const normalizeRoles = (user) => {
  if (!user) return [];

  const roles = user.roles || [];
  return Array.isArray(roles) ? roles : [roles];
};

const normalizePermissions = (user) => {
  if (!user) return [];

  const permissions = user.permissions || [];
  return Array.isArray(permissions)
    ? permissions
    : [permissions];
};

/*
|--------------------------------------------------------------------------
| RBAC HOOK
|--------------------------------------------------------------------------
*/
export default function useRBAC() {
  const { user } = useSelector((state) => state.auth);

  const roles = normalizeRoles(user);
  const permissions = normalizePermissions(user);

  /*
  |--------------------------------------------------------------------------
  | 🔐 ROLE CHECKS
  |--------------------------------------------------------------------------
  */

  const hasRole = (roleName) => {
    if (!roleName || !roles.length) return false;

    return roles.some((role) =>
      typeof role === "string"
        ? role === roleName
        : role?.name === roleName
    );
  };

  const hasAnyRole = (roleList = []) => {
    if (!Array.isArray(roleList)) return false;
    return roleList.some((role) => hasRole(role));
  };

  /*
  |--------------------------------------------------------------------------
  | 🔐 PERMISSION CHECKS
  |--------------------------------------------------------------------------
  */

  const hasPermission = (permission) => {
    if (!permission || !permissions.length) return false;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList = []) => {
    if (!Array.isArray(permissionList)) return false;

    return permissionList.some((p) =>
      permissions.includes(p)
    );
  };

  const hasAllPermissions = (permissionList = []) => {
    if (!Array.isArray(permissionList)) return false;

    return permissionList.every((p) =>
      permissions.includes(p)
    );
  };

  /*
  |--------------------------------------------------------------------------
  | 🔥 SUPER ADMIN OVERRIDE
  |--------------------------------------------------------------------------
  */
  const isSuperAdmin = () =>
    roles.includes("super-admin");

  const canAccess = (permission) => {
    if (!permission) return false;

    return (
      isSuperAdmin() || hasPermission(permission)
    );
  };

  /*
  |--------------------------------------------------------------------------
  | 📦 RETURN API
  |--------------------------------------------------------------------------
  */
  return {
    user,

    roles,
    permissions,

    hasRole,
    hasAnyRole,

    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    isSuperAdmin,
    canAccess,
  };
}