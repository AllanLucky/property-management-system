import api from "./axios";

/*
|--------------------------------------------------------------------------
| Tenancy API
|--------------------------------------------------------------------------
|
| Centralized API communication for tenancy management.
|
*/

const TENANCY_ENDPOINT = "/tenancies";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Validate tenancy ID.
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
 * Validate request data.
 */
const validateData = (data, message = "Request data is required.") => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(message);
  }

  return data;
};

/**
 * Preserve the original Axios error.
 *
 * This is important because Redux/hooks/components need access to:
 *
 * error.response.status
 * error.response.data.message
 * error.response.data.errors
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
 * GET /api/tenancies
 */
export const getTenancies = async (params = {}) => {
  try {
    const response = await api.get(TENANCY_ENDPOINT, {
      params,
    });

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get one tenancy.
 *
 * GET /api/tenancies/{tenancy}
 */
export const getTenancy = async (tenancyId) => {
  try {
    const id = validateTenancyId(tenancyId);

    const response = await api.get(
      `${TENANCY_ENDPOINT}/${id}`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create tenancy.
 *
 * POST /api/tenancies
 */
export const createTenancy = async (data) => {
  try {
    validateData(data, "Tenancy data is required.");

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
 * Update tenancy.
 *
 * PUT /api/tenancies/{tenancy}
 */
export const updateTenancy = async (
  tenancyId,
  data
) => {
  try {
    const id = validateTenancyId(tenancyId);

    validateData(data, "Tenancy data is required.");

    const response = await api.put(
      `${TENANCY_ENDPOINT}/${id}`,
      data
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Partially update tenancy.
 *
 * PATCH /api/tenancies/{tenancy}
 */
export const patchTenancy = async (
  tenancyId,
  data
) => {
  try {
    const id = validateTenancyId(tenancyId);

    validateData(data, "Tenancy data is required.");

    const response = await api.patch(
      `${TENANCY_ENDPOINT}/${id}`,
      data
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Soft delete tenancy.
 *
 * DELETE /api/tenancies/{tenancy}
 */
export const deleteTenancy = async (tenancyId) => {
  try {
    const id = validateTenancyId(tenancyId);

    const response = await api.delete(
      `${TENANCY_ENDPOINT}/${id}`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/*
|--------------------------------------------------------------------------
| SEARCH
|--------------------------------------------------------------------------
*/

/**
 * Search tenancies.
 *
 * GET /api/tenancies/search
 */
export const searchTenancies = async (
  search = "",
  params = {}
) => {
  try {
    const response = await api.get(
      `${TENANCY_ENDPOINT}/search`,
      {
        params: {
          ...params,
          search,
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
 * Get active tenancies.
 *
 * GET /api/tenancies/active
 *
 * IMPORTANT:
 * Do not add status here.
 * The backend route already identifies this endpoint.
 */
export const getActiveTenancies = async (
  params = {}
) => {
  try {
    const response = await api.get(
      `${TENANCY_ENDPOINT}/active`,
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
        params,
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
        params,
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
        params,
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
| STATISTICS
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
| STATUS MANAGEMENT
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
    const id = validateTenancyId(tenancyId);

    const response = await api.patch(
      `${TENANCY_ENDPOINT}/${id}/activate`
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
    const id = validateTenancyId(tenancyId);

    const response = await api.patch(
      `${TENANCY_ENDPOINT}/${id}/deactivate`
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
  data = {}
) => {
  try {
    const id = validateTenancyId(tenancyId);

    const response = await api.patch(
      `${TENANCY_ENDPOINT}/${id}/renew`,
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
    const id = validateTenancyId(tenancyId);

    const response = await api.patch(
      `${TENANCY_ENDPOINT}/${id}/terminate`,
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
    const id = validateTenancyId(tenancyId);

    const response = await api.patch(
      `${TENANCY_ENDPOINT}/${id}/cancel`,
      data
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/*
|--------------------------------------------------------------------------
| UNIT ASSIGNMENT
|--------------------------------------------------------------------------
*/

/**
 * Assign unit to tenant.
 *
 * POST /api/tenancies/assign-unit
 */
export const assignUnitToTenant = async (
  data
) => {
  try {
    validateData(data, "Assignment data is required.");

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
| RESTORE
|--------------------------------------------------------------------------
*/

/**
 * Restore soft-deleted tenancy.
 *
 * PATCH /api/tenancies/{id}/restore
 */
export const restoreTenancy = async (
  tenancyId
) => {
  try {
    const id = validateTenancyId(tenancyId);

    const response = await api.patch(
      `${TENANCY_ENDPOINT}/${id}/restore`
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
 * Permanently delete tenancy.
 *
 * DELETE /api/tenancies/{id}/force
 */
export const forceDeleteTenancy = async (
  tenancyId
) => {
  try {
    const id = validateTenancyId(tenancyId);

    const response = await api.delete(
      `${TENANCY_ENDPOINT}/${id}/force`
    );

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

/*
|--------------------------------------------------------------------------
| CONVENIENCE FILTERS
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
    if (
      tenantId === undefined ||
      tenantId === null ||
      tenantId === ""
    ) {
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
    if (
      propertyId === undefined ||
      propertyId === null ||
      propertyId === ""
    ) {
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
    if (
      apartmentId === undefined ||
      apartmentId === null ||
      apartmentId === ""
    ) {
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
    if (
      unitId === undefined ||
      unitId === null ||
      unitId === ""
    ) {
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
| DEFAULT EXPORT
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

  // Restore / force delete
  restoreTenancy,
  forceDeleteTenancy,

  // Convenience filters
  getTenanciesByTenant,
  getTenanciesByProperty,
  getTenanciesByApartment,
  getTenanciesByUnit,
};

export default tenancyApi;