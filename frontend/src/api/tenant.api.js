
import api from "./axios";

const handleApiError = (error) => {
  const response = error?.response;
  const responseData = response?.data;

  const message =
    responseData?.message ||
    responseData?.error ||
    responseData?.errors?.message ||
    error?.message ||
    "Something went wrong while processing the tenant request.";

  console.error("[Tenant API Error]", {
    message,
    status: response?.status ?? null,
    code: responseData?.code ?? null,
    errors: responseData?.errors ?? null,
    response: responseData ?? null,
  });

  /*
   * IMPORTANT:
   *
   * Do not return the error.
   * Throw the original Axios error so tenant.service.js
   * can inspect response.data.
   */
  throw error;
};


/*
|--------------------------------------------------------------------------
| TENANT ID VALIDATION
|--------------------------------------------------------------------------
*/

/**
 * Validate tenant ID.
 *
 * Supports:
 *
 * 12
 * "12"
 * { id: 12 }
 * { tenant_id: 12 }
 * { tenant: { id: 12 } }
 */
const getTenantId = (tenantOrId) => {
  if (
    tenantOrId === null ||
    tenantOrId === undefined
  ) {
    return null;
  }

  /*
   * Primitive ID.
   */
  if (
    typeof tenantOrId === "string" ||
    typeof tenantOrId === "number"
  ) {
    const id = String(
      tenantOrId
    ).trim();

    return id || null;
  }

  /*
   * Object ID.
   */
  if (
    typeof tenantOrId === "object"
  ) {
    const id =
      tenantOrId?.id ??
      tenantOrId?.tenant_id ??
      tenantOrId?.tenant?.id ??
      tenantOrId?.data?.id ??
      tenantOrId?.data?.tenant_id ??
      tenantOrId?.data?.tenant?.id;

    if (
      id !== null &&
      id !== undefined &&
      String(id).trim() !== ""
    ) {
      return String(id).trim();
    }
  }

  return null;
};


/**
 * Require a valid tenant ID.
 */
const validateTenantId = (
  tenantOrId
) => {
  const tenantId =
    getTenantId(
      tenantOrId
    );

  if (!tenantId) {
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
 *
 * Example:
 *
 * /api/tenants?page=1&per_page=15
 */
export const getTenants = async (
  params = {}
) => {
  try {
    const response =
      await api.get(
        "/tenants",
        {
          params,
        }
      );

    /*
     * Return Laravel response envelope.
     *
     * Example:
     *
     * {
     *   status: true,
     *   code: 200,
     *   message: "...",
     *   data: [...]
     * }
     */
    return response.data;
  } catch (error) {
    return handleApiError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| GET AVAILABLE TENANT USERS
|--------------------------------------------------------------------------
*/

/**
 * Get existing users who have the tenant role
 * and are not already linked to a tenant profile.
 *
 * IMPORTANT:
 *
 * This does NOT create a new user.
 *
 * It fetches existing users from the users table
 * so the Create Tenant form can allow an existing
 * tenant-role user to be selected.
 *
 * GET /api/tenants/available-users
 *
 * Expected backend response:
 *
 * {
 *   status: true,
 *   code: 200,
 *   message: "Available tenant users fetched successfully.",
 *   data: [
 *     {
 *       id: 4,
 *       first_name: "Allan",
 *       last_name: "Nonda",
 *       name: "Allan Nonda",
 *       email: "allantsory.dev@gmail.com",
 *       phone: "0792491361"
 *     }
 *   ]
 * }
 */
export const getAvailableTenantUsers =
  async () => {
    try {
      console.log(
        "[Tenant API] Fetching available tenant users..."
      );

      const response =
        await api.get(
          "/tenants/available-users"
        );

      console.log(
        "[Tenant API] Available tenant users response:",
        response.data
      );

      return response.data;
    } catch (error) {
      console.error(
        "[Tenant API] Failed to fetch available tenant users:",
        {
          status:
            error?.response?.status ??
            null,

          response:
            error?.response?.data ??
            null,

          message:
            error?.message ??
            null,
        }
      );

      return handleApiError(
        error
      );
    }
  };


/*
|--------------------------------------------------------------------------
| GET SINGLE TENANT
|--------------------------------------------------------------------------
*/

/**
 * GET /api/tenants/{tenantId}
 */
export const getTenant = async (
  tenantOrId
) => {
  try {
    const tenantId =
      validateTenantId(
        tenantOrId
      );

    const response =
      await api.get(
        `/tenants/${tenantId}`
      );

    return response.data;
  } catch (error) {
    return handleApiError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| CREATE TENANT
|--------------------------------------------------------------------------
*/

/**
 * POST /api/tenants
 */
export const createTenant = async (
  tenantData
) => {
  try {
    if (
      !tenantData ||
      typeof tenantData !== "object"
    ) {
      throw new Error(
        "Tenant data is required."
      );
    }

    const response =
      await api.post(
        "/tenants",
        tenantData
      );

    return response.data;
  } catch (error) {
    return handleApiError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE TENANT
|--------------------------------------------------------------------------
*/

/**
 * PUT /api/tenants/{tenantId}
 */
export const updateTenant = async (
  tenantOrId,
  tenantData
) => {
  try {
    const tenantId =
      validateTenantId(
        tenantOrId
      );

    if (
      !tenantData ||
      typeof tenantData !== "object"
    ) {
      throw new Error(
        "Tenant data is required."
      );
    }

    const response =
      await api.put(
        `/tenants/${tenantId}`,
        tenantData
      );

    return response.data;
  } catch (error) {
    return handleApiError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| DELETE TENANT
|--------------------------------------------------------------------------
*/

/**
 * Soft delete tenant.
 *
 * DELETE /api/tenants/{tenantId}
 */
export const deleteTenant = async (
  tenantOrId
) => {
  const tenantId =
    validateTenantId(
      tenantOrId
    );

  try {
    console.log(
      "[Tenant API] DELETE tenant:",
      {
        tenantId,
        endpoint:
          `/tenants/${tenantId}`,
      }
    );

    const response =
      await api.delete(
        `/tenants/${tenantId}`
      );

    console.log(
      "[Tenant API] DELETE response:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "[Tenant API] DELETE failed:",
      {
        tenantId,
        status:
          error?.response?.status ??
          null,
        response:
          error?.response?.data ??
          null,
        message:
          error?.message ??
          null,
      }
    );

    return handleApiError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| SEARCH TENANTS
|--------------------------------------------------------------------------
*/

/**
 * GET /api/tenants/search
 *
 * Query:
 *
 * ?search=esther&limit=20
 */
export const searchTenants = async (
  search,
  limit = 20
) => {
  try {
    const searchValue =
      String(
        search ?? ""
      ).trim();

    if (!searchValue) {
      return {
        status: true,
        code: 200,
        message:
          "No search value supplied.",
        data: [],
      };
    }

    const response =
      await api.get(
        "/tenants/search",
        {
          params: {
            search:
              searchValue,
            limit,
          },
        }
      );

    return response.data;
  } catch (error) {
    return handleApiError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| ACTIVE TENANTS
|--------------------------------------------------------------------------
*/

/**
 * GET /api/tenants/active
 */
export const getActiveTenants =
  async () => {
    try {
      const response =
        await api.get(
          "/tenants/active"
        );

      return response.data;
    } catch (error) {
      return handleApiError(
        error
      );
    }
  };


/*
|--------------------------------------------------------------------------
| PENDING TENANTS
|--------------------------------------------------------------------------
*/

/**
 * GET /api/tenants/pending
 */
export const getPendingTenants =
  async () => {
    try {
      const response =
        await api.get(
          "/tenants/pending"
        );

      return response.data;
    } catch (error) {
      return handleApiError(
        error
      );
    }
  };


/*
|--------------------------------------------------------------------------
| INACTIVE TENANTS
|--------------------------------------------------------------------------
*/

/**
 * GET /api/tenants/inactive
 */
export const getInactiveTenants =
  async () => {
    try {
      const response =
        await api.get(
          "/tenants/inactive"
        );

      return response.data;
    } catch (error) {
      return handleApiError(
        error
      );
    }
  };


/*
|--------------------------------------------------------------------------
| BLACKLISTED TENANTS
|--------------------------------------------------------------------------
*/

/**
 * GET /api/tenants/blacklisted
 */
export const getBlacklistedTenants =
  async () => {
    try {
      const response =
        await api.get(
          "/tenants/blacklisted"
        );

      return response.data;
    } catch (error) {
      return handleApiError(
        error
      );
    }
  };


/*
|--------------------------------------------------------------------------
| ACTIVATE TENANT
|--------------------------------------------------------------------------
*/

/**
 * PATCH /api/tenants/{tenantId}/activate
 */
export const activateTenant = async (
  tenantOrId
) => {
  try {
    const tenantId =
      validateTenantId(
        tenantOrId
      );

    const response =
      await api.patch(
        `/tenants/${tenantId}/activate`
      );

    return response.data;
  } catch (error) {
    return handleApiError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| DEACTIVATE TENANT
|--------------------------------------------------------------------------
*/

/**
 * PATCH /api/tenants/{tenantId}/deactivate
 */
export const deactivateTenant = async (
  tenantOrId
) => {
  try {
    const tenantId =
      validateTenantId(
        tenantOrId
      );

    const response =
      await api.patch(
        `/tenants/${tenantId}/deactivate`
      );

    return response.data;
  } catch (error) {
    return handleApiError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| BLACKLIST TENANT
|--------------------------------------------------------------------------
*/

/**
 * PATCH /api/tenants/{tenantId}/blacklist
 */
export const blacklistTenant = async (
  tenantOrId
) => {
  try {
    const tenantId =
      validateTenantId(
        tenantOrId
      );

    const response =
      await api.patch(
        `/tenants/${tenantId}/blacklist`
      );

    return response.data;
  } catch (error) {
    return handleApiError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| SET PENDING
|--------------------------------------------------------------------------
*/

/**
 * PATCH /api/tenants/{tenantId}/pending
 */
export const setTenantPending = async (
  tenantOrId
) => {
  try {
    const tenantId =
      validateTenantId(
        tenantOrId
      );

    const response =
      await api.patch(
        `/tenants/${tenantId}/pending`
      );

    return response.data;
  } catch (error) {
    return handleApiError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| VERIFY TENANT
|--------------------------------------------------------------------------
*/

/**
 * PATCH /api/tenants/{tenantId}/verify
 */
export const verifyTenant = async (
  tenantOrId
) => {
  try {
    const tenantId =
      validateTenantId(
        tenantOrId
      );

    const response =
      await api.patch(
        `/tenants/${tenantId}/verify`
      );

    return response.data;
  } catch (error) {
    return handleApiError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| UNVERIFY TENANT
|--------------------------------------------------------------------------
*/

/**
 * PATCH /api/tenants/{tenantId}/unverify
 */
export const unverifyTenant = async (
  tenantOrId
) => {
  try {
    const tenantId =
      validateTenantId(
        tenantOrId
      );

    const response =
      await api.patch(
        `/tenants/${tenantId}/unverify`
      );

    return response.data;
  } catch (error) {
    return handleApiError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| TENANT STATISTICS
|--------------------------------------------------------------------------
*/

/**
 * GET /api/tenants/statistics
 *
 * IMPORTANT:
 *
 * The backend should calculate statistics from the
 * actual tenants.status column.
 *
 * Do NOT calculate statistics using:
 *
 * tenants.is_active
 *
 * because that column does not exist in the current
 * tenants table.
 */
export const getTenantStatistics =
  async () => {
    try {
      const response =
        await api.get(
          "/tenants/statistics"
        );

      return response.data;
    } catch (error) {
      console.error(
        "[Tenant API] Statistics failed:",
        {
          status:
            error?.response?.status ??
            null,
          response:
            error?.response?.data ??
            null,
          message:
            error?.message ??
            null,
        }
      );

      return handleApiError(
        error
      );
    }
  };


/*
|--------------------------------------------------------------------------
| RESTORE TENANT
|--------------------------------------------------------------------------
*/

/**
 * PATCH /api/tenants/{tenantId}/restore
 */
export const restoreTenant = async (
  tenantOrId
) => {
  try {
    const tenantId =
      validateTenantId(
        tenantOrId
      );

    const response =
      await api.patch(
        `/tenants/${tenantId}/restore`
      );

    return response.data;
  } catch (error) {
    return handleApiError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| FORCE DELETE TENANT
|--------------------------------------------------------------------------
*/

/**
 * Permanently delete tenant.
 *
 * DELETE /api/tenants/{tenantId}/force
 */
export const forceDeleteTenant = async (
  tenantOrId
) => {
  const tenantId =
    validateTenantId(
      tenantOrId
    );

  try {
    console.log(
      "[Tenant API] FORCE DELETE tenant:",
      {
        tenantId,
        endpoint:
          `/tenants/${tenantId}/force`,
      }
    );

    const response =
      await api.delete(
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
        status:
          error?.response?.status ??
          null,
        response:
          error?.response?.data ??
          null,
        message:
          error?.message ??
          null,
      }
    );

    return handleApiError(
      error
    );
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
   * Available tenant users
   *
   * Existing users with the tenant role
   * who can be linked to a tenant profile.
   */
  getAvailableTenantUsers,

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
   * Restore
   */
  restoreTenant,

  /*
   * Permanent delete
   */
  forceDeleteTenant,
};

export default tenantAPI;

