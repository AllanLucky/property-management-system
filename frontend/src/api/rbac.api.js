import api from "./axios";

/*
|--------------------------------------------------------------------------
| 🧠 SAFE RESPONSE HANDLER
|--------------------------------------------------------------------------
*/
const getData = (res) => res?.data?.data || res?.data;

/*
|--------------------------------------------------------------------------
| ROLES
|--------------------------------------------------------------------------
*/

// Get all roles
export const getRoles = async () => {
  const res = await api.get("/roles");
  return getData(res);
};

// Get single role
export const getRole = async (id) => {
  const res = await api.get(`/roles/${id}`);
  return getData(res);
};

// Create role
export const createRole = async (data) => {
  const res = await api.post("/roles", data);
  return getData(res);
};

// Update role
export const updateRole = async (id, data) => {
  const res = await api.put(`/roles/${id}`, data);
  return getData(res);
};

// Delete role
export const deleteRole = async (id) => {
  const res = await api.delete(`/roles/${id}`);
  return getData(res);
};

/*
|--------------------------------------------------------------------------
| PERMISSIONS
|--------------------------------------------------------------------------
*/

// Get all permissions
export const getPermissions = async () => {
  const res = await api.get("/permissions");
  return getData(res);
};

// Get single permission
export const getPermission = async (id) => {
  const res = await api.get(`/permissions/${id}`);
  return getData(res);
};

// Create permission
export const createPermission = async (data) => {
  const res = await api.post("/permissions", data);
  return getData(res);
};

// Update permission
export const updatePermission = async (id, data) => {
  const res = await api.put(`/permissions/${id}`, data);
  return getData(res);
};

// Delete permission
export const deletePermission = async (id) => {
  const res = await api.delete(`/permissions/${id}`);
  return getData(res);
};

/*
|--------------------------------------------------------------------------
| ROLE ↔ PERMISSION ASSIGNMENT
|--------------------------------------------------------------------------
*/

// Get permissions for role
export const getRolePermissions = async (roleId) => {
  const res = await api.get(`/roles/${roleId}/permissions`);
  return getData(res);
};

// Assign permissions to role
export const assignPermissionsToRole = async (roleId, permissions) => {
  const res = await api.post(`/roles/${roleId}/permissions`, {
    permissions,
  });

  return getData(res);
};

// Sync permissions (overwrite all)
export const syncRolePermissions = async (roleId, permissions) => {
  const res = await api.put(`/roles/${roleId}/permissions-sync`, {
    permissions,
  });

  return getData(res);
};

/*
|--------------------------------------------------------------------------
| USER ↔ ROLE ASSIGNMENT
|--------------------------------------------------------------------------
*/

// Assign role(s) to user (fixed: always array)
export const assignRoleToUser = async (userId, role) => {
  const res = await api.post(`/users/${userId}/assign-role`, {
    roles: Array.isArray(role) ? role : [role],
  });

  return getData(res);
};

// Remove role from user
export const removeRoleFromUser = async (userId, role) => {
  const res = await api.post(`/users/${userId}/remove-role`, {
    role,
  });

  return getData(res);
};

// Get user roles
export const getUserRoles = async (userId) => {
  const res = await api.get(`/users/${userId}/roles`);
  return getData(res);
};

/*
|--------------------------------------------------------------------------
| USER PERMISSION CHECK
|--------------------------------------------------------------------------
*/

// Check current user permission
export const checkPermission = async (permission) => {
  const res = await api.get(
    `/me/permissions/check/${permission}`
  );

  return getData(res);
};

/*
|--------------------------------------------------------------------------
| BULK OPERATIONS (CLEANED)
|--------------------------------------------------------------------------
*/

// Assign multiple roles to user
export const assignMultipleRoles = async (userId, roles) => {
  const res = await api.post(`/users/${userId}/assign-roles`, {
    roles: Array.isArray(roles) ? roles : [],
  });

  return getData(res);
};

// Sync user roles (overwrite)
export const syncUserRoles = async (userId, roles) => {
  const res = await api.put(`/users/${userId}/roles-sync`, {
    roles: Array.isArray(roles) ? roles : [],
  });

  return getData(res);
};