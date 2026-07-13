import api from "./axios";

/*
|--------------------------------------------------------------------------
| STRICT UNWRAPPER (FIXED FOR LARAVEL)
|--------------------------------------------------------------------------
*/
const unwrap = (res) => res?.data?.data ?? [];

/*
|--------------------------------------------------------------------------
| GET PROPERTY AMENITIES
|--------------------------------------------------------------------------
*/
export const getPropertyAmenities = async (propertyId) => {
  if (!propertyId) throw new Error("propertyId is required");

  const res = await api.get(`/properties/${propertyId}/amenities`);

  return unwrap(res);
};

/*
|--------------------------------------------------------------------------
| GET ALL AMENITIES (GLOBAL LIST)
|--------------------------------------------------------------------------
*/
export const getAllAmenities = async () => {
  const res = await api.get(`/amenities`);

  return unwrap(res);
};

/*
|--------------------------------------------------------------------------
| ATTACH SINGLE AMENITY
|--------------------------------------------------------------------------
*/
export const attachAmenityToProperty = async (
  propertyId,
  amenityId,
  payload = {}
) => {
  if (!propertyId || !amenityId) {
    throw new Error("propertyId and amenityId are required");
  }

  const res = await api.post(
    `/properties/${propertyId}/amenities/${amenityId}`,
    payload
  );

  return unwrap(res);
};

/*
|--------------------------------------------------------------------------
| UPDATE PROPERTY AMENITY (PIVOT)
|--------------------------------------------------------------------------
*/
export const updatePropertyAmenity = async (
  propertyId,
  amenityId,
  payload = {}
) => {
  if (!propertyId || !amenityId) {
    throw new Error("propertyId and amenityId are required");
  }

  const res = await api.put(
    `/properties/${propertyId}/amenities/${amenityId}`,
    payload
  );

  return unwrap(res);
};

/*
|--------------------------------------------------------------------------
| REMOVE AMENITY FROM PROPERTY
|--------------------------------------------------------------------------
*/
export const deletePropertyAmenity = async (propertyId, amenityId) => {
  if (!propertyId || !amenityId) {
    throw new Error("propertyId and amenityId are required");
  }

  const res = await api.delete(
    `/properties/${propertyId}/amenities/${amenityId}`
  );

  return unwrap(res);
};

/*
|--------------------------------------------------------------------------
| BULK SYNC AMENITIES
|--------------------------------------------------------------------------
*/
export const syncPropertyAmenities = async (
  propertyId,
  amenities = []
) => {
  if (!propertyId) {
    throw new Error("propertyId is required");
  }

  const res = await api.post(
    `/properties/${propertyId}/amenities/sync`,
    { amenities }
  );

  return unwrap(res);
};