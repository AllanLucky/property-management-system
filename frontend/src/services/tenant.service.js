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
 * And direct API response:
 *
 * {
 *   status: true,
 *   code: 200,
 *   message: "...",
 *   data: {...}
 * }
 */
const unwrapResponse = (response) => {
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
   * Already-unwrapped Laravel response
   */
  return response ?? null;
};


/**
 * Get Laravel response data.
 *
 * Example:
 *
 * {
 *   status: true,
 *   code: 200,
 *   message: "Success",
 *   data: {...}
 * }
 *
 * returns:
 *
 * {...}
 */
const getResponseData = (response) => {
  const payload = unwrapResponse(response);

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
 * Get Laravel response envelope.
 */
const getResponseEnvelope = (response) => {
  return unwrapResponse(response) ?? {};
};


/**
 * Get response message.
 */
const getResponseMessage = (
  response,
  fallback = "Operation completed successfully."
) => {
  const payload = getResponseEnvelope(response);

  return (
    payload?.message ||
    fallback
  );
};


/**
 * Get response status.
 */
const getResponseStatus = (response) => {
  const payload = getResponseEnvelope(response);

  return payload?.status ?? true;
};


/**
 * Get collection data.
 *
 * Supports:
 *
 * data: []
 *
 * data: {
 *   data: []
 * }
 *
 * Laravel pagination:
 *
 * data: {
 *   data: [],
 *   current_page: 1,
 *   ...
 * }
 */
const getCollectionData = (response) => {
  const payload = getResponseEnvelope(response);

  /*
   * Direct:
   *
   * {
   *   data: [...]
   * }
   */
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  /*
   * Nested:
   *
   * {
   *   data: {
   *     data: [...]
   *   }
   * }
   */
  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  /*
   * Already an array.
   */
  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};


/**
 * Get pagination metadata.
 */
const getPagination = (response) => {
  const payload = getResponseEnvelope(response);

  /*
   * Laravel resource/paginator:
   *
   * {
   *   data: [],
   *   meta: {}
   * }
   */
  if (payload?.meta) {
    return payload.meta;
  }

  /*
   * Nested paginator:
   *
   * {
   *   data: {
   *     data: [],
   *     meta: {}
   *   }
   * }
   */
  if (payload?.data?.meta) {
    return payload.data.meta;
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
        payload.current_page ?? 1,

      last_page:
        payload.last_page ?? 1,

      per_page:
        payload.per_page ?? 15,

      total:
        payload.total ?? 0,

      from:
        payload.from ?? 0,

      to:
        payload.to ?? 0,
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
        payload.data.current_page ?? 1,

      last_page:
        payload.data.last_page ?? 1,

      per_page:
        payload.data.per_page ?? 15,

      total:
        payload.data.total ?? 0,

      from:
        payload.data.from ?? 0,

      to:
        payload.data.to ?? 0,
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
| ERROR NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizeError = (error) => {
  const response = error?.response;
  const responseData = response?.data;

  return {
    message:
      responseData?.message ||
      responseData?.error ||
      error?.message ||
      "Something went wrong.",

    status:
      response?.status ??
      responseData?.code ??
      null,

    code:
      responseData?.code ??
      response?.status ??
      null,

    errors:
      responseData?.errors ??
      responseData?.data?.errors ??
      null,

    raw: error,
  };
};


/*
|--------------------------------------------------------------------------
| TENANT NORMALIZATION
|--------------------------------------------------------------------------
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

  return {
    ...tenant,

    id:
      tenant.id ??
      null,

    tenant_number:
      tenant.tenant_number ??
      "",

    user_id:
      tenant.user_id ??
      null,

    first_name:
      tenant.first_name ??
      "",

    last_name:
      tenant.last_name ??
      "",

    other_names:
      tenant.other_names ??
      "",

    full_name:
      tenant.full_name ||
      [
        tenant.first_name,
        tenant.other_names,
        tenant.last_name,
      ]
        .filter(Boolean)
        .join(" "),

    email:
      tenant.email ??
      "",

    phone:
      tenant.phone ??
      "",

    status:
      tenant.status ??
      "",

    is_active:
      Boolean(
        tenant.is_active
      ),

    is_verified:
      Boolean(
        tenant.is_verified
      ),
  };
};


const normalizeTenants = (tenants) => {
  return Array.isArray(tenants)
    ? tenants
      .map(normalizeTenant)
      .filter(Boolean)
    : [];
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
      await tenantAPI.getTenants(params);

    return {
      data: normalizeTenants(
        getCollectionData(response)
      ),

      pagination:
        getPagination(response),

      message:
        getResponseMessage(
          response,
          "Tenants fetched successfully."
        ),

      status:
        getResponseStatus(response),
    };
  } catch (error) {
    throw normalizeError(error);
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
    if (!tenantId) {
      throw new Error(
        "Tenant ID is required."
      );
    }

    const response =
      await tenantAPI.getTenant(
        tenantId
      );

    return {
      data: normalizeTenant(
        getResponseData(response)
      ),

      message:
        getResponseMessage(
          response,
          "Tenant fetched successfully."
        ),

      status:
        getResponseStatus(response),
    };
  } catch (error) {
    throw normalizeError(error);
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
    if (!tenantData) {
      throw new Error(
        "Tenant data is required."
      );
    }

    const response =
      await tenantAPI.createTenant(
        tenantData
      );

    return {
      data: normalizeTenant(
        getResponseData(response)
      ),

      message:
        getResponseMessage(
          response,
          "Tenant created successfully."
        ),

      status:
        getResponseStatus(response),
    };
  } catch (error) {
    throw normalizeError(error);
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
    if (!tenantId) {
      throw new Error(
        "Tenant ID is required."
      );
    }

    if (!tenantData) {
      throw new Error(
        "Tenant data is required."
      );
    }

    const response =
      await tenantAPI.updateTenant(
        tenantId,
        tenantData
      );

    return {
      data: normalizeTenant(
        getResponseData(response)
      ),

      message:
        getResponseMessage(
          response,
          "Tenant updated successfully."
        ),

      status:
        getResponseStatus(response),
    };
  } catch (error) {
    throw normalizeError(error);
  }
};


/*
|--------------------------------------------------------------------------
| DELETE TENANT
|--------------------------------------------------------------------------
*/

export const deleteTenant = async (
  tenantId
) => {
  try {
    if (!tenantId) {
      throw new Error(
        "Tenant ID is required."
      );
    }

    const response =
      await tenantAPI.deleteTenant(
        tenantId
      );

    return {
      tenantId,

      data:
        getResponseData(response),

      message:
        getResponseMessage(
          response,
          "Tenant deleted successfully."
        ),

      status:
        getResponseStatus(response),
    };
  } catch (error) {
    throw normalizeError(error);
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
    if (!search?.trim()) {
      return [];
    }

    const response =
      await tenantAPI.searchTenants(
        search.trim(),
        limit
      );

    return normalizeTenants(
      getCollectionData(response)
    );
  } catch (error) {
    throw normalizeError(error);
  }
};


/*
|--------------------------------------------------------------------------
| STATUS LISTS
|--------------------------------------------------------------------------
*/

export const getActiveTenants =
  async () => {
    try {
      const response =
        await tenantAPI.getActiveTenants();

      return normalizeTenants(
        getCollectionData(response)
      );
    } catch (error) {
      throw normalizeError(error);
    }
  };


export const getPendingTenants =
  async () => {
    try {
      const response =
        await tenantAPI.getPendingTenants();

      return normalizeTenants(
        getCollectionData(response)
      );
    } catch (error) {
      throw normalizeError(error);
    }
  };


export const getInactiveTenants =
  async () => {
    try {
      const response =
        await tenantAPI.getInactiveTenants();

      return normalizeTenants(
        getCollectionData(response)
      );
    } catch (error) {
      throw normalizeError(error);
    }
  };


export const getBlacklistedTenants =
  async () => {
    try {
      const response =
        await tenantAPI.getBlacklistedTenants();

      return normalizeTenants(
        getCollectionData(response)
      );
    } catch (error) {
      throw normalizeError(error);
    }
  };


/*
|--------------------------------------------------------------------------
| TENANT STATUS ACTION RESPONSE
|--------------------------------------------------------------------------
*/

const normalizeTenantActionResponse = (
  response,
  fallbackMessage
) => {
  return {
    tenant:
      normalizeTenant(
        getResponseData(response)
      ),

    message:
      getResponseMessage(
        response,
        fallbackMessage
      ),

    status:
      getResponseStatus(response),
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
    if (!tenantId) {
      throw new Error(
        "Tenant ID is required."
      );
    }

    const response =
      await tenantAPI.activateTenant(
        tenantId
      );

    return normalizeTenantActionResponse(
      response,
      "Tenant activated successfully."
    );
  } catch (error) {
    throw normalizeError(error);
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
    if (!tenantId) {
      throw new Error(
        "Tenant ID is required."
      );
    }

    const response =
      await tenantAPI.deactivateTenant(
        tenantId
      );

    return normalizeTenantActionResponse(
      response,
      "Tenant deactivated successfully."
    );
  } catch (error) {
    throw normalizeError(error);
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
    if (!tenantId) {
      throw new Error(
        "Tenant ID is required."
      );
    }

    const response =
      await tenantAPI.blacklistTenant(
        tenantId
      );

    return normalizeTenantActionResponse(
      response,
      "Tenant blacklisted successfully."
    );
  } catch (error) {
    throw normalizeError(error);
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
    if (!tenantId) {
      throw new Error(
        "Tenant ID is required."
      );
    }

    const response =
      await tenantAPI.setTenantPending(
        tenantId
      );

    return normalizeTenantActionResponse(
      response,
      "Tenant status changed to pending."
    );
  } catch (error) {
    throw normalizeError(error);
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
    if (!tenantId) {
      throw new Error(
        "Tenant ID is required."
      );
    }

    const response =
      await tenantAPI.verifyTenant(
        tenantId
      );

    return normalizeTenantActionResponse(
      response,
      "Tenant verified successfully."
    );
  } catch (error) {
    throw normalizeError(error);
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
    if (!tenantId) {
      throw new Error(
        "Tenant ID is required."
      );
    }

    const response =
      await tenantAPI.unverifyTenant(
        tenantId
      );

    return normalizeTenantActionResponse(
      response,
      "Tenant verification removed successfully."
    );
  } catch (error) {
    throw normalizeError(error);
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

      /*
       * IMPORTANT
       * ---------------------------------------------------------------
       * Return the actual statistics object.
       *
       * Expected Laravel response:
       *
       * {
       *   status: true,
       *   code: 200,
       *   message: "Tenant statistics fetched successfully.",
       *   data: {
       *     total: 100,
       *     active: 70,
       *     pending: 10,
       *     inactive: 15,
       *     blacklisted: 5,
       *     verified: 80,
       *     unverified: 20
       *   }
       * }
       *
       * This returns:
       *
       * {
       *   total: 100,
       *   active: 70,
       *   ...
       * }
       */
      const statistics =
        getResponseData(response);

      if (
        statistics &&
        typeof statistics === "object"
      ) {
        return statistics;
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
      throw normalizeError(error);
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
    if (!tenantId) {
      throw new Error(
        "Tenant ID is required."
      );
    }

    const response =
      await tenantAPI.restoreTenant(
        tenantId
      );

    return normalizeTenantActionResponse(
      response,
      "Tenant restored successfully."
    );
  } catch (error) {
    throw normalizeError(error);
  }
};


/*
|--------------------------------------------------------------------------
| FORCE DELETE TENANT
|--------------------------------------------------------------------------
*/

export const forceDeleteTenant = async (
  tenantId
) => {
  try {
    if (!tenantId) {
      throw new Error(
        "Tenant ID is required."
      );
    }

    const response =
      await tenantAPI.forceDeleteTenant(
        tenantId
      );

    return {
      tenantId,

      data:
        getResponseData(response),

      message:
        getResponseMessage(
          response,
          "Tenant permanently deleted successfully."
        ),

      status:
        getResponseStatus(response),
    };
  } catch (error) {
    throw normalizeError(error);
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