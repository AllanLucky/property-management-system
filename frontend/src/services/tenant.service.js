import tenantAPI from "../api/tenant.api";

/*
|--------------------------------------------------------------------------
| RESPONSE HELPERS
|--------------------------------------------------------------------------
*/

const getResponseData = (response) => {
  return response?.data ?? null;
};

const getCollectionData = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

const getPagination = (response) => {
  if (response?.meta) {
    return response.meta;
  }

  if (response?.data?.meta) {
    return response.data.meta;
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

  return {
    message:
      response?.data?.message ||
      response?.data?.error ||
      error?.message ||
      "Something went wrong.",

    status: response?.status ?? null,

    code:
      response?.data?.code ??
      response?.status ??
      null,

    errors:
      response?.data?.errors ??
      response?.data?.data?.errors ??
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

  return {
    ...tenant,

    id: tenant.id ?? null,

    tenant_number:
      tenant.tenant_number ?? "",

    user_id:
      tenant.user_id ?? null,

    first_name:
      tenant.first_name ?? "",

    last_name:
      tenant.last_name ?? "",

    other_names:
      tenant.other_names ?? "",

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
      tenant.email ?? "",

    phone:
      tenant.phone ?? "",

    status:
      tenant.status ?? "",

    is_active:
      Boolean(tenant.is_active),

    is_verified:
      Boolean(tenant.is_verified),
  };
};


const normalizeTenants = (tenants) => {
  return Array.isArray(tenants)
    ? tenants.map(normalizeTenant)
    : [];
};


/*
|--------------------------------------------------------------------------
| GET TENANTS
|--------------------------------------------------------------------------
*/

export const getTenants = async (params = {}) => {
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
        response?.message ||
        "Tenants fetched successfully.",

      status:
        response?.status ?? true,
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

export const getTenant = async (tenantId) => {
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
        response?.message ||
        "Tenant fetched successfully.",

      status:
        response?.status ?? true,
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
        response?.message ||
        "Tenant created successfully.",

      status:
        response?.status ?? true,
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
        response?.message ||
        "Tenant updated successfully.",

      status:
        response?.status ?? true,
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
      data:
        getResponseData(response),

      message:
        response?.message ||
        "Tenant deleted successfully.",

      status:
        response?.status ?? true,
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
| STATUS ACTIONS
|--------------------------------------------------------------------------
*/

export const activateTenant = async (
  tenantId
) => {
  try {
    const response =
      await tenantAPI.activateTenant(
        tenantId
      );

    return normalizeTenant(
      getResponseData(response)
    );
  } catch (error) {
    throw normalizeError(error);
  }
};


export const deactivateTenant = async (
  tenantId
) => {
  try {
    const response =
      await tenantAPI.deactivateTenant(
        tenantId
      );

    return normalizeTenant(
      getResponseData(response)
    );
  } catch (error) {
    throw normalizeError(error);
  }
};


export const blacklistTenant = async (
  tenantId
) => {
  try {
    const response =
      await tenantAPI.blacklistTenant(
        tenantId
      );

    return normalizeTenant(
      getResponseData(response)
    );
  } catch (error) {
    throw normalizeError(error);
  }
};


export const setTenantPending = async (
  tenantId
) => {
  try {
    const response =
      await tenantAPI.setTenantPending(
        tenantId
      );

    return normalizeTenant(
      getResponseData(response)
    );
  } catch (error) {
    throw normalizeError(error);
  }
};


/*
|--------------------------------------------------------------------------
| VERIFICATION
|--------------------------------------------------------------------------
*/

export const verifyTenant = async (
  tenantId
) => {
  try {
    const response =
      await tenantAPI.verifyTenant(
        tenantId
      );

    return normalizeTenant(
      getResponseData(response)
    );
  } catch (error) {
    throw normalizeError(error);
  }
};


export const unverifyTenant = async (
  tenantId
) => {
  try {
    const response =
      await tenantAPI.unverifyTenant(
        tenantId
      );

    return normalizeTenant(
      getResponseData(response)
    );
  } catch (error) {
    throw normalizeError(error);
  }
};


/*
|--------------------------------------------------------------------------
| STATISTICS
|--------------------------------------------------------------------------
*/

export const getTenantStatistics =
  async () => {
    try {
      const response =
        await tenantAPI.getTenantStatistics();

      return getResponseData(response);
    } catch (error) {
      throw normalizeError(error);
    }
  };


/*
|--------------------------------------------------------------------------
| RESTORE
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

    return normalizeTenant(
      getResponseData(response)
    );
  } catch (error) {
    throw normalizeError(error);
  }
};


/*
|--------------------------------------------------------------------------
| FORCE DELETE
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
      data:
        getResponseData(response),

      message:
        response?.message ||
        "Tenant permanently deleted successfully.",

      status:
        response?.status ?? true,
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