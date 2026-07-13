import api from "../api/axios";

const PROPERTY_ENDPOINT = "/properties";

/*
|--------------------------------------------------------------------------
| RESPONSE NORMALIZER
|--------------------------------------------------------------------------
| Supports Laravel API structures like:
| { data: ..., message: ..., status: true }
*/
const handleResponse = (response) => {
  return response?.data?.data ?? response?.data ?? response;
};

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/
const handleError = (error, label) => {
  const errData = error?.response?.data;

  console.error(`❌ ${label} ERROR:`, errData || error.message);

  throw errData || {
    message: error.message || "Unexpected error",
  };
};

/*
|--------------------------------------------------------------------------
| QUERY BUILDER
|--------------------------------------------------------------------------
*/
const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      query.append(key, value);
    }
  });

  return query.toString();
};

/*
|--------------------------------------------------------------------------
| GET ALL PROPERTIES
|--------------------------------------------------------------------------
| Supports:
| - with_relations
| - status filters
| - pagination (future-ready)
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
    const response = await api.post(PROPERTY_ENDPOINT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return handleResponse(response);
  } catch (error) {
    handleError(error, "CREATE PROPERTY");
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE PROPERTY (Laravel safe method spoofing)
|--------------------------------------------------------------------------
| Uses: POST + _method=PUT
|--------------------------------------------------------------------------
*/
export const updatePropertyApi = async (id, formData) => {
  try {
    const data = new FormData();

    // safely clone FormData
    for (let [key, value] of formData.entries()) {
      if (value !== undefined && value !== null && value !== "") {
        data.append(key, value);
      }
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
    const response = await api.delete(`${PROPERTY_ENDPOINT}/${id}`);
    return handleResponse(response);
  } catch (error) {
    handleError(error, "DELETE PROPERTY");
  }
};

/*
|--------------------------------------------------------------------------
| EXTRA: PROPERTY DASHBOARD STATS (OPTIONAL BUT USEFUL)
|--------------------------------------------------------------------------
| If you later add:
| GET /properties/stats
|--------------------------------------------------------------------------
*/
export const getPropertyStatsApi = async () => {
  try {
    const response = await api.get(`${PROPERTY_ENDPOINT}/stats`);
    return handleResponse(response);
  } catch (error) {
    handleError(error, "GET PROPERTY STATS");
  }
};