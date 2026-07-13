import { USER_ROLES } from "./constants";

/*
|--------------------------------------------------------------------------
| 🧠 SAFE ROLE NORMALIZER
|--------------------------------------------------------------------------
*/
const getRoles = (user) => {
  if (!user) return [];

  const roles = user.roles || user.role || [];

  return Array.isArray(roles) ? roles : [roles];
};

/*
|--------------------------------------------------------------------------
| 🔐 GENERIC ROLE CHECKER (CORE FUNCTION)
|--------------------------------------------------------------------------
*/
export const hasRole = (user, role) => {
  const roles = getRoles(user);
  return roles.includes(role);
};

/*
|--------------------------------------------------------------------------
| 🎯 PREDEFINED ROLE CHECKERS (CLEAN WRAPPERS)
|--------------------------------------------------------------------------
*/

export const isSuperAdmin = (user) =>
  hasRole(user, USER_ROLES.SUPER_ADMIN);

export const isAdmin = (user) =>
  hasRole(user, USER_ROLES.ADMIN);

export const isLandlord = (user) =>
  hasRole(user, USER_ROLES.LANDLORD);

export const isAgent = (user) =>
  hasRole(user, USER_ROLES.AGENT);

export const isTenant = (user) =>
  hasRole(user, USER_ROLES.TENANT);

/*
|--------------------------------------------------------------------------
| 🎯 MULTIPLE ROLE CHECKER
|--------------------------------------------------------------------------
*/
export const hasAnyRole = (user, roles = []) => {
  const userRoles = getRoles(user);
  return roles.some((role) => userRoles.includes(role));
};

/*
|--------------------------------------------------------------------------
| 🎯 PRIMARY ROLE
|--------------------------------------------------------------------------
*/
export const getPrimaryRole = (user) => {
  const roles = getRoles(user);
  return roles.length ? roles[0] : "guest";
};