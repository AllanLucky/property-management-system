import api from "./axios";

const BASE_URL = "/property-favorites";

const propertyFavoriteApi = {
    /*
    |--------------------------------------------------------------------------
    | Favorites
    |--------------------------------------------------------------------------
    */

    // GET /property-favorites
    getAll(params = {}) {
        return api.get(BASE_URL, { params });
    },

    // GET /property-favorites/my
    getMyFavorites(params = {}) {
        return api.get(`${BASE_URL}/my`, { params });
    },

    // GET /property-favorites/{favorite}
    getById(favoriteId) {
        return api.get(`${BASE_URL}/${favoriteId}`);
    },

    // POST /property-favorites
    create(data) {
        return api.post(BASE_URL, data);
    },

    // PUT /property-favorites/{favorite}
    update(favoriteId, data) {
        return api.put(`${BASE_URL}/${favoriteId}`, data);
    },

    // PATCH /property-favorites/{favorite}
    patch(favoriteId, data) {
        return api.patch(`${BASE_URL}/${favoriteId}`, data);
    },

    // DELETE /property-favorites/{favorite}
    delete(favoriteId) {
        return api.delete(`${BASE_URL}/${favoriteId}`);
    },

    /*
    |--------------------------------------------------------------------------
    | Favorite Actions
    |--------------------------------------------------------------------------
    */

    // POST /property-favorites/toggle/{propertyId}
    toggle(propertyId, data = {}) {
        return api.post(`${BASE_URL}/toggle/${propertyId}`, data);
    },

    // GET /property-favorites/status/{propertyId}
    getStatus(propertyId) {
        return api.get(`${BASE_URL}/status/${propertyId}`);
    },
};

export default propertyFavoriteApi;