import propertyFavoriteApi from "../api/propertyFavorite.api";

class PropertyFavoriteService {
    /*
    |--------------------------------------------------------------------------
    | Get All Favorites (Admin)
    |--------------------------------------------------------------------------
    */
    async getAll(params = {}) {
        const response = await propertyFavoriteApi.getAll(params);
        return response.data;
    }

    /*
    |--------------------------------------------------------------------------
    | Get My Favorites
    |--------------------------------------------------------------------------
    */
    async getMyFavorites(params = {}) {
        const response = await propertyFavoriteApi.getMyFavorites(params);
        return response.data;
    }

    /*
    |--------------------------------------------------------------------------
    | Get Favorite By ID
    |--------------------------------------------------------------------------
    */
    async getById(favoriteId) {
        const response = await propertyFavoriteApi.getById(favoriteId);
        return response.data;
    }

    /*
    |--------------------------------------------------------------------------
    | Create Favorite
    |--------------------------------------------------------------------------
    */
    async create(data) {
        const response = await propertyFavoriteApi.create(data);
        return response.data;
    }

    /*
    |--------------------------------------------------------------------------
    | Update Favorite
    |--------------------------------------------------------------------------
    */
    async update(favoriteId, data) {
        const response = await propertyFavoriteApi.update(favoriteId, data);
        return response.data;
    }

    /*
    |--------------------------------------------------------------------------
    | Patch Favorite
    |--------------------------------------------------------------------------
    */
    async patch(favoriteId, data) {
        const response = await propertyFavoriteApi.patch(favoriteId, data);
        return response.data;
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Favorite
    |--------------------------------------------------------------------------
    */
    async delete(favoriteId) {
        const response = await propertyFavoriteApi.delete(favoriteId);
        return response.data;
    }

    /*
    |--------------------------------------------------------------------------
    | Toggle Favorite
    |--------------------------------------------------------------------------
    */
    async toggle(propertyId, data = {}) {
        const response = await propertyFavoriteApi.toggle(propertyId, data);
        return response.data;
    }

    /*
    |--------------------------------------------------------------------------
    | Check Favorite Status
    |--------------------------------------------------------------------------
    */
    async getStatus(propertyId) {
        const response = await propertyFavoriteApi.getStatus(propertyId);
        return response.data;
    }
}

export default new PropertyFavoriteService();