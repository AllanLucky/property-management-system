import api from "./axios";

const TENANCY_ENDPOINT = "/tenancies";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const validateTenancyId = (tenancyId) => {
  if (
    tenancyId === undefined ||
    tenancyId === null ||
    tenancyId === ""
  ) {
    throw new Error("Tenancy ID is required.");
  }

  return tenancyId;
};

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

const validateFilterId = (id, message) => {
  if (
    id === undefined ||
    id === null ||
    id === ""
  ) {
    throw new Error(message);
  }

  return id;
};

const handleApiError = (error) => {
  throw error;
};

const getResponseData = (res) => {
  return res?.data?.data ?? null;
};

/*
|--------------------------------------------------------------------------
| CRUD
|--------------------------------------------------------------------------
*/

export const getTenancies = async (params = {}) => {
  try {
    const res = await api.get(TENANCY_ENDPOINT, {
      params,
    });

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const getTenancy = async (tenancyId) => {
  try {
    const id = validateTenancyId(tenancyId);

    const res = await api.get(
      `${TENANCY_ENDPOINT}/${id}`
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const createTenancy = async (data) => {
  try {
    validateData(
      data,
      "Tenancy data is required."
    );

    const res = await api.post(
      TENANCY_ENDPOINT,
      data
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const updateTenancy = async (
  tenancyId,
  data
) => {
  try {
    const id = validateTenancyId(tenancyId);

    validateData(
      data,
      "Tenancy data is required."
    );

    const res = await api.put(
      `${TENANCY_ENDPOINT}/${id}`,
      data
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const patchTenancy = async (
  tenancyId,
  data
) => {
  try {
    const id = validateTenancyId(tenancyId);

    validateData(
      data,
      "Tenancy data is required."
    );

    const res = await api.patch(
      `${TENANCY_ENDPOINT}/${id}`,
      data
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const deleteTenancy = async (tenancyId) => {
  try {
    const id = validateTenancyId(tenancyId);

    const res = await api.delete(
      `${TENANCY_ENDPOINT}/${id}`
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
*/

export const searchTenancies = async (
  search = "",
  params = {}
) => {
  try {
    const res = await api.get(
      `${TENANCY_ENDPOINT}/search`,
      {
        params: {
          ...params,
          search,
        },
      }
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

/*
|--------------------------------------------------------------------------
| Status Lists
|--------------------------------------------------------------------------
*/

export const getActiveTenancies = async (
  params = {}
) => {
  try {
    const res = await api.get(
      `${TENANCY_ENDPOINT}/active`,
      { params }
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const getPendingTenancies = async (
  params = {}
) => {
  try {
    const res = await api.get(
      `${TENANCY_ENDPOINT}/pending`,
      { params }
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const getExpiredTenancies = async (
  params = {}
) => {
  try {
    const res = await api.get(
      `${TENANCY_ENDPOINT}/expired`,
      { params }
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const getTerminatedTenancies = async (
  params = {}
) => {
  try {
    const res = await api.get(
      `${TENANCY_ENDPOINT}/terminated`,
      { params }
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const getCancelledTenancies = async (
  params = {}
) => {
  try {
    const res = await api.get(
      `${TENANCY_ENDPOINT}/cancelled`,
      { params }
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

/*
|--------------------------------------------------------------------------
| Statistics
|--------------------------------------------------------------------------
*/

export const getTenancyStatistics = async () => {
  try {
    const res = await api.get(
      `${TENANCY_ENDPOINT}/statistics`
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

/*
|--------------------------------------------------------------------------
| Status Management
|--------------------------------------------------------------------------
*/

export const activateTenancy = async (tenancyId) => {
  try {
    const id = validateTenancyId(tenancyId);

    const res = await api.patch(
      `${TENANCY_ENDPOINT}/${id}/activate`
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const deactivateTenancy = async (
  tenancyId
) => {
  try {
    const id = validateTenancyId(tenancyId);

    const res = await api.patch(
      `${TENANCY_ENDPOINT}/${id}/deactivate`
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const renewTenancy = async (
  tenancyId,
  data = {}
) => {
  try {
    const id = validateTenancyId(tenancyId);

    const res = await api.patch(
      `${TENANCY_ENDPOINT}/${id}/renew`,
      data
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const terminateTenancy = async (
  tenancyId,
  data = {}
) => {
  try {
    const id = validateTenancyId(tenancyId);

    const res = await api.patch(
      `${TENANCY_ENDPOINT}/${id}/terminate`,
      data
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const cancelTenancy = async (
  tenancyId,
  data = {}
) => {
  try {
    const id = validateTenancyId(tenancyId);

    const res = await api.patch(
      `${TENANCY_ENDPOINT}/${id}/cancel`,
      data
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

/*
|--------------------------------------------------------------------------
| Unit Assignment
|--------------------------------------------------------------------------
*/

export const assignUnitToTenant = async (data) => {
  try {
    validateData(
      data,
      "Assignment data is required."
    );

    const res = await api.post(
      `${TENANCY_ENDPOINT}/assign-unit`,
      data
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

/*
|--------------------------------------------------------------------------
| Restore / Force Delete
|--------------------------------------------------------------------------
*/

export const restoreTenancy = async (tenancyId) => {
  try {
    const id = validateTenancyId(tenancyId);

    const res = await api.patch(
      `${TENANCY_ENDPOINT}/${id}/restore`
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const forceDeleteTenancy = async (
  tenancyId
) => {
  try {
    const id = validateTenancyId(tenancyId);

    const res = await api.delete(
      `${TENANCY_ENDPOINT}/${id}/force`
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

/*
|--------------------------------------------------------------------------
| Convenience Filters
|--------------------------------------------------------------------------
*/

export const getTenanciesByTenant = async (
  tenantId,
  params = {}
) => {
  try {
    const id = validateFilterId(
      tenantId,
      "Tenant ID is required."
    );

    const res = await api.get(
      TENANCY_ENDPOINT,
      {
        params: {
          ...params,
          tenant_id: id,
        },
      }
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const getTenanciesByProperty = async (
  propertyId,
  params = {}
) => {
  try {
    const id = validateFilterId(
      propertyId,
      "Property ID is required."
    );

    const res = await api.get(
      TENANCY_ENDPOINT,
      {
        params: {
          ...params,
          property_id: id,
        },
      }
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const getTenanciesByApartment = async (
  apartmentId,
  params = {}
) => {
  try {
    const id = validateFilterId(
      apartmentId,
      "Apartment ID is required."
    );

    const res = await api.get(
      TENANCY_ENDPOINT,
      {
        params: {
          ...params,
          apartment_id: id,
        },
      }
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export const getTenanciesByUnit = async (
  unitId,
  params = {}
) => {
  try {
    const id = validateFilterId(
      unitId,
      "Unit ID is required."
    );

    const res = await api.get(
      TENANCY_ENDPOINT,
      {
        params: {
          ...params,
          unit_id: id,
        },
      }
    );

    return getResponseData(res);
  } catch (err) {
    return handleApiError(err);
  }
};

/*
|--------------------------------------------------------------------------
| Default Export
|--------------------------------------------------------------------------
*/

const tenancyApi = {
  /*
  |----------------------------------------------------------------------
  | CRUD
  |----------------------------------------------------------------------
  */
  getTenancies,
  getTenancy,
  createTenancy,
  updateTenancy,
  patchTenancy,
  deleteTenancy,

  /*
  |----------------------------------------------------------------------
  | Search
  |----------------------------------------------------------------------
  */
  searchTenancies,

  /*
  |----------------------------------------------------------------------
  | Status Lists
  |----------------------------------------------------------------------
  */
  getActiveTenancies,
  getPendingTenancies,
  getExpiredTenancies,
  getTerminatedTenancies,
  getCancelledTenancies,

  /*
  |----------------------------------------------------------------------
  | Statistics
  |----------------------------------------------------------------------
  */
  getTenancyStatistics,

  /*
  |----------------------------------------------------------------------
  | Status Management
  |----------------------------------------------------------------------
  */
  activateTenancy,
  deactivateTenancy,
  renewTenancy,
  terminateTenancy,
  cancelTenancy,

  /*
  |----------------------------------------------------------------------
  | Unit Assignment
  |----------------------------------------------------------------------
  */
  assignUnitToTenant,

  /*
  |----------------------------------------------------------------------
  | Restore / Force Delete
  |----------------------------------------------------------------------
  */
  restoreTenancy,
  forceDeleteTenancy,

  /*
  |----------------------------------------------------------------------
  | Convenience Filters
  |----------------------------------------------------------------------
  */
  getTenanciesByTenant,
  getTenanciesByProperty,
  getTenanciesByApartment,
  getTenanciesByUnit,
};

export default tenancyApi;