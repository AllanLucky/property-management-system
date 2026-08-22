// frontend/src/store/tenancySlice.js

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import tenancyService from "../services/tenancy.service"

/*
|--------------------------------------------------------------------------
| Initial State
|--------------------------------------------------------------------------
*/

const initialState = {
  tenancies: [],
  tenancy: null,

  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0,
  },

  filters: {
    search: "",
    status: "",
    property_id: "",
    apartment_id: "",
    unit_id: "",
    tenant_id: "",
    payment_frequency: "",
    sort_by: "",
    sort_direction: "",
    page: 1,
    per_page: 15,
  },

  statistics: null,

  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  restoring: false,
  forceDeleting: false,
  actionLoading: false,

  error: null,

  success: null,
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Extract a clean error message from Axios/Laravel errors.
 */
const getErrorMessage = (
  error,
  fallback = "An unexpected error occurred."
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.message ||
    error?.response?.data?.errors?.error ||
    error?.message ||
    fallback
  );
};

/**
 * Extract validation errors.
 */
const getValidationErrors = (error) => {
  return (
    error?.response?.data?.errors ||
    {}
  );
};

/**
 * Normalize API response.
 */
const getResponseData = (response) => {
  if (!response) {
    return null;
  }

  return response?.data ?? response;
};

/**
 * Extract pagination from Laravel API response.
 */
const getPagination = (response) => {
  const data = response?.data;

  /*
   * Supports:
   *
   * {
   *   data: [...],
   *   meta: {...}
   * }
   *
   * and:
   *
   * {
   *   data: {
   *      data: [...],
   *      meta: {...}
   *   }
   * }
   */

  const meta =
    response?.meta ||
    data?.meta ||
    null;

  if (!meta) {
    return null;
  }

  return {
    current_page:
      meta.current_page ??
      1,

    last_page:
      meta.last_page ??
      1,

    per_page:
      meta.per_page ??
      15,

    total:
      meta.total ??
      0,

    from:
      meta.from ??
      0,

    to:
      meta.to ??
      0,
  };
};

/*
|--------------------------------------------------------------------------
| FETCH TENANCIES
|--------------------------------------------------------------------------
*/

export const fetchTenancies = createAsyncThunk(
  "tenancy/fetchTenancies",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response =
        await tenancyService.getTenancies(params);

      return response;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to fetch tenancies."
        ),
        errors: getValidationErrors(error),
        status:
          error?.response?.status ||
          error?.status ||
          null,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| SEARCH TENANCIES
|--------------------------------------------------------------------------
*/

export const searchTenancies = createAsyncThunk(
  "tenancy/searchTenancies",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response =
        await tenancyService.searchTenancies(params);

      return response;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to search tenancies."
        ),
        errors: getValidationErrors(error),
        status:
          error?.response?.status ||
          error?.status ||
          null,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FETCH SINGLE TENANCY
|--------------------------------------------------------------------------
*/

export const fetchTenancy = createAsyncThunk(
  "tenancy/fetchTenancy",
  async (id, { rejectWithValue }) => {
    try {
      const response =
        await tenancyService.getTenancy(id);

      return response;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Tenancy not found."
        ),
        errors: getValidationErrors(error),
        status:
          error?.response?.status ||
          error?.status ||
          null,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE TENANCY
|--------------------------------------------------------------------------
*/

export const createTenancy = createAsyncThunk(
  "tenancy/createTenancy",
  async (data, { rejectWithValue }) => {
    try {
      const response =
        await tenancyService.createTenancy(data);

      return response;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to create tenancy."
        ),
        errors: getValidationErrors(error),
        status:
          error?.response?.status ||
          error?.status ||
          null,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE TENANCY
|--------------------------------------------------------------------------
*/

export const updateTenancy = createAsyncThunk(
  "tenancy/updateTenancy",
  async (
    { id, data },
    { rejectWithValue }
  ) => {
    try {
      const response =
        await tenancyService.updateTenancy(
          id,
          data
        );

      return response;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to update tenancy."
        ),
        errors: getValidationErrors(error),
        status:
          error?.response?.status ||
          error?.status ||
          null,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| PATCH TENANCY
|--------------------------------------------------------------------------
*/

export const patchTenancy = createAsyncThunk(
  "tenancy/patchTenancy",
  async (
    { id, data },
    { rejectWithValue }
  ) => {
    try {
      const response =
        await tenancyService.patchTenancy(
          id,
          data
        );

      return response;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to update tenancy."
        ),
        errors: getValidationErrors(error),
        status:
          error?.response?.status ||
          error?.status ||
          null,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE TENANCY
|--------------------------------------------------------------------------
|
| Soft delete.
|
| If the tenancy does not exist:
|
| HTTP 404
| "Tenancy not found."
|
*/

export const deleteTenancy = createAsyncThunk(
  "tenancy/deleteTenancy",
  async (id, { rejectWithValue }) => {
    try {
      const response =
        await tenancyService.deleteTenancy(id);

      return {
        id,
        response,
      };
    } catch (error) {
      return rejectWithValue({
        id,

        message:
          tenancyService.getErrorMessage(error) ||
          `Tenancy ${id} was not found.`,

        errors:
          getValidationErrors(error),

        status:
          error?.status ||
          error?.response?.status ||
          404,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| RESTORE TENANCY
|--------------------------------------------------------------------------
*/

export const restoreTenancy = createAsyncThunk(
  "tenancy/restoreTenancy",
  async (id, { rejectWithValue }) => {
    try {
      const response =
        await tenancyService.restoreTenancy(id);

      return response;
    } catch (error) {
      return rejectWithValue({
        id,

        message: getErrorMessage(
          error,
          "Tenancy not found."
        ),

        errors:
          getValidationErrors(error),

        status:
          error?.status ||
          error?.response?.status ||
          null,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| FORCE DELETE
|--------------------------------------------------------------------------
*/

export const forceDeleteTenancy = createAsyncThunk(
  "tenancy/forceDeleteTenancy",
  async (id, { rejectWithValue }) => {
    try {
      const response =
        await tenancyService.forceDeleteTenancy(id);

      return {
        id,
        response,
      };
    } catch (error) {
      return rejectWithValue({
        id,

        message: getErrorMessage(
          error,
          "Tenancy not found."
        ),

        errors:
          getValidationErrors(error),

        status:
          error?.status ||
          error?.response?.status ||
          null,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ACTIVATE
|--------------------------------------------------------------------------
*/

export const activateTenancy = createAsyncThunk(
  "tenancy/activateTenancy",
  async (id, { rejectWithValue }) => {
    try {
      const response =
        await tenancyService.activateTenancy(id);

      return response;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to activate tenancy."
        ),
        errors: getValidationErrors(error),
        status:
          error?.response?.status ||
          error?.status ||
          null,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DEACTIVATE
|--------------------------------------------------------------------------
*/

export const deactivateTenancy = createAsyncThunk(
  "tenancy/deactivateTenancy",
  async (id, { rejectWithValue }) => {
    try {
      const response =
        await tenancyService.deactivateTenancy(id);

      return response;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to deactivate tenancy."
        ),
        errors: getValidationErrors(error),
        status:
          error?.response?.status ||
          error?.status ||
          null,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| RENEW
|--------------------------------------------------------------------------
*/

export const renewTenancy = createAsyncThunk(
  "tenancy/renewTenancy",
  async (
    { id, data },
    { rejectWithValue }
  ) => {
    try {
      const response =
        await tenancyService.renewTenancy(
          id,
          data
        );

      return response;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to renew tenancy."
        ),
        errors: getValidationErrors(error),
        status:
          error?.response?.status ||
          error?.status ||
          null,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| TERMINATE
|--------------------------------------------------------------------------
*/

export const terminateTenancy = createAsyncThunk(
  "tenancy/terminateTenancy",
  async (
    { id, data = {} },
    { rejectWithValue }
  ) => {
    try {
      const response =
        await tenancyService.terminateTenancy(
          id,
          data
        );

      return response;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to terminate tenancy."
        ),
        errors: getValidationErrors(error),
        status:
          error?.response?.status ||
          error?.status ||
          null,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CANCEL
|--------------------------------------------------------------------------
*/

export const cancelTenancy = createAsyncThunk(
  "tenancy/cancelTenancy",
  async (
    { id, data = {} },
    { rejectWithValue }
  ) => {
    try {
      const response =
        await tenancyService.cancelTenancy(
          id,
          data
        );

      return response;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to cancel tenancy."
        ),
        errors: getValidationErrors(error),
        status:
          error?.response?.status ||
          error?.status ||
          null,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ASSIGN UNIT
|--------------------------------------------------------------------------
*/

export const assignUnit = createAsyncThunk(
  "tenancy/assignUnit",
  async (data, { rejectWithValue }) => {
    try {
      const response =
        await tenancyService.assignUnit(data);

      return response;
    } catch (error) {
      return rejectWithValue({
        message: getErrorMessage(
          error,
          "Failed to assign unit."
        ),
        errors: getValidationErrors(error),
        status:
          error?.response?.status ||
          error?.status ||
          null,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| STATISTICS
|--------------------------------------------------------------------------
*/

export const fetchTenancyStatistics =
  createAsyncThunk(
    "tenancy/fetchTenancyStatistics",
    async (_, { rejectWithValue }) => {
      try {
        const response =
          await tenancyService.getStatistics();

        return response;
      } catch (error) {
        return rejectWithValue({
          message: getErrorMessage(
            error,
            "Failed to fetch tenancy statistics."
          ),
          errors: getValidationErrors(error),
          status:
            error?.response?.status ||
            error?.status ||
            null,
        });
      }
    }
  );

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/

const tenancySlice = createSlice({
  name: "tenancy",

  initialState,

  reducers: {
    /*
    |--------------------------------------------------------------------------
    | Set Filters
    |--------------------------------------------------------------------------
    */

    setTenancyFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...(action.payload || {}),
      };

      /*
       * Reset page when filters change unless
       * the caller explicitly provides a page.
       */
      if (
        action.payload &&
        action.payload.page === undefined
      ) {
        state.filters.page = 1;
      }
    },

    /*
    |--------------------------------------------------------------------------
    | Clear Filters
    |--------------------------------------------------------------------------
    */

    clearTenancyFilters: (state) => {
      state.filters = {
        search: "",
        status: "",
        property_id: "",
        apartment_id: "",
        unit_id: "",
        tenant_id: "",
        payment_frequency: "",
        sort_by: "",
        sort_direction: "",
        page: 1,
        per_page: 15,
      };
    },

    /*
    |--------------------------------------------------------------------------
    | Clear Error
    |--------------------------------------------------------------------------
    */

    clearTenancyError: (state) => {
      state.error = null;
    },

    /*
    |--------------------------------------------------------------------------
    | Clear Success
    |--------------------------------------------------------------------------
    */

    clearTenancySuccess: (state) => {
      state.success = null;
    },

    /*
    |--------------------------------------------------------------------------
    | Clear Current Tenancy
    |--------------------------------------------------------------------------
    */

    clearTenancy: (state) => {
      state.tenancy = null;
    },

    /*
    |--------------------------------------------------------------------------
    | Clear Everything
    |--------------------------------------------------------------------------
    */

    resetTenancyState: () => {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    /*
    |--------------------------------------------------------------------------
    | FETCH TENANCIES
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchTenancies.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        fetchTenancies.fulfilled,
        (state, action) => {
          state.loading = false;

          const response =
            action.payload;

          const responseData =
            response?.data;

          /*
           * Laravel paginated response:
           *
           * data: [...]
           */
          if (Array.isArray(responseData)) {
            state.tenancies =
              responseData;
          }

          /*
           * Handle nested pagination:
           *
           * data: {
           *   data: [...]
           * }
           */
          else if (
            Array.isArray(
              responseData?.data
            )
          ) {
            state.tenancies =
              responseData.data;
          } else {
            state.tenancies = [];
          }

          const pagination =
            getPagination(response);

          if (pagination) {
            state.pagination =
              pagination;
          }

          state.error = null;
        }
      )

      .addCase(
        fetchTenancies.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to fetch tenancies.";

          state.tenancies = [];

          if (
            action.payload?.errors
          ) {
            state.errorDetails =
              action.payload.errors;
          }
        }
      );

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        searchTenancies.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        searchTenancies.fulfilled,
        (state, action) => {
          state.loading = false;

          const response =
            action.payload;

          const responseData =
            response?.data;

          if (Array.isArray(responseData)) {
            state.tenancies =
              responseData;
          } else if (
            Array.isArray(
              responseData?.data
            )
          ) {
            state.tenancies =
              responseData.data;
          } else {
            state.tenancies = [];
          }

          const pagination =
            getPagination(response);

          if (pagination) {
            state.pagination =
              pagination;
          }

          state.error = null;
        }
      )

      .addCase(
        searchTenancies.rejected,
        (state, action) => {
          state.loading = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to search tenancies.";
        }
      );

    /*
    |--------------------------------------------------------------------------
    | FETCH SINGLE TENANCY
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchTenancy.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        fetchTenancy.fulfilled,
        (state, action) => {
          state.loading = false;

          const response =
            action.payload;

          state.tenancy =
            getResponseData(response);

          state.error = null;
        }
      )

      .addCase(
        fetchTenancy.rejected,
        (state, action) => {
          state.loading = false;

          state.tenancy = null;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Tenancy not found.";
        }
      );

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        createTenancy.pending,
        (state) => {
          state.creating = true;
          state.loading = true;
          state.error = null;
          state.success = null;
        }
      )

      .addCase(
        createTenancy.fulfilled,
        (state, action) => {
          state.creating = false;
          state.loading = false;

          const tenancy =
            getResponseData(
              action.payload
            );

          if (tenancy) {
            state.tenancy =
              tenancy;

            /*
             * Add new tenancy to the
             * current list.
             */
            if (
              Array.isArray(
                state.tenancies
              )
            ) {
              state.tenancies.unshift(
                tenancy
              );
            }
          }

          state.success =
            action.payload?.message ||
            "Tenancy created successfully.";

          state.error = null;
        }
      )

      .addCase(
        createTenancy.rejected,
        (state, action) => {
          state.creating = false;
          state.loading = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to create tenancy.";

          state.success = null;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        updateTenancy.pending,
        (state) => {
          state.updating = true;
          state.loading = true;
          state.error = null;
          state.success = null;
        }
      )

      .addCase(
        updateTenancy.fulfilled,
        (state, action) => {
          state.updating = false;
          state.loading = false;

          const updatedTenancy =
            getResponseData(
              action.payload
            );

          if (updatedTenancy) {
            state.tenancy =
              updatedTenancy;

            const index =
              state.tenancies.findIndex(
                (item) =>
                  Number(item.id) ===
                  Number(updatedTenancy.id)
              );

            if (index !== -1) {
              state.tenancies[index] =
                updatedTenancy;
            }
          }

          state.success =
            action.payload?.message ||
            "Tenancy updated successfully.";

          state.error = null;
        }
      )

      .addCase(
        updateTenancy.rejected,
        (state, action) => {
          state.updating = false;
          state.loading = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to update tenancy.";

          state.success = null;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | PATCH
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        patchTenancy.pending,
        (state) => {
          state.updating = true;
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        patchTenancy.fulfilled,
        (state, action) => {
          state.updating = false;
          state.loading = false;

          const updatedTenancy =
            getResponseData(
              action.payload
            );

          if (updatedTenancy) {
            state.tenancy =
              updatedTenancy;

            const index =
              state.tenancies.findIndex(
                (item) =>
                  Number(item.id) ===
                  Number(updatedTenancy.id)
              );

            if (index !== -1) {
              state.tenancies[index] =
                updatedTenancy;
            }
          }

          state.success =
            action.payload?.message ||
            "Tenancy updated successfully.";

          state.error = null;
        }
      )

      .addCase(
        patchTenancy.rejected,
        (state, action) => {
          state.updating = false;
          state.loading = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to update tenancy.";
        }
      );

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        deleteTenancy.pending,
        (state) => {
          state.deleting = true;
          state.actionLoading = true;
          state.error = null;
          state.success = null;
        }
      )

      .addCase(
        deleteTenancy.fulfilled,
        (state, action) => {
          state.deleting = false;
          state.actionLoading = false;

          const deletedId =
            action.payload?.id;

          /*
           * Remove the tenancy from Redux
           * immediately after successful
           * deletion.
           */
          state.tenancies =
            state.tenancies.filter(
              (item) =>
                Number(item.id) !==
                Number(deletedId)
            );

          /*
           * If the deleted tenancy is
           * currently being viewed,
           * clear it.
           */
          if (
            state.tenancy &&
            Number(state.tenancy.id) ===
            Number(deletedId)
          ) {
            state.tenancy = null;
          }

          /*
           * Update pagination total.
           */
          if (
            state.pagination.total > 0
          ) {
            state.pagination.total -= 1;
          }

          state.success =
            action.payload?.response?.message ||
            "Tenancy deleted successfully.";

          state.error = null;
        }
      )

      .addCase(
        deleteTenancy.rejected,
        (state, action) => {
          state.deleting = false;
          state.actionLoading = false;

          /*
           * This is the important part.
           *
           * If ID 3 does not exist:
           *
           * "Tenancy not found."
           *
           * instead of exposing:
           *
           * No query results for model
           * [App\Models\Tenancy] 3
           */
          state.error =
            action.payload?.message ||
            "Tenancy not found.";

          state.success = null;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | RESTORE
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        restoreTenancy.pending,
        (state) => {
          state.restoring = true;
          state.actionLoading = true;
          state.error = null;
          state.success = null;
        }
      )

      .addCase(
        restoreTenancy.fulfilled,
        (state, action) => {
          state.restoring = false;
          state.actionLoading = false;

          const restored =
            getResponseData(
              action.payload
            );

          if (restored) {
            state.tenancy =
              restored;

            const index =
              state.tenancies.findIndex(
                (item) =>
                  Number(item.id) ===
                  Number(restored.id)
              );

            if (index !== -1) {
              state.tenancies[index] =
                restored;
            } else {
              state.tenancies.unshift(
                restored
              );
            }
          }

          state.success =
            action.payload?.message ||
            "Tenancy restored successfully.";

          state.error = null;
        }
      )

      .addCase(
        restoreTenancy.rejected,
        (state, action) => {
          state.restoring = false;
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Tenancy not found.";

          state.success = null;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        forceDeleteTenancy.pending,
        (state) => {
          state.forceDeleting = true;
          state.actionLoading = true;
          state.error = null;
          state.success = null;
        }
      )

      .addCase(
        forceDeleteTenancy.fulfilled,
        (state, action) => {
          state.forceDeleting = false;
          state.actionLoading = false;

          const deletedId =
            action.payload?.id;

          state.tenancies =
            state.tenancies.filter(
              (item) =>
                Number(item.id) !==
                Number(deletedId)
            );

          if (
            state.tenancy &&
            Number(state.tenancy.id) ===
            Number(deletedId)
          ) {
            state.tenancy = null;
          }

          state.success =
            action.payload?.response?.message ||
            "Tenancy permanently deleted.";

          state.error = null;
        }
      )

      .addCase(
        forceDeleteTenancy.rejected,
        (state, action) => {
          state.forceDeleting = false;
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Tenancy not found.";

          state.success = null;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        activateTenancy.pending,
        (state) => {
          state.actionLoading = true;
          state.error = null;
        }
      )

      .addCase(
        activateTenancy.fulfilled,
        (state, action) => {
          state.actionLoading = false;

          const activated =
            getResponseData(
              action.payload
            );

          if (activated) {
            state.tenancy =
              activated;

            const index =
              state.tenancies.findIndex(
                (item) =>
                  Number(item.id) ===
                  Number(activated.id)
              );

            if (index !== -1) {
              state.tenancies[index] =
                activated;
            }
          }

          state.success =
            action.payload?.message ||
            "Tenancy activated successfully.";

          state.error = null;
        }
      )

      .addCase(
        activateTenancy.rejected,
        (state, action) => {
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to activate tenancy.";
        }
      );

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        deactivateTenancy.pending,
        (state) => {
          state.actionLoading = true;
          state.error = null;
        }
      )

      .addCase(
        deactivateTenancy.fulfilled,
        (state, action) => {
          state.actionLoading = false;

          const deactivated =
            getResponseData(
              action.payload
            );

          if (deactivated) {
            state.tenancy =
              deactivated;

            const index =
              state.tenancies.findIndex(
                (item) =>
                  Number(item.id) ===
                  Number(deactivated.id)
              );

            if (index !== -1) {
              state.tenancies[index] =
                deactivated;
            }
          }

          state.success =
            action.payload?.message ||
            "Tenancy deactivated successfully.";

          state.error = null;
        }
      )

      .addCase(
        deactivateTenancy.rejected,
        (state, action) => {
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to deactivate tenancy.";
        }
      );

    /*
    |--------------------------------------------------------------------------
    | RENEW
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        renewTenancy.pending,
        (state) => {
          state.actionLoading = true;
          state.error = null;
        }
      )

      .addCase(
        renewTenancy.fulfilled,
        (state, action) => {
          state.actionLoading = false;

          const renewed =
            getResponseData(
              action.payload
            );

          if (renewed) {
            state.tenancy =
              renewed;

            const index =
              state.tenancies.findIndex(
                (item) =>
                  Number(item.id) ===
                  Number(renewed.id)
              );

            if (index !== -1) {
              state.tenancies[index] =
                renewed;
            }
          }

          state.success =
            action.payload?.message ||
            "Tenancy renewed successfully.";

          state.error = null;
        }
      )

      .addCase(
        renewTenancy.rejected,
        (state, action) => {
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to renew tenancy.";
        }
      );

    /*
    |--------------------------------------------------------------------------
    | TERMINATE
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        terminateTenancy.pending,
        (state) => {
          state.actionLoading = true;
          state.error = null;
        }
      )

      .addCase(
        terminateTenancy.fulfilled,
        (state, action) => {
          state.actionLoading = false;

          const terminated =
            getResponseData(
              action.payload
            );

          if (terminated) {
            state.tenancy =
              terminated;

            const index =
              state.tenancies.findIndex(
                (item) =>
                  Number(item.id) ===
                  Number(terminated.id)
              );

            if (index !== -1) {
              state.tenancies[index] =
                terminated;
            }
          }

          state.success =
            action.payload?.message ||
            "Tenancy terminated successfully.";

          state.error = null;
        }
      )

      .addCase(
        terminateTenancy.rejected,
        (state, action) => {
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to terminate tenancy.";
        }
      );

    /*
    |--------------------------------------------------------------------------
    | CANCEL
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        cancelTenancy.pending,
        (state) => {
          state.actionLoading = true;
          state.error = null;
        }
      )

      .addCase(
        cancelTenancy.fulfilled,
        (state, action) => {
          state.actionLoading = false;

          const cancelled =
            getResponseData(
              action.payload
            );

          if (cancelled) {
            state.tenancy =
              cancelled;

            const index =
              state.tenancies.findIndex(
                (item) =>
                  Number(item.id) ===
                  Number(cancelled.id)
              );

            if (index !== -1) {
              state.tenancies[index] =
                cancelled;
            }
          }

          state.success =
            action.payload?.message ||
            "Tenancy cancelled successfully.";

          state.error = null;
        }
      )

      .addCase(
        cancelTenancy.rejected,
        (state, action) => {
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to cancel tenancy.";
        }
      );

    /*
    |--------------------------------------------------------------------------
    | ASSIGN UNIT
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        assignUnit.pending,
        (state) => {
          state.actionLoading = true;
          state.error = null;
          state.success = null;
        }
      )

      .addCase(
        assignUnit.fulfilled,
        (state, action) => {
          state.actionLoading = false;

          const assigned =
            getResponseData(
              action.payload
            );

          if (assigned) {
            state.tenancy =
              assigned;

            /*
             * Do not duplicate the tenancy
             * if it already exists.
             */
            const exists =
              state.tenancies.some(
                (item) =>
                  Number(item.id) ===
                  Number(assigned.id)
              );

            if (!exists) {
              state.tenancies.unshift(
                assigned
              );
            }
          }

          state.success =
            action.payload?.message ||
            "Unit assigned to tenant successfully.";

          state.error = null;
        }
      )

      .addCase(
        assignUnit.rejected,
        (state, action) => {
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to assign unit.";

          state.success = null;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchTenancyStatistics.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      .addCase(
        fetchTenancyStatistics.fulfilled,
        (state, action) => {
          state.loading = false;

          state.statistics =
            getResponseData(
              action.payload
            );

          state.error = null;
        }
      )

      .addCase(
        fetchTenancyStatistics.rejected,
        (state, action) => {
          state.loading = false;

          state.statistics = null;

          state.error =
            action.payload?.message ||
            "Failed to fetch tenancy statistics.";
        }
      );
  },
});

/*
|--------------------------------------------------------------------------
| Actions
|--------------------------------------------------------------------------
*/

export const {
  setTenancyFilters,
  clearTenancyFilters,
  clearTenancyError,
  clearTenancySuccess,
  clearTenancy,
  resetTenancyState,
} = tenancySlice.actions;

/*
|--------------------------------------------------------------------------
| Selectors
|--------------------------------------------------------------------------
*/

export const selectTenancies = (state) =>
  state.tenancy?.tenancies || [];

export const selectTenancy = (state) =>
  state.tenancy?.tenancy || null;

export const selectTenancyPagination = (state) =>
  state.tenancy?.pagination || {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0,
  };

export const selectTenancyFilters = (state) =>
  state.tenancy?.filters || {
    search: "",
    status: "",
    property_id: "",
    apartment_id: "",
    unit_id: "",
    tenant_id: "",
    payment_frequency: "",
    sort_by: "",
    sort_direction: "",
    page: 1,
    per_page: 15,
  };

export const selectTenancyLoading = (state) =>
  Boolean(state.tenancy?.loading);

export const selectTenancyCreating = (state) =>
  Boolean(state.tenancy?.creating);

export const selectTenancyUpdating = (state) =>
  Boolean(state.tenancy?.updating);

export const selectTenancyDeleting = (state) =>
  Boolean(state.tenancy?.deleting);

export const selectTenancyRestoring = (state) =>
  Boolean(state.tenancy?.restoring);

export const selectTenancyForceDeleting = (state) =>
  Boolean(state.tenancy?.forceDeleting);

export const selectTenancyActionLoading = (state) =>
  Boolean(state.tenancy?.actionLoading);

export const selectTenancyError = (state) =>
  state.tenancy?.error || null;

export const selectTenancySuccess = (state) =>
  state.tenancy?.success || null;

export const selectTenancyStatistics = (state) =>
  state.tenancy?.statistics || null;

/*
|--------------------------------------------------------------------------
| Derived Selectors
|--------------------------------------------------------------------------
*/

export const selectHasTenancies = (state) =>
  Array.isArray(
    state.tenancy?.tenancies
  ) &&
  state.tenancy.tenancies.length > 0;

export const selectTenancyCount = (state) =>
  Array.isArray(
    state.tenancy?.tenancies
  )
    ? state.tenancy.tenancies.length
    : 0;

export const selectIsDeletingTenancy = (state) =>
  Boolean(state.tenancy?.deleting);

export const selectIsUpdatingTenancy = (state) =>
  Boolean(state.tenancy?.updating);

/*
|--------------------------------------------------------------------------
| Default Export
|--------------------------------------------------------------------------
*/

export default tenancySlice.reducer;