import api from "../api/axios";

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
 * Validate generic ID.
 */
const validateRelatedId = (
  id,
  message
) => {
  if (
    id === undefined ||
    id === null ||
    id === ""
  ) {
    throw new Error(message);
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

/**
 * Return normalized API data.
 *
 * Laravel responses normally look like:
 *
 * {
 *   status: true,
 *   code: 200,
 *   message: "...",
 *   data: [...]
 * }
 *
 * The service returns the complete response object
 * so Redux can access:
 *
 * response.data
 * response.message
 * response.status
 * response.code
 *
 * This is intentional for pagination and metadata.
 */
const normalizeResponse = (response) => {
  return response?.data ?? null;
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

    return normalizeResponse(response);
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

    return normalizeResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE
  |--------------------------------------------------------------------------
  */

  /**
   * Create a new tenancy.
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

    return normalizeResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE
  |--------------------------------------------------------------------------
  */

  /**
   * Update an existing tenancy.
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

    return normalizeResponse(response);
  },

  /**
   * Partially update a tenancy.
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

    return normalizeResponse(response);
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

    return normalizeResponse(response);
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
   *
   * Example:
   *
   * tenancyService.searchTenancies("TEN-123");
   */
  async searchTenancies(
    search = "",
    params = {}
  ) {
    const response = await api.get(
      `${BASE_URL}/search`,
      {
        params: {
          ...params,
          search,
        },
      }
    );

    return normalizeResponse(response);
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

    return normalizeResponse(response);
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

    return normalizeResponse(response);
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

    return normalizeResponse(response);
  },

  /**
   * Fetch terminated tenancies.
   *
   * GET /api/tenancies/terminated
   */
  async getTerminatedTenancies(
    params = {}
  ) {
    const response = await api.get(
      `${BASE_URL}/terminated`,
      {
        params,
      }
    );

    return normalizeResponse(response);
  },

  /**
   * Fetch cancelled tenancies.
   *
   * GET /api/tenancies/cancelled
   */
  async getCancelledTenancies(
    params = {}
  ) {
    const response = await api.get(
      `${BASE_URL}/cancelled`,
      {
        params,
      }
    );

    return normalizeResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | RESTORE
  |--------------------------------------------------------------------------
  */

  /**
   * Restore a soft-deleted tenancy.
   *
   * PATCH /api/tenancies/{id}/restore
   */
  async restoreTenancy(id) {
    const tenancyId = validateId(id);

    const response = await api.patch(
      `${BASE_URL}/${tenancyId}/restore`
    );

    return normalizeResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | FORCE DELETE
  |--------------------------------------------------------------------------
  */

  /**
   * Permanently delete a tenancy.
   *
   * DELETE /api/tenancies/{id}/force
   */
  async forceDeleteTenancy(id) {
    const tenancyId = validateId(id);

    const response = await api.delete(
      `${BASE_URL}/${tenancyId}/force`
    );

    return normalizeResponse(response);
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

    return normalizeResponse(response);
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

    return normalizeResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | RENEW
  |--------------------------------------------------------------------------
  */

  /**
   * Renew tenancy.
   *
   * PATCH /api/tenancies/{tenancy}/renew
   */
  async renewTenancy(
    id,
    data = {}
  ) {
    const tenancyId = validateId(id);

    validateData(
      data,
      "Renewal data is required."
    );

    const response = await api.patch(
      `${BASE_URL}/${tenancyId}/renew`,
      data
    );

    return normalizeResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | TERMINATE
  |--------------------------------------------------------------------------
  */

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

    validateData(
      data,
      "Termination data is required."
    );

    const response = await api.patch(
      `${BASE_URL}/${tenancyId}/terminate`,
      data
    );

    return normalizeResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

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

    validateData(
      data,
      "Cancellation data is required."
    );

    const response = await api.patch(
      `${BASE_URL}/${tenancyId}/cancel`,
      data
    );

    return normalizeResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | UNIT ASSIGNMENT
  |--------------------------------------------------------------------------
  */

  /**
   * Assign a unit to a tenant.
   *
   * POST /api/tenancies/assign-unit
   *
   * Expected data:
   *
   * {
   *   tenant_id,
   *   unit_id,
   *   start_date,
   *   end_date,
   *   rent_amount,
   *   deposit_amount
   * }
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

    return normalizeResponse(response);
  },

  /**
   * Alias used by some Redux/component code.
   *
   * POST /api/tenancies/assign-unit
   */
  async assignUnitToTenant(data) {
    validateData(
      data,
      "Assignment data is required."
    );

    const response = await api.post(
      `${BASE_URL}/assign-unit`,
      data
    );

    return normalizeResponse(response);
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

    return normalizeResponse(response);
  },

  /**
   * Alias for Redux/component compatibility.
   */
  async getTenancyStatistics() {
    const response = await api.get(
      `${BASE_URL}/statistics`
    );

    return normalizeResponse(response);
  },

  /*
  |--------------------------------------------------------------------------
  | CONVENIENCE FILTERS
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch tenancies belonging to a tenant.
   *
   * GET /api/tenancies?tenant_id={id}
   */
  async getTenanciesByTenant(
    tenantId,
    params = {}
  ) {
    const id = validateRelatedId(
      tenantId,
      "Tenant ID is required."
    );

    const response = await api.get(
      BASE_URL,
      {
        params: {
          ...params,
          tenant_id: id,
        },
      }
    );

    return normalizeResponse(response);
  },

  /**
   * Fetch tenancies belonging to a property.
   *
   * GET /api/tenancies?property_id={id}
   */
  async getTenanciesByProperty(
    propertyId,
    params = {}
  ) {
    const id = validateRelatedId(
      propertyId,
      "Property ID is required."
    );

    const response = await api.get(
      BASE_URL,
      {
        params: {
          ...params,
          property_id: id,
        },
      }
    );

    return normalizeResponse(response);
  },

  /**
   * Fetch tenancies belonging to an apartment.
   *
   * GET /api/tenancies?apartment_id={id}
   */
  async getTenanciesByApartment(
    apartmentId,
    params = {}
  ) {
    const id = validateRelatedId(
      apartmentId,
      "Apartment ID is required."
    );

    const response = await api.get(
      BASE_URL,
      {
        params: {
          ...params,
          apartment_id: id,
        },
      }
    );

    return normalizeResponse(response);
  },

  /**
   * Fetch tenancies belonging to a unit.
   *
   * GET /api/tenancies?unit_id={id}
   */
  async getTenanciesByUnit(
    unitId,
    params = {}
  ) {
    const id = validateRelatedId(
      unitId,
      "Unit ID is required."
    );

    const response = await api.get(
      BASE_URL,
      {
        params: {
          ...params,
          unit_id: id,
        },
      }
    );

    return normalizeResponse(response);
  },
};

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default tenancyService;