import api from "./axios";

/*
|--------------------------------------------------------------------------
| Tenancy API
|--------------------------------------------------------------------------
|
| Centralized API service for tenancy management.
|
*/

const TENANCY_ENDPOINT = "/tenancies";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Validate tenancy ID before making a request.
 */
const validateTenancyId = (tenancyId) => {
  if (
    tenancyId === undefined ||
    tenancyId === null ||
    tenancyId === ""
  ) {
    throw new Error("Tenancy ID is required.");
  }

  return tenancyId;
};

/**
 * Normalize API errors.
 *
 * Axios errors are intentionally not swallowed here.
 * This allows Redux/hooks/components to access:
 *
 * error.response.data.message
 * error.response.data.errors
 * error.response.status
 */
const handleApiError = (error) => {
  throw error;
};

/*
|--------------------------------------------------------------------------
| CRUD
|--------------------------------------------------------------------------
*/

/**
 * Get all tenancies.
 *
 * Supported parameters may include:
 *
 * - page
 * - per_page
 * - search
 * - status
 * - tenant_id
 * - property_id
 * - apartment_id
 * - unit_id
 * - payment_frequency
 * - start_date
 * - end_date
 * - sort_by
 * - sort_order
 */
export const getTenancies = async (params = {}) => {
  try {
    const response = await api.get(
      TENANCY_ENDPOINT,
      {
        params,
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get one tenancy.
 */
export const getTenancy = async (tenancyId) => {
  try {
    tenancyId = validateTenancyId(tenancyId);

    const response = await api.get(
      `${TENANCY_ENDPOINT}/${tenancyId}`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create tenancy.
 */
export const createTenancy = async (data) => {
  try {
    const response = await api.post(
      TENANCY_ENDPOINT,
      data
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Update tenancy using PUT.
 */
export const updateTenancy = async (
  tenancyId,
  data
) => {
  try {
    tenancyId = validateTenancyId(tenancyId);

    const response = await api.put(
      `${TENANCY_ENDPOINT}/${tenancyId}`,
      data
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Partially update tenancy using PATCH.
 */
export const patchTenancy = async (
  tenancyId,
  data
) => {
  try {
    tenancyId = validateTenancyId(tenancyId);

    const response = await api.patch(
      `${TENANCY_ENDPOINT}/${tenancyId}`,
      data
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete tenancy.
 *
 * IMPORTANT:
 *
 * Backend now accepts the ID manually:
 *
 * DELETE /api/tenancies/{tenancy}
 *
 * If the tenancy does not exist, the backend should return
 * a controlled 404 response such as:
 *
 * {
 *   "status": false,
 *   "code": 404,
 *   "message": "Tenancy not found."
 * }
 */
export const deleteTenancy = async (tenancyId) => {
  try {
    tenancyId = validateTenancyId(tenancyId);

    const response = await api.delete(
      `${TENANCY_ENDPOINT}/${tenancyId}`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
*/

/**
 * Search tenancies.
 *
 * Laravel route:
 *
 * GET /api/tenancies/search
 *
 * Controller:
 * TenancyController@index
 */
export const searchTenancies = async (
  search,
  params = {}
) => {
  try {
    const response = await api.get(
      `${TENANCY_ENDPOINT}/search`,
      {
        params: {
          ...params,
          search: search ?? "",
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
| Status Filters
|--------------------------------------------------------------------------
*/

/**
 * Get active tenancies.
 *
 * GET /api/tenancies/active
 */
export const getActiveTenancies = async (
  params = {}
) => {
  try {
    const response = await api.get(
      `${TENANCY_ENDPOINT}/active`,
      {
        params: {
          ...params,
          status: "active",
        },
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get pending tenancies.
 *
 * GET /api/tenancies/pending
 */
export const getPendingTenancies = async (
  params = {}
) => {
  try {
    const response = await api.get(
      `${TENANCY_ENDPOINT}/pending`,
      {
        params: {
          ...params,
          status: "pending",
        },
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get expired tenancies.
 *
 * GET /api/tenancies/expired
 */
export const getExpiredTenancies = async (
  params = {}
) => {
  try {
    const response = await api.get(
      `${TENANCY_ENDPOINT}/expired`,
      {
        params: {
          ...params,
          status: "expired",
        },
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get terminated tenancies.
 *
 * GET /api/tenancies/terminated
 */
export const getTerminatedTenancies = async (
  params = {}
) => {
  try {
    const response = await api.get(
      `${TENANCY_ENDPOINT}/terminated`,
      {
        params: {
          ...params,
          status: "terminated",
        },
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get cancelled tenancies.
 *
 * GET /api/tenancies/cancelled
 */
export const getCancelledTenancies = async (
  params = {}
) => {
  try {
    const response = await api.get(
      `${TENANCY_ENDPOINT}/cancelled`,
      {
        params: {
          ...params,
          status: "cancelled",
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
| Statistics
|--------------------------------------------------------------------------
*/

/**
 * Get tenancy statistics.
 *
 * GET /api/tenancies/statistics
 */
export const getTenancyStatistics = async () => {
  try {
    const response = await api.get(
      `${TENANCY_ENDPOINT}/statistics`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/*
|--------------------------------------------------------------------------
| Status Management
|--------------------------------------------------------------------------
*/

/**
 * Activate tenancy.
 *
 * PATCH /api/tenancies/{tenancy}/activate
 */
export const activateTenancy = async (
  tenancyId
) => {
  try {
    tenancyId = validateTenancyId(tenancyId);

    const response = await api.patch(
      `${TENANCY_ENDPOINT}/${tenancyId}/activate`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Deactivate tenancy.
 *
 * PATCH /api/tenancies/{tenancy}/deactivate
 */
export const deactivateTenancy = async (
  tenancyId
) => {
  try {
    tenancyId = validateTenancyId(tenancyId);

    const response = await api.patch(
      `${TENANCY_ENDPOINT}/${tenancyId}/deactivate`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Renew tenancy.
 *
 * PATCH /api/tenancies/{tenancy}/renew
 */
export const renewTenancy = async (
  tenancyId,
  data
) => {
  try {
    tenancyId = validateTenancyId(tenancyId);

    const response = await api.patch(
      `${TENANCY_ENDPOINT}/${tenancyId}/renew`,
      data
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Terminate tenancy.
 *
 * PATCH /api/tenancies/{tenancy}/terminate
 */
export const terminateTenancy = async (
  tenancyId,
  data = {}
) => {
  try {
    tenancyId = validateTenancyId(tenancyId);

    const response = await api.patch(
      `${TENANCY_ENDPOINT}/${tenancyId}/terminate`,
      data
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Cancel tenancy.
 *
 * PATCH /api/tenancies/{tenancy}/cancel
 */
export const cancelTenancy = async (
  tenancyId,
  data = {}
) => {
  try {
    tenancyId = validateTenancyId(tenancyId);

    const response = await api.patch(
      `${TENANCY_ENDPOINT}/${tenancyId}/cancel`,
      data
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/*
|--------------------------------------------------------------------------
| Unit Assignment
|--------------------------------------------------------------------------
*/

/**
 * Assign a unit to a tenant.
 *
 * POST /api/tenancies/assign-unit
 */
export const assignUnitToTenant = async (
  data
) => {
  try {
    const response = await api.post(
      `${TENANCY_ENDPOINT}/assign-unit`,
      data
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/*
|--------------------------------------------------------------------------
| Soft Delete / Restore
|--------------------------------------------------------------------------
*/

/**
 * Restore a soft-deleted tenancy.
 *
 * PATCH /api/tenancies/{id}/restore
 */
export const restoreTenancy = async (
  tenancyId
) => {
  try {
    tenancyId = validateTenancyId(tenancyId);

    const response = await api.patch(
      `${TENANCY_ENDPOINT}/${tenancyId}/restore`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/*
|--------------------------------------------------------------------------
| Force Delete
|--------------------------------------------------------------------------
*/

/**
 * Permanently delete tenancy.
 *
 * DELETE /api/tenancies/{id}/force
 */
export const forceDeleteTenancy = async (
  tenancyId
) => {
  try {
    tenancyId = validateTenancyId(tenancyId);

    const response = await api.delete(
      `${TENANCY_ENDPOINT}/${tenancyId}/force`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/*
|--------------------------------------------------------------------------
| Convenience Methods
|--------------------------------------------------------------------------
*/

/**
 * Get tenancies by tenant.
 */
export const getTenanciesByTenant = async (
  tenantId,
  params = {}
) => {
  try {
    if (!tenantId) {
      throw new Error("Tenant ID is required.");
    }

    const response = await api.get(
      TENANCY_ENDPOINT,
      {
        params: {
          ...params,
          tenant_id: tenantId,
        },
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get tenancies by property.
 */
export const getTenanciesByProperty = async (
  propertyId,
  params = {}
) => {
  try {
    if (!propertyId) {
      throw new Error("Property ID is required.");
    }

    const response = await api.get(
      TENANCY_ENDPOINT,
      {
        params: {
          ...params,
          property_id: propertyId,
        },
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get tenancies by apartment.
 */
export const getTenanciesByApartment = async (
  apartmentId,
  params = {}
) => {
  try {
    if (!apartmentId) {
      throw new Error("Apartment ID is required.");
    }

    const response = await api.get(
      TENANCY_ENDPOINT,
      {
        params: {
          ...params,
          apartment_id: apartmentId,
        },
      }
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get tenancies by unit.
 */
export const getTenanciesByUnit = async (
  unitId,
  params = {}
) => {
  try {
    if (!unitId) {
      throw new Error("Unit ID is required.");
    }

    const response = await api.get(
      TENANCY_ENDPOINT,
      {
        params: {
          ...params,
          unit_id: unitId,
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
| Default Export
|--------------------------------------------------------------------------
*/

const tenancyApi = {
  // CRUD
  getTenancies,
  getTenancy,
  createTenancy,
  updateTenancy,
  patchTenancy,
  deleteTenancy,

  // Search
  searchTenancies,

  // Status lists
  getActiveTenancies,
  getPendingTenancies,
  getExpiredTenancies,
  getTerminatedTenancies,
  getCancelledTenancies,

  // Statistics
  getTenancyStatistics,

  // Status management
  activateTenancy,
  deactivateTenancy,
  renewTenancy,
  terminateTenancy,
  cancelTenancy,

  // Assignment
  assignUnitToTenant,

  // Delete / restore
  restoreTenancy,
  forceDeleteTenancy,

  // Convenience filters
  getTenanciesByTenant,
  getTenanciesByProperty,
  getTenanciesByApartment,
  getTenanciesByUnit,
};

export default tenancyApi;