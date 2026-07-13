// src/services/unit.service.js
import api from "../api/axios";

const UNIT_ENDPOINT = "/units";

/*
|--------------------------------------------------------------------------
| SAFE RESPONSE HANDLER
|--------------------------------------------------------------------------
| Normalizes Laravel responses: { status, message, data }
*/
const handleResponse = (response) => response?.data;

const handleError = (error, label) => {
  console.error(`${label} ERROR:`, error?.response?.data || error.message);
  throw error?.response?.data || error;
};

/*
|--------------------------------------------------------------------------
| GET ALL UNITS
|--------------------------------------------------------------------------
*/
export const fetchUnits = async () => {
  try {
    const res = await api.get(UNIT_ENDPOINT);
    return handleResponse(res);
  } catch (error) {
    handleError(error, "FETCH UNITS");
  }
};

/*
|--------------------------------------------------------------------------
| GET SINGLE UNIT
|--------------------------------------------------------------------------
*/
export const fetchUnit = async (id) => {
  try {
    const res = await api.get(`${UNIT_ENDPOINT}/${id}`);
    return handleResponse(res);
  } catch (error) {
    handleError(error, "FETCH UNIT");
  }
};

/*
|--------------------------------------------------------------------------
| CREATE UNIT
|--------------------------------------------------------------------------
*/
export const createUnit = async (data) => {
  try {
    const res = await api.post(UNIT_ENDPOINT, data);
    return handleResponse(res);
  } catch (error) {
    handleError(error, "CREATE UNIT");
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE UNIT
|--------------------------------------------------------------------------
| Laravel safe update using POST + _method=PUT
|--------------------------------------------------------------------------
*/
export const updateUnit = async (id, data) => {
  try {
    const formData = new FormData();

    // clone original data safely
    for (let key in data) {
      formData.append(key, data[key]);
    }

    formData.append("_method", "PUT");

    const res = await api.post(`${UNIT_ENDPOINT}/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return handleResponse(res);
  } catch (error) {
    handleError(error, "UPDATE UNIT");
  }
};

/*
|--------------------------------------------------------------------------
| DELETE UNIT
|--------------------------------------------------------------------------
*/
export const deleteUnit = async (id) => {
  try {
    const res = await api.delete(`${UNIT_ENDPOINT}/${id}`);
    return handleResponse(res);
  } catch (error) {
    handleError(error, "DELETE UNIT");
  }
};
