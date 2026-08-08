// src/store/unitSlice.js

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
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Extract useful error message from Laravel/API response.
 */
const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

/**
 * Extract validation errors returned by Laravel.
 */
const getValidationErrors = (error) => {
  return (
    error?.response?.data?.errors ||
    error?.errors ||
    {}
  );
};

/**
 * Normalize API payload.
 *
 * Supports:
 *
 * {
 *   status: true,
 *   message: "...",
 *   data: [...]
 * }
 *
 * or:
 *
 * {
 *   data: [...]
 * }
 *
 * or:
 *
 * [...]
 */
const getPayloadData = (payload, fallback = null) => {
  if (payload?.data !== undefined) {
    return payload.data;
  }

  if (payload !== undefined && payload !== null) {
    return payload;
  }

  return fallback;
};

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/

const initialState = {
  /*
  |----------------------------------------------------------------------
  | Collection
  |----------------------------------------------------------------------
  */
  units: [],

  /*
  |----------------------------------------------------------------------
  | Current unit
  |----------------------------------------------------------------------
  */
  unit: null,

  /*
  |----------------------------------------------------------------------
  | Pagination
  |----------------------------------------------------------------------
  */
  pagination: {
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,
    from: null,
    to: null,
  },

  /*
  |----------------------------------------------------------------------
  | Loading states
  |----------------------------------------------------------------------
  */
  loading: false,
  fetching: false,
  creating: false,
  updating: false,
  deleting: false,

  /*
  |----------------------------------------------------------------------
  | Error state
  |----------------------------------------------------------------------
  */
  error: null,
  validationErrors: {},

  /*
  |----------------------------------------------------------------------
  | Success state
  |----------------------------------------------------------------------
  */
  successMessage: null,
};

/*
|--------------------------------------------------------------------------
| GET ALL UNITS
|--------------------------------------------------------------------------
*/

export const getUnits = createAsyncThunk(
  "unit/getUnits",
  async (params = {}, thunkAPI) => {
    try {
      const response = await fetchUnits(params);

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to fetch units."
        ),
        errors: getValidationErrors(error),
      });
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
      const response = await fetchUnit(id);

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to fetch unit."
        ),
        errors: getValidationErrors(error),
      });
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
      const response = await createUnit(data);

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to create unit."
        ),
        errors: getValidationErrors(error),
      });
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
      const response = await updateUnit(id, data);

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to update unit."
        ),
        errors: getValidationErrors(error),
      });
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
      const response = await deleteUnit(id);

      return {
        id,
        response,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to delete unit."
        ),
        errors: getValidationErrors(error),
      });
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
    /*
    |--------------------------------------------------------------------------
    | CLEAR MESSAGES
    |--------------------------------------------------------------------------
    */

    clearUnitMessages: (state) => {
      state.error = null;
      state.validationErrors = {};
      state.successMessage = null;
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR ERROR
    |--------------------------------------------------------------------------
    */

    clearUnitError: (state) => {
      state.error = null;
      state.validationErrors = {};
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR SUCCESS
    |--------------------------------------------------------------------------
    */

    clearUnitSuccess: (state) => {
      state.successMessage = null;
    },

    /*
    |--------------------------------------------------------------------------
    | CLEAR CURRENT UNIT
    |--------------------------------------------------------------------------
    */

    clearCurrentUnit: (state) => {
      state.unit = null;
    },

    /*
    |--------------------------------------------------------------------------
    | RESET STATE
    |--------------------------------------------------------------------------
    */

    resetUnitState: () => {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | GET ALL UNITS
      |--------------------------------------------------------------------------
      */

      .addCase(getUnits.pending, (state) => {
        state.loading = true;
        state.fetching = true;

        state.error = null;
        state.validationErrors = {};
      })

      .addCase(getUnits.fulfilled, (state, action) => {
        state.loading = false;
        state.fetching = false;

        const payload = action.payload;

        const data = getPayloadData(payload, []);

        /*
        | Laravel pagination:
        |
        | data: {
        |   current_page,
        |   data: [],
        |   last_page,
        |   per_page,
        |   total,
        |   from,
        |   to
        | }
        */

        if (
          data &&
          !Array.isArray(data) &&
          Array.isArray(data.data)
        ) {
          state.units = data.data;

          state.pagination = {
            currentPage: data.current_page ?? 1,
            lastPage: data.last_page ?? 1,
            perPage: data.per_page ?? 15,
            total: data.total ?? data.data.length,
            from: data.from ?? null,
            to: data.to ?? null,
          };

          return;
        }

        /*
        | Non-paginated response:
        |
        | data: []
        */

        state.units = Array.isArray(data)
          ? data
          : [];

        state.pagination = {
          currentPage: 1,
          lastPage: 1,
          perPage: state.units.length || 15,
          total: state.units.length,
          from: state.units.length
            ? 1
            : null,
          to: state.units.length
            ? state.units.length
            : null,
        };
      })

      .addCase(getUnits.rejected, (state, action) => {
        state.loading = false;
        state.fetching = false;

        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to fetch units.";

        state.validationErrors =
          action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | GET SINGLE UNIT
      |--------------------------------------------------------------------------
      */

      .addCase(getUnit.pending, (state) => {
        state.loading = true;

        state.error = null;
        state.validationErrors = {};
      })

      .addCase(getUnit.fulfilled, (state, action) => {
        state.loading = false;

        const unit = getPayloadData(
          action.payload,
          null
        );

        state.unit = unit;
      })

      .addCase(getUnit.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to fetch unit.";

        state.validationErrors =
          action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | CREATE UNIT
      |--------------------------------------------------------------------------
      */

      .addCase(storeUnit.pending, (state) => {
        state.loading = true;
        state.creating = true;

        state.error = null;
        state.validationErrors = {};
        state.successMessage = null;
      })

      .addCase(storeUnit.fulfilled, (state, action) => {
        state.loading = false;
        state.creating = false;

        const unit = getPayloadData(
          action.payload,
          null
        );

        if (unit) {
          state.units.unshift(unit);

          /*
          | Update pagination total.
          */
          state.pagination.total += 1;
        }

        state.successMessage =
          action.payload?.message ||
          "Unit created successfully.";
      })

      .addCase(storeUnit.rejected, (state, action) => {
        state.loading = false;
        state.creating = false;

        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to create unit.";

        state.validationErrors =
          action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | UPDATE UNIT
      |--------------------------------------------------------------------------
      */

      .addCase(editUnit.pending, (state) => {
        state.loading = true;
        state.updating = true;

        state.error = null;
        state.validationErrors = {};
        state.successMessage = null;
      })

      .addCase(editUnit.fulfilled, (state, action) => {
        state.loading = false;
        state.updating = false;

        const updated = getPayloadData(
          action.payload,
          null
        );

        if (updated) {
          /*
          | Update collection.
          */
          state.units = state.units.map((unit) =>
            unit.id === updated.id
              ? updated
              : unit
          );

          /*
          | Update current unit.
          */
          if (
            state.unit &&
            state.unit.id === updated.id
          ) {
            state.unit = updated;
          }
        }

        state.successMessage =
          action.payload?.message ||
          "Unit updated successfully.";
      })

      .addCase(editUnit.rejected, (state, action) => {
        state.loading = false;
        state.updating = false;

        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to update unit.";

        state.validationErrors =
          action.payload?.errors || {};
      })

      /*
      |--------------------------------------------------------------------------
      | DELETE UNIT
      |--------------------------------------------------------------------------
      */

      .addCase(removeUnit.pending, (state) => {
        state.loading = true;
        state.deleting = true;

        state.error = null;
        state.validationErrors = {};
        state.successMessage = null;
      })

      .addCase(removeUnit.fulfilled, (state, action) => {
        state.loading = false;
        state.deleting = false;

        const deletedId = action.payload?.id;

        state.units = state.units.filter(
          (unit) => unit.id !== deletedId
        );

        /*
        | Clear current unit if it was deleted.
        */
        if (
          state.unit &&
          state.unit.id === deletedId
        ) {
          state.unit = null;
        }

        /*
        | Keep pagination total correct.
        */
        state.pagination.total = Math.max(
          0,
          state.pagination.total - 1
        );

        state.successMessage =
          action.payload?.response?.message ||
          "Unit deleted successfully.";
      })

      .addCase(removeUnit.rejected, (state, action) => {
        state.loading = false;
        state.deleting = false;

        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Failed to delete unit.";

        state.validationErrors =
          action.payload?.errors || {};
      });
  },
});

/*
|--------------------------------------------------------------------------
| ACTIONS
|--------------------------------------------------------------------------
*/

export const {
  clearUnitMessages,
  clearUnitError,
  clearUnitSuccess,
  clearCurrentUnit,
  resetUnitState,
} = unitSlice.actions;

/*
|--------------------------------------------------------------------------
| SELECTORS
|--------------------------------------------------------------------------
*/

export const selectUnits = (state) =>
  state.unit?.units || [];

export const selectUnit = (state) =>
  state.unit?.unit || null;

export const selectUnitLoading = (state) =>
  state.unit?.loading || false;

export const selectUnitFetching = (state) =>
  state.unit?.fetching || false;

export const selectUnitCreating = (state) =>
  state.unit?.creating || false;

export const selectUnitUpdating = (state) =>
  state.unit?.updating || false;

export const selectUnitDeleting = (state) =>
  state.unit?.deleting || false;

export const selectUnitError = (state) =>
  state.unit?.error || null;

export const selectUnitValidationErrors = (state) =>
  state.unit?.validationErrors || {};

export const selectUnitSuccessMessage = (state) =>
  state.unit?.successMessage || null;

export const selectUnitPagination = (state) =>
  state.unit?.pagination || {
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,
    from: null,
    to: null,
  };

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

export default unitSlice.reducer;