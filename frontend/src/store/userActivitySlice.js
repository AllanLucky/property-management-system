import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import UserActivityService from "../services/UserActivity.service";

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/
const initialState = {
    activities: [],
    activity: null,

    myActivities: [],

    loading: false,
    actionLoading: false,

    error: null,

    pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    },
};

/*
|--------------------------------------------------------------------------
| ASYNC THUNKS
|--------------------------------------------------------------------------
*/

/**
 * GET ALL ACTIVITIES (ADMIN)
 */
export const fetchActivities = createAsyncThunk(
    "userActivity/fetchActivities",
    async (filters, { rejectWithValue }) => {
        try {
            const res = await UserActivityService.fetchActivities(filters);
            return res;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

/**
 * GET SINGLE ACTIVITY
 */
export const fetchActivity = createAsyncThunk(
    "userActivity/fetchActivity",
    async (id, { rejectWithValue }) => {
        try {
            const res = await UserActivityService.fetchActivity(id);
            return res;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

/**
 * GET MY ACTIVITIES
 */
export const fetchMyActivities = createAsyncThunk(
    "userActivity/fetchMyActivities",
    async (params, { rejectWithValue }) => {
        try {
            const res = await UserActivityService.fetchMyActivities(params);
            return res;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

/**
 * CREATE ACTIVITY (ADMIN TOOL)
 */
export const createActivity = createAsyncThunk(
    "userActivity/createActivity",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await UserActivityService.createActivity(payload);
            return res;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

/**
 * DELETE ACTIVITY
 */
export const deleteActivity = createAsyncThunk(
    "userActivity/deleteActivity",
    async (id, { rejectWithValue }) => {
        try {
            const res = await UserActivityService.deleteActivity(id);
            return { id, res };
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/
const userActivitySlice = createSlice({
    name: "userActivity",
    initialState,
    reducers: {
        clearActivityState: (state) => {
            state.activity = null;
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder

            /*
            |----------------------------------------------------------
            | FETCH ALL ACTIVITIES
            |----------------------------------------------------------
            */
            .addCase(fetchActivities.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchActivities.fulfilled, (state, action) => {
                state.loading = false;
                state.activities = action.payload.data || [];

                state.pagination = action.payload.pagination || {
                    current_page: 1,
                    last_page: 1,
                    per_page: 15,
                    total: 0,
                };
            })
            .addCase(fetchActivities.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            /*
            |----------------------------------------------------------
            | FETCH SINGLE ACTIVITY
            |----------------------------------------------------------
            */
            .addCase(fetchActivity.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchActivity.fulfilled, (state, action) => {
                state.loading = false;
                state.activity = action.payload.data;
            })
            .addCase(fetchActivity.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            /*
            |----------------------------------------------------------
            | MY ACTIVITIES
            |----------------------------------------------------------
            */
            .addCase(fetchMyActivities.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMyActivities.fulfilled, (state, action) => {
                state.loading = false;
                state.myActivities = action.payload.data || [];
            })
            .addCase(fetchMyActivities.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            /*
            |----------------------------------------------------------
            | CREATE ACTIVITY
            |----------------------------------------------------------
            */
            .addCase(createActivity.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(createActivity.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.activities.unshift(action.payload.data);
            })
            .addCase(createActivity.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            })

            /*
            |----------------------------------------------------------
            | DELETE ACTIVITY
            |----------------------------------------------------------
            */
            .addCase(deleteActivity.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(deleteActivity.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.activities = state.activities.filter(
                    (item) => item.id !== action.payload.id
                );
            })
            .addCase(deleteActivity.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            });
    },
});

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/
export const { clearActivityState } = userActivitySlice.actions;

export default userActivitySlice.reducer;