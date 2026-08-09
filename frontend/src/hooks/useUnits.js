import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    fetchUnits,
    fetchUnit,
    createUnit,
    updateUnit,
    deleteUnit,
    updateUnitStatus,
    checkUnitAvailability,
} from "../services/unit.service";

/*
|--------------------------------------------------------------------------
| UNIT HOOK
|--------------------------------------------------------------------------
*/

const useUnit = (options = {}) => {
    const {
        autoFetch = true,
        initialParams = {},
    } = options;

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [units, setUnits] = useState([]);
    const [unit, setUnit] = useState(null);

    const [loading, setLoading] = useState(false);
    const [loadingUnit, setLoadingUnit] = useState(false);

    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [checkingAvailability, setCheckingAvailability] =
        useState(false);

    const [error, setError] = useState(null);

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: 0,
        to: 0,
    });

    /*
    |--------------------------------------------------------------------------
    | REFS
    |--------------------------------------------------------------------------
    */

    const initialParamsRef = useRef(initialParams);

    const mountedRef = useRef(true);

    const requestIdRef = useRef(0);

    const fetchingRef = useRef(false);

    /*
    |--------------------------------------------------------------------------
    | COMPONENT MOUNT
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | KEEP INITIAL PARAMS UPDATED
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        initialParamsRef.current = initialParams;
    }, [initialParams]);

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE ERROR
    |--------------------------------------------------------------------------
    |
    | Laravel can return:
    |
    | {
    |     status: false,
    |     code: 500,
    |     message: "Failed to fetch units.",
    |     errors: {...}
    | }
    |
    | Axios can return:
    |
    | error.response.data
    |
    |--------------------------------------------------------------------------
    */

    const normalizeError = useCallback(
        (
            err,
            fallback = "Something went wrong."
        ) => {
            /*
            |--------------------------------------------------------------------------
            | No error
            |--------------------------------------------------------------------------
            */

            if (!err) {
                return {
                    status: false,
                    code: 500,
                    message: fallback,
                    errors: null,
                    response: null,
                };
            }

            /*
            |--------------------------------------------------------------------------
            | String error
            |--------------------------------------------------------------------------
            */

            if (typeof err === "string") {
                return {
                    status: false,
                    code: 500,
                    message: err,
                    errors: null,
                    response: null,
                };
            }

            /*
            |--------------------------------------------------------------------------
            | Axios response
            |--------------------------------------------------------------------------
            */

            const axiosResponse =
                err?.response ?? null;

            const responseData =
                axiosResponse?.data ?? null;

            /*
            |--------------------------------------------------------------------------
            | Laravel payload
            |--------------------------------------------------------------------------
            */

            const payload =
                responseData &&
                typeof responseData === "object"
                    ? responseData
                    : err;

            /*
            |--------------------------------------------------------------------------
            | Preserve Laravel error
            |--------------------------------------------------------------------------
            */

            const status =
                payload?.status ??
                false;

            const code =
                payload?.code ??
                axiosResponse?.status ??
                err?.code ??
                500;

            const message =
                payload?.message ??
                err?.message ??
                fallback;

            const errors =
                payload?.errors ??
                null;

            return {
                status,
                code,
                message,
                errors,

                /*
                |----------------------------------------------------------------------
                | Preserve original Axios response for debugging
                |----------------------------------------------------------------------
                */

                response:
                    axiosResponse ??
                    null,
            };
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE STATUS
    |--------------------------------------------------------------------------
    */

    const normalizeStatus = useCallback(
        (status) => {
            /*
            |--------------------------------------------------------------------------
            | Empty status
            |--------------------------------------------------------------------------
            */

            if (
                status === null ||
                status === undefined ||
                status === ""
            ) {
                return {
                    value: "unknown",
                    label: "Unknown",
                };
            }

            /*
            |--------------------------------------------------------------------------
            | String status
            |--------------------------------------------------------------------------
            */

            if (typeof status === "string") {
                const value =
                    status
                        .trim()
                        .toLowerCase()
                        .replace(
                            /[\s-]+/g,
                            "_"
                        );

                const label =
                    value
                        .split("_")
                        .map(
                            (word) =>
                                word
                                    .charAt(0)
                                    .toUpperCase() +
                                word.slice(1)
                        )
                        .join(" ");

                return {
                    value,
                    label,
                };
            }

            /*
            |--------------------------------------------------------------------------
            | Object status
            |--------------------------------------------------------------------------
            */

            if (
                typeof status === "object"
            ) {
                const value =
                    status?.value ??
                    status?.current ??
                    status?.status ??
                    status?.name ??
                    "unknown";

                const normalizedValue =
                    String(value)
                        .trim()
                        .toLowerCase()
                        .replace(
                            /[\s-]+/g,
                            "_"
                        );

                const label =
                    status?.label ??
                    status?.name ??
                    normalizedValue
                        .split("_")
                        .map(
                            (word) =>
                                word
                                    .charAt(0)
                                    .toUpperCase() +
                                word.slice(1)
                        )
                        .join(" ");

                return {
                    ...status,
                    value: normalizedValue,
                    label,
                };
            }

            return {
                value: "unknown",
                label: "Unknown",
            };
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE UNIT
    |--------------------------------------------------------------------------
    */

    const normalizeUnit = useCallback(
        (item) => {
            if (
                !item ||
                typeof item !== "object"
            ) {
                return item;
            }

            /*
            |--------------------------------------------------------------------------
            | Property
            |--------------------------------------------------------------------------
            */

            const property =
                item?.property
                    ? {
                          ...item.property,

                          name:
                              item.property.name ??
                              item.property.title ??
                              `Property #${item.property.id}`,
                      }
                    : null;

            /*
            |--------------------------------------------------------------------------
            | Apartment
            |--------------------------------------------------------------------------
            */

            const apartment =
                item?.apartment
                    ? {
                          ...item.apartment,

                          name:
                              item.apartment.name ??
                              item.apartment.title ??
                              `Apartment #${item.apartment.id}`,
                      }
                    : null;

            /*
            |--------------------------------------------------------------------------
            | Tenant
            |--------------------------------------------------------------------------
            */

            const tenant =
                item?.tenant ?? null;

            /*
            |--------------------------------------------------------------------------
            | Tenancy
            |--------------------------------------------------------------------------
            */

            const tenancy =
                item?.tenancy ?? null;

            /*
            |--------------------------------------------------------------------------
            | Tenancy Statistics
            |--------------------------------------------------------------------------
            */

            const tenancyStatistics = {
                total:
                    item?.tenancy_statistics
                        ?.total ?? 0,

                active:
                    item?.tenancy_statistics
                        ?.active ?? 0,

                pending:
                    item?.tenancy_statistics
                        ?.pending ?? 0,

                expired:
                    item?.tenancy_statistics
                        ?.expired ?? 0,

                terminated:
                    item?.tenancy_statistics
                        ?.terminated ?? 0,

                cancelled:
                    item?.tenancy_statistics
                        ?.cancelled ?? 0,

                ...(item?.tenancy_statistics ??
                    {}),
            };

            /*
            |--------------------------------------------------------------------------
            | Maintenance
            |--------------------------------------------------------------------------
            */

            const maintenance = {
                total:
                    item?.maintenance
                        ?.total ?? 0,

                open:
                    item?.maintenance
                        ?.open ?? 0,

                pending:
                    item?.maintenance
                        ?.pending ?? 0,

                assigned:
                    item?.maintenance
                        ?.assigned ?? 0,

                in_progress:
                    item?.maintenance
                        ?.in_progress ?? 0,

                on_hold:
                    item?.maintenance
                        ?.on_hold ?? 0,

                completed:
                    item?.maintenance
                        ?.completed ?? 0,

                cancelled:
                    item?.maintenance
                        ?.cancelled ?? 0,

                rejected:
                    item?.maintenance
                        ?.rejected ?? 0,

                estimated_cost:
                    item?.maintenance
                        ?.estimated_cost ?? 0,

                actual_cost:
                    item?.maintenance
                        ?.actual_cost ?? 0,

                ...(item?.maintenance ?? {}),
            };

            /*
            |--------------------------------------------------------------------------
            | Return normalized unit
            |--------------------------------------------------------------------------
            */

            return {
                ...item,

                /*
                |----------------------------------------------------------------------
                | Core
                |----------------------------------------------------------------------
                */

                id: item.id,

                name:
                    item.name ??
                    item.unit_name ??
                    item.unit_number ??
                    (item.id
                        ? `Unit #${item.id}`
                        : "Unnamed Unit"),

                unit_number:
                    item.unit_number ??
                    item.number ??
                    null,

                /*
                |----------------------------------------------------------------------
                | Status
                |----------------------------------------------------------------------
                */

                status:
                    normalizeStatus(
                        item.status
                    ),

                /*
                |----------------------------------------------------------------------
                | Property
                |----------------------------------------------------------------------
                */

                property,

                property_id:
                    item.property_id ??
                    property?.id ??
                    null,

                /*
                |----------------------------------------------------------------------
                | Apartment
                |----------------------------------------------------------------------
                */

                apartment,

                apartment_id:
                    item.apartment_id ??
                    apartment?.id ??
                    null,

                /*
                |----------------------------------------------------------------------
                | Unit Details
                |----------------------------------------------------------------------
                */

                details:
                    item.details ?? {},

                /*
                |----------------------------------------------------------------------
                | Pricing
                |----------------------------------------------------------------------
                */

                pricing:
                    item.pricing ?? {},

                /*
                |----------------------------------------------------------------------
                | Features
                |----------------------------------------------------------------------
                */

                features:
                    item.features ?? {},

                /*
                |----------------------------------------------------------------------
                | Tenant
                |----------------------------------------------------------------------
                */

                tenant,

                /*
                |----------------------------------------------------------------------
                | Tenancy
                |----------------------------------------------------------------------
                */

                tenancy,

                /*
                |----------------------------------------------------------------------
                | Tenancy Statistics
                |----------------------------------------------------------------------
                */

                tenancy_statistics:
                    tenancyStatistics,

                /*
                |----------------------------------------------------------------------
                | Maintenance
                |----------------------------------------------------------------------
                */

                maintenance,

                /*
                |----------------------------------------------------------------------
                | Maintenance Summary
                |----------------------------------------------------------------------
                */

                maintenance_summary:
                    item.maintenance_summary ??
                    {},

                /*
                |----------------------------------------------------------------------
                | Insights
                |----------------------------------------------------------------------
                */

                insights:
                    item.insights ?? {},

                /*
                |----------------------------------------------------------------------
                | Availability
                |----------------------------------------------------------------------
                */

                availability:
                    item.availability ?? {},
            };
        },
        [normalizeStatus]
    );

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE API RESPONSE
    |--------------------------------------------------------------------------
    |
    | Supports:
    |
    | 1. []
    |
    | 2. { data: [] }
    |
    | 3. { data: { data: [] } }
    |
    | 4. { units: [] }
    |
    |--------------------------------------------------------------------------
    */

    const normalizeUnitsResponse =
        useCallback(
            (response) => {
                const payload =
                    response ?? {};

                /*
                |--------------------------------------------------------------------------
                | Direct array
                |--------------------------------------------------------------------------
                */

                if (
                    Array.isArray(
                        payload
                    )
                ) {
                    return {
                        data: payload.map(
                            normalizeUnit
                        ),
                        meta: null,
                    };
                }

                /*
                |--------------------------------------------------------------------------
                | Laravel:
                |
                | {
                |   status: true,
                |   data: []
                | }
                |--------------------------------------------------------------------------
                */

                if (
                    Array.isArray(
                        payload?.data
                    )
                ) {
                    return {
                        data:
                            payload.data.map(
                                normalizeUnit
                            ),
                        meta: payload,
                    };
                }

                /*
                |--------------------------------------------------------------------------
                | Laravel paginator:
                |
                | {
                |   data: {
                |      data: [],
                |      current_page: 1,
                |      last_page: 5
                |   }
                | }
                |--------------------------------------------------------------------------
                */

                if (
                    Array.isArray(
                        payload?.data?.data
                    )
                ) {
                    return {
                        data:
                            payload.data.data.map(
                                normalizeUnit
                            ),
                        meta:
                            payload.data,
                    };
                }

                /*
                |--------------------------------------------------------------------------
                | {
                |    units: []
                | }
                |--------------------------------------------------------------------------
                */

                if (
                    Array.isArray(
                        payload?.units
                    )
                ) {
                    return {
                        data:
                            payload.units.map(
                                normalizeUnit
                            ),
                        meta: payload,
                    };
                }

                /*
                |--------------------------------------------------------------------------
                | Empty
                |--------------------------------------------------------------------------
                */

                return {
                    data: [],
                    meta: payload,
                };
            },
            [normalizeUnit]
        );

    /*
    |--------------------------------------------------------------------------
    | GET UNITS
    |--------------------------------------------------------------------------
    */

    const getUnits = useCallback(
        async (params = {}) => {
            /*
            |--------------------------------------------------------------------------
            | Prevent duplicate simultaneous requests
            |--------------------------------------------------------------------------
            */

            if (fetchingRef.current) {
                return units;
            }

            const requestId =
                ++requestIdRef.current;

            fetchingRef.current = true;

            setLoading(true);
            setError(null);

            try {
                const mergedParams = {
                    ...initialParamsRef.current,
                    ...params,
                };

                console.log(
                    "FETCH UNITS PARAMS:",
                    mergedParams
                );

                const response =
                    await fetchUnits(
                        mergedParams
                    );

                /*
                |--------------------------------------------------------------------------
                | Ignore stale request
                |--------------------------------------------------------------------------
                */

                if (
                    requestId !==
                    requestIdRef.current
                ) {
                    return [];
                }

                const normalized =
                    normalizeUnitsResponse(
                        response
                    );

                const data =
                    Array.isArray(
                        normalized.data
                    )
                        ? normalized.data
                        : [];

                if (
                    mountedRef.current
                ) {
                    setUnits(data);

                    /*
                    |--------------------------------------------------------------------------
                    | Pagination
                    |--------------------------------------------------------------------------
                    */

                    const meta =
                        normalized.meta ??
                        {};

                    const dataLength =
                        data.length;

                    setPagination({
                        current_page:
                            Number(
                                meta.current_page ??
                                    1
                            ),

                        last_page:
                            Number(
                                meta.last_page ??
                                    1
                            ),

                        per_page:
                            Number(
                                meta.per_page ??
                                    dataLength
                            ),

                        total:
                            Number(
                                meta.total ??
                                    dataLength
                            ),

                        from:
                            Number(
                                meta.from ??
                                    (dataLength >
                                    0
                                        ? 1
                                        : 0)
                            ),

                        to:
                            Number(
                                meta.to ??
                                    dataLength
                            ),
                    });
                }

                return data;
            } catch (err) {
                const normalizedError =
                    normalizeError(
                        err,
                        "Failed to fetch units."
                    );

                console.error(
                    "FETCH UNITS ERROR:",
                    normalizedError
                );

                if (
                    mountedRef.current
                ) {
                    setError(
                        normalizedError
                    );
                }

                throw normalizedError;
            } finally {
                fetchingRef.current = false;

                if (
                    mountedRef.current
                ) {
                    setLoading(false);
                }
            }
        },
        [
            normalizeError,
            normalizeUnitsResponse,
            units,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | GET SINGLE UNIT
    |--------------------------------------------------------------------------
    */

    const getUnit = useCallback(
        async (id) => {
            if (!id) {
                const validationError =
                    normalizeError(
                        {
                            status: false,
                            code: 400,
                            message:
                                "Unit ID is required.",
                            errors: null,
                        },
                        "Unit ID is required."
                    );

                setError(
                    validationError
                );

                throw validationError;
            }

            setLoadingUnit(true);
            setError(null);

            try {
                const response =
                    await fetchUnit(id);

                const payload =
                    response ?? {};

                const result =
                    payload?.unit ??
                    payload?.data ??
                    payload;

                const normalizedUnit =
                    normalizeUnit(
                        result
                    );

                if (
                    mountedRef.current
                ) {
                    setUnit(
                        normalizedUnit
                    );
                }

                return normalizedUnit;
            } catch (err) {
                const normalizedError =
                    normalizeError(
                        err,
                        "Failed to fetch unit."
                    );

                console.error(
                    "FETCH UNIT ERROR:",
                    normalizedError
                );

                if (
                    mountedRef.current
                ) {
                    setError(
                        normalizedError
                    );
                }

                throw normalizedError;
            } finally {
                if (
                    mountedRef.current
                ) {
                    setLoadingUnit(
                        false
                    );
                }
            }
        },
        [
            normalizeError,
            normalizeUnit,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | CREATE UNIT
    |--------------------------------------------------------------------------
    */

    const addUnit = useCallback(
        async (data = {}) => {
            setCreating(true);
            setError(null);

            try {
                const response =
                    await createUnit(
                        data
                    );

                const payload =
                    response ?? {};

                const createdUnit =
                    payload?.unit ??
                    payload?.data ??
                    payload;

                const normalizedUnit =
                    normalizeUnit(
                        createdUnit
                    );

                if (
                    normalizedUnit?.id &&
                    mountedRef.current
                ) {
                    setUnits(
                        (current) => [
                            normalizedUnit,
                            ...current,
                        ]
                    );
                }

                return normalizedUnit;
            } catch (err) {
                const normalizedError =
                    normalizeError(
                        err,
                        "Failed to create unit."
                    );

                console.error(
                    "CREATE UNIT ERROR:",
                    normalizedError
                );

                if (
                    mountedRef.current
                ) {
                    setError(
                        normalizedError
                    );
                }

                throw normalizedError;
            } finally {
                if (
                    mountedRef.current
                ) {
                    setCreating(
                        false
                    );
                }
            }
        },
        [
            normalizeError,
            normalizeUnit,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | UPDATE UNIT
    |--------------------------------------------------------------------------
    */

    const editUnit = useCallback(
        async (
            id,
            data = {}
        ) => {
            if (!id) {
                const validationError =
                    normalizeError(
                        {
                            status: false,
                            code: 400,
                            message:
                                "Unit ID is required.",
                            errors: null,
                        },
                        "Unit ID is required."
                    );

                setError(
                    validationError
                );

                throw validationError;
            }

            setUpdating(true);
            setError(null);

            try {
                const response =
                    await updateUnit(
                        id,
                        data
                    );

                const payload =
                    response ?? {};

                const updatedUnit =
                    payload?.unit ??
                    payload?.data ??
                    payload;

                const normalizedUnit =
                    normalizeUnit(
                        updatedUnit
                    );

                if (
                    normalizedUnit?.id &&
                    mountedRef.current
                ) {
                    setUnits(
                        (current) =>
                            current.map(
                                (item) =>
                                    String(
                                        item.id
                                    ) ===
                                    String(
                                        normalizedUnit.id
                                    )
                                        ? {
                                              ...item,
                                              ...normalizedUnit,
                                          }
                                        : item
                            )
                    );

                    setUnit(
                        (current) =>
                            current &&
                            String(
                                current.id
                            ) ===
                                String(
                                    normalizedUnit.id
                                )
                                ? {
                                      ...current,
                                      ...normalizedUnit,
                                  }
                                : current
                    );
                }

                return normalizedUnit;
            } catch (err) {
                const normalizedError =
                    normalizeError(
                        err,
                        "Failed to update unit."
                    );

                console.error(
                    "UPDATE UNIT ERROR:",
                    normalizedError
                );

                if (
                    mountedRef.current
                ) {
                    setError(
                        normalizedError
                    );
                }

                throw normalizedError;
            } finally {
                if (
                    mountedRef.current
                ) {
                    setUpdating(
                        false
                    );
                }
            }
        },
        [
            normalizeError,
            normalizeUnit,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | DELETE UNIT
    |--------------------------------------------------------------------------
    */

    const removeUnit = useCallback(
        async (id) => {
            if (!id) {
                const validationError =
                    normalizeError(
                        {
                            status: false,
                            code: 400,
                            message:
                                "Unit ID is required.",
                            errors: null,
                        },
                        "Unit ID is required."
                    );

                setError(
                    validationError
                );

                throw validationError;
            }

            setDeleting(true);
            setError(null);

            try {
                const response =
                    await deleteUnit(
                        id
                    );

                if (
                    mountedRef.current
                ) {
                    setUnits(
                        (current) =>
                            current.filter(
                                (item) =>
                                    String(
                                        item.id
                                    ) !==
                                    String(id)
                            )
                    );

                    setUnit(
                        (current) =>
                            current &&
                            String(
                                current.id
                            ) ===
                                String(id)
                                ? null
                                : current
                    );
                }

                return response;
            } catch (err) {
                const normalizedError =
                    normalizeError(
                        err,
                        "Failed to delete unit."
                    );

                console.error(
                    "DELETE UNIT ERROR:",
                    normalizedError
                );

                if (
                    mountedRef.current
                ) {
                    setError(
                        normalizedError
                    );
                }

                throw normalizedError;
            } finally {
                if (
                    mountedRef.current
                ) {
                    setDeleting(
                        false
                    );
                }
            }
        },
        [normalizeError]
    );

    /*
    |--------------------------------------------------------------------------
    | UPDATE UNIT STATUS
    |--------------------------------------------------------------------------
    */

    const changeUnitStatus =
        useCallback(
            async (
                id,
                status
            ) => {
                if (!id) {
                    const validationError =
                        normalizeError(
                            {
                                status: false,
                                code: 400,
                                message:
                                    "Unit ID is required.",
                                errors: null,
                            },
                            "Unit ID is required."
                        );

                    setError(
                        validationError
                    );

                    throw validationError;
                }

                if (
                    status ===
                        null ||
                    status ===
                        undefined ||
                    status === ""
                ) {
                    const validationError =
                        normalizeError(
                            {
                                status: false,
                                code: 400,
                                message:
                                    "Unit status is required.",
                                errors: null,
                            },
                            "Unit status is required."
                        );

                    setError(
                        validationError
                    );

                    throw validationError;
                }

                setError(null);

                try {
                    const response =
                        await updateUnitStatus(
                            id,
                            status
                        );

                    const payload =
                        response ?? {};

                    const updatedUnit =
                        payload?.unit ??
                        payload?.data ??
                        payload;

                    /*
                    |--------------------------------------------------------------------------
                    | Backend returned complete unit
                    |--------------------------------------------------------------------------
                    */

                    if (
                        updatedUnit &&
                        typeof updatedUnit ===
                            "object" &&
                        updatedUnit.id
                    ) {
                        const normalizedUnit =
                            normalizeUnit(
                                updatedUnit
                            );

                        if (
                            mountedRef.current
                        ) {
                            setUnits(
                                (current) =>
                                    current.map(
                                        (item) =>
                                            String(
                                                item.id
                                            ) ===
                                            String(
                                                id
                                            )
                                                ? {
                                                      ...item,
                                                      ...normalizedUnit,
                                                  }
                                                : item
                                    )
                            );

                            setUnit(
                                (current) =>
                                    current &&
                                    String(
                                        current.id
                                    ) ===
                                        String(
                                            id
                                        )
                                        ? {
                                              ...current,
                                              ...normalizedUnit,
                                          }
                                        : current
                            );
                        }

                        return normalizedUnit;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Backend returned status only
                    |--------------------------------------------------------------------------
                    */

                    const normalizedStatus =
                        normalizeStatus(
                            status
                        );

                    if (
                        mountedRef.current
                    ) {
                        setUnits(
                            (current) =>
                                current.map(
                                    (item) =>
                                        String(
                                            item.id
                                        ) ===
                                        String(
                                            id
                                        )
                                            ? {
                                                  ...item,
                                                  status:
                                                      normalizedStatus,
                                              }
                                            : item
                                )
                        );

                        setUnit(
                            (current) =>
                                current &&
                                String(
                                    current.id
                                ) ===
                                    String(
                                        id
                                    )
                                    ? {
                                          ...current,
                                          status:
                                              normalizedStatus,
                                      }
                                    : current
                        );
                    }

                    return normalizedStatus;
                } catch (err) {
                    const normalizedError =
                        normalizeError(
                            err,
                            "Failed to update unit status."
                        );

                    console.error(
                        "UPDATE UNIT STATUS ERROR:",
                        normalizedError
                    );

                    if (
                        mountedRef.current
                    ) {
                        setError(
                            normalizedError
                        );
                    }

                    throw normalizedError;
                }
            },
            [
                normalizeError,
                normalizeStatus,
                normalizeUnit,
            ]
        );

    /*
    |--------------------------------------------------------------------------
    | CHECK UNIT AVAILABILITY
    |--------------------------------------------------------------------------
    */

    const getUnitAvailability =
        useCallback(
            async (id) => {
                if (!id) {
                    const validationError =
                        normalizeError(
                            {
                                status: false,
                                code: 400,
                                message:
                                    "Unit ID is required.",
                                errors: null,
                            },
                            "Unit ID is required."
                        );

                    setError(
                        validationError
                    );

                    throw validationError;
                }

                setCheckingAvailability(
                    true
                );

                setError(null);

                try {
                    const response =
                        await checkUnitAvailability(
                            id
                        );

                    return (
                        response ?? {}
                    );
                } catch (err) {
                    const normalizedError =
                        normalizeError(
                            err,
                            "Failed to check unit availability."
                        );

                    console.error(
                        "CHECK UNIT AVAILABILITY ERROR:",
                        normalizedError
                    );

                    if (
                        mountedRef.current
                    ) {
                        setError(
                            normalizedError
                        );
                    }

                    throw normalizedError;
                } finally {
                    if (
                        mountedRef.current
                    ) {
                        setCheckingAvailability(
                            false
                        );
                    }
                }
            },
            [normalizeError]
        );

    /*
    |--------------------------------------------------------------------------
    | CLEAR ERROR
    |--------------------------------------------------------------------------
    */

    const clearError =
        useCallback(() => {
            setError(null);
        }, []);

    /*
    |--------------------------------------------------------------------------
    | CLEAR UNIT
    |--------------------------------------------------------------------------
    */

    const clearUnit =
        useCallback(() => {
            setUnit(null);
        }, []);

    /*
    |--------------------------------------------------------------------------
    | REFRESH UNITS
    |--------------------------------------------------------------------------
    */

    const refreshUnits =
        useCallback(
            async (params = {}) => {
                /*
                |----------------------------------------------------------------------
                | Allow refresh even if previous request finished.
                |----------------------------------------------------------------------
                */

                fetchingRef.current =
                    false;

                return getUnits(
                    params
                );
            },
            [getUnits]
        );

    /*
    |--------------------------------------------------------------------------
    | AUTO FETCH
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | UnitList should NOT call getUnits() again on mount when autoFetch=true.
    |
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!autoFetch) {
            return undefined;
        }

        let active = true;

        const loadUnits =
            async () => {
                try {
                    await getUnits(
                        initialParamsRef.current
                    );
                } catch (err) {
                    if (
                        active
                    ) {
                        console.error(
                            "AUTO FETCH UNITS ERROR:",
                            err
                        );
                    }
                }
            };

        loadUnits();

        return () => {
            active = false;
        };
    }, [
        autoFetch,
        getUnits,
    ]);

    /*
    |--------------------------------------------------------------------------
    | COMPUTED STATS
    |--------------------------------------------------------------------------
    */

    const stats = useMemo(() => {
        return units.reduce(
            (acc, item) => {
                acc.total += 1;

                const rawStatus =
                    item?.status?.value ??
                    item?.status?.current ??
                    item?.status ??
                    "unknown";

                const normalizedStatus =
                    String(
                        rawStatus
                    )
                        .trim()
                        .toLowerCase()
                        .replace(
                            /[\s-]+/g,
                            "_"
                        );

                switch (
                    normalizedStatus
                ) {
                    case "vacant":
                        acc.vacant += 1;
                        break;

                    case "occupied":
                        acc.occupied += 1;
                        break;

                    case "reserved":
                        acc.reserved += 1;
                        break;

                    case "maintenance":
                        acc.maintenance += 1;
                        break;

                    case "inactive":
                        acc.inactive += 1;
                        break;

                    case "available":
                        acc.available += 1;
                        break;

                    case "unavailable":
                        acc.unavailable += 1;
                        break;

                    default:
                        acc.unknown += 1;
                        break;
                }

                return acc;
            },
            {
                total: 0,
                vacant: 0,
                occupied: 0,
                reserved: 0,
                maintenance: 0,
                inactive: 0,
                available: 0,
                unavailable: 0,
                unknown: 0,
            }
        );
    }, [units]);

    /*
    |--------------------------------------------------------------------------
    | RETURN
    |--------------------------------------------------------------------------
    */

    return {
        /*
        |--------------------------------------------------------------------------
        | Data
        |--------------------------------------------------------------------------
        */

        units,
        unit,
        stats,

        /*
        |--------------------------------------------------------------------------
        | Loading
        |--------------------------------------------------------------------------
        */

        loading,
        loadingUnit,
        creating,
        updating,
        deleting,
        checkingAvailability,

        /*
        |--------------------------------------------------------------------------
        | Error
        |--------------------------------------------------------------------------
        */

        error,

        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */

        pagination,

        /*
        |--------------------------------------------------------------------------
        | CRUD
        |--------------------------------------------------------------------------
        */

        getUnits,
        getUnit,
        addUnit,
        editUnit,
        removeUnit,

        /*
        |--------------------------------------------------------------------------
        | Status
        |--------------------------------------------------------------------------
        */

        changeUnitStatus,

        /*
        |--------------------------------------------------------------------------
        | Availability
        |--------------------------------------------------------------------------
        */

        getUnitAvailability,

        /*
        |--------------------------------------------------------------------------
        | Utilities
        |--------------------------------------------------------------------------
        */

        refreshUnits,
        clearError,
        clearUnit,

        /*
        |--------------------------------------------------------------------------
        | Backward Compatible Aliases
        |--------------------------------------------------------------------------
        */

        createUnit: addUnit,
        updateUnit: editUnit,
        deleteUnit: removeUnit,
    };
};

export default useUnit;