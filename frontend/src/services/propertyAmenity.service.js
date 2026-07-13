import {
  getPropertyAmenities,
  attachAmenityToProperty,
  updatePropertyAmenity,
  deletePropertyAmenity,
  syncPropertyAmenities,
} from "../api/propertyAmenity.api";

class PropertyAmenityService {

  /*
  |--------------------------------------------------------------------------
  | FETCH PROPERTY AMENITIES
  |--------------------------------------------------------------------------
  */
  async fetch(propertyId) {
    if (!propertyId) {
      return [];
    }

    const response = await getPropertyAmenities(propertyId);

    return Array.isArray(response)
      ? response
      : [];
  }


  /*
  |--------------------------------------------------------------------------
  | ATTACH AMENITY TO PROPERTY
  |--------------------------------------------------------------------------
  */
  async attach(propertyId, amenityId, data = {}) {
    if (!propertyId || !amenityId) {
      throw new Error("Property ID and Amenity ID are required");
    }

    return await attachAmenityToProperty(
      propertyId,
      amenityId,
      {
        value: data.value ?? null,
        distance: data.distance ?? null,
        walking_minutes: data.walking_minutes ?? null,
        note: data.note ?? null,
        is_available: data.is_available ?? true,
      }
    );
  }


  /*
  |--------------------------------------------------------------------------
  | UPDATE PROPERTY AMENITY
  |--------------------------------------------------------------------------
  */
  async update(propertyId, amenityId, data = {}) {
    if (!propertyId || !amenityId) {
      throw new Error("Property ID and Amenity ID are required");
    }

    return await updatePropertyAmenity(
      propertyId,
      amenityId,
      {
        value: data.value ?? null,
        distance: data.distance ?? null,
        walking_minutes: data.walking_minutes ?? null,
        note: data.note ?? null,
        is_available: data.is_available ?? true,
      }
    );
  }


  /*
  |--------------------------------------------------------------------------
  | DELETE PROPERTY AMENITY
  |--------------------------------------------------------------------------
  */
  async remove(propertyId, amenityId) {
    if (!propertyId || !amenityId) {
      throw new Error("Property ID and Amenity ID are required");
    }

    await deletePropertyAmenity(
      propertyId,
      amenityId
    );

    return {
      propertyId,
      amenityId,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | SYNC PROPERTY AMENITIES
  |--------------------------------------------------------------------------
  */
  async sync(propertyId, amenities = []) {

    if (!propertyId) {
      return [];
    }

    const payload = (amenities || []).map((item) => ({
      id: item.id,
      value: item.value ?? null,
      distance: item.distance ?? null,
      walking_minutes: item.walking_minutes ?? null,
      note: item.note ?? null,
      is_available: item.is_available ?? true,
    }));

    const response = await syncPropertyAmenities(
      propertyId,
      payload
    );

    return Array.isArray(response)
      ? response
      : [];
  }


  /*
  |--------------------------------------------------------------------------
  | CHECK IF AMENITY IS ATTACHED
  |--------------------------------------------------------------------------
  */
  isAttached(propertyAmenities = [], amenityId) {

    if (!Array.isArray(propertyAmenities)) {
      return false;
    }

    return propertyAmenities.some((item) =>
      item.amenity_id === amenityId ||
      item.id === amenityId
    );
  }


  /*
  |--------------------------------------------------------------------------
  | CONVERT ARRAY TO LOOKUP OBJECT
  |--------------------------------------------------------------------------
  */
  mapById(propertyAmenities = []) {

    if (!Array.isArray(propertyAmenities)) {
      return {};
    }

    return propertyAmenities.reduce((result, item) => {

      const key = item.amenity_id ?? item.id;

      result[key] = {
        ...item,

        available:
          item.availability?.is_available ?? false,

        value:
          item.availability?.value ?? null,

        distance:
          item.location?.distance ?? null,

        walking_minutes:
          item.location?.walking_minutes ?? null,
      };

      return result;

    }, {});
  }


  /*
  |--------------------------------------------------------------------------
  | GET AMENITY STATUS
  |--------------------------------------------------------------------------
  */
  getAvailability(amenity) {
    return (
      amenity?.availability?.is_available ?? false
    );
  }


  /*
  |--------------------------------------------------------------------------
  | GET AMENITY VALUE
  |--------------------------------------------------------------------------
  */
  getValue(amenity) {
    return (
      amenity?.availability?.value ?? null
    );
  }


  /*
  |--------------------------------------------------------------------------
  | GET LOCATION DATA
  |--------------------------------------------------------------------------
  */
  getLocation(amenity) {
    return {
      distance:
        amenity?.location?.distance ?? null,

      walking_minutes:
        amenity?.location?.walking_minutes ?? null,

      distance_label:
        amenity?.location?.distance_label ?? null,

      walking_time_label:
        amenity?.location?.walking_time_label ?? null,
    };
  }
}

export default new PropertyAmenityService();