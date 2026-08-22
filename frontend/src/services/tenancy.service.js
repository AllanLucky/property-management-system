import api from "../api/axios";

/**
 * Tenancy Service
 *
 * Handles all API communication related to tenancies.
 */

const BASE_URL = "/tenancies";

const tenancyService = {
  /*
  |--------------------------------------------------------------------------
  | TENANCY LISTING
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch all tenancies.
   *
   * Supports:
   * - pagination
   * - search
   * - filters
   * - sorting
   */
  async getTenancies(params = {}) {
    const response = await api.get(BASE_URL, {
      params,
    });

    return response.data;
  },

  /**
   * Search tenancies.
   *
   * The backend currently uses the index method for search.
   */
  async searchTenancies(params = {}) {
    const response = await api.get(`${BASE_URL}/search`, {
      params,
    });

    return response.data;
  },

  /**
   * Fetch active tenancies.
   */
  async getActiveTenancies(params = {}) {
    const response = await api.get(`${BASE_URL}/active`, {
      params: {
        ...params,
        status: "active",
      },
    });

    return response.data;
  },

  /**
   * Fetch pending tenancies.
   */
  async getPendingTenancies(params = {}) {
    const response = await api.get(`${BASE_URL}/pending`, {
      params: {
        ...params,
        status: "pending",
      },
    });

    return response.data;
  },

  /**
   * Fetch expired tenancies.
   */
  async getExpiredTenancies(params = {}) {
    const response = await api.get(`${BASE_URL}/expired`, {
      params: {
        ...params,
        status: "expired",
      },
    });

    return response.data;
  },

  /**
   * Fetch terminated tenancies.
   */
  async getTerminatedTenancies(params = {}) {
    const response = await api.get(`${BASE_URL}/terminated`, {
      params: {
        ...params,
        status: "terminated",
      },
    });

    return response.data;
  },

  /**
   * Fetch cancelled tenancies.
   */
  async getCancelledTenancies(params = {}) {
    const response = await api.get(`${BASE_URL}/cancelled`, {
      params: {
        ...params,
        status: "cancelled",
      },
    });

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | TENANCY DETAILS
  |--------------------------------------------------------------------------
  */

  /**
   * Fetch one tenancy by ID.
   */
  async getTenancy(id) {
    if (!id) {
      throw new Error("Tenancy ID is required.");
    }

    const response = await api.get(`${BASE_URL}/${id}`);

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE TENANCY
  |--------------------------------------------------------------------------
  */

  /**
   * Create a new tenancy.
   */
  async createTenancy(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Tenancy data is required.");
    }

    const response = await api.post(BASE_URL, data);

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE TENANCY
  |--------------------------------------------------------------------------
  */

  /**
   * Update an existing tenancy.
   *
   * Uses PUT.
   */
  async updateTenancy(id, data) {
    if (!id) {
      throw new Error("Tenancy ID is required.");
    }

    if (!data || typeof data !== "object") {
      throw new Error("Tenancy data is required.");
    }

    const response = await api.put(`${BASE_URL}/${id}`, data);

    return response.data;
  },

  /**
   * Partially update an existing tenancy.
   *
   * Uses PATCH.
   */
  async patchTenancy(id, data) {
    if (!id) {
      throw new Error("Tenancy ID is required.");
    }

    if (!data || typeof data !== "object") {
      throw new Error("Tenancy data is required.");
    }

    const response = await api.patch(`${BASE_URL}/${id}`, data);

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | DELETE TENANCY
  |--------------------------------------------------------------------------
  */

  /**
   * Soft delete a tenancy.
   */
  async deleteTenancy(id) {
    if (!id) {
      throw new Error("Tenancy ID is required.");
    }

    const response = await api.delete(`${BASE_URL}/${id}`);

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | STATUS MANAGEMENT
  |--------------------------------------------------------------------------
  */

  /**
   * Activate tenancy.
   */
  async activateTenancy(id) {
    if (!id) {
      throw new Error("Tenancy ID is required.");
    }

    const response = await api.patch(`${BASE_URL}/${id}/activate`);

    return response.data;
  },

  /**
   * Deactivate tenancy.
   */
  async deactivateTenancy(id) {
    if (!id) {
      throw new Error("Tenancy ID is required.");
    }

    const response = await api.patch(`${BASE_URL}/${id}/deactivate`);

    return response.data;
  },

  /**
   * Renew tenancy.
   *
   * Example:
   * {
   *   end_date: "2027-07-30"
   * }
   */
  async renewTenancy(id, data) {
    if (!id) {
      throw new Error("Tenancy ID is required.");
    }

    if (!data || typeof data !== "object") {
      throw new Error("Renewal data is required.");
    }

    const response = await api.patch(`${BASE_URL}/${id}/renew`, data);

    return response.data;
  },

  /**
   * Terminate tenancy.
   */
  async terminateTenancy(id, data = {}) {
    if (!id) {
      throw new Error("Tenancy ID is required.");
    }

    const response = await api.patch(
      `${BASE_URL}/${id}/terminate`,
      data
    );

    return response.data;
  },

  /**
   * Cancel tenancy.
   */
  async cancelTenancy(id, data = {}) {
    if (!id) {
      throw new Error("Tenancy ID is required.");
    }

    const response = await api.patch(
      `${BASE_URL}/${id}/cancel`,
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
   * Example:
   * {
   *   tenant_id: 2,
   *   unit_id: 344,
   *   start_date: "2026-08-01",
   *   end_date: "2027-07-31",
   *   rent_amount: 60000,
   *   deposit_amount: 60000
   * }
   */
  async assignUnit(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Assignment data is required.");
    }

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
   * Restore a soft-deleted tenancy.
   */
  async restoreTenancy(id) {
    if (!id) {
      throw new Error("Tenancy ID is required.");
    }

    const response = await api.patch(
      `${BASE_URL}/${id}/restore`
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
   */
  async forceDeleteTenancy(id) {
    if (!id) {
      throw new Error("Tenancy ID is required.");
    }

    const response = await api.delete(
      `${BASE_URL}/${id}/force`
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
   */
  async getStatistics() {
    const response = await api.get(
      `${BASE_URL}/statistics`
    );

    return response.data;
  },
};

export default tenancyService;