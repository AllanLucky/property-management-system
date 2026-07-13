import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "../services/auth.service";
import { getUser } from "../utils/token";

/*
|--------------------------------------------------------------------------
| STORAGE HELPERS
|--------------------------------------------------------------------------
*/
const saveAuthData = (user, token) => {
  if (token) {
    localStorage.setItem("access_token", token);
  }

  if (user) {
    localStorage.setItem(
      "auth_user",
      JSON.stringify(user)
    );
  }
};

const clearAuthData = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("auth_user");
};

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/
const storedUser = getUser();
const storedToken = localStorage.getItem("access_token");

const initialState = {
  user: storedUser || null,
  roles: storedUser?.roles || [],
  permissions: storedUser?.permissions || [],
  token: storedToken || null,

  isAuthenticated: !!storedToken,

  loading: false,

  error: null,
  errorCode: null,
  errors: null,

  success: null,
};

/*
|--------------------------------------------------------------------------
| ERROR NORMALIZER
|--------------------------------------------------------------------------
*/
const normalizeError = (error) => {
  return (
    error?.response?.data ||
    error?.payload ||
    error || {
      message: "Something went wrong",
    }
  );
};

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.login(payload);

      if (!response?.user || !response?.token) {
        return rejectWithValue({
          message: "Invalid login response",
        });
      }

      return response;
    } catch (error) {
      return rejectWithValue(
        normalizeError(error)
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.register(payload);
    } catch (error) {
      return rejectWithValue(
        normalizeError(error)
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return true;
    } catch (error) {
      return rejectWithValue(
        normalizeError(error)
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH AUTH USER
|--------------------------------------------------------------------------
*/
export const fetchAuthUser = createAsyncThunk(
  "auth/fetchAuthUser",
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getProfile();

      if (!user) {
        return rejectWithValue({
          message: "Invalid user response",
        });
      }

      return user;
    } catch (error) {
      return rejectWithValue(
        normalizeError(error)
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
*/
export const forgotPasswordUser = createAsyncThunk(
  "auth/forgotPasswordUser",
  async (email, { rejectWithValue }) => {
    try {
      return await authService.forgotPassword(
        email.trim().toLowerCase()
      );
    } catch (error) {
      return rejectWithValue(
        normalizeError(error)
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
*/
export const resetPasswordUser = createAsyncThunk(
  "auth/resetPasswordUser",
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.resetPassword({
        email: payload.email.trim().toLowerCase(),
        token: decodeURIComponent(payload.token),
        password: payload.password,
        password_confirmation:
          payload.password_confirmation,
      });
    } catch (error) {
      return rejectWithValue(
        normalizeError(error)
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| AUTH SLICE
|--------------------------------------------------------------------------
*/
const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    /*
    |--------------------------------------------------------------------------
    | CLEAR ERRORS
    |--------------------------------------------------------------------------
    */
    clearError: (state) => {
      state.error = null;
      state.errorCode = null;
      state.errors = null;
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR SUCCESS
    |--------------------------------------------------------------------------
    */
    clearSuccess: (state) => {
      state.success = null;
    },

    /*
    |--------------------------------------------------------------------------
    | UPDATE AUTH USER
    |--------------------------------------------------------------------------
    */
    updateAuthUser: (state, action) => {
      if (!state.user) return;

      state.user = {
        ...state.user,
        ...action.payload,
      };

      state.roles = state.user.roles || [];
      state.permissions =
        state.user.permissions || [];

      saveAuthData(
        state.user,
        state.token
      );
    },

    /*
    |--------------------------------------------------------------------------
    | FORCE LOGOUT
    |--------------------------------------------------------------------------
    */
    forceLogout: (state) => {
      state.user = null;
      state.roles = [];
      state.permissions = [];
      state.token = null;
      state.isAuthenticated = false;

      state.loading = false;

      state.error = null;
      state.errors = null;
      state.success = null;

      clearAuthData();
    },

    /*
    |--------------------------------------------------------------------------
    | HYDRATE AUTH
    |--------------------------------------------------------------------------
    */
    hydrateAuth: (state) => {
      const user = getUser();
      const token =
        localStorage.getItem("access_token");

      if (user && token) {
        state.user = user;
        state.roles = user.roles || [];
        state.permissions =
          user.permissions || [];

        state.token = token;
        state.isAuthenticated = true;
      }
    },
  },

  extraReducers: (builder) => {
    /*
    |--------------------------------------------------------------------------
    | GENERIC PENDING
    |--------------------------------------------------------------------------
    */
    const setPending = (state) => {
      state.loading = true;
      state.error = null;
      state.errors = null;
      state.success = null;
    };

    const setRejected = (
      state,
      action,
      fallback
    ) => {
      state.loading = false;

      const payload =
        action.payload || {};

      state.error =
        payload.message || fallback;

      state.errorCode =
        payload.code || null;

      state.errors =
        payload.errors || null;
    };

    builder

      /*
      |--------------------------------------------------------------------------
      | LOGIN
      |--------------------------------------------------------------------------
      */
      .addCase(loginUser.pending, setPending)

      .addCase(
        loginUser.fulfilled,
        (state, action) => {
          state.loading = false;

          const { user, token } =
            action.payload;

          state.user = user;
          state.roles = user.roles || [];
          state.permissions =
            user.permissions || [];

          state.token = token;
          state.isAuthenticated = true;

          saveAuthData(user, token);
        }
      )

      .addCase(
        loginUser.rejected,
        (state, action) =>
          setRejected(
            state,
            action,
            "Login failed"
          )
      )

      /*
      |--------------------------------------------------------------------------
      | REGISTER
      |--------------------------------------------------------------------------
      */
      .addCase(
        registerUser.pending,
        setPending
      )

      .addCase(
        registerUser.fulfilled,
        (state, action) => {
          state.loading = false;

          state.success =
            action.payload?.message ||
            "Registration successful";
        }
      )

      .addCase(
        registerUser.rejected,
        (state, action) =>
          setRejected(
            state,
            action,
            "Registration failed"
          )
      )

      /*
      |--------------------------------------------------------------------------
      | LOGOUT
      |--------------------------------------------------------------------------
      */
      .addCase(
        logoutUser.pending,
        setPending
      )

      .addCase(
        logoutUser.fulfilled,
        (state) => {
          state.loading = false;

          state.user = null;
          state.roles = [];
          state.permissions = [];

          state.token = null;
          state.isAuthenticated = false;

          clearAuthData();
        }
      )

      .addCase(
        logoutUser.rejected,
        (state, action) =>
          setRejected(
            state,
            action,
            "Logout failed"
          )
      )

      /*
      |--------------------------------------------------------------------------
      | FETCH USER
      |--------------------------------------------------------------------------
      */
      .addCase(
        fetchAuthUser.pending,
        setPending
      )

      .addCase(
        fetchAuthUser.fulfilled,
        (state, action) => {
          state.loading = false;

          const user = action.payload;

          state.user = user;
          state.roles =
            user?.roles || [];
          state.permissions =
            user?.permissions || [];

          state.isAuthenticated = true;

          saveAuthData(
            user,
            state.token
          );
        }
      )

      .addCase(
        fetchAuthUser.rejected,
        (state) => {
          state.loading = false;

          state.user = null;
          state.roles = [];
          state.permissions = [];

          state.token = null;
          state.isAuthenticated = false;

          clearAuthData();
        }
      )

      /*
      |--------------------------------------------------------------------------
      | FORGOT PASSWORD
      |--------------------------------------------------------------------------
      */
      .addCase(
        forgotPasswordUser.pending,
        setPending
      )

      .addCase(
        forgotPasswordUser.fulfilled,
        (state, action) => {
          state.loading = false;

          state.success =
            action.payload?.message ||
            "Password reset link sent";
        }
      )

      .addCase(
        forgotPasswordUser.rejected,
        (state, action) =>
          setRejected(
            state,
            action,
            "Failed to send reset link"
          )
      )

      /*
      |--------------------------------------------------------------------------
      | RESET PASSWORD
      |--------------------------------------------------------------------------
      */
      .addCase(
        resetPasswordUser.pending,
        setPending
      )

      .addCase(
        resetPasswordUser.fulfilled,
        (state, action) => {
          state.loading = false;

          state.success =
            action.payload?.message ||
            "Password reset successful";
        }
      )

      .addCase(
        resetPasswordUser.rejected,
        (state, action) =>
          setRejected(
            state,
            action,
            "Password reset failed"
          )
      );
  },
});

/*
|--------------------------------------------------------------------------
| EXPORT ACTIONS
|--------------------------------------------------------------------------
*/
export const {
  clearError,
  clearSuccess,
  updateAuthUser,
  forceLogout,
  hydrateAuth,
} = authSlice.actions;

/*
|--------------------------------------------------------------------------
| EXPORT REDUCER
|--------------------------------------------------------------------------
*/
export default authSlice.reducer;