import api from "./axios";

const BASE = "/role-requests";

/*
|--------------------------------------------------------------------------
| CREATE ROLE REQUEST
|--------------------------------------------------------------------------
*/
export const createRoleRequest = async (data) => {
  const res = await api.post(BASE, data);
  return res.data;
};

/*
|--------------------------------------------------------------------------
| GET ALL ROLE REQUESTS
|--------------------------------------------------------------------------
*/
export const getRoleRequests = async (config = {}) => {
  const { signal, params } = config;

  const res = await api.get(BASE, {
    signal,
    params,
  });

  return res.data;
};

/*
|--------------------------------------------------------------------------
| GET SINGLE ROLE REQUEST
|--------------------------------------------------------------------------
*/
export const getRoleRequest = async (id) => {
  const res = await api.get(`${BASE}/${id}`);
  return res.data;
};

/*
|--------------------------------------------------------------------------
| APPROVE ROLE REQUEST
|--------------------------------------------------------------------------
*/
export const approveRoleRequest = async (id, notes = null) => {
  const res = await api.post(`${BASE}/${id}/approve`, {
    notes,
  });

  return res.data;
};

/*
|--------------------------------------------------------------------------
| REJECT ROLE REQUEST (FIXED FIELD NAME)
|--------------------------------------------------------------------------
*/
export const rejectRoleRequest = async (id, notes = null) => {
  const res = await api.post(`${BASE}/${id}/reject`, {
    notes, // ✅ FIXED (was "reason")
  });

  return res.data;
};

/*
|--------------------------------------------------------------------------
| DELETE ROLE REQUEST
|--------------------------------------------------------------------------
*/
export const deleteRoleRequest = async (id) => {
  const res = await api.delete(`${BASE}/${id}`);
  return res.data;
};

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/
const roleRequestApi = {
  createRoleRequest,
  getRoleRequests,
  getRoleRequest,
  approveRoleRequest,
  rejectRoleRequest,
  deleteRoleRequest,
};

export default roleRequestApi;