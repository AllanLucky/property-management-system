import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as userApi from "../api/user.api";

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/
const initialState = {
  users: [],
  user: null,

  loading: false,
  actionLoading: false,

  error: null,
  success: null,
};

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/
const getError = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong";

/*
|--------------------------------------------------------------------------
| NORMALIZE API RESPONSE (FIXED)
|--------------------------------------------------------------------------
*/
const normalize = (res) => {
  const data = res?.data?.data ?? res?.data ?? res;

  // Laravel pagination support
  if (data && typeof data === "object" && Array.isArray(data.data)) {
    return data.data;
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| SAFE USER MERGE (FIXED FOR IMAGES + PROFILE UPDATES)
|--------------------------------------------------------------------------
*/
const mergeUser = (existing, incoming) => {
  if (!existing) return incoming;

  return {
    ...existing,
    ...incoming,

    // 🔥 FIX: Always prioritize latest uploaded image
    image: incoming?.image ?? existing?.image ?? null,
    image_url: incoming?.image_url ?? existing?.image_url ?? null,

    // RBAC safety
    roles: Array.isArray(incoming?.roles)
      ? incoming.roles
      : existing?.roles || [],

    permissions: Array.isArray(incoming?.permissions)
      ? incoming.permissions
      : existing?.permissions || [],

    // Status fields
    account_status:
      incoming?.account_status ?? existing?.account_status ?? null,

    approval_status:
      incoming?.approval_status ?? existing?.approval_status ?? null,

    is_verified:
      incoming?.is_verified ?? existing?.is_verified ?? false,
  };
};

/*
|--------------------------------------------------------------------------
| THUNKS
|--------------------------------------------------------------------------
*/

// GET USERS
export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const res = await userApi.getUsers(params);
      return normalize(res);
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

// GET USER
export const fetchUser = createAsyncThunk(
  "users/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const res = await userApi.getUser(id);
      return normalize(res);
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

// CREATE USER
export const createUser = createAsyncThunk(
  "users/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await userApi.createUser(data);
      return normalize(res);
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

// UPDATE USER
export const updateUser = createAsyncThunk(
  "users/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await userApi.updateUser(id, data);
      return normalize(res);
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

// DELETE USER
export const deleteUser = createAsyncThunk(
  "users/delete",
  async (id, { rejectWithValue }) => {
    try {
      await userApi.deleteUser(id);
      return id;
    } catch (error) {
      return rejectWithValue(getError(error));
    }
  }
);

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/
const userSlice = createSlice({
  name: "users",
  initialState,

  reducers: {
    clearUserState: (state) => {
      state.user = null;
      state.error = null;
      state.success = null;
    },

    resetActionState: (state) => {
      state.actionLoading = false;
      state.error = null;
      state.success = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | FETCH USERS
      |--------------------------------------------------------------------------
      */
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = Array.isArray(action.payload)
          ? action.payload
          : [];
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | FETCH USER
      |--------------------------------------------------------------------------
      */
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = mergeUser(state.user, action.payload);
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | CREATE USER
      |--------------------------------------------------------------------------
      */
      .addCase(createUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = "User created successfully";

        if (action.payload) {
          state.users.unshift(action.payload);
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | UPDATE USER
      |--------------------------------------------------------------------------
      */
      .addCase(updateUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = "User updated successfully";

        const updated = action.payload;

        state.users = state.users.map((user) =>
          user.id === updated?.id
            ? mergeUser(user, updated)
            : user
        );

        if (state.user?.id === updated?.id) {
          state.user = mergeUser(state.user, updated);
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | DELETE USER
      |--------------------------------------------------------------------------
      */
      .addCase(deleteUser.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = "User deleted successfully";

        state.users = state.users.filter(
          (user) => user.id !== action.payload
        );

        if (state.user?.id === action.payload) {
          state.user = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUserState, resetActionState } = userSlice.actions;

export default userSlice.reducer;