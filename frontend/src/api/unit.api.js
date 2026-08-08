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
| Axios response:
|
| {
|     data: {
|         status: true,
|         code: 200,
|         message: "...",
|         data: [...]
|     }
| }
|
| We return the Laravel response body.
|
|--------------------------------------------------------------------------
*/

const handleResponse = (response) => {
    return response?.data ?? null;
};

/*
|--------------------------------------------------------------------------
| ERROR NORMALIZER
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Never reduce the Axios/Laravel error to only:
|
|     "Something went wrong"
|
| Keep the complete Laravel payload available to useUnits.js.
|
|--------------------------------------------------------------------------
*/

const normalizeError = (error) => {
    /*
    |--------------------------------------------------------------------------
    | Laravel API response
    |--------------------------------------------------------------------------
    */

    if (error?.response?.data) {
        return {
            ...error.response.data,

            status:
                error.response.data.status ??
                false,

            code:
                error.response.data.code ??
                error.response.status ??
                500,

            message:
                error.response.data.message ??
                error.message ??
                "Something went wrong.",

            errors:
                error.response.data.errors ??
                null,

            http_status:
                error.response.status ??
                null,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Axios error without response
    |--------------------------------------------------------------------------
    */

    if (error?.request) {
        return {
            status: false,
            code: 503,
            message:
                "Unable to connect to the server. Please check your connection and try again.",
            errors: null,
            http_status: null,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | JavaScript Error
    |--------------------------------------------------------------------------
    */

    if (error instanceof Error) {
        return {
            status: false,
            code: 500,
            message:
                error.message ||
                "Something went wrong.",
            errors: null,
            http_status: null,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Existing API-style error object
    |--------------------------------------------------------------------------
    */

    if (
        error &&
        typeof error === "object"
    ) {
        return {
            status:
                error.status ??
                false,

            code:
                error.code ??
                500,

            message:
                error.message ??
                "Something went wrong.",

            errors:
                error.errors ??
                null,

            ...error,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Fallback
    |--------------------------------------------------------------------------
    */

    return {
        status: false,
        code: 500,
        message:
            typeof error === "string"
                ? error
                : "Something went wrong.",
        errors: null,
    };
};

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/

const handleError = (error, action) => {
    const normalizedError =
        normalizeError(error);

    console.error(
        `${action} ERROR:`,
        normalizedError
    );

    /*
    |--------------------------------------------------------------------------
    | Keep complete error object for useUnits.js
    |--------------------------------------------------------------------------
    */

    throw normalizedError;
};

/*
|--------------------------------------------------------------------------
| FILE DETECTOR
|--------------------------------------------------------------------------
*/

const isFile = (value) => {
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
| Supports:
|
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

const buildFormData = (
    data = {},
    method = null
) => {
    const formData =
        new FormData();

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
            | Files
            |--------------------------------------------------------------------------
            */

            if (isFile(value)) {
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
                        if (
                            item ===
                                null ||
                            item ===
                                undefined
                        ) {
                            return;
                        }

                        if (
                            isFile(item)
                        ) {
                            formData.append(
                                `${key}[]`,
                                item
                            );

                            return;
                        }

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
                    value
                        ? "1"
                        : "0"
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
        const response =
            await api.get(
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

        const response =
            await api.get(
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
| JSON is used when there are no files.
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
        const hasFile =
            Object.values(
                data
            ).some((value) => {
                if (isFile(value)) {
                    return true;
                }

                if (
                    Array.isArray(
                        value
                    )
                ) {
                    return value.some(
                        (item) =>
                            isFile(item)
                    );
                }

                return false;
            });

        let response;

        /*
        |--------------------------------------------------------------------------
        | JSON REQUEST
        |--------------------------------------------------------------------------
        */

        if (!hasFile) {
            response =
                await api.post(
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
                buildFormData(
                    data
                );

            response =
                await api.post(
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
| Laravel multipart requests:
|
| POST /units/{id}
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
            throw new Error(
                "Unit ID is required."
            );
        }

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

            if (
                status ===
                    null ||
                status ===
                    undefined ||
                status === ""
            ) {
                throw new Error(
                    "Unit status is required."
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Support status resources
            |--------------------------------------------------------------------------
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
                    ? status?.value ??
                      status?.id
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
    updateUnitStatus,
    checkUnitAvailability,
};