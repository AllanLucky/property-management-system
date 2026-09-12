import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import leaseService from "../services/lease.service";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_PER_PAGE = 15;

const DEFAULT_PAGINATION = {
  current_page: 1,
  per_page: DEFAULT_PER_PAGE,
  total: 0,
  last_page: 1,
  from: null,
  to: null,
  has_more_pages: false,
};

/*
|--------------------------------------------------------------------------
| Stable Selector Fallbacks
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Never use [] or {} directly inside selectors.
|
| Bad:
|   state.lease?.leases || []
|
| Every execution can create a new array reference.
|
| Good:
|   state.lease?.leases ?? EMPTY_LEASES
|
|--------------------------------------------------------------------------
*/

const EMPTY_LEASES = [];

const EMPTY_ERRORS = null;

const EMPTY_PAGINATION = DEFAULT_PAGINATION;

/*
|--------------------------------------------------------------------------
| Initial State
|--------------------------------------------------------------------------
*/

const initialState = {
  /*
  |--------------------------------------------------------------------------
  | Main Lease Collection
  |--------------------------------------------------------------------------
  */

  leases: [],

  /*
  |--------------------------------------------------------------------------
  | Expired Lease Collection
  |--------------------------------------------------------------------------
  |
  | Kept separate from the normal lease collection.
  |
  */

  expiredLeases: [],

  /*
  |--------------------------------------------------------------------------
  | Current Lease
  |--------------------------------------------------------------------------
  */

  currentLease: null,

  /*
  |--------------------------------------------------------------------------
  | Selected Lease
  |--------------------------------------------------------------------------
  */

  selectedLease: null,

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  statistics: null,

  /*
  |--------------------------------------------------------------------------
  | Main Pagination
  |--------------------------------------------------------------------------
  */

  pagination: {
    ...DEFAULT_PAGINATION,
  },

  /*
  |--------------------------------------------------------------------------
  | Expired Pagination
  |--------------------------------------------------------------------------
  */

  expiredPagination: {
    ...DEFAULT_PAGINATION,
  },

  /*
  |--------------------------------------------------------------------------
  | Loading States
  |--------------------------------------------------------------------------
  */

  loading: false,

  loadingList: false,

  loadingDetails: false,

  loadingCreate: false,

  loadingUpdate: false,

  loadingDelete: false,

  loadingRestore: false,

  loadingLifecycle: false,

  loadingStatistics: false,

  loadingDocument: false,

  /*
  | GET /leases/expired
  */

  loadingExpired: false,

  /*
  | POST /leases/expire-ended
  */

  loadingExpireEnded: false,

  /*
  | POST /leases/{id}/expire
  */

  loadingExpire: false,

  /*
  |--------------------------------------------------------------------------
  | Error State
  |--------------------------------------------------------------------------
  */

  error: null,

  errors: null,

  /*
  |--------------------------------------------------------------------------
  | Success / Message State
  |--------------------------------------------------------------------------
  */

  message: null,

  success: false,
};

/*
|--------------------------------------------------------------------------
| Helper Functions
|--------------------------------------------------------------------------
*/

/**
 * Safely normalize rejected thunk errors.
 */
const getRejectPayload = (
  error,
  fallbackMessage
) => ({
  message:
    error?.message ||
    fallbackMessage ||
    "An unexpected error occurred.",

  errors:
    error?.errors ||
    null,

  status:
    error?.status ||
    null,

  code:
    error?.code ||
    null,

  raw:
    error?.raw ||
    error ||
    null,
});

/**
 * Normalize Laravel pagination.
 */
const normalizePagination = (
  data
) => {
  const meta =
    data?.meta ||
    data?.pagination ||
    data ||
    {};

  const rawCurrentPage = Number(
    meta?.current_page ?? 1
  );

  const rawPerPage = Number(
    meta?.per_page ??
    DEFAULT_PER_PAGE
  );

  const rawTotal = Number(
    meta?.total ?? 0
  );

  const rawLastPage = Number(
    meta?.last_page ?? 1
  );

  const currentPage =
    Number.isFinite(rawCurrentPage) &&
      rawCurrentPage > 0
      ? rawCurrentPage
      : 1;

  const perPage =
    Number.isFinite(rawPerPage) &&
      rawPerPage > 0
      ? rawPerPage
      : DEFAULT_PER_PAGE;

  const total =
    Number.isFinite(rawTotal) &&
      rawTotal >= 0
      ? rawTotal
      : 0;

  const lastPage =
    Number.isFinite(rawLastPage) &&
      rawLastPage > 0
      ? rawLastPage
      : 1;

  return {
    current_page: currentPage,

    per_page: perPage,

    total,

    last_page: lastPage,

    from:
      meta?.from ?? null,

    to:
      meta?.to ?? null,

    has_more_pages:
      meta?.has_more_pages !==
        undefined
        ? Boolean(
          meta.has_more_pages
        )
        : currentPage < lastPage,
  };
};

/**
 * Normalize lease collection responses.
 *
 * Supports:
 *
 * [
 *   {...}
 * ]
 *
 * {
 *   data: [...]
 * }
 *
 * {
 *   data: {
 *     data: [...]
 *   }
 * }
 */
const normalizeLeaseCollection = (
  result
) => {
  if (Array.isArray(result)) {
    return result;
  }

  if (
    Array.isArray(
      result?.data
    )
  ) {
    return result.data;
  }

  if (
    Array.isArray(
      result?.data?.data
    )
  ) {
    return result.data.data;
  }

  if (
    Array.isArray(
      result?.leases
    )
  ) {
    return result.leases;
  }

  return [];
};

/**
 * Extract pagination information.
 */
const getPagination = (
  result
) => {
  const data =
    result?.data;

  if (data?.meta) {
    return normalizePagination(
      data
    );
  }

  if (
    data?.current_page !==
    undefined ||
    data?.last_page !==
    undefined
  ) {
    return normalizePagination(
      data
    );
  }

  if (
    result?.meta
  ) {
    return normalizePagination(
      result
    );
  }

  if (
    result?.current_page !==
    undefined ||
    result?.last_page !==
    undefined
  ) {
    return normalizePagination(
      result
    );
  }

  if (
    result?.response?.data?.meta
  ) {
    return normalizePagination(
      result.response.data
    );
  }

  return {
    ...DEFAULT_PAGINATION,
  };
};

/**
 * Extract a lease from a mutation response.
 */
const getLeaseFromResponse = (
  payload
) => {
  if (!payload) {
    return null;
  }

  if (
    payload?.data &&
    !Array.isArray(
      payload.data
    ) &&
    payload.data?.id
  ) {
    return payload.data;
  }

  if (
    payload?.lease?.id
  ) {
    return payload.lease;
  }

  if (
    payload?.result?.data?.id
  ) {
    return payload.result.data;
  }

  if (
    payload?.result?.lease?.id
  ) {
    return payload.result.lease;
  }

  if (
    payload?.id
  ) {
    return payload;
  }

  return null;
};

/**
 * Normalize lease status.
 */
const getLeaseStatus = (
  lease
) =>
  String(
    lease?.status ?? ""
  )
    .trim()
    .toLowerCase();

/**
 * Determine whether a lease is expired.
 */
const isExpiredLease = (
  lease
) =>
  getLeaseStatus(
    lease
  ) === "expired";

/**
 * Find lease in normal collection.
 */
const findLeaseIndex = (
  state,
  leaseId
) =>
  state.leases.findIndex(
    (lease) =>
      String(
        lease?.id
      ) ===
      String(leaseId)
  );

/**
 * Find lease in expired collection.
 */
const findExpiredLeaseIndex = (
  state,
  leaseId
) =>
  state.expiredLeases.findIndex(
    (lease) =>
      String(
        lease?.id
      ) ===
      String(leaseId)
  );

/**
 * Insert/update normal lease.
 */
const upsertLease = (
  state,
  lease
) => {
  if (!lease?.id) {
    return;
  }

  const index =
    findLeaseIndex(
      state,
      lease.id
    );

  if (index === -1) {
    state.leases.unshift(
      lease
    );

    return;
  }

  state.leases[index] =
    lease;
};

/**
 * Insert/update expired lease.
 */
const upsertExpiredLease = (
  state,
  lease
) => {
  if (!lease?.id) {
    return;
  }

  const index =
    findExpiredLeaseIndex(
      state,
      lease.id
    );

  if (index === -1) {
    state.expiredLeases.unshift(
      lease
    );

    return;
  }

  state.expiredLeases[index] =
    lease;
};

/**
 * Remove normal lease.
 */
const removeLease = (
  state,
  leaseId
) => {
  state.leases =
    state.leases.filter(
      (lease) =>
        String(
          lease?.id
        ) !==
        String(leaseId)
    );
};

/**
 * Remove expired lease.
 */
const removeExpiredLease = (
  state,
  leaseId
) => {
  state.expiredLeases =
    state.expiredLeases.filter(
      (lease) =>
        String(
          lease?.id
        ) !==
        String(leaseId)
    );
};

/**
 * Remove lease everywhere.
 */
const removeLeaseEverywhere = (
  state,
  leaseId
) => {
  removeLease(
    state,
    leaseId
  );

  removeExpiredLease(
    state,
    leaseId
  );
};

/**
 * Update current and selected lease.
 */
const updateSelectedLease = (
  state,
  lease
) => {
  if (!lease) {
    return;
  }

  state.currentLease =
    lease;

  state.selectedLease =
    lease;
};

/**
 * Clear errors.
 */
const clearErrors = (
  state
) => {
  state.error = null;
  state.errors = null;
};

/**
 * Mark operation successful.
 */
const markSuccess = (
  state,
  message
) => {
  state.success = true;

  state.message =
    message || null;

  clearErrors(state);
};

/**
 * Clear operation state.
 */
const resetOperationState = (
  state
) => {
  state.success = false;
  state.message = null;

  clearErrors(state);
};

/*
|--------------------------------------------------------------------------
| Async Thunks
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Fetch Leases
|--------------------------------------------------------------------------
*/

export const fetchLeases =
  createAsyncThunk(
    "lease/fetchLeases",

    async (
      params = {},
      { rejectWithValue }
    ) => {
      try {
        return await leaseService.getLeases(
          params
        );
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to fetch leases."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Fetch Expired Leases
|--------------------------------------------------------------------------
*/

export const fetchExpiredLeases =
  createAsyncThunk(
    "lease/fetchExpiredLeases",

    async (
      params = {},
      { rejectWithValue }
    ) => {
      try {
        return await leaseService.getExpiredLeases(
          params
        );
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to fetch expired leases."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Fetch Single Lease
|--------------------------------------------------------------------------
*/

export const fetchLease =
  createAsyncThunk(
    "lease/fetchLease",

    async (
      leaseId,
      { rejectWithValue }
    ) => {
      if (!leaseId) {
        return rejectWithValue({
          message:
            "Lease ID is required.",
        });
      }

      try {
        return await leaseService.getLease(
          leaseId
        );
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to fetch lease."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Create Lease
|--------------------------------------------------------------------------
*/

export const createLease =
  createAsyncThunk(
    "lease/createLease",

    async (
      payload,
      { rejectWithValue }
    ) => {
      try {
        return await leaseService.createLease(
          payload
        );
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to create lease."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Update Lease
|--------------------------------------------------------------------------
*/

export const updateLease =
  createAsyncThunk(
    "lease/updateLease",

    async (
      {
        leaseId,
        payload,
      },
      { rejectWithValue }
    ) => {
      if (!leaseId) {
        return rejectWithValue({
          message:
            "Lease ID is required.",
        });
      }

      try {
        return await leaseService.updateLease(
          leaseId,
          payload
        );
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to update lease."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Patch Lease
|--------------------------------------------------------------------------
*/

export const patchLease =
  createAsyncThunk(
    "lease/patchLease",

    async (
      {
        leaseId,
        payload,
      },
      { rejectWithValue }
    ) => {
      if (!leaseId) {
        return rejectWithValue({
          message:
            "Lease ID is required.",
        });
      }

      try {
        return await leaseService.patchLease(
          leaseId,
          payload
        );
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to update lease."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Delete Lease
|--------------------------------------------------------------------------
*/

export const deleteLease =
  createAsyncThunk(
    "lease/deleteLease",

    async (
      leaseId,
      { rejectWithValue }
    ) => {
      if (!leaseId) {
        return rejectWithValue({
          message:
            "Lease ID is required.",
        });
      }

      try {
        const result =
          await leaseService.deleteLease(
            leaseId
          );

        return {
          leaseId,
          ...result,
        };
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to delete lease."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Restore Lease
|--------------------------------------------------------------------------
*/

export const restoreLease =
  createAsyncThunk(
    "lease/restoreLease",

    async (
      leaseId,
      { rejectWithValue }
    ) => {
      if (!leaseId) {
        return rejectWithValue({
          message:
            "Lease ID is required.",
        });
      }

      try {
        const result =
          await leaseService.restoreLease(
            leaseId
          );

        return {
          leaseId,
          ...result,
        };
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to restore lease."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Force Delete Lease
|--------------------------------------------------------------------------
*/

export const forceDeleteLease =
  createAsyncThunk(
    "lease/forceDeleteLease",

    async (
      leaseId,
      { rejectWithValue }
    ) => {
      if (!leaseId) {
        return rejectWithValue({
          message:
            "Lease ID is required.",
        });
      }

      try {
        const result =
          await leaseService.forceDeleteLease(
            leaseId
          );

        return {
          leaseId,
          ...result,
        };
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to permanently delete lease."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Activate Lease
|--------------------------------------------------------------------------
*/

export const activateLease =
  createAsyncThunk(
    "lease/activateLease",

    async (
      leaseId,
      { rejectWithValue }
    ) => {
      if (!leaseId) {
        return rejectWithValue({
          message:
            "Lease ID is required.",
        });
      }

      try {
        const result =
          await leaseService.activateLease(
            leaseId
          );

        return {
          leaseId,
          ...result,
        };
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to activate lease."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Sign Lease
|--------------------------------------------------------------------------
*/

export const signLease =
  createAsyncThunk(
    "lease/signLease",

    async (
      {
        leaseId,
        payload = {},
      },
      { rejectWithValue }
    ) => {
      if (!leaseId) {
        return rejectWithValue({
          message:
            "Lease ID is required.",
        });
      }

      try {
        const result =
          await leaseService.signLease(
            leaseId,
            payload
          );

        return {
          leaseId,
          ...result,
        };
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to sign lease."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Expire Single Lease
|--------------------------------------------------------------------------
*/

export const expireLease =
  createAsyncThunk(
    "lease/expireLease",

    async (
      leaseId,
      { rejectWithValue }
    ) => {
      if (!leaseId) {
        return rejectWithValue({
          message:
            "Lease ID is required.",
        });
      }

      try {
        const result =
          await leaseService.expireLease(
            leaseId
          );

        return {
          leaseId,
          ...result,
        };
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to expire lease."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Expire Ended Leases
|--------------------------------------------------------------------------
*/

export const expireEndedLeases =
  createAsyncThunk(
    "lease/expireEndedLeases",

    async (
      _payload,
      { rejectWithValue }
    ) => {
      try {
        return await leaseService.expireEndedLeases();
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to expire ended leases."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Terminate Lease
|--------------------------------------------------------------------------
*/

export const terminateLease =
  createAsyncThunk(
    "lease/terminateLease",

    async (
      {
        leaseId,
        payload = {},
      },
      { rejectWithValue }
    ) => {
      if (!leaseId) {
        return rejectWithValue({
          message:
            "Lease ID is required.",
        });
      }

      try {
        const result =
          await leaseService.terminateLease(
            leaseId,
            payload
          );

        return {
          leaseId,
          ...result,
        };
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to terminate lease."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Cancel Lease
|--------------------------------------------------------------------------
*/

export const cancelLease =
  createAsyncThunk(
    "lease/cancelLease",

    async (
      {
        leaseId,
        payload = {},
      },
      { rejectWithValue }
    ) => {
      if (!leaseId) {
        return rejectWithValue({
          message:
            "Lease ID is required.",
        });
      }

      try {
        const result =
          await leaseService.cancelLease(
            leaseId,
            payload
          );

        return {
          leaseId,
          ...result,
        };
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to cancel lease."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Fetch Lease Statistics
|--------------------------------------------------------------------------
*/

export const fetchLeaseStatistics =
  createAsyncThunk(
    "lease/fetchLeaseStatistics",

    async (
      params = {},
      { rejectWithValue }
    ) => {
      try {
        return await leaseService.getLeaseStatistics(
          params
        );
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to fetch lease statistics."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Upload Lease Document
|--------------------------------------------------------------------------
*/

export const uploadLeaseDocument =
  createAsyncThunk(
    "lease/uploadLeaseDocument",

    async (
      {
        leaseId,
        formData,
      },
      { rejectWithValue }
    ) => {
      if (!leaseId) {
        return rejectWithValue({
          message:
            "Lease ID is required.",
        });
      }

      try {
        const result =
          await leaseService.uploadLeaseDocument(
            leaseId,
            formData
          );

        return {
          leaseId,
          ...result,
        };
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to upload lease document."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Delete Lease Document
|--------------------------------------------------------------------------
*/

export const deleteLeaseDocument =
  createAsyncThunk(
    "lease/deleteLeaseDocument",

    async (
      leaseId,
      { rejectWithValue }
    ) => {
      if (!leaseId) {
        return rejectWithValue({
          message:
            "Lease ID is required.",
        });
      }

      try {
        const result =
          await leaseService.deleteLeaseDocument(
            leaseId
          );

        return {
          leaseId,
          ...result,
        };
      } catch (error) {
        return rejectWithValue(
          getRejectPayload(
            error,
            "Failed to delete lease document."
          )
        );
      }
    }
  );

/*
|--------------------------------------------------------------------------
| Slice
|--------------------------------------------------------------------------
*/

const leaseSlice = createSlice({
  name: "lease",

  initialState,

  reducers: {
    /*
    |--------------------------------------------------------------------------
    | Clear Error
    |--------------------------------------------------------------------------
    */

    clearLeaseError: (
      state
    ) => {
      state.error = null;
      state.errors = null;
    },

    /*
    |--------------------------------------------------------------------------
    | Clear Current Lease
    |--------------------------------------------------------------------------
    */

    clearCurrentLease: (
      state
    ) => {
      state.currentLease = null;
      state.selectedLease = null;
    },

    /*
    |--------------------------------------------------------------------------
    | Clear Message
    |--------------------------------------------------------------------------
    */

    clearLeaseMessage: (
      state
    ) => {
      state.message = null;
      state.success = false;
    },

    /*
    |--------------------------------------------------------------------------
    | Set Selected Lease
    |--------------------------------------------------------------------------
    */

    setSelectedLease: (
      state,
      action
    ) => {
      state.selectedLease =
        action.payload || null;
    },

    /*
    |--------------------------------------------------------------------------
    | Clear Expired Leases
    |--------------------------------------------------------------------------
    */

    clearExpiredLeases: (
      state
    ) => {
      state.expiredLeases = [];

      state.expiredPagination = {
        ...DEFAULT_PAGINATION,
      };
    },

    /*
    |--------------------------------------------------------------------------
    | Reset Lease State
    |--------------------------------------------------------------------------
    */

    resetLeaseState: () => ({
      ...initialState,

      leases: [],

      expiredLeases: [],

      pagination: {
        ...DEFAULT_PAGINATION,
      },

      expiredPagination: {
        ...DEFAULT_PAGINATION,
      },
    }),
  },

  extraReducers: (
    builder
  ) => {
    /*
    |--------------------------------------------------------------------------
    | Fetch Leases
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchLeases.pending,
        (state) => {
          state.loading = true;
          state.loadingList = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        fetchLeases.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingList = false;

          state.leases =
            normalizeLeaseCollection(
              action.payload
            );

          state.pagination =
            getPagination(
              action.payload
            );

          markSuccess(
            state,
            action.payload?.message ||
            "Leases fetched successfully."
          );
        }
      )

      .addCase(
        fetchLeases.rejected,
        (state, action) => {
          state.loading = false;
          state.loadingList = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to fetch leases.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Fetch Expired Leases
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchExpiredLeases.pending,
        (state) => {
          state.loadingExpired = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        fetchExpiredLeases.fulfilled,
        (state, action) => {
          state.loadingExpired = false;

          /*
           * Keep expired leases isolated.
           */
          state.expiredLeases =
            normalizeLeaseCollection(
              action.payload
            );

          state.expiredPagination =
            getPagination(
              action.payload
            );

          markSuccess(
            state,
            action.payload?.message ||
            "Expired leases fetched successfully."
          );
        }
      )

      .addCase(
        fetchExpiredLeases.rejected,
        (state, action) => {
          state.loadingExpired = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to fetch expired leases.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Fetch Single Lease
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchLease.pending,
        (state) => {
          state.loading = true;
          state.loadingDetails = true;

          clearErrors(state);

          state.success = false;
        }
      )

      .addCase(
        fetchLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingDetails = false;

          const lease =
            getLeaseFromResponse(
              action.payload
            );

          state.currentLease =
            lease;

          state.selectedLease =
            lease;

          if (lease) {
            upsertLease(
              state,
              lease
            );

            if (
              isExpiredLease(
                lease
              )
            ) {
              upsertExpiredLease(
                state,
                lease
              );
            } else {
              removeExpiredLease(
                state,
                lease.id
              );
            }
          }

          markSuccess(
            state,
            action.payload?.message ||
            "Lease fetched successfully."
          );
        }
      )

      .addCase(
        fetchLease.rejected,
        (state, action) => {
          state.loading = false;
          state.loadingDetails = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to fetch lease.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Create Lease
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        createLease.pending,
        (state) => {
          state.loading = true;
          state.loadingCreate = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        createLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingCreate = false;

          const lease =
            getLeaseFromResponse(
              action.payload
            );

          if (lease) {
            updateSelectedLease(
              state,
              lease
            );

            upsertLease(
              state,
              lease
            );

            if (
              isExpiredLease(
                lease
              )
            ) {
              upsertExpiredLease(
                state,
                lease
              );
            }
          }

          markSuccess(
            state,
            action.payload?.message ||
            "Lease created successfully."
          );
        }
      )

      .addCase(
        createLease.rejected,
        (state, action) => {
          state.loading = false;
          state.loadingCreate = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to create lease.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Update Lease
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        updateLease.pending,
        (state) => {
          state.loading = true;
          state.loadingUpdate = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        updateLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingUpdate = false;

          const lease =
            getLeaseFromResponse(
              action.payload
            );

          if (lease) {
            updateSelectedLease(
              state,
              lease
            );

            upsertLease(
              state,
              lease
            );

            if (
              isExpiredLease(
                lease
              )
            ) {
              upsertExpiredLease(
                state,
                lease
              );
            } else {
              removeExpiredLease(
                state,
                lease.id
              );
            }
          }

          markSuccess(
            state,
            action.payload?.message ||
            "Lease updated successfully."
          );
        }
      )

      .addCase(
        updateLease.rejected,
        (state, action) => {
          state.loading = false;
          state.loadingUpdate = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to update lease.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Patch Lease
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        patchLease.pending,
        (state) => {
          state.loading = true;
          state.loadingUpdate = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        patchLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingUpdate = false;

          const lease =
            getLeaseFromResponse(
              action.payload
            );

          if (lease) {
            updateSelectedLease(
              state,
              lease
            );

            upsertLease(
              state,
              lease
            );

            if (
              isExpiredLease(
                lease
              )
            ) {
              upsertExpiredLease(
                state,
                lease
              );
            } else {
              removeExpiredLease(
                state,
                lease.id
              );
            }
          }

          markSuccess(
            state,
            action.payload?.message ||
            "Lease updated successfully."
          );
        }
      )

      .addCase(
        patchLease.rejected,
        (state, action) => {
          state.loading = false;
          state.loadingUpdate = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to update lease.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Delete Lease
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        deleteLease.pending,
        (state) => {
          state.loading = true;
          state.loadingDelete = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        deleteLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingDelete = false;

          const leaseId =
            action.payload?.leaseId;

          removeLeaseEverywhere(
            state,
            leaseId
          );

          if (
            String(
              state.currentLease?.id
            ) ===
            String(leaseId)
          ) {
            state.currentLease =
              null;
          }

          if (
            String(
              state.selectedLease?.id
            ) ===
            String(leaseId)
          ) {
            state.selectedLease =
              null;
          }

          markSuccess(
            state,
            action.payload?.message ||
            "Lease deleted successfully."
          );
        }
      )

      .addCase(
        deleteLease.rejected,
        (state, action) => {
          state.loading = false;
          state.loadingDelete = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to delete lease.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Restore Lease
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        restoreLease.pending,
        (state) => {
          state.loading = true;
          state.loadingRestore = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        restoreLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingRestore = false;

          const leaseId =
            action.payload?.leaseId;

          const lease =
            getLeaseFromResponse(
              action.payload
            );

          removeExpiredLease(
            state,
            leaseId
          );

          if (lease) {
            updateSelectedLease(
              state,
              lease
            );

            upsertLease(
              state,
              lease
            );

            if (
              isExpiredLease(
                lease
              )
            ) {
              upsertExpiredLease(
                state,
                lease
              );
            }
          }

          markSuccess(
            state,
            action.payload?.message ||
            "Lease restored successfully."
          );
        }
      )

      .addCase(
        restoreLease.rejected,
        (state, action) => {
          state.loading = false;
          state.loadingRestore = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to restore lease.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Force Delete Lease
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        forceDeleteLease.pending,
        (state) => {
          state.loading = true;
          state.loadingDelete = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        forceDeleteLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingDelete = false;

          const leaseId =
            action.payload?.leaseId;

          removeLeaseEverywhere(
            state,
            leaseId
          );

          if (
            String(
              state.currentLease?.id
            ) ===
            String(leaseId)
          ) {
            state.currentLease =
              null;
          }

          if (
            String(
              state.selectedLease?.id
            ) ===
            String(leaseId)
          ) {
            state.selectedLease =
              null;
          }

          markSuccess(
            state,
            action.payload?.message ||
            "Lease permanently deleted successfully."
          );
        }
      )

      .addCase(
        forceDeleteLease.rejected,
        (state, action) => {
          state.loading = false;
          state.loadingDelete = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to permanently delete lease.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Activate Lease
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        activateLease.pending,
        (state) => {
          state.loading = true;
          state.loadingLifecycle = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        activateLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;

          const lease =
            getLeaseFromResponse(
              action.payload
            );

          if (lease) {
            updateSelectedLease(
              state,
              lease
            );

            upsertLease(
              state,
              lease
            );

            if (
              isExpiredLease(
                lease
              )
            ) {
              upsertExpiredLease(
                state,
                lease
              );
            } else {
              removeExpiredLease(
                state,
                lease.id
              );
            }
          }

          markSuccess(
            state,
            action.payload?.message ||
            "Lease activated successfully."
          );
        }
      )

      .addCase(
        activateLease.rejected,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to activate lease.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Sign Lease
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        signLease.pending,
        (state) => {
          state.loading = true;
          state.loadingLifecycle = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        signLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;

          const lease =
            getLeaseFromResponse(
              action.payload
            );

          if (lease) {
            updateSelectedLease(
              state,
              lease
            );

            upsertLease(
              state,
              lease
            );

            if (
              isExpiredLease(
                lease
              )
            ) {
              upsertExpiredLease(
                state,
                lease
              );
            } else {
              removeExpiredLease(
                state,
                lease.id
              );
            }
          }

          markSuccess(
            state,
            action.payload?.message ||
            "Lease signed successfully."
          );
        }
      )

      .addCase(
        signLease.rejected,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to sign lease.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Expire Single Lease
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        expireLease.pending,
        (state) => {
          state.loading = true;
          state.loadingLifecycle = true;
          state.loadingExpire = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        expireLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;
          state.loadingExpire = false;

          const lease =
            getLeaseFromResponse(
              action.payload
            );

          if (lease) {
            updateSelectedLease(
              state,
              lease
            );

            upsertLease(
              state,
              lease
            );

            if (
              isExpiredLease(
                lease
              )
            ) {
              upsertExpiredLease(
                state,
                lease
              );
            } else {
              removeExpiredLease(
                state,
                lease.id
              );
            }
          }

          markSuccess(
            state,
            action.payload?.message ||
            "Lease expired successfully."
          );
        }
      )

      .addCase(
        expireLease.rejected,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;
          state.loadingExpire = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to expire lease.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Expire Ended Leases
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        expireEndedLeases.pending,
        (state) => {
          state.loading = true;
          state.loadingLifecycle = true;
          state.loadingExpireEnded = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        expireEndedLeases.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;
          state.loadingExpireEnded = false;

          markSuccess(
            state,
            action.payload?.message ||
            "Ended leases processed successfully."
          );
        }
      )

      .addCase(
        expireEndedLeases.rejected,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;
          state.loadingExpireEnded = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to expire ended leases.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Terminate Lease
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        terminateLease.pending,
        (state) => {
          state.loading = true;
          state.loadingLifecycle = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        terminateLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;

          const lease =
            getLeaseFromResponse(
              action.payload
            );

          if (lease) {
            updateSelectedLease(
              state,
              lease
            );

            upsertLease(
              state,
              lease
            );

            /*
             * A terminated lease should no
             * longer appear in expired list.
             */
            removeExpiredLease(
              state,
              lease.id
            );
          }

          markSuccess(
            state,
            action.payload?.message ||
            "Lease terminated successfully."
          );
        }
      )

      .addCase(
        terminateLease.rejected,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to terminate lease.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Cancel Lease
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        cancelLease.pending,
        (state) => {
          state.loading = true;
          state.loadingLifecycle = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        cancelLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;

          const lease =
            getLeaseFromResponse(
              action.payload
            );

          if (lease) {
            updateSelectedLease(
              state,
              lease
            );

            upsertLease(
              state,
              lease
            );

            removeExpiredLease(
              state,
              lease.id
            );
          }

          markSuccess(
            state,
            action.payload?.message ||
            "Lease cancelled successfully."
          );
        }
      )

      .addCase(
        cancelLease.rejected,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to cancel lease.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Fetch Statistics
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchLeaseStatistics.pending,
        (state) => {
          state.loadingStatistics =
            true;

          clearErrors(state);

          state.success = false;
        }
      )

      .addCase(
        fetchLeaseStatistics.fulfilled,
        (state, action) => {
          state.loadingStatistics =
            false;

          state.statistics =
            action.payload?.data ??
            action.payload?.statistics ??
            null;

          markSuccess(
            state,
            action.payload?.message ||
            "Lease statistics fetched successfully."
          );
        }
      )

      .addCase(
        fetchLeaseStatistics.rejected,
        (state, action) => {
          state.loadingStatistics =
            false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to fetch lease statistics.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Upload Lease Document
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        uploadLeaseDocument.pending,
        (state) => {
          state.loadingDocument = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        uploadLeaseDocument.fulfilled,
        (state, action) => {
          state.loadingDocument = false;

          const lease =
            getLeaseFromResponse(
              action.payload
            );

          if (lease) {
            updateSelectedLease(
              state,
              lease
            );

            upsertLease(
              state,
              lease
            );

            if (
              isExpiredLease(
                lease
              )
            ) {
              upsertExpiredLease(
                state,
                lease
              );
            } else {
              removeExpiredLease(
                state,
                lease.id
              );
            }
          }

          markSuccess(
            state,
            action.payload?.message ||
            "Lease document uploaded successfully."
          );
        }
      )

      .addCase(
        uploadLeaseDocument.rejected,
        (state, action) => {
          state.loadingDocument = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to upload lease document.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Delete Lease Document
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        deleteLeaseDocument.pending,
        (state) => {
          state.loadingDocument = true;

          resetOperationState(
            state
          );
        }
      )

      .addCase(
        deleteLeaseDocument.fulfilled,
        (state, action) => {
          state.loadingDocument = false;

          const lease =
            getLeaseFromResponse(
              action.payload
            );

          if (lease) {
            updateSelectedLease(
              state,
              lease
            );

            upsertLease(
              state,
              lease
            );

            if (
              isExpiredLease(
                lease
              )
            ) {
              upsertExpiredLease(
                state,
                lease
              );
            } else {
              removeExpiredLease(
                state,
                lease.id
              );
            }
          }

          markSuccess(
            state,
            action.payload?.message ||
            "Lease document deleted successfully."
          );
        }
      )

      .addCase(
        deleteLeaseDocument.rejected,
        (state, action) => {
          state.loadingDocument = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to delete lease document.";

          state.errors =
            action.payload?.errors ||
            null;

          state.success = false;
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
  clearLeaseError,
  clearCurrentLease,
  clearLeaseMessage,
  setSelectedLease,
  clearExpiredLeases,
  resetLeaseState,
} =
  leaseSlice.actions;

/*
|--------------------------------------------------------------------------
| Selectors
|--------------------------------------------------------------------------
|
| IMPORTANT:
| These selectors NEVER create [] or {} during execution.
|
|--------------------------------------------------------------------------
*/

/**
 * Complete lease state.
 */
export const selectLeaseState = (
  state
) =>
  state?.lease ??
  initialState;

/*
|--------------------------------------------------------------------------
| Main Lease Selectors
|--------------------------------------------------------------------------
*/

/**
 * All leases.
 *
 * Stable fallback.
 */
export const selectLeases = (
  state
) => {
  const leases =
    state?.lease?.leases;

  return Array.isArray(
    leases
  )
    ? leases
    : EMPTY_LEASES;
};

/**
 * Current lease.
 */
export const selectCurrentLease = (
  state
) =>
  state?.lease?.currentLease ??
  null;

/**
 * Selected lease.
 */
export const selectSelectedLease = (
  state
) =>
  state?.lease?.selectedLease ??
  null;

/**
 * Lease statistics.
 */
export const selectLeaseStatistics = (
  state
) =>
  state?.lease?.statistics ??
  null;

/**
 * Main pagination.
 *
 * Stable fallback.
 */
export const selectLeasePagination = (
  state
) =>
  state?.lease?.pagination ??
  EMPTY_PAGINATION;

/*
|--------------------------------------------------------------------------
| Expired Lease Selectors
|--------------------------------------------------------------------------
*/

/**
 * Expired leases.
 *
 * Stable fallback.
 */
export const selectExpiredLeases = (
  state
) => {
  const leases =
    state?.lease?.expiredLeases;

  return Array.isArray(
    leases
  )
    ? leases
    : EMPTY_LEASES;
};

/**
 * Expired lease pagination.
 */
export const selectExpiredLeasePagination = (
  state
) =>
  state?.lease?.expiredPagination ??
  EMPTY_PAGINATION;

/*
|--------------------------------------------------------------------------
| Loading Selectors
|--------------------------------------------------------------------------
*/

export const selectLeaseLoading = (
  state
) =>
  Boolean(
    state?.lease?.loading
  );

export const selectLeaseListLoading = (
  state
) =>
  Boolean(
    state?.lease?.loadingList
  );

export const selectLeaseDetailsLoading = (
  state
) =>
  Boolean(
    state?.lease?.loadingDetails
  );

export const selectLeaseCreateLoading = (
  state
) =>
  Boolean(
    state?.lease?.loadingCreate
  );

export const selectLeaseUpdateLoading = (
  state
) =>
  Boolean(
    state?.lease?.loadingUpdate
  );

export const selectLeaseDeleteLoading = (
  state
) =>
  Boolean(
    state?.lease?.loadingDelete
  );

export const selectLeaseRestoreLoading = (
  state
) =>
  Boolean(
    state?.lease?.loadingRestore
  );

export const selectLeaseLifecycleLoading = (
  state
) =>
  Boolean(
    state?.lease?.loadingLifecycle
  );

/*
|--------------------------------------------------------------------------
| Expiration Loading Selectors
|--------------------------------------------------------------------------
*/

export const selectLeaseExpiredLoading = (
  state
) =>
  Boolean(
    state?.lease?.loadingExpired
  );

export const selectLeaseExpireLoading = (
  state
) =>
  Boolean(
    state?.lease?.loadingExpire
  );

export const selectLeaseExpireEndedLoading = (
  state
) =>
  Boolean(
    state?.lease?.loadingExpireEnded
  );

/*
|--------------------------------------------------------------------------
| Statistics / Document Loading
|--------------------------------------------------------------------------
*/

export const selectLeaseStatisticsLoading = (
  state
) =>
  Boolean(
    state?.lease?.loadingStatistics
  );

export const selectLeaseDocumentLoading = (
  state
) =>
  Boolean(
    state?.lease?.loadingDocument
  );

/*
|--------------------------------------------------------------------------
| Error Selectors
|--------------------------------------------------------------------------
*/

export const selectLeaseError = (
  state
) =>
  state?.lease?.error ??
  null;

export const selectLeaseErrors = (
  state
) =>
  state?.lease?.errors ??
  EMPTY_ERRORS;

/*
|--------------------------------------------------------------------------
| Message / Success Selectors
|--------------------------------------------------------------------------
*/

export const selectLeaseMessage = (
  state
) =>
  state?.lease?.message ??
  null;

export const selectLeaseSuccess = (
  state
) =>
  Boolean(
    state?.lease?.success
  );

/*
|--------------------------------------------------------------------------
| Default Export
|--------------------------------------------------------------------------
*/

export default leaseSlice.reducer;