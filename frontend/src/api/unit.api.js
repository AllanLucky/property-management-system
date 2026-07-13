import api from "../api/axios";

const UNIT_ENDPOINT = "/units";

/*
|--------------------------------------------------------------------------
| GET ALL UNITS
|--------------------------------------------------------------------------
*/
export const fetchUnits = async () => {
  const response = await api.get(UNIT_ENDPOINT);
  return response.data;
};

/*
|--------------------------------------------------------------------------
| GET SINGLE UNIT
|--------------------------------------------------------------------------
*/
export const fetchUnit = async (id) => {
  const response = await api.get(`${UNIT_ENDPOINT}/${id}`);
  return response.data;
};

/*
|--------------------------------------------------------------------------
| CREATE UNIT
|--------------------------------------------------------------------------
*/
export const createUnit = async (data) => {
  const response = await api.post(UNIT_ENDPOINT, data);
  return response.data;
};

/*
|--------------------------------------------------------------------------
| UPDATE UNIT
|--------------------------------------------------------------------------
*/
export const updateUnit = async (id, data) => {
  const response = await api.post(`${UNIT_ENDPOINT}/${id}`, data);
  return response.data;
};

/*
|--------------------------------------------------------------------------
| DELETE UNIT
|--------------------------------------------------------------------------
*/
export const deleteUnit = async (id) => {
  const response = await api.delete(`${UNIT_ENDPOINT}/${id}`);
  return response.data;
};