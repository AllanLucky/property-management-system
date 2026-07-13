export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

/*
|--------------------------------------------------------------------------
| 🧠 APP CONFIG
|--------------------------------------------------------------------------
*/
export const APP_NAME = "Estate Management System";

/*
|--------------------------------------------------------------------------
| 🔐 USER ROLES (MUST MATCH LARAVEL EXACTLY)
|--------------------------------------------------------------------------
| These should match Spatie roles in backend
*/
export const USER_ROLES = Object.freeze({
  SUPER_ADMIN: "super-admin",
  ADMIN: "admin",
  LANDLORD: "landlord",
  AGENT: "agent",
  TENANT: "tenant",
  TECHNICIAN: "technician",
  ACCOUNTANT: "accountant",
});

/*
|--------------------------------------------------------------------------
| 💾 STORAGE KEYS
|--------------------------------------------------------------------------
*/
export const STORAGE_KEYS = Object.freeze({
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "auth_user",
});

/*
|--------------------------------------------------------------------------
| 🧠 STORAGE HELPERS (SAFE JSON SUPPORT)
|--------------------------------------------------------------------------
*/

export const getStorageItem = (key, parse = false) => {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;

    return parse ? JSON.parse(value) : value;
  } catch (error) {
    console.error("Storage read error:", error);
    return null;
  }
};

export const setStorageItem = (key, value, stringify = false) => {
  try {
    if (value === undefined || value === null) return;

    const data = stringify ? JSON.stringify(value) : value;
    localStorage.setItem(key, data);
  } catch (error) {
    console.error("Storage write error:", error);
  }
};

export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Storage remove error:", error);
  }
};

/*
|--------------------------------------------------------------------------
| 🔐 ROLE UTILITIES (OPTIONAL BUT VERY USEFUL)
|--------------------------------------------------------------------------
*/

export const isRole = (user, role) => {
  if (!user) return false;

  const roles = user.roles || [];
  const normalized = Array.isArray(roles) ? roles : [roles];

  return normalized.includes(role);
};

export const hasRole = (user, role) => isRole(user, role);