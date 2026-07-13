import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/
const getError = (err) =>
  err?.response?.data?.message ||
  err?.message ||
  "Something went wrong";

/*
|--------------------------------------------------------------------------
| FETCH ALL PERMISSIONS
|--------------------------------------------------------------------------
*/
export const fetchPermissions = createAsyncThunk(
  "permissions/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/permissions");
      return res.data.data || res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE PERMISSION
|--------------------------------------------------------------------------
*/
export const createPermission = createAsyncThunk(
  "permissions/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/permissions", data);
      return res.data.data || res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE PERMISSION
|--------------------------------------------------------------------------
*/
export const updatePermission = createAsyncThunk(
  "permissions/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/permissions/${id}`, data);
      return res.data.data || res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE PERMISSION
|--------------------------------------------------------------------------
*/
export const deletePermission = createAsyncThunk(
  "permissions/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/permissions/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/
const initialState = {
  permissions: [],

  loading: false,
  actionLoading: false,

  error: null,
  success: null,
};

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/
const permissionSlice = createSlice({
  name: "permissions",
  initialState,

  reducers: {
    clearPermissionError: (state) => {
      state.error = null;
    },

    resetPermissionState: (state) => {
      state.error = null;
      state.success = null;
      state.actionLoading = false;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | FETCH PERMISSIONS
      |--------------------------------------------------------------------------
      */
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = action.payload || [];
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | CREATE PERMISSION
      |--------------------------------------------------------------------------
      */
      .addCase(createPermission.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createPermission.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = "Permission created successfully";

        state.permissions = [
          action.payload,
          ...(state.permissions || []),
        ];
      })
      .addCase(createPermission.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | UPDATE PERMISSION
      |--------------------------------------------------------------------------
      */
      .addCase(updatePermission.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updatePermission.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = "Permission updated successfully";

        const index = (state.permissions || []).findIndex(
          (p) => p.id === action.payload.id
        );

        if (index !== -1) {
          state.permissions[index] = action.payload;
        }
      })
      .addCase(updatePermission.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | DELETE PERMISSION
      |--------------------------------------------------------------------------
      */
      .addCase(deletePermission.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(deletePermission.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = "Permission deleted successfully";

        state.permissions = (state.permissions || []).filter(
          (p) => p.id !== action.payload
        );
      })
      .addCase(deletePermission.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearPermissionError,
  resetPermissionState,
} = permissionSlice.actions;

export default permissionSlice.reducer;