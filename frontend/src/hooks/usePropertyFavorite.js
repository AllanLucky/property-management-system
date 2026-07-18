import { useCallback, useState } from "react";
import propertyFavoriteApi from "../api/propertyFavorite.api";

const usePropertyFavorite = () => {
    const [favorites, setFavorites] = useState([]);
    const [favorite, setFavorite] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRequest = async (request) => {
        setLoading(true);
        setError(null);

        try {
            const response = await request();

            return response.data;
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Something went wrong."
            );

            throw err;
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Get All Favorites
    |--------------------------------------------------------------------------
    */
    const getAllFavorites = useCallback(async (params = {}) => {
        const data = await handleRequest(() =>
            propertyFavoriteApi.getAll(params)
        );

        setFavorites(data.data);

        return data;
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Get My Favorites
    |--------------------------------------------------------------------------
    */
    const getMyFavorites = useCallback(async (params = {}) => {
        const data = await handleRequest(() =>
            propertyFavoriteApi.getMyFavorites(params)
        );

        setFavorites(data.data);

        return data;
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Get Favorite
    |--------------------------------------------------------------------------
    */
    const getFavorite = useCallback(async (id) => {
        const data = await handleRequest(() =>
            propertyFavoriteApi.getById(id)
        );

        setFavorite(data.data);

        return data;
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Create Favorite
    |--------------------------------------------------------------------------
    */
    const createFavorite = async (payload) => {
        return await handleRequest(() =>
            propertyFavoriteApi.create(payload)
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Update Favorite
    |--------------------------------------------------------------------------
    */
    const updateFavorite = async (id, payload) => {
        return await handleRequest(() =>
            propertyFavoriteApi.update(id, payload)
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Delete Favorite
    |--------------------------------------------------------------------------
    */
    const deleteFavorite = async (id) => {
        return await handleRequest(() =>
            propertyFavoriteApi.delete(id)
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Toggle Favorite
    |--------------------------------------------------------------------------
    */
    const toggleFavorite = async (propertyId, payload = {}) => {
        return await handleRequest(() =>
            propertyFavoriteApi.toggle(propertyId, payload)
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Favorite Status
    |--------------------------------------------------------------------------
    */
    const getFavoriteStatus = useCallback(async (propertyId) => {
        return await handleRequest(() =>
            propertyFavoriteApi.getStatus(propertyId)
        );
    }, []);

    return {
        favorites,
        favorite,

        loading,
        error,

        getAllFavorites,
        getMyFavorites,
        getFavorite,

        createFavorite,
        updateFavorite,
        deleteFavorite,

        toggleFavorite,
        getFavoriteStatus,
    };
};

export default usePropertyFavorite;
