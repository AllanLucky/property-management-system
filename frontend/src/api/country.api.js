import axiosInstance from "./axios";

const BASE_URL = "/countries";

const countryApi = {
  /*
  |--------------------------------------------------------------------------
  | GET ALL COUNTRIES
  |--------------------------------------------------------------------------
  | Supports pagination, search, filtering and sorting.
  */

  getCountries: async (params = {}) => {
    const response = await axiosInstance.get(BASE_URL, {
      params,
    });

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | GET SINGLE COUNTRY
  |--------------------------------------------------------------------------
  */

  getCountryById: async (id) => {
    if (!id) {
      throw new Error("Country ID is required.");
    }

    const response = await axiosInstance.get(`${BASE_URL}/${id}`);

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE COUNTRY
  |--------------------------------------------------------------------------
  */

  createCountry: async (payload) => {
    const response = await axiosInstance.post(BASE_URL, payload);

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE COUNTRY
  |--------------------------------------------------------------------------
  */

  updateCountry: async (id, payload) => {
    if (!id) {
      throw new Error("Country ID is required.");
    }

    const response = await axiosInstance.put(
      `${BASE_URL}/${id}`,
      payload
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | PARTIAL UPDATE COUNTRY
  |--------------------------------------------------------------------------
  */

  patchCountry: async (id, payload) => {
    if (!id) {
      throw new Error("Country ID is required.");
    }

    const response = await axiosInstance.patch(
      `${BASE_URL}/${id}`,
      payload
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | DELETE COUNTRY
  |--------------------------------------------------------------------------
  */

  deleteCountry: async (id) => {
    if (!id) {
      throw new Error("Country ID is required.");
    }

    const response = await axiosInstance.delete(
      `${BASE_URL}/${id}`
    );

    return response.data;
  },

  /*
  |--------------------------------------------------------------------------
  | TOGGLE COUNTRY STATUS
  |--------------------------------------------------------------------------
  | Uses the partial update endpoint.
  */

  toggleCountryStatus: async (id, isActive) => {
    if (!id) {
      throw new Error("Country ID is required.");
    }

    const response = await axiosInstance.patch(
      `${BASE_URL}/${id}`,
      {
        is_active: isActive,
      }
    );

    return response.data;
  },
};

export default countryApi;
