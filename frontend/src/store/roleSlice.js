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
| FETCH ROLES
|--------------------------------------------------------------------------
*/
export const fetchRoles = createAsyncThunk(
  "roles/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/roles");
      return res.data.data || res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE ROLE
|--------------------------------------------------------------------------
*/
export const createRole = createAsyncThunk(
  "roles/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/roles", data);
      return res.data.data || res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE ROLE
|--------------------------------------------------------------------------
*/
export const updateRole = createAsyncThunk(
  "roles/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/roles/${id}`, data);
      return res.data.data || res.data;
    } catch (err) {
      return rejectWithValue(getError(err));
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE ROLE
|--------------------------------------------------------------------------
*/
export const deleteRole = createAsyncThunk(
  "roles/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/roles/${id}`);
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
  roles: [],

  loading: false,
  actionLoading: false,

  error: null,
  success: null,
};

/*
|--------------------------------------------------------------------------
| ROLE SLICE
|--------------------------------------------------------------------------
*/
const roleSlice = createSlice({
  name: "roles",
  initialState,

  reducers: {
    clearRoleError: (state) => {
      state.error = null;
    },

    resetRoleState: (state) => {
      state.error = null;
      state.success = null;
      state.actionLoading = false;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | FETCH ROLES
      |--------------------------------------------------------------------------
      */
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload || [];
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | CREATE ROLE
      |--------------------------------------------------------------------------
      */
      .addCase(createRole.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = "Role created successfully";

        state.roles = [action.payload, ...(state.roles || [])];
      })
      .addCase(createRole.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | UPDATE ROLE
      |--------------------------------------------------------------------------
      */
      .addCase(updateRole.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = "Role updated successfully";

        const index = (state.roles || []).findIndex(
          (r) => r.id === action.payload.id
        );

        if (index !== -1) {
          state.roles[index] = action.payload;
        }
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | DELETE ROLE
      |--------------------------------------------------------------------------
      */
      .addCase(deleteRole.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.success = "Role deleted successfully";

        state.roles = (state.roles || []).filter(
          (r) => r.id !== action.payload
        );
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearRoleError, resetRoleState } =
  roleSlice.actions;

export default roleSlice.reducer;