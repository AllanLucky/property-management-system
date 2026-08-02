import apartmentAPI from "../api/apartment.api";


class ApartmentService {


  /**
   * Get all apartments
   */
  async getAll(params = {}) {
    try {

      return await apartmentAPI.getAll(params);

    } catch (error) {

      throw this.handleError(error);

    }
  }

  /**
   * Get paginated apartments
   */
  async getPaginated(params = {}) {
    try {

      return await apartmentAPI.getPaginated(params);

    } catch (error) {

      throw this.handleError(error);

    }
  }

  /**
   * Get apartment by ID
   */
  async getById(id) {
    try {

      return await apartmentAPI.getById(id);

    } catch (error) {

      throw this.handleError(error);

    }
  }

  /**
   * Create apartment
   */
  async create(data) {
    try {

      return await apartmentAPI.create(data);

    } catch (error) {

      throw this.handleError(error);

    }
  }

  /**
   * Update apartment
   */
  async update(id, data) {
    try {

      return await apartmentAPI.update(id, data);

    } catch (error) {

      throw this.handleError(error);

    }
  }

  /**
   * Delete apartment
   */
  async delete(id) {
    try {

      return await apartmentAPI.delete(id);

    } catch (error) {

      throw this.handleError(error);

    }
  }

  /**
   * Get apartments by property
   */
  async getByProperty(propertyId, params = {}) {
    try {

      return await apartmentAPI.getByProperty(
        propertyId,
        params
      );

    } catch (error) {

      throw this.handleError(error);

    }
  }

  /**
   * Get apartment units
   */
  async getUnits(id) {
    try {

      return await apartmentAPI.getUnits(id);

    } catch (error) {

      throw this.handleError(error);

    }
  }








  /**
   * Get apartment statistics
   */
  async getStats(id) {
    try {

      return await apartmentAPI.getStats(id);

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

        errors:
          error.response.data?.errors ||
          null,

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

      message:
        error.message ||
        "Something went wrong.",

    };


  }



}


export default new ApartmentService();