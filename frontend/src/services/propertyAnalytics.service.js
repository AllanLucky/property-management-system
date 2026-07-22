import propertyAnalyticsAPI from "../api/propertyAnalytics.api";

class PropertyAnalyticsService {
  /**
   * Get all property analytics
   */
  async getAll(params = {}) {
    try {
      return await propertyAnalyticsAPI.getAll(params);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get paginated property analytics
   */
  async getPaginated(params = {}) {
    try {
      return await propertyAnalyticsAPI.getPaginated(params);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get property analytics by ID
   */
  async getById(id) {
    try {
      return await propertyAnalyticsAPI.getById(id);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create property analytics
   */
  async create(data) {
    try {
      return await propertyAnalyticsAPI.create(data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update property analytics
   */
  async update(id, data) {
    try {
      return await propertyAnalyticsAPI.update(id, data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete property analytics
   */
  async delete(id) {
    try {
      return await propertyAnalyticsAPI.delete(id);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Refresh analytics (optional)
   */
  async refresh(id) {
    try {
      return await propertyAnalyticsAPI.refresh(id);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get analytics summary (optional)
   */
  async getSummary() {
    try {
      return await propertyAnalyticsAPI.getSummary();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Export analytics (optional)
   */
  async export(params = {}) {
    try {
      return await propertyAnalyticsAPI.export(params);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    if (error.response) {
      return {
        status: error.response.status,
        message:
          error.response.data?.message ||
          "An unexpected server error occurred.",
        errors: error.response.data?.errors || null,
      };
    }

    if (error.request) {
      return {
        status: 0,
        message:
          "Unable to connect to the server. Please check your internet connection.",
      };
    }

    return {
      status: 500,
      message: error.message || "Something went wrong.",
    };
  }
}

export default new PropertyAnalyticsService();