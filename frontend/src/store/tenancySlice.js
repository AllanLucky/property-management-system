import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import tenancyService from "../services/tenancy.service";



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
  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  tenancies: [],
  tenancy: null,

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  pagination: {
    ...DEFAULT_PAGINATION,
  },

  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  filters: {
    ...DEFAULT_FILTERS,
  },

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  statistics: null,

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  restoring: false,
  forceDeleting: false,
  actionLoading: false,

  /*
  |--------------------------------------------------------------------------
  | Errors
  |--------------------------------------------------------------------------
  */

  error: null,
  errorDetails: null,

  /*
  |--------------------------------------------------------------------------
  | Success
  |--------------------------------------------------------------------------
  */

  success: null,
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Extract a useful error message.
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
  return (
    error?.response?.data?.errors ||
    EMPTY_OBJECT
  );
};

/**
 * Extract HTTP status.
 */
const getErrorStatus = (error) => {
  return (
    error?.response?.status ||
    error?.status ||
    error?.response?.data?.code ||
    null
  );
};

/**
 * Normalize ID.
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

/**
 * Validate object.
 */
const isValidObject = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};

/*
|--------------------------------------------------------------------------
| Response Helpers
|--------------------------------------------------------------------------
*/

/**
 * Get response body.
 *
 * Axios service is expected to return:
 *
 * {
 *   status: true,
 *   code: 200,
 *   data: [...]
 * }
 *
 * If the service returns Axios response:
 *
 * {
 *   data: {
 *      status: true,
 *      ...
 *   }
 * }
 *
 * this helper handles both.
 */
const getApiPayload = (response) => {
  if (!response) {
    return null;
  }

  /*
   * Axios response.
   */
  if (
    response?.data &&
    typeof response.data === "object" &&
    (
      response.data.status !== undefined ||
      response.data.code !== undefined ||
      response.data.message !== undefined
    )
  ) {
    return response.data;
  }

  /*
   * Already-normalized API response.
   */
  return response;
};

/**
 * Extract a single resource.
 */
const extractResource = (response) => {
  const payload =
    getApiPayload(response);

  if (!payload) {
    return null;
  }

  /*
   * Standard:
   *
   * {
   *   data: {...}
   * }
   */
  if (
    payload.data &&
    !Array.isArray(payload.data) &&
    typeof payload.data === "object"
  ) {
    /*
     * Handle nested pagination/resource shapes.
     */
    if (
      payload.data.data &&
      !Array.isArray(payload.data.data) &&
      typeof payload.data.data === "object"
    ) {
      return payload.data.data;
    }

    return payload.data;
  }

  /*
   * Direct object.
   */
  if (
    typeof payload === "object" &&
    !Array.isArray(payload)
  ) {
    /*
     * Do not return the API envelope as tenancy.
     */
    if (
      payload.id !== undefined ||
      payload.tenancy_number !== undefined
    ) {
      return payload;
    }
  }

  return null;
};

/**
 * Extract tenancy list.
 *
 * Expected API:
 *
 * {
 *   status: true,
 *   code: 200,
 *   message: "Tenancies fetched successfully",
 *   data: [
 *      {...},
 *      {...}
 *   ],
 *   meta: {
 *      current_page: 1,
 *      last_page: 2,
 *      per_page: 15,
 *      total: 24,
 *      from: 1,
 *      to: 15
 *   }
 * }
 */
const extractTenancies = (response) => {
  const payload =
    getApiPayload(response);

  if (!payload) {
    console.warn(
      "[tenancySlice] extractTenancies: empty response"
    );

    return EMPTY_ARRAY;
  }

  /*
   * Primary expected structure.
   */
  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  /*
   * Nested Laravel pagination structure.
   */
  if (
    payload.data &&
    Array.isArray(payload.data.data)
  ) {
    return payload.data.data;
  }

  /*
   * items structure.
   */
  if (
    payload.data &&
    Array.isArray(payload.data.items)
  ) {
    return payload.data.items;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  /*
   * Direct array.
   */
  if (Array.isArray(payload)) {
    return payload;
  }

  console.warn(
    "[tenancySlice] extractTenancies: no tenancy array found",
    payload
  );

  return EMPTY_ARRAY;
};

/**
 * Extract pagination.
 */
const extractPagination = (
  response,
  currentState = DEFAULT_PAGINATION
) => {
  const payload =
    getApiPayload(response);

  if (!payload) {
    return {
      ...currentState,
    };
  }

  /*
   * Standard Laravel API:
   *
   * payload.meta
   */
  const meta =
    payload.meta ||
    payload.data?.meta ||
    null;

  /*
   * Some APIs place pagination directly
   * inside data.
   */
  const data =
    payload.data &&
      typeof payload.data === "object" &&
      !Array.isArray(payload.data)
      ? payload.data
      : {};

  const currentPage =
    meta?.current_page ??
    data?.current_page ??
    payload?.current_page ??
    currentState?.current_page ??
    1;

  const lastPage =
    meta?.last_page ??
    data?.last_page ??
    payload?.last_page ??
    currentState?.last_page ??
    1;

  const perPage =
    meta?.per_page ??
    data?.per_page ??
    payload?.per_page ??
    currentState?.per_page ??
    15;

  const total =
    meta?.total ??
    data?.total ??
    payload?.total ??
    currentState?.total ??
    0;

  const from =
    meta?.from ??
    data?.from ??
    payload?.from ??
    0;

  const to =
    meta?.to ??
    data?.to ??
    payload?.to ??
    0;

  const pagination = {
    current_page:
      Number(currentPage) || 1,

    last_page:
      Number(lastPage) || 1,

    per_page:
      Number(perPage) || 15,

    total:
      Number(total) || 0,

    from:
      Number(from) || 0,

    to:
      Number(to) || 0,
  };

  console.log(
    "[tenancySlice] Extracted pagination:",
    pagination
  );

  return pagination;
};

/**
 * Get response message.
 */
const getResponseMessage = (
  response,
  fallback
) => {
  const payload =
    getApiPayload(response);

  return (
    payload?.message ||
    fallback
  );
};

/*
|--------------------------------------------------------------------------
| List Helpers
|--------------------------------------------------------------------------
*/

/**
 * Update tenancy in current list.
 */
const updateTenancyInList = (
  state,
  tenancy
) => {
  if (
    !tenancy ||
    typeof tenancy !== "object" ||
    !tenancy.id
  ) {
    return;
  }

  const index =
    state.tenancies.findIndex(
      (item) =>
        Number(item?.id) ===
        Number(tenancy.id)
    );

  if (index !== -1) {
    state.tenancies[index] =
      tenancy;
  } else {
    state.tenancies.unshift(
      tenancy
    );
  }
};

/**
 * Remove tenancy.
 */
const removeTenancyFromList = (
  state,
  tenancyId
) => {
  state.tenancies =
    state.tenancies.filter(
      (item) =>
        Number(item?.id) !==
        Number(tenancyId)
    );
};

/**
 * Standard rejected payload.
 */
const rejectError = (
  error,
  fallback
) => {
  return {
    message: getErrorMessage(
      error,
      fallback
    ),

    errors:
      getValidationErrors(error),

    status:
      getErrorStatus(error),
  };
};

/*
|--------------------------------------------------------------------------
| FETCH TENANCIES
|--------------------------------------------------------------------------
*/

export const fetchTenancies =
  createAsyncThunk(
    "tenancy/fetchTenancies",
    async (
      params = {},
      { rejectWithValue }
    ) => {
      console.group(
        "[tenancySlice] fetchTenancies"
      );

      console.log(
        "Request parameters:",
        params
      );

      try {
        const response =
          await tenancyService.getTenancies(
            params
          );

        console.log(
          "Raw service response:",
          response
        );

        const payload =
          getApiPayload(response);

        console.log(
          "Normalized API payload:",
          payload
        );

        console.log(
          "Tenancy array:",
          extractTenancies(payload)
        );

        console.log(
          "Tenancy count:",
          extractTenancies(payload).length
        );

        console.log(
          "Pagination:",
          extractPagination(payload)
        );

        console.groupEnd();

        /*
         * Return normalized API payload.
         *
         * This means reducers always receive:
         *
         * {
         *   status,
         *   code,
         *   message,
         *   data,
         *   meta,
         *   links
         * }
         */
        return payload;
      } catch (error) {
        console.error(
          "[tenancySlice] fetchTenancies failed:",
          error
        );

        console.error(
          "Response:",
          error?.response?.data
        );

        console.groupEnd();

        return rejectWithValue(
          rejectError(
            error,
            "Failed to fetch tenancies."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| FETCH SINGLE TENANCY
|--------------------------------------------------------------------------
*/

export const fetchTenancy =
  createAsyncThunk(
    "tenancy/fetchTenancy",
    async (
      id,
      { rejectWithValue }
    ) => {
      const tenancyId =
        normalizeId(id);

      if (!tenancyId) {
        return rejectWithValue({
          message:
            "Tenancy ID is required.",
          errors: EMPTY_OBJECT,
          status: 422,
        });
      }

      try {
        return await tenancyService.getTenancy(
          tenancyId
        );
      } catch (error) {
        return rejectWithValue(
          rejectError(
            error,
            "Tenancy not found."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| CREATE TENANCY
|--------------------------------------------------------------------------
*/

export const createTenancy =
  createAsyncThunk(
    "tenancy/createTenancy",
    async (
      data,
      { rejectWithValue }
    ) => {
      if (!isValidObject(data)) {
        return rejectWithValue({
          message:
            "Tenancy data is required.",
          errors: EMPTY_OBJECT,
          status: 422,
        });
      }

      try {
        return await tenancyService.createTenancy(
          data
        );
      } catch (error) {
        return rejectWithValue(
          rejectError(
            error,
            "Failed to create tenancy."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| UPDATE TENANCY
|--------------------------------------------------------------------------
*/

export const updateTenancy =
  createAsyncThunk(
    "tenancy/updateTenancy",
    async (
      { id, data },
      { rejectWithValue }
    ) => {
      const tenancyId =
        normalizeId(id);

      if (!tenancyId) {
        return rejectWithValue({
          message:
            "Tenancy ID is required.",
          errors: EMPTY_OBJECT,
          status: 422,
        });
      }

      if (!isValidObject(data)) {
        return rejectWithValue({
          message:
            "Tenancy data is required.",
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
        return rejectWithValue(
          rejectError(
            error,
            "Failed to update tenancy."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| PATCH TENANCY
|--------------------------------------------------------------------------
*/

export const patchTenancy =
  createAsyncThunk(
    "tenancy/patchTenancy",
    async (
      { id, data },
      { rejectWithValue }
    ) => {
      const tenancyId =
        normalizeId(id);

      if (!tenancyId) {
        return rejectWithValue({
          message:
            "Tenancy ID is required.",
          errors: EMPTY_OBJECT,
          status: 422,
        });
      }

      if (!isValidObject(data)) {
        return rejectWithValue({
          message:
            "Tenancy data is required.",
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
        return rejectWithValue(
          rejectError(
            error,
            "Failed to update tenancy."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| DELETE TENANCY
|--------------------------------------------------------------------------
*/

export const deleteTenancy =
  createAsyncThunk(
    "tenancy/deleteTenancy",
    async (
      id,
      { rejectWithValue }
    ) => {
      const tenancyId =
        normalizeId(id);

      if (!tenancyId) {
        return rejectWithValue({
          id,
          message:
            "Tenancy ID is required.",
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
          ...rejectError(
            error,
            "Failed to delete tenancy."
          ),
        });
      }
    }
  );

/*
|--------------------------------------------------------------------------
| RESTORE TENANCY
|--------------------------------------------------------------------------
*/

export const restoreTenancy =
  createAsyncThunk(
    "tenancy/restoreTenancy",
    async (
      id,
      { rejectWithValue }
    ) => {
      const tenancyId =
        normalizeId(id);

      if (!tenancyId) {
        return rejectWithValue({
          id,
          message:
            "Tenancy ID is required.",
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
          ...rejectError(
            error,
            "Failed to restore tenancy."
          ),
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
    async (
      id,
      { rejectWithValue }
    ) => {
      const tenancyId =
        normalizeId(id);

      if (!tenancyId) {
        return rejectWithValue({
          id,
          message:
            "Tenancy ID is required.",
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
          ...rejectError(
            error,
            "Failed to permanently delete tenancy."
          ),
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
    async (
      id,
      { rejectWithValue }
    ) => {
      const tenancyId =
        normalizeId(id);

      if (!tenancyId) {
        return rejectWithValue({
          message:
            "Tenancy ID is required.",
          errors: EMPTY_OBJECT,
          status: 422,
        });
      }

      try {
        return await tenancyService.activateTenancy(
          tenancyId
        );
      } catch (error) {
        return rejectWithValue(
          rejectError(
            error,
            "Failed to activate tenancy."
          )
        );
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
    async (
      id,
      { rejectWithValue }
    ) => {
      const tenancyId =
        normalizeId(id);

      if (!tenancyId) {
        return rejectWithValue({
          message:
            "Tenancy ID is required.",
          errors: EMPTY_OBJECT,
          status: 422,
        });
      }

      try {
        return await tenancyService.deactivateTenancy(
          tenancyId
        );
      } catch (error) {
        return rejectWithValue(
          rejectError(
            error,
            "Failed to deactivate tenancy."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| RENEW
|--------------------------------------------------------------------------
*/

export const renewTenancy =
  createAsyncThunk(
    "tenancy/renewTenancy",
    async (
      { id, data },
      { rejectWithValue }
    ) => {
      const tenancyId =
        normalizeId(id);

      if (!tenancyId) {
        return rejectWithValue({
          message:
            "Tenancy ID is required.",
          errors: EMPTY_OBJECT,
          status: 422,
        });
      }

      if (!isValidObject(data)) {
        return rejectWithValue({
          message:
            "Renewal data is required.",
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
        return rejectWithValue(
          rejectError(
            error,
            "Failed to renew tenancy."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| ASSIGN UNIT
|--------------------------------------------------------------------------
*/

export const assignUnit =
  createAsyncThunk(
    "tenancy/assignUnit",
    async (
      data,
      { rejectWithValue }
    ) => {
      if (!isValidObject(data)) {
        return rejectWithValue({
          message:
            "Assignment data is required.",
          errors: EMPTY_OBJECT,
          status: 422,
        });
      }

      try {
        return await tenancyService.assignUnit(
          data
        );
      } catch (error) {
        return rejectWithValue(
          rejectError(
            error,
            "Failed to assign unit."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| FETCH STATISTICS
|--------------------------------------------------------------------------
*/

export const fetchTenancyStatistics =
  createAsyncThunk(
    "tenancy/fetchTenancyStatistics",
    async (
      _,
      { rejectWithValue }
    ) => {
      try {
        return await tenancyService.getStatistics();
      } catch (error) {
        return rejectWithValue(
          rejectError(
            error,
            "Failed to fetch tenancy statistics."
          )
        );
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

    setTenancyFilters: (
      state,
      action
    ) => {
      const payload =
        action.payload || {};

      state.filters = {
        ...state.filters,
        ...payload,
      };

      /*
       * Unless page was explicitly supplied,
       * changing a filter returns to page 1.
       */
      if (
        payload.page === undefined
      ) {
        state.filters.page = 1;
      }

      console.log(
        "[tenancySlice] Filters updated:",
        state.filters
      );
    },

    /*
    |--------------------------------------------------------------------------
    | Clear Filters
    |--------------------------------------------------------------------------
    */

    clearTenancyFilters: (
      state
    ) => {
      state.filters = {
        ...DEFAULT_FILTERS,
      };

      console.log(
        "[tenancySlice] Filters cleared:",
        state.filters
      );
    },

    /*
    |--------------------------------------------------------------------------
    | Clear Error
    |--------------------------------------------------------------------------
    */

    clearTenancyError: (
      state
    ) => {
      state.error = null;
      state.errorDetails = null;
    },

    /*
    |--------------------------------------------------------------------------
    | Clear Success
    |--------------------------------------------------------------------------
    */

    clearTenancySuccess: (
      state
    ) => {
      state.success = null;
    },

    /*
    |--------------------------------------------------------------------------
    | Clear Current Tenancy
    |--------------------------------------------------------------------------
    */

    clearTenancy: (
      state
    ) => {
      state.tenancy = null;
    },

    /*
    |--------------------------------------------------------------------------
    | Reset
    |--------------------------------------------------------------------------
    */

    resetTenancyState: () => ({
      ...initialState,

      tenancies: [],

      tenancy: null,

      filters: {
        ...DEFAULT_FILTERS,
      },

      pagination: {
        ...DEFAULT_PAGINATION,
      },

      statistics: null,

      error: null,
      errorDetails: null,
      success: null,

      loading: false,
      creating: false,
      updating: false,
      deleting: false,
      restoring: false,
      forceDeleting: false,
      actionLoading: false,
    }),
  },

  /*
  |--------------------------------------------------------------------------
  | Extra Reducers
  |--------------------------------------------------------------------------
  */

  extraReducers: (builder) => {
    /*
    |--------------------------------------------------------------------------
    | FETCH TENANCIES
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchTenancies.pending,
        (state, action) => {
          state.loading = true;

          state.error = null;
          state.errorDetails = null;

          console.log(
            "[tenancySlice] FETCH PENDING",
            action.meta?.arg
          );
        }
      )

      .addCase(
        fetchTenancies.fulfilled,
        (state, action) => {
          const response =
            getApiPayload(
              action.payload
            );

          const tenancies =
            extractTenancies(
              response
            );

          const pagination =
            extractPagination(
              response,
              state.pagination
            );

          state.loading = false;

          /*
           * THIS IS THE IMPORTANT PART.
           *
           * The API returns:
           *
           * data: Array(15)
           *
           * Therefore state.tenancies MUST become
           * that array directly.
           */
          state.tenancies = [
            ...tenancies,
          ];

          /*
           * Save Laravel pagination metadata.
           */
          state.pagination = {
            ...state.pagination,
            ...pagination,
          };

          state.error = null;
          state.errorDetails = null;

          console.group(
            "[tenancySlice] FETCH FULFILLED"
          );

          console.log(
            "Thunk type:",
            action.type
          );

          console.log(
            "API response:",
            response
          );

          console.log(
            "Tenancies:",
            state.tenancies
          );

          console.log(
            "Tenancy count:",
            state.tenancies.length
          );

          console.log(
            "Pagination:",
            state.pagination
          );

          console.log(
            "API total:",
            response?.meta?.total
          );

          console.groupEnd();
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

          console.error(
            "[tenancySlice] FETCH REJECTED",
            {
              payload:
                action.payload,

              error:
                action.error,

              meta:
                action.meta,
            }
          );
        }
      );

    /*
    |--------------------------------------------------------------------------
    | FETCH SINGLE
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
            extractResource(
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

          const created =
            extractResource(
              action.payload
            );

          if (created) {
            state.tenancy =
              created;

            updateTenancyInList(
              state,
              created
            );

            state.pagination.total += 1;
          }

          state.success =
            getResponseMessage(
              action.payload,
              "Tenancy created successfully."
            );

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
            extractResource(
              action.payload
            );

          if (updated) {
            state.tenancy =
              updated;

            updateTenancyInList(
              state,
              updated
            );
          }

          state.success =
            getResponseMessage(
              action.payload,
              "Tenancy updated successfully."
            );

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
            extractResource(
              action.payload
            );

          if (updated) {
            state.tenancy =
              updated;

            updateTenancyInList(
              state,
              updated
            );
          }

          state.success =
            getResponseMessage(
              action.payload,
              "Tenancy updated successfully."
            );

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

          if (
            state.pagination.total > 0
          ) {
            state.pagination.total -= 1;
          }

          state.success =
            getResponseMessage(
              action.payload?.response,
              "Tenancy deleted successfully."
            );

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
            action.error?.message ||
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
            extractResource(
              action.payload
            );

          if (restored) {
            state.tenancy =
              restored;

            updateTenancyInList(
              state,
              restored
            );
          }

          state.success =
            getResponseMessage(
              action.payload,
              "Tenancy restored successfully."
            );

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
            action.error?.message ||
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

          if (
            state.pagination.total > 0
          ) {
            state.pagination.total -= 1;
          }

          state.success =
            getResponseMessage(
              action.payload?.response,
              "Tenancy permanently deleted."
            );

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
            action.error?.message ||
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
          state.errorDetails = null;
          state.success = null;
        }
      )

      .addCase(
        activateTenancy.fulfilled,
        (state, action) => {
          state.actionLoading = false;

          const activated =
            extractResource(
              action.payload
            );

          if (activated) {
            state.tenancy =
              activated;

            updateTenancyInList(
              state,
              activated
            );
          }

          state.success =
            getResponseMessage(
              action.payload,
              "Tenancy activated successfully."
            );

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
            action.error?.message ||
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
          state.errorDetails = null;
          state.success = null;
        }
      )

      .addCase(
        deactivateTenancy.fulfilled,
        (state, action) => {
          state.actionLoading = false;

          const deactivated =
            extractResource(
              action.payload
            );

          if (deactivated) {
            state.tenancy =
              deactivated;

            updateTenancyInList(
              state,
              deactivated
            );
          }

          state.success =
            getResponseMessage(
              action.payload,
              "Tenancy deactivated successfully."
            );

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
            action.error?.message ||
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
          state.errorDetails = null;
          state.success = null;
        }
      )

      .addCase(
        renewTenancy.fulfilled,
        (state, action) => {
          state.actionLoading = false;

          const renewed =
            extractResource(
              action.payload
            );

          if (renewed) {
            state.tenancy =
              renewed;

            updateTenancyInList(
              state,
              renewed
            );
          }

          state.success =
            getResponseMessage(
              action.payload,
              "Tenancy renewed successfully."
            );

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
            action.error?.message ||
            "Failed to renew tenancy.";

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
          state.errorDetails = null;
          state.success = null;
        }
      )

      .addCase(
        assignUnit.fulfilled,
        (state, action) => {
          state.actionLoading = false;

          const assigned =
            extractResource(
              action.payload
            );

          if (assigned) {
            state.tenancy =
              assigned;

            updateTenancyInList(
              state,
              assigned
            );

            state.pagination.total += 1;
          }

          state.success =
            getResponseMessage(
              action.payload,
              "Unit assigned to tenant successfully."
            );

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
            action.error?.message ||
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
            extractResource(
              action.payload
            ) ||
            getApiPayload(
              action.payload
            )?.data ||
            null;

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
            action.error?.message ||
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
} =
  tenancySlice.actions;

/*
|--------------------------------------------------------------------------
| Selectors
|--------------------------------------------------------------------------
*/

/**
 * Tenancies.
 */
export const selectTenancies = (
  state
) => {
  const tenancies =
    state?.tenancy?.tenancies;

  return Array.isArray(tenancies)
    ? tenancies
    : EMPTY_ARRAY;
};

/**
 * Current tenancy.
 */
export const selectTenancy = (
  state
) =>
  state?.tenancy?.tenancy ??
  null;

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
  state?.tenancy?.error ??
  null;

/**
 * Error details.
 */
export const selectTenancyErrorDetails = (
  state
) =>
  state?.tenancy?.errorDetails ??
  null;

/**
 * Success.
 */
export const selectTenancySuccess = (
  state
) =>
  state?.tenancy?.success ??
  null;

/**
 * Statistics.
 */
export const selectTenancyStatistics = (
  state
) =>
  state?.tenancy?.statistics ??
  null;

/*
|--------------------------------------------------------------------------
| Derived Selectors
|--------------------------------------------------------------------------
*/

/**
 * Whether tenancies exist.
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
 * Loaded tenancy count.
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
 * Is creating.
 */
export const selectIsCreatingTenancy = (
  state
) =>
  Boolean(
    state?.tenancy?.creating
  );

/**
 * Is updating.
 */
export const selectIsUpdatingTenancy = (
  state
) =>
  Boolean(
    state?.tenancy?.updating
  );

/**
 * Is deleting.
 */
export const selectIsDeletingTenancy = (
  state
) =>
  Boolean(
    state?.tenancy?.deleting
  );

/**
 * Is restoring.
 */
export const selectIsRestoringTenancy = (
  state
) =>
  Boolean(
    state?.tenancy?.restoring
  );

/**
 * Is force deleting.
 */
export const selectIsForceDeletingTenancy = (
  state
) =>
  Boolean(
    state?.tenancy?.forceDeleting
  );

/**
 * Is any tenancy action loading.
 */
export const selectIsTenancyActionLoading = (
  state
) =>
  Boolean(
    state?.tenancy?.actionLoading
  );

/**
 * Is tenancy list loading.
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