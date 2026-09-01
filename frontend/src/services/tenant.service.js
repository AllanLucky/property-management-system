import tenantAPI from "../api/tenant.api";

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Unwrap Axios response while also supporting an already-unwrapped
 * Laravel response.
 */
const unwrapResponse = (response) => {
  if (!response) {
    return null;
  }

  /*
   * Axios response:
   *
   * {
   *   data: {
   *     status: true,
   *     code: 200,
   *     message: "...",
   *     data: [...]
   *   },
   *   status: 200,
   *   headers: {...}
   * }
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
   * Already-unwrapped Laravel response.
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
 *
 * Example:
 *
 * {
 *   status: true,
 *   code: 200,
 *   data: {...}
 * }
 *
 * returns:
 *
 * {...}
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
 * Get response message.
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
 * Get response status.
 */
const getResponseStatus = (response) => {
  const payload = getResponseEnvelope(response);

  return payload?.status ?? true;
};


/**
 * Get response code.
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
 * Extract tenant collection from all supported Laravel response shapes.
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
   * Standard Laravel:
   *
   * {
   *   data: []
   * }
   */
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  /*
   * Nested paginator/resource:
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
   * {
   *   data: {
   *     tenants: []
   *   }
   * }
   */
  if (Array.isArray(payload?.data?.tenants)) {
    return payload.data.tenants;
  }

  /*
   * {
   *   tenants: []
   * }
   */
  if (Array.isArray(payload?.tenants)) {
    return payload.tenants;
  }

  return [];
};


/**
 * Normalize pagination metadata.
 */
const normalizePagination = (meta = {}) => {
  return {
    current_page: Number(
      meta?.current_page ??
      meta?.currentPage ??
      1
    ),

    last_page: Number(
      meta?.last_page ??
      meta?.lastPage ??
      1
    ),

    per_page: Number(
      meta?.per_page ??
      meta?.perPage ??
      15
    ),

    total: Number(
      meta?.total ??
      0
    ),

    from: Number(
      meta?.from ??
      0
    ),

    to: Number(
      meta?.to ??
      0
    ),
  };
};


/**
 * Get pagination metadata.
 */
const getPagination = (response) => {
  const payload = getResponseEnvelope(response);

  /*
   * Laravel resource pagination.
   */
  if (payload?.meta) {
    return normalizePagination(
      payload.meta
    );
  }

  /*
   * Nested paginator.
   */
  if (payload?.data?.meta) {
    return normalizePagination(
      payload.data.meta
    );
  }

  /*
   * Direct paginator.
   */
  if (
    payload?.current_page !== undefined ||
    payload?.last_page !== undefined ||
    payload?.total !== undefined
  ) {
    return normalizePagination(
      payload
    );
  }

  /*
   * Nested paginator.
   */
  if (
    payload?.data?.current_page !== undefined ||
    payload?.data?.last_page !== undefined
  ) {
    return normalizePagination(
      payload.data
    );
  }

  return normalizePagination();
};


/*
|--------------------------------------------------------------------------
| ID HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Extract tenant ID from:
 *
 * deleteTenant(15)
 *
 * deleteTenant("15")
 *
 * deleteTenant({
 *   id: 15
 * })
 *
 * deleteTenant({
 *   tenant_id: 15
 * })
 *
 * deleteTenant({
 *   tenant: {
 *     id: 15
 *   }
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
    const id =
      tenantOrId?.id ??
      tenantOrId?.tenant_id ??
      tenantOrId?.tenant?.id ??
      tenantOrId?.data?.id ??
      tenantOrId?.data?.tenant_id ??
      tenantOrId?.data?.tenant?.id ??
      null;

    if (
      id !== null &&
      id !== undefined &&
      String(id).trim() !== ""
    ) {
      return String(id).trim();
    }

    return null;
  }

  /*
   * Primitive ID.
   */
  const id = String(
    tenantOrId
  ).trim();

  return id || null;
};


/**
 * Require tenant ID.
 */
const requireTenantId = (tenantOrId) => {
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
| ERROR NORMALIZATION
|--------------------------------------------------------------------------
*/

/**
 * Normalize Axios/Laravel errors.
 *
 * Keeps the real Laravel error response so the UI can display
 * useful validation/server information.
 */
const normalizeError = (error) => {
  /*
   * Already normalized.
   */
  if (
    error &&
    typeof error === "object" &&
    error.raw &&
    error.message
  ) {
    return error;
  }

  /*
   * Plain string.
   */
  if (
    typeof error === "string"
  ) {
    const normalized =
      new Error(
        error
      );

    normalized.status = null;
    normalized.code = null;
    normalized.errors = null;
    normalized.raw = error;

    return normalized;
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
    error?.errors ??
    null;

  /*
   * Laravel validation/server error.
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

  const normalized =
    new Error(
      String(message)
    );

  normalized.status =
    response?.status ??
    responseData?.code ??
    error?.status ??
    null;

  normalized.code =
    responseData?.code ??
    response?.status ??
    error?.code ??
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
| TENANCY NORMALIZATION
|--------------------------------------------------------------------------
*/

/**
 * Preserve tenancy data returned by Laravel.
 *
 * The backend response can contain:
 *
 * tenancy
 * ├── property
 * ├── apartment
 * └── unit
 *
 * We intentionally do not remove or flatten those relationships.
 */
const normalizeTenancy = (tenancy) => {
  if (!tenancy) {
    return null;
  }

  return {
    ...tenancy,

    id:
      tenancy?.id ??
      null,

    tenancy_number:
      tenancy?.tenancy_number ??
      "",

    property_id:
      tenancy?.property_id ??
      null,

    apartment_id:
      tenancy?.apartment_id ??
      null,

    unit_id:
      tenancy?.unit_id ??
      null,

    tenant_id:
      tenancy?.tenant_id ??
      null,

    property:
      tenancy?.property ??
      null,

    apartment:
      tenancy?.apartment ??
      null,

    unit:
      tenancy?.unit ??
      null,
  };
};


/**
 * Normalize tenancy collection.
 */
const normalizeTenancies = (
  tenancies
) => {
  if (!Array.isArray(tenancies)) {
    return [];
  }

  return tenancies
    .map(normalizeTenancy)
    .filter(Boolean);
};


/*
|--------------------------------------------------------------------------
| TENANT NORMALIZATION
|--------------------------------------------------------------------------
*/

/**
 * Normalize a single tenant.
 *
 * IMPORTANT:
 *
 * TenantResource now keeps User identity inside:
 *
 * tenant.user
 *
 * Therefore the frontend reads:
 *
 * tenant.user.first_name
 * tenant.user.last_name
 * tenant.user.full_name
 * tenant.user.email
 * tenant.user.phone
 *
 * We also expose convenient top-level aliases for existing
 * frontend components.
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
    tenant =
      tenant.data;
  }

  /*
   * USER
   */
  const user =
    tenant?.user ??
    null;

  /*
   * USER IDENTITY
   *
   * User is the source of truth.
   */
  const firstName =
    user?.first_name ??
    tenant?.first_name ??
    "";

  const lastName =
    user?.last_name ??
    tenant?.last_name ??
    "";

  const otherNames =
    user?.other_names ??
    tenant?.other_names ??
    "";

  const email =
    user?.email ??
    tenant?.email ??
    "";

  const phone =
    user?.phone ??
    tenant?.phone ??
    "";

  const fullName =
    user?.full_name ??
    tenant?.full_name ??
    [
      firstName,
      otherNames,
      lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  /*
   * TENANT STATUS
   *
   * Do NOT read tenants.is_active from the database.
   *
   * The backend returns:
   *
   * tenant.status
   *
   * and User has its own account status.
   */
  const tenantStatus =
    tenant?.status ??
    tenant?.tenant_status ??
    "";

  /*
   * TENANT VERIFICATION
   */
  const isVerified =
    tenant?.is_verified !== undefined
      ? Boolean(
        tenant.is_verified
      )
      : Boolean(
        tenant?.verification?.is_verified ??
        false
      );

  /*
   * TENANCIES
   */
  const tenancies =
    normalizeTenancies(
      tenant?.tenancies
    );

  /*
   * ACTIVE TENANCIES
   */
  const activeTenancies =
    normalizeTenancies(
      tenant?.active_tenancies
    );

  /*
   * TENANCY COUNT
   */
  const tenancyCount =
    tenant?.tenancy_count !== undefined
      ? Number(
        tenant.tenancy_count
      )
      : tenancies.length;

  /*
   * ACTIVE TENANCY COUNT
   */
  const activeTenancyCount =
    tenant?.active_tenancy_count !== undefined
      ? Number(
        tenant.active_tenancy_count
      )
      : activeTenancies.length;

  return {
    /*
     * Preserve the complete backend response.
     */
    ...tenant,

    /*
     * Tenant identification.
     */
    id:
      tenant?.id ??
      null,

    tenant_number:
      tenant?.tenant_number ??
      "",

    user_id:
      tenant?.user_id ??
      user?.id ??
      null,

    /*
     * User relationship.
     */
    user,

    /*
     * Frontend compatibility aliases.
     */
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

    /*
     * Tenant profile.
     */
    date_of_birth:
      tenant?.date_of_birth ??
      user?.profile?.date_of_birth ??
      null,

    gender:
      tenant?.gender ??
      user?.profile?.gender ??
      null,

    /*
     * Identification.
     */
    id_number:
      tenant?.id_number ??
      tenant?.identification?.id_number ??
      null,

    passport_number:
      tenant?.passport_number ??
      tenant?.identification?.passport_number ??
      null,

    identification: {
      id_number:
        tenant?.id_number ??
        tenant?.identification?.id_number ??
        null,

      passport_number:
        tenant?.passport_number ??
        tenant?.identification?.passport_number ??
        null,
    },

    /*
     * Location.
     */
    country:
      tenant?.country ??
      tenant?.location?.country ??
      null,

    region:
      tenant?.region ??
      tenant?.location?.region ??
      null,

    county:
      tenant?.county ??
      tenant?.location?.county ??
      null,

    city:
      tenant?.city ??
      tenant?.location?.city ??
      null,

    area:
      tenant?.area ??
      tenant?.location?.area ??
      null,

    postal_code:
      tenant?.postal_code ??
      tenant?.location?.postal_code ??
      null,

    address:
      tenant?.address ??
      tenant?.location?.address ??
      user?.profile?.address ??
      null,

    location: {
      country:
        tenant?.country ??
        tenant?.location?.country ??
        null,

      region:
        tenant?.region ??
        tenant?.location?.region ??
        null,

      county:
        tenant?.county ??
        tenant?.location?.county ??
        null,

      city:
        tenant?.city ??
        tenant?.location?.city ??
        null,

      area:
        tenant?.area ??
        tenant?.location?.area ??
        null,

      postal_code:
        tenant?.postal_code ??
        tenant?.location?.postal_code ??
        null,

      address:
        tenant?.address ??
        tenant?.location?.address ??
        user?.profile?.address ??
        null,
    },

    /*
     * Employment.
     */
    occupation:
      tenant?.occupation ??
      tenant?.employment?.occupation ??
      null,

    employer:
      tenant?.employer ??
      tenant?.employment?.employer ??
      null,

    monthly_income:
      tenant?.monthly_income ??
      tenant?.employment?.monthly_income ??
      null,

    employment: {
      occupation:
        tenant?.occupation ??
        tenant?.employment?.occupation ??
        null,

      employer:
        tenant?.employer ??
        tenant?.employment?.employer ??
        null,

      monthly_income:
        tenant?.monthly_income ??
        tenant?.employment?.monthly_income ??
        null,
    },

    /*
     * Emergency contact.
     */
    emergency_contact: {
      name:
        tenant?.emergency_contact?.name ??
        tenant?.emergency_contact_name ??
        null,

      phone:
        tenant?.emergency_contact?.phone ??
        tenant?.emergency_contact_phone ??
        null,

      relationship:
        tenant?.emergency_contact?.relationship ??
        tenant?.emergency_contact_relationship ??
        null,
    },

    /*
     * Documents.
     */
    documents: {
      photo:
        tenant?.documents?.photo ??
        tenant?.photo ??
        null,

      id_front:
        tenant?.documents?.id_front ??
        tenant?.id_front ??
        null,

      id_back:
        tenant?.documents?.id_back ??
        tenant?.id_back ??
        null,
    },

    /*
     * Tenant verification.
     *
     * This is NOT the same as User email verification.
     */
    is_verified:
      isVerified,

    verified_at:
      tenant?.verified_at ??
      tenant?.verification?.verified_at ??
      null,

    verification: {
      is_verified:
        isVerified,

      verified_at:
        tenant?.verified_at ??
        tenant?.verification?.verified_at ??
        null,
    },

    /*
     * IMPORTANT:
     *
     * Do not expect verification_status from the tenants table
     * unless the backend explicitly returns it.
     */
    verification_status:
      tenant?.verification_status ??
      "",

    /*
     * Tenant status.
     */
    status:
      tenantStatus,

    status_label:
      tenant?.status_label ??
      "",

    /*
     * Derived active flag.
     *
     * This is calculated from the API response.
     * It does NOT require an is_active database column.
     */
    is_active:
      tenant?.is_active !== undefined
        ? Boolean(
          tenant.is_active
        )
        : String(
          tenantStatus
        ).toLowerCase() === "active",

    /*
     * Notes.
     */
    notes:
      tenant?.notes ??
      null,

    /*
     * Tenancies.
     *
     * Property, apartment and unit relationships are preserved.
     */
    tenancies,

    tenancy_count:
      tenancyCount,

    active_tenancies:
      activeTenancies,

    active_tenancy_count:
      activeTenancyCount,

    /*
     * Timestamps.
     */
    created_at:
      tenant?.created_at ??
      null,

    updated_at:
      tenant?.updated_at ??
      null,

    deleted_at:
      tenant?.deleted_at ??
      null,
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
 * Active tenants.
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
 * Pending tenants.
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
 * Inactive tenants.
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
 * Blacklisted tenants.
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
  const data =
    getResponseData(
      response
    );

  return {
    tenant:
      normalizeTenant(
        data
      ),

    data,

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

      /*
       * The backend must calculate statistics from
       * tenant.status rather than a nonexistent
       * tenants.is_active column.
       */
      if (
        statistics &&
        typeof statistics === "object" &&
        !Array.isArray(statistics)
      ) {
        return {
          ...statistics,

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

