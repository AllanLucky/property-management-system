import axios from "axios";

import {
  getToken,
  clearAuth,
} from "../utils/token";

/*
|--------------------------------------------------------------------------
| API BASE URL
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

/*
|--------------------------------------------------------------------------
| API INSTANCE
|--------------------------------------------------------------------------
*/

const api = axios.create({
  baseURL: API_BASE_URL,

  timeout: 30000,

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
|
| Automatically attaches the Laravel Sanctum
| Bearer token to authenticated requests.
|
*/

api.interceptors.request.use(
  (config) => {
    const token = getToken();

    /*
    |--------------------------------------------------------------------------
    | Attach Access Token
    |--------------------------------------------------------------------------
    */

    if (
      token &&
      typeof token === "string"
    ) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    /*
    |--------------------------------------------------------------------------
    | Optional Request Metadata
    |--------------------------------------------------------------------------
    */

    config.headers =
      config.headers || {};

    config.headers.Accept =
      "application/json";

    return config;
  },

  (error) => {
    console.error(
      "API request interceptor error:",
      error
    );

    return Promise.reject(error);
  }
);

/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
|
| Centralized handling for:
|
| 401 - Unauthorized
| 403 - Forbidden
| 422 - Validation
| 429 - Too Many Requests
| 500 - Server Error
| 503 - Service Unavailable
|
*/

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const response =
      error?.response;

    const status =
      response?.status;

    const data =
      response?.data;

    const message =
      data?.message ||
      error?.message ||
      "Something went wrong.";

    /*
    |--------------------------------------------------------------------------
    | 401 - UNAUTHORIZED
    |--------------------------------------------------------------------------
    |
    | Token is expired, invalid, revoked,
    | or the authenticated session no longer exists.
    |
    */

    if (status === 401) {
      console.warn(
        "Unauthorized: session expired or invalid token."
      );

      clearAuth();

      /*
      |----------------------------------------------------------------------
      | Notify Authentication Layer
      |----------------------------------------------------------------------
      */

      if (
        typeof window !==
        "undefined"
      ) {
        window.dispatchEvent(
          new CustomEvent(
            "auth:logout",
            {
              detail: {
                reason:
                  "unauthorized",
                message,
              },
            }
          )
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | 403 - FORBIDDEN
    |--------------------------------------------------------------------------
    |
    | User is authenticated but does not
    | have permission to access the resource.
    |
    */

    if (status === 403) {
      console.warn(
        "Forbidden:",
        message
      );

      if (
        typeof window !==
        "undefined"
      ) {
        window.dispatchEvent(
          new CustomEvent(
            "auth:forbidden",
            {
              detail: {
                message,
                errors:
                  data?.errors ||
                  null,
              },
            }
          )
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | 422 - VALIDATION ERROR
    |--------------------------------------------------------------------------
    */

    if (status === 422) {
      console.warn(
        "Validation error:",
        data?.errors
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 429 - TOO MANY REQUESTS
    |--------------------------------------------------------------------------
    */

    if (status === 429) {
      console.warn(
        "Too many requests:",
        message
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 500 - SERVER ERROR
    |--------------------------------------------------------------------------
    */

    if (status === 500) {
      console.error(
        "Server error - check Laravel logs."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 503 - SERVICE UNAVAILABLE
    |--------------------------------------------------------------------------
    */

    if (status === 503) {
      console.error(
        "Service unavailable:",
        message
      );
    }

    /*
    |--------------------------------------------------------------------------
    | NETWORK ERROR
    |--------------------------------------------------------------------------
    */

    if (!response) {
      console.error(
        "Network/API connection error:",
        error?.message
      );
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZED ERROR
    |--------------------------------------------------------------------------
    |
    | Keep the useful Laravel response structure
    | available to useDashboard and other hooks.
    |
    */

    const normalizedError =
      new Error(message);

    normalizedError.status =
      status ?? null;

    normalizedError.code =
      data?.code ??
      status ??
      null;

    normalizedError.errors =
      data?.errors ??
      null;

    normalizedError.data =
      data ?? null;

    normalizedError.response =
      response ?? null;

    /*
    |--------------------------------------------------------------------------
    | Reject
    |--------------------------------------------------------------------------
    */

    return Promise.reject(
      normalizedError
    );
  }
);

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

export default api;