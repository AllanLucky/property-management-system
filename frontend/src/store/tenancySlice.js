// frontend/src/store/tenancySlice.js

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import tenancyService from "../services/tenancy.service";

/*
|--------------------------------------------------------------------------
| Stable Default References
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Do not use [] or {} directly inside selectors.
|
| Example of what NOT to do:
|
| state.tenancy?.tenancies || []
|
| The [] creates a new reference every time the selector runs.
|
*/

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

/*
|--------------------------------------------------------------------------
| Default Filters
|--------------------------------------------------------------------------
*/

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  property_id: "",
  apartment_id: "",
  unit_id: "",
  tenant_id: "",
  payment_frequency: "",
  start_date: "",
  end_date: "",
  sort_by: "",
  sort_order: "",
  page: 1,
  per_page: 15,
};

/*
|--------------------------------------------------------------------------
| Default Pagination
|--------------------------------------------------------------------------
*/

const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
  from: 0,
  to: 0,
};

/*
|--------------------------------------------------------------------------
| Initial State
|--------------------------------------------------------------------------
*/

const initialState = {
  tenancies: [],
  tenancy: null,

  pagination: {
    ...DEFAULT_PAGINATION,
  },

  filters: {
    ...DEFAULT_FILTERS,
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
  errorDetails: null,

  success: null,
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Extract a useful error message from Axios/Laravel errors.
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
 * Extract Laravel validation errors.
 */
const getValidationErrors = (error) => {
  return error?.response?.data?.errors || EMPTY_OBJECT;
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
 * Extract tenancy array from supported response shapes.
 */
const extractTenancies = (response) => {
  if (!response) {
    return EMPTY_ARRAY;
  }

  /*
   * Normal Laravel API:
   *
   * {
   *   status: true,
   *   data: [...]
   * }
   */
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  /*
   * Nested pagination:
   *
   * {
   *   data: {
   *     data: [...]
   *   }
   * }
   */
  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  /*
   * Direct array.
   */
  if (Array.isArray(response)) {
    return response;
  }

  /*
   * Nested items.
   */
  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  return EMPTY_ARRAY;
};

/**
 * Extract pagination information.
 */
const extractPagination = (response, currentState) => {
  const meta =
    response?.meta ||
    response?.data?.meta ||
    null;

  const data =
    response?.data &&
      typeof response.data === "object" &&
      !Array.isArray(response.data)
      ? response.data
      : {};

  const currentPage =
    meta?.current_page ??
    data?.current_page ??
    response?.current_page ??
    currentState?.current_page ??
    1;

  const lastPage =
    meta?.last_page ??
    data?.last_page ??
    response?.last_page ??
    currentState?.last_page ??
    1;

  const perPage =
    meta?.per_page ??
    data?.per_page ??
    response?.per_page ??
    currentState?.per_page ??
    15;

  const total =
    meta?.total ??
    data?.total ??
    response?.total ??
    currentState?.total ??
    0;

  const from =
    meta?.from ??
    data?.from ??
    response?.from ??
    0;

  const to =
    meta?.to ??
    data?.to ??
    response?.to ??
    0;

  return {
    current_page: Number(currentPage) || 1,
    last_page: Number(lastPage) || 1,
    per_page: Number(perPage) || 15,
    total: Number(total) || 0,
    from: Number(from) || 0,
    to: Number(to) || 0,
  };
};

/**
 * Safely replace or update a tenancy in the list.
 */
const updateTenancyInList = (state, tenancy) => {
  if (!tenancy?.id) {
    return;
  }

  const index = state.tenancies.findIndex(
    (item) =>
      Number(item?.id) === Number(tenancy.id)
  );

  if (index !== -1) {
    state.tenancies[index] = tenancy;
  } else {
    state.tenancies.unshift(tenancy);
  }
};

/**
 * Remove tenancy from list.
 */
const removeTenancyFromList = (
  state,
  tenancyId
) => {
  state.tenancies = state.tenancies.filter(
    (item) =>
      Number(item?.id) !== Number(tenancyId)
  );
};

/**
 * Convert a value to a safe ID.
 */
const normalizeId = (id) => {
  if (
    id === undefined ||
    id === null ||
    id === ""
  ) {
    return null;
  }

  return id;
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
    const tenancyId = normalizeId(id);

    if (!tenancyId) {
      return rejectWithValue({
        message: "Tenancy ID is required.",
        errors: EMPTY_OBJECT,
        status: 422,
      });
    }

    try {
      const response =
        await tenancyService.getTenancy(tenancyId);

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
  async ({ id, data }, { rejectWithValue }) => {
    const tenancyId = normalizeId(id);

    if (!tenancyId) {
      return rejectWithValue({
        message: "Tenancy ID is required.",
        errors: EMPTY_OBJECT,
        status: 422,
      });
    }

    try {
      return await tenancyService.updateTenancy(
        tenancyId,
        data
      );
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
  async ({ id, data }, { rejectWithValue }) => {
    const tenancyId = normalizeId(id);

    if (!tenancyId) {
      return rejectWithValue({
        message: "Tenancy ID is required.",
        errors: EMPTY_OBJECT,
        status: 422,
      });
    }

    try {
      return await tenancyService.patchTenancy(
        tenancyId,
        data
      );
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
*/

export const deleteTenancy = createAsyncThunk(
  "tenancy/deleteTenancy",
  async (id, { rejectWithValue }) => {
    const tenancyId = normalizeId(id);

    if (!tenancyId) {
      return rejectWithValue({
        id,
        message: "Tenancy ID is required.",
        errors: EMPTY_OBJECT,
        status: 422,
      });
    }

    try {
      const response =
        await tenancyService.deleteTenancy(
          tenancyId
        );

      return {
        id: tenancyId,
        response,
      };
    } catch (error) {
      return rejectWithValue({
        id: tenancyId,
        message: getErrorMessage(
          error,
          "Failed to delete tenancy."
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
| RESTORE TENANCY
|--------------------------------------------------------------------------
*/

export const restoreTenancy = createAsyncThunk(
  "tenancy/restoreTenancy",
  async (id, { rejectWithValue }) => {
    const tenancyId = normalizeId(id);

    if (!tenancyId) {
      return rejectWithValue({
        id,
        message: "Tenancy ID is required.",
        errors: EMPTY_OBJECT,
        status: 422,
      });
    }

    try {
      return await tenancyService.restoreTenancy(
        tenancyId
      );
    } catch (error) {
      return rejectWithValue({
        id: tenancyId,
        message: getErrorMessage(
          error,
          "Failed to restore tenancy."
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
| FORCE DELETE
|--------------------------------------------------------------------------
*/

export const forceDeleteTenancy =
  createAsyncThunk(
    "tenancy/forceDeleteTenancy",
    async (id, { rejectWithValue }) => {
      const tenancyId = normalizeId(id);

      if (!tenancyId) {
        return rejectWithValue({
          id,
          message: "Tenancy ID is required.",
          errors: EMPTY_OBJECT,
          status: 422,
        });
      }

      try {
        const response =
          await tenancyService.forceDeleteTenancy(
            tenancyId
          );

        return {
          id: tenancyId,
          response,
        };
      } catch (error) {
        return rejectWithValue({
          id: tenancyId,
          message: getErrorMessage(
            error,
            "Failed to permanently delete tenancy."
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
| ACTIVATE
|--------------------------------------------------------------------------
*/

export const activateTenancy =
  createAsyncThunk(
    "tenancy/activateTenancy",
    async (id, { rejectWithValue }) => {
      const tenancyId = normalizeId(id);

      if (!tenancyId) {
        return rejectWithValue({
          message: "Tenancy ID is required.",
          errors: EMPTY_OBJECT,
          status: 422,
        });
      }

      try {
        return await tenancyService.activateTenancy(
          tenancyId
        );
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

export const deactivateTenancy =
  createAsyncThunk(
    "tenancy/deactivateTenancy",
    async (id, { rejectWithValue }) => {
      const tenancyId = normalizeId(id);

      if (!tenancyId) {
        return rejectWithValue({
          message: "Tenancy ID is required.",
          errors: EMPTY_OBJECT,
          status: 422,
        });
      }

      try {
        return await tenancyService.deactivateTenancy(
          tenancyId
        );
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
  async ({ id, data }, { rejectWithValue }) => {
    const tenancyId = normalizeId(id);

    if (!tenancyId) {
      return rejectWithValue({
        message: "Tenancy ID is required.",
        errors: EMPTY_OBJECT,
        status: 422,
      });
    }

    try {
      return await tenancyService.renewTenancy(
        tenancyId,
        data
      );
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

export const terminateTenancy =
  createAsyncThunk(
    "tenancy/terminateTenancy",
    async (
      { id, data = {} },
      { rejectWithValue }
    ) => {
      const tenancyId = normalizeId(id);

      if (!tenancyId) {
        return rejectWithValue({
          message: "Tenancy ID is required.",
          errors: EMPTY_OBJECT,
          status: 422,
        });
      }

      try {
        return await tenancyService.terminateTenancy(
          tenancyId,
          data
        );
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

export const cancelTenancy =
  createAsyncThunk(
    "tenancy/cancelTenancy",
    async (
      { id, data = {} },
      { rejectWithValue }
    ) => {
      const tenancyId = normalizeId(id);

      if (!tenancyId) {
        return rejectWithValue({
          message: "Tenancy ID is required.",
          errors: EMPTY_OBJECT,
          status: 422,
        });
      }

      try {
        return await tenancyService.cancelTenancy(
          tenancyId,
          data
        );
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
      return await tenancyService.assignUnit(data);
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
        return await tenancyService.getStatistics();
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
      const payload = action.payload || {};

      state.filters = {
        ...state.filters,
        ...payload,
      };

      /*
       * Reset to page 1 when filters change,
       * unless a page was explicitly supplied.
       */
      if (payload.page === undefined) {
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
        ...DEFAULT_FILTERS,
      };
    },

    /*
    |--------------------------------------------------------------------------
    | Clear Error
    |--------------------------------------------------------------------------
    */

    clearTenancyError: (state) => {
      state.error = null;
      state.errorDetails = null;
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
    | Reset State
    |--------------------------------------------------------------------------
    */

    resetTenancyState: () => ({
      ...initialState,

      filters: {
        ...DEFAULT_FILTERS,
      },

      pagination: {
        ...DEFAULT_PAGINATION,
      },
    }),
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
          state.errorDetails = null;
        }
      )

      .addCase(
        fetchTenancies.fulfilled,
        (state, action) => {
          state.loading = false;

          const response = action.payload;

          const tenancies =
            extractTenancies(response);

          state.tenancies =
            Array.isArray(tenancies)
              ? tenancies
              : [];

          state.pagination =
            extractPagination(
              response,
              state.pagination
            );

          state.error = null;
          state.errorDetails = null;
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

          state.errorDetails =
            action.payload?.errors ||
            null;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | SEARCH TENANCIES
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        searchTenancies.pending,
        (state) => {
          state.loading = true;
          state.error = null;
          state.errorDetails = null;
        }
      )

      .addCase(
        searchTenancies.fulfilled,
        (state, action) => {
          state.loading = false;

          const response = action.payload;

          state.tenancies =
            extractTenancies(response);

          state.pagination =
            extractPagination(
              response,
              state.pagination
            );

          state.error = null;
          state.errorDetails = null;
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

          state.errorDetails =
            action.payload?.errors ||
            null;
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
          state.errorDetails = null;
        }
      )

      .addCase(
        fetchTenancy.fulfilled,
        (state, action) => {
          state.loading = false;

          state.tenancy =
            getResponseData(
              action.payload
            );

          state.error = null;
          state.errorDetails = null;
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

          state.errorDetails =
            action.payload?.errors ||
            null;
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
          state.error = null;
          state.errorDetails = null;
          state.success = null;
        }
      )

      .addCase(
        createTenancy.fulfilled,
        (state, action) => {
          state.creating = false;

          const tenancy =
            getResponseData(
              action.payload
            );

          if (
            tenancy &&
            typeof tenancy === "object" &&
            !Array.isArray(tenancy)
          ) {
            state.tenancy = tenancy;

            updateTenancyInList(
              state,
              tenancy
            );
          }

          state.success =
            action.payload?.message ||
            "Tenancy created successfully.";

          state.error = null;
          state.errorDetails = null;
        }
      )

      .addCase(
        createTenancy.rejected,
        (state, action) => {
          state.creating = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to create tenancy.";

          state.errorDetails =
            action.payload?.errors ||
            null;

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
          state.error = null;
          state.errorDetails = null;
          state.success = null;
        }
      )

      .addCase(
        updateTenancy.fulfilled,
        (state, action) => {
          state.updating = false;

          const updated =
            getResponseData(
              action.payload
            );

          if (
            updated &&
            typeof updated === "object"
          ) {
            state.tenancy = updated;

            updateTenancyInList(
              state,
              updated
            );
          }

          state.success =
            action.payload?.message ||
            "Tenancy updated successfully.";

          state.error = null;
          state.errorDetails = null;
        }
      )

      .addCase(
        updateTenancy.rejected,
        (state, action) => {
          state.updating = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to update tenancy.";

          state.errorDetails =
            action.payload?.errors ||
            null;

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
          state.error = null;
          state.errorDetails = null;
          state.success = null;
        }
      )

      .addCase(
        patchTenancy.fulfilled,
        (state, action) => {
          state.updating = false;

          const updated =
            getResponseData(
              action.payload
            );

          if (
            updated &&
            typeof updated === "object"
          ) {
            state.tenancy = updated;

            updateTenancyInList(
              state,
              updated
            );
          }

          state.success =
            action.payload?.message ||
            "Tenancy updated successfully.";

          state.error = null;
          state.errorDetails = null;
        }
      )

      .addCase(
        patchTenancy.rejected,
        (state, action) => {
          state.updating = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to update tenancy.";

          state.errorDetails =
            action.payload?.errors ||
            null;

          state.success = null;
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
          state.errorDetails = null;
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

          removeTenancyFromList(
            state,
            deletedId
          );

          if (
            state.tenancy &&
            Number(state.tenancy.id) ===
            Number(deletedId)
          ) {
            state.tenancy = null;
          }

          if (state.pagination.total > 0) {
            state.pagination.total -= 1;
          }

          state.success =
            action.payload?.response?.message ||
            "Tenancy deleted successfully.";

          state.error = null;
          state.errorDetails = null;
        }
      )

      .addCase(
        deleteTenancy.rejected,
        (state, action) => {
          state.deleting = false;
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to delete tenancy.";

          state.errorDetails =
            action.payload?.errors ||
            null;

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
          state.errorDetails = null;
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

          if (
            restored &&
            typeof restored === "object"
          ) {
            state.tenancy = restored;

            updateTenancyInList(
              state,
              restored
            );
          }

          state.success =
            action.payload?.message ||
            "Tenancy restored successfully.";

          state.error = null;
          state.errorDetails = null;
        }
      )

      .addCase(
        restoreTenancy.rejected,
        (state, action) => {
          state.restoring = false;
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to restore tenancy.";

          state.errorDetails =
            action.payload?.errors ||
            null;

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
          state.errorDetails = null;
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

          removeTenancyFromList(
            state,
            deletedId
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
          state.errorDetails = null;
        }
      )

      .addCase(
        forceDeleteTenancy.rejected,
        (state, action) => {
          state.forceDeleting = false;
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to permanently delete tenancy.";

          state.errorDetails =
            action.payload?.errors ||
            null;

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
          state.success = null;
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

          if (
            activated &&
            typeof activated === "object"
          ) {
            state.tenancy = activated;

            updateTenancyInList(
              state,
              activated
            );
          }

          state.success =
            action.payload?.message ||
            "Tenancy activated successfully.";

          state.error = null;
          state.errorDetails = null;
        }
      )

      .addCase(
        activateTenancy.rejected,
        (state, action) => {
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to activate tenancy.";

          state.errorDetails =
            action.payload?.errors ||
            null;

          state.success = null;
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
          state.success = null;
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

          if (
            deactivated &&
            typeof deactivated === "object"
          ) {
            state.tenancy = deactivated;

            updateTenancyInList(
              state,
              deactivated
            );
          }

          state.success =
            action.payload?.message ||
            "Tenancy deactivated successfully.";

          state.error = null;
          state.errorDetails = null;
        }
      )

      .addCase(
        deactivateTenancy.rejected,
        (state, action) => {
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to deactivate tenancy.";

          state.errorDetails =
            action.payload?.errors ||
            null;

          state.success = null;
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
          state.success = null;
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

          if (
            renewed &&
            typeof renewed === "object"
          ) {
            state.tenancy = renewed;

            updateTenancyInList(
              state,
              renewed
            );
          }

          state.success =
            action.payload?.message ||
            "Tenancy renewed successfully.";

          state.error = null;
          state.errorDetails = null;
        }
      )

      .addCase(
        renewTenancy.rejected,
        (state, action) => {
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to renew tenancy.";

          state.errorDetails =
            action.payload?.errors ||
            null;

          state.success = null;
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
          state.success = null;
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

          if (
            terminated &&
            typeof terminated === "object"
          ) {
            state.tenancy = terminated;

            updateTenancyInList(
              state,
              terminated
            );
          }

          state.success =
            action.payload?.message ||
            "Tenancy terminated successfully.";

          state.error = null;
          state.errorDetails = null;
        }
      )

      .addCase(
        terminateTenancy.rejected,
        (state, action) => {
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to terminate tenancy.";

          state.errorDetails =
            action.payload?.errors ||
            null;

          state.success = null;
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
          state.success = null;
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

          if (
            cancelled &&
            typeof cancelled === "object"
          ) {
            state.tenancy = cancelled;

            updateTenancyInList(
              state,
              cancelled
            );
          }

          state.success =
            action.payload?.message ||
            "Tenancy cancelled successfully.";

          state.error = null;
          state.errorDetails = null;
        }
      )

      .addCase(
        cancelTenancy.rejected,
        (state, action) => {
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to cancel tenancy.";

          state.errorDetails =
            action.payload?.errors ||
            null;

          state.success = null;
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

          if (
            assigned &&
            typeof assigned === "object"
          ) {
            state.tenancy = assigned;

            updateTenancyInList(
              state,
              assigned
            );
          }

          state.success =
            action.payload?.message ||
            "Unit assigned to tenant successfully.";

          state.error = null;
          state.errorDetails = null;
        }
      )

      .addCase(
        assignUnit.rejected,
        (state, action) => {
          state.actionLoading = false;

          state.error =
            action.payload?.message ||
            "Failed to assign unit.";

          state.errorDetails =
            action.payload?.errors ||
            null;

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
          state.errorDetails = null;
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
          state.errorDetails = null;
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

          state.errorDetails =
            action.payload?.errors ||
            null;
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
|
| IMPORTANT FIX:
|
| These selectors NEVER create a new [] or {} fallback.
|
| This prevents React-Redux from reporting:
|
| "Selector selectTenancies returned a different result
|  when called with the same parameters."
|
*/

/**
 * Tenancies list.
 */
export const selectTenancies = (state) => {
  const tenancies =
    state?.tenancy?.tenancies;

  return Array.isArray(tenancies)
    ? tenancies
    : EMPTY_ARRAY;
};

/**
 * Current tenancy.
 */
export const selectTenancy = (state) =>
  state?.tenancy?.tenancy ?? null;

/**
 * Pagination.
 */
export const selectTenancyPagination = (
  state
) =>
  state?.tenancy?.pagination ??
  DEFAULT_PAGINATION;

/**
 * Filters.
 */
export const selectTenancyFilters = (
  state
) =>
  state?.tenancy?.filters ??
  DEFAULT_FILTERS;

/**
 * Loading.
 */
export const selectTenancyLoading = (
  state
) =>
  Boolean(
    state?.tenancy?.loading
  );

/**
 * Creating.
 */
export const selectTenancyCreating = (
  state
) =>
  Boolean(
    state?.tenancy?.creating
  );

/**
 * Updating.
 */
export const selectTenancyUpdating = (
  state
) =>
  Boolean(
    state?.tenancy?.updating
  );

/**
 * Deleting.
 */
export const selectTenancyDeleting = (
  state
) =>
  Boolean(
    state?.tenancy?.deleting
  );

/**
 * Restoring.
 */
export const selectTenancyRestoring = (
  state
) =>
  Boolean(
    state?.tenancy?.restoring
  );

/**
 * Force deleting.
 */
export const selectTenancyForceDeleting = (
  state
) =>
  Boolean(
    state?.tenancy?.forceDeleting
  );

/**
 * Action loading.
 */
export const selectTenancyActionLoading = (
  state
) =>
  Boolean(
    state?.tenancy?.actionLoading
  );

/**
 * Error.
 */
export const selectTenancyError = (
  state
) =>
  state?.tenancy?.error ?? null;

/**
 * Error details.
 */
export const selectTenancyErrorDetails = (
  state
) =>
  state?.tenancy?.errorDetails ?? null;

/**
 * Success.
 */
export const selectTenancySuccess = (
  state
) =>
  state?.tenancy?.success ?? null;

/**
 * Statistics.
 */
export const selectTenancyStatistics = (
  state
) =>
  state?.tenancy?.statistics ?? null;

/*
|--------------------------------------------------------------------------
| Derived Selectors
|--------------------------------------------------------------------------
*/

/**
 * Whether there are tenancies.
 */
export const selectHasTenancies = (
  state
) => {
  const tenancies =
    state?.tenancy?.tenancies;

  return (
    Array.isArray(tenancies) &&
    tenancies.length > 0
  );
};

/**
 * Number of loaded tenancies.
 */
export const selectTenancyCount = (
  state
) => {
  const tenancies =
    state?.tenancy?.tenancies;

  return Array.isArray(tenancies)
    ? tenancies.length
    : 0;
};

/**
 * Whether tenancy deletion is running.
 */
export const selectIsDeletingTenancy = (
  state
) =>
  Boolean(
    state?.tenancy?.deleting
  );

/**
 * Whether tenancy update is running.
 */
export const selectIsUpdatingTenancy = (
  state
) =>
  Boolean(
    state?.tenancy?.updating
  );

/**
 * Whether tenancy creation is running.
 */
export const selectIsCreatingTenancy = (
  state
) =>
  Boolean(
    state?.tenancy?.creating
  );

/**
 * Whether tenancy list loading is running.
 */
export const selectIsLoadingTenancies = (
  state
) =>
  Boolean(
    state?.tenancy?.loading
  );

/*
|--------------------------------------------------------------------------
| Default Export
|--------------------------------------------------------------------------
*/

export default tenancySlice.reducer;