import axios from "axios";
import { getToken, clearAuth } from "../utils/token";

/*
|--------------------------------------------------------------------------
| API INSTANCE
|--------------------------------------------------------------------------
*/
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api",
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
| Attach Sanctum token automatically
*/
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    // 🔐 Attach token only if valid
    if (token && typeof token === "string") {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
| Global API error handling (Auth + RBAC + Validation + Server)
*/
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    const message = data?.message || "Something went wrong";

    /*
    |--------------------------------------------------------------------------
    | 🔐 401 - UNAUTHORIZED (TOKEN EXPIRED / INVALID)
    |--------------------------------------------------------------------------
    */
    if (status === 401) {
      console.warn("🔐 Unauthorized - session expired or invalid token");

      clearAuth();

      // Notify app instead of hard redirect
      window.dispatchEvent(
        new CustomEvent("auth:logout", {
          detail: { reason: "unauthorized" },
        })
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 🚫 403 - FORBIDDEN (RBAC)
    |--------------------------------------------------------------------------
    */
    if (status === 403) {
      console.warn("🚫 Forbidden:", message);

      window.dispatchEvent(
        new CustomEvent("auth:forbidden", {
          detail: { message },
        })
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ⚠️ 422 - VALIDATION ERROR
    |--------------------------------------------------------------------------
    */
    if (status === 422) {
      console.warn("⚠️ Validation error:", data?.errors);
    }

    /*
    |--------------------------------------------------------------------------
    | 💥 500 - SERVER ERROR
    |--------------------------------------------------------------------------
    */
    if (status === 500) {
      console.error("💥 Server error - check Laravel logs");
    }

    /*
    |--------------------------------------------------------------------------
    | 🧠 GENERIC ERROR RETURN
    |--------------------------------------------------------------------------
    */
    return Promise.reject({
      status,
      message,
      errors: data?.errors || null,
    });
  }
);

export default api;