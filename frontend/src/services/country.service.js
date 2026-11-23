
import countryApi from "../api/country.api";

/*
|--------------------------------------------------------------------------
| COUNTRY SERVICE
|--------------------------------------------------------------------------
|
| Handles business-level country operations.
|
| Responsibilities:
| - Communicate with country API
| - Normalize API responses
| - Handle API errors consistently
| - Validate required parameters
| - Expose methods to useCountries.js
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/

const handleServiceError = (error) => {
  const response = error?.response?.data;

  const message =
    response?.message ||
    error?.message ||
    "An unexpected error occurred. Please try again.";

  const validationErrors = response?.errors || {};

  const statusCode =
    response?.code ||
    error?.response?.status ||
    500;

  const serviceError = new Error(message);

  serviceError.message = message;
  serviceError.status = statusCode;
  serviceError.errors = validationErrors;
  serviceError.response = error?.response;

  throw serviceError;
};

/*
|--------------------------------------------------------------------------
| VALIDATE COUNTRY ID
|--------------------------------------------------------------------------
*/

const validateCountryId = (id) => {
  if (
    id === null ||
    id === undefined ||
    id === ""
  ) {
    throw new Error("A valid country ID is required.");
  }

  return id;
};

/*
|--------------------------------------------------------------------------
| COUNTRY SERVICE
|--------------------------------------------------------------------------
*/

const countryService = {

  /*
  |--------------------------------------------------------------------------
  | GET COUNTRIES
  |--------------------------------------------------------------------------
  | Supports:
  | - Search
  | - Status filtering
  | - Pagination
  | - Sorting (if supported by backend)
  */

  getCountries: async (params = {}) => {
    try {
      return await countryApi.getCountries(params);
    } catch (error) {
      handleServiceError(error);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | GET COUNTRY BY ID
  |--------------------------------------------------------------------------
  */

  getCountryById: async (id) => {
    try {
      const countryId = validateCountryId(id);

      return await countryApi.getCountryById(countryId);
    } catch (error) {
      handleServiceError(error);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | CREATE COUNTRY
  |--------------------------------------------------------------------------
  */

  createCountry: async (payload) => {
    try {
      if (!payload || typeof payload !== "object") {
        throw new Error("Valid country information is required.");
      }

      if (!payload.name?.trim()) {
        throw new Error("Country name is required.");
      }

      if (!payload.code?.trim()) {
        throw new Error("Country code is required.");
      }

      return await countryApi.createCountry(payload);
    } catch (error) {
      handleServiceError(error);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE COUNTRY
  |--------------------------------------------------------------------------
  */

  updateCountry: async (id, payload) => {
    try {
      const countryId = validateCountryId(id);

      if (!payload || typeof payload !== "object") {
        throw new Error("Valid country information is required.");
      }

      return await countryApi.updateCountry(countryId, payload);
    } catch (error) {
      handleServiceError(error);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | PARTIAL UPDATE COUNTRY
  |--------------------------------------------------------------------------
  */

  patchCountry: async (id, payload) => {
    try {
      const countryId = validateCountryId(id);

      if (!payload || typeof payload !== "object") {
        throw new Error("Valid country information is required.");
      }

      return await countryApi.patchCountry(countryId, payload);
    } catch (error) {
      handleServiceError(error);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | DELETE COUNTRY
  |--------------------------------------------------------------------------
  */

  deleteCountry: async (id) => {
    try {
      const countryId = validateCountryId(id);

      return await countryApi.deleteCountry(countryId);
    } catch (error) {
      handleServiceError(error);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | TOGGLE COUNTRY STATUS
  |--------------------------------------------------------------------------
  */

  toggleCountryStatus: async (id, isActive) => {
    try {
      const countryId = validateCountryId(id);

      if (typeof isActive !== "boolean") {
        throw new Error("Country status must be true or false.");
      }

      return await countryApi.toggleCountryStatus(
        countryId,
        isActive
      );
    } catch (error) {
      handleServiceError(error);
    }
  },

};

export default countryService;
