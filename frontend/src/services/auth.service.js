import * as authAPI from "../api/auth.api";
import {
  setToken,
  setRefreshToken,
  setUser,
  clearAuth,
  getUser,
} from "../utils/token";

/*
|--------------------------------------------------------------------------
| SAFE RESPONSE NORMALIZER
|--------------------------------------------------------------------------
*/
const normalizeResponse = (response) => {
  return response?.data?.data ??
         response?.data ??
         response ??
         null;
};

/*
|--------------------------------------------------------------------------
| SAFE ARRAY FALLBACK
|--------------------------------------------------------------------------
*/
const safeArray = (value) => Array.isArray(value) ? value : [];

/*
|--------------------------------------------------------------------------
| AUTH SERVICE
|--------------------------------------------------------------------------
*/
const authService = {
  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */
  async login(credentials) {
    const response = await authAPI.loginApi(credentials);
    const data = normalizeResponse(response);

    console.log("LOGIN RESPONSE DEBUG:", data);

    const user = data?.user;
    const token = data?.access_token || data?.token;
    const refreshToken = data?.refresh_token;

    if (!user || !token) {
      throw new Error("Invalid login response");
    }

    setToken(token);

    setUser({
      id: user.id,
      name: user.full_name || user.name || "",
      email: user.email || "",

      image: user.image || null,
      image_url: user.image_url || null,

      roles: safeArray(user.roles),
      permissions: safeArray(user.permissions),
    });

    if (refreshToken) {
      setRefreshToken(refreshToken);
    }

    return {
      user,
      token,
      roles: safeArray(user.roles),
      permissions: safeArray(user.permissions),
    };
  },

  /*
  |--------------------------------------------------------------------------
  | REGISTER
  |--------------------------------------------------------------------------
  */
  async register(payload) {
    const response = await authAPI.registerApi(payload);
    return normalizeResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */
  async logout() {
    try {
      await authAPI.logoutApi();
    } catch (error) {
      console.warn("Logout API failed:", error?.message);
    } finally {
      clearAuth();

      window.dispatchEvent(new Event("auth:logout"));
    }
  },

  /*
  |--------------------------------------------------------------------------
  | PROFILE
  |--------------------------------------------------------------------------
  */
  async getProfile() {
    const response = await authAPI.getAuthUserApi();
    return normalizeResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | REFRESH TOKEN
  |--------------------------------------------------------------------------
  */
  async refreshToken() {
    const response = await authAPI.refreshTokenApi();
    const data = normalizeResponse(response);

    const token = data?.access_token || data?.token;

    if (!token) {
      throw new Error("Invalid refresh response");
    }

    setToken(token);

    if (data?.refresh_token) {
      setRefreshToken(data.refresh_token);
    }

    return token;
  },

  /*
  |--------------------------------------------------------------------------
  | PASSWORD RESET FLOW
  |--------------------------------------------------------------------------
  */
  async forgotPassword(email) {
    const response = await authAPI.forgotPasswordApi({
      email: email.trim().toLowerCase(),
    });

    return normalizeResponse(response);
  },

  async resetPassword(payload) {
    const response = await authAPI.resetPasswordApi({
      email: payload.email.trim().toLowerCase(),
      token: decodeURIComponent(payload.token),
      password: payload.password,
      password_confirmation: payload.password_confirmation,
    });

    return normalizeResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | OTP
  |--------------------------------------------------------------------------
  */
  async verifyOTP(payload) {
    const response = await authAPI.verifyOtpApi(payload);
    return normalizeResponse(response);
  },

  async resendOTP(payload) {
    const response = await authAPI.resendOtpApi(payload);
    return normalizeResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | AUTH CHECK (FIXED)
  |--------------------------------------------------------------------------
  */
  isAuthenticated() {
    const token = localStorage.getItem("access_token");
    return !!token;
  },

  /*
  |--------------------------------------------------------------------------
  | STORED USER
  |--------------------------------------------------------------------------
  */
  getStoredUser() {
    const user = getUser();
    return user || null;
  },
};

export default authService;