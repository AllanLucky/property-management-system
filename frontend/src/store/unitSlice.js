// src/store/unitSlice.js

import {
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";

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
 *
 * Supports:
 *
 * Axios error:
 * {
 *   response: {
 *     data: {
 *       message: "..."
 *     }
 *   }
 * }
 *
 * Or service-level error:
 *
 * {
 *   status: false,
 *   message: "...",
 *   errors: {}
 * }
 */
const getErrorMessage = (
  error,
  fallback = "Something went wrong."
) => {
  return (
    error?.response?.data?.message ||
    error?.data?.message ||
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
    error?.data?.errors ||
    error?.errors ||
    {}
  );
};

/**
 * Extract the actual data from an API response.
 *
 * Supported responses:
 *
 * 1. Laravel:
 *
 * {
 *   status: true,
 *   code: 200,
 *   message: "...",
 *   data: [...]
 * }
 *
 * 2. Paginated:
 *
 * {
 *   status: true,
 *   data: {
 *     data: [],
 *     current_page: 1,
 *     last_page: 10,
 *     per_page: 15,
 *     total: 150,
 *     from: 1,
 *     to: 15
 *   }
 * }
 *
 * 3. Direct array:
 *
 * [...]
 */
const getPayloadData = (
  payload,
  fallback = null
) => {
  if (
    payload &&
    Object.prototype.hasOwnProperty.call(
      payload,
      "data"
    )
  ) {
    return payload.data;
  }

  if (
    payload !== undefined &&
    payload !== null
  ) {
    return payload;
  }

  return fallback;
};

/**
 * Get response message.
 */
const getResponseMessage = (
  payload,
  fallback = null
) => {
  return (
    payload?.message ||
    payload?.data?.message ||
    fallback
  );
};

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/

const initialState = {
  /*
  |--------------------------------------------------------------------------
  | Collection
  |--------------------------------------------------------------------------
  */

  units: [],

  /*
  |--------------------------------------------------------------------------
  | Current unit
  |--------------------------------------------------------------------------
  */

  unit: null,

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
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
  |--------------------------------------------------------------------------
  | Loading states
  |--------------------------------------------------------------------------
  */

  loading: false,
  fetching: false,
  creating: false,
  updating: false,
  deleting: false,

  /*
  |--------------------------------------------------------------------------
  | Error state
  |--------------------------------------------------------------------------
  */

  error: null,
  validationErrors: {},

  /*
  |--------------------------------------------------------------------------
  | Success state
  |--------------------------------------------------------------------------
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
      const response =
        await fetchUnits(params);

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to fetch units."
        ),

        errors:
          getValidationErrors(error),

        originalError: error,
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
      const response =
        await fetchUnit(id);

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to fetch unit."
        ),

        errors:
          getValidationErrors(error),

        originalError: error,
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
      const response =
        await createUnit(data);

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to create unit."
        ),

        errors:
          getValidationErrors(error),

        originalError: error,
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
      const response =
        await updateUnit(id, data);

      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to update unit."
        ),

        errors:
          getValidationErrors(error),

        originalError: error,
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
      const response =
        await deleteUnit(id);

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

        errors:
          getValidationErrors(error),

        originalError: error,
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
      | GET ALL UNITS - PENDING
      |--------------------------------------------------------------------------
      */

      .addCase(
        getUnits.pending,
        (state) => {
          state.loading = true;
          state.fetching = true;

          state.error = null;
          state.validationErrors = {};
        }
      )

      /*
      |--------------------------------------------------------------------------
      | GET ALL UNITS - SUCCESS
      |--------------------------------------------------------------------------
      */

      .addCase(
        getUnits.fulfilled,
        (state, action) => {
          state.loading = false;
          state.fetching = false;

          const payload =
            action.payload;

          /*
          |--------------------------------------------------------------------------
          | Expected current API response:
          |
          | {
          |   status: true,
          |   code: 200,
          |   message: "...",
          |   data: [...]
          | }
          |--------------------------------------------------------------------------
          */

          const data =
            getPayloadData(
              payload,
              []
            );

          /*
          |--------------------------------------------------------------------------
          | PAGINATED RESPONSE
          |--------------------------------------------------------------------------
          |
          | data = {
          |   data: [],
          |   current_page: 1,
          |   last_page: 10,
          |   per_page: 15,
          |   total: 150,
          |   from: 1,
          |   to: 15
          | }
          |
          |--------------------------------------------------------------------------
          */

          if (
            data &&
            !Array.isArray(data) &&
            Array.isArray(data.data)
          ) {
            state.units = data.data;

            state.pagination = {
              currentPage:
                data.current_page ??
                1,

              lastPage:
                data.last_page ??
                1,

              perPage:
                data.per_page ??
                data.data.length ??
                15,

              total:
                data.total ??
                data.data.length,

              from:
                data.from ??
                (
                  data.data.length
                    ? 1
                    : null
                ),

              to:
                data.to ??
                (
                  data.data.length
                    ? data.data.length
                    : null
                ),
            };

            return;
          }

          /*
          |--------------------------------------------------------------------------
          | NON-PAGINATED RESPONSE
          |--------------------------------------------------------------------------
          |
          | Your current API returns:
          |
          | data: [...]
          |
          |--------------------------------------------------------------------------
          */

          if (Array.isArray(data)) {
            state.units = data;

            state.pagination = {
              currentPage: 1,
              lastPage: 1,

              perPage:
                data.length || 15,

              total:
                data.length,

              from:
                data.length
                  ? 1
                  : null,

              to:
                data.length
                  ? data.length
                  : null,
            };

            return;
          }

          /*
          |--------------------------------------------------------------------------
          | SAFETY FALLBACK
          |--------------------------------------------------------------------------
          */

          state.units = [];

          state.pagination = {
            currentPage: 1,
            lastPage: 1,
            perPage: 15,
            total: 0,
            from: null,
            to: null,
          };
        }
      )

      /*
      |--------------------------------------------------------------------------
      | GET ALL UNITS - ERROR
      |--------------------------------------------------------------------------
      */

      .addCase(
        getUnits.rejected,
        (state, action) => {
          state.loading = false;
          state.fetching = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to fetch units.";

          state.validationErrors =
            action.payload?.errors ||
            {};
        }
      )

      /*
      |--------------------------------------------------------------------------
      | GET SINGLE UNIT - PENDING
      |--------------------------------------------------------------------------
      */

      .addCase(
        getUnit.pending,
        (state) => {
          state.loading = true;

          state.error = null;
          state.validationErrors = {};
        }
      )

      /*
      |--------------------------------------------------------------------------
      | GET SINGLE UNIT - SUCCESS
      |--------------------------------------------------------------------------
      */

      .addCase(
        getUnit.fulfilled,
        (state, action) => {
          state.loading = false;

          const payload =
            action.payload;

          const data =
            getPayloadData(
              payload,
              null
            );

          /*
          |--------------------------------------------------------------------------
          | Handles:
          |
          | data: {
          |   id: 1,
          |   ...
          | }
          |--------------------------------------------------------------------------
          */

          state.unit = data;
        }
      )

      /*
      |--------------------------------------------------------------------------
      | GET SINGLE UNIT - ERROR
      |--------------------------------------------------------------------------
      */

      .addCase(
        getUnit.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to fetch unit.";

          state.validationErrors =
            action.payload?.errors ||
            {};
        }
      )

      /*
      |--------------------------------------------------------------------------
      | CREATE UNIT - PENDING
      |--------------------------------------------------------------------------
      */

      .addCase(
        storeUnit.pending,
        (state) => {
          state.loading = true;
          state.creating = true;

          state.error = null;
          state.validationErrors = {};
          state.successMessage = null;
        }
      )

      /*
      |--------------------------------------------------------------------------
      | CREATE UNIT - SUCCESS
      |--------------------------------------------------------------------------
      */

      .addCase(
        storeUnit.fulfilled,
        (state, action) => {
          state.loading = false;
          state.creating = false;

          const payload =
            action.payload;

          const unit =
            getPayloadData(
              payload,
              null
            );

          /*
          |--------------------------------------------------------------------------
          | Add created unit to collection.
          |--------------------------------------------------------------------------
          */

          if (
            unit &&
            typeof unit === "object" &&
            unit.id
          ) {
            state.units.unshift(unit);

            state.pagination.total += 1;

            /*
            |--------------------------------------------------------------------------
            | Keep current page range correct.
            |--------------------------------------------------------------------------
            */

            if (
              state.pagination.from === null
            ) {
              state.pagination.from = 1;
            }

            if (
              state.pagination.to !== null
            ) {
              state.pagination.to += 1;
            }
          }

          state.successMessage =
            getResponseMessage(
              payload,
              "Unit created successfully."
            );
        }
      )

      /*
      |--------------------------------------------------------------------------
      | CREATE UNIT - ERROR
      |--------------------------------------------------------------------------
      */

      .addCase(
        storeUnit.rejected,
        (state, action) => {
          state.loading = false;
          state.creating = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to create unit.";

          state.validationErrors =
            action.payload?.errors ||
            {};
        }
      )

      /*
      |--------------------------------------------------------------------------
      | UPDATE UNIT - PENDING
      |--------------------------------------------------------------------------
      */

      .addCase(
        editUnit.pending,
        (state) => {
          state.loading = true;
          state.updating = true;

          state.error = null;
          state.validationErrors = {};
          state.successMessage = null;
        }
      )

      /*
      |--------------------------------------------------------------------------
      | UPDATE UNIT - SUCCESS
      |--------------------------------------------------------------------------
      */

      .addCase(
        editUnit.fulfilled,
        (state, action) => {
          state.loading = false;
          state.updating = false;

          const payload =
            action.payload;

          const updated =
            getPayloadData(
              payload,
              null
            );

          if (
            updated &&
            typeof updated === "object" &&
            updated.id
          ) {
            /*
            |--------------------------------------------------------------------------
            | Update collection.
            |--------------------------------------------------------------------------
            */

            state.units =
              state.units.map(
                (item) =>
                  item.id === updated.id
                    ? {
                      ...item,
                      ...updated,
                    }
                    : item
              );

            /*
            |--------------------------------------------------------------------------
            | Update current unit.
            |--------------------------------------------------------------------------
            */

            if (
              state.unit &&
              state.unit.id ===
              updated.id
            ) {
              state.unit = {
                ...state.unit,
                ...updated,
              };
            }
          }

          state.successMessage =
            getResponseMessage(
              payload,
              "Unit updated successfully."
            );
        }
      )

      /*
      |--------------------------------------------------------------------------
      | UPDATE UNIT - ERROR
      |--------------------------------------------------------------------------
      */

      .addCase(
        editUnit.rejected,
        (state, action) => {
          state.loading = false;
          state.updating = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to update unit.";

          state.validationErrors =
            action.payload?.errors ||
            {};
        }
      )

      /*
      |--------------------------------------------------------------------------
      | DELETE UNIT - PENDING
      |--------------------------------------------------------------------------
      */

      .addCase(
        removeUnit.pending,
        (state) => {
          state.loading = true;
          state.deleting = true;

          state.error = null;
          state.validationErrors = {};
          state.successMessage = null;
        }
      )

      /*
      |--------------------------------------------------------------------------
      | DELETE UNIT - SUCCESS
      |--------------------------------------------------------------------------
      */

      .addCase(
        removeUnit.fulfilled,
        (state, action) => {
          state.loading = false;
          state.deleting = false;

          const deletedId =
            action.payload?.id;

          /*
          |--------------------------------------------------------------------------
          | Remove unit from collection.
          |--------------------------------------------------------------------------
          */

          state.units =
            state.units.filter(
              (item) =>
                item.id !== deletedId
            );

          /*
          |--------------------------------------------------------------------------
          | Clear current unit.
          |--------------------------------------------------------------------------
          */

          if (
            state.unit &&
            state.unit.id === deletedId
          ) {
            state.unit = null;
          }

          /*
          |--------------------------------------------------------------------------
          | Update pagination.
          |--------------------------------------------------------------------------
          */

          state.pagination.total =
            Math.max(
              0,
              state.pagination.total - 1
            );

          /*
          |--------------------------------------------------------------------------
          | Update displayed range.
          |--------------------------------------------------------------------------
          */

          if (
            state.units.length === 0
          ) {
            state.pagination.from =
              null;

            state.pagination.to =
              null;
          } else {
            state.pagination.from =
              state.pagination.from ?? 1;

            state.pagination.to =
              Math.min(
                state.pagination.total,
                state.pagination.from +
                state.units.length -
                1
              );
          }

          state.successMessage =
            getResponseMessage(
              action.payload?.response,
              "Unit deleted successfully."
            );
        }
      )

      /*
      |--------------------------------------------------------------------------
      | DELETE UNIT - ERROR
      |--------------------------------------------------------------------------
      */

      .addCase(
        removeUnit.rejected,
        (state, action) => {
          state.loading = false;
          state.deleting = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to delete unit.";

          state.validationErrors =
            action.payload?.errors ||
            {};
        }
      );
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

export const selectUnitValidationErrors =
  (state) =>
    state.unit?.validationErrors || {};

export const selectUnitSuccessMessage =
  (state) =>
    state.unit?.successMessage || null;

export const selectUnitPagination =
  (state) =>
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
| ADDITIONAL SELECTORS
|--------------------------------------------------------------------------
|
| Useful for UnitList, UnitStats and dashboards.
|--------------------------------------------------------------------------
*/

export const selectUnitCount = (state) =>
  state.unit?.units?.length || 0;

export const selectTotalUnits = (state) =>
  state.unit?.pagination?.total || 0;

export const selectOccupiedUnits = (state) =>
  (state.unit?.units || []).filter(
    (unit) =>
      unit?.status?.value === "occupied" ||
      unit?.status === "occupied"
  ).length;

export const selectVacantUnits = (state) =>
  (state.unit?.units || []).filter(
    (unit) =>
      unit?.status?.value === "vacant" ||
      unit?.status === "vacant"
  ).length;

export const selectReservedUnits = (state) =>
  (state.unit?.units || []).filter(
    (unit) =>
      unit?.status?.value === "reserved" ||
      unit?.status === "reserved"
  ).length;

export const selectMaintenanceUnits =
  (state) =>
    (state.unit?.units || []).filter(
      (unit) =>
        unit?.status?.value ===
        "maintenance" ||
        unit?.status === "maintenance"
    ).length;

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

export default unitSlice.reducer;