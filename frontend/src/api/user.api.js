import api from "./axios";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const createFormData = (data = {}, method = null) => {
    const formData = new FormData();

    if (method) {
        formData.append("_method", method);
    }

    Object.entries(data).forEach(([key, value]) => {

        // Skip null / undefined / empty strings
        if (value === null || value === undefined || value === "") {
            return;
        }

        // Handle arrays properly
        if (Array.isArray(value)) {
            value.forEach((item) => {
                formData.append(`${key}[]`, item);
            });
            return;
        }

        // Handle File / Blob (IMPORTANT for image upload)
        if (value instanceof File || value instanceof Blob) {
            formData.append(key, value);
            return;
        }

        // Normal values
        formData.append(key, value);
    });

    return formData;
};

/*
|--------------------------------------------------------------------------
| USERS
|--------------------------------------------------------------------------
*/

// Get all users
export const getUsers = (params) =>
    api.get("/users", { params });

// Get single user
export const getUser = (id) =>
    api.get(`/users/${id}`);

// Create user
export const createUser = (data) =>
    api.post(
        "/users",
        createFormData(data),
        {
            headers: { "Content-Type": "multipart/form-data" },
        }
    );

// Update user
export const updateUser = (id, data) =>
    api.post(
        `/users/${id}`,
        createFormData(data, "PUT"),
        {
            headers: { "Content-Type": "multipart/form-data" },
        }
    );

// Delete user
export const deleteUser = (id) =>
    api.delete(`/users/${id}`);

/*
|--------------------------------------------------------------------------
| PROFILE (AUTH USER)
|--------------------------------------------------------------------------
*/

// Get current user
export const getMe = () =>
    api.get("/me");

// Update profile
export const updateProfile = (data) =>
    api.post(
        "/me/profile",
        createFormData(data, "PUT"),
        {
            headers: { "Content-Type": "multipart/form-data" },
        }
    );

// Upload profile image ONLY (FIXED SAFETY)
export const uploadProfileImage = (file) =>
    api.post(
        "/me/upload-image",
        createFormData({ image: file }),
        {
            headers: { "Content-Type": "multipart/form-data" },
        }
    );

/*
|--------------------------------------------------------------------------
| RBAC
|--------------------------------------------------------------------------
*/

export const assignRole = (userId, roles) =>
    api.post(`/users/${userId}/assign-role`, { roles });

export const removeRole = (userId, roles) =>
    api.post(`/users/${userId}/remove-role`, { roles });

export const syncRoles = (userId, roles) =>
    api.put(`/users/${userId}/roles-sync`, { roles });

export const getUserRoles = (userId) =>
    api.get(`/users/${userId}/roles`);

/*
|--------------------------------------------------------------------------
| USER STATUS
|--------------------------------------------------------------------------
*/

export const toggleUserStatus = (id) =>
    api.patch(`/users/${id}/toggle-status`);

export const verifyUser = (id) =>
    api.patch(`/users/${id}/verify`);

/*
|--------------------------------------------------------------------------
| SEARCH & FILTER
|--------------------------------------------------------------------------
*/

export const searchUsers = (search) =>
    api.get("/users", { params: { search } });

export const getUsersByRole = (role) =>
    api.get("/users", { params: { role } });