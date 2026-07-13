const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "auth_user";

/*
|--------------------------------------------------------------------------
| 🧠 TOKEN HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Set access token (safe + normalized)
 */
export const setToken = (token) => {
  if (!token) return;

  const cleanToken = typeof token === "string"
    ? token.replace("Bearer ", "").trim()
    : null;

  if (!cleanToken) return;

  localStorage.setItem(ACCESS_TOKEN_KEY, cleanToken);
};

/**
 * Get access token
 */
export const getToken = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token || null;
};

/**
 * Remove token
 */
export const removeToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

/*
|--------------------------------------------------------------------------
| 🔄 REFRESH TOKEN
|--------------------------------------------------------------------------
*/

export const setRefreshToken = (token) => {
  if (!token || typeof token !== "string") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || null;
};

export const removeRefreshToken = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/*
|--------------------------------------------------------------------------
| 👤 USER STORAGE
|--------------------------------------------------------------------------
*/

export const setUser = (user) => {
  if (!user || typeof user !== "object") return;

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error("❌ Failed to store user:", e);
  }
};

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);

  if (!user) return null;

  try {
    const parsed = JSON.parse(user);

    // basic validation
    if (!parsed || typeof parsed !== "object") {
      removeUser();
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("❌ Failed to parse auth user:", error);

    removeUser();
    removeToken(); // IMPORTANT FIX
    removeRefreshToken();

    return null;
  }
};

export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

/*
|--------------------------------------------------------------------------
| 🚪 CLEAR AUTH
|--------------------------------------------------------------------------
*/

export const clearAuth = () => {
  removeToken();
  removeRefreshToken();
  removeUser();
};

/*
|--------------------------------------------------------------------------
| 🔍 AUTH STATE
|--------------------------------------------------------------------------
*/

/**
 * Check authentication (STRICT VERSION)
 */
export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();

  return !!token && !!user;
};

/**
 * Get full auth state
 */
export const getAuthState = () => {
  return {
    token: getToken(),
    refreshToken: getRefreshToken(),
    user: getUser(),
    isAuthenticated: isAuthenticated(),
  };
};