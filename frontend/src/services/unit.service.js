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
| Laravel response:
|
| {
|     status: true,
|     code: 200,
|     message: "...",
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
|     }
| }
|
*/

const handleResponse = (response) => {
    return response?.data ?? null;
};

/*
|--------------------------------------------------------------------------
| EXTRACT VALIDATION MESSAGE
|--------------------------------------------------------------------------
|
| Handles Laravel validation structures such as:
|
| errors: {
|     property_id: [
|         "The property field is required."
|     ],
|     unit_number: [
|         "The unit number field is required."
|     ]
| }
|
*/

const getValidationMessage = (errors) => {
    if (!errors) {
        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | errors.error
    |--------------------------------------------------------------------------
    */

    if (
        typeof errors === "object" &&
        typeof errors.error === "string"
    ) {
        return errors.error;
    }

    /*
    |--------------------------------------------------------------------------
    | errors.message
    |--------------------------------------------------------------------------
    */

    if (
        typeof errors === "object" &&
        typeof errors.message === "string"
    ) {
        return errors.message;
    }

    /*
    |--------------------------------------------------------------------------
    | Laravel field validation errors
    |--------------------------------------------------------------------------
    */

    if (
        typeof errors === "object" &&
        !Array.isArray(errors)
    ) {
        for (const value of Object.values(errors)) {
            if (Array.isArray(value) && value.length > 0) {
                return String(value[0]);
            }

            if (typeof value === "string") {
                return value;
            }
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Array errors
    |--------------------------------------------------------------------------
    */

    if (Array.isArray(errors) && errors.length > 0) {
        return String(errors[0]);
    }

    return null;
};

/*
|--------------------------------------------------------------------------
| NORMALIZE ERROR
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Never hide Laravel 422 validation responses.
|
| The complete API error remains available:
|
| error.status
| error.code
| error.message
| error.errors
| error.http_status
| error.response
|
|--------------------------------------------------------------------------
*/

const normalizeError = (error) => {
    /*
    |--------------------------------------------------------------------------
    | Axios + Laravel response
    |--------------------------------------------------------------------------
    */

    if (error?.response) {
        const response = error.response;

        const responseData =
            response?.data ?? {};

        const httpStatus =
            response?.status ?? 500;

        const apiErrors =
            responseData?.errors ?? null;

        const validationMessage =
            getValidationMessage(
                apiErrors
            );

        const message =
            validationMessage ||
            responseData?.message ||
            error?.message ||
            `Request failed with status ${httpStatus}.`;

        return {
            /*
            | Laravel status
            */
            status:
                responseData?.status ??
                false,

            /*
            | Prefer Laravel code when available,
            | otherwise use HTTP status.
            */
            code:
                responseData?.code ??
                httpStatus,

            /*
            | Human readable message
            */
            message,

            /*
            | Keep all validation errors
            */
            errors: apiErrors,

            /*
            | Actual HTTP status
            */
            http_status: httpStatus,

            /*
            | Laravel data payload
            */
            data:
                responseData?.data ??
                null,

            /*
            | Complete Laravel response
            */
            response:
                responseData,

            /*
            | Axios response
            */
            axios_response:
                response,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Request sent but server did not respond
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
            data: null,
            response: null,
            axios_response: null,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Existing normalized/API error
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
                error.http_status ??
                500,

            message:
                error.message ??
                "Something went wrong.",

            errors:
                error.errors ??
                null,

            http_status:
                error.http_status ??
                null,

            data:
                error.data ??
                null,

            response:
                error.response ??
                null,

            ...error,
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
            data: null,
            response: null,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | String error
    |--------------------------------------------------------------------------
    */

    if (typeof error === "string") {
        return {
            status: false,
            code: 500,
            message: error,
            errors: null,
            http_status: null,
            data: null,
            response: null,
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
            "Something went wrong.",
        errors: null,
        http_status: null,
        data: null,
        response: null,
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

    /*
    |--------------------------------------------------------------------------
    | Detailed development logging
    |--------------------------------------------------------------------------
    */

    console.error(
        `❌ ${action} ERROR:`,
        normalizedError
    );

    /*
    |--------------------------------------------------------------------------
    | Specifically expose Laravel validation errors
    |--------------------------------------------------------------------------
    */

    if (
        normalizedError.code === 422 ||
        normalizedError.http_status === 422
    ) {
        console.error(
            `⚠️ ${action} VALIDATION ERRORS:`,
            normalizedError.errors
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Throw normalized object
    |--------------------------------------------------------------------------
    |
    | useUnits.js can now access:
    |
    | error.code
    | error.message
    | error.errors
    | error.http_status
    |
    */

    throw normalizedError;
};

/*
|--------------------------------------------------------------------------
| FILE / BLOB DETECTOR
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
| CHECK NESTED FILE
|--------------------------------------------------------------------------
*/

const containsFile = (value) => {
    if (isFile(value)) {
        return true;
    }

    if (Array.isArray(value)) {
        return value.some(
            (item) =>
                containsFile(item)
        );
    }

    if (
        value &&
        typeof value === "object"
    ) {
        return Object.values(value).some(
            (nestedValue) =>
                containsFile(
                    nestedValue
                )
        );
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
| - strings
| - numbers
| - booleans
| - null
| - arrays
| - objects
| - files
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

            if (
                value === undefined
            ) {
                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Null
            |--------------------------------------------------------------------------
            */

            if (
                value === null
            ) {
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

            if (
                isFile(value)
            ) {
                formData.append(
                    key,
                    value
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
            | Arrays
            |--------------------------------------------------------------------------
            */

            if (
                Array.isArray(value)
            ) {
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

                        /*
                        | File inside array
                        */

                        if (
                            isFile(item)
                        ) {
                            formData.append(
                                `${key}[]`,
                                item
                            );

                            return;
                        }

                        /*
                        | Object inside array
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
                        | Primitive
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
            | Object
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
            | String / Number
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
    | Laravel method spoofing
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
| JSON is used when no file exists.
|
| FormData is used automatically when
| a File / Blob exists.
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
        | JSON
        |--------------------------------------------------------------------------
        */

        if (!hasFile) {
            response =
                await api.post(
                    UNIT_ENDPOINT,
                    data,
                    {
                        headers: {
                            Accept:
                                "application/json",
                            "Content-Type":
                                "application/json",
                        },
                    }
                );
        }

        /*
        |--------------------------------------------------------------------------
        | MULTIPART
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
                    formData,
                    {
                        headers: {
                            Accept:
                                "application/json",
                        },
                    }
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
| Laravel:
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
                "PUT"
            );

        const response =
            await api.post(
                `${UNIT_ENDPOINT}/${id}`,
                formData,
                {
                    headers: {
                        Accept:
                            "application/json",
                    },
                }
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
                },
                {
                    headers: {
                        Accept:
                            "application/json",
                    },
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
                status === null ||
                status === undefined ||
                status === ""
            ) {
                throw new Error(
                    "Unit status is required."
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Support:
            |
            | "occupied"
            |
            | {
            |     value: "occupied",
            |     label: "Occupied"
            | }
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
                    },
                    {
                        headers: {
                            Accept:
                                "application/json",
                        },
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
                    `${UNIT_ENDPOINT}/${id}/availability`,
                    {
                        headers: {
                            Accept:
                                "application/json",
                        },
                    }
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