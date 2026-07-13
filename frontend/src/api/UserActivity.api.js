import axios from "./axios";

const BASE = "/activity-logs";

const UserActivityAPI = {
    async getAll(params = {}) {
        const response = await axios.get(BASE, { params });
        return response.data;
    },

    async getById(id) {
        const response = await axios.get(`${BASE}/${id}`);
        return response.data;
    },

    async getMyActivities(params = {}) {
        const response = await axios.get(`${BASE}/my`, { params });
        return response.data;
    },

    async create(payload) {
        const response = await axios.post(BASE, payload);
        return response.data;
    },

    async delete(id) {
        const response = await axios.delete(`${BASE}/${id}`);
        return response.data;
    },
};

export default UserActivityAPI;