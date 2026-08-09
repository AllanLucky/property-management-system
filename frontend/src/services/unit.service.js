
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
| Return the Laravel response body.
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
| Always throw a normalized Error object while preserving the
| Laravel response payload.
|
|--------------------------------------------------------------------------
*/

const handleError = (error, label) => {
    const responseData = error?.response?.data;

    /*
    |--------------------------------------------------------------------------
    | Laravel API error
    |--------------------------------------------------------------------------
    */

    if (responseData) {
        const normalizedError = new Error(
            responseData?.message ||
                "Something went wrong."
        );

        normalizedError.status =
            responseData?.status ?? false;

        normalizedError.code =
            responseData?.code ??
            error?.response?.status ??
            500;

        normalizedError.errors =
            responseData?.errors ?? null;

        normalizedError.data =
            responseData?.data ?? null;

        normalizedError.response =
            responseData;

        console.error(
            `${label} ERROR:`,
            responseData
        );

        throw normalizedError;
    }

    /*
    |--------------------------------------------------------------------------
    | Axios error without Laravel payload
    |--------------------------------------------------------------------------
    */

    if (error?.response) {
        const normalizedError = new Error(
            error?.message ||
                `Request failed with status ${error.response.status}.`
        );

        normalizedError.status = false;

        normalizedError.code =
            error.response.status;

        normalizedError.errors = null;

        normalizedError.response =
            error.response.data ?? null;

        console.error(
            `${label} ERROR:`,
            error.response
        );

        throw normalizedError;
    }

    /*
    |--------------------------------------------------------------------------
    | Existing Error
    |--------------------------------------------------------------------------
    */

    if (error instanceof Error) {
        console.error(
            `${label} ERROR:`,
            error
        );

        throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | Unknown error
    |--------------------------------------------------------------------------
    */

    const normalizedError = new Error(
        typeof error === "string"
            ? error
            : "Something went wrong."
    );

    normalizedError.status = false;
    normalizedError.code = 500;
    normalizedError.errors = null;
    normalizedError.response = null;

    console.error(
        `${label} ERROR:`,
        error
    );

    throw normalizedError;
};

/*
|--------------------------------------------------------------------------
| FILE / BLOB DETECTOR
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
| CHECK IF DATA CONTAINS FILE
|--------------------------------------------------------------------------
*/

const containsFile = (data = {}) => {
    return Object.values(data).some(
        (value) => {
            /*
            |--------------------------------------------------------------------------
            | Direct File / Blob
            |--------------------------------------------------------------------------
            */

            if (isFileOrBlob(value)) {
                return true;
            }

            /*
            |--------------------------------------------------------------------------
            | File inside array
            |--------------------------------------------------------------------------
            */

            if (Array.isArray(value)) {
                return value.some((item) =>
                    isFileOrBlob(item)
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Nested object
            |--------------------------------------------------------------------------
            */

            if (
                value &&
                typeof value === "object"
            ) {
                return Object.values(value).some(
                    (nestedValue) =>
                        isFileOrBlob(
                            nestedValue
                        )
                );
            }

            return false;
        }
    );
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
    method = null
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
            */

            if (value === null) {
                formData.append(
                    key,
                    ""
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | File / Blob
            |--------------------------------------------------------------------------
            */

            if (isFileOrBlob(value)) {
                formData.append(
                    key,
                    value
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Arrays
            |--------------------------------------------------------------------------
            */

            if (Array.isArray(value)) {
                value.forEach(
                    (item) => {
                        /*
                        |------------------------------------------------------------------
                        | Ignore empty array items
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
                        | Array File / Blob
                        |------------------------------------------------------------------
                        */

                        if (
                            isFileOrBlob(
                                item
                            )
                        ) {
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
                                JSON.stringify(
                                    item
                                )
                            );

                            return;
                        }

                        /*
                        |------------------------------------------------------------------
                        | Primitive array value
                        |------------------------------------------------------------------
                        */

                        formData.append(
                            `${key}[]`,
                            String(item)
                        );
                    }
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Objects
            |--------------------------------------------------------------------------
            */

            if (
                typeof value ===
                "object"
            ) {
                formData.append(
                    key,
                    JSON.stringify(
                        value
                    )
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Boolean
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

    if (method) {
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

        return handleResponse(
            response
        );
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

export const fetchUnit = async (
    id
) => {
    try {
        if (!id) {
            throw new Error(
                "Unit ID is required."
            );
        }

        const response = await api.get(
            `${UNIT_ENDPOINT}/${id}`
        );

        return handleResponse(
            response
        );
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
| JSON is used when no files are present.
|
| multipart/form-data is used automatically
| when a File or Blob exists.
|
|--------------------------------------------------------------------------
*/

export const createUnit = async (
    data = {}
) => {
    try {
        let response;

        const hasFile =
            containsFile(data);

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
                formData
            );
        }

        return handleResponse(
            response
        );
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

        /*
        |--------------------------------------------------------------------------
        | Always use FormData for updates.
        |--------------------------------------------------------------------------
        |
        | This prevents problems with Laravel multipart PUT/PATCH requests
        | and supports future file uploads.
        |
        |--------------------------------------------------------------------------
        */

        const formData =
            buildFormData(
                data,
                "PUT"
            );

        const response =
            await api.post(
                `${UNIT_ENDPOINT}/${id}`,
                formData
            );

        return handleResponse(
            response
        );
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

        const response =
            await api.delete(
                `${UNIT_ENDPOINT}/${id}`
            );

        return handleResponse(
            response
        );
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
| POST /units/bulk-delete
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

        const response =
            await api.post(
                `${UNIT_ENDPOINT}/bulk-delete`,
                {
                    ids,
                }
            );

        return handleResponse(
            response
        );
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
| PATCH /units/{id}/status
|
|--------------------------------------------------------------------------
*/

export const updateUnitStatus =
    async (
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
            |
            | Supports:
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

            const normalizedStatus =
                typeof status ===
                "object"
                    ? status?.value
                    : status;

            if (
                !normalizedStatus
            ) {
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

            return handleResponse(
                response
            );
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

