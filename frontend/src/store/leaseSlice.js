import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import leaseService from "../services/lease.service";

/*
|--------------------------------------------------------------------------
| Initial State
|--------------------------------------------------------------------------
*/

const initialState = {
  /*
  |--------------------------------------------------------------------------
  | Collection
  |--------------------------------------------------------------------------
  */

  leases: [],

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
  | Pagination
  |--------------------------------------------------------------------------
  */

  pagination: {
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: null,
    to: null,
    has_more_pages: false,
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
 * Normalize rejected thunk errors.
 */
const getRejectPayload = (error, fallbackMessage) => {
  return {
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
  };
};

/**
 * Extract pagination information from Laravel responses.
 *
 * Supports common Laravel pagination structures:
 *
 * {
 *     data: [],
 *     current_page: 1,
 *     last_page: 5,
 *     per_page: 15,
 *     total: 75,
 *     from: 1,
 *     to: 15
 * }
 *
 * Or:
 *
 * {
 *     data: [],
 *     meta: {
 *         current_page: 1,
 *         ...
 *     }
 * }
 */
const normalizePagination = (data) => {
  const meta =
    data?.meta ||
    data?.pagination ||
    data ||
    {};

  return {
    current_page:
      Number(
        meta?.current_page ??
        1
      ),

    per_page:
      Number(
        meta?.per_page ??
        15
      ),

    total:
      Number(
        meta?.total ??
        0
      ),

    last_page:
      Number(
        meta?.last_page ??
        1
      ),

    from:
      meta?.from ??
      null,

    to:
      meta?.to ??
      null,

    has_more_pages:
      Boolean(
        meta?.has_more_pages ??
        (
          Number(
            meta?.current_page ??
            1
          ) <
          Number(
            meta?.last_page ??
            1
          )
        )
      ),
  };
};

/**
 * Extract collection from service response.
 */
const normalizeLeaseCollection = (result) => {
  const data = result?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

/**
 * Extract pagination from service response.
 */
const getPagination = (result) => {
  const data = result?.data;

  if (data?.meta) {
    return normalizePagination(data.meta);
  }

  if (
    data?.current_page !== undefined ||
    data?.last_page !== undefined
  ) {
    return normalizePagination(data);
  }

  if (result?.response?.data?.meta) {
    return normalizePagination(
      result.response.data.meta
    );
  }

  return {
    ...initialState.pagination,
  };
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

/**
 * Fetch leases.
 *
 * Supports:
 *
 * - pagination
 * - search
 * - status
 * - lease_type
 * - tenancy_id
 * - tenant_id
 * - property_id
 * - apartment_id
 * - unit_id
 * - payment_frequency
 * - date filters
 */
export const fetchLeases = createAsyncThunk(
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
| Fetch Single Lease
|--------------------------------------------------------------------------
*/

export const fetchLease = createAsyncThunk(
  "lease/fetchLease",

  async (
    leaseId,
    { rejectWithValue }
  ) => {
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

export const createLease = createAsyncThunk(
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

export const updateLease = createAsyncThunk(
  "lease/updateLease",

  async (
    { leaseId, payload },
    { rejectWithValue }
  ) => {
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

export const patchLease = createAsyncThunk(
  "lease/patchLease",

  async (
    { leaseId, payload },
    { rejectWithValue }
  ) => {
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

export const deleteLease = createAsyncThunk(
  "lease/deleteLease",

  async (
    leaseId,
    { rejectWithValue }
  ) => {
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

export const restoreLease = createAsyncThunk(
  "lease/restoreLease",

  async (
    leaseId,
    { rejectWithValue }
  ) => {
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

export const forceDeleteLease = createAsyncThunk(
  "lease/forceDeleteLease",

  async (
    leaseId,
    { rejectWithValue }
  ) => {
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

export const activateLease = createAsyncThunk(
  "lease/activateLease",

  async (
    leaseId,
    { rejectWithValue }
  ) => {
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

export const signLease = createAsyncThunk(
  "lease/signLease",

  async (
    { leaseId, payload = {} },
    { rejectWithValue }
  ) => {
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
| Terminate Lease
|--------------------------------------------------------------------------
*/

export const terminateLease = createAsyncThunk(
  "lease/terminateLease",

  async (
    { leaseId, payload = {} },
    { rejectWithValue }
  ) => {
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

export const cancelLease = createAsyncThunk(
  "lease/cancelLease",

  async (
    { leaseId, payload = {} },
    { rejectWithValue }
  ) => {
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
      { leaseId, formData },
      { rejectWithValue }
    ) => {
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

    clearLeaseError: (state) => {
      state.error = null;
      state.errors = null;
    },

    /*
    |--------------------------------------------------------------------------
    | Clear Current Lease
    |--------------------------------------------------------------------------
    */

    clearCurrentLease: (state) => {
      state.currentLease = null;
      state.selectedLease = null;
    },

    /*
    |--------------------------------------------------------------------------
    | Clear Message
    |--------------------------------------------------------------------------
    */

    clearLeaseMessage: (state) => {
      state.message = null;
      state.success = false;
    },

    /*
    |--------------------------------------------------------------------------
    | Set Selected Lease
    |--------------------------------------------------------------------------
    */

    setSelectedLease: (state, action) => {
      state.selectedLease =
        action.payload || null;
    },

    /*
    |--------------------------------------------------------------------------
    | Reset State
    |--------------------------------------------------------------------------
    */

    resetLeaseState: () => {
      return {
        ...initialState,
        pagination: {
          ...initialState.pagination,
        },
      };
    },
  },

  extraReducers: (builder) => {
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

          state.error = null;
          state.errors = null;
          state.success = false;
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

          state.message =
            action.payload?.message ||
            "Leases fetched successfully.";

          state.error = null;
          state.errors = null;
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
    | Fetch Single Lease
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchLease.pending,
        (state) => {
          state.loading = true;
          state.loadingDetails = true;

          state.error = null;
          state.errors = null;
        }
      )

      .addCase(
        fetchLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingDetails = false;

          state.currentLease =
            action.payload?.data ||
            null;

          state.selectedLease =
            action.payload?.data ||
            null;

          state.message =
            action.payload?.message ||
            "Lease fetched successfully.";

          state.error = null;
          state.errors = null;
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

          state.error = null;
          state.errors = null;
          state.success = false;
          state.message = null;
        }
      )

      .addCase(
        createLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingCreate = false;

          const createdLease =
            action.payload?.data ||
            null;

          if (createdLease) {
            state.currentLease =
              createdLease;

            state.selectedLease =
              createdLease;

            /*
             * Add to beginning of list.
             */
            if (
              Array.isArray(
                state.leases
              )
            ) {
              state.leases.unshift(
                createdLease
              );
            }
          }

          state.message =
            action.payload?.message ||
            "Lease created successfully.";

          state.success = true;
          state.error = null;
          state.errors = null;
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

          state.error = null;
          state.errors = null;
          state.success = false;
          state.message = null;
        }
      )

      .addCase(
        updateLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingUpdate = false;

          const updatedLease =
            action.payload?.data ||
            null;

          if (updatedLease) {
            state.currentLease =
              updatedLease;

            state.selectedLease =
              updatedLease;

            const index =
              state.leases.findIndex(
                (lease) =>
                  String(
                    lease?.id
                  ) ===
                  String(
                    updatedLease?.id
                  )
              );

            if (index !== -1) {
              state.leases[index] =
                updatedLease;
            }
          }

          state.message =
            action.payload?.message ||
            "Lease updated successfully.";

          state.success = true;
          state.error = null;
          state.errors = null;
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

          state.error = null;
          state.errors = null;
          state.success = false;
        }
      )

      .addCase(
        patchLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingUpdate = false;

          const updatedLease =
            action.payload?.data ||
            null;

          if (updatedLease) {
            state.currentLease =
              updatedLease;

            state.selectedLease =
              updatedLease;

            const index =
              state.leases.findIndex(
                (lease) =>
                  String(
                    lease?.id
                  ) ===
                  String(
                    updatedLease?.id
                  )
              );

            if (index !== -1) {
              state.leases[index] =
                updatedLease;
            }
          }

          state.message =
            action.payload?.message ||
            "Lease updated successfully.";

          state.success = true;
          state.error = null;
          state.errors = null;
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

          state.error = null;
          state.errors = null;
          state.success = false;
        }
      )

      .addCase(
        deleteLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingDelete = false;

          const leaseId =
            action.payload?.leaseId;

          state.leases =
            state.leases.filter(
              (lease) =>
                String(
                  lease?.id
                ) !==
                String(leaseId)
            );

          if (
            String(
              state.currentLease?.id
            ) === String(leaseId)
          ) {
            state.currentLease =
              null;
          }

          if (
            String(
              state.selectedLease?.id
            ) === String(leaseId)
          ) {
            state.selectedLease =
              null;
          }

          state.message =
            action.payload?.message ||
            "Lease deleted successfully.";

          state.success = true;
          state.error = null;
          state.errors = null;
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

          state.error = null;
          state.errors = null;
          state.success = false;
        }
      )

      .addCase(
        restoreLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingRestore = false;

          const restoredLease =
            action.payload?.data ||
            null;

          if (restoredLease) {
            const index =
              state.leases.findIndex(
                (lease) =>
                  String(
                    lease?.id
                  ) ===
                  String(
                    restoredLease?.id
                  )
              );

            if (index !== -1) {
              state.leases[index] =
                restoredLease;
            } else {
              state.leases.unshift(
                restoredLease
              );
            }

            state.currentLease =
              restoredLease;

            state.selectedLease =
              restoredLease;
          }

          state.message =
            action.payload?.message ||
            "Lease restored successfully.";

          state.success = true;
          state.error = null;
          state.errors = null;
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
    | Force Delete
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        forceDeleteLease.pending,
        (state) => {
          state.loading = true;
          state.loadingDelete = true;

          state.error = null;
          state.errors = null;
          state.success = false;
        }
      )

      .addCase(
        forceDeleteLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingDelete = false;

          const leaseId =
            action.payload?.leaseId;

          state.leases =
            state.leases.filter(
              (lease) =>
                String(
                  lease?.id
                ) !==
                String(leaseId)
            );

          if (
            String(
              state.currentLease?.id
            ) === String(leaseId)
          ) {
            state.currentLease =
              null;
          }

          if (
            String(
              state.selectedLease?.id
            ) === String(leaseId)
          ) {
            state.selectedLease =
              null;
          }

          state.message =
            action.payload?.message ||
            "Lease permanently deleted successfully.";

          state.success = true;
          state.error = null;
          state.errors = null;
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
    | Activate
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        activateLease.pending,
        (state) => {
          state.loading = true;
          state.loadingLifecycle = true;

          state.error = null;
          state.errors = null;
          state.success = false;
        }
      )

      .addCase(
        activateLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;

          const updatedLease =
            action.payload?.data ||
            null;

          if (updatedLease) {
            state.currentLease =
              updatedLease;

            state.selectedLease =
              updatedLease;

            const index =
              state.leases.findIndex(
                (lease) =>
                  String(
                    lease?.id
                  ) ===
                  String(
                    updatedLease?.id
                  )
              );

            if (index !== -1) {
              state.leases[index] =
                updatedLease;
            }
          }

          state.message =
            action.payload?.message ||
            "Lease activated successfully.";

          state.success = true;
          state.error = null;
          state.errors = null;
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
    | Sign
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        signLease.pending,
        (state) => {
          state.loading = true;
          state.loadingLifecycle = true;

          state.error = null;
          state.errors = null;
          state.success = false;
        }
      )

      .addCase(
        signLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;

          const updatedLease =
            action.payload?.data ||
            null;

          if (updatedLease) {
            state.currentLease =
              updatedLease;

            state.selectedLease =
              updatedLease;

            const index =
              state.leases.findIndex(
                (lease) =>
                  String(
                    lease?.id
                  ) ===
                  String(
                    updatedLease?.id
                  )
              );

            if (index !== -1) {
              state.leases[index] =
                updatedLease;
            }
          }

          state.message =
            action.payload?.message ||
            "Lease signed successfully.";

          state.success = true;
          state.error = null;
          state.errors = null;
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
    | Terminate
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        terminateLease.pending,
        (state) => {
          state.loading = true;
          state.loadingLifecycle = true;

          state.error = null;
          state.errors = null;
          state.success = false;
        }
      )

      .addCase(
        terminateLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;

          const updatedLease =
            action.payload?.data ||
            null;

          if (updatedLease) {
            state.currentLease =
              updatedLease;

            state.selectedLease =
              updatedLease;

            const index =
              state.leases.findIndex(
                (lease) =>
                  String(
                    lease?.id
                  ) ===
                  String(
                    updatedLease?.id
                  )
              );

            if (index !== -1) {
              state.leases[index] =
                updatedLease;
            }
          }

          state.message =
            action.payload?.message ||
            "Lease terminated successfully.";

          state.success = true;
          state.error = null;
          state.errors = null;
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
    | Cancel
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        cancelLease.pending,
        (state) => {
          state.loading = true;
          state.loadingLifecycle = true;

          state.error = null;
          state.errors = null;
          state.success = false;
        }
      )

      .addCase(
        cancelLease.fulfilled,
        (state, action) => {
          state.loading = false;
          state.loadingLifecycle = false;

          const updatedLease =
            action.payload?.data ||
            null;

          if (updatedLease) {
            state.currentLease =
              updatedLease;

            state.selectedLease =
              updatedLease;

            const index =
              state.leases.findIndex(
                (lease) =>
                  String(
                    lease?.id
                  ) ===
                  String(
                    updatedLease?.id
                  )
              );

            if (index !== -1) {
              state.leases[index] =
                updatedLease;
            }
          }

          state.message =
            action.payload?.message ||
            "Lease cancelled successfully.";

          state.success = true;
          state.error = null;
          state.errors = null;
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
    | Statistics
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        fetchLeaseStatistics.pending,
        (state) => {
          state.loadingStatistics = true;

          state.error = null;
          state.errors = null;
        }
      )

      .addCase(
        fetchLeaseStatistics.fulfilled,
        (state, action) => {
          state.loadingStatistics = false;

          state.statistics =
            action.payload?.data ||
            null;

          state.message =
            action.payload?.message ||
            "Lease statistics fetched successfully.";

          state.error = null;
          state.errors = null;
        }
      )

      .addCase(
        fetchLeaseStatistics.rejected,
        (state, action) => {
          state.loadingStatistics = false;

          state.error =
            action.payload?.message ||
            action.error?.message ||
            "Failed to fetch lease statistics.";

          state.errors =
            action.payload?.errors ||
            null;
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Upload Document
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        uploadLeaseDocument.pending,
        (state) => {
          state.loadingDocument = true;

          state.error = null;
          state.errors = null;
          state.success = false;
        }
      )

      .addCase(
        uploadLeaseDocument.fulfilled,
        (state, action) => {
          state.loadingDocument = false;

          const updatedLease =
            action.payload?.data ||
            null;

          if (updatedLease) {
            state.currentLease =
              updatedLease;

            state.selectedLease =
              updatedLease;

            const index =
              state.leases.findIndex(
                (lease) =>
                  String(
                    lease?.id
                  ) ===
                  String(
                    updatedLease?.id
                  )
              );

            if (index !== -1) {
              state.leases[index] =
                updatedLease;
            }
          }

          state.message =
            action.payload?.message ||
            "Lease document uploaded successfully.";

          state.success = true;
          state.error = null;
          state.errors = null;
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
    | Delete Document
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(
        deleteLeaseDocument.pending,
        (state) => {
          state.loadingDocument = true;

          state.error = null;
          state.errors = null;
          state.success = false;
        }
      )

      .addCase(
        deleteLeaseDocument.fulfilled,
        (state, action) => {
          state.loadingDocument = false;

          const updatedLease =
            action.payload?.data ||
            null;

          if (updatedLease) {
            state.currentLease =
              updatedLease;

            state.selectedLease =
              updatedLease;

            const index =
              state.leases.findIndex(
                (lease) =>
                  String(
                    lease?.id
                  ) ===
                  String(
                    updatedLease?.id
                  )
              );

            if (index !== -1) {
              state.leases[index] =
                updatedLease;
            }
          }

          state.message =
            action.payload?.message ||
            "Lease document deleted successfully.";

          state.success = true;
          state.error = null;
          state.errors = null;
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
  resetLeaseState,
} = leaseSlice.actions;

/*
|--------------------------------------------------------------------------
| Selectors
|--------------------------------------------------------------------------
*/

export const selectLeaseState = (state) =>
  state.lease;

export const selectLeases = (state) =>
  state.lease?.leases || [];

export const selectCurrentLease = (state) =>
  state.lease?.currentLease || null;

export const selectSelectedLease = (state) =>
  state.lease?.selectedLease || null;

export const selectLeaseStatistics = (state) =>
  state.lease?.statistics || null;

export const selectLeasePagination = (state) =>
  state.lease?.pagination || initialState.pagination;

export const selectLeaseLoading = (state) =>
  Boolean(state.lease?.loading);

export const selectLeaseListLoading = (state) =>
  Boolean(state.lease?.loadingList);

export const selectLeaseDetailsLoading = (state) =>
  Boolean(state.lease?.loadingDetails);

export const selectLeaseCreateLoading = (state) =>
  Boolean(state.lease?.loadingCreate);

export const selectLeaseUpdateLoading = (state) =>
  Boolean(state.lease?.loadingUpdate);

export const selectLeaseDeleteLoading = (state) =>
  Boolean(state.lease?.loadingDelete);

export const selectLeaseRestoreLoading = (state) =>
  Boolean(state.lease?.loadingRestore);

export const selectLeaseLifecycleLoading = (state) =>
  Boolean(state.lease?.loadingLifecycle);

export const selectLeaseStatisticsLoading = (state) =>
  Boolean(state.lease?.loadingStatistics);

export const selectLeaseDocumentLoading = (state) =>
  Boolean(state.lease?.loadingDocument);

export const selectLeaseError = (state) =>
  state.lease?.error || null;

export const selectLeaseErrors = (state) =>
  state.lease?.errors || null;

export const selectLeaseMessage = (state) =>
  state.lease?.message || null;

export const selectLeaseSuccess = (state) =>
  Boolean(state.lease?.success);

/*
|--------------------------------------------------------------------------
| Default Export
|--------------------------------------------------------------------------
*/

export default leaseSlice.reducer;