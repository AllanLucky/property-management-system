import api from "../api/axios";

/*
|--------------------------------------------------------------------------
| ROLE REQUEST SERVICE
|--------------------------------------------------------------------------
| Handles all Role Request API operations
|--------------------------------------------------------------------------
*/

const roleRequestService = {
  /*
  |--------------------------------------------------------------------------
  | GET ALL ROLE REQUESTS
  |--------------------------------------------------------------------------
  */
  async getAll(params = {}) {
    try {
      const { data } = await api.get("/role-requests", {
        params,
      });

      return data;
    } catch (error) {
      console.error("Failed to fetch role requests:", error);
      throw error;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | GET SINGLE ROLE REQUEST
  |--------------------------------------------------------------------------
  */
  async getById(id) {
    try {
      const { data } = await api.get(`/role-requests/${id}`);

      console.log("Role Request Detail Response:", data);

      return data;
    } catch (error) {
      console.error(`Failed to fetch role request ${id}:`, error);
      throw error;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE ROLE REQUEST
  |--------------------------------------------------------------------------
  */
  async create(payload) {
    try {
      const { data } = await api.post(
        "/role-requests",
        payload
      );

      return data;
    } catch (error) {
      console.error("Failed to create role request:", error);
      throw error;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE ROLE REQUEST
  |--------------------------------------------------------------------------
  */
  async update(id, payload) {
    try {
      const { data } = await api.put(
        `/role-requests/${id}`,
        payload
      );

      return data;
    } catch (error) {
      console.error(`Failed to update role request ${id}:`, error);
      throw error;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | DELETE ROLE REQUEST
  |--------------------------------------------------------------------------
  */
  async remove(id) {
    try {
      const { data } = await api.delete(
        `/role-requests/${id}`
      );

      return data;
    } catch (error) {
      console.error(`Failed to delete role request ${id}:`, error);
      throw error;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | APPROVE ROLE REQUEST
  |--------------------------------------------------------------------------
  */
  async approve(id, notes = null) {
    try {
      const { data } = await api.post(
        `/role-requests/${id}/approve`,
        {
          notes,
        }
      );

      return data;
    } catch (error) {
      console.error(`Failed to approve role request ${id}:`, error);
      throw error;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | REJECT ROLE REQUEST
  |--------------------------------------------------------------------------
  */
  async reject(id, notes = null) {
    try {
      const { data } = await api.post(
        `/role-requests/${id}/reject`,
        {
          notes,
        }
      );

      return data;
    } catch (error) {
      console.error(`Failed to reject role request ${id}:`, error);
      throw error;
    }
  },
};

export default roleRequestService;