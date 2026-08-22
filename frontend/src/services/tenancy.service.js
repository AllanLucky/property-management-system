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
   * Supported parameters can include:
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

    return response.data;
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

    return response.data;
  },

  /**
   * Partially update a tenancy.
   *
   * PATCH /api/tenancies/{tenancy}
   *
   * NOTE:
   * This method is kept for frontend flexibility.
   * Make sure your Laravel routes include a PATCH route
   * for the tenancy if you intend to use it.
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

    return response.data;
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

  /*
  |--------------------------------------------------------------------------
  | RENEW
  |--------------------------------------------------------------------------
  */

  /**
   * Renew tenancy.
   *
   * PATCH /api/tenancies/{tenancy}/renew
   *
   * Controller validation:
   *
   * end_date:
   * - required
   * - date
   * - after:today
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
   *
   * GET /api/tenancies?tenant_id={id}
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
   *
   * GET /api/tenancies?property_id={id}
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
   *
   * GET /api/tenancies?apartment_id={id}
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
   *
   * GET /api/tenancies?unit_id={id}
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