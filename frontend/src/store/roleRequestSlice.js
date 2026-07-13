import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import roleRequestService from "../services/roleRequest.service";

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/
const initialState = {
  roleRequests: [],
  roleRequest: null,
  loading: false,
  error: null,
};

/*
|--------------------------------------------------------------------------
| FETCH ALL ROLE REQUESTS
|--------------------------------------------------------------------------
*/
export const fetchRoleRequests = createAsyncThunk(
  "roleRequests/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await roleRequestService.getAll();
      return res.data ?? res; // supports ApiResponse wrapper
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to fetch role requests"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH SINGLE ROLE REQUEST
|--------------------------------------------------------------------------
*/
export const fetchRoleRequest = createAsyncThunk(
  "roleRequests/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const res = await roleRequestService.getById(id);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to fetch role request"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE ROLE REQUEST
|--------------------------------------------------------------------------
*/
export const createRoleRequest = createAsyncThunk(
  "roleRequests/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await roleRequestService.create(data);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to create role request"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| APPROVE ROLE REQUEST
|--------------------------------------------------------------------------
*/
export const approveRoleRequest = createAsyncThunk(
  "roleRequests/approve",
  async (id, { rejectWithValue }) => {
    try {
      const res = await roleRequestService.approve(id);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to approve role request"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| REJECT ROLE REQUEST
|--------------------------------------------------------------------------
*/
export const rejectRoleRequest = createAsyncThunk(
  "roleRequests/reject",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await roleRequestService.reject(id, reason);
      return res.data ?? res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to reject role request"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE ROLE REQUEST
|--------------------------------------------------------------------------
*/
export const deleteRoleRequest = createAsyncThunk(
  "roleRequests/delete",
  async (id, { rejectWithValue }) => {
    try {
      await roleRequestService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to delete role request"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/
const roleRequestSlice = createSlice({
  name: "roleRequests",
  initialState,

  reducers: {
    clearRoleRequestError: (state) => {
      state.error = null;
    },

    clearRoleRequest: (state) => {
      state.roleRequest = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
      |------------------------------------------
      | FETCH ALL
      |------------------------------------------
      */
      .addCase(fetchRoleRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoleRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.roleRequests = action.payload;
      })
      .addCase(fetchRoleRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |------------------------------------------
      | FETCH ONE
      |------------------------------------------
      */
      .addCase(fetchRoleRequest.fulfilled, (state, action) => {
        state.roleRequest = action.payload;
      })

      /*
      |------------------------------------------
      | CREATE
      |------------------------------------------
      */
      .addCase(createRoleRequest.fulfilled, (state, action) => {
        state.roleRequests.unshift(action.payload);
      })

      /*
      |------------------------------------------
      | APPROVE / REJECT (update list)
      |------------------------------------------
      */
      .addCase(approveRoleRequest.fulfilled, (state, action) => {
        const updated = action.payload;

        state.roleRequests = state.roleRequests.map((req) =>
          req.id === updated.id ? updated : req
        );
      })
      .addCase(rejectRoleRequest.fulfilled, (state, action) => {
        const updated = action.payload;

        state.roleRequests = state.roleRequests.map((req) =>
          req.id === updated.id ? updated : req
        );
      })

      /*
      |------------------------------------------
      | DELETE
      |------------------------------------------
      */
      .addCase(deleteRoleRequest.fulfilled, (state, action) => {
        state.roleRequests = state.roleRequests.filter(
          (req) => req.id !== action.payload
        );
      });
  },
});

export const {
  clearRoleRequestError,
  clearRoleRequest,
} = roleRequestSlice.actions;

export default roleRequestSlice.reducer;