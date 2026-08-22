import api from "./axios";

/*
|--------------------------------------------------------------------------
| TENANT API
|--------------------------------------------------------------------------
|
| All tenant-related HTTP requests are kept in this file.
|
| Normal delete:
|   DELETE /api/tenants/{tenantId}
|
| Restore:
|   PATCH /api/tenants/{tenantId}/restore
|
| Permanent delete:
|   DELETE /api/tenants/{tenantId}/force
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| RESPONSE ERROR HANDLER
|--------------------------------------------------------------------------
*/

/**
 * Preserve the useful Laravel error response.
 *
 * This allows the service/redux layer to receive:
 *
 * {
 *   message,
 *   code,
 *   errors,
 *   response
 * }
 *
 * instead of losing the actual backend error.
 */
const handleApiError = (error) => {
  const response = error?.response;
  const responseData = response?.data;

  const message =
    responseData?.message ||
    responseData?.error ||
    error?.message ||
    "Something went wrong.";

  console.error(
    "[Tenant API Error]",
    {
      message,
      status: response?.status,
      code: responseData?.code,
      errors: responseData?.errors,
      response: responseData,
    }
  );

  /*
   * Preserve the Axios error so normalizeError()
   * in the service layer can still access response.data.
   */
  throw error;
};


/*
|--------------------------------------------------------------------------
| VALIDATE TENANT ID
|--------------------------------------------------------------------------
*/

const validateTenantId = (tenantId) => {
  if (
    tenantId === undefined ||
    tenantId === null ||
    tenantId === ""
  ) {
    throw new Error(
      "Tenant ID is required."
    );
  }

  return tenantId;
};


/*
|--------------------------------------------------------------------------
| GET TENANTS
|--------------------------------------------------------------------------
*/

/**
 * Get paginated tenants.
 *
 * GET /api/tenants
 */
export const getTenants = async (
  params = {}
) => {
  try {
    const response = await api.get(
      "/tenants",
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET SINGLE TENANT
|--------------------------------------------------------------------------
*/

/**
 * Get a single tenant.
 *
 * GET /api/tenants/{tenantId}
 */
export const getTenant = async (
  tenantId
) => {
  try {
    validateTenantId(tenantId);

    const response = await api.get(
      `/tenants/${tenantId}`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/*
|--------------------------------------------------------------------------
| CREATE TENANT
|--------------------------------------------------------------------------
*/

/**
 * Create a tenant.
 *
 * POST /api/tenants
 */
export const createTenant = async (
  tenantData
) => {
  try {
    if (!tenantData) {
      throw new Error(
        "Tenant data is required."
      );
    }

    const response = await api.post(
      "/tenants",
      tenantData
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE TENANT
|--------------------------------------------------------------------------
*/

/**
 * Update a tenant.
 *
 * PUT /api/tenants/{tenantId}
 */
export const updateTenant = async (
  tenantId,
  tenantData
) => {
  try {
    validateTenantId(tenantId);

    if (!tenantData) {
      throw new Error(
        "Tenant data is required."
      );
    }

    const response = await api.put(
      `/tenants/${tenantId}`,
      tenantData
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/*
|--------------------------------------------------------------------------
| DELETE TENANT
|--------------------------------------------------------------------------
*/

/**
 * Soft-delete tenant.
 *
 * DELETE /api/tenants/{tenantId}
 *
 * This is the method used by:
 *
 * TenantTable
 *     ↓
 * onDelete()
 *     ↓
 * useTenant.removeTenant()
 *     ↓
 * tenantSlice.deleteTenant()
 *     ↓
 * tenantService.deleteTenant()
 *     ↓
 * tenantAPI.deleteTenant()
 *
 */
export const deleteTenant = async (
  tenantId
) => {
  try {
    validateTenantId(tenantId);

    console.log(
      "[Tenant API] DELETE tenant:",
      tenantId
    );

    const response = await api.delete(
      `/tenants/${tenantId}`
    );

    console.log(
      "[Tenant API] DELETE response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "[Tenant API] DELETE tenant failed:",
      {
        tenantId,
        status: error?.response?.status,
        response: error?.response?.data,
        message: error?.message,
      }
    );

    return handleApiError(error);
  }
};


/*
|--------------------------------------------------------------------------
| SEARCH TENANTS
|--------------------------------------------------------------------------
*/

/**
 * Search tenants.
 *
 * GET /api/tenants/search
 *
 * Query:
 *   ?search=value&limit=20
 */
export const searchTenants = async (
  search,
  limit = 20
) => {
  try {
    const response = await api.get(
      "/tenants/search",
      {
        params: {
          search,
          limit,
        },
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/*
|--------------------------------------------------------------------------
| STATUS LISTS
|--------------------------------------------------------------------------
*/

/**
 * Get active tenants.
 *
 * GET /api/tenants/active
 */
export const getActiveTenants = async () => {
  try {
    const response = await api.get(
      "/tenants/active"
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/**
 * Get pending tenants.
 *
 * GET /api/tenants/pending
 */
export const getPendingTenants = async () => {
  try {
    const response = await api.get(
      "/tenants/pending"
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/**
 * Get inactive tenants.
 *
 * GET /api/tenants/inactive
 */
export const getInactiveTenants = async () => {
  try {
    const response = await api.get(
      "/tenants/inactive"
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/**
 * Get blacklisted tenants.
 *
 * GET /api/tenants/blacklisted
 */
export const getBlacklistedTenants = async () => {
  try {
    const response = await api.get(
      "/tenants/blacklisted"
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/*
|--------------------------------------------------------------------------
| STATUS ACTIONS
|--------------------------------------------------------------------------
*/

/**
 * Activate tenant.
 *
 * PATCH /api/tenants/{tenantId}/activate
 */
export const activateTenant = async (
  tenantId
) => {
  try {
    validateTenantId(tenantId);

    const response = await api.patch(
      `/tenants/${tenantId}/activate`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/**
 * Deactivate tenant.
 *
 * PATCH /api/tenants/{tenantId}/deactivate
 */
export const deactivateTenant = async (
  tenantId
) => {
  try {
    validateTenantId(tenantId);

    const response = await api.patch(
      `/tenants/${tenantId}/deactivate`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/**
 * Blacklist tenant.
 *
 * PATCH /api/tenants/{tenantId}/blacklist
 */
export const blacklistTenant = async (
  tenantId
) => {
  try {
    validateTenantId(tenantId);

    const response = await api.patch(
      `/tenants/${tenantId}/blacklist`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/**
 * Set tenant to pending.
 *
 * PATCH /api/tenants/{tenantId}/pending
 */
export const setTenantPending = async (
  tenantId
) => {
  try {
    validateTenantId(tenantId);

    const response = await api.patch(
      `/tenants/${tenantId}/pending`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/*
|--------------------------------------------------------------------------
| VERIFICATION
|--------------------------------------------------------------------------
*/

/**
 * Verify tenant.
 *
 * PATCH /api/tenants/{tenantId}/verify
 */
export const verifyTenant = async (
  tenantId
) => {
  try {
    validateTenantId(tenantId);

    const response = await api.patch(
      `/tenants/${tenantId}/verify`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/**
 * Remove tenant verification.
 *
 * PATCH /api/tenants/{tenantId}/unverify
 */
export const unverifyTenant = async (
  tenantId
) => {
  try {
    validateTenantId(tenantId);

    const response = await api.patch(
      `/tenants/${tenantId}/unverify`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/*
|--------------------------------------------------------------------------
| STATISTICS
|--------------------------------------------------------------------------
*/

/**
 * Get tenant statistics.
 *
 * GET /api/tenants/statistics
 */
export const getTenantStatistics = async () => {
  try {
    const response = await api.get(
      "/tenants/statistics"
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/*
|--------------------------------------------------------------------------
| SOFT DELETE / RESTORE
|--------------------------------------------------------------------------
*/

/**
 * Restore a soft-deleted tenant.
 *
 * PATCH /api/tenants/{tenantId}/restore
 */
export const restoreTenant = async (
  tenantId
) => {
  try {
    validateTenantId(tenantId);

    const response = await api.patch(
      `/tenants/${tenantId}/restore`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


/*
|--------------------------------------------------------------------------
| FORCE DELETE
|--------------------------------------------------------------------------
*/

/**
 * Permanently delete a tenant.
 *
 * DELETE /api/tenants/{tenantId}/force
 */
export const forceDeleteTenant = async (
  tenantId
) => {
  try {
    validateTenantId(tenantId);

    console.log(
      "[Tenant API] FORCE DELETE tenant:",
      tenantId
    );

    const response = await api.delete(
      `/tenants/${tenantId}/force`
    );

    console.log(
      "[Tenant API] FORCE DELETE response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "[Tenant API] FORCE DELETE failed:",
      {
        tenantId,
        status: error?.response?.status,
        response: error?.response?.data,
        message: error?.message,
      }
    );

    return handleApiError(error);
  }
};


/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

const tenantAPI = {
  /*
   * CRUD
   */
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,

  /*
   * Search
   */
  searchTenants,

  /*
   * Status lists
   */
  getActiveTenants,
  getPendingTenants,
  getInactiveTenants,
  getBlacklistedTenants,

  /*
   * Status actions
   */
  activateTenant,
  deactivateTenant,
  blacklistTenant,
  setTenantPending,

  /*
   * Verification
   */
  verifyTenant,
  unverifyTenant,

  /*
   * Statistics
   */
  getTenantStatistics,

  /*
   * Soft delete / restore
   */
  restoreTenant,

  /*
   * Permanent delete
   */
  forceDeleteTenant,
};

export default tenantAPI;