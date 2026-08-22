import api from "../api/axios";

/*
|--------------------------------------------------------------------------
| Tenancy Service
|--------------------------------------------------------------------------
|
| Centralized API service for tenancy management.
|
| Backend base endpoint:
| /api/tenancies
|
*/

const BASE_URL = "/tenancies";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Validate tenancy ID.
 */
const validateId = (id) => {
  if (
    id === undefined ||
    id === null ||
    id === ""
  ) {
    throw new Error("Tenancy ID is required.");
  }

  return id;
};

/**
 * Validate request data.
 */
const validateData = (
  data,
  message = "Request data is required."
) => {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    throw new Error(message);
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| Tenancy Service
|--------------------------------------------------------------------------
*/

const tenancyService = {
  /*
  |--------------------------------------------------------------------------
  | LIST
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch all tenancies.
   *
   * GET /api/tenancies
   *
   * Supported parameters:
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
  async getTenancies(params = {}) {
    const response = await api.get(
      BASE_URL,
      {
        params,
      }
    );

    return response.data;
  },

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
  async searchTenancies(params = {}) {
    const response = await api.get(
      `${BASE_URL}/search`,
      {
        params,
      }
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | STATUS LISTS
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch active tenancies.
   *
   * GET /api/tenancies/active
   */
  async getActiveTenancies(params = {}) {
    const response = await api.get(
      `${BASE_URL}/active`,
      {
        params,
      }
    );

    return response.data;
  },

  /**
   * Fetch pending tenancies.
   *
   * GET /api/tenancies/pending
   */
  async getPendingTenancies(params = {}) {
    const response = await api.get(
      `${BASE_URL}/pending`,
      {
        params,
      }
    );

    return response.data;
  },

  /**
   * Fetch expired tenancies.
   *
   * GET /api/tenancies/expired
   */
  async getExpiredTenancies(params = {}) {
    const response = await api.get(
      `${BASE_URL}/expired`,
      {
        params,
      }
    );

    return response.data;
  },

  /**
   * Fetch terminated tenancies.
   *
   * GET /api/tenancies/terminated
   */
  async getTerminatedTenancies(params = {}) {
    const response = await api.get(
      `${BASE_URL}/terminated`,
      {
        params,
      }
    );

    return response.data;
  },

  /**
   * Fetch cancelled tenancies.
   *
   * GET /api/tenancies/cancelled
   */
  async getCancelledTenancies(params = {}) {
    const response = await api.get(
      `${BASE_URL}/cancelled`,
      {
        params,
      }
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | DETAILS
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch a single tenancy.
   *
   * GET /api/tenancies/{tenancy}
   */
  async getTenancy(id) {
    const tenancyId = validateId(id);

    const response = await api.get(
      `${BASE_URL}/${tenancyId}`
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE
  |--------------------------------------------------------------------------
  */

  /**
   * Create tenancy.
   *
   * POST /api/tenancies
   */
  async createTenancy(data) {
    validateData(
      data,
      "Tenancy data is required."
    );

    const response = await api.post(
      BASE_URL,
      data
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE
  |--------------------------------------------------------------------------
  */

  /**
   * Update tenancy.
   *
   * PUT /api/tenancies/{tenancy}
   */
  async updateTenancy(id, data) {
    const tenancyId = validateId(id);

    validateData(
      data,
      "Tenancy data is required."
    );

    const response = await api.put(
      `${BASE_URL}/${tenancyId}`,
      data
    );

    return response.data;
  },

  /**
   * Partially update tenancy.
   *
   * PATCH /api/tenancies/{tenancy}
   */
  async patchTenancy(id, data) {
    const tenancyId = validateId(id);

    validateData(
      data,
      "Tenancy data is required."
    );

    const response = await api.patch(
      `${BASE_URL}/${tenancyId}`,
      data
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  /**
   * Soft delete tenancy.
   *
   * DELETE /api/tenancies/{tenancy}
   */
  async deleteTenancy(id) {
    const tenancyId = validateId(id);

    const response = await api.delete(
      `${BASE_URL}/${tenancyId}`
    );

    return response.data;
  },

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
  async activateTenancy(id) {
    const tenancyId = validateId(id);

    const response = await api.patch(
      `${BASE_URL}/${tenancyId}/activate`
    );

    return response.data;
  },

  /**
   * Deactivate tenancy.
   *
   * PATCH /api/tenancies/{tenancy}/deactivate
   */
  async deactivateTenancy(id) {
    const tenancyId = validateId(id);

    const response = await api.patch(
      `${BASE_URL}/${tenancyId}/deactivate`
    );

    return response.data;
  },

  /**
   * Renew tenancy.
   *
   * PATCH /api/tenancies/{tenancy}/renew
   */
  async renewTenancy(id, data) {
    const tenancyId = validateId(id);

    validateData(
      data,
      "Renewal data is required."
    );

    const response = await api.patch(
      `${BASE_URL}/${tenancyId}/renew`,
      data
    );

    return response.data;
  },

  /**
   * Terminate tenancy.
   *
   * PATCH /api/tenancies/{tenancy}/terminate
   */
  async terminateTenancy(
    id,
    data = {}
  ) {
    const tenancyId = validateId(id);

    const response = await api.patch(
      `${BASE_URL}/${tenancyId}/terminate`,
      data
    );

    return response.data;
  },

  /**
   * Cancel tenancy.
   *
   * PATCH /api/tenancies/{tenancy}/cancel
   */
  async cancelTenancy(
    id,
    data = {}
  ) {
    const tenancyId = validateId(id);

    const response = await api.patch(
      `${BASE_URL}/${tenancyId}/cancel`,
      data
    );

    return response.data;
  },

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
  async assignUnit(data) {
    validateData(
      data,
      "Assignment data is required."
    );

    const response = await api.post(
      `${BASE_URL}/assign-unit`,
      data
    );

    return response.data;
  },

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
  async restoreTenancy(id) {
    const tenancyId = validateId(id);

    const response = await api.patch(
      `${BASE_URL}/${tenancyId}/restore`
    );

    return response.data;
  },

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
  async forceDeleteTenancy(id) {
    const tenancyId = validateId(id);

    const response = await api.delete(
      `${BASE_URL}/${tenancyId}/force`
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch tenancy statistics.
   *
   * GET /api/tenancies/statistics
   */
  async getStatistics() {
    const response = await api.get(
      `${BASE_URL}/statistics`
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | CONVENIENCE FILTERS
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch tenancies belonging to a tenant.
   */
  async getTenanciesByTenant(
    tenantId,
    params = {}
  ) {
    if (
      tenantId === undefined ||
      tenantId === null ||
      tenantId === ""
    ) {
      throw new Error(
        "Tenant ID is required."
      );
    }

    const response = await api.get(
      BASE_URL,
      {
        params: {
          ...params,
          tenant_id: tenantId,
        },
      }
    );

    return response.data;
  },

  /**
   * Fetch tenancies belonging to a property.
   */
  async getTenanciesByProperty(
    propertyId,
    params = {}
  ) {
    if (
      propertyId === undefined ||
      propertyId === null ||
      propertyId === ""
    ) {
      throw new Error(
        "Property ID is required."
      );
    }

    const response = await api.get(
      BASE_URL,
      {
        params: {
          ...params,
          property_id: propertyId,
        },
      }
    );

    return response.data;
  },

  /**
   * Fetch tenancies belonging to an apartment.
   */
  async getTenanciesByApartment(
    apartmentId,
    params = {}
  ) {
    if (
      apartmentId === undefined ||
      apartmentId === null ||
      apartmentId === ""
    ) {
      throw new Error(
        "Apartment ID is required."
      );
    }

    const response = await api.get(
      BASE_URL,
      {
        params: {
          ...params,
          apartment_id: apartmentId,
        },
      }
    );

    return response.data;
  },

  /**
   * Fetch tenancies belonging to a unit.
   */
  async getTenanciesByUnit(
    unitId,
    params = {}
  ) {
    if (
      unitId === undefined ||
      unitId === null ||
      unitId === ""
    ) {
      throw new Error(
        "Unit ID is required."
      );
    }

    const response = await api.get(
      BASE_URL,
      {
        params: {
          ...params,
          unit_id: unitId,
        },
      }
    );

    return response.data;
  },
};

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default tenancyService;