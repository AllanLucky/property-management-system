import api from "../api/axios";

const PROPERTY_ENDPOINT = "/properties";

/*
|--------------------------------------------------------------------------
| RESPONSE NORMALIZER
|--------------------------------------------------------------------------
| Keep the complete Laravel API response so hooks can access:
| - response.data
| - response.message
| - response.meta
| - response.links
| - response.status
| - response.code
|--------------------------------------------------------------------------
*/
const handleResponse = (response) => {
  return response?.data ?? response;
};

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/
const handleError = (error, label) => {
  const errData = error?.response?.data;

  console.error(`❌ ${label} ERROR:`, errData || error.message);

  throw (
    errData || {
      status: false,
      message: error.message || "Unexpected error",
      errors: null,
    }
  );
};

/*
|--------------------------------------------------------------------------
| QUERY BUILDER
|--------------------------------------------------------------------------
*/
const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      query.append(key, value);
    }
  });

  return query.toString();
};

/*
|--------------------------------------------------------------------------
| GET ALL PROPERTIES
|--------------------------------------------------------------------------
*/
export const getPropertiesApi = async (params = {}) => {
  try {
    const query = buildQuery(params);

    const response = await api.get(
      `${PROPERTY_ENDPOINT}${query ? `?${query}` : ""}`
    );

    return handleResponse(response);
  } catch (error) {
    handleError(error, "GET PROPERTIES");
  }
};

/*
|--------------------------------------------------------------------------
| GET SINGLE PROPERTY
|--------------------------------------------------------------------------
*/
export const getPropertyApi = async (id, params = {}) => {
  try {
    const query = buildQuery(params);

    const response = await api.get(
      `${PROPERTY_ENDPOINT}/${id}${query ? `?${query}` : ""}`
    );

    return handleResponse(response);
  } catch (error) {
    handleError(error, "GET PROPERTY");
  }
};

/*
|--------------------------------------------------------------------------
| CREATE PROPERTY
|--------------------------------------------------------------------------
*/
export const createPropertyApi = async (formData) => {
  try {
    const response = await api.post(
      PROPERTY_ENDPOINT,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return handleResponse(response);
  } catch (error) {
    handleError(error, "CREATE PROPERTY");
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE PROPERTY
|--------------------------------------------------------------------------
| Laravel-safe method spoofing (POST + _method=PUT)
|--------------------------------------------------------------------------
*/
export const updatePropertyApi = async (id, formData) => {
  try {
    const data = new FormData();

    if (formData instanceof FormData) {
      for (const [key, value] of formData.entries()) {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          data.append(key, value);
        }
      }
    } else {
      Object.entries(formData || {}).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          data.append(key, value);
        }
      });
    }

    data.append("_method", "PUT");

    const response = await api.post(
      `${PROPERTY_ENDPOINT}/${id}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return handleResponse(response);
  } catch (error) {
    handleError(error, "UPDATE PROPERTY");
  }
};

/*
|--------------------------------------------------------------------------
| DELETE PROPERTY
|--------------------------------------------------------------------------
*/
export const deletePropertyApi = async (id) => {
  try {
    const response = await api.delete(
      `${PROPERTY_ENDPOINT}/${id}`
    );

    return handleResponse(response);
  } catch (error) {
    handleError(error, "DELETE PROPERTY");
  }
};

/*
|--------------------------------------------------------------------------
| PROPERTY DASHBOARD STATS
|--------------------------------------------------------------------------
*/
export const getPropertyStatsApi = async () => {
  try {
    const response = await api.get(
      `${PROPERTY_ENDPOINT}/stats`
    );

    return handleResponse(response);
  } catch (error) {
    handleError(error, "GET PROPERTY STATS");
  }
};