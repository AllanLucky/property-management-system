import propertyVisitApi from "../api/propertyVisit.api";

class PropertyVisitService {
  /**
   * Get all property visits
   */
  async getAll(params = {}) {
    return await propertyVisitApi.getPropertyVisits(params);
  }

  /**
   * Get a single property visit
   */
  async getById(id) {
    return await propertyVisitApi.getPropertyVisit(id);
  }

  /**
   * Create a property visit
   */
  async create(data) {
    return await propertyVisitApi.createPropertyVisit(data);
  }

  /**
   * Update a property visit
   */
  async update(id, data) {
    return await propertyVisitApi.updatePropertyVisit(id, data);
  }

  /**
   * Partially update a property visit
   */
  async patch(id, data) {
    return await propertyVisitApi.patchPropertyVisit(id, data);
  }

  /**
   * Delete a property visit
   */
  async delete(id) {
    return await propertyVisitApi.deletePropertyVisit(id);
  }
}

export default new PropertyVisitService();