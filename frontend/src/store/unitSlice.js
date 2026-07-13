import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  fetchUnits,
  fetchUnit,
  createUnit,
  updateUnit,
  deleteUnit,
} from "../api/unit.api";

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/
const initialState = {
  units: [],
  unit: null,

  loading: false,
  error: null,
  successMessage: null,
};

/*
|--------------------------------------------------------------------------
| GET ALL UNITS
|--------------------------------------------------------------------------
*/
export const getUnits = createAsyncThunk(
  "unit/getUnits",
  async (_, thunkAPI) => {
    try {
      const res = await fetchUnits();
      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.message || "Failed to fetch units"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET SINGLE UNIT
|--------------------------------------------------------------------------
*/
export const getUnit = createAsyncThunk(
  "unit/getUnit",
  async (id, thunkAPI) => {
    try {
      const res = await fetchUnit(id);
      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.message || "Failed to fetch unit"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE UNIT
|--------------------------------------------------------------------------
*/
export const storeUnit = createAsyncThunk(
  "unit/storeUnit",
  async (data, thunkAPI) => {
    try {
      const res = await createUnit(data);
      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.message || "Failed to create unit"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE UNIT
|--------------------------------------------------------------------------
*/
export const editUnit = createAsyncThunk(
  "unit/editUnit",
  async ({ id, data }, thunkAPI) => {
    try {
      const res = await updateUnit(id, data);
      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.message || "Failed to update unit"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE UNIT
|--------------------------------------------------------------------------
*/
export const removeUnit = createAsyncThunk(
  "unit/removeUnit",
  async (id, thunkAPI) => {
    try {
      await deleteUnit(id);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.message || "Failed to delete unit"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/
const unitSlice = createSlice({
  name: "unit",
  initialState,

  reducers: {
    clearUnitMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },

    clearCurrentUnit: (state) => {
      state.unit = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | GET ALL
      |--------------------------------------------------------------------------
      */
      .addCase(getUnits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUnits.fulfilled, (state, action) => {
        state.loading = false;

        state.units =
          action.payload?.data ?? action.payload ?? [];
      })
      .addCase(getUnits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | GET SINGLE
      |--------------------------------------------------------------------------
      */
      .addCase(getUnit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUnit.fulfilled, (state, action) => {
        state.loading = false;

        state.unit =
          action.payload?.data ?? action.payload ?? null;
      })
      .addCase(getUnit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | CREATE
      |--------------------------------------------------------------------------
      */
      .addCase(storeUnit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(storeUnit.fulfilled, (state, action) => {
        state.loading = false;

        const unit =
          action.payload?.data ?? action.payload ?? null;

        if (unit) {
          state.units.unshift(unit);
        }

        state.successMessage =
          action.payload?.message || "Unit created successfully";
      })
      .addCase(storeUnit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | UPDATE
      |--------------------------------------------------------------------------
      */
      .addCase(editUnit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editUnit.fulfilled, (state, action) => {
        state.loading = false;

        const updated =
          action.payload?.data ?? action.payload ?? null;

        if (updated) {
          state.units = state.units.map((u) =>
            u.id === updated.id ? updated : u
          );

          state.unit = updated;
        }

        state.successMessage =
          action.payload?.message || "Unit updated successfully";
      })
      .addCase(editUnit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | DELETE
      |--------------------------------------------------------------------------
      */
      .addCase(removeUnit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeUnit.fulfilled, (state, action) => {
        state.loading = false;

        state.units = state.units.filter(
          (u) => u.id !== action.payload
        );

        state.successMessage = "Unit deleted successfully";
      })
      .addCase(removeUnit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearUnitMessages,
  clearCurrentUnit,
} = unitSlice.actions;

export default unitSlice.reducer;