
import api from "../api/axios";

/*
|--------------------------------------------------------------------------
| UNIT ENDPOINT
|--------------------------------------------------------------------------
*/

const UNIT_ENDPOINT = "/units";

/*
|--------------------------------------------------------------------------
| RESPONSE HANDLER
|--------------------------------------------------------------------------
|
| Laravel success response:
|
| {
|     status: true,
|     code: 200,
|     message: "Units fetched successfully.",
|     data: [...]
| }
|
| Axios response:
|
| {
|     data: {
|         status: true,
|         code: 200,
|         message: "...",
|         data: [...]
|     },
|     status: 200,
|     ...
| }
|
| We return the Laravel response body.
|--------------------------------------------------------------------------
*/

const handleResponse = (response) => {
    const payload = response?.data;

    if (
        payload === undefined ||
        payload === null
    ) {
        return null;
    }

    return payload;
};

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
|
| Preserve the Laravel error response so hooks/components can access:
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

const handleError = (error, label) => {
    const responseData =
        error?.response?.data;

    const errorData =
        responseData ??
        error?.message ??
        error ??
        {
            status: false,
            code: 500,
            message: "Something went wrong.",
            errors: null,
        };

    console.error(
        `${label} ERROR:`,
        errorData
    );

    throw errorData;
};

/*
|--------------------------------------------------------------------------
| FILE / BLOB DETECTOR
|--------------------------------------------------------------------------
|
| Protects against File/Blob being undefined in some environments.
|--------------------------------------------------------------------------
*/

const isFileOrBlob = (value) => {
    if (
        typeof File !== "undefined" &&
        value instanceof File
    ) {
        return true;
    }

    if (
        typeof Blob !== "undefined" &&
        value instanceof Blob
    ) {
        return true;
    }

    return false;
};

/*
|--------------------------------------------------------------------------
| FORM DATA BUILDER
|--------------------------------------------------------------------------
|
| Handles:
| - strings
| - numbers
| - booleans
| - null
| - undefined
| - arrays
| - objects
| - File
| - Blob
| - Laravel method spoofing
|
|--------------------------------------------------------------------------
*/

const buildFormData = (
    data = {},
    includeMethod = false,
    method = "POST"
) => {
    const formData = new FormData();

    Object.entries(data).forEach(
        ([key, value]) => {
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
            |
            | Sending an empty string allows Laravel to receive the field.
            |--------------------------------------------------------------------------
            */

            if (value === null) {
                formData.append(key, "");
                return;
            }

            /*
            |--------------------------------------------------------------------------
            | File / Blob
            |--------------------------------------------------------------------------
            */

            if (isFileOrBlob(value)) {
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
                    /*
                    |------------------------------------------------------------------
                    | Ignore null array items
                    |------------------------------------------------------------------
                    */

                    if (
                        item === undefined ||
                        item === null
                    ) {
                        return;
                    }

                    /*
                    |------------------------------------------------------------------
                    | Array file
                    |------------------------------------------------------------------
                    */

                    if (isFileOrBlob(item)) {
                        formData.append(
                            `${key}[]`,
                            item
                        );

                        return;
                    }

                    /*
                    |------------------------------------------------------------------
                    | Array object
                    |------------------------------------------------------------------
                    */

                    if (
                        typeof item ===
                        "object"
                    ) {
                        formData.append(
                            `${key}[]`,
                            JSON.stringify(item)
                        );

                        return;
                    }

                    /*
                    |------------------------------------------------------------------
                    | Array primitive
                    |------------------------------------------------------------------
                    */

                    formData.append(
                        `${key}[]`,
                        String(item)
                    );
                });

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Objects
            |--------------------------------------------------------------------------
            */

            if (
                typeof value === "object"
            ) {
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
            |
            | Laravel safely interprets 1 / 0.
            |--------------------------------------------------------------------------
            */

            if (
                typeof value ===
                "boolean"
            ) {
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

            formData.append(
                key,
                String(value)
            );
        }
    );

    /*
    |--------------------------------------------------------------------------
    | Laravel Method Spoofing
    |--------------------------------------------------------------------------
    */

    if (includeMethod) {
        formData.append(
            "_method",
            method
        );
    }

    return formData;
};

/*
|--------------------------------------------------------------------------
| GET ALL UNITS
|--------------------------------------------------------------------------
|
| Supports:
|
| fetchUnits({
|     property_id: 20,
|     apartment_id: 78,
|     status: "occupied",
|     search: "601",
|     floor: 6,
|     page: 1,
|     per_page: 20,
|     with_relations: true,
| });
|
|--------------------------------------------------------------------------
*/

export const fetchUnits = async (
    params = {}
) => {
    try {
        const response = await api.get(
            UNIT_ENDPOINT,
            {
                params,
            }
        );

        return handleResponse(response);
    } catch (error) {
        handleError(
            error,
            "FETCH UNITS"
        );
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
        handleError(
            error,
            "FETCH UNIT"
        );
    }
};

/*
|--------------------------------------------------------------------------
| CREATE UNIT
|--------------------------------------------------------------------------
|
| Uses JSON when no files are present.
|
| Automatically switches to multipart/form-data
| when a File or Blob exists.
|
|--------------------------------------------------------------------------
*/

export const createUnit = async (
    data = {}
) => {
    try {
        const hasFile =
            Object.values(data).some(
                (value) => {
                    /*
                    |------------------------------------------------------------------
                    | Direct File / Blob
                    |------------------------------------------------------------------
                    */

                    if (
                        isFileOrBlob(value)
                    ) {
                        return true;
                    }

                    /*
                    |------------------------------------------------------------------
                    | File inside array
                    |------------------------------------------------------------------
                    */

                    if (
                        Array.isArray(value)
                    ) {
                        return value.some(
                            (item) =>
                                isFileOrBlob(
                                    item
                                )
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
        handleError(
            error,
            "CREATE UNIT"
        );
    }
};

/*
|--------------------------------------------------------------------------
| UPDATE UNIT
|--------------------------------------------------------------------------
|
| Laravel-safe multipart update:
|
| POST /units/{id}
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
            buildFormData(
                data,
                true,
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
        handleError(
            error,
            "UPDATE UNIT"
        );
    }
};

/*
|--------------------------------------------------------------------------
| DELETE UNIT
|--------------------------------------------------------------------------
*/

export const deleteUnit = async (
    id
) => {
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
        handleError(
            error,
            "DELETE UNIT"
        );
    }
};

/*
|--------------------------------------------------------------------------
| BULK DELETE UNITS
|--------------------------------------------------------------------------
|
| Expected backend endpoint:
|
| POST /units/bulk-delete
|
| Payload:
|
| {
|     ids: [1, 2, 3]
| }
|
|--------------------------------------------------------------------------
*/

export const deleteUnits = async (
    ids = []
) => {
    try {
        if (
            !Array.isArray(ids) ||
            ids.length === 0
        ) {
            throw new Error(
                "At least one unit ID is required."
            );
        }

        const response = await api.post(
            `${UNIT_ENDPOINT}/bulk-delete`,
            {
                ids,
            }
        );

        return handleResponse(response);
    } catch (error) {
        handleError(
            error,
            "BULK DELETE UNITS"
        );
    }
};

/*
|--------------------------------------------------------------------------
| UPDATE UNIT STATUS
|--------------------------------------------------------------------------
|
| Expected backend endpoint:
|
| PATCH /units/{id}/status
|
| The API returns status as an object:
|
| {
|     value: "occupied",
|     label: "Occupied",
|     badge: "primary",
|     ...
| }
|
| The frontend may pass either:
|
| "occupied"
|
| OR:
|
| {
|     value: "occupied",
|     label: "Occupied"
| }
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
        | Normalize status
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

        const response =
            await api.patch(
                `${UNIT_ENDPOINT}/${id}/status`,
                {
                    status:
                        normalizedStatus,
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
| Expected backend endpoint:
|
| GET /units/{id}/availability
|
|--------------------------------------------------------------------------
*/

export const checkUnitAvailability =
    async (id) => {
        try {
            if (!id) {
                throw new Error(
                    "Unit ID is required."
                );
            }

            const response =
                await api.get(
                    `${UNIT_ENDPOINT}/${id}/availability`
                );

            return handleResponse(
                response
            );
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
    deleteUnits,
    updateUnitStatus,
    checkUnitAvailability,
};
