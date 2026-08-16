import api from "./axios";


export const getTenants = async (params = {}) => {
  const response = await api.get("/tenants", {
    params,
  });

  return response.data;
};


/**
 * Get single tenant
 */
export const getTenant = async (tenantId) => {
  const response = await api.get(`/tenants/${tenantId}`);

  return response.data;
};


/**
 * Create tenant
 */
export const createTenant = async (tenantData) => {
  const response = await api.post("/tenants", tenantData);

  return response.data;
};


/**
 * Update tenant
 */
export const updateTenant = async (tenantId, tenantData) => {
  const response = await api.put(
    `/tenants/${tenantId}`,
    tenantData
  );

  return response.data;
};


/**
 * Delete tenant
 */
export const deleteTenant = async (tenantId) => {
  const response = await api.delete(
    `/tenants/${tenantId}`
  );

  return response.data;
};

/**
 * Search tenants
 *
 * Params:
 * search
 * limit
 */
export const searchTenants = async (
  search,
  limit = 20
) => {
  const response = await api.get("/tenants/search", {
    params: {
      search,
      limit,
    },
  });

  return response.data;
};


/*
|--------------------------------------------------------------------------
| STATUS LISTS
|--------------------------------------------------------------------------
*/

/**
 * Get active tenants
 */
export const getActiveTenants = async () => {
  const response = await api.get("/tenants/active");

  return response.data;
};


/**
 * Get pending tenants
 */
export const getPendingTenants = async () => {
  const response = await api.get("/tenants/pending");

  return response.data;
};


/**
 * Get inactive tenants
 */
export const getInactiveTenants = async () => {
  const response = await api.get("/tenants/inactive");

  return response.data;
};


/**
 * Get blacklisted tenants
 */
export const getBlacklistedTenants = async () => {
  const response = await api.get("/tenants/blacklisted");

  return response.data;
};


/*
|--------------------------------------------------------------------------
| STATUS ACTIONS
|--------------------------------------------------------------------------
*/

/**
 * Activate tenant
 */
export const activateTenant = async (tenantId) => {
  const response = await api.patch(
    `/tenants/${tenantId}/activate`
  );

  return response.data;
};


/**
 * Deactivate tenant
 */
export const deactivateTenant = async (tenantId) => {
  const response = await api.patch(
    `/tenants/${tenantId}/deactivate`
  );

  return response.data;
};


/**
 * Blacklist tenant
 */
export const blacklistTenant = async (tenantId) => {
  const response = await api.patch(
    `/tenants/${tenantId}/blacklist`
  );

  return response.data;
};


/**
 * Set tenant status to pending
 */
export const setTenantPending = async (tenantId) => {
  const response = await api.patch(
    `/tenants/${tenantId}/pending`
  );

  return response.data;
};


/*
|--------------------------------------------------------------------------
| VERIFICATION
|--------------------------------------------------------------------------
*/

/**
 * Verify tenant
 */
export const verifyTenant = async (tenantId) => {
  const response = await api.patch(
    `/tenants/${tenantId}/verify`
  );

  return response.data;
};


/**
 * Remove tenant verification
 */
export const unverifyTenant = async (tenantId) => {
  const response = await api.patch(
    `/tenants/${tenantId}/unverify`
  );

  return response.data;
};


/*
|--------------------------------------------------------------------------
| STATISTICS
|--------------------------------------------------------------------------
*/

/**
 * Get tenant statistics
 */
export const getTenantStatistics = async () => {
  const response = await api.get(
    "/tenants/statistics"
  );

  return response.data;
};


/*
|--------------------------------------------------------------------------
| SOFT DELETE / RESTORE
|--------------------------------------------------------------------------
*/

/**
 * Restore soft-deleted tenant
 */
export const restoreTenant = async (tenantId) => {
  const response = await api.patch(
    `/tenants/${tenantId}/restore`
  );

  return response.data;
};


/**
 * Permanently delete tenant
 */
export const forceDeleteTenant = async (tenantId) => {
  const response = await api.delete(
    `/tenants/${tenantId}/force`
  );

  return response.data;
};


/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/

const tenantAPI = {
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

export default tenantAPI;