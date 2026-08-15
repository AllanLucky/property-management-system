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
  return (
    response?.data?.data ??
    response?.data ??
    response ??
    null
  );
};

/*
|--------------------------------------------------------------------------
| SAFE ARRAY FALLBACK
|--------------------------------------------------------------------------
*/

const safeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

/*
|--------------------------------------------------------------------------
| SAFE STRING
|--------------------------------------------------------------------------
*/

const safeString = (value, fallback = "") => {
  return typeof value === "string"
    ? value.trim()
    : fallback;
};

/*
|--------------------------------------------------------------------------
| NORMALIZE USER
|--------------------------------------------------------------------------
|
| Keeps the authenticated user consistent throughout the application.
|
*/

const normalizeUser = (user = {}) => {
  const firstName = safeString(
    user.first_name
  );

  const lastName = safeString(
    user.last_name
  );

  const fullName =
    safeString(user.full_name) ||
    safeString(user.name) ||
    [firstName, lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

  return {
    id: user.id ?? null,

    name:
      fullName ||
      safeString(user.email) ||
      "User",

    full_name:
      fullName || null,

    first_name:
      firstName || null,

    last_name:
      lastName || null,

    email:
      safeString(user.email) || null,

    phone:
      safeString(user.phone) || null,

    image:
      user.image || null,

    image_url:
      user.image_url || null,

    roles:
      safeArray(user.roles),

    permissions:
      safeArray(user.permissions),
  };
};

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
    const response =
      await authAPI.loginApi(credentials);

    const data =
      normalizeResponse(response);

    console.log(
      "LOGIN RESPONSE DEBUG:",
      data
    );

    const user =
      data?.user;

    const token =
      data?.access_token ||
      data?.token;

    const refreshToken =
      data?.refresh_token;

    /*
    |--------------------------------------------------------------------------
    | Validate Login Response
    |--------------------------------------------------------------------------
    */

    if (!user || !token) {
      throw new Error(
        "Invalid login response"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize User
    |--------------------------------------------------------------------------
    */

    const normalizedUser =
      normalizeUser(user);

    /*
    |--------------------------------------------------------------------------
    | Store Access Token
    |--------------------------------------------------------------------------
    */

    setToken(token);

    /*
    |--------------------------------------------------------------------------
    | Store User
    |--------------------------------------------------------------------------
    */

    setUser(normalizedUser);

    /*
    |--------------------------------------------------------------------------
    | Store Refresh Token
    |--------------------------------------------------------------------------
    */

    if (refreshToken) {
      setRefreshToken(
        refreshToken
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Return Login Data
    |--------------------------------------------------------------------------
    */

    return {
      user: normalizedUser,

      token,

      refresh_token:
        refreshToken || null,

      roles:
        normalizedUser.roles,

      permissions:
        normalizedUser.permissions,
    };
  },

  /*
  |--------------------------------------------------------------------------
  | REGISTER
  |--------------------------------------------------------------------------
  */

  async register(payload) {
    const response =
      await authAPI.registerApi(
        payload
      );

    return normalizeResponse(
      response
    );
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
      console.warn(
        "Logout API failed:",
        error?.message
      );
    } finally {
      /*
      |--------------------------------------------------------------------------
      | Always Clear Local Authentication
      |--------------------------------------------------------------------------
      */

      clearAuth();

      /*
      |--------------------------------------------------------------------------
      | Notify Application
      |--------------------------------------------------------------------------
      */

      if (
        typeof window !==
        "undefined"
      ) {
        window.dispatchEvent(
          new Event("auth:logout")
        );
      }
    }
  },

  /*
  |--------------------------------------------------------------------------
  | PROFILE
  |--------------------------------------------------------------------------
  */

  async getProfile() {
    const response =
      await authAPI.getAuthUserApi();

    const data =
      normalizeResponse(response);

    /*
    |--------------------------------------------------------------------------
    | If API Returns User
    |--------------------------------------------------------------------------
    */

    const user =
      data?.user ||
      data;

    if (
      user &&
      typeof user === "object"
    ) {
      const normalizedUser =
        normalizeUser(user);

      setUser(
        normalizedUser
      );

      return normalizedUser;
    }

    return data;
  },

  /*
  |--------------------------------------------------------------------------
  | REFRESH TOKEN
  |--------------------------------------------------------------------------
  */

  async refreshToken() {
    const response =
      await authAPI.refreshTokenApi();

    const data =
      normalizeResponse(response);

    const token =
      data?.access_token ||
      data?.token;

    const refreshToken =
      data?.refresh_token;

    /*
    |--------------------------------------------------------------------------
    | Validate Refresh Response
    |--------------------------------------------------------------------------
    */

    if (!token) {
      throw new Error(
        "Invalid refresh response"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Store New Access Token
    |--------------------------------------------------------------------------
    */

    setToken(token);

    /*
    |--------------------------------------------------------------------------
    | Store New Refresh Token
    |--------------------------------------------------------------------------
    */

    if (refreshToken) {
      setRefreshToken(
        refreshToken
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Update User If Returned
    |--------------------------------------------------------------------------
    */

    if (data?.user) {
      const normalizedUser =
        normalizeUser(
          data.user
        );

      setUser(
        normalizedUser
      );
    }

    return {
      token,

      refresh_token:
        refreshToken || null,

      user:
        data?.user
          ? normalizeUser(
            data.user
          )
          : null,
    };
  },

  /*
  |--------------------------------------------------------------------------
  | FORGOT PASSWORD
  |--------------------------------------------------------------------------
  */

  async forgotPassword(email) {
    const normalizedEmail =
      safeString(email)
        .toLowerCase();

    if (!normalizedEmail) {
      throw new Error(
        "Email is required."
      );
    }

    const response =
      await authAPI.forgotPasswordApi({
        email: normalizedEmail,
      });

    return normalizeResponse(
      response
    );
  },

  /*
  |--------------------------------------------------------------------------
  | RESET PASSWORD
  |--------------------------------------------------------------------------
  */

  async resetPassword(payload) {
    const email =
      safeString(
        payload?.email
      ).toLowerCase();

    const token =
      payload?.token
        ? decodeURIComponent(
          payload.token
        )
        : "";

    if (!email) {
      throw new Error(
        "Email is required."
      );
    }

    if (!token) {
      throw new Error(
        "Reset token is required."
      );
    }

    const response =
      await authAPI.resetPasswordApi({
        email,

        token,

        password:
          payload?.password,

        password_confirmation:
          payload?.password_confirmation,
      });

    return normalizeResponse(
      response
    );
  },

  /*
  |--------------------------------------------------------------------------
  | VERIFY OTP
  |--------------------------------------------------------------------------
  */

  async verifyOTP(payload) {
    const response =
      await authAPI.verifyOtpApi(
        payload
      );

    return normalizeResponse(
      response
    );
  },

  /*
  |--------------------------------------------------------------------------
  | RESEND OTP
  |--------------------------------------------------------------------------
  */

  async resendOTP(payload) {
    const response =
      await authAPI.resendOtpApi(
        payload
      );

    return normalizeResponse(
      response
    );
  },

  /*
  |--------------------------------------------------------------------------
  | AUTH CHECK
  |--------------------------------------------------------------------------
  */

  isAuthenticated() {
    if (
      typeof localStorage ===
      "undefined"
    ) {
      return false;
    }

    const token =
      localStorage.getItem(
        "access_token"
      );

    return Boolean(token);
  },

  /*
  |--------------------------------------------------------------------------
  | STORED USER
  |--------------------------------------------------------------------------
  */

  getStoredUser() {
    const user =
      getUser();

    if (!user) {
      return null;
    }

    return normalizeUser(
      user
    );
  },

  /*
  |--------------------------------------------------------------------------
  | CURRENT USER
  |--------------------------------------------------------------------------
  */

  getCurrentUser() {
    return this.getStoredUser();
  },

  /*
  |--------------------------------------------------------------------------
  | TOKEN
  |--------------------------------------------------------------------------
  */

  getToken() {
    if (
      typeof localStorage ===
      "undefined"
    ) {
      return null;
    }

    return localStorage.getItem(
      "access_token"
    );
  },
};

export default authService;