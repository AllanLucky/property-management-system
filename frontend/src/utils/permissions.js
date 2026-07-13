import { isSuperAdmin } from "./roles";

/*
|--------------------------------------------------------------------------
| 🧠 SAFE PERMISSION NORMALIZER
|--------------------------------------------------------------------------
| Handles different API shapes safely:
| - permissions: []
| - permission: []
| - null / undefined
*/
const getPermissions = (user) => {
  if (!user) return [];

  const permissions =
    user.permissions ||
    user.permission ||
    [];

  return Array.isArray(permissions)
    ? permissions
    : [permissions];
};

/*
|--------------------------------------------------------------------------
| 🔐 CORE PERMISSION CHECKER
|--------------------------------------------------------------------------
*/
export const hasPermission = (user, permission) => {
  if (!user || !permission) return false;

  // super admin bypass
  if (isSuperAdmin(user)) return true;

  const userPermissions = getPermissions(user);

  return userPermissions.includes(permission);
};

/*
|--------------------------------------------------------------------------
| 🔐 MULTIPLE PERMISSIONS (ANY)
|--------------------------------------------------------------------------
*/
export const hasAnyPermission = (user, permissions = []) => {
  if (!user || !Array.isArray(permissions)) return false;

  if (isSuperAdmin(user)) return true;

  const userPermissions = getPermissions(user);

  return permissions.some((perm) =>
    userPermissions.includes(perm)
  );
};

/*
|--------------------------------------------------------------------------
| 🔐 MULTIPLE PERMISSIONS (ALL)
|--------------------------------------------------------------------------
*/
export const hasAllPermissions = (user, permissions = []) => {
  if (!user || !Array.isArray(permissions)) return false;

  if (isSuperAdmin(user)) return true;

  const userPermissions = getPermissions(user);

  return permissions.every((perm) =>
    userPermissions.includes(perm)
  );
};

/*
|--------------------------------------------------------------------------
| 🎯 COMBINED CHECK (ROLE + PERMISSION)
|--------------------------------------------------------------------------
| Useful for advanced RBAC rules
*/
export const canAccess = (user, permission) => {
  return hasPermission(user, permission);
};