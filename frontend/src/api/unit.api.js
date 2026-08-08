import api from "../api/axios";

/*
|--------------------------------------------------------------------------
| ENDPOINT
|--------------------------------------------------------------------------
*/

const UNIT_ENDPOINT = "/units";

/*
|--------------------------------------------------------------------------
| RESPONSE HANDLER
|--------------------------------------------------------------------------
|
| Laravel response:
|
| {
|     status: true,
|     code: 200,
|     message: "Units fetched successfully.",
|     data: [...]
| }
|
| We return the Laravel payload exactly as received.
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
|
| Keeps the Laravel error payload intact so the hook/component can access:
|
| {
|     status: false,
|     code: 500,
|     message: "...",
|     errors: {...}
| }
|
|--------------------------------------------------------------------------
*/

const handleError = (error, action) => {
    const responseData = error?.response?.data;

    const errorData =
        responseData ??
        error?.message ??
        error ??
        {
            status: 500,
            message: "Something went wrong.",
            errors: null,
        };

    console.error(`${action} ERROR:`, errorData);

    throw errorData;
};

/*
|--------------------------------------------------------------------------
| FILE DETECTOR
|--------------------------------------------------------------------------
*/

const isFile = (value) => {
    if (typeof File !== "undefined" && value instanceof File) {
        return true;
    }

    if (typeof Blob !== "undefined" && value instanceof Blob) {
        return true;
    }

    return false;
};

/*
|--------------------------------------------------------------------------
| FORM DATA BUILDER
|--------------------------------------------------------------------------
|
| Supports:
| - Strings
| - Numbers
| - Booleans
| - Null values
| - Arrays
| - Objects
| - Files
| - Laravel method spoofing
|
|--------------------------------------------------------------------------
*/

const buildFormData = (data = {}, method = null) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
        /*
        |--------------------------------------------------------------------------
        | Ignore undefined
        |--------------------------------------------------------------------------
        */

        if (value === undefined) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Null
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

        if (isFile(value)) {
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
                if (item === null || item === undefined) {
                    return;
                }

                if (isFile(item)) {
                    formData.append(`${key}[]`, item);
                    return;
                }

                if (typeof item === "object") {
                    formData.append(
                        `${key}[]`,
                        JSON.stringify(item)
                    );

                    return;
                }

                formData.append(`${key}[]`, String(item));
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

        formData.append(key, String(value));
    });

    /*
    |--------------------------------------------------------------------------
    | Laravel Method Spoofing
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
| Example:
|
| fetchUnits({
|     search: "601",
|     property_id: 20,
|     apartment_id: 78,
|     status: "occupied",
|     floor: 6,
|     page: 1,
|     per_page: 20,
|     with_relations: true,
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
            throw new Error("Unit ID is required.");
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
| JSON is used when there are no files.
|
| multipart/form-data is automatically used when
| a File or Blob is detected.
|
|--------------------------------------------------------------------------
*/

export const createUnit = async (data = {}) => {
    try {
        const hasFile = Object.values(data).some(
            (value) => {
                if (isFile(value)) {
                    return true;
                }

                if (Array.isArray(value)) {
                    return value.some((item) =>
                        isFile(item)
                    );
                }

                return false;
            }
        );

        let response;

        /*
        |--------------------------------------------------------------------------
        | JSON REQUEST
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
        | MULTIPART REQUEST
        |--------------------------------------------------------------------------
        */

        else {
            const formData = buildFormData(data);

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
| Laravel multipart requests are handled using:
|
| POST /units/{id}
|
| with:
|
| _method=PUT
|
|--------------------------------------------------------------------------
*/

export const updateUnit = async (
    id,
    data = {}
) => {
    try {
        if (!id) {
            throw new Error("Unit ID is required.");
        }

        const formData = buildFormData(
            data,
            "PUT"
        );

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
            throw new Error("Unit ID is required.");
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
| UPDATE UNIT STATUS
|--------------------------------------------------------------------------
|
| Expected Laravel route:
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

        /*
        |--------------------------------------------------------------------------
        | Support status objects
        |--------------------------------------------------------------------------
        |
        | Your API returns status as:
        |
        | {
        |     value: "occupied",
        |     label: "Occupied",
        |     ...
        | }
        |
        | If the frontend accidentally passes the whole object,
        | extract the actual value.
        |
        |--------------------------------------------------------------------------
        */

        const normalizedStatus =
            typeof status === "object"
                ? status?.value
                : status;

        if (!normalizedStatus) {
            throw new Error(
                "A valid unit status is required."
            );
        }

        const response = await api.patch(
            `${UNIT_ENDPOINT}/${id}/status`,
            {
                status: normalizedStatus,
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
| CHECK UNIT AVAILABILITY
|--------------------------------------------------------------------------
|
| Expected Laravel route:
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

