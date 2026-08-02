import api from "./axios";

/**
 * Apartment API
 */
const apartmentAPI = {


  /**
   * Get all apartments
   * GET /apartments
   */
  getAll: async (params = {}) => {

    const response = await api.get(
      "/apartments",
      {
        params,
      }
    );

    return response.data;

  },



  /**
   * Get paginated apartments
   * GET /apartments?page=1
   */
  getPaginated: async (params = {}) => {

    const response = await api.get(
      "/apartments",
      {
        params,
      }
    );

    return response.data;

  },



  /**
   * Get single apartment
   * GET /apartments/{id}
   */
  getById: async (id) => {

    const response = await api.get(
      `/apartments/${id}`
    );

    return response.data;

  },



  /**
   * Get apartments by property
   * GET /properties/{propertyId}/apartments
   */
  getByProperty: async (
    propertyId,
    params = {}
  ) => {

    const response = await api.get(
      `/properties/${propertyId}/apartments`,
      {
        params,
      }
    );

    return response.data;

  },



  /**
   * Create apartment
   * POST /apartments
   */
  create: async (data) => {

    const response = await api.post(
      "/apartments",
      data
    );

    return response.data;

  },



  /**
   * Update apartment
   * PUT /apartments/{id}
   */
  update: async (
    id,
    data
  ) => {

    const response = await api.put(
      `/apartments/${id}`,
      data
    );

    return response.data;

  },



  /**
   * Delete apartment
   * DELETE /apartments/{id}
   */
  delete: async (id) => {

    const response = await api.delete(
      `/apartments/${id}`
    );

    return response.data;

  },



  /**
   * Get apartment statistics
   * GET /apartments/stats
   */
  getStats: async () => {

    const response = await api.get(
      "/apartments/stats"
    );

    return response.data;

  },


};


export default apartmentAPI;