import tenantAPI from "../api/tenant.api";

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Get the actual Laravel API payload.
 *
 * Supports Axios response:
 *
 * {
 *   data: {
 *     status: true,
 *     code: 200,
 *     message: "...",
 *     data: {...}
 *   }
 * }
 *
 * And direct Laravel response:
 *
 * {
 *   status: true,
 *   code: 200,
 *   message: "...",
 *   data: {...}
 * }
 */
const unwrapResponse = (response) => {
  if (!response) {
    return null;
  }

  /*
   * Axios response
   */
  if (
    response &&
    typeof response === "object" &&
    response.data !== undefined &&
    (
      response.status !== undefined ||
      response.config !== undefined ||
      response.headers !== undefined
    )
  ) {
    return response.data;
  }

  /*
   * Already unwrapped Laravel response
   */
  return response;
};


/**
 * Get Laravel response envelope.
 */
const getResponseEnvelope = (response) => {
  return unwrapResponse(response) ?? {};
};


/**
 * Get Laravel response data.
 */
const getResponseData = (response) => {
  const payload = getResponseEnvelope(response);

  if (
    payload &&
    typeof payload === "object" &&
    payload.data !== undefined
  ) {
    return payload.data;
  }

  return payload ?? null;
};


/**
 * Get Laravel response message.
 */
const getResponseMessage = (
  response,
  fallback = "Operation completed successfully."
) => {
  const payload = getResponseEnvelope(response);

  return (
    payload?.message ||
    payload?.data?.message ||
    fallback
  );
};


/**
 * Get Laravel response status.
 */
const getResponseStatus = (response) => {
  const payload = getResponseEnvelope(response);

  return payload?.status ?? true;
};


/**
 * Get Laravel response code.
 */
const getResponseCode = (response) => {
  const payload = getResponseEnvelope(response);

  return (
    payload?.code ??
    payload?.status_code ??
    null
  );
};


/*
|--------------------------------------------------------------------------
| COLLECTION HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Get collection data.
 *
 * Supports:
 *
 * 1. data: []
 *
 * 2. data: {
 *      data: []
 *    }
 *
 * 3. direct []
 *
 * 4. Laravel paginator.
 */
const getCollectionData = (response) => {
  const payload = getResponseEnvelope(response);

  /*
   * Direct array.
   */
  if (Array.isArray(payload)) {
    return payload;
  }

  /*
   * Laravel:
   *
   * {
   *   data: []
   * }
   */
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  /*
   * Nested paginator:
   *
   * {
   *   data: {
   *     data: []
   *   }
   * }
   */
  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  /*
   * Sometimes response may itself contain:
   *
   * {
   *   data: {
   *     tenants: []
   *   }
   * }
   */
  if (Array.isArray(payload?.data?.tenants)) {
    return payload.data.tenants;
  }

  if (Array.isArray(payload?.tenants)) {
    return payload.tenants;
  }

  return [];
};


/**
 * Get pagination metadata.
 */
const getPagination = (response) => {
  const payload = getResponseEnvelope(response);

  /*
   * Laravel Resource pagination.
   */
  if (payload?.meta) {
    return {
      current_page:
        Number(
          payload.meta.current_page ??
          payload.meta.currentPage ??
          1
        ),

      last_page:
        Number(
          payload.meta.last_page ??
          payload.meta.lastPage ??
          1
        ),

      per_page:
        Number(
          payload.meta.per_page ??
          payload.meta.perPage ??
          15
        ),

      total:
        Number(
          payload.meta.total ??
          0
        ),

      from:
        Number(
          payload.meta.from ??
          0
        ),

      to:
        Number(
          payload.meta.to ??
          0
        ),
    };
  }

  /*
   * Nested Laravel paginator.
   */
  if (payload?.data?.meta) {
    return {
      current_page:
        Number(
          payload.data.meta.current_page ??
          payload.data.meta.currentPage ??
          1
        ),

      last_page:
        Number(
          payload.data.meta.last_page ??
          payload.data.meta.lastPage ??
          1
        ),

      per_page:
        Number(
          payload.data.meta.per_page ??
          payload.data.meta.perPage ??
          15
        ),

      total:
        Number(
          payload.data.meta.total ??
          0
        ),

      from:
        Number(
          payload.data.meta.from ??
          0
        ),

      to:
        Number(
          payload.data.meta.to ??
          0
        ),
    };
  }

  /*
   * Direct paginator.
   */
  if (
    payload?.current_page !== undefined ||
    payload?.last_page !== undefined ||
    payload?.total !== undefined
  ) {
    return {
      current_page:
        Number(
          payload.current_page ??
          1
        ),

      last_page:
        Number(
          payload.last_page ??
          1
        ),

      per_page:
        Number(
          payload.per_page ??
          15
        ),

      total:
        Number(
          payload.total ??
          0
        ),

      from:
        Number(
          payload.from ??
          0
        ),

      to:
        Number(
          payload.to ??
          0
        ),
    };
  }

  /*
   * Nested paginator.
   */
  if (
    payload?.data?.current_page !== undefined ||
    payload?.data?.last_page !== undefined
  ) {
    return {
      current_page:
        Number(
          payload.data.current_page ??
          1
        ),

      last_page:
        Number(
          payload.data.last_page ??
          1
        ),

      per_page:
        Number(
          payload.data.per_page ??
          15
        ),

      total:
        Number(
          payload.data.total ??
          0
        ),

      from:
        Number(
          payload.data.from ??
          0
        ),

      to:
        Number(
          payload.data.to ??
          0
        ),
    };
  }

  return {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0,
  };
};


/*
|--------------------------------------------------------------------------
| ID HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Extract tenant ID from either:
 *
 * deleteTenant(15)
 *
 * or:
 *
 * deleteTenant({
 *   id: 15,
 *   tenant_number: "TNT-000015"
 * })
 */
const getTenantId = (tenantOrId) => {
  if (
    tenantOrId === null ||
    tenantOrId === undefined
  ) {
    return null;
  }

  /*
   * Object.
   */
  if (
    typeof tenantOrId === "object"
  ) {
    return (
      tenantOrId?.id ??
      tenantOrId?.tenant_id ??
      tenantOrId?.tenant?.id ??
      null
    );
  }

  /*
   * Primitive ID.
   */
  return tenantOrId;
};


/**
 * Validate tenant ID.
 */
const requireTenantId = (tenantOrId) => {
  const tenantId =
    getTenantId(tenantOrId);

  if (
    tenantId === null ||
    tenantId === undefined ||
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
| ERROR NORMALIZATION
|--------------------------------------------------------------------------
*/

/**
 * Normalize Axios/Laravel errors.
 *
 * IMPORTANT:
 * Keeps the actual Laravel error details so the UI
 * does not only show "Failed to delete tenant."
 */
const normalizeError = (error) => {
  /*
   * Already normalized error.
   */
  if (
    error &&
    typeof error === "object" &&
    error.raw &&
    error.message
  ) {
    return error;
  }

  const response =
    error?.response;

  const responseData =
    response?.data;

  const nestedData =
    responseData?.data;

  const errors =
    responseData?.errors ??
    nestedData?.errors ??
    null;

  /*
   * Laravel may return:
   *
   * {
   *   message: "...",
   *   errors: {
   *      error: "..."
   *   }
   * }
   */
  const serverError =
    errors?.error ??
    errors?.message ??
    responseData?.error ??
    nestedData?.error ??
    null;

  const message =
    responseData?.message ??
    serverError ??
    error?.message ??
    "Something went wrong while processing the tenant request.";

  const normalized = new Error(
    String(message)
  );

  /*
   * Preserve useful properties.
   */
  normalized.status =
    response?.status ??
    responseData?.code ??
    null;

  normalized.code =
    responseData?.code ??
    response?.status ??
    null;

  normalized.errors =
    errors;

  normalized.response =
    response;

  normalized.raw =
    error;

  return normalized;
};


/*
|--------------------------------------------------------------------------
| TENANT NORMALIZATION
|--------------------------------------------------------------------------
*/

/**
 * Normalize a single tenant.
 */
const normalizeTenant = (tenant) => {
  if (!tenant) {
    return null;
  }

  /*
   * Handle accidental nested resource response.
   */
  if (
    tenant?.data &&
    typeof tenant.data === "object" &&
    !Array.isArray(tenant.data)
  ) {
    tenant = tenant.data;
  }

  const firstName =
    tenant?.first_name ??
    tenant?.user?.first_name ??
    "";

  const lastName =
    tenant?.last_name ??
    tenant?.user?.last_name ??
    "";

  const otherNames =
    tenant?.other_names ??
    tenant?.user?.other_names ??
    "";

  const email =
    tenant?.email ??
    tenant?.user?.email ??
    "";

  const phone =
    tenant?.phone ??
    tenant?.user?.phone ??
    "";

  const fullName =
    tenant?.full_name ??
    tenant?.user?.full_name ??
    [
      firstName,
      otherNames,
      lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  return {
    ...tenant,

    id:
      tenant?.id ??
      null,

    tenant_number:
      tenant?.tenant_number ??
      "",

    user_id:
      tenant?.user_id ??
      tenant?.user?.id ??
      null,

    first_name:
      firstName,

    last_name:
      lastName,

    other_names:
      otherNames,

    full_name:
      fullName ||
      "Unknown Tenant",

    email,

    phone,

    status:
      tenant?.status ??
      tenant?.tenant_status ??
      tenant?.account_status ??
      "",

    /*
     * Do NOT assume is_active exists in the database.
     *
     * The backend recently showed that tenants does not
     * have an is_active column.
     *
     * Therefore this is only derived from the returned
     * status when necessary.
     */
    is_active:
      tenant?.is_active !== undefined
        ? Boolean(tenant.is_active)
        : String(
            tenant?.status ??
            ""
          ).toLowerCase() === "active",

    is_verified:
      Boolean(
        tenant?.is_verified ??
        false
      ),

    verification_status:
      tenant?.verification_status ??
      "",

    status_label:
      tenant?.status_label ??
      "",

    tenancies:
      Array.isArray(
        tenant?.tenancies
      )
        ? tenant.tenancies
        : [],

    tenancy_count:
      Number(
        tenant?.tenancy_count ??
        (
          Array.isArray(
            tenant?.tenancies
          )
            ? tenant.tenancies.length
            : 0
        )
      ),
  };
};


/**
 * Normalize tenant collection.
 */
const normalizeTenants = (
  tenants
) => {
  if (!Array.isArray(tenants)) {
    return [];
  }

  return tenants
    .map(normalizeTenant)
    .filter(Boolean);
};


/*
|--------------------------------------------------------------------------
| GET TENANTS
|--------------------------------------------------------------------------
*/

export const getTenants = async (
  params = {}
) => {
  try {
    const response =
      await tenantAPI.getTenants(
        params
      );

    return {
      data:
        normalizeTenants(
          getCollectionData(
            response
          )
        ),

      pagination:
        getPagination(
          response
        ),

      message:
        getResponseMessage(
          response,
          "Tenants fetched successfully."
        ),

      status:
        getResponseStatus(
          response
        ),

      code:
        getResponseCode(
          response
        ),
    };
  } catch (error) {
    throw normalizeError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| GET SINGLE TENANT
|--------------------------------------------------------------------------
*/

export const getTenant = async (
  tenantId
) => {
  try {
    const id =
      requireTenantId(
        tenantId
      );

    const response =
      await tenantAPI.getTenant(
        id
      );

    return {
      data:
        normalizeTenant(
          getResponseData(
            response
          )
        ),

      message:
        getResponseMessage(
          response,
          "Tenant fetched successfully."
        ),

      status:
        getResponseStatus(
          response
        ),

      code:
        getResponseCode(
          response
        ),
    };
  } catch (error) {
    throw normalizeError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| CREATE TENANT
|--------------------------------------------------------------------------
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
      await tenantAPI.createTenant(
        tenantData
      );

    return {
      data:
        normalizeTenant(
          getResponseData(
            response
          )
        ),

      message:
        getResponseMessage(
          response,
          "Tenant created successfully."
        ),

      status:
        getResponseStatus(
          response
        ),

      code:
        getResponseCode(
          response
        ),
    };
  } catch (error) {
    throw normalizeError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE TENANT
|--------------------------------------------------------------------------
*/

export const updateTenant = async (
  tenantId,
  tenantData
) => {
  try {
    const id =
      requireTenantId(
        tenantId
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
      await tenantAPI.updateTenant(
        id,
        tenantData
      );

    return {
      data:
        normalizeTenant(
          getResponseData(
            response
          )
        ),

      message:
        getResponseMessage(
          response,
          "Tenant updated successfully."
        ),

      status:
        getResponseStatus(
          response
        ),

      code:
        getResponseCode(
          response
        ),
    };
  } catch (error) {
    throw normalizeError(
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
 * Supports both:
 *
 * deleteTenant(15)
 *
 * and:
 *
 * deleteTenant(tenant)
 *
 * The API request is always:
 *
 * DELETE /tenants/{id}
 */
export const deleteTenant = async (
  tenantOrId
) => {
  const tenantId =
    requireTenantId(
      tenantOrId
    );

  try {
    console.log(
      "[TenantService] Deleting tenant:",
      {
        tenantId,
        endpoint:
          `/tenants/${tenantId}`,
      }
    );

    const response =
      await tenantAPI.deleteTenant(
        tenantId
      );

    console.log(
      "[TenantService] Tenant delete response:",
      response
    );

    return {
      tenantId,

      data:
        getResponseData(
          response
        ),

      message:
        getResponseMessage(
          response,
          "Tenant deleted successfully."
        ),

      status:
        getResponseStatus(
          response
        ),

      code:
        getResponseCode(
          response
        ),
    };
  } catch (error) {
    const normalized =
      normalizeError(
        error
      );

    console.error(
      "[TenantService] Failed to delete tenant:",
      {
        tenantId,
        message:
          normalized.message,
        status:
          normalized.status,
        code:
          normalized.code,
        errors:
          normalized.errors,
        response:
          normalized.response?.data,
      }
    );

    throw normalized;
  }
};


/*
|--------------------------------------------------------------------------
| SEARCH TENANTS
|--------------------------------------------------------------------------
*/

export const searchTenants = async (
  search,
  limit = 20
) => {
  try {
    if (
      !search ||
      !String(search).trim()
    ) {
      return [];
    }

    const response =
      await tenantAPI.searchTenants(
        String(search).trim(),
        limit
      );

    return normalizeTenants(
      getCollectionData(
        response
      )
    );
  } catch (error) {
    throw normalizeError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| STATUS LISTS
|--------------------------------------------------------------------------
*/

/**
 * Get active tenants.
 */
export const getActiveTenants =
  async () => {
    try {
      const response =
        await tenantAPI.getActiveTenants();

      return normalizeTenants(
        getCollectionData(
          response
        )
      );
    } catch (error) {
      throw normalizeError(
        error
      );
    }
  };


/**
 * Get pending tenants.
 */
export const getPendingTenants =
  async () => {
    try {
      const response =
        await tenantAPI.getPendingTenants();

      return normalizeTenants(
        getCollectionData(
          response
        )
      );
    } catch (error) {
      throw normalizeError(
        error
      );
    }
  };


/**
 * Get inactive tenants.
 */
export const getInactiveTenants =
  async () => {
    try {
      const response =
        await tenantAPI.getInactiveTenants();

      return normalizeTenants(
        getCollectionData(
          response
        )
      );
    } catch (error) {
      throw normalizeError(
        error
      );
    }
  };


/**
 * Get blacklisted tenants.
 */
export const getBlacklistedTenants =
  async () => {
    try {
      const response =
        await tenantAPI.getBlacklistedTenants();

      return normalizeTenants(
        getCollectionData(
          response
        )
      );
    } catch (error) {
      throw normalizeError(
        error
      );
    }
  };


/*
|--------------------------------------------------------------------------
| TENANT ACTION RESPONSE
|--------------------------------------------------------------------------
*/

const normalizeTenantActionResponse = (
  response,
  fallbackMessage
) => {
  return {
    tenant:
      normalizeTenant(
        getResponseData(
          response
        )
      ),

    data:
      getResponseData(
        response
      ),

    message:
      getResponseMessage(
        response,
        fallbackMessage
      ),

    status:
      getResponseStatus(
        response
      ),

    code:
      getResponseCode(
        response
      ),
  };
};


/*
|--------------------------------------------------------------------------
| ACTIVATE TENANT
|--------------------------------------------------------------------------
*/

export const activateTenant = async (
  tenantId
) => {
  try {
    const id =
      requireTenantId(
        tenantId
      );

    const response =
      await tenantAPI.activateTenant(
        id
      );

    return normalizeTenantActionResponse(
      response,
      "Tenant activated successfully."
    );
  } catch (error) {
    throw normalizeError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| DEACTIVATE TENANT
|--------------------------------------------------------------------------
*/

export const deactivateTenant = async (
  tenantId
) => {
  try {
    const id =
      requireTenantId(
        tenantId
      );

    const response =
      await tenantAPI.deactivateTenant(
        id
      );

    return normalizeTenantActionResponse(
      response,
      "Tenant deactivated successfully."
    );
  } catch (error) {
    throw normalizeError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| BLACKLIST TENANT
|--------------------------------------------------------------------------
*/

export const blacklistTenant = async (
  tenantId
) => {
  try {
    const id =
      requireTenantId(
        tenantId
      );

    const response =
      await tenantAPI.blacklistTenant(
        id
      );

    return normalizeTenantActionResponse(
      response,
      "Tenant blacklisted successfully."
    );
  } catch (error) {
    throw normalizeError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| SET TENANT PENDING
|--------------------------------------------------------------------------
*/

export const setTenantPending = async (
  tenantId
) => {
  try {
    const id =
      requireTenantId(
        tenantId
      );

    const response =
      await tenantAPI.setTenantPending(
        id
      );

    return normalizeTenantActionResponse(
      response,
      "Tenant status changed to pending."
    );
  } catch (error) {
    throw normalizeError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| VERIFY TENANT
|--------------------------------------------------------------------------
*/

export const verifyTenant = async (
  tenantId
) => {
  try {
    const id =
      requireTenantId(
        tenantId
      );

    const response =
      await tenantAPI.verifyTenant(
        id
      );

    return normalizeTenantActionResponse(
      response,
      "Tenant verified successfully."
    );
  } catch (error) {
    throw normalizeError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| UNVERIFY TENANT
|--------------------------------------------------------------------------
*/

export const unverifyTenant = async (
  tenantId
) => {
  try {
    const id =
      requireTenantId(
        tenantId
      );

    const response =
      await tenantAPI.unverifyTenant(
        id
      );

    return normalizeTenantActionResponse(
      response,
      "Tenant verification removed successfully."
    );
  } catch (error) {
    throw normalizeError(
      error
    );
  }
};


/*
|--------------------------------------------------------------------------
| TENANT STATISTICS
|--------------------------------------------------------------------------
*/

export const getTenantStatistics =
  async () => {
    try {
      const response =
        await tenantAPI.getTenantStatistics();

      const statistics =
        getResponseData(
          response
        );

      if (
        statistics &&
        typeof statistics === "object" &&
        !Array.isArray(statistics)
      ) {
        return {
          ...statistics,

          /*
           * Safe defaults.
           */
          total:
            Number(
              statistics.total ??
              0
            ),

          active:
            Number(
              statistics.active ??
              0
            ),

          pending:
            Number(
              statistics.pending ??
              0
            ),

          inactive:
            Number(
              statistics.inactive ??
              0
            ),

          blacklisted:
            Number(
              statistics.blacklisted ??
              0
            ),

          verified:
            Number(
              statistics.verified ??
              0
            ),

          unverified:
            Number(
              statistics.unverified ??
              0
            ),
        };
      }

      return {
        total: 0,
        active: 0,
        pending: 0,
        inactive: 0,
        blacklisted: 0,
        verified: 0,
        unverified: 0,
      };
    } catch (error) {
      throw normalizeError(
        error
      );
    }
  };


/*
|--------------------------------------------------------------------------
| RESTORE TENANT
|--------------------------------------------------------------------------
*/

export const restoreTenant = async (
  tenantId
) => {
  try {
    const id =
      requireTenantId(
        tenantId
      );

    const response =
      await tenantAPI.restoreTenant(
        id
      );

    return normalizeTenantActionResponse(
      response,
      "Tenant restored successfully."
    );
  } catch (error) {
    throw normalizeError(
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
 * Supports:
 *
 * forceDeleteTenant(15)
 *
 * or:
 *
 * forceDeleteTenant(tenant)
 */
export const forceDeleteTenant = async (
  tenantOrId
) => {
  const tenantId =
    requireTenantId(
      tenantOrId
    );

  try {
    console.log(
      "[TenantService] Permanently deleting tenant:",
      {
        tenantId,
        endpoint:
          `/tenants/${tenantId}/force`,
      }
    );

    const response =
      await tenantAPI.forceDeleteTenant(
        tenantId
      );

    return {
      tenantId,

      data:
        getResponseData(
          response
        ),

      message:
        getResponseMessage(
          response,
          "Tenant permanently deleted successfully."
        ),

      status:
        getResponseStatus(
          response
        ),

      code:
        getResponseCode(
          response
        ),
    };
  } catch (error) {
    const normalized =
      normalizeError(
        error
      );

    console.error(
      "[TenantService] Failed to permanently delete tenant:",
      {
        tenantId,
        message:
          normalized.message,
        status:
          normalized.status,
        code:
          normalized.code,
        errors:
          normalized.errors,
        response:
          normalized.response?.data,
      }
    );

    throw normalized;
  }
};


/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

const tenantService = {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,

  searchTenants,

  getActiveTenants,
  getPendingTenants,
  getInactiveTenants,
  getBlacklistedTenants,

  activateTenant,
  deactivateTenant,
  blacklistTenant,
  setTenantPending,

  verifyTenant,
  unverifyTenant,

  getTenantStatistics,

  restoreTenant,
  forceDeleteTenant,
};

export default tenantService;