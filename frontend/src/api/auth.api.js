import api from "./axios";
import {
  setToken,
  setRefreshToken,
  setUser,
  clearAuth,
} from "../utils/token";

/*
|--------------------------------------------------------------------------
| 🔐 LOGIN
|--------------------------------------------------------------------------
*/
export const loginApi = async (payload) => {
  const response = await api.post("/auth/login", payload);

  const data = response?.data?.data;

  if (!data || !data.access_token) {
    throw new Error("Invalid login response");
  }

  const { user, access_token, refresh_token } = data;

  // ✅ STORE AUTH DATA
  setToken(access_token);
  setRefreshToken(refresh_token);
  setUser(user);

  return {
    user,
    token: access_token,
  };
};

/*
|--------------------------------------------------------------------------
| 📝 REGISTER
|--------------------------------------------------------------------------
*/
export const registerApi = async (payload) => {
  const response = await api.post("/auth/register", payload);

  return response?.data;
};

/*
|--------------------------------------------------------------------------
| 🚪 LOGOUT
|--------------------------------------------------------------------------
*/
export const logoutApi = async () => {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.warn("Logout request failed:", error?.message);
  } finally {
    // ✅ ALWAYS CLEAR LOCAL AUTH
    clearAuth();

    // optional global event
    window.dispatchEvent(new Event("auth:logout"));
  }
};

/*
|--------------------------------------------------------------------------
| 👤 GET AUTH USER
|--------------------------------------------------------------------------
*/
export const getAuthUserApi = async () => {
  const response = await api.get("/auth/user");

  const user = response?.data?.user;

  if (!user) {
    throw new Error("Invalid user response");
  }

  return user;
};

/*
|--------------------------------------------------------------------------
| 🔄 REFRESH TOKEN (OPTIONAL)
|--------------------------------------------------------------------------
*/
export const refreshTokenApi = async () => {
  const response = await api.post("/auth/refresh-token");

  const data = response?.data?.data;

  if (!data || !data.access_token) {
    throw new Error("Invalid refresh response");
  }

  const { access_token, refresh_token } = data;

  setToken(access_token);

  if (refresh_token) {
    setRefreshToken(refresh_token);
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| 🔑 FORGOT PASSWORD
|--------------------------------------------------------------------------
*/
export const forgotPasswordApi = async (payload) => {
  const response = await api.post("/auth/forgot-password", payload);

  return response?.data;
};

/*
|--------------------------------------------------------------------------
| 🔁 RESET PASSWORD
|--------------------------------------------------------------------------
*/
export const resetPasswordApi = async (payload) => {
  const response = await api.post("/auth/reset-password", payload);

  return response?.data;
};

/*
|--------------------------------------------------------------------------
| 🔐 VERIFY OTP
|--------------------------------------------------------------------------
*/
export const verifyOtpApi = async (payload) => {
  const response = await api.post("/auth/verify-otp", payload);

  return response?.data;
};

/*
|--------------------------------------------------------------------------
| 🔁 RESEND OTP
|--------------------------------------------------------------------------
*/
export const resendOtpApi = async (payload) => {
  const response = await api.post("/auth/resend-otp", payload);

  return response?.data;
};