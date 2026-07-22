import api from "./axios";

/**
 * Property Analytics API
 */
const propertyAnalyticsAPI = {
  /**
   * Get all property analytics
   * GET /property-analytics
   */
  getAll: async (params = {}) => {
    const response = await api.get("/property-analytics", { params });
    return response.data;
  },

  /**
   * Get paginated property analytics
   * GET /property-analytics?page=1
   */
  getPaginated: async (params = {}) => {
    const response = await api.get("/property-analytics", { params });
    return response.data;
  },

  /**
   * Get single property analytics
   * GET /property-analytics/:id
   */
  getById: async (id) => {
    const response = await api.get(`/property-analytics/${id}`);
    return response.data;
  },

  /**
   * Create property analytics
   * POST /property-analytics
   */
  create: async (data) => {
    const response = await api.post("/property-analytics", data);
    return response.data;
  },

  /**
   * Update property analytics
   * PUT /property-analytics/:id
   */
  update: async (id, data) => {
    const response = await api.put(`/property-analytics/${id}`, data);
    return response.data;
  },

  /**
   * Delete property analytics
   * DELETE /property-analytics/:id
   */
  delete: async (id) => {
    const response = await api.delete(`/property-analytics/${id}`);
    return response.data;
  },

  /**
   * Refresh analytics (optional endpoint)
   * POST /property-analytics/:id/refresh
   */
  refresh: async (id) => {
    const response = await api.post(`/property-analytics/${id}/refresh`);
    return response.data;
  },

  /**
   * Get analytics summary (optional endpoint)
   * GET /property-analytics/summary
   */
  getSummary: async () => {
    const response = await api.get("/property-analytics/summary");
    return response.data;
  },

  /**
   * Export analytics (optional endpoint)
   * GET /property-analytics/export
   */
  export: async (params = {}) => {
    const response = await api.get("/property-analytics/export", {
      params,
      responseType: "blob",
    });

    return response;
  },
};

export default propertyAnalyticsAPI;