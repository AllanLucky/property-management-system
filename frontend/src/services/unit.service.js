// src/services/unit.service.js

import api from "../api/axios";

const UNIT_ENDPOINT = "/units";

/*
|--------------------------------------------------------------------------
| RESPONSE HANDLER
|--------------------------------------------------------------------------
| Normalizes Laravel responses such as:
|
| {
|   status: true,
|   message: "Units fetched successfully.",
|   data: [...]
| }
|
| Also safely handles Axios responses that don't follow the above format.
|--------------------------------------------------------------------------
*/
const handleResponse = (response) => {
  const payload = response?.data;

  if (payload === undefined || payload === null) {
    return null;
  }

  return payload;
};

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/
const handleError = (error, label) => {
  const responseData = error?.response?.data;

  console.error(`${label} ERROR:`, responseData || error?.message || error);

  throw responseData || error;
};

/*
|--------------------------------------------------------------------------
| FORM DATA HELPER
|--------------------------------------------------------------------------
| Converts an object into FormData.
|
| Handles:
| - strings
| - numbers
| - booleans
| - null / undefined
| - arrays
| - objects
| - File
| - Blob
|--------------------------------------------------------------------------
*/
const buildFormData = (data = {}, includeMethod = false, method = "POST") => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | File / Blob
    |--------------------------------------------------------------------------
    */
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Arrays
    |--------------------------------------------------------------------------
    */
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          formData.append(
            `${key}[]`,
            typeof item === "object" ? JSON.stringify(item) : item
          );
        }
      });

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Objects
    |--------------------------------------------------------------------------
    */
    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Boolean
    |--------------------------------------------------------------------------
    | Laravel handles "1" / "0" safely.
    |--------------------------------------------------------------------------
    */
    if (typeof value === "boolean") {
      formData.append(key, value ? "1" : "0");
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Normal values
    |--------------------------------------------------------------------------
    */
    formData.append(key, value);
  });

  if (includeMethod) {
    formData.append("_method", method);
  }

  return formData;
};

/*
|--------------------------------------------------------------------------
| GET ALL UNITS
|--------------------------------------------------------------------------
|
| Supports optional filters:
|
| fetchUnits({
|   property_id: 1,
|   apartment_id: 2,
|   status: "vacant",
|   search: "A-101",
|   page: 1,
|   per_page: 20,
|   with_relations: true
| })
|--------------------------------------------------------------------------
*/
export const fetchUnits = async (params = {}) => {
  try {
    const res = await api.get(UNIT_ENDPOINT, {
      params,
    });

    return handleResponse(res);
  } catch (error) {
    handleError(error, "FETCH UNITS");
  }
};

/*
|--------------------------------------------------------------------------
| GET SINGLE UNIT
|--------------------------------------------------------------------------
*/
export const fetchUnit = async (id) => {
  try {
    if (!id) {
      throw new Error("Unit ID is required.");
    }

    const res = await api.get(`${UNIT_ENDPOINT}/${id}`);

    return handleResponse(res);
  } catch (error) {
    handleError(error, "FETCH UNIT");
  }
};

/*
|--------------------------------------------------------------------------
| CREATE UNIT
|--------------------------------------------------------------------------
|
| Uses JSON by default.
|
| If the payload contains a File/Blob, automatically use multipart/form-data.
|--------------------------------------------------------------------------
*/
export const createUnit = async (data = {}) => {
  try {
    const hasFile = Object.values(data).some(
      (value) => value instanceof File || value instanceof Blob
    );

    let res;

    if (hasFile) {
      const formData = buildFormData(data);

      res = await api.post(UNIT_ENDPOINT, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      res = await api.post(UNIT_ENDPOINT, data);
    }

    return handleResponse(res);
  } catch (error) {
    handleError(error, "CREATE UNIT");
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE UNIT
|--------------------------------------------------------------------------
|
| Laravel-safe update:
|
| POST /units/{id}
|
| with:
|
| _method=PUT
|
| FormData is used to support thumbnail/file uploads.
|--------------------------------------------------------------------------
*/
export const updateUnit = async (id, data = {}) => {
  try {
    if (!id) {
      throw new Error("Unit ID is required.");
    }

    const formData = buildFormData(data, true, "PUT");

    const res = await api.post(`${UNIT_ENDPOINT}/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return handleResponse(res);
  } catch (error) {
    handleError(error, "UPDATE UNIT");
  }
};

/*
|--------------------------------------------------------------------------
| DELETE UNIT
|--------------------------------------------------------------------------
*/
export const deleteUnit = async (id) => {
  try {
    if (!id) {
      throw new Error("Unit ID is required.");
    }

    const res = await api.delete(`${UNIT_ENDPOINT}/${id}`);

    return handleResponse(res);
  } catch (error) {
    handleError(error, "DELETE UNIT");
  }
};

/*
|--------------------------------------------------------------------------
| BULK DELETE UNITS
|--------------------------------------------------------------------------
|
| Optional helper for UnitList / UnitTable bulk actions.
|
| Expected backend payload:
|
| {
|   ids: [1, 2, 3]
| }
|--------------------------------------------------------------------------
*/
export const deleteUnits = async (ids = []) => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("At least one unit ID is required.");
    }

    const res = await api.post(`${UNIT_ENDPOINT}/bulk-delete`, {
      ids,
    });

    return handleResponse(res);
  } catch (error) {
    handleError(error, "BULK DELETE UNITS");
  }
};

/*
|--------------------------------------------------------------------------
| UNIT STATUS
|--------------------------------------------------------------------------
|
| Optional helper for changing only the unit status.
|--------------------------------------------------------------------------
*/
export const updateUnitStatus = async (id, status) => {
  try {
    if (!id) {
      throw new Error("Unit ID is required.");
    }

    if (!status) {
      throw new Error("Unit status is required.");
    }

    const res = await api.patch(`${UNIT_ENDPOINT}/${id}/status`, {
      status,
    });

    return handleResponse(res);
  } catch (error) {
    handleError(error, "UPDATE UNIT STATUS");
  }
};

/*
|--------------------------------------------------------------------------
| UNIT AVAILABILITY
|--------------------------------------------------------------------------
|
| Optional helper for checking whether a unit can be booked.
|--------------------------------------------------------------------------
*/
export const checkUnitAvailability = async (id) => {
  try {
    if (!id) {
      throw new Error("Unit ID is required.");
    }

    const res = await api.get(`${UNIT_ENDPOINT}/${id}/availability`);

    return handleResponse(res);
  } catch (error) {
    handleError(error, "CHECK UNIT AVAILABILITY");
  }
};

/*
|--------------------------------------------------------------------------
| UNIT EXPORTS
|--------------------------------------------------------------------------
*/
export default {
  fetchUnits,
  fetchUnit,
  createUnit,
  updateUnit,
  deleteUnit,
  deleteUnits,
  updateUnitStatus,
  checkUnitAvailability,
};