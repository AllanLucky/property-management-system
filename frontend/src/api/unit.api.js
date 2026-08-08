// src/services/unit.service.js

import api from "../api/axios";

const UNIT_ENDPOINT = "/units";

/*
|--------------------------------------------------------------------------
| RESPONSE HANDLER
|--------------------------------------------------------------------------
|
| Laravel responses are expected to look like:
|
| {
|     status: true,
|     message: "...",
|     data: {...}
| }
|
|--------------------------------------------------------------------------
*/
const handleResponse = (response) => {
    return response?.data ?? null;
};

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/
const handleError = (error, action) => {
    const errorData =
        error?.response?.data ||
        error?.message ||
        error;

    console.error(`${action} ERROR:`, errorData);

    throw errorData;
};

/*
|--------------------------------------------------------------------------
| FORM DATA BUILDER
|--------------------------------------------------------------------------
|
| Used when creating/updating units with files such as thumbnails.
|--------------------------------------------------------------------------
*/
const buildFormData = (data = {}, method = null) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
        /*
        |--------------------------------------------------------------------------
        | Ignore undefined values
        |--------------------------------------------------------------------------
        */
        if (value === undefined) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Null values
        |--------------------------------------------------------------------------
        */
        if (value === null) {
            formData.append(key, "");
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Files
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
                if (item !== null && item !== undefined) {
                    formData.append(
                        `${key}[]`,
                        typeof item === "object"
                            ? JSON.stringify(item)
                            : item
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
            formData.append(
                key,
                JSON.stringify(value)
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Boolean
        |--------------------------------------------------------------------------
        */
        if (typeof value === "boolean") {
            formData.append(
                key,
                value ? "1" : "0"
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Strings / Numbers
        |--------------------------------------------------------------------------
        */
        formData.append(key, value);
    });

    /*
    |--------------------------------------------------------------------------
    | Laravel method spoofing
    |--------------------------------------------------------------------------
    */
    if (method) {
        formData.append("_method", method);
    }

    return formData;
};

/*
|--------------------------------------------------------------------------
| GET ALL UNITS
|--------------------------------------------------------------------------
|
| Supports optional query parameters:
|
| fetchUnits({
|     search: "A101",
|     property_id: 1,
|     apartment_id: 2,
|     status: "vacant",
|     floor: 1,
|     page: 1,
|     per_page: 20,
|     with_relations: true
| });
|
|--------------------------------------------------------------------------
*/
export const fetchUnits = async (params = {}) => {
    try {
        const response = await api.get(
            UNIT_ENDPOINT,
            {
                params,
            }
        );

        return handleResponse(response);
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
            throw new Error(
                "Unit ID is required."
            );
        }

        const response = await api.get(
            `${UNIT_ENDPOINT}/${id}`
        );

        return handleResponse(response);
    } catch (error) {
        handleError(error, "FETCH UNIT");
    }
};

/*
|--------------------------------------------------------------------------
| CREATE UNIT
|--------------------------------------------------------------------------
|
| Uses JSON when there is no file.
|
| Automatically switches to multipart/form-data
| when a File or Blob is included.
|--------------------------------------------------------------------------
*/
export const createUnit = async (data = {}) => {
    try {
        const hasFile = Object.values(data).some(
            (value) =>
                value instanceof File ||
                value instanceof Blob
        );

        let response;

        /*
        |--------------------------------------------------------------------------
        | JSON request
        |--------------------------------------------------------------------------
        */
        if (!hasFile) {
            response = await api.post(
                UNIT_ENDPOINT,
                data
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Multipart request
        |--------------------------------------------------------------------------
        */
        else {
            const formData =
                buildFormData(data);

            response = await api.post(
                UNIT_ENDPOINT,
                formData,
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data",
                    },
                }
            );
        }

        return handleResponse(response);
    } catch (error) {
        handleError(error, "CREATE UNIT");
    }
};

/*
|--------------------------------------------------------------------------
| UPDATE UNIT
|--------------------------------------------------------------------------
|
| Laravel does not always handle PUT/PATCH multipart
| requests correctly.
|
| Therefore we send:
|
| POST /units/{id}
|
| with:
|
| _method = PUT
|
|--------------------------------------------------------------------------
*/
export const updateUnit = async (
    id,
    data = {}
) => {
    try {
        if (!id) {
            throw new Error(
                "Unit ID is required."
            );
        }

        const formData =
            buildFormData(data, "PUT");

        const response = await api.post(
            `${UNIT_ENDPOINT}/${id}`,
            formData,
            {
                headers: {
                    "Content-Type":
                        "multipart/form-data",
                },
            }
        );

        return handleResponse(response);
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
            throw new Error(
                "Unit ID is required."
            );
        }

        const response = await api.delete(
            `${UNIT_ENDPOINT}/${id}`
        );

        return handleResponse(response);
    } catch (error) {
        handleError(error, "DELETE UNIT");
    }
};

/*
|--------------------------------------------------------------------------
| OPTIONAL: UPDATE UNIT STATUS
|--------------------------------------------------------------------------
|
| Only use this if your Laravel API has:
|
| PATCH /units/{id}/status
|
|--------------------------------------------------------------------------
*/
export const updateUnitStatus = async (
    id,
    status
) => {
    try {
        if (!id) {
            throw new Error(
                "Unit ID is required."
            );
        }

        if (!status) {
            throw new Error(
                "Unit status is required."
            );
        }

        const response = await api.patch(
            `${UNIT_ENDPOINT}/${id}/status`,
            {
                status,
            }
        );

        return handleResponse(response);
    } catch (error) {
        handleError(
            error,
            "UPDATE UNIT STATUS"
        );
    }
};

/*
|--------------------------------------------------------------------------
| OPTIONAL: CHECK UNIT AVAILABILITY
|--------------------------------------------------------------------------
|
| Only use this if your Laravel API has:
|
| GET /units/{id}/availability
|
|--------------------------------------------------------------------------
*/
export const checkUnitAvailability = async (
    id
) => {
    try {
        if (!id) {
            throw new Error(
                "Unit ID is required."
            );
        }

        const response = await api.get(
            `${UNIT_ENDPOINT}/${id}/availability`
        );

        return handleResponse(response);
    } catch (error) {
        handleError(
            error,
            "CHECK UNIT AVAILABILITY"
        );
    }
};

/*
|--------------------------------------------------------------------------
| DEFAULT EXPORT
|--------------------------------------------------------------------------
*/
export default {
    fetchUnits,
    fetchUnit,
    createUnit,
    updateUnit,
    deleteUnit,
    updateUnitStatus,
    checkUnitAvailability,
};